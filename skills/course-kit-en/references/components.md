# Component library

Purpose: what each core component does, when to use it, how to write its content, and how it behaves and looks in each skin. Check them one by one when laying out a chapter or choosing components. The general rules (pacing, visual baseline, interaction baseline) are in `SKILL.md` and are not repeated here.

- Class prefix `vl-`, JS namespace `VL`. The HTML below follows the kit's current code (`kit/vl.js`, `kit/vl-interact.js`, `kit/README.md`). Anything marked "not in the kit yet" is not coded yet; its markup is only a sketch.
- **`kit/README.md` is the API authority.** If it disagrees with this file, the code wins.
- **UI labels come from `VL.t()`**, with English strings in the `EN` tables in `kit/vl.js` and `kit/vl-interact.js` (pages with `<html lang="en">` use them). Labels quoted below ("Concept card", "Try it:", "Why it works"…) are those EN strings. Override per course with `window.VL_I18N`.
- Length limits are converted from the Chinese originals at 1 English word = 1.5 characters (the rate `tools/check.mjs` uses).

Course shorthand (the source courses of these rules; the "good / bad" examples below only say where a rule came from — those course files are not shipped with the skill): GD = the game design course (notebook), DS = the data science course (paper-cutout tower climb), AI = the AI course (a retro medium per world).

## 0. Four rules every component follows

| # | Rule | Good / bad example |
|---|---|---|
| 1 | Components own structure, interaction and accessibility only; colour, font, stroke and texture come from the skin. No hard-coded colours in components; UI text goes through `VL.t()`, never into CSS `::before` | Bad: GD `css/style.css` `.tldr::before` and `.eg::before` hard-code "一句话总结" (one-line summary) and "例 / 反例" (example / counterexample), so the English edition needs patches |
| 2 | **Boxes count as body text**: any box with more than 2 paragraphs gets a picture or is split into "picture + short text"; every box with body text has a picture slot (concept card `.vl-cc-fig`, why-it-works box `.vl-why-fig`) | Bad: about 72 GD why-it-works boxes exceed 250 characters with no picture (e.g. `ch05-emergence-systems.html`) |
| 3 | No emoji as icons; icons are small pictures from the illustration library | Bad: GD `.card.mini .ico` is full of emoji; AI removed them course-wide |
| 4 | Motion is filed under four kinds (aids understanding / feedback / reading reward / atmosphere), details in `interaction.md`; a component plays only feedback motion itself, and for rewards it only dispatches events | Good: DS `DS.tryDone()` only ticks and saves; the confetti comes from a separate module listening for it |

The "Skins" line describes how the source courses looked when these rules were extracted: notebook | paper | pixel | town (town = AI W4, not in the library, for reference only; W5–W8 exist only as drafts and are not listed). For the field notebook skin see `skins/fieldbook/README.md`; what each skin actually draws is defined by `skins/<name>/gallery.html`.

## 1. Overview

| Category | Core components |
|---|---|
| Navigation (5) | N1 top bar, N2 chapter opener, N3 sections, N4 in-chapter contents and reading progress, N5 end-of-chapter navigation |
| Explaining concepts (10) | K1 concept card, K2 card grid, K3 why-it-works box, K4 evolution chain, K5 stance cards, K6 wrap-up blocks, K7 inline marks, K8 side notes and sources, K9 document props, K10 invention story box |
| Figures and pictures (8) | T1 illustration slot, T2 text beside picture, T3 numbered figure, T4 real photos, T5 illustrated timeline, T6 comic panels, T7 bar readouts and legends, T8 tables and scroll wrappers |
| Examples (2) | E1 example carousel, E2 comparison |
| Micro-interactions (3) | M1 predict → reveal, M2 hotspot picture, M3 Try it |
| Signature interaction frames (11) | G1 interaction board, G2 slider + live chart, G3 seeded simulator, G4 draggable objects, G5 assembly bench, G6 hands-on task engine, G7 round-based mini-game, G8 step-through demo, G9 formula anatomy, G10 grid picker, G11 live plot |
| Exercises and collapsibles (4) | P1 end-of-chapter quiz, P2 end-of-part review, P3 note box, P4 optional side path |

Concept diagrams (loops, nested circles…) are a family within T3 numbered figures; their templates are in `diagrams.md`.

---

## 2. Navigation

### N1 Top bar
- **Job**: back to contents, course progress, jump to any chapter, preferences (colours Light / Dark / Easy on the eyes — dark has variables only and is not fully approved, see `skin-contract.md` section 1; motion Auto / Full / Light / Off; language). Sound switch and reward panel are added to the top bar by optional modules; see `kit/README.md`.
- **Use / don't**: on every page. vl.js builds it from the chapter table (`VL_COURSE` in `js/course.js`) and `<body data-ch>`; never hand-write chapters. vl.js also writes `data-part`. `VL_COURSE.topbar:false` turns it off.
- **Content**: navigation and switches only, no body hints. Course progress is a pair: mini map + popover list. On phones the mini map may hide, but the popover must stay (bad: AI hides the chapter dots on phones, so you can't jump chapters).
- **Interaction and keyboard**: all `button` / `a`; popover closes on Esc or outside click and returns focus to its button; cells in the mini map must not be both `tabindex=-1` and `aria-hidden` (bad: the DS tower strip).
- **Motion**: feedback.
- **Skins**: notebook = ink underline + part-coloured dots | paper = white paper strip + small tower icon + lit windows | pixel = dark HUD bar + 8×8 icons | town = walnut beam.

```html
<body data-ch="3">   <!-- header.vl-topbar is generated by vl.js; vl.js also writes body[data-part], body[data-pat], --vl-dh, --vl-chnum -->
```

### N2 Chapter opener
- **Job**: within one screen, say which chapter this is, what it covers, what the reader can do afterwards, and how long it takes.
- **Use / don't**: one per chapter. With more than 15 chapters add a "you are here" mini map (not in the kit yet; the top-bar chapter dots `.vl-tb-dots` and the "Ch. N / M" popover already allow jumping).
- **Content**: badge (vl.js adds "Chapter N" automatically) + h1 + one-sentence subtitle (≤20 words, start from a situation or a counter-intuitive question, not a definition) + **illustration slot (required, via T1, no hand-written SVG)** + 3 learning goals ("By the end you can…", each ≤17 words) + reading time.
  Bad: GD header drawings are written straight into the HTML, outside the illustration library, so they can't be checked for duplicates or re-skinned.
- **Interaction**: "you are here" cells are clickable to jump chapters.
- **Motion**: atmosphere, entirely up to the skin, can be turned off.
- **Skins**: notebook = pill badge at -3° + highlighter h1 | paper = sky band header + main-colour paper tag | pixel = level title card WORLD n-k | town = wooden sign with brass nails.

```html
<div class="vl-hero">
  <div class="vl-hero-txt"><h1>The average person doesn't exist</h1>
    <p class="vl-sub">Why did a cockpit built for the "average pilot" fit nobody?</p></div>
  <span data-illus="c03-hero"></span>          <!-- the .vl-badge is added automatically if missing -->
</div>
<div class="vl-goals"><h3>By the end you can</h3><span class="vl-time">About 30 minutes</span>
  <ul><li>…</li><li>…</li><li>…</li></ul></div>
```

### N3 Sections
- **Job**: cut a chapter into 8–12 "one thing each" sections that can fold.
- **Use / don't**: every chapter. **Headings carry no layer labels ("what it is / invention story…")**; the five layers are only a writing self-check (GD's old `.tag.what/.why` did not make it into the library).
- **Content**: h2 is a concrete scene or concrete question, ≤11 words, sentence patterns varied across the set; **not a summary sentence** (✗ "Selection bias filters data before you get it"; ✓ "The *Literary Digest* mailed ten million postcards"). Each section opens with a question or situation.
- **Interaction and keyboard**: click the heading / Enter / Space to fold; `role=button aria-expanded`; everything expands before printing.
- **Motion**: feedback (arrow ≤200ms; no height animation when content shows or hides).
- **Skins**: notebook = accent2 round number at -5° | paper = main-colour paper tag + red pin | pixel = level block | town = clay disc + sandy path.

```html
<div class="vl-sec"><h2>The Literary Digest mailed ten million postcards</h2></div>
<p>…the section content follows directly…</p>
<!-- .vl-sec must be a direct child of <main>; everything up to the next .vl-sec or .vl-pager is moved into .vl-sec-body by vl.js, and the section number .vl-n is added automatically -->
```

### N4 In-chapter contents and reading progress
- **Job**: jump to any section, expand / collapse all in one click, back to top, see how far you've read.
- **Use / don't**: appears automatically with ≥2 sections (floating button `.vl-fab` at bottom right → panel `.vl-navpanel`; progress bar `.vl-readbar` at the top). A skin may draw it as tower stairs or a narrow town strip, but function and keyboard behaviour stay the same (AI W4 replaces the floating button with a narrow town strip; its narrow-screen behaviour is untested, so test again whenever you change the form).
- **Content**: entries are the h2 text verbatim; the current section is always "top edge past 35% of the viewport".
- **Interaction and keyboard**: floating button → panel; Esc / outside click closes; clicking a link first expands that section, then scrolls to it.
- **Motion**: feedback (panel ≤250ms).
- **Note**: the reading progress bar only shows position; it **never triggers rewards or "read" records** (bad: DS calls `Progress.done()` at 92% scrolled).
- **Skins**: notebook = tilted floating button | paper = round paper button + tower-section steps | pixel = pixel frame + segmented health bar | town = narrow town strip on the right.

### N5 End-of-chapter navigation
- **Job**: previous / next chapter (`nav.vl-pager`, generated by vl.js); with a concept map, add "Related chapters" (prerequisites and principles / going further and applications / contrasts and links), generated by `modules/vl-concepts.js`; see `kit/README.md`.
- **Content**: no preview of later chapters' content; chapters not yet open (`open:false` in the chapter table) get no link: the pager says "Chapter N is still being written" and links back to contents (good: AI `.related`).
- **Motion**: feedback; page-to-page transitions are atmosphere (DS climbing a floor), can be turned off.
- **Skins**: notebook = white card + accent shadow | paper = "upstairs / downstairs" paper signs | pixel = level exit | town = signpost.

---

## 3. Explaining concepts

### K1 Concept card
- **Job**: make the chapter's 1–3 core concepts "stand up", so the reader sees at a glance what the chapter is about. One of the user's most valued components.
- **Use / don't**: one card per core concept, placed **where the concept is first named** (after the reader has seen the situation and examples). Secondary concepts get no card; use K7 naming marks.
- **Content** (fixed fields; never a second paragraph inside the card):

  | Field (class) | What to write | Length |
  |---|---|---|
  | Name `.vl-cc-name` | The common name, large | ≤7 words |
  | Original name / parts `.vl-cc-en` | Original-language name, or "made of which parts" | 1 line |
  | Source `.vl-cc-by` | One person · one book or paper · year; **one name only**, no pile of scholars | 1 line, optional |
  | In plain words `.vl-cc-plain` | One plain sentence (the "In plain words" tag is added automatically) | 1 sentence |
  | Definition `.vl-cc-def` | One-sentence definition, bold in the skin | ≤40 words |
  | Example `.vl-cc-eg` | Point back to an example already told in the text; no new example, and don't retell it (the "Example" tag is added automatically) | ≤20 words |
  | **Picture slot `.vl-cc-fig` (required)** | A small picture of the parts or mechanism (not a decorative corner icon), ≤240px; on the right on wide screens; on narrow screens (≤700px) it follows source order, and the template puts it last, so it sits at the bottom of the card; if there is no dedicated picture, write "see Figure 3" with a thumbnail. If missing, vl.js shows a red "Concept picture missing" placeholder and calls console.warn | — |

  Good: the "core loop" `cc-card` in GD `ch02-core-loop.html` has every field and uses `<aside aria-label>`. Bad: GD's 102 cards have no picture slot; AI's `.cn-prop` corner props are decoration, not explanatory pictures.
- **Repetition rule**: the same example is not told three times in the opener, the concept card and the example card; the card has a one-line pointer only.
- **Interaction**: none; the reading-reward module may light it up "after understanding" (see `modules.md`), **never by dwell time** (bad: in DS, a card shown for 1.5s sends a paper plane into the backpack).
- **Motion**: none (except reward hooks).
- **Skins**: notebook = white card + ink line + thick left edge + hard shadow + slanted tag | paper = ivory paper + thick left edge + small cutout picture | pixel = double-line dot-matrix frame | town = small wooden sign.

```html
<aside class="vl-cc">                         <!-- the top "Concept card" tag (change with data-tag) and aria-label are added automatically -->
  <p class="vl-cc-name">Core loop</p>
  <p class="vl-cc-en">核心循环</p>
  <p class="vl-cc-by">(optional) person · book · year</p>
  <p class="vl-cc-plain">The set of actions a player repeats again and again.</p>
  <p class="vl-cc-def">The chain of things a player does over and over, ending back at the start, ready for another round.</p>
  <p class="vl-cc-eg">The game of Tetris at the start.</p>
  <div class="vl-cc-fig"><span data-illus="c02-cc-loop"></span></div>
</aside>
```

### K2 Card grid
- **Job**: show 3–7 sibling elements or types of one concept side by side.
- **Use / don't**: elements, categories, "lessons to take away"; not for long text, not for good-vs-bad contrasts (use E2); anything with hierarchy or causation becomes a diagram (`diagrams.md`).
- **Content**: each card = small picture (required, from the illustration library, no emoji) + name ≤5 words + one sentence ≤27 words; one drawing style per group.
- **Interaction**: static by default; optional "click a card for details" (the card version of M2).
- **Skins**: notebook = small cards stuck on at angles | paper = staggered paper scraps | pixel = inventory slots | town = small signs on a wooden tray.

```html
<!-- no card-grid component in the kit yet; lay it out with the equal-width grids .vl-grid2/3/4 (single column at ≤700px); card look goes in the page, class names with the chapter prefix -->
<div class="vl-grid3">
  <div class="c03-card"><span data-illus="c03-mot-a"></span><b>Autonomy</b><p>…</p></div>
</div>
```

### K3 Why-it-works box
- **Job**: explain why something holds: one principle + its source + an experiment the reader can verify themselves, plus one line of dispute if needed.
- **Use / don't**: ≥1 per chapter, placed after a concrete phenomenon; no definitions (those go in K1).
- **Content**: the title is the principle as a sentence (≤13 words, without the word "principle"); **body ≤2 paragraphs (about 130 words); beyond that add a picture or split into picture + short text**; **picture slot required** (`.vl-why-fig`: diagram, real photo, or a thumbnail of the interaction above; the code doesn't enforce it and won't error, so check step 3, picture density, is the backstop); the "Why it works" tag is added automatically; source line = who · which study · year + "Check it: the … above"; dispute in one line: "Not everyone agrees: … (so-and-so)".
  Good: AI's source lines say "Check it: the simulator above". Bad: GD's why-it-works boxes are long flat cards with shadows (424 characters on average), breaking "no PPT cards".
- **Shape**: a light block (margin rule + small tag), not a floating card.
- **Skins**: notebook = margin rule + hand-drawn magnifier tag | paper = thin sheet held by a brass pin | pixel = thin frame + coloured-block title | town = notice card pinned to a plaster board.

```html
<div class="vl-why">                          <!-- with .vl-why-fig, two columns on wide screens, picture 34% on the right -->
  <h3>The brain reacts most to "better than expected"</h3>
  <div class="vl-why-fig"><span data-illus="c02-why-rpe"></span></div>
  <p>… (≤2 paragraphs)</p>
  <p class="vl-src">Schultz's monkey experiments, 1997. Check it: the gacha simulator above.</p>
</div>
```

### K4 Evolution chain
- **Job**: draw "problem → solution → new problem → new solution" as a chain, so the reader sees the concept was forced into existence.
- **Use / don't**: the backbone of an invention story, state transitions; not for parallel content with no order or causation (use K2).
- **Content**: 3–5 nodes; each node = small picture + ≤13 words. Show the first two nodes and let the reader guess the next (link to M1), then reveal.
  Good: the "problems on top, fixes below" evolution charts in AI `ch03-fitting-gradient-descent.html` and `ch06-reinforcement-learning.html`.
- **Interaction**: optional one-at-a-time reveal ("And then?" button; not in the kit yet, currently a static chain). Horizontal on wide screens; at ≤600px it stacks vertically with arrows pointing down.
- **Motion**: aids understanding (nodes appear in turn; with motion off, all show at once).
- **Skins**: notebook = handwritten arrows joining small boxes | paper = paper strips pinned together | pixel = level route | town = stops along a path.

```html
<ol class="vl-chain">
  <li><span data-illus="c03-ev1"></span>Seven observations don't fit one orbit</li>   <!-- node picture: an illustration goes in data-illus, a photo in <span class="vl-chain-img"><img …></span>, at most 200px wide; keep text in the picture to a minimum -->
  <li class="vl-chain-ar" aria-hidden="true">→</li>
  <li>…</li>
</ol>
```

### K5 Stance cards (philosophy moment / dispute)
- **Job**: a question genuinely worth thinking about: the reader takes a position, flips through 2–3 stances (each attributed), and ends on an open question.
- **Use / don't**: 1–2 per chapter; not for questions with a correct answer.
- **Content**: first card = question + vote buttons; each middle card = one stance, ≤2 paragraphs, may have a picture, the stance is named by its view not its author ("rules come before the game"), the person goes in the source line; last card = open question, can lead into P3.
- **Interaction and keyboard**: votes use `aria-pressed` and can be changed; stance cards echo "You chose: …"; ◀▶ / ←→ / swipe / dots labelled with stance names; all expanded in print.
  Bad: AI wrote the vote separately in 13 chapters; in the library it is one component (`.vl-philo` / `.vl-vote`, see `kit/README.md`).
- **Motion**: feedback (page turn ≤300ms).
- **Skins**: notebook = dashed page + sticky notes for stances | paper = pale purple paper + "Philosophy moment" tag | pixel = dark panel | town = walnut board.

```html
<!-- see kit/README.md; sketch below -->
<div class="vl-philo" data-key="ch22-philo1">
  <div class="vl-philo-slide" data-t="Question">…<div class="vl-vote" data-options="Yes|No|It depends"></div></div>
  <div class="vl-philo-slide" data-t="The magic circle is real">…<p class="vl-src">Huizinga, 1938</p></div>
  <div class="vl-philo-slide" data-t="Over to you">…</div>
</div>
```

### K6 Wrap-up blocks (common misconceptions / key points / one line)
- **Job**: tighten understanding at the end: correct the most common wrong ideas, list what to take away, compress it into one line.
- **Content**: each misconception = the wrong idea in its own words (bold) + why it's wrong in 1–2 sentences; 3–5 key points, each ≤27 words; one line ≤27 words. **Label text is written in the HTML** (good: DS `<p class="tldr"><b>In one line</b>: …</p>`). With more than 3 misconceptions, turn them into M1 flip cards: "Have you thought this too?"
- **Skins**: notebook = orange-backed misconceptions + dashed key points + handwritten one-line strip | paper = apricot paper scraps + small tags | pixel = coloured-block titles in thin frames | town = notices on a plaster board.

```html
<div class="vl-misc"><p><b>"Random means evenly spread"</b>: …</p></div>
<div class="vl-key"><p><b>Key points</b></p><ul><li>…</li></ul></div>
<p class="vl-tldr"><b>In one line</b> …</p>      <!-- the skin turns the first <b> into a small label -->
```

### K7 Inline marks (term definitions / naming / emphasis)
- **Job**: a new term gets a one-line definition on the spot; a concept's first naming is noticed; the key sentence of a paragraph is noticed.
- **Content**: a term's first appearance uses `.vl-term`, with a one-sentence `data-def` that doesn't repeat the term (`data-name` changes the popup title). Naming and emphasis: at most two per paragraph; don't pile up `<b>` (naming uses `<span class="vl-cn">`, drawn as a highlighter, only where a concept is first named; emphasis uses `<span class="vl-em">`, drawn as emphasis dots in Chinese and an underline on English pages; plain `<b>` is just bold, never a naming mark). A core concept's name must match in the heading, the naming mark and the concept card; see SKILL.md section 1. The glossary `glossary.html` is built by `kit/modules/terms.js` from the `terms` in the course's concept data `js/concepts.js`; `node kit/modules/build-concepts.mjs <absolute course path> --write` collects every chapter's `.vl-term[data-def]` into that data (a term defined two different ways is reported as ✗).
- **Interaction and keyboard**: `tabindex=0` (added by vl.js); hover / focus / tap toggles; Esc or scroll closes; the popup is positioned by JS, clamped to the viewport and flips up or down (good: DS `.term-tip`; bad: GD / AI pure-CSS `::after` runs off the screen edge).
- **Motion**: feedback (≤150ms or no animation).
- **Skins**: notebook = dotted underline + ink-backed bubble, highlighter | paper = dotted underline + white paper popup | pixel = dot-matrix bubble | town = small paper tag.

```html
<span class="vl-term" data-def="Treating a hand-picked sample as if it were the whole group">selection bias</span>
<span class="vl-cn">core loop</span>   <!-- naming: highlighter, only where the concept is first named -->
<span class="vl-em">if the innermost loop is dull, no outer layer can save it</span>   <!-- emphasis: at most two per paragraph -->
```

### K8 Side notes and sources
- **Job**: a useful line that doesn't fit the main thread, a source, an "illustrative" disclaimer, a usage hint.
- **Content**: side notes ≤3 lines; sources follow the figure, why-it-works box or quotation; teaching models that are simplified must be marked "illustrative". Small text is still ≥4.5:1 (lower bound for reference: DS `--muted #4d566c`), in Medium weight.
- **Skins**: notebook = small pencil text in the margin | paper = 4px main-colour bar on the left | pixel = pale ground with a coloured left bar | town = pencil on the edge of a plaster board.

```html
<p class="vl-src">Numbers are illustrative.</p>  <p class="vl-src">John Snow, 1855, public domain, Wikimedia Commons</p>
<!-- note: .vl-note is the note-box textarea class and must not be used for side notes; there is no dedicated side-note class in the kit yet, so use .vl-src -->
```

### K9 Document props
- **Job**: turn a stretch of narrative into "an object" (case file, report, diary, newspaper, lab notebook, slip, letter, notice), so long text has physical presence without being a flat card.
- **Use / don't**: opening hooks, cases, the original scene of an invention story; ≤2 per chapter; not for explaining principles.
- **Content**: `data-kind` sets the shape; body ≤2 paragraphs, otherwise split into two props or add a picture; a slip is ≤3 lines.
  Good: AI `ch03` case file, `ch10` newspaper, `ch18` letter; before joining the library these were ≥8 separate in-page implementations, now one component.
- **Motion**: none (a slight rotation is static skin).
- **Skins**: notebook = another sheet or a clipping tucked into the notebook | paper = cutouts in different paper colours | pixel = in-game item window | town = notice board, envelope.

```html
<!-- usage in kit/README.md section 7, K9; the look lives in the skin's interact.css -->
<div class="vl-doc" data-kind="news"><h4>…</h4><p>…</p></div>
<!-- data-kind: file | news | diary | letter | lab (notebook is an alias of lab); all four skins draw these five; fieldbook adds ticket / clipping / copy (see its README) -->
```

### K10 Invention story box
- **Job**: holds one core concept's invention story (problem → early attempts → key insight → evolution), collapsed by default for those who want it.
- **Use / don't**: at most one per core concept. **Keep a sentence or two of the key insight in the main text** (so a reader who doesn't expand it still knows why it had to be invented); details, timeline and people go in the box.
- **Content**:
  - Collapsed, it shows: type tag "Invention story" + **a concrete question-style title** (✓ "1898: a cat shut in a box, and how the law of reward was found"; ✗ "Ready to travel back in time and start a new adventure?") + one line of introduction (≤20 words, saying what's inside) + expand button.
  - Expanded, "boxes count as body text" applies: beyond 2 paragraphs, share the load with a K4 evolution chain, T5 timeline, T6 comic or T4 real photo; keep only the one or two people who drive the story.
  - Bad: the `.story` in GD `ch02-core-loop.html` is always expanded; 14 of them exceed 250 characters with no picture.
- **Interaction and keyboard**: same as P4 (native `details/summary`, remembers open state, all expanded in print).
- **Motion**: feedback (arrow ≤200ms).
- **Skins**: notebook = fold-out page in the notebook + old paper colour | paper = beige folder paper | pixel = side-quest colour block | town = signpost at a fork in the path.

```html
<p>…one or two sentences of key insight in the main text…</p>
<details class="vl-story">
  <summary><b>1898: a cat shut in a box, and how the law of reward was found</b><small>Thorndike's puzzle box and a learning curve.</small></summary>
  …   <!-- type tag "Invention story" (change with data-tag) and the Open / Close button are added automatically; content is moved into .vl-side-body -->
</details>
```

---

## 4. Figures and pictures

### T1 Illustration slot
- **Job**: write a name and it is replaced by a picture from the illustration library. The picture shows the *why*: a good example has every element, a counterexample shows the missing one.
- **Use / don't**: every illustration goes through it; data charts and concept diagrams don't (use T3, G2).
- **Content**: each picture once per course; alt text required; rules for people are in section 2 of `references/content-rules.md`, and pitfalls from the three courses are in `visuals.md`; text sits outside the filter group.
- **Loading**: register with `VL.illus.add(name, alt, shapes, textLayer, options)` (a vertical canvas uses the option `{vb}`, see "插画位" / illustration slots in `kit/README.md`); alt becomes the SVG's `aria-label`. A missing picture doesn't error; it shows a placeholder `.vl-illus-miss` with the name. For content inserted later, call `VL.illus.mount(root)` or `VL.enhance(root)` (good: DS `DS.illus(root)`). Each chapter's illustration pack `js/illus-chNN.js` is included with a `<script>` after `kit/illus.js` (the kit doesn't yet load packs from the chapter table).
- **Skins**: notebook = stick figures + wobble filter + flat colour blocks (viewBox 200×140) | paper = layered cutouts + white trim + three-level shadows | pixel = 2px grid pixel art | town = offline-rendered PNG.

```html
<span data-illus="c02-eg-tetris"></span>   <!-- alt goes in the second argument of VL.illus.add -->
```

### T2 Text beside picture
- **Job**: long text has a picture right beside it.
- **Rules**: on wide screens, one column of picture (38%) and one of text, **top-aligned, no wrapping, no vertical centring**; stacked at ≤700px (picture on top). Short caption; the explanation goes in the text. Tall pictures such as portraits get `.narrow` (picture column 26%); picture on the left by default, `.rev` puts it on the right. If the text is much longer than the picture, use a taller picture or split into two side-by-side groups; never let text wrap under the picture.
  Bad: GD `.withimg` centres vertically (`style.css` line 251); AI `.withimg` floats and wraps; DS `layout.js` `wi-wrap` falls back to wrapping when the text is longer. Good: DS grid 38% / 1fr top-aligned (DS has its own layout-check script, not shipped with the skill; here, take 420 and 1100 screenshots with `tools/shot.mjs` and check by eye).
- **Skins**: only the picture frame changes (notebook = tape | paper = white border + shadow | pixel = ink frame + hard shadow | town = wooden frame).

```html
<div class="vl-withimg">                    <!-- first child is the picture, second is the text -->
  <figure class="vl-fig"><span data-illus="c01-pump"></span><figcaption>…</figcaption></figure>
  <div><p>…</p><p>…</p></div>
</div>
```

### T3 Numbered figure
- **Job**: diagrams, concept diagrams and data charts with "Figure N" and a caption, so the text can say "see Figure 3".
- **Content**: same width as the text, about 2:1, height ≤300px; one accent colour per figure; text in figures ≥13px; `role=img aria-label` says what is drawn; **the caption says why** (what the figure shows), not a repeat of its labels; data charts have straight edges, no wobble. Numbers are generated by vl.js and the caption is prefixed "Figure N"; don't hand-write it. In the text, refer back with `<a data-figref="figure-id" href="#figure-id">figure</a>`, which becomes "Figure N"; after adding figures dynamically call `VL.figs()` (good: DS `figure.fig` + `data-n`; bad: about 120 GD inline SVGs with no number or caption).
- **Skins**: notebook = hand-drawn wobbly lines, handwritten figure text | paper = paper colour blocks, straight-edged data charts | pixel = pixel lines + dark "Figure N" tag | town = blueprint paper.

```html
<figure class="vl-fig" id="fig-axis"><svg role="img" aria-label="…" viewBox="0 0 700 300">…</svg>
  <figcaption>Same data: cut off the bottom of the y-axis and the gap looks ten times bigger.</figcaption></figure>
```

### T4 Real photos
- **Job**: real photos of historical people, objects, places, paper pages, so the reader believes "this really happened". The user wants more of these.
- **Content**: public domain / CC only, downloaded locally; caption = one line of description + author, licence, source; register in the course project doc's picture-source list (`img/CREDITS.md` when there are many). Process in `visuals.md`. Portraits go in `.vl-withimg.narrow`.
  Good: DS `ch01-cholera.html` with Snow's cholera map, Snow's portrait and a photo of the pump replica. Bad: GD has 0 real photos in the whole course.
- **Interaction**: optional click to enlarge.
- **Skins**: notebook = taped into the notebook | paper = white photo paper + tape | pixel = triple ink-and-white frame | town = framed picture on a wooden frame.

```html
<div class="vl-withimg narrow">
  <figure class="vl-fig photo"><img src="img/ch01/john-snow-portrait.jpg" alt="Portrait photo of John Snow">
    <figcaption>John Snow, about 1856. <span class="vl-src">Wellcome Library, public domain</span></figcaption></figure>
  <div><p>…</p></div>
</div>
```

### T5 Illustrated timeline
- **Job**: the 3–5 nodes of an invention story, each with a picture big enough to see.
- **Use / don't**: inside a K10 invention story box or a P4 side path, collapsed by default; no full timelines in the main text.
- **Content**: each node = year + small picture (required, ≥120px wide) + ≤2 sentences; keep only nodes that drive the story.
  Good: all 43 GD timelines have pictures. Bad: DS `ch01` timeline has none; GD timelines are all expanded.
- **Interaction**: one node at a time, swipe sideways on narrow screens (scroll-snap; not in the kit yet, currently a vertical list with the picture on top at ≤600px).
- **Skins**: notebook = ink line + yellow-centred dots + handwritten years | paper = paper cards strung on a cord | pixel = square nodes + monospace years | town = milestones along the road.

```html
<div class="vl-timeline">
  <div class="vl-ev hasimg"><span data-illus="c01-tl-1854"></span><div><b class="vl-yr">1854</b> …</div></div>   <!-- add .hasimg when it has a picture -->
</div>
```

### T6 Comic panels
- **Job**: split a process or story into 2–4 panels; the most natural fix when a box exceeds 2 paragraphs.
- **Use / don't**: the scene of an invention story, a process, a misunderstanding; not for abstract principles.
- **Content**: each panel = illustration + ≤20-word caption; one-sentence `aria-label` summary for the whole strip. The three courses barely used it (DS 0 times, AI once); when you hit a long paragraph of "someone did one thing, then another thing happened", consider this first.
- **Motion**: aids understanding (panels light up one by one on scroll; with motion off, all lit).
- **Skins**: notebook = pencil panels | paper = paper panels + panel-number tags | pixel = dark ink panels + yellow captions | town = window panes.

```html
<!-- see kit/README.md; sketch below -->
<div class="vl-comic" role="group" aria-label="…"><div class="vl-panel"><span data-illus="…"></span><p class="vl-cap">…</p></div></div>
```

### T7 Bar readouts and legends
- **Job**: compare several quantities with horizontal bars (growing and shrinking as the reader acts), use a gauge for a single quantity, and make legends "shape + text".
- **Content**: each row = name + bar + value; each legend item differs in shape (solid / dashed / dotted / ✓). Values use `aria-live=polite`. Bad: GD wrote bars separately in ≥12 chapters (`.c17bar .sbar .c27sb`).
- **Motion**: aids understanding (width transition 200–400ms; with motion off, jump to the final value).
- **Skins**: notebook = hand-drawn bars + hard shadow | paper = pieced paper strips | pixel = segmented health bar | town = carved wooden ruler.

```html
<!-- not in the kit yet; sketch below -->
<div class="vl-bars" data-rows='[{"nm":"Skill","v":0.7},{"nm":"Luck","v":0.3}]'></div>
<ul class="vl-legend"><li data-shape="solid">Actual</li><li data-shape="dash">Expected</li></ul>
```

### T8 Tables and scroll wrappers
- **Job**: comparison tables and truth tables of ≤8 rows; on phones wide tables / figures scroll sideways without breaking the page.
- **Content**: no symbol tables; header in accent; clicking a row may highlight it (link to M2). The scroll wrapper has `tabindex=0` for keyboard scrolling.
- **Skins**: notebook = hand-drawn table lines | paper = paper table | pixel = 2px ink-framed table | town = ledger.

```html
<div class="vl-scroll" tabindex="0"><table class="c05-tbl">…</table></div>   <!-- .vl-scroll is in the kit; table styles are not yet, so write them in the page -->
```

---

## 5. Examples

### E1 Example carousel
- **Job**: ≥3 examples of one concept (including 1 counterexample or near miss), switched sideways to save vertical space.
- **Content**: each = illustration (required; a counterexample shows what's missing) + ≤2 paragraphs; tab label ≤9 words (`data-t`); counterexamples get `.bad`, distinguished by a text tag + shape, not colour alone. With pictures on wide screens, two columns (good: DS). Examples are not retold elsewhere.
- **Interaction and keyboard**: tabs / ◀▶ / ←→ / 50px swipe; `role=tablist / tab / aria-selected` (missing in all three courses, added in the library).
- **Motion**: feedback (switch ≤300ms; the DS paper page-turn at .42s must be cut to 300ms).
- **Skins**: notebook = sticky-note tabs + dashed counterexample | paper = folder tabs + paper page-turn | pixel = pixel tabs | town = wooden drawer labels.

```html
<div class="vl-eg" data-t="Tetris"><span data-illus="…"></span><p>…</p></div>
<div class="vl-eg" data-t="Match-three"><span data-illus="…"></span><p>…</p></div>
<div class="vl-eg bad" data-t="Counterexample: a film"><span data-illus="…"></span><p>…</p></div>
<!-- consecutive .vl-eg elements become a carousel automatically -->
```

### E2 Comparison
- **Job**: good vs bad, before vs after, two kinds side by side; or one drag line revealing two pictures in the same place.
- **Use / don't**: distinguishing two kinds, before and after a change; three or more kinds use K2.
- **Content**: each column has a picture; good vs bad marked with text labels + ✓ / ✗. Bad: GD wrote two-column layouts separately in ≥8 chapters (`.c9_twocol .c12-two .twocol`).
- **Interaction and keyboard**: drag-line mode is `role=slider`, ←→ Home End, pointer capture.
- **Motion**: aids understanding (the drag line wiggles once on first appearance as a hint, can be turned off).
- **Skins**: notebook = left and right notebook pages | paper = two paper sheets side by side | pixel = split screen | town = two buildings.

```html
<div class="vl-vs"><div><b>✓ With feedback</b>…</div><div class="bad"><b>✗ No feedback</b>…</div></div>   <!-- the bad side gets .bad (dashed) -->
<!-- drag-line comparison: kit/README.md section 7, E2; vl-interact.js adds role=slider to the divider -->
<div class="vl-compare" data-mode="slider"><div class="vl-cmp-a bad" data-label="Before">…</div><div class="vl-cmp-b" data-label="After">…</div></div>
```

---

## 6. Micro-interactions

### M1 Predict → reveal
- **Job**: the reader guesses first, then sees the answer; the gap itself teaches.
- **Use / don't**: section-opening hooks, "what did they do back then?" in invention stories, predictions before a simulation. It doesn't replace a signature interaction.
- **Modes** (one component `.vl-guess`, switched by `data-mode`; `kit/vl.js` has think, pick, estimate; cards is `.vl-flip` in `kit/vl-interact.js` (kit/README.md section 7, "M1 补：翻牌"); draw and then-run are not in the kit yet — write them in the page if needed):

  | Mode | Shape | Good example |
  |---|---|---|
  | think | Question + "See an answer" button + answer | `.reveal` in all three courses |
  | pick | Option chips + per-option feedback (`.right/.wrong/.miss`) | GD `ch17` pick first |
  | estimate | Slider (linear / log) + "You" and "Answer" markers + gap + comment | AI `.guess` |
  | draw | Hand-draw a curve on the chart → real curve + difference | AI `ch03` training-curve sketchpad |
  | cards | 2–6 flip cards | AI `.flip` |
  | then-run | "Run" unlocks only after a prediction; the result is compared with it | DS `ch04`, `ch06` |
- **Content**: question ≤27 words, answer ≤2 paragraphs; the reveal says *why*, not just right or wrong.
- **Interaction and keyboard**: native buttons / range; flip cards `aria-pressed` + Enter / Space; **draw must have a keyboard alternative** (↑↓ to adjust each segment's height, or a few sliders instead; AI `ch03` lacks one now).
- **Motion**: feedback (≤300ms); a 3D card flip counts as aiding understanding (with motion off, show the back directly).
- **Skins**: notebook = sticky note with a folded corner lifting | paper = white paper + answer below a dashed line | pixel = `steps(4)` pop-up | town = wooden lid flipping open.

```html
<div class="vl-guess" data-mode="estimate" data-min="0" data-max="100" data-answer="62" data-unit=" people">
  <p class="vl-q">Out of every 100 people sampled, how many write back?</p>
  <div class="vl-ans">…why…</div>
</div>
<div class="vl-guess" data-mode="pick">
  <p class="vl-q">…?</p>
  <ul class="vl-opts"><li data-right>Option<span class="vl-fb">feedback for this option</span></li><li>…</li></ul>
  <div class="vl-ans">The reveal</div>
</div>
<!-- estimate also takes data-scale="log", data-step, data-start, data-digits, data-pre; after the reveal the container gets .revealed and dispatches vl:guess -->
```

### M2 Hotspot picture
- **Job**: click a part of a picture (or a table row) and the info box beside it switches to that part's explanation. "Click a layer to see that layer" in concept diagrams uses this.
- **Content**: each hotspot has a readable name; the info box ≤3 sentences; initial hint "Tap a part of the picture first."
  Good: the nested-dolls diagram in AI `ch01-what-is-ai.html`, "click any layer, or Tab to it and press Enter"; DS `ch02` bomber bullet holes.
- **Interaction and keyboard**: SVG `g[tabindex=0][role=button]` + Enter / Space; thicker stroke on hover / focus.
- **Motion**: feedback (≤200ms).
- **Skins**: notebook = bolder ink line | paper = paper piece lifts | pixel = blinking frame | town = building lights up.

```html
<!-- "click a layer to see that layer" in concept diagrams is already in VL.diagram (select:true, dispatches vl:dgselect); general hotspot pictures: kit/README.md section 7, M2 -->
<figure class="vl-fig vl-hot" data-hint="Click a layer first.">
  <svg><g data-hot="ml" data-name="Machine learning">…</g></svg>   <!-- tabindex, role, aria-pressed added automatically -->
  <div class="vl-hot-text" data-for="ml"><b>Machine learning</b>: …</div>   <!-- info box .vl-hot-info is created if missing -->
</figure>
```

### M3 Try it
- **Job**: give every signature / supporting interaction a clear small task, confirmed on the spot when done.
- **Content**: write an observable goal (the "Try it:" label and checkbox are added by vl.js; don't hand-write them) (✓ "Get the error below 5%"; ✗ "Play around"); 1–3 per interaction; the completion condition lives in JS, not the reader's say-so; the default state must not already satisfy it without the reader doing anything.
- **Interaction**: passive; when the interaction succeeds call `VL.tryDone(id, optional feedback)`, deduplicated by "filename#id" and saved in `<course id>-try`; the completion message comes from `data-done`; on reopening the page it shows "Done earlier." (change with `data-was`). The component only ticks; rewards come from the reward module listening on `document` for `vl:try {id, el, first}`, and only when `first` is true (good: DS).
- **Motion**: feedback (turn green and tick ≤300ms).
- **Skins**: notebook = yellow sticky note + small checkbox | paper = yellow sticky note + white tick | pixel = "CLEAR!" | town = clay bead turns green.

```html
<p class="vl-try" data-try="luck-90" data-done="Done! The winner changed: with that much luck, skill can't decide the ranking.">Turn luck up to 90% and see whether the strongest player still comes first.</p>
```

---

## 7. Signature interaction frames

Interaction design rules (one sentence stating the question, playable in 3 seconds, predict first, undoable, hard modes in a drawer) are in `interaction.md`; only the frames are here.

### G1 Interaction board
- **Job**: the shell for every signature / supporting interaction: question sentence + Try it + stage + control row + readout + feedback sentence + restart.
- **Content**: the title is the question this board answers (✓ "Definition tester: can you write a definition with zero errors?"); ≤3 control groups; must have "restart" or "undo". **Only interaction boards and concept diagrams get the heaviest physical presence in the course** (thick border, backing layer, shadow).
- **Control family**: `.vl-btn` (primary; `.alt` secondary; `disabled`), `.vl-chip` (`.on/.right/.wrong/.miss`), `label.vl-ctl > output + input[type=range]`, segmented toggle `role=group` + `.vl-chip[aria-pressed]`, feedback sentence `.vl-msg`; touch targets ≥44px; feedback sentence `aria-live=polite`. Selected-state text ≥4.5:1 against its ground (bad: DS view toggle, white text on accent2, about 1.6:1).
- **Motion**: feedback (press ≤150ms, a light 280ms shake on failure).
- **Skins**: notebook = cardboard + ink line + hard shadow | paper = white paper + kraft backing | pixel = pixel frame + bevel | town = wood-edged workbench + brass title plate.

```html
<div class="vl-board" id="c05-board">
  <h3>All skill or all luck?</h3>
  <p class="vl-try" data-try="luck-90" data-done="…">…</p>
  <div class="c05-stage">…</div>                  <!-- stage and control-row layout go in the page, class names with the chapter prefix -->
  <label class="vl-ctl">Share of luck <output>30%</output><input type="range"></label>
  <p class="vl-msg" aria-live="polite">…</p>
  <button type="button" class="vl-btn alt" id="c05-reset">Start again</button>
</div>
```

### G2 Slider + live chart
- **Job**: drag one parameter and the chart changes at once: "what if you change one number?"
- **Content**: plain words at both slider ends ("all skill / all luck"); the current value also appears in the readout; one accent colour in the chart; 1–3 "real-world" preset buttons.
- **Interaction**: native range; the chart is read-only, `role=img` + readout `aria-live`. Draw with the shared `VL.plot()` (G11 live plot) instead of rewriting `X()/Y()` per chapter (bad: GD wrote one in each of 15 chapters).
- **Motion**: aids understanding (redraw directly while dragging; presets may transition over 300ms).

### G3 Seeded simulator
- **Job**: run N random trials with one click to see averages, distributions and chance.
- **Content**: the first screen uses a fixed seed (`VL.rng(seed)`) so the numbers in the text match what the reader first sees (bad: GD `ch14` uses `Math.random`, so the text's numbers don't match); "run again" changes the seed; let the reader predict first with M1 then-run.
- **Interaction**: run N more / restart / play / pause / step.
- **Motion**: aids understanding (items drop one by one; under reduced motion, draw everything at once).

### G4 Draggable objects
- **Job**: drag something to a place on a chart (the position is the answer), or drag points / lines / circles in the chart to watch quantities change.
- **Content**: after dropping, show the "reference position"; readouts update live while dragging. Good: the nine draggable salary points in DS `ch03-average-person.html`.
- **Interaction and keyboard**: pointer events + `setPointerCapture` + `touch-action:none`; **a keyboard alternative is required**: Tab selects an object, arrow keys move it, Shift for big steps (bad: GD `ch01`, `ch03`, `ch06` dragging appears to have no keyboard support).
- **Motion**: feedback (reference circle fades in ≤250ms after drop).

### G5 Assembly bench (take apart / build / slots)
- **Job**: like "taking a house apart": remove parts one by one to see how the whole collapses, or pick parts from a palette into slots to build a solution.
- **Content**: each part has a name and a small picture; every action has a visible consequence for the whole (collapse, curve changes, warning); undoable. Good: GD `ch01-what-is-a-game.html` house teardown, `ch24-case-mario.html` slots (`.sl.full/.warn/.over` states are the clearest), GD `ch02` click a link to weaken or remove part of the core loop.
- **Interaction and keyboard**: click a part, then click a slot (keyboard-friendly by nature); dragging optional; slot states use shape + text.
- **Motion**: aids understanding (collapse, spring back ≤600ms; under reduced motion show the result directly).

### G6 Hands-on task engine (sort / order / match / dial into range / judge case by case)

The code for G6–G9 is in `kit/vl-interact.js`; usage in `kit/README.md`. Below are the requirements.

- **Job**: sort by hand, put in order, connect pairs, dial a slider into a range, judge cases one at a time; no failing.
- **Content**: each task = prompt + data + `hints:[where to look, why]` + one line each for right and wrong; the shuffle must not equal the correct order; for judging tasks each card states "this book's verdict + reason".
- **Interaction and keyboard**: drag and drop + click alternative; ordering via ↑↓ buttons; matching: click left then right (numbered ①②③); states shown with ✗, dashed boxes, strike-through. Two levels of error: "{0} card(s) are in the wrong box. Look again at the ones marked ✗." → then name one card and say why; three levels of hints: where to look → why → "Just show me" (still counts as done). Good: the DS boss engine (its self-test script is not shipped with the skill; the kit's `VL.task` returns `_solve / _spoil / _next` test hooks).
- **Motion**: feedback (light 280ms shake when wrong, green when right).

### G7 Round-based mini-game
- **Job**: genuinely playable and losable, a few rounds from easy to hard; the gameplay *is* the concept, the last round reveals its limits, and it ends with a look back.
- **Content**: the default settings must not win without the reader doing anything; the look-back conveys meaning, not a list of numbers; when collapsed, the summary says "how many rounds, about how many minutes, can be skipped".
- **Interaction and keyboard**: `keys` mapping; the stage is focusable; on-screen arrow pad for phones `.vl-pad` (3×3, see `kit/README.md`); buttons ≥44px; messages `aria-live`. Good: AI `GD.game` (`ch08` and 10 chapters in all).
- **Motion**: feedback (shake on losing), reward (stars / particles on winning, handled by the module, can be turned off).

### G8 Step-through demo (step / slow motion / short clip)
- **Job**: break a process into steps you can go forward, back or scrub to, or watch as a short narrated clip.
- **Content**: each step's explanation ≤2 sentences; narration `aria-live`. All three modes share one control bar (◀▶, progress bar, ⏮ ▶⏸ ⏭, back to start). Good: the "one road, three stops" stepper in AI `ch11-backpropagation.html`.
- **Motion**: aids understanding (step change ≤350ms; under reduced motion the clip shows its final state and pages are turned by hand).

### G9 Formula anatomy
- **Job**: formula pieces and plain-language explanations highlighted in matching colours (step 4 of the five-step maths ladder, see section 1C of `references/content-rules.md`).
- **Content**: placed right after the picture or interaction of the concept it belongs to; one colour per piece, circled with a pale fill (no underlines); each explanation line = how to read it + what it means + its value in the example; the course-wide colour code `--q1…--q6` for quantities is fixed, so text, formula and figure share colours. Derivations go into P4.
- **Interaction and keyboard**: hover / focus / click to pin; both sides highlight together and the rest fades; `li[tabindex=0]`. Good: the J anatomy in AI `ch05-supervised-unsupervised.html`.
- **Motion**: aids understanding (≤150ms opacity).

```html
<!-- see kit/README.md; sketch below -->
<div class="vl-anat vl-board"><div class="vl-anat-f"><span data-k="3">J</span> = Σ <span data-k="6">d²</span></div>   <!-- with KaTeX, \htmlClass{vl-k3}{J} is also recognised; data-k takes 1–6 -->
  <ul class="vl-anat-key"><li data-k="3"><b>J</b>, read as …, means …, here it equals 14</li></ul></div>
```

### G10 Grid picker
- **Job**: rows of clickable cells; the reader picks cells to make choices, and cells cross out, light up or mark a hit: guessing a number, choosing seats, a calendar, a board, sampling.
- **Use / don't**: use it when the options naturally form a grid and position matters; for three or five parallel options use buttons or chips. On a phone, 10 columns make each cell about 30px, so reduce the columns when there are many cells.
- **Usage**: `VL.cells(container, { n, cols, label, onPick, name })` (`name` becomes the container's `aria-label`; by default one is added in the page language); see "G10" in `kit/README.md` section 7. Good: the 10×10 guessing grid in `examples/pixel-binary-search` (written in the page; usage is the same).
- **Interaction**: arrow keys move between cells, Enter selects; state classes `is-out / is-last / is-hit / is-sel`.
- **Skins**: structural styles are in `kit/vl-interact.css`; each skin can override the `.vl-cell` look in `interact.css`.

### G11 Live plot
- **Job**: coordinate charts: bar charts, line charts (which can be mixed), distributions, growth curves, comparisons; with a G2 slider, dragging redraws it.
- **Use / don't**: use it when the reader must read off "how much, how it changes"; for structure and relationships use concept diagrams (`diagrams.md`). At most 3 series per chart.
- **Usage**: `VL.plot(container, config)`; load `kit/vl-plot.js` + `kit/vl-plot.css` only when needed. Options and behaviour (axes, `marks` annotations that avoid overlap automatically, `hi` highlight, `aria`, phone font sizes) are in "G11" in `kit/README.md` section 7. The page links a slider by calling `p.set(…)` in its `input` handler; keep label text short.
- **Accessibility**: the plot is read-only; put the reading in a feedback sentence with `aria-live`; colour is not the only signal (the kit supplies legend, dashes and dot shapes).
- **Skins**: all colours come from skin variables (series `--q1…`, axes and text `--ink`, highlight `--accent`).

G2–G9 all look like the G1 interaction board in each skin; shapes on the stage follow the skin's drawing style (notebook hand-drawn, paper cutout, pixel grid, town model).

---

## 8. Exercises and collapsibles

### P1 End-of-chapter quiz
- **Job**: 4–6 questions that test the learning goals (number and types of questions in section 1A of `references/content-rules.md`). Multiple choice appears only here.
- **Content**: each question `{q, opts, a, why, fixed, img}`, with an explanation; options are shuffled with a seed from chapter number + question number (`fixed:true` means no shuffle), and after shuffling the right answer is never in its original position; check that the right answer isn't always the longest (the skill has no script for this; read every question once before delivery); questions may have a picture (`img`).
- **Interaction and keyboard**: one question at a time, turned sideways (◀ dots ▶ / ←→; dots have three states: `.tried` answered wrong before / `.ok` answered right / `.on` current); a wrong option is struck through, disabled and shaken lightly, the right one shows the explanation. Two ways to answer: click an option (`mode:"pick"`), or drag an answer card into the answer slot (`mode:"drag"`: select a card + press Enter on the slot to place it; good: the new GD `.qz-slot`). All correct: show the badge, `VL.Progress.done(chapter number)` records "understood" (`progress:false` skips it), dispatch `vl:quiz-perfect {ch, firstTry, n}`; each correct answer dispatches `vl:answer {i, firstTry}`.
- **Motion**: feedback (≤300ms); the all-correct celebration is handled by the reward module.
- **Skins**: notebook = handwritten options + completion badge | paper = paper buttons | pixel = STAGE CLEAR! | town = the house is finished.

```html
<div id="c05-quiz"></div>          <!-- .vl-quiz is added by VL.quiz -->
<script>VL.quiz('#c05-quiz', [{q:'…', opts:['…','…'], a:0, why:'…'}], { mode:'pick' });</script>
```

### P2 End-of-part review
- **Job**: the last chapter of each part: a knowledge map of the part + "What you can make sense of now" + cross-chapter hands-on review tasks.
- **Content** (code in `kit/vl-interact.js`, see `kit/README.md`): the map uses the network / flow templates in `diagrams.md`, with nodes linking back to chapters; the review has 3 rounds, each knocking down one "wrong claim", with G6 task types; no health bar, no score, no failing. Good: AI `.savept` review + DS boss rounds. "Floor guardian / BOSS" is skin appearance only.
- **Skins**: notebook = "Review page" + red-pen crossings-out | paper = floor guardian + wooden signs torn down | pixel = save point + BOSS | town = town council.

### P3 Note box
- **Job**: the reader writes down their thoughts, saved automatically.
- **Content**: at the end of a philosophy moment or after a "your design" task, 1–2 per chapter; the placeholder gives a concrete opening; **storage key = `<course id>-note-<chapter filename>-<data-save or index>`**, assembled by vl.js; `data-save` is only a short name within this chapter, never a hand-written "chN" (bad: GD `ch26` used `ch23reflect`, so two chapters' notes overwrote each other); same-named Chinese and English pages share it.
- **Interaction**: saves on input; 0.5 seconds after typing stops, a line shows "Saved".

```html
<textarea class="vl-note" data-save="reflect" placeholder="The first thing I'd change is…"></textarea>
```

### P4 Optional side path
- **Job**: secondary content collapsed by default, showing only a hook; those who want to dig deeper open it.
- **Use / don't**: timelines, going further, derivations, extra cases, original sources, a big game that can be skipped; 2–4 per chapter; never the main thread. Invention stories use K10.
- **Content**: summary = type tag (`data-kind`, added automatically; EN labels: history "History" / math "Maths" / play "Play more" / debate "Debate" / source "Original source" / extra "Extra practice" / more "Going further") + concrete question-style title (≤17 words) + one line of introduction (≤20 words) + expand button (added automatically); the inside is also bound by "boxes count as body text".
  Good: DS `ch01-cholera.html`, "1854: someone had already seen the cholera bacterium under a microscope / they saw the bacterium, so why did nobody treat it as the cause?"
- **Interaction and keyboard**: native `details/summary`; collapsed by default, remembers open state (key `<course id>-side-<filename>-<id or index>`); all expanded in print; numbered per page as "Side path N" (not in the kit yet).

```html
<details class="vl-side" data-kind="math">
  <summary><b>Did Gauss really use least squares?</b><small>A letter and a fight over who was first.</small></summary>
  …   <!-- type tag, Open / Close button and .vl-side-body are added automatically -->
</details>
```

---

## 9. Candidate components

Candidates = things that appeared in the three courses and are valuable but used in only a few; extract from the source when needed, prove them in one chapter, then promote to core.

| Candidate | What it does | Source | Needed before going core |
|---|---|---|---|
| Quote card | One key original quotation set apart | AI `.quote` | The DS course uses no direct quotes (the user's decision); each course's project doc decides whether it's allowed |
| Big number | One striking number counting up to its final value | AI `.bignum` | Show the final value directly under reduced motion; ≤1 per chapter |
| People grid | 100 small figures showing a proportion | DS G6 | Figure style follows the skin |
| Scene transition strip | A small scene between sections | AI `.scene` (used 0 times) | First prove it helps understanding |
| Self-check list | The reader ticks items against their own design | GD `ch15`, `ch17`, `ch21` | Extract `VL.checklist(el,key)` |
| Code lab | Edit code, Ctrl+Enter to run | AI `.lab` | Output drawn as a picture or one sentence, not a stream of numbers |
| Grid editor | Click / drag across cells to paint them | GD `ch05`, `ch11`, `ch28` | Keyboard painting |
| Generator | Fill a form → a document, copyable / printable | GD `ch26`, `ch28`, `ch29` | — |
| Replay annotator | Scrub a timeline + tag event types | GD `ch27` | Merge into G8 scrub |
| Perception sim | Colour picking, key mapping, listening, reaction timing | GD `ch07`, `ch12`, `ch13` | Domain-specific; sound muted by default |
| Counterfactual deck | Parallel "what if" scenarios, click one to read its story | DS timeline planets (from `ch04`) | Label each "imagined"; keyboard-usable |
| Case breakdown panel | Click a concept you've learned to see it in a case | GD `ch23`–`ch25` | A fixed use of M2; merge the three chapters' CSS |
| Original source card | Paper / book page + one line on "what it says" | AI `.paper` | As the inside of P4 `data-kind="source"` |
| Task log | Step-by-step record of an agent's actions | AI W7 `.w7-log` (draft) | Wait for W7 approval |
| Choice spread | Two facing pages, pick one to move on | AI W8 (draft) | Wait for W8 approval |
| Growth file / window | Desktop-window-style data panel | AI W6 (draft) | Wait for W6 approval |
