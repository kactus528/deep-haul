// Cryo Bay 3 — placeholder room for the VERTEX test.
// Generated pixel art aiming at top-tier 16-bit backgrounds: hue-shifted
// ramps, colored light spill, wear and grime, colored outlines, lived-in
// clutter. Cards stand at real depths around the player's spot (origin).
// Swap in hand-drawn art later; positions and sizes can stay.

import * as THREE from 'three';
import { cardMaterial, FOG, MAX_QUADS } from './vertex.js?v=15';
import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=15';

export function buildCryoBay(scene) {
  scene.background = FOG;
  let quads = 0;
  const hitMeshes = []; // cards the pointer can hit (hotspots and solid walls)

  const card = (tex, w, h, pos, { rot, face, order = 0, segs = 1, counted = true, tint = 1, spot = null, region = null, noHit = false } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, segs, segs), cardMaterial(tex, { tint }));
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (face) m.lookAt(face[0], face[1], face[2]);
    m.renderOrder = order; // structure (-1), floor decals (-0.5), props (0)
    if (counted) {
      m.userData.card = true;
      quads += segs * segs;
    }
    if (spot) m.userData.spot = spot;
    if (region) m.userData.region = region;
    if (counted && !noHit) hitMeshes.push(m);
    scene.add(m);
    return m;
  };

  // =====================================================================
  // Back / rear wall: the big hatch
  // =====================================================================
  const wall = pixelTexture(256, 144, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.steel, 3.8, 1.6);
    for (let r = 0; r < 4; r++) {
      const y0 = r * 36;
      if (r > 0) {
        p.rect(0, y0, w, 1, R.steel[0]);
        p.rect(0, y0 + 1, w, 1, R.steel[5]);
      }
      for (let x = (r % 2) * 32; x < w; x += 64) {
        p.rect(x, y0 + 2, 1, 34, R.steel[0]);
        p.rect(x + 1, y0 + 2, 1, 34, R.steel[5]);
        for (const [rx, ry] of [[x + 4, y0 + 5], [x + 4, y0 + 30], [x - 6, y0 + 5], [x - 6, y0 + 30]]) p.rivet(rx, ry, R.steel);
      }
    }
    for (const vx of [196, 228]) {
      p.inset(vx, 108, 22, 14, R.dark, 1);
      for (let y = 110; y < 120; y += 2) p.rect(vx + 2, y, 18, 1, R.dark[4]);
    }
    // Warning light strip
    p.rect(0, 7, w, 6, R.red[1]);
    p.rect(0, 8, w, 4, R.red[3]);
    p.rect(0, 9, w, 2, R.red[5]);
    p.rect(0, 9, w, 1, R.red[6]);
    for (let x = 0; x < w; x += 16) p.rect(x, 7, 1, 6, R.red[1]);
    // Pipes on the left with clamps
    p.vcyl(14, 14, 10, 130, R.steel, 1, 6.5);
    p.vcyl(28, 14, 7, 130, R.rust, 1, 5.5);
    p.vcyl(39, 14, 4, 130, R.dark, 1, 6);
    for (let y = 28; y < h; y += 38) {
      p.bevel(11, y, 34, 6, R.dark, 4);
      p.rivet(13, y + 2, R.steel);
      p.rivet(41, y + 2, R.steel);
    }
    // Hatch frame and hazard band
    p.bevel(72, 30, 112, 114, R.steel, 4);
    p.rect(71, 30, 1, 114, R.dark[1]);
    p.rect(184, 30, 1, 114, R.dark[1]);
    p.stripes(76, 34, 104, 10, R.hazard[5], R.black[2], 8);
    p.rect(76, 34, 104, 1, R.hazard[7]);
    p.rect(76, 44, 104, 1, R.black[1]);
    p.inset(80, 48, 96, 96, R.dark, 2);
    for (const lx of [82, 129]) {
      p.vgrad(lx, 50, 45, 94, R.steel, 4.2, 2.4);
      p.rect(lx, 50, 45, 1, R.steel[6]);
      p.rect(lx, 50, 1, 94, R.steel[5]);
      p.rect(lx + 44, 50, 1, 94, R.steel[1]);
      for (let y = 60; y < 140; y += 13) {
        p.rect(lx + 4, y, 37, 1, R.steel[1]);
        p.rect(lx + 4, y + 1, 37, 1, R.steel[5]);
      }
      p.inset(lx + 12, 66, 21, 15, R.dark, 1);
      p.vgrad(lx + 13, 67, 19, 13, R.cryo, 5, 1.5);
      p.rect(lx + 14, 68, 1, 8, R.cryo[7]);
      p.rect(lx + 16, 68, 1, 4, R.cryo[6]);
      p.bevel(lx + 16, 100, 13, 6, R.hazard, 5);
    }
    p.rect(127, 50, 2, 94, R.black[0]);
    p.rect(126, 50, 1, 94, R.steel[2]);
    // Status panel
    p.bevel(190, 62, 28, 40, R.steel, 3);
    p.inset(193, 65, 22, 34, R.dark, 1);
    for (let i = 0; i < 3; i++) {
      p.rect(197, 70 + i * 9, 4, 3, i === 2 ? R.red[6] : R.phosphor[6]);
      p.rect(204, 71 + i * 9, 8, 1, R.dark[5]);
      p.rect(204, 73 + i * 9, 5, 1, R.dark[4]);
    }
    // Wear and light
    p.grime(0, 0, w, h, { scale: 18, amount: 0.45, seed: 31 });
    p.drips(0, 14, w, h - 14, { count: 70, len: 26 });
    p.drips(26, 20, 12, 120, { count: 8, len: 70, color: R.rust[4], strength: 0.4 });
    p.scratches(82, 50, 92, 94, 40, R.steel[6]);
    for (let x = 8; x < w; x += 32) p.light(x, 14, 34, LIGHT.red, 0.35, 0.8);
    p.light(105, 74, 22, LIGHT.cyan, 0.3);
    p.light(152, 74, 22, LIGHT.cyan, 0.3);
    p.light(199, 80, 18, LIGHT.green, 0.2);
    p.ao(0, h - 40, w, 40, 'down', 0.65);
    p.ao(0, 0, w, 16, 'up', 0.35);
    p.quantize();
  }, { seed: 3 });

  // =====================================================================
  // Side walls: rows of occupied cryo alcoves
  // =====================================================================
  const side = pixelTexture(256, 128, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.steel, 3.4, 1.6);
    p.hcyl(0, 3, w, 12, R.steel, 1, 6.5);
    p.hcyl(0, 16, w, 4, R.rust, 1, 5);
    for (let x = 10; x < w; x += 48) {
      p.bevel(x, 1, 7, 21, R.dark, 4);
      p.rivet(x + 2, 4, R.steel);
    }
    for (let i = 0; i < 4; i++) {
      const x0 = 12 + i * 60;
      p.bevel(x0 - 4, 24, 56, 92, R.steel, 4);
      p.inset(x0, 27, 48, 82, R.dark, 1);
      p.vgrad(x0 + 3, 30, 42, 68, R.cryo, 5.5, 1.5);
      // sleeper: head, shoulders, crossed arms
      p.disc(x0 + 24, 41, 6, R.cryo[2]);
      p.rect(x0 + 21, 47, 6, 3, R.cryo[2]);
      p.rect(x0 + 13, 50, 22, 48, R.cryo[2]);
      p.rect(x0 + 15, 64, 18, 3, R.cryo[3]);
      p.rect(x0 + 16, 66, 16, 1, R.cryo[1]);
      // frost, condensation, glass shine
      p.noise(x0 + 3, 30, 42, 68, R.cryo[7], 0.035);
      p.noise(x0 + 3, 84, 42, 14, R.cryo[6], 0.3);
      p.noise(x0 + 3, 30, 42, 6, R.cryo[6], 0.25);
      for (let k = 0; k < 5; k++) {
        const dx = x0 + 6 + Math.floor(p.rand() * 36);
        p.line(dx, 34, dx, 34 + 6 + p.rand() * 20, R.cryo[6]);
      }
      p.line(x0 + 6, 32, x0 + 6, 80, R.cryo[7]);
      p.line(x0 + 8, 32, x0 + 8, 56, R.cryo[6]);
      p.bevel(x0 + 6, 100, 30, 10, R.beige, 4);
      p.text(`C-0${i + 1}`, x0 + 9, 101, R.black[0], 7);
      p.rect(x0 + 41, 103, 3, 3, i === 2 ? R.red[6] : R.phosphor[6]);
    }
    p.stripes(0, 117, w, 6, R.hazard[5], R.black[2], 8);
    p.rect(0, 117, w, 1, R.hazard[7]);
    p.rect(0, 123, w, 5, R.dark[1]);
    p.grime(0, 0, w, h, { scale: 16, amount: 0.4, seed: 41 });
    p.drips(0, 22, w, h - 22, { count: 50, len: 18 });
    for (let i = 0; i < 4; i++) p.light(36 + i * 60, 64, 46, LIGHT.cyan, 0.38, 1.1);
    p.light(129, 104, 14, LIGHT.red, 0.3);
    p.ao(0, h - 30, w, 30, 'down', 0.6);
    p.quantize();
  }, { seed: 5 });

  // =====================================================================
  // Floor: tread plates, hazard walkway, light pools, stains
  // =====================================================================
  const floor = pixelTexture(256, 256, (p, w, h) => {
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 8; i++) {
        const x = i * 32, y = j * 32;
        p.bevel(x, y, 32, 32, R.dark, 4);
        for (let yy = 5, row = 0; yy < 28; yy += 5, row++)
          for (let xx = 4 + (row % 2) * 3; xx < 27; xx += 6) {
            p.px(x + xx, y + yy, R.dark[6]);
            p.px(x + xx + 1, y + yy, R.dark[5]);
            p.px(x + xx + 1, y + yy + 1, R.dark[2]);
          }
        for (const [rx, ry] of [[2, 2], [28, 2], [2, 28], [28, 28]]) p.rivet(x + rx, y + ry, R.steel);
      }
    p.stripes(112, 0, 32, h, R.hazard[4], R.black[2], 8);
    p.rect(111, 0, 1, h, R.black[0]);
    p.rect(112, 0, 1, h, R.hazard[6]);
    p.rect(144, 0, 1, h, R.black[0]);
    p.inset(176, 96, 28, 20, R.dark, 0);
    for (let x = 178; x < 202; x += 3) p.rect(x, 98, 1, 16, R.dark[4]);
    p.grime(0, 0, w, h, { scale: 22, amount: 0.55, thresh: 0.4, seed: 51 });
    p.scratches(100, 0, 56, h, 70, R.dark[7]);
    for (const [x, y] of [[56, 149], [56, 74], [200, 149], [200, 74]]) p.light(x, y, 40, LIGHT.cyan, 0.32, 1.3);
    p.light(64, 128, 48, LIGHT.warm, 0.22);
    p.light(192, 128, 48, LIGHT.warm, 0.22);
    p.light(128, 8, 60, LIGHT.red, 0.3, 0.5);
    p.ao(0, 0, 30, h, 'left', 0.7);
    p.ao(w - 30, 0, 30, h, 'right', 0.7);
    p.ao(0, 0, w, 24, 'up', 0.6);
    p.quantize();
  }, { seed: 7 });

  // =====================================================================
  // Ceiling: pipes, cable trays, light panels
  // =====================================================================
  const ceiling = pixelTexture(256, 256, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.dark, 2.8, 1.2);
    for (let x = 0; x < w; x += 64) {
      p.rect(x, 0, 1, h, R.dark[0]);
      p.rect(x + 1, 0, 1, h, R.dark[4]);
    }
    p.hcyl(0, 14, w, 16, R.steel, 1, 6.5);
    p.hcyl(0, 34, w, 8, R.rust, 1, 5.5);
    p.hcyl(0, 210, w, 12, R.steel, 1, 6);
    p.hcyl(0, 226, w, 6, R.dark, 1, 6);
    for (let x = 6; x < w; x += 40) {
      p.bevel(x, 10, 6, 34, R.dark, 4);
      p.bevel(x, 206, 6, 30, R.dark, 4);
    }
    for (const x of [24, 152]) {
      p.bevel(x - 4, 92, 88, 52, R.steel, 3);
      p.vgrad(x, 96, 80, 44, R.beige, 7.4, 5.6);
      for (let gx = x + 10; gx < x + 80; gx += 10) p.rect(gx, 96, 1, 44, R.beige[5]);
    }
    for (let y = 164; y < 196; y += 3) p.rect(40, y, 176, 1, R.black[1]);
    p.grime(0, 0, w, h, { scale: 20, amount: 0.4, seed: 61 });
    p.light(64, 118, 70, LIGHT.warm, 0.3);
    p.light(192, 118, 70, LIGHT.warm, 0.3);
    p.quantize();
  }, { seed: 9 });

  // =====================================================================
  // Cryo pods
  // =====================================================================
  const pod = (open) =>
    pixelTexture(96, 192, (p) => {
      p.vcyl(10, 12, 76, 158, R.steel, 1.3, 6.5);
      for (let j = 0; j < 22; j++) {
        const hw = 38 * Math.sqrt(Math.max(0, 1 - Math.pow((22 - j) / 22, 2)));
        p.clear(10, 12 + j, Math.floor(38 - hw), 1);
        const right = Math.ceil(48 + hw);
        p.clear(right, 12 + j, 86 - right, 1);
      }
      for (let x = 34; x < 62; x += 4) p.rect(x, 18, 2, 8, R.dark[1]);
      p.vcyl(4, 60, 6, 100, R.rust, 1, 5);
      p.vcyl(86, 60, 6, 100, R.rust, 1, 5);
      p.inset(20, 30, 56, 98, R.dark, 1);
      if (open) {
        p.vgrad(21, 31, 54, 96, R.dark, 0.5, 2.8);
        p.rect(27, 40, 42, 80, R.dark[3]);
        for (let y = 46; y < 118; y += 8) p.rect(28, y, 40, 1, R.dark[2]);
        p.noise(21, 100, 54, 27, R.cryo[3], 0.25);
        p.noise(21, 31, 54, 96, R.cryo[2], 0.04);
      } else {
        p.vgrad(21, 31, 54, 96, R.cryo, 6, 2.2);
        p.disc(48, 50, 9, R.cryo[3]);
        p.rect(44, 59, 8, 4, R.cryo[3]);
        p.rect(32, 63, 32, 64, R.cryo[3]);
        p.rect(35, 84, 26, 4, R.cryo[4]);
        p.rect(37, 88, 22, 1, R.cryo[2]);
        p.px(45, 49, R.cryo[2]);
        p.px(51, 49, R.cryo[2]);
        p.noise(21, 31, 54, 96, R.cryo[7], 0.05);
        p.noise(21, 104, 54, 23, R.cryo[6], 0.35);
        p.noise(21, 31, 54, 8, R.cryo[6], 0.3);
        for (let k = 0; k < 8; k++) {
          const dx = 24 + Math.floor(p.rand() * 48);
          p.line(dx, 36, dx, 36 + 8 + p.rand() * 30, R.cryo[6]);
        }
        p.line(25, 34, 25, 110, R.cryo[7]);
        p.line(28, 34, 28, 72, R.cryo[7]);
        p.line(31, 34, 31, 50, R.cryo[6]);
      }
      p.bevel(30, 132, 36, 16, R.dark, 3);
      for (let i = 0; i < 4; i++) p.rect(34 + i * 7, 136 + (i % 2) * 2, 5, 8 - (i % 2) * 2, open ? R.red[5 - (i % 2)] : R.phosphor[5 + (i % 2)]);
      p.bevel(28, 150, 40, 10, R.hazard, 5);
      p.text(open ? 'G. PELL' : 'KEEP COLD', 30, 151, R.black[0], 7);
      p.bevel(6, 164, 84, 28, R.dark, 4);
      p.stripes(8, 166, 80, 5, R.hazard[5], R.black[2], 6);
      for (let x = 14; x < 84; x += 5) p.rect(x, 175, 2, 12, R.black[1]);
      p.light(48, 80, 48, open ? LIGHT.red : LIGHT.cyan, 0.35, 1.4);
      p.grime(0, 0, 96, 192, { scale: 12, amount: 0.3, seed: open ? 71 : 73 });
      p.drips(12, 128, 72, 36, { count: 14, len: 18 });
      p.outline('#100c22');
      p.quantize();
    }, { seed: open ? 11 : 13 });
  const podClosed = pod(false);
  const podOpen = pod(true);

  // =====================================================================
  // DORIS terminal (animated)
  // =====================================================================
  const crtLines = ['DORIS 3.1', 'CREW  0/212', 'ELAPSED', '400Y 2M 11D', 'NAV: LOCKED', 'MURDER? YES', 'SNACK? NO', '- - - - - -'];
  const crtState = { scroll: 0, cursor: true };
  const crt = pixelTexture(96, 72, (p) => {
    p.bevel(0, 0, 96, 64, R.beige, 4);
    p.rect(1, 1, 94, 1, R.beige[7]);
    p.inset(5, 4, 86, 52, R.black, 1);
    p.vgrad(8, 7, 80, 46, R.phosphor, 1.6, 0.6);
    for (let i = 0; i < 5; i++) p.text(crtLines[(crtState.scroll + i) % crtLines.length], 10, 8 + i * 9, R.phosphor[6], 8);
    if (crtState.cursor) p.rect(80, 44, 4, 7, R.phosphor[6]);
    for (let y = 8; y < 53; y += 2) p.rect(8, y, 80, 1, 'rgba(0,0,0,0.3)');
    p.px(9, 8, R.phosphor[7]);
    p.px(10, 8, R.phosphor[6]);
    p.px(9, 9, R.phosphor[6]);
    p.bevel(66, 57, 8, 5, R.dark, 4);
    p.bevel(78, 57, 8, 5, R.dark, 4);
    p.rect(9, 58, 3, 2, R.red[6]);
    p.text('TAIYO', 26, 57, R.beige[2], 6);
    p.bevel(34, 64, 28, 8, R.beige, 3);
    p.outline('#1a1220');
  }, { seed: 15 });

  const desk = pixelTexture(64, 96, (p) => {
    p.vgrad(4, 10, 56, 86, R.steel, 4.4, 2);
    p.rect(4, 10, 1, 86, R.steel[6]);
    p.rect(59, 10, 1, 86, R.steel[1]);
    p.bevel(0, 0, 64, 11, R.steel, 5);
    p.inset(6, 2, 52, 7, R.dark, 2);
    for (let x = 8; x < 56; x += 3) {
      p.px(x, 3, R.beige[6]);
      p.px(x + 1, 5, R.beige[5]);
      p.px(x, 7, R.beige[4]);
    }
    for (const y of [18, 42, 66]) {
      p.bevel(10, y, 44, 20, R.steel, 4);
      p.rect(25, y + 8, 14, 3, R.dark[1]);
      p.rect(25, y + 8, 14, 1, R.steel[7]);
    }
    p.bevel(14, 22, 14, 6, R.beige, 6);
    p.rect(4, 89, 56, 7, R.dark[1]);
    p.grime(0, 0, 64, 96, { scale: 10, amount: 0.35, seed: 81 });
    p.scratches(10, 18, 44, 70, 20, R.steel[7]);
    p.light(32, 4, 40, LIGHT.green, 0.2);
    p.ao(0, 70, 64, 26, 'down', 0.6);
    p.outline('#100c22');
    p.quantize();
  }, { seed: 17 });

  const pipe = pixelTexture(256, 16, (p, w) => {
    p.hcyl(0, 3, w, 10, R.steel, 1, 6.5);
    p.noise(0, 4, w, 8, R.rust[4], 0.04);
    for (let x = 0; x < w; x += 64) {
      p.bevel(x + 4, 0, 9, 16, R.dark, 4);
      p.rivet(x + 7, 2, R.steel);
      p.rivet(x + 7, 12, R.steel);
    }
    p.bevel(150, 2, 14, 12, R.red, 4);
    p.drips(0, 8, w, 6, { count: 12, len: 6, color: R.rust[4] });
    p.outline('#100c22');
    p.quantize();
  }, { seed: 19 });

  const cables = pixelTexture(32, 160, (p) => {
    const strands = [[8, R.dark, 0], [14, R.red, 1.3], [19, R.steel, 2.1], [24, R.hazard, 0.7]];
    for (const [cx0, ramp, ph] of strands)
      for (let y = 0; y < 150; y++) {
        const cx = cx0 + Math.round(Math.sin(y / 14 + ph) * 2);
        p.px(cx - 1, y, ramp[5]);
        p.px(cx, y, ramp[3]);
        p.px(cx + 1, y, ramp[1]);
      }
    for (let y = 20; y < 150; y += 42) p.bevel(4, y, 25, 5, R.dark, 5);
    p.bevel(9, 146, 14, 14, R.dark, 4);
    p.outline('#100c22');
    p.quantize();
  });

  const mist = pixelTexture(128, 32, (p, w, h) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const dens = Math.pow(j / h, 1.3) * 0.75 + Math.sin(i * 0.12 + j * 0.35) * 0.15;
        if ((i + j) % 2 === 0 && p.rand() < dens * 1.6) p.px(i, j, p.rand() < 0.5 ? R.cryo[6] : R.cryo[7]);
      }
  }, { repeatX: true, seed: 21 });

  const steam = pixelTexture(32, 64, (p, w, h) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const n = Math.sin((i / w) * Math.PI) * (0.5 + 0.5 * Math.sin(j * 0.4 + i * 0.2));
        if ((i + j) % 2 === 0 && p.rand() < n * 0.8) p.px(i, j, p.rand() < 0.6 ? R.beige[6] : R.cryo[7]);
      }
  }, { repeatY: true, seed: 25 });

  const beam = pixelTexture(64, 160, (p, w, h) => {
    for (let j = 0; j < h; j++) {
      const half = (0.18 + 0.82 * (j / h)) * (w / 2);
      for (let i = 0; i < w; i++) {
        const u = Math.abs(i - w / 2) / half;
        if (u > 1) continue;
        const dens = (1 - u * u) * (0.85 - 0.6 * (j / h));
        if ((i + j) % 2 === 0 && p.rand() < dens) p.px(i, j, j < h * 0.3 ? R.beige[7] : R.hazard[7]);
      }
    }
  }, { seed: 27 });

  const eyeTex = pixelTexture(32, 32, (p) => {
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        const dx = i - 15.5, dy = j - 15.5;
        const d = Math.hypot(dx, dy);
        if (d < 10) p.px(i, j, R.red[Math.max(1, Math.min(7, Math.round(7 - d * 0.6)))]);
        else if (d < 15) p.px(i, j, R.steel[Math.max(1, Math.min(7, Math.round(4 - (dx + dy) / 8)))]);
      }
    p.rect(11, 10, 3, 2, R.red[7]);
    p.px(11, 12, R.red[7]);
    p.outline('#100c22');
  });

  const beacon = pixelTexture(24, 24, (p) => {
    p.bevel(2, 16, 20, 7, R.dark, 4);
    p.disc(12, 11, 7, R.hazard[5]);
    p.disc(11, 10, 4, R.hazard[6]);
    p.rect(9, 7, 2, 2, R.hazard[7]);
    for (let x = 6; x < 19; x += 3) p.rect(x, 5, 1, 12, R.hazard[3]);
    p.outline('#2a1408');
    p.quantize();
  });

  const sign = pixelTexture(96, 24, (p) => {
    p.bevel(0, 0, 96, 24, R.hazard, 5);
    p.inset(4, 4, 88, 16, R.hazard, 4);
    p.text('CRYO BAY 3', 12, 6, R.black[0], 11);
    for (const [x, y] of [[1, 1], [93, 1], [1, 21], [93, 21]]) p.rivet(x, y, R.steel);
    p.grime(0, 0, 96, 24, { scale: 8, amount: 0.35, seed: 91 });
    p.drips(0, 18, 96, 6, { count: 8, len: 6 });
    p.quantize();
  });

  const crate = pixelTexture(64, 64, (p) => {
    p.bevel(0, 0, 64, 64, R.rust, 4);
    p.inset(6, 6, 52, 52, R.rust, 3);
    for (let y = 9; y < 56; y += 8) p.rect(7, y, 50, 1, R.rust[2]);
    p.bevel(6, 28, 52, 9, R.rust, 5);
    for (const [x, y] of [[0, 0], [53, 0], [0, 53], [53, 53]]) {
      p.bevel(x, y, 11, 11, R.steel, 4);
      p.rivet(x + 4, y + 4, R.steel);
    }
    p.text('ORE', 20, 11, R.rust[1], 12);
    p.text('IRONMONGER', 12, 40, R.rust[2], 6);
    p.grime(0, 0, 64, 64, { scale: 10, amount: 0.45, seed: 101 });
    p.scratches(4, 4, 56, 56, 25, R.rust[6]);
    p.outline('#1a0812');
    p.quantize();
  }, { seed: 23 });

  // Spacesuit hanging on a rack
  const suit = pixelTexture(64, 128, (p) => {
    p.hcyl(2, 2, 60, 5, R.steel, 1, 6.5);
    p.rect(31, 7, 2, 8, R.dark[3]);
    p.disc(32, 26, 12, R.beige[5]);
    p.disc(31, 25, 10, R.beige[6]);
    p.disc(32, 27, 8, R.dark[1]);
    p.disc(30, 25, 5, R.cryo[2]);
    p.rect(27, 22, 3, 2, R.cryo[6]);
    p.px(26, 24, R.cryo[7]);
    p.vcyl(16, 38, 32, 50, R.suit, 1.5, 6.4);
    p.vcyl(8, 40, 9, 44, R.suit, 1.5, 6);
    p.vcyl(47, 40, 9, 44, R.suit, 1.5, 6);
    p.bevel(22, 44, 20, 14, R.beige, 4);
    p.rect(25, 47, 4, 3, R.phosphor[6]);
    p.rect(31, 47, 4, 3, R.red[5]);
    p.rect(25, 52, 14, 2, R.dark[3]);
    p.rect(16, 64, 32, 3, R.dark[2]);
    p.vcyl(18, 88, 12, 30, R.suit, 1.5, 6);
    p.vcyl(34, 88, 12, 30, R.suit, 1.5, 6);
    p.bevel(16, 116, 16, 10, R.dark, 4);
    p.bevel(32, 116, 16, 10, R.dark, 4);
    p.bevel(6, 82, 12, 8, R.dark, 4);
    p.bevel(46, 82, 12, 8, R.dark, 4);
    p.vcyl(50, 54, 3, 30, R.dark, 1, 6);
    p.text('E.V.A.', 21, 70, R.suit[1], 6);
    p.grime(0, 0, 64, 128, { scale: 9, amount: 0.35, seed: 111 });
    p.light(32, 60, 40, LIGHT.cyan, 0.2);
    p.outline('#200a14');
    p.quantize();
  }, { seed: 29 });

  // Gus's mop and bucket (he IS the waste-reclamation tech)
  const mop = pixelTexture(40, 96, (p) => {
    p.line(24, 0, 17, 66, R.rust[5]);
    p.line(25, 0, 18, 66, R.rust[3]);
    for (let k = 0; k < 14; k++) p.line(17, 64, 9 + k, 80 + (k % 3) * 2, k % 2 ? R.beige[5] : R.beige[3]);
    p.vcyl(4, 70, 32, 24, R.hazard, 1.5, 6.4);
    p.rect(3, 69, 34, 2, R.hazard[2]);
    p.rect(4, 92, 32, 4, R.hazard[1]);
    p.rect(6, 72, 28, 3, R.cryo[3]);
    p.text('W.R.', 12, 80, R.hazard[1], 7);
    p.grime(0, 60, 40, 36, { scale: 6, amount: 0.4, seed: 121 });
    p.outline('#201008');
    p.quantize();
  });

  // Papers spilled on the floor (a decal)
  const papers = pixelTexture(64, 64, (p) => {
    const sheet = (x, y, w, h, tilt) => {
      for (let j = 0; j < h; j++) {
        const off = Math.round(j * tilt);
        p.rect(x + off, y + j, w, 1, j === 0 ? R.beige[7] : R.beige[6]);
        if (j > 2 && j < h - 2 && j % 3 === 0) p.rect(x + off + 2, y + j, w - 6 - (j % 2) * 4, 1, R.beige[3]);
      }
      p.rect(x + Math.round(h * tilt), y + h, w, 1, R.beige[2]);
    };
    sheet(8, 6, 20, 26, 0.2);
    sheet(30, 14, 22, 28, -0.25);
    sheet(14, 34, 22, 24, 0.1);
    p.bevel(36, 44, 18, 14, R.rust, 4);
    p.rect(42, 43, 6, 2, R.steel[6]);
    p.light(32, 32, 36, LIGHT.cyan, 0.2);
    p.quantize();
  }, { seed: 33 });

  const mug = pixelTexture(16, 16, (p) => {
    p.vcyl(3, 4, 9, 11, R.beige, 2, 7);
    p.rect(3, 4, 9, 1, R.dark[1]);
    p.rect(12, 6, 2, 1, R.beige[4]);
    p.rect(13, 7, 1, 4, R.beige[4]);
    p.rect(12, 11, 2, 1, R.beige[4]);
    p.rect(5, 8, 5, 3, R.red[4]);
    p.outline('#1a1220');
    p.quantize();
  });

  // =====================================================================
  // Layout (meters; the player stands at the origin facing -z)
  // =====================================================================
  const H = Math.PI / 2;
  card(floor, 6, 6.2, [0, 0, -1.9], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 6, 6.2, [0, 3.2, -1.9], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(wall, 6, 3.2, [0, 1.6, -5], { order: -1, segs: 2, spot: 'hatch', region: [0.28, 0, 0.72, 0.79] });
  card(wall, 6, 3.2, [0, 1.6, 1.2], { rot: [0, Math.PI, 0], order: -1, segs: 2, spot: 'reardoor', region: [0.28, 0, 0.72, 0.79] });
  card(side, 6.2, 3.2, [-3, 1.6, -1.9], { rot: [0, H, 0], order: -1, segs: 2, spot: 'alcoves', region: [0, 0.1, 1, 0.82] });
  card(side, 6.2, 3.2, [3, 1.6, -1.9], { rot: [0, -H, 0], order: -1, segs: 2, spot: 'alcoves', region: [0, 0.1, 1, 0.82] });

  card(papers, 0.6, 0.6, [0.45, 0.01, -0.95], { rot: [-H, 0, 0.3], order: -0.5, spot: 'papers' });
  card(beam, 1.3, 3.0, [-1.5, 1.6, -2.05], { face: [0, 1.6, 0], noHit: true });
  card(beam, 1.3, 3.0, [1.5, 1.6, -2.05], { face: [0, 1.6, 0], noHit: true });

  for (const [x, z] of [[-1.7, -1.4], [-1.7, -3.2], [1.7, -1.4], [1.7, -3.2]]) {
    card(podClosed, 0.9, 1.8, [x, 0.9, z], { face: [0, 0.9, 0], spot: 'pod' });
  }
  card(podOpen, 0.9, 1.8, [0, 0.9, 0.8], { face: [0, 0.9, 0], spot: 'mypod' }); // Gus's pod, behind you
  card(mop, 0.42, 1.0, [0.65, 0.5, 0.7], { face: [0, 0.5, 0], spot: 'mop' });

  card(desk, 0.6, 0.9, [-0.8, 0.45, -1.1], { face: [0, 0.45, 0], spot: 'terminal' });
  card(crt, 0.5, 0.375, [-0.8, 1.09, -1.08], { face: [0, 1.09, 0], spot: 'terminal' });
  card(mug, 0.1, 0.1, [-0.58, 0.95, -1.0], { face: [0, 0.95, 0], spot: 'mug' });
  card(suit, 0.75, 1.5, [2.45, 1.0, -2.3], { face: [0, 1.0, 0], spot: 'suit' });
  card(cables, 0.35, 1.75, [-2.75, 2.3, -0.55], { face: [0, 2.3, 0], spot: 'cables' });
  card(pipe, 4.5, 0.28, [0, 2.75, -1.3], { noHit: true });
  const mistCard = card(mist, 6, 0.6, [0, 0.3, -3.6], { noHit: true });
  const steamCard = card(steam, 0.4, 0.8, [-2.4, 0.45, -4.5], { face: [0, 0.45, 0], noHit: true });
  const eye = card(eyeTex, 0.4, 0.4, [0, 2.7, -3.4], { face: [0, 1.6, 0], spot: 'doris' });
  const beaconCard = card(beacon, 0.22, 0.22, [0.85, 2.62, -4.85], { noHit: true });
  card(sign, 1.2, 0.3, [0, 2.78, -4.9], { spot: 'sign' });
  card(crate, 0.9, 0.9, [-2.2, 0.45, -4.2], { face: [0, 0.45, 0], spot: 'crate' });
  card(crate, 0.9, 0.9, [2.3, 0.45, -4.4], { face: [0, 0.45, 0], spot: 'crate' });

  if (quads > MAX_QUADS) console.warn(`[VERTEX] ${quads} quads exceeds the ${MAX_QUADS} budget`);
  else console.info(`[VERTEX] ${quads}/${MAX_QUADS} quads`);

  let t = 0;
  return {
    name: 'CRYO BAY',
    quads,
    hitMeshes,
    fog: [3, 9],
    update(dt) {
      t += dt;
      const scroll = Math.floor(t / 1.2);
      const cursor = Math.floor(t * 2) % 2 === 0;
      if (scroll !== crtState.scroll || cursor !== crtState.cursor) {
        crtState.scroll = scroll;
        crtState.cursor = cursor;
        crt.userData.redraw();
      }
      mistCard.material.uniforms.uUvOffset.value.x = (t * 0.03) % 1;
      steamCard.material.uniforms.uUvOffset.value.y = (-t * 0.25) % 1;
      eye.material.uniforms.uTint.value = 0.8 + 0.3 * Math.sin(t * 2.2);
      beaconCard.material.uniforms.uTint.value = Math.floor(t * 2.5) % 2 ? 1.25 : 0.55;
    },
  };
}
