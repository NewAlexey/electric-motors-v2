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
    // задние концы обвивают вал за торцом якоря; передние — вложенные оболочки.
    const g = c % 4;
    const k = Math.floor(c / 4);
    const rWrap = 40 + g * 8; // 40…64 — кольцо вокруг вала (меньше радиуса якоря)
    const xWrap = AXIS.CORE_X1 - 30 - k * 9; // -280…-307 — вынос назад
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
    // 3) назад: короткий выход за торец и плавный заворот внутрь, к валу
    pts.push(polar(thA, rTop, xWrap + 24));
    pts.push(polar(thA, (rTop + rWrap) / 2, xWrap + 12));
    pts.push(polar(thA, rWrap, xWrap));
    // 4) обвить вал: полукруг вокруг вала за торцом якоря (паз A → паз B)
    const nArc = 16;
    for (let k2 = 1; k2 <= nArc; k2++) {
      pts.push(polar(thA + (k2 / nArc) * Math.PI, rWrap, xWrap));
    }
    // 5) вывести обратно в нижний слой паза B
    pts.push(polar(thB, (rBot + rWrap) / 2, xWrap + 12));
    pts.push(polar(thB, rBot, xWrap + 24));
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
