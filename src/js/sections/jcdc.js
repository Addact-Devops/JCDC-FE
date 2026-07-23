/**
 * sections/jcdc.js — "In the heart of Jeddah..." section (jcdc.html)
 * Fading entrance: adds `.in-view` once the section scrolls into view,
 * same treatment as .our-story (about.js).
 */
window.Jcdc = (function () {
  'use strict';

  function initReveal(root) {
    if (!('IntersectionObserver' in window)) {
      root.classList.add('in-view');
      return;
    }

    // rootMargin shrinks the viewport's bottom edge by 45%, so the section
    // only counts as "in view" once it has been scrolled up past roughly
    // the middle of the screen — not the moment it first peeks into view.
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          root.classList.add('in-view');
          observer.unobserve(root);
        });
      },
      { threshold: 0, rootMargin: '0px 0px -45% 0px' }
    );

    observer.observe(root);
  }

  function init(root) {
    root = root || document.querySelector('.jcdc');
    if (!root) return;
    initReveal(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  return { init };
})();
