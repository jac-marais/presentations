# Presentations

Self-contained HTML slide decks, deployed via GitHub Pages.

## Two ways to build a deck

**Standalone (no dependencies).** Copy `sample-presentation.html` and edit the content. One file with all CSS, JS, and SVG inline. Good for quick one-off decks that never need to share styling with anything else.

**Base system (reusable components).** Seed from `resources/base/deck-demo.html` and replace the demo content. Uses shared CSS primitives plus Lit web components (`<deck-nav>`, `<deck-diagram>`, `<deck-card>`, `<deck-bar>`) loaded from CDN. Good for decks that benefit from consistent styling, grouped navigation, Mermaid diagrams, and declarative data visualizations.

## Files

| File | Purpose |
| ---- | ------- |
| `index.html` | Landing page listing available decks |
| `sample-presentation.html` | Standalone single-file template |
| `resources/base/deck-base.css` | Canonical base CSS: variables, layout, typography, tables, SVG label classes |
| `resources/base/deck-components.js` | Lit components: `<deck-nav>`, `<deck-diagram>`, `<deck-card>`, `<deck-bar>` |
| `resources/base/deck-demo.html` | Component showcase and seed template for new base-system decks |

The base system expects `deck-base.css` and `deck-components.js` to be **inlined** into each deck's HTML so every deck is a single double-clickable file. `deck-demo.html` is already set up this way and is the recommended starting point for base-system decks.

## Usage

- **View locally:** double-click any `.html` file — no build step, no server
- **View deployed:** visit the GitHub Pages URL (private, requires repo access)

## Features

Both paths share:

- Keyboard navigation (arrow keys, spacebar, Page Up / Page Down)
- Scroll-snap slide alignment
- Scroll progress bar
- IntersectionObserver entrance animations
- Responsive layout
- Dark theme with CSS custom properties

Base-system decks additionally provide:

- Colored nav-dot groups with hover tooltips
- Category badges that react to the currently visible section
- Glassmorphic diagram containers and cards
- Declarative bar charts (`<deck-bar>`) and Mermaid flowcharts/sequence diagrams
