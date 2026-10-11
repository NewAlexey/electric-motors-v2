import * as THREE from 'three';

// Рама: наклоняет весь узел и держит неподвижные элементы (щётки) независимо от якоря.
// Якорь вращается внутри рамы вокруг оси X.
export function createFrame(scene) {
  const motorFrame = new THREE.Group();
  motorFrame.rotation.z = 0.15; // лёгкий наклон для перспективы
  scene.add(motorFrame);

  const armature = new THREE.Group();
  motorFrame.add(armature);

  return { motorFrame, armature };
}
