import * as THREE from 'three';

// Спрайт с текстом (подписи щёток, номера ламелей).
export function makeLabelSprite(text, color, depthTest = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.font = 'bold 100px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest,
  }));
  sp.scale.set(70, 70, 1);
  return sp;
}
