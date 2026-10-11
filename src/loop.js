import * as THREE from 'three';
import { getState } from './state.js';
import { paintPolarity } from './render/polarity.js';

// Цикл кадров: вращение якоря, раскраска полярности, рендер.
export function startLoop({ scene, camera, renderer, controls, armature, meshes }) {
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const s = getState();

    // собственное вращение якоря вокруг вала
    if (s.spinning) armature.rotation.x += dt * s.speed * (s.reversed ? -1 : 1);

    paintPolarity({
      rot: armature.rotation.x,
      reversed: s.reversed,
      selectedCoil: s.selectedCoil,
      ...meshes,
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
