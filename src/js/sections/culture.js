/**
 * sections/culture.js — Culture in Motion cards (about.html)
 * Fading entrance: cards slide+fade in from the right, one by one, and
 * each card's title/description fade in as it settles into place.
 */
window.Culture = (function () {
  "use strict";

  function initReveal(root) {
    const grid = root.querySelector(".culture__grid");
    if (!grid) return;

    // Each card's delay is spaced past the previous card's full
    // animation (0.8s duration + a short pause) so they play one at a
    // time instead of overlapping. The title and description within a
    // card start a little after the card itself, so text fades in as
    // the card settles into place rather than all at once.
    const cards = grid.querySelectorAll(".culture__card");
    cards.forEach((card, i) => {
      const cardDelay = i * 0.95;
      card.style.transitionDelay = cardDelay + "s";

      const title = card.querySelector(".culture__card-title");
      const desc = card.querySelector(".culture__card-desc");
      if (title) title.style.transitionDelay = cardDelay + 0.4 + "s";
      if (desc) desc.style.transitionDelay = cardDelay + 0.6 + "s";
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
    root = root || document.querySelector(".culture");
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
