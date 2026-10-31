// Mess hall: tables, VENDO-9, the big announcement screen, the captain's
// memorial plaque, and a sealed hydroponics door with squeaking behind it.

import { makeView, painting, hangPainting, layer, blitBack, treadFloor, panelWall, lampCeiling } from './stagekit.js?v=24';
import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=24';
import { cardMaker, H, wallTex, floorTex, ceilingTex, endWallTex, lampTex } from './roomkit.js?v=24';

export function buildMess(world) {
  const Z = -2.5; // room runs from z +1 (corridor door) to z -6

  const wall = (seed) => wallTex(256, 112, { seed, paint: R.rust, pipes: true, panel: 64, lights: [[64, 28, 50], [192, 28, 50]] });
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

  // Hydroponics door and poster, painted into the side walls.
  const messFeature = (side, z, y) => {
    if (side === -1 && z > 3.8 && z < 5.2 && y < 2.45) {
      const u = (z - 3.8) / 1.4;
      if (u < 0.06 || u > 0.94 || y > 2.38) return [R.steel, 5.4];
      if (y > 2.0) return [R.phosphor, 5.6];
      if (y < 0.18) return [R.phosphor, (Math.floor(z * 30) % 3) ? 5 : 3];
      if (Math.abs(u - 0.5) < 0.02) return [R.dark, 0.8];
      if (y > 1.0 && y < 1.35 && (Math.floor(z * 25) % 4 === 0)) return [R.steel, 6.6];
      return [R.phosphor, 2.6 + y * 0.5];
    }
    if (side === 1 && z > 4.2 && z < 4.8 && y > 1.3 && y < 2.1) {
      const u = (z - 4.2) / 0.6;
      if (u < 0.08 || u > 0.92 || y < 1.36 || y > 2.04) return [R.beige, 5];
      return [R.suit, (y > 1.84 || (y > 1.58 && y < 1.68) || (y > 1.4 && y < 1.48)) && u > 0.2 && u < 0.8 ? 0.6 : 5];
    }
    return null;
  };
  const messWalls = (pools) => ({
    floor: treadFloor({ walkway: 0, tile: 0.5, pools }),
    ceil: lampCeiling({ lamps: [{ x: -1.5, z: 2.5 }, { x: 1.5, z: 2.5 }] }),
    wall: panelWall({ paint: R.rust, feature: messFeature }),
  });

  // ---- front view: tables, VENDO-9, the big screen ----
  const front = makeView(world);
  const frontP = painting({
    room: { halfW: 3.5, height: 3, depth: 6 }, seed: 1201,
    surfaces: messWalls([{ x: -1.5, z: 2.5, r: 1.3 }, { x: 1.5, z: 2.5, r: 1.3 }]),
    back: (p, rect) => blitBack(p, wall(501), rect),
    after: (p, proj) => {
      const [hx, hy] = proj(-3.5, 1.0, 4.5);
      p.light(hx, hy, 50, LIGHT.green, 0.3, 1.4);
      const [sx, sy] = proj(0.6, 1.9, 5.9);
      p.light(sx, sy + 30, 90, LIGHT.red, 0.18, 0.7);
    },
  });
  hangPainting(front, frontP, [
    ['hydro', frontP.region(-3.5, -3.5, 0, 2.45, 3.8, 5.2)],
    ['poster', frontP.region(3.5, 3.5, 1.3, 2.1, 4.2, 4.8)],
  ]);
  const screenCard = layer(front, screenTex, 2.2, 1.3, 0.6, 1.3, 5.8, { spot: 'screen' });
  layer(front, plaque, 0.6, 0.41, -2.1, 1.4, 5.85, { spot: 'plaque' });
  layer(front, counter, 2.6, 0.98, -1.9, 0, 5.4, { spot: 'counter' });
  layer(front, urn, 0.34, 0.51, -2.7, 0.98, 5.35, { spot: 'urn' });
  for (const [x, z] of [[-1.3, 4.0], [1.3, 4.0]]) layer(front, table(530 + x * 10 + z), 2.0, 0.75, x, 0, z, { spot: 'tables' });
  layer(front, vendo, 0.95, 1.9, 2.25, 0, 3.2, { spot: 'vendo' });
  for (const [x, z] of [[-1.3, 2.4], [1.3, 2.4]]) layer(front, table(530 + x * 10 + z), 2.0, 0.75, x, 0, z, { spot: 'tables' });
  layer(front, lamp, 0.42, 0.32, -1.5, 2.66, 2.5, { noHit: true });
  layer(front, lamp, 0.42, 0.32, 1.5, 2.66, 2.5, { noHit: true });

  // ---- back view: the way out to the corridor ----
  const back = makeView(world);
  const backP = painting({
    room: { halfW: 3.5, height: 3, depth: 3.2 }, seed: 1211,
    surfaces: messWalls([{ x: 0, z: 2.2, r: 1.4 }]),
    back: (p, rect) => blitBack(p, exit, rect),
  });
  hangPainting(back, backP, [['messexit', backP.backRegion(0.29, 0.28, 0.71, 1)]]);
  layer(back, table(777), 2.0, 0.75, -1.6, 0, 2.2, { spot: 'tables' });

  let t = 0;
  let lastBlink = null;
  return {
    name: 'MESS HALL',
    fog: [8, 20],
    views: [front, back],
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
