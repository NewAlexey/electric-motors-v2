import { getState, setState, subscribe } from './state.js';
import { matShaft, matCore, matDark } from './materials.js';
import { createStage } from './core/stage.js';
import { createFrame } from './core/frame.js';
import { buildCore } from './parts/core.js';
import { buildShafts } from './parts/shaft.js';
import { buildCommutator } from './parts/commutator.js';
import { buildWinding } from './parts/winding.js';
import { createBrushes } from './parts/brushes.js';
import { createNumbers } from './parts/numbers.js';
import { createOrbitControls } from './ui/controls.js';
import { bindPanel } from './ui/panel.js';
import { createPicker } from './interaction/picking.js';
import { startLoop } from './loop.js';

const app = document.getElementById('app');

// Сцена, камера, рендерер, свет
const { scene, camera, renderer } = createStage(app);

// Рама (неподвижные щётки) и якорь (вращается)
const { motorFrame, armature } = createFrame(scene);

// Детали якоря
buildCore(armature, matCore, matDark);
buildShafts(armature, matShaft);
const { segMeshes, riserMeshes } = buildCommutator(armature, matDark);
const coilMeshes = buildWinding(armature);

// Кликабельные объекты: провода, ламели и петушки
const pickables = [...coilMeshes, ...segMeshes, ...riserMeshes];

// Щётки (в раме) и номера ламелей (в якоре)
const brushes = createBrushes(motorFrame);
const numbers = createNumbers(armature);

// Управление камерой
const controls = createOrbitControls(camera, renderer.domElement);

// Панель настроек
bindPanel({
  onReset: () => { armature.rotation.x = 0; },
});

// Выбор провода кликом (повторный клик — снять выделение)
createPicker({
  domElement: renderer.domElement,
  camera,
  objects: pickables,
  onPick: (idx) => {
    const current = getState().selectedCoil;
    setState({ selectedCoil: idx === null ? null : (current === idx ? null : idx) });
  },
});

// Реакция на изменение состояния: полюса щёток и номера ламелей
subscribe((s) => {
  brushes.apply(s.reversed);
  numbers.setVisible(s.numsVisible);
  numbers.setDistance(s.numDist);
});

// Запуск цикла рендера
startLoop({
  scene,
  camera,
  renderer,
  controls,
  armature,
  meshes: { segments: segMeshes, risers: riserMeshes, coils: coilMeshes },
});
