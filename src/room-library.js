// The ship's library: shelves of data tapes, a card catalog, a reading desk,
// and LIBRA, the shy terminal who runs the place (and loves DORIS).

import { makeView, painting, hangPainting, layer, blitBack, treadFloor, panelWall, lampCeiling } from './stagekit.js?v=24';
import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=24';
import { cardMaker, H, wallTex, floorTex, ceilingTex, endWallTex, lampTex } from './roomkit.js?v=24';

export function buildLibrary(world) {
  const Z = -2; // room runs from z +1 (corridor door) to z -5

  const shelfWall = (seed) =>
    pixelTexture(256, 112, (p, w, h) => {
      p.vgrad(0, 0, w, h, R.rust, 2.6, 1.2);
      const spines = [R.rust, R.cryo, R.red, R.phosphor, R.beige, R.hazard, R.steel];
      for (let y = 10; y < h - 8; y += 20) {
        for (let x = 2; x < w - 4; ) {
          const sw = 3 + Math.floor(p.rand() * 4), sh = 12 + Math.floor(p.rand() * 6);
          const ramp = spines[Math.floor(p.rand() * spines.length)];
          p.rect(x, y + 18 - sh, sw, sh, ramp[3]);
          p.rect(x, y + 18 - sh, 1, sh, ramp[5]);
          p.rect(x + sw - 1, y + 18 - sh, 1, sh, ramp[1]);
          if (p.rand() < 0.3) p.rect(x, y + 18 - sh + 3, sw, 1, R.hazard[6]);
          x += sw + (p.rand() < 0.1 ? 4 : 0);
        }
        p.bevel(0, y + 18, w, 3, R.rust, 5);
      }
      for (let x = 0; x < w; x += 64) p.vcyl(x, 0, 4, h, R.rust, 1, 6);
      p.grime(0, 0, w, h, { scale: 16, amount: 0.35, seed: seed + 1 });
      p.light(64, 20, 70, LIGHT.warm, 0.22);
      p.light(192, 20, 70, LIGHT.warm, 0.22);
      p.ao(0, h - 20, w, 20, 'down', 0.6);
      p.quantize();
    }, { seed });


  const exit = endWallTex(256, 112, { label: 'CORRIDOR', seed: 921, open: true, arrow: false });

  // LIBRA's big amber terminal in a wooden console.
  const libra = { blink: true };
  const libraTex = pixelTexture(128, 112, (p, w) => {
    p.bevel(4, 0, 120, 82, R.beige, 4);
    p.inset(12, 8, 104, 64, R.black, 1);
    p.vgrad(13, 9, 102, 62, R.hazard, 2.4, 1);
    // face: round glasses, shy smile, blush
    for (const ex of [46, 82]) {
      for (let a = 0; a < 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        p.px(ex + Math.round(Math.cos(t) * 10), 34 + Math.round(Math.sin(t) * 10), R.hazard[6]);
      }
      if (libra.blink) p.rect(ex - 2, 31, 5, 6, R.hazard[7]);
      else p.rect(ex - 3, 34, 7, 1, R.hazard[7]);
      for (const dx of [-5, -2, 1]) p.px(ex + dx, 49, R.hazard[5]);
    }
    p.rect(56, 33, 16, 1, R.hazard[6]);
    p.rect(58, 58, 12, 1, R.hazard[7]);
    p.px(57, 57, R.hazard[7]);
    p.px(70, 57, R.hazard[7]);
    for (let y = 9; y < 71; y += 2) p.rect(13, y, 102, 1, 'rgba(0,0,0,0.22)');
    p.text('LIBRA', 52, 74, R.beige[2], 7);
    p.vgrad(10, 82, 108, 30, R.rust, 4.4, 2.4);
    p.rect(10, 82, 108, 1, R.rust[6]);
    for (let x = 20; x < 110; x += 6) p.bevel(x, 88, 5, 4, R.beige, 5);
    p.light(64, 40, 70, [255, 170, 60], 0.25);
    p.outline('#100c22');
  }, { seed: 931 });

  const catalog = pixelTexture(64, 96, (p) => {
    p.vgrad(4, 0, 56, 96, R.rust, 4.6, 2.4);
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 3; c++) {
        const x = 8 + c * 17, y = 6 + r * 14;
        p.bevel(x, y, 15, 12, R.rust, 5);
        p.rect(x + 4, y + 3, 7, 3, R.beige[6]);
        p.rect(x + 6, y + 8, 3, 1, R.hazard[5]);
      }
    p.bevel(25, 48, 15, 12, R.beige, 6);
    p.grime(0, 0, 64, 96, { scale: 9, amount: 0.3, seed: 941 });
    p.outline('#1a0812');
    p.quantize();
  }, { seed: 943 });

  const desk = pixelTexture(128, 56, (p) => {
    p.bevel(0, 10, 128, 8, R.rust, 6);
    p.vgrad(4, 18, 120, 38, R.rust, 4, 2);
    for (const x of [8, 112]) p.rect(x, 18, 8, 38, R.rust[2]);
    // a green banker's lamp and an open book
    p.rect(20, 0, 2, 10, R.hazard[4]);
    p.bevel(12, 0, 18, 5, R.phosphor, 5);
    p.bevel(70, 4, 34, 6, R.beige, 6);
    p.rect(86, 4, 2, 6, R.beige[3]);
    p.light(24, 8, 30, LIGHT.green, 0.3);
    p.outline('#1a0812');
    p.quantize();
  }, { seed: 951 });

  const sign = pixelTexture(64, 20, (p) => {
    p.bevel(0, 0, 64, 20, R.beige, 5);
    p.text('SILENCE', 6, 2, R.red[3], 8);
    p.text('PLEASE', 10, 10, R.dark[2], 7);
    p.text('or else', 40, 13, R.dark[4], 5);
    p.quantize();
  });

  const tube = pixelTexture(24, 128, (p) => {
    p.vcyl(6, 0, 12, 128, R.steel, 1, 7);
    for (let y = 10; y < 128; y += 30) p.bevel(3, y, 18, 5, R.dark, 5);
    p.inset(8, 70, 8, 14, R.cryo, 3);
    p.outline('#100c22');
    p.quantize();
  });

  const lamp = lampTex(961);

  // Bookshelves painted down both side walls; patterned carpet.
  const spine = [R.rust, R.cryo, R.red, R.phosphor, R.beige, R.hazard];
  const fr = (v) => v - Math.floor(v);
  const libWalls = {
    floor: (x, z) => {
      const u = fr(x / 0.4), w = fr(z / 0.4);
      if ((Math.abs(u - 0.5) < 0.06 && Math.abs(w - 0.5) < 0.3) || (Math.abs(w - 0.5) < 0.06 && Math.abs(u - 0.5) < 0.3)) return [R.red, 1.2];
      if (Math.abs(u - 0.5) < 0.06 && Math.abs(w - 0.5) < 0.06) return [R.hazard, 4];
      return [R.red, 2.6];
    },
    ceil: lampCeiling({ ramp: R.rust, lamps: [{ x: 0, z: 2.4, w: 0.4, d: 0.4 }] }),
    wall: (side, z, y) => {
      if (y < 0.15 || y > 2.7) return [R.rust, 2];
      const row = fr(y / 0.5);
      if (row < 0.1) return [R.rust, 5];
      const k = Math.floor(z / 0.07 + side * 13);
      const h = fr(Math.sin(k * 12.9898) * 43758.5453);
      if (row > 0.86 - h * 0.18) return [R.rust, 1];
      const ramp = spine[Math.floor(h * spine.length)];
      return [ramp, fr(z / 0.07) < 0.2 ? 5 : 3.4];
    },
  };

  // ---- front view: LIBRA's terminal, the catalog, the reading desk ----
  const front = makeView(world);
  const frontP = painting({
    room: { halfW: 3, height: 3, depth: 5 }, seed: 1401, surfaces: libWalls,
    back: (p, rect) => blitBack(p, shelfWall(971), rect),
    after: (p, proj) => {
      const [lx, ly] = proj(0.3, 1.0, 4.6);
      p.light(lx, ly, 80, [255, 170, 60], 0.22);
    },
  });
  hangPainting(front, frontP, [
    ['shelves', frontP.region(-3, -3, 0.15, 2.7, 1.5, 5)],
    ['shelves', frontP.region(3, 3, 0.15, 2.7, 1.5, 5)],
  ]);
  const libraCard = layer(front, libraTex, 1.4, 1.22, 0.3, 0.39, 4.6, { spot: 'libra' });
  layer(front, sign, 0.8, 0.25, 0.3, 2.18, 4.85, { spot: 'silence' });
  layer(front, catalog, 0.7, 1.05, -1.8, 0, 3.4, { spot: 'catalog' });
  layer(front, tube, 0.22, 1.9, 2.0, 0.65, 3.6, { spot: 'tube' });
  layer(front, desk, 1.7, 0.74, -0.6, 0, 2.3, { spot: 'readdesk' });
  layer(front, lamp, 0.42, 0.32, 0, 2.66, 2.4, { noHit: true });

  // ---- back view: the way out ----
  const back = makeView(world);
  const backP = painting({
    room: { halfW: 3, height: 3, depth: 3.2 }, seed: 1411, surfaces: libWalls,
    back: (p, rect) => blitBack(p, exit, rect),
  });
  hangPainting(back, backP, [['libexit', backP.backRegion(0.29, 0.28, 0.71, 1)]]);

  let t = 0;
  let lastBlink = null;
  return {
    name: 'LIBRARY',
    fog: [8, 20],
    views: [front, back],
    update(dt) {
      t += dt;
      const blink = (t % 4.2) > 0.15;
      if (blink !== lastBlink) {
        lastBlink = blink;
        libra.blink = blink;
        libraTex.userData.redraw();
      }
      libraCard.material.uniforms.uTint.value = 1 + 0.04 * Math.sin(t * 2);
    },
  };
}
