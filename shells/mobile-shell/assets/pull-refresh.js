/* ============================================================
   通用下拉刷新 HiPullRefresh（business-free · 壳运行时）
   ------------------------------------------------------------
   行为契约对齐 Flutter easy_refresh 方案（position:above + clamping:false）：
   · 释放才触发（triggerWhenReach=false）：过拉 ≥ triggerOffset(72px) 松手才刷新；
   · iOS 式：内容随过拉下移（橡皮筋阻尼），指示器浮在让出的净空区，底缘距内容顶 9px；
   · 刷新中：指示器进 .go（弧固定 28% + 1s 匀速旋转），onRefresh() 的 Promise 完成才回收；
   · 指示器 = .ptr 圆 chip：壳只带最简兜底，宿主经 opts.ptrHTML 注入项目
     自己的指示器（壳不指名任何业务全局，见壳 README「挂钩契约」）。
   可跨屏复用（任意可滚动屏）。

   用法：HiPullRefresh.wire(scrollEl, { onRefresh: () => Promise, ptrHTML: pull => html });
   → Flutter 落地：HiPullRefresh(onRefresh: controller.load, child: ListView(...))。
   ============================================================ */
(function () {
  "use strict";
  var EASE = "cubic-bezier(.32,.72,0,1)";
  var GAP = 9;        /* 指示器底缘距内容顶（与 Flutter 实现同值）*/
  var IND = 46;       /* .ptr 直径（spec.css .ptr 46）*/

  function ptrHTML(opts) {
    if (opts && typeof opts.ptrHTML === "function") return opts.ptrHTML(0);
    /* 兜底（宿主未注入）：最简 .ptr */
    return '<span class="ptr" style="--pull:0"><svg class="pr" viewBox="0 0 48 48" fill="none">'
      + '<circle class="tk" cx="24" cy="24" r="20" pathLength="100"/>'
      + '<circle class="arc" cx="24" cy="24" r="20" pathLength="100"/></svg></span>';
  }

  function wire(scroll, opts) {
    opts = opts || {};
    if (!scroll || scroll._ptrWired) return;
    scroll._ptrWired = true;
    var pg = scroll.closest(".pg") || scroll.parentElement;
    var threshold = opts.triggerOffset || 72;
    var rest = opts.restOffset || 64;     /* 刷新中内容停靠位（容下 46 chip + gap）*/
    var maxPull = opts.maxPull || 150;
    var onRefresh = opts.onRefresh || function () { return Promise.resolve(); };

    /* 指示器宿主：浮在覆盖式顶栏之下（z19 < 顶栏 20）、内容之上 */
    var host = document.createElement("div");
    host.style.cssText = "position:absolute;left:0;right:0;top:var(--top-h,96px);height:0;"
      + "display:flex;justify-content:center;z-index:19;pointer-events:none;";
    host.innerHTML = ptrHTML(opts);
    pg.appendChild(host);
    var ptr = host.querySelector(".ptr");

    var startY = 0, pulling = false, dist = 0, refreshing = false;

    function paint(d) {
      dist = d;
      scroll.style.transform = d > 0 ? "translateY(" + d + "px)" : "";
      /* 指示器底缘 = 内容顶（top-h + d）上方 GAP → 顶距 top-h 偏移 = d - GAP - IND */
      ptr.style.transform = "translateY(" + (d - GAP - IND) + "px)";
      ptr.style.opacity = d > 2 ? "1" : "0";
      ptr.style.setProperty("--pull", Math.min(d / threshold, 1).toFixed(3));
    }
    function noTrans() { scroll.style.transition = ""; ptr.style.transition = ""; }
    function animTo(d, cb) {
      scroll.style.transition = "transform .32s " + EASE;
      ptr.style.transition = "transform .32s " + EASE + ",opacity .32s " + EASE;
      paint(d);
      setTimeout(function () { noTrans(); if (cb) cb(); }, 330);
    }
    function finish() { refreshing = false; ptr.classList.remove("go"); animTo(0); }

    paint(0);   /* 初始隐藏：否则首载指示器停在内容区（.ptr 默认 transform:none / opacity:1 = 可见） */

    scroll.addEventListener("pointerdown", function (e) {
      if (refreshing || e.pointerType === "mouse" && e.button !== 0) return;
      if (scroll.scrollTop > 0) return;
      startY = e.clientY; pulling = true; dist = 0; noTrans();
    });
    scroll.addEventListener("pointermove", function (e) {
      if (!pulling || refreshing) return;
      if (scroll.scrollTop > 0) { pulling = false; if (dist) paint(0); return; }
      var dy = e.clientY - startY;
      if (dy <= 0) { if (dist) paint(0); return; }
      e.preventDefault();                              /* 接管下拉，禁原生过滚 */
      paint(Math.min(dy * 0.5, maxPull));              /* 橡皮筋阻尼 0.5 */
    }, { passive: false });
    function end() {
      if (!pulling || refreshing) { pulling = false; return; }
      pulling = false;
      if (dist >= threshold) {
        refreshing = true; ptr.classList.add("go");    /* 弧固定 28% + 旋转 */
        animTo(rest, function () {
          Promise.resolve(onRefresh()).then(finish, finish);
        });
      } else {
        animTo(0);
      }
    }
    scroll.addEventListener("pointerup", end);
    scroll.addEventListener("pointercancel", end);
  }

  window.HiPullRefresh = { wire: wire };
})();
