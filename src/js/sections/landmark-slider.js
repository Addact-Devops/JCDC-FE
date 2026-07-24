(function () {
  "use strict";

  const AUTOPLAY_MS = 5000;
  const RESUME_AFTER_MS = 8000;
  const SWIPE_THRESHOLD = 60;
  const FADE_MS = 300;

  function init() {
    const roots = document.querySelectorAll(".landmark-slider");
    if (!roots.length) return;
    roots.forEach(initOne);
  }

  function initOne(root) {
    const viewport = root.querySelector(".landmark-slider__viewport");
    const trackEl = root.querySelector(".landmark-slider__track");
    const dotsEl = root.querySelector(".landmark-slider__dots");
    const prevBtn = root.querySelector("[data-landmark-prev]");
    const nextBtn = root.querySelector("[data-landmark-next]");
    const cardEl = root.querySelector(".landmark-slider__card");

    if (!viewport || !trackEl) return;

    const slides = Array.from(
      trackEl.querySelectorAll(".landmark-slider__slide"),
    );
    const dotButtons = dotsEl
      ? Array.from(dotsEl.querySelectorAll("[data-landmark-dot]"))
      : [];

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

    function isRTL() {
      return document.documentElement.dir === "rtl";
    }

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

    function renderCard(index) {
      if (!hasCard) return;
      cardEl.classList.remove("is-visible");
      setTimeout(() => {
        const data = cardData[index];
        if (!data) return;
        if (data.titleKey) cardTitleEl.setAttribute("data-i18n", data.titleKey);

        const translated =
          data.titleKey && window.I18n ? window.I18n.t(data.titleKey) : null;
        cardTitleEl.textContent =
          translated && translated !== data.titleKey ? translated : data.title;
        cardDescEl.textContent = data.desc;
        if (cardCtaEl) cardCtaEl.setAttribute("href", data.href);
        cardEl.classList.add("is-visible");
      }, FADE_MS);
    }

    function goTo(index, opts) {
      const max = slides.length - 1;
      if (index < 0) index = 0;
      if (index > max) index = max;
      if (index === current) return;

      current = index;
      applyTransform(true);
      renderCard(current);

      if (opts && opts.userInitiated) pauseFor(RESUME_AFTER_MS);
    }

    function next() {
      if (current >= slides.length - 1) {
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

    let dragStart = null;
    viewport.addEventListener("pointerdown", (e) => {
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

    let rzId = null;
    window.addEventListener("resize", () => {
      if (rzId) cancelAnimationFrame(rzId);
      rzId = requestAnimationFrame(() => applyTransform(false));
    });

    function refreshLayout() {
      requestAnimationFrame(() => {
        applyTransform(false);
        setTimeout(() => applyTransform(false), 60);
      });
    }

    renderCard(current);

    if (window.I18n && window.I18n.onLangChange) {
      window.I18n.onLangChange(() => {
        refreshLayout();
      });
    }

    refreshLayout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
