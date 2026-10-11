import { AXIS, RADII } from '../config.js';
import { cylX } from '../lib/geometry.js';

// Вал: три участка (левый, средний у коллектора, правый).
export function buildShafts(parent, material) {
  parent.add(cylX(RADII.SHAFT, AXIS.LEFT_SHAFT_X2 - AXIS.LEFT_SHAFT_X1,
    (AXIS.LEFT_SHAFT_X1 + AXIS.LEFT_SHAFT_X2) / 2, material));
  parent.add(cylX(RADII.SHAFT, AXIS.MID_SHAFT_X2 - AXIS.MID_SHAFT_X1,
    (AXIS.MID_SHAFT_X1 + AXIS.MID_SHAFT_X2) / 2, material));
  parent.add(cylX(RADII.SHAFT, AXIS.RIGHT_SHAFT_X2 - AXIS.RIGHT_SHAFT_X1,
    (AXIS.RIGHT_SHAFT_X1 + AXIS.RIGHT_SHAFT_X2) / 2, material));
}
