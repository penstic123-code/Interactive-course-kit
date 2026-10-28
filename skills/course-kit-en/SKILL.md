---
name: course-kit-en
description: Visual and component toolkit for interactive learning web courses. It has a skin-independent component library organised by job (concept cards, "why it works" boxes, diagram templates, example carousels, "Try it" tasks, collapsible side paths, a hands-on task engine and more), approved visual skins (hand-drawn notebook, paper cut-out, handheld pixel, field notebook, sticker collage), rules for pictures, interactions, motion and reading rewards, and a method for planning a chapter (write the outline first: question chain and difficulty budget; then pick elements by what each passage is doing). Use it first whenever you make, revise, review, plan or outline the layout, visuals, diagrams, interactions, motion or visual style of an interactive web course or explainer page (course chapters, interactive tutorials, long-form science pages). Also use it when starting a new course and choosing a skin, building the shared skeleton, making a sample chapter, briefing chapter-writing agents, or running the checks. For prose style use en-teaching-prose for English (zh-teaching-prose for Chinese); content rules live in references/content-rules.md.
---

# Interactive course toolkit (course-kit-en)

Purpose: planning, components, skins and checks for interactive learning web courses. These rules come from several finished interactive courses, approved round by round. The goal: an ordinary reader finds the page **comfortable, understandable and fun**, the look is coherent, and nothing feels stitched together by an AI.

**Get this straight first**: whether a chapter is easy to follow depends on whether the reader, at each point, knows what is being taught and why, and already has what is needed to understand it. Figures, interactions, boxes and cards are containers for answers, not a checklist to complete; every number in these files is a "default + why" that a course may change; what stays fixed is only the technical floor and three hard rules (facts accurate, terms taught before they are used, a story never stands in for a concept name). Of the check-script thresholds only the 500-character no-visual error line is hard; the rest are hints that a person judges. So the order is always: outline → prose → pick elements by what each passage is doing. How content is taught (principles, difficulty points, acceptance, workflow) lives in `references/content-rules.md` (copy it into your project if you like); how sentences are written lives in en-teaching-prose for English prose (zh-teaching-prose for Chinese); **visuals, components, layout, interaction, motion and checks** live here.

Length limits: the Chinese original counts characters. This edition converts them at 1 English word = 1.5 characters, the same rate `tools/check.mjs` uses (e.g. 360 characters ≈ 240 words).

## What to read first

| Task | Read |
|---|---|
| Plan a chapter, write an outline, brief reviewers | Section 1 of this file + `references/content-rules.md` sections 1, 1A, 4 and 8 |
| Decide how content is taught, acceptance criteria | `references/content-rules.md` |
| Lay out a chapter, choose components | This file + `references/components.md` |
| Draw concept diagrams | `references/diagrams.md` |
| Find pictures, draw illustrations | `references/visuals.md` |
| Build interactions, add motion | `references/interaction.md` |
| Add reading rewards, a companion character, a concept map, etc. | `references/modules.md` |
| Choose a skin, make a new skin | `references/skin-contract.md` + `skins/<name>/README.md` |
| Build a new course skeleton | `starter/README.md`: one command, `node starter/new-course.mjs <absolute course folder path> <skin>`; API in `kit/README.md` |
| Check your work | Section 7 + `tools/check.mjs` |

## 1. Planning a chapter: outline first, then pick elements

The rules come in three tiers: **principles** (required, flexible in how; in content-rules section 1), **optional practices** (picked by content; the table below and `components.md`) and the **technical floor** (accessibility, fonts and contrast, and the check script's error lines, which do not move).

1. **Write the chapter outline first** (template in content-rules section 4): driving question, reader's starting point, question chain, concepts with difficulty points (method in content-rules 1A), element table. Check it against the eight principles in content-rules section 1; if the difficulty total crosses the warning line and won't fit, consider splitting the chapter first, and if you don't split, write down why in the outline. The outline passes logic review before the prose is written, and the outlines of the sample chapter and of each part's first chapter also need the user's approval (flow in content-rules section 8).
2. **Write the prose to the outline.** One topic, told unhurriedly: start from a situation the reader knows and unfold it layer by layer, each section picking up what the last one left. Keep the difficulty moderate: stop when the reader "gets it", and put derivations, maths and research detail into drawers that start collapsed. Each new concept by default goes: trouble → the reader meets it first-hand → name → make it exact → edges (the floor is that the name never comes before the experience; names the reader already knows are exempt, see content-rules section 1, item 2).
3. **Once the prose is settled, choose the visual by what each passage is doing**, not by how important a component is. If the table has nothing for a passage, add no element:

| What the passage is doing | Use |
|---|---|
| Setting a scene, sparking interest | Scene illustration, comic panels |
| Telling history, real people and events | Real photos, document props, illustrated timeline |
| Explaining a structure or mechanism (loop, hierarchy, cause and effect, comparison, classification) | **Concept diagram** (templates in `diagrams.md`) |
| Showing "what happens if you change one thing" | Live chart, signature interaction |
| Giving examples and counterexamples | Illustrated example carousel |
| Naming the concept | Concept card (with a small picture) |

Do you need a diagram? Ask whether the passage has a *structure*. If yes, draw a diagram; if not, use an illustration or photo. Write an illustration's picture script from the sentence it sits next to before drawing; a diagram shows the mechanism and uses the numbers the prose just used (see `references/visuals.md` section 3, `references/diagrams.md` section 1).

4. **Readers should always know which concept is being taught** (an approved preference of the user; do it by default). Every core concept is made visible in four places, with the same name in all four:
   1. The section that mainly teaches the concept has a heading that names it (the heading only orients; the naming in the text comes after the reader has met the concept; how to write headings and how long: `en-teaching-prose`, "Chapter titles and headings" and "Preferences"; ✓ "The core loop behind one last game at 1 a.m.", ✗ "One last game at 1 a.m.").
   2. Where the concept is first named in the text, wrap it in the naming mark `<span class="vl-cn">core loop</span>` (the highlighter is reserved for this; usage in en-teaching-prose, "Preferences").
   3. A concept card with a picture (K1) follows right after.
   4. The end-of-chapter key points recap it once more.
   Secondary concepts get only the naming mark, no card. For the one sentence in a paragraph the reader must remember, use the emphasis mark `.vl-em`, at most per paragraph: see en-teaching-prose, "Preferences". `tools/check.mjs` reports any concept card whose name has no matching naming mark or heading.
5. **Pacing rules**
   1. No walls of text: a long stretch of words with no picture tires readers and loses their place. By default keep under about 360 characters between two visuals and about 220 per paragraph; `check.mjs` step 3 prints a hint past those and a person decides: a chain of causes that breaks if split mid-way can stay; more than 500 characters in a row with no visual is an error. Past the limit, first ask whether the paragraph packs in two new things; splitting it often suffices. Add a picture only if one is really missing, and let it show that passage's mechanism, not decorate. **Boxes count as body text**: see `components.md` section 0, item 2.
   2. Open and close each section with something warm (illustration, photo, example) and put diagrams in the middle (an aesthetic preference).
   3. By default don't put two static diagrams back to back (two similar figures in a row tire the reader); separate them with an illustration, example or interaction, except for two figures that form a deliberate pair. A diagram you can click or drag counts as half an interaction.
   4. Secondary content starts collapsed: invention story boxes, full timelines, going-further material, derivations, extra cases. Show only a **concrete, question-style** hook title + one line of introduction + an expand button. The hook says what is inside (✓ "1898: a cat shut in a box, and how the law of reward was found"), not what experience the reader will have (✗ "Ready to travel back in time and start a new adventure?").
   5. Repeated elements scroll sideways: examples, exercises, timeline cards, one at a time.
   6. Each picture appears only once in the whole course. A main example may run through a chapter and be referred back to, but the same description is not retold in the opener, the concept card and the carousel.

**Layouts mix freely.** The only fixed parts are the navigation and the chapter shell (header, learning goals, opening, key points, practice and so on; content-rules section 4). The five layers are a self-check after writing, not the order of sections; the sections in the middle and their elements are picked from the outline to fit the content, so chapters need not look alike.

## 2. Visual baseline

- **Courses use approved skins only** (`skins/`); never improvise a whole look inside a course page (small chapter-specific styles go inline in the page, see content-rules section 7). Which skin to use, and what to do for a new look, is in section 6.
- **A quiet ground**: long text sits directly on the ground (paper, wall, page), never on a card floating over a flat colour. Only *things* get physical presence (pictures, interaction boards, concept cards, document props), with shadows cast in one direction.
- **Heavy borders only for the stars** (levels: end of `skin-contract.md` section 2). No emoji as icons, no gradient text, no glow shadows.
- **One theme colour per chapter**; chapters in the same part vary slightly in main colour, texture and header decoration, while fonts and component shapes stay the same.
- **Fonts and contrast**: see `skin-contract.md` section 1 (the only place they are stated).
- **Text beside pictures**: see `components.md` T2.

## 3. Interaction baseline

- Before an interaction, one sentence says what question it answers; the "Try it" task says what to do and gives feedback when done; interaction titles and "Try it" goals use only new words the prose has already named.
- Few controls: the reader knows how to play within 3 seconds; at key points, predict first, then see the result; undo and restart are always possible.
- Hard modes go into the advanced drawer. Where multiple choice may appear: `interaction.md` section 2, rule 12.
- Works with the keyboard; touch targets are big enough.
- Details in `interaction.md`.

## 4. Motion baseline

Four kinds by purpose, each with its own rules (details in `interaction.md`):

| Purpose | Rule |
|---|---|
| Aids understanding | With motion off, the final state is still shown; no information is lost |
| Feedback on an action | Must feel instant; durations in `interaction.md` section 4, "Durations and easing"; under reduced motion keep only the colour change |
| Reading reward | See `modules.md` section 1 |
| Atmosphere | Only outside the body text, light by default, one click to turn off |

Respect `prefers-reduced-motion` everywhere; the top bar's "Display" pop-up offers Auto / Full / Light / Off (three levels plus automatic choice; details in `interaction.md` section 4).

## 5. Optional modules (decide one by one when starting a course; record the choices in the project doc)

- **Reading rewards**: the mechanism is shared, the look follows the skin (notebook → stamp album, field guide, stamps; paper tower → backpack, lit windows). Triggering rules: `modules.md` section 1.
- **Companion character**: off by default. Add only if the course has a story world (which appears only in the briefing, header picture and companion lines; the prose still teaches the concept itself, see `content-rules.md` 1C) or young readers; speaks only when clicked, lines relate to what is being read, can be turned off, can be triggered by keyboard; tone: see en-teaching-prose, "Dialogue".
- **Concept map**: add when there are many interlinked concepts; it shares one concept dataset with the concept cards and the field guide.
- Sound, glossary, flashcards, learning paths and more: see `modules.md`.

## 6. Starting a new course

**The first thing to ask is the art style.** When the user says "make a course", use the question tool (AskUserQuestion; otherwise just ask) to let them pick a skin, or choose "design a new skin with the AI". Don't default and don't improvise a style. Give each option one line on what it suits, plus the path to its approval page `skins/<name>/gallery.html`:

| Skin | In one line | Suits | Status (per each `skins/<name>/README.md` and `skin-contract.md` section 6) |
|---|---|---|---|
| `notebook` hand-drawn notebook | Ruled paper, ink stick figures, colour blocks | Design, thinking, humanities; adults and high school | In the library |
| `paper` paper cut-out | Card-paper cut-outs, white edges, soft shadows; the contents page is a tower | Courses with a story and characters; middle to high school | In the library, with a sample chapter |
| `pixel` handheld pixel | Four-green LCD screen, pixel illustrations, stepped motion | Computing, programming, gamified courses | In the library, with a sample chapter |
| `fieldbook` field notebook | Grid loose-leaf, coloured pencil, taped-in photos and ticket stubs | Humanities, social science, fieldwork and history | In the library, with a sample chapter; "how it looks once extracted as a skin" not yet separately approved |
| `collage` sticker collage | Handmade paper, Matisse cut-out colours; photos, paintings and cut-paper figures all as white-edged stickers | Intro courses heavy on paintings and historical photos (education, art history, psychology) | Approved into the library by the user on 2026-10-26; leader-line label breakdown not yet a component |

If the user wants a style that isn't listed, or chose to design a new skin: first talk through the feel they want, references they like and who the readers are, and offer two or three directions to pick from; then build the gallery page and one sample chapter following `skin-contract.md` section 5, and start the course once the user has approved it and it has joined the library. Three sample chapters built with real content live in `../course-kit/examples/` (shipped with the Chinese edition: `paper-survivorship`, `pixel-binary-search`, `fieldbook-gift`); show them to the user or use them as the model for a sample.

**The second thing to ask is the course plan.** Right after the skin, use the question tool to ask four questions at once (multiple choice, one click each):

| Question | Example options |
|---|---|
| Who are the readers | Adult beginners / high school / middle school / some background, want depth |
| How long | Short intro, 5–8 chapters / standard, 15–25 / full, 25+ |
| Language | Chinese only / Chinese and English / English only |
| Which modules (multi-select) | Concept map, glossary, flashcards, stamp album, companion (section 5) |

**Then give the user a course plan to approve**; don't generate the skeleton or write chapters until they do:
- Knowledge map: how many parts, chapters per part, what comes first;
- Chapter table: one row per chapter: chapter name (saying the topic outright), driving question, and its core concepts with the difficulty total (content-rules 1A); a chapter whose difficulty estimate won't fit is split on the spot;
- What readers can do afterwards (observable).
Structure is hard to change once rolled out (renumbering remaps the whole course), so ask one question too many rather than one too few.

The flow after that (skeleton → sample chapter → roll out by part; for each chapter: outline → logic review → user approval (sample chapter and first chapter of each part) → draft → checks → reader review → lead acceptance) and where the user takes part are in `references/content-rules.md` section 8. Generate the skeleton with `starter/new-course.mjs <absolute course folder path> <skin name>` (kit, skin, config, contents page, chapter 1 template, project doc template), then edit the chapter table and module switches in `js/course.js`; record readers, budget numbers, language and modules in the project doc.

## 7. Checks (catching errors you can't see while writing)

The code is written blind: real font widths, screen widths and whether class names match across files are only known once the page is open. So the checks must run after writing, and an agent may not skip them. If the user explicitly says "don't test yet", skip them, but list what was not tested in the delivery report.

**One-command check** (the tools are in this skill's `tools/`; always pass absolute paths):

```
node <skill>/tools/check.mjs <absolute course folder path> [ch02,ch03] [--fast]
```

| Step | Checks | Catches |
|---|---|---|
| 1 Syntax | `node --check` on every .js; trial-compiles every inline script | Whole-page script not running |
| 2 Wiring | Every `vl-` class the JS looks for actually exists in the page or scripts; a class the page uses that has no style and is not used by any script (hint only) | Renames not synced, dead buttons, styles not applying |
| 2b Highlighting | Each concept card's name has a matching naming mark `.vl-cn` in the prose and appears in its section heading | A concept missing one of its highlights |
| 2c Experience before names (hint only) | Before a concept is first named in the prose, its name already appears in an interaction board title, a "Try it", a button or a guess-then-reveal question | Tasks using words the reader doesn't know yet |
| 2d Load (hint only) | A paragraph with ≥ 2 terms or concept names appearing for the first time; a paragraph with more than 6 numbers | Two new things packed into one paragraph, numbers to remember piled into a sentence |
| 2e Style (hint only, Chinese pages) | A paragraph opening with a sentence of ≤ 10 characters, three or more short sentences in a row, two or more sentences opening with a command, a colon followed by a bare list | AI-voice runs of short sentences, task prompts that sound like someone hurrying you |
| 3 Picture density (hint; error past the limit) | Thresholds in section 1, item 5.1: past them is a hint, and only a long enough stretch with no visual is an error (boxes count; collapsed `details` don't; English converted by word count). What counts as a visual: `visuals.md` section 4 | Long text with no pictures |
| 4 Links | Local href / src exist | Wrong image or script paths |
| 5 Run | `qa.mjs`: clicks every button and drags every slider at 420 and 1100 widths | JS errors, illustrations that failed to draw (wrong illustration name, mismatched brackets in an illustration script), horizontal overflow, text in figures touching lines, overflowing or overlapping; JS errors or missing illustrations get their own !!! line in the summary |
| 6 Screenshots | Full-page shots of every page at 420 and 1100, saved in `%TEMP%/course-check-shots/<course folder name>/` | Prints paths; **you must open them with Read and look** |

Steps 2c, 2d, 2e and the step 3 hint lines only print "· hint" lines and do not count as errors. Hints need judgement (a name the reader already knows is not "untaught", a well-prepared reader can carry a little more, and a short sentence is sometimes right), but the delivery report pastes every hint line and answers each with "fixed" or "kept on purpose, because…".

`--fast` runs steps 1–4 only (seconds, no browser), good while writing; run the full version before delivery. Steps 5–6 need Edge or Chrome, which `tools/browser.mjs` finds on its own; if it can't, put the browser's path in the `EDGE_PATH` environment variable.

**Must be checked by eye** (look at each screenshot): the script does not check prose style, so someone reads the prose sentence by sentence against `en-teaching-prose/references/review.md` (the writing agent checks its own, and the lead reads a few passages at acceptance); text in diagrams touching lines; illustrated people following the rules (feet on the ground, hands holding objects, nothing floating; `tools/illus-overlap.mjs` helps); colour contrast; whether each section's pacing follows section 1; whether each section of the finished chapter answers the question the outline gave it. Capture a single figure with `tools/shot.mjs <html> <png> "selector@index" 1100` and zoom in; full pages taller than 16000px are cut at 16000px with a warning, so capture the rest section by section with a selector.

**The delivery report must state**: which steps ran, the results (paste the ✗ lines), which screenshots were viewed, and what was not tested. "Syntax passes" is not "tested".

**Flow**: write → `--fast` until 0 → full run until 0 → look at screenshots → fix → run again → deliver. When an agent delivers, the lead agent runs the full check again and looks at the screenshots itself. The whole per-chapter pipeline (outline, the two kinds of review) is in `references/content-rules.md` section 8.

## 8. Learning from feedback

**Two editions**: the Chinese skill at `../course-kit/` is the source of truth for the shared code (kit, skins, tools, starter). Change code there, then run `node tools/sync-en.mjs` from the Chinese skill to copy it here (`examples/` is not synced). When a rule changes (SKILL.md, references/), make the matching change in both editions. The documentation files inside the code folders have their own English translations and are not synced (`kit/README.md`, `kit/modules/concepts-schema.md`, `starter/README.md`, `skins/*/README.md`; see the SKIP set in `tools/sync-en.mjs`); update them by hand when the Chinese ones change.

Sort each piece of user feedback first: a principle of understanding → content-rules section 1 or 1A; an aesthetic preference → the matching component or skin, saying it is a preference; a technical matter → kit / tools. Improve the existing entry rather than appending, and check for an opposite older entry before writing; how to word a rule ("when …", numbers as "default + why", three tiers) is in the last item of content-rules section 9. Add a new skin to `skins/` once it is approved.
