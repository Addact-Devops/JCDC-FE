/**
 * components/partial.js — HTML partial loader
 *
 * Lets static HTML pages reuse large shared sections without duplicating
 * the markup. Usage:
 *
 *   <div data-include="components/jcd-map.html"
 *        data-default-district="beach"
 *        data-no-intro></div>
 *
 * The placeholder element is replaced with the contents of the fetched
 * file. Any `data-*` attributes on the placeholder (other than
 * `data-include` itself) are forwarded onto the FIRST element of the
 * loaded fragment — so the partial can be configured per page.
 *
 * After every placeholder has been resolved (or has errored), the
 * document dispatches a `partials:loaded` event. Sections that depend
 * on the injected DOM (e.g. jcd-map.js) listen for it to (re-)init.
 *
 * Notes
 *  • Runs once on DOMContentLoaded.
 *  • Network errors are logged and the placeholder is removed so the
 *    page degrades gracefully.
 *  • Cached at the browser level (uses default fetch caching).
 */
(function () {
    'use strict';

    function loadOne(slot) {
        var url = slot.getAttribute('data-include');
        if (!url) return Promise.resolve();

        return fetch(url, { credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
                return res.text();
            })
            .then(function (html) {
                var tpl = document.createElement('template');
                tpl.innerHTML = html.trim();

                var firstEl = tpl.content.firstElementChild;

                // Forward any data-* attributes from the slot onto the
                // root element of the loaded partial. This lets each
                // page configure the included component independently.
                if (firstEl) {
                    Array.prototype.slice.call(slot.attributes).forEach(function (attr) {
                        if (attr.name === 'data-include') return;
                        if (attr.name.indexOf('data-') !== 0) return;
                        firstEl.setAttribute(attr.name, attr.value);
                    });
                }

                slot.parentNode.replaceChild(tpl.content, slot);
            })
            .catch(function (err) {
                console.error('[partial] Failed to load', url, err);
                if (slot.parentNode) slot.parentNode.removeChild(slot);
            });
    }

    function loadAll() {
        var slots = document.querySelectorAll('[data-include]');
        if (!slots.length) {
            // Still fire the event so listeners can run their no-op path
            document.dispatchEvent(new CustomEvent('partials:loaded'));
            return;
        }

        Promise.all(Array.prototype.slice.call(slots).map(loadOne))
            .then(function () {
                document.dispatchEvent(new CustomEvent('partials:loaded'));
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAll);
    } else {
        loadAll();
    }
})();
