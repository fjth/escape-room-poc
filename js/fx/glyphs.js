// Hieroglyph decode headings. The real heading text stays in the DOM (sr-only)
// from the start; the glyph → letter effect is an aria-hidden visual layer.
const GLYPHS = [...'𓀀𓀁𓁐𓂀𓂋𓂝𓃀𓃭𓄿𓅓𓅱𓆣𓆑𓆓𓇋𓇳𓈖𓉐𓊃𓊪𓋴𓌳𓍯𓎛𓏏𓐍'];
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

function prepare(h) {
  const text = h.textContent.trim();
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const vis = document.createElement('span');
  vis.className = 'decode';
  vis.setAttribute('aria-hidden', 'true');
  const chars = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { vis.append(' '); continue; }
    const word = document.createElement('span');
    word.className = 'decode__word';
    for (const ch of part) {
      const c = document.createElement('span');
      c.className = 'decode__ch is-glyph';
      c.textContent = ch;
      c.dataset.g = pick();
      word.append(c);
      chars.push(c);
    }
    vis.append(word);
  }
  h.replaceChildren(sr, vis);
  return chars;
}

function decode(chars) {
  chars.forEach((c, i) => {
    const start = 120 + i * 55 + Math.random() * 90;
    // shuffle through a couple of glyphs, then settle on the real letter
    setTimeout(() => (c.dataset.g = pick()), start * 0.5);
    setTimeout(() => (c.dataset.g = pick()), start * 0.8);
    setTimeout(() => c.classList.remove('is-glyph'), start);
  });
}

export function init({ reduced }) {
  if (reduced) return;
  const heads = document.querySelectorAll('[data-decode]');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      decode(e.target._chars);
    }
  }, { threshold: 0.6 });
  heads.forEach((h) => {
    h._chars = prepare(h);
    io.observe(h);
  });
}
