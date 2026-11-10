import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, box, sphere, at, canvasTex } from '../build.js';
import { X0, X1, H, DOOR_W, DOOR_H, FRONT_Z } from '../layout.js';
import { plant } from '../props.js';

// The front wall, the door the character opens, the doormat and a porch plant.
export function buildEntrance({ root, P, rand, D, font, labels }) {
const facade = new THREE.Group();
const fadeMats = [];
const fm = (c, o) => {
  const m = mat(c, { transparent: true, opacity: 1, ...o });
  fadeMats.push(m);
  return m;
};
const facadeMat = fm(P.facade, { roughness: 0.95 });
const trimMat = fm(P.facadeTrim);
const sideW = (X1 - X0 + 0.6) / 2 - DOOR_W / 2;
facade.add(at(box(sideW, H, 0.3, facadeMat), -(DOOR_W / 2 + sideW / 2), H / 2, FRONT_Z));
facade.add(at(box(sideW, H, 0.3, facadeMat), DOOR_W / 2 + sideW / 2, H / 2, FRONT_Z));
facade.add(at(box(DOOR_W, H - DOOR_H, 0.3, facadeMat), 0, DOOR_H + (H - DOOR_H) / 2, FRONT_Z));
// door frame
facade.add(at(box(0.16, DOOR_H + 0.16, 0.42, trimMat), -DOOR_W / 2 - 0.08, (DOOR_H + 0.16) / 2, FRONT_Z));
facade.add(at(box(0.16, DOOR_H + 0.16, 0.42, trimMat), DOOR_W / 2 + 0.08, (DOOR_H + 0.16) / 2, FRONT_Z));
facade.add(at(box(DOOR_W + 0.32, 0.16, 0.42, trimMat), 0, DOOR_H + 0.08, FRONT_Z));
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
const signMat = new THREE.MeshStandardMaterial({ map: sign.tex, transparent: true, roughness: 0.9 });
fadeMats.push(signMat);
facade.add(at(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.69), signMat), 0, DOOR_H + 0.85, FRONT_Z + 0.16));
facade.traverse((o) => (o.userData.wall = true));

// the door leaf swings on a hinge on its left edge
const doorPivot = new THREE.Group();
at(doorPivot, -DOOR_W / 2, 0, FRONT_Z);
const doorMat = fm(P.door, { roughness: 0.6 });
const doorPanel = fm(P.doorDeep, { roughness: 0.6 });
const leaf = new THREE.Group();
leaf.add(at(box(DOOR_W - 0.04, DOOR_H - 0.04, 0.12, doorMat), DOOR_W / 2, DOOR_H / 2, 0));
for (const s of [-1, 1]) {
  leaf.add(at(box(DOOR_W - 0.6, 1.2, 0.02, doorPanel), DOOR_W / 2, DOOR_H * 0.7, 0.07 * s));
  leaf.add(at(box(DOOR_W - 0.6, 1.2, 0.02, doorPanel), DOOR_W / 2, DOOR_H * 0.3, 0.07 * s));
  leaf.add(at(sphere(0.07, fm(P.metal, { metalness: 0.6, roughness: 0.3 })), DOOR_W - 0.25, DOOR_H * 0.48, 0.12 * s));
}
doorPivot.add(leaf);
facade.add(doorPivot);
root.add(facade);

// the cut edge of the front wall stays, like a dollhouse
for (const s of [-1, 1]) root.add(at(box(sideW, 0.35, 0.3, P.facadeTrim), s * (DOOR_W / 2 + sideW / 2), 0.175, FRONT_Z));

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
  fade(duration = 0.9) {
    for (const m of fadeMats) m.depthWrite = false;
    gsap.to(fadeMats, {
      opacity: 0,
      duration: duration * D,
      ease: 'power1.in',
      onComplete: () => {
        facade.removeFromParent();
      },
    });
  },
};

  return { entrance, porchPlant };
}
