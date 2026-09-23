// Generates index.html and en/index.html from templates/ + placeholders.json.
// The templates keep the {{PLACEHOLDER}} markers, so values can be changed and
// re-applied at any time. Empty values are left as markers.
// Context-aware: JSON-LD gets JSON escaping, href values get URL encoding
// (tel: numbers are stripped to digits), everything else gets HTML escaping.
import { readFileSync, writeFileSync } from 'node:fs';

const PAGES = ['index.html', 'en/index.html'];
// The icon sprite is inlined into each page: one request fewer, and external
// <use href="file.svg#id"> references are unreliable in some browsers.
const SPRITE = readFileSync('assets/svg/sprite.svg', 'utf8').trim()
  .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
const values = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync('placeholders.json', 'utf8')))
    .filter(([k, v]) => !k.startsWith('_') && String(v).trim() !== '')
    .map(([k, v]) => [k, String(v).trim()]),
);

const TOKEN = /\{\{([A-Z0-9_]+)\}\}/g;
const html = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const json = (s) => JSON.stringify(s).slice(1, -1).replace(/</g, '\\u003c');
const fill = (text, escape) => text.replace(TOKEN, (m, k) => (k in values ? escape(values[k], k) : m));

const left = new Set();
for (const page of PAGES) {
  let src = readFileSync(`templates/${page}`, 'utf8');

  // 1. JSON-LD blocks
  src = src.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g,
    (_, a, body, b) => a + fill(body, json) + b);

  // 2. href attributes
  src = src.replace(/href="([^"]*)"/g, (_, url) => {
    if (url.startsWith('tel:')) return `href="${fill(url, (v) => v.replace(/[^+\d]/g, ''))}"`;
    const q = url.indexOf('?');
    if (q === -1) return `href="${fill(url, html)}"`;
    return `href="${fill(url.slice(0, q), html)}${fill(url.slice(q), (v) => encodeURIComponent(v))}"`;
  });

  // 3. everything else
  src = fill(src, html);

  // 4. inline the sprite
  src = src.replace(/href="(?:\.\.\/)?assets\/svg\/sprite\.svg#/g, 'href="#');
  src = src.replace(/<body>\n/, `<body>\n  ${SPRITE}\n`);
  src = src.replace('<!doctype html>\n',
    `<!doctype html>\n<!-- GENERATED from templates/${page} + placeholders.json by \`npm run fill\`. Edit those, not this file. -->\n`);
  writeFileSync(page, src);
  for (const [, k] of src.matchAll(TOKEN)) left.add(k);
}

console.log(`Generated ${PAGES.join(' + ')} with ${Object.keys(values).length} value(s).`);
console.log(left.size ? `Still open: ${[...left].sort().join(', ')}` : 'All placeholders filled.');
