/**
 * sections/environmental-impact.js — Stats row (sustainability.html)
 *
 * On scroll into view: number + text fade in as a staggered wave (CSS,
 * see _environmental.scss), and each __number (e.g. "80%", "13") counts
 * up from 0 to its target, keeping the original suffix (e.g. "%").
 */
window.EnvironmentalImpact = (function () {
  "use strict";

  var NUMBER_RE = /^(\D*)([\d,]+)(.*)$/;
  var COUNT_DURATION = 2400;

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCount(el, target) {
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / COUNT_DURATION, 1);
      var current = Math.round(easeOutCubic(progress) * target);
      el.textContent =
        el.dataset.countPrefix +
        current.toLocaleString("en-US") +
        el.dataset.countSuffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function prepareCounters(items) {
    items.forEach((item) => {
      const number = item.querySelector(".environmental-impact__number");
      if (!number) return;

      const match = number.textContent.trim().match(NUMBER_RE);
      if (!match) return;

      const target = parseInt(match[2].replace(/,/g, ""), 10);
      if (isNaN(target)) return;

      number.dataset.countPrefix = match[1];
      number.dataset.countSuffix = match[3];
      number.dataset.countTarget = target;
      number.textContent = match[1] + "0" + match[3];
    });
  }

  function initReveal(root) {
    const container = root.querySelector(".environmental-impact__stats");
    if (!container) return;

    const items = [
      ...container.querySelectorAll(".environmental-impact__item"),
    ];
    const reduceMotion = prefersReducedMotion();

    if (!reduceMotion) prepareCounters(items);

    items.forEach((item, i) => {
      const delay = i * 0.1;
      const number = item.querySelector(".environmental-impact__number");
      const text = item.querySelector(".environmental-impact__text");
      if (number) number.style.transitionDelay = delay + "s";
      if (text) text.style.transitionDelay = delay + 0.06 + "s";
    });

    function reveal() {
      container.classList.add("in-view");
      if (reduceMotion) return;
      items.forEach((item) => {
        const number = item.querySelector(".environmental-impact__number");
        if (number && number.dataset.countTarget) {
          animateCount(number, parseInt(number.dataset.countTarget, 10));
        }
      });
    }

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal();
          observer.unobserve(container);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(container);
  }

  function init(root) {
    root = root || document.querySelector(".environmental-impact");
    if (!root) return;
    initReveal(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  return { init };
})();
