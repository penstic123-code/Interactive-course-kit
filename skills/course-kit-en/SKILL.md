---
name: course-kit-en
description: Visual and component toolkit for interactive learning web courses. It has a skin-independent component library organised by job (concept cards, "why it works" boxes, diagram templates, example carousels, "Try it" tasks, collapsible side paths, a hands-on task engine and more), approved visual skins (hand-drawn notebook and others), rules for pictures, interactions, motion and reading rewards, and guidance on pacing a chapter. Use it first whenever you make, revise or review the layout, visuals, diagrams, interactions, motion or visual style of an interactive web course or explainer page (course chapters, interactive tutorials, long-form science pages). Also use it when starting a new course and choosing a skin, building the shared skeleton, making a sample chapter, briefing chapter-writing agents, or running the checks. For prose style use en-teaching-prose for English (zh-teaching-prose for Chinese); content rules live in references/content-rules.md.
---

# Interactive course toolkit (course-kit-en)

These rules come from three finished courses: a game design course (hand-drawn notebook skin), a data science course (paper-cutout tower-climb skin) and an AI course (a different retro medium for each "world"). The user approved each rule. The goal: an ordinary reader finds the page **comfortable, understandable and fun**, the look is coherent, and nothing feels stitched together by an AI.

Who owns what: how content is taught (the five layers, acceptance numbers) lives in `references/content-rules.md` (copy it into your project as `CLAUDE.md` if you like); how sentences are written lives in en-teaching-prose for English prose (zh-teaching-prose for Chinese); **visuals, components, layout, interaction and motion** live here.

Length limits: the Chinese original counts characters. This edition converts them at 1 English word = 1.5 characters, the same rate `tools/check.mjs` uses (e.g. 300 characters = 200 words).

## What to read first

| Task | Read |
|---|---|
| Decide how content is taught, acceptance criteria | `references/content-rules.md` |
| Lay out a chapter, choose components | This file + `references/components.md` |
| Draw concept diagrams | `references/diagrams.md` |
| Find pictures, draw illustrations | `references/visuals.md` |
| Build interactions, add motion | `references/interaction.md` |
| Add reading rewards, a companion character, a concept map, etc. | `references/modules.md` |
| Choose a skin, make a new skin | `references/skin-contract.md` + `skins/<name>/README.md` |
| Build a new course skeleton | `starter/README.md`: one command, `node starter/new-course.mjs <absolute course folder path> notebook`; API in `kit/README.md` |
| Check your work | Section 7 + `tools/check.mjs` |

## 1. Pacing a chapter

**One topic, told unhurriedly.** Start from a situation the reader knows and unfold it layer by layer, each paragraph picking up the question the last one left. Keep the difficulty moderate: stop when the reader "gets it"; derivations, maths and research detail go into drawers that start collapsed.

**Choose the visual by what the passage is doing**, not by how important the component is:

| What the passage is doing | Use |
|---|---|
| Setting a scene, sparking interest | Scene illustration, comic panels |
| Telling history, real people and events | Real photos, document props, illustrated timeline |
| Explaining a structure or mechanism (loop, hierarchy, cause and effect, comparison, classification) | **Concept diagram** (templates in `diagrams.md`) |
| Showing "what happens if you change one thing" | Live chart, signature interaction |
| Giving examples and counterexamples | Illustrated example carousel |
| Naming the concept | Concept card (with a small picture) |

Do you need a diagram? Ask whether the passage has a *structure*. If yes, draw a diagram; if not, use an illustration or photo.

**Readers should always know which concept is being taught.** Every core concept is made visible three ways, with the same name in all three:
1. The section heading names the concept (✓ "The core loop behind one last game at 1 a.m.", ✗ "One last game at 1 a.m.").
2. Where the concept is first named in the text, wrap it in the naming mark `<span class="vl-cn">core loop</span>` (a highlighter in the notebook skin). The highlighter is reserved for this; don't use it for general emphasis.
3. A concept card with a picture (K1) follows right after.
Secondary concepts get only the naming mark, no card. For the one sentence in a paragraph the reader must remember, use the emphasis mark `.vl-em`, at most two per paragraph. `tools/check.mjs` reports any concept card whose name has no matching naming mark or heading.

**Pacing rules**
1. A visual every 1–2 paragraphs. **Boxes count as body text**: a "why it works" box, concept card or story box with more than 2 paragraphs needs a picture, or must be split into "picture + short text".
2. Open and close each section with something warm (illustration, photo, example); diagrams go in the middle.
3. Never put two static diagrams back to back; separate them with an illustration, example or interaction. A diagram you can click or drag counts as half an interaction.
4. Rough mix per chapter: about a third diagrams, about half illustrations, photos and examples, the rest interactions. Adjust per course (maths-heavy courses get more diagrams, history-heavy courses more photos).
5. Secondary content starts collapsed: invention story boxes, full timelines, going-further material, derivations, extra cases. Show only a **concrete, question-style** hook title + one line of introduction + an expand button. The hook says what is inside (✓ "1898: a cat shut in a box, and how the law of reward was found"), not what experience the reader will have (✗ "Ready to travel back in time and start a new adventure?").
6. Repeated elements scroll sideways: examples, exercises, timeline cards, one at a time.
7. Each picture appears only once in the whole course; the same example is not told three times in the opener, the concept card and the example card.

**Layouts mix freely.** The only fixed parts are the five content layers (a writing self-check; section headings carry no layer labels) and the navigation. Everything else is picked from the component library to fit the content; chapters need not look alike.

## 2. Visual baseline

- **Only approved skins** (`skins/`); don't let the AI improvise a style. Default to `notebook` (hand-drawn notebook). A new skin gets one sample chapter for the user to approve before it joins the library.
- **A quiet ground**: long text sits directly on the ground (paper, wall, page), never on a card floating over a flat colour. Only *things* get physical presence (pictures, interaction boards, concept cards, document props), with shadows cast in one direction.
- **Heavy borders only for the stars**: signature interactions and concept diagrams get thick strokes; everything else gets thin lines or none. No emoji as icons, no gradient text, no glow shadows.
- **One theme colour per chapter**; chapters in the same part vary slightly in main colour, texture and header decoration, while fonts and component shapes stay the same.
- **Fonts**: decorative fonts (calligraphy, chalk, etc.) only for large titles; a handwriting font verified as legible (with a clear font for letters and digits via `unicode-range`) may be used for subheadings, text inside figures and buttons; body text uses a clear font.
- **Contrast** ≥4.5:1, including captions, text inside figures and selected buttons.
- **Text beside pictures**: on wide screens one column of text and one of picture, top-aligned, no text wrapping around, no vertical centring; stacked on narrow screens.
- Readers can switch **colour scheme** (light, dark, easy-on-the-eyes); the **skin** is fixed when the course starts, because illustrations are drawn in the skin's style.

## 3. Interaction baseline

- Before an interaction, one sentence says what question it answers; the "Try it" task says what to do and gives feedback when done.
- Few controls: the reader knows how to play within 3 seconds; ideally predict first, then see the result; undo and restart are always possible.
- Hard modes go into the advanced drawer. Multiple choice only appears in the exercises.
- Works with the keyboard; touch targets are big enough.
- Details in `interaction.md`.

## 4. Motion baseline

Four kinds by purpose, each with its own rules (details in `interaction.md`):

| Purpose | Rule |
|---|---|
| Aids understanding | With motion off, the final state is still shown; no information is lost |
| Feedback on an action | 150–300ms; under reduced motion keep only the colour change |
| Reading reward | Fires once, only after the reader understood something; never interrupts reading |
| Atmosphere | Only outside the body text, light by default, one click to turn off |

Respect `prefers-reduced-motion` everywhere; the top bar has a three-way motion switch: Full / Light / Off.

## 5. Optional modules (decide one by one when starting a course; record the choices in the project doc)

- **Reading rewards**: the mechanism is shared, the look follows the skin (notebook → stamp album, field guide, stamps; paper tower → backpack, lit windows). Reward only "understood it" (a correct answer, a finished "Try it"), never scrolling to the bottom or time on page.
- **Companion character**: off by default. Add only if the course has a story world or young readers; speaks only when clicked, lines relate to what is being read, can be turned off, can be triggered by keyboard, ordinary tone.
- **Concept map**: add when there are many interlinked concepts; it shares one concept dataset with the concept cards and the field guide.
- Sound, glossary, flashcards, learning paths and more: see `modules.md`.

## 6. Starting a new course

1. Agree topic, readers and parts/chapters with the user (content per `references/content-rules.md`).
2. Recommend 1–2 skins from `skins/`; the user picks; choose optional modules.
3. Generate the skeleton with `starter/new-course.mjs` (kit, skin, config, contents page, chapter 1 template, project doc template); edit the chapter table and module switches in `js/course.js`.
4. Make one sample chapter for the user to approve the writing, layout and pacing, then roll out.
5. Run the checks (section 7) before delivering each chapter; never rely on the report alone.

## 7. Checks (catching errors you can't see while writing)

The code is written blind: real font widths, screen widths and whether class names match across files are only known once the page is open. So the checks must run after writing, and an agent may not skip them. If the user explicitly says "don't test yet", skip them, but list what was not tested in the delivery report.

**One-command check** (the tools are in this skill's `tools/`; always pass absolute paths):

```
node <skill>/tools/check.mjs <absolute course folder path> [ch02,ch03] [--fast]
```

| Step | Checks | Catches |
|---|---|---|
| 1 Syntax | `node --check` on every .js; trial-compiles every inline script | Whole-page script not running |
| 2 Wiring | Every `vl-` class the JS looks for actually exists in the page or scripts; every class the page uses has a style | Renames not synced, dead buttons, styles not applying |
| 3 Picture density | More than about 300 characters between two visuals (boxes count; English converted by word count) | Long text with no pictures |
| 4 Links | Local href / src exist | Wrong image or script paths |
| 5 Run | `qa.mjs`: clicks every button and drags every slider at 420 and 1100 widths | JS errors, horizontal overflow, text in figures touching lines, overflowing or overlapping |
| 6 Screenshots | Full-page shots of every page at 420 and 1100 | Prints paths; **you must open them with Read and look** |

`--fast` runs steps 1–4 only (seconds, no browser), good while writing; run the full version before delivery.

**Must be checked by eye** (look at each screenshot): text in diagrams touching lines; illustrated people following the rules (feet on the ground, hands holding objects, nothing floating; `tools/illus-overlap.mjs` helps); colour contrast; whether each section's pacing follows section 1. Capture a single figure with `tools/shot.mjs <html> <png> "selector@index" 1100` and zoom in.

**The delivery report must state**: which steps ran, the results (paste the ✗ lines), which screenshots were viewed, and what was not tested. "Syntax passes" is not "tested".

**Flow**: write → `--fast` until 0 → full run until 0 → look at screenshots → fix → run again → deliver. When an agent delivers, the lead agent runs the full check again and looks at the screenshots itself.

## 8. Learning from feedback

Turn each piece of user feedback on visuals, components or interaction into a rule and improve the existing entry in the relevant file; add a new skin to `skins/` once it is approved.

**Two editions**: the Chinese skill at `../course-kit/` is the source of truth for the shared code (kit, skins, tools, starter). Change code there, then run `node tools/sync-en.mjs` from the Chinese skill to copy it here. When a rule changes (SKILL.md, references/), make the matching change in both editions.
