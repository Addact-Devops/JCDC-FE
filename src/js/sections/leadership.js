/**
 * sections/leadership.js
 *
 * Drives the Leadership component on about.html:
 *   - Two tabs: Board of Directors | Executive Management
 *   - Click on an Executive card opens the bio modal pre-rendered in HTML;
 *     JS only toggles which content block has the
 *     .leader-modal__content--active class. NO HTML is added or removed by JS.
 *   - All copy is rendered statically in about.html with data-i18n attributes,
 *     so the i18n engine handles EN ↔ AR switching automatically.
 *
 * IIFE pattern (matches the rest of the codebase).
 */
(function () {
    "use strict";

    function init() {
        const root = document.getElementById("leadership");
        if (!root) return;

        const tabBtns = root.querySelectorAll("[data-leader-tab]");
        const panels = root.querySelectorAll("[data-leader-panel]");

        // Modal elements (pre-rendered in HTML — one shared dialog wrapper
        // with multiple `.leader-modal__content` blocks, one per executive).
        const modal = document.getElementById("leader-modal");
        const modalClose = modal && modal.querySelector("[data-leader-modal-close]");
        const modalContents = modal ? modal.querySelectorAll("[data-leader-modal-content]") : [];

        // ──────────────────────────────────────
        // Tab switching — toggles classes / aria attributes only.
        // ──────────────────────────────────────
        function activateTab(name) {
            tabBtns.forEach((btn) => {
                const isActive = btn.dataset.leaderTab === name;
                btn.classList.toggle("leadership__tab--active", isActive);
                btn.setAttribute("aria-selected", String(isActive));
                btn.tabIndex = isActive ? 0 : -1;
            });
            panels.forEach((panel) => {
                const isActive = panel.dataset.leaderPanel === name;
                panel.classList.toggle("leadership__panel--active", isActive);
                panel.hidden = !isActive;
            });
        }

        tabBtns.forEach((btn) => {
            btn.addEventListener("click", () => activateTab(btn.dataset.leaderTab));
            // Arrow-key navigation between tabs (WCAG tablist pattern)
            btn.addEventListener("keydown", (e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const list = Array.from(tabBtns);
                const i = list.indexOf(btn);
                const dir = e.key === "ArrowRight" ? 1 : -1;
                const next = list[(i + dir + list.length) % list.length];
                activateTab(next.dataset.leaderTab);
                next.focus();
            });
        });

        // ──────────────────────────────────────
        // Modal — toggle .is-open on the dialog and .--active on the
        // matching content block. No DOM is added or removed.
        // ──────────────────────────────────────
        let lastFocusedTrigger = null;

        function showModalContent(index) {
            // Keep aria-labelledby in sync with the visible person's name
            if (modal) modal.setAttribute("aria-labelledby", `leader-modal-name-${index}`);
            modalContents.forEach((el) => {
                const isActive = String(el.dataset.leaderModalContent) === String(index);
                el.classList.toggle("leader-modal__content--active", isActive);
            });
        }

        function openModal(index) {
            if (!modal) return;
            showModalContent(index);

            lastFocusedTrigger = document.activeElement;

            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";

            // Move focus to the close button for accessibility
            requestAnimationFrame(() => {
                if (modalClose) modalClose.focus({ preventScroll: true });
            });
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
                lastFocusedTrigger.focus({ preventScroll: true });
                lastFocusedTrigger = null;
            }
        }

        // Executive card → opens modal with the matching content block
        root.querySelectorAll("[data-leader-exec]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.leaderExec, 10);
                if (!isNaN(idx)) openModal(idx);
            });
        });

        if (modal) {
            if (modalClose) modalClose.addEventListener("click", closeModal);
            // Backdrop click closes
            modal.addEventListener("click", (e) => {
                if (e.target === modal) closeModal();
            });
            // Escape closes
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && modal.classList.contains("is-open")) {
                    closeModal();
                }
            });
        }

        // On language change, close the modal so we don't display a stale
        // mix of EN/AR while the i18n engine is swapping text.
        if (window.I18n && window.I18n.onLangChange) {
            window.I18n.onLangChange(() => {
                if (modal && modal.classList.contains("is-open")) closeModal();
            });
        }

        // Default tab — Board of Directors
        activateTab("board");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
