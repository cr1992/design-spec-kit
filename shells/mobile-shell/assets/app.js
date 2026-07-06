/* ============================================================
   Prototype Kit · 外壳脚本（viewer）—— 与业务解耦的通用外壳
   双端(iPhone/iPad) · 常驻缓存页 + 预热 + 就绪门控滑入（无白屏）
   master-detail 设备别名 · select 就地换数据协议 · 交互/参考双视图 · 缩放平移
   ★ 复用：只改 index.html 顶部的 window.PROTO_CONFIG，并写 screens/*.html
   导航范式详见 docs/PROTOTYPE-ARCH.md。
   ============================================================ */
(function () {
  "use strict";
  var C = window.PROTO_CONFIG || {};
  var SCREENS = C.screens || [];
  var DEV = C.devices || { phone: { w: 418, h: 872, label: "iPhone" }, pad: { w: 1212, h: 852, label: "iPad" } };
  var ALIAS = C.deviceAlias || {};      /* { 子屏id: pad上就地呈现于此父屏id } —— master-detail */
  var THEMES = C.themes || [];          /* [{id,name,color}] */
  var DIR = C.screensDir || "screens/";
  var REF_SCALE = C.refScale || 0.4;
  var NS = C.storagePrefix || "protokit";

  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var LS = {
    get: function (k, d) { var v = localStorage.getItem(NS + "-" + k); return v == null ? d : v; },
    set: function (k, v) { try { localStorage.setItem(NS + "-" + k, v); } catch (_) {} }
  };

  var theme = LS.get("theme", C.defaultTheme || (THEMES[0] && THEMES[0].id) || "purple");
  var mode = LS.get("mode", C.defaultMode || "light");
  var lang = LS.get("lang", C.defaultLang || "zh");   /* zh | en | system —— 语言偏好（与 mode 同走 data-* + 广播）*/
  var devMode = LS.get("dev", C.defaultDevice || "both");   /* both | phone | pad */
  var view = LS.get("view", "interactive");                  /* interactive | reference */
  var z = parseFloat(LS.get("zoom", "1")) || 1;
  var current = SCREENS[0] ? SCREENS[0].id : null;
  var navStack = [];           /* 前进历史栈，供「返回」反向滑动 */
  var stageBusy = false;       /* 过渡进行中，防抖避免叠加 */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var byId = {}; SCREENS.forEach(function (s) { byId[s.id] = s; });

  function src(id, dev, state, extra) { return DIR + id + ".html?device=" + dev + "&state=" + (state || "default") + "&theme=" + theme + "&mode=" + mode + "&lang=" + lang + (extra ? ("&" + extra) : ""); }
  function devsFor() { return devMode === "both" ? ["phone", "pad"] : [devMode]; }
  function devLabel(d) { return (DEV[d] && DEV[d].label) || d; }
  /* 设备别名：pad 上某子屏就地活在父屏右栏（master-detail），不单独成屏；phone 永远用原 id */
  function resolveDev(id, dev) { return (dev === "pad" && ALIAS[id]) ? ALIAS[id] : id; }
  function ridOf(extra) { var m = /(?:^|&)rid=([^&]+)/.exec(extra || ""); return m ? decodeURIComponent(m[1]) : null; }

  /* ---------- 顶栏：主题色板 ---------- */
  function buildSwatches() {
    var host = $("#switcher"); if (!host) return;
    host.innerHTML = THEMES.map(function (t) {
      return '<button class="swatch-btn" data-set="' + t.id + '" title="' + t.name + '"' + (t.color ? ' style="background:' + t.color + '"' : '') + '></button>';
    }).join("");
  }

  /* ---------- 屏幕索引（左侧 rail，仅交互视图）---------- */
  function buildRail() {
    var html = '<div class="rt">屏幕索引</div>'; var lastGrp = null;
    SCREENS.forEach(function (s) {
      if (s.group && s.group !== lastGrp) { html += '<div class="grp">' + s.group + '</div>'; lastGrp = s.group; }
      html += '<div class="ri ' + (s.id === current ? 'on' : '') + '" data-id="' + s.id + '"><span class="idx">' + (s.idx || '') + '</span><span class="nm">' + s.name + '</span></div>';
    });
    var rail = $("#rail"); if (!rail) return;
    rail.innerHTML = html;
    $$("#rail .ri").forEach(function (r) {
      r.onclick = function () {
        var id = r.dataset.id;
        if (view === "interactive") {
          if (id === current || stageBusy) return;
          var dir = SCREENS.findIndex(function (s) { return s.id === id; }) > SCREENS.findIndex(function (s) { return s.id === current; }) ? "forward" : "back";
          navStack = [];
          pushNav(id, dir);
          return;
        }
        current = id;
        $$("#rail .ri").forEach(function (x) { x.classList.toggle("on", x.dataset.id === id); });
        var sec = document.getElementById("sec-" + id);
        if (sec) $("#stage").scrollTo({ top: Math.max(0, sec.offsetTop * z - 20), behavior: "smooth" });
      };
    });
  }

  /* ---------- 状态快切条（仅交互视图·当前屏有 >1 状态才显）----------
     方便预览同一屏的各种状态（空/加载/失败/子态…），点即重载当前帧为该 state。
     可选特性：宿主页提供 #statebar 才启用（无则 no-op，kit demo 不受影响）。别名屏（pad 详情=列表）跳过。 */
  function curMainFrame() {
    var found = null;
    $$("#stage .scr").forEach(function (scr) {
      if (!scr._cache) return;
      var tid = resolveDev(current, scr._dev);
      if (tid === current && scr._cache[tid]) found = scr._cache[tid];
    });
    return found;
  }
  function buildStateBar() {
    var host = $("#statebar"); if (!host) return;
    var sc = byId[current]; var sts = (sc && sc.states) || [];
    if (view !== "interactive" || sts.length < 2) { host.style.display = "none"; host.innerHTML = ""; return; }
    host.style.display = "";
    var f = curMainFrame(), curState = "default";
    try { if (f) curState = f.dataset.state || new URL(f.src).searchParams.get("state") || "default"; } catch (_) {}
    host.innerHTML = '<span class="sb-lab">状态</span>' + sts.map(function (st) {
      return '<button class="sb-btn' + (st.k === curState ? ' on' : '') + '" data-k="' + st.k + '">' + st.n + '</button>';
    }).join("");
    $$("#statebar .sb-btn").forEach(function (b) {
      b.onclick = function () {
        var key = b.dataset.k;
        $$("#statebar .sb-btn").forEach(function (x) { x.classList.toggle("on", x === b); });
        $$("#stage .scr").forEach(function (scr) {
          var tid = resolveDev(current, scr._dev);
          if (tid !== current) return;                 /* 别名屏不污染 master */
          var fr = scr._cache && scr._cache[tid];
          if (!fr) return;
          fr.dataset.state = key;
          /* liveState 屏（实时态屏）：发 postMessage 就地切态、不重载 iframe（无白屏/无闪）；
             其余屏：仍改 src 重载（空/加载/失败等靠初始参数渲染）。*/
          if (sc.liveState) { whenReady(fr, function () { try { fr.contentWindow.postMessage({ type: "state", key: key }, "*"); } catch (_) {} }); }
          else { fr._loaded = false; fr.src = src(tid, scr._dev, key); }
        });
      };
    });
  }

  /* ============================================================
     交互视图 —— 当前屏在 iPhone / iPad 真跑（.scr 为常驻缓存页容器）
     ★ 无白屏关键：所有屏空闲预热并常驻缓存，且全程可见（translateX(0) 叠放、
       z-index 分层，当前页 z:1 盖住底层 z:0）——绝不 visibility:hidden，
       隐藏会让浏览器丢弃 iframe 渲染层、再显示时整页重绘（闪烁根源）。
       跳转只 transform / z-index（纯合成零重绘）；冷页 whenReady 等就绪才切；
       换条目走 select 消息就地换数据、零重载。
     ============================================================ */
  function fitScale(devs) {
    var stage = $("#stage"), pad = 80, gap = 56;
    var totalW = devs.reduce(function (a, d) { return a + DEV[d].w; }, 0) + gap * (devs.length - 1) + pad;
    var maxH = Math.max.apply(null, devs.map(function (d) { return DEV[d].h; }));
    return Math.min(1, (stage.clientHeight - pad) / maxH, (stage.clientWidth - pad) / totalW);
  }
  function deviceShellHTML(dev, s) {
    var cls = dev === "phone" ? "iphone" : "ipad";
    var w = Math.round(DEV[dev].w * s), h = Math.round(DEV[dev].h * s);
    return '<div class="box" style="width:' + w + 'px;height:' + h + 'px"><div class="dev dev-' + cls + '" style="transform:scale(' + s + ')"><div class="scr"></div></div></div>';
  }

  /* —— 页缓存：每个 .scr 持有一组常驻 iframe（按目标屏 tid 复用）—— */
  function pageSrc(scr, tid, extra) { return src(tid, scr._dev, "default", extra); }
  function makeFrame(scr, tid, extra) {
    var f = document.createElement("iframe");
    f.title = tid; f.dataset.screen = tid; f.dataset.rid = ridOf(extra) || "";
    /* 常驻页全程可见（绝不 visibility:hidden——隐藏会让浏览器丢弃 iframe 渲染层，
       再显示时整页重绘 → 闪烁）；平时停在 translateX(0) 压在底层（z:0），当前页 z:1 盖住。*/
    f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:var(--bg);transform:translateX(0);z-index:0;pointer-events:none;";
    f._loaded = false;
    f.addEventListener("load", function () { f._loaded = true; });
    f.src = pageSrc(scr, tid, extra);
    scr.appendChild(f);
    scr._cache[tid] = f;
    return f;
  }
  /* 取/建目标屏 iframe；常驻复用，绝不因 rid 重载（换条目靠 select 消息就地切）*/
  function getFrame(scr, tid, extra) {
    var f = scr._cache[tid];
    if (f) return f;
    return makeFrame(scr, tid, extra);
  }
  /* 就绪即回调：已加载的缓存页立即触发（秒滑）；冷页等 load，附安全兜底 */
  function whenReady(f, cb) {
    if (f._loaded) { cb(); return; }
    var done = false; var go = function () { if (done) return; done = true; cb(); };
    f.addEventListener("load", function () { f._loaded = true; go(); }, { once: true });
    setTimeout(go, 1600);
  }
  /* 空闲预热：把其余屏都加载好停屏外，后续跳转零等待、零白屏 */
  function warmPages(scrs) {
    var run = function () {
      scrs.forEach(function (scr) {
        SCREENS.forEach(function (s) {
          var tid = resolveDev(s.id, scr._dev);
          if (tid === scr._cur || scr._cache[tid]) return;
          makeFrame(scr, tid, "");
        });
      });
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1800 }); else setTimeout(run, 600);
  }

  function buildInteractive() {
    var devs = devsFor(), s = fitScale(devs);
    var stage = $("#stage"); stage.className = "stage";
    stage.innerHTML = '<div class="frames">' + devs.map(function (d) {
      return '<div class="fit">' + deviceShellHTML(d, s) + '<div class="dev-cap"><span class="d"></span>' + devLabel(d) + '</div></div>';
    }).join("") + '</div>';
    var scrs = $$("#stage .scr");
    scrs.forEach(function (scr, i) {
      var d = devs[i];
      scr._cache = {}; scr._dev = d; scr._cur = null;
      var tid = resolveDev(current, d);
      var f = getFrame(scr, tid, "");
      f.style.transform = "translateX(0)"; f.style.pointerEvents = "auto"; f.style.zIndex = "1";
      scr._cur = tid;
    });
    warmPages(scrs);
    stageBusy = false;
  }

  /* 交互视图：iOS push —— 复用常驻缓存页，方向滑动（旧屏左移压暗，新屏滑入）
     · extra：透传 rid（条目 id），让被复用的详情屏就地定位条目。
     · instant=true：平级 Tab 切换 → 瞬切（无横移、无压暗），等同 reduceMotion 分支。
     · 逐设备解析目标（resolveDev）：若某设备解析后目标 == 当前屏（pad 详情即列表），
       则不跳转，发 {type:"select", rid} 就地更新右栏。*/
  function pushNav(id, dir, extra, instant) {
    dir = dir || "forward";
    if (view !== "interactive") { current = id; buildRail(); render(); return; }
    var scrs = $$("#stage .scr");
    current = id; buildRail(); buildStateBar();
    if (!scrs.length) { buildInteractive(); return; }
    var devs = devsFor();
    var rid = ridOf(extra);

    var parts = [];
    scrs.forEach(function (scr, i) {
      var d = devs[i] || devs[0];
      var tid = resolveDev(id, d);
      if (tid === scr._cur) {
        if (rid) { var cur = scr._cache[tid]; try { cur.contentWindow.postMessage({ type: "select", rid: rid }, "*"); } catch (_) {} }
        return;
      }
      var existed = !!scr._cache[tid];
      var newF = getFrame(scr, tid, extra);
      /* 常驻详情页换条目：发 select 就地切（不重载），秒滑入 */
      if (existed && rid && (newF.dataset.rid || "") !== rid) {
        newF.dataset.rid = rid;
        try { newF.contentWindow.postMessage({ type: "select", rid: rid }, "*"); } catch (_) {}
      }
      parts.push({ scr: scr, tid: tid, oldF: scr._cache[scr._cur] || null, newF: newF });
    });
    if (!parts.length) { stageBusy = false; return; }

    var enterFrom = dir === "back" ? "-100%" : "100%";
    var exitTo = dir === "back" ? "100%" : "-22%";

    if (reduceMotion || instant) {
      parts.forEach(function (p) {
        whenReady(p.newF, function () {
          var newF = p.newF, oldF = p.oldF;
          /* 零闪烁瞬切：缓存页常驻可见、早已画好压在底层，切换只是 z-index 提升——
             纯合成操作，不触发任何重绘。*/
          newF.style.transition = "none";
          newF.style.transform = "translateX(0)";
          newF.style.zIndex = "2"; newF.style.pointerEvents = "auto";
          if (oldF) { oldF.style.zIndex = "1"; oldF.style.pointerEvents = "none"; }
          requestAnimationFrame(function () {
            if (oldF) { oldF.style.transition = ""; oldF.style.filter = ""; oldF.style.transform = "translateX(0)"; oldF.style.zIndex = "0"; }
            newF.style.zIndex = "1";
            p.scr._cur = p.tid;
          });
        });
      });
      return;
    }

    stageBusy = true;
    var pending = parts.length;
    parts.forEach(function (p) {
      var newF = p.newF, oldF = p.oldF;
      /* 新页：先无动画移到入场起点（仍在屏外、被裁剪不露白），就绪后再滑 */
      newF.style.transition = "none";
      newF.style.transform = "translateX(" + enterFrom + ")";
      newF.style.zIndex = "2"; newF.style.pointerEvents = "none";
      if (oldF) { oldF.style.zIndex = "1"; oldF.style.pointerEvents = "none"; }
      void newF.offsetWidth;
      whenReady(newF, function () {
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          newF.style.transition = "transform .42s cubic-bezier(.32,.72,0,1)";
          newF.style.transform = "translateX(0)";
          newF.style.pointerEvents = "auto";  /* 滑入即可滚动：新页已是活动页，无需等动画结束再解锁（消除进场头 ~470ms 滚动死区）*/
          if (oldF) {
            oldF.style.transition = "transform .42s cubic-bezier(.32,.72,0,1), filter .42s ease";
            oldF.style.transform = "translateX(" + exitTo + ")";
            oldF.style.filter = "brightness(.86)";
          }
        }); });
        setTimeout(function () {
          if (oldF) { oldF.style.transition = ""; oldF.style.filter = ""; oldF.style.transform = "translateX(0)"; oldF.style.zIndex = "0"; }
          newF.style.transition = ""; newF.style.transform = "translateX(0)"; newF.style.zIndex = "1"; newF.style.pointerEvents = "auto";
          p.scr._cur = p.tid;
          if (--pending <= 0) stageBusy = false;
        }, 470);
      });
    });
  }

  /* ============================================================
     参考视图 —— 全部屏 × 状态 × 设备平铺速览（缩放 + 拖拽平移）
     ============================================================ */
  function frameBox(id, dev, state, s) {
    var cls = dev === "phone" ? "iphone" : "ipad";
    var rid = resolveDev(id, dev);
    var w = Math.round(DEV[dev].w * s), h = Math.round(DEV[dev].h * s);
    return '<div class="box" style="width:' + w + 'px;height:' + h + 'px"><div class="dev dev-' + cls + '" style="transform:scale(' + s + ')"><div class="scr"><iframe src="' + src(rid, dev, state) + '" data-screen="' + rid + '" loading="lazy" style="pointer-events:none" title="' + rid + ' ' + dev + ' ' + state + '"></iframe></div></div></div>';
    /* 参考视图 = 静态快照：iframe 不接点击（pointer-events:none），避免误点进子态后无法回退（用户反馈）。 */
  }
  function buildReference() {
    var devs = devsFor();
    var stage = $("#stage"); stage.className = "stage is-ref";
    var html = '<div class="board-world"><div class="board">';
    SCREENS.forEach(function (sc) {
      html += '<div class="bsec" id="sec-' + sc.id + '"><div class="bsec-head"><span class="idx">' + (sc.idx || '') + '</span><span class="nm">' + sc.name + '</span>' + (sc.group ? '<span class="gp">' + sc.group + '</span>' : '') + '</div>';
      devs.forEach(function (d) {
        html += '<div class="bdev"><div class="bdev-lab"><span class="d"></span>' + devLabel(d) + '</div><div class="brow">';
        (sc.states || [{ k: "default", n: "默认" }]).forEach(function (st) {
          html += '<div class="bcard">' + frameBox(sc.id, d, st.k, REF_SCALE) + '<div class="bcap">' + st.n + '</div></div>';
        });
        html += '</div></div>';
      });
      html += '</div>';
    });
    $("#stage").innerHTML = html + "</div></div>";
    applyZoom();
  }

  function render() {
    $("#viewer").classList.toggle("ref", view === "reference");
    if (view === "interactive") buildInteractive(); else buildReference();
    buildStateBar();
  }

  /* 参考视图：缩放 + 拖拽平移 */
  function clampZ(v) { return Math.max(0.3, Math.min(2, v)); }
  function applyZoom() {
    var board = $("#stage .board"), world = $("#stage .board-world");
    if (!board || !world) return;
    board.style.transform = "scale(" + z + ")";
    world.style.width = (board.offsetWidth * z) + "px";
    world.style.height = (board.offsetHeight * z) + "px";
    var p = $("#zoomctl .pct"); if (p) p.textContent = Math.round(z * 100) + "%";
  }
  function setZoom(nz) {
    var stage = $("#stage"); nz = clampZ(nz);
    var cx = stage.scrollLeft + stage.clientWidth / 2, cy = stage.scrollTop + stage.clientHeight / 2;
    var ratio = nz / z; z = nz; LS.set("zoom", z);
    applyZoom();
    stage.scrollLeft = cx * ratio - stage.clientWidth / 2;
    stage.scrollTop = cy * ratio - stage.clientHeight / 2;
  }

  /* ---------- 顶栏 / 状态应用 ---------- */
  function broadcast() { $$("#stage iframe").forEach(function (f) { try { f.contentWindow.postMessage({ type: "theme", theme: theme, mode: mode, lang: lang }, "*"); } catch (e) {} }); }
  function applyTop() {
    root.setAttribute("data-theme", theme); root.setAttribute("data-mode", mode);
    $$(".swatch-btn").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.set === theme)); });
    var mt = $("#modeToggle .lbl"); if (mt) mt.textContent = mode === "dark" ? "深色" : "浅色";
    $$("#devSeg button").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.dev === devMode)); });
    $$("#viewSeg button").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.view === view)); });
  }

  /* ---------- 事件 ---------- */
  document.addEventListener("click", function (e) {
    var sw = e.target.closest(".swatch-btn");
    if (sw) { theme = sw.dataset.set; LS.set("theme", theme); applyTop(); broadcast(); return; }
    if (e.target.closest("#modeToggle")) { mode = mode === "dark" ? "light" : "dark"; LS.set("mode", mode); applyTop(); broadcast(); return; }
    var db = e.target.closest("#devSeg button");
    if (db) { devMode = db.dataset.dev; LS.set("dev", devMode); applyTop(); render(); return; }
    var vb = e.target.closest("#viewSeg button");
    if (vb) { view = vb.dataset.view; LS.set("view", view); applyTop(); render(); return; }
    var zb = e.target.closest("#zoomctl [data-z]");
    if (zb) {
      if (zb.dataset.z === "in") setZoom(z * 1.25);
      else if (zb.dataset.z === "out") setZoom(z / 1.25);
      else { z = 1; LS.set("zoom", 1); applyZoom(); }
      return;
    }
  });

  $("#stage").addEventListener("wheel", function (e) {
    if (view !== "reference" || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); setZoom(z * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  var panning = false, psx, psy, psl, pst;
  $("#stage").addEventListener("pointerdown", function (e) {
    if (view !== "reference") return;
    if (e.target.closest("#zoomctl")) return;   /* 参考态 iframe 不接点击，拖拽可跨卡平移整个画布 */
    panning = true; psx = e.clientX; psy = e.clientY; psl = $("#stage").scrollLeft; pst = $("#stage").scrollTop;
    $("#stage").classList.add("panning");
  });
  window.addEventListener("pointermove", function (e) {
    if (!panning) return;
    $("#stage").scrollLeft = psl - (e.clientX - psx); $("#stage").scrollTop = pst - (e.clientY - psy);
  });
  window.addEventListener("pointerup", function () { if (panning) { panning = false; $("#stage").classList.remove("panning"); } });

  /* 来自 iframe 的导航消息 */
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "ready") { try { e.source.postMessage({ type: "theme", theme: theme, mode: mode, lang: lang }, "*"); } catch (_) {} }
    else if (d.type === "setLang" && d.lang) { lang = d.lang; LS.set("lang", lang); broadcast(); }   /* 屏内（我的/偏好）切语言 → 持久化 + 广播全屏全局生效 */
    else if (d.type === "setMode" && d.mode) { mode = d.mode === "dark" ? "dark" : "light"; LS.set("mode", mode); applyTop(); broadcast(); }   /* 屏内（显示页）切外观 → 持久化 + 同步顶栏 + 广播全局 */
    else if (d.type === "setTheme" && d.theme) { theme = d.theme; LS.set("theme", theme); applyTop(); broadcast(); }   /* 屏内（显示页）切主题 → 同上 */
    else if (d.type === "nav" && d.to) {
      if (byId[d.to] && !stageBusy) {
        if (d.mode === "tab") { navStack = []; pushNav(d.to, "forward", "", true); }   /* 平级 Tab：清栈 + 瞬切 */
        else { navStack.push(current); pushNav(d.to, "forward", d.rid ? ("rid=" + encodeURIComponent(d.rid)) : ""); }
      }
    }
    else if (d.type === "back") { if (!stageBusy) { var to = navStack.length ? navStack.pop() : (C.homeId || (SCREENS[0] && SCREENS[0].id)); if (to) pushNav(to, "back"); } }
    else if (d.type === "groups:sync") { $$("#stage iframe").forEach(function (f) { try { f.contentWindow.postMessage({ type: "groups:sync", payload: d.payload }, "*"); } catch (_) {} }); }   /* 分组态跨屏 relay：某屏改色/重命名/移成员 → 同步全部缓存屏（含「上一页」列表） */
  });

  var rt; window.addEventListener("resize", function () { if (view !== "interactive") return; clearTimeout(rt); rt = setTimeout(buildInteractive, 120); });

  /* ---------- 初始化 ---------- */
  buildSwatches();
  applyTop();
  buildRail();
  render();
})();
