/* 演示小课的插图包：每个概念一张小图（概念卡、图鉴、邮票共用），另有章首图和陪伴角色"小格"。放在 illus.js 之后。 */
(function () {
  const A = (n, alt, b, e) => VL.illus.add(n, alt, b, e);
  const Y = "#ffe58a", B = "#a8dcf0", P = "#ffb3c6", G = "#b6e8a8", O = "#ffc078", U = "#d8c8ff", W = "#fffdf3";

  // ---------- 概念图 ----------
  A("demo-cc-curve", "一条从左上急降、再慢慢变平的曲线，旁边站着一个人看着它", k =>
    '<path d="M22 18 V112 H130" fill="none" stroke-width="3"/>' +
    '<path d="M26 26 C40 70 56 86 80 94 S118 102 128 103" fill="none" stroke="#e5484d" stroke-width="5"/>' +
    '<circle cx="26" cy="26" r="5" fill="' + Y + '"/><circle cx="58" cy="85" r="5" fill="' + Y + '"/><circle cx="104" cy="100" r="5" fill="' + Y + '"/>' +
    k.ground() + k.person(162, 62, { arms: "point", look: -1, face: "o" }));
  A("demo-cc-encode", "一个人捧着一本书，箭头指向一个装卡片的抽屉", k =>
    k.ground() + k.person(48, 62, { arms: "hold", look: 1 }) + k.holding(48, 62, { look: 1 }, "book") +
    k.arrow(86, 64, 116, 64) +
    '<rect x="124" y="70" width="58" height="56" rx="4" fill="' + O + '"/><path d="M124 92 H182 M124 108 H182" fill="none" stroke-width="2.5"/>' +
    '<rect x="132" y="50" width="16" height="22" fill="' + W + '" stroke-width="2.5"/><rect x="154" y="46" width="16" height="26" fill="' + B + '" stroke-width="2.5"/>');
  A("demo-cc-wm", "一块小白板上只贴得下三张便签，第四张掉在地上，一个人指着白板", k =>
    '<rect x="88" y="18" width="96" height="66" rx="4" fill="' + W + '"/><path d="M136 84 V126" fill="none" stroke-width="3"/>' +
    '<rect x="96" y="28" width="24" height="22" fill="' + Y + '" stroke-width="2.5"/><rect x="126" y="28" width="24" height="22" fill="' + P + '" stroke-width="2.5"/><rect x="156" y="28" width="22" height="22" fill="' + G + '" stroke-width="2.5"/>' +
    '<rect x="160" y="112" width="22" height="14" fill="' + B + '" stroke-width="2.5" transform="rotate(-12 171 119)"/>' +
    k.ground() + k.person(46, 62, { arms: "point", look: 1 }));
  A("demo-cc-recall", "一个人坐着，书合在桌上，头顶冒出一个装着星星的念头", k =>
    k.ground() + '<path d="M104 92 H176 M120 92 V126 M164 92 V126" fill="none" stroke-width="3"/>' +
    '<rect x="128" y="80" width="30" height="12" fill="' + Y + '"/>' +
    k.person(74, 62, { legs: "sit", arms: "chin", look: 1, face: "flat" }) +
    '<circle cx="104" cy="44" r="4" fill="' + W + '"/><circle cx="114" cy="32" r="6" fill="' + W + '"/>' +
    '<ellipse cx="146" cy="24" rx="26" ry="17" fill="' + W + '"/>' + k.item("star", 146, 25));
  A("demo-cc-test", "一张小测卷上三个勾一个叉，一个人举着笔", k =>
    '<rect x="100" y="16" width="78" height="100" rx="3" fill="' + W + '"/>' +
    '<path d="M110 34 l5 6 9 -12 M110 58 l5 6 9 -12 M110 82 l5 6 9 -12" fill="none" stroke="#2f9e44" stroke-width="3.5"/>' +
    '<path d="M132 34 H168 M132 58 H168 M132 82 H168 M110 102 l10 10 M120 102 l-10 10 M132 106 H168" fill="none" stroke-width="2.5"/>' +
    k.ground() + k.person(46, 62, { arms: "wave", look: 1, face: "grin" }) + '<path d="M65 43 l10 -18" stroke-width="4" stroke="' + O + '"/>');
  A("demo-cc-fluency", "一个人捧着书读得很开心，头顶的对勾是虚线画的", k =>
    k.ground() + k.person(70, 62, { arms: "hold", look: 1, face: "smile" }) + k.holding(70, 62, { look: 1 }, "book") +
    '<circle cx="146" cy="40" r="26" fill="' + W + '" stroke-dasharray="6 5"/><path d="M134 40 l9 9 16 -18" fill="none" stroke-width="4" stroke-dasharray="5 4"/>');
  A("demo-cc-spacing", "一张日历，隔开的三天各画了一个圈", k =>
    '<rect x="24" y="22" width="152" height="100" rx="6" fill="' + W + '"/><rect x="24" y="22" width="152" height="20" rx="6" fill="' + P + '"/>' +
    '<path d="M24 62 H176 M24 82 H176 M24 102 H176 M62 42 V122 M100 42 V122 M138 42 V122" fill="none" stroke-width="2"/>' +
    '<circle cx="43" cy="52" r="8" fill="none" stroke="#e5484d" stroke-width="3.5"/><circle cx="119" cy="72" r="8" fill="none" stroke="#e5484d" stroke-width="3.5"/><circle cx="81" cy="112" r="8" fill="none" stroke="#e5484d" stroke-width="3.5"/>');
  A("demo-cc-leitner", "四个由小到大的盒子排成一排，一张卡片从第一个盒子往后挪", k =>
    '<rect x="14" y="88" width="34" height="34" fill="' + Y + '"/><rect x="58" y="80" width="38" height="42" fill="' + B + '"/><rect x="106" y="72" width="40" height="50" fill="' + G + '"/><rect x="156" y="64" width="34" height="58" fill="' + U + '"/>' +
    '<rect x="22" y="72" width="18" height="22" fill="' + W + '" stroke-width="2.5"/><rect x="117" y="56" width="18" height="22" fill="' + W + '" stroke-width="2.5"/>' +
    '<path d="M36 64 Q76 22 120 50" fill="none" stroke-width="3" stroke-dasharray="6 5"/>' + k.arrow(112, 44, 122, 52));
  A("demo-cc-mix", "圆、三角、方块三种形状交替排成两行", k => {
    const sh = [(x, y) => '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + Y + '"/>', (x, y) => '<path d="M' + x + " " + (y - 15) + " l15 26 h-30z" + '" fill="' + P + '"/>', (x, y) => '<rect x="' + (x - 13) + '" y="' + (y - 13) + '" width="26" height="26" fill="' + B + '"/>'];
    let s = ""; [0, 1, 2, 0, 1].forEach((t, i) => (s += sh[t](30 + i * 35, 44))); [2, 0, 1, 2, 0].forEach((t, i) => (s += sh[t](30 + i * 35, 98)));
    return s;
  });
  A("demo-cc-hill", "一个人沿着上坡往上走，坡顶插着一面小旗", k =>
    '<path d="M6 126 L150 40 L194 40" fill="none" stroke-width="3.5"/><path d="M168 40 V12 l20 7 -20 7" fill="' + Y + '" stroke-width="3"/>' +
    k.person(72, 46, { legs: "walk", look: 1, face: "flat" }));

  A("demo-c3-desk", "一个人坐在桌前，把一张卡片放进桌上一排盒子里", k =>
    k.ground() + '<path d="M86 92 H190 M96 92 V126 M180 92 V126" fill="none" stroke-width="3"/>' +
    '<rect x="112" y="72" width="16" height="20" fill="' + Y + '"/><rect x="132" y="68" width="18" height="24" fill="' + B + '"/><rect x="154" y="64" width="20" height="28" fill="' + G + '"/>' +
    k.person(62, 62, { legs: "sit", arms: "point", look: 1, face: "smile" }) + '<rect x="90" y="48" width="14" height="10" fill="' + W + '" stroke-width="2.5"/>');

  // ---------- 章首图 ----------
  A("demo-h1", "一个人坐着看书，书页上方的字一个个变淡飘走", k =>
    k.ground() + k.person(70, 62, { legs: "sit", arms: "hold", look: 1 }) + k.holding(70, 62, { look: 1 }, "book") +
    '<rect x="112" y="40" width="16" height="10" fill="#2b2b3a" stroke="none" opacity=".75"/><rect x="138" y="28" width="16" height="10" fill="#2b2b3a" stroke="none" opacity=".45"/><rect x="164" y="16" width="16" height="10" fill="#2b2b3a" stroke="none" opacity=".2"/>');
  A("demo-h2", "两个人面对面，一个举着卡片考另一个", k =>
    k.ground() + k.person(56, 62, { arms: "chin", look: 1, face: "flat" }) + k.person(146, 62, { arms: "hold", look: -1, face: "grin" }) + k.holding(146, 62, { look: -1 }, "book") +
    '<circle cx="62" cy="22" r="10" fill="' + W + '"/><path d="M58 18 q4 -6 8 0 q0 4 -4 6 v2" fill="none" stroke-width="2.5"/>');
  A("demo-h3", "一个人朝挂着的日历走去，日历上隔天画着圈", k =>
    k.ground() + k.person(52, 62, { legs: "walk", look: 1 }) +
    '<rect x="112" y="24" width="72" height="62" rx="4" fill="' + W + '"/><rect x="112" y="24" width="72" height="14" rx="4" fill="' + G + '"/>' +
    '<path d="M112 58 H184 M136 38 V86 M160 38 V86" fill="none" stroke-width="2"/><circle cx="124" cy="48" r="5" fill="none" stroke="#e5484d" stroke-width="3"/><circle cx="172" cy="72" r="5" fill="none" stroke="#e5484d" stroke-width="3"/>');
  A("demo-home", "一个人站在一摞书旁边挥手", k =>
    k.ground() + '<rect x="112" y="106" width="64" height="20" fill="' + B + '"/><rect x="118" y="86" width="56" height="20" fill="' + Y + '"/><rect x="114" y="66" width="60" height="20" fill="' + P + '"/>' +
    k.person(62, 62, { arms: "wave", look: 1, face: "grin" }));

  // ---------- 陪伴角色"小格"：一个方格本小人 ----------
  A("demo-buddy", "小格：一个长着脸和手脚的方格本小人", k =>
    '<path d="M86 118 L80 134 M114 118 L120 134" fill="none" stroke-width="4"/><path d="M62 74 L44 90 M138 74 L156 64" fill="none" stroke-width="4"/>' +
    '<rect x="60" y="22" width="80" height="98" rx="10" fill="' + Y + '"/>' +
    '<path d="M60 46 H140 M60 70 H140 M60 94 H140 M86 22 V120 M112 22 V120" fill="none" stroke="#c9a94a" stroke-width="2"/>' +
    '<circle cx="86" cy="58" r="5" fill="#2b2b3a" stroke="none"/><circle cx="114" cy="58" r="5" fill="#2b2b3a" stroke="none"/>' +
    '<path d="M88 78 q12 10 24 0" fill="none" stroke-width="3.5"/>');
})();
