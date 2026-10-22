/* course-kit · vl.js —— 与皮肤无关的共享脚本。放在 </main> 之后、页面脚本之前。
   组件只管结构、交互、无障碍；颜色、字体、描边、纹理全在皮肤 skin.css。界面文字一律走 VL.t(键, 中文默认)，英文表在下面 EN。
   API 的唯一权威说明在 kit/README.md；这里的注释只讲"为什么"。 */
(function () {
  "use strict";
  const doc = document, root = doc.documentElement, body = doc.body;
  const main = doc.querySelector("main");
  const C = window.VL_COURSE || {};
  const ID = C.id || "vl";
  const LANG = /^en/i.test(root.lang || "") ? "en" : "zh";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- 界面文字：中文默认写在调用处，英文查表；课程可用 window.VL_I18N 补充或覆盖 ---------- */
  const EN = {
    "tb.home": "Contents", "tb.chap": "Ch. {0} / {1}", "tb.chapList": "All chapters", "tb.prefs": "Display", "tb.lang": "中文", "tb.langAria": "Switch to Chinese",
    "pref.theme": "Colours", "pref.light": "Light", "pref.dark": "Dark", "pref.sepia": "Easy on the eyes",
    "pref.fx": "Motion", "pref.auto": "Auto", "pref.full": "Full", "pref.lite": "Light", "pref.off": "Off",
    "pref.now": "Now: {0}", "pref.rm": "Your system asks for reduced motion, so motion stays off.",
    "ch.badge": "Chapter {0}", "ch.wip": "Chapter {0} is still being written", "ch.done": "done",
    "nav.title": "In this chapter", "nav.open": "Expand all", "nav.close": "Collapse all", "nav.top": "Back to top", "nav.fold": "Fold or unfold this section",
    "pg.prev": "Previous", "pg.next": "Next", "pg.home": "Back to contents", "pg.toc": "Contents",
    "eg.k": "Example", "eg.bad": "Counterexample", "eg.prev": "Previous example", "eg.next": "Next example", "eg.tabs": "Examples",
    "cc.tag": "Concept card", "cc.aria": "Concept card: {0}", "cc.plain": "In plain words", "cc.eg": "Example", "cc.nofig": "Concept picture missing",
    "why.tag": "Why it works",
    "side.default": "Optional", "side.story": "Invention story", "side.history": "History", "side.math": "Maths", "side.play": "Play more", "side.debate": "Debate", "side.source": "Original source", "side.extra": "Extra practice", "side.more": "Going further",
    "side.open": "Open", "side.close": "Close",
    "try.k": "Try it:", "try.ok": "Done!", "try.was": "Done earlier.",
    "g.think": "See an answer", "g.hide": "Hide", "g.again": "Guess again", "g.right": "Right.", "g.wrong": "Not quite.", "g.label": "Your estimate", "g.go": "Reveal", "g.you": "You: {0}", "g.ans": "Answer: {0}",
    "g.near": "Almost spot on!", "g.low": "Too low: the answer is {0}× your guess.", "g.high": "Too high: your guess is {0}× the answer.", "g.good": "Very close! ", "g.close": "Not far. ", "g.far": "Quite a way off. ", "g.diff": "Off by {0}.",
    "fig.n": "Figure {0}", "fig.ref": "Figure {0}",
    "q.prev": "← Previous", "q.next": "Next →", "q.nth": "Question {0}", "q.score": "Correct: {0} / {1}", "q.first": " (first try: {0})", "q.badge": "All questions in this chapter answered.",
    "q.right": "Correct.", "q.wrong": "Not that one. Try another.", "q.slot": "Drag your answer here", "q.picked": "Card selected. Press Enter on the answer slot to place it.", "q.group": "Practice questions (use left and right to turn)",
    "note.saved": "Saved", "note.ph": "Write your thoughts here…",
    "dg.hint": "Tap a part to see what it does.", "dg.layer": "Layer {0}",
    "dg.demo": " (illustrative)", "dg.more": "{0} more", "dg.treeSplit": "splits into {0}", "dg.balSlider": "Drag to see which way the scale tips",
    "dg.netCause": "leads to", "dg.cmpBy": ", comparing {0}", "dg.balPivot": "pivot", "dg.netAnd": " and ", "dg.netWith": " and ", "dg.stackTotal": ", adding up to {0}", "dg.netLink": "related", "dg.netBoth": "affect each other", "dg.netLinks": "Linked to: {0}",
    "dg.cycleAria": "Cycle diagram: {0}, then back to {1}", "dg.nestedAria": "Nested diagram, from inside out: {0}", "dg.flowAria": "Flow diagram: {0}",
    "dg.quadAria": "Quadrant diagram: across is {0}, up is {1}; the four boxes are {2}", "dg.cmpAria": "Comparison: {0} and {1}{2}",
    "dg.tlAria1": "Timeline with {0} tracks: {1}", "dg.tlAria2": "A curve that rises and falls over time{0}; key moments: {1}",
    "dg.treeAria": "Tree diagram: {0}", "dg.vennAria": "Venn diagram with {0} circles, {1}. {2}", "dg.balAria": "Balance: left {0}, right {1}{2}",
    "dg.netAria": "Relationship diagram: {0}", "dg.specAria": "Spectrum{0}: from “{1}” to “{2}”, in order: {3}", "dg.stackAria": "Stack diagram, from bottom to top: {0}{1}",
  };
  const EXTRA = window.VL_I18N || {};
  function t(key, zh, ...a) {
    let s = EXTRA[LANG] && EXTRA[LANG][key] != null ? EXTRA[LANG][key] : (LANG === "en" ? EN[key] : undefined);
    if (typeof s === "function") return String(s(...a));
    if (s == null) s = zh;
    return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m));
  }

  /* ---------- 存储：全部 try/catch（隐私模式、禁用存储时 localStorage 会抛错）；课程数据带前缀 <id>- ---------- */
  const raw = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const store = {
    key: k => ID + "-" + k,
    get(k) { return raw.get(ID + "-" + k); },
    set(k, v) { raw.set(ID + "-" + k, v); },
    json(k, fb) { try { const v = JSON.parse(raw.get(ID + "-" + k)); return v == null ? fb : v; } catch (e) { return fb; } },
    setJSON(k, v) { try { raw.set(ID + "-" + k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- 章节表、当前章、篇章 ---------- */
  const CH = (C.chapters || []).map((c, i) => Array.isArray(c) ? { n: i + 1, zh: c[0], file: c[1], en: c[2] || c[0] } : Object.assign({ n: i + 1 }, c));
  const PARTS = C.parts || [];
  const FILE = (location.pathname.split("/").pop() || "index.html");
  const BASE = FILE.replace(/\.html?$/i, "");
  let cur = parseInt(body.dataset.ch || "0", 10) || 0;
  if (!cur) { const f = CH.find(c => c.file === FILE); if (f) cur = f.n; }
  const nm = c => (LANG === "en" ? (c.en || c.zh) : c.zh);
  const partOf = n => PARTS.findIndex(p => n >= p.from && n <= p.to);
  const HOME = C.home || "index.html";
  if (cur) {
    const pi = partOf(cur);
    body.dataset.part = String(pi >= 0 ? pi + 1 : 1);
    body.dataset.pat = String(cur % 4);
    const k = pi >= 0 ? cur - PARTS[pi].from : cur;
    root.style.setProperty("--vl-dh", String(((k % 5) - 2) * 9));   // 同篇各章色相微移 -18…+18（皮肤决定用不用）
    root.style.setProperty("--vl-chnum", '"' + String(cur).padStart(2, "0") + '"');
  }

  /* ---------- 进度：只由"本章测验全部答对"记录，不按滚动或停留 ---------- */
  const Progress = {
    get() { return store.json("progress", {}); },
    done(n) {
      const p = this.get(); if (p[n]) return; p[n] = true; store.setJSON("progress", p);
      doc.querySelectorAll('.vl-tb-dots a[data-n="' + n + '"], .vl-pop a[data-n="' + n + '"]').forEach(a => a.classList.add("done"));
    },
  };

  /* ---------- 动效档位（自动判定 + 手动覆盖）与配色 ---------- */
  const mq = s => { try { return !!(window.matchMedia && matchMedia(s).matches); } catch (e) { return false; } };
  const autoLevel = window.__VL_FX_AUTO || (() => (mq("(prefers-reduced-motion: reduce)") ? "off" : (mq("(max-width: 700px)") || mq("(pointer: coarse)")) ? "lite" : "full"));
  function fxChoice() { const v = raw.get("vl-fx"); return ["full", "lite", "off"].includes(v) ? v : "auto"; }
  function fxLevel() {
    if (mq("(prefers-reduced-motion: reduce)")) return "off";
    const c = fxChoice(); return c === "auto" ? autoLevel() : c;
  }
  function applyFx() {
    const lv = fxLevel();
    root.classList.remove("vl-fx-full", "vl-fx-lite", "vl-fx-off"); root.classList.add("vl-fx-" + lv);
    doc.dispatchEvent(new CustomEvent("vl:fx", { detail: { level: lv } }));
    return lv;
  }
  function setFx(choice) { raw.set("vl-fx", choice); applyFx(); syncPrefs(); }
  const SCHEMES = ["light", "dark", "sepia"];
  function scheme() { const v = root.getAttribute("data-scheme"); return SCHEMES.includes(v) ? v : "light"; }
  function setScheme(v) {
    if (!SCHEMES.includes(v)) return;
    root.setAttribute("data-scheme", v); raw.set("vl-scheme", v); syncPrefs();
    doc.dispatchEvent(new CustomEvent("vl:scheme", { detail: { scheme: v } }));
  }
  if (!root.getAttribute("data-scheme")) { const v = raw.get("vl-scheme"); root.setAttribute("data-scheme", SCHEMES.includes(v) ? v : "light"); }
  applyFx();
  try { ["(prefers-reduced-motion: reduce)", "(max-width: 700px)"].forEach(s => matchMedia(s).addEventListener("change", () => { applyFx(); syncPrefs(); })); } catch (e) {}
  const motion = () => !root.classList.contains("vl-fx-off");

  /* ---------- 小工具 ---------- */
  const $ = (s, r) => (r || doc).querySelector(s);
  const $$ = (s, r) => Array.from((r || doc).querySelectorAll(s));
  function el(tag, attrs, html) {
    const e = doc.createElement(tag);
    if (attrs) for (const k in attrs) { if (attrs[k] == null || attrs[k] === false) continue; if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // 带种子的随机数：首屏结果固定，正文里写的数和读者第一次看到的一致
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function shake(e) { if (!e || !motion()) return; e.classList.remove("vl-shake"); void e.offsetWidth; e.classList.add("vl-shake"); setTimeout(() => e.classList.remove("vl-shake"), 320); }
  const ICON = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>',
    prefs: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l5 5L20 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    caret: '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  };

  // 皮肤的 SVG 滤镜（如手绘抖动）放进页面一次
  const SKIN = window.VL_SKIN || {};
  if (SKIN.defs && !doc.getElementById("vl-defs")) body.insertAdjacentHTML("afterbegin", '<svg id="vl-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + SKIN.defs + "</defs></svg>");

  /* ---------- 浮层：同一时间只开一个；Esc 和点外面关闭，焦点回到按钮 ---------- */
  const POPS = [];
  function popover(btn, pop) {
    btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", pop.id);
    const o = {
      btn, pop,
      open(on) {
        if (on) POPS.forEach(p => p !== o && p.open(false));
        pop.classList.toggle("open", on); btn.setAttribute("aria-expanded", String(on));
        if (on) { const f = pop.querySelector("[aria-pressed=true], li.cur a, a, button"); if (f) f.focus({ preventScroll: true }); }
      },
      isOpen: () => pop.classList.contains("open"),
    };
    btn.addEventListener("click", e => { e.stopPropagation(); o.open(!o.isOpen()); });
    POPS.push(o); return o;
  }
  doc.addEventListener("click", e => POPS.forEach(p => { if (p.isOpen() && !p.pop.contains(e.target) && !p.btn.contains(e.target)) p.open(false); }));
  doc.addEventListener("keydown", e => { if (e.key !== "Escape") return; POPS.forEach(p => { if (p.isOpen()) { p.open(false); p.btn.focus(); } }); });

  /* ---------- 顶栏：回目录、章节点（宽屏）、章节弹层（手机也能跳章）、显示偏好、语言 ---------- */
  let prefsPop = null;
  function syncPrefs() {
    if (!prefsPop) return;
    const th = scheme(), fc = fxChoice(), lv = fxLevel();
    prefsPop.querySelectorAll("[data-scheme-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.schemeV === th)));
    prefsPop.querySelectorAll("[data-fx-v]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.fxV === fc)));
    const now = prefsPop.querySelector(".vl-pref-now");
    if (now) now.textContent = mq("(prefers-reduced-motion: reduce)") ? t("pref.rm", "系统设置了“减少动态”，动效保持关闭。") : t("pref.now", "当前：{0}", t("pref." + lv, { full: "全开", lite: "轻量", off: "关" }[lv]));
  }
  (function topbar() {
    if (doc.querySelector(".vl-topbar") || C.topbar === false) return;
    const bar = el("header", { class: "vl-topbar" });
    const prog = Progress.get();
    let html = "";
    if (cur) html += '<a class="vl-tb-home" href="' + esc(HOME) + '">' + ICON.book + "<span>" + esc(t("tb.home", "目录")) + "</span></a>";
    if (cur && CH.length) {
      html += '<nav class="vl-tb-dots" aria-label="' + esc(t("tb.chapList", "全部章节")) + '">' + CH.map(c =>
        (c.open === false ? '<span class="off" data-n="' + c.n + '" data-part="' + (partOf(c.n) + 1) + '" aria-hidden="true">' + c.n + "</span>" :
          '<a data-n="' + c.n + '" data-part="' + (partOf(c.n) + 1) + '" href="' + esc(c.file) + '" title="' + esc(nm(c)) + '" class="' + (c.n === cur ? "cur" : "") + (prog[c.n] ? " done" : "") + '"' + (c.n === cur ? ' aria-current="page"' : "") + ">" + c.n + "</a>")).join("") + "</nav>";
      html += '<button type="button" class="vl-tb-btn vl-tb-chap">' + ICON.list + '<span class="vl-tb-txt">' + esc(t("tb.chap", "第 {0} / {1} 章", cur, CH.length)) + "</span></button>";
    }
    html += '<button type="button" class="vl-tb-btn vl-tb-prefs"' + (cur ? "" : ' style="margin-left:auto"') + ">" + ICON.prefs + '<span class="vl-tb-txt">' + esc(t("tb.prefs", "显示")) + "</span></button>";
    // 语言按钮：英文完成前只占位（hidden），英文页始终显示
    const showLang = LANG === "en" || C.enReady === true;
    const langHref = LANG === "en" ? "../" + FILE : (C.enDir || "en/") + FILE;
    html += '<a class="vl-tb-btn vl-tb-lang" href="' + esc(langHref) + '" lang="' + (LANG === "en" ? "zh-CN" : "en") + '" aria-label="' + esc(t("tb.langAria", "Switch to English")) + '"' + (showLang ? "" : " hidden") + ">" + esc(t("tb.lang", "EN")) + "</a>";
    bar.innerHTML = html;
    body.insertBefore(bar, body.firstChild);
    // 章节弹层
    const chapBtn = bar.querySelector(".vl-tb-chap");
    if (chapBtn) {
      const pop = el("div", { class: "vl-pop vl-pop-chap", id: "vl-pop-chap", role: "dialog", "aria-label": t("tb.chapList", "全部章节") });
      const groups = PARTS.length ? PARTS.map((p, i) => ({ name: LANG === "en" ? p.en || p.zh : p.zh, list: CH.filter(c => c.n >= p.from && c.n <= p.to), i })) : [{ name: "", list: CH }];
      pop.innerHTML = "<h4>" + esc(t("tb.chapList", "全部章节")) + "</h4>" + groups.map(g => (g.name ? '<p class="vl-pop-part" data-part="' + (g.i + 1) + '">' + esc(g.name) + "</p>" : "") +
        '<ol start="' + (g.list[0] ? g.list[0].n : 1) + '">' + g.list.map(c => '<li class="' + (c.n === cur ? "cur" : "") + '">' +
          (c.open === false ? '<span class="off">' + esc(nm(c)) + "</span>" : '<a data-n="' + c.n + '" href="' + esc(c.file) + '" class="' + (prog[c.n] ? "done" : "") + '"' + (c.n === cur ? ' aria-current="page"' : "") + ">" + esc(nm(c)) + "</a>") + "</li>").join("") + "</ol>").join("");
      bar.appendChild(pop); popover(chapBtn, pop);
    }
    // 显示偏好：配色三套 + 动效三档（另有"自动"）
    const pp = el("div", { class: "vl-pop vl-pop-prefs", id: "vl-pop-prefs", role: "dialog", "aria-label": t("tb.prefs", "显示") });
    pp.innerHTML = "<h4>" + esc(t("pref.theme", "配色")) + '</h4><div class="vl-seg" role="group" aria-label="' + esc(t("pref.theme", "配色")) + '">' +
      [["light", "亮"], ["dark", "暗"], ["sepia", "护眼"]].map(([v, zh]) => '<button type="button" data-scheme-v="' + v + '" aria-pressed="false">' + esc(t("pref." + v, zh)) + "</button>").join("") + "</div>" +
      "<h4>" + esc(t("pref.fx", "动效")) + '</h4><div class="vl-seg" role="group" aria-label="' + esc(t("pref.fx", "动效")) + '">' +
      [["auto", "自动"], ["full", "全开"], ["lite", "轻量"], ["off", "关"]].map(([v, zh]) => '<button type="button" data-fx-v="' + v + '" aria-pressed="false">' + esc(t("pref." + v, zh)) + "</button>").join("") + "</div>" +
      '<p class="vl-pref-now" aria-live="polite"></p>';
    bar.appendChild(pp); popover(bar.querySelector(".vl-tb-prefs"), pp); prefsPop = pp;
    pp.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.schemeV) setScheme(b.dataset.schemeV);
      if (b.dataset.fxV) setFx(b.dataset.fxV);
    });
    syncPrefs();
  })();

  /* ---------- 章首：徽记缺了就补 ---------- */
  (function hero() {
    const h = doc.querySelector(".vl-hero"); if (!h || !cur) return;
    if (!h.querySelector(".vl-badge")) {
      const txt = h.querySelector(".vl-hero-txt") || h;
      txt.insertAdjacentHTML("afterbegin", '<span class="vl-badge">' + esc(t("ch.badge", "第 {0} 章", cur)) + "</span>");
    }
  })();

  /* ---------- 分节折叠 + 章内目录 + 阅读进度 ---------- */
  const SECS = [];
  (function sections() {
    if (!main) return;
    const secs = Array.from(main.children).filter(e => e.classList && e.classList.contains("vl-sec"));
    const bar = el("div", { class: "vl-readbar", "aria-hidden": "true" }, "<i></i>");
    body.appendChild(bar);
    const fill = bar.firstChild;
    const onRead = () => { const h = root.scrollHeight - innerHeight; fill.style.width = (h > 0 ? clamp(scrollY / h, 0, 1) * 100 : 0) + "%"; };
    if (secs.length < 2) { addEventListener("scroll", onRead, { passive: true }); onRead(); return; }
    secs.forEach((sec, i) => {
      const bd = el("div", { class: "vl-sec-body" });
      let n = sec.nextSibling;
      while (n && !(n.nodeType === 1 && (n.classList.contains("vl-sec") || n.classList.contains("vl-pager")))) { const nx = n.nextSibling; bd.appendChild(n); n = nx; }
      sec.after(bd);
      sec.id = sec.id || "sec" + (i + 1);
      bd.id = sec.id + "-body";
      if (!sec.querySelector(".vl-n")) sec.insertAdjacentHTML("afterbegin", '<span class="vl-n" aria-hidden="true">' + (i + 1) + "</span>");
      sec.tabIndex = 0; sec.setAttribute("role", "button"); sec.setAttribute("aria-expanded", "true"); sec.setAttribute("aria-controls", bd.id); sec.title = t("nav.fold", "点击收起 / 展开这一节");
      sec.insertAdjacentHTML("beforeend", '<span class="vl-caret" aria-hidden="true">' + ICON.caret + "</span>");
      const toggle = open => {
        const willOpen = open === undefined ? bd.classList.contains("collapsed") : open;
        bd.classList.toggle("collapsed", !willOpen); sec.classList.toggle("folded", !willOpen); sec.setAttribute("aria-expanded", String(willOpen));
      };
      sec._toggle = toggle; SECS.push(sec);
      sec.addEventListener("click", e => { if (e.target.closest("a,button,input,.vl-term")) return; toggle(); });
      sec.addEventListener("keydown", e => { if (e.target === sec && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } });
    });
    const fab = el("button", { type: "button", class: "vl-fab", "aria-label": t("nav.title", "本章目录") }, ICON.list);
    const panel = el("div", { class: "vl-navpanel", id: "vl-navpanel", role: "dialog", "aria-label": t("nav.title", "本章目录") });
    panel.innerHTML = "<h4>" + esc(t("nav.title", "本章目录")) + "</h4><ol>" + secs.map((s, i) => { const h = s.querySelector("h2"); return '<li><a href="#' + s.id + '" data-i="' + i + '">' + esc(h ? h.textContent.trim() : "") + "</a></li>"; }).join("") +
      '</ol><div class="vl-navtools"><button type="button" data-a="open">' + esc(t("nav.open", "全部展开")) + '</button><button type="button" data-a="close">' + esc(t("nav.close", "全部收起")) + '</button><button type="button" data-a="top">' + esc(t("nav.top", "回到顶部")) + "</button></div>";
    body.append(fab, panel);
    const P = popover(fab, panel);
    const smooth = () => (motion() ? "smooth" : "auto");
    panel.addEventListener("click", e => {
      const a = e.target.closest("a[data-i]");
      if (a) { e.preventDefault(); const s = secs[+a.dataset.i]; s._toggle(true); s.scrollIntoView({ behavior: smooth(), block: "start" }); P.open(false); s.focus({ preventScroll: true }); }
      const b = e.target.closest("button[data-a]");
      if (b) {
        if (b.dataset.a === "open") secs.forEach(s => s._toggle(true));
        if (b.dataset.a === "close") secs.forEach(s => s._toggle(false));
        if (b.dataset.a === "top") { scrollTo({ top: 0, behavior: smooth() }); P.open(false); }
      }
    });
    const links = panel.querySelectorAll("a[data-i]");
    let tick = false;
    const onScroll = () => {
      tick = false; onRead();
      let k = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.35) k = i; });   // 当前节：顶边过视口 35%
      links.forEach((a, i) => { a.classList.toggle("on", i === k); if (i === k) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  })();

  /* ---------- 例子轮播：连续的 .vl-eg 自动合成一组，一次显示一个 ---------- */
  let carN = 0;
  function buildCarousels(scope) {
    const seen = new Set();
    $$(".vl-eg", scope || main || body).forEach(e => {
      if (seen.has(e) || e.closest(".vl-egcar")) return;
      const run = []; let n = e;
      while (n && n.classList && n.classList.contains("vl-eg")) { run.push(n); seen.add(n); n = n.nextElementSibling; }
      if (run.length >= 2) carousel(run);
      else labelEg(run[0]);
    });
  }
  function labelEg(item) {
    if (item.querySelector(".vl-egk")) return;
    const bad = item.classList.contains("bad");
    const kids = Array.from(item.childNodes).filter(c => !(c.nodeType === 1 && (c.classList.contains("vl-illus") || c.hasAttribute("data-illus") || c.tagName === "FIGURE")));
    let tx = item.querySelector(":scope > .vl-egt");
    if (!tx) { tx = el("div", { class: "vl-egt" }); kids.forEach(c => tx.appendChild(c)); item.appendChild(tx); }
    tx.insertAdjacentHTML("afterbegin", '<span class="vl-egk">' + esc(bad ? t("eg.bad", "反例") : t("eg.k", "例子")) + "</span>");
    if (item.querySelector(".vl-illus, [data-illus], :scope > figure, :scope > svg, :scope > img")) item.classList.add("hasimg");
  }
  function carousel(run) {
    const k0 = ++carN;
    const car = el("div", { class: "vl-egcar" });
    const tabs = el("div", { class: "vl-egtabs", role: "tablist", "aria-label": t("eg.tabs", "例子") });
    const stage = el("div", { class: "vl-egstage" });
    const prev = el("button", { type: "button", class: "vl-egnav prev", "aria-label": t("eg.prev", "上一个例子") }, ICON.left);
    const next = el("button", { type: "button", class: "vl-egnav next", "aria-label": t("eg.next", "下一个例子") }, ICON.right);
    const count = el("div", { class: "vl-egcount", "aria-live": "polite" });
    run[0].before(car); car.append(tabs, stage, count); stage.append(prev, next);
    const label = item => {
      if (item.dataset.t) return item.dataset.t;
      const b = item.querySelector("b"); if (!b) return t("eg.k", "例子");
      const s = b.textContent.replace(/[：:，,。.\s]+$/, "");
      return LANG === "en" ? (s.length > 26 ? s.slice(0, 24) + "…" : s) : s.slice(0, 14);
    };
    const btns = run.map((item, k) => {
      labelEg(item);
      const bad = item.classList.contains("bad");
      item.id = item.id || "vl-eg" + k0 + "-" + k;
      item.setAttribute("role", "tabpanel");
      stage.insertBefore(item, next);
      const b = el("button", { type: "button", class: "vl-egtab" + (bad ? " bad" : ""), role: "tab", id: item.id + "-tab", "aria-controls": item.id, "aria-selected": "false", tabindex: "-1" });
      b.innerHTML = (bad ? '<span class="vl-egx" aria-hidden="true">✗ </span>' : "") + esc(label(item)) + (bad ? '<span class="vl-sr">' + (LANG === "en" ? " (" : "（") + esc(t("eg.bad", "反例")) + (LANG === "en" ? ")" : "）") + "</span>" : "");
      item.setAttribute("aria-labelledby", b.id);
      b.addEventListener("click", () => show(k, true));
      tabs.appendChild(b); return b;
    });
    let at = -1;
    function show(k, focusTab) {
      k = (k + run.length) % run.length;
      if (k === at) return;
      at = k;
      run.forEach((it, j) => { const on = j === at; it.classList.toggle("on", on); it.hidden = !on; if (on && motion()) { it.classList.remove("vl-enter"); void it.offsetWidth; it.classList.add("vl-enter"); } });
      btns.forEach((b, j) => { b.classList.toggle("on", j === at); b.setAttribute("aria-selected", String(j === at)); b.tabIndex = j === at ? 0 : -1; });
      const bt = btns[at]; tabs.scrollLeft = bt.offsetLeft - (tabs.clientWidth - bt.offsetWidth) / 2;   // 只滚页签条，不滚整页
      if (focusTab) bt.focus({ preventScroll: true });
      count.textContent = (at + 1) + " / " + run.length;
      car.dispatchEvent(new CustomEvent("vl:eg", { detail: { i: at } }));
    }
    prev.onclick = () => show(at - 1); next.onclick = () => show(at + 1);
    tabs.addEventListener("keydown", e => {
      const m = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: run.length - 1 }[e.key];
      if (m !== undefined) { e.preventDefault(); show(m, true); }
    });
    stage.addEventListener("keydown", e => {
      if (e.target.closest("input,textarea,select,[role=slider]")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); } if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
    });
    let x0 = null, y0 = 0;
    stage.addEventListener("pointerdown", e => { if (e.target.closest("button,input,a,[role=slider]")) return; x0 = e.clientX; y0 = e.clientY; });
    stage.addEventListener("pointerup", e => { if (x0 !== null) { const dx = e.clientX - x0, dy = e.clientY - y0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(at + (dx < 0 ? 1 : -1)); } x0 = null; });
    stage.addEventListener("pointercancel", () => { x0 = null; });
    car._show = show;
    show(0);
  }
  buildCarousels();

  /* ---------- 术语释义：一个共享的释义框，fixed 定位、夹在视口内、上下自动翻 ---------- */
  (function terms() {
    const tip = el("div", { class: "vl-tip", id: "vl-tip", role: "tooltip" });
    body.appendChild(tip);
    let on = null;
    const prep = tm => { if (tm._vl) return; tm._vl = 1; if (!tm.hasAttribute("tabindex")) tm.tabIndex = 0; tm.setAttribute("aria-describedby", "vl-tip"); };
    $$(".vl-term[data-def]").forEach(prep);
    const show = tm => {
      prep(tm); on = tm; tip.innerHTML = "<b>" + esc(tm.dataset.name || tm.textContent.trim()) + "</b>" + esc(tm.dataset.def); tip.classList.add("show");
      const r = tm.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      const x = clamp(r.left, 12, Math.max(12, innerWidth - w - 12));
      let y = r.bottom + 8; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
      tip.style.left = x + "px"; tip.style.top = y + "px";
    };
    const hide = () => { on = null; tip.classList.remove("show"); };
    const find = e => e.target && e.target.closest && e.target.closest(".vl-term[data-def]");
    doc.addEventListener("mouseover", e => { const tm = find(e); if (tm && tm !== on) show(tm); });
    doc.addEventListener("mouseout", e => { const tm = find(e); if (tm && !tm.contains(e.relatedTarget) && doc.activeElement !== tm) hide(); });
    doc.addEventListener("focusin", e => { const tm = find(e); if (tm) show(tm); });
    doc.addEventListener("focusout", e => { if (find(e)) hide(); });
    doc.addEventListener("click", e => { const tm = find(e); if (tm) { (on === tm && tip.classList.contains("show")) ? hide() : show(tm); } else if (on) hide(); }, true);
    doc.addEventListener("keydown", e => { if (e.key === "Escape") hide(); const tm = find(e); if (tm && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); on === tm ? hide() : show(tm); } });
    addEventListener("scroll", () => { if (on) hide(); }, { passive: true });
  })();

  /* ---------- 概念卡 .vl-cc：标签、字段小签、必有图位检查 ---------- */
  function cards(scope) {
    $$(".vl-cc", scope).forEach(c => {
      if (c._vl) return; c._vl = 1;
      const name = c.querySelector(".vl-cc-name");
      if (name && !name.querySelector("span")) name.innerHTML = "<span>" + name.innerHTML + "</span>";
      if (!c.getAttribute("aria-label") && name) c.setAttribute("aria-label", t("cc.aria", "概念卡：{0}", name.textContent.trim()));
      if (!c.querySelector(".vl-cc-tag")) c.insertAdjacentHTML("afterbegin", '<span class="vl-cc-tag">' + esc(c.dataset.tag || t("cc.tag", "概念卡")) + "</span>");
      const lab = (sel, key, zh) => { const p = c.querySelector(sel); if (p && !p.querySelector(".vl-cc-k")) p.insertAdjacentHTML("afterbegin", '<span class="vl-cc-k">' + esc(t(key, zh)) + "</span>"); };
      lab(".vl-cc-plain", "cc.plain", "通俗地说"); lab(".vl-cc-eg", "cc.eg", "例子");
      if (!c.querySelector(".vl-cc-fig")) {
        // 图位必有：缺了就放一个看得见的占位，提醒作者补图（截图时一眼能发现）
        c.insertAdjacentHTML("beforeend", '<div class="vl-cc-fig vl-cc-nofig">' + esc(t("cc.nofig", "缺概念图")) + "</div>");
        console.warn("[VL] 概念卡缺图位 .vl-cc-fig：", name ? name.textContent.trim() : c);
      }
    });
  }
  /* ---------- 原理框 .vl-why：小签、可选图位 ---------- */
  function whys(scope) {
    $$(".vl-why", scope).forEach(w => {
      if (w._vl) return; w._vl = 1;
      if (!w.querySelector(".vl-why-tag")) w.insertAdjacentHTML("afterbegin", '<span class="vl-why-tag">' + esc(w.dataset.tag || t("why.tag", "为什么成立")) + "</span>");
      if (w.querySelector(":scope > .vl-why-fig")) w.classList.add("has-fig");
    });
  }
  /* ---------- 收起块：发明故事框 details.vl-story、选读支线 details.vl-side[data-kind]（默认收起，记住展开状态） ---------- */
  const KIND = { story: "发明故事", history: "历史", math: "数学", play: "多玩一会儿", debate: "争议", source: "原始文献", extra: "加练", more: "延伸" };
  function sides(scope) {
    $$("details.vl-side, details.vl-story", scope).forEach((d, i) => {
      if (d._vl) return; d._vl = 1;
      const kind = d.classList.contains("vl-story") ? "story" : (d.dataset.kind || "");
      let sum = d.querySelector(":scope > summary");
      if (!sum) { sum = el("summary"); d.prepend(sum); }
      if (!sum.querySelector(".vl-side-t")) { const w = el("span", { class: "vl-side-t" }); while (sum.firstChild) w.appendChild(sum.firstChild); sum.appendChild(w); }
      if (!sum.querySelector(".vl-side-tag")) sum.insertAdjacentHTML("afterbegin", '<span class="vl-side-tag">' + esc(d.dataset.tag || t("side." + (kind || "default"), KIND[kind] || "选读")) + "</span>");
      const btn = sum.querySelector(".vl-side-btn") || sum.appendChild(el("span", { class: "vl-side-btn", "aria-hidden": "true" }));
      if (!d.querySelector(":scope > .vl-side-body")) { const bd = el("div", { class: "vl-side-body" }); Array.from(d.childNodes).forEach(n => { if (n !== sum) bd.appendChild(n); }); d.appendChild(bd); }
      const key = "side-" + BASE + "-" + (d.id || i);
      const saved = store.get(key);
      d.open = saved === "1";
      const sync = () => { btn.textContent = d.open ? t("side.close", "收起") + " ▴" : t("side.open", "展开") + " ▾"; };
      d.addEventListener("toggle", () => { sync(); if (!d._printing) store.set(key, d.open ? "1" : "0"); });
      sync();
    });
  }
  addEventListener("beforeprint", () => $$("details.vl-side, details.vl-story").forEach(d => { d._printing = true; d._was = d.open; d.open = true; }));
  addEventListener("afterprint", () => $$("details.vl-side, details.vl-story").forEach(d => { d.open = d._was; setTimeout(() => { d._printing = false; }, 0); }));

  /* ---------- 试试看 .vl-try[data-try]：完成条件写在页面 JS 里，达成时调 VL.tryDone(id) ---------- */
  const TRIED = new Set(store.json("try", []));
  function tries(scope) {
    $$(".vl-try", scope).forEach(p => {
      if (p._vl) return; p._vl = 1;
      p.insertAdjacentHTML("afterbegin", '<span class="vl-try-box" aria-hidden="true">' + ICON.check + '</span><b class="vl-try-k">' + esc(t("try.k", "试试看：")) + "</b>");
      p.insertAdjacentHTML("beforeend", '<span class="vl-try-fb" aria-live="polite"></span>');
      const id = p.dataset.try;
      if (id && TRIED.has(BASE + "#" + id)) { p.classList.add("done"); p.querySelector(".vl-try-fb").textContent = p.dataset.was || t("try.was", "之前已完成。"); }
    });
  }
  function tryDone(id, msg) {
    const p = doc.querySelector('.vl-try[data-try="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    const k = BASE + "#" + id, first = !TRIED.has(k);
    if (p && p.classList.contains("fresh-done")) return false;   // 本页已经确认过一次
    TRIED.add(k); store.setJSON("try", Array.from(TRIED));
    if (p) { p.classList.add("done", "fresh-done"); p.querySelector(".vl-try-fb").textContent = msg || p.dataset.done || t("try.ok", "完成！"); }
    // detail.first = 这个任务第一次完成（跨会话）；阅读激励模块只在 first 时给奖励，保证只给一次
    doc.dispatchEvent(new CustomEvent("vl:try", { detail: { id, el: p, first } }));
    return true;
  }

  /* ---------- 先猜后揭晓 .vl-guess[data-mode=think|pick|estimate] ---------- */
  const fmt = (v, digits) => {
    if (!isFinite(v)) return "∞";
    if (digits !== undefined && digits !== "") return (+v).toFixed(+digits);
    const a = Math.abs(v);
    if (a >= 1e4 && LANG === "zh") { for (const [u, n] of [[1e8, "亿"], [1e4, "万"]]) if (a >= u) return (+(v / u).toPrecision(3)) + " " + n; }
    if (a >= 100) return Math.round(v).toLocaleString(LANG === "en" ? "en-AU" : "en-US");
    if (a >= 1) return String(+(+v).toPrecision(3));
    return String(+(+v).toPrecision(2));
  };
  let guessN = 0;
  function guesses(scope) {
    $$(".vl-guess", scope).forEach(g => {
      if (g._vl) return; g._vl = 1;
      const mode = g.dataset.mode || (g.querySelector(".vl-opts") ? "pick" : g.dataset.answer !== undefined ? "estimate" : "think");
      const ans = g.querySelector(".vl-ans");
      if (ans) { ans.setAttribute("aria-live", "polite"); ans.id = ans.id || "vl-ans" + (++guessN); }
      const done = detail => { g.classList.add("revealed"); g.dispatchEvent(new CustomEvent("vl:guess", { bubbles: true, detail: Object.assign({ mode }, detail) })); };
      if (mode === "think") {
        const b = el("button", { type: "button", class: "vl-btn", "aria-expanded": "false", "aria-controls": ans ? ans.id : null }, esc(t("g.think", "看看想法")));
        (ans || g).before(b);
        b.onclick = () => { const o = !g.classList.contains("revealed"); g.classList.toggle("revealed", o); b.setAttribute("aria-expanded", String(o)); b.textContent = o ? t("g.hide", "收起") : t("g.think", "看看想法"); if (o) done({}); };
        return;
      }
      if (mode === "pick") {
        const ul = g.querySelector(".vl-opts"); if (!ul) return;
        const fb = el("p", { class: "vl-fb", "aria-live": "polite" });
        const items = Array.from(ul.children);
        const hasRight = items.some(li => li.hasAttribute("data-right"));
        const opts = items.map(li => {
          const f = li.querySelector(".vl-fb"); const fbHtml = f ? f.innerHTML : ""; if (f) f.remove();
          const b = el("button", { type: "button", class: "vl-opt vl-chip", "aria-pressed": "false" }, li.innerHTML.trim());
          b._fb = fbHtml; b._right = li.hasAttribute("data-right");
          li.innerHTML = ""; li.appendChild(b); return b;
        });
        ul.setAttribute("role", "group");
        ul.after(fb);
        const again = el("button", { type: "button", class: "vl-btn alt", hidden: true }, esc(t("g.again", "再猜一次")));
        (ans || fb).after(again);
        opts.forEach((b, i) => b.addEventListener("click", () => {
          if (g.classList.contains("revealed")) return;
          b.setAttribute("aria-pressed", "true");
          if (hasRight) {
            b.classList.add(b._right ? "right" : "wrong");
            if (!b._right) { opts.filter(o => o._right).forEach(o => o.classList.add("miss")); shake(b); }
          } else b.classList.add("on");
          fb.innerHTML = (hasRight ? "<b>" + esc(b._right ? t("g.right", "猜对了。") : t("g.wrong", "不太对。")) + "</b> " : "") + (b._fb || "");
          opts.forEach(o => { o.setAttribute("aria-disabled", "true"); });
          again.hidden = false; done({ pick: i, right: hasRight ? b._right : null });
        }));
        again.onclick = () => { g.classList.remove("revealed"); fb.innerHTML = ""; again.hidden = true; opts.forEach(o => { o.classList.remove("right", "wrong", "miss", "on"); o.setAttribute("aria-pressed", "false"); o.removeAttribute("aria-disabled"); }); opts[0].focus(); };
        return;
      }
      // estimate：滑块估数（线性或对数），揭晓后显示"你 / 答案"两个标记和偏差段
      const d = g.dataset, log = d.scale === "log", mn = +d.min, mx = +d.max, an = +d.answer, unit = d.unit || "", pre = d.pre || "";
      if (!(mx > mn) || !isFinite(an)) return;
      const toS = v => (log ? Math.log10(v) : v), fromS = s => (log ? Math.pow(10, s) : s);
      const lo = toS(mn), hi = toS(mx), stepS = log ? 0.02 : (+d.step || (mx - mn) / 100);
      const start = d.start !== undefined ? +d.start : fromS((lo + hi) / 2);
      const show = v => pre + fmt(log ? +(+v).toPrecision(2) : v, d.digits) + (unit ? " " + unit : "");
      const pct = v => clamp((toS(v) - lo) / (hi - lo) * 100, 0, 100);
      const id = "vl-g" + (++guessN);
      const box = el("div", { class: "vl-g-box" });
      box.innerHTML = '<div class="vl-g-ctl"><label for="' + id + '">' + esc(t("g.label", "你的估计")) + '</label><output for="' + id + '"></output>' +
        '<input type="range" id="' + id + '" min="' + lo + '" max="' + hi + '" step="' + stepS + '" value="' + toS(start) + '"></div>' +
        '<div class="vl-g-track" aria-hidden="true"><i class="vl-g-line"></i><i class="vl-g-span"></i><i class="vl-g-mk you"><span></span></i><i class="vl-g-mk ans"><span></span></i></div>' +
        '<div class="vl-g-ends" aria-hidden="true"><span>' + esc(show(mn)) + "</span><span>" + esc(show(mx)) + "</span></div>" +
        '<div><button type="button" class="vl-btn" data-g="go">' + esc(t("g.go", "揭晓")) + '</button><button type="button" class="vl-btn alt" data-g="again" hidden>' + esc(t("g.again", "再猜一次")) + '</button></div><p class="vl-g-res" aria-live="polite"></p>';
      const q = g.querySelector(".vl-q"); if (q) q.after(box); else g.prepend(box);
      const inp = box.querySelector("input"), out = box.querySelector("output"), you = box.querySelector(".vl-g-mk.you"), am = box.querySelector(".vl-g-mk.ans"), span = box.querySelector(".vl-g-span"), res = box.querySelector(".vl-g-res");
      const go = box.querySelector('[data-g="go"]'), again = box.querySelector('[data-g="again"]');
      const place = (mk, v, lab) => { const p = pct(v); mk.style.left = p + "%"; mk.dataset.al = p < 15 ? "l" : p > 85 ? "r" : "c"; mk.firstElementChild.textContent = lab; };
      const val = () => fromS(+inp.value);
      const upd = () => { out.textContent = show(val()); place(you, val(), t("g.you", "你：{0}", show(val()))); };
      inp.addEventListener("input", () => { if (!g.classList.contains("revealed")) upd(); });
      go.onclick = () => {
        const v = val(); inp.disabled = true; go.hidden = true; again.hidden = false;
        place(am, an, t("g.ans", "答案：{0}", show(an)));
        const a = pct(v), b = pct(an); span.style.left = Math.min(a, b) + "%"; span.style.width = Math.abs(a - b) + "%";
        const ratio = an ? v / an : Infinity; let txt;
        if (log) { const r = Math.max(ratio, 1 / ratio); txt = r < 1.5 ? t("g.near", "几乎猜中！") : v < an ? t("g.low", "猜小了：答案是你猜的 {0} 倍。", fmt(r)) : t("g.high", "猜大了：你猜的是答案的 {0} 倍。", fmt(r)); }
        else { const diff = Math.abs(v - an), rel = an ? diff / Math.abs(an) : diff; txt = (rel < 0.1 ? t("g.good", "很准！") : rel < 0.35 ? t("g.close", "接近了。") : t("g.far", "差得不少。")) + t("g.diff", "差了 {0}。", fmt(diff, d.digits) + (unit ? " " + unit : "")); }
        res.textContent = txt; done({ guess: v, answer: an, ratio });
      };
      again.onclick = () => { g.classList.remove("revealed"); inp.disabled = false; go.hidden = false; again.hidden = true; res.textContent = ""; span.style.width = "0"; upd(); inp.focus(); };
      upd();
    });
  }

  /* ---------- 笔记框：键 = <课程id>-note-<文件名>-<data-save 或序号>，改章号也不冲突，中英文页共用 ---------- */
  function notes(scope) {
    $$("textarea.vl-note, textarea[data-save], input[data-save]", scope).forEach((ta, i) => {
      if (ta._vl) return; ta._vl = 1;
      ta.classList.add("vl-note");
      const k = "note-" + BASE + "-" + (ta.dataset.save || i + 1);
      const v = store.get(k); if (v) ta.value = v;
      if (!ta.placeholder) ta.placeholder = t("note.ph", "在这里写下你的想法……");
      const st = el("span", { class: "vl-note-st", "aria-live": "polite" });
      ta.after(st);
      let tm = 0;
      ta.addEventListener("input", () => { store.set(k, ta.value); clearTimeout(tm); st.textContent = ""; tm = setTimeout(() => { st.textContent = t("note.saved", "已保存"); }, 500); });
    });
  }

  /* ---------- 章末翻页 ---------- */
  (function pager() {
    if (!main || !cur || main.querySelector(".vl-pager") || !CH.length) return;
    const prev = CH[cur - 2], next = CH[cur];
    const pg = el("nav", { class: "vl-pager", "aria-label": t("pg.toc", "翻页") });
    let h = prev ? '<a class="vl-pg vl-pg-prev" href="' + esc(prev.file) + '"><small>' + esc(t("pg.prev", "上一章")) + "</small>← " + esc(nm(prev)) + "</a>"
      : '<a class="vl-pg vl-pg-prev" href="' + esc(HOME) + '"><small>' + esc(t("pg.toc", "目录")) + "</small>← " + esc(t("pg.home", "回到目录")) + "</a>";
    if (next && next.open !== false) h += '<a class="vl-pg vl-pg-next" href="' + esc(next.file) + '"><small>' + esc(t("pg.next", "下一章")) + "</small>" + esc(nm(next)) + " →</a>";
    else h += '<a class="vl-pg vl-pg-next" href="' + esc(HOME) + '"><small>' + esc(next ? t("ch.wip", "第 {0} 章还在写", next.n) : t("pg.toc", "目录")) + "</small>" + esc(t("pg.home", "回到目录")) + " →</a>";
    pg.innerHTML = h; main.appendChild(pg);
  })();

  /* ---------- 图自动编号：main 里的 figure.vl-fig 依次编号；[data-figref="图的id"] 自动写成"图 N" ---------- */
  function figs() {
    const list = $$("figure.vl-fig", main || body);
    list.forEach((f, i) => {
      f.dataset.n = i + 1;
      const cap = f.querySelector(":scope > figcaption");
      if (cap) {
        let s = cap.querySelector(":scope > .vl-fig-n");
        if (!s) { s = el("span", { class: "vl-fig-n" }); cap.prepend(s); }
        s.textContent = t("fig.n", "图 {0}", i + 1);
      }
    });
    $$("[data-figref]").forEach(a => { const f = doc.getElementById(a.dataset.figref); if (f && f.dataset.n) a.textContent = t("fig.ref", "图 {0}", f.dataset.n); });
  }

  /* ---------- 测验 VL.quiz(el, items, opts)：一次一题横向翻，圆点三态（未答 / 答错过 / 答对），全对记进度 ---------- */
  let quizN = 0;
  function quiz(host, items, opts) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || !items || !items.length) return null;
    opts = opts || {};
    const qn = ++quizN, mode = opts.mode === "drag" ? "drag" : "pick";
    host.classList.add("vl-quiz");
    host.setAttribute("role", "group"); host.setAttribute("aria-label", t("q.group", "练习题（左右键翻页）"));
    let answered = 0, firstTry = 0, at = 0;
    const score = el("p", { class: "vl-score", "aria-live": "polite" });
    const badge = el("div", { class: "vl-quiz-badge", hidden: true, role: "status" }, esc(opts.badge || t("q.badge", "这一章的练习全部答对了")));
    const say = () => { score.textContent = t("q.score", "已答对 {0} / {1}", answered, items.length) + (answered ? t("q.first", "，其中一次答对 {0}", firstTry) : ""); };
    const slides = [], dots = [];
    const nav = el("div", { class: "vl-qnav" });
    const prev = el("button", { type: "button", class: "vl-btn alt vl-qprev" }, esc(t("q.prev", "← 上一题")));
    const next = el("button", { type: "button", class: "vl-btn vl-qnext" }, esc(t("q.next", "下一题 →")));
    const dw = el("div", { class: "vl-qdots" });
    nav.append(prev, dw, next);
    host.appendChild(nav);
    items.forEach((it, qi) => {
      const q = el("div", { class: "vl-q", id: "vl-q" + qn + "-" + qi, role: "group", "aria-label": t("q.nth", "第 {0} 题", qi + 1) });
      q.innerHTML = '<div class="vl-qt">' + (qi + 1) + ". " + it.q + "</div>" + (it.img ? '<div class="vl-qimg">' + it.img + "</div>" : "");
      const why = el("div", { class: "vl-qwhy", hidden: true }, it.why || "");
      const live = el("p", { class: "vl-sr", role: "status", "aria-live": "polite" });
      // 选项按章号 + 题号做种子打乱（作者常把正确答案放在同一个位置）；每次打开顺序相同
      const order = it.opts.map((_, i) => i);
      if (!it.fixed) { const r = rng(cur * 7919 + qi * 104729 + qn * 31 + 17); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
      let tried = false, solved = false, picked = null;
      const slot = mode === "drag" ? el("div", { class: "vl-qslot", tabindex: "0", role: "button", "aria-label": t("q.slot", "把答案拖到这里") }, '<span class="vl-qph">' + esc(t("q.slot", "把答案拖到这里")) + "</span>") : null;
      const tray = el("div", { class: mode === "drag" ? "vl-qtray" : "vl-qopts" });
      const cards = [];
      const win = c => {
        solved = true; cards.forEach(x => (x.disabled = true));
        c.classList.add("ok"); why.hidden = false; live.textContent = t("q.right", "答对了。");
        answered++; if (!tried) firstTry++;
        dots[qi].classList.remove("tried"); dots[qi].classList.add("ok"); say();
        host.dispatchEvent(new CustomEvent("vl:answer", { bubbles: true, detail: { i: qi, firstTry: !tried } }));
        if (answered === items.length) { badge.hidden = false; if (cur && opts.progress !== false) Progress.done(cur); doc.dispatchEvent(new CustomEvent("vl:quiz-perfect", { detail: { ch: cur, firstTry, n: items.length } })); }
      };
      const lose = c => { tried = true; c.classList.add("no"); c.disabled = true; dots[qi].classList.add("tried"); live.textContent = t("q.wrong", "不是这个，再试试别的。"); shake(c); };
      const attempt = (c, oi) => {
        if (solved || c.disabled) return;
        if (picked) { picked.classList.remove("sel"); picked.setAttribute("aria-pressed", "false"); picked = null; if (slot) slot.classList.remove("armed"); }
        if (oi === it.a) { if (slot) { slot.querySelector(".vl-qph").hidden = true; c.style.transform = ""; slot.appendChild(c); slot.classList.add("ok"); } win(c); }
        else lose(c);
      };
      order.forEach(oi => {
        const c = el("button", { type: "button", class: "vl-qopt" }, it.opts[oi]);
        cards.push(c); tray.appendChild(c);
        if (mode === "pick") { c.addEventListener("click", () => attempt(c, oi)); return; }
        // 拖进答题位；键盘与点选替代：点卡片选中，再在答题位上按回车 / 点击放入
        c.setAttribute("aria-pressed", "false");
        let sx = 0, sy = 0, down = false, dragging = false;
        const inSlot = e => { const r = slot.getBoundingClientRect(), m = 8; return e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m; };
        c.addEventListener("pointerdown", e => { if (c.disabled || solved || (e.pointerType === "mouse" && e.button !== 0)) return; down = true; dragging = false; sx = e.clientX; sy = e.clientY; try { c.setPointerCapture(e.pointerId); } catch (_) {} });
        c.addEventListener("pointermove", e => {
          if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy;
          if (!dragging && Math.hypot(dx, dy) > 6) { dragging = true; c.classList.add("drag"); }
          if (dragging) { e.preventDefault(); c.style.transform = "translate(" + dx + "px," + dy + "px)"; slot.classList.toggle("over", inSlot(e)); }
        });
        const end = e => {
          if (!down) return; down = false; try { c.releasePointerCapture(e.pointerId); } catch (_) {}
          if (!dragging) return;
          const hit = e.type === "pointerup" && inSlot(e);
          slot.classList.remove("over"); c.classList.remove("drag"); c.style.transform = ""; dragging = false;
          c._moved = true; setTimeout(() => { c._moved = false; }, 0);
          if (hit) attempt(c, oi);
        };
        c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
        c.addEventListener("click", () => {
          if (c._moved || c.disabled || solved) return;
          const sel = picked !== c;
          if (picked) { picked.classList.remove("sel"); picked.setAttribute("aria-pressed", "false"); }
          picked = sel ? c : null; slot.classList.toggle("armed", sel);
          if (sel) { c.classList.add("sel"); c.setAttribute("aria-pressed", "true"); live.textContent = t("q.picked", "已选中卡片，在答题位上按回车放入。"); slot.focus({ preventScroll: true }); }
        });
        c._oi = oi;
      });
      if (slot) {
        const place = () => { if (picked && !solved) attempt(picked, picked._oi); };
        slot.addEventListener("click", place);
        slot.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(); } });
        q.appendChild(slot);
      }
      q.append(tray, live, why);
      host.appendChild(q); slides.push(q);
      const d = el("button", { type: "button", class: "vl-qdot", "aria-label": t("q.nth", "第 {0} 题", qi + 1), "aria-controls": q.id }, String(qi + 1));
      d.addEventListener("click", () => go(qi)); dw.appendChild(d); dots.push(d);
    });
    function go(i) {
      at = clamp(i, 0, items.length - 1);
      slides.forEach((s, k) => { s.hidden = k !== at; });
      dots.forEach((d, k) => { d.classList.toggle("on", k === at); if (k === at) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
      prev.disabled = at === 0; next.disabled = at === items.length - 1;
      if (motion()) { const s = slides[at]; s.classList.remove("vl-enter"); void s.offsetWidth; s.classList.add("vl-enter"); }
    }
    prev.onclick = () => go(at - 1); next.onclick = () => go(at + 1);
    host.addEventListener("keydown", e => {
      if (e.target.closest(".vl-qslot,input,textarea")) return;
      if (e.key === "ArrowRight" && at < items.length - 1) { e.preventDefault(); go(at + 1); dots[at].focus(); }
      if (e.key === "ArrowLeft" && at > 0) { e.preventDefault(); go(at - 1); dots[at].focus(); }
    });
    if (items.length < 2) nav.hidden = true;
    host.append(score, badge); say(); go(0);
    addEventListener("beforeprint", () => slides.forEach(s => (s.hidden = false)));
    addEventListener("afterprint", () => go(at));
    return { go, el: host };
  }

  /* ---------- 动态插入的内容可以再跑一遍（如页面脚本后插的例子、概念卡） ---------- */
  function enhance(scope) {
    scope = scope || main || body;
    cards(scope); whys(scope); sides(scope); tries(scope); guesses(scope); notes(scope);
    if (scope !== (main || body)) buildCarousels(scope);
    const V = window.VL; if (V && V.illus && V.illus.mount) V.illus.mount(scope);
  }
  enhance();
  // 插画库、图解模板和章节插图包在 vl.js 之后加载；等全部脚本跑完（DOMContentLoaded）再装插画、编图号
  const ready = fn => (doc.readyState === "loading" ? doc.addEventListener("DOMContentLoaded", fn) : setTimeout(fn, 0));
  ready(() => { const V = window.VL; if (V.illus && V.illus.mount) V.illus.mount(doc); figs(); });
  addEventListener("beforeprint", () => SECS.forEach(s => s._toggle(true)));

  window.VL = Object.assign(window.VL || {}, {
    t, esc, store, raw, Progress, CH, PARTS, cur, file: FILE, base: BASE, lang: LANG, nm, partOf,
    fx: fxLevel, setFx, motion, scheme, setScheme,
    $, $$, el, clamp, rng, shake, icon: ICON,
    tryDone, quiz, figs, enhance, ready, popover,
  });
})();
