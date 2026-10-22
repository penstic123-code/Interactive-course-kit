/* course-kit · modules/graph.js —— 概念关系图（全课 map.html）、本章概念小图 VL.miniMap、窄屏列表视图。
   数据来自 VL.concepts（modules/vl-concepts.js）。原生实现，不引库。放在 vl.js、illus.js 之后。
   做法：节点是真正的 <button>（HTML，键盘、读屏都能用），连线画在节点下面一层 aria-hidden 的 SVG 里；
   关系的文字说法在信息栏和节点的 aria-label 里给出，不靠看线。
   布局：默认"分层"——按章（章多时按篇）排成列，列内按邻居的平均位置排序，线短、不乱；
         可切"自由排布"——在分层结果上跑一段确定的力导向（同一份数据每次结果相同）。 */
(function () {
  "use strict";
  const VL = window.VL, doc = document;
  if (!VL || !VL.concepts) { console.warn("[VL] graph.js 需要先加载 vl.js 和 modules/vl-concepts.js"); return; }
  const K = VL.concepts, esc = VL.esc, T = K.T, NS = "http://www.w3.org/2000/svg";
  const f1 = n => Math.round(n * 10) / 10;
  let gid = 0;

  /* ---------- 信息栏：概念卡 + 所在章节 + 按关系分组的邻居 ---------- */
  function infoHTML(c, o) {
    o = o || {};
    const nb = K.neighbors(c.id);
    const groups = {};
    nb.forEach(x => { const k = K.relLabel(x.type, x.dir); (groups[k] = groups[k] || []).push(x); });
    const href = K.chHref(c.ch, c.id);
    const where = c.ch ? (href ? '<a class="vl-gi-go" href="' + esc(href) + '">' + esc(T("g.go", "去第 {0} 章读：{1}", "Read it in Ch. {0}: {1}", c.ch, K.chName(c.ch))) + " →</a>"
      : '<span class="vl-gi-go off">' + esc(T("g.wip", "第 {0} 章还在写", "Ch. {0} is still being written", c.ch)) + "</span>") : "";
    const rel = Object.keys(groups).map(k => '<p class="vl-gi-rel"><b>' + esc(k) + "</b>" + groups[k].map(x => {
      const d = K.get(x.id);
      return '<button type="button" class="vl-chip vl-gi-nb" data-go="' + esc(x.id) + '">' + esc(K.name(d)) + (d.ch ? "<small>" + esc(T("g.chs", "第{0}章", "Ch.{0}", d.ch)) + "</small>" : "") + "</button>";
    }).join("") + "</p>").join("");
    if (o.compact) {
      return '<p class="vl-gi-line"><b>' + esc(K.name(c)) + "</b>" + (c.ch ? " <small>" + esc(T("g.chs", "第{0}章", "Ch.{0}", c.ch)) + "</small>" : "") + "：" + esc(K.pick(c, "plain") || K.pick(c, "def")) + "</p>" +
        (o.here ? "" : where);
    }
    return '<aside class="vl-cc" data-tag="' + esc(c.kind === "principle" ? T("g.principle", "世界观原理", "Big idea") : T("g.concept", "概念", "Concept")) + '">' + K.cardHTML(c) + "</aside>" +
      '<div class="vl-gi-meta">' + where + (rel || '<p class="vl-gi-rel">' + esc(T("g.alone", "还没有和它连线的概念。", "No links yet.")) + "</p>") + "</div>";
  }

  /* ---------- 布局 ---------- */
  function layered(nodes, groupKey, o) {
    const gap = o.gapX, rowGap = o.gapY, maxRows = o.maxRows;
    const gmap = new Map();
    nodes.forEach(n => { const k = groupKey(n); const key = k.order; if (!gmap.has(key)) gmap.set(key, { k, list: [] }); gmap.get(key).list.push(n); });
    const groups = [...gmap.values()].sort((a, b) => a.k.order - b.k.order);
    // 每组切成若干列（每列 ≤ maxRows 个）
    const cols = [];
    groups.forEach(g => { for (let i = 0; i < g.list.length; i += maxRows) cols.push({ g, list: g.list.slice(i, i + maxRows), first: i === 0 }); });
    cols.forEach((c, ci) => c.list.forEach((n, r) => { n.col = ci; n.row = r; }));
    // 列内按邻居的平均行号排序：来回扫 4 遍，连线更短、少交叉
    const byId = new Map(nodes.map(n => [n.id, n]));
    for (let it = 0; it < 4; it++) {
      cols.forEach(c => {
        c.list.forEach(n => {
          const ys = n.nb.map(id => byId.get(id)).filter(m => m && m.col !== n.col).map(m => m.row);
          n.bc = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : n.row;
        });
        c.list.sort((a, b) => a.bc - b.bc || a.idx - b.idx);
        c.list.forEach((n, r) => (n.row = r));
      });
    }
    const rows = Math.max(1, ...cols.map(c => c.list.length));
    const head = o.headH;
    let x = o.pad;
    const rowH = Math.max(...nodes.map(n => n.h)) + rowGap;
    cols.forEach(c => {
      c.x = x; c.w = Math.max(...c.list.map(n => n.w));
      const off = (rows - c.list.length) * rowH / 2;
      c.list.forEach(n => { n.x = x + (c.w - n.w) / 2; n.y = head + off + n.row * rowH + (rowH - rowGap - n.h) / 2; });
      x += c.w + gap;
    });
    return { w: x - gap + o.pad, h: head + rows * rowH - rowGap + o.pad, cols };
  }
  // 力导向：从分层结果出发，确定性地跑固定步数；节点按矩形互斥，不重叠
  function force(nodes, links, box, o) {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const E = links.map(l => [byId.get(l.from), byId.get(l.to)]).filter(e => e[0] && e[1]);
    const cx0 = new Map(nodes.map(n => [n.id, n.x + n.w / 2]));
    nodes.forEach(n => { n.cx = n.x + n.w / 2; n.cy = n.y + n.h / 2; n.vx = 0; n.vy = 0; });
    const midY = box.h / 2;
    for (let it = 0; it < 260; it++) {
      const a = 1 - it / 300;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j];
        let dx = p.cx - q.cx, dy = p.cy - q.cy;
        if (!dx && !dy) { dx = (i - j) * 0.1; dy = 0.1; }
        const d2 = dx * dx + dy * dy, d = Math.sqrt(d2);
        const f = 5200 / d2;
        p.vx += dx / d * f; p.vy += dy / d * f; q.vx -= dx / d * f; q.vy -= dy / d * f;
        const ox = (p.w + q.w) / 2 + 14 - Math.abs(dx), oy = (p.h + q.h) / 2 + 12 - Math.abs(dy);   // 矩形重叠就推开
        if (ox > 0 && oy > 0) { if (ox < oy) { const s = Math.sign(dx) * ox / 2; p.cx += s; q.cx -= s; } else { const s = Math.sign(dy) * oy / 2; p.cy += s; q.cy -= s; } }
      }
      E.forEach(([p, q]) => { const dx = q.cx - p.cx, dy = q.cy - p.cy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - o.spring) * 0.02; p.vx += dx / d * f; p.vy += dy / d * f; q.vx -= dx / d * f; q.vy -= dy / d * f; });
      nodes.forEach(n => { n.vx += (cx0.get(n.id) - n.cx) * 0.01; n.vy += (midY - n.cy) * 0.004; n.cx += n.vx * a * 0.5; n.cy += n.vy * a * 0.5; n.vx *= 0.6; n.vy *= 0.6; });
    }
    nodes.forEach(n => (n.col = null));
    const minX = Math.min(...nodes.map(n => n.cx - n.w / 2)), minY = Math.min(...nodes.map(n => n.cy - n.h / 2));
    nodes.forEach(n => { n.x = n.cx - n.w / 2 - minX + o.pad; n.y = n.cy - n.h / 2 - minY + o.pad + o.headH; });
    return { w: Math.max(...nodes.map(n => n.x + n.w)) + o.pad, h: Math.max(...nodes.map(n => n.y + n.h)) + o.pad, cols: [] };
  }

  /* ---------- 连线：从框边到框边的三次曲线；箭头单独画成三角形（不用 marker，皮肤好上色） ---------- */
  function edgePath(A, B, H) {
    const ax = A.x + A.w / 2, ay = A.y + A.h / 2, bx = B.x + B.w / 2, by = B.y + B.h / 2;
    let p0, p3, c1, c2;
    if (Math.abs(bx - ax) > (A.w + B.w) / 2 + 8) {          // 不同列：左右出线
      const s = bx > ax ? 1 : -1;
      p0 = [ax + s * A.w / 2, ay]; p3 = [bx - s * B.w / 2, by];
      const h = Math.max(24, Math.abs(p3[0] - p0[0]) * 0.45);
      // 跨过中间的列时拱起来走（上半部分往上拱，下半部分往下拱），别从中间那列的节点底下穿过去
      const skip = A.col != null && B.col != null && Math.abs(A.col - B.col) > 1;
      const bend = skip ? ((ay + by) / 2 < (H || 0) / 2 ? -1 : 1) * (Math.max(A.h, B.h) / 2 + 26) : 0;
      c1 = [p0[0] + s * h, p0[1] + bend]; c2 = [p3[0] - s * h, p3[1] + bend];
    } else {                                                 // 同一列：从右边绕出去
      const s = by > ay ? 1 : -1;
      if (Math.abs(by - ay) < (A.h + B.h) / 2 + 30) { p0 = [ax, ay + s * A.h / 2]; p3 = [bx, by - s * B.h / 2]; c1 = [p0[0], p0[1] + s * 12]; c2 = [p3[0], p3[1] - s * 12]; }
      else { p0 = [A.x + A.w, ay]; p3 = [B.x + B.w, by]; const bulge = 26 + Math.abs(by - ay) * 0.18; c1 = [Math.max(p0[0], p3[0]) + bulge, ay]; c2 = [Math.max(p0[0], p3[0]) + bulge, by]; }
    }
    const d = "M" + f1(p0[0]) + " " + f1(p0[1]) + " C" + f1(c1[0]) + " " + f1(c1[1]) + " " + f1(c2[0]) + " " + f1(c2[1]) + " " + f1(p3[0]) + " " + f1(p3[1]);
    const ang = Math.atan2(p3[1] - c2[1], p3[0] - c2[0]), k = 9;
    const head = "M" + f1(p3[0]) + " " + f1(p3[1]) + " L" + f1(p3[0] - k * Math.cos(ang - 0.45)) + " " + f1(p3[1] - k * Math.sin(ang - 0.45)) + " L" + f1(p3[0] - k * Math.cos(ang + 0.45)) + " " + f1(p3[1] - k * Math.sin(ang + 0.45)) + " Z";
    return { d, head };
  }

  /* ---------- 主体：VL.graph(target, opts) ---------- */
  function graph(target, opts) {
    if (typeof target === "string") target = doc.querySelector(target);
    if (!target) return null;
    opts = Object.assign({ layout: "layered", groupBy: "auto", maxRows: 7, gapX: 64, gapY: 18, pad: 12, headH: 34, spring: 150, mini: false, info: null }, opts || {});
    const n0 = ++gid;
    const root = doc.createElement("div");
    root.className = "vl-graph" + (opts.mini ? " vl-graph-mini" : "");
    root.innerHTML = '<div class="vl-gscroll"><div class="vl-gstage"><svg class="vl-gedges" aria-hidden="true" focusable="false"></svg><div class="vl-gheads" aria-hidden="true"></div><div class="vl-gnodes" role="group"></div></div></div>';
    target.appendChild(root);
    const stage = root.querySelector(".vl-gstage"), svg = root.querySelector(".vl-gedges"), heads = root.querySelector(".vl-gheads"), box = root.querySelector(".vl-gnodes");
    box.setAttribute("aria-label", opts.label || T("g.aria", "概念关系图：方向键在概念之间移动，回车查看", "Concept map: arrow keys move between concepts, Enter shows one"));
    const all = opts.ids ? opts.ids.map(K.get).filter(Boolean) : K.items.slice();
    const lit = id => !!(VL.collect && VL.collect.has && VL.collect.has(id));
    const state = { on: null, parts: null, q: "", layout: opts.layout, focus: null };
    // 节点
    const nodes = all.map((c, idx) => {
      const b = doc.createElement("button");
      b.type = "button"; b.className = "vl-gn"; b.dataset.id = c.id; b.dataset.part = String(K.partOf(c.ch) + 1);
      if (c.kind === "principle") b.classList.add("is-principle");
      if (c.ch && !K.isOpen(c.ch)) b.classList.add("is-off");
      if (opts.here && c.ch === opts.here) b.classList.add("is-here");
      if (lit(c.id)) b.classList.add("is-lit");
      b.tabIndex = -1;
      b.innerHTML = '<span class="vl-gn-t">' + esc(K.name(c)) + "</span>" + (c.ch ? '<small class="vl-gn-ch" aria-hidden="true">' + c.ch + "</small>" : "");
      const nb = K.neighbors(c.id);
      b.setAttribute("aria-label", K.name(c) + (c.ch ? "，" + T("g.chs", "第{0}章", "Ch.{0}", c.ch) : "") + (lit(c.id) ? "，" + T("g.lit", "已读懂", "understood") : "") + "。" + T("g.nbn", "{0} 条关系", "{0} links", nb.length));
      box.appendChild(b);
      return { id: c.id, c, el: b, idx, nb: nb.map(x => x.id), w: 0, h: 0, x: 0, y: 0 };
    });
    const byId = new Map(nodes.map(n => [n.id, n]));
    const idSet = new Set(nodes.map(n => n.id));
    const links = K.links.filter(l => idSet.has(l.from) && idSet.has(l.to));
    const edges = links.map(l => {
      const g = doc.createElementNS(NS, "g"); g.setAttribute("class", "vl-ge t-" + l.type);
      const p = doc.createElementNS(NS, "path"); p.setAttribute("class", "vl-ge-ln");
      g.appendChild(p);
      let h = null; if (K.TYPES[l.type].arrow) { h = doc.createElementNS(NS, "path"); h.setAttribute("class", "vl-ge-ah"); g.appendChild(h); }
      svg.appendChild(g);
      return Object.assign({ g, p, h }, l);
    });
    const visible = () => nodes.filter(n => !n.hidden);
    const groupKey = (() => {
      if (typeof opts.groupBy === "function") return opts.groupBy;
      const chs = new Set(all.map(c => c.ch));
      const byPart = opts.groupBy === "part" || (opts.groupBy === "auto" && chs.size > 8);
      return byPart ? n => ({ order: K.partOf(n.c.ch), label: (K.PARTS[K.partOf(n.c.ch)] || {})[K.lang === "en" ? "en" : "zh"] || "" })
        : n => ({ order: n.c.ch, label: n.c.ch ? T("g.chs", "第{0}章", "Ch.{0}", n.c.ch) + " " + K.chName(n.c.ch) : "" });
    })();

    function layout() {
      const vis = visible();
      nodes.forEach(n => { n.el.hidden = !!n.hidden; });
      vis.forEach(n => { n.w = Math.ceil(n.el.offsetWidth) || 80; n.h = Math.ceil(n.el.offsetHeight) || 32; });
      if (!vis.length) { stage.style.width = "100%"; stage.style.height = "60px"; heads.innerHTML = ""; edges.forEach(e => (e.g.style.display = "none")); return; }
      let L = layered(vis, groupKey, opts);
      if (state.layout === "force" && vis.length > 2) L = force(vis, links.filter(l => !byId.get(l.from).hidden && !byId.get(l.to).hidden), L, opts);
      // 宽度不满容器时居中
      const cw = root.querySelector(".vl-gscroll").clientWidth || L.w;
      const dx = L.w < cw ? (cw - L.w) / 2 : 0;
      stage.style.width = Math.max(L.w, cw) + "px"; stage.style.height = L.h + "px";
      svg.setAttribute("width", Math.max(L.w, cw)); svg.setAttribute("height", L.h); svg.setAttribute("viewBox", "0 0 " + Math.max(L.w, cw) + " " + L.h);
      vis.forEach(n => { n.x += dx; n.el.style.left = f1(n.x) + "px"; n.el.style.top = f1(n.y) + "px"; });
      heads.innerHTML = L.cols.filter(c => c.first && c.g.k.label).map(c => '<span class="vl-gh" style="left:' + f1(c.x + dx) + 'px">' + esc(c.g.k.label) + "</span>").join("");
      edges.forEach(e => {
        const A = byId.get(e.from), B = byId.get(e.to);
        const show = !A.hidden && !B.hidden; e.g.style.display = show ? "" : "none"; if (!show) return;
        const r = edgePath(A, B, L.h); e.p.setAttribute("d", r.d); if (e.h) e.h.setAttribute("d", r.head);
      });
      paint();
    }
    // 选中 / 搜索 / 点亮的状态写成类，外观交给皮肤
    function paint() {
      const on = state.on, nb = on ? new Set(byId.get(on).nb) : null;
      const q = state.q;
      root.classList.toggle("has-on", !!on); root.classList.toggle("has-q", !!q);
      nodes.forEach(n => {
        n.el.classList.toggle("is-on", n.id === on);
        n.el.classList.toggle("is-nb", !!nb && nb.has(n.id));
        n.el.classList.toggle("is-hit", !!q && K.match(n.c, q));
        n.el.classList.toggle("is-lit", lit(n.id));
        n.el.setAttribute("aria-pressed", String(n.id === on));
      });
      edges.forEach(e => e.g.classList.toggle("is-on", !!on && (e.from === on || e.to === on)));
    }
    function setFocus(n, move) {
      nodes.forEach(m => (m.el.tabIndex = -1));
      if (!n) { const v = visible()[0]; if (v) v.el.tabIndex = 0; state.focus = v ? v.id : null; return; }
      n.el.tabIndex = 0; state.focus = n.id;
      if (move) n.el.focus({ preventScroll: false });
    }
    function select(id, o) {
      o = o || {};
      if (id && !byId.has(id)) return;
      state.on = id && (state.on !== id || o.keep) ? id : null;
      paint();
      if (id) setFocus(byId.get(id), !!o.focus);
      const c = state.on ? K.get(state.on) : null;
      if (opts.info) {
        const box = typeof opts.info === "string" ? doc.querySelector(opts.info) : opts.info;
        if (box) {
          if (c) { box.innerHTML = infoHTML(c, { compact: opts.mini, here: opts.here && c.ch === opts.here }); VL.enhance(box); }
          else box.innerHTML = opts.emptyInfo || "";
          box.hidden = !c && !opts.emptyInfo;
        }
      }
      if (opts.onSelect) opts.onSelect(c);
      root.dispatchEvent(new CustomEvent("vl:concept", { bubbles: true, detail: { id: state.on } }));
    }
    box.addEventListener("click", e => { const b = e.target.closest(".vl-gn"); if (b) select(b.dataset.id); });
    // 信息栏里的邻居按钮：跳到那个概念
    const infoEl = typeof opts.info === "string" ? doc.querySelector(opts.info) : opts.info;
    if (infoEl) infoEl.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g && byId.has(g.dataset.go)) select(g.dataset.go, { keep: true, focus: true }); });
    // 方向键：在方向上找最近的节点；有选中的概念时优先在它的邻居里走
    box.addEventListener("keydown", e => {
      const b = e.target.closest(".vl-gn"); if (!b) return;
      const cur = byId.get(b.dataset.id);
      if (e.key === "Escape") { if (state.on) { e.preventDefault(); e.stopPropagation(); select(null); } return; }
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      const vis = visible();
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); setFocus(e.key === "Home" ? vis[0] : vis[vis.length - 1], true); return; }
      if (!dir) return;
      e.preventDefault();
      const cx = n => n.x + n.w / 2, cy = n => n.y + n.h / 2;
      const best = pool => {
        let bn = null, bs = Infinity;
        pool.forEach(n => {
          if (n === cur) return;
          const dx = cx(n) - cx(cur), dy = cy(n) - cy(cur);
          const along = dx * dir[0] + dy * dir[1]; if (along <= 4) return;
          const s = along + 2.2 * Math.abs(dx * dir[1] + dy * dir[0]);
          if (s < bs) { bs = s; bn = n; }
        });
        return bn;
      };
      let pool = vis;
      if (state.on) { const on = byId.get(state.on); pool = vis.filter(n => n === on || on.nb.includes(n.id)); }
      const nx = best(pool) || best(vis);
      if (nx) setFocus(nx, true);
    });

    const api = {
      el: root, select: (id, o) => select(id, Object.assign({ keep: true }, o)), clear: () => select(null),
      relayout: layout,
      filterParts(parts) { state.parts = parts; nodes.forEach(n => (n.hidden = !!parts && !parts.has(K.partOf(n.c.ch) + 1))); if (state.on && byId.get(state.on).hidden) select(null); layout(); setFocus(byId.get(state.focus) && !byId.get(state.focus).hidden ? byId.get(state.focus) : null); },
      search(q) { state.q = String(q || "").trim(); paint(); return visible().filter(n => state.q && K.match(n.c, state.q)).map(n => n.id); },
      setLayout(m) { state.layout = m === "force" ? "force" : "layered"; layout(); },
      get selected() { return state.on; },
    };
    layout(); setFocus(null);
    // 字体到了、容器宽度变了再排一次（节点宽度取决于实际字宽）
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => layout());
    let lastW = target.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(() => { const w = target.clientWidth; if (Math.abs(w - lastW) > 24) { lastW = w; layout(); } }).observe(target);
    doc.addEventListener("vl:collect", () => paint());
    root._vlGraph = api; root.id = root.id || "vl-graph" + n0;
    return api;
  }

  /* ---------- 窄屏列表视图：按篇 → 章分组的概念按钮，点开就地显示信息 ---------- */
  function graphList(target, opts) {
    if (typeof target === "string") target = doc.querySelector(target);
    if (!target) return null;
    opts = opts || {};
    const wrap = doc.createElement("div"); wrap.className = "vl-glist";
    const parts = K.PARTS.length ? K.PARTS.map((p, i) => ({ i, name: K.lang === "en" ? p.en || p.zh : p.zh, from: p.from, to: p.to })) : [{ i: 0, name: "", from: 1, to: 999 }];
    wrap.innerHTML = parts.map(p => {
      const chs = [...new Set(K.items.filter(c => c.ch >= p.from && c.ch <= p.to).map(c => c.ch))].sort((a, b) => a - b);
      if (!chs.length) return "";
      return '<section class="vl-gl-part" data-part="' + (p.i + 1) + '">' + (p.name ? "<h3>" + esc(p.name) + "</h3>" : "") + chs.map(ch =>
        '<h4 class="vl-gl-ch">' + esc(T("g.chs", "第{0}章", "Ch.{0}", ch) + " " + K.chName(ch)) + '</h4><ul class="vl-gl-items">' +
        K.ofChapter(ch).map(c => '<li><button type="button" class="vl-gl-btn" data-id="' + esc(c.id) + '" data-part="' + (p.i + 1) + '" aria-expanded="false">' + esc(K.name(c)) + '<small>' + esc(T("g.nbn", "{0} 条关系", "{0} links", K.neighbors(c.id).length)) + "</small></button></li>").join("") + "</ul>").join("") + "</section>";
    }).join("");
    target.appendChild(wrap);
    const panel = doc.createElement("div"); panel.className = "vl-gl-info"; panel.hidden = true; panel.setAttribute("aria-live", "polite");
    let on = null;
    function open(id) {
      wrap.querySelectorAll(".vl-gl-btn").forEach(b => { b.setAttribute("aria-expanded", String(b.dataset.id === id)); b.classList.toggle("is-on", b.dataset.id === id); b.classList.toggle("is-lit", !!(VL.collect && VL.collect.has && VL.collect.has(b.dataset.id))); });
      if (!id || id === on) { on = null; panel.hidden = true; wrap.querySelectorAll(".vl-gl-btn").forEach(b => { b.setAttribute("aria-expanded", "false"); b.classList.remove("is-on"); }); return; }
      on = id;
      const b = wrap.querySelector('.vl-gl-btn[data-id="' + id + '"]');
      b.closest("li").appendChild(panel);
      panel.innerHTML = infoHTML(K.get(id)); panel.hidden = false; VL.enhance(panel);
      panel.id = panel.id || "vl-gl-info"; b.setAttribute("aria-controls", panel.id);
      if (opts.onSelect) opts.onSelect(K.get(id));
    }
    wrap.addEventListener("click", e => {
      const b = e.target.closest(".vl-gl-btn"); if (b) { open(b.dataset.id); return; }
      const g = e.target.closest("[data-go]"); if (g) { open(g.dataset.go); const t = wrap.querySelector('.vl-gl-btn[data-id="' + g.dataset.go + '"]'); if (t) { t.focus({ preventScroll: true }); t.scrollIntoView({ block: "nearest", behavior: VL.motion() ? "smooth" : "auto" }); } }
    });
    open(null);
    return { el: wrap, open: id => { on = null; open(id); }, filterParts(ps) { wrap.querySelectorAll(".vl-gl-part").forEach(s => (s.hidden = !!ps && !ps.has(+s.dataset.part))); } };
  }

  /* ---------- 本章概念小图：本章概念居中，左边是前面章节里和它们连着的概念 ---------- */
  function miniMap(ch, target, opts) {
    ch = +ch || VL.cur;
    if (typeof target === "string") target = doc.querySelector(target);
    if (!target || !ch) return null;
    opts = opts || {};
    const mine = K.ofChapter(ch);
    if (!mine.length) { target.hidden = true; return null; }
    const ids = new Set(mine.map(c => c.id));
    const future = opts.future === true;              // 默认不画后面的章：正文不预告后面（content-rules.md 一A）
    mine.forEach(c => K.neighbors(c.id).forEach(x => { const d = K.get(x.id); if (d.ch < ch || (future && d.ch > ch)) ids.add(x.id); }));
    target.classList.add("vl-minimap");
    if (!target.querySelector(".vl-mm-cap")) target.insertAdjacentHTML("afterbegin", '<p class="vl-mm-cap"><b>' + esc(opts.title || T("mm.title", "这一章的概念和前面怎么连", "How this chapter connects to earlier ones")) + "</b>" +
      '<small>' + esc(T("mm.hint", "点一个概念看它是什么；左边是前面讲过的。", "Tap a concept to see what it is; earlier ideas are on the left.")) + "</small></p>");
    const info = doc.createElement("div"); info.className = "vl-mm-info"; info.setAttribute("aria-live", "polite"); info.hidden = true;
    const G = graph(target, {
      mini: true, here: ch, ids: [...ids], maxRows: 6, gapX: 54, gapY: 14, headH: 30, info,
      label: T("mm.aria", "第 {0} 章概念小图", "Concept map for Ch. {0}", ch),
      groupBy: n => n.c.ch === ch ? { order: 1, label: T("mm.here", "本章", "This chapter") } : n.c.ch < ch ? { order: 0, label: T("mm.before", "前面讲过", "Earlier") } : { order: 2, label: T("mm.after", "后面会用到", "Later") },
    });
    target.appendChild(info);
    const more = doc.createElement("p"); more.className = "vl-mm-more";
    more.innerHTML = '<a href="' + esc(K.mapHref()) + '">' + esc(T("mm.all", "看全课概念关系图", "Open the full concept map")) + " →</a>";
    target.appendChild(more);
    return G;
  }

  /* ---------- 全课关系图页面：map.html 里一行调用 ---------- */
  function mapPage(o) {
    o = Object.assign({ graph: "#vl-map", list: "#vl-maplist", info: "#vl-mapinfo", search: "#vl-mapq", parts: "#vl-mapparts", legend: "#vl-maplegend", views: "#vl-mapviews", layouts: "#vl-maplayouts", count: "#vl-mapcount" }, o || {});
    const $ = s => doc.querySelector(s);
    const info = $(o.info);
    const empty = info ? info.innerHTML : "";
    const G = graph(o.graph, { info, emptyInfo: empty, layout: "layered" });
    const L = graphList(o.list);
    if (!G) return null;
    // 篇筛选
    const pbox = $(o.parts);
    let parts = null;
    if (pbox && K.PARTS.length > 1) {
      pbox.innerHTML = K.PARTS.map((p, i) => '<button type="button" class="vl-chip vl-mp-part" data-part="' + (i + 1) + '" aria-pressed="true"><i class="vl-sw" aria-hidden="true"></i>' + esc(K.lang === "en" ? p.en || p.zh : p.zh) + "</button>").join("");
      pbox.addEventListener("click", e => {
        const b = e.target.closest(".vl-mp-part"); if (!b) return;
        b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
        const on = new Set([...pbox.querySelectorAll('.vl-mp-part[aria-pressed="true"]')].map(x => +x.dataset.part));
        parts = on.size === K.PARTS.length ? null : on;
        G.filterParts(parts); if (L) L.filterParts(parts);
      });
    }
    // 图例：节点颜色 = 篇（另有文字），线型 = 关系
    const lg = $(o.legend);
    if (lg) lg.innerHTML = Object.keys(K.TYPES).map(k => '<span class="vl-lg t-' + k + '"><svg viewBox="0 0 40 12" aria-hidden="true"><path class="vl-ge-ln" d="M2 6 H34"/>' + (K.TYPES[k].arrow ? '<path class="vl-ge-ah" d="M38 6 L30 2 L30 10 Z"/>' : "") + "</svg>" +
      esc(K.lang === "en" ? K.TYPES[k].en : K.TYPES[k].zh) + "</span>").join("") + '<span class="vl-lg vl-lg-lit"><i class="vl-lg-dot" aria-hidden="true"></i>' + esc(T("g.litLeg", "已读懂", "Understood")) + "</span>";
    // 搜索
    const q = $(o.search), cnt = $(o.count);
    if (q) {
      const run = () => { const hits = G.search(q.value); if (cnt) cnt.textContent = q.value.trim() ? T("g.found", "找到 {0} 个", "{0} found", hits.length) : ""; return hits; };
      q.addEventListener("input", run);
      q.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); const h = run(); if (h[0]) { G.select(h[0], { focus: true }); if (L) L.open(h[0]); } } if (e.key === "Escape") { q.value = ""; run(); } });
    }
    // 视图：关系图 / 列表（窄屏默认列表）
    const vb = $(o.views);
    const setView = v => {
      const gEl = $(o.graph), lEl = $(o.list);
      if (gEl) gEl.hidden = v !== "graph"; if (lEl) lEl.hidden = v !== "list";
      const lay = $(o.layouts); if (lay) lay.hidden = v !== "graph";
      if (info) info.hidden = v !== "graph";
      if (vb) vb.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
      if (v === "graph") G.relayout();
    };
    if (vb) vb.addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) setView(b.dataset.view); });
    const lay = $(o.layouts);
    if (lay) lay.addEventListener("click", e => { const b = e.target.closest("[data-layout]"); if (!b) return; G.setLayout(b.dataset.layout); lay.querySelectorAll("[data-layout]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); });
    const narrow = () => { try { return matchMedia("(max-width: 700px)").matches; } catch (e) { return false; } };
    setView(narrow() ? "list" : "graph");
    // map.html#概念id：直接选中
    const h = decodeURIComponent((location.hash || "").slice(1));
    if (h && K.get(h)) { if (narrow() && L) L.open(h); else G.select(h); }
    return { graph: G, list: L, setView };
  }

  VL.graph = graph; VL.graphList = graphList; VL.miniMap = miniMap; VL.mapPage = mapPage; VL.conceptInfoHTML = infoHTML;
  // 声明式：<div class="vl-minimap" data-ch="2"></div>
  VL.ready(() => doc.querySelectorAll(".vl-minimap[data-ch]:not([data-done])").forEach(el => { el.dataset.done = "1"; miniMap(+el.dataset.ch, el, { future: el.dataset.future === "true" }); }));
})();
