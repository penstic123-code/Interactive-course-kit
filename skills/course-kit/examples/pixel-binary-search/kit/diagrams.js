/* course-kit · diagrams.js —— 概念图解模板：函数生成 SVG，样式全走皮肤的 CSS 变量。
   放在 vl.js 之后。十二种：VL.diagram.cycle / nested / flow / quadrant / compare / timeline / tree / venn / balance / network / spectrum / stack。
   写法与参数见 kit/README.md 第九节。
   为什么这样做：
   - viewBox 宽度 = 图实际显示的像素宽度（随容器重画），所以 SVG 里写的字号就是屏幕上的字号，手机上也不会缩成小字。
   - 每个方框先把字排好、量出包围盒，再按包围盒 + 内边距画框，保证字离线 ≥ 4px，不靠猜字体尺寸。
   - 形状和线条带 .vl-dg-box / .vl-dg-ln 类，皮肤可以给它们加手绘抖动滤镜；文字在单独的组里，永远不进滤镜。
     皮肤的滤镜按元素包围盒算区域，纯水平 / 竖直的线包围盒高度为 0，会被整条裁掉；所以画完后给每个带滤镜的形状
     复制一份"以自身坐标为准、四周多留 14px"的滤镜（roughen）。
   - 标签放在图形外，用引线连；放不下时改成编号圆 + 图下方对照表（窄屏常用）。
   - 字体加载完、容器变宽变窄时自动重画；选中状态保留。 */
(function () {
  "use strict";
  const VL = window.VL = window.VL || {};
  const NS = "http://www.w3.org/2000/svg";
  const t = (k, zh, ...a) => (VL.t ? VL.t(k, zh, ...a) : String(zh).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m)));
  /* 拼接用的标点：英文页（VL.lang 或 <html lang> 以 en 开头）换成半角 */
  const EN = () => (VL.lang ? VL.lang === "en" : /^en/i.test(document.documentElement.lang || ""));
  const PU = () => EN() ? { colon: ": ", sep: ", ", semi: "; ", stop: ". ", paren: [" (", ")"], gap: "  " } : { colon: "：", sep: "、", semi: "；", stop: "。", paren: ["（", "）"], gap: "　" };
  const paren = x => PU().paren[0] + x + PU().paren[1];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let UID = 0;
  const CIRC = "①②③④⑤⑥⑦⑧⑨⑩";

  function S(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const r1 = n => Math.round(n * 10) / 10;
  const motionOK = () => (VL.motion ? VL.motion() : !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches));

  /* ---------- 结构样式（与皮肤无关，皮肤可覆盖；:where 让皮肤的同名规则总能赢） ---------- */
  function ensureCSS() {
    if (document.getElementById("vl-dg-css")) return;
    const st = document.createElement("style"); st.id = "vl-dg-css";
    st.textContent = [
      ":where(.vl-dg) .vl-dg-vreg{fill:transparent;stroke:none;pointer-events:none}",
      ":where(.vl-dg) :is(.vl-dg-edgeg,.vl-dg-elab,.vl-dg-vset,.vl-dg-vreg,.vl-dg-badge){transition:opacity var(--dur-fb,.2s),fill var(--dur-fb,.2s)}",
      ".vl-dg.has-on :is(.vl-dg-edgeg,.vl-dg-elab):not(.is-near){opacity:.22}",
      ".vl-dg.has-on .vl-dg-node.is-near{opacity:1}",
      ".vl-dg.has-on .vl-dg-badge:not(.is-on){opacity:.45}",
      ":where(.vl-dg) .vl-dg-vsets{cursor:pointer}",
      ":where(.vl-dg-balance) .vl-ctl{margin-top:6px}",
      "@media (prefers-reduced-motion: reduce){.vl-dg *{transition:none!important}}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- 排字：按宽度折行（汉字逐字可断，英文按词断；行首不放标点） ---------- */
  const TOK = /[⺀-鿿豈-﫿＀-￯　-〿]|[^\s⺀-鿿豈-﫿＀-￯　-〿]+|\s+/g;
  const NOSTART = /^[，。、；：！？）》」』,.;:!?)\]]/;
  function measurer(svg) {
    const m = S("text", { class: "vl-dg-scratch", x: 0, y: -9999, "aria-hidden": "true" }, svg);
    const f = (txt, cls, size) => { m.setAttribute("class", cls + " vl-dg-scratch"); m.setAttribute("font-size", size); m.textContent = txt; return m.getComputedTextLength(); };
    f.el = m;   // 量完由 redraw 删掉（类名会被改写，不能靠类名找）
    return f;
  }
  function wrap(meas, txt, cls, size, maxW) {
    txt = String(txt == null ? "" : txt).trim(); if (!txt) return [];
    const out = [];
    String(txt).split("\n").forEach(par => {
      const toks = par.match(TOK) || [];
      let line = "";
      toks.forEach(tk => {
        const cand = line + tk;
        if (line && meas(cand.trimEnd(), cls, size) > maxW) {
          if (NOSTART.test(tk)) { line = cand; return; }   // 标点挂在行尾，不放行首
          out.push(line.trim()); line = /^\s+$/.test(tk) ? "" : tk;
        } else line = cand;
      });
      if (line.trim()) out.push(line.trim());
    });
    return out;
  }
  /* 只在标点、空格、"、"之后断行（不拆词）；有一段本身就放不下时返回 null。维恩区域里的短语用它 */
  const SEG = /[^\s，。、；：！？）》」』,.;:!?)\]\/·]+[\s，。、；：！？）》」』,.;:!?)\]\/·]*|[\s，。、；：！？）》」』,.;:!?)\]\/·]+/g;
  function wrapPhrase(meas, txt, cls, size, maxW) {
    txt = String(txt == null ? "" : txt).trim(); if (!txt) return [];
    const out = [];
    for (const par of txt.split("\n")) {
      let line = "";
      for (const sg of par.match(SEG) || []) {
        if (meas(sg.trim(), cls, size) > maxW) return null;
        const cand = line + sg;
        if (line && meas(cand.trim(), cls, size) > maxW) { out.push(line.trim()); line = sg.trimStart(); } else line = cand;
      }
      if (line.trim()) out.push(line.trim());
    }
    return out;
  }

  /* ---------- 文字块：几组行（名字、例子）叠在一起，量出包围盒 ---------- */
  // spec: [{text, cls, size, lh, lines?}]（给了 lines 就不再折行）；anchor: "middle" | "start" | "end"
  function textBlock(svg, meas, g, spec, maxW, anchor) {
    anchor = anchor || "middle";
    const tg = S("g", { class: "vl-dg-txt" }, g);
    let y = 0, first = true;
    spec.forEach(sp => {
      if (sp.text == null || sp.text === "") return;
      const lines = sp.lines || wrap(meas, sp.text, sp.cls, sp.size, maxW);
      lines.forEach(ln => {
        y += first ? sp.size : sp.size * (sp.lh || 1.35);
        first = false;
        const te = S("text", { class: sp.cls, x: 0, y: r1(y), "font-size": sp.size, "text-anchor": anchor }, tg);
        te.textContent = ln;
      });
      if (sp.after) y += sp.after;
    });
    const b = tg.getBBox();
    return { g: tg, x: b.x, y: b.y, w: b.width, h: b.height };
  }

  /* ---------- 节点：文字块 + 按包围盒画的框 ---------- */
  function sizes(W) { const n = W < 520; return { t1: n ? 17 : 19, t2: n ? 14 : 15, t3: n ? 13.5 : 14, padX: n ? 12 : 14, padY: n ? 9 : 11 }; }
  function makeNode(ctx, parent, nd, i, maxW, opts) {
    const z = ctx.z;
    const g = S("g", { class: "vl-dg-node", "data-dg-i": i >= 0 ? i : null, "data-c": nd.c || (Math.max(i, 0) % 6) + 1 }, parent);
    const rect = S("rect", { class: "vl-dg-box", rx: opts && opts.rx != null ? opts.rx : 14 }, g);
    const name = (opts && opts.num ? CIRC[i] + " " : "") + (nd.name || "");
    const tb = textBlock(ctx.svg, ctx.meas, g, [
      { text: name, cls: "vl-dg-t1", size: z.t1, after: 2 },
      { text: nd.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 },
    ], maxW - 2 * z.padX);
    const w = Math.max(tb.w + 2 * z.padX, opts && opts.minW || 0), h = tb.h + 2 * z.padY;
    rect.setAttribute("x", r1(tb.x + tb.w / 2 - w / 2)); rect.setAttribute("y", r1(tb.y - z.padY));
    rect.setAttribute("width", r1(w)); rect.setAttribute("height", r1(h));
    const node = { g, rect, w, h, ox: tb.x + tb.w / 2, oy: tb.y + tb.h / 2, cx: 0, cy: 0, nd, i };
    node.place = (cx, cy) => { node.cx = cx; node.cy = cy; g.setAttribute("transform", "translate(" + r1(cx - node.ox) + " " + r1(cy - node.oy) + ")"); };
    return node;
  }
  function interactive(ctx, g, i, label) {
    if (!ctx.select || i == null || i < 0) return;
    g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-pressed", "false");
    g.setAttribute("aria-label", label);
    g.setAttribute("data-dg-i", i);
  }
  const nodeLabel = nd => (nd.name || "") + (nd.eg ? PU().colon + nd.eg : "");

  /* ---------- 图外标签：名字 + 例子，带透明点击区。put(x, top)：x 是 anchor 那一侧，top 是文字顶 ---------- */
  function label(ctx, parent, it, i, maxW, anchor, cls) {
    const z = ctx.z;
    // 不可点的标签（光谱两端、合计）不带 vl-dg-node，选中别的块时它不跟着变淡
    const g = S("g", { class: (i >= 0 ? "vl-dg-node " : "") + "vl-dg-lab" + (cls ? " " + cls : ""), "data-dg-i": i >= 0 ? i : null }, parent);
    const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: it.name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: it.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], maxW, anchor || "start");
    const hit = S("rect", { class: "vl-dg-hit", x: r1(tb.x - 6), y: r1(tb.y - 4), width: r1(tb.w + 12), height: r1(tb.h + 8), fill: "transparent" });
    g.insertBefore(hit, g.firstChild);
    const L = { g, tb, w: tb.w, h: tb.h, l: 0, r: 0, t: 0, b: 0, x: 0 };
    L.put = (x, top) => { g.setAttribute("transform", "translate(" + r1(x) + " " + r1(top - tb.y) + ")"); L.x = x; L.l = x + tb.x; L.r = L.l + tb.w; L.t = top; L.b = top + tb.h; return L; };
    interactive(ctx, g, i, nodeLabel(it));
    return L;
  }
  /* 编号对照表的一行：左边编号圆，右边名字 + 例子（窄屏放不下引线标签时用） */
  function numLab(ctx, parent, it, i, k, top, maxW) {
    const z = ctx.z;
    const g = S("g", { class: "vl-dg-node vl-dg-lab", "data-dg-i": i >= 0 ? i : null }, parent);
    const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: it.name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: it.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], maxW - 40, "start");
    g.setAttribute("transform", "translate(36 " + r1(top - tb.y) + ")");
    const hit = S("rect", { class: "vl-dg-hit", x: -34, y: r1(tb.y - 4), width: r1(tb.w + 40), height: r1(tb.h + 8), fill: "transparent" }, g);
    g.insertBefore(hit, g.firstChild);
    const cy = tb.y + (tb.h ? Math.min(z.t1 * 0.55, tb.h / 2) : 0);
    S("circle", { class: "vl-dg-dot", cx: -22, cy: r1(cy), r: 12 }, g);
    const te = S("text", { class: "vl-dg-t3 vl-dg-num", x: -22, y: r1(cy + 5), "font-size": 14, "text-anchor": "middle" }, g);
    te.textContent = k;
    interactive(ctx, g, i, k + ". " + nodeLabel(it));
    return tb.h;
  }
  /* 图里的编号圆 */
  function badge(parent, x, y, k, i) {
    const g = S("g", { class: "vl-dg-badge", "data-dg-i": i >= 0 ? i : null }, parent);
    S("circle", { class: "vl-dg-dot", cx: r1(x), cy: r1(y), r: 12, fill: "#fff" }, g);
    const te = S("text", { class: "vl-dg-t3 vl-dg-num", x: r1(x), y: r1(y + 5), "font-size": 14, "text-anchor": "middle" }, g);
    te.textContent = k;
    return g;
  }

  /* 编号对照表：宽屏两列，窄屏一列。entries = [{it, i, k}]，返回表格底部的 y */
  function numList(ctx, parent, entries, top, W) {
    const cols = W >= 560 && entries.length > 2 ? 2 : 1, cw = cols === 2 ? (W - 4 - 24) / 2 : W - 4;
    let y = top;
    for (let q = 0; q < entries.length; q += cols) {
      let h = 0;
      for (let c = 0; c < cols && q + c < entries.length; c++) {
        const e = entries[q + c], g = S("g", { transform: "translate(" + r1(c * (cw + 24)) + " 0)" }, parent);
        h = Math.max(h, numLab(ctx, g, e.it, e.i, e.k, y, cw));
      }
      y += h + 12;
    }
    return y - 12;
  }

  // 方框边界上的点：从中心朝 (dx,dy) 方向出去，碰到框边的位置
  function edge(n, dx, dy, gap) {
    const hw = n.w / 2 + (gap || 0), hh = n.h / 2 + (gap || 0);
    const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [n.cx + dx * k, n.cy + dy * k];
  }
  function overlap(a, b, gap) {
    return Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 + gap && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2 + gap;
  }
  const rectHit = (a, b, gap) => !(a.r + gap <= b.l || b.r + gap <= a.l || a.b + gap <= b.t || b.b + gap <= a.t);
  // 线段 p0→p1 穿过矩形 rc 的参数区间 [t0, t1]；不相交返回 null（Liang–Barsky）
  function clipSeg(p0, p1, rc) {
    let t0 = 0, t1 = 1; const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const P = [-dx, dx, -dy, dy], Q = [p0[0] - rc.l, rc.r - p0[0], p0[1] - rc.t, rc.b - p0[1]];
    for (let k = 0; k < 4; k++) {
      if (P[k] === 0) { if (Q[k] < 0) return null; continue; }
      const r = Q[k] / P[k];
      if (P[k] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [t0, t1];
  }
  const lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  const P2 = p => r1(p[0]) + " " + r1(p[1]);
  function marker(ctx) {
    const id = "vl-ah" + ctx.uid;
    const defs = S("defs", null, ctx.svg); ctx.defs = defs;
    const m = S("marker", { id, viewBox: "0 0 10 10", refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "strokeWidth" }, defs);
    S("path", { class: "vl-dg-ah", d: "M1.5 1.5 L8.5 5 L1.5 8.5", fill: "none", stroke: "currentColor" }, m);
    return "url(#" + id + ")";
  }
  function arrow(ctx, parent, d, cls) { return S("path", { class: "vl-dg-ln" + (cls ? " " + cls : ""), d, fill: "none", stroke: "currentColor", "marker-end": ctx.mk }, parent); }
  function line(parent, d, cls, extra) { return S("path", Object.assign({ class: "vl-dg-ln" + (cls ? " " + cls : ""), d, fill: "none", stroke: "currentColor" }, extra || {}), parent); }
  function starPath(cx, cy, r) {
    let d = "";
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; d += (k ? " L" : "M") + r1(cx + rr * Math.cos(a)) + " " + r1(cy + rr * Math.sin(a)); }
    return d + " Z";
  }
  // 过点的平滑曲线（Catmull-Rom 转三次贝塞尔）
  function smooth(pts) {
    if (pts.length < 2) return "";
    let d = "M" + P2(pts[0]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + P2(c1) + " " + P2(c2) + " " + P2(p2);
    }
    return d;
  }
  /* 标签分行摆放：bs = [{x 想放的中心 / 引线位置, w}]，同一行不重叠；第 k 行的引线不穿过更靠近轴的行里的标签 */
  function rowPlace(bs, lo, hi, gap, maxRows) {
    const placed = [];
    bs.map((b, i) => Object.assign({ i }, b)).sort((a, b) => a.x - b.x).forEach(b => {
      const cx = clamp(b.x, lo + b.w / 2, Math.max(lo + b.w / 2, hi - b.w / 2));
      let k = 0;
      for (; k < (maxRows || 6); k++) {
        const ok = placed.every(p =>
          (p.row !== k || cx - b.w / 2 > p.cx + p.w / 2 + gap || cx + b.w / 2 < p.cx - p.w / 2 - gap) &&
          (p.row >= k || b.x < p.cx - p.w / 2 - 8 || b.x > p.cx + p.w / 2 + 8) &&
          (p.row <= k || p.x < cx - b.w / 2 - 8 || p.x > cx + b.w / 2 + 8));
        if (ok) break;
      }
      placed.push(Object.assign(b, { cx, row: k }));
    });
    return placed.sort((a, b) => a.i - b.i);
  }

  /* ---------- 抖动滤镜：给每个带滤镜的形状复制一份按自身坐标、四周留白的滤镜 ---------- */
  function roughen(ctx) {
    const v = getComputedStyle(ctx.fig).getPropertyValue("--dg-filter").trim();
    const m = /url\(\s*['"]?#([^'")\s]+)/.exec(v); if (!m) return;
    const src = document.getElementById(m[1]); if (!src || src.tagName.toLowerCase() !== "filter") return;
    let k = 0;
    ctx.svg.querySelectorAll(".vl-dg-ln,.vl-dg-box").forEach(el => {
      const f0 = getComputedStyle(el).filter;
      if (!f0 || f0 === "none" || f0.indexOf(m[1]) < 0) return;
      let b; try { b = el.getBBox(); } catch (e) { return; }
      const pad = 14, id = "vl-dgf" + ctx.uid + "-" + (k++);
      const f = S("filter", { id }, ctx.defs);
      Array.from(src.attributes).forEach(a => { if (!/^(id|x|y|width|height|filterUnits)$/.test(a.name)) f.setAttribute(a.name, a.value); });
      f.setAttribute("filterUnits", "userSpaceOnUse");
      f.setAttribute("x", r1(b.x - pad)); f.setAttribute("y", r1(b.y - pad)); f.setAttribute("width", r1(b.width + 2 * pad)); f.setAttribute("height", r1(b.height + 2 * pad));
      Array.from(src.childNodes).forEach(c => f.appendChild(c.cloneNode(true)));
      el.style.filter = "url(#" + id + ")";
    });
  }

  /* ---------- 公共外壳：figure + svg + 信息行；重画、选中、键盘 ---------- */
  function mount(type, target, o, draw, autoLabel) {
    if (typeof target === "string") target = document.querySelector(target);
    if (!target) return null;
    ensureCSS();
    o = Object.assign({}, o);
    let fig = target;
    if (target.tagName !== "FIGURE") { fig = document.createElement("figure"); fig.className = "vl-fig"; target.appendChild(fig); }
    fig.classList.add("vl-dg-fig");
    fig.querySelectorAll(":scope > .vl-dg").forEach(x => x.remove());
    const wrapEl = document.createElement("div"); wrapEl.className = "vl-dg vl-dg-" + type;
    const cap0 = fig.querySelector(":scope > figcaption");
    fig.insertBefore(wrapEl, cap0 || null);
    if (o.caption && !cap0) { const c = document.createElement("figcaption"); c.innerHTML = o.caption; fig.appendChild(c); }
    const uid = ++UID;
    const svg = S("svg", { class: "vl-dg-svg", xmlns: NS, focusable: "false" }, wrapEl);
    const items = o._items || o.nodes || o.layers || o.quads || o.rows || [];
    const select = o.select !== false && items.some(n => n);
    const label = o.label || autoLabel(o);
    svg.setAttribute("role", select ? "group" : "img"); svg.setAttribute("aria-label", label);
    let info = null;
    const hasInfo = select && o.info !== false;
    if (hasInfo) {
      info = document.createElement("p"); info.className = "vl-dg-info"; info.setAttribute("aria-live", "polite");
      info.innerHTML = o.hint || t("dg.hint", "点一个部分，看看它在做什么。");
      wrapEl.appendChild(info);
    }
    const ctx = { svg, uid, select, items, o, sel: -1, W: 0, wrap: wrapEl, fig, info };
    function paint() {
      svg.querySelectorAll("[data-dg-i]").forEach(e => {
        const on = +e.getAttribute("data-dg-i") === ctx.sel;
        e.classList.toggle("is-on", on);
        if (e.hasAttribute("aria-pressed")) e.setAttribute("aria-pressed", String(on));
      });
      wrapEl.classList.toggle("has-on", ctx.sel >= 0);
      if (ctx.onPaint) try { ctx.onPaint(ctx.sel); } catch (e) { console.error(e); }
    }
    function choose(i, fromUser) {
      ctx.sel = ctx.sel === i && fromUser ? -1 : i;
      paint();
      if (info) {
        const it = items[ctx.sel];
        info.innerHTML = ctx.sel < 0 || !it ? (o.hint || t("dg.hint", "点一个部分，看看它在做什么。")) : (it.info || "<b>" + VLesc(it.name || it.k || "") + "</b>" + (it.eg ? PU().gap + VLesc(it.eg) : ""));
      }
      if (o.onSelect) try { o.onSelect(ctx.sel, items[ctx.sel]); } catch (e) { console.error(e); }
      fig.dispatchEvent(new CustomEvent("vl:dgselect", { bubbles: true, detail: { i: ctx.sel } }));
    }
    ctx.choose = choose;
    function redraw() {
      const W = Math.round(clamp(wrapEl.clientWidth || 640, 280, 860));
      ctx.W = W;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      ctx.onPaint = null;
      ctx.z = sizes(W); ctx.meas = measurer(svg); ctx.mk = marker(ctx);
      const H = draw(ctx, W);
      ctx.meas.el.remove();
      svg.setAttribute("viewBox", "0 0 " + W + " " + Math.ceil(H));
      svg.setAttribute("width", W); svg.setAttribute("height", Math.ceil(H));
      svg.style.width = "100%"; svg.style.height = "auto";
      roughen(ctx);
      paint();
      if (ctx.afterDraw) ctx.afterDraw();
    }
    if (select) {
      svg.addEventListener("click", e => { const g = e.target.closest("[data-dg-i]"); if (g) choose(+g.getAttribute("data-dg-i"), true); });
      svg.addEventListener("keydown", e => {
        const g = e.target.closest && e.target.closest("[data-dg-i][tabindex]"); if (!g) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(+g.getAttribute("data-dg-i"), true); }
        if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
          const all = Array.from(svg.querySelectorAll("[data-dg-i][tabindex]")); const k = all.indexOf(g);
          const nx = all[(k + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length];
          if (nx) { e.preventDefault(); nx.focus(); }
        }
      });
    }
    const api = { el: fig, svg, ctx, redraw, select: i => choose(i, false), get selected() { return ctx.sel; } };
    fig._vlDiagram = api;
    if (o._setup) o._setup(api, ctx);
    redraw();
    // 字体晚到、容器变宽变窄：重画
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => redraw());
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", () => redraw());
    if (window.ResizeObserver) { let last = ctx.W, raf = 0; new ResizeObserver(() => { const w = wrapEl.clientWidth; if (Math.abs(w - last) < 24) return; last = w; cancelAnimationFrame(raf); raf = requestAnimationFrame(redraw); }).observe(wrapEl); }
    if (VL.figs) VL.figs();
    return api;
  }
  const VLesc = s => (VL.esc ? VL.esc(s) : String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));

  /* =====================================================================
     1. cycle 循环：宽屏节点排在椭圆上；窄屏 4 个以上排成两列"跑道"（右列往下、左列往上）
     ===================================================================== */
  function cycle(target, o) {
    return mount("cycle", target, o, (ctx, W) => {
      const nodes = o.nodes || [], N = nodes.length, m = 8, gap = W < 520 ? 22 : 30;
      const num = o.numbered !== false;
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const layer = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      const mkCenter = maxW => { if (!o.center) return null; const c = makeNode(ctx, layer, typeof o.center === "string" ? { name: o.center } : o.center, -1, maxW); c.g.classList.add("vl-dg-center"); c.rect.classList.add("vl-dg-ghost"); return c; };
      // ---- 窄屏跑道 ----
      if (W < 560 && N >= 4) {
        const odd = N % 2 === 1, side = odd ? (N - 1) / 2 : N / 2, hg = 34, vg = 34;
        const colW = (W - 2 * m - hg) / 2;
        const ns = nodes.map((nd, i) => makeNode(ctx, layer, nd, i, colW, { num }));
        const right = [], left = [];
        for (let k = 0; k < side; k++) { right.push(odd ? k + 1 : k); left.push(N - 1 - k); }
        const cxL = m + colW / 2, cxR = W - m - colW / 2;
        const center = mkCenter(cxR - cxL - 36);
        const gi = Math.floor((side - 1) / 2);
        let y = m;
        if (odd) { ns[0].place(W / 2, y + ns[0].h / 2); y += ns[0].h + vg + 6; }
        for (let r = 0; r < side; r++) {
          const a = ns[left[r]], b = ns[right[r]], rh = Math.max(a.h, b.h);
          a.place(cxL, y + rh / 2); b.place(cxR, y + rh / 2);
          y += rh;
          if (r < side - 1) {
            const g2 = r === gi && center ? center.h + 44 : vg;
            if (r === gi && center) center.place(W / 2, y + g2 / 2);
            y += g2;
          }
        }
        if (center && side === 1) center.place(W / 2, y + 30);
        const H = y + m;
        ns.forEach((n, i) => {
          interactive(ctx, n.g, i, nodeLabel(n.nd));
          const b = ns[(i + 1) % N], dx = b.cx - n.cx, dy = b.cy - n.cy;
          arrow(ctx, lines, "M" + P2(edge(n, dx, dy, 5)) + " L" + P2(edge(b, -dx, -dy, 7)));
        });
        return H;
      }
      // ---- 椭圆 ----
      let best = null;
      // 从宽到窄试框宽：每个框宽下，把椭圆竖向拉长，直到任意两框不重叠（留出箭头的空间）
      for (let mw = Math.min(220, W * 0.36); mw >= 84; mw -= 12) {
        layer.innerHTML = "";
        const ns = nodes.map((nd, i) => makeNode(ctx, layer, nd, i, mw, { num }));
        const bw = Math.max(...ns.map(n => n.w)), bh = Math.max(...ns.map(n => n.h));
        const center = mkCenter(Math.min(200, W * 0.3));
        const rx = W / 2 - bw / 2 - m;
        let ok = false, ry = 0;
        for (ry = Math.max(bh * 0.9, rx * 0.42); ry < rx * 2.6 + 200; ry += 6) {
          const H = 2 * ry + bh + 2 * m, cy = H / 2;
          ns.forEach((n, i) => { const a = (-90 + i * 360 / N) * Math.PI / 180; n.cx = W / 2 + rx * Math.cos(a); n.cy = cy + ry * Math.sin(a); });
          if (center) { center.cx = W / 2; center.cy = cy; }
          ok = true;
          for (let i = 0; i < N && ok; i++) for (let j = i + 1; j < N; j++) if (overlap(ns[i], ns[j], gap)) { ok = false; break; }
          if (ok && center) ok = ns.every(n => !overlap(n, center, gap));
          if (ok) break;
        }
        best = { ns, center, bw, bh, rx, ry };
        if (ok) break;
      }
      const { ns, center, bh, ry } = best;
      const H = 2 * ry + bh + 2 * m, cy = H / 2;
      ns.forEach(n => n.place(n.cx, n.cy));
      if (center) center.place(W / 2, cy);
      ns.forEach((n, i) => {
        interactive(ctx, n.g, i, nodeLabel(n.nd));
        const b = ns[(i + 1) % N];
        const dx = b.cx - n.cx, dy = b.cy - n.cy;
        const p0 = edge(n, dx, dy, 5), p2 = edge(b, -dx, -dy, 7);
        // 弧线向外鼓（远离图心），不穿过中间的字
        const mx = (p0[0] + p2[0]) / 2, my = (p0[1] + p2[1]) / 2, ox = mx - W / 2, oy = my - cy, ol = Math.hypot(ox, oy) || 1, d = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
        const k = Math.min(28, d * 0.22);
        arrow(ctx, lines, "M" + P2(p0) + " Q" + r1(mx + ox / ol * k) + " " + r1(my + oy / ol * k) + " " + P2(p2));
      });
      return H;
    }, o => t("dg.cycleAria", "循环图：{0}，最后回到{1}", (o.nodes || []).map(n => n.name).join(" → "), (o.nodes && o.nodes[0] ? o.nodes[0].name : "")));
  }

  /* =====================================================================
     2. nested 嵌套圈：从里到外一层套一层；宽屏标签在右侧用引线连到每一层，窄屏用编号对照
     layers 按"从里到外"给
     ===================================================================== */
  function nested(target, o) {
    return mount("nested", target, o, (ctx, W) => {
      const L = o.layers || [], n = L.length, z = ctx.z, wide = W >= 560;
      const rings = S("g", { class: "vl-dg-rings" }, ctx.svg);
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
      const ringW = wide ? Math.min(W * 0.5, 420) : W - 8;
      const rxO = ringW / 2 - 4, ryO = rxO * (wide ? 0.74 : 0.7);
      const cx = wide ? ringW / 2 + 4 : W / 2, top = 6, cy = top + ryO + 4;
      const frac = i => (n === 1 ? 1 : 0.36 + 0.64 * i / (n - 1));
      const rx = i => rxO * frac(i), ry = i => ryO * frac(i);
      // 从外往里画，里层盖在外层上面
      for (let i = n - 1; i >= 0; i--) {
        const e = S("ellipse", { class: "vl-dg-ring vl-dg-box", cx: r1(cx), cy: r1(cy), rx: r1(rx(i)), ry: r1(ry(i)), "data-dg-i": i, "data-c": L[i].c || ((i % 6) + 1) }, rings);
        e.setAttribute("aria-hidden", "true");
      }
      // 每层的"锚点"：带子中间（最里层在圆心）
      const anchorY = i => (i === 0 ? cy : cy - (ry(i) + ry(i - 1)) / 2);
      // 旋转小箭头（左侧带子里），表示"每层都在转，越往里越快"。弧长按像素定（约 74px），最里层也看得见
      if (o.spin) for (let i = 0; i < n; i++) {
        const rxm = i === 0 ? rx(0) * 0.6 : (rx(i) + rx(i - 1)) / 2, rym = i === 0 ? ry(0) * 0.6 : (ry(i) + ry(i - 1)) / 2;
        const span = clamp(74 / ((rxm + rym) / 2), 0.4, 2.0), a0 = Math.PI + span / 2, a1 = Math.PI - span / 2;
        const pts = []; for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * k / 16; pts.push(r1(cx + rxm * Math.cos(a)) + " " + r1(cy + rym * Math.sin(a))); }
        arrow(ctx, lines, "M" + pts.join(" L"), "vl-dg-spin");
      }
      let H = cy + ryO + 6;
      if (wide) {
        const lx = cx + rxO + 44, lw = W - lx - 4;
        const blocks = [];
        for (let i = n - 1; i >= 0; i--) {   // 从外到里，自上而下
          const g = S("g", { class: "vl-dg-node vl-dg-lab", "data-dg-i": i, "data-c": L[i].c || ((i % 6) + 1) }, labs);
          const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: L[i].name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: L[i].eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], lw, "start");
          blocks.push({ i, g, tb });
        }
        let y = top;
        blocks.forEach(b => {
          const want = anchorY(b.i) - b.tb.h / 2;
          const y0 = Math.max(y, want);
          b.g.setAttribute("transform", "translate(" + r1(lx) + " " + r1(y0 - b.tb.y) + ")");
          b.top = y0; y = y0 + b.tb.h + 14;
          // 透明的点击区，盖住整块标签
          const hit = S("rect", { class: "vl-dg-hit", x: r1(b.tb.x - 6), y: r1(b.tb.y - 4), width: r1(b.tb.w + 12), height: r1(b.tb.h + 8), fill: "transparent" }, b.g);
          b.g.insertBefore(hit, b.g.firstChild);
          interactive(ctx, b.g, b.i, nodeLabel(L[b.i]));
          const ay = anchorY(b.i), ly = y0 + ctx.z.t1 * 0.55;
          S("circle", { class: "vl-dg-dot", cx: r1(cx), cy: r1(ay), r: 4.5 }, lines);
          line(lines, "M" + r1(cx + 5) + " " + r1(ay) + " H" + r1(cx + rxO + 12) + " L" + r1(lx - 10) + " " + r1(ly), "vl-dg-lead");
        });
        H = Math.max(H, y - 14 + 6);
      } else {
        // 窄屏：每层带子上放一个编号圆，标签按编号列在图下方
        for (let i = 0; i < n; i++) badge(labs, cx, anchorY(i), n - i, i);   // 编号从外到里 1…n
        let y = H + 10;
        for (let i = n - 1; i >= 0; i--) y += numLab(ctx, labs, L[i], i, n - i, y, W - 4) + 14;
        H = y - 14 + 6;
      }
      return H;
    }, o => t("dg.nestedAria", "嵌套图：从里到外依次是 {0}", (o.layers || []).map(n => n.name).join(PU().sep)));
  }

  /* =====================================================================
     3. flow 流程：宽屏一行从左到右，放不下就竖排从上到下
     ===================================================================== */
  function flow(target, o) {
    return mount("flow", target, o, (ctx, W) => {
      const nodes = o.nodes || [], N = nodes.length, m = 6, ag = W < 520 ? 30 : 40;
      const num = o.numbered === true;
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const layer = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      const mwRow = (W - 2 * m - (N - 1) * ag) / N;
      const row = o.dir === "row" || (o.dir !== "column" && mwRow >= 104);
      let ns, H;
      if (row) {
        ns = nodes.map((nd, i) => makeNode(ctx, layer, nd, i, Math.min(220, mwRow), { num }));
        const bh = Math.max(...ns.map(n => n.h));
        ns.forEach(n => { n.h = bh; n.rect.setAttribute("height", r1(bh)); n.rect.setAttribute("y", r1(n.oy - bh / 2)); });
        const total = ns.reduce((s, n) => s + n.w, 0) + (N - 1) * ag;
        let x = (W - total) / 2; H = bh + 2 * m + 4;
        ns.forEach(n => { n.place(x + n.w / 2, H / 2); x += n.w + ag; });
        for (let i = 0; i < N - 1; i++) { const a = ns[i], b = ns[i + 1]; arrow(ctx, lines, "M" + r1(a.cx + a.w / 2 + 5) + " " + r1(a.cy) + " H" + r1(b.cx - b.w / 2 - 7)); }
      } else {
        const bw = Math.min(W - 2 * m, 360);
        ns = nodes.map((nd, i) => makeNode(ctx, layer, nd, i, bw, { num, minW: bw }));
        let y = m; ns.forEach(n => { n.place(W / 2, y + n.h / 2); y += n.h + ag; });
        H = y - ag + m;
        for (let i = 0; i < N - 1; i++) { const a = ns[i], b = ns[i + 1]; arrow(ctx, lines, "M" + r1(W / 2) + " " + r1(a.cy + a.h / 2 + 5) + " V" + r1(b.cy - b.h / 2 - 7)); }
      }
      ns.forEach((n, i) => interactive(ctx, n.g, i, nodeLabel(n.nd)));
      return H;
    }, o => t("dg.flowAria", "流程图：{0}", (o.nodes || []).map(n => n.name).join(" → ")));
  }

  /* =====================================================================
     4. quadrant 象限：两条轴分出四格；quads 顺序 = 左上、右上、左下、右下；可放点 points
     高度按"四角标签放得下 + 留一点给点"算，宽屏不超过 300px
     ===================================================================== */
  function quadrant(target, o) {
    return mount("quadrant", target, Object.assign({ nodes: null }, o), (ctx, W) => {
      const z = ctx.z, X = o.x || {}, Y = o.y || {}, Q = o.quads || [], P = o.points || [], wide = W >= 560;
      const cells = S("g", { class: "vl-dg-cells" }, ctx.svg);
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const txt = S("g", { class: "vl-dg-axes" }, ctx.svg);
      const layer = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      const meas = ctx.meas;
      // 左边距：放得下纵轴两端的字
      const yl = [Y.hi, Y.lo].filter(Boolean).map(s => meas(s, "vl-dg-t3", z.t3));
      const lm = Math.min(W * 0.26, Math.max(18, ...yl) + 16);
      const tm = Y.name ? z.t3 * 1.4 + 12 : 10;
      const px0 = lm, px1 = W - 14, pw = px1 - px0;
      // 先排四格的字，量出最高的一块
      const cw = pw / 2 - 26;
      const labs = Q.map((q, i) => {
        if (!q) return null;
        const g = S("g", { class: "vl-dg-node vl-dg-qlab", "data-dg-i": i }, layer);
        const tb = textBlock(ctx.svg, meas, g, [{ text: q.name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: q.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], cw, i % 2 === 1 ? "end" : "start");
        return { g, tb, q, i };
      });
      const lh = Math.max(20, ...labs.filter(Boolean).map(l => l.tb.h));
      const minPh = 2 * (lh + 24) + (P.length ? 28 : 8);
      const ph = Math.round(wide ? clamp(pw * 0.4, minPh, Math.max(minPh, 300)) : clamp(pw * 0.8, minPh, Math.max(minPh, 340)));
      const py0 = tm, py1 = py0 + ph, mxp = (px0 + px1) / 2, myp = (py0 + py1) / 2;
      const cellR = [[px0, py0, mxp, myp], [mxp, py0, px1, myp], [px0, myp, mxp, py1], [mxp, myp, px1, py1]];
      cellR.forEach((r, i) => { const e = S("rect", { class: "vl-dg-cell vl-dg-box", x: r1(r[0]), y: r1(r[1]), width: r1(r[2] - r[0]), height: r1(r[3] - r[1]), "data-dg-i": i, "data-c": Q[i] && Q[i].c || [1, 2, 4, 3][i] }, cells); e.setAttribute("aria-hidden", "true"); });
      line(lines, "M" + r1(mxp) + " " + r1(py0) + " V" + r1(py1) + " M" + r1(px0) + " " + r1(myp) + " H" + r1(px1), "vl-dg-mid");
      arrow(ctx, lines, "M" + r1(px0) + " " + r1(py1) + " H" + r1(px1 + 6), "vl-dg-axis");
      arrow(ctx, lines, "M" + r1(px0) + " " + r1(py1) + " V" + r1(py0 - 6), "vl-dg-axis");
      const T = (x, y, s, anchor, cls) => { if (!s) return null; const e = S("text", { class: cls || "vl-dg-t3", x: r1(x), y: r1(y), "font-size": z.t3, "text-anchor": anchor || "start" }, txt); e.textContent = s; return e; };
      T(px0 - 10, py0 + z.t3 + 4, Y.hi, "end"); T(px0 - 10, py1 - 6, Y.lo, "end");
      if (Y.name) T(px0 + 10, py0 - 12, Y.name, "start", "vl-dg-t3 vl-dg-axname");
      let by = py1 + z.t3 + 10;
      T(px0 + 2, by, X.lo, "start"); T(px1, by, X.hi, "end");
      if (X.name) { by += z.t3 * 1.5; T(mxp, by, X.name, "middle", "vl-dg-t3 vl-dg-axname"); }
      // 四格的名字放在各自的外角，离轴和中线至少 12px
      labs.forEach(l => {
        if (!l) return;
        const { g, tb, q, i } = l, right = i % 2 === 1, bottom = i >= 2, r = cellR[i];
        const x = right ? r[2] - 12 : r[0] + 14;
        const y = bottom ? r[3] - 12 - tb.h : r[1] + 12;
        g.setAttribute("transform", "translate(" + r1(x) + " " + r1(y - tb.y) + ")");
        const hit = S("rect", { class: "vl-dg-hit", x: r1(tb.x - 4), y: r1(tb.y - 4), width: r1(tb.w + 8), height: r1(tb.h + 8), fill: "transparent" }, g);
        g.insertBefore(hit, g.firstChild);
        interactive(ctx, g, i, nodeLabel(q));
      });
      // 点：x、y 取 0…1（左下为 0）
      P.forEach(p => {
        const x = px0 + clamp(p.x, 0, 1) * pw, y = py1 - clamp(p.y, 0, 1) * ph;
        S("circle", { class: "vl-dg-pt", cx: r1(x), cy: r1(y), r: 6 }, lines);
        if (p.label) { const left = x > px1 - pw * 0.28; T(left ? x - 11 : x + 11, y + 5, p.label, left ? "end" : "start", "vl-dg-t3 vl-dg-ptlab"); }
      });
      return by + 8;
    }, o => t("dg.quadAria", "象限图：横轴是{0}，纵轴是{1}；四格分别是 {2}", (o.x || {}).name || "", (o.y || {}).name || "", (o.quads || []).map(q => q && q.name).filter(Boolean).join(PU().sep)));
  }

  /* =====================================================================
     5. compare 对比两栏：a、b 两个表头 + 若干行（每行一个比较维度 k）
     ===================================================================== */
  function compare(target, o) {
    return mount("compare", target, Object.assign({}, o, { rows: o.rows || [] }), (ctx, W) => {
      const z = ctx.z, A = o.a || {}, B = o.b || {}, R = o.rows || [], gut = 14, cw = (W - gut - 4) / 2;
      const shapes = S("g", { class: "vl-dg-shapes" }, ctx.svg);
      const txt = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      const x0 = 2, x1 = x0 + cw + gut;
      // 表头
      const head = (h, x, side) => {
        const g = S("g", { class: "vl-dg-head", "data-side": side, "data-c": h.c || (side === "a" ? 1 : 2) }, txt);
        const rect = S("rect", { class: "vl-dg-box vl-dg-hbox", rx: 12 }, g);
        const name = (h.mark ? h.mark + " " : "") + (h.name || "");
        const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: h.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], cw - 2 * z.padX);
        return { g, rect, tb };
      };
      const ha = head(A, x0, "a"), hb = head(B, x1, "b");
      const hh = Math.max(ha.tb.h, hb.tb.h) + 2 * z.padY;
      [[ha, x0], [hb, x1]].forEach(([h, x]) => {
        h.rect.setAttribute("x", r1(x)); h.rect.setAttribute("y", 4); h.rect.setAttribute("width", r1(cw)); h.rect.setAttribute("height", r1(hh));
        h.g.querySelector(".vl-dg-txt").setAttribute("transform", "translate(" + r1(x + cw / 2) + " " + r1(4 + hh / 2 - (h.tb.y + h.tb.h / 2)) + ")");
      });
      shapes.appendChild(ha.rect); shapes.appendChild(hb.rect);
      let y = 4 + hh + 12;
      R.forEach((row, i) => {
        const g = S("g", { class: "vl-dg-node vl-dg-row", "data-dg-i": i }, txt);
        let kh = 0;
        if (row.k) {
          const kt = S("text", { class: "vl-dg-t3 vl-dg-k", x: r1(W / 2), y: r1(y + z.t3), "font-size": z.t3, "text-anchor": "middle" }, g);
          kt.textContent = row.k; kh = z.t3 * 1.3 + 8;
        }
        const cy0 = y + kh;
        const cell = (s, x, side) => {
          const rc = S("rect", { class: "vl-dg-box vl-dg-cellbox", "data-side": side, rx: 10, x: r1(x), width: r1(cw) }, g);
          const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: s, cls: "vl-dg-t2", size: z.t2, lh: 1.45 }], cw - 2 * z.padX, "start");
          return { rc, tb, x };
        };
        const ca = cell(row.a, x0, "a"), cb = cell(row.b, x1, "b");
        const ch = Math.max(ca.tb.h, cb.tb.h, z.t2) + 2 * z.padY;
        [ca, cb].forEach(c => {
          c.rc.setAttribute("y", r1(cy0)); c.rc.setAttribute("height", r1(ch));
          c.tb.g.setAttribute("transform", "translate(" + r1(c.x + z.padX) + " " + r1(cy0 + z.padY - c.tb.y) + ")");
        });
        // 透明点击区放在最底下
        const hit = S("rect", { class: "vl-dg-hit", x: 0, y: r1(y - 2), width: r1(W), height: r1(kh + ch + 4), fill: "transparent" }, g);
        g.insertBefore(hit, g.firstChild);
        interactive(ctx, g, i, (row.k ? row.k + PU().colon : "") + (A.name || "") + " " + (row.a || "") + PU().semi + (B.name || "") + " " + (row.b || ""));
        y = cy0 + ch + 12;
      });
      return y - 4;
    }, o => t("dg.cmpAria", "对比图：{0} 和 {1}{2}", (o.a || {}).name || "", (o.b || {}).name || "", (o.rows || []).some(r => r.k) ? t("dg.cmpBy", "，比较 {0}", o.rows.map(r => r.k).filter(Boolean).join(PU().sep)) : ""));
  }

  /* 横轴：箭头 + 两端白话 + 轴名；ticks 给了就按刻度写。返回下一行的 y */
  function axisX(ctx, parent, X, xa, xb, y, pos) {
    const z = ctx.z;
    arrow(ctx, parent, "M" + r1(xa) + " " + r1(y) + " H" + r1(xb), "vl-dg-axis");
    const g = S("g", { class: "vl-dg-axes" }, ctx.svg);
    const T = (x, yy, s, anchor, cls) => { const e = S("text", { class: cls || "vl-dg-t3", x: r1(x), y: r1(yy), "font-size": z.t3, "text-anchor": anchor }, g); e.textContent = s; return e; };
    let by = y + z.t3 + 12;
    if (X.ticks && pos) {
      X.ticks.forEach(tk => {
        const w = ctx.meas(tk.text, "vl-dg-t3", z.t3), x = clamp(pos(tk.at), xa + w / 2 + 2, xb - w / 2 - 8);
        S("path", { class: "vl-dg-tickm", d: "M" + r1(pos(tk.at)) + " " + r1(y - 5) + " V" + r1(y + 5), stroke: "currentColor" }, g);
        T(x, by, tk.text, "middle");
      });
    } else {
      if (X.lo) T(xa, by, X.lo, "start");
      if (X.hi) T(xb - 6, by, X.hi, "end");
    }
    if (X.name) {
      const wn = ctx.meas(X.name, "vl-dg-t3 vl-dg-axname", z.t3), mid = (xa + xb) / 2;
      const wl = !X.ticks && X.lo ? ctx.meas(X.lo, "vl-dg-t3", z.t3) : 0, wh = !X.ticks && X.hi ? ctx.meas(X.hi, "vl-dg-t3", z.t3) : 0;
      if (X.ticks || xa + wl + 16 > mid - wn / 2 || xb - 6 - wh - 16 < mid + wn / 2) by += z.t3 * 1.6;
      T(mid, by, X.name, "middle", "vl-dg-t3 vl-dg-axname");
    }
    return by + 8;
  }

  /* =====================================================================
     6. timeline 时间轴 / 节奏，两种画法：
     · tracks：几条平行轨道，每条一串圆点（一次次行动），星 = 有奖励的那一次（四种强化程序）
     · curve + events：一条起伏曲线 + 关键时刻竖虚线；宽屏标签在图上方分行摆，窄屏改编号对照
     ===================================================================== */
  function timeline(target, o) {
    const items = o.tracks || o.events || [];
    return mount("timeline", target, Object.assign({}, o, { _items: items }), (ctx, W) => (o.tracks ? tlTracks(ctx, W, o) : tlCurve(ctx, W, o)),
      o => (o.tracks
        ? t("dg.tlAria1", "时间轴，{0} 条轨道：{1}", o.tracks.length, o.tracks.map(tr => nodeLabel(tr)).join(PU().semi)) + (o.legend ? PU().stop + o.legend : "")
        : t("dg.tlAria2", "随时间起伏的曲线{0}，关键时刻：{1}", o.demo ? t("dg.demo", "（示意）") : "", (o.events || []).map(e => nodeLabel(e)).join(PU().semi))));
  }
  function tlTracks(ctx, W, o) {
    const z = ctx.z, T = o.tracks, wide = W >= 560;
    const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
    const rows = S("g", { class: "vl-dg-nodes" }, ctx.svg);
    let y = 4;
    if (o.legend) {
      const g = S("g", { class: "vl-dg-legend" }, ctx.svg);
      const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: o.legend, cls: "vl-dg-t3", size: z.t3, lh: 1.45 }], W - 8, "start");
      tb.g.setAttribute("transform", "translate(4 " + r1(y - tb.y) + ")");
      y += tb.h + 18;
    }
    const lw = wide ? Math.min(210, W * 0.27) : W - 8;
    const x0 = wide ? 4 + lw + 26 : 18, x1 = W - 18;
    const pos = p => x0 + clamp(p, 0, 1) * (x1 - x0);
    T.forEach((tr, i) => {
      const g = S("g", { class: "vl-dg-node vl-dg-tr", "data-dg-i": i }, rows);
      const hit = S("rect", { class: "vl-dg-hit", fill: "transparent" }, g);
      const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: tr.name, cls: "vl-dg-t1", size: z.t1, after: 2 }, { text: tr.eg, cls: "vl-dg-t2", size: z.t2, lh: 1.4 }], lw, "start");
      const top = y; let ly, bottom;
      if (wide) { const rh = Math.max(tb.h, 30); tb.g.setAttribute("transform", "translate(4 " + r1(top + (rh - tb.h) / 2 - tb.y) + ")"); ly = top + rh / 2; bottom = top + rh; }
      else { tb.g.setAttribute("transform", "translate(4 " + r1(top - tb.y) + ")"); ly = top + tb.h + 22; bottom = ly + 12; }
      line(g, "M" + r1(x0 - 10) + " " + r1(ly) + " H" + r1(x1 + 10), "vl-dg-trk");
      const dots = typeof tr.dots === "number" ? Array.from({ length: tr.dots }, (_, k) => (k + 0.5) / tr.dots) : (tr.dots || []);
      const hits = tr.hits || [];
      dots.forEach((p, k) => { if (hits.indexOf(k) < 0) S("circle", { class: "vl-dg-tick", cx: r1(pos(p)), cy: r1(ly), r: 5, fill: "currentColor" }, g); });
      dots.forEach((p, k) => { if (hits.indexOf(k) >= 0) S("path", { class: "vl-dg-star", d: starPath(pos(p), ly - 1, 12), fill: "currentColor" }, g); });   // 星画在点上面
      hit.setAttribute("x", 0); hit.setAttribute("y", r1(top - 6)); hit.setAttribute("width", W); hit.setAttribute("height", r1(bottom - top + 12));
      interactive(ctx, g, i, nodeLabel(tr));
      y = bottom + (wide ? 20 : 22);
    });
    if (o.x) y = axisX(ctx, lines, o.x, x0 - 10, x1 + 10, y - 6, pos);
    return y;
  }
  function tlCurve(ctx, W, o) {
    const z = ctx.z, X = Object.assign({}, o.x || {}), Y = o.y || {}, E = o.events || [], C = o.curve || [], wide = W >= 560;
    if (o.demo) X.name = (X.name || "") + t("dg.demo", "（示意）");
    const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
    const marks = S("g", { class: "vl-dg-marks" }, ctx.svg);
    const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
    const yl = [Y.hi, Y.lo].filter(Boolean).map(s => ctx.meas(s, "vl-dg-t3", z.t3));
    const px0 = yl.length ? Math.min(W * 0.24, Math.max(...yl) + 16) : 12, px1 = W - 14, pw = px1 - px0;
    const xs = e => px0 + 8 + clamp(e.at, 0, 1) * (pw - 16);
    // 宽屏：标签排在图上方（最多三行）；排不下或窄屏就用编号
    let mode = "num", placed = null, blocks = [], nRows = 0;
    if (wide && E.length) {
      const bw = clamp(pw / E.length * 1.7 - 12, 100, 180);
      blocks = E.map((e, i) => label(ctx, labs, e, i, bw, "middle"));
      placed = rowPlace(blocks.map((b, i) => ({ x: xs(E[i]), w: b.w })), 4, W - 4, 14, 4);
      nRows = Math.max(...placed.map(p => p.row)) + 1;
      if (nRows <= 3) mode = "lab"; else { blocks.forEach(b => b.g.remove()); blocks = []; }
    }
    const rh = blocks.length ? Math.max(...blocks.map(b => b.h)) + 14 : 0;
    const topH = mode === "lab" ? nRows * rh + 8 : (E.length ? 58 : 8);
    const py0 = 4 + topH, ph = Math.round(wide ? clamp(pw * 0.26, 130, 200) : clamp(pw * 0.5, 130, 190)), py1 = py0 + ph;
    const cy = v => py1 - 10 - clamp(v, 0, 1) * (ph - 20);
    arrow(ctx, lines, "M" + r1(px0) + " " + r1(py1) + " V" + r1(py0 - 2), "vl-dg-axis");
    const ty = S("g", { class: "vl-dg-axes" }, ctx.svg);
    const T = (x, y, s, anchor) => { if (!s) return; const e = S("text", { class: "vl-dg-t3", x: r1(x), y: r1(y), "font-size": z.t3, "text-anchor": anchor }, ty); e.textContent = s; };
    T(px0 - 10, py0 + z.t3 + 4, Y.hi, "end"); T(px0 - 10, py1 - 8, Y.lo, "end");
    let curveAt = null;
    if (C.length > 1) {
      const pts = C.map((v, k) => [px0 + 8 + k / (C.length - 1) * (pw - 16), cy(v)]);
      const pe = line(marks, smooth(pts), "vl-dg-curve");
      const L = pe.getTotalLength();
      curveAt = x => { let lo = 0, hi = L; for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (pe.getPointAtLength(mid).x < x) lo = mid; else hi = mid; } return pe.getPointAtLength(lo).y; };
    }
    const bRow = [], last = [-99, -99];
    E.map((e, i) => i).sort((a, b) => E[a].at - E[b].at).forEach(i => { const x = xs(E[i]); bRow[i] = x - last[0] >= 30 || x - last[1] < 30 ? 0 : 1; last[bRow[i]] = x; });
    E.forEach((e, i) => {
      const x = xs(e);
      let y0;
      if (mode === "lab") {
        const p = placed[i], b = blocks[i], bottom = py0 - 10 - p.row * rh;
        b.put(p.cx, bottom - b.h);
        y0 = bottom + 5;
      } else {
        const by = py0 - 18 - bRow[i] * 27;
        badge(marks, x, by, i + 1, i);
        y0 = by + 14;
      }
      line(marks, "M" + r1(x) + " " + r1(y0) + " V" + r1(py1), "vl-dg-evln", { "data-dg-i": i });
      if (curveAt) S("circle", { class: "vl-dg-pt", cx: r1(x), cy: r1(curveAt(x)), r: 6, "data-dg-i": i }, marks);
    });
    let y = axisX(ctx, lines, X, px0, px1 + 2, py1, p => px0 + 8 + clamp(p, 0, 1) * (pw - 16));
    if (mode === "num" && E.length) y = numList(ctx, labs, E.map((e, i) => ({ it: e, i, k: i + 1 })), y + 4, W) + 6;
    return y;
  }

  /* =====================================================================
     7. tree 树 / 分类：宽屏根在上、同层对齐；放不下就竖排缩进（像文件夹）。边上可写 edge（概率、条件）
     一个节点的孩子超过 max（默认 5）个，多出来的折成"还有 N 种"
     ===================================================================== */
  function tree(target, o) {
    const flat = [], MAXC = o.max || 5;
    (function walk(nd, depth, parent) {
      const me = { nd, depth, parent, kids: [], i: flat.length }; flat.push(me);
      if (parent) parent.kids.push(me);
      let ch = nd.children || [];
      if (ch.length > MAXC) { const rest = ch.slice(MAXC - 1); ch = ch.slice(0, MAXC - 1).concat([{ name: t("dg.more", "还有 {0} 种", rest.length), eg: rest.map(c => c.name).join(PU().sep), more: true }]); }
      ch.forEach(c => walk(c, depth + 1, me));
    })(o.root || {}, 0, null);
    const say = f => (f.nd.name || "") + (f.kids.length ? paren(t("dg.treeSplit", "分成 {0}", f.kids.map(say).join(PU().sep))) : "");
    return mount("tree", target, Object.assign({}, o, { _items: flat.map(f => f.nd) }), (ctx, W) => {
      const z = ctx.z, D = Math.max(...flat.map(f => f.depth));
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const elabs = S("g", { class: "vl-dg-elabs" }, ctx.svg);
      const layer = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      let ns = null, H;
      if (o.dir !== "indent") for (let mw = Math.min(200, W * 0.4); mw >= 96; mw -= 14) {
        layer.innerHTML = "";
        const cand = flat.map(f => makeNode(ctx, layer, f.nd, f.i, mw, {}));
        const sw = f => (f.sw = f.kids.length ? Math.max(cand[f.i].w, f.kids.reduce((s, k) => s + sw(k), 0) + 16 * (f.kids.length - 1)) : cand[f.i].w);
        if (sw(flat[0]) <= W - 8) { ns = cand; break; }
      }
      if (ns) {
        // ---- 自上而下 ----
        const xpos = (f, left) => {
          const n = ns[f.i];
          if (!f.kids.length) { n.cx = left + f.sw / 2; return; }
          const kw = f.kids.reduce((s, k) => s + k.sw, 0) + 16 * (f.kids.length - 1);
          let x = left + (f.sw - kw) / 2;
          f.kids.forEach(k => { xpos(k, x); x += k.sw + 16; });
          n.cx = (ns[f.kids[0].i].cx + ns[f.kids[f.kids.length - 1].i].cx) / 2;
        };
        xpos(flat[0], (W - flat[0].sw) / 2);
        // 边上的字：同一层从左到右排，写在竖线右边，挤就挪到左边
        const lab = {};
        for (let d = 1; d <= D; d++) {
          const row = flat.filter(f => f.depth === d);
          let used = 4;
          row.forEach((f, k) => {
            if (!f.nd.edge) return;
            const cx = ns[f.i].cx, nextX = k < row.length - 1 ? ns[row[k + 1].i].cx - 7 : W - 4, prevX = Math.max(k > 0 ? ns[row[k - 1].i].cx + 7 : 4, used + 8);
            const rightRoom = nextX - (cx + 7), leftRoom = (cx - 7) - prevX;
            const wNat = ctx.meas(f.nd.edge, "vl-dg-t3 vl-dg-et", z.t3);
            const useRight = rightRoom >= Math.min(wNat, 130) || rightRoom >= leftRoom;
            const g = S("g", { class: "vl-dg-elab", "data-dg-i": f.i }, elabs);
            const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: f.nd.edge, cls: "vl-dg-t3 vl-dg-et", size: z.t3, lh: 1.3 }], Math.max(42, Math.min(130, useRight ? rightRoom : leftRoom)), useRight ? "start" : "end");
            lab[f.i] = { g, tb, x: useRight ? cx + 7 : cx - 7 };
            used = useRight ? cx + 7 + tb.w : cx - 7;
          });
        }
        const lvH = [], elH = [];
        flat.forEach(f => { lvH[f.depth] = Math.max(lvH[f.depth] || 0, ns[f.i].h); if (lab[f.i]) elH[f.depth] = Math.max(elH[f.depth] || 0, lab[f.i].tb.h); });
        const top = [4], bus = [];
        for (let d = 1; d <= D; d++) { bus[d] = top[d - 1] + lvH[d - 1] + 16; top[d] = bus[d] + (elH[d] ? elH[d] + 16 : 18); }
        flat.forEach(f => ns[f.i].place(ns[f.i].cx, top[f.depth] + lvH[f.depth] / 2));
        flat.forEach(f => {
          if (!f.kids.length) return;
          const p = ns[f.i], by = bus[f.depth + 1], a = ns[f.kids[0].i], b = ns[f.kids[f.kids.length - 1].i];
          let d = "M" + r1(p.cx) + " " + r1(p.cy + p.h / 2) + " V" + r1(by);
          if (f.kids.length > 1) d += " M" + r1(a.cx) + " " + r1(by) + " H" + r1(b.cx);
          f.kids.forEach(k => { const c = ns[k.i]; d += " M" + r1(c.cx) + " " + r1(by) + " V" + r1(c.cy - c.h / 2); });
          line(lines, d, "vl-dg-branch");
          f.kids.forEach(k => {
            const L = lab[k.i]; if (!L) return;
            const c = ns[k.i], ct = c.cy - c.h / 2, tp = by + (ct - by - L.tb.h) / 2;
            L.g.setAttribute("transform", "translate(" + r1(L.x) + " " + r1(tp - L.tb.y) + ")");
          });
        });
        H = top[D] + lvH[D] + 6;
      } else {
        // ---- 竖排缩进 ----
        layer.innerHTML = "";
        const ind = 30, nn = [];
        let y = 4;
        flat.forEach(f => {
          const x = 4 + f.depth * ind;
          if (f.parent && f.nd.edge) {
            const g = S("g", { class: "vl-dg-elab", "data-dg-i": f.i }, elabs);
            const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: f.nd.edge, cls: "vl-dg-t3 vl-dg-et", size: z.t3, lh: 1.3 }], W - x - 8, "start");
            g.setAttribute("transform", "translate(" + r1(x + 4) + " " + r1(y - tb.y) + ")");
            y += tb.h + 6;
          }
          const n = makeNode(ctx, layer, f.nd, f.i, W - 4 - x, {});
          n.place(x + n.w / 2, y + n.h / 2); nn[f.i] = n; y += n.h + 12;
        });
        flat.forEach(f => {
          if (!f.kids.length) return;
          const p = nn[f.i], tx = p.cx - p.w / 2 + 14, last = nn[f.kids[f.kids.length - 1].i];
          let d = "M" + r1(tx) + " " + r1(p.cy + p.h / 2) + " V" + r1(last.cy);
          f.kids.forEach(k => { const c = nn[k.i]; d += " M" + r1(tx) + " " + r1(c.cy) + " H" + r1(c.cx - c.w / 2); });
          line(lines, d, "vl-dg-branch");
        });
        ns = nn; H = y - 12 + 6;
      }
      ns.forEach((n, i) => { interactive(ctx, n.g, i, nodeLabel(n.nd)); if (flat[i].nd.more) n.rect.classList.add("vl-dg-ghost"); });
      // 选中一个节点：它到根的路径和它的孩子保持清楚
      ctx.onPaint = sel => {
        const near = new Set();
        if (sel >= 0) { for (let f = flat[sel].parent; f; f = f.parent) near.add(f.i); flat[sel].kids.forEach(k => near.add(k.i)); near.add(sel); }
        ns.forEach((n, i) => n.g.classList.toggle("is-near", near.has(i) && i !== sel));
        elabs.querySelectorAll(".vl-dg-elab").forEach(e => { const i = +e.getAttribute("data-dg-i"); e.classList.toggle("is-near", near.has(i)); });
      };
      return H;
    }, () => t("dg.treeAria", "树状图：{0}", say(flat[0])));
  }

  /* =====================================================================
     8. venn 维恩图：2–3 个圈；每个区域里写一个具体例子（放不下就放编号，图下对照）；圈名在圈外用引线
     regions: [{in:[0,1], eg, name, info}]，in 写这个区域在哪几个圈里（下标从 0 起）
     ===================================================================== */
  function venn(target, o) {
    const sets = (o.sets || []).slice(0, 3), regs = o.regions || [];
    const items = regs.concat(sets), st = {};
    const maskOf = r => (r.in || []).reduce((m, k) => m | (1 << k), 0);
    const memb = (C, x, y) => C.reduce((m, c, k) => m | ((x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) < c.r * c.r ? 1 << k : 0), 0);
    const marg = (C, x, y) => Math.min(...C.map(c => Math.abs(Math.hypot(x - c.x, y - c.y) - c.r)));
    // 在区域里找一个放得下 w×h（四周再留 5px）的中心点：从"离所有圈边最远"的点开始试
    function fitIn(C, mask, w, h) {
      const W2 = w / 2 + 5, H2 = h / 2 + 5, need = Math.min(W2, H2);
      const xa = Math.min(...C.map(c => c.x - c.r)), xb = Math.max(...C.map(c => c.x + c.r)), ya = Math.min(...C.map(c => c.y - c.r)), yb = Math.max(...C.map(c => c.y + c.r));
      const cand = [];
      for (let x = xa; x <= xb; x += 4) for (let y = ya; y <= yb; y += 4) { if (memb(C, x, y) !== mask) continue; const m = marg(C, x, y); if (m >= need) cand.push([m, x, y]); }
      cand.sort((a, b) => b[0] - a[0]);
      const sx = [], sy = [];
      for (let s = -W2; s < W2; s += 4) sx.push(s); sx.push(W2);
      for (let s = -H2; s < H2; s += 4) sy.push(s); sy.push(H2);
      for (let q = 0; q < Math.min(cand.length, 400); q++) {
        const x = cand[q][1], y = cand[q][2];
        if (sx.every(s => memb(C, x + s, y - H2) === mask && memb(C, x + s, y + H2) === mask) && sy.every(s => memb(C, x - W2, y + s) === mask && memb(C, x + W2, y + s) === mask)) return [x, y];
      }
      return null;
    }
    const regText = r => r.eg || r.name || "";
    const setNames = r => (r.in || []).map(k => sets[k] && sets[k].name).filter(Boolean).join(" ∩ ");
    return mount("venn", target, Object.assign({}, o, {
      _items: items,
      _setup: api => api.svg.addEventListener("click", e => {
        if (e.target.closest("[data-dg-i]") || !st.hit) return;
        const m = api.svg.getScreenCTM(); if (!m) return;
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
        const k = st.hit(p.x, p.y); if (k >= 0) st.ctx.choose(k, true);
      }),
    }), (ctx, W) => {
      st.ctx = ctx;
      const z = ctx.z, n = sets.length, wide = W >= 560;
      const gH = S("g", { class: "vl-dg-vregs" }, ctx.svg);
      const gC = S("g", { class: "vl-dg-vsets" }, ctx.svg);
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
      const natW = s => Math.min(160, Math.max(ctx.meas(s.name || "", "vl-dg-t1", z.t1), ctx.meas(s.eg || "", "vl-dg-t2", z.t2)));
      // 宽屏：前两个圈的名字放在左右两侧（第三个圈的名字在下方）；放不下才挪到上方
      let side = wide;
      let Rmax = side ? Math.min(n === 2 ? 112 : 116, (W - 2 * (Math.max(natW(sets[0]), natW(sets[1])) + 44) - 8) / 3) : 0;
      if (side && Rmax < 84) side = false;
      if (!side) Rmax = Math.min(wide ? 116 : 130, (W - 8) / 3);
      const Rmin = wide ? Math.min(Rmax, 84) : Rmax;
      const anchorOf = k => (k === 2 ? "middle" : side ? (k ? "start" : "end") : (k ? "end" : "start"));
      const sl = sets.map((s, k) => label(ctx, labs, s, regs.length + k, k === 2 ? W - 8 : side ? 160 : W / 2 - 14, anchorOf(k)));
      const top0 = side ? 6 : Math.max(sl[0].h, sl[1] ? sl[1].h : 0) + 4 + 26;
      const geo = R => (n === 2 ? [{ x: W / 2 - R / 2, y: 0 }, { x: W / 2 + R / 2, y: 0 }] : [{ x: W / 2 - R / 2, y: 0 }, { x: W / 2 + R / 2, y: 0 }, { x: W / 2, y: R * 0.866 }]).map(c => ({ x: c.x, y: c.y + top0 + R, r: R }));
      // 量每个区域的字：几种折行宽度
      const widths = wide ? [150, 124, 100, 82, 66, 52] : [130, 108, 90, 74, 60, 48];
      // 只在标点、空格、"、"处断行；某一宽度下有一段放不下就跳过这个宽度；先试正常字号，再试小一档
      const fsz = [z.t2, z.t2 - 1.5];
      const dims = regs.map(r => {
        const opts = [];
        fsz.forEach(sz => widths.forEach(wv => {
          const lns = wrapPhrase(ctx.meas, regText(r), "vl-dg-t2 vl-dg-vt", sz, wv); if (!lns) return;
          const key = sz + "|" + lns.join("\n"); if (opts.some(q => q.key === key)) return;
          const g = S("g", null, labs); const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: regText(r), lines: lns, cls: "vl-dg-t2 vl-dg-vt", size: sz, lh: 1.35 }], wv, "middle"); g.remove();
          opts.push({ key, lns, sz, w: tb.w, h: tb.h });
        }));
        return opts;
      });
      let best = null;
      for (let R = Rmin; R <= Rmax + 0.1; R += 8) {
        const C = geo(R);
        const res = regs.map((r, i) => { const mask = maskOf(r); for (const d of dims[i]) { const p = fitIn(C, mask, d.w, d.h); if (p) return { d, p }; } return null; });
        best = { C, res };
        if (res.every(Boolean)) break;
      }
      const { C, res } = best;
      // 高亮用的区域形状：第一个圈，被其余"在内"的圈裁剪，再用遮罩挖掉"不在内"的圈
      C.forEach((c, k) => { const cp = S("clipPath", { id: "vl-vc" + ctx.uid + "-" + k }, ctx.defs); S("circle", { cx: r1(c.x), cy: r1(c.y), r: r1(c.r) }, cp); });
      regs.forEach((r, i) => {
        const ins = (r.in || []).filter(k => k < n); if (!ins.length) return;
        const mid = "vl-vm" + ctx.uid + "-" + i;
        const mk = S("mask", { id: mid, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: 3000 }, ctx.defs);
        S("rect", { x: 0, y: 0, width: W, height: 3000, fill: "#fff" }, mk);
        C.forEach((c, k) => { if (ins.indexOf(k) < 0) S("circle", { cx: r1(c.x), cy: r1(c.y), r: r1(c.r), fill: "#000" }, mk); });
        let par = gH;
        ins.slice(1).forEach(k => { par = S("g", { "clip-path": "url(#vl-vc" + ctx.uid + "-" + k + ")" }, par); });
        const c0 = C[ins[0]];
        S("circle", { class: "vl-dg-vreg", "data-vr": i, cx: r1(c0.x), cy: r1(c0.y), r: r1(c0.r), mask: "url(#" + mid + ")", fill: "transparent" }, par);
      });
      C.forEach((c, k) => S("circle", { class: "vl-dg-box vl-dg-vset", "data-vs": k, "data-c": sets[k].c || [2, 3, 1][k], cx: r1(c.x), cy: r1(c.y), r: r1(c.r), fill: "none", stroke: "currentColor" }, gC));
      // 区域里的例子；放不下的给编号
      const numbered = [];
      res.forEach((rr, i) => {
        if (rr) {
          const g = S("g", { class: "vl-dg-node vl-dg-vlab", "data-dg-i": i }, labs);
          const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: regText(regs[i]), lines: rr.d.lns, cls: "vl-dg-t2 vl-dg-vt", size: rr.d.sz, lh: 1.35 }], 9999, "middle");
          g.setAttribute("transform", "translate(" + r1(rr.p[0] - (tb.x + tb.w / 2)) + " " + r1(rr.p[1] - (tb.y + tb.h / 2)) + ")");
          const hit = S("rect", { class: "vl-dg-hit", x: r1(tb.x - 4), y: r1(tb.y - 3), width: r1(tb.w + 8), height: r1(tb.h + 6), fill: "transparent" });
          g.insertBefore(hit, g.firstChild);
          interactive(ctx, g, i, (setNames(regs[i]) ? setNames(regs[i]) + PU().colon : "") + regText(regs[i]));
        } else {
          const p = fitIn(C, maskOf(regs[i]), 24, 24) || fitIn(C, maskOf(regs[i]), 14, 14);
          numbered.push(i);
          if (p) badge(labs, p[0], p[1], numbered.length, i);
        }
      });
      // 圈名在圈外，引线连到圈边
      const attach = k => { const c = C[k], a = k === 2 ? Math.PI / 2 : side ? (n === 2 ? (k ? 0 : Math.PI) : (k ? -0.44 : Math.PI + 0.44)) : (k ? -Math.PI / 3 : -2 * Math.PI / 3); return [c.x + c.r * Math.cos(a), c.y + c.r * Math.sin(a)]; };
      sl.forEach((L, k) => {
        const a = attach(k);
        if (side && k < 2) { L.put(k ? a[0] + 28 : a[0] - 28, a[1] - L.h / 2); line(lines, "M" + P2(a) + " H" + r1(k ? L.l - 7 : L.r + 7), "vl-dg-lead"); }
        else if (k === 2) { L.put(W / 2, a[1] + 24); line(lines, "M" + P2(a) + " V" + r1(L.t - 6), "vl-dg-lead"); }
        else { L.put(k ? W - 4 : 4, 4); const lx = clamp(a[0], L.l + 10, L.r - 10); line(lines, "M" + r1(lx) + " " + r1(L.b + 6) + " L" + P2(a), "vl-dg-lead"); }
        S("circle", { class: "vl-dg-dot", cx: r1(a[0]), cy: r1(a[1]), r: 4 }, lines);
      });
      let H = Math.max(...C.map(c => c.y + c.r)) + 8;
      sl.forEach(L => { H = Math.max(H, L.b + 6); });
      if (numbered.length) {
        H = numList(ctx, labs, numbered.map((i, q) => { const r = regs[i]; return { it: { name: r.name || setNames(r), eg: regText(r) === r.name ? "" : regText(r) }, i, k: q + 1 }; }), H + 8, W) + 6;
      }
      st.hit = (x, y) => { const m = memb(C, x, y); return m ? regs.findIndex(r => maskOf(r) === m) : -1; };
      ctx.onPaint = sel => {
        gH.querySelectorAll(".vl-dg-vreg").forEach(e => e.classList.toggle("is-on", +e.getAttribute("data-vr") === sel));
        gC.querySelectorAll(".vl-dg-vset").forEach(e => e.classList.toggle("is-on", +e.getAttribute("data-vs") === sel - regs.length));
      };
      return H;
    }, o => t("dg.vennAria", "维恩图：{0} 个圈，{1}。{2}", sets.length, sets.map(s => s.name).join(PU().sep), regs.map(r => (setNames(r) || "") + PU().colon + regText(r)).join(PU().semi)));
  }

  /* =====================================================================
     9. balance 天平：左右两盘各放几个砝码，横梁按 tilt（−1 左沉 … +1 右沉）倾斜；可带滑块做成活图
     ===================================================================== */
  function balance(target, o) {
    const Ls = o.left || {}, Rs = o.right || {}, Pv = o.pivot;
    const items = [Ls, Rs].concat(Pv ? [Pv] : []);
    const sl = o.slider ? Object.assign({ min: 0, max: 100, step: 1 }, o.slider) : null;
    const fromSlider = v => clamp(-1 + 2 * (v - sl.min) / ((sl.max - sl.min) || 1), -1, 1);
    const st = {
      cur: sl ? fromSlider(sl.value != null ? +sl.value : (sl.min + sl.max) / 2)
        : o.tilt != null ? clamp(+o.tilt, -1, 1)
        : Ls.value != null && Rs.value != null ? clamp((Rs.value - Ls.value) / ((Math.abs(Ls.value) + Math.abs(Rs.value)) || 1) * 1.5, -1, 1) : 0,
    };
    const setTilt = (v, anim) => {
      v = clamp(+v || 0, -1, 1);
      const from = st.cur; st.cur = v;
      if (o.onTilt) try { o.onTilt(v); } catch (e) { console.error(e); }
      if (!st.apply) return;
      cancelAnimationFrame(st.raf);
      if (st.rng && (v < st.rng[0] - 1e-6 || v > st.rng[1] + 1e-6) && st.redraw) { st.redraw(); return; }   // 超出预留的高度：按新范围重画
      if (!anim || !motionOK()) { st.apply(v); return; }
      const t0 = performance.now(), dur = 380;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); st.apply(from + (v - from) * e); if (k < 1) st.raf = requestAnimationFrame(step); };
      st.raf = requestAnimationFrame(step);
    };
    const api = mount("balance", target, Object.assign({}, o, {
      _items: items,
      _setup: (a, ctx) => {
        if (!sl) return;
        const lab = document.createElement("label"); lab.className = "vl-ctl vl-dg-ctl";
        lab.innerHTML = VLesc(sl.label || t("dg.balSlider", "拖动看看天平怎么倾斜")) + " <output></output><input type=\"range\">";
        const inp = lab.querySelector("input"), out = lab.querySelector("output");
        inp.min = sl.min; inp.max = sl.max; inp.step = sl.step; inp.value = sl.value != null ? sl.value : (sl.min + sl.max) / 2;
        const show = () => { out.textContent = inp.value + (sl.unit || ""); };
        show();
        inp.addEventListener("input", () => { show(); setTilt(fromSlider(+inp.value), false); if (o.onSlide) try { o.onSlide(+inp.value); } catch (e) { console.error(e); } });
        ctx.wrap.insertBefore(lab, ctx.info || null);
      },
    }), (ctx, W) => {
      const z = ctx.z, wide = W >= 560, cx = W / 2;
      // 最大倾角 12°，但梁端最多抬 40px（宽屏梁长，12° 会抬得很高、上方空一大片）
      const Lb = wide ? Math.min(W * 0.6, 480) : W - 70, Lh = Lb / 2, TH = Math.min(12 * Math.PI / 180, Math.asin(Math.min(1, 40 / Lh))), amp = Lh * Math.sin(TH);
      // 实际会转到的范围：有滑块就是全程，否则只到当前角度（api.tilt 超出时会重画）
      st.rng = sl ? [-1, 1] : [Math.min(0, st.cur, st.rng ? st.rng[0] : 0), Math.max(0, st.cur, st.rng ? st.rng[1] : 0)];
      const upL = Lh * Math.sin(TH * Math.max(0, st.rng[1])), upR = Lh * Math.sin(TH * Math.max(0, -st.rng[0]));   // 左盘、右盘最多抬多高
      const dnL = upR, dnR = upL;   // 一边抬多高，另一边就沉多深
      const gBase = S("g", { class: "vl-dg-baseg" }, ctx.svg);
      const gBeam = S("g", { class: "vl-dg-beamg" }, ctx.svg);
      const gPans = S("g", { class: "vl-dg-pans" }, ctx.svg);
      const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
      // 一个盘：先量砝码，再按盘宽算出"盘要抬多高才不碰到斜着的横梁"
      const mkPan = (side, idx, c) => {
        const g = S("g", { class: "vl-dg-node vl-dg-pang", "data-dg-i": idx }, gPans);
        const dish = S("path", { class: "vl-dg-box vl-dg-pan", "data-c": c, fill: "none", stroke: "currentColor" }, g);
        const post = line(g, "", "vl-dg-post");
        const maxw = Math.min(150, Lb * 0.42);
        let pw = 64;
        const ws = (side.weights || []).map(w => (typeof w === "string" ? { name: w } : w)).map(w => {
          const bg = S("g", { class: "vl-dg-wt", "data-c": w.c || c }, g);
          const rc = S("rect", { class: "vl-dg-box vl-dg-wtbox", rx: 7, fill: "none", stroke: "currentColor" }, bg);
          const tb = textBlock(ctx.svg, ctx.meas, bg, [{ text: w.name, cls: "vl-dg-t2 vl-dg-wtt", size: z.t2 }], maxw - 22, "middle");
          const bw = tb.w + 22, bh = tb.h + 12; pw = Math.max(pw, bw + 18);
          return { rc, tb, bw, bh };
        });
        const lift = pw / 2 * Math.tan(TH) + 10, dTop = -lift - 10;
        dish.setAttribute("d", "M" + r1(-pw / 2) + " " + r1(dTop) + " H" + r1(pw / 2) + " L" + r1(pw / 2 - 9) + " " + r1(-lift) + " H" + r1(-pw / 2 + 9) + " Z");
        post.setAttribute("d", "M0 " + r1(-lift) + " V2");
        let y = dTop - 3;
        ws.forEach(w => {
          w.rc.setAttribute("x", r1(-w.bw / 2)); w.rc.setAttribute("y", r1(y - w.bh)); w.rc.setAttribute("width", r1(w.bw)); w.rc.setAttribute("height", r1(w.bh));
          w.tb.g.setAttribute("transform", "translate(0 " + r1(y - w.bh + 6 - w.tb.y) + ")");
          y -= w.bh + 4;
        });
        return { g, h: -y, pw };
      };
      const PL = mkPan(Ls, 0, Ls.c || 2), PR = mkPan(Rs, 1, Rs.c || 3);
      const py = 4 + Math.max(PL.h + upL, PR.h + upR) + 2;
      line(gBeam, "M" + r1(cx - Lh) + " " + r1(py) + " H" + r1(cx + Lh), "vl-dg-beam");
      S("path", { class: "vl-dg-box vl-dg-fulcrum", d: "M" + r1(cx) + " " + r1(py + 3) + " L" + r1(cx + 24) + " " + r1(py + 40) + " H" + r1(cx - 24) + " Z", "data-dg-i": Pv ? 2 : null, "data-c": Pv && Pv.c || 1, fill: "none", stroke: "currentColor" }, gBase);
      line(gBase, "M" + r1(cx - 46) + " " + r1(py + 41) + " H" + r1(cx + 46), "vl-dg-base");
      // 两边的名字：宽屏放在各自那一端的正下方，窄屏贴左右边
      const endX = cx - Lh, mid = (endX - 4) * 2 >= 150;
      const sw = mid ? Math.min((endX - 4) * 2, (Lh - 52) * 2) : cx - 54;
      const LL = label(ctx, labs, Ls, 0, sw, mid ? "middle" : "start").put(mid ? endX : 4, py + dnL + 18);
      const LR = label(ctx, labs, Rs, 1, sw, mid ? "middle" : "end").put(mid ? W - endX : W - 4, py + dnR + 18);
      let H = Math.max(LL.b, LR.b, py + 41) + 8;
      if (Pv) {
        // 支点说明紧贴底座下方，引线只有一小段；和两边的名字撞了才挪到它们下面
        const ptop = py + 41 + 20, hit = L => rectHit(L, LL, 10) || rectHit(L, LR, 10);
        let PLb = label(ctx, labs, Pv, 2, Math.min(W - 8, 340), "middle").put(cx, ptop);
        const room = Math.min(LR.l - cx, cx - LL.r) * 2 - 24;
        if (hit(PLb) && room >= 96) { PLb.g.remove(); PLb = label(ctx, labs, Pv, 2, room, "middle").put(cx, ptop); }
        if (hit(PLb)) PLb.put(cx, Math.max(LL.b, LR.b) + 16);
        line(gBase, "M" + r1(cx) + " " + r1(py + 47) + " V" + r1(PLb.t - 5), "vl-dg-lead");
        H = Math.max(H, PLb.b + 6);
      }
      st.apply = v => {
        const th = v * TH;
        gBeam.setAttribute("transform", "rotate(" + r1(th * 180 / Math.PI) + " " + r1(cx) + " " + r1(py) + ")");
        PL.g.setAttribute("transform", "translate(" + r1(cx - Lh * Math.cos(th)) + " " + r1(py - Lh * Math.sin(th)) + ")");
        PR.g.setAttribute("transform", "translate(" + r1(cx + Lh * Math.cos(th)) + " " + r1(py + Lh * Math.sin(th)) + ")");
        ctx.wrap.classList.toggle("is-level", Math.abs(v) < 0.06);
      };
      st.apply(st.cur);
      return H;
    }, o => t("dg.balAria", "天平：左边 {0}，右边 {1}{2}", nodeLabel(Ls) + ((Ls.weights || []).length ? paren(Ls.weights.map(w => w.name || w).join(PU().sep)) : ""), nodeLabel(Rs) + ((Rs.weights || []).length ? paren(Rs.weights.map(w => w.name || w).join(PU().sep)) : ""), Pv ? PU().semi + t("dg.balPivot", "支点") + PU().colon + nodeLabel(Pv) : ""));
    if (api) { st.redraw = api.redraw; api.tilt = v => setTilt(v, true); Object.defineProperty(api, "tiltValue", { get: () => st.cur }); }
    return api;
  }

  /* =====================================================================
     10. network 网络 / 关系：节点手排位置（x、y 取 0…1，窄屏可另给 nx、ny），边分"导致 / 相关 / 互相影响"，
     线型 + 箭头区分，边上可写字（线在字那里断开）；点一个节点只亮它和邻居
     ===================================================================== */
  function network(target, o) {
    const N = o.nodes || [], E = o.edges || [];
    const id = {}; N.forEach((n, i) => { id[n.id != null ? n.id : n.name] = i; });
    const kindName = k => ({ cause: t("dg.netCause", "导致"), link: t("dg.netLink", "相关"), both: t("dg.netBoth", "互相影响") }[k] || k);
    const nb = N.map(() => []);
    E.forEach(e => { const a = id[e.from], b = id[e.to]; if (a == null || b == null) return; nb[a].push(b); nb[b].push(a); });
    const items = N.map((n, i) => (n.info ? n : Object.assign({}, n, { info: "<b>" + VLesc(n.name || "") + "</b>" + (n.eg ? PU().gap + VLesc(n.eg) : "") + (nb[i].length ? "<br>" + t("dg.netLinks", "连着：{0}", nb[i].map(j => VLesc(N[j].name)).join(PU().sep)) : "") })));
    return mount("network", target, Object.assign({}, o, { _items: items }), (ctx, W) => {
      const z = ctx.z, wide = W >= 560;
      const gE = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const gL = S("g", { class: "vl-dg-elabs" }, ctx.svg);
      const layer = S("g", { class: "vl-dg-nodes" }, ctx.svg);
      const maxW = wide ? Math.min(180, W * 0.25) : Math.min(150, W * 0.42);
      const ns = N.map((nd, i) => { const n = makeNode(ctx, layer, nd, i, maxW, {}); if (nd.main) n.g.classList.add("vl-dg-main"); return n; });
      const others = N.map((n, i) => i).filter(i => !N[i].main);
      const P = (nd, i) => {
        if (!wide && nd.nx != null) return [nd.nx, nd.ny];
        if (nd.x != null) return [nd.x, nd.y];
        if (nd.main) return [0.5, 0.5];
        // 没给位置时绕中心排一圈；偶数个时转半格，避开和中心同一高度（窄屏会横向挤）
        const k = others.length, a = -Math.PI / 2 + (k % 2 ? 0 : Math.PI / k) + 2 * Math.PI * others.indexOf(i) / k; return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)];
      };
      let H = Math.round(W * (o.aspect || (wide ? 0.46 : 1.1)));
      for (let tr = 0; tr < 8; tr++) {   // 有框叠在一起就把图拉高一点（最多约 2 倍）
        ns.forEach((n, i) => { const p = P(N[i], i); n.cx = n.w / 2 + 4 + clamp(p[0], 0, 1) * (W - n.w - 8); n.cy = n.h / 2 + 4 + clamp(p[1], 0, 1) * (H - n.h - 8); });
        let bad = false;
        for (let i = 0; i < ns.length && !bad; i++) for (let j = i + 1; j < ns.length; j++) if (overlap(ns[i], ns[j], 26)) { bad = true; break; }
        if (!bad) break;
        H = Math.round(H * 1.1);
      }
      // 还挤（比如窄屏两个框在同一高度）：两两推开，框与框之间至少留 12px；横向挪不动就上下推，图跟着变高
      const GAP = 12;
      for (let it = 0; it < 80; it++) {
        let moved = false;
        for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i], b = ns[j]; if (!overlap(a, b, GAP)) continue;
          moved = true;
          const dx = b.cx - a.cx, dy = b.cy - a.cy;
          const px = (a.w + b.w) / 2 + GAP - Math.abs(dx), py = (a.h + b.h) / 2 + GAP - Math.abs(dy);
          if (px < py) {
            const s = dx >= 0 ? 1 : -1;
            const ax = clamp(a.cx - s * px / 2, a.w / 2 + 4, W - a.w / 2 - 4), bx = clamp(b.cx + s * px / 2, b.w / 2 + 4, W - b.w / 2 - 4);
            if (Math.abs(bx - ax) >= (a.w + b.w) / 2 + GAP - 0.5) { a.cx = ax; b.cx = bx; continue; }
          }
          const s = dy > 0 || (dy === 0 && j > i) ? 1 : -1;
          a.cy = Math.max(a.h / 2 + 4, a.cy - s * py / 2); b.cy += s * py / 2;
          if (Math.abs(b.cy - a.cy) < (a.h + b.h) / 2 + GAP) b.cy = a.cy + s * ((a.h + b.h) / 2 + GAP);
          if (b.cy < b.h / 2 + 4) { const d = b.h / 2 + 4 - b.cy; b.cy += d; a.cy += d; }
        }
        if (!moved) break;
      }
      H = Math.ceil(Math.max(...ns.map(n => n.cy + n.h / 2)) + 4);   // 高度贴着最下面的框，不留空白
      ns.forEach(n => n.place(n.cx, n.cy));
      const boxR = n => ({ l: n.cx - n.w / 2, r: n.cx + n.w / 2, t: n.cy - n.h / 2, b: n.cy + n.h / 2 });
      const segs = [];
      E.forEach((e, k) => {
        const ai = id[e.from], bi = id[e.to]; if (ai == null || bi == null) return;
        const a = ns[ai], b = ns[bi], dx = b.cx - a.cx, dy = b.cy - a.cy, kind = e.kind || "cause";
        segs.push({ e, k, ai, bi, kind, p0: edge(a, dx, dy, kind === "both" ? 8 : 6), p1: edge(b, -dx, -dy, kind === "link" ? 6 : 8) });
      });
      // 边上的字：先试线段中点，挤了就沿线挪；不能压到别的框、别的字、别的线
      const taken = ns.map(boxR);
      segs.forEach(s => {
        if (!s.e.label) return;
        const g = S("g", { class: "vl-dg-elab", "data-e": s.k }, gL);
        const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: s.e.label, cls: "vl-dg-t3 vl-dg-et", size: z.t3, lh: 1.3 }], wide ? 120 : 96, "middle");
        const len = Math.hypot(s.p1[0] - s.p0[0], s.p1[1] - s.p0[1]);
        let best = null;
        for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73]) {
          const c = lerp(s.p0, s.p1, tt), rc = { l: c[0] - tb.w / 2 - 5, r: c[0] + tb.w / 2 + 5, t: c[1] - tb.h / 2 - 5, b: c[1] + tb.h / 2 + 5 };
          if (rc.l < 0 || rc.r > W || rc.t < 0 || rc.b > H) continue;
          // 字两边的线段都要留够 18px（箭头看得见），否则就是太挤
          const cut = clipSeg(s.p0, s.p1, rc);
          if (cut && (cut[0] * len < 18 || (1 - cut[1]) * len < 18)) continue;
          if (!taken.some(q => rectHit(rc, q, 2)) && !segs.some(q => q !== s && clipSeg(q.p0, q.p1, rc))) { best = { c, rc }; break; }
        }
        if (!best) { g.remove(); s.off = true; return; }   // 放不下：不画在线上，改在图下列出
        g.setAttribute("transform", "translate(" + r1(best.c[0] - tb.x - tb.w / 2) + " " + r1(best.c[1] - tb.y - tb.h / 2) + ")");
        s.lab = best.rc; taken.push(best.rc);
      });
      segs.forEach(s => {
        const g = S("g", { class: "vl-dg-edgeg", "data-e": s.k }, gE);
        const cls = "vl-dg-edge" + (s.kind === "link" ? " vl-dg-weak" : "");
        let pieces = [[s.p0, s.p1]];
        if (s.lab) { const c = clipSeg(s.p0, s.p1, s.lab); if (c) pieces = [[s.p0, lerp(s.p0, s.p1, c[0])], [lerp(s.p0, s.p1, c[1]), s.p1]]; }
        pieces.forEach((pc, q) => {
          if (Math.hypot(pc[1][0] - pc[0][0], pc[1][1] - pc[0][1]) < 2) return;
          const at = {};
          if (q === pieces.length - 1 && s.kind !== "link") at["marker-end"] = ctx.mk;
          if (q === 0 && s.kind === "both") at["marker-start"] = ctx.mk;
          line(g, "M" + P2(pc[0]) + " L" + P2(pc[1]), cls, at);
        });
      });
      // 图例：用到两种以上的边才画
      const kinds = [...new Set(segs.map(s => s.kind))];
      if (o.legend !== false && (kinds.length > 1 || o.legend)) {
        let y = H + 10, x = 4;
        const gLg = S("g", { class: "vl-dg-legend" }, ctx.svg);
        kinds.forEach(k => {
          const txt = kindName(k), tw = ctx.meas(txt, "vl-dg-t3", z.t3);
          const sw = k === "both" ? 46 : 32;
          if (x + sw + 12 + tw > W - 4) { x = 4; y += z.t3 + 16; }
          const at = {}; if (k !== "link") at["marker-end"] = ctx.mk; if (k === "both") at["marker-start"] = ctx.mk;
          line(gLg, "M" + r1(x + 2) + " " + r1(y + z.t3 * 0.6) + " H" + r1(x + sw), "vl-dg-edge" + (k === "link" ? " vl-dg-weak" : ""), at);
          const te = S("text", { class: "vl-dg-t3", x: r1(x + sw + 12), y: r1(y + z.t3), "font-size": z.t3 }, gLg); te.textContent = txt;
          x += sw + 12 + tw + 26;
        });
        H = y + z.t3 + 10;
      }
      // 线上放不下的边标签：图下逐条列出"A → B：标签"
      const off = segs.filter(s => s.off);
      if (off.length) {
        let y = H + 4;
        off.forEach(s => {
          const arrowTxt = s.kind === "link" ? " — " : s.kind === "both" ? " ↔ " : " → ";
          const g = S("g", { class: "vl-dg-elab vl-dg-elist", "data-e": s.k }, gL);
          const tb = textBlock(ctx.svg, ctx.meas, g, [{ text: N[s.ai].name + arrowTxt + N[s.bi].name + PU().colon + s.e.label, cls: "vl-dg-t3 vl-dg-et", size: z.t3, lh: 1.35 }], W - 8, "start");
          g.setAttribute("transform", "translate(4 " + r1(y - tb.y) + ")");
          y += tb.h + 8;
        });
        H = y + 2;
      }
      ns.forEach((n, i) => interactive(ctx, n.g, i, nodeLabel(n.nd)));
      ctx.onPaint = sel => {
        const near = new Set(sel >= 0 ? nb[sel] : []);
        ns.forEach((n, i) => n.g.classList.toggle("is-near", near.has(i)));
        ctx.svg.querySelectorAll(".vl-dg-edgeg,.vl-dg-elab").forEach(g => { const s = segs.find(q => q.k === +g.getAttribute("data-e")); g.classList.toggle("is-near", !!s && (s.ai === sel || s.bi === sel)); });
      };
      return H;
    }, o => t("dg.netAria", "关系图：{0}", E.map(e => { const a = N[id[e.from]], b = N[id[e.to]]; return a && b ? a.name + (e.kind === "link" ? t("dg.netAnd", " 和 ") : e.kind === "both" ? t("dg.netWith", " 与 ") : " → ") + b.name + (e.label ? paren(e.label) : e.kind === "link" || e.kind === "both" ? (EN() ? paren(kindName(e.kind)) : kindName(e.kind)) : "") : ""; }).filter(Boolean).join(PU().semi)));
  }

  /* =====================================================================
     11. spectrum 光谱轴：一条粗轴，两端写白话极端；实例按 at（0…1）挂在轴上，名字 + 例子用引线垂下
     宽屏横轴（标签分行避让），窄屏竖轴（标签在右）
     ===================================================================== */
  function spectrum(target, o) {
    const I = o.items || [];
    return mount("spectrum", target, Object.assign({}, o, { _items: I }), (ctx, W) => {
      const z = ctx.z, wide = W >= 560, lo = o.lo || {}, hi = o.hi || {};
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
      let y = 4;
      if (o.name) { const te = S("text", { class: "vl-dg-t3 vl-dg-axname", x: wide ? W / 2 : 4, y: r1(y + z.t3), "font-size": z.t3, "text-anchor": wide ? "middle" : "start" }, labs); te.textContent = o.name; y += z.t3 + 14; }
      const dot = (x, yy, i) => S("circle", { class: "vl-dg-sdot", cx: r1(x), cy: r1(yy), r: 7, fill: "#fff", stroke: "currentColor", "data-dg-i": i }, lines);
      const both = { "marker-start": ctx.mk, "marker-end": ctx.mk };
      if (wide) {
        const ew = Math.min(220, W * 0.32);
        const A = label(ctx, labs, lo, -1, ew, "start", "vl-dg-end").put(6, y), B = label(ctx, labs, hi, -1, ew, "end", "vl-dg-end").put(W - 6, y);   // 离边 6px：英文末字母的字形会略出排版宽度
        const ay = Math.max(A.b, B.b) + 22, x0 = 12, x1 = W - 12;
        line(lines, "M" + r1(x0) + " " + r1(ay) + " H" + r1(x1), "vl-dg-spec", both);
        const bw = clamp((x1 - x0) / Math.max(1, I.length) * 1.6 - 12, 100, 180);
        const bl = I.map((it, i) => label(ctx, labs, it, i, bw, "middle"));
        const xs = I.map(it => x0 + 24 + clamp(it.at, 0, 1) * (x1 - x0 - 48));
        const pl = rowPlace(bl.map((b, i) => ({ x: xs[i], w: b.w })), 6, W - 6, 14, 6);
        const rh = Math.max(20, ...bl.map(b => b.h)) + 16;
        let bottom = ay + 10;
        pl.forEach((p, i) => {
          const top = ay + 26 + p.row * rh;
          bl[i].put(p.cx, top);
          line(lines, "M" + r1(xs[i]) + " " + r1(ay + 10) + " V" + r1(top - 6), "vl-dg-lead", { "data-dg-i": i });
          dot(xs[i], ay, i);
          bottom = Math.max(bottom, bl[i].b);
        });
        return bottom + 8;
      }
      // 窄屏：竖轴在左，上端 lo、下端 hi，实例标签在右边从上往下推开
      const ax = 20, lx = ax + 30;
      const A = label(ctx, labs, lo, -1, W - 8, "start", "vl-dg-end").put(4, y);
      const y0 = A.b + 18;
      const bl = I.map((it, i) => label(ctx, labs, it, i, W - lx - 4, "start"));
      const len = Math.max(230, bl.reduce((s, b) => s + b.h + 14, 0) + 44);
      const dy = i => y0 + 26 + clamp(I[i].at, 0, 1) * (len - 52);
      const order = I.map((_, i) => i).sort((a, b) => I[a].at - I[b].at);
      let cur = y0;
      order.forEach(i => { const top = Math.max(cur, dy(i) - z.t1 * 0.6); bl[i].put(lx, top); cur = top + bl[i].h + 14; });
      const y1 = Math.max(y0 + len, cur - 10);
      line(lines, "M" + ax + " " + r1(y0) + " V" + r1(y1), "vl-dg-spec", both);
      order.forEach(i => {
        const yy = dy(i), ly = bl[i].t + Math.min(z.t1 * 0.55, bl[i].h / 2);
        line(lines, "M" + (ax + 10) + " " + r1(yy) + " L" + (lx - 7) + " " + r1(ly), "vl-dg-lead", { "data-dg-i": i });
        dot(ax, yy, i);
      });
      const B = label(ctx, labs, hi, -1, W - 8, "start", "vl-dg-end").put(4, y1 + 18);
      return B.b + 6;
    }, o => t("dg.specAria", "光谱轴{0}：从「{1}」到「{2}」，依次是 {3}", o.name ? paren(o.name) : "", (o.lo || {}).name || "", (o.hi || {}).name || "", I.slice().sort((a, b) => a.at - b.at).map(i => i.name).join(PU().sep)));
  }

  /* =====================================================================
     12. stack 层叠 / 堆积：底层在下；每层的名字 + 例子在右侧图外用引线；给了 value 就按比例定高度
     ===================================================================== */
  function stack(target, o) {
    const Ls = o.layers || [];
    return mount("stack", target, Object.assign({}, o, { _items: Ls }), (ctx, W) => {
      const z = ctx.z, wide = W >= 560, n = Ls.length, unit = o.unit || "";
      const blocks = S("g", { class: "vl-dg-blocks" }, ctx.svg);
      const lines = S("g", { class: "vl-dg-lines" }, ctx.svg);
      const labs = S("g", { class: "vl-dg-labels" }, ctx.svg);
      const colW = wide ? Math.min(200, W * 0.28) : Math.min(116, W * 0.33);
      const x0 = wide ? Math.round(W * 0.05) : 4, x1 = x0 + colW;
      const lx = x1 + (wide ? 56 : 30), lw = W - lx - 4;
      let y = 4;
      if (o.total) {
        const tt = typeof o.total === "string" ? { name: o.total } : o.total;
        const T = label(ctx, labs, tt, -1, W - 8 - x0, "start", "vl-dg-total").put(x0, y);
        y = T.b + 10;
        line(lines, "M" + r1(x0 + 2) + " " + r1(y + 9) + " V" + r1(y) + " H" + r1(x1 - 2) + " V" + r1(y + 9), "vl-dg-brace");
        y += 15;
      }
      const hasV = Ls.some(l => l.value != null);
      const L = Ls.map((it, i) => label(ctx, labs, { name: (it.name || "") + (it.value != null ? PU().gap + it.value + unit : ""), eg: it.eg }, i, lw, "start"));
      const sum = Ls.reduce((s, l) => s + Math.abs(+l.value || 0), 0) || 1, Htot = wide ? 240 : 250;
      const hs = Ls.map((it, i) => (hasV ? Math.max(30, Math.abs(+it.value || 0) / sum * Htot) : Math.max(44, L[i].h + 10)));
      const colTop = y, cyOf = [];
      let yy = colTop;
      for (let i = n - 1; i >= 0; i--) {   // 从上往下画：最上面是最后一层
        const g = S("g", { class: "vl-dg-node vl-dg-blk", "data-dg-i": i }, blocks);
        S("rect", { class: "vl-dg-box", "data-c": Ls[i].c || (i % 6) + 1, x: r1(x0), y: r1(yy), width: r1(colW), height: r1(hs[i]), rx: 4, fill: "none", stroke: "currentColor" }, g);
        cyOf[i] = yy + hs[i] / 2; yy += hs[i];
      }
      let cur = colTop, bottom = yy;
      for (let i = n - 1; i >= 0; i--) {
        const top = Math.max(cur, cyOf[i] - Math.min(z.t1 * 0.6, L[i].h / 2));
        L[i].put(lx, top); cur = top + L[i].h + 12;
        const ly = top + Math.min(z.t1 * 0.55, L[i].h / 2);
        line(lines, "M" + r1(x1 + 6) + " " + r1(cyOf[i]) + " H" + r1(x1 + 14) + " L" + r1(lx - 8) + " " + r1(ly), "vl-dg-lead", { "data-dg-i": i });
        bottom = Math.max(bottom, L[i].b);
      }
      return bottom + 6;
    }, o => t("dg.stackAria", "层叠图：从下到上依次是 {0}{1}", Ls.map(l => l.name + (l.value != null ? " " + l.value + (o.unit || "") : "")).join(PU().sep), o.total ? t("dg.stackTotal", "，合起来是{0}", typeof o.total === "string" ? o.total : o.total.name) : ""));
  }


  VL.diagram = { cycle, nested, flow, quadrant, compare, timeline, tree, venn, balance, network, spectrum, stack };

  /* ---------- 声明式写法：<figure class="vl-fig" data-diagram="cycle"><script type="application/json">{…}</script><figcaption>…</figcaption></figure> ---------- */
  function auto() {
    document.querySelectorAll("[data-diagram]").forEach(f => {
      if (f._vlDiagram) return;
      const type = f.dataset.diagram, fn = VL.diagram[type];
      const js = f.querySelector(':scope > script[type="application/json"]');
      if (!fn || !js) return;
      try { fn(f, JSON.parse(js.textContent)); } catch (e) { console.error("[VL] 图解数据有误：", type, e); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
  VL.diagram.auto = auto;
})();
