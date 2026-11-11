import * as THREE from 'three';
import { mat } from './parts.js';

// An open book held in front of the chest. The left page carries the title and
// author; the other pages show soft lines, never the book's own words.
// `show(book)` redraws the title page and the cover for another book; a book
// may carry its own cover colours ({ cloth, ink }), as it looks on the shelf.
export function makeBook({ font, colors, book }) {
  const g = new THREE.Group();
  const canvasMat = (w, h, roughness, side) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { ctx: c.getContext('2d'), tex: t, material: new THREE.MeshStandardMaterial({ map: t, roughness, side }) };
  };
  const page = (draw) => {
    const p = canvasMat(256, 340, 0.9, THREE.DoubleSide);
    p.redraw = (b) => {
      p.ctx.fillStyle = colors.paper;
      p.ctx.fillRect(0, 0, 256, 340);
      draw(p.ctx, b);
      p.tex.needsUpdate = true;
    };
    p.redraw(book);
    return p;
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
  const titlePage = page((ctx, b) => {
    ctx.fillStyle = colors.ink;
    ctx.font = `600 30px ${font}`;
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, b.title, 210).slice(0, 4);
    lines.forEach((l, i) => ctx.fillText(l, 128, 110 + i * 36));
    ctx.fillStyle = colors.muted;
    ctx.font = `500 22px ${font}`;
    ctx.fillText(b.by, 128, 132 + lines.length * 36);
  });
  const lined = () =>
    page((ctx) => {
      ctx.fillStyle = colors.muted;
      ctx.globalAlpha = 0.35;
      for (let y = 50; y < 300; y += 22) ctx.fillRect(28, y, 170 + ((y * 7) % 30), 6);
      ctx.globalAlpha = 1;
    });
  const W = 0.24;
  const Hh = 0.32;
  const coverMat = mat(colors.cover);
  const outside = canvasMat(512, 344, 0.8, THREE.FrontSide);
  const drawCover = (b) => {
    const ctx = outside.ctx;
    coverMat.color.set(b.cloth || colors.cover);
    ctx.fillStyle = b.cloth || colors.cover;
    ctx.fillRect(0, 0, 512, 344);
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(250, 0, 12, 344); // the spine
    ctx.globalAlpha = 1;
    // seen from outside, the front cover is the right half
    ctx.fillStyle = b.ink || colors.paper;
    // kept clear of the edge, where his hand grips the cover
    ctx.font = `600 26px ${font}`;
    ctx.textAlign = 'center';
    const lines = wrapText(ctx, b.title, 170).slice(0, 5);
    lines.forEach((l, i) => ctx.fillText(l, 366, 100 + i * 32));
    ctx.font = `500 20px ${font}`;
    ctx.fillText(b.by, 366, 120 + lines.length * 32);
    outside.tex.needsUpdate = true;
  };
  drawCover(book);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.04, Hh + 0.03, 0.02), [coverMat, coverMat, coverMat, coverMat, coverMat, outside.material]);
  cover.position.z = -0.012;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), titlePage.material);
  left.position.set(-W / 2 - 0.005, 0, 0.002);
  left.rotation.y = 0.12;
  const right = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), lined().material);
  right.position.set(W / 2 + 0.005, 0, 0.002);
  right.rotation.y = -0.12;
  // the turning page hinges on the spine
  const flip = new THREE.Group();
  const leaf = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), lined().material);
  leaf.position.x = W / 2;
  flip.add(leaf);
  flip.position.z = 0.006;
  flip.visible = false;
  g.add(cover, left, right, flip);
  g.traverse((o) => (o.userData.noGlow = true));

  let shown = book;
  return {
    group: g,
    flip,
    show(b) {
      if (!b?.title || b === shown) return;
      shown = b;
      titlePage.redraw(b);
      drawCover(b);
    },
  };
}
