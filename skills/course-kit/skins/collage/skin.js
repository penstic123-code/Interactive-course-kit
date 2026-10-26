/* 皮肤 collage（贴纸拼贴）的脚本部分：放在 <head> 里、kit/vl-head.js 和 kit/illus.js 之前。
   1. window.VL_SKIN：网络字体、页面共享的 SVG 滤镜（贴纸白边 + 投影 #cl-stk）、插画配色。
   2. 贴纸绘制工具：经 kit/illus.js 的换画法钩子 VL_SKIN.illus 换掉 person / item / holding / ground / bubble。
      人物是无描边的平涂剪纸（头、发、上衣、手臂、裤腿、鞋），每个人、每件物件各是一张贴纸：外面一圈白边、同向浅投影，
      和照片、名画的贴纸框（skin.css 的 .vl-fig.photo）是同一种质感。几何和 kit 默认一致，hands() / feetY() 直接沿用。
   滤镜规则：文字永远不进滤镜组。 */
(function () {
  "use strict";
  const PAL = {
    ink: "#241f1a", white: "#ffffff", paper: "#fffdf8",
    blue: "#2c4fa3", red: "#d6492c", green: "#2e8b5b", yellow: "#f0b92e", pink: "#e58ba0", orange: "#e8833a", sky: "#8fb3e8",
    navy: "#2d3550", charcoal: "#3a3633", wood: "#b9814f", hair: "#2b2320", grey: "#c9c3b8", gold: "#f0b92e",
    skin: "#f2cfae",
  };
  const SKINS = ["#f2cfae", "#dcae86", "#c08a62", "#f6d9bf", "#e3b993"];
  const SHIRTS = [PAL.blue, PAL.red, PAL.green, PAL.yellow, PAL.pink];
  const PANTS = [PAL.navy, PAL.charcoal, "#4b3b30", PAL.navy, "#3b4a3f"];
  const STK = 'filter="url(#cl-stk)" stroke="none"';

  window.VL_SKIN = {
    name: "collage",
    fonts: [
      "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css",
      "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap",
    ],
    // 贴纸：把形状的轮廓外扩成白边，再在右下错开一层浅影
    defs: '<filter id="cl-stk" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">' +
      '<feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/>' +
      '<feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="w"/>' +
      '<feOffset in="d" dx="1.6" dy="2.2" result="o"/><feGaussianBlur in="o" stdDeviation=".6" result="ob"/>' +
      '<feFlood flood-color="#28201a" flood-opacity=".22"/><feComposite in2="ob" operator="in" result="sh"/>' +
      '<feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    palette: PAL,
    illus: function (base) {
      const f = n => Math.round(n * 10) / 10;
      const ARMS = {
        stand: [[[-12, 8], [-15, 21]], [[12, 8], [15, 21]]], none: [],
        up: [[[-12, -4], [-17, -19]], [[12, -4], [17, -19]]], cover: [[[-14, -2], [-4, -16]], [[14, -2], [4, -16]]],
        point: [[[-12, 8], [-15, 21]], [[14, 0], [31, -5]]], hold: [[[-9, 10], [8, 12]], [[9, 10], [24, 10]]],
        wave: [[[-12, 8], [-15, 21]], [[13, -2], [19, -17]]], chin: [[[-12, 8], [-15, 21]], [[10, 6], [3, -7]]],
        throw: [[[-12, 8], [-15, 21]], [[12, -6], [28, -20]]], club: [[[-3, 10], [6, 21]], [[4, 10], [12, 19]]],
        desk: [[[-8, 12], [14, 24]], [[8, 12], [26, 24]]],
      };
      const LEGS = {
        stand: [[[-8, 27]], [[8, 27]]], run: [[[-13, 12], [-21, 25]], [[11, 11], [9, 27]]],
        walk: [[[-6, 13], [-10, 27]], [[8, 13], [14, 24]]], sit: [[[17, 1], [17, 22]], [[12, 6], [12, 26]]],
        wide: [[[-15, 27]], [[15, 27]]], none: [],
      };
      // 同一张图里第 k 个人：短发 → 鸭舌帽 → 长发 → 毛线帽 → 盘发；上衣色、肤色同时轮换
      const STYLES = [{ hair: "short" }, { hat: "cap" }, { hair: "long" }, { hat: "beanie" }, { hair: "bun" }];
      let k = 0;
      function person(x, y, o) {
        o = Object.assign({}, o || {});
        const idx = k++;
        if (o.outfit !== false) {
          const st = STYLES[idx % STYLES.length], headSet = o.hat !== undefined || o.hair !== undefined;
          if (!headSet) Object.assign(o, st);
        }
        if (o.hair === true) o.hair = "long";
        const s = o.s || 1, hr = 11 * s, fl = (o.flip !== undefined ? o.flip : (o.look || 0) < 0) ? -1 : 1;
        const sy = y + hr + 4 * s, hip = y + hr + 26 * s, look = (o.look || 0) * 2 * s;
        const shirt = o.shirt || SHIRTS[idx % SHIRTS.length], pants = o.pants || PANTS[idx % PANTS.length], skin = o.skin || SKINS[idx % SKINS.length];
        const P = (ox, oy, pts) => "M" + f(ox) + " " + f(oy) + pts.map(p => " L" + f(ox + p[0] * s * fl) + " " + f(oy + p[1] * s)).join("");
        const end = (ox, oy, pts) => { const p = pts[pts.length - 1]; return [f(ox + p[0] * s * fl), f(oy + p[1] * s)]; };
        let g = "";
        if (o.legs === "sit" && o.chair !== false) {
          const seat = hip + 3 * s, back = x - 13 * s * fl, front = x + 9 * s * fl, floor = o.floor || 126, w = 3 * s;
          g += '<g ' + STK + '><path fill="' + PAL.wood + '" d="M' + f(Math.min(back, front)) + " " + f(seat) + " H" + f(Math.max(back, front)) + " v" + f(w) + " H" + f(Math.min(back, front)) + 'Z"/>' +
            '<rect x="' + f(back - w / 2) + '" y="' + f(seat - 24 * s) + '" width="' + f(w) + '" height="' + f(24 * s) + '" fill="' + PAL.wood + '"/>' +
            (seat < floor - 6 ? '<rect x="' + f(back - w / 2) + '" y="' + f(seat) + '" width="' + f(w) + '" height="' + f(floor - seat) + '" fill="' + PAL.wood + '"/><rect x="' + f(front - 2 * s * fl - w / 2) + '" y="' + f(seat) + '" width="' + f(w) + '" height="' + f(floor - seat) + '" fill="' + PAL.wood + '"/>' : "") + "</g>";
        }
        let p = "";
        // 腿和鞋
        (LEGS[o.legs || "stand"] || []).forEach(l => {
          p += '<path d="' + P(x, hip, l) + '" stroke="' + pants + '" stroke-width="' + f(6 * s) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
          const e = end(x, hip, l); p += '<ellipse cx="' + f(e[0] + 2 * s * fl) + '" cy="' + f(e[1]) + '" rx="' + f(4.2 * s) + '" ry="' + f(2.4 * s) + '" fill="' + PAL.ink + '"/>';
        });
        // 上身：一块梯形彩纸
        p += '<path fill="' + shirt + '" d="M' + f(x - 8.5 * s) + " " + f(sy - 2 * s) + " Q" + f(x) + " " + f(sy - 5 * s) + " " + f(x + 8.5 * s) + " " + f(sy - 2 * s) + " L" + f(x + 7.5 * s) + " " + f(hip + 2 * s) + " L" + f(x - 7.5 * s) + " " + f(hip + 2 * s) + 'Z"/>';
        if (o.tie) p += '<path fill="' + PAL.red + '" d="M' + f(x) + " " + f(sy - 2 * s) + " l" + f(-2.5 * s) + " " + f(5 * s) + " l" + f(2.5 * s) + " " + f(9 * s) + " l" + f(2.5 * s) + " " + f(-9 * s) + 'z"/>';
        // 手臂和手
        (ARMS[o.arms || "stand"] || []).forEach(a => {
          p += '<path d="' + P(x, sy, a) + '" stroke="' + shirt + '" stroke-width="' + f(5 * s) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
          const e = end(x, sy, a); p += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="' + f(2.8 * s) + '" fill="' + skin + '"/>';
        });
        if (o.cape) p += '<path fill="' + PAL.red + '" d="M' + f(x - 2 * s) + " " + f(sy) + " q" + f(-18 * s * fl) + " " + f(16 * s) + " " + f(-12 * s * fl) + " " + f(40 * s) + " l" + f(18 * s * fl) + " " + f(-6 * s) + 'z"/>';
        // 头、头发、帽子
        if (o.hair === "long") p += '<path fill="' + PAL.hair + '" d="M' + f(x - hr - 1.5 * s) + " " + f(y + 2 * s) + " Q" + f(x - hr - 2 * s) + " " + f(y - hr - 3 * s) + " " + f(x) + " " + f(y - hr - 2 * s) + " Q" + f(x + hr + 2 * s) + " " + f(y - hr - 3 * s) + " " + f(x + hr + 1.5 * s) + " " + f(y + 2 * s) + " L" + f(x + hr + 1 * s) + " " + f(y + hr + 3 * s) + " L" + f(x - hr - 1 * s) + " " + f(y + hr + 3 * s) + 'Z"/>';
        if (o.hair === "bun") p += '<circle cx="' + f(x - 2 * s * fl) + '" cy="' + f(y - hr - 3 * s) + '" r="' + f(4.5 * s) + '" fill="' + PAL.hair + '"/>';
        p += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(hr) + '" fill="' + skin + '"/>';
        if (o.hair === "short" || o.hair === "long" || o.hair === "bun") p += '<path fill="' + PAL.hair + '" d="M' + f(x - hr) + " " + f(y - 1 * s) + " Q" + f(x - hr) + " " + f(y - hr - 2 * s) + " " + f(x) + " " + f(y - hr - 1 * s) + " Q" + f(x + hr) + " " + f(y - hr - 2 * s) + " " + f(x + hr) + " " + f(y - 1 * s) + " Q" + f(x + 3 * s * fl) + " " + f(y - 7 * s) + " " + f(x - hr) + " " + f(y - 1 * s) + 'Z"/>';
        if (o.hat === "cap") p += '<path fill="' + PAL.red + '" d="M' + f(x - hr) + " " + f(y - 4 * s) + " Q" + f(x) + " " + f(y - hr * 2.1) + " " + f(x + hr) + " " + f(y - 4 * s) + 'Z"/><path fill="' + PAL.red + '" d="M' + f(x) + " " + f(y - 6 * s) + " h" + f((hr + 8 * s) * fl) + " v" + f(2.6 * s) + " h" + f(-(hr + 8 * s) * fl) + 'z"/>';
        if (o.hat === "beanie") p += '<path fill="' + PAL.green + '" d="M' + f(x - hr - .5 * s) + " " + f(y - 3 * s) + " Q" + f(x) + " " + f(y - hr * 2.2) + " " + f(x + hr + .5 * s) + " " + f(y - 3 * s) + 'Z"/><circle cx="' + f(x) + '" cy="' + f(y - hr - 6 * s) + '" r="' + f(3 * s) + '" fill="' + PAL.yellow + '"/>';
        if (o.hat === "tophat") p += '<rect x="' + f(x - 7 * s) + '" y="' + f(y - hr - 13 * s) + '" width="' + f(14 * s) + '" height="' + f(14 * s) + '" fill="' + PAL.ink + '"/><rect x="' + f(x - 11 * s) + '" y="' + f(y - hr) + '" width="' + f(22 * s) + '" height="' + f(2.6 * s) + '" fill="' + PAL.ink + '"/>';
        if (o.hat === "crown") p += '<path fill="' + PAL.gold + '" d="M' + f(x - 9 * s) + " " + f(y - 8 * s) + " l" + f(2 * s) + " " + f(-12 * s) + " l" + f(5 * s) + " " + f(7 * s) + " l" + f(2 * s) + " " + f(-10 * s) + " l" + f(2 * s) + " " + f(10 * s) + " l" + f(5 * s) + " " + f(-7 * s) + " l" + f(2 * s) + " " + f(12 * s) + 'z"/>';
        if (o.hat === "wizard") p += '<path fill="' + PAL.blue + '" d="M' + f(x - 12 * s) + " " + f(y - 6 * s) + " L" + f(x + 2 * s) + " " + f(y - 34 * s) + " L" + f(x + 12 * s) + " " + f(y - 6 * s) + 'z"/>';
        if (o.beard) p += '<path fill="' + PAL.hair + '" d="M' + f(x - 9 * s) + " " + f(y + 5 * s) + " q" + f(9 * s) + " " + f(16 * s) + " " + f(18 * s) + ' 0 q' + f(-9 * s) + " " + f(-5 * s) + " " + f(-18 * s) + ' 0z"/>';
        // 脸：两点 + 一笔，和贴纸同组（白边只描外轮廓，不影响脸）
        const ex = 4 * s, ey = y - 1 * s, fc = o.face || "smile", I = PAL.ink;
        if (fc === "closed") p += '<path fill="none" stroke="' + I + '" stroke-width="' + f(1.6 * s) + '" stroke-linecap="round" d="M' + f(x - ex - 1.8 * s + look) + " " + f(ey) + " h" + f(3.6 * s) + " M" + f(x + ex - 1.8 * s + look) + " " + f(ey) + " h" + f(3.6 * s) + '"/>';
        else { const r = (fc === "shout" || fc === "wide" ? 2 : 1.5) * s; p += '<circle cx="' + f(x - ex + look) + '" cy="' + f(ey) + '" r="' + f(r) + '" fill="' + I + '"/><circle cx="' + f(x + ex + look) + '" cy="' + f(ey) + '" r="' + f(r) + '" fill="' + I + '"/>'; }
        const mx = x + look, my = y + 4.5 * s, ln = 'fill="none" stroke="' + I + '" stroke-width="' + f(1.6 * s) + '" stroke-linecap="round"';
        if (fc === "smile") p += '<path ' + ln + ' d="M' + f(mx - 3.5 * s) + " " + f(my) + " q" + f(3.5 * s) + " " + f(3.5 * s) + " " + f(7 * s) + ' 0"/>';
        else if (fc === "grin") p += '<path fill="#fff" stroke="' + I + '" stroke-width="' + f(1.4 * s) + '" d="M' + f(mx - 4.5 * s) + " " + f(my) + " q" + f(4.5 * s) + " " + f(6 * s) + " " + f(9 * s) + ' 0z"/>';
        else if (fc === "sad") p += '<path ' + ln + ' d="M' + f(mx - 3.5 * s) + " " + f(my + 2.5 * s) + " q" + f(3.5 * s) + " " + f(-3.5 * s) + " " + f(7 * s) + ' 0"/>';
        else if (fc === "flat") p += '<path ' + ln + ' d="M' + f(mx - 3 * s) + " " + f(my + 1.5 * s) + " h" + f(6 * s) + '"/>';
        else if (fc === "shout" || fc === "o" || fc === "wide") p += '<ellipse cx="' + f(mx) + '" cy="' + f(my + 2 * s) + '" rx="' + f(2.4 * s) + '" ry="' + f(fc === "shout" ? 3.4 * s : 2.4 * s) + '" fill="' + I + '"/>';
        if (o.glasses) p += '<g fill="none" stroke="' + I + '" stroke-width="' + f(1.1 * s) + '"><circle cx="' + f(x - ex + look) + '" cy="' + f(ey) + '" r="' + f(3.3 * s) + '"/><circle cx="' + f(x + ex + look) + '" cy="' + f(ey) + '" r="' + f(3.3 * s) + '"/><path d="M' + f(x - ex + 3.3 * s + look) + " " + f(ey) + " H" + f(x + ex - 3.3 * s + look) + '"/></g>';
        return g + '<g class="px-person" ' + STK + ">" + p + "</g>";
      }
      // 物件：每件一张贴纸，(x,y) 是中心
      const ITEMS = {
        book: (x, y) => '<rect x="' + (x - 13) + '" y="' + (y - 9) + '" width="26" height="18" rx="1.5" fill="' + PAL.blue + '"/><rect x="' + (x - 1) + '" y="' + (y - 9) + '" width="2" height="18" fill="' + PAL.navy + '"/>',
        box: (x, y) => '<rect x="' + (x - 10) + '" y="' + (y - 8) + '" width="20" height="16" fill="' + PAL.wood + '"/>',
        cup: (x, y) => '<path d="M' + (x - 7) + " " + (y - 8) + " h14 l-2 16 h-10 z" + '" fill="' + PAL.paper + '"/><path d="M' + (x - 6) + " " + (y - 5) + ' h12" stroke="' + PAL.red + '" stroke-width="2"/>',
        phone: (x, y) => '<rect x="' + (x - 6) + '" y="' + (y - 10) + '" width="12" height="20" rx="2.5" fill="' + PAL.ink + '"/><rect x="' + (x - 4.5) + '" y="' + (y - 8) + '" width="9" height="15" rx="1" fill="' + PAL.sky + '"/>',
        die: (x, y) => '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="20" height="20" rx="4" fill="' + PAL.paper + '"/><circle cx="' + (x - 4) + '" cy="' + (y - 4) + '" r="2" fill="' + PAL.ink + '"/><circle cx="' + (x + 4) + '" cy="' + (y + 4) + '" r="2" fill="' + PAL.ink + '"/>',
        star: (x, y) => '<path d="M' + x + " " + (y - 11) + " l3.4 7 7.6 1 -5.5 5.3 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.3 7.6 -1z" + '" fill="' + PAL.yellow + '"/>',
        coin: (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + PAL.gold + '"/><rect x="' + (x - 1) + '" y="' + (y - 4) + '" width="2" height="8" fill="' + PAL.wood + '"/>',
      };
      const item = (kind, x, y) => ITEMS[kind] ? "<g " + STK + ">" + ITEMS[kind](x, y) + "</g>" : "";
      const holding = (x, y, o, kind) => { const h = base.kit.hands(x, y, Object.assign({ arms: "hold" }, o)); if (h.length < 2) return ""; return item(kind, f((h[0][0] + h[1][0]) / 2), f((h[0][1] + h[1][1]) / 2)); };
      // 地面：一条淡淡的铅笔线
      const ground = y => '<path d="M8 ' + (y || 126) + ' H192" stroke="#8a7f70" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
      function bubble(x, y, w, h, tail, fill) {
        const c = fill || PAL.white;
        let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + c + '"/>';
        if (tail) { const bx = Math.max(x + 14, Math.min(x + w - 14, tail[0])), by = tail[1] > y + h ? y + h - 1 : y + 1; s += '<path d="M' + f(bx - 7) + " " + by + " L" + f(tail[0]) + " " + f(tail[1]) + " L" + f(bx + 7) + " " + by + 'Z" fill="' + c + '"/>'; }
        return "<g " + STK + ">" + s + "</g>";
      }
      // 任意形状包成一张贴纸
      const sticker = inner => "<g " + STK + ">" + inner + "</g>";
      function svg(it) {
        return '<svg viewBox="' + it.vb + '" class="vl-illus-svg" role="img" aria-label="' + base.esc(it.alt) + '">' +
          '<g class="vl-il-rough" stroke="' + PAL.ink + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">' + it.body + "</g>" +
          '<g class="vl-il-text">' + it.extra + "</g></svg>";
      }
      return { kit: { person, item, holding, ground, bubble, sticker, C: Object.assign(base.C, PAL), reset: () => { k = 0; } }, svg };
    },
  };
})();
