window.SustainabilityPillars = (function () {
  "use strict";

  function initReveal(root) {
    const grid = root.querySelector(".sustainability-pillars__grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".sustainability-pillars__card");
    cards.forEach((card, i) => {
      card.style.transitionDelay = i * 0.95 + "s";
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
    root = root || document.querySelector(".sustainability-pillars");
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
