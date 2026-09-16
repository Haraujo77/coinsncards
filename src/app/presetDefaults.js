import bundled from './shippedDefaults.json';

const KEY = 'studio-preset-defaults';
const LAST = 'studio-preset';
const REMOTE_URL = 'https://raw.githubusercontent.com/Haraujo77/coinsncards/main/src/app/shippedDefaults.json';
const SHIP_URL = `${import.meta.env.BASE_URL}__studio/preset-defaults`;

let shipped = { ...bundled };

function readMap() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function snapshotState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function rememberPreset(name) {
  try {
    localStorage.setItem(LAST, name);
  } catch {
    /* ignore */
  }
}

export function lastPreset() {
  try {
    return localStorage.getItem(LAST) || '';
  } catch {
    return '';
  }
}

export function getShipped(name) {
  const patch = shipped[name];
  return patch && typeof patch === 'object' ? patch : null;
}

export function getPresetOverride(name) {
  const map = readMap();
  const patch = map[name];
  return patch && typeof patch === 'object' ? patch : null;
}

export function hasPresetOverride(name) {
  return !!getShipped(name) || !!getPresetOverride(name);
}

export async function hydrateShippedDefaults() {
  if (import.meta.env.DEV) return;
  try {
    const res = await fetch(REMOTE_URL, { cache: 'no-store' });
    if (!res.ok) return;
    const remote = await res.json();
    if (remote && typeof remote === 'object') shipped = { ...shipped, ...remote };
  } catch {
    /* bundled defaults still apply */
  }
}

async function persistShipped(method, payload) {
  try {
    const res = await fetch(SHIP_URL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { published: false };
    return await res.json();
  } catch {
    return { published: false };
  }
}

export async function savePresetOverride(name, state) {
  const map = readMap();
  const snap = snapshotState(state);
  delete snap.preset;
  map[name] = snap;
  writeMap(map);
  rememberPreset(name);
  shipped = { ...shipped, [name]: snap };
  const result = await persistShipped('POST', { name, state: snap });
  return { published: !!result?.published };
}

export async function clearPresetOverride(name) {
  const map = readMap();
  delete map[name];
  writeMap(map);
  const next = { ...shipped };
  delete next[name];
  shipped = next;
  const result = await persistShipped('DELETE', { name });
  return { published: !!result?.published };
}
