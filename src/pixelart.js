// Tiny pixel-art toolkit for generated placeholder cards, aiming for a
// 16-bit (Super Nintendo) look: shading ramps, bevels, dithered gradients,
// rivets, glows and crisp text. Every texture is drawn pixel by pixel.

import * as THREE from 'three';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export const RAMPS = {
  steel: ['#0b1019', '#151d2b', '#22303f', '#334658', '#4a6176', '#6a8299', '#94aabd', '#c4d3df'],
  dark: ['#06080d', '#0c1119', '#141b26', '#1d2735', '#283546', '#364659', '#4b5e72', '#647a90'],
  hazard: ['#1c1404', '#3e2c06', '#6e4c08', '#a8750e', '#d9a21a', '#f5c842', '#ffe387', '#fff4c8'],
  red: ['#1c0404', '#430909', '#7a1010', '#b31b18', '#e5352a', '#ff6a50', '#ffa88f', '#ffe0d6'],
  cryo: ['#03141c', '#062735', '#0b4152', '#126275', '#1f8a9c', '#3fb6c4', '#82dde3', '#d2fbff'],
  phosphor: ['#010802', '#03170a', '#062b12', '#0b4a1d', '#16762e', '#2cab44', '#64e07a', '#c3ffcb'],
  rust: ['#160904', '#2c1308', '#48210e', '#6a3416', '#8f4c20', '#b5692f', '#d48f4f', '#efbb85'],
  beige: ['#1d1a14', '#3a342a', '#5a5242', '#7b715c', '#9c917a', '#bcb29a', '#d9d0b9', '#f2ecdb'],
  black: ['#000000', '#07090c', '#0e1116', '#161a21'],
};

const at = (ramp, i) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(i)))];

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function painter(g, rand) {
  const p = {
    g,
    rand,
    rect(x, y, w, h, c) {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = c;
      g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    px(x, y, c) {
      g.fillStyle = c;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    clear(x, y, w, h) {
      g.clearRect(x, y, w, h);
    },
    // Raised plate: light from the top-left, like most 16-bit art.
    bevel(x, y, w, h, ramp, mid = 4) {
      p.rect(x, y, w, h, at(ramp, mid));
      p.rect(x, y, w, 1, at(ramp, mid + 2));
      p.rect(x, y + 1, 1, h - 1, at(ramp, mid + 1));
      p.rect(x + 1, y + h - 1, w - 1, 1, at(ramp, mid - 2));
      p.rect(x + w - 1, y + 1, 1, h - 2, at(ramp, mid - 1));
    },
    // Recessed panel.
    inset(x, y, w, h, ramp, mid = 2) {
      p.rect(x, y, w, h, at(ramp, mid));
      p.rect(x, y, w, 1, at(ramp, mid - 2));
      p.rect(x, y + 1, 1, h - 1, at(ramp, mid - 1));
      p.rect(x + 1, y + h - 1, w - 1, 1, at(ramp, mid + 2));
      p.rect(x + w - 1, y + 1, 1, h - 2, at(ramp, mid + 1));
    },
    // Dithered gradient across ramp indices `from` → `to`.
    vgrad(x, y, w, h, ramp, from, to) {
      for (let j = 0; j < h; j++) {
        const f = from + (to - from) * (h > 1 ? j / (h - 1) : 0);
        const base = Math.floor(f);
        const frac = f - base;
        for (let i = 0; i < w; i++) {
          const idx = frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base;
          p.px(x + i, y + j, at(ramp, idx));
        }
      }
    },
    hgrad(x, y, w, h, ramp, from, to) {
      for (let i = 0; i < w; i++) {
        const f = from + (to - from) * (w > 1 ? i / (w - 1) : 0);
        const base = Math.floor(f);
        const frac = f - base;
        for (let j = 0; j < h; j++) {
          const idx = frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base;
          p.px(x + i, y + j, at(ramp, idx));
        }
      }
    },
    // Horizontal cylinder (pipe): shading runs across its height.
    hcyl(x, y, w, h, ramp, lo = 1, hi = 6) {
      for (let j = 0; j < h; j++) {
        const s = Math.sin((Math.PI * (j + 0.5)) / h);
        const f = lo + (hi - lo) * Math.pow(s, 1.5) - (j > h * 0.55 ? 1 : 0);
        p.hgradRow(x, y + j, w, ramp, f);
      }
    },
    // Vertical cylinder: shading runs across its width, highlight left of center.
    vcyl(x, y, w, h, ramp, lo = 1, hi = 6) {
      for (let i = 0; i < w; i++) {
        const u = (i + 0.5) / w;
        const s = Math.sin(Math.PI * Math.min(1, u * 1.15));
        const f = lo + (hi - lo) * Math.pow(Math.max(0, s), 1.4);
        p.vgradCol(x + i, y, h, ramp, f);
      }
    },
    hgradRow(x, y, w, ramp, f) {
      const base = Math.floor(f);
      const frac = f - base;
      for (let i = 0; i < w; i++) p.px(x + i, y, at(ramp, frac * 16 > BAYER[y & 3][(x + i) & 3] ? base + 1 : base));
    },
    vgradCol(x, y, h, ramp, f) {
      const base = Math.floor(f);
      const frac = f - base;
      for (let j = 0; j < h; j++) p.px(x, y + j, at(ramp, frac * 16 > BAYER[(y + j) & 3][x & 3] ? base + 1 : base));
    },
    rivet(x, y, ramp) {
      p.px(x, y, at(ramp, 7));
      p.px(x + 1, y, at(ramp, 5));
      p.px(x, y + 1, at(ramp, 5));
      p.px(x + 1, y + 1, at(ramp, 1));
    },
    // Soft dithered glow (only paints where it's brighter than a threshold).
    glow(cx, cy, r, ramp, strength = 5) {
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = Math.hypot(i, j) / r;
          if (d > 1) continue;
          const f = strength * (1 - d) * (1 - d);
          const base = Math.floor(f);
          const frac = f - base;
          const x = cx + i, y = cy + j;
          const idx = frac * 16 > BAYER[y & 3][x & 3] ? base + 1 : base;
          if (idx >= 1) p.px(x, y, at(ramp, idx));
        }
    },
    noise(x, y, w, h, c, density) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (rand() < density) p.px(x + i, y + j, c);
    },
    // Crisp text: render with the browser, then keep only solid pixels.
    text(str, x, y, c, size = 8, bold = true) {
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(str.length * size * 0.75) + 4;
      cv.height = size + 4;
      const t = cv.getContext('2d');
      t.font = `${bold ? 'bold ' : ''}${size}px monospace`;
      t.textBaseline = 'top';
      t.fillStyle = '#fff';
      t.fillText(str, 1, 1);
      const d = t.getImageData(0, 0, cv.width, cv.height).data;
      for (let j = 0; j < cv.height; j++)
        for (let i = 0; i < cv.width; i++) if (d[(j * cv.width + i) * 4 + 3] > 120) p.px(x + i - 1, y + j - 1, c);
    },
    // Hazard stripes (diagonal).
    stripes(x, y, w, h, a, b, period = 8) {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) p.px(x + i, y + j, Math.floor((x + i + y + j) / (period / 2)) % 2 ? a : b);
    },
  };
  return p;
}

export function pixelTexture(w, h, draw, { repeatX = false, seed = 1 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const make = () => painter(g, rng(seed));
  draw(make(), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  t.userData.redraw = () => {
    g.clearRect(0, 0, w, h);
    draw(make(), w, h);
    t.needsUpdate = true;
  };
  return t;
}
