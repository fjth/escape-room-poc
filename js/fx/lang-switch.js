// Language switch: the gold pill slides across before we navigate (the rest of
// the page cross-fades via a view transition), and the #section is kept.
import { sectionMap } from '../strings.js';

function mappedHash(lang) {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = sectionMap[lang][id];
  return target ? `#${target}` : '';
}

export function init({ lang, reduced }) {
  const links = [...document.querySelectorAll('[data-lang-link]')];
  const bases = links.map((a) => a.getAttribute('href'));
  const update = () => links.forEach((a, i) => (a.href = bases[i] + mappedHash(lang)));
  update();
  addEventListener('hashchange', update);

  const sw = document.querySelector('.lang-switch');
  links.forEach((a) => a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    sw?.classList.add('is-switching');
    setTimeout(() => (location.href = a.href), reduced ? 0 : 280);
  }));
  // back/forward cache: undo the slide if the user returns to this page
  addEventListener('pageshow', () => sw?.classList.remove('is-switching'));

  // Keep the hash in sync while scrolling, so switching language lands on the same section.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        history.replaceState(null, '', e.target.id === 'top' ? location.pathname + location.search : `#${e.target.id}`);
        update();
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
}
