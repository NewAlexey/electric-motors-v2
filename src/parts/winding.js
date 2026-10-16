import * as THREE from 'three';
import { AXIS, RADII, SECTOR, SLOT_PHASE, SEG_GAP, RISER, WINDING, COLORS } from '../config.js';
import { polar } from '../lib/geometry.js';

// Предустановленный медный цвет (линейное пространство — как material.color).
const COPPER = new THREE.Color(COLORS.COPPER);

// Приводит угол к диапазону (−π, π] — кратчайший поворот между двумя пазами.
function shortest(angle) {
  const twoPi = Math.PI * 2;
  return ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

// Реальная укладка обмотки (двухслойная петлевая, 2p = 2).
// В пазу u катушек. Секция c занимает верхний слой в пазу floor(c/u) и нижний —
// в пазу (floor(c/u) + Z/2). Начало секции подключено к ламели c, конец — к
// ламели (c + yK), где yK — шаг по коллектору (1 — простая петлевая, 2 — сложная
// и т. д.). Сзади секция перекидывается через вал.
//
// Фабрика: возвращает стабильный массив проводов и метод setPitch(yK).
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
    const nRad = Math.max(1, Math.round(Math.sqrt(C))); // ярусов укладки лобовых
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
      const geometry = new THREE.TubeGeometry(curve, 240, tubeR, 8, false);

      // Для раскраски по направлению тока каждой вершине запоминаем её угловую
      // позицию (cos φ, sin φ, где φ = atan2(y, z)) и заводим атрибут цвета.
      const pos = geometry.getAttribute('position');
      const count = pos.count;
      const cosA = new Float32Array(count);
      const sinA = new Float32Array(count);
      const colors = new Float32Array(count * 3);
      for (let v = 0; v < count; v++) {
        const y = pos.getY(v);
        const z = pos.getZ(v);
        const r = Math.hypot(y, z) || 1;
        cosA[v] = z / r;
        sinA[v] = y / r;
        colors[v * 3] = COPPER.r;
        colors[v * 3 + 1] = COPPER.g;
        colors[v * 3 + 2] = COPPER.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true, metalness: 0.5, roughness: 0.4,
      });
      const tube = new THREE.Mesh(geometry, mat);
      tube.userData.cos = cosA;
      tube.userData.sin = sinA;
      tube.castShadow = true;
      tube.userData.index = c;
      parent.add(tube);
      coils.push(tube);
    }
  }

  build(initialPitch);

  return { coils, setPitch: (yK) => build(yK) };
}
