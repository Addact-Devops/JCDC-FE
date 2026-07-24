/**
 * sections/why-jeddah.js — "Why Jeddah Central?" 3x2 card grid (invest.html)
 * Column-staggered fade-in-up: each card's icon + content animate upward
 * into place, with the delay based on column index (i % 3) so all cards
 * in the same column move together and the wave sweeps left to right.
 * The vertical/horizontal divider lines (&::before / &::after) are left
 * untouched so the grid structure stays visually grounded throughout.
 */
window.WhyJeddah = (function () {
  "use strict";

  const COLUMNS = 3;
  const COLUMN_STEP = 0.2;

  function initReveal(root) {
    const grid = root.querySelector(".why-jeddah__grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".why-jeddah__card");
    cards.forEach((card, i) => {
      const delay = (i % COLUMNS) * COLUMN_STEP;
      const icon = card.querySelector(".why-jeddah__icon");
      const content = card.querySelector(".why-jeddah__card-content");
      if (icon) icon.style.transitionDelay = delay + "s";
      if (content) content.style.transitionDelay = delay + 0.05 + "s";
    });

    if (!("IntersectionObserver" in window)) {
      grid.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          grid.classList.add("in-view");
          observer.unobserve(grid);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(grid);
  }

  function init(root) {
    root = root || document.querySelector(".why-jeddah");
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
