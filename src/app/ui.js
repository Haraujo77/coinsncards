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
  const gui = new GUI({ width: 320, title: '3D Composer' });
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
  const fScene = gui.addFolder('Scene');
  fScene.add(root, 'preset', presetNames).name('Preset').onChange((name) => {
    onApplyPreset(name);
  });
  fScene.addColor(state.render, 'background').name('Background').onChange(onAnyChange);
  fScene.add(state.render, 'solid').name('Fill').onChange(onAnyChange);
  fScene.add(state.render, 'outline').name('Outline').onChange(onAnyChange);
  fScene.add(root, 'exportPng').name('Export PNG');
  fScene.add(root, 'savePreset').name('Save JSON');
  fScene.add(root, 'loadPreset').name('Load JSON');

  // 2. Object
  const fPiece = gui.addFolder('Object');
  fPiece.add(state.object, 'type', {
    Coin: ObjectType.COIN,
    Card: ObjectType.CARD,
    Icon: ObjectType.ICON,
  }).name('Type').onChange(onAnyChange);

  const fDisc = fPiece.addFolder('Coin');
  fDisc.add(state.disc, 'diameter', 0.1, 8, 0.01).name('Diameter').onChange(onAnyChange);
  fDisc.add(state.disc, 'thickness', 0.01, 2, 0.005).name('Thickness').onChange(onAnyChange);
  fDisc.add(state.disc, 'segments', 6, 128, 1).name('Segments').onChange(onAnyChange);
  fDisc.add(state.disc, 'varyEnabled').name('Variation').onChange(onAnyChange);

  const fCard = fPiece.addFolder('Card');
  fCard.add(state.card, 'width', 0.2, 10, 0.001).name('Width').onChange(onAnyChange);
  fCard.add(state.card, 'height', 0.2, 10, 0.001).name('Height').onChange(onAnyChange);
  fCard.add(state.card, 'thickness', 0.001, 1, 0.001).name('Thickness').onChange(onAnyChange);
  fCard.add(state.card, 'cornerRadius', 0, 0.49, 0.005).name('Corners').onChange(onAnyChange);

  const fIcon = fPiece.addFolder('Icon');
  fIcon.add(state.icon, 'size', 0.2, 8, 0.01).name('Size').onChange(onAnyChange);
  fIcon.add(state.icon, 'thickness', 0.01, 1, 0.005).name('Thickness').onChange(onAnyChange);
  fIcon.add(state.icon, 'cornerRadius', 0, 0.49, 0.005).name('Corners').onChange(onAnyChange);

  // 3. Layout — one type, only matching controls
  const fLayout = gui.addFolder('Layout');
  fLayout.add(state.distribution, 'type', {
    'Loop': DistributionType.LOOP,
    'Column': DistributionType.COLUMN,
    'Carousel': DistributionType.CAROUSEL,
    'Cover Flow': DistributionType.COVERFLOW,
    'Fan': DistributionType.FAN,
    'Hand': DistributionType.HAND_FAN,
    'Shelf': DistributionType.DIAGONAL_ROW,
    'Wave': DistributionType.WAVE_ROW,
    'Iso grid': DistributionType.ISO_GRID,
    'Iso breakdown': DistributionType.ISO_BREAKDOWN,
    'Vortex': DistributionType.GOLDEN_VORTEX,
    'Cascade': DistributionType.CASCADE,
    'Glitch grid': DistributionType.GLITCH_GRID,
    'Silhouette': DistributionType.SILHOUETTE,
    'Grid': DistributionType.GRID,
    'Circle': DistributionType.CIRCLE,
    'Ring': DistributionType.RING,
    'Cube': DistributionType.CUBE,
    'Sphere': DistributionType.SPHERE,
    'Shell': DistributionType.SPHERE_SHELL,
    'Spiral': DistributionType.SPIRAL,
    'Cylinder': DistributionType.CYLINDER,
    'Torus': DistributionType.TORUS,
  }).name('Pattern').onChange((v) => {
    if (v === DistributionType.COLUMN && state.distribution.columnCentered === false) {
      state.distribution.cornerBlend = 0;
    }
    onAnyChange();
  });

  const fLoop = fLayout.addFolder('Loop');
  fLoop.add(state.distribution, 'count', 1, 200, 1).name('Count').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopShape', Object.values(LoopShape)).name('Path').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopUseRadius').name('Use radius').onChange(onAnyChange);
  fLoop.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Radius').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopWidth', 0.5, 40, 0.05).name('Half width').onChange(onAnyChange);
  fLoop.add(state.distribution, 'loopDepth', 0.5, 40, 0.05).name('Half depth').onChange(onAnyChange);
  fLoop.add(state.distribution, 'cornerBlend', 0, 0.49, 0.01).name('Corner blend').onChange(onAnyChange);

  const fColumn = fLayout.addFolder('Column');
  fColumn.add(state.distribution, 'columnAxis', { X: 'x', Y: 'y', Z: 'z' }).name('Axis').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCount', 1, 200, 1).name('Count').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnSpacing', 0.01, 20, 0.01).name('Spacing').onChange(onAnyChange);
  fColumn.add(state.distribution, 'columnCentered').name('Centered').onChange(onAnyChange);

  const fCarousel = fLayout.addFolder('Carousel');
  fCarousel.add(state.distribution, 'carouselCount', 1, 64, 1).name('Per ring').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRadius', 0.5, 40, 0.05).name('Radius').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselFaceOut').name('Face out').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRings', 1, 6, 1).name('Y rings').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRingSpacing', 0.2, 12, 0.05).name('Y spacing').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselRingPhaseDeg', 0, 180, 1).name('Ring phase').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselNested', 1, 5, 1).name('Nested rings').onChange(onAnyChange);
  fCarousel.add(state.distribution, 'carouselNestedGap', 0.4, 12, 0.05).name('Radius gap').onChange(onAnyChange);

  const fCoverflow = fLayout.addFolder('Cover Flow');
  fCoverflow.add(state.distribution, 'coverflowCount', 1, 64, 1).name('Count').onChange(onAnyChange);
  fCoverflow.add(state.distribution, 'coverflowRadius', 0.5, 40, 0.05).name('Radius').onChange(onAnyChange);
  fCoverflow.add(state.distribution, 'coverflowSpreadDeg', 20, 180, 1).name('Spread').onChange(onAnyChange);

  const fFan = fLayout.addFolder('Fan');
  fFan.add(state.distribution, 'fanCount', 1, 64, 1).name('Count').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanSpacing', 0.05, 5, 0.01).name('Spacing').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanDepth', 0, 2, 0.01).name('Depth').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanSpreadDeg', 10, 180, 1).name('Spread').onChange(onAnyChange);
  fFan.add(state.distribution, 'fanRadius', 0.4, 20, 0.05).name('Fan radius').onChange(onAnyChange);

  const fRow = fLayout.addFolder('Row');
  fRow.add(state.distribution, 'rowCount', 1, 200, 1).name('Count').onChange(onAnyChange);
  fRow.add(state.distribution, 'rowSpacing', 0.05, 10, 0.01).name('Spacing').onChange(onAnyChange);
  fRow.add(state.distribution, 'heroSpacing', 0, 4, 0.01).name('Peak gap').onChange(onAnyChange);
  fRow.add(state.distribution, 'rowAngleDeg', -90, 90, 1).name('Angle').onChange(onAnyChange);
  fRow.add(state.distribution, 'waveAmplitude', 0, 24, 0.05).name('Weave').onChange(onAnyChange);
  fRow.add(state.distribution, 'heroLift', 0, 4, 0.01).name('Rise').onChange(onAnyChange);
  fRow.add(state.distribution, 'heroIndex', 0, 199, 1).name('Hero').onChange(onAnyChange);
  fRow.add(state.distribution, 'heroDetach', 0, 4, 0.01).name('Pop').onChange(onAnyChange);

  const fIso = fLayout.addFolder('Iso grid');
  fIso.add(state.distribution, 'isoCountX', 1, 24, 1).name('X count').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoCountZ', 1, 24, 1).name('Z count').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoSpacingX', 0.2, 12, 0.05).name('X spacing').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoSpacingZ', 0.2, 12, 0.05).name('Z spacing').onChange(onAnyChange);
  fIso.add(state.distribution, 'isoRowOffset', 0, 1, 0.01).name('Row offset').onChange(onAnyChange);

  const fBreak = fLayout.addFolder('Breakdown');
  fBreak.add(state.distribution, 'breakdownCount', 2, 48, 1).name('Count').onChange(onAnyChange);
  fBreak.add(state.distribution, 'breakdownSpacing', 0.2, 8, 0.01).name('Spacing').onChange(onAnyChange);
  fBreak.add(state.distribution, 'breakdownAngleDeg', 0, 90, 1).name('Axis').onChange(onAnyChange);
  fBreak.add(state.distribution, 'breakdownExplode', 0, 3, 0.01).name('Explode').onChange(onAnyChange);
  fBreak.add(state.distribution, 'breakdownTwistDeg', 0, 120, 1).name('Twist').onChange(onAnyChange);

  const fVortex = fLayout.addFolder('Vortex');
  fVortex.add(state.distribution, 'vortexCount', 8, 240, 1).name('Count').onChange(onAnyChange);
  fVortex.add(state.distribution, 'vortexRadius', 0.5, 24, 0.05).name('Radius').onChange(onAnyChange);
  fVortex.add(state.distribution, 'vortexTurns', 0.5, 8, 0.05).name('Turns').onChange(onAnyChange);
  fVortex.add(state.distribution, 'vortexScaleIn', 0.02, 1, 0.01).name('Core scale').onChange(onAnyChange);
  fVortex.add(state.distribution, 'vortexDepth', 0, 8, 0.05).name('Depth').onChange(onAnyChange);

  const fCascade = fLayout.addFolder('Cascade');
  fCascade.add(state.distribution, 'cascadeCount', 4, 120, 1).name('Count').onChange(onAnyChange);
  fCascade.add(state.distribution, 'cascadeHeight', 2, 40, 0.1).name('Height').onChange(onAnyChange);
  fCascade.add(state.distribution, 'cascadeSpread', 0, 10, 0.05).name('Spread').onChange(onAnyChange);
  fCascade.add(state.distribution, 'cascadeDrift', 0, 8, 0.05).name('Z drift').onChange(onAnyChange);

  const fGlitch = fLayout.addFolder('Glitch');
  fGlitch.add(state.distribution, 'glitchCountX', 1, 24, 1).name('X count').onChange(onAnyChange);
  fGlitch.add(state.distribution, 'glitchCountZ', 1, 24, 1).name('Z count').onChange(onAnyChange);
  fGlitch.add(state.distribution, 'glitchSpacing', 0.2, 6, 0.01).name('Spacing').onChange(onAnyChange);
  fGlitch.add(state.distribution, 'glitchIndex', 0, 575, 1).name('Index').onChange(onAnyChange);
  fGlitch.add(state.distribution, 'glitchRotDeg', -180, 180, 1).name('Twist').onChange(onAnyChange);
  fGlitch.add(state.distribution, 'glitchLift', 0, 4, 0.01).name('Lift').onChange(onAnyChange);

  const fSil = fLayout.addFolder('Silhouette');
  fSil.add(state.distribution, 'silCount', 8, 600, 1).name('Max count').onChange(onAnyChange);
  fSil.add(state.distribution, 'silRadius', 0.5, 16, 0.05).name('Radius').onChange(onAnyChange);
  fSil.add(state.distribution, 'silOverlap', 0, 0.85, 0.01).name('Overlap').onChange(onAnyChange);
  fSil.add(state.distribution, 'silPower', 2, 8, 0.1).name('Squircle').onChange(onAnyChange);
  fSil.add(state.distribution, 'silStack', 0, 1.5, 0.01).name('Stack').onChange(onAnyChange);

  const fGrid = fLayout.addFolder('Grid / cube');
  fGrid.add(state.distribution, 'countX', 1, 80, 1).name('X count').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countY', 1, 80, 1).name('Y count').onChange(onAnyChange);
  fGrid.add(state.distribution, 'countZ', 1, 80, 1).name('Z count').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingX', 0.1, 10, 0.01).name('X spacing').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingY', 0.1, 10, 0.01).name('Y spacing').onChange(onAnyChange);
  fGrid.add(state.distribution, 'spacingZ', 0.1, 10, 0.01).name('Z spacing').onChange(onAnyChange);

  const fRadial = fLayout.addFolder('Radial');
  fRadial.add(state.distribution, 'count', 1, 500, 1).name('Count').onChange(onAnyChange);
  fRadial.add(state.distribution, 'radius', 0.1, 80, 0.01).name('Radius').onChange(onAnyChange);
  fRadial.add(state.distribution, 'innerRadius', 0.1, 80, 0.01).name('Inner radius').onChange(onAnyChange);
  fRadial.add(state.distribution, 'height', 0.1, 80, 0.01).name('Height').onChange(onAnyChange);
  fRadial.add(state.distribution, 'turns', 0.1, 40, 0.01).name('Turns').onChange(onAnyChange);

  const fSphere = fLayout.addFolder('Sphere');
  fSphere.add(state.distribution, 'count', 1, 500, 1).name('Count').onChange(onAnyChange);
  fSphere.add(state.distribution, 'sphereRadius', 0.1, 80, 0.01).name('Radius').onChange(onAnyChange);
  fSphere.add(state.distribution, 'shellThickness', 0.01, 40, 0.01).name('Shell').onChange(onAnyChange);

  // 4. Orientation
  const fMotion = gui.addFolder('Orientation');
  fMotion.add(state.orientation, 'mode', Object.values(OrientationMode)).name('Face').onChange(onAnyChange);
  degController(fMotion, state.orientation, 'extraRotX', 'Tilt', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'yawDeg', 'Yaw', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'extraRotY', 'Extra Y', -180, 180, 1, onAnyChange);
  degController(fMotion, state.orientation, 'extraRotZ', 'Extra Z', -180, 180, 1, onAnyChange);
  fMotion.add(state.stagger, 'enabled').name('Stagger').onChange(onAnyChange);
  fMotion.add(state.stagger, 'axis', { X: 'x', Y: 'y', Z: 'z' }).name('Axis').onChange(onAnyChange);
  fMotion.add(state.stagger, 'source', Object.values(StaggerSource)).name('By').onChange(onAnyChange);
  fMotion.add(state.stagger, 'amountDeg', -1440, 1440, 1).name('Amount').onChange(onAnyChange);

  // 5. Camera
  const fCamera = gui.addFolder('Camera');
  degController(fCamera, state.camera, 'azimuthDeg', 'Orbit', -180, 180, 0.1, onAnyChange);
  degController(fCamera, state.camera, 'polarDeg', 'Elevation', 1, 179, 0.1, onAnyChange);
  fCamera.add(state.camera, 'distance', 0.5, 300, 0.01).name('Distance').onChange(onAnyChange);
  fCamera.add(state.camera, 'lockFraming').name('Lock frame').onChange(onAnyChange);
  fCamera.add(root, 'cameraFrame').name('Frame');
  fCamera.close();

  // 6. More — advanced, closed
  const fMore = gui.addFolder('Advanced');
  fMore.add(state.transform, 'scale', 0.05, 10, 0.01).name('Scale').onChange(onAnyChange);
  fMore.add(state.transform, 'positionX', -80, 80, 0.01).name('X').onChange(onAnyChange);
  fMore.add(state.transform, 'positionY', -80, 80, 0.01).name('Y').onChange(onAnyChange);
  fMore.add(state.transform, 'positionZ', -80, 80, 0.01).name('Z').onChange(onAnyChange);
  degController(fMore, state.transform, 'rotY', 'Y rotation', -180, 180, 1, onAnyChange);
  fMore.add(state.collision, 'mode', Object.values(CollisionMode)).name('Collision').onChange(onAnyChange);
  fMore.add(state.export, 'scale', 1, 8, 1).name('Export scale').onChange(onAnyChange);
  fMore.add(state.render, 'transparentExport').name('Clear PNG').onChange(onAnyChange);
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
    setFolderVisible(fFan, type === DistributionType.FAN || type === DistributionType.HAND_FAN);
    setFolderVisible(fRow, type === DistributionType.DIAGONAL_ROW || type === DistributionType.WAVE_ROW);
    setFolderVisible(fIso, type === DistributionType.ISO_GRID);
    setFolderVisible(fBreak, type === DistributionType.ISO_BREAKDOWN);
    setFolderVisible(fVortex, type === DistributionType.GOLDEN_VORTEX);
    setFolderVisible(fCascade, type === DistributionType.CASCADE);
    setFolderVisible(fGlitch, type === DistributionType.GLITCH_GRID);
    setFolderVisible(fSil, type === DistributionType.SILHOUETTE);
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
