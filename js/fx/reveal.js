// Reveal-on-scroll: elements rise out of the sand as they enter the viewport.
// Siblings get a stagger index (--i). data-reveal="class" only toggles .is-in.
export function init({ reduced }) {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (reduced) { els.forEach((el) => el.classList.add('is-in', 'is-settled')); return; }

  const groups = new Map();
  for (const el of els) {
    const list = groups.get(el.parentElement) || [];
    el.style.setProperty('--i', String(list.length % 8));
    list.push(el);
    groups.set(el.parentElement, list);
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);
      el.classList.add('is-in');
      // once risen, let hover/tilt transitions respond without the stagger delay
      const settle = (ev) => { if (ev.target === el && ev.propertyName === 'transform') { el.classList.add('is-settled'); el.removeEventListener('transitionend', settle); } };
      el.addEventListener('transitionend', settle);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}
