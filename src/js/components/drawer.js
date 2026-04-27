/**
 * components/drawer.js — Mobile navigation drawer
 *
 * Handles:
 *   • Open/close (hamburger, close button, overlay, Escape key)
 *   • Expandable sub-menu inside the drawer
 *   • Auto-close when viewport becomes desktop-wide (>=1024px)
 *   • Auto-close when language changes (avoids stale RTL/LTR artifacts)
 */
window.Drawer = (function () {
  'use strict';

  const DESKTOP_MIN = 1024;

  let drawer, overlay, hamburger, closeBtn;

  function open() {
    drawer.classList.add('is-open');
    overlay?.classList.add('is-visible');
    hamburger?.setAttribute('aria-expanded', 'true');
    drawer.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    hamburger?.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Collapse any expanded sub-menus when closing
    drawer.querySelectorAll('.drawer__item--has-sub.is-expanded')
      .forEach(i => i.classList.remove('is-expanded'));
  }

  function isOpen() {
    return drawer?.classList.contains('is-open');
  }

  function initExpanders() {
    drawer.querySelectorAll('[data-mobile-expand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.drawer__item--has-sub');
        if (!item) return;

        // Close siblings
        drawer.querySelectorAll('.drawer__item--has-sub.is-expanded').forEach(i => {
          if (i !== item) i.classList.remove('is-expanded');
        });

        item.classList.toggle('is-expanded');
      });
    });
  }

  function init() {
    drawer    = document.getElementById('drawer')      || document.querySelector('.drawer');
    overlay   = document.getElementById('overlay')     || document.querySelector('.overlay');
    hamburger = document.getElementById('hamburger')   || document.querySelector('.hamburger');
    closeBtn  = document.getElementById('drawer-close')|| document.querySelector('.drawer__close');
    if (!drawer || !hamburger) return;

    hamburger.addEventListener('click', () => (isOpen() ? close() : open()));
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    });

    initExpanders();

    // Auto-close on resize to desktop width (fixes drawer "stuck open"
    // between viewport transitions, including after language switch)
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const onChange = () => { if (mq.matches) close(); };
    mq.addEventListener?.('change', onChange);

    // Auto-close on language change — guarantees the drawer can never
    // appear as a side-effect of switching between EN and AR.
    window.addEventListener('langchange', () => { if (isOpen()) close(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, open, close, isOpen };
})();
