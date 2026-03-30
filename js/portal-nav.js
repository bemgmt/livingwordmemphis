/**
 * Sets href for .member-login-link → Next.js member portal /auth/login.
 *
 * The marketing site (e.g. livingwordmemphis.vercel.app) is static HTML only.
 * Deploy member-portal/ as a separate Vercel project (Root Directory = member-portal),
 * then set MEMBER_PORTAL_ORIGIN_PRODUCTION below to that deployment’s origin (no trailing slash).
 *
 * @see member-portal/README.md
 */
(function () {
  // e.g. "https://your-member-portal.vercel.app" — must be the Next.js app, not the static site
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
          "to your Next.js portal URL (Vercel project with Root Directory = member-portal). " +
          "The main site origin does not serve /auth/login."
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
