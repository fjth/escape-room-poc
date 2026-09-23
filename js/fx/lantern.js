// Page-wide torchlight (desktop): once you leave the hero, a warm light keeps
// following the pointer and reveals hieroglyph columns carved into the walls.
const GLYPHS = [...'𓀀𓀁𓁐𓂀𓂋𓂝𓃀𓃭𓄿𓅓𓅱𓆣𓆑𓆓𓇋𓇳𓈖𓉐𓊃𓊪𓋴𓌳𓍯𓎛𓏏𓐍'];
const column = (n) => Array.from({ length: n }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');

export function init({ reduced }) {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;

  const walls = document.createElement('div');
  walls.className = 'tomb-walls';
  walls.setAttribute('aria-hidden', 'true');
  const glow = document.createElement('div');
  glow.className = 'lantern';
  glow.setAttribute('aria-hidden', 'true');
  document.body.prepend(walls);
  document.body.append(glow);

  const PARALLAX = 0.35;
  let built = 0;
  const build = () => {
    // enough glyphs to cover the viewport plus the parallax travel; only grow
    const n = Math.ceil((root.scrollHeight * PARALLAX + innerHeight) / 40) + 4;
    if (n <= built) return;
    built = n + 20;
    walls.innerHTML = ['l', 'r'].map((side) =>
      `<div class="tomb-walls__col tomb-walls__col--${side}"><p>${column(built)}</p><p>${column(built)}</p></div>`).join('');
  };
  build();
  addEventListener('load', build);
  new ResizeObserver(() => build()).observe(document.body);

  const s = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, f: 0, running: false };
  const frame = (t) => {
    s.x += (s.tx - s.x) * 0.16;
    s.y += (s.ty - s.y) * 0.16;
    s.f += (Math.random() - 0.5 - s.f) * 0.15;
    const r = 330 * (1 + 0.03 * Math.sin(t * 0.008) + 0.05 * s.f);
    root.style.setProperty('--mx', `${s.x.toFixed(1)}px`);
    root.style.setProperty('--my', `${s.y.toFixed(1)}px`);
    root.style.setProperty('--lr', `${r.toFixed(1)}px`);
    if (s.running) requestAnimationFrame(frame);
  };
  addEventListener('pointermove', (e) => {
    s.tx = e.clientX;
    s.ty = e.clientY;
    root.style.setProperty('--lantern-on', '1');
    if (!s.running && !document.hidden) { s.running = true; requestAnimationFrame(frame); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => root.style.setProperty('--lantern-on', '0'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) s.running = false; });

  let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      root.style.setProperty('--wall-y', `${(-scrollY * PARALLAX).toFixed(1)}px`);
    });
  }, { passive: true });
}
