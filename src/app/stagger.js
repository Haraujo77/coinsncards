import * as THREE from 'three';
import { StaggerCurve, StaggerSource } from './state.js';
import { clamp01, smoothstep01, easeIn, easeOut, easeInOut, valueNoise3 } from './math.js';

function applyCurve(t, curve) {
  switch (curve) {
    case StaggerCurve.SMOOTHSTEP:
      return smoothstep01(t);
    case StaggerCurve.EASE_IN:
      return easeIn(t);
    case StaggerCurve.EASE_OUT:
      return easeOut(t);
    case StaggerCurve.EASE_IN_OUT:
      return easeInOut(t);
    case StaggerCurve.LINEAR:
    default:
      return clamp01(t);
  }
}

export function computeStaggerWeight(item, items, bounds, state) {
  const s = state.stagger;
  if (!s.enabled) return 0;

  const src = s.source;
  const pos = item.pos;
  const size = bounds.size;
  const center = bounds.center;

  const nx = size.x <= 1e-6 ? 0 : (pos.x - center.x) / (size.x * 0.5);
  const ny = size.y <= 1e-6 ? 0 : (pos.y - center.y) / (size.y * 0.5);
  const nz = size.z <= 1e-6 ? 0 : (pos.z - center.z) / (size.z * 0.5);

  const gx = clamp01((nx + 1) * 0.5);
  const gy = clamp01((ny + 1) * 0.5);
  const gz = clamp01((nz + 1) * 0.5);

  let t = 0;
  switch (src) {
    case StaggerSource.INDEX:
      t = items.length <= 1 ? 0 : item.i / (items.length - 1);
      break;
    case StaggerSource.U:
      t = item.u ?? 0;
      break;
    case StaggerSource.ROW: {
      const maxRow = Math.max(1, ...items.map((it) => it.row));
      t = maxRow <= 0 ? 0 : item.row / maxRow;
      break;
    }
    case StaggerSource.COL: {
      const maxCol = Math.max(1, ...items.map((it) => it.col));
      t = maxCol <= 0 ? 0 : item.col / maxCol;
      break;
    }
    case StaggerSource.LAYER: {
      const maxLayer = Math.max(1, ...items.map((it) => it.layer));
      t = maxLayer <= 0 ? 0 : item.layer / maxLayer;
      break;
    }
    case StaggerSource.DIST_CENTER: {
      const dist = pos.length();
      t = bounds.radius <= 1e-6 ? 0 : clamp01(dist / bounds.radius);
      break;
    }
    case StaggerSource.GRADIENT_X:
      t = gx;
      break;
    case StaggerSource.GRADIENT_Y:
      t = gy;
      break;
    case StaggerSource.GRADIENT_Z:
      t = gz;
      break;
    case StaggerSource.RADIAL: {
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      const maxR = Math.max(1e-6, Math.sqrt((size.x * 0.5) ** 2 + (size.z * 0.5) ** 2));
      t = clamp01(dist / maxR);
      break;
    }
    case StaggerSource.NOISE: {
      const ns = Math.max(1e-6, s.noiseScale);
      const n = valueNoise3(pos.x * ns, pos.y * ns, pos.z * ns, state.distribution.seed ?? 1);
      t = clamp01(n * (s.noiseStrength ?? 1));
      break;
    }
    case StaggerSource.SINE: {
      const f = s.sineFreq ?? 1;
      const ph = s.sinePhase ?? 0;
      // sine over XZ radial distance
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      const x = dist / Math.max(1e-6, bounds.radius);
      t = 0.5 + 0.5 * Math.sin((x * Math.PI * 2 * f) + THREE.MathUtils.degToRad(ph));
      break;
    }
    default:
      t = 0;
  }

  // Falloff curve
  t = Math.pow(clamp01(t), Math.max(1e-6, s.falloff ?? 1));
  t = applyCurve(t, s.curve);

  return t * (s.direction ?? 1);
}

