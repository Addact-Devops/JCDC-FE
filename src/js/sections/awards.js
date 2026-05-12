/* ════════════════════════════════════════════════════════════
   Awards module
   - If the root `.awards` element has the modifier
     `awards--auto-scroll`, the infinite marquee animation runs.
   - Otherwise the slider becomes a manual draggable scroller
     (mouse drag, native touch scroll, keyboard arrows).
   ════════════════════════════════════════════════════════════ */
window.Awards = (function () {
    "use strict";

    const DRAG_THRESHOLD = 4; //  px before a press is treated as a drag
    const KEY_STEP = 200; //  px scrolled per arrow keypress

    /* ─────────────────────────────────────────────
       Helpers
       ───────────────────────────────────────────── */
    function isAutoScroll(root) {
        return root.classList.contains("awards--auto-scroll");
    }

    function whenImagesReady(track, cb) {
        const images = track.querySelectorAll("img");
        const total = images.length;
        if (total === 0) {
            cb();
            return;
        }
        let loaded = 0;
        const done = () => {
            if (++loaded >= total) cb();
        };
        images.forEach((img) => {
            if (img.complete) {
                done();
            } else {
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
            }
        });
    }

    /* ─────────────────────────────────────────────
       Mode 1 — Auto-scroll (existing behaviour)
       ───────────────────────────────────────────── */
    function initScrollWidth(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        const items = track.querySelectorAll(".cert-item:not([aria-hidden])");
        const gap = 16;
        let totalWidth = 0;
        items.forEach((item) => {
            totalWidth += item.offsetWidth + gap;
        });

        track.style.setProperty("--scroll-width", `-${totalWidth}px`);

        //  force animation restart with new measurement
        track.style.animation = "none";
        // eslint-disable-next-line no-unused-expressions
        track.offsetHeight; //  reflow
        track.style.animation = "";
    }

    function initAutoScroll(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        whenImagesReady(track, () => initScrollWidth(root));

        window.addEventListener("resize", () => initScrollWidth(root));

        //  Respect prefers-reduced-motion
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => {
            track.style.animationPlayState = prefersReduced.matches || document.hidden ? "paused" : "running";
        };

        prefersReduced.addEventListener?.("change", apply);
        document.addEventListener("visibilitychange", apply);

        //  Pause on hover
        root.addEventListener("mouseenter", () => {
            track.style.animationPlayState = "paused";
        });
        root.addEventListener("mouseleave", apply);

        apply();
    }

    /* ─────────────────────────────────────────────
       Mode 2 — Manual draggable scroll (default)
       ───────────────────────────────────────────── */
    function initManualScroll(root) {
        const slider = root.querySelector(".awards__slider");
        if (!slider) return;

        //  Accessibility — make the slider a focusable region
        if (!slider.hasAttribute("tabindex")) slider.setAttribute("tabindex", "0");
        if (!slider.hasAttribute("role")) slider.setAttribute("role", "region");
        if (!slider.hasAttribute("aria-label")) {
            slider.setAttribute("aria-label", "Awards and certifications — drag, swipe, or use arrow keys to scroll");
        }

        let isDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        let moved = false;

        const onMouseDown = (e) => {
            if (e.button !== 0) return; //  left-click only
            isDown = true;
            moved = false;
            startX = e.pageX;
            startScrollLeft = slider.scrollLeft;
            slider.classList.add("is-dragging");
        };

        const onMouseMove = (e) => {
            if (!isDown) return;
            const walk = e.pageX - startX;
            if (Math.abs(walk) > DRAG_THRESHOLD) moved = true;
            slider.scrollLeft = startScrollLeft - walk;
            e.preventDefault(); //  prevent text/image selection while dragging
        };

        const endDrag = () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove("is-dragging");
        };

        //  Suppress the click that fires at the end of a drag so cert-items
        //  don't accidentally trigger their own click handlers / navigation.
        const onClickCapture = (e) => {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        };

        slider.addEventListener("mousedown", onMouseDown);
        //  Listen on window so a fast drag that exits the slider still updates
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", endDrag);
        slider.addEventListener("mouseleave", endDrag);
        slider.addEventListener("click", onClickCapture, true);

        //  Keyboard support (WCAG)
        slider.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowRight":
                    slider.scrollLeft += KEY_STEP;
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    slider.scrollLeft -= KEY_STEP;
                    e.preventDefault();
                    break;
                case "Home":
                    slider.scrollLeft = 0;
                    e.preventDefault();
                    break;
                case "End":
                    slider.scrollLeft = slider.scrollWidth;
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        });

        //  Touch is handled natively by `overflow-x: auto` — no JS needed,
        //  which preserves momentum scrolling on iOS / Android.
    }

    /* ─────────────────────────────────────────────
       Public init — supports multiple .awards roots
       ───────────────────────────────────────────── */
    function init(root) {
        //  If a specific root is passed, init just that one.
        //  Otherwise init every .awards on the page.
        const roots = root ? [root] : Array.from(document.querySelectorAll(".awards"));
        roots.forEach((el) => {
            if (!el || !el.querySelector(".certs")) return;
            if (isAutoScroll(el)) {
                initAutoScroll(el);
            } else {
                initManualScroll(el);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    return { init };
})();
