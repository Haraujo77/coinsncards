import * as THREE from 'three';
import { CollisionMode } from './state.js';

const _delta = new THREE.Vector3();
const _push = new THREE.Vector3();

function cellKey(ix, iy, iz) {
  return `${ix},${iy},${iz}`;
}

function buildSpatialHash(items, cellSize) {
  const inv = 1 / Math.max(1e-6, cellSize);
  const map = new Map();
  for (let i = 0; i < items.length; i++) {
    const p = items[i].pos;
    const ix = Math.floor(p.x * inv);
    const iy = Math.floor(p.y * inv);
    const iz = Math.floor(p.z * inv);
    const key = cellKey(ix, iy, iz);
    let arr = map.get(key);
    if (!arr) {
      arr = [];
      map.set(key, arr);
    }
    arr.push(i);
  }
  return { map, inv };
}

function forNeighborCells(ix, iy, iz, fn) {
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        fn(ix + dx, iy + dy, iz + dz);
      }
    }
  }
}

export function estimateDiscBoundingSphereRadius(diameter, thickness) {
  const r = Math.max(1e-6, diameter * 0.5);
  const t = Math.max(1e-6, thickness * 0.5);
  return Math.sqrt(r * r + t * t);
}

export function estimateBoxBoundingSphereRadius(width, height, thickness) {
  const hx = Math.max(1e-6, width * 0.5);
  const hy = Math.max(1e-6, thickness * 0.5);
  const hz = Math.max(1e-6, height * 0.5);
  return Math.sqrt(hx * hx + hy * hy + hz * hz);
}

export function detectAnyOverlap(items, radii, padding = 0, cellSize = 1) {
  const { map, inv } = buildSpatialHash(items, cellSize);
  for (let a = 0; a < items.length; a++) {
    const pa = items[a].pos;
    const ra = radii[a] + padding;
    const ix = Math.floor(pa.x * inv);
    const iy = Math.floor(pa.y * inv);
    const iz = Math.floor(pa.z * inv);

    let hasOverlap = false;
    forNeighborCells(ix, iy, iz, (cx, cy, cz) => {
      if (hasOverlap) return;
      const arr = map.get(cellKey(cx, cy, cz));
      if (!arr) return;
      for (const b of arr) {
        if (b <= a) continue;
        const pb = items[b].pos;
        const rb = radii[b] + padding;
        const minD = ra + rb;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dz = pb.z - pa.z;
        if (dx * dx + dy * dy + dz * dz < minD * minD) {
          hasOverlap = true;
          return;
        }
      }
    });
    if (hasOverlap) return true;
  }
  return false;
}

export function resolveOverlaps(items, radii, opts) {
  const {
    iterations = 8,
    padding = 0,
    cellSize = 1,
    maxPush = 0.5,
  } = opts ?? {};

  const n = items.length;
  if (n <= 1) return { moved: 0, overlapsRemaining: false };

  let moved = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const { map, inv } = buildSpatialHash(items, cellSize);
    let any = false;

    for (let a = 0; a < n; a++) {
      const pa = items[a].pos;
      const ra = radii[a] + padding;
      const ix = Math.floor(pa.x * inv);
      const iy = Math.floor(pa.y * inv);
      const iz = Math.floor(pa.z * inv);

      forNeighborCells(ix, iy, iz, (cx, cy, cz) => {
        const arr = map.get(cellKey(cx, cy, cz));
        if (!arr) return;
        for (const b of arr) {
          if (b <= a) continue;
          const pb = items[b].pos;
          const rb = radii[b] + padding;

          _delta.copy(pb).sub(pa);
          const dist = _delta.length();
          const minDist = ra + rb;
          if (dist < minDist && dist > 1e-9) {
            any = true;
            const overlap = minDist - dist;
            const push = Math.min(maxPush, overlap * 0.5);
            _push.copy(_delta).multiplyScalar(push / dist);
            pb.add(_push);
            pa.sub(_push);
            moved += 2;
          } else if (dist <= 1e-9) {
            any = true;
            // Perfect overlap: nudge deterministically by index
            const s = (a * 73856093) ^ (b * 19349663);
            const ang = (s % 360) * (Math.PI / 180);
            _push.set(Math.cos(ang), 0.2, Math.sin(ang)).normalize().multiplyScalar(Math.min(maxPush, minDist * 0.25));
            pb.add(_push);
            pa.sub(_push);
            moved += 2;
          }
        }
      });
    }

    if (!any) break;
  }

  const overlapsRemaining = detectAnyOverlap(items, radii, padding, cellSize);
  return { moved, overlapsRemaining };
}

export function applyCollisionPolicy(items, radii, state) {
  const c = state.collision;
  if (!c || c.mode === CollisionMode.OFF) return { changed: false, overlapsRemaining: false, strategy: 'off' };

  if (c.mode === CollisionMode.RESOLVE) {
    const out = resolveOverlaps(items, radii, c);
    return { changed: out.moved > 0, overlapsRemaining: out.overlapsRemaining, strategy: 'resolve' };
  }

  // PREVENT: attempt to scale outwards (like increasing spacing) without changing topology.
  const hasOverlap = detectAnyOverlap(items, radii, c.padding, c.cellSize);
  if (!hasOverlap) return { changed: false, overlapsRemaining: false, strategy: 'prevent' };
  if (!c.autoIncreaseSpacing) return { changed: false, overlapsRemaining: true, strategy: 'prevent' };

  const maxFactor = Math.max(1.0, c.maxAutoSpacingFactor ?? 2.0);
  let factor = 1.0;
  let ok = false;
  // Exponential search up to maxFactor
  for (let k = 0; k < 8; k++) {
    factor = Math.min(maxFactor, factor * 1.12);
    for (const it of items) it.pos.multiplyScalar(factor);
    ok = !detectAnyOverlap(items, radii, c.padding, c.cellSize);
    if (ok) break;
  }

  return { changed: factor !== 1.0, overlapsRemaining: !ok, strategy: 'prevent-scale' };
}

