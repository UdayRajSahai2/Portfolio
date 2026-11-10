import * as THREE from 'three';
import { cyl, sphere, at } from './build.js';

// a potted plant, used on the porch and in corners
export function plant(P, rand, scale = 1) {
  const g = new THREE.Group();
  g.add(at(cyl(0.34, 0.26, 0.6, P.pot, 24, { roughness: 0.5 }), 0, 0.3, 0));
  g.add(at(cyl(0.3, 0.3, 0.04, P.woodDark, 24), 0, 0.58, 0));
  // leaves grow up and out at uneven angles and heights, like a real clump
  const leaves = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const leaf = sphere(0.16, P.leaf, { roughness: 0.6 }, 10);
    const len = 1.5 + rand() * 0.9;
    leaf.scale.set(0.42, len, 0.16);
    const pivot = new THREE.Group();
    pivot.rotation.order = 'YXZ';
    at(pivot, (rand() - 0.5) * 0.12, 0.58, (rand() - 0.5) * 0.12);
    pivot.rotation.y = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.7;
    pivot.userData.tilt = i === 0 ? 0.05 : 0.18 + rand() * 0.32;
    pivot.rotation.x = pivot.userData.tilt;
    at(leaf, 0, 0.16 * len, 0);
    pivot.add(leaf);
    g.add(pivot);
    leaves.push(pivot);
  }
  g.scale.setScalar(scale);
  return { group: g, leaves };
}
