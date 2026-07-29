window.CoreValues = (function () {
  "use strict";

  function initReveal(root) {
    const grid = root.querySelector(".core-values__grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".core-values__card");
    cards.forEach((card, i) => {
      const cardDelay = i * 0.5;
      const icon = card.querySelector(".core-values__icon");
      const title = card.querySelector(".core-values__card-title");
      const description = card.querySelector(".core-values__card-description");
      if (icon) icon.style.transitionDelay = cardDelay + "s";
      if (title) title.style.transitionDelay = cardDelay + 0.15 + "s";
      if (description)
        description.style.transitionDelay = cardDelay + 0.3 + "s";
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
    root = root || document.querySelector(".core-values");
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
