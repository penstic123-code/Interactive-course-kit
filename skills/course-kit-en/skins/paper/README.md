# Skin paper: paper cut-out

Purpose: this skin's style, variables, illustration style and what it suits. Status: in the library; sample chapter in `examples/paper-survivorship/`. This is the English translation of the Chinese README, which remains the source of truth.

**In one line**: a warm-white sheet of card stands in front of blue sky and grass, with the body text printed straight onto the card. Figures, interaction boards and concept cards are cut-out coloured card with a white trimmed edge and a soft shadow, and the heaviest ones sit on a backing layer of kraft paper. The contents page is a paper tower: chapter 1 is on the ground floor, and you climb up.

## Files

| File | Contents |
|---|---|
| `skin.css` | Variables (five part colours, sky bands, tower walls) + component looks + the paper tower on the contents page + the sky band in the chapter header |
| `skin.js` | `window.VL_SKIN` (web fonts, cut-paper filters `#pp-cut1…3`, fibre texture `#pp-fiber`, illustration palette) + the paper-cut drawing kit (replaces the drawing style of `VL.illus.kit` through the kit's skin drawing hook `VL_SKIN.illus`) + header animation pause / freeze |
| `interact.css` `modules.css` `diagrams.css` | Looks for the interactive components, optional modules and the later seven diagrams (made from the notebook files of the same name, redrawn in card style) |
| `img/` | Fibre textures `fiber.png` `fiber-soft.png`, background paper clouds `clouds.svg`, grass `hills.svg` |
| `gallery.html` | Approval page |

## Fonts

| Variable | Used for | Font |
|---|---|---|
| `--font-display` = `--font-label` = `--font-hand` | h1–h4, buttons, labels, paper tags | ZCOOL KuaiLe (web, OFL) → LXGW WenKai → Microsoft YaHei |
| `--font-body` | body text 17.5px / 1.85 | LXGW WenKai (web, OFL) → KaiTi |
| `--font-fig` | text inside illustrations and diagrams | system sans-serif, bold (KuaiLe is hard to read at small sizes) |
| English pages | body Segoe UI or similar; headings Fredoka (web, OFL) | |

No local fonts are bundled: a woff2 subset cut to one course's characters would lack characters in another course. Offline, it falls back to system fonts and the layout stays intact.

## Variables

| Group | Value |
|---|---|
| `--ink --ink2 --muted` | #1f2638 / #3b4358 / #4d566c |
| `--page --panel --edge --sunk --kraft` | sky #cdeafa / card #fbf6ea / white trim #fffdf7 / #f3ecdc / kraft #dcc9a2 |
| `--accent --accent2 --deep` | part colour (light, fills only) / secondary colour / part's dark colour for text |
| `--plate --plate-ink` | #fdfaf1 / #1f2638 |
| `--shadow-c` | one shadow colour rgba(40,60,90,.22) |
| `--shadow-obj` | 5px white trim + kraft backing layer + distant shadow (interaction boards, numbered figures, badges) |
| `--shadow-mid` `--shadow-soft` | 4px white trim + medium shadow (concept cards, carousel) / 3px white trim + soft shadow (Try it, wrap-up blocks) |
| `--dg-*` | fills sky blue, grass green, coral, pale purple, light yellow, peach; selected #c8364f; boxes take the cut-paper filter `--dg-filter:url(#pp-cut1)`, lines don't |
| `--q1…q6` | same as notebook (≥4.5:1 on the card) |

Parts: five sets of `--p{n}a/b/d` (sky blue + grass green, mint + peach, pale purple + light yellow, coral + cloud grey, apricot + light blue), plus each part's sky band `--pp-sky-n`, window scene `--pp-art-n` (morning windmill → afternoon kite → dusk stars and moon → dawn sea of clouds) and tower wall `--pp-wall-n`. Hue within a part varies ±18°.

## What is heavy and what is light

| Heaviest (5px white trim + kraft backing + distant shadow) | Medium (white trim + medium shadow) | Light (no shadow) |
|---|---|---|
| Interaction boards `.vl-board`, numbered figures and concept diagrams `.vl-fig`, quiz badges | Concept cards (thick secondary-colour paper strip on the left), photos (washi tape), example carousel, Try it, wrap-up blocks, document props | Why-it-works box (main-colour paper strip on the left + paper tag), stance cards, side paths / invention stories (kraft file folder, with a kraft edge down the left when open) |

## Illustration style
- Paper-cut puppets: layered coloured card, a white trimmed edge and shadow around the whole object (`cut()`), fibre texture on the paper surface with light from above, edges slightly irregular as if cut with scissors.
- The interface follows the kit: `k.person / hands / feetY / ground / item / holding / bubble / T / arrow` in `VL.illus.add(...)` all use the paper-cut style, with the same parameters as notebook. `k.person`'s feet are still at `y + 64·s`, and `k.ground()` is a strip of paper grass.
- Objects: `k.item / k.holding` support all the kit's objects book box cup phone die star coin, plus the paper-specific doc photo card board chip plant.
- Automatic rules: within one picture the k-th person changes outfit in turn (short hair → baseball cap → long hair and skirt → beanie and scarf → top hat, suit and tie). For a person given hat / hair / glasses / tie / shirt and so on, the specified items use the specified values and the rest of the outfit still follows the order of appearance (if only hair is specified, that outfit's hat is dropped). `outfit:false` turns off outfit changes; `legs:"sit"` brings its own wooden stool (`chair:false` turns it off); `look:-1` mirrors the whole puppet and leaves text unflipped; `holding()` draws the object at the midpoint of the hands, then presses the two hands on either side of it.
- Strokes: the outer `<g>` of an illustration carries a 3.5px ink line by default (for lines the author writes by hand). The kit interfaces such as `k.person`, and every drawing function in `k.paper` (rect, blob, cut, tag, stage…), already output `stroke="none"`, so just combine them without wrapping. `k.paper.stage(o, inner)` strips strokes only from the set, and puts `inner` in as it is, where hand-written lines still inherit the ink line.
- More paper API is in `k.paper`: `stage({back:"meadow|plain|hills|lab|night|city", ground:"grass|wood|cobble"})`, `cut / lay / rect / circle / blob / strip`, `paperPerson` (fuller costumes: fedora, beret, lab coat, waistcoat…), `desk / chair / lamp / plant / board / card / tag / sign / parrow`.
- Text in pictures uses `k.T`, in the 4th argument of `add()` (the text layer); font size ≥12.

## Own motion
- In the header sky band a paper cloud drifts slowly (only at the full level; pauses outside the viewport; `?freeze=seconds` freezes it; absent at the lite / off levels and under reduced motion).
- Popover panels drop in lightly and buttons sink like paper when pressed; all removed at the off level.
- The tower-climbing transition, paper page turns and scroll reveal are not part of the skin (they depend on course scripts); build them separately if needed.

## When it fits
- Suits: light-hearted courses with a story and characters, for middle to high school readers; illustrations mostly of paper puppets and small scenes.
- Doesn't suit: serious history or medicine; courses based mainly on photos. Keep data charts straight-edged, without the cut-paper filter.

## Known issues
- From part 6 on, `.vl-tb-dots` wraps back to part 1's colours.
- The paper tower on the contents page recognises only the `#ix-parts / .ix-part / .ix-ch` structure of starter/index.html; to beat in-page styles, its selectors carry `body #ix-parts`.
- Replacing the illustrations relies on the kit hook `window.VL_SKIN.illus`: skin.js must load before kit/illus.js (the starter template already does).
