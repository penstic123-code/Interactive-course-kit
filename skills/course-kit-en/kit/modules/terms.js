/* course-kit · modules/terms.js —— 术语表 VL.glossary 与闪卡 VL.flashcards。
   数据：VL.concepts.entries()（概念 items + 普通术语 terms，同一份 VL_CONCEPTS）。放在 vl.js 之后。
   闪卡：莱特纳 4 盒。答对进下一盒、答错回第一盒；盒子越靠后隔得越久（当天 / 1 天 / 3 天 / 7 天）。
   只出"已读懂"的章（测验全对）的词；读者可以勾选"也练还没读懂的章"。存档 <id>-flash，中英文页共用。 */
(function () {
  "use strict";
  const VL = window.VL, doc = document;
  if (!VL || !VL.concepts) { console.warn("[VL] terms.js 需要先加载 vl.js 和 modules/vl-concepts.js"); return; }
  const K = VL.concepts, esc = VL.esc, T = K.T, EN = K.lang === "en";

  /* ---------- 排序与首字母：中文按拼音（Intl 拼音排序 + 分界字），英文按字母 ---------- */
  let coll = null;
  try { coll = new Intl.Collator(EN ? "en" : "zh-Hans-CN-u-co-pinyin", { sensitivity: "base" }); } catch (e) { coll = { compare: (a, b) => (a < b ? -1 : a > b ? 1 : 0) }; }
  const BOUND = "阿八嚓哒妸发旮哈讥咔垃妈拏噢妑七呥仨他屲夕丫帀", LET = "ABCDEFGHJKLMNOPQRSTWXYZ";
  function initial(s) {
    const ch = String(s || "").trim().charAt(0);
    if (!ch) return "#";
    if (/[a-z]/i.test(ch)) return ch.toUpperCase();
    if (/[0-9]/.test(ch) || EN) return "#";
    let k = -1;
    for (let i = 0; i < BOUND.length; i++) if (coll.compare(BOUND[i], ch) <= 0) k = i; else break;
    return k < 0 ? "#" : LET[k];
  }
  const label = c => K.name(c);
  const defOf = c => K.pick(c, "def") || K.pick(c, "plain");

  /* ---------- 术语表 ---------- */
  function glossary(target, opts) {
    if (typeof target === "string") target = doc.querySelector(target);
    if (!target) return null;
    opts = opts || {};
    const list = K.entries().filter(c => defOf(c)).slice().sort((a, b) => coll.compare(label(a), label(b)));
    const groups = [];
    list.forEach(c => { const L = initial(label(c)); let g = groups[groups.length - 1]; if (!g || g.L !== L) groups.push(g = { L, items: [] }); g.items.push(c); });
    const wrap = doc.createElement("div"); wrap.className = "vl-gloss";
    wrap.innerHTML =
      '<div class="vl-gloss-tools"><label class="vl-gloss-q"><span>' + esc(T("gl.search", "查词", "Search")) + '</span><input type="search" autocomplete="off" placeholder="' + esc(T("gl.ph", "输入中文、英文或别名", "Type a word or its other names")) + '"></label>' +
      '<p class="vl-gloss-n" aria-live="polite"></p></div>' +
      '<nav class="vl-gloss-az" aria-label="' + esc(T("gl.az", "按首字母跳转", "Jump to letter")) + '">' + groups.map(g => '<a href="#gl-' + g.L + '">' + g.L + "</a>").join("") + "</nav>" +
      groups.map(g => '<section class="vl-gloss-grp" id="gl-' + g.L + '"><h3 class="vl-gloss-L">' + g.L + '</h3><dl class="vl-gloss-dl">' + g.items.map(c => {
        const href = c.ch ? K.chHref(c.ch, c.kind === "term" ? "" : c.id) + (c.kind === "term" && c.anchor && K.chHref(c.ch) ? "#" + c.anchor : "") : "";
        const sec = K.other(c);
        return '<div class="vl-gloss-it' + (c.kind !== "term" ? " is-concept" : "") + '" id="gl-' + esc(c.id) + '" data-id="' + esc(c.id) + '"><dt><dfn>' + esc(label(c)) + "</dfn>" + (sec ? '<span class="vl-gloss-en">' + esc(sec) + "</span>" : "") +
          (c.kind !== "term" ? '<a class="vl-gloss-tag" href="' + esc(K.mapHref(c.id)) + '">' + esc(c.kind === "principle" ? T("g.principle", "世界观原理", "Big idea") : T("gl.concept", "核心概念", "Key concept")) + "</a>" : "") + "</dt>" +
          "<dd>" + (K.pick(c, "plain") && K.pick(c, "def") ? '<span class="vl-gloss-plain">' + esc(K.pick(c, "plain")) + "</span>" : "") + esc(defOf(c)) +
          (c.ch ? " " + (href ? '<a class="vl-gloss-ch" href="' + esc(href) + '">' + esc(T("gl.first", "第 {0} 章", "Ch. {0}", c.ch)) + "</a>" : '<span class="vl-gloss-ch off">' + esc(T("gl.first", "第 {0} 章", "Ch. {0}", c.ch)) + "</span>") : "") + "</dd></div>";
      }).join("") + "</dl></section>").join("") +
      '<p class="vl-gloss-none" hidden>' + esc(T("gl.none", "没找到。换个说法试试？", "Nothing found. Try another word?")) + "</p>";
    target.appendChild(wrap);
    const q = wrap.querySelector("input"), n = wrap.querySelector(".vl-gloss-n"), none = wrap.querySelector(".vl-gloss-none");
    const its = [...wrap.querySelectorAll(".vl-gloss-it")];
    const run = () => {
      const v = q.value.trim(); let k = 0;
      its.forEach(it => { const ok = K.match(K.get(it.dataset.id) || K.entries().find(c => c.id === it.dataset.id), v); it.hidden = !ok; if (ok) k++; });
      wrap.querySelectorAll(".vl-gloss-grp").forEach(s => (s.hidden = !s.querySelector(".vl-gloss-it:not([hidden])")));
      n.textContent = v ? T("gl.found", "找到 {0} 条", "{0} found", k) : T("gl.total", "共 {0} 条", "{0} entries", its.length);
      none.hidden = k > 0;
    };
    q.addEventListener("input", run); run();
    // glossary.html#词条id：滚到并高亮
    const h = decodeURIComponent((location.hash || "").slice(4));
    if (/^#gl-/.test(location.hash)) { const it = doc.getElementById("gl-" + h); if (it && it.classList.contains("vl-gloss-it")) it.classList.add("is-on"); }
    return { el: wrap, search: v => { q.value = v; run(); } };
  }

  /* ---------- 闪卡：莱特纳 4 盒 ---------- */
  const DAY = 864e5, GAP = [0, 0, 1, 3, 7];   // 盒号 → 隔几天再出
  function flashcards(target, opts) {
    if (typeof target === "string") target = doc.querySelector(target);
    if (!target) return null;
    opts = Object.assign({ perRound: 10 }, opts || {});
    const now = () => (opts.now ? opts.now() : Date.now());
    const st = () => VL.store.json("flash", {});
    const save = s => VL.store.setJSON("flash", s);
    const wrap = doc.createElement("div"); wrap.className = "vl-fc";
    wrap.innerHTML =
      '<div class="vl-fc-boxes" role="list" aria-label="' + esc(T("fc.boxes", "四个盒子里各有几张", "Cards in each box")) + '">' + [1, 2, 3, 4].map(b => '<div class="vl-fc-box" role="listitem" data-b="' + b + '"><b>0</b><span>' + esc(T("fc.box", "第 {0} 盒", "Box {0}", b)) + "</span><span>" + esc(T("fc.gap" + b, ["", "每次", "隔 1 天", "隔 3 天", "隔 7 天"][b], ["", "every time", "after 1 day", "after 3 days", "after 7 days"][b])) + "</span></div>").join("") + "</div>" +
      '<label class="vl-fc-all"><input type="checkbox"> ' + esc(T("fc.all", "也练还没读懂的章", "Include chapters you haven't finished")) + "</label>" +
      '<div class="vl-fc-stage"><button type="button" class="vl-fc-card" aria-live="polite"><span class="vl-fc-face vl-fc-front"></span><span class="vl-fc-face vl-fc-back"></span></button></div>' +
      '<p class="vl-fc-hint">' + esc(T("fc.hint", "先自己想答案，再翻面对一对。空格翻面；← 还没记住，→ 记住了。", "Think of the answer first, then flip. Space flips; ← not yet, → got it.")) + "</p>" +
      '<div class="vl-fc-acts"><button type="button" class="vl-btn alt vl-fc-no" disabled>← ' + esc(T("fc.no", "还没记住", "Not yet")) + '</button><button type="button" class="vl-btn vl-fc-flip">' + esc(T("fc.flip", "翻面", "Flip")) + '</button><button type="button" class="vl-btn vl-fc-yes" disabled>' + esc(T("fc.yes", "记住了", "Got it")) + " →</button></div>" +
      '<p class="vl-fc-st" aria-live="polite"></p>' +
      '<div class="vl-fc-end" hidden></div>' +
      '<p class="vl-fc-foot"><button type="button" class="vl-btn alt vl-fc-reset">' + esc(T("fc.reset", "清空闪卡记录", "Clear flashcard record")) + "</button></p>";
    target.appendChild(wrap);
    const $ = s => wrap.querySelector(s);
    const card = $(".vl-fc-card"), front = $(".vl-fc-front"), back = $(".vl-fc-back"), stEl = $(".vl-fc-st"), end = $(".vl-fc-end"), all = $(".vl-fc-all input");
    const no = $(".vl-fc-no"), yes = $(".vl-fc-yes"), flipB = $(".vl-fc-flip");
    let deck = [], queue = [], at = 0, flipped = false, tally = { yes: 0, no: 0 };
    const pool = () => {
      const done = VL.Progress.get();
      return K.entries().filter(c => defOf(c) && (all.checked || done[c.ch]));
    };
    function counts() {
      const s = st(), ps = pool();
      [1, 2, 3, 4].forEach(b => { $('.vl-fc-box[data-b="' + b + '"] b').textContent = ps.filter(c => ((s[c.id] && s[c.id].b) || 1) === b).length; });
    }
    function round(onlyIds) {
      const s = st(), t = now(), ps = pool();
      deck = ps.filter(c => onlyIds ? onlyIds.includes(c.id) : (!s[c.id] || s[c.id].due <= t));
      const r = VL.rng(ps.length * 31 + Math.floor(t / DAY));
      deck.sort((a, b) => ((s[a.id] || {}).b || 1) - ((s[b.id] || {}).b || 1) || r() - 0.5);
      queue = deck.slice(0, opts.perRound); at = 0; tally = { yes: 0, no: 0 };
      end.hidden = true; $(".vl-fc-stage").hidden = false; $(".vl-fc-acts").hidden = false; $(".vl-fc-hint").hidden = false;
      counts(); show();
    }
    function show() {
      flipped = false; card.classList.remove("flipped"); no.disabled = yes.disabled = true; flipB.disabled = false;
      const c = queue[at];
      if (!c) return finish();
      front.innerHTML = '<b class="vl-fc-term">' + esc(label(c)) + "</b>" + (K.other(c) ? '<small class="vl-fc-en">' + esc(K.other(c)) + "</small>" : "") + '<small class="vl-fc-q">' + esc(T("fc.q", "它是什么意思？", "What does it mean?")) + "</small>";
      back.innerHTML = (c.illus && VL.illus ? '<span class="vl-fc-img" data-illus="' + esc(c.illus) + '"></span>' : "") + '<span class="vl-fc-txt">' + (K.pick(c, "plain") && K.pick(c, "def") ? "<b>" + esc(K.pick(c, "plain")) + "</b>" : "") + esc(defOf(c)) + "</span>" +
        (c.ch ? '<small class="vl-fc-from">' + esc(T("gl.first", "第 {0} 章", "Ch. {0}", c.ch)) + " · " + esc(K.chName(c.ch)) + "</small>" : "");
      if (VL.illus) VL.illus.mount(back);
      card.setAttribute("aria-label", T("fc.front", "正面：{0}。按回车翻面。", "Front: {0}. Press Enter to flip.", label(c)));
      stEl.textContent = T("fc.n", "第 {0} / {1} 张", "Card {0} of {1}", at + 1, queue.length);
    }
    function flip() {
      if (!queue[at]) return;
      flipped = !flipped; card.classList.toggle("flipped", flipped);
      no.disabled = yes.disabled = !flipped;
      card.setAttribute("aria-label", flipped ? T("fc.backA", "背面：{0}", "Back: {0}", back.textContent.trim()) : T("fc.front", "正面：{0}。按回车翻面。", "Front: {0}. Press Enter to flip.", label(queue[at])));
    }
    function judge(ok) {
      const c = queue[at]; if (!c || !flipped) return;
      const s = st(), cur = (s[c.id] && s[c.id].b) || 1, b = ok ? Math.min(4, cur + 1) : 1;
      s[c.id] = { b, due: now() + GAP[b] * DAY }; save(s);
      tally[ok ? "yes" : "no"]++;
      if (!ok) queue.push(c);                 // 没记住的这一轮末尾再来一次
      at++; counts(); show();
      if (VL.sound) VL.sound.play(ok ? "ok" : "flip");
    }
    function finish() {
      $(".vl-fc-stage").hidden = true; $(".vl-fc-acts").hidden = true; $(".vl-fc-hint").hidden = true; stEl.textContent = "";
      const s = st(), t = now(), ps = pool();
      const tomorrow = ps.filter(c => s[c.id] && s[c.id].due <= t + DAY && s[c.id].due > t).length;
      const empty = !deck.length;
      end.hidden = false;
      end.innerHTML = empty
        ? "<p><b>" + esc(ps.length ? T("fc.none", "今天要复习的卡片都复习过了。", "Nothing due today.") : T("fc.locked", "读懂一章（测验全部答对）之后，这一章的词会出现在这里。", "Finish a chapter's quiz and its words show up here.")) + "</b></p>" +
          (ps.length ? "<p>" + esc(T("fc.tom", "明天到期 {0} 张。", "{0} due tomorrow.", tomorrow)) + "</p>" : "") +
          '<button type="button" class="vl-btn alt vl-fc-again">' + esc(T("fc.extra", "不管到期，全部练一轮", "Practise all of them anyway")) + "</button>"
        : "<p><b>" + esc(T("fc.done", "这一轮练完了：记住 {0} 次，还没记住 {1} 次。", "Round done: {0} got, {1} not yet.", tally.yes, tally.no)) + "</b></p><p>" + esc(T("fc.tom", "明天到期 {0} 张。", "{0} due tomorrow.", tomorrow)) + "</p>" +
          '<button type="button" class="vl-btn alt vl-fc-again">' + esc(T("fc.extra", "不管到期，全部练一轮", "Practise all of them anyway")) + "</button>";
      const ag = end.querySelector(".vl-fc-again");
      if (ag) { ag.onclick = () => round(pool().map(c => c.id)); ag.disabled = !ps.length; }
    }
    card.addEventListener("click", flip); flipB.addEventListener("click", flip);
    no.addEventListener("click", () => judge(false)); yes.addEventListener("click", () => judge(true));
    all.addEventListener("change", () => round());
    $(".vl-fc-reset").addEventListener("click", () => { save({}); round(); });
    doc.addEventListener("keydown", e => {
      if (e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) return;
      if (!wrap.isConnected || $(".vl-fc-stage").hidden) return;
      if (e.key === " " && e.target === card) return;            // 按钮自己会响应空格
      if (e.key === " ") { e.preventDefault(); flip(); }
      if (e.key === "ArrowRight") { e.preventDefault(); judge(true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); judge(false); }
    });
    round();
    return { el: wrap, round, flip, judge };
  }

  VL.glossary = glossary; VL.flashcards = flashcards; VL.termInitial = initial;
})();
