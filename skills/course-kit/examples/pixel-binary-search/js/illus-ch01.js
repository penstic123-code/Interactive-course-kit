/* 第 1 章插画包：猜数字的七次机会（二分查找、对数增长）。
   像素画法由 skin/skin.js 提供（k.person / holding / bubble / R / F / L / icon / sprite / desk）。
   人物几何：x,y = 头部中心，脚底 = y + 64·s，ground() 在 y=126。文字一律放第 4 个参数（文字层）。 */
(function () {
  const A = VL.illus.add;
  const W = "#f4f4f4", Y = "#ffcd75", G = "#94b0c2", D = "#566c86";
  // 一排数字格：从 x0 起，每格宽 w；st(i) 返回 "cut" 划掉 | "hi" 高亮 | ""
  const tiles = (k, x0, y, w, h, n, st) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (w + 2), t = st ? st(i) : "";
      s += k.F(x, y, w, h, t === "cut" ? G : t === "hi" ? Y : W);
      if (t === "cut") s += k.L(x + 4, y + 4, x + w - 4, y + h - 4, 2.5) + k.L(x + w - 4, y + 4, x + 4, y + h - 4, 2.5);
    }
    return s;
  };
  const tileText = (k, x0, y, w, labels, size) => labels.map((t, i) => t === "" ? "" : k.T(x0 + i * (w + 2) + w / 2, y, size || 13, t, "middle")).join("");

  /* 题头：左边的人拿着写了秘密数字的卡片，右边的人托腮想，冒出“50？” */
  A("c01-hero", "两个人站在地上。左边的人双手拿着一张卡片，卡片上写着他想好的数；右边的人托着下巴想，头上的气泡里写着“50？”",
    k => k.ground() + k.person(58, 62, { arms: "hold", look: 1, face: "smile" }) + k.holding(58, 62, { look: 1 }, "doc") +
      k.person(146, 62, { arms: "chin", look: -1, face: "think" }) + k.bubble(108, 2, 58, 28, [142, 38]),
    k => k.T(137, 21, 15, "50？", "middle"));

  /* 开场：数字板从 1 开始一格格划掉，猜的人一脸疲惫，出题的人拿着卡片等 */
  A("c01-s1-scene", "一块挂在两根柱子上的数字板，1 到 6 已经被划掉，7 被高亮，后面是省略号和 100。板下站着两个人：左边的人托腮、表情平淡，右边的人拿着卡片等着",
    k => {
      let s = k.ground() + k.R(18, 42, 4, 84) + k.R(178, 42, 4, 84) + k.F(6, 6, 188, 38, "#fffdf3");
      s += tiles(k, 12, 12, 17, 26, 8, i => (i < 6 ? "cut" : i === 6 ? "hi" : "")) + k.F(164, 12, 26, 26, W);
      return s + k.person(62, 62, { arms: "chin", look: 1, face: "flat" }) + k.person(144, 62, { arms: "hold", look: -1, face: "smile" }) + k.holding(144, 62, { look: -1 }, "doc");
    },
    k => tileText(k, 12, 30, 17, ["", "", "", "", "", "", "7", "…"], 12) + k.T(177, 30, 12, "100", "middle"));

  /* 概念卡小图：九格里先猜中间，小了就划掉左半 */
  A("c01-cc-bs", "一排九个数字格，正中间那格高亮，箭头指着它写着“猜这格：小了”，它左边四格全被划掉，右边四格上方有括号写着“只剩这一半”",
    k => {
      let s = tiles(k, 8, 52, 18, 24, 9, i => (i < 4 ? "cut" : i === 4 ? "hi" : ""));
      s += k.L(110, 40, 190, 40, 3) + k.L(110, 40, 110, 48, 3) + k.L(190, 40, 190, 48, 3);
      s += k.arrow(97, 110, 97, 82);
      return s;
    },
    k => k.T(150, 32, 13, "只剩这一半", "middle") + k.T(97, 128, 13, "猜这格：小了", "middle"));

  /* 例子：查字典 */
  A("c01-eg-dict", "一个人站着双手捧着一本字典，气泡里写着“M 在后半本”",
    k => k.ground() + k.person(64, 62, { arms: "hold", look: 1, face: "think" }) + k.holding(64, 62, { look: 1 }, "book") + k.bubble(98, 10, 96, 30, [84, 48]),
    k => k.T(146, 31, 14, "M 在后半本", "middle"));

  /* 例子：一串灯里找坏的那颗 */
  A("c01-eg-lights", "一根电线上挂着七颗不亮的灯泡，左边四颗下面有括号标着“这半串是通的”，右半串里有一颗下面打了叉；一个人站在右边，手指着那颗坏灯",
    k => {
      let s = k.ground() + k.L(6, 40, 194, 40, 3);
      for (let i = 0; i < 7; i++) {
        const x = 6 + i * 22;
        s += k.R(x + 11, 40, 2, 6) + k.sprite(k.ICONS.bulb, x, 46, 3, { y: i === 5 ? D : "#e9e2cf", w: G });
      }
      s += k.icon("cross", 117, 74, 3);
      s += k.L(6, 76, 95, 76, 3) + k.L(6, 76, 6, 70, 3) + k.L(95, 76, 95, 70, 3);
      return s + k.person(176, 63, { arms: "point", look: -1, face: "o" });
    },
    k => k.T(50, 94, 13, "这半串是通的", "middle"));

  /* 例子：在比赛录像里找进球的那一刻 */
  A("c01-eg-video", "一个人坐在凳子上指着右边的屏幕，屏幕里的进度条停在正中间，屏幕下方写着“0:00”和“90:00”",
    k => {
      let s = k.ground() + k.F(74, 10, 120, 80, "#29366f");
      s += k.R(84, 70, 100, 6, G) + k.R(84, 70, 50, 6, Y) + k.F(128, 64, 10, 18, W);
      s += k.R(130, 90, 6, 36) + k.R(116, 120, 34, 6);
      return s + k.person(34, 62, { legs: "sit", arms: "point", look: 1, face: "think" });
    },
    k => k.T(134, 46, 18, "?", "middle", "#ffffff") + k.T(90, 104, 12, "0:00", "middle") + k.T(178, 104, 12, "90:00", "middle"));

  /* 反例：书架上的书没有排序 */
  A("c01-eg-bad", "一个书架上的书编号乱放：37、5、81、12，下层贴着“乱序”的牌子，一个人站在书架左边摊开双手，一脸为难",
    k => {
      let s = k.ground() + k.F(82, 24, 112, 102, "#c08a4b") + k.R(85, 74, 106, 4);
      const cols = ["#41a6f6", "#ef7d57", "#38b764", "#b6a4ff"];
      cols.forEach((c, i) => { s += k.F(89 + i * 25, 32 + (i % 2) * 6, 24, 42 - (i % 2) * 6, c); });
      s += k.F(108, 86, 62, 28, Y);
      return s + k.person(44, 63, { arms: "shrug", face: "sad" });
    },
    k => ["37", "5", "81", "12"].map((t, i) => k.T(101 + i * 25, 66, 12, t, "middle")).join("") + k.T(139, 105, 13, "乱序", "middle"));

  /* 概念卡小图：个数每翻一倍，台阶只高一格 */
  A("c01-cc-log", "四列像素方块像台阶一样从左到右各高一格，上面分别写着 1 步到 4 步，下面写着 2 个、4 个、8 个、16 个，中间用“×2”连起来",
    k => {
      let s = "";
      for (let c = 0; c < 4; c++) for (let r = 0; r <= c; r++) s += k.F(22 + c * 44, 78 - r * 18, 30, 18, r === c ? Y : "#a7f070");
      return s;
    },
    k => [0, 1, 2, 3].map(c => k.T(37 + c * 44, 72 - c * 18, 12, (c + 1) + " 步", "middle") + k.T(37 + c * 44, 112, 13, [2, 4, 8, 16][c] + " 个", "middle")).join("") +
      [0, 1, 2].map(c => k.T(59 + c * 44, 128, 12, "×2", "middle", "#306230")).join(""));

  /* 例子：淘汰赛 */
  A("c01-eg-cup", "一张淘汰赛对阵图：左边八支队伍两两相连，并成四支、两支，最后一支走向右边的奖杯星星；底下写着第 1 轮、第 2 轮、第 3 轮",
    k => {
      const cols = ["#41a6f6", "#ef7d57", "#38b764", "#b6a4ff", "#ffcd75", "#ff9eb0", "#73eff7", "#a7f070"];
      const ys = cols.map((c, i) => 10 + i * 14);
      let s = "";
      ys.forEach((y, i) => { s += k.F(8, y, 14, 12, cols[i]); });
      const merge = (ya, yb, x1, x2) => k.L(x1, ya, x2, ya, 3) + k.L(x1, yb, x2, yb, 3) + k.L(x2, ya, x2, yb, 3);
      const c1 = [], c2 = [];
      for (let i = 0; i < 8; i += 2) { s += merge(ys[i] + 6, ys[i + 1] + 6, 22, 52); c1.push((ys[i] + ys[i + 1]) / 2 + 6); }
      for (let i = 0; i < 4; i += 2) { s += merge(c1[i], c1[i + 1], 52, 92); c2.push((c1[i] + c1[i + 1]) / 2); }
      s += merge(c2[0], c2[1], 92, 132);
      const cy = (c2[0] + c2[1]) / 2;
      s += k.L(132, cy, 146, cy, 3) + k.icon("star", 150, cy - 16, 4);
      return s;
    },
    k => k.T(37, 134, 12, "第1轮", "middle") + k.T(72, 134, 12, "第2轮", "middle") + k.T(112, 134, 12, "第3轮", "middle"));

  /* 例子：二十个问题 */
  A("c01-eg-20q", "两个人面对面站着。左边的人托腮，气泡里问“是活的吗？”；右边的人拿着一张写了答案的卡片，气泡里答“不是”",
    k => k.ground() + k.person(52, 62, { arms: "chin", look: 1, face: "think" }) + k.bubble(6, 4, 92, 30, [56, 48]) +
      k.person(150, 62, { arms: "hold", look: -1, face: "smile" }) + k.holding(150, 62, { look: -1 }, "doc") + k.bubble(130, 2, 56, 28, [148, 38]),
    k => k.T(52, 24, 14, "是活的吗？", "middle") + k.T(158, 21, 14, "不是", "middle"));

  /* 例子：对折一张纸，层数一次翻一倍 */
  A("c01-eg-fold", "一个人站着双手拿着一张纸；右边地上四摞纸由矮到高，上面分别写着 2 层、4 层、8 层、16 层",
    k => {
      let s = k.ground() + k.person(40, 62, { arms: "hold", look: 1, face: "smile" }) + k.holding(40, 62, { look: 1 }, "doc");
      [2, 4, 8, 16].forEach((n, i) => {
        const x = 84 + i * 28, h = n * 3;
        s += k.R(x, 126 - h - 2, 22, h + 2, "#181a2e");
        for (let j = 0; j < n; j++) s += k.R(x + 2, 126 - (j + 1) * 3, 18, 2, j % 2 ? "#fffdf3" : "#e9e2cf");
      });
      return s;
    },
    k => [2, 4, 8, 16].map((n, i) => k.T(95 + i * 28, 126 - n * 3 - 8, 12, n + "层", "middle")).join(""));

  /* 反例：点名 */
  A("c01-eg-roll", "老师站在左边拿着名单，气泡里写着“第 38 号”；右边站着一排五个学生",
    k => {
      let s = k.ground() + k.person(34, 62, { arms: "hold", look: 1, face: "flat", glasses: true, tie: true }) + k.holding(34, 62, { look: 1 }, "doc") + k.bubble(56, 8, 72, 28, [46, 46]);
      for (let i = 0; i < 5; i++) s += k.person(98 + i * 24, 88, { s: 0.6, face: i === 0 ? "o" : "flat", look: -1 });
      return s;
    },
    k => k.T(92, 28, 14, "第 38 号", "middle"));

  /* 原理框小图：一个是非问题把八种可能分成两半 */
  A("c01-why-fig", "顶上一排八个格子，一个问题把它们分成两半：左边四格标“是”，右边四格标“否”，右边四格被划掉",
    k => {
      let s = tiles(k, 22, 12, 18, 20, 8);
      s += k.arrow(80, 38, 46, 70) + k.arrow(120, 38, 154, 70);
      s += tiles(k, 4, 82, 18, 20, 4) + tiles(k, 116, 82, 18, 20, 4, () => "cut");
      return s;
    },
    k => k.T(50, 52, 13, "是", "middle") + k.T(150, 52, 13, "否", "middle") + k.T(43, 124, 13, "留下 4 种", "middle") + k.T(155, 124, 13, "排除 4 种", "middle"));

  /* 第 2 节开场：先猜 50，听到“大了”，右半边整片出局 */
  A("c01-s2-half", "一条从 1 到 100 的长数字条，右半边 51 到 100 整片打了叉；条下左边拿卡片的人气泡里说“大了”，右边的人托着下巴",
    k => {
      let s = k.ground() + k.F(6, 4, 188, 24, "#fffdf3") + k.R(10, 8, 88, 16, "#a7f070") + k.R(102, 8, 88, 16, G) + k.R(98, 4, 4, 24);
      for (let i = 0; i < 4; i++) s += k.L(108 + i * 15, 10, 118 + i * 15, 22, 2.5) + k.L(118 + i * 15, 10, 108 + i * 15, 22, 2.5);
      s += k.person(48, 72, { s: 0.85, arms: "hold", look: 1, face: "flat" }) + k.holding(48, 72, { s: 0.85, look: 1 }, "doc") + k.bubble(26, 30, 44, 24, [46, 61]);
      s += k.person(156, 72, { s: 0.85, arms: "chin", look: -1, face: "smile" });
      return s;
    },
    k => k.T(18, 21, 12, "1", "middle") + k.T(54, 21, 12, "还在", "middle") + k.T(178, 21, 12, "100", "middle") + k.T(48, 46, 13, "大了", "middle"));

  /* 哲学时刻：每个问题把人群分成一半，几次之后只剩一个 */
  A("c01-philo-crowd", "左边一群十六个小人，箭头指向八个、四个，最后只剩一个被高亮的小人；下面写着 16、8、4、1",
    k => {
      const mini = (x, y, hi) => k.sprite([".kk.", "khhk", ".kk.", "kbbk", "kbbk", ".kk."], x, y, 3, { h: "#fde7c8", b: hi ? "#ffcd75" : "#41a6f6" });
      let s = "";
      for (let i = 0; i < 16; i++) s += mini(4 + (i % 4) * 13, 20 + Math.floor(i / 4) * 22, false);
      for (let i = 0; i < 8; i++) s += mini(72 + (i % 2) * 13, 20 + Math.floor(i / 2) * 22, false);
      for (let i = 0; i < 4; i++) s += mini(118 + (i % 2) * 13, 42 + Math.floor(i / 2) * 22, false);
      s += mini(170, 54, true);
      s += k.arrow(58, 60, 68, 60) + k.arrow(100, 60, 114, 60) + k.arrow(146, 64, 164, 64);
      return s;
    },
    k => k.T(28, 124, 13, "16", "middle") + k.T(85, 124, 13, "8", "middle") + k.T(131, 124, 13, "4", "middle") + k.T(176, 124, 13, "1", "middle"));

  /* 第 3 节开场：坐着翻电话簿查号码 */
  A("c01-s3-book", "一个人坐在凳子上捧着一本厚电话簿，旁边的小桌上放着一个杯子，气泡里写着“翻到 W 那几页”",
    k => k.ground() + k.person(60, 62, { legs: "sit", arms: "hold", look: 1, face: "think", glasses: true }) + k.holding(60, 62, { look: 1 }, "book") +
      k.desk(130, 98, 56) + k.item("cup", 158, 88, 3) + k.bubble(92, 6, 104, 30, [80, 46]),
    k => k.T(144, 27, 13, "翻到 W 那几页", "middle"));

  /* 发明故事：演化链四格（显示宽约 140px，图里少放字、字放大） */
  A("c01-st-1", "一个人站在一大堆乱放的纸卡前面托腮发愁",
    k => {
      let s = k.ground();
      const pos = [[100, 96], [124, 104], [150, 92], [174, 104], [112, 110], [140, 112], [166, 116], [128, 84], [156, 80]];
      pos.forEach(([x, y], i) => { s += k.F(x, y, 22, 14, i % 3 === 0 ? Y : W); });
      return s + k.person(52, 62, { arms: "chin", look: 1, face: "sad" });
    });
  A("c01-st-2", "一本竖着放的厚字典，右边缘上贴着三个索引签，分别写着 A、M、Z",
    k => k.ground() + k.F(56, 10, 80, 116, "#3b5dc9") + k.F(66, 18, 60, 100, W) + k.F(136, 18, 20, 22, Y) + k.F(136, 58, 20, 22, Y) + k.F(136, 98, 20, 22, Y),
    k => k.T(146, 35, 16, "A", "middle") + k.T(146, 75, 16, "M", "middle") + k.T(146, 115, 16, "Z", "middle"));
  A("c01-st-3", "一本从中间翻开的字典，左半边书页被打了大叉",
    k => {
      let s = k.ground() + k.F(16, 30, 84, 90, G) + k.F(100, 30, 84, 90, W) + k.R(98, 30, 4, 90);
      s += k.L(28, 42, 88, 108, 6) + k.L(88, 42, 28, 108, 6);
      for (let i = 0; i < 4; i++) s += k.R(112, 46 + i * 16, 60, 4, D);
      return s;
    });
  A("c01-st-4", "一台放在桌上的电脑，屏幕上一排从小到大的数，中间那个被高亮",
    k => {
      let s = k.desk(20, 98, 160) + k.F(40, 14, 120, 72, "#29366f") + k.R(94, 86, 12, 12);
      [0, 1, 2, 3, 4].forEach(i => { s += k.F(48 + i * 22, 38, 20, 22, i === 2 ? Y : W); });
      return s;
    },
    k => ["3", "8", "15", "21", "42"].map((t, i) => k.T(58 + i * 22, 54, 12, t, "middle")).join(""));

  /* 反思：先排序要花力气 */
  A("c01-reflect", "一个人坐在凳子上，伏在桌前把一张张写着数字的卡片按大小排好",
    k => {
      let s = k.ground() + k.desk(96, 98, 98);
      [W, W, W, Y].forEach((c, i) => { s += k.F(104 + i * 22, 78, 20, 20, c); });
      return s + k.person(64, 62, { legs: "sit", arms: "desk", look: 1, face: "think" });
    },
    k => ["3", "9", "14", "27"].map((t, i) => k.T(114 + i * 22, 93, 12, t, "middle")).join(""));

  /* 哲学时刻：麻雀很像鸟，企鹅没那么像 */
  A("c01-philo-bird", "地上左边站着一只小麻雀，头上标着“很像鸟”；右边站着一只企鹅，头上标着“没那么像”",
    k => {
      const sparrow = [".....kkk..", "....kccckyy", "....kckcck.", "kkkkkcccck.", "kcccccccck.", ".kcwwwwck..", "..kkkkkk...", "...k..k...."];
      const penguin = ["..kkkk..", ".kkkkkk.", ".kkwwkk.", ".kwkwwk.", "kkwwyywk", "kkwwwwkk", "kkwwwwkk", "kkwwwwkk", "kkwwwwkk", ".kwwwwk.", "..kkkk..", ".yy..yy."];
      return k.ground() + k.sprite(sparrow, 30, 94, 4) + k.sprite(penguin, 128, 78, 4);
    },
    k => k.T(50, 80, 13, "很像鸟", "middle") + k.T(144, 66, 13, "没那么像", "middle"));

  /* 哲学时刻：分不清是“是”还是“否”的东西 */
  A("c01-philo", "两个人站着，中间悬着一个大问号；左边的人举手说“是”，右边的人摊开双手说“说不清”",
    k => k.ground() + k.person(44, 63, { arms: "up", face: "grin" }) + k.person(156, 63, { arms: "shrug", look: -1, face: "flat" }) +
      k.bubble(14, 2, 52, 26, [40, 40]) + k.bubble(116, 2, 78, 26, [146, 36]),
    k => k.T(40, 20, 14, "是", "middle") + k.T(155, 20, 14, "说不清", "middle") + k.T(100, 80, 34, "?", "middle"));
})();
