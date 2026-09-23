// Stone slab FAQ: native <details>, enhanced with a grinding open/close animation
// and an optional grind sound (only when the ambient audio is switched on).
import { grind } from './audio.js';

const EASE = 'cubic-bezier(.7,0,.2,1)';

export function init({ reduced }) {
  if (reduced) return;
  document.querySelectorAll('details.slab').forEach((slab) => {
    const summary = slab.querySelector('summary');
    const body = slab.querySelector('.slab__body');
    let anim = null;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      anim?.cancel();
      grind();
      slab.classList.remove('is-grinding');
      void slab.offsetWidth; // restart the shake
      slab.classList.add('is-grinding');

      if (!slab.open) {
        slab.open = true;
        const h = body.scrollHeight;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 520, easing: EASE });
      } else {
        const h = body.offsetHeight;
        anim = body.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: EASE });
        anim.onfinish = () => (slab.open = false);
      }
    });
    slab.addEventListener('animationend', () => slab.classList.remove('is-grinding'));
  });
}
