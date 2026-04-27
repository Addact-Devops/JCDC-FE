/**
 * sections/about.js — About JCDC section
 * Currently no JS behaviour; file exists so the section is self-contained
 * and can host future interactions (reveal-on-scroll, parallax, etc.)
 */
window.About = (function () {
  'use strict';

  function init(root) {
    root = root || document.querySelector('.about');
    if (!root) return;
    // Placeholder for future behaviours.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  return { init };
})();
