/**
 * sections/news-item.js
 *
 * Renders a single news article + the "Other Articles" sidebar.
 * The article identifier comes from ?id=… in the URL; if absent, falls back
 * to the first item in the dataset.
 *
 * Mock dataset is shared with news-listing.js conceptually. To avoid coupling,
 * we maintain a separate copy here keyed by id. Replace with API fetch later.
 *
 * IIFE pattern.
 */
(function () {
  "use strict";

  // Same mock items used in news-listing.js (kept in sync manually for now)
  const MOCK_ITEMS = [
    {
      id: "jc-12bn-contract",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=85",
      date: "2024-02-05",
      i18nKey: "newsListing.items.0",
      category: "companyUpdates",
    },
    {
      id: "efqm-recognition",
      image:
        "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=800&q=85",
      date: "2023-10-12",
      i18nKey: "newsListing.items.1",
      category: "communityEvents",
    },
    {
      id: "global-pm-forum",
      image:
        "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=85",
      date: "2023-06-12",
      i18nKey: "newsListing.items.2",
      category: "awardsRecognition",
    },
    {
      id: "cityscape-global",
      image:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=85",
      date: "2023-09-13",
      i18nKey: "newsListing.items.3",
      category: "projectMilestones",
    },
    {
      id: "efqm-diamond-member",
      image:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=85",
      date: "2023-04-02",
      i18nKey: "newsListing.items.4",
      category: "projectMilestones",
    },
    {
      id: "corinthia-mou",
      image:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=85",
      date: "2023-03-30",
      i18nKey: "newsListing.items.5",
      category: "projectMilestones",
    },
    {
      id: "q1-progress",
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85",
      date: "2024-04-15",
      i18nKey: "newsListing.items.6",
      category: "companyUpdates",
    },
    {
      id: "green-buildings",
      image:
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&q=85",
      date: "2024-05-20",
      i18nKey: "newsListing.items.7",
      category: "projectMilestones",
    },
    {
      id: "community-day",
      image:
        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=85",
      date: "2024-06-08",
      i18nKey: "newsListing.items.8",
      category: "communityEvents",
    },
  ];

  function init() {
    const root = document.getElementById("news-item");
    if (!root) return;

    const titleEl = document.getElementById("news-item-title");
    const dateEl = document.getElementById("news-item-date");
    const heroImg = document.getElementById("news-item-hero-img");
    const articleEl = document.getElementById("news-item-article");
    const relatedEl = document.getElementById("news-item-related");

    function deepGet(o, k) {
      return k.split(".").reduce((a, p) => a && a[p], o);
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function formatDate(iso, lang) {
      try {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        });
      } catch (_) {
        return iso;
      }
    }

    function getActiveItem() {
      const sp = new URLSearchParams(window.location.search);
      const id = sp.get("id");
      return MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];
    }

    function render(translations, lang) {
      const item = getActiveItem();

      // Hero — title + date + (optional) background image
      const title = deepGet(translations, item.i18nKey + ".title") || "";
      if (titleEl) titleEl.textContent = title;
      if (dateEl) dateEl.textContent = formatDate(item.date, lang);
      if (heroImg) heroImg.src = item.image;

      // Article body — paragraphs come from i18n (paragraphs array)
      const paragraphs = deepGet(translations, item.i18nKey + ".body") || [];
      articleEl.innerHTML = paragraphs
        .map((p) => `<p class="news-item__paragraph">${escapeHtml(p)}</p>`)
        .join("");

      // Related — show the other 4 items (not the active one)
      const related = MOCK_ITEMS.filter((i) => i.id !== item.id).slice(0, 4);
      relatedEl.innerHTML = related
        .map((r) => {
          const rTitle = deepGet(translations, r.i18nKey + ".title") || "";
          return `
                    <li class="related-article">
                        <div class="related-article__body">
                            <p class="related-article__date">${escapeHtml(formatDate(r.date, lang))}</p>
                            <h3 class="related-article__title">
                                <a href="news-item.html?id=${escapeHtml(r.id)}">${escapeHtml(rTitle)}</a>
                            </h3>
                        </div>
                        <a class="related-article__image" href="news-item.html?id=${escapeHtml(r.id)}" aria-hidden="true" tabindex="-1">
                            <img src="${escapeHtml(r.image)}" alt="" loading="lazy" />
                        </a>
                    </li>
                `;
        })
        .join("");
    }

    // Subscribe to i18n
    if (window.I18n && window.I18n.onLangChange) {
      window.I18n.onLangChange((lang, t) => render(t, lang));
    } else {
      const poll = setInterval(() => {
        if (window.I18n && window.I18n.onLangChange) {
          clearInterval(poll);
          window.I18n.onLangChange((lang, t) => render(t, lang));
        }
      }, 50);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
