/**
 * i18n.js — JCDC Bilingual Engine
 * Fully functional EN ⇄ AR switching with dir/lang/font updates.
 */
(function () {
  'use strict';

  const SUPPORTED = ['en', 'ar'];
  const DEFAULT = 'en';
  const STORAGE_KEY = 'jcdc-lang';
  const PATH = 'i18n/';

  const cache = Object.create(null);
  let current = DEFAULT;
  const subscribers = new Set();

  // Deep lookup for dot-notation keys
  function deepGet(obj, keyPath) {
    return keyPath.split('.').reduce((acc, k) => acc?.[k], obj);
  }

  async function loadLang(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch(`${PATH}${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`[i18n] Failed to load ${lang}.json (${res.status})`);
    cache[lang] = await res.json();
    return cache[lang];
  }

  // Apply translations to all [data-i18n]
  function applyTranslations(translations) {
    // 1. Standard text translations: nodes with [data-i18n]
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(node => {
      const key = node.getAttribute('data-i18n');
      const value = deepGet(translations, key);

      if (value == null) {
        console.warn(`[i18n] Missing: "${key}" for "${current}"`);
        return;
      }

      // Only set if it's a string (arrays/objects are for programmatic access)
      if (typeof value !== 'string') return;

      if (node.tagName === 'TITLE') {
        document.title = value;
      } else if (node.tagName === 'META') {
        node.setAttribute('content', value);
      } else if ('placeholder' in node && node.hasAttribute('data-i18n-placeholder') && !node.getAttribute('data-i18n-placeholder')) {
        // Legacy: data-i18n + boolean data-i18n-placeholder flag
        node.placeholder = value;
      } else {
        node.textContent = value;
      }
    });

    // 2. Placeholder-only translations: nodes with [data-i18n-placeholder="key"]
    // (standalone attribute pattern — used when label and placeholder need different keys)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      const key = node.getAttribute('data-i18n-placeholder');
      // Skip if used as a boolean flag (handled above)
      if (!key) return;
      const value = deepGet(translations, key);
      if (typeof value !== 'string') return;
      if ('placeholder' in node) node.placeholder = value;
    });

    // 3. Alt-text translations: nodes with [data-i18n-alt="key"]
    // Used on <img> elements whose alt text needs to be localized
    // (e.g. person photos where alt = person's name).
    document.querySelectorAll('[data-i18n-alt]').forEach(node => {
      const key = node.getAttribute('data-i18n-alt');
      if (!key) return;
      const value = deepGet(translations, key);
      if (typeof value !== 'string') return;
      node.setAttribute('alt', value);
    });

    // 4. Aria-label translations: nodes with [data-i18n-aria-label="key"]
    document.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
      const key = node.getAttribute('data-i18n-aria-label');
      if (!key) return;
      const value = deepGet(translations, key);
      if (typeof value !== 'string') return;
      node.setAttribute('aria-label', value);
    });
  }

  function setDocumentAttrs(lang) {
    const rtl = lang === 'ar';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('data-lang', lang);
  }

  function updateLangButtons(lang) {
    // Swap button text: in EN show "العربية", in AR show "EN"
    const labels = document.querySelectorAll('.lang-btn__text');
    const label = lang === 'en' ? 'العربية' : 'EN';
    labels.forEach(el => { el.textContent = label; });
  }

  // Public: set language (returns Promise)
  async function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) {
      console.error(`[i18n] Unsupported: ${lang}`);
      return;
    }
    if (lang === current && cache[lang]) return;

    document.body.classList.add('lang-switching');
    try {
      const t = await loadLang(lang);
      current = lang;
      setDocumentAttrs(lang);
      applyTranslations(t);
      updateLangButtons(lang);

      try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}

      // Notify subscribers (news grid, etc.)
      subscribers.forEach(fn => { try { fn(lang, t); } catch (e) { console.error(e); } });
      window.dispatchEvent(new CustomEvent('langchange', { detail: { lang, translations: t } }));
    } catch (err) {
      console.error('[i18n] Error:', err);
    } finally {
      setTimeout(() => document.body.classList.remove('lang-switching'), 150);
    }
  }

  function onLangChange(fn) {
    subscribers.add(fn);
    // Fire immediately with current state if already loaded
    if (cache[current]) fn(current, cache[current]);
    return () => subscribers.delete(fn);
  }

  function t(key) {
    const val = deepGet(cache[current] || {}, key);
    return val === undefined ? key : val;
  }

  function get() { return current; }

  async function init() {
    // Detect initial language
    let saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    const initial = SUPPORTED.includes(saved) ? saved : DEFAULT;

    current = initial;
    setDocumentAttrs(initial);

    const t = await loadLang(initial);
    applyTranslations(t);
    updateLangButtons(initial);

    // Notify subscribers now that initial data is loaded
    subscribers.forEach(fn => { try { fn(initial, t); } catch (e) { console.error(e); } });

    // Pre-load the other language silently
    loadLang(initial === 'ar' ? 'en' : 'ar').catch(() => {});

    // Wire up language buttons — use event delegation so dynamically added ones work
    document.addEventListener('click', e => {
      const btn = e.target.closest('#lang-btn, #lang-btn-drawer');
      if (!btn) return;
      e.preventDefault();
      setLanguage(current === 'en' ? 'ar' : 'en');
    });
  }

  // Expose API
  window.I18n = {
    init,
    setLanguage,
    onLangChange,
    t,
    get,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
