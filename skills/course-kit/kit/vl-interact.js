/* course-kit · vl-interact.js —— 互动类组件：动手题引擎、分局小游戏、逐步演示、公式拆解、对比、翻牌、热区图、漫画分镜、立场卡、篇末综合关。
   放在 vl.js 之后（需要 window.VL）；结构样式在 vl-interact.css，外观在皮肤的 interact.css。
   和 vl.js 一样：组件只管结构、交互、无障碍；界面文字走 tr(键, 中文默认)，英文表在下面 EN；存储走 VL.store；动效先问 VL.motion()。
   API 写法见 kit/README.md 第七节；这里的注释只讲"为什么"。 */
(function () {
  "use strict";
  const VL = window.VL;
  if (!VL || VL.task) return;
  const doc = document, BASE = VL.base, LANG = VL.lang;
  const { esc, el, $$, clamp, store } = VL;
  const motion = () => VL.motion();
  const strip = s => String(s == null ? "" : s).replace(/<[^>]+>/g, "").trim();

  /* ---------- 界面文字 ---------- */
  const EN = {
    "tk.aria": "Hands-on task", "tk.qN": "Task {0} of {1}", "tk.check": "Check", "tk.hint": "Hint", "tk.hint2": "A bit more help", "tk.show": "Just show me", "tk.reset": "Start again",
    "tk.next": "Next task →", "tk.done": "All done.", "tk.again": "Do it again", "tk.was": " (you finished this before)",
    "tk.h1": "Hint 1", "tk.h2": "Hint 2", "tk.notyet": "Not yet", "tk.ok": "Got it", "tk.shown": "Answer laid out",
    "tk.nr.sort": "Some cards are not in a box yet.", "tk.nr.pair": "Some items are not paired yet.", "tk.nr": "Not finished yet.", "tk.nr.order": "Not finished yet.", "tk.nr.range": "Not finished yet.", "tk.nr.judge": "Not finished yet.",
    "tk.bad.sort": "{0} card(s) are in the wrong box. Look again at the ones marked ✗.", "tk.bad.order": "{0} item(s) are in the wrong place. Look again at the ones marked ✗.",
    "tk.bad.pair": "{0} pair(s) are wrong. Look again at the ones marked ✗.", "tk.bad.range": "{0} thing(s) are not right yet.", "tk.bad.judge": "{0} thing(s) are not right yet.", "tk.whyItem": "“{0}”: ", "tk.again1": "Not quite. Think again.",
    "tk.pool": "Cards not placed yet", "tk.poolEmpty": "Every card is in a box.", "tk.put": "Put here", "tk.putAria": "Put the selected card into “{0}”", "tk.picked": "Card picked. Now choose a box.",
    "tk.up": "Move up: {0}", "tk.down": "Move down: {0}", "tk.pairFirst": "First pick an item on the left, then its partner on the right.", "tk.paired": "{0}, paired with item {1}",
    "tk.wrongMark": " (wrong)", "tk.range": "Drag the slider", "tk.target": "Target zone",
    "tk.jN": "Case {0} of {1}", "tk.jYour": "Your verdict", "tk.jBook": "This book’s verdict: {0}.", "tk.j1": "Think again. ", "tk.j2": "Here is this book’s verdict for this one.", "tk.jNext": "Next case →",
    "gm.rd": "Round {0}", "gm.rdOf": "Round {0} / {1}", "gm.redo": "↺ Replay this round", "gm.next": "Next round →", "gm.all": "Start over from round 1", "gm.out": "Out of moves.",
    "gm.win": "Round cleared.", "gm.lose": "Not this time. Replay the round and try again.", "gm.vs": "You : {0}", "gm.pick": "Choose a round", "gm.lock": " (clear the previous round first)",
    "gm.stars": "Stars", "gm.starsN": "{0} of {1} stars", "gm.left": "Moves left", "gm.diag": "What went wrong", "gm.review": "Looking back", "gm.pad": "On-screen controls",
    "st.first": "Back to the start", "st.prev": "Previous step", "st.next": "Next step", "st.play": "Play", "st.pause": "Pause", "st.slow": "Slow motion", "st.prog": "Steps",
    "st.n": "{0} / {1}", "st.k": "Step {0}", "st.group": "Step-by-step demo (use left and right to step)",
    "an.key": "What each part means", "an.pin": "Click to pin, click again to release",
    "cm.toggle": "Switch view", "cm.drag": "Drag the divider", "cm.slider": "Divider: left is {0}, right is {1}", "cm.good": "✓ ", "cm.bad": "✗ ",
    "fl.all": "Turn all over", "fl.none": "Turn all back", "fl.card": "Flip card", "fl.group": "Flip cards",
    "hot.hint": "Tap a part of the picture first.", "hot.seen": "Seen {0} / {1}", "hot.group": "Clickable picture",
    "cc.n": "Panel {0}",
    "ph.prev": "Previous", "ph.next": "Next", "ph.tabs": "Views", "ph.you": "You chose: {0}", "ph.notyet": "You have not picked a side yet; the first card has the vote.",
    "vt.saved": "Noted: {0}. You can change it any time.", "vt.group": "Your view",
    "rv.title": "Review page", "rv.can": "What you can make sense of now", "rv.claims": "Claims to knock down", "rv.struck": "Knocked down: ", "rv.round": "Knock down: {0}",
    "rv.done": "Every wrong claim is crossed out.",
  };
  function tr(key, zh, ...a) {
    const X = window.VL_I18N && window.VL_I18N[LANG];
    let s = X && X[key] != null ? X[key] : (LANG === "en" ? EN[key] : undefined);
    if (typeof s === "function") return String(s(...a));
    if (s == null) s = zh;
    return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m));
  }

  /* ---------- 小工具 ---------- */
  let uid = 0;
  const nid = p => p + "-" + (++uid);
  const btn = (cls, html, attrs) => '<button type="button" class="' + cls + '"' + (attrs || "") + ">" + html + "</button>";
  function seeded(str) {
    let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return VL.rng(h >>> 0);
  }
  // 打乱，但保证和原顺序不同：不然读者一上来看到的就是答案
  function shuffled(n, key) {
    const r = seeded(key), o = Array.from({ length: n }, (_, i) => i);
    for (let k = 0; k < 6; k++) {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
      if (n < 2 || o.some((v, i) => v !== i)) break;
    }
    if (n >= 2 && o.every((v, i) => v === i)) o.push(o.shift());
    return o;
  }
  const fmtNum = v => { const a = Math.abs(v); return a >= 100 ? String(Math.round(v)) : a >= 1 ? String(+(+v).toPrecision(3)) : String(+(+v).toPrecision(2)); };
  function readJSON(host, sel) {
    const s = host.querySelector(sel || ':scope > script[type="application/json"]');
    if (!s) return {};
    try { return JSON.parse(s.textContent); } catch (e) { console.warn("[VL] JSON 写错了：", host, e.message); return {}; }
  }
  const fire = (node, name, detail) => node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const mountIllus = node => { if (VL.illus && VL.illus.mount) VL.illus.mount(node); };
  // 首次进入视口时调一次（没有 IntersectionObserver 就立刻调）
  function once(node, fn, th) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: th || 0.25 });
    io.observe(node);
  }

  // 拖动：pointer 事件一套代码管鼠标、触屏、触控笔。移动超过 6px 才算拖，否则当作点击交给 onclick。
  // 拖的是一个"影子"：原卡片留在原地，松手时按落点改数据再整体重画，数据和画面不会对不上
  function draggable(node, targetSel, scope, onDrop) {
    node.addEventListener("pointerdown", e => {
      if ((e.pointerType === "mouse" && e.button !== 0) || node.disabled) return;
      const sx = e.clientX, sy = e.clientY; let ghost = null, over = null;
      const at = ev => { const t = doc.elementFromPoint(ev.clientX, ev.clientY); const z = t && t.closest(targetSel); return z && scope.contains(z) ? z : null; };
      const move = ev => {
        if (!ghost) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
          const r = node.getBoundingClientRect();
          ghost = node.cloneNode(true); ghost.classList.add("vl-tk-ghost"); ghost.removeAttribute("id"); ghost.setAttribute("aria-hidden", "true");
          ghost.style.width = r.width + "px"; ghost._dx = sx - r.left; ghost._dy = sy - r.top;
          doc.body.appendChild(ghost); node.classList.add("vl-tk-lift");
        }
        ev.preventDefault();
        ghost.style.transform = "translate(" + (ev.clientX - ghost._dx) + "px," + (ev.clientY - ghost._dy) + "px)";
        const t = at(ev); if (t !== over) { if (over) over.classList.remove("vl-tk-over"); over = t; if (over) over.classList.add("vl-tk-over"); }
      };
      const end = (ev, drop) => {
        removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", cancel);
        if (over) over.classList.remove("vl-tk-over");
        if (!ghost) return;
        ghost.remove(); node.classList.remove("vl-tk-lift"); node._dragT = Date.now();
        if (drop) onDrop(at(ev));
      };
      const up = ev => end(ev, true), cancel = ev => end(ev, false);
      addEventListener("pointermove", move, { passive: false }); addEventListener("pointerup", up); addEventListener("pointercancel", cancel);
    });
  }
  const justDragged = n => n._dragT && Date.now() - n._dragT < 350;
  const xMark = '<span class="vl-tk-x" aria-hidden="true">✗</span>';
  const okMark = '<span class="vl-tk-ok" aria-hidden="true">✓</span>';
  const CIRC = "①②③④⑤⑥⑦⑧⑨⑩";

  /* =====================================================================
     G6 动手题引擎：sort 分拣 / order 排序 / pair 配对 / range 调到区间 / judge 逐条判定
     没有血条、不计分、没有失败。答错两级反馈（先说错了几处并标 ✗ → 再点名一处说为什么）；
     提示三级（看哪里 → 为什么 → 直接摆好答案，照样算完成）。
     每种题型给 init / view / bind / ready / wrong / solve / spoil / reset / label。
     ===================================================================== */
  const TT = {};
  TT.sort = {
    init: r => ({ place: r.items.map(() => -1), sel: -1, order: shuffled(r.items.length, r._key) }),
    ready: (r, s) => s.place.every(p => p >= 0),
    wrong: (r, s) => r.items.map((it, i) => (s.place[i] === it.bin ? -1 : i)).filter(i => i >= 0),
    solve: (r, s) => { s.place = r.items.map(it => it.bin); s.sel = -1; },
    spoil: (r, s) => { s.place = r.items.map((it, i) => (i === 0 ? (it.bin + 1) % r.bins.length : it.bin)); s.sel = -1; },
    reset: (r, s) => { s.place = r.items.map(() => -1); s.sel = -1; },
    label: (r, i) => strip(r.items[i].t), list: r => r.items,
    view(r, s, R) {
      const card = i => btn("vl-tk-card vl-tk-drag" + (s.sel === i ? " sel" : "") + (R.bad.includes(i) ? " bad" : "") + (R.locked ? " ok" : ""),
        (R.bad.includes(i) ? xMark : R.locked ? okMark : "") + r.items[i].t + (R.bad.includes(i) ? '<span class="vl-sr">' + esc(tr("tk.wrongMark", "（放错了）")) + "</span>" : ""),
        ' data-k="c' + i + '" aria-pressed="' + (s.sel === i) + '"' + (R.locked ? " disabled" : ""));
      const pool = s.order.filter(i => s.place[i] < 0);
      return '<div class="vl-tk-pool vl-tk-zone" data-z="-1" role="group" aria-label="' + esc(tr("tk.pool", "还没放的卡片")) + '">' +
        (pool.length ? pool.map(card).join("") : '<span class="vl-tk-empty">' + esc(tr("tk.poolEmpty", "卡片都放进框里了。")) + "</span>") + "</div>" +
        '<div class="vl-tk-bins" style="--n:' + r.bins.length + '">' + r.bins.map((b, k) =>
          '<div class="vl-tk-bin vl-tk-zone" data-z="' + k + '" role="group" aria-label="' + esc(strip(b)) + '"><div class="vl-tk-bin-h"><b>' + b + "</b>" +
          btn("vl-btn alt vl-tk-put", esc(tr("tk.put", "放进这里")), ' data-k="p' + k + '" aria-label="' + esc(tr("tk.putAria", "把选中的卡片放进「{0}」", strip(b))) + '"' + (R.locked || s.sel < 0 ? " disabled" : "")) +
          "</div>" + s.order.filter(i => s.place[i] === k).map(card).join("") + "</div>").join("") + "</div>";
    },
    bind(r, s, R, box) {
      const go = (i, z) => { s.place[i] = z; s.sel = -1; R.changed(); };
      box.querySelectorAll(".vl-tk-card").forEach(b => {
        const i = +b.dataset.k.slice(1);
        b.onclick = () => { if (justDragged(b)) return; s.sel = s.sel === i ? -1 : i; R.redraw("c" + i); if (s.sel >= 0) R.say(tr("tk.picked", "已选中卡片，再点一个框“放进这里”。")); };
        draggable(b, ".vl-tk-zone", box, z => { if (z) { go(i, +z.dataset.z); R.focus("c" + i); } });
      });
      box.querySelectorAll(".vl-tk-put").forEach(b => { b.onclick = () => { if (s.sel >= 0) { const i = s.sel; go(i, +b.dataset.k.slice(1)); R.focus("c" + i); } }; });
      const pool = box.querySelector(".vl-tk-pool");
      pool.onclick = e => { if (e.target === pool && s.sel >= 0) { const i = s.sel; go(i, -1); R.focus("c" + i); } };
    },
  };
  TT.order = {
    init: r => ({ seq: shuffled(r.items.length, r._key) }),
    ready: () => true,
    wrong: (r, s) => s.seq.map((v, p) => (v === p ? -1 : v)).filter(v => v >= 0),
    solve: (r, s) => { s.seq = r.items.map((_, i) => i); },
    spoil: (r, s) => { s.seq = r.items.map((_, i) => i); [s.seq[0], s.seq[1]] = [s.seq[1], s.seq[0]]; },
    reset: (r, s) => { s.seq = shuffled(r.items.length, r._key); },
    label: (r, i) => strip(r.items[i].t), list: r => r.items,
    view(r, s, R) {
      const n = s.seq.length;
      return '<ol class="vl-tk-order">' + s.seq.map((v, p) => {
        const bad = R.bad.includes(v);
        return '<li class="vl-tk-oi' + (bad ? " bad" : "") + '" data-p="' + p + '">' +
          btn("vl-tk-card vl-tk-drag vl-tk-ocard" + (bad ? " bad" : "") + (R.locked ? " ok" : ""), '<span class="vl-tk-num">' + (p + 1) + "</span>" + (bad ? xMark : R.locked ? okMark : "") + r.items[v].t +
            (bad ? '<span class="vl-sr">' + esc(tr("tk.wrongMark", "（放错了）")) + "</span>" : ""), ' data-k="o' + v + '"' + (R.locked ? " disabled" : "")) +
          '<span class="vl-tk-ud">' + btn("vl-tk-mv", "↑", ' data-k="u' + v + '" aria-label="' + esc(tr("tk.up", "上移：{0}", strip(r.items[v].t))) + '"' + (R.locked || p === 0 ? " disabled" : "")) +
          btn("vl-tk-mv", "↓", ' data-k="d' + v + '" aria-label="' + esc(tr("tk.down", "下移：{0}", strip(r.items[v].t))) + '"' + (R.locked || p === n - 1 ? " disabled" : "")) + "</span></li>";
      }).join("") + "</ol>";
    },
    bind(r, s, R, box) {
      const mv = (v, to) => { const p = s.seq.indexOf(v); to = clamp(to, 0, s.seq.length - 1); if (to === p) return false; s.seq.splice(p, 1); s.seq.splice(to, 0, v); R.changed(); return true; };
      box.querySelectorAll(".vl-tk-mv").forEach(b => {
        const v = +b.dataset.k.slice(1), up = b.dataset.k[0] === "u";
        b.onclick = () => { mv(v, s.seq.indexOf(v) + (up ? -1 : 1)); R.focus(b.dataset.k, "o" + v); };
      });
      box.querySelectorAll(".vl-tk-ocard").forEach(b => {
        const v = +b.dataset.k.slice(1);
        // 键盘：卡片上按 ↑↓ 也能挪
        b.onkeydown = e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); mv(v, s.seq.indexOf(v) + (e.key === "ArrowUp" ? -1 : 1)); R.focus("o" + v); } };
        draggable(b, ".vl-tk-oi", box, z => { if (z) { mv(v, +z.dataset.p); R.focus("o" + v); } });
      });
    },
  };
  TT.pair = {
    init: r => ({ link: r.pairs.map(() => -1), sel: -1, rord: shuffled(r.pairs.length, r._key) }),
    ready: (r, s) => s.link.every(x => x >= 0),
    wrong: (r, s) => s.link.map((x, i) => (x === i ? -1 : i)).filter(i => i >= 0),
    solve: (r, s) => { s.link = r.pairs.map((_, i) => i); s.sel = -1; },
    spoil: (r, s) => { s.link = r.pairs.map((_, i) => i); if (s.link.length > 1) [s.link[0], s.link[1]] = [s.link[1], s.link[0]]; },
    reset: (r, s) => { s.link = r.pairs.map(() => -1); s.sel = -1; },
    label: (r, i) => strip(r.pairs[i].l), list: r => r.pairs,
    view(r, s, R) {
      const L = r.pairs.map((p, i) => {
        const bad = R.bad.includes(i);
        return btn("vl-tk-card vl-tk-pl" + (s.sel === i ? " sel" : "") + (bad ? " bad" : "") + (s.link[i] >= 0 ? " linked" : "") + (R.locked ? " ok" : ""),
          '<span class="vl-tk-num">' + CIRC[i] + "</span>" + (bad ? xMark : R.locked ? okMark : "") + p.l + (bad ? '<span class="vl-sr">' + esc(tr("tk.wrongMark", "（放错了）")) + "</span>" : ""),
          ' data-k="l' + i + '" aria-pressed="' + (s.sel === i) + '"' + (R.locked ? " disabled" : ""));
      }).join("");
      const Rr = s.rord.map(j => {
        const owner = s.link.indexOf(j);
        return btn("vl-tk-card vl-tk-pr" + (owner >= 0 ? " linked" : "") + (R.locked ? " ok" : ""),
          (owner >= 0 ? '<span class="vl-tk-num">' + CIRC[owner] + "</span>" : '<span class="vl-tk-num vl-tk-num0" aria-hidden="true">?</span>') + r.pairs[j].r,
          ' data-k="r' + j + '"' + (owner >= 0 ? ' aria-label="' + esc(tr("tk.paired", "{0}，已和第 {1} 项配对", strip(r.pairs[j].r), owner + 1)) + '"' : "") + (R.locked ? " disabled" : ""));
      }).join("");
      return '<div class="vl-tk-pair"><div class="vl-tk-pcol">' + L + '</div><div class="vl-tk-pcol">' + Rr + "</div></div>";
    },
    bind(r, s, R, box) {
      box.querySelectorAll(".vl-tk-pl").forEach(b => { const i = +b.dataset.k.slice(1); b.onclick = () => { s.sel = s.sel === i ? -1 : i; R.redraw("l" + i); }; });
      box.querySelectorAll(".vl-tk-pr").forEach(b => {
        const j = +b.dataset.k.slice(1);
        b.onclick = () => {
          if (s.sel < 0) { R.say(tr("tk.pairFirst", "先点左边一项，再点右边和它配对的那一项。")); return; }
          s.link = s.link.map(x => (x === j ? -1 : x)); s.link[s.sel] = j;
          const nx = s.link.indexOf(-1); s.sel = -1; R.changed(); R.focus(nx >= 0 ? "l" + nx : "r" + j);
        };
      });
    },
  };
  TT.range = {
    init: r => ({ v: r.value != null ? +r.value : +r.min }),
    ready: () => true,
    wrong: (r, s) => (s.v >= r.target[0] && s.v <= r.target[1] ? [] : [0]),
    solve: (r, s) => { const st = +r.step || 1; s.v = Math.round(((r.target[0] + r.target[1]) / 2 - r.min) / st) * st + +r.min; },
    spoil: (r, s) => { s.v = +r.min >= r.target[0] && +r.min <= r.target[1] ? +r.max : +r.min; },
    reset: (r, s) => { s.v = r.value != null ? +r.value : +r.min; },
    label: () => "", list: () => [],
    fmt: (r, v) => (typeof r.fmt === "function" ? r.fmt(v) : fmtNum(v) + (r.unit ? " " + r.unit : "")),
    why: (r, s) => (s.v < r.target[0] ? r.low : r.high) || r.miss || "",
    view(r, s, R) {
      const id = nid("vl-tkr"), pc = v => clamp((v - r.min) / (r.max - r.min) * 100, 0, 100);
      const ends = r.ends || [];
      return '<div class="vl-tk-range' + (R.bad.length ? " bad" : "") + (R.locked ? " ok" : "") + '"><div class="vl-tk-rrow"><label for="' + id + '">' + (r.label || esc(tr("tk.range", "拖动滑块"))) + "</label>" +
        '<output for="' + id + '">' + (R.bad.length ? xMark : R.locked ? okMark : "") + esc(TT.range.fmt(r, s.v)) + "</output></div>" +
        '<input type="range" id="' + id + '" min="' + r.min + '" max="' + r.max + '" step="' + (r.step || 1) + '" value="' + s.v + '" data-k="s"' + (R.locked ? " disabled" : "") + ">" +
        (ends.length ? '<div class="vl-tk-ends" aria-hidden="true"><span>' + (ends[0] || "") + "</span><span>" + (ends[1] || "") + "</span></div>" : "") +
        // 目标区间只在做对之后画出来，不然等于直接给答案
        (R.locked ? '<div class="vl-tk-track"><i class="vl-tk-target" style="left:' + pc(r.target[0]) + "%;width:" + (pc(r.target[1]) - pc(r.target[0])) + '%"></i><i class="vl-tk-you" style="left:' + pc(s.v) + '%"></i><span class="vl-sr">' + esc(tr("tk.target", "目标区间")) + "</span></div>" : "") +
        (typeof r.view === "function" ? '<div class="vl-tk-view" aria-live="polite">' + r.view(s.v) + "</div>" : "") + "</div>";
    },
    bind(r, s, R, box) {
      const inp = box.querySelector("input"), out = box.querySelector("output"), vw = box.querySelector(".vl-tk-view"), wrap = box.querySelector(".vl-tk-range");
      // 拖动时只改读数和小图，不整体重画，滑块不会丢焦点
      inp.oninput = () => { s.v = +inp.value; out.textContent = TT.range.fmt(r, s.v); if (vw) vw.innerHTML = r.view(s.v); if (R.bad.length) { R.bad = []; wrap.classList.remove("bad"); } };
    },
  };
  TT.judge = {
    noCheck: true,
    init: r => ({ at: 0, res: r.cards.map(() => null), wv: r.cards.map(() => -1) }),
    ready: (r, s) => s.res.every(Boolean),
    wrong: () => [],
    solve: (r, s) => { r.cards.forEach((c, i) => { if (!s.res[i]) s.res[i] = { v: c.a, shown: true }; }); s.at = r.cards.length - 1; },
    spoil: (r, s) => { s.wv[s.at] = (r.cards[s.at].a + 1) % r.verdicts.length; },
    reset: (r, s) => { s.at = 0; s.res = r.cards.map(() => null); s.wv = r.cards.map(() => -1); },
    label: (r, i) => strip(r.cards[i].t), list: r => r.cards,
    view(r, s, R) {
      const V = r.verdicts, book = c => '<b class="vl-tk-book">' + esc(tr("tk.jBook", "本书判断：{0}。", strip(V[c.a]))) + "</b>";
      if (R.locked) {
        return '<ul class="vl-tk-jlist">' + r.cards.map((c, i) => '<li class="' + (s.res[i] && s.res[i].shown ? "shown" : "ok") + '"><span class="vl-tk-jt">' + (s.res[i] && s.res[i].shown ? "" : okMark + " ") + c.t + "</span>" + book(c) + (c.why ? " " + c.why : "") + "</li>").join("") + "</ul>";
      }
      const c = r.cards[s.at], res = s.res[s.at], n = r.cards.length;
      return '<p class="vl-tk-jn">' + esc(tr("tk.jN", "第 {0} / {1} 张", s.at + 1, n)) + "</p>" +
        '<div class="vl-tk-case">' + c.t + "</div>" +
        '<div class="vl-tk-verdicts" role="group" aria-label="' + esc(tr("tk.jYour", "你的判断")) + '">' + V.map((v, k) => {
          let st = "";
          if (res) st = k === c.a ? (res.shown ? " miss" : " right") : k === s.wv[s.at] ? " wrong" : "";
          else if (k === s.wv[s.at]) st = " wrong";
          return btn("vl-chip vl-tk-verdict" + st, v, ' data-k="v' + k + '" aria-pressed="' + (st === " right" || st === " wrong") + '"' + (res || k === s.wv[s.at] ? " disabled" : ""));
        }).join("") + "</div>" +
        (res ? '<div class="vl-tk-why">' + book(c) + (c.why ? " " + c.why : "") + "</div>" + (s.at < n - 1 ? btn("vl-btn vl-tk-jnext", esc(tr("tk.jNext", "下一张 →")), ' data-k="jn"') : "") : "");
    },
    bind(r, s, R, box) {
      box.querySelectorAll(".vl-tk-verdict").forEach(b => {
        const k = +b.dataset.k.slice(1);
        b.onclick = () => {
          const c = r.cards[s.at]; if (s.res[s.at]) return;
          if (k === c.a) { s.res[s.at] = { v: k }; R.say(""); }
          else if (s.wv[s.at] < 0) { s.wv[s.at] = k; R.say('<span class="vl-tk-tag no">' + esc(tr("tk.notyet", "还不对")) + "</span>" + esc(tr("tk.j1", "再想想。")) + (c.hint || r.miss || ""), "no"); R.redraw(); VL.shake(box.querySelector(".vl-tk-verdicts")); R.focus("-"); return; }   // 焦点落到第一个还能点的判断上，不替读者指出正确那一个
          else { s.res[s.at] = { v: c.a, shown: true }; R.say(esc(tr("tk.j2", "这一张直接看本书的判断。"))); }
          if (s.res.every(Boolean)) R.pass(false); else { R.redraw(); R.focus("jn"); }
        };
      });
      const nx = box.querySelector(".vl-tk-jnext");
      if (nx) nx.onclick = () => { s.at++; R.say(""); R.redraw(); R.focus("v0"); };
    },
  };
  const DONE_T = () => new Set(store.json("task", []));
  function markTaskDone(id) { const a = DONE_T(), k = BASE + "#" + id, first = !a.has(k); a.add(k); store.setJSON("task", Array.from(a)); return first; }

  function engine(host, cfg, hooks) {
    hooks = hooks || {};
    const rounds = (cfg.rounds || []).filter(r => TT[r.type]);
    if (!rounds.length) { console.warn("[VL] 动手题没有可用的题目（type 只认 sort / order / pair / range / judge）：", host); return null; }
    if (!host.id) host.id = nid("vl-task");
    const id = cfg.id || host.id, N = rounds.length;
    rounds.forEach((r, i) => {
      r._key = BASE + "#" + id + "#" + i;
      if (r.type === "range" && r.value != null && r.value >= r.target[0] && r.value <= r.target[1]) console.warn("[VL] 调到区间题的起始值已经在目标区间里，读者不动就算对：", id, i);
    });
    const was = DONE_T().has(BASE + "#" + id);
    host.innerHTML = (hooks.head || "") + '<div class="vl-task-stage"></div><div class="vl-task-end" hidden role="status"></div>';
    const stage = host.querySelector(".vl-task-stage"), end = host.querySelector(".vl-task-end");
    let at = 0, st = null, R = null, anyShown = false;

    function hintLabel() {
      const H = rounds[at].hints || [];
      if (R.hint === 0 && H[0]) return tr("tk.hint", "提示");
      if (R.hint <= 1 && H[1]) return R.hint === 0 ? tr("tk.hint", "提示") : tr("tk.hint2", "再给一点提示");
      return tr("tk.show", "直接摆好答案");
    }
    function showRound() {
      const r = rounds[at], tp = TT[r.type];
      st = tp.init(r);
      R = { bad: [], locked: false, tries: 0, hint: 0, redraw, focus, say, pass, changed() { R.bad = []; redraw(); } };
      const prog = (N > 1 ? tr("tk.qN", "第 {0} / {1} 题", at + 1, N) : "") + (hooks.prog ? hooks.prog(r, at) : "") + (was && at === 0 ? tr("tk.was", "（之前做完过）") : "");
      stage.innerHTML = '<p class="vl-task-prog">' + prog + '</p><p class="vl-task-q" tabindex="-1">' + (r.prompt || "") + "</p>" +
        '<div class="vl-task-body" data-type="' + r.type + '"></div>' +
        '<div class="vl-task-ctl">' + (tp.noCheck ? "" : btn("vl-btn vl-tk-check", esc(tr("tk.check", "检查")))) +
        btn("vl-btn alt vl-tk-hint", esc(hintLabel())) + btn("vl-btn alt vl-tk-reset", esc(tr("tk.reset", "重来"))) +
        (at < N - 1 ? btn("vl-btn vl-tk-next", esc(tr("tk.next", "下一题 →")), " hidden") : "") + "</div>" +
        '<div class="vl-task-fb" aria-live="polite"></div>';
      const ck = stage.querySelector(".vl-tk-check"); if (ck) ck.onclick = check;
      stage.querySelector(".vl-tk-hint").onclick = hint;
      stage.querySelector(".vl-tk-reset").onclick = () => { if (R.locked) return; tp.reset(r, st); R.bad = []; R.tries = 0; redraw(); say(""); };
      const nx = stage.querySelector(".vl-tk-next");
      if (nx) nx.onclick = () => { at++; showRound(); const q = stage.querySelector(".vl-task-q"); q.focus({ preventScroll: true }); stage.scrollIntoView({ block: "nearest", behavior: motion() ? "smooth" : "auto" }); };
      redraw();
    }
    function redraw(fk) {
      const r = rounds[at], tp = TT[r.type], box = stage.querySelector(".vl-task-body");
      const k = fk || (doc.activeElement && box.contains(doc.activeElement) ? doc.activeElement.dataset.k : null);
      box.innerHTML = tp.view(r, st, R);
      if (!R.locked) tp.bind(r, st, R, box);
      mountIllus(box);
      if (k) focus(k);
    }
    function focus(k, alt) {
      const box = stage.querySelector(".vl-task-body");
      const b = box.querySelector('[data-k="' + k + '"]:not(:disabled)') || (alt && box.querySelector('[data-k="' + alt + '"]:not(:disabled)')) || box.querySelector("[data-k]:not(:disabled)");
      if (b) b.focus({ preventScroll: true });
    }
    function say(html, kind) { const fb = stage.querySelector(".vl-task-fb"); fb.className = "vl-task-fb" + (kind ? " " + kind : ""); fb.innerHTML = html || ""; }
    const tag = (cls, s) => '<span class="vl-tk-tag ' + cls + '">' + esc(s) + "</span>";
    function check() {
      const r = rounds[at], tp = TT[r.type];
      if (R.locked) return;
      if (!tp.ready(r, st)) { say(esc(tr("tk.nr." + r.type, { sort: "还有卡片没放进框里。", pair: "还有没配上的项。" }[r.type] || "还没摆完。")), "warn"); return; }
      const bad = tp.wrong(r, st);
      if (!bad.length) return pass(false);
      R.tries++; R.bad = bad; redraw();
      let msg;
      if (tp.why) msg = (R.tries > 1 && r.hints && r.hints[1] ? r.hints[1] : tp.why(r, st)) || esc(tr("tk.again1", "还不对，再想想。"));
      else if (R.tries === 1) msg = esc(tr("tk.bad." + r.type, { sort: "有 {0} 张卡放错了，标了 ✗ 的再想想。", order: "有 {0} 个位置不对，标了 ✗ 的再想想。", pair: "有 {0} 对配错了，标了 ✗ 的再想想。" }[r.type], bad.length)) + (r.miss ? " " + r.miss : "");
      else {
        // 第二次起点名其中一处，说出为什么（优先挑写了 why 的那一项）
        const list = tp.list(r), k = bad.find(i => list[i] && list[i].why);
        msg = k != null ? esc(tr("tk.whyItem", "「{0}」：", tp.label(r, k))) + list[k].why : esc(tr("tk.bad." + r.type, "有 {0} 处不对。", bad.length)) + (r.miss ? " " + r.miss : "");
      }
      say(tag("no", tr("tk.notyet", "还不对")) + msg, "no");
      VL.shake(stage.querySelector(".vl-task-body"));
    }
    function hint() {
      const r = rounds[at], tp = TT[r.type], H = r.hints || [];
      if (R.locked) return;
      const b = stage.querySelector(".vl-tk-hint");
      if (R.hint === 0 && H[0]) { R.hint = 1; say(tag("", tr("tk.h1", "提示 1")) + H[0]); }
      else if (R.hint <= 1 && H[1]) { R.hint = 2; say(tag("", tr("tk.h2", "提示 2")) + H[1]); }
      else { tp.solve(r, st); pass(true); return; }
      b.textContent = hintLabel();
    }
    function pass(shown) {
      const r = rounds[at];
      if (shown) anyShown = true;
      R.locked = true; R.bad = []; redraw();
      ["vl-tk-check", "vl-tk-hint", "vl-tk-reset"].forEach(c => { const b = stage.querySelector("." + c); if (b) b.hidden = true; });
      say(tag("ok", shown ? tr("tk.shown", "答案摆好了") : tr("tk.ok", "做对了")) + (r.ok || ""), "ok");
      const detail = { id, i: at, n: N, revealed: !!shown, last: at === N - 1 };
      if (hooks.onRound) hooks.onRound(at, detail);
      fire(host, "vl:task-round", detail);
      const nx = stage.querySelector(".vl-tk-next");
      if (at < N - 1 && nx) { nx.hidden = false; nx.focus({ preventScroll: true }); } else finish();
    }
    function finish() {
      const first = markTaskDone(id);
      end.hidden = false;
      end.innerHTML = '<p class="vl-task-end-t">' + (cfg.done || esc(tr("tk.done", "全部做完了。"))) + "</p>" + (hooks.endExtra ? hooks.endExtra() : "") +
        btn("vl-btn alt vl-tk-again", esc(tr("tk.again", "再做一遍")));
      end.querySelector(".vl-tk-again").onclick = restart;
      if (cfg.tryId) VL.tryDone(cfg.tryId);
      const detail = { id, first, revealed: anyShown };
      if (hooks.onDone) hooks.onDone(detail);
      fire(host, "vl:task-done", detail);
      const t = end.querySelector(".vl-task-end-t"); t.tabIndex = -1; t.focus({ preventScroll: true });
    }
    function restart() { at = 0; anyShown = false; end.hidden = true; if (hooks.onRestart) hooks.onRestart(); showRound(); stage.querySelector(".vl-task-q").focus({ preventScroll: true }); }
    showRound();
    const api = {
      el: host, id, rounds, restart, get at() { return at; }, get state() { return st; }, get locked() { return R.locked; },
      // 测试钩子：把当前题摆成正确 / 错误答案再点"检查"（自测和 qa 用）
      _solve() { const r = rounds[at]; if (R.locked) return true; TT[r.type].solve(r, st); if (TT[r.type].noCheck) { pass(false); return true; } redraw(); check(); return R.locked; },
      _spoil() { const r = rounds[at]; if (R.locked) return false; TT[r.type].spoil(r, st); redraw(); if (!TT[r.type].noCheck) check(); return !R.locked; },
      _next() { const b = stage.querySelector(".vl-tk-next"); if (b && !b.hidden) b.click(); },
    };
    host._vlTask = api;
    return api;
  }
  function task(host, cfg) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host) return null;
    if (host._vlTask) return host._vlTask;
    cfg = Object.assign({}, readJSON(host), cfg || {});
    host.classList.add("vl-task");
    host.setAttribute("role", "group");
    if (!host.getAttribute("aria-label")) host.setAttribute("aria-label", cfg.title ? strip(cfg.title) : tr("tk.aria", "动手题"));
    return engine(host, cfg, cfg.title ? { head: '<h3 class="vl-task-title">' + cfg.title + "</h3>" } : null);
  }

  /* =====================================================================
     P2 篇末综合关：几道动手题串起来，每做对一道就划掉一条错误论断；无血条、不计分、无失败。
     "守层者 / BOSS"只是皮肤外观，kit 里只有论断清单 + 题目。
     ===================================================================== */
  const DONE_R = () => new Set(store.json("review", []));
  function review(host, cfg) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host) return null;
    if (host._vlTask) return host._vlTask;
    cfg = Object.assign({}, readJSON(host), cfg || {});
    const rounds = cfg.rounds || [];
    if (!host.id) host.id = nid("vl-review");
    const id = cfg.id || host.id;
    host.classList.add("vl-review");
    host.setAttribute("role", "region");
    host.setAttribute("aria-label", strip(cfg.title || tr("rv.title", "本篇复习页")));
    const head = '<div class="vl-review-h"><h3 class="vl-review-title">' + (cfg.title || esc(tr("rv.title", "本篇复习页"))) + "</h3>" + (cfg.intro ? '<p class="vl-review-intro">' + cfg.intro + "</p>" : "") +
      (cfg.can && cfg.can.length ? '<div class="vl-review-can"><h4>' + esc(tr("rv.can", "你现在能看懂")) + "</h4><ul>" + cfg.can.map(c => "<li>" + c + "</li>").join("") + "</ul></div>" : "") +
      '<p class="vl-review-ck">' + esc(tr("rv.claims", "要拆掉的错误论断")) + '</p><ol class="vl-review-claims">' + rounds.map((r, i) => '<li class="vl-review-claim" data-i="' + i + '"><span class="vl-review-ct">' + (r.claim || "") + "</span></li>").join("") + "</ol></div>";
    const claimEl = i => host.querySelector('.vl-review-claim[data-i="' + i + '"]');
    const strike = i => { const c = claimEl(i); if (c && !c.classList.contains("struck")) { c.classList.add("struck"); c.insertAdjacentHTML("afterbegin", '<span class="vl-sr">' + esc(tr("rv.struck", "已拆掉：")) + "</span>"); } };
    const api = engine(host, Object.assign({}, cfg, { id, done: cfg.done || esc(tr("rv.done", "错误论断全部划掉了。")) }), {
      head,
      prog: r => (r.claim ? '<span class="vl-review-now">' + esc(tr("rv.round", "　拆掉：{0}", strip(r.claim))) + "</span>" : ""),
      onRound(i, d) {
        strike(i);
        fire(host, "vl:review-round", { id, i, n: d.n, claim: strip(rounds[i] && rounds[i].claim), revealed: d.revealed, last: d.last });
      },
      onDone(d) {
        const a = DONE_R(), k = BASE + "#" + id, first = !a.has(k); a.add(k); store.setJSON("review", Array.from(a));
        fire(host, "vl:review-done", { id, first, revealed: d.revealed });
      },
      onRestart() { host.querySelectorAll(".vl-review-claim.struck").forEach(c => { c.classList.remove("struck"); const s = c.querySelector(".vl-sr"); if (s) s.remove(); }); },
    });
    return api;
  }

  /* =====================================================================
     G7 分局小游戏骨架：局数、HUD、星级、存档、和机器比分、失败诊断、复盘、默认收起、键盘与屏幕方向键。
     章节只写：每局怎么开局（init）、一次操作怎么改状态（move）、怎样算赢输（judge）、怎么画（render）。
     ===================================================================== */
  const PAD = [["", ""], ["ArrowUp", "↑"], ["", ""], ["ArrowLeft", "←"], ["center", "●"], ["ArrowRight", "→"], ["", ""], ["ArrowDown", "↓"], ["", ""]];
  function game(sel, o) {
    const host = typeof sel === "string" ? doc.querySelector(sel) : sel;
    if (!host || host._vlGame) return host && host._vlGame;
    o = o || {};
    const rounds = o.rounds && o.rounds.length ? o.rounds : [{}], N = rounds.length, maxStar = o.maxStars || 3;
    if (!host.id) host.id = nid("vl-game");
    const id = host.id, KEY = "game-" + BASE + "-" + (o.key || id);
    const rdTxt = i => tr("gm.rd", "第 {0} 局", i + 1);
    // 存档：{ res: [每局 {stars, you, bot} 或 null] }；刷新后回到第一个还没过的局
    const sv = store.json(KEY, null);
    const g = { el: host, rounds, N, i: 0, s: null, r: null, left: null, over: false, won: false, res: sv && Array.isArray(sv.res) ? sv.res.slice(0, N) : [], opt: o };
    while (g.res.length < N) g.res.push(null);
    const save = () => store.setJSON(KEY, { res: g.res });
    // 默认收起：包进选读支线（多玩一会儿），摘要写几局、约几分钟、可以跳过；展开状态由 vl.js 记住
    if (o.fold) {
      const f = typeof o.fold === "string" ? { t: o.fold } : o.fold;
      const wrap = el("div", { class: "vl-game-wrap" });
      const d = el("details", { class: "vl-side vl-game-fold", "data-kind": "play", id: id + "-fold" });
      d.innerHTML = "<summary><b>" + f.t + "</b>" + (f.d ? "<small>" + f.d + "</small>" : "") + "</summary>";
      host.before(wrap); wrap.appendChild(d); d.appendChild(host); g.fold = d;
      if (VL.enhance) VL.enhance(wrap);
    }
    host.classList.add("vl-game");
    host.setAttribute("role", "region"); if (!host.getAttribute("aria-label") && o.title) host.setAttribute("aria-label", strip(o.title));
    // 章节写在板子里的内容（画布、自己的控件）原样留作舞台
    const stage = el("div", { class: "vl-game-stage" });
    while (host.firstChild) stage.appendChild(host.firstChild);
    const hudExtra = (o.hud || []).slice();
    if (rounds.some(r => r.steps != null) && !hudExtra.some(h => h[0] === "left")) hudExtra.unshift(["left", tr("gm.left", "剩余步数")]);
    host.innerHTML =
      (o.title ? '<h3 class="vl-game-title">' + o.title + "</h3>" : "") +
      '<div class="vl-game-hud"><span class="vl-game-stat" data-gm="rdt">' + esc(tr("gm.rdOf", "第 {0} / {1} 局", 1, N)) + "</span>" +
      hudExtra.map(h => '<span class="vl-game-stat">' + h[1] + ' <b data-gm="' + h[0] + '">–</b></span>').join("") +
      (o.vs ? '<span class="vl-game-stat vl-game-vs">' + esc(tr("gm.vs", "你 : {0}", strip(o.vs))) + ' <b data-gm="vs">0 : 0</b></span>' : "") +
      (o.noStars ? "" : '<span class="vl-game-stat" title="' + esc(tr("gm.stars", "星")) + '"><span aria-hidden="true">★</span> <b data-gm="star">0</b>/' + N * maxStar + '<span class="vl-sr">' + esc(tr("gm.stars", "星")) + "</span></span>") + "</div>" +
      (N > 1 && o.pick !== false ? '<div class="vl-game-lvls" role="group" aria-label="' + esc(tr("gm.pick", "选择第几局")) + '">' + rounds.map((r, i) => btn("vl-chip vl-game-lv", esc(rdTxt(i)), ' data-gm-lv="' + i + '"')).join("") + "</div>" : "") +
      (o.rules ? '<p class="vl-game-rules">' + o.rules + "</p>" : "") +
      '<p class="vl-game-goal" data-gm="goal"></p>';
    host.appendChild(stage);
    const padKeys = o.pad ? PAD.map(p => (p[0] === "center" ? o.padCenter || "" : p[0])) : [];
    host.insertAdjacentHTML("beforeend",
      (o.pad ? '<div class="vl-pad" role="group" aria-label="' + esc(tr("gm.pad", "屏幕方向键")) + '">' + PAD.map((p, k) => {
        const key = padKeys[k], lab = (o.padLabels && o.padLabels[key]) || "";
        return key && o.keys && key in o.keys ? btn("vl-pad-b", (p[0] === "center" ? '<span aria-hidden="true">●</span>' : '<span aria-hidden="true">' + p[1] + "</span>") + (lab ? "<small>" + lab + "</small>" : ""), ' data-gm-key="' + esc(key) + '" aria-label="' + esc(lab || key) + '"') : '<span class="vl-pad-x"></span>';
      }).join("") + "</div>" : "") +
      '<div class="vl-game-row">' + btn("vl-btn alt vl-game-redo", esc(tr("gm.redo", "↺ 重来这一局")), ' data-gm-a="redo"') +
      (N > 1 ? btn("vl-btn vl-game-next", esc(tr("gm.next", "下一局 →")), ' data-gm-a="next" disabled') + btn("vl-btn alt vl-game-all", esc(tr("gm.all", "从第 1 局重新开始")), ' data-gm-a="all" hidden') : "") + "</div>" +
      '<p class="vl-game-msg" aria-live="polite"></p><div class="vl-game-diag" hidden></div><div class="vl-game-review" hidden></div>');
    const q = s => host.querySelector(s);
    g.stage = stage; g.msgEl = q(".vl-game-msg"); g.diagEl = q(".vl-game-diag"); g.reviewEl = q(".vl-game-review");
    const bNext = q('[data-gm-a="next"]'), bAll = q('[data-gm-a="all"]');
    g.set = (k, v) => { const b = host.querySelector('[data-gm="' + k + '"]'); if (b) b.textContent = v; return g; };
    g.say = html => { g.msgEl.innerHTML = html == null ? "" : html; return g; };
    const passed = i => !!(g.res[i] && g.res[i].stars > 0);
    const starTotal = () => g.res.reduce((a, r) => a + (r ? r.stars || 0 : 0), 0);
    g.vs = (you, bot) => { g.score = [you, bot]; return g.set("vs", you + " : " + bot); };
    function hud() {
      g.set("rdt", tr("gm.rdOf", "第 {0} / {1} 局", g.i + 1, N)); g.set("star", starTotal());
      if (g.left != null) g.set("left", g.left);
      host.querySelectorAll("[data-gm-lv]").forEach(b => {
        const k = +b.dataset.gmLv, open = k === 0 || passed(k - 1) || passed(k);
        b.classList.toggle("on", k === g.i); b.classList.toggle("done", passed(k)); b.disabled = !open;
        b.setAttribute("aria-pressed", String(k === g.i)); b.title = open ? "" : rdTxt(k) + tr("gm.lock", "（先过前一局）");
        b.textContent = rdTxt(k) + (passed(k) ? " ✓" : "");
      });
      if (bNext) { bNext.disabled = !(g.over && g.won && g.i < N - 1); bNext.hidden = g.i >= N - 1; }
      if (bAll) bAll.hidden = !(g.i > 0 || g.res.some(Boolean));
    }
    g.draw = () => { if (o.render) o.render(g.s, g); hud(); return g; };
    g.showTop = () => {
      if (g.fold && !g.fold.open) return;
      const top = host.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.5) scrollTo({ top: scrollY + top - 70, behavior: motion() ? "smooth" : "auto" });
    };
    g.go = (i, scroll) => {
      g.i = clamp(i, 0, N - 1); g.r = rounds[g.i]; g.over = false; g.won = false;
      g.left = g.r.steps != null ? g.r.steps : null;
      g.reviewEl.hidden = true; g.reviewEl.innerHTML = ""; g.diagEl.hidden = true; g.diagEl.innerHTML = "";
      host.classList.remove("won", "lost");
      q('[data-gm="goal"]').innerHTML = esc(rdTxt(g.i)) + (g.r.name ? " · " + g.r.name : "") + (g.r.goal ? (LANG === "en" ? ": " : "：") + g.r.goal : "");
      g.s = o.init ? o.init(g.r, g) : {};
      g.say(g.r.say || "");
      if (o.vs) g.vs(0, 0);
      save(); g.draw();
      if (o.onStart) o.onStart(g.s, g);
      if (scroll) g.showTop();
      return g;
    };
    g.redo = () => g.go(g.i, true);
    g.next = () => { if (g.i < N - 1) g.go(g.i + 1, true); return g; };
    g.restart = () => { g.res = g.res.map(() => null); return g.go(0, true); };
    const stars = n => "★".repeat(n) + "☆".repeat(Math.max(0, maxStar - n));
    g.win = r => {
      if (g.over) return g; r = r || {};
      g.over = true; g.won = true;
      const sN = clamp(r.stars == null ? maxStar : r.stars, 1, maxStar), prev = g.res[g.i];
      g.res[g.i] = { stars: Math.max(sN, prev ? prev.stars : 0), you: r.you, bot: r.bot };   // 星级记最好的一次
      if (r.you != null && r.bot != null) g.vs(r.you, r.bot);
      host.classList.add("won");
      g.say((o.noStars ? "" : '<span class="vl-game-stars" role="img" aria-label="' + esc(tr("gm.starsN", "{0} / {1} 星", sN, maxStar)) + '">' + stars(sN) + "</span> ") + (r.msg || esc(tr("gm.win", "这一局过了。"))));
      save(); g.draw();
      const last = g.i === N - 1;
      if (last && o.tryId) VL.tryDone(o.tryId);
      if (o.onWin) o.onWin(g.s, g, r);
      // 复盘：最后一局过关后写"意思"，不报一串数
      if (last && o.review) { const h = o.review(g.res, g); if (h) { g.reviewEl.innerHTML = '<h4 class="vl-game-rh">' + esc(tr("gm.review", "复盘")) + "</h4>" + h; g.reviewEl.hidden = false; } }
      fire(host, "vl:game-win", { id, i: g.i, stars: sN, last, all: g.res.every(Boolean) });
      return g;
    };
    g.lose = r => {
      if (g.over) return g; r = r || {};
      g.over = true; g.won = false;
      if (r.you != null && r.bot != null) g.vs(r.you, r.bot);
      host.classList.add("lost");
      g.say(r.msg || esc(tr("gm.lose", "这一局没过，按「重来这一局」再试。")));
      // 失败诊断：按读者实际做了什么说哪里出了问题，不靠反应速度
      const dg = r.diag || (o.diagnose ? o.diagnose(g.s, g) : "");
      if (dg) { g.diagEl.innerHTML = '<h4 class="vl-game-dh">' + esc(tr("gm.diag", "哪里出了问题")) + "</h4>" + dg; g.diagEl.hidden = false; }
      g.draw(); VL.shake(host);
      if (o.onLose) o.onLose(g.s, g, r);
      fire(host, "vl:game-lose", { id, i: g.i });
      return g;
    };
    // 读者的一次操作：章节在自己的按钮 / 键盘里调 g.act(input)
    g.act = input => {
      if (g.over || !g.s) return g;
      const res = o.move ? o.move(g.s, input, g) : null;
      if (g.over) return g;
      if (g.left != null) g.left = Math.max(0, g.left - (res && res.cost != null ? res.cost : 1));
      if (o.bot) o.bot(g.s, g);
      if (typeof res === "string") g.say(res); else if (res && res.msg != null) g.say(res.msg);
      const v = o.judge ? o.judge(g.s, g) : null;
      if (v && v.win) return g.win(v);
      if (v && v.lose) return g.lose(v);
      if (g.left === 0) return g.lose({ msg: (v && v.msg) || g.r.outMsg || esc(tr("gm.out", "步数用完了。")) + " " + esc(tr("gm.lose", "这一局没过，按「重来这一局」再试。")) });
      if (v && v.msg) g.say(v.msg);
      g.draw();
      return g;
    };
    const keyAct = key => { const k = o.keys[key], v = typeof k === "function" ? k(g.s, g) : k; if (v !== undefined && v !== null) g.act(v); };
    host.addEventListener("click", e => {
      const lv = e.target.closest("[data-gm-lv]"); if (lv && !lv.disabled) { g.go(+lv.dataset.gmLv, false); return; }
      const pk = e.target.closest("[data-gm-key]"); if (pk && o.keys) { keyAct(pk.dataset.gmKey); return; }
      const b = e.target.closest("[data-gm-a]"); if (!b || b.disabled) return;
      ({ redo: g.redo, next: g.next, all: g.restart })[b.dataset.gmA]();
    });
    // 键盘：keys = { ArrowLeft: 输入值或 (s, g) => 输入值 }。焦点在舞台里时生效，方向键不滚页面
    if (o.keys) {
      stage.tabIndex = 0; stage.setAttribute("role", "group");
      if (o.keysLabel) stage.setAttribute("aria-label", o.keysLabel);
      stage.addEventListener("keydown", e => {
        if (e.target.matches("textarea,select,input") || ((e.key === "Enter" || e.key === " ") && e.target.matches("button,a,summary"))) return;
        if (!(e.key in o.keys)) return;
        e.preventDefault(); keyAct(e.key);
      });
    }
    const first = g.res.findIndex(r => !r);
    g.go(first < 0 ? N - 1 : first, false);
    host._vlGame = g;
    return g;
  }

  /* =====================================================================
     G8 逐步演示：步进 + 慢放 + 可选自动播放（带旁白和进度条）
     .vl-steps > .vl-steps-stage（图里 [data-st="2"] 第 2 步起出现、"2-3" 只在 2–3 步、[data-st-hi="2 4"] 在这几步高亮）+ ol.vl-steps-list
     ===================================================================== */
  const inSpec = (spec, k) => String(spec).trim().split(/[\s,]+/).some(part => { const m = part.match(/^(\d+)(?:-(\d+))?$/); return m && (m[2] === undefined ? k >= +m[1] : k >= +m[1] && k <= +m[2]); });
  const exact = (spec, k) => String(spec).trim().split(/[\s,]+/).map(Number).includes(k);
  function steps(host, cfg) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlSteps) return host && host._vlSteps;
    cfg = cfg || {};
    const list = host.querySelector(".vl-steps-list"); if (!list) return null;
    const items = Array.from(list.children).filter(c => c.tagName === "LI"), n = items.length; if (!n) return null;
    const auto = cfg.auto != null ? !!cfg.auto : host.hasAttribute("data-auto");
    const DUR = +(cfg.dur || host.dataset.dur || 2600);
    host.setAttribute("role", "group"); host.setAttribute("aria-label", host.getAttribute("aria-label") || tr("st.group", "逐步演示（左右键换步）"));
    host.tabIndex = 0;
    const say = el("p", { class: "vl-steps-say", "aria-live": "polite" });
    const bar = el("div", { class: "vl-steps-bar" });
    bar.innerHTML = btn("vl-btn alt vl-st-first", "⏮", ' aria-label="' + esc(tr("st.first", "从头")) + '"') +
      btn("vl-btn alt vl-st-prev", VL.icon.left, ' aria-label="' + esc(tr("st.prev", "上一步")) + '"') +
      (auto ? btn("vl-btn vl-st-play", "▶", ' aria-label="' + esc(tr("st.play", "播放")) + '"') : "") +
      btn("vl-btn alt vl-st-next", VL.icon.right, ' aria-label="' + esc(tr("st.next", "下一步")) + '"') +
      '<div class="vl-st-prog" role="slider" tabindex="0" aria-label="' + esc(tr("st.prog", "第几步")) + '" aria-valuemin="1" aria-valuemax="' + n + '">' + items.map(() => "<i><b></b></i>").join("") + "</div>" +
      '<span class="vl-st-n"></span>' +
      (auto ? btn("vl-chip vl-st-slow", esc(tr("st.slow", "慢放")), ' aria-pressed="false"') : "");
    list.after(say, bar);
    const B = s => bar.querySelector(s), segs = Array.from(bar.querySelectorAll(".vl-st-prog > i")), playB = B(".vl-st-play"), slowB = B(".vl-st-slow");
    let i = 1, playing = false, slow = false, raf = 0, t0 = 0;
    const dur = () => DUR * (slow ? 2 : 1);
    const draw = t => { if (cfg.draw) { try { cfg.draw(i, t, host); } catch (e) { console.warn("[VL] 逐步演示的 draw 出错：", e); } } };
    function paint(fill) {
      items.forEach((li, j) => { li.classList.toggle("on", j === i - 1); });
      host.querySelectorAll("[data-st]").forEach(e => e.classList.toggle("vl-st-off", !inSpec(e.dataset.st, i)));
      host.querySelectorAll("[data-st-hi]").forEach(e => e.classList.toggle("vl-st-on", exact(e.dataset.stHi, i)));
      segs.forEach((s, j) => { s.classList.toggle("on", j < i); s.firstChild.style.width = j < i - 1 ? "100%" : j === i - 1 ? (fill == null ? 100 : fill * 100) + "%" : "0"; });
      B(".vl-st-n").textContent = tr("st.n", "{0} / {1}", i, n);
      const pg = B(".vl-st-prog"); pg.setAttribute("aria-valuenow", String(i)); pg.setAttribute("aria-valuetext", strip(items[i - 1].innerHTML));
      B(".vl-st-prev").disabled = i === 1; B(".vl-st-first").disabled = i === 1; B(".vl-st-next").disabled = i === n;
      say.innerHTML = '<b class="vl-steps-k">' + esc(tr("st.k", "第 {0} 步", i)) + "</b> " + items[i - 1].innerHTML;
      host.dataset.step = i;
    }
    function show(k, quiet) {
      i = clamp(k, 1, n); paint(); draw(1);
      host.style.setProperty("--vl-st-dur", (slow ? 700 : 350) + "ms");
      if (!quiet) fire(host, "vl:step", { i, n });
      if (cfg.onStep && !quiet) cfg.onStep(i, n);
    }
    function stop() { playing = false; cancelAnimationFrame(raf); if (playB) { playB.textContent = "▶"; playB.setAttribute("aria-label", tr("st.play", "播放")); } paint(); }
    // 自动播放：每一步 t 从 0 走到 1（cfg.draw 可按 t 画过程），走满就换下一步，到最后一步停
    function tick(now) {
      if (!playing) return;
      const t = clamp((now - t0) / dur(), 0, 1);
      paint(t); draw(Math.min(1, t / 0.6));
      if (t < 1) { raf = requestAnimationFrame(tick); return; }
      if (i < n) { show(i + 1); t0 = now; raf = requestAnimationFrame(tick); } else stop();
    }
    function play() {
      if (!motion()) { show(i + 1); return; }   // 动效关：不播过程，一下一步
      if (playing) return stop();
      if (i === n) show(1, true);
      playing = true; t0 = performance.now(); playB.textContent = "⏸"; playB.setAttribute("aria-label", tr("st.pause", "暂停"));
      fire(host, "vl:step", { i, n }); raf = requestAnimationFrame(tick);
    }
    const manual = k => { if (playing) stop(); show(k); };
    B(".vl-st-first").onclick = () => manual(1);
    B(".vl-st-prev").onclick = () => manual(i - 1);
    B(".vl-st-next").onclick = () => manual(i + 1);
    if (playB) playB.onclick = play;
    if (slowB) slowB.onclick = () => { slow = !slow; slowB.setAttribute("aria-pressed", String(slow)); slowB.classList.toggle("on", slow); host.classList.toggle("vl-st-slowmo", slow); host.style.setProperty("--vl-st-dur", (slow ? 700 : 350) + "ms"); if (playing) t0 = performance.now() - (performance.now() - t0) * (slow ? 2 : 0.5); };
    const pg = B(".vl-st-prog");
    pg.addEventListener("click", e => { const r = pg.getBoundingClientRect(); manual(Math.floor((e.clientX - r.left) / r.width * n) + 1); });
    host.addEventListener("keydown", e => {
      if (e.target.closest("input,textarea,select")) return;
      const m = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 1, End: n }[e.key];
      if (m !== undefined) { e.preventDefault(); manual(m); return; }
      if (e.key === " " && e.target === host && auto) { e.preventDefault(); play(); }
    });
    addEventListener("beforeprint", () => { stop(); host.classList.add("vl-st-print"); });
    addEventListener("afterprint", () => host.classList.remove("vl-st-print"));
    show(1, true);
    const api = { el: host, go: manual, play, stop, get step() { return i; }, n };
    host._vlSteps = api;
    return api;
  }

  /* =====================================================================
     G9 公式拆解：公式片段 [data-k] 和白话解释 li[data-k] 同色联动；颜色按 data-k="1…6" 取 --var-1…6（没有就用 --q1…6），全课统一
     悬停 / 聚焦预览，点击钉住（再点一次松开），其余变淡
     ===================================================================== */
  function anat(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlAnat) return host && host._vlAnat;
    const key = host.querySelector(".vl-anat-key"); if (!key) return null;
    const items = Array.from(key.querySelectorAll("li[data-k]"));
    // KaTeX 写法 \htmlClass{vl-k3}{J} 也认：把 .vl-kN 补成 data-k="N"
    host.querySelectorAll(".vl-anat-f [class*='vl-k']").forEach(p => { const m = String(p.className).match(/\bvl-k(\d)\b/); if (m && !p.dataset.k) p.dataset.k = m[1]; });
    const parts = Array.from(host.querySelectorAll(".vl-anat-f [data-k]"));
    key.setAttribute("aria-label", tr("an.key", "每一块是什么意思"));
    let pinned = null;
    const set = k => {
      host.classList.toggle("has-on", !!k);
      items.forEach(li => { li.classList.toggle("on", li.dataset.k === k); });
      parts.forEach(p => p.classList.toggle("on", p.dataset.k === k));
    };
    const pin = k => { pinned = pinned === k ? null : k; items.forEach(li => li.setAttribute("aria-pressed", String(li.dataset.k === pinned))); set(pinned); fire(host, "vl:anat", { k: pinned }); };
    items.forEach(li => {
      li.tabIndex = 0; li.setAttribute("role", "button"); li.setAttribute("aria-pressed", "false"); li.title = tr("an.pin", "点一下钉住，再点一下松开");
      li.addEventListener("mouseenter", () => set(li.dataset.k));
      li.addEventListener("focus", () => set(li.dataset.k));
      li.addEventListener("click", () => pin(li.dataset.k));
      li.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(li.dataset.k); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const j = clamp(items.indexOf(li) + (e.key === "ArrowDown" ? 1 : -1), 0, items.length - 1); items[j].focus(); }
        if (e.key === "Escape" && pinned) { pin(pinned); }
      });
    });
    parts.forEach(p => {
      p.classList.add("vl-anat-part");
      p.addEventListener("mouseenter", () => set(p.dataset.k));
      p.addEventListener("click", () => pin(p.dataset.k));
    });
    host.addEventListener("mouseleave", () => set(pinned));
    key.addEventListener("focusout", () => setTimeout(() => { if (!host.contains(doc.activeElement)) set(pinned); }));
    const api = { el: host, pin, set };
    host._vlAnat = api;
    return api;
  }

  /* =====================================================================
     E2 对比：data-mode="cols"（左右两栏，默认）| "toggle"（同一位置一键切换前后）| "slider"（拖分隔线揭开另一张）
     .vl-compare > .vl-cmp-a + .vl-cmp-b，各自 data-label；反面那一栏加 .bad（标签前加 ✗，另一栏 ✓）
     ===================================================================== */
  function compare(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlCmp) return host && host._vlCmp;
    const a = host.querySelector(":scope > .vl-cmp-a"), b = host.querySelector(":scope > .vl-cmp-b"); if (!a || !b) return null;
    const mode = host.dataset.mode || "cols";
    host.classList.add("vl-cmp-" + mode);
    const anyBad = a.classList.contains("bad") || b.classList.contains("bad");
    const lab = x => x.dataset.label || "";
    const mark = x => (anyBad ? '<span class="vl-cmp-mk" aria-hidden="true">' + (x.classList.contains("bad") ? tr("cm.bad", "✗ ") : tr("cm.good", "✓ ")) + "</span>" : "");
    let api = { el: host, mode };
    if (mode === "cols") {
      [a, b].forEach(x => { if (lab(x) && !x.querySelector(":scope > .vl-cmp-lab")) x.insertAdjacentHTML("afterbegin", '<p class="vl-cmp-lab">' + mark(x) + esc(lab(x)) + "</p>"); });
    } else if (mode === "toggle") {
      const seg = el("div", { class: "vl-cmp-seg", role: "group", "aria-label": tr("cm.toggle", "切换看哪一边") });
      seg.innerHTML = [a, b].map((x, k) => btn("vl-chip vl-cmp-sw", mark(x) + esc(lab(x) || (k ? "B" : "A")), ' data-side="' + k + '" aria-pressed="false"')).join("");
      const view = el("div", { class: "vl-cmp-view" });
      host.prepend(seg); host.appendChild(view); view.append(a, b);
      let side = +(host.dataset.start || 0) ? 1 : 0;
      const sws = Array.from(seg.children);
      const set = (k, ev) => {
        side = k ? 1 : 0;
        [a, b].forEach((x, j) => { x.classList.toggle("on", j === side); x.setAttribute("aria-hidden", String(j !== side)); x.inert = j !== side; });
        sws.forEach((s, j) => { s.setAttribute("aria-pressed", String(j === side)); s.classList.toggle("on", j === side); });
        if (ev) fire(host, "vl:compare", { side });
      };
      seg.addEventListener("click", e => { const s = e.target.closest(".vl-cmp-sw"); if (s) set(+s.dataset.side, true); });
      seg.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); set(e.key === "ArrowRight" ? 1 : 0, true); sws[side].focus(); } });
      set(side);
      api = Object.assign(api, { set, get side() { return side; } });
    } else {
      const hd = el("div", { class: "vl-cmp-hd" });
      hd.innerHTML = '<span class="vl-cmp-l">' + mark(a) + esc(lab(a)) + '</span><span class="vl-cmp-tip">' + esc(tr("cm.drag", "拖动中间的分隔线")) + '</span><span class="vl-cmp-r">' + mark(b) + esc(lab(b)) + "</span>";
      const view = el("div", { class: "vl-cmp-view" });
      const h = el("div", { class: "vl-cmp-h", tabindex: "0", role: "slider", "aria-label": tr("cm.slider", "分隔线：左边是{0}，右边是{1}", lab(a), lab(b)), "aria-valuemin": "0", "aria-valuemax": "100" }, "<i></i>");
      host.prepend(hd); host.appendChild(view); view.append(a, b, h);
      let pos = 50;
      const set = (v, ev) => { pos = clamp(v, 0, 100); view.style.setProperty("--pos", pos + "%"); h.setAttribute("aria-valuenow", String(Math.round(pos))); if (ev) fire(host, "vl:compare", { pos }); };
      let drag = false;
      const at = e => { const r = view.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100, true); };
      view.addEventListener("pointerdown", e => { drag = true; try { view.setPointerCapture(e.pointerId); } catch (er) {} at(e); });
      view.addEventListener("pointermove", e => { if (drag) at(e); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(t => view.addEventListener(t, () => { drag = false; }));
      h.addEventListener("keydown", e => {
        const k = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5, PageDown: -20, PageUp: 20, Home: -100, End: 100 }[e.key];
        if (k !== undefined) { e.preventDefault(); set(pos + (e.shiftKey ? k * 3 : k), true); }
      });
      set(host.dataset.start !== undefined ? +host.dataset.start : 50);
      // 帮助理解：分隔线第一次出现时晃一下，提示能拖（只在全开档，且只一次）
      if (motion() && root().classList.contains("vl-fx-full")) once(host, () => { h.classList.add("vl-cmp-wiggle"); setTimeout(() => h.classList.remove("vl-cmp-wiggle"), 1300); }, 0.6);
      api = Object.assign(api, { set, get pos() { return pos; } });
    }
    host._vlCmp = api;
    return api;
  }
  const root = () => doc.documentElement;

  /* =====================================================================
     M1 补：翻牌（单张点翻 / 一键全部翻开）。.vl-flip > .vl-flip-c > .vl-flip-f + .vl-flip-b
     ===================================================================== */
  function flip(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlFlip) return host && host._vlFlip;
    const cards = Array.from(host.children).filter(c => c.classList.contains("vl-flip-c"));
    if (!cards.length) return null;
    host.setAttribute("role", "group"); if (!host.getAttribute("aria-label")) host.setAttribute("aria-label", tr("fl.group", "翻牌"));
    let fired = false;
    const allBtn = cards.length > 1 && host.dataset.all !== "false" ? el("button", { type: "button", class: "vl-btn alt vl-flip-all" }, esc(tr("fl.all", "全部翻开"))) : null;
    const sync = () => {
      if (allBtn) allBtn.textContent = cards.every(c => c.classList.contains("flipped")) ? tr("fl.none", "全部合上") : tr("fl.all", "全部翻开");
      if (!fired && cards.every(c => c.dataset.seen)) { fired = true; fire(host, "vl:flip-all", { n: cards.length }); }
    };
    const setC = (c, on) => {
      const fr = c.querySelector(".vl-flip-f"), bk = c.querySelector(".vl-flip-b");
      c.classList.toggle("flipped", on); if (on) c.dataset.seen = "1";
      c.setAttribute("aria-pressed", String(on)); fr.setAttribute("aria-hidden", String(on)); bk.setAttribute("aria-hidden", String(!on));
    };
    cards.forEach(c => {
      const fr = c.querySelector(".vl-flip-f"), bk = c.querySelector(".vl-flip-b"); if (!fr || !bk) return;
      const inner = el("div", { class: "vl-flip-in" }); inner.append(fr, bk); c.appendChild(inner);
      c.tabIndex = 0; c.setAttribute("role", "button");
      if (!c.getAttribute("aria-label")) c.setAttribute("aria-label", tr("fl.card", "翻牌") + (LANG === "en" ? ": " : "：") + strip(fr.innerHTML).slice(0, 40));
      setC(c, false);
      const tog = () => { setC(c, !c.classList.contains("flipped")); sync(); fire(host, "vl:flip", { i: cards.indexOf(c), on: c.classList.contains("flipped") }); };
      c.addEventListener("click", e => { if (e.target.closest("a,button")) return; tog(); });
      c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tog(); } });
    });
    if (allBtn) {
      host.after(allBtn);
      allBtn.onclick = () => { const on = !cards.every(c => c.classList.contains("flipped")); cards.forEach(c => setC(c, on)); sync(); };
    }
    addEventListener("beforeprint", () => host.classList.add("vl-flip-print"));
    addEventListener("afterprint", () => host.classList.remove("vl-flip-print"));
    const api = { el: host, all(on) { cards.forEach(c => setC(c, on !== false)); sync(); } };
    host._vlFlip = api;
    return api;
  }

  /* =====================================================================
     M2 热区图：图上 [data-hot] 是可点区域（SVG 的 g / path，或图片上的 button.vl-hot-pin），说明写在 data-info 或 .vl-hot-text[data-for]
     ===================================================================== */
  function hot(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlHot) return host && host._vlHot;
    const hs = Array.from(host.querySelectorAll("[data-hot]")); if (!hs.length) return null;
    let info = host.querySelector(".vl-hot-info");
    if (!info) { info = el("div", { class: "vl-hot-info" }); const cap = host.querySelector(":scope > figcaption"); if (cap) cap.before(info); else host.appendChild(info); }
    info.setAttribute("aria-live", "polite");
    const hint = host.dataset.hint || tr("hot.hint", "先点图上的一块。");
    const cnt = el("span", { class: "vl-hot-n" });
    info.innerHTML = '<p class="vl-hot-hint">' + esc(hint) + "</p>";
    info.before(cnt);
    const texts = {}; host.querySelectorAll(".vl-hot-text[data-for]").forEach(t => { texts[t.dataset.for] = t.innerHTML; t.hidden = true; });
    const seen = new Set(); let cur = null, fired = false;
    const name = h => h.dataset.name || h.getAttribute("aria-label") || h.dataset.hot;
    const upd = () => { cnt.textContent = tr("hot.seen", "已看 {0} / {1}", seen.size, hs.length); };
    function pick(h) {
      cur = h; seen.add(h.dataset.hot);
      hs.forEach(x => { const on = x === h; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); if (seen.has(x.dataset.hot)) x.classList.add("seen"); });
      host.classList.add("has-on");
      info.innerHTML = '<p class="vl-hot-name"><b>' + esc(name(h)) + "</b></p>" + (texts[h.dataset.hot] || h.dataset.info || "");
      upd(); mountIllus(info);
      fire(host, "vl:hot", { key: h.dataset.hot });
      if (!fired && seen.size === hs.length) { fired = true; fire(host, "vl:hot-all", { n: hs.length }); }
    }
    hs.forEach((h, k) => {
      if (h.tagName !== "BUTTON") { h.setAttribute("tabindex", "0"); h.setAttribute("role", "button"); }
      if (!h.getAttribute("aria-label")) h.setAttribute("aria-label", name(h));
      h.setAttribute("aria-pressed", "false");
      h.classList.add("vl-hot-a");
      h.addEventListener("click", () => pick(h));
      h.addEventListener("keydown", e => {
        if ((e.key === "Enter" || e.key === " ") && h.tagName !== "BUTTON") { e.preventDefault(); pick(h); }
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) { e.preventDefault(); hs[(k + d + hs.length) % hs.length].focus(); }
      });
    });
    host.setAttribute("role", host.getAttribute("role") || "group");
    if (!host.getAttribute("aria-label")) host.setAttribute("aria-label", tr("hot.group", "可以点的图"));
    upd();
    const api = { el: host, pick: key => { const h = hs.find(x => x.dataset.hot === key); if (h) pick(h); }, get current() { return cur && cur.dataset.hot; } };
    host._vlHot = api;
    return api;
  }

  /* =====================================================================
     T6 漫画分镜：.vl-comic > .vl-panel（.vl-bub 短气泡 + 插画位 + p.vl-cap 旁白）×2–4
     帮助理解类动效：滚到时逐格亮起；动效关就全亮
     ===================================================================== */
  function comic(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlComic) return host && host._vlComic;
    const ps = Array.from(host.children).filter(c => c.classList.contains("vl-panel"));
    if (!ps.length) return null;
    if (ps.length > 4) console.warn("[VL] 漫画分镜超过 4 格，考虑拆成两组：", host);
    host.style.setProperty("--n", String(ps.length));
    host.setAttribute("role", "group");
    if (!host.getAttribute("aria-label")) console.warn("[VL] 漫画分镜缺 aria-label（一句话概括整组）：", host);
    ps.forEach((p, i) => {
      p.style.setProperty("--i", String(i));
      const cap = p.querySelector(".vl-cap");
      if (cap && !cap.querySelector(".vl-pn")) cap.insertAdjacentHTML("afterbegin", '<span class="vl-pn" aria-hidden="true">' + (i + 1) + '</span><span class="vl-sr">' + esc(tr("cc.n", "第 {0} 格", i + 1)) + (LANG === "en" ? ": " : "：") + "</span>");
      p.querySelectorAll(".vl-bub").forEach(b => { if (b.dataset.x) b.style.setProperty("--tail", b.dataset.x + "%"); });
    });
    // 只有在视口下方、而且允许动效时才"备好"（先变淡），滚到再逐格亮起；否则直接静态全亮
    if (motion() && host.getBoundingClientRect().top > innerHeight) {
      host.classList.add("vl-armed");
      once(host, () => { host.classList.remove("vl-armed"); host.classList.add("vl-play"); }, 0.3);
    }
    host._vlComic = { el: host };
    return host._vlComic;
  }

  /* =====================================================================
     K5 立场卡 + 投票：.vl-philo > .vl-philo-slide[data-t]；第一张放 .vl-vote[data-options="会|不会|看情况"]
     一次看一张（页签带立场名、◀▶、←→、横滑）；翻到立场页时回显"你选的是……"；打印全展开
     ===================================================================== */
  function vote(host, cfg) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlVote) return host && host._vlVote;
    cfg = cfg || {};
    const opts = cfg.options || String(host.dataset.options || "").split("|").map(s => s.trim()).filter(Boolean);
    if (!opts.length) return null;
    const key = "vote-" + BASE + "-" + (cfg.key || host.dataset.key || (host.closest(".vl-philo") && host.closest(".vl-philo").dataset.key) || host.id || "v");
    host.setAttribute("role", "group"); host.setAttribute("aria-label", host.getAttribute("aria-label") || tr("vt.group", "你的看法"));
    host.innerHTML = '<div class="vl-vote-opts">' + opts.map((o, i) => btn("vl-chip vl-vote-opt", esc(o), ' data-i="' + i + '" aria-pressed="false"')).join("") + '</div><p class="vl-vote-st" aria-live="polite"></p>';
    const bs = Array.from(host.querySelectorAll(".vl-vote-opt")), st = host.querySelector(".vl-vote-st");
    let pick = null; const sv = store.get(key); if (sv != null && opts[+sv] != null) pick = +sv;
    const listeners = [];
    const paint = quiet => {
      bs.forEach((b, i) => { b.setAttribute("aria-pressed", String(i === pick)); b.classList.toggle("on", i === pick); });
      st.textContent = pick == null ? "" : tr("vt.saved", "记下了：{0}。随时可以改。", opts[pick]);
      if (!quiet) listeners.forEach(f => f(pick));
    };
    bs.forEach((b, i) => b.addEventListener("click", () => { pick = i; store.set(key, String(i)); paint(); fire(host, "vl:vote", { key, i, option: opts[i] }); }));
    paint(true);
    const api = { el: host, options: opts, get pick() { return pick; }, get option() { return pick == null ? null : opts[pick]; }, on(f) { listeners.push(f); } };
    host._vlVote = api;
    return api;
  }
  let philoN = 0;
  function philo(host) {
    if (typeof host === "string") host = doc.querySelector(host);
    if (!host || host._vlPhilo) return host && host._vlPhilo;
    const slides = Array.from(host.children).filter(c => c.classList.contains("vl-philo-slide"));
    if (!slides.length) return null;
    const k0 = ++philoN;
    const vEl = slides[0].querySelector(".vl-vote");
    const V = vEl ? vote(vEl, { key: host.dataset.key || host.id || "philo" + k0 }) : null;
    const tabs = el("div", { class: "vl-philo-tabs", role: "tablist", "aria-label": tr("ph.tabs", "各张") });
    const stage = el("div", { class: "vl-philo-stage" });
    const nav = el("div", { class: "vl-philo-nav" });
    nav.innerHTML = btn("vl-btn alt vl-philo-prev", VL.icon.left + "<span>" + esc(tr("ph.prev", "上一张")) + "</span>") + '<span class="vl-philo-n" aria-live="polite"></span>' + btn("vl-btn vl-philo-next", "<span>" + esc(tr("ph.next", "下一张")) + "</span>" + VL.icon.right);
    host.prepend(tabs); host.appendChild(stage); slides.forEach(s => stage.appendChild(s)); host.appendChild(nav);
    const bt = slides.map((s, k) => {
      s.id = s.id || "vl-ph" + k0 + "-" + k; s.setAttribute("role", "tabpanel");
      if (k > 0 && V && !s.querySelector(".vl-philo-you")) s.insertAdjacentHTML("afterbegin", '<p class="vl-philo-you"></p>');
      const b = el("button", { type: "button", class: "vl-philo-tab", role: "tab", id: s.id + "-tab", "aria-controls": s.id, "aria-selected": "false", tabindex: "-1" }, esc(s.dataset.t || String(k + 1)));
      s.setAttribute("aria-labelledby", b.id);
      b.addEventListener("click", () => show(k, true)); tabs.appendChild(b); return b;
    });
    const youTxt = () => (V && V.option != null ? tr("ph.you", "你选的是：{0}", V.option) : tr("ph.notyet", "你还没表态：第一张可以投一票。"));
    const syncYou = () => host.querySelectorAll(".vl-philo-you").forEach(p => { p.textContent = youTxt(); p.classList.toggle("none", !(V && V.option != null)); });
    if (V) V.on(syncYou);
    let at = -1;
    function show(k, focusTab) {
      k = clamp(k, 0, slides.length - 1); if (k === at) return; at = k;
      slides.forEach((s, j) => { s.hidden = j !== at; if (j === at && motion()) { s.classList.remove("vl-enter"); void s.offsetWidth; s.classList.add("vl-enter"); } });
      bt.forEach((b, j) => { b.classList.toggle("on", j === at); b.setAttribute("aria-selected", String(j === at)); b.tabIndex = j === at ? 0 : -1; });
      tabs.scrollLeft = bt[at].offsetLeft - (tabs.clientWidth - bt[at].offsetWidth) / 2;
      if (focusTab) bt[at].focus({ preventScroll: true });
      nav.querySelector(".vl-philo-prev").disabled = at === 0; nav.querySelector(".vl-philo-next").disabled = at === slides.length - 1;
      nav.querySelector(".vl-philo-n").textContent = (at + 1) + " / " + slides.length;
      syncYou();
      fire(host, "vl:philo", { i: at });
    }
    nav.querySelector(".vl-philo-prev").onclick = () => show(at - 1);
    nav.querySelector(".vl-philo-next").onclick = () => show(at + 1);
    tabs.addEventListener("keydown", e => { const m = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: slides.length - 1 }[e.key]; if (m !== undefined) { e.preventDefault(); show(m, true); } });
    let x0 = null, y0 = 0;
    stage.addEventListener("pointerdown", e => { if (e.target.closest("button,input,textarea,a,select")) return; x0 = e.clientX; y0 = e.clientY; });
    stage.addEventListener("pointerup", e => { if (x0 !== null) { const dx = e.clientX - x0, dy = e.clientY - y0; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(at + (dx < 0 ? 1 : -1)); } x0 = null; });
    stage.addEventListener("pointercancel", () => { x0 = null; });
    addEventListener("beforeprint", () => slides.forEach(s => { s.hidden = false; }));
    addEventListener("afterprint", () => { const k = at; at = -1; show(k); });
    show(0);
    const api = { el: host, go: show, vote: V };
    host._vlPhilo = api;
    return api;
  }

  /* ---------- 声明式写法自动装上；动态插入的内容调 VL.interact(根节点)，VL.enhance 也会顺带调它 ---------- */
  function interact(scope) {
    scope = scope || doc.querySelector("main") || doc.body;
    $$(".vl-steps", scope).forEach(e => steps(e));
    $$(".vl-anat", scope).forEach(e => anat(e));
    $$(".vl-compare", scope).forEach(e => compare(e));
    $$(".vl-flip", scope).forEach(e => flip(e));
    $$(".vl-hot", scope).forEach(e => hot(e));
    $$(".vl-comic", scope).forEach(e => comic(e));
    $$(".vl-philo", scope).forEach(e => philo(e));
    $$(".vl-vote", scope).forEach(e => { if (!e.closest(".vl-philo")) vote(e); });
  }
  // 动手题和综合关等页面脚本跑完再装：页面脚本可以先调 VL.task(el, {带函数的配置})，JSON 写法的留到这里
  function interactLate(scope) {
    scope = scope || doc.querySelector("main") || doc.body;
    $$(".vl-task", scope).forEach(e => { if (!e._vlTask && e.querySelector(':scope > script[type="application/json"]')) task(e); });
    $$(".vl-review", scope).forEach(e => { if (!e._vlTask && e.querySelector(':scope > script[type="application/json"]')) review(e); });
  }
  /* 选格子 VL.cells(容器, {n, cols, label, onPick})：一排排可点的格子（猜数、选座位、日历、棋盘）。
     n 个格子，cols 列；label(i) 格子上的字（默认 i+1）；onPick(i, 格子) 点击或回车时调用。
     键盘：方向键在格子间走（只有一个格子可 Tab 进入），回车 / 空格选中。
     返回 { cells, get(i), mark(i, 类, 开关), reset() }；状态类：is-out 划掉、is-last 刚选、is-hit 命中、is-sel 选中，外观归皮肤。 */
  function cells(root, o) {
    o = o || {}; const n = o.n || 0, cols = o.cols || Math.ceil(Math.sqrt(n)) || 1, lab = o.label || (i => String(i + 1));
    root.classList.add("vl-cells"); root.style.setProperty("--vl-cols", cols); root.setAttribute("role", "grid"); root.innerHTML = "";
    const list = [];
    for (let i = 0; i < n; i++) {
      const b = doc.createElement("button"); b.type = "button"; b.className = "vl-cell"; b.dataset.i = i;
      b.textContent = lab(i); b.tabIndex = i === 0 ? 0 : -1; root.appendChild(b); list.push(b);
    }
    const focus = j => { list.forEach(c => { c.tabIndex = -1; }); list[j].tabIndex = 0; list[j].focus(); };
    root.addEventListener("click", e => { const c = e.target.closest(".vl-cell"); if (!c || c.disabled || !root.contains(c)) return; if (o.onPick) o.onPick(+c.dataset.i, c); });
    root.addEventListener("keydown", e => {
      const c = e.target.closest(".vl-cell"); if (!c) return;
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -1e9, End: 1e9 }[e.key]; if (d == null) return;
      e.preventDefault(); focus(Math.max(0, Math.min(n - 1, +c.dataset.i + d)));
    });
    const api = {
      cells: list, get: i => list[i],
      mark(i, cls, on) { const c = list[i]; if (c) c.classList.toggle(cls, on !== false); return api; },
      reset() { list.forEach(c => { c.className = "vl-cell"; c.disabled = false; }); return api; },
    };
    root._vlCells = api; return api;
  }
  interact();
  VL.ready(() => interactLate());
  const oldEnhance = VL.enhance;
  Object.assign(VL, {
    task, review, game, steps, anat, compare, flip, hot, comic, vote, philo, cells,
    interact(scope) { interact(scope); interactLate(scope); },
    enhance(scope) { if (oldEnhance) oldEnhance(scope); interact(scope); interactLate(scope); },
    tr,
  });
})();
