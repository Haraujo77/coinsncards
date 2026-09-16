import {
  CollisionMode,
  DistributionType,
  FillMode,
  LoopShape,
  ObjectType,
  OrientationMode,
  StaggerSource,
} from '@/app/state.js';
import { listPresetNames } from '@/app/presets.js';

export type ParamKind = 'number' | 'boolean' | 'select' | 'color';

export type ParamDef = {
  key: string;
  label: string;
  kind?: ParamKind;
  min?: number;
  max?: number;
  step?: number;
  value?: number | string | boolean;
  options?: { label: string; value: string }[];
  fmt?: (v: number) => string;
  hint?: string;
  show?: (state: any) => boolean;
};

export type ParamGroup = {
  id: string;
  label: string;
  defaultOpen?: boolean;
  params: ParamDef[];
};

const x2 = (v: number) => v.toFixed(2);
const x1 = (v: number) => v.toFixed(1);
const deg = (v: number) => `${Math.round(v)}°`;

const D = DistributionType;
const obj = (type: string) => (s: any) => s.object?.type === type;
const dist =
  (...types: string[]) =>
  (s: any) =>
    types.includes(s.distribution?.type);

function options(entries: [string, string][]) {
  return entries.map(([value, label]) => ({ value, label }));
}

export const PARAM_GROUPS: ParamGroup[] = [
  {
    id: 'scene',
    label: 'Scene',
    defaultOpen: true,
    params: [
      { key: 'preset', label: 'Preset', kind: 'select', options: listPresetNames().map((n) => ({ label: n, value: n })), hint: 'Applies the look immediately.' },
      { key: 'render.background', label: 'Background', kind: 'color', hint: 'Artboard clear colour — this is the prototype, not the chrome.' },
      { key: 'render.solid', label: 'Fill', kind: 'boolean' },
      { key: 'render.outline', label: 'Outline', kind: 'boolean' },
    ],
  },
  {
    id: 'piece',
    label: 'Object',
    defaultOpen: true,
    params: [
      {
        key: 'object.type',
        label: 'Type',
        kind: 'select',
        options: [
          { label: 'Coin', value: ObjectType.COIN },
          { label: 'Card', value: ObjectType.CARD },
          { label: 'Icon', value: ObjectType.ICON },
        ],
      },
      { key: 'disc.diameter', label: 'Diameter', min: 0.1, max: 8, step: 0.01, value: 1, fmt: x2, show: obj(ObjectType.COIN) },
      { key: 'disc.thickness', label: 'Thickness', min: 0.01, max: 2, step: 0.005, value: 0.08, fmt: x2, show: obj(ObjectType.COIN) },
      { key: 'disc.segments', label: 'Segments', min: 6, max: 128, step: 1, value: 48, show: obj(ObjectType.COIN) },
      { key: 'card.width', label: 'Width', min: 0.2, max: 10, step: 0.001, value: 1.586, fmt: x2, show: obj(ObjectType.CARD) },
      { key: 'card.height', label: 'Height', min: 0.2, max: 10, step: 0.001, value: 1, fmt: x2, show: obj(ObjectType.CARD) },
      { key: 'card.thickness', label: 'Thickness', min: 0.001, max: 1, step: 0.001, value: 0.03, fmt: x2, show: obj(ObjectType.CARD) },
      { key: 'card.cornerRadius', label: 'Corners', min: 0, max: 0.49, step: 0.005, value: 0.06, fmt: x2, show: obj(ObjectType.CARD) },
      { key: 'icon.size', label: 'Size', min: 0.2, max: 8, step: 0.01, value: 1, fmt: x2, show: obj(ObjectType.ICON) },
      { key: 'icon.thickness', label: 'Thickness', min: 0.01, max: 1, step: 0.005, value: 0.12, fmt: x2, show: obj(ObjectType.ICON) },
      { key: 'icon.cornerRadius', label: 'Corners', min: 0, max: 0.49, step: 0.005, value: 0.22, fmt: x2, show: obj(ObjectType.ICON) },
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    defaultOpen: true,
    params: [
      {
        key: 'distribution.type',
        label: 'Pattern',
        kind: 'select',
        options: [
          { label: 'Loop', value: D.LOOP },
          { label: 'Column', value: D.COLUMN },
          { label: 'Carousel', value: D.CAROUSEL },
          { label: 'Cover Flow', value: D.COVERFLOW },
          { label: 'Fan', value: D.FAN },
          { label: 'Hand', value: D.HAND_FAN },
          { label: 'Shelf', value: D.DIAGONAL_ROW },
          { label: 'Wave', value: D.WAVE_ROW },
          { label: 'Iso grid', value: D.ISO_GRID },
          { label: 'Iso breakdown', value: D.ISO_BREAKDOWN },
          { label: 'Vortex', value: D.GOLDEN_VORTEX },
          { label: 'Cascade', value: D.CASCADE },
          { label: 'Glitch grid', value: D.GLITCH_GRID },
          { label: 'Silhouette', value: D.SILHOUETTE },
          { label: 'Grid', value: D.GRID },
          { label: 'Circle', value: D.CIRCLE },
          { label: 'Ring', value: D.RING },
          { label: 'Cube', value: D.CUBE },
          { label: 'Sphere', value: D.SPHERE },
          { label: 'Shell', value: D.SPHERE_SHELL },
          { label: 'Spiral', value: D.SPIRAL },
          { label: 'Cylinder', value: D.CYLINDER },
          { label: 'Torus', value: D.TORUS },
        ],
      },
      { key: 'distribution.count', label: 'Count', min: 1, max: 500, step: 1, value: 36, show: dist(D.LOOP, D.CIRCLE, D.RING, D.SPIRAL, D.CYLINDER, D.TORUS, D.SPHERE, D.SPHERE_SHELL) },
      {
        key: 'distribution.loopShape',
        label: 'Path',
        kind: 'select',
        options: options([
          [LoopShape.CIRCLE, 'Circle'],
          [LoopShape.SQUARE, 'Square'],
          [LoopShape.DIAMOND, 'Diamond'],
          [LoopShape.HEXAGON, 'Hexagon'],
          [LoopShape.TRIANGLE, 'Triangle'],
          [LoopShape.STAR, 'Star'],
        ]),
        show: dist(D.LOOP),
      },
      { key: 'distribution.radius', label: 'Radius', min: 0.1, max: 80, step: 0.01, value: 10, fmt: x2, show: dist(D.LOOP, D.CIRCLE, D.RING, D.SPIRAL, D.CYLINDER, D.TORUS) },
      { key: 'distribution.loopWidth', label: 'Half width', min: 0.5, max: 40, step: 0.05, value: 7, fmt: x2, show: dist(D.LOOP) },
      { key: 'distribution.loopDepth', label: 'Half depth', min: 0.5, max: 40, step: 0.05, value: 7, fmt: x2, show: dist(D.LOOP) },
      { key: 'distribution.columnCount', label: 'Count', min: 1, max: 200, step: 1, value: 12, show: dist(D.COLUMN) },
      { key: 'distribution.columnSpacing', label: 'Spacing', min: 0.01, max: 20, step: 0.01, value: 1.2, fmt: x2, show: dist(D.COLUMN) },
      { key: 'distribution.carouselCount', label: 'Per ring', min: 1, max: 64, step: 1, value: 16, show: dist(D.CAROUSEL) },
      { key: 'distribution.carouselRadius', label: 'Radius', min: 0.5, max: 40, step: 0.05, value: 6, fmt: x2, show: dist(D.CAROUSEL) },
      { key: 'distribution.coverflowCount', label: 'Count', min: 1, max: 64, step: 1, value: 12, show: dist(D.COVERFLOW) },
      { key: 'distribution.coverflowRadius', label: 'Radius', min: 0.5, max: 40, step: 0.05, value: 8, fmt: x2, show: dist(D.COVERFLOW) },
      { key: 'distribution.fanCount', label: 'Count', min: 1, max: 64, step: 1, value: 10, show: dist(D.FAN, D.HAND_FAN) },
      { key: 'distribution.fanSpacing', label: 'Spacing', min: 0.05, max: 5, step: 0.01, value: 0.55, fmt: x2, show: dist(D.FAN, D.HAND_FAN) },
      { key: 'distribution.rowCount', label: 'Count', min: 1, max: 200, step: 1, value: 12, show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.rowSpacing', label: 'Spacing', min: 0.05, max: 10, step: 0.01, value: 1.35, fmt: x2, show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.heroSpacing', label: 'Peak gap', min: 0, max: 4, step: 0.01, value: 0, fmt: x2, hint: 'Extra gap through the weave. Floor stays at Spacing.', show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.rowAngleDeg', label: 'Angle', min: -90, max: 90, step: 1, value: 35, fmt: deg, show: dist(D.DIAGONAL_ROW) },
      { key: 'distribution.waveAmplitude', label: 'Weave', min: 0, max: 24, step: 0.05, value: 1.2, fmt: x2, hint: 'How many tiles the ease-in/out weave involves.', show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.heroLift', label: 'Rise', min: 0, max: 4, step: 0.01, value: 0, fmt: x2, show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.heroIndex', label: 'Hero', min: 0, max: 199, step: 1, value: 6, show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.heroDetach', label: 'Pop', min: 0, max: 4, step: 0.01, value: 0, fmt: x2, hint: 'Extra lift on Y only, so the hero reads clear of the weave.', show: dist(D.DIAGONAL_ROW, D.WAVE_ROW) },
      { key: 'distribution.isoCountX', label: 'X count', min: 1, max: 24, step: 1, value: 5, show: dist(D.ISO_GRID) },
      { key: 'distribution.isoCountZ', label: 'Z count', min: 1, max: 24, step: 1, value: 4, show: dist(D.ISO_GRID) },
      { key: 'distribution.isoSpacingX', label: 'X spacing', min: 0.2, max: 12, step: 0.05, value: 2.4, fmt: x2, show: dist(D.ISO_GRID) },
      { key: 'distribution.isoSpacingZ', label: 'Z spacing', min: 0.2, max: 12, step: 0.05, value: 2.6, fmt: x2, show: dist(D.ISO_GRID) },
      { key: 'distribution.breakdownCount', label: 'Count', min: 2, max: 48, step: 1, value: 9, show: dist(D.ISO_BREAKDOWN) },
      { key: 'distribution.breakdownSpacing', label: 'Spacing', min: 0.2, max: 8, step: 0.01, value: 1.55, fmt: x2, show: dist(D.ISO_BREAKDOWN) },
      { key: 'distribution.breakdownAngleDeg', label: 'Axis', min: 0, max: 90, step: 1, value: 45, fmt: deg, show: dist(D.ISO_BREAKDOWN) },
      { key: 'distribution.breakdownExplode', label: 'Explode', min: 0, max: 3, step: 0.01, value: 0.55, fmt: x2, show: dist(D.ISO_BREAKDOWN) },
      { key: 'distribution.breakdownTwistDeg', label: 'Twist', min: 0, max: 120, step: 1, value: 26, fmt: deg, show: dist(D.ISO_BREAKDOWN) },
      { key: 'distribution.vortexCount', label: 'Count', min: 8, max: 240, step: 1, value: 72, show: dist(D.GOLDEN_VORTEX) },
      { key: 'distribution.vortexRadius', label: 'Radius', min: 0.5, max: 24, step: 0.05, value: 9, fmt: x2, show: dist(D.GOLDEN_VORTEX) },
      { key: 'distribution.vortexTurns', label: 'Turns', min: 0.5, max: 8, step: 0.05, value: 3.4, fmt: x2, show: dist(D.GOLDEN_VORTEX) },
      { key: 'distribution.vortexScaleIn', label: 'Core scale', min: 0.02, max: 1, step: 0.01, value: 0.12, fmt: x2, show: dist(D.GOLDEN_VORTEX) },
      { key: 'distribution.vortexDepth', label: 'Depth', min: 0, max: 8, step: 0.05, value: 2.4, fmt: x2, show: dist(D.GOLDEN_VORTEX) },
      { key: 'distribution.cascadeCount', label: 'Count', min: 4, max: 120, step: 1, value: 32, show: dist(D.CASCADE) },
      { key: 'distribution.cascadeHeight', label: 'Height', min: 2, max: 40, step: 0.1, value: 16, fmt: x1, show: dist(D.CASCADE) },
      { key: 'distribution.cascadeSpread', label: 'Spread', min: 0, max: 10, step: 0.05, value: 2.6, fmt: x2, show: dist(D.CASCADE) },
      { key: 'distribution.glitchCountX', label: 'X count', min: 1, max: 24, step: 1, value: 11, show: dist(D.GLITCH_GRID) },
      { key: 'distribution.glitchCountZ', label: 'Z count', min: 1, max: 24, step: 1, value: 11, show: dist(D.GLITCH_GRID) },
      { key: 'distribution.glitchSpacing', label: 'Spacing', min: 0.2, max: 6, step: 0.01, value: 1.08, fmt: x2, show: dist(D.GLITCH_GRID) },
      { key: 'distribution.glitchIndex', label: 'Index', min: 0, max: 575, step: 1, value: 47, show: dist(D.GLITCH_GRID) },
      { key: 'distribution.glitchRotDeg', label: 'Twist', min: -180, max: 180, step: 1, value: 48, fmt: deg, show: dist(D.GLITCH_GRID) },
      { key: 'distribution.silCount', label: 'Max count', min: 8, max: 600, step: 1, value: 280, show: dist(D.SILHOUETTE) },
      { key: 'distribution.silRadius', label: 'Radius', min: 0.5, max: 16, step: 0.05, value: 5.2, fmt: x2, show: dist(D.SILHOUETTE) },
      { key: 'distribution.silOverlap', label: 'Overlap', min: 0, max: 0.85, step: 0.01, value: 0.48, fmt: x2, show: dist(D.SILHOUETTE) },
      { key: 'distribution.countX', label: 'X count', min: 1, max: 80, step: 1, value: 6, show: dist(D.GRID, D.CUBE, D.DIAMOND, D.SQUARE) },
      { key: 'distribution.countY', label: 'Y count', min: 1, max: 80, step: 1, value: 1, show: dist(D.GRID, D.CUBE, D.DIAMOND, D.SQUARE) },
      { key: 'distribution.countZ', label: 'Z count', min: 1, max: 80, step: 1, value: 6, show: dist(D.GRID, D.CUBE, D.DIAMOND, D.SQUARE) },
      { key: 'distribution.spacingX', label: 'X spacing', min: 0.1, max: 10, step: 0.01, value: 1.2, fmt: x2, show: dist(D.GRID, D.CUBE, D.DIAMOND, D.SQUARE) },
      { key: 'distribution.sphereRadius', label: 'Radius', min: 0.1, max: 80, step: 0.01, value: 9, fmt: x2, show: dist(D.SPHERE, D.SPHERE_SHELL) },
    ],
  },
  {
    id: 'motion',
    label: 'Orientation',
    defaultOpen: true,
    params: [
      {
        key: 'orientation.mode',
        label: 'Face',
        kind: 'select',
        options: options([
          [OrientationMode.FIXED, 'Fixed'],
          [OrientationMode.TO_CAMERA, 'To camera'],
          [OrientationMode.TO_CENTER, 'To center'],
          [OrientationMode.OUT_FROM_CENTER, 'From center'],
          [OrientationMode.SHAPE_NORMAL, 'Along normal'],
          [OrientationMode.TANGENT, 'Tangent'],
        ]),
      },
      { key: 'orientation.extraRotX', label: 'Tilt', min: -180, max: 180, step: 1, value: 0, fmt: deg },
      { key: 'orientation.yawDeg', label: 'Yaw', min: -180, max: 180, step: 1, value: 0, fmt: deg },
      { key: 'stagger.enabled', label: 'Stagger', kind: 'boolean' },
      {
        key: 'stagger.source',
        label: 'By',
        kind: 'select',
        options: options([
          [StaggerSource.INDEX, 'Index'],
          [StaggerSource.ROW, 'Row'],
          [StaggerSource.COL, 'Column'],
          [StaggerSource.LAYER, 'Layer'],
          [StaggerSource.U, 'Path'],
          [StaggerSource.DIST_CENTER, 'Distance'],
          [StaggerSource.GRADIENT_X, 'X gradient'],
          [StaggerSource.GRADIENT_Y, 'Y gradient'],
          [StaggerSource.GRADIENT_Z, 'Z gradient'],
          [StaggerSource.RADIAL, 'Radial'],
          [StaggerSource.NOISE, 'Noise'],
          [StaggerSource.SINE, 'Sine'],
        ]),
      },
      { key: 'stagger.amountDeg', label: 'Amount', min: -1440, max: 1440, step: 1, value: 240, fmt: deg },
    ],
  },
  {
    id: 'camera',
    label: 'Camera',
    defaultOpen: true,
    params: [
      { key: 'camera.azimuthDeg', label: 'Orbit', min: -180, max: 180, step: 0.1, value: 45, fmt: x1 },
      { key: 'camera.polarDeg', label: 'Elevation', min: 1, max: 179, step: 0.1, value: 55, fmt: x1 },
      { key: 'camera.distance', label: 'Distance', min: 0.5, max: 300, step: 0.01, value: 30, fmt: x1 },
      { key: 'camera.targetX', label: 'Horizontal', min: -40, max: 40, step: 0.01, value: 0, fmt: x2, hint: 'Slide the camera left and right.' },
      { key: 'camera.targetY', label: 'Vertical', min: -40, max: 40, step: 0.01, value: 0, fmt: x2, hint: 'Slide the camera up and down.' },
      { key: 'camera.lockFraming', label: 'Lock frame', kind: 'boolean' },
    ],
  },
  {
    id: 'more',
    label: 'Advanced',
    defaultOpen: false,
    params: [
      { key: 'transform.scale', label: 'Scale', min: 0.05, max: 10, step: 0.01, value: 1, fmt: x2 },
      { key: 'transform.positionX', label: 'X', min: -80, max: 80, step: 0.01, value: 0, fmt: x2 },
      { key: 'transform.positionY', label: 'Y', min: -80, max: 80, step: 0.01, value: 0, fmt: x2 },
      { key: 'transform.positionZ', label: 'Z', min: -80, max: 80, step: 0.01, value: 0, fmt: x2 },
      {
        key: 'collision.mode',
        label: 'Collision',
        kind: 'select',
        options: options([
          [CollisionMode.OFF, 'Off'],
          [CollisionMode.PREVENT, 'Prevent'],
          [CollisionMode.RESOLVE, 'Resolve'],
        ]),
      },
      { key: 'export.scale', label: 'Export scale', min: 1, max: 8, step: 1, value: 3 },
      { key: 'render.transparentExport', label: 'Clear PNG', kind: 'boolean' },
      {
        key: 'distribution.fillMode',
        label: 'Draw',
        kind: 'select',
        options: options([
          [FillMode.FILL, 'Fill'],
          [FillMode.OUTLINE, 'Outline'],
        ]),
      },
      { key: 'distribution.seed', label: 'Seed', min: 1, max: 9999, step: 1, value: 1 },
    ],
  },
];

export const DEFAULTS: Record<string, number | string | boolean> = Object.fromEntries(
  PARAM_GROUPS.flatMap((g) => g.params.filter((p) => p.value !== undefined).map((p) => [p.key, p.value as number | string | boolean])),
);

export function getPath(obj: any, path: string) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

export function setPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  const last = keys.pop() as string;
  let cur = obj;
  for (const k of keys) {
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
}

export function formatParam(def: ParamDef, v: any) {
  if (def.kind === 'boolean') return v ? 'On' : 'Off';
  if (typeof v === 'number' && def.fmt) return def.fmt(v);
  if (typeof v === 'number') return Number.isInteger(def.step) && (def.step ?? 1) >= 1 ? String(Math.round(v)) : x2(v);
  return String(v ?? '');
}
