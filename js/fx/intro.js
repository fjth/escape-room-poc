// First-visit intro: the sealed tomb doors part (the animation itself is pure
// CSS on html.intro). Here we only remember the visit, let any input skip it,
// and clean up. ?intro in the URL replays it.
export function init() {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  try { localStorage.setItem('introSeen', '1'); } catch { /* private mode */ }

  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  const end = () => {
    clearTimeout(timer);
    root.classList.remove('intro');
    events.forEach((ev) => removeEventListener(ev, end));
  };
  const timer = setTimeout(end, 3200);
  events.forEach((ev) => addEventListener(ev, end, { passive: true }));
}
