// What the character does at each zone (spec ACT-01..08): walk to the seat,
// take the pose, hold the prop. The zone describes it in `hotspot.activity`:
//   seat { x, z, yaw, y }, pose, hold, held, prepare(next), release(), update(me, dt, t)
// `held` is what the prop shows (the book's title and author), read when he picks it up.
// The panel is already open; the activity plays alongside it.

export function createActivities({ hotspots, me }) {
  let current = null; // the zone whose activity is under way

  return {
    get current() {
      return current;
    },

    // `stillWanted()` turns false once the visitor moves on, so late callbacks do nothing.
    // `onSeated` runs once he has taken the pose.
    start(id, stillWanted, onSeated) {
      const a = hotspots[id]?.activity;
      if (!a) return;
      const settle = () => {
        if (!stillWanted()) return;
        me.turnTo(a.seat.yaw);
        me.setPose(a.pose, { y: a.seat.y });
        if (a.hold) me.hold(a.hold, a.held);
        current = id;
        onSeated?.();
      };
      const go = () => {
        if (!stillWanted()) return;
        if (a.hold) me.hold(a.hold, a.held);
        me.followPath([{ x: a.seat.x, z: a.seat.z }], settle);
      };
      if (a.prepare) a.prepare(go);
      else go();
    },

    // play it again from the top: put things back, step to the stand point, start over
    again(id, stillWanted, onSeated) {
      const h = hotspots[id];
      if (!h?.activity) return;
      current = null;
      me.hold(null);
      h.activity.release?.();
      me.setPose('stand');
      const restart = () => {
        if (!stillWanted()) return;
        this.start(id, stillWanted, onSeated);
      };
      if (h.stand) me.followPath([{ x: h.stand.x, z: h.stand.z }], restart);
      else restart();
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
