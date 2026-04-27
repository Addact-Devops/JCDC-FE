/**
 * sections/awards.js — Awards & Certifications carousel
 *
 * CSS handles the infinite-scroll animation. JS just pauses the animation
 * when the tab is hidden (to save CPU/battery) and reduces motion when the
 * user prefers reduced motion.
 */
window.Awards = (function () {
  'use strict';

  function init(root) {
    root = root || document.querySelector('.awards');
    if (!root) return;

    const track = root.querySelector('.awards__track');
    if (!track) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      track.style.animationPlayState =
        (prefersReduced.matches || document.hidden) ? 'paused' : 'running';
    };

    prefersReduced.addEventListener?.('change', apply);
    document.addEventListener('visibilitychange', apply);

    // Pause on hover (nice for users trying to read a cert)
    root.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    root.addEventListener('mouseleave', apply);

    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  return { init };
})();
