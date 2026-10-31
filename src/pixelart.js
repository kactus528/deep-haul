// Pixel-art toolkit for generated placeholder cards, aiming at top-tier
// 16-bit art (think Squaresoft's SNES backgrounds): hue-shifted ramps,
// colored light spill ("color math"), grime, drips, scratches, colored
// outlines, and a final snap to 15-bit color. Everything is drawn pixel by
// pixel; the passes only ever step in quarter strengths with ordered
// dithering, so the result stays crisp pixel art rather than smooth noise.

import * as THREE from 'three';

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Hue-shifted ramps: shadows drift to violet/indigo, highlights to warm.
export const RAMPS = {
  steel: ['#0c0a18', '#17162c', '#222842', '#2f3c58', '#435673', '#5f7590', '#8a9eb2', '#c9d2d2'],
  dark: ['#07060f', '#0e0d1c', '#16172a', '#1f2338', '#2a3048', '#384059', '#4c556d', '#646e84'],
  hazard: ['#1f0f0a', '#43200c', '#73400c', '#a8670f', '#d69516', '#f2c03a', '#fde27e', '#fff5cf'],
  red: ['#1a0410', '#3d0814', '#6e0f16', '#a61d18', '#d9391f', '#ff6a3a', '#ffa477', '#ffe2c9'],
  cryo: ['#08102a', '#0b2241', '#0d3a59', '#0f5a72', '#1c8191', '#3cadb0', '#80d8cf', '#d6fff0'],
  phosphor: ['#020a0c', '#041a14', '#073020', '#0d4f2c', '#19793a', '#36a84a', '#79dc6f', '#d4ffb8'],
  rust: ['#1a0814', '#33101a', '#55201f', '#7c3722', '#a35227', '#c87536', '#e29d5a', '#f6cd96'],
  beige: ['#1c1420', '#3a2f35', '#5b4e4b', '#7d6f62', '#9e907c', '#bfb198', '#dcd1b8', '#f4eedb'],
  suit: ['#1f0c12', '#451a16', '#7a3012', '#b04e12', '#d9741c', '#f09c3a', '#fcc679', '#fff0cf'],
  skin: ['#1c0c16', '#3e1c22', '#6b3430', '#9a5440', '#c47c58', '#e2a37a', '#f4c9a0', '#fff0dc'],
  black: ['#04030a', '#0a0914', '#11111e', '#191a29'],
};

export const LIGHT = {
  cyan: [70, 200, 215],
  red: [255, 70, 40],
  warm: [255, 210, 150],
  green: [80, 230, 110],
  shadow: '#0a0618',
};

const at = (ramp, i) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(i)))];
const hexRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x, y, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s, oct = 4) {
  let f = 0, amp = 0.5, fr = 1;
  for (let i = 0; i < oct; i++) {
    f += amp * vnoise(x * fr, y * fr, s + i * 17);
    amp *= 0.5;
    fr *= 2;
  }
  return f / 0.9375;
}

// Quarter-step a 0..1 strength with ordered dither, so blends stay pixel art.
const step4 = (t, x, y) => Math.floor(Math.max(0, Math.min(1, t)) * 4 + BAYER[y & 3][x & 3] / 16) / 4;

function painter(g, rand, W, H) {
  const p = {
    g,
    rand,
    W,
    H,
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
    line(x0, y0, x1, y1, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) p.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
    },
    disc(cx, cy, r, c) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) p.px(cx + i, cy + j, c);
    },
    // Raised plate, light from the top left.
    bevel(x, y, w, h, ramp, mid = 4) {
      p.rect(x, y, w, h, at(ramp, mid));
      p.rect(x, y, w, 1, at(ramp, mid + 2));
      p.rect(x, y + 1, 1, h - 1, at(ramp, mid + 1));
      p.rect(x + 1, y + h - 1, w - 1, 1, at(ramp, mid - 2));
      p.rect(x + w - 1, y + 1, 1, h - 2, at(ramp, mid - 1));
    },
    inset(x, y, w, h, ramp, mid = 2) {
      p.rect(x, y, w, h, at(ramp, mid));
      p.rect(x, y, w, 1, at(ramp, mid - 2));
      p.rect(x, y + 1, 1, h - 1, at(ramp, mid - 1));
      p.rect(x + 1, y + h - 1, w - 1, 1, at(ramp, mid + 2));
      p.rect(x + w - 1, y + 1, 1, h - 2, at(ramp, mid + 1));
    },
    vgrad(x, y, w, h, ramp, from, to) {
      for (let j = 0; j < h; j++) {
        const f = from + (to - from) * (h > 1 ? j / (h - 1) : 0);
        const base = Math.floor(f), frac = f - base;
        for (let i = 0; i < w; i++) p.px(x + i, y + j, at(ramp, frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base));
      }
    },
    hgrad(x, y, w, h, ramp, from, to) {
      for (let i = 0; i < w; i++) {
        const f = from + (to - from) * (w > 1 ? i / (w - 1) : 0);
        const base = Math.floor(f), frac = f - base;
        for (let j = 0; j < h; j++) p.px(x + i, y + j, at(ramp, frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base));
      }
    },
    // Horizontal cylinder (pipe): shading across its height.
    hcyl(x, y, w, h, ramp, lo = 1, hi = 6) {
      for (let j = 0; j < h; j++) {
        const s = Math.sin((Math.PI * (j + 0.5)) / h);
        const f = lo + (hi - lo) * Math.pow(s, 1.5) - (j > h * 0.55 ? 1 : 0);
        const base = Math.floor(f), frac = f - base;
        for (let i = 0; i < w; i++) p.px(x + i, y + j, at(ramp, frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base));
      }
    },
    // Vertical cylinder: highlight left of center, rim light on the right.
    vcyl(x, y, w, h, ramp, lo = 1, hi = 6) {
      for (let i = 0; i < w; i++) {
        const u = (i + 0.5) / w;
        let f = lo + (hi - lo) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u * 1.18))), 1.4);
        if (u > 0.9) f += 1.2; // rim light
        const base = Math.floor(f), frac = f - base;
        for (let j = 0; j < h; j++) p.px(x + i, y + j, at(ramp, frac * 16 > BAYER[(y + j) & 3][(x + i) & 3] ? base + 1 : base));
      }
    },
    rivet(x, y, ramp) {
      p.px(x, y, at(ramp, 7));
      p.px(x + 1, y, at(ramp, 5));
      p.px(x, y + 1, at(ramp, 5));
      p.px(x + 1, y + 1, at(ramp, 1));
    },
    glow(cx, cy, r, ramp, strength = 5) {
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const d = Math.hypot(i, j) / r;
          if (d > 1) continue;
          const f = strength * (1 - d) * (1 - d);
          const base = Math.floor(f), frac = f - base;
          const x = cx + i, y = cy + j;
          const idx = frac * 16 > BAYER[y & 3][x & 3] ? base + 1 : base;
          if (idx >= 1) p.px(x, y, at(ramp, idx));
        }
    },
    noise(x, y, w, h, c, density) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (rand() < density) p.px(x + i, y + j, c);
    },
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
    stripes(x, y, w, h, a, b, period = 8) {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) p.px(x + i, y + j, Math.floor((x + i + y + j) / (period / 2)) % 2 ? a : b);
    },
    scratches(x, y, w, h, count, c) {
      for (let k = 0; k < count; k++) {
        const sx = x + rand() * w, sy = y + rand() * h, len = 2 + Math.floor(rand() * 4), dir = rand() < 0.5 ? 1 : -1;
        for (let i = 0; i < len; i++) p.px(sx + i * dir, sy + i * 0.5, c);
      }
    },

    // ---------- passes over finished pixels ("color math") ----------
    edit(fn) {
      const id = g.getImageData(0, 0, W, H);
      fn(id.data);
      g.putImageData(id, 0, 0);
    },
    // Blend toward a color by a per-pixel weight (quarter steps, dithered).
    blend(x0, y0, w, h, weight, color) {
      const [cr, cg, cb] = typeof color === 'string' ? hexRgb(color) : color;
      p.edit((d) => {
        for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++)
          for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
            const k = (y * W + x) * 4;
            if (d[k + 3] < 128) continue;
            const t = step4(weight(x, y), x, y);
            if (!t) continue;
            d[k] += (cr - d[k]) * t;
            d[k + 1] += (cg - d[k + 1]) * t;
            d[k + 2] += (cb - d[k + 2]) * t;
          }
      });
    },
    // Additive colored light (SNES color-math add), stepped and dithered.
    light(cx, cy, r, rgb, strength = 0.4, sy = 1) {
      p.edit((d) => {
        for (let y = Math.max(0, Math.floor(cy - r * sy)); y < Math.min(H, Math.ceil(cy + r * sy)); y++)
          for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(W, Math.ceil(cx + r)); x++) {
            const k = (y * W + x) * 4;
            if (d[k + 3] < 128) continue;
            const dd = Math.hypot(x - cx, (y - cy) / sy) / r;
            if (dd >= 1) continue;
            const t = step4(strength * (1 - dd) * (1 - dd) * 1.6, x, y) / 1.6;
            if (!t) continue;
            d[k] = Math.min(255, d[k] + rgb[0] * t);
            d[k + 1] = Math.min(255, d[k + 1] + rgb[1] * t);
            d[k + 2] = Math.min(255, d[k + 2] + rgb[2] * t);
          }
      });
    },
    grime(x, y, w, h, { scale = 16, amount = 0.4, thresh = 0.45, color = LIGHT.shadow, seed = 1 } = {}) {
      p.blend(x, y, w, h, (i, j) => (Math.max(0, fbm(i / scale, j / scale, seed) - thresh) / (1 - thresh)) * amount * 2.2, color);
    },
    // Darken toward an edge: 'down' = darker toward the bottom, etc.
    ao(x, y, w, h, dir, strength = 0.5, color = LIGHT.shadow) {
      p.blend(x, y, w, h, (i, j) => {
        const u = dir === 'down' ? (j - y) / h : dir === 'up' ? 1 - (j - y) / h : dir === 'right' ? (i - x) / w : 1 - (i - x) / w;
        return u * u * strength;
      }, color);
    },
    // Streaks running down from seams and rivets.
    drips(x, y, w, h, { count = 20, len = 24, color = LIGHT.shadow, strength = 0.35 } = {}) {
      const streaks = [];
      for (let k = 0; k < count; k++) streaks.push([Math.floor(x + rand() * w), Math.floor(y + rand() * h * 0.6), Math.floor(len * (0.4 + rand()))]);
      const [cr, cg, cb] = typeof color === 'string' ? hexRgb(color) : color;
      p.edit((d) => {
        for (const [sx, sy, L] of streaks)
          for (let k = 0; k < L; k++) {
            if (rand() > 1 - (k / L) * 0.8) continue;
            const yy = sy + k;
            if (yy >= H || sx >= W) break;
            const idx = (yy * W + sx) * 4;
            if (d[idx + 3] < 128) continue;
            const t = strength * (1 - k / L);
            d[idx] += (cr - d[idx]) * t;
            d[idx + 1] += (cg - d[idx + 1]) * t;
            d[idx + 2] += (cb - d[idx + 2]) * t;
          }
      });
    },
    // Colored inner outline on a cut-out sprite's silhouette.
    outline(color) {
      const [cr, cg, cb] = hexRgb(color);
      p.edit((d) => {
        const a = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3] > 127 ? 1 : 0;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            if (!a[y * W + x]) continue;
            const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 || !a[y * W + x - 1] || !a[y * W + x + 1] || !a[(y - 1) * W + x] || !a[(y + 1) * W + x];
            if (!edge) continue;
            const k = (y * W + x) * 4;
            d[k] = cr;
            d[k + 1] = cg;
            d[k + 2] = cb;
          }
      });
    },
    // Final snap to 15-bit color (5 bits per channel) and hard alpha.
    quantize() {
      p.edit((d) => {
        for (let k = 0; k < d.length; k += 4) {
          d[k] = Math.round(Math.round((d[k] / 255) * 31) * (255 / 31));
          d[k + 1] = Math.round(Math.round((d[k + 1] / 255) * 31) * (255 / 31));
          d[k + 2] = Math.round(Math.round((d[k + 2] / 255) * 31) * (255 / 31));
          d[k + 3] = d[k + 3] > 127 ? 255 : 0;
        }
      });
    },
  };
  return p;
}

// ---------------------------------------------------------------------
// Real art: images in /art listed in art/manifest.json replace the
// code-drawn placeholder with the same key. Loaded once before rooms build.
// ---------------------------------------------------------------------
export const ART = new Map();
export async function loadArt(build) {
  try {
    const r = await fetch('art/manifest.json?t=' + Date.now(), { cache: 'no-store' });
    const list = await r.json();
    await Promise.all(
      Object.entries(list).map(async ([key, file]) => {
        const img = new Image();
        img.src = 'art/' + file + '?b=' + build;
        try {
          await img.decode();
          ART.set(key, img);
        } catch (e) {
          console.warn('[Deep Haul] art failed to load:', file);
        }
      })
    );
  } catch (e) {
    // no manifest yet: everything stays code-drawn
  }
  return ART;
}

export function pixelTexture(w, h, draw, { repeatX = false, repeatY = false, seed = 1, key = null } = {}) {
  const art = key && ART.get(key);
  if (art) {
    // Hand-made art for this key: use it as-is (already crushed to spec).
    const cv = document.createElement('canvas');
    cv.width = art.naturalWidth || art.width;
    cv.height = art.naturalHeight || art.height;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    if (repeatX) t.wrapS = THREE.RepeatWrapping;
    if (repeatY) t.wrapT = THREE.RepeatWrapping;
    t.userData.redraw = () => {};
    t.userData.art = key;
    return t;
  }
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const make = () => painter(g, rng(seed), w, h);
  draw(make(), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  if (repeatY) t.wrapT = THREE.RepeatWrapping;
  t.userData.redraw = () => {
    g.clearRect(0, 0, w, h);
    draw(make(), w, h);
    t.needsUpdate = true;
  };
  return t;
}
