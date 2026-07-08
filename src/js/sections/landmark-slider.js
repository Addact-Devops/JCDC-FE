/**
 * sections/landmark-slider.js
 *
 * Full-width landmark slider.
 *
 * Supports two variants via a modifier class on the root:
 *   - .landmark-slider                       → with bottom info card
 *   - .landmark-slider.landmark-slider--no-card  → image-only carousel
 *
 * Also supports multiple instances on the same page (queries by class
 * within each root, not by ID).
 *
 * The DOM is fully STATIC — every slide, every dot, and every card-content
 * variant is rendered in HTML. This module does NOT inject HTML.
 *
 * Responsibilities:
 *   - Compute and apply the track translateX so the active slide is
 *     centered in the viewport (RTL-aware).
 *   - Toggle .is-active on slides and dots.
 *   - When present, fade/swap the `.landmark-slider__card` copy —
 *     ported 1:1 from landmark-slider-3.html's `.content-card`: the
 *     card fades out, its title/description/CTA are swapped at the
 *     transition midpoint, then it fades back in (see renderCard()).
 *   - Wire up arrows, dots, keyboard arrow keys, pointer drag, autoplay.
 */
(function () {
  "use strict";

  const AUTOPLAY_MS = 5000;
  const RESUME_AFTER_MS = 8000;
  const SWIPE_THRESHOLD = 60;
  const FADE_MS = 300; // half of the 600ms --smart-duration card transition in SCSS

  function init() {
    //  ▼ CHANGE #1 — find every slider on the page, not just one by id
    const roots = document.querySelectorAll(".landmark-slider");
    if (!roots.length) return;
    roots.forEach(initOne);
  }

  function initOne(root) {
    //  ▼ CHANGE #2 — query by class within root, not by global id.
    //  Makes the slider safe to use multiple times on one page and
    //  decouples the JS from the markup's id attribute.
    const viewport = root.querySelector(".landmark-slider__viewport");
    const trackEl = root.querySelector(".landmark-slider__track");
    const dotsEl = root.querySelector(".landmark-slider__dots");
    const prevBtn = root.querySelector("[data-landmark-prev]");
    const nextBtn = root.querySelector("[data-landmark-next]");
    const cardEl = root.querySelector(".landmark-slider__card");

    //  ▼ CHANGE #3 — cardEl is no longer required to bail out.
    if (!viewport || !trackEl) return;

    const slides = Array.from(
      trackEl.querySelectorAll(".landmark-slider__slide"),
    );
    const dotButtons = dotsEl
      ? Array.from(dotsEl.querySelectorAll("[data-landmark-dot]"))
      : [];

    //  ▼ CHANGE #4 — card is optional. Guard the queries and remember
    //  the result so we can skip card-touching code paths cleanly.
    const cardTitleEl = cardEl
      ? cardEl.querySelector(".landmark-slider__card-title")
      : null;
    const cardDescEl = cardEl
      ? cardEl.querySelector(".landmark-slider__card-description")
      : null;
    const cardCtaEl = cardEl
      ? cardEl.querySelector(".landmark-slider__card-cta")
      : null;
    const hasCard = Boolean(cardEl && cardTitleEl && cardDescEl);

    //  ▼ CHANGE #5 — per-slide card copy, ported from the reference
    //  slider's `slides` array but sourced from data-card-* on each
    //  static slide element so translators still edit plain HTML.
    const cardData = slides.map((el) => ({
      titleKey: el.dataset.cardTitleKey || null,
      title: el.dataset.cardTitle || "",
      desc: el.dataset.cardDesc || "",
      href: el.dataset.cardHref || "",
    }));

    if (!slides.length) return;

    let current = slides.findIndex((s) => s.classList.contains("is-active"));
    if (current < 0) current = 0;

    let timer = null;
    let pauseTimeout = null;
    let autoplayPaused = false;

    // ──────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────
    function isRTL() {
      return document.documentElement.dir === "rtl";
    }

    // ──────────────────────────────────────
    // Layout math (centred-active)
    // ──────────────────────────────────────
    function getMetrics() {
      const slideEl = slides[0];
      if (!slideEl) return { slideWidth: 0, gap: 0, step: 0, viewportWidth: 0 };
      const slideWidth = slideEl.getBoundingClientRect().width;
      const styles = getComputedStyle(trackEl);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const viewportWidth = viewport.getBoundingClientRect().width;
      return { slideWidth, gap, step: slideWidth + gap, viewportWidth };
    }

    function applyTransform(animate = true) {
      const { slideWidth, step, viewportWidth } = getMetrics();

      // Class & attribute toggles run unconditionally so the active
      // state stays correct even before the layout has settled.
      slides.forEach((el, i) => {
        el.classList.toggle("is-active", i === current);
      });
      dotButtons.forEach((btn, i) => {
        btn.classList.toggle("landmark-slider__dot--active", i === current);
        if (i === current) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
      if (prevBtn)
        prevBtn.classList.toggle("landmark-slider__nav--hidden", current === 0);
      if (nextBtn)
        nextBtn.classList.toggle(
          "landmark-slider__nav--hidden",
          current === slides.length - 1,
        );

      if (!slideWidth) return;

      const direction = isRTL() ? -1 : 1;
      const isNoCardMobile =
        root.classList.contains("landmark-slider--no-card") &&
        window.innerWidth <= 480;

      let tx;

      if (isNoCardMobile) {
        tx = direction * -(current * step);
      } else {
        const centerPos = (viewportWidth - slideWidth) / 2;
        const slideOffset = current * step;
        tx = direction * (centerPos - slideOffset);
      }

      if (!animate) trackEl.style.transition = "none";
      trackEl.style.transform = `translateX(${tx}px)`;
      if (!animate) {
        requestAnimationFrame(() => {
          trackEl.style.transition = "";
        });
      }
    }

    // ──────────────────────────────────────
    // Card content swap — no-op when this slider has no card.
    // Ported 1:1 from landmark-slider-3.html's render(): fade the
    // card out, swap its copy at the transition midpoint, fade
    // back in — synced to the 600ms smart-ease curve in SCSS.
    // ──────────────────────────────────────
    function renderCard(index) {
      if (!hasCard) return; //  ▼ CHANGE #4 (cont.)
      cardEl.classList.remove("is-visible");
      setTimeout(() => {
        const data = cardData[index];
        if (!data) return;
        if (data.titleKey) cardTitleEl.setAttribute("data-i18n", data.titleKey);
        // Prefer the loaded translation over the HTML-authored
        // (English) default, so a saved Arabic session doesn't
        // flash English text while the language JSON loads.
        const translated =
          data.titleKey && window.I18n ? window.I18n.t(data.titleKey) : null;
        cardTitleEl.textContent =
          translated && translated !== data.titleKey ? translated : data.title;
        cardDescEl.textContent = data.desc;
        if (cardCtaEl) cardCtaEl.setAttribute("href", data.href);
        cardEl.classList.add("is-visible");
      }, FADE_MS);
    }

    // ──────────────────────────────────────
    // Navigation
    // ──────────────────────────────────────
    function goTo(index, opts) {
      const max = slides.length - 1;
      if (index < 0) index = 0;
      if (index > max) index = max;
      if (index === current) return;

      current = index;
      applyTransform(true);
      renderCard(current); //  safely no-ops on the card-less variant

      if (opts && opts.userInitiated) pauseFor(RESUME_AFTER_MS);
    }

    function next() {
      if (current >= slides.length - 1) {
        // Autoplay wrap: jump without animation
        current = 0;
        applyTransform(false);
        renderCard(0);
      } else {
        goTo(current + 1);
      }
    }
    function prev() {
      const idx = current <= 0 ? slides.length - 1 : current - 1;
      goTo(idx);
    }

    // ──────────────────────────────────────
    // Autoplay (pause on hover/focus/off-screen/visibility-hidden)
    // ──────────────────────────────────────
    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(() => {
        if (!autoplayPaused) next();
      }, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function pauseFor(ms) {
      autoplayPaused = true;
      if (pauseTimeout) clearTimeout(pauseTimeout);
      pauseTimeout = setTimeout(() => {
        autoplayPaused = false;
      }, ms);
    }

    viewport.addEventListener("mouseenter", () => {
      autoplayPaused = true;
    });
    viewport.addEventListener("mouseleave", () => {
      autoplayPaused = false;
    });
    viewport.addEventListener("focusin", () => {
      autoplayPaused = true;
    });
    viewport.addEventListener("focusout", () => {
      autoplayPaused = false;
    });

    document.addEventListener("visibilitychange", () => {
      autoplayPaused = document.hidden;
    });

    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        ([entry]) => {
          autoplayPaused = !entry.isIntersecting;
        },
        { threshold: 0.2 },
      );
      io.observe(root);
    }

    // ──────────────────────────────────────
    // Event wiring
    // ──────────────────────────────────────
    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        prev();
        pauseFor(RESUME_AFTER_MS);
      });
    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        next();
        pauseFor(RESUME_AFTER_MS);
      });

    dotButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.landmarkDot, 10);
        if (!isNaN(i)) goTo(i, { userInitiated: true });
      });
    });

    // Keyboard navigation when viewport has focus
    viewport.tabIndex = 0;
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        isRTL() ? prev() : next();
        pauseFor(RESUME_AFTER_MS);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        isRTL() ? next() : prev();
        pauseFor(RESUME_AFTER_MS);
      }
    });

    // Pointer drag (swipe)
    let dragStart = null;
    viewport.addEventListener("pointerdown", (e) => {
      // Don't hijack clicks on the card CTA or the arrow buttons
      if (e.target.closest("a, button")) return;
      dragStart = { x: e.clientX };
    });
    viewport.addEventListener("pointerup", (e) => {
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x;
      dragStart = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      const goNext = isRTL() ? dx > 0 : dx < 0;
      goNext ? next() : prev();
      pauseFor(RESUME_AFTER_MS);
    });
    viewport.addEventListener("pointercancel", () => {
      dragStart = null;
    });

    // Resize — recompute the centered transform.
    let rzId = null;
    window.addEventListener("resize", () => {
      if (rzId) cancelAnimationFrame(rzId);
      rzId = requestAnimationFrame(() => applyTransform(false));
    });

    // ──────────────────────────────────────
    // Initial paint + language-change hook
    // ──────────────────────────────────────
    function refreshLayout() {
      requestAnimationFrame(() => {
        applyTransform(false);
        // Re-apply once more after images settle.
        setTimeout(() => applyTransform(false), 60);
      });
    }

    renderCard(current); // initial fade-in, mirrors the reference's render() on load

    if (window.I18n && window.I18n.onLangChange) {
      window.I18n.onLangChange(() => {
        refreshLayout();
      });
    }

    refreshLayout();
    // startAutoplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
