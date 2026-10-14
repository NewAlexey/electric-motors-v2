// Единый источник геометрических и визуальных констант модели.
// Координаты деталей заданы вдоль оси X (ось вращения якоря).

// Осевые границы деталей
export const AXIS = {
  LEFT_SHAFT_X1: -430,
  LEFT_SHAFT_X2: -250,
  CORE_X1: -250,
  CORE_X2: 150,
  MID_SHAFT_X1: 150,
  MID_SHAFT_X2: 210, // заходим внутрь коллектора
  COMM_X1: 205,
  COMM_X2: 315,
  RIGHT_SHAFT_X1: 310, // заходим внутрь коллектора
  RIGHT_SHAFT_X2: 405,
};

export const CORE_LEN = AXIS.CORE_X2 - AXIS.CORE_X1;
export const COMM_LEN = AXIS.COMM_X2 - AXIS.COMM_X1;
export const COMM_CENTER = (AXIS.COMM_X1 + AXIS.COMM_X2) / 2;

// Радиусы
export const RADII = {
  SHAFT: 26,
  CORE: 92,
  COMM: 50,
  SLOT: 66,
};

// Число пазов и число ламелей = пазы × секции_на_паз.
// Значения «живые» (export let): детали читают их при сборке, поэтому при
// изменении параметров в UI якорь пересобирается из main.js.
export let TEETH = 16; // число пазов (зубцов), всегда чётное
export let SEG = 16; // число ламелей = TEETH × WINDING.u
export let SECTOR = (Math.PI * 2) / TEETH;
export let TIP_FRAC = 0.5; // доля сектора под зуб (остальное — паз)
export let SLOT_PHASE = 0.5 + TIP_FRAC / 2; // центр паза внутри сектора
export let SEG_GAP = (Math.PI * 2) / SEG;

// Допустимые пределы настройки обмотки (SEG = пазы × секции на паз ∈ [6, 48]).
export const WINDING_LIMITS = {
  slots: { min: 6, max: 24, step: 2 },
  coilsPerSlot: { min: 1, max: 4, step: 1 },
  minSeg: 6,
  maxSeg: 48,
};

// Петушки (выступы коллектора для пайки обмотки)
export const RISER = {
  LEN: 26,
  RAD: 14,
  TAN: SEG_GAP * RADII.COMM * 0.55,
};

// Обмотка: двухслойная петлевая, 2p = 2
export const WINDING = {
  Z: TEETH, // число пазов
  y1: TEETH / 2, // полный шаг по пазам
  u: 1, // секций (катушек) в пазу
  rTop: 84,
  rBot: 74,
  tubeR: 1.6,
};

// Секциям на паз нужно больше места, поэтому зуб пропорционально уже.
function toothFraction(coilsPerSlot) {
  return Math.max(0.3, 0.5 - (coilsPerSlot - 1) * 0.07);
}

export function validateWindingParams(slots, coilsPerSlot) {
  return Number.isInteger(slots) && Number.isInteger(coilsPerSlot)
    && slots >= WINDING_LIMITS.slots.min && slots % 2 === 0
    && coilsPerSlot >= WINDING_LIMITS.coilsPerSlot.min
    && slots * coilsPerSlot >= WINDING_LIMITS.minSeg
    && slots * coilsPerSlot <= WINDING_LIMITS.maxSeg;
}

// Применяет число пазов и секций на паз, обновляя производные константы.
// Возвращает SEG (число ламелей) или null, если параметры некорректны.
export function setWindingParams(slots, coilsPerSlot) {
  if (!validateWindingParams(slots, coilsPerSlot)) return null;
  TEETH = slots;
  SECTOR = (Math.PI * 2) / TEETH;
  TIP_FRAC = toothFraction(coilsPerSlot);
  SLOT_PHASE = 0.5 + TIP_FRAC / 2;
  SEG = TEETH * coilsPerSlot;
  SEG_GAP = (Math.PI * 2) / SEG;
  RISER.TAN = SEG_GAP * RADII.COMM * 0.55;
  WINDING.Z = TEETH;
  WINDING.y1 = TEETH / 2;
  WINDING.u = coilsPerSlot;
  return SEG;
}

function gcd(a, b) {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Шаг по коллектору yK даёт один замкнутый контур обмотки только если
// он взаимно прост с числом ламелей: gcd(yK, SEG) = 1.
export function isValidCommPitch(yK, seg = SEG) {
  return Number.isInteger(yK) && yK >= 1 && yK < seg && gcd(yK, seg) === 1;
}

export function validCommPitches(seg = SEG) {
  const list = [];
  for (let y = 1; y < seg; y++) if (gcd(y, seg) === 1) list.push(y);
  return list;
}

// Углы щёток (неподвижны относительно рамы)
export const BRUSH_ANGLE = {
  PLUS: Math.PI / 2, // сверху
  MINUS: -Math.PI / 2, // снизу
};

// Палитра
export const COLORS = {
  SHAFT: 0xc9ced8,
  CORE: 0x8b93a3,
  COPPER: 0xd98b3a,
  DARK: 0x2a2e39,
  PLUS: 0xe2392f, // красный «+»
  MINUS: 0x2f7de2, // синий «−»
  GRAPHITE: 0x3a3f47, // графит — щётки при отключённой раскраске тока
  SELECT: 0x35e070, // зелёный — выделенный провод
};
