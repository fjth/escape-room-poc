# CLAUDE.md — Escape Room Landing Page (Egyptian / Mummy theme)

## Project goal
A fast, bilingual (Dutch + English) landing site for a new Egyptian/mummy-themed escape room in the Netherlands.
The site itself should feel like the first minute of the game: atmospheric, tactile, a little mysterious. Its one job is to get visitors excited and get them to **book**.

## Stack
- Static site, no framework. Vanilla HTML, CSS and JS (ES modules).
- Structure:
  ```
  /index.html          → Dutch (default)
  /en/index.html       → English
  /css/styles.css      → shared
  /js/main.js          → shared; imports modules from /js/fx/
  /js/fx/*.js          → one file per interaction (torch.js, glyphs.js, sand.js, …)
  /assets/img, /assets/svg, /assets/fonts, /assets/audio
  ```
- Dev server: `npx serve` or Vite in plain mode is fine; the output must deploy as static files to Netlify / Vercel / GitHub Pages.
- Dependencies: none by default. GSAP (+ ScrollTrigger) is allowed if an animation genuinely needs it; ask before adding anything else.
- Fonts: self-hosted, max 2 families. A carved/ancient display face for headings (e.g. Cinzel, Cormorant, or similar with a Latin + Dutch character set) and a readable sans or serif for body.
- No analytics, trackers or third-party cookies (GDPR/AVG). Maps as a static image linking to Google Maps, not an embed.

## Bilingual (NL + EN) — required from day one
- Two real pages, not a JS text swap: `/` (nl) and `/en/` (en). Better for SEO and sharing.
- Both pages have identical structure; only the copy differs. When changing markup in one, apply the same change to the other in the same step.
- `<html lang="nl">` / `<html lang="en">`, `hreflang` alternate links on both pages (+ `x-default` → nl), translated `<title>`, meta description and Open Graph tags.
- Language switcher styled as a pair of **cartouches** (NL / EN) in the header; it links to the equivalent section on the other page (keep the `#hash`).
- No automatic redirect. If the browser language is not Dutch and the visitor lands on `/`, show a small dismissible hint: "This page is also available in English →".
- Mention clearly on both pages that the game itself can be played in Dutch **or** English.
- All UI strings used by JS (aria-labels, easter-egg messages, hints) live in a `data-` attribute or a small `strings` object keyed by `document.documentElement.lang`.
- Copy tone: Dutch informal "je"; English natural, not a literal translation.

## Page structure (same order in both languages)
1. **Hero / Tomb entrance** — room name, one-line hook, "Boek nu / Book now" CTA, dark tomb scene with the torch interaction (see below).
2. **Het verhaal / The story** — teaser story (3–5 sentences) on an unrolling papyrus. No spoilers.
3. **Praktische info / Good to know** — players min–max, duration, age advice, difficulty, game languages (NL/EN). Presented as carved stone tiles with glyph icons.
4. **Prijzen / Prices** — per group size, as offering tablets / cartouches.
5. **Boeken / Book** — booking embed or link, repeated CTA.
6. **FAQ** — accessible accordion (native `<details>/<summary>`) styled as sealed stone slabs that slide open: arrival time, cancellation, accessibility, kids, claustrophobia, gift cards, company outings, payment (iDEAL).
7. **Locatie & contact / Location & contact** — address, static map, parking/public transport, phone, email.
8. **Footer** — company name, KvK number (legally required), BTW number if applicable, privacy statement, socials.

Sticky "Boek nu / Book now" on mobile, styled as a gold seal.

## Visual design
- Mood: torchlit tomb. Dark, warm, textured, premium. Not cartoonish, no clip-art pyramids.
- Palette as CSS custom properties on `:root`:
  - `--tomb: #0f0c08` (base background) · `--stone: #2a241c` · `--stone-light: #4a3f31`
  - `--sand: #d8b878` · `--gold: #c9a227` · `--gold-bright: #f0cf6a`
  - `--lapis: #1f3a68` · `--turquoise: #3aa6a0` (Egyptian faience accent, use sparingly)
  - `--papyrus: #efe3c4` (body text on dark) · `--blood: #7a1e12` (curse accents, very sparingly)
- Texture: subtle stone/sandstone noise via an SVG `feTurbulence` filter or a tiny tiled webp, not large images.
- Gold rendered with gradients + subtle sheen animation on hover, not flat yellow.
- Ornaments as inline SVG: hieroglyph borders, scarab, ankh, Eye of Horus, lotus, winged sun disk as section dividers.
- Headings feel carved: inset text-shadow, slight letter-spacing, uppercase display face.
- Custom cursor on desktop (small ankh or torch flame); default cursor on touch devices and when reduced motion is on.
- Mobile-first. Most traffic will come from Instagram and Google on phones; every effect needs a good touch/mobile version.
- Only original or properly licensed imagery. Nothing from existing films/franchises (e.g. "The Mummy") or other escape rooms.

## Signature interactions (JS)
Build these as independent modules in `/js/fx/`, each progressively enhancing plain HTML that already works without JS.

1. **Torchlight hero** — the hero is almost black; a warm radial "torch" light follows the pointer (on touch: follows the finger, or drifts slowly on its own) and reveals hieroglyphs and a hidden message on the wall. Flame flicker via subtle randomized radius/intensity. CSS `mask-image` / radial-gradient driven by CSS variables set from JS.
2. **Hieroglyph decode headings** — section headings first appear as glyphs (Unicode Egyptian hieroglyphs block U+13000 or SVG glyphs) and "decode" letter by letter into the real text when scrolled into view (IntersectionObserver).
3. **Papyrus unroll** — the story section unrolls horizontally/vertically as it enters the viewport, with a slight paper-curl shadow.
4. **Drifting sand** — lightweight canvas particle layer of dust/sand in the hero and between sections. Low particle count, paused when off-screen or tab hidden.
5. **Sarcophagus CTA** — the main booking button is a small sarcophagus/tomb door; on hover the lid shifts and golden light leaks out; on click it opens before navigating to booking.
6. **Stone slab FAQ** — slabs grind open with a short easing and optional sound.
7. **Hidden scarabs easter egg** — 3 small scarabs are hidden across the page. Finding all three reveals a message (and optionally a discount code `{{EASTER_EGG_CODE}}`). Progress shown as a subtle cartouche that fills in. Fits the escape-room spirit; must be fully optional and not block anything.
8. **Opening countdown (only if not open yet)** — an hourglass/sand timer counting down to `{{OPENING_DATE}}`, with an email signup instead of booking.
9. **Optional ambient audio** — off by default. A clearly labelled toggle (brazier icon) for a low wind/tomb ambience. Never autoplay.

## Performance & accessibility (non-negotiable)
- Every effect respects `prefers-reduced-motion: reduce` (static, fully readable fallback) and stops when out of view.
- All content readable and all CTAs usable with JS disabled.
- Lighthouse ≥ 90 on performance, accessibility, best practices and SEO for both language pages.
- Contrast checked, especially gold/sand on dark. Decorative glyphs `aria-hidden="true"`; decode effect must not confuse screen readers (real text in the DOM from the start, visual effect only).
- Keyboard navigable, visible focus styles (gold glow).
- Total page weight under ~1.5 MB; images `.webp`/`.avif`, lazy-loaded below the fold; fonts subset and `font-display: swap`.

## SEO
- Per language: title + meta description containing "escape room" + city, Open Graph + share image, canonical, hreflang.
- `LocalBusiness` (or `EntertainmentBusiness`) JSON-LD with address, opening hours, price range and `availableLanguage: ["nl", "en"]`.
- Favicon + apple-touch-icon (scarab or ankh).

## Placeholders — to fill in with the owner
Use `{{PLACEHOLDER}}` markers in both HTML files until known:
- `{{ROOM_NAME}}`, `{{COMPANY_NAME}}`, `{{TAGLINE_NL}}`, `{{TAGLINE_EN}}`
- `{{CITY}}`, `{{ADDRESS}}`
- `{{PLAYERS_MIN}}`–`{{PLAYERS_MAX}}`, `{{DURATION}}`, `{{MIN_AGE}}`, `{{DIFFICULTY}}`
- `{{PRICES}}` per group size
- `{{BOOKING}}` — which booking system (e.g. Bookeo, Resova, Planyo, Xola) and whether it has NL + EN widgets. Until known: CTA → `#boeken` / `#book` with phone/email fallback.
- `{{OPENING_DATE}}` — decides booking vs "coming soon + signup" mode.
- `{{PHONE}}`, `{{EMAIL}}`, `{{KVK}}`, `{{BTW}}`, `{{SOCIALS}}`, `{{EASTER_EGG_CODE}}`
- Logo and real photos of the room (until then: tasteful, clearly marked placeholders).

## Working agreements
- Build in this order: static bilingual structure + copy → visual design → interactions one by one → performance/a11y pass.
- Preview in the browser after each meaningful change, on both a desktop and a mobile viewport, in both languages.
- Keep NL and EN pages in sync in the same change.
- Ask before adding dependencies or any third-party script.
