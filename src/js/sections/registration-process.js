/**
 * sections/registration-process.js — Registration Process (supplier.html)
 * Fading entrance: the 3 process-step items fade in up, one by one, then
 * the notice card slides+fades in from the right, continuing the same
 * one-by-one queue right after the last step.
 */
window.RegistrationProcess = (function () {
    "use strict";

    const STEP_INTERVAL = 0.95;

    function initReveal(root) {
        const grid = root.querySelector(".registration-process__grid");
        if (!grid) return;

        const steps = grid.querySelectorAll(".process-step");
        steps.forEach((step, i) => {
            step.style.transitionDelay = i * STEP_INTERVAL + "s";
        });

        const noticeCard = grid.querySelector(".notice-card");
        if (noticeCard) {
            noticeCard.style.transitionDelay = steps.length * STEP_INTERVAL + "s";
        }

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
        root = root || document.querySelector(".registration-process");
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
