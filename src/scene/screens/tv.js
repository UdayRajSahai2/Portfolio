import { canvasTex, mulberry32 } from '../build.js';

// ── TV: one channel per show, drawn in the room's own style ──
// Each channel is a mood picture for its kind (no official artwork) with the
// title set as text.
export function makeTV(P, font, channels) {
  const W = 640;
  const Hh = 360;
  const { tex, ctx } = canvasTex(W, Hh, () => {});
  let ch = 0;
  let t = 0;
  let frame = 0;
  let active = false;

  const title = (text, sub) => {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 40px ${font}`;
    const w = Math.max(ctx.measureText(text).width, 120);
    ctx.fillStyle = P.ink;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.roundRect(20, Hh - 104, w + 40, 84, 14);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.paper;
    ctx.fillText(text, 40, Hh - 50);
    ctx.font = `500 20px ${font}`;
    ctx.fillStyle = P.accent;
    ctx.fillText(sub, 40, Hh - 78);
  };

  // anime: open sea, a small ship with a sail crossing the horizon
  function anime() {
    ctx.fillStyle = P.sugar;
    ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = P.accent;
    ctx.beginPath();
    ctx.arc(470, 90, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P.accent2;
    ctx.fillRect(0, 190, W, Hh - 190);
    ctx.strokeStyle = P.paper;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const y = 215 + i * 24;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.03 + t * 2 + i) * 4);
      ctx.stroke();
    }
    const sx = ((t * 40) % (W + 200)) - 100;
    const bob = Math.sin(t * 2.4) * 4;
    ctx.fillStyle = P.kraft;
    ctx.beginPath();
    ctx.moveTo(sx - 60, 186 + bob);
    ctx.lineTo(sx + 60, 186 + bob);
    ctx.lineTo(sx + 42, 212 + bob);
    ctx.lineTo(sx - 42, 212 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(sx - 3, 96 + bob, 6, 92);
    ctx.fillStyle = P.paper;
    ctx.beginPath();
    ctx.moveTo(sx - 46, 104 + bob);
    ctx.quadraticCurveTo(sx, 96 + bob, sx + 46, 104 + bob);
    ctx.lineTo(sx + 40, 172 + bob);
    ctx.quadraticCurveTo(sx, 164 + bob, sx - 40, 172 + bob);
    ctx.closePath();
    ctx.fill();
  }

  // series: a desert road under a slow sunset
  function series() {
    const sky = ctx.createLinearGradient(0, 0, 0, 220);
    sky.addColorStop(0, P.accent3);
    sky.addColorStop(1, P.accent);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Hh);
    const sunY = 150 + Math.sin(t * 0.3) * 20;
    ctx.fillStyle = P.paper;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(W * 0.66, sunY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.kraft;
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(80, 160);
    ctx.lineTo(170, 160);
    ctx.lineTo(210, 200);
    ctx.lineTo(420, 200);
    ctx.lineTo(470, 172);
    ctx.lineTo(560, 172);
    ctx.lineTo(600, 200);
    ctx.lineTo(W, 200);
    ctx.lineTo(W, Hh);
    ctx.lineTo(0, Hh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.sand;
    ctx.fillRect(0, 200, W, Hh - 200);
    ctx.fillStyle = P.muted;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, 200);
    ctx.lineTo(W / 2 + 8, 200);
    ctx.lineTo(W / 2 + 190, Hh);
    ctx.lineTo(W / 2 - 190, Hh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.accent;
    const dash = (t * 60) % 40;
    for (let y = 205 + dash * 0.4; y < Hh; y += 26) {
      const k = (y - 200) / (Hh - 200);
      ctx.fillRect(W / 2 - 2 - k * 3, y, 4 + k * 6, 6 + k * 10);
    }
  }

  // film: a black hole with a bright ring of light bent around it
  function film() {
    ctx.fillStyle = P.ink;
    ctx.fillRect(0, 0, W, Hh);
    const r = mulberry32(7);
    ctx.fillStyle = P.paper;
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.25 + r() * 0.6;
      ctx.fillRect(r() * W, r() * Hh, 2, 2);
    }
    ctx.globalAlpha = 1;
    const cx = W / 2;
    const cy = Hh / 2 - 20;
    const glow = 0.85 + Math.sin(t * 1.5) * 0.15;
    ctx.globalAlpha = glow;
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 200, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 86, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.strokeStyle = P.paper;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = glow;
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 200, 34, 0, 0, Math.PI);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const programs = { anime, series, film };
  function draw() {
    const c = channels[ch % Math.max(1, channels.length)];
    if (!c) return;
    (programs[c.kind] || film)();
    title(c.title, c.label);
    tex.needsUpdate = true;
  }
  draw();

  return {
    tex,
    next() {
      ch = (ch + 1) % Math.max(1, channels.length);
      draw();
    },
    set active(on) {
      active = on;
    },
    tick(dt) {
      t += dt;
      if (frame++ % (active ? 3 : 8) === 0) draw();
    },
  };
}
