/**
 * sections/landmark-slider.js
 *
 * Full-width landmark slider for jcdc.html:
 *   - Track holds image-only slides; the active slide is centered in the
 *     viewport with the previous slide peeking on the leading edge and the
 *     next slide peeking on the trailing edge.
 *   - The info card with title / description / CTA is a STATIC overlay on
 *     the bottom of the viewport — it never translates. When the active
 *     slide changes, the card content fades out, swaps text, and fades in.
 *   - Prev/Next arrows step one slide; dots jump to a slide.
 *   - Keyboard ←/→ when focused, pointer drag swipe, autoplay every 5 s
 *     (paused on hover/focus/off-screen), RTL aware.
 *
 * Layout math (centred-active):
 *   trackTranslateX = (viewport_width / 2) − (slide_width / 2) − current·step
 *   step = slide_width + gap
 *   In RTL the sign flips and the track is positioned from the trailing edge.
 *
 * IIFE pattern.
 */
(function () {
    'use strict';

    const AUTOPLAY_MS = 5000;
    const RESUME_AFTER_MS = 8000;
    const SWIPE_THRESHOLD = 60;
    const FADE_MS = 250; // must stay in sync with .__card-inner transition

    function init() {
        const root = document.getElementById('landmark-slider');
        if (!root) return;

        const viewport = root.querySelector('.landmark-slider__viewport');
        const trackEl  = root.querySelector('#landmark-slider-track');
        const dotsEl   = root.querySelector('#landmark-slider-dots');
        const prevBtn  = root.querySelector('[data-landmark-prev]');
        const nextBtn  = root.querySelector('[data-landmark-next]');
        const cardInner = root.querySelector('#landmark-slider-card-inner');

        if (!viewport || !trackEl || !dotsEl || !cardInner) return;

        let slides = [];
        let current = 0;
        let timer = null;
        let pauseTimeout = null;
        let autoplayPaused = false;

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
        function isRTL() {
            return document.documentElement.dir === 'rtl';
        }

        // ──────────────────────────────────────
        // Render slides (images only) + dots
        // ──────────────────────────────────────
        function renderTrack(translations) {
            const data = deepGet(translations, 'landmarkSlider') || {};
            slides = (data.items || []).slice();

            trackEl.innerHTML = slides.map((s, i) => `
                <div class="landmark-slider__slide${i === current ? ' is-active' : ''}"
                     data-landmark-slide="${i}"
                     aria-roledescription="slide"
                     aria-label="${i + 1} of ${slides.length}">
                    <img src="${escapeHtml(s.image)}"
                         alt="${escapeHtml(s.title)}"
                         loading="${i === 0 ? 'eager' : 'lazy'}"
                         draggable="false" />
                </div>
            `).join('');

            // Dots
            dotsEl.innerHTML = slides.map((_, i) => `
                <li>
                    <button type="button"
                            class="landmark-slider__dot${i === current ? ' landmark-slider__dot--active' : ''}"
                            data-landmark-dot="${i}"
                            aria-label="Go to slide ${i + 1}"
                            ${i === current ? 'aria-current="true"' : ''}>
                    </button>
                </li>
            `).join('');

            wireDots();
            if (current >= slides.length) current = 0;
        }

        // Render the static card content (no fade — used on first paint /
        // language change). Subsequent changes go through swapCardContent().
        function paintCard(item, ctaLabel) {
            if (!item) return;
            cardInner.innerHTML = `
                <div class="landmark-slider__card-text">
                    <h3 class="landmark-slider__card-title">${escapeHtml(item.title)}</h3>
                    <p class="landmark-slider__card-description">${escapeHtml(item.description)}</p>
                </div>
                <a class="btn btn--outline-gold landmark-slider__card-cta" href="${escapeHtml(item.href || '#')}">
                    <span>${escapeHtml(ctaLabel)}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6"
                              stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            `;
        }

        // Swap card content with a fade transition.
        // Fade out → wait → swap DOM → fade in
        function swapCardContent(item, ctaLabel) {
            cardInner.classList.add('is-fading');
            // After fade-out completes, swap content and fade back in
            setTimeout(() => {
                paintCard(item, ctaLabel);
                // Trigger reflow so the next class change re-runs the transition
                void cardInner.offsetWidth;
                cardInner.classList.remove('is-fading');
            }, FADE_MS);
        }

        // ──────────────────────────────────────
        // Layout math
        // ──────────────────────────────────────
        function getMetrics() {
            const slideEl = trackEl.querySelector('.landmark-slider__slide');
            if (!slideEl) return { slideWidth: 0, gap: 0, step: 0, viewportWidth: 0 };
            const slideWidth = slideEl.getBoundingClientRect().width;
            const styles = getComputedStyle(trackEl);
            const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
            const viewportWidth = viewport.getBoundingClientRect().width;
            return { slideWidth, gap, step: slideWidth + gap, viewportWidth };
        }

        function applyTransform(animate = true) {
            const { slideWidth, step, viewportWidth } = getMetrics();
            if (!slideWidth) return;

            // Distance from the start of the track to the centered position
            // of the active slide.
            const direction = isRTL() ? -1 : 1;
            // We always want the active slide centered in the viewport:
            //   center_position = (viewportWidth/2) − (slideWidth/2)
            // The slide currently at index `current` lives at offset
            //   slideOffset = current * step
            // So the track must translate by (center_position − slideOffset).
            const centerPos = (viewportWidth - slideWidth) / 2;
            const slideOffset = current * step;
            const tx = direction * (centerPos - slideOffset);

            if (!animate) trackEl.style.transition = 'none';
            trackEl.style.transform = `translateX(${tx}px)`;
            if (!animate) {
                requestAnimationFrame(() => { trackEl.style.transition = ''; });
            }

            // Reflect active state on the slide elements (for any styling cues)
            trackEl.querySelectorAll('.landmark-slider__slide').forEach((el, i) => {
                el.classList.toggle('is-active', i === current);
            });

            // Dots
            dotsEl.querySelectorAll('[data-landmark-dot]').forEach((btn, i) => {
                btn.classList.toggle('landmark-slider__dot--active', i === current);
                if (i === current) btn.setAttribute('aria-current', 'true');
                else btn.removeAttribute('aria-current');
            });

            // Disable end arrows
            if (prevBtn) prevBtn.disabled = current === 0;
            if (nextBtn) nextBtn.disabled = current === slides.length - 1;
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

            // Fade-swap the card content
            const t = window.__I18N_CACHE__ || {};
            const data = deepGet(t, 'landmarkSlider') || {};
            const ctaLabel = data.cta || 'Explore';
            swapCardContent(slides[current], ctaLabel);

            if (opts && opts.userInitiated) pauseFor(RESUME_AFTER_MS);
        }

        function next() {
            const idx = current >= slides.length - 1 ? 0 : current + 1;
            // For autoplay wrap: jump without animation if going from last → 0
            if (current >= slides.length - 1) {
                current = 0;
                applyTransform(false);
                const t = window.__I18N_CACHE__ || {};
                const data = deepGet(t, 'landmarkSlider') || {};
                swapCardContent(slides[0], data.cta || 'Explore');
            } else {
                goTo(idx);
            }
        }
        function prev() {
            const idx = current <= 0 ? slides.length - 1 : current - 1;
            goTo(idx);
        }

        // ──────────────────────────────────────
        // Autoplay
        // ──────────────────────────────────────
        function startAutoplay() {
            stopAutoplay();
            timer = setInterval(() => {
                if (!autoplayPaused) next();
            }, AUTOPLAY_MS);
        }
        function stopAutoplay() {
            if (timer) { clearInterval(timer); timer = null; }
        }
        function pauseFor(ms) {
            autoplayPaused = true;
            if (pauseTimeout) clearTimeout(pauseTimeout);
            pauseTimeout = setTimeout(() => { autoplayPaused = false; }, ms);
        }

        viewport.addEventListener('mouseenter', () => { autoplayPaused = true; });
        viewport.addEventListener('mouseleave', () => { autoplayPaused = false; });
        viewport.addEventListener('focusin',    () => { autoplayPaused = true; });
        viewport.addEventListener('focusout',   () => { autoplayPaused = false; });

        document.addEventListener('visibilitychange', () => {
            autoplayPaused = document.hidden;
        });

        if (typeof IntersectionObserver !== 'undefined') {
            const io = new IntersectionObserver(([entry]) => {
                autoplayPaused = !entry.isIntersecting;
            }, { threshold: 0.2 });
            io.observe(root);
        }

        // ──────────────────────────────────────
        // Event wiring
        // ──────────────────────────────────────
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); pauseFor(RESUME_AFTER_MS); });
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); pauseFor(RESUME_AFTER_MS); });

        function wireDots() {
            dotsEl.querySelectorAll('[data-landmark-dot]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const i = parseInt(btn.dataset.landmarkDot, 10);
                    if (!isNaN(i)) goTo(i, { userInitiated: true });
                });
            });
        }

        // Keyboard navigation when viewport has focus
        viewport.tabIndex = 0;
        viewport.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                isRTL() ? prev() : next();
                pauseFor(RESUME_AFTER_MS);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                isRTL() ? next() : prev();
                pauseFor(RESUME_AFTER_MS);
            }
        });

        // Pointer drag swipe
        let dragStart = null;
        viewport.addEventListener('pointerdown', (e) => {
            // Don't hijack clicks on links/buttons inside the card or arrows
            if (e.target.closest('a, button')) return;
            dragStart = { x: e.clientX };
        });
        viewport.addEventListener('pointerup', (e) => {
            if (!dragStart) return;
            const dx = e.clientX - dragStart.x;
            dragStart = null;
            if (Math.abs(dx) < SWIPE_THRESHOLD) return;
            const goNext = isRTL() ? dx > 0 : dx < 0;
            goNext ? next() : prev();
            pauseFor(RESUME_AFTER_MS);
        });
        viewport.addEventListener('pointercancel', () => { dragStart = null; });

        // Resize: track translation needs to recompute since viewport width
        // changes the centered position.
        let rzId = null;
        window.addEventListener('resize', () => {
            if (rzId) cancelAnimationFrame(rzId);
            rzId = requestAnimationFrame(() => applyTransform(false));
        });

        // ──────────────────────────────────────
        // Hook into i18n (initial paint + language change)
        // ──────────────────────────────────────
        function bind() {
            window.I18n.onLangChange((lang, t) => {
                window.__I18N_CACHE__ = t;
                renderTrack(t);
                const data = deepGet(t, 'landmarkSlider') || {};
                paintCard(slides[current], data.cta || 'Explore');
                // Wait one frame so layout has new slide widths, then transform
                requestAnimationFrame(() => {
                    applyTransform(false);
                    // Wait for images to layout, then re-apply once more in case
                    // aspect-ratio settled to a different size.
                    setTimeout(() => applyTransform(false), 60);
                });
                startAutoplay();
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
