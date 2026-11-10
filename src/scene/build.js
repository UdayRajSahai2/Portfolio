import * as THREE from 'three';

// Small helpers every part of the room is built with.

// Materials are shared by colour and options. Hover glow clones them per zone
// (main.js), so sharing here never lights up an unrelated object.
const matCache = new Map();
export function mat(color, o = {}) {
  if (o.map || o.transparent) return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02, ...o });
  const key = `${color}|${JSON.stringify(o)}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02, ...o }));
  return matCache.get(key);
}
export function mesh(geo, color, o) {
  const material = Array.isArray(color) || color instanceof THREE.Material ? color : mat(color, o);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
export const box = (w, h, d, c, o) => mesh(new THREE.BoxGeometry(w, h, d), c, o);
export const cyl = (rt, rb, h, c, seg = 32, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, o);
export const sphere = (r, c, o, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), c, o);
export function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}
export function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, canvas: c, ctx };
}
