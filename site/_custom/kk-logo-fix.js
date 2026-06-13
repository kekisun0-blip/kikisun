(function () {
  "use strict";

  var FOOTER_LOGO_SRC = "/_custom/logos/kk-portfolio-logo.svg?v=kk5";
  var HERO_LEFT_SRC = "/_custom/logos/kk-portfolio-logo-left.svg?v=kk1";
  var HERO_RIGHT_SRC = "/_custom/logos/kk-portfolio-logo-right.svg?v=kk1";
  var LEGACY_MARKERS = [
    "607b2d562261e395e26c1c2761fb81d7ea436dde",
    "ba99bb76c42f48d5764d167f926c3d614019efb7",
    "2ae885f81a06711c6c769e9480a797a1ab960db5",
    "d4acfed6532b37a66ed5652f23dbddf9a3a61d25",
  ];
  var HERO_LEFT = ".css-c271ib";
  var HERO_RIGHT = ".css-1hsi05";
  var FOOTER = ".css-3vz25c";

  function isKkLogoImg(img) {
    if (!img || img.tagName !== "IMG") return false;
    var src = String(img.getAttribute("src") || img.src || "");
    if (LEGACY_MARKERS.some(function (m) { return src.indexOf(m) >= 0; })) return true;
    if (src.indexOf("kk-portfolio-logo") >= 0) return true;
    if (src.indexOf("sticker-kk-logo") >= 0) return true;
    return !!(img.closest(HERO_LEFT) || img.closest(HERO_RIGHT) || img.closest(FOOTER));
  }

  function playHeroEntrance(slot, side) {
    if (!slot || slot.getAttribute("data-kk-hero-animated")) return;
    slot.setAttribute("data-kk-hero-animated", side);
    slot.style.removeProperty("opacity");
    slot.style.removeProperty("transform");
    slot.style.removeProperty("transition");
  }

  function patchHeroImg(img, side) {
    var targetSrc = side === "left" ? HERO_LEFT_SRC : HERO_RIGHT_SRC;
    var already = img.getAttribute("data-kk-hero-logo") === side;
    var src = String(img.getAttribute("src") || "");
    var needsSrc = src.indexOf(targetSrc) < 0;
    if (already && !needsSrc) return;

    img.setAttribute("data-kk-hero-logo", side);
    img.removeAttribute("loading");
    img.setAttribute("alt", "");
    if (needsSrc) img.setAttribute("src", targetSrc);

    var slot = img.closest(side === "left" ? HERO_LEFT : HERO_RIGHT);
    if (slot && !slot.getAttribute("data-kk-hero-animated")) {
      playHeroEntrance(slot, side);
    }
  }

  function patchFooterImg(img) {
    if (img.getAttribute("data-kk-footer-logo") === "1") return;

    img.setAttribute("data-kk-footer-logo", "1");
    img.removeAttribute("loading");
    img.style.opacity = "1";
    img.style.visibility = "visible";
    img.style.display = "block";

    var src = String(img.getAttribute("src") || "");
    if (src.indexOf("kk-portfolio-logo.svg?v=kk5") < 0) {
      img.setAttribute("src", FOOTER_LOGO_SRC);
    }
  }

  function patchImg(img) {
    if (!isKkLogoImg(img)) return;
    if (img.closest(HERO_LEFT)) {
      patchHeroImg(img, "left");
      return;
    }
    if (img.closest(HERO_RIGHT)) {
      patchHeroImg(img, "right");
      return;
    }
    patchFooterImg(img);
  }

  function scan(root) {
    (root || document).querySelectorAll("img").forEach(patchImg);
  }

  function boot() {
    scan(document);
    var obs = new MutationObserver(function () { scan(document); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [120, 600, 1500, 3200].forEach(function (delay) {
      setTimeout(function () { scan(document); }, delay);
    });
  }

  boot();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  }
  window.addEventListener("load", boot);
})();
