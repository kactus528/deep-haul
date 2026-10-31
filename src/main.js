import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { VertexPipeline, settings, RES, FOG, setFog } from './vertex.js?v=16';
import { buildCryoBay } from './room-cryo.js?v=16';
import { buildCorridor } from './room-corridor.js?v=16';
import { buildMess } from './room-mess.js?v=16';
import { createHud } from './hud.js?v=16';
import { createUI } from './ui.js?v=16';

const BUILD = 16;
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
// A rejected promise is usually the browser saying no to something minor
// (e.g. the Enter VR button pressed again while already in VR). Log it, but
// don't stop the game for it.
addEventListener('unhandledrejection', (e) => {
  console.warn('[Deep Haul] ignored rejected promise:', e.reason);
  e.preventDefault();
});

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
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(vrButton);
// While in VR, a trigger pull can leak through to this page; make sure it
// can't press the button behind the headset view.
renderer.xr.addEventListener('sessionstart', () => (vrButton.style.pointerEvents = 'none'));
renderer.xr.addEventListener('sessionend', () => (vrButton.style.pointerEvents = ''));

const scene = new THREE.Scene();
// The room lives in its own group so it can be moved to wherever the player
// is standing (and facing) when they enter VR.
const world = new THREE.Group();
scene.add(world);
scene.background = FOG;

// ---------- rooms ----------
// Each room is built around the player's spot, facing -z, in its own group.
// Travel is always a fade cut (the camera never moves on its own).
const rooms = {};
function addRoom(id, build) {
  const group = new THREE.Group();
  group.visible = false;
  world.add(group);
  rooms[id] = Object.assign(build(group), { group });
}
addRoom('cryo', buildCryoBay);
addRoom('corridor', buildCorridor);
addRoom('mess', buildMess);
let room = rooms.cryo;
room.group.visible = true;
setFog(...room.fog);
const hud = createHud(world, BUILD);
hud.setRoom(room.name, room.quads);

const trans = { state: 'idle', t: 0, target: null, yaw: 0 };
function goTo(id, yawDeg = 0) {
  if (!rooms[id] || trans.state !== 'idle') return;
  Object.assign(trans, { state: 'out', t: 0, target: id, yaw: Number(yawDeg) || 0 });
  ui.setLocked(true);
}
// Returns how faded the view should be for the transition (0..1).
function updateTransition(dt) {
  if (trans.state === 'idle') return 0;
  trans.t += dt / 0.35;
  if (trans.state === 'out' && trans.t >= 1) {
    room.group.visible = false;
    room = rooms[trans.target];
    room.group.visible = true;
    room.group.rotation.y = THREE.MathUtils.degToRad(trans.yaw);
    setFog(...room.fog);
    ui.setHitMeshes(room.hitMeshes);
    hud.setRoom(room.name, room.quads);
    trans.state = 'in';
    trans.t = 0;
    return 1;
  }
  if (trans.state === 'in' && trans.t >= 1) {
    trans.state = 'idle';
    ui.setLocked(false);
    return 0;
  }
  return trans.state === 'out' ? trans.t : 1 - trans.t;
}
let transFade = 0;
const camera = new THREE.PerspectiveCamera(60, RES.w / RES.h, 0.05, 50);
scene.add(camera); // the desktop command menu rides on the camera
const pipeline = new VertexPipeline(renderer);
const errScene = new THREE.Scene();
errScene.background = new THREE.Color(0.6, 0, 0);
// In the headset you can't see the desktop page, so the error is also
// written on a panel floating in front of you.
const errCanvas = document.createElement('canvas');
errCanvas.width = 1024;
errCanvas.height = 512;
const errTex = new THREE.CanvasTexture(errCanvas);
const errCard = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: errTex, side: THREE.DoubleSide }));
errScene.add(errCard);
let errDrawn = null;
function drawErrorCard() {
  if (errDrawn === lastError) return;
  errDrawn = lastError;
  const g = errCanvas.getContext('2d');
  g.fillStyle = '#200';
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#fff';
  g.font = 'bold 30px monospace';
  g.fillText(`BUILD ${BUILD} ERROR - please read this to Claude:`, 24, 50);
  g.font = '24px monospace';
  const words = String(lastError || 'unknown').replace(/\s+/g, ' ').split(' ');
  let line = '', y = 100;
  for (const w of words) {
    if ((line + ' ' + w).length > 70) {
      g.fillText(line, 24, y);
      y += 32;
      line = w;
      if (y > 490) break;
    } else line = line ? line + ' ' + w : w;
  }
  if (y <= 490) g.fillText(line, 24, y);
  errTex.needsUpdate = true;
}
function placeErrorCard() {
  try {
    const xc = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
    xc.matrixWorld.decompose(pos, quat, new THREE.Vector3());
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    errCard.position.copy(pos).addScaledVector(fwd, 1.4);
    errCard.lookAt(pos);
  } catch (e) {}
}

// ---------- toggles ----------
function toggle(...keys) {
  for (const k of keys) settings[k] = !settings[k];
  pipeline.apply();
  hud.refresh();
}
// Headset remembers your choice for this visit; Comfort until you switch.
let xrComfort = true;
function setMode(comfort) {
  settings.comfort = comfort;
  if (renderer.xr.isPresenting) xrComfort = comfort;
  pipeline.apply();
  hud.refresh();
}
const keyToggles = { 1: 'lowres', 2: 'palette', 3: 'snap', 4: 'affine', 5: 'steppedAnim', 6: 'scanlines' };

// ---------- flat preview controls ----------
const flat = { yaw: 0, pitch: 0, lean: new THREE.Vector2() };
const held = new Set();
addEventListener('keydown', (e) => {
  if (keyToggles[e.key]) toggle(keyToggles[e.key]);
  if (e.key.toLowerCase() === 'm') setMode(!settings.comfort);
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
  if (needAnchor || !readHead()) return pipeline.setFade(transFade);
  const d = Math.hypot(headPos.x - PLAY_SPOT.x, headPos.z - PLAY_SPOT.y);
  pipeline.setFade(Math.max(transFade, (d - LEAN_LIMIT) / 0.15));
}

// Where the player's head is and which way they face (for placing dialogue).
const headOut = { pos: new THREE.Vector3(), yaw: 0 };
function getHead() {
  if (renderer.xr.isPresenting && readHead()) {
    headEuler.setFromQuaternion(headQuat, 'YXZ');
    headOut.pos.copy(headPos);
    headOut.yaw = headEuler.y;
  } else {
    headOut.pos.copy(camera.position);
    headOut.yaw = flat.yaw;
  }
  return headOut;
}

const ui = createUI({
  renderer,
  scene,
  camera,
  hitMeshes: room.hitMeshes,
  getHead,
  onAction(name, ...args) {
    if (name === 'goto') goTo(args[0], args[1]);
    else if (room.onAction) room.onAction(name, ...args);
  },
});

renderer.xr.addEventListener('sessionstart', () => {
  ui.onSessionStart();
  if (help && !broken) help.style.display = 'none';
  needAnchor = true;
  anchorFrames = 0;
  pipeline.setFade(0);
  setMode(xrComfort);
});
renderer.xr.addEventListener('sessionend', () => {
  world.position.set(0, 0, 0);
  world.rotation.set(0, 0, 0);
  PLAY_SPOT.set(0, 0);
  pipeline.setFade(0);
  ui.onSessionEnd();
  settings.comfort = false; // flat screen stays fully authentic
  pipeline.apply();
  hud.refresh();
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
    // Either thumbstick click: switch Comfort / Authentic.
    const stick = !!(gp.buttons[3] && gp.buttons[3].pressed);
    if (stick && !prevPressed[src.handedness + 'stick']) setMode(!settings.comfort);
    prevPressed[src.handedness + 'stick'] = stick;
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
    drawErrorCard();
    placeErrorCard();
    renderer.render(errScene, camera);
  }
});

function frame() {
  const now = performance.now();
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  transFade = updateTransition(dt);

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
    ui.update(dt);
  } else {
    updateFlat(dt);
    ui.update(dt);
    pipeline.setFade(transFade);
    pipeline.renderFlat(scene, camera);
  }
}
