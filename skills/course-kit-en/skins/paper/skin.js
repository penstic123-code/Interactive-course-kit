/* 皮肤 paper（纸片 / 剪纸）的脚本部分：放在 <head> 里、kit/vl-head.js 之前。
   1. window.VL_SKIN：网络字体、页面共享的 SVG 定义（剪纸白边 + 投影滤镜、纤维纹、纸面光）、插画配色。
   2. 剪纸绘制工具：kit/illus.js 一建好 VL.illus，就把 VL.illus.kit 里的 person / ground / item / holding / hands / feetY / bubble / T / arrow
      换成剪纸画法（接口不变，见 references/skin-contract.md 第三节），另把整套纸片 API 挂在 kit.paper 上（stage、cut、rect、paperPerson……）。
      做法：先在 window.VL 上放一个 illus 的 setter，illus.js 执行 VL.illus = {...} 时触发。页面写法不用改。
   3. 题头环境动画：纸云出视口暂停；?freeze=秒 停在那一帧（截图用）。
   滤镜规则：文字永远不进滤镜组；剪纸白边靠 feMorphology 外扩 SourceAlpha。画法抽自数据科学课 illus-paper.js（去掉了勇士、背包等课程角色）。 */
(function () {
  "use strict";
  const SRC = (document.currentScript && document.currentScript.src) || "";
  const BASE = SRC.replace(/skin\.js(\?.*)?$/, "");
  const PAL = {
    skyblue: "#7cc4ee", grass: "#7fc66a", mint: "#8fd8bf", peach: "#f7b98f", lavender: "#bba9ea", lemon: "#f4dd78", rose: "#ef8f86", cloud: "#fbfcff",
    meadow: "#8fcf72", meadowDk: "#6fb257", hill: "#b7e09f", skyTop: "#8fd0f4", skyBot: "#e2f4fc",
    cream: "#f7f0e1", kraft: "#d8b98c", wall: "#efe4cc", navy: "#2f3b6b", indigo: "#3b5dc9", blue: "#5b8fd9", sky: "#a9d8f2",
    teal: "#4fc3cf", sage: "#9cc48a", green: "#5aa66a", mustard: "#f2bd4b", coral: "#ec8462", berry: "#b13e53", plum: "#7c3b5e",
    lilac: "#b6a4ff", pink: "#f4a3b4", slate: "#8195b0", grey: "#c9d1d9", wood: "#c48a52", skin: "#f6d3b0", ink: "#181a2e", white: "#ffffff",
  };
  const INK = PAL.ink;
  const f1 = v => Math.round(v * 100) / 100;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const tr = s => s;

  // 颜色混合：t>0 向白，t<0 向黑
  function shade(hex, t) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    const to = t > 0 ? 255 : 0, a = Math.abs(t);
    return "#" + c.map(v => Math.round(v + (to - v) * a).toString(16).padStart(2, "0")).join("");
  }

  // 由坐标算种子的伪随机：同一个形状每次画出来的"剪刀边"都一样，截图、重绘不闪
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const seedOf = arr => { let h = 2166136261; arr.forEach(v => { h ^= Math.round(v * 10); h = Math.imul(h, 16777619); }); return h; };

  // 剪刀剪出的直边：每 ~7 个单位加一个点，横向抖一点点；拐角也稍微挪一下。wob=0 就是笔直的
  function wobblePoly(pts, wob) {
    if (!wob) return "M" + pts.map(p => f1(p[0]) + " " + f1(p[1])).join(" L") + " Z";
    const r = rng(seedOf(pts.flat())), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, n = Math.max(1, Math.round(len / 7));
      out.push([a[0] + (r() - .5) * wob, a[1] + (r() - .5) * wob]);
      for (let k = 1; k < n; k++) { const t = k / n, j = (r() - .5) * 2 * wob; out.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]); }
    }
    return "M" + out.map(p => f1(p[0]) + " " + f1(p[1])).join(" L") + " Z";
  }
  // 平滑闭合曲线（Catmull-Rom → 三次贝塞尔）：圆、云、山丘、头发这类手剪的圆弧
  function smooth(pts, wob) {
    const r = rng(seedOf(pts.flat())), P = pts.map(p => wob ? [p[0] + (r() - .5) * wob, p[1] + (r() - .5) * wob] : p), n = P.length;
    let d = "M" + f1(P[0][0]) + " " + f1(P[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += " C" + f1(p1[0] + (p2[0] - p0[0]) / 6) + " " + f1(p1[1] + (p2[1] - p0[1]) / 6) + " " + f1(p2[0] - (p3[0] - p1[0]) / 6) + " " + f1(p2[1] - (p3[1] - p1[1]) / 6) + " " + f1(p2[0]) + " " + f1(p2[1]);
    }
    return d + " Z";
  }
  const ellPts = (cx, cy, rx, ry) => { const n = Math.max(12, Math.round(Math.max(rx, ry) * 2.2)), o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  function rrPts(x, y, w, h, r) {
    if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    r = Math.min(r, w / 2, h / 2); const o = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 3; k++) { const a = a0 + k / 3 * Math.PI / 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return o;
  }

  // 一片纸 = 底色 + 纤维纹 + 纸面光（上亮下暗，像卡纸微微拱起）
  function piece(d, fill, o) {
    o = o || {};
    const op = o.op != null ? ' opacity="' + o.op + '"' : "";
    let s = '<path d="' + d + '" fill="' + (fill || PAL.cream) + '"' + op + "/>";
    // 纹理压到七成：深色纸上浅色纤维太显眼会像划痕
    if (o.tex !== false) s += '<path d="' + d + '" fill="url(#pp-fiber)" opacity="' + f1((o.op != null ? o.op : 1) * .7) + '"/>';
    if (o.sheen !== false) s += '<path d="' + d + '" fill="url(#pp-sheen)"' + op + "/>";
    return s;
  }
  const W0 = 0.35;
  const wobOf = o => (o && o.wob != null ? o.wob : W0);
  const rect = (x, y, w, h, fill, o) => piece(o && o.r ? smooth(rrPts(x, y, w, h, o.r), wobOf(o) * .6) : wobblePoly(rrPts(x, y, w, h, 0), wobOf(o)), fill, o);
  const ellipse = (cx, cy, rx, ry, fill, o) => piece(smooth(ellPts(cx, cy, rx, ry), wobOf(o) * .8), fill, o);
  const circle = (cx, cy, r, fill, o) => ellipse(cx, cy, r, r, fill, o);
  const poly = (pts, fill, o) => piece(wobblePoly(pts, wobOf(o)), fill, o);
  const blob = (pts, fill, o) => piece(smooth(pts, wobOf(o)), fill, o);
  const path = (d, fill, o) => piece(d, fill, o);
  // 纸条：线状的纸（电线、绳子、手臂）。圆头，再叠一层纤维纹
  const strip = (d, color, w, o) => '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>' +
    (o && o.tex === false ? "" : '<path d="' + d + '" fill="none" stroke="url(#pp-fiber)" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>');

  // 白边 + 投影：一整个物件外面一圈（feMorphology 把轮廓向外扩成白边），影子按层次远近
  const cut = (inner, lift) => '<g filter="url(#pp-cut' + (lift || 2) + ')">' + inner + "</g>";
  const lay = (inner, dir) => '<g filter="url(#pp-lay' + (dir === -1 ? "L" : "") + ')">' + inner + "</g>";

  // 图中文字用清晰的系统黑体加粗，不用页面的装饰标题字体（--label 是站酷快乐体，小字号难读，而且按用字裁剪过，图里的字可能缺字形）
  const FONT = "'Microsoft YaHei','PingFang SC','Noto Sans SC','Source Han Sans SC',sans-serif";
  const T = (x, y, size, text, anchor, fill) => '<text x="' + f1(x) + '" y="' + f1(y) + '" font-size="' + (size || 12) + '" text-anchor="' + (anchor || "start") + '" fill="' + (fill || INK) + '" font-weight="700" style="font-family:' + FONT + '">' + esc(tr(text)) + "</text>";
  // 细线箭头：示意图用。尖端正好落在 (x2,y2)，所以终点写目标的边缘坐标
  function arrow(x1, y1, x2, y2, o) {
    o = o || {}; const w = o.w || 1.6, c = o.color || INK, hl = o.head || w * 4, hw = hl * .6;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const head = (px, py, sx, sy) => { const bx = px - sx * hl, by = py - sy * hl; return '<path d="M' + f1(px) + " " + f1(py) + " L" + f1(bx - sy * hw) + " " + f1(by + sx * hw) + " L" + f1(bx + sy * hw) + " " + f1(by - sx * hw) + ' Z" fill="' + c + '"/>'; };
    // 线身缩短到箭头底边，免得粗线头从尖上冒出来
    const sx = o.both ? x1 + ux * hl * .8 : x1, sy = o.both ? y1 + uy * hl * .8 : y1, ex = x2 - ux * hl * .8, ey = y2 - uy * hl * .8;
    return '<path d="M' + f1(sx) + " " + f1(sy) + " L" + f1(ex) + " " + f1(ey) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>" +
      head(x2, y2, ux, uy) + (o.both ? head(x1, y1, -ux, -uy) : "");
  }
  // 估字宽：中文约 1 个字号，其余约 0.6 个
  const textW = (text, size) => [...String(text)].reduce((a, c) => a + (/[⺀-￿]/.test(c) ? 1 : .6), 0) * size;

  /* ================= 舞台 ================= */
  const GY = 112;
  function spot(x, gy, w) {
    gy = gy || GY; w = w || 70;
    return '<path d="M' + f1(x - 7) + " 0 L" + f1(x + 7) + " 0 L" + f1(x + w / 2) + " " + gy + " L" + f1(x - w / 2) + " " + gy + ' Z" fill="url(#pp-beam)"/>' +
      '<ellipse cx="' + x + '" cy="' + (gy + 6) + '" rx="' + f1(w / 2 + 6) + '" ry="7" fill="#fff6d8" opacity=".55"/>';
  }
  // 白色纸云：几个圆鼓包连成一片，底边平一点（云"坐"在空气上）；淡淡一层蓝灰压在底边，像纸片底下的阴影
  const cloud = (x, y, k, o) => { k = k || 1; const P = (a, b) => [x + a * k, y + b * k];
    return cut(blob([P(-24, 6), P(-25, -1), P(-16, -6), P(-9, -14), P(2, -16), P(10, -9), P(19, -10), P(26, -2), P(25, 6)], PAL.cloud, { wob: .25 }) +
      blob([P(-20, 6), P(-10, 2.5), P(8, 3.5), P(22, 2), P(23, 6.4)], "#e3eef8", { wob: 0, tex: false, sheen: false }), (o && o.lift) || 1); };
  // 一撮草：三片尖叶，底边落在 gy
  const tuft = (x, gy, s, c) => { s = s || 1; c = c || PAL.meadowDk;
    return poly([[x - 4 * s, gy], [x - 3.4 * s, gy - 5 * s], [x - 1.6 * s, gy - .6 * s], [x, gy - 7 * s], [x + 1.6 * s, gy - .6 * s], [x + 3.6 * s, gy - 5.4 * s], [x + 4 * s, gy]], c, { wob: 0, tex: false, sheen: false }); };
  function backdrop(kind, wall, gy, W, H, o) {
    o = o || {};
    if (kind === "meadow") {
      // 蓝天渐变（上深下浅，近地平线发白，画面显得透气）+ 纸云 + 两层远丘；颜色都压淡，前景的人和物件才跳得出来
      let s = '<rect x="-4" y="-4" width="' + (W + 8) + '" height="' + (gy + 8) + '" fill="url(#pp-skyg)"/>';
      s += '<rect x="-4" y="-4" width="' + (W + 8) + '" height="' + (gy + 8) + '" fill="url(#pp-fiber)" opacity=".35"/>';
      if (o.sun) s += cut(circle(W - 26, 22, 11, "#fde9a0", { sheen: false }), 1);
      if (o.clouds !== false) {
        const cs = o.clouds && o.clouds.length ? o.clouds : [[W * .17, 26, .62], [W * .62, 16, .5], [W * .9, 42, .42]];
        cs.forEach(c => { s += cloud(c[0], c[1], c[2]); });
      }
      if (o.hills !== false) {
        const far = [[-6, gy + 2], [-6, gy - 20]], near = [[-8, gy + 4], [-8, gy - 8]];
        for (let i = 0; i <= 8; i++) { const x = i / 8 * (W + 12) - 6; far.push([x, gy - 18 - 9 * Math.sin(i * 1.3 + .6) - (i % 3 ? 0 : 4)]); }
        far.push([W + 6, gy - 16], [W + 6, gy + 2]);
        for (let i = 0; i <= 6; i++) { const x = i / 6 * (W + 16) - 8; near.push([x, gy - 7 - 6 * Math.sin(i * 1.7 + 2.1)]); }
        near.push([W + 8, gy - 8], [W + 8, gy + 4]);
        s += cut(blob(far, PAL.hill, { wob: 0 }), 1) + cut(blob(near, shade(PAL.meadow, .22), { wob: 0 }), 1);
      }
      return s;
    }
    let s = rect(-4, -4, W + 8, gy + 8, wall, { wob: 0, sheen: false });
    if (kind === "hills") {
      s += cut(circle(38, 30, 12, PAL.mustard), 1);
      s += cut(blob([[40, 36], [48, 30], [58, 32], [64, 28], [74, 32], [78, 38], [68, 41], [46, 41]], PAL.white), 1);
      s += cut(poly([[-4, gy], [-4, 80], [20, 70], [46, 76], [70, 64], [100, 74], [130, 66], [160, 72], [W * .8, 66], [W + 4, 62], [W + 4, gy]], shade(PAL.sage, .25), { wob: 0 }), 1);
      s += cut(blob([[-10, gy + 4], [-6, 92], [30, 84], [70, 92], [110, 82], [150, 90], [W - 10, 84], [W + 12, 92], [W + 12, gy + 4]], PAL.sage), 1);
    } else if (kind === "lab") {
      // 墙裙 + 一扇窗 + 一块挂板：交代"这是一间实验室"，颜色都压淡
      s += rect(-4, gy - 30, W + 8, 30, shade(wall, -.08), { wob: 0, sheen: false });
      s += cut(rect(18, 18, 46, 40, PAL.wood, { wob: .2 }) + rect(22, 22, 38, 32, shade(PAL.sky, .3), { wob: 0 }) + blob([[28, 40], [33, 35], [40, 36], [46, 34], [52, 39], [48, 43], [32, 43]], PAL.white, { tex: false }) + rect(40, 22, 2, 32, PAL.wood, { wob: 0, tex: false, sheen: false }) + rect(22, 37, 38, 2, PAL.wood, { wob: 0, tex: false, sheen: false }), 1);
      s += cut(rect(W - 50, 22, 40, 30, shade(PAL.slate, .45), { wob: .2 }) + strip("M" + (W - 44) + " 32 L" + (W - 30) + " 32 M" + (W - 44) + " 39 L" + (W - 18) + " 39 M" + (W - 44) + " 46 L" + (W - 24) + " 46", shade(PAL.slate, -.2), 1.4, { tex: false }), 1);
    } else if (kind === "night") {
      [[24, 22], [60, 12], [96, 30], [132, 16], [176, 26], [44, 48], [150, 50], [214, 20], [246, 40]].filter(p => p[0] < W - 30).forEach(([x, y], i) => {
        const r = i % 3 ? 2.6 : 3.6, pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
        s += cut(poly(pts, PAL.mustard, { wob: .1, sheen: false }), 1);
      });
      s += cut(path("M" + (W - 28) + " 54 A13 13 0 1 1 " + (W - 14) + " 72 A10 10 0 1 0 " + (W - 28) + " 54 Z", "#f6e7b0"), 1);
    } else if (kind === "city") {
      [[0, 60, 26], [24, 44, 22], [44, 70, 30], [72, 50, 20], [90, 36, 26], [114, 62, 24], [136, 48, 30], [164, 58, 22], [184, 42, 20], [204, 56, 26], [230, 40, 24], [254, 62, 30]].filter(b => b[0] < W).forEach(([x, y, w], i) => {
        let b = rect(x, y, w, gy - y, i % 2 ? shade(PAL.slate, .35) : shade(PAL.slate, .5), { wob: .2 });
        for (let yy = y + 6; yy < gy - 8; yy += 10) for (let xx = x + 4; xx < x + w - 5; xx += 8) b += rect(xx, yy, 4, 5, (xx + yy) % 3 ? "#fff3cf" : shade(PAL.slate, .15), { wob: 0, tex: false, sheen: false });
        s += cut(b, 1);
      });
    }
    // 背板和地板交界处的一道柔影：地板在背板前面
    s += '<rect x="-4" y="' + (gy - 6) + '" width="' + (W + 8) + '" height="6" fill="url(#pp-floorsh)"/>';
    return s;
  }
  // 草地：上沿是一排小鼓包（剪出来的草边），下面一道浅色亮边 + 零星几撮深草；不画小花，免得抢前景
  function grassFloor(gy, W, H) {
    // 上沿用平滑的小波浪（尖齿太整齐像锯子）；底下两个点放到画外很远，平滑曲线拐弯的地方才不会露进画面
    const top = [[-14, H + 30], [-10, gy]];
    for (let x = -4, i = 0; x <= W + 6; x += 11, i++) top.push([x, gy - (i % 2 ? 1.9 : 0) - (i % 3 ? 0 : .5)]);
    top.push([W + 12, gy], [W + 14, H + 30]);
    let s = cut(blob(top, PAL.meadow, { wob: 0 }), 1);
    s += '<path d="M-4 ' + (gy + 3) + " L" + (W + 4) + " " + (gy + 3) + '" stroke="' + shade(PAL.meadow, .3) + '" stroke-width="1.2" opacity=".7"/>';
    [[.08, 14], [.3, 22], [.55, 16], [.74, 24], [.93, 13]].forEach(([fx, dy]) => { if (gy + dy < H - 2) s += tuft(fx * W, gy + dy, .8); });
    return s;
  }
  // 石板街：浅米灰石板，错缝；19 世纪的街道图用
  function cobbleFloor(gy, W, H) {
    let s = rect(-4, gy, W + 8, H + 8 - gy, "#d9d2c3", { wob: 0, sheen: false });
    for (let y = gy + 7, r = 0; y < H + 4; y += 8, r++) {
      s += '<path d="M-4 ' + y + " L" + (W + 4) + " " + y + '" stroke="#b9ae9a" stroke-width=".7"/>';
      for (let x = (r % 2) * 9 - 4; x < W + 4; x += 18) s += '<path d="M' + x + " " + (y - 8) + " L" + x + " " + y + '" stroke="#b9ae9a" stroke-width=".7"/>';
    }
    return s + '<path d="M-4 ' + gy + " L" + (W + 4) + " " + gy + '" stroke="#a89c86" stroke-width="1.4"/>';
  }
  function floorBoards(gy, W, H) {
    let s = rect(-4, gy, W + 8, H + 8 - gy, PAL.wood, { wob: 0, sheen: false });
    for (let y = gy + 7; y < H; y += 8) s += '<path d="M-4 ' + y + ' L' + (W + 4) + ' ' + y + '" stroke="' + shade(PAL.wood, -.18) + '" stroke-width=".7" opacity=".6"/>';
    s += '<path d="M-4 ' + gy + ' L' + (W + 4) + ' ' + gy + '" stroke="' + shade(PAL.wood, .3) + '" stroke-width="1.2"/>';
    return s;
  }
  function curtains(W, H) {
    const red = "#a8364a", dk = shade(red, -.22), lt = shade(red, .14);
    // 两侧幕布：往外收束，内沿是一条弧（像被绳子挽起来）；竖向几道深浅褶
    const side = (flip) => {
      const X = v => flip ? W - v : v;
      const body = poly([[X(-4), -4], [X(20), -4], [X(18), 40], [X(12), 78], [X(16), H * .8], [X(18), H + 4], [X(-4), H + 4]].map(p => p), red, { wob: .3 });
      const folds = strip("M" + X(5) + " 0 L" + X(4) + " " + (H + 4) + " M" + X(12) + " 0 Q" + X(10) + " " + H * .43 + " " + X(8) + " " + H, dk, 1.6, { tex: false }) + strip("M" + X(8) + " 0 L" + X(7) + " " + H, lt, 1, { tex: false });
      const tie = rect(X(flip ? 18 : 2) - (flip ? 0 : 0), 74, 16, 4, PAL.mustard, { wob: .2 });
      return cut(body + folds + tie, 3);
    };
    // 顶上的帷幔：一排扇贝边
    let sc = "M-4 -4 L" + (W + 4) + " -4 L" + (W + 4) + " 9";
    for (let x = W + 4; x > -4; x -= 13) sc += " Q" + f1(x - 6.5) + " 17 " + f1(x - 13) + " 9";
    sc += " Z";
    const val = cut(path(sc, red) + strip("M-4 6 L" + (W + 4) + " 6", PAL.mustard, 1.4, { tex: false }), 3);
    return side(false) + side(true) + val;
  }
  function stage(o, inner) {
    if (typeof o === "string") { inner = o; o = {}; }
    o = o || {};
    const gy = o.floor || GY, W = o.w || 200, H = o.h || 140;
    // 布景都包在 class="pp-bg" 里：tools/illus-overlap 检查人物重叠时跳过布景，只看人和物件、文字
    const back = o.back || "meadow", gk = o.ground || (back === "meadow" ? "grass" : "wood");
    const fl = gk === "grass" ? grassFloor(gy, W, H) : gk === "cobble" ? cobbleFloor(gy, W, H) : gk === "none" ? "" : floorBoards(gy, W, H);
    let s = '<g class="pp-bg">' + backdrop(back, o.wall || PAL.wall, gy, W, H, o) + fl + (o.spot ? spot(o.spot, gy, o.spotW) : "") + "</g>";
    s += inner || "";
    // 幕布默认不画：原课程要蓝天草地的清爽画面，深红幕布会把画面压暗、像在室内戏台
    if (o.curtains === true) s += '<g class="pp-bg">' + curtains(W, H) + "</g>";
    if (o.year) s += sign(W / 2 - textW(o.year, 13) / 2 - 8, 14, textW(o.year, 13) + 16, 20, o.year, { top: 6, fill: PAL.cream, size: 13 });
    return s;
  }

  /* ================= 文字与标注 ================= */
  function tag(x, y, text, o) {
    o = o || {}; const size = o.size || 11, w = textW(text, size) + 12, h = size + 9;
    const g = cut(rect(x - w / 2, y - h / 2, w, h, o.fill || PAL.cream, { r: 2, wob: .25 }) + T(x, y + size * .36, size, text, "middle", o.color || INK), o.lift || 2);
    return o.rot ? '<g transform="rotate(' + o.rot + " " + x + " " + y + ')">' + g + "</g>" : g;
  }
  function sign(x, y, w, h, text, o) {
    o = o || {}; const top = o.top != null ? o.top : 0, size = o.size || 12;
    const ropes = top < y ? '<path d="M' + f1(x + 6) + " " + top + " L" + f1(x + 6) + " " + y + " M" + f1(x + w - 6) + " " + top + " L" + f1(x + w - 6) + " " + y + '" stroke="#6b5a48" stroke-width=".9"/>' : "";
    return ropes + cut(rect(x, y, w, h, o.fill || PAL.cream, { r: 2 }) + '<circle cx="' + f1(x + 6) + '" cy="' + f1(y + 3) + '" r="1" fill="#6b5a48"/><circle cx="' + f1(x + w - 6) + '" cy="' + f1(y + 3) + '" r="1" fill="#6b5a48"/>' + T(x + w / 2, y + h / 2 + size * .38, size, text, "middle", o.color || INK), 2);
  }
  function bubble(x, y, w, h, text, size, tail) {
    size = size || 11;
    let tl = "";
    if (tail !== "none") {
      const tx = typeof tail === "number" ? tail : tail === "r" ? x + w - 10 : x + 10;
      const bx = Math.max(x + 6, Math.min(x + w - 14, typeof tail === "number" ? tx - (tx > x + w / 2 ? 2 : -2) : tx));
      tl = poly([[bx, y + h - 1], [bx + 8, y + h - 1], [tx + (tail === "r" ? 4 : 0), y + h + 9]], "#fffaf0", { wob: 0, sheen: false });
    }
    return cut(tl + rect(x, y, w, h, "#fffaf0", { r: 5, sheen: false }) + (text ? T(x + w / 2, y + h / 2 + size * .38, size, text, "middle") : ""), 2);
  }
  // 纸片粗箭头：一整片剪出来的箭头形状，尖端落在 (x2,y2)
  function parrow(x1, y1, x2, y2, o) {
    o = o || {}; const w = o.w || 5, hl = o.head || w * 2.2, hw = o.headW || w * 1.9;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const bx = x2 - ux * hl, by = y2 - uy * hl, P = (px, py, k) => [px + nx * k, py + ny * k];
    const pts = [P(x1, y1, w / 2), P(bx, by, w / 2), P(bx, by, hw / 2), [x2, y2], P(bx, by, -hw / 2), P(bx, by, -w / 2), P(x1, y1, -w / 2)];
    return cut(poly(pts, o.fill || PAL.coral, { wob: .15 }), o.lift || 2);
  }

  /* ================= 纸偶人物 ================= */
  // 关节表（单位坐标，头心为原点，朝右）：[肩, 肘, 手]
  const ARMS = {
    stand: [[[-7, 11], [-9, 19], [-10, 27]], [[7, 11], [9, 19], [10, 27]]],
    up: [[[-7, 11], [-11, 3], [-13, -6]], [[7, 11], [11, 3], [13, -6]]],
    point: [[[-7, 11], [-9, 19], [-10, 27]], [[7, 11], [15, 9.5], [23, 8]]],
    hold: [[[-7, 11], [-6, 20], [4, 21]], [[7, 11], [12, 19], [16, 21]]],
    present: [[[-7, 11], [-9, 19], [-10, 27]], [[7, 11], [13, 17], [20, 16]]],
    wave: [[[-7, 11], [-9, 19], [-10, 27]], [[7, 11], [14, 6], [15, -4]]],
    chin: [[[-7, 11], [-9, 19], [-10, 27]], [[7, 11], [10, 18], [3.5, 8.5]]],
    desk: [[[-7, 11], [-3, 20], [7, 22]], [[7, 11], [13, 19], [19, 22]]],
    shrug: [[[-7, 11], [-14, 14], [-16, 6]], [[7, 11], [14, 14], [16, 6]]],
    cover: [[[-7, 11], [-8, 18], [-3.5, 4]], [[7, 11], [8, 18], [3.5, 4]]],
    none: [],
  };
  // 腿：[胯 x, 角度（度，正 = 脚往前）]
  const LEGS = { stand: [[-3.4, 0], [3.4, 0]], walk: [[-3.4, -16], [3.4, 14]], run: [[-3.4, -30], [3.4, 26]], wide: [[-3.4, 12], [3.4, -12]], none: [] };
  const HANDS = { hold: [10, 20], present: [21.5, 13.5] };

  function face(kind, look, glasses) {
    const lk = (look || 0) * 1.2, e = INK, m = "#9a2c40";
    let s = "";
    const eye = (x) => kind === "sleep" ? '<path d="M' + f1(x - 1.3) + " 0.2 Q" + f1(x) + " 1.4 " + f1(x + 1.3) + ' 0.2" stroke="' + e + '" stroke-width=".8" fill="none" stroke-linecap="round"/>'
      : '<ellipse cx="' + f1(x) + '" cy="0" rx="1" ry="' + (kind === "wow" ? 1.5 : 1.3) + '" fill="' + e + '"/><circle cx="' + f1(x + .35) + '" cy="-.5" r=".35" fill="#fff"/>';
    s += eye(-3 + lk) + eye(3 + lk);
    if (kind === "angry") s += '<path d="M' + f1(-4.6 + lk) + " -2.6 L" + f1(-1.6 + lk) + " -1.6 M" + f1(4.6 + lk) + " -2.6 L" + f1(1.6 + lk) + ' -1.6" stroke="' + e + '" stroke-width=".8" stroke-linecap="round"/>';
    if (kind === "think") s += '<path d="M' + f1(1.6 + lk) + " -2.6 L" + f1(4.4 + lk) + ' -3.2" stroke="' + e + '" stroke-width=".8" stroke-linecap="round"/>';
    const M = {
      smile: '<path d="M-2 3.6 Q0 5.4 2 3.6" stroke="' + m + '" stroke-width=".9" fill="none" stroke-linecap="round"/>',
      happy: '<path d="M-2.4 3.3 Q0 6.6 2.4 3.3 Z" fill="' + m + '"/>',
      flat: '<path d="M-1.6 4.2 L1.6 4.2" stroke="' + m + '" stroke-width=".9" stroke-linecap="round"/>',
      sad: '<path d="M-2 5 Q0 3.3 2 5" stroke="' + m + '" stroke-width=".9" fill="none" stroke-linecap="round"/>',
      wow: '<ellipse cx="0" cy="4.4" rx="1.2" ry="1.5" fill="' + m + '"/>',
      think: '<path d="M0 4.4 L2.4 4" stroke="' + m + '" stroke-width=".9" stroke-linecap="round"/>',
      angry: '<path d="M-2 5 Q0 3.6 2 5" stroke="' + m + '" stroke-width=".9" fill="none" stroke-linecap="round"/>',
      sleep: '<ellipse cx="0" cy="4.4" rx=".9" ry=".7" fill="' + m + '"/>',
    };
    s += '<g transform="translate(' + f1(lk * .6) + ' 0)">' + (M[kind] || M.smile) + "</g>";
    s += '<circle cx="' + f1(-4.8 + lk * .5) + '" cy="2.6" r="1.5" fill="#f08c86" opacity=".4"/><circle cx="' + f1(4.8 + lk * .5) + '" cy="2.6" r="1.5" fill="#f08c86" opacity=".4"/>';
    if (glasses) s += '<g fill="#fff" fill-opacity=".22" stroke="' + INK + '" stroke-width=".65"><circle cx="' + f1(-3 + lk) + '" cy="0" r="2.5"/><circle cx="' + f1(3 + lk) + '" cy="0" r="2.5"/></g><path d="M' + f1(-.5 + lk) + " -.2 Q" + f1(lk) + " -.9 " + f1(.5 + lk) + ' -.2" stroke="' + INK + '" stroke-width=".6" fill="none"/>';
    return s;
  }
  // 头发分"后层"（画在头后面，如长发、马尾）和"前层"（盖在头顶）
  const HAIR = {
    short: [null, "M-8.6 .5 C-9.6 -10.6 9.6 -10.6 8.6 .5 L7.4 -1.6 C4 -4.6 -4 -4.6 -7.4 -1.6 Z"],
    side: [null, "M-8.7 1 C-9.8 -11 9.8 -11 8.7 1 L7.6 -1.8 C5 -4.2 0 -5.6 -3 -3.6 C-5 -4.6 -6.6 -3 -7.6 -.6 Z"],
    slick: [null, "M-8.6 -.5 C-9 -11.4 9 -11.4 8.6 -.5 L7.8 -3 C5 -6 -5 -6 -7.8 -3 Z"],
    long: ["M-9.2 -2 C-11 -12 11 -12 9.2 -2 L10 12 L5 12 L5 4 L-5 4 L-5 12 L-10 12 Z", "M-8.6 .5 C-9.6 -10.6 9.6 -10.6 8.6 .5 L6.4 -3.6 C2 -5.6 -2 -5.6 -6.4 -3.6 Z"],
    bun: [null, "M-8.6 .5 C-9.6 -10.6 9.6 -10.6 8.6 .5 L7.4 -1.6 C4 -4.6 -4 -4.6 -7.4 -1.6 Z M-3.4 -10.4 A3.6 3.4 0 1 1 3.4 -10.4 A3.6 3.4 0 1 1 -3.4 -10.4 Z"],
    ponytail: ["M5 -6 C12 -6 13 4 10 12 C9 6 8 1 5 -2 Z", "M-8.6 .5 C-9.6 -10.6 9.6 -10.6 8.6 .5 L7.4 -1.6 C4 -4.6 -4 -4.6 -7.4 -1.6 Z"],
    spiky: [null, "M-8.6 .5 L-9.4 -6 L-6 -5.4 L-6.4 -10.6 L-2.6 -7.8 L-.6 -12 L1.8 -7.8 L5.6 -10.6 L5.6 -5.6 L9.4 -6 L8.6 .5 L7.4 -1.6 C4 -4.6 -4 -4.6 -7.4 -1.6 Z"],
    curly: [null, "M-8.8 1 C-11.6 -2 -10.6 -7 -7.6 -7.4 C-7.6 -11 -3 -12 -1.4 -10 C.4 -12.6 5 -11.6 5.4 -8.6 C9 -9 10.8 -4.6 8.8 1 C8 -2.4 5.2 -4.6 0 -4.6 C-5.2 -4.6 -8 -2.4 -8.8 1 Z"],
    bald: [null, "M-8.6 1.5 C-9 -1.6 -8.4 -3.4 -7.4 -4 L-6.4 -.6 Z M8.6 1.5 C9 -1.6 8.4 -3.4 7.4 -4 L6.4 -.6 Z"],
  };
  const HATS = {
    fedora: (c) => path("M-12.6 -5.6 C-6 -3.6 6 -3.6 12.6 -5.6 C10 -3.2 -10 -3.2 -12.6 -5.6 Z", shade(c, -.15), { wob: 0 }) + path("M-7.6 -5 C-8 -13 -5 -15.4 0 -13.6 C5 -15.4 8 -13 7.6 -5 Z", c, { wob: 0 }) + strip("M-7.6 -6.4 L7.6 -6.4", shade(c, -.4), 1.6, { tex: false }),
    cap: (c) => path("M-8.6 -3 C-9 -12.4 9 -12.4 8.6 -3 Z", c, { wob: 0 }) + path("M5 -4.4 L15 -3.6 C14 -2 9 -2 5 -2.6 Z", shade(c, -.2), { wob: 0 }),
    beanie: (c) => path("M-8.8 -2.4 C-9.6 -13 9.6 -13 8.8 -2.4 Z", c, { wob: 0 }) + rect(-9.2, -4.2, 18.4, 3.6, shade(c, .3), { r: 1.4, wob: 0 }) + circle(0, -11.8, 2.2, shade(c, .3), { wob: 0 }),
    beret: (c) => path("M-9.6 -4.2 C-10 -10.4 6 -12.6 10.6 -6.6 C8 -4 -4 -3.6 -9.6 -4.2 Z", c, { wob: 0 }),
    grad: (c) => path("M-7.4 -4 C-7.6 -8.4 7.6 -8.4 7.4 -4 Z", c, { wob: 0 }) + poly([[-12, -9], [0, -13], [12, -9], [0, -5.6]], c, { wob: 0 }) + strip("M9 -9 L10 -3.6", PAL.mustard, .8, { tex: false }),
    helmet: (c) => path("M-9.6 -1.6 C-10.4 -13.6 10.4 -13.6 9.6 -1.6 Z", c, { wob: 0 }) + rect(-11, -2.8, 22, 2.4, shade(c, -.15), { r: 1, wob: 0 }),
    // 19 世纪的高礼帽（第 1 章伦敦街景等）
    top: (c) => path("M-11.6 -5 C-6 -3.4 6 -3.4 11.6 -5 C9.6 -2.6 -9.6 -2.6 -11.6 -5 Z", shade(c, -.1), { wob: 0 }) + rect(-7, -19, 14, 14.6, c, { r: 1, wob: 0 }) + strip("M-7 -7.2 L7 -7.2", shade(c, .35), 1.6, { tex: false }),
    // 带系带的软帽（19 世纪妇女外出戴）
    bonnet: (c) => path("M-10.6 2 C-12 -12 12 -12 10.6 2 C9 -3 6 -6 0 -6 C-6 -6 -9 -3 -10.6 2 Z", c, { wob: 0 }) + strip("M-9.4 1 L-6 7", shade(c, -.2), 1, { tex: false }),
    crown: (c) => poly([[-7, -5], [-8, -13], [-4, -9], [0, -14], [4, -9], [8, -13], [7, -5]], c, { wob: 0 }),
  };
  const ITEMS = {
    book: (o) => rect(-6, -4.6, 12, 9.2, o.fill || PAL.indigo, { r: 1, wob: .15 }) + rect(-5.2, -3.6, 1.4, 7.2, shade(o.fill || PAL.indigo, -.25), { wob: 0, tex: false }) + rect(-2.6, -2.2, 6.8, 1.4, "#fff8e8", { wob: 0, tex: false, sheen: false }),
    doc: (o) => rect(-5, -6.4, 10, 12.8, "#fffaf0", { wob: .15 }) + strip("M-3 -3.4 L3 -3.4 M-3 -.6 L3 -.6 M-3 2.2 L1.4 2.2", "#8a8fa6", .7, { tex: false }),
    photo: (o) => rect(-6.4, -5, 12.8, 10, "#fffaf0", { wob: .15 }) + rect(-5.2, -3.8, 10.4, 6.8, o.fill || PAL.sky, { wob: 0, sheen: false }) + poly([[-5.2, 3], [-1.6, -.8], [1, 1.6], [2.6, 0], [5.2, 3]], PAL.green, { wob: 0, sheen: false }),
    card: (o) => rect(-6, -7.6, 12, 15.2, o.fill || "#fffaf0", { wob: .15 }) + (o.text ? T(0, 2.6, 7, o.text, "middle") : ""),
    board: (o) => { const w = Math.max(18, textW(o.text || "", 7) + 6); return rect(-w / 2, -6, w, 12, o.fill || "#fffaf0", { wob: .15 }) + (o.text ? T(0, 2.4, 7, o.text, "middle") : ""); },
    cup: (o) => strip("M4.4 -1.6 C7.6 -1.6 7.6 2.6 4.4 2.6", shade(o.fill || PAL.coral, -.2), 1.2, { tex: false }) + path("M-4.6 -4 L4.6 -4 L3.6 4.6 L-3.6 4.6 Z", o.fill || PAL.coral, { wob: 0 }),
    chip: (o) => strip("M-4.4 -6.6 L-4.4 6.6 M0 -6.6 L0 6.6 M4.4 -6.6 L4.4 6.6", "#9aa3ad", 1, { tex: false }) + rect(-6, -5, 12, 10, o.fill || PAL.mustard, { r: 1, wob: .1 }) + rect(-2.8, -2.4, 5.6, 4.8, shade(o.fill || PAL.mustard, -.25), { wob: 0, tex: false }),
    box: (o) => rect(-7, -5.6, 14, 11.2, o.fill || PAL.kraft, { wob: .2 }) + strip("M-7 -1.4 L7 -1.4", shade(o.fill || PAL.kraft, -.25), 1, { tex: false }),
    plant: (o) => blob([[-1, -2], [-5, -9], [-1, -7], [0, -11], [2, -7], [6, -9], [2, -2]], PAL.green) + path("M-4 -2 L4 -2 L3 5 L-3 5 Z", PAL.coral, { wob: 0 }),
  };
  function item(name, cx, cy, s, o) {
    s = s || 1; o = o || {};
    const f = ITEMS[name]; if (!f) return "";
    return '<g transform="translate(' + f1(cx) + " " + f1(cy) + ") scale(" + f1(s) + ')">' + f(o) + "</g>";
  }

  function paperPerson(x, y, o) {
    o = o || {};
    const s = o.s || 1, dir = o.dir === -1 ? -1 : 1, sk = o.skin || PAL.skin, hc = o.hairColor || "#4a3424";
    const shirt = o.coat ? "#fbfbf6" : (o.shirt || (o.jacket ? "#fbfaf4" : PAL.blue)), outer = o.coat ? "#fbfbf6" : (o.jacket || shirt);
    const pants = o.pants || "#3a4466", shoes = o.shoes || "#2a2630";
    const sleeve = shade(outer, -.1);
    const arms = ARMS[o.arms || "stand"] || ARMS.stand;
    const G = inner => '<g transform="translate(' + f1(x) + " " + f1(y) + ") scale(" + f1(s * dir) + " " + f1(s) + ')">' + inner + "</g>";
    let back = "", body = "", fore = "";
    // 背包、长发后层在身体后面
    if (o.bag) back += strip("M-6 10 L5 27", shade(o.bag === true ? PAL.berry : o.bag, -.3), 1.4, { tex: false }) + rect(-14, 15, 8, 12, o.bag === true ? PAL.berry : o.bag, { r: 2 });
    const hb = HAIR[o.hair] && HAIR[o.hair][0];
    if (hb) back += path(hb, hc, { wob: 0 });
    // 凳子（坐姿）
    if (o.legs === "sit" && o.seat !== false) back += stool(0, 46, 1, true);
    // 腿和鞋
    if (o.legs === "sit") {
      body += strip("M-1 28 L12 28.5 L12.5 42.4", pants, 5.2) + strip("M2.5 28 L14 28.5 L14.6 42.4", shade(pants, .08), 5.2);
      body += rect(9.5, 42.4, 9, 3.6, shoes, { r: 1.4, wob: 0 }) + rect(11.6, 42.4, 9, 3.6, shoes, { r: 1.4, wob: 0 });
    } else {
      (LEGS[o.legs || "stand"] || []).forEach(([hx, ang], i) => {
        body += '<g transform="rotate(' + (-ang) + " " + hx + ' 28)">' + rect(hx - 2.6, 26, 5.2, 17.2, i ? shade(pants, .08) : pants, { wob: .15 }) + rect(hx - 3, 42.4, 8, 3.6, shoes, { r: 1.4, wob: 0 }) + "</g>";
      });
    }
    // 裙子盖在腿上
    if (o.skirt) body += poly([[-8, 24], [8, 24], [11.5, 36], [-11.5, 36]], o.skirt === true ? PAL.pink : o.skirt, { wob: .15 });
    // 躯干：圆肩梯形；外套比衬衫长一截
    const torso = "M-7.6 10.2 Q0 7.4 7.6 10.2 L" + (o.coat ? "9.6 36 L-9.6 36" : "8.7 29.6 L-8.7 29.6") + " Z";
    body += rect(-2.2, 6.4, 4.4, 5, shade(sk, -.1), { wob: 0, sheen: false });
    body += path(torso, outer, { wob: 0 });
    if (o.jacket || o.coat) {
      // 西装/白大褂：中间 V 领露出衬衫，两片翻领
      body += path("M-3.2 9 L3.2 9 L0 18 Z", o.coat ? (o.shirt || PAL.sky) : shirt, { wob: 0, sheen: false });
      body += path("M-3.4 8.8 L-1 18.6 L-5.4 12.6 Z M3.4 8.8 L1 18.6 L5.4 12.6 Z", shade(outer, -.12), { wob: 0, sheen: false, tex: false });
      if (o.coat) body += strip("M0 18.6 L0 35", shade(outer, -.15), .6, { tex: false }) + rect(3, 22, 4, 4.4, shade(outer, -.06), { wob: 0, sheen: false });
      else body += '<circle cx=".9" cy="22" r=".7" fill="' + shade(outer, -.4) + '"/><circle cx=".9" cy="26" r=".7" fill="' + shade(outer, -.4) + '"/>';
    }
    if (o.vest) body += path("M-6 10 L-1.4 10 L0 16 L1.4 10 L6 10 L7 27 L-7 27 Z", o.vest === true ? PAL.plum : o.vest, { wob: 0 });
    if (o.tie) body += path("M-1 10.4 L1 10.4 L1.4 12 L.9 12.6 L1.8 21 L0 23 L-1.8 21 L-.9 12.6 L-1.4 12 Z", o.tie === true ? PAL.berry : o.tie, { wob: 0, sheen: false });
    if (o.bow) body += path("M0 10.8 L-4 8.8 L-4 12.8 Z M0 10.8 L4 8.8 L4 12.8 Z", o.bow === true ? PAL.berry : o.bow, { wob: 0, sheen: false }) + '<circle cx="0" cy="10.8" r="1" fill="' + shade(o.bow === true ? PAL.berry : o.bow, -.2) + '"/>';
    if (o.scarf) { const c = o.scarf === true ? PAL.coral : o.scarf; body += rect(-7, 8.4, 14, 3.6, c, { r: 1.6, wob: .1 }) + rect(2.4, 10.6, 3.6, 8, shade(c, -.08), { r: 1, wob: .1 }); }
    if (o.badge) body += rect(-6, 13.4, 4, 4.6, "#fffaf0", { wob: 0 }) + rect(-6, 13.4, 4, 1.4, o.badge === true ? PAL.berry : o.badge, { wob: 0, tex: false, sheen: false });
    // 头（叠在脖子上）：后层头发 → 脸 → 前层头发 → 帽子 → 胡子；五官最后画，保证不被盖住
    let head = ellipse(0, 0, 8.2, 8.7, sk, { wob: .2 });
    if (!(o.hair === "long" || o.hair === "ponytail")) head += circle(-8.2, 1.4, 1.8, shade(sk, -.06), { wob: 0, sheen: false }) + circle(8.2, 1.4, 1.8, shade(sk, -.06), { wob: 0, sheen: false });
    const hf = HAIR[o.hair || "short"] && HAIR[o.hair || "short"][1];
    if (hf && !(o.hat && o.hat !== "grad" && o.hat !== "crown" && o.hair !== "long")) head += path(hf, hc, { wob: 0 });
    else if (o.hat) head += path("M-8.6 1.4 C-9 -1.6 -8.4 -3.4 -7.4 -4 L-6.4 -.6 Z M8.6 1.4 C9 -1.6 8.4 -3.4 7.4 -4 L6.4 -.6 Z", hc, { wob: 0, sheen: false });
    if (o.hat && HATS[o.hat]) head += HATS[o.hat](o.hatColor || (o.hat === "crown" ? PAL.mustard : o.hat === "fedora" ? "#6b5a48" : PAL.indigo));
    if (o.beard) head += path("M-7.6 2 C-7 9.4 7 9.4 7.6 2 C5 5.4 3 5.8 0 6.6 C-3 5.8 -5 5.4 -7.6 2 Z", hc, { wob: 0, sheen: false });
    head += '<g transform="scale(' + dir + ' 1)">' + face(o.face || "smile", o.look || 0, o.glasses) + "</g>";
    if (o.mustache) head += path("M-3.2 3.2 C-1.6 2 1.6 2 3.2 3.2 C1.6 3.8 -1.6 3.8 -3.2 3.2 Z", hc, { wob: 0, sheen: false });
    // 手臂：上臂和小臂是两段纸条，肩上一颗铜钉（纸偶的关节）
    const armSvg = arms.map(a => strip("M" + a[0][0] + " " + a[0][1] + " L" + a[1][0] + " " + a[1][1] + " L" + a[2][0] + " " + a[2][1], sleeve, 4.4) +
      '<circle cx="' + a[0][0] + '" cy="' + a[0][1] + '" r="1.05" fill="#d9a93a"/><circle cx="' + a[0][0] + '" cy="' + a[0][1] + '" r=".4" fill="#7a5a14"/>').join("");
    const hands = arms.map(a => circle(a[2][0], a[2][1], 2.4, sk, { wob: 0, sheen: false })).join("");
    // 手里的东西画在镜像外面（上面的字不反），再把手压在东西两侧
    let held = "";
    const hp = HANDS[o.arms];
    if (hp && o.item) {
      const cx = x + hp[0] * s * dir, cy = y + hp[1] * s;
      held = typeof o.item === "function" ? o.item(cx, cy, s) : item(o.item, cx, cy, s * (o.itemS || 1), { text: o.itemText, fill: o.itemFill });
    }
    const L1 = dir === -1 ? -1 : 1;
    const out = G(back + lay(body, L1) + lay(head, L1)) + G(lay(armSvg, L1)) + held + G(hands);
    // 地面接触影：脚下一团软影，让人"站"在地板上
    const contact = o.legs === "none" ? "" : '<ellipse class="pp-bg" cx="' + f1(x + (o.legs === "sit" ? 4 : 1) * s * dir) + '" cy="' + f1(y + 46 * s) + '" rx="' + f1(12 * s) + '" ry="' + f1(2 * s) + '" fill="#2a1c10" opacity=".22"/>';
    return contact + '<g class="px-person pp-person">' + cut(out, o.lift || 2) + "</g>";
  }
  const paperHand = (x, y, o) => { const s = (o && o.s) || 1, d = o && o.dir === -1 ? -1 : 1, h = HANDS[(o && o.arms) || "hold"] || HANDS.hold; return { x: x + h[0] * s * d, y: y + h[1] * s }; };

  /* ================= 物件 ================= */
  // 物件的 gy 参数都是"地板 y"：物件底边正好落在地板上
  function stool(x, gy, s, raw) {
    s = s || 1; const X = v => x + v * s, Y = v => gy + v * s;
    const g = rect(X(-9), Y(-16.6), 24 * s, 3.4 * s, PAL.wood, { r: 1 }) + rect(X(-7.4), Y(-13.6), 2.8 * s, 13.6 * s, shade(PAL.wood, -.2), { wob: 0 }) + rect(X(10.6), Y(-13.6), 2.8 * s, 13.6 * s, shade(PAL.wood, -.2), { wob: 0 });
    return raw ? g : cut(g, 2);
  }
  const chair = (x, gy, s) => { s = s || 1; return cut(rect(x + 18 * s, gy - 36 * s, 4 * s, 36 * s, shade(PAL.wood, -.1), { wob: .1 }) + rect(x, gy - 17 * s, 24 * s, 3.6 * s, PAL.wood, { r: 1 }) + rect(x + 1.6 * s, gy - 13.4 * s, 2.8 * s, 13.4 * s, shade(PAL.wood, -.2), { wob: 0 }), 2); };
  const desk = (x, gy, w, s) => { s = s || 1; return cut(rect(x, gy - 26 * s, w, 4.4 * s, PAL.wood, { r: 1 }) + rect(x + 3 * s, gy - 21.6 * s, 3.6 * s, 21.6 * s, shade(PAL.wood, -.2), { wob: .1 }) + rect(x + w - 6.6 * s, gy - 21.6 * s, 3.6 * s, 21.6 * s, shade(PAL.wood, -.2), { wob: .1 }), 2); };
  const lamp = (x, gy, s) => { s = s || 1; return cut(rect(x - 5 * s, gy - 3 * s, 10 * s, 3 * s, "#5a6070", { r: 1, wob: 0 }) + strip("M" + x + " " + (gy - 3 * s) + " L" + x + " " + (gy - 40 * s), "#5a6070", 1.6 * s, { tex: false }) + path("M" + (x - 8 * s) + " " + (gy - 38 * s) + " L" + (x + 8 * s) + " " + (gy - 38 * s) + " L" + (x + 5 * s) + " " + (gy - 48 * s) + " L" + (x - 5 * s) + " " + (gy - 48 * s) + " Z", PAL.mustard, { wob: .1 }), 2); };
  const plant = (x, gy, s) => { s = s || 1; return cut(blob([[x - 1, gy - 14 * s], [x - 10 * s, gy - 26 * s], [x - 2 * s, gy - 22 * s], [x, gy - 32 * s], [x + 3 * s, gy - 22 * s], [x + 10 * s, gy - 27 * s], [x + 2 * s, gy - 14 * s]], PAL.green) + path("M" + (x - 7 * s) + " " + (gy - 14 * s) + " L" + (x + 7 * s) + " " + (gy - 14 * s) + " L" + (x + 5 * s) + " " + gy + " L" + (x - 5 * s) + " " + gy + " Z", PAL.coral, { wob: .1 }), 2); };
  const card = (x, y, w, h, fill, o) => { o = o || {}; return cut(rect(x, y, w, h, fill || "#fffaf0", { r: o.r || 1.5 }) + (o.text ? T(x + w / 2, y + h / 2 + (o.size || 11) * .38, o.size || 11, o.text, "middle") : ""), o.lift || 2); };
  const board = (x, y, w, h, o) => { o = o || {}; const fill = o.fill || "#3d5a4c"; return cut(rect(x, y, w, h, PAL.wood, { r: 1.5 }) + rect(x + 3, y + 3, w - 6, h - 6, fill, { wob: .1 }) + (o.text ? T(x + w / 2, y + h / 2 + (o.size || 11) * .38, o.size || 11, o.text, "middle", o.color || "#f4f1e6") : ""), o.lift || 2); };
  // 机柜：底边落在地板上；o.panel 决定面板上画什么（插线板 / 指示灯 / 旋钮）
  function cabinet(x, gy, w, h, o) {
    o = o || {}; const c = o.fill || "#8a9bb0", y = gy - h;
    let g = rect(x, y, w, h, c, { r: 2 }) + rect(x + 3, y + 3, w - 6, h * .55, shade(c, .35), { r: 1, wob: .1 });
    const px = x + 3, py = y + 3, pw = w - 6, ph = h * .55;
    if (o.panel === "plugs") for (let r = 0; r < 4; r++) for (let k = 0; k < Math.floor(pw / 6); k++) g += '<circle cx="' + f1(px + 4 + k * 6) + '" cy="' + f1(py + 5 + r * (ph - 8) / 3) + '" r="1.1" fill="#3a3f4f"/>';
    if (o.panel === "lights") for (let r = 0; r < 3; r++) for (let k = 0; k < Math.floor(pw / 7); k++) g += '<circle cx="' + f1(px + 4 + k * 7) + '" cy="' + f1(py + 6 + r * 8) + '" r="1.7" fill="' + ((r * 3 + k) % 4 ? "#fff3cf" : "#ec8462") + '"/>';
    if (o.panel === "dials") for (let k = 0; k < Math.floor(pw / 11); k++) g += circle(px + 6 + k * 11, py + ph / 2, 3.4, "#f7f0e1", { wob: 0 }) + '<path d="M' + f1(px + 6 + k * 11) + " " + f1(py + ph / 2) + " l" + f1(Math.cos(k) * 2.6) + " " + f1(-2.4) + '" stroke="' + INK + '" stroke-width=".8"/>';
    g += rect(x + 3, y + h * .55 + 7, w - 6, 3, shade(c, -.2), { wob: 0, tex: false });
    g += rect(x + 2, gy - 4, 6, 4, shade(c, -.35), { wob: 0 }) + rect(x + w - 8, gy - 4, 6, 4, shade(c, -.35), { wob: 0 });
    return cut(g, o.lift || 2);
  }


  /* ================= 补几样 kit 物件库里有、原课程没有的东西 ================= */
  ITEMS.phone = (o) => rect(-4, -7, 8, 14, "#3a4466", { r: 1.6, wob: 0 }) + rect(-3, -5.6, 6, 10, o.fill || PAL.sky, { wob: 0, tex: false, sheen: false });
  ITEMS.die = () => rect(-6, -6, 12, 12, "#fffaf0", { r: 2, wob: .1 }) + '<circle cx="-2.5" cy="-2.5" r="1.3" fill="' + INK + '"/><circle cx="2.5" cy="2.5" r="1.3" fill="' + INK + '"/><circle cx="0" cy="0" r="1.3" fill="' + INK + '"/>';
  ITEMS.star = () => { const p = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return poly(p, PAL.mustard, { wob: .1 }); };
  ITEMS.coin = () => circle(0, 0, 6, PAL.mustard, { wob: 0 }) + circle(0, 0, 4, shade(PAL.mustard, .25), { wob: 0, tex: false }) + rect(-.7, -2.4, 1.4, 4.8, shade(PAL.mustard, -.35), { wob: 0, tex: false, sheen: false });
  HATS.wizard = (c) => poly([[-9, -5], [2, -24], [9, -5]], c, { wob: .1 }) + rect(-11, -6.4, 22, 2.6, shade(c, -.15), { r: 1, wob: 0 });

  /* ================= 适配 kit 接口：坐标和姿势名照 kit/illus.js ================= */
  // kit 的人：(x,y) 头心，脚底 = y + 64·s；剪纸纸偶脚底 = y' + 46·S。取 S = 1.35·s，让纸偶和火柴人一样大、脚落在同一条地面上
  const K = 1.35;
  const ARM_MAP = { throw: "wave", club: "hold" }, FACE_MAP = { grin: "happy", shout: "wow", o: "wow", wide: "wow", closed: "sleep" };
  const HAT_MAP = { tophat: "top" };
  // 同一张图里第 k 个人依次换装（服饰区分人物，不只换颜色）
  const STYLES = [
    { hair: "short", shirt: PAL.blue },
    { hat: "cap", hatColor: PAL.coral, shirt: PAL.mustard, hair: "short" },
    { hair: "long", hairColor: "#6b4226", shirt: PAL.pink, skirt: true },
    { hat: "beanie", hatColor: PAL.teal, shirt: PAL.sage, scarf: true },
    { hat: "top", hatColor: "#3a3f4f", jacket: "#5a6070", tie: true, hair: "short" },
  ];
  let personK = 0;
  function conv(x, y, o) {
    o = Object.assign({}, o || {});
    const s = o.s || 1, S = K * s, feet = y + 64 * s;
    const p = { s: S, dir: (o.flip !== undefined ? o.flip : (o.look || 0) < 0) ? -1 : 1, look: o.look ? 1 : 0 };
    p.arms = ARM_MAP[o.arms] || o.arms || "stand";
    p.legs = o.legs || "stand";
    p.face = FACE_MAP[o.face] || o.face || "smile";
    if (o.outfit !== false && !(o.hat || o.hair || o.glasses || o.beard || o.cape || o.tie)) Object.assign(p, STYLES[personK % STYLES.length]);
    if (o.outfit !== false) personK++;
    if (o.hat) { p.hat = HAT_MAP[o.hat] || o.hat; p.hatColor = o.hat === "crown" ? PAL.mustard : o.hat === "wizard" ? PAL.plum : undefined; }
    if (o.hair) p.hair = o.hair === true ? "long" : o.hair;
    if (o.glasses) p.glasses = true;
    if (o.beard) p.beard = true;
    if (o.tie) p.tie = true;
    if (o.shirt) p.shirt = o.shirt;
    if (o.cape) p.scarf = PAL.berry;
    if (o.chair === false) p.seat = false;
    return { p, X: x, Y: feet - 46 * S, S, feet };
  }
  const handPts = (c) => { const a = (ARMS[c.p.arms] || []).map(t => t[2]); return a.map(h => [f1(c.X + h[0] * c.S * c.p.dir), f1(c.Y + h[1] * c.S)]); };
  const wrap = s => '<g stroke="none">' + s + "</g>";
  const A = {
    person: (x, y, o) => { const c = conv(x, y, o); return wrap(paperPerson(c.X, c.Y, c.p)); },
    hands: (x, y, o) => { const k = personK, c = conv(x, y, Object.assign({}, o, { outfit: false })); personK = k; return handPts(c); },
    feetY: (x, y, o) => y + 64 * ((o && o.s) || 1),
    ground: (y) => { y = y || 126; let top = [[-14, 170], [-10, y]]; for (let x = -4, i = 0; x <= 206; x += 11, i++) top.push([x, y - (i % 2 ? 1.9 : 0)]); top.push([212, y], [214, 170]);
      return wrap('<g class="pp-bg">' + cut(blob(top, PAL.meadow, { wob: 0 }), 1) + tuft(20, y + 8, .8) + tuft(176, y + 9, .8) + "</g>"); },
    item: (kind, x, y) => wrap(cut(item(kind, x, y, 1.5), 2)),
    // 手里的东西：画物件，再把两只手压在物件两侧，手才是真的握住
    holding: (x, y, o, kind) => {
      const k = personK, c = conv(x, y, Object.assign({ arms: "hold" }, o, { outfit: false })); personK = k;
      const h = handPts(c); if (h.length < 2) return "";
      const mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
      return wrap(cut(item(kind, mx, my, c.S * 1.1), 2) + h.map(p => circle(p[0], p[1], 2.4 * c.S, PAL.skin, { wob: 0, sheen: false })).join(""));
    },
    bubble: (x, y, w, h, tail, fill) => {
      let tl = "";
      if (tail) { const by = tail[1] > y + h ? y + h - 1 : y + 1, bx = Math.max(x + 10, Math.min(x + w - 10, tail[0])); tl = poly([[bx - 6, by], [bx + 6, by], [tail[0], tail[1]]], fill || "#fffaf0", { wob: 0, sheen: false }); }
      return wrap(cut(tl + rect(x, y, w, h, fill || "#fffaf0", { r: 6, sheen: false }), 2));
    },
    T: (x, y, size, txt, anchor) => T(x, y, Math.max(12, size), txt, anchor),
    arrow: (x1, y1, x2, y2, o) => wrap(arrow(x1, y1, x2, y2, Object.assign({ w: 2.4 }, o))),
    eye: (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="1.8" fill="' + INK + '" stroke="none"/>',
  };
  const paper = { PAL, shade, rect, circle, ellipse, poly, blob, path, strip, cut, lay, T, textW, stage, spot, GY, cloud, tuft, tag, sign, bubble, parrow, arrow,
    paperPerson, paperHand, item, ITEMS, HATS, HAIR, stool, chair, desk, lamp, plant, card, board, cabinet };

  /* ================= 共享定义：交给 vl.js 插进页面 ================= */
  function cutFilter(id, r, dx, dy, blur, op) {
    return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
      '<feMorphology in="SourceAlpha" operator="dilate" radius="' + r + '" result="d"/><feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="edge"/>' +
      '<feGaussianBlur in="d" stdDeviation="' + blur + '"/><feOffset dx="' + dx + '" dy="' + dy + '" result="o"/>' +
      '<feFlood flood-color="#1c2a3c" flood-opacity="' + op + '"/><feComposite in2="o" operator="in" result="sh"/>' +
      '<feMerge><feMergeNode in="sh"/><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  }
  const layFilter = (id, dx) => '<filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation=".45"/><feOffset dx="' + dx + '" dy=".7" result="o"/>' +
    '<feFlood flood-color="#1c2a3c" flood-opacity=".26"/><feComposite in2="o" operator="in" result="sh"/><feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  const DEFS = '<pattern id="pp-fiber" patternUnits="userSpaceOnUse" width="64" height="64"><image href="' + BASE + 'img/fiber.png" width="64" height="64" preserveAspectRatio="none"/></pattern>' +
    '<linearGradient id="pp-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1c2a3c" stop-opacity=".08"/></linearGradient>' +
    '<linearGradient id="pp-skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + PAL.skyTop + '"/><stop offset=".85" stop-color="' + PAL.skyBot + '"/><stop offset="1" stop-color="#f3fbf0"/></linearGradient>' +
    '<linearGradient id="pp-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8dc" stop-opacity=".05"/><stop offset="1" stop-color="#fff8dc" stop-opacity=".42"/></linearGradient>' +
    '<linearGradient id="pp-floorsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a3c" stop-opacity="0"/><stop offset="1" stop-color="#1c2a3c" stop-opacity=".14"/></linearGradient>' +
    cutFilter("pp-cut1", 1.1, .7, 1.1, .8, .22) + cutFilter("pp-cut2", 1.35, 1.2, 1.9, 1.3, .3) + cutFilter("pp-cut3", 1.6, 2, 3, 2, .34) + layFilter("pp-lay", .5) + layFilter("pp-layL", -.5);

  window.VL_SKIN = {
    name: "paper",
    // 正文霞鹜文楷、标题和按钮站酷快乐体：都是 OFL 开源字体，网络加载；离线时退到楷体 / 微软雅黑。英文页标题用 Fredoka（OFL）
    fonts: [
      "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css",
      "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Fredoka:wght@500&display=swap",
    ],
    defs: DEFS,
    palette: { ink: INK, skin: PAL.skin, paper: PAL.cream, white: "#ffffff", yellow: PAL.lemon, pink: PAL.pink, blue: PAL.sky, green: PAL.sage, orange: PAL.peach, purple: PAL.lilac,
      red: PAL.coral, gold: PAL.mustard, wood: PAL.wood, cap: PAL.coral, beanie: PAL.teal, wizard: PAL.plum, dark: "#3a3f4f", grey: PAL.grey },
    illusKit: Object.assign({ paper }, A),
  };

  // 换掉 kit 的画法：illus.js 执行 VL.illus = {...} 时接管（add() 闭包里用的就是同一个 kit 对象，改属性即生效）
  const VL = window.VL = window.VL || {};
  let IL;
  Object.defineProperty(VL, "illus", { configurable: true, enumerable: true, get: () => IL, set: v => {
    IL = v;
    if (v && v.kit) {
      Object.assign(v.kit, window.VL_SKIN.illusKit);
      const r0 = v.kit.reset; v.kit.reset = () => { personK = 0; if (r0) r0(); };
      const add0 = v.add; v.add = function () { personK = 0; const r = add0.apply(this, arguments); personK = 0; return r; };
      window.illusAdd = v.add;
    }
  } });

  /* ================= 题头环境动画：出视口暂停；?freeze= 冻结 ================= */
  function amb() {
    const hero = document.querySelector(".vl-hero"); if (!hero) return;
    let fz = null; try { const q = new URLSearchParams(location.search); if (q.has("freeze")) fz = Math.max(0, parseFloat(q.get("freeze")) || 0); } catch (e) {}
    if (fz !== null) { hero.classList.add("pp-freeze"); hero.style.setProperty("--pp-fz", "-" + fz + "s"); document.documentElement.style.setProperty("--pp-fz", "-" + fz + "s"); return; }
    if ("IntersectionObserver" in window) new IntersectionObserver(es => hero.classList.toggle("pp-out", !es[0].isIntersecting)).observe(hero);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", amb); else amb();
})();
