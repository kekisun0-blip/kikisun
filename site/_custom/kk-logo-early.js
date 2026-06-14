(function () {
  "use strict";

  var FOOTER_LOGO = "/_custom/logos/kk-portfolio-logo.svg?v=kk5";
  var HERO_LEFT = "/_custom/logos/kk-portfolio-logo-left.svg?v=kk2";
  var HERO_RIGHT = "/_custom/logos/kk-portfolio-logo-right.svg?v=kk2";
  var LEGACY_MARKERS = [
    "607b2d562261e395e26c1c2761fb81d7ea436dde",
    "ba99bb76c42f48d5764d167f926c3d614019efb7",
    "2ae885f81a06711c6c769e9480a797a1ab960db5",
    "d4acfed6532b37a66ed5652f23dbddf9a3a61d25",
  ];
  var SEL_LEFT = ".css-c271ib";
  var SEL_RIGHT = ".css-1hsi05";
  var SEL_FOOTER = ".css-3vz25c";

  function isLegacyLogoImg(img) {
    if (!img || img.tagName !== "IMG") return false;
    if (img.getAttribute("data-kk-hero-logo")) return true;
    if (img.getAttribute("data-kk-footer-logo") === "1") return true;
    var src = String(img.getAttribute("src") || img.src || "");
    if (src.indexOf("kk-portfolio-logo") >= 0) return true;
    if (LEGACY_MARKERS.some(function (m) { return src.indexOf(m) >= 0; })) return true;
    return !!(img.closest(SEL_LEFT) || img.closest(SEL_RIGHT) || img.closest(SEL_FOOTER));
  }

  function isAlreadyPatched(img) {
    if (img.closest(SEL_LEFT)) {
      return (
        img.getAttribute("data-kk-hero-logo") === "left" &&
        String(img.getAttribute("src") || "").indexOf("kk-portfolio-logo-left") >= 0
      );
    }
    if (img.closest(SEL_RIGHT)) {
      return (
        img.getAttribute("data-kk-hero-logo") === "right" &&
        String(img.getAttribute("src") || "").indexOf("kk-portfolio-logo-right") >= 0
      );
    }
    if (img.closest(SEL_FOOTER)) {
      return (
        img.getAttribute("data-kk-footer-logo") === "1" &&
        String(img.getAttribute("src") || "").indexOf("kk-portfolio-logo.svg") >= 0
      );
    }
    return false;
  }

  function patchImg(img) {
    if (!isLegacyLogoImg(img) || isAlreadyPatched(img)) return;

    img.removeAttribute("loading");
    img.setAttribute("alt", "");

    if (img.closest(SEL_LEFT)) {
      if (String(img.getAttribute("src") || "").indexOf(HERO_LEFT) < 0) {
        img.setAttribute("src", HERO_LEFT);
      }
      img.setAttribute("data-kk-hero-logo", "left");
      return;
    }
    if (img.closest(SEL_RIGHT)) {
      if (String(img.getAttribute("src") || "").indexOf(HERO_RIGHT) < 0) {
        img.setAttribute("src", HERO_RIGHT);
      }
      img.setAttribute("data-kk-hero-logo", "right");
      return;
    }
    if (img.closest(SEL_FOOTER)) {
      if (String(img.getAttribute("src") || "").indexOf(FOOTER_LOGO) < 0) {
        img.setAttribute("src", FOOTER_LOGO);
      }
      img.setAttribute("data-kk-footer-logo", "1");
    }
  }

  var scanning = false;
  function scan(root) {
    if (scanning) return;
    scanning = true;
    try {
      (root || document).querySelectorAll("img").forEach(patchImg);
    } finally {
      scanning = false;
    }
  }

  scan(document);
  new MutationObserver(function () { scan(document); }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { scan(document); });
  }
})();
