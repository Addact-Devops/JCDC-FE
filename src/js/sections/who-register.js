/**
 * sections/who-register.js — "Who Should Register" 2x2 card grid
 * (supplier.html)
 * Column-staggered fade-in-up: each card's title + description animate
 * upward into place, with the delay based on column index (i % 2) so
 * cards in the same column move together and the wave sweeps left to
 * right. The vertical/horizontal divider lines (&::before / &::after)
 * are left untouched so the grid structure stays visually grounded.
 */
window.WhoRegister = (function () {
    "use strict";

    const COLUMNS = 2;
    const COLUMN_STEP = 0.2;

    function initReveal(root) {
        const grid = root.querySelector(".who-register__grid");
        if (!grid) return;

        const cards = grid.querySelectorAll(".who-register__card");
        cards.forEach((card, i) => {
            const delay = (i % COLUMNS) * COLUMN_STEP;
            const title = card.querySelector(".who-register__card-title");
            const description = card.querySelector(".who-register__card-description");
            if (title) title.style.transitionDelay = delay + "s";
            if (description) description.style.transitionDelay = delay + 0.05 + "s";
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
        root = root || document.querySelector(".who-register");
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
