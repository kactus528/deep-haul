// The "Taiyo VERTEX" look, done inside each card's shader so it works the
// same on desktop and in the Quest headset (no offscreen hand-off).
//
// - 256x224 virtual screen: every card samples its texture once per big
//   "VERTEX pixel", so the image is chunky at any real resolution
// - vertices snap to that pixel grid (jitter)
// - affine texture mapping (no perspective correction, textures swim)
// - no z-buffer: cards are painter-sorted back to front
// - 15-bit color (32,768 colors), like the Super Nintendo
// - head tracking at full headset rate; only animation is stepped

import * as THREE from 'three';

THREE.ColorManagement.enabled = false; // raw display values end to end

export const RES = { w: 256, h: 224 };
export const MAX_QUADS = 24; // flat layers per view (the VERTEX's sprite planes)

export const settings = {
  // Comfort mode (headset default): pixels live in the art and the world,
  // not on your eyes, so nothing crawls or twitches when you move your head.
  // Authentic mode: the full screen-locked 1992 look, for short bursts.
  comfort: false,
  dither: true,
  lowres: true,
  palette: true,
  snap: true,
  affine: true,
  steppedAnim: true,
  scanlines: false,
};

export const FOG = new THREE.Color(4 / 255, 6 / 255, 14 / 255);

// Shared by every card, so one toggle flips the whole scene.
const shared = {
  uRes: { value: new THREE.Vector2(RES.w, RES.h) },
  uCell: { value: new THREE.Vector2(4, 4) },
  uSnap: { value: 1 }, // 0 off, 1 screen grid (authentic), 2 world grid (comfort)
  uWorldGrid: { value: 0.01 },
  uDither: { value: 1 },
  uAffine: { value: 1 },
  uPalette: { value: 1 },
  uScan: { value: 0 },
  uFade: { value: 0 },
  fogColor: { value: FOG },
  fogNear: { value: 3.0 },
  fogFar: { value: 9.0 },
};

const CARD_VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
uniform float uWorldGrid;
varying vec3 vUvw;
varying vec2 vUvP;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  // Comfort: corners snap to a coarse grid in the world, so shapes are a bit
  // imprecise but never twitch as the head moves.
  if (uSnap > 1.5) wp.xyz = floor(wp.xyz / uWorldGrid + 0.5) * uWorldGrid;
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  vec4 clip = projectionMatrix * mv;
  if (uSnap > 0.5 && uSnap < 1.5 && clip.w > 0.0) {
    vec2 hres = uRes * 0.5;
    vec2 ndc = clip.xy / clip.w;
    ndc = floor(ndc * hres + 0.5) / hres;
    clip.xy = ndc * clip.w;
  }
  gl_Position = clip;
  // Interpolating uv*w and w, then dividing, cancels the GPU's perspective
  // correction: the old affine (screen-linear) texture mapping.
  vUvw = vec3(uv * clip.w, clip.w);
  vUvP = uv;
}`;

const CARD_FRAG = /* glsl */ `
uniform sampler2D map;
uniform float uAffine;
uniform float uTint;
uniform vec2 uUvOffset;
uniform vec2 uCell;
uniform float uPalette;
uniform float uDither;
uniform float uScan;
uniform float uFade;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
varying vec3 vUvw;
varying vec2 vUvP;
varying float vDepth;
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  vec2 uv = uAffine > 0.5 ? vUvw.xy / vUvw.z : vUvP;
  // Snap this fragment to the center of its big VERTEX pixel and sample
  // there, so the whole block shows one texel.
  vec2 cell = floor(gl_FragCoord.xy / uCell);
  vec2 d = (cell + 0.5) * uCell - gl_FragCoord.xy;
  uv += dFdx(uv) * d.x + dFdy(uv) * d.y;
  float depth = vDepth + dFdx(vDepth) * d.x + dFdy(vDepth) * d.y;

  vec4 c = texture2D(map, uv + uUvOffset);
  if (c.a < 0.5) discard;

  float f = clamp((depth - fogNear) / (fogFar - fogNear), 0.0, 1.0);
  f = floor(f * 8.0 + 0.5) / 8.0; // banded fog, like a palette ramp
  vec3 col = mix(c.rgb * uTint, fogColor, f);

  if (uPalette > 0.5) {
    float t = uDither > 0.5 ? bayer4(cell) - 0.46875 : 0.0;
    col = clamp(floor(col * 31.0 + 0.5 + t) / 31.0, 0.0, 1.0); // 5 bits per channel
  }
  if (uScan > 0.5 && mod(cell.y, 2.0) > 0.5) col *= 0.82;
  col = mix(col, fogColor, uFade);
  gl_FragColor = vec4(col, 1.0);
}`;

// Each room sets its own fog distances (long corridors need more).
export function setFog(near, far) {
  shared.fogNear.value = near;
  shared.fogFar.value = far;
}

export function cardMaterial(map, { tint = 1, noSnap = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      // Interface cards (cursor, menu, dialogue) never snap: a 1 cm grid
      // would crush a 3 cm cursor.
      ...(noSnap ? { uSnap: { value: 0 } } : {}),
      map: { value: map },
      uTint: { value: tint },
      uUvOffset: { value: new THREE.Vector2() },
    },
    vertexShader: CARD_VERT,
    fragmentShader: CARD_FRAG,
    // No z-buffer on the VERTEX: three.js sorts transparent objects back to
    // front, which is exactly the painter's algorithm.
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true,
  });
}

export class VertexPipeline {
  constructor(renderer) {
    this.r = renderer;
    this.size = new THREE.Vector2();
    this.headPos = new THREE.Vector3();
    this.apply();
  }

  apply() {
    const c = settings.comfort;
    shared.uSnap.value = !settings.snap ? 0 : c ? 2 : 1;
    shared.uAffine.value = settings.affine && !c ? 1 : 0;
    shared.uPalette.value = settings.palette ? 1 : 0;
    shared.uDither.value = settings.dither && !c ? 1 : 0;
    shared.uScan.value = settings.scanlines && !c ? 1 : 0;
    shared.uRes.value.set(settings.lowres ? RES.w : 4096, settings.lowres ? RES.h : 4096);
  }

  setCell(width, height) {
    if (!settings.lowres || settings.comfort || !(width > 0) || !(height > 0)) shared.uCell.value.set(1, 1);
    else shared.uCell.value.set(Math.max(1, width / RES.w), Math.max(1, height / RES.h));
  }

  renderFlat(scene, camera) {
    this.r.getDrawingBufferSize(this.size);
    this.setCell(this.size.x, this.size.y);
    this.r.render(scene, camera);
  }

  renderXR(scene, camera) {
    const xc = this.r.xr.getCamera();
    // One eye's viewport in real pixels (from last frame; it never changes).
    const vp = xc.cameras.length ? xc.cameras[0].viewport : null;
    if (vp && vp.z > 0) this.setCell(vp.z, vp.w);
    else this.setCell(RES.w * 6, RES.h * 6);
    this.r.render(scene, camera);
  }

  // 0 = clear view, 1 = fully faded to the fog color.
  setFade(v) {
    shared.uFade.value = THREE.MathUtils.clamp(v, 0, 1);
  }
}
