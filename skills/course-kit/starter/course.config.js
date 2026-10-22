/* 课程配置（起步模板）。new-course.mjs 把它复制成 课程/js/course.js；章节页在 </main> 之后、kit/vl.js 之前加载它。
   vl.js 读 window.VL_COURSE 的这几项：id、home、enReady、enDir、topbar、chapters（zh / en / file / open）、parts（zh / en / from / to）。
   其余字段（title、desc、color、paths、modules）vl.js 不读，是目录页和本文件自己用的，下面逐个注明。API 的唯一权威说明在 kit/README.md 第二节。 */
(function () {
  /* ---------- 章节表 CH：第 n 章 = 第 n 项 ----------
     zh 中文章名；en 英文章名（英文版做完前也先写上，顶栏弹层和英文页用）；file 两位编号 + 英文短横线（content-rules.md 第五节）；
     desc 目录页卡片上的一句话（vl.js 不读，≤30 字，写处境或问题，不写定义）。 */
  const CH = [
    { zh: "第一章的名字", en: "Chapter One", file: "ch01-intro.html", desc: "从一个读者熟悉的处境说起。" },
    { zh: "第二章的名字", en: "Chapter Two", file: "ch02-next.html", desc: "还在写的章也先列上。" },
    { zh: "第三章的名字", en: "Chapter Three", file: "ch03-more.html", desc: "目录页显示“还在写”，不给链接。" },
  ];

  /* ---------- 开放章 OPEN：写完、验收过的章号。不在这里的章 = open:false（顶栏、目录页、翻页处都不给链接，翻页写“第 N 章还在写”） ---------- */
  const OPEN = [1];

  /* ---------- 篇章 PARTS ----------
     from / to 章号闭区间。vl.js 按篇的顺序写 body[data-part="1…"]，皮肤按这个序号取篇章主色（notebook 有 5 套：黄 蓝 绿 粉 紫）。
     color（可选，vl.js 不读）：想让某一篇用别的主色时写皮肤的主色序号；本文件会注入一小段样式，把这一篇重新映射到那套颜色。
     这段映射用的是 notebook 的变量名 --p{n}a / --p{n}b / --p{n}p / --p{n}l；换皮肤时看 skin/README.md 的篇章变量。
     desc 目录页篇名下的一句话（vl.js 不读）。 */
  const PARTS = [
    { zh: "一、第一篇", en: "I. Part One", from: 1, to: 2, desc: "这一篇讲什么，一句话。" },
    { zh: "二、第二篇", en: "II. Part Two", from: 3, to: 3, desc: "这一篇讲什么，一句话。" /*, color: 4 */ },
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
    collect: false,        // modules/collect.js 读：阅读激励（集邮册等）；false = 不出现。注意：不写这一项时默认是开的
    companion: false,      // modules/companion.js 读：陪伴角色；不写或 false = 不出现，要加时写配置对象（见 kit/README.md 第八节）
    graph: false,          // 代码不读，只记下决定：概念关系图 map.html（modules/graph.js）要不要做
  };

  window.VL_COURSE = {
    id: "mycourse",            // 存档前缀（只用英文小写和短横线）：<id>-progress、<id>-try、<id>-note-…、<id>-side-…。课程上线后不要再改，改了读者的进度和笔记就找不到了
    title: "课程名",            // 目录页大标题（vl.js 不读）
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
    'body[data-part="' + (i + 1) + '"],[data-part="' + (i + 1) + '"]{' + ["a", "b", "p", "l", "d", "s"].map(k => "--p" + k + ":var(--p" + p.color + k + ")").join(";") + "}" : "")).join("");
  if (remap) { const s = document.createElement("style"); s.textContent = remap; document.head.appendChild(s); }
})();
