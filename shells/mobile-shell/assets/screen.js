/* ============================================================
   单屏脚本（运行在每个 screens/*.html 内部）
   注入 iOS chrome · 多状态显隐 · 通用交互 · postMessage 导航
   ============================================================ */
(function () {
  "use strict";
  var r = document.documentElement;
  var state = r.getAttribute("data-state") || "default";
  var device = (new URLSearchParams(location.search)).get("device") || r.getAttribute("data-device") || "phone";
  r.setAttribute("data-device", device);

  /* iOS chrome —— iPhone 带灵动岛；iPad 横屏只有状态栏 + Home 条（无灵动岛） */
  var STATUS = '<div class="status-bar"><span class="time">9:41</span><span class="stat">' +
    '<svg viewBox="0 0 18 14" fill="currentColor"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/></svg>' +
    '<svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.4c2.5 0 4.8.9 6.5 2.5l-1.3 1.4A7.6 7.6 0 0 0 8 4.3c-2 0-3.8.7-5.2 2L1.5 4.9A9.4 9.4 0 0 1 8 2.4z"/><path d="M8 6.1c1.5 0 2.9.6 3.9 1.5l-1.3 1.4A3.6 3.6 0 0 0 8 8c-1 0-2 .4-2.6 1L4 7.6A5.5 5.5 0 0 1 8 6.1z"/><circle cx="8" cy="10.4" r="1.3"/></svg>' +
    '<svg viewBox="0 0 28 14" fill="none"><rect x="0.6" y="0.6" width="22.8" height="12.8" rx="3.4" stroke="currentColor" stroke-opacity="0.4"/><rect x="2.2" y="2.2" width="17.6" height="9.6" rx="2" fill="currentColor"/><path d="M25 4.6c1.3.3 1.3 4.8 0 5.1z" fill="currentColor" fill-opacity="0.5"/></svg>' +
    '</span></div>';
  var ISLAND = '<div class="dynamic-island"></div>';
  var HOME = '<div class="home-indicator"></div>';
  var CHROME = (device === "pad" ? "" : ISLAND) + STATUS + HOME;
  document.body.insertAdjacentHTML("afterbegin", CHROME);

  /* 多状态显隐 */
  document.querySelectorAll("[data-when]").forEach(function (el) {
    if (el.dataset.when.split(/\s+/).indexOf(state) !== -1) el.classList.add("show");
  });
  /* 时间线「抽屉打开」状态 */
  if (state === "drawer") {
    var ds = document.querySelector(".drawer-stage");
    if (ds) ds.classList.add("open");
  }

  /* 父级主题下发 */
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "theme") {
      if (d.theme) r.setAttribute("data-theme", d.theme);
      if (d.mode) r.setAttribute("data-mode", d.mode);
    }
  });
  var post = function (m) { try { parent.postMessage(m, "*"); } catch (_) {} };
  /* 就绪后向父级要一次主题（避免初始不同步）*/
  post({ type: "ready" });

  /* ---------- 点击交互 ---------- */
  document.addEventListener("click", function (e) {
    /* 导航（交给父级路由）*/
    if (e.target.closest("[data-nav-back]")) { post({ type: "back" }); return; }
    var navEl = e.target.closest("[data-nav]");
    /* Tab / rail = 平级目的地 → 标记 mode:"tab"，壳据此瞬切（无层级 push 动画）*/
    if (navEl) { post({ type: "nav", to: navEl.dataset.nav, rid: navEl.dataset.rid || undefined, mode: navEl.closest(".tabbar, .rail") ? "tab" : undefined }); return; }

    /* 抽屉 */
    var opener = e.target.closest("[data-drawer-open]");
    if (opener) { opener.closest(".drawer-stage").classList.add("open"); return; }
    if (e.target.closest(".scrim") || e.target.closest("[data-drawer-close]")) {
      var st = e.target.closest(".drawer-stage"); if (st) st.classList.remove("open"); return;
    }

    /* 通用演示交互：分段控件 */
    var seg = e.target.closest(".segmented button");
    if (seg) { seg.parentElement.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", "false"); }); seg.setAttribute("aria-selected", "true"); return; }
  });

  /* ---------- 键盘可达：role=button 的非原生行（.lr 列表行等）Enter / Space 激活 ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest('[role="button"]');
    if (!el || /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    e.preventDefault(); el.click();
  });

  /* ---------- FAB（通用：轻点导航到 data-nav 目标）---------- */
  var fabMain = document.querySelector(".fab-wrap .fab-main");
  if (fabMain) {
    fabMain.addEventListener("click", function () {
      var to = fabMain.getAttribute("data-nav");
      if (to) post({ type: "nav", to: to });
    });
  }

  /* ---------- 覆盖式顶栏：实测高度 → --top-h；滚动 → .scrolled 毛玻璃浮起 ---------- */
  (function () {
    var pg = document.querySelector(".pg");
    var scroll = document.querySelector(".app-scroll");
    var bar = document.querySelector(".pg > .app-top");
    if (!pg || !scroll || !bar) return;
    var measure = function () { pg.style.setProperty("--top-h", bar.offsetHeight + "px"); };
    measure();
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) { try { new ResizeObserver(measure).observe(bar); } catch (_) {} }
    var onScroll = function () { pg.classList.toggle("scrolled", scroll.scrollTop > 2); };
    onScroll();
    scroll.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ---------- 下划线 Tab 滑动指示 .tab-ink（点选时平移到选中项）----------
     给每个 .tabs 注入一条 .tab-ink，按选中 .tab 的 offsetLeft/width 平移；
     委托监听 .tab 点击，在页面逻辑改完 aria-selected 后（rAF）再定位。
     暴露 window.HiTabs.{wire,sync} 供动态渲染后调用。 */
  (function () {
    function pos(tabs) {
      var ink = tabs.querySelector(":scope > .tab-ink"); if (!ink) return;
      var sel = tabs.querySelector('.tab[aria-selected="true"]') || tabs.querySelector(".tab");
      if (!sel) { ink.style.width = "0"; return; }
      ink.style.width = sel.offsetWidth + "px";
      ink.style.transform = "translateX(" + sel.offsetLeft + "px)";
    }
    function init(tabs) {
      var ink = tabs.querySelector(":scope > .tab-ink");
      if (!ink) { ink = document.createElement("span"); ink.className = "tab-ink"; tabs.appendChild(ink); }
      if (!tabs.__inkClick) {
        tabs.__inkClick = true;
        tabs.addEventListener("click", function (e) {
          if (e.target.closest(".tab")) requestAnimationFrame(function () { pos(tabs); });
        });
      }
      pos(tabs);
    }
    function wire(root) { (root || document).querySelectorAll(".tabs").forEach(init); }
    window.HiTabs = { wire: wire, sync: pos };
    function syncAll() { document.querySelectorAll(".tabs").forEach(pos); }
    if (document.readyState !== "loading") wire(); else document.addEventListener("DOMContentLoaded", function () { wire(); });
    window.addEventListener("resize", syncAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncAll);
    setTimeout(syncAll, 350);
  })();
})();
