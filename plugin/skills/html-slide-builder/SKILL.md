---
name: html-slide-builder
description: Turn markdown notes, design docs, ERDs, and research into a polished self-contained HTML slide deck. Use when the user wants to create a presentation from source documents, build slides from notes, or turn a technical document into a visual narrative.
---

# Presentation Builder

Transform source documents (markdown, ERDs, meeting notes, research) into a self-contained HTML slide deck using the remote deck base template hosted in `github.com/jac-marais/presentations`. The canonical base assets live under `resources/base/`, and the skill should reference those remote GitHub file URLs directly, then copy them into a target-named local working folder before editing. Features: inline SVG diagrams, Mermaid.js graphs, dark theme, grouped navigation with colored section bars, keyboard navigation, and category badges.

## When to trigger

- User asks to "make a presentation from these notes"
- User provides N documents and asks for slides
- User wants to turn an ERD, RFC, or design doc into a visual narrative
- User says "present this," "slide deck," "deck," or similar

## Core Principle: Graphics First, Text Last

Every slide should lead with a visual and use text only as annotation. This is not a style preference. It is a communication effectiveness rule.

**Why this matters:**

1. **Cognitive load.** A paragraph on a slide forces the audience to read and listen simultaneously. They do neither well. A diagram with a short label lets them absorb the structure instantly and listen to the presenter fill in the meaning.
2. **Retention.** People remember spatial relationships, shapes, and color patterns far longer than sentences. A hub-and-spoke diagram showing how a system connects to its dependencies sticks. Three cards of prose describing those same connections do not.
3. **Signal density.** A well-designed chart or diagram encodes more information per pixel than prose. A declining bar chart communicates trend, magnitude, and time in one glance. The equivalent paragraph takes 40 words and still lands weaker.
4. **Presenter support.** Slides full of text tempt the presenter to read them aloud, which kills the room. Visual slides force the presenter to narrate, which creates a live, engaging experience.

**In practice, this means:**

- Default to Mermaid for any graph-like structure: flows, dependencies, architectures, hierarchies, networks, pipelines, and relationships.
- Use SVG only when the geometry is simple and deterministic: timelines, very simple charts, or annotated layouts where manual placement is easy to get right.
- Text on slides should be limited to: titles (5 words max), axis labels, annotations inside diagrams, and single-sentence captions.
- Prose that explains context, nuance, or narrative belongs in the **speaker notes file**, not on the slide.
- If your first instinct is a card grid with `<h3>` and `<p>` tags, stop. Ask: "Can this be a diagram, chart, visual metaphor, or annotated graphic instead?" Almost always, yes.
- Card grids and bullet points are acceptable only when the content is a flat list of genuinely equal-weight items with no spatial, temporal, or comparative relationship between them.

**The graphic type hierarchy** (prefer earlier options):

| Priority | Type | Best for |
| --- | --- | --- |
| 1 | Line/area charts | Trends, rates, timelines with data |
| 2 | Bar charts | Comparisons of magnitude, volume, counts |
| 3 | Mermaid flow/pipeline diagrams | Processes, data flows, architectures |
| 4 | Mermaid network / hierarchy diagrams | Relationships, dependencies, reach |
| 5 | Side-by-side visual comparisons | Before/after, old/new, option A vs B |
| 6 | Annotated visual metaphors | Abstract concepts (foundations, levers, bridges) |
| 7 | SVG timelines with milestone markers | Chronological narratives |
| 8 | Scorecard / matrix visuals | Multi-criteria evaluation (icons + bars, not text rows) |
| 9 | Tables with visual indicators | Reference data (last resort for comparisons) |
| 10 | Card grids with text | Flat lists with no visual relationship |

## Workflow Overview

```text
Phase 1: Intake & Deep Reading     → understand every source document
Phase 2: Audience & Intent         → who is this for and what should they feel
Phase 3: Narrative Arc             → structure the story
Phase 4: Slide Plan                → detailed per-slide content plan
Phase 5: Build                     → write the HTML
Phase 6: Review & Refine           → iterate with user
```

---

## Phase 1: Intake & Deep Reading

Read every source document the user provides. For each one, extract and note:

- **Core claims**: what does this document argue or propose?
- **Evidence**: what data, examples, or quotes support the claims?
- **Open questions**: what is explicitly unresolved?
- **Reviewer comments**: if the doc has been reviewed (ERDs, RFCs), who said what? What concerns were raised? These are gold for building credibility.
- **Terminology**: what domain-specific words does the audience use? Adopt them.

Do not summarize yet. Build a mental inventory of raw material.

### Clarifying questions to ask

Before structuring anything, ask the user these questions. Do not skip them — wrong assumptions here waste everything downstream.

**Audience:**

- Who will be in the room? (Their roles, seniority, what they care about)
- Is the audience the _author_ of any source documents? If so, the tone must validate before extending.
- Are there people who need to be convinced, or is this informational?

**Intent:**

- What should the audience _do_ after seeing this? (Approve something? Change direction? Fund work? Just understand?)
- Is there a specific decision this deck is meant to support?
- Are there political sensitivities? (Teams whose work must not be criticized, approaches that must be respected)

**Constraints:**

- How long is the presentation slot? (This determines slide count — roughly 1 slide per 1-2 minutes of talk time)
- Will the user present live, or is this a leave-behind document?
- Are there specific things the user wants included or excluded?

**Sources:**

- Are the provided documents the complete source material, or should I search for additional context?
- Which document is the "primary" one (the thing being discussed) vs. supporting material?

Do not proceed to Phase 2 until these are answered.

---

## Phase 2: Audience & Intent Analysis

Based on the answers from Phase 1, determine:

### Narrative posture

Choose ONE primary posture for the deck:

| Posture                         | When to use                                                                                         | Tone                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Validation → Extension**      | Audience built the thing you're discussing. You agree with their direction and want to build on it. | "Your work is strong. Here's what comes next."        |
| **Problem → Solution**          | Audience is experiencing pain. You're proposing a fix.                                              | "Here's the pain. Here's the path out."               |
| **Comparison → Recommendation** | Multiple options exist. You're helping the audience choose.                                         | "Here are the tradeoffs. Here's what I'd pick."       |
| **Education → Implication**     | Audience needs to understand a concept before they can act on it.                                   | "Here's how this works. Here's what it means for us." |
| **Status → Direction**          | Audience needs an update on where things stand and where they're going.                             | "Here's where we are. Here's where we're headed."     |

### Emotional arc

Every effective presentation follows an emotional curve:

```text
Attention → Empathy → Credibility → Tension → Resolution → Call to Action
```

Map this to the slide structure:

- **Attention**: Opening that makes the audience care (1 slide)
- **Empathy**: Show you understand their world (1-2 slides)
- **Credibility**: Demonstrate deep understanding of the domain (2-3 slides)
- **Tension**: Surface the unresolved problem or gap (1-2 slides)
- **Resolution**: Present the answer (2-3 slides)
- **Call to Action**: What happens next (1 slide)

---

## Phase 3: Narrative Arc

Structure the story before writing any content. Produce a numbered slide list with:

1. **Slide title** (5 words max)
2. **Purpose** (one sentence: what does this slide accomplish in the narrative?)
3. **Emotional beat** (which part of the arc: attention, empathy, credibility, tension, resolution, CTA?)
4. **Key content** (bullet points of what goes on this slide)
5. **Evidence source** (which source document provides the material?)

### Rules for good slide structure

- **One idea per slide.** If a slide has two unrelated points, split it.
- **Graphics carry the idea. Text annotates it.** Every slide body should be an SVG diagram, chart, visual comparison, or annotated graphic. If the content can be shown visually, it must be. Prose cards are the fallback, not the default. See "Core Principle: Graphics First, Text Last" above.
- **Quote the source material.** Direct quotes from ERDs, reviewer comments, or data build credibility. Attributed quotes are stronger than paraphrased claims.
- **Never make claims you can't source.** If you're drawing a conclusion, show the evidence trail.
- **Front-load the audience's language.** Use their terminology, their acronyms, their framing — then extend it.
- **Tension before resolution.** Don't present the answer before the audience feels the problem.
- **The comparison table goes last.** Summary tables are reference material, not narrative. Put them at the end for Q&A.

### Ask for user approval

Present the slide outline and ask for approval before building. This is the cheapest place to course-correct. Specifically ask:

- "Does this ordering tell the right story?"
- "Is anything missing that you expected to see?"
- "Are there slides here that feel unnecessary?"

---

## Phase 4: Slide Plan

For each approved slide, write a detailed content spec:

```markdown
### Slide N: [Title]

- Primary graphic: [describe the Mermaid graph, chart, SVG timeline, or visual — this is required for every slide]
- Graphic type: [mermaid graph | chart | comparison | metaphor | timeline | scorecard]
- Layout: [full-width | two-column | diagram+callouts | card grid | table]
- On-slide text: [title, axis labels, annotations, caption — keep minimal]
- Quotes: [any attributed quotes with source]
- Color accent: [which theme color dominates this slide]
- Speaker note: [context and narrative the presenter speaks aloud, not shown on the slide]
```

Every slide plan must have a `Primary graphic` entry. If you cannot define one, reconsider whether the slide's content has a spatial, temporal, comparative, or structural relationship that a graphic can express. If it truly does not (rare), document why and default to a card grid.

If the slide contains a graph-like structure, it must use Mermaid. Do not switch to custom SVG just because Mermaid feels limiting. Instead, simplify the graph until Mermaid can express it cleanly.

### Layout patterns available

| Pattern | Best for |
| --- | --- |
| **Diagram + callouts** | Architecture slides only when the Mermaid graph still remains large and readable. If the graph gets cramped, switch to full-width Mermaid and move the callouts to another slide. |
| **Two-column comparison** | Before/after, tradeoffs, option A vs option B comparisons. |
| **Card grid** | Listing N items of equal weight (event types, features, team responsibilities). |
| **Full-width diagram** | The default for Mermaid graphs. Use the whole viewport so the graph is large enough to read at presentation distance. Also appropriate for simple SVG timelines. |
| **Full-width table** | Comparison matrices, feature tables. Put these at the end. |
| **Background texture + foreground content** | When you want to show supporting evidence (reviewer quotes, code snippets) without it competing for primary attention. Tilt background elements 5-6 degrees, 35% opacity. |

### Layout decision rules: columns vs rows vs full-width

Choosing the wrong axis wastes space and causes overflow. Every layout decision should follow the content's natural shape, not a default habit.

**The core rule: match layout axis to content shape.**

A slide is roughly 16:9. It has more horizontal space than vertical space. Vertical overflow causes scrollbars, which break MCP slide export tools and hide content from the audience. Horizontal waste (empty gutters beside a narrow element) makes the slide feel sparse and unfinished.

**When to use two-column (`two-col`):**

- Both elements are roughly the same height (neither dwarfs the other)
- The elements are being compared or contrasted (code vs code, diagram vs explanation, before vs after)
- Each element is wide enough to fill its column without awkward whitespace
- A tall-but-narrow element (like a vertical Mermaid flowchart) pairs with a shorter text block: put the diagram in one column, the annotations in the other. This uses both axes efficiently instead of stacking the diagram above text that then overflows

**When NOT to use two columns:**

- One element is dramatically taller than the other (the short column wastes vertical space)
- The elements have no comparative relationship (they're sequential, not parallel)
- Either element needs more than half the viewport width to be readable (code blocks with long lines, wide Mermaid LR graphs, tables with many columns)

**When to stack vertically (default single-column):**

- Content flows sequentially: title, then diagram, then caption
- A single element needs the full width to be readable
- You have one primary element (a diagram or code block) with a short caption below it

**When to use full-width:**

- Mermaid diagrams with many nodes that need horizontal breathing room
- Tables with 4+ columns
- Code blocks with lines longer than ~60 characters
- SVG timelines that span a date range

**Mermaid direction and layout pairing:**

The Mermaid `flowchart` direction determines the diagram's aspect ratio. Choose the direction that fits the available space:

| Mermaid direction | Shape produced | Best layout pairing |
| --- | --- | --- |
| `flowchart LR` (left-to-right) | Wide and short | Full-width single column. Do NOT put LR graphs in a two-column layout: they need the width. |
| `flowchart TB` (top-to-bottom) | Tall and narrow | Two-column layout with annotations beside it, OR full-width if the graph is very tall. |
| `flowchart TD` (top-down, same as TB) | Tall and narrow | Same as TB. |
| `sequenceDiagram` | Tall and moderate width | Full-width. Sequence diagrams need vertical space for message arrows. |

**The overflow test (mental model):**

Before finalizing a slide layout, mentally check: "If I put all these elements in this arrangement on a 100vh slide, does any content get pushed below the fold?" If yes, either:
1. Switch to a layout that uses space more efficiently (e.g., side-by-side instead of stacked)
2. Reduce content (shorten code blocks, simplify diagrams)
3. Split into two slides

Never allow a slide to scroll. Scrolling content is invisible to screenshot-based export tools and to audience members who can't scroll.

---

## Phase 5: Build

### Base template and component library

Presentations are built from these canonical remote GitHub file URLs:

- **Repo**: `https://github.com/jac-marais/presentations`
- **CSS**: `https://github.com/jac-marais/presentations/blob/main/resources/base/deck-base.css`
- **Components**: `https://github.com/jac-marais/presentations/blob/main/resources/base/deck-components.js`
- **Demo**: `https://github.com/jac-marais/presentations/blob/main/resources/base/deck-demo.html`

The source of truth is the remote repo, not any local checkout. Because the repo is private, use `gh api` against those same repo paths to fetch file contents instead of relying on unauthenticated `raw.githubusercontent.com` URLs.

Canonical repo paths:

- `resources/base/deck-base.css`
- `resources/base/deck-components.js`
- `resources/base/deck-demo.html`

**Read the remote `deck-demo.html` source before building** to understand the available components and their APIs.

### Output location

The default output location is **next to the source document**, not in the presentations repo. The presentations repo holds only the base template; generated decks live alongside the content they were built from.

For example, if the source document is `/path/to/study/CloudEvents.md`, the deck goes in `/path/to/study/cloudevents-spec/`.

If the user provides an explicit output path, use that instead.

### Initial local workspace setup

Before writing slides, create a target-named local working folder and copy the remote base files into it.

If the source document is at `/notes/study/CloudEvents.md` and the deck slug is `cloudevents-spec`, create:

```text
/notes/study/cloudevents-spec/
  cloudevents-spec.html
  cloudevents-spec-speaker-notes.md
```

Seed the HTML from the remote repo's `deck-demo.html` as a starting point:

- Copy remote `resources/base/deck-demo.html` to `<deck-slug>.html`
- Create `<deck-slug>-speaker-notes.md` locally
- The base CSS and components JS are **inlined** into the HTML (not separate files)

Use `gh api repos/jac-marais/presentations/contents/... --jq .content | base64 --decode` to fetch each file by repo path. If the remote is unreachable, report the error to the user and ask them to ensure access to the `jac-marais/presentations` repository. After this setup, all edits happen against the local deck HTML.

### CRITICAL: Build the HTML in successive rounds, not all at once

**NEVER write all slides in a single tool call.** Inline SVGs make presentations too large to generate in one shot.

**Round 1 — Create the local shell.** Start from the copied local `<deck-slug>.html` file, replacing the demo content with the real deck shell. The shell includes:

- Google Fonts link for the chosen font pairing
- The full local `<deck-slug>-base.css` content inlined in a `<style>` block
- A `<style>` override setting `--font` to the chosen display font
- The full local `<deck-slug>-components.js` content inlined in a `<script type="module">` block
- If the deck uses Mermaid diagrams: `<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js">` + initialization script
- `<deck-nav></deck-nav>` in the body
- A `<!-- REMAINING SLIDES BELOW -->` placeholder
- The first slide with `class="slide in-view"` (pre-visible before JS runs)

**Round 2+** — Add slides in batches of 4-8 using the Edit tool, replacing `<!-- REMAINING SLIDES BELOW -->` markers.

**After each round, the file is valid HTML** that opens with a double-click.

| Deck size | Rounds |
| --- | --- |
| Under 15 slides | 1 shell + 1-2 slide rounds |
| 15-30 slides | 1 shell + 3-5 slide rounds |
| 30+ slides | 1 shell + 5-8 slide rounds |

### Web components available

| Component | Usage | Purpose |
| --- | --- | --- |
| `<deck-nav>` | Place once in `<body>` | Auto-generates progress bar, nav dots with group bars, hover tooltip, category badge, keyboard navigation |
| `<deck-diagram max-width="950px">` | Wrap `<svg>` elements | Glassmorphic container for inline SVGs |
| `<deck-card color="blue" heading="Title">` | Wrap content | Glassmorphic card with colored accent bar. Colors: blue, green, orange, purple, cyan, red |
| `<deck-bar label="X" value="60" max="100" color="#hex" note="Y">` | Self-contained | Horizontal bar chart row |

For **Mermaid diagrams** (flowcharts, relationship graphs, sequence diagrams): wrap `<pre class="mermaid">` in a `<div class="diagram-wrap">` (plain CSS class, not the web component, because Mermaid needs light DOM access). Mermaid syntax must be left-aligned (no HTML indentation). Avoid `rgba()` in Mermaid style directives (commas conflict with Mermaid's parser); use hex colors instead.

All graph-like diagrams must use Mermaid. This includes architectures, pipelines, dependency graphs, nested systems, and any "boxes and arrows" explanation.

Mermaid diagrams should usually be **full-width and tall**. They should occupy as much horizontal and vertical space as the slide can reasonably give them. Do not tuck Mermaid graphs into narrow columns, small cards, or tiny centered wrappers.

### CRITICAL: Mermaid SVG sizing

Mermaid generates SVGs with small intrinsic dimensions. The base CSS handles sizing via **height-constraining** (not width-forcing). These rules are already in `deck-base.css` and must be inlined into every deck's `<style>` block:

```css
.diagram-wrap > pre.mermaid,
.diagram-wrap > .mermaid { width: 100%; max-width: none; max-height: 100%; margin: 0; display: flex; justify-content: center; align-items: center; }
.diagram-wrap > pre.mermaid svg,
.diagram-wrap > .mermaid svg { display: block; width: auto !important; max-width: 100% !important; max-height: clamp(260px, 46vh, 560px) !important; height: auto !important; }
```

**Why height-constraining works:** `width: auto !important` preserves the SVG's natural aspect ratio. `max-height` caps the vertical size so diagrams never overflow the viewport. Since aspect ratio is preserved, this naturally limits width too.

**Do NOT use `width: 100% !important`** on Mermaid SVGs — this stretches them to fill the full container width, making every node enormous.

The `.diagram-wrap` container should have `max-width: 900px` to keep the glassmorphic card from spanning the full viewport.

### Unfancy Mermaid rules

Mermaid should be simple, plain, and reliable. Do not try to make it clever.

- Use basic `flowchart TD` or `flowchart LR` unless another Mermaid graph type is clearly better.
- Keep node labels short. One short phrase per node is ideal.
- Do not put manual line breaks inside node labels.
- Do not cram lists, paragraphs, or 10 ideas into one node.
- Prefer more small nodes and subgraphs over one overloaded node.
- Use Mermaid's normal boxes and `subgraph` nesting instead of custom visual tricks.
- Keep arrows, labels, and branches simple and easy to read.
- Styling can be lightly theme-aware, but structure must stay plain.
- Do not force Mermaid to do something it is bad at. If the graph becomes awkward, simplify the content instead of increasing complexity.
- If a Mermaid graph looks small, the first fix is to give it more slide space, not to shrink the text or cram in more detail.
- If a Mermaid graph is still dense at full width, split it across multiple slides.
- Do not use subgraphs. They cause oversized rendering when the SVG is scaled. Use flat graphs with node styling instead.
- Do not use HTML labels (`<b>`, `<br/>`) inside node definitions. Keep labels as plain short text.

Good Mermaid feels almost boring in the source: direct node definitions, direct edges, simple subgraphs, minimal styling.

### Slide grouping

When a presentation has natural sections (e.g., one person per section, one topic per section), use **slide groups**:

```html
<section class="slide"
  data-group="cerf"
  data-group-label="Vinton Cerf"
  data-group-color="#4ade80">
  <h1>Title</h1>
  <h2>Subtitle</h2>
  <deck-diagram>...</deck-diagram>
</section>
```

**What grouping provides automatically** (via `<deck-nav>`):

- **Colored group bars** appear behind the nav dots, showing which dots belong to the same section
- **Category badge** appears top-left showing the group label; hides on ungrouped slides
- **Active dot** lights up in the group's color; inactive dots stay gray
- **Hover tooltip** shows slide title tinted in the group's color
- On hover, the nav pill expands and dots slide left, clearly revealing the group bars

**Important**: Do NOT add a `.kicker` badge above the title on grouped slides. The top-left badge already identifies the section. Only use `.kicker` on ungrouped slides (like title/summary slides) where no badge appears.

### Typography

Import a distinctive display font and a monospace font from Google Fonts. Set in `:root` override:

```css
:root { --font: 'DM Sans', sans-serif; }
```

Good pairings: DM Sans + JetBrains Mono, Outfit + IBM Plex Mono, Instrument Sans + Fira Code.

The base CSS defaults `--font-mono` to JetBrains Mono. Override if needed.

### Color system

The base CSS defines the standard palette in `:root`. Override individual colors in the presentation's `<style>` block if needed. The standard palette:

| Variable | Hex | Semantic purpose |
| --- | --- | --- |
| `--blue` | `#4ea8de` | Primary elements, informational |
| `--green` | `#4ade80` | Positive, solutions, success |
| `--orange` | `#f59e0b` | Warnings, in-progress |
| `--purple` | `#a78bfa` | Infrastructure, architecture |
| `--red` | `#f87171` | Problems, errors, pain points |
| `--cyan` | `#22d3ee` | Protocols, code, technical |
| `--accent` | `#6366f1` | Interactive elements, default |

Assign colors semantically and consistently across all slides.

### SVG diagram guidelines

- SVG is the exception, not the default.
- Use SVG only for visuals that are easy to place correctly by hand: timelines, simple bars, simple annotated zones, or other deterministic layouts.
- Do not use SVG for architectures, dependency graphs, hierarchies, or complex relationship diagrams. Those should be Mermaid.
- Wrap SVGs in `<deck-diagram max-width="Npx">` for the glassmorphic container
- Use `viewBox` for scaling; the component sets `width: 100%` automatically
- Text in SVG: use classes from the shared `resources/base/deck-base.css` file (`label-bright`, `label-dim`, `label-title`, `label-blue`, `label-green`, etc.)
- Use `font-family: var(--font)` for most labels; reserve `var(--font-mono)` for short identifiers
- **Long labels**: use `textLength` and `lengthAdjust="spacingAndGlyphs"` to prevent overflow
- Add `filter: drop-shadow(...)` on boxes for depth
- Arrows: `<line>` + `<polygon>` arrowheads, subtle opacity
- Boxes: `<rect>` with `rx`, 4-6px extra height for breathing room
- **viewBox must fit all content**: verify height exceeds max y-coordinate by at least 20px
- **Route connector lines around text, not through it**
- **Minimum annotation font size is 11px** with `font-weight="500"`
- **Prefer timelines** for chronological content because they are reliable to draw correctly in SVG
- **Use Mermaid** for relationship graphs, flowcharts, architectures, hierarchies, pipelines, and sequence diagrams instead of hand-positioning SVG nodes

### Writing style

- No em dashes. Use colons, commas, semicolons, or periods.
- No emojis.
- Bold for emphasis, not italics (italics are hard to read on projectors).
- Slide titles: 5 words max. Tell the story: "What Isn't Portable Yet" not "Portability Analysis."
- Attributed quotes: use `<blockquote>` with a `<span class="source">` below.

---

## Phase 6: Review & Refine

After building, open the file in the browser and present it to the user. Ask:

1. "Walk through it — does the story flow?"
2. "Any slides where the content doesn't match what you'd say out loud?"
3. "Are the diagrams readable at presentation distance?"
4. "Anything to cut? Shorter is almost always better."

### Common refinement requests and how to handle them

| Request                                    | Approach                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| "This slide is too dense"                  | Split into two slides, or move detail into speaker notes                                                     |
| "The diagram is too small"                 | Switch to full-width layout, remove side callouts                                                            |
| "Text is hard to read"                     | Check contrast, bump font size, remove opacity modifiers                                                     |
| "I want to emphasize X"                    | Add a colored accent border, make it a standalone callout, or give it its own slide                          |
| "The order feels wrong"                    | Re-examine the emotional arc. Usually the problem is tension coming too late or resolution coming too early  |
| "This feels like it criticizes their work" | Reframe as a question ("What remains to solve?") or attribute the concern to a third party (reviewer quotes) |

### Speaker notes

Generate a sibling markdown file (`[deck-name]-speaker-notes.md`) with:

```markdown
## Slide N — [Title]

- Key points to say (not read from the slide)
- Where to pause
- Which quote to read aloud
- Anticipated questions and how to handle them
```

---

## Output Checklist

Before delivering the final deck, verify:

**Structure:**

- [ ] A target-named working folder was created **next to the source document** (not in the presentations repo)
- [ ] The base CSS and components JS are inlined into the HTML `<style>` and `<script type="module">` blocks
- [ ] The inlined CSS includes the Mermaid SVG scaling rules (`width: auto !important`, `max-height: clamp(...)` etc.)
- [ ] `<deck-nav>` is present in the body (provides all navigation automatically)
- [ ] First slide has `class="slide in-view"` (visible before JS loads)
- [ ] `--font` is set in a `:root` override to the chosen display font
- [ ] File opens correctly with a double-click (no server needed)

**Content:**

- [ ] Every slide body leads with a graphic (SVG, chart, Mermaid, or visual), not prose cards
- [ ] On-slide text is limited to titles, labels, annotations, and short captions
- [ ] Explanatory prose lives in speaker notes, not on slides
- [ ] No `.kicker` badges on grouped slides (top-left badge already shows the group)
- [ ] `.kicker` badges only on ungrouped slides (title, summary)

**Layout and overflow:**

- [ ] No slide requires scrolling. All content fits within 100vh. If a slide overflows, it was split, reorganized, or trimmed.
- [ ] Layout axis matches content shape: wide elements get full-width rows; tall-narrow elements get a column beside their annotations
- [ ] Mermaid `flowchart LR` graphs are never in a two-column layout (they need the width)
- [ ] Mermaid `flowchart TB/TD` graphs in two-column layouts are paired with annotation text in the adjacent column
- [ ] Two-column layouts are only used when both sides have roughly equal height (no large empty gutters)
- [ ] Code blocks and tables that need >50% viewport width are full-width, not crammed into a column
- [ ] No orphaned captions pushed below the fold by a diagram that takes too much vertical space

**Grouping:**

- [ ] Related slides share the same `data-group`, `data-group-label`, and `data-group-color`
- [ ] Group colors are distinct hex values (not CSS variable references)
- [ ] Nav dots show colored group bars behind them

**Diagrams:**

- [ ] All graph-like diagrams use Mermaid rather than custom SVG
- [ ] Mermaid source is plain and "unfancy": short labels, no manual line breaks, no overloaded nodes
- [ ] Mermaid graphs use a full-width layout unless there is a strong reason not to
- [ ] Mermaid graphs occupy enough vertical space to be readable at presentation distance
- [ ] Dense Mermaid graphs are split across slides instead of being shrunk to fit
- [ ] SVGs are wrapped in `<deck-diagram>` (not raw `<div>` wrappers)
- [ ] Mermaid `<pre>` elements are in `<div class="diagram-wrap">` (not `<deck-diagram>`, Mermaid needs light DOM)
- [ ] `diagram-wrap` has `max-width: 900px` (from base CSS)
- [ ] Mermaid SVGs use `width: auto !important` and `max-height: clamp(...)` (NOT `width: 100% !important`)
- [ ] No subgraphs in Mermaid diagrams (they cause oversized rendering)
- [ ] No HTML labels (`<b>`, `<br/>`) in Mermaid node labels (they inflate node size)
- [ ] Mermaid syntax is left-aligned (no HTML indentation), no `rgba()` in style directives
- [ ] SVG is only used for simple deterministic layouts such as timelines or similarly easy hand-positioned visuals
- [ ] SVG viewBox height exceeds max y-coordinate by at least 20px
- [ ] Connector lines route around text, not through it
- [ ] Annotation labels are at least 11px with font-weight 500
- [ ] SVG labels use `textLength` on long names to prevent overflow

**Visual:**

- [ ] Color coding is consistent and semantic across slides
- [ ] Cards use `<deck-card color="X">` (not manual `.card` CSS)
- [ ] Bar charts use `<deck-bar>` (not manual HTML)
- [ ] Tables use `.table-wrap` container
- [ ] No em dashes in visible text
- [ ] Speaker notes file exists alongside the HTML

---

## Sync With Claude Code Plugin

When this main skill changes, mirror the substantive `html-slide-builder` skill changes into the active `claude-code` PR that updates `plugins/html-slide-builder/skills/html-slide-builder/SKILL.md`.

Once that PR is merged, look for the current open PR that changes that plugin skill and commit there instead.

If no such PR exists, open a new PR for the plugin skill and keep the user informed before and during that work.
