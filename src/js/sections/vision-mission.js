/**
 * sections/vision-mission.js — Vision & Mission cards (about.html)
 * Fading entrance: cards slide+fade in from the right, one by one,
 * once the section scrolls into view.
 */
window.VisionMission = (function () {
    "use strict";

    function initReveal(root) {
        const container = root.querySelector(".vision-mission__container");
        if (!container) return;

        // Each card's delay is spaced past the previous card's full
        // animation (0.8s duration + a short pause) so they play one at a
        // time instead of overlapping. The title and description within a
        // card start a little after the card itself, so text fades in as
        // the card settles into place rather than all at once.
        const cards = container.querySelectorAll(".vision-mission__card");
        cards.forEach((card, i) => {
            const cardDelay = i * 0.95;
            card.style.transitionDelay = cardDelay + "s";

            const title = card.querySelector(".vision-mission__title");
            const description = card.querySelector(".vision-mission__description");
            if (title) title.style.transitionDelay = cardDelay + 0.4 + "s";
            if (description) description.style.transitionDelay = cardDelay + 0.6 + "s";
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
