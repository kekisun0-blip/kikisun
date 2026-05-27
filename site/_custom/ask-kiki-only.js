/**
 * Ask Kiki — chat widget + CV download + bilingual EN/中文 site switching
 * ⚠️ NO layout overrides — only text replacement & language toggle button
 */
(function () {
  "use strict";

  /* ─── Force-default to English on every page load ───
     Language preference is intentionally NOT persisted across reloads.
     User can still switch to 中文 during the session; next visit starts EN again. */
  var SITE_LANG_KEY = "kiki_site_lang";
  try {
    localStorage.removeItem(SITE_LANG_KEY);
  } catch (e) {}
  document.documentElement.setAttribute("data-kiki-site-lang", "en");

  /* ─── constants ─── */
  var STORAGE_KEY = "kiki_chat_messages";
  var KIKI_AVATAR_SRC = "/_custom/kiki-avatar.png?v=2";
  var KIKI_CV_SRC = "/_custom/cv-keyue-sun.pdf?v=1";
  var KIKI_CV_DOWNLOAD_NAME = "CV-Keyue-SUN.pdf";

  var ZH_HERO_FULL =
    "你好！我是 Kiki Sun（孙可月），一名专注于 AI 驱动体验设计与深度商业用户研究的高级 UX 设计师 & 商业分析师。";

  function normalizeMatchText(s) {
    return String(s || "")
      .replace(/\u00a0/g, " ")
      .replace(/\u200b/g, "")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function escapeRegExp(s) {
    return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildLooseReplaceRegExp(from) {
    var clean = String(from || "").replace(/\u00a0/g, " ").replace(/\u200b/g, "").trim();
    var pattern = clean
      .split(/\s+/)
      .map(function (seg) { return escapeRegExp(seg); })
      .join("\\s+");
    pattern = pattern
      .replace(/\\-/g, "[\\-–—]")
      .replace(/\\:/g, ":\\s*")
      .replace(/\\,/g, ",\\s*")
      .replace(/\\;/g, ";\\s*");
    return new RegExp(pattern, "gi");
  }

  /* ─── Site-wide translation dictionary (EN → 中文), longest-first ─── */
  var SITE_REPLACE_ZH = (function () {
    var raw = [
      [
        "Experience design is a critical component of business success. Professional experience designers dedicate themselves to solving unseen pain points. I'm Kiki Sun, a complex problem-solver specializing in identifying issues through rigorous user research and addressing emotional experience challenges with rational thinking. My expertise in the consumer goods sector has revolutionized user experience and operational efficiency for digital innovation projects I've led.",
        "体验设计是商业成功中至关重要的一环。专业的体验设计师会持续挖掘那些容易被忽视的痛点。我是 Kiki Sun（孙可月），一名擅长拆解复杂问题的设计师：用扎实的用户研究定位问题，并用理性、系统化的方法回应体验中的情绪与设计张力。在消费品等领域积累的实践经验，帮助我在主导的数字化创新项目中同时提升用户体验与运营效率。",
      ],
      ["Connect with me to talk more about your project.", "欢迎联系我，聊聊你的项目。"],
      ["Software-Hardware Integrated Management System", "软硬件一体化管理系统"],
      ["Machine Management", "设备管理"],
      ["Physical Product", "实体产品"],
      ["Game Data Visualization", "游戏数据可视化"],
      ["Global Supply Chain", "全球供应链"],
      ["UX/UI Designer at LEE  KUM KEE", "李锦记 UX/UI 设计师"],
      ["UX/UI Designer at LEE KUM KEE", "李锦记 UX/UI 设计师"],
      ["UX/UI Designer at DECATHLON", "迪卡侬 UX/UI 设计师"],
      ["2024.5-2025.6    Shanghai, CN", "2024.5–2025.6  上海，中国"],
      ["2024.5-2025.6 Shanghai, CN", "2024.5–2025.6  上海，中国"],
      ["Status: Launched", "状态：已上线"],
      ["UX Lead of Lee Kum Kee' s Global Digital Innovation Team", "李锦记全球数字化创新团队 UX 负责人"],
      ["Overseeing end-to-end experience design and implementation for Data Innovation projects, including experience architecture design, platform component system design, platform-level integration SOPs, third-party product integration, and next-generation experience concept design (POV/POC/implementation).", "负责数据创新项目的端到端体验设计与落地，包括体验架构设计、平台组件系统设计、平台级集成 SOP、第三方产品接入，以及下一代体验概念设计（POV/POC/落地）。"],
      ["Role: UI/UX Designer & PO", "角色：UI/UX 设计师兼 PO"],
      ["Duration: 2024.5- 2025.6", "时间：2024.5–2025.6"],
      ["A cross-cultural study on user experience design in mobile banking", "移动银行用户体验设计的跨文化研究"],
      ["University of York Role: User Researcher Duration: 2022.1-2022.3 Tools: SPSS, Excel", "约克大学 角色：用户研究员 时间：2022.1–2022.3 工具：SPSS、Excel"],
      ["University of York", "约克大学"],
      ["Role: User Researcher", "角色：用户研究员"],
      ["Tools: SPSS, Excel", "工具：SPSS、Excel"],
      ["Digital Transformation Decathlon supply chain automation platform system (DPCP) Responsible for the design of Decathlon’s global Value Chain collaboration system DPCP from 0 to 1, serving 3,000 supply chain users and external suppliers around the world.", "数字化转型——迪卡侬供应链自动化平台系统（DPCP）。负责迪卡侬全球价值链协同系统 DPCP 从 0 到 1 的体验设计，服务全球 3000+ 供应链用户与外部供应商。"],
      ["With the development of mobile banking, User Interface (UI) and User Experience (UX) design of mobile banking have their own uniqueness according to the different user requirements in Chinese and British cultural backgrounds. This study investigates the influence of cultural differences between China and the UK on UX design of mobile banking, taking Lloyds Bank and Bank of China mobile banking as examples.", "随着移动银行的发展，在中英不同文化背景下，移动银行的用户界面（UI）与用户体验（UX）设计呈现出各自特点。本研究以 Lloyds Bank 与中国银行移动端为例，探究中英文化差异对移动银行 UX 设计的影响。"],
      ["The emergence of smart mobile devices makes mobile banking get great development, but Different Cultural Backgrounds make mobile banking in China and the UK present their own Uniqueness in UI and UX. These differences further stimulate interest in exploration and research.", "智能移动设备的普及推动了移动银行快速发展；与此同时，不同文化背景也使中英移动银行在 UI 与 UX 上呈现出各自独特性，并进一步激发了相关探索与研究。"],
      ["The purpose of this study is to explore and study Different user requirements and UI and UX design differences of Mobile banking in the cultural background of China and the UK.", "本研究旨在探索中英文化背景下，移动银行在用户需求以及 UI/UX 设计上的差异。"],
      ["Call out a feature, benefit, or value that can stand on its own.", "可突出一个能独立成立的功能亮点、收益或价值点。"],
      ["Client: Weavr 🇬🇧 Role: UI/UX Researcher Duration: 2022.1- 2022.10 Status: Launched", "客户：Weavr 🇬🇧 角色：UI/UX 研究员 时间：2022.1–2022.10 状态：已上线"],
      ["Weavr is creating cross-reality viewing experiences allowing fans to immerse themselves in high fidelity statistics, visualisations and data-driven stories that give them deep insights into live matches across esports and sports.", "Weavr 正在打造跨现实观赛体验，让观众沉浸在高保真统计、可视化和数据叙事中，从而对电竞与体育赛事直播获得更深入洞察。"],
      ["Shanghai, China", "中国上海"],
      ["Shanghai, CN", "上海，中国"],
      ["4 years as an Experience Designer", "4年体验设计经验"],
      ["2 years Managing Startup Teams", "2年创业团队管理经验"],
      ["To help products harness emerging technologies in pioneering experience revolutions.", "帮助产品驾驭新兴技术，引领体验革新。"],
      ["The conviction that idealistic designers can reshape our world.", "理想主义的设计师，能够重塑我们的世界。"],
      ["What drives me forward:", "驱动我前行的信念："],
      ["My mission:", "我的使命："],
      ["UI/UX Designer &amp; PO", "UI/UX 设计师兼 PO"],
      ["UI/UX Designer & PO", "UI/UX 设计师兼 PO"],
      ["AI Business Analysis", "AI 商业分析"],
      ["Digital Product Designer", "数字产品设计师"],
      ["UI/UX Design Intern", "UI/UX 实习设计师"],
      ["UI/UX Researcher", "UI/UX 研究员"],
      ["User Research", "用户研究"],
      ["See Project  →", "查看项目 →"],
      ["See Project →", "查看项目 →"],
      ["See Project→", "查看项目→"],
      ["About Me", "关于我"],
      ["kiki Portfolio k", "Kiki 作品集"],
      ["kiki Portfolio", "Kiki 作品集"],
      ["Connect with me", "联系我"],
      ["Resume ", "简历 "],
      ["Go Back", "返回"],
      ["Overview", "概览"],
      ["Process", "过程"],
      ["Outcome", "成果"],
      ["Outcomes", "成果"],
      ["Highlights", "亮点"],
      ["Duration:", "时间："],
      ["Client:", "客户："],
      ["Role:", "角色："],
      [" NOW", " 至今"],
      ["- NOW", "- 至今"],
      ["See more", "了解更多"],
      ["My work", "我的作品"],
      ["About", "关于"],
      ["ToC", "消费端"],
      ["ToB", "企业端"],
      ["BASE", "坐标"],
      ["CONTACT", "联系"],
      ["SOCIAL", "社交"],
      ["Redbook", "小红书"],
      ["LinkedIn", "领英"],
      ["Business Analyst", "商业分析师"],
      ["Senior UX/UI Designer", "高级 UX/UI 设计师"],
      ["Call to action →", "查看项目 →"],
    ];
    raw.sort(function (a, b) { return b[0].length - a[0].length; });
    return raw;
  })();
  var SITE_REPLACE_ZH_LOOSE = SITE_REPLACE_ZH.map(function (pair) {
    return {
      fromNorm: normalizeMatchText(pair[0]),
      re: buildLooseReplaceRegExp(pair[0]),
      to: pair[1],
    };
  });

  /* ─── Site language helpers ─── */
  function getSiteLang() {
    try {
      var v = (localStorage.getItem(SITE_LANG_KEY) || "en").toLowerCase();
      return v === "zh" ? "zh" : "en";
    } catch (e) { return "en"; }
  }

  function setSiteLangAttr(lang) {
    lang = lang === "zh" ? "zh" : "en";
    document.documentElement.setAttribute("data-kiki-site-lang", lang);
    document.querySelectorAll(".kiki-site-lang-switch").forEach(function (sw) {
      sw.setAttribute("data-active", lang);
      sw.querySelectorAll("[data-kiki-site-lang]").forEach(function (btn) {
        var active = btn.getAttribute("data-kiki-site-lang") === lang;
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.classList.toggle("kiki-chat-lang-switch__btn--active", active);
      });
    });
  }

  function setSiteLang(lang) {
    lang = lang === "zh" ? "zh" : "en";
    try { localStorage.setItem(SITE_LANG_KEY, lang); } catch (e) {}
    setSiteLangAttr(lang);
  }

  var __langSwitchInProgress = false;

  function beginInstantLangSwitch() {
    __langSwitchInProgress = true;
    document.documentElement.classList.add("kiki-lang-instant");
  }

  function endInstantLangSwitch() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("kiki-lang-instant");
        __langSwitchInProgress = false;
      });
    });
  }

  function rememberTextNodeOriginal(tn) {
    if (!tn || tn.__kikiOrigEn != null) return;
    tn.__kikiOrigEn = tn.nodeValue;
  }

  function restoreSiteTranslations() {
    var root = document.getElementById("container");
    if (!root) return;
    walkTextNodes(root, function (tn) {
      if (tn.__kikiOrigEn == null) return;
      tn.nodeValue = tn.__kikiOrigEn;
      delete tn.__kikiOrigEn;
    });
  }

  function disconnectZhDomObserver() {
    clearTimeout(__zhMoTimer);
    if (__zhMo) {
      __zhMo.disconnect();
      __zhMo = null;
    }
  }

  function preserveScrollWhile(fn) {
    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    try {
      if (typeof fn === "function") fn();
    } finally {
      window.scrollTo(scrollX, scrollY);
    }
  }

  function freezeHomepageMotionForLangSwitch() {
    var container = document.getElementById("container");
    if (!container) return;
    container.querySelectorAll(".kiki-proj-card-fx").forEach(function (card) {
      card.classList.add("kiki-card-in");
    });
  }

  function applySiteLang(lang) {
    lang = lang === "zh" ? "zh" : "en";
    clearProjectNavFallback();
    beginInstantLangSwitch();
    if (lang === "zh") {
      applySiteTranslations();
      freezeHomepageMotionForLangSwitch();
      ensureZhDomObserver();
      preserveScrollWhile(function () {
        try { buildProjectToc(); } catch (e) {}
      });
      endInstantLangSwitch();
      return;
    }
    disconnectZhDomObserver();
    restoreSiteTranslations();
    preserveScrollWhile(function () {
      try { buildProjectToc(); } catch (e2) {}
    });
    endInstantLangSwitch();
  }

  function clearProjectNavFallback() {
    clearTimeout(__pageTxFallbackTimer);
    __pageTxFallbackTimer = null;
  }

  function isSiteChromeClick(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      ".kiki-site-lang-switch, #kiki-chat-root, #kiki-page-transition, .kiki-chat-panel, #kiki-toc, [data-kiki-nav-row], nav, header"
    );
  }

  /* ─── Document-level language switch (capture, before project-nav hooks) ─── */
  document.addEventListener("pointerdown", function (e) {
    if (!isSiteChromeClick(e.target)) return;
    clearProjectNavFallback();
    e.stopPropagation();
  }, true);
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var sw = t.closest(".kiki-site-lang-switch");
    if (!sw) return;
    clearProjectNavFallback();
    e.preventDefault();
    e.stopPropagation();
    var btn = t.closest("button[data-kiki-site-lang]");
    var next = btn ? btn.getAttribute("data-kiki-site-lang") : null;
    if (next !== "en" && next !== "zh") {
      next = getSiteLang() === "zh" ? "en" : "zh";
    }
    if (getSiteLang() === next) return;
    setSiteLang(next);
    applySiteLang(next);
  }, true);

  /* ─── Text walker ─── */
  function shouldSkip(node) {
    if (!node || !node.closest) return true;
    if (node.closest("#kiki-chat-root")) return true;
    if (node.closest(".kiki-hero-wrap")) return true;
    return false;
  }

  function walkTextNodes(root, fn) {
    var child = root.firstChild;
    while (child) {
      var next = child.nextSibling;
      if (child.nodeType === 3) {
        if (child.nodeValue && !shouldSkip(child.parentElement)) fn(child);
      } else if (child.nodeType === 1) {
        var tag = (child.tagName || "").toUpperCase();
        if (tag !== "SCRIPT" && tag !== "STYLE" && tag !== "NOSCRIPT") walkTextNodes(child, fn);
      }
      child = next;
    }
  }

  var __applyingZh = false;
  function applySiteTranslations() {
    if (getSiteLang() !== "zh") return;
    if (__applyingZh) return;
    __applyingZh = true;
    try {
      var root = document.getElementById("container");
      if (!root) return;

      /* hero paragraph */
      walkTextNodes(root, function (tn) {
        var t = tn.nodeValue || "";
        if (t.indexOf("Hi! I'm Kiki Sun") >= 0 || t.indexOf("Hi! I am Kiki Sun") >= 0) {
          rememberTextNodeOriginal(tn);
          tn.nodeValue = ZH_HERO_FULL;
        }
      });

      /* about long paragraph + general replacements */
      walkTextNodes(root, function (tn) {
        var t = tn.nodeValue;
        if (!t || !/\S/.test(t)) return;
        var next = t.replace(/\u00a0/g, " ").replace(/\u200b/g, "");
        if (next.indexOf("Experience design is a critical component of business success") >= 0) {
          rememberTextNodeOriginal(tn);
          tn.nodeValue =
            "体验设计是商业成功中至关重要的一环。专业的体验设计师会持续挖掘那些容易被忽视的痛点。我是 Kiki Sun（孙可月），一名擅长拆解复杂问题的设计师：用扎实的用户研究定位问题，并用理性、系统化的方法回应体验中的情绪与设计张力。在消费品等领域积累的实践经验，帮助我在主导的数字化创新项目中同时提升用户体验与运营效率。";
          return;
        }
        for (var i = 0; i < SITE_REPLACE_ZH.length; i++) {
          var from = SITE_REPLACE_ZH[i][0];
          var to   = SITE_REPLACE_ZH[i][1];
          if (from && next.indexOf(from) >= 0) next = next.split(from).join(to);
        }
        var normalizedNext = normalizeMatchText(next);
        for (var j = 0; j < SITE_REPLACE_ZH_LOOSE.length; j++) {
          var item = SITE_REPLACE_ZH_LOOSE[j];
          if (item.fromNorm && normalizedNext.indexOf(item.fromNorm) >= 0) {
            next = next.replace(item.re, item.to);
            normalizedNext = normalizeMatchText(next);
          }
        }
        if (next !== t) {
          rememberTextNodeOriginal(tn);
          tn.nodeValue = next;
        }
      });

      /* "Experience" standalone label → 项目经历 */
      walkTextNodes(root, function (tn) {
        var t = tn.nodeValue;
        if (!t) return;
        if (t.replace(/\u200b/g, "").trim() === "Experience") {
          rememberTextNodeOriginal(tn);
          tn.nodeValue = "项目经历";
        }
      });
    } finally {
      __applyingZh = false;
    }
  }

  /* MutationObserver to catch dynamically-loaded content */
  var __zhMo = null, __zhMoTimer = null;
  function ensureZhDomObserver() {
    if (getSiteLang() !== "zh") return;
    var root = document.getElementById("container");
    if (!root) return;
    if (__zhMo) { __zhMo.disconnect(); __zhMo = null; }
    __zhMo = new MutationObserver(function () {
      clearTimeout(__zhMoTimer);
      __zhMoTimer = setTimeout(function () {
        if (getSiteLang() === "zh") applySiteTranslations();
      }, 150);
    });
    __zhMo.observe(root, { childList: true, subtree: true, characterData: true });
  }

  /* ─── Site nav detection: robust for homepage + project pages ─── */
  function navLinkMatchesLabel(txt, type) {
    txt = (txt || "").trim();
    if (!txt) return false;
    if (type === "about") return /^(about|关于)$/i.test(txt);
    if (type === "resume") return /^(resume|简历)$/i.test(txt);
    if (type === "portfolio") {
      return /\bkiki\s*portfolio\b/i.test(txt) || /^portfolio$/i.test(txt) || /作品集/.test(txt);
    }
    return false;
  }

  function scoreNavRowCandidate(row) {
    if (!row || row.nodeType !== 1) return -1;
    if (row.closest("#kiki-chat-root")) return -1;
    if (row.querySelector(".kiki-chat-trigger, .kiki-chat-panel")) return -1;
    var rect = row.getBoundingClientRect();
    var isProj = /^\/project(-\d+)?$/.test(location.pathname || "");
    // Project pages may have wider or differently-positioned nav bars
    var maxTop = isProj ? 300 : 180;
    var minW = isProj ? 0.25 : 0.4;
    if (rect.width < window.innerWidth * minW) return -1;
    if (rect.height < 26 || rect.height > 200) return -1;
    if (rect.top < -40 || rect.top > maxTop) return -1;
    var style = window.getComputedStyle(row);
    var disp = style.display || "";
    if (!disp || disp === "none" || disp === "inline") return -1;

    var links = Array.from(row.querySelectorAll("a, [role='link']"));
    if (!links.length) return -1;
    if (links.length > 80) return -1;
    var score = 0;
    var hasAbout = false;
    var hasResume = false;
    var hasPortfolio = false;
    for (var i = 0; i < links.length; i++) {
      var t = (links[i].innerText || links[i].textContent || "").trim();
      if (!t) continue;
      if (navLinkMatchesLabel(t, "about")) { hasAbout = true; score += 10; }
      if (navLinkMatchesLabel(t, "resume")) { hasResume = true; score += 10; }
      if (navLinkMatchesLabel(t, "portfolio")) { hasPortfolio = true; score += 14; }
      if (t === "go back" || t === "← back") score -= 2;
    }
    if (!hasPortfolio) return -1;
    if (!hasAbout || !hasResume) {
      // Project / inner page: brand-only nav row is still primary.
      score += 18;
    } else {
      score += 28;
    }
    score += 20;
    score += Math.min(links.length, 8);
    if (links.length > 18) score -= 20;
    score += Math.max(0, Math.round((window.innerWidth - Math.abs(rect.width - window.innerWidth)) / 220));
    score += Math.max(0, 8 - Math.round(Math.max(0, rect.top) / 18));
    return score;
  }

  function collectNavRows() {
    var container = document.getElementById("container");
    if (!container) return [];
    var candidates = [];
    var seen = new Set();
    var pushCandidate = function (row) {
      if (!row || seen.has(row)) return;
      seen.add(row);
      var score = scoreNavRowCandidate(row);
      if (score >= 0) candidates.push({ el: row, score: score });
    };

    Array.from(container.querySelectorAll(".css-s4tvbx, .kiki-nav-row, nav, header")).forEach(pushCandidate);
    Array.from(container.querySelectorAll(".kiki-site-lang-switch")).forEach(function (sw) {
      var owner = sw.closest(".css-s4tvbx, .kiki-nav-row, nav, header");
      if (owner) pushCandidate(owner);
    });
    if (!candidates.length) Array.from(container.querySelectorAll(".css-s4tvbx, nav, header, [role='navigation']")).forEach(pushCandidate);

    candidates.sort(function (a, b) { return b.score - a.score; });
    var rows = candidates.slice(0, 3).map(function (item) { return item.el; });
    rows.forEach(function (row) {
      row.classList.add("kiki-nav-row");
      row.setAttribute("data-kiki-nav-row", "1");
    });
    return rows;
  }

  function isElementVisibleForLangSwitch(el) {
    if (!el || el.nodeType !== 1) return false;
    var style = window.getComputedStyle(el);
    if (!style) return false;
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity || "1") === 0) {
      return false;
    }
    var rect = el.getBoundingClientRect();
    if (!rect || rect.width < 24 || rect.height < 18) return false;
    if (rect.bottom < 0 || rect.top > window.innerHeight + 24) return false;
    return true;
  }

  function pickPrimaryNavRow(rows) {
    if (!rows || !rows.length) return null;
    var best = null;
    rows.forEach(function (row) {
      var score = scoreNavRowCandidate(row);
      if (score < 0) return;
      if (!isElementVisibleForLangSwitch(row)) score -= 80;
      if (/^(HEADER|NAV)$/i.test(row.tagName || "")) score += 10;
      if (!/^(HEADER|NAV)$/i.test(row.tagName || "")) {
        var hasInnerHeaderNav = Array.from(row.children || []).some(function (child) {
          var tag = (child.tagName || "").toUpperCase();
          if (tag !== "HEADER" && tag !== "NAV") return false;
          return scoreNavRowCandidate(child) >= 0 && isElementVisibleForLangSwitch(child);
        });
        if (hasInnerHeaderNav) score -= 36;
      }
      var links = Array.from(row.querySelectorAll('a, [role="link"]'));
      if (links.length > 18) score -= 16;
      var anchor = null;
      for (var i = 0; i < links.length; i++) {
        var txt = (links[i].innerText || links[i].textContent || "").trim();
        if (/^(about|关于|resume|简历)$/i.test(txt)) {
          anchor = links[i];
          break;
        }
      }
      if (anchor) {
        var direct = findRowDirectChild(row, anchor);
        if (!direct) {
          score -= 22;
        } else {
          var dr = direct.getBoundingClientRect();
          var ar = anchor.getBoundingClientRect();
          if (dr.width > row.getBoundingClientRect().width * 0.75 && ar.left > window.innerWidth * 0.55 && dr.left < window.innerWidth * 0.15) {
            score -= 28;
          }
          if (Math.abs(dr.left - ar.left) < 120) score += 10;
        }
      }
      var rect = row.getBoundingClientRect();
      score += Math.max(0, 24 - Math.round(Math.max(0, rect.top) / 6));
      if (rect.width >= window.innerWidth * 0.9) score += 6;
      if (!best || score > best.score) best = { el: row, score: score };
    });
    return best ? best.el : null;
  }

  function findMainNavRow() {
    var container = document.getElementById("container");
    if (!container) return null;
    var all = Array.from(container.querySelectorAll("*"));
    var bestFull = null;
    var bestBrand = null;
    all.forEach(function (row) {
      if (!row || row.nodeType !== 1) return;
      if (row.closest("#kiki-chat-root")) return;
      var style = window.getComputedStyle(row);
      // Accept flex, grid, or block (some Figma pages use block-level nav containers)
      var disp = style.display || "";
      if (!disp || disp === "none" || disp === "inline") return;
      var rect = row.getBoundingClientRect();
      // Wider top tolerance for project pages (nav can be inside a sticky wrapper)
      if (rect.top < -30 || rect.top > 300) return;
      if (rect.height < 24 || rect.height > 200) return;
      if (rect.width < 200) return;
      var links = Array.from(row.querySelectorAll("a, [role='link']"));
      if (!links.length || links.length > 80) return;
      var hasAbout = false, hasResume = false, hasPortfolio = false;
      for (var i = 0; i < links.length; i++) {
        var txt = (links[i].innerText || links[i].textContent || "").trim();
        if (navLinkMatchesLabel(txt, "about")) hasAbout = true;
        if (navLinkMatchesLabel(txt, "resume")) hasResume = true;
        if (navLinkMatchesLabel(txt, "portfolio")) hasPortfolio = true;
      }
      if (!hasPortfolio) return;
      var score = Math.round(rect.width) - Math.round(Math.max(0, rect.top) * 2);
      if (hasAbout && hasResume) {
        if (!bestFull || score > bestFull.score) bestFull = { el: row, score: score };
      } else {
        if (!bestBrand || score > bestBrand.score) bestBrand = { el: row, score: score };
      }
    });
    // Prefer the full About+Resume nav row whenever it exists (homepage + detail pages).
    return bestFull ? bestFull.el : (bestBrand ? bestBrand.el : null);
  }

  function findRowDirectChild(row, node) {
    var cur = node;
    while (cur && cur.parentElement !== row) cur = cur.parentElement;
    return cur && cur.parentElement === row ? cur : null;
  }

  function findSiteSwitchInsertRef(row) {
    if (!row) return null;
    var navLinks = Array.from(row.querySelectorAll('a, [role="link"]'));
    for (var i = 0; i < navLinks.length; i++) {
      var node = navLinks[i];
      if (!node) continue;
      var text = (node.innerText || node.textContent || "").trim();
      if (/^(about|关于)$/i.test(text)) {
        var direct = findRowDirectChild(row, node);
        if (direct) return direct;
      }
    }
    return null;
  }

  function findFirstAboutResumeLink(root) {
    if (!root) return null;
    var links = Array.from(root.querySelectorAll('a, [role="link"], *'));
    for (var i = 0; i < links.length; i++) {
      var node = links[i];
      if (!node || node.children.length > 0 && !node.matches("a, [role='link']")) continue;
      var text = (node.innerText || node.textContent || "").trim();
      if (/^(about|关于|resume|简历)$/i.test(text)) return links[i];
    }
    return null;
  }

  function ensureSiteSwitchPlacement(row, wrap) {
    if (!row || !wrap || wrap.parentElement !== row) return;
    var insertRef = findSiteSwitchInsertRef(row);
    if (!insertRef) return;
    if (wrap.nextSibling !== insertRef) row.insertBefore(wrap, insertRef);
  }

  function getNavLinkByLabel(row, type) {
    if (!row) return null;
    var links = Array.from(row.querySelectorAll('a, [role="link"]'));
    var best = null;
    var bestTop = Infinity;
    for (var i = 0; i < links.length; i++) {
      var node = links[i];
      var txt = (node.innerText || node.textContent || "").trim();
      if (!navLinkMatchesLabel(txt, type)) continue;
      var top = node.getBoundingClientRect().top;
      if (top <= 220 && top < bestTop) {
        bestTop = top;
        best = node;
      }
    }
    if (best) return best;
    for (var j = 0; j < links.length; j++) {
      var txt2 = (links[j].innerText || links[j].textContent || "").trim();
      if (navLinkMatchesLabel(txt2, type)) return links[j];
    }
    return null;
  }

  function getDirectOrSelf(row, node) {
    if (!row || !node) return null;
    return findRowDirectChild(row, node) || node;
  }

  function getPrimaryRowChildByClass(row, cls) {
    if (!row) return null;
    var children = Array.from(row.children || []);
    for (var i = 0; i < children.length; i++) {
      if (children[i].classList && children[i].classList.contains(cls)) return children[i];
    }
    return null;
  }

  function hoistSwitchOutOfNestedBrandRow(row, switchWrap) {
    if (!row || !switchWrap || !switchWrap.parentElement) return;
    var nested = switchWrap.closest(".kiki-nav-row");
    while (nested && nested !== row && row.contains(nested)) {
      if (!getNavLinkByLabel(nested, "about") && !getNavLinkByLabel(nested, "resume")) {
        nested.removeChild(switchWrap);
        return;
      }
      var parent = nested.parentElement;
      nested = parent ? parent.closest(".kiki-nav-row") : null;
      if (nested && !row.contains(nested)) break;
    }
  }

  function ensurePrimaryNavLayout(row, switchWrap) {
    if (!row || !switchWrap) return;
    hoistSwitchOutOfNestedBrandRow(row, switchWrap);
    var portfolioLink = getNavLinkByLabel(row, "portfolio");
    var aboutLink = getNavLinkByLabel(row, "about");
    var resumeLink = getNavLinkByLabel(row, "resume");
    var brandNode = portfolioLink ? getDirectOrSelf(row, portfolioLink) : null;
    if (brandNode && portfolioLink && (
      (aboutLink && brandNode.contains(aboutLink)) ||
      (resumeLink && brandNode.contains(resumeLink)) ||
      getNavLinkByLabel(brandNode, "about") ||
      getNavLinkByLabel(brandNode, "resume")
    )) {
      brandNode = portfolioLink;
    }

    row.classList.add("kiki-nav-row");
    row.setAttribute("data-kiki-nav-row", "1");

    // Always pin the brand to the leftmost slot when present.
    if (brandNode && brandNode.parentElement === row && row.firstElementChild !== brandNode) {
      row.insertBefore(brandNode, row.firstElementChild || null);
    }
    if (brandNode) brandNode.classList.add("kiki-nav-brand");
    var aboutNode = aboutLink ? getDirectOrSelf(row, aboutLink) : null;
    var resumeNode = resumeLink ? getDirectOrSelf(row, resumeLink) : null;

    // Unified nav: [kiki Portfolio] …… [EN | 中文] [About] [Resume] on every page that has full nav.
    if (aboutLink && resumeLink && portfolioLink && aboutNode && resumeNode) {
      var sharedNavHost = aboutNode === brandNode || resumeNode === brandNode;
      switchWrap.classList.add("kiki-site-nav-right");
      aboutNode.classList.remove("kiki-site-nav-right");
      resumeNode.classList.remove("kiki-site-nav-right");
      if (!sharedNavHost) {
        aboutNode.classList.add("kiki-nav-action");
        if (resumeNode !== aboutNode) resumeNode.classList.add("kiki-nav-action");
      }
      var aboutHost = aboutLink.parentElement;
      var aboutRefNode = aboutLink;
      if (!aboutHost || !row.contains(aboutHost)) {
        aboutHost = row;
        aboutRefNode = aboutNode && row.contains(aboutNode) ? aboutNode : aboutLink;
      }
      if (sharedNavHost || aboutHost === brandNode) {
        aboutHost = row;
        aboutRefNode = aboutNode && row.contains(aboutNode) ? aboutNode : aboutLink;
      }
      if (aboutHost && aboutRefNode && aboutHost.contains(aboutRefNode)) {
        if (switchWrap.parentElement !== aboutHost) {
          aboutHost.insertBefore(switchWrap, aboutRefNode);
        } else if (switchWrap.nextSibling !== aboutRefNode) {
          aboutHost.insertBefore(switchWrap, aboutRefNode);
        }
      } else {
        row.appendChild(switchWrap);
      }
      if (!isInnerSitePage()) {
        if (resumeLink.parentElement === aboutHost) {
          if (!(aboutLink.compareDocumentPosition(resumeLink) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            aboutHost.appendChild(resumeLink);
          }
        } else if (resumeNode.parentElement !== row) {
          row.appendChild(resumeNode);
        }
      } else {
        hideNavResumeControl(row);
      }
      return;
    }

    // Fallback (no full About+Resume nav): keep brand left, switch before About if found.
    if (brandNode) brandNode.classList.add("kiki-nav-brand");
    var aboutOnly = getNavLinkByLabel(row, "about");
    var aboutOnlyNode = aboutOnly ? getDirectOrSelf(row, aboutOnly) : null;
    if (aboutOnlyNode) {
      switchWrap.classList.add("kiki-site-nav-right");
      aboutOnlyNode.classList.add("kiki-nav-action");
      var host = aboutOnly.parentElement || aboutOnlyNode;
      var ref = aboutOnly;
      if (host === brandNode) {
        host = row;
        ref = aboutOnlyNode;
      }
      if (host && ref && host.contains(ref)) {
        if (switchWrap.parentElement !== host) host.insertBefore(switchWrap, ref);
        else if (switchWrap.nextSibling !== ref) host.insertBefore(switchWrap, ref);
      } else {
        row.appendChild(switchWrap);
      }
      return;
    }
    switchWrap.classList.add("kiki-site-nav-right");
    if (switchWrap.parentElement !== row) row.appendChild(switchWrap);
    else if (switchWrap !== row.lastElementChild) row.appendChild(switchWrap);
    if (isInnerSitePage()) hideNavResumeControl(row);
  }

  function getPrimaryNavRow() {
    var row = findMainNavRow();
    if (row) return row;
    var root = document.getElementById("container");
    var about = getNavLinkByLabel(root, "about");
    if (about) {
      var cur = about.parentElement;
      while (cur && cur !== root) {
        if (getNavLinkByLabel(cur, "portfolio") && getNavLinkByLabel(cur, "resume")) return cur;
        cur = cur.parentElement;
      }
    }
    var rows = collectNavRows();
    var primaryRow = pickPrimaryNavRow(rows);
    if (!primaryRow && rows.length) primaryRow = rows[0];
    return primaryRow;
  }

  function forceSwitchBeforeAbout(row, switchWrap) {
    if (!switchWrap) return;
    var root = document.getElementById("container");
    var scope = row || root;
    var about = getNavLinkByLabel(scope, "about") || getNavLinkByLabel(root, "about");
    if (!about || !about.parentElement) return;
    if (row) hoistSwitchOutOfNestedBrandRow(row, switchWrap);
    else hoistSwitchOutOfNestedBrandRow(root, switchWrap);
    switchWrap.classList.add("kiki-site-nav-right");
    var host = about.parentElement;
    if (host.contains(about)) {
      if (switchWrap.parentElement !== host) host.insertBefore(switchWrap, about);
      else if (switchWrap.nextSibling !== about) host.insertBefore(switchWrap, about);
    }
  }

  function markPrimaryNavRows(primaryRow) {
    if (!primaryRow) return;
    var rows = collectNavRows();
    if (rows.indexOf(primaryRow) < 0) rows.unshift(primaryRow);
    rows.forEach(function (row) {
      row.setAttribute("data-kiki-nav-primary", row === primaryRow ? "1" : "0");
    });
  }

  function reconcileSiteLangSwitchPlacement() {
    var wrap = document.querySelector(".kiki-site-lang-switch");
    if (!wrap || __siteLangSwitchIniting) return;
    var primaryRow = getPrimaryNavRow();
    if (primaryRow) {
      markPrimaryNavRows(primaryRow);
      wrap.removeAttribute("data-kiki-site-switch-fixed");
      ensurePrimaryNavLayout(primaryRow, wrap);
      if (!wrap.parentElement) {
        var insertRef = findSiteSwitchInsertRef(primaryRow);
        if (insertRef) primaryRow.insertBefore(wrap, insertRef);
        else primaryRow.appendChild(wrap);
      }
      ensureSiteSwitchPlacement(primaryRow, wrap);
    }
    forceSwitchBeforeAbout(primaryRow, wrap);
    alignSiteSwitchToAnchor();
    var brand = document.querySelector(".kiki-nav-brand");
    var about = getNavLinkByLabel(document.getElementById("container"), "about");
    if (brand && about) {
      var swRect = wrap.getBoundingClientRect();
      var brandRect = brand.getBoundingClientRect();
      if (swRect.left < brandRect.right + 40) forceSwitchBeforeAbout(primaryRow, wrap);
    }
    if (!isSiteSwitchClickable(wrap)) {
      if (isInnerSitePage()) {
        repairTopNavAfterResumeHide();
        forceSwitchBeforeAbout(primaryRow, wrap);
      } else if (!document.body.classList.contains("kiki-chat-open")) {
        promoteSiteSwitchToViewportLayer(wrap);
      }
    }
    if (document.body.classList.contains("kiki-chat-open")) {
      wrap.setAttribute("data-kiki-hidden-chat", "1");
      wrap.removeAttribute("data-kiki-site-switch-fixed");
    }
    syncInnerPageNavChrome();
  }

  function normalizeDetachedSiteSwitchPlacement() {
    // Keep switch in the selected primary nav only.
    // Avoid cross-container reparenting which can break header layout width.
  }

  function alignSiteSwitchToAnchor() {
    var sw = document.querySelector(".kiki-site-lang-switch");
    if (!sw) return;
    // Clear legacy inline offsets that caused clipping/drift.
    sw.style.marginLeft = "";
    sw.style.marginRight = "";
    sw.style.transform = "";
  }

  function isSiteSwitchBtnClickable(btn) {
    if (!btn || !document.contains(btn)) return false;
    var rect = btn.getBoundingClientRect();
    if (!rect || rect.width < 6 || rect.height < 6) return false;
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var topEl = document.elementFromPoint(cx, cy);
    return !!(topEl && (topEl === btn || btn.contains(topEl)));
  }

  function isSiteSwitchClickable(wrap) {
    if (!wrap) return false;
    var en = wrap.querySelector('[data-kiki-site-lang="en"]');
    var zh = wrap.querySelector('[data-kiki-site-lang="zh"]');
    return isSiteSwitchBtnClickable(en) && isSiteSwitchBtnClickable(zh);
  }

  function promoteSiteSwitchToViewportLayer(wrap) {
    if (!wrap) return;
    if (document.body.classList.contains("kiki-chat-open")) return;
    wrap.setAttribute("data-kiki-site-switch-fixed", "1");
    if (wrap.parentElement !== document.body) document.body.appendChild(wrap);
  }

  function syncSiteSwitchWithChatOpen(open) {
    var wrap = document.querySelector(".kiki-site-lang-switch");
    if (!wrap) return;
    if (open) {
      wrap.setAttribute("data-kiki-hidden-chat", "1");
      wrap.removeAttribute("data-kiki-site-switch-fixed");
    } else {
      wrap.removeAttribute("data-kiki-hidden-chat");
      reconcileSiteLangSwitchPlacement();
    }
  }

  function getAllSiteLangSwitches() {
    return Array.from(document.querySelectorAll(".kiki-site-lang-switch"));
  }

  function removeAllSiteLangSwitches() {
    getAllSiteLangSwitches().forEach(function (sw) { sw.remove(); });
  }

  function siteLangSwitchNeedsInit() {
    var all = getAllSiteLangSwitches();
    if (!all.length) return true;
    if (all.length > 1) return true;
    return !document.contains(all[0]);
  }

  /** Keep exactly one switch (including fixed viewport layer). */
  function cleanupSiteLangSwitches(keepSwitch) {
    getAllSiteLangSwitches().forEach(function (sw) {
      if (sw !== keepSwitch) sw.remove();
    });
  }

  var __siteLangSwitchIniting = false;

  function widenNavParentIfNeeded(row) {
    if (!row) return;
    // Avoid forcing parent width/max-width; this caused top-nav clipping in some pages.
  }

  /* ─── Nav language toggle ─── */
  function initSiteLangSwitch() {
    if (__siteLangSwitchIniting) return;
    __siteLangSwitchIniting = true;
    var wrap = null;
    var primaryRow = getPrimaryNavRow();
    var useFixedLayer = !primaryRow;
    if (primaryRow) markPrimaryNavRows(primaryRow);
    removeAllSiteLangSwitches();
    try {
      if (primaryRow) widenNavParentIfNeeded(primaryRow);
      var lang = getSiteLang();
      wrap = document.createElement("div");
      wrap.className = "kiki-chat-lang-switch kiki-site-lang-switch";
      wrap.setAttribute("data-kiki-site-switch", "1");
      wrap.setAttribute("role", "group");
      wrap.setAttribute("aria-label", "Language");
      wrap.setAttribute("data-active", lang);

      var thumb = document.createElement("span");
      thumb.className = "kiki-chat-lang-switch__thumb";
      thumb.setAttribute("aria-hidden", "true");

      var ben = document.createElement("button");
      ben.type = "button";
      ben.className = "kiki-chat-lang-switch__btn" + (lang === "en" ? " kiki-chat-lang-switch__btn--active" : "");
      ben.setAttribute("data-kiki-site-lang", "en");
      ben.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
      ben.setAttribute("title", "English");
      ben.textContent = "EN";

      var bzh = document.createElement("button");
      bzh.type = "button";
      bzh.className = "kiki-chat-lang-switch__btn" + (lang === "zh" ? " kiki-chat-lang-switch__btn--active" : "");
      bzh.setAttribute("data-kiki-site-lang", "zh");
      bzh.setAttribute("aria-pressed", lang === "zh" ? "true" : "false");
      bzh.setAttribute("title", "中文");
      bzh.textContent = "中文";

      wrap.appendChild(thumb);
      wrap.appendChild(ben);
      wrap.appendChild(bzh);

      cleanupSiteLangSwitches(wrap);
      if (primaryRow && !useFixedLayer) {
        ensurePrimaryNavLayout(primaryRow, wrap);
        if (!wrap.parentElement) {
          var insertRef = findSiteSwitchInsertRef(primaryRow);
          if (insertRef) primaryRow.insertBefore(wrap, insertRef);
          else primaryRow.appendChild(wrap);
        }
        ensureSiteSwitchPlacement(primaryRow, wrap);
      }
      if (useFixedLayer || (!isSiteSwitchClickable(wrap) && !isInnerSitePage())) {
        promoteSiteSwitchToViewportLayer(wrap);
      }

      ben.addEventListener("click", function (ev) {
        clearProjectNavFallback();
        ev.stopPropagation();
        if (getSiteLang() === "en") return;
        setSiteLang("en");
        applySiteLang("en");
      });
      bzh.addEventListener("click", function (ev) {
        clearProjectNavFallback();
        ev.stopPropagation();
        if (getSiteLang() === "zh") return;
        setSiteLang("zh");
        applySiteLang("zh");
      });
    } catch (e) {}
    finally {
      if (wrap && document.contains(wrap)) cleanupSiteLangSwitches(wrap);
      else removeAllSiteLangSwitches();
      __siteLangSwitchIniting = false;
    }
    normalizeDetachedSiteSwitchPlacement();
    reconcileSiteLangSwitchPlacement();
    alignSiteSwitchToAnchor();
    setSiteLangAttr(getSiteLang());
    syncInnerPageNavChrome();
  }

  var __siteLangMo = null;
  var __siteLangMoRoot = null;
  var __siteLangMoTimer = null;
  function ensureSiteLangSwitchObserver() {
    var root = document.getElementById("container");
    if (!root) return;
    if (__siteLangMo && __siteLangMoRoot !== root) {
      __siteLangMo.disconnect();
      __siteLangMo = null;
      __siteLangMoRoot = null;
    }
    if (__siteLangMo) return;
    __siteLangMoRoot = root;
    __siteLangMo = new MutationObserver(function () {
      clearTimeout(__siteLangMoTimer);
      __siteLangMoTimer = setTimeout(function () {
        if (__langSwitchInProgress) return;
        // Re-init when missing, detached, or duplicated (concurrent inits / fixed+nav overlap).
        if (siteLangSwitchNeedsInit()) initSiteLangSwitch();
        else {
          var keep = document.querySelector(".kiki-site-lang-switch");
          if (keep) cleanupSiteLangSwitches(keep);
          reconcileSiteLangSwitchPlacement();
        }
      }, 300);
    });
    __siteLangMo.observe(root, { childList: true, subtree: true });
  }

  function scheduleSiteLangSwitchRecovery() {
    if (siteLangSwitchNeedsInit()) initSiteLangSwitch();
    else reconcileSiteLangSwitchPlacement();
    ensureSiteLangSwitchObserver();
    syncInnerPageNavChrome();
    var recover = function () {
      if (siteLangSwitchNeedsInit()) initSiteLangSwitch();
      else reconcileSiteLangSwitchPlacement();
      syncInnerPageNavChrome();
    };
    setTimeout(recover, 600);
    setTimeout(recover, 1800);
  }

  var __lastI18nPath = "";
  function maybeReapplySiteZh() {
    if (getSiteLang() !== "zh") return;
    var path = location.pathname || "";
    if (path === __lastI18nPath) return;
    __lastI18nPath = path;
    applySiteTranslations();
    ensureZhDomObserver();
    setTimeout(function () {
      if (getSiteLang() === "zh" && (location.pathname || "") === path) applySiteTranslations();
    }, 450);
    setTimeout(function () {
      if (getSiteLang() === "zh" && (location.pathname || "") === path) applySiteTranslations();
    }, 1100);
    setTimeout(function () {
      if (getSiteLang() === "zh" && (location.pathname || "") === path) applySiteTranslations();
    }, 2200);
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* ─── Project DB ─── */
  var PROJECT_DB = [
    { match: /solplanet|aiswei|ems/i, title: "Solplanet Smart Energy APP — EMS & AI Mode", meta: "AISWEI 🇨🇳 · AI Business Analysis · 2025.8 – NOW", route: "/project",
      overview: "智慧能源产品 EMS 与 AI Mode：负责业务分析、信息架构、交互范式定义及 Vibe Coding 原型验证。",
      overviewEn: "Smart-energy product (EMS & AI Mode): business analysis, IA, interaction patterns, and Vibe Coding prototypes.",
      process: ["业务分析", "用户旅程", "AI Mode IA", "原型迭代", "开发协作"],
      processEn: ["Discovery", "User journey", "AI Mode IA", "Prototype iteration", "Dev collaboration"] },
    { match: /decathlon|supply/i, title: "Decathlon DPCP — Global Supply Chain", meta: "Decathlon 🇫🇷 · Digital Product Designer · 2022.12 – 2024.4", route: "/project-7",
      overview: "全球供应链数字化平台：统一采购/物流视图与 AI 自动化场景。",
      overviewEn: "Global supply-chain platform: unified sourcing/logistics views and AI automation scenarios.",
      process: ["干系人访谈", "流程梳理", "Dashboard IA", "自动化设计", "多市场适配"],
      processEn: ["Stakeholder interviews", "Process mapping", "Dashboard IA", "Automation UX", "Multi-market rollout"] },
    { match: /lkk|data bank|bi portal/i, title: "LKK Data Bank & BI Portal", meta: "Lee Kum Kee 🇭🇰 · UI/UX Designer & PO · 2024.5 – 2025.6", route: "/project-6",
      overview: "企业数据银行与 BI 门户：多源整合与自助分析体验。",
      overviewEn: "Enterprise data bank & BI portal: multi-source integration and self-serve analytics.",
      process: ["数据梳理", "需求优先级", "报表体系", "权限模型", "上线迭代"],
      processEn: ["Data mapping", "Prioritization", "Reporting system", "Permissions", "Launch iterations"] },
    { match: /bmw|odpm/i, title: "BMW ODPM", meta: "BMW · Digital Product Design", route: "/project-2",
      overview: "宝马 ODPM 数字化体验：复杂 B 端任务流与清晰导航。",
      overviewEn: "BMW ODPM digital experience: complex B2B task flows with clear navigation.",
      process: ["专家共创", "任务简化", "组件协作", "可用性走查"],
      processEn: ["Expert co-creation", "Task simplification", "Component collaboration", "Usability reviews"] },
    { match: /senselink|sense link/i, title: "SenseLink JCV", meta: "JCV 🇯🇵 · UI/UX Design", route: "/project-3",
      overview: "工业设备管理：监控、告警与运维任务一体化。",
      overviewEn: "Industrial equipment management: monitoring, alerts, and ops tasks in one flow.",
      process: ["现场调研", "告警模型", "多端适配"],
      processEn: ["Field research", "Alert model", "Multi-device adaptation"] },
    { match: /weavr|game data/i, title: "Weavr live", meta: "Weavr 🇬🇧 · UI/UX Researcher", route: "/project-6",
      overview: "游戏直播数据可视化与用户研究。",
      overviewEn: "Live game-streaming data visualization grounded in user research.",
      process: ["研究", "叙事", "原型测试"],
      processEn: ["Research", "Narrative design", "Prototype testing"] },
    { match: /sensethunder|physical/i, title: "SenseThunder JCV", meta: "JCV · UI/UX Intern", route: "/project-8",
      overview: "实体产品配套软件与可用性测试。",
      overviewEn: "Companion software for hardware products plus usability testing.",
      process: ["联调", "测试", "迭代"],
      processEn: ["Integration", "Testing", "Iteration"] },
    { match: /huwei|huawei|华为|nus|ar smart|puppyland/i, title: "HUWEI & NUS AR Smart Glass", meta: "Huawei × NUS 🇸🇬🇨🇳 · UI/UX Designer · 2022.5", route: "/project-6",
      overview: "AR 智能眼镜界面与交互设计，获 Judges' Choice Award。",
      overviewEn: "AR smart glasses UI/UX design, won the Judges' Choice Award.",
      process: ["研究", "交互设计", "评审"],
      processEn: ["Research", "Interaction design", "Jury review"] },
    { match: /york|quantitative|banking/i, title: "Mobile Banking Research", meta: "University of York · User Research", route: "/project-9",
      overview: "移动端银行体验定量研究与设计建议。",
      overviewEn: "Quantitative mobile banking research with design recommendations.",
      process: ["假设", "问卷", "分析", "建议"],
      processEn: ["Hypothesis", "Survey", "Analysis", "Recommendations"] },
  ];

  /* ─── FAQ items ─── */
  var FAQ_ITEMS = [
    { chip: true, q: "你做过哪些项目？",
      en: { q: "What projects have you done?", a: "Across energy, supply chain, BI, automotive, IoT, and data visualization:\n\n· Solplanet Smart Energy (AISWEI) — EMS & AI Mode (in progress)\n· Decathlon DPCP — Global supply chain + AI automation\n· LKK Data Bank & BI Portal — enterprise data/BI self-serve\n· HUWEI & NUS AR Smart Glass — Judges' Choice Award\n· University of York — quantitative mobile banking research\n· BMW ODPM — dealer digitization (BMW 🇩🇪)\n· SenseLink / SenseThunder JCV — IoT & hardware UI (JCV 🇯🇵)\n· Weavr live — game data visualization (🇬🇧)" },
      match: /项目|portfolio|作品|案例/,
      a: "我做过跨能源、供应链、快消 BI、汽车、IoT 与数据可视化的产品：\n\n· Solplanet Smart Energy（AISWEI）— EMS & AI Mode，进行中\n· Decathlon DPCP — 全球供应链与 AI 自动化\n· LKK Data Bank & BI Portal — 数据银行与自助分析\n· HUWEI & NUS AR Smart Glass — 华为 & 新大评委选择奖\n· 约克大学 — 移动端银行定量研究\n· BMW ODPM — 经销商数字化（BMW 🇩🇪）\n· SenseLink / SenseThunder JCV — IoT 与硬件 UI（JCV 🇯🇵）\n· Weavr live — 游戏数据可视化（🇬🇧）" },
    { chip: true, q: "介绍 Solplanet 项目",
      en: { q: "Tell me about Solplanet", a: "Solplanet Smart Energy APP (AISWEI 🇨🇳, Aug 2025 – present) — Design Lead.\n\nI led 1 interaction designer + 1 design intern through a full app redesign.\n\n3 core directions:\n1) Multi-scenario: 3D real-time energy-flow models for residential & commercial storage\n2) Data visualization: radar, bar, Sankey & energy-flow charts for inverter data; AI-assisted analysis\n3) AI Mode: transparent buy/sell decisions — turning the AI black box into a clear, readable dashboard\n\nAlso unified the installer workflow: device list view, alert management, and essential copy-paste ops." },
      match: /solplanet|aiswei|爱士惟|能源|ems|ai mode|vibe coding|逆变器|inverter|储能/i,
      a: "Solplanet Smart Energy APP（AISWEI 🇨🇳，2025.8 – 至今）——设计 Leader。\n\n带领 1 名交互设计师 + 1 名设计实习生完成整体改版。\n\n改版 3 大方向：\n1. 多场景：户用 / 工商业储能 3D 实时能量流动模型\n2. 数据可视化：雷达图、柱状图、桑基图、能量流图，多维展示逆变器数据 + AI 辅助分析\n3. AI Mode：透明化展示 AI 买电卖电决策——将「黑箱」变成「明牌」\n\n同时整合安装商工作流：设备列表统一管理、告警处理、型号复制粘贴等基础功能。" },
    { chip: true, q: "Decathlon 供应链做了什么？",
      en: { q: "What did you do at Decathlon (supply chain)?", a: "Decathlon DPCP — Global Supply Chain (🇫🇷, Digital Product Designer, Dec 2022 – Apr 2024).\n\nMission: data-driven solution to Decathlon's supply chain collaboration & data management pain points.\n\nApproach: used Business Process Canvas to map 300+ workflows across 9 digital systems, covering internal roles (supply chain managers, buyers, finance) and external suppliers. Identified 4 opportunity areas: alert management, data prediction, warehouse management, and system portal.\n\nKey outcomes:\n· Connected upstream/downstream order alerts to reduce manual effort and communication cost\n· Role-based flexible data visualization + automated action tasks & assignment\n· UX led as a business driver — not just PM support\n· Validated with UEMS standardized scale at key agile sprint milestones" },
      match: /decathlon|迪卡侬|供应链|dpcp|supply|bpc|business process/i,
      a: "Decathlon DPCP — 全球供应链（🇫🇷，Digital Product Designer，2022.12 – 2024.4）。\n\n使命：用数据驱动解决迪卡侬供应链内外部协作与数据管理的痛点。\n\n方法：通过 Business Process Canvas 梳理 300+ 工作流 × 9 套数字化系统，涵盖内部（供应链管理、买手、财务）和外部供应商。识别 4 大机会方向：管理预警、数据预测、仓储管理、系统门户。\n\n核心成果：\n· 串联订单管理预警上下游，节省人效、降低沟通成本\n· 针对不同角色灵活可视化数据，自动化 action task 与 task 指派\n· UX 作为 Business 核心驱动开发落地，而非 PM 辅助\n· 关键敏捷节点使用 UEMS 标准化量表量化评估体验提升" },
    { chip: true, q: "LKK 数据银行经历？",
      en: { q: "LKK Data Bank & BI Portal — what was it?", a: "LKK Data Bank & BI Portal (Lee Kum Kee 🇭🇰, UI/UX Designer & PO, May 2024 – Jun 2025).\n\nEnterprise data bank + BI portal: multi-source integration, reporting framework, permission model, and self-serve analytics." },
      match: /lkk|李锦记|lee kum|data bank|bi portal|bi report/i,
      a: "LKK Data Bank & BI Portal（Lee Kum Kee 🇭🇰，UI/UX Designer & PO，2024.5 – 2025.6）。\n\n负责企业数据银行与 BI 门户：多源数据整合、报表体系、权限模型与自助分析体验；同时承担 PO 角色。" },
    { chip: true, q: "AR 眼镜获奖项目？",
      en: { q: "AR smart glasses award project?", a: "HUWEI & NUS AR Smart Glass (Huawei × National University of Singapore, UI/UX Designer, May 2022).\n\nDesigned UI and interactions for AR smart glasses; won the Judges' Choice Award." },
      match: /huwei|huawei|华为|nus|ar smart|ar 眼镜|评委|award/i,
      a: "HUWEI & NUS AR Smart Glass（华为 & 新加坡国立大学 🇸🇬🇨🇳，UI/UX Designer，2022.5）。\n\n为 AR 智能眼镜做界面与交互设计，项目获 The Judges' Choice Award from Huawei & NUS。" },
    { chip: true, q: "BMW 与工业 IoT 经验？",
      en: { q: "BMW & industrial IoT experience?", a: "Automotive & industrial IoT:\n\n· BMW ODPM — dealer management digitization; complex B2B task flows under BMW brand guidelines.\n· SenseLink JCV — industrial equipment management (monitoring, alerts, ops tasks).\n· SenseThunder JCV — companion software + usability testing (hardware + software)." },
      match: /bmw|宝马|odpm|senselink|sense link|sensethunder|iot|工业|jcv/i,
      a: "汽车与工业 IoT 方面：\n\n· BMW ODPM — 经销商管理数字化，复杂 B 端任务流。\n· SenseLink JCV — 工业设备管理（监控、告警、运维任务一体化）。\n· SenseThunder JCV — 实体产品配套软件与可用性测试（软硬一体）。" },
    { chip: true, q: "擅长 B 端还是 AI 产品？",
      en: { q: "Are you stronger in B2B or AI products?", a: "Both — and often combined:\n\n· B2B/SaaS: Decathlon supply chain, LKK BI, BMW ODPM, SenseLink — IA, dashboards, permissions, multi-role collaboration.\n· AI: Solplanet AI Mode, Decathlon automation — scenario definition, explainable interactions, business alignment." },
      match: /擅长|b端|b 端|saas|dashboard|ai产品|to b/i,
      a: "两者都做，且经常交叉：\n\n· B 端 / 企业产品：Decathlon 供应链、LKK BI、BMW ODPM、SenseLink 等。\n· AI / 智能产品：Solplanet AI Mode、Decathlon AI 自动化场景。\n\n习惯用研究对齐目标，用原型验证假设，再跟开发一起落地。" },
    { chip: true, q: "设计流程是什么？",
      en: { q: "What's your design process?", a: "My process:\n\n1) Align goals & success metrics\n2) Research (interviews, journeys, competitor scan)\n3) IA + prototypes (low → high fidelity)\n4) Visual + design system\n5) Validation + iteration" },
      match: /流程|process|方法|怎么做设计/,
      a: "设计流程：\n\n1. 对齐目标与成功指标\n2. 研究：访谈、旅程、竞品\n3. IA 与原型：从低保真到高保真\n4. 视觉与 Design System\n5. 验证：可用性测试、走查、上线后迭代" },
    { chip: true, q: "怎么做用户研究？",
      en: { q: "How do you do user research?", a: "I choose methods based on the question:\n\n· Qualitative: stakeholder/user interviews, field observation, journey & task analysis\n· Quantitative: surveys + analysis (York mobile banking)\n· Validation: prototype tests, heuristic/usability reviews" },
      match: /研究|research|用户研究|访谈|问卷|定量|weavr|约克|york/i,
      a: "研究我会按问题选方法：\n\n· 定性：干系人/用户访谈、现场观察、旅程与任务分析\n· 定量：问卷与统计分析（约克大学 Mobile Banking 研究）\n· 验证：原型测试、可用性走查、上线数据反馈" },
    { chip: true, q: "有团队管理经验吗？",
      en: { q: "Do you have leadership experience?", a: "Yes — about 2 years managing startup teams; also acted as PO at LKK for prioritization and end-to-end delivery." },
      match: /管理|manager|团队|lead|startup|创业/,
      a: "有的。约 2 年管理创业团队经验，在 LKK 项目里还担任 PO，负责需求优先级与端到端交付。" },
    { chip: true, q: "你是谁？",
      en: { q: "Who are you?", a: "I'm Kiki Sun (孙可月) — a global UX designer based in Shanghai.\n\nI've designed products for companies across France, UK, Ireland, Japan, Germany, HK, and mainland China, covering ToB & ToC end-to-end: UX design, user research, and design strategy.\n\nIn the AI era I also call myself an AI Design Engineer — over the past year I've explored video production, motion modeling, and front-end dev independently: things I once needed a full team for.\n\nIn one sentence: I'm an Explorer — collecting pieces of the puzzle to become a better creator of meaningful experiences." },
      match: /你是谁|kiki|背景|about|介绍自己|个人|global|全球/,
      a: "我是 Kiki Sun（孙可月），base 上海 🇨🇳，一名全球化用户体验设计师。\n\n我为法国、英国、爱尔兰、日本、德国、中国香港及大陆的公司设计产品，专注 ToB/ToC 端到端体验设计、用户研究与设计商业策略。\n\n在 AI 时代，我也是一名 AI 设计工程师——过去一年我独立完成了视频制作、动效建模、前端开发，这些在以前需要整个团队才能完成。\n\n用一句话概括：我是一名探索者，不断收集拼图，成为更美好体验设计的创造者。" },
    { chip: true, q: "你的跨文化经验？",
      en: { q: "Cross-cultural experience & working style?", a: "I've lived in both China and the UK, and my clients & colleagues have come from France, Germany, Japan, HK, Ireland, and beyond.\n\nMy edge: driving UX research and design delivery across cultures and organizations.\n\nWorking method: identify the real UX pain point each company faces → align with all stakeholders → build and ship MVPs fast to validate direction.\n\nWhat my managers say: 'Sharp insight, fast execution — she finds opportunity in ambiguity and iterates quickly to prove her direction.'" },
      match: /跨文化|cross.?cultural|海外|英国|全球化|方法论|methodology|multicultural/i,
      a: "我有在中英两国长期生活的经历，客户与同事遍布法国、德国、日本、香港、爱尔兰等地。\n\n核心优势：跨文化推进用户体验研究与设计落地。\n\n工作方法论：发现各公司真实体验痛点 → 与各方利益相关者对齐 → 快速构建 MVP 验证方向，迭代推进。\n\n过去的 manager 评价我：「有敏锐的洞察力和快速落地的执行力——善于在模糊需求中找到机会点，并迅速验证和迭代。」" },
    { chip: true, q: "你用哪些 AI 工具？",
      en: { q: "What's your AI workflow & tools?", a: "My current AI stack:\n\n· Figma — UI design & prototyping (source of truth)\n· Cursor — AI-powered code editor for front-end & Vibe Coding\n· Codex — code generation & logic scaffolding\n· Lovart — AI image & visual generation\n· Google Stitch — UI-to-code bridging\n· + other emerging tools as they appear\n\nPhilosophy: AI handles speed & scaffolding; I own direction, quality, and craft." },
      match: /ai工具|ai workflow|工具链|figma|cursor|codex|lovart|stitch|工作流|tools/i,
      a: "我目前的 AI 工具链：\n\n· Figma — UI 设计与原型（核心产出物）\n· Cursor — AI 代码编辑器，用于前端开发与 Vibe Coding\n· Codex — 代码生成与逻辑搭建\n· Lovart — AI 图像与视觉生成\n· Google Stitch — UI 转代码桥接\n· 以及其他不断涌现的新工具\n\n我的理念：AI 负责速度和脚手架，我负责方向、品质和细节打磨。" },
    { chip: true, q: "Vibe Coding 是什么？",
      en: { q: "What is Vibe Coding?", a: "My working style (e.g., Solplanet): use AI to quickly build interactive prototypes to validate complex flows early.\n\nFigma remains the source of truth; Vibe Coding boosts iteration speed and communication efficiency." },
      match: /vibe coding|vibe|原型工具|ai辅助|写代码/,
      a: "Vibe Coding 是我用在 Solplanet 等项目里的工作方式：用 AI 辅助快速搭可交互原型，尽早验证复杂流程。\n\n设计资产仍以 Figma 为主；Vibe Coding 补的是速度与对话效率。" },
    { chip: true, q: "你对 AI 设计的看法？",
      en: { q: "Your view on AI and UX design?", a: "The designer's three core abilities in the AI era: business value × user insight × technology innovation.\n\nBut here's the honest tension: AI is making our work average. I've used AI to build exhibition sandboxes, desktop pets, psychology test sites, videos, 3D IP modeling — fast, but mediocre.\n\nAI generates 75-point products quickly. You ship fast, but you stop caring about the details.\n\nMy belief: design doesn't chase efficiency — it chases perfect experience. A true design work must first move yourself, then move people, then move the market.\n\nDesign with sincerity. Build with professional rigor." },
      match: /ai.*design|design.*ai|ai时代|人工智能|ux.*future|未来.*设计|看法|观点|平庸|黑箱|效率.*设计/i,
      a: "AI 时代设计师最重要的三角能力：商业价值 × 用户洞察 × 技术创新。\n\n但我有一个诚实的担忧：AI 正在让设计作品变得平庸。我用 AI 做过展会沙盘、桌面宠物、心理测试网站、视频制作、3D IP 建模——很快，但不够好。\n\nAI 帮你产出 75 分的产品，上线快，却让你不再关注那些细节。\n\n我的信念：设计不追求效率，而应追求完美的体验。真正的设计作品，要先打动自己，再打动人心，最后才有可能打动市场。\n\n设计师应饱有赤诚之心去体验，再以专业、理性、严谨的角度去设计。" },
    { chip: true, q: "可以合作吗？",
      en: { q: "Open to collaboration?", a: "Yes. Suitable for B2B/SaaS, data & BI, AI features, energy & IoT.\n\nContact via the Connect section at the bottom: email, LinkedIn, or Redbook." },
      match: /合作|hire|招聘|freelance|外包|兼职|全职|联系项目/,
      a: "欢迎合作。适合：B 端 / SaaS、数据与 BI、AI 功能、能源与 IoT。\n\n请通过页面底部 Connect 联系我（邮箱 / LinkedIn / 小红书）。" },
    { chip: true, q: "如何联系你？",
      en: { q: "How to contact you?", a: "See the Connect section at the bottom of the page:\n\n· Base: Shanghai, China\n· Phone: (+86) 188 2161 7969\n· Email: sunkeyue1@163.com\n· Social: LinkedIn, Redbook" },
      match: /联系|contact|邮箱|电话|linkedin|小红书|redbook|微信/,
      a: "联系方式（见页面底部 Connect）：\n\n· 基地：上海，中国\n· 电话：(+86) 188 2161 7969\n· 邮箱：sunkeyue1@163.com\n· 社交：LinkedIn、小红书（Redbook）" },
  ];

  /* ─── Utils ─── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function decodeHtml(s) {
    var d = document.createElement("textarea"); d.innerHTML = s || ""; return d.value;
  }

  /* ─── Chat language ─── */
  var CHAT_LANG_KEY = "kiki_chat_lang";
  function getChatLang() {
    try { var v = (localStorage.getItem(CHAT_LANG_KEY) || "en").toLowerCase(); return v === "zh" ? "zh" : "en"; } catch (e) { return "en"; }
  }
  function setChatLang(lang) {
    lang = lang === "zh" ? "zh" : "en";
    try { localStorage.setItem(CHAT_LANG_KEY, lang); } catch (e) {}
  }

  function getFaqQ(item, lang) {
    if (!item) return "";
    lang = lang || getChatLang();
    if (lang === "en" && item.en && item.en.q) return item.en.q;
    return item.q || (item.en ? item.en.q : "") || "";
  }
  function getFaqA(item, lang) {
    if (!item) return "";
    lang = lang || getChatLang();
    if (lang === "en" && item.en && item.en.a) return item.en.a;
    return item.a || (item.en ? item.en.a : "") || "";
  }

  var CHAT_UI = {
    en: {
      triggerLabel: "Ask Kiki",
      headerTitle: "Ask Kiki",
      headerSub: "Work · Process · Collaboration",
      placeholder: "Ask a question…",
      resetTitle: "Reset",
      closeTitle: "Close",
      welcome: "Hi! I'm Ask Kiki.\n\nI can answer based on Kiki's real projects and experience (Solplanet, Decathlon, LKK, BMW, IoT, AR award, research & leadership).\n\nPick a quick question below, or type your own.",
      fallbackEmpty: "Pick a quick question below, or type your own.",
      fallbackUnknown: "I might not fully understand yet.\n\nTry the quick chips below, or ask about a project name, B2B/AI experience, research process, or collaboration.",
    },
    zh: {
      triggerLabel: "问问 Kiki",
      headerTitle: "问问 Kiki",
      headerSub: "作品 · 流程 · 合作",
      placeholder: "输入问题…",
      resetTitle: "重置",
      closeTitle: "关闭",
      welcome: "你好，我是 Ask Kiki。\n\n我可以根据 Kiki 的真实项目与经历回答：Solplanet、Decathlon、LKK、BMW、IoT、AR 获奖项目、研究与管理经验等。\n\n点下面快捷问题开始，或直接输入你想了解的。",
      fallbackEmpty: "可以点下面的快捷问题，或直接输入你想了解的。",
      fallbackUnknown: "我还在规则问答模式，可能没完全理解你的问题。\n\n试试点下面标签，或问：某个项目名、B 端/AI 经验、研究流程、合作方式等。",
    },
  };

  /* ─── Message formatting ─── */
  var KIKI_SECTION_RE = /^(Scope|Approach|Problem|Role|Deliverables|Outcome|Outcomes|Highlights|Process|Domains|Leadership|Qualitative|Quantitative|Validation|Contact|代表项目|范围|方法|交付|价值|问题|要点|流程|研究|验证|定性|定量)/i;

  function isBulletLine(line) {
    var t = (line||"").trim();
    return /^[·•\-]\s/.test(t) || /^\d+[.)]\s/.test(t);
  }
  function stripBullet(line) {
    return (line||"").trim().replace(/^[·•\-]\s*/, "").replace(/^\d+[.)]\s*/, "");
  }

  /* ── helpers for rich rendering ── */
  function isFlowLine(s) { return /^(?:Flow|流程|过程|Process)[\s:：]/i.test(s.trim()); }
  function isTagLine(s) { return /^(?:Tags?|标签)[\s:：]/i.test(s.trim()); }
  function hasDash(s) { return /[—–]/.test(s); }
  function isCardBullet(s) { return /^[·•\-]\s/.test(s.trim()) && hasDash(s); }
  function parseCard(line) {
    var txt = line.replace(/^[·•\-]\s*/, "").trim();
    var m = txt.match(/^(.+?)\s*[—–]\s*(.+)$/);
    return m ? { name: m[1].trim(), sub: m[2].trim() } : { name: txt, sub: null };
  }

  function renderFlow(str) {
    var raw = str.replace(/^(?:Flow|流程|过程|Process)[\s:：]\s*/i, "").replace(/\.\s*$/, "");
    var steps = raw.split(/\s*→\s*/);
    var h = '<div class="kiki-flow">';
    steps.forEach(function(s, i) {
      s = s.trim(); if (!s) return;
      h += '<span class="kiki-flow__step">' + escapeHtml(s) + "</span>";
      if (i < steps.length - 1) h += '<span class="kiki-flow__arr">→</span>';
    });
    return h + "</div>";
  }

  function renderTags(str) {
    var raw = str.replace(/^(?:Tags?|标签)[\s:：]\s*/i, "");
    var tags = raw.split(/\s*[·,/]\s*/).filter(Boolean);
    if (!tags.length) return "";
    var h = '<div class="kiki-tag-chips">';
    tags.forEach(function(t) { t = t.trim(); if (t) h += '<span class="kiki-tag">' + escapeHtml(t) + "</span>"; });
    return h + "</div>";
  }

  function renderCards(lines) {
    var h = '<div class="kiki-proj-list">';
    lines.forEach(function(l) {
      var pc = parseCard(l);
      h += '<div class="kiki-proj-card"><div class="kiki-proj-card__name">' + escapeHtml(pc.name) + "</div>";
      if (pc.sub) h += '<div class="kiki-proj-card__sub">' + escapeHtml(pc.sub) + "</div>";
      h += "</div>";
    });
    return h + "</div>";
  }

  function renderSteps(lines) {
    var h = '<ol class="kiki-msg-list kiki-msg-list--steps">';
    lines.forEach(function(l) { h += "<li>" + escapeHtml(stripBullet(l)) + "</li>"; });
    return h + "</ol>";
  }

  function formatBotMessageHtml(text) {
    if (!text) return '<p class="kiki-msg-p"></p>';
    var blocks = String(text).split(/\n\n+/);
    var out = [];

    blocks.forEach(function(block) {
      block = block.trim();
      if (!block) return;
      var lines = block.split("\n").map(function(l){ return l.trim(); }).filter(Boolean);
      if (!lines.length) return;
      var first = lines[0];

      /* flow: A → B → C */
      if (isFlowLine(first)) { out.push(renderFlow(first)); return; }

      /* Tags: # chip · # chip */
      if (isTagLine(first)) { var t = renderTags(first); if (t) out.push(t); return; }

      /* project card list (≥2 bullets with em-dash) */
      var cardLines = lines.filter(isCardBullet);
      var plainLines = lines.filter(function(l){ return !isCardBullet(l) && !/^[·•\-]\s/.test(l); });
      if (cardLines.length >= 2) {
        plainLines.forEach(function(l){ out.push('<p class="kiki-msg-p kiki-msg-p--lead">' + escapeHtml(l) + "</p>"); });
        out.push(renderCards(cardLines));
        /* render remaining plain bullets */
        lines.filter(function(l){ return /^[·•\-]\s/.test(l) && !isCardBullet(l); }).forEach(function(l){
          out.push('<ul class="kiki-msg-list"><li>' + escapeHtml(stripBullet(l)) + "</li></ul>");
        });
        return;
      }

      /* single card bullet */
      if (lines.length === 1 && isCardBullet(first)) { out.push(renderCards([first])); return; }

      /* numbered steps list */
      if (lines.length > 1 && lines.every(function(l){ return /^\d+[.)]\s/.test(l.trim()); })) {
        out.push(renderSteps(lines)); return;
      }

      /* section header + content */
      var isHeader = KIKI_SECTION_RE.test(first.replace(/[:：]\s*$/, "")) && first.length < 48;
      if (lines.length > 1 && (isHeader || lines.slice(1).some(isBulletLine))) {
        out.push('<div class="kiki-msg-section">');
        out.push('<div class="kiki-msg-section__title">' + escapeHtml(first.replace(/[:：]\s*$/, "")) + "</div>");
        var rest = lines.slice(1);
        if (rest.every(isBulletLine)) {
          out.push('<ul class="kiki-msg-list">');
          rest.forEach(function(l){ out.push("<li>" + escapeHtml(stripBullet(l)) + "</li>"); });
          out.push("</ul>");
        } else {
          rest.forEach(function(l){ out.push('<p class="kiki-msg-p">' + escapeHtml(l) + "</p>"); });
        }
        out.push("</div>"); return;
      }

      /* pure bullet list */
      if (lines.every(isBulletLine)) {
        out.push('<ul class="kiki-msg-list">');
        lines.forEach(function(l){ out.push("<li>" + escapeHtml(stripBullet(l)) + "</li>"); });
        out.push("</ul>"); return;
      }

      /* single line */
      if (lines.length === 1) { out.push('<p class="kiki-msg-p">' + escapeHtml(first) + "</p>"); return; }

      /* plain paragraphs */
      lines.forEach(function(l){ out.push('<p class="kiki-msg-p">' + escapeHtml(l) + "</p>"); });
    });

    return '<div class="kiki-msg-rich">' + out.join("") + "</div>";
  }

  function setBotBubbleContent(bubble, text) {
    bubble.classList.add("kiki-chat-bubble--rich");
    bubble.innerHTML = formatBotMessageHtml(text);
  }

  /* ─── FAQ answer builder ─── */
  function findProject(text) {
    var t = decodeHtml(text || "");
    for (var i = 0; i < PROJECT_DB.length; i++) {
      if (PROJECT_DB[i].match && PROJECT_DB[i].match.test(t)) return PROJECT_DB[i];
    }
    return null;
  }

  function buildFaqAnswer(q, lang) {
    lang = lang || getChatLang();
    var ui = CHAT_UI[lang] || CHAT_UI.en;
    var text = (q || "").trim();
    if (!text) return ui.fallbackEmpty;
    for (var i = 0; i < FAQ_ITEMS.length; i++) {
      var it = FAQ_ITEMS[i];
      if ((it.q || "") === text) return getFaqA(it, lang);
      if (it.en && it.en.q === text) return getFaqA(it, "en");
    }
    for (var j = 0; j < FAQ_ITEMS.length; j++) {
      if (FAQ_ITEMS[j].match && FAQ_ITEMS[j].match.test(text)) return getFaqA(FAQ_ITEMS[j], lang);
    }
    var proj = findProject(text);
    if (proj) {
      if (lang === "en") return proj.title + "\n" + (proj.meta||"") + "\n\n" + (proj.overviewEn||proj.overview||"") + (proj.processEn && proj.processEn.length ? "\n\nProcess: " + proj.processEn.join(" → ") : "");
      return proj.title + "\n" + (proj.meta||"") + "\n\n" + (proj.overview||"") + (proj.process && proj.process.length ? "\n\n过程：" + proj.process.join(" → ") : "");
    }
    return ui.fallbackUnknown;
  }

  function loadMessages() { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) { return []; } }
  function saveMessages(msgs) { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch (e) {} }

  /* ─── Chat widget ─── */
  var chatState = { open: false, busy: false };
  var chatMounted = false;

  function removeChat() { var old = document.getElementById("kiki-chat-root"); if (old) old.remove(); chatMounted = false; }

  function initAskKiki() {
    if (chatMounted && document.querySelector(".kiki-chat-trigger")) return;
    removeChat();
    var lang = getChatLang();
    var ui = CHAT_UI[lang] || CHAT_UI.en;
    var root = el("div", "", "");
    root.id = "kiki-chat-root";
    root.setAttribute("data-kiki-ui", "chat");
    var trigger = el("button", "kiki-chat-trigger",
      '<span class="kiki-chat-trigger__icon"><img src="' + KIKI_AVATAR_SRC + '" alt="Kiki" width="64" height="64" decoding="async"/></span>' +
      '<span class="kiki-chat-trigger__label">' + escapeHtml(ui.triggerLabel) + "</span>"
    );
    trigger.type = "button";
    trigger.setAttribute("aria-label", ui.triggerLabel);
    var panel = el("aside", "kiki-chat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", ui.headerTitle);
    panel.setAttribute("data-kiki-lang", lang);
    panel.innerHTML =
      '<header class="kiki-chat-header">' +
      '<div class="kiki-chat-avatar"><img src="' + KIKI_AVATAR_SRC + '" alt="Kiki" width="40" height="40" decoding="async"/></div>' +
      "<div><h2>" + escapeHtml(ui.headerTitle) + '</h2><p class="kiki-chat-header__sub">' + escapeHtml(ui.headerSub) + "</p></div>" +
      '<div class="kiki-chat-header__actions">' +
      '<div class="kiki-chat-lang-switch" role="group" aria-label="Language" data-active="' + lang + '">' +
      '<span class="kiki-chat-lang-switch__thumb" aria-hidden="true"></span>' +
      '<button type="button" class="kiki-chat-lang-switch__btn" data-kiki-lang="en" aria-pressed="' + (lang==="en"?"true":"false") + '" title="English">EN</button>' +
      '<button type="button" class="kiki-chat-lang-switch__btn" data-kiki-lang="zh" aria-pressed="' + (lang==="zh"?"true":"false") + '" title="中文">中文</button>' +
      "</div>" +
      '<span class="kiki-chat-header__divider" aria-hidden="true"></span>' +
      '<button type="button" class="kiki-chat-header__icon" data-kiki-reset title="' + escapeHtml(ui.resetTitle) + '">↺</button>' +
      '<button type="button" class="kiki-chat-header__icon" data-kiki-close title="' + escapeHtml(ui.closeTitle) + '">×</button>' +
      "</div></header>" +
      '<div class="kiki-chat-messages" id="kiki-chat-messages"></div>' +
      '<div class="kiki-chat-chips" id="kiki-chat-chips"></div>' +
      '<footer class="kiki-chat-footer"><div class="kiki-chat-input-row">' +
      '<textarea id="kiki-chat-input" rows="1" placeholder="' + escapeHtml(ui.placeholder) + '"></textarea>' +
      '<button type="button" class="kiki-chat-send" id="kiki-chat-send" disabled aria-label="Send">' +
      '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M10 15V5M10 5L6 9M10 5L14 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>' +
      "</div></footer>";
    root.appendChild(trigger);
    root.appendChild(panel);
    document.body.appendChild(root);

    var msgsEl = $("#kiki-chat-messages"), chipsEl = $("#kiki-chat-chips");
    var input = $("#kiki-chat-input"), sendBtn = $("#kiki-chat-send");
    var messages = loadMessages();

    function applyPanelLang(nextLang) {
      lang = nextLang === "zh" ? "zh" : "en";
      setChatLang(lang);
      ui = CHAT_UI[lang] || CHAT_UI.en;
      panel.setAttribute("data-kiki-lang", lang);
      var sub = panel.querySelector(".kiki-chat-header__sub");
      if (sub) sub.textContent = ui.headerSub;
      input.placeholder = ui.placeholder;
      panel.querySelector("[data-kiki-reset]").title = ui.resetTitle;
      panel.querySelector("[data-kiki-close]").title = ui.closeTitle;
      var lbl = trigger.querySelector(".kiki-chat-trigger__label");
      if (lbl) lbl.textContent = ui.triggerLabel;
      trigger.setAttribute("aria-label", ui.triggerLabel);
      var sw = panel.querySelector(".kiki-chat-lang-switch");
      if (sw) sw.setAttribute("data-active", lang);
      panel.querySelectorAll(".kiki-chat-lang-switch__btn").forEach(function (btn) {
        var active = btn.getAttribute("data-kiki-lang") === lang;
        btn.classList.toggle("kiki-chat-lang-switch__btn--active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderChips();
    }

    function renderChips() {
      chipsEl.innerHTML = "";
      FAQ_ITEMS.filter(function (i) { return i && i.chip; }).forEach(function (item) {
        var label = getFaqQ(item, lang);
        if (!label) return;
        var c = el("button", "kiki-chat-chip", label);
        c.type = "button";
        c.addEventListener("click", function () { submitUser(label); });
        chipsEl.appendChild(c);
      });
    }

    function appendBubble(role, text) {
      var b = el("div", "kiki-chat-bubble kiki-chat-bubble--" + role);
      if (role === "bot") setBotBubbleContent(b, text); else b.textContent = text;
      msgsEl.appendChild(b);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function showTyping() { var t = el("div","kiki-chat-typing"); t.id="kiki-chat-typing"; t.innerHTML="<span></span><span></span><span></span>"; msgsEl.appendChild(t); msgsEl.scrollTop=msgsEl.scrollHeight; }
    function hideTyping() { var t=$("#kiki-chat-typing"); if(t) t.remove(); }

    function renderHistory() {
      msgsEl.innerHTML = "";
      if (!messages.length) appendBubble("bot", ui.welcome);
      else messages.forEach(function (m) { appendBubble(m.role==="user"?"user":"bot", m.text); });
      renderChips();
    }

    function streamReply(text, done) {
      hideTyping();
      var b = el("div","kiki-chat-bubble kiki-chat-bubble--bot");
      msgsEl.appendChild(b);
      var i = 0;
      var iv = setInterval(function () {
        i += Math.max(1, Math.floor(text.length/40));
        b.classList.remove("kiki-chat-bubble--rich");
        b.textContent = text.slice(0, i);
        msgsEl.scrollTop = msgsEl.scrollHeight;
        if (i >= text.length) { clearInterval(iv); setBotBubbleContent(b, text); if (done) done(); }
      }, 14);
    }

    function submitUser(text) {
      var q = (text||"").trim();
      if (!q || chatState.busy) return;
      chatState.busy = true; sendBtn.disabled = true;
      appendBubble("user", q); messages.push({role:"user",text:q}); saveMessages(messages);
      input.value = ""; chipsEl.innerHTML = ""; showTyping();
      var answer = buildFaqAnswer(q, lang);
      setTimeout(function () {
        streamReply(answer, function () {
          messages.push({role:"bot",text:answer}); saveMessages(messages);
          chatState.busy = false; sendBtn.disabled = !input.value.trim(); renderChips();
        });
      }, 400);
    }

    function setOpen(open) {
      chatState.open = open;
      panel.classList.toggle("kiki-chat-panel--open", open);
      trigger.classList.toggle("kiki-chat-trigger--hidden", open);
      document.body.classList.toggle("kiki-chat-open", open);
      try { syncSiteSwitchWithChatOpen(open); } catch (e) {}
      if (open) { applyPanelLang(getChatLang()); renderHistory(); setTimeout(function(){input.focus();},350); }
    }

    trigger.addEventListener("click", function () { setOpen(!chatState.open); });
    panel.querySelector("[data-kiki-close]").addEventListener("click", function () { setOpen(false); });
    panel.querySelector("[data-kiki-reset]").addEventListener("click", function () { messages=[]; saveMessages(messages); renderHistory(); });
    panel.querySelectorAll(".kiki-chat-lang-switch__btn").forEach(function (btn) {
      btn.addEventListener("click", function () { var next=btn.getAttribute("data-kiki-lang"); if(next&&next!==lang) applyPanelLang(next); });
    });
    input.addEventListener("input", function () { sendBtn.disabled = !input.value.trim()||chatState.busy; });
    input.addEventListener("keydown", function (e) { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitUser(input.value);} });
    sendBtn.addEventListener("click", function () { submitUser(input.value); });

    window.kikiOpenChat = function () { setOpen(true); };
    applyPanelLang(lang);
    renderHistory();
    chatMounted = true;

    setTimeout(function () {
      var lbl = trigger.querySelector(".kiki-chat-trigger__label");
      if (lbl) { lbl.classList.add("kiki-chat-trigger__label--show"); setTimeout(function(){lbl.classList.remove("kiki-chat-trigger__label--show");},3500); }
    }, 1500);
  }

  /* ─── CV / Resume download ─── */
  var resumeHooked = false;
  function initResumeDownload() {
    if (resumeHooked) return;
    resumeHooked = true;
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest('[role="link"].css-pygunn');
      if (!btn || btn.closest("#kiki-chat-root")) return;
      var lab = (btn.textContent||"").replace(/\s+/g," ").trim();
      if (!/^resume\b/i.test(lab) && !/^简历\b/.test(lab)) return;
      e.preventDefault(); e.stopPropagation();
      if (typeof e.stopImmediatePropagation==="function") e.stopImmediatePropagation();
      try {
        var a = document.createElement("a");
        a.href = KIKI_CV_SRC; a.download = KIKI_CV_DOWNLOAD_NAME; a.rel = "noopener";
        document.body.appendChild(a); a.click(); a.remove();
      } catch (err) { window.location.href = KIKI_CV_SRC; }
    }, true);
  }

  /* ─── Project TOC ─── */
  var __tocMo = null;
  var __tocIo = null;
  var __tocBuildTimer = null;
  var __tocLastPath = "";
  var __tocLastLang = "";
  var __tocLangMo = null;

  function syncTocBodyClass() {
    var toc = document.getElementById("kiki-toc");
    var visible = !!(toc && isProjectDetailPage() && window.innerWidth > 1280);
    document.body.classList.toggle("kiki-has-toc", visible);
  }

  function isProjectDetailPage() {
    if (!/^\/project(-\d+)?$/.test(location.pathname)) return false;
    // A true project detail page contains a "Go Back" link
    var all = document.querySelectorAll("#container a, #container p, #container span");
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || "").trim();
      if (t === "Go Back" || t === "← Back" || t === "返回") return true;
    }
    return false;
  }

  function isHomePage() {
    var path = normalizeNavPath(location.pathname || "");
    return path === "/" || path === "/index.html";
  }

  /** All pages except homepage — hide Resume in top bar. */
  function isInnerSitePage() {
    return !isHomePage();
  }

  function linkIsResumeControl(node) {
    if (!node) return false;
    var txt = (node.innerText || node.textContent || "").trim();
    if (/^resume\b/i.test(txt) || /^简历\b/.test(txt)) return true;
    return navLinkMatchesLabel(txt, "resume");
  }

  function repairTopNavAfterResumeHide() {
    var root = document.getElementById("container") || document.body;
    Array.from(root.querySelectorAll('[data-kiki-hidden="resume-inner"]')).forEach(function (block) {
      var txt = normalizeMatchText(block.innerText || "");
      if (/about|portfolio|kiki\s*portfolio|关于|作品集/i.test(txt)) {
        block.style.removeProperty("display");
        block.style.removeProperty("visibility");
        block.style.removeProperty("width");
        block.style.removeProperty("min-width");
        block.style.removeProperty("margin");
        block.style.removeProperty("padding");
        block.style.removeProperty("overflow");
        block.removeAttribute("data-kiki-hidden");
        block.removeAttribute("aria-hidden");
      }
    });
    var row = getPrimaryNavRow();
    if (row) {
      row.style.removeProperty("display");
      row.style.removeProperty("visibility");
      row.style.setProperty("opacity", "1", "important");
    }
    ["portfolio", "about"].forEach(function (type) {
      var link = getNavLinkByLabel(root, type);
      if (!link) return;
      var el = link;
      for (var up = 0; up < 5 && el; up++) {
        if (el.getBoundingClientRect().top > 240) break;
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
        el.style.removeProperty("width");
        el.style.removeProperty("height");
        el.removeAttribute("data-kiki-hidden");
        el.removeAttribute("aria-hidden");
        el = el.parentElement;
      }
    });
  }

  function hideNavResumeControl(scope) {
    var root = scope || document.getElementById("container") || document.body;
    repairTopNavAfterResumeHide();
    Array.from(root.querySelectorAll('a, [role="link"], button')).forEach(function (node) {
      if (!linkIsResumeControl(node)) return;
      var r = node.getBoundingClientRect();
      if (r.top > 220 || r.bottom < 0) return;
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.setAttribute("data-kiki-hidden", "resume-inner");
      node.setAttribute("aria-hidden", "true");
    });
    repairTopNavAfterResumeHide();
  }

  function restoreNavResumeControl(scope) {
    var root = scope || document.getElementById("container") || document.body;
    Array.from(root.querySelectorAll('[data-kiki-hidden="resume-inner"]')).forEach(function (block) {
      block.style.removeProperty("display");
      block.style.removeProperty("visibility");
      block.removeAttribute("data-kiki-hidden");
      block.removeAttribute("aria-hidden");
    });
  }

  function syncInnerPageNavChrome() {
    var inner = isInnerSitePage();
    document.documentElement.setAttribute("data-kiki-inner-page", inner ? "1" : "0");
    if (inner) {
      hideNavResumeControl();
      repairTopNavAfterResumeHide();
      var wrap = document.querySelector(".kiki-site-lang-switch");
      var row = getPrimaryNavRow();
      if (wrap && row) {
        wrap.removeAttribute("data-kiki-site-switch-fixed");
        if (wrap.parentElement === document.body) {
          var about = getNavLinkByLabel(row, "about") || getNavLinkByLabel(document.getElementById("container"), "about");
          if (about && about.parentElement) about.parentElement.insertBefore(wrap, about);
          else row.appendChild(wrap);
        }
        ensurePrimaryNavLayout(row, wrap);
        forceSwitchBeforeAbout(row, wrap);
      }
    } else {
      restoreNavResumeControl();
    }
  }

  function kikiDebounceFn(fn, ms) {
    var t; return function(){ clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function findProjectContainer() {
    // Find the project detail container by locating "Go Back" and walking up
    var all = Array.from(document.querySelectorAll("#container a, #container p, #container span"));
    var goBack = null;
    for (var i = 0; i < all.length; i++) {
      var txt = (all[i].innerText || "").trim();
      if (txt === "Go Back" || txt === "← Back" || txt === "返回") { goBack = all[i]; break; }
    }
    if (!goBack) return null;
    // Walk up 8 levels to find a container that includes section headings
    var el = goBack;
    for (var j = 0; j < 8; j++) {
      if (!el.parentElement || el.parentElement === document.body) break;
      el = el.parentElement;
    }
    return el;
  }

  var TOC_MAX_ITEMS = 8;
  var TOC_EN_METHOD_KEYWORDS = [
    "market", "user", "competitor", "insight", "strategy", "direction",
    "design", "validation", "iteration", "solution", "research", "analysis"
  ];
  var TOC_ZH_METHOD_KEYWORDS = [
    "市场", "用户", "竞品", "洞察", "策略", "方向",
    "设计", "验证", "迭代", "方案", "研究", "分析"
  ];
  var TOC_EXACT_SKIP = /^(Go Back|kiki Portfolio|About|Resume|BASE|CONTACT|SOCIAL|LinkedIn|Redbook|See Project|Call to action|See more|EN|中文|ToC|ToB|My work|For APP|For Installers|For Owners|For installers|For owners|APP Iteration Background|Competitive trends|Market Insights)$/i;
  var TOC_ROLE_NOISE = /\b(designer|researcher|manager|director|engineer|intern|founder|consultant|lead|specialist|analyst|po|pm|owner|stakeholder|student)\b|设计师|研究员|经理|总监|工程师|实习|顾问|负责人|产品经理|项目经理|岗位|角色/i;
  var TOC_TOOL_NOISE = /\b(figma|sketch|photoshop|illustrator|excel|spss|jira|notion|miro|axure|framer|chatgpt|cursor|codex)\b|工具|软件/i;
  var TOC_CITATION_NOISE = /\b(source|reference|citation|quote|quoted|by)\b|et\s+al\.?|引用|参考|出处|来源/i;
  var TOC_COMMON_NAME_PREFIX = /^(Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+/i;

  function normalizeTocText(txt) {
    return String(txt || "")
      .replace(/\u00a0/g, " ")
      .replace(/\u200b/g, "")
      .replace(/[–—]/g, "-")
      .replace(/[(){}\[\],.;:!?/\\|"'`~@#$%^&*_+=<>]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasMethodKeyword(txt) {
    var normalized = normalizeTocText(txt);
    if (!normalized) return false;
    var lower = normalized.toLowerCase();
    for (var i = 0; i < TOC_EN_METHOD_KEYWORDS.length; i++) {
      var enKey = TOC_EN_METHOD_KEYWORDS[i];
      var re = new RegExp("\\b" + enKey + "\\b", "i");
      if (re.test(lower)) return true;
    }
    for (var j = 0; j < TOC_ZH_METHOD_KEYWORDS.length; j++) {
      if (normalized.indexOf(TOC_ZH_METHOD_KEYWORDS[j]) >= 0) return true;
    }
    return false;
  }

  function countMethodKeywordHits(txt) {
    var normalized = normalizeTocText(txt);
    var lower = normalized.toLowerCase();
    var score = 0;
    for (var i = 0; i < TOC_EN_METHOD_KEYWORDS.length; i++) {
      if (new RegExp("\\b" + TOC_EN_METHOD_KEYWORDS[i] + "\\b", "i").test(lower)) score++;
    }
    for (var j = 0; j < TOC_ZH_METHOD_KEYWORDS.length; j++) {
      if (normalized.indexOf(TOC_ZH_METHOD_KEYWORDS[j]) >= 0) score++;
    }
    return score;
  }

  function isLikelyPersonName(txt) {
    var normalized = normalizeTocText(txt);
    if (!normalized) return false;
    if (TOC_COMMON_NAME_PREFIX.test(normalized)) return true;
    if (/^(Alain|Thomas|Malte Gerke|Mariusz Jackiewicz)$/i.test(normalized)) return true;
    if (/^[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){0,2}$/.test(normalized)) return true;
    return false;
  }

  function isTocNoiseTitle(txt) {
    var normalized = normalizeTocText(txt);
    if (!normalized) return true;
    if (TOC_EXACT_SKIP.test(normalized)) return true;
    if (/^\d+$/.test(normalized)) return true;
    if (normalized.length < 4) return true;
    if (isLikelyPersonName(normalized)) return true;
    if (TOC_ROLE_NOISE.test(normalized)) return true;
    if (TOC_TOOL_NOISE.test(normalized)) return true;
    if (TOC_CITATION_NOISE.test(normalized)) return true;
    return false;
  }

  function isMethodologyHeading(txt) {
    if (isTocNoiseTitle(txt)) return false;
    var normalized = normalizeTocText(txt).toLowerCase();
    if (/^conclusion$/i.test(normalized) || normalized === "结论") return true;
    return hasMethodKeyword(txt);
  }

  function rankHeadingForFallback(item) {
    var score = countMethodKeywordHits(item.text) * 10;
    if (/分析|研究|洞察|验证|迭代|策略|方向|方案|analysis|research|insight|validation|iteration|strategy|direction|solution/i.test(item.text)) {
      score += 3;
    }
    if (item.fs >= 36) score += 2;
    return score;
  }

  var SOLPLANET_TOC_PATH_RE = /^\/project(?:-\d+)?$/;
  var SOLPLANET_PAGE_MARKERS = [
    "solplanet smart energy app",
    "solplanet",
    "aiswei",
    "ai mode",
    "smart energy"
  ];

  /* ── SenseLink JCV custom TOC ── */
  // "sensemercury" only appears in project-4 (SenseLink); project-7 (SenseThunder)
  // also has "machine management" / "temperature measurement" text in its Other-Projects
  // footer, so those terms must NOT be used as SenseLink markers.
  var SENSELINK_PAGE_MARKERS = [
    "sensemercury",
    "jcv sensemercury"
  ];
  var DESIGN_WALKTHROUGH_HEADING_RE = /\bdesign\s*walk\s*through\b/i;
  var SENSELINK_TOC_FOOTER_NOISE_RE =
    /^(other\s*projects|see\s*project|connect\s*with\s*me|decathlon\s*dpcp|dpcp\s*3y|pain\s*points|ux\s*strategy|business\s*process|business\s*module|vitamin\s*play|cockpit|portal)/i;

  /* ── SenseThunder JCV custom TOC ── */
  var SENSETHUNDER_PAGE_MARKERS = [
    "physical product",
    "control panel",
    "display content design"
  ];
  var SENSETHUNDER_CUSTOM_TOC_ITEMS = [
    {
      labelEn: "Product Overview",
      labelZh: "产品概览",
      terms: ["physical product", "sensethunder jcv-"]
    },
    {
      labelEn: "User Persona",
      labelZh: "用户画像",
      terms: ["user persona", "用户画像"]
    },
    {
      labelEn: "User Research",
      labelZh: "用户研究",
      terms: ["user research", "summary and report / thunder air", "用户研究"]
    },
    {
      labelEn: "Usability Testing",
      labelZh: "可用性测试",
      terms: ["user test + feedback + live + record", "user test + feedback", "可用性测试"]
    },
    {
      labelEn: "UI Design",
      labelZh: "界面设计",
      terms: ["out of the box", "unpack the box", "界面设计"]
    }
  ];

  /* ── Mobile Banking Research (University of York) custom TOC ── */
  var MOBILE_BANKING_PAGE_MARKERS = [
    "mobile banking research",
    "cross-cultural study on",
    "secondary research",
    "primary research",
    "university of york"
  ];
  var MOBILE_BANKING_CUSTOM_TOC_ITEMS = [
    {
      labelEn: "Research Overview",
      labelZh: "研究概述",
      terms: ["cross-cultural study", "user experience design in mobile banking", "移动银行用户体验"]
    },
    {
      labelEn: "Secondary Research",
      labelZh: "二手研究",
      terms: ["secondary research", "二手研究"]
    },
    {
      labelEn: "Primary Research",
      labelZh: "一手研究",
      terms: ["primary research", "一手研究"]
    },
    {
      labelEn: "Data Analysis",
      labelZh: "数据分析",
      terms: ["data analysis", "数据分析"]
    },
    {
      labelEn: "Conclusion",
      labelZh: "结论",
      terms: ["conclusion", "结论"]
    }
  ];

  /* ── HUWEI & NUS AR Smart Glass ── */
  var HUWEI_PAGE_MARKERS = [
    "huwei & nus ar smart glass",
    "huawei & nus",
    "puppyland",
    "puppy land",
    "ar smart glass",
    "hololens",
    "ar+ pets",
    "judges choice award"
  ];
  var PROJECT_FOOTER_CUTOFF_RE = /^other\s*projects$/i;
  var DECATHLON_TOC_SECTION_RE =
    /^(dpcp|decathlon|pain\s*points|ux\s*strategy|business\s*process|business\s*module|vitamin\s*play|cockpit|portal|uems|project\s*content)/i;
  var HUWEI_CUSTOM_TOC_ITEMS = [
    {
      labelEn: "Project Overview",
      labelZh: "项目概述",
      terms: ["puppyland", "hololens", "ar smart glass", "huwei & nus", "deceased pets", "ar application"]
    },
    {
      labelEn: "AR+ Pets",
      labelZh: "AR+ 宠物",
      terms: ["ar+ pets", "ar pets", "puppy land"]
    },
    {
      labelEn: "UI Design",
      labelZh: "界面设计",
      terms: ["ui design", "interaction design", "interface design", "界面设计", "交互设计"]
    },
    {
      labelEn: "Award",
      labelZh: "获奖",
      terms: ["judges choice", "judges' choice", "award", "huawei & nus"]
    }
  ];

  /* ── Decathlon custom TOC ── */
  var DECATHLON_PAGE_MARKERS = [
    "decathlon dpcp",
    "decathlon dpcp - global supply",
    "global supply chain",
    "supply chain automation"
  ];
  var DECATHLON_CUSTOM_TOC_ITEMS = [
    {
      labelEn: "DPCP 3Y Mission",
      labelZh: "DPCP 三年愿景",
      terms: ["dpcp 3y mission", "3y mission", "dpcp mission", "mission", "3year", "3 year"]
    },
    {
      labelEn: "Pain Points",
      labelZh: "痛点分析",
      terms: ["pain points", "pain point", "painpoints", "痛点", "problem"]
    },
    {
      labelEn: "UX Strategy",
      labelZh: "UX 策略",
      terms: ["ux strategy", "strategy", "策略", "方向"]
    },
    {
      labelEn: "Business Process Canvas",
      labelZh: "业务流程画布",
      terms: ["business process canvas", "process canvas", "bpc", "business process", "流程画布", "流程"]
    },
    {
      labelEn: "Business Module System",
      labelZh: "业务模块系统",
      terms: ["business module system", "bms", "module system", "business module", "模块系统", "模块"]
    },
    {
      labelEn: "Vitamin Play",
      labelZh: "Vitamin 玩法",
      terms: ["vitamin play", "vitamin", "维生素"]
    },
    {
      labelEn: "Cockpit",
      labelZh: "驾驶舱视图",
      terms: ["project content -cockpit", "cockpit", "content -cockpit", "驾驶舱"]
    },
    {
      labelEn: "Portal",
      labelZh: "门户视图",
      terms: ["project content -portal", "portal", "content -portal", "门户"]
    }
  ];
  var CUSTOM_METHOD_TOC_ITEMS = [
    {
      labelZh: "市场分析",
      labelEn: "Market Analysis",
      terms: ["market insights", "market", "市场", "trend", "trends", "insights"]
    },
    {
      labelZh: "用户分析",
      labelEn: "User Analysis",
      terms: ["user research", "user", "research", "用户", "研究"]
    },
    {
      labelZh: "竞品分析",
      labelEn: "Competitive Analysis",
      terms: ["competitive", "benchmark", "competitor", "竞品", "对标", "comparison"]
    },
    {
      labelZh: "设计洞察",
      labelEn: "Design Insights",
      terms: ["design insight", "insight", "direction", "设计洞察", "洞察", "方向"]
    },
    {
      labelZh: "多场景应用",
      labelEn: "Multi-scenario Application",
      terms: ["multi-scenario adaptation", "multi scenario adaptation", "multi-scenario", "多场景"]
    },
    {
      labelZh: "数据可视化",
      labelEn: "Data Visualization",
      terms: ["data visualization", "visualization", "可视化", "sankey", "chart"]
    },
    {
      labelZh: "AI模式",
      labelEn: "AI Mode",
      terms: ["ai mode", "ems function", "ems", "ai模式", "ai model"]
    }
  ];

  function findProjectFooterCutoffY(scope) {
    var pageH = Math.max(document.body.scrollHeight, 1000);
    var cutoff = pageH * 0.92;
    if (!scope) return cutoff;
    var markers = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    for (var i = 0; i < markers.length; i++) {
      var txt = normalizeTocText(markers[i].innerText || "");
      if (!txt || txt.length > 90) continue;
      if (!PROJECT_FOOTER_CUTOFF_RE.test(txt) && !/^other\s*projects$/i.test(txt)) continue;
      var top = markers[i].getBoundingClientRect().top + window.scrollY;
      if (top > pageH * 0.32) cutoff = Math.min(cutoff, top - 80);
    }
    return cutoff;
  }

  function getProjectPrimaryTitle() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return "";
    var nodes = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    var goBackIdx = -1;
    for (var i = 0; i < nodes.length; i++) {
      var raw = (nodes[i].innerText || "").trim();
      if (/^(go back|← back|返回)$/i.test(raw)) {
        goBackIdx = i;
        break;
      }
    }
    var footerY = findProjectFooterCutoffY(scope);
    var start = goBackIdx >= 0 ? goBackIdx + 1 : 0;
    for (var j = start; j < nodes.length; j++) {
      var el = nodes[j];
      if (el.children.length > 0) continue;
      var txt = (el.innerText || "").trim();
      if (!txt || txt.length < 8 || txt.length > 160) continue;
      if (/^(go back|← back|返回)$/i.test(txt)) continue;
      if (/^dpcp\s*3y\s*mission$/i.test(normalizeTocText(txt))) continue;
      var style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      var fs = parseFloat(style.fontSize);
      if (fs < 24) continue;
      var top = el.getBoundingClientRect().top + window.scrollY;
      if (top > footerY) break;
      return normalizeTocText(txt).toLowerCase();
    }
    return "";
  }

  function getProjectPageScopedSnapshot() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return "";
    var footerY = findProjectFooterCutoffY(scope);
    var parts = [];
    Array.from(scope.querySelectorAll("p, h1, h2, h3, h4")).forEach(function (el) {
      var top = el.getBoundingClientRect().top + window.scrollY;
      if (top > footerY) return;
      var txt = normalizeTocText(el.innerText || "");
      if (txt && txt.length < 220) parts.push(txt);
    });
    return parts.join(" ").toLowerCase();
  }

  function getProjectPageTextSnapshot() {
    var scoped = getProjectPageScopedSnapshot();
    if (scoped) return scoped;
    var container = document.querySelector("#container");
    if (!container) return "";
    return normalizeTocText(container.innerText || "").toLowerCase();
  }

  function resolveProjectTocKind() {
    if (!/^\/project(-\d+)?$/.test(location.pathname || "")) return "";
    var snapshot = getProjectPageScopedSnapshot();
    var primary = getProjectPrimaryTitle();
    var path = normalizeNavPath(location.pathname || "");

    for (var sl = 0; sl < SENSELINK_PAGE_MARKERS.length; sl++) {
      if (snapshot.indexOf(SENSELINK_PAGE_MARKERS[sl]) >= 0) return "senselink";
    }

    if (!/huwei|huawei|puppyland|decathlon|dpcp\s*3y|ar\s*smart/i.test(primary)) {
      for (var st = 0; st < SENSETHUNDER_PAGE_MARKERS.length; st++) {
        if (snapshot.indexOf(SENSETHUNDER_PAGE_MARKERS[st]) >= 0) return "sensethunder";
      }
    }

    if (path === "/project-8") return "mobilebanking";
    if (/mobile banking|university of york|lloyds bank/i.test(primary)) return "mobilebanking";
    for (var mb = 0; mb < MOBILE_BANKING_PAGE_MARKERS.length; mb++) {
      if (snapshot.indexOf(MOBILE_BANKING_PAGE_MARKERS[mb]) >= 0) return "mobilebanking";
    }

    if (SOLPLANET_TOC_PATH_RE.test(path)) {
      for (var sp = 0; sp < SOLPLANET_PAGE_MARKERS.length; sp++) {
        if (snapshot.indexOf(SOLPLANET_PAGE_MARKERS[sp]) >= 0) return "solplanet";
      }
    }

    for (var hw = 0; hw < HUWEI_PAGE_MARKERS.length; hw++) {
      if (snapshot.indexOf(HUWEI_PAGE_MARKERS[hw]) >= 0) return "huwei";
    }

    if (/huwei|huawei|puppyland|puppy\s*land|ar\s*smart\s*glass|ar\+\s*pets/i.test(primary)) {
      return "huwei";
    }

    if (
      /huwei\s*nus|huawei\s*nus|puppyland|puppy\s*land|ar\s*smart\s*glass|ar\+\s*pets|judges\s*choice|design\s*background|three\s*million\s*pets/i.test(
        snapshot
      )
    ) {
      return "huwei";
    }

    if (/decathlon|global\s*supply\s*chain/i.test(primary) && !/huwei|huawei|puppyland/i.test(primary)) {
      return "decathlon";
    }
    if (
      snapshot.indexOf("decathlon dpcp") >= 0 ||
      snapshot.indexOf("global supply chain") >= 0
    ) {
      return "decathlon";
    }
    return "";
  }

  function isHuweiARProjectPage() {
    return resolveProjectTocKind() === "huwei";
  }

  function isSolplanetProjectPage() {
    return resolveProjectTocKind() === "solplanet";
  }

  function isSenseLinkJCVPage() {
    return resolveProjectTocKind() === "senselink";
  }

  function isSenseThunderJCVPage() {
    return resolveProjectTocKind() === "sensethunder";
  }

  function isMobileBankingProjectPage() {
    return resolveProjectTocKind() === "mobilebanking";
  }

  function isDecathlonProjectPage() {
    return resolveProjectTocKind() === "decathlon";
  }

  function isDecathlonTocSectionNoise(txt) {
    return DECATHLON_TOC_SECTION_RE.test(normalizeTocText(txt));
  }

  var HUWEI_DECATHLON_STRAY_HEADING_RE = /^dpcp\s*3y\s*mission$/i;
  var HUWEI_CONTENT_SIGNAL_RE =
    /huwei|huawei|puppyland|puppy\s*land|ar\s*smart\s*glass|design\s*background|three\s*million\s*pets|brainstorm/i;

  function pageHasHuweiProjectContent() {
    if (!/^\/project(-\d+)?$/.test(location.pathname || "")) return false;
    if (isHuweiARProjectPage()) return true;
    return HUWEI_CONTENT_SIGNAL_RE.test(getProjectPageTextSnapshot());
  }

  function elementTextIsDpcpStrayHeading(el) {
    if (!el) return false;
    var txt = normalizeTocText((el.innerText || el.textContent || "").trim());
    if (!txt || txt.length > 100) return false;
    return HUWEI_DECATHLON_STRAY_HEADING_RE.test(txt);
  }

  function hideDecathlonStrayBlock(el, scope) {
    var txt = normalizeTocText((el.innerText || "").trim());
    var block = el;
    for (var up = 0; up < 6 && block.parentElement && block.parentElement !== scope; up++) {
      var parent = block.parentElement;
      var parentTxt = normalizeTocText((parent.innerText || "").trim());
      if (parentTxt === txt) block = parent;
      else break;
    }
    block.style.setProperty("display", "none", "important");
    block.style.setProperty("visibility", "hidden", "important");
    block.style.setProperty("height", "0", "important");
    block.style.setProperty("margin", "0", "important");
    block.style.setProperty("padding", "0", "important");
    block.style.setProperty("overflow", "hidden", "important");
    block.setAttribute("data-kiki-hidden", "decathlon-stray");
    block.setAttribute("aria-hidden", "true");
  }

  /** Hide Decathlon stray heading leaked into HUWEI /project-6 Figma export. */
  function removeHuweiDecathlonStrayHeadings() {
    if (!pageHasHuweiProjectContent()) return;
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return;
    var nodes = scope.querySelectorAll("p, h1, h2, h3, h4, div, span");
    nodes.forEach(function (el) {
      if (!el || el.getAttribute("data-kiki-hidden") === "decathlon-stray") return;
      if (!elementTextIsDpcpStrayHeading(el)) return;
      var kids = Array.from(el.children || []);
      for (var k = 0; k < kids.length; k++) {
        if (elementTextIsDpcpStrayHeading(kids[k])) return;
      }
      hideDecathlonStrayBlock(el, scope);
    });
  }

  function collectHuweiSectionCandidates() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var footerY = findProjectFooterCutoffY(scope);
    var all = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    var seen = new Set();
    var rows = [];
    all.forEach(function (node) {
      if (!node || !node.getBoundingClientRect) return;
      var txt = (node.innerText || "").trim();
      if (!txt || txt.length < 3 || txt.length > 120) return;
      if (isDecathlonTocSectionNoise(txt)) return;
      if (PROJECT_FOOTER_CUTOFF_RE.test(normalizeTocText(txt))) return;
      if (/^[\u200b\s]+$/.test(txt)) return;
      var anchor = node.closest ? node.closest("p, h1, h2, h3, h4") : node;
      if (!anchor || !anchor.getBoundingClientRect) anchor = node;
      var style = window.getComputedStyle(anchor);
      if (style.display === "none" || style.visibility === "hidden") return;
      var fs = parseFloat(style.fontSize);
      if (fs < 14 || fs > 120) return;
      var top = anchor.getBoundingClientRect().top + window.scrollY;
      if (top < 280 || top > footerY) return;
      var key = normalizeTocText(txt).toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      rows.push({ el: anchor, text: txt.split(/\n+/)[0].trim(), fs: Math.round(fs), top: Math.round(top) });
    });
    rows.sort(function (a, b) { return a.top - b.top; });
    return rows;
  }

  function findHuweiAnchors() {
    var candidates = collectHuweiSectionCandidates();
    if (!candidates.length) return findProjectHeadings();
    var tocItems = HUWEI_CUSTOM_TOC_ITEMS;
    var assigned = new Array(tocItems.length).fill(null);
    var cursor = 0;
    for (var i = 0; i < tocItems.length; i++) {
      for (var j = cursor; j < candidates.length; j++) {
        if (matchCustomSectionScore(candidates[j].text, tocItems[i].terms) <= 0) continue;
        assigned[i] = candidates[j];
        cursor = j + 1;
        break;
      }
    }
    for (var b = assigned.length - 2; b >= 0; b--) {
      if (!assigned[b] && assigned[b + 1]) assigned[b] = assigned[b + 1];
    }
    var hasAny = assigned.some(function (it) { return !!it; });
    if (!hasAny) {
      return candidates.slice(0, Math.min(4, candidates.length)).map(function (item, idx) {
        if (!item.el.id || !/^kiki-(?:s|cm)-/.test(item.el.id)) item.el.id = "kiki-cm-hw-" + idx;
        return { el: item.el, text: item.text, fs: item.fs, top: item.top };
      });
    }
    return tocItems.map(function (item, idx) {
      var target = assigned[idx];
      if (!target) return null;
      if (!target.el.id || !/^kiki-(?:s|cm)-/.test(target.el.id)) target.el.id = "kiki-cm-hw-" + idx;
      return {
        el: target.el,
        text: getCustomTocLabel(item),
        fs: target.fs,
        top: target.top
      };
    }).filter(Boolean);
  }

  function getCustomTocLabel(item) {
    var lang = getSiteLang();
    if (lang === "zh") return item.labelZh || item.labelEn || "";
    return item.labelEn || item.labelZh || "";
  }

  function isDesignWalkthroughHeading(txt) {
    var normalized = normalizeTocText(txt);
    if (!normalized) return false;
    return DESIGN_WALKTHROUGH_HEADING_RE.test(normalized);
  }

  function isSenseLinkTocFooterNoise(txt) {
    var normalized = normalizeTocText(txt).toLowerCase();
    if (!normalized) return true;
    if (SENSELINK_TOC_FOOTER_NOISE_RE.test(normalized)) return true;
    if (/^jcv\s*sense(thunder|mercury)$/i.test(normalized)) return true;
    if (/^senselink\s*jcv/i.test(normalized)) return true;
    return false;
  }

  function getSenseLinkWalkthroughLabelZh(labelEn) {
    var normalized = normalizeTocText(labelEn);
    if (!normalized) return "设计走查";
    var suffix = normalized.replace(/^design\s*walk\s*through\s*/i, "").replace(/^[-–—:\s]+/, "").trim();
    if (suffix && suffix.toLowerCase() !== "design walkthrough") {
      return "设计走查 · " + suffix;
    }
    return "设计走查";
  }

  function findSenseLinkFooterCutoffY(scope) {
    var pageH = Math.max(document.body.scrollHeight, 1000);
    var cutoff = pageH * 0.88;
    var markers = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    for (var i = 0; i < markers.length; i++) {
      var txt = normalizeTocText(markers[i].innerText || "");
      if (!txt || txt.length > 80) continue;
      if (!SENSELINK_TOC_FOOTER_NOISE_RE.test(txt) && !/^other\s*projects$/i.test(txt)) continue;
      var top = markers[i].getBoundingClientRect().top + window.scrollY;
      if (top > pageH * 0.35) cutoff = Math.min(cutoff, top - 100);
    }
    return cutoff;
  }

  function pickDesignWalkthroughAnchor(node, txt) {
    if (!node) return null;
    var tag = (node.tagName || "").toLowerCase();
    if (tag === "p" || /^h[1-4]$/.test(tag)) return node;
    var parent = node.closest && node.closest("p, h1, h2, h3, h4");
    if (parent && normalizeTocText(parent.innerText || "") === normalizeTocText(txt)) return parent;
    return node;
  }

  function findSenseLinkDesignWalkthroughHeadings() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var pageH = Math.max(document.body.scrollHeight, 1000);
    var footerY = findSenseLinkFooterCutoffY(scope);
    var minTop = 480;
    var nodes = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    var seen = new Set();
    var rows = [];

    nodes.forEach(function (node) {
      if (!node || !node.getBoundingClientRect) return;
      var txt = (node.innerText || "").trim();
      if (!txt || txt.length > 120 || txt.length < 8) return;
      if (!isDesignWalkthroughHeading(txt)) return;
      if (isSenseLinkTocFooterNoise(txt)) return;

      var style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return;
      var top = node.getBoundingClientRect().top + window.scrollY;
      if (top < minTop || top > footerY) return;

      var labelEn = normalizeTocText(txt);
      var key = labelEn.toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);

      var anchor = pickDesignWalkthroughAnchor(node, labelEn);
      if (!anchor) return;
      var fs = parseFloat(window.getComputedStyle(anchor).fontSize) || 24;
      rows.push({
        el: anchor,
        labelEn: labelEn,
        labelZh: getSenseLinkWalkthroughLabelZh(labelEn),
        fs: Math.round(fs),
        top: Math.round(top)
      });
    });

    rows.sort(function (a, b) { return a.top - b.top; });
    if (rows.length > TOC_MAX_ITEMS) rows = rows.slice(0, TOC_MAX_ITEMS);
    return rows;
  }

  function collectProjectSectionCandidates(minFontSize) {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var footerY = findProjectFooterCutoffY(scope);
    var all = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    var seen = new Set();
    var rows = [];
    var minFs = typeof minFontSize === "number" ? minFontSize : 24;
    all.forEach(function (node) {
      if (!node || node.children.length > 0) return;
      var txt = (node.innerText || "").trim();
      if (!txt || txt.length < 3 || txt.length > 90) return;
      if (/^[\u200b\s]+$/.test(txt)) return;
      if (PROJECT_FOOTER_CUTOFF_RE.test(normalizeTocText(txt))) return;
      if (isHuweiARProjectPage() && isDecathlonTocSectionNoise(txt)) return;
      var style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return;
      var fs = parseFloat(style.fontSize);
      if (fs < minFs || fs > 100) return;
      var top = node.getBoundingClientRect().top + window.scrollY;
      if (top < 350 || top > footerY) return;
      var key = normalizeTocText(txt).toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      rows.push({ el: node, text: txt, fs: Math.round(fs), top: Math.round(top) });
    });
    rows.sort(function (a, b) { return a.top - b.top; });
    return rows;
  }

  function matchCustomSectionScore(text, terms) {
    var normalized = normalizeTocText(text).toLowerCase();
    if (!normalized || !terms || !terms.length) return 0;
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = normalizeTocText(terms[i]).toLowerCase();
      if (!term) continue;
      if (normalized.indexOf(term) >= 0) score += term.length >= 10 ? 3 : 1;
    }
    return score;
  }

  function isSenseThunderTocNoise(txt) {
    var normalized = normalizeTocText(txt).toLowerCase();
    if (!normalized) return true;
    // Do not use isTocNoiseTitle here — isLikelyPersonName() treats "Physical Product" as a name.
    if (TOC_EXACT_SKIP.test(normalizeTocText(txt))) return true;
    if (/^jcv\s*sensethunder$/i.test(normalized)) return true;
    if (/^sensethunder\s*jcv/i.test(normalized)) return true;
    if (/^go\s*back$/i.test(normalized)) return true;
    if (/^connect\s*with\s*me/i.test(normalized)) return true;
    if (/^other\s*projects$/i.test(normalized)) return true;
    if (/^decathlon\s*dpcp/i.test(normalized)) return true;
    if (/^senselink\s*jcv/i.test(normalized)) return true;
    return false;
  }

  function findSenseThunderFooterCutoffY(scope) {
    var pageH = Math.max(document.body.scrollHeight, 1000);
    var cutoff = pageH * 0.88;
    var markers = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    for (var i = 0; i < markers.length; i++) {
      var txt = normalizeTocText(markers[i].innerText || "");
      if (!txt || txt.length > 80) continue;
      if (!/^other\s*projects$/i.test(txt) && !/^decathlon\s*dpcp/i.test(txt)) continue;
      var top = markers[i].getBoundingClientRect().top + window.scrollY;
      if (top > pageH * 0.35) cutoff = Math.min(cutoff, top - 100);
    }
    return cutoff;
  }

  function pickSenseThunderSectionNode(node, txt) {
    if (!node) return null;
    var tag = (node.tagName || "").toLowerCase();
    if (tag === "p" || /^h[1-4]$/.test(tag)) return node;
    var parent = node.closest && node.closest("p, h1, h2, h3, h4");
    if (parent && normalizeTocText(parent.innerText || "") === normalizeTocText(txt)) return parent;
    return node;
  }

  function collectSenseThunderSectionCandidates() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var pageH = Math.max(document.body.scrollHeight, 1000);
    var footerY = findSenseThunderFooterCutoffY(scope);
    var all = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    var seen = new Set();
    var rows = [];
    all.forEach(function (node) {
      if (!node || !node.getBoundingClientRect) return;
      var txt = (node.innerText || "").trim();
      if (!txt || txt.length < 3 || txt.length > 120) return;
      if (isSenseThunderTocNoise(txt)) return;
      if (/^[\u200b\s]+$/.test(txt)) return;
      var anchor = pickSenseThunderSectionNode(node, txt);
      if (!anchor || !anchor.getBoundingClientRect) return;
      var style = window.getComputedStyle(anchor);
      if (style.display === "none" || style.visibility === "hidden") return;
      var fs = parseFloat(style.fontSize);
      if (fs < 14 || fs > 120) return;
      var top = anchor.getBoundingClientRect().top + window.scrollY;
      if (top < 300 || top > footerY) return;
      var key = normalizeTocText(txt).toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      rows.push({ el: anchor, text: txt, fs: Math.round(fs), top: Math.round(top) });
    });
    rows.sort(function (a, b) { return a.top - b.top; });
    return rows;
  }

  function findSenseThunderAnchorByTerms(scope, terms) {
    if (!scope || !terms || !terms.length) return null;
    var nodes = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    for (var i = 0; i < nodes.length; i++) {
      var txt = (nodes[i].innerText || "").trim();
      if (!txt || txt.length > 120) continue;
      if (matchCustomSectionScore(txt, terms) <= 0) continue;
      var anchor = pickSenseThunderSectionNode(nodes[i], txt);
      if (!anchor) continue;
      var top = anchor.getBoundingClientRect().top + window.scrollY;
      return {
        el: anchor,
        text: txt.split(/\n+/)[0].trim() || getCustomTocLabel({ labelEn: terms[0], labelZh: terms[0] }),
        fs: Math.round(parseFloat(window.getComputedStyle(anchor).fontSize) || 16),
        top: Math.round(top)
      };
    }
    return null;
  }

  function findSenseThunderAnchors() {
    var tocItems = SENSETHUNDER_CUSTOM_TOC_ITEMS;
    var scope = findProjectContainer() || document.querySelector("#container");
    var candidates = collectSenseThunderSectionCandidates();
    var assigned = new Array(tocItems.length).fill(null);
    var usedEls = new Set();
    var cursor = 0;

    for (var i = 0; i < tocItems.length; i++) {
      var best = null;
      for (var j = cursor; j < candidates.length; j++) {
        var current = candidates[j];
        if (usedEls.has(current.el)) continue;
        var score = matchCustomSectionScore(current.text, tocItems[i].terms);
        if (score <= 0) continue;
        best = { idx: j, item: current };
        break;
      }
      if (best) {
        assigned[i] = best.item;
        usedEls.add(best.item.el);
        cursor = best.idx + 1;
      } else if (scope) {
        var fallback = findSenseThunderAnchorByTerms(scope, tocItems[i].terms);
        if (fallback && !usedEls.has(fallback.el)) {
          assigned[i] = fallback;
          usedEls.add(fallback.el);
        }
      }
    }

    for (var b = assigned.length - 2; b >= 0; b--) {
      if (!assigned[b] && assigned[b + 1]) assigned[b] = assigned[b + 1];
    }
    for (var f = 1; f < assigned.length; f++) {
      if (!assigned[f] && assigned[f - 1]) assigned[f] = assigned[f - 1];
    }

    var fallbackAnchor = assigned.filter(Boolean)[0] || (candidates.length ? candidates[0] : null);
    return tocItems.map(function (item, idx) {
      var target = assigned[idx] || fallbackAnchor;
      if (!target) return null;
      var label = getCustomTocLabel(item);
      var displayText = target.text || label;
      if (matchCustomSectionScore(displayText, item.terms) > 0) {
        var shortLine = (displayText.split(/\n+/)[0] || "").trim();
        if (shortLine && shortLine.length <= 80) label = shortLine;
      }
      if (!target.el.id || !/^kiki-(?:s|cm)-/.test(target.el.id)) target.el.id = "kiki-cm-st-" + idx;
      return { el: target.el, text: label, fs: target.fs, top: target.top };
    }).filter(Boolean);
  }

  function isMobileBankingTocNoise(txt) {
    var normalized = normalizeTocText(txt).toLowerCase();
    if (!normalized) return true;
    if (TOC_EXACT_SKIP.test(normalizeTocText(txt))) return true;
    if (/^mobile banking research$/i.test(normalized)) return true;
    if (/^go\s*back$/i.test(normalized)) return true;
    if (/^other\s*projects$/i.test(normalized)) return true;
    if (/^questionnaire$/i.test(normalized)) return true;
    if (/^decathlon\s*dpcp/i.test(normalized)) return true;
    return false;
  }

  function pickMobileBankingSectionNode(node, txt) {
    return pickSenseThunderSectionNode(node, txt);
  }

  function collectMobileBankingSectionCandidates() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var footerY = findSenseThunderFooterCutoffY(scope);
    var all = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    var seen = new Set();
    var rows = [];
    all.forEach(function (node) {
      if (!node || !node.getBoundingClientRect) return;
      var txt = (node.innerText || "").trim();
      if (!txt || txt.length < 3 || txt.length > 120) return;
      if (isMobileBankingTocNoise(txt)) return;
      if (/^[\u200b\s]+$/.test(txt)) return;
      var anchor = pickMobileBankingSectionNode(node, txt);
      if (!anchor || !anchor.getBoundingClientRect) return;
      var style = window.getComputedStyle(anchor);
      if (style.display === "none" || style.visibility === "hidden") return;
      var fs = parseFloat(style.fontSize);
      if (fs < 14 || fs > 100) return;
      var top = anchor.getBoundingClientRect().top + window.scrollY;
      if (top < 300 || top > footerY) return;
      var key = normalizeTocText(txt).toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      rows.push({ el: anchor, text: txt, fs: Math.round(fs), top: Math.round(top) });
    });
    rows.sort(function (a, b) { return a.top - b.top; });
    return rows;
  }

  function findMobileBankingAnchorByTerms(scope, terms) {
    if (!scope || !terms || !terms.length) return null;
    var nodes = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4, span, div"));
    var best = null;
    for (var i = 0; i < nodes.length; i++) {
      var txt = (nodes[i].innerText || "").trim();
      if (!txt || txt.length > 120) continue;
      if (isMobileBankingTocNoise(txt)) continue;
      if (matchCustomSectionScore(txt, terms) <= 0) continue;
      var anchor = pickMobileBankingSectionNode(nodes[i], txt);
      if (!anchor) continue;
      var top = anchor.getBoundingClientRect().top + window.scrollY;
      var row = {
        el: anchor,
        text: (txt.split(/\n+/)[0] || "").trim(),
        fs: Math.round(parseFloat(window.getComputedStyle(anchor).fontSize) || 16),
        top: Math.round(top)
      };
      if (!best || row.top < best.top) best = row;
    }
    return best;
  }

  function findMobileBankingAnchors() {
    var tocItems = MOBILE_BANKING_CUSTOM_TOC_ITEMS;
    var scope = findProjectContainer() || document.querySelector("#container");
    var candidates = collectMobileBankingSectionCandidates();
    var assigned = new Array(tocItems.length).fill(null);
    var usedEls = new Set();
    var cursor = 0;

    for (var i = 0; i < tocItems.length; i++) {
      var best = null;
      for (var j = cursor; j < candidates.length; j++) {
        var current = candidates[j];
        if (usedEls.has(current.el)) continue;
        var score = matchCustomSectionScore(current.text, tocItems[i].terms);
        if (score <= 0) continue;
        best = { idx: j, item: current };
        break;
      }
      if (best) {
        assigned[i] = best.item;
        usedEls.add(best.item.el);
        cursor = best.idx + 1;
      } else if (scope) {
        var fallback = findMobileBankingAnchorByTerms(scope, tocItems[i].terms);
        if (fallback && !usedEls.has(fallback.el)) {
          assigned[i] = fallback;
          usedEls.add(fallback.el);
        }
      }
    }

    return tocItems.map(function (item, idx) {
      var target = assigned[idx];
      if (!target) return null;
      if (!target.el.id || !/^kiki-(?:s|cm|mb)-/.test(target.el.id)) target.el.id = "kiki-cm-mb-" + idx;
      return {
        el: target.el,
        text: getCustomTocLabel(item),
        fs: target.fs,
        top: target.top
      };
    }).filter(Boolean);
  }

  function findCustomMethodologyAnchors() {
    var isSenseLink = isSenseLinkJCVPage();
    var isSenseThunder = !isSenseLink && isSenseThunderJCVPage();
    var isMobileBanking = !isSenseLink && !isSenseThunder && isMobileBankingProjectPage();
    var isHuwei = !isSenseLink && !isSenseThunder && !isMobileBanking && isHuweiARProjectPage();
    var isDecathlon =
      !isSenseLink && !isSenseThunder && !isMobileBanking && !isHuwei && isDecathlonProjectPage();
    var isSolplanet =
      !isSenseLink && !isSenseThunder && !isMobileBanking && !isHuwei && !isDecathlon && isSolplanetProjectPage();
    if (!isSenseLink && !isSenseThunder && !isMobileBanking && !isHuwei && !isSolplanet && !isDecathlon) {
      return [];
    }

    if (isSenseLink) {
      var walkthroughHeadings = findSenseLinkDesignWalkthroughHeadings();
      if (!walkthroughHeadings.length) return [];
      return walkthroughHeadings.map(function (item, idx) {
        if (!item.el.id || !/^kiki-(?:s|cm)-/.test(item.el.id)) item.el.id = "kiki-cm-" + idx;
        return {
          el: item.el,
          text: getCustomTocLabel(item),
          fs: item.fs,
          top: item.top
        };
      });
    }

    if (isSenseThunder) return findSenseThunderAnchors();

    if (isMobileBanking) return findMobileBankingAnchors();

    if (isHuwei) return findHuweiAnchors();

    var tocItems = isDecathlon ? DECATHLON_CUSTOM_TOC_ITEMS
      : CUSTOM_METHOD_TOC_ITEMS;
    var candidates = collectProjectSectionCandidates(24);
    if (!candidates.length) candidates = collectProjectSectionCandidates(16);
    if (!candidates.length) return [];

    var assigned = new Array(tocItems.length).fill(null);
    var cursor = 0;
    for (var i = 0; i < tocItems.length; i++) {
      var best = null;
      for (var j = cursor; j < candidates.length; j++) {
        var current = candidates[j];
        var score = matchCustomSectionScore(current.text, tocItems[i].terms);
        if (score <= 0) continue;
        best = { idx: j, score: score, item: current };
        break;
      }
      if (best) {
        assigned[i] = best.item;
        cursor = best.idx + 1;
      }
    }

    for (var b = assigned.length - 2; b >= 0; b--) {
      if (!assigned[b] && assigned[b + 1]) assigned[b] = assigned[b + 1];
    }
    for (var f = 1; f < assigned.length; f++) {
      if (!assigned[f] && assigned[f - 1]) assigned[f] = assigned[f - 1];
    }

    var hasAny = assigned.some(function (it) { return !!it; });
    if (!hasAny) {
      return tocItems.map(function (item, idx) {
        var target = candidates[Math.min(idx, candidates.length - 1)];
        if (!target) return null;
        if (!target.el.id || !/^kiki-(?:s|cm)-/.test(target.el.id)) target.el.id = "kiki-cm-" + idx;
        return { el: target.el, text: getCustomTocLabel(item), fs: target.fs, top: target.top };
      }).filter(Boolean);
    }

    var fallback = assigned[assigned.length - 1] || candidates[candidates.length - 1];
    return tocItems.map(function (item, idx) {
      var target = assigned[idx] || fallback;
      if (!target) return null;
      if (!target.el.id || !/^kiki-(?:s|cm)-/.test(target.el.id)) target.el.id = "kiki-cm-" + idx;
      return { el: target.el, text: getCustomTocLabel(item), fs: target.fs, top: target.top };
    }).filter(Boolean);
  }

  function findNearestHeadingTarget(headings, index) {
    if (!headings || !headings.length) return null;
    if (
      headings[index] &&
      headings[index].el &&
      document.contains(headings[index].el)
    ) {
      return headings[index].el;
    }
    for (var step = 1; step < headings.length; step++) {
      var left = index - step;
      var right = index + step;
      if (
        left >= 0 &&
        headings[left] &&
        headings[left].el &&
        document.contains(headings[left].el)
      ) {
        return headings[left].el;
      }
      if (
        right < headings.length &&
        headings[right] &&
        headings[right].el &&
        document.contains(headings[right].el)
      ) {
        return headings[right].el;
      }
    }
    for (var i = 0; i < headings.length; i++) {
      if (headings[i] && headings[i].el && document.contains(headings[i].el)) {
        return headings[i].el;
      }
    }
    return null;
  }

  function findProjectHeadings() {
    var scope = findProjectContainer() || document.querySelector("#container");
    if (!scope) return [];
    var footerY = findProjectFooterCutoffY(scope);
    var all = Array.from(scope.querySelectorAll("p, h1, h2, h3, h4"));
    var baseCandidates = [];
    var strictResults = [];
    var seen = new Set();
    all.forEach(function(el) {
      if (el.children.length > 0) return;
      var txt = (el.innerText || "").trim();
      if (!txt || txt.length > 70 || txt.length < 3 || seen.has(txt)) return;
      // Skip zero-width / invisible chars
      if (/^[\u200b\s]+$/.test(txt)) return;
      if (PROJECT_FOOTER_CUTOFF_RE.test(normalizeTocText(txt))) return;
      if (isHuweiARProjectPage() && /^(dpcp|decathlon|pain points|ux strategy|business process|vitamin play|cockpit|portal)/i.test(txt)) {
        return;
      }
      var style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      var fs = parseFloat(style.fontSize);
      // Require at least 32px for section headings
      if (fs < 32 || fs > 100) return;
      var top = el.getBoundingClientRect().top + window.scrollY;
      if (top < 450) return; // skip hero title area
      if (top > footerY) return; // skip footer / other projects
      seen.add(txt);
      var candidate = { el: el, text: txt, fs: Math.round(fs), top: Math.round(top) };
      baseCandidates.push(candidate);
      if (isMethodologyHeading(txt)) strictResults.push(candidate);
    });

    strictResults.sort(function(a, b){ return a.top - b.top; });
    if (strictResults.length > TOC_MAX_ITEMS) return strictResults.slice(0, TOC_MAX_ITEMS);
    if (strictResults.length > 0) return strictResults;

    // Fallback: pick high-priority methodological candidates, still excluding names/noise.
    var fallback = baseCandidates.filter(function(item) {
      return !isTocNoiseTitle(item.text) && countMethodKeywordHits(item.text) > 0;
    });

    fallback.sort(function(a, b) {
      var scoreDiff = rankHeadingForFallback(b) - rankHeadingForFallback(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.top - b.top;
    });

    var picked = [];
    var pickedSet = new Set();
    for (var i = 0; i < fallback.length; i++) {
      var key = normalizeTocText(fallback[i].text).toLowerCase();
      if (!key || pickedSet.has(key)) continue;
      picked.push(fallback[i]);
      pickedSet.add(key);
      if (picked.length >= TOC_MAX_ITEMS) break;
    }
    picked.sort(function(a, b){ return a.top - b.top; });
    return picked;
  }

  function buildProjectToc() {
    try {
      removeHuweiDecathlonStrayHeadings();
    } catch (e) {}
    var toc = document.getElementById("kiki-toc");
    if (!isProjectDetailPage()) {
      if (toc) toc.remove();
      syncTocBodyClass();
      return;
    }

    var headings = findCustomMethodologyAnchors();
    if (!headings.length && isSenseThunderJCVPage()) headings = findSenseThunderAnchors();
    if (!headings.length && isMobileBankingProjectPage()) headings = findMobileBankingAnchors();
    if (
      !headings.length &&
      !isSenseLinkJCVPage() &&
      !isMobileBankingProjectPage() &&
      (isHuweiARProjectPage() || !isDecathlonProjectPage())
    ) {
      headings = findProjectHeadings();
    }
    if (headings.length < 1) {
      if (toc) toc.remove();
      syncTocBodyClass();
      return;
    }

    // assign stable IDs
    headings.forEach(function(h, i) {
      if (!h.el.id || !/^kiki-s-/.test(h.el.id)) h.el.id = "kiki-s-" + i;
    });

    if (!toc) {
      toc = document.createElement("nav");
      toc.id = "kiki-toc";
      toc.setAttribute("aria-label", "Page sections");
      document.body.appendChild(toc);
    }

    toc.innerHTML = '<div class="kiki-toc-inner">'
      + headings.map(function(h, i) {
        var sub = h.fs < 36 ? " kiki-toc-link--sub" : "";
        return '<a href="#' + h.el.id + '" class="kiki-toc-link' + sub + '" data-tid="' + h.el.id + '" data-kiki-index="' + i + '">'
          + escapeHtml(h.text) + '</a>';
      }).join("")
      + "</div>";

    toc.querySelectorAll(".kiki-toc-link").forEach(function(a) {
      a.addEventListener("click", function(e) {
        e.preventDefault();
        var target = document.getElementById(a.dataset.tid);
        if (!target) {
          var idx = parseInt(a.getAttribute("data-kiki-index") || "0", 10);
          if (!isFinite(idx) || idx < 0) idx = 0;
          target = findNearestHeadingTarget(headings, idx);
        }
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // IntersectionObserver for active highlight
    if (__tocIo) { __tocIo.disconnect(); __tocIo = null; }
    __tocIo = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          toc.querySelectorAll(".kiki-toc-link").forEach(function(a) {
            a.classList.toggle("kiki-toc-link--active", a.dataset.tid === id);
          });
        }
      });
    }, { rootMargin: "-10% 0px -75% 0px", threshold: 0 });
    headings.forEach(function(h) { __tocIo.observe(h.el); });
    syncTocBodyClass();
  }

  var __tocRebuild = kikiDebounceFn(function () {
    try {
      removeHuweiDecathlonStrayHeadings();
    } catch (e) {}
    buildProjectToc();
  }, 500);

  function ensureTocLangObserver() {
    if (__tocLangMo) return;
    __tocLastLang = getSiteLang();
    __tocLangMo = new MutationObserver(function () {
      var nextLang = getSiteLang();
      if (nextLang === __tocLastLang) return;
      __tocLastLang = nextLang;
      if (!isProjectDetailPage()) return;
      try { buildProjectToc(); } catch (e) {}
    });
    __tocLangMo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-kiki-site-lang"]
    });
  }

  function initProjectToc() {
    ensureTocLangObserver();
    var path = location.pathname;
    if (path === __tocLastPath) return;
    __tocLastPath = path;

    // disconnect previous observer
    if (__tocMo) { __tocMo.disconnect(); __tocMo = null; }
    if (__tocIo) { __tocIo.disconnect(); __tocIo = null; }
    var old = document.getElementById("kiki-toc");
    if (old) old.remove();
    syncTocBodyClass();

    // Only set up for paths that COULD be project detail pages
    if (!/^\/project(-\d+)?$/.test(path)) return;

    // Build attempts (Go Back might appear after dynamic render)
    clearTimeout(__tocBuildTimer);
    __tocBuildTimer = setTimeout(buildProjectToc, 900);
    setTimeout(buildProjectToc, 2000);
    setTimeout(buildProjectToc, 4000);
    setTimeout(removeHuweiDecathlonStrayHeadings, 500);
    setTimeout(removeHuweiDecathlonStrayHeadings, 1500);
    setTimeout(removeHuweiDecathlonStrayHeadings, 3000);
    setTimeout(removeHuweiDecathlonStrayHeadings, 5000);
    setTimeout(removeHuweiDecathlonStrayHeadings, 8000);

    // Watch for dynamically added content (including Go Back link appearing)
    var root = document.getElementById("container") || document.body;
    __tocMo = new MutationObserver(__tocRebuild);
    __tocMo.observe(root, { childList: true, subtree: true });
  }

  /* ─── Homepage Hover Effects ─── */
  function kikiAddCls(el, cls) {
    if (el && !el.classList.contains(cls)) el.classList.add(cls);
  }

  function findMyWorkColumnLink(fromEl) {
    return fromEl && fromEl.closest && fromEl.closest("#container .css-7zeh8v > [role=\"link\"]");
  }

  function findProjectCardWrapper(fromEl) {
    var columnLink = findMyWorkColumnLink(fromEl);
    if (columnLink) {
      var shell = columnLink.querySelector(":scope > .css-rgilcw");
      if (shell && shell.querySelector("img")) return shell;
    }
    var candidates = [];
    var cur = fromEl && fromEl.parentElement;
    for (var i = 0; i < 14 && cur && cur !== document.body; i++) {
      var style = window.getComputedStyle(cur);
      if (parseFloat(style.borderRadius) >= 14 && cur.querySelector("img")) {
        candidates.push(cur);
      }
      cur = cur.parentElement;
    }
    if (!candidates.length) return null;
    for (var j = 0; j < candidates.length; j++) {
      var overflow = window.getComputedStyle(candidates[j]).overflow;
      if (overflow === "clip" || overflow === "hidden") return candidates[j];
    }
    return candidates[candidates.length - 1];
  }

  function dedupeProjectCards(container) {
    if (!container) return;
    Array.from(container.querySelectorAll('[data-kiki-card="1"]')).forEach(function (outer) {
      var inner = outer.querySelector('[data-kiki-card="1"]');
      if (!inner || inner === outer) return;
      outer.removeAttribute("data-kiki-card");
      outer.classList.remove("kiki-proj-card-fx", "kiki-card-in");
      outer.style.removeProperty("--kiki-ci");
    });
    container.querySelectorAll(".css-7zeh8v > [role=\"link\"]").forEach(function (column) {
      column.querySelectorAll('[role="link"]').forEach(function (inner) {
        if (inner === column) return;
        inner.removeAttribute("role");
        inner.removeAttribute("tabindex");
      });
    });
  }

  function markMyWorkCardRow(container) {
    if (!container) return;
    Array.from(container.querySelectorAll(".css-7zeh8v")).forEach(function (row) {
      var text = row.textContent || "";
      if (
        text.indexOf("Solplanet") !== -1 &&
        text.indexOf("Mobile Banking") !== -1 &&
        text.indexOf("SenseThunder") !== -1
      ) {
        row.setAttribute("data-kiki-mywork-row", "1");
      }
    });
  }

  function findMyWorkCardLeaf(column) {
    if (!column) return null;
    var leaves = Array.from(column.querySelectorAll(".css-rgilcw")).filter(function (shell) {
      return (
        shell.querySelector(":scope > .css-wc1msa") &&
        shell.querySelector(":scope > .css-5knerd, :scope > .css-z578mj")
      );
    });
    return leaves.length ? leaves[leaves.length - 1] : null;
  }

  function findMyWorkTextBody(column) {
    if (!column) return null;
    var leaf = column.querySelector(".kiki-proj-card-leaf") || findMyWorkCardLeaf(column);
    if (leaf) {
      var inLeaf = leaf.querySelector(".css-8xyryz");
      if (inLeaf) return inLeaf;
    }
    return column.querySelector(".css-8xyryz");
  }

  function markProjectCardRows(container) {
    if (!container) return;
    markMyWorkCardRow(container);
    Array.from(container.querySelectorAll(".css-7zeh8v")).forEach(function (row) {
      var cols = Array.from(row.querySelectorAll(':scope > [role="link"]'));
      if (cols.length >= 2 && row.querySelector(".kiki-see-proj-fx")) {
        row.setAttribute("data-kiki-proj-row", "1");
      }
    });
  }

  function findProjectCardLeaf(column) {
    return findMyWorkCardLeaf(column);
  }

  function findProjectTextBody(column) {
    return findMyWorkTextBody(column);
  }

  function tagProjectSeeProjectFooters(row) {
    if (!row) return;
    Array.from(row.querySelectorAll(':scope > [role="link"]')).forEach(function (column) {
      var see = column.querySelector(".kiki-see-proj-fx");
      if (!see) return;
      var footer = see.closest(".textContents, .css-z8b731");
      var box8 = findProjectTextBody(column);
      if (!footer || !box8) return;
      footer.classList.add("kiki-proj-see-footer", "kiki-mywork-see-footer");
      var host = box8.parentElement;
      if (!host) return;
      if (box8.contains(footer)) {
        host.insertBefore(footer, box8.nextSibling);
      }
    });
  }

  var __projLayoutMo = null;
  function measureProjectColumnHeight(col) {
    if (!col) return 0;
    var leaf = col.querySelector(".kiki-proj-card-leaf");
    if (!leaf) return Math.ceil(col.scrollHeight || col.getBoundingClientRect().height);
    var img = leaf.querySelector(":scope > .css-wc1msa");
    var body = leaf.querySelector(":scope > .css-5knerd, :scope > .css-z578mj");
    var imgH = img ? img.getBoundingClientRect().height : 236;
    var bodyH = body ? body.scrollHeight : 0;
    if (!bodyH) {
      var vt = leaf.querySelector(".css-vt5286");
      bodyH = vt ? vt.scrollHeight : 0;
    }
    var h = Math.ceil(imgH + bodyH);
    var leafH = Math.ceil(leaf.scrollHeight || leaf.getBoundingClientRect().height);
    return Math.max(h, leafH);
  }
  function layoutProjectCardRows() {
    var container = document.querySelector("#container");
    if (!container || window.innerWidth < 900) return;
    markProjectCardRows(container);
    tagProjectCardLeaves(container);
    Array.from(container.querySelectorAll('.css-7zeh8v[data-kiki-proj-row="1"]')).forEach(function (row) {
      var cols = Array.from(row.querySelectorAll(':scope > [role="link"]'));
      if (!cols.length) return;
      cols.forEach(function (col) {
        col.style.removeProperty("min-height");
        col.style.removeProperty("height");
      });
      var maxH = 0;
      cols.forEach(function (col) {
        var h = measureProjectColumnHeight(col);
        if (h > maxH) maxH = h;
      });
      if (!maxH) return;
      cols.forEach(function (col) {
        col.style.setProperty("min-height", maxH + "px", "important");
        col.style.setProperty("height", maxH + "px", "important");
      });
    });
  }

  function ensureProjectLayoutObserver() {
    var container = document.querySelector("#container");
    if (!container || __projLayoutMo) return;
    __projLayoutMo = new MutationObserver(
      kikiDebounceFn(function () {
        if (window.innerWidth < 900) return;
        markProjectCardRows(container);
        layoutProjectCardRows();
      }, 160)
    );
    __projLayoutMo.observe(container, { childList: true, subtree: true });
  }

  function tagProjectCardLeaves(container) {
    if (!container) return;
    Array.from(container.querySelectorAll('.css-7zeh8v[data-kiki-proj-row="1"]')).forEach(function (row) {
      Array.from(row.querySelectorAll(':scope > [role="link"]')).forEach(function (column) {
        column.querySelectorAll(".kiki-proj-card-leaf, .kiki-proj-card-shell").forEach(function (el) {
          el.classList.remove("kiki-proj-card-leaf", "kiki-proj-card-shell");
        });
        var leaf = findProjectCardLeaf(column);
        if (!leaf) return;
        leaf.classList.add("kiki-proj-card-leaf");
        var card = column.querySelector('[data-kiki-card="1"], .kiki-proj-card-fx');
        var node = leaf.parentElement;
        while (node && node !== column) {
          if (
            node !== leaf &&
            card &&
            (node === card || card.contains(node)) &&
            (node.classList.contains("css-rgilcw") || node.classList.contains("css-zgugw4"))
          ) {
            node.classList.add("kiki-proj-card-shell");
          }
          node = node.parentElement;
        }
      });
      tagProjectSeeProjectFooters(row);
    });
  }

  function tagMyWorkSeeProjectFooters(row) {
    tagProjectSeeProjectFooters(row);
  }

  function layoutMyWorkCards() {
    layoutProjectCardRows();
  }

  function ensureMyWorkLayoutObserver() {
    ensureProjectLayoutObserver();
  }

  function tagMyWorkCardLeaves(container) {
    tagProjectCardLeaves(container);
  }

  function initHoverEffects() {
    var container = document.querySelector("#container");
    if (!container) return;

    markProjectCardRows(container);

    // 1. Project cards: bind the innermost clipped card shell (not the outer link wrapper)
    Array.from(container.querySelectorAll("*")).forEach(function (el) {
      if (el.children.length > 0) return;
      var txt = (el.innerText || "").trim();
      if (!/^See Project/i.test(txt) && !/^查看项目/.test(txt)) return;
      kikiAddCls(el, "kiki-see-proj-fx");
      var card = findProjectCardWrapper(el);
      if (!card || card.hasAttribute("data-kiki-card")) return;
      if (card.closest('[data-kiki-card="1"]')) return;
      card.setAttribute("data-kiki-card", "1");
      kikiAddCls(card, "kiki-proj-card-fx");
    });
    dedupeProjectCards(container);
    tagProjectCardLeaves(container);
    ensureProjectLayoutObserver();
    layoutProjectCardRows();

    // 2. Nav links: short-text anchors (exclude wide brand row wrappers)
    Array.from(container.querySelectorAll("a")).forEach(function (a) {
      var txt = (a.innerText || "").trim();
      if (!txt || txt.length >= 30) return;
      if (/^(kiki\s*portfolio|portfolio|kiki\s*作品集|作品集)$/i.test(txt)) return;
      kikiAddCls(a, "kiki-nav-fx");
    });
    Array.from(container.querySelectorAll(".kiki-nav-brand, .kiki-nav-inner-brand")).forEach(function (a) {
      kikiAddCls(a, "kiki-nav-fx");
    });

    // 3. Scroll-in entrance: IntersectionObserver for cards not yet visible
    var cards = container.querySelectorAll(".kiki-proj-card-fx:not(.kiki-card-in)");
    if (cards.length && window.IntersectionObserver) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("kiki-card-in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: "0px 0px -20px 0px" }
      );
      cards.forEach(function (c, i) {
        c.style.setProperty("--kiki-ci", i % 6);
        io.observe(c);
      });
    } else {
      // fallback: no IO support or re-run after init
      cards.forEach(function (c) { c.classList.add("kiki-card-in"); });
    }
  }

  /* ─── Hero Typewriter + Hover Effect ─── */
  var __heroTyped = false;
  var HERO_TYPED_KEY = "kiki_hero_typed";

  function getHomeHeroElement() {
    if (!/^\/*$/.test(location.pathname)) return null;
    var spotHost = document.querySelector("#container [data-kiki-spot='1']");
    if (spotHost) {
      var hostText = Array.from(spotHost.querySelectorAll("p, span, div")).find(function (el) {
        return !!((el.innerText || el.textContent || "").replace(/\s+/g, "").trim());
      });
      if (hostText) return hostText;
    }

    var nodes = Array.from(document.querySelectorAll("#container p, #container span, #container div"));
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || node.children.length > 0) continue;
      var txt = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt || txt.length < 30) continue;
      if (/^Hi[!,]?\s*I.?m Kiki Sun/i.test(txt) || /^你好[！!，,\s]*我[是叫]?.*Kiki Sun/i.test(txt)) {
        return node;
      }
    }
    return null;
  }

  function getHeroSpotlightHost(heroEl) {
    if (!heroEl) return null;
    var candidate = heroEl.closest(".textContents") || heroEl;
    if (!candidate) return heroEl;
    var rect = candidate.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) return candidate;
    return heroEl;
  }

  function bindHeroSpotlight(heroEl) {
    if (!heroEl) return;
    var spotHost = getHeroSpotlightHost(heroEl);
    if (!spotHost || spotHost.getAttribute("data-kiki-spot") === "1") return;

    spotHost.setAttribute("data-kiki-spot", "1");
    spotHost.classList.add("kiki-hero-fx");

    var glow = document.createElement("div");
    glow.className = "kiki-hero-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    var glowPad = 140;
    var syncGlowBox = function () {
      var rect = spotHost.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) {
        glow.style.display = "none";
        return;
      }
      glow.style.display = "";
      glow.style.left = (rect.left - glowPad) + "px";
      glow.style.top = (rect.top - glowPad) + "px";
      glow.style.width = (rect.width + glowPad * 2) + "px";
      glow.style.height = (rect.height + glowPad * 2) + "px";
    };

    var updateSpot = function (e) {
      syncGlowBox();
      var rect = glow.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return;
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x < 0) x = 0;
      if (x > 100) x = 100;
      if (y < 0) y = 0;
      if (y > 100) y = 100;
      glow.style.setProperty("--kiki-spot-x", x.toFixed(2) + "%");
      glow.style.setProperty("--kiki-spot-y", y.toFixed(2) + "%");
    };

    syncGlowBox();
    window.addEventListener("resize", syncGlowBox);
    window.addEventListener("scroll", syncGlowBox, { passive: true });

    spotHost.addEventListener("pointerenter", function (e) {
      updateSpot(e);
      glow.classList.add("kiki-hero-glow-lit");
    });
    spotHost.addEventListener("pointermove", function (e) {
      updateSpot(e);
      glow.classList.add("kiki-hero-glow-lit");
    });
    var clearSpot = function () {
      glow.classList.remove("kiki-hero-glow-lit");
    };
    spotHost.addEventListener("pointerleave", clearSpot);
    spotHost.addEventListener("pointercancel", clearSpot);
  }

  function initHeroSpotlight() {
    var heroEl = getHomeHeroElement();
    if (!heroEl) return;
    bindHeroSpotlight(heroEl);
  }

  function initHeroTypewriter() {
    if (__heroTyped) return;
    var heroEl = getHomeHeroElement();
    if (!heroEl) return;
    if (heroEl.getAttribute("data-kiki-typed-run") === "1") {
      __heroTyped = true;
      return;
    }
    bindHeroSpotlight(heroEl);

    var shouldType = true;
    try {
      shouldType = !sessionStorage.getItem(HERO_TYPED_KEY);
    } catch (e) {}
    if (!shouldType) {
      heroEl.setAttribute("data-kiki-typed-run", "1");
      __heroTyped = true;
      return;
    }

    var fullText = (heroEl.innerText || heroEl.textContent || "").trim();
    if (!fullText) return;
    try { sessionStorage.setItem(HERO_TYPED_KEY, "1"); } catch (e2) {}
    heroEl.setAttribute("data-kiki-typed-run", "1");
    __heroTyped = true;

    var computedH = window.getComputedStyle(heroEl).height || "auto";
    heroEl.style.visibility = "hidden";
    heroEl.style.minHeight = computedH;

    setTimeout(function () {
      heroEl.textContent = "";
      heroEl.style.visibility = "";
      heroEl.classList.add("kiki-hero-typing");

      var i = 0;
      var SPEED = 26;
      function type() {
        if (i <= fullText.length) {
          heroEl.textContent = fullText.slice(0, i);
          i++;
          setTimeout(type, SPEED);
        } else {
          heroEl.classList.remove("kiki-hero-typing");
          heroEl.style.minHeight = "";
        }
      }
      type();
    }, 400);
  }

  /* ─── Page transition overlay (project SPA navigation) ─── */
  var PROJECT_PATH_RE = /^\/project(-\d+)?$/;
  var PAGE_TX_MIN_MS = 400;
  var __pageTxActive = false;
  var __pageTxSuppress = false;
  var __pageTxSuppressUntil = 0;
  var __pageTxNavToProject = false;
  var __pageTxCardIntentUntil = 0;
  var __pageTxShowGen = 0;
  var __pageTxShownAt = 0;
  var __pageTxHideTimer = null;
  var __pageTxMaxTimer = null;
  var __pageTxTryHideTimers = [];
  var __pageTxMo = null;
  var __pageTxPrefetched = {};
  var __pageTxFallbackTimer = null;

  function suppressPageTransition(ms) {
    __pageTxSuppress = true;
    __pageTxSuppressUntil = Date.now() + (ms || 8000);
    __pageTxNavToProject = false;
    __pageTxCardIntentUntil = 0;
    cancelPageTransition(true);
  }

  function cancelPageTransition(immediate) {
    __pageTxSuppress = true;
    __pageTxNavToProject = false;
    __pageTxCardIntentUntil = 0;
    __pageTxShowGen++;
    clearTimeout(__pageTxFallbackTimer);
    __pageTxFallbackTimer = null;
    stopPageTransitionWatch();
    clearTimeout(__pageTxHideTimer);
    var el = document.getElementById("kiki-page-transition");
    if (el) {
      el.classList.remove("kiki-page-transition--active", "kiki-page-transition--exit");
      el.setAttribute("aria-hidden", "true");
      if (immediate) {
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        requestAnimationFrame(function () {
          el.style.transition = "";
          el.style.opacity = "";
          el.style.visibility = "";
        });
      } else {
        el.classList.add("kiki-page-transition--exit");
      }
    }
    __pageTxActive = false;
  }

  function normalizeNavPath(path) {
    var p = String(path || "/").split("?")[0].split("#")[0];
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  }

  function ensurePageTransitionEl() {
    var el = document.getElementById("kiki-page-transition");
    if (el) return el;
    el = document.createElement("div");
    el.id = "kiki-page-transition";
    el.className = "kiki-page-transition";
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("role", "presentation");
    el.innerHTML =
      '<div class="kiki-page-transition__inner">' +
      '<div class="kiki-page-transition__brand">kiki Portfolio</div>' +
      '<div class="kiki-page-transition__dots" aria-hidden="true">' +
      '<span class="kiki-page-transition__dot"></span>' +
      '<span class="kiki-page-transition__dot"></span>' +
      '<span class="kiki-page-transition__dot"></span>' +
      "</div></div>";
    document.body.appendChild(el);
    return el;
  }

  function showPageTransition() {
    if (__pageTxSuppress || Date.now() < __pageTxSuppressUntil) return;
    clearTimeout(__pageTxHideTimer);
    __pageTxShownAt = Date.now();
    if (__pageTxActive) return;
    __pageTxActive = true;
    var el = ensurePageTransitionEl();
    el.classList.remove("kiki-page-transition--exit");
    el.setAttribute("aria-hidden", "false");
    el.classList.add("kiki-page-transition--active");
    var gen = ++__pageTxShowGen;
    requestAnimationFrame(function () {
      if (gen !== __pageTxShowGen || !__pageTxActive || __pageTxSuppress) return;
      if (!el.classList.contains("kiki-page-transition--active")) {
        el.classList.add("kiki-page-transition--active");
      }
    });
  }

  function hidePageTransition(force) {
    __pageTxShowGen++;
    if (!__pageTxActive) return;
    var elapsed = Date.now() - (__pageTxShownAt || 0);
    if (!force && elapsed < PAGE_TX_MIN_MS) {
      clearTimeout(__pageTxHideTimer);
      __pageTxHideTimer = setTimeout(function () {
        hidePageTransition(true);
      }, PAGE_TX_MIN_MS - elapsed);
      return;
    }
    var el = document.getElementById("kiki-page-transition");
    if (!el) {
      __pageTxActive = false;
      return;
    }
    el.classList.remove("kiki-page-transition--active");
    el.classList.add("kiki-page-transition--exit");
    el.setAttribute("aria-hidden", "true");
    clearTimeout(__pageTxHideTimer);
    __pageTxHideTimer = setTimeout(function () {
      __pageTxActive = false;
      __pageTxNavToProject = false;
      el.classList.remove("kiki-page-transition--exit");
    }, 480);
    stopPageTransitionWatch();
  }

  function stopPageTransitionWatch() {
    if (__pageTxMo) { __pageTxMo.disconnect(); __pageTxMo = null; }
    clearTimeout(__pageTxMaxTimer);
    __pageTxMaxTimer = null;
    if (__pageTxTryHideTimers.length) {
      __pageTxTryHideTimers.forEach(function (t) { clearTimeout(t); });
      __pageTxTryHideTimers = [];
    }
  }

  function isGoBackNavTarget(target) {
    if (!target || !target.closest) return false;
    if (target.closest("[data-kiki-go-back]")) return true;
    var node = target;
    for (var i = 0; i < 14 && node; i++) {
      var txt = (node.innerText || node.textContent || "").trim();
      if (txt.length > 0 && txt.length < 48 && /go\s*back|←\s*back|^返回$/i.test(txt)) return true;
      var label =
        (node.getAttribute && (node.getAttribute("aria-label") || node.getAttribute("title"))) || "";
      if (/go\s*back|返回/i.test(label)) return true;
      node = node.parentElement;
    }
    return false;
  }

  function startPageTransitionWatch() {
    stopPageTransitionWatch();
    var root = document.getElementById("container") || document.body;
    var tryHide = function () {
      if (!__pageTxActive) return;
      var path = normalizeNavPath(location.pathname);
      if (!PROJECT_PATH_RE.test(path)) {
        __pageTxNavToProject = false;
        cancelPageTransition(true);
        return;
      }
      __pageTxNavToProject = false;
      if (isProjectDetailPage()) hidePageTransition();
    };
    __pageTxMo = new MutationObserver(tryHide);
    __pageTxMo.observe(root, { childList: true, subtree: true });
    [500, 900, 1400].forEach(function (ms) {
      __pageTxTryHideTimers.push(setTimeout(tryHide, ms));
    });
    __pageTxMaxTimer = setTimeout(function () {
      if (PROJECT_PATH_RE.test(normalizeNavPath(location.pathname))) {
        hidePageTransition(true);
      } else {
        cancelPageTransition();
      }
    }, 2800);
  }

  function armCardNavTransition() {
    if (Date.now() < __pageTxSuppressUntil) return;
    __pageTxSuppress = false;
    __pageTxSuppressUntil = 0;
    __pageTxNavToProject = true;
    __pageTxCardIntentUntil = Date.now() + 5000;
    showPageTransition();
    startPageTransitionWatch();
  }

  function onProjectNavIntent() {
    armCardNavTransition();
  }

  function isProjectNavUrl(url) {
    if (!url) return false;
    try {
      var u = new URL(String(url), location.origin);
      return PROJECT_PATH_RE.test(normalizeNavPath(u.pathname));
    } catch (e) {
      return PROJECT_PATH_RE.test(normalizeNavPath(String(url)));
    }
  }

  function isHomePath() {
    var p = normalizeNavPath(location.pathname);
    return p === "/" || p === "/index.html";
  }

  function findProjectNavLink(target) {
    if (!target || !target.closest) return null;
    var container = document.getElementById("container");
    if (!container) return null;
    var a = target.closest("a");
    if (!a || !container.contains(a)) return null;
    var href = a.getAttribute("href") || a.href || "";
    return isProjectNavUrl(href) ? a : null;
  }

  function isProjectCardClickTarget(target) {
    if (!target || !target.closest) return false;
    if (isGoBackNavTarget(target)) return false;
    if (isSiteChromeClick(target)) return false;
    if (target.closest("[data-kiki-card], .kiki-proj-card-fx, .kiki-see-proj-fx")) return true;
    var container = document.getElementById("container");
    if (!container || !container.contains(target)) return false;
    var node = target;
    for (var i = 0; i < 10 && node && node !== container; i++) {
      if (isSiteChromeClick(node)) return false;
      if (node.hasAttribute && (node.hasAttribute("data-kiki-card") || node.classList.contains("kiki-proj-card-fx"))) {
        return true;
      }
      var txt = (node.innerText || "").trim();
      if (txt.length > 0 && txt.length <= 220 && (/See Project/i.test(txt) || /查看项目/.test(txt))) {
        return true;
      }
      var rect = node.getBoundingClientRect();
      if (
        node.querySelector &&
        node.querySelector("img") &&
        rect.height >= 48 &&
        rect.height <= 520 &&
        rect.width >= 80 &&
        rect.width <= 720 &&
        parseFloat(window.getComputedStyle(node).borderRadius) >= 14
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function shouldTriggerProjectTransition(target) {
    // Only homepage project cards (My Work). No pushState/popstate/links/inner-page nav.
    if (!target || !isHomePath()) return false;
    if (isGoBackNavTarget(target)) return false;
    return isProjectCardClickTarget(target);
  }

  function resolveProjectRouteFromTarget(target) {
    if (!target || !target.closest) return null;
    var card = target.closest("[data-kiki-card], .kiki-proj-card-fx");
    if (!card) return null;
    var txt = normalizeMatchText(card.innerText || "");
    if (!txt) return null;
    for (var j = 0; j < PROJECT_DB.length; j++) {
      var p = PROJECT_DB[j];
      if (p.match && p.match.test(txt) && p.route) return p.route;
    }
    return null;
  }

  function scheduleProjectNavFallback(target) {
    clearProjectNavFallback();
    if (isSiteChromeClick(target)) return;
    var card = target && target.closest && target.closest("[data-kiki-card], .kiki-proj-card-fx");
    if (!card) return;
    var route = resolveProjectRouteFromTarget(target);
    if (!route || !isHomePath()) return;
    __pageTxFallbackTimer = setTimeout(function () {
      if (!isHomePath()) return;
      try {
        history.pushState(history.state || {}, "", route);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err) {
        location.assign(route);
      }
    }, 650);
  }

  function handleBackNavEvent(e) {
    if (!isGoBackNavTarget(e.target)) return;
    suppressPageTransition(12000);
  }

  function handleProjectNavIntentEvent(e) {
    if (isSiteChromeClick(e.target)) {
      clearProjectNavFallback();
      return;
    }
    if (isGoBackNavTarget(e.target)) {
      suppressPageTransition(12000);
      return;
    }
    if (!shouldTriggerProjectTransition(e.target)) return;
    // pointerdown: show overlay early; pointer-events:none on overlay lets click through
    if (e.type === "pointerdown") {
      armCardNavTransition();
      return;
    }
    if (e.type === "click") {
      if (!__pageTxActive) armCardNavTransition();
      scheduleProjectNavFallback(e.target);
    }
  }

  function prefetchProjectJson(path) {
    if (!path || __pageTxPrefetched[path]) return;
    __pageTxPrefetched[path] = true;
    var clean = String(path).split("?")[0].replace(/\/$/, "") || "/";
    var jsonPath = clean === "/" ? "/_index.json" : clean + ".json";
    var urls = [
      "/_json/c09d50a1-ac94-435c-b4e5-c08318bfc599" + jsonPath,
      "/_json/c09d50a1-ac94-435c-b4e5-c08318bfc599/_cms" + jsonPath,
    ];
    urls.forEach(function (u) {
      try {
        fetch(u, { credentials: "same-origin", priority: "low" }).catch(function () {});
      } catch (e) {}
    });
  }

  function prefetchFromCard(card) {
    if (!card) return;
    var txt = normalizeMatchText(card.innerText || "");
    if (!txt) return;
    for (var i = 0; i < PROJECT_DB.length; i++) {
      var p = PROJECT_DB[i];
      if (p.match && p.match.test(txt) && p.route) {
        prefetchProjectJson(p.route);
        return;
      }
    }
  }

  document.addEventListener("pointerdown", handleBackNavEvent, true);
  document.addEventListener("click", handleBackNavEvent, true);
  document.addEventListener("pointerdown", handleProjectNavIntentEvent, true);
  document.addEventListener("click", handleProjectNavIntentEvent, true);
  /* Never preventDefault/stopPropagation on card clicks — Figma owns navigation */

  document.addEventListener(
    "mouseover",
    function (e) {
      var card =
        (e.target.closest && e.target.closest("[data-kiki-card], .kiki-proj-card-fx")) ||
        null;
      if (!card) return;
      prefetchFromCard(card);
    },
    { passive: true }
  );

  /* ─── Fix About links ─── */
  function fixAboutLinks() {
    Array.from(document.querySelectorAll('a')).forEach(function(a) {
      var txt = (a.innerText || a.textContent || '').trim().toLowerCase();
      var href = a.href || '';
      if ((txt === 'about' || txt === '关于') &&
          href &&
          !/^(https?:\/\/127\.0\.0\.1(:\d+)?\/about|\/about)/.test(href)) {
        a.href = '/about';
        a.removeAttribute('target');
      }
    });
  }

  /* ─── Boot ─── */
  function boot() {
    syncInnerPageNavChrome();
    scheduleSiteLangSwitchRecovery();
    maybeReapplySiteZh();
    ensureZhDomObserver();
    if (!document.querySelector(".kiki-chat-trigger")) initAskKiki();
    initResumeDownload();
    initProjectToc();
    setTimeout(initHoverEffects, 600);
    setTimeout(initHoverEffects, 1800);
    setTimeout(layoutProjectCardRows, 700);
    setTimeout(layoutProjectCardRows, 1900);
    setTimeout(initHeroTypewriter, 700);
    setTimeout(initHeroSpotlight, 1000);
    setTimeout(initHeroTypewriter, 2100);
    setTimeout(initHeroSpotlight, 2600);
    setTimeout(fixAboutLinks, 500);
    setTimeout(fixAboutLinks, 1500);
    setTimeout(removeHuweiDecathlonStrayHeadings, 800);
    setTimeout(removeHuweiDecathlonStrayHeadings, 2200);
  }

  function safeBoot() {
    try {
      boot();
    } catch (e) {
      try { scheduleSiteLangSwitchRecovery(); } catch (e2) {}
      if (!document.querySelector(".kiki-chat-trigger")) {
        try { initAskKiki(); } catch (e3) {}
      }
    }
  }

  function schedule() {
    safeBoot();
    var n = 0;
    var iv = setInterval(function () {
      try { scheduleSiteLangSwitchRecovery(); } catch (e) {}
      try { maybeReapplySiteZh(); } catch (e2) {}
      if (!document.querySelector(".kiki-chat-trigger")) {
        try { initAskKiki(); } catch (e3) {}
      }
      if (++n > 20) clearInterval(iv);
    }, 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(schedule, 400); });
  } else {
    setTimeout(schedule, 400);
  }
  window.addEventListener("load", function () { setTimeout(schedule, 1000); });
  window.addEventListener("resize", kikiDebounceFn(function () {
    try { scheduleSiteLangSwitchRecovery(); } catch (e0) {}
    if (document.getElementById("kiki-toc")) buildProjectToc();
    else syncTocBodyClass();
    if (window.innerWidth >= 900) layoutProjectCardRows();
  }, 200));

  function handleHistoryNav(dest, applyNav) {
    var current = normalizeNavPath(location.pathname);
    var onProject = PROJECT_PATH_RE.test(current);
    var normDest = dest ? normalizeNavPath(String(dest)) : null;
    var goingProject = normDest && isProjectNavUrl(dest);
    var leavingProject = onProject && normDest && !isProjectNavUrl(dest);
    var goingHome =
      onProject &&
      (!normDest || normDest === "/" || normDest === "/index.html");
    if (leavingProject || goingHome) {
      suppressPageTransition(12000);
    } else if (
      goingProject &&
      Date.now() < __pageTxCardIntentUntil &&
      Date.now() >= __pageTxSuppressUntil
    ) {
      if (!__pageTxActive) armCardNavTransition();
    }
    applyNav();
    setTimeout(syncInnerPageNavChrome, 0);
    if (goingProject && dest) prefetchProjectJson(normalizeNavPath(String(dest)));
    chatMounted = false;
    __heroTyped = false;
    __lastI18nPath = "";
    setTimeout(safeBoot, 600);
    setTimeout(scheduleSiteLangSwitchRecovery, 1200);
    setTimeout(normalizeDetachedSiteSwitchPlacement, 1450);
    setTimeout(fixAboutLinks, 600);
    if (goingProject && __pageTxActive) {
      setTimeout(function () {
        if (isProjectDetailPage()) hidePageTransition();
      }, 1400);
    }
  }

  var _push = history.pushState;
  history.pushState = function () {
    var dest = arguments.length > 2 ? arguments[2] : null;
    var args = arguments;
    handleHistoryNav(dest, function () {
      _push.apply(history, args);
    });
  };
  var _replace = history.replaceState;
  history.replaceState = function () {
    var dest = arguments.length > 2 ? arguments[2] : null;
    var args = arguments;
    handleHistoryNav(dest, function () {
      _replace.apply(history, args);
    });
  };
  window.addEventListener("popstate", function () {
    if (!PROJECT_PATH_RE.test(normalizeNavPath(location.pathname))) suppressPageTransition(12000);
    syncInnerPageNavChrome();
    chatMounted = false;
    __heroTyped = false;
    __lastI18nPath = "";
    setTimeout(safeBoot, 600);
    setTimeout(scheduleSiteLangSwitchRecovery, 1200);
    setTimeout(normalizeDetachedSiteSwitchPlacement, 1450);
    setTimeout(fixAboutLinks, 600);
  });
})();
