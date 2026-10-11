import { RADII, SEG, SEG_GAP, SLOT_PHASE, COMM_CENTER } from '../config.js';
import { polar } from '../lib/geometry.js';
import { makeLabelSprite } from '../lib/label.js';

// Номера ламелей: спрайты в той же угловой системе, что и ламели.
// Добавляются в якорь, поэтому вращаются вместе с ним.
export function createNumbers(parent) {
  const sprites = [];
  let dist = 32; // отступ цифры от поверхности ламели

  function layout() {
    for (const n of sprites) {
      n.sprite.position.copy(polar(n.angle, RADII.COMM + dist, COMM_CENTER));
    }
  }

  for (let i = 0; i < SEG; i++) {
    const a = i * SEG_GAP + SEG_GAP * SLOT_PHASE;
    const sp = makeLabelSprite(String(i + 1), '#ffffff', true);
    sp.scale.set(30, 30, 1);
    sp.position.copy(polar(a, RADII.COMM + dist, COMM_CENTER));
    parent.add(sp);
    sprites.push({ sprite: sp, angle: a });
  }

  return {
    sprites,
    setVisible(v) {
      for (const n of sprites) n.sprite.visible = v;
    },
    setDistance(d) {
      dist = d;
      layout();
    },
  };
}
