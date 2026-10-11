// Минимальный реактивный store: управляющее состояние приложения.
// Вращение якоря (rotation) обновляется в цикле кадров отдельно и здесь не хранится.

const state = {
  spinning: false, // анимация при открытии страницы отключена
  reversed: false, // направление вращения (true — реверс: щётки меняют полюса)
  selectedCoil: null, // индекс выделенного провода (или null)
  numsVisible: true, // видимость номеров ламелей
  numDist: 32, // отступ цифры от поверхности ламели
  speed: 0.6, // скорость вращения якоря (рад/с)
  commPitch: 1, // шаг по коллектору yK (1 — простая петлевая, 2 — сложная…)
  slots: 16, // число пазов Z
  coilsPerSlot: 1, // число секций на паз u (ламелей = Z · u)
  currentColors: true, // раскраска обмотки по направлению тока (синий/красный)
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  let changed = false;
  for (const key of Object.keys(patch)) {
    if (state[key] !== patch[key]) {
      state[key] = patch[key];
      changed = true;
    }
  }
  if (changed) {
    for (const fn of listeners) fn(state);
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state); // начальная синхронизация
  return () => listeners.delete(fn);
}
