// "Talkers" in the King's Quest VI tradition: a large portrait in its own
// ornate frame that lip-flaps and blinks while the character speaks.
//
// Each speaker has one base painting (frame, shading, light) plus small
// eye and mouth overlays. Every eye x mouth combination is pre-composed
// into its own texture at load, so animating is just swapping textures.
//
// eyes:   0 open, 1 half, 2 closed
// mouths: 0 closed, 1 small, 2 open, 3 round ("oo")

import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=30';

const W = 112, H = 128; // portrait + frame
const OX = 8, OY = 8; // painting origin inside the frame
const at = (ramp, i) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(i)))];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dither = (f, x, y) => (f - Math.floor(f)) * 16 > BAYER[y & 3][x & 3] ? Math.floor(f) + 1 : Math.floor(f);

// Shade an ellipsoid pixel by pixel (light from the upper left), 16-bit
// painted style. shape(x, y) can narrow the outline (e.g. a jaw).
function ellipsoid(p, cx, cy, rx, ry, ramp, { lo = 1.2, hi = 6.6, shape = null } = {}) {
  const L = [-0.55, -0.6, 0.58];
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const k = shape ? shape(x, y) : 1;
      const nx = (x - cx) / (rx * k), ny = (y - cy) / ry;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      const d = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      p.px(x, y, at(ramp, dither(lo + (hi - lo) * d, x, y)));
    }
}

function frame(p) {
  p.bevel(0, 0, W, H, R.hazard, 4);
  p.rect(2, 2, W - 4, 1, R.hazard[7]);
  p.inset(5, 5, W - 10, H - 10, R.hazard, 2);
  for (const [x, y] of [[2, 2], [W - 5, 2], [2, H - 5], [W - 5, H - 5]]) {
    p.disc(x + 1, y + 1, 2, R.hazard[6]);
    p.px(x, y, R.hazard[7]);
  }
  // little scrollwork on the frame's top and bottom
  for (const y of [3, H - 4]) for (let x = 20; x < W - 20; x += 6) p.px(x, y, R.hazard[2]);
}

// =====================================================================
// GUS PELL
// =====================================================================
const GUS = { cx: OX + 48, cy: OY + 50 };
function gusBase(p) {
  const { cx, cy } = GUS;
  p.vgrad(OX, OY, 96, 112, R.cryo, 2.4, 0.4);
  p.noise(OX, OY, 96, 112, R.cryo[3], 0.03);
  // Jumpsuit shoulders with a reflective stripe and name patch
  for (let y = OY + 84; y < OY + 112; y++) {
    const hw = 26 + (y - OY - 84) * 1.3;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x - (cx - hw)) / (2 * hw);
      p.px(x, y, at(R.steel, dither(1.6 + 3.6 * Math.sin(Math.PI * Math.min(1, u * 1.2)), x, y)));
    }
  }
  p.rect(cx - 40, OY + 102, 80, 3, R.hazard[6]);
  p.rect(cx - 40, OY + 103, 80, 1, R.hazard[4]);
  p.bevel(cx + 10, OY + 90, 22, 9, R.beige, 5);
  p.text('PELL', cx + 12, OY + 91, R.dark[0], 6);
  // neck and collar
  ellipsoid(p, cx, OY + 82, 11, 10, R.skin, { lo: 1, hi: 4.6 });
  for (let k = 0; k < 9; k++) {
    p.px(cx - 16 + k, OY + 84 + k, R.steel[6]);
    p.px(cx + 16 - k, OY + 84 + k, R.steel[6]);
  }
  // ears
  ellipsoid(p, cx - 21, cy + 2, 4, 7, R.skin, { lo: 1.4, hi: 5.6 });
  ellipsoid(p, cx + 21, cy + 2, 4, 7, R.skin, { lo: 1, hi: 4.4 });
  // head with a narrowing jaw
  ellipsoid(p, cx, cy, 21, 28, R.skin, {
    shape: (x, y) => (y > cy ? 1 - 0.32 * Math.pow((y - cy) / 28, 2) : 1),
  });
  // stubble on the jaw
  for (let y = cy + 8; y < cy + 28; y++)
    for (let x = cx - 18; x <= cx + 18; x++)
      if ((x + y) % 2 === 0 && p.rand() < 0.35) {
        const nx = (x - cx) / (21 * (1 - 0.32 * Math.pow((y - cy) / 28, 2))), ny = (y - cy) / 28;
        if (nx * nx + ny * ny < 0.92) p.px(x, y, R.skin[2]);
      }
  // nose
  p.line(cx + 1, cy - 2, cx + 3, cy + 8, R.skin[3]);
  p.px(cx - 1, cy + 4, R.skin[6]);
  p.rect(cx - 2, cy + 9, 6, 1, R.skin[2]);
  p.px(cx - 2, cy + 8, R.skin[2]);
  p.px(cx + 4, cy + 8, R.skin[2]);
  // eye sockets and tired bags
  for (const ex of [cx - 9, cx + 9]) {
    p.rect(ex - 4, cy - 6, 9, 1, R.skin[3]);
    p.line(ex - 3, cy + 1, ex + 3, cy + 1, R.skin[3]);
  }
  // eyebrows, slightly worried
  p.line(cx - 15, cy - 9, cx - 5, cy - 11, R.rust[1]);
  p.line(cx - 15, cy - 10, cx - 5, cy - 12, R.rust[1]);
  p.line(cx + 5, cy - 11, cx + 15, cy - 9, R.rust[1]);
  p.line(cx + 5, cy - 12, cx + 15, cy - 10, R.rust[1]);
  // messy hair, with frost still in it
  for (let y = cy - 34; y < cy - 6; y++)
    for (let x = cx - 26; x <= cx + 26; x++) {
      const nx = (x - cx) / 25, ny = (y - (cy - 14)) / 20;
      const spikes = Math.sin(x * 0.9) * 0.08 + Math.sin(x * 0.37) * 0.06;
      if (nx * nx + ny * ny > 1 + spikes) continue;
      if (y > cy - 12 && Math.abs(x - cx) < 15 && (x + y) % 3) continue; // forehead peeks through
      const shade = 1 + 3.2 * Math.max(0, -(nx * 0.6 + ny * 0.7)) + (p.rand() < 0.2 ? 1 : 0);
      p.px(x, y, at(R.rust, dither(shade, x, y)));
    }
  for (let k = 0; k < 5; k++) p.line(cx - 10 + k * 5, cy - 14, cx - 12 + k * 5, cy - 8, R.rust[1]);
  p.noise(cx - 25, cy - 34, 50, 26, R.cryo[7], 0.04);
  p.noise(cx - 40, OY + 84, 80, 10, R.cryo[7], 0.05);
  // light: cold rim light from the pods, warm fill
  p.light(cx + 30, cy, 34, LIGHT.cyan, 0.32);
  p.light(cx - 30, cy - 20, 40, LIGHT.warm, 0.15);
  frame(p);
  p.quantize();
}
function gusEyes(p, e) {
  const { cx, cy } = GUS;
  for (const ex of [cx - 9, cx + 9]) {
    const y = cy - 4;
    if (e === 2) {
      p.rect(ex - 4, y, 9, 4, R.skin[4]);
      p.line(ex - 4, y + 1, ex + 4, y + 2, R.skin[1]);
      continue;
    }
    p.rect(ex - 4, y - 1, 9, 4, R.beige[7]);
    p.rect(ex - 1, y - 1, 3, 4, R.rust[2]);
    p.px(ex, y, R.black[0]);
    p.px(ex - 1, y - 1, R.beige[7]);
    p.rect(ex - 4, y - 2, 9, 1, R.skin[1]);
    if (e === 1) p.rect(ex - 4, y - 1, 9, 2, R.skin[4]);
  }
}
function gusMouth(p, m) {
  const { cx, cy } = GUS;
  const y = cy + 15;
  p.rect(cx - 6, y - 2, 13, 7, R.skin[4]);
  if (m === 0) {
    p.line(cx - 5, y + 1, cx + 5, y, R.skin[1]);
    p.px(cx - 6, y + 2, R.skin[2]);
  } else if (m === 1) {
    p.rect(cx - 3, y, 7, 2, R.red[1]);
    p.rect(cx - 3, y + 2, 7, 1, R.skin[3]);
  } else if (m === 2) {
    p.rect(cx - 4, y - 1, 9, 5, R.red[1]);
    p.rect(cx - 3, y - 1, 7, 1, R.beige[6]);
    p.rect(cx - 2, y + 3, 5, 1, R.red[3]);
    p.rect(cx - 4, y + 4, 9, 1, R.skin[3]);
  } else {
    p.rect(cx - 2, y - 1, 5, 5, R.red[1]);
    p.rect(cx - 1, y - 2, 3, 7, R.red[1]);
    p.rect(cx - 2, y + 4, 5, 1, R.skin[3]);
  }
}

// =====================================================================
// DORIS
// =====================================================================
const DOR = { cx: OX + 48, cy: OY + 46 };
function dorisBase(p) {
  const { cx, cy } = DOR;
  p.vgrad(OX, OY, 96, 112, R.red, 1.3, 0.2);
  for (let y = OY; y < OY + 112; y += 6) p.rect(OX, y, 96, 1, R.red[1]);
  // cables
  p.vcyl(OX + 6, OY, 6, 112, R.dark, 1, 5);
  p.vcyl(OX + 84, OY, 6, 112, R.dark, 1, 5);
  // housing: big shaded sphere, inner bezel
  ellipsoid(p, cx, cy, 36, 36, R.steel, { lo: 0.8, hi: 6.8 });
  ellipsoid(p, cx, cy, 25, 25, R.dark, { lo: 0.4, hi: 3.6 });
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2;
    p.rivet(Math.round(cx + Math.cos(t) * 31), Math.round(cy + Math.sin(t) * 31), R.steel);
  }
  // speaker grille below
  p.bevel(cx - 26, OY + 88, 52, 20, R.steel, 3);
  p.inset(cx - 23, OY + 91, 46, 14, R.black, 1);
  p.light(cx, cy, 50, LIGHT.red, 0.3);
  frame(p);
  p.quantize();
}
function dorisEyes(p, e, m) {
  const { cx, cy } = DOR;
  // the lens: brighter and wider when she talks
  const glow = [0, 0.6, 1.2, 0.9][m];
  const pupil = [7, 6, 4, 5][m];
  for (let y = cy - 21; y <= cy + 21; y++)
    for (let x = cx - 21; x <= cx + 21; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > 21) continue;
      if (d < pupil) p.px(x, y, R.black[0]);
      else p.px(x, y, at(R.red, dither(Math.min(7, 7.4 + glow - d * 0.3), x, y)));
    }
  for (let a = 0; a < 6; a++) {
    const t = (a / 6) * Math.PI * 2 + 0.3;
    p.line(cx + Math.cos(t) * pupil, cy + Math.sin(t) * pupil, cx + Math.cos(t + 0.9) * 13, cy + Math.sin(t + 0.9) * 13, R.red[2]);
  }
  p.rect(cx - 11, cy - 12, 4, 3, R.red[7]);
  p.px(cx - 12, cy - 9, R.red[7]);
  // shutter eyelids
  if (e > 0) {
    const cover = e === 1 ? 14 : 23;
    p.rect(cx - 23, cy - 23, 47, cover, R.steel[4]);
    p.rect(cx - 23, cy - 23 + cover - 1, 47, 1, R.steel[1]);
    if (e === 2) {
      p.rect(cx - 23, cy, 47, 23, R.steel[3]);
      p.rect(cx - 23, cy, 47, 1, R.dark[0]);
    }
  }
}
function dorisMouth(p, m) {
  const { cx } = DOR;
  const heights = [[1, 1, 1, 1, 1, 1, 1], [2, 4, 3, 5, 3, 4, 2], [5, 9, 7, 11, 8, 10, 6], [3, 6, 9, 11, 9, 6, 3]][m];
  heights.forEach((hgt, i) => {
    const x = cx - 20 + i * 6;
    for (let k = 0; k < hgt; k++) p.rect(x, OY + 103 - k, 4, 1, k > 8 ? R.hazard[6] : R.red[k > 4 ? 6 : 5]);
  });
}

// =====================================================================
// VENDO-9
// =====================================================================
const VEN = { cx: OX + 48, cy: OY + 54 };
function vendoBase(p) {
  const { cx } = VEN;
  p.vgrad(OX, OY, 96, 112, R.suit, 4.6, 2.2);
  for (let x = OX; x < OX + 96; x += 12) p.rect(x, OY + 100, 1, 12, R.suit[2]);
  p.bevel(OX + 4, OY + 4, 88, 16, R.red, 4);
  p.text('VENDO-9', OX + 20, OY + 7, R.beige[7], 10);
  p.bevel(OX + 6, OY + 24, 84, 66, R.steel, 4);
  p.inset(OX + 10, OY + 28, 76, 58, R.black, 1);
  p.vgrad(OX + 11, OY + 29, 74, 56, R.cryo, 5, 3);
  for (let i = 0; i < 6; i++) p.bevel(OX + 8 + i * 14, OY + 94, 10, 6, i === 2 ? R.beige : R.dark, i === 2 ? 6 : 4);
  p.light(cx, OY + 56, 46, LIGHT.cyan, 0.25);
  frame(p);
  p.quantize();
}
function vendoEyes(p, e) {
  const { cx, cy } = VEN;
  for (const ex of [cx - 16, cx + 12]) {
    if (e === 2) p.rect(ex, cy - 8, 8, 2, R.dark[0]);
    else if (e === 1) p.rect(ex, cy - 9, 8, 4, R.dark[0]);
    else {
      p.rect(ex, cy - 14, 8, 10, R.dark[0]);
      p.rect(ex + 1, cy - 13, 2, 2, R.cryo[7]);
    }
  }
}
function vendoMouth(p, m) {
  const { cx, cy } = VEN;
  const y = cy + 10;
  if (m === 0) {
    p.rect(cx - 16, y, 32, 3, R.dark[0]);
    p.rect(cx - 19, y - 3, 3, 3, R.dark[0]);
    p.rect(cx + 16, y - 3, 3, 3, R.dark[0]);
  } else if (m === 1) p.rect(cx - 12, y - 2, 24, 6, R.dark[0]);
  else if (m === 2) {
    p.rect(cx - 14, y - 5, 28, 12, R.dark[0]);
    p.rect(cx - 10, y + 3, 20, 3, R.red[4]);
  } else p.rect(cx - 6, y - 5, 12, 12, R.dark[0]);
}

// =====================================================================
// POCKETS: hamster-person, vain, smug, cheeks full of treasure
// =====================================================================
const POC = { cx: OX + 48, cy: OY + 50 };
function pocketsBase(p) {
  const { cx, cy } = POC;
  p.vgrad(OX, OY, 96, 112, R.phosphor, 3.6, 1.2);
  for (let k = 0; k < 46; k++) {
    const x = OX + 3 + Math.floor(p.rand() * 90), y = OY + 3 + Math.floor(p.rand() * 70);
    p.disc(x, y, 2, R.phosphor[2 + Math.floor(p.rand() * 4)]);
  }
  // tablecloth cape (red check), worn with dignity
  for (let y = OY + 84; y < OY + 112; y++) {
    const hw = 30 + (y - OY - 84) * 1.2;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
      const u = (x - (cx - hw)) / (2 * hw);
      const check = (Math.floor((x - OX) / 5) + Math.floor((y - OY) / 5)) % 2;
      p.px(x, y, at(R.red, dither(2 + 3 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + check * 1.2, x, y)));
    }
  }
  // ears
  for (const [ex, k] of [[cx - 22, 1], [cx + 22, 0]]) {
    ellipsoid(p, ex, cy - 22, 9, 9, R.hazard, { lo: 1.4 + k * 0.6, hi: 5.6 + k * 0.6 });
    ellipsoid(p, ex, cy - 21, 5, 5, R.red, { lo: 4.6, hi: 6.6 });
  }
  // big round head, puffed cheek pouches, white muzzle
  ellipsoid(p, cx, cy, 30, 27, R.hazard, { lo: 1.4, hi: 6.2 });
  ellipsoid(p, cx - 21, cy + 9, 14, 12, R.hazard, { lo: 2, hi: 6.6 });
  ellipsoid(p, cx + 21, cy + 9, 14, 12, R.hazard, { lo: 1.4, hi: 5.4 });
  ellipsoid(p, cx, cy + 11, 15, 12, R.beige, { lo: 4, hi: 7.4 });
  // fluffy fur tufts round the edge
  for (let k = 0; k < 70; k++) {
    const t = (k / 70) * Math.PI * 2;
    const r = 27 + (k % 3);
    p.line(cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.95, cx + Math.cos(t) * (r + 3), cy + Math.sin(t) * (r + 3) * 0.95, R.hazard[k % 2 ? 5 : 3]);
  }
  // whiskers and nose
  for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) p.line(cx + sgn * 9, cy + 9 + k * 2, cx + sgn * 27, cy + 4 + k * 4, R.beige[7]);
  p.rect(cx - 2, cy + 3, 5, 3, R.red[5]);
  p.px(cx - 1, cy + 3, R.red[7]);
  // bottle-cap crown, slightly askew, and a bottle-cap medallion
  p.bevel(cx + 4, cy - 31, 16, 6, R.hazard, 6);
  for (let k = 0; k < 4; k++) p.rect(cx + 5 + k * 4, cy - 34, 2, 3, R.hazard[6]);
  p.disc(cx, OY + 97, 5, R.hazard[5]);
  p.disc(cx, OY + 97, 3, R.hazard[3]);
  p.px(cx - 2, OY + 95, R.hazard[7]);
  p.light(cx - 34, cy - 24, 40, LIGHT.warm, 0.2);
  p.light(cx + 34, cy + 4, 34, LIGHT.green, 0.22);
  frame(p);
  p.quantize();
}
function pocketsEyes(p, e) {
  const { cx, cy } = POC;
  for (const ex of [cx - 12, cx + 12]) {
    const y = cy - 6;
    if (e === 2) {
      p.line(ex - 4, y + 1, ex + 4, y + 1, R.hazard[1]);
      continue;
    }
    p.disc(ex, y, 4, R.black[0]);
    p.rect(ex - 2, y - 2, 2, 2, R.beige[7]);
    p.px(ex + 2, y + 2, R.steel[4]);
    // permanently smug: heavy lids, heavier on a half-blink
    p.rect(ex - 5, y - 5, 11, e === 1 ? 6 : 3, R.hazard[4]);
    p.rect(ex - 5, y - 5 + (e === 1 ? 6 : 3), 11, 1, R.hazard[1]);
  }
}
function pocketsMouth(p, m) {
  const { cx, cy } = POC;
  const y = cy + 14;
  p.rect(cx - 5, y - 1, 11, 6, R.beige[6]);
  if (m === 0) {
    p.px(cx - 3, y, R.dark[1]);
    p.px(cx - 2, y + 1, R.dark[1]);
    p.px(cx - 1, y, R.dark[1]);
    p.px(cx, y + 1, R.dark[1]);
    p.px(cx + 1, y, R.dark[1]);
  } else if (m === 1) {
    p.rect(cx - 2, y, 5, 3, R.red[1]);
    p.rect(cx - 1, y, 3, 1, R.beige[7]);
  } else if (m === 2) {
    p.rect(cx - 3, y, 7, 5, R.red[1]);
    p.rect(cx - 2, y, 2, 2, R.beige[7]);
    p.rect(cx + 1, y, 2, 2, R.beige[7]);
  } else {
    p.rect(cx - 2, y, 4, 4, R.red[1]);
    p.rect(cx - 1, y - 1, 2, 6, R.red[1]);
  }
}

// =====================================================================
// LIBRA: shy amber-screen library terminal, round glasses, in love
// =====================================================================
const LIB = { cx: OX + 48, cy: OY + 42 };
const AMBER = [[255, 170, 60]];
function libraBase(p) {
  p.vgrad(OX, OY, 96, 112, R.dark, 2.4, 0.8);
  const spines = [R.rust, R.cryo, R.red, R.phosphor, R.beige];
  for (let y = OY + 2; y < OY + 110; y += 15) {
    for (let x = OX + 2; x < OX + 93; x += 4 + Math.floor(p.rand() * 3)) p.rect(x, y, 3, 12, spines[Math.floor(p.rand() * 5)][3 + Math.floor(p.rand() * 2)]);
    p.rect(OX, y + 12, 96, 2, R.rust[2]);
  }
  p.bevel(OX + 8, OY + 8, 80, 72, R.beige, 4);
  p.inset(OX + 14, OY + 14, 68, 54, R.black, 1);
  p.vgrad(OX + 15, OY + 15, 66, 52, R.hazard, 2.4, 1);
  p.text('LIBRA', OX + 38, OY + 71, R.beige[2], 6);
  p.bevel(OX + 36, OY + 80, 24, 10, R.beige, 3);
  p.bevel(OX + 22, OY + 90, 52, 8, R.beige, 4);
  p.light(OX + 48, OY + 42, 48, AMBER[0], 0.22);
  frame(p);
  p.quantize();
}
function libraEyes(p, e) {
  const { cx, cy } = LIB;
  for (const ex of [cx - 13, cx + 13]) {
    for (let a = 0; a < 40; a++) {
      const t = (a / 40) * Math.PI * 2;
      p.px(ex + Math.round(Math.cos(t) * 8), cy - 4 + Math.round(Math.sin(t) * 8), R.hazard[6]);
    }
    if (e === 2) p.rect(ex - 3, cy - 4, 7, 1, R.hazard[7]);
    else if (e === 1) p.rect(ex - 2, cy - 4, 4, 2, R.hazard[7]);
    else p.rect(ex - 2, cy - 6, 4, 5, R.hazard[7]);
    // blushing, always
    p.px(ex - 4, cy + 7, R.hazard[5]);
    p.px(ex - 2, cy + 8, R.hazard[5]);
    p.px(ex, cy + 7, R.hazard[5]);
  }
  p.rect(cx - 5, cy - 5, 10, 1, R.hazard[6]);
}
function libraMouth(p, m) {
  const { cx, cy } = LIB;
  const y = cy + 15;
  const c = R.hazard[7];
  if (m === 0) {
    p.rect(cx - 4, y, 9, 1, c);
    p.px(cx - 5, y - 1, c);
    p.px(cx + 5, y - 1, c);
  } else if (m === 1) p.rect(cx - 2, y - 1, 5, 3, c);
  else if (m === 2) p.rect(cx - 4, y - 2, 9, 5, c);
  else {
    p.rect(cx - 2, y - 2, 5, 5, c);
    p.rect(cx - 1, y - 1, 3, 3, R.hazard[2]);
  }
  for (let yy = OY + 15; yy < OY + 67; yy += 2) p.rect(OX + 15, yy, 66, 1, 'rgba(0,0,0,0.22)');
}

// =====================================================================
function buildTalker(base, eyes, mouth, seed) {
  const baseTex = pixelTexture(W, H, base, { seed });
  const frames = [];
  for (let e = 0; e < 3; e++) {
    frames.push([]);
    for (let m = 0; m < 4; m++)
      frames[e].push(
        pixelTexture(W, H, (p) => {
          p.g.drawImage(baseTex.image, 0, 0);
          eyes(p, e, m);
          if (mouth) mouth(p, m);
        }, { seed })
      );
  }
  return { frames };
}

export function createTalkers() {
  return {
    GUS: buildTalker(gusBase, gusEyes, gusMouth, 601),
    DORIS: buildTalker(dorisBase, dorisEyes, dorisMouth, 611),
    VENDO: buildTalker(vendoBase, vendoEyes, vendoMouth, 621),
    POCKETS: buildTalker(pocketsBase, pocketsEyes, pocketsMouth, 631),
    LIBRA: buildTalker(libraBase, libraEyes, libraMouth, 641),
  };
}

export const TALKER_ASPECT = H / W;

// Which mouth shape fits a letter.
export function mouthFor(ch) {
  if (!ch || /[\s.,!?;:\-'"…]/.test(ch)) return 0;
  const c = ch.toLowerCase();
  if (c === 'o' || c === 'u' || c === 'w') return 3;
  if ('aei'.includes(c)) return 2;
  return 1;
}
