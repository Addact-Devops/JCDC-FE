(function () {
  "use strict";

  function init() {
    const root = document.getElementById("leadership");
    if (!root) return;

    const tabBtns = root.querySelectorAll("[data-leader-tab]");
    const panels = root.querySelectorAll("[data-leader-panel]");

    const modal = document.getElementById("leader-modal");
    const modalContents = modal
      ? modal.querySelectorAll("[data-leader-modal-content]")
      : [];

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

    let lastFocusedTrigger = null;

    function showModalContent(index) {
      if (modal)
        modal.setAttribute("aria-labelledby", `leader-modal-name-${index}`);
      modalContents.forEach((el) => {
        const isActive =
          String(el.dataset.leaderModalContent) === String(index);
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

      requestAnimationFrame(() => {
        const activeClose = modal.querySelector(
          ".leader-modal__content--active [data-leader-modal-close]",
        );
        if (activeClose) activeClose.focus({ preventScroll: true });
      });
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (
        lastFocusedTrigger &&
        typeof lastFocusedTrigger.focus === "function"
      ) {
        lastFocusedTrigger.focus({ preventScroll: true });
        lastFocusedTrigger = null;
      }
    }

    root.querySelectorAll("[data-leader-exec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.leaderExec, 10);
        if (!isNaN(idx)) openModal(idx);
      });
    });

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.closest("[data-leader-modal-close]")) {
          closeModal();
          return;
        }
        if (e.target === modal) {
          closeModal();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
          closeModal();
        }
      });
    }

    if (window.I18n && window.I18n.onLangChange) {
      window.I18n.onLangChange(() => {
        if (modal && modal.classList.contains("is-open")) closeModal();
      });
    }

    activateTab("board");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
