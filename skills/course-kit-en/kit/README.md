# kit/: shared component code (the single authoritative API reference)

Purpose: structure, interaction and accessibility code that does not depend on the skin. Colours, fonts, strokes and textures all live in `skins/<name>/skin.css`. Class names use the `vl-` prefix and the JS namespace is `window.VL`.

This is the English translation of the Chinese `course-kit/kit/README.md`, which remains the source of truth. Interface strings shown in Chinese (button labels, sample text) are the kit's Chinese defaults; their English meaning is given alongside. On pages with `<html lang="en">` the kit uses its built-in English strings.

## 1. Files and load order

| File | Where | What it does |
|---|---|---|
| `vl.css` | `<head>` | Structural styles: layout, grids, image beside text, carousels, folding, popovers, print, reduced motion |
| `skins/<name>/skin.css` | `<head>`, after vl.css | The skin: variables plus component appearance |
| `skins/<name>/skin.js` | `<head>` | Declares `window.VL_SKIN` (web fonts, SVG filters, illustration palette) |
| `vl-head.js` | `<head>`, after skin.js | Applies the reader's colour scheme and motion level before first paint; inserts the web font `<link>` asynchronously |
| `js/course.js` (written by the course) | after `</main>`, before vl.js | `window.VL_COURSE`: chapter list and other config |
| `vl.js` | after `</main>` | Top bar, sections, carousels, terms, the components, quizzes, notes, pager |
| `diagrams.js` | after vl.js | 12 concept diagram types (section 9) |
| `vl-interact.js` + `vl-interact.css` | after vl.js / `<head>` | Interactive components (section 7); skin appearance in `skin/interact.css` |
| `vl-plot.js` + `vl-plot.css` | after vl.js / `<head>` | Live plots `VL.plot` (section 7, "G11 Live plot"); load only when needed |
| `modules/*.js` + `modules/modules.css` | see section 8 (`vl-concepts.js` must come before vl.js) | Optional modules; skin appearance in `skin/modules.css` |
| `illus.js` | after vl.js | Illustration loader plus stick-figure toolkit |
| `js/illus-chNN.js` | after illus.js | This chapter's illustration pack (`VL.illus.add`) |
| Inline `<script>` | last | This chapter's interactions; can call `VL.*` directly |

Illustration mounting and figure numbering run on `DOMContentLoaded`, so figures registered in illustration packs or in page scripts all get mounted.

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
<script>/* this chapter's interactions */</script>
```
Starting a new course: generate it with `starter/new-course.mjs <absolute course folder path> <skin name> [--lang en]` (the skin name is required). This copies `kit/` to `<course>/kit/` and the skin to `<course>/skin/`, neither with demo pages; see `starter/README.md`. The demo pages exist only inside the skill, so look at them there (their paths are written relative to the skill folder): `demo.html` basic components, `demo-interact.html` interactive components, `demo-diagrams.html` the 12 diagrams, `demo-en.html` an English page, `modules/demo-modules.html` optional modules.

## 2. Configuration

```js
window.VL_COURSE = {
  id: "gdc",                 // storage prefix: course data is saved under <id>-progress, <id>-try, <id>-note-…, <id>-side-…
  home: "index.html",        // contents page
  enReady: false,            // set to true only once the English edition is done; only then does the language button show (until then it is a hidden placeholder)
  enDir: "en/",              // folder for English pages (English pages link back to ../same-name file)
  topbar: true,              // false = no top bar
  chapters: [                // chapter n = item n; can also be written ["Chinese title","file","English"]
    { zh: "什么是游戏", en: "What Is a Game", file: "ch01-what-is-a-game.html" },
    { zh: "玩家动机", en: "Player Motivation", file: "ch03-…html", open: false },   // open:false = still being written, no link
  ],
  parts: [{ zh: "一、认识游戏", en: "I. Understanding Games", from: 1, to: 5 }],
};
window.VL_I18N = { zh: { "cc.tag": "关键词" }, en: { "cc.tag": "Key idea" } };   // optional: override interface strings
```
- Chapter pages use `<body data-ch="N">` (if omitted, the chapter is found by file name in the chapter list). vl.js writes `body[data-part]` (which part), `body[data-pat]` (chapter number % 4, which skins use to vary the paper texture), `--vl-dh` (a small hue shift within a part, −18…+18) and `--vl-chnum` (the two-digit chapter number, which a skin can use as a corner mark).
- Language: pages with `<html lang="en">` use the English table (`EN` in vl.js). Every interface string goes through `VL.t(key, Chinese default, …args)`, with `{0}{1}` in the template replaced by the arguments. English fields in the chapter list and contents page are `en` / `nameEn` / `descEn` / `whoEn`.
- The top bar on English pages always has a "中文" (Chinese) button pointing to `../same-name file`. How an English-only course hides it, and how the `en/` pages of a bilingual course are laid out (file names, ids, `data-save` and `data-try` matching the Chinese pages), are in `starter/README.md` section 5.
- Reader preferences have no course prefix and apply across courses: `vl-scheme` (light / dark / sepia) and `vl-fx` (auto / full / lite / off). They are written to `<html data-scheme>` and `html.vl-fx-full|lite|off`.

## 3. Writing the components

### Navigation (generated automatically, nothing to write)
- **Top bar** `header.vl-topbar`: back to contents; chapter dots (wide screens, coloured by part, and a chapter changes colour once understood); a "Chapter N of M" button (a popover listing every chapter, so readers can jump chapters on a phone too); a "Display" button (colour scheme light / dark / sepia, motion auto / full / lite / off); the language button. Popovers close on Esc or a click outside, and focus returns to the button.
- **Sections**: `<div class="vl-sec"><h2>A concrete, scene-like heading</h2></div>`. Everything up to the next `.vl-sec` or `.vl-pager` is gathered into `.vl-sec-body`. Section numbers `.vl-n` are added automatically. Click the heading or press Enter / Space to fold it. Headings carry no level labels.
- **In-chapter contents + reading progress**: with two or more sections, a floating button `.vl-fab` appears at the bottom right and opens a panel (the current section is the one whose top edge has passed 35% of the viewport; expand all / collapse all; back to top). A progress bar `.vl-readbar` sits at the top. The bar only shows position and **does not record "read"**.
- **Chapter pager** `nav.vl-pager`: previous chapter / next chapter. When the next chapter is `open:false`, it says "Chapter N is still being written" and links back to the contents page.
- Print: sections, side paths, examples and quizzes are all expanded.

### Chapter opening
```html
<div class="vl-hero"><div class="vl-hero-txt"><h1>核心循环</h1><p class="vl-sub">从处境出发的一句副标题</p></div><span data-illus="c02-hero"></span></div>
<div class="vl-goals"><h3>读完你能</h3><span class="vl-time">约 30 分钟</span><ul><li>…</li></ul></div>
```
(Sample text: "核心循环" Core loop; "从处境出发的一句副标题" a one-line subtitle that starts from a situation; "读完你能" After reading you can; "约 30 分钟" about 30 minutes.) The badge `.vl-badge` ("Chapter N") is added automatically if missing.

### Image beside text, grids
`<div class="vl-withimg">image<div>text</div></div>`: on wide screens a 38% image column plus a text column, **top-aligned, no text wrap**. `.rev` puts the image on the right, `.narrow` makes the image column 26% (portraits). At ≤700px they stack. `.vl-grid2/3/4` are equal-width grids; `.vl-vs` is a two-column comparison (add `.bad` to a child to mark the negative side).

### Illustration slots (illus.js)
`<span data-illus="name"></span>` becomes an inline SVG (viewBox 200×140) and gets `.vl-illus` automatically. An unregistered name shows a dashed placeholder `.vl-illus-miss` and does not throw.
```js
VL.illus.add("c02-hero", "alt：画面里有什么", k => k.ground() + k.person(60, 63, { arms: "hold", look: 1 }) + k.holding(60, 63, { look: 1 }, "phone"),
                                             k => k.T(150, 30, 14, "再来一局", "middle"));   // 4th argument: text layer (outside the filter group)
VL.illus.svg(name)   VL.illus.mount(rootNode)   VL.illus.lib
// Vertical or other proportions: 5th argument { vb: "0 0 140 200" } (default "0 0 200 140"). Work in the new canvas's coordinates and pass the ground y yourself as k.ground(y). A person's feet are at y + 64·s, so enlarge s to make the figure fill the picture.
VL.illus.add("c02-face", "alt", k => k.ground(186) + k.person(70, 58, { s: 2 }), "", { vb: "0 0 140 200" });
```
(Sample strings: "alt：画面里有什么" alt: what is in the picture; "再来一局" one more round.)
`k` (= `VL.illus.kit`): `person(x,y,o)`, `hands(x,y,o)` (coordinates of both hands), `holding(x,y,o,object)` (draws the object between the two hands), `feetY(x,y,o)`, `ground(y=126)`, `T(x,y,fontSize,text,anchor)`, `eye`, `bubble(x,y,w,h,[tailTipX,tailTipY])`, `arrow(x1,y1,x2,y2)`, `item(kind,x,y)` (book box cup phone die star coin), `C` (palette), `reset()`.
`person` options: `s` scale; `arms` stand none up cover point hold wave chin throw club desk; `legs` stand run walk sit wide none; `face` smile grin sad flat shout o wide closed; `look` −1/0/1; `flip`; `hat` cap beanie tophat crown wizard; `hair` `glasses` `beard` `tie` `cape` `shirt`; `outfit:false`; `chair:false`; `floor`.
Built-in rules: a sitting pose gets a chair automatically; facing left (look<0) mirrors the arms and legs automatically; within one picture, the k-th person cycles through none → cap → long hair → beanie → top hat. The old names `illusAdd / illusSvg / illusKit` still work.
The above is the kit's default (notebook) drawing style. A skin with a different drawing style sets the hook `window.VL_SKIN.illus = base => ({ kit, svg, afterMount })` in `skin.js` to replace or add functions in `k` with the same interface (see the skin drawing hook comment in `illus.js` and `references/skin-contract.md` section 3). Feet are therefore not at the same height in every skin: check a standing person's y with `k.feetY(x, y, o)` or work it out as `y = groundY − k.feetY(x, 0, o)`; don't hard-code it.

### Numbered figures
`<figure class="vl-fig" id="fig-x">image<figcaption>caption</figcaption></figure>`: "Figure N" is written before the caption in order of appearance (don't write it by hand). In the text, `<a data-figref="fig-x" href="#fig-x">图</a>` is rewritten to "Figure N" automatically. Call `VL.figs()` after adding figures dynamically. Photos use `.vl-fig.photo`. Wrap wide tables and wide images in `.vl-scroll`.

### Concept diagrams (diagrams.js)
There are 12 types, written as `VL.diagram.<name>(target, config)` or declaratively with `<figure class="vl-fig" data-diagram="name">`. All the syntax, options, return values, keyboard behaviour and skin classes are in section 9.

### Example carousel
```html
<div class="vl-eg" data-t="吃豆人">illustration slot<p><b>吃豆人：</b>…</p></div>
<div class="vl-eg bad" data-t="只有成长">illustration slot<p>…</p></div>
```
(Sample tab names: "吃豆人" Pac-Man; "只有成长" growth only.) Two or more consecutive `.vl-eg` are merged into `.vl-egcar` automatically: tabs (`role=tablist/tab`, ← → Home End), ◀ ▶, a 50px swipe, and "1 / 3". Examples with a picture use two columns on wide screens. A counter-example `.bad` gets ✗ before its tab name and a dashed border. The tab name is `data-t`, otherwise the first `<b>` (≤14 characters). The small "Example / Counter-example" labels go through `VL.t`. Switching dispatches `vl:eg {i}`.

### Inline terms
`<span class="vl-term" data-def="one-line definition">term</span>`: hover, focus or tap shows a definition box (fixed, clamped inside the viewport, flips up or down automatically). Esc or scrolling closes it. `data-name` changes the title inside the box.

### Concept card (the picture slot is required)
```html
<aside class="vl-cc">
  <p class="vl-cc-name">核心循环</p>
  <p class="vl-cc-en">Core loop</p>
  <p class="vl-cc-by">出处：谁 · 哪本书 · 年份</p>
  <p class="vl-cc-plain">通俗地说的一句</p>
  <p class="vl-cc-def">一句定义（≤60 字）</p>
  <p class="vl-cc-eg">回指正文里的那个例子</p>
  <div class="vl-cc-fig"><span data-illus="…"></span></div>   <!-- or a small SVG, or "see Figure 3" -->
</aside>
```
(Sample text: "出处：谁 · 哪本书 · 年份" source: who · which book · year; "通俗地说的一句" one sentence in plain words; "一句定义（≤60 字）" a one-sentence definition (≤60 characters); "回指正文里的那个例子" point back to the example in the text.)
Added automatically: a small "Concept card" tag on the top edge (change it with `data-tag`), the "In plain words" and "Example" labels, and an `aria-label`. On wide screens the picture slot is on the right (≤240px); on narrow screens (≤700px) it follows source order, so with the slot written last it sits at the bottom of the card. **If `.vl-cc-fig` is missing, a red "missing concept picture" placeholder appears and console.warn fires.**

### "Why it works" box
```html
<div class="vl-why"><h3>标题是一句原理</h3><div class="vl-why-fig">图（可选）</div><p>≤2 段</p><p class="vl-src">出处……验证：上面的××</p></div>
```
(Sample text: "标题是一句原理" the heading is a one-sentence principle; "图（可选）" picture (optional); "≤2 段" at most 2 paragraphs; "出处……验证：上面的××" source… check it with: the ×× above.)
The "Why it works" tag is added automatically (change it with `data-tag`). With `.vl-why-fig`, wide screens use two columns (picture 34% on the right).

### Invention story box / optional side path (collapsed by default)
```html
<details class="vl-story"><summary><b>具体问题式钩子标题</b><small>一句介绍：里面有什么</small></summary>…</details>
<details class="vl-side" data-kind="history|math|play|debate|source|extra|more"><summary><b>…</b><small>…</small></summary>…</details>
```
(Sample text: "具体问题式钩子标题" a hook title phrased as a concrete question; "一句介绍：里面有什么" one line saying what is inside.)
A type tag is added automatically (Invention story / History / Maths / Play a little longer / Debate / Original source / Extra practice / Going further; change it with `data-tag`), along with an "Expand ▾ / Collapse ▴" button. The content goes into `.vl-side-body`. **Collapsed by default**; the reader's open state is remembered (key `<id>-side-<file name>-<id or index>`). Inside you can put an evolution chain `ol.vl-chain > li` (arrows as `li.vl-chain-ar`; at ≤600px it stacks vertically with arrows pointing down; a node picture is an illustration slot `data-illus` or `<span class="vl-chain-img"><img …></span>` placed before the node text, at most 200px wide, 240px on narrow screens) and a timeline `.vl-timeline > .vl-ev` (`.hasimg` with a picture, year in `b.vl-yr`).

### Try it
```html
<p class="vl-try" data-try="t1" data-done="完成！你看到了……">把误差降到 5% 以下。</p>
```
(Sample text: "完成！你看到了……" Done! You saw…; "把误差降到 5% 以下。" Get the error below 5%.)
```js
VL.tryDone("t1", optionalFeedback)   // the success condition is written in the page JS; returns true = first confirmation on this page
```
A small checkbox and "Try it:" are added automatically. On completion it is ticked and the feedback shown (`aria-live`), and saved to `<id>-try`. When the page is reopened it shows "Done before." (change with `data-was`). It dispatches a `document` event `vl:try {id, el, first}`, where `first` = the first time across sessions; the reward module gives rewards only when `first` is true.

### Guess, then reveal
```html
<div class="vl-guess" data-mode="think"><p class="vl-q">问题</p><div class="vl-ans">想法</div></div>
<div class="vl-guess" data-mode="pick"><p class="vl-q">问题</p>
  <ul class="vl-opts"><li data-right>选项<span class="vl-fb">这一项的反馈</span></li><li>…</li></ul>
  <div class="vl-ans">揭晓</div></div>
<div class="vl-guess" data-mode="estimate" data-min="1" data-max="1000" data-answer="60" data-scale="log" data-unit="次" data-step data-start data-digits data-pre><p class="vl-q">问题</p><div class="vl-ans">解释</div></div>
```
(Sample text: "问题" question; "想法" thoughts; "选项" option; "这一项的反馈" feedback for this option; "揭晓" the reveal; "次" times; "解释" explanation.)
- pick: the chosen option shows its own feedback. With `data-right` there are three states `.right / .wrong / .miss` (with ✓ ✗ as well, so colour is not the only signal). Without `data-right` it is a show of opinion and only `.on` is marked. "Guess again" starts over.
- estimate: a slider (linear or log). After the reveal it shows two markers, "You" and "Answer", the gap between them, and a one-line comment.
- After the reveal the container gets `.revealed` and a bubbling event `vl:guess {mode, pick, right | guess, answer, ratio}` fires.

### Quiz
```js
VL.quiz("#c2-quiz", [{ q, opts:[…], a:indexOfCorrectOption, why:"explanation", fixed:false, img:"optional HTML" }], { mode:"pick"|"drag", progress:true, badge:"optional text" })
```
One question at a time, paged sideways (◀ dots ▶, ← →). Dots have three states: `.tried` (answered wrong before) / `.ok` (answered right) / `.on` (current). Options are shuffled with a seed from the chapter and question number (`fixed:true` keeps the order); after shuffling, the right answer is always in a different position. A wrong option is struck through, disabled and shaken lightly; the right one shows the explanation. `mode:"drag"`: drag the answer card into the answer slot, or click a card and then press Enter on or click the slot. When all are right: a badge appears, `VL.Progress.done(chapterNumber)` is called (`progress:false` skips it), and a `document` event `vl:quiz-perfect {ch, firstTry, n}` fires. Each correct answer dispatches a bubbling event `vl:answer {i, firstTry}`. Returns `{go(i), el}`.

### Note box
`<textarea class="vl-note" data-save="reflect" placeholder="具体的开头……"></textarea>` (placeholder: "a concrete opening…"): saves as the reader types, under key `<id>-note-<file name>-<data-save or index>` (Chinese and English pages with the same file name share it, and renumbering chapters causes no clash). After 0.5 seconds without typing it shows "Saved".

### Interaction board and controls (structure only; appearance comes from the skin)
`.vl-board` (the shell for a signature interaction, the most solid-looking object in the course), `.vl-btn` (`.alt` secondary), `.vl-chip` (`.on .right .wrong .miss`), `label.vl-ctl > output + input[type=range]`, `.vl-msg` (feedback sentence, with `aria-live`). Wrap-up blocks `.vl-misc .vl-key .vl-tldr`: **write the label text in the HTML** (for example `<p class="vl-tldr"><b>一句话</b>……</p>`, where "一句话" means "In one sentence").

## 4. JS utilities and state

| API | Description |
|---|---|
| `VL.t(key, zh, …a)` | Interface strings |
| `VL.store.get/set/json/setJSON(k)` | Course data; keys get the `<id>-` prefix automatically, all wrapped in try/catch; `VL.raw` has no prefix |
| `VL.Progress.get() / done(n)` | "Understood" progress (recorded only by a fully correct quiz) |
| `VL.fx()` / `VL.setFx("auto|full|lite|off")` / `VL.motion()` | Motion level; `motion()` = not off. Changing the level dispatches `vl:fx {level}` |
| `VL.scheme()` / `VL.setScheme("light|dark|sepia")` | Colour scheme; dispatches `vl:scheme {scheme}` |
| `VL.shake(el)` | A light 280ms shake on failure (no shake at the off level) |
| `VL.rng(seed)` | Seeded random numbers (so the first screen is always the same) |
| `VL.$ / $$ / el(tag, attrs, html) / clamp / esc` | Small helpers |
| `VL.enhance(rootNode)` | Runs component enhancement again on dynamically inserted content |
| `VL.figs()` | Renumbers figures |
| `VL.popover(btn, panel)` | The same popover behaviour (Esc or a click outside closes it) |
| `VL.ready(fn)` | Runs after all scripts have run |
| `VL.CH / PARTS / cur / file / base / lang / nm(c) / partOf(n)` | Chapter information |

## 5. Motion
- Automatic choice (vl-head.js): system "reduce motion" or a headless browser → off; ≤700px or touch screen → lite; otherwise full. A level the reader picks under "Display" overrides the automatic result; the system "reduce motion" setting always wins. For screenshots, add `?fx=1` so headless browsers use the normal level too.
- Under `html.vl-fx-off` and `prefers-reduced-motion`, all animations and transitions are switched off. Every process animation in the components is guaranteed to leave the final state when switched off. A skin's ambient motion must check `vl-fx-lite` itself.

## 6. Colour schemes (reader-switchable)
**Dark mode is on hold**: the switch exists; dark has variables only and is not fully approved, while light and sepia are usable. For screenshot reviews, add `?scheme=dark|sepia` to the URL to switch temporarily (read by `vl-head.js`, not saved).
There are three schemes, `html[data-scheme="light|dark|sepia"]`, implemented by the skin through variables. In dark and sepia, `.vl-fig`, `.vl-cc-fig` and stand-alone `.vl-illus` keep a light picture board (`--plate`, text `--plate-ink`) and the colours inside stay the same. Page-specific SVG or canvas with hard-coded dark text is safe inside a `.vl-fig`.

## 7. Interactive components (vl-interact.js / vl-interact.css)

Purpose: HTML patterns and JS APIs for G6 hands-on tasks, P2 end-of-part review, G7 round-based mini-games, G8 step-through demos, G9 formula anatomy, E2 comparisons, M1 flip cards, M2 hotspot pictures, T6 comic strips, K9 document props, and K5 stance cards plus voting, G10 grid picker and G11 live plot (the first ten are in `vl-interact.js`, the live plot in `vl-plot.js`). Demo page `kit/demo-interact.html` (topic: reinforcement schedules).

### Loading

```html
<link rel="stylesheet" href="kit/vl.css">
<link rel="stylesheet" href="skin/skin.css">
<link rel="stylesheet" href="kit/vl-interact.css">      <!-- structure -->
<link rel="stylesheet" href="skin/interact.css">        <!-- skin appearance (all four skins have one) -->
…
<script src="kit/vl.js"></script>
<script src="kit/illus.js"></script>
<script src="kit/vl-interact.js"></script>              <!-- after vl.js, before page scripts -->
```
- Declarative patterns (flip cards, comparisons, hotspots, comics, step-through demos, formula anatomy, stance cards, votes) are mounted when the script loads. The JSON forms of hands-on tasks and end-of-part reviews are mounted after page scripts have run (`VL.ready`), so a page script can first pass a config containing functions through JS.
- Dynamically inserted content: `VL.interact(rootNode)`. `VL.enhance` is already wrapped and calls it too.
- Interface strings go through `VL.tr(key, Chinese default)`; the English table is `EN` at the top of vl-interact.js. Courses can override with `window.VL_I18N` (as with `VL.t`).
- All saving goes through `VL.store` (with the course prefix). Buttons a component hides with `hidden` are forced to `display:none` by CSS.
- The shell of a signature interaction is still `.vl-board`: the host elements of hands-on tasks, mini-games, step-through demos and formula anatomy take the `vl-board` class directly (so they look like the skin's interaction board).

### G6 Hands-on task engine `VL.task`

Five task types: `sort`, `order`, `pair`, `range` (set a value inside a range) and `judge` (rule on cards one by one). No health bar, no score, no failure.

```html
<div class="vl-board vl-task" id="c5-task" aria-label="强化程序动手题"></div>
<script>VL.task("#c5-task", { tryId: "c5-t1", title: "optional title", done: "optional: one line when everything is done", rounds: [ … ] });</script>
<!-- or pure JSON (no functions): <div class="vl-board vl-task"><script type="application/json">{"rounds":[…]}</script></div> -->
```
(Sample aria-label: "强化程序动手题" reinforcement schedule task.)

Fields shared by every round: `type`, `prompt` (the question), `hints: [where to look, why]`, `ok` (one line of explanation after getting it right), `miss` (an extra line for a wrong answer, optional). Text may contain HTML.

| type | Own fields | What the reader does | Keyboard / touch |
|---|---|---|---|
| `sort` | `bins: ["bin 1","bin 2"(,"bin 3")]`, `items: [{t, bin: binIndex, why}]` | Drag cards into bins; or click a card, then the bin's "Put it here"; click the empty card pool to put a card back | Tab to a card + Enter, then Tab to "Put it here" |
| `order` | `items: [{t, why}]` (written in the correct order; shuffled on the page and guaranteed not to equal the original order) | Drag, or the ↑↓ buttons | ↑↓ on a card |
| `pair` | `pairs: [{l, r, why}]` (right column shuffled) | Click an item on the left, then one on the right; matched pairs show the same ①②③ | Click to select |
| `range` | `min max step value target:[lo,hi] unit label ends:[left-end plain words, right-end plain words] low high`; in JS you can also give `fmt: v => text` and `view: v => HTML` (a small picture that changes with the slider) | Move the slider into the target range; the target range is drawn only after success | Native range |
| `judge` | `verdicts: ["是","不是"]` (yes / no), `cards: [{t, a: indexOfCorrectVerdict, why, hint}]` | Judge one card at a time; after a right answer, or two wrong ones, it shows "The book's verdict: X. Reason", then "Next card" | Buttons |

- **Two levels of error feedback** (on "Check"): the first time, "N cards are in the wrong place; rethink the ones marked ✗" (wrong items get ✗, a dashed frame and screen-reader text). From the second time on, it names one of them and gives its `why`. `range` uses `low` / `high`, and `hints[1]` from the second time. `judge`, per card: the first mistake strikes out that verdict and shows `hint`; the second gives the book's verdict directly.
- **Three levels of hints** (on "Hint"): `hints[0]` → `hints[1]` → "Place the answer for me" (still counts as done; the event has `revealed: true`).
- A `range` round whose starting value is already in the target range triggers `console.warn` (the reader would be right without moving anything).
- When everything is done: the closing line and "Do it again" appear; if `tryId` is set, `VL.tryDone(tryId)` is called; saved to `<id>-task` (a list of `fileName#id`), and on reopening the round number is followed by "done before".
- Events (bubbling): `vl:task-round {id, i, n, revealed, last}`, `vl:task-done {id, first, revealed}` (`first` = the first time across sessions).
- Returns `{el, id, rounds, restart(), at, state, locked, _solve(), _spoil(), _next()}`; `_solve/_spoil/_next` are self-test hooks.

### P2 End-of-part review `VL.review`

The part's knowledge map is placed separately using a template from `diagrams.md`. This component is "what you can now understand" plus false claims to strike out plus a series of hands-on rounds (same types as G6). Each correct round strikes the matching claim out in red pen.

```html
<div class="vl-review" id="p1-review"><script type="application/json">{
  "title": "本篇复习页：划掉三条错误论断", "intro": "每做对一题，就划掉一条错的说法。",
  "can": ["为什么抽卡比签到更粘人", "……"],
  "rounds": [ { "type": "sort", "claim": "随机奖励和固定奖励差不多。", "prompt": "…", "bins": […], "items": […], "hints": […], "ok": "…" }, … ] }</script></div>
```
(Sample text: title "Review page for this part: strike out three false claims"; intro "Each round you get right strikes out one wrong statement."; can "why gacha pulls are stickier than daily check-ins"; claim "Random rewards and fixed rewards are about the same.")
JS: `VL.review(el, cfg)`. Events: `vl:review-round {id, i, n, claim, revealed, last}` (each claim struck out), `vl:review-done {id, first, revealed}`; the two G6 events also fire. Saved to `<id>-review`. A "floor guardian / BOSS" look belongs to the skin; the kit does not draw it.

### G7 Round-based mini-game `VL.game`

The chapter writes only the setup, a single move, the win/lose check and the drawing. Number of rounds, HUD, stars, saving, scoring against the machine, failure diagnosis, the debrief and collapsed-by-default are all provided by the framework.

```js
const g = VL.game("#c5-game", {          // whatever the host already contains (canvas, its own buttons) stays as the stage
  title: "发奖员：让玩家撑下去",          // "The reward giver: keep the player going"
  fold: { t: "多玩一会儿：当一回发奖员", d: "三局，约 4 分钟，可以跳过" },   // ("Play a little longer: be the reward giver", "three rounds, about 4 minutes, skippable") if present, wrapped in details.vl-side[data-kind=play], collapsed by default
  rules: "开局前说清的规则", vs: "机器", tryId: "c5-t2", key: "optional save name",   // ("rules stated before the start", "the machine")
  hud: [["turn", "回合"], ["tok", "奖励剩"]],            // readout slots ("turn", "rewards left"); if rounds have steps, "steps left" is added automatically
  rounds: [{ name: "短局", goal: "撑过 8 回合。", steps: optional, say: optional opening line, …custom params }],   // ("short round", "survive 8 turns.")
  init(r, g) { return roundState; },
  move(s, input, g) { …; return "one line for the message area" /* or {msg, cost} */; },
  judge(s, g) { return { win: true, stars, msg, you, bot } | { lose: true, msg, you, bot, diag } | null; },
  diagnose(s, g) { return "<p>based on what the reader actually did, say what went wrong</p>"; },   // shown under "What went wrong" after a loss
  review(res, g) { return "<p>debrief after clearing the last round: give the meaning, not the numbers</p>"; },
  render(s, g) { …; g.set("turn", …); },
  keys: { ArrowUp: "give", ArrowRight: "skip" }, keysLabel: "screen-reader description of the stage",
  pad: true, padLabels: { ArrowUp: "给" }, padCenter: " ",               // on-screen arrow pad .vl-pad (3×3, only at ≤700px or on touch screens); "给" = give
  maxStars: 3, noStars: false, pick: true,
});
Buttons call g.act(input); g.win({…}) / g.lose({…}) can also be called at any time.
```
- Round chips: the next round can be chosen only after the previous one is cleared. Stars record the best result for each round. Saved to `<id>-game-<file name>-<key or host id>`; after a refresh the game returns to the first uncleared round.
- On a loss: a light `VL.shake` plus the diagnosis box. On a win: stars plus a message. Clearing the last round triggers `tryId` and the debrief.
- Events: `vl:game-win {id, i, stars, last, all}`, `vl:game-lose {id, i}` (the reward module subscribes; the component itself releases no particles).
- Available on `g`: `act win lose go(i) redo next restart set(k,v) say(html) vs(you,bot) draw() i r s res left over won stage`.

### G8 Step-through demo `.vl-steps`

```html
<div class="vl-steps vl-board" data-auto data-dur="2400">          <!-- data-auto = has "Play / Slow"; without it, manual stepping only -->
  <div class="vl-steps-stage"><svg …>
    <g data-st="2">appears from step 2</g> <g data-st="2-3">only in steps 2–3</g> <g data-st-hi="1 4">highlighted in steps 1 and 4</g>
  </svg></div>
  <ol class="vl-steps-list"><li>explanation of step 1 (≤2 sentences)</li>…</ol>
</div>
```
- Control bar: ⏮ from the start, ◀, ▶/⏸ (autoplay), ▶, a clickable segmented progress bar (`role=slider`; the current segment fills while playing), "2 / 4", and Slow (`aria-pressed`; each step lasts ×2 and the step transition takes 700ms). The narration `.vl-steps-say` (`aria-live`) shows the current step's explanation.
- Keyboard: once the component has focus, ← → Home End change steps and Space plays / pauses.
- Motion: changing steps only fades opacity (≤350ms, 700ms when slow). With motion off, the "Play" button becomes "next step" and no process is played.
- JS: `VL.steps(el, { draw(i, t, el) {…}, onStep(i, n) {…}, auto, dur })` → `{go(i), play(), stop(), step, n}`. `draw` is for canvas-style clips: while playing, t runs from 0 to 1; manual stepping sets t=1 directly. Event `vl:step {i, n}`. All steps are expanded in print.

### G9 Formula anatomy `.vl-anat`

```html
<div class="vl-anat vl-board">
  <div class="vl-anat-f"><span data-k="1">δ</span> = <span data-k="2">R</span> − <span data-k="3">V</span></div>
  <ul class="vl-anat-key">
    <li data-k="1"><b>δ</b>，读作"德尔塔"：惊喜有多大。例子里等于 3。</li> …
  </ul>
</div>
```
(Sample line: "δ, read 'delta': how big the surprise is. In the example it equals 3.")
- `data-k="1…6"` takes colours `--var-1…6` (falling back to `--q1…6` if the skin does not define them). The same quantity uses the same number across the whole course. The same quantity in the body text is written `<span class="vl-v2">R</span>` in the same colour. The KaTeX form `\htmlClass{vl-k2}{R}` is also recognised.
- Hover / focus previews, click pins (`aria-pressed`), click again to release; everything else fades. Key lines are Tab-focusable, ↑↓ move between lines, Esc releases. Event `vl:anat {k}`. JS: `VL.anat(el)` → `{pin(k), set(k)}`.

### E2 Comparison `.vl-compare`

```html
<div class="vl-compare" data-mode="cols">          <!-- cols two columns side by side (default) | toggle switch before/after in the same spot | slider drag a divider -->
  <div class="vl-cmp-a bad" data-label="固定比率">illustration + text</div>
  <div class="vl-cmp-b" data-label="可变比率">illustration + text</div>
</div>
```
(Sample labels: "固定比率" fixed ratio; "可变比率" variable ratio.)
- When one side has `.bad`, ✗ / ✓ is added before the labels automatically (so colour is not the only signal). On narrow screens cols stack.
- toggle: two chips above (`aria-pressed`, ← → to switch); both panels sit in the same grid cell, so the height does not jump. `data-start="1"` shows b first.
- slider: both panels need the same layout (for example two SVGs of the same size). The divider is `role=slider`, with ← → / PageUp/Down / Home / End (Shift for big steps) and pointer capture; `data-start="45"`. At the full motion level it wiggles the first time it enters the viewport, to hint that it can be dragged.
- Events `vl:compare {side}` or `{pos}`. JS: `VL.compare(el)` → `{set(v)}`.

### M1 (addition): Flip cards `.vl-flip`

```html
<div class="vl-flip" data-all="true">     <!-- data-all="false" = no "Flip all" button -->
  <div class="vl-flip-c"><div class="vl-flip-f">front: the wrong idea, word for word</div><div class="vl-flip-b">back: why it is wrong</div></div> …
</div>
```
A single card flips on click / Enter / Space (`aria-pressed`). With several cards, "Flip all / Close all" appears below. The 3D flip takes 400ms (it aids understanding); with motion off the face simply swaps. When every card has been flipped once, `vl:flip-all` fires; each flip fires `vl:flip {i, on}`. Don't put focusable things on a card face. JS: `VL.flip(el)` → `{all(on)}`.

### M2 Hotspot picture `.vl-hot`

```html
<figure class="vl-fig vl-hot" data-hint="先点一块，看它用的是哪种发法。">
  <svg …><g data-hot="chest" data-name="宝箱"><rect …/><text …>宝箱</text></g> …</svg>
  <!-- or an image: <div class="vl-hot-pic"><img …><button class="vl-hot-pin" data-hot="x" data-name="宝箱" style="left:40%;top:30%">1</button></div> -->
  <div class="vl-hot-text" data-for="chest"><b>可变比率</b>：……（≤3 句）</div>   <!-- or in the hotspot's data-info -->
  <figcaption>the caption says "why"</figcaption>
</figure>
```
(Sample text: hint "Click a part first and see which kind of payout it uses."; "宝箱" treasure chest; "可变比率：……（≤3 句）" variable ratio: … (≤3 sentences).)
Hotspots automatically get `tabindex=0 role=button aria-pressed`; Enter / Space selects and the arrow keys move between hotspots. The info box `.vl-hot-info` (`aria-live`, created automatically if missing) comes with "Seen N / M". Events `vl:hot {key}`, `vl:hot-all`. JS: `VL.hot(el)` → `{pick(key), current}`.

### T6 Comic strip `.vl-comic`

```html
<div class="vl-comic" aria-label="one sentence summing up the whole strip">
  <div class="vl-panel"><span class="vl-bub" data-x="30">short bubble ≤12 characters</span><span data-illus="…"></span><p class="vl-cap">caption ≤30 characters</p></div> …(2–4 panels)
</div>
```
Panel numbers are added before the captions automatically. Bubbles sit in the flow above the illustration (they don't cover people), with the tail position set by `data-x` (a percentage). One row on wide screens; at ≤600px it scrolls sideways. At the full / lite motion levels, a comic that is below the viewport when the page loads lights up panel by panel as it scrolls into view; with motion off, all panels are lit. A missing `aria-label`, or more than 4 panels, triggers `console.warn`.

### K9 Document prop `.vl-doc` (pure CSS)

```html
<div class="vl-doc" data-kind="file|news|diary|letter|lab">   <!-- notebook is an alias of lab -->
  <span class="vl-stamp">已归档</span>                      <!-- optional stamp ("Archived"): floats top right, text flows around it, never covers words -->
  <p class="vl-doc-meta">档案 1957-03 · 鸽子实验记录</p>
  <h4>标题</h4>
  <p>正文 ≤2 段</p>
  <div class="vl-doc-cols">报纸两栏正文（可选）</div>
  <p class="vl-doc-sign">落款</p>
</div>
```
(Sample text: "档案 1957-03 · 鸽子实验记录" File 1957-03 · pigeon experiment log; "标题" title; "正文 ≤2 段" body ≤2 paragraphs; "报纸两栏正文（可选）" two-column newspaper body (optional); "落款" signature.)
In the notebook skin: file = kraft folder + tab; news = masthead with double rule; diary = ruled paper + red margin line; letter = letter paper + handwritten signature; lab notebook = grid paper + binding edge. All four skins draw these five; fieldbook adds `ticket` (ticket stub), `clipping` (newspaper clipping) and `copy` (photocopy).

### K5 Stance cards `.vl-philo` + voting `.vl-vote`

```html
<div class="vl-philo" data-key="c22-philo1">
  <div class="vl-philo-slide" data-t="问题"><p class="vl-philo-q">问题</p><div class="vl-vote" data-options="算|不算|看情况"></div></div>
  <div class="vl-philo-slide" data-t="工具无罪">……<p class="vl-src">这是谁的看法</p></div>   <!-- the stance name states the view; the person's name goes in the source line -->
  <div class="vl-philo-slide" data-t="留给你">开放问题 <textarea class="vl-note" data-save="c22-philo1"></textarea></div>
</div>
```
(Sample text: "问题" question; options "算|不算|看情况" counts / doesn't count / it depends; "工具无罪" tools are innocent; "这是谁的看法" whose view this is; "留给你" over to you; "开放问题" open question.)
- One card at a time: tabs (stance names, `role=tablist`, ← → Home End), ◀ previous / next ▶, "2 / 4", swipe >50px. On a stance card, the top echoes "You chose: X" (if the reader has not voted, it says the first card is where to vote). All cards are expanded in print.
- Voting: `aria-pressed`, the vote can be changed, saved to `<id>-vote-<file name>-<data-key>`. It also works on its own as `<div class="vl-vote" data-key="…" data-options="A|B">`. Events `vl:vote {key, i, option}`, `vl:philo {i}`. JS: `VL.vote(el, {key, options})` → `{pick, option, on(fn)}`; `VL.philo(el)` → `{go(i), vote}`.

### G10 Grid picker `VL.cells`
For "rows of clickable cells": number guessing, seats, calendars, boards. Structure and keyboard live in the kit; looks belong to the skin (`.vl-cell` and state classes). The container gets `.vl-cells` and `role="group"`. Use the `name` option to set its `aria-label`; without `name`, and if the container has no `aria-label` / `aria-labelledby`, a default is filled in by page language (an existing label is never overridden).
```js
const g = VL.cells(document.getElementById("c03-grid"), { n: 100, cols: 10, label: i => i + 1, name: "Numbers 1 to 100",
  onPick: (i, cell) => { g.mark(i, "is-last"); } });
g.mark(41, "is-out");   g.mark(41, "is-out", false);   g.reset();   g.get(0);   g.cells
```
State classes: `is-out` struck out, `is-last` just picked, `is-hit` hit, `is-sel` selected. Arrow keys / Home / End move between cells (one cell is tabbable), Enter / Space picks. Cells are `<button>`s. Note `label` is the per-cell text function, not the container name.

### G11 Live plot `VL.plot`
Bar charts, line charts (which can be mixed), distributions, growth curves and comparisons; dragging a slider redraws the plot. It is a separate module, loaded only when needed (courses that don't use it leave it out):
```html
<link rel="stylesheet" href="kit/vl-plot.css">      <!-- in <head>, after the skin -->
<script src="kit/vl-plot.js"></script>              <!-- after vl.js, before page scripts -->
<figure class="vl-fig"><div id="c03-plot"></div><figcaption>……</figcaption></figure>
```
```js
const p = VL.plot("#c03-plot", {
  type: "bar",                                  // default chart type "bar" | "line"; each series can override it with series[i].type (bars + lines mixed)
  height: 220,                                  // svg height in px (excluding the y-axis name / legend above and the x-axis name below)
  x: { label: "猜了几次", n: 11 },               // category axis: n cells (or cats:["Jan",…]); cell names default to the index (from: 1 counts from 1; fmt(i) customises)  ("猜了几次" = number of guesses)
  y: { label: "剩下几个数", min: 0, max: 100 },   // without min/max it picks them automatically, rounds to tidy numbers and includes 0 (zero:false stops forcing 0)  ("剩下几个数" = numbers left)
  series: [
    { name: "猜中间", data: [100, 50, 24], labels: true },        // labels: write the value on top of the bar / at the point (can be a formatting function); if they don't fit, none are written for the whole series  ("猜中间" = guess the middle)
    { name: "逐个猜", type: "line", data: [100, 99, 98] },        // a second line is automatically dashed with square dots; dash:false|true|"4 3", dots:true|false, fill:true draws an area  ("逐个猜" = guess one by one)
  ],
  marks: [{ y: 50, label: "一半" }, { x: 3, y: 12, label: "你猜的" }, { x: 7, label: "第 7 次" }],   // horizontal reference line / annotated point / vertical reference line (color changes the colour)  ("half", "your guess", "round 7")
  hi: 2,                                        // highlight the bar (or point) at index 2; an array also works
  aria: d => "每猜一次后剩下的数：" + d.series[0].data.join("、"),   // updates the svg aria-label on every redraw ("Numbers left after each guess: …"); generated automatically if omitted
});
range.addEventListener("input", () => p.set(newData));            // an array = replace the first series' data
p.set({ series: [{ data: a }, { data: b }], marks: [], hi: null });  // merges series by index (names and colours kept); x / y can also be changed in part
```
- Returns `{ el, svg, set(data or partial config), draw(), destroy(), opts }`. Calling `VL.plot` again on the same container is the same as `set`. The container is an empty `<div>` (its contents are replaced); don't pass an `<svg>`.
- The text of annotations (`label` in `marks`) is placed afresh on every redraw: it tries several positions (above, below, left, right and diagonals of a point; the two ends of a horizontal line, above and below; the two ends of a vertical line, left and right), picks the one overlapping bars, lines, points and other labels least, and keeps it inside the plot area. When nothing is clear, value labels (`labels`) give way. Keep label text short.
- X axis: if there are bars or `cats` is given, it is a **category axis** (data goes one cell per index, and line points sit in the middle of the cell); with lines only it is a **numeric axis**, where `data` can be `[y, …]` (x = index) or `[[x, y], …]`, and `x.min / max` default to the data range. `x.ticks` / `y.ticks` can be customised: `[0, 50, 100]` or `[[0, "gift day"], [6, "half a year"]]`. `x.hidden` / `y.hidden` hide that axis's ticks. `null` is a gap (no bar is drawn; the line breaks).
- **Text does not shrink on phones**: the viewBox width = the container's real pixel width (a ResizeObserver redraws), and font sizes are fixed pixels (`--vp-fs` for numbers, `--vp-fs-txt` for text, default 14px; the pixel skin uses 19 / 15px). When narrow, fewer ticks are drawn and category names are written every few cells; a custom tick that would collide with the previous one is skipped. Tick steps are 1 / 2 / 5 × 10ⁿ. The y-axis name, legend and x-axis name are HTML (above / below the plot) and wrap on narrow screens.
- Colours: series default to `--q1…--q6` (`color` accepts any CSS colour or `var(--…)`), axes and text use `--ink` `--ink2`, the highlight uses `--accent` (`--vp-hi`); all of the `--vp-*` variables can be overridden on the page. Inside a `.vl-fig` it follows the picture board in dark and sepia. Colour is not the only signal: with several series a legend appears automatically (`legend:false` turns it off, `true` shows it even for one series), lines get dashes plus different dot shapes, the second group of bars onward get hatching, and the highlighted bar gets a heavier border.
- The pixel skin (`VL_SKIN.name === "pixel"`; the container's `data-skin` is written by the script) uses `shape-rendering:crispEdges`. There is no redraw transition (dragging draws the final state directly), so reduced motion is not involved.
- When the container leaves the page, the listener stops itself at the next size change; if you remove the whole block dynamically, calling `destroy()` is cleaner.

### Events at a glance

| Event (all bubble) | When | detail |
|---|---|---|
| `vl:task-round` / `vl:task-done` | Hands-on task: one round right / all done | `{id,i,n,revealed,last}` / `{id,first,revealed}` |
| `vl:review-round` / `vl:review-done` | Review: one claim struck out / cleared | `{id,i,n,claim,revealed,last}` / `{id,first,revealed}` |
| `vl:game-win` / `vl:game-lose` | Mini-game: a round won / lost | `{id,i,stars,last,all}` / `{id,i}` |
| `vl:step` | Step-through demo changes step | `{i,n}` |
| `vl:anat` | Formula part pinned / released | `{k}` |
| `vl:compare` | Comparison switched / divider dragged | `{side}` / `{pos}` |
| `vl:flip` / `vl:flip-all` | One card flipped / every card flipped | `{i,on}` / `{n}` |
| `vl:hot` / `vl:hot-all` | One part clicked / every part seen | `{key}` / `{n}` |
| `vl:vote` / `vl:philo` | Vote cast / stance card paged | `{key,i,option}` / `{i}` |

Reward motion (stars, stamps) only subscribes to these events; components themselves play only feedback motion.


## 8. Optional modules (kit/modules/)

Purpose: files, load order, configuration and APIs of the optional modules (unified concept data, concept map, glossary, flashcards, reading rewards, companion character, sound). When to add them and their pitfalls are in `references/modules.md`; data fields are in `kit/modules/concepts-schema.md`. Demo: `kit/modules/demo-modules.html` (a three-chapter mini course with fake data).

### 8.1 Files and load order

| File | Where | What it does |
|---|---|---|
| `modules/modules.css` | `<head>`, after vl.css | Structural styles for the modules |
| `skins/<name>/modules.css` | after skin.css | Module appearance (e.g. notebook = stamp album + rubber stamps; all four skins have one) |
| `js/concepts.js` (written by the course) | after `js/course.js`, **before vl.js** | `window.VL_CONCEPTS` |
| `modules/vl-concepts.js` | after concepts.js, **before vl.js** | `VL.concepts`; fills `.vl-cc[data-concept]` first, then vl.js adds the tags; generates related chapters automatically |
| `modules/sound.js` | after vl.js and illustration packs | `VL.sound`, speaker in the top bar |
| `modules/collect.js` | same | `VL.collect`, "Stamp album" in the top bar |
| `modules/companion.js` | same | `VL.companion`, a character in the page corner |
| `modules/graph.js` | same | `VL.graph / miniMap / graphList / mapPage` |
| `modules/terms.js` | same (glossary and flashcard pages) | `VL.glossary / flashcards` |
| `modules/build-concepts.mjs` | command line | Scans the chapters to generate / validate concepts.js |
| `modules/map.html` `glossary.html` `flashcards.html` | templates, copy to the course root | Work once the paths in the head are fixed |

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
Load only the modules you chose. When illustrations in concept cards or stamps come from other chapters, load those chapters' illustration packs too (or gather the small concept pictures into one `js/illus-concepts.js`).

### 8.2 Configuration (VL_COURSE.modules)

```js
window.VL_COURSE = { …,
  mapHref: "map.html",                    // concept map page (target of the "see the whole course map" links in the mini map and glossary)
  modules: {
    collect: { title: "集邮册", titleEn: "Stamp album", button: true },   // false = reading rewards off
    related: true,                        // false = don't insert "Related chapters" automatically
    relatedFuture: true,                  // false = related chapters list only earlier chapters
    sound: true,                          // false = no speaker; true is still muted by default
    companion: {                          // omitted = no companion character (the default)
      name: "小格", nameEn: "Grid", label: "小格，点一下听它说话",   // label: "Grid, click to hear it talk"
      art: "demo-buddy",                  // illustration name or SVG string; omitted = default round face
      side: "left",                       // left | right
      max: 3,                             // at most this many unprompted lines per chapter
      lines: { try: ["…"], perfect: ["…"], tryEn: [], perfectEn: [] },
    },
  },
};
```

### 8.3 Unified concept data VL.concepts

| API | Description |
|---|---|
| `items` `terms` `links` | Normalised data (edges merged and deduplicated, types unified as prereq / explains / applies / contrast) |
| `get(id)` `ofChapter(n)` `entries()` | Get concepts; `entries()` = concepts + terms |
| `neighbors(id)` | `[{id, type, dir:"out"|"in"}]` |
| `related(n, {future, max})` | Related chapters: `[{ch, score, via:[{here, there, type, dir}]}]`, sorted by edge weight (prerequisite 3, explains / applies 2, contrast 1) |
| `renderRelated(target?, n?)` | Fills `<nav class="vl-related">`; without a target it is inserted before the pager |
| `cardHTML(c, {eg})` `fillCards(root)` | Builds concept card content from the data |
| `name(c)` `other(c)` `pick(c, "def"|"plain"|"by")` | Pick fields by page language |
| `relLabel(type, dir)` `TYPES` | Wording for relations ("needs first", "used in", …) |
| `chHref(n, id?)` `mapHref(id?)` `isOpen(n)` `partOf(n)` | Links and parts |

### 8.4 Concept map (graph.js)

- **Whole-course page**: a single `VL.mapPage()` line in `map.html` takes over `#vl-map` (map), `#vl-maplist` (list), `#vl-mapinfo` (concept card + go to chapter N + neighbours grouped by relation), `#vl-mapq` (search), `#vl-mapparts` (filter by part), `#vl-maplegend`, `#vl-mapviews` and `#vl-maplayouts`. At ≤700px the list view is the default. `map.html#conceptId` opens with that concept selected.
- **Component**: `VL.graph(target, {ids, layout:"layered"|"force", groupBy:"auto"|"chapter"|"part"|fn, maxRows:7, info, onSelect, here})` → `{select(id), clear(), filterParts(Set), search(q) → ids, setLayout(m), relayout(), selected}`; selecting dispatches a bubbling event `vl:concept {id}`.
- Drawing: nodes are `<button class="vl-gn" data-part>` (HTML, usable by keyboard and screen readers); edges are in a lower layer `svg.vl-gedges[aria-hidden]`, each a `g.vl-ge.t-<type>` containing `.vl-ge-ln` and an arrowhead `.vl-ge-ah` (a triangle, not a marker, so skins can colour it). Layered layout: columns by chapter (by part when there are more than 8 chapters), ≤maxRows per column, nodes within a column sorted 4 times by their neighbours' average position; edges crossing columns arch over. Force layout: starts from the layered result and runs a deterministic 260 steps with rectangle repulsion.
- State classes: `.vl-graph.has-on / .has-q`; nodes `.is-on .is-nb .is-hit .is-lit` (collected in the stamp album) `.is-off` (chapter not open) `.is-here` (this chapter, in the mini map) `.is-principle`.
- Keyboard: Tab enters the map (only one node is tabbable, roving focus); arrow keys move to the nearest node in that direction (when something is selected, its neighbours come first); Home / End; Enter / Space selects; Esc deselects.
- **Chapter mini map**: `<div class="vl-minimap" data-ch="3"></div>` or `VL.miniMap(ch, target, {future:false})`. This chapter's concepts form one column, with connected concepts from earlier chapters on the left; later chapters are not drawn by default (the text never previews later chapters). Clicking a node shows a one-line definition and "Go to chapter N" below.
- **List view**: `VL.graphList(target)`, buttons grouped by part → chapter, which expand in place to show information (`aria-expanded`).

### 8.5 Glossary and flashcards (terms.js)

- `VL.glossary(target)`: concepts + terms. Chinese is sorted by pinyin (`Intl` pinyin collation, with boundary characters giving the initial letters) and English alphabetically. It has initial-letter jumps, search (Chinese, English, aliases, definitions), and every entry links back to its chapter (concepts jump to `#cc-id`, terms to `anchor`). Core concepts carry a "Core concept / Worldview principle" tag linking to the concept map. `glossary.html#gl-<id>` highlights that entry.
- `VL.flashcards(target, {perRound:10})`: four Leitner boxes (same day / 1 day / 3 days / 7 days). A right answer moves the card up a box; a wrong one sends it back to the first box and repeats it at the end of this round. The card must be flipped before it can be judged. Space flips, ← not yet, → got it. Only words from chapters already understood (quiz fully correct) appear; the reader can tick "also practise chapters not yet understood". Saved to `<id>-flash`. Returns `{round(ids?), flip(), judge(ok)}`. At motion levels other than full, the face swaps without a 3D turn.

### 8.6 Reading rewards (collect.js)

- Subscriptions: `vl:try` (when `first`, collects the concept of `.vl-try[data-concept]` or of the first `.vl-cc[data-concept]` in the same section), `vl:quiz-perfect` (this chapter's stamp plus all its concepts, and an "Understood" stamp on the quiz badge), `vl:review-round {concepts | ch}` (each correct round of an end-of-part review). Note that the `vl:review-round` dispatched by `VL.review` itself carries only `{id, i, n, claim, revealed, last}`, without `concepts` / `ch`, so the stamp album collects nothing from it. To collect cards, the page listens for it and then dispatches its own event of the same name carrying `concepts` or `ch`. Chapter stamps read `VL.Progress` and are not stored separately.
- Saving: `<id>-cards` (collected concepts), `<id>-col-seen` (things already celebrated: `ch-N`, `full-N`, `all`); each thing is celebrated only once.
- Appearance: toast `.vl-col-toast` (≤1.2s, `pointer-events:none`; at the off level it is only announced to screen readers), top bar `.vl-tb-col` + `.vl-col-count`, dialog `.vl-col-back > .vl-col-dlg` (Tab stays inside, ← → page, Esc closes), chapter stamp `.vl-col-stamp.is-got|is-empty`, album cell `.vl-col-cell`, postmark `.vl-col-pm`, and `.vl-col-mark` on the quiz badge.
- Contents page: `<div data-vl-collect="map">` (whole-course map, understood chapters stamped), `<p data-vl-collect="next">` (bookmark: the first chapter not yet understood), `<div data-vl-collect="album">` (the whole album laid open).
- API: `VL.collect.has(id) / add(ids, reason, quiet) / open() / close() / next() / total() / reset()`; collecting a new concept dispatches `vl:collect {ids, reason}` (the concept map lights up nodes from it).

### 8.7 Companion character (companion.js)

- Lines: on each section, `<div class="vl-sec" data-lines="line one|line two" data-lines-en="…">` (a JSON array also works). On click it takes turns through the lines of the current section (the one whose top edge has passed 35% of the viewport). A section with no lines gets only "……"; no generic filler lines.
- Unprompted lines: on the first completion of a Try it (`.vl-try[data-say]` first, otherwise `lines.try`) and on a fully correct quiz (`lines.perfect`), at most `max` times per chapter.
- Bubble `.vl-comp-bub`: `aria-live=polite`, `pointer-events:none`, disappears after about 2.6 seconds (a little longer for more text, 6 seconds at most), on scroll, or on Esc. It hops only at the full motion level.
- It never covers the text: each time it speaks, it measures the empty space beside the text column (the content box of `main.vl-wrap`) on the character's side. With ≥180px the bubble floats in that space. When there is not enough (with an 860px text column, anything below about 1270px counts, including 1100), the bubble gets `.is-flow` and is inserted into the text flow (between direct children of `main` or `.vl-sec-body`, at the lowest point in the viewport that is above the character button), the content below moves aside, and the bubble moves back beside the character when it closes. Without side space, `<html>` gets `vl-comp-pad` and the body keeps room at the bottom for the character button.
- The switch is in the top bar's "Display" popover (show / hide), saved to `<id>-companion`. API: `VL.companion.say(text) / hide() / set(bool) / shown()`.

### 8.8 Sound (sound.js)

- Muted by default; top bar speaker `.vl-tb-sound[aria-pressed]`, saved to `<id>-sound`; the AudioContext is created only when sound is turned on.
- Sounds: `click flip pop ok wrong coin clear stamp`, played with `VL.sound.play(name)`. The timbre comes from the skin's CSS variable `--vl-snd`: `paper` (paper and pencil: notebook, paper, fieldbook), `sine` (default), `square` (pixel), `triangle`; only these four are recognised.
- Automatic hooks: `vl:try`, `vl:answer` → ok; a wrong quiz option and a wrong `vl:guess` → wrong; `vl:quiz-perfect` → clear; collecting a card in the stamp album → coin, stamping → stamp. Nothing sounds on scroll.

### 8.9 build-concepts.mjs

```
node kit/modules/build-concepts.mjs <absolute course folder path> [--write] [--course js/course.js] [--concepts js/concepts.js] [--out path]
```
By default it only validates (exit code 1 if anything is ✗). `--write` merges new concept cards and new terms into the data (hand-written fields are kept, the original file is backed up as `.bak`, and comments are lost). The checks are listed in the comment at the top of the file.

## 9. Concept diagrams (diagrams.js, 12 types)

Purpose: how to write the twelve concept diagrams and their options. Which one to use when, and the drawing rules, are in `references/diagrams.md`; this section covers only how to call them. Demo page `kit/demo-diagrams.html` (add `?sel=1` to the URL to see highlighting).

### Loading

```html
<link rel="stylesheet" href="kit/vl.css">
<link rel="stylesheet" href="skin/skin.css">
<link rel="stylesheet" href="skin/diagrams.css">   <!-- skin appearance for the later seven diagrams (types 6–12; all four skins have one; new-course.mjs links it automatically) -->
…
<script src="kit/vl.js"></script>
<script src="kit/diagrams.js"></script>            <!-- after vl.js -->
```
(Paths are written for a course generated by `new-course.mjs`: `kit/` is the copied kit and `skin/` is the copied skin.)

### Two ways to write them

```js
VL.diagram.cycle("#fig-loop", { nodes: [...], caption: "…" });   // JS call, returns the api
```
```html
<figure class="vl-fig" data-diagram="cycle">
  <script type="application/json">{"nodes":[…]}</script>
  <figcaption>The caption says "why"; it does not repeat the words in the picture.</figcaption>
</figure>
```

`target`: a `figure.vl-fig` or a selector; if it is not a figure, a new one is created inside it. `caption` is used only when there is no `<figcaption>`.

### Options shared by all diagrams

| Option | Effect |
|---|---|
| `caption` | Caption (HTML) |
| `label` | Overrides the generated `aria-label` (by default the node names and examples are joined into a sentence) |
| `hint` | Default prompt in the info line; the default is "点一个部分，看看它在做什么。" (Click a part to see what it does.) |
| `select: false` | Turns off selection (static diagram) |
| `info: false` | No info line under the diagram |
| `onSelect(i, item)` | Selection callback; clicking again deselects, `i = -1` |

Every clickable block has `info` (HTML shown in the info line when selected); without it, "name + example" is shown.

**Returned api**: `{ el, svg, redraw(), select(i), selected }`; on selection the figure dispatches `vl:dgselect` (`detail.i`). Keyboard: Tab to a block, Enter / Space selects, arrow keys move between blocks.

**General node form**: `{ name: "≤6 characters", eg: "a concrete example of ≤14 characters", info: "<b>…</b>…", c: 1–6 }`. `c` picks a colour block (`--dg-c1…c6`); if omitted, colours rotate in order. (Character limits are for Chinese text; English needs roughly two to three times as many letters, so keep English names and examples equally short.)

### 1 cycle

```js
VL.diagram.cycle(t, { nodes: [{name, eg, info}], center: "再来一局", numbered: true })   // "再来一局" = one more round
```
On wide screens the nodes sit on an ellipse. On narrow screens (<560px), four or more nodes form a two-column "racetrack" (right column going down, left column going up), with `center` in the gap between.

### 2 nested

```js
VL.diagram.nested(t, { layers: [innermost, …, outermost], spin: true })
```
On wide screens the labels sit on the right, joined to each layer by leader lines; on narrow screens they become numbered circles plus a key under the diagram. `spin` draws a curved arrow of about 74px on the left of each layer.

### 3 flow

```js
VL.diagram.flow(t, { nodes: [...], dir: "auto" | "row" | "column", numbered: false })
```

### 4 quadrant

```js
VL.diagram.quadrant(t, { x: {name, lo, hi}, y: {name, lo, hi}, quads: [topLeft, topRight, bottomLeft, bottomRight], points: [{x: 0–1, y: 0–1, label}] })
```
The height is computed so the four corner labels fit, and is at most 300px on wide screens.

### 5 compare (two columns)

```js
VL.diagram.compare(t, { a: {name, eg, mark: "✓"}, b: {…}, rows: [{k: "dimension compared", a: "…", b: "…", info}] })
```

### 6 timeline / rhythm

Two styles: with `tracks` it is a track timeline, otherwise a curve.

```js
// Tracks: each is a row of dots (actions); the ones listed in hits are drawn as stars (got a reward)
VL.diagram.timeline(t, {
  legend: "每个圆点 = 一次行动；星 = 这一次拿到奖励",   // "each dot = one action; star = got a reward this time"
  x: { lo: "开始", hi: "之后", name: "次数 / 时间" },   // "start", "later", "count / time"
  tracks: [{ name, eg, info, dots: 15 | [positions 0–1…], hits: [dot indices (from 0)…] }],
})
// Curve: rises and falls + key moments
VL.diagram.timeline(t, {
  curve: [0–1, …],                       // evenly spaced samples, drawn as a smooth curve
  events: [{ at: 0–1, name, eg, info }],  // vertical dashed line + a point on the curve
  x: { name, lo, hi, ticks: [{at, text}] }, y: { hi: "紧张", lo: "放松" },   // "tense", "relaxed"
  demo: true,                            // adds "（示意）" (illustrative) after the axis name
})
```
Curve style: on wide screens the labels sit above the diagram (at most three rows, staggered automatically, with leader lines that don't cross other labels). If they don't fit, or on narrow screens, they become numbered circles plus a key under the diagram (two columns on wide screens).

### 7 tree / classification

```js
VL.diagram.tree(t, {
  root: { name, eg, children: [{ name, eg, edge: "胜率 40%", children: [...] }] },   // "胜率 40%" = 40% win rate
  max: 5,            // max children shown per node; the rest fold into "还有 N 种" ("N more", dashed box)
  dir: "indent",     // optional: force vertical indentation
})
```
On wide screens the root is at the top and each level is aligned, with `edge` written beside the connecting line. If the whole tree does not fit, it switches to vertical indentation (like folders), with `edge` written above the child box. Clicking a node keeps its path to the root and its children clear; everything else fades.

### 8 venn

```js
VL.diagram.venn(t, {
  sets: [{ name, eg, c }],                       // 2–3 circles
  regions: [{ in: [0, 1], eg: "具体例子", name, info }],  // in = which circles this region is inside (indices from 0); "具体例子" = a concrete example
})
```
Each region holds an `eg` (one concrete example, not the region's name). The text is placed automatically at the point in the region farthest from the circle edges where it fits, with 5px all round. Text in a region breaks only at punctuation, spaces and "、" (the Chinese enumeration comma), never mid-word. If it doesn't fit, the font drops one size and tries again; if it still doesn't fit, a numbered circle is used with a key under the diagram. So separate long examples with "、" or spaces (for example "体育课、广播操", PE class, morning exercises). Circle names sit outside the circles: on wide screens to the left and right (the third circle below), on narrow screens above, joined to the circle edge by leader lines. Clicking anywhere in a region selects it, and the selected region gets an accent-colour fill; clicking a circle name selects the whole circle.

### 9 balance

```js
const api = VL.diagram.balance(t, {
  left:  { name, eg, weights: ["重剑", "暴击"], c },   // "heavy sword", "critical hit"
  right: { name, eg, weights: [...], c },
  pivot: { name, eg },                     // optional: pivot note, placed under the base
  tilt: -1 … 1,                            // −1 left side fully down, +1 right side fully down; or give left.value / right.value to compute it
  slider: { label, min: 0, max: 100, value, step, unit },   // optional: a built-in slider makes it a live diagram
  onTilt(v) {}, onSlide(v) {},
});
api.tilt(0.5);        // animates to the new angle (jumps there directly with motion off)
api.tiltValue;        // current angle
```
The slider value maps linearly to −1…1 (minimum = left side fully down). Maximum tilt is 12°, and the beam ends rise at most 40px. Space above is reserved only for the range it will actually swing through (the full range with a slider, the current `tilt` without one; if `api.tilt()` goes beyond that range, the diagram redraws). The `pivot` note sits right under the base and moves below the two side names only if it collides with them. When nearly level (|tilt| < 0.06) the wrapper gets `.is-level`, and the notebook skin paints the pivot green.

### 10 network / relations

```js
VL.diagram.network(t, {
  nodes: [{ id, name, eg, main: true, x: 0–1, y: 0–1, nx, ny }],  // hand-placed positions; nx/ny are narrow-screen positions (optional)
  edges: [{ from, to, label, kind: "cause" | "link" | "both" }],  // cause solid arrow, link dashed without arrow, both two-way arrow
  aspect: 0.46,      // height-to-width ratio, default 0.46 on wide screens and 1.1 on narrow; boxes that overlap make it taller automatically
  legend: true,      // by default a legend is drawn only when two or more edge kinds are used
})
```
Without x/y, nodes are placed in a circle around the centre (`main` in the centre). The rule is to place them by hand to avoid crossing lines (automatic placement only connects neighbouring nodes and the centre, otherwise lines would cross the centre box). When boxes crowd together, the diagram first gets taller, and if they still crowd they are pushed apart in pairs, with at least 12px between boxes. Edge labels find a free spot along the line automatically and the line breaks around the text. If the line segments on either side of the text would be shorter than 18px, or no free spot is found, the label is not drawn on the line but listed under the diagram as "A → B: label" (`.vl-dg-elist`). Clicking a node lights only it, its neighbours and the connecting edges; the default `info` lists "连着：…" (connected to: …).

### 11 spectrum

```js
VL.diagram.spectrum(t, {
  name: "规则有多严",   // "how strict the rules are"
  lo: { name: "嬉戏", eg: "想怎么玩就怎么玩" }, hi: { name: "竞技", eg: "规则严密、分输赢" },   // "play: do whatever you like"; "competition: tight rules, winners and losers"
  items: [{ at: 0–1, name, eg, info }],
})
```
On wide screens a horizontal axis, with the plain-words ends above the axis and item labels hanging below (wrapping onto more rows when crowded). On narrow screens a vertical axis with labels on the right.

### 12 stack

```js
VL.diagram.stack(t, {
  layers: [bottom, …, top],          // {name, eg, value, info, c}
  unit: " 分钟",                      // " minutes"
  total: { name: "一局 30 分钟", eg: "四层加起来" } | "合计",   // optional ("a 30-minute round", "the four layers added up" | "total"): drawn above the bar, with a brace
})
```
With `value`, heights are proportional (at least 30px) and the value follows the name; without it, heights are equal, based on the label height. Labels sit outside the bar on the right, joined to each layer by leader lines.

### Classes available to skins

Boxes and lines: `.vl-dg-box` (box, can take a filter), `.vl-dg-ln` (line, can take a filter), `.vl-dg-ah` (arrowhead), `.vl-dg-lead` (leader line), `.vl-dg-hit` (transparent hit area), `.vl-dg-dot`, `.vl-dg-pt`, `.vl-dg-ghost`.
Per type: `.vl-dg-ring` `.vl-dg-spin` (nested), `.vl-dg-cell` `.vl-dg-mid` `.vl-dg-axis` (quadrant), `.vl-dg-hbox` `.vl-dg-cellbox` (compare), `.vl-dg-trk` `.vl-dg-tick` `.vl-dg-star` `.vl-dg-curve` `.vl-dg-evln` `.vl-dg-tickm` `.vl-dg-badge` (timeline), `.vl-dg-branch` `.vl-dg-elab` `.vl-dg-et` (tree, and edge text in networks), `.vl-dg-vset` `.vl-dg-vreg` `.vl-dg-vt` (venn), `.vl-dg-beam` `.vl-dg-pan` `.vl-dg-post` `.vl-dg-base` `.vl-dg-fulcrum` `.vl-dg-wtbox` `.vl-dg-wtt` (balance), `.vl-dg-edge` `.vl-dg-weak` `.vl-dg-edgeg` `.vl-dg-main` `.vl-dg-legend` `.vl-dg-elist` (network), `.vl-dg-spec` `.vl-dg-sdot` `.vl-dg-end` (spectrum), `.vl-dg-blk` `.vl-dg-brace` `.vl-dg-total` (stack).
Text: `.vl-dg-t1` name / `.vl-dg-t2` example / `.vl-dg-t3` small text, `.vl-dg-k`, `.vl-dg-axname`, `.vl-dg-num`.
States: `.is-on` (selected), `.is-near` (network neighbours, tree path), on the wrapper `.vl-dg.has-on` (everything else fades), `.vl-dg.is-level` (balance level); `[data-c="1…6"]`.

A new skin should write a `diagrams.css` for the later seven diagrams (types 6–12, based on `skins/notebook/diagrams.css`). Without it they still display: shapes carry a `fill="none" stroke="currentColor"` fallback, and structural styles such as fading and transitions are injected by diagrams.js (`<style id="vl-dg-css">`, with `:where()` to lower specificity so the skin can always override).

### Implementation notes

- viewBox width = the diagram's actual displayed width, so font sizes in the SVG are screen sizes. A container width change of more than 24px, or fonts finishing loading, triggers a redraw, and the selection is kept.
- Text is laid out and its bounding box measured first, and boxes are drawn or positions found from that bounding box, so the ≥4px gap between text and lines is not guesswork.
- A skin's wobble filter computes its region from the element's bounding box, and a perfectly horizontal or vertical line has a bounding box of height 0, so the whole line gets clipped (this is how the axes of the old quadrant diagram and the horizontal arrows of the narrow-screen cycle diagram disappeared). After drawing, diagrams.js gives every filtered shape its own copy of the filter, based on its own coordinates with 14px of margin all round.
