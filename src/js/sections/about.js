/**
 * sections/about.js — About JCDC (Our Story) section
 * Fading entrance: adds `.in-view` once the section scrolls into view,
 * which triggers the fade/rise transition defined in _ourStory.scss.
 */
window.About = (function () {
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
    root = root || document.querySelector('.our-story');
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
