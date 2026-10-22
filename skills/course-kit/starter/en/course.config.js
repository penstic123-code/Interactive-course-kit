/* Course config (starter template, English course). new-course.mjs --lang en copies it to course/js/course.js; chapter pages load it after </main>, before kit/vl.js.
   vl.js reads these fields of window.VL_COURSE: id, home, enReady, enDir, topbar, chapters (zh / en / file / open), parts (zh / en / from / to).
   On a page with <html lang="en">, vl.js shows the `en` names, so in an English-only course write the English name in both zh and en
   (zh is the fallback when en is missing). The other fields (title, desc, color, paths, modules) are not read by vl.js; they are
   used by the contents page and by this file, as noted below. The single source for the API is kit/README.md, section 2. */
(function () {
  /* ---------- Chapter list CH: chapter n = item n ----------
     en: chapter name; zh: same name (or the Chinese name in a bilingual course); file: two-digit number + English words with hyphens;
     descEn: one line on the contents-page card (vl.js does not read it; ≤ 12 words; a situation or a question, not a definition). */
  const CH = [
    { zh: "Chapter One", en: "Chapter One", file: "ch01-intro.html", descEn: "Start from a situation the reader already knows." },
    { zh: "Chapter Two", en: "Chapter Two", file: "ch02-next.html", descEn: "List chapters still being written, too." },
    { zh: "Chapter Three", en: "Chapter Three", file: "ch03-more.html", descEn: "The contents page marks it as still being written, with no link." },
  ];

  /* ---------- Open chapters OPEN: chapter numbers that are written and checked. Any chapter not listed = open:false
     (no link in the top bar, contents page or page turner; the turner says "Chapter N is still being written") ---------- */
  const OPEN = [1];

  /* ---------- Parts PARTS ----------
     from / to: chapter numbers, inclusive. vl.js writes body[data-part="1…"] in order, and the skin picks each part's colour from it
     (notebook has 5 sets: yellow, blue, green, pink, purple).
     color (optional, vl.js does not read it): give a part another skin colour set; this file injects a little CSS to remap it.
     The remap uses notebook's variable names --p{n}a / --p{n}b / --p{n}p / --p{n}l; with another skin check its skin/README.md.
     descEn: one line under the part name on the contents page (vl.js does not read it). */
  const PARTS = [
    { zh: "I. Part One", en: "I. Part One", from: 1, to: 2, descEn: "What this part is about, in one line." },
    { zh: "II. Part Two", en: "II. Part Two", from: 3, to: 3, descEn: "What this part is about, in one line." /*, color: 4 */ },
  ];

  /* ---------- Learning paths (used by the contents page, not by vl.js). Leave the array empty and the block is hidden ----------
     Each path = nameEn + whoEn + chapter numbers. Before adding one, check that every concept a chapter on the path uses is
     taught earlier on the same path. See references/modules.md, section 6. */
  const PATHS = [
    // { nameEn: "One-week start", whoEn: "For readers who want the basics fast", chs: [1, 2] },
  ];

  /* ---------- Optional modules (vl.js does not read these; the modules in kit/modules/ do. Which files to load, and where:
     kit/README.md, section 8). Decide each one when starting the course and record it in course-rules.md, section 5. ---------- */
  const MODULES = {
    sound: false,          // read by modules/sound.js: false = no sound at all; true or missing = speaker toggle in the top bar, muted until the reader turns it on
    related: true,         // read by modules/vl-concepts.js: "Related chapters" at the end (needs js/concepts.js); false = none
    relatedFuture: false,   // read by modules/vl-concepts.js: whether related chapters list later chapters; false = earlier ones only
    // Not read by any code yet (field names follow kit/README.md, section 8); this just records the decision
    reward: false,         // reading rewards: only for real understanding (Try it done, quiz all correct); look comes from the skin
    buddy: false,          // companion character: speaks only when tapped, lines follow the current section, can be turned off
    graph: false,          // concept map map.html (modules/graph.js)
  };

  window.VL_COURSE = {
    id: "mycourse",            // storage prefix (lowercase letters and hyphens only): <id>-progress, <id>-try, <id>-note-…, <id>-side-…. Never change it after launch, or readers lose their progress and notes
    title: "Course name",      // big title on the contents page (vl.js does not read it)
    home: "index.html",
    enReady: false,            // only for a bilingual course: set true when the English edition is complete (see starter/README.md)
    enDir: "en/",
    topbar: true,
    chapters: CH.map((c, i) => Object.assign({}, c, { open: OPEN.indexOf(i + 1) >= 0 })),
    parts: PARTS,
    paths: PATHS,
    modules: MODULES,
  };

  // English UI text for the contents page (ix.*). Overrides for kit UI text go here too (keys: the EN table in kit/vl.js)
  window.VL_I18N = Object.assign({ zh: {}, en: {} }, window.VL_I18N);
  Object.assign(window.VL_I18N.en, {
    "ix.badge": "Interactive course · {0} chapters", "ix.prog": "Understood {0} of {1} chapters", "ix.next": "Continue: ",
    "ix.wip": "Still being written", "ix.done": "Understood", "ix.nch": "{0} chapters",
  });

  // Part colour remap (only when PARTS has a color): point part i's colour variables at set `color`
  const remap = PARTS.map((p, i) => (p.color && p.color !== i + 1 ?
    'body[data-part="' + (i + 1) + '"],[data-part="' + (i + 1) + '"]{--pa:var(--p' + p.color + "a);--pb:var(--p" + p.color + "b);--pp:var(--p" + p.color + "p);--pl:var(--p" + p.color + "l)}" : "")).join("");
  if (remap) { const s = document.createElement("style"); s.textContent = remap; document.head.appendChild(s); }
})();
