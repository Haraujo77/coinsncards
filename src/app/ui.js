import GUI from 'lil-gui';
import { listPresetNames, getPresetByName } from './presets.js';
import { CollisionMode, DistributionType, FillMode, LoopShape, ObjectType, OrientationMode, StaggerCurve, StaggerSource } from './state.js';

function degController(gui, obj, key, name, min, max, step, onChange) {
  return gui.add(obj, key, min, max, step).name(name).onChange(onChange);
}

export function createUi({ state, onAnyChange, onApplyPreset, onExport, onSavePreset, onLoadPreset, onCameraCapture, onCameraReset }) {
  const gui = new GUI({ width: 360, title: 'Controls' });
  gui.domElement.style.position = 'absolute';
  gui.domElement.style.right = '12px';
  gui.domElement.style.top = '12px';

  const presetNames = listPresetNames();
  const root = {
    preset: state.preset,
    applyPreset: () => onApplyPreset(root.preset),
    exportPng: () => onExport(),
    savePreset: () => onSavePreset?.(),
    loadPreset: () => onLoadPreset?.(),
    cameraCapture: () => onCameraCapture?.(),
    cameraReset: () => onCameraReset?.(),
    cameraFrame: () => onAnyChange?.('__cameraFrame__'),
  };

  const fPreset = gui.addFolder('Presets');
  fPreset.add(root, 'preset', presetNames).name('Preset');
  fPreset.add(root, 'applyPreset').name('Aplicar');
  fPreset.add(root, 'savePreset').name('Salvar preset (JSON)');
  fPreset.add(root, 'loadPreset').name('Carregar preset (JSON)');

  const fExport = gui.addFolder('Export');
  fExport.add(state.export, 'scale', 1, 8, 1).name('Res (x)').onChange(onAnyChange);
  fExport.add(state.export, 'filename').name('Arquivo').onFinishChange(onAnyChange);
  fExport.add(state.render, 'transparentExport').name('Fundo transparente').onChange(onAnyChange);
  fExport.add(root, 'exportPng').name('Export PNG');

  const fRender = gui.addFolder('Visual');
  fRender.addColor(state.render, 'background').name('Background').onChange(onAnyChange);
  fRender.add(state.render, 'solid').name('Sólido').onChange(onAnyChange);
  fRender.add(state.render, 'outline').name('Outline').onChange(onAnyChange);
  fRender.add(state.render, 'outlineWireframe').name('Wireframe').onChange(onAnyChange);

  const fObject = gui.addFolder('Objeto');
  fObject.add(state.object, 'type', Object.values(ObjectType)).name('Tipo').onChange(onAnyChange);

  const fDisc = gui.addFolder('Coin / Disco');
  fDisc.add(state.disc, 'diameter', 0.1, 8, 0.01).name('Diâmetro').onChange(onAnyChange);
  fDisc.add(state.disc, 'thickness', 0.01, 2, 0.005).name('Espessura').onChange(onAnyChange);
  fDisc.add(state.disc, 'segments', 6, 128, 1).name('Segmentos').onChange(onAnyChange);
  fDisc.add(state.disc, 'varyEnabled').name('Variação').onChange(onAnyChange);
  fDisc.add(state.disc, 'varyDiameter', 0, 0.5, 0.005).name('Var diâmetro').onChange(onAnyChange);
  fDisc.add(state.disc, 'varyThickness', 0, 0.5, 0.005).name('Var espessura').onChange(onAnyChange);

  const fCard = gui.addFolder('Card');
  fCard.add(state.card, 'width', 0.2, 10, 0.001).name('Largura').onChange(onAnyChange);
  fCard.add(state.card, 'height', 0.2, 10, 0.001).name('Altura').onChange(onAnyChange);
  fCard.add(state.card, 'thickness', 0.001, 1, 0.001).name('Espessura').onChange(onAnyChange);
  fCard.add(state.card, 'cornerRadius', 0, 0.49, 0.005).name('Corner radius').onChange(onAnyChange);
  fCard.add(state.card, 'segments', 1, 16, 1).name('Segmentos').onChange(onAnyChange);
  fCard.add(state.card, 'varyEnabled').name('Variação').onChange(onAnyChange);
  fCard.add(state.card, 'varyWidth', 0, 0.5, 0.005).name('Var largura').onChange(onAnyChange);
  fCard.add(state.card, 'varyHeight', 0, 0.5, 0.005).name('Var altura').onChange(onAnyChange);
  fCard.add(state.card, 'varyThickness', 0, 0.5, 0.005).name('Var espessura').onChange(onAnyChange);
  fCard.add(state.card, 'varyCornerRadius', 0, 1.0, 0.01).name('Var corner').onChange(onAnyChange);

  const fIcon = gui.addFolder('Icon (rounded square)');
  fIcon.add(state.icon, 'size', 0.2, 8, 0.01).name('Tamanho').onChange(onAnyChange);
  fIcon.add(state.icon, 'thickness', 0.01, 1, 0.005).name('Espessura').onChange(onAnyChange);
  fIcon.add(state.icon, 'cornerRadius', 0, 0.49, 0.005).name('Corner radius').onChange(onAnyChange);
  fIcon.add(state.icon, 'segments', 1, 16, 1).name('Segmentos').onChange(onAnyChange);
  fIcon.add(state.icon, 'varyEnabled').name('Variação').onChange(onAnyChange);
  fIcon.add(state.icon, 'varySize', 0, 0.5, 0.005).name('Var tamanho').onChange(onAnyChange);
  fIcon.add(state.icon, 'varyThickness', 0, 0.5, 0.005).name('Var espessura').onChange(onAnyChange);

  const fDist = gui.addFolder('Distribuição');
  fDist.add(state.distribution, 'type', Object.values(DistributionType)).name('Tipo').onChange((v) => {
    if (v === DistributionType.COLUMN && state.distribution.columnCentered === false) {
      state.distribution.cornerBlend = 0;
    }
    onAnyChange();
  });
  fDist.add(state.distribution, 'fillMode', Object.values(FillMode)).name('Fill/Outline').onChange(onAnyChange);
  fDist.add(state.distribution, 'seed', 1, 9999, 1).name('Seed').onChange(onAnyChange);
  fDist.add(state.distribution, 'jitter', 0, 2, 0.01).name('Jitter').onChange(onAnyChange);

  const fGrid = fDist.addFolder('Grid/Cubo');
  fGrid.add(state.distribution, 'countX', 1, 200, 1).name('Qtd X').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countY', 1, 200, 1).name('Qtd Y').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countZ', 1, 200, 1).name('Qtd Z').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingX', 0.1, 10, 0.01).name('Espaço X').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingY', 0.1, 10, 0.01).name('Espaço Y').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingZ', 0.1, 10, 0.01).name('Espaço Z').onChange(onAnyChange);
  fGrid.add(state.distribution, 'alternateOffset').name('Offset alternado').onChange(onAnyChange);
  fGrid.add(state.distribution, 'offsetXPerRow', -5, 5, 0.01).name('Offset X/linha').onChange(onAnyChange);
  fGrid.add(state.distribution, 'offsetZPerCol', -5, 5, 0.01).name('Offset Z/col').onChange(onAnyChange);
  fGrid.add(state.distribution, 'offsetYPerLayer', -5, 5, 0.01).name('Offset Y/camada').onChange(onAnyChange);

  const fColumn = fDist.addFolder('Column');
  fColumn.add(state.distribution, 'columnAxis', { x: 'x', y: 'y', z: 'z' }).name('Eixo').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCount', 1, 5000, 1).name('Qtd').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnSpacing', 0.01, 20, 0.01).name('Espaçamento').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCentered').name('Centrada (espelhada)').onChange((v) => {
    // Coluna não tem cantos: evita confusão com suavização de polígonos ao usar coluna “só para frente”.
    if (state.distribution.type === DistributionType.COLUMN && v === false) {
      state.distribution.cornerBlend = 0;
    }
    onAnyChange();
  });

  const fMarket = fDist.addFolder('Marketplace layouts');
  fMarket.add(state.distribution, 'carouselCount', 1, 64, 1).name('Carousel qtd').onChange(onAnyChange);
  fMarket.add(state.distribution, 'carouselRadius', 0.5, 40, 0.05).name('Carousel raio').onChange(onAnyChange);
  fMarket.add(state.distribution, 'carouselY', -20, 20, 0.05).name('Carousel Y').onChange(onAnyChange);
  fMarket.add(state.distribution, 'carouselFaceOut').name('Carousel face out').onChange(onAnyChange);
  fMarket.add(state.distribution, 'coverflowCount', 1, 64, 1).name('Coverflow qtd').onChange(onAnyChange);
  fMarket.add(state.distribution, 'coverflowRadius', 0.5, 40, 0.05).name('Coverflow raio').onChange(onAnyChange);
  fMarket.add(state.distribution, 'coverflowSpreadDeg', 20, 180, 1).name('Coverflow spread °').onChange(onAnyChange);
  fMarket.add(state.distribution, 'fanCount', 1, 64, 1).name('Fan qtd').onChange(onAnyChange);
  fMarket.add(state.distribution, 'fanSpacing', 0.05, 5, 0.01).name('Fan spacing').onChange(onAnyChange);
  fMarket.add(state.distribution, 'fanDepth', 0, 2, 0.01).name('Fan depth Z').onChange(onAnyChange);
  fMarket.add(state.distribution, 'rowCount', 1, 64, 1).name('Row qtd').onChange(onAnyChange);
  fMarket.add(state.distribution, 'rowSpacing', 0.1, 10, 0.01).name('Row spacing').onChange(onAnyChange);
  fMarket.add(state.distribution, 'rowAngleDeg', -90, 90, 1).name('Diagonal ângulo °').onChange(onAnyChange);
  fMarket.add(state.distribution, 'rowTiltDeg', -45, 45, 1).name('Diagonal tilt °').onChange(onAnyChange);
  fMarket.add(state.distribution, 'waveAmplitude', 0, 8, 0.05).name('Wave amplitude').onChange(onAnyChange);
  fMarket.add(state.distribution, 'waveLength', 0.1, 6, 0.05).name('Wave length').onChange(onAnyChange);
  fMarket.add(state.distribution, 'isoCountX', 1, 24, 1).name('Iso grid X').onChange(onAnyChange);
  fMarket.add(state.distribution, 'isoCountZ', 1, 24, 1).name('Iso grid Z').onChange(onAnyChange);
  fMarket.add(state.distribution, 'isoSpacingX', 0.2, 12, 0.05).name('Iso espaço X').onChange(onAnyChange);
  fMarket.add(state.distribution, 'isoSpacingZ', 0.2, 12, 0.05).name('Iso espaço Z').onChange(onAnyChange);
  fMarket.add(state.distribution, 'isoRowOffset', 0, 1, 0.01).name('Iso offset linha').onChange(onAnyChange);

  const fLoop = fDist.addFolder('Loop (oval / retângulo / polígonos)');
  fLoop.add(state.distribution, 'loopShape', Object.values(LoopShape)).name('Forma do loop').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopUseRadius').name('Usar raio (círculo)').onChange(onAnyChange);
  fLoop.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Raio (círculo)').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopWidth', 0.5, 40, 0.05).name('Largura ½ (X)').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopDepth', 0.5, 40, 0.05).name('Profundidade ½ (Z)').onChange(onAnyChange);
  fLoop.add(state.distribution, 'cornerBlend', 0, 0.49, 0.01).name('Suavizar cantos').onChange(onAnyChange);
  fLoop.add(state.distribution, 'starPoints', 3, 16, 1).name('Pontas estrela').onChange(onAnyChange);
  fLoop.add(state.distribution, 'starInnerRatio', 0.1, 0.95, 0.01).name('Estrela raio interno').onChange(onAnyChange);

  const fRadial = fDist.addFolder('Radial / espiral / anel');
  fRadial.add(state.distribution, 'count', 1, 5000, 1).name('Instâncias').onChange(onAnyChange);
  fRadial.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Raio').onChange(onAnyChange);
  fRadial.add(state.distribution, 'innerRadius', 0.1, 80, 0.01).name('Raio interno').onChange(onAnyChange);
  fRadial.add(state.distribution, 'height', 0.1, 80, 0.01).name('Altura').onChange(onAnyChange);
  fRadial.add(state.distribution, 'turns', 0.1, 40, 0.01).name('Voltas').onChange(onAnyChange);

  const fSphere = fDist.addFolder('Esfera');
  fSphere.add(state.distribution, 'sphereRadius', 0.1, 80, 0.01).name('Raio').onChange(onAnyChange);
  fSphere.add(state.distribution, 'shellThickness', 0.01, 40, 0.01).name('Casca (esp)').onChange(onAnyChange);

  const fOrient = gui.addFolder('Orientação');
  fOrient.add(state.orientation, 'mode', Object.values(OrientationMode)).name('Modo').onChange(onAnyChange);
  degController(fOrient, state.orientation, 'extraRotX', 'Extra X (°)', -180, 180, 1, onAnyChange);
  degController(fOrient, state.orientation, 'extraRotY', 'Extra Y (°)', -180, 180, 1, onAnyChange);
  degController(fOrient, state.orientation, 'extraRotZ', 'Extra Z (°)', -180, 180, 1, onAnyChange);

  const fTransform = gui.addFolder('Transform');
  fTransform.add(state.transform, 'positionX', -50, 50, 0.01).name('Pos X').onChange(onAnyChange);
  fTransform.add(state.transform, 'positionY', -50, 50, 0.01).name('Pos Y').onChange(onAnyChange);
  fTransform.add(state.transform, 'positionZ', -50, 50, 0.01).name('Pos Z').onChange(onAnyChange);
  fTransform.add(state.transform, 'scale', 0.05, 10, 0.01).name('Escala').onChange(onAnyChange);
  degController(fTransform, state.transform, 'rotX', 'Rot X (°)', -180, 180, 1, onAnyChange);
  degController(fTransform, state.transform, 'rotY', 'Rot Y (°)', -180, 180, 1, onAnyChange);
  degController(fTransform, state.transform, 'rotZ', 'Rot Z (°)', -180, 180, 1, onAnyChange);

  const fCamera = gui.addFolder('Câmera');
  fCamera.add(state.camera, 'lockFraming').name('Travar framing').onChange(onAnyChange);
  fCamera.add(state.camera, 'syncFromOrbit').name('Sync do drag').onChange(onAnyChange);
  degController(fCamera, state.camera, 'azimuthDeg', 'Azimuth (°)', -180, 180, 0.1, onAnyChange);
  degController(fCamera, state.camera, 'polarDeg', 'Polar (°)', 1, 179, 0.1, onAnyChange);
  fCamera.add(state.camera, 'distance', 0.5, 300, 0.01).name('Distância').onChange(onAnyChange);
  fCamera.add(state.camera, 'targetX', -100, 100, 0.01).name('Target X').onChange(onAnyChange);
  fCamera.add(state.camera, 'targetY', -100, 100, 0.01).name('Target Y').onChange(onAnyChange);
  fCamera.add(state.camera, 'targetZ', -100, 100, 0.01).name('Target Z').onChange(onAnyChange);
  fCamera.add(root, 'cameraCapture').name('Capturar view atual');
  fCamera.add(root, 'cameraReset').name('Reset view');
  fCamera.add(root, 'cameraFrame').name('Enquadrar composição');

  const fStagger = gui.addFolder('Stagger / Progressão');
  fStagger.add(state.stagger, 'enabled').name('Ativo').onChange(onAnyChange);
  fStagger.add(state.stagger, 'axis', { x: 'x', y: 'y', z: 'z' }).name('Eixo').onChange(onAnyChange);
  fStagger.add(state.stagger, 'source', Object.values(StaggerSource)).name('Fonte').onChange(onAnyChange);
  fStagger.add(state.stagger, 'curve', Object.values(StaggerCurve)).name('Curva').onChange(onAnyChange);
  fStagger.add(state.stagger, 'amountDeg', -1440, 1440, 1).name('Intensidade (°)').onChange(onAnyChange);
  fStagger.add(state.stagger, 'falloff', 0.1, 6, 0.01).name('Falloff').onChange(onAnyChange);
  fStagger.add(state.stagger, 'direction', { '+1': 1, '-1': -1 }).name('Direção').onChange(onAnyChange);
  fStagger.add(state.stagger, 'noiseScale', 0.01, 2.0, 0.01).name('Noise scale').onChange(onAnyChange);
  fStagger.add(state.stagger, 'noiseStrength', 0, 2.0, 0.01).name('Noise strength').onChange(onAnyChange);
  fStagger.add(state.stagger, 'sineFreq', 0.1, 10.0, 0.01).name('Sine freq').onChange(onAnyChange);
  fStagger.add(state.stagger, 'sinePhase', 0, 360, 1).name('Sine phase (°)').onChange(onAnyChange);

  const fCol = gui.addFolder('Colisão');
  fCol.add(state.collision, 'mode', Object.values(CollisionMode)).name('Modo').onChange(onAnyChange);
  fCol.add(state.collision, 'padding', 0, 1, 0.005).name('Padding').onChange(onAnyChange);
  fCol.add(state.collision, 'iterations', 0, 40, 1).name('Iterações').onChange(onAnyChange);
  fCol.add(state.collision, 'cellSize', 0.1, 10, 0.01).name('Cell size').onChange(onAnyChange);
  fCol.add(state.collision, 'maxPush', 0.01, 2.0, 0.01).name('Max push').onChange(onAnyChange);
  fCol.add(state.collision, 'autoIncreaseSpacing').name('Auto spacing').onChange(onAnyChange);
  fCol.add(state.collision, 'maxAutoSpacingFactor', 1, 5, 0.01).name('Max spacing x').onChange(onAnyChange);

  // Small quality-of-life: hide irrelevant folders based on distribution type
  function refreshVisibility() {
    const type = state.distribution.type;
    const obj = state.object?.type ?? ObjectType.COIN;
    const isGrid = type === DistributionType.GRID || type === DistributionType.CUBE || type === DistributionType.DIAMOND || type === DistributionType.SQUARE;
    const isLoop = type === DistributionType.LOOP;
    const isColumn = type === DistributionType.COLUMN;
    const isMarket =
      type === DistributionType.CAROUSEL ||
      type === DistributionType.COVERFLOW ||
      type === DistributionType.FAN ||
      type === DistributionType.DIAGONAL_ROW ||
      type === DistributionType.WAVE_ROW ||
      type === DistributionType.ISO_GRID;
    const isRadial =
      type === DistributionType.CIRCLE ||
      type === DistributionType.RING ||
      type === DistributionType.SPIRAL ||
      type === DistributionType.CYLINDER ||
      type === DistributionType.TORUS ||
      isLoop;
    const isSphere = type === DistributionType.SPHERE || type === DistributionType.SPHERE_SHELL;

    fGrid.domElement.style.display = isGrid ? '' : 'none';
    fLoop.domElement.style.display = isLoop ? '' : 'none';
    fColumn.domElement.style.display = isColumn ? '' : 'none';
    fMarket.domElement.style.display = isMarket ? '' : 'none';
    fRadial.domElement.style.display = isRadial ? '' : 'none';
    fSphere.domElement.style.display = isSphere ? '' : 'none';
    fDisc.domElement.style.display = obj === ObjectType.COIN ? '' : 'none';
    fCard.domElement.style.display = obj === ObjectType.CARD ? '' : 'none';
    fIcon.domElement.style.display = obj === ObjectType.ICON ? '' : 'none';
  }

  const oldOnAny = onAnyChange;
  const onAnyChangeWrapped = () => {
    refreshVisibility();
    oldOnAny();
  };

  // Rebind: keep it simple by hooking refresh to a timer
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
    },
    refresh() {
      gui.controllersRecursive().forEach((c) => c.updateDisplay?.());
    },
    onAnyChangeWrapped,
  };
}

