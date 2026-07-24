/**
 * sections/sustainability-design.js — Sustainability Design cards (jcdc.html)
 * Staggered fade-in-up: the 3x2 grid reveals as a wave, each card
 * starting shortly after the previous one (overlapping durations),
 * rather than waiting for the previous card to fully finish.
 */
window.SustainabilityDesign = (function () {
    "use strict";

    function initReveal(root) {
        const grid = root.querySelector(".sustainability-design__grid");
        if (!grid) return;

        const cards = grid.querySelectorAll(".sustainability-design__card");
        cards.forEach((card, i) => {
            card.style.transitionDelay = i * 0.12 + "s";
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
        root = root || document.querySelector(".sustainability-design");
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
