/* 第 1 章《礼物与回礼》插画包。皮肤 fieldbook 的绘制工具（k.person / k.holding / k.table / k.house …）。
   viewBox 200×140，地面 ground() 在 y=126；站姿 person(x, 62) 脚正好落地，坐姿 person(x, 62, {legs:"sit"}) 自带木凳。
   文字一律放第 4 个参数（文字层，不进彩铅化）。名字前缀 c01-，全课只用一次。 */
(function () {
  const add = VL.illus.add;

  // ---- 本章专用小物件（中心在 x,y；宽度按两手间距约 14 画，拿在手里时两手正好捏住两侧） ----
  const g = k => ({
    mooncake: (x, y) => k.B(x - 10, y - 7, 20, 14, "#c9695a", 1.5, 1.6) + k.Ci(x, y, 3.6, "#e3b23c", 1.2),
    hongbao: (x, y) => k.B(x - 5, y - 7, 10, 14, "#c9695a", 1, 1.5) + k.Ci(x, y - 2, 2, "#e3b23c", 0.9),
    hbpile: (x, y) => k.B(x - 9, y - 4, 16, 9, "#c9695a", 1, 1.4) + k.B(x - 6, y - 8, 16, 9, "#c9695a", 1, 1.4),
    bowl: (x, y) => k.P("M" + (x - 9) + " " + (y - 3) + " q9 -9 18 0", "#fbf8f1", 1.4) + k.P("M" + (x - 10) + " " + (y - 3) + " h20 q-2 9 -10 9 q-8 0 -10 -9z", "#9cbdb6", 1.6),
    oranges: (x, y) => k.Ci(x - 5, y - 6, 3.6, "#e39a4a", 1.2) + k.Ci(x + 2, y - 7, 3.6, "#e39a4a", 1.2) + k.Ci(x + 7, y - 4, 3, "#e39a4a", 1.1) + k.item("basket", x, y),
    pot: (x, y) => k.P("M" + (x - 12) + " " + (y - 4) + " h24 q-1 10 -12 10 q-11 0 -12 -10z", "#b8b1a6", 1.6) + k.P("M" + (x - 4) + " " + (y - 8) + " q-3 -4 0 -8 M" + (x + 4) + " " + (y - 8) + " q-3 -4 0 -8", "none", 1.2),
    tickets: (x, y) => k.B(x - 8, y - 6, 14, 10, "#e9cf8a", 1, 1.3) + k.B(x - 5, y - 3, 14, 10, "#e9cf8a", 1, 1.3),
    cola: (x, y) => k.P("M" + (x - 3) + " " + (y - 9) + " h6 v3 q3 2 3 6 v9 h-12 v-9 q0 -4 3 -6z", "#8a3b30", 1.4) + k.B(x - 3, y, 6, 4, "#fbf8f1", 0, 0.8),
    invites: (x, y) => k.B(x - 10, y - 3, 18, 11, "#c9695a", 1, 1.3) + k.B(x - 8, y - 6, 18, 11, "#c9695a", 1, 1.3) + k.B(x - 6, y - 9, 18, 11, "#d97c6b", 1, 1.3),
  });
  // 拿着自定义物件：取两手中点（与 k.holding 相同的算法）
  const hold = (k, x, y, o, fn) => { const h = k.hands(x, y, Object.assign({ arms: "hold" }, o)); return fn((h[0][0] + h[1][0]) / 2, (h[0][1] + h[1][1]) / 2); };

  // ---------- 题头：王阿姨在门口递来月饼 ----------
  add("c01-hero", "傍晚，一位挽着发髻的阿姨站在自家门口，双手捧着一盒红色月饼礼盒，对面一个年轻人站着，有点意外地看着她",
    k => k.ground() + k.house(6, 126, 46, 62, "#cf9a80", "#eadbbb") +
      k.person(96, 62, { hair: "bun", bottom: "skirt", top: "#c2a5b8", arms: "hold", face: "smile", look: 1 }) + hold(k, 96, 62, { look: 1 }, g(k).mooncake) +
      k.person(158, 62, { hat: "cap", arms: "stand", face: "o", look: -1 }) +
      k.bubble(62, 8, 72, 28, [94, 46]),
    k => k.T(98, 27, 14, "中秋快乐", "middle"));

  // ---------- 第 1 节：月饼摆在桌上，主人托着下巴发愁 ----------
  add("c01-s1-scene", "一个人坐在凳子上托着下巴，面前桌上摆着那盒月饼，头顶的气泡里写着“回点什么好？”",
    k => k.ground() + k.person(62, 62, { legs: "sit", arms: "chin", face: "flat", look: 1, hat: "cap" }) +
      k.table(96, 126, 70) + g(k).mooncake(130, 89) +
      k.bubble(98, 8, 96, 30, [80, 46]),
    k => k.T(146, 28, 14, "回点什么好？", "middle"));

  // ---------- 互惠概念卡：送 → 收 → 回 ----------
  add("c01-cc-1", "两个人面对面站着：上方一道箭头从左边的人指向右边，标着“送”；右边的人头旁标着“收”；下方一道箭头从右边指回左边，标着“回”",
    k => k.ground() + k.person(42, 62, { arms: "hold", look: 1, hair: "bun", top: "#c2a5b8" }) + hold(k, 42, 62, { look: 1 }, g(k).mooncake) +
      k.person(158, 62, { arms: "stand", look: -1, hat: "cap" }) +
      k.arrow(62, 34, 136, 34, "#b3362c") + k.arrow(138, 96, 64, 96, "#2f5f9e"),
    k => k.T(99, 26, 15, "送", "middle", "#b3362c") + k.T(184, 50, 15, "收", "middle") + k.T(101, 116, 15, "回", "middle", "#2f5f9e"));

  // ---------- 互惠的例子 ----------
  add("c01-eg-wedding", "婚宴门口，一位客人双手捧着红包站在礼台前，礼台上摊着一本礼簿和一叠红包",
    k => k.ground() + k.person(52, 62, { arms: "hold", look: 1, hat: "cap", tie: true }) + hold(k, 52, 62, { look: 1 }, g(k).hongbao) +
      k.table(96, 126, 92) + k.item("notebook", 120, 90) + g(k).hbpile(160, 91),
    k => k.T(120, 76, 13, "礼簿", "middle"));
  add("c01-eg-tea", "两位同事面对面站着，各端一杯奶茶；左边的人说“这次我请”，右边的人说“下回我来”",
    k => k.ground() + k.person(52, 62, { arms: "hold", look: 1, glasses: true }) + k.holding(52, 62, { look: 1 }, "cup") +
      k.person(148, 62, { arms: "hold", look: -1, hair: "long", top: "#9cbdb6" }) + k.holding(148, 62, { look: -1 }, "cup") +
      k.bubble(4, 6, 76, 28, [44, 46]) + k.bubble(120, 6, 76, 28, [152, 46]),
    k => k.T(42, 25, 13, "这次我请", "middle") + k.T(158, 25, 13, "下回我来", "middle"));
  add("c01-eg-harvest", "稻田边，两位戴草帽的农人各提着一篮稻穗并排站着，一起去邻居家帮忙收稻",
    k => k.W("M0 96 Q100 90 200 96 L200 126 L0 126Z", "#e9cf8a", 0.6) +
      [14, 30, 170, 186].map(x => k.P("M" + x + " 124 q-2 -14 2 -24 M" + (x + 4) + " 124 q2 -12 -1 -22", "none", 1.4)).join("") +
      k.ground() + k.person(78, 62, { hat: "straw", arms: "hold", look: 1, top: "#b8bd8a" }) + k.holding(78, 62, { look: 1 }, "basket") +
      k.person(124, 62, { hat: "straw", arms: "hold", look: -1, top: "#cf9a80", bottom: "skirt" }) + k.holding(124, 62, { look: -1 }, "basket"),
    k => "");
  add("c01-eg-shop", "便利店柜台前，顾客拿着一瓶水，柜台上放着一枚硬币，店员站在柜台后；上方写着“钱货两清”",
    k => k.ground() + k.person(150, 62, { arms: "stand", look: -1, hat: "cap", top: "#9cbdb6" }) +
      k.B(112, 92, 82, 34, "#eadbbb", 1, 1.8) + k.item("coin", 132, 85) +
      k.person(58, 62, { arms: "hold", look: 1 }) + hold(k, 58, 62, { look: 1 }, (x, y) => k.P("M" + (x - 3) + " " + (y - 8) + " h6 v16 h-6z", "#d4e3e7", 1.4)),
    k => k.T(100, 24, 14, "钱货两清", "middle"));

  // ---------- 原理框：里根的可乐实验 ----------
  add("c01-why-1", "实验室里，戴鸭舌帽的助手手里拿着两张彩票，对面的被试捧着刚收到的一瓶可乐；助手的气泡里写着“买几张彩票吗？”",
    k => k.ground() + k.person(56, 62, { hat: "cap", arms: "hold", look: 1, face: "grin" }) + hold(k, 56, 62, { look: 1 }, g(k).tickets) +
      k.person(148, 62, { arms: "hold", look: -1, glasses: true, top: "#a7aecb" }) + hold(k, 148, 62, { look: -1 }, g(k).cola) +
      k.bubble(14, 6, 104, 28, [56, 46]),
    k => k.T(66, 25, 13, "买几张彩票吗？", "middle"));

  // ---------- 发明故事时间线 ----------
  add("c01-tl-1915", "一位戴遮阳盔和眼镜的研究者坐在草屋前的凳子上，手里捧着笔记本在记录",
    k => k.ground() + k.house(118, 126, 56, 48, "#b8bd8a", "#eadbbb") + k.tree(186, 126, 0.8) +
      k.person(66, 62, { legs: "sit", arms: "hold", hat: "pith", glasses: true, look: 1, top: "#fbf8f1" }) + k.holding(66, 62, { look: 1 }, "notebook"),
    k => "");
  add("c01-tl-1922", "桌上摊开一本厚书，书旁盘着一串红色贝壳项链和一只白色臂镯",
    k => k.ground() + k.table(20, 126, 160) +
      k.P("M60 94 L100 98 L140 94 L140 74 L100 78 L60 74Z", "#fbf6ea", 1.6) + k.P("M100 78 V98", "none", 1.2) +
      k.P("M68 80 h24 M68 86 h20 M108 80 h24 M108 86 h18", "none", 1) +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = Math.PI * 2 * i / 10; return k.Ci(40 + 10 * Math.cos(a), 88 + 5 * Math.sin(a), 2.4, "#b3362c", 1); }).join("") +
      k.E(162, 88, 9, 5, "none", 3) + k.E(162, 88, 9, 5, "none", 1.2),
    k => "");
  add("c01-s3-canoe", "海面上一条带支架的独木舟，舟上放着一串红色贝壳项链",
    k => k.W("M0 104 Q50 98 100 104 T200 104 L200 140 L0 140Z", "#9cbdb6", 0.55) +
      k.P("M24 96 Q100 116 176 96 Q170 104 100 108 Q30 104 24 96Z", "#94714f", 1.8) +
      k.P("M60 98 L64 78 M140 98 L136 78 M58 78 H142", "none", 2) +
      k.P("M100 92 L100 34 L136 84 Z", "#fbf6ea", 1.6) +
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const a = Math.PI * (0.1 + i * 0.1); return k.Ci(78 - 12 * Math.cos(a), 80 + 8 * Math.sin(a) - 8, 2.4, "#b3362c", 1); }).join("") +
      k.P("M40 120 q8 -4 16 0 M140 124 q8 -4 16 0", "none", 1.2),
    k => "");
  add("c01-tl-1925", "一位学者坐在书桌前，桌上堆着几本书和一叠从各地寄来的信",
    k => k.ground() + k.person(60, 62, { legs: "sit", arms: "desk", look: 1, beard: true, glasses: true, top: "#5f6884" }) +
      k.table(72, 126, 100) + k.item("book", 120, 89) + k.item("book", 122, 77) + k.item("letters", 152, 90),
    k => "");

  // ---------- 招牌互动：三位亲友 ----------
  add("c01-fr-wang", "王阿姨：挽着发髻，双手捧着一盒月饼",
    k => k.ground() + k.person(100, 30, { s: 1.5, hair: "bun", bottom: "skirt", top: "#c2a5b8", arms: "hold", face: "smile" }) + hold(k, 100, 30, { s: 1.5 }, g(k).mooncake), k => "");
  add("c01-fr-lin", "老同学小林：戴渔夫帽，双手端着一口冒热气的小火锅",
    k => k.ground() + k.person(100, 30, { s: 1.5, hat: "bucket", hatColor: "#9cbdb6", top: "#cf9a80", arms: "hold", face: "grin" }) + hold(k, 100, 30, { s: 1.5 }, g(k).pot), k => "");
  add("c01-fr-jie", "表姐：齐耳短发、戴眼镜，双手提着一篮橙子",
    k => k.ground() + k.person(100, 30, { s: 1.5, hair: "bob", glasses: true, top: "#e9cf8a", arms: "hold", face: "smile" }) + hold(k, 100, 30, { s: 1.5 }, g(k).oranges), k => "");

  // ---------- 人情往来概念卡：账永远差一点 ----------
  add("c01-cc-2", "两个人隔开站着，中间三道箭头一来一回往下排：先是左给右一盒东西，再是右给左一篮稍大的，最后左又给右一盒更大的，底下写着“还差一点”",
    k => k.ground() + k.person(26, 62, { arms: "stand", look: 1, hair: "bun", top: "#c2a5b8" }) + k.person(174, 62, { arms: "stand", look: -1, hat: "cap" }) +
      k.arrow(52, 34, 146, 34, "#b3362c") + g(k).mooncake(100, 24) +
      k.arrow(148, 66, 54, 66, "#2f5f9e") + k.item("basket", 100, 56) +
      k.arrow(52, 96, 146, 96, "#b3362c") + k.B(88, 76, 24, 16, "#c9695a", 1.5, 1.6) + k.Ci(100, 84, 4, "#e3b23c", 1.2),
    k => k.T(100, 118, 13, "还差一点……", "middle"));

  // ---------- 第 5 节开头：翻账本 ----------
  add("c01-s5-ledger", "一个人坐在凳子上，双手捧着一本账本看，旁边桌上放着一篮橙子，头顶气泡写着“这回该我了”",
    k => k.ground() + k.person(70, 62, { legs: "sit", arms: "hold", look: 1, hair: "bob", glasses: true, top: "#e9cf8a" }) + k.holding(70, 62, { look: 1 }, "notebook") +
      k.table(110, 126, 70) + g(k).oranges(150, 89) + k.bubble(96, 6, 98, 28, [84, 46]),
    k => k.T(145, 25, 13, "这回该我了", "middle"));

  // ---------- 人情往来的例子 ----------
  add("c01-eg2-rice", "邻居家门口，一个人双手端着一碗装得冒尖的米递过去，开门的邻居笑着",
    k => k.ground() + k.house(140, 126, 54, 60, "#cf9a80", "#eadbbb") +
      k.person(64, 62, { arms: "hold", look: 1, hair: "bob", top: "#b8bd8a" }) + hold(k, 64, 62, { look: 1 }, g(k).bowl) +
      k.person(118, 62, { arms: "stand", look: -1, hat: "bucket", face: "grin" }),
    k => k.T(64, 36, 13, "多一勺", "middle"));
  add("c01-eg2-dinner", "两个老朋友坐在小桌两边吃火锅，右边的人说“下回我请”",
    k => k.ground() + k.person(40, 62, { legs: "sit", arms: "desk", look: 1, glasses: true }) + k.person(160, 62, { legs: "sit", arms: "desk", look: -1, hat: "cap", top: "#cf9a80" }) +
      k.table(66, 126, 68) + g(k).pot(100, 88) + k.bubble(118, 4, 78, 28, [160, 46]),
    k => k.T(157, 23, 13, "下回我请", "middle"));
  add("c01-eg2-refund", "一个人拿着手机，手机旁的气泡写着“已退回 ¥200”；远处的朋友站着，有点失落",
    k => k.ground() + k.person(60, 62, { arms: "hold", look: 1, hat: "cap" }) + k.holding(60, 62, { look: 1 }, "phone") +
      k.person(182, 62, { arms: "stand", look: -1, hair: "bob", face: "sad", top: "#a7aecb" }) + k.bubble(76, 36, 92, 28, [68, 82]),
    k => k.T(122, 55, 13, "已退回 ¥200", "middle"));

  // ---------- 原理框：隔开的时间（墙上的日历） ----------
  add("c01-why-2", "一页挂历，月初一天画着礼盒、月底一天画着回赠的篮子，两天之间一道长箭头；挂历右边写着“隔一阵”",
    k => k.P("M70 6 V18", "none", 1.6) + k.Ci(70, 6, 3, "#b8b1a6", 1.4) +
      k.B(12, 18, 116, 108, "#fffdf8", 2, 1.8) + k.B(12, 18, 116, 18, "#c9695a", 2, 1.8) +
      [0, 1, 2, 3, 4].map(c => [0, 1, 2, 3].map(r => k.B(18 + c * 22, 44 + r * 20, 18, 16, "none", 1, 1)).join("")).join("") +
      g(k).mooncake(27, 52) + k.item("basket", 115, 113) + k.arrow(36, 60, 104, 104, "#2f5f9e") + k.arrow(168, 78, 132, 86, "#2f5f9e"),
    k => k.T(70, 32, 13, "一个月", "middle", "#fffdf8") + k.T(170, 74, 14, "隔一阵", "middle", "#2f5f9e"));
  // ---------- 第 6 节：一家人吃饭，菜市场讲价 ----------
  add("c01-s6-family", "一家人围着矮桌吃饭：奶奶坐在左边，孙子坐在桌子后面，妈妈坐在右边端着一碗饭",
    k => k.ground() + k.person(100, 70, { s: 0.85, legs: "sit", arms: "desk", look: 1, top: "#e9cf8a", hat: "cap" }) +
      k.table(62, 126, 76, 0.9) + k.item("cup", 82, 94) + g(k).pot(116, 95) +
      k.person(34, 62, { legs: "sit", arms: "desk", look: 1, hair: "bun", hairColor: "#b8b1a6", top: "#c2a5b8" }) +
      k.person(166, 62, { legs: "sit", arms: "hold", look: -1, hair: "long", top: "#9cbdb6" }) + hold(k, 166, 62, { look: -1 }, g(k).bowl),
    k => "");
  add("c01-s6-market", "菜市场的摊位前，买菜的人举着一把青菜，摊主伸出手指比划价钱，两人在讲价",
    k => k.ground() + k.B(108, 92, 86, 34, "#b8bd8a", 1, 1.8) + [122, 138, 154, 170].map(x => k.Ci(x, 88, 6, "#a8c294", 1.2)).join("") +
      k.person(166, 62, { arms: "point", look: -1, hat: "bucket", top: "#cf9a80" }) +
      k.person(60, 62, { arms: "hold", look: 1, hair: "bob", top: "#a7aecb" }) + hold(k, 60, 62, { look: 1 }, (x, y) => k.P("M" + x + " " + (y + 6) + " q-6 -10 -2 -18 M" + x + " " + (y + 6) + " q6 -10 2 -18", "#a8c294", 1.4)) +
      k.bubble(6, 4, 80, 28, [52, 46]) + k.bubble(118, 4, 78, 28, [156, 46]),
    k => k.T(46, 23, 13, "便宜点吧", "middle") + k.T(157, 23, 13, "最低三块", "middle"));

  // ---------- 第 7 节：一摞请柬 ----------
  add("c01-reflect", "一个人双手捧着一摞红色请柬，表情发愁，头顶气泡写着“这个月第三张”",
    k => k.ground() + k.person(80, 62, { arms: "hold", look: 1, face: "sad", glasses: true, top: "#b8bd8a" }) + hold(k, 80, 62, { look: 1 }, g(k).invites) +
      k.item("letters", 150, 118) + k.bubble(104, 10, 92, 28, [92, 48]),
    k => k.T(150, 29, 13, "这个月第三张", "middle"));

  // ---------- 补充：开场三种回法、各节开头 ----------
  const dumplings = (k, x, y) => k.E(x, y + 3, 15, 5, "#fbf8f1", 1.5) + [-8, 0, 8].map(d => k.P("M" + (x + d - 5) + " " + (y + 1) + " q5 -9 10 0z", "#fbf6ea", 1.2)).join("");
  add("c01-guess-3", "桌面上摆着三样东西：一张五十元钞票、一盒月饼、一盘饺子，下面分别写着“钱”“月饼”“饺子”",
    k => k.P("M6 92 H194", "none", 2) + k.W("M6 93 H194 V100 H6Z", "#eadbbb", 0.8) +
      k.B(14, 52, 52, 30, "#b8bd8a", 2, 1.8) + k.Ci(40, 67, 9, "none", 1.4) + k.P("M20 58 h8 M52 76 h8", "none", 1.2) +
      k.B(78, 50, 44, 32, "#c9695a", 2, 1.8) + k.Ci(100, 66, 9, "#e3b23c", 1.4) +
      k.E(160, 80, 26, 8, "#fbf8f1", 1.8) + [-13, 0, 13].map(d => k.P("M" + (160 + d - 8) + " 78 q8 -14 16 0z", "#fbf6ea", 1.4)).join(""),
    k => k.T(40, 122, 15, "钱", "middle") + k.T(100, 122, 15, "月饼", "middle") + k.T(160, 122, 15, "饺子", "middle"));
  add("c01-s2-refuse", "门口，戴鸭舌帽的年轻人捧着一盒东西往前递，对面的阿姨双手举起连连推辞，气泡里写着“不用不用”",
    k => k.ground() + k.person(62, 62, { hat: "cap", arms: "hold", look: 1, face: "smile" }) + hold(k, 62, 62, { look: 1 }, g(k).mooncake) +
      k.person(140, 62, { hair: "bun", bottom: "skirt", top: "#c2a5b8", arms: "up", look: -1, face: "o" }) +
      k.bubble(118, 4, 78, 28, [142, 38]),
    k => k.T(157, 23, 13, "不用不用", "middle"));
  add("c01-s3-shells", "一个木架的横杆上挂着一串红色贝壳项链，项链下坠着一张写了名字的小木牌，地上的草席上放着一只白色贝壳臂镯；上方写着“每件都有名字”",
    k => k.W("M0 118 H200 V126 H0Z", "#eadbbb", 0.8) + k.ground() +
      k.P("M50 126 V34 M44 34 H128", "none", 4) + k.P("M110 34 V40", "none", 1.4) +
      Array.from({ length: 15 }, (_, i) => { const a = Math.PI * 2 * i / 15; return k.Ci(110 + 14 * Math.sin(a), 70 - 30 * Math.cos(a), 3, "#b3362c", 1); }).join("") +
      k.P("M110 100 V106", "none", 1.2) + k.B(98, 106, 24, 12, "#e9cf8a", 1, 1.3) +
      k.B(130, 118, 60, 8, "#e9cf8a", 1, 1.4) + k.E(160, 112, 14, 6, "none", 4) + k.E(160, 112, 14, 6, "none", 1.4),
    k => k.T(150, 24, 13, "每件都有名字", "middle"));
  add("c01-s4-gifts", "桌上摆着三份收到的礼：一盒月饼、一口小火锅、一篮橙子；上方写着“该怎么回？”",
    k => k.ground() + k.table(14, 126, 172) + g(k).mooncake(50, 89) + g(k).pot(100, 90) + g(k).oranges(150, 89),
    k => k.T(100, 40, 15, "该怎么回？", "middle"));
  add("c01-s7-feast", "空地上堆成小山的毯子和木箱，比旁边站着的人还高",
    k => k.ground() + [0, 1, 2, 3, 4, 5].map(i => k.B(96 - i * 2, 114 - i * 12, 80 + i * 4 - i * 10, 12, i % 2 ? "#a7aecb" : "#cf9a80", 1, 1.4)).join("") +
      k.item("box", 150, 118) + k.item("box", 172, 118) + k.item("box", 161, 102) +
      k.person(30, 62, { arms: "stand", look: 1, face: "o", outfit: false, top: "#b8bd8a" }),
    k => "");
  add("c01-ph-gift", "一户人家门口的台阶上放着一个系了丝带的礼盒，旁边没有人，小卡片上只画着一个问号",
    k => k.ground() + k.house(110, 126, 70, 70, "#cf9a80", "#eadbbb") +
      k.B(70, 106, 26, 20, "#9cbdb6", 1.5, 1.6) + k.P("M83 106 V126 M70 116 H96 M83 106 q-8 -8 -10 0 M83 106 q8 -8 10 0", "none", 1.4) +
      k.B(52, 94, 16, 12, "#fffdf8", 1, 1.2),
    k => k.T(60, 104, 12, "?", "middle"));
  add("c01-ph-blood", "一个人坐在凳子上把一只手臂伸平，旁边的支架上挂着一袋血，一根细管连到他的手臂",
    k => { const h = k.hands(64, 62, { legs: "sit", arms: "point", look: 1 }); const hx = h[1][0], hy = h[1][1];
      return k.ground() + k.person(64, 62, { legs: "sit", arms: "point", look: 1, face: "smile", glasses: true, top: "#a7aecb" }) +
        k.P("M130 126 V34 M118 126 H142 M130 34 H118", "none", 2.4) + k.B(108, 36, 20, 26, "#c9695a", 3, 1.6) +
        k.P("M118 62 Q120 " + (hy + 20) + " " + hx + " " + hy, "none", 1.4); },
    k => "");
  add("c01-s8-end", "几个星期后，戴鸭舌帽的年轻人捧着一盘饺子站在王阿姨门口，王阿姨笑着说“哎呀，客气啥”",
    k => k.ground() + k.house(148, 126, 46, 62, "#cf9a80", "#eadbbb") +
      k.person(58, 62, { hat: "cap", arms: "hold", look: 1, face: "smile" }) + hold(k, 58, 62, { look: 1 }, (x, y) => dumplings(k, x, y - 3)) +
      k.person(118, 62, { hair: "bun", bottom: "skirt", top: "#c2a5b8", arms: "stand", look: -1, face: "grin" }) +
      k.bubble(70, 4, 100, 28, [116, 46]),
    k => k.T(120, 23, 13, "哎呀，客气啥", "middle"));
})();
