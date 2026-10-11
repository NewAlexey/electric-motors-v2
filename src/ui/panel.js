import { getState, setState, subscribe } from '../state.js';
import { WINDING_LIMITS, isValidCommPitch, validCommPitches } from '../config.js';

// Максимум секций на паз при данном числе пазов, чтобы ламелей было ≤ maxSeg.
function maxCoilsPerSlot(slots) {
  return Math.min(WINDING_LIMITS.coilsPerSlot.max, Math.floor(WINDING_LIMITS.maxSeg / slots));
}

// Подписи опций шага по коллектору.
function commPitchLabel(y) {
  if (y === 1) return '1 · простая';
  if (y === 2) return '2 · сложная';
  return String(y);
}

// Добавляет в патч корректировку yK, если текущий шаг недопустим для новых SEG.
function withValidPitch(patch) {
  const seg = patch.slots * patch.coilsPerSlot;
  if (!isValidCommPitch(getState().commPitch, seg)) patch.commPitch = 1;
  return patch;
}

// Связывает DOM-элементы панели с состоянием и синхронизирует обратно.
export function bindPanel({ onReset }) {
  const btnRotate = document.getElementById('btnRotate');
  const btnReset = document.getElementById('btnReset');
  const chkNums = document.getElementById('chkNums');
  const distNums = document.getElementById('distNums');
  const distNumsVal = document.getElementById('distNumsVal');
  const btnReverse = document.getElementById('btnReverse');
  const speedAnim = document.getElementById('speedAnim');
  const speedAnimVal = document.getElementById('speedAnimVal');
  const commPitch = document.getElementById('commPitch');
  const slots = document.getElementById('slots');
  const slotsVal = document.getElementById('slotsVal');
  const coilsPerSlot = document.getElementById('coilsPerSlot');
  const coilsPerSlotVal = document.getElementById('coilsPerSlotVal');
  const segCount = document.getElementById('segCount');

  btnRotate.addEventListener('click', () => setState({ spinning: !getState().spinning }));
  btnReset.addEventListener('click', onReset);
  chkNums.addEventListener('change', () => setState({ numsVisible: chkNums.checked }));
  distNums.addEventListener('input', () => setState({ numDist: Number(distNums.value) }));
  btnReverse.addEventListener('click', () => setState({ reversed: !getState().reversed }));
  speedAnim.addEventListener('input', () => setState({ speed: Number(speedAnim.value) }));
  commPitch.addEventListener('change', () => setState({ commPitch: Number(commPitch.value) }));
  slots.addEventListener('input', () => {
    const z = Number(slots.value);
    const u = Math.min(getState().coilsPerSlot, maxCoilsPerSlot(z));
    setState(withValidPitch({ slots: z, coilsPerSlot: u }));
  });
  coilsPerSlot.addEventListener('input', () => {
    const z = getState().slots;
    const u = Math.min(Number(coilsPerSlot.value), maxCoilsPerSlot(z));
    setState(withValidPitch({ slots: z, coilsPerSlot: u }));
  });

  let lastSeg = null;
  subscribe((s) => {
    btnRotate.textContent = s.spinning ? '⏸ Остановить анимацию' : '▶ Запустить анимацию';
    chkNums.checked = s.numsVisible;
    distNums.value = s.numDist;
    distNumsVal.textContent = s.numDist;
    speedAnim.value = s.speed;
    speedAnimVal.textContent = s.speed;
    slots.value = s.slots;
    slotsVal.textContent = s.slots;
    coilsPerSlot.max = maxCoilsPerSlot(s.slots);
    coilsPerSlot.value = s.coilsPerSlot;
    coilsPerSlotVal.textContent = s.coilsPerSlot;
    const seg = s.slots * s.coilsPerSlot;
    segCount.textContent = seg;

    // Список допустимых yK зависит от числа ламелей — пересобираем при смене SEG.
    if (seg !== lastSeg) {
      lastSeg = seg;
      commPitch.replaceChildren(...validCommPitches(seg).map((y) => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = commPitchLabel(y);
        return opt;
      }));
    }
    commPitch.value = s.commPitch;
  });
}
