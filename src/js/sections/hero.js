window.Hero = (function () {
  "use strict";

  function init(root) {
    root = root || document.querySelector(".hero");
    if (!root) return;

    const mediaWrap = root.querySelector(".hero__media");
    if (!mediaWrap) return;

    const type = root.dataset.mediaType || "image";
    const src = root.dataset.mediaSrc || "";
    const poster = root.dataset.mediaPoster || "";
    const alt = root.dataset.mediaAlt || "";

    if (!src) {
      return;
    }

    mediaWrap.innerHTML = "";

    if (type === "video") {
      const video = document.createElement("video");
      video.src = src;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      if (poster) video.poster = poster;
      video.setAttribute("aria-hidden", "true");
      mediaWrap.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      img.loading = "eager";
      img.decoding = "async";
      mediaWrap.appendChild(img);
    }
  }

  function boot() {
    init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return { init };
})();
