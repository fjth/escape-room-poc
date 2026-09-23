// Optional ambient audio: off by default, never autoplays. Synthesised with
// Web Audio (wind + low drone), so there is no audio file to download.
import { t } from '../strings.js';

let ac = null;
let master = null;
let noiseBuf = null;
let on = false;

function brownNoise(ctx, seconds) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function build() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain();
  master.gain.value = 0;
  master.connect(ac.destination);
  noiseBuf = brownNoise(ac, 4);

  // wind: looping brown noise through a slowly sweeping band-pass, with swells
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 380;
  band.Q.value = 0.8;
  const windGain = ac.createGain();
  windGain.gain.value = 0.45;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoAmt = ac.createGain();
  lfoAmt.gain.value = 0.25;
  lfo.connect(lfoAmt).connect(windGain.gain);
  const sweep = ac.createOscillator();
  sweep.frequency.value = 0.045;
  const sweepAmt = ac.createGain();
  sweepAmt.gain.value = 160;
  sweep.connect(sweepAmt).connect(band.frequency);
  src.connect(band).connect(windGain).connect(master);

  // drone: two slightly detuned low sines
  for (const f of [55, 55.35]) {
    const o = ac.createOscillator();
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.value = 0.035;
    o.connect(g).connect(master);
    o.start();
  }
  [src, lfo, sweep].forEach((n) => n.start());
}

function set(state, btn) {
  on = state;
  if (on && !ac) build();
  if (on) ac.resume();
  master.gain.setTargetAtTime(on ? 0.5 : 0, ac.currentTime, on ? 0.9 : 0.25);
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('.sr-only').textContent = on ? t('audioOn') : t('audioOff');
}

// Short stone-grinding burst (used by the FAQ slabs). Silent unless audio is on.
export function grind() {
  if (!on || !ac) return;
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, now);
  lp.frequency.exponentialRampToValueAtTime(300, now + 0.45);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.9, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  src.connect(lp).connect(g).connect(master);
  src.start(now, Math.random() * 3);
  src.stop(now + 0.55);
}

// Bright bell chime for a found scarab; a rising arpeggio when all are found.
export function chime(final = false) {
  if (!on || !ac) return;
  const now = ac.currentTime;
  const notes = final ? [659.25, 830.61, 987.77, 1318.51, 1661.22] : [1318.51, 1975.53];
  notes.forEach((f, i) => {
    const t0 = now + i * (final ? 0.11 : 0.08);
    for (const [mult, amp] of [[1, 0.22], [2.01, 0.06]]) {
      const o = ac.createOscillator();
      o.frequency.value = f * mult;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(amp, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + (final ? 2.2 : 1.4));
      o.connect(g).connect(master);
      o.start(t0);
      o.stop(t0 + 2.3);
    }
  });
}

function distortion(k) {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / curve.length) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

// The mummy: a low rumble that swells into a distorted roar at `lungeAt` seconds.
export function roar(lungeAt = 1.1) {
  if (!on || !ac) return;
  const now = ac.currentTime;
  const hit = now + lungeAt;

  const rumble = ac.createOscillator();
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(38, now);
  rumble.frequency.linearRampToValueAtTime(55, hit);
  const rlp = ac.createBiquadFilter();
  rlp.type = 'lowpass';
  rlp.frequency.value = 180;
  const rg = ac.createGain();
  rg.gain.setValueAtTime(0, now);
  rg.gain.linearRampToValueAtTime(0.5, hit);
  rg.gain.exponentialRampToValueAtTime(0.001, hit + 1.2);
  rumble.connect(rlp).connect(rg).connect(master);
  rumble.start(now);
  rumble.stop(hit + 1.3);

  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(1100, hit);
  bp.frequency.exponentialRampToValueAtTime(200, hit + 1.3);
  const shaper = ac.createWaveShaper();
  shaper.curve = distortion(60);
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0, hit);
  ng.gain.linearRampToValueAtTime(1.4, hit + 0.04);
  ng.gain.exponentialRampToValueAtTime(0.001, hit + 1.4);
  src.connect(bp).connect(shaper).connect(ng).connect(master);
  src.start(hit, Math.random() * 2);
  src.stop(hit + 1.5);

  const growl = ac.createOscillator();
  growl.type = 'sawtooth';
  growl.frequency.setValueAtTime(120, hit);
  growl.frequency.exponentialRampToValueAtTime(48, hit + 1.2);
  const glp = ac.createBiquadFilter();
  glp.type = 'lowpass';
  glp.frequency.value = 700;
  const gg = ac.createGain();
  gg.gain.setValueAtTime(0, hit);
  gg.gain.linearRampToValueAtTime(0.55, hit + 0.05);
  gg.gain.exponentialRampToValueAtTime(0.001, hit + 1.3);
  growl.connect(glp).connect(gg).connect(master);
  growl.start(hit);
  growl.stop(hit + 1.4);
}

// Head against glass: a dull thud and a sharp crackle of breaking glass.
export function impact() {
  if (!on || !ac) return;
  const now = ac.currentTime;
  const o = ac.createOscillator();
  o.frequency.setValueAtTime(95, now);
  o.frequency.exponentialRampToValueAtTime(38, now + 0.35);
  const og = ac.createGain();
  og.gain.setValueAtTime(1.1, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  o.connect(og).connect(master);
  o.start(now);
  o.stop(now + 0.45);
  // glass: short bursts of high-passed white noise
  const len = ac.sampleRate * 0.5;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const tt = i / ac.sampleRate;
    const crackle = Math.random() < 0.02 + 0.2 * Math.exp(-tt * 18) ? 1 : 0.15;
    d[i] = (Math.random() * 2 - 1) * crackle * Math.exp(-tt * 7);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2500;
  const g = ac.createGain();
  g.gain.value = 0.7;
  src.connect(hp).connect(g).connect(master);
  src.start(now);
}

export function init() {
  const btn = document.querySelector('[data-audio-toggle]');
  if (!btn) return;
  btn.querySelector('.sr-only').textContent = t('audioOff');
  btn.addEventListener('click', () => set(!on, btn));
}
