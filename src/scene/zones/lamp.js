import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, cyl, at } from '../build.js';

// The desk lamp: a toggle, not a section.
export function buildLamp({ root, P, D }) {
  const g = new THREE.Group();
  g.add(at(cyl(0.2, 0.24, 0.06, P.steel), 0, 0.03, 0));
  g.add(at(cyl(0.025, 0.025, 0.75, P.steel, 10), 0, 0.42, 0));
  const arm = at(cyl(0.022, 0.022, 0.45, P.steel, 10), 0.16, 0.86, 0.05);
  arm.rotation.z = -1.0;
  g.add(arm);
  const head = new THREE.Group();
  at(head, 0.36, 0.95, 0.12);
  head.rotation.z = -0.55;
  head.add(mesh(new THREE.ConeGeometry(0.26, 0.32, 28, 1, true), mat(P.accent, { side: THREE.DoubleSide, roughness: 0.5 })));
  const bulbMat = new THREE.MeshStandardMaterial({ color: P.light, emissive: P.light, emissiveIntensity: 2 });
  const bulb = at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), bulbMat), 0, -0.1, 0);
  bulb.userData.noGlow = true;
  head.add(bulb);
  g.add(head);
  at(g, -1.55, 1.56, -4.35);
  root.add(g);

  const light = new THREE.PointLight(P.light, 5, 8, 1.6);
  head.add(light);
  light.position.set(0, -0.18, 0);

  let on = true;
  return {
    group: g,
    toggle() {
      on = !on;
      sound.toggle();
      gsap.to(light, { intensity: on ? 5 : 0, duration: 0.25 * D });
      gsap.to(bulbMat, { emissiveIntensity: on ? 2 : 0, duration: 0.25 * D });
    },
  };
}
