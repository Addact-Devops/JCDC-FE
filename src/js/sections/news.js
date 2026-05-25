/**
 * pages/news-listing.js — News & Events listing
 *
 * Filters static cards by:
 *   - search query (matches data-search + live title/excerpt text)
 *   - active filter chip (matches data-category; "all" matches everything)
 *   - From / To date range (matches data-date, inclusive)
 *
 * Hides non-matching cards with the `hidden` attribute so screen
 * readers and keyboard tab order skip them.
 */
(function () {
    "use strict";

    const section = document.getElementById("news-listing");
    if (!section) return;

    const searchForm = section.querySelector("#nl-search-form");
    const searchInput = section.querySelector("#nl-search");
    const fromInput = section.querySelector("#nl-date-from");
    const toInput = section.querySelector("#nl-date-to");
    const fromWrap = section.querySelector("#nl-date-from-wrap");
    const toWrap = section.querySelector("#nl-date-to-wrap");
    const chips = Array.from(section.querySelectorAll(".filter-chip"));
    const cards = Array.from(section.querySelectorAll(".news-list-card"));
    const empty = section.querySelector("#news-listing-empty");

    const state = {
        query: "",
        category: "all",
        from: null,
        to: null,
    };

    function parseDate(value) {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    // Pull live, language-aware search text from the card itself, then
    // fall back to data-search for any extra keywords.
    function getHaystack(card) {
        const title = card.querySelector(".news-list-card__title")?.textContent || "";
        const excerpt = card.querySelector(".news-list-card__excerpt")?.textContent || "";
        const tag = card.querySelector(".news-list-card__tag")?.textContent || "";
        const extra = card.dataset.search || "";
        return (title + " " + excerpt + " " + tag + " " + extra).toLowerCase();
    }

    function cardMatches(card) {
        if (state.category !== "all" && card.dataset.category !== state.category) return false;

        if (state.query) {
            if (!getHaystack(card).includes(state.query)) return false;
        }

        if (state.from || state.to) {
            const cardDate = parseDate(card.dataset.date);
            if (!cardDate) return false;
            if (state.from && cardDate < state.from) return false;
            if (state.to && cardDate > state.to) return false;
        }

        return true;
    }

    function applyFilters() {
        let visibleCount = 0;
        cards.forEach((card) => {
            const match = cardMatches(card);
            card.hidden = !match;
            if (match) visibleCount++;
        });
        if (empty) empty.hidden = visibleCount !== 0;
    }

    // ----- Chip behaviour -----
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => {
                c.classList.remove("filter-chip--active");
                c.setAttribute("aria-pressed", "false");
            });
            chip.classList.add("filter-chip--active");
            chip.setAttribute("aria-pressed", "true");

            state.category = chip.dataset.filter || "all";
            applyFilters();
        });
    });

    // ----- Search -----
    if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            state.query = (searchInput.value || "").trim().toLowerCase();
            applyFilters();
        });
    }

    if (searchInput) {
        let t;
        searchInput.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(() => {
                state.query = (searchInput.value || "").trim().toLowerCase();
                applyFilters();
            }, 150);
        });
    }

    // ----- Date inputs -----
    function setHasValue(wrap, input, placeholderText) {
        const textEl = wrap.querySelector(".news-listing__date-text");
        if (input.value) {
            wrap.classList.add("has-value");
            const d = parseDate(input.value);
            if (d && textEl) {
                const locale = document.documentElement.lang === "ar" ? "ar" : "en";
                textEl.textContent = d.toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
            }
        } else {
            wrap.classList.remove("has-value");
            if (textEl) textEl.textContent = placeholderText;
        }
    }

    function wireDateField(wrap, input, stateKey) {
        if (!wrap || !input) return;

        const placeholderEl = wrap.querySelector(".news-listing__date-text");
        const placeholderText = placeholderEl?.textContent || "Choose Date";

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
            state[stateKey] = parseDate(input.value);
            setHasValue(wrap, input, placeholderText);
            applyFilters();
        });
    }

    wireDateField(fromWrap, fromInput, "from");
    wireDateField(toWrap, toInput, "to");

    // ----- Re-filter when language changes (Arabic search support) -----
    if (window.I18n && typeof window.I18n.onLangChange === "function") {
        window.I18n.onLangChange(() => {
            // Let the i18n system finish swapping text, then re-run filters
            // so live haystack search picks up the new language.
            requestAnimationFrame(applyFilters);
        });
    }

    // ----- Initial render -----
    applyFilters();
})();
