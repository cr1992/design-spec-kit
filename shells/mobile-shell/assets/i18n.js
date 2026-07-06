/* ============================================================
   Prototype Kit · i18n 运行时（通用·business-free）
   ------------------------------------------------------------
   运行在每个 screens/*.html 内部，与 screen.js 并列。
   职责：
     1. 读语言偏好（URL ?lang= → 默认 zh），解析 system → 设备语言；
        把解析结果写 root[data-lang]（zh|en，CSS 可挂钩），偏好写
        root[data-lang-pref]（zh|en|system），方向写 root[data-dir]
        （P0 恒 ltr·RTL 占位见 MOBILE-SPEC D9）。
     2. data-i18n 自动应用：[data-i18n]=textContent · [data-i18n-html]=innerHTML
        · [data-i18n-ph]=placeholder · [data-i18n-aria]=aria-label。
     3. JS 取词：I18N.t(key, vars)（vars 做 {name} 占位替换）。
     4. 监听父壳 {type:"theme"|"lang", lang}（壳把 lang 随主题一起广播），
        切换后重应用 + 派发 window 事件 "i18n:change" 供 JS 渲染屏重渲染。
   依赖：window.I18N_DICT（业务词典 i18n-dict.js，先于本文件加载）。无则降级回显 key/原文。
   → Flutter：对应 MaterialApp.locale + LocalizationsDelegate；data-lang↔Locale，
     I18N.t↔Intl.message，词典↔ARB。
   ============================================================ */
(function () {
  "use strict";
  var r = document.documentElement;
  var DICT = window.I18N_DICT || {};

  function deviceLang() {
    var l = (navigator.language || navigator.userLanguage || "zh").toLowerCase();
    return l.indexOf("zh") === 0 ? "zh" : "en";
  }
  function resolve(pref) { return pref === "system" ? deviceLang() : (pref === "en" ? "en" : "zh"); }

  var pref = (new URLSearchParams(location.search)).get("lang") || r.getAttribute("data-lang-pref") || "zh";
  var lang = resolve(pref);

  function t(key, vars) {
    var entry = DICT[key];
    var s = entry ? (entry[lang] != null ? entry[lang] : entry.zh) : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]); });
    return s;
  }

  /* 把 [data-i18n*] 节点按当前语言刷新 */
  function apply(scope) {
    scope = scope || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    scope.querySelectorAll("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
  }

  function reflectRoot() {
    r.setAttribute("data-lang", lang);
    r.setAttribute("data-lang-pref", pref);
    r.setAttribute("data-dir", "ltr");            /* RTL 占位：P0 恒 ltr */
    r.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
  }

  /* 设语言偏好（屏内/壳下发共用）→ 解析 + 落 root + 重应用 + 广而告之 */
  function set(nextPref) {
    pref = nextPref || "zh";
    lang = resolve(pref);
    reflectRoot();
    apply(document);
    try { window.dispatchEvent(new CustomEvent("i18n:change", { detail: { lang: lang, pref: pref } })); } catch (_) {}
  }

  /* 设备语言变化（system 偏好下跟随）*/
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null; /* 占位：语言无系统媒体查询，留接口 */
  window.addEventListener("languagechange", function () { if (pref === "system") set("system"); });

  /* 父壳广播：theme 消息或专用 lang 消息里夹带 lang */
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if ((d.type === "theme" || d.type === "lang") && d.lang && d.lang !== pref) set(d.lang);
  });

  window.I18N = {
    get lang() { return lang; },
    get pref() { return pref; },
    t: t, apply: apply, set: set,
    /* 屏内入口（如「我的」语言行）调用：本地切换 + 上行壳全局广播+持久化 */
    setAndBroadcast: function (nextPref) {
      set(nextPref);
      try { parent.postMessage({ type: "setLang", lang: nextPref }, "*"); } catch (_) {}
    }
  };

  reflectRoot();
  if (document.readyState !== "loading") apply(document);
  else document.addEventListener("DOMContentLoaded", function () { apply(document); });
})();
