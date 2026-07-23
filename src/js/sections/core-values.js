/**
 * sections/core-values.js — Core Values cards (about.html)
 * Fading entrance: cards slide+fade in from the right, one by one,
 * once the grid scrolls into view.
 */
window.CoreValues = (function () {
    "use strict";

    function initReveal(root) {
        const grid = root.querySelector(".core-values__grid");
        if (!grid) return;

        // Each card's delay is spaced past the previous card's full
        // animation (0.8s duration + a short pause) so they play one at a
        // time instead of overlapping.
        const cards = grid.querySelectorAll(".core-values__card");
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
