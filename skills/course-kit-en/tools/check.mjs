// 一键检查：交付前跑一遍，抓"写的时候看不见"的错。
// 用法：node check.mjs <课程文件夹绝对路径> [章节前缀,逗号分隔] [--fast]
//   --fast 只跑静态检查（1–4），不开浏览器。
// 检查项：
//   1 语法：课程里每个 .js / .mjs（lib/、node_modules/ 除外）跑 node --check；每页内联 <script> 用 new Function 试编译
//   2 接线：JS 去找的 vl- 类名，页面和脚本里有没有造出来；HTML 里写的 vl- 类名没有样式也没被脚本用到时只提示
//   2b 凸显：每张概念卡的名字，正文里要有同名起名标记 .vl-cn，所在分节的小标题要写出它
//   2c 先讲后用（只提示）：概念在正文里第一次起名之前，互动台标题、试试看、按钮、先猜后揭晓的题干里就出现了它的名字
//   2d 负荷（只提示）：一个 <p> 里有 ≥2 个第一次出现的 .vl-term / .vl-cn；一个 <p> 里数字超过 6 个
//   3 配图密度：两个视觉元素之间的正文超过 220 字、单段 <p> 超过 160 字就报（框里的文字也算；默认收起的 <details> 不算；
//     小互动 vl-guess / vl-flip / vl-philo / vl-hot、活图 vl-plot 也算视觉）
//   4 链接：href / src 指向的本地文件是否存在
//   5 运行：调用同目录 qa.mjs，420 和 1100 宽度下点遍按钮、拖遍滑块，报 JS 错误、横向溢出、图内文字压线
//   6 截图：每页 420、1100 各截一张整页图，存到 %TEMP%/course-check-shots/<课程文件夹名>/，打印路径——必须用 Read 打开看（脚本看不出好不好看）
// 依赖：Node 22+、Edge 或 Chrome（同 qa.mjs，找浏览器的规则见 browser.mjs，可用环境变量 EDGE_PATH 指定）。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const FAST = args.includes("--fast");
const [ROOT, onlyArg] = args.filter(a => !a.startsWith("--"));
if (!ROOT || !path.isAbsolute(ROOT)) { console.error("用法：node check.mjs <课程文件夹绝对路径> [ch01,ch02] [--fast]（必须绝对路径）"); process.exit(1); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ONLY = onlyArg ? onlyArg.split(",") : null;
const read = f => fs.readFileSync(f, "utf8");
const walk = (d, ext) => !fs.existsSync(d) ? [] : fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === "lib" || e.name === "node_modules" ? [] : walk(path.join(d, e.name), ext)) : e.name.endsWith(ext) ? [path.join(d, e.name)] : []);
const pages = [ROOT, path.join(ROOT, "en")].flatMap(d => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith(".html") && !f.startsWith("_")).map(f => path.join(d, f)) : []).filter(p => !ONLY || ONLY.some(o => path.basename(p).startsWith(o)));
let bad = 0;
const fail = (tag, msg) => { bad++; console.log(`  ✗ [${tag}] ${msg}`); };

// 1 语法
console.log("1 语法");
for (const f of [...walk(ROOT, ".js"), ...walk(ROOT, ".mjs")]) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) fail("语法", path.relative(ROOT, f) + "：" + (r.stderr.split("\n").find(l => /Error/.test(l)) || r.stderr).trim());
}
for (const p of pages) {
  const html = read(p);
  [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:application\/(?:ld\+)?json|text\/template)")[^>]*>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
    try { new Function(m[1]); } catch (e) { fail("语法", `${path.relative(ROOT, p)} 第 ${i + 1} 段内联脚本：${e.message}`); }
  });
}

// 2 接线
console.log("2 接线（vl- 类名）");
const linked = re => pages.flatMap(p => [...read(p).matchAll(re)].map(m => path.resolve(path.dirname(p), decodeURI(m[1]))).filter(f => fs.existsSync(f)));
const cssText = [...new Set([...walk(ROOT, ".css"), ...linked(/<link[^>]+href="([^"#?]+\.css)"/g)])].map(read).join("\n");
const defined = new Set([...cssText.matchAll(/\.(vl-[\w-]+)/g)].map(m => m[1]));
const jsText = [...new Set([...walk(ROOT, ".js"), ...linked(/<script[^>]+src="([^"#?]+\.js)"/g)])].map(read).join("\n");
// 只报"JS 去找、但哪里都没造出来"的类：这种必定是拼错或改名没同步。
const selStr = [...jsText.matchAll(/(?:querySelector(?:All)?|closest|matches)\(\s*(['"`])([^'"`]*)\1/g)].map(m => m[2]).join(" ");
const jsSelected = new Set([...selStr.matchAll(/\.(vl-[\w-]*\w)/g)].map(m => m[1]));
const made = new Set();
for (const p of pages) for (const m of read(p).matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => made.add(c));
for (const m of jsText.matchAll(/(?:class(?:Name)?\s*[=:]\s*|classList\.(?:add|toggle)\(\s*|class=\?["'])(['"`]?)([^'"`)]*)/g)) m[2].split(/[\s'"+]+/).forEach(c => made.add(c));
for (const m of jsText.matchAll(/['"`](vl-[\w-]*\w)['"`]/g)) made.add(m[1]);
for (const m of jsText.matchAll(/(vl-[\w-]*\w)/g)) if (jsText.includes(m[1] + '"') || jsText.includes(m[1] + " ")) made.add(m[1]);
if (defined.size === 0) console.log("  · CSS 里没有 vl- 类，跳过（不是用 course-kit 搭的课？）");
else {
  [...jsSelected].filter(c => !made.has(c) && !defined.has(c)).slice(0, 20).forEach(c => fail("接线", `JS 去找 .${c}，但页面和脚本里都没有造出它（拼错或改名没同步）`));
  const htmlBare = [];
  for (const p of pages) for (const m of read(p).matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c.startsWith("vl-") && !defined.has(c) && !jsText.includes(c)) htmlBare.push(`${path.basename(p)} .${c}`);
  if (htmlBare.length) console.log("  · 提示（不算错）：这些类没有样式也没被脚本用到，确认是不是写错：" + [...new Set(htmlBare)].slice(0, 12).join("、"));
}

// 2b 概念凸显：每张写了名字的概念卡，正文里要有同名的起名标记 .vl-cn，所在分节的小标题要写出这个名字
console.log("2b 概念凸显（起名标记 + 小标题 + 概念卡）");
const strip = s => s.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/\s+/g, " ").trim();
for (const p of pages) {
  const html = read(p);
  const cns = [...html.matchAll(/class="[^"]*\bvl-cn\b[^"]*"[^>]*>([\s\S]*?)<\//g)].map(m => strip(m[1]));
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => strip(m[1]));
  for (const m of html.matchAll(/class="[^"]*\bvl-cc-name\b[^"]*"[^>]*>([\s\S]*?)<\/(?:p|h3|div|span)>/g)) {
    const name = strip(m[1]); if (!name || name.startsWith("【") || name.startsWith("[")) continue; // 模板占位不查
    const lc = s => s.toLowerCase();
    if (!cns.some(c => lc(c).includes(lc(name)) || lc(name).includes(lc(c)) && c.length >= 2)) fail("凸显", `${path.basename(p)} 概念卡「${name}」：正文里没有起名标记 <span class="vl-cn">${name}</span>`);
    if (!h2s.some(h => lc(h).includes(lc(name)))) fail("凸显", `${path.basename(p)} 概念卡「${name}」：没有哪个小标题写出这个名字`);
  }
}

// 2c 先讲后用、2d 负荷：都只提示，不算错（先看误报多不多再决定要不要升级）
const hint = (tag, msg) => console.log(`  · 提示（不算错）[${tag}] ${msg}`);
const mainOf = html => { const m = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, m => " ".repeat(m.length)).match(/<main[\s\S]*<\/main>/); return m ? m[0] : ""; }; // 注释和脚本换成等长空格，下标不变
console.log("2c 先讲后用（提示：概念起名之前，互动标题、试试看、按钮、先猜后揭晓的题干里就出现了它）");
for (const p of pages) {
  const html = mainOf(read(p));
  const named = new Map(); // 名字 → 第一次被起名的位置（.vl-cn 起名标记或概念卡）
  for (const m of html.matchAll(/class="[^"]*\b(?:vl-cn|vl-cc-name)\b[^"]*"[^>]*>([\s\S]*?)<\//g)) {
    const name = strip(m[1]).toLowerCase();
    if (name.length < 2 || name.startsWith("【") || name.startsWith("[")) continue;
    if (!named.has(name) || named.get(name) > m.index) named.set(name, m.index);
  }
  const tasks = []; // { 位置, 种类, 文字 }
  for (const m of html.matchAll(/class="[^"]*\bvl-board\b[^"]*"[^>]*>\s*(?:<[^h>][^>]*>\s*)*<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/g)) tasks.push({ at: m.index, kind: "互动台标题", text: strip(m[1]) });
  for (const m of html.matchAll(/<p\b[^>]*class="[^"]*\bvl-try\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)) tasks.push({ at: m.index, kind: "试试看", text: strip(m[1]) });
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) tasks.push({ at: m.index, kind: "按钮", text: strip(m[1]) });
  for (const m of html.matchAll(/<p\b[^>]*class="[^"]*\bvl-q\b[^"]*"[^>]*>([\s\S]*?)<\/p>/g)) tasks.push({ at: m.index, kind: "先猜后揭晓的题干", text: strip(m[1]) });
  const out = [];
  for (const [name, first] of named) for (const t of tasks) if (t.at < first && t.text.toLowerCase().includes(name)) out.push(`${path.basename(p)} 「${name}」在第一次起名之前出现在${t.kind}里：「${t.text.slice(0, 20)}」`);
  out.slice(0, 8).forEach(o => hint("先讲后用", o));
}

console.log("2d 负荷（提示：一段里有两个第一次出现的术语或概念名；一段里数字超过 6 个）");
for (const p of pages) {
  const html = mainOf(read(p));
  const paras = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({ from: m.index, to: m.index + m[0].length, text: strip(m[1]), fresh: [] }));
  const seen = new Set();
  for (const m of html.matchAll(/<span\b[^>]*class="[^"]*\b(?:vl-term|vl-cn)\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g)) {
    const name = strip(m[1]).toLowerCase(); if (!name || seen.has(name)) continue;
    seen.add(name);
    const para = paras.find(q => m.index >= q.from && m.index < q.to); if (para) para.fresh.push(name);
  }
  const out = [];
  for (const q of paras) {
    if (q.fresh.length >= 2) out.push(`${path.basename(p)} 一段里有 ${q.fresh.length} 个第一次出现的术语或概念（${q.fresh.join("、")}）：「${q.text.slice(0, 14)}…」`);
    const nums = (q.text.match(/\d+(?:\.\d+)?/g) || []).length;
    if (nums > 6) out.push(`${path.basename(p)} 一段里有 ${nums} 个数字，要记的数放进表或图里：「${q.text.slice(0, 14)}…」`);
  }
  out.slice(0, 8).forEach(o => hint("负荷", o));
}

// 3 配图密度
console.log("3 配图密度（两个视觉之间 >220 字；单段 >160 字）");
const VISUAL = /<(img|svg|canvas|figure|video|iframe)\b|data-illus|data-diagram|class="[^"]*\bvl-(board|dg|fig|eg|cc-fig|illus|photo|comic|guess|flip|philo|hot|plot)\b/; // 小互动（先猜后揭晓、翻牌、立场卡、热区）也算视觉
for (const p of pages) {
  let html = read(p).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "<svg></svg>").replace(/<details\b[\s\S]*?<\/details>/g, "").replace(/<div class="vl-goals"[\s\S]*?<\/ul>\s*<\/div>/g, ""); // 默认收起的故事框、支线由读者自选展开；学习目标属于题头：都不算进配图密度
  const en = /<html[^>]*lang="en/.test(read(p));
  const m = html.match(/<main[\s\S]*<\/main>/); if (m) html = m[0];
  let run = 0, from = "";
  const hits = [];
  for (const tok of html.split(/(<[^>]+>)/)) {
    if (tok.startsWith("<")) {
      if (VISUAL.test(tok)) { if (run > 220) hits.push(`${run} 字：「${from}…」`); run = 0; from = ""; }
      continue;
    }
    const raw = tok.replace(/&[a-z#0-9]+;/g, " ").trim();
    if (!raw) continue;
    if (!from) from = raw.slice(0, 14);
    run += en ? Math.round(raw.split(/\s+/).length * 1.5) : raw.replace(/\s+/g, "").length; // 英文按词数×1.5 折成"字"
  }
  if (run > 220) hits.push(`${run} 字（到页尾）：「${from}…」`);
  hits.slice(0, 8).forEach(h => fail("配图", `${path.basename(p)} ${h}`));
  const long = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => strip(m[1])).map(t => [t, en ? Math.round(t.split(/\s+/).filter(Boolean).length * 1.5) : t.replace(/\s+/g, "").length]).filter(([, n]) => n > 160);
  long.slice(0, 8).forEach(([t, n]) => fail("段长", `${path.basename(p)} 一段 ${n} 字（>160，拆段或配图）：「${t.slice(0, 14)}…」`));
}

// 4 链接
console.log("4 本地链接");
for (const p of pages) {
  for (const m of read(p).matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:|javascript:|\/\/)/.test(u) || u.includes("${")) continue;
    if (!fs.existsSync(path.resolve(path.dirname(p), decodeURI(u)))) fail("链接", `${path.basename(p)} → ${u} 不存在`);
  }
}

if (!FAST && !pages.length) console.log("5–6 运行与截图：这个文件夹（和 en/）里没有 .html 页面，跳过");
else if (!FAST) {
  // 5 运行
  console.log("5 运行（qa.mjs）");
  const r = spawnSync(process.execPath, [path.join(HERE, "qa.mjs"), ROOT, ...(onlyArg ? [onlyArg] : [])], { encoding: "utf8", timeout: 600000 });
  const out = (r.stdout || "") + (r.stderr || "");
  out.split("\n").filter(l => l.trim()).forEach(l => { if (l.startsWith("✗")) bad++; console.log("  " + l); });
  if (!/[✓✗]/.test(out)) fail("运行", "qa.mjs 没有输出结果（路径对吗？浏览器找得到吗？可设 EDGE_PATH）");

  // 6 截图
  console.log("6 截图（必须用 Read 打开看）");
  const shotDir = path.join(process.env.TEMP || process.env.TMPDIR || ROOT, "course-check-shots", path.basename(ROOT)); // 按课程分目录，并行跑多门课时不互相覆盖
  fs.mkdirSync(shotDir, { recursive: true });
  for (const p of pages) for (const w of [420, 1100]) {
    const png = path.join(shotDir, `${path.basename(path.dirname(p)) === "en" ? "en-" : ""}${path.basename(p, ".html")}-${w}.png`);
    spawnSync(process.execPath, [path.join(HERE, "shot.mjs"), p, png, "page", String(w)], { encoding: "utf8", timeout: 120000 });
    console.log("  " + (fs.existsSync(png) ? png : "✗ 截图失败：" + png));
  }
  console.log("  长图先切成约 1600px 高的段再看；单张插图/图解用 shot.mjs 的选择器截单个元素放大看。");
}

console.log(bad ? `\n共 ${bad} 处问题。修完重跑。` : "\n静态与运行检查都通过。别忘了看截图。");
process.exit(bad ? 1 : 0);
