/**
 * Sets href for .member-login-link → Next.js app /auth/login.
 *
 * Primary deploy: one Next.js app (Root Directory = member-portal) serves both
 * marketing and portal on the same origin — use relative "/auth/login" in HTML
 * or omit this script.
 *
 * Legacy: static HTML-only host (no Next.js). Deploy member-portal separately,
 * then set MEMBER_PORTAL_ORIGIN_PRODUCTION to that deployment’s origin.
 *
 * @see member-portal/README.md
 */
(function () {
  var MEMBER_PORTAL_ORIGIN_PRODUCTION = "";

  function portalOrigin() {
    if (typeof window === "undefined") return "";
    var host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
    var configured = String(MEMBER_PORTAL_ORIGIN_PRODUCTION || "").trim().replace(/\/$/, "");
    return configured;
  }

  function apply() {
    var base = portalOrigin();
    var links = document.querySelectorAll("a.member-login-link");

    if (!base) {
      console.warn(
        "[Living Word Memphis] Member login: set MEMBER_PORTAL_ORIGIN_PRODUCTION in js/portal-nav.js " +
          "when the public site is static-only, or use href=\"/auth/login\" when served from the Next app."
      );
      links.forEach(function (a) {
        a.setAttribute("href", "#");
        a.setAttribute(
          "title",
          "Portal URL not configured — see js/portal-nav.js"
        );
      });
      return;
    }

    var loginUrl = base + "/auth/login";
    links.forEach(function (a) {
      a.setAttribute("href", loginUrl);
      a.removeAttribute("title");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
