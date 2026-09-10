import * as THREE from 'three';
import { DistributionType, FillMode, LoopShape } from './state.js';
import { clamp01, createRng } from './math.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function makeItem(i, pos, normal, tangent, row = 0, col = 0, layer = 0, u = 0, v = 0, w = 0) {
  return { i, pos: pos.clone(), normal: normal.clone(), tangent: tangent.clone(), row, col, layer, u, v, w };
}

export function generateDistribution(state) {
  const d = state.distribution;
  switch (d.type) {
    case DistributionType.GRID:
      return genGrid(state);
    case DistributionType.SQUARE:
      return genGrid(state);
    case DistributionType.DIAMOND:
      return genDiamond(state);
    case DistributionType.CIRCLE:
      return genCircle(state);
    case DistributionType.RING:
      return genRing(state);
    case DistributionType.LOOP:
      return genLoop(state);
    case DistributionType.COLUMN:
      return genColumn(state);
    case DistributionType.CAROUSEL:
      return genCarousel(state);
    case DistributionType.COVERFLOW:
      return genCoverflow(state);
    case DistributionType.FAN:
      return genFan(state);
    case DistributionType.HAND_FAN:
      return genHandFan(state);
    case DistributionType.DIAGONAL_ROW:
      return genDiagonalRow(state);
    case DistributionType.WAVE_ROW:
      return genWaveRow(state);
    case DistributionType.ISO_GRID:
      return genIsoGrid(state);
    case DistributionType.CUBE:
      return genCube(state);
    case DistributionType.SPHERE:
      return genSphere(state, false);
    case DistributionType.SPHERE_SHELL:
      return genSphere(state, true);
    case DistributionType.SPIRAL:
      return genSpiral(state);
    case DistributionType.CYLINDER:
      return genCylinder(state);
    case DistributionType.TORUS:
      return genTorus(state);
    default:
      return genGrid(state);
  }
}

function genColumn(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.columnCount ?? d.count ?? 12));
  const sp = Math.max(1e-6, d.columnSpacing ?? 1);
  const axis = d.columnAxis ?? 'y';
  const centered = d.columnCentered ?? true;
  const c = centered ? (n - 1) * 0.5 : 0;

  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const v = (i - c) * sp;
    let pos;
    let row = 0, col = 0, layer = 0;
    if (axis === 'x') {
      pos = new THREE.Vector3(v, 0, 0);
      col = i;
    } else if (axis === 'z') {
      pos = new THREE.Vector3(0, 0, v);
      layer = i;
    } else {
      pos = new THREE.Vector3(0, v, 0);
      row = i;
    }
    const normal = new THREE.Vector3(0, 1, 0);
    const tangent = axis === 'x'
      ? new THREE.Vector3(1, 0, 0)
      : axis === 'z'
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
    items.push(makeItem(i, pos, normal, tangent, row, col, layer, t, 0, 0));
  }
  return items;
}

/** Circular carousel in XZ — icons/cards around a ring, facing in or out. */
function genCarousel(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.carouselCount ?? d.count ?? 16));
  const r0 = Math.max(1e-6, d.carouselRadius ?? d.radius ?? 6);
  const y0 = d.carouselY ?? 0;
  const faceOut = d.carouselFaceOut !== false;
  const ringsY = Math.max(1, Math.floor(d.carouselRings ?? 1));
  const ringSpacing = d.carouselRingSpacing ?? 2.2;
  const phaseStep = THREE.MathUtils.degToRad(d.carouselRingPhaseDeg ?? 0);
  const nested = Math.max(1, Math.floor(d.carouselNested ?? 1));
  const nestedGap = d.carouselNestedGap ?? 2.4;
  const items = [];
  let i = 0;

  for (let nest = 0; nest < nested; nest++) {
    const r = r0 + nest * nestedGap;
    for (let ring = 0; ring < ringsY; ring++) {
      const y = y0 + ring * ringSpacing;
      const phase = ring * phaseStep + nest * phaseStep;
      for (let k = 0; k < n; k++) {
        const t = n === 1 ? 0 : k / n;
        const a = t * Math.PI * 2 + phase;
        const cx = Math.cos(a);
        const cz = Math.sin(a);
        const pos = new THREE.Vector3(cx * r, y, cz * r);
        const radial = new THREE.Vector3(cx, 0, cz).normalize();
        const normal = faceOut ? radial.clone() : radial.clone().multiplyScalar(-1);
        const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();
        const v = ringsY === 1 ? 0 : ring / (ringsY - 1);
        const w = nested === 1 ? 0 : nest / (nested - 1);
        items.push(makeItem(i, pos, normal, tangent, ring, k, nest, t, v, w));
        i++;
      }
    }
  }
  return items;
}

/** Coverflow-style arc facing +Z (viewer). */
function genCoverflow(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.coverflowCount ?? d.count ?? 12));
  const r = Math.max(1e-6, d.coverflowRadius ?? 8);
  const spread = THREE.MathUtils.degToRad(d.coverflowSpreadDeg ?? 110);
  const items = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = -spread * 0.5 + t * spread;
    // Arc centered on +Z so the middle item faces the camera
    const x = Math.sin(a) * r;
    const z = -Math.cos(a) * r + r;
    const pos = new THREE.Vector3(x, 0, z);
    // Face toward origin-ish (viewer along +Z looking at origin)
    const normal = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();
    const tangent = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

/**
 * Vertical fan / stepped deck (marketplace hero stack).
 * Items layered in Y with slight Z depth so the front card reads clearly.
 */
function genFan(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.fanCount ?? d.count ?? 10));
  const sp = Math.max(1e-6, d.fanSpacing ?? 0.55);
  const depth = d.fanDepth ?? 0.18;
  const c = (n - 1) * 0.5;
  const items = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    // Center index is closest to camera (lower Z)
    const fromCenter = i - c;
    const pos = new THREE.Vector3(0, fromCenter * sp, Math.abs(fromCenter) * depth);
    const normal = new THREE.Vector3(0, 0, 1);
    const tangent = new THREE.Vector3(1, 0, 0);
    items.push(makeItem(i, pos, normal, tangent, i, 0, 0, t, 0, 0));
  }
  return items;
}

/**
 * Hand-of-cards / edge fan: tiles on a tight arc in XZ, each facing along the radius.
 * Camera from one end reads as a receding stack of faces (Pinterest / Cosmos card spread).
 */
function genHandFan(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.fanCount ?? d.coverflowCount ?? 12));
  const r = Math.max(1e-6, d.fanRadius ?? d.coverflowRadius ?? 3.4);
  const spread = THREE.MathUtils.degToRad(d.fanSpreadDeg ?? d.coverflowSpreadDeg ?? 72);
  const items = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = -spread * 0.5 + t * spread;
    const x = Math.sin(a) * r;
    const z = (1 - Math.cos(a)) * r;
    const pos = new THREE.Vector3(x, 0, z);
    const normal = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)).normalize();
    const tangent = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  applyHeroLift(items, d);
  return items;
}

/** Diagonal shelf / row for marketplace browsing. */
function genDiagonalRow(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.rowCount ?? d.count ?? 12));
  const sp = Math.max(1e-6, d.rowSpacing ?? 1.35);
  const ang = THREE.MathUtils.degToRad(d.rowAngleDeg ?? 35);
  const tilt = THREE.MathUtils.degToRad(d.rowTiltDeg ?? 12);
  const dir = new THREE.Vector3(Math.cos(ang), Math.sin(tilt) * 0.35, Math.sin(ang)).normalize();
  const c = (n - 1) * 0.5;
  const items = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const pos = dir.clone().multiplyScalar((i - c) * sp);
    const normal = new THREE.Vector3(0, 0, 1);
    const tangent = dir.clone();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  applyHeroLift(items, d);
  return items;
}

function applyHeroLift(items, d) {
  const peak = d.heroLift ?? 0;
  if (!(peak > 0) || items.length === 0) return;
  const idx = Math.max(0, Math.min(items.length - 1, Math.floor(d.heroIndex ?? (items.length * 0.5))));
  // Onda = how many tiles on each side rise with the hero (0 = only the hero).
  const radius = Math.max(0, d.waveAmplitude ?? 0);
  const n = items.length;

  for (let i = 0; i < n; i++) {
    const dist = Math.abs(i - idx);
    let w = 0;
    if (dist === 0) {
      w = 1;
    } else if (radius > 1e-6 && dist < radius) {
      w = 0.5 * (1 + Math.cos((Math.PI * dist) / radius));
    }
    if (w > 1e-6) items[i].pos.y += peak * w;
  }
}

/** Horizontal row with sine wave lift — soft marketplace parade. */
function genWaveRow(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.rowCount ?? d.count ?? 12));
  const sp = Math.max(1e-6, d.rowSpacing ?? 1.35);
  const amp = d.waveAmplitude ?? 1.2;
  const wl = Math.max(0.1, d.waveLength ?? 1.0);
  const c = (n - 1) * 0.5;
  const items = [];

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = (i - c) * sp;
    const y = Math.sin(t * Math.PI * 2 * wl) * amp;
    const pos = new THREE.Vector3(x, y, 0);
    const normal = new THREE.Vector3(0, 0, 1);
    const tangent = new THREE.Vector3(1, 0, 0);
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  applyHeroLift(items, d);
  return items;
}

/**
 * Staggered isometric floor grid: tiles stand on XZ, brick-offset rows,
 * all facing the same direction (like a marketplace field of slabs).
 */
function genIsoGrid(state) {
  const d = state.distribution;
  const nx = Math.max(1, Math.floor(d.isoCountX ?? 5));
  const nz = Math.max(1, Math.floor(d.isoCountZ ?? 4));
  const sx = Math.max(1e-6, d.isoSpacingX ?? 2.4);
  const sz = Math.max(1e-6, d.isoSpacingZ ?? 2.6);
  const rowOff = d.isoRowOffset ?? 0.5;
  const cx = (nx - 1) * 0.5;
  const cz = (nz - 1) * 0.5;
  const items = [];
  let i = 0;

  for (let z = 0; z < nz; z++) {
    const brick = (z % 2 === 0 ? 0 : rowOff) * sx;
    const centerFix = rowOff * sx * 0.5;
    for (let x = 0; x < nx; x++) {
      const px = (x - cx) * sx + brick - centerFix;
      const pz = (z - cz) * sz;
      const pos = new THREE.Vector3(px, 0, pz);
      const normal = new THREE.Vector3(0, 0, 1);
      const tangent = new THREE.Vector3(1, 0, 0);
      const u = nx === 1 ? 0.5 : x / (nx - 1);
      const w = nz === 1 ? 0.5 : z / (nz - 1);
      items.push(makeItem(i, pos, normal, tangent, z, x, 0, u, 0, w));
      i++;
    }
  }
  return items;
}

function centeredIndex(n) {
  return (n - 1) * 0.5;
}

function genGrid(state) {
  const d = state.distribution;
  const nx = Math.max(1, Math.floor(d.countX));
  const ny = Math.max(1, Math.floor(d.countY));
  const nz = Math.max(1, Math.floor(d.countZ));
  const cx = centeredIndex(nx);
  const cy = centeredIndex(ny);
  const cz = centeredIndex(nz);

  const items = [];
  let i = 0;
  for (let y = 0; y < ny; y++) {
    for (let z = 0; z < nz; z++) {
      for (let x = 0; x < nx; x++) {
        const alt = d.alternateOffset ? ((x + z + y) % 2 === 0 ? 1 : -1) : 1;
        const ox = d.offsetXPerRow * (z - cz) * alt;
        const oy = d.offsetYPerLayer * (y - cy) * alt;
        const oz = d.offsetZPerCol * (x - cx) * alt;

        const px = (x - cx) * d.spacingX + ox;
        const py = (y - cy) * d.spacingY + oy;
        const pz = (z - cz) * d.spacingZ + oz;

        const u = nx === 1 ? 0.5 : x / (nx - 1);
        const v = ny === 1 ? 0.5 : y / (ny - 1);
        const w = nz === 1 ? 0.5 : z / (nz - 1);

        const pos = new THREE.Vector3(px, py, pz);
        const normal = new THREE.Vector3(0, 1, 0);
        const tangent = new THREE.Vector3(1, 0, 0);
        items.push(makeItem(i++, pos, normal, tangent, y, x, z, u, v, w));
      }
    }
  }
  return items;
}

function genDiamond(state) {
  // Diamond projection of a grid on XZ: rotate by 45° and optionally offset rows.
  const d = state.distribution;
  const base = genGrid({ ...state, distribution: { ...d, type: DistributionType.GRID, countY: 1 } });
  const rot = new THREE.Matrix4().makeRotationY(Math.PI / 4);
  for (const it of base) {
    it.pos.applyMatrix4(rot);
    it.normal.set(0, 1, 0);
    it.tangent.set(1, 0, 0);
  }
  return base;
}

function genCircle(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const r = Math.max(0.0001, d.radius);
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / n;
    const a = t * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    const normal = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3(-Math.sin(a) * r, 0, Math.cos(a) * r).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

/**
 * Loop fechado no plano XZ. `loopWidth` / `loopDepth` = meia-extensão em X e Z (elipse ou caixa envolvente dos polígonos).
 * Tangente = direção ao longo do perímetro (compatível com orientação TANGENT).
 */
function genLoop(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const w = Math.max(1e-6, d.loopWidth ?? d.radius);
  const depth = Math.max(1e-6, d.loopDepth ?? d.radius);
  const shape = d.loopShape ?? LoopShape.CIRCLE;

  if (shape === LoopShape.CIRCLE) {
    const useRadius = d.loopUseRadius ?? true;
    const rx = useRadius ? Math.max(1e-6, d.radius ?? w) : w;
    const rz = useRadius ? Math.max(1e-6, d.radius ?? depth) : depth;
    const items = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / n;
      const a = t * Math.PI * 2;
      const pos = new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz);
      const normal = new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3(-Math.sin(a) * rx, 0, Math.cos(a) * rz).normalize();
      items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
    }
    return items;
  }

  const verts2 = getLoopPolygonVertices(shape, w, depth, d);
  return sampleClosedPolygonLoop(verts2, n, Math.min(0.49, Math.max(0, d.cornerBlend ?? 0.15)));
}

/** Vértices 2D no plano XZ, ordem CCY visto de +Y (anti-horário). */
function getLoopPolygonVertices(shape, w, depth, d) {
  switch (shape) {
    case LoopShape.SQUARE:
      return [
        { x: w, z: depth },
        { x: w, z: -depth },
        { x: -w, z: -depth },
        { x: -w, z: depth },
      ];
    case LoopShape.DIAMOND:
      return [
        { x: w, z: 0 },
        { x: 0, z: depth },
        { x: -w, z: 0 },
        { x: 0, z: -depth },
      ];
    case LoopShape.HEXAGON: {
      const out = [];
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 6;
        out.push({ x: w * Math.cos(a), z: depth * Math.sin(a) });
      }
      return out;
    }
    case LoopShape.TRIANGLE: {
      const out = [];
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
        out.push({ x: w * Math.cos(a), z: depth * Math.sin(a) });
      }
      return out;
    }
    case LoopShape.STAR: {
      const spikes = Math.max(3, Math.floor(d.starPoints ?? 5));
      const ir = clamp01(d.starInnerRatio ?? 0.42);
      const verts = [];
      for (let k = 0; k < spikes; k++) {
        const aOut = -Math.PI / 2 + (k * Math.PI * 2) / spikes;
        const aIn = aOut + Math.PI / spikes;
        verts.push({ x: w * Math.cos(aOut), z: depth * Math.sin(aOut) });
        verts.push({
          x: w * ir * Math.cos(aIn),
          z: depth * ir * Math.sin(aIn),
        });
      }
      return verts;
    }
    default:
      return getLoopPolygonVertices(LoopShape.SQUARE, w, depth, d);
  }
}

function wrapPi(a) {
  // Wrap angle to [-PI, PI]
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
}

function lerpAngle(a, b, t) {
  const d = wrapPi(b - a);
  return a + d * t;
}

function slerpDir2(ax, az, bx, bz, t) {
  const a0 = Math.atan2(az, ax);
  const b0 = Math.atan2(bz, bx);
  const a = lerpAngle(a0, b0, t);
  return { x: Math.cos(a), z: Math.sin(a) };
}

function sampleClosedPolygonLoop(verts2, n, cornerBlend = 0.15) {
  const m = verts2.length;
  if (m < 2) return [];

  const segLens = [];
  const segDir = [];
  let perimeter = 0;
  for (let i = 0; i < m; i++) {
    const a = verts2[i];
    const b = verts2[(i + 1) % m];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    segLens.push(len);
    perimeter += len;
    if (len > 1e-9) segDir.push({ x: dx / len, z: dz / len });
    else segDir.push({ x: 1, z: 0 });
  }
  if (perimeter < 1e-9) return [];

  const blend = Math.min(0.49, Math.max(0, cornerBlend));
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / n;
    let dist = t * perimeter;
    let si = 0;
    while (si < m && dist > segLens[si] + 1e-9) {
      dist -= segLens[si];
      si++;
    }
    if (si >= m) si = m - 1;
    const a = verts2[si];
    const b = verts2[(si + 1) % m];
    const L = Math.max(1e-9, segLens[si]);
    const u = L > 1e-9 ? dist / L : 0;
    const x = THREE.MathUtils.lerp(a.x, b.x, u);
    const z = THREE.MathUtils.lerp(a.z, b.z, u);
    const pos = new THREE.Vector3(x, 0, z);
    const normal = new THREE.Vector3(0, 1, 0);
    // Tangente suavizada em cantos: interpola direção do segmento anterior/atual/próximo.
    const prev = (si - 1 + m) % m;
    const next = (si + 1) % m;
    const dPrev = segDir[prev];
    const dCurr = segDir[si];
    const dNext = segDir[next];

    let tx = dCurr.x;
    let tz = dCurr.z;
    if (blend > 0 && u < blend) {
      const tt = u / blend;
      const v = slerpDir2(dPrev.x, dPrev.z, dCurr.x, dCurr.z, tt);
      tx = v.x;
      tz = v.z;
    } else if (blend > 0 && u > 1 - blend) {
      const tt = (u - (1 - blend)) / blend;
      const v = slerpDir2(dCurr.x, dCurr.z, dNext.x, dNext.z, tt);
      tx = v.x;
      tz = v.z;
    }
    const tangent = new THREE.Vector3(tx, 0, tz).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

function genRing(state) {
  // "Ring" = 2D annulus (fill or outline)
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const r0 = Math.max(0.0001, Math.min(d.radius, d.innerRadius));
  const r1 = Math.max(r0 + 0.0001, Math.max(d.radius, d.innerRadius));
  const items = [];
  const rng = createRng(d.seed ?? 1);

  if (d.fillMode === FillMode.OUTLINE) {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / n;
      const a = t * Math.PI * 2;
      const pos = new THREE.Vector3(Math.cos(a) * r1, 0, Math.sin(a) * r1);
      const normal = new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();
      items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
    }
    return items;
  }

  // Fill: sample uniformly in area
  for (let i = 0; i < n; i++) {
    const u = rng();
    const v = rng();
    const rr = Math.sqrt(THREE.MathUtils.lerp(r0 * r0, r1 * r1, u));
    const a = v * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    const normal = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, u, v, 0));
  }
  return items;
}

function genCube(state) {
  const d = state.distribution;
  return genGrid({ ...state, distribution: { ...d, type: DistributionType.GRID } });
}

function genSphere(state, shell) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const R = Math.max(0.0001, d.sphereRadius);
  const shellT = Math.max(0.0001, d.shellThickness);
  const rng = createRng(d.seed ?? 1);
  const items = [];

  // Fibonacci sphere
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const y = 1 - 2 * t;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * phi;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    const normal = new THREE.Vector3(x, y, z).normalize();

    const rr = shell ? (R + (rng() * 2 - 1) * (shellT * 0.5)) : (rng() ** (1 / 3)) * R;
    const pos = normal.clone().multiplyScalar(rr);

    if (d.jitter > 0) {
      pos.x += (rng() * 2 - 1) * d.jitter;
      pos.y += (rng() * 2 - 1) * d.jitter;
      pos.z += (rng() * 2 - 1) * d.jitter;
    }

    const tangent = _v.copy(_up).cross(normal).lengthSq() < 1e-6
      ? _v.set(1, 0, 0)
      : _v.copy(_up).cross(normal).normalize();

    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

function genSpiral(state) {
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const r = Math.max(0.0001, d.radius);
  const h = d.height;
  const turns = Math.max(0.0001, d.turns);
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const a = t * Math.PI * 2 * turns;
    const rr = r;
    const y = (t - 0.5) * h;
    const pos = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);

    const tangent = new THREE.Vector3(-Math.sin(a), (h / Math.max(1, n - 1)) * turns, Math.cos(a)).normalize();
    const normal = _v2.copy(pos).setY(0).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

function genCylinder(state) {
  // Helix-like "tube" distribution around Y
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const r = Math.max(0.0001, d.radius);
  const h = d.height;
  const turns = Math.max(0.0001, d.turns);
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const a = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * h;
    const pos = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const tangent = new THREE.Vector3(-Math.sin(a), h / Math.max(1e-6, (n - 1)), Math.cos(a)).normalize();
    const normal = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).normalize();
    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, t, 0, 0));
  }
  return items;
}

function genTorus(state) {
  // Major radius = radius, minor radius = innerRadius
  const d = state.distribution;
  const n = Math.max(1, Math.floor(d.count));
  const R = Math.max(0.0001, d.radius);
  const r = Math.max(0.0001, d.innerRadius);
  const rng = createRng(d.seed ?? 1);
  const items = [];

  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / n;
    const a = u * Math.PI * 2;
    const b = rng() * Math.PI * 2;
    const x = (R + r * Math.cos(b)) * Math.cos(a);
    const z = (R + r * Math.cos(b)) * Math.sin(a);
    const y = r * Math.sin(b);
    const pos = new THREE.Vector3(x, y, z);

    const center = new THREE.Vector3(R * Math.cos(a), 0, R * Math.sin(a));
    const normal = pos.clone().sub(center).normalize();
    const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).normalize();

    if (d.jitter > 0) {
      pos.x += (rng() * 2 - 1) * d.jitter;
      pos.y += (rng() * 2 - 1) * d.jitter;
      pos.z += (rng() * 2 - 1) * d.jitter;
    }

    items.push(makeItem(i, pos, normal, tangent, 0, i, 0, u, 0, 0));
  }
  return items;
}

export function distributionBounds(items) {
  const box = new THREE.Box3();
  for (const it of items) box.expandByPoint(it.pos);
  if (!isFinite(box.min.x)) box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const radius = size.length() * 0.5;
  return { box, size, center, radius: Math.max(1e-6, radius) };
}

export function normalizeItemPositions(items) {
  const { center } = distributionBounds(items);
  for (const it of items) it.pos.sub(center);
  return items;
}

