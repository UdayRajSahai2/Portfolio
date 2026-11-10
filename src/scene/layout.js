// The room's footprint in world units (the character is about 3 tall).
//   floor x -8..8, z -5..4.6; walls at z = -5 (back), x = -8 (left), x = 8 (right)
//   the front wall with the door stands at FRONT_Z and fades away after the intro
export const X0 = -8;
export const X1 = 8;
export const ZB = -5;
export const ZF = 4.6;
export const H = 9.6;
export const DOOR_W = 2;
export const DOOR_H = 3.8;
export const FRONT_Z = ZF + 0.15;
