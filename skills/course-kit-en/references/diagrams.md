# Concept diagram templates

Purpose: which diagram to use when a passage explains a *structure* (a loop, layers, cause and effect, a contrast, a classification…), how to draw it, and which mistakes to avoid. Diagrams are one family within T3 numbered figures in `components.md`; when to use a diagram and how to alternate it with illustrations is in `SKILL.md` section 1.

All twelve templates below are in `kit/diagrams.js`: `VL.diagram.cycle / nested / flow / quadrant / compare / timeline / tree / venn / balance / network / spectrum / stack` (templates 1–12 in order). **`kit/README.md` is the API reference** (section 9, "概念图解" / concept diagrams, which lists the parameters of all twelve).

This is the kind of picture the user values most: loop diagrams, nested circles and the like, where **every node has a name plus one concrete example line, the caption says "why", the reader can click one layer at a time, and labels sit outside the shape on leader lines.**

## 1. Rules every diagram follows

| # | Rule | How | Good / bad example |
|---|---|---|---|
| 1 | Node = name + one example line | Name in bold, short (≤6 Chinese characters, roughly 1–3 English words); below it one concrete example line (≤14 Chinese characters, roughly ≤8 English words), e.g. "Seconds: press a key, jump". No abstract definitions | Good: AI `ch07-learning-as-search.html` mutate → select → inherit, with an example under each step. Bad: a circle of three bare words "action / feedback / reward" that leaves the reader guessing what they mean |
| 2 | Colours have jobs | Structure (boxes, arrows, axes) in ink `--dg-ink`. **One accent colour for the whole diagram**, for the part to look at now (selected state `--dg-hi`). Node fills `--dg-c1…c6` chosen by colour number `c` to mark categories, never rotated per node. Right/wrong uses `--ok/--no` plus ✓✗. Quantities use `--q1…--q6`, the same colours as in the prose and formulas | Bad: every node a different colour, a rainbow (AI course feedback: "looks AI-assembled") |
| 3 | Labels outside, on leader lines | Labels for nested circles, concentric ellipses and curves go outside the shape, joined by a thin leader line (1–1.5px) to the part they name. Never squeeze text onto a border | Good: GD `ch02-core-loop.html` three nested loops, "each layer labelled on the right with a leader line" |
| 4 | Text ≥4px from lines | Every text bounding box stays ≥4px from any box, line or circle. If it doesn't fit, make the canvas taller; don't shrink the text | The in-figure text check of `tools/qa.mjs` (out of bounds, on a border, crowding a line, overlapping) caught hundreds of these in the GD course |
| 5 | Diagram text ≥13px, contrast ≥4.5:1 | A handwriting font may be used inside diagrams only once checked for legibility, with a clear font for letters and digits (`unicode-range`) | Bad: in early GD the handwriting font made "VR5" read as "9R5" |
| 6 | The caption says "why" | Say what the diagram shows or proves; don't repeat the words inside it. ≤40 Chinese characters (about 25 English words) | ✓ "Seconds, minutes and days nest inside each other, so when one session gets stale a bigger loop pulls you back." ✗ "The three levels of the core loop" |
| 7 | If it can be clicked, one layer at a time | Kit diagrams are selectable by default (`select:true`): nodes take Tab focus; click / Enter / Space selects a part (`.is-on`) and dims the rest (outer `.has-on`); the info line `.vl-dg-info` shows that part's `info`; arrow keys move between nodes; fires `vl:dgselect {i}`. With `select:false` the whole diagram is `role=img` | Good: AI `ch01-what-is-ai.html` nesting-doll diagram, "click any layer to see what it adds to the one outside it" |
| 8 | The static version is complete | Readable without clicking; clicking only zooms in on detail. Everything visible when printed or with motion off | — |
| 9 | Has `aria-label` | Say what is drawn and how it connects (screen-reader users rely on it); colour is never the only signal. Kit diagrams generate one if you don't pass `label` | Good: every inline GD figure has a full `aria-label` |
| 10 | Same width as the text, about 2:1, height ≤300px | With many nodes, split into two diagrams rather than shrink | — |
| 11 | Edges: concept diagrams may wobble with the skin; data charts stay straight | Wobble filter uses `in="SourceGraphic"`; text sits outside the filter group | DS project rule: data charts set `o.wob = 0` |

## 2. Templates

### 1 Cycle — `VL.diagram.cycle`
- **For**: the result of one step becomes the start of the next round: feedback loops, core loops, iteration, learning loops, vicious circles.
- **From the three courses**: GD `ch02-core-loop.html` (action → feedback → reward → growth → new goal), `ch04-rules-mda.html` (Monopoly's positive feedback), `ch17-goodhart-metrics.html` (vicious circle), `ch26-prototype-iterate.html` (iteration loop), `ch29-build-web-game.html` (game loop); AI `ch06-reinforcement-learning.html` (the reinforcement-learning loop, labelled with the opening "treats" scene), `ch05-supervised-unsupervised.html` (k-means: assign to flag / move flag loop).
- **How**: 3–6 nodes around a circle or rounded rectangle; arrows head to tail; draw the segment back to the start thicker or mark it ↺. Node = name + one line from this chapter's opening example (AI `ch06` does this best: every step of the loop is labelled with the "giving treats" scene). Mark positive / negative feedback on the arrows with + / −.
- **Mistakes**: more than 6 nodes, so the circle becomes a string of words; all arrows equally thick, so the loop doesn't show; nodes with abstract words only.

### 2 Nested circles / nesting dolls — `VL.diagram.nested`
- **For**: A contains B contains C; or the same pattern nested at different time scales.
- **From the three courses**: AI `ch01-what-is-ai.html` (AI ⊃ machine learning ⊃ deep learning ⊃ large language models, each layer clickable); GD `ch02-core-loop.html` (second / minute / day-and-week loops), `ch22-games-and-reality.html` (the magic circle: rules inside, reality outside).
- **How**: concentric circles or rounded rectangles with ≥18px between layers so leader lines can pass. **Each layer's name and example go outside, on the right**, with a leader line to that layer's edge. The innermost layer can hold a small icon. Clicking a layer thickens its outline and fills it with a pale accent, dims the rest, and the info box says "what it adds to the layer outside". `layers` are given from inside out; on narrow screens labels become a numbered key.
- **Mistakes**: layer names written inside the ring, on the border (the most common fault in old GD); too many layers (>4) crammed together; readers can't tell "contains" from "comes before" — containment is nesting, sequence is a flow.

### 3 Flow / pipeline — `VL.diagram.flow`
- **For**: something passes through several steps and becomes something else; one direction, no return.
- **From the three courses**: GD `ch03-player-motivation.html` (promised reward → felt as control → less autonomy → less interest), `ch13-accessibility.html` (one event sent down three channels at once: picture, sound, vibration), `ch28-paper-prototype.html` (six steps of paper prototyping), `ch29-build-web-game.html` (HTML → DOM → render tree); AI `ch11-backpropagation.html` (computation graph, left to right).
- **How**: left to right (top to bottom on narrow screens; `dir:"auto"` does this). One box per step; write on each arrow *what happens* (a verb). Draw what goes in and out as small objects (a slip of paper, a block) so the reader sees things moving. Branch with a Y, merge with ⋀.
- **Mistakes**: bare arrows, so nobody knows what each step does; drawing a loop as a flow (if the last step returns to the start, use template 1); more than 6 steps without splitting.

### 4 Axes / quadrants — `VL.diagram.quadrant`
- **For**: two independent dimensions decide a position; or two axes cut out four kinds of thing.
- **From the three courses**: GD `ch06-flow.html` (skill × challenge flow channel: anxiety top left, boredom bottom right), `ch03-player-motivation.html` (Bartle's four quadrants), `ch10-ui-onboarding.html` (UI quadrants), `ch27-playtesting.html` (research methods: what people say ↔ what they do × qualitative ↔ quantitative); AI `ch05-supervised-unsupervised.html` (size × weight floor chart).
- **How**: plain words at both ends of each axis ("too easy ↔ too hard"), not just a variable name. Quadrant names sit in the inner corner, ≥8px from the axes, each with a small picture of a representative example. `quads` order: top left, top right, bottom left, bottom right; `points` take x, y in 0–1. When the reader must judge a position, make it a G4 drag ("drag this game to where you think it belongs").
- **Mistakes**: axes with a name but no direction; quadrant names sitting on the axis line; four quadrants in four colours with no text to tell them apart.

### 5 Two-column comparison — `VL.diagram.compare`
- **For**: two ways of doing the same thing, before and after, example and counterexample.
- **From the three courses**: GD `ch07-game-feel.html` (block with no feedback vs block with feedback), `ch26-prototype-iterate.html` (one final draft vs feedback every round), `ch29-build-web-game.html` (wait-for-input vs game loop); AI `ch15-tokens-embeddings.html` (one-hot vectors vs embeddings).
- **How**: two columns, same size, same composition, same starting point — **only the thing being compared differs**. A text tag on each side: ✓ / ✗ or "before / after". Circle the difference in the accent colour. For subtle differences use E2's draggable divider.
- **Mistakes**: the two columns drawn differently, so readers can't tell whether the difference comes from the concept or the drawing; the difference not circled; colour as the only distinction.

### 6 Timeline / rhythm curve — `VL.diagram.timeline`
- **For**: a quantity rising and falling over time (pacing, intensity, memory), or events in order.
- **From the three courses**: GD `ch11-level-design.html` (tension rising and falling through a level, rest points in the troughs), `ch07-game-feel.html` (feedback timeline of one hit: confirm, hit-stop, squash, aftershock; clickable), `ch24-case-mario.html` (the teaching timeline of World 1-1), `ch14-randomness-probability.html` (input randomness → decision → output randomness); AI `ch14-compute-gpu.html` (a band of years).
- **How**: time on the horizontal axis, ticks in plain units ("second 1", "level 3"). Key moments get a vertical dashed line and a label outside the plot; give each peak and trough a small scene picture; clickable moments become hotspots. The kit draws two forms: `tracks` (parallel tracks of dots, a star on each rewarded one — e.g. the four reinforcement schedules) and `curve` + `events` (one curve with dashed key moments; set `demo` to mark it as illustrative). For year-by-year invention-story timelines use T5, not this.
- **Mistakes**: curve labels hugging the line and overlapping it; ticks too dense; an illustrative curve that looks like real data without an "illustrative" label.

### 7 Tree / classification — `VL.diagram.tree`
- **For**: one thing splits into several, which split again; decision branches; skill or branching structures.
- **From the three courses**: GD `ch08-meaningful-choices.html` (decision tree, options labelled with gain / risk / cost), `ch09-narrative.html` (a branching story that keeps splitting), `ch14-randomness-probability.html` (decision tree for the problem of points), `ch16-progression.html` (skill trees: linear, branching, merging); DS `ch04-unfinished-game.html` (every possible timeline).
- **How**: root at the top or left; nodes on one level aligned; ≤4 levels, ≤5 nodes per level — extras fold into "…3 more kinds" (the kit does this past `max`, default 5). Leaves get a small picture or example; probabilities / values go on the edges (`edge`), ≥4px from the line. A decision tree can become "click a branch to see the outcome". When it's too wide the kit switches to an indented, folder-style layout (`dir:"indent"` forces it).
- **Mistakes**: mixed criteria (one level split by colour and size at once); a tree so wide it scrolls sideways on a phone (go vertical or split it).

### 8 Venn / overlap — `VL.diagram.venn`
- **For**: two or three groups that overlap, where the "both A and B" region is the point.
- **From the three courses**: rarely used. The closest are AI `ch10-perceptron.html` (two semi-transparent sheets, each cut once, laid on top of each other; only the area both cover counts) and GD `ch01-what-is-a-game.html` (family resemblance: an overlapping web of similarities). Prefer it in new courses whenever a concept is about an intersection.
- **How**: at most 3 circles; pale semi-transparent fills with ink outlines, the intersection filled with the accent. Put one concrete example in each region (not the region's name); set names go outside the circles on leader lines. Clicking a region highlights it and says why the example lands there. Data: `sets`, and `regions: [{in:[0,1], eg, name, info}]` where `in` lists the circles the region belongs to (0-based).
- **Mistakes**: set names written in the intersection; 4+ circles (unreadable — use a table); examples sitting on a boundary line so you can't tell which region they're in.

### 9 Balance / tug-of-war — `VL.diagram.balance`
- **For**: two forces where more of one means less of the other and you need a balance point; trade-offs, counters.
- **From the three courses**: AI `ch10-perceptron.html` (scales: weight blocks vs threshold blocks), `ch06-reinforcement-learning.html` (averaging on a seesaw), `ch20-scaling-laws.html` (fixed compute: parameters and data trade off); GD `ch08-meaningful-choices.html` (great sword vs bow), `ch15-balance-economy.html` (rock-paper-scissors triangle, circle sizes change with the parameters); DS `ch09-arrows.html` (after selecting players, height and skill behave like a seesaw).
- **How**: draw the pivot and both ends as real objects (weights, people, a seesaw); label each end with what pushes it down. The tilt follows the reader's parameter (best as a G2 live chart: give the kit's `slider`, or set `tilt` −1…+1, or `value` on each side). Mark the balance point in the accent.
- **Mistakes**: a static balance, so the reader never feels "more here, less there"; ends without units or examples.

### 10 Network / relationships — `VL.diagram.network`
- **For**: several things linked in pairs where the links are the point: causal diagrams, sources of bias, concept relationships, social networks.
- **From the three courses**: DS `ch09-arrows.html` (causal-diagram workbench: six draggable variables you can connect with arrows), `ch02-filtered-shadows.html` (selection-bias diagram); GD `ch27-playtesting.html` (four biases flowing towards "you"), `ch16-progression.html` (types of progression system around "progress"), `ch06-flow.html` (three conditions together pointing to flow); every course's `map.html` concept map.
- **How**: ≤8 nodes (more than that is the concept-map module in `modules.md`). **Edge types are told apart by line style plus text** (solid = causes, dashed = related, arrow direction = who affects whom), not by colour alone; the kit's edge `kind` is `cause / link / both`, and `label` writes on the edge. Biggest node in the centre (`main`). Clicking a node lights only it and its neighbours. Place nodes by hand: `x, y` in 0–1 (optional `nx, ny` for narrow screens).
- **Mistakes**: lines crossing into a tangle (place nodes by hand; don't rely on force layout); unlabelled edges, so nobody knows what a line means.

### 11 Spectrum (supplementary) — `VL.diagram.spectrum`
- **For**: continuous change along one dimension from one end to the other, with examples placed by degree.
- **From the three courses**: GD `ch01-what-is-a-game.html` (free play *paidia* → structured play *ludus*), `ch18-multiplayer.html` (pure cooperation → pure competition), `ch21-ethics-monetization.html` (selling choices → selling relief from pain), `ch22-games-and-reality.html` (game → reality).
- **How**: one thick axis with plain-language extremes at each end ("no rules at all / tightly ruled"; `lo`, `hi`); examples hang on the axis as small pictures (`items` with `at` 0–1), names below on leader lines. Can be a G4 drag, "where do you think it goes?". Horizontal on wide screens, vertical on narrow.
- **Mistakes**: examples with a name but no picture; nothing in the middle, so readers think only the two extremes exist.

### 12 Stack / layers (supplementary) — `VL.diagram.stack`
- **For**: a whole built from several layers, or parts that add up to a total.
- **From the three courses**: AI `ch04-overfitting-generalization.html` (final-exam error split into noise / bias / variance), `ch12-cnn-imagenet.html` (four steps: short edges → shapes → parts → objects); GD `ch05-emergence-systems.html` (simple rules → interactions → the whole), `ch16-progression.html` (layers of feedback, from floating numbers to the level-up pop-up).
- **How**: the bottom layer at the bottom (a foundation). Each layer = name + example, outside on the right. Clicking a layer shows how much it contributes; give `value` and the heights become proportional (`total`, `unit` optional). Stacked bars use the `--q*` colours, matching the prose.
- **Mistakes**: layer names inside the layer, swallowed by the fill; layer order that doesn't match what depends on what.

## 3. Picking a template

| The text says something like | Use |
|---|---|
| "…leads to…, which brings us back to…" | 1 Cycle |
| "…is a kind of…", "…inside it there's…" | 2 Nested |
| "first…, then…, finally…" | 3 Flow |
| "it depends on two things: … and …" | 4 Quadrant |
| "both do…, but one… and the other…" | 5 Compare |
| "at first… after a while… by the end…" | 6 Timeline |
| "there are several kinds", "either… or…" | 7 Tree |
| "the ones that are both… and…" | 8 Venn |
| "more of this means less of that", "find a balance" | 9 Balance |
| "these things all affect each other" | 10 Network |
| "from… to…, with… in between" | 11 Spectrum |
| "made of … layers", "add these up and you get…" | 12 Stack |

## 4. HTML structure

The kit way (template 2 as the example; every template works the same, declaratively or via `VL.diagram.<name>()`): the SVG, leader lines and info line are all generated by `diagrams.js`, never hand-written.

```html
<figure class="vl-fig" id="c01-nest" data-diagram="nested">
  <script type="application/json">{"layers":[
    {"name":"Large language models","eg":"keep writing the next word","info":"<b>Large language models</b>: compared with the layer outside, they add…"},
    {"name":"Deep learning","eg":"neural networks with many layers"},
    {"name":"Machine learning","eg":"finds the rules from examples"},
    {"name":"Artificial intelligence","eg":"getting machines to do clever things"}]}</script>
  <figcaption>The four terms aren't four separate things side by side; each sits inside the next, and the further in you go the more specific it gets.</figcaption>
</figure>
<script>
  // Equivalent JS; returns {el, svg, redraw(), select(i), selected}
  VL.diagram.nested("#c01-nest", { layers: [/* inside out */], spin: false });
</script>
```

In the generated structure, boxes `.vl-dg-box` and lines `.vl-dg-ln` may take the skin's filter (hand-drawn wobble); text `.vl-dg-t1` (name) / `.vl-dg-t2` (example) / `.vl-dg-t3` (small print) and leader lines `.vl-dg-lead` never do. Every class a skin can style is listed in `kit/README.md` section 9, "Classes available to skins". Hand-drawn SVG (for anything the kit templates can't draw) follows the same layering: shapes in the filtered group, text outside it, clickable parts as `g[tabindex=0][role=button]`.

## 5. When not to draw a diagram

| Situation | Use instead |
|---|---|
| The passage has no structure, just a scene or one event | Scene illustration, real photo |
| You want "what happens if I change this number" | G2 live chart (a diagram shows only one state) |
| Just two or three parallel nouns with no relationship | K2 card grid, or say it in a sentence |
| The diagram only puts the prose sentences in boxes with arrows | Delete it — if removing it doesn't hurt understanding, it shouldn't be there |
| The previous visual was also a static diagram | Put an illustration, example or interaction between them first (`SKILL.md` pacing rule 3) |
| Too many relationships (>8 nodes, >3 circles, >4 layers) | Split into two, or use a T8 table / the concept-map module |
| History, people | Real images, T5 illustrated timeline |
| A diagram earlier already showed this structure | Refer back ("see Figure 3"), don't redraw; each picture is used once per course |
