import * as THREE from 'three';
import { COMM_LEN, COMM_CENTER, RADII, BRUSH_ANGLE, COLORS } from '../config.js';
import { polar } from '../lib/geometry.js';
import { makeLabelSprite } from '../lib/label.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// Щётка: корпус (графит) + цветная контактная накладка + обе подписи «+»/«−».
// Не вращается вместе с якорем — добавляется в раму.
function makeBrush(parent, theta) {
  const grp = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x14151a, metalness: 0.3, roughness: 0.9,
    emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.35,
  });
  grp.add(new THREE.Mesh(new THREE.BoxGeometry(COMM_LEN * 0.7, 24, 26), bodyMat));

  // Накладка чуть уже корпуса по X и Z, иначе совпадающие грани дают z-fighting.
  const padMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 0.6, roughness: 0.4,
    emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.8,
  });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(COMM_LEN * 0.7 - 3, 6, 24), padMat);
  pad.position.y = -12.5; // внутрь, к коллектору
  grp.add(pad);

  grp.rotation.x = Math.PI / 2 - theta;
  grp.position.copy(polar(theta, RADII.COMM + 15, COMM_CENTER));
  parent.add(grp);

  // Обе подписи сразу; нужную показываем при раскраске.
  const plusLbl = makeLabelSprite('+', hex(COLORS.PLUS));
  const minusLbl = makeLabelSprite('−', hex(COLORS.MINUS));
  for (const s of [plusLbl, minusLbl]) {
    s.position.copy(polar(theta, RADII.COMM + 65, COMM_CENTER));
    parent.add(s);
  }

  return { bodyMat, padMat, plusLbl, minusLbl };
}

function setPolarity(item, positive) {
  const colorHex = positive ? COLORS.PLUS : COLORS.MINUS;
  item.bodyMat.emissive.setHex(colorHex);
  item.padMat.color.setHex(colorHex);
  item.padMat.emissive.setHex(colorHex);
  item.plusLbl.visible = positive;
  item.minusLbl.visible = !positive;
}

// Создаёт обе щётки. apply(reversed) меняет полюса местами.
export function createBrushes(parent) {
  const top = makeBrush(parent, BRUSH_ANGLE.PLUS);
  const bottom = makeBrush(parent, BRUSH_ANGLE.MINUS);

  function apply(reversed) {
    setPolarity(top, !reversed);
    setPolarity(bottom, reversed);
  }

  apply(false);
  return { apply };
}
