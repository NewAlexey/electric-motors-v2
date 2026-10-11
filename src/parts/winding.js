import * as THREE from 'three';
import { AXIS, RADII, SECTOR, SLOT_PHASE, SEG_GAP, RISER, WINDING, COLORS } from '../config.js';
import { polar } from '../lib/geometry.js';

// Приводит угол к диапазону (−π, π] — кратчайший поворот между двумя пазами.
function shortest(angle) {
  const twoPi = Math.PI * 2;
  return ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

// Реальная укладка обмотки (двухслойная петлевая, 2p = 2).
// В каждом пазу u секций: c-я секция занимает верхний слой в пазу floor(c/u)
// и нижний — в пазу (floor(c/u) + Z/2). Начало секции подключено к ламели c,
// конец — к ламели (c + yK), где yK — шаг по коллектору (1 — простая петлевая,
// 2 — сложная и т. д.). Сзади секция перекидывается через вал.
//
// Обмотка пересобирается при смене шага, поэтому экспортируется фабрика:
// возвращает стабильный массив проводов и метод setPitch(yK).
export function createWinding(parent, initialPitch = 1) {
  const coils = [];

  function clear() {
    for (const m of coils) {
      parent.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    coils.length = 0;
  }

  function build(yK) {
    clear();
    const { Z, y1, u, rTop, rBot, tubeR } = WINDING;
    const C = Z * u; // число секций = число ламелей
    const xRiser = AXIS.COMM_X1 - RISER.LEN / 2 + 6;
    const nRad = Math.max(1, Math.round(Math.sqrt(C))); // ярусов укладки
    const step = SECTOR * 0.16; // угловой шаг проводников внутри паза

    const slotCenter = (s) => s * SECTOR + SECTOR * SLOT_PHASE;
    const condAngle = (s, j) => slotCenter(s) + (j - (u - 1) / 2) * step;
    const segAngle = (i) => i * SEG_GAP + SEG_GAP * SLOT_PHASE;

    for (let c = 0; c < C; c++) {
      const slotA = Math.floor(c / u);
      const slotB = (slotA + y1) % Z;
      const j = c % u;
      const thA = condAngle(slotA, j);
      const thB = condAngle(slotB, j);
      const thS1 = segAngle(c);
      const thS2 = segAngle((c + yK) % C);

      // Своя «ячейка» (радиус × осевой вынос) каждой секции:
      // задние концы обвивают вал за торцом якоря; передние — вложенные оболочки.
      const g = c % nRad;
      const k = Math.floor(c / nRad);
      const rWrap = 40 + g * 8; // кольцо вокруг вала (меньше радиуса якоря)
      const xWrap = AXIS.CORE_X1 - 30 - k * 9; // вынос назад
      const rFrontC = 62 + g * 7; // оболочка спереди
      const xFrontC = AXIS.CORE_X2 + 20 + k * 7; // вынос вперёд

      const pts = [];
      // 1) петушок ламели c → верхний слой паза A (спереди)
      pts.push(polar(thS1, RADII.COMM + 2, xRiser));
      pts.push(polar(thS1, (RADII.COMM + rTop) / 2 + 6, AXIS.CORE_X2 + 30));
      pts.push(polar(thA, rTop, AXIS.CORE_X2 + 8));
      // 2) верхний слой: спереди → назад
      pts.push(polar(thA, rTop, (AXIS.CORE_X1 + AXIS.CORE_X2) / 2));
      pts.push(polar(thA, rTop, AXIS.CORE_X1 + 6));
      // 3) назад: короткий выход за торец и плавный заворот внутрь, к валу
      pts.push(polar(thA, rTop, xWrap + 24));
      pts.push(polar(thA, (rTop + rWrap) / 2, xWrap + 12));
      pts.push(polar(thA, rWrap, xWrap));
      // 4) обвить вал: дуга вокруг вала за торцом якоря (паз A → паз B)
      const dBack = shortest(thB - thA);
      const nArc = Math.max(6, Math.round(Math.abs(dBack) / (Math.PI / 12)));
      for (let k2 = 1; k2 <= nArc; k2++) {
        pts.push(polar(thA + (k2 / nArc) * dBack, rWrap, xWrap));
      }
      // 5) вывести обратно в нижний слой паза B
      pts.push(polar(thB, (rBot + rWrap) / 2, xWrap + 12));
      pts.push(polar(thB, rBot, xWrap + 24));
      pts.push(polar(thB, rBot, AXIS.CORE_X1 + 6));
      // 6) нижний слой: сзади → вперёд
      pts.push(polar(thB, rBot, (AXIS.CORE_X1 + AXIS.CORE_X2) / 2));
      pts.push(polar(thB, rBot, AXIS.CORE_X2 + 8));
      // 7) лобовая часть спереди: паз B → петушок ламели (c + yK)
      const dFront = shortest(thS2 - thB);
      const nFront = 7;
      for (let k2 = 1; k2 < nFront; k2++) {
        pts.push(polar(thB + (k2 / nFront) * dFront, rFrontC, xFrontC));
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
      coils.push(tube);
    }
  }

  build(initialPitch);

  return { coils, setPitch: (yK) => build(yK) };
}
