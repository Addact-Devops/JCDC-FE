window.Navbar = (function () {
  "use strict";

  function initScrollState(root) {
    const ENTER_THRESHOLD = 640;
    const EXIT_THRESHOLD = 640;
    let isSolid = root.classList.contains("is-solid");
    let ticking = false;

    const applyState = () => {
      const y = window.scrollY || window.pageYOffset || 0;

      if (!isSolid && y > ENTER_THRESHOLD) {
        isSolid = true;
        root.classList.add("is-solid");
      } else if (isSolid && y < EXIT_THRESHOLD) {
        isSolid = false;
        root.classList.remove("is-solid");
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyState);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    applyState();
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

        items.forEach((i) => {
          i.classList.remove("is-open");
          i.querySelector("[data-dropdown-toggle]")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });

        if (!open) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        items.forEach((i) => {
          i.classList.remove("is-open");
          i.querySelector("[data-dropdown-toggle]")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        items.forEach((i) => {
          i.classList.remove("is-open");
          i.querySelector("[data-dropdown-toggle]")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });
      }
    });
  }

  function init(root) {
    root =
      root ||
      document.querySelector(".navbar") ||
      document.getElementById("navbar");
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
