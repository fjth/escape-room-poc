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

export function init() {
  const btn = document.querySelector('[data-audio-toggle]');
  if (!btn) return;
  btn.querySelector('.sr-only').textContent = t('audioOff');
  btn.addEventListener('click', () => set(!on, btn));
}
