// Mess hall: tables, VENDO-9, the big announcement screen, the captain's
// memorial plaque, and a sealed hydroponics door with squeaking behind it.

import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=12';
import { cardMaker, H, wallTex, floorTex, ceilingTex, endWallTex, lampTex } from './roomkit.js?v=12';

export function buildMess(group) {
  const { card, hitMeshes, quads } = cardMaker(group);
  const Z = -2.5; // room runs from z +1 (corridor door) to z -6

  const wall = (seed) => wallTex(256, 112, { seed, paint: R.rust, pipes: true, panel: 64, lights: [[64, 28, 50], [192, 28, 50]] });
  const floor = floorTex(256, 256, { seed: 401, walkway: null, pools: [[75, 128, 60], [181, 128, 60], [128, 50, 50, LIGHT.red]] });
  const ceiling = ceilingTex(256, 256, { seed: 411, lamps: [[75, 128], [181, 128]] });
  const exit = endWallTex(256, 112, { label: 'CORRIDOR', seed: 421, open: true, arrow: false });

  // Long mess table seen from the side, bench in front, leftover trays.
  const table = (seed) =>
    pixelTexture(128, 48, (p) => {
      p.bevel(2, 10, 124, 6, R.steel, 5);
      p.rect(2, 16, 124, 2, R.dark[1]);
      for (const x of [10, 112]) p.vcyl(x, 18, 6, 30, R.steel, 1, 6);
      p.bevel(8, 30, 112, 5, R.rust, 5);
      p.rect(8, 35, 112, 1, R.dark[0]);
      for (const x of [14, 108]) p.vcyl(x, 36, 4, 12, R.dark, 1, 6);
      for (let k = 0; k < 4; k++) {
        const x = 12 + Math.floor(p.rand() * 96);
        p.bevel(x, 6, 16, 4, R.steel, 6);
        p.rect(x + 3, 7, 4, 2, R.suit[4]);
      }
      p.vcyl(70, 2, 5, 8, R.beige, 2, 7);
      p.grime(0, 0, 128, 48, { scale: 8, amount: 0.3, seed: seed + 1 });
      p.outline('#100c22');
      p.quantize();
    }, { seed });

  // VENDO-9: a vending machine with a face.
  const vendo = pixelTexture(64, 128, (p) => {
    p.vcyl(4, 4, 56, 120, R.suit, 2, 6.4);
    p.bevel(4, 4, 56, 14, R.red, 4);
    p.text('VENDO-9', 9, 6, R.beige[7], 8);
    // face screen
    p.inset(10, 22, 44, 26, R.black, 1);
    p.vgrad(11, 23, 42, 24, R.cryo, 4.6, 3);
    p.rect(20, 29, 4, 5, R.dark[0]);
    p.rect(40, 29, 4, 5, R.dark[0]);
    p.rect(18, 39, 28, 2, R.dark[0]);
    p.rect(16, 37, 2, 2, R.dark[0]);
    p.rect(46, 37, 2, 2, R.dark[0]);
    p.rect(21, 30, 1, 1, R.cryo[7]);
    p.rect(41, 30, 1, 1, R.cryo[7]);
    // product window
    p.inset(8, 52, 34, 46, R.black, 1);
    const goods = [R.hazard, R.red, R.phosphor, R.beige, R.cryo];
    for (let row = 0; row < 4; row++)
      for (let c = 0; c < 4; c++) {
        const g = goods[(row * 4 + c) % goods.length];
        p.bevel(10 + c * 8, 54 + row * 11, 6, 8, g, 5);
      }
    p.line(10, 54, 22, 96, R.cryo[6]);
    // buttons, one worn smooth
    for (let i = 0; i < 6; i++) p.bevel(46, 54 + i * 7, 10, 5, i === 2 ? R.beige : R.dark, i === 2 ? 6 : 4);
    p.rect(48, 98, 6, 2, R.black[0]);
    p.inset(12, 104, 40, 12, R.black, 1);
    p.disc(36, 76, 3, R.suit[3]); // the forehead dent (subtle)
    p.grime(0, 0, 64, 128, { scale: 10, amount: 0.3, seed: 431 });
    p.light(32, 35, 30, LIGHT.cyan, 0.3);
    p.outline('#200a14');
    p.quantize();
  }, { seed: 433 });

  // The big screen: today's menu, or DORIS mid-announcement.
  const screen = { mode: 'menu', blink: true, scroll: 0 };
  const screenTex = pixelTexture(128, 76, (p, w, h) => {
    p.bevel(0, 0, w, h, R.steel, 3);
    p.inset(5, 5, w - 10, h - 10, R.black, 1);
    if (screen.mode === 'doris') {
      p.vgrad(6, 6, w - 12, h - 12, R.red, 1.6, 0.4);
      const cx = 64, cy = 36;
      for (let j = -22; j <= 22; j++)
        for (let i = -22; i <= 22; i++) {
          const d = Math.hypot(i, j);
          if (d < 13) p.px(cx + i, cy + j, R.red[Math.max(1, Math.min(7, Math.round(7.4 - d * 0.48)))]);
          else if (d < 20) p.px(cx + i, cy + j, R.steel[Math.max(1, Math.min(7, Math.round(4.2 - (i + j) / 10)))]);
        }
      p.rect(cx - 8, cy - 8, 4, 3, R.red[7]);
      if (screen.blink) {
        p.text('!!', 14, 28, R.hazard[6], 12);
        p.text('!!', 98, 28, R.hazard[6], 12);
      }
    } else {
      p.vgrad(6, 6, w - 12, h - 12, R.phosphor, 1.6, 0.6);
      p.text('TODAY:', 12, 10, R.phosphor[6], 8);
      p.text('LOAF', 12, 22, R.phosphor[7], 16);
      const tag = ['ALSO LOAF', 'LOAF (WARM)', 'ASK VENDO-9'][screen.scroll % 3];
      p.text(tag, 12, 50, R.phosphor[5], 8);
      if (screen.blink) p.rect(100, 52, 5, 7, R.phosphor[6]);
    }
    for (let y = 6; y < h - 6; y += 2) p.rect(6, y, w - 12, 1, 'rgba(0,0,0,0.25)');
    p.light(64, 38, 70, screen.mode === 'doris' ? LIGHT.red : LIGHT.green, 0.15);
  }, { seed: 441 });

  const plaque = pixelTexture(64, 44, (p) => {
    p.bevel(0, 0, 64, 34, R.hazard, 4);
    p.inset(4, 4, 56, 26, R.hazard, 3);
    p.text('CAPT. A. THORNE', 6, 6, R.rust[1], 6);
    p.text('OUR REVELS', 13, 15, R.rust[1], 6);
    p.text('NOW ARE ENDED', 9, 22, R.rust[1], 6);
    p.bevel(8, 36, 48, 4, R.steel, 5);
    p.vcyl(40, 28, 8, 8, R.beige, 2, 7);
    p.rect(42, 31, 4, 2, R.rust[3]);
    p.light(32, 18, 34, LIGHT.warm, 0.25);
    p.outline('#1f0f0a');
    p.quantize();
  }, { seed: 451 });

  const counter = pixelTexture(128, 48, (p) => {
    p.bevel(0, 0, 128, 8, R.steel, 6);
    p.vgrad(2, 8, 124, 40, R.steel, 4.4, 2);
    for (let x = 2; x < 124; x += 31) p.rect(x, 8, 1, 40, R.dark[1]);
    p.bevel(10, 14, 30, 10, R.beige, 6);
    p.text('LOAF', 14, 15, R.red[3], 8);
    p.grime(0, 0, 128, 48, { scale: 10, amount: 0.4, seed: 461 });
    p.ao(0, 30, 128, 18, 'down', 0.6);
    p.outline('#100c22');
    p.quantize();
  }, { seed: 463 });

  const urn = pixelTexture(32, 48, (p) => {
    p.vcyl(6, 6, 20, 34, R.steel, 1.5, 7);
    p.bevel(4, 2, 24, 6, R.dark, 4);
    p.bevel(4, 40, 24, 6, R.dark, 4);
    p.rect(26, 26, 4, 3, R.dark[2]);
    p.text('JOE', 9, 18, R.dark[1], 6);
    p.outline('#100c22');
    p.quantize();
  }, { seed: 471 });

  const hydro = pixelTexture(64, 112, (p) => {
    p.bevel(0, 0, 64, 112, R.steel, 3);
    p.inset(4, 18, 56, 94, R.dark, 1);
    p.vgrad(6, 20, 52, 90, R.phosphor, 3.6, 1.6);
    p.rect(31, 20, 2, 90, R.dark[0]);
    p.bevel(6, 4, 52, 12, R.phosphor, 5);
    p.text('HYDROPONICS', 8, 6, R.black[0], 6);
    for (let k = 0; k < 6; k++) {
      const x = 10 + k * 8;
      p.line(x, 64, x + 3, 74, R.steel[7]);
      p.line(x + 1, 64, x + 4, 74, R.steel[2]);
    }
    for (let k = 0; k < 12; k++) {
      const x = 6 + Math.floor(p.rand() * 52);
      p.line(x, 111, x + (p.rand() < 0.5 ? -3 : 3), 98 - p.rand() * 10, R.phosphor[5]);
    }
    p.bevel(48, 50, 8, 10, R.red, 5);
    p.grime(0, 0, 64, 112, { scale: 9, amount: 0.35, seed: 481 });
    p.light(32, 108, 30, LIGHT.green, 0.35, 0.5);
    p.quantize();
  }, { seed: 483 });

  const poster = pixelTexture(48, 64, (p) => {
    p.bevel(0, 0, 48, 64, R.beige, 5);
    p.vgrad(3, 3, 42, 58, R.suit, 5, 3.5);
    p.text('EAT.', 7, 8, R.black[0], 10);
    p.text('HAUL.', 7, 22, R.black[0], 10);
    p.text('SLEEP.', 7, 36, R.black[0], 10);
    p.text('IRONMONGER', 5, 52, R.beige[7], 5);
    p.grime(0, 0, 48, 64, { scale: 7, amount: 0.35, seed: 491 });
    p.quantize();
  }, { seed: 493 });

  const lamp = lampTex(497);

  // ---- layout ----
  card(floor, 7, 7, [0, 0, Z], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 7, 7, [0, 3, Z], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(wall(501), 7, 3, [0, 1.5, -6], { order: -1, segs: 2 });
  card(wall(511), 7, 3, [-3.5, 1.5, Z], { rot: [0, H, 0], order: -1, segs: 2 });
  card(wall(521), 7, 3, [3.5, 1.5, Z], { rot: [0, -H, 0], order: -1, segs: 2 });
  card(exit, 7, 3, [0, 1.5, 1], { rot: [0, Math.PI, 0], order: -1, spot: 'messexit', region: [0.29, 0, 0.71, 0.72] });

  for (const [x, z] of [[-1.3, -2.2], [1.3, -2.2], [-1.3, -4.0], [1.3, -4.0]]) card(table(530 + x * 10 + z), 2.0, 0.75, [x, 0.38, z], { spot: 'tables' });
  card(vendo, 0.95, 1.9, [3.0, 0.95, -2.5], { face: [0, 0.95, 0], spot: 'vendo' });
  const screenCard = card(screenTex, 2.2, 1.3, [0.6, 1.95, -5.95], { spot: 'screen' });
  card(plaque, 0.6, 0.41, [-2.1, 1.6, -5.95], { spot: 'plaque' });
  card(counter, 2.6, 0.98, [-1.9, 0.49, -5.55], { spot: 'counter' });
  card(urn, 0.34, 0.51, [-2.7, 1.23, -5.5], { spot: 'urn' });
  card(hydro, 1.4, 2.45, [-3.47, 1.22, -3.3], { rot: [0, H, 0], spot: 'hydro' });
  card(poster, 0.6, 0.8, [3.47, 1.7, -4.7], { rot: [0, -H, 0], spot: 'poster' });
  for (const [x, z] of [[-1.5, -2.5], [1.5, -2.5], [0, -4.6]]) card(lamp, 0.42, 0.32, [x, 2.82, z], { face: [0, 2.82, 0], noHit: true });

  let t = 0;
  let lastBlink = null;
  return {
    name: 'MESS HALL',
    quads: quads(),
    hitMeshes,
    fog: [4, 11],
    update(dt) {
      t += dt;
      const blink = Math.floor(t * (screen.mode === 'doris' ? 3 : 1.5)) % 2 === 0;
      const scroll = Math.floor(t / 2.5);
      if (blink !== lastBlink || scroll !== screen.scroll) {
        lastBlink = blink;
        screen.blink = blink;
        screen.scroll = scroll;
        screenTex.userData.redraw();
      }
      screenCard.material.uniforms.uTint.value = screen.mode === 'doris' ? 1.1 + 0.15 * Math.sin(t * 6) : 1;
    },
    onAction(name, arg) {
      if (name === 'screen') {
        screen.mode = arg;
        screenTex.userData.redraw();
      }
    },
  };
}
