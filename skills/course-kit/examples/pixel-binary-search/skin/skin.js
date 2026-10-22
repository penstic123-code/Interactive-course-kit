/* 皮肤 pixel（掌机像素，Game Boy 风四阶绿）的脚本部分：放在 <head> 里、kit/vl-head.js 之前。
   做三件事：
   1. 声明 VL_SKIN（网络字体 VT323、插画配色）；
   2. 把 kit/illus.js 的火柴人换成像素画法：通过 kit 的换画法钩子 VL_SKIN.illus 把像素绘制工具并进 kit
      （各章 VL.illus.add 拿到的 k 就是像素版），并换掉外层 svg 包法（像素图不要描边、要 crispEdges）。
      接口照 references/skin-contract.md 第三节：person / hands / holding / feetY / ground / item / bubble / T / arrow / eye / C / reset，
      另给像素专用的 R F L sprite icon chair desk。人物几何和 kit 火柴人一致：x,y = 头部中心，脚底 = y + 64·s，所以给笔记本写的坐标也站得住。
   3. 关卡开场 READY!（每会话每章一次、可点跳过；off 档、无头浏览器、?freeze 时不播；lite 档缩短）和题头插画出视口暂停。
   像素画法抽自 AI 课第一篇的像素插图库。 */
window.VL_SKIN = {
  name: "pixel",
  // 数字、代码用 VT323（OFL，网络字体，离线退到 Consolas）；大标题的 Fusion Pixel 在 skin.css 里用本地文件
  fonts: ["https://fonts.googleapis.com/css2?family=VT323&display=swap"],
  defs: "",
  palette: {
    ink: "#181a2e", skin: "#fde7c8", paper: "#fffdf3", white: "#ffffff", grey: "#94b0c2", dark: "#333c57",
    yellow: "#ffcd75", pink: "#ff9eb0", blue: "#41a6f6", green: "#a7f070", orange: "#ef7d57", purple: "#b6a4ff",
    red: "#b13e53", gold: "#ffcd75", wood: "#c08a4b", cap: "#3b5dc9", beanie: "#b13e53", wizard: "#6a4fc6",
    gb0: "#0f380f", gb1: "#306230", gb2: "#8bac0f", gb3: "#9bbc0f", lcd: "#eef3d4", ground: "#e9e2cf",
  },
};

(function () {
  "use strict";
  var C = window.VL_SKIN.palette, INK = C.ink;
  var q = function (n) { return Math.round(n * 10) / 10; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var rect = function (x, y, w, h, fill, op) { return '<rect x="' + q(x) + '" y="' + q(y) + '" width="' + q(Math.max(0.5, w)) + '" height="' + q(Math.max(0.5, h)) + '" fill="' + (fill || INK) + '"' + (op != null ? ' opacity="' + op + '"' : "") + ' stroke="none"/>'; };
  var g2 = function (n) { return Math.round(n / 2) * 2; };
  var R = function (x, y, w, h, fill) { return rect(g2(x), g2(y), Math.max(2, g2(w)), Math.max(2, g2(h)), fill); };
  var F = function (x, y, w, h, fill) { return R(x, y, w, h, INK) + R(x + 3, y + 3, w - 6, h - 6, fill || C.white); };
  var L = function (x1, y1, x2, y2, w, color) { return '<path d="M' + q(x1) + " " + q(y1) + " L" + q(x2) + " " + q(y2) + '" stroke="' + (color || INK) + '" stroke-width="' + q(w || 3) + '" stroke-linecap="square" fill="none"/>'; };
  var PAL = { y: "#ffcd75", o: "#ef7d57", r: "#b13e53", g: "#a7f070", G: "#38b764", t: "#73eff7", b: "#41a6f6", B: "#3b5dc9", n: "#29366f", p: "#ff9eb0", v: "#b6a4ff", V: "#6a4fc6", w: "#f4f4f4", W: "#ffffff", k: INK, s: "#94b0c2", S: "#566c86", d: "#333c57", h: C.skin, c: "#8b5a2b" };
  function sprite(rows, x, y, cell, pal) {
    cell = cell || 4; pal = Object.assign({}, PAL, pal || {});
    var out = "";
    rows.forEach(function (row, j) {
      var i = 0;
      while (i < row.length) {
        var ch = row[i], k = i;
        while (k < row.length && row[k] === ch) k++;
        if (ch !== "." && ch !== " " && pal[ch]) out += rect(x + i * cell, y + j * cell, (k - i) * cell, cell, pal[ch]);
        i = k;
      }
    });
    return out;
  }
  var ICONS = {
    robot: ["...kk...", "...rr...", ".kkkkkk.", ".kttttk.", ".ktkktk.", ".kttttk.", ".kkkkkk.", "..kssk..", ".kssssk.", ".ksyysk.", ".kssssk.", "..k..k.."],
    book: [".kkkkkkk.", "kbbbbbbbk", "kbwwwwwbk", "kbbbbbbbk", "kbwwwwwbk", "kbbbbbbbk", "kwwwwwwwk", ".kkkkkkk."],
    doc: ["kkkkkk..", "kwwwwkk.", "kwkkwwk.", "kwwwwwk.", "kwkkkwk.", "kwwwwwk.", "kwkkkwk.", "kkkkkkk."],
    bulb: ["..kkkk..", ".kyyyyk.", "kyywyyyk", "kyyyyyyk", ".kyyyyk.", "..kssk..", "..kSSk..", "...kk..."],
    star: ["....k....", "...kyk...", "kkkkykkkk", ".kyyyyyk.", "..kyyyk..", ".kyykyyk.", "kyk...kyk", "kk.....kk"],
    heart: [".kk.kk.", "krrkrrk", "krrrrrk", ".krrrk.", "..krk..", "...k..."],
    coin: [".kkkk.", "kyyyyk", "kykkyk", "kykyyk", "kykkyk", "kyyyyk", ".kkkk."],
    box: ["kkkkkkkkkk", "kooooooook", "kokkkkkkok", "kooooooook", "kooooooook", "kooooooook", "kooooooook", "kkkkkkkkkk"],
    cup: ["kkkkkkk..", "kWWWWWkkk", "kWWWWWk.k", "kWWWWWk.k", "kWWWWWkkk", "kWWWWWk..", ".kkkkk..."],
    phone: ["kkkkkk", "kttttk", "kttttk", "kttttk", "kttttk", "kttttk", "kttttk", "kkkkkk", "kkWWkk", "kkkkkk"],
    die: ["kkkkkkkk", "kWWWWWWk", "kWkWWWWk", "kWWWWWWk", "kWWWWWWk", "kWWWWkWk", "kWWWWWWk", "kkkkkkkk"],
    cat: ["k.....k.", "kok..kok", "kooooook", "kokooook", "kooooook", "kooppook", ".kooook.", "..kkkk.."],
    dog: ["kk....kk", "kckkkkck", "kcccccck", "kckcckck", "kcccccck", "kcckkcck", ".kcccck.", "..kkkk.."],
    check: [".......k", "......kg", "k....kgk", "gk..kgk.", ".gkkgk..", "..ggk..."],
    cross: ["kk...kk", ".kk.kk.", "..kkk..", ".kk.kk.", "kk...kk"],
    clock: [".kkkkk.", "kwwkwwk", "kwwkwwk", "kwwkkwk", "kwwwwwk", ".kkkkk."],
    key: [".kkk.....", "kyyyk....", "kykykkkkk", "kyyyk.kyk", ".kkk..k.k"],
  };
  var icon = function (name, x, y, cell) { return ICONS[name] ? sprite(ICONS[name], x, y, cell || 4) : ""; };

  /* ---------- 像素小人：方块脑袋 + 圆柱身体 + 描边手臂 + 裤子鞋子 ---------- */
  var K = 64 / 47;   // 像素小人原本脚底在 y+47；乘 K 后和 kit 火柴人一样在 y+64·s
  var ARMS = {
    stand: [[-7, 12, -11, 26], [7, 12, 11, 26]], none: [], up: [[-7, 12, -14, -2], [7, 12, 14, -2]], point: [[-7, 12, -11, 26], [7, 12, 26, 8]],
    hold: [[-7, 12, 3, 22], [7, 12, 17, 22]], wave: [[-7, 12, -11, 26], [7, 12, 15, -2]], chin: [[-7, 12, -11, 26], [7, 13, 3, 7]],
    cover: [[-7, 12, -4, 0], [7, 12, 4, 0]], desk: [[-7, 12, 8, 22], [7, 12, 20, 22]], shrug: [[-7, 12, -16, 8], [7, 12, 16, 8]],
    throw: [[-7, 12, -11, 26], [7, 12, 20, -4]], club: [[-7, 12, 0, 26], [7, 12, 8, 26]],
  };
  var LEGS = {
    stand: [[-3, 28, -4, 44], [3, 28, 4, 44]], walk: [[-3, 28, -9, 44], [3, 28, 8, 44]], run: [[-3, 28, -14, 40], [3, 28, 11, 44]],
    wide: [[-3, 28, -11, 44], [3, 28, 11, 44]], sit: [[-2, 28, 12, 28, 12, 44], [2, 28, 16, 28, 16, 44]], none: [],
  };
  var FACES = {
    smile: [".k..k.", ".k..k.", ".m..m.", "..mm.."], flat: [".k..k.", ".k..k.", "......", "..mm.."], sad: [".k..k.", ".k..k.", "..mm..", ".m..m."],
    wow: [".k..k.", ".k..k.", "..mm..", "..mm.."], think: [".k..k.", ".k..k.", "......", "...mm."], angry: ["kk..kk", ".k..k.", "..mm..", ".m..m."],
    happy: [".k..k.", ".k..k.", ".mmmm.", "..mm.."], sleep: ["......", ".k..k.", "......", "..mm.."],
  };
  var FACE_ALIAS = { grin: "happy", shout: "wow", o: "wow", wide: "wow", closed: "sleep" };
  var HAIR = {
    short: [[0, ["..kkkk..", ".kHHHHk.", "kHHHHHHk"]]],
    long: [[0, ["..kkkk..", ".kHHHHk.", "kHHHHHHk"]], [3, ["H......H", "H......H", "H......H", "H......H", "HH....HH", "HH....HH"]]],
    bun: [[-2, ["...kk...", "..kHHk.."]], [0, ["..kkkk..", ".kHHHHk.", "kHHHHHHk"]]],
    spiky: [[-1, [".k.kk.k.", "kHkHHkHk", "kHHHHHHk"]]],
    side: [[0, ["..kkkk..", ".kHHHHkk", "kHHHHHHk"]], [3, ["H.......", "H......."]]],
  };
  var HATS = {
    cap: [-3, ["..kkkk..", ".kBBBBk.", "kkkkkkkkkk"]], crown: [-4, [".k.k.k.k", ".kykykyk", ".kyyyyyk", ".kkkkkkk"]],
    beanie: [-3, ["...kk...", ".krrrrk.", "krrrrrrk", "kwwwwwwk"]], tophat: [-6, ["..kkkk..", "..kddk..", "..kddk..", "..kddk..", "..krrk..", "kkkkkkkk"]],
    wizard: [-6, ["...kk...", "..kVVk..", "..kVVk..", ".kVVVVk.", ".kVyVVk.", "kkkkkkkk"]],
    grad: [-3, ["...kk...", "kkkkkkkk", "..kkkk.."]], helmet: [-2, [".kkkkkk.", "kyyyyyyk", "kyyyyyyk", "kkkkkkkk"]],
    chef: [-5, [".kkkkkk.", "kwwwwwwk", "kwwwwwwk", ".kwwwwk.", ".kkkkkk."]],
  };
  // 同一张图第 k 个人依次换装（靠服饰区分，不只换颜色）
  var STYLES = [{ hair: "short" }, { hat: "cap" }, { hair: "long" }, { hat: "beanie" }, { hat: "tophat" }];
  var SHIRTS = ["#41a6f6", "#ef7d57", "#38b764", "#b6a4ff", "#ffcd75"];
  var personK = 0;
  var geo = function (x, y, o) {
    var s = (o.s || 1) * K, dir = o.dir != null ? o.dir : (o.flip !== undefined ? (o.flip ? -1 : 1) : ((o.look || 0) < 0 ? -1 : 1));
    return { s: s, dir: dir, X: function (d) { return x + d * s * dir; }, Y: function (d) { return y + d * s; } };
  };
  function hands(x, y, o) {
    o = o || {}; var g = geo(x, y, o);
    return (ARMS[o.arms || "stand"] || []).map(function (a) { return [q(g.X(a[2])), q(g.Y(a[3]))]; });
  }
  function feetY(x, y, o) { o = o || {}; var g = geo(x, y, o); return (LEGS[o.legs || "stand"] || []).length ? q(g.Y(47)) : q(g.Y(30)); }
  var handBox = function (hx, hy, s, sk) { return rect(hx - 2.5 * s, hy - 2.5 * s, 5 * s, 5 * s, INK) + rect(hx - 1.5 * s, hy - 1.5 * s, 3 * s, 3 * s, sk); };
  function person(x, y, o) {
    o = Object.assign({}, o || {});
    if (o.hair === true) o.hair = "long";
    var k = personK++;
    if (o.outfit !== false) {
      var marked = o.hat || o.hair || o.glasses || o.beard || o.cape || o.tie;
      if (!marked) Object.assign(o, STYLES[k % STYLES.length]);
      else if (!o.hat && !o.hair) o.hair = "short";
      if (!o.shirt && !o.coat) o.shirt = SHIRTS[k % SHIRTS.length];
    }
    var g = geo(x, y, o), s = g.s, X = g.X, Y = g.Y, dir = g.dir;
    var sh = o.coat ? "#ffffff" : (o.shirt || "#41a6f6"), pa = o.pants || "#333c57", sk = o.skin || C.skin, hc = o.hairColor || "#5a3a22";
    var c = 2 * s, hx = x - 8 * s, hy = y - 8 * s, lk = Math.max(-1, Math.min(1, o.look || 0)) * s;
    // 矩形在镜像时要从左边算起：rx(左, 宽)
    var RX = function (d, w) { return dir > 0 ? X(d) : X(d) - w * s; };
    var out = '<g class="px-person">';
    if (o.cape) out += rect(RX(-11, 22), Y(10), 22 * s, 26 * s, INK) + rect(RX(-10, 20), Y(11), 20 * s, 24 * s, C.red);
    if (o.bag) out += rect(RX(-13, 8), Y(12), 8 * s, 15 * s, INK) + rect(RX(-12, 6), Y(13), 6 * s, 13 * s, o.bag === true ? "#b13e53" : o.bag);
    if (o.legs === "sit" && o.chair !== false && o.seat !== false) {   // 坐姿自带凳子，凳腿落到脚底那条线
      out += rect(RX(-10, 26), Y(29), 26 * s, 5 * s, INK) + rect(RX(-8, 22), Y(30), 22 * s, 2 * s, "#c08a4b") + rect(RX(-8, 3), Y(33), 3 * s, 14 * s, INK) + rect(RX(11, 3), Y(33), 3 * s, 14 * s, INK);
    }
    (LEGS[o.legs || "stand"] || []).forEach(function (a) {
      var seg = [[a[0], a[1], a[2], a[3]]]; if (a.length > 4) seg.push([a[2], a[3], a[4], a[5]]);
      seg.forEach(function (t) { out += L(X(t[0]), Y(t[1]), X(t[2]), Y(t[3]), 7 * s, INK); });
      seg.forEach(function (t) { out += L(X(t[0]), Y(t[1]), X(t[2]), Y(t[3]), 3 * s, pa); });
      var e = seg[seg.length - 1]; out += rect(RX(e[2] - 3, 8), Y(e[3]), 8 * s, 3 * s, INK);
    });
    if (o.skirt) out += rect(X(-10) - (dir < 0 ? 20 * s : 0), Y(25), 20 * s, 10 * s, INK) + rect(X(-9) - (dir < 0 ? 18 * s : 0), Y(26), 18 * s, 8 * s, o.skirt === true ? "#ff9eb0" : o.skirt);
    out += rect(x - 8 * s, Y(8), 16 * s, 22 * s, INK) + rect(x - 6 * s, Y(10), 12 * s, 18 * s, sh) + rect(x - 6 * s, Y(10), 2 * s, 18 * s, "#ffffff", 0.4) + rect(x + 4 * s, Y(10), 2 * s, 18 * s, "#000000", 0.2);
    if (o.coat) out += rect(x - s, Y(10), 2 * s, 18 * s, "#94b0c2");
    if (o.tie) out += sprite(["kk", "rr", "rr", "rr", "rr"], x - 2 * s, Y(10), c, { r: o.tie === true ? "#b13e53" : o.tie });
    if (o.scarf) out += rect(x - 8 * s, Y(8), 16 * s, 4 * s, o.scarf === true ? "#ef7d57" : o.scarf);
    var arms = ARMS[o.arms || "stand"] || [];
    arms.forEach(function (a) { out += L(X(a[0]), Y(a[1]), X(a[2]), Y(a[3]), 7 * s, INK) + L(X(a[0]), Y(a[1]), X(a[2]), Y(a[3]), 3 * s, sh); });
    arms.forEach(function (a) { out += handBox(X(a[2]), Y(a[3]), s, sk); });
    out += sprite(["..kkkk..", ".khhhhk.", "khhhhhhk", "khhhhhhk", "khhhhhhk", "khhhhhhk", ".khhhhk.", "..kkkk.."], hx, hy, c, { h: sk });
    var hair = HAIR[o.hair] || [];
    hair.forEach(function (h) { var rows = dir < 0 ? h[1].map(function (r) { return r.split("").reverse().join(""); }) : h[1]; out += sprite(rows, hx, hy + h[0] * c, c, { H: hc }); });
    out += sprite(FACES[FACE_ALIAS[o.face] || o.face] || FACES.smile, hx + c + lk, hy + 3 * c, c, { m: "#b8324a" });
    if (o.glasses) {   // 细框眼镜：框在眼睛外面一圈，眼睛在框里看得见
      [2, 5].forEach(function (e) {
        var ex = hx + (e - 0.75) * c + lk, ey = hy + 2.25 * c, w = 2.5 * c, h = 2.75 * c, t = 0.45 * c;
        out += rect(ex, ey, w, t, "#29366f") + rect(ex, ey + h - t, w, t, "#29366f") + rect(ex, ey, t, h, "#29366f") + rect(ex + w - t, ey, t, h, "#29366f");
      });
    }
    if (o.beard) out += sprite(["H......H", "HH....HH", ".HHHHHH.", "..HHHH.."], hx, hy + 5 * c, c, { H: hc });
    if (HATS[o.hat]) { var hr = HATS[o.hat][1]; if (dir < 0) hr = hr.map(function (r) { return r.split("").reverse().join(""); }); out += sprite(hr, o.hat === "cap" && dir < 0 ? hx - 2 * c : hx, hy + HATS[o.hat][0] * c, c, {}); }
    return out + "</g>";
  }
  // 物件：(x,y) 是物件中心
  var ITEM_ALIAS = {};
  function item(kind, x, y, cell) {
    var rows = ICONS[ITEM_ALIAS[kind] || kind]; if (!rows) return "";
    cell = cell || 3;
    var out = sprite(rows, x - rows[0].length * cell / 2, y - rows.length * cell / 2, cell);
    if (kind === "die") out += "";
    return out;
  }
  // 两手之间放一个物件：先画东西，再把两只手压在东西两侧，手才是真的握住
  function holding(x, y, o, kind) {
    o = Object.assign({ arms: "hold" }, o || {});
    var h = hands(x, y, o); if (h.length < 2) return "";
    var s = (o.s || 1) * K, sk = o.skin || C.skin, mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
    var rows = ICONS[kind]; if (!rows) return "";
    var span = Math.abs(h[1][0] - h[0][0]), cell = Math.max(2.4 * s, (span + 6 * s) / rows[0].length);
    return item(kind, mx, my - 2 * s, cell) + handBox(h[0][0], h[0][1], s, sk) + handBox(h[1][0], h[1][1], s, sk);
  }
  var chair = function (x, y, s) { s = s || 1; return R(x, y, 24 * s, 5 * s, INK) + R(x + 2 * s, y + s, 20 * s, 2 * s, "#c08a4b") + R(x + 18 * s, y - 20 * s, 5 * s, 22 * s, INK) + R(x + 2 * s, y + 4 * s, 3 * s, 14 * s, INK) + R(x + 19 * s, y + 4 * s, 3 * s, 14 * s, INK); };
  var desk = function (x, y, w, s) { s = s || 1; return R(x, y, w, 6 * s, INK) + R(x + 2 * s, y + s, w - 4 * s, 3 * s, "#c08a4b") + R(x + 3 * s, y + 6 * s, 4 * s, 22 * s, INK) + R(x + w - 7 * s, y + 6 * s, 4 * s, 22 * s, INK); };
  var ground = function (y) { y = y == null ? 126 : y; return R(0, y, 200, 4, INK) + rect(0, y + 4, 200, Math.max(0, 140 - y - 4), C.ground); };
  var T = function (x, y, size, txt, anchor, fill) { return '<text x="' + x + '" y="' + y + '" font-size="' + Math.max(12, size || 12) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ' fill="' + (fill || INK) + '" font-weight="700" stroke="none">' + esc(txt) + "</text>"; };
  var eye = function (x, y) { return rect(x - 1, y - 1.5, 2.4, 3, INK); };
  // 气泡：像素描边框 + 一级级台阶收窄的尾巴，尾尖对准说话人；字另用 T 写在文字层。
  // 尾巴从框外画起（墨块不进框内，不压最后一行字），只在接口处把边框挖开一个口。
  // 尾尖在框下 / 框上就从底边 / 顶边伸出；尾尖在框左右两侧（说话人站在旁边）就从左 / 右边伸出，不横穿气泡。
  function bubble(x, y, w, h, tail, fill) {
    fill = fill || C.white;
    var out = F(x, y, w, h, fill);
    if (!tail || tail.length !== 2) return out;
    var x0 = g2(x), y0 = g2(y), x1 = x0 + Math.max(2, g2(w)), y1 = y0 + Math.max(2, g2(h)), tx = tail[0], ty = tail[1];
    var side = ty >= y1 ? "b" : ty <= y0 ? "t" : tx <= x0 ? "l" : tx >= x1 ? "r" : null;
    if (!side) return out;   // 尾尖落在框里：不画尾巴
    var vert = side === "b" || side === "t", cl = function (v, a, z) { return Math.max(a, Math.min(z, v)); };
    var bx = vert ? cl(tx, x0 + 10, x1 - 10) : (side === "l" ? x0 : x1);
    var by = vert ? (side === "b" ? y1 : y0) : cl(ty, Math.min(y0 + 9, (y0 + y1) / 2), Math.max(y1 - 9, (y0 + y1) / 2));
    // 把一块矩形裁到框外
    var clip = function (rx, ry, rw, rh, col) {
      var ax = rx, ay = ry, zx = rx + rw, zy = ry + rh;
      if (side === "b") ay = Math.max(ay, y1); else if (side === "t") zy = Math.min(zy, y0);
      else if (side === "l") zx = Math.min(zx, x0); else ax = Math.max(ax, x1);
      return zx - ax > 0.2 && zy - ay > 0.2 ? rect(ax, ay, zx - ax, zy - ay, col) : "";
    };
    var n = Math.max(2, Math.round(Math.hypot(tx - bx, ty - by) / 4)), ink = "", wh = "";
    for (var i = 0; i <= n; i++) {
      var t = i / n, cx = bx + (tx - bx) * t, cy = by + (ty - by) * t, ww = 10 - 7 * t;
      if (vert) { ink += clip(cx - ww / 2 - 3, cy - 3, ww + 6, 6, INK); if (i < n) wh += clip(cx - ww / 2, cy - 2, ww, 4, fill); }
      else { ink += clip(cx - 3, cy - ww / 2 - 3, 6, ww + 6, INK); if (i < n) wh += clip(cx - 2, cy - ww / 2, 4, ww, fill); }
    }
    // 接口：把边框挖开，和框内连成一片
    var gap = side === "b" ? rect(bx - 5, y1 - 4, 10, 4, fill) : side === "t" ? rect(bx - 5, y0, 10, 4, fill) : side === "l" ? rect(x0, by - 5, 4, 10, fill) : rect(x1 - 4, by - 5, 4, 10, fill);
    return out + ink + wh + gap;
  }
  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var w = o.w || 2.5, col = o.color || INK, hl = o.head || 5 + 2 * w, hw = hl * 0.46;
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    var head = function (tx, ty, sx, sy) { var bx = tx - sx * hl, by = ty - sy * hl; return '<path d="M' + q(tx) + " " + q(ty) + " L" + q(bx - sy * hw) + " " + q(by + sx * hw) + " L" + q(bx + sy * hw) + " " + q(by - sx * hw) + ' Z" fill="' + col + '" stroke="none"/>'; };
    var a0 = o.both ? hl - 0.5 : 0, a1 = hl - 0.5;
    var s = '<g shape-rendering="' + (Math.abs(dx) < 0.01 || Math.abs(dy) < 0.01 ? "crispEdges" : "geometricPrecision") + '">';
    s += '<path d="M' + q(x1 + ux * a0) + " " + q(y1 + uy * a0) + " L" + q(x2 - ux * a1) + " " + q(y2 - uy * a1) + '" stroke="' + col + '" stroke-width="' + w + '" fill="none"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : "") + "/>";
    s += head(x2, y2, ux, uy); if (o.both) s += head(x1, y1, -ux, -uy);
    return s + "</g>";
  }
  var PX = { person: person, hands: hands, feetY: feetY, ground: ground, T: T, eye: eye, bubble: bubble, arrow: arrow, item: item, holding: holding, C: C,
    reset: function () { personK = 0; }, R: R, F: F, L: L, sprite: sprite, icon: icon, chair: chair, desk: desk, ICONS: ICONS, PAL: PAL, INK: INK, pixel: true };

  /* ---------- 接到 kit/illus.js 上：用 kit 的换画法钩子 VL_SKIN.illus（kit/illus.js 加载时调用） ----------
     kit：像素绘制工具并进 kit（add() 前后会调 kit.reset()，换装计数随之清零）；
     svg：像素图不要描边圆角、要 crispEdges，文字层保持抗锯齿。 */
  window.VL_SKIN.illus = function () {
    return {
      kit: PX,
      svg: function (it) {
        return '<svg viewBox="0 0 200 140" class="vl-illus-svg vl-px-svg" shape-rendering="crispEdges" role="img" aria-label="' + esc(it.alt) + '">' +
          '<g class="vl-il-px" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="miter" stroke-linecap="square">' + it.body + '</g><g class="vl-il-text" shape-rendering="auto">' + it.extra + "</g></svg>";
      },
    };
  };

  /* ---------- 专属动效：关卡开场 READY!、题头插画出视口暂停、?freeze ---------- */
  var root = document.documentElement, qs = "";
  try { qs = location.search; } catch (e) {}
  var freeze = /[?&]freeze=/.test(qs);
  if (freeze) root.classList.add("vl-px-freeze");
  var headless = /Headless/i.test(navigator.userAgent || "") || navigator.webdriver;
  function onReady(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  onReady(function () {
    var body = document.body, ch = body && body.getAttribute("data-ch");
    // 题头插画离开视口就停
    var hero = document.querySelector(".vl-hero");
    if (hero && "IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { hero.classList.toggle("vl-px-away", !e.isIntersecting); }); }).observe(hero);
    if (!ch || freeze || headless || root.classList.contains("vl-fx-off")) return;
    var key = "vl-px-intro-" + (location.pathname || "") + "-" + ch, seen = false;
    try { seen = sessionStorage.getItem(key) === "1"; sessionStorage.setItem(key, "1"); } catch (e) {}
    if (seen) return;
    var h1 = document.querySelector("h1"), en = (root.lang || "").toLowerCase().indexOf("en") === 0;
    var o = document.createElement("div"); o.className = "vl-px-intro"; o.setAttribute("aria-hidden", "true");
    o.innerHTML = '<div><div class="vl-px-in-w">' + (en ? "CHAPTER " + ch : "第 " + ch + " 章") + '</div><div class="vl-px-in-t">' + esc(h1 ? h1.textContent : "") + '</div><div class="vl-px-in-r">READY!</div><div class="vl-px-in-k">' + (en ? "click to skip" : "点一下跳过") + "</div></div>";
    var close = function () { if (o.parentNode) o.parentNode.removeChild(o); removeEventListener("keydown", close); };
    o.addEventListener("click", close); addEventListener("keydown", close);
    body.appendChild(o);
    setTimeout(close, root.classList.contains("vl-fx-lite") ? 600 : 1400);
  });
})();
