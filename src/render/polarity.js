import * as THREE from 'three';
import { SEG, SEG_GAP, SLOT_PHASE, COLORS } from '../config.js';

// Предустановленные цвета (в линейном пространстве, как и material.color).
const C_PLUS = new THREE.Color(COLORS.PLUS);
const C_MINUS = new THREE.Color(COLORS.MINUS);
const C_COPPER = new THREE.Color(COLORS.COPPER);
const C_SELECT = new THREE.Color(COLORS.SELECT);
const C_BLACK = new THREE.Color(0x000000);

// Чтобы не перезаписывать вершинные цвета каждый кадр впустую (например, на паузе),
// запоминаем входные параметры предыдущего вызова.
const last = {
  rot: NaN, reversed: null, selectedCoil: undefined,
  commPitch: undefined, currentColors: undefined, coils: undefined,
};

// Заливает весь провод одним цветом.
function fillColor(coil, color) {
  const attr = coil.geometry.getAttribute('color');
  const arr = attr.array;
  for (let o = 0; o < arr.length; o += 3) {
    arr[o] = color.r;
    arr[o + 1] = color.g;
    arr[o + 2] = color.b;
  }
  attr.needsUpdate = true;
}

// Раскраска по направлению тока. Ламели, петушки и каждая точка провода красятся
// по тому, к какому полюсу (щётке) она обращена — одной и той же формулой
// sign(cos(угол − rot)). Поэтому верхний и нижний проводники секции всегда
// противоположны (они в пазах через Z/2), а при вращении цвет перетекает по
// лобовым частям — это и есть коммутация. Провода согласованы с ламелями.
export function paintPolarity({
  rot, reversed, selectedCoil, commPitch = 1, currentColors = true,
  segments, risers, coils,
}) {
  // Пропускаем пересчёт, если ничего не изменилось (частый случай — пауза).
  if (rot === last.rot && reversed === last.reversed
    && selectedCoil === last.selectedCoil && commPitch === last.commPitch
    && currentColors === last.currentColors && coils === last.coils) return;
  last.rot = rot;
  last.reversed = reversed;
  last.selectedCoil = selectedCoil;
  last.commPitch = commPitch;
  last.currentColors = currentColors;
  last.coils = coils;

  // ламели/петушки, принадлежащие выбранной секции (её начало и конец)
  const selSegs = new Set();
  if (selectedCoil !== null) {
    selSegs.add(selectedCoil);
    selSegs.add((selectedCoil + commPitch) % SEG);
  }

  const cosRot = Math.cos(rot);
  const sinRot = Math.sin(rot);

  for (let i = 0; i < SEG; i++) {
    const aSeg = i * SEG_GAP + SEG_GAP * SLOT_PHASE - rot;
    const positiveSide = Math.cos(aSeg) > 0;
    const colSeg = currentColors
      ? ((positiveSide !== reversed) ? COLORS.PLUS : COLORS.MINUS)
      : COLORS.COPPER;
    const selectedHere = selSegs.has(i);
    const colS = selectedHere ? COLORS.SELECT : colSeg;
    const segGlow = selectedHere ? 1.3 : (currentColors ? 0.22 : 0.06);

    const seg = segments[i];
    seg.material.color.setHex(colS);
    seg.material.emissive.setHex(colS);
    seg.material.emissiveIntensity = segGlow;

    const riser = risers[i];
    riser.material.color.setHex(colS);
    riser.material.emissive.setHex(colS);
    riser.material.emissiveIntensity = segGlow;

    // провод i — вершинная раскраска по угловой позиции каждой вершины
    const coil = coils[i];
    if (!coil) continue;

    if (i === selectedCoil) {
      fillColor(coil, C_SELECT);
      coil.material.emissive.copy(C_SELECT);
      coil.material.emissiveIntensity = 1.8;
    } else if (!currentColors) {
      fillColor(coil, C_COPPER);
      coil.material.emissive.copy(C_BLACK);
      coil.material.emissiveIntensity = 0;
    } else {
      const attr = coil.geometry.getAttribute('color');
      const arr = attr.array;
      const { cos, sin } = coil.userData;
      for (let v = 0; v < cos.length; v++) {
        const posSide = (cos[v] * cosRot + sin[v] * sinRot) > 0;
        const c = (posSide !== reversed) ? C_PLUS : C_MINUS;
        const o = v * 3;
        arr[o] = c.r;
        arr[o + 1] = c.g;
        arr[o + 2] = c.b;
      }
      attr.needsUpdate = true;
      coil.material.emissive.copy(C_BLACK);
      coil.material.emissiveIntensity = 0;
    }
  }
}
