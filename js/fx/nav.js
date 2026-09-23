// Scroll-spy for the header nav: a soft gold pill slides to the section you're in.
export function init() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const indicator = nav.querySelector('.site-nav__indicator');
  const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.hash.slice(1), a]));
  let active = null;

  const place = () => {
    if (!active) return;
    const r = active.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    indicator.style.width = `${r.width}px`;
    indicator.style.transform = `translateX(${r.left - n.left}px)`;
  };
  const setActive = (a) => {
    if (a === active) return;
    active?.removeAttribute('aria-current');
    active = a || null;
    nav.classList.toggle('has-active', !!active);
    if (active) { active.setAttribute('aria-current', 'location'); place(); }
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(links.get(e.target.id));
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
}
