/* course-kit · vl-plot.js —— 活图 VL.plot：柱状图、折线图（可混排）、坐标轴、参考线 / 标注点、高亮柱子。
   放在 vl.js 之后（需要 window.VL）；样式在 vl-plot.css。按需加载：不用它的课不引这两个文件，别的组件不受影响。
   为什么这样画：viewBox 宽 = 容器真实像素宽（ResizeObserver 跟着重设），字号是固定像素，手机上字不会被等比缩小；
   窄了就少画刻度、隔几个写一个类别名，标签不重叠。颜色只用皮肤变量（vl-plot.css 里的 --vp-*）。
   没有重画过渡：拖滑块时直接画终态，所以"减少动态"下也没有要关的动画。API 见 kit/README.md"活图 VL.plot"。 */
(function () {
  "use strict";
  const VL = window.VL;
  if (!VL || VL.plot) return;
  const doc = document, LANG = VL.lang || "zh";
  const esc = VL.esc || (s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const zh = LANG !== "en";
  const isNum = v => typeof v === "number" && isFinite(v);
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const DASH = ["", "7 5", "2 5", "10 4 2 4"];
  const SHAPES = ["circle", "square", "diamond", "triangle"];

  /* ---------- 好看的刻度：步长取 1 / 2 / 5 × 10^n ---------- */
  function niceStep(raw) {
    if (!(raw > 0) || !isFinite(raw)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }
  const nextStep = s => { const p = Math.pow(10, Math.floor(Math.log10(s) + 1e-9)), m = Math.round(s / p); return (m < 2 ? 2 : m < 5 ? 5 : 10) * p; };
  // 刻度值：从 lo 到 hi 之间所有 step 的整数倍；用整数下标乘回去，避免 0.1+0.2 这类误差
  function tickVals(lo, hi, step) {
    const out = [], a = Math.ceil(lo / step - 1e-9), b = Math.floor(hi / step + 1e-9);
    for (let k = a; k <= b && out.length < 200; k++) out.push(+(k * step).toPrecision(12));
    return out;
  }
  const decOf = step => Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
  function fmtNum(v, step) {
    if (!isNum(v)) return "";
    const d = step ? decOf(step) : (Math.abs(v) >= 100 ? 0 : 2);
    let s = (+v.toFixed(d)).toString();
    if (Math.abs(v) >= 10000 && !/e/.test(s)) { const [i, f] = s.split("."); s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : ""); }
    return s;
  }

  /* ---------- 量字宽：canvas measureText，拿不到就按字符估 ---------- */
  let cv = null;
  function measurer(family, px) {
    try { if (!cv) cv = doc.createElement("canvas").getContext("2d"); } catch (e) { cv = null; }
    const font = px + "px " + (family || "sans-serif");
    return s => {
      s = String(s);
      if (cv) { cv.font = font; const w = cv.measureText(s).width; if (w > 0) return w; }
      let w = 0; for (const ch of s) w += /[⺀-￿]/.test(ch) ? px : px * 0.6; return w;
    };
  }

  /* ---------- 数据规整：series.data 可以是 [y, y, …]（x = 下标）或 [[x, y], …]；null 表示缺口 ---------- */
  function points(s) {
    const d = Array.isArray(s.data) ? s.data : [];
    return d.map((v, i) => Array.isArray(v) ? { x: +v[0], y: v[1] == null ? null : +v[1], i } : (v && typeof v === "object" && "y" in v) ? { x: v.x == null ? i : +v.x, y: v.y == null ? null : +v.y, i } : { x: i, y: v == null ? null : +v, i })
      .map(p => ({ x: p.x, y: isNum(p.y) ? p.y : null, i: p.i })).filter(p => isNum(p.x));
  }

  function marker(shape, x, y, r, attrs) {
    if (shape === "square") return '<rect x="' + f1(x - r) + '" y="' + f1(y - r) + '" width="' + f1(2 * r) + '" height="' + f1(2 * r) + '"' + attrs + "/>";
    if (shape === "diamond") return '<path d="M' + f1(x) + " " + f1(y - r * 1.3) + "L" + f1(x + r * 1.3) + " " + f1(y) + "L" + f1(x) + " " + f1(y + r * 1.3) + "L" + f1(x - r * 1.3) + " " + f1(y) + 'Z"' + attrs + "/>";
    if (shape === "triangle") return '<path d="M' + f1(x) + " " + f1(y - r * 1.3) + "L" + f1(x + r * 1.2) + " " + f1(y + r * 0.9) + "L" + f1(x - r * 1.2) + " " + f1(y + r * 0.9) + 'Z"' + attrs + "/>";
    return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '"' + attrs + "/>";
  }

  function plot(target, opts) {
    const root = typeof target === "string" ? doc.querySelector(target) : target;
    if (!root) { console.warn("VL.plot：找不到容器", target); return null; }
    if (root._vlPlot) { root._vlPlot.set(opts || {}); return root._vlPlot; }
    let o = Object.assign({}, opts || {});
    o.x = Object.assign({}, o.x); o.y = Object.assign({}, o.y);
    o.series = (o.series || []).map(s => Object.assign({}, s));
    const uid = "vp" + Math.random().toString(36).slice(2, 8);

    root.classList.add("vl-plot");
    if (window.VL_SKIN && VL_SKIN.name) root.dataset.skin = VL_SKIN.name;
    root.innerHTML = '<div class="vl-plot-head"><span class="vl-plot-ylab"></span><ul class="vl-plot-key"></ul></div>' +
      '<svg class="vl-plot-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg><div class="vl-plot-xlab"></div>';
    const head = root.querySelector(".vl-plot-head"), ylabEl = root.querySelector(".vl-plot-ylab"), keyEl = root.querySelector(".vl-plot-key");
    const svg = root.querySelector("svg"), xlabEl = root.querySelector(".vl-plot-xlab");

    const typeOf = s => s.type || o.type || "line";
    const colorOf = (s, k) => s.color || "var(--q" + (k % 6 + 1) + ")";

    function legend() {
      const showKey = o.legend === true || (o.legend !== false && o.series.length > 1);
      let li = 0, bi = 0;
      keyEl.innerHTML = showKey ? o.series.map((s, k) => {
        const c = colorOf(s, k);
        let sw;
        if (typeOf(s) === "bar") { const j = bi++; sw = '<rect x="5" y="1" width="12" height="12" style="fill:' + c + '" class="vl-plot-bar"/>' + (j ? '<rect x="5" y="1" width="12" height="12" fill="url(#' + uid + "h" + ((j - 1) % 3) + ')"/>' : ""); }
        else { const j = li++, dash = s.dash === false ? "" : typeof s.dash === "string" ? s.dash : s.dash === true ? "7 5" : DASH[j % 4]; sw = '<line x1="1" y1="7" x2="21" y2="7" class="vl-plot-line" style="stroke:' + c + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>" + marker(SHAPES[j % 4], 11, 7, 3.5, ' class="vl-plot-dot" style="fill:' + c + '"'); }
        return '<li><svg class="vl-plot-sw" viewBox="0 0 22 14" width="22" height="14" aria-hidden="true">' + sw + "</svg>" + esc(s.name || "") + "</li>";
      }).join("") : "";
      ylabEl.textContent = o.y.label || "";
      xlabEl.textContent = o.x.label || "";
      head.hidden = !o.y.label && !showKey;
      xlabEl.hidden = !o.x.label;
    }

    function autoAria(ser) {
      const kind = ser.every(s => typeOf(s) === "bar") ? (zh ? "柱状图" : "Bar chart") : ser.every(s => typeOf(s) !== "bar") ? (zh ? "折线图" : "Line chart") : (zh ? "柱状图和折线图" : "Bar and line chart");
      let t = kind + (zh ? "。" : ". ");
      if (o.y.label) t += (zh ? "纵轴：" : "Vertical axis: ") + o.y.label + (zh ? "；" : ". ");
      if (o.x.label) t += (zh ? "横轴：" : "Horizontal axis: ") + o.x.label + (zh ? "。" : ". ");
      ser.forEach(s => {
        const ys = points(s).filter(p => p.y != null).map(p => fmtNum(p.y));
        if (!ys.length) return;
        const more = ys.length > 20 ? (zh ? "……共 " + ys.length + " 个" : "… " + ys.length + " in all") : "";
        t += (s.name ? s.name + (zh ? "：" : ": ") : "") + ys.slice(0, 20).join(zh ? "、" : ", ") + more + (zh ? "。" : ". ");
      });
      return t.trim();
    }

    let lastW = 0;
    function draw() {
      const cs = getComputedStyle(root);
      const fs = parseFloat(cs.getPropertyValue("--vp-fs")) || 14, fsT = parseFloat(cs.getPropertyValue("--vp-fs-txt")) || fs;
      const mNum = measurer(cs.getPropertyValue("--vp-font-num").trim(), fs), mTxt = measurer(cs.getPropertyValue("--vp-font-txt").trim(), fsT);
      const W = Math.max(200, Math.round(svg.getBoundingClientRect().width || root.clientWidth || 600)), H = Math.max(120, Math.round(o.height || 220));
      lastW = W;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("height", H);
      svg.style.height = H + "px";

      const ser = o.series, pts = ser.map(points);
      const bars = ser.map((s, k) => k).filter(k => typeOf(ser[k]) === "bar");
      const marks = (o.marks || []).filter(m => m && (isNum(m.x) || isNum(m.y)));
      const fx = o.x.fmt || (v => fmtNum(v)), fyUser = o.y.fmt;
      // 横轴：有柱子或给了 cats 就是"类别轴"（每个下标一格），否则是数值轴
      const band = bars.length > 0 || Array.isArray(o.x.cats);
      const nBand = band ? Math.max(1, Array.isArray(o.x.cats) ? o.x.cats.length : o.x.n || Math.max(1, ...pts.map(p => p.length ? Math.max(...p.map(q => q.i)) + 1 : 0))) : 0;

      // 纵轴范围
      const ys = []; pts.forEach(p => p.forEach(q => { if (q.y != null) ys.push(q.y); })); marks.forEach(m => { if (isNum(m.y)) ys.push(m.y); });
      const zero = o.y.zero !== false;
      let lo = ys.length ? Math.min(...ys) : 0, hi = ys.length ? Math.max(...ys) : 1;
      if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      const fixLo = isNum(o.y.min), fixHi = isNum(o.y.max);
      if (fixLo) lo = o.y.min; if (fixHi) hi = o.y.max;
      if (hi <= lo) { if (fixHi && !fixLo) lo = hi - 1; else hi = lo + (Math.abs(lo) || 1); }
      const valLab = ser.some(s => s.labels);
      const top = 8 + (valLab ? fs + 6 : 0) + Math.round(fs * 0.5), bottom = fs + 12, plotH = Math.max(40, H - top - bottom);
      let yStep = niceStep((hi - lo) / Math.max(2, Math.floor(plotH / (fs * 2.8))));
      if (!fixLo) lo = Math.floor(lo / yStep + 1e-9) * yStep;
      if (!fixHi) hi = Math.ceil(hi / yStep - 1e-9) * yStep;
      if (hi <= lo) hi = lo + yStep;
      let yTicks = Array.isArray(o.y.ticks) ? o.y.ticks.map(t => Array.isArray(t) ? { v: +t[0], t: String(t[1]) } : { v: +t, t: null }) : tickVals(lo, hi, yStep).map(v => ({ v, t: null }));
      const fy = v => fyUser ? fyUser(v) : (Array.isArray(o.y.ticks) ? fmtNum(v) : fmtNum(v, yStep));
      yTicks = yTicks.filter(t => isNum(t.v) && t.v >= lo - 1e-9 && t.v <= hi + 1e-9).map(t => ({ v: t.v, t: t.t != null ? t.t : fy(t.v) }));
      const yHidden = o.y.hidden === true;
      const X0 = yHidden ? 6 : Math.ceil(Math.max(0, ...yTicks.map(t => mNum(t.t)))) + 10;
      const Y0 = top + plotH, sy = v => Y0 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * plotH;

      // 横轴刻度
      let right = 8, sx, xT = [], xMin = 0, xMax = 1, step = 0;
      if (band) {
        const plotW = Math.max(40, W - X0 - right); step = plotW / nBand;
        sx = i => X0 + step * (i + 0.5);
        const labs = [];
        for (let i = 0; i < nBand; i++) labs.push(Array.isArray(o.x.cats) ? String(o.x.cats[i]) : String(fx(i + (+o.x.from || 0))));
        const mw = Math.max(1, ...labs.map(mNum)), kSkip = Math.max(1, Math.ceil((mw + fs * 0.8) / step));
        xT = labs.map((t, i) => ({ p: sx(i), t })).filter((_, i) => i % kSkip === 0);
      } else {
        const xs = []; pts.forEach(p => p.forEach(q => xs.push(q.x))); marks.forEach(m => { if (isNum(m.x)) xs.push(m.x); });
        xMin = isNum(o.x.min) ? o.x.min : xs.length ? Math.min(...xs) : 0; xMax = isNum(o.x.max) ? o.x.max : xs.length ? Math.max(...xs) : 1;
        if (xMax <= xMin) { xMax = xMin + 1; }
        let cand;
        if (Array.isArray(o.x.ticks)) cand = o.x.ticks.map(t => Array.isArray(t) ? { v: +t[0], t: String(t[1]) } : { v: +t, t: String(fx(+t)) }).filter(t => isNum(t.v) && t.v >= xMin && t.v <= xMax);
        else {
          let s = niceStep((xMax - xMin) / Math.max(1, Math.floor((W - X0) / 64)));
          for (let g = 0; g < 30; g++) {
            const vs = tickVals(xMin, xMax, s), ls = vs.map(v => String(o.x.fmt ? o.x.fmt(v) : fmtNum(v, s)));
            const mw = Math.max(1, ...ls.map(mNum));
            if ((mw + fs) * vs.length <= W - X0 - 8 || vs.length <= 2) { cand = vs.map((v, i) => ({ v, t: ls[i] })); break; }
            s = nextStep(s);
          }
          cand = cand || [];
        }
        const lastT = cand.length ? cand[cand.length - 1] : null;
        if (lastT && Math.abs(lastT.v - xMax) < (xMax - xMin) * 1e-6) right = Math.max(8, Math.ceil(mNum(lastT.t) / 2) + 2);
        const plotW = Math.max(40, W - X0 - right);
        sx = v => X0 + (Math.max(xMin, Math.min(xMax, v)) - xMin) / (xMax - xMin) * plotW;
        // 贪心去掉会撞上前一个的标签（自定义刻度也照此办）
        let lastR = -1e9;
        cand.forEach(t => { const p = sx(t.v), w = mNum(t.t); if (p - w / 2 >= lastR + fs * 0.5) { xT.push({ p, t: t.t }); lastR = p + w / 2; } });
      }
      const XR = W - right, xHidden = o.x.hidden === true;
      const yBase = sy(Math.max(lo, Math.min(hi, 0)));
      const his = new Set([].concat(o.hi == null ? [] : o.hi).filter(isNum));

      let s = '<defs>' + [45, -45, 0].map((a, j) => '<pattern id="' + uid + "h" + j + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(' + a + ')"><line x1="0" y1="0" x2="0" y2="6" class="vl-plot-hatch"/></pattern>').join("") + "</defs>";
      // 网格与纵轴刻度
      if (!yHidden) yTicks.forEach(t => {
        const y = f1(sy(t.v));
        s += '<line x1="' + X0 + '" y1="' + y + '" x2="' + XR + '" y2="' + y + '" class="vl-plot-grid"/>';
        s += '<text x="' + (X0 - 6) + '" y="' + f1(sy(t.v) + fs * 0.35) + '" text-anchor="end" class="vl-plot-tick">' + esc(t.t) + "</text>";
      });
      // 柱子
      if (bars.length && band) {
        const groupW = Math.min(step * 0.74, bars.length * 44), bw = groupW / bars.length;
        bars.forEach((k, j) => {
          const sr = ser[k], c = colorOf(sr, k);
          pts[k].forEach(q => {
            if (q.y == null || q.i >= nBand) return;
            const x = sx(q.i) - groupW / 2 + j * bw, y1 = sy(q.y), yT = Math.min(y1, yBase), h = Math.abs(yBase - y1);
            const hiC = his.has(q.i) ? " is-hi" : "";
            const geo = ' x="' + f1(x + 0.5) + '" y="' + f1(yT) + '" width="' + f1(Math.max(1, bw - 1)) + '" height="' + f1(h) + '"';
            s += "<rect" + geo + ' class="vl-plot-bar' + hiC + '" style="fill:' + (hiC ? "var(--vp-hi)" : c) + '"><title>' + esc((sr.name ? sr.name + " " : "") + fmtNum(q.y)) + "</title></rect>";
            if (j) s += "<rect" + geo + ' fill="url(#' + uid + "h" + ((j - 1) % 3) + ')" pointer-events="none"/>';
          });
        });
      }
      // 线（类别轴上点在格子中间）
      let li = 0;
      ser.forEach((sr, k) => {
        if (typeOf(sr) === "bar") return;
        const j = li++, c = colorOf(sr, k), P = band ? (q => sx(q.i)) : (q => sx(q.x));
        const dash = sr.dash === false ? "" : typeof sr.dash === "string" ? sr.dash : sr.dash === true ? "7 5" : DASH[j % 4];
        const ps = pts[k].filter(q => !band || q.i < nBand);
        const runs = []; let run = [];
        ps.forEach(q => { if (q.y == null) { if (run.length) runs.push(run); run = []; } else run.push([P(q), sy(q.y), q]); });
        if (run.length) runs.push(run);
        runs.forEach(r => {
          if (sr.fill && r.length > 1) s += '<path d="M' + r.map(p => f1(p[0]) + " " + f1(p[1])).join("L") + "L" + f1(r[r.length - 1][0]) + " " + f1(yBase) + "L" + f1(r[0][0]) + " " + f1(yBase) + 'Z" class="vl-plot-area" style="fill:' + c + '"/>';
          if (r.length > 1) s += '<polyline points="' + r.map(p => f1(p[0]) + "," + f1(p[1])).join(" ") + '" class="vl-plot-line" style="stroke:' + c + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
        });
        const dots = sr.dots != null ? sr.dots : ps.length <= 24;
        runs.forEach(r => r.forEach(p => {
          const isHi = his.has(p[2].i);
          if (dots || isHi || r.length === 1) s += marker(SHAPES[j % 4], p[0], p[1], isHi ? 6 : 4, ' class="vl-plot-dot' + (isHi ? " is-hi" : "") + '" style="fill:' + (isHi ? "var(--vp-hi)" : c) + '"');
        }));
      });
      // 数值标签：放不下就整组不写（不挤、不重叠）
      ser.forEach((sr, k) => {
        if (!sr.labels) return;
        const isBar = typeOf(sr) === "bar", P = band ? (q => sx(q.i)) : (q => sx(q.x));
        const j = isBar ? bars.indexOf(k) : 0, groupW = band ? Math.min(step * 0.74, bars.length * 44) : 0, bw = bars.length ? groupW / bars.length : 0;
        const fmtL = typeof sr.labels === "function" ? sr.labels : (v => fyUser ? fyUser(v) : fmtNum(v));
        const ls = pts[k].filter(q => q.y != null && (!band || q.i < nBand)).map(q => ({ x: isBar ? sx(q.i) - groupW / 2 + (j + 0.5) * bw : P(q), y: sy(q.y), neg: q.y < 0, t: String(fmtL(q.y)) }));
        const room = band ? (isBar ? Math.max(bw, step / Math.max(1, bars.length)) : step) : 1e9;
        if (ls.some(l => mNum(l.t) > room * 0.98)) return;
        ls.forEach(l => { s += '<text x="' + f1(l.x) + '" y="' + f1(l.neg ? l.y + fs + 4 : l.y - 6) + '" text-anchor="middle" class="vl-plot-val">' + esc(l.t) + "</text>"; });
      });
      // 参考线 / 标注点
      marks.forEach(m => {
        const c = m.color || "var(--vp-ink)", lab = m.label ? esc(m.label) : "", mx = isNum(m.x) ? (band ? sx(m.x) : sx(m.x)) : null, my = isNum(m.y) ? sy(m.y) : null;
        const w = m.label ? mTxt(m.label) : 0, clampX = x => Math.max(2, Math.min(W - 2 - w, x));
        if (mx != null && my != null) {
          s += '<circle cx="' + f1(mx) + '" cy="' + f1(my) + '" r="6" class="vl-plot-mark-pt" style="stroke:' + c + '"/>';
          if (lab) { const ty = my - 10 - fsT * 0.2 < fsT ? my + fsT + 8 : my - 10; s += '<text x="' + f1(clampX(mx - w / 2)) + '" y="' + f1(ty) + '" class="vl-plot-mark">' + lab + "</text>"; }
        } else if (my != null) {
          s += '<line x1="' + X0 + '" y1="' + f1(my) + '" x2="' + XR + '" y2="' + f1(my) + '" class="vl-plot-ref" style="stroke:' + c + '"/>';
          if (lab) { const ty = my - 5 < fsT ? my + fsT + 3 : my - 5; s += '<text x="' + f1(clampX(XR - w)) + '" y="' + f1(ty) + '" class="vl-plot-mark">' + lab + "</text>"; }
        } else {
          s += '<line x1="' + f1(mx) + '" y1="' + top + '" x2="' + f1(mx) + '" y2="' + f1(Y0) + '" class="vl-plot-ref" style="stroke:' + c + '"/>';
          if (lab) { const tx = mx + 5 + w > W - 2 ? mx - 5 - w : mx + 5; s += '<text x="' + f1(clampX(tx)) + '" y="' + f1(top + fsT * 0.4) + '" class="vl-plot-mark">' + lab + "</text>"; }
        }
      });
      // 轴线与横轴刻度
      if (!yHidden) s += '<line x1="' + X0 + '" y1="' + f1(top - 4) + '" x2="' + X0 + '" y2="' + f1(Y0) + '" class="vl-plot-axis"/>';
      s += '<line x1="' + X0 + '" y1="' + f1(yBase) + '" x2="' + XR + '" y2="' + f1(yBase) + '" class="vl-plot-axis"/>';
      if (!xHidden) xT.forEach(t => { s += '<text x="' + f1(t.p) + '" y="' + f1(Y0 + fs + 6) + '" text-anchor="middle" class="vl-plot-tick">' + esc(t.t) + "</text>"; });
      svg.innerHTML = s;
      let label = "";
      try { label = typeof o.aria === "function" ? o.aria({ series: ser, marks, hi: [...his] }) : o.aria; } catch (e) { console.warn("VL.plot aria：", e); }
      svg.setAttribute("aria-label", label || autoAria(ser));
    }

    function set(next) {
      if (Array.isArray(next)) next = { series: [Object.assign({}, o.series[0], { data: next })].concat(o.series.slice(1)) };
      next = next || {};
      if (next.series) {
        // 按下标合并：只传 [{data}] 也能保留原来的名字和颜色
        o.series = next.series.map((s, k) => Object.assign({}, o.series[k], s));
      }
      ["type", "marks", "hi", "height", "legend", "aria"].forEach(k => { if (k in next) o[k] = next[k]; });
      if (next.x) o.x = Object.assign({}, o.x, next.x);
      if (next.y) o.y = Object.assign({}, o.y, next.y);
      legend(); draw();
      return api;
    }

    let ro = null, raf = 0;
    const onWin = () => schedule();
    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (!root.isConnected) return destroy(); const w = Math.round(svg.getBoundingClientRect().width); if (w > 0 && w !== lastW) draw(); }); }
    if (window.ResizeObserver) { ro = new ResizeObserver(schedule); ro.observe(root); }
    else addEventListener("resize", onWin);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { if (root._vlPlot === api) draw(); });   // 网络字体到了字宽会变
    function destroy() { if (ro) ro.disconnect(); ro = null; removeEventListener("resize", onWin); cancelAnimationFrame(raf); if (root._vlPlot === api) delete root._vlPlot; }

    const api = { el: root, svg, set, draw, destroy, get opts() { return o; } };
    root._vlPlot = api;
    legend(); draw();
    return api;
  }
  plot.niceStep = niceStep; plot.ticks = (lo, hi, step) => tickVals(lo, hi, step || niceStep((hi - lo) / 5));
  Object.assign(VL, { plot });
})();
