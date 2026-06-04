/**
 * components/navbar.js — Site navbar
 *
 * Reusable across pages. Handles:
 *   • Transparent → solid on scroll
 *   • Desktop dropdown toggle (click, outside-click, Escape)
 */
window.Navbar = (function () {
    "use strict";

    function initScrollState(root) {
        const update = () => root.classList.toggle("is-solid", window.scrollY > 700);
        window.addEventListener("scroll", update, { passive: true });
        update();
    }

    function initDropdowns(root) {
        const items = root.querySelectorAll("[data-dropdown]");

        items.forEach((item) => {
            const btn = item.querySelector("[data-dropdown-toggle]");
            if (!btn) return;

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const open = item.classList.contains("is-open");

                // Close all others first
                items.forEach((i) => {
                    i.classList.remove("is-open");
                    i.querySelector("[data-dropdown-toggle]")?.setAttribute("aria-expanded", "false");
                });

                if (!open) {
                    item.classList.add("is-open");
                    btn.setAttribute("aria-expanded", "true");
                }
            });
        });

        // Close on outside click
        document.addEventListener("click", (e) => {
            if (!e.target.closest("[data-dropdown]")) {
                items.forEach((i) => {
                    i.classList.remove("is-open");
                    i.querySelector("[data-dropdown-toggle]")?.setAttribute("aria-expanded", "false");
                });
            }
        });

        // Close on Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                items.forEach((i) => {
                    i.classList.remove("is-open");
                    i.querySelector("[data-dropdown-toggle]")?.setAttribute("aria-expanded", "false");
                });
            }
        });
    }

    function init(root) {
        root = root || document.querySelector(".navbar") || document.getElementById("navbar");
        if (!root) return;
        initScrollState(root);
        initDropdowns(root);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    return { init };
})();
