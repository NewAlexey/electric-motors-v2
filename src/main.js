import * as THREE from 'three';
import { getState, setState, subscribe } from './state.js';
import { setWindingParams } from './config.js';
import { matShaft, matCore, matDark } from './materials.js';
import { createStage } from './core/stage.js';
import { createFrame } from './core/frame.js';
import { buildCore } from './parts/core.js';
import { buildShafts } from './parts/shaft.js';
import { buildCommutator } from './parts/commutator.js';
import { createWinding } from './parts/winding.js';
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

// Вал не зависит от обмотки — строится один раз; якорь, коллектор, обмотка и
// номера ламелей зависят от числа пазов/ламелей и пересобираются.
const shaftGroup = new THREE.Group();
const partsGroup = new THREE.Group();
const numbersGroup = new THREE.Group();
armature.add(shaftGroup, partsGroup, numbersGroup);

buildShafts(shaftGroup, matShaft);

// Щётки (в раме)
const brushes = createBrushes(motorFrame);

// Управление камерой
const controls = createOrbitControls(camera, renderer.domElement);

// Изменяемые ссылки (обновляются при пересборке)
const meshes = { segments: [], risers: [], coils: [] };
let winding = null;
let numbers = null;

// Кликабельные объекты: провода, ламели и петушки (список берётся динамически)
const getPickables = () => [...meshes.coils, ...meshes.segments, ...meshes.risers];

// Материалы, которыми владеет materials.js — их нельзя уничтожать.
const keepMaterials = new Set([matShaft, matCore, matDark]);

function clearGroup(group) {
  for (const child of [...group.children]) {
    group.remove(child);
    child.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (!o.material) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) {
        if (keepMaterials.has(m)) continue;
        if (m.map) m.map.dispose();
        m.dispose();
      }
    });
  }
}

// Полная пересборка якоря под текущие slots/coilsPerSlot.
function rebuildArmature() {
  const s = getState();
  if (setWindingParams(s.slots, s.coilsPerSlot) === null) return;

  clearGroup(partsGroup);
  clearGroup(numbersGroup);

  buildCore(partsGroup, matCore, matDark);
  const { segMeshes, riserMeshes } = buildCommutator(partsGroup, matDark);
  winding = createWinding(partsGroup, s.commPitch);
  numbers = createNumbers(numbersGroup);

  meshes.segments = segMeshes;
  meshes.risers = riserMeshes;
  meshes.coils = winding.coils;

  numbers.setVisible(s.numsVisible);
  numbers.setDistance(s.numDist);
}

rebuildArmature();

// Выбор провода кликом (повторный клик — снять выделение)
createPicker({
  domElement: renderer.domElement,
  camera,
  getObjects: getPickables,
  onPick: (idx) => {
    const current = getState().selectedCoil;
    setState({ selectedCoil: idx === null ? null : (current === idx ? null : idx) });
  },
});

// Панель настроек
bindPanel({
  onReset: () => { armature.rotation.x = 0; },
});

// Реакция на изменение состояния: полюса щёток, номера ламелей, шаг по
// коллектору и параметры обмотки (полная пересборка якоря).
let lastPitch = getState().commPitch;
let lastSlots = getState().slots;
let lastU = getState().coilsPerSlot;
subscribe((s) => {
  brushes.apply(s.reversed, s.currentColors);

  if (s.slots !== lastSlots || s.coilsPerSlot !== lastU) {
    lastSlots = s.slots;
    lastU = s.coilsPerSlot;
    lastPitch = s.commPitch;
    rebuildArmature();
    return;
  }

  numbers.setVisible(s.numsVisible);
  numbers.setDistance(s.numDist);
  if (s.commPitch !== lastPitch) {
    lastPitch = s.commPitch;
    winding.setPitch(s.commPitch);
  }
});

// Запуск цикла рендера
startLoop({
  scene,
  camera,
  renderer,
  controls,
  armature,
  meshes,
});
