/**
 * sections/destination-highlight.js — Stats row shared by museum.html,
 * oceanarium.html, opera.html, stadium.html.
 *
 * On scroll into view: label + value fade in as a staggered wave (CSS,
 * see _destination.scss), and any numeric stat-value (e.g. "254,491 m²")
 * counts up from 0 to its target, keeping the original prefix/suffix and
 * thousands separators. Non-numeric values (e.g. district names) just
 * fade in — there's nothing to count.
 */
window.DestinationHighlight = (function () {
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

  function prepareCounters(stats) {
    stats.forEach((stat) => {
      const value = stat.querySelector(".destination-highlight__stat-value");
      if (!value) return;

      const match = value.textContent.trim().match(NUMBER_RE);
      if (!match) return;

      const target = parseInt(match[2].replace(/,/g, ""), 10);
      if (isNaN(target)) return;

      value.dataset.countPrefix = match[1];
      value.dataset.countSuffix = match[3];
      value.dataset.countTarget = target;
      value.textContent = match[1] + "0" + match[3];
    });
  }

  function initReveal(root) {
    const container = root.querySelector(".destination-highlight__stats");
    if (!container) return;

    const stats = [
      ...container.querySelectorAll(".destination-highlight__stat"),
    ];
    const reduceMotion = prefersReducedMotion();

    if (!reduceMotion) prepareCounters(stats);

    stats.forEach((stat, i) => {
      const delay = i * 0.15;
      const label = stat.querySelector(".destination-highlight__stat-label");
      const value = stat.querySelector(".destination-highlight__stat-value");
      if (label) label.style.transitionDelay = delay + "s";
      if (value) value.style.transitionDelay = delay + 0.1 + "s";
    });

    function reveal() {
      container.classList.add("in-view");
      if (reduceMotion) return;
      stats.forEach((stat) => {
        const value = stat.querySelector(".destination-highlight__stat-value");
        if (value && value.dataset.countTarget) {
          animateCount(value, parseInt(value.dataset.countTarget, 10));
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

  function initBodyReveal(root) {
    const body = root.querySelector(".destination-highlight__body");
    if (!body) return;

    if (!("IntersectionObserver" in window)) {
      body.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          body.classList.add("in-view");
          observer.unobserve(body);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -45% 0px" },
    );

    observer.observe(body);
  }

  function init(root) {
    root = root || document.querySelector(".destination-highlight");
    if (!root) return;
    initReveal(root);
    initBodyReveal(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  return { init };
})();
