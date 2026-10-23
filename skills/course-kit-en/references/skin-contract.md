# Skin contract

Purpose: what a skin must deliver (variables, component looks, illustration kit, its own motion), how it gets approved into the library, and the current list of skins. When choosing a skin, read the list at the end of this file and `skins/<name>/README.md`; the visual baseline is in `SKILL.md` section 2. `kit/README.md` is the reference for file structure.

**Skin = one stylesheet + one illustration style + a little decoration and atmosphere motion.** Component structure, interactions, navigation, quizzes and carousel scripts are skin-independent and reused as-is. The skin is fixed when the course starts (illustrations are drawn in the skin's style); readers can only switch colour schemes (light / dark / easy on the eyes).

## 1. Required CSS variables

Defined on `:root`. Override the main colour per part with `body[data-part="n"]` (vl.js writes the part number 1, 2, 3…). All four skins map the current part's colours to `--pa` (main) and `--pb` (accent); the other part variables differ: notebook `--pp` paper / `--pl` grid lines (5 sets), paper `--pd` deep + `--psky` `--part` `--pwall` (5 sets), pixel `--ps` console body (5 sets), fieldbook `--pd` deep (6 sets). Components should use only `--pa` `--pb`; for skin-specific ones, `skins/<name>/README.md` is the source of truth. Colour schemes override via `html[data-scheme="dark"]` and `html[data-scheme="sepia"]`. vl.js gives skins three more hooks: `body[data-pat]` (chapter number % 4, for switching paper texture), `--vl-dh` (hue shift within a part, −18…+18) and `--vl-chnum` (two-digit chapter number, for a corner mark). Components only reference variables; they never hard-code colours.

| Group | Variables | Hard requirement |
|---|---|---|
| Text | `--ink` body text, `--ink2` secondary, `--muted` notes | All three ≥4.5:1 against `--panel` (`--muted` too; DS's `#4d566c` is a reference floor) |
| Ground and surface | `--page` page background, `--panel` text surface, `--edge` edges of physical objects, `--sunk` control wells / grooves | Long text sits directly on `--panel`, never on an extra floating card; surfaces have a subtle real texture (paper grain, fibres), not a flat fill |
| Plate | `--plate` background of diagrams and illustrations, `--plate-ink` text in figures | In dark and sepia schemes, `.vl-fig`, `.vl-cc-fig` and stand-alone `.vl-illus` keep a light plate, so colours inside illustrations never need to change with the scheme; `--plate-ink` ≥4.5:1 on `--plate` |
| Main colour | `--accent`, `--accent2`, `--deep` | Light main colours only as fills; text in `--deep` (≥4.5:1); text on a selected button ≥4.5:1 against its fill (bad: DS view toggle, white text on accent2 at about 1.6:1) |
| Emphasis | `--hl` highlighter fill, `--focus` focus outline | `--focus` ≥3:1 on both `--page` and `--panel` |
| State | `--ok` `--okbg` `--no` `--nobg` `--warnbg` | Every state also gets a shape — ✓ ✗, dashed lines — never colour alone |
| Quantity encoding | `--q1` … `--q6` | Required for courses with maths; ≥3:1 on both `--panel` and `--plate`; fixed for the whole course; recheck contrast of each one in every scheme |
| Fonts | `--font-body` body, `--font-label` subheadings / buttons / labels, `--font-hand` handwriting, `--font-display` big titles, `--font-mono` numbers / code | See the font rules below |
| Shape | `--stroke` outline width, `--radius`, `--radius-alt` (for asymmetric corners), `--shadow-obj` shadow for physical objects, `--shadow-soft` | Only "things" get `--shadow-obj`, all shadows in the same direction; thick outlines only for interaction boards and concept diagrams |
| Motion | `--ease`, `--dur-fb` (≤300ms), `--steps` (pixel skins) | See `interaction.md` section 4 |
| Diagrams | `--dg-c1…c6` node fills, `--dg-ink` `--dg-ink2` lines and text, `--dg-hi` selected, `--dg-filter` hand-drawn filter (not for data charts) | Diagrams sit on the plate and stay the same in all three schemes; class names in `kit/README.md` section 9, "Classes available to skins" |
| Illustrations | `--il-filter`; colours in `VL_SKIN.palette` in `skin.js` | Same as above |

**Font rules**
- `--font-display` (calligraphy, chalk, pixel and other decorative faces) only for h1 and big chapter numbers.
- `--font-hand` may be used for subheadings, text in figures and buttons only once **checked for legibility**: screenshot it at 13px and 16px and read it. Give letters and digits a clear font with `unicode-range` covering only U+0030-0039, U+0041-005A, U+0061-007A (GD's approach: Ma Shan Zheng for Chinese characters, Patrick Hand for letters and digits, which stopped "VR5" reading as "9R5"). For an English-only page, the handwriting face itself must pass the same 13px / 16px check.
- Body text in a clear face (all three courses use LXGW WenKai, 17.5–18px / 1.85 line height).
- Fonts are local woff2, large Chinese fonts subset to the characters the course uses (e.g. fonttools `pyftsubset`; rerun for new chapters); web fonts are inserted asynchronously as a `<link>` by JS, never `@import`ed in CSS (bad: lines 1–3 of GD `style.css`); system fonts as fallback.
- Before switching fonts compare them on a small test page, then rerun `qa.mjs` on the whole course (glyph widths change, so spacing changes).

**Three colour schemes**

| Scheme | Change | Keep |
|---|---|---|
| Light (default) | — | — |
| Dark | `--page` `--panel` darker, `--ink*` lighter, `--accent*` one step brighter, `--shadow-*` become deeper shadows or light edges | `--plate` stays light (a figure or illustration is "a thing"); illustrations and photos are never inverted |
| Sepia ("Easy on the eyes") | `--page` `--panel` warm beige, `--ink` warm dark brown, main colours less saturated | Same as above |

Switched under "Display" in the top bar, saved under key `vl-scheme` (no course prefix, shared across courses and both languages); `kit/vl-head.js` writes `html[data-scheme]` before first paint. First visit defaults to light (the kit currently doesn't follow `prefers-color-scheme`). All three schemes must pass the contrast check.

## 2. Components a skin must give a look

Each function gets its own look in each skin. `skins/<name>/gallery.html` lays out every item below and is the approval page (`skins/notebook/gallery.html` already shows every component in kit/vl.js; for a new skin, copy it and change only the skin paths; add `?scheme=dark|sepia` to the URL to screenshot all three schemes). The interactive components, the optional modules and the 12 diagrams have demos in `kit/demo-interact.html`, `kit/modules/demo-modules.html` and `kit/demo-diagrams.html`; check against them too when building a new skin. Of these, only fieldbook's gallery lays out K9 document props; none of the four galleries yet shows K5 stance cards, G10 grid picker or G11 live plot — add them when building the next skin. T7 legend shapes are not in the kit yet.

| Class | Components (numbers from `components.md`) |
|---|---|
| Shell | N1 top bar (with colour scheme and three-level motion switch), N2 chapter opening (with illustration slot), N3 section numbers and subheadings, N4 floating contents button + progress bar, N5 pager |
| Physical objects (heaviest) | G1 interaction board + control family (primary / secondary / disabled buttons + pressed state, chips in four states `.on/.right/.wrong/.miss`, slider, segmented switch), concept diagram frame |
| Physical objects (medium) | M3 "Try it" (not done / done), T4 photo frame `.vl-fig.photo`, K9 document props in at least 3 `data-kind`s, K1 concept card (with picture slot) |
| Light blocks | K3 "Why it works" box, K5 stance cards, K6 wrap-up blocks, K8 margin notes, K10 invention-story box and P4 side-path summaries, E1 carousel tabs + counterexample marker |
| Figures | T3 text and lines in figures (concept diagrams may wobble, data charts straight), data-chart colours, T7 legend shapes, `--q*` encoding sample |
| Practice | P1 quiz (one question, three-state dots, all-correct badge), P3 notes box |
| Contents page | One way of drawing the learning map (board game, tower, route map, town…); the starting point is the part-grouped chapter cards in `starter/index.html` |
| Reward look (if the skin will support it) | One column of the look table in `modules.md` section 1 |
| Focus | `:focus-visible` for every kind of interactive element |

The hierarchy must be visible: interaction boards and concept diagrams are heaviest (thick outline, backing layer, shadow); concept cards, photos and document props are "things", solid but one step lighter; "Why it works" boxes, stance cards and side paths are light blocks (a vertical rule, a small tag, no shadow); long text has no frame at all.

## 3. Illustration style

The illustration loader and the stick-figure drawing kit live in `kit/illus.js` (`VL.illus.kit`) with a skin-independent interface; the skin only supplies colours (`VL_SKIN.palette` in `skin.js`) and the line filter (`--il-filter`). A skin with a completely different way of drawing (paper cut-outs, pixels, offline rendering) delivers its own drawing kit, **with the interface below** (`kit/README.md` "插画位" / illustration slots is the reference for parameters):

| Function | Requirement |
|---|---|
| `kit.person(x, y, opts)` | One way of drawing people for the whole course; tell people apart by hair, hats, accessories and clothes (`opts.hat/hair/glasses/beard/tie/cape/shirt`); within one picture outfits change automatically in order of appearance (`outfit:false` turns it off); `opts.legs:'sit'` adds a chair automatically (`chair:false` turns it off); with `opts.arms:'hold'`, `kit.holding(x, y, opts, item)` draws the object between the two hands (`kit.hands()` gives both hand positions); `opts.look:-1` faces left with arms and legs mirrored automatically, text stays in the text layer unflipped; feet at `kit.feetY()` land on `ground`; wrap each person in `<g class="px-person">` (`tools/illus-overlap.mjs` finds people by it) |
| `kit.ground(y)` | A ground line or block that people and objects stand on |
| `kit.item(name, x, y)` | Library of common objects (the kit has book box cup phone die star coin); use `item` for something on a table, `holding` for something in hand |
| `kit.bubble(x, y, w, h, [tipX, tipY])` + `kit.T(x, y, size, text, anchor)` | The bubble's tip points at the speaker; text goes in the 4th argument of `VL.illus.add` (the text layer, outside the filter group); text is short (≤12 Chinese characters, roughly 2–4 English words); never over a person |
| `kit.arrow(x1, y1, x2, y2)` | The tip lands exactly on the end point |
| Chairs / desks | Against floating: the kit's sitting pose brings its own chair, `arms:'desk'` is a hunched-over-a-desk pose; the kit has no stand-alone `chair / desk` objects yet |

- Default canvas viewBox 200×140 (for a vertical canvas use the `{vb}` option of `add()`, see "插画位" / illustration slots in `kit/README.md`); people at scale ≥0.9 — don't draw them too small.
- Text outside the filter group; filters use `in="SourceGraphic"`.
- Building rules into the functions is cheaper than fixing pictures one by one (GD experience: sitting automatically adds a chair; facing left mirrors the arms automatically).
- Deliver with: a character sheet (6 different people standing, sitting, holding something, pointing at something, talking) + an object sheet; `tools/illus-overlap.mjs` passing; every picture looked at by a person in single-picture screenshots with `tools/shot.mjs`.
- **How it plugs into the kit**: use the hook in `kit/illus.js`: `window.VL_SKIN.illus = function (base) { return { kit, svg, afterMount }; }` (`base = {kit, C, esc}`; all three are optional: `kit` replaces or adds drawing functions, and also give `reset` if you count outfits yourself; `svg(it, name)` builds the outer `<svg>` yourself; `afterMount(el, name)` runs after an illustration is placed, e.g. for a pencil redraw). See the "皮肤换画法的钩子" (skin drawing hook) comment in that file. `skin.js` must load before `kit/illus.js` (the starter templates already do). paper, pixel and fieldbook all use this hook; copy one of them for a new skin. A skin's `person` need not wrap itself in `g.px-person`; the kit adds it.
- Feet are not at the same height in every skin: check a standing person with `k.feetY(x, y, opts)`, or work out the head's y as `y = groundY − k.feetY(x, 0, opts)`; don't hard-code a number (the y values in the starter examples follow notebook's geometry).
- One drawing style per page: if a skin's drawing kit isn't finished, don't open chapters in that skin (bad: AI W4 chapter illustrations still use the pixel library).
- Pitfalls from the three courses are in `visuals.md` section 3.

## 4. Skin-specific motion

A skin may bring atmosphere motion and the "feel" of feedback motion, but both obey the levels (`vl-fx-full / -lite / -off`, see `interaction.md`):

| Must | Detail |
|---|---|
| Off level is completely still | Ambient animation cleared; intros and transitions skipped |
| Lite level | Ambient animation still; intro shortened |
| Pause outside the viewport | Header ambient animation stops when it leaves the viewport (good: DS `ambient`) |
| Intros / transitions skippable by clicking | Played at most once per chapter per session |
| Only outside the text | No constant animation in the text area |
| Freezable for screenshots | Supports `?freeze=seconds` |

## 5. Approval: sample → user approval → library

1. **Choose a direction**: talk through the feel the user wants, propose 2–4 reference directions with reasons, the user picks one. Don't recommend directions the user has already rejected: sci-fi hologram, vector wireframe, arcade pixel, Chinese ink wash, engineering blueprint, minimal line-route map, Monument Valley pastel, 1-bit print, toy-block town, yarn and fabric.
2. **Build the sample**:
   - variables (three schemes), `skin.css`, `skin.js` (`VL_SKIN`: web fonts, filters, illustration colours), a drawing kit if the drawing style differs (section 3), font subsets;
   - `gallery.html`: everything in the section 2 list laid out;
   - one sample chapter with real content (not placeholder text), using at least one signature interaction, one concept diagram, one example carousel and one real image; model it on the three chapters in `../course-kit/examples/` (shipped with the Chinese edition: `paper-survivorship`, `pixel-binary-search`, `fieldbook-gift`).
3. **Self-check**:
   - `node tools/qa.mjs <absolute path>`: no errors, no horizontal overflow;
   - `node tools/shot.mjs`: full pages at 420 and 1100 wide × three schemes (add `?scheme=dark` / `?scheme=sepia` after the html path), then every illustration as a single element, enlarged;
   - contrast measured with a tool (never estimated): body text, secondary text, captions, text in figures, selected buttons, `--q*`;
   - no atmosphere animation with reduced motion; print styles fully expanded, no dark backgrounds;
   - opens correctly by double-clicking under `file://` (bad: an AI W8 sample's `mask-image` pointing at a local image vanished entirely under file://; fixed with `-webkit-mask-box-image`).
4. **Send to the user for approval**: screenshots + one-line explanation + a list of open questions (concrete ones like "Is the misregistration too busy?", "Is a 16px bitmap font acceptable?"). Make the user's changes on the sample and show it again; don't roll it out directly.
5. **Into the library**: once approved, put it in `skins/<name>/`, with a `README.md` covering: what courses / readers it suits, a parameter summary (colours, fonts, surface, outlines, illustration style, per-part variation), its own motion, known issues, the date the user approved it and the gist of what they said. Later feedback on the skin is edited into the relevant entry of that README.

## 6. Current skins

| Name | Status | From | Suits | Colours | Fonts | Surface and outlines | Illustration style | Per-part variation | Own motion |
|---|---|---|---|---|---|---|---|---|---|
| `notebook` hand-drawn notebook | **In the library** (approval page `skins/notebook/gallery.html`) | GD | Design, thinking, humanities; adults and high-school students | ink #2b2b3a, paper #fdf8ec; fills yellow / pink / blue / green / orange / purple | Body LXGW WenKai 18px; h1 Ma Shan Zheng; subheadings, buttons and figure text LXGW WenKai + Patrick Hand (letters and digits, `unicode-range`) | Grid / dot / ruled / diagonal paper rotating per chapter; 3px ink lines, hard unblurred shadows, asymmetric corners | Stick figures `VL.illus.kit.person` (kit/illus.js) + wobble filter + flat colour fills; people change hats and hair automatically | 5 part colours + ±18° hue shift between chapters + rotating paper texture | Basically none (wobble and tilt are static) |
| `paper` paper cut-out | **In the library** (approval page `skins/paper/gallery.html`) | DS (tower scene) + AI W3 (stage scene) | Courses with a story and characters; middle to high school | ink #1f2638, muted #4d566c; card #fbf6ea, kraft #dcc9a2 / #d9c49c; gold #ffd25e | Body LXGW WenKai 17.5px (small text Medium); labels ZCOOL KuaiLe | White trimmed edge 3–6px + soft shadow + fibre texture + kraft backing layer | Cut paper `paperKit` + `cut()` three-level shadows; paper-puppet people; data charts with straight edges | Tower: 4 segment colours + sky band + tower wall; stage: per-chapter colour + curtain | Header ambient animation, climbing transition / curtain intro, paper page turns, scroll reveal |
| `pixel` handheld pixel | **In the library** (approval page `skins/pixel/gallery.html`) | AI W1 | Computing and gamified courses, early parts | Four greens #0f380f #306230 #8bac0f #9bbc0f; LCD #eef3d4; magenta A button #9b2257 | h1 Fusion Pixel 12px; digits VT323; body system sans / LXGW WenKai | Handheld console body; 4px notched pixel frames + bevels + whole-pixel shadows | 2px-grid pixel art (`skin.js` drawing kit); pixel people don't wear glasses | 5 part colours (`--p{n}a/b/s`) + ±18° hue shift between chapters + rotating LCD dot pattern | `steps(n)` easing, scan lines, level intro READY! |
| `fieldbook` field notebook | **In the library** (approval page `skins/fieldbook/gallery.html`) | Anthropology course | Humanities, social science, history, fieldwork; high school to adult | Ink / red pen / six coloured pencils; warm white loose-leaf | Body LXGW WenKai; titles Source Han Serif; handwriting Caveat | Kraft-paper desk + grid loose-leaf, binder holes, red margin line, tape; paper pieces with 1px edge and light shadow | Coloured-pencil stick figures (`skin.js` drawing kit + Rough.js hatching, filter fallback without it) | 6 part colours + part index tabs on the right + rotating paper texture | Pencil redraw when an illustration enters the viewport |
| `pixel-fc` NES-style pixel | Unfinished, not shipped | AI W2 | Same as above | Sky #5c94fc, bonus block #f8b800, brick red / green | Same as above | Brick ground and green hills (overworld / underground / night / castle); light dialogue boxes + black notched frames | Same as above | Level changes per chapter | Distant mountains scrolling, bonus block bumps up when pressed |
| `town` miniature town | Unfinished, not shipped | AI W4 | Courses about "how a whole machine works" | Walnut; cream plaster #fbf5ea; accent #f2c98a / #a8452f | Body LXGW WenKai; titles Xiaolai | Wooden desk grain + warm desk-lamp light + vignette; plaster boards, radius 22, bright top edge and thick bottom | three.js offline-rendered PNG (the chapter illustration library isn't built; must be added before extraction) | Per-chapter colour; buildings go up as you progress | Town focus-in intro, current building's warm light breathing, flags waving |

**Unfinished — must not be used for new courses** (they live in the AI course and are not shipped with the skill):

| Name | Look | Open question |
|---|---|---|
| W5 screen print | Flat dusk colour bands, ink grain, misregistration; Smiley Sans | Is the misregistration too busy? |
| W6 desktop | Cyan halftone desktop, grey bevelled window frames; Unifont 16px bitmap | Is a 16px bitmap font acceptable? |
| W7 cartoon | Sunny sea, thick outlines with offset hard shadows; Chill Round Gothic | Does the whole style need a big rework? |
| W8 gouache | Gouache distant landscape, thick paper with shaky edges; Ma Shan Zheng + LXGW Marker Gothic | Should chapters 36 and 37 switch to grey? Degrades to straight edges in Firefox |

When extracting the remaining styles: take the styles and drawing kit from the source course and strip out the course-specific things (DS's hero, floor guardians and backpack; AI's Little Bit, WORLD numbering and coins) — these belong to the companion and rewards modules, not the skin. Keep "scenes" such as the tower, stage, levels and town in the skin, as the way to draw the contents page and chapter headers. Replace colours hard-coded in pages (DS `#3b8fd6`, the undefined `--pp-edge`, the two shadow colours brown and blue), then go through the approval steps in section 5.
