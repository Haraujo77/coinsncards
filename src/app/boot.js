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
  canvas.tabIndex = 0;

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

  // Space + drag moves the composition in screen space; camera stays put.
  const _panRight = new THREE.Vector3();
  const _panUp = new THREE.Vector3();
  const _panFwd = new THREE.Vector3();
  const spacePan = {
    down: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };
  let lastUiSyncMs = 0;

  function isTypingTarget(el) {
    if (!el || !(el instanceof Element)) return false;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return type !== 'button' && type !== 'checkbox' && type !== 'radio' && type !== 'submit';
    }
    return !!el.closest?.('[contenteditable="true"]');
  }

  function setSpacePan(active) {
    spacePan.down = active;
    if (!active) spacePan.dragging = false;
    controls.enabled = !active;
    canvas.style.cursor = active ? 'grab' : '';
  }

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    if (isTypingTarget(document.activeElement)) return;
    e.preventDefault();
    setSpacePan(true);
  });
  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    if (spacePan.down || spacePan.dragging) e.preventDefault();
    setSpacePan(false);
  });
  window.addEventListener('blur', () => setSpacePan(false));

  canvas.addEventListener('pointerdown', (e) => {
    if (!spacePan.down || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    spacePan.dragging = true;
    spacePan.lastX = e.clientX;
    spacePan.lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic / already captured */ }
    canvas.style.cursor = 'grabbing';
    skipOrbitSync = true;
  }, { capture: true });

  canvas.addEventListener('pointermove', (e) => {
    if (!spacePan.dragging) return;
    e.preventDefault();
    const dx = e.clientX - spacePan.lastX;
    const dy = e.clientY - spacePan.lastY;
    spacePan.lastX = e.clientX;
    spacePan.lastY = e.clientY;
    if (dx === 0 && dy === 0) return;

    camera.getWorldDirection(_panFwd);
    _panRight.crossVectors(_panFwd, camera.up);
    if (_panRight.lengthSq() < 1e-10) _panRight.set(1, 0, 0);
    else _panRight.normalize();
    _panUp.crossVectors(_panRight, _panFwd).normalize();

    const dist = Math.max(0.01, camera.position.distanceTo(controls.target));
    const worldPerPx = (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5))
      / Math.max(1, canvas.clientHeight);
    const t = state.transform;
    t.positionX = (t.positionX ?? 0) + (_panRight.x * dx + _panUp.x * -dy) * worldPerPx;
    t.positionY = (t.positionY ?? 0) + (_panRight.y * dx + _panUp.y * -dy) * worldPerPx;
    t.positionZ = (t.positionZ ?? 0) + (_panRight.z * dx + _panUp.z * -dy) * worldPerPx;

    skipOrbitSync = true;
    if (items.length) updateInstancedMatrices(inst, items, bounds, state, camera, scales);
    const now = performance.now();
    if (now - lastUiSyncMs > 60) {
      ui.refresh?.();
      lastUiSyncMs = now;
    }
  }, { capture: true });

  function endSpaceDrag(e) {
    if (!spacePan.dragging) return;
    spacePan.dragging = false;
    canvas.style.cursor = spacePan.down ? 'grab' : '';
    if (e?.pointerId != null) {
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
    ui.refresh?.();
  }
  canvas.addEventListener('pointerup', endSpaceDrag, { capture: true });
  canvas.addEventListener('pointercancel', endSpaceDrag, { capture: true });

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
  let skipOrbitSync = false;

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
    if (!Number.isFinite(offset.x + offset.y + offset.z)) return;
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
    if (objType === 'card' || objType === 'icon') {
      const src = objType === 'icon' ? state.icon : state.card;
      const seg = Math.max(1, Math.floor(src.segments ?? 6));
      const cr = Math.max(0, Math.min(0.49, (src.cornerRadius ?? (objType === 'icon' ? 0.22 : 0.06))));
      const key = `${objType}:${seg}:${cr.toFixed(4)}`;
      if (geometryKey !== key) {
        geometry.dispose?.();
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
    } else if (!spacePan.dragging) {
      // Mantém target/ângulos consistentes com o state
      applyCameraFromState();
    }
    renderer.render(scene, camera);
  }

  function onAnyChange() {
    dirty = true;
  }

  function frameComposition() {
    const c = state.camera;
    if (!c || !bounds) return;
    if (c.lockFraming) {
      applyCameraFromState();
      return;
    }
    const t = state.transform;
    const scale = Math.max(1e-6, t.scale ?? 1);
    const extra =
      (state.object?.type === 'card')
        ? (Math.max(state.card.width ?? 1.586, state.card.height ?? 1) * 0.75)
        : (state.object?.type === 'icon')
          ? ((state.icon.size ?? 1) * 0.85)
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
    requestFrame = !preset.state.camera;
    skipOrbitSync = true;
    rebuild();
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
      requestFrame = !incomingState?.camera;
      skipOrbitSync = true;
      rebuild();
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

  // Apply the named default preset after the canvas has a real size,
  // so OrbitControls does not produce a NaN camera on a 0×0 viewport.
  {
    const preset = getPresetByName(state.preset);
    deepMerge(state, preset.state);
    ui.setPreset?.(preset.name);
    skipOrbitSync = true;
    requestFrame = !preset.state.camera;
    rebuild();
  }

  renderer.setAnimationLoop(() => {
    const sceneDragging = spacePan.down || spacePan.dragging;
    if (!sceneDragging) controls.update();
    // Se o usuário arrasta, mantém sliders sincronizados (opcional)
    if (state.camera?.syncFromOrbit && !skipOrbitSync && !sceneDragging) {
      captureCameraToState();
      const now = performance.now();
      if (now - lastUiSyncMs > 60) {
        ui.refresh?.();
        lastUiSyncMs = now;
      }
    }
    if (!sceneDragging) skipOrbitSync = false;
    if (dirty) rebuild();
    renderer.render(scene, camera);
  });
}

