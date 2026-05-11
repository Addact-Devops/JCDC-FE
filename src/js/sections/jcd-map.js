/**
 * sections/jcd-map.js
 *
 * Interactive 6-district map for the JCDC page (jcdc.html).
 *
 * High-level shape
 * ----------------
 *   • A satellite background <img> sits behind a same-size <svg> overlay,
 *     both wrapped in a `.jcd-map__stage` that scales/translates on detail.
 *   • The SVG's viewBox is 1000 × 800. Every district <path> and every
 *     attraction icon position is expressed in this coordinate space, so
 *     the whole thing scales uniformly to any viewport size.
 *   • Two visual states:
 *       default — all 6 districts outlined; hover shows a name tooltip.
 *       detail  — one district selected; the rest is darkened by a
 *                 mask-cutout rect; attraction icons appear; the stage
 *                 zooms ~1.18× toward the active district's centroid.
 *
 * Wiring your real artwork
 * ------------------------
 *   1. DISTRICT_PATHS    — paste your Mask_group.svg <path d="…"> values
 *                          here, one per district. The viewBox is 1000×800.
 *   2. DISTRICT_LABEL_XY — center of each district (mobile name label).
 *   3. The popup imagery and attraction icon X/Y positions live in i18n
 *      JSON under jcdMap.districts[*].image and …attractions[*].image / x / y.
 *
 * IIFE pattern, matches existing codebase convention.
 */
(function () {
    'use strict';

    // How much the stage zooms when a district is selected.
    // 1.0 = no zoom; 1.18 ≈ subtle "focus" cue. Set to 1.0 to disable.
    const ZOOM_LEVEL = 1.18;

    // ────────────────────────────────────────────────────────────────
    //  STATIC GEOMETRY
    //  Replace these `d` strings with your Mask_group.svg paths. The
    //  viewBox is 1000 × 800. Shapes below are placeholder approximations
    //  of Image 1 / Image 8 so the component is interactive on first load.
    // ────────────────────────────────────────────────────────────────
    const DISTRICT_PATHS = {
        // Top-right peninsula along the sandy coastline + circular-pool resort
        beach:    'M 605 215 L 720 200 L 805 245 L 855 320 L 825 410 L 760 470 L 680 480 L 600 445 L 555 380 L 555 305 L 590 250 Z',
        // Top-center area containing the stadium-like square structure
        wellness: 'M 405 175 L 540 165 L 600 200 L 605 280 L 555 305 L 555 380 L 470 380 L 415 345 L 365 280 L 370 215 Z',
        // Large central district (gold in Image 8)
        central:  'M 215 380 L 365 365 L 415 345 L 470 380 L 555 380 L 600 445 L 580 530 L 530 580 L 410 600 L 290 590 L 215 540 L 200 460 Z',
        // Left-center "industrial heritage" zone
        culture:  'M 100 320 L 215 305 L 250 360 L 215 380 L 200 460 L 215 540 L 165 555 L 95 530 L 75 440 L 80 360 Z',
        // Sport park — between central and the marina
        sport:    'M 410 600 L 530 580 L 580 530 L 600 445 L 680 480 L 690 555 L 640 620 L 540 660 L 420 660 Z',
        // Marina at the bottom-right
        marina:   'M 290 590 L 410 600 L 420 660 L 540 660 L 545 720 L 460 750 L 360 745 L 285 715 L 250 660 Z',
    };

    // Center point of each district — used for the mobile-default label
    const DISTRICT_LABEL_XY = {
        beach:    { x: 700, y: 340 },
        wellness: { x: 480, y: 260 },
        central:  { x: 380, y: 480 },
        culture:  { x: 150, y: 425 },
        sport:    { x: 540, y: 590 },
        marina:   { x: 410, y: 680 },
    };

    // Tab/keyboard order
    const DISTRICT_ORDER = ['beach', 'wellness', 'central', 'culture', 'sport', 'marina'];

    // ────────────────────────────────────────────────────────────────
    //  DOM helpers
    // ────────────────────────────────────────────────────────────────
    function deepGet(o, k) { return k.split('.').reduce((a, p) => a && a[p], o); }
    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function svgEl(name, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', name);
        if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    // ────────────────────────────────────────────────────────────────
    //  Initialization
    // ────────────────────────────────────────────────────────────────
    function init() {
        const root = document.getElementById('jcd-map');
        if (!root) return;

        const viewport       = root.querySelector('#jcd-map-viewport');
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

        // Mutable state
        let translations = null;     // jcdMap dictionary
        let activeDistrictId = null; // null = intro state
        let activeAttractionId = null;

        // ───────────────────────────────────────────────────────
        //  Build the static district paths + labels once
        // ───────────────────────────────────────────────────────
        function buildDistricts() {
            districtsLayer.innerHTML = '';
            labelsLayer.innerHTML = '';

            DISTRICT_ORDER.forEach((id) => {
                const path = svgEl('path', {
                    'class': 'jcd-map__district',
                    'data-district': id,
                    'd': DISTRICT_PATHS[id],
                    'role': 'button',
                    'tabindex': '0',
                });
                districtsLayer.appendChild(path);

                const xy = DISTRICT_LABEL_XY[id];
                if (xy) {
                    const label = svgEl('text', {
                        'class': 'jcd-map__label',
                        'data-label': id,
                        'x': xy.x,
                        'y': xy.y,
                    });
                    labelsLayer.appendChild(label);
                }
            });
        }

        // ───────────────────────────────────────────────────────
        //  Apply translations to ARIA labels, mobile labels,
        //  and the intro panel copy.
        // ───────────────────────────────────────────────────────
        function applyTranslations(t) {
            translations = deepGet(t, 'jcdMap') || {};
            const districts = translations.districts || [];

            districts.forEach((d) => {
                const pathEl  = districtsLayer.querySelector(`[data-district="${d.id}"]`);
                const labelEl = labelsLayer.querySelector(`[data-label="${d.id}"]`);
                if (pathEl)  pathEl.setAttribute('aria-label', d.name || '');
                if (labelEl) labelEl.textContent = d.name || '';
            });

            const intro = translations.intro || {};
            introEl.innerHTML = `
                <h2 class="jcd-map__panel-title">${escapeHtml(intro.title || '')}</h2>
                <span class="jcd-map__panel-divider" aria-hidden="true"></span>
                <p class="jcd-map__panel-desc">${escapeHtml(intro.description || '')}</p>
                <p class="jcd-map__panel-hint">${escapeHtml(intro.hint || '')}</p>
            `;

            // Re-render detail panel if we were already in detail mode
            if (activeDistrictId) renderDetail();
        }

        function findDistrict(id) {
            return ((translations && translations.districts) || []).find((d) => d.id === id);
        }

        // ───────────────────────────────────────────────────────
        //  Render the right-side detail panel for the current selection
        // ───────────────────────────────────────────────────────
        function renderDetail() {
            const d = findDistrict(activeDistrictId);
            if (!d) return;

            // What to show: the district, or one of its attractions
            let title    = d.name;
            let subtitle = '';
            let desc     = d.description || '';
            let img      = d.image || '';
            let href     = d.href || '#';
            let ctaLabel = (translations.districtCta || 'Explore District');

            if (activeAttractionId) {
                const a = (d.attractions || []).find((x) => x.id === activeAttractionId);
                if (a) {
                    title    = a.name;
                    subtitle = d.name;
                    desc     = a.description || '';
                    img      = a.image || d.image || '';
                    href     = a.href || '#';
                    ctaLabel = (translations.attractionCta || 'Explore Attractions');
                }
            }

            const closeLabel = translations.closeLabel || 'Close';

            detailEl.innerHTML = `
                <button type="button"
                        class="jcd-map__close"
                        data-jcd-close
                        aria-label="${escapeHtml(closeLabel)}">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18"
                              stroke="currentColor" stroke-width="2"
                              stroke-linecap="round"/>
                    </svg>
                </button>
                <div class="jcd-map__detail-img-wrap">
                    ${img ? `<img class="jcd-map__detail-img" src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">` : ''}
                </div>
                <h3 class="jcd-map__panel-title">${escapeHtml(title)}</h3>
                ${subtitle ? `<p class="jcd-map__panel-subtitle">${escapeHtml(subtitle)}</p>` : ''}
                <span class="jcd-map__panel-divider" aria-hidden="true"></span>
                <p class="jcd-map__panel-desc">${escapeHtml(desc)}</p>
                <a class="btn btn--outline-cream jcd-map__cta" href="${escapeHtml(href)}">
                    <span>${escapeHtml(ctaLabel)}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6"
                              stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            `;
        }

        // ───────────────────────────────────────────────────────
        //  Render attraction icons positioned on the active district
        // ───────────────────────────────────────────────────────
        function renderIcons() {
            iconsHost.innerHTML = '';
            if (!activeDistrictId) return;

            const d = findDistrict(activeDistrictId);
            if (!d || !Array.isArray(d.attractions)) return;

            d.attractions.forEach((a) => {
                if (typeof a.x !== 'number' || typeof a.y !== 'number') return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'jcd-map__icon';
                btn.dataset.attraction = a.id;
                btn.setAttribute('aria-label', a.name || '');
                btn.style.left = a.x + '%';
                btn.style.top  = a.y + '%';
                if (a.id === activeAttractionId) btn.classList.add('is-active');
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2"
                              stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <circle cx="12" cy="12" r="3.5"
                                stroke="currentColor" stroke-width="1.5" fill="none"/>
                        <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"
                              stroke="currentColor" stroke-width="1.5"
                              stroke-linecap="round"/>
                    </svg>
                `;
                iconsHost.appendChild(btn);
            });
        }

        // ───────────────────────────────────────────────────────
        //  Zoom — compute the bounding box of the active district
        //  and apply scale + transform-origin to the stage
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
            catch (_) { return; }     // not laid out yet

            // Centroid in viewBox (0–1000 × 0–800), converted to percentages
            const cx = (bbox.x + bbox.width  / 2) / 1000 * 100;
            const cy = (bbox.y + bbox.height / 2) / 800  * 100;

            stage.style.transformOrigin = `${cx}% ${cy}%`;
            stage.style.transform = `scale(${ZOOM_LEVEL})`;

            // Keep icons visually the same size: counter-scale them.
            iconsHost.style.setProperty('--icon-counter-scale', String(1 / ZOOM_LEVEL));
        }

        // ───────────────────────────────────────────────────────
        //  Selection control
        // ───────────────────────────────────────────────────────
        function selectDistrict(id) {
            activeDistrictId = id;
            activeAttractionId = null;

            // Toggle classes on the SVG paths
            districtsLayer.querySelectorAll('.jcd-map__district').forEach((p) => {
                p.classList.toggle('is-active', p.dataset.district === id);
            });

            // Move the cutout to mask out the active district from the dim layer
            cutout.setAttribute('d', id ? DISTRICT_PATHS[id] : 'M 0 0 Z');

            viewport.classList.toggle('is-detail', !!id);
            hideTooltip();

            if (id) {
                introEl.hidden = true;
                detailEl.hidden = false;
                renderIcons();
                renderDetail();
                // Apply zoom on the next frame so layout settles first
                requestAnimationFrame(applyZoom);
            } else {
                introEl.hidden = false;
                detailEl.hidden = true;
                iconsHost.innerHTML = '';
                applyZoom();   // resets to identity
            }
        }

        function selectAttraction(districtId, attractionId, btnEl) {
            if (activeDistrictId !== districtId) selectDistrict(districtId);

            activeAttractionId = attractionId;

            iconsHost.querySelectorAll('.jcd-map__icon').forEach((el) => {
                el.classList.toggle('is-active', el.dataset.attraction === attractionId);
            });

            // Pin a tooltip with the attraction name next to the icon
            if (btnEl) {
                const d = findDistrict(districtId);
                const a = d && (d.attractions || []).find((x) => x.id === attractionId);
                if (a) showTooltipAtIcon(btnEl, a.name);
            }

            renderDetail();
        }

        function clearSelection() {
            selectDistrict(null);
        }

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
            const vbRect = viewport.getBoundingClientRect();
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
        //  Wiring
        // ───────────────────────────────────────────────────────

        // District click → select
        districtsLayer.addEventListener('click', (e) => {
            const path = e.target.closest('[data-district]');
            if (!path) return;
            const id = path.dataset.district;
            if (id === activeDistrictId) return;
            selectDistrict(id);
        });

        // Keyboard activation
        districtsLayer.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const path = e.target.closest('[data-district]');
            if (!path) return;
            e.preventDefault();
            selectDistrict(path.dataset.district);
        });

        // Hover tooltip in default state
        districtsLayer.addEventListener('mousemove', (e) => {
            if (viewport.classList.contains('is-detail')) return;
            const path = e.target.closest('[data-district]');
            if (!path) { hideTooltip(); return; }
            const d = findDistrict(path.dataset.district);
            if (!d) return;
            const vb = viewport.getBoundingClientRect();
            showTooltipAt(e.clientX - vb.left, e.clientY - vb.top, d.name || '');
        });
        districtsLayer.addEventListener('mouseleave', () => {
            if (!viewport.classList.contains('is-detail')) hideTooltip();
        });

        // Attraction icon click → select attraction
        iconsHost.addEventListener('click', (e) => {
            const btn = e.target.closest('.jcd-map__icon');
            if (!btn) return;
            selectAttraction(activeDistrictId, btn.dataset.attraction, btn);
        });

        // Attraction icon hover → tooltip (use capture so we catch the
        // event even when the parent's pointer-events is none)
        iconsHost.addEventListener('mouseenter', (e) => {
            const btn = e.target && e.target.closest && e.target.closest('.jcd-map__icon');
            if (!btn) return;
            const d = findDistrict(activeDistrictId);
            const a = d && (d.attractions || []).find((x) => x.id === btn.dataset.attraction);
            if (a) showTooltipAtIcon(btn, a.name);
        }, true);
        iconsHost.addEventListener('mouseleave', (e) => {
            const btn = e.target && e.target.closest && e.target.closest('.jcd-map__icon');
            if (!btn) return;
            if (!btn.classList.contains('is-active')) hideTooltip();
        }, true);

        // Close button (delegation, since detail content is re-rendered)
        panel.addEventListener('click', (e) => {
            if (e.target.closest('[data-jcd-close]')) {
                clearSelection();
            }
        });

        // ESC closes the detail
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeDistrictId) clearSelection();
        });

        // Re-apply zoom on resize so transform-origin stays correct
        let rzTimer = null;
        window.addEventListener('resize', () => {
            if (!activeDistrictId) return;
            if (rzTimer) cancelAnimationFrame(rzTimer);
            rzTimer = requestAnimationFrame(applyZoom);
        });

        // ───────────────────────────────────────────────────────
        //  i18n bind
        // ───────────────────────────────────────────────────────
        buildDistricts();

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
