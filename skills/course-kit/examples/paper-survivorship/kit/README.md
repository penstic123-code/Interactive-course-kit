# kit/ —— 共享组件代码（API 唯一权威说明）

用途：与皮肤无关的结构、交互、无障碍代码。颜色、字体、描边、纹理全在 `skins/<名>/skin.css`。类名前缀 `vl-`，JS 命名空间 `window.VL`。

## 一、文件与引入顺序

| 文件 | 放哪 | 做什么 |
|---|---|---|
| `vl.css` | `<head>` | 结构样式：布局、栅格、图文并排、轮播、折叠、浮层、打印、减少动态 |
| `skins/<名>/skin.css` | `<head>`，vl.css 之后 | 皮肤：变量 + 组件外观 |
| `skins/<名>/skin.js` | `<head>` | 声明 `window.VL_SKIN`（网络字体、SVG 滤镜、插画配色） |
| `vl-head.js` | `<head>`，skin.js 之后 | 首屏前套用读者的配色和动效档位；异步插入网络字体 `<link>` |
| `js/course.js`（课程自己写） | `</main>` 后，vl.js 之前 | `window.VL_COURSE` 章节表等配置 |
| `vl.js` | `</main>` 之后 | 顶栏、分节、轮播、术语、各组件、测验、笔记、翻页 |
| `diagrams.js` | vl.js 之后 | 12 种概念图解（第九节） |
| `vl-interact.js` + `vl-interact.css` | vl.js 之后 / `<head>` | 互动组件（第七节）；皮肤外观 `skin/interact.css` |
| `modules/*.js` + `modules/modules.css` | 见第八节（`vl-concepts.js` 要在 vl.js 之前） | 可选模块；皮肤外观 `skin/modules.css` |
| `illus.js` | vl.js 之后 | 插画装载 + 火柴人工具 |
| `js/illus-chNN.js` | illus.js 之后 | 本章插画包（`VL.illus.add`） |
| 页内 `<script>` | 最后 | 本章互动；可直接调 `VL.*` |

插画装载和图号在 `DOMContentLoaded` 时做，所以插画包、页面脚本里注册的图都能装上。

```html
<link rel="stylesheet" href="kit/vl.css">
<link rel="stylesheet" href="skin/skin.css">
<script src="skin/skin.js"></script>
<script src="kit/vl-head.js"></script>
...
<body data-ch="2"><main class="vl-wrap">…</main>
<script src="js/course.js"></script>
<script src="kit/vl.js"></script>
<script src="kit/diagrams.js"></script>
<script src="kit/illus.js"></script>
<script src="js/illus-ch02.js"></script>
<script>/* 本章互动 */</script>
```
开新课：用 `starter/new-course.mjs <课程文件夹绝对路径> <皮肤名> [--lang en]` 生成（皮肤名必填：notebook / paper / pixel / fieldbook）（会把 `kit/` 复制成 `课程/kit/`、皮肤复制成 `课程/skin/`），见 `starter/README.md`。演示页（引用路径按 skill 目录写）：`demo.html` 基础组件、`demo-interact.html` 互动组件、`demo-diagrams.html` 12 种图解、`demo-en.html` 英文页、`modules/demo-modules.html` 可选模块。

## 二、配置

```js
window.VL_COURSE = {
  id: "gdc",                 // 存档前缀：课程数据存在 <id>-progress、<id>-try、<id>-note-…、<id>-side-…
  home: "index.html",        // 目录页
  enReady: false,            // 英文版做完才改 true，才显示语言按钮（之前按钮 hidden 占位）
  enDir: "en/",              // 英文页目录（英文页自己回 ../同名文件）
  topbar: true,              // false = 不要顶栏
  chapters: [                // 第 n 章 = 第 n 项；也可写成 ["中文名","文件","English"]
    { zh: "什么是游戏", en: "What Is a Game", file: "ch01-what-is-a-game.html" },
    { zh: "玩家动机", en: "Player Motivation", file: "ch03-…html", open: false },   // open:false = 还在写，不给链接
  ],
  parts: [{ zh: "一、认识游戏", en: "I. Understanding Games", from: 1, to: 5 }],
};
window.VL_I18N = { zh: { "cc.tag": "关键词" }, en: { "cc.tag": "Key idea" } };   // 可选：覆盖界面文字
```
- 章节页写 `<body data-ch="N">`（不写时按文件名在章节表里找）。vl.js 会写 `body[data-part]`（第几篇）、`body[data-pat]`（章号 % 4，皮肤用来换纸纹）、`--vl-dh`（同篇色相微移 −18…+18）、`--vl-chnum`（两位章号，皮肤可做角标）。
- 语言：`<html lang="en">` 的页面用英文表（vl.js 里的 `EN`）。所有界面文字走 `VL.t(键, 中文默认, …参数)`，模板里 `{0}{1}` 换参数。章节表、目录页的英文字段用 `en` / `nameEn` / `descEn` / `whoEn`。
- 英文页的顶栏总有"中文"按钮，指向 `../同名文件`。纯英文课（`--lang en` 生成）在 `css/style.css` 里把它藏起来；中英双语课删掉这条规则。双语课的英文页放 `en/`，文件名、id、`data-save`、`data-try` 与中文页一致（进度和笔记两种语言共用）。
- 读者偏好不带课程前缀，跨课通用：`vl-scheme`（light / dark / sepia）、`vl-fx`（auto / full / lite / off）。写在 `<html data-scheme>` 和 `html.vl-fx-full|lite|off`。

## 三、组件写法

### 导航（自动生成，不用写）
- **顶栏** `header.vl-topbar`：回目录、章节点（宽屏，按篇着色，读懂的章变色）、"第 N / 共 M 章"按钮（弹层列出全部章，手机上也能跳章）、"显示"按钮（配色 亮/暗/护眼，动效 自动/全开/轻量/关）、语言按钮。弹层 Esc / 点外面关闭，焦点回按钮。
- **分节**：`<div class="vl-sec"><h2>具体场景式小标题</h2></div>`，直到下一个 `.vl-sec` 或 `.vl-pager` 的内容自动收进 `.vl-sec-body`。节号 `.vl-n` 自动加。点标题 / Enter / 空格折叠；小标题不挂层级标签。
- **章内目录 + 阅读进度**：分节 ≥2 时自动出现右下浮钮 `.vl-fab` → 面板（当前节 = 顶边过视口 35%，全部展开/收起，回顶部）；顶端进度条 `.vl-readbar`。进度条只是位置，**不记"读过"**。
- **章末翻页** `nav.vl-pager`：上一章 / 下一章；下一章 `open:false` 时写"第 N 章还在写"并回目录。
- 打印：分节、支线、例子、测验全部展开。

### 章首
```html
<div class="vl-hero"><div class="vl-hero-txt"><h1>核心循环</h1><p class="vl-sub">从处境出发的一句副标题</p></div><span data-illus="c02-hero"></span></div>
<div class="vl-goals"><h3>读完你能</h3><span class="vl-time">约 30 分钟</span><ul><li>…</li></ul></div>
```
徽记 `.vl-badge`（"第 N 章"）缺了自动补。

### 图文并排、栅格
`<div class="vl-withimg">图<div>文字</div></div>`：宽屏图栏 38% + 文字栏，**顶端对齐、不绕排**；`.rev` 图在右，`.narrow` 图栏 26%（人像）；≤700px 上下排。`.vl-grid2/3/4` 等宽栅格，`.vl-vs` 两栏对比（子元素加 `.bad` 表示反面）。

### 插画位（illus.js）
`<span data-illus="名字"></span>` → 内联 SVG（viewBox 200×140），自动加 `.vl-illus`；没注册的名字显示虚线占位 `.vl-illus-miss`，不报错。
```js
VL.illus.add("c02-hero", "alt：画面里有什么", k => k.ground() + k.person(60, 63, { arms: "hold", look: 1 }) + k.holding(60, 63, { look: 1 }, "phone"),
                                             k => k.T(150, 30, 14, "再来一局", "middle"));   // 第 4 参：文字层（滤镜组外）
VL.illus.svg(name)   VL.illus.mount(根节点)   VL.illus.lib
// 竖版或别的比例：第 5 参 { vb: "0 0 140 200" }（默认 "0 0 200 140"）；坐标按新画布算，地面 y 自己给 k.ground(y)
VL.illus.add("c02-face", "alt", k => k.ground(186) + k.person(70, 123, { s: 1.3 }), "", { vb: "0 0 140 200" });
```
`k`（= `VL.illus.kit`）：`person(x,y,o)`、`hands(x,y,o)`（两手坐标）、`holding(x,y,o,物件)`（物件画在两手之间）、`feetY(x,y,o)`、`ground(y=126)`、`T(x,y,字号,文字,anchor)`、`eye`、`bubble(x,y,w,h,[尾尖x,尾尖y])`、`arrow(x1,y1,x2,y2)`、`item(种类,x,y)`（book box cup phone die star coin）、`C`（配色）、`reset()`。
`person` 参数：`s` 比例；`arms` stand none up cover point hold wave chin throw club desk；`legs` stand run walk sit wide none；`face` smile grin sad flat shout o wide closed；`look` −1/0/1；`flip`；`hat` cap beanie tophat crown wizard；`hair` `glasses` `beard` `tie` `cape` `shirt`；`outfit:false`；`chair:false`；`floor`。
内置规则：坐姿自动配椅子；朝左（look<0）手臂腿自动镜像；同一张图第 k 个人依次换 无 → 鸭舌帽 → 长发 → 毛线帽 → 礼帽。旧写法 `illusAdd / illusSvg / illusKit` 仍可用。
上面是 kit 默认（notebook）的画法。画法不同的皮肤在 `skin.js` 里写钩子 `window.VL_SKIN.illus = base => ({ kit, svg, afterMount })`，换掉或补充 `k` 里的函数，接口不变（见 `illus.js`"皮肤换画法的钩子"注释、`references/skin-contract.md` 第三节）；所以各皮肤人物的脚底不一定同高，站姿的 y 用 `k.feetY(x, y, o)` 核对或按 `y = 地面y − k.feetY(x, 0, o)` 推，别写死。

### 编号图
`<figure class="vl-fig" id="fig-x">图<figcaption>图注</figcaption></figure>`：按出现顺序在图注前写"图 N"（不要手写）。正文里 `<a data-figref="fig-x" href="#fig-x">图</a>` 自动改成"图 N"。动态加图后调 `VL.figs()`。照片用 `.vl-fig.photo`。宽表 / 宽图包 `.vl-scroll`。

### 概念图解（diagrams.js）
共 12 种（全部参数见第九节），这里列最常用的五种；参数里 `nodes / layers / quads / rows` 的每项可带 `info`（点中后信息行显示的 HTML）和 `c`（色号 1–6）。
```js
VL.diagram.cycle(target, { nodes:[{name, eg, info}], center:"再来一局", numbered:true, caption, label, hint, select:true, onSelect(i, item) })
VL.diagram.nested(target, { layers:[从里到外], spin:true, caption })          // 宽屏右侧引线标签；窄屏编号对照
VL.diagram.flow(target, { nodes:[…], dir:"auto|row|column", numbered:false })  // 放得下一行就横排，否则竖排
VL.diagram.quadrant(target, { x:{name, lo, hi}, y:{name, lo, hi}, quads:[左上, 右上, 左下, 右下], points:[{x:0–1, y:0–1, label}] })
VL.diagram.compare(target, { a:{name, eg, mark:"✓"}, b:{…}, rows:[{k:"比较维度", a:"…", b:"…", info}] })
```
- `target`：`figure.vl-fig`（或选择器）；不是 figure 时在里面新建一个。`caption` 只在没有 `<figcaption>` 时用。返回 `{el, svg, redraw(), select(i), selected}`；点中派发 `vl:dgselect {i}`（再点一次取消，i = −1）。
- 声明式：`<figure class="vl-fig" data-diagram="cycle"><script type="application/json">{…}</script><figcaption>…</figcaption></figure>`。
- 节点可 Tab 聚焦，Enter / 空格选中，方向键在节点间移动；`select:false` 时整张图 `role=img`。`label` 不给就自动生成 aria-label。
- viewBox 宽 = 显示宽度，字号即屏幕字号（名字 19/17px，例子 15/14px）；先排字量包围盒再画框（内边距 ≥9px）；字体加载完、宽度变化 >24px 自动重画。
- 皮肤可用的类名、状态类见第九节"皮肤可用的类"。

### 例子轮播
```html
<div class="vl-eg" data-t="吃豆人">插画位<p><b>吃豆人：</b>…</p></div>
<div class="vl-eg bad" data-t="只有成长">插画位<p>…</p></div>
```
连续 ≥2 个 `.vl-eg` 自动合成 `.vl-egcar`：页签（`role=tablist/tab`，←→ Home End）、◀▶、横滑 50px、"1 / 3"。带图的例子宽屏两栏。反例 `.bad`：页签前加 ✗、虚线边。页签名 = `data-t`，否则取第一个 `<b>`（≤14 字）。"例子 / 反例"小签走 `VL.t`。切换派发 `vl:eg {i}`。

### 行内术语
`<span class="vl-term" data-def="一句话释义">术语</span>`：悬停 / 聚焦 / 轻点出释义框（fixed，夹在视口内，上下自动翻），Esc、滚动关闭。`data-name` 可改框里的标题。

### 概念卡（图位必有）
```html
<aside class="vl-cc">
  <p class="vl-cc-name">核心循环</p>
  <p class="vl-cc-en">Core loop</p>
  <p class="vl-cc-by">出处：谁 · 哪本书 · 年份</p>
  <p class="vl-cc-plain">通俗地说的一句</p>
  <p class="vl-cc-def">一句定义（≤60 字）</p>
  <p class="vl-cc-eg">回指正文里的那个例子</p>
  <div class="vl-cc-fig"><span data-illus="…"></span></div>   <!-- 或小 SVG，或"看图 3" -->
</aside>
```
自动补：顶边"概念卡"小签（`data-tag` 可改）、"通俗地说""例子"小签、`aria-label`。宽屏图位在右（≤240px）；窄屏（≤700px）按源码顺序排，图位写在最后就在卡底。**缺 `.vl-cc-fig` 时显示红色"缺概念图"占位并 console.warn**。

### 原理框
```html
<div class="vl-why"><h3>标题是一句原理</h3><div class="vl-why-fig">图（可选）</div><p>≤2 段</p><p class="vl-src">出处……验证：上面的××</p></div>
```
自动加"为什么成立"小签（`data-tag` 可改）；有 `.vl-why-fig` 时宽屏两栏（图 34% 在右）。

### 发明故事框 / 选读支线（默认收起）
```html
<details class="vl-story"><summary><b>具体问题式钩子标题</b><small>一句介绍：里面有什么</small></summary>…</details>
<details class="vl-side" data-kind="history|math|play|debate|source|extra|more"><summary><b>…</b><small>…</small></summary>…</details>
```
自动加类型签（发明故事 / 历史 / 数学 / 多玩一会儿 / 争议 / 原始文献 / 加练 / 延伸，`data-tag` 可改）和"展开 ▾ / 收起 ▴"按钮；内容收进 `.vl-side-body`。**默认收起**，记住读者的展开状态（键 `<id>-side-<文件名>-<id 或序号>`）。里面可放演化链 `ol.vl-chain > li`（箭头用 `li.vl-chain-ar`；≤600px 自动竖排、箭头朝下）和时间线 `.vl-timeline > .vl-ev`（`.hasimg` 带图，年份 `b.vl-yr`）。

### 试试看
```html
<p class="vl-try" data-try="t1" data-done="完成！你看到了……">把误差降到 5% 以下。</p>
```
```js
VL.tryDone("t1", 可选反馈)   // 达成条件写在页面 JS 里；返回 true = 本页第一次确认
```
自动加小方框和"试试看："。完成后打勾、显示反馈（`aria-live`），存 `<id>-try`；重开页面显示"之前已完成。"（`data-was` 可改）。派发 `document` 事件 `vl:try {id, el, first}`，`first` = 跨会话第一次，激励模块只在 first 时给奖励。

### 先猜后揭晓
```html
<div class="vl-guess" data-mode="think"><p class="vl-q">问题</p><div class="vl-ans">想法</div></div>
<div class="vl-guess" data-mode="pick"><p class="vl-q">问题</p>
  <ul class="vl-opts"><li data-right>选项<span class="vl-fb">这一项的反馈</span></li><li>…</li></ul>
  <div class="vl-ans">揭晓</div></div>
<div class="vl-guess" data-mode="estimate" data-min="1" data-max="1000" data-answer="60" data-scale="log" data-unit="次" data-step data-start data-digits data-pre><p class="vl-q">问题</p><div class="vl-ans">解释</div></div>
```
- pick：选中项显示自己的反馈；有 `data-right` 时三态 `.right / .wrong / .miss`（另配 ✓ ✗，不只靠颜色）；没有 `data-right` 就是表态，只标 `.on`。"再猜一次"可重来。
- estimate：滑块（线性或对数），揭晓后"你 / 答案"两个标记 + 偏差段 + 一句评语。
- 揭晓后容器加 `.revealed`，派发冒泡事件 `vl:guess {mode, pick, right | guess, answer, ratio}`。

### 测验
```js
VL.quiz("#c2-quiz", [{ q, opts:[…], a:正确下标, why:"解析", fixed:false, img:"可选 HTML" }], { mode:"pick"|"drag", progress:true, badge:"可选文字" })
```
一次一题横向翻（◀ 圆点 ▶、←→）；圆点三态 `.tried`（答错过）/ `.ok`（答对）/ `.on`（当前）。选项按章号 + 题号种子打乱（`fixed:true` 不打乱），打乱后正确项一定换了位置。错项划掉禁用并轻抖，对项显示解析。`mode:"drag"`：把答案卡拖进答题位，或点卡片再在答题位上按回车 / 点击。全部答对：显示徽章、`VL.Progress.done(章号)`（`progress:false` 不记）、派发 `document` 事件 `vl:quiz-perfect {ch, firstTry, n}`；每答对一题派发冒泡事件 `vl:answer {i, firstTry}`。返回 `{go(i), el}`。

### 笔记框
`<textarea class="vl-note" data-save="reflect" placeholder="具体的开头……"></textarea>`：输入即存，键 `<id>-note-<文件名>-<data-save 或序号>`（中英文页同名文件共用，改章号不冲突）；停手 0.5 秒显示"已保存"。

### 互动台与控件（只给结构，外观在皮肤）
`.vl-board`（招牌互动外壳，全课最重的实体感）、`.vl-btn`（`.alt` 次要）、`.vl-chip`（`.on .right .wrong .miss`）、`label.vl-ctl > output + input[type=range]`、`.vl-msg`（反馈句，配 `aria-live`）。收束块 `.vl-misc .vl-key .vl-tldr`：**标签文字写在 HTML 里**（如 `<p class="vl-tldr"><b>一句话</b>……</p>`）。

## 四、JS 工具与状态

| API | 说明 |
|---|---|
| `VL.t(key, zh, …a)` | 界面文字 |
| `VL.store.get/set/json/setJSON(k)` | 课程数据，键自动加 `<id>-`，全部 try/catch；`VL.raw` 不加前缀 |
| `VL.Progress.get() / done(n)` | 读懂进度（只由测验全对记） |
| `VL.fx()` / `VL.setFx("auto|full|lite|off")` / `VL.motion()` | 动效档位；`motion()` = 不是 off。改档派发 `vl:fx {level}` |
| `VL.scheme()` / `VL.setScheme("light|dark|sepia")` | 配色；派发 `vl:scheme {scheme}` |
| `VL.shake(el)` | 失败轻抖 280ms（off 档不抖） |
| `VL.rng(seed)` | 带种子随机数（首屏结果固定） |
| `VL.$ / $$ / el(tag, attrs, html) / clamp / esc` | 小工具 |
| `VL.enhance(根节点)` | 动态插入的内容再跑一遍组件增强 |
| `VL.figs()` | 重新编图号 |
| `VL.popover(btn, panel)` | 同款浮层（Esc、点外面关闭） |
| `VL.ready(fn)` | 所有脚本跑完后执行 |
| `VL.CH / PARTS / cur / file / base / lang / nm(c) / partOf(n)` | 章节信息 |

## 五、动效
- 自动判定（vl-head.js）：系统"减少动态"或无头浏览器 → off；≤700px 或触屏 → lite；其余 full。读者在"显示"里手动选的档覆盖自动结果；系统"减少动态"始终优先。截图时加 `?fx=1` 让无头浏览器也按正常档位。
- `html.vl-fx-off` 和 `prefers-reduced-motion` 下一切 animation / transition 关掉；组件里的过程动画都保证"关掉也是最终状态"。皮肤的氛围动效自己判断 `vl-fx-lite`。

## 六、配色（读者可切换）
**暗色暂缓**：切换功能在，暗色只给了变量、未完整验收；亮色和护眼可用。截图验收时网址加 `?scheme=dark|sepia` 临时切换（`vl-head.js` 读，不存档）。
三套 `html[data-scheme="light|dark|sepia"]`，由皮肤用变量实现。暗色和护眼下，`.vl-fig`、`.vl-cc-fig`、单独的 `.vl-illus` 保持浅色图板（`--plate`，字 `--plate-ink`），里面的颜色不变。页面专属的 SVG / canvas 若写死了深色字，放进 `.vl-fig` 里就安全。

## 七、互动组件（vl-interact.js / vl-interact.css）

用途：G6 动手题、P2 篇末综合关、G7 分局小游戏、G8 逐步演示、G9 公式拆解、E2 对比、M1 翻牌、M2 热区图、T6 漫画分镜、K9 文档道具、K5 立场卡 + 投票的 HTML 写法和 JS API。演示页 `kit/demo-interact.html`（主题：强化程序）。

### 引入

```html
<link rel="stylesheet" href="kit/vl.css">
<link rel="stylesheet" href="skin/skin.css">
<link rel="stylesheet" href="kit/vl-interact.css">      <!-- 结构 -->
<link rel="stylesheet" href="skin/interact.css">        <!-- 皮肤外观（四套皮肤都有） -->
…
<script src="kit/vl.js"></script>
<script src="kit/illus.js"></script>
<script src="kit/vl-interact.js"></script>              <!-- vl.js 之后、页面脚本之前 -->
```
- 声明式写法（翻牌、对比、热区、漫画、逐步演示、公式拆解、立场卡、投票）在脚本加载时自动装上；动手题和综合关的 JSON 写法在页面脚本跑完后（`VL.ready`）装，所以页面脚本可以先用 JS 传带函数的配置。
- 动态插入的内容：`VL.interact(根节点)`；`VL.enhance` 已被包了一层，也会顺带调它。
- 界面文字走 `VL.tr(键, 中文默认)`，英文表在 vl-interact.js 顶部 `EN`；课程可用 `window.VL_I18N` 覆盖（同 `VL.t`）。
- 存档都走 `VL.store`（带课程前缀）。组件里用 `hidden` 藏的按钮由 CSS 强制 `display:none`。
- 招牌互动的外壳仍是 `.vl-board`：动手题、小游戏、逐步演示、公式拆解的宿主元素直接加 `vl-board` 类（皮肤样子随互动台）。

### G6 动手题引擎 `VL.task`

五种题型：`sort` 分拣、`order` 排序、`pair` 配对、`range` 调到区间、`judge` 逐条判定。没有血条、不计分、没有失败。

```html
<div class="vl-board vl-task" id="c5-task" aria-label="强化程序动手题"></div>
<script>VL.task("#c5-task", { tryId: "c5-t1", title: "可选标题", done: "可选：全部做完时的一句", rounds: [ … ] });</script>
<!-- 或纯 JSON（不能含函数）：<div class="vl-board vl-task"><script type="application/json">{"rounds":[…]}</script></div> -->
```

每一题（round）的共有字段：`type`、`prompt` 题干、`hints: [看哪里, 为什么]`、`ok` 做对后的一句解释、`miss` 答错时补的一句（可选）。文字可以带 HTML。

| type | 专有字段 | 读者怎么做 | 键盘 / 触屏 |
|---|---|---|---|
| `sort` | `bins: ["框1","框2"(,"框3")]`，`items: [{t, bin: 框下标, why}]` | 把卡片拖进框；或点卡片再点框上的"放进这里"；点空白卡片池放回 | Tab 选卡 + Enter，再 Tab 到"放进这里" |
| `order` | `items: [{t, why}]`（按正确顺序写，页面上打乱且保证不等于原序） | 拖动，或 ↑↓ 按钮 | 卡片上按 ↑↓ |
| `pair` | `pairs: [{l, r, why}]`（右栏打乱） | 点左边一项，再点右边一项；配上的两边显示同一个 ①②③ | 点选 |
| `range` | `min max step value target:[lo,hi] unit label ends:[左端白话,右端白话] low high`；JS 写法还可给 `fmt: v => 文字`、`view: v => HTML`（随滑块变的小图） | 把滑块调进目标区间；做对后才画出目标区间 | 原生 range |
| `judge` | `verdicts: ["是","不是"]`，`cards: [{t, a: 正确判断下标, why, hint}]` | 一张张判；判对或连错两次后显示"本书判断：X。理由"，再点"下一张" | 按钮 |

- **两级错误反馈**（点"检查"）：第一次"有 N 张放错了，标了 ✗ 的再想想"（错项加 ✗、虚线框、读屏文字）；第二次起点名其中一处并给它的 `why`。`range` 用 `low` / `high`，第二次起用 `hints[1]`。`judge` 每张：第一次错划掉那个判断 + `hint`，第二次直接给本书判断。
- **三级提示**（点"提示"）：`hints[0]` → `hints[1]` → "直接摆好答案"（照样算完成，事件里 `revealed: true`）。
- 起始值已在目标区间里的 `range` 题会 `console.warn`（读者不动就算对）。
- 全部做完：显示结尾句和"再做一遍"；`tryId` 有就 `VL.tryDone(tryId)`；存档 `<id>-task`（`文件名#id` 列表），再打开时题号后注明"之前做完过"。
- 事件（冒泡）：`vl:task-round {id, i, n, revealed, last}`、`vl:task-done {id, first, revealed}`（`first` = 跨会话第一次）。
- 返回 `{el, id, rounds, restart(), at, state, locked, _solve(), _spoil(), _next()}`；`_solve/_spoil/_next` 是自测钩子。

### P2 篇末综合关 `VL.review`

本篇知识地图用 `diagrams.md` 的模板另放；这里是"你现在能看懂什么" + 要划掉的错误论断 + 一串动手题（题型同 G6）。每做对一题，对应论断被红笔划掉。

```html
<div class="vl-review" id="p1-review"><script type="application/json">{
  "title": "本篇复习页：划掉三条错误论断", "intro": "每做对一题，就划掉一条错的说法。",
  "can": ["为什么抽卡比签到更粘人", "……"],
  "rounds": [ { "type": "sort", "claim": "随机奖励和固定奖励差不多。", "prompt": "…", "bins": […], "items": […], "hints": […], "ok": "…" }, … ] }</script></div>
```
JS：`VL.review(el, cfg)`。事件：`vl:review-round {id, i, n, claim, revealed, last}`（每划掉一条）、`vl:review-done {id, first, revealed}`；同时也派发 G6 的两个事件。存档 `<id>-review`。"守层者 / BOSS"是皮肤外观，kit 不画。

### G7 分局小游戏 `VL.game`

章节只写开局、一次操作、判胜负、画面；局数、HUD、星级、存档、和机器比分、失败诊断、复盘、默认收起都由骨架给。

```js
const g = VL.game("#c5-game", {          // 宿主里原有的内容（画布、自己的按钮）原样留作舞台
  title: "发奖员：让玩家撑下去",
  fold: { t: "多玩一会儿：当一回发奖员", d: "三局，约 4 分钟，可以跳过" },   // 有它就包进 details.vl-side[data-kind=play]，默认收起
  rules: "开局前说清的规则", vs: "机器", tryId: "c5-t2", key: "可选存档名",
  hud: [["turn", "回合"], ["tok", "奖励剩"]],            // 读数槽；rounds 里有 steps 时自动加"剩余步数"
  rounds: [{ name: "短局", goal: "撑过 8 回合。", steps: 可选, say: 可选开局话, …自定义参数 }],
  init(r, g) { return 本局状态; },
  move(s, input, g) { …; return "进消息区的一句" /* 或 {msg, cost} */; },
  judge(s, g) { return { win: true, stars, msg, you, bot } | { lose: true, msg, you, bot, diag } | null; },
  diagnose(s, g) { return "<p>按读者实际做了什么，说哪里出了问题</p>"; },   // 输了时显示在"哪里出了问题"
  review(res, g) { return "<p>最后一局过关后的复盘：写意思不报数</p>"; },
  render(s, g) { …; g.set("turn", …); },
  keys: { ArrowUp: "give", ArrowRight: "skip" }, keysLabel: "舞台的读屏说明",
  pad: true, padLabels: { ArrowUp: "给" }, padCenter: " ",               // 屏幕方向键 .vl-pad（3×3，只在 ≤700px 或触屏出现）
  maxStars: 3, noStars: false, pick: true,
});
按钮里调 g.act(input)；也可随时 g.win({…}) / g.lose({…})。
```
- 局选择 chip：过了前一局才能选下一局；星级记每局最好的一次；存档 `<id>-game-<文件名>-<key 或宿主 id>`，刷新后回到第一个没过的局。
- 输了：`VL.shake` 轻抖 + 诊断框；赢了：星级 + 消息；最后一局过关触发 `tryId` 和复盘。
- 事件：`vl:game-win {id, i, stars, last, all}`、`vl:game-lose {id, i}`（激励模块订阅，组件自己不放粒子）。
- `g` 上可用：`act win lose go(i) redo next restart set(k,v) say(html) vs(you,bot) draw() i r s res left over won stage`。

### G8 逐步演示 `.vl-steps`

```html
<div class="vl-steps vl-board" data-auto data-dur="2400">          <!-- data-auto = 有"播放 / 慢放"；不写就只能手动步进 -->
  <div class="vl-steps-stage"><svg …>
    <g data-st="2">第 2 步起出现</g> <g data-st="2-3">只在 2–3 步</g> <g data-st-hi="1 4">在第 1、4 步高亮</g>
  </svg></div>
  <ol class="vl-steps-list"><li>第 1 步说明（≤2 句）</li>…</ol>
</div>
```
- 控制条：⏮ 从头、◀、▶/⏸（自动播放）、▶、可点的分段进度条（`role=slider`，播放时当前段跟着填满）、"2 / 4"、慢放（`aria-pressed`，每步时长 ×2、换步过渡 700ms）。旁白 `.vl-steps-say`（`aria-live`）显示当前步说明。
- 键盘：组件聚焦后 ←→ Home End 换步，空格播放 / 暂停。
- 动效：换步只做透明度过渡（≤350ms，慢放 700ms）；动效关时"播放"按钮改成下一步，不播过程。
- JS：`VL.steps(el, { draw(i, t, el) {…}, onStep(i, n) {…}, auto, dur })` → `{go(i), play(), stop(), step, n}`。`draw` 给画布类短片用：播放时 t 从 0 走到 1，手动换步直接 t=1。事件 `vl:step {i, n}`。打印时全部步骤展开。

### G9 公式拆解 `.vl-anat`

```html
<div class="vl-anat vl-board">
  <div class="vl-anat-f"><span data-k="1">δ</span> = <span data-k="2">R</span> − <span data-k="3">V</span></div>
  <ul class="vl-anat-key">
    <li data-k="1"><b>δ</b>，读作"德尔塔"：惊喜有多大。例子里等于 3。</li> …
  </ul>
</div>
```
- `data-k="1…6"` 取颜色 `--var-1…6`（皮肤没定义时退到 `--q1…6`），全课同一个量用同一个号；正文里的同一个量写 `<span class="vl-v2">R</span>` 同色。KaTeX 写法 `\htmlClass{vl-k2}{R}` 也认。
- 悬停 / 聚焦预览，点击钉住（`aria-pressed`），再点松开；其余变淡；解释行可 Tab，↑↓ 在行间移动，Esc 松开。事件 `vl:anat {k}`。JS：`VL.anat(el)` → `{pin(k), set(k)}`。

### E2 对比 `.vl-compare`

```html
<div class="vl-compare" data-mode="cols">          <!-- cols 左右两栏（默认）| toggle 同一位置一键切换前后 | slider 拖分隔线 -->
  <div class="vl-cmp-a bad" data-label="固定比率">插画 + 文字</div>
  <div class="vl-cmp-b" data-label="可变比率">插画 + 文字</div>
</div>
```
- 有一边带 `.bad` 时，标签前自动加 ✗ / ✓（不只靠颜色）。窄屏 cols 上下排。
- toggle：上方两枚 chip（`aria-pressed`，←→ 切换），两栏叠在同一格里，高度不跳；`data-start="1"` 先显示 b。
- slider：两栏布局要相同（如两张同尺寸 SVG），分隔线 `role=slider`，←→ / PageUp/Down / Home / End（Shift 大步），pointer capture；`data-start="45"`。全开档首次进入视口晃一下提示能拖。
- 事件 `vl:compare {side}` 或 `{pos}`；JS：`VL.compare(el)` → `{set(v)}`。

### M1 补：翻牌 `.vl-flip`

```html
<div class="vl-flip" data-all="true">     <!-- data-all="false" 不要"全部翻开"按钮 -->
  <div class="vl-flip-c"><div class="vl-flip-f">正面：错想法原句</div><div class="vl-flip-b">背面：为什么不对</div></div> …
</div>
```
单张点击 / Enter / 空格翻面（`aria-pressed`）；多张时下方"全部翻开 / 全部合上"。翻牌 3D 400ms（帮助理解类）；动效关时直接换面。每张都翻过一次派发 `vl:flip-all`，每次翻派发 `vl:flip {i, on}`。牌面里别放可聚焦的东西。JS：`VL.flip(el)` → `{all(on)}`。

### M2 热区图 `.vl-hot`

```html
<figure class="vl-fig vl-hot" data-hint="先点一块，看它用的是哪种发法。">
  <svg …><g data-hot="chest" data-name="宝箱"><rect …/><text …>宝箱</text></g> …</svg>
  <!-- 或图片：<div class="vl-hot-pic"><img …><button class="vl-hot-pin" data-hot="x" data-name="宝箱" style="left:40%;top:30%">1</button></div> -->
  <div class="vl-hot-text" data-for="chest"><b>可变比率</b>：……（≤3 句）</div>   <!-- 或写在热区的 data-info 里 -->
  <figcaption>图注写"为什么"</figcaption>
</figure>
```
热区自动 `tabindex=0 role=button aria-pressed`，Enter / 空格选中，方向键在热区间移动；信息框 `.vl-hot-info`（`aria-live`，缺了自动建）+ "已看 N / M"。事件 `vl:hot {key}`、`vl:hot-all`。JS：`VL.hot(el)` → `{pick(key), current}`。

### T6 漫画分镜 `.vl-comic`

```html
<div class="vl-comic" aria-label="一句话概括整组">
  <div class="vl-panel"><span class="vl-bub" data-x="30">短气泡 ≤12 字</span><span data-illus="…"></span><p class="vl-cap">旁白 ≤30 字</p></div> …（2–4 格）
</div>
```
格号自动加在旁白前；气泡排在插画上方的流里（不压人物），尾巴位置 `data-x`（百分比）。宽屏一排，≤600px 横滑。全开 / 轻量档下，页面加载时还在视口下方的漫画滚到时逐格亮起；动效关就全亮。缺 `aria-label` 或超过 4 格会 `console.warn`。

### K9 文档道具 `.vl-doc`（纯 CSS）

```html
<div class="vl-doc" data-kind="file|news|diary|letter|lab">   <!-- notebook 是 lab 的别名 -->
  <span class="vl-stamp">已归档</span>                      <!-- 可选印章：浮在右上，正文绕开，不压字 -->
  <p class="vl-doc-meta">档案 1957-03 · 鸽子实验记录</p>
  <h4>标题</h4>
  <p>正文 ≤2 段</p>
  <div class="vl-doc-cols">报纸两栏正文（可选）</div>
  <p class="vl-doc-sign">落款</p>
</div>
```
notebook 皮肤：案卷 = 牛皮纸文件夹 + 标签；报纸 = 报头双线；日记 = 横线纸 + 页边红线；信 = 信纸 + 手写落款；实验笔记 = 方格纸 + 装订边。四套皮肤都画了这五种；fieldbook 另有 `ticket`（票根）、`clipping`（剪报）、`copy`（影印件）。

### K5 立场卡 `.vl-philo` + 投票 `.vl-vote`

```html
<div class="vl-philo" data-key="c22-philo1">
  <div class="vl-philo-slide" data-t="问题"><p class="vl-philo-q">问题</p><div class="vl-vote" data-options="算|不算|看情况"></div></div>
  <div class="vl-philo-slide" data-t="工具无罪">……<p class="vl-src">这是谁的看法</p></div>   <!-- 立场名写观点，人名放出处行 -->
  <div class="vl-philo-slide" data-t="留给你">开放问题 <textarea class="vl-note" data-save="c22-philo1"></textarea></div>
</div>
```
- 一次一张：页签（立场名，`role=tablist`，←→ Home End）、◀ 上一张 / 下一张 ▶、"2 / 4"、横滑 >50px。翻到立场页时顶部回显"你选的是：X"（没投时提示第一张可以投）。打印全部展开。
- 投票：`aria-pressed`，可改票，存 `<id>-vote-<文件名>-<data-key>`；单独用 `<div class="vl-vote" data-key="…" data-options="A|B">` 也行。事件 `vl:vote {key, i, option}`、`vl:philo {i}`。JS：`VL.vote(el, {key, options})` → `{pick, option, on(fn)}`；`VL.philo(el)` → `{go(i), vote}`。

### 选格子 `VL.cells`
猜数、选座位、日历、棋盘这类"一排排可点的格子"。结构和键盘在 kit，外观归皮肤（`.vl-cell` 及状态类，皮肤的 `interact.css` 可覆盖）。
```js
const g = VL.cells(document.getElementById("c03-grid"), { n: 100, cols: 10, label: i => i + 1,
  onPick: (i, cell) => { g.mark(i, "is-last"); } });
g.mark(41, "is-out");   g.mark(41, "is-out", false);   g.reset();   g.get(0);   g.cells
```
状态类：`is-out` 划掉、`is-last` 刚选、`is-hit` 命中、`is-sel` 选中。方向键在格子间走（只有一个格子可 Tab 进入），回车 / 空格选中；格子是 `<button>`，要禁用就设 `disabled`。手机上 10 列每格约 30px，低于 44px 触控标准，格子多时考虑减列。

### 事件一览

| 事件（都冒泡） | 何时 | detail |
|---|---|---|
| `vl:task-round` / `vl:task-done` | 动手题做对一题 / 全部做完 | `{id,i,n,revealed,last}` / `{id,first,revealed}` |
| `vl:review-round` / `vl:review-done` | 综合关划掉一条论断 / 通关 | `{id,i,n,claim,revealed,last}` / `{id,first,revealed}` |
| `vl:game-win` / `vl:game-lose` | 小游戏一局赢 / 输 | `{id,i,stars,last,all}` / `{id,i}` |
| `vl:step` | 逐步演示换步 | `{i,n}` |
| `vl:anat` | 公式片段钉住 / 松开 | `{k}` |
| `vl:compare` | 对比切换 / 拖线 | `{side}` / `{pos}` |
| `vl:flip` / `vl:flip-all` | 翻一张 / 每张都翻过 | `{i,on}` / `{n}` |
| `vl:hot` / `vl:hot-all` | 点一块 / 每块都看过 | `{key}` / `{n}` |
| `vl:vote` / `vl:philo` | 投票 / 立场卡翻页 | `{key,i,option}` / `{i}` |

激励类动效（星星、盖章）只订阅这些事件，组件自己只播反馈类动效。


## 八、可选模块（kit/modules/）

用途：可选模块（统一概念数据、关系图、术语表、闪卡、阅读激励、陪伴角色、声音）的文件、引入顺序、配置和 API。什么时候加、有哪些坑见 `references/modules.md`；数据字段见 `kit/modules/concepts-schema.md`。演示：`kit/modules/demo-modules.html`（三章假数据小课）。

### 8.1 文件与引入顺序

| 文件 | 放哪 | 做什么 |
|---|---|---|
| `modules/modules.css` | `<head>`，vl.css 之后 | 模块的结构样式 |
| `skins/<名>/modules.css` | skin.css 之后 | 模块外观（如笔记本 = 集邮册 + 盖章；四套皮肤都有） |
| `js/concepts.js`（课程写） | `js/course.js` 之后、**vl.js 之前** | `window.VL_CONCEPTS` |
| `modules/vl-concepts.js` | concepts.js 之后、**vl.js 之前** | `VL.concepts`；先填好 `.vl-cc[data-concept]`，vl.js 再加小签；自动生成相关章节 |
| `modules/sound.js` | vl.js、插图包之后 | `VL.sound`，顶栏喇叭 |
| `modules/collect.js` | 同上 | `VL.collect`，顶栏"集邮册" |
| `modules/companion.js` | 同上 | `VL.companion`，页角角色 |
| `modules/graph.js` | 同上 | `VL.graph / miniMap / graphList / mapPage` |
| `modules/terms.js` | 同上（术语表、闪卡页） | `VL.glossary / flashcards` |
| `modules/build-concepts.mjs` | 命令行 | 扫各章生成 / 校验 concepts.js |
| `modules/map.html` `glossary.html` `flashcards.html` | 模板，复制到课程根目录 | 改头部路径即可用 |

```html
<link rel="stylesheet" href="kit/vl.css"><link rel="stylesheet" href="kit/modules/modules.css">
<link rel="stylesheet" href="skin/skin.css"><link rel="stylesheet" href="skin/modules.css">
…
</main>
<script src="js/course.js"></script>
<script src="js/concepts.js"></script>
<script src="kit/modules/vl-concepts.js"></script>
<script src="kit/vl.js"></script>
<script src="kit/illus.js"></script><script src="js/illus-ch03.js"></script>
<script src="kit/modules/sound.js"></script>
<script src="kit/modules/collect.js"></script>
<script src="kit/modules/companion.js"></script>
<script src="kit/modules/graph.js"></script>
```
只加选了的模块。概念卡、邮票里的插画要用到别章的图时，把那几章的插图包也加载（或把概念小图集中放进一个 `js/illus-concepts.js`）。

### 8.2 配置（VL_COURSE.modules）

```js
window.VL_COURSE = { …,
  mapHref: "map.html",                    // 关系图页（小图、术语表的"看全课关系图"链接）
  modules: {
    collect: { title: "集邮册", titleEn: "Stamp album", button: true },   // false = 关掉阅读激励
    related: true,                        // false = 不自动插"相关章节"
    relatedFuture: true,                  // false = 相关章节只列前面的章
    sound: true,                          // false = 没有喇叭；true 也是默认静音
    companion: {                          // 不写 = 没有陪伴角色（默认）
      name: "小格", nameEn: "Grid", label: "小格，点一下听它说话",
      art: "demo-buddy",                  // 插画名或 SVG 字符串；不写用默认圆脸
      side: "left",                       // left | right
      max: 3,                             // 每章最多主动冒话几次
      lines: { try: ["…"], perfect: ["…"], tryEn: [], perfectEn: [] },
    },
  },
};
```

### 8.3 统一概念数据 VL.concepts

| API | 说明 |
|---|---|
| `items` `terms` `links` | 规范化后的数据（边已合并去重，类型统一成 prereq / explains / applies / contrast） |
| `get(id)` `ofChapter(n)` `entries()` | 取概念；`entries()` = 概念 + 术语 |
| `neighbors(id)` | `[{id, type, dir:"out"|"in"}]` |
| `related(n, {future, max})` | 相关章节：`[{ch, score, via:[{here, there, type, dir}]}]`，按边的分量排序（前置 3、解释 / 应用 2、对照 1） |
| `renderRelated(target?, n?)` | 填 `<nav class="vl-related">`；不给 target 就插在翻页前面 |
| `cardHTML(c, {eg})` `fillCards(root)` | 由数据生成概念卡内容 |
| `name(c)` `other(c)` `pick(c, "def"|"plain"|"by")` | 按页面语言取字段 |
| `relLabel(type, dir)` `TYPES` | 关系的说法（"先要懂""用在"…） |
| `chHref(n, id?)` `mapHref(id?)` `isOpen(n)` `partOf(n)` | 链接与篇章 |

### 8.4 概念关系图（graph.js）

- **全课页**：`map.html` 里一行 `VL.mapPage()`，接管 `#vl-map`（图）、`#vl-maplist`（列表）、`#vl-mapinfo`（概念卡 + 去第 N 章 + 按关系分组的邻居）、`#vl-mapq`（搜索）、`#vl-mapparts`（按篇筛选）、`#vl-maplegend`、`#vl-mapviews`、`#vl-maplayouts`。≤700px 默认列表视图。`map.html#概念id` 打开即选中。
- **组件**：`VL.graph(target, {ids, layout:"layered"|"force", groupBy:"auto"|"chapter"|"part"|fn, maxRows:7, info, onSelect, here})` → `{select(id), clear(), filterParts(Set), search(q) → ids, setLayout(m), relayout(), selected}`；选中派冒泡事件 `vl:concept {id}`。
- 画法：节点是 `<button class="vl-gn" data-part>`（HTML，键盘和读屏可用），连线在下层 `svg.vl-gedges[aria-hidden]`，每条 `g.vl-ge.t-<type>` 含 `.vl-ge-ln` 和箭头 `.vl-ge-ah`（三角形，不用 marker，皮肤可上色）。分层布局：按章（章 >8 时按篇）分列，每列 ≤maxRows，列内按邻居平均位置排 4 遍；跨列的边拱起来走。力导向：从分层结果出发确定性地跑 260 步、矩形互斥。
- 状态类：`.vl-graph.has-on / .has-q`，节点 `.is-on .is-nb .is-hit .is-lit`（集邮册里已收）`.is-off`（章节未开放）`.is-here`（小图里的本章）`.is-principle`。
- 键盘：Tab 进图（只有一个节点可 Tab，漫游焦点），方向键朝那个方向走到最近的节点（有选中时优先在它的邻居里走），Home / End，回车 / 空格选中，Esc 取消。
- **本章小图**：`<div class="vl-minimap" data-ch="3"></div>` 或 `VL.miniMap(ch, target, {future:false})`。本章概念一列，前面章节里和它们相连的在左；默认不画后面的章（正文不预告后面）。点节点在下面出一行释义和"去第 N 章"。
- **列表视图**：`VL.graphList(target)`，按篇 → 章分组的按钮，点开就地显示信息（`aria-expanded`）。

### 8.5 术语表与闪卡（terms.js）

- `VL.glossary(target)`：概念 + 术语，中文按拼音（`Intl` 拼音排序 + 分界字取首字母）、英文按字母；首字母跳转、搜索（中文、英文、别名、释义）、每条链回所在章（概念跳到 `#cc-id`，术语跳到 `anchor`），核心概念带"核心概念 / 世界观原理"小签链到关系图。`glossary.html#gl-<id>` 高亮那一条。
- `VL.flashcards(target, {perRound:10})`：莱特纳 4 盒（当天 / 1 天 / 3 天 / 7 天），答对进下一盒，答错回第一盒且本轮末尾再来一次；先翻面才能判对错。空格翻面，← 还没记住，→ 记住了。只出已读懂（测验全对）章的词，读者可勾"也练还没读懂的章"。存档 `<id>-flash`。返回 `{round(ids?), flip(), judge(ok)}`。非"全开"动效档直接换面，不转 3D。

### 8.6 阅读激励（collect.js）

- 订阅：`vl:try`（`first` 时收 `.vl-try[data-concept]` 或同一节第一张 `.vl-cc[data-concept]` 的概念）、`vl:quiz-perfect`（本章邮票 + 本章全部概念，测验徽章上盖"读懂了"）、`vl:review-round {concepts | ch}`（篇末综合关每回合答对）。注意 `VL.review` 自己派的 `vl:review-round` 只带 `{id, i, n, claim, revealed, last}`，不带 `concepts` / `ch`，集邮册不会因此收卡；要收卡，页面在监听到它之后自己再派一次带 `concepts` 或 `ch` 的同名事件。章邮票读 `VL.Progress`，不另存。
- 存档：`<id>-cards`（已收概念）、`<id>-col-seen`（庆祝过的事：`ch-N`、`full-N`、`all`），每件事只庆祝一次。
- 外观：提示条 `.vl-col-toast`（≤1.2s，`pointer-events:none`；off 档只读屏播报）、顶栏 `.vl-tb-col` + `.vl-col-count`、对话框 `.vl-col-back > .vl-col-dlg`（Tab 留在框里、←→ 翻页、Esc 关）、章邮票 `.vl-col-stamp.is-got|is-empty`、图鉴格 `.vl-col-cell`、邮戳 `.vl-col-pm`、测验徽章上的 `.vl-col-mark`。
- 目录页：`<div data-vl-collect="map">`（全课地图，读懂的章盖章）、`<p data-vl-collect="next">`（书签：第一个还没读懂的章）、`<div data-vl-collect="album">`（整本摊开）。
- API：`VL.collect.has(id) / add(ids, reason, quiet) / open() / close() / next() / total() / reset()`；收进新概念时派 `vl:collect {ids, reason}`（关系图据此点亮节点）。

### 8.7 陪伴角色（companion.js）

- 台词：每节 `<div class="vl-sec" data-lines="句一|句二" data-lines-en="…">`（也可写 JSON 数组）。点击时按当前所在的节（顶边过视口 35%）轮流说；这一节没写就只冒"……"，不凑通用台词。
- 主动冒话：试试看第一次完成（`.vl-try[data-say]` 优先，否则 `lines.try`）、测验全对（`lines.perfect`），每章 ≤ `max` 次。
- 气泡 `.vl-comp-bub`：`aria-live=polite`、`pointer-events:none`、约 2.6 秒（字多稍长，最长 6 秒）消失、滚动即收、Esc 收；动效全开档才跳一下。
- 不挡正文：每次说话先量正文栏（`main.vl-wrap` 内容框）在角色那一侧的空白，≥180px 时气泡浮在空白里；不够时（860px 正文栏下约 1270px 以下都算，含 1100）气泡加 `.is-flow` 插进正文流（`main` 或 `.vl-sec-body` 的直接子元素之间，视口里最靠下、落在角色按钮上方的位置），下面的内容让开，收起时移回角色身边。没有侧边空白时 `<html>` 加 `vl-comp-pad`，body 底部留出角色按钮的高度。
- 开关在顶栏"显示"浮层里（显示 / 隐藏），存档 `<id>-companion`。API：`VL.companion.say(text) / hide() / set(bool) / shown()`。

### 8.8 声音（sound.js）

- 默认静音；顶栏喇叭 `.vl-tb-sound[aria-pressed]`，存档 `<id>-sound`；打开时才建 AudioContext。
- 音：`click flip pop ok wrong coin clear stamp`，`VL.sound.play(名)`；音色由皮肤 CSS 变量 `--vl-snd`：`paper`（纸和铅笔：notebook、paper、fieldbook）、`sine`（默认）、`square`（像素）、`triangle`，只认这四个。
- 自动挂钩：`vl:try`、`vl:answer` → ok；答错的测验选项、`vl:guess` 猜错 → wrong；`vl:quiz-perfect` → clear；集邮册收卡 coin、盖章 stamp。不跟滚动响。

### 8.9 build-concepts.mjs

```
node kit/modules/build-concepts.mjs <课程文件夹绝对路径> [--write] [--course js/course.js] [--concepts js/concepts.js] [--out 路径]
```
默认只校验（有 ✗ 退出码 1）；`--write` 把新概念卡、新术语并进数据（手写字段保留，原文件备份 `.bak`，注释会丢）。查的项目见文件头注释。

## 九、概念图解（diagrams.js，12 种）

用途：十二种概念图解的写法和参数。什么时候用哪种、画法规矩见 `references/diagrams.md`；这里只讲怎么调用。演示页 `kit/demo-diagrams.html`（地址加 `?sel=1` 看高亮效果）。

### 加载

```html
<link rel="stylesheet" href="kit/vl.css">
<link rel="stylesheet" href="skin/skin.css">
<link rel="stylesheet" href="skin/diagrams.css">   <!-- 新七种图解的皮肤外观（四套皮肤都有；starter 模板已自动引入） -->
…
<script src="kit/vl.js"></script>
<script src="kit/diagrams.js"></script>            <!-- 放在 vl.js 之后 -->
```
（路径按 `new-course.mjs` 生成的课程写：`kit/` 是复制来的 kit，`skin/` 是复制来的皮肤。）

### 两种写法

```js
VL.diagram.cycle("#fig-loop", { nodes: [...], caption: "…" });   // JS 调用，返回 api
```
```html
<figure class="vl-fig" data-diagram="cycle">
  <script type="application/json">{"nodes":[…]}</script>
  <figcaption>图注写"为什么"，不复述图里的字。</figcaption>
</figure>
```

`target`：`figure.vl-fig` 或选择器；不是 figure 时在里面新建一个。`caption` 只在没有 `<figcaption>` 时用。

### 所有图解共用的参数

| 参数 | 作用 |
|---|---|
| `caption` | 图注（HTML） |
| `label` | 覆盖自动生成的 `aria-label`（默认会把节点名字和例子连成一句） |
| `hint` | 信息行的默认提示，默认"点一个部分，看看它在做什么。" |
| `select: false` | 关掉点选（静态图） |
| `info: false` | 不要图下的信息行 |
| `onSelect(i, item)` | 选中回调；再点一次取消，`i = -1` |

每个可点的块都有 `info`（选中时信息行显示的 HTML），不写就显示"名字 + 例子"。

**返回的 api**：`{ el, svg, redraw(), select(i), selected }`；选中时 figure 派发 `vl:dgselect`（`detail.i`）。键盘：Tab 到块上，Enter / 空格选中，方向键换块。

**节点的通用写法**：`{ name: "≤6 字", eg: "≤14 字的具体例子", info: "<b>…</b>…", c: 1–6 }`。`c` 选色块（`--dg-c1…c6`），不写按顺序轮换。

### 1 cycle 循环

```js
VL.diagram.cycle(t, { nodes: [{name, eg, info}], center: "再来一局", numbered: true })
```
宽屏节点排在椭圆上；窄屏（<560px）4 个以上排成两列"跑道"（右列往下、左列往上），`center` 放在中间那道空隙里。

### 2 nested 嵌套圈

```js
VL.diagram.nested(t, { layers: [最里层, …, 最外层], spin: true })
```
宽屏标签在右侧用引线连到各层；窄屏改成编号圆 + 图下对照表。`spin` 在每层左侧画一段约 74px 的弧形箭头。

### 3 flow 流程

```js
VL.diagram.flow(t, { nodes: [...], dir: "auto" | "row" | "column", numbered: false })
```

### 4 quadrant 象限

```js
VL.diagram.quadrant(t, { x: {name, lo, hi}, y: {name, lo, hi}, quads: [左上, 右上, 左下, 右下], points: [{x: 0–1, y: 0–1, label}] })
```
高度按四角标签放得下来算，宽屏不超过 300px。

### 5 compare 对比两栏

```js
VL.diagram.compare(t, { a: {name, eg, mark: "✓"}, b: {…}, rows: [{k: "比较维度", a: "…", b: "…", info}] })
```

### 6 timeline 时间轴 / 节奏

两种画法，给 `tracks` 就是轨道式，否则是曲线式。

```js
// 轨道：每条一串圆点（行动），hits 里的那几次画成星（拿到奖励）
VL.diagram.timeline(t, {
  legend: "每个圆点 = 一次行动；星 = 这一次拿到奖励",
  x: { lo: "开始", hi: "之后", name: "次数 / 时间" },
  tracks: [{ name, eg, info, dots: 15 | [0–1 的位置…], hits: [第几个点（从 0 起）…] }],
})
// 曲线：起伏 + 关键时刻
VL.diagram.timeline(t, {
  curve: [0–1, …],                       // 等间距取样，画成平滑曲线
  events: [{ at: 0–1, name, eg, info }],  // 竖虚线 + 曲线上的点
  x: { name, lo, hi, ticks: [{at, text}] }, y: { hi: "紧张", lo: "放松" },
  demo: true,                            // 轴名后加"（示意）"
})
```
曲线式：宽屏标签排在图上方（最多三行，自动错开，引线不穿过别的标签）；排不下或窄屏时改成编号圆 + 图下对照表（宽屏两列）。

### 7 tree 树 / 分类

```js
VL.diagram.tree(t, {
  root: { name, eg, children: [{ name, eg, edge: "胜率 40%", children: [...] }] },
  max: 5,            // 一个节点最多显示几个孩子，多的折成"还有 N 种"（虚线框）
  dir: "indent",     // 可选：强制竖排缩进
})
```
宽屏根在上、同层对齐，`edge` 写在连线旁；整棵树放不下就自动改成竖排缩进（像文件夹），`edge` 写在孩子框的上方。点一个节点，它到根的路径和它的孩子保持清楚，其余变淡。

### 8 venn 维恩

```js
VL.diagram.venn(t, {
  sets: [{ name, eg, c }],                       // 2–3 个圈
  regions: [{ in: [0, 1], eg: "具体例子", name, info }],  // in = 这个区域在哪几个圈里（下标从 0 起）
})
```
每个区域里写 `eg`（一个具体例子，不写区域名）；自动找区域里离圈边最远、放得下字的位置，四周留 5px。区域里的字只在标点、空格、“、”处断行，不在词中间断；放不下先缩小一档字号再试，仍放不下就放编号圆，图下对照。所以长例子用“、”或空格分开（如“体育课、广播操”）。圈名在圈外：宽屏在左右两侧（第三个圈在下方），窄屏在上方，用引线连到圈边。点区域里的任意位置都能选中，选中的区域铺一层强调色；点圈名选中整个圈。

### 9 balance 天平

```js
const api = VL.diagram.balance(t, {
  left:  { name, eg, weights: ["重剑", "暴击"], c },
  right: { name, eg, weights: [...], c },
  pivot: { name, eg },                     // 可选：支点说明，放在底座下方
  tilt: -1 … 1,                            // −1 左边沉到底，+1 右边沉到底；或给 left.value / right.value 自动算
  slider: { label, min: 0, max: 100, value, step, unit },   // 可选：自带滑块做成活图
  onTilt(v) {}, onSlide(v) {},
});
api.tilt(0.5);        // 动画转到新角度（关掉动效时直接到位）
api.tiltValue;        // 当前角度
```
滑块值线性映射到 −1…1（最小值 = 左边沉到底）。最大倾角 12°，梁端最多抬 40px；上方只按实际会转到的范围留空（有滑块按全程，没有滑块按当前 `tilt`，`api.tilt()` 转出这个范围时自动重画）。`pivot` 说明紧贴底座下方，和两边名字撞了才挪到它们下面。接近水平（|tilt| < 0.06）时外层加 `.is-level`，notebook 皮肤把支点涂成绿色。

### 10 network 网络 / 关系

```js
VL.diagram.network(t, {
  nodes: [{ id, name, eg, main: true, x: 0–1, y: 0–1, nx, ny }],  // 手排位置；nx/ny 是窄屏位置（可选）
  edges: [{ from, to, label, kind: "cause" | "link" | "both" }],  // cause 实线箭头，link 虚线无箭头，both 双向箭头
  aspect: 0.46,      // 高宽比，默认宽屏 0.46、窄屏 1.1；框叠在一起会自动拉高
  legend: true,      // 默认用到两种以上的边才画图例
})
```
不给 x/y 时绕中心排一圈（`main` 在中心）；规矩是手排，避免线交叉（自动排时只连相邻节点和中心，否则线会穿过中心框）。框挤在一起时先把图拉高，仍挤就两两推开，框与框之间至少 12px。边上的字自动沿线找空位，线在字那里断开；字两边的线段不足 18px 或找不到空位时，不画在线上，改在图下列出“A → B：标签”（`.vl-dg-elist`）。点一个节点只亮它和邻居、以及相连的边；默认 `info` 会列出"连着：…"。

### 11 spectrum 光谱轴

```js
VL.diagram.spectrum(t, {
  name: "规则有多严",
  lo: { name: "嬉戏", eg: "想怎么玩就怎么玩" }, hi: { name: "竞技", eg: "规则严密、分输赢" },
  items: [{ at: 0–1, name, eg, info }],
})
```
宽屏横轴，两端白话在轴上方，实例标签挂在轴下方（挤了自动分行）；窄屏改竖轴，标签在右边。

### 12 stack 层叠 / 堆积

```js
VL.diagram.stack(t, {
  layers: [最底层, …, 最顶层],          // {name, eg, value, info, c}
  unit: " 分钟",
  total: { name: "一局 30 分钟", eg: "四层加起来" } | "合计",   // 可选：画在柱子上方，带括号
})
```
给了 `value` 就按比例定高度（最矮 30px），名字后面跟数值；不给就按标签高度等分。标签在柱子右侧图外，引线连到各层。

### 皮肤可用的类

框与线：`.vl-dg-box`（框，可加滤镜）、`.vl-dg-ln`（线，可加滤镜）、`.vl-dg-ah`（箭头）、`.vl-dg-lead`（引线）、`.vl-dg-hit`（透明点击区）、`.vl-dg-dot`、`.vl-dg-pt`、`.vl-dg-ghost`。
各型专用：`.vl-dg-ring` `.vl-dg-spin`（嵌套）、`.vl-dg-cell` `.vl-dg-mid` `.vl-dg-axis`（象限）、`.vl-dg-hbox` `.vl-dg-cellbox`（对比）、`.vl-dg-trk` `.vl-dg-tick` `.vl-dg-star` `.vl-dg-curve` `.vl-dg-evln` `.vl-dg-tickm` `.vl-dg-badge`（时间轴）、`.vl-dg-branch` `.vl-dg-elab` `.vl-dg-et`（树、网络的边上字）、`.vl-dg-vset` `.vl-dg-vreg` `.vl-dg-vt`（维恩）、`.vl-dg-beam` `.vl-dg-pan` `.vl-dg-post` `.vl-dg-base` `.vl-dg-fulcrum` `.vl-dg-wtbox` `.vl-dg-wtt`（天平）、`.vl-dg-edge` `.vl-dg-weak` `.vl-dg-edgeg` `.vl-dg-main` `.vl-dg-legend` `.vl-dg-elist`（网络）、`.vl-dg-spec` `.vl-dg-sdot` `.vl-dg-end`（光谱）、`.vl-dg-blk` `.vl-dg-brace` `.vl-dg-total`（层叠）。
文字：`.vl-dg-t1` 名字 / `.vl-dg-t2` 例子 / `.vl-dg-t3` 小字、`.vl-dg-k`、`.vl-dg-axname`、`.vl-dg-num`。
状态：`.is-on`（选中）、`.is-near`（网络的邻居、树的路径）、外层 `.vl-dg.has-on`（其余变淡）、`.vl-dg.is-level`（天平水平）；`[data-c="1…6"]`。

新皮肤要给新七种图解写一份 `diagrams.css`（参照 `skins/notebook/diagrams.css`）。不写也能看：形状带了 `fill="none" stroke="currentColor"` 兜底，淡出、过渡等结构样式由 diagrams.js 自动注入（`<style id="vl-dg-css">`，用 `:where()` 压低优先级，皮肤总能覆盖）。

### 实现上要知道的

- viewBox 宽度 = 图的实际显示宽度，SVG 里的字号就是屏幕字号；容器宽度变化超过 24px、字体加载完都会重画，选中状态保留。
- 文字先排好、量包围盒，再按包围盒画框或找位置，所以字离线 ≥ 4px 不靠猜。
- 皮肤的抖动滤镜按元素包围盒算区域，纯水平 / 竖直的线包围盒高度为 0 会被整条裁掉（旧版象限图的坐标轴、窄屏循环图的横箭头就是这样消失的）。diagrams.js 画完后给每个带滤镜的形状复制一份以自身坐标为准、四周留 14px 的滤镜。

