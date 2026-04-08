/* ============================================
   Deck Components — Lit web components for presentations
   Requires: https://esm.sh/lit@3?bundle
   ============================================ */

import { LitElement, html, css } from 'https://esm.sh/lit@3?bundle';

// --- Utility ---
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(99,102,241,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ============================================
   <deck-nav>
   Place once in <body>. Auto-discovers .slide sections.
   Renders: progress bar, nav dots (grouped by color),
   hover tooltip, and category badge.

   Slides use data attributes for grouping:
     data-group="name"        — group key (colors the dot)
     data-group-label="Name"  — shown in top-left badge
     data-group-color="#hex"   — hex color for this group
   ============================================ */
class DeckNav extends LitElement {
  static properties = {
    _current: { state: true },
    _progress: { state: true },
    _tipVisible: { state: true },
    _tipY: { state: true },
    _tipRight: { state: true },
    _tipNum: { state: true },
    _tipText: { state: true },
    _tipColor: { state: true },
  };

  static styles = css`
    :host { display: contents; }

    .progress {
      position: fixed; top: 0; left: 0; height: 3px;
      background: linear-gradient(90deg, var(--accent, #6366f1), var(--blue, #4ea8de), var(--cyan, #22d3ee));
      z-index: 1000; transition: width 0.15s ease; border-radius: 0 2px 2px 0;
    }

    .dots {
      position: fixed; right: 2rem; top: 50%; transform: translateY(-50%);
      display: flex; flex-direction: column; gap: 8px; z-index: 999;
      padding: 12px 8px; background: rgba(16,16,28,0.6);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border, #2a2a3a); border-radius: 20px;
    }

    .dot {
      width: 8px; height: 8px; border-radius: 50%; cursor: pointer;
      transition: all 0.25s ease; border: none; padding: 0;
      background: var(--dim);
    }
    .dot:hover { transform: scale(1.3); filter: brightness(1.5); }
    .dot.active {
      background: var(--clr); transform: scale(1.3);
      box-shadow: 0 0 8px var(--glow);
    }

    .tooltip {
      position: fixed; z-index: 1001; pointer-events: none;
      padding: 0.4rem 0.75rem; background: rgba(16,16,28,0.88);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border, #2a2a3a); border-radius: 8px;
      font-family: var(--font, sans-serif); font-size: 0.78rem; font-weight: 500;
      color: var(--text-bright, #fff); white-space: nowrap;
      opacity: 0; transform: translateX(8px);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .tooltip.visible { opacity: 1; transform: translateX(0); }
    .tip-num { color: var(--text-dim, #9898b8); margin-right: 0.3rem; }

    .badge {
      position: fixed; top: 1.2rem; left: 1.5rem; z-index: 999;
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.45rem 1rem 0.45rem 0.7rem;
      background: rgba(16,16,28,0.7); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--border, #2a2a3a); border-radius: 100px;
      font-family: var(--font, sans-serif); font-size: 0.85rem; font-weight: 600;
      transition: opacity 0.3s ease, color 0.3s ease, border-color 0.3s ease;
      opacity: 0; pointer-events: none;
    }
    .badge.visible { opacity: 1; }
    .badge-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      transition: background 0.3s ease;
    }

    @media (max-width: 900px) {
      .dots {
        top: auto; bottom: 1rem; right: 50%; transform: translateX(50%);
        flex-direction: row; gap: 6px; padding: 8px 12px;
      }
      .tooltip { display: none; }
    }
  `;

  constructor() {
    super();
    this._current = 0;
    this._progress = 0;
    this._tipVisible = false;
    this._tipY = 0;
    this._tipRight = 0;
    this._tipNum = '';
    this._tipText = '';
    this._tipColor = '';
    this._slides = [];
    this._data = [];
    this._raf = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // Wait one frame for all slides to be in the DOM
    requestAnimationFrame(() => requestAnimationFrame(() => this._setup()));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
    document.removeEventListener('keydown', this._kd);
    window.removeEventListener('scroll', this._sc);
    window.removeEventListener('resize', this._sc);
  }

  _setup() {
    this._slides = [...document.querySelectorAll('.slide')];
    const fallback = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';

    this._data = this._slides.map(s => {
      const color = s.dataset.groupColor || fallback;
      return {
        group: s.dataset.group || '',
        label: s.dataset.groupLabel || '',
        color,
        dim: hexToRgba(color, 0.25),
        glow: hexToRgba(color, 0.4),
        title: s.querySelector('h1')?.textContent || '',
      };
    });

    // Observer
    this._observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          const idx = this._slides.indexOf(e.target);
          if (idx >= 0) this._current = idx;
        }
      });
    }, { threshold: 0.5 });
    this._slides.forEach(s => this._observer.observe(s));
    if (this._slides[0]) this._slides[0].classList.add('in-view');

    // Keyboard
    this._kd = this._onKey.bind(this);
    document.addEventListener('keydown', this._kd);

    // Scroll
    this._sc = () => {
      if (!this._raf) {
        this._raf = requestAnimationFrame(() => {
          this._raf = null;
          const y = window.scrollY;
          const h = document.documentElement.scrollHeight - window.innerHeight;
          this._progress = h > 0 ? (y / h) * 100 : 0;
        });
      }
    };
    window.addEventListener('scroll', this._sc, { passive: true });
    window.addEventListener('resize', this._sc);
    this._sc();
    this.requestUpdate();
  }

  _onKey(e) {
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      this._slides[Math.min(this._current + 1, this._slides.length - 1)]?.scrollIntoView({ behavior: 'smooth' });
    }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      this._slides[Math.max(this._current - 1, 0)]?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  _showTip(e, i) {
    const r = e.target.getBoundingClientRect();
    this._tipY = r.top + r.height / 2 - 14;
    this._tipRight = window.innerWidth - r.left + 12;
    this._tipNum = String(i + 1);
    this._tipText = this._data[i]?.title || '';
    this._tipColor = this._data[i]?.color || '';
    this._tipVisible = true;
  }

  _hideTip() { this._tipVisible = false; }

  render() {
    const cur = this._data[this._current];
    return html`
      <div class="progress" style="width:${this._progress}%"></div>

      <div class="dots">
        ${this._data.map((d, i) => html`
          <button class="dot ${i === this._current ? 'active' : ''}"
            style="--clr:${d.color};--dim:${d.dim};--glow:${d.glow}"
            @click=${() => this._slides[i]?.scrollIntoView({ behavior: 'smooth' })}
            @mouseenter=${(e) => this._showTip(e, i)}
            @mouseleave=${() => this._hideTip()}></button>
        `)}
      </div>

      <div class="tooltip ${this._tipVisible ? 'visible' : ''}"
        style="top:${this._tipY}px;right:${this._tipRight}px;border-color:${this._tipColor}44">
        <span class="tip-num">${this._tipNum}.</span>
        <span style="color:${this._tipColor}">${this._tipText}</span>
      </div>

      ${cur?.label ? html`
        <div class="badge visible" style="color:${cur.color};border-color:${hexToRgba(cur.color, 0.3)}">
          <span class="badge-dot" style="background:${cur.color}"></span>
          <span>${cur.label}</span>
        </div>
      ` : html`<div class="badge"></div>`}
    `;
  }
}
customElements.define('deck-nav', DeckNav);


/* ============================================
   <deck-diagram max-width="950px">
     <svg>...</svg>
   </deck-diagram>
   Glassmorphic container for inline SVGs.
   ============================================ */
class DeckDiagram extends LitElement {
  static properties = {
    maxWidth: { type: String, attribute: 'max-width' },
  };

  static styles = css`
    :host { display: flex; justify-content: center; width: 100%; }
    .wrap {
      background: rgba(16,16,28,0.6);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--border, #2a2a3a);
      border-radius: 16px; padding: 2rem;
      box-shadow: 0 8px 50px rgba(0,0,0,0.25);
      width: 100%; display: flex; justify-content: center;
    }
    ::slotted(svg) { width: 100%; height: auto; }
    ::slotted(.mermaid) { width: 100%; display: flex; justify-content: center; }
  `;

  constructor() { super(); this.maxWidth = '1000px'; }

  render() {
    return html`<div class="wrap" style="max-width:${this.maxWidth}"><slot></slot></div>`;
  }
}
customElements.define('deck-diagram', DeckDiagram);


/* ============================================
   <deck-card color="blue" heading="Title">
     <p>Content</p>
   </deck-card>
   Glassmorphic card with colored accent bar.
   Colors: blue, green, orange, purple, cyan, red (or omit for default accent).
   ============================================ */
class DeckCard extends LitElement {
  static properties = {
    color: { type: String },
    heading: { type: String },
  };

  static styles = css`
    :host { display: block; }
    .card {
      background: var(--bg-card, rgba(22,22,36,0.65));
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border, #2a2a3a);
      border-radius: 16px; padding: 1.5rem 2rem;
      position: relative; box-shadow: 0 8px 60px rgba(0,0,0,0.3);
    }
    .bar {
      position: absolute; top: 0; left: 1.5rem; right: 1.5rem;
      height: 3px; border-radius: 0 0 3px 3px;
    }
    .heading {
      font-weight: 600; font-size: 1rem; margin-bottom: 0.75rem;
      font-family: var(--font, sans-serif);
    }
    ::slotted(*) {
      font-family: var(--font, sans-serif);
      color: var(--text, #d8d8e8);
      line-height: 1.6;
    }
  `;

  static _gradients = {
    blue:   ['#4ea8de', '#22d3ee'],
    green:  ['#4ade80', '#22d3ee'],
    orange: ['#f59e0b', '#f87171'],
    purple: ['#a78bfa', '#6366f1'],
    cyan:   ['#22d3ee', '#4ea8de'],
    red:    ['#f87171', '#f59e0b'],
  };
  static _textColors = {
    blue: '#4ea8de', green: '#4ade80', orange: '#f59e0b',
    purple: '#a78bfa', cyan: '#22d3ee', red: '#f87171',
  };

  constructor() { super(); this.color = ''; this.heading = ''; }

  render() {
    const [a, b] = DeckCard._gradients[this.color] || ['#6366f1', '#4ea8de'];
    const tc = DeckCard._textColors[this.color] || 'var(--text-bright, #fff)';
    return html`
      <div class="card">
        <div class="bar" style="background:linear-gradient(90deg,${a},${b})"></div>
        ${this.heading ? html`<div class="heading" style="color:${tc}">${this.heading}</div>` : ''}
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('deck-card', DeckCard);


/* ============================================
   <deck-bar label="Item" value="60" max="100" color="#f87171" note="Rust">
   </deck-bar>
   Horizontal bar chart row.
   ============================================ */
class DeckBar extends LitElement {
  static properties = {
    label: { type: String },
    value: { type: Number },
    max:   { type: Number },
    color: { type: String },
    note:  { type: String },
  };

  static styles = css`
    :host { display: block; }
    .row {
      display: flex; align-items: center; gap: 0.7rem; padding: 0.3rem 0;
    }
    .label {
      min-width: 120px; text-align: right; font-size: 0.82rem; font-weight: 500;
      color: var(--text-bright, #fff); font-family: var(--font, sans-serif);
    }
    .track {
      flex: 1; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.03); overflow: hidden;
    }
    .fill {
      height: 100%; border-radius: 4px; display: flex; align-items: center;
      padding-left: 0.5rem; font-family: var(--font-mono, monospace);
      font-size: 0.72rem; font-weight: 600; transition: width 0.6s ease; max-width: 100%;
    }
    .note {
      font-size: 0.7rem; width: 80px; text-align: right;
      font-family: var(--font-mono, monospace);
    }
  `;

  constructor() {
    super();
    this.label = ''; this.value = 0; this.max = 100;
    this.color = '#6366f1'; this.note = '';
  }

  render() {
    const pct = this.max > 0 ? (this.value / this.max) * 100 : 0;
    const bg = hexToRgba(this.color, 0.25);
    const bd = hexToRgba(this.color, 0.4);
    return html`
      <div class="row">
        <span class="label">${this.label}</span>
        <div class="track">
          <div class="fill" style="width:${pct}%;background:${bg};border:1px solid ${bd};color:${this.color}">
            ${this.value}
          </div>
        </div>
        ${this.note ? html`<span class="note" style="color:${this.color}">${this.note}</span>` : ''}
      </div>
    `;
  }
}
customElements.define('deck-bar', DeckBar);
