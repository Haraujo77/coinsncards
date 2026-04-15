export const DistributionType = Object.freeze({
  GRID: 'grid',
  CIRCLE: 'circle',
  RING: 'ring',
  /** Loop fechado no plano XZ: círculo/elipse, quadrado, losango, hexágono, triângulo, estrela. Largura/profundidade: `loopWidth` / `loopDepth` (meia-extensão em X e Z). */
  LOOP: 'loop',
  /** Coluna linear ao longo de um eixo (X/Y/Z). */
  COLUMN: 'column',
  SQUARE: 'square',
  DIAMOND: 'diamond',
  CUBE: 'cube',
  SPHERE: 'sphere',
  SPHERE_SHELL: 'sphereShell',
  SPIRAL: 'spiral',
  CYLINDER: 'cylinder',
  TORUS: 'torus',
});

export const ObjectType = Object.freeze({
  COIN: 'coin',
  CARD: 'card',
});

/** Forma do perímetro quando `distribution.type === loop`. Círculo usa elipse (w×d); demais polígonos usam o mesmo escalamento nos vértices. */
export const LoopShape = Object.freeze({
  CIRCLE: 'circle',
  SQUARE: 'square',
  DIAMOND: 'diamond',
  HEXAGON: 'hexagon',
  TRIANGLE: 'triangle',
  STAR: 'star',
});

export const FillMode = Object.freeze({
  FILL: 'fill',
  OUTLINE: 'outline',
});

export const OrientationMode = Object.freeze({
  FIXED: 'fixed',
  TO_CAMERA: 'toCamera',
  TO_CENTER: 'toCenter',
  OUT_FROM_CENTER: 'outFromCenter',
  SHAPE_NORMAL: 'shapeNormal',
  TANGENT: 'tangent',
});

export const StaggerSource = Object.freeze({
  INDEX: 'index',
  ROW: 'row',
  COL: 'col',
  LAYER: 'layer',
  /** Progresso 0→1 vindo do gerador (ex.: coluna, loops, etc.). */
  U: 'u',
  DIST_CENTER: 'distCenter',
  GRADIENT_X: 'gradX',
  GRADIENT_Y: 'gradY',
  GRADIENT_Z: 'gradZ',
  RADIAL: 'radial',
  NOISE: 'noise',
  SINE: 'sine',
});

export const StaggerCurve = Object.freeze({
  LINEAR: 'linear',
  SMOOTHSTEP: 'smoothstep',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
});

export const CollisionMode = Object.freeze({
  OFF: 'off',
  PREVENT: 'prevent',
  RESOLVE: 'resolve',
});

export function createDefaultState() {
  return {
    preset: 'Circle Loop',

    render: {
      background: '#0b0c10',
      pixelRatio: 1,
      solid: true,
      outline: false,
      outlineWireframe: true,
      transparentExport: false,
    },

    object: {
      type: ObjectType.COIN,
    },

    disc: {
      diameter: 1.0,
      thickness: 0.08,
      segments: 48,
      varyEnabled: false,
      varyDiameter: 0.08,
      varyThickness: 0.02,
    },

    card: {
      /** Proporção ISO/IEC 7810 ID-1 (85.60×53.98mm ≈ 1.586:1). */
      width: 1.586,
      height: 1.0,
      /** Espessura típica ~0.76mm (aqui em unidades relativas do app). */
      thickness: 0.03,
      /** Corner radius como fração de min(width,height). Padrão ~3.18mm ⇒ ~0.059. */
      cornerRadius: 0.06,
      /** Segmentos do arredondamento (qualidade). */
      segments: 6,
      varyEnabled: false,
      varyWidth: 0.03,
      varyHeight: 0.03,
      varyThickness: 0.02,
      varyCornerRadius: 0.15,
    },

    distribution: {
      type: DistributionType.LOOP,
      fillMode: FillMode.OUTLINE,
      loopShape: LoopShape.CIRCLE,
      /** Se true e loopShape=circle: usa `radius` como raio (width=depth=radius). */
      loopUseRadius: true,
      /** Meia-largura no eixo X (oval horizontal vs vertical: aumente um e reduza o outro). */
      loopWidth: 7,
      /** Meia-profundidade no eixo Z. Igual a loopWidth ⇒ círculo; diferente ⇒ oval. */
      loopDepth: 7,
      /** Suavização de cantos em loops poligonais (0 = canto duro, 0.25 = bem suave). */
      cornerBlend: 0.15,
      starPoints: 5,
      starInnerRatio: 0.42,

      // grid/cube
      countX: 6,
      countY: 1,
      countZ: 6,
      spacingX: 1.2,
      spacingY: 1.2,
      spacingZ: 1.2,
      offsetXPerRow: 0.0,
      offsetZPerCol: 0.0,
      offsetYPerLayer: 0.0,
      alternateOffset: false,

      // radial / legado (círculo anel espiral etc.)
      count: 36,
      radius: 10,
      innerRadius: 7,
      height: 6,
      turns: 4,

      // column
      columnAxis: 'y', // x|y|z
      columnCount: 12,
      columnSpacing: 1.2,
      /** Se false, a coluna começa em 0 e só cresce positivo (não centrada). */
      columnCentered: true,

      // sphere
      sphereRadius: 9,
      shellThickness: 1.25,
      jitter: 0.0,
      seed: 1,
    },

    transform: {
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      scale: 1,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
    },

    orientation: {
      mode: OrientationMode.TO_CENTER,
      extraRotX: 0,
      extraRotY: 0,
      extraRotZ: 0,
    },

    stagger: {
      enabled: true,
      axis: 'y', // x|y|z
      source: StaggerSource.INDEX,
      curve: StaggerCurve.SMOOTHSTEP,
      amountDeg: 240,
      falloff: 1.0,
      direction: 1, // 1 or -1
      noiseScale: 0.2,
      noiseStrength: 1.0,
      sineFreq: 1.0,
      sinePhase: 0.0,
    },

    collision: {
      mode: CollisionMode.RESOLVE,
      padding: 0.02,
      iterations: 10,
      cellSize: 1.25,
      maxPush: 0.6,
      autoIncreaseSpacing: true,
      maxAutoSpacingFactor: 2.0,
    },

    export: {
      scale: 3,
      filename: 'disks.png',
    },

    camera: {
      /** Mantém a UI sincronizada com drag (OrbitControls). */
      syncFromOrbit: true,
      /** Ângulo azimutal em graus (rotação em torno de Y). */
      azimuthDeg: 45,
      /** Ângulo polar em graus (0=topo, 90=nível). */
      polarDeg: 55,
      /** Distância do alvo. */
      distance: 30,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
    },
  };
}

