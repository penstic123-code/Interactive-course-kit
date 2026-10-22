/* 皮肤 fieldbook（田野手账）的脚本部分：放在 <head> 里、kit/vl-head.js 之前。
   做四件事：
   1. 声明 window.VL_SKIN（网络字体、墨线微抖滤镜 #vl-fb-wobble、插画配色）；
   2. 换上本皮肤的插画绘制工具（墨线 + 淡彩人物，接口照 kit/illus.js：person / hands / holding / feetY / ground / item / bubble / T / arrow）：
      kit/illus.js 赋值 VL.illus 时，把本皮肤的函数装进 VL.illus.kit；
   3. 彩铅化：同目录 rough.js（Rough.js 4.6.6，MIT）把插画 .vl-il-rough 组里的描边重画成铅笔线，大块色面叠彩铅排线；
      插画进入视口时才处理（隐藏的轮播页、收起的分节量不出尺寸）；没有 rough.js 时退回 SVG 滤镜微抖；
   4. 章节页右侧生成篇章索引签 nav.vl-fb-tabs。
   滤镜规则：feDisplacementMap 写 in="SourceGraphic"；文字永远不进滤镜组。 */
(function () {
  "use strict";
  var HERE = (document.currentScript && document.currentScript.src || "").replace(/[^\/]*$/, "");
  var INK = "#3a342e";
  var COL = { ochre: "#d6ac64", teal: "#9cbdb6", olive: "#b8bd8a", rust: "#cf9a80", indigo: "#a7aecb", plum: "#c2a5b8", sand: "#eadbbb", sky: "#d4e3e7", leaf: "#a8c294", red: "#b96a5b", navy: "#5f6884", brown: "#94714f", white: "#fbf8f1", paper: "#fbf6ea", gray: "#b8b1a6" };
  var SK = ["#efd2b6", "#ddb28f", "#c19270", "#9a6a4c", "#7a5038"];

  window.VL_SKIN = {
    name: "fieldbook",
    fonts: [
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.1.0/400.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.1.0/700.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.1.0/900.css",
      "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css",
      "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,700&display=swap",
    ],
    defs: '<filter id="vl-fb-wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>',
    // 插画配色：低饱和彩铅色。kit 的通用色名（yellow pink blue…）也映射过来，章节代码用 k.C.yellow 照样能画
    palette: {
      ink: INK, skin: SK[0], paper: COL.paper, white: COL.white, grey: COL.gray, dark: "#4a443d",
      yellow: "#e9cf8a", pink: "#e3b4a8", blue: COL.sky, green: COL.leaf, orange: COL.ochre, purple: COL.indigo,
      red: COL.red, gold: "#e3b23c", wood: COL.brown, cap: COL.red, beanie: COL.navy, wizard: COL.plum,
      ochre: COL.ochre, teal: COL.teal, olive: COL.olive, rust: COL.rust, indigo: COL.indigo, plum: COL.plum, sand: COL.sand, sky: COL.sky, leaf: COL.leaf, navy: COL.navy, brown: COL.brown,
    },
  };

  /* ---------------- 绘制工具（抽自人类学课 js/illus.js，改成 kit 的接口：x,y = 头部中心） ---------------- */
  var f = function (n) { return Math.round(n * 10) / 10; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function P(d, fill, sw) { return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function Ci(cx, cy, r, fill, sw) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '"/>'; }
  function E(cx, cy, rx, ry, fill, sw) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '"/>'; }
  function B(x, y, w, h, fill, rx, sw) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + (rx || 0) + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || 2) + '"/>'; }
  function W(d, color, op) { return '<path d="' + d + '" fill="' + color + '" opacity="' + (op || 0.55) + '" stroke="none"/>'; }
  function T(x, y, size, text, anchor, fill) { return '<text x="' + x + '" y="' + y + '" font-size="' + Math.max(12, size || 12) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ' fill="' + (fill || INK) + '" font-weight="700" stroke="none">' + esc(text) + "</text>"; }

  // 地面：一道铅笔线 + 淡沙色影
  function ground(y, x1, x2) {
    y = y || 126; x1 = x1 === undefined ? 6 : x1; x2 = x2 === undefined ? 194 : x2;
    var m = (x1 + x2) / 2, q = (x1 + m) / 2;
    return W("M" + x1 + " " + (y + 1) + " Q" + m + " " + (y + 7) + " " + x2 + " " + (y + 2) + " L" + x2 + " " + (y + 9) + " L" + x1 + " " + (y + 9) + "Z", COL.sand, 0.8) +
      P("M" + x1 + " " + y + " Q" + q + " " + (y - 2) + " " + m + " " + (y + 1) + " T" + x2 + " " + y, "none", 2);
  }
  function arrow(x1, y1, x2, y2, col) {
    var a = Math.atan2(y2 - y1, x2 - x1), h = 7, c = col || INK;
    return '<path d="M' + x1 + " " + y1 + " L" + x2 + " " + y2 + " M" + f(x2 - h * Math.cos(a - 0.5)) + " " + f(y2 - h * Math.sin(a - 0.5)) + " L" + x2 + " " + y2 + " L" + f(x2 - h * Math.cos(a + 0.5)) + " " + f(y2 - h * Math.sin(a + 0.5)) + '" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  // 气泡：kit 签名 bubble(x, y, w, h, [尾尖x, 尾尖y], fill)；字另用 T 写在文字层
  function bubble(x, y, w, h, tail, fill) {
    var c = fill || COL.paper, s = B(x, y, w, h, c, 7, 1.8);
    if (tail) {
      var bx = Math.max(x + 12, Math.min(x + w - 12, tail[0])), by = tail[1] > y + h ? y + h : y;
      s += '<path d="M' + f(bx - 6) + " " + by + " L" + f(tail[0]) + " " + f(tail[1]) + " L" + f(bx + 6) + " " + by + '" fill="' + c + '" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M' + f(bx - 5) + " " + by + " H" + f(bx + 5) + '" stroke="' + c + '" stroke-width="3"/>';
    }
    return s;
  }
  // 物件：(x,y) 是物件中心；尺寸按两手间距（约 14）画，holding 时两手正好握住两侧
  var ITEMS = {
    book: function (x, y) { return B(x - 9, y - 7, 18, 13, COL.rust, 1, 1.6) + P("M" + x + " " + (y - 7) + " V" + (y + 6), "none", 1.2); },
    notebook: function (x, y) { return B(x - 8, y - 7, 16, 12, COL.paper, 1, 1.6) + P("M" + (x - 5) + " " + (y - 3) + " h10 M" + (x - 5) + " " + y + " h10", "none", 1); },
    box: function (x, y) { return B(x - 10, y - 8, 20, 16, COL.ochre, 1, 1.8) + P("M" + (x - 10) + " " + (y - 3) + " h20", "none", 1.1); },
    cup: function (x, y) { return P("M" + (x - 5) + " " + (y - 7) + " h10 l-1.5 12 h-7z", COL.white, 1.6); },
    phone: function (x, y) { return B(x - 4, y - 7, 8, 14, COL.navy, 1.5, 1.6) + B(x - 2.5, y - 5.5, 5, 9, COL.sky, 0.5, 0.8); },
    die: function (x, y) { return B(x - 7, y - 7, 14, 14, COL.white, 3, 1.6) + Ci(x - 3, y - 3, 1.3, INK, .5) + Ci(x + 3, y + 3, 1.3, INK, .5); },
    star: function (x, y) { return P("M" + x + " " + (y - 9) + " l2.8 5.8 6.2 .8 -4.5 4.3 1.1 6.2 -5.6 -3 -5.6 3 1.1 -6.2 -4.5 -4.3 6.2 -.8z", "#e3b23c", 1.4); },
    coin: function (x, y) { return Ci(x, y, 7, "#e3b23c", 1.6) + P("M" + x + " " + (y - 3) + " V" + (y + 3), "none", 1.2); },
    letters: function (x, y) { return B(x - 9, y - 7, 16, 11, COL.paper, 1, 1.4) + B(x - 6, y - 4, 16, 11, COL.paper, 1, 1.4) + P("M" + (x - 6) + " " + (y - 4) + " l8 6 l8 -6", "none", 1.2); },
    basket: function (x, y) { return P("M" + (x - 10) + " " + (y - 5) + " h20 l-3 12 h-14z", COL.ochre, 1.6) + P("M" + (x - 8) + " " + y + " h16", "none", 1); },
    bag: function (x, y) { return B(x - 7, y - 5, 14, 12, COL.rust, 2, 1.6) + P("M" + (x - 4) + " " + (y - 5) + " q4 -7 8 0", "none", 1.4); },
    shell: function (x, y) { return P("M" + (x - 8) + " " + (y + 4) + " Q" + x + " " + (y - 12) + " " + (x + 8) + " " + (y + 4) + "Z", COL.white, 1.5) + P("M" + x + " " + (y + 4) + " V" + (y - 5) + " M" + (x - 4) + " " + (y + 4) + " L" + (x - 2) + " " + (y - 3) + " M" + (x + 4) + " " + (y + 4) + " L" + (x + 2) + " " + (y - 3), "none", 1); },
    trowel: function (x, y) { return P("M" + (x - 6) + " " + (y - 6) + " l6 6", "none", 3) + P("M" + (x - 1) + " " + (y - 1) + " l9 3 l-4 9Z", COL.gray, 1.5); },
    mic: function (x, y) { return B(x - 5, y - 7, 10, 13, COL.navy, 2, 1.6) + Ci(x, y - 3, 2.2, COL.red, 1); },
  };
  function item(kind, x, y) { return ITEMS[kind] ? ITEMS[kind](x, y) : ""; }
  // 小场景物件（本皮肤独有）：凳子、桌子、房子、树、太阳，y 是落地的那条线
  function stool(x, y, s) { s = s || 1; return P("M" + (x - 11 * s) + " " + (y - 22 * s) + " h" + 22 * s, "none", 3) + P("M" + (x - 8 * s) + " " + (y - 21 * s) + " L" + (x - 10 * s) + " " + y + " M" + (x + 8 * s) + " " + (y - 21 * s) + " L" + (x + 10 * s) + " " + y, "none", 2); }
  function table(x, y, w, s) { s = s || 1; return B(x, y - 30 * s, w, 5 * s, COL.brown, 1) + P("M" + (x + 4) + " " + (y - 25 * s) + " V" + y + " M" + (x + w - 4) + " " + (y - 25 * s) + " V" + y, "none", 2); }
  function house(x, y, w, h, roof, wall) { return B(x, y - h, w, h, wall || COL.sand) + P("M" + (x - 6) + " " + (y - h) + " L" + (x + w / 2) + " " + (y - h - w * 0.45) + " L" + (x + w + 6) + " " + (y - h) + "Z", roof || COL.rust) + B(x + w / 2 - 6, y - 18, 12, 18, COL.brown); }
  function tree(x, y, s) { s = s || 1; return P("M" + x + " " + y + " V" + (y - 26 * s), "none", 3) + Ci(x, y - 36 * s, 14 * s, COL.leaf) + Ci(x - 9 * s, y - 28 * s, 9 * s, COL.leaf) + Ci(x + 10 * s, y - 29 * s, 9 * s, COL.leaf); }
  function sun(x, y, r) { r = r || 9; var d = ""; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; d += "M" + f(x + (r + 3) * Math.cos(a)) + " " + f(y + (r + 3) * Math.sin(a)) + " L" + f(x + (r + 8) * Math.cos(a)) + " " + f(y + (r + 8) * Math.sin(a)) + " "; } return Ci(x, y, r, COL.ochre) + P(d, "none", 1.6); }

  /* 人物：墨线 + 淡彩衣服，嘴一条线、眼睛两个点、短脖子。x,y = 头部中心（kit 接口）；
     站姿脚底 = y + 64·s，坐姿脚底 = y + 63·s（都落在 ground 126 上，与 kit 火柴人一致）。 */
  var K = 0.883;   // 原画（人类学课）身高 72.5，缩到 kit 的 64
  var OUTFITS = [{}, { hat: "cap" }, { hair: "long" }, { hat: "bucket" }, { hat: "straw" }];
  var personK = 0;
  var TOPS = [COL.teal, COL.rust, COL.olive, COL.indigo, COL.plum, COL.ochre];
  function geo(x, y, o) {
    var s = o.s || 1, S = function (v) { return v * s * K; };
    var fl = (o.flip !== undefined ? o.flip : (o.look || 0) < 0) ? -1 : 1;
    var hy = y, sh = hy + S(10.5), hip = sh + S(28);
    var sit = o.legs === "sit", foot = sit ? (o.floor || y + 63 * s) : hip + S(34);
    return { s: s, S: S, fl: fl, hy: hy, sh: sh, hip: hip, foot: foot, sit: sit };
  }
  function handsOf(x, g, a) {
    var S = g.S, fl = g.fl, sh = g.sh, hip = g.hip, hy = g.hy;
    var l = [x - S(13), hip - S(2)], r = [x + S(13), hip - S(2)];
    if (a === "hold" || a === "club") { l = [x - S(7.5), sh + S(17)]; r = [x + S(7.5), sh + S(17)]; }
    if (a === "desk") { l = [x + fl * S(6), hip - S(5)]; r = [x + fl * S(16), hip - S(5)]; }
    if (a === "point") r = [x + fl * S(27), sh - S(2)];
    if (a === "wave" || a === "throw") r = [x + fl * S(20), sh - S(18)];
    if (a === "up") { l = [x - S(16), sh - S(20)]; r = [x + S(16), sh - S(20)]; }
    if (a === "chin") r = [x + fl * S(4), hy + S(9)];
    if (a === "cover") { l = [x - S(5), hy + S(3)]; r = [x + S(5), hy + S(3)]; }
    if (a === "none") return [];
    return [l.map(f), r.map(f)];
  }
  function hands(x, y, o) { o = o || {}; var g = geo(x, y, o); return handsOf(x, g, o.arms || "stand"); }
  function feetY(x, y, o) { return f(geo(x, y, o || {}).foot); }
  function person(x, y, o) {
    o = Object.assign({}, o || {});
    if (o.outfit !== false) {
      var st = OUTFITS[personK % OUTFITS.length];
      if (!(o.hat || o.hair || o.glasses || o.beard || o.cape || o.tie)) for (var k in st) o[k] = st[k];
      if (!o.shirt && !o.top) o.top = TOPS[personK % TOPS.length];
      personK++;
    }
    if (o.hair === true) o.hair = "long";
    if (o.hat === "beanie") o.hat = "bucket";
    if (o.hat === "tophat" || o.hat === "crown" || o.hat === "wizard") o.hat = "pith";
    var g = geo(x, y, o), S = g.S, sk = o.skin || SK[0], top = o.shirt || o.top || COL.teal, bc = o.bottomColor || COL.navy;
    var hip = g.hip, sh = g.sh, hy = g.hy, Y = g.foot, out = "";
    // 腿与凳子
    if (g.sit) {
      if (o.chair !== false && o.seat !== false) out += B(x - S(17), hip - S(1), S(34), S(5), COL.brown, 1.5, 1.6) + P("M" + f(x - S(14)) + " " + f(hip + S(4)) + " L" + f(x - S(15)) + " " + f(Y) + " M" + f(x + S(14)) + " " + f(hip + S(4)) + " L" + f(x + S(15)) + " " + f(Y), "none", 2);
      out += P("M" + f(x - S(10)) + " " + f(hip + S(6)) + " H" + f(x - S(2)) + " L" + f(x - S(2.5)) + " " + f(Y) + " H" + f(x - S(9.5)) + "Z", bc, 1.8);
      out += P("M" + f(x + S(2)) + " " + f(hip + S(6)) + " H" + f(x + S(10)) + " L" + f(x + S(9.5)) + " " + f(Y) + " H" + f(x + S(2.5)) + "Z", bc, 1.8);
      out += P("M" + f(x - S(11)) + " " + f(hip - S(3)) + " H" + f(x + S(11)) + " V" + f(hip + S(7)) + " H" + f(x - S(11)) + "Z", bc, 1.8);
      out += E(x - S(6), Y - S(1.5), S(4.6), S(2.3), INK, 1) + E(x + S(6), Y - S(1.5), S(4.6), S(2.3), INK, 1);
    } else if (o.legs !== "none") {
      if (o.bottom === "skirt" || o.bottom === "sarong") {
        var len = o.bottom === "sarong" ? S(30) : S(22);
        out += P("M" + f(x - S(4)) + " " + f(hip + len - 2) + " V" + f(Y - 1) + " M" + f(x + S(4)) + " " + f(hip + len - 2) + " V" + f(Y - 1), "none", S(3));
        out += P("M" + f(x - S(9)) + " " + f(hip - S(2)) + " L" + f(x + S(9)) + " " + f(hip - S(2)) + " L" + f(x + S(12)) + " " + f(hip + len) + " L" + f(x - S(12)) + " " + f(hip + len) + "Z", bc, 1.8);
        out += E(x - S(5), Y - S(1.5), S(4.5), S(2.2), INK, 1) + E(x + S(5), Y - S(1.5), S(4.5), S(2.2), INK, 1);
      } else {
        var wk = o.legs === "walk" ? S(5) : o.legs === "run" ? S(8) : o.legs === "wide" ? S(4) : 0;
        out += P("M" + f(x - S(9)) + " " + f(hip - S(2)) + " L" + f(x + S(9)) + " " + f(hip - S(2)) + " L" + f(x + S(8) + wk) + " " + f(Y) + " L" + f(x + S(2) + wk) + " " + f(Y) + " L" + f(x) + " " + f(hip + S(10)) + " L" + f(x - S(2) - wk) + " " + f(Y) + " L" + f(x - S(8) - wk) + " " + f(Y) + "Z", bc, 1.8);
        out += E(x - S(5) - wk, Y - S(1.5), S(4.8), S(2.3), INK, 1) + E(x + S(5) + wk, Y - S(1.5), S(4.8), S(2.3), INK, 1);
      }
    }
    // 身体（coat:true 长外套）
    var coat = o.coat ? S(10) : 0;
    out += P("M" + f(x - S(11)) + " " + f(hip + coat) + " L" + f(x - S(12)) + " " + f(sh + S(5)) + " Q" + f(x) + " " + f(sh - S(3)) + " " + f(x + S(12)) + " " + f(sh + S(5)) + " L" + f(x + S(11)) + " " + f(hip + coat) + "Z", top, 1.8);
    if (o.coat) out += P("M" + f(x) + " " + f(sh + S(1)) + " V" + f(hip + coat), "none", 1.2);
    if (o.tie) out += P("M" + f(x) + " " + f(sh + S(1)) + " l" + f(-S(2.5)) + " " + f(S(5)) + " l" + f(S(2.5)) + " " + f(S(9)) + " l" + f(S(2.5)) + " " + f(-S(9)) + "z", COL.red, 1.2);
    if (o.cape) out += P("M" + f(x - S(10)) + " " + f(sh + S(3)) + " q" + f(-S(10) * g.fl) + " " + f(S(16)) + " " + f(-S(6) * g.fl) + " " + f(S(32)) + " l" + f(S(12) * g.fl) + " 0z", COL.red, 1.6);
    // 手臂：衣袖粗线 + 一点肤色手
    var a = o.arms || "stand", hs = handsOf(x, g, a), L0 = [x - S(11), sh + S(5)], R0 = [x + S(11), sh + S(5)];
    var arm = function (p0, p1) {
      var mx = (p0[0] + p1[0]) / 2 + (p1[0] > x ? S(3) : -S(3)), my = (p0[1] + p1[1]) / 2 + S(3), d = "M" + f(p0[0]) + " " + f(p0[1]) + " Q" + f(mx) + " " + f(my) + " " + p1[0] + " " + p1[1];
      return '<path d="' + d + '" fill="none" stroke="' + top + '" stroke-width="' + f(S(5.5)) + '" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>' + Ci(p1[0], p1[1], S(2.6), sk, 1.2);
    };
    if (hs.length) {
      // 左右手按离哪边肩近分配，免得手臂交叉
      var hl = hs[0], hr = hs[1];
      if (hl[0] > hr[0]) { var t = hl; hl = hr; hr = t; }
      out += arm(L0, hl) + arm(R0, hr);
    }
    // 头、脖子、头发、帽子
    out += '<path d="M' + f(x) + " " + f(sh - S(1)) + " V" + f(hy + S(8)) + '" stroke="' + sk + '" stroke-width="' + f(S(4)) + '" fill="none"/>';
    var hc = o.hairColor || INK, R = S(9.5);
    if (o.hair === "long") out += P("M" + f(x - R - S(1)) + " " + f(hy - S(2)) + " Q" + f(x - R - S(3)) + " " + f(hy + S(16)) + " " + f(x - R + S(2)) + " " + f(hy + S(19)) + " L" + f(x + R - S(2)) + " " + f(hy + S(19)) + " Q" + f(x + R + S(3)) + " " + f(hy + S(16)) + " " + f(x + R + S(1)) + " " + f(hy - S(2)) + "Z", hc, 1.4);
    if (o.hair === "bob") out += P("M" + f(x - R - S(1.5)) + " " + f(hy - S(2)) + " L" + f(x - R - S(1)) + " " + f(hy + S(8)) + " L" + f(x + R + S(1)) + " " + f(hy + S(8)) + " L" + f(x + R + S(1.5)) + " " + f(hy - S(2)) + "Z", hc, 1.4);
    out += Ci(x, hy, R, sk, 1.8);
    if (o.hair !== "bald") {
      if (o.hair === "curly") out += [-7, -3.5, 0, 3.5, 7].map(function (dx) { return Ci(x + S(dx), hy - S(8), S(4), hc, 1.2); }).join("") + Ci(x - S(9), hy - S(3), S(3.4), hc, 1.2) + Ci(x + S(9), hy - S(3), S(3.4), hc, 1.2);
      else if (!o.hat || o.hat === "none") out += P("M" + f(x - R) + " " + f(hy - S(2)) + " Q" + f(x - R) + " " + f(hy - R - S(1)) + " " + f(x) + " " + f(hy - R - S(1)) + " Q" + f(x + R) + " " + f(hy - R - S(1)) + " " + f(x + R) + " " + f(hy - S(2)) + " Q" + f(x + S(3)) + " " + f(hy - S(11)) + " " + f(x - R) + " " + f(hy - S(2)) + "Z", hc, 1.4);
      if (o.hair === "bun") out += Ci(x + S(2), hy - R - S(4), S(4.2), hc, 1.4);
    }
    if (o.beard) out += P("M" + f(x - S(7)) + " " + f(hy + S(3)) + " Q" + f(x) + " " + f(hy + S(15)) + " " + f(x + S(7)) + " " + f(hy + S(3)) + " Q" + f(x) + " " + f(hy + S(7)) + " " + f(x - S(7)) + " " + f(hy + S(3)) + "Z", o.beardColor || hc, 1.2);
    var hcol = o.hatColor;
    if (o.hat === "bucket") out += P("M" + f(x - S(14)) + " " + f(hy - S(4)) + " Q" + f(x) + " " + f(hy - S(9)) + " " + f(x + S(14)) + " " + f(hy - S(4)) + " L" + f(x + S(8)) + " " + f(hy - S(15)) + " L" + f(x - S(8)) + " " + f(hy - S(15)) + "Z", hcol || COL.ochre, 1.6);
    if (o.hat === "straw") out += E(x, hy - S(6), S(17), S(4), hcol || "#e9c77a", 1.5) + P("M" + f(x - S(8)) + " " + f(hy - S(7)) + " Q" + f(x) + " " + f(hy - S(19)) + " " + f(x + S(8)) + " " + f(hy - S(7)), hcol || "#e9c77a", 1.5);
    if (o.hat === "cap") out += P("M" + f(x - S(10)) + " " + f(hy - S(3)) + " Q" + f(x) + " " + f(hy - S(16)) + " " + f(x + S(10)) + " " + f(hy - S(3)) + "Z", hcol || COL.red, 1.5) + P("M" + f(x + g.fl * S(4)) + " " + f(hy - S(3)) + " h" + f(g.fl * S(12)), "none", f(S(3)));
    if (o.hat === "pith") out += E(x, hy - S(4), S(15), S(3.5), hcol || "#ece0c2", 1.5) + P("M" + f(x - S(10)) + " " + f(hy - S(5)) + " Q" + f(x) + " " + f(hy - S(20)) + " " + f(x + S(10)) + " " + f(hy - S(5)), hcol || "#ece0c2", 1.5);
    if (o.hat === "scarf") out += P("M" + f(x - R - S(2)) + " " + f(hy + S(4)) + " Q" + f(x - R - S(2)) + " " + f(hy - R - S(4)) + " " + f(x) + " " + f(hy - R - S(4)) + " Q" + f(x + R + S(2)) + " " + f(hy - R - S(4)) + " " + f(x + R + S(2)) + " " + f(hy + S(4)) + " Q" + f(x) + " " + f(hy - S(4)) + " " + f(x - R - S(2)) + " " + f(hy + S(4)) + "Z", hcol || COL.plum, 1.4);
    // 脸：放进 .norough 组，彩铅化时不抖，五官清楚。眼睛两个点，嘴一条线（o / shout / wide 是张开的小口）
    var lk = (o.look || 0) * S(1.5), ex = S(3.4), fc = o.face || "smile";
    out += '<g class="norough">';
    if (fc === "closed") out += P("M" + f(x - ex - S(1.4) + lk) + " " + f(hy) + " h" + f(S(2.8)) + " M" + f(x + ex - S(1.4) + lk) + " " + f(hy) + " h" + f(S(2.8)), "none", 1.1);
    else out += Ci(x - ex + lk, hy, S(1.3), INK, .5) + Ci(x + ex + lk, hy, S(1.3), INK, .5);
    if (fc === "o" || fc === "shout" || fc === "wide") out += E(x + lk, hy + S(5), S(1.6), S(fc === "shout" ? 2.2 : 1.6), INK, .5);
    else if (fc === "sad") out += P("M" + f(x - S(2.4) + lk) + " " + f(hy + S(5.4)) + " q" + f(S(2.4)) + " " + f(-S(1.4)) + " " + f(S(4.8)) + " 0", "none", 1.2);
    else out += P("M" + f(x - S(2.4) + lk) + " " + f(hy + S(4.6)) + " h" + f(S(4.8)), "none", 1.2);
    if (o.glasses) out += Ci(x - ex + lk, hy, S(3), "none", 1.2) + Ci(x + ex + lk, hy, S(3), "none", 1.2) + P("M" + f(x - S(0.4) + lk) + " " + f(hy) + " h" + f(S(0.8)), "none", 1);
    out += "</g>";
    // 道具（原画写法 o.prop）：画在两手之间
    if (o.prop && ITEMS[o.prop] && hs.length) { var hm = a === "hold" ? [(hs[0][0] + hs[1][0]) / 2, hs[0][1]] : hs[1]; out += ITEMS[o.prop](f(hm[0]), f(hm[1])); }
    return out;
  }
  function holding(x, y, o, kind) { var h = hands(x, y, Object.assign({ arms: "hold" }, o)); if (h.length < 2) return ""; return item(kind, f((h[0][0] + h[1][0]) / 2), f((h[0][1] + h[1][1]) / 2)); }
  var FB = { person: person, hands: hands, feetY: feetY, ground: ground, T: T, bubble: bubble, arrow: arrow, item: item, holding: holding,
    eye: function (x, y) { return Ci(x, y, 1.3, INK, .5); },
    P: P, Ci: Ci, E: E, B: B, W: W, stool: stool, table: table, house: house, tree: tree, sun: sun, COL: COL, SK: SK, INK: INK,
    reset: function () { personK = 0; } };
  window.VL_SKIN.kit = FB;

  /* ---------------- 把绘制工具装进 kit/illus.js ---------------- */
  // kit/illus.js 执行 VL.illus = {...} 时接住它：换函数、给 add 包上换装计数清零、mount 后排队彩铅化
  var VL = window.VL = window.VL || {};
  var illusVal;
  Object.defineProperty(VL, "illus", {
    configurable: true, enumerable: true,
    get: function () { return illusVal; },
    set: function (v) {
      illusVal = v;
      if (!v || !v.kit) return;
      var C = v.kit.C;
      Object.assign(v.kit, FB); if (C) v.kit.C = C;
      var add0 = v.add;
      v.add = function () { personK = 0; var r = add0.apply(this, arguments); personK = 0; return r; };
      var mount0 = v.mount;
      v.mount = function (scope) { var r = mount0.apply(this, arguments); watch(scope || document); return r; };
      // illus.js 紧接着把旧名 illusAdd 指向原函数；等它跑完再换回包过的
      setTimeout(function () { window.illusAdd = v.add; }, 0);
      try { Promise.resolve().then(function () { window.illusAdd = v.add; }); } catch (e) {}
    },
  });

  /* ---------------- 彩铅化（Rough.js） ---------------- */
  var roughReady = false, queue = [];
  function loadRough() {
    if (window.rough) { roughReady = true; return; }
    if (!HERE) return;
    var s = document.createElement("script"); s.src = HERE + "rough.js";
    s.onload = function () { roughReady = !!window.rough; var q = queue; queue = []; q.forEach(roughen); };
    (document.head || document.documentElement).appendChild(s);
  }
  loadRough();
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting || e.intersectionRatio > 0) { io.unobserve(e.target); roughenLater(e.target); } });
  }, { rootMargin: "200px" }) : null;
  function watch(scope) {
    (scope.querySelectorAll ? scope : document).querySelectorAll(".vl-illus-svg").forEach(function (svg) {
      if (svg._fbW) return; svg._fbW = 1;
      if (io) io.observe(svg); else roughenLater(svg);
    });
  }
  function roughenLater(svg) { if (roughReady) roughen(svg); else queue.push(svg); }
  var hex = function (h) { var m = /^#([0-9a-f]{6})$/i.exec(h || ""); return m ? parseInt(m[1], 16) : null; };
  var darken = function (h, k) { var n = hex(h); if (n === null) return null; var c = function (v) { return Math.max(0, Math.round(v * k)).toString(16).padStart(2, "0"); }; return "#" + c(n >> 16) + c((n >> 8) & 255) + c(n & 255); };
  var lighten = function (h, k) { var n = hex(h); if (n === null) return null; var c = function (v, p) { return Math.round(v + (p - v) * k).toString(16).padStart(2, "0"); }; return "#" + c(n >> 16, 251) + c((n >> 8) & 255, 247) + c(n & 255, 236); };
  var lum = function (h) { var n = hex(h); if (n === null) return 1; return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; };
  function roughen(svg) {
    if (!window.rough || !svg || svg._fbR) return;
    var grp = svg.querySelector(".vl-il-rough"); if (!grp) return;
    var rc; try { rc = window.rough.svg(svg); } catch (e) { return; }
    svg._fbR = 1;
    var seed = 1, tb = null, GRAPHITE = "#4a443d";
    var texts = function () { return tb || (tb = Array.prototype.map.call(svg.querySelectorAll("text"), function (t) { try { return t.getBBox(); } catch (e) { return null; } }).filter(Boolean)); };
    var hasText = function (b) { return texts().some(function (t) { return t.x < b.x + b.width && t.x + t.width > b.x && t.y < b.y + b.height && t.y + t.height > b.y; }); };
    var inh = function (el, n) { for (var p = el; p && p !== svg; p = p.parentNode) { var v = p.getAttribute && p.getAttribute(n); if (v) return v; } return null; };
    grp.querySelectorAll("rect,circle,ellipse,line,path").forEach(function (el) {
      if (el.closest("[data-rd],.norough")) return;
      var stroke = inh(el, "stroke"), sw = parseFloat(inh(el, "stroke-width") || "1");
      var fill = el.getAttribute("fill") || inh(el, "fill"), t = el.tagName.toLowerCase(), A = function (n) { return parseFloat(el.getAttribute(n) || 0); };
      if (!stroke || stroke === "none" || /^url|var\(/.test(stroke)) return;
      if (sw > 3.6) { return; }   // 粗色线（衣袖）保持原样
      var bb; try { bb = el.getBBox(); } catch (e) { return; }
      var size = Math.max(bb.width, bb.height), area = bb.width * bb.height;
      if (size < 9) return;
      var k = size < 30 ? 0.5 : size < 70 ? 0.85 : 1.15, pen = lum(stroke) < 0.35 ? GRAPHITE : stroke;
      var o = { stroke: pen, strokeWidth: Math.max(0.8, sw * 0.62), roughness: k, bowing: k * 0.9, seed: seed++, preserveVertices: size < 30 };
      var draw = function (opt) {
        if (t === "rect") return rc.rectangle(A("x"), A("y"), A("width"), A("height"), opt);
        if (t === "circle") return rc.circle(A("cx"), A("cy"), 2 * A("r"), opt);
        if (t === "ellipse") return rc.ellipse(A("cx"), A("cy"), 2 * A("rx"), 2 * A("ry"), opt);
        if (t === "line") return rc.line(A("x1"), A("y1"), A("x2"), A("y2"), opt);
        return rc.path(el.getAttribute("d"), opt);
      };
      var node; try { node = draw(o); } catch (e) { return; }
      if (!node) return;
      var prep = function (n) { n.setAttribute("data-rd", "1"); ["transform", "opacity"].forEach(function (a) { if (el.getAttribute(a)) n.setAttribute(a, el.getAttribute(a)); }); return n; };
      prep(node);
      var dash = el.getAttribute("stroke-dasharray") || inh(el, "stroke-dasharray");
      node.querySelectorAll("path").forEach(function (p) { p.setAttribute("stroke-opacity", "0.88"); if (dash) p.setAttribute("stroke-dasharray", dash); });
      if (fill && fill !== "none" && t !== "line" && hex(fill) !== null) {
        var col = darken(fill, 0.84), ht = hasText(bb);
        if (ht || area > 30000 || size < 26 || el.closest("[data-nohatch]")) {
          el.setAttribute("fill", lighten(fill, ht ? 0.25 : 0.35)); el.after(node);
        } else {
          el.setAttribute("fill", lighten(fill, 0.68));
          var h = null; try { h = draw({ stroke: "none", fill: col, fillStyle: "hachure", hachureGap: area < 1500 ? 2.4 : 3.4, fillWeight: 0.8, hachureAngle: -41 + ((seed * 37) % 17) - 8, roughness: 0.9, seed: seed++ }); } catch (e) {}
          if (h) { prep(h); h.setAttribute("opacity", "0.9"); el.after(h); h.after(node); } else el.after(node);
        }
        el.setAttribute("stroke", "none");
      } else if (fill && fill !== "none") {
        el.after(node); el.setAttribute("stroke", "none");   // var() 填色：保留底色，只换描边
      } else { el.after(node); el.setAttribute("visibility", "hidden"); }
      el.setAttribute("data-rd", "1");
    });
    grp.classList.add("vl-fb-done");
    document.documentElement.classList.add("vl-fb-rough");
  }
  window.VL_SKIN.roughen = function (root) { watch(root || document); };

  /* ---------------- 篇章索引签 ---------------- */
  function tabs() {
    var V = window.VL, wrap = document.querySelector(".vl-wrap"), part = +(document.body.getAttribute("data-part") || 0);
    if (!V || !V.PARTS || !V.PARTS.length || !V.CH || !wrap || !part || wrap.querySelector(".vl-fb-tabs")) return;
    var en = V.lang === "en", nav = document.createElement("nav");
    nav.className = "vl-fb-tabs"; nav.setAttribute("aria-label", en ? "Parts" : "篇章");
    nav.innerHTML = V.PARTS.map(function (p, i) {
      var c = V.CH.filter(function (x) { return x.n >= p.from && x.n <= p.to && x.open !== false; })[0];
      var name = en ? (p.en || p.zh) : String(p.zh || "").split("、").pop();
      var lab = en ? "Part " + (i + 1) : name;
      var st = 'style="--tabc:var(--p' + ((i % 6) + 1) + 'a)"';
      return c ? '<a href="' + esc(c.file) + '" ' + st + ' class="' + (part === i + 1 ? "on" : "") + '" title="' + esc(en ? p.en || p.zh : p.zh) + '"' + (part === i + 1 ? ' aria-current="true"' : "") + ">" + esc(lab) + "</a>" : "";
    }).join("");
    wrap.appendChild(nav);
  }
  document.addEventListener("DOMContentLoaded", function () { setTimeout(tabs, 0); setTimeout(function () { watch(document); }, 0); });
})();
