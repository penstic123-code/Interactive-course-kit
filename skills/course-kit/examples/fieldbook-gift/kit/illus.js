/* course-kit · illus.js —— 插画装载器 + 火柴人 / 物件绘制工具（接口与皮肤无关）。放在 vl.js 之后、各章插图包之前。
   写法：<span data-illus="名字"></span>，页面脚本跑完后自动换成插图库里的内联 SVG（viewBox 200×140）。缺图不报错，显示占位。
   画法（线宽、抖动滤镜、配色）由皮肤给：window.VL_SKIN.palette 覆盖下面的默认色，CSS 变量 --il-filter 决定加不加手绘抖动。
   暗色 / 护眼配色下插画放在浅色图板（--plate）上，内部颜色不变，所以这里的颜色是固定值，不随配色切换。
   内置规则（抽自游戏设计课 js/illus.js）：
   - 坐姿 legs:"sit" 自动配一把椅子（座面、靠背、椅腿），人不会悬在半空；传 chair:false 关掉（比如坐在画好的沙发上）。
   - 朝左看（look < 0）时手臂、腿自动镜像；也可以用 flip:true / false 强制。
   - 同一张图里第 k 个人自动换装：无 → 鸭舌帽 → 长发 → 毛线帽 → 礼帽，靠服饰区分人物，不只靠颜色；作者指定的项（hat/hair/glasses 等）保留，其余仍按顺序补上，outfit:false 关闭。
   - 拿东西用 kit.hands(x, y, opts) 取两只手的坐标，把物件画在两手之间，手才是真的握住。
   - 文字（T、气泡里的字）放在 extra 里，在滤镜组外面，保持清晰。 */
(function () {
  "use strict";
  const VL = window.VL = window.VL || {};
  const SK = window.VL_SKIN || {};
  const C = Object.assign({
    ink: "#2b2b3a", skin: "#fffbea", paper: "#fffdf3", white: "#ffffff", grey: "#cfd3dc", dark: "#3b3f4f",
    yellow: "#ffe58a", pink: "#ffb3c6", blue: "#a8dcf0", green: "#b6e8a8", orange: "#ffc078", purple: "#d8c8ff",
    red: "#e5484d", gold: "#ffd34d", wood: "#c98f5a", cap: "#ff8fab", beanie: "#5b8def", wizard: "#8f6cf5",
  }, SK.palette || {});
  const f = n => Math.round(n * 10) / 10;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 火柴人：x,y 为头部中心；s 比例；arms / legs 姿势名；face 表情；附件 hat、hair、glasses、beard、tie、cape、shirt ---------- */
  const ARMS = {
    stand: [[[-12, 8], [-15, 21]], [[12, 8], [15, 21]]],
    none: [],
    up: [[[-12, -4], [-17, -19]], [[12, -4], [17, -19]]],
    cover: [[[-14, -2], [-4, -16]], [[14, -2], [4, -16]]],
    point: [[[-12, 8], [-15, 21]], [[14, 0], [31, -5]]],
    hold: [[[-9, 10], [8, 12]], [[9, 10], [24, 10]]],
    wave: [[[-12, 8], [-15, 21]], [[13, -2], [19, -17]]],
    chin: [[[-12, 8], [-15, 21]], [[10, 6], [3, -7]]],
    throw: [[[-12, 8], [-15, 21]], [[12, -6], [28, -20]]],
    club: [[[-3, 10], [6, 21]], [[4, 10], [12, 19]]],
    desk: [[[-8, 12], [14, 24]], [[8, 12], [26, 24]]],
  };
  const LEGS = {
    stand: [[[-8, 27]], [[8, 27]]],
    run: [[[-13, 12], [-21, 25]], [[11, 11], [9, 27]]],
    walk: [[[-6, 13], [-10, 27]], [[8, 13], [14, 24]]],
    sit: [[[17, 1], [17, 22]], [[12, 6], [12, 26]]],
    wide: [[[-15, 27]], [[15, 27]]],
    none: [],
  };
  const STYLES = [{}, { hat: "cap" }, { hair: true }, { hat: "beanie" }, { hat: "tophat" }];
  let personK = 0;
  const geo = (x, y, o) => {
    const s = o.s || 1, hr = 11 * s;
    const fl = (o.flip !== undefined ? o.flip : (o.look || 0) < 0) ? -1 : 1;
    return { s, hr, fl, sy: y + hr + 4 * s, hip: y + hr + 26 * s };
  };
  // 两只手（手臂末端）的坐标：把物件画在这里，手才是真的握住东西
  function hands(x, y, o) {
    o = o || {}; const g = geo(x, y, o);
    return (ARMS[o.arms || "stand"] || []).map(a => { const p = a[a.length - 1]; return [f(x + p[0] * g.s * g.fl), f(g.sy + p[1] * g.s)]; });
  }
  // 脚底的 y：站着的人脚要落在这条线上（kit.ground 默认 126）
  function feetY(x, y, o) { o = o || {}; const g = geo(x, y, o); const L = LEGS[o.legs || "stand"] || []; return L.length ? Math.max(...L.map(l => g.hip + l[l.length - 1][1] * g.s)) : g.hip; }
  function person(x, y, o) {
    o = Object.assign({}, o || {});
    if (o.outfit !== false) {
      const st = STYLES[personK % STYLES.length]; personK++;
      // 作者指定的项保留，其余照这一套补上；指定了发型就不再戴帽，指定了帽子就不再补长发（免得互相盖住）
      const headSet = o.hat !== undefined || o.hair !== undefined;
      ["hat", "hair", "glasses"].forEach(k => { if (st[k] !== undefined && o[k] === undefined && !((k === "hat" || k === "hair") && headSet)) o[k] = st[k]; });
    }
    const { s, hr, fl, sy, hip } = geo(x, y, o), look = (o.look || 0) * 2 * s, INK = C.ink;
    const poly = (ox, oy, pts) => "M" + f(ox) + " " + f(oy) + pts.map(p => " L" + f(ox + p[0] * s * fl) + " " + f(oy + p[1] * s)).join("");
    let g = '<g fill="none">';
    if (o.shirt) g += '<path fill="' + o.shirt + '" stroke-width="2.2" d="M' + f(x - 8 * s) + " " + f(sy - s) + " L" + f(x + 8 * s) + " " + f(sy - s) + " L" + f(x + 7 * s) + " " + f(sy + 16 * s) + " L" + f(x - 7 * s) + " " + f(sy + 16 * s) + ' Z"/>';
    if (o.legs === "sit" && o.chair !== false) {   // 坐姿自带椅子
      const seat = hip + 3 * s, back = x - 13 * s * fl, front = x + 9 * s * fl, floor = o.floor || 126;
      g += '<path stroke-width="3" d="M' + f(front) + " " + f(seat) + " H" + f(back) + " V" + f(seat - 24 * s) + '"/>';
      if (seat < floor - 6) g += '<path stroke-width="3" d="M' + f(back + 2 * s * fl) + " " + f(seat) + " V" + floor + " M" + f(front - 2 * s * fl) + " " + f(seat) + " V" + floor + '"/>';
    }
    g += '<path d="M' + f(x) + " " + f(y + hr) + " L" + f(x) + " " + f(hip) + '"/>';
    (ARMS[o.arms || "stand"] || []).forEach(a => (g += '<path d="' + poly(x, sy, a) + '"/>'));
    (LEGS[o.legs || "stand"] || []).forEach(l => (g += '<path d="' + poly(x, hip, l) + '"/>'));
    g += "</g>";
    if (o.cape) g += '<path fill="' + C.red + '" stroke-width="2.5" d="M' + f(x - 2 * s) + " " + f(sy) + " q" + f(-18 * s * fl) + " " + f(16 * s) + " " + f(-12 * s * fl) + " " + f(40 * s) + " l" + f(18 * s * fl) + " " + f(-6 * s) + 'z"/>';
    g += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(hr) + '" fill="' + (o.skin || C.skin) + '"/>';
    const ex = 4 * s, ey = y - 2 * s, fc = o.face || "smile";
    if (fc === "closed") g += '<path fill="none" stroke-width="2.4" d="M' + f(x - ex - 2 * s + look) + " " + f(ey) + " h" + f(4 * s) + " M" + f(x + ex - 2 * s + look) + " " + f(ey) + " h" + f(4 * s) + '"/>';
    else { const r = (fc === "shout" || fc === "wide" ? 2.4 : 1.8) * s; g += '<circle cx="' + f(x - ex + look) + '" cy="' + f(ey) + '" r="' + f(r) + '" fill="' + INK + '" stroke="none"/><circle cx="' + f(x + ex + look) + '" cy="' + f(ey) + '" r="' + f(r) + '" fill="' + INK + '" stroke="none"/>'; }
    const mx = x + look, my = y + 4.5 * s;
    if (fc === "smile") g += '<path fill="none" stroke-width="2.4" d="M' + f(mx - 4 * s) + " " + f(my) + " q" + f(4 * s) + " " + f(4.5 * s) + " " + f(8 * s) + ' 0"/>';
    else if (fc === "grin") g += '<path fill="#fff" stroke-width="2.2" d="M' + f(mx - 5 * s) + " " + f(my) + " q" + f(5 * s) + " " + f(7 * s) + " " + f(10 * s) + ' 0z"/>';
    else if (fc === "sad") g += '<path fill="none" stroke-width="2.4" d="M' + f(mx - 4 * s) + " " + f(my + 3 * s) + " q" + f(4 * s) + " " + f(-4.5 * s) + " " + f(8 * s) + ' 0"/>';
    else if (fc === "flat") g += '<path fill="none" stroke-width="2.4" d="M' + f(mx - 3.5 * s) + " " + f(my + 1.5 * s) + " h" + f(7 * s) + '"/>';
    else if (fc === "shout" || fc === "o" || fc === "wide") g += '<ellipse cx="' + f(mx) + '" cy="' + f(my + 2.5 * s) + '" rx="' + f(3 * s) + '" ry="' + f(fc === "shout" ? 4 * s : 3 * s) + '" fill="' + INK + '" stroke="none"/>';
    // 眼镜画成大圈，眼睛在圈里看得见
    if (o.glasses) g += '<g fill="none" stroke-width="1.5"><circle cx="' + f(x - ex + look) + '" cy="' + f(ey) + '" r="' + f(3.6 * s) + '"/><circle cx="' + f(x + ex + look) + '" cy="' + f(ey) + '" r="' + f(3.6 * s) + '"/><path d="M' + f(x - ex + 3.6 * s + look) + " " + f(ey) + " H" + f(x + ex - 3.6 * s + look) + '"/></g>';
    if (o.beard) g += '<path fill="' + INK + '" stroke="none" d="M' + f(x - 9 * s) + " " + f(y + 7 * s) + " q" + f(9 * s) + " " + f(18 * s) + " " + f(18 * s) + ' 0 q' + f(-9 * s) + " " + f(-6 * s) + " " + f(-18 * s) + ' 0z"/>';
    if (o.hair) g += '<path fill="' + INK + '" stroke="none" d="M' + f(x - hr) + " " + f(y - 2 * s) + " q" + f(hr) + " " + f(-hr * 1.9) + " " + f(2 * hr) + ' 0 q' + f(-hr) + " " + f(-hr * 0.7) + " " + f(-2 * hr) + ' 0z"/>';
    if (o.hat === "cap") g += '<path fill="' + C.cap + '" d="M' + f(x - hr) + " " + f(y - 6 * s) + " q" + f(hr) + " " + f(-hr * 1.7) + " " + f(2 * hr) + ' 0z"/><path fill="none" d="M' + f(x) + " " + f(y - 6 * s) + " h" + f((hr + 8 * s) * fl) + '"/>';
    if (o.hat === "crown") g += '<path fill="' + C.gold + '" d="M' + f(x - 9 * s) + " " + f(y - 9 * s) + " l" + f(2 * s) + " " + f(-12 * s) + " l" + f(5 * s) + " " + f(7 * s) + " l" + f(2 * s) + " " + f(-10 * s) + " l" + f(2 * s) + " " + f(10 * s) + " l" + f(5 * s) + " " + f(-7 * s) + " l" + f(2 * s) + " " + f(12 * s) + 'z"/>';
    if (o.hat === "beanie") g += '<path fill="' + C.beanie + '" d="M' + f(x - hr) + " " + f(y - 6 * s) + " q" + f(hr) + " " + f(-hr * 1.7) + " " + f(2 * hr) + ' 0z"/><circle cx="' + f(x) + '" cy="' + f(y - 6 * s - hr * 0.85 - 3 * s) + '" r="' + f(3.2 * s) + '" fill="#fff" stroke-width="2"/>';
    if (o.hat === "tophat") g += '<path fill="' + C.dark + '" stroke-width="2.4" d="M' + f(x - 7 * s) + " " + f(y - hr + s) + " V" + f(y - hr - 14 * s) + " H" + f(x + 7 * s) + " V" + f(y - hr + s) + ' Z"/><path fill="none" stroke-width="3" d="M' + f(x - 11 * s) + " " + f(y - hr + s) + " H" + f(x + 11 * s) + '"/>';
    if (o.hat === "wizard") g += '<path fill="' + C.wizard + '" d="M' + f(x - 11 * s) + " " + f(y - 7 * s) + " L" + f(x + 2 * s) + " " + f(y - 34 * s) + " L" + f(x + 11 * s) + " " + f(y - 7 * s) + 'z"/><path d="M' + f(x - 14 * s) + " " + f(y - 7 * s) + " h" + f(28 * s) + '"/>';
    if (o.tie) g += '<path fill="' + C.red + '" stroke-width="2" d="M' + f(x) + " " + f(y + hr + s) + " l" + f(-3 * s) + " " + f(6 * s) + " l" + f(3 * s) + " " + f(10 * s) + " l" + f(3 * s) + " " + f(-10 * s) + 'z"/>';
    return '<g class="px-person">' + g + "</g>";   // 外包一层：tools/illus-overlap.mjs 靠 g.px-person 找人物
  }

  /* ---------- 其他小工具 ---------- */
  const ground = (y) => '<path d="M6 ' + (y || 126) + ' H194" stroke-dasharray="2 7" stroke-width="3"/>';
  // 文字：放进 extra（滤镜组外）；字号 ≥ 12
  const T = (x, y, size, txt, anchor) => '<text x="' + x + '" y="' + y + '" font-size="' + Math.max(12, size) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ' fill="' + C.ink + '" stroke="none">' + esc(txt) + "</text>";
  const eye = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="1.8" fill="' + C.ink + '" stroke="none"/>';
  // 对话气泡：圆角框 + 指向说话人的尾巴（tail 是尾尖坐标）。字另用 T 写在 extra 里，别让字压到人物
  function bubble(x, y, w, h, tail, fill) {
    let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + (fill || C.white) + '"/>';
    if (tail) { const bx = clampN(tail[0], x + 14, x + w - 14), by = tail[1] > y + h ? y + h : y; s += '<path d="M' + f(bx - 7) + " " + by + " L" + f(tail[0]) + " " + f(tail[1]) + " L" + f(bx + 7) + " " + by + '" fill="' + (fill || C.white) + '"/>'; }
    return s;
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const arrow = (x1, y1, x2, y2) => { const a = Math.atan2(y2 - y1, x2 - x1), k = 9; return '<path fill="none" d="M' + x1 + " " + y1 + " L" + x2 + " " + y2 + " M" + f(x2 - k * Math.cos(a - 0.5)) + " " + f(y2 - k * Math.sin(a - 0.5)) + " L" + x2 + " " + y2 + " L" + f(x2 - k * Math.cos(a + 0.5)) + " " + f(y2 - k * Math.sin(a + 0.5)) + '"/>'; };
  // 物件：几样常用的东西，(x,y) 是物件中心
  const ITEMS = {
    book: (x, y) => '<rect x="' + (x - 13) + '" y="' + (y - 9) + '" width="26" height="18" fill="' + C.yellow + '"/><path d="M' + x + " " + (y - 9) + " V" + (y + 9) + '" stroke-width="2.5"/>',
    box: (x, y) => '<rect x="' + (x - 10) + '" y="' + (y - 8) + '" width="20" height="16" fill="' + C.orange + '"/>',
    cup: (x, y) => '<path d="M' + (x - 7) + " " + (y - 8) + " h14 l-2 16 h-10 z" + '" fill="' + C.white + '"/>',
    phone: (x, y) => '<rect x="' + (x - 6) + '" y="' + (y - 10) + '" width="12" height="20" rx="3" fill="' + C.blue + '" stroke-width="2.5"/>',
    die: (x, y) => '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="20" height="20" rx="5" fill="' + C.white + '"/><circle cx="' + (x - 4) + '" cy="' + (y - 4) + '" r="2.2" fill="' + C.ink + '" stroke="none"/><circle cx="' + (x + 4) + '" cy="' + (y + 4) + '" r="2.2" fill="' + C.ink + '" stroke="none"/>',
    star: (x, y) => '<path d="M' + x + " " + (y - 11) + " l3.4 7 7.6 1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1z" + '" fill="' + C.gold + '"/>',
    coin: (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + C.gold + '"/><path d="M' + x + " " + (y - 4) + " V" + (y + 4) + '" stroke-width="2"/>',
  };
  const item = (kind, x, y) => (ITEMS[kind] ? ITEMS[kind](x, y) : "");
  // 两手之间放一个物件（"手握住东西"）：取两手中点
  const holding = (x, y, o, kind) => { const h = hands(x, y, Object.assign({ arms: "hold" }, o)); if (h.length < 2) return ""; return item(kind, f((h[0][0] + h[1][0]) / 2), f((h[0][1] + h[1][1]) / 2)); };

  const kit = { person, hands, feetY, ground, T, eye, bubble, arrow, item, holding, C, reset: () => { personK = 0; } };

  /* ---------- 皮肤换画法的钩子 ----------
     画法不同的皮肤（剪纸、像素、彩铅）在 skin.js 里写 window.VL_SKIN.illus = function (base) { return {...}; }，
     base = { kit, C, esc }（kit 是上面的默认工具）。返回值里每一项都可选：
       kit:   { person, ground, item, ... }  覆盖或新增绘制函数，接口照 skin-contract 第三节；要自己计数换装就同时给 reset
       svg:   (it, name) => 字符串            自己包外层 <svg>（it = { alt, body, extra }），不给就用默认包法
       afterMount: (el, name) => void        插画放进页面后调用（如彩铅重画、动画）
     skin.js 必须在 kit/illus.js 之前加载（starter 模板就是这个顺序）。 */
  const EXT = typeof SK.illus === "function" ? (SK.illus({ kit, C, esc }) || {}) : {};
  if (EXT.kit) {
    Object.assign(kit, EXT.kit);
    // tools/illus-overlap.mjs 靠 g.px-person 找人物；皮肤自己的 person 没包就在这里包上
    if (EXT.kit.person) { const p0 = EXT.kit.person; kit.person = (...a) => { const s = p0(...a); return /class="[^"]*px-person/.test(s) ? s : '<g class="px-person">' + s + "</g>"; }; }
  }

  /* ---------- 注册与装载 ---------- */
  const LIB = {};
  // body / extra 可以是字符串，也可以是 k => 字符串（推荐：人物换装计数会在调用前清零）
  // opts.vb 改画布，如竖版头像 "0 0 140 200"（默认 "0 0 200 140"）；画布变了，人物和地面坐标照新画布算
  function add(name, alt, body, extra, opts) {
    kit.reset();
    const b = typeof body === "function" ? body(kit) : body;
    const e = typeof extra === "function" ? extra(kit) : extra;
    kit.reset();
    LIB[name] = { alt, body: b || "", extra: e || "", vb: (opts && opts.vb) || "0 0 200 140" };
    return LIB[name];
  }
  function svg(name) {
    const it = LIB[name]; if (!it) return "";
    if (EXT.svg) return EXT.svg(it, name);
    return '<svg viewBox="' + it.vb + '" class="vl-illus-svg" role="img" aria-label="' + esc(it.alt) + '">' +
      '<g class="vl-il-rough" stroke="' + C.ink + '" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">' + it.body + "</g>" +
      '<g class="vl-il-text">' + it.extra + "</g></svg>";
  }
  function mount(scope) {
    (scope || document).querySelectorAll("[data-illus]").forEach(el => {
      const name = el.getAttribute("data-illus");
      if (el._vlIllus === name) return;
      el.classList.add("vl-illus");
      const s = svg(name);
      if (s) { el.innerHTML = s; el.classList.remove("vl-illus-miss"); el._vlIllus = name; if (EXT.afterMount) EXT.afterMount(el, name); }
      else { el.classList.add("vl-illus-miss"); el.setAttribute("role", "img"); el.setAttribute("aria-label", name); el.textContent = name; }
    });
  }
  VL.illus = { add, svg, mount, kit, lib: LIB };
  // 兼容旧课程的写法
  window.illusAdd = add; window.illusSvg = svg; window.illusKit = kit;
})();
