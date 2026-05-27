/**
 * sections/news-listing.js
 *
 * News & Events listing — static-first version.
 *
 * Cards and filter chips are rendered statically in HTML. This script:
 *   - Reads cards from the DOM (data-category, data-date, text content)
 *   - Filters them by chips / search / date range / page
 *   - Toggles `hidden` rather than re-rendering
 *   - Re-formats <time> elements on language change
 *
 * URL params: q, from, to, cat (comma list or "all"), page.
 */
(function () {
    "use strict";

    const PAGE_SIZE = 6;

    function init() {
        const root = document.getElementById("news-listing");
        if (!root) return;

        const grid = root.querySelector("#news-listing-grid");
        const empty = root.querySelector("#news-listing-empty");
        const searchForm = root.querySelector("#nl-search-form");
        const searchInput = root.querySelector("#nl-search");
        const fromInput = root.querySelector("#nl-date-from");
        const toInput = root.querySelector("#nl-date-to");
        const filtersWrap = root.querySelector("#news-listing-filters");
        const paginationEl = root.querySelector("#news-listing-pagination");

        // All cards present in the DOM. Read once — they don't get added/removed.
        const cards = Array.from(grid.querySelectorAll(".news-list-card"));

        // ──────────────────────────────────────
        // URL state
        // ──────────────────────────────────────
        function getParams() {
            const sp = new URLSearchParams(window.location.search);
            const q = (sp.get("q") || "").trim();
            const from = sp.get("from") || "";
            const to = sp.get("to") || "";
            const catRaw = (sp.get("cat") || "").trim();
            const cats = catRaw ? new Set(catRaw.split(",").filter(Boolean)) : new Set();
            const pageRaw = parseInt(sp.get("page") || "1", 10);
            const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
            return { q, from, to, cats, page };
        }

        function setParams({ q, from, to, cats, page }, push = true) {
            const sp = new URLSearchParams();
            if (q) sp.set("q", q);
            if (from) sp.set("from", from);
            if (to) sp.set("to", to);
            const catList = [...cats];
            if (catList.length > 0) sp.set("cat", catList.join(","));
            if (page && page > 1) sp.set("page", String(page));
            const qs = sp.toString();
            const url = window.location.pathname + (qs ? "?" + qs : "");
            window.history[push ? "pushState" : "replaceState"](null, "", url);
        }

        // ──────────────────────────────────────
        // Filtering
        // ──────────────────────────────────────
        function filterCards(params) {
            const { q, from, to, cats } = params;
            const qLower = q.toLowerCase();
            // Empty set = no chip active; "all" set = explicit All News pill.
            // Both mean "show everything".
            const noCategoryFilter = cats.size === 0 || cats.has("all");

            return cards.filter((card) => {
                const cat = card.dataset.category;
                const date = card.dataset.date;

                if (!noCategoryFilter && !cats.has(cat)) return false;
                if (from && date < from) return false;
                if (to && date > to) return false;

                if (qLower) {
                    // Search the actual rendered text — works for whichever
                    // language is currently active.
                    const titleEl = card.querySelector(".news-list-card__title");
                    const excerptEl = card.querySelector(".news-list-card__excerpt");
                    const title = (titleEl?.textContent || "").toLowerCase();
                    const excerpt = (excerptEl?.textContent || "").toLowerCase();
                    if (!title.includes(qLower) && !excerpt.includes(qLower)) {
                        return false;
                    }
                }
                return true;
            });
        }

        // ──────────────────────────────────────
        // Date formatting (locale-aware)
        // ──────────────────────────────────────
        function formatDate(iso, lang) {
            try {
                const d = new Date(iso + "T00:00:00");
                return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                });
            } catch (_) {
                return iso;
            }
        }

        function refreshDateLabels(lang) {
            cards.forEach((card) => {
                const t = card.querySelector(".news-list-card__date");
                if (!t) return;
                const iso = t.getAttribute("datetime");
                if (iso) t.textContent = formatDate(iso, lang);
            });
        }

        // ──────────────────────────────────────
        // Filter chips state
        // ──────────────────────────────────────
        // function syncChips(activeCats) {
        //     filtersWrap.querySelectorAll("[data-cat]").forEach((btn) => {
        //         const cat = btn.dataset.cat;
        //         // If nothing is selected at all, treat "All News" as visually active.
        //         const isActive = activeCats.size === 0 ? cat === "all" : activeCats.has(cat);
        //         btn.classList.toggle("filter-chip--active", isActive);
        //         btn.setAttribute("aria-pressed", String(isActive));
        //     });
        // }
        function syncChips(activeCats) {
          filtersWrap.querySelectorAll("[data-cat]").forEach((btn) => {
            const cat = btn.dataset.cat;

            const isActive = activeCats.has(cat);

            btn.classList.toggle("filter-chip--active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
          });
        }

        filtersWrap.querySelectorAll("[data-cat]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const cat = btn.dataset.cat;
                const params = getParams();

                if (cat === "all") {
                    // Click All News → clear everything else, set "all".
                    // Click again (already only "all") → clear back to default.
                    if (params.cats.has("all")) {
                        params.cats = new Set();
                    } else {
                        params.cats = new Set(["all"]);
                    }
                } else {
                    params.cats.delete("all");
                    if (params.cats.has(cat)) params.cats.delete(cat);
                    else params.cats.add(cat);
                }
                params.page = 1;
                setParams(params);
                update();
            });
        });

        // ──────────────────────────────────────
        // Pagination
        // ──────────────────────────────────────
        function renderPagination(current, total) {
            if (total <= 1) {
                paginationEl.innerHTML = "";
                paginationEl.hidden = true;
                return;
            }
            paginationEl.hidden = false;

            const parts = [];
            parts.push(navBtn("prev", current > 1 ? current - 1 : null));

            const visible = new Set([1, total, current, current - 1, current + 1]);
            if (current === 1) visible.add(2);
            if (current === total) visible.add(total - 1);
            const ordered = [...visible].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

            let prev = 0;
            ordered.forEach((n) => {
                if (n - prev > 1) {
                    parts.push(
                        `<li class="pagination__item"><span class="pagination__btn pagination__btn--ellipsis" aria-hidden="true">…</span></li>`,
                    );
                }
                parts.push(`<li class="pagination__item">
                    <button type="button" class="pagination__btn${n === current ? " pagination__btn--active" : ""}" data-page="${n}"${n === current ? ' aria-current="page"' : ""}>${n}</button>
                </li>`);
                prev = n;
            });

            parts.push(navBtn("next", current < total ? current + 1 : null));
            paginationEl.innerHTML = parts.join("");

            paginationEl.querySelectorAll("[data-page]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const target = parseInt(btn.dataset.page, 10);
                    if (isNaN(target)) return;
                    const params = getParams();
                    params.page = target;
                    setParams(params);
                    update();
                    window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" });
                });
            });
        }

        function navBtn(kind, target) {
            const isPrev = kind === "prev";
            const disabled = target === null;
            const aria = isPrev ? "Previous page" : "Next page";
            const arrow = isPrev
                ? '<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                : '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            return `<li class="pagination__item">
                <button type="button" class="pagination__btn pagination__btn--nav"
                        data-page="${target ?? ""}"
                        aria-label="${aria}"
                        ${disabled ? "disabled" : ""}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">${arrow}</svg>
                </button>
            </li>`;
        }

        // ──────────────────────────────────────
        // Date pill (placeholder ↔ formatted value)
        // ──────────────────────────────────────
        function paintDate(wrap, input, lang) {
            const text = wrap.querySelector(".news-listing__date-text");
            const t = window.__I18N_CACHE__ || {};
            const placeholder = (t.newsListing && t.newsListing.chooseDate) || "Choose Date";

            if (input.value) {
                wrap.classList.add("has-value");
                text.textContent = formatDate(input.value, lang);
            } else {
                wrap.classList.remove("has-value");
                text.textContent = placeholder;
            }
        }

        [
            ["#nl-date-from-wrap", fromInput],
            ["#nl-date-to-wrap", toInput],
        ].forEach(([sel, inp]) => {
            const wrap = root.querySelector(sel);
            if (!wrap) return;
            wrap.addEventListener("click", (e) => {
                if (e.target === inp) return;
                if (typeof inp.showPicker === "function") {
                    try {
                        inp.showPicker();
                    } catch (_) {
                        inp.focus();
                    }
                } else {
                    inp.focus();
                }
            });
        });

        // ──────────────────────────────────────
        // Main update — filter + paginate the existing cards
        // ──────────────────────────────────────
        function update() {
            const params = getParams();
            const lang = (window.I18n && window.I18n.get && window.I18n.get()) || "en";

            // Sync controls to URL
            searchInput.value = params.q;
            fromInput.value = params.from;
            toInput.value = params.to;

            const fromWrap = root.querySelector("#nl-date-from-wrap");
            const toWrap = root.querySelector("#nl-date-to-wrap");
            if (fromWrap) paintDate(fromWrap, fromInput, lang);
            if (toWrap) paintDate(toWrap, toInput, lang);

            // Filter
            const matched = filterCards(params);
            const totalPages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
            const page = Math.min(params.page, totalPages);
            const start = (page - 1) * PAGE_SIZE;
            const pageSet = new Set(matched.slice(start, start + PAGE_SIZE));

            // Toggle visibility — no re-rendering
            cards.forEach((card) => {
                card.hidden = !pageSet.has(card);
            });
            // Empty state
            if (matched.length === 0) {
                grid.hidden = true;
                empty.hidden = false;
            } else {
                grid.hidden = false;
                empty.hidden = true;
            }

            syncChips(params.cats);
            renderPagination(page, totalPages);
        }

        // ──────────────────────────────────────
        // Wiring
        // ──────────────────────────────────────
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const params = getParams();
            params.q = searchInput.value.trim();
            params.page = 1;
            setParams(params);
            update();
        });

        [fromInput, toInput].forEach((el) => {
            el.addEventListener("change", () => {
                const params = getParams();
                params.from = fromInput.value;
                params.to = toInput.value;
                params.page = 1;
                setParams(params);
                update();
            });
        });

        window.addEventListener("popstate", update);

        // Re-run when language changes so dates and the chip "All News" default
        // get redrawn against the freshly-translated text.
        if (window.I18n && window.I18n.onLangChange) {
            window.I18n.onLangChange((lang, t) => {
                window.__I18N_CACHE__ = t;
                refreshDateLabels(lang);
                update();
            });
        } else {
            refreshDateLabels("en");
        }

        // First paint
        update();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    (() => {
        const section = document.getElementById("news-listing-be");
        if (!section) return;

        const form = section.querySelector("#nl-be-form");

        ["nl-date-from-wrap", "nl-date-to-wrap"].forEach((wrapId) => {
            const wrap = section.querySelector(`#${wrapId}`);
            if (!wrap) return;

            const input = wrap.querySelector(".news-listing__date-input");
            if (!input) return;

            wrap.addEventListener("click", (e) => {
                if (e.target === input) return;

                if (typeof input.showPicker === "function") {
                    try {
                        input.showPicker();
                    } catch {
                        input.focus();
                    }
                } else {
                    input.focus();
                }
            });

            input.addEventListener("change", () => {
                form?.submit();
            });
        });
    })();
})();
