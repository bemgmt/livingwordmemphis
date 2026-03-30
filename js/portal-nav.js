/**
 * Sets href for .member-login-link → Next.js member portal /auth/login.
 * Override MEMBER_PORTAL_ORIGIN below if your portal is on a different host.
 */
(function () {
  var MEMBER_PORTAL_ORIGIN =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? "http://localhost:3000"
      : "https://livingwordmemphis.vercel.app";

  function apply() {
    var base = MEMBER_PORTAL_ORIGIN.replace(/\/$/, "");
    var loginUrl = base + "/auth/login";
    document.querySelectorAll("a.member-login-link").forEach(function (a) {
      a.setAttribute("href", loginUrl);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
