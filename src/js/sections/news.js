window.News = (function () {
  "use strict";

  const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=85",
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=85",
    "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=85",
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function render(grid, translations) {
    const items = translations?.news?.items || [];
    const learnMore = translations?.news?.learnMore || "Learn More";
    if (!items.length) return;

    let images = DEFAULT_IMAGES;
    if (grid.dataset.images) {
      try {
        images = JSON.parse(grid.dataset.images);
      } catch (_) {}
    }

    grid.innerHTML = items
      .map(
        (title, i) => `
      <article class="news-card">
        <div class="news-card__image">
          <img src="${images[i] || images[0]}" alt="${escapeHtml(title)}" loading="lazy" />
        </div>
        <div class="news-card__body">
          <h3 class="news-card__title">${escapeHtml(title)}</h3>
        </div>
        <a href="#" class="news-card__cta">
          <span>${escapeHtml(learnMore)}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </article>
    `,
      )
      .join("");
  }

  function initReveal(root) {
    const grid = root.querySelector(".news__grid");
    if (!grid) return;

    const cards = grid.querySelectorAll(".news-card");
    cards.forEach((card, i) => {
      card.style.transitionDelay = i * 0.95 + "s";
    });

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
    root = root || document.querySelector(".news");
    if (!root) return;

    initReveal(root);

    const grid =
      root.querySelector("#news-grid1") || root.querySelector(".news__grid1");
    if (!grid) return;

    const bind = () => window.I18n.onLangChange((lang, t) => render(grid, t));

    if (window.I18n) {
      bind();
    } else {
      const poll = setInterval(() => {
        if (window.I18n) {
          clearInterval(poll);
          bind();
        }
      }, 50);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  return { init, render };
})();
