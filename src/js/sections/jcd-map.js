/**
 * sections/jcd-map.js
 *
 * Interactive 6-district map for the JCDC page (jcdc.html).
 *
 * BEHAVIOR-ONLY ARCHITECTURE
 * --------------------------
 * Every piece of map markup is now declared in HTML:
 *   • <path data-district="…">           one per district, with `d` baked in
 *   • <text class="jcd-map__label">      mobile-default name labels
 *   • <button class="jcd-map__icon">     attraction hotspots (hidden by default)
 *   • <div data-panel-state="intro">     intro panel skeleton
 *   • <div data-panel-state="detail">    detail panel skeleton w/ data-detail-* hooks
 *
 * This JS only handles BEHAVIOR:
 *   • click / keyboard / hover → select district or attraction
 *   • toggling .is-active and .is-detail classes
 *   • setting the dim-mask cutout's `d` to the active district's path
 *   • zooming the stage to the active district's centroid
 *   • flipping panel state via [hidden]
 *   • copying i18n strings into existing nodes (textContent / src / href)
 *   • tooltip show/hide & positioning
 *
 * No innerHTML, no createElement, no DOM building.
 * The HTML is the source of truth for structure; JS is the source of
 * truth for state. The i18n engine handles all text.
 *
 * IIFE pattern, matches existing codebase convention.
 */
(function () {
    'use strict';

    // How far to zoom into a selected district. 1.0 disables zoom.
    const ZOOM_LEVEL = 1.18;

    // ────────────────────────────────────────────────────────────────
    //  Tiny utilities
    // ────────────────────────────────────────────────────────────────
    function deepGet(o, k) { return k.split('.').reduce((a, p) => a && a[p], o); }

    // ────────────────────────────────────────────────────────────────
    //  Initialization
    // ────────────────────────────────────────────────────────────────
    function init() {
        const root = document.getElementById('jcd-map');
        if (!root) return;

        // ─── Static element references (all declared in HTML) ───────
        const viewport       = root.querySelector('#jcd-map-viewport');
        const scrollWrap     = viewport && viewport.querySelector('.jcd-map__scroll');
        const stage          = root.querySelector('#jcd-map-stage');
        const svg            = root.querySelector('#jcd-map-svg');
        const districtsLayer = root.querySelector('#jcd-map-districts');
        const labelsLayer    = root.querySelector('#jcd-map-labels');
        const cutout         = root.querySelector('#jcd-map-cutout');
        const iconsHost      = root.querySelector('#jcd-map-icons');
        const tooltip        = root.querySelector('#jcd-map-tooltip');
        const panel          = root.querySelector('#jcd-map-panel');
        const introEl        = root.querySelector('[data-panel-state="intro"]');
        const detailEl       = root.querySelector('[data-panel-state="detail"]');

        if (!viewport || !stage || !svg || !districtsLayer || !cutout || !panel) return;

        // Detail-panel field hooks — JS updates textContent/src/href, not innerHTML
        const detailTitleEl    = detailEl.querySelector('[data-detail-title]');
        const detailSubtitleEl = detailEl.querySelector('[data-detail-subtitle]');
        const detailDescEl     = detailEl.querySelector('[data-detail-desc]');
        const detailImgEl      = detailEl.querySelector('[data-detail-img]');
        const detailCtaEl      = detailEl.querySelector('[data-detail-cta]');
        const detailCtaLabelEl = detailEl.querySelector('[data-detail-cta-label]');

        // Cache each district's path `d` from the static HTML so we can
        // paste it into the dim-mask cutout on selection.
        const DISTRICT_PATHS = {};
        districtsLayer.querySelectorAll('.jcd-map__district').forEach((p) => {
            DISTRICT_PATHS[p.dataset.district] = p.getAttribute('d');
        });

        // Mutable state
        let translations = null;
        let activeDistrictId = null;
        let activeAttractionId = null;

        // ───────────────────────────────────────────────────────
        //  i18n — copy translated strings into the existing nodes
        // ───────────────────────────────────────────────────────
        function applyTranslations(t) {
            translations = deepGet(t, 'jcdMap') || {};
            const districts = translations.districts || [];

            districts.forEach((d) => {
                const pathEl  = districtsLayer.querySelector(`[data-district="${d.id}"]`);
                const labelEl = labelsLayer  && labelsLayer.querySelector(`[data-label="${d.id}"]`);
                if (pathEl)  pathEl.setAttribute('aria-label', d.name || '');
                if (labelEl) labelEl.textContent = d.name || '';

                (d.attractions || []).forEach((a) => {
                    const btn = iconsHost.querySelector(
                        `.jcd-map__icon[data-district="${d.id}"][data-attraction="${a.id}"]`
                    );
                    if (btn) btn.setAttribute('aria-label', a.name || '');
                });
            });

            // Re-paint the detail panel if we're already in detail mode
            if (activeDistrictId) renderDetail();
        }

        function findDistrict(id) {
            return ((translations && translations.districts) || []).find((d) => d.id === id);
        }

        // ───────────────────────────────────────────────────────
        //  renderDetail — update the EXISTING detail panel nodes
        // ───────────────────────────────────────────────────────
        function renderDetail() {
            const d = findDistrict(activeDistrictId);
            if (!d) return;

            let title    = d.name || '';
            let subtitle = '';
            let desc     = d.description || '';
            let img      = d.image || '';
            let href     = d.href || '#';
            let ctaLabel = (translations && translations.districtCta) || 'Explore District';

            if (activeAttractionId) {
                const a = (d.attractions || []).find((x) => x.id === activeAttractionId);
                if (a) {
                    title    = a.name || '';
                    subtitle = d.name || '';
                    desc     = a.description || '';
                    img      = a.image || d.image || '';
                    href     = a.href || '#';
                    ctaLabel = (translations && translations.attractionCta) || 'Explore Attractions';
                }
            }

            if (detailTitleEl)    detailTitleEl.textContent = title;
            if (detailDescEl)     detailDescEl.textContent  = desc;
            if (detailSubtitleEl) {
                detailSubtitleEl.textContent = subtitle;
                detailSubtitleEl.hidden = !subtitle;
            }
            if (detailImgEl) {
                if (img) {
                    detailImgEl.src = img;
                    detailImgEl.alt = title;
                    detailImgEl.hidden = false;
                } else {
                    detailImgEl.removeAttribute('src');
                    detailImgEl.hidden = true;
                }
            }
            if (detailCtaEl)      detailCtaEl.setAttribute('href', href);
            if (detailCtaLabelEl) detailCtaLabelEl.textContent = ctaLabel;
        }

        // ───────────────────────────────────────────────────────
        //  Show / hide attraction icons for the active district
        //  (icons are pre-rendered in HTML, hidden by default).
        // ───────────────────────────────────────────────────────
        function syncIconVisibility() {
            iconsHost.querySelectorAll('.jcd-map__icon').forEach((btn) => {
                const matches = btn.dataset.district === activeDistrictId;
                btn.hidden = !matches;
                btn.tabIndex = matches ? 0 : -1;
                if (!matches) btn.classList.remove('is-active');
            });
        }

        // ───────────────────────────────────────────────────────
        //  Zoom — bbox of the active district drives transform-origin
        // ───────────────────────────────────────────────────────
        function applyZoom() {
            if (!activeDistrictId || ZOOM_LEVEL === 1) {
                stage.style.transform = '';
                stage.style.transformOrigin = '';
                iconsHost.style.setProperty('--icon-counter-scale', '1');
                return;
            }
            const pathEl = districtsLayer.querySelector(`[data-district="${activeDistrictId}"]`);
            if (!pathEl) return;

            let bbox;
            try { bbox = pathEl.getBBox(); }
            catch (_) { return; }

            const cx = (bbox.x + bbox.width  / 2) / 1049 * 100;
            const cy = (bbox.y + bbox.height / 2) / 773  * 100;

            stage.style.transformOrigin = `${cx}% ${cy}%`;
            stage.style.transform = `scale(${ZOOM_LEVEL})`;

            // Keep icons visually the same size; CSS uses this var on .jcd-map__icon
            iconsHost.style.setProperty('--icon-counter-scale', String(1 / ZOOM_LEVEL));
        }

        // ───────────────────────────────────────────────────────
        //  Selection control
        // ───────────────────────────────────────────────────────
        function selectDistrict(id) {
            activeDistrictId = id;
            activeAttractionId = null;

            districtsLayer.querySelectorAll('.jcd-map__district').forEach((p) => {
                p.classList.toggle('is-active', p.dataset.district === id);
            });

            cutout.setAttribute('d', id ? (DISTRICT_PATHS[id] || 'M 0 0 Z') : 'M 0 0 Z');

            viewport.classList.toggle('is-detail', !!id);
            hideTooltip();

            syncIconVisibility();

            if (id) {
                introEl.hidden = true;
                detailEl.hidden = false;
                renderDetail();
                requestAnimationFrame(applyZoom);
            } else {
                introEl.hidden = false;
                detailEl.hidden = true;
                applyZoom();
            }
        }

        function selectAttraction(districtId, attractionId, btnEl) {
            if (activeDistrictId !== districtId) selectDistrict(districtId);

            activeAttractionId = attractionId;

            iconsHost.querySelectorAll('.jcd-map__icon').forEach((el) => {
                el.classList.toggle('is-active', el.dataset.attraction === attractionId);
            });

            if (btnEl) {
                const d = findDistrict(districtId);
                const a = d && (d.attractions || []).find((x) => x.id === attractionId);
                if (a) showTooltipAtIcon(btnEl, a.name);
            }
            renderDetail();
        }

        function clearSelection() { selectDistrict(null); }

        // Frame used for tooltip absolute positioning
        const tooltipFrame = scrollWrap || viewport;

        // ───────────────────────────────────────────────────────
        //  Tooltip — hover (district name) or pinned (icon name)
        // ───────────────────────────────────────────────────────
        function showTooltipAt(x, y, text) {
            tooltip.textContent = text;
            tooltip.style.left = x + 'px';
            tooltip.style.top  = y + 'px';
            tooltip.classList.add('is-visible');
            tooltip.hidden = false;
        }
        function showTooltipAtIcon(iconEl, text) {
            const vbRect = tooltipFrame.getBoundingClientRect();
            const ibRect = iconEl.getBoundingClientRect();
            const x = ibRect.left - vbRect.left + ibRect.width / 2;
            const y = ibRect.top  - vbRect.top;
            showTooltipAt(x, y, text);
        }
        function hideTooltip() {
            tooltip.classList.remove('is-visible');
            tooltip.hidden = true;
        }

        // ───────────────────────────────────────────────────────
        //  Wiring (event delegation throughout)
        // ───────────────────────────────────────────────────────

        districtsLayer.addEventListener('click', (e) => {
            const path = e.target.closest('[data-district]');
            if (!path) return;
            const id = path.dataset.district;
            if (id === activeDistrictId) return;
            selectDistrict(id);
        });

        districtsLayer.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const path = e.target.closest('[data-district]');
            if (!path) return;
            e.preventDefault();
            selectDistrict(path.dataset.district);
        });

        districtsLayer.addEventListener('mousemove', (e) => {
            if (viewport.classList.contains('is-detail')) return;
            const path = e.target.closest('[data-district]');
            if (!path) { hideTooltip(); return; }
            const d = findDistrict(path.dataset.district);
            if (!d) return;
            const vb = tooltipFrame.getBoundingClientRect();
            showTooltipAt(e.clientX - vb.left, e.clientY - vb.top, d.name || '');
        });
        districtsLayer.addEventListener('mouseleave', () => {
            if (!viewport.classList.contains('is-detail')) hideTooltip();
        });

        iconsHost.addEventListener('click', (e) => {
            const btn = e.target.closest('.jcd-map__icon');
            if (!btn || btn.hidden) return;
            selectAttraction(btn.dataset.district, btn.dataset.attraction, btn);
        });

        iconsHost.addEventListener('mouseenter', (e) => {
            const btn = e.target && e.target.closest && e.target.closest('.jcd-map__icon');
            if (!btn || btn.hidden) return;
            const d = findDistrict(activeDistrictId);
            const a = d && (d.attractions || []).find((x) => x.id === btn.dataset.attraction);
            if (a) showTooltipAtIcon(btn, a.name);
        }, true);
        iconsHost.addEventListener('mouseleave', (e) => {
            const btn = e.target && e.target.closest && e.target.closest('.jcd-map__icon');
            if (!btn) return;
            if (!btn.classList.contains('is-active')) hideTooltip();
        }, true);

        panel.addEventListener('click', (e) => {
            if (e.target.closest('[data-jcd-close]')) clearSelection();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeDistrictId) clearSelection();
        });

        let rzTimer = null;
        window.addEventListener('resize', () => {
            if (!activeDistrictId) return;
            if (rzTimer) cancelAnimationFrame(rzTimer);
            rzTimer = requestAnimationFrame(applyZoom);
        });

        // ───────────────────────────────────────────────────────
        //  i18n bind
        // ───────────────────────────────────────────────────────
        function bind() {
            window.I18n.onLangChange((_lang, t) => applyTranslations(t));
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
