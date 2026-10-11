import * as THREE from 'three';
import {
  AXIS, COMM_LEN, COMM_CENTER, RADII, SEG, SEG_GAP, SLOT_PHASE, RISER, COLORS,
} from '../config.js';
import { cylX } from '../lib/geometry.js';

// Коллектор: тёмная основа (миканит) + медные ламели + петушки для пайки обмотки.
// Возвращает массивы мешей ламелей и петушков (нужны для раскраски и клика).
export function buildCommutator(parent, darkMaterial) {
  // Основа чуть короче торцов ламелей, иначе совпадающие плоскости дают z-fighting.
  parent.add(cylX(RADII.COMM - 3, COMM_LEN - 6, COMM_CENTER, darkMaterial, 48));

  const riserGeo = new THREE.BoxGeometry(RISER.LEN, RISER.RAD, RISER.TAN);
  const segMeshes = [];
  const riserMeshes = [];

  for (let i = 0; i < SEG; i++) {
    const tcLen = SEG_GAP * 0.82;
    const ang = i * SEG_GAP + SEG_GAP * SLOT_PHASE; // совпадает с центром паза
    const tcStart = ang - tcLen / 2;

    const g = new THREE.CylinderGeometry(RADII.COMM, RADII.COMM, COMM_LEN, 12, 1, false, tcStart, tcLen);
    g.rotateZ(Math.PI / 2);
    g.translate(COMM_CENTER, 0, 0);
    const seg = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: COLORS.COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000,
    }));
    seg.castShadow = true;
    seg.userData.index = i;
    parent.add(seg);
    segMeshes.push(seg);

    // петушок: небольшой выступ на торце со стороны якоря
    const riser = new THREE.Mesh(riserGeo, new THREE.MeshStandardMaterial({
      color: COLORS.COPPER, metalness: 1.0, roughness: 0.3, emissive: 0x000000,
    }));
    riser.rotation.x = Math.PI / 2 - ang;
    riser.position.set(
      AXIS.COMM_X1 - RISER.LEN / 2 + 6,
      RADII.COMM * Math.sin(ang),
      RADII.COMM * Math.cos(ang),
    );
    riser.castShadow = true;
    riser.userData.index = i;
    parent.add(riser);
    riserMeshes.push(riser);
  }

  return { segMeshes, riserMeshes };
}
