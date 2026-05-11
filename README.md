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

| Page                | File                    | Notes                                           |
| ------------------- | ----------------------- | ----------------------------------------------- |
| Home                | `index.html`            | hero + about + slider + news + awards           |
| About               | `about.html`            | reused hero + content sections                  |
| Invest              | `invest.html`           | hero + why-jeddah + register-interest form      |
| Careers             | `career.html`           | hero + how-we-set + next-step CTA               |
| Suppliers           | `supplier.html`         | hero + who-should-register + process            |
| Contact Us          | `contact.html`          | hero + 50/50 form + address card                |
| Search              | `search.html`           | **NEW** — hero + URL-driven search + results + pagination |
| News & Events       | `news.html`             | **NEW** — hero + search/date filters + chips + grid + pagination |
| News Article        | `news-item.html`        | **NEW** — hero with date + article body + related sidebar |
| 403 Access Denied   | `errorAccess.html`      | standalone error layout                         |
| 404 Page Not Found  | `errorNotFound.html`    | standalone error layout                         |
| Legal               | `privacyPolicy.html`, `terms&condition.html`, `cookiesPolicy.html` |  |

## Setup

```bash
npm install
```

## Build

A single `npm run build` produces all four output files in `dist/`:

| File              | Style       | Used by         |
| ----------------- | ----------- | --------------- |
| `dist/main.css`     | expanded    | local debugging |
| `dist/main.min.css` | compressed  | **HTML pages**  |
| `dist/main.js`      | concatenated | local debugging |
| `dist/main.min.js`  | minified    | **HTML pages**  |

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

| Item                              | File                                                  |
| --------------------------------- | ----------------------------------------------------- |
| 403 / 404 error layout            | `src/scss/sections/_errorPage.scss`                   |
| Contact Us form + success state   | `src/scss/sections/_contactUs.scss`                   |
| Who Should Register (2x2)         | `src/scss/sections/_whoRegister.scss`                 |
| Registration Process (3 steps)    | `src/scss/sections/_registrationProcess.scss`         |
| Search page                       | `src/scss/sections/_searchPage.scss`                  |
| News listing page                 | `src/scss/sections/_newsListing.scss`                 |
| News article (single item) page   | `src/scss/sections/_newsItem.scss`                    |
| Leadership (about page)           | `src/scss/sections/_leadership.scss`                  |
| Pagination component (shared)     | `src/scss/components/_pagination.scss`                |
| Filter chip (toggleable)          | `src/scss/sections/_newsListing.scss` (`.filter-chip`)|
| `navbar--always-solid` modifier   | `src/scss/components/_navbar.scss`                    |
| Contact form validation           | `src/js/sections/contact-us.js`                       |
| Search page (URL `?q`, `?page`)   | `src/js/sections/search-page.js`                      |
| News listing (filter/date/page)   | `src/js/sections/news-listing.js`                     |
| News article (`?id=` routing)     | `src/js/sections/news-item.js`                        |
| Leadership tabs + bio modal       | `src/js/sections/leadership.js`                       |
| Page-stitching helper             | `build/build-pages.js`                                |
| New i18n namespaces               | `error403.*`, `error404.*`, `contact.*`, `supplier.*`, `search.*`, `newsListing.*`, `newsItem.*`, `leadership.*` |

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
