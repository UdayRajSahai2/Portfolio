// Every sound is synthesised with WebAudio, so there are no audio files to load.

const STORAGE_KEY = 'room-sound';

function readPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writePref(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable: keep the in-memory value */
  }
}

let ctx = null;
let master = null;
let enabled = readPref();
let lastHover = 0;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq = 440, dur = 0.08, type = 'sine', vol = 0.05, slideTo = null, when = 0, dest = null }) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

// ── lo-fi loop for the turntable ─────────────────────────────
const CHORDS = [
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 349.23], // G7
  [164.81, 207.65, 246.94, 293.66], // E7
];
let musicTimer = null;
let musicBus = null;
let crackle = null;
let step = 0;

function startMusic() {
  const a = audio();
  if (!a || musicTimer) return;
  musicBus = a.createGain();
  musicBus.gain.value = 0.0001;
  musicBus.gain.exponentialRampToValueAtTime(0.9, a.currentTime + 0.6);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  musicBus.connect(lp).connect(master);

  // vinyl crackle
  const len = a.sampleRate * 2;
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0015 ? (Math.random() * 2 - 1) * 0.6 : (Math.random() * 2 - 1) * 0.015;
  crackle = a.createBufferSource();
  crackle.buffer = buf;
  crackle.loop = true;
  const cg = a.createGain();
  cg.gain.value = 0.25;
  crackle.connect(cg).connect(musicBus);
  crackle.start();

  step = 0;
  const eighth = 0.36;
  const play = () => {
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    const i = step % 8;
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
    tone({ freq: chord[pattern[i]] * 2, dur: 0.5, type: 'triangle', vol: 0.05, dest: musicBus });
    if (i === 0) {
      tone({ freq: chord[0] / 2, dur: 1.6, type: 'sine', vol: 0.09, dest: musicBus });
      chord.forEach((f) => tone({ freq: f, dur: 2.4, type: 'sine', vol: 0.018, dest: musicBus }));
    }
    if (i === 4) tone({ freq: 90, slideTo: 45, dur: 0.12, type: 'sine', vol: 0.12, dest: musicBus });
    step++;
  };
  play();
  musicTimer = setInterval(play, eighth * 1000);
}

function stopMusic() {
  if (!musicTimer) return;
  clearInterval(musicTimer);
  musicTimer = null;
  const a = ctx;
  const bus = musicBus;
  const cr = crackle;
  if (a && bus) {
    bus.gain.cancelScheduledValues(a.currentTime);
    bus.gain.setValueAtTime(bus.gain.value, a.currentTime);
    bus.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
    setTimeout(() => {
      try {
        cr && cr.stop();
        bus.disconnect();
      } catch {
        /* already stopped */
      }
    }, 600);
  }
  musicBus = null;
  crackle = null;
}

let musicWanted = false;

export const sound = {
  get enabled() {
    return enabled;
  },
  setEnabled(on) {
    enabled = on;
    writePref(on);
    if (!on) stopMusic();
    else if (musicWanted) startMusic();
  },
  unlock() {
    if (enabled) audio();
  },
  hover() {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastHover < 90) return;
    lastHover = now;
    tone({ freq: 1320, dur: 0.035, vol: 0.012 });
  },
  open() {
    if (!enabled) return;
    tone({ freq: 392, dur: 0.12, type: 'triangle', vol: 0.05 });
    tone({ freq: 587, dur: 0.18, type: 'triangle', vol: 0.04, when: 0.07 });
  },
  close() {
    if (!enabled) return;
    tone({ freq: 587, dur: 0.1, type: 'triangle', vol: 0.04 });
    tone({ freq: 392, dur: 0.16, type: 'triangle', vol: 0.04, when: 0.06 });
  },
  toggle() {
    if (!enabled) return;
    tone({ freq: 1800, dur: 0.02, type: 'square', vol: 0.02 });
    tone({ freq: 900, dur: 0.03, type: 'square', vol: 0.015, when: 0.03 });
  },
  knock() {
    if (!enabled) return;
    tone({ freq: 260, slideTo: 180, dur: 0.09, type: 'triangle', vol: 0.09 });
  },
  paper() {
    if (!enabled) return;
    tone({ freq: 2400, slideTo: 900, dur: 0.12, type: 'sawtooth', vol: 0.008 });
  },
  key() {
    if (!enabled) return;
    tone({ freq: 2000 + Math.random() * 600, dur: 0.015, type: 'square', vol: 0.006 });
  },
  music(on) {
    musicWanted = on;
    if (on && enabled) startMusic();
    else stopMusic();
  },
};
