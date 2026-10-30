import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { VertexPipeline, settings, RES, FOG } from './vertex.js?v=7';
import { buildCryoBay } from './room-cryo.js?v=7';

const BUILD = 7;
const ANIM_STEP = 1 / 20; // world animation runs at 20 fps
const PLAY_SPOT = new THREE.Vector2(0, 0); // x, z of the player's fixed spot
const LEAN_LIMIT = 0.3; // meters before the view fades out
const EYE_HEIGHT = 1.6;

const help = document.getElementById('help');

// ---------- errors: solid red in the headset, message on desktop ----------
let lastError = null;
let broken = false;
function showError(err) {
  broken = true;
  const msg = String((err && (err.stack || err.message)) || err);
  if (msg === lastError) return;
  lastError = msg;
  console.error('[Deep Haul]', err);
  if (help) {
    help.style.display = '';
    help.textContent = `BUILD ${BUILD} ERROR: ${msg}`;
  }
}
addEventListener('error', (e) => showError(e.error || e.message));
addEventListener('unhandledrejection', (e) => showError(e.reason));

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(1);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
// A shader that fails to compile draws nothing and throws nothing, so catch it.
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  const log = [gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs), gl.getProgramInfoLog(program)].filter(Boolean).join('\n');
  showError('Shader failed to compile:\n' + log);
};
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
// The room lives in its own group so it can be moved to wherever the player
// is standing (and facing) when they enter VR.
const world = new THREE.Group();
scene.add(world);
const room = buildCryoBay(world);
scene.background = FOG;
const camera = new THREE.PerspectiveCamera(60, RES.w / RES.h, 0.05, 50);
const pipeline = new VertexPipeline(renderer);
const errScene = new THREE.Scene();
errScene.background = new THREE.Color(0.6, 0, 0);

// ---------- toggles ----------
function toggle(...keys) {
  for (const k of keys) settings[k] = !settings[k];
  pipeline.apply();
  room.refreshHud();
}
const keyToggles = { 1: 'lowres', 2: 'palette', 3: 'snap', 4: 'affine', 5: 'steppedAnim', 6: 'scanlines' };

// ---------- flat preview controls ----------
const flat = { yaw: 0, pitch: 0, lean: new THREE.Vector2() };
const held = new Set();
addEventListener('keydown', (e) => {
  if (keyToggles[e.key]) toggle(keyToggles[e.key]);
  held.add(e.key.toLowerCase());
});
addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!e.buttons) return;
  flat.yaw -= e.movementX * 0.005;
  flat.pitch = THREE.MathUtils.clamp(flat.pitch - e.movementY * 0.005, -1.2, 1.2);
});

function updateFlat(dt) {
  const f = (held.has('s') ? 1 : 0) - (held.has('w') ? 1 : 0);
  const s = (held.has('d') ? 1 : 0) - (held.has('a') ? 1 : 0);
  if (f || s) {
    const c = Math.cos(flat.yaw), n = Math.sin(flat.yaw);
    flat.lean.x += (s * c + f * n) * dt * 0.8;
    flat.lean.y += (-s * n + f * c) * dt * 0.8;
    if (flat.lean.length() > LEAN_LIMIT) flat.lean.setLength(LEAN_LIMIT);
  }
  camera.position.set(PLAY_SPOT.x + flat.lean.x, EYE_HEIGHT, PLAY_SPOT.y + flat.lean.y);
  camera.rotation.set(flat.pitch, flat.yaw, 0, 'YXZ');
  camera.updateMatrixWorld();
}

function fit() {
  if (renderer.xr.isPresenting) return;
  const h = Math.floor(Math.min(innerHeight, (innerWidth * RES.h) / RES.w));
  renderer.setSize(Math.floor((h * RES.w) / RES.h), h);
}
addEventListener('resize', fit);
fit();

// ---------- anchoring the room to the player in VR ----------
// The headset's origin may be far from where the player stands (for example
// the center of their play boundary), so the room is placed around the
// player's head on the first frames of the session, facing the hatch.
let needAnchor = false;
let anchorFrames = 0;
const headPos = new THREE.Vector3();
const headQuat = new THREE.Quaternion();
const headEuler = new THREE.Euler();
function readHead() {
  const xc = renderer.xr.getCamera();
  const src = xc.cameras.length ? xc.cameras[0] : xc;
  src.matrixWorld.decompose(headPos, headQuat, new THREE.Vector3());
  return headPos.lengthSq() > 0;
}
function anchorRoom() {
  if (!readHead()) return false;
  headEuler.setFromQuaternion(headQuat, 'YXZ');
  world.position.set(headPos.x, 0, headPos.z);
  world.rotation.set(0, headEuler.y, 0);
  PLAY_SPOT.set(headPos.x, headPos.z);
  return true;
}
function updateFade() {
  if (needAnchor || !readHead()) return pipeline.setFade(0);
  const d = Math.hypot(headPos.x - PLAY_SPOT.x, headPos.z - PLAY_SPOT.y);
  pipeline.setFade((d - LEAN_LIMIT) / 0.15);
}

renderer.xr.addEventListener('sessionstart', () => {
  if (help && !broken) help.style.display = 'none';
  needAnchor = true;
  anchorFrames = 0;
  pipeline.setFade(0);
});
renderer.xr.addEventListener('sessionend', () => {
  world.position.set(0, 0, 0);
  world.rotation.set(0, 0, 0);
  PLAY_SPOT.set(0, 0);
  pipeline.setFade(0);
  if (help) help.style.display = '';
  camera.aspect = RES.w / RES.h;
  camera.updateProjectionMatrix();
  fit();
});

// ---------- headset buttons: A palette, B snap+affine, X low-res, Y 20fps ----------
const prevPressed = {};
function pollXRButtons() {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const src of session.inputSources) {
    const gp = src.gamepad;
    if (!gp) continue;
    // Either grip button: rebuild the room around where you stand now.
    const grip = !!(gp.buttons[1] && gp.buttons[1].pressed);
    if (grip && !prevPressed[src.handedness + 'grip']) {
      needAnchor = true;
      anchorFrames = 4;
    }
    prevPressed[src.handedness + 'grip'] = grip;
    for (const i of [4, 5]) {
      const key = src.handedness + i;
      const pressed = !!(gp.buttons[i] && gp.buttons[i].pressed);
      if (pressed && !prevPressed[key]) {
        if (src.handedness === 'right') i === 4 ? toggle('palette') : toggle('snap', 'affine');
        else i === 4 ? toggle('lowres') : toggle('steppedAnim');
      }
      prevPressed[key] = pressed;
    }
  }
}

// ---------- loop ----------
let last = performance.now();
let acc = 0;
renderer.setAnimationLoop(() => {
  try {
    if (broken) throw new Error(lastError);
    frame();
  } catch (err) {
    if (!broken) showError(err);
    renderer.render(errScene, camera);
  }
});

function frame() {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;

  if (settings.steppedAnim) {
    acc += dt;
    while (acc >= ANIM_STEP) {
      room.update(ANIM_STEP);
      acc -= ANIM_STEP;
    }
  } else {
    room.update(dt);
  }

  if (renderer.xr.isPresenting) {
    pollXRButtons();
    pipeline.renderXR(scene, camera);
    if (needAnchor && ++anchorFrames > 3 && anchorRoom()) needAnchor = false;
    updateFade();
  } else {
    updateFlat(dt);
    pipeline.renderFlat(scene, camera);
  }
}
