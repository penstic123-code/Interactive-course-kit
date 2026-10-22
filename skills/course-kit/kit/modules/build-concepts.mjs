// course-kit · modules/build-concepts.mjs —— 扫描课程各章，生成 / 校验统一概念数据 js/concepts.js。
// 用法：node build-concepts.mjs <课程文件夹绝对路径> [--write] [--course js/course.js] [--concepts js/concepts.js] [--out 另存路径]
//   默认只校验，不改文件；--write 把各章里新出现的概念卡、术语合并进 concepts.js（手写的字段保留，原文件备份成 .bak；文件里的注释会丢）。
// 扫什么：
//   概念卡 <aside class="vl-cc" data-concept="id">（或手写的 .vl-cc：取 .vl-cc-name / -en / -plain / -def / -by）
//   行内术语 <span class="vl-term" data-def="…">词</span>、<dfn title="…">词</dfn> / <dfn data-def="…">
// 查什么（✗ = 要修，· = 提示）：
//   ✗ data-concept 在数据里找不到；✗ 关系边指向不存在的 id；✗ id 重复；✗ 概念缺 def
//   ✗ 手写概念卡的释义和数据不一致；✗ 同一术语在两处释义不同（以首次出现处为准）
//   · 概念缺 illus（概念卡图位必有）；· 概念的 ch 和它的卡片所在章不同；· 手写概念卡没写 data-concept
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ROOT = argv.find(a => !a.startsWith("--") && path.isAbsolute(a));
if (!ROOT) { console.error("用法：node build-concepts.mjs <课程文件夹绝对路径> [--write] [--course js/course.js] [--concepts js/concepts.js] [--out 路径]"); process.exit(1); }
const WRITE = argv.includes("--write");
const COURSE = path.resolve(ROOT, opt("--course") || "js/course.js");
const CONCEPTS = path.resolve(ROOT, opt("--concepts") || "js/concepts.js");
const OUT = opt("--out") ? path.resolve(ROOT, opt("--out")) : CONCEPTS;
const read = f => fs.readFileSync(f, "utf8");
let bad = 0;
const fail = m => { bad++; console.log("  ✗ " + m); };
const hint = m => console.log("  · " + m);

// 在沙箱里跑课程的 js，取出 window.VL_COURSE / VL_CONCEPTS
function load(file, key) {
  if (!fs.existsSync(file)) return null;
  const win = {}; const ctx = vm.createContext({ window: win, console });
  try { vm.runInContext(read(file), ctx, { filename: file }); } catch (e) { fail(path.basename(file) + " 运行出错：" + e.message); return null; }
  return win[key] || null;
}
const course = load(COURSE, "VL_COURSE") || {};
const data = load(CONCEPTS, "VL_CONCEPTS") || { items: [], links: [], terms: [] };
data.items = data.items || []; data.links = data.links || []; data.terms = data.terms || [];
const chapters = (course.chapters || []).map((c, i) => Array.isArray(c) ? { n: i + 1, file: c[1] } : { n: i + 1, file: c.file });
let files = chapters.map(c => c.file).filter(f => f && fs.existsSync(path.join(ROOT, f)));
if (!files.length) files = fs.readdirSync(ROOT).filter(f => /^ch\d+.*\.html$/.test(f)).sort();
const chOf = f => { const c = chapters.find(x => x.file === f); if (c) return c.n; const m = f.match(/ch(\d+)/); return m ? +m[1] : 0; };

// ---------- 从 HTML 里取文字（正则够用：课程页是自己写的、结构固定） ----------
const strip = s => String(s || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const attr = (tag, a) => { const m = tag.match(new RegExp("\\b" + a + '="([^"]*)"')); return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&") : null; };
const field = (html, cls) => { const m = html.match(new RegExp('<p[^>]*class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>([\\s\\S]*?)</p>')); return m ? strip(m[1]) : ""; };
const norm = s => String(s || "").replace(/[\s。．.，,；;：:！!？?“”"'‘’（）()]/g, "").toLowerCase();

const cards = [], terms = [];
for (const f of files) {
  const html = read(path.join(ROOT, f)).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, "");
  const ch = chOf(f);
  for (const m of html.matchAll(/<aside([^>]*class="[^"]*\bvl-cc\b[^"]*"[^>]*)>([\s\S]*?)<\/aside>/g)) {
    cards.push({ file: f, ch, id: attr(m[1], "data-concept"), domId: attr(m[1], "id"), zh: field(m[2], "vl-cc-name"), en: field(m[2], "vl-cc-en"), plain: field(m[2], "vl-cc-plain"), def: field(m[2], "vl-cc-def"), by: field(m[2], "vl-cc-by") });
  }
  for (const m of html.matchAll(/<(span|a|b|em)([^>]*class="[^"]*\bvl-term\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/g)) {
    const def = attr(m[2], "data-def"); if (!def) continue;
    terms.push({ file: f, ch, zh: attr(m[2], "data-name") || strip(m[3]), def, anchor: attr(m[2], "id") });
  }
  for (const m of html.matchAll(/<dfn([^>]*)>([\s\S]*?)<\/dfn>/g)) {
    terms.push({ file: f, ch, zh: strip(m[2]), def: attr(m[1], "data-def") || attr(m[1], "title") || "", anchor: attr(m[1], "id") });
  }
}
console.log(`扫了 ${files.length} 章：概念卡 ${cards.length} 张，术语 ${terms.length} 处；数据里概念 ${data.items.length} 个、术语 ${data.terms.length} 个。`);

// ---------- 校验数据本身 ----------
console.log("1 概念数据");
const byId = new Map();
for (const c of data.items) {
  if (!c.id) { fail("有概念缺 id：" + (c.zh || JSON.stringify(c).slice(0, 40))); continue; }
  if (byId.has(c.id)) fail("id 重复：" + c.id);
  byId.set(c.id, c);
  if (!c.def) fail(`${c.id}（${c.zh}）缺 def（一句定义）`);
  if (!c.plain) hint(`${c.id}（${c.zh}）缺 plain（通俗地说）：概念卡、集邮册、闪卡都会用它`);
  if (!c.illus) hint(`${c.id}（${c.zh}）缺 illus：概念卡图位必有，图鉴也要用`);
  if (c.ch && chapters.length && !chapters.some(x => x.n === c.ch)) fail(`${c.id} 的 ch=${c.ch} 不在章节表里`);
}
const TYPES = ["prereq", "explains", "applies", "contrast", "前置", "解释", "应用", "对照"];
const allLinks = [...data.items.flatMap(c => (c.links || []).map(l => ({ from: c.id, to: l.to, type: l.type }))), ...data.links];
for (const l of allLinks) {
  if (!byId.has(l.from) || !byId.has(l.to)) fail(`关系边 ${l.from} → ${l.to} 指向不存在的概念`);
  if (!TYPES.includes(l.type)) fail(`关系边 ${l.from} → ${l.to} 的 type "${l.type}" 不认识（用 prereq / explains / applies / contrast）`);
}
const alone = data.items.filter(c => !allLinks.some(l => l.from === c.id || l.to === c.id));
if (alone.length) hint("这些概念还没有任何连线：" + alone.map(c => c.zh).join("、"));

// ---------- 概念卡 vs 数据 ----------
console.log("2 概念卡");
const findByName = name => data.items.find(c => norm(c.zh) === norm(name) || norm(c.en) === norm(name) || (c.aka || []).some(a => norm(a) === norm(name)));
const added = [];
const firstSeen = new Map();
for (const k of cards) {
  let c = k.id ? byId.get(k.id) : null;
  if (k.id && !c) {
    if (WRITE && k.zh) { c = { id: k.id, ch: k.ch, zh: k.zh, en: k.en, plain: k.plain, def: k.def, by: k.by || undefined }; data.items.push(c); byId.set(c.id, c); added.push(c.zh); }
    else { fail(`${k.file}：data-concept="${k.id}" 在数据里找不到${k.zh ? "（卡上写着 " + k.zh + "，加 --write 收进数据）" : ""}`); continue; }
  }
  if (!k.id) {
    const m = findByName(k.zh);
    if (m) hint(`${k.file}：手写概念卡"${k.zh}"对应数据里的 ${m.id}，建议写 data-concept="${m.id}"，字段由数据生成`);
    else if (WRITE && k.zh) { const id = (k.en || k.zh).toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "-").replace(/^-|-$/g, "") || "c" + (data.items.length + 1); c = { id, ch: k.ch, zh: k.zh, en: k.en, plain: k.plain, def: k.def, by: k.by || undefined }; data.items.push(c); byId.set(id, c); added.push(k.zh); hint(`${k.file}：新概念"${k.zh}"收进数据，id = ${id}；记得给卡片加 data-concept="${id}"`); }
    else hint(`${k.file}：手写概念卡"${k.zh}"不在概念数据里（--write 可收进去）`);
    if (!m) continue;
    c = m;
  }
  if (!firstSeen.has(c.id)) firstSeen.set(c.id, k);
  for (const f of ["zh", "en", "plain", "def"]) {
    if (!k[f] || !c[f]) { if (WRITE && k[f] && !c[f]) c[f] = k[f]; continue; }
    if (norm(k[f]) !== norm(c[f])) fail(`${k.file}：概念卡"${c.zh}"的 ${f} 和数据不一致——卡：「${k[f]}」 数据：「${c[f]}」（以数据为准，或改数据后删掉卡上这一行）`);
  }
}
for (const [id, k] of firstSeen) { const c = byId.get(id); if (c.ch && k.ch && c.ch !== k.ch) hint(`${c.zh}：数据里 ch=${c.ch}，但第一张卡片在第 ${k.ch} 章（${k.file}）`); }

// ---------- 术语 ----------
console.log("3 术语");
const termSeen = new Map();
let newTerms = 0;
for (const t of terms) {
  if (!t.zh) continue;
  const key = norm(t.zh);
  if (!t.def) { hint(`${t.file}：<dfn>${t.zh}</dfn> 没写释义（title 或 data-def），不进术语表`); continue; }
  if (termSeen.has(key)) {
    const a = termSeen.get(key);
    if (norm(a.def) !== norm(t.def)) fail(`术语"${t.zh}"两处释义不同——${a.file}：「${a.def}」 / ${t.file}：「${t.def}」（以首次出现处为准）`);
    continue;
  }
  termSeen.set(key, t);
  if (findByName(t.zh)) continue;                                     // 是核心概念：用概念数据
  const old = data.terms.find(x => norm(x.zh) === key || (x.aka || []).some(a => norm(a) === key));
  if (old) {
    if (old.def && norm(old.def) !== norm(t.def)) fail(`术语"${t.zh}"：${t.file} 的释义和数据不一致——页：「${t.def}」 数据：「${old.def}」`);
    if (WRITE) { old.ch = old.ch || t.ch; if (t.anchor && !old.anchor) old.anchor = t.anchor; }
    continue;
  }
  if (WRITE) { data.terms.push({ id: "t-" + (data.terms.length + 1), ch: t.ch, zh: t.zh, def: t.def, ...(t.anchor ? { anchor: t.anchor } : {}) }); newTerms++; }
  else hint(`${t.file}：术语"${t.zh}"还不在数据里（--write 会收进 terms）`);
}

// ---------- 写回 ----------
if (WRITE) {
  const clean = o => JSON.parse(JSON.stringify(o));
  const body = "/* 统一概念数据：由 build-concepts.mjs --write 生成 / 更新（" + new Date().toISOString().slice(0, 10) + "）。\n   字段说明见 kit/modules/concepts-schema.md。可以直接手改；再次 --write 时手改的字段保留，但文件里的注释会丢。 */\nwindow.VL_CONCEPTS = " + JSON.stringify(clean(data), null, 2) + ";\n";
  if (fs.existsSync(OUT) && OUT === CONCEPTS) fs.copyFileSync(OUT, OUT + ".bak");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, "utf8");
  console.log(`已写入 ${OUT}：新增概念 ${added.length} 个${added.length ? "（" + added.join("、") + "）" : ""}，新增术语 ${newTerms} 个。`);
}
console.log(bad ? `\n共 ${bad} 处要修。` : "\n概念数据检查通过。");
process.exit(bad ? 1 : 0);
