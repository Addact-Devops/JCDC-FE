window.Awards = (function () {
    "use strict";

    function initScrollWidth(root) {
        const track = root.querySelector(".certs");
        if (!track) return;

        const items = track.querySelectorAll(".cert-item:not([aria-hidden])");
        const gap = 16;
        let totalWidth = 0;

        items.forEach((item) => {
            totalWidth += item.offsetWidth + gap;
        });

        // 👈 set on track element directly
        track.style.setProperty("--scroll-width", `-${totalWidth}px`);

        // 👈 force animation restart with new value
        track.style.animation = "none";
        track.offsetHeight; // reflow
        track.style.animation = "";
    }

    function init(root) {
        root = root || document.querySelector(".awards");
        if (!root) return;

        const track = root.querySelector(".certs");
        if (!track) return;

        // 👈 wait for all images to load before measuring
        const images = track.querySelectorAll("img");
        let loaded = 0;
        const total = images.length;

        function onLoad() {
            loaded++;
            if (loaded >= total) {
                initScrollWidth(root); // 👈 measure after all images loaded
            }
        }

        if (total === 0) {
            initScrollWidth(root);
        } else {
            images.forEach((img) => {
                if (img.complete) {
                    onLoad();
                } else {
                    img.addEventListener("load", onLoad);
                    img.addEventListener("error", onLoad); // count errors too
                }
            });
        }

        window.addEventListener("resize", () => initScrollWidth(root));

        // Respect prefers-reduced-motion
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => {
            track.style.animationPlayState = prefersReduced.matches || document.hidden ? "paused" : "running";
        };

        prefersReduced.addEventListener?.("change", apply);
        document.addEventListener("visibilitychange", apply);

        // Pause on hover
        root.addEventListener("mouseenter", () => {
            track.style.animationPlayState = "paused";
        });
        root.addEventListener("mouseleave", apply);

        apply();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    return { init };
})();
