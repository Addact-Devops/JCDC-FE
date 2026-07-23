(function () {
  "use strict";

  function loadOne(slot) {
    var url = slot.getAttribute("data-include");
    if (!url) return Promise.resolve();

    return fetch(url, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
        return res.text();
      })
      .then(function (html) {
        var tpl = document.createElement("template");
        tpl.innerHTML = html.trim();

        var firstEl = tpl.content.firstElementChild;

        if (firstEl) {
          Array.prototype.slice.call(slot.attributes).forEach(function (attr) {
            if (attr.name === "data-include") return;
            if (attr.name.indexOf("data-") !== 0) return;
            firstEl.setAttribute(attr.name, attr.value);
          });
        }

        slot.parentNode.replaceChild(tpl.content, slot);
      })
      .catch(function (err) {
        console.error("[partial] Failed to load", url, err);
        if (slot.parentNode) slot.parentNode.removeChild(slot);
      });
  }

  function loadAll() {
    var slots = document.querySelectorAll("[data-include]");
    if (!slots.length) {
      document.dispatchEvent(new CustomEvent("partials:loaded"));
      return;
    }

    Promise.all(Array.prototype.slice.call(slots).map(loadOne)).then(
      function () {
        document.dispatchEvent(new CustomEvent("partials:loaded"));
      },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAll);
  } else {
    loadAll();
  }
})();
