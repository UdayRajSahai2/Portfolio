import * as THREE from 'three';
import { mat, mesh, box, at, canvasTex } from './build.js';
import { X0, X1, ZB, ZF, H, FRONT_Z } from './layout.js';

// Light, the ground outside, the floor, the three walls and the bunting.
export function buildShell(scene, { root, P, rand }) {
  // ── lights: daylight from the top left, as the page's shadows fall ──
  scene.add(new THREE.HemisphereLight(P.pageBg, P.wall, 2.1));
  const sun = new THREE.DirectionalLight(P.pageBg, 1.9);
  sun.position.set(-10, 16, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -9, near: 4, far: 40 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  // ── outside: ground and a path to the door ────────────────
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat(P.ground, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  ground.userData.wall = true;
  root.add(ground);
  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 40), mat(P.path, { roughness: 1 }));
  pathMesh.rotation.x = -Math.PI / 2;
  at(pathMesh, 0, -0.02, FRONT_Z + 20);
  pathMesh.receiveShadow = true;
  pathMesh.userData.wall = true;
  root.add(pathMesh);

  // ── shell: floor and three walls ──────────────────────────
  const floorTex = canvasTex(1024, 1024, (ctx, w, h) => {
    const rows = 14;
    const rh = h / rows;
    ctx.fillStyle = P.floor;
    ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 300;
      while (x < w) {
        const len = 260 + rand() * 300;
        ctx.globalAlpha = rand() * 0.12;
        ctx.fillStyle = rand() < 0.5 ? P.floorSeam : P.paper;
        ctx.fillRect(x, r * rh, len, rh);
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = P.floorSeam;
        ctx.fillRect(x, r * rh, 3, rh);
        x += len;
      }
      ctx.globalAlpha = 0.7;
      ctx.fillRect(0, r * rh, w, 3);
    }
    ctx.globalAlpha = 1;
  });
  floorTex.tex.wrapS = floorTex.tex.wrapT = THREE.RepeatWrapping;
  floorTex.tex.repeat.set(1.6, 1);
  const floorSide = mat(P.woodDark);
  const floor = mesh(new THREE.BoxGeometry(X1 - X0, 0.3, ZF - ZB), [floorSide, floorSide, mat(P.floor, { map: floorTex.tex, roughness: 0.7 }), floorSide, floorSide, floorSide]);
  // the map multiplies the base colour, so keep the base white-ish
  floor.material[2].color.set(P.paper);
  at(floor, 0, -0.15, (ZB + ZF) / 2);
  floor.userData.floor = true;
  root.add(floor);

  const wallBack = mat(P.wall, { roughness: 0.95 });
  const wallSide = mat(P.wallSide, { roughness: 0.95 });
  const back = at(box(X1 - X0 + 0.6, H, 0.3, wallBack), 0, H / 2, ZB - 0.15);
  const left = at(box(0.3, H, ZF - ZB + 0.3), X0 - 0.15, H / 2, (ZB + ZF) / 2);
  const right = at(box(0.3, H, ZF - ZB + 0.3), X1 + 0.15, H / 2, (ZB + ZF) / 2);
  left.material = wallSide;
  right.material = wallSide;
  for (const w of [back, left, right]) w.userData.wall = true;
  root.add(back, left, right);
  root.add(at(box(X1 - X0, 0.22, 0.05, P.trim), 0, 0.11, ZB + 0.02));
  root.add(at(box(0.05, 0.22, ZF - ZB, P.trim), X0 + 0.02, 0.11, (ZB + ZF) / 2));
  root.add(at(box(0.05, 0.22, ZF - ZB, P.trim), X1 - 0.02, 0.11, (ZB + ZF) / 2));

  // paper bunting along the back wall
  {
    const flags = [P.accent, P.accent2, P.accent3, P.mint];
    const tri = new THREE.Shape();
    tri.moveTo(-0.22, 0);
    tri.lineTo(0.22, 0);
    tri.lineTo(0, -0.42);
    tri.closePath();
    const geo = new THREE.ShapeGeometry(tri);
    const n = 22;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const x = X0 + 0.6 + u * (X1 - X0 - 1.2);
      const sag = Math.sin(u * Math.PI * 2) ** 2 * 0.5;
      const f = new THREE.Mesh(geo, mat(flags[i % flags.length], { side: THREE.DoubleSide, roughness: 1 }));
      at(f, x, 7.4 - sag, ZB + 0.04);
      f.rotation.z = (rand() - 0.5) * 0.15;
      f.userData.wall = true;
      root.add(f);
    }
  }
}
