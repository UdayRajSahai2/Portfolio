// What the character does at each zone (spec ACT-01..07): walk to the seat,
// take the pose, hold the prop. The zone describes it in `hotspot.activity`:
//   seat { x, z, yaw, y }, pose, hold, prepare(next), release(), update(me, dt, t)
// The panel is already open; the activity plays alongside it.

export function createActivities({ hotspots, me }) {
  let current = null; // the zone whose activity is under way

  return {
    get current() {
      return current;
    },

    // `stillWanted()` turns false once the visitor moves on, so late callbacks do nothing
    start(id, stillWanted) {
      const a = hotspots[id]?.activity;
      if (!a) return;
      const settle = () => {
        if (!stillWanted()) return;
        me.turnTo(a.seat.yaw);
        me.setPose(a.pose, { y: a.seat.y });
        if (a.hold) me.hold(a.hold);
        current = id;
      };
      const go = () => {
        if (!stillWanted()) return;
        if (a.hold) me.hold(a.hold);
        me.followPath([{ x: a.seat.x, z: a.seat.z }], settle);
      };
      if (a.prepare) a.prepare(go);
      else go();
    },

    // stand up, put things back and step off the seat
    stop() {
      const h = current && hotspots[current];
      current = null;
      me.hold(null);
      if (!h) return;
      h.activity.release?.();
      me.setPose('stand');
      if (h.stand) me.followPath([{ x: h.stand.x, z: h.stand.z }]);
    },

    // the zone is closing: end its activity, even one that had not settled yet
    leave(id) {
      const a = hotspots[id]?.activity;
      if (!a) return;
      if (current) this.stop();
      else a.release?.();
      me.hold(null);
    },

    update(dt, t) {
      if (current) hotspots[current].activity.update?.(me, dt, t);
    },
  };
}
