window.Cookie = (function () {
  "use strict";

  const COOKIE_KEY = "cookie-consent";
  const GTM_ID = "GTM-XXXXXXX"; // Replace with your GTM ID

  const cookiePopup = document.getElementById("cookiePopup");
  const acceptBtn = document.getElementById("acceptCookies");
  const rejectBtn = document.getElementById("rejectCookies");

  /**
   * Add GTM Script
   */
  function addGTMScript() {
    // Prevent duplicate script
    if (document.getElementById("gtm-script")) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "gtm.js",
      "gtm.start": new Date().getTime(),
    });

    // GTM Script
    const script = document.createElement("script");

    script.id = "gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    document.head.appendChild(script);

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
  }

  /**
   * Remove GTM Script
   */
  function removeGTMScript() {
    const gtmScript = document.getElementById("gtm-script");
    const gtmNoScript = document.getElementById("gtm-noscript");

    if (gtmScript) {
      gtmScript.remove();
    }

    if (gtmNoScript) {
      gtmNoScript.remove();
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
    console.log("Cookies Accepted");
    addGTMScript();

    hidePopup();
  }

  /**
   * Reject Cookies
   */
  function rejectCookies() {
    localStorage.setItem(COOKIE_KEY, "rejected");

    removeGTMScript();

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
        addGTMScript();
      }

      if (consent === "rejected") {
        removeGTMScript();
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
