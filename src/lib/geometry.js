import * as THREE from 'three';

// Цилиндр, вытянутый вдоль оси X, с центром в xCenter.
export function cylX(radius, length, xCenter, material, radialSeg = 64) {
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSeg);
  geo.rotateZ(Math.PI / 2);
  geo.translate(xCenter, 0, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Точка на оси X в плоскости Y-Z. Общая угловая система для пазов и ламелей.
export function polar(angle, radius, x) {
  return new THREE.Vector3(x, radius * Math.sin(angle), radius * Math.cos(angle));
}
