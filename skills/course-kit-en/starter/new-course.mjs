// 开新课：把 kit 和所选皮肤复制进课程目录，生成配置、目录页、第 1 章骨架、项目文档。已有文件一律不覆盖。
// 用法：node new-course.mjs <课程文件夹绝对路径> <皮肤名> [--lang en] [--update-kit]
//   皮肤名必填（notebook / paper / pixel / fieldbook），没有默认值；不写或写错时列出现有皮肤并退出。
//   --lang en：英文课（页面模板取 starter/en/，项目文档用 course-rules.template.md）；默认中文。中英双语课的做法见 README.md 第五节。
//   --update-kit：只把 kit/ 和 skin/ 换成 skill 里的最新版（升级用），其他文件照样不碰。
// 说明见同目录 README.md。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const UPDATE = args.includes("--update-kit");
// --lang en 或 --lang=en；跟在 --lang 后面的值不算位置参数
const li = args.findIndex(a => a === "--lang" || a.startsWith("--lang="));
const LANG = li < 0 ? "zh" : (args[li].includes("=") ? args[li].split("=")[1] : args[li + 1] || "").toLowerCase();
if (!["zh", "en"].includes(LANG)) { console.error(`--lang 只认 zh 或 en，收到 "${LANG}"`); process.exit(1); }
const EN = LANG === "en";
const [DEST, SKIN] = args.filter((a, i) => !a.startsWith("--") && !(li >= 0 && args[li] === "--lang" && i === li + 1));
if (!DEST || !path.isAbsolute(DEST)) { console.error("用法：node new-course.mjs <课程文件夹绝对路径> <皮肤名> [--lang en] [--update-kit]（必须绝对路径）"); process.exit(1); }
if (!SKIN) { // 皮肤由用户选，不给默认值（SKILL.md 第六节：开课先问美术风格）
  const dir = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "skins");
  console.error("请指定皮肤名（先问用户要哪套）。现有：" + (fs.existsSync(dir) ? fs.readdirSync(dir).join("、") : "无")); process.exit(1);
}
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.dirname(HERE);
const KIT = path.join(SKILL, "kit"), SKINDIR = path.join(SKILL, "skins", SKIN);
if (!fs.existsSync(SKINDIR)) {
  const have = fs.existsSync(path.join(SKILL, "skins")) ? fs.readdirSync(path.join(SKILL, "skins")).join("、") : "无";
  console.error(`没有皮肤 "${SKIN}"。现有：${have}`); process.exit(1);
}

const made = [], skipped = [], updated = [];
const rel = f => path.relative(DEST, f).replace(/\\/g, "/");
function put(dest, content) {   // 写一个文件；已有就跳过
  if (fs.existsSync(dest)) { skipped.push(rel(dest)); return false; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  made.push(rel(dest)); return true;
}
function copyTree(src, dest, skip, overwrite) {   // 递归复制目录；overwrite = 升级模式
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) { copyTree(s, d, skip, overwrite); continue; }
    if (overwrite && fs.existsSync(d)) { fs.copyFileSync(s, d); updated.push(rel(d)); continue; }
    if (fs.existsSync(d)) { skipped.push(rel(d)); continue; }
    fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); made.push(rel(d));
  }
}

fs.mkdirSync(DEST, { recursive: true });
// 1 kit（不带演示页）和皮肤（不带验收页：两者的引用路径按 skill 目录写，放进课程会断）
copyTree(KIT, path.join(DEST, "kit"), ["demo.html", "demo-en.html", "demo-interact.html", "demo-diagrams.html", "demo", "demo-ch01.html", "demo-ch02.html", "demo-ch03.html", "demo-modules.html"], UPDATE);
copyTree(SKINDIR, path.join(DEST, "skin"), ["gallery.html"], UPDATE);

if (UPDATE) {
  console.log(`升级 kit/ 与 skin/（皮肤 ${SKIN}）：覆盖 ${updated.length} 个，新增 ${made.length} 个。`);
  [...updated, ...made].forEach(f => console.log("  " + f));
  process.exit(0);
}

// 2 kit 里有的可选组件，写进模板的占位注释
const exists = f => fs.existsSync(path.join(DEST, "kit", f));
const extraCss = [], extraJs = [];
// 互动组件：结构样式在皮肤之后、本课样式之前；皮肤若带 interact.css（互动组件的外观）紧跟其后
if (exists("vl-interact.css")) extraCss.push('<link rel="stylesheet" href="kit/vl-interact.css">');
if (fs.existsSync(path.join(DEST, "skin", "interact.css"))) extraCss.push('<link rel="stylesheet" href="skin/interact.css">');
// 概念图解的皮肤样式（tree、spectrum 等图解靠它）和可选模块的皮肤样式
if (fs.existsSync(path.join(DEST, "skin", "diagrams.css"))) extraCss.push('<link rel="stylesheet" href="skin/diagrams.css">');
if (exists("vl-interact.js")) extraJs.push('<script src="kit/vl-interact.js"></script>');
// 可选模块不自动加载：加载顺序各不相同（如 vl-concepts.js 要在 vl.js 之前），只列出来，按 kit/README.md 第八节 手动加
if (exists("modules")) {
  const mods = fs.readdirSync(path.join(DEST, "kit", "modules")).filter(f => /\.(js|css)$/.test(f)).sort();
  if (mods.length) extraJs.push(EN
    ? `<!-- Optional modules (kit/modules/: ${mods.join(", ")}): switches are in "modules" in js/course.js; where and in what order to load them: kit/README.md, section 8 -->`
    : `<!-- 可选模块（kit/modules/：${mods.join("、")}）：开关见 js/course.js 的 modules，加载位置和顺序见 kit/README.md 第八节 -->`);
}
const fill = html => html
  .replace("<!--VL:EXTRA-CSS-->", extraCss.length ? extraCss.join("\n") : "<!--VL:EXTRA-CSS-->")
  .replace("<!--VL:EXTRA-JS-->", extraJs.length ? extraJs.join("\n") : "<!--VL:EXTRA-JS-->");
// 英文课：starter/en/ 下有同名模板就用它
const tpl = f => fs.readFileSync(EN && fs.existsSync(path.join(HERE, "en", f)) ? path.join(HERE, "en", f) : path.join(HERE, f), "utf8");

// 3 配置：id 从文件夹名推出
const base = path.basename(DEST);
const id = (base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-course$/, "") || "course").slice(0, 24);
put(path.join(DEST, "js", "course.js"), tpl("course.config.js").replace('id: "mycourse"', `id: "${id}"`));
put(path.join(DEST, "js", "illus-ch01.js"), tpl("illus-ch01.js"));
put(path.join(DEST, "css", "style.css"), tpl("style.css"));

// 4 页面
put(path.join(DEST, "index.html"), fill(tpl("index.html")));
put(path.join(DEST, "ch01-intro.html"), fill(tpl("ch01-template.html")));

// 5 项目文档、库登记、图片目录
if (EN) put(path.join(DEST, "course-rules.md"), tpl("course-rules.template.md").replace("[Course name]", base).replace("[notebook]", SKIN));
else put(path.join(DEST, "项目规则与经验.md"), tpl("项目规则与经验.template.md").replace("【课程名】", base).replace("【notebook】", SKIN));
if (EN) put(path.join(DEST, "lib", "README.md"), "# lib/ third-party libraries\n\nPurpose: third-party libraries this course uses (downloaded locally, pinned versions; content-rules.md, section 7). Leave the table empty if there are none.\n\n| Name | Purpose | Version | Licence | Used on |\n|---|---|---|---|---|\n");
else put(path.join(DEST, "lib", "README.md"), "# lib/ 第三方库登记\n\n用途：本课用到的第三方库（下载到本地、固定版本，content-rules.md 第七节）。没有就留空表。\n\n| 名称 | 用途 | 版本 | 协议 | 用在哪些页 |\n|---|---|---|---|---|\n");
fs.mkdirSync(path.join(DEST, "img"), { recursive: true });

console.log(`新课：${DEST}（皮肤 ${SKIN}，语言 ${LANG}，存档前缀 id = "${id}"）`);
console.log(`新建 ${made.length} 个文件：`);
made.filter(f => !/^(kit|skin)\//.test(f)).forEach(f => console.log("  + " + f));
console.log(`  + kit/、skin/ 共 ${made.filter(f => /^(kit|skin)\//.test(f)).length} 个`);
if (skipped.length) { console.log(`已有、没有覆盖的 ${skipped.length} 个：`); skipped.forEach(f => console.log("  = " + f)); }
if (EN) console.log(`\nNext: edit the chapter list in js/course.js → fill in course-rules.md → write the sample chapter ch01-intro.html → node "${path.join(SKILL, "tools", "check.mjs")}" "${DEST}" --fast`);
else console.log(`\n下一步：改 js/course.js 的章节表 → 填 项目规则与经验.md → 做样板章 ch01-intro.html → node "${path.join(SKILL, "tools", "check.mjs")}" "${DEST}" --fast`);
