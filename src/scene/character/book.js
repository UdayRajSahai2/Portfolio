import * as THREE from 'three';
import { mat } from './parts.js';

// An open book held in front of the chest. The left page carries the title and
// author; the other pages show soft lines, never the book's own words.
export function makeBook({ font, colors, book }) {
  const g = new THREE.Group();
  const page = (draw) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 340;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, 256, 340);
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide });
  };
  const wrapText = (ctx, text, maxW) => {
    const lines = [];
    let line = '';
    for (const w of String(text).split(' ')) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const titlePage = page((ctx) => {
    ctx.fillStyle = colors.ink;
    ctx.font = `600 34px ${font}`;
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, book.title, 210);
    lines.forEach((l, i) => ctx.fillText(l, 128, 120 + i * 40));
    ctx.fillStyle = colors.muted;
    ctx.font = `500 22px ${font}`;
    ctx.fillText(book.by, 128, 140 + lines.length * 40);
  });
  const lined = () =>
    page((ctx) => {
      ctx.fillStyle = colors.muted;
      ctx.globalAlpha = 0.35;
      for (let y = 50; y < 300; y += 22) ctx.fillRect(28, y, 170 + ((y * 7) % 30), 6);
    });
  const W = 0.24;
  const Hh = 0.32;
  const coverMat = mat(colors.cover);
  const outside = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 344;
    const ctx = c.getContext('2d');
    ctx.fillStyle = colors.cover;
    ctx.fillRect(0, 0, 512, 344);
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(250, 0, 12, 344); // the spine
    ctx.globalAlpha = 1;
    // seen from outside, the front cover is the right half
    ctx.fillStyle = colors.paper;
    // kept clear of the edge, where his hand grips the cover
    ctx.font = `600 30px ${font}`;
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, book.title, 170);
    lines.forEach((l, i) => ctx.fillText(l, 366, 110 + i * 36));
    ctx.font = `500 20px ${font}`;
    ctx.fillText(book.by, 366, 128 + lines.length * 36);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
  })();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.04, Hh + 0.03, 0.02), [coverMat, coverMat, coverMat, coverMat, coverMat, outside]);
  cover.position.z = -0.012;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), titlePage);
  left.position.set(-W / 2 - 0.005, 0, 0.002);
  left.rotation.y = 0.12;
  const right = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), lined());
  right.position.set(W / 2 + 0.005, 0, 0.002);
  right.rotation.y = -0.12;
  // the turning page hinges on the spine
  const flip = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), lined());
  leaf.position.x = W / 2;
  flip.add(leaf);
  flip.position.z = 0.006;
  flip.visible = false;
  g.add(cover, left, right, flip);
  g.traverse((o) => (o.userData.noGlow = true));
  return { group: g, flip };
}
