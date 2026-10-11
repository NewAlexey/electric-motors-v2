import * as THREE from 'three';

// Создаёт сцену, камеру, рендерер, свет и подставку, вешает обработчик ресайза.
export function createStage(appEl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b202b);
  scene.fog = new THREE.Fog(0x1b202b, 1100, 2200);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    5000,
  );
  camera.position.set(320, 260, 620);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  appEl.appendChild(renderer.domElement);

  addLights(scene);
  addGround(scene);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xdce6ff, 0x2a3140, 1.6));

  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(400, 520, 620);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 100;
  key.shadow.camera.far = 2200;
  key.shadow.camera.left = -600;
  key.shadow.camera.right = 600;
  key.shadow.camera.top = 600;
  key.shadow.camera.bottom = -600;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xa8c0ff, 1.4);
  fill.position.set(-500, -120, -400);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffc088, 1.6);
  rim.position.set(-300, 260, -520);
  scene.add(rim);

  // Мягкая заливающая подсветка сверху
  const top = new THREE.DirectionalLight(0xffffff, 1.1);
  top.position.set(0, 700, 0);
  scene.add(top);

  // Точечный источник для бликов на металле
  const point = new THREE.PointLight(0xffffff, 900, 2500, 2);
  point.position.set(150, 420, 480);
  scene.add(point);
}

function addGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -240;
  ground.receiveShadow = true;
  scene.add(ground);
}
