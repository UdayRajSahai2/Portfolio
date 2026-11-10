import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, box, at } from '../build.js';

// CONTACT: an envelope on the desk that opens.
export function buildContact({ root, P, D }) {
  const g = new THREE.Group();
  g.add(at(box(0.52, 0.016, 0.34, P.paper, { roughness: 0.9 }), 0, 0.008, 0));
  const letter = at(box(0.46, 0.006, 0.3, P.paper, { roughness: 0.9 }), 0, 0.012, 0);
  g.add(letter);
  g.add(at(box(0.08, 0.004, 0.1, P.accent3), 0.18, 0.018, 0.08));
  const shape = new THREE.Shape();
  shape.moveTo(-0.26, 0);
  shape.lineTo(0.26, 0);
  shape.lineTo(0, 0.2);
  shape.closePath();
  const flapPivot = new THREE.Group();
  at(flapPivot, 0, 0.018, -0.17);
  const flap = mesh(new THREE.ShapeGeometry(shape), mat(P.sand, { side: THREE.DoubleSide, roughness: 0.9 }));
  flap.rotation.x = Math.PI / 2;
  flapPivot.add(flap);
  g.add(flapPivot);
  at(g, 1.2, 1.565, -3.55);
  g.rotation.y = -0.3;
  root.add(g);

  return {
    group: g,
    stand: { x: 2.3, z: -2.7, look: [1.2, -3.55] },
    view: { pos: [0.55, 3.0, -1.85], target: [1.15, 1.57, -3.6] },
    onFocus() {
      sound.paper();
      gsap.to(flapPivot.rotation, { x: -2.6, duration: 0.6 * D, ease: 'power2.out' });
      gsap.to(letter.position, { z: -0.22, y: 0.05, duration: 0.6 * D, delay: 0.35 * D, ease: 'power2.out' });
    },
    onBlur() {
      gsap.to(letter.position, { z: 0, y: 0.012, duration: 0.4 * D });
      gsap.to(flapPivot.rotation, { x: 0, duration: 0.5 * D, delay: 0.25 * D });
    },
  };
}
