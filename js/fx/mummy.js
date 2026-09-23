// Easter egg: a sarcophagus beside the FAQ that is clearly not empty. Now and
// then its lid rattles, dust falls and eyes glint through the mask. Hover it
// too long (desktop) or click/tap it: the mummy drifts out of the dark, then
// slams its head into your screen — the glass cracks, the page shakes.
// Reduced motion: no rattling, and a gentle static reveal instead of the scare.
import { t } from '../strings.js';
import { toast } from './toast.js';
import { roar, impact } from './audio.js';
import { mummySVG, MUMMY_SIZE } from './mummy-art.js';

const DWELL_MS = 2600;
const SCARE_MS = 3200;
const HIT = 0.44; // moment of impact, as a fraction of SCARE_MS

// Render the (filter-heavy) SVG once into a bitmap, so the scare animates smoothly.
let artPromise = null;
function renderArt() {
  artPromise ||= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = 1.5;
      const c = document.createElement('canvas');
      c.width = MUMMY_SIZE.w * scale;
      c.height = MUMMY_SIZE.h * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c);
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mummySVG())}`;
  });
  return artPromise;
}

// Cracked glass around the point of impact (cx, cy), in viewport pixels:
// long jagged rays that fork, a few rings near the centre, dense splinters
// at the impact point and some displaced shards catching the light.
function crackSVG(w, h, cx, cy) {
  const rand = (a, b) => a + Math.random() * (b - a);
  const R = Math.hypot(w, h);
  const lines = [];
  const rays = 20 + ((Math.random() * 8) | 0);
  const hubs = []; // points on each ray at given radii, for the rings
  const walk = (x, y, ang, len, jag) => {
    const pts = [[x, y]];
    for (let d = 0; d < len;) {
      const step = rand(8, 26) * (1 + d / 260);
      ang += rand(-jag, jag);
      x += Math.cos(ang) * step; y += Math.sin(ang) * step; d += step;
      pts.push([x, y]);
    }
    return pts;
  };
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + rand(-0.12, 0.12);
    const len = R * (Math.random() < 0.4 ? rand(0.5, 1) : rand(0.08, 0.35));
    const ray = walk(cx, cy, a, len, 0.14);
    lines.push(ray);
    hubs.push([22, 58, 118].map((r) => ray.find(([x, y]) => Math.hypot(x - cx, y - cy) >= r)));
    for (let k = 0; k < 3; k++) { // forks
      if (Math.random() < 0.55) {
        const at = ray[(2 + Math.random() * (ray.length - 3)) | 0];
        if (at) lines.push(walk(at[0], at[1], a + rand(-0.7, 0.7), rand(30, 200), 0.2));
      }
    }
  }
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < rays; i++) {
      const p = hubs[i][r], q = hubs[(i + 1) % rays][r];
      if (!p || !q || Math.random() < 0.2 + r * 0.25) continue;
      lines.push([p, [(p[0] + q[0]) / 2 + rand(-5, 5), (p[1] + q[1]) / 2 + rand(-5, 5)], q]);
    }
  }
  for (let i = 0; i < 40; i++) { // splinters at the impact point
    const a = rand(0, Math.PI * 2), r1 = rand(0, 16), r2 = r1 + rand(5, 22);
    lines.push([[cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], [cx + Math.cos(a + rand(-0.3, 0.3)) * r2, cy + Math.sin(a + rand(-0.3, 0.3)) * r2]]);
  }
  const d = lines.map((l) => `M${l.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`).join('');
  let shards = '';
  for (let i = 0; i < rays; i++) { // displaced shards between rings: some catch light, some shadow
    const p1 = hubs[i][0], p2 = hubs[i][1], q2 = hubs[(i + 1) % rays][1], q1 = hubs[(i + 1) % rays][0];
    if (!p1 || !p2 || !q1 || !q2 || Math.random() < 0.5) continue;
    const light = Math.random() < 0.6;
    shards += `<path d="M${p1.join(' ')}L${p2.join(' ')}L${q2.join(' ')}L${q1.join(' ')}Z" fill="${light ? `rgba(255,255,255,${rand(0.05, 0.16).toFixed(2)})` : `rgba(0,0,0,${rand(0.15, 0.35).toFixed(2)})`}"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <radialGradient id="crack-glow"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".4" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${shards}
    <circle cx="${cx}" cy="${cy}" r="46" fill="url(#crack-glow)"/>
    <path d="${d}" stroke="rgba(0,0,0,.55)" stroke-width="1.8" fill="none" transform="translate(1 1.3)" stroke-linejoin="round"/>
    <path d="${d}" stroke="rgba(255,255,255,.82)" stroke-width=".9" fill="none" stroke-linejoin="round"/>
  </svg>`;
}

function shake(n, amp) {
  return Array.from({ length: n }, (_, i) => {
    const a = i === 0 || i === n - 1 ? 0 : amp * (1 - i / n) ** 1.4;
    return { transform: `translate(${((Math.random() * 2 - 1) * a).toFixed(1)}px, ${((Math.random() * 2 - 1) * a).toFixed(1)}px) rotate(${((Math.random() * 2 - 1) * a * 0.04).toFixed(2)}deg)` };
  });
}

export function init({ reduced }) {
  const coffin = document.querySelector('[data-coffin]');
  if (!coffin) return;
  let overlay = null;
  let armed = true;
  let dwell = 0;
  let running = [];
  let timers = [];

  // pre-render the face once the coffin is near, so the scare starts instantly
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); renderArt(); } }, { rootMargin: '600px' }).observe(coffin);

  // --- the hints: a restless lid, falling dust, glinting eyes -------------
  const dustFall = (n) => {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('span');
      d.className = 'coffin-dust';
      d.style.left = `${20 + Math.random() * 60}%`;
      d.style.top = `${Math.random() * 30}%`;
      coffin.append(d);
      d.animate([{ transform: 'translateY(0)', opacity: 0.9 }, { transform: `translate(${(Math.random() - 0.5) * 14}px, ${40 + Math.random() * 50}px)`, opacity: 0 }],
        { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.4,0,1,1)' }).onfinish = () => d.remove();
    }
  };
  if (!reduced) {
    let visible = false;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(coffin);
    const hint = () => {
      if (visible && armed && !coffin.classList.contains('is-agitated')) {
        coffin.classList.add('is-rattling');
        dustFall(5);
        setTimeout(() => coffin.classList.remove('is-rattling'), 900);
      }
      setTimeout(hint, 5000 + Math.random() * 4000);
    };
    setTimeout(hint, 2500);

    // lingering on it makes it more and more restless... then it opens
    coffin.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !armed) return;
      coffin.classList.add('is-agitated');
      dustFall(3);
      dwell = setTimeout(scare, DWELL_MS);
    });
    coffin.addEventListener('pointerleave', () => {
      clearTimeout(dwell);
      coffin.classList.remove('is-agitated');
    });
  }
  coffin.addEventListener('click', scare);

  function build(art) {
    const el = document.createElement('div');
    el.className = 'mummy-scare';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="mummy-scare__face"></div><div class="mummy-scare__crack"></div><div class="mummy-scare__flash"></div><div class="mummy-scare__grain"></div>';
    if (art) el.querySelector('.mummy-scare__face').append(art);
    document.body.append(el);
    return el;
  }

  function finish() {
    running.forEach((a) => a.cancel());
    timers.forEach(clearTimeout);
    running = [];
    timers = [];
    overlay?.classList.remove('is-active', 'is-impact');
    document.getElementById('main')?.getAnimations().forEach((a) => a.cancel());
    removeEventListener('keydown', onKey);
    toast(t('mummyMsg'));
    setTimeout(() => { coffin.classList.remove('is-open'); armed = true; }, 7000);
  }
  function onKey(e) { if (e.key === 'Escape') finish(); }

  async function scare() {
    if (!armed) return;
    armed = false;
    clearTimeout(dwell);
    coffin.classList.remove('is-agitated', 'is-rattling');
    coffin.classList.add('is-open');
    const art = await renderArt();
    overlay ||= build(art);
    overlay.classList.add('is-active');
    addEventListener('keydown', onKey);
    const face = overlay.querySelector('.mummy-scare__face');
    const crack = overlay.querySelector('.mummy-scare__crack');
    crack.innerHTML = '';

    if (reduced) {
      running = [
        overlay.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2200 }),
        face.animate([{ transform: 'scale(.9)' }, { transform: 'scale(.9)' }], { duration: 2200 }),
      ];
      running[0].onfinish = finish;
      return;
    }

    const T = SCARE_MS;
    roar(T * HIT / 1000 - 0.05);
    running = [
      // darkness falls, holds, lifts
      overlay.animate([{ opacity: 0 }, { opacity: 1, offset: 0.07 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], { duration: T }),
      // it drifts out of the dark... hesitates... and lunges into the glass
      face.animate([
        { transform: 'translateY(14%) scale(.14)', filter: 'blur(10px) brightness(.15)', opacity: 0 },
        { transform: 'translateY(9%) scale(.3)', filter: 'blur(4px) brightness(.45)', opacity: 0.9, offset: 0.26, easing: 'ease-in-out' },
        { transform: 'translateY(8%) scale(.34)', filter: 'blur(2px) brightness(.55)', opacity: 1, offset: HIT - 0.07, easing: 'cubic-bezier(.9,0,1,.6)' },
        { transform: 'translateY(2%) scale(1.95)', filter: 'blur(3px) brightness(1.5)', opacity: 1, offset: HIT },
        { transform: 'translateY(3%) scale(1.74)', filter: 'blur(0px) brightness(1.3)', opacity: 1, offset: HIT + 0.03 },
        { transform: 'translateY(4%) scale(1.8)', filter: 'blur(0px) brightness(1.15)', opacity: 1, offset: HIT + 0.06 },
        { transform: 'translateY(7%) scale(1.83)', filter: 'blur(0px) brightness(1)', opacity: 1, offset: 0.84 },
        { transform: 'translateY(9%) scale(1.9)', filter: 'blur(6px) brightness(.1)', opacity: 0 },
      ], { duration: T, fill: 'both' }),
    ];
    running[0].onfinish = finish;

    // impact: the glass cracks, a hard shake, one white flash
    timers.push(setTimeout(() => {
      impact();
      const w = innerWidth, h = innerHeight;
      crack.innerHTML = crackSVG(w, h, w * (0.47 + Math.random() * 0.06), h * (0.34 + Math.random() * 0.06));
      overlay.classList.add('is-impact');
      timers.push(setTimeout(() => overlay.classList.remove('is-impact'), 240));
      running.push(
        crack.animate([{ opacity: 1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)', offset: 0.04 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: T * (1 - HIT) + 500, fill: 'both' }),
        overlay.querySelector('.mummy-scare__flash').animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 170, easing: 'ease-out' }),
        overlay.animate(shake(18, 34), { duration: 560, composite: 'add' }),
      );
      const main = document.getElementById('main');
      if (main) running.push(main.animate(shake(12, 14), { duration: 420 }));
      // pressed against the glass, it twitches
      timers.push(setTimeout(() => running.push(face.animate(shake(10, 7), { duration: 900, composite: 'add', iterations: 1 })), 380));
    }, T * HIT));
  }
}
