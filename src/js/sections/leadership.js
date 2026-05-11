/**
 * sections/leadership.js
 *
 * Drives the Leadership component on about.html:
 *   - Two tabs: Board of Directors | Executive Management
 *   - BoD: 1 chairman card (full-width) + N director cards in a 3-col grid
 *   - Exec: N executive cards in a grid; each opens a modal with full bio
 *   - All copy is sourced from i18n so EN/AR switch works automatically
 *
 * IIFE pattern (matches the rest of the codebase).
 */
(function () {
    'use strict';

    function init() {
        const root = document.getElementById('leadership');
        if (!root) return;

        const tabBtns       = root.querySelectorAll('[data-leader-tab]');
        const panels        = root.querySelectorAll('[data-leader-panel]');
        const chairmanEl    = root.querySelector('#leadership-chairman');
        const directorsEl   = root.querySelector('#leadership-directors');
        const executivesEl  = root.querySelector('#leadership-executives');

        // Modal elements
        const modal       = document.getElementById('leader-modal');
        const modalPhoto  = modal && modal.querySelector('#leader-modal-photo');
        const modalRole   = modal && modal.querySelector('#leader-modal-role');
        const modalName   = modal && modal.querySelector('#leader-modal-name');
        const modalDesc   = modal && modal.querySelector('#leader-modal-description');
        const modalClose  = modal && modal.querySelector('[data-leader-modal-close]');

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
        // Tab switching
        // ──────────────────────────────────────
        function activateTab(name) {
            tabBtns.forEach((btn) => {
                const isActive = btn.dataset.leaderTab === name;
                btn.classList.toggle('leadership__tab--active', isActive);
                btn.setAttribute('aria-selected', String(isActive));
                btn.tabIndex = isActive ? 0 : -1;
            });
            panels.forEach((panel) => {
                const isActive = panel.dataset.leaderPanel === name;
                panel.classList.toggle('leadership__panel--active', isActive);
                panel.hidden = !isActive;
            });
        }

        tabBtns.forEach((btn) => {
            btn.addEventListener('click', () => activateTab(btn.dataset.leaderTab));
            // arrow-key navigation between tabs
            btn.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                e.preventDefault();
                const list = Array.from(tabBtns);
                const i = list.indexOf(btn);
                const dir = e.key === 'ArrowRight' ? 1 : -1;
                const next = list[(i + dir + list.length) % list.length];
                activateTab(next.dataset.leaderTab);
                next.focus();
            });
        });

        // ──────────────────────────────────────
        // Modal
        // ──────────────────────────────────────
        let lastFocusedTrigger = null;

        function openModal(exec, lang) {
            if (!modal) return;
            // Populate modal content
            if (modalPhoto) modalPhoto.src = exec.image;
            if (modalRole)  modalRole.textContent = exec.role;
            if (modalName)  modalName.textContent = exec.name;
            if (modalDesc)  modalDesc.textContent = exec.description;

            // Remember which trigger to restore focus to
            lastFocusedTrigger = document.activeElement;

            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Focus the close button after opening
            requestAnimationFrame(() => {
                modalClose && modalClose.focus({ preventScroll: true });
            });
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
                lastFocusedTrigger.focus({ preventScroll: true });
                lastFocusedTrigger = null;
            }
        }

        if (modal) {
            // Close button
            modalClose && modalClose.addEventListener('click', closeModal);
            // Click on backdrop (outside the dialog)
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            // Escape closes
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                    closeModal();
                }
            });
        }

        // ──────────────────────────────────────
        // Renderers
        // ──────────────────────────────────────
        function renderChairman(c) {
            if (!chairmanEl || !c) return;
            chairmanEl.innerHTML = `
                <div class="leadership__chairman-photo">
                    <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" loading="lazy" />
                </div>
                <div class="leadership__chairman-body">
                    <p class="leadership__chairman-role">${escapeHtml(c.role)}</p>
                    <h3 class="leadership__chairman-name">${escapeHtml(c.name)}</h3>
                    <p class="leadership__chairman-description">${escapeHtml(c.description)}</p>
                </div>
            `;
        }

        function renderDirectors(directors) {
            if (!directorsEl) return;
            directorsEl.innerHTML = (directors || []).map((d) => `
                <article class="leader-card">
                    <div class="leader-card__photo">
                        <img src="${escapeHtml(d.image)}" alt="${escapeHtml(d.name)}" loading="lazy" />
                    </div>
                    <p class="leader-card__role">${escapeHtml(d.role)}</p>
                    <h3 class="leader-card__name">${escapeHtml(d.name)}</h3>
                    <p class="leader-card__description">${escapeHtml(d.description)}</p>
                </article>
            `).join('');
        }

        function renderExecutives(execs, lang) {
            if (!executivesEl) return;
            executivesEl.innerHTML = (execs || []).map((e, i) => `
                <button type="button" class="leader-card leader-card--executive" data-leader-exec="${i}" aria-haspopup="dialog">
                    <span class="leader-card__photo">
                        <img src="${escapeHtml(e.image)}" alt="${escapeHtml(e.name)}" loading="lazy" />
                    </span>
                    <span class="leader-card__role">${escapeHtml(e.role)}</span>
                    <span class="leader-card__name">${escapeHtml(e.name)}</span>
                </button>
            `).join('');

            // Wire up click handlers
            executivesEl.querySelectorAll('[data-leader-exec]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.leaderExec, 10);
                    const exec = execs[idx];
                    if (exec) openModal(exec, lang);
                });
            });
        }

        function render(translations, lang) {
            const data = deepGet(translations, 'leadership') || {};
            renderChairman(data.chairman);
            renderDirectors(data.directors);
            renderExecutives(data.executives || [], lang);
        }

        // ──────────────────────────────────────
        // Hook into i18n
        // ──────────────────────────────────────
        function bind() {
            window.I18n.onLangChange((lang, t) => {
                render(t, lang);
                // If the modal was open, close it on language change to avoid
                // showing mismatched (stale) content.
                if (modal && modal.classList.contains('is-open')) closeModal();
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

        // Default tab — Board of Directors
        activateTab('board');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
