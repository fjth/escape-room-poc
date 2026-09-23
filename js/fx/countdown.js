// Opening countdown: only active when <html data-opening-date> is a future date.
// For previewing, ?opening=2026-12-01 overrides the date.
import { t } from '../strings.js';

export function init({ lang }) {
  const section = document.querySelector('[data-countdown]');
  if (!section) return;
  const raw = new URLSearchParams(location.search).get('opening') || document.documentElement.dataset.openingDate;
  const target = new Date(raw);
  if (Number.isNaN(target.getTime()) || target <= new Date()) return;

  document.documentElement.classList.add('is-coming-soon');
  section.hidden = false;

  const label = section.querySelector('[data-opening-label]');
  label.dateTime = target.toISOString();
  label.textContent = target.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // All booking CTAs become "notify me" and point at the signup.
  document.querySelectorAll('[data-cta]').forEach((a) => {
    a.setAttribute('href', `#${section.id}`);
    const lbl = a.querySelector('[data-cta-label]') || a;
    lbl.textContent = t('notifyMe');
  });

  const units = Object.fromEntries([...section.querySelectorAll('[data-unit]')].map((el) => [el.dataset.unit, el]));
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    units.d.textContent = d;
    units.h.textContent = pad(h);
    units.m.textContent = pad(m);
    units.s.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);
}
