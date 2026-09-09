import {
  DistributionType,
  FillMode,
  LoopShape,
  OrientationMode,
  StaggerSource,
  CollisionMode,
} from './state.js';

/** Máximo de instâncias por preset (exploração leve + espaçamento seguro com disco ~1 unidade). */
const N = 36;

export const PRESETS = [
  {
    name: 'Circle Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.CIRCLE,
        count: N,
        loopUseRadius: true,
        radius: 7,
        loopWidth: 7,
        loopDepth: 7,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Square Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.SQUARE,
        count: N,
        loopUseRadius: false,
        loopWidth: 5.6,
        loopDepth: 5.6,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Lozenge Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.DIAMOND,
        count: N,
        loopUseRadius: false,
        loopWidth: 8,
        loopDepth: 8,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Hexagon Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.HEXAGON,
        count: N,
        loopUseRadius: false,
        loopWidth: 7.2,
        loopDepth: 7.2,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Triangle Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.TRIANGLE,
        count: N,
        loopUseRadius: false,
        loopWidth: 9,
        loopDepth: 9,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Star Loop',
    state: {
      distribution: {
        type: DistributionType.LOOP,
        fillMode: FillMode.OUTLINE,
        loopShape: LoopShape.STAR,
        count: N,
        loopUseRadius: false,
        loopWidth: 8,
        loopDepth: 8,
        starPoints: 5,
        starInnerRatio: 0.42,
      },
      orientation: { mode: OrientationMode.TO_CENTER },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
    },
  },
  {
    name: 'Stacked Card Spiral',
    state: {
      object: { type: 'card' },
      card: {
        width: 1.586,
        height: 1.0,
        thickness: 0.03,
        cornerRadius: 0.06,
        segments: 6,
      },
      distribution: {
        type: DistributionType.COLUMN,
        columnAxis: 'y',
        columnCentered: false,
        columnCount: 30,
        // empilhado “flutuando” com gap mínimo
        columnSpacing: 0.038,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 0, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.U, amountDeg: 260, falloff: 1.0, direction: 1 },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 6, positionX: 0, positionY: 0, positionZ: 0, rotX: 0, rotY: 0, rotZ: 0 },
      camera: { azimuthDeg: 35, polarDeg: 55, distance: 35, targetX: 0, targetY: 0, targetZ: 0 },
    },
  },
  {
    name: 'Icon Spiral Stack',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.14, cornerRadius: 0.22, segments: 8 },
      distribution: {
        type: DistributionType.COLUMN,
        columnAxis: 'y',
        columnCentered: false,
        columnCount: 18,
        columnSpacing: 0.16,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 0, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.U, amountDeg: 300, falloff: 1.0, direction: 1 },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 4.5, positionX: 0, positionY: 0, positionZ: 0 },
      render: { background: '#f4f4f5' },
      camera: {
        lockFraming: true,
        azimuthDeg: 36,
        polarDeg: 72,
        distance: 22,
        targetX: 0,
        targetY: 6.1,
        targetZ: 0,
      },
    },
  },
  {
    name: 'Icon Carousel',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.14, cornerRadius: 0.22, segments: 8 },
      distribution: {
        type: DistributionType.CAROUSEL,
        carouselCount: 14,
        carouselRadius: 5.5,
        carouselY: 0,
        carouselFaceOut: true,
      },
      orientation: { mode: OrientationMode.OUT_FROM_CENTER, extraRotX: 90, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 2.2 },
      render: { background: '#0f1115' },
      camera: {
        lockFraming: true,
        azimuthDeg: 0,
        polarDeg: 48,
        distance: 34,
        targetX: 0,
        targetY: 0.4,
        targetZ: 0,
      },
    },
  },
  {
    name: 'Icon Coverflow',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.12, cornerRadius: 0.22, segments: 8 },
      distribution: {
        type: DistributionType.COVERFLOW,
        coverflowCount: 11,
        coverflowRadius: 7,
        coverflowSpreadDeg: 105,
      },
      orientation: { mode: OrientationMode.SHAPE_NORMAL, extraRotX: 90, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 2.4 },
      render: { background: '#e8eef8' },
      camera: {
        lockFraming: true,
        azimuthDeg: 0,
        polarDeg: 68,
        distance: 24,
        targetX: 0,
        targetY: 0.2,
        targetZ: 1.2,
      },
    },
  },
  {
    name: 'Icon Fan Deck',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.15, thickness: 0.1, cornerRadius: 0.18, segments: 8 },
      distribution: {
        type: DistributionType.FAN,
        fanCount: 9,
        fanSpacing: 0.72,
        fanDepth: 0.22,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 90, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: true, axis: 'z', source: StaggerSource.U, amountDeg: 18, falloff: 1.0 },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 3.2 },
      render: { background: '#8a8a8a' },
      camera: {
        lockFraming: true,
        azimuthDeg: 0,
        polarDeg: 76,
        distance: 26,
        targetX: 0,
        targetY: 0,
        targetZ: 0.4,
      },
    },
  },
  {
    name: 'Icon Diagonal Shelf',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.12, cornerRadius: 0.22, segments: 8 },
      distribution: {
        type: DistributionType.DIAGONAL_ROW,
        rowCount: 10,
        rowSpacing: 1.45,
        rowAngleDeg: 32,
        rowTiltDeg: 8,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 90, extraRotY: -18, extraRotZ: 0 },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.U, amountDeg: 12, falloff: 1.0 },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 2.6 },
      render: { background: '#dce3f2' },
      camera: {
        lockFraming: true,
        azimuthDeg: -32,
        polarDeg: 56,
        distance: 30,
        targetX: 0,
        targetY: 0.6,
        targetZ: 0,
      },
    },
  },
  {
    name: 'Icon Wave Parade',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.12, cornerRadius: 0.22, segments: 8 },
      distribution: {
        type: DistributionType.WAVE_ROW,
        rowCount: 14,
        rowSpacing: 1.35,
        waveAmplitude: 0.85,
        waveLength: 1.25,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 90, extraRotY: 0, extraRotZ: 0 },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.SINE, amountDeg: 24, falloff: 1.0, sineFreq: 1.2 },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 2.3 },
      render: { background: '#12141a' },
      camera: {
        lockFraming: true,
        azimuthDeg: 0,
        polarDeg: 62,
        distance: 34,
        targetX: 0,
        targetY: 0.3,
        targetZ: 0,
      },
    },
  },
  {
    name: 'Icon Iso Grid',
    state: {
      object: { type: 'icon' },
      icon: { size: 1.0, thickness: 0.1, cornerRadius: 0.18, segments: 8 },
      distribution: {
        type: DistributionType.ISO_GRID,
        isoCountX: 5,
        isoCountZ: 4,
        isoSpacingX: 2.35,
        isoSpacingZ: 2.55,
        isoRowOffset: 0.5,
      },
      orientation: { mode: OrientationMode.FIXED, extraRotX: 90, extraRotY: 0, extraRotZ: 0, yawDeg: 0 },
      stagger: { enabled: false },
      collision: { mode: CollisionMode.OFF },
      transform: { scale: 2.2 },
      render: { background: '#f3f1ec' },
      camera: {
        lockFraming: true,
        azimuthDeg: 45,
        polarDeg: 54,
        distance: 18,
        targetX: 0.2,
        targetY: 0.4,
        targetZ: 0.2,
      },
    },
  },
  {
    name: 'Twisted Ring',
    state: {
      distribution: {
        type: DistributionType.RING,
        fillMode: FillMode.OUTLINE,
        count: N,
        radius: 9,
        innerRadius: 6.5,
      },
      orientation: { mode: OrientationMode.TANGENT, extraRotX: 0 },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.INDEX, amountDeg: 280, falloff: 1.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 10 },
    },
  },
  {
    name: 'Radial Gradient Rotation',
    state: {
      distribution: {
        type: DistributionType.GRID,
        fillMode: FillMode.FILL,
        countX: 6,
        countZ: 6,
        countY: 1,
        spacingX: 1.22,
        spacingZ: 1.22,
      },
      orientation: { mode: OrientationMode.FIXED },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.RADIAL, amountDeg: 360, falloff: 1.8 },
      collision: { mode: CollisionMode.PREVENT, autoIncreaseSpacing: true },
    },
  },
  {
    name: 'Wave Grid',
    state: {
      distribution: {
        type: DistributionType.GRID,
        fillMode: FillMode.FILL,
        countX: 6,
        countZ: 6,
        countY: 1,
        spacingX: 1.22,
        spacingZ: 1.22,
      },
      orientation: { mode: OrientationMode.FIXED },
      stagger: { enabled: true, axis: 'x', source: StaggerSource.SINE, amountDeg: 72, falloff: 1.0, sineFreq: 2.3, sinePhase: 0.0 },
      collision: { mode: CollisionMode.PREVENT, autoIncreaseSpacing: true },
    },
  },
  {
    name: 'Sphere Shell',
    state: {
      distribution: {
        type: DistributionType.SPHERE_SHELL,
        fillMode: FillMode.OUTLINE,
        count: N,
        sphereRadius: 8,
        shellThickness: 0.65,
        jitter: 0.06,
        seed: 7,
      },
      orientation: { mode: OrientationMode.OUT_FROM_CENTER },
      stagger: { enabled: true, axis: 'z', source: StaggerSource.DIST_CENTER, amountDeg: 180, falloff: 2.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 12, cellSize: 1.2 },
    },
  },
  {
    name: 'Dense Cube',
    state: {
      distribution: {
        type: DistributionType.CUBE,
        fillMode: FillMode.FILL,
        countX: 3,
        countY: 4,
        countZ: 3,
        spacingX: 1.25,
        spacingY: 1.25,
        spacingZ: 1.25,
      },
      orientation: { mode: OrientationMode.FIXED },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.LAYER, amountDeg: 220, falloff: 1.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 14, cellSize: 1.0, maxPush: 0.5 },
    },
  },
  {
    name: 'Spiral Loop',
    state: {
      distribution: {
        type: DistributionType.SPIRAL,
        fillMode: FillMode.OUTLINE,
        count: N,
        radius: 5.6,
        height: 7,
        turns: 3.5,
      },
      orientation: { mode: OrientationMode.TANGENT },
      stagger: { enabled: true, axis: 'z', source: StaggerSource.INDEX, amountDeg: 520, falloff: 1.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 10, cellSize: 1.1 },
    },
  },
  {
    name: 'Diamond Grid',
    state: {
      distribution: {
        type: DistributionType.DIAMOND,
        fillMode: FillMode.FILL,
        countX: 6,
        countZ: 6,
        countY: 1,
        spacingX: 1.22,
        spacingZ: 1.22,
        alternateOffset: true,
        offsetXPerRow: 0.61,
      },
      orientation: { mode: OrientationMode.FIXED },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.GRADIENT_X, amountDeg: 160, falloff: 1.2 },
      collision: { mode: CollisionMode.PREVENT, autoIncreaseSpacing: true },
    },
  },
  {
    name: 'Helix Tube',
    state: {
      distribution: {
        type: DistributionType.CYLINDER,
        fillMode: FillMode.OUTLINE,
        count: N,
        radius: 5.2,
        height: 8,
        turns: 5,
      },
      orientation: { mode: OrientationMode.TANGENT },
      stagger: { enabled: true, axis: 'y', source: StaggerSource.INDEX, amountDeg: 640, falloff: 1.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 10, cellSize: 1.1 },
    },
  },
  {
    name: 'Orbital Bands',
    state: {
      distribution: {
        type: DistributionType.TORUS,
        fillMode: FillMode.OUTLINE,
        count: N,
        radius: 8,
        innerRadius: 1.85,
        jitter: 0.06,
        seed: 4,
      },
      orientation: { mode: OrientationMode.TANGENT, extraRotX: 90 },
      stagger: { enabled: true, axis: 'z', source: StaggerSource.NOISE, amountDeg: 160, falloff: 1.0, noiseScale: 0.15, noiseStrength: 1.0 },
      collision: { mode: CollisionMode.RESOLVE, iterations: 12, cellSize: 1.2 },
    },
  },
];

export function listPresetNames() {
  return PRESETS.map((p) => p.name);
}

export function getPresetByName(name) {
  return PRESETS.find((p) => p.name === name) ?? PRESETS[0];
}

export function deepMerge(target, patch) {
  if (patch == null || typeof patch !== 'object') return target;
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}
