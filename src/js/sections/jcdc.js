window.Jcdc = (function () {
  "use strict";

  function initReveal(root) {
    if (!("IntersectionObserver" in window)) {
      root.classList.add("in-view");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          root.classList.add("in-view");
          observer.unobserve(root);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -45% 0px" },
    );

    observer.observe(root);
  }

  function init(root) {
    root = root || document.querySelector(".jcdc");
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
