import * as THREE from 'three';

// Mesh helpers for the character. Its materials are its own (not the room's
// shared cache), so the avatar's colours never leak into the furniture.
export const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
export function part(geo, m, x = 0, y = 0, z = 0) {
  const p = new THREE.Mesh(geo, m);
  p.position.set(x, y, z);
  p.castShadow = true;
  p.receiveShadow = true;
  return p;
}
