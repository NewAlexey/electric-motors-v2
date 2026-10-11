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

// Число пазов = числу ламелей (1:1)
export const SEG = 16;
export const TEETH = SEG;
export const SECTOR = (Math.PI * 2) / TEETH;
export const TIP_FRAC = 0.5; // доля сектора под зуб
export const SLOT_PHASE = 0.5 + TIP_FRAC / 2; // центр паза внутри сектора
export const SEG_GAP = (Math.PI * 2) / SEG;

// Петушки (выступы коллектора для пайки обмотки)
export const RISER = {
  LEN: 26,
  RAD: 14,
  TAN: SEG_GAP * RADII.COMM * 0.55,
};

// Обмотка: двухслойная петлевая, 2p = 2
export const WINDING = {
  Z: SEG,
  y1: SEG / 2, // полный шаг по пазам
  rTop: 84,
  rBot: 74,
  tubeR: 3.2,
};

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
  SELECT: 0x35e070, // зелёный — выделенный провод
};
