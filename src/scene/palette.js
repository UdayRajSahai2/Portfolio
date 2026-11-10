// Reads colour tokens from CSS so the 3D room uses the same palette as the page.
// Tokens are OKLCH; three.js wants sRGB hex, so each one is painted onto a
// 1 x 1 canvas and read back. Results are cached.

const cache = new Map();
let ctx = null;

// `fallback` is used only if the token is missing, so a typo shows as grey rather than black
export function token(name, fallback = '#888888') {
  if (cache.has(name)) return cache.get(name);
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  let hex = fallback;
  if (value) {
    ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = fallback;
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  cache.set(name, hex);
  return hex;
}

// The room's named materials, resolved once the stylesheet has loaded.
export function roomPalette() {
  const t = (n) => token(`--room-${n}`);
  return {
    ground: t('ground'),
    path: t('path'),
    facade: t('facade'),
    facadeTrim: t('facade-trim'),
    door: t('door'),
    doorDeep: t('door-deep'),
    wall: t('wall'),
    wallSide: t('wall-side'),
    trim: t('trim'),
    floor: t('floor'),
    floorSeam: t('floor-seam'),
    wood: t('wood'),
    woodDark: t('wood-dark'),
    fabric: t('fabric'),
    fabric2: t('fabric-2'),
    cushion: t('cushion'),
    rug: t('rug'),
    rugEdge: t('rug-edge'),
    metal: t('metal'),
    steel: t('steel'),
    rubber: t('rubber'),
    screen: t('screen'),
    light: t('light'),
    skyDay: t('sky-day'),
    skyCloud: t('sky-cloud'),
    moon: t('moon'),
    skyNight: t('sky-night'),
    skyNight2: t('sky-night-2'),
    star: t('star'),
    leaf: t('leaf'),
    pot: t('pot'),
    paper: t('paper'),
    chessLight: t('chess-light'),
    chessDark: t('chess-dark'),
    // shared page tokens
    pageBg: token('--color-paper'),
    ink: token('--color-ink'),
    muted: token('--color-muted'),
    accent: token('--color-accent'),
    accent2: token('--color-accent-2'),
    accent3: token('--color-accent-3'),
    mint: token('--color-mint'),
    kraft: token('--color-kraft'),
    sand: token('--color-sand'),
    sugar: token('--color-sugar'),
  };
}
