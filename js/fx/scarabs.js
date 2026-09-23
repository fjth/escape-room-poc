// Hidden scarabs mini-game: find all five for a discount code that is applied
// to the booking automatically. Entirely optional; progress is remembered in
// localStorage when available. A found scarab bursts and flies to the header.
import { t } from '../strings.js';
import { toast } from './toast.js';
import { chime } from './audio.js';

const KEY = 'scarabsFound';
const TOTAL = 5;

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
}
function save(found) {
  try { localStorage.setItem(KEY, JSON.stringify([...found])); } catch { /* private mode */ }
}

function burst(x, y) {
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    document.body.append(s);
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const d = 30 + Math.random() * 50;
    s.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(.2)`, opacity: 0 },
    ], { duration: 650 + Math.random() * 300, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => s.remove();
  }
}

function fly(from, to, spriteHref) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'scarab-flight';
  el.innerHTML = `<svg aria-hidden="true"><use href="${spriteHref}"/></svg>`;
  Object.assign(el.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  document.body.append(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const s = b.width / a.width;
  return new Promise((resolve) => {
    el.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 80}px) scale(1.8) rotate(200deg)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(360deg)` },
    ], { duration: 1100, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => { el.remove(); resolve(); };
  });
}

export function init({ reduced }) {
  const buttons = [...document.querySelectorAll('[data-scarab]')];
  const progress = document.querySelector('.egg-progress');
  if (!buttons.length || !progress) return;
  const found = load();
  const spriteHref = buttons[0].querySelector('use').getAttribute('href');
  const code = document.documentElement.dataset.eggCode;
  const pct = document.documentElement.dataset.eggDiscount || '10';
  const bookingId = document.querySelector('.section--booking')?.id;

  progress.innerHTML = Array.from({ length: TOTAL }, () => `<svg aria-hidden="true"><use href="${spriteHref}"/></svg>`).join('');
  progress.setAttribute('role', 'img');
  const slots = [...progress.children];

  const render = (upTo = found.size) => {
    buttons.forEach((b) => {
      const isFound = found.has(b.dataset.scarab);
      b.classList.toggle('is-found', isFound);
      b.setAttribute('aria-pressed', String(isFound));
    });
    slots.forEach((s, i) => s.classList.toggle('is-found', i < upTo));
    progress.setAttribute('aria-label', t('scarabProgress', { n: found.size }));
    progress.hidden = found.size === 0;
  };
  render();
  if (found.size >= TOTAL) document.dispatchEvent(new CustomEvent('scarabs:complete', { detail: { silent: true } }));

  buttons.forEach((b) => b.addEventListener('click', async () => {
    if (found.has(b.dataset.scarab)) return;
    found.add(b.dataset.scarab);
    save(found);
    const n = found.size;
    chime(n >= TOTAL);
    if (!reduced) {
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      render(n - 1); // show the slot filling only once the scarab lands
      await fly(b, slots[n - 1], spriteHref);
      slots[n - 1].classList.add('is-landing');
      setTimeout(() => slots[n - 1].classList.remove('is-landing'), 400);
    }
    render();
    if (n >= TOTAL) {
      document.dispatchEvent(new CustomEvent('scarabs:complete'));
      toast(t('scarabAll', { code, pct }), [
        { label: t('bookWithDiscount'), primary: true, onClick: () => { if (bookingId) location.hash = bookingId; } },
        { label: t('close') },
      ]);
    } else {
      toast(t('scarabFound', { n }));
    }
  }));
}
