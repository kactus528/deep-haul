// The "Taiyo VERTEX" pipeline: everything that makes a modern browser
// pretend to be a 1990 3D add-on.
//
// - each eye renders into a 256x224 target, shown with nearest-neighbor
// - card vertices snap to that pixel grid (jitter)
// - textures are mapped affinely (no perspective correction, so they swim)
// - no z-buffer: cards are painter-sorted back to front
// - final image is quantized to a 512-color (3-3-3 bit) master palette with
//   4x4 Bayer dithering
// - head tracking always runs at full headset rate; only animation is stepped

import * as THREE from 'three';

THREE.ColorManagement.enabled = false; // raw display values end to end

export const RES = { w: 256, h: 224 };
const HI = { w: 1024, h: 896 };

export const MAX_QUADS = 64;

export const settings = {
  lowres: true,
  palette: true,
  snap: true,
  affine: true,
  steppedAnim: true,
  scanlines: false,
};

export const FOG = new THREE.Color(0, 0, 36 / 255);

// Uniforms shared by every card, so a toggle flips the whole scene at once.
const shared = {
  uRes: { value: new THREE.Vector2(RES.w, RES.h) },
  uSnap: { value: 1 },
  uAffine: { value: 1 },
  fogColor: { value: FOG },
  fogNear: { value: 2.5 },
  fogFar: { value: 7.5 },
};

const disp = {
  uPalette: { value: 1 },
  uScan: { value: 0 },
  uFade: { value: 0 },
};

const CARD_VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
varying vec3 vUvw;
varying vec2 vUvP;
varying float vDepth;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  vec4 clip = projectionMatrix * mv;
  if (uSnap > 0.5 && clip.w > 0.0) {
    vec2 hres = uRes * 0.5;
    vec2 ndc = clip.xy / clip.w;
    ndc = floor(ndc * hres + 0.5) / hres;
    clip.xy = ndc * clip.w;
  }
  gl_Position = clip;
  // Interpolating uv*w and w, then dividing, cancels the GPU's perspective
  // correction and gives the old affine (screen-linear) mapping.
  vUvw = vec3(uv * clip.w, clip.w);
  vUvP = uv;
}`;

const CARD_FRAG = /* glsl */ `
uniform sampler2D map;
uniform float uAffine;
uniform float uTint;
uniform vec2 uUvOffset;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
varying vec3 vUvw;
varying vec2 vUvP;
varying float vDepth;
void main() {
  vec2 uv = (uAffine > 0.5 ? vUvw.xy / vUvw.z : vUvP) + uUvOffset;
  vec4 c = texture2D(map, uv);
  if (c.a < 0.5) discard;
  float f = clamp((vDepth - fogNear) / (fogFar - fogNear), 0.0, 1.0);
  f = floor(f * 6.0 + 0.5) / 6.0; // banded fog, like a palette ramp
  gl_FragColor = vec4(mix(c.rgb * uTint, fogColor, f), 1.0);
}`;

const DISP_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0); // fills whatever viewport/eye draws it
}`;

const DISP_FRAG = /* glsl */ `
uniform sampler2D tex;
uniform vec2 uRes;
uniform float uPalette;
uniform float uScan;
uniform float uFade;
uniform vec3 fadeColor;
varying vec2 vUv;
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  vec2 px = floor(vUv * uRes);
  vec3 c = texture2D(tex, (px + 0.5) / uRes).rgb;
  if (uPalette > 0.5) {
    float t = bayer4(px) - 0.46875;
    c = clamp(floor(c * 7.0 + 0.5 + t) / 7.0, 0.0, 1.0); // 8 levels per channel = 512 colors
  }
  if (uScan > 0.5 && fract(vUv.y * uRes.y) > 0.5) c *= 0.8;
  c = mix(c, fadeColor, uFade);
  gl_FragColor = vec4(c, 1.0);
}`;

export function cardMaterial(map, { tint = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
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

function displayMaterial(rt) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...disp,
      tex: { value: rt.texture },
      uRes: shared.uRes,
      fadeColor: { value: FOG },
    },
    vertexShader: DISP_VERT,
    fragmentShader: DISP_FRAG,
    depthTest: false,
    depthWrite: false,
  });
}

export class VertexPipeline {
  constructor(renderer) {
    this.r = renderer;
    const opts = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      depthBuffer: true,
    };
    this.rts = [new THREE.WebGLRenderTarget(RES.w, RES.h, opts), new THREE.WebGLRenderTarget(RES.w, RES.h, opts)];

    this.eye = new THREE.PerspectiveCamera();
    this.eye.matrixAutoUpdate = false;
    this.eye.matrixWorldAutoUpdate = false;
    this.screenCam = new THREE.Camera();

    const geo = new THREE.PlaneGeometry(2, 2);
    const quad = (rt, layer) => {
      const m = new THREE.Mesh(geo, displayMaterial(rt));
      m.frustumCulled = false;
      m.layers.set(layer);
      return m;
    };
    // Flat screen: one quad on layer 0.
    this.flatScene = new THREE.Scene();
    this.flatScene.add(quad(this.rts[0], 0));
    // Headset: three.js gives the left eye layer 1 and the right eye layer 2,
    // so each eye only sees its own low-res image.
    this.xrScene = new THREE.Scene();
    [quad(this.rts[0], 1), quad(this.rts[1], 2)].forEach((q, i) => {
      // Each eye's low-res pass happens right before that eye draws its quad,
      // inside the normal XR render (the same trick three.js's Reflector uses
      // in VR), so the headset's own framebuffer and viewport are restored.
      q.onBeforeRender = (renderer, _scene, eyeCam) => this.renderEye(i, eyeCam);
      this.xrScene.add(q);
    });
    this.pendingScene = null;

    this.headPos = new THREE.Vector3();
    this.apply();
  }

  apply() {
    const s = settings.lowres ? RES : HI;
    this.rts.forEach((rt) => rt.setSize(s.w, s.h));
    shared.uRes.value.set(s.w, s.h);
    shared.uSnap.value = settings.snap ? 1 : 0;
    shared.uAffine.value = settings.affine ? 1 : 0;
    disp.uPalette.value = settings.palette ? 1 : 0;
    disp.uScan.value = settings.scanlines ? 1 : 0;
  }

  renderFlat(scene, camera) {
    const r = this.r;
    disp.uFade.value = 0;
    r.setRenderTarget(this.rts[0]);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.flatScene, this.screenCam);
  }

  // Fresh head pose every frame (full headset rate), rendered per eye into
  // the low-res targets, then stretched onto the real eye buffers.
  renderXR(scene, camera, playSpot, leanLimit) {
    // Fade out if the player leans far enough to see the cards' flat edges
    // (uses last frame's head pose; one frame of lag is invisible here).
    const xc = this.r.xr.getCamera();
    this.headPos.setFromMatrixPosition(xc.matrixWorld);
    const d = Math.hypot(this.headPos.x - playSpot.x, this.headPos.z - playSpot.z);
    disp.uFade.value = THREE.MathUtils.clamp((d - leanLimit) / 0.15, 0, 1);

    this.pendingScene = scene;
    this.r.render(this.xrScene, camera);
    this.pendingScene = null;
  }

  renderEye(i, eyeCam) {
    const r = this.r;
    const scene = this.pendingScene;
    if (!scene) return;
    const e = this.eye;
    e.matrixWorld.copy(eyeCam.matrixWorld);
    e.matrixWorldInverse.copy(eyeCam.matrixWorldInverse);
    e.projectionMatrix.copy(eyeCam.projectionMatrix);
    e.projectionMatrixInverse.copy(eyeCam.projectionMatrixInverse);

    const current = r.getRenderTarget();
    const xrOn = r.xr.enabled;
    r.xr.enabled = false;
    r.setRenderTarget(this.rts[i]);
    r.render(scene, e);
    r.xr.enabled = xrOn;
    r.setRenderTarget(current);
    if (eyeCam.viewport) r.state.viewport(eyeCam.viewport);
  }
}
