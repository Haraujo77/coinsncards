export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep01(t) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

export function easeIn(t) {
  t = clamp01(t);
  return t * t;
}

export function easeOut(t) {
  t = clamp01(t);
  return 1 - (1 - t) * (1 - t);
}

export function easeInOut(t) {
  t = clamp01(t);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Deterministic PRNG (Mulberry32)
export function createRng(seed) {
  let a = (seed | 0) >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash3i(x, y, z, seed = 0) {
  // Fast integer hash to [0,1)
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 374761393) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296);
}

export function valueNoise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smoothstep01(xf), v = smoothstep01(yf), w = smoothstep01(zf);

  const n000 = hash3i(xi, yi, zi, seed);
  const n100 = hash3i(xi + 1, yi, zi, seed);
  const n010 = hash3i(xi, yi + 1, zi, seed);
  const n110 = hash3i(xi + 1, yi + 1, zi, seed);
  const n001 = hash3i(xi, yi, zi + 1, seed);
  const n101 = hash3i(xi + 1, yi, zi + 1, seed);
  const n011 = hash3i(xi, yi + 1, zi + 1, seed);
  const n111 = hash3i(xi + 1, yi + 1, zi + 1, seed);

  const x00 = lerp(n000, n100, u);
  const x10 = lerp(n010, n110, u);
  const x01 = lerp(n001, n101, u);
  const x11 = lerp(n011, n111, u);
  const y0 = lerp(x00, x10, v);
  const y1 = lerp(x01, x11, v);
  return lerp(y0, y1, w);
}

