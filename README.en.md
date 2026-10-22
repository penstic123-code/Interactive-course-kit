# Interactive Course Kit

**Claude Code skills for building interactive learning web courses that are comfortable to read, easy to understand and fun.** [中文](README.md)

![Game design course, chapter 2](docs/images/gd.jpg)

## Background

I built several complete web courses with Claude Code for ordinary people who want to learn a field properly:

| Course | Look | Live site |
|---|---|---|
| Game design | Hand-drawn notebook | https://111.231.53.50/game-design-course/ |
| Intro to AI | A different retro medium per part (handheld console, terminal…) | https://111.231.53.50/ai-course-pro/ |
| Data science | Paper-cutout tower climb: a hero beats one floor guardian at a time | https://111.231.53.50/data-science/ |
| Anthropology | Field notebook | https://111.231.53.50/anthropology-course/ |

The courses are in Chinese; the game design course also has an English edition.

While building them, every piece of feedback on visuals, components, interaction and prose was written down and turned into a rule. This repo packages those rules and the code. Hand it to Claude Code and it builds new courses to the same standard, instead of improvising a new style each time and writing in an AI voice.

| Data science | Intro to AI | Anthropology |
|---|---|---|
| ![](docs/images/ds.jpg) | ![](docs/images/ai.jpg) | ![](docs/images/an.jpg) |

## What's inside

| Skill | Purpose |
|---|---|
| `course-kit` / `course-kit-en` | Visual and component toolkit (Chinese / English editions, shared code) |
| `zh-teaching-prose` | Chinese explanatory prose style: classic style plus narrative non-fiction, no AI voice |
| `en-teaching-prose` | English explanatory prose style, written natively rather than translated |

## Features

### One topic, told unhurriedly
Each chapter starts from a situation the reader knows, and each paragraph picks up the question the last one left. Difficulty stays moderate. Invention stories, derivations, maths and research detail start collapsed, showing only a concrete question-style title and one line of introduction; readers who want depth open them.

![Collapsed drawers for an invention story, maths and a controversy](docs/images/drawers.jpg)

### A visual every one or two paragraphs
The picture is chosen by what the passage is doing: a concept diagram for a structure, real photos and a timeline for history, an illustrated carousel for examples. Long text inside concept cards and "why it works" boxes needs a picture too. On wide screens text and picture sit side by side, top-aligned; on phones they stack.

![Game design course: concept card, loop diagram and a predict-then-reveal interaction](docs/images/gd-detail.jpg)

### Readers always know which concept is being taught
The section heading names the concept, a highlighter marks the spot where it is first named, and an illustrated concept card follows, with the same name in all three places. `check.mjs` verifies that they match.

<img src="docs/images/concept.jpg" width="560" alt="Heading, highlighter and concept card">

### 41 components organised by job
Independent of the skin: concept cards, "why it works" boxes, example and counterexample carousels, side-by-side comparisons, real photos, data tables, predict-then-reveal, "Try it" tasks, collapsible side paths, exercises, key points, a notes box and more. Below is part of the skin's gallery page.

![Component gallery](docs/images/components.jpg)

### 12 concept-diagram templates
Cycle, nested rings, flow, quadrant, comparison, timeline, curve, tree, Venn, balance, network, spectrum and stack. Text is measured before lines are drawn, so labels never collide with lines. Clicking any part of a diagram highlights it and explains what it does.

![The twelve diagram templates](docs/images/diagrams.jpg)

### Hands-on interactions, not quizzes
Readers drag, tweak, build and sort, and see the consequence immediately: comic panels, step-through demos, formula breakdowns, sorting tasks, round-by-round mini games, before/after comparisons, flip cards, hotspot images. Each interaction opens with one sentence saying what question it answers, and its "Try it" task gives feedback when done.

![Interaction demo page](docs/images/interact.jpg)

### Approved skins only
The AI is not allowed to improvise a style. Readers can switch colour scheme (light / easy-on-the-eyes) and motion level (full, light, off) from the top bar, and the system's reduced-motion setting is respected. See [Skins](#skins) for what is available.

### Optional modules
A concept map (sharing one dataset with the concept cards), glossary, flashcards, stamp-album reading rewards (one stamp per chapter understood), a companion character who speaks only when clicked, and sound (muted by default).

![Concept map and stamp album](docs/images/modules.jpg)

### One-command checks
Code is written blind: real font widths and screen widths are only known once the page is open. So every chapter is checked after writing:

```text
node tools/check.mjs <absolute course folder path>
1  Syntax           trial-compiles every .js file and inline script
2  Wiring           classes the JS looks for exist in the page; classes used have styles
2b Concept marks    concept card, highlighter and heading use the same name
3  Picture density  flags more than ~200 words between two visuals
4  Links            local image and script paths exist
5  Run              headless browser at 420 / 1100 px clicks every button and drags every slider;
                    reports errors, overflow, and text touching lines inside figures
6  Screenshots      one full-page shot per width, for a person or agent to look at
```

### Bilingual
The skill itself comes in Chinese and English editions sharing one codebase. `new-course.mjs --lang en` generates an English course; interface text and diagram punctuation switch automatically.

<img src="docs/images/english.jpg" width="560" alt="An English page">

## Skins

Only one skin is approved and shipped so far: **`notebook`** (hand-drawn notebook, from the game design course). The other courses' looks (paper cutout, Game Boy and NES pixel art, miniature town) are documented in `references/skin-contract.md` but not yet extracted into skins. The contract there explains how to extract or make a new skin: a sample chapter with real content, contrast measured, three colour schemes checked, then user approval.

## Install

Copy the four folders in `skills/` into Claude Code's skills folder:

```bash
# macOS / Linux
cp -r skills/* ~/.claude/skills/
# Windows (PowerShell)
Copy-Item -Recurse skills\* $HOME\.claude\skills\
```

Then ask Claude Code to "make an interactive course about …" and it will pick up the skills. You can also generate a skeleton by hand:

```bash
node ~/.claude/skills/course-kit/starter/new-course.mjs <absolute course folder path> notebook --lang en
node ~/.claude/skills/course-kit/tools/check.mjs <absolute course folder path> --fast
```

Content rules (how each concept is taught, chapter and course acceptance criteria, workflow) live in `course-kit-en/references/content-rules.md`. You can copy the whole file into your project as `CLAUDE.md`.

## Requirements and limits

- Courses are plain front-end HTML that works offline: double-click to open, no build step.
- The checks need Node 22+ and **Microsoft Edge on Windows** (headless). On macOS / Linux the `--fast` static checks work; the run and screenshot steps do not yet.
- Only one skin so far; the dark colour scheme has not been fully tested.

## License

MIT for code and docs. The Patrick Hand font is under the SIL Open Font License (`skins/notebook/fonts/OFL.txt`).
