import { getState, setState, subscribe } from '../state.js';

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

  btnRotate.addEventListener('click', () => setState({ spinning: !getState().spinning }));
  btnReset.addEventListener('click', onReset);
  chkNums.addEventListener('change', () => setState({ numsVisible: chkNums.checked }));
  distNums.addEventListener('input', () => setState({ numDist: Number(distNums.value) }));
  btnReverse.addEventListener('click', () => setState({ reversed: !getState().reversed }));
  speedAnim.addEventListener('input', () => setState({ speed: Number(speedAnim.value) }));

  subscribe((s) => {
    btnRotate.textContent = s.spinning ? '⏸ Остановить анимацию' : '▶ Запустить анимацию';
    chkNums.checked = s.numsVisible;
    distNums.value = s.numDist;
    distNumsVal.textContent = s.numDist;
    speedAnim.value = s.speed;
    speedAnimVal.textContent = s.speed;
  });
}
