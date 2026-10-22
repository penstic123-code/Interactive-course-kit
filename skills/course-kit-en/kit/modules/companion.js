/* course-kit · modules/companion.js —— 陪伴角色：一个点了才说话的同伴。默认不加：课程配置写了 modules.companion 才出现。
   规则（references/modules.md 第二节）：
   - 点击才说话；台词按"当前所在的节"取：<div class="vl-sec" data-lines="句一|句二">。这一节没写就不说话，不拿通用台词凑。
   - 少数关键时刻主动冒一句：试试看第一次完成（.vl-try[data-say] 或配置 lines.try）、本章测验全对（lines.perfect）；每章 ≤ max 次（默认 3）。
   - 可关：开关放在顶栏"显示"浮层里，和配色、动效并列，存档 <id>-companion。
   - 键盘可触发：角色是 <button>，有可读名称；气泡 aria-live=polite。
   - 不挡正文：每次说话先量正文栏两侧的空白。角色那一侧空白够放气泡（≥ 180px）时，气泡浮在空白里，宽度限在空白内；
     不够（窄屏、中等宽度，含 1100px）时，气泡改成"插进正文流里的一行"：插在视口里最靠下、整段看得见的那块正文之后，
     下面的内容往下让开，绝不叠在正文文字上。气泡 pointer-events:none，滚动即收，约 2.6 秒自动消失（字多稍长）；动效 off 档不跳动。
   - 角色按钮在没有侧边空白时给 body 底部留出 padding，最后几行不会被它盖住。 */
(function () {
  "use strict";
  const VL = window.VL, doc = document;
  if (!VL) return;
  const C = window.VL_COURSE || {}, M = C.modules || {};
  const CFG = M.companion;
  if (!CFG) { VL.companion = { enabled: false, say() {} }; return; }
  const T = (k, zh, en, ...a) => { const X = window.VL_I18N || {}; const s = X[VL.lang] && X[VL.lang][k] != null ? X[VL.lang][k] : (VL.lang === "en" ? en : zh); return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m)); };
  const esc = VL.esc, EN = VL.lang === "en";
  const pickLang = (zh, en) => (EN && en ? en : zh);
  const name = pickLang(CFG.name || "", CFG.nameEn) || T("comp.name", "同伴", "Buddy");
  const MAX = CFG.max || 3;
  let shown = VL.store.get("companion") !== "0";
  let said = 0;   // 这一页主动冒话的次数

  /* ---------- 角色按钮 + 气泡 ---------- */
  const artHTML = () => {
    const a = CFG.art || "";
    if (/^\s*</.test(a)) return a;
    if (a && VL.illus && VL.illus.lib[a]) return VL.illus.svg(a);
    // 默认画法：一个圆脸小人（线条用 currentColor，皮肤决定颜色）
    return '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="22" fill="var(--vl-comp-face,#fff)" stroke="currentColor" stroke-width="3"/><circle cx="23" cy="27" r="2.6" fill="currentColor"/><circle cx="37" cy="27" r="2.6" fill="currentColor"/><path d="M23 37q7 6 14 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  };
  const wrap = VL.el("div", { class: "vl-comp" + (CFG.side === "right" ? " is-right" : "") });
  const btn = VL.el("button", { type: "button", class: "vl-comp-btn", "aria-label": pickLang(CFG.label, CFG.labelEn) || T("comp.label", "{0}，点一下听它说话", "{0}: press to hear what it says", name) }, '<span class="vl-comp-art"></span>');
  const bub = VL.el("div", { class: "vl-comp-bub", role: "status", "aria-live": "polite" });
  wrap.append(bub, btn);
  doc.body.appendChild(wrap);
  // 插画包可能在本文件之后才注册：等全部脚本跑完再画；svg 的 role=img 和按钮名字重复，读屏只读按钮
  const drawArt = () => { const sp = btn.querySelector(".vl-comp-art"); sp.innerHTML = artHTML(); sp.querySelectorAll("svg").forEach(s => { s.setAttribute("aria-hidden", "true"); s.removeAttribute("role"); }); };
  drawArt(); VL.ready(drawArt);

  /* ---------- 摆位：先量正文栏两侧空白，够放就浮在空白里，不够就插进正文流 ---------- */
  const MIN_W = 180, GAP = 12;
  const mainEl = () => doc.querySelector("main.vl-wrap") || doc.querySelector("main") || doc.querySelector(".vl-wrap");
  function textBox() {   // 正文栏的内容框（去掉左右 padding）
    const m = mainEl(); if (!m) return null;
    const r = m.getBoundingClientRect(), cs = getComputedStyle(m);
    return { left: r.left + (parseFloat(cs.paddingLeft) || 0), right: r.right - (parseFloat(cs.paddingRight) || 0) };
  }
  function sideRoom() {   // 角色那一侧可放气泡的宽度
    const t = textBox(); if (!t) return 1e9;
    const b = btn.getBoundingClientRect();
    return wrap.classList.contains("is-right") ? b.right - t.right - GAP : t.left - b.left - GAP;
  }
  function layoutPad() { doc.documentElement.classList.toggle("vl-comp-pad", shown && sideRoom() < MIN_W); }
  function flowCands() {   // 只插在 main 或 .vl-sec-body 的直接子元素之间，且整块在视口里看得见
    const m = mainEl(); if (!m) return [];
    const tb = doc.querySelector(".vl-topbar"), top = tb ? Math.max(0, tb.getBoundingClientRect().bottom) : 0;
    return [...m.querySelectorAll(":scope > *, .vl-sec-body > *")].filter(el => {
      if (el === bub || el.matches("script,style,.vl-sec-body,.vl-pager")) return false;
      const r = el.getBoundingClientRect(); return r.height > 0 && r.width > 0 && r.top >= top;
    });
  }
  function place() {
    bub.style.maxWidth = "";
    const room = sideRoom();
    if (room >= MIN_W) {   // 侧边空白够：浮在空白里
      if (bub.parentNode !== wrap) wrap.prepend(bub);
      bub.classList.remove("is-flow"); wrap.classList.remove("is-flow");
      bub.style.maxWidth = Math.min(260, room) + "px";
      return;
    }
    // 不够：插进正文流。从视口里最靠下的整块往上试，直到气泡整个落在角色按钮上方、视口之内
    bub.classList.add("is-flow"); wrap.classList.add("is-flow");
    const cands = flowCands(), lim = Math.min(innerHeight, btn.getBoundingClientRect().top) - 6;
    const vis = cands.filter(el => el.getBoundingClientRect().bottom <= lim).sort((x, y) => y.getBoundingClientRect().bottom - x.getBoundingClientRect().bottom);
    for (const el of vis.slice(0, 8)) { el.after(bub); if (bub.getBoundingClientRect().bottom <= lim) return; }
    // 视口里被一大块占满：插到最上面那块之前（把它往下推），仍保证气泡在角色上方
    for (const el of cands.filter(el => el.getBoundingClientRect().top < lim).slice(0, 4)) { el.before(bub); if (bub.getBoundingClientRect().bottom <= lim) return; }
    if (vis[0]) vis[0].after(bub); else if (cands[0]) cands[0].before(bub); else { bub.classList.remove("is-flow"); wrap.classList.remove("is-flow"); wrap.prepend(bub); }
  }

  let hideTm = 0, shownAt = 0;
  function say(text, o) {
    o = o || {};
    if (!shown || !text) return false;
    clearTimeout(hideTm);
    bub.textContent = text;
    place();
    wrap.classList.remove("talk"); void wrap.offsetWidth; wrap.classList.add("talk", "has-bub"); bub.classList.add("is-on");
    shownAt = Date.now();
    const ms = Math.min(6000, 2600 + Math.max(0, text.length - 14) * (EN ? 40 : 120));   // 约 2.6 秒，字多稍长
    hideTm = setTimeout(hide, o.ms || ms);
    return true;
  }
  function hide() {
    clearTimeout(hideTm); wrap.classList.remove("has-bub", "talk", "is-flow"); bub.textContent = "";
    bub.classList.remove("is-flow", "is-on"); bub.style.maxWidth = "";
    if (bub.parentNode !== wrap) wrap.prepend(bub);   // 收回角色身边，不在正文里留空元素
  }
  addEventListener("scroll", () => { if (wrap.classList.contains("has-bub") && Date.now() - shownAt > 400) hide(); }, { passive: true });
  addEventListener("resize", () => { if (wrap.classList.contains("has-bub")) hide(); layoutPad(); });

  /* ---------- 台词：按当前所在的节取 ---------- */
  const parse = s => { if (!s) return []; try { const j = JSON.parse(s); if (Array.isArray(j)) return j.map(String); } catch (e) {} return String(s).split("|").map(x => x.trim()).filter(Boolean); };
  function curSec() {
    const secs = [...doc.querySelectorAll("main .vl-sec")];
    let k = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.35) k = s; });
    return k || secs[0] || null;
  }
  const turn = new WeakMap();
  btn.addEventListener("click", () => {
    if (wrap.classList.contains("has-bub")) { hide(); return; }
    const s = curSec();
    const lines = parse(s && (EN ? s.dataset.linesEn || s.dataset.lines : s.dataset.lines));
    if (!lines.length) { say("……", { ms: 1200 }); return; }   // 这一节没写台词：只眨眨眼，不凑通用台词
    const i = turn.get(s) || 0; turn.set(s, i + 1);
    say(lines[i % lines.length]);
  });
  doc.addEventListener("keydown", e => { if (e.key === "Escape" && wrap.classList.contains("has-bub")) hide(); });

  /* ---------- 关键时刻主动冒一句（每章 ≤ MAX 次） ---------- */
  const L = CFG.lines || {};
  const fromCfg = k => { const a = (EN && L[k + "En"]) || L[k]; return Array.isArray(a) && a.length ? a[VL.rng(VL.cur * 13 + said)() * a.length | 0] : ""; };
  function moment(text) { if (said >= MAX || !text) return; if (say(text)) said++; }
  doc.addEventListener("vl:try", e => { const d = e.detail || {}; if (!d.first) return; const own = d.el && (EN ? d.el.dataset.sayEn || d.el.dataset.say : d.el.dataset.say); setTimeout(() => moment(own || fromCfg("try")), 500); });
  doc.addEventListener("vl:quiz-perfect", () => setTimeout(() => moment(fromCfg("perfect")), 900));

  /* ---------- 开关：放进顶栏"显示"浮层 ---------- */
  function apply() { wrap.hidden = !shown; if (!shown) hide(); layoutPad(); syncSeg(); }
  let seg = null;
  function syncSeg() { if (seg) seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.comp === "1") === shown))); }
  const pop = doc.getElementById("vl-pop-prefs");
  if (pop) {
    const h = VL.el("h4", null, esc(T("comp.pref", "陪伴角色：{0}", "Companion: {0}", name)));
    seg = VL.el("div", { class: "vl-seg vl-seg-comp", role: "group", "aria-label": T("comp.pref", "陪伴角色：{0}", "Companion: {0}", name) },
      '<button type="button" data-comp="1" aria-pressed="false">' + esc(T("comp.on", "显示", "Show")) + '</button><button type="button" data-comp="0" aria-pressed="false">' + esc(T("comp.off", "隐藏", "Hide")) + "</button>");
    const now = pop.querySelector(".vl-pref-now");
    if (now) now.before(h, seg); else pop.append(h, seg);
    seg.addEventListener("click", e => { const b = e.target.closest("[data-comp]"); if (!b) return; set(b.dataset.comp === "1"); });
  }
  function set(v) { shown = !!v; VL.store.set("companion", shown ? "1" : "0"); apply(); }
  apply();

  VL.companion = { enabled: true, say: t => say(t), hide, set, shown: () => shown, el: wrap };
})();
