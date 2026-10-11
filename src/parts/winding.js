import * as THREE from 'three';
import { AXIS, RADII, SECTOR, SLOT_PHASE, RISER, WINDING, COLORS } from '../config.js';
import { polar } from '../lib/geometry.js';

// Реальная укладка обмотки (двухслойная петлевая, 2p = 2).
// Секция c: верхний слой лежит в пазу c, нижний — в пазу (c + Z/2).
// Спереди оба конца выходят к петушкам: начало секции → ламель c, конец → ламель c+1.
// Сзади секция перекидывается из паза c в диаметрально противоположный паз (c + Z/2).
// Возвращает массив мешей-проводов (нужны для раскраски и клика).
export function buildWinding(parent) {
  const { Z, y1, rTop, rBot, tubeR } = WINDING;
  const slotAngle = (i) => i * SECTOR + SECTOR * SLOT_PHASE;
  const xRiser = AXIS.COMM_X1 - RISER.LEN / 2 + 6;
  const coilMeshes = [];

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
    const rBackC = 96 + g * 8; // 96…120 — оболочка сзади
    const xBackC = AXIS.CORE_X1 - 28 - k * 8; // -278…-302 — вынос назад
    const rFrontC = 62 + g * 7; // 62…83 — оболочка спереди
    const xFrontC = AXIS.CORE_X2 + 20 + k * 7; // 170…191 — вынос вперёд

    const pts = [];
    // 1) петушок ламели c → верхний слой паза A (спереди)
    pts.push(polar(thA, RADII.COMM + 2, xRiser));
    pts.push(polar(thA, (RADII.COMM + rTop) / 2 + 6, AXIS.CORE_X2 + 30));
    pts.push(polar(thA, rTop, AXIS.CORE_X2 + 8));
    // 2) верхний слой: спереди → назад
    pts.push(polar(thA, rTop, (AXIS.CORE_X1 + AXIS.CORE_X2) / 2));
    pts.push(polar(thA, rTop, AXIS.CORE_X1 + 6));
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
    pts.push(polar(thB, rBot, AXIS.CORE_X1 + 6));
    // 6) нижний слой: сзади → вперёд
    pts.push(polar(thB, rBot, (AXIS.CORE_X1 + AXIS.CORE_X2) / 2));
    pts.push(polar(thB, rBot, AXIS.CORE_X2 + 8));
    // 7) лобовая часть спереди: паз B → петушок ламели c+1
    const nFront = 7;
    for (let k2 = 1; k2 < nFront; k2++) {
      pts.push(polar(thB - (k2 / nFront) * 7 * SECTOR, rFrontC, xFrontC));
    }
    pts.push(polar(thS2, (RADII.COMM + rBot) / 2 + 6, AXIS.CORE_X2 + 30));
    pts.push(polar(thS2, RADII.COMM + 2, xRiser));

    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, tubeR, 8, false), mat);
    tube.castShadow = true;
    tube.userData.index = c;
    parent.add(tube);
    coilMeshes.push(tube);
  }

  return coilMeshes;
}
