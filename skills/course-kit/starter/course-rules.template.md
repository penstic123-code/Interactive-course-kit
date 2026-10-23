# [Course name]: course rules and lessons

Purpose: what is specific to this course: who it is for, its numbers, the skin and modules chosen, how it is written, and what we have learned. General rules live in the parent `content-rules.md` (content rules); look and components live in the course-kit skill. Only write here what this course has decided, what differs from the defaults, or what must be remembered. Each rule lives in one place; when the user gives new feedback, change the existing entry.

## 1. Who and what

| Item | This course |
|---|---|
| In one line | [What readers will be able to do] |
| Readers | [Who: age, background, why they come] |
| Assumed knowledge | [As close to none as possible; state the maths starting point, e.g. "can do arithmetic and percentages"] |
| By the end readers can | [2–4 things you could watch them do] |
| Total time | [N chapters × about M minutes ≈ X hours] |
| Running thread | [Optional: a case that keeps returning / a project built step by step / a background story (only in the briefing, header picture and companion) / none] |
| Prose style | `en-teaching-prose`; anything specific to this course goes in section 6 |
| Spelling | [e.g. Australian English: colour, behaviour, -ise] |
| Other language edition | [None / Chinese edition in the course root, English in `en/`; see starter/README.md] |

## 2. Knowledge map and chapter list

The only source of the chapter list is `js/course.js` (names, file names, parts, open chapters); here we record only structural decisions.

| Part | Chapters | What this part answers | Review chapter |
|---|---|---|---|
| I. [Part name] | 1–[n] | [One line] | Chapter [n] |

- What practitioners meet every day (check for gaps): [list 5–10]
- Advanced chapters: [numbers, marked "Advanced"]

## 3. Big-idea matrix

| Principle | Source (checked) | First appears | Appears again (new angle) |
|---|---|---|---|
| [e.g. prediction error] | [who, which study, year] | Chapter [n]: [under what everyday puzzle] | Chapter [m]: [new angle] |

## 4. Skin and visuals

| Item | This course |
|---|---|
| Skin | [notebook] (`skin/` copied from course-kit `skins/<name>/`; user approved on: []) |
| Part colours | [Default by part number; remaps go in `parts[].color` in `js/course.js` (variable names: see `skin/README.md`)] |
| Colour schemes | Light / dark / easy-on-the-eyes, switched by readers under "Display" in the top bar (comes with the skin; dark has variables only and is not fully checked) |
| Pictures | [Drawing notes; how people are told apart; this course's picture prefix `cNN-`] |
| Real photos | [Many / few; main sources]; listed in section 8 |
| Course styles | `css/style.css` (never edit `kit/` or `skin/`; a kit upgrade overwrites them) |

## 5. Optional modules and features

Decide each one; switches go in `modules` in `js/course.js`; how-to in course-kit `references/modules.md`.

| Feature | Yes / no | Reason / how |
|---|---|---|
| Saved progress | Always | A chapter counts as understood when its quiz is all correct (built into the kit) |
| Reader colour schemes | Always | Comes with the skin |
| Course map | [] | Chapter cards grouped by part on the contents page (in the starter); note here if it becomes a board, tower or route map |
| Learning paths | [] | `paths` in `js/course.js` |
| Reading rewards | [] | Look: [stamp album / backpack …] |
| Companion character | [] | [Who, what tone] |
| Sound | [] | Muted by default |
| Concept map / related chapters | [] | `map.html` + concept data |
| Term pop-ups / glossary / flashcards | [] | Term pop-ups come with the kit (`.vl-term`); glossary and flashcards via `kit/modules/terms.js`, data gathered into `js/concepts.js` by `kit/modules/build-concepts.mjs --write` |
| Final review chapter | [] | |
| "Your thoughts" notes | [] | Built into the kit (`textarea.vl-note`) |

## 6. This course's numbers

Defaults are in `content-rules.md` (content rules), single-chapter checklist; write only what differs, and once written this table wins.

| Item | This course |
|---|---|
| Time per chapter | [About 30 minutes] |
| Sections | [8–12] |
| Core concepts / concept cards | [1–3 per chapter, one card each] |
| Concept diagrams | [≥ 3] |
| Examples | [≥ 3 per concept, including 1 counterexample] |
| Signature / supporting interactions | [1–2 / 0–2; ≤ 5 big interactions in total] |
| Practice | [4–6 questions] |
| Writing specific to this course | [e.g. no direct quotations, go easy on "you", give the original term the first time] |

## 7. Workflow

| Item | This course |
|---|---|
| Sample chapter | Chapter [n], approved by the user on: [] |
| Agents in parallel | [One chapter at a time / two or three in parallel, checked by the lead] |
| Checks | Before each chapter is delivered: `node <skill>/tools/check.mjs <absolute course path> chNN --fast` down to 0, then the full run, and look at the screenshots |
| Reader review | After each chapter, send a review agent with no context (`tools/readable.py`; its output marks the correct answers, so have the agent test itself closed-book first) |

## 8. Image credits

If the licence can't be found, don't use the image; nothing missing from this table may appear on a page. With many images (> 30), move the table to `img/CREDITS.md` and leave a one-line link here. How-to: course-kit `references/visuals.md`, section 2.

| File | What it shows | Author / source | Licence | Source page URL | Attribution required |
|---|---|---|---|---|---|
| img/ch01/[name].jpg | [One line; "resized / cropped"] | [Author, year] | [Public domain / CC BY 4.0 …] | [URL] | [No / Yes] |

Third-party libraries are listed in `lib/README.md` (name, purpose, version, licence).

## 9. Progress

| Chapter | Status | Notes |
|---|---|---|
| 1 | ⏳ | |

## 10. Lessons and pitfalls

| Pitfall | What went wrong | Fix |
|---|---|---|
| | | |
