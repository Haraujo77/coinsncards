import GUI from 'lil-gui';
import { listPresetNames } from './presets.js';
import { CollisionMode, DistributionType, FillMode, LoopShape, ObjectType, OrientationMode, StaggerCurve, StaggerSource } from './state.js';

function degController(gui, obj, key, name, min, max, step, onChange) {
  return gui.add(obj, key, min, max, step).name(name).onChange(onChange);
}

function setFolderVisible(folder, visible) {
  folder.domElement.style.display = visible ? '' : 'none';
}

export function createUi({ state, onAnyChange, onApplyPreset, onExport, onSavePreset, onLoadPreset, onCameraCapture, onCameraReset }) {
  const gui = new GUI({ width: 320, title: 'Disks Composer' });
  gui.domElement.style.position = 'absolute';
  gui.domElement.style.right = '12px';
  gui.domElement.style.top = '12px';
  gui.domElement.style.maxHeight = 'calc(100vh - 24px)';
  gui.domElement.style.overflow = 'auto';

  const presetNames = listPresetNames();
  const root = {
    preset: state.preset,
    exportPng: () => onExport(),
    savePreset: () => onSavePreset?.(),
    loadPreset: () => onLoadPreset?.(),
    cameraCapture: () => onCameraCapture?.(),
    cameraReset: () => onCameraReset?.(),
    cameraFrame: () => onAnyChange?.('__cameraFrame__'),
  };

  // 1. Scene — pick a look, it applies immediately
  const fScene = gui.addFolder('Cena');
  fScene.add(root, 'preset', presetNames).name('Preset').onChange((name) => {
    onApplyPreset(name);
  });
  fScene.addColor(state.render, 'background').name('Fundo').onChange(onAnyChange);
  fScene.add(state.render, 'solid').name('Sólido').onChange(onAnyChange);
  fScene.add(state.render, 'outline').name('Contorno').onChange(onAnyChange);
  fScene.add(root, 'exportPng').name('Exportar PNG');
  fScene.add(root, 'savePreset').name('Salvar JSON');
  fScene.add(root, 'loadPreset').name('Carregar JSON');

  // 2. Piece
  const fPiece = gui.addFolder('Peça');
  fPiece.add(state.object, 'type', {
    Moeda: ObjectType.COIN,
    Card: ObjectType.CARD,
    Ícone: ObjectType.ICON,
  }).name('Tipo').onChange(onAnyChange);

  const fDisc = fPiece.addFolder('Moeda');
  fDisc.add(state.disc, 'diameter', 0.1, 8, 0.01).name('Diâmetro').onChange(onAnyChange);
  fDisc.add(state.disc, 'thickness', 0.01, 2, 0.005).name('Espessura').onChange(onAnyChange);
  fDisc.add(state.disc, 'segments', 6, 128, 1).name('Segmentos').onChange(onAnyChange);
  fDisc.add(state.disc, 'varyEnabled').name('Variação').onChange(onAnyChange);

  const fCard = fPiece.addFolder('Card');
  fCard.add(state.card, 'width', 0.2, 10, 0.001).name('Largura').onChange(onAnyChange);
  fCard.add(state.card, 'height', 0.2, 10, 0.001).name('Altura').onChange(onAnyChange);
  fCard.add(state.card, 'thickness', 0.001, 1, 0.001).name('Espessura').onChange(onAnyChange);
  fCard.add(state.card, 'cornerRadius', 0, 0.49, 0.005).name('Canto').onChange(onAnyChange);

  const fIcon = fPiece.addFolder('Ícone');
  fIcon.add(state.icon, 'size', 0.2, 8, 0.01).name('Tamanho').onChange(onAnyChange);
  fIcon.add(state.icon, 'thickness', 0.01, 1, 0.005).name('Espessura').onChange(onAnyChange);
  fIcon.add(state.icon, 'cornerRadius', 0, 0.49, 0.005).name('Canto').onChange(onAnyChange);

  // 3. Layout — one type, only matching controls
  const fLayout = gui.addFolder('Layout');
  fLayout.add(state.distribution, 'type', {
    'Loop': DistributionType.LOOP,
    'Coluna': DistributionType.COLUMN,
    'Carousel': DistributionType.CAROUSEL,
    'Coverflow': DistributionType.COVERFLOW,
    'Fan': DistributionType.FAN,
    'Prateleira': DistributionType.DIAGONAL_ROW,
    'Onda': DistributionType.WAVE_ROW,
    'Grid iso': DistributionType.ISO_GRID,
    'Grid': DistributionType.GRID,
    'Círculo': DistributionType.CIRCLE,
    'Anel': DistributionType.RING,
    'Cubo': DistributionType.CUBE,
    'Esfera': DistributionType.SPHERE,
    'Casca': DistributionType.SPHERE_SHELL,
    'Espiral': DistributionType.SPIRAL,
    'Cilindro': DistributionType.CYLINDER,
    'Toro': DistributionType.TORUS,
  }).name('Forma').onChange((v) => {
    if (v === DistributionType.COLUMN && state.distribution.columnCentered === false) {
      state.distribution.cornerBlend = 0;
    }
    onAnyChange();
  });

  const fLoop = fLayout.addFolder('Loop');
  fLoop.add(state.distribution, 'count', 1, 200, 1).name('Qtd').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopShape', Object.values(LoopShape)).name('Silhueta').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopUseRadius').name('Usar raio').onChange(onAnyChange);
  fLoop.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Raio').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopWidth', 0.5, 40, 0.05).name('Largura ½').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopDepth', 0.5, 40, 0.05).name('Profundidade ½').onChange(onAnyChange);
  fLoop.add(state.distribution, 'cornerBlend', 0, 0.49, 0.01).name('Suavizar cantos').onChange(onAnyChange);

  const fColumn = fLayout.addFolder('Coluna');
  fColumn.add(state.distribution, 'columnAxis', { X: 'x', Y: 'y', Z: 'z' }).name('Eixo').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCount', 1, 200, 1).name('Qtd').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnSpacing', 0.01, 20, 0.01).name('Espaço').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCentered').name('Centrada').onChange(onAnyChange);

  const fCarousel = fLayout.addFolder('Carousel');
  fCarousel.add(state.distribution, 'carouselCount', 1, 64, 1).name('Qtd / anel').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRadius', 0.5, 40, 0.05).name('Raio').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselFaceOut').name('Face para fora').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRings', 1, 6, 1).name('Anéis Y').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRingSpacing', 0.2, 12, 0.05).name('Espaço Y').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRingPhaseDeg', 0, 180, 1).name('Fase anel °').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselNested', 1, 5, 1).name('Anéis concêntr.').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselNestedGap', 0.4, 12, 0.05).name('Gap raio').onChange(onAnyChange);

  const fCoverflow = fLayout.addFolder('Coverflow');
  fCoverflow.add(state.distribution, 'coverflowCount', 1, 64, 1).name('Qtd').onChange(onAnyChange);
  fCoverflow.add(state.distribution, 'coverflowRadius', 0.5, 40, 0.05).name('Raio').onChange(onAnyChange);
  fCoverflow.add(state.distribution, 'coverflowSpreadDeg', 20, 180, 1).name('Abertura °').onChange(onAnyChange);

  const fFan = fLayout.addFolder('Fan');
  fFan.add(state.distribution, 'fanCount', 1, 64, 1).name('Qtd').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanSpacing', 0.05, 5, 0.01).name('Espaço').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanDepth', 0, 2, 0.01).name('Profundidade').onChange(onAnyChange);

  const fRow = fLayout.addFolder('Fila');
  fRow.add(state.distribution, 'rowCount', 1, 64, 1).name('Qtd').onChange(onAnyChange);
  fRow.add(state.distribution, 'rowSpacing', 0.1, 10, 0.01).name('Espaço').onChange(onAnyChange);
  fRow.add(state.distribution, 'rowAngleDeg', -90, 90, 1).name('Ângulo °').onChange(onAnyChange);
  fRow.add(state.distribution, 'waveAmplitude', 0, 8, 0.05).name('Onda').onChange(onAnyChange);

  const fIso = fLayout.addFolder('Grid iso');
  fIso.add(state.distribution, 'isoCountX', 1, 24, 1).name('Qtd X').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoCountZ', 1, 24, 1).name('Qtd Z').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoSpacingX', 0.2, 12, 0.05).name('Espaço X').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoSpacingZ', 0.2, 12, 0.05).name('Espaço Z').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoRowOffset', 0, 1, 0.01).name('Offset linha').onChange(onAnyChange);

  const fGrid = fLayout.addFolder('Grid / cubo');
  fGrid.add(state.distribution, 'countX', 1, 80, 1).name('Qtd X').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countY', 1, 80, 1).name('Qtd Y').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countZ', 1, 80, 1).name('Qtd Z').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingX', 0.1, 10, 0.01).name('Espaço X').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingY', 0.1, 10, 0.01).name('Espaço Y').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingZ', 0.1, 10, 0.01).name('Espaço Z').onChange(onAnyChange);

  const fRadial = fLayout.addFolder('Radial');
  fRadial.add(state.distribution, 'count', 1, 500, 1).name('Qtd').onChange(onAnyChange);
  fRadial.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Raio').onChange(onAnyChange);
  fRadial.add(state.distribution, 'innerRadius', 0.1, 80, 0.01).name('Raio interno').onChange(onAnyChange);
  fRadial.add(state.distribution, 'height', 0.1, 80, 0.01).name('Altura').onChange(onAnyChange);
  fRadial.add(state.distribution, 'turns', 0.1, 40, 0.01).name('Voltas').onChange(onAnyChange);

  const fSphere = fLayout.addFolder('Esfera');
  fSphere.add(state.distribution, 'count', 1, 500, 1).name('Qtd').onChange(onAnyChange);
  fSphere.add(state.distribution, 'sphereRadius', 0.1, 80, 0.01).name('Raio').onChange(onAnyChange);
  fSphere.add(state.distribution, 'shellThickness', 0.01, 40, 0.01).name('Casca').onChange(onAnyChange);

  // 4. Rotation
  const fMotion = gui.addFolder('Rotação');
  fMotion.add(state.orientation, 'mode', Object.values(OrientationMode)).name('Orientação').onChange(onAnyChange);
  degController(fMotion, state.orientation, 'extraRotX', 'Inclinar X °', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'yawDeg', 'Giro em pé °', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'extraRotY', 'Extra Y °', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'extraRotZ', 'Extra Z °', -180, 180, 1, onAnyChange);
  fMotion.add(state.stagger, 'enabled').name('Stagger').onChange(onAnyChange);
  fMotion.add(state.stagger, 'axis', { X: 'x', Y: 'y', Z: 'z' }).name('Eixo').onChange(onAnyChange);
  fMotion.add(state.stagger, 'source', Object.values(StaggerSource)).name('Fonte').onChange(onAnyChange);
  fMotion.add(state.stagger, 'amountDeg', -1440, 1440, 1).name('Intensidade °').onChange(onAnyChange);

  // 5. Camera
  const fCamera = gui.addFolder('Câmera');
  degController(fCamera, state.camera, 'azimuthDeg', 'Azimuth °', -180, 180, 0.1, onAnyChange);
  degController(fCamera, state.camera, 'polarDeg', 'Polar °', 1, 179, 0.1, onAnyChange);
  fCamera.add(state.camera, 'distance', 0.5, 300, 0.01).name('Distância').onChange(onAnyChange);
  fCamera.add(state.camera, 'lockFraming').name('Travar framing').onChange(onAnyChange);
  fCamera.add(root, 'cameraFrame').name('Enquadrar');
  fCamera.close();

  // 6. More — advanced, closed
  const fMore = gui.addFolder('Avançado');
  fMore.add(state.transform, 'scale', 0.05, 10, 0.01).name('Escala global').onChange(onAnyChange);
  degController(fMore, state.transform, 'rotY', 'Rot Y °', -180, 180, 1, onAnyChange);
  fMore.add(state.collision, 'mode', Object.values(CollisionMode)).name('Colisão').onChange(onAnyChange);
  fMore.add(state.export, 'scale', 1, 8, 1).name('Export res').onChange(onAnyChange);
  fMore.add(state.render, 'transparentExport').name('PNG transparente').onChange(onAnyChange);
  fMore.add(state.distribution, 'fillMode', Object.values(FillMode)).name('Fill').onChange(onAnyChange);
  fMore.add(state.distribution, 'seed', 1, 9999, 1).name('Seed').onChange(onAnyChange);
  fMore.close();

  function refreshVisibility() {
    const type = state.distribution.type;
    const obj = state.object?.type ?? ObjectType.COIN;

    setFolderVisible(fDisc, obj === ObjectType.COIN);
    setFolderVisible(fCard, obj === ObjectType.CARD);
    setFolderVisible(fIcon, obj === ObjectType.ICON);

    setFolderVisible(fLoop, type === DistributionType.LOOP);
    setFolderVisible(fColumn, type === DistributionType.COLUMN);
    setFolderVisible(fCarousel, type === DistributionType.CAROUSEL);
    setFolderVisible(fCoverflow, type === DistributionType.COVERFLOW);
    setFolderVisible(fFan, type === DistributionType.FAN);
    setFolderVisible(fRow, type === DistributionType.DIAGONAL_ROW || type === DistributionType.WAVE_ROW);
    setFolderVisible(fIso, type === DistributionType.ISO_GRID);
    setFolderVisible(
      fGrid,
      type === DistributionType.GRID ||
        type === DistributionType.CUBE ||
        type === DistributionType.DIAMOND ||
        type === DistributionType.SQUARE,
    );
    setFolderVisible(
      fRadial,
      type === DistributionType.CIRCLE ||
        type === DistributionType.RING ||
        type === DistributionType.SPIRAL ||
        type === DistributionType.CYLINDER ||
        type === DistributionType.TORUS,
    );
    setFolderVisible(fSphere, type === DistributionType.SPHERE || type === DistributionType.SPHERE_SHELL);
  }

  const timer = setInterval(refreshVisibility, 300);
  refreshVisibility();

  return {
    gui,
    destroy() {
      clearInterval(timer);
      gui.destroy();
    },
    setPreset(name) {
      root.preset = name;
      gui.controllersRecursive().forEach((c) => c.updateDisplay?.());
      refreshVisibility();
    },
    refresh() {
      gui.controllersRecursive().forEach((c) => c.updateDisplay?.());
    },
  };
}
