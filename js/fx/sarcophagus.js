// Sarcophagus CTA: on click the lid slides open before we navigate.
export function init({ reduced }) {
  if (reduced) return;
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-sarco]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    link.classList.add('is-opening');
    const href = link.getAttribute('href');
    setTimeout(() => {
      if (href.startsWith('#')) location.hash = href;
      else location.href = href;
      setTimeout(() => link.classList.remove('is-opening'), 900);
    }, 600);
  });
}
