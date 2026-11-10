// Hover highlight for the room's clickable things.

// Zones share materials by colour (scene/build.js). Before a zone can glow on
// its own, it gets private copies, shared only inside the zone.
export function ownMaterials(groups) {
  const copies = new Map();
  const own = (m) => {
    if (!m || m.isMeshBasicMaterial) return m;
    if (!copies.has(m)) copies.set(m, m.clone());
    return copies.get(m);
  };
  for (const g of groups)
    g.traverse((o) => {
      if (o.isMesh && !o.userData.noGlow) o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material);
    });
}

// Tints every mesh in a group with `color`, and restores it exactly.
export function createGlow(color) {
  const original = new WeakMap();
  return function setGlow(group, on) {
    group.traverse((o) => {
      if (!o.isMesh || o.userData.noGlow) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.emissive) continue;
        if (!original.has(m)) original.set(m, { color: m.emissive.clone(), intensity: m.emissiveIntensity });
        const base = original.get(m);
        if (on) {
          m.emissive.set(color);
          m.emissiveIntensity = 0.3;
        } else {
          m.emissive.copy(base.color);
          m.emissiveIntensity = base.intensity;
        }
      }
    });
  };
}

// The hotspot id an object belongs to, found by walking up its parents.
export function hotspotOf(obj) {
  let o = obj;
  while (o && !o.userData.hotspot) o = o.parent;
  return o ? o.userData.hotspot : null;
}
