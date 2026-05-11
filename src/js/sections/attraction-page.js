/**
 * sections/attraction-page.js
 *
 * Drives the attraction page slider on attraction.html.
 *
 * The DOM is fully STATIC — every active-image, title overlay, info block,
 * and thumbnail is pre-rendered in attraction.html. This module does NOT
 * inject HTML.
 *
 * Responsibilities:
 *   - On thumbnail click, fade out the current variants → toggle the
 *     .is-active / --active classes on the matching image, title, info,
 *     and thumbnail → fade back in.
 *   - Smooth-scroll the active thumbnail into view when the user clicks it
 *     (so partially-visible thumbs get pulled into the viewport).
 *
 * IIFE pattern (matches the rest of the codebase).
 */
(function () {
    'use strict';

    // Must match the .is-fading transition duration in _attractionSlider.scss
    const FADE_MS = 250;

    function init() {
        const root = document.getElementById('attraction-slider');
        if (!root) return;

        const activeImageEl = root.querySelector('#attraction-active-image');
        const titleOverlay  = root.querySelector('#attraction-title-overlay');
        const infoEl        = root.querySelector('#attraction-info');
        const stripEl       = root.querySelector('#attraction-strip');

        if (!activeImageEl || !titleOverlay || !infoEl || !stripEl) return;

        const imageVariants = Array.from(activeImageEl.querySelectorAll('[data-attraction-image]'));
        const titleVariants = Array.from(titleOverlay.querySelectorAll('[data-attraction-title]'));
        const infoVariants  = Array.from(infoEl.querySelectorAll('[data-attraction-info]'));
        const thumbs        = Array.from(stripEl.querySelectorAll('[data-attraction-idx]'));

        if (!thumbs.length) return;

        // Initial active index from the static markup (first .--active thumbnail)
        let currentIdx = thumbs.findIndex((b) => b.classList.contains('attraction-thumb--active'));
        if (currentIdx < 0) currentIdx = 0;

        // ──────────────────────────────────────
        // Class-toggle helpers (no HTML mutation)
        // ──────────────────────────────────────
        function setActiveVariant(elements, index, activeClass) {
            elements.forEach((el, i) => {
                el.classList.toggle(activeClass, i === index);
            });
        }

        function setActiveThumb(index) {
            thumbs.forEach((btn, i) => {
                const isActive = i === index;
                btn.classList.toggle('attraction-thumb--active', isActive);
                if (isActive) btn.setAttribute('aria-current', 'true');
                else btn.removeAttribute('aria-current');
            });
        }

        function applyActive(index) {
            setActiveVariant(imageVariants, index, 'is-active');
            setActiveVariant(titleVariants, index, 'is-active');
            setActiveVariant(infoVariants,  index, 'is-active');
            setActiveThumb(index);
        }

        // ──────────────────────────────────────
        // Fade-swap on user selection:
        //   1. Add .is-fading to the three big elements (image / title / info)
        //   2. After the fade-out, toggle which variants are .--active
        //   3. Remove .is-fading so they fade back in
        // ──────────────────────────────────────
        function fadeSwap(index) {
            const fadeTargets = [activeImageEl, titleOverlay, infoEl];
            fadeTargets.forEach((el) => el.classList.add('is-fading'));

            setTimeout(() => {
                applyActive(index);
                // Force a reflow so the transition restarts cleanly
                void root.offsetWidth;
                fadeTargets.forEach((el) => el.classList.remove('is-fading'));
            }, FADE_MS);
        }

        // ──────────────────────────────────────
        // Thumbnail click handler
        // ──────────────────────────────────────
        function selectAttraction(index, userInitiated) {
            if (index < 0 || index >= thumbs.length || index === currentIdx) return;
            currentIdx = index;

            fadeSwap(currentIdx);

            // Smooth-scroll the active thumbnail into view on user click
            if (userInitiated) {
                const target = thumbs[currentIdx];
                if (target && typeof target.scrollIntoView === 'function') {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        }

        thumbs.forEach((btn) => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.dataset.attractionIdx, 10);
                if (!isNaN(i)) selectAttraction(i, true);
            });
        });

        // Keyboard navigation on the thumbnail strip (←/→ within the tablist)
        stripEl.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const isRTL = document.documentElement.dir === 'rtl';
            const dir = (e.key === 'ArrowRight' ? 1 : -1) * (isRTL ? -1 : 1);
            const nextIdx = (currentIdx + dir + thumbs.length) % thumbs.length;
            e.preventDefault();
            selectAttraction(nextIdx, true);
            const focused = thumbs[nextIdx];
            if (focused) focused.focus();
        });

        // Initial paint to make sure the active classes match currentIdx
        applyActive(currentIdx);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
