// The ship's library: shelves of data tapes, a card catalog, a reading desk,
// and LIBRA, the shy terminal who runs the place (and loves DORIS).

import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=17';
import { cardMaker, H, wallTex, floorTex, ceilingTex, endWallTex, lampTex } from './roomkit.js?v=17';

export function buildLibrary(group) {
  const { card, hitMeshes, quads } = cardMaker(group);
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

  const floor = pixelTexture(256, 256, (p, w, h) => {
    // worn carpet with a pattern
    p.vgrad(0, 0, w, h, R.red, 2.2, 2.8);
    for (let y = 0; y < h; y += 16)
      for (let x = 0; x < w; x += 16) {
        p.rect(x + 7, y + 3, 2, 10, R.red[1]);
        p.rect(x + 3, y + 7, 10, 2, R.red[1]);
        p.px(x + 8, y + 8, R.hazard[4]);
      }
    p.grime(0, 0, w, h, { scale: 18, amount: 0.5, thresh: 0.4, seed: 902 });
    p.light(128, 128, 110, LIGHT.warm, 0.18);
    p.ao(0, 0, 24, h, 'left', 0.6);
    p.ao(w - 24, 0, 24, h, 'right', 0.6);
    p.quantize();
  }, { seed: 901 });

  const ceiling = ceilingTex(256, 256, { seed: 911, lamps: [[128, 100]] });
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

  // ---- layout ----
  card(floor, 6, 6, [0, 0, Z], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 6, 6, [0, 3, Z], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(shelfWall(971), 6, 3, [0, 1.5, -5], { order: -1, segs: 2, spot: 'shelves' });
  card(shelfWall(981), 6, 3, [-3, 1.5, Z], { rot: [0, H, 0], order: -1, segs: 2, spot: 'shelves' });
  card(shelfWall(991), 6, 3, [3, 1.5, Z], { rot: [0, -H, 0], order: -1, segs: 2, spot: 'shelves' });
  card(exit, 6, 3, [0, 1.5, 1], { rot: [0, Math.PI, 0], order: -1, spot: 'libexit', region: [0.29, 0, 0.71, 0.72] });

  const libraCard = card(libraTex, 1.4, 1.22, [0.3, 1.0, -4.6], { spot: 'libra' });
  card(catalog, 0.7, 1.05, [-2.0, 0.53, -3.6], { face: [0, 0.53, 0], spot: 'catalog' });
  card(desk, 1.7, 0.74, [-0.9, 0.37, -2.0], { face: [0, 0.37, 0], spot: 'readdesk' });
  card(sign, 0.8, 0.25, [0.3, 2.3, -4.9], { spot: 'silence' });
  card(tube, 0.22, 1.9, [2.4, 1.6, -3.9], { face: [0, 1.6, 0], spot: 'tube' });
  card(lamp, 0.42, 0.32, [0, 2.82, -2.2], { face: [0, 2.82, 0], noHit: true });

  let t = 0;
  let lastBlink = null;
  return {
    name: 'LIBRARY',
    quads: quads(),
    hitMeshes,
    fog: [3.5, 10],
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
