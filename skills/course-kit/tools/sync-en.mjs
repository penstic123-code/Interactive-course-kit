// 把中文版 course-kit 的代码同步到英文版 course-kit-en（两份 skill 共用同一套代码，文档各写各的）。
// 用法：node sync-en.mjs          改完 kit/ skins/ tools/ starter/ 后跑一次
//       node sync-en.mjs --check  只比较，不复制；有差异时退出码 1
// 只同步这四个代码目录；SKILL.md 和 references/ 是两种语言各自的文档，不同步，改规则时两边手动对应修改。
// 例外：这些说明文档（API 文档、起步说明、皮肤说明、概念数据说明）英文版另有译本，同步时跳过，--check 也不算差异（见 SKIP）。
//       改了中文的这些文档后，要同步改英文版 course-kit-en 里的同名文件。
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ZH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EN = path.join(path.dirname(ZH), "course-kit-en");
const DIRS = ["kit", "skins", "tools", "starter"];
const CHECK = process.argv.includes("--check");
const SKIP = new Set([
  "kit/README.md", "kit/modules/concepts-schema.md", "starter/README.md",
  "skins/notebook/README.md", "skins/paper/README.md", "skins/pixel/README.md", "skins/fieldbook/README.md",
]);   // 两种语言各写各的，不同步（路径相对 skill 根目录，用 / 分隔）
const skip = (root, f) => SKIP.has(path.relative(root, f).split(path.sep).join("/"));
if (!fs.existsSync(EN)) { console.error("找不到 " + EN); process.exit(1); }

const list = d => !fs.existsSync(d) ? [] : fs.readdirSync(d, { withFileTypes: true }).filter(e => e.name !== "__pycache__" && !e.name.endsWith(".pyc")).flatMap(e => e.isDirectory() ? list(path.join(d, e.name)) : [path.join(d, e.name)]);
const hash = f => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex");
let changed = 0, removed = 0;
for (const dir of DIRS) {
  const src = path.join(ZH, dir), dst = path.join(EN, dir);
  for (const f of list(src)) {
    if (skip(ZH, f)) continue;
    const t = path.join(dst, path.relative(src, f));
    if (fs.existsSync(t) && hash(t) === hash(f)) continue;
    changed++; console.log((CHECK ? "不同 " : "复制 ") + path.relative(ZH, f));
    if (!CHECK) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(f, t); }
  }
  for (const t of list(dst)) {
    if (skip(EN, t)) continue;
    if (fs.existsSync(path.join(src, path.relative(dst, t)))) continue;
    removed++; console.log((CHECK ? "多余 " : "删除 ") + path.relative(EN, t));
    if (!CHECK) fs.rmSync(t);
  }
}
console.log(changed + removed ? `${CHECK ? "有差异" : "已同步"}：${changed} 个文件更新，${removed} 个多余` : "两边代码一致");
process.exit(CHECK && changed + removed ? 1 : 0);
