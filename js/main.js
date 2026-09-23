import { lang } from './strings.js';
import * as intro from './fx/intro.js';
import * as langSwitch from './fx/lang-switch.js';
import * as scroll from './fx/scroll.js';
import * as nav from './fx/nav.js';
import * as torch from './fx/torch.js';
import * as lantern from './fx/lantern.js';
import * as reveal from './fx/reveal.js';
import * as glyphs from './fx/glyphs.js';
import * as papyrus from './fx/papyrus.js';
import * as sand from './fx/sand.js';
import * as tilt from './fx/tilt.js';
import * as watcher from './fx/watcher.js';
import * as sarcophagus from './fx/sarcophagus.js';
import * as slabs from './fx/slabs.js';
import * as countdown from './fx/countdown.js';
import * as booker from './fx/booker.js';
import * as scarabs from './fx/scarabs.js';
import * as mummy from './fx/mummy.js';
import * as audio from './fx/audio.js';
import * as seal from './fx/seal.js';

// Feature switches. The mummy jump scare is parked for the demo: set to true to bring it back.
const FEATURES = { mummy: false };
document.documentElement.classList.toggle('has-mummy', FEATURES.mummy);

const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const ctx = { lang, reduced: motionQuery.matches };

// Each module progressively enhances markup that already works without JS.
// One failing effect must never take the others (or the page) down.
// Order matters where noted: countdown before seal (it may reveal a section),
// booker before scarabs (it listens for the "all found" event).
for (const mod of [intro, langSwitch, scroll, nav, countdown, torch, lantern, reveal, glyphs, papyrus, sand, tilt, watcher, sarcophagus, slabs, booker, scarabs, ...(FEATURES.mummy ? [mummy] : []), audio, seal]) {
  try {
    mod.init(ctx);
  } catch (err) {
    console.error(err);
  }
}
