import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { createDefaultState } from './state.js';
import { deepMerge, getPresetByName } from './presets.js';
import { createUi } from './ui.js';
import { createUnitCardGeometry, createUnitDiscGeometry } from './discGeometry.js';
import { generateDistribution, distributionBounds } from './distributions.js';
import { applyCollisionPolicy } from './collision.js';
import { buildInstanceScales, createInstancedDisks, updateInstancedMatrices } from './instancing.js';
import { exportHighResPng } from './exportPng.js';
import { createToast } from './dom.js';

function downloadJson(filename, obj) {
  const text = JSON.stringify(obj, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function createJsonFilePicker({ accept = '.json,application/json', onJson }) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      onJson?.(json, file.name);
    } catch (e) {
      onJson?.({ __error: String(e) }, file.name);
    }
  });

  return {
    open() {
      input.click();
    },
    destroy() {
      input.remove();
    },
  };
}

export function boot() {
  const canvas = document.querySelector('#c');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas #c not found');

  const toast = createToast();

  const state = createDefaultState();
  // Apply default preset immediately
  deepMerge(state, getPresetByName(state.preset).state);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(state.render.background, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 2000);
  camera.position.set(18, 14, 18);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(state.camera?.targetX ?? 0, state.camera?.targetY ?? 0, state.camera?.targetZ ?? 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(6, 10, 4);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // Geometry + instancing
  let geometry = createUnitDiscGeometry(state.disc.segments);
  let geometryKey = 'disc';
  let inst = createInstancedDisks(geometry, 1);
  scene.add(inst.group);

  let items = [];
  let bounds = null;
  let scales = [];
  let radii = new Float32Array(0);

  let dirty = true;
  let requestFrame = true;

  function applyCameraFromState() {
    const c = state.camera;
    if (!c) return;
    controls.target.set(c.targetX ?? 0, c.targetY ?? 0, c.targetZ ?? 0);
    const az = THREE.MathUtils.degToRad(c.azimuthDeg ?? 0);
    const pol = THREE.MathUtils.degToRad(c.polarDeg ?? 60);
    const dist = Math.max(0.01, c.distance ?? 30);

    // OrbitControls usa coordenadas esféricas em torno do target:
    // x = r * sin(phi) * sin(theta)
    // y = r * cos(phi)
    // z = r * sin(phi) * cos(theta)
    const sinPhi = Math.sin(pol);
    const offset = new THREE.Vector3(
      dist * sinPhi * Math.sin(az),
      dist * Math.cos(pol),
      dist * sinPhi * Math.cos(az),
    );
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
  }

  function captureCameraToState() {
    const c = state.camera;
    if (!c) return;
    c.targetX = controls.target.x;
    c.targetY = controls.target.y;
    c.targetZ = controls.target.z;
    c.azimuthDeg = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
    c.polarDeg = THREE.MathUtils.radToDeg(controls.getPolarAngle());
    c.distance = camera.position.distanceTo(controls.target);
  }

  function rebuild() {
    dirty = false;

    // renderer background
    renderer.setClearColor(state.render.background, 1);

    // rebuild geometry if object/quality changed
    const objType = state.object?.type ?? 'coin';
    if (objType === 'card') {
      const seg = Math.max(1, Math.floor(state.card.segments));
      const cr = Math.max(0, Math.min(0.49, (state.card.cornerRadius ?? 0.06)));
      const key = `card:${seg}:${cr.toFixed(4)}`;
      if (geometryKey !== key) {
        geometry.dispose?.();
        // cornerRadius in unit space: we interpret `cornerRadius` as fraction of min(width,height)
        // but since geometry is unit and we scale per-instance, using the fraction directly is stable.
        geometry = createUnitCardGeometry(cr, seg);
        geometryKey = key;
        inst.solid.geometry = geometry;
        inst.outline.geometry = geometry;
      }
    } else {
      const seg = Math.max(6, Math.floor(state.disc.segments));
      const key = `disc:${seg}`;
      if (geometryKey !== key) {
        geometry.dispose?.();
        geometry = createUnitDiscGeometry(seg);
        geometryKey = key;
        inst.solid.geometry = geometry;
        inst.outline.geometry = geometry;
      }
    }

    items = generateDistribution(state);
    bounds = distributionBounds(items);

    const need = items.length;
    if (need > inst.capacity) {
      scene.remove(inst.group);
      inst.solid.material.dispose?.();
      inst.outline.material.dispose?.();
      inst = createInstancedDisks(geometry, need);
      scene.add(inst.group);
    }

    const built = buildInstanceScales(state, need);
    scales = built.scales;
    radii = built.radii;

    const colResult = applyCollisionPolicy(items, radii, state);
    if (colResult.overlapsRemaining) toast('Ainda há overlaps (ajuste espaçamento/iteração).', 2200);

    updateInstancedMatrices(inst, items, bounds, state, camera, scales);

    // Se solicitado, enquadra a composição para voltar a aparecer.
    if (requestFrame && bounds) {
      frameComposition();
      requestFrame = false;
    } else {
      // Mantém target/ângulos consistentes com o state
      applyCameraFromState();
    }
  }

  function onAnyChange() {
    dirty = true;
  }

  function frameComposition() {
    const c = state.camera;
    if (!c || !bounds) return;
    const t = state.transform;
    const scale = Math.max(1e-6, t.scale ?? 1);
    const extra =
      (state.object?.type === 'card')
        ? (Math.max(state.card.width ?? 1.586, state.card.height ?? 1) * 0.75)
        : ((state.disc.diameter ?? 1) * 0.75);
    const r = Math.max(0.5, bounds.radius * scale + extra);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = (r / Math.sin(Math.max(1e-3, fov * 0.5))) * 1.15;
    c.azimuthDeg = 45;
    c.polarDeg = 55;
    c.distance = dist;
    c.targetX = t.positionX ?? 0;
    c.targetY = t.positionY ?? 0;
    c.targetZ = t.positionZ ?? 0;
    applyCameraFromState();
  }

  function applyPreset(name) {
    const preset = getPresetByName(name);
    state.preset = preset.name;
    deepMerge(state, preset.state);
    ui.setPreset?.(preset.name);
    dirty = true;
    requestFrame = true;
    toast(`Preset: ${preset.name}`);
  }

  async function doExport() {
    await exportHighResPng({
      renderer,
      scene,
      camera,
      scale: state.export.scale,
      filename: state.export.filename,
      transparent: !!state.render.transparentExport,
      toast,
    });
  }

  function savePreset() {
    const name = window.prompt('Nome do preset', `${state.preset} (custom)`);
    if (!name) return;
    // Snapshot do estado atual (sem funções)
    const snapshot = JSON.parse(JSON.stringify(state));
    snapshot.preset = name;
    downloadJson(`${name}.json`, { name, state: snapshot });
    toast(`Preset salvo: ${name}.json`);
  }

  const picker = createJsonFilePicker({
    onJson: (json, filename) => {
      if (json?.__error) {
        toast(`Falha ao ler JSON: ${filename}`);
        return;
      }
      // Aceita: { name, state } ou um objeto de state direto
      const incomingState = json?.state && typeof json.state === 'object' ? json.state : json;
      const name = (json?.name && typeof json.name === 'string') ? json.name : (incomingState?.preset ?? filename);
      state.preset = name;
      deepMerge(state, incomingState);
      ui.setPreset?.(name);
      dirty = true;
      requestFrame = true;
      toast(`Preset carregado: ${name}`);
    },
  });

  function loadPreset() {
    picker.open();
  }

  const ui = createUi({
    state,
    onAnyChange: (tag) => {
      if (tag === '__cameraFrame__') {
        requestFrame = true;
        dirty = true;
        return;
      }
      onAnyChange();
    },
    onApplyPreset: applyPreset,
    onExport: doExport,
    onSavePreset: savePreset,
    onLoadPreset: loadPreset,
    onCameraCapture: () => {
      captureCameraToState();
      dirty = true;
      toast('Câmera capturada no preset atual.');
    },
    onCameraReset: () => {
      state.camera.azimuthDeg = 45;
      state.camera.polarDeg = 55;
      state.camera.distance = 30;
      state.camera.targetX = 0;
      state.camera.targetY = 0;
      state.camera.targetZ = 0;
      requestFrame = true;
      dirty = true;
      toast('Câmera resetada.');
    },
  });

  // initial build
  rebuild();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = Math.max(1e-6, w / Math.max(1, h));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', () => {
    resize();
    dirty = true;
  });
  resize();

  let lastUiSyncMs = 0;
  renderer.setAnimationLoop(() => {
    controls.update();
    // Se o usuário arrasta, mantém sliders sincronizados (opcional)
    if (state.camera?.syncFromOrbit) {
      captureCameraToState();
      const now = performance.now();
      if (now - lastUiSyncMs > 60) {
        ui.refresh?.();
        lastUiSyncMs = now;
      }
    }
    if (dirty) rebuild();
    renderer.render(scene, camera);
  });
}

