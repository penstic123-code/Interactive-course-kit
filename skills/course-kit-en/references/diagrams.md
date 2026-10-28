# Concept diagram templates

Purpose: which diagram to use when a passage explains a *structure* (a loop, layers, cause and effect, a contrast, a classification…), how to draw it, and which mistakes to avoid. Diagrams are one family within T3 numbered figures in `components.md`; when to use a diagram and how to alternate it with illustrations is in `SKILL.md` section 1.

Templates 1–12 are in `kit/diagrams.js`: `VL.diagram.cycle / nested / flow / quadrant / compare / timeline / tree / venn / balance / network / spectrum / stack`. Usage and parameters are in `kit/README.md` section 9, **which is the authority**. Templates 13–14 (frequency tree, inference chain) are not in the kit yet: they have a drawing method only, so draw them as in-page SVG.

This is the kind of picture the user values most: loop diagrams, nested circles and the like, where **every node has a name plus one concrete example line, the caption says "why", the reader can click one layer at a time, and labels sit outside the shape on leader lines.**

## 1. Rules every diagram follows

| # | Rule | How | Good / bad example |
|---|---|---|---|
| 1 | Node = name + one example line | Name in bold, short (by default ≤6 Chinese characters, roughly 1–3 English words); below it one concrete example line (by default ≤14 Chinese characters, roughly ≤8 English words, as long as it fits at the ≥13px figure text size), e.g. "Seconds: press a key, jump". No abstract definitions | Good: the loop diagram in `examples/fieldbook-gift/ch01-gift.html`, with an example under every node. Bad: a circle of three bare words "action / feedback / reward" that leaves the reader guessing what they mean |
| 2 | Colours have jobs | Structure (boxes, arrows, axes) in ink `--dg-ink`. **One accent colour for the whole diagram**, for the part to look at now (selected state `--dg-hi`). Node fills `--dg-c1…c6` chosen by colour number `c` to mark categories, never rotated per node. Right/wrong uses `--ok/--no` plus ✓✗. Quantities use `--q1…--q6`, the same colours as in the prose and formulas. **The same thing keeps the same colour through the whole chapter** (category A always orange, B always blue, in every figure), so the reader recognises "that again" by colour | Bad: every node a different colour, a rainbow: it looks machine-assembled; orange is cats in one figure and dogs in the next |
| 3 | Labels outside, on leader lines | Labels for nested circles, concentric ellipses and curves go outside the shape, joined by a thin leader line (1–1.5px) to the part they name. Never squeeze text onto a border | Good: three nested loops, each layer labelled on the right with a leader line |
| 4 | Text ≥4px from lines | Every text bounding box stays ≥4px from any box, line or circle. If it doesn't fit, make the canvas taller; don't shrink the text | The in-figure text check of `tools/qa.mjs` (out of bounds, on a border, crowding a line, overlapping) catches many of these |
| 5 | Diagram text ≥13px, contrast per `skin-contract.md` section 1 | A handwriting font may be used inside diagrams only once checked for legibility, with a clear font for letters and digits (`unicode-range`) | Bad: a handwriting font that makes "VR5" read as "9R5" |
| 6 | The caption says "why" | Say what the diagram shows or proves; don't repeat the words inside it. ≤40 Chinese characters (about 25 English words); once a caption runs long, the two-column layout opens a big gap and nobody reads it | ✓ "Seconds, minutes and days nest inside each other, so when one session gets stale a bigger loop pulls you back." ✗ "The three levels of the core loop" |
| 7 | If it can be clicked, one layer at a time | Kit diagrams are selectable by default: the clicked block is highlighted, the rest dim, and the info line switches to that block's `info`; for keyboard, `select:false` and events see `kit/README.md` section 9 | Good: a nesting-doll diagram in an AI course, "click any layer to see what it adds to the one outside it" |
| 8 | The static version is complete | Readable without clicking; clicking only zooms in on detail. Everything visible when printed or with motion off | — |
| 9 | Has `aria-label` | Say what is drawn and how it connects (screen-reader users rely on it); colour is never the only signal. Kit diagrams generate one if you don't pass `label` | Good: every inline figure has a full `aria-label` |
| 10 | One idea per diagram; by default the same width as the text, about 2:1, height ≤300px (taller needs scrolling to see whole; vertical chains and trees may be exceptions) | Before drawing, say in one sentence what the diagram is about; if it won't fit in one sentence, split it. With many nodes, split into two diagrams rather than shrink | — |
| 11 | Edges: concept diagrams may wobble with the skin; data charts stay straight | Wobble filter uses `in="SourceGraphic"`; text sits outside the filter group | Data charts set `o.wob = 0` |
| 12 | Show the mechanism, so the reader can trace it | When there are quantities, write multipliers or values on the edges so the reader can recompute the result; without quantities (cycles, classifications), arrows and position show what causes what and what belongs where | Good: every edge of a tree says "×0.3" and each leaf shows the product; bad: bare "cause → effect" arrows |
| 13 | The numbers in the diagram are the ones the prose just used | Don't switch to a different set of numbers in the figure; where possible generate the figure and the prose from the same data in code, so changing a number changes both | Bad: the prose says 36 photos, the figure draws 40 cells |
| 14 | Line styles carry meaning, consistently across the course | With one line style nothing needs explaining; with two or more, label them beside the lines or add a one-line legend in the corner; colour is never the only signal (rule 2, template 10) | Bad: dashed means "related" in one figure and "extra condition" in another |
| 15 | For readers new to probability, introduce it as counts | The first time a probability appears, write "36 out of 100" (natural frequencies), not a percentage or p-value; counts can be counted and multiplied directly, percentages make the reader convert (source: Gigerenzer & Hoffrage, 1995, *Psychological Review*, frequency formats substantially improve Bayesian reasoning) | Good: the frequency tree (template 13) |

## 2. Templates

The upper limits on nodes, layers and circles in the templates (≤6, ≤4, ≤8, at most 3 circles) are rules of thumb: when there are too many for the reader to count, split the diagram; don't shrink the text. Example lines list only one or two, enough to recognise what the template is for.

### 1 Cycle
- **For**: the result of one step becomes the start of the next round: feedback loops, core loops, iteration, learning loops, vicious circles.
- **Examples**: action → feedback → reward → growth → new goal; the reinforcement-learning loop, labelled with the opening "treats" scene.
- **How**: 3–6 nodes around a circle or rounded rectangle; arrows head to tail; draw the segment back to the start thicker or mark it ↺. Node = name + one line from this chapter's opening example (best: label every step of the loop with the chapter's opening scene; for a model see the loop diagram in `examples/fieldbook-gift/ch01-gift.html`). Mark positive / negative feedback on the arrows with + / −.
- **Mistakes**: more than 6 nodes, so the circle becomes a string of words; all arrows equally thick, so the loop doesn't show; nodes with abstract words only.

### 2 Nested circles / nesting dolls
- **For**: A contains B contains C; or the same pattern nested at different time scales.
- **Examples**: AI ⊃ machine learning ⊃ deep learning ⊃ large language models, each layer clickable.
- **How**: concentric circles or rounded rectangles with ≥18px between layers so leader lines can pass. **Each layer's name and example go outside, on the right**, with a leader line to that layer's edge. The innermost layer can hold a small icon. Clicking a layer thickens its outline and fills it with a pale accent, dims the rest, and the info box says "what it adds to the layer outside".
- **Mistakes**: layer names written inside the ring, on the border (the most common fault); too many layers (>4) crammed together; readers can't tell "contains" from "comes before" — containment is nesting, sequence is a flow.

### 3 Flow / pipeline
- **For**: something passes through several steps and becomes something else; one direction, no return.
- **Examples**: promised reward → felt as control → less autonomy → less interest; HTML → DOM → render tree.
- **How**: left to right (top to bottom on narrow screens). One box per step; write on each arrow *what happens* (a verb). Draw what goes in and out as small objects (a slip of paper, a block) so the reader sees things moving. Branch with a Y, merge with ⋀.
- **Mistakes**: bare arrows, so nobody knows what each step does; drawing a loop as a flow (if the last step returns to the start, use template 1); more than 6 steps without splitting.

### 4 Axes / quadrants
- **For**: two independent dimensions decide a position; or two axes cut out four kinds of thing.
- **Examples**: skill × challenge flow channel: anxiety top left, boredom bottom right; Bartle's four quadrants.
- **How**: plain words at both ends of each axis ("too easy ↔ too hard"), not just a variable name. Quadrant names sit in the inner corner, ≥8px from the axes, each with a small picture of a representative example. When the reader must judge a position, make it a G4 drag ("drag this game to where you think it belongs").
- **Mistakes**: axes with a name but no direction; quadrant names sitting on the axis line; four quadrants in four colours with no text to tell them apart.

### 5 Two-column comparison
- **For**: two ways of doing the same thing, before and after, example and counterexample.
- **Examples**: block with no feedback vs block with feedback; one-hot vectors vs embeddings.
- **How**: two columns, same size, same composition, same starting point — **only the thing being compared differs**. A text tag on each side: ✓ / ✗ or "before / after". Circle the difference in the accent colour. For subtle differences use E2's draggable divider.
- **Mistakes**: the two columns drawn differently, so readers can't tell whether the difference comes from the concept or the drawing; the difference not circled; colour as the only distinction.

### 6 Timeline / rhythm curve
- **For**: a quantity rising and falling over time (pacing, intensity, memory), or events in order.
- **Examples**: tension rising and falling through a level, rest points in the troughs; feedback timeline of one hit: confirm, hit-stop, squash, aftershock; clickable.
- **How**: time on the horizontal axis, ticks in plain units ("second 1", "level 3"). Key moments get a vertical dashed line and a label outside the plot; give each peak and trough a small scene picture; clickable moments become hotspots. For year-by-year invention-story timelines use T5, not this.
- **Mistakes**: curve labels hugging the line and overlapping it; ticks too dense; an illustrative curve that looks like real data without an "illustrative" label.

### 7 Tree / classification
- **For**: one thing splits into several, which split again; decision branches; skill or branching structures.
- **Examples**: decision tree, options labelled with gain / risk / cost; skill trees: linear, branching, merging.
- **How**: root at the top or left; nodes on one level aligned; ≤4 levels, ≤5 nodes per level — extras fold into "…3 more kinds". Leaves get a small picture or example; probabilities / values go on the edges, ≥4px from the line. A decision tree can become "click a branch to see the outcome".
- **Mistakes**: mixed criteria (one level split by colour and size at once); a tree so wide it scrolls sideways on a phone (go vertical or split it).

### 8 Venn / overlap
- **For**: two or three groups that overlap, where the "both A and B" region is the point.
- **Examples**: rarely used. The closest are two semi-transparent sheets, each cut once, laid on top of each other, where only the area both cover counts. Prefer it whenever a concept is about an intersection.
- **How**: at most 3 circles; pale semi-transparent fills with ink outlines, the intersection filled with the accent. Put one concrete example in each region (not the region's name); set names go outside the circles on leader lines. Clicking a region highlights it and says why the example lands there.
- **Mistakes**: set names written in the intersection; 4+ circles (unreadable — use a table); examples sitting on a boundary line so you can't tell which region they're in.

### 9 Balance / tug-of-war
- **For**: two forces where more of one means less of the other and you need a balance point; trade-offs, counters.
- **Examples**: scales: weight blocks vs threshold blocks; fixed compute: parameters and data trade off.
- **How**: draw the pivot and both ends as real objects (weights, people, a seesaw); label each end with what pushes it down. The tilt follows the reader's parameter (best as a G2 live chart). Mark the balance point in the accent.
- **Mistakes**: a static balance, so the reader never feels "more here, less there"; ends without units or examples.

### 10 Network / relationships
- **For**: several things linked in pairs where the links are the point: causal diagrams, sources of bias, concept relationships, social networks.
- **Examples**: causal-diagram workbench: six draggable variables you can connect with arrows; three conditions together pointing to flow.
- **How**: ≤8 nodes (more than that is the concept-map module in `modules.md`). **Edge types are told apart by line style plus text** (solid = causes, dashed = related, arrow direction = who affects whom), not by colour alone. Biggest node in the centre. Clicking a node lights only it and its neighbours.
- **Mistakes**: lines crossing into a tangle (place nodes by hand; don't rely on force layout); unlabelled edges, so nobody knows what a line means.

### 11 Spectrum (supplementary)
- **For**: continuous change along one dimension from one end to the other, with examples placed by degree.
- **Examples**: free play *paidia* → structured play *ludus*; pure cooperation → pure competition.
- **How**: one thick axis with plain-language extremes at each end ("no rules at all / tightly ruled"); examples hang on the axis as small pictures, names below. Can be a G4 drag, "where do you think it goes?".
- **Mistakes**: examples with a name but no picture; nothing in the middle, so readers think only the two extremes exist.

### 12 Stack / layers (supplementary)
- **For**: a whole built from several layers, or parts that add up to a total.
- **Examples**: final-exam error split into noise / bias / variance; four steps: short edges → shapes → parts → objects.
- **How**: the bottom layer at the bottom (a foundation). Each layer = name + example, outside on the right. Clicking a layer shows how much it contributes. Stacked bars use the `--q*` colours, matching the prose.
- **Mistakes**: layer names inside the layer, swallowed by the fill; layer order that doesn't match what depends on what.

### 13 Frequency tree (drawing method only; not in the kit, draw as in-page SVG)
- **For**: working out, with counts rather than percentages, "of the cases showing a feature, how many really belong to a category" — conditional probability, Bayes, false positives in tests.
- **Examples**: 100 animals split into cats / dogs, then into "pointy ears / not", then "of the pointy-eared ones, how many are cats?"; a test question: 10 of 1000 people have the disease, of those who test positive how many really have it.
- **How**: four tiers, top to bottom. (1) A total box ("100 animals"). (2) Split by category; **write the multiplier or ratio on every edge** ("×0.3", "×0.7") and the resulting whole number in each child box. (3) Split again by feature, with multipliers on the edges and counts in the leaves. (4) A conclusion box at the bottom: "N pointy-eared in all, M of them cats, M ÷ N". Use the accent for the leaves being asked about and for the conclusion box. Numbers come from the same source as the prose (rule 13); pick a total that divides evenly so every box is a whole number and the boxes add up.
- **Mistakes**: edges without multipliers, so the reader can't compute the child boxes; percentages in the leaves; counts that are rounded and don't add up; drawing the leaves in question the same as the irrelevant ones.

### 14 Inference chain (drawing method only; not in the kit, draw as in-page SVG)
- **For**: several rules chained together: one rule's conclusion becomes another rule's condition and the chain ends in an action — expert systems, rule engines, logical inference, diagnostic flows.
- **Examples**: symptoms (fever, cough) → rule 1 "suspected infection" → rule 2 "suspected infection and high white cell count → bacterial infection" → action "prescribe antibiotics".
- **How**: input facts on the left (small boxes), rule nodes in the middle (rounded boxes holding one "if … then …" sentence), the action on the right. Inputs enter rules by solid arrows; **draw a rule's conclusion as a small tag, and run an arrow from the tag into the next rule's condition slot**; an extra condition a rule needs is a dashed arrow, explained in a corner legend; the final action in the accent. Lay out left to right with no crossing arrows.
- **Mistakes**: rule node and conclusion indistinguishable (give the conclusion its own tag); solid vs dashed with no legend; more than 5 rules on one figure (split it).

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
| "out of 100 there are…, of which…", "how sure can we be when we see…" | 13 Frequency tree |
| "if…then…, and that in turn meets another rule's condition" | 14 Inference chain |

## 4. HTML structure

The kit way (template 2 as the example; every other template is likewise declarative or `VL.diagram.<name>()`): the declarative form or a JS call; the SVG, leader lines and info line are all generated by `diagrams.js`, never hand-written.

```html
<figure class="vl-fig" id="c01-nest" data-diagram="nested">
  <script type="application/json">{"layers":[
    {"name":"Large language models","eg":"keep writing the next word","info":"<b>Large language models</b>: compared with the layer outside, they add…"},
    {"name":"Deep learning","eg":"neural networks with many layers"},
    {"name":"Machine learning","eg":"finds the rules from examples"},
    {"name":"Artificial intelligence","eg":"getting machines to do clever things"}]}</script>
  <figcaption>The four terms aren't four separate things side by side; each sits inside the next, and the further in you go the more specific it gets.</figcaption>
</figure>
```
For the equivalent JS form and return values see `kit/README.md` section 9, "two ways to write it".

In the generated structure, boxes `.vl-dg-box` and lines `.vl-dg-ln` may take the skin's filter (hand-drawn wobble); text `.vl-dg-t1` (name) / `.vl-dg-t2` (example) / `.vl-dg-t3` (small print) and leader lines `.vl-dg-lead` never do. Every class a skin can style is listed in `kit/README.md` section 9, "Classes available to skins". Hand-drawn SVG (for anything the kit's 12 templates can't draw) follows the same layering: shapes in the filtered group, text outside it, clickable parts as `g[tabindex=0][role=button]`.

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
| A diagram earlier already showed this structure | Refer back ("see Figure 3"), don't redraw (rule: `SKILL.md` section 1, 5.6) |
