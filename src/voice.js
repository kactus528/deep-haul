// Text blips, 16-bit style: a short chirp per couple of letters while text
// types out. DORIS chirps high and square; Gus mumbles low and soft.
// (A stand-in until DORIS gets real speech-chip lines.)

let ctx = null;
let master = null;

export function initAudio() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {
    ctx = null;
  }
}

function tone(type, f0, f1, dur, vol) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function blip(speaker) {
  if (speaker === 'DORIS') {
    const f = 560 + Math.random() * 220;
    tone('square', f, f * 0.82, 0.05, 0.035);
  } else {
    const f = 140 + Math.random() * 45;
    tone('triangle', f, f * 0.9, 0.06, 0.09);
  }
}

export function click() {
  tone('square', 1200, 900, 0.03, 0.03);
}

export function confirm() {
  tone('square', 700, 1400, 0.07, 0.03);
}
