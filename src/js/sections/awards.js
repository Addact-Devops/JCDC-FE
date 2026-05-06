/**
 * awards.js
 * Two scroll modes for the certifications row, switched by a single class:
 *   • .awards--auto-scroll  → infinite auto-scrolling animation (default)
 *   • (class removed)       → manual scroll: native touch swipe + mouse drag + keyboard arrows
 *
 * A MutationObserver watches the class list, so toggling the modifier at runtime
 * reconfigures the slider live — no re-init call needed from outside.
 */
window.Awards = (function () {
    "use strict";

    const AUTO_CLASS = "awards--auto-scroll";
    // Internal flag class — placed on the slider during a mouse-drag gesture
    // so we can swap cursor: grab → grabbing without touching JS-set styles.
    const GRABBING_CLASS = "is-grabbing";

    // ──────────────────────────────────────────────
    // Auto-scroll mode
    // ──────────────────────────────────────────────
    function measureScrollWidth(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        // Original (non-clone) items only — clones carry aria-hidden
        const items = track.querySelectorAll(".cert-item:not([aria-hidden])");
        const gap = 16;
        let totalWidth = 0;

        items.forEach((item) => {
            totalWidth += item.offsetWidth + gap;
        });

        track.style.setProperty("--scroll-width", `-${totalWidth}px`);

        // Force animation restart so the new --scroll-width takes effect
        track.style.animation = "none";
        // eslint-disable-next-line no-unused-expressions
        track.offsetHeight; // reflow
        track.style.animation = "";
    }

    function setupAutoScroll(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        // Clear any leftover scroll position from a previous manual-mode session
        const slider = root.querySelector(".awards__slider");
        if (slider) slider.scrollLeft = 0;

        // Wait for images so widths are real before measuring
        const images = track.querySelectorAll("img");
        let loaded = 0;
        const total = images.length;

        const measureWhenReady = () => {
            loaded++;
            if (loaded >= total) measureScrollWidth(root);
        };

        if (total === 0) {
            measureScrollWidth(root);
        } else {
            images.forEach((img) => {
                if (img.complete) measureWhenReady();
                else {
                    img.addEventListener("load", measureWhenReady);
                    img.addEventListener("error", measureWhenReady);
                }
            });
        }

        // Re-measure on resize
        const onResize = () => measureScrollWidth(root);
        window.addEventListener("resize", onResize);

        // Pause on reduced-motion preference, hover, or hidden tab
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => {
            track.style.animationPlayState =
                reduced.matches || document.hidden ? "paused" : "running";
        };
        const onHover = () => {
            track.style.animationPlayState = "paused";
        };
        const onLeave = apply;

        reduced.addEventListener?.("change", apply);
        document.addEventListener("visibilitychange", apply);
        root.addEventListener("mouseenter", onHover);
        root.addEventListener("mouseleave", onLeave);
        apply();

        // Stash for cleanup when switching modes
        root._autoCleanup = () => {
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", apply);
            reduced.removeEventListener?.("change", apply);
            root.removeEventListener("mouseenter", onHover);
            root.removeEventListener("mouseleave", onLeave);
            track.style.animation = "none";
            track.style.animationPlayState = "";
            track.style.removeProperty("--scroll-width");
        };
    }

    function teardownAutoScroll(root) {
        if (typeof root._autoCleanup === "function") {
            root._autoCleanup();
            delete root._autoCleanup;
        }
    }

    // ──────────────────────────────────────────────
    // Manual-scroll mode
    //
    // Drag UX has two phases:
    //   1. While the mouse is down, scrollLeft tracks the pointer 1:1.
    //   2. On release, we apply momentum — the slider keeps gliding in the
    //      direction of the drag and decelerates with friction (like native
    //      iOS scroll). This is what makes manual scroll feel smooth instead
    //      of stopping dead when the mouse is released.
    // Touch devices already get this momentum natively from the browser, so
    // the JS momentum here is desktop-only (mouse events don't fire for touch).
    // ──────────────────────────────────────────────
    function setupManualScroll(root) {
        const slider = root.querySelector(".awards__slider");
        if (!slider) return;

        // For keyboard a11y — make the slider focusable and announce as a region
        slider.setAttribute("tabindex", "0");
        slider.setAttribute("role", "region");
        if (!slider.getAttribute("aria-label")) {
            slider.setAttribute("aria-label", "Awards & certifications, scrollable");
        }

        // Drag state
        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let didDrag = false;

        // Velocity tracking (for momentum)
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0; // pixels of scrollLeft change per animation frame

        // Friction per frame — closer to 1.0 means longer glide.
        // 0.94 gives ~1s of glide which feels natural.
        const FRICTION = 0.94;
        // Below this, momentum stops (avoids endless tiny updates)
        const MIN_VELOCITY = 0.3;
        // Cap velocity so a fast flick doesn't fly out of control
        const MAX_VELOCITY = 60;

        let momentumRAF = null;
        const cancelMomentum = () => {
            if (momentumRAF !== null) {
                cancelAnimationFrame(momentumRAF);
                momentumRAF = null;
            }
        };
        const stepMomentum = () => {
            // Stop when velocity is too small to be visible
            if (Math.abs(velocity) < MIN_VELOCITY) {
                momentumRAF = null;
                return;
            }
            // Stop when we hit either end of the scroll range
            const max = slider.scrollWidth - slider.clientWidth;
            const next = slider.scrollLeft - velocity;
            if (next <= 0 || next >= max) {
                slider.scrollLeft = Math.max(0, Math.min(max, next));
                momentumRAF = null;
                return;
            }
            slider.scrollLeft = next;
            velocity *= FRICTION;
            momentumRAF = requestAnimationFrame(stepMomentum);
        };

        const onMouseDown = (e) => {
            cancelMomentum(); // clicking interrupts any ongoing glide
            isDown = true;
            didDrag = false;
            slider.classList.add(GRABBING_CLASS);
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            lastX = e.pageX;
            lastTime = performance.now();
            velocity = 0;
        };
        const stopDrag = () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove(GRABBING_CLASS);
            // Hand off to momentum if the user was actually flicking
            if (Math.abs(velocity) > MIN_VELOCITY) {
                momentumRAF = requestAnimationFrame(stepMomentum);
            }
        };
        const onMouseMove = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.2; // small multiplier for natural feel
            if (Math.abs(walk) > 4) didDrag = true;
            slider.scrollLeft = scrollLeft - walk;

            // Track velocity in "pixels of scrollLeft change per ~16ms frame"
            // so it can be applied directly in the momentum loop.
            const now = performance.now();
            const dt = Math.max(now - lastTime, 1);
            const px = (e.pageX - lastX) * 1.2; // same multiplier as drag
            const perFrame = (px / dt) * 16; // normalize to ~60fps frame
            // Clamp
            velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, perFrame));
            lastX = e.pageX;
            lastTime = now;
        };
        // Block click events that fire after a drag (so cards inside don't trigger)
        const onClickCapture = (e) => {
            if (didDrag) {
                e.preventDefault();
                e.stopPropagation();
                didDrag = false;
            }
        };

        // Wheel-to-horizontal-scroll: lets desktop users without trackpads
        // scroll the row using the vertical mouse wheel.
        const onWheel = (e) => {
            // Trackpad horizontal swipes already produce deltaX — leave those alone.
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            cancelMomentum();
            slider.scrollLeft += e.deltaY;
            e.preventDefault();
        };

        // Keyboard arrows — accessible smooth scrolling
        const onKeyDown = (e) => {
            const step = 320; // ~one card width
            if (e.key === "ArrowRight") {
                cancelMomentum();
                slider.scrollBy({ left: step, behavior: "smooth" });
                e.preventDefault();
            } else if (e.key === "ArrowLeft") {
                cancelMomentum();
                slider.scrollBy({ left: -step, behavior: "smooth" });
                e.preventDefault();
            } else if (e.key === "Home") {
                cancelMomentum();
                slider.scrollTo({ left: 0, behavior: "smooth" });
                e.preventDefault();
            } else if (e.key === "End") {
                cancelMomentum();
                slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
                e.preventDefault();
            }
        };

        slider.addEventListener("mousedown", onMouseDown);
        slider.addEventListener("mouseleave", stopDrag);
        slider.addEventListener("mouseup", stopDrag);
        slider.addEventListener("mousemove", onMouseMove);
        slider.addEventListener("click", onClickCapture, true);
        slider.addEventListener("wheel", onWheel, { passive: false });
        slider.addEventListener("keydown", onKeyDown);

        root._manualCleanup = () => {
            cancelMomentum();
            slider.removeEventListener("mousedown", onMouseDown);
            slider.removeEventListener("mouseleave", stopDrag);
            slider.removeEventListener("mouseup", stopDrag);
            slider.removeEventListener("mousemove", onMouseMove);
            slider.removeEventListener("click", onClickCapture, true);
            slider.removeEventListener("wheel", onWheel);
            slider.removeEventListener("keydown", onKeyDown);
            slider.classList.remove(GRABBING_CLASS);
            slider.removeAttribute("tabindex");
            slider.removeAttribute("role");
            slider.removeAttribute("aria-label");
            slider.scrollLeft = 0;
        };
    }

    function teardownManualScroll(root) {
        if (typeof root._manualCleanup === "function") {
            root._manualCleanup();
            delete root._manualCleanup;
        }
    }

    // ──────────────────────────────────────────────
    // Mode switcher
    // ──────────────────────────────────────────────
    function applyMode(root) {
        const isAuto = root.classList.contains(AUTO_CLASS);
        if (isAuto) {
            teardownManualScroll(root);
            setupAutoScroll(root);
        } else {
            teardownAutoScroll(root);
            setupManualScroll(root);
        }
    }

    function init(root) {
        const roots = root
            ? [root]
            : Array.from(document.querySelectorAll(".awards"));
        if (roots.length === 0) return;

        roots.forEach((r) => {
            applyMode(r);

            // Watch class changes so external code can flip modes at runtime
            // by adding/removing .awards--auto-scroll
            if (!r._modeObserver) {
                const obs = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.attributeName === "class") {
                            applyMode(r);
                            break;
                        }
                    }
                });
                obs.observe(r, { attributes: true, attributeFilter: ["class"] });
                r._modeObserver = obs;
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    return { init, applyMode };
})();
