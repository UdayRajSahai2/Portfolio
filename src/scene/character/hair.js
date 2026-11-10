import * as THREE from 'three';
import { part } from './parts.js';

// The hair styles named in content.js `avatar.hairStyle`.
export function buildHair(head, look, hairMat) {
  const cap = (r, theta, tilt = -0.3) => {
    const m = part(new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, theta), hairMat);
    m.rotation.x = tilt;
    return m;
  };
  const backOf = (r, theta) => part(new THREE.SphereGeometry(r, 28, 18, Math.PI, Math.PI, 0, theta), hairMat);

  switch (look.hairStyle) {
    case 'buzz':
      head.add(cap(0.43, 1.2), backOf(0.43, 1.9));
      break;
    case 'curly': {
      head.add(cap(0.44, 1.25), backOf(0.44, 1.95));
      const g = new THREE.SphereGeometry(1, 10, 8);
      for (let i = 0; i < 34; i++) {
        const th = 0.15 + Math.random() * 1.15;
        const ph = Math.random() * Math.PI * 2;
        const r = 0.45;
        const v = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).multiplyScalar(r);
        v.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
        const s = part(g, hairMat, v.x, v.y, v.z);
        s.scale.setScalar(0.08 + Math.random() * 0.05);
        head.add(s);
      }
      break;
    }
    case 'long':
      head.add(cap(0.45, 1.35), backOf(0.45, 2.4));
      head.add(part(new THREE.BoxGeometry(0.72, 0.75, 0.16), hairMat, 0, -0.4, -0.3));
      break;
    case 'bun':
      head.add(cap(0.45, 1.35), backOf(0.45, 2.0));
      head.add(part(new THREE.SphereGeometry(0.17, 16, 12), hairMat, 0, 0.42, -0.2));
      break;
    case 'spiky': {
      head.add(cap(0.44, 1.3), backOf(0.44, 1.95));
      const cone = new THREE.ConeGeometry(0.09, 0.26, 8);
      for (let i = 0; i < 12; i++) {
        const th = 0.2 + (i % 3) * 0.35;
        const ph = (i / 12) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
        dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.35);
        const c = part(cone, hairMat, dir.x * 0.44, dir.y * 0.44, dir.z * 0.44);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        head.add(c);
      }
      break;
    }
    case 'short':
    default: {
      head.add(cap(0.45, 1.35), backOf(0.45, 2.0));
      // a soft fringe sweeping to one side
      const fringe = part(new THREE.SphereGeometry(0.2, 16, 10), hairMat, 0.1, 0.3, 0.3);
      fringe.scale.set(1.6, 0.55, 0.7);
      fringe.rotation.z = -0.25;
      head.add(fringe);
    }
  }
}
