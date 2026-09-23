// "Book now" buttons: a subtle magnetic pull toward the pointer (desktop), a
// soft ripple of light where you press, and a smooth scroll to in-page targets.
function ripple(el, x, y) {
  const s = document.createElement('span');
  s.className = 'sarco__ripple';
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  el.append(s);
  s.addEventListener('animationend', () => s.remove());
}

export function init({ reduced }) {
  if (reduced) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.querySelectorAll('.sarco').forEach((el) => {
    if (fine) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.setProperty('--pull-x', `${(dx * 6).toFixed(1)}px`);
        el.style.setProperty('--pull-y', `${(dy * 4).toFixed(1)}px`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.removeProperty('--pull-x');
        el.style.removeProperty('--pull-y');
      });
    }
    el.addEventListener('pointerdown', (e) => {
      const r = el.getBoundingClientRect();
      ripple(el, e.clientX - r.left, e.clientY - r.top);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') ripple(el, el.offsetWidth / 2, el.offsetHeight / 2);
    });
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-sarco]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = link.getAttribute('href');
    const target = href.startsWith('#') && document.querySelector(href);
    if (!target) return;
    // also scrolls when the URL already ends in this #hash
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  });
}
