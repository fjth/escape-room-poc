// Procedurally rendered mummy face for the jump scare (original artwork, no
// external images). Bandage strips are drawn as a height map and lit with an
// SVG lighting filter from below, then eye sockets, pupils, a torn mouth with
// teeth and heavy shading are painted on top. Pure string output (no DOM).
const W = 800;
const H = 960;

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const f = (n) => n.toFixed(1);

const HEAD = 'M400 88C522 88 612 170 616 300C619 380 602 440 586 502C566 582 540 662 490 722C460 756 430 774 400 774C370 774 340 756 310 722C260 662 234 582 214 502C198 440 181 380 184 300C188 170 278 88 400 88Z';
const NECK = 'M288 700C300 790 276 846 110 902L40 960H760L690 902C524 846 500 790 512 700Z';

// bandage strips as a height map: dark edges, bright crown => rounded cloth
function strips() {
  let out = '';
  for (let y = 40; y < 1000; y += 26 + rnd() * 16) {
    const a = (rnd() - 0.5) * 0.7; // slope
    const w = 34 + rnd() * 22;
    const bow = (rnd() - 0.5) * 60;
    const y0 = y - a * 400, y1 = y + a * 400;
    const d = `M-40 ${f(y0)}Q400 ${f(y + bow)} 840 ${f(y1)}`;
    out += `<path d="${d}" stroke="#3a3a3a" stroke-width="${f(w)}" fill="none"/>`
      + `<path d="${d}" stroke="#707070" stroke-width="${f(w * 0.8)}" fill="none"/>`
      + `<path d="${d}" stroke="#b4b4b4" stroke-width="${f(w * 0.4)}" fill="none"/>`;
    if (rnd() < 0.35) { // a frayed loose end
      const x = 180 + rnd() * 440;
      out += `<path d="M${f(x)} ${f(y)}q${f(10 + rnd() * 20)} ${f(30 + rnd() * 40)} ${f(-5 + rnd() * 10)} ${f(70 + rnd() * 60)}" stroke="#9a9a9a" stroke-width="${f(8 + rnd() * 8)}" fill="none" stroke-linecap="round"/>`;
    }
  }
  return out;
}

function fringes() {
  let out = '';
  for (let i = 0; i < 9; i++) {
    const left = i % 2 === 0;
    const y = 180 + rnd() * 520;
    const x = left ? 214 - (y > 500 ? 0 : 20) + rnd() * 10 : 586 + (y > 500 ? 0 : 20) - rnd() * 10;
    const dx = (left ? -1 : 1) * (18 + rnd() * 40);
    const d = `M${f(x)} ${f(y)}q${f(dx)} ${f(30 + rnd() * 40)} ${f(dx * 0.6)} ${f(90 + rnd() * 90)}`;
    const w = 12 + rnd() * 12;
    out += `<path d="${d}" stroke="#262626" stroke-width="${f(w)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#9a9a9a" stroke-width="${f(w * 0.55)}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

function teeth() {
  let out = '';
  let x = 352;
  while (x < 450) {
    const w = 9 + rnd() * 9;
    const r = rnd();
    if (r > 0.22) { // some are missing
      const h = r > 0.8 ? 8 + rnd() * 6 : 16 + rnd() * 18; // some broken off short
      const tilt = (rnd() - 0.5) * 22;
      out += `<path d="M${f(x)} 596l${f(w)} ${f((rnd() - 0.5) * 4)}l${f(-2 - rnd() * 3)} ${f(h)}l${f(-w * 0.35)} ${f(3 + rnd() * 4)}l${f(-w * 0.4)} ${f(-4 - rnd() * 3)}z" transform="rotate(${f(tilt)} ${f(x + w / 2)} 596)" fill="url(#tooth)"/>`;
    }
    x += w + 2 + rnd() * 4;
  }
  x = 366;
  while (x < 436) {
    const w = 8 + rnd() * 7;
    if (rnd() > 0.4) {
      const h = 10 + rnd() * 14;
      out += `<path d="M${f(x)} 668l${f(w)} ${f(-2)}l${f(-2)} ${f(-h)}l${f(-w + 4)} ${f(2)}z" transform="rotate(${f((rnd() - 0.5) * 26)} ${f(x + w / 2)} 668)" fill="url(#tooth)" opacity=".8"/>`;
    }
    x += w + 5 + rnd() * 6;
  }
  return out;
}

export function mummySVG() {
  seed = 11;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="mouth"><path d="M334 604C346 584 366 578 382 590C394 576 414 580 426 592C440 578 464 588 472 608C478 632 466 658 446 670C424 684 378 686 356 672C336 658 326 630 334 604Z"/></clipPath>
    <clipPath id="sil"><path d="${HEAD}"/><path d="${NECK}"/></clipPath>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="cloth" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".035 .3" numOctaves="2" seed="4" result="fib"/>
      <feColorMatrix in="fib" type="luminanceToAlpha" result="fibA"/>
      <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="hA"/>
      <feComposite in="fibA" in2="hA" operator="arithmetic" k1="0" k2=".07" k3="1" k4="0" result="height"/>
      <feDiffuseLighting in="height" surfaceScale="7" diffuseConstant="1.25" lighting-color="#ffd9a8" result="lit">
        <fePointLight x="400" y="1180" z="240"/>
      </feDiffuseLighting>
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="9" result="dirt"/>
      <feColorMatrix in="dirt" values="0 0 0 0 .58  0 0 0 0 .5  0 0 0 0 .36  0 0 0 0 1" result="linen"/>
      <feColorMatrix in="dirt" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.35" result="stainA"/>
      <feFlood flood-color="#2a1d0e" result="stainC"/>
      <feComposite in="stainC" in2="stainA" operator="in" result="stain"/>
      <feBlend in="stain" in2="linen" mode="multiply" result="albedo"/>
      <feBlend in="lit" in2="albedo" mode="multiply" result="shaded"/>
      <feComposite in="shaded" in2="SourceAlpha" operator="in" result="clothed"/>
      <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="2" result="warp"/>
      <feDisplacementMap in="clothed" in2="warp" scale="26" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <radialGradient id="socket"><stop offset="0" stop-color="#000"/><stop offset=".55" stop-color="#050302" stop-opacity=".97"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="bloom"><stop offset="0" stop-color="#ffb347" stop-opacity=".9"/><stop offset=".4" stop-color="#e2500f" stop-opacity=".35"/><stop offset="1" stop-color="#b3200a" stop-opacity="0"/></radialGradient>
    <radialGradient id="maw" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#1a0802"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="mawshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".85"/><stop offset=".35" stop-color="#000" stop-opacity=".25"/><stop offset=".7" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></linearGradient>
    <linearGradient id="tooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d0c"/><stop offset=".4" stop-color="#9c8756"/><stop offset="1" stop-color="#4f3d1c"/></linearGradient>
    <radialGradient id="toplight" cx=".5" cy=".95" r=".85"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".92"/></radialGradient>
    <radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></radialGradient>
  </defs>

  <!-- 1. lit bandages (height map -> lighting filter) -->
  <g filter="url(#cloth)">
    <g clip-path="url(#sil)">
      <rect width="${W}" height="${H}" fill="#505050"/>
      ${strips()}
      <!-- facial structure pushed through the wraps -->
      <g filter="url(#soft)">
        <ellipse cx="400" cy="470" rx="44" ry="96" fill="#fff" opacity=".55"/>
        <ellipse cx="300" cy="520" rx="70" ry="40" fill="#fff" opacity=".35"/>
        <ellipse cx="500" cy="520" rx="70" ry="40" fill="#fff" opacity=".35"/>
        <ellipse cx="400" cy="336" rx="190" ry="34" fill="#fff" opacity=".45"/>
        <ellipse cx="318" cy="404" rx="84" ry="58" fill="#000" opacity=".95"/>
        <ellipse cx="484" cy="404" rx="84" ry="58" fill="#000" opacity=".95"/>
        <ellipse cx="400" cy="626" rx="92" ry="66" fill="#000" opacity=".95"/>
        <ellipse cx="258" cy="600" rx="40" ry="90" fill="#000" opacity=".5"/>
        <ellipse cx="542" cy="600" rx="40" ry="90" fill="#000" opacity=".5"/>
      </g>
    </g>
    ${fringes()}
  </g>

  <!-- 2. the voids, the mouth, the eyes -->
  <ellipse cx="318" cy="406" rx="92" ry="62" fill="url(#socket)"/>
  <ellipse cx="484" cy="404" rx="88" ry="60" fill="url(#socket)"/>
  <path d="M334 604C346 584 366 578 382 590C394 576 414 580 426 592C440 578 464 588 472 608C478 632 466 658 446 670C424 684 378 686 356 672C336 658 326 630 334 604Z" fill="url(#maw)"/>
  <path d="M388 504L400 482L412 504L406 530L394 530Z" fill="#0a0603" opacity=".92" filter="url(#soft2)"/>
  ${teeth()}
  <rect x="320" y="570" width="170" height="130" fill="url(#mawshade)" clip-path="url(#mouth)"/>

  <!-- 3. light falls off towards the top (lit from below), plus a vignette -->
  <rect width="${W}" height="${H}" fill="url(#toplight)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>

  <!-- 4. pupils: two tiny, uneven points of light deep in the sockets -->
  <circle cx="326" cy="410" r="30" fill="url(#bloom)" filter="url(#soft2)"/>
  <circle cx="478" cy="406" r="24" fill="url(#bloom)" filter="url(#soft2)"/>
  <circle cx="326" cy="410" r="6.5" fill="#fff6d8"/>
  <circle cx="478" cy="406" r="5" fill="#fff6d8"/>
</svg>`;
}

export const MUMMY_SIZE = { w: W, h: H };
