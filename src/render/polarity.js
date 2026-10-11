import { SEG, SEG_GAP, SLOT_PHASE, COLORS } from '../config.js';

// Раскраска по направлению тока: плоскость, проходящая через щётки,
// делит обмотку на две половины с противоположным направлением тока.
// При вращении секции проходят под щётками и меняют полярность (коммутация).
export function paintPolarity({ rot, reversed, selectedCoil, commPitch = 1, segments, risers, coils }) {
  // ламели/петушки, принадлежащие выбранной секции (её начало и конец)
  const selSegs = new Set();
  if (selectedCoil !== null) {
    selSegs.add(selectedCoil);
    selSegs.add((selectedCoil + commPitch) % SEG);
  }

  for (let i = 0; i < SEG; i++) {
    const aSeg = i * SEG_GAP + SEG_GAP * SLOT_PHASE - rot;
    const positiveSide = Math.cos(aSeg) > 0;
    const colSeg = (positiveSide !== reversed) ? COLORS.PLUS : COLORS.MINUS;
    const selectedHere = selSegs.has(i);
    const colS = selectedHere ? COLORS.SELECT : colSeg;
    const segGlow = selectedHere ? 1.3 : 0.22;

    const seg = segments[i];
    seg.material.color.setHex(colS);
    seg.material.emissive.setHex(colS);
    seg.material.emissiveIntensity = segGlow;

    const riser = risers[i];
    riser.material.color.setHex(colS);
    riser.material.emissive.setHex(colS);
    riser.material.emissiveIntensity = segGlow;

    // секция i (её концы — на ламелях i и i+1)
    const coil = coils[i];
    if (i === selectedCoil) {
      // выделенный провод — свой цвет и усиленное свечение
      coil.material.color.setHex(COLORS.SELECT);
      coil.material.emissive.setHex(COLORS.SELECT);
      coil.material.emissiveIntensity = 1.8;
    } else {
      coil.material.color.setHex(colSeg);
      coil.material.emissive.setHex(colSeg);
      coil.material.emissiveIntensity = 0.16;
    }
  }
}
