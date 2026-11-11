import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, box, sphere, at, canvasTex } from '../build.js';
import { X0, X1, H, DOOR_W, DOOR_H, FRONT_Z } from '../layout.js';
import { plant } from '../props.js';

// The front wall, the door the character opens, the doormat and a porch plant.
export function buildEntrance({ root, P, rand, D, font, labels }) {
const facade = new THREE.Group();
// Opaque throughout: a see-through wall flickers as its parts trade places in
// the draw order, so after the door opens the wall sinks into the ground instead (INTRO-04).
const facadeMat = mat(P.facade, { roughness: 0.95 });
const trimMat = mat(P.facadeTrim);
const sideW = (X1 - X0 + 0.6) / 2 - DOOR_W / 2;
// one piece with the doorway cut out of it: built from blocks, the joins between them
// showed as hairlines that shimmered as the camera moved
{
  const W = X1 - X0 + 0.6;
  const outline = new THREE.Shape();
  outline.moveTo(-W / 2, 0);
  outline.lineTo(-DOOR_W / 2, 0);
  outline.lineTo(-DOOR_W / 2, DOOR_H);
  outline.lineTo(DOOR_W / 2, DOOR_H);
  outline.lineTo(DOOR_W / 2, 0);
  outline.lineTo(W / 2, 0);
  outline.lineTo(W / 2, H);
  outline.lineTo(-W / 2, H);
  outline.closePath();
  const wall = mesh(new THREE.ExtrudeGeometry(outline, { depth: 0.3, bevelEnabled: false }), facadeMat);
  facade.add(at(wall, 0, 0, FRONT_Z - 0.15));
}
// door frame: it stands 2 cm into the opening, so its faces never lie in the wall's own
// (level with them, the two traded pixels as the camera passed the doorway)
const IN = 0.02;
facade.add(at(box(0.16, DOOR_H + 0.16, 0.42, trimMat), -DOOR_W / 2 - 0.08 + IN, (DOOR_H + 0.16) / 2, FRONT_Z));
facade.add(at(box(0.16, DOOR_H + 0.16, 0.42, trimMat), DOOR_W / 2 + 0.08 - IN, (DOOR_H + 0.16) / 2, FRONT_Z));
facade.add(at(box(DOOR_W + 0.32 - 2 * IN, 0.16, 0.42, trimMat), 0, DOOR_H + 0.08 - IN, FRONT_Z));
// a sign over the door
const sign = canvasTex(512, 160, (ctx, w, h) => {
  ctx.fillStyle = P.paper;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 36);
  ctx.fill();
  ctx.fillStyle = P.ink;
  ctx.font = `600 70px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.sign || '', w / 2, h / 2 + 4);
});
const signMat = new THREE.MeshStandardMaterial({ map: sign.tex, alphaTest: 0.5, roughness: 0.9 }); // cut out, not blended
facade.add(at(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), signMat), 0, DOOR_H + 0.85, FRONT_Z + 0.19)); // 4 cm off the wall
facade.traverse((o) => (o.userData.wall = true));

// the door leaf swings on a hinge on its left edge
const doorPivot = new THREE.Group();
at(doorPivot, -DOOR_W / 2, 0, FRONT_Z);
const doorMat = mat(P.door, { roughness: 0.6 });
const doorPanel = mat(P.doorDeep, { roughness: 0.6 });
const leaf = new THREE.Group();
leaf.add(at(box(DOOR_W - 0.04, DOOR_H - 0.04, 0.12, doorMat), DOOR_W / 2, DOOR_H / 2, 0));
for (const s of [-1, 1]) {
  leaf.add(at(box(DOOR_W - 0.6, 1.2, 0.02, doorPanel), DOOR_W / 2, DOOR_H * 0.7, 0.07 * s));
  leaf.add(at(box(DOOR_W - 0.6, 1.2, 0.02, doorPanel), DOOR_W / 2, DOOR_H * 0.3, 0.07 * s));
  leaf.add(at(sphere(0.07, mat(P.metal, { metalness: 0.6, roughness: 0.3 })), DOOR_W - 0.25, DOOR_H * 0.48, 0.12 * s));
}
doorPivot.add(leaf);
facade.add(doorPivot);
// The sun comes from the front, so this wall's shadow would fall over most of the room,
// and pull out of it in a blink as the wall sinks. Its shadow only ever falls inside the
// room, where nobody sees it while the wall stands, so the wall casts none.
facade.traverse((o) => (o.castShadow = false));
root.add(facade);

// the cut edge of the front wall stays, like a dollhouse. It is 3 cm thicker than the
// wall on each side, so the two never share a face as the wall stands, sinks or rises.
for (const s of [-1, 1]) root.add(at(box(sideW, 0.35, 0.36, P.facadeTrim), s * (DOOR_W / 2 + sideW / 2), 0.175, FRONT_Z));

// porch: a doormat and a plant
const matTex = canvasTex(512, 280, (ctx, w, h) => {
  ctx.fillStyle = P.kraft;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = P.woodDark;
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.fillStyle = P.woodDark;
  ctx.font = `600 120px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.mat || '', w / 2, h / 2 + 6);
});
const doormat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.03, 1.04), [0, 0, 0, 0, 0, 0].map((_, k) => (k === 2 ? mat(P.paper, { map: matTex.tex, roughness: 1 }) : mat(P.kraft))));
doormat.receiveShadow = true;
at(doormat, 0, 0.0, FRONT_Z + 0.85);
root.add(doormat);
const porchPlant = plant(P, rand, 1.15);
at(porchPlant.group, -2.1, 0, FRONT_Z + 0.75);
root.add(porchPlant.group);

const entrance = {
  stepOutside: { x: 2.6, z: FRONT_Z + 1.9 },
  threshold: { x: 0, z: FRONT_Z + 1.0 },
  inside: { x: 0, z: 2.4 },
  door: { x: 0, z: FRONT_Z },
  open() {
    sound.toggle();
    return gsap.to(doorPivot.rotation, { y: 1.85, duration: 0.8 * D, ease: 'power2.inOut' });
  },
  close() {
    sound.toggle();
    return gsap.to(doorPivot.rotation, { y: 0, duration: 0.7 * D, ease: 'power2.inOut' });
  },
  // the wall sinks below the ground, then leaves the scene
  lower(duration = 0.9) {
    gsap.killTweensOf(facade.position);
    gsap.to(facade.position, {
      y: -H - 0.5,
      duration: duration * D,
      ease: 'power2.in',
      onComplete: () => facade.removeFromParent(),
    });
  },
  // and rises again when he walks a visitor out (INTRO-07)
  raise(duration = 0.9) {
    gsap.killTweensOf(facade.position);
    if (!facade.parent) root.add(facade);
    return gsap.to(facade.position, { y: 0, duration: duration * D, ease: 'power2.out' });
  },
};

  return { entrance, porchPlant };
}
