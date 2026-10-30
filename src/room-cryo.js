// Cryo Bay 3 — placeholder room for the VERTEX test.
// Every card is generated 16-bit-style pixel art, stood up at a real depth
// around the player's spot (the origin). Swap in hand-drawn art later;
// positions and sizes can stay.

import * as THREE from 'three';
import { cardMaterial, settings, FOG, MAX_QUADS } from './vertex.js?v=8';
import { pixelTexture, RAMPS as R } from './pixelart.js?v=8';

export function buildCryoBay(scene) {
  scene.background = FOG;
  let quads = 0;

  const card = (tex, w, h, pos, { rot, face, order = 0, segs = 1, counted = true, tint = 1 } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, segs, segs), cardMaterial(tex, { tint }));
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (face) m.lookAt(face[0], face[1], face[2]);
    m.renderOrder = order; // structure (-1) is always drawn before props (0)
    if (counted) {
      m.userData.card = true;
      quads += segs * segs;
    }
    scene.add(m);
    return m;
  };

  // ---------- back / rear wall: the big hatch ----------
  const wall = pixelTexture(256, 144, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.steel, 3.6, 1.3);
    for (let r = 0; r < 4; r++) {
      const y0 = r * 36;
      if (r > 0) {
        p.rect(0, y0, w, 1, R.steel[0]);
        p.rect(0, y0 + 1, w, 1, R.steel[5]);
      }
      for (let x = (r % 2) * 32; x < w; x += 64) {
        p.rect(x, y0 + 2, 1, 34, R.steel[0]);
        p.rect(x + 1, y0 + 2, 1, 34, R.steel[4]);
        p.rivet(x + 4, y0 + 5, R.steel);
        p.rivet(x + 4, y0 + 30, R.steel);
        p.rivet(x - 6, y0 + 5, R.steel);
        p.rivet(x - 6, y0 + 30, R.steel);
      }
    }
    // Warning light strip
    p.rect(0, 8, w, 5, R.red[1]);
    p.rect(0, 9, w, 3, R.red[4]);
    p.rect(0, 10, w, 1, R.red[6]);
    for (let x = 16; x < w; x += 32) p.glow(x, 10, 8, R.red, 4.5);
    // Pipes on the left
    p.vcyl(14, 16, 10, 128, R.steel, 1, 6.5);
    p.vcyl(28, 16, 7, 128, R.rust, 1, 5.5);
    for (let y = 30; y < h; y += 40) p.bevel(11, y, 26, 6, R.dark, 4);
    // Hatch frame and hazard band
    p.bevel(72, 34, 112, 110, R.steel, 4);
    p.stripes(76, 38, 104, 10, R.hazard[5], R.black[2], 8);
    p.rect(76, 48, 104, 1, R.black[1]);
    p.inset(80, 52, 96, 92, R.dark, 3);
    // Door leaves with ribs and port windows
    for (const lx of [82, 129]) {
      p.bevel(lx, 54, 45, 90, R.steel, 3);
      for (let y = 64; y < 140; y += 14) {
        p.rect(lx + 4, y, 37, 1, R.steel[1]);
        p.rect(lx + 4, y + 1, 37, 1, R.steel[5]);
      }
      p.inset(lx + 13, 70, 19, 13, R.dark, 1);
      p.vgrad(lx + 14, 71, 17, 11, R.cryo, 4, 1.5);
      p.rect(lx + 15, 72, 1, 6, R.cryo[7]);
    }
    p.rect(127, 54, 2, 90, R.black[0]);
    // Status panel
    p.inset(192, 66, 24, 34, R.dark, 1);
    for (let i = 0; i < 3; i++) {
      p.rect(197, 71 + i * 9, 4, 3, i === 2 ? R.red[5] : R.phosphor[6]);
      p.rect(204, 72 + i * 9, 8, 1, R.dark[5]);
    }
    p.glow(199, 90, 4, R.red, 3);
    // Grime
    p.noise(0, h - 24, w, 24, R.dark[1], 0.12);
    p.rect(0, h - 3, w, 3, R.dark[1]);
  }, { seed: 3 });

  // ---------- side walls: rows of occupied cryo alcoves ----------
  const side = pixelTexture(256, 128, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.steel, 3.2, 1.5);
    p.hcyl(0, 3, w, 12, R.steel, 1, 6.5);
    for (let x = 10; x < w; x += 48) p.bevel(x, 1, 6, 16, R.dark, 4);
    for (let i = 0; i < 4; i++) {
      const x0 = 12 + i * 60;
      p.bevel(x0 - 3, 21, 54, 94, R.steel, 4);
      p.inset(x0, 24, 48, 88, R.dark, 1);
      p.vgrad(x0 + 3, 27, 42, 70, R.cryo, 5, 1.5);
      // sleeper silhouette
      p.rect(x0 + 18, 34, 12, 13, R.cryo[2]);
      p.rect(x0 + 20, 32, 8, 2, R.cryo[2]);
      p.rect(x0 + 12, 50, 24, 47, R.cryo[2]);
      p.rect(x0 + 21, 47, 6, 3, R.cryo[2]);
      p.noise(x0 + 3, 27, 42, 70, R.cryo[7], 0.04);
      p.noise(x0 + 3, 82, 42, 15, R.cryo[6], 0.25);
      p.rect(x0 + 6, 30, 2, 48, R.cryo[7]);
      p.rect(x0 + 9, 30, 1, 24, R.cryo[6]);
      // label plate + LED
      p.bevel(x0 + 6, 100, 30, 10, R.beige, 4);
      p.text(`C-0${i + 1}`, x0 + 9, 101, R.black[0], 7);
      p.glow(x0 + 42, 105, 4, R.phosphor, 4);
      p.px(x0 + 42, 105, R.phosphor[7]);
    }
    p.stripes(0, 117, w, 6, R.hazard[5], R.black[2], 8);
    p.rect(0, 123, w, 5, R.dark[1]);
    p.noise(0, 100, w, 28, R.dark[1], 0.08);
  }, { seed: 5 });

  // ---------- floor: tread plates and a hazard walkway ----------
  const floor = pixelTexture(128, 128, (p, w, h) => {
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const x = i * 32, y = j * 32;
        p.bevel(x, y, 32, 32, R.dark, 4);
        for (let yy = 5, row = 0; yy < 28; yy += 5, row++)
          for (let xx = 4 + (row % 2) * 3; xx < 27; xx += 6) {
            p.px(x + xx, y + yy, R.dark[6]);
            p.px(x + xx + 1, y + yy + 1, R.dark[2]);
          }
        p.rivet(x + 2, y + 2, R.steel);
        p.rivet(x + 28, y + 2, R.steel);
        p.rivet(x + 2, y + 28, R.steel);
        p.rivet(x + 28, y + 28, R.steel);
      }
    p.stripes(56, 0, 16, h, R.hazard[4], R.black[2], 8);
    p.rect(55, 0, 1, h, R.black[0]);
    p.rect(72, 0, 1, h, R.black[0]);
    p.noise(0, 0, w, h, R.dark[0], 0.05);
  }, { seed: 7 });

  // ---------- ceiling: pipes and light panels ----------
  const ceiling = pixelTexture(128, 128, (p, w, h) => {
    p.vgrad(0, 0, w, h, R.dark, 2.5, 1);
    p.hcyl(0, 8, w, 10, R.steel, 1, 6);
    p.hcyl(0, 20, w, 6, R.rust, 1, 5);
    p.hcyl(0, 104, w, 8, R.steel, 1, 5.5);
    for (const x of [12, 76]) {
      p.bevel(x - 2, 44, 44, 26, R.steel, 3);
      p.vgrad(x, 46, 40, 22, R.beige, 7, 5.5);
    }
    for (let y = 78; y < 96; y += 3) p.rect(20, y, 88, 1, R.black[1]);
  }, { seed: 9 });

  // ---------- cryo pods ----------
  const pod = (open) =>
    pixelTexture(64, 128, (p) => {
      p.vcyl(6, 8, 52, 104, R.steel, 1.2, 6.4);
      for (let j = 0; j < 14; j++) {
        const hw = 26 * Math.sqrt(1 - Math.pow((14 - j) / 14, 2));
        p.clear(6, 8 + j, Math.floor(26 - hw), 1);
        const right = Math.ceil(32 + hw);
        p.clear(right, 8 + j, 58 - right, 1);
      }
      p.inset(13, 19, 38, 66, R.dark, 1);
      if (open) {
        p.vgrad(14, 20, 36, 64, R.dark, 0.5, 2.5);
        p.noise(14, 20, 36, 64, R.cryo[2], 0.05);
        p.noise(14, 70, 36, 14, R.cryo[3], 0.2);
      } else {
        p.vgrad(14, 20, 36, 64, R.cryo, 5.6, 2.4);
        p.rect(26, 30, 12, 14, R.cryo[3]);
        p.rect(28, 28, 8, 2, R.cryo[3]);
        p.rect(20, 47, 24, 37, R.cryo[3]);
        p.rect(29, 44, 6, 3, R.cryo[3]);
        p.noise(14, 20, 36, 64, R.cryo[7], 0.06);
        p.noise(14, 68, 36, 16, R.cryo[6], 0.3);
        p.rect(17, 22, 2, 58, R.cryo[7]);
        p.rect(20, 22, 1, 30, R.cryo[6]);
      }
      p.bevel(20, 88, 24, 9, R.beige, 4);
      p.text(open ? 'PELL' : 'CRYO', 23, 89, R.black[0], 7);
      p.rect(28, 100, 8, 4, open ? R.red[5] : R.phosphor[6]);
      p.glow(32, 102, 5, open ? R.red : R.phosphor, 3.5);
      p.bevel(4, 108, 56, 20, R.dark, 4);
      for (let x = 10; x < 55; x += 4) p.rect(x, 113, 2, 9, R.black[1]);
    }, { seed: open ? 11 : 13 });
  const podClosed = pod(false);
  const podOpen = pod(true);

  // ---------- DORIS terminal (animated) ----------
  const crtLines = ['DORIS 3.1', 'CREW  0/212', 'ELAPSED', '400Y 2M 11D', 'NAV: LOCKED', 'MURDER? YES', 'SNACK? NO', '- - - - - -'];
  const crtState = { scroll: 0, cursor: true };
  const crt = pixelTexture(96, 72, (p) => {
    p.bevel(0, 0, 96, 64, R.beige, 4);
    p.inset(5, 4, 86, 52, R.black, 1);
    p.rect(8, 7, 80, 46, R.phosphor[1]);
    for (let i = 0; i < 5; i++) p.text(crtLines[(crtState.scroll + i) % crtLines.length], 10, 8 + i * 9, R.phosphor[6], 8);
    if (crtState.cursor) p.rect(80, 44, 4, 7, R.phosphor[6]);
    for (let y = 8; y < 53; y += 2) p.rect(8, y, 80, 1, 'rgba(0,0,0,0.28)');
    p.bevel(68, 57, 7, 5, R.dark, 4);
    p.bevel(79, 57, 7, 5, R.dark, 4);
    p.px(10, 59, R.red[6]);
    p.bevel(34, 64, 28, 8, R.beige, 3);
  }, { seed: 15 });

  const desk = pixelTexture(64, 96, (p) => {
    p.vgrad(4, 10, 56, 86, R.steel, 4.2, 2);
    p.rect(4, 10, 1, 86, R.steel[1]);
    p.rect(59, 10, 1, 86, R.steel[1]);
    p.bevel(0, 0, 64, 10, R.steel, 5);
    p.inset(6, 2, 52, 6, R.dark, 2);
    for (let x = 8; x < 56; x += 3) {
      p.px(x, 3, R.beige[5]);
      p.px(x + 1, 5, R.beige[4]);
    }
    for (const y of [18, 42, 66]) {
      p.bevel(10, y, 44, 20, R.steel, 4);
      p.rect(26, y + 8, 12, 2, R.dark[1]);
      p.rect(26, y + 8, 12, 1, R.steel[6]);
    }
    p.rect(4, 89, 56, 7, R.dark[1]);
  }, { seed: 17 });

  const pipe = pixelTexture(256, 16, (p, w) => {
    p.hcyl(0, 3, w, 10, R.steel, 1, 6.5);
    p.noise(0, 4, w, 8, R.rust[4], 0.03);
    for (let x = 0; x < w; x += 64) {
      p.bevel(x + 4, 0, 9, 16, R.dark, 4);
      p.rivet(x + 7, 2, R.steel);
    }
  }, { seed: 19 });

  const cable = pixelTexture(12, 96, (p) => {
    for (let y = 0; y < 86; y++) {
      const cx = 6 + Math.round(Math.sin(y / 9) * 2);
      p.px(cx - 1, y, R.dark[5]);
      p.px(cx, y, R.dark[3]);
      p.px(cx + 1, y, R.dark[1]);
    }
    p.bevel(2, 84, 8, 12, R.red, 4);
  });

  const mist = pixelTexture(128, 32, (p, w, h) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const dens = Math.pow(j / h, 1.4) * 0.8 + Math.sin(i * 0.12 + j * 0.35) * 0.15;
        if (p.rand() < dens) p.px(i, j, p.rand() < 0.5 ? R.cryo[6] : R.cryo[7]);
      }
  }, { repeatX: true, seed: 21 });

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
  });

  const sign = pixelTexture(96, 24, (p) => {
    p.bevel(0, 0, 96, 24, R.hazard, 5);
    p.inset(4, 4, 88, 16, R.hazard, 4);
    p.text('CRYO BAY 3', 12, 6, R.black[0], 11);
    p.rivet(1, 1, R.steel);
    p.rivet(93, 1, R.steel);
    p.rivet(1, 21, R.steel);
    p.rivet(93, 21, R.steel);
  });

  const crate = pixelTexture(48, 48, (p) => {
    p.bevel(0, 0, 48, 48, R.rust, 4);
    p.inset(5, 5, 38, 38, R.rust, 3);
    p.bevel(5, 21, 38, 7, R.rust, 5);
    for (const [x, y] of [[0, 0], [40, 0], [0, 40], [40, 40]]) p.bevel(x, y, 8, 8, R.steel, 4);
    p.text('ORE', 14, 8, R.rust[1], 10);
    p.noise(5, 5, 38, 38, R.rust[2], 0.06);
  }, { seed: 23 });

  // ---------- layout (meters; the player stands at the origin facing -z) ----------
  const H = Math.PI / 2;
  card(floor, 6, 6.2, [0, 0, -1.9], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 6, 6.2, [0, 3.2, -1.9], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(wall, 6, 3.2, [0, 1.6, -5], { order: -1, segs: 2 });
  card(wall, 6, 3.2, [0, 1.6, 1.2], { rot: [0, Math.PI, 0], order: -1, segs: 2 });
  card(side, 6.2, 3.2, [-3, 1.6, -1.9], { rot: [0, H, 0], order: -1, segs: 2 });
  card(side, 6.2, 3.2, [3, 1.6, -1.9], { rot: [0, -H, 0], order: -1, segs: 2 });

  for (const [x, z] of [[-1.7, -1.4], [-1.7, -3.2], [1.7, -1.4], [1.7, -3.2]]) {
    card(podClosed, 0.9, 1.8, [x, 0.9, z], { face: [0, 0.9, 0] });
  }
  card(podOpen, 0.9, 1.8, [0, 0.9, 0.8], { face: [0, 0.9, 0] }); // Gus's pod, behind you

  card(desk, 0.6, 0.9, [-0.8, 0.45, -1.1], { face: [0, 0.45, 0] });
  card(crt, 0.5, 0.375, [-0.8, 1.09, -1.08], { face: [0, 1.09, 0] });
  card(pipe, 4.5, 0.28, [0, 2.75, -1.3]);
  card(cable, 0.11, 0.9, [0.7, 2.35, -0.9]);
  const mistCard = card(mist, 6, 0.6, [0, 0.3, -3.6]);
  const eye = card(eyeTex, 0.4, 0.4, [0, 2.7, -3.4], { face: [0, 1.6, 0] });
  card(sign, 1.2, 0.3, [0, 2.78, -4.9]);
  card(crate, 0.9, 0.9, [-2.2, 0.45, -4.2], { face: [0, 0.45, 0] });
  card(crate, 0.9, 0.9, [2.3, 0.45, -4.4], { face: [0, 0.45, 0] });

  // ---------- debug HUD (not counted against the budget) ----------
  const hud = pixelTexture(128, 48, (p, w, h) => {
    p.rect(0, 0, w, h, R.black[1]);
    p.rect(0, 0, w, 1, R.steel[4]);
    p.text(`B8  ${settings.comfort ? 'COMFORT' : 'AUTHENTIC'}`, 3, 2, settings.comfort ? R.cryo[6] : R.hazard[6], 8);
    p.text(`QUADS ${quads}/${MAX_QUADS}`, 3, 13, quads > MAX_QUADS ? R.red[6] : R.phosphor[6], 8);
    const items = [['LO', settings.lowres], ['PAL', settings.palette], ['SNP', settings.snap], ['AFF', settings.affine], ['20F', settings.steppedAnim]];
    let x = 3;
    for (const [s, on] of items) {
      p.text(s, x, 24, on ? R.phosphor[6] : R.dark[5], 8);
      x += s.length * 5 + 5;
    }
    p.text('STICK=MODE GRIP=CTR', 3, 35, R.steel[5], 8);
  });
  card(hud, 0.4, 0.15, [-0.42, 1.05, -0.75], { face: [0, 1.6, 0], counted: false });

  if (quads > MAX_QUADS) console.warn(`[VERTEX] ${quads} quads exceeds the ${MAX_QUADS} budget`);
  else console.info(`[VERTEX] ${quads}/${MAX_QUADS} quads`);

  let t = 0;
  return {
    quads,
    refreshHud: () => hud.userData.redraw(),
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
      eye.material.uniforms.uTint.value = 0.8 + 0.3 * Math.sin(t * 2.2);
    },
  };
}
