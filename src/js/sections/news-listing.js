/**
 * sections/news-listing.js
 *
 * News & Events listing page logic:
 *   - Filter chips: All News (always exclusive), Company Updates, Project
 *     Milestones, Community Events, Awards & Recognition
 *   - Search input
 *   - From / To date range
 *   - Pagination (URL-driven)
 *   - Re-renders on language change
 *
 * Mock data (5–10 items) is shipped here for the design preview; later this
 * gets swapped for an API call without changing the markup.
 *
 * IIFE pattern.
 */
(function () {
    'use strict';

    const PAGE_SIZE = 6;

    // Mock dataset — 9 items with mixed categories and dates
    const MOCK_ITEMS = [
        {
            id: 'jc-12bn-contract',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=85',
            category: 'companyUpdates',
            date: '2024-02-05',
            i18nKey: 'newsListing.items.0'
        },
        {
            id: 'efqm-recognition',
            image: 'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=800&q=85',
            category: 'communityEvents',
            date: '2023-10-12',
            i18nKey: 'newsListing.items.1'
        },
        {
            id: 'global-pm-forum',
            image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=85',
            category: 'awardsRecognition',
            date: '2023-06-12',
            i18nKey: 'newsListing.items.2'
        },
        {
            id: 'cityscape-global',
            image: 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=800&q=85',
            category: 'projectMilestones',
            date: '2023-09-13',
            i18nKey: 'newsListing.items.3'
        },
        {
            id: 'efqm-diamond-member',
            image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=85',
            category: 'projectMilestones',
            date: '2023-04-02',
            i18nKey: 'newsListing.items.4'
        },
        {
            id: 'corinthia-mou',
            image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=85',
            category: 'projectMilestones',
            date: '2023-03-30',
            i18nKey: 'newsListing.items.5'
        },
        {
            id: 'q1-progress',
            image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
            category: 'companyUpdates',
            date: '2024-04-15',
            i18nKey: 'newsListing.items.6'
        },
        {
            id: 'green-buildings',
            image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&q=85',
            category: 'projectMilestones',
            date: '2024-05-20',
            i18nKey: 'newsListing.items.7'
        },
        {
            id: 'community-day',
            image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=85',
            category: 'communityEvents',
            date: '2024-06-08',
            i18nKey: 'newsListing.items.8'
        }
    ];

    function init() {
        const root = document.getElementById('news-listing');
        if (!root) return;

        const grid          = root.querySelector('#news-listing-grid');
        const empty         = root.querySelector('#news-listing-empty');
        const searchForm    = root.querySelector('#nl-search-form');
        const searchInput   = root.querySelector('#nl-search');
        const fromInput     = root.querySelector('#nl-date-from');
        const toInput       = root.querySelector('#nl-date-to');
        const filtersWrap   = root.querySelector('#news-listing-filters');
        const paginationEl  = root.querySelector('#news-listing-pagination');

        // ──────────────────────────────────────
        // URL helpers — q, from, to, cat, page
        // ──────────────────────────────────────
        function getParams() {
            const sp = new URLSearchParams(window.location.search);
            const q = (sp.get('q') || '').trim();
            const from = sp.get('from') || '';
            const to = sp.get('to') || '';
            // Categories: empty Set = no filter selected (default).
            // "all" = explicit "All News" pill is active.
            // Or comma-separated category keys.
            const catRaw = (sp.get('cat') || '').trim();
            const cats = catRaw
                ? new Set(catRaw.split(',').filter(Boolean))
                : new Set();
            const pageRaw = parseInt(sp.get('page') || '1', 10);
            const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
            return { q, from, to, cats, page };
        }

        function setParams({ q, from, to, cats, page }, push = true) {
            const sp = new URLSearchParams();
            if (q) sp.set('q', q);
            if (from) sp.set('from', from);
            if (to) sp.set('to', to);
            const catList = [...cats];
            // Only emit ?cat= when there's an explicit selection
            if (catList.length > 0) {
                sp.set('cat', catList.join(','));
            }
            if (page && page > 1) sp.set('page', String(page));
            const qs = sp.toString();
            const url = window.location.pathname + (qs ? '?' + qs : '');
            const fn = push ? 'pushState' : 'replaceState';
            window.history[fn](null, '', url);
        }

        // ──────────────────────────────────────
        // Filtering + paging
        // ──────────────────────────────────────
        function deepGet(o, k) {
            return k.split('.').reduce((a, p) => a && a[p], o);
        }

        function filterItems(translations, params) {
            const { q, from, to, cats } = params;
            const qLower = q.toLowerCase();
            // Empty cats Set = no category filter (show all).
            // Set containing "all" = explicit All News (also shows everything).
            const noCategoryFilter = cats.size === 0 || cats.has('all');
            return MOCK_ITEMS.filter((item) => {
                if (!noCategoryFilter && !cats.has(item.category)) return false;
                if (from && item.date < from) return false;
                if (to && item.date > to) return false;
                if (qLower) {
                    const title = String(deepGet(translations, item.i18nKey + '.title') || '').toLowerCase();
                    const exc = String(deepGet(translations, item.i18nKey + '.excerpt') || '').toLowerCase();
                    if (!title.includes(qLower) && !exc.includes(qLower)) return false;
                }
                return true;
            });
        }

        // ──────────────────────────────────────
        // Rendering
        // ──────────────────────────────────────
        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function formatDate(iso, lang) {
            // Always render as "Mon DD, YYYY" (en) or Arabic equivalent
            try {
                const d = new Date(iso + 'T00:00:00');
                return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                    year: 'numeric', month: 'short', day: '2-digit'
                });
            } catch (_) { return iso; }
        }

        function renderCards(items, translations, lang) {
            if (!items.length) {
                grid.innerHTML = '';
                grid.hidden = true;
                empty.hidden = false;
                return;
            }
            grid.hidden = false;
            empty.hidden = true;

            const readMore = deepGet(translations, 'newsListing.readMore') || 'Read More';
            grid.innerHTML = items.map((item) => {
                const title = deepGet(translations, item.i18nKey + '.title') || '';
                const excerpt = deepGet(translations, item.i18nKey + '.excerpt') || '';
                const tag = deepGet(translations, 'newsListing.categoryNames.' + item.category) || item.category;

                return `
                    <article class="news-list-card">
                        <a class="news-list-card__image" href="news-item.html?id=${escapeHtml(item.id)}" aria-hidden="true" tabindex="-1">
                            <img src="${escapeHtml(item.image)}" alt="" loading="lazy" />
                        </a>
                        <div class="news-list-card__meta">
                            <span class="news-list-card__tag">${escapeHtml(tag)}</span>
                            <time class="news-list-card__date" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date, lang))}</time>
                        </div>
                        <h3 class="news-list-card__title">
                            <a href="news-item.html?id=${escapeHtml(item.id)}">${escapeHtml(title)}</a>
                        </h3>
                        <p class="news-list-card__excerpt">${escapeHtml(excerpt)}</p>
                        <a class="news-list-card__cta" href="news-item.html?id=${escapeHtml(item.id)}">
                            <span>${escapeHtml(readMore)}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </article>
                `;
            }).join('');
        }

        function renderFilters(translations, activeCats) {
            const cats = ['all', 'companyUpdates', 'projectMilestones', 'communityEvents', 'awardsRecognition'];
            const labelHtml = `<span class="news-listing__filters-label" data-i18n="newsListing.filtersLabel">${escapeHtml(deepGet(translations, 'newsListing.filtersLabel') || 'Filters:')}</span>`;
            const chipsHtml = cats.map((cat) => {
                const isActive = activeCats.has(cat);
                const label = deepGet(translations, 'newsListing.categoryNames.' + cat) || cat;
                const closeIcon = isActive
                    ? `<svg class="filter-chip__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                         <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6"/>
                         <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                       </svg>`
                    : '';
                return `<button type="button"
                                 class="filter-chip${isActive ? ' filter-chip--active' : ''}"
                                 data-cat="${cat}"
                                 aria-pressed="${isActive}">
                            <span>${escapeHtml(label)}</span>
                            ${closeIcon}
                        </button>`;
            }).join('');
            filtersWrap.innerHTML = labelHtml + chipsHtml;

            // Wire up
            filtersWrap.querySelectorAll('[data-cat]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const cat = btn.dataset.cat;
                    const params = getParams();
                    if (cat === 'all') {
                        // Toggle "All News": if it's already the only active filter,
                        // clicking it again deselects everything (back to default).
                        if (params.cats.has('all')) {
                            params.cats = new Set();
                        } else {
                            params.cats = new Set(['all']);
                        }
                    } else {
                        params.cats.delete('all');
                        if (params.cats.has(cat)) {
                            params.cats.delete(cat);
                            // Empty after delete — fine, that's the default state.
                        } else {
                            params.cats.add(cat);
                        }
                    }
                    params.page = 1;
                    setParams(params);
                    update();
                });
            });
        }

        function renderPagination(current, total) {
            if (total <= 1) {
                paginationEl.innerHTML = '';
                paginationEl.hidden = true;
                return;
            }
            paginationEl.hidden = false;

            const parts = [];
            parts.push(nav('prev', current > 1 ? current - 1 : null));
            const visible = new Set([1, total, current, current - 1, current + 1]);
            if (current === 1) visible.add(2);
            if (current === total) visible.add(total - 1);
            const ordered = [...visible].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
            let prev = 0;
            ordered.forEach((n) => {
                if (n - prev > 1) parts.push(`<li class="pagination__item"><span class="pagination__btn pagination__btn--ellipsis" aria-hidden="true">…</span></li>`);
                parts.push(`<li class="pagination__item">
                    <button type="button" class="pagination__btn${n === current ? ' pagination__btn--active' : ''}" data-page="${n}"${n === current ? ' aria-current="page"' : ''}>${n}</button>
                </li>`);
                prev = n;
            });
            parts.push(nav('next', current < total ? current + 1 : null));
            paginationEl.innerHTML = parts.join('');

            paginationEl.querySelectorAll('[data-page]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const target = parseInt(btn.dataset.page, 10);
                    if (!isNaN(target)) {
                        const params = getParams();
                        params.page = target;
                        setParams(params);
                        update();
                        window.scrollTo({ top: root.offsetTop - 80, behavior: 'smooth' });
                    }
                });
            });
        }

        function nav(kind, target) {
            const isPrev = kind === 'prev';
            const disabled = target === null;
            const aria = isPrev ? 'Previous page' : 'Next page';
            const arrow = isPrev
                ? '<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                : '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            return `<li class="pagination__item">
                <button type="button" class="pagination__btn pagination__btn--nav"
                        data-page="${target ?? ''}"
                        aria-label="${aria}"
                        ${disabled ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">${arrow}</svg>
                </button>
            </li>`;
        }

        // ──────────────────────────────────────
        // Date display helper
        // The native input is invisible — we paint our own "Choose Date" /
        // formatted-date text via a sibling span, and toggle the wrapper's
        // .has-value class for placeholder vs active styling.
        // ──────────────────────────────────────
        function paintDate(wrap, input, lang) {
            const text = wrap.querySelector('.news-listing__date-text');
            const t = window.__I18N_CACHE__ || {};
            const placeholder = deepGet(t, 'newsListing.chooseDate') || 'Choose Date';

            if (input.value) {
                wrap.classList.add('has-value');
                text.textContent = formatDate(input.value, lang);
            } else {
                wrap.classList.remove('has-value');
                text.textContent = placeholder;
            }
        }

        // Open the native picker on click anywhere in the pill (modern browsers
        // support showPicker(); older ones still get the click via the
        // transparent input layered on top).
        [['#nl-date-from-wrap', fromInput], ['#nl-date-to-wrap', toInput]].forEach(([sel, inp]) => {
            const wrap = root.querySelector(sel);
            if (!wrap) return;
            wrap.addEventListener('click', (e) => {
                // Avoid double-firing if the click already landed on the input
                if (e.target === inp) return;
                if (typeof inp.showPicker === 'function') {
                    try { inp.showPicker(); } catch (_) { inp.focus(); }
                } else {
                    inp.focus();
                }
            });
        });

        // ──────────────────────────────────────
        // Update flow
        // ──────────────────────────────────────
        function update() {
            const params = getParams();
            const lang = (window.I18n && window.I18n.get && window.I18n.get()) || 'en';
            const translations = window.__I18N_CACHE__ || {};

            // Sync inputs to URL state
            searchInput.value = params.q;
            fromInput.value = params.from;
            toInput.value = params.to;

            // Repaint date pills
            const fromWrap = root.querySelector('#nl-date-from-wrap');
            const toWrap = root.querySelector('#nl-date-to-wrap');
            if (fromWrap) paintDate(fromWrap, fromInput, lang);
            if (toWrap) paintDate(toWrap, toInput, lang);

            const all = filterItems(translations, params);
            const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
            const page = Math.min(params.page, totalPages);
            const start = (page - 1) * PAGE_SIZE;
            const slice = all.slice(start, start + PAGE_SIZE);

            renderFilters(translations, params.cats);
            renderCards(slice, translations, lang);
            renderPagination(page, totalPages);
        }

        // ──────────────────────────────────────
        // Event wiring
        // ──────────────────────────────────────
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const params = getParams();
            params.q = searchInput.value.trim();
            params.page = 1;
            setParams(params);
            update();
        });

        [fromInput, toInput].forEach((el) => {
            el.addEventListener('change', () => {
                const params = getParams();
                params.from = fromInput.value;
                params.to = toInput.value;
                params.page = 1;
                setParams(params);
                update();
            });
        });

        window.addEventListener('popstate', update);

        // Cache translations and re-render on language change
        if (window.I18n && window.I18n.onLangChange) {
            window.I18n.onLangChange((lang, t) => {
                window.__I18N_CACHE__ = t;
                update();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
