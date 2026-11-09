// Grid-based A* over the floor, with the furniture blocked out.
// Obstacles are grown by the character's radius so it never clips into anything.

export function createNav({ rects = [], circles = [], bounds = [-4.6, 4.5, -4.6, 4.5], cell = 0.2, radius = 0.32 }) {
  const [x0, x1, z0, z1] = bounds;
  const nx = Math.floor((x1 - x0) / cell) + 1;
  const nz = Math.floor((z1 - z0) / cell) + 1;
  const blocked = new Uint8Array(nx * nz);
  const wx = (i) => x0 + i * cell;
  const wz = (j) => z0 + j * cell;

  const hits = (x, z) => {
    for (const r of rects) if (x > r.x0 - radius && x < r.x1 + radius && z > r.z0 - radius && z < r.z1 + radius) return true;
    for (const c of circles) {
      const dx = x - c.x;
      const dz = z - c.z;
      if (dx * dx + dz * dz < (c.r + radius) ** 2) return true;
    }
    return false;
  };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) blocked[j * nx + i] = hits(wx(i), wz(j)) ? 1 : 0;

  const clampI = (v, n) => Math.min(n - 1, Math.max(0, v));
  const ci = (x) => clampI(Math.round((x - x0) / cell), nx);
  const cj = (z) => clampI(Math.round((z - z0) / cell), nz);
  const free = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && !blocked[j * nx + i];

  function isFreeAt(x, z) {
    if (x < x0 || x > x1 || z < z0 || z > z1) return false;
    return !hits(x, z);
  }

  function nearestFree(i, j) {
    if (free(i, j)) return [i, j];
    for (let r = 1; r < Math.max(nx, nz); r++) {
      let best = null;
      let bestD = Infinity;
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          if (!free(i + di, j + dj)) continue;
          const d = di * di + dj * dj;
          if (d < bestD) {
            bestD = d;
            best = [i + di, j + dj];
          }
        }
      if (best) return best;
    }
    return null;
  }

  function los(a, b) {
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(d / (cell * 0.35)));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (!isFreeAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  // tiny binary heap keyed on f
  function heap() {
    const a = [];
    return {
      get size() {
        return a.length;
      },
      push(f, v) {
        a.push([f, v]);
        let i = a.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (a[p][0] <= a[i][0]) break;
          [a[p], a[i]] = [a[i], a[p]];
          i = p;
        }
      },
      pop() {
        const top = a[0];
        const last = a.pop();
        if (a.length) {
          a[0] = last;
          let i = 0;
          for (;;) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;
            if (l < a.length && a[l][0] < a[m][0]) m = l;
            if (r < a.length && a[r][0] < a[m][0]) m = r;
            if (m === i) break;
            [a[m], a[i]] = [a[i], a[m]];
            i = m;
          }
        }
        return top[1];
      },
    };
  }

  const DIRS = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ];

  function find(from, to) {
    const s = nearestFree(ci(from.x), cj(from.z));
    const g = nearestFree(ci(to.x), cj(to.z));
    if (!s || !g) return null;
    const N = nx * nz;
    const start = s[1] * nx + s[0];
    const goal = g[1] * nx + g[0];
    const cost = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const done = new Uint8Array(N);
    const h = (k) => Math.hypot((k % nx) - g[0], Math.floor(k / nx) - g[1]);
    const open = heap();
    cost[start] = 0;
    open.push(h(start), start);
    while (open.size) {
      const k = open.pop();
      if (k === goal) break;
      if (done[k]) continue;
      done[k] = 1;
      const i = k % nx;
      const j = Math.floor(k / nx);
      for (const [di, dj, c] of DIRS) {
        const a = i + di;
        const b = j + dj;
        if (!free(a, b)) continue;
        if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue; // no corner cutting
        const n = b * nx + a;
        const nc = cost[k] + c;
        if (nc < cost[n]) {
          cost[n] = nc;
          came[n] = k;
          open.push(nc + h(n), n);
        }
      }
    }
    if (start !== goal && came[goal] === -1) return null;

    const cells = [];
    for (let k = goal; k !== -1 && k !== start; k = came[k]) cells.push({ x: wx(k % nx), z: wz(Math.floor(k / nx)) });
    cells.reverse();
    const end = isFreeAt(to.x, to.z) ? { x: to.x, z: to.z } : { x: wx(g[0]), z: wz(g[1]) };
    if (cells.length) cells[cells.length - 1] = end;
    else cells.push(end);

    // string-pull: skip every point we can see past
    const pts = [{ x: from.x, z: from.z }, ...cells];
    const out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !los(pts[i], pts[j])) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }

  return { find, isFreeAt };
}
