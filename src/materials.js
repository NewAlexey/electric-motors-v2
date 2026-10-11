import * as THREE from 'three';
import { COLORS } from './config.js';

export const matShaft = new THREE.MeshStandardMaterial({
  color: COLORS.SHAFT, metalness: 0.95, roughness: 0.22,
});

export const matCore = new THREE.MeshStandardMaterial({
  color: COLORS.CORE, metalness: 0.85, roughness: 0.45,
});

export const matDark = new THREE.MeshStandardMaterial({
  color: COLORS.DARK, metalness: 0.4, roughness: 0.8,
});
