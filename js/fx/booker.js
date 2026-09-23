// DEMO booking widget: calendar, time slots, players, game language, discount
// code and a price summary. No real availability or payment — availability is
// faked deterministically per date so it looks plausible and stays stable.
import { lang, t } from '../strings.js';

const SLOTS = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];
const MONTHS_AHEAD = 3;
const locale = lang === 'nl' ? 'nl-NL' : 'en-GB';
const money = {
  whole: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  cents: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }),
  format: (n) => (Number.isInteger(n) ? money.whole : money.cents).format(n),
};
const parsePrice = (s) => {
  const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const hash = (str) => {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

function slotState(date, i) {
  const now = new Date();
  const [hh, mm] = SLOTS[i].split(':').map(Number);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm);
  if (start - now < 2 * 3600e3) return 'past';
  const weekend = [0, 5, 6].includes(date.getDay());
  return hash(`${key(date)}#${i}`) < (weekend ? 0.55 : 0.3) ? 'full' : 'free';
}
function dayStatus(date) {
  const free = SLOTS.filter((_, i) => slotState(date, i) === 'free').length;
  return free === 0 ? 'full' : free <= 2 ? 'few' : 'free';
}

export function init({ reduced }) {
  const root = document.querySelector('[data-booker]');
  if (!root) return;
  root.hidden = false;
  document.querySelector('[data-booking-fallback]')?.setAttribute('hidden', '');

  const $ = (sel) => root.querySelector(sel);
  const form = $('[data-booker-form]');
  const grid = $('[data-cal-grid]');
  const slotsEl = $('[data-slots]');
  const playersEl = $('[data-players]');
  const promo = $('[data-promo]');
  const promoMsg = $('[data-promo-msg]');
  const errorEl = $('[data-booker-error]');
  const summary = $('.summary');
  const done = $('[data-booker-done]');

  const min = parseInt(root.dataset.min, 10) || 2;
  const max = parseInt(root.dataset.max, 10) || 6;
  const attr = (n) => root.getAttribute(`data-${n}`);
  const prices = { two: parsePrice(attr('price-2')), mid: parsePrice(attr('price-3-4')), big: parsePrice(attr('price-5')) };
  const eggCode = (document.documentElement.dataset.eggCode || '').trim().toUpperCase();
  const eggPct = parseFloat(document.documentElement.dataset.eggDiscount) || 10;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today); lastDay.setMonth(lastDay.getMonth() + MONTHS_AHEAD);
  const state = { view: new Date(today.getFullYear(), today.getMonth(), 1), date: null, slot: null, players: Math.min(max, Math.max(min, 4)), discount: false };

  // weekday header, Monday first
  const wd = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  $('[data-cal-week]').innerHTML = Array.from({ length: 7 }, (_, i) => `<span>${wd.format(new Date(2024, 0, 1 + i)).replace('.', '')}</span>`).join('');

  const fmtMonth = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const fmtFull = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const fmtShort = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  function renderCalendar() {
    const { view } = state;
    $('[data-cal-month]').textContent = fmtMonth.format(view);
    $('[data-cal-prev]').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    $('[data-cal-next]').disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > lastDay;
    const offset = (view.getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    let html = '<span></span>'.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const out = date < today || date > lastDay;
      const status = out ? 'full' : dayStatus(date);
      const selected = state.date && key(state.date) === key(date);
      const label = `${fmtFull.format(date)}${status === 'full' ? `, ${t('bookFull')}` : status === 'few' ? `, ${t('bookFew')}` : ''}`;
      html += `<button type="button" class="cal__day${key(date) === key(today) ? ' is-today' : ''}" data-day="${d}" data-status="${status}" aria-pressed="${selected}" aria-label="${label}"${status === 'full' ? ' disabled' : ''}>${d}</button>`;
    }
    grid.innerHTML = html;
  }

  function renderSlots() {
    if (!state.date) { slotsEl.innerHTML = `<p class="booker__hint">${t('bookPickDate')}</p>`; return; }
    slotsEl.innerHTML = SLOTS.map((s, i) => {
      const st = slotState(state.date, i);
      const note = st === 'full' ? t('bookTaken') : st === 'past' ? '—' : '';
      return `<button type="button" class="slot" style="--i:${i}" data-slot="${s}" aria-pressed="${state.slot === s}"${st !== 'free' ? ` disabled aria-label="${s}, ${t('bookTaken')}"` : ''}>${s}${note ? `<small>${note}</small>` : ''}</button>`;
    }).join('');
    slotsEl.classList.remove('is-fresh');
    void slotsEl.offsetWidth;
    slotsEl.classList.add('is-fresh');
  }

  function total() {
    const p = state.players;
    const base = p <= 2 ? prices.two : p <= 4 ? prices.mid : prices.big;
    if (base == null) return null;
    const off = state.discount ? Math.round(base * eggPct) / 100 : 0;
    return { base, off, total: base - off };
  }

  function renderSummary() {
    playersEl.textContent = state.players;
    root.querySelector('[data-step="-1"]').disabled = state.players <= min;
    root.querySelector('[data-step="1"]').disabled = state.players >= max;
    const gameLang = form.elements['game-lang'].value;
    $('[data-sum-when]').textContent = state.date
      ? (state.slot ? t('bookWhen', { date: fmtShort.format(state.date), time: state.slot }) : fmtShort.format(state.date))
      : '—';
    $('[data-sum-group]').textContent = t('bookGroup', { n: state.players, lang: t(gameLang === 'nl' ? 'langNl' : 'langEn') });
    const sum = total();
    const disc = $('[data-sum-discount]');
    disc.hidden = !(sum && state.discount);
    if (sum && state.discount) $('[data-sum-discount-val]').textContent = `−${money.format(sum.off)}`;
    $('[data-sum-total]').textContent = sum ? money.format(sum.total) : '—';
  }

  function applyCode(code, { celebrate = false } = {}) {
    const ok = !!eggCode && !eggCode.startsWith('{{') && code.trim().toUpperCase() === eggCode;
    promoMsg.classList.toggle('is-error', !ok && !!code.trim());
    promoMsg.textContent = ok ? t('bookCodeOk', { pct: eggPct }) : code.trim() ? t('bookCodeBad') : '';
    state.discount = ok;
    renderSummary();
    if (ok && celebrate && !reduced) {
      summary.classList.remove('is-flash');
      void summary.offsetWidth;
      summary.classList.add('is-flash');
    }
  }

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.cal__day');
    if (!b || b.disabled) return;
    state.date = new Date(state.view.getFullYear(), state.view.getMonth(), +b.dataset.day);
    state.slot = null;
    errorEl.textContent = '';
    renderCalendar(); renderSlots(); renderSummary();
    grid.querySelector(`[data-day="${b.dataset.day}"]`)?.focus();
  });
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    state.slot = b.dataset.slot;
    errorEl.textContent = '';
    slotsEl.querySelectorAll('.slot').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    renderSummary();
  });
  $('[data-cal-prev]').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
  $('[data-cal-next]').addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });
  root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    state.players = Math.min(max, Math.max(min, state.players + Number(b.dataset.step)));
    renderSummary();
  }));
  form.addEventListener('change', renderSummary);
  $('[data-promo-apply]').addEventListener('click', () => applyCode(promo.value, { celebrate: true }));
  promo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(promo.value, { celebrate: true }); } });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.date || !state.slot) {
      errorEl.textContent = t('bookMissing');
      (state.date ? slotsEl.querySelector('.slot:not(:disabled)') : grid.querySelector('.cal__day:not(:disabled)'))?.focus();
      return;
    }
    const btn = form.querySelector('.sarco');
    btn.classList.add('is-opening');
    setTimeout(() => {
      btn.classList.remove('is-opening');
      const sum = total();
      $('[data-done-text]').textContent = t('bookDone', {
        when: t('bookWhen', { date: fmtFull.format(state.date), time: state.slot }),
        group: t('bookGroup', { n: state.players, lang: t(form.elements['game-lang'].value === 'nl' ? 'langNl' : 'langEn') }),
        total: sum ? money.format(sum.total) : '—',
      });
      form.hidden = true;
      done.hidden = false;
      done.focus();
    }, reduced ? 0 : 650);
  });
  $('[data-booker-reset]').addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    state.slot = null;
    renderSlots(); renderSummary();
  });

  // All five scarabs found → the code is filled in and applied automatically.
  document.addEventListener('scarabs:complete', (e) => {
    promo.value = eggCode;
    applyCode(eggCode, { celebrate: !e.detail?.silent });
  });

  renderCalendar(); renderSlots(); renderSummary();
}
