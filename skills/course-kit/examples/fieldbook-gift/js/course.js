/* 课程配置（起步模板）。new-course.mjs 把它复制成 课程/js/course.js；章节页在 </main> 之后、kit/vl.js 之前加载它。
   vl.js 读 window.VL_COURSE 的这几项：id、home、enReady、enDir、topbar、chapters（zh / en / file / open）、parts（zh / en / from / to）。
   其余字段（title、desc、color、paths、modules）vl.js 不读，是目录页和本文件自己用的，下面逐个注明。API 的唯一权威说明在 kit/README.md 第二节。 */
(function () {
  /* ---------- 章节表 CH：第 n 章 = 第 n 项 ----------
     zh 中文章名；en 英文章名（英文版做完前也先写上，顶栏弹层和英文页用）；file 两位编号 + 英文短横线（content-rules.md 第五节）；
     desc 目录页卡片上的一句话（vl.js 不读，≤30 字，写处境或问题，不写定义）。 */
  const CH = [
    { zh: "礼物与回礼", en: "Gifts and Return Gifts", file: "ch01-gift.html", desc: "邻居送来一盒月饼，为什么反倒让人坐立不安？" },
  ];

  /* ---------- 开放章 OPEN：写完、验收过的章号。不在这里的章 = open:false（顶栏、目录页、翻页处都不给链接，翻页写“第 N 章还在写”） ---------- */
  const OPEN = [1];

  /* ---------- 篇章 PARTS ----------
     from / to 章号闭区间。vl.js 按篇的顺序写 body[data-part="1…"]，皮肤按这个序号取篇章主色（notebook 有 5 套：黄 蓝 绿 粉 紫）。
     color（可选，vl.js 不读）：想让某一篇用别的主色时写皮肤的主色序号；本文件会注入一小段样式，把这一篇重新映射到那套颜色。
     这段映射用的是 notebook 的变量名 --p{n}a / --p{n}b / --p{n}p / --p{n}l；换皮肤时看 skin/README.md 的篇章变量。
     desc 目录页篇名下的一句话（vl.js 不读）。 */
  const PARTS = [
    { zh: "一、人情与交换", en: "I. Gifts and Exchange", from: 1, to: 1, desc: "东西在人与人之间怎么流动，又把人连在一起。" },
  ];

  /* ---------- 学习路径（目录页用，vl.js 不读）：没有就留空数组，目录页不显示这一块 ----------
     每条 = 名字 + 适合谁 + 章号；做之前查一遍：路线上每章用到的概念，路线前面都讲过。见 references/modules.md 第六节。 */
  const PATHS = [
    // { name: "一周入门", who: "只想快速上手的人", chs: [1, 2] },
  ];

  /* ---------- 可选模块开关（vl.js 不读，kit/modules/ 里的模块读；加载哪些文件、放在哪见 kit/README.md 第八节） ----------
     开课时逐项决定，写进 项目规则与经验.md 第五节。 */
  const MODULES = {
    sound: false,          // modules/sound.js 读：false = 整个模块不出现；不写或 true = 顶栏有喇叭开关，读者打开前一直静音
    related: true,         // modules/vl-concepts.js 读：章末“相关章节”（要有 js/concepts.js 概念数据）；false = 不生成
    relatedFuture: false,   // modules/vl-concepts.js 读：相关章节里列不列后面的章；false = 只列前面的章
    // 下面三项代码暂不读（字段名以 kit/README.md 第八节 为准），先记下开课时的决定
    reward: false,         // 阅读激励：只奖励“读懂了”（试试看完成、测验全对），外观随皮肤
    buddy: false,          // 陪伴角色：点了才说话，台词随当前节，可关
    graph: false,          // 概念关系图 map.html（modules/graph.js）
  };

  window.VL_COURSE = {
    id: "fieldbook-gift",            // 存档前缀（只用英文小写和短横线）：<id>-progress、<id>-try、<id>-note-…、<id>-side-…。课程上线后不要再改，改了读者的进度和笔记就找不到了
    title: "礼物的人类学",            // 目录页大标题（vl.js 不读）
    home: "index.html",
    enReady: false,            // 英文版全部做完才改 true，顶栏才显示语言按钮（content-rules.md 第六节）
    enDir: "en/",
    topbar: true,
    chapters: CH.map((c, i) => Object.assign({}, c, { open: OPEN.indexOf(i + 1) >= 0 })),
    parts: PARTS,
    paths: PATHS,
    modules: MODULES,
  };

  // 目录页自己的界面文字（ix.*）的英文；课程要覆盖 kit 的界面文字也写在这里（键见 kit/vl.js 的 EN 表）
  window.VL_I18N = Object.assign({ zh: {}, en: {} }, window.VL_I18N);
  Object.assign(window.VL_I18N.en, {
    "ix.badge": "Interactive course · {0} chapters", "ix.prog": "Understood {0} of {1} chapters", "ix.next": "Continue: ",
    "ix.wip": "Still being written", "ix.done": "Understood", "ix.nch": "{0} chapters",
  });

  // 篇章换色（只在 PARTS 里写了 color 时生效）：把第 i 篇的主色变量指到第 color 套
  const remap = PARTS.map((p, i) => (p.color && p.color !== i + 1 ?
    'body[data-part="' + (i + 1) + '"],[data-part="' + (i + 1) + '"]{--pa:var(--p' + p.color + "a);--pb:var(--p" + p.color + "b);--pp:var(--p" + p.color + "p);--pl:var(--p" + p.color + "l)}" : "")).join("");
  if (remap) { const s = document.createElement("style"); s.textContent = remap; document.head.appendChild(s); }
})();
