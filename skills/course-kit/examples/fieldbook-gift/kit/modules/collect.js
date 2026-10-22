/* course-kit · modules/collect.js —— 阅读激励的通用内核：读懂一处，收集一件。外观全交给皮肤（类名 vl-col-*）。
   只奖励"读懂了"的证据，组件只派事件，这里订阅：
     vl:try {id, el, first}       first 时，把这条试试看关联的概念收进图鉴（.vl-try[data-concept] 或同一节里的 .vl-cc[data-concept]）
     vl:quiz-perfect {ch}         本章邮票（单元徽章）+ 本章全部概念；在测验徽章上盖"读懂了"
     vl:review-round {concepts|ch} 篇末综合关每回合答对：收进 detail.concepts，或第 ch 章的全部概念
   不做：滚动百分比、停留时长、排行、连续打卡。动效 ≤1.2s，只放一次；off 档不播动画但照样记录。
   存档：<id>-cards（已收的概念 id）、<id>-col-seen（已经庆祝过的事）。章邮票读 VL.Progress（测验全对），不另存。
   课程配置 modules.collect:false 时整个模块不出现。 */
(function () {
  "use strict";
  const VL = window.VL, doc = document;
  if (!VL) return;
  const C = window.VL_COURSE || {}, M = C.modules || {};
  const CFG = M.collect === undefined ? {} : M.collect;
  const T = (k, zh, en, ...a) => { const X = window.VL_I18N || {}; const s = X[VL.lang] && X[VL.lang][k] != null ? X[VL.lang][k] : (VL.lang === "en" ? en : zh); return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m)); };
  const CO = VL.lang === "en" ? ": " : "：", CM = VL.lang === "en" ? ", " : "，";   // 拼接用的标点随语言
  if (CFG === false) { VL.collect = { enabled: false, has: () => false, add() {}, open() {} }; return; }
  const K = VL.concepts || null, esc = VL.esc;
  const CH = VL.CH, PARTS = VL.PARTS.length ? VL.PARTS : [{ zh: "", en: "", from: 1, to: CH.length }];
  const concepts = n => (K ? K.ofChapter(n) : []);
  const badgeOf = n => { const l = concepts(n); return l.find(c => c.badge) || l[0] || null; };
  const nm = c => (K ? K.name(c) : c.zh);
  const plain = c => (K ? K.pick(c, "plain") || K.pick(c, "def") : c.plain || "");
  const title = () => (VL.lang === "en" ? CFG.titleEn || "Stamp album" : CFG.title || "集邮册");

  /* ---------- 状态 ---------- */
  let cards = new Set(VL.store.json("cards", []));
  const seen = new Set(VL.store.json("col-seen", []));
  const saveCards = () => VL.store.setJSON("cards", [...cards]);
  const once = k => { if (seen.has(k)) return false; seen.add(k); VL.store.setJSON("col-seen", [...seen]); return true; };
  const done = () => VL.Progress.get();
  const has = id => cards.has(id);
  const chDone = n => !!done()[n];
  const total = () => ({ stamps: CH.filter(c => chDone(c.n)).length, stampsAll: CH.length, cards: K ? K.items.filter(c => cards.has(c.id)).length : 0, cardsAll: K ? K.items.length : 0 });
  const next = () => CH.find(c => c.open !== false && !chDone(c.n)) || null;

  function add(ids, reason, quiet) {
    const fresh = (ids || []).filter(id => id && !cards.has(id) && (!K || K.get(id)));
    if (!fresh.length) return [];
    fresh.forEach(id => cards.add(id)); saveCards();
    doc.dispatchEvent(new CustomEvent("vl:collect", { detail: { ids: fresh, reason } }));
    sync();
    if (!quiet) {
      const first = K ? K.get(fresh[0]) : null;
      toast(first, fresh.length > 1 ? T("col.newN", "收进图鉴：{0} 等 {1} 张", "Added to your album: {0} and {1} more", nm(first), fresh.length - 1) : T("col.new1", "收进图鉴：{0}", "Added to your album: {0}", first ? nm(first) : ""));
      if (VL.sound) VL.sound.play("coin");
    }
    // 一章的概念集齐了：只庆祝一次
    const chs = new Set(fresh.map(id => K && K.get(id) ? K.get(id).ch : 0));
    chs.forEach(n => { const l = concepts(n); if (n && l.length && l.every(c => cards.has(c.id)) && once("full-" + n)) setTimeout(() => toast(badgeOf(n), T("col.full", "第 {0} 章的图鉴集齐了", "Chapter {0}: album page complete", n), "full"), quiet ? 0 : 1300); });
    return fresh;
  }

  /* ---------- 事件：只在读懂时给 ---------- */
  function conceptsForTry(el) {
    if (!el) return [];
    const own = el.dataset.concept || (el.closest("[data-concept]:not(.vl-cc)") || {}).dataset?.concept;
    if (own) return own.split(/[\s,]+/).filter(Boolean);
    const sec = el.closest(".vl-sec-body, section, main");
    const cc = sec && sec.querySelector(".vl-cc[data-concept]");
    return cc ? [cc.dataset.concept] : [];
  }
  doc.addEventListener("vl:try", e => { const d = e.detail || {}; if (d.first) add(conceptsForTry(d.el), "try"); });
  doc.addEventListener("vl:review-round", e => { const d = e.detail || {}; add(d.concepts || (d.ch ? concepts(+d.ch).map(c => c.id) : []), "review"); });
  doc.addEventListener("vl:quiz-perfect", e => {
    const n = (e.detail && e.detail.ch) || VL.cur; if (!n) return;
    add(concepts(n).map(c => c.id), "quiz", true);
    const quizBadge = doc.querySelector(".vl-quiz-badge:not([hidden])");
    if (quizBadge && !quizBadge.querySelector(".vl-col-mark")) {
      quizBadge.insertAdjacentHTML("beforeend", '<span class="vl-col-mark' + (VL.motion() ? " vl-col-anim" : "") + '" aria-hidden="true">' + esc(T("col.mark", "读懂了", "Got it")) + "</span>");
    }
    if (once("ch-" + n)) {
      toast(badgeOf(n), T("col.stamp", "第 {0} 章的邮票贴进{1}了", "Chapter {0} stamp added to your {1}", n, title()), "stamp");
      if (VL.sound) setTimeout(() => VL.sound.play("stamp"), 450);
      if (CH.length && CH.every(c => chDone(c.n)) && once("all")) setTimeout(() => toast(null, T("col.all", "全课的邮票都集齐了", "Every stamp in the course collected"), "all"), 1400);
    }
    sync();
  });

  /* ---------- 小图：概念插画；没有插画就写章号 ---------- */
  const art = (c, n) => {
    const s = c && c.illus && VL.illus ? VL.illus.svg(c.illus) : "";
    return s || '<span class="vl-col-num" aria-hidden="true">' + (n || (c && c.ch) || "?") + "</span>";
  };

  /* ---------- 提示条：读懂一处时一次，≤1.2s，不挡正文（pointer-events:none）；off 档只读屏播报 ---------- */
  let live = null, tEl = null, tTm = 0;
  function toast(c, msg, kind) {
    if (!live) { live = VL.el("p", { class: "vl-sr", "aria-live": "polite" }); doc.body.appendChild(live); }
    live.textContent = msg;
    if (!VL.motion()) { pulse(); return; }
    if (!tEl) { tEl = VL.el("div", { class: "vl-col-toast", "aria-hidden": "true" }); doc.body.appendChild(tEl); }
    tEl.className = "vl-col-toast is-" + (kind || "card");
    tEl.innerHTML = '<span class="vl-col-tstamp">' + art(c) + "</span><span class=\"vl-col-tmsg\">" + esc(msg) + "</span>";
    void tEl.offsetWidth; tEl.classList.add("show");
    clearTimeout(tTm); tTm = setTimeout(() => { tEl.classList.remove("show"); pulse(); }, 1200);
  }
  function pulse() { if (!btn) return; btn.classList.remove("vl-col-pulse"); void btn.offsetWidth; if (VL.motion()) btn.classList.add("vl-col-pulse"); }

  /* ---------- 集邮册（一页一篇）：章邮票 + 本章概念格；没得的是灰剪影 + "读懂第 N 章就能拿到" ---------- */
  function pageHTML(p, pi) {
    const chs = CH.filter(c => c.n >= p.from && c.n <= p.to);
    const pname = VL.lang === "en" ? p.en || p.zh : p.zh;
    return '<section class="vl-col-page" data-part="' + (pi + 1) + '" aria-label="' + esc(pname || title()) + '">' + (pname ? '<h3 class="vl-col-ptitle">' + esc(pname) + "</h3>" : "") +
      chs.map(ch => {
        const ok = chDone(ch.n), b = badgeOf(ch.n), list = concepts(ch.n);
        const hint = T("col.hint", "读懂第 {0} 章就能拿到", "Finish Chapter {0} to get this", ch.n);
        const stamp = '<button type="button" class="vl-col-stamp' + (ok ? " is-got" : " is-empty") + '" aria-expanded="false" data-tip="' + esc(ok ? (b ? nm(b) + CO + plain(b) : VL.nm(ch)) : hint) + '"' +
          ' aria-label="' + esc(T("col.stampA", "第 {0} 章邮票", "Chapter {0} stamp", ch.n) + (ok ? (b ? CO + nm(b) : "") : CM + T("col.notYet", "还没拿到", "not yet"))) + '">' +
          '<span class="vl-col-art">' + art(b, ch.n) + "</span>" + (ok ? '<span class="vl-col-pm" aria-hidden="true">' + esc(T("col.mark", "读懂了", "Got it")) + "</span>" : '<span class="vl-col-q" aria-hidden="true">?</span>') + "</button>";
        const cells = list.map(c => {
          const got = cards.has(c.id);
          return '<li><button type="button" class="vl-col-cell' + (got ? " is-got" : " is-empty") + (c.kind === "principle" ? " is-principle" : "") + '" aria-expanded="false" data-tip="' + esc(got ? nm(c) + CO + plain(c) : hint) + '"' +
            ' aria-label="' + esc(got ? nm(c) : T("col.cellA", "还没收集的概念，{0}", "Not collected yet. {0}", hint)) + '"><span class="vl-col-art">' + art(c) + "</span>" +
            '<span class="vl-col-name">' + esc(got ? nm(c) : VL.lang === "en" ? "?" : "？") + "</span></button></li>";
        }).join("");
        const href = ch.open === false ? "" : ch.file;
        return '<div class="vl-col-ch' + (ok ? " is-got" : "") + '"><p class="vl-col-chname">' + (href ? '<a href="' + esc(href) + '">' : "") + esc(T("col.chn", "第 {0} 章", "Ch. {0}", ch.n)) + " " + esc(VL.nm(ch)) + (href ? "</a>" : "") + "</p>" +
          '<div class="vl-col-row">' + stamp + (cells ? '<ul class="vl-col-cells">' + cells + "</ul>" : "") + '</div><p class="vl-col-tip" aria-live="polite" hidden></p></div>';
      }).join("") + "</section>";
  }
  function bindTips(scope) {
    scope.addEventListener("click", e => {
      const b = e.target.closest(".vl-col-stamp, .vl-col-cell"); if (!b) return;
      const box = b.closest(".vl-col-ch"), tip = box.querySelector(".vl-col-tip");
      const open = b.getAttribute("aria-expanded") !== "true";
      scope.querySelectorAll('.vl-col-stamp[aria-expanded="true"], .vl-col-cell[aria-expanded="true"]').forEach(x => x.setAttribute("aria-expanded", "false"));
      scope.querySelectorAll(".vl-col-tip").forEach(x => (x.hidden = true));
      if (open) { b.setAttribute("aria-expanded", "true"); tip.textContent = b.dataset.tip; tip.hidden = false; }
    });
  }
  function summaryHTML() {
    const s = total(), nx = next();
    return '<p class="vl-col-sum">' + esc(T("col.sum", "邮票 {0} / {1} · 图鉴 {2} / {3}", "Stamps {0} / {1} · Album {2} / {3}", s.stamps, s.stampsAll, s.cards, s.cardsAll)) + "</p>" +
      (nx ? '<p class="vl-col-next"><a href="' + esc(nx.file) + '">' + esc(T("col.next", "接着读：第 {0} 章 {1}", "Next up: Ch. {0} {1}", nx.n, VL.nm(nx))) + " →</a></p>" : "");
  }

  /* ---------- 对话框：Tab 走格子、←→ 翻页、Esc 关 ---------- */
  let dlg = null, page = 0, lastFocus = null;
  function buildDialog() {
    dlg = VL.el("div", { class: "vl-col-back", hidden: true });
    dlg.innerHTML = '<div class="vl-col-dlg" role="dialog" aria-modal="true" aria-labelledby="vl-col-h"><div class="vl-col-head"><h2 id="vl-col-h">' + esc(title()) + '</h2><button type="button" class="vl-btn alt vl-col-x" aria-label="' + esc(T("col.close", "关上", "Close")) + '">×</button></div>' +
      '<div class="vl-col-body"></div><div class="vl-col-foot"><button type="button" class="vl-btn alt vl-col-prev">← ' + esc(T("col.prev", "上一页", "Previous")) + '</button><span class="vl-col-pg" aria-live="polite"></span><button type="button" class="vl-btn alt vl-col-nextp">' + esc(T("col.nextp", "下一页", "Next")) + " →</button></div></div>";
    doc.body.appendChild(dlg);
    bindTips(dlg.querySelector(".vl-col-body"));
    dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".vl-col-x")) close(); if (e.target.closest(".vl-col-prev")) go(page - 1); if (e.target.closest(".vl-col-nextp")) go(page + 1); });
    dlg.addEventListener("keydown", e => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest("input,textarea")) { e.preventDefault(); go(page + (e.key === "ArrowRight" ? 1 : -1)); return; }
      if (e.key === "Tab") {   // 焦点留在对话框里
        const f = [...dlg.querySelectorAll("button:not([disabled]), a[href]")].filter(x => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function go(i) {
    page = VL.clamp(i, 0, PARTS.length - 1);
    const body = dlg.querySelector(".vl-col-body");
    body.innerHTML = summaryHTML() + pageHTML(PARTS[page], page);
    dlg.querySelector(".vl-col-prev").disabled = page === 0;
    dlg.querySelector(".vl-col-nextp").disabled = page === PARTS.length - 1;
    dlg.querySelector(".vl-col-foot").hidden = PARTS.length < 2;
    dlg.querySelector(".vl-col-pg").textContent = T("col.pgn", "第 {0} / {1} 页", "Page {0} of {1}", page + 1, PARTS.length);
  }
  function open() {
    if (!dlg) buildDialog();
    lastFocus = doc.activeElement;
    const n = VL.cur ? Math.max(0, PARTS.findIndex(p => VL.cur >= p.from && VL.cur <= p.to)) : 0;
    go(n); dlg.hidden = false; doc.body.classList.add("vl-col-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    const f = dlg.querySelector(".vl-col-stamp, .vl-col-cell, .vl-col-x"); if (f) f.focus();
  }
  function close() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true; doc.body.classList.remove("vl-col-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- 顶栏按钮：集邮册 n/N ---------- */
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3h14v18H5z" stroke-dasharray="2 2"/><path d="M8 7h8v7H8z"/><path d="M8 17h8"/></svg>';
  let btn = null;
  const bar = doc.querySelector(".vl-topbar");
  if (bar && CFG.button !== false) {
    btn = VL.el("button", { type: "button", class: "vl-tb-btn vl-tb-col", "aria-haspopup": "dialog", "aria-expanded": "false" });
    const prefs = bar.querySelector(".vl-tb-prefs");
    if (prefs) { prefs.before(btn); if (prefs.style.marginLeft === "auto") { prefs.style.marginLeft = ""; btn.style.marginLeft = "auto"; } } else bar.appendChild(btn);
    btn.addEventListener("click", open);
  }
  function sync() {
    const s = total();
    if (btn) { btn.innerHTML = ICON + '<span class="vl-tb-txt">' + esc(title()) + '</span><span class="vl-col-count">' + s.stamps + "/" + s.stampsAll + "</span>"; btn.setAttribute("aria-label", title() + CO + T("col.sum", "邮票 {0} / {1} · 图鉴 {2} / {3}", "Stamps {0} / {1} · Album {2} / {3}", s.stamps, s.stampsAll, s.cards, s.cardsAll)); }
    doc.querySelectorAll("[data-vl-collect]").forEach(render);
    if (dlg && !dlg.hidden) go(page);
  }

  /* ---------- 目录页用：全课地图点亮 / 下一步书签 / 整本集邮册 ----------
     <div data-vl-collect="map"></div>   章节格子：读懂的章盖上邮票
     <p data-vl-collect="next"></p>      书签：接着读第一个还没读懂的章
     <div data-vl-collect="album"></div> 整本集邮册摊开放在页面上（不分页） */
  function render(el) {
    const kind = el.dataset.vlCollect;
    if (kind === "next") { const nx = next(); el.innerHTML = nx ? '<a class="vl-col-bm" href="' + esc(nx.file) + '">' + esc(T("col.next", "接着读：第 {0} 章 {1}", "Next up: Ch. {0} {1}", nx.n, VL.nm(nx))) + " →</a>" : '<span class="vl-col-bm done">' + esc(T("col.allDone", "每一章都读懂了", "Every chapter done")) + "</span>"; return; }
    if (kind === "album") { el.classList.add("vl-col-inline"); el.innerHTML = summaryHTML() + PARTS.map(pageHTML).join(""); if (!el._vlTips) { el._vlTips = 1; bindTips(el); } return; }
    if (kind === "map") {
      el.classList.add("vl-col-map");
      el.innerHTML = PARTS.map((p, pi) => '<div class="vl-col-mpart" data-part="' + (pi + 1) + '">' + ((VL.lang === "en" ? p.en : p.zh) ? '<p class="vl-col-mptitle">' + esc(VL.lang === "en" ? p.en || p.zh : p.zh) + "</p>" : "") + '<ol class="vl-col-mlist">' +
        CH.filter(c => c.n >= p.from && c.n <= p.to).map(c => {
          const ok = chDone(c.n), b = badgeOf(c.n), inner = '<span class="vl-col-stamp ' + (ok ? "is-got" : "is-empty") + '" aria-hidden="true"><span class="vl-col-art">' + art(b, c.n) + "</span>" + (ok ? '<span class="vl-col-pm">' + esc(T("col.mark", "读懂了", "Got it")) + "</span>" : "") + "</span>" +
            '<span class="vl-col-mname"><small>' + esc(T("col.chn", "第 {0} 章", "Ch. {0}", c.n)) + "</small>" + esc(VL.nm(c)) + "</span>" + '<span class="vl-sr">' + esc(ok ? T("col.okSr", "（已读懂）", " (done)") : "") + "</span>";
          return '<li class="' + (ok ? "is-got" : "") + '">' + (c.open === false ? '<span class="vl-col-mitem off">' + inner + "</span>" : '<a class="vl-col-mitem" href="' + esc(c.file) + '">' + inner + "</a>") + "</li>";
        }).join("") + "</ol></div>").join("");
    }
  }

  VL.collect = { enabled: true, has, add, open, close, next, total, render, get cards() { return [...cards]; }, reset() { cards = new Set(); saveCards(); seen.clear(); VL.store.setJSON("col-seen", []); sync(); } };
  // 插画包在本文件之后加载：等全部脚本跑完再画邮票里的图
  VL.ready(sync);
})();
