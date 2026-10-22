/* course-kit · modules/vl-concepts.js —— 统一概念数据的内核。
   一份数据（window.VL_CONCEPTS，写在课程的 js/concepts.js）同时供概念卡、关系图、相关章节、图鉴、术语表、闪卡使用。
   放在 js/course.js、js/concepts.js 之后、kit/vl.js 之前：这样 <aside class="vl-cc" data-concept="id"> 先被填好，
   vl.js 再给它加小签、查图位，不会误报"缺概念图"。字段说明见 modules/concepts-schema.md，API 见 kit/README.md 第八节。 */
(function () {
  "use strict";
  const W = window, doc = document;
  const VL = W.VL = W.VL || {};
  const C = W.VL_COURSE || {};
  const RAW = W.VL_CONCEPTS || { items: [], links: [], terms: [] };
  const LANG = /^en/i.test(doc.documentElement.lang || "") ? "en" : "zh";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 界面文字：课程可用 VL_I18N 覆盖；英文默认值写在调用处
  const T = (k, zh, en, ...a) => {
    const X = W.VL_I18N || {};
    const s = X[LANG] && X[LANG][k] != null ? X[LANG][k] : (LANG === "en" ? en : zh);
    return String(s).replace(/\{(\d+)\}/g, (m, i) => (a[+i] != null ? a[+i] : m));
  };

  /* ---------- 章节表（vl.js 还没跑，自己读一遍 VL_COURSE） ---------- */
  const CH = (C.chapters || []).map((c, i) => Array.isArray(c) ? { n: i + 1, zh: c[0], file: c[1], en: c[2] || c[0] } : Object.assign({ n: i + 1 }, c));
  const PARTS = C.parts || [];
  const partOf = n => { const i = PARTS.findIndex(p => n >= p.from && n <= p.to); return i < 0 ? 0 : i; };
  const chap = n => CH[n - 1] || null;
  const isOpen = n => { const c = chap(n); return !!c && c.open !== false; };
  const chName = n => { const c = chap(n); return c ? (LANG === "en" ? c.en || c.zh : c.zh) : ""; };
  // 英文页在 en/ 下，同名章节文件就在旁边，链接不用加前缀
  const chHref = (n, id) => { const c = chap(n); if (!c || c.open === false) return ""; return c.file + (id ? "#cc-" + id : ""); };

  /* ---------- 规范化：items[].links 和顶层 links 合并成一张边表 ---------- */
  const TYPES = {
    prereq:   { zh: "前置", en: "Prerequisite", inZh: "先要懂", inEn: "Builds on", outZh: "接着能懂", outEn: "Leads to", arrow: true },
    explains: { zh: "解释", en: "Explains", inZh: "背后的原理", inEn: "Explained by", outZh: "它能解释", outEn: "Explains", arrow: true },
    applies:  { zh: "应用", en: "Applied in", inZh: "用到了", inEn: "Uses", outZh: "用在", outEn: "Used in", arrow: true },
    contrast: { zh: "对照", en: "Contrast", inZh: "对照", inEn: "Contrast with", outZh: "对照", outEn: "Contrast with", arrow: false },
  };
  const ALIAS = { "前置": "prereq", needs: "prereq", pre: "prereq", "解释": "explains", "应用": "applies", apply: "applies", "对照": "contrast", vs: "contrast" };
  const typeOf = t => (TYPES[t] ? t : ALIAS[t] || "prereq");

  const items = (RAW.items || RAW.concepts || []).map(o => Object.assign({ kind: "concept", aka: [] }, o, { ch: +o.ch || 0 }));
  const byId = Object.create(null);
  items.forEach(c => { if (byId[c.id]) console.warn("[VL] 概念 id 重复：", c.id); byId[c.id] = c; });
  const links = [];
  const seen = new Set();
  const addLink = (from, to, type) => {
    type = typeOf(type);
    if (!byId[from] || !byId[to]) { console.warn("[VL] 关系边指向不存在的概念：", from, "→", to); return; }
    const k = type === "contrast" ? [from, to].sort().join("|") + "|c" : from + "|" + to + "|" + type;
    if (seen.has(k)) return; seen.add(k); links.push({ from, to, type });
  };
  items.forEach(c => (c.links || []).forEach(l => addLink(c.id, l.to, l.type)));
  (RAW.links || []).forEach(l => addLink(l.from, l.to, l.type));
  const terms = (RAW.terms || []).map(o => Object.assign({ kind: "term", aka: [] }, o, { ch: +o.ch || 0 }));

  /* ---------- 取字段：英文页优先英文字段，缺了退回中文 ---------- */
  const name = c => (LANG === "en" ? c.en || c.zh : c.zh);
  const other = c => (LANG === "en" ? (c.en && c.zh !== c.en ? c.zh : "") : c.en || "");
  const pick = (c, f) => (LANG === "en" ? c[f + "En"] || c[f] || "" : c[f] || "");
  const neighbors = id => links.filter(l => l.from === id || l.to === id).map(l => ({ id: l.from === id ? l.to : l.from, type: l.type, dir: l.from === id ? "out" : "in" }));
  const ofChapter = n => items.filter(c => c.ch === n);
  const relLabel = (type, dir) => { const t = TYPES[type]; return LANG === "en" ? (dir === "in" ? t.inEn : t.outEn) : (dir === "in" ? t.inZh : t.outZh); };

  /* ---------- 概念卡 HTML（字段取自数据，避免卡片和数据两处不一致） ---------- */
  function cardHTML(c, o) {
    o = o || {};
    if (typeof c === "string") c = byId[c];
    if (!c) return "";
    const fig = c.illus ? '<div class="vl-cc-fig"><span data-illus="' + esc(c.illus) + '"></span></div>' : (o.fig || "");
    return '<p class="vl-cc-name">' + esc(name(c)) + "</p>" +
      (other(c) ? '<p class="vl-cc-en">' + esc(other(c)) + "</p>" : "") +
      (pick(c, "by") ? '<p class="vl-cc-by">' + esc(pick(c, "by")) + "</p>" : "") +
      (pick(c, "plain") ? '<p class="vl-cc-plain">' + esc(pick(c, "plain")) + "</p>" : "") +
      (pick(c, "def") ? '<p class="vl-cc-def">' + esc(pick(c, "def")) + "</p>" : "") +
      (o.eg ? '<p class="vl-cc-eg">' + o.eg + "</p>" : "") + fig;
  }
  // <aside class="vl-cc" data-concept="id">：空的就整张由数据生成；作者手写了的字段保留，只补缺的
  function fillCards(scope) {
    (scope || doc).querySelectorAll(".vl-cc[data-concept]").forEach(el => {
      if (el._vlFilled) return; el._vlFilled = 1;
      const c = byId[el.dataset.concept];
      if (!c) { console.warn("[VL] 概念卡 data-concept 在概念数据里找不到：", el.dataset.concept); return; }
      if (!el.id) el.id = "cc-" + c.id;
      if (!el.children.length) { el.innerHTML = cardHTML(c); return; }
      const tmp = doc.createElement("div"); tmp.innerHTML = cardHTML(c);
      ["vl-cc-name", "vl-cc-en", "vl-cc-by", "vl-cc-plain", "vl-cc-def", "vl-cc-fig"].forEach(k => {
        if (el.querySelector("." + k)) return;
        const p = tmp.querySelector("." + k); if (!p) return;
        if (k === "vl-cc-fig") el.appendChild(p);
        else { const eg = el.querySelector(".vl-cc-eg, .vl-cc-fig"); eg ? eg.before(p) : el.appendChild(p); }
      });
    });
  }

  /* ---------- 相关章节：本章概念的边连到哪些章，按边的分量排序 ---------- */
  const WEIGHT = { prereq: 3, explains: 2, applies: 2, contrast: 1 };
  function related(n, opts) {
    opts = opts || {};
    const mine = new Set(ofChapter(n).map(c => c.id));
    const acc = {};
    links.forEach(l => {
      const a = mine.has(l.from), b = mine.has(l.to);
      if (a === b) return;
      const here = a ? l.from : l.to, there = a ? l.to : l.from, ch = byId[there].ch;
      if (!ch || ch === n) return;
      if (opts.future === false && ch > n) return;
      const r = acc[ch] || (acc[ch] = { ch, score: 0, via: [] });
      r.score += WEIGHT[l.type] || 1;
      r.via.push({ here, there, type: l.type, dir: a ? "out" : "in" });
    });
    return Object.values(acc).sort((x, y) => y.score - x.score || x.ch - y.ch).slice(0, opts.max || 4);
  }
  // <nav class="vl-related">：空容器就地填；课程开着 related（默认开）且本章有概念时，自动插在翻页前面
  function renderRelated(target, n) {
    n = n || (W.VL && W.VL.cur) || +doc.body.dataset.ch || 0;
    if (!n) return null;
    const list = related(n, { future: !(C.modules && C.modules.relatedFuture === false) });
    if (!target) {
      if (C.modules && C.modules.related === false) return null;
      if (!list.length) return null;
      target = doc.createElement("nav"); target.className = "vl-related";
      const pager = doc.querySelector("main .vl-pager");
      const main = doc.querySelector("main");
      if (pager) pager.before(target); else if (main) main.appendChild(target); else return null;
    }
    target.setAttribute("aria-label", T("rel.title", "相关章节", "Related chapters"));
    if (!list.length) { target.hidden = true; return target; }
    // 从那一章的概念说起："提取练习 · 先要懂 工作记忆"（边的方向换到 there 的视角）
    const why = v => { const h = byId[v.here], t = byId[v.there]; return esc(name(t)) + " · " + esc(relLabel(v.type, v.dir === "out" ? "in" : "out")) + " " + esc(name(h)); };
    target.innerHTML = "<h3>" + esc(T("rel.title", "相关章节", "Related chapters")) + '</h3><ul class="vl-rel-list">' + list.map(r => {
      const href = chHref(r.ch);
      const head = '<span class="vl-rel-n">' + esc(T("rel.ch", "第 {0} 章", "Ch. {0}", r.ch)) + '</span><span class="vl-rel-name">' + esc(chName(r.ch)) + "</span>";
      return '<li class="vl-rel-item' + (r.ch > n ? " later" : "") + '">' + (href ? '<a href="' + esc(href) + '">' + head + "</a>" : '<span class="vl-rel-off">' + head + "<small>" + esc(T("rel.wip", "还在写", "coming soon")) + "</small></span>") +
        '<span class="vl-rel-why">' + r.via.slice(0, 2).map(why).join(LANG === "en" ? "; " : "；") + "</span></li>";
    }).join("") + "</ul>";
    return target;
  }

  /* ---------- 全部词条（概念 + 普通术语），供术语表、闪卡、搜索 ---------- */
  const entries = () => items.concat(terms);
  const norm = s => String(s || "").toLowerCase().replace(/\s+/g, "");
  function match(c, q) {
    q = norm(q); if (!q) return true;
    return [c.zh, c.en, c.def, c.defEn, c.plain, c.plainEn].concat(c.aka || []).some(s => norm(s).includes(q));
  }

  VL.concepts = {
    items, terms, links, byId: id => byId[id] || null, get: id => byId[id] || null, entries, match,
    ofChapter, neighbors, related, renderRelated, cardHTML, fillCards,
    name, other, pick, relLabel, TYPES, typeOf,
    CH, PARTS, partOf, chap, chName, chHref, isOpen, lang: LANG, esc, T,
    mapHref: id => (C.mapHref || "map.html") + (id ? "#" + id : ""),
  };

  fillCards(doc);
  const ready = fn => (doc.readyState === "loading" ? doc.addEventListener("DOMContentLoaded", fn) : setTimeout(fn, 0));
  // 翻页 .vl-pager 由 vl.js 同步造好；DOMContentLoaded 时它已经在页面上
  ready(() => {
    const t = doc.querySelector("nav.vl-related, .vl-related[data-auto]");
    if (t) renderRelated(t); else renderRelated(null);
  });
})();
