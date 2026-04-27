/**
 * sections/hero.js — Hero banner
 *
 * Usage in HTML:
 *   <section class="hero" data-media-type="image" data-media-src="assets/hero.jpg">
 *   <section class="hero" data-media-type="video" data-media-src="assets/hero.mp4" data-media-poster="assets/hero.jpg">
 *
 * The section renders a single static image OR a looping video as the
 * background. No carousel, no controls.
 */
window.Hero = (function () {
  'use strict';

  function init(root) {
    root = root || document.querySelector('.hero');
    if (!root) return;

    const mediaWrap = root.querySelector('.hero__media');
    if (!mediaWrap) return;

    // Allow overrides from data attributes so the same component
    // can be reused on other pages with different media.
    const type   = root.dataset.mediaType   || 'image';
    const src    = root.dataset.mediaSrc    || '';
    const poster = root.dataset.mediaPoster || '';
    const alt    = root.dataset.mediaAlt    || '';

    if (!src) {
      // Leave whatever markup the author put inside <div class="hero__media">
      return;
    }

    // Clear & build the chosen media element
    mediaWrap.innerHTML = '';

    if (type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      if (poster) video.poster = poster;
      video.setAttribute('aria-hidden', 'true');
      mediaWrap.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.loading = 'eager';
      img.decoding = 'async';
      mediaWrap.appendChild(img);
    }
  }

  // Auto-init on DOM ready
  function boot() { init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return { init };
})();
