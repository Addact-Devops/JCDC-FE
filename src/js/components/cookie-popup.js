window.Cookie = (function () {
  "use strict";

  const COOKIE_KEY = "cookie-consent";

  // GTM + GA IDs
  const GTM_ID = "GT-KVHNW3Z";
  const GA_ID = "G-0QML6HX9W8"; // Replace with your Google Analytics ID

  const cookiePopup = document.getElementById("cookiePopup");
  const acceptBtn = document.getElementById("acceptCookies");
  const rejectBtn = document.getElementById("rejectCookies");

  /**
   * Add GTM + GA Scripts
   */
  function addTrackingScripts() {
    // Prevent duplicate scripts
    if (document.getElementById("gtm-script")) return;

    /**
     * GTM
     */
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: "gtm.js",
      "gtm.start": new Date().getTime(),
    });

    const gtmScript = document.createElement("script");

    gtmScript.id = "gtm-script";
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    document.head.appendChild(gtmScript);

    // GTM NoScript
    const noscript = document.createElement("noscript");

    noscript.id = "gtm-noscript";
    noscript.innerHTML = `
      <iframe
        src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
        height="0"
        width="0"
        style="display:none;visibility:hidden"
      ></iframe>
    `;

    document.body.appendChild(noscript);

    /**
     * Google Analytics
     */
    const gaScript = document.createElement("script");

    gaScript.id = "ga-script";
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

    document.head.appendChild(gaScript);

    const gaInlineScript = document.createElement("script");

    gaInlineScript.id = "ga-inline-script";

    gaInlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }

      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;

    document.head.appendChild(gaInlineScript);
  }

  /**
   * Remove GTM + GA Scripts
   */
  function removeTrackingScripts() {
    const gtmScript = document.getElementById("gtm-script");
    const gtmNoScript = document.getElementById("gtm-noscript");
    const gaScript = document.getElementById("ga-script");
    const gaInlineScript = document.getElementById("ga-inline-script");

    if (gtmScript) {
      gtmScript.remove();
    }

    if (gtmNoScript) {
      gtmNoScript.remove();
    }

    if (gaScript) {
      gaScript.remove();
    }

    if (gaInlineScript) {
      gaInlineScript.remove();
    }

    window.dataLayer = [];
  }

  /**
   * Hide Popup
   */
  function hidePopup() {
    if (cookiePopup) {
      cookiePopup.style.display = "none";
    }
  }

  /**
   * Show Popup
   */
  function showPopup() {
    if (cookiePopup) {
      cookiePopup.style.display = "block";
    }
  }

  /**
   * Accept Cookies
   */
  function acceptCookies() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    addTrackingScripts();

    hidePopup();
  }

  /**
   * Reject Cookies
   */
  function rejectCookies() {
    localStorage.setItem(COOKIE_KEY, "rejected");

    removeTrackingScripts();

    hidePopup();
  }

  /**
   * Initialize
   */
  function init() {
    const consent = localStorage.getItem(COOKIE_KEY);

    // First Time User
    if (!consent) {
      showPopup();
    } else {
      hidePopup();

      if (consent === "accepted") {
        addTrackingScripts();
      }

      if (consent === "rejected") {
        removeTrackingScripts();
      }
    }

    // Events
    if (acceptBtn) {
      acceptBtn.addEventListener("click", acceptCookies);
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", rejectCookies);
    }
  }

  return {
    init,
    acceptCookies,
    rejectCookies,
  };
})();

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  window.Cookie.init();
});
