import * as THREE from 'three';
import { AXIS, CORE_LEN, RADII, TEETH, SECTOR, TIP_FRAC } from '../config.js';
import { cylX } from '../lib/geometry.js';

// Тело якоря: цилиндр с продольными пазами (вырезаны в профиле) + торцевые шайбы.
export function buildCore(parent, material, darkMaterial) {
  const shape = new THREE.Shape();
  shape.moveTo(RADII.CORE, 0);
  for (let i = 0; i < TEETH; i++) {
    const start = i * SECTOR;
    const tipEnd = start + SECTOR * TIP_FRAC;
    const slotEnd = (i + 1) * SECTOR;
    shape.absarc(0, 0, RADII.CORE, start, tipEnd, false);
    shape.lineTo(RADII.SLOT * Math.cos(tipEnd), RADII.SLOT * Math.sin(tipEnd));
    shape.absarc(0, 0, RADII.SLOT, tipEnd, slotEnd, false);
    shape.lineTo(RADII.CORE * Math.cos(slotEnd), RADII.CORE * Math.sin(slotEnd));
  }
  // Отверстие под вал
  const hole = new THREE.Path();
  hole.absarc(0, 0, RADII.SHAFT + 1, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: CORE_LEN,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geo.rotateY(-Math.PI / 2); // вытянуть вдоль X в общей угловой системе
  geo.translate(AXIS.CORE_X2, 0, 0); // вытягивание идёт в -X, прижимаем к CORE_X2

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  // Торцевые шайбы якоря (аккуратный стык с валом)
  parent.add(cylX(RADII.CORE * 0.55, 8, AXIS.CORE_X1 - 2, darkMaterial, 48));
  parent.add(cylX(RADII.CORE * 0.55, 8, AXIS.CORE_X2 + 2, darkMaterial, 48));

  return mesh;
}
