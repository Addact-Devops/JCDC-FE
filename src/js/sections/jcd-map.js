/**
 * sections/jcd-map.js
 *
 * Interactive 6-district map for jcdc.html AND each district sub-page.
 *
 * HTML-driven configuration (set on the .jcd-map root element):
 *   • data-default-district="beach"  →  auto-select that district on
 *                                       first render (used by the
 *                                       district sub-pages so the
 *                                       popup opens to that district).
 *   • data-no-intro                  →  the popup never shows the
 *                                       informational intro state.
 *                                       When the user clicks "close",
 *                                       the popup hides completely and
 *                                       the map returns to the normal
 *                                       hover/click behaviour.
 *
 * Behaviour summary
 *  • Hover  → only the district name label fades in inside the shape
 *             (no fill / no dim — handled in SCSS).
 *  • Click  → district enters .is-active, popup swaps to detail state.
 *  • Close  → if data-no-intro: popup hidden, district deselected,
 *             map back to idle. Otherwise: popup swaps to intro state.
 *  • Esc    → same as close.
 *
 * Partial-loader awareness
 *  • The script self-initialises on DOMContentLoaded AND on a custom
 *    `partials:loaded` event (fired by components/partial.js after
 *    HTML fragments have been injected). A guard flag prevents double
 *    initialisation when both fire on the same page.
 *
 * IIFE pattern — matches existing codebase convention.
 */
(function () {
    "use strict";

    // Guard against double-init when partials:loaded fires on a page
    // that already had the map in static HTML (e.g. jcdc.html).
    var inited = false;

    function deepGet(o, k) {
        return k.split(".").reduce(function (a, p) {
            return a && a[p];
        }, o);
    }

    // ────────────────────────────────────────────────────────────────
    //  Initialisation
    // ────────────────────────────────────────────────────────────────
    function init() {
        var root = document.getElementById("jcd-map");
        if (!root) return false;
        if (inited) return true;
        inited = true;

        // ─── Static element references ──────────────────────────────
        var container = root.querySelector(".jcd-map__container");
        var viewport = root.querySelector("#jcd-map-viewport");
        var scrollWrap = viewport && viewport.querySelector(".jcd-map__scroll");
        var stage = root.querySelector("#jcd-map-stage");
        var layers = root.querySelector("#jcd-map-layers");
        var svg = root.querySelector("#jcd-map-svg");
        var districtsLayer = root.querySelector("#jcd-map-districts");
        var labelsLayer = root.querySelector("#jcd-map-labels");
        var cutout = root.querySelector("#jcd-map-cutout");
        var iconsHost = root.querySelector("#jcd-map-icons");
        var tooltip = root.querySelector("#jcd-map-tooltip");
        var panel = root.querySelector("#jcd-map-panel");
        var sidePanel = root.querySelector("#jcd-map-side-panel");
        var introEl = root.querySelector('[data-panel-state="intro"]');
        var detailEl = root.querySelector('[data-panel-state="detail"]');

        if (!viewport || !stage || !layers || !svg || !districtsLayer || !cutout || !panel) {
            return false;
        }

        // Page-level config from the HTML root.
        //
        // Two equally valid ways to pre-select a district:
        //   1) class="jcd-map jcd-map--<id>"   (preferred — class only)
        //   2) data-default-district="<id>"    (data attribute)
        //
        // The class form is what the Sitecore templates use — one line
        // change per page, no extra attributes. The data-attribute form
        // is retained for backwards compatibility with the partial-loader
        // workflow.
        //
        // Valid <id> values: beach | wellness | central | culture | sport | marina
        var DISTRICT_IDS = ["beach", "wellness", "central", "culture", "sport", "marina"];

        function readDefaultDistrictFromClass(el) {
            for (var i = 0; i < DISTRICT_IDS.length; i++) {
                if (el.classList.contains("jcd-map--" + DISTRICT_IDS[i])) {
                    return DISTRICT_IDS[i];
                }
            }
            return null;
        }

        var defaultDistrict = root.dataset.defaultDistrict || readDefaultDistrictFromClass(root) || null;

        // `data-no-intro` OR the presence of any `jcd-map--<id>` class
        // implies no-intro mode (the page boots straight into the
        // matching district's detail view).
        var noIntroMode = root.hasAttribute("data-no-intro") || readDefaultDistrictFromClass(root) !== null;

        // Detail-panel field hooks
        var detailTitleEl = detailEl.querySelector("[data-detail-title]");
        var detailSubtitleEl = detailEl.querySelector("[data-detail-subtitle]");
        var detailDescEl = detailEl.querySelector("[data-detail-desc]");
        var detailImgEl = detailEl.querySelector("[data-detail-img]");
        var detailCtaEl = detailEl.querySelector("[data-detail-cta]");
        var detailCtaLabelEl = detailEl.querySelector("[data-detail-cta-label]");

        // Cache each district's path `d` from the static HTML.
        var DISTRICT_PATHS = {};
        districtsLayer.querySelectorAll(".jcd-map__district").forEach(function (p) {
            DISTRICT_PATHS[p.dataset.district] = p.getAttribute("d");
        });

        // Mutable state
        var translations = null;
        var activeDistrictId = null;
        var activeAttractionId = null;
        var didAutoSelect = false;

        // Initial panel state for no-intro pages: hidden until a
        // district is selected (or auto-selected just below).
        if (noIntroMode) {
            panel.hidden = true;
            if (introEl) introEl.hidden = true;
        }

        // ───────────────────────────────────────────────────────
        //  Reposition labels to the visual centre of each path so
        //  the name renders INSIDE the shape, not at hand-tuned
        //  coords that may drift outside after path edits.
        // ───────────────────────────────────────────────────────
        function repositionLabels() {
            if (!labelsLayer) return;
            districtsLayer.querySelectorAll(".jcd-map__district").forEach(function (p) {
                var id = p.dataset.district;
                var labelEl = labelsLayer.querySelector('[data-label="' + id + '"]');
                if (!labelEl) return;
                var bbox;
                try {
                    bbox = p.getBBox();
                } catch (e) {
                    return;
                }
                if (!bbox || !isFinite(bbox.width) || bbox.width === 0) return;
                var cx =
                    labelEl.dataset.manualX !== undefined
                        ? parseFloat(labelEl.dataset.manualX)
                        : bbox.x + bbox.width / 2 + (parseFloat(labelEl.dataset.offsetX) || 0);
                var cy =
                    labelEl.dataset.manualY !== undefined
                        ? parseFloat(labelEl.dataset.manualY)
                        : bbox.y + bbox.height / 2 + (parseFloat(labelEl.dataset.offsetY) || 0);
                labelEl.setAttribute("x", cx);
                labelEl.setAttribute("y", cy);
                // Cache the original text once so subsequent calls don't read
                // the corrupted tspan concatenation (tspans have no space
                // between them in textContent).
                if (!labelEl.dataset.labelText) {
                    labelEl.dataset.labelText = labelEl.textContent.trim();
                }
                var current = labelEl.dataset.labelText;
                if (current) setMultilineLabel(labelEl, current);
            });
        }

        // ───────────────────────────────────────────────────────
        //  i18n — copy translated strings into the existing nodes
        // ───────────────────────────────────────────────────────
        function applyTranslations(t) {
            translations = deepGet(t, "jcdMap") || {};
            var districts = translations.districts || [];

            districts.forEach(function (d) {
                var pathEl = districtsLayer.querySelector('[data-district="' + d.id + '"]');
                var labelEl = labelsLayer && labelsLayer.querySelector('[data-label="' + d.id + '"]');
                if (pathEl) pathEl.setAttribute("aria-label", d.name || "");
                if (labelEl) setMultilineLabel(labelEl, d.name || "");

                (d.attractions || []).forEach(function (a) {
                    var btn = iconsHost.querySelector(
                        '.jcd-map__icon[data-district="' + d.id + '"][data-attraction="' + a.id + '"]',
                    );
                    if (btn) btn.setAttribute("aria-label", a.name || "");
                });
            });

            // Re-paint detail panel if we're already in detail mode
            if (activeDistrictId) renderDetail();

            // Auto-select on first translation load
            if (!didAutoSelect && defaultDistrict) {
                didAutoSelect = true;
                selectDistrict(defaultDistrict);
            }
        }

        // ───────────────────────────────────────────────────────
        //  setMultilineLabel — wrap a long district name across
        //  multiple tspans centred on the label's current x.
        // ───────────────────────────────────────────────────────
        function setMultilineLabel(textEl, name) {
            while (textEl.firstChild) textEl.removeChild(textEl.firstChild);

            var lines = wrapDistrictName(name);
            var x = textEl.getAttribute("x") || 0;
            var lineHeight = 18;

            lines.forEach(function (line, i) {
                var tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                tspan.setAttribute("x", x);
                tspan.setAttribute(
                    "dy",
                    i === 0 ? "-" + ((lines.length - 1) * lineHeight) / 2 + "px" : lineHeight + "px",
                );
                tspan.textContent = line;
                textEl.appendChild(tspan);
            });
        }

        function wrapDistrictName(name) {
            if (!name) return [""];
            var trimmed = name.trim();
            if (trimmed.indexOf(",") !== -1) {
                var parts = trimmed.split(",").map(function (s) {
                    return s.trim();
                });
                var head = parts[0] + ",";
                var tail = parts.slice(1).join(" ").trim();
                if (tail.length > 18) {
                    var tokens = tail.split(/\s+/);
                    var last = tokens.pop();
                    return [head, tokens.join(" "), last];
                }
                return [head, tail];
            }
            var idx = trimmed.lastIndexOf(" ");
            if (idx === -1) return [trimmed];
            return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
        }

        function findDistrict(id) {
            return ((translations && translations.districts) || []).find(function (d) {
                return d.id === id;
            });
        }

        // ───────────────────────────────────────────────────────
        //  renderDetail — update existing detail panel nodes
        // ───────────────────────────────────────────────────────
        function renderDetail() {
            var d = findDistrict(activeDistrictId);
            if (!d) return;

            var title = d.name || "";
            var subtitle = "";
            var desc = d.description || "";
            var img = d.image || "";
            var href = d.href || "#";
            var ctaLabel = (translations && translations.districtCta) || "Explore District";

            if (activeAttractionId) {
                var a = (d.attractions || []).find(function (x) {
                    return x.id === activeAttractionId;
                });
                if (a) {
                    title = a.name || "";
                    subtitle = d.name || "";
                    desc = a.description || "";
                    img = a.image || d.image || "";
                    href = a.href || "#";
                    ctaLabel = a.ctaLabel || (translations && translations.attractionCta) || "Explore Attractions";
                }
            }

            if (detailTitleEl) detailTitleEl.textContent = title;
            if (detailDescEl) detailDescEl.textContent = desc;
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
                    detailImgEl.removeAttribute("src");
                    detailImgEl.hidden = true;
                }
            }
            if (detailCtaEl) detailCtaEl.setAttribute("href", href);
            if (detailCtaLabelEl) detailCtaLabelEl.textContent = ctaLabel;
        }

        // ───────────────────────────────────────────────────────
        //  Show / hide attraction icons for the active district.
        //  Critical: we ALSO check whether each icon's centre point
        //  is inside the district's SVG path via `isPointInFill`.
        //  This prevents icons whose i18n coordinates land outside
        //  the district's territory from appearing — exactly the
        //  "icons should not go outside state territory" behaviour
        //  requested in the latest brief.
        // ───────────────────────────────────────────────────────
        function syncIconVisibility() {
            var activePathEl = activeDistrictId
                ? districtsLayer.querySelector('[data-district="' + activeDistrictId + '"]')
                : null;

            iconsHost.querySelectorAll(".jcd-map__icon").forEach(function (btn) {
                var matchesDistrict = btn.dataset.district === activeDistrictId;
                if (!matchesDistrict) {
                    btn.hidden = true;
                    btn.tabIndex = -1;
                    btn.classList.remove("is-active");
                    return;
                }

                // Translate the inline % position (relative to the
                // viewport which shares the SVG's 1049×773 aspect)
                // into SVG user-space coordinates, then ask the path
                // whether that point is inside its fill region.
                var inside = true;
                if (activePathEl && svg) {
                    try {
                        var xPct = parseFloat(btn.style.left);
                        var yPct = parseFloat(btn.style.top);
                        if (!isNaN(xPct) && !isNaN(yPct)) {
                            var svgX = (xPct / 100) * 1049;
                            var svgY = (yPct / 100) * 773;
                            var point;
                            if (svg.createSVGPoint) {
                                point = svg.createSVGPoint();
                                point.x = svgX;
                                point.y = svgY;
                            } else {
                                // Fallback for very old browsers
                                point = { x: svgX, y: svgY };
                            }
                            inside = activePathEl.isPointInFill(point);
                        }
                    } catch (e) {
                        // If the call fails (e.g. detached path),
                        // err on the side of showing the icon.
                        inside = true;
                    }
                }

                btn.hidden = !inside;
                btn.tabIndex = inside ? 0 : -1;
                if (!inside) btn.classList.remove("is-active");
            });
        }

        // ───────────────────────────────────────────────────────
        //  Zoom + centre the active district inside the viewport.
        //  --------------------------------------------------------
        //  CENTRING — Uses the bounding-box centre. That matches
        //  how the Figma reference frames each district: the bbox
        //  of the visible shape sits centred in the map viewport.
        //  (An earlier draft used the area-weighted centroid, which
        //  for crescent-shaped districts like Beach shifted the
        //  bbox off-screen because the area mass is in the
        //  northern lobe — not what we want here.)
        //
        //  ZOOM — Adaptive per district:
        //  Each district gets a zoom that makes it fill ~88% of the
        //  viewport along its binding axis (width OR height —
        //  whichever is tighter), so nothing gets cut off. Clamped
        //  to [1.3, 2.4] so neither tiny (Wellness) nor huge
        //  (Beach) districts look out of scale.
        //
        //  TRANSLATE — Centres the bbox at viewport (50%, 50%):
        //  With transform-origin at (50%, 50%) and
        //  `transform: translate(tx) scale(s)`, a point P resolves
        //  to: P' = s·(P − 50) + 50 + t
        //  Setting P' = 50 for P = centre gives t = (50 − P)·s.
        // ───────────────────────────────────────────────────────
        var TARGET_FILL_PCT = 65;
        var MIN_ZOOM = 1.1;
        var MAX_ZOOM = 2.2;

        function applyZoom() {
            var pathEl = activeDistrictId
                ? districtsLayer.querySelector('[data-district="' + activeDistrictId + '"]')
                : null;

            if (!pathEl) {
                // Reset to identity transform (back to overview).
                layers.style.transform = "";
                layers.style.transformOrigin = "";
                iconsHost.style.setProperty("--icon-counter-scale", "1");
                return;
            }

            var bbox;
            try {
                bbox = pathEl.getBBox();
            } catch (e) {
                return;
            }
            if (!bbox || !isFinite(bbox.width) || bbox.width === 0) return;

            // BBox centre + size as % of stage (== SVG viewBox 1049×773)
            var cxPct = ((bbox.x + bbox.width / 2) / 1049) * 100;
            var cyPct = ((bbox.y + bbox.height / 2) / 773) * 100;
            var wPct = (bbox.width / 1049) * 100;
            var hPct = (bbox.height / 773) * 100;

            // Adaptive zoom — fill TARGET_FILL_PCT on the tighter axis
            var fitX = TARGET_FILL_PCT / wPct;
            var fitY = TARGET_FILL_PCT / hPct;
            var zoom = Math.min(fitX, fitY);
            zoom = Math.max(MIN_ZOOM, Math.min(zoom, MAX_ZOOM));

            // Translate so the bbox centre lands at (50%, 50%) of the viewport.
            // Clamp so the stage never shifts far enough to expose the
            // viewport background (max safe shift = 50% * (zoom - 1)).
            var tx = (50 - cxPct) * zoom;
            var ty = (50 - cyPct) * zoom;
            // Allow a few extra percent of translation beyond the hard
            // edge so districts whose paths touch the SVG boundary (e.g.
            // Sport at y=0, Culture at x=0) get a small breathing margin.
            // The stage background (dark gradient) covers the tiny exposed
            // strip — it will never be white.
            var EDGE_MARGIN = 4;
            var maxT = 50 * (zoom - 1) + EDGE_MARGIN;
            tx = Math.max(-maxT, Math.min(maxT, tx));
            ty = Math.max(-maxT, Math.min(maxT, ty));

            layers.style.transformOrigin = "50% 50%";
            layers.style.transform =
                "translate(" + tx.toFixed(2) + "%, " + ty.toFixed(2) + "%) " + "scale(" + zoom.toFixed(3) + ")";

            // Counter-scale the icons so they keep their physical size
            iconsHost.style.setProperty("--icon-counter-scale", String(1 / zoom));
        }

        function setHoverDistrict(id) {
            districtsLayer.querySelectorAll(".jcd-map__district").forEach(function (p) {
                p.classList.toggle("is-hover", p.dataset.district === id);
            });
            // Mirror onto the labels so the matching label fades in.
            // Sibling combinators won't work across <g> boundaries, so
            // this is the simplest reliable approach.
            if (labelsLayer) {
                labelsLayer.querySelectorAll(".jcd-map__label").forEach(function (l) {
                    l.classList.toggle("is-visible", l.dataset.label === id);
                });
            }
        }
        function clearHover() {
            districtsLayer.querySelectorAll(".jcd-map__district.is-hover").forEach(function (p) {
                p.classList.remove("is-hover");
            });
            if (labelsLayer) {
                labelsLayer.querySelectorAll(".jcd-map__label.is-visible").forEach(function (l) {
                    l.classList.remove("is-visible");
                });
            }
        }

        // ───────────────────────────────────────────────────────
        //  Selection control
        // ───────────────────────────────────────────────────────
        function selectDistrict(id) {
            activeDistrictId = id;
            activeAttractionId = null;

            districtsLayer.querySelectorAll(".jcd-map__district").forEach(function (p) {
                p.classList.toggle("is-active", p.dataset.district === id);
                p.classList.remove("is-hover");
            });

            cutout.setAttribute("d", id ? DISTRICT_PATHS[id] || "M 0 0 Z" : "M 0 0 Z");

            viewport.classList.toggle("is-detail", !!id);
            if (container) container.classList.toggle("is-detail", !!id);
            hideTooltip();
            syncIconVisibility();

            if (id) {
                // Hide intro overlay, show the side-panel detail column
                if (introEl) introEl.hidden = true;
                panel.hidden = true;
                if (sidePanel) sidePanel.hidden = false;
                if (detailEl) detailEl.hidden = false;
                renderDetail();
                requestAnimationFrame(applyZoom);
            } else {
                // No district selected — restore intro overlay, hide side panel
                if (sidePanel) sidePanel.hidden = true;
                if (detailEl) detailEl.hidden = true;
                if (noIntroMode) {
                    panel.hidden = true;
                } else {
                    panel.hidden = false;
                    if (introEl) introEl.hidden = false;
                }
                applyZoom();
            }
        }

        function selectAttraction(districtId, attractionId, btnEl) {
            if (activeDistrictId !== districtId) selectDistrict(districtId);

            activeAttractionId = attractionId;

            iconsHost.querySelectorAll(".jcd-map__icon").forEach(function (el) {
                el.classList.toggle("is-active", el.dataset.attraction === attractionId);
            });

            if (btnEl) {
                var d = findDistrict(districtId);
                var a =
                    d &&
                    (d.attractions || []).find(function (x) {
                        return x.id === attractionId;
                    });
                if (a) showTooltipAtIcon(btnEl, a.name);
            }
            renderDetail();
        }

        function clearSelection() {
            selectDistrict(null);
        }

        // Frame used for tooltip absolute positioning
        var tooltipFrame = scrollWrap || viewport;

        function showTooltipAt(x, y, text) {
            if (!tooltip) return;
            tooltip.textContent = text;
            tooltip.style.left = x + "px";
            tooltip.style.top = y + "px";
            tooltip.classList.add("is-visible");
            tooltip.hidden = false;
        }
        function showTooltipAtIcon(iconEl, text) {
            var vbRect = tooltipFrame.getBoundingClientRect();
            var ibRect = iconEl.getBoundingClientRect();
            var x = ibRect.left - vbRect.left + ibRect.width / 2;
            var y = ibRect.top - vbRect.top;
            showTooltipAt(x, y, text);
        }
        function hideTooltip() {
            if (!tooltip) return;
            tooltip.classList.remove("is-visible");
            tooltip.hidden = true;
        }

        // ───────────────────────────────────────────────────────
        //  Wiring (event delegation throughout)
        // ───────────────────────────────────────────────────────
        districtsLayer.addEventListener("click", function (e) {
            var path = e.target.closest("[data-district]");
            if (!path) return;
            var id = path.dataset.district;
            if (id === activeDistrictId) return;
            selectDistrict(id);
        });

        districtsLayer.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" && e.key !== " ") return;
            var path = e.target.closest("[data-district]");
            if (!path) return;
            e.preventDefault();
            selectDistrict(path.dataset.district);
        });

        districtsLayer.addEventListener("focusin", function (e) {
            if (viewport.classList.contains("is-detail")) return;
            var path = e.target.closest("[data-district]");
            if (!path) return;
            setHoverDistrict(path.dataset.district);
        });
        districtsLayer.addEventListener("focusout", function () {
            if (!viewport.classList.contains("is-detail")) clearHover();
        });

        districtsLayer.addEventListener("mouseover", function (e) {
            if (viewport.classList.contains("is-detail")) return;
            var path = e.target.closest("[data-district]");
            if (!path) return;
            setHoverDistrict(path.dataset.district);
        });
        districtsLayer.addEventListener("mouseout", function (e) {
            if (viewport.classList.contains("is-detail")) return;
            var path = e.target.closest("[data-district]");
            if (!path) return;
            var next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("[data-district]");
            if (!next) clearHover();
        });

        iconsHost.addEventListener("click", function (e) {
            var btn = e.target.closest(".jcd-map__icon");
            if (!btn || btn.hidden) return;
            selectAttraction(btn.dataset.district, btn.dataset.attraction, btn);
        });

        iconsHost.addEventListener(
            "mouseenter",
            function (e) {
                var btn = e.target && e.target.closest && e.target.closest(".jcd-map__icon");
                if (!btn || btn.hidden) return;
                var d = findDistrict(activeDistrictId);
                var a =
                    d &&
                    (d.attractions || []).find(function (x) {
                        return x.id === btn.dataset.attraction;
                    });
                if (a) showTooltipAtIcon(btn, a.name);
            },
            true,
        );
        iconsHost.addEventListener(
            "mouseleave",
            function (e) {
                var btn = e.target && e.target.closest && e.target.closest(".jcd-map__icon");
                if (!btn) return;
                if (!btn.classList.contains("is-active")) hideTooltip();
            },
            true,
        );

        panel.addEventListener("click", function (e) {
            if (e.target.closest("[data-jcd-close]")) clearSelection();
        });

        if (sidePanel) {
            sidePanel.addEventListener("click", function (e) {
                if (e.target.closest("[data-jcd-close]")) clearSelection();
            });
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && activeDistrictId) clearSelection();
        });

        var rzTimer = null;
        window.addEventListener("resize", function () {
            if (rzTimer) cancelAnimationFrame(rzTimer);
            rzTimer = requestAnimationFrame(function () {
                repositionLabels();
                if (activeDistrictId) applyZoom();
            });
        });

        // ───────────────────────────────────────────────────────
        //  Position labels once the SVG has laid out
        // ───────────────────────────────────────────────────────
        requestAnimationFrame(repositionLabels);

        // ───────────────────────────────────────────────────────
        //  i18n bind
        // ───────────────────────────────────────────────────────
        function bind() {
            window.I18n.onLangChange(function (_lang, t) {
                applyTranslations(t);
            });
        }
        if (window.I18n && window.I18n.onLangChange) {
            bind();
        } else {
            var poll = setInterval(function () {
                if (window.I18n && window.I18n.onLangChange) {
                    clearInterval(poll);
                    bind();
                }
            }, 50);
        }

        return true;
    }

    // ────────────────────────────────────────────────────────────────
    //  Boot — DOMContentLoaded + partial-loader event
    // ────────────────────────────────────────────────────────────────
    function boot() {
        // Map may not exist yet on district pages — that's OK, we'll
        // try again once partials:loaded fires.
        init();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
    document.addEventListener("partials:loaded", boot);
})();

(function () {
    "use strict";

    function findPanel(panelId, districtId) {
        var sel = districtId
            ? '.jcd-map__sc-panel[data-sc-panel="' + panelId + '"][data-sc-district="' + districtId + '"]'
            : '.jcd-map__sc-panel[data-sc-panel="' + panelId + '"]:not([data-sc-district])';

        return document.querySelector(sel);
    }

    function showPanel(panelId, districtId) {
        var panels = document.querySelectorAll(".jcd-map__sc-panel");

        for (var i = 0; i < panels.length; i++) {
            panels[i].hidden = true;
        }

        var panel = findPanel(panelId, districtId);

        if (panel) {
            panel.hidden = false;
        }
    }

    document.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("[data-jcd-close]")) {
            return;
        }

        var btn = e.target.closest && e.target.closest(".jcd-map__icon[data-attraction]");

        if (btn) {
            showPanel(btn.getAttribute("data-attraction"), btn.getAttribute("data-district"));
            return;
        }

        var path = e.target.closest && e.target.closest(".jcd-map__district[data-district]");

        if (path) {
            showPanel(path.getAttribute("data-district"));
        }
    });

    // Read Experience Editor flag from global variable
    var isExperienceEditor = window.jcdMapConfig && window.jcdMapConfig.isExperienceEditor;

    if (!isExperienceEditor) {
        // Auto-select district
        window.addEventListener("load", function () {
            var section = document.getElementById("jcd-map");

            if (!section) {
                return;
            }

            var classes = section.className.split(" ");

            for (var i = 0; i < classes.length; i++) {
                if (classes[i].indexOf("jcd-map--") === 0) {
                    var districtKey = classes[i].replace("jcd-map--", "");

                    var districtPath = document.querySelector(
                        '#jcd-map-districts [data-district="' + districtKey + '"]',
                    );

                    if (districtPath) {
                        districtPath.dispatchEvent(
                            new MouseEvent("click", {
                                bubbles: true,
                                cancelable: true,
                            }),
                        );
                    }

                    break;
                }
            }
        });

        // Restore intro panel when close button clicked
        (function () {
            var section = document.getElementById("jcd-map");

            if (!section) {
                return;
            }

            var hasVariant = false;
            var cl = section.className.split(" ");

            for (var i = 0; i < cl.length; i++) {
                if (cl[i].indexOf("jcd-map--") === 0) {
                    hasVariant = true;
                    break;
                }
            }

            if (!hasVariant) {
                return;
            }

            var mapPanel = document.getElementById("jcd-map-panel");

            if (!mapPanel) {
                return;
            }

            mapPanel.addEventListener("click", function (e) {
                if (!(e.target.closest && e.target.closest("[data-jcd-close]"))) {
                    return;
                }

                setTimeout(function () {
                    var introEl = mapPanel.querySelector('[data-panel-state="intro"]');

                    var detailEl = mapPanel.querySelector('[data-panel-state="detail"]');

                    mapPanel.hidden = false;

                    if (introEl) {
                        introEl.hidden = false;
                    }

                    if (detailEl) {
                        detailEl.hidden = true;
                    }
                }, 0);
            });
        })();
    }
})();
