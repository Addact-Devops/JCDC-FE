/**
 * sections/attraction-page.js
 *
 * Drives the attraction page slider:
 *   - Click on a thumbnail swaps the active image, title, district, and
 *     description.
 *   - The swap is a brief fade-out → content swap → fade-in, so the change
 *     feels smooth even with no slide-in animation.
 *   - The active thumbnail label turns blue + bold; others stay grey.
 *   - The thumbnail strip is horizontally scrollable; clicking a partially
 *     visible thumbnail also scrolls it into view.
 *   - All copy is sourced from i18n so EN/AR both work.
 *
 * Mock data lives in i18n (`attraction.items`) so it's editable without
 * touching JS. Replace with API data later — the renderer is unchanged.
 *
 * IIFE pattern.
 */
(function () {
    'use strict';

    const FADE_MS = 250; // must match the .is-fading transition in SCSS

    function init() {
        const root = document.getElementById('attraction-slider');
        if (!root) return;

        const activeImageEl = root.querySelector('#attraction-active-image');
        const activeImg     = activeImageEl && activeImageEl.querySelector('img');
        const titleOverlay  = root.querySelector('#attraction-title-overlay');
        const titleEl       = root.querySelector('#attraction-title');
        const infoEl        = root.querySelector('#attraction-info');
        const districtEl    = root.querySelector('#attraction-district');
        const descriptionEl = root.querySelector('#attraction-description');
        const stripEl       = root.querySelector('#attraction-strip');

        if (!activeImg || !titleEl || !districtEl || !descriptionEl || !stripEl) return;

        let items = [];
        let currentIdx = 0;

        // ──────────────────────────────────────
        // Helpers
        // ──────────────────────────────────────
        function deepGet(o, k) {
            return k.split('.').reduce((a, p) => a && a[p], o);
        }

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        // ──────────────────────────────────────
        // Render the thumbnail strip
        // ──────────────────────────────────────
        function renderStrip() {
            stripEl.innerHTML = items.map((it, i) => `
                <button type="button"
                        class="attraction-thumb${i === currentIdx ? ' attraction-thumb--active' : ''}"
                        data-attraction-idx="${i}"
                        aria-label="Show ${escapeHtml(it.title)}"
                        ${i === currentIdx ? 'aria-current="true"' : ''}>
                    <span class="attraction-thumb__image">
                        <img src="${escapeHtml(it.thumbnail || it.image)}"
                             alt="${escapeHtml(it.title)}"
                             loading="lazy" />
                    </span>
                    <span class="attraction-thumb__label">${escapeHtml(it.title)}</span>
                </button>
            `).join('');

            stripEl.querySelectorAll('[data-attraction-idx]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const i = parseInt(btn.dataset.attractionIdx, 10);
                    if (!isNaN(i) && i !== currentIdx) selectAttraction(i, true);
                });
            });
        }

        // ──────────────────────────────────────
        // Paint the active state (no fade — used for first paint and for
        // language change). Subsequent user clicks go through swapActive().
        // ──────────────────────────────────────
        function paintActive(item, t) {
            if (!item) return;
            const districtLabel = deepGet(t, 'attraction.districtLabel') || 'District:';

            if (activeImg) {
                activeImg.src = item.image || '';
                activeImg.alt = item.title || '';
            }
            if (titleEl) titleEl.textContent = item.title || '';
            if (districtEl) {
                districtEl.innerHTML =
                    `<strong>${escapeHtml(districtLabel)}</strong> ${escapeHtml(item.district || '')}`;
            }
            if (descriptionEl) descriptionEl.textContent = item.description || '';
        }

        // Swap the active state with a fade.
        // 1. Fade out title overlay + info text + image  (250 ms)
        // 2. Swap content
        // 3. Fade back in
        function swapActive(item, t) {
            const targets = [titleOverlay, infoEl, activeImageEl].filter(Boolean);
            targets.forEach((el) => el.classList.add('is-fading'));

            setTimeout(() => {
                paintActive(item, t);
                // Force reflow so the transition re-runs cleanly
                void root.offsetWidth;
                targets.forEach((el) => el.classList.remove('is-fading'));
            }, FADE_MS);
        }

        // ──────────────────────────────────────
        // Select an attraction (called from thumbnail clicks)
        // ──────────────────────────────────────
        function selectAttraction(i, userInitiated) {
            if (i < 0 || i >= items.length || i === currentIdx) return;
            currentIdx = i;

            // Refresh active class on thumbnails
            stripEl.querySelectorAll('[data-attraction-idx]').forEach((btn, idx) => {
                btn.classList.toggle('attraction-thumb--active', idx === currentIdx);
                if (idx === currentIdx) btn.setAttribute('aria-current', 'true');
                else btn.removeAttribute('aria-current');
            });

            const t = window.__I18N_CACHE__ || {};
            swapActive(items[currentIdx], t);

            // Scroll the active thumbnail into view (smoothly, but only if
            // the user clicked — not on language-change-driven re-render)
            if (userInitiated) {
                const target = stripEl.querySelector(`[data-attraction-idx="${currentIdx}"]`);
                if (target && target.scrollIntoView) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        }

        // ──────────────────────────────────────
        // Bind to i18n (initial paint + language change)
        // ──────────────────────────────────────
        function bind() {
            window.I18n.onLangChange((lang, t) => {
                window.__I18N_CACHE__ = t;
                items = (deepGet(t, 'attraction.items') || []).slice();
                if (currentIdx >= items.length) currentIdx = 0;
                renderStrip();
                paintActive(items[currentIdx], t);
            });
        }
        if (window.I18n && window.I18n.onLangChange) {
            bind();
        } else {
            const poll = setInterval(() => {
                if (window.I18n && window.I18n.onLangChange) {
                    clearInterval(poll);
                    bind();
                }
            }, 50);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
