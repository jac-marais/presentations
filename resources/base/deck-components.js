import { LitElement, html, css } from 'https://esm.sh/lit@3?bundle';

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(99,102,241,${alpha})`;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

class DeckNav extends LitElement {
  static properties = {
    _current: { state: true }, _progress: { state: true },
    _tipVisible: { state: true }, _tipY: { state: true }, _tipRight: { state: true },
    _tipNum: { state: true }, _tipText: { state: true }, _tipColor: { state: true },
  };
  static styles = css`
    :host { display: contents; }
    .progress { position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--accent,#6366f1),var(--blue,#4ea8de),var(--cyan,#22d3ee));z-index:1000;transition:width .15s ease;border-radius:0 2px 2px 0; }
    .nav { position:fixed;right:2rem;top:50%;transform:translateY(-50%);z-index:999;padding:12px 10px;background:rgba(16,16,28,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--border,#2a2a3a);border-radius:20px;transition:padding .3s ease; }
    .nav:hover { padding:12px 10px 12px 22px; }
    .inner { position:relative;display:flex;flex-direction:column;gap:8px;align-items:center; }
    .dot { width:8px;height:8px;border-radius:50%;cursor:pointer;border:none;padding:0;position:relative;z-index:1;background:rgba(136,136,168,0.3);transition:all .25s ease,transform .3s ease; }
    .nav:hover .dot { transform:translateX(-6px); }
    .dot:hover { transform:scale(1.3)!important;background:rgba(136,136,168,0.6); }
    .dot.active { background:var(--clr);transform:scale(1.3);box-shadow:0 0 8px var(--glow); }
    .nav:hover .dot.active { transform:translateX(-6px) scale(1.3); }
    .nav:hover .dot:hover { transform:translateX(-6px) scale(1.3)!important; }
    .group-bar { position:absolute;width:3px;border-radius:2px;z-index:0;left:2.5px;opacity:0.3;transition:opacity .3s ease,left .3s ease; }
    .nav:hover .group-bar { opacity:0.6;left:8.5px; }
    .tooltip { position:fixed;z-index:1001;pointer-events:none;padding:.4rem .75rem;background:rgba(16,16,28,0.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--border,#2a2a3a);border-radius:8px;font-family:var(--font,sans-serif);font-size:.78rem;font-weight:500;color:var(--text-bright,#fff);white-space:nowrap;opacity:0;transform:translateX(8px);transition:opacity .15s ease,transform .15s ease; }
    .tooltip.visible { opacity:1;transform:translateX(0); }
    .tip-num { color:var(--text-dim,#9898b8);margin-right:.3rem; }
    .badge { position:fixed;top:1.2rem;left:1.5rem;z-index:999;display:flex;align-items:center;gap:.6rem;padding:.45rem 1rem .45rem .7rem;background:rgba(16,16,28,0.7);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--border,#2a2a3a);border-radius:100px;font-family:var(--font,sans-serif);font-size:.85rem;font-weight:600;transition:opacity .3s ease,color .3s ease,border-color .3s ease;opacity:0;pointer-events:none; }
    .badge.visible { opacity:1; }
    .badge-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0;transition:background .3s ease; }
    @media(max-width:900px){
      .nav{top:auto;bottom:1rem;right:50%;transform:translateX(50%);padding:8px 12px;}
      .nav:hover{padding:8px 12px;}
      .inner{flex-direction:row;gap:6px;}
      .nav:hover .dot{transform:none;}
      .nav:hover .dot.active{transform:scale(1.3);}
      .group-bar{display:none;}
      .tooltip{display:none;}
    }
  `;
  constructor() { super(); this._current=0;this._progress=0;this._tipVisible=false;this._tipY=0;this._tipRight=0;this._tipNum='';this._tipText='';this._tipColor='';this._slides=[];this._data=[];this._raf=null; }
  connectedCallback() { super.connectedCallback(); requestAnimationFrame(()=>requestAnimationFrame(()=>this._setup())); }
  disconnectedCallback() { super.disconnectedCallback(); this._observer?.disconnect(); document.removeEventListener('keydown',this._kd); window.removeEventListener('scroll',this._sc); window.removeEventListener('resize',this._sc); }
  _setup() {
    this._slides=[...document.querySelectorAll('.slide')];
    const fb=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#6366f1';
    this._data=this._slides.map(s=>{const c=s.dataset.groupColor||fb;return{group:s.dataset.group||'',label:s.dataset.groupLabel||'',color:c,glow:hexToRgba(c,0.4),title:s.querySelector('h1')?.textContent||''};});
    this._runs=[];
    let i=0;
    while(i<this._data.length){
      const g=this._data[i].group;
      if(g){let j=i;while(j<this._data.length&&this._data[j].group===g)j++;this._runs.push({start:i,end:j-1,color:this._data[i].color});i=j;}
      else{this._runs.push({start:i,end:i,color:''});i++;}
    }
    this._observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');const i=this._slides.indexOf(e.target);if(i>=0)this._current=i;}});},{threshold:0.5});
    this._slides.forEach(s=>this._observer.observe(s));
    if(this._slides[0])this._slides[0].classList.add('in-view');
    this._kd=this._onKey.bind(this); document.addEventListener('keydown',this._kd);
    this._sc=()=>{if(!this._raf){this._raf=requestAnimationFrame(()=>{this._raf=null;const y=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;this._progress=h>0?(y/h)*100:0;});}};
    window.addEventListener('scroll',this._sc,{passive:true}); window.addEventListener('resize',this._sc); this._sc(); this.requestUpdate();
  }
  _onKey(e) {
    if(['ArrowDown','ArrowRight',' ','PageDown'].includes(e.key)){e.preventDefault();this._slides[Math.min(this._current+1,this._slides.length-1)]?.scrollIntoView({behavior:'smooth'});}
    if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();this._slides[Math.max(this._current-1,0)]?.scrollIntoView({behavior:'smooth'});}
  }
  _showTip(e,i){const r=e.target.getBoundingClientRect();this._tipY=r.top+r.height/2-14;this._tipRight=window.innerWidth-r.left+12;this._tipNum=String(i+1);this._tipText=this._data[i]?.title||'';this._tipColor=this._data[i]?.color||'';this._tipVisible=true;}
  _hideTip(){this._tipVisible=false;}
  render(){
    const cur=this._data[this._current];
    const bars=(this._runs||[]).filter(r=>r.color).map(r=>{
      const top=r.start*16;
      const height=(r.end-r.start)*16+8;
      return html`<div class="group-bar" style="top:${top}px;height:${height}px;background:${r.color}"></div>`;
    });
    return html`
      <div class="progress" style="width:${this._progress}%"></div>
      <div class="nav">
        <div class="inner">
          ${bars}
          ${this._data.map((d,i)=>html`<button class="dot ${i===this._current?'active':''}" style="--clr:${d.color};--glow:${d.glow}" @click=${()=>this._slides[i]?.scrollIntoView({behavior:'smooth'})} @mouseenter=${(e)=>this._showTip(e,i)} @mouseleave=${()=>this._hideTip()}></button>`)}
        </div>
      </div>
      <div class="tooltip ${this._tipVisible?'visible':''}" style="top:${this._tipY}px;right:${this._tipRight}px;border-color:${this._tipColor}44"><span class="tip-num">${this._tipNum}.</span><span style="color:${this._tipColor}">${this._tipText}</span></div>
      ${cur?.label?html`<div class="badge visible" style="color:${cur.color};border-color:${hexToRgba(cur.color,0.3)}"><span class="badge-dot" style="background:${cur.color}"></span><span>${cur.label}</span></div>`:html`<div class="badge"></div>`}
    `;
  }
}
customElements.define('deck-nav', DeckNav);

class DeckDiagram extends LitElement {
  static properties = { maxWidth:{type:String,attribute:'max-width'} };
  static styles = css`
    :host{display:flex;justify-content:center;width:100%}
    .wrap{background:rgba(16,16,28,0.6);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--border,#2a2a3a);border-radius:16px;padding:2rem;box-shadow:0 8px 50px rgba(0,0,0,0.25);width:100%;display:flex;justify-content:center;}
    ::slotted(svg){width:100%;height:auto;}
    ::slotted(.mermaid){width:100%;display:flex;justify-content:center;}
  `;
  constructor(){super();this.maxWidth='1000px';}
  render(){return html`<div class="wrap" style="max-width:${this.maxWidth}"><slot></slot></div>`;}
}
customElements.define('deck-diagram', DeckDiagram);

class DeckCard extends LitElement {
  static properties = { color:{type:String}, heading:{type:String} };
  static styles = css`
    :host{display:block}
    .card{background:var(--bg-card,rgba(22,22,36,0.65));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--border,#2a2a3a);border-radius:16px;padding:1.5rem 2rem;position:relative;box-shadow:0 8px 60px rgba(0,0,0,0.3);}
    .bar{position:absolute;top:0;left:1.5rem;right:1.5rem;height:3px;border-radius:0 0 3px 3px;}
    .heading{font-weight:600;font-size:1rem;margin-bottom:.75rem;font-family:var(--font,sans-serif);}
    ::slotted(*){font-family:var(--font,sans-serif);color:var(--text,#d8d8e8);line-height:1.6;}
  `;
  static _g={blue:['#4ea8de','#22d3ee'],green:['#4ade80','#22d3ee'],orange:['#f59e0b','#f87171'],purple:['#a78bfa','#6366f1'],cyan:['#22d3ee','#4ea8de'],red:['#f87171','#f59e0b']};
  static _t={blue:'#4ea8de',green:'#4ade80',orange:'#f59e0b',purple:'#a78bfa',cyan:'#22d3ee',red:'#f87171'};
  constructor(){super();this.color='';this.heading='';}
  render(){
    const[a,b]=DeckCard._g[this.color]||['#6366f1','#4ea8de'];
    const tc=DeckCard._t[this.color]||'var(--text-bright,#fff)';
    return html`<div class="card"><div class="bar" style="background:linear-gradient(90deg,${a},${b})"></div>${this.heading?html`<div class="heading" style="color:${tc}">${this.heading}</div>`:''}<slot></slot></div>`;
  }
}
customElements.define('deck-card', DeckCard);

class DeckBar extends LitElement {
  static properties = { label:{type:String}, value:{type:Number}, max:{type:Number}, color:{type:String}, note:{type:String} };
  static styles = css`
    :host{display:block}
    .row{display:flex;align-items:center;gap:.7rem;padding:.3rem 0}
    .label{min-width:120px;text-align:right;font-size:.82rem;font-weight:500;color:var(--text-bright,#fff);font-family:var(--font,sans-serif)}
    .track{flex:1;height:24px;border-radius:4px;background:rgba(255,255,255,0.03);overflow:hidden}
    .fill{height:100%;border-radius:4px;display:flex;align-items:center;padding-left:.5rem;font-family:var(--font-mono,monospace);font-size:.72rem;font-weight:600;transition:width .6s ease;max-width:100%}
    .note{font-size:.7rem;width:80px;text-align:right;font-family:var(--font-mono,monospace)}
  `;
  constructor(){super();this.label='';this.value=0;this.max=100;this.color='#6366f1';this.note='';}
  render(){
    const pct=this.max>0?(this.value/this.max)*100:0;
    return html`<div class="row"><span class="label">${this.label}</span><div class="track"><div class="fill" style="width:${pct}%;background:${hexToRgba(this.color,0.25)};border:1px solid ${hexToRgba(this.color,0.4)};color:${this.color}">${this.value}</div></div>${this.note?html`<span class="note" style="color:${this.color}">${this.note}</span>`:''}</div>`;
  }
}
customElements.define('deck-bar', DeckBar);
