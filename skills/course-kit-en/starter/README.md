# starter/ —— 开新课的起步模板

用途：开一门新课时，一条命令搭好共享骨架（kit + 皮肤 + 配置 + 目录页 + 第 1 章骨架 + 项目文档），然后先做样板章。组件 API 以 `kit/README.md` 为准，节奏以 `SKILL.md` 第一节为准。

## 一、一条命令

```
node <skill>/starter/new-course.mjs <课程文件夹绝对路径> <皮肤名> [--lang en] [--update-kit]
```

- 课程文件夹不存在就新建；**已有的文件一律不覆盖**（跳过并列出来）。
- `--lang en`：英文课（只有英文页）。页面、配置、插画包、本课样式取 `starter/en/` 下的同名模板（`<html lang="en">`，占位和注释是英文，界面文字自动走 kit 的英文表），项目文档生成 `course-rules.md`（来自 `course-rules.template.md`），不生成 `项目规则与经验.md`。不写就是中文课。中英双语课不用这个参数，见第五节。
- `--update-kit`：只把 `kit/` 和 `skin/` 换成 skill 里的最新版（升级用），其他文件照样不碰。
- 存档前缀 `id` 从文件夹名推出（英文小写、短横线；全是中文时用 `course`），生成后在 `js/course.js` 里核对一次，上线后不要再改。

## 二、生成了什么

| 课程里的路径 | 来自 | 课程里改不改 |
|---|---|---|
| `kit/` | skill 的 `kit/`（不含 `demo.html`、`demo-en.html` 和 `demo/` 演示） | **不改**：升级时整个覆盖 |
| `skin/` | skill 的 `skins/<皮肤名>/`（不含 `gallery.html`） | **不改**：本课的调整写进 `css/style.css` |
| `css/style.css` | `starter/style.css` | 本课共享样式（content-rules.md 第五节的“共享样式”） |
| `js/course.js` | `starter/course.config.js` | 章节表、篇章、开放章、语言、学习路径、模块开关 |
| `js/illus-ch01.js` | `starter/illus-ch01.js` | 第 1 章插画包；每章一个 `js/illus-chNN.js` |
| `index.html` | `starter/index.html` | 目录页（按篇分组的章节卡片、进度、学习路径、语言切换在顶栏） |
| `ch01-intro.html` | `starter/ch01-template.html` | 第 1 章骨架，占位写在 `【】` 和 HTML 注释里 |
| `项目规则与经验.md` | `starter/项目规则与经验.template.md` | 本课定位、数字、皮肤、模块、图片来源清单 |
| `lib/README.md` | 脚本生成 | 第三方库登记（content-rules.md 第七节） |
| `img/` | 脚本建空目录 | 真实图片 `img/chNN/英文名.jpg` |

`--lang en` 时：`css/style.css`、`js/course.js`、`js/illus-ch01.js`、`index.html`、`ch01-intro.html` 改取 `starter/en/` 下的同名文件（占位写在 `[Fill in: …]` 里；`css/style.css` 多一条隐藏语言按钮的规则，因为英文页的顶栏总会显示“中文”按钮，而纯英文课没有中文页）；`项目规则与经验.md` 换成 `course-rules.md`（来自 `starter/course-rules.template.md`）；`lib/README.md` 是英文的。

和 content-rules.md 第五节的对应：`css/style.css`、`js/` 下的配置与插图包、`lib/`、`en/` 都照第五节放；第五节里的 `js/common.js`（共享脚本）现在由 `kit/vl.js` 等担任，不再每门课各写一份；皮肤从 `css/style.css` 里分出来，放在 `skin/`。

kit 里有互动组件 `vl-interact.js / .css`（皮肤带 `interact.css` 时也算）时，脚本把它们的 `<link>` / `<script>` 写进模板里 `<!--VL:EXTRA-CSS-->`、`<!--VL:EXTRA-JS-->` 的位置；`kit/modules/` 里的可选模块只在注释里列出来，因为各自的加载位置不同（如 `vl-concepts.js` 要在 `vl.js` 之前），选了哪个按 `kit/README.md 第八节` 手动加。

## 三、开课步骤

1. 和用户定主题、读者、篇章（content-rules.md 第八节第 1 步），选皮肤（`references/skin-contract.md` 末尾一览）和可选模块。
2. 跑 `new-course.mjs`。
3. 改 `js/course.js`：`id`、`title`、`CH`（章名 / 英文名 / 文件名 / 一句话）、`OPEN`、`PARTS`、`PATHS`、`MODULES`。
4. 填 `项目规则与经验.md` 第一、四、五、六节。
5. 改目录页 `index.html` 的副标题、“讲什么 / 给谁读 / 学完能”、题头插画。
6. **先做样板章**：把 `ch01-intro.html` 的占位全部填掉（正文按 `zh-teaching-prose`），插画画进 `js/illus-ch01.js`，给用户确认写作、版式、节奏，再铺开。新章复制样板章改，不复制空模板（空模板只是第一次用）。
7. 每章交付前跑检查（`SKILL.md` 第七节）：

   ```
   node <skill>/tools/check.mjs <课程文件夹绝对路径> ch01 --fast    # 修到 0
   node <skill>/tools/check.mjs <课程文件夹绝对路径> ch01           # 修到 0，再用 Read 打开打印出来的截图看
   ```

   新课刚生成时会看到很多虚线插画占位框（写着插画名），那是提醒，不是错误；交付前一个都不能剩。

## 四、新增一章

1. 在 `js/course.js` 的 `CH` 里加一项，写好的章号加进 `OPEN`。
2. 复制样板章为 `chNN-英文短横线.html`，改 `<body data-ch="N">`、`<title>`、`js/illus-chNN.js` 的引用，页内类名前缀改成 `cN-`。
3. 新建 `js/illus-chNN.js`，插画名前缀 `cNN-`。
4. 跑检查。调整顺序、改编号走 content-rules.md 第五节的重映射流程。

## 五、英文课与中英双语课

| 课程 | 怎么开 | 页面在哪 |
|---|---|---|
| 纯中文 | 默认 | 课程根目录 |
| 纯英文 | `--lang en` | 课程根目录（`<html lang="en">`） |
| 中英双语 | 默认（先做中文），中文定稿后再加 `en/` | 中文在根目录，英文在 `en/` 同名文件 |

**界面文字**：kit 按 `<html lang>` 取语言，`lang="en"` 的页面自动用 `kit/vl.js`、`kit/vl-interact.js` 里的英文表（顶栏、试试看、概念卡小签、展开 / 收起、测验按钮、图解提示……）。课程要改某条界面文字，写在 `js/course.js` 的 `window.VL_I18N.en`。英文演示页 `kit/demo-en.html`。

**双语课的 `en/` 页**（content-rules.md 第六节）：
1. 复制 `starter/en/ch01-template.html` 或对应的中文章，放进 `en/`，文件名和中文页**完全相同**；`<html lang="en">`。
2. 资源路径都加一层 `../`：`../kit/vl.css`、`../skin/skin.css`、`../css/style.css`、`../js/course.js`、`../kit/vl.js`、`../js/illus-chNN.js`……章节链接不加（`en/` 里互相链接）。
3. 共用同一份 `js/course.js`：章节表里每章写好 `zh` 和 `en`，篇章写 `en`，目录页的一句话写 `descEn`、学习路径写 `nameEn` / `whoEn`。目录页英文版 `en/index.html` 用 `starter/en/index.html` 改路径。
4. **不要**复制 `starter/en/style.css` 里隐藏语言按钮的那条规则（那是纯英文课用的）。顶栏语言按钮：中文页在 `enReady: true` 之前隐藏，英文页一直显示并指向 `../同名文件`。全部英文页做完再把 `enReady` 改成 `true`。
5. **进度和笔记两种语言共用**：存档键是 `<id>-…` 加文件名，不带语言，所以 `en/ch03-x.html` 和 `ch03-x.html` 读写同一份进度、试试看、笔记、收起状态。因此 id、文件名、`data-save`、`data-try` 两边必须一致，改一边就要改另一边。
6. 插画包可以共用（文字层写成按 `VL.lang` 取中英文），也可以英文另建 `js/illus-chNN-en.js`。
7. 检查：`check.mjs` 会连 `en/` 一起查，跑法不变。

### In English (for English-only courses)

Run `node <skill>/starter/new-course.mjs <absolute course folder> <skin> --lang en`. You get English pages (`index.html`, `ch01-intro.html`) whose placeholders read `[Fill in: …]`, an English `js/course.js` (write each chapter name in `en`, and the same text in `zh` as a fallback; one-line descriptions go in `descEn`), an English picture pack, a `css/style.css` that hides the language button (there is no Chinese edition to switch to), and `course-rules.md` for this course's own decisions. All kit UI text (top bar, "Try it", card labels, open / close, quiz buttons, diagram hints) switches to English on its own because the pages say `<html lang="en">`; to change any of it, add keys to `window.VL_I18N.en` in `js/course.js`. Write the prose with `en-teaching-prose`. Then follow the steps in sections 3 and 4: edit the chapter list, fill in `course-rules.md`, finish the sample chapter, and run `tools/check.mjs` until it reports 0. For a course with both Chinese and English pages, see the table above: Chinese pages live in the course root, English pages with the same file names live in `en/`, load assets via `../kit`, `../skin`, `../css`, `../js`, and share progress and notes with the Chinese pages.
