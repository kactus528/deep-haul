// Deck 2 corridor: between Cryo Bay 3 (behind you) and the mess hall (far
// end). Crew cabins line the walls: Pike, Shay, the captain, and Q. Leeks.

import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=11';
import { cardMaker, H, wallTex, floorTex, ceilingTex, doorTex, endWallTex, lampTex } from './roomkit.js?v=11';

export function buildCorridor(group) {
  const { card, hitMeshes, quads } = cardMaker(group);
  const Z = -4; // corridor runs from z +1.5 (cryo) to z -9.5 (mess)
  const lampZ = [-0.5, -4, -7.5];
  const floorY = (z) => ((z + 9.5) / 11) * 512;
  const ceilY = (z) => ((1.5 - z) / 11) * 512;

  const wallLeft = wallTex(512, 128, { seed: 201, paint: R.cryo, lights: [[85, 30, 60], [256, 30, 60], [427, 30, 60]] });
  const wallRight = wallTex(512, 128, { seed: 211, paint: R.cryo, lights: [[85, 30, 60], [256, 30, 60], [427, 30, 60]] });
  const floor = floorTex(128, 512, { seed: 221, pools: lampZ.map((z) => [64, floorY(z), 46]) });
  const ceiling = ceilingTex(128, 512, { seed: 231, lamps: lampZ.map((z) => [64, ceilY(z)]) });
  const toMess = endWallTex(128, 144, { label: 'MESS HALL', seed: 241, open: true });
  const toCryo = endWallTex(128, 144, { label: 'CRYO BAY 3', seed: 251, open: true, arrow: false });

  const pikeDoor = doorTex({
    name: 'D. PIKE', role: 'COMPLIANCE', seed: 261, accent: R.red,
    extra: (p) => {
      p.bevel(14, 40, 36, 20, R.beige, 6);
      p.text('KNOCK', 18, 42, R.red[3], 6);
      p.text('THEN WAIT', 16, 50, R.dark[2], 5);
    },
  });
  const shayDoor = doorTex({
    name: 'N. SHAY', role: 'HAULAGE', seed: 271,
    extra: (p) => {
      p.text('SORRY', 14, 104, R.steel[6], 6);
      p.scratches(10, 98, 40, 14, 12, R.steel[7]);
    },
  });
  const thorneDoor = doorTex({
    name: 'A. THORNE', role: 'CAPTAIN', seed: 281, accent: R.hazard,
    extra: (p) => {
      p.bevel(24, 40, 16, 16, R.hazard, 5);
      p.disc(32, 47, 4, R.hazard[3]);
      p.px(30, 46, R.dark[0]);
      p.px(34, 46, R.dark[0]);
      p.rect(30, 49, 5, 1, R.dark[0]);
    },
  });
  const leeksDoor = doorTex({
    name: 'Q. LEEKS', role: 'SUPPLY', seed: 291,
    extra: (p) => {
      p.bevel(14, 44, 36, 26, R.rust, 4);
      p.text('SUPPLY', 18, 52, R.rust[1], 6);
    },
  });

  const winTex = pixelTexture(128, 64, (p, w, h) => {
    p.bevel(0, 0, w, h, R.steel, 4);
    p.inset(5, 5, w - 10, h - 10, R.black, 0);
    p.vgrad(6, 6, w - 12, h - 12, R.black, 0, 2.5);
    p.grime(6, 6, w - 12, h - 12, { scale: 14, amount: 0.5, thresh: 0.5, color: '#2a1440', seed: 301 });
    for (let k = 0; k < 90; k++) {
      const x = 7 + Math.floor(p.rand() * (w - 14)), y = 7 + Math.floor(p.rand() * (h - 14));
      const b = p.rand();
      p.px(x, y, b > 0.9 ? R.beige[7] : b > 0.6 ? R.cryo[6] : R.steel[4]);
      if (b > 0.97) {
        p.px(x - 1, y, R.cryo[4]);
        p.px(x + 1, y, R.cryo[4]);
        p.px(x, y - 1, R.cryo[4]);
        p.px(x, y + 1, R.cryo[4]);
      }
    }
    p.line(10, 10, 40, 10, R.cryo[7]);
    p.line(10, 12, 24, 12, R.cryo[6]);
    p.quantize();
  }, { seed: 303 });

  const notice = pixelTexture(64, 48, (p, w, h) => {
    p.bevel(0, 0, w, h, R.rust, 3);
    p.vgrad(3, 3, w - 6, h - 6, R.rust, 4.6, 3.4);
    p.noise(3, 3, w - 6, h - 6, R.rust[2], 0.15);
    p.bevel(6, 5, 52, 18, R.beige, 6);
    p.text('DAYS SINCE', 9, 6, R.black[0], 5);
    p.text('INCIDENT: 0', 9, 13, R.red[3], 6);
    p.bevel(8, 27, 20, 16, R.beige, 5);
    p.bevel(32, 26, 24, 18, R.cryo, 6);
    for (let y = 30; y < 41; y += 3) {
      p.rect(10, y, 15, 1, R.beige[3]);
      p.rect(35, y, 17, 1, R.cryo[2]);
    }
    for (const [x, y] of [[17, 27], [44, 26], [31, 5]]) p.rect(x, y, 2, 2, R.red[5]);
    p.outline('#1a0812');
    p.quantize();
  }, { seed: 305 });

  const lamp = lampTex(307);

  // ---- layout ----
  card(floor, 2.6, 11, [0, 0, Z], { rot: [-H, 0, 0], order: -1, segs: [1, 4] });
  card(ceiling, 2.6, 11, [0, 3, Z], { rot: [H, 0, 0], order: -1, segs: [1, 4] });
  card(wallLeft, 11, 3, [-1.3, 1.5, Z], { rot: [0, H, 0], order: -1, segs: [4, 1] });
  card(wallRight, 11, 3, [1.3, 1.5, Z], { rot: [0, -H, 0], order: -1, segs: [4, 1] });
  card(toMess, 2.6, 3, [0, 1.5, -9.5], { order: -1, spot: 'messdoor', region: [0.27, 0, 0.73, 0.74] });
  card(toCryo, 2.6, 3, [0, 1.5, 1.5], { rot: [0, Math.PI, 0], order: -1, spot: 'cryodoor', region: [0.27, 0, 0.73, 0.74] });

  card(pikeDoor, 1.0, 2.1, [-1.28, 1.05, -2.0], { rot: [0, H, 0], spot: 'door_pike' });
  card(thorneDoor, 1.0, 2.1, [-1.28, 1.05, -6.5], { rot: [0, H, 0], spot: 'door_thorne' });
  card(shayDoor, 1.0, 2.1, [1.28, 1.05, -3.0], { rot: [0, -H, 0], spot: 'door_shay' });
  card(leeksDoor, 1.0, 2.1, [1.28, 1.05, -7.5], { rot: [0, -H, 0], spot: 'door_leeks' });
  card(winTex, 1.4, 0.7, [1.28, 1.6, -5.25], { rot: [0, -H, 0], spot: 'window' });
  card(notice, 0.72, 0.54, [-1.28, 1.5, -4.25], { rot: [0, H, 0], spot: 'notice' });
  for (const z of lampZ) card(lamp, 0.42, 0.32, [0, 2.82, z], { face: [0, 2.82, 0], noHit: true });

  return { name: 'CORRIDOR', quads: quads(), hitMeshes, fog: [4, 14], update() {} };
}
