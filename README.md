# Presentations

Personal self-contained HTML slide decks, deployed via GitHub Pages.

## Usage

Each presentation is a single `.html` file with inline CSS, JS, and SVG. No build step or server required.

- **View locally:** double-click any `.html` file
- **View deployed:** visit the GitHub Pages URL (private, requires repo access)
- **Shared base assets:** `resources/base/`
- **Add a new deck:** copy `sample-presentation.html` and edit the content

## Decks

| File | Description |
| ---- | ----------- |
| `sample-presentation.html` | Template deck demonstrating features: dark theme, scroll-snap navigation, inline SVG diagrams, code blocks, and entrance animations |

## Shared Base Assets

| File | Description |
| ---- | ----------- |
| `resources/base/deck-base.css` | Shared presentation CSS primitives, layout helpers, typography, tables, and SVG label classes |
| `resources/base/deck-components.js` | Lit web components for deck navigation, diagram framing, cards, and bars |
| `resources/base/deck-demo.html` | Component showcase and reference deck for the shared base system |

## Features

- Keyboard navigation (arrow keys, spacebar)
- Scroll-snap slide alignment
- Nav dots with title tooltips
- Scroll progress bar
- IntersectionObserver entrance animations
- Responsive layout
- Dark theme with CSS custom properties
- No external dependencies (except Google Fonts)
