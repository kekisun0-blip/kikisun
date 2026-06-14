(function () {
  "use strict";

  var KK_LOGO = "/_custom/logos/kk-portfolio-logo.svg?v=kk5";
  var LEGACY_MARKERS = [
    "607b2d562261e395e26c1c2761fb81d7ea436dde",
    "ba99bb76c42f48d5764d167f926c3d614019efb7",
    "2ae885f81a06711c6c769e9480a797a1ab960db5",
    "d4acfed6532b37a66ed5652f23dbddf9a3a61d25",
  ];
  var HERO_LEFT = ".css-c271ib";
  var HERO_RIGHT = ".css-1hsi05";
  var FOOTER = ".css-3vz25c";

  function isLegacyLogoImg(img) {
    if (!img || img.tagName !== "IMG") return false;
    if (img.getAttribute("data-kk-hero-logo") === "left") return true;
    if (img.getAttribute("data-kk-footer-logo") === "1") return true;
    var src = String(img.getAttribute("src") || img.src || "");
    if (src.indexOf("kk-portfolio-logo") >= 0) return true;
    if (LEGACY_MARKERS.some(function (m) { return src.indexOf(m) >= 0; })) return true;
    return !!(img.closest(HERO_LEFT) || img.closest(HERO_RIGHT) || img.closest(FOOTER));
  }

  function hideHeroRightSlots(root) {
    (root || document).querySelectorAll(HERO_RIGHT).forEach(function (slot) {
      slot.style.setProperty("display", "none", "important");
      slot.setAttribute("data-kk-hero-hidden", "1");
    });
  }

  function patchImg(img) {
    if (!isLegacyLogoImg(img)) return;

    if (img.closest(HERO_RIGHT)) {
      hideHeroRightSlots(img.ownerDocument || document);
      return;
    }

    var inHero = !!img.closest(HERO_LEFT);
    var inFooter = !!img.closest(FOOTER);
    if (!inHero && !inFooter) return;

    var src = String(img.getAttribute("src") || "");
    if (src.indexOf("kk-portfolio-logo.svg?v=kk5") < 0) {
      img.setAttribute("src", KK_LOGO);
    }
    img.removeAttribute("loading");
    img.setAttribute("alt", "");

    if (inHero) {
      img.setAttribute("data-kk-hero-logo", "left");
      var row = img.closest(".css-mtcgbd");
      if (row) row.setAttribute("data-kk-hero-row", "1");
    }
    if (inFooter) img.setAttribute("data-kk-footer-logo", "1");
  }

  function scan(root) {
    hideHeroRightSlots(root);
    (root || document).querySelectorAll("img").forEach(patchImg);
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
