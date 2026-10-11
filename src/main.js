import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const app = document.getElementById('app');

// ---------- Сцена ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b202b);
scene.fog = new THREE.Fog(0x1b202b, 1100, 2200);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  5000
);
camera.position.set(320, 260, 620);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
app.appendChild(renderer.domElement);

// ---------- Свет ----------
scene.add(new THREE.HemisphereLight(0xdce6ff, 0x2a3140, 1.6));

const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(400, 520, 620);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 100;
key.shadow.camera.far = 2200;
key.shadow.camera.left = -600;
key.shadow.camera.right = 600;
key.shadow.camera.top = 600;
key.shadow.camera.bottom = -600;
scene.add(key);

const fill = new THREE.DirectionalLight(0xa8c0ff, 1.4);
fill.position.set(-500, -120, -400);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffc088, 1.6);
rim.position.set(-300, 260, -520);
scene.add(rim);

// Мягкая заливающая подсветка сверху
const top = new THREE.DirectionalLight(0xffffff, 1.1);
top.position.set(0, 700, 0);
scene.add(top);

// Точечный источник для бликов на металле
const point = new THREE.PointLight(0xffffff, 900, 2500, 2);
point.position.set(150, 420, 480);
scene.add(point);

// ---------- Материалы ----------
const matShaft = new THREE.MeshStandardMaterial({
  color: 0xc9ced8, metalness: 0.95, roughness: 0.22
});
const matCore = new THREE.MeshStandardMaterial({
  color: 0x8b93a3, metalness: 0.85, roughness: 0.45
});
const matCopper = new THREE.MeshStandardMaterial({
  color: 0xd98b3a, metalness: 1.0, roughness: 0.3
});
const matDark = new THREE.MeshStandardMaterial({
  color: 0x2a2e39, metalness: 0.4, roughness: 0.8
});

// ---------- Группа якоря (ось вращения — X) ----------
const armature = new THREE.Group();
scene.add(armature);

// Помощник: цилиндр, вытянутый вдоль оси X, с центром в xCenter
function cylX(radius, length, xCenter, material, radialSeg = 64) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSeg);
  geo.rotateZ(Math.PI / 2);
  geo.translate(xCenter, 0, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Геометрия деталей (координаты вдоль X)
const LEFT_SHAFT_X1  = -430, LEFT_SHAFT_X2  = -250;
const CORE_X1        = -250, CORE_X2        = 150;
const CORE_LEN       = CORE_X2 - CORE_X1;
const MID_SHAFT_X1   = 150,  MID_SHAFT_X2   = 210;   // заходим внутрь коллектора
const COMM_X1        = 205,  COMM_X2        = 315;
const COMM_LEN       = COMM_X2 - COMM_X1;
const RIGHT_SHAFT_X1 = 310,  RIGHT_SHAFT_X2 = 405;   // заходим внутрь коллектора

const SHAFT_R = 26;
const CORE_R  = 92;
const COMM_R  = 50;

// Угловое положение точки на оси X в плоскости Y-Z
// (общая система для пазов якоря и ламелей коллектора)
function polar(angle, radius, x) {
  return new THREE.Vector3(x, radius * Math.sin(angle), radius * Math.cos(angle));
}

// Число пазов = числу ламелей (вариант 1:1)
const SEG = 16;

// 1) Якорь — тело с продольными пазами (вырезаны в профиле)
const SLOT_R = 66;
const TEETH  = SEG;                   // пазов столько же, сколько ламелей
const sector = (Math.PI * 2) / TEETH;
const tipFrac = 0.5;                  // доля сектора под зуб
const slotPhase = 0.5 + tipFrac / 2;  // центр паза внутри сектора

const coreShape = new THREE.Shape();
coreShape.moveTo(CORE_R, 0);
for (let i = 0; i < TEETH; i++) {
  const start = i * sector;
  const tipEnd = start + sector * tipFrac;
  const slotEnd = (i + 1) * sector;
  coreShape.absarc(0, 0, CORE_R, start, tipEnd, false);
  coreShape.lineTo(SLOT_R * Math.cos(tipEnd), SLOT_R * Math.sin(tipEnd));
  coreShape.absarc(0, 0, SLOT_R, tipEnd, slotEnd, false);
  coreShape.lineTo(CORE_R * Math.cos(slotEnd), CORE_R * Math.sin(slotEnd));
}
// Отверстие под вал
const coreHole = new THREE.Path();
coreHole.absarc(0, 0, SHAFT_R + 1, 0, Math.PI * 2, true);
coreShape.holes.push(coreHole);

const coreGeo = new THREE.ExtrudeGeometry(coreShape, {
  depth: CORE_LEN,
  bevelEnabled: false,
  curveSegments: 24
});
coreGeo.rotateY(-Math.PI / 2);         // вытянуть вдоль X в общей угловой системе
coreGeo.translate(CORE_X2, 0, 0);      // вытягивание идёт в -X, прижимаем к CORE_X2
const coreMesh = new THREE.Mesh(coreGeo, matCore);
coreMesh.castShadow = true;
coreMesh.receiveShadow = true;
armature.add(coreMesh);

// Проводники в пазах — это сами секции обмотки (укладка строится ниже)

// 2) Вал (три участка)
armature.add(cylX(SHAFT_R, LEFT_SHAFT_X2 - LEFT_SHAFT_X1, (LEFT_SHAFT_X1 + LEFT_SHAFT_X2) / 2, matShaft));
armature.add(cylX(SHAFT_R, MID_SHAFT_X2 - MID_SHAFT_X1, (MID_SHAFT_X1 + MID_SHAFT_X2) / 2, matShaft));
armature.add(cylX(SHAFT_R, RIGHT_SHAFT_X2 - RIGHT_SHAFT_X1, (RIGHT_SHAFT_X1 + RIGHT_SHAFT_X2) / 2, matShaft));

// 3) Коллектор
//    тёмная основа (миканит) + медные пластины
//    основа чуть короче, чтобы её торцы не лежали в одной плоскости с торцами ламелей (иначе z-fighting)
armature.add(cylX(COMM_R - 3, COMM_LEN - 6, (COMM_X1 + COMM_X2) / 2, matDark, 48));

const segGap = (Math.PI * 2) / SEG;

// Цвета полярности
const COL_COPPER = 0xd98b3a;
const COL_PLUS   = 0xe2392f;  // красный — «+»
const COL_MINUS  = 0x2f7de2;  // синий  — «−»
const COL_SELECT = 0x35e070;  // зелёный — выделенный провод

// Выступ (петушок) для припайки провода обмотки — со стороны тела якоря
const riserLen = 26;    // вдоль оси
const riserRad = 14;    // радиальная толщина
const riserTan = segGap * COMM_R * 0.55; // тангенциальная ширина
const riserGeo = new THREE.BoxGeometry(riserLen, riserRad, riserTan);

const segMeshes = [];
const riserMeshes = [];

for (let i = 0; i < SEG; i++) {
  const tcLen = segGap * 0.82;
  const center = i * segGap + segGap * slotPhase;  // совпадает с центром паза
  const tcStart = center - tcLen / 2;
  const g = new THREE.CylinderGeometry(COMM_R, COMM_R, COMM_LEN, 12, 1, false, tcStart, tcLen);
  g.rotateZ(Math.PI / 2);
  g.translate((COMM_X1 + COMM_X2) / 2, 0, 0);
  const segMat = new THREE.MeshStandardMaterial({
    color: COL_COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000
  });
  const seg = new THREE.Mesh(g, segMat);
  seg.castShadow = true;
  seg.userData.index = i;
  armature.add(seg);
  segMeshes.push(seg);

  // петушок: небольшой выступ на торце со стороны якоря
  const riserMat = new THREE.MeshStandardMaterial({
    color: COL_COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000
  });
  const riser = new THREE.Mesh(riserGeo, riserMat);
  riser.rotation.x = Math.PI / 2 - center;
  riser.position.set(
    COMM_X1 - riserLen / 2 + 6,
    COMM_R * Math.sin(center),
    COMM_R * Math.cos(center)
  );
  riser.castShadow = true;
  riser.userData.index = i;
  armature.add(riser);
  riserMeshes.push(riser);
}

// ---- Реальная укладка обмотки (двухслойная петлевая, 2p = 2) ----
// Секция c: верхний слой лежит в пазу c, нижний — в пазу (c + Z/2).
// Спереди оба конца выходят к петушкам: начало секции → ламель c, конец → ламель c+1.
// Сзади секция перекидывается из паза c в диаметрально противоположный паз (c + Z/2).
const Z = SEG;
const slotAngle = (i) => i * sector + sector * slotPhase;
const y1 = Z / 2;                 // шаг по пазам (полный шаг для 2p = 2)
const rTop = 84, rBot = 74;       // верхний и нижний слои в пазу
const xRiser = COMM_X1 - riserLen / 2 + 6;

const coilMeshes = [];
let selectedCoil = null;   // индекс выделенного провода (или null)
const tubeR = 3.2;

for (let c = 0; c < Z; c++) {
  const A = c;
  const B = (c + y1) % Z;
  const S2 = (c + 1) % Z;
  const thA = slotAngle(A);
  const thB = slotAngle(B);
  const thS2 = slotAngle(S2);

  // Своя «ячейка» (радиус × осевой вынос) каждой секции:
  // лобовые части ложатся вложенными оболочками и не пересекаются.
  const g = c % 4;
  const k = Math.floor(c / 4);
  const rBackC  = 96 + g * 8;              // 96…120  — оболочка сзади
  const xBackC  = CORE_X1 - 28 - k * 8;    // -278…-302 — вынос назад
  const rFrontC = 62 + g * 7;              // 62…83   — оболочка спереди
  const xFrontC = CORE_X2 + 20 + k * 7;    // 170…191 — вынос вперёд

  const pts = [];
  // 1) петушок ламели c → верхний слой паза A (спереди)
  pts.push(polar(thA, COMM_R + 2, xRiser));
  pts.push(polar(thA, (COMM_R + rTop) / 2 + 6, CORE_X2 + 30));
  pts.push(polar(thA, rTop, CORE_X2 + 8));
  // 2) верхний слой: спереди → назад
  pts.push(polar(thA, rTop, (CORE_X1 + CORE_X2) / 2));
  pts.push(polar(thA, rTop, CORE_X1 + 6));
  // 3) назад: короткий прямой выход и плавный отвод на свою оболочку
  pts.push(polar(thA, rTop, xBackC + 22));
  pts.push(polar(thA, (rTop + rBackC) / 2, xBackC + 6));
  pts.push(polar(thA, rBackC, xBackC));
  // 4) дуга сзади из паза A в паз B (180°) на своей оболочке
  const nArc = 12;
  for (let k2 = 1; k2 <= nArc; k2++) {
    pts.push(polar(thA + (k2 / nArc) * Math.PI, rBackC, xBackC));
  }
  // 5) завернуть обратно в нижний слой паза B
  pts.push(polar(thB, (rTop + rBackC) / 2, xBackC + 6));
  pts.push(polar(thB, rBot, xBackC + 22));
  pts.push(polar(thB, rBot, CORE_X1 + 6));
  // 6) нижний слой: сзади → вперёд
  pts.push(polar(thB, rBot, (CORE_X1 + CORE_X2) / 2));
  pts.push(polar(thB, rBot, CORE_X2 + 8));
  // 7) лобовая часть спереди: паз B → петушок ламели c+1
  const nFront = 7;
  for (let k2 = 1; k2 < nFront; k2++) {
    pts.push(polar(thB - (k2 / nFront) * 7 * sector, rFrontC, xFrontC));
  }
  pts.push(polar(thS2, (COMM_R + rBot) / 2 + 6, CORE_X2 + 30));
  pts.push(polar(thS2, COMM_R + 2, xRiser));

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const mat = new THREE.MeshStandardMaterial({
    color: COL_COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000
  });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, tubeR, 8, false), mat);
  tube.castShadow = true;
  tube.userData.index = c;
  armature.add(tube);
  coilMeshes.push(tube);
}

// кликабельные объекты: провода, ламели и петушки
const pickables = [...coilMeshes, ...segMeshes, ...riserMeshes];

// 4) Торцевые шайбы якоря (для аккуратного стыка с валом)
armature.add(cylX(CORE_R * 0.55, 8, CORE_X1 - 2, matDark, 48));
armature.add(cylX(CORE_R * 0.55, 8, CORE_X2 + 2, matDark, 48));

// Тень-подставка
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -240;
ground.receiveShadow = true;
scene.add(ground);

// ---------- Рама: наклоняем весь узел и держим щётки неподвижными ----------
const motorFrame = new THREE.Group();
motorFrame.rotation.z = 0.15;   // лёгкий наклон для перспективы
scene.add(motorFrame);
motorFrame.add(armature);       // якорь вращается внутри рамы вокруг оси X

// ---------- Щётки (не вращаются вместе с якорем) ----------
const BRUSH_PLUS  = Math.PI / 2;   // сверху — «+»
const BRUSH_MINUS = -Math.PI / 2;  // снизу  — «−»

function makeLabelSprite(text, color, depthTest = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.font = 'bold 100px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest
  }));
  sp.scale.set(70, 70, 1);
  return sp;
}

function makeBrush(theta) {
  const grp = new THREE.Group();

  // корпус щётки (графит)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x14151a, metalness: 0.3, roughness: 0.9,
    emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.35
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(COMM_LEN * 0.7, 24, 26),
    bodyMat
  );
  grp.add(body);

  // цветная контактная накладка, прижатая к ламелям
  // чуть уже корпуса по X и Z, чтобы боковые грани не совпадали с гранями корпуса (иначе z-fighting)
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 0.6, roughness: 0.4,
    emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.8
  });
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(COMM_LEN * 0.7 - 3, 6, 24),
    padMat
  );
  pad.position.y = -12.5; // внутрь, к коллектору
  grp.add(pad);

  grp.rotation.x = Math.PI / 2 - theta;
  grp.position.copy(polar(theta, COMM_R + 15, (COMM_X1 + COMM_X2) / 2));
  motorFrame.add(grp);

  // обе подписи сразу; нужную показываем при раскраске
  const plusLbl  = makeLabelSprite('+', '#' + COL_PLUS.toString(16).padStart(6, '0'));
  const minusLbl = makeLabelSprite('−', '#' + COL_MINUS.toString(16).padStart(6, '0'));
  for (const s of [plusLbl, minusLbl]) {
    s.position.copy(polar(theta, COMM_R + 65, (COMM_X1 + COMM_X2) / 2));
    motorFrame.add(s);
  }

  return { bodyMat, padMat, plusLbl, minusLbl };
}

const brushTop    = makeBrush(BRUSH_PLUS);   // сверху
const brushBottom = makeBrush(BRUSH_MINUS);  // снизу

// окрасить щётку знаком полярности (плюс/минус)
function setBrushPolarity(item, positive) {
  const colorHex = positive ? COL_PLUS : COL_MINUS;
  item.bodyMat.emissive.setHex(colorHex);
  item.padMat.color.setHex(colorHex);
  item.padMat.emissive.setHex(colorHex);
  item.plusLbl.visible  = positive;
  item.minusLbl.visible = !positive;
}

// ---------- Направление вращения ----------
let reversed = false;   // false — как сейчас; true — реверс (щётки меняются полюсами)
function refreshBrushes() {
  setBrushPolarity(brushTop, !reversed);
  setBrushPolarity(brushBottom, reversed);
}
refreshBrushes();

// ---------- Номера ламелей (вращаются вместе с якорем) ----------
// та же угловая система, что и у ламелей: угол сегмента i
const numSprites = [];
const NUM_X = (COMM_X1 + COMM_X2) / 2;
let numDist = 32;   // отступ цифры от поверхности ламели

function layoutNumbers() {
  for (const n of numSprites) {
    n.sprite.position.copy(polar(n.angle, COMM_R + numDist, NUM_X));
  }
}

for (let i = 0; i < SEG; i++) {
  const a = i * segGap + segGap * slotPhase;
  const sp = makeLabelSprite(String(i + 1), '#ffffff', true);
  sp.scale.set(30, 30, 1);
  sp.position.copy(polar(a, COMM_R + numDist, NUM_X));
  armature.add(sp);
  numSprites.push({ sprite: sp, angle: a });
}

// ---------- Управление ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.9;
controls.minDistance = 350;
controls.maxDistance = 1600;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.update();

const btnRotate = document.getElementById('btnRotate');
const btnReset = document.getElementById('btnReset');
const chkNums = document.getElementById('chkNums');
const distNums = document.getElementById('distNums');
const distNumsVal = document.getElementById('distNumsVal');
const btnReverse = document.getElementById('btnReverse');

let spinning = false; // при открытии страницы анимация отключена

btnRotate.addEventListener('click', () => {
  spinning = !spinning;
  btnRotate.textContent = spinning
    ? '⏸ Остановить анимацию'
    : '▶ Запустить анимацию';
});

btnReset.addEventListener('click', () => {
  armature.rotation.x = 0;   // вернуть якорь (и номера ламелей) в исходное положение
});

// видимость номеров ламелей
chkNums.addEventListener('change', () => {
  numSprites.forEach(n => { n.sprite.visible = chkNums.checked; });
});

// отступ цифр от ламелей
distNums.addEventListener('input', () => {
  numDist = Number(distNums.value);
  distNumsVal.textContent = numDist;
  layoutNumbers();
});

// реверс: меняем направление вращения и полюса щёток
btnReverse.addEventListener('click', () => {
  reversed = !reversed;
  refreshBrushes();
});

// ---------- Выбор провода кликом ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
  downX = e.clientX;
  downY = e.clientY;
});

renderer.domElement.addEventListener('pointerup', (e) => {
  // не считаем кликом перетаскивание камеры
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length && hits[0].object.userData.index !== undefined) {
    // индекс общий для провода/ламели/петушка: ламель s — начало секции s
    const idx = hits[0].object.userData.index;
    selectedCoil = (selectedCoil === idx) ? null : idx;  // повторный клик — снять
  } else {
    selectedCoil = null;
  }
});

// ---------- Ресайз ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Анимация ----------
// Раскраска по направлению тока: плоскость, проходящая через щётки,
// делит обмотку на две половины с противоположным направлением тока.
// При вращении секции проходят под щётками и меняют полярность (коммутация).
function paintPolarity(rot) {
  // ламели/петушки, принадлежащие выбранной секции (её начало и конец)
  const selSegs = new Set();
  if (selectedCoil !== null) {
    selSegs.add(selectedCoil);
    selSegs.add((selectedCoil + 1) % SEG);
  }

  for (let i = 0; i < SEG; i++) {
    const aSeg = i * segGap + segGap * slotPhase - rot;
    const positiveSide = Math.cos(aSeg) > 0;
    const colSeg = (positiveSide !== reversed) ? COL_PLUS : COL_MINUS;
    const selectedHere = selSegs.has(i);
    const colS = selectedHere ? COL_SELECT : colSeg;
    const segGlow = selectedHere ? 1.3 : 0.22;

    segMeshes[i].material.color.setHex(colS);
    segMeshes[i].material.emissive.setHex(colS);
    segMeshes[i].material.emissiveIntensity = segGlow;

    riserMeshes[i].material.color.setHex(colS);
    riserMeshes[i].material.emissive.setHex(colS);
    riserMeshes[i].material.emissiveIntensity = segGlow;

    // секция i (её концы — на ламелях i и i+1)
    if (i === selectedCoil) {
      // выделенный провод — свой цвет и усиленное свечение
      coilMeshes[i].material.color.setHex(COL_SELECT);
      coilMeshes[i].material.emissive.setHex(COL_SELECT);
      coilMeshes[i].material.emissiveIntensity = 1.8;
    } else {
      coilMeshes[i].material.color.setHex(colSeg);
      coilMeshes[i].material.emissive.setHex(colSeg);
      coilMeshes[i].material.emissiveIntensity = 0.16;
    }
  }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  // собственное вращение якоря вокруг вала
  if (spinning) armature.rotation.x += dt * 0.6 * (reversed ? -1 : 1);
  paintPolarity(armature.rotation.x);
  controls.update();
  renderer.render(scene, camera);
}
animate();
