// Papyrus unroll: CSS does the animation; we just open it once it's in view.
export function init({ reduced }) {
  const scrolls = document.querySelectorAll('[data-papyrus]');
  if (reduced) { scrolls.forEach((s) => s.classList.add('is-open')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-open');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -20% 0px' });
  scrolls.forEach((s) => io.observe(s));
}
