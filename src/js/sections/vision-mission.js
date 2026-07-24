window.VisionMission = (function () {
  "use strict";

  function initReveal(root) {
    const container = root.querySelector(".vision-mission__container");
    if (!container) return;

    const cards = container.querySelectorAll(".vision-mission__card");
    cards.forEach((card, i) => {
      const cardDelay = i * 0.95;
      card.style.transitionDelay = cardDelay + "s";

      const title = card.querySelector(".vision-mission__title");
      const description = card.querySelector(".vision-mission__description");
      if (title) title.style.transitionDelay = cardDelay + 0.4 + "s";
      if (description)
        description.style.transitionDelay = cardDelay + 0.6 + "s";
    });

    if (!("IntersectionObserver" in window)) {
      container.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          container.classList.add("in-view");
          observer.unobserve(container);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(container);
  }

  function init(root) {
    root = root || document.querySelector(".vision-mission");
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
