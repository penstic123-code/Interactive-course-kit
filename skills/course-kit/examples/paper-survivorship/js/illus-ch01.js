/* 第 1 章插画包：幸存者偏差。剪纸画法（skin/skin.js 的 k.paper），viewBox 200×140。
   名字用 c01- 前缀，全课只用一次。k.paper 的函数输出已由皮肤包好 stroke="none"；这里的 W() 是早先绕路留下的，留着无害。 */
(function () {
  const W = s => '<g stroke="none">' + s + "</g>";
  const ST = (P, o, inner) => W(P.stage(o, inner));   // 舞台布景同样要去掉外层描边

  /* ---- 俯视的轰炸机：几何写在 600×360 的坐标里，插画和本章互动台共用 ---- */
  const G = {
    WL: [[282, 150], [40, 192], [40, 212], [282, 216]],
    SL: [[282, 296], [205, 316], [205, 330], [282, 330]],
    eng: [[178, 180], [422, 180]], erx: 19, ery: 40,
    cap: { x: 282, y: 30, w: 36, h: 300, r: 18 },
    cockpitY: 104, tailY: 288,
  };
  G.WR = G.WL.map(p => [600 - p[0], p[1]]);
  G.SR = G.SL.map(p => [600 - p[0], p[1]]);
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const inEll = (x, y, cx, cy) => ((x - cx) / G.erx) ** 2 + ((y - cy) / G.ery) ** 2 <= 1;
  const inCap = (x, y) => { if (x < 282 || x > 318) return false; if (y >= 48 && y <= 312) return true; const cy = y < 48 ? 48 : 312; return (x - 300) ** 2 + (y - cy) ** 2 <= 324; };
  // 一个点落在哪个部位：引擎 > 驾驶舱 / 机身 / 尾部 > 尾翼 > 机翼
  G.zone = (x, y) => {
    if (inEll(x, y, G.eng[0][0], G.eng[0][1]) || inEll(x, y, G.eng[1][0], G.eng[1][1])) return "engine";
    if (inCap(x, y)) return y < G.cockpitY ? "cockpit" : y > G.tailY ? "tail" : "body";
    if (inPoly(x, y, G.SL) || inPoly(x, y, G.SR)) return "tail";
    if (inPoly(x, y, G.WL) || inPoly(x, y, G.WR)) return "wing";
    return null;
  };
  // 画一架俯视的飞机。ox, oy = 画面上机身中点；s = 缩放；o.ghost = 只画虚线轮廓（没回来的那架）
  function planeTop(P, ox, oy, s, o) {
    o = o || {};
    const X = x => ox + (x - 300) * s, Y = y => oy + (y - 180) * s, M = pts => pts.map(p => [X(p[0]), Y(p[1])]);
    const c = G.cap;
    if (o.ghost) {
      const d = pts => "M" + M(pts).map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
      const st = ' fill="none" stroke="' + (o.color || "#55607a") + '" stroke-width="1.6" stroke-dasharray="4 3"';
      return '<g' + st + '><path d="' + d(G.WL) + '"/><path d="' + d(G.WR) + '"/><path d="' + d(G.SL) + '"/><path d="' + d(G.SR) + '"/>' +
        '<rect x="' + X(c.x) + '" y="' + Y(c.y) + '" width="' + c.w * s + '" height="' + c.h * s + '" rx="' + c.r * s + '"/>' +
        G.eng.map(e => '<ellipse cx="' + X(e[0]) + '" cy="' + Y(e[1]) + '" rx="' + G.erx * s + '" ry="' + G.ery * s + '"/>').join("") + "</g>";
    }
    const body = o.fill || P.PAL.slate, dk = P.shade(body, -.18);
    return P.cut(P.poly(M(G.WL), body, { wob: .2 }) + P.poly(M(G.WR), body, { wob: .2 }) +
      P.poly(M(G.SL), dk, { wob: .2 }) + P.poly(M(G.SR), dk, { wob: .2 }) +
      P.rect(X(c.x), Y(c.y), c.w * s, c.h * s, P.shade(body, .08), { r: c.r * s, wob: .2 }) +
      G.eng.map(e => P.ellipse(X(e[0]), Y(e[1]), G.erx * s, G.ery * s, dk, { wob: .2 })).join("") +
      P.rect(X(290), Y(46), 20 * s, 26 * s, P.PAL.sky, { r: 4 * s, wob: 0, sheen: false }), o.lift || 2);
  }
  const hole = (x, y, r) => '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r || 2) + '" fill="#232838"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + ((r || 2) + 1).toFixed(1) + '" fill="none" stroke="#fffaf0" stroke-width=".7" opacity=".8"/>';
  const cross = (x, y, r, c) => { r = r || 3; return '<path d="M' + (x - r) + " " + (y - r) + " L" + (x + r) + " " + (y + r) + " M" + (x + r) + " " + (y - r) + " L" + (x - r) + " " + (y + r) + '" stroke="' + (c || "#b13e53") + '" stroke-width="2.2" stroke-linecap="round" fill="none"/>'; };
  window.c01Plane = { G, planeTop, hole, cross };

  // 纸片皮肤的 ITEMS 里没有 phone / star / coin / die（kit 文档列了，skin 没画），这里自己画
  const starPts = (cx, cy, r) => { const o = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return o; };
  const star = (P, cx, cy, r) => P.cut(P.poly(starPts(cx, cy, r), P.PAL.mustard, { wob: 0 }), 1);
  const phone = (P, cx, cy) => P.cut(P.rect(cx - 5, cy - 8, 10, 16, "#3a3f4f", { r: 2, wob: 0 }) + P.rect(cx - 3.6, cy - 6, 7.2, 10.4, P.PAL.sky, { wob: 0, sheen: false }), 2);
  // 手里拿一件自画的东西：先画物件，再把两只手压在物件两侧（和 k.holding 的做法一样）
  const held = (k, x, y, o, draw) => {
    const h = k.hands(x, y, Object.assign({ arms: "hold" }, o)), mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2, r = 2.4 * 1.35 * ((o && o.s) || 1);
    return W(draw(mx, my) + h.map(p => k.paper.circle(p[0], p[1], r, k.paper.PAL.skin, { wob: 0, sheen: false })).join(""));
  };
  // 小纸偶棋子（头 + 身子），用在"全体 / 样本"这类示意里
  const pawn = (P, x, y, c) => P.cut(P.path("M" + (x - 6) + " " + y + " Q" + x + " " + (y - 15) + " " + (x + 6) + " " + y + " Z", c, { wob: 0 }) + P.circle(x, y - 14, 4.4, c, { wob: 0 }), 1);
  const dashMan = (x, gy, s, c) => { s = s || 1; const hy = gy - 58 * s; return '<g fill="none" stroke="' + (c || "#55607a") + '" stroke-width="1.5" stroke-dasharray="3.5 3"><circle cx="' + x + '" cy="' + hy + '" r="' + 11 * s + '"/><path d="M' + (x - 12 * s) + " " + (gy - 18 * s) + " Q" + x + " " + (gy - 54 * s) + " " + (x + 12 * s) + " " + (gy - 18 * s) + ' Z"/></g>'; };

  /* ===== 题头：地勤人员拿着记录板，站在一架满身弹孔的返航轰炸机旁 ===== */
  VL.illus.add("c01-hero", "草地上停着一架刚飞回来的轰炸机，机翼和机身上满是弹孔；左边一个戴鸭舌帽的地勤人员捧着记录板，头顶的气泡里写着“补哪儿？”",
    k => {
      const P = k.paper, sl = P.PAL.slate, dk = P.shade(sl, -.2);
      const plane = P.cut(
        P.poly([[66, 86], [74, 54], [88, 56], [94, 86]], dk, { wob: .2 }) +
        P.ellipse(130, 88, 66, 13, sl, { wob: .2 }) +
        P.ellipse(82, 90, 17, 4, dk, { wob: .1 }) +
        P.poly([[104, 91], [160, 91], [156, 98], [100, 98]], dk, { wob: .2 }) +
        P.ellipse(140, 100, 12, 5.5, P.shade(sl, -.3), { wob: .1 }) +
        P.rect(168, 79, 14, 7, P.PAL.sky, { r: 2, wob: 0, sheen: false }) +
        P.circle(196, 88, 4, P.shade(sl, -.35), { wob: 0 }), 2);
      const gear = P.strip("M140 104 L140 116 M76 93 L76 118", "#3a3f4f", 2.4, { tex: false }) +
        P.circle(140, 120, 6, "#2a2630", { wob: 0 }) + P.circle(76, 122, 4, "#2a2630", { wob: 0 });
      const prop = P.strip("M200 74 L200 102", "#3a3f4f", 2.2, { tex: false });
      const holes = [[110, 84], [122, 92], [131, 82], [150, 86], [97, 89], [115, 95], [126, 95], [140, 94], [148, 95], [86, 72], [80, 64], [160, 92]].map(p => hole(p[0], p[1], 1.6)).join("");
      return ST(P, { back: "meadow", floor: 126 }, W(gear + plane + prop + holes)) +
        k.person(30, 62, { arms: "hold", look: 1, hat: "cap", face: "o", shirt: "#9cc48a" }) + k.holding(30, 62, { look: 1 }, "doc") +
        k.bubble(4, 8, 60, 28, [30, 48]);
    },
    k => k.T(34, 28, 14, "补哪儿？", "middle"));

  /* ===== 概念卡 1：飞回来的飞机弹孔在机翼，没回来的那架弹孔在引擎 ===== */
  VL.illus.add("c01-cc-surv", "左边是一架飞回来的飞机，弹孔都在机翼和机身上；右边是一架虚线画的、没回来的飞机，叉号都打在引擎和驾驶舱上",
    k => {
      const P = k.paper;
      let s = planeTop(P, 52, 62, .15);
      s += [[22, 61], [32, 59], [76, 60], [86, 62], [52, 74], [50, 50], [40, 63], [66, 64]].map(p => hole(p[0], p[1], 1.5)).join("");
      s += planeTop(P, 148, 62, .15, { ghost: true });
      s += cross(148 - 18.3, 62, 3.4) + cross(148 + 18.3, 61, 3.4) + cross(148, 39, 3.4);
      return W(s);
    },
    k => k.T(52, 120, 13, "飞回来的", "middle") + k.T(148, 120, 13, "没回来的", "middle"));

  /* ===== 概念卡 2：一群颜色各异的人经过一道只放蓝色通过的筛子，样本里只剩蓝色 ===== */
  VL.illus.add("c01-cc-sel", "上面一排颜色各不相同的小人，中间一块有几个缺口的纸板筛子，下面只剩几个蓝色小人：样本和全体长得不一样",
    k => {
      const P = k.paper, C = [P.PAL.blue, P.PAL.coral, P.PAL.mustard, P.PAL.sage, P.PAL.coral, P.PAL.blue, P.PAL.mustard, P.PAL.sage, P.PAL.coral, P.PAL.blue];
      let s = C.map((c, i) => pawn(P, 56 + i * 14, 40, c)).join("");
      s += P.cut(P.rect(48, 58, 140, 9, P.PAL.kraft, { wob: .2 }), 2);
      s += [76, 118, 160].map(x => '<rect x="' + (x - 6) + '" y="58" width="12" height="9" fill="#fbf6ea"/>').join("");
      s += [76, 118, 160].map(x => P.parrow(x, 72, x, 88, { w: 3, fill: P.PAL.slate })).join("");
      s += [86, 104, 122, 140].map(x => pawn(P, x, 122, P.PAL.blue)).join("");
      return W(s);
    },
    k => k.T(6, 36, 12, "全体") + k.T(6, 67, 12, "筛子") + k.T(6, 118, 12, "样本"));

  /* ===== 幸存者偏差的例子 ===== */
  VL.illus.add("c01-eg-songs", "一个人坐在凳子上听桌上的收音机，收音机里飘出音符；桌子右边地上放着一箱蒙了灰的旧唱片，标着“没人再放”",
    k => {
      const P = k.paper;
      const radio = P.cut(P.rect(102, 70, 40, 24, P.PAL.coral, { r: 3 }) + P.circle(114, 82, 7, P.shade(P.PAL.coral, -.3), { wob: 0 }) + P.rect(126, 76, 11, 4, P.PAL.cream, { wob: 0, sheen: false }) + P.rect(126, 84, 11, 4, P.PAL.cream, { wob: 0, sheen: false }), 2);
      const crate = P.cut(P.rect(146, 100, 52, 26, P.PAL.kraft, { wob: .2 }) + [0, 1, 2, 3].map(i => P.rect(152 + i * 11, 90 - (i % 2) * 3, 7, 14, P.shade(P.PAL.lavender, -.1 * i), { wob: .1, op: .75 })).join(""), 1);
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(P.desk(92, 126, 60, 1.2) + radio + crate)) +
        k.person(52, 62, { legs: "sit", arms: "chin", look: 1, face: "smile", hair: "ponytail", shirt: "#f4a3b4" });
    },
    k => k.T(122, 58, 14, "♪", "middle") + k.T(136, 50, 13, "♪", "middle") + k.T(172, 120, 12, "没人再放", "middle"));

  VL.illus.add("c01-eg-fund", "一个人指着一块黑板，板上画着几条基金收益曲线：三条一路向上画到右边，另外两条半路往下掉，末端打着叉，表示这些基金已经清盘",
    k => {
      const P = k.paper;
      const bd = P.board(70, 14, 124, 88, { fill: "#3d5a4c" });
      const L = (d, c) => P.strip(d, c, 2.4, { tex: false });
      const lines = L("M80 80 L110 70 L140 60 L184 30", "#f4f1e6") + L("M80 84 L112 78 L150 66 L184 48", "#f4dd78") + L("M80 78 L120 74 L160 66 L184 58", "#a9d8f2") +
        L("M80 82 L104 88 L122 94", "#f4a3b4") + L("M80 86 L118 84 L146 96", "#f7b98f");
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(bd + lines + cross(124, 95, 4, "#ffd0c8") + cross(148, 97, 4, "#ffd0c8"))) +
        k.person(36, 62, { arms: "point", look: 1, glasses: true, tie: true, face: "smile" });
    });

  VL.illus.add("c01-eg-elder", "一位戴眼镜、留胡子的老人坐在凳子上端着一杯茶，说着自己的长寿秘诀；他旁边有两张空凳子，凳子上只有虚线画的人影",
    k => {
      const P = k.paper;
      return ST(P, { back: "meadow", floor: 126 }, W(P.stool(118, 126, 1.35, true) + P.stool(162, 126, 1.35, true)) + dashMan(126, 126, 1) + dashMan(170, 126, 1)) +
        k.person(54, 62, { legs: "sit", arms: "hold", look: 1, beard: true, glasses: true, hair: "bald", face: "smile", shirt: "#bba9ea" }) + k.holding(54, 62, { look: 1 }, "cup") +
        k.bubble(66, 6, 74, 28, [60, 46]);
    },
    k => k.T(103, 25, 13, "秘诀是……", "middle"));

  VL.illus.add("c01-eg-crash", "草地上散着一架坠毁飞机的残骸，一个戴眼镜和毛线帽的调查员双手捧着橙色的飞行记录器，旁边的纸签写着“每一架都查”",
    k => {
      const P = k.paper, sl = P.PAL.slate;
      const wreck = P.cut(P.poly([[112, 110], [150, 102], [154, 120], [116, 124]], sl, { wob: .3 }) + P.poly([[158, 98], [186, 92], [194, 108], [170, 116]], P.shade(sl, -.15), { wob: .3 }) +
        P.poly([[136, 92], [146, 74], [154, 78], [150, 96]], P.shade(sl, -.25), { wob: .3 }) + P.poly([[100, 124], [108, 116], [114, 124]], P.shade(sl, -.2), { wob: .2 }), 2);
      const h = k.hands(46, 62, { arms: "hold", look: 1 }), mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
      const box = P.cut(P.rect(mx - 10, my - 7, 20, 14, "#f08a2c", { r: 2 }) + P.strip("M" + (mx - 8) + " " + (my - 1) + " L" + (mx + 8) + " " + (my - 1), "#fff3d6", 1.4, { tex: false }), 2) +
        h.map(p => P.circle(p[0], p[1], 3.2, P.PAL.skin, { wob: 0, sheen: false })).join("");
      return ST(P, { back: "meadow", floor: 126 }, W(wreck)) +
        k.person(46, 62, { arms: "hold", look: 1, glasses: true, hat: "beanie", face: "flat", shirt: "#4fc3cf" }) + W(box) + W(P.tag(150, 20, "每一架都查", { size: 12 }));
    });

  /* ===== 1936 年，一位编辑在桌前整理成堆的模拟选票明信片 ===== */
  VL.illus.add("c01-digest", "1936 年的编辑部：一个戴软呢帽的人坐在桌前整理一摞摞明信片，桌边地上一只鼓鼓的邮袋里也塞满了明信片",
    k => {
      const P = k.paper;
      const stacks = [104, 122, 140].map((x, i) => [0, 1, 2, 3].slice(0, 2 + i % 2 + 1).map(j => P.rect(x, 85 - j * 3, 14, 4, j % 2 ? "#fffaf0" : "#f4dd78", { wob: .1, sheen: false })).join("")).join("");
      const sack = P.cut(P.blob([[160, 126], [158, 104], [166, 92], [184, 90], [194, 104], [194, 126]], P.PAL.kraft, { wob: .3 }) +
        P.rect(168, 84, 10, 12, "#fffaf0", { wob: .2 }) + P.rect(180, 86, 10, 12, "#f4dd78", { wob: .2 }), 2);
      return ST(P, { back: "plain", ground: "wood", floor: 126, year: "1936" }, W(P.desk(78, 126, 80, 1.35) + P.cut(stacks, 1) + sack)) +
        k.person(46, 62, { legs: "sit", arms: "desk", look: 1, hat: "fedora", tie: true, face: "flat" });
    });

  /* ===== 选择偏差的例子 ===== */
  VL.illus.add("c01-eg2-basket", "篮球馆里一条红色虚线标着选拔的身高线：两个穿球衣的高个子头顶过了线，其中一个捧着篮球；右边一个矮个子头顶在线下面，站在外面",
    k => {
      const P = k.paper;
      const hoop = P.cut(P.rect(30, 8, 34, 22, "#fffaf0", { r: 1 }), 1) + '<rect x="40" y="16" width="14" height="9" fill="none" stroke="#ec8462" stroke-width="1.5"/>' + P.strip("M38 32 L56 32", "#ec8462", 2.4, { tex: false });
      const line = '<path d="M6 46 L194 46" stroke="#b13e53" stroke-width="2" stroke-dasharray="6 4"/>';
      const h = k.hands(64, 126 - 64 * 1.2, { arms: "hold", look: 1, s: 1.2 }), mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
      const ball = P.cut(P.circle(mx, my, 7, "#ec8462", { wob: 0 }) + P.strip("M" + (mx - 7) + " " + my + " L" + (mx + 7) + " " + my + " M" + mx + " " + (my - 7) + " L" + mx + " " + (my + 7), "#7a3b20", .9, { tex: false }), 2) +
        h.map(p => P.circle(p[0], p[1], 3, P.PAL.skin, { wob: 0, sheen: false })).join("");
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(hoop + line)) +
        k.person(64, 126 - 64 * 1.2, { s: 1.2, arms: "hold", look: 1, shirt: "#f2bd4b", face: "smile" }) + W(ball) +
        k.person(128, 126 - 64 * 1.18, { s: 1.18, arms: "stand", look: -1, shirt: "#f2bd4b", hat: "cap", face: "smile" }) +
        k.person(176, 126 - 64 * .86, { s: .86, arms: "stand", look: -1, hair: "long", face: "sad", shirt: "#4fc3cf" });
    },
    k => k.T(192, 40, 12, "选拔线", "end"));

  VL.illus.add("c01-eg2-review", "三个刚吃完饭的客人：左边的人举着手机打五星，中间戴鸭舌帽的人皱着眉打一星，右边戴毛线帽的人什么也没打，径直走开了",
    k => {
      const P = k.paper;
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, "") +
        k.person(34, 62, { arms: "hold", look: 1, face: "grin", hair: "long", shirt: "#f4a3b4" }) + held(k, 34, 62, { look: 1 }, (x, y) => phone(P, x, y)) +
        k.person(98, 62, { arms: "hold", look: 1, hat: "cap", face: "angry", shirt: "#f2bd4b" }) + held(k, 98, 62, { look: 1 }, (x, y) => phone(P, x, y)) +
        k.person(166, 62, { arms: "stand", legs: "walk", look: 1, hat: "beanie", face: "flat", shirt: "#9cc48a" }) +
        k.bubble(18, 8, 50, 26, [38, 50]) + k.bubble(84, 8, 50, 26, [102, 50]);
    },
    k => k.T(43, 26, 13, "五星！", "middle") + k.T(109, 26, 13, "一星！", "middle"));

  VL.illus.add("c01-eg2-lottery", "研究者站在桌边，双手拿着一张刚从纸箱里抽出的、写着“A”的纸签；纸箱里还露着几张没抽的签，桌子另一边贴着“A 组”“B 组”两个纸牌",
    k => {
      const P = k.paper;
      const boxS = P.cut(P.rect(98, 74, 32, 26, P.PAL.kraft, { wob: .2 }) + P.rect(104, 68, 6, 10, "#fffaf0", { wob: .1 }) + P.rect(114, 66, 6, 12, "#f4dd78", { wob: .1 }) + P.rect(122, 69, 5, 9, "#fffaf0", { wob: .1 }), 2);
      const h = k.hands(54, 62, { arms: "hold", look: 1 }), mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
      const slip = P.cut(P.rect(mx - 7, my - 9, 14, 16, "#fffaf0", { wob: .1 }), 2) + h.map(p => P.circle(p[0], p[1], 3.2, P.PAL.skin, { wob: 0, sheen: false })).join("");
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(P.desk(88, 126, 96, 1.2) + boxS + P.tag(130, 40, "A 组", { size: 12 }) + P.tag(172, 40, "B 组", { size: 12, fill: "#d9ecf7" }))) +
        k.person(54, 62, { arms: "hold", look: 1, glasses: true, face: "smile", shirt: "#4fc3cf" }) + W(slip);
    },
    k => {
      const h = k.hands(54, 62, { arms: "hold", look: 1 }), mx = (h[0][0] + h[1][0]) / 2, my = (h[0][1] + h[1][1]) / 2;
      return k.T(mx, my + 3, 12, "A", "middle");
    });

  /* ===== 发明故事的时间线 ===== */
  VL.illus.add("c01-tl-cicero", "神庙墙上挂着两幅还愿画，画的都是风浪里的船；第三个画框是空的，只有虚线和问号。左边一个人指着墙上的画，右边一个留胡子的人托着下巴",
    k => {
      const P = k.paper, Y = 54;
      const frame = x => P.cut(P.rect(x, Y, 26, 24, P.PAL.wood, { r: 1 }) + P.rect(x + 3, Y + 3, 20, 18, P.PAL.sky, { wob: 0, sheen: false }) +
        P.path("M" + (x + 3) + " " + (Y + 15) + " Q" + (x + 8) + " " + (Y + 11) + " " + (x + 13) + " " + (Y + 15) + " T" + (x + 23) + " " + (Y + 15) + " L" + (x + 23) + " " + (Y + 21) + " L" + (x + 3) + " " + (Y + 21) + " Z", P.PAL.blue, { wob: 0, sheen: false }) +
        P.poly([[x + 8, Y + 13], [x + 18, Y + 13], [x + 16, Y + 16], [x + 10, Y + 16]], P.PAL.wood, { wob: 0, sheen: false }) + P.strip("M" + (x + 13) + " " + (Y + 13) + " L" + (x + 13) + " " + (Y + 6), "#3a3f4f", .8, { tex: false }), 1);
      const empty = '<rect x="140" y="' + Y + '" width="26" height="24" fill="none" stroke="#55607a" stroke-width="1.5" stroke-dasharray="4 3"/>';
      return ST(P, { back: "plain", ground: "cobble", floor: 126 }, W(frame(84) + frame(112) + empty)) +
        k.person(46, 62, { arms: "point", look: 1, hair: "short", face: "smile", shirt: "#f7b98f" }) +
        k.person(182, 62, { arms: "chin", look: -1, beard: true, hair: "curly", face: "flat", shirt: "#bba9ea" });
    },
    k => k.T(153, 71, 14, "?", "middle"));

  VL.illus.add("c01-tl-bacon", "一个戴贝雷帽、留胡子的人坐在书桌前，右手捏着鹅毛笔在一本摊开的书上写字，桌角点着一盏灯",
    k => {
      const P = k.paper;
      const book = P.cut(P.poly([[80, 90], [98, 86], [98, 91], [80, 92]], "#fffaf0", { wob: .1 }) + P.poly([[98, 86], [116, 90], [116, 92], [98, 91]], "#f4ecd8", { wob: .1 }), 1);
      const quill = P.strip("M74 93 L86 76", "#fbfcff", 2.2, { tex: false }) + P.strip("M74 93 L80 84", "#3a3f4f", .9, { tex: false });
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(P.desk(70, 126, 94, 1.35) + P.lamp(150, 91, 1) + book)) +
        k.person(46, 62, { legs: "sit", arms: "desk", look: 1, hat: "beret", beard: true, face: "flat", shirt: "#7c3b5e" }) + W(quill);
    });

  VL.illus.add("c01-tl-wald", "一个戴眼镜、打领带的数学家坐在桌前写算式，桌子后面的墙上钉着一张画着俯视飞机的图纸，图上标着弹孔",
    k => {
      const P = k.paper;
      const sheet = P.cut(P.rect(92, 22, 84, 46, "#fffaf0", { wob: .2 }), 1) + '<circle cx="97" cy="27" r="1.6" fill="#b13e53"/><circle cx="171" cy="27" r="1.6" fill="#b13e53"/>';
      const pl = planeTop(P, 134, 45, .12, { lift: 1 });
      const hs = [[110, 44], [118, 46], [150, 45], [158, 44], [134, 58], [134, 34]].map(p => hole(p[0], p[1], 1.2)).join("");
      const paper = P.cut(P.rect(80, 86, 22, 5, "#fffaf0", { wob: .1 }), 1);
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(sheet + pl + hs + P.desk(70, 126, 96, 1.35) + paper)) +
        k.person(46, 62, { legs: "sit", arms: "desk", look: 1, glasses: true, tie: true, face: "think", shirt: "#a9d8f2" });
    });

  VL.illus.add("c01-tl-taleb", "左边一个书架上整齐摆着成功者写的书，右边的草坡上立着几块不说话的墓碑；一个人站在中间，指着墓碑那边",
    k => {
      const P = k.paper;
      const shelf = P.cut(P.rect(8, 50, 44, 76, P.PAL.wood, { r: 1 }) + [56, 80, 104].map(y => P.rect(11, y - 22, 38, 20, P.shade(P.PAL.wood, .3), { wob: 0, sheen: false })).join("") +
        [56, 80, 104].map((y, r) => [0, 1, 2, 3, 4].map(i => P.rect(13 + i * 7, y - 20 + (i % 2), 6, 18 - (i % 2), [P.PAL.coral, P.PAL.mustard, P.PAL.blue, P.PAL.sage, P.PAL.lavender][(i + r) % 5], { wob: 0, sheen: false })).join("")).join(""), 1);
      const stone = (x, h) => P.cut(P.rect(x, 126 - h, 16, h, "#c9d1d9", { r: 6 }), 1);
      return ST(P, { back: "meadow", floor: 126 }, W(shelf + stone(140, 30) + stone(162, 26) + stone(182, 32))) +
        k.person(96, 62, { arms: "point", look: 1, hair: "side", face: "flat", shirt: "#f2bd4b" });
    });

  /* ===== 原理框：四格里只有一格被照亮 ===== */
  VL.illus.add("c01-why-grid", "两行两列的四张纸片：右上那张亮着，贴着一个笑着的人像和一颗星；另外三张只有虚线框和问号",
    k => {
      const P = k.paper;
      const lit = P.cut(P.rect(112, 22, 66, 46, P.PAL.lemon, { r: 2 }) + P.circle(136, 40, 7, P.PAL.skin, { wob: 0 }) + P.path("M124 62 Q136 46 148 62 Z", P.PAL.blue, { wob: 0 }), 2) + star(P, 164, 34, 8);
      const ghost = (x, y) => '<rect x="' + x + '" y="' + y + '" width="66" height="46" rx="2" fill="none" stroke="#55607a" stroke-width="1.5" stroke-dasharray="4 3"/>';
      return W(lit + ghost(40, 22) + ghost(40, 76) + ghost(112, 76));
    },
    k => k.T(73, 16, 12, "读完", "middle") + k.T(145, 16, 12, "退学", "middle") + k.T(34, 49, 12, "成功", "end") + k.T(34, 103, 12, "失败", "end") +
      k.T(73, 50, 15, "?", "middle") + k.T(73, 104, 15, "?", "middle") + k.T(145, 104, 15, "?", "middle"));

  /* ===== 反思：读成功者自传的人，身旁一摞书和一本虚线画的“没写出来的书” ===== */
  VL.illus.add("c01-reflect", "一个人坐在凳子上捧着一本自传想事情，脚边摞着三本成功者的书，旁边还有一本只用虚线画出的书，代表没写出来的那些失败者的故事",
    k => {
      const P = k.paper;
      const pile = P.cut(P.item("book", 140, 120, 2.2, { fill: P.PAL.coral }) + P.item("book", 141, 100, 2.2, { fill: P.PAL.mustard }) + P.item("book", 139, 80, 2.2, { fill: P.PAL.indigo }), 1);
      const ghost = '<rect x="164" y="106" width="26" height="20" rx="1" fill="none" stroke="#55607a" stroke-width="1.5" stroke-dasharray="4 3"/>';
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(pile + ghost)) +
        k.person(62, 62, { legs: "sit", arms: "hold", look: 1, face: "think", hair: "ponytail", shirt: "#9cc48a" }) + k.holding(62, 62, { look: 1 }, "book");
    });

  /* ===== 第 2 节开头：机场上数得到弹孔，海里的飞机数不到 ===== */
  VL.illus.add("c01-s2-sea", "左边的机场草地上停着一架飞回来的飞机，一个人拿着记录板数弹孔；右边是大海，一架被击落的飞机只剩尾翼露在水面上，旁边没有人",
    k => {
      const P = k.paper, sl = P.PAL.slate, dk = P.shade(sl, -.2);
      const sea = P.rect(100, 98, 104, 46, "#5b8fd9", { wob: 0, sheen: false }) + P.strip("M104 108 Q112 104 120 108 T136 108 T152 108 T168 108 T184 108 T200 108 M106 122 Q114 118 122 122 T138 122 T154 122 T170 122 T186 122 T202 122", "#a9d8f2", 1.6, { tex: false });
      const tailFin = P.cut(P.poly([[146, 104], [154, 74], [166, 76], [164, 104]], dk, { wob: .2 }) + P.ellipse(156, 104, 20, 4, P.shade(sl, -.35), { wob: .1 }), 2);
      const plane = P.cut(P.poly([[50, 92], [54, 78], [61, 79], [64, 92]], dk, { wob: .2 }) + P.ellipse(76, 94, 24, 6.5, sl, { wob: .2 }) + P.poly([[70, 96], [90, 96], [88, 100], [68, 100]], dk, { wob: .2 }), 2) +
        P.strip("M84 100 L84 106 M56 97 L56 107", "#3a3f4f", 1.8, { tex: false }) + P.circle(84, 108, 4, "#2a2630", { wob: 0 }) + P.circle(56, 109, 3, "#2a2630", { wob: 0 }) +
        hole(70, 92, 1.3) + hole(80, 96, 1.3) + hole(88, 93, 1.3) + hole(76, 98, 1.2);
      const bub = '<g fill="none" stroke="#e4f1f8" stroke-width="1.2"><circle cx="136" cy="96" r="2"/><circle cx="141" cy="90" r="1.4"/></g>';
      return ST(P, { back: "meadow", floor: 112 }, W(sea + tailFin + plane) + bub) +
        k.person(18, 48, { arms: "hold", look: 1, hat: "cap", face: "flat", shirt: "#9cc48a" }) + k.holding(18, 48, { look: 1 }, "doc");
    },
    k => k.T(54, 26, 13, "数得到", "middle") + k.T(160, 26, 13, "数不到", "middle"));

  /* ===== 第 4 节揭晓：名单只从电话、汽车、订户里来，名单外的人收不到选票 ===== */
  VL.illus.add("c01-digest-list", "左边一张名单纸上画着电话、汽车和杂志，箭头指向一只装满选票的邮袋；右边站着一个戴草帽的农民和一个戴毛线帽的工人，手里什么也没有，头顶标着“名单外”",
    k => {
      const P = k.paper;
      const list = P.cut(P.rect(6, 14, 64, 98, "#fffaf0", { wob: .2 }), 1);
      const tel = P.cut(P.rect(22, 24, 30, 16, "#3a3f4f", { r: 3 }) + P.rect(18, 22, 38, 6, "#55607a", { r: 3 }) + P.circle(37, 33, 4, "#c9d1d9", { wob: 0 }), 1);
      const car = P.cut(P.rect(16, 58, 42, 12, P.PAL.coral, { r: 3 }) + P.rect(24, 50, 24, 10, P.PAL.coral, { r: 3 }) + P.rect(27, 52, 8, 6, P.PAL.sky, { wob: 0, sheen: false }) + P.rect(37, 52, 8, 6, P.PAL.sky, { wob: 0, sheen: false }) + P.circle(25, 71, 4, "#2a2630", { wob: 0 }) + P.circle(49, 71, 4, "#2a2630", { wob: 0 }), 1);
      const mag = P.cut(P.rect(24, 82, 26, 24, P.PAL.mustard, { wob: .1 }) + P.rect(28, 86, 18, 4, "#fffaf0", { wob: 0, sheen: false }), 1);
      const sack = P.cut(P.blob([[86, 126], [84, 100], [92, 88], [110, 86], [118, 100], [118, 126]], P.PAL.kraft, { wob: .3 }) + P.rect(94, 80, 9, 11, "#fffaf0", { wob: .2 }) + P.rect(105, 82, 9, 11, "#f4dd78", { wob: .2 }), 2);
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(list + tel + car + mag + P.parrow(72, 70, 84, 92, { w: 4, fill: P.PAL.slate }) + sack)) +
        k.person(146, 126 - 64 * .95, { arms: "stand", look: -1, hat: "beret", face: "flat", s: .95, shirt: "#9cc48a" }) +
        k.person(180, 126 - 64 * .95, { arms: "stand", look: -1, hat: "beanie", face: "flat", s: .95, shirt: "#f7b98f" });
    },
    k => k.T(163, 20, 12, "名单外", "middle"));

  /* ===== 立场卡：第一个走过独木桥的人 ===== */
  VL.illus.add("c01-philo-path", "一条小溪上架着一根独木桥，一个人已经走到对岸，回头朝桥这边招手，桥这头的草地上还没有别人",
    k => {
      const P = k.paper;
      const creek = P.rect(70, 114, 66, 30, "#5b8fd9", { wob: 0, sheen: false }) + P.strip("M74 124 Q82 120 90 124 T106 124 T122 124 T136 124", "#a9d8f2", 1.4, { tex: false });
      const log = P.cut(P.rect(62, 108, 82, 7, P.PAL.wood, { r: 3 }), 2);
      return ST(P, { back: "meadow", floor: 126 }, W(creek + log)) +
        k.person(168, 62, { arms: "wave", look: -1, face: "grin", hat: "cap", shirt: "#f7b98f" });
    });

  /* ===== 立场卡：两扇门都要数 ===== */
  VL.illus.add("c01-philo-count", "两扇门，左边门上贴着星星表示成功，右边门上画着叉表示失败；一个戴眼镜的人站在两扇门中间，手拿记录板，两边都在数",
    k => {
      const P = k.paper;
      const door = (x, c) => P.cut(P.rect(x, 52, 40, 74, c, { r: 2 }) + P.rect(x + 4, 56, 32, 66, P.shade(c, -.12), { wob: 0, sheen: false }) + P.circle(x + 30, 92, 2.4, P.PAL.mustard, { wob: 0 }), 1);
      return ST(P, { back: "plain", ground: "wood", floor: 126 }, W(door(14, "#9cc48a") + door(146, "#c9d1d9") + star(P, 34, 40, 8)) + cross(166, 40, 6, "#b13e53")) +
        k.person(100, 62, { arms: "hold", look: 1, glasses: true, face: "think", shirt: "#bba9ea" }) + k.holding(100, 62, { look: 1 }, "doc");
    });

  /* ===== 目录页题头：天上一架返航的轰炸机，草地上一个人挥手 ===== */
  VL.illus.add("ix-hero", "蓝天里一架轰炸机正往回飞，草地上一个人朝它挥手",
    k => {
      const P = k.paper, sl = P.PAL.slate;
      const plane = P.cut(P.poly([[50, 34], [56, 14], [66, 16], [70, 34]], P.shade(sl, -.2), { wob: .2 }) + P.ellipse(96, 36, 46, 9, sl, { wob: .2 }) +
        P.poly([[80, 38], [120, 38], [116, 44], [76, 44]], P.shade(sl, -.2), { wob: .2 }) + P.rect(124, 30, 10, 5, P.PAL.sky, { r: 2, wob: 0, sheen: false }), 2);
      return ST(P, { back: "meadow", floor: 126 }, W(plane + hole(88, 34, 1.4) + hole(104, 40, 1.4) + hole(96, 32, 1.4))) +
        k.person(156, 62, { arms: "wave", look: -1, face: "grin", shirt: "#9cc48a" });
    });
})();
