const KEY = 'studio-preset-defaults';
const LAST = 'studio-preset';

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

export function getPresetOverride(name) {
  const map = readMap();
  const patch = map[name];
  return patch && typeof patch === 'object' ? patch : null;
}

export function hasPresetOverride(name) {
  return !!getPresetOverride(name);
}

export function savePresetOverride(name, state) {
  const map = readMap();
  const snap = snapshotState(state);
  delete snap.preset;
  map[name] = snap;
  writeMap(map);
  rememberPreset(name);
}

export function clearPresetOverride(name) {
  const map = readMap();
  delete map[name];
  writeMap(map);
}
