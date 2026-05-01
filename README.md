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
├── *.html                 # Pages (index, about, legal pages)
├── assets/                # Images, icons, SVGs
├── i18n/                  # Translation files (en.json, ar.json)
├── src/
│   ├── scss/              # Source SCSS (compiled to dist/)
│   └── js/                # Source JS (bundled to dist/)
├── build/
│   ├── bundle-js.js       # Concatenates src/js → dist/main.js
│   └── watch-js.js        # Rebuilds JS bundle on file change
├── dist/                  # Build output — generated, do not edit
│   ├── main.css           # Expanded CSS (for debugging)
│   ├── main.min.css       # Minified CSS (used by HTML in production)
│   ├── main.js            # Bundled JS (for debugging)
│   └── main.min.js        # Minified JS (used by HTML in production)
└── package.json
```

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
