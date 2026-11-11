// ── poses ────────────────────────────────────────────────────
// Radians. Arm and elbow pairs are [left (-x), right (+x)].
// shoulder: negative swings the arm forward. shoulderZ: positive moves an arm towards +x.
// elbow: negative bends the forearm forward. head: positive looks down.
const HALF_PI = Math.PI / 2;
const SIT = { hip: -1.5, knee: 1.45 };
export const POSES = {
  stand: {},
  sit: { ...SIT, elbow: [-0.3, -0.3] },
  type: { ...SIT, shoulder: [-1.32, -1.32], shoulderZ: [0.24, -0.24], elbow: [-0.28, -0.28], head: 0.05 },
  // a low armchair: thighs level on the seat, shins down to the floor, feet flat
  read: { hip: -1.45, knee: 1.35, shoulder: [-0.75, -0.75], shoulderZ: [0.2, -0.2], elbow: [-1.05, -1.05], head: 0.38 },
  remote: { ...SIT, shoulder: [-0.2, -1.2], elbow: [-0.6, -0.15], head: -0.05 },
  play: { ...SIT, shoulder: [-0.2, -1.05], shoulderZ: [-0.1, -0.15], elbow: [-0.5, -0.35], head: 0.35 },
  bench: { bodyRX: -HALF_PI, hip: -0.25, knee: 1.5, shoulder: [-HALF_PI, -HALF_PI], shoulderZ: [-0.12, 0.12] },
  // standing, arms a little out so the dumbbells clear his legs; `curls` bends each elbow
  curl: { shoulderZ: [-0.28, 0.28], elbow: [-0.15, -0.15], head: 0.12 },
  scope: { bodyRX: 0.16, shoulder: [-1.15, -1.0], shoulderZ: [0.1, -0.1], elbow: [-0.9, -0.75], head: -0.05 },
};

export function poseTargets(name) {
  const p = POSES[name] || POSES.stand;
  return {
    bodyRX: p.bodyRX || 0,
    hip: p.hip || 0,
    knee: p.knee || 0,
    shoulder: p.shoulder || [0, 0],
    shoulderZ: p.shoulderZ || [-0.1, 0.1],
    elbow: p.elbow || [0, 0],
    head: p.head || 0,
  };
}
