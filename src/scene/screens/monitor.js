import { canvasTex } from '../build.js';

// ── monitor screen: a tiny code editor that types real code ──
// The editor's own colours describe a dark code theme, not the page palette.
const SYN = {
  text: '#D5E0E6',
  comment: '#5E8C80',
  string: '#E9C46A',
  keyword: '#FF8FA3',
  type: '#7FD1B9',
  call: '#C3A6FF',
  number: '#9DB8FF',
};
const KEYWORDS = new Set(
  'const let var function return for of in if else continue break async await export import from new public private static class def type query mutation true false null None void foreach string int str bool'.split(' ')
);

function tokenize(line, lang) {
  const commentMark = lang === 'Python' || lang === 'GraphQL' ? '#' : '//';
  if (line.trim().startsWith(commentMark)) return [{ t: line, c: SYN.comment }];
  const out = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|@\w+|\$\w+|\b\d+\b|[A-Za-z_]\w*|\s+|.)/g;
  let m;
  while ((m = re.exec(line))) {
    const t = m[0];
    let c = SYN.text;
    if (/^["'`]/.test(t)) c = SYN.string;
    else if (t[0] === '@') c = SYN.call;
    else if (t[0] === '$' || /^\d/.test(t)) c = SYN.number;
    else if (KEYWORDS.has(t)) c = SYN.keyword;
    else if (/^[A-Z]\w*/.test(t)) c = SYN.type;
    else if (/^[a-z_]\w*$/i.test(t) && /^\s*\(/.test(line.slice(m.index + t.length))) c = SYN.call;
    out.push({ t, c });
  }
  return out;
}

export function makeScreen(files, languages) {
  const W = 1024;
  const Hh = 614;
  const { tex, ctx } = canvasTex(W, Hh, () => {});
  const parsed = files.map((f) => ({ ...f, lines: f.code.map((l) => tokenize(l, f.lang)), total: f.code.join('\n').length }));
  const MONO = 'Consolas, "Courier New", monospace';
  let idx = 0;
  let shown = 0;
  let acc = 0;
  let hold = 0;
  let blink = 0;
  let frame = 0;
  let onChar = null;
  let active = false;

  function drawTabs() {
    ctx.fillStyle = '#081013';
    ctx.fillRect(0, 0, W, 56);
    ctx.font = `19px ${MONO}`;
    ctx.textBaseline = 'middle';
    let x = 0;
    parsed.forEach((f, i) => {
      const w = ctx.measureText(f.name).width + 44;
      const active = i === idx;
      ctx.fillStyle = active ? '#10222A' : '#0B171B';
      ctx.fillRect(x, 0, w, 56);
      if (active) {
        ctx.fillStyle = f.color;
        ctx.fillRect(x, 0, w, 4);
      }
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(x + 16, 30, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#E6EEF2' : '#55707A';
      ctx.fillText(f.name, x + 28, 30);
      ctx.fillStyle = '#05090B';
      ctx.fillRect(x + w - 1, 0, 1, 56);
      x += w;
    });
  }

  function drawCode() {
    const f = parsed[idx];
    ctx.font = `25px ${MONO}`;
    ctx.textBaseline = 'top';
    let budget = shown;
    let cursor = null;
    const top = 80;
    const lh = 42;
    for (let i = 0; i < f.lines.length; i++) {
      const y = top + i * lh;
      ctx.fillStyle = '#34505A';
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), 44, y);
      ctx.textAlign = 'left';
      if (budget < 0) continue;
      let x = 64;
      for (const tok of f.lines[i]) {
        if (budget <= 0) break;
        const t = tok.t.slice(0, budget);
        ctx.fillStyle = tok.c;
        ctx.fillText(t, x, y);
        x += ctx.measureText(t).width;
        budget -= t.length;
      }
      if (budget >= 0) cursor = { x, y };
      budget -= 1; // the newline
    }
    if (cursor && blink < 0.55) {
      ctx.fillStyle = '#7FD1B9';
      ctx.fillRect(cursor.x + 2, cursor.y + 1, 13, 28);
    }
  }

  function drawStatus() {
    const f = parsed[idx];
    const y = Hh - 52;
    ctx.fillStyle = '#081013';
    ctx.fillRect(0, y, W, 52);
    ctx.textBaseline = 'middle';
    ctx.font = `bold 18px ${MONO}`;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(26, y + 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D5E0E6';
    ctx.fillText(f.lang, 40, y + 26);

    // GitHub language split
    const barW = 330;
    const bx = W - barW - 24;
    ctx.font = `15px ${MONO}`;
    ctx.fillStyle = '#6F8C96';
    ctx.textAlign = 'right';
    ctx.fillText('my GitHub', bx - 14, y + 26);
    ctx.textAlign = 'left';
    let x = bx;
    const short = { JavaScript: 'JS', TypeScript: 'TS', Python: 'Py' };
    for (const l of languages) {
      const w = (l.pct / 100) * barW;
      ctx.fillStyle = l.color;
      ctx.fillRect(x, y + 14, Math.max(1, w - 2), 10);
      if (l.pct >= 6) {
        ctx.fillStyle = '#9FB4BC';
        ctx.font = `13px ${MONO}`;
        ctx.fillText(`${short[l.name] || l.name} ${Math.round(l.pct)}%`, x, y + 38);
      }
      x += w;
    }
  }

  function draw() {
    ctx.fillStyle = '#0D1B20';
    ctx.fillRect(0, 0, W, Hh);
    drawTabs();
    drawCode();
    drawStatus();
    tex.needsUpdate = true;
  }
  draw();

  const next = () => {
    idx = (idx + 1) % parsed.length;
    shown = 0;
    hold = 0;
  };

  return {
    tex,
    restart() {
      shown = 0;
      hold = 0;
    },
    next,
    set onChar(fn) {
      onChar = fn;
    },
    set active(on) {
      active = on;
    },
    tick(dt) {
      blink = (blink + dt) % 1.1;
      const total = parsed[idx].total;
      if (hold > 0) {
        hold -= dt;
        if (hold <= 0) next();
      } else {
        acc += dt * 34;
        const n = Math.floor(acc);
        if (n > 0) {
          acc -= n;
          shown = Math.min(total, shown + n);
          if (onChar) onChar();
          if (shown === total) hold = 3.5;
        }
      }
      if (frame++ % (active ? 2 : 6) === 0) draw(); // a texture upload is costly; slow down when not in close-up
    },
  };
}
