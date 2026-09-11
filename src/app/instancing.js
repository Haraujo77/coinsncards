import * as THREE from 'three';
import { ObjectType, OrientationMode } from './state.js';
import { computeStaggerWeight } from './stagger.js';
import { createRng } from './math.js';
import { estimateBoxBoundingSphereRadius, estimateDiscBoundingSphereRadius } from './collision.js';

const _m = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _look = new THREE.Matrix4();
const _zAxis = new THREE.Vector3(0, 0, 1);
const _yAxis = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _col = new THREE.Color();

function directionOrFallback(dir, fallback) {
  const l2 = dir.lengthSq();
  if (l2 < 1e-12) return fallback.clone().normalize();
  return dir.multiplyScalar(1 / Math.sqrt(l2));
}

function axisVec(axis) {
  if (axis === 'x') return new THREE.Vector3(1, 0, 0);
  if (axis === 'z') return new THREE.Vector3(0, 0, 1);
  return new THREE.Vector3(0, 1, 0);
}

function discOrientationQuaternion(item, state, camera) {
  const o = state.orientation;
  const mode = o.mode;
  const normal = item.normal;

  // Base: disc's local Y axis is its normal (since CylinderGeometry is along Y)
  // Build a look-at matrix mapping +Y to desired normal and +Z to something stable.
  const targetNormal = normal.clone().normalize();
  let forward;

  switch (mode) {
    case OrientationMode.TO_CAMERA: {
      _fwd.copy(camera.position).sub(item.pos);
      forward = directionOrFallback(_fwd, item.tangent);
      // For a disc, "forward" isn't perfect; we map normal to camera dir.
      _look.lookAt(new THREE.Vector3(0, 0, 0), forward, _yAxis);
      _q.setFromRotationMatrix(_look);
      break;
    }
    case OrientationMode.TO_CENTER: {
      _fwd.copy(item.pos).multiplyScalar(-1);
      forward = directionOrFallback(_fwd, item.tangent);
      _look.lookAt(new THREE.Vector3(0, 0, 0), forward, _yAxis);
      _q.setFromRotationMatrix(_look);
      break;
    }
    case OrientationMode.OUT_FROM_CENTER: {
      _fwd.copy(item.pos);
      forward = directionOrFallback(_fwd, item.tangent);
      _look.lookAt(new THREE.Vector3(0, 0, 0), forward, _yAxis);
      _q.setFromRotationMatrix(_look);
      break;
    }
    case OrientationMode.TANGENT: {
      forward = item.tangent.clone().normalize();
      _look.lookAt(new THREE.Vector3(0, 0, 0), forward, _yAxis);
      _q.setFromRotationMatrix(_look);
      break;
    }
    case OrientationMode.SHAPE_NORMAL: {
      _look.lookAt(new THREE.Vector3(0, 0, 0), targetNormal, _yAxis);
      _q.setFromRotationMatrix(_look);
      break;
    }
    case OrientationMode.FIXED:
    default:
      _q.identity();
      break;
  }

  // Extra local rotation
  _q2.setFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(o.extraRotX ?? 0),
      THREE.MathUtils.degToRad(o.extraRotY ?? 0),
      THREE.MathUtils.degToRad(o.extraRotZ ?? 0),
      'XYZ',
    ),
  );
  _q.multiply(_q2);

  // World-up yaw: turns the piece without tipping it onto a corner.
  const yaw = THREE.MathUtils.degToRad(o.yawDeg ?? 0);
  if (yaw !== 0) {
    _q2.setFromAxisAngle(_yAxis, yaw);
    _q.premultiply(_q2);
  }
  return _q;
}

export function createInstancedDisks(geometry, capacity) {
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
  });
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });

  const solid = new THREE.InstancedMesh(geometry, solidMat, Math.max(1, capacity));
  const outline = new THREE.InstancedMesh(geometry, wireMat, Math.max(1, capacity));
  solid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  outline.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  solid.frustumCulled = false;
  outline.frustumCulled = false;

  const group = new THREE.Group();
  group.add(solid);
  group.add(outline);

  return { group, solid, outline, solidMat, wireMat, capacity };
}

export function ensureCapacity(inst, needed) {
  if (needed <= inst.capacity) return inst;
  // Caller should recreate if needed; keep it simple for now.
  return inst;
}

export function buildInstanceScales(state, count) {
  const rng = createRng(state.distribution.seed ?? 1);
  const scales = new Array(count);
  const radii = new Float32Array(count);
  const type = state.object?.type ?? ObjectType.COIN;

  for (let i = 0; i < count; i++) {
    if (type === ObjectType.CARD) {
      const card = state.card;
      let w = card.width;
      let h = card.height;
      let th = card.thickness;
      if (card.varyEnabled) {
        w *= 1 + (rng() * 2 - 1) * (card.varyWidth ?? 0);
        h *= 1 + (rng() * 2 - 1) * (card.varyHeight ?? 0);
        th *= 1 + (rng() * 2 - 1) * (card.varyThickness ?? 0);
      }
      const sx = Math.max(1e-6, w);
      const sy = Math.max(1e-6, th);
      const sz = Math.max(1e-6, h);
      scales[i] = { sx, sy, sz };
      radii[i] = estimateBoxBoundingSphereRadius(w, h, th);
    } else if (type === ObjectType.ICON) {
      const icon = state.icon;
      let size = icon.size ?? 1;
      let th = icon.thickness ?? 0.12;
      if (icon.varyEnabled) {
        size *= 1 + (rng() * 2 - 1) * (icon.varySize ?? 0);
        th *= 1 + (rng() * 2 - 1) * (icon.varyThickness ?? 0);
      }
      const sx = Math.max(1e-6, size);
      const sy = Math.max(1e-6, th);
      const sz = Math.max(1e-6, size);
      scales[i] = { sx, sy, sz };
      radii[i] = estimateBoxBoundingSphereRadius(size, size, th);
    } else {
      const disc = state.disc;
      let dia = disc.diameter;
      let th = disc.thickness;
      if (disc.varyEnabled) {
        dia *= 1 + (rng() * 2 - 1) * (disc.varyDiameter ?? 0);
        th *= 1 + (rng() * 2 - 1) * (disc.varyThickness ?? 0);
      }
      const sx = Math.max(1e-6, dia);
      const sy = Math.max(1e-6, th);
      const sz = Math.max(1e-6, dia);
      scales[i] = { sx, sy, sz };
      radii[i] = estimateDiscBoundingSphereRadius(dia, th);
    }
  }
  return { scales, radii };
}

export function updateInstancedMatrices(inst, items, bounds, state, camera, scales) {
  const t = state.transform;
  const disc = state.disc;

  const globalEuler = new THREE.Euler(
    THREE.MathUtils.degToRad(t.rotX ?? 0),
    THREE.MathUtils.degToRad(t.rotY ?? 0),
    THREE.MathUtils.degToRad(t.rotZ ?? 0),
    'XYZ',
  );
  const globalQ = new THREE.Quaternion().setFromEuler(globalEuler);
  const globalS = new THREE.Vector3(t.scale ?? 1, t.scale ?? 1, t.scale ?? 1);
  const globalP = new THREE.Vector3(t.positionX ?? 0, t.positionY ?? 0, t.positionZ ?? 0);

  const staggerAxis = axisVec(state.stagger.axis ?? 'y');
  const staggerAmount = THREE.MathUtils.degToRad(state.stagger.amountDeg ?? 0);

  const n = items.length;
  inst.solid.count = n;
  inst.outline.count = n;
  inst.solid.visible = !!state.render.solid;
  inst.outline.visible = !!state.render.outline;
  inst.wireMat.wireframe = !!state.render.outlineWireframe;

  for (let i = 0; i < n; i++) {
    const item = items[i];
    const w = computeStaggerWeight(item, items, bounds, state);
    const qBase = discOrientationQuaternion(item, state, camera).clone();

    // Stagger rotation around chosen axis (local or world-ish). Apply after orientation.
    if (state.stagger.enabled && staggerAmount !== 0) {
      _q2.setFromAxisAngle(staggerAxis, staggerAmount * w);
      qBase.multiply(_q2);
    }

    // Per-instance scale: unit disc scaled to diameter/thickness
    const sc = scales?.[i] ?? { sx: disc.diameter, sy: disc.thickness, sz: disc.diameter };
    const hs = (item.heroScale ?? 1) * (item.itemScale ?? 1);
    _s.set(sc.sx * hs, sc.sy * hs, sc.sz * hs);

    if (item.itemRotX || item.itemRotY || item.itemRotZ) {
      _q2.setFromEuler(
        new THREE.Euler(
          THREE.MathUtils.degToRad(item.itemRotX ?? 0),
          THREE.MathUtils.degToRad(item.itemRotY ?? 0),
          THREE.MathUtils.degToRad(item.itemRotZ ?? 0),
          'XYZ',
        ),
      );
      qBase.multiply(_q2);
    }

    _pos.copy(item.pos).multiply(globalS).applyQuaternion(globalQ).add(globalP);
    _q.copy(qBase).premultiply(globalQ);

    _m.compose(_pos, _q, _s.multiply(globalS));
    inst.solid.setMatrixAt(i, _m);
    inst.outline.setMatrixAt(i, _m);
  }

  inst.solid.instanceMatrix.needsUpdate = true;
  inst.outline.instanceMatrix.needsUpdate = true;
  paintInstanceColors(inst, items);
}

function paintInstanceColors(inst, items) {
  let painted = false;
  for (const it of items) {
    if (it.itemColor != null) {
      painted = true;
      break;
    }
  }
  if (!painted && !inst.solid.instanceColor) return;
  for (let i = 0; i < items.length; i++) {
    _col.set(items[i].itemColor ?? 0xffffff);
    inst.solid.setColorAt(i, _col);
  }
  if (inst.solid.instanceColor) inst.solid.instanceColor.needsUpdate = true;
}

