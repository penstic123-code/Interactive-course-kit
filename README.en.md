# Interactive Course Kit

**Claude Code skills for building interactive learning web courses that are comfortable to read, easy to understand and fun.** [中文](README.md)

**Live demo**: [the four skin galleries, three sample chapters and the component demo pages](https://penstic123-code.github.io/Interactive-course-kit/)

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

## Making a course with AI, together

These skills can't produce a perfect course in one click. The limit isn't the tooling: a good textbook has to be judged by people who read it.

- AI has no body. It has never told itself "one last game" at 1 a.m. or been stuck on a problem, so it can't reliably pick the example that makes something click.
- AI doesn't know who your readers are or where they get lost. It understands things differently from people: a paragraph can read smoothly to it while a person lost the thread long ago.
- Whether a page is easy and enjoyable to read only shows when a person reads it.

So the skills put you at a few key points: choosing the look, agreeing the course plan, reading chapter outlines, reading the sample chapter, and spot-checking one chapter per part. AI lays out the content, draws, builds the interactions and runs the checks; you say "I didn't follow this", "this example is far from my life", "this part is too long". The courses above were all made this way, round after round.

## What's inside

| Skill | Purpose |
|---|---|
| `course-kit` / `course-kit-en` | Visual and component toolkit (Chinese / English editions, shared code) |
| `zh-teaching-prose` | Chinese explanatory prose style: classic style plus narrative non-fiction, no AI voice |
| `en-teaching-prose` | English explanatory prose style, written natively rather than translated |

## Features

### One topic, told unhurriedly
Each chapter is outlined before it is written: it answers one question, and each section answers the question the last one raised. Concept difficulty decides how many concepts a chapter holds and how much room each gets, and a paragraph brings in one new thing at a time. Chapters start from a situation the reader knows: experience first, then the name. Difficulty stays moderate. Invention stories, derivations, maths and research detail start collapsed, showing only a concrete question-style title and one line of introduction; readers who want depth open them.

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

### Skins are approved before they are used
A new course starts by asking you which skin to use (see [Skins](#skins)), and the AI never improvises styling inside a course page. Want a different look? Design a new skin with the AI: talk through the feel and references, build a gallery page and one sample chapter, and once you approve it, it joins the library for every later course. Readers can switch colour scheme (light / easy-on-the-eyes) and motion level (full, light, off) from the top bar, and the system's reduced-motion setting is respected.

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

When a new course starts, the AI first asks which art style you want, then asks about readers, length, language and modules, and gives you a knowledge map and chapter table to approve before building anything. Four approved skins ship today; every component and interaction works in all four, so switching skins doesn't touch the text:

| Skin | Look | Suits |
|---|---|---|
| `notebook` hand-drawn notebook | Ruled paper, ink stick figures, colour blocks | Design, thinking, humanities |
| `paper` paper cut-out | Card-paper cut-outs, white edges, soft shadows; the contents page is a tower | Courses with a story and characters |
| `pixel` handheld pixel | Four-green LCD screen, pixel illustrations, stepped motion | Computing, programming, gamified courses |
| `fieldbook` field notebook | Grid loose-leaf, coloured pencil, taped-in photos and ticket stubs | Humanities, social science, history |

![The four skins: notebook, paper, pixel, fieldbook](docs/images/skins.jpg)

Each skin's approval page is `skins/<name>/gallery.html`, with every component on one page; double-click to open. For a new style, follow `references/skin-contract.md`: a sample chapter first, then approval.

## How to use

### 1. Install

Copy the four folders in `skills/` into Claude Code's skills folder:

```bash
# macOS / Linux
cp -r skills/* ~/.claude/skills/
# Windows (PowerShell)
Copy-Item -Recurse skills\* $HOME\.claude\skills\
```

### 2. Start a course

Ask Claude Code to "make an interactive course about …". Then:

| Step | AI does | You do |
|---|---|---|
| Look | Suggests the four skins and what each suits | Pick one |
| Plan | Asks about readers, length, language and modules; drafts a knowledge map and chapter list | Approve or change it |
| Chapter outline | One page per chapter: the question it answers, how each section follows the last, concept difficulty, what each example and interaction is for; a context-free agent then checks the logic | Read the sample chapter's and each part's first outline closely, skim the rest |
| Sample chapter | Writes chapter 1 from the outline, runs checks and screenshots | Read it through and say where you got lost or what felt off |
| Roll out | Writes chapter by chapter; each passes the scripts and a context-free reader review | Read one chapter per part |
| Finish | Whole-course audit, optional modules, English edition | Final sign-off |

Specific feedback works best: "section 3 suddenly uses 'loss' before explaining it" helps far more than "a bit hard to follow".

### 3. Commands by hand

You can also generate a skeleton and run the checks yourself:

```bash
node ~/.claude/skills/course-kit/starter/new-course.mjs <absolute course folder path> <skin> --lang en
node ~/.claude/skills/course-kit/tools/check.mjs <absolute course folder path> --fast
```

Content rules (eight teaching principles, chapter outlines and difficulty budget, acceptance criteria, production workflow) live in `course-kit-en/references/content-rules.md`. You can copy the whole file into your project as `CLAUDE.md`.

## Requirements and limits

- Courses are plain front-end HTML that works offline: double-click to open, no build step.
- The checks need Node 22+ and Edge or Chrome (headless), found automatically or set with `EDGE_PATH`. Only tested on Windows so far.
- The dark colour scheme has variables but is not fully approved.

## License

MIT for code and docs. Bundled third-party assets keep their own licences: the Patrick Hand and Fusion Pixel fonts are under the SIL Open Font License (see each skin's `fonts/` folder), and Rough.js is MIT.
