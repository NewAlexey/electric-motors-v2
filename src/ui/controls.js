import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Орбитальное управление камерой.
export function createOrbitControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.9;
  controls.minDistance = 350;
  controls.maxDistance = 1600;
  controls.target.set(0, 0, 0);
  controls.autoRotate = false;
  controls.update();
  return controls;
}
