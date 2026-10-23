# Pictures

Purpose: which kind of picture a chapter needs, where real images come from and how to record them, the pitfalls of illustration, and how to check picture density. The rules for drawing people and the licence baseline for real images are in section 2 of `references/content-rules.md` and are not repeated here; this file adds the how-to and the common pitfalls. The master table "choose the visual by what the passage is doing" is in `SKILL.md` section 1.

## 1. Kinds of picture

| Kind | For | Source / how | Component |
|---|---|---|---|
| Scene illustration | Set up a situation; give examples and counterexamples a picture; the "warm" picture at the start and end of a section | Drawn with the course illustration library's drawing kit, in the skin's style | T1, E1 |
| Mechanism diagram | Explain a structure: loop, nesting, cause and effect, contrast, classification | `VL.diagram.*` (twelve templates, see `diagrams.md`); hand-written SVG only for what they can't draw | T3 |
| Data chart | Real or illustrative data: bars, lines, scatter, distributions | Bar and line charts use `VL.plot` (G11); scatter plots and anything else it can't draw are hand-written SVG inside `figure.vl-fig`; straight edges; illustrative data labelled "illustrative" | T3, G11 |
| Live chart | "What happens if I change this number" | Slider `label.vl-ctl` (see `kit/README.md` section 3, controls) + `VL.plot`'s `p.set(…)` to redraw; balance-type pictures can use the `slider` option of `VL.diagram.balance` directly | G2, G11 |
| Illustrated timeline | The 3–5 milestones of an invention story | A picture or real image for every milestone; placed inside the collapsed invention-story box | T5, K10 |
| Real image | Historical people, objects, places, original documents — so the reader believes "this really happened" | Wikimedia Commons and others (section 2) | T4 |
| Concept icon | Small pictures in concept cards and card grids that show the concept's parts | Small picture from the illustration library (≤240px), never emoji | K1, K2 |
| Comic panels | A process or story; replaces "more than 2 paragraphs in a box" | 2–4 illustrated panels + short narration | T6 |
| Comparison pair | Right vs wrong, before vs after, differing in one place only | Two illustrations or diagrams with the same composition | E2 |
| Document prop | Turn a piece of narrative into an object (newspaper, letter, case file) | HTML + skin material (`.vl-doc`, see `kit/README.md` section 7) | K9 |
| Big number | One startling number | Candidate component `.bignum`, ≤1 per chapter | candidate |
| Concept map | How every concept in the course connects | `map.html` + concept data (see `modules.md`) | module |

**Order of choice**: for real people and events, look for real images first (the user wants more of them); for structure, a diagram; for situations and examples, an illustration; to let the reader feel a change, a live chart. Don't draw an illustration where a real photo exists (Snow's map should be the original, not a redraw).

## 2. Real images: find, download, verify, caption, record

### 1 Where to look

| Source | Good for | Licence is usually |
|---|---|---|
| Wikimedia Commons | Historical people, paintings, maps, objects, figures from papers | Varies; check every file |
| NASA / JPL | Astronomy, spaceflight | NASA's own work is public domain; composites may carry a CC licence (as with the Ceres image in AI `ch03`) |
| US federal government works (military, Library of Congress, NOAA) | WWII, historical photos | Public domain (e.g. a 1952 photo of a pilot in a cockpit) |
| Wellcome Collection | History of medicine | CC BY or public domain |
| Smithsonian Open Access | Objects, specimens | CC0 |

On Commons, English keywords plus a year is fastest; for a person try `File:Name.jpg` first, then the Category page.

### 2 Verify the licence
- Read `extmetadata` from the Commons API rather than trusting your impression of the page (open `img/CREDITS.md` with "every licence checked via the Commons API on the day of download"):
  `https://commons.wikimedia.org/w/api.php?action=query&titles=File:John_Snow.jpg&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json`
  Check `LicenseShortName`, `Artist`, `Credit`, `AttributionRequired`.
- **Usable**: public domain, CC0, CC BY, CC BY-SA. **Not usable**: NC, ND, "fair use", unclear licence, anything that only says "from the internet".
- When sources disagree, credit according to the stricter one (e.g. a cartoon that Commons marks public domain and Wellcome marks CC BY 4.0: the caption also credits Wellcome).
- Modern photos of things (museum objects, memorials) belong to the photographer and need their own check (e.g. a photo of a replica pump under CC BY-SA 4.0 must credit its photographer).

### 3 Download and store
- Download the thumbnail Commons generates, 960–1280px wide (portraits 640–960px), not the original tens-of-MB file; ≤600KB per image.
- Store as `img/chNN/english-hyphenated-name.jpg` (`snow-map-1854.jpg`); never hotlink.
- Resizing, cropping and removing a transparent background are all changes: for CC BY-SA, note "resized / cropped" in the register and share alike.

### 4 Captions
- Format: one sentence telling the reader what to look at in the image + `.vl-src` (creator, year, licence, source).
  ✓ "Snow drew each death as a black bar, and the bars crowd around the Broad Street pump. [John Snow, 1855, public domain, Wikimedia Commons]"
- CC BY / BY-SA must name the creator and the licence; for public domain, naming creator and source is still recommended.
- Put explanation in the prose; captions are at most two lines (long captions leave big empty gaps in two-column picture/text layouts).

### 5 Record
One row per image in the project doc's "image credits" list (`starter/项目规则与经验.template.md` section 8 already has the table; when there are many images move the whole table to `img/CREDITS.md` and leave a link in the project doc). Use these six columns:

| File | Content | Creator / source | Licence | Source page URL | Attribution required |
|---|---|---|---|---|---|
| img/ch01/snow-map-1854.jpg | Snow's cholera map, 1280px thumbnail | John Snow, 1855 | Public domain | https://commons.wikimedia.org/wiki/File:Snow-cholera-map-1.jpg | Not required; recommended |

If you can't establish the licence, don't use the image — draw an illustration or cut it. No image may appear on a page unless it is in the register.

## 3. Illustration: common pitfalls

The general rules (tell people apart by clothing, feet on the ground, hands holding things, no text over the picture, screenshot every picture) are in section 2 of content-rules.md. These add to them:

| Pitfall | Fix |
|---|---|
| Giving each person a different coloured shirt block made it look like a "transparent patch" that clashed with the line style | In the notebook skin, tell people apart by hat, hairstyle and accessories, not colour blocks; within one picture the drawing function changes outfits automatically in order |
| Hats covering eyes, beards covering mouths | Hats raised, beards lowered — built into the drawing function |
| Shrunk figures' mouths looked like moustaches | Draw the mouth in dark red, not ink |
| Pixel figures in glasses looked masked, eyes invisible | Pixel figures don't wear glasses (except a companion character's signature glasses) |
| Hand and object drawn separately, object floating away | `arms:"hold"` with `kit.holding(x, y, opts, item)`; for a custom object get both hand positions with `kit.hands(x, y, opts)` |
| Robot arms stuck to the body, stiff | Arms away from the body, angled slightly out |
| Sitting with no chair; screens or books floating | Sitting pose adds a chair automatically — cheaper to build into the function than to fix picture by picture |
| Arms pointing off-frame instead of at the object; covering ears drawn as covering eyes; "hiding behind the rock" drawn in front of it; pose not matching the caption | Only a human eye catches these: lay out every illustration and look at each one (the skill has no ready-made course-wide gallery page; copy the idea of `skins/notebook/gallery.html`: load every chapter's illustration pack, loop over `VL.illus.lib`, and draw each one with its name and alt) |
| People overlapping objects such as a telescope | `tools/illus-overlap.mjs` checks overlaps |
| Text on a shape's border, crammed beside a line, wider than its box | Text ≥4px from lines; nested diagrams use leader lines + outside labels (`diagrams.md`); collision check in `tools/qa.mjs` |
| Speech-bubble tail pointing at nothing | `kit.bubble(x, y, w, h, [tipX, tipY])` with the tip on the speaker |
| Mirroring a figure flipped its text too | `look:-1` (or `flip`) mirrors only the limbs; text goes in the text layer of `VL.illus.add` and doesn't flip |
| Sky in a small header window so dark it looked like a black hole | At small sizes lighten big colour areas one step; check the thumbnail in a screenshot |
| "White background, little person, label" illustrations looked cheap | Illustrations have a setting, ground and light (where are they, what time is it), not an isolated figure on white |
| Counterexample and example pictures look the same | The counterexample shows the missing piece or the mistake (a table missing a leg, an empty slot) and gets a text tag |

**Before drawing, ask**: what "why" does this picture show? If the answer is "it makes the page less empty", draw something that explains a mechanism instead, or draw nothing.

**Check**: screenshot each illustration as a single element and look at it enlarged: `node <skill>/tools/shot.mjs <absolute html path> <out.png> "selector@index" 1100` (use `tools/illus-overlap.mjs` for overlaps). One checker covers 3–5 chapters, going through every picture with the list "no hands or legs, floating, facing the wrong way, text on lines".

## 4. Picture-density check

`SKILL.md` requires a visual every 1–2 paragraphs, with no more than about 220 characters of prose between two visuals and about 160 per paragraph, text inside boxes included. How to check:

1. **Automatic scan**: step 3 of `node <skill>/tools/check.mjs <absolute course path> --fast`. It walks `<main>` in source order, adds up prose length (box text included; English counts words × 1.5 as characters, so the 220 limit is roughly 150 English words), resets at each visual, and reports any gap over 220; a single `<p>` over 160 is reported too. Counted as visuals: `img svg canvas figure video iframe` tags, `data-illus`, `data-diagram`, and the classes `vl-board vl-dg vl-fig vl-eg vl-cc-fig vl-illus vl-photo vl-comic vl-plot`, plus the small interactions `vl-guess vl-flip vl-philo vl-hot` (guess then reveal, flip cards, stance cards, hotspots). Collapsed `details` (invention-story boxes, side paths) are skipped and not counted; their expanded contents must still follow "a box is prose too" — check them by eye in screenshots with them opened. It can't see content generated by script (HTML built in page JS); check that by eye in screenshots.
2. **Mix**: count diagrams, illustrations / photos / examples, and interactions in a chapter: roughly 1/3 : 1/2 : the rest (more diagrams in maths-heavy courses, more photos in history-heavy ones).
3. **Neighbours**: list the sequence of visuals and look for two static diagrams back to back (they need an illustration, example or interaction between them).
4. **Repeats**: grep the whole course for `data-illus="…"` and `img src`; any name that appears twice is a reused picture.
5. **Warmth**: is the visual at the start and end of each section an illustration, photo or example rather than a diagram?
6. **By eye**: take a full-page screenshot at 420px and at 1100px, shrink it to one screen, and see where the walls of text are.
