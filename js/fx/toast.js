// Small status message at the bottom of the screen (shared by the easter eggs).
let el;
let timer;

export function toast(html, actions = []) {
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  clearTimeout(timer);
  el.innerHTML = `<p style="margin:0">${html}</p>`;
  const hide = () => el.classList.remove('is-visible');
  if (actions.length) {
    const row = document.createElement('div');
    row.className = 'toast__actions';
    for (const { label, primary, onClick } of actions) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn btn--sm ${primary ? 'btn--gold' : 'btn--ghost'}`;
      b.textContent = label;
      b.addEventListener('click', () => { hide(); onClick?.(); });
      row.append(b);
    }
    el.append(row);
  } else {
    timer = setTimeout(hide, 3600);
  }
  requestAnimationFrame(() => el.classList.add('is-visible'));
}
