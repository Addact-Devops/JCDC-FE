window.Awards = (function () {
    "use strict";

    const DRAG_THRESHOLD = 4;
    const KEY_STEP = 200;

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

    function initScrollWidth(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        const items = track.querySelectorAll(".cert-item:not([aria-hidden])");
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;

        let totalWidth = 0;
        items.forEach((item) => {
            totalWidth += item.offsetWidth + gap;
        });

        track.style.setProperty("--scroll-width", `-${totalWidth}px`);
        // ◆ Animation reset removed — was breaking RTL direction
    }

    function initAutoScroll(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        whenImagesReady(track, () => initScrollWidth(root));

        window.addEventListener("resize", () => initScrollWidth(root));

        // ◆ Watch for language/dir changes and restart animation
        const dirObserver = new MutationObserver(() => {
            track.style.animation = "none";
            // eslint-disable-next-line no-unused-expressions
            track.offsetHeight;
            track.style.animation = "";
        });
        dirObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["dir", "lang"],
        });

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => {
            track.style.animationPlayState = prefersReduced.matches || document.hidden ? "paused" : "running";
        };

        prefersReduced.addEventListener?.("change", apply);
        document.addEventListener("visibilitychange", apply);

        if (window.matchMedia("(hover: hover)").matches) {
            const logos = root.querySelectorAll(".cert-item__logo");
            logos.forEach((logo) => {
                logo.addEventListener("mouseenter", () => {
                    track.style.animationPlayState = "paused";
                });
                logo.addEventListener("mouseleave", apply);
            });
        }

        apply();
    }

    function initManualScroll(root) {
        const slider = root.querySelector(".awards__slider");
        if (!slider) return;

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
            if (e.button !== 0) return;
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
            e.preventDefault();
        };

        const endDrag = () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove("is-dragging");
        };

        const onClickCapture = (e) => {
            if (moved) {
                e.preventDefault();
                e.stopPropagation();
                moved = false;
            }
        };

        slider.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", endDrag);
        slider.addEventListener("mouseleave", endDrag);
        slider.addEventListener("click", onClickCapture, true);

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
    }

    function init(root) {
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
