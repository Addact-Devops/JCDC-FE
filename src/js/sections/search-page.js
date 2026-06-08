/**
 * sections/search-page.js
 *
 * Drives the search page:
 *   - Reads `q` (query) and `page` from window.location.search
 *   - Renders mock results (10 items max for design preview — replace with
 *     real API fetch later)
 *   - Submits the search form and updates the URL with ?q=…&page=1
 *   - Pagination updates ?page=N, and Prev/Next stay disabled at the ends
 *   - Re-renders on language change so the "Showing Results for" line and
 *     the mock titles update properly.
 *
 * IIFE pattern (matches the rest of the codebase).
 */
(function () {
  "use strict";

  const PAGE_SIZE = 4; // Items per page in the design preview
  const TOTAL_PAGES = 15; // Matches the Figma pagination "1, 2, …, 15"

  function init() {
    const root = document.getElementById("search-page");
    if (!root) return;

    const form = root.querySelector("#search-form");
    const input = root.querySelector("#search-input");
    const meta = root.querySelector("#search-meta");
    const resultsList = root.querySelector("#search-results");
    const empty = root.querySelector("#search-empty");
    const paginationEl = root.querySelector("#search-pagination");

    // ──────────────────────────────────────
    // URL helpers
    // ──────────────────────────────────────
    function getParams() {
      const sp = new URLSearchParams(window.location.search);
      const q = (sp.get("q") || "").trim();
      const pageRaw = parseInt(sp.get("page") || "1", 10);
      const page =
        isNaN(pageRaw) || pageRaw < 1
          ? 1
          : pageRaw > TOTAL_PAGES
            ? TOTAL_PAGES
            : pageRaw;
      return { q, page };
    }

    function setParams(q, page, push = true) {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (page && page > 1) sp.set("page", String(page));
      const qs = sp.toString();
      const url = window.location.pathname + (qs ? "?" + qs : "");
      const fn = push ? "pushState" : "replaceState";
      window.history[fn]({ q, page }, "", url);
    }

    // ──────────────────────────────────────
    // Rendering
    // ──────────────────────────────────────
    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function getMockResults(query, lang) {
      // 10 mock results per Figma design — first one matches the active
      // query so it looks natural; rest are static lorem-style copy.
      const ar = lang === "ar";
      const t = ar ? "العنوان" : "Title";
      const body = ar
        ? "هذا نص تجريبي قصير لعرض كيفية ظهور نتائج البحث في الصفحة. يمكن استبداله لاحقاً بمحتوى حقيقي من نتائج البحث."
        : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed mollis ipsum. Donec dapibus mi nec nunc interdum mollis. In quis suscipit purus. Phasellus quis elit vel ex volutpat finibus ac ac ipsum.";

      return Array.from({ length: 10 }).map((_, i) => ({
        title: `${t} ${i + 1}${query ? " — " + query : ""}`,
        description: body,
        href: "#",
      }));
    }

    function renderMeta(query, lang) {
      const ar = lang === "ar";
      if (!query) {
        meta.innerHTML = "";
        meta.hidden = true;
        return;
      }
      meta.hidden = false;
      const before = ar ? "عرض النتائج لـ " : "Showing Results for ";
      meta.innerHTML = `${escapeHtml(before)}<strong>"${escapeHtml(query)}"</strong>`;
    }

    function renderResults(results) {
      if (!results.length) {
        resultsList.innerHTML = "";
        resultsList.hidden = true;
        empty.hidden = false;
        paginationEl.hidden = true;
        return;
      }
      resultsList.hidden = false;
      empty.hidden = true;
      paginationEl.hidden = false;

      resultsList.innerHTML = results
        .map(
          (r) => `
                <li class="search-result">
                    <a class="search-result__link" href="${escapeHtml(r.href)}">
                        <h2 class="search-result__title">${escapeHtml(r.title)}</h2>
                        <p class="search-result__description">${escapeHtml(r.description)}</p>
                    </a>
                </li>
            `,
        )
        .join("");
    }

    // ──────────────────────────────────────
    // Pagination renderer (compact: prev / 1 / 2 / … / last / next)
    // ──────────────────────────────────────
    function renderPagination(current, total, query) {
      if (total < 1) {
        paginationEl.innerHTML = "";
        return;
      }

      const parts = [];

      // Prev button
      parts.push(navItem("prev", current > 1 ? current - 1 : null, query));

      // Smart page list: always show 1 and total; surrounding current; ellipsis between
      const visible = new Set([1, total, current, current - 1, current + 1]);
      // Also show "2" early if total > 2 and we're near the start
      if (current === 1) visible.add(2);
      if (current === total) visible.add(total - 1);

      const ordered = [...visible]
        .filter((n) => n >= 1 && n <= total)
        .sort((a, b) => a - b);

      let prev = 0;
      ordered.forEach((n) => {
        if (n - prev > 1) {
          parts.push(
            `<li class="pagination__item"><span class="pagination__btn pagination__btn--ellipsis" aria-hidden="true">…</span></li>`,
          );
        }
        parts.push(pageItem(n, n === current, query));
        prev = n;
      });

      // Next button
      parts.push(navItem("next", current < total ? current + 1 : null, query));

      paginationEl.innerHTML = parts.join("");

      // Wire click handlers (delegated)
      paginationEl.querySelectorAll("[data-page]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const target = parseInt(btn.dataset.page, 10);
          if (!isNaN(target)) {
            const { q } = getParams();
            setParams(q, target);
            update();
            window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" });
          }
        });
      });
    }

    function pageItem(n, isActive, _query) {
      const cls = `pagination__btn${isActive ? " pagination__btn--active" : ""}`;
      const aria = isActive ? ' aria-current="page"' : "";
      return `<li class="pagination__item">
                <button type="button" class="${cls}" data-page="${n}"${aria}>${n}</button>
            </li>`;
    }

    function navItem(kind, target, _query) {
      const isPrev = kind === "prev";
      const disabled = target === null;
      const aria = isPrev ? "Previous page" : "Next page";
      const arrow = isPrev
        ? '<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

      return `<li class="pagination__item">
                <button type="button"
                        class="pagination__btn pagination__btn--nav"
                        data-page="${target ?? ""}"
                        aria-label="${aria}"
                        ${disabled ? "disabled" : ""}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">${arrow}</svg>
                </button>
            </li>`;
    }

    // ──────────────────────────────────────
    // Update flow
    // ──────────────────────────────────────
    function update() {
      const { q, page } = getParams();
      const lang =
        (window.I18n && window.I18n.get && window.I18n.get()) || "en";

      input.value = q;
      renderMeta(q, lang);

      const all = getMockResults(q, lang);
      const start = (page - 1) * PAGE_SIZE;
      const slice = all.slice(start, start + PAGE_SIZE);
      renderResults(slice);
      renderPagination(page, TOTAL_PAGES, q);
    }

    // ──────────────────────────────────────
    // Event wiring
    // ──────────────────────────────────────
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      setParams(q, 1);
      update();
    });

    // Re-render when the user uses the back/forward buttons
    window.addEventListener("popstate", update);

    // Re-render on language change (re-fetches the localized strings)
    if (window.I18n && window.I18n.onLangChange) {
      window.I18n.onLangChange(update);
    }

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

(function () {
  var p = new URLSearchParams(window.location.search);

  if (p.has("q") || p.has("page")) {
    var el = document.getElementById("search-page-be");

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
})();
