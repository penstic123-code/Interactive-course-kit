# Optional modules

Purpose: the modules to decide on, one by one, when starting a course — when each is worth adding, how to build it, and its pitfalls. Record the decisions in the course's project doc. The overall principles are in `SKILL.md` section 5; the "optional features" table in section 3 of `references/content-rules.md` covers the content side, this file covers the build. **`kit/README.md` is the API reference** (section 8, 可选模块 / optional modules); module code is in `kit/modules/`, data fields in `kit/modules/concepts-schema.md`, demo in `kit/modules/demo-modules.html`. Switches go in `VL_COURSE.modules` in the course's `js/course.js` (the starter template has them; see `kit/README.md` section 8 for every key).

| Module | Default | In one line |
|---|---|---|
| Reading rewards | off | Understand something, collect something; the look follows the skin |
| Companion character | off | A character who talks — only when clicked |
| Concept map | on when there are many concepts | How every concept connects; shares one data set with concept cards and the album |
| Term hover / glossary / flashcards | on when there are many terms | One term data set used in three places |
| Sound | off | Short sound effects, muted by default |
| Learning paths | on when readers start from very different places | A few routes; pick one and the rest dim |
| Town-style contents page | only for skins with offline-rendered art | One map = whole-course progress + this chapter's contents |
| Timeline of events | on when history carries a lot of weight | Every invention story in the course, in year order |
| Reader colour schemes | required (dark on hold) | Light / dark / easy on the eyes; part of the skin contract; dark and easy-on-the-eyes not fully approved yet |

---

## 1. Reading rewards

**Worth adding when**: readers are young, the course is long, readers need a little pull to keep going; it fits most naturally with skins that have a world (tower climbing, levels). Serious adult courses can skip it.

**Reward only "understood"**:

| Trigger (evidence of understanding) | Storage key |
|---|---|
| "Try it" completed (checked by JS) | `<course id>-try` (kit) |
| Chapter quiz all correct | `<course id>-progress` (kit); chapter stamps are read from `VL.Progress`, collected concepts stored in `<id>-cards`, celebrations already shown in `<id>-col-seen` (see `kit/README.md` section 8) |
| Each correct round / clearing the end-of-part review | `vl:review-round` / `vl:review-done` events; stored in `<id>-review` (see `kit/README.md` section 7, P2) |
| 3 quiz answers right in a row (optional small celebration, not stored) | — |

**Never do**: triggers by scroll percentage (bad: DS marked a chapter "read" at 92% and fired confetti + lit the top of the tower at 98.5%), triggers by time spent (bad: DS flew a paper plane into the backpack after 1.5s on a concept card), score leaderboards, health bars, failure endings, daily streaks.

**Shared core × skin look**

| Core | What it does | Notebook | Paper (tower / stage) | Pixel (GB / FC) | Town |
|---|---|---|---|---|---|
| Unit badge | One object per chapter representing its concept; click to review the definition | A stamp, stuck into the stamp album | A prop into the backpack / the stage prop box | Cartridge, trophy | A new building in town |
| Sub-concept cards | One per sub-concept; a celebration when a set is complete | A cell on an album page | A small object in the collection book | Coins, inventory slots | A piece of furniture in the building |
| Progress lights | Chapters understood light up on the course map | Contents page stamped | Tower window lit / playbill ticked | ★ + chapter block turns green | Scaffolding becomes a finished building |
| Task tick | "Try it" completed | Sticky note ticked | White tick on a note + paper confetti | CLEAR! | Clay bead turns green |
| Silhouette for not yet earned | Unearned items shown as silhouettes + "understand chapter N to get this" | Empty stamp frame | Grey silhouette + "?" | Question-mark block | Empty foundations |
| Next-step pointer | Points to the first chapter not yet understood | Bookmark | Little flag "keep climbing" | Flashing level entrance | Signpost |
| Completion ceremony | Once, when a chapter is understood | Stamp: "Got it" | Floor guardian shatters / curtain call | STAGE CLEAR + fireworks | Flag goes up |

**How**
- Components only fire events (in the kit now: `vl:try {id, el, first}`, `vl:quiz-perfect {ch, firstTry, n}`, `vl:answer {i, firstTry}`; the end-of-part review's events are `vl:review-round {id, i, n, claim, revealed, last}` and `vl:review-done {id, first, revealed}`, see `kit/README.md` section 7). The rewards module (`kit/modules/collect.js`, `VL.collect`) subscribes, records, plays the look, and rewards only when `first` is true. No reward logic inside components.
- Badge data shares one concept data set with the concept map and concept cards (section 3); a badge's definition is the concept card's "In plain words" line.
- The collection is a dialog: Tab moves through cells, ←→ turns pages, Esc closes; each item expands to its definition (`aria-expanded`).
- Motion is the "reading rewards" kind: ≤1.2s each; nothing plays at the off level, but it is still recorded.

**Pitfalls**
- The reward look stealing the text: a celebration layer covering the text for more than 1.2s, or confetti for every small action. Play it once, when something is understood.
- Mixing "read" and "understood": the top-bar progress and the lights on the contents page are decided only by quiz all correct (GD and AI already work this way; DS needs changing).
- Badges drawn as decoration unrelated to the concept: every object should bring its concept to mind (DS's backpack has 16 props, each tied to one chapter's concept).

## 2. Companion character

**Worth adding when**: the skin has a world (the tower's hero, the AI course's Little Bit) or readers are young. Off by default. Existing courses keep theirs: AI's Little Bit is the thread running through the whole course; the user loves the DS hero ("clicking the hero to make it talk makes the page more fun").

**Two forms**
1. Dialogue in the text: lines written by the author, static, appearing with the prose (AI `.npc`, 56 places).
2. A clickable character that talks: pinned to the page margin or the progress bar (DS hero).

**Rules**

| Rule | How |
|---|---|
| Talks when clicked | Speaks unprompted only at a few key moments ("Try it" done, review cleared), ≤3 times per chapter |
| Lines follow the content | Each section has 1–3 lines in `data-lines` (English in `data-lines-en`); the current section's are used; a section with none stays quiet ("…") — never pad with generic lines |
| Can be switched off | Toggle in the top bar's "Display" pop-up, next to motion and sound, saved (`<id>-companion`) |
| Keyboard-triggerable | The character is a `button` with an accessible name ("Hero — click to hear what it says"); Enter / Space triggers; the bubble is `aria-live=polite` |
| Ordinary tone | Like a friend reading alongside: appears with a question, a mistake, a discovery, a feeling. Not cutesy, not mystical, never reads out the definition or gives away the answer |
| Never blocks the text | Bubble `pointer-events:none`, doesn't cover the text, closes on scroll, disappears after about 2.6s |
| When it's the course's thread | Write the character's growth into the project doc (content-rules.md 1B ②) |

Example lines (same section, "selection bias"): ✓ "Oh — I only cast the net near the bank. No wonder it's all yellow fish." ✗ "Brave one, the fog of data surrounds us!" ✗ "Selection bias is when a sample is filtered before it is collected." (reading out the definition)

**Gaps in today's DS hero**

| Gap | Now | Should be |
|---|---|---|
| Lines unrelated to content | 8 generic lines in rotation; `data-hero-lines` used in 0 chapters | `data-lines` per section |
| No keyboard trigger | Character is `aria-hidden` and can't take focus | `button` + accessible name |
| No off switch | Only follows the motion level | Its own toggle in the top bar |
| Walks along the stairs | Follows scrolling (a position display; can stay) | Must never trigger any reward because of it |

## 3. Concept map

**Worth adding when**: there are many concepts (>40), tangled together, with prerequisites. GD (110 concepts) and AI both have a `map.html`.

**One concept data set, three uses**:

```js
// Illustrative. The current form: the course's js/concepts.js sets window.VL_CONCEPTS = {items, links, terms},
// which kit/modules/vl-concepts.js reads into VL.concepts; fields in kit/modules/concepts-schema.md
VL.concepts = [
  { id:'core-loop', ch:2, zh:'核心循环', en:'Core loop',
    def:'The set of actions a player repeats over and over…',   // = concept card "In plain words" = badge definition
    illus:'cc-core-loop',                                        // = concept card picture = small picture in the album
    links:[{to:'flow', type:'explains'}, {to:'feedback', type:'prereq'}] }
];
```

| Used in | Fields |
|---|---|
| Concept card K1 | zh, en, def, illus (card HTML can be generated from the data, so the two never disagree) |
| Concept map `map.html` | all; edge types: prerequisite, explains, applies, contrast (`prereq / explains / applies / contrast`) |
| End-of-chapter "Related chapters" N5 | chapters derived from links |
| Album / backpack (rewards) | zh, def, illus |
| Glossary | can merge into the term data |

**How**: node = concept name + chapter number; clicking a node lights its neighbours and shows its def and "go to chapter N" beside it; colour by part with a text legend; world-view principles are registered as nodes too (content-rules.md 1D). The kit's `kit/modules/graph.js` (`VL.mapPage`, `VL.graph`, `VL.miniMap`, `VL.graphList`) does all of this; `kit/modules/build-concepts.mjs` builds and checks `concepts.js` from the chapters.

**Pitfalls**
- Nodes not keyboard-operable (bad: GD `map.html` nodes have no tabindex): every node `tabindex=0`, Enter selects, arrow keys move between neighbours. (The kit's graph uses roving focus: one node in the Tab order, arrows move to the nearest node.)
- Sideways scrolling on phones (bad: GD `#gsvg{min-width:900px}`): on narrow screens switch to a list grouped by part, opening each to show its neighbours.
- Force-directed layout turning into a hairball: with >60 nodes lay out in zones by part, don't rely on automatic layout alone.
- Concepts from chapters not yet open stay out of the map, or appear grey and unclickable.

## 4. Term hover, glossary, flashcards

**Worth adding when**: there are many terms and readers start from zero — add all three together; one data set used three ways.

| Piece | How | Pitfall |
|---|---|---|
| Hover definition | `.vl-term[data-def]` in the text (`components.md` K7); the JS definition box is clamped inside the viewport | Pure CSS `::after` runs off the screen at the edges (old GD / AI) |
| Glossary `glossary.html` | `kit/modules/build-concepts.mjs --write` collects every chapter's `.vl-term[data-def]` into the `terms` of `js/concepts.js`, and `VL.glossary` (`kit/modules/terms.js`) reads it; sorted by pinyin / alphabet; each entry links back to its chapter | The same term defined differently in different places: the script reports ✗; the first occurrence wins |
| Flashcards `flashcards.html` | Leitner, 4 boxes: right moves up a box, wrong goes back to box one; only terms from chapters already understood (`VL.flashcards`) | Can't flip by keyboard (old GD): Space flips, ←→ judge right/wrong; remove emoji (old AI still has them) |

The English edition needs English fields for all three; storage keys are shared by both languages.

## 5. Sound

**Worth adding when**: gamified skins (pixel, tower), young readers. Off by default; if added, **muted by default**.

**How**
- One speaker toggle in the top bar, saved (`<course id>-sound`); short WebAudio-synthesised sounds, no external audio files. Code in `kit/modules/sound.js`; with `modules.sound:false` the whole module is absent (see `kit/README.md` section 8).
- The timbre belongs to the skin: the skin's CSS sets `:root{--vl-snd:paper|sine|square|triangle}`; pixel = square-wave 8-bit; paper = short sine tones; notebook = paper (pencil and paper sounds; the notebook skin sets this in `skins/notebook/modules.css`).
- Sound used for teaching (GD `ch12` listening bench) is part of the interaction itself; also muted by default and switchable.

**Pitfalls**: GD `ch12`'s mute checkbox starts unticked, which means sound on by default — it must start ticked. Sounds on every scroll get annoying fast; tie sounds only to actions and understanding events.

## 6. Learning paths

**Worth adding when**: readers start from very different places, many chapters (>20).

**How**: 2–5 routes on the contents page (e.g. "One-week intro", "Full route", "Under-the-hood route"); each route = a name + one line on who it suits + a list of chapter numbers. Click one and the other chapters dim and the route's chapters are joined by a line. Route data goes in `VL_COURSE.paths` in the course's `js/course.js` (`{name, who, chs}`; vl.js doesn't read it, the contents page does; `starter/index.html` already does "click one, the rest dim"). Good examples: GD's 5 routes, DS's quick route, AI's floating bar.

**Pitfall**: a route that skips a prerequisite concept a later chapter needs — check every route for "every concept a chapter uses was taught earlier on the route".

## 7. Town-style contents page (and other "contents as map" pages)

**Worth adding when**: the skin itself is a map (town, tower, level route) and there is an offline rendering pipeline.

**How**: one map does three jobs — the course map, cumulative progress (chapters understood are "built"), and this chapter's contents (click a building to jump to its section). Good example: the AI course's W4 renders transparent PNGs offline with its own script (not shipped with the skill), so chapter pages don't run three.js.

**Pitfalls**
- When it replaces the N4 floating button, test narrow-screen behaviour separately (AI W4 untested).
- Keyboard: every building on the map is a `button`, reachable by Tab, with a text name.
- Chapter illustrations must use the same drawing style as the map (AI W4's chapter illustrations are still pixel art, clashing with the rendered town).

## 8. Timeline of events

**Worth adding when**: history carries a lot of weight and there are many invention stories.

**How**: every invention story in the course in year order, filterable by type; clicking an event jumps to the story box in its chapter (good example: the AI course's timeline page; the kit has no timeline module yet). Event data is collected from each chapter's K10 / T5, not written a second time.

**Pitfall**: years and names on the timeline must match the chapters — generate both from the same data.

## 9. Reader colour schemes

Not optional; part of the skin contract (`skin-contract.md`): every skin provides light / dark / easy-on-the-eyes schemes, switched under "Display" in the top bar and saved (key `vl-scheme`, shared across courses). **Dark is on hold**: the switch stays, but dark and easy-on-the-eyes are not fully approved, so start courses and check screenshots in Light. **The skin is fixed when the course starts; readers only change the colour scheme**, because illustrations are drawn in the skin's style and the drawing style can't be swapped at runtime.
