(function () {
  "use strict";

  var hasGsap = typeof gsap !== "undefined";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TITLE_PLAIN = "Vibe ";
  var TITLE_ACCENT = "Coding";

  var TERMINAL_LINES = [
    { html: '<span class="vc-syn-k">export const</span> vibe = {' },
    { html: '  stack: [<span class="vc-syn-s">\'Cursor\'</span>, <span class="vc-syn-s">\'Figma\'</span>, <span class="vc-syn-s">\'React\'</span>],' },
    { html: '  workflow: <span class="vc-syn-s">\'design → prompt → scaffold → iterate\'</span>,' },
    { html: '  mode: <span class="vc-syn-s">\'vibe\'</span>,' },
    { html: '  builds: <span class="vc-syn-n">6</span>,' },
    { html: '} <span class="vc-syn-k">as const</span><span class="vc-syn-c">;</span>' },
  ];

  if (hasGsap && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  function renderTitle(title, plainLen, count) {
    if (count <= plainLen) {
      title.textContent = (TITLE_PLAIN + TITLE_ACCENT).slice(0, count);
      return;
    }
    var accentPart = TITLE_ACCENT.slice(0, count - plainLen);
    title.innerHTML =
      TITLE_PLAIN + '<span class="vc-title__accent">' + accentPart + "</span>";
  }

  function finishTitle(title) {
    title.classList.remove("vc-title--typing");
    title.innerHTML =
      TITLE_PLAIN + '<span class="vc-title__accent">' + TITLE_ACCENT + "</span>";
    title.setAttribute("data-vc-typed", "1");
  }

  function charDelay(i, plainLen) {
    if (i === plainLen) return 420;
    if (i === plainLen + 1) return 280;
    return 72 + Math.round(Math.random() * 48);
  }

  function startTitleTypewriter(title) {
    if (!title) return;

    if (reduced) {
      finishTitle(title);
      revealHeroAfterTitle();
      return;
    }

    var fullLen = TITLE_PLAIN.length + TITLE_ACCENT.length;
    var plainLen = TITLE_PLAIN.length;

    title.classList.add("vc-title--typing");
    title.innerHTML = "";
    title.removeAttribute("data-vc-typed");

    var i = 0;

    function type() {
      if (i <= fullLen) {
        renderTitle(title, plainLen, i);
        i++;
        setTimeout(type, charDelay(i - 1, plainLen));
        return;
      }
      finishTitle(title);
      revealHeroAfterTitle();
    }

    type();
  }

  function initHeroTerminal(onComplete) {
    var codeEl = document.getElementById("vc-terminal-code");
    var caretEl = document.getElementById("vc-terminal-caret");
    var terminal = document.querySelector(".vc-terminal");
    if (!codeEl || !terminal) {
      if (onComplete) onComplete();
      return;
    }

    var fullHtml = TERMINAL_LINES.map(function (l) { return l.html; }).join("\n");

    if (reduced) {
      codeEl.innerHTML = fullHtml;
      if (caretEl) caretEl.classList.add("is-hidden");
      gsap.set(terminal, { opacity: 1, y: 0 });
      if (onComplete) onComplete();
      return;
    }

    gsap.to(terminal, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power3.out",
      onComplete: function () {
        var lineIdx = 0;
        if (caretEl) caretEl.classList.add("is-hidden");

        function revealLine() {
          if (lineIdx >= TERMINAL_LINES.length) {
            if (caretEl) caretEl.classList.remove("is-hidden");
            if (onComplete) onComplete();
            return;
          }

          codeEl.innerHTML = TERMINAL_LINES.slice(0, lineIdx + 1)
            .map(function (l) { return l.html; })
            .join("\n");
          lineIdx++;
          setTimeout(revealLine, 180 + Math.random() * 120);
        }

        revealLine();
      },
    });
  }

  function revealHeroAfterTitle() {
    gsap.from(".vc-tagline", {
      opacity: 0,
      y: 16,
      duration: reduced ? 0 : 0.5,
      ease: "power3.out",
    });

    if (!reduced && hasGsap) {
      gsap.to(".vc-hero__stickers", {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.15,
      });

      gsap.from(".vc-sticker", {
        opacity: 0,
        scale: 0.88,
        y: 24,
        duration: 0.65,
        stagger: 0.1,
        ease: "back.out(1.4)",
        delay: 0.2,
      });

      gsap.to(".vc-sticker--s1, .vc-sticker--s3, .vc-sticker--s5", {
        y: -8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
        stagger: 0.35,
      });

      gsap.to(".vc-sticker--s2, .vc-sticker--s4, .vc-sticker--s6", {
        y: -10,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.5,
        stagger: 0.3,
      });
    } else if (hasGsap) {
      gsap.set(".vc-hero__stickers", { opacity: 1 });
      gsap.set(".vc-sticker", { opacity: 1, scale: 1, y: 0 });
    } else {
      var stickers = document.querySelector(".vc-hero__stickers");
      if (stickers) stickers.style.opacity = "1";
    }

    initHeroTerminal(function () {
      gsap.from(".vc-scroll-hint", {
        opacity: 0,
        y: 10,
        duration: 0.4,
        ease: "power3.out",
      });
    });
  }

  function initTitleTypewriter() {
    var title = document.querySelector(".vc-title");
    if (!title) {
      revealHeroAfterTitle();
      return;
    }
    startTitleTypewriter(title);
  }

  function initVideoModal() {
    var modal = document.getElementById("vc-video-modal");
    var player = document.getElementById("vc-video-player");
    var trigger = document.querySelector("[data-vc-video-open]");
    if (!modal || !player || !trigger) return;

    var lastFocus = null;

    function openModal(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      player.currentTime = 0;
      player.play().catch(function () {});
      var closeBtn = modal.querySelector(".vc-video-modal__close");
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      player.pause();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    trigger.addEventListener("click", openModal);

    modal.querySelectorAll("[data-vc-video-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") closeModal();
    });
  }

  function init() {
    var shell = document.querySelector(".vc-shell");
    if (!shell) return;

    initVideoModal();

    if (!hasGsap) {
      revealHeroAfterTitle();
      return;
    }

    if (reduced) {
      gsap.set(
        ".vc-nav, .vc-eyebrow, .vc-title, .vc-tagline, .vc-terminal, .vc-scroll-hint, .vc-hero__stickers, .vc-sticker, .vc-main__head, .vc-card, .vc-stack",
        { opacity: 1, y: 0, clearProps: "transform" }
      );
      var titleEl = document.querySelector(".vc-title");
      if (titleEl) finishTitle(titleEl);
      revealHeroAfterTitle();
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".vc-nav", { opacity: 0, y: -10, duration: 0.5 })
      .from(".vc-eyebrow", { opacity: 0, y: 12, duration: 0.45 }, "-=0.25")
      .from(".vc-title", {
        opacity: 0,
        y: 16,
        duration: 0.45,
        onComplete: initTitleTypewriter,
      }, "-=0.15");

    if (typeof ScrollTrigger !== "undefined") {
      gsap.from(".vc-main__head", {
        opacity: 0,
        y: 24,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".vc-main__head",
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });

      gsap.utils.toArray(".vc-card").forEach(function (card, i) {
        gsap.from(card, {
          opacity: 0,
          y: 32,
          duration: 0.6,
          delay: (i % 3) * 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.from(".vc-stack", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        scrollTrigger: {
          trigger: ".vc-stack",
          start: "top 92%",
          toggleActions: "play none none none",
        },
      });
    }

    document.querySelectorAll(".vc-tool").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        gsap.to(el, { scale: 1.02, duration: 0.2, ease: "power2.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { scale: 1, duration: 0.25, ease: "power2.out" });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
