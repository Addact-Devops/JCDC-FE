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
    var mobileIntroEl = root.querySelector(".jcd-map__intro--mobile");

    if (
      !viewport ||
      !stage ||
      !layers ||
      !svg ||
      !districtsLayer ||
      !cutout ||
      !panel
    ) {
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
    var DISTRICT_IDS = [
      "beach",
      "wellness",
      "central",
      "culture",
      "sport",
      "marina",
    ];

    function readDefaultDistrictFromClass(el) {
      for (var i = 0; i < DISTRICT_IDS.length; i++) {
        if (el.classList.contains("jcd-map--" + DISTRICT_IDS[i])) {
          return DISTRICT_IDS[i];
        }
      }
      return null;
    }

    var defaultDistrict =
      root.dataset.defaultDistrict ||
      readDefaultDistrictFromClass(root) ||
      null;

    // `data-no-intro` OR the presence of any `jcd-map--<id>` class
    // implies no-intro mode (the page boots straight into the
    // matching district's detail view).
    var noIntroMode =
      root.hasAttribute("data-no-intro") ||
      readDefaultDistrictFromClass(root) !== null;

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
      districtsLayer
        .querySelectorAll(".jcd-map__district")
        .forEach(function (p) {
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
              : bbox.x +
                bbox.width / 2 +
                (parseFloat(labelEl.dataset.offsetX) || 0);
          var cy =
            labelEl.dataset.manualY !== undefined
              ? parseFloat(labelEl.dataset.manualY)
              : bbox.y +
                bbox.height / 2 +
                (parseFloat(labelEl.dataset.offsetY) || 0);
          labelEl.setAttribute("x", cx);
          labelEl.setAttribute("y", cy);
          // If tspans already exist (applyTranslations ran before this RAF),
          // join their text with spaces — textContent concatenates without separators.
          if (!labelEl.dataset.labelText) {
            var existingTspans = labelEl.querySelectorAll("tspan");
            if (existingTspans.length > 0) {
              var tparts = [];
              existingTspans.forEach(function (t) {
                var txt = t.textContent.trim();
                if (txt) tparts.push(txt);
              });
              labelEl.dataset.labelText = tparts.join(" ");
            } else {
              labelEl.dataset.labelText = labelEl.textContent.trim();
            }
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
        var pathEl = districtsLayer.querySelector(
          '[data-district="' + d.id + '"]',
        );
        var labelEl =
          labelsLayer &&
          labelsLayer.querySelector('[data-label="' + d.id + '"]');
        if (pathEl) pathEl.setAttribute("aria-label", d.name || "");
        if (labelEl) {
          if (d.name) labelEl.dataset.labelText = d.name.trim();
          setMultilineLabel(labelEl, d.name || "");
        }

        (d.attractions || []).forEach(function (a) {
          var btn = iconsHost.querySelector(
            '.jcd-map__icon[data-district="' +
              d.id +
              '"][data-attraction="' +
              a.id +
              '"]',
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
      var lineHeight = 22;

      lines.forEach(function (line, i) {
        var tspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        tspan.setAttribute("x", x);
        tspan.setAttribute(
          "dy",
          i === 0
            ? "-" + ((lines.length - 1) * lineHeight) / 2 + "px"
            : lineHeight + "px",
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
          var mid = tokens.join(" ");
          if (mid.length > 10) {
            var midTokens = mid.split(/\s+/);
            var midLast = midTokens.pop();
            return [head, midTokens.join(" "), midLast, last];
          }
          return [head, mid, last];
        }
        return [head, tail];
      }
      var ampIdx = trimmed.indexOf(" & ");
      if (ampIdx !== -1) {
        return [trimmed.slice(0, ampIdx + 2), trimmed.slice(ampIdx + 3)];
      }
      var idx = trimmed.lastIndexOf(" ");
      if (idx === -1) return [trimmed];
      return [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
    }

    function findDistrict(id) {
      return ((translations && translations.districts) || []).find(
        function (d) {
          return d.id === id;
        },
      );
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
      var ctaLabel =
        (translations && translations.districtCta) || "Explore District";

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
          ctaLabel =
            a.ctaLabel ||
            (translations && translations.attractionCta) ||
            "Explore Attractions";
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
      iconsHost.querySelectorAll(".jcd-map__icon").forEach(function (btn) {
        var matchesDistrict = btn.dataset.district === activeDistrictId;
        if (!matchesDistrict) {
          btn.hidden = true;
          btn.tabIndex = -1;
          btn.classList.remove("is-active");
          btn.classList.remove("not-active");
          return;
        }

        btn.hidden = false;
        btn.tabIndex = 0;
      });
    }

    // ───────────────────────────────────────────────────────
    //  Zoom the stage into the active district.
    //  --------------------------------------------------------
    //  Only relevant in detail mode. Overview is pure CSS (__stage
    //  is 100%/inset:0 of the viewport there — see _jcdMap.scss) and
    //  needs no JS at all, so it's correct on first paint with zero
    //  dependency on JS having run yet. Once a district is active,
    //  __stage switches (via .is-detail in CSS) to its native
    //  1440x773 design size (matching the mask/stage images' native
    //  pixel size exactly), and this function applies ONE computed
    //  transform that zooms into that district.
    //
    //  WHY NATIVE SIZE + ONE TRANSFORM (rather than object-fit /
    //  preserveAspectRatio) — those bake in a fixed, centred crop at
    //  layout time based on the element's OWN box size; a transform
    //  applied afterwards on an ancestor can only rigidly scale and
    //  move that already-cropped result, it can NOT reveal a
    //  different region of the source. That made off-centre
    //  districts (Culture, hugging the map's west edge) render
    //  mostly empty: the crop the browser had already committed to
    //  simply didn't contain most of the shape, and no amount of
    //  extra scale/translate could bring it back. Computing
    //  everything here, against the real 1440x773 coordinates,
    //  avoids that trap entirely. All three map visuals (background
    //  image, mask img, SVG + icons) live inside __stage, so this
    //  single transform keeps them moving together as one unit with
    //  no possibility of drifting out of sync.
    //
    //  CENTRING — Uses the bounding-box centre. That matches how
    //  the Figma reference frames each district: the bbox of the
    //  visible shape sits centred in the map viewport. (An earlier
    //  draft used the area-weighted centroid, which for
    //  crescent-shaped districts like Beach shifted the bbox
    //  off-screen because the area mass is in the northern lobe —
    //  not what we want here.)
    //
    //  ZOOM — Adaptive per district: fills TARGET_FILL_PCT of the
    //  box along its tighter axis (width OR height), so the active
    //  district occupies the full available space of the left
    //  section without spilling out of it. Clamped to
    //  [MIN_ZOOM, MAX_ZOOM] so tiny districts (Wellness) don't
    //  blow up into an illegibly blurry close-up.
    //
    //  TRANSLATE — Computed in PIXELS with transform-origin at
    //  (0, 0): a canvas point (px, py) lands at screen position
    //  (tx + px*scale, ty + py*scale). Solving for the box centre
    //  gives tx/ty directly, with no per-axis % ambiguity.
    // ───────────────────────────────────────────────────────
    var VB_W = 1440;
    var VB_H = 773;
    var TARGET_FILL_PCT = 96;
    var MIN_ZOOM = 1;
    var MAX_ZOOM = 8;

    function applyZoom() {
      var pathEl = activeDistrictId
        ? districtsLayer.querySelector(
            '[data-district="' + activeDistrictId + '"]',
          )
        : null;

      var bbox = null;
      if (pathEl) {
        try {
          bbox = pathEl.getBBox();
        } catch (e) {
          bbox = null;
        }
        if (bbox && (!isFinite(bbox.width) || bbox.width === 0)) bbox = null;
      }

      if (!bbox) {
        // No district active — overview is handled entirely by CSS.
        stage.style.transform = "";
        iconsHost.style.setProperty("--icon-counter-scale", "1");
        return;
      }

      var box = scrollWrap || viewport;
      var boxW = box.offsetWidth;
      var boxH = box.offsetHeight;
      if (!boxW || !boxH) return;

      var cx = bbox.x + bbox.width / 2;
      var cy = bbox.y + bbox.height / 2;
      var fitX = ((TARGET_FILL_PCT / 100) * boxW) / bbox.width;
      var fitY = ((TARGET_FILL_PCT / 100) * boxH) / bbox.height;
      var scale = Math.max(MIN_ZOOM, Math.min(Math.min(fitX, fitY), MAX_ZOOM));

      var tx = boxW / 2 - cx * scale;
      var ty = boxH / 2 - cy * scale;

      // Clamp so we never pan far enough to expose empty space beyond
      // the canvas's actual [0,1440]x[0,773] edges — needed for
      // districts that hug the boundary (Sport at y=0, Culture at
      // x=0) — with a small margin so they still get a hair of
      // breathing room instead of a hard crop line.
      var EDGE_MARGIN = 0.04 * Math.min(boxW, boxH);
      var minTx = boxW - VB_W * scale - EDGE_MARGIN;
      var minTy = boxH - VB_H * scale - EDGE_MARGIN;
      tx = Math.max(minTx, Math.min(EDGE_MARGIN, tx));
      ty = Math.max(minTy, Math.min(EDGE_MARGIN, ty));

      stage.style.transform =
        "translate(" +
        tx.toFixed(2) +
        "px, " +
        ty.toFixed(2) +
        "px) " +
        "scale(" +
        scale.toFixed(4) +
        ")";

      // Counter-scale the icons so they keep their physical size
      // despite the district zoom.
      iconsHost.style.setProperty("--icon-counter-scale", String(1 / scale));
    }

    function setHoverDistrict(id) {
      districtsLayer
        .querySelectorAll(".jcd-map__district")
        .forEach(function (p) {
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
      districtsLayer
        .querySelectorAll(".jcd-map__district.is-hover")
        .forEach(function (p) {
          p.classList.remove("is-hover");
        });
      if (labelsLayer) {
        labelsLayer
          .querySelectorAll(".jcd-map__label.is-visible")
          .forEach(function (l) {
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

      districtsLayer
        .querySelectorAll(".jcd-map__district")
        .forEach(function (p) {
          var isActive = !!id && p.dataset.district === id;
          p.classList.toggle("is-active", isActive);
          p.classList.toggle("not-active", !!id && !isActive);
          p.classList.remove("is-hover");
        });

      cutout.setAttribute(
        "d",
        id ? DISTRICT_PATHS[id] || "M 0 0 Z" : "M 0 0 Z",
      );

      viewport.classList.toggle("is-detail", !!id);
      if (container) container.classList.toggle("is-detail", !!id);
      hideTooltip();
      syncIconVisibility();

      if (id) {
        // Hide intro overlay, show the side-panel detail column
        if (introEl) introEl.hidden = true;
        if (mobileIntroEl) mobileIntroEl.hidden = true;
        panel.hidden = true;
        if (sidePanel) sidePanel.hidden = false;
        if (detailEl) detailEl.hidden = false;
        renderDetail();
        requestAnimationFrame(applyZoom);
      } else {
        // No district selected — restore intro overlay, hide side panel
        if (sidePanel) sidePanel.hidden = true;
        if (detailEl) detailEl.hidden = true;
        if (mobileIntroEl) mobileIntroEl.hidden = false;
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
        el.classList.toggle(
          "is-active",
          el.dataset.attraction === attractionId,
        );
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
      var next =
        e.relatedTarget &&
        e.relatedTarget.closest &&
        e.relatedTarget.closest("[data-district]");
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
        var btn =
          e.target && e.target.closest && e.target.closest(".jcd-map__icon");
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
        var btn =
          e.target && e.target.closest && e.target.closest(".jcd-map__icon");
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
      ? '.jcd-map__sc-panel[data-sc-panel="' +
        panelId +
        '"][data-sc-district="' +
        districtId +
        '"]'
      : '.jcd-map__sc-panel[data-sc-panel="' +
        panelId +
        '"]:not([data-sc-district])';

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

    var btn =
      e.target.closest && e.target.closest(".jcd-map__icon[data-attraction]");

    if (btn) {
      showPanel(
        btn.getAttribute("data-attraction"),
        btn.getAttribute("data-district"),
      );
      return;
    }

    var path =
      e.target.closest && e.target.closest(".jcd-map__district[data-district]");

    if (path) {
      showPanel(path.getAttribute("data-district"));
    }
  });

  // Read Experience Editor flag from global variable
  var isExperienceEditor =
    window.jcdMapConfig && window.jcdMapConfig.isExperienceEditor;

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
