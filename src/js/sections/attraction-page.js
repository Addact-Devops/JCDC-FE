(function () {
  "use strict";

  const FADE_MS = 250;

  function init() {
    const root = document.getElementById("attraction-slider");
    if (!root) return;

    const activeImageEl = root.querySelector("#attraction-active-image");
    const titleOverlay = root.querySelector("#attraction-title-overlay");
    const infoEl = root.querySelector("#attraction-info");
    const stripEl = root.querySelector("#attraction-strip");

    if (!activeImageEl || !titleOverlay || !infoEl || !stripEl) return;

    const imageVariants = Array.from(
      activeImageEl.querySelectorAll("[data-attraction-image]"),
    );
    const titleVariants = Array.from(
      titleOverlay.querySelectorAll("[data-attraction-title]"),
    );
    const infoVariants = Array.from(
      infoEl.querySelectorAll("[data-attraction-info]"),
    );
    const thumbs = Array.from(
      stripEl.querySelectorAll("[data-attraction-idx]"),
    );

    if (!thumbs.length) return;

    let currentIdx = thumbs.findIndex((b) =>
      b.classList.contains("attraction-thumb--active"),
    );
    if (currentIdx < 0) currentIdx = 0;

    function setActiveVariant(elements, index, activeClass) {
      elements.forEach((el, i) => {
        el.classList.toggle(activeClass, i === index);
      });
    }

    function setActiveThumb(index) {
      thumbs.forEach((btn, i) => {
        const isActive = i === index;
        btn.classList.toggle("attraction-thumb--active", isActive);
        if (isActive) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
    }

    function applyActive(index) {
      setActiveVariant(imageVariants, index, "is-active");
      setActiveVariant(titleVariants, index, "is-active");
      setActiveVariant(infoVariants, index, "is-active");
      setActiveThumb(index);
    }

    function fadeSwap(index) {
      const fadeTargets = [activeImageEl, titleOverlay, infoEl];
      fadeTargets.forEach((el) => el.classList.add("is-fading"));

      setTimeout(() => {
        applyActive(index);
        void root.offsetWidth;
        fadeTargets.forEach((el) => el.classList.remove("is-fading"));
      }, FADE_MS);
    }

    function selectAttraction(index, userInitiated) {
      if (index < 0 || index >= thumbs.length || index === currentIdx) return;
      currentIdx = index;

      fadeSwap(currentIdx);

      if (userInitiated) {
        const target = thumbs[currentIdx];
        if (target && typeof target.scrollIntoView === "function") {
          target.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }

    thumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.attractionIdx, 10);
        if (!isNaN(i)) selectAttraction(i, true);
      });
    });

    stripEl.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const isRTL = document.documentElement.dir === "rtl";
      const dir = (e.key === "ArrowRight" ? 1 : -1) * (isRTL ? -1 : 1);
      const nextIdx = (currentIdx + dir + thumbs.length) % thumbs.length;
      e.preventDefault();
      selectAttraction(nextIdx, true);
      const focused = thumbs[nextIdx];
      if (focused) focused.focus();
    });

    let isDown = false;
    let startX;
    let scrollLeft;
    let dragged = false;

    stripEl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      stripEl.classList.add("is-dragging");

      stripEl.style.scrollBehavior = "auto";
      stripEl.style.scrollSnapType = "none";

      startX = e.pageX;
      scrollLeft = stripEl.scrollLeft;
      dragged = false;
    });

    const stopDragging = () => {
      if (!isDown) return;
      isDown = false;
      stripEl.classList.remove("is-dragging");

      stripEl.style.scrollBehavior = "";
      stripEl.style.scrollSnapType = "";
    };

    stripEl.addEventListener("mouseleave", stopDragging);
    stripEl.addEventListener("mouseup", stopDragging);

    stripEl.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        dragged = true;
      }
      const isRTL = document.documentElement.dir === "rtl";
      if (isRTL) {
        stripEl.scrollLeft = scrollLeft + walk;
      } else {
        stripEl.scrollLeft = scrollLeft - walk;
      }
    });

    stripEl.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });

    stripEl.addEventListener(
      "click",
      (e) => {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    applyActive(currentIdx);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
