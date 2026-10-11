import * as THREE from 'three';

// Выбор объекта кликом. onPick получает индекс (userData.index) или null.
export function createPicker({ domElement, camera, objects, onPick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downX = 0;
  let downY = 0;

  domElement.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });

  domElement.addEventListener('pointerup', (e) => {
    // не считаем кликом перетаскивание камеры
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;

    const rect = domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(objects, false);
    const idx = (hits.length && hits[0].object.userData.index !== undefined)
      ? hits[0].object.userData.index
      : null;
    onPick(idx);
  });
}
