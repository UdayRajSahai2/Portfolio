import * as THREE from 'three';
import { mat, box, cyl, at } from '../build.js';

// The desk, the desk chair and a mug. The code zone sits on top of it.
export function buildDesk({ root, P }) {
const desk = new THREE.Group();
desk.add(at(box(4, 0.12, 1.6, P.wood, { roughness: 0.6 }), 0, 1.5, -4.1));
for (const [x, z] of [[-1.9, -4.8], [1.9, -4.8], [-1.9, -3.4], [1.9, -3.4]]) desk.add(at(box(0.1, 1.44, 0.1, P.woodDark), x, 0.72, z));
desk.add(at(box(0.9, 0.9, 1.4, P.woodDark), 1.35, 0.98, -4.1));
desk.add(at(box(0.6, 0.04, 0.02, P.metal, { metalness: 0.6, roughness: 0.3 }), 1.35, 1.25, -3.39));
desk.add(at(box(0.6, 0.04, 0.02, P.metal, { metalness: 0.6, roughness: 0.3 }), 1.35, 0.8, -3.39));
root.add(desk);

const chair = new THREE.Group();
chair.add(at(box(0.8, 0.1, 0.8, P.fabric), 0, 0.75, 0));
chair.add(at(box(0.8, 0.9, 0.1, P.fabric), 0, 1.25, 0.42));
chair.add(at(cyl(0.05, 0.05, 0.66, P.metal, 12, { metalness: 0.7, roughness: 0.3 }), 0, 0.38, 0));
chair.add(at(cyl(0.4, 0.4, 0.05, P.steel, 5), 0, 0.06, 0));
at(chair, 0, 0, -2.95);
root.add(chair);
// mug
const mug = new THREE.Group();
mug.add(at(cyl(0.11, 0.1, 0.22, P.accent3, 20), 0, 0.11, 0));
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), mat(P.accent3));
at(handle, 0.12, 0.11, 0);
mug.add(handle);
at(mug, -0.95, 1.56, -3.6);
root.add(mug);
}
