window.Culture = (function () {
  "use strict";

  function initReveal(root) {
    const grid = root.querySelector(".culture__grid");
    if (!grid) return;

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
