---
name: en-teaching-prose
description: The user's house style for English explanatory prose, which pairs classic style (Steven Pinker, The Sense of Style) with narrative non-fiction. The aim is "plain but refined" with no detectable AI voice. Use it before writing, revising or reviewing any English explanatory text for general readers, including course chapters, interactive web lessons, tutorials, popular-science pieces, concept explanations and long-form knowledge writing. Also use it for requests like "remove the AI voice", "this sounds like AI", "make it flow", "polish this explanation", when briefing writing or review agents, and when producing the English edition of one of the user's Chinese courses. Use it even if the user never mentions style, whenever the output is long explanatory English for ordinary readers.
---

# English teaching prose: classic style + narrative non-fiction

This is the English counterpart of `zh-teaching-prose`, adapted to how English works and not translated from it. The goal is **plain but refined**. The reader should feel they are listening to someone knowledgeable following their own curiosity, not watching a checklist being ticked off, and should never think "a machine wrote this".

Read `references/examples.md` before writing. Use `references/review.md` when revising or reviewing.

## Three tiers of rules

| Tier | Nature | Where |
|---|---|---|
| Principles | Must hold, but the method is flexible: the purpose stays, the technique can change | Two styles, mixed; The four classic-style moves; Sentences; Narrative and structure |
| Preferences | The user's taste; a project may override them in its own guide | Preferences |
| AI-voice signals | Symptoms to check line by line when reviewing, not hard bans: judge a single one in context, fix a run of them | AI-voice signals |

When they conflict, principles beat preferences, and preferences beat mechanical removal of a signal. If dodging a signal bends the meaning or stiffens the sentence, keep the signal. One exception: a signal marked "must be avoided" (paragraph templates) was fixed by the user after going through the text paragraph by paragraph, and the "not hard bans" wording does not apply to it.

## Two styles, mixed

- **Classic style**: the writer points at something in the world, and the writer and reader both look at it. Attention stays on the thing, not on the writer or the reader. So skip "let's look at", "you'll notice", "in this section I want to show". Say what is there and why it is that way.
- **Narrative non-fiction**: restrained, economical, visual. No breathless catchphrases ("game-changer", "mind-blowing", "this is where it gets interesting"). The pull comes from narrative momentum and from stopping once the facts are clear. Stopping means not spelling out the reader's feelings for them and not adding an uplifting line at the end of a paragraph. It does not mean withholding: the knowledge still gets fully explained.

Three adjustments get you most of the way to "plain but refined":

1. **When telling history or how something was invented, follow the timeline.** Tell events in the order they happened, causes before effects: 1801 before 1805. When explaining a concept, a structure or a use, follow the reader's questions instead.
2. **Weave concepts into sentences.** A concept's name arrives inside the narration. It doesn't get a separate glossary-style sentence.
3. **No staged contrasts.** No strings of balanced sentences that build something up and knock it down (see AI-voice signals).

## The four classic-style moves

1. **Erase the glossary entry.** The reader sees the phenomenon first, and the name lights up along the way.
   ✗ "This phenomenon has a name: the AI effect." / "AI that is good at only one thing is called narrow AI."
   ✓ "Pamela McCorduck had already recorded this 'AI effect' in *Machines Who Think*: …" / "Nearly every AI system today is narrow AI of this kind, built to run on one track."
   When a naming sentence really is needed, keep it short and plain: ✓ "The thought experiment became known as the Chinese Room." Vary how paragraphs move, too: not every one should run "example, then definition", which is where the labelling feel comes from.
2. **Show a concrete scene, not an abstract summary.** ✗ "Deep Blue also showed something else." ✓ "The sceptics had a point. Deep Blue could beat the world champion across sixty-four squares, but away from the board it could not recognise a shirt." The second version picks up the previous paragraph's scepticism and brings the eye back to the board.
3. **Make transitions between paragraphs.** A transition works like a light tap on the shoulder that turns the reader's head (✓ "Now consider a five-year-old."). Each paragraph should pick up something the last one left behind, whether a question, a tension or an unfinished example.
4. **When it fits, end a paragraph on the question the reader now wants to ask, and answer it straight away in the next one** (✓ "So where were all these rules supposed to come from?"). This is one of several transition techniques, to be rotated with the tap on the shoulder in move 3 and with picking up the last paragraph's example, and it is not meant for every paragraph. Whichever you use, never end on an exam-style summary (✗ "Where the rules come from is the great fork in seventy years of AI."). A question you raise must be answered at once, or it becomes a cliffhanger.

## Sentences

- **Plain and clear about reference.** One sentence, one main idea. A long sentence is fine if it can be read in one breath; aim for about 25 words or fewer by default, and vary the length. When "it", "this" or "that" crosses a sentence boundary and the referent isn't obvious, repeat the noun. Put the phenomenon or conclusion first and the reason second. Introduce one new concept per sentence by default, and explain a term in one sentence when it first appears.
- **Flowing, sentences joined up.** No strings of one-fact sentences: let the result of one sentence become the starting point of the next. Connectives must state the real relationship: "so" only for cause, "but" for contrast, "while" or "whereas" for comparison, "and" when nothing stronger is true. Read it aloud. No sentence should make the reader stop and reread.
- **Agents as subjects.** If someone did something, make them the subject (✗ "The experiment was designed by Searle" ✓ "Searle designed the experiment"). Use the passive only when the agent is unknown or irrelevant, or when it keeps the topic in subject position (✓ "The pellets had to be made by hand"). Scene sentences especially need a person as subject (✗ "Borrowed a novel on Saturday afternoon and read until dark." ✓ "A child borrows a novel on Saturday afternoon and reads until dark.").
- Interface text such as Try-it tasks, board notes and hints beside buttons: see course-kit-en `references/interaction.md`, section 2, rule 16.
- **Verbs, not nominalisations.** ✗ "perform an update of the parameters", "make an assessment of", "the utilisation of" ✓ "nudge the dial", "judge", "use".
- **Concrete, Anglo-Saxon over Latinate.** Write people, objects and actions you can see. Avoid shell nouns such as "aspect", "factor", "dimension", "mechanism", "framework", "dynamics", and prefer "use" to "utilise" and "show" to "demonstrate".
- **Watch the curse of knowledge.** The writer already understands, so the step the reader is missing is the easiest one to skip. Spell out acronyms and jargon, and fill in whatever hides behind "obviously" or "clearly", for someone hearing it for the first time. Give a concrete example before an abstract statement.
- **Metaphors** should come from things the reader has actually seen. Carry one metaphor through instead of switching, and say once where it breaks down. Skip the worn ones ("black box", "double-edged sword", "tip of the iceberg", "a perfect storm").
- **Use "you" and "we" sparingly.** The prose stays on the explaining; its subjects are the concepts, people, objects, data and events themselves. Use "you" only to invite the reader to try something, guess, or recall their own experience, or to open with an everyday scene. An authorial "I" appears only when the opening sets up why the piece exists.
- A paragraph runs about 150 words, and that is not a hard limit (the check script prints a hint past it; see course-kit-en SKILL.md section 1, item 5.1). Each one gives the reader a new fact or a new "why". Known information comes first and new information last. How many new things a paragraph may carry in a course, and which words an interaction or exercise may use, follow `content-rules.md` section 1 in course-kit (experience before names; one new thing per paragraph).
- No meta-language ("in this chapter", "the next section will cover", "as mentioned above") and no previews of what comes later (including "Chapter N will cover this in detail"). Looking back naturally is fine ("Remember the hide-and-seek example?"); links between chapters are left to the related-chapters section.

## AI-voice signals (each with a fix)

Treat these as signals to check line by line when reviewing. Judge a single occurrence in context; when they come in a run (several in one paragraph, or the same pattern paragraph after paragraph) they must be fixed.

| Tell | ✗ | ✓ |
|---|---|---|
| Paragraph templates (**must be avoided**, fixed by the user after paragraph-by-paragraph review): every paragraph runs claim → example → aphorism; semicolon-paired antitheses; a tricolon followed by a summing-up sentence; sentences set side by side with no "but / so / which means" picking up the result of the last one; a one-line verdict standing alone as its own sentence; every concept paragraph built on the same skeleton, or parallel paragraphs filled in from one template (vary sentence shape, length and order); a sentence chained from more than three comma clauses (split it and join the pieces with real connectives) | "Practice can feel fast and still not last; practice can feel clumsy and last longer. The two often disagree." | Let the result of one sentence become the start of the next, put a connective only where a real contrast or cause exists, turn the tricolon into one concrete scene, and stop when the point is made, with no closing maxim |
| Em-dash overuse (dashes used for dramatic pauses or stacked asides; the per-paragraph cap is under Preferences) | "The answer — surprisingly — was no." | "The answer was no, which surprised him." |
| AI vocabulary: delve, tapestry, testament, crucial, pivotal, navigate, landscape, realm, unlock, harness, robust, (also: seamless, vibrant, intricate, foster, underscore, multifaceted) | "Let's delve into the rich tapestry of game design, a crucial realm…" | "Game designers argue about this constantly." |
| "It's not X, it's Y" / "not just X but Y" / "not only… but also" used to manufacture contrast (knocking down a position nobody holds). Correcting a misconception the reader really has is fine. | "It's not a game, it's a system of meaning." | "Players treat the rules as binding, though nothing forces them to." |
| Rule-of-three lists and tricolons used for rhythm | "fast, fun and unforgettable" | List the items the facts actually contain, even if that is two or four. |
| Stock connectives: In other words, Ultimately, In essence, It's worth noting that, Interestingly, Notably, Indeed, Essentially | "Interestingly, the rats kept pressing." | "The rats kept pressing." |
| Rhetorical-question openers | "What makes a game a game?" (as the first line of a paragraph) | Start from the fact: "In 1953 Wittgenstein laid out board games, card games and ball games side by side." |
| One-line paragraph punchlines | A paragraph that is only "And that changed everything." | Fold it into the paragraph, or delete it. |
| Summary or moral at every paragraph end | "…This shows how powerful rules can be." | End on the last fact, or on the question the next paragraph answers. |
| "Imagine you…" staging the reader's experience | "Imagine you're a pigeon in Skinner's box." | Describe the box and what the pigeon did. |
| Inflated stakes | "a question that would reshape humanity's future" | "a question that kept philosophers busy for decades" |
| Colon definitions "X: the Y that…" in running prose | "The core loop: the cycle that keeps players coming back." | "The chain of actions a player repeats most often is the core loop." |
| Generic openers and closers: Let's dive in, Let's explore, In conclusion, To sum up | "Let's dive in!" | Start with the first real fact. |
| Formulaic opening sentence: a short assertion, signpost, mini-question or preview before the real content | "This isn't made up." / "Now the votes." / "And the calculator?" / "First, a game character." | Start with the fact ("In 1980 the American philosopher John Searle…"), or merge it into the next sentence. Scan every paragraph's first sentence separately. |
| A run of short sentences opening a section or paragraph | "Nobody asked. Nobody pushed. It just happened." | Open with at least one sentence that carries the cause and the result, and join neighbouring sentences with real connectives. course-kit's check.mjs step 2e lists suspects in Chinese pages; read each one. |
| A colon followed by a bare list | "Things that make time vanish: a game, a doodle, a borrowed novel." | Say what the items share, or give each its own sentence. |
| Enumeration scaffolding in narrative prose: Firstly, Secondly, Finally (procedures and steps may use a numbered list) | "Firstly… Secondly… Finally…" | Narrate in the order things happened, joined by real connectives. |
| Defensive writing: hedging stacks, parenthetical disclaimers, "of course", "arguably", "to some extent" | "This may potentially suggest that, to some extent, …" / "(though of course this is debated)" | Delete it. State real uncertainty once, on the specific claim ("Nobody knows whether this holds outside the lab."), or say who disputes it. |
| Forced "and in everyday life too…" uplift after a concept | "Just like in life, we all face unnecessary obstacles." | Delete it, or give a real everyday example with its own detail. |
| Suspense signposting | "Flip to the last card and see what's different." | "The cards show…, and only the last one is a person who really understands Chinese." |
| Big words and atmosphere | "the crown jewel of the mind", "the holy grail", "something stirred in the darkness" | Plain words. Tension comes from a question the reader actually wants answered. |

## Narrative and structure (long pieces, course chapters)

- **The opening sets up cause and context.** Principle: after the opening, the reader can say what is being done and why. So don't drop the reader into a scene, and don't start from a mechanism or a metaphor; start from an experience or question the reader already has, and say what is to be solved and what is in hand. Metaphors grow out of that problem and never come before it. If you use a scene, the concept must be readable from it; it is not there to set the mood. Default: one of the four ways in below, picked to suit the topic. Another way is fine if it meets the principle:

  | Way in | Suits | How |
  |---|---|---|
  | Everyday scene | The concept has a ready instance in daily life | A small, complete scene the reader has lived through, down to people (as subjects), actions and outcome, with no new term; end with a sentence saying it already contains the parts of X, then name it (hide-and-seek has goal, rules, feedback, voluntariness) |
  | Same-structure analogy | Technical topic, no everyday instance | A lived scene with the same structure (adjusting a shower: error, direction, step size, overshoot, which is gradient descent) |
  | Lay out the task | There is data to work with | Put the task and its data on the page and work one calculation by hand (five carts and their loss) |
  | A question | The concept is counter-intuitive | The first sentence is the reader's own question (✓ "Today 'AI' seems to mean chatbots like ChatGPT and Gemini… Is that all the word means?") |
- **Build around one theme.** Each section picks up the question the last one left. A single guiding question that runs through and returns at the end is one option, not a requirement.
- **Situation, then solution, then name.** Let the reader feel the need, show how people came up with the idea, and name it last.
- **Write meaning, not figures.** Before drafting, give each paragraph one line covering what the reader will understand, how it connects to the previous paragraph, and what question carries them on. Write around that line. Numbers and dates are evidence, so delete any the reader doesn't need.
- **Concepts come first.** Stories, history, games and philosophy are vehicles for understanding the concept and must not outweigh it. When a course has a story, keep it in the background and never let it stand in for a concept's name (content-rules section 1C, "Concepts take the stage, the story stays behind"; deletion test and side notes: section 1, item 12).
- **Enough examples.** With one example the reader mistakes the example for the concept, so a core concept needs positive examples and also a counterexample or near miss that shows where it stops; the count and the sources (everyday or academic) are in content-rules section 1, item 7. Academic or maths-heavy material need not force everyday scenes.
- **Chapter titles and headings** (courses follow this one entry) say concretely what the chapter or section is about: a chapter title names the chapter's core concept or topic, a heading names the section's core object or conclusion, one concept per section by default (a section that compares two concepts names the pair). The section where a concept is first named has a heading that names it (the name in a heading only orients the reader; the naming in the text comes after the reader has met the concept), with a touch of concrete image if possible. Vary the syntax across the set. No slogan or metaphor-only headings, no "Why X Matters", no title-case slogans ("Unlocking The Power Of Rules"); use sentence case. Length, format and chapter-subtitle preferences are under Preferences.
  ✗ "The Magic Circle: Where Play Begins" ✓ "Huizinga draws a magic circle around play"
- **Dialogue** (character lines, speech bubbles, companion characters' remarks) appears only when it brings a question, a mistake, a discovery or a feeling. The tone is ordinary: it should sound like someone muttering beside you, with half-sentences and corrections allowed. No cuteness, no characters reciting definitions for the author, no neat question-and-answer pairs.
- **Primary sources** go at the end, collapsed. In the body, give only author and year.

## Audience and register

- **Default reader:** a curious general adult with no background in the field. Explain everything, and don't simplify the ideas themselves.
- **When the project names an audience** (for example Australian Year 9–12 students in the data science course), adjust:
  - Sentence length: shorter on average, with causes linked explicitly ("because", "so", "then").
  - Vocabulary: everyday words, each technical term glossed on first use, idioms the audience actually uses.
  - Spelling and conventions: follow the project's choice consistently, whether Australian/British (colour, organise, behaviour, metre, single quotes) or American (color, organize, behavior, double quotes). Check the project guide, such as `_EN_GUIDE.md`. Never mix the two.
- **Never talk down.** No "Don't worry, this is easy!", no forced slang, no exclamation marks for enthusiasm. Younger readers get shorter sentences and better examples, with the same respect.

## Preferences

These are the user's taste, not questions of right and wrong. If the project guide says otherwise, follow the project; if not, do this.

- **Headings:** no "X: Y" colon format; at most one question heading per chapter (or piece); about 10 words or fewer by default, since a longer one has probably packed in two concepts.
- **Chapter subtitle:** preferably a question in words the reader already knows (✓ "Why does time vanish when you play a game?"); not forced, and if it won't make a question, use one plain sentence.
- **Em dashes:** at most one per paragraph.
- **Emphasis marks** (web courses): at most two of each kind per paragraph, and no bold in running prose. The highlighter goes only on the place where a concept is first named; the emphasis mark (dots or underline, depending on the skin) goes only on the one conclusion or turn in a paragraph that the reader should remember. Use the same CSS classes as the Chinese edition.

## Writing the English edition of a Chinese course

- **Write from meaning, not sentence by sentence.** Read the Chinese paragraph, write down what the reader should understand, then write English that does that. Chinese topic-comment order and four-character rhythms produce translationese when copied: ✗ "How fragile such a loop is, the break-the-loop experiment lets you see for yourself." ✓ "The break-the-loop experiment shows how fragile it is."
- **Restructure paragraphs for English rhythm.** Merge or split sentences and reorder clauses as needed, with the agent as subject and the main verb early. Chinese chains of short clauses joined by commas usually become two sentences, or one sentence with a real connective.
- **Keep everything structural identical:** ids, classes, section order, `data-*` attributes, interaction logic, quiz answers, slider targets and storage keys. Translate only strings.
- **Keep facts and sources identical.** Use the same people, dates, numbers and citations. Use original English titles for books and papers (*Man, Play and Games*), and the original title when quoting a non-English source.
- **Culture-bound examples:** keep the example if an English reader will get the same point, perhaps with a one-clause gloss ("a game of jianzi, kicking a feathered shuttlecock"). Replace it only if an equivalent keeps exactly the same point and doesn't break any interaction or answer. Otherwise explain it briefly. Chinese idioms are rendered by meaning or by their story, never as pinyin.
- **Names:** Western people by their original names. Chinese characters in examples follow the project glossary (pinyin, or given name only).
- The Chinese edition must be final before translation starts.

## Way of working

- **Write:** draft the meaning chain first (see "Write meaning, not figures"), then the prose. Before handing it over, run the self-check in `references/review.md`.
- **Revise:** when the user flags an awkward sentence, don't fix only that sentence. Name the type of problem, find every instance of it in the text and fix them together, showing before/after. When the user says "I don't get it", ask where they got stuck before rewriting.
- **Brief agents:** in any brief for a writing, translation or review agent, include this skill's path and tell the agent to read SKILL.md and both references first; how to write the brief and paste the counterexamples is in content-rules section 8, item 3.
- **Learn:** turn every piece of sentence-level feedback from the user into a rule. Add it to the project's writing guide (such as `_EN_GUIDE.md` or `_BRIEF.md`) if there is one, and add good new examples to the project's own sample file.
