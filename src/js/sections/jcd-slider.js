/**
 * sections/jcd-slider.js — Discover Jeddah Central
 *
 * Auto-cycles through multiple background images while the foreground
 * text/button stays static. No arrows, no dots — fully automatic.
 *
 * Each <div class="jcd-slider__bg" data-bg="url(...)"> is a slide.
 * The first one with class "is-active" starts visible; the others
 * fade in on a timer.
 */
window.JCDSlider = (function () {
  'use strict';

  const INTERVAL_MS = 5000;   // how long each image stays
  const tickers = new WeakMap();

  function init(root) {
    root = root || document.querySelector('.jcd-slider');
    if (!root) return;

    // Stop any pre-existing ticker on this root (e.g. hot-reload)
    if (tickers.has(root)) {
      clearInterval(tickers.get(root));
      tickers.delete(root);
    }

    const slides = Array.from(root.querySelectorAll('.jcd-slider__bg'));
    if (slides.length < 2) return;

    // Ensure exactly one slide starts active
    let active = slides.findIndex(s => s.classList.contains('is-active'));
    if (active < 0) {
      active = 0;
      slides[0].classList.add('is-active');
    }

    function advance() {
      slides[active].classList.remove('is-active');
      active = (active + 1) % slides.length;
      slides[active].classList.add('is-active');
    }

    const timerId = setInterval(advance, INTERVAL_MS);
    tickers.set(root, timerId);

    // Pause when tab is hidden to save CPU
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(tickers.get(root));
      } else {
        const newId = setInterval(advance, INTERVAL_MS);
        tickers.set(root, newId);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  return { init };
})();
