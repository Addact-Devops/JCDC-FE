window.JCDSlider = (function () {
    "use strict";

    const INTERVAL_MS = 2000;

    function init(root) {
        root = root || document.querySelector(".jcd-slider");

        if (!root) return;

        const slides = root.querySelectorAll(".jcd-slider__bg");
        const contents = root.querySelectorAll(".jcd-slider__content");

        console.log("contentsa", contents);

        let current = 0;

        // reset all
        function reset() {
            slides.forEach((slide) => {
                slide.classList.remove("is-active");
            });

            contents.forEach((content) => {
                content.classList.remove("is-active");
            });
        }

        // show current
        function show(index) {
            reset();

            slides[index].classList.add("is-active");
            contents[index].classList.add("is-active");
        }

        // initial
        show(current);

        // autoplay
        setInterval(() => {
            current++;

            if (current >= slides.length) {
                current = 0;
            }

            show(current);
        }, INTERVAL_MS);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init());
    } else {
        init();
    }

    return { init };
})();
