# JCDC Homepage

Pixel-perfect Figma implementation in vanilla HTML / SCSS / JS.

## Stack

- Semantic HTML (WCAG-compliant)
- SCSS — modular, BEM naming, mobile-first
- Vanilla JS — IIFE-scoped modules, no framework
- Bilingual (EN ⇄ AR) with full RTL support

## Project structure

```
JCDC-FE-develop/
├── *.html                 # Pages (index, about, contact, supplier, errorAccess, errorNotFound, legal pages)
├── assets/                # Images, icons, SVGs
├── i18n/                  # Translation files (en.json, ar.json)
├── src/
│   ├── scss/              # Source SCSS (compiled to dist/)
│   └── js/                # Source JS (bundled to dist/)
├── build/
│   ├── bundle-js.js       # Concatenates src/js → dist/main.js
│   ├── build-pages.js     # Stitches new HTML pages from header/footer
│   └── watch-js.js        # Rebuilds JS bundle on file change
├── dist/                  # Build output — generated, do not edit
│   ├── main.css           # Expanded CSS (for debugging)
│   ├── main.min.css       # Minified CSS (used by HTML in production)
│   ├── main.js            # Bundled JS (for debugging)
│   └── main.min.js        # Minified JS (used by HTML in production)
└── package.json
```

## Pages

| Page               | File                                                               | Notes                                                            |
| ------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Home               | `index.html`                                                       | hero + about + slider + news + awards                            |
| About              | `about.html`                                                       | reused hero + content sections                                   |
| Invest             | `invest.html`                                                      | hero + why-jeddah + register-interest form                       |
| Careers            | `career.html`                                                      | hero + how-we-set + next-step CTA                                |
| Suppliers          | `supplier.html`                                                    | hero + who-should-register + process                             |
| Contact Us         | `contact.html`                                                     | hero + 50/50 form + address card                                 |
| Search             | `search.html`                                                      | **NEW** — hero + URL-driven search + results + pagination        |
| News & Events      | `news.html`                                                        | **NEW** — hero + search/date filters + chips + grid + pagination |
| News Article       | `news-item.html`                                                   | **NEW** — hero with date + article body + related sidebar        |
| 403 Access Denied  | `errorAccess.html`                                                 | standalone error layout                                          |
| 404 Page Not Found | `errorNotFound.html`                                               | standalone error layout                                          |
| Legal              | `privacyPolicy.html`, `terms&condition.html`, `cookiesPolicy.html` |                                                                  |

## Setup

```bash
npm install
```

## Build

A single `npm run build` produces all four output files in `dist/`:

| File                | Style        | Used by         |
| ------------------- | ------------ | --------------- |
| `dist/main.css`     | expanded     | local debugging |
| `dist/main.min.css` | compressed   | **HTML pages**  |
| `dist/main.js`      | concatenated | local debugging |
| `dist/main.min.js`  | minified     | **HTML pages**  |

```bash
npm run build          # full build (clean + css + css.min + js + js.min)
npm run build:css      # SCSS → dist/main.css
npm run build:css:min  # SCSS → dist/main.min.css
npm run build:js       # bundle src/js/*.js → dist/main.js
npm run build:js:min   # minify dist/main.js → dist/main.min.js
npm run clean          # remove dist/
```

## Develop

```bash
npm run watch          # watches SCSS + JS, rebuilds on change
npm run dev            # serves the project at http://localhost:3000
npm start              # build once, then serve
```

In two terminals during active development:

```bash
# terminal 1
npm run watch
# terminal 2
npm run dev
```

> Note: `watch` only updates the un-minified `main.css` / `main.js` for fast
> rebuild. Run `npm run build` once before deploying to refresh the `.min`
> files used by the HTML pages.

## Adding a new JS file

1. Create the file under `src/js/` (use the IIFE pattern, see existing files).
2. Add its path to the `FILES` array in `build/bundle-js.js` in the correct
   load order.
3. Run `npm run build`.

## Adding a new SCSS partial

1. Create `_yourpartial.scss` under the appropriate folder in `src/scss/`.
2. Add `@use "folder/yourpartial";` to `src/scss/main.scss`.
3. Run `npm run build`.

## Bilingual (EN ⇄ AR)

The site is fully translated via JSON dictionaries in `i18n/` and a
language toggle in the navbar/drawer. Each text node uses
`data-i18n="key.path"` and `src/js/i18n.js` does the lookup at runtime.

- `<html dir="rtl" lang="ar">` is set automatically when the user picks
  Arabic; this flips layout via `[dir="rtl"]` selectors throughout the
  SCSS.
- Direction-sensitive arrows / chevrons are mirrored with
  `transform: scaleX(-1)` inside `[dir="rtl"]` blocks (see
  `src/scss/components/_buttons.scss`).
- The user's choice persists in `localStorage` under the key `jcdc-lang`.

## Newly added components / pages

| Item                            | File                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 403 / 404 error layout          | `src/scss/sections/_errorPage.scss`                                                                              |
| Contact Us form + success state | `src/scss/sections/_contactUs.scss`                                                                              |
| Who Should Register (2x2)       | `src/scss/sections/_whoRegister.scss`                                                                            |
| Registration Process (3 steps)  | `src/scss/sections/_registrationProcess.scss`                                                                    |
| Search page                     | `src/scss/sections/_searchPage.scss`                                                                             |
| News listing page               | `src/scss/sections/_newsListing.scss`                                                                            |
| News article (single item) page | `src/scss/sections/_newsItem.scss`                                                                               |
| Leadership (about page)         | `src/scss/sections/_leadership.scss`                                                                             |
| Pagination component (shared)   | `src/scss/components/_pagination.scss`                                                                           |
| Filter chip (toggleable)        | `src/scss/sections/_newsListing.scss` (`.filter-chip`)                                                           |
| `navbar--always-solid` modifier | `src/scss/components/_navbar.scss`                                                                               |
| Contact form validation         | `src/js/sections/contact-us.js`                                                                                  |
| Search page (URL `?q`, `?page`) | `src/js/sections/search-page.js`                                                                                 |
| News listing (filter/date/page) | `src/js/sections/news-listing.js`                                                                                |
| News article (`?id=` routing)   | `src/js/sections/news-item.js`                                                                                   |
| Leadership tabs + bio modal     | `src/js/sections/leadership.js`                                                                                  |
| Page-stitching helper           | `build/build-pages.js`                                                                                           |
| New i18n namespaces             | `error403.*`, `error404.*`, `contact.*`, `supplier.*`, `search.*`, `newsListing.*`, `newsItem.*`, `leadership.*` |

To regenerate the assembled pages from the template + header/footer:

```bash
node build/build-pages.js
```

## URL-driven state

The new search and news-listing pages are fully URL-driven, which means
each filter / page / query is bookmarkable and the browser back/forward
buttons work. URLs:

- `search.html?q=jeddah&page=2`
- `news.html?q=oceanarium&from=2024-01-01&to=2024-12-31&cat=projectMilestones,companyUpdates&page=2`
- `news-item.html?id=jc-12bn-contract`

# JCDC Map — How to Pre-Select a District (For Sitecore Team)

## The one thing you need to change

Add a modifier class to the map section's root element:

```html
<section class="jcd-map jcd-map--beach" id="jcd-map" aria-label="...">…</section>
```

That's it. The JS reads the class, auto-selects that district on load, and hides the "Six Districts. One Destination." intro state.

## Valid district IDs

| Page / district                     | Class to add        |
| ----------------------------------- | ------------------- |
| Beach, Leisure & Lifestyle District | `jcd-map--beach`    |
| Wellness District                   | `jcd-map--wellness` |
| Central District                    | `jcd-map--central`  |
| Culture & Creativity District       | `jcd-map--culture`  |
| Sport Park District                 | `jcd-map--sport`    |
| Marina District                     | `jcd-map--marina`   |

The 6 IDs match the keys used in `i18n/en.json` and `i18n/ar.json` under `jcdMap.districts.<id>`.

## How it's wired

In `src/js/sections/jcd-map.js`, the init function reads the root element's classes and picks up the district modifier:

```js
function readDefaultDistrictFromClass(el) {
    for (var id of ["beach", "wellness", "central", "culture", "sport", "marina"]) {
        if (el.classList.contains("jcd-map--" + id)) return id;
    }
    return null;
}

var defaultDistrict =
    root.dataset.defaultDistrict || // legacy attribute (still supported)
    readDefaultDistrictFromClass(root) || // ← preferred for Sitecore
    null;

// Presence of a class modifier implies no-intro mode (the page boots
// straight into the matching district's detail view).
var noIntroMode = root.hasAttribute("data-no-intro") || readDefaultDistrictFromClass(root) !== null;
```

## On `jcdc.html` (the overview page)

Leave the section with just the base class — no modifier:

```html
<section class="jcd-map" id="jcd-map" aria-label="..."></section>
```

The map boots in the intro state ("Six Districts. One Destination."). Users can click any district to open its detail panel. Close X returns to the intro.

## On each district sub-page

Add the matching modifier class. The page boots straight into that district's detail view. When the user clicks Close (X), the panel hides entirely and the map returns to normal hover/click behaviour — letting users explore other districts on the same page.

```html
<!-- beach.html -->
<section class="jcd-map jcd-map--beach" id="jcd-map" aria-label="..."></section>
```

## Pre-rendered sub-pages

All 6 district sub-pages in this zip are already patched. The Sitecore team can either:

1. **Use them as-is**: copy the `<section class="jcd-map …">` block straight from each page's HTML into the matching .cshtml view.
2. **Use a single shared partial**: render one .cshtml partial that emits the map markup, accepting the district ID as a parameter. Inside the partial, the class list becomes `jcd-map jcd-map--@Model.DistrictId`.

The class-based approach is intentionally template-friendly so option 2 is one line of Razor.

## Built outputs

`dist/main.min.css` and `dist/main.min.js` are already built. The pages reference them directly:

```html
<link rel="stylesheet" href="dist/main.min.css" />
<script src="dist/main.min.js" defer></script>
```

If you want to rebuild from source:

```bash
npm install
npm run build
```

`npm run build` regenerates BOTH the expanded and the minified outputs. The Sitecore deployment should serve the `.min.*` files.

## What else changed in this revision

| Aspect                                                                                                        | Status |
| ------------------------------------------------------------------------------------------------------------- | ------ |
| Map fills full section width (no more 50/50 split with the panel column)                                      | ✓      |
| Map height capped at 770 px on desktop                                                                        | ✓      |
| Hover hit area covers the entire district fill (not just the stroke)                                          | ✓      |
| Active district has NO border at any state (idle, hover, focus)                                               | ✓      |
| Dim opacity 0.55 — surrounding satellite stays visible underneath, not solid black                            | ✓      |
| Two dim layers (overview = darkens area outside ALL districts; detail = darkens area outside ACTIVE district) | ✓      |
| Solid dark panel slides in from the right when a district is selected                                         | ✓      |
| Attraction icons clipped to the active district via `isPointInFill`                                           | ✓      |
| 6 sub-pages auto-select their district via the `jcd-map--<id>` class                                          | ✓      |
| `scroll-margin-top: 100px` so the close X clears the fixed navbar on anchor jumps                             | ✓      |
| Close X has a white ring + dark background so it stays visible on any image                                   | ✓      |

## Known follow-up items (not map work — Sitecore team can handle in CMS)

1. **Explore District CTA** links to `#` because every `href` in `i18n/*.json` is `"#"`. Set each district's `href` to its sub-page (`./beach.html`, etc.) in the i18n JSON.
2. **District images** in `i18n/*.json` use Unsplash URLs. Swap to local paths under `assets/districts/` or to Sitecore media library URLs.
3. **Attraction icon positions** are stored as percentages of viewport in `i18n/*.json` under each district's `attractions[].x/y`. If an icon disappears, it's because its centre is outside the district path — nudge the coordinates a percent or two.
