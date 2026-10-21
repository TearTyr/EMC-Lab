# Web Project Source Tree and File Contents

- Scanned: `C:/Users/Tinapay/Downloads/EMC-Physics`
- Tree mode: `all`
- Files in tree: `70`
- Directories in tree: `8`
- Source files to dump: `27`
- Source extensions: `.css`, `.html`, `.js`, `.json`, `.jsx`, `.ts`, `.tsx`

## Directory Tree

```text
EMC-Physics/
├── css/
│   ├── fonts.css
│   ├── input.css
│   └── site.css
├── js/
│   ├── common.js
│   ├── home.js
│   ├── quiz-data.js
│   ├── quiz.js
│   ├── sim-circuit.js
│   ├── sim-coulomb.js
│   ├── sim-efield.js
│   ├── sim-generator.js
│   ├── sim-induction.js
│   ├── sim-lorentz.js
│   ├── sim-magnetfield.js
│   └── sim-ohm.js
├── tools/
│   ├── add-font.mjs
│   ├── build-public.mjs
│   ├── check-links.mjs
│   ├── cleanup-repo.ps1
│   ├── perf-audit.mjs
│   ├── smoke-test.mjs
│   └── switch-css.mjs
├── topics/
│   ├── charges.html
│   ├── current.html
│   ├── induction.html
│   └── magnetism.html
├── vendor/
│   ├── fonts/
│   │   ├── .gitkeep
│   │   ├── g8321-100.woff2
│   │   ├── g8321-400.woff2
│   │   ├── g8321-700.woff2
│   │   ├── lilita-one-400.woff2
│   │   ├── m-plus-rounded-1c-700.woff2
│   │   ├── m-plus-rounded-1c-800.woff2
│   │   ├── manifest.json
│   │   ├── OFL-G8321.txt
│   │   └── README.md
│   └── katex/
│       ├── fonts/
│       │   ├── KaTeX_AMS-Regular.woff2
│       │   ├── KaTeX_Caligraphic-Bold.woff2
│       │   ├── KaTeX_Caligraphic-Regular.woff2
│       │   ├── KaTeX_Fraktur-Bold.woff2
│       │   ├── KaTeX_Fraktur-Regular.woff2
│       │   ├── KaTeX_Main-Bold.woff2
│       │   ├── KaTeX_Main-BoldItalic.woff2
│       │   ├── KaTeX_Main-Italic.woff2
│       │   ├── KaTeX_Main-Regular.woff2
│       │   ├── KaTeX_Math-BoldItalic.woff2
│       │   ├── KaTeX_Math-Italic.woff2
│       │   ├── KaTeX_SansSerif-Bold.woff2
│       │   ├── KaTeX_SansSerif-Italic.woff2
│       │   ├── KaTeX_SansSerif-Regular.woff2
│       │   ├── KaTeX_Script-Regular.woff2
│       │   ├── KaTeX_Size1-Regular.woff2
│       │   ├── KaTeX_Size2-Regular.woff2
│       │   ├── KaTeX_Size3-Regular.woff2
│       │   ├── KaTeX_Size4-Regular.woff2
│       │   └── KaTeX_Typewriter-Regular.woff2
│       ├── katex.min.css
│       └── katex.min.js
├── .gitignore
├── bun.lock
├── html.py
├── index.html
├── package.json
├── PRESENTATION-NOTES.md
├── quiz.html
├── README.md
├── SYNC.md
├── tailwind.config.js
├── TESTING.md
└── vercel.json
```

## File Contents

### `css/fonts.css` (1.1 KiB)

````css
/* EMC Physics - self-hosted webfonts.
   ONE family for the whole site: G8321 by Coji Morishita (SIL OFL 1.1),
   three committed weights:
     100 Thin    - oversized display numerals (score grade, topic watermark, ring %)
     400 Regular - body copy, prose, labels (the site's default)
     700 Bold    - headings, buttons, nav, micro-labels
   Titles additionally lead with 'fot-yuruka-std': a PRIVATELY licensed face
   that only machines holding it locally can render (see vendor/fonts/README.md) -
   everywhere else titles cleanly fall back to G8321 Bold, the same family as
   the body. No other webfonts are used. */

@font-face {
  font-family: 'G8321';
  src: url('../vendor/fonts/g8321-100.woff2') format('woff2');
  font-weight: 100;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'G8321';
  src: url('../vendor/fonts/g8321-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'G8321';
  src: url('../vendor/fonts/g8321-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
````

### `css/input.css` (37.9 KiB)

````css
/* ==========================================================================
   EMC Lab — single styling source (Tailwind pipeline)
   File: css/input.css   ->   compiled to css/site.css by `bun run build:css`

   Architecture (cascade layers, no specificity wars):
     @layer base       tokens, font stacks, element resets  (lowest priority)
     @layer components sticker cards / plates / controls   (middle)
     @layer utilities  Tailwind's own utilities              (highest)
   Because layers cascade base < components < utilities, ANY utility class
   in the markup (mt-2, gap-4, font-bold...) always wins over a component or
   element rule of equal-or-lower specificity - no !important, no :where().

   Type system — ONE family site-wide: G8321 by Coji Morishita (SIL OFL 1.1),
   committed woff2, declared in css/fonts.css:
     display numerals -> G8321 Thin 100     (vendor/fonts/g8321-100.woff2)
     body / labels    -> G8321 Regular 400  (vendor/fonts/g8321-400.woff2)
     headings / UI    -> G8321 Bold 700     (vendor/fonts/g8321-700.woff2)
   Titles additionally lead with 'fot-yuruka-std' — a privately licensed face
   that renders only on machines holding it (vendor/fonts manifest hook);
   everywhere else they fall back to G8321 Bold, the same family as the body.
   ========================================================================== */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---------------------------------------------------------------- base ---- */
@layer base {
  :root {
    /* surfaces */
    --bg: #17181c;  --bg-soft: #1b1d22;  --panel: #1b1d22;  --panel-2: #22242b;
    --plate: #101114;                    /* canvas / figure backgrounds */
    --line: #2e3138;  --line-soft: #26282f;  --edge: #3a3d45;
    /* ink */
    --text: #edebe3;  --text-dim: #b9b7ae;  --text-faint: #9a988e;
    /* the five candy pastels + per-hue tint (8%) and edge (40%) */
    --pk: #f8aebe;  --li: #d5b8d8;  --mi: #b5d777;  --sk: #a8d3e0;  --ye: #f6d36b;
    --pk-t: rgba(248,174,190,.08); --pk-e: rgba(248,174,190,.40);
    --li-t: rgba(213,184,216,.08); --li-e: rgba(213,184,216,.40);
    --mi-t: rgba(181,215,119,.08); --mi-e: rgba(181,215,119,.40);
    --sk-t: rgba(168,211,224,.08); --sk-e: rgba(168,211,224,.40);
    --ye-t: rgba(246,211,107,.08); --ye-e: rgba(246,211,107,.40);
    /* shape + rhythm */
    --r-card: 18px; --r-mid: 14px; --r-ctl: 12px;
    --header-h: 58px; --maxw: 1280px; --column: 1060px;
  }

  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; font-size: 16px; }
  @media (min-width: 1200px) { html { font-size: 17px; } }
  @media (max-width: 640px)  { html { font-size: 15.5px; } }

  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: theme('fontFamily.sans'); font-weight: 400;
    line-height: 1.75; min-height: 100vh; min-height: 100dvh;
    overflow-x: clip;
  }
  /* titles/headings: 'fot-yuruka-std' where licensed locally, else G8321 Bold */
  h1, h2, h3, h4, h5, h6 {
    font-family: theme('fontFamily.title');
    font-weight: 700;              /* the real G8321 Bold face — never synthesised */
    font-synthesis: none;
    line-height: 1.35; margin: 0; color: var(--text); letter-spacing: .01em;
  }
  p { margin: 0; }
  ul, ol { margin: 0; padding: 0; }
  a { color: var(--sk); }
  ::selection { background: var(--ye); color: #221d07; }
  :focus-visible { outline: 2px solid var(--sk); outline-offset: 2px; border-radius: 6px; }
  /* metric-independent exponents (display faces carry extreme OS/2 values) */
  sup, sub { vertical-align: baseline; position: relative; line-height: 0; font-size: .72em; }
  sup { top: -.55em; } sub { bottom: -.3em; }
  [id] { scroll-margin-top: calc(var(--header-h) + 14px); }
  [hidden] { display: none !important; }   /* must beat every layer */
}

/* --------------------------------------------------------- components ---- */
@layer components {
  /* -- page frame ------------------------------------------------------ */
  .wrap        { @apply w-full mx-auto px-5; max-width: var(--maxw); }
  /* one content column site-wide: article prose, callouts, sim panels and the
     home hero canvas all share the same 1060 px centre line so every page
     reads at the same width (reviewer feedback: topic pages felt thin next
     to the home page). --maxw stays 1280 px for multi-card grids + nav. */
  .wrap-narrow { max-width: var(--column); }
  .wrap-sim    { max-width: var(--column); }
  .section       { padding-block: 3.4rem; }
  .section-tight { padding-block: 1.15rem; }
  .section-tight.wrap-sim { padding-block: 1.5rem; }
  /* section / colophon divider hairline. this rule MUST exist: with no .hr
     rule of our own, Tailwind preflight paints <hr> with its default light
     border (#e5e7eb), which reads as a stray white line on the dark theme. */
  .hr { border: 0; border-top: 1px solid var(--line-soft); margin: 0; }
  /* topic masthead: air above the title, like an article header */
  .topic-head  { padding-block: 2.8rem 1.6rem; }
  .topic-head .lede { margin-top: .5rem; }
  /* intro paragraphs in the wide column fill it (58ch only stays for the
     centred home hero, where the stack is deliberately narrow) */
  .wrap-narrow .lede { max-width: 100%; }
  .skip-link {
    position: absolute; left: -9999px; top: 0; z-index: 200;
    background: var(--ye); color: #221d07; padding: .5rem 1rem;
    border-radius: 0 0 12px 12px; font-weight: 700; font-family: theme('fontFamily.ui');
  }
  .skip-link:focus { left: 0; }

  /* -- type roles ------------------------------------------------------- */
  .h-hero  { font-size: clamp(1.7rem, 4.4vw, 2.5rem); }
  .h-topic { font-size: clamp(1.45rem, 3.4vw, 2rem); }
  .h-sec   { font-size: clamp(1.15rem, 2.2vw, 1.5rem); margin-bottom: 1rem; }
  .h-sub   { font-size: 1.06rem; margin: 1.8rem 0 .55rem; }
  .lede    { color: var(--text-dim); font-size: 1.04rem; line-height: 1.8; max-width: 58ch; }
  .muted   { color: var(--text-dim); }
  .faint   { color: var(--text-faint); }
  .small   { font-size: .89rem; line-height: 1.65; }
  .tiny    { font-size: .82rem; line-height: 1.55; }
  .mono    { font-family: theme('fontFamily.mono'); }
  .center  { text-align: center; }
  .eyebrow {
    display: inline-block; font-family: theme('fontFamily.ui');
    font-size: .74rem; font-weight: 700; letter-spacing: .22em;
    text-transform: uppercase; color: var(--pk);
  }
  .eyebrow-amber, .eyebrow-violet { color: var(--pk); }
  .accent-cyan, .accent-sky    { color: var(--sk); }
  .accent-amber                { color: var(--ye); }
  .accent-rose                 { color: var(--pk); }
  .accent-emerald              { color: var(--mi); }
  .accent-violet               { color: var(--li); }
  a.link { text-decoration: underline; text-underline-offset: 3px; }

  /* -- header & dropdown nav -------------------------------------------- */
  .site-header { position: sticky; top: 0; z-index: 60; background: var(--bg); border-bottom: 1.5px solid var(--line); }
  .nav-inner { display: flex; align-items: center; gap: 1rem; min-height: var(--header-h); }
  .brand { display: inline-flex; align-items: center; gap: .6rem; text-decoration: none; color: var(--text); font-family: theme('fontFamily.title'); font-weight: 700; }
  .brand-mark { width: 34px; height: 34px; flex: none; }
  .brand-name { font-size: 1.05rem; line-height: 1.15; }
  .brand-name em { font-style: normal; color: var(--pk); }
  .brand-sub { display: block; font-family: theme('fontFamily.ui'); font-size: .6rem; letter-spacing: .18em; text-transform: uppercase; color: var(--text-faint); font-weight: 700; }
  .nav-menu { display: flex; align-items: center; gap: .2rem; margin-left: auto; }
  .nav-link {
    display: inline-block; padding: .45rem .85rem; border-radius: 999px;
    color: var(--text-dim); text-decoration: none; font-family: theme('fontFamily.ui');
    font-size: .9rem; font-weight: 700; white-space: nowrap;
  }
  .nav-link:hover { color: var(--text); background: var(--panel-2); }
  .nav-link.active:not(.nav-cta) { color: var(--text); background: var(--panel-2); }
  .nav-link.nav-cta, .nav-link.nav-cta:hover, .nav-link.nav-cta.active {
    background: var(--pk); color: #2b1418; padding: .45rem 1.05rem; font-weight: 700;
  }
  .nav-link.nav-cta:hover { filter: brightness(1.05); }
  .nav-drop { position: relative; }
  .nav-drop-btn { display: inline-flex; align-items: center; gap: .4rem; }
  .nav-drop-btn svg { transition: transform .15s ease; }
  .nav-drop-btn[aria-expanded="true"] svg { transform: rotate(180deg); }
  .nav-drop-menu {
    position: absolute; top: calc(100% + 10px); left: 50%;
    transform: translateX(-50%) translateY(-4px);
    min-width: 260px; background: var(--panel); border: 1.5px solid var(--line);
    border-radius: var(--r-mid); padding: .4rem; display: grid; gap: 2px;
    opacity: 0; visibility: hidden; z-index: 70;
    transition: opacity .15s ease, transform .15s ease;
  }
  .nav-drop-menu.open { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
  .dd-link { display: grid; gap: .1rem; padding: .55rem .8rem; border-radius: 10px; text-decoration: none; color: var(--text-dim); }
  .dd-link:hover { background: #262830; color: var(--text); }
  .dd-link b { font-family: theme('fontFamily.ui'); font-size: .9rem; font-weight: 700; color: var(--text); }
  .dd-link small { font-size: .74rem; color: var(--text-faint); line-height: 1.45; }
  .dd-link.active { background: var(--sk-t); }
  .dd-link.active b { color: var(--sk); }
  .nav-toggle { display: none; margin-left: auto; width: 46px; height: 42px; background: var(--panel-2); border: 2px solid var(--line); border-radius: 12px; cursor: pointer; }
  .nav-toggle span { display: block; width: 18px; height: 2.5px; margin: 3.5px auto; background: var(--text); border-radius: 2px; }
  .scroll-progress { position: absolute; left: 0; bottom: -1.5px; height: 3px; width: 100%; }
  .scroll-progress i { display: block; height: 100%; width: 0%; background: var(--sk); }

  /* -- stickers: buttons, segments, tags --------------------------------- */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: .45rem;
    padding: .55rem 1.15rem; border-radius: 999px; cursor: pointer;
    font-family: theme('fontFamily.ui'); font-size: .92rem; font-weight: 700;
    text-decoration: none; border: 2px solid var(--edge);
    background: var(--panel-2); color: var(--text); user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: transform .12s ease, border-color .15s ease, background .15s ease;
  }
  .btn:hover { border-color: #4b4e57; background: #262830; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }
  .btn-primary { background: var(--ye); border-color: var(--ye); color: #221d07; }
  .btn-primary:hover { background: var(--ye); filter: brightness(1.07); }
  .btn-amber { background: var(--pk); border-color: var(--pk); color: #2b1418; }
  .btn-ghost { background: transparent; }
  .btn-danger { background: transparent; border-color: var(--pk); color: var(--pk); }
  .btn-danger:hover { background: var(--pk-t); }
  .btn-sm { padding: .35rem .8rem; font-size: .82rem; }
  .btn-block { width: 100%; }
  .btn-group { display: inline-flex; flex-wrap: wrap; gap: .5rem; }
  .seg { display: inline-flex; background: var(--panel-2); border: 2px solid var(--line); border-radius: 999px; padding: 3px; gap: 3px; flex-wrap: wrap; }
  .seg-btn {
    border: 0; background: transparent; color: var(--text-dim); cursor: pointer;
    font-family: theme('fontFamily.ui'); font-size: .84rem; font-weight: 700;
    padding: .38rem .9rem; border-radius: 999px;
  }
  .seg-btn:hover { color: var(--text); }
  .seg-btn[aria-pressed="true"], .seg-btn.active { background: var(--sk); color: #10222b; font-weight: 700; }
  .tag {
    display: inline-flex; align-items: center; gap: .3rem; padding: .14rem .6rem;
    border-radius: 999px; font-family: theme('fontFamily.ui'); font-size: .7rem;
    font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: var(--c, var(--text-faint)); border: 1.5px solid var(--ce, var(--line));
    background: var(--ct, var(--panel-2));
  }
  .tag-cyan,    .accent-c,    .hl-cyan,    .callout-key   { --c: var(--sk); --ct: var(--sk-t); --ce: var(--sk-e); }
  .tag-amber,   .hl-amber,   .callout-warn  { --c: var(--ye); --ct: var(--ye-t); --ce: var(--ye-e); }
  .tag-rose,    .hl-rose,    .callout-trap  { --c: var(--pk); --ct: var(--pk-t); --ce: var(--pk-e); }
  .tag-emerald, .hl-emerald, .callout-real  { --c: var(--mi); --ct: var(--mi-t); --ce: var(--mi-e); }
  .tag-violet,  .hl-violet                  { --c: var(--li); --ct: var(--li-t); --ce: var(--li-e); }

  /* -- cards & panels ---------------------------------------------------- */
  .card {
    background: var(--panel); border: 1.5px solid var(--line);
    border-radius: var(--r-card); padding: 1.35rem 1.4rem;
    transition: border-color .15s ease, transform .16s ease;
  }
  .card > p, .card > .small, .card > .lede { margin: 0; }
  .card-flat { background: var(--bg-soft); }
  .card-hover:hover { border-color: var(--edge); transform: translateY(-2px); }
  .panel { background: var(--panel); border: 1.5px solid var(--line); border-radius: var(--r-card); overflow: hidden; }
  .panel-head {
    display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
    padding: .85rem 1.2rem; border-bottom: 1.5px solid var(--line); background: var(--panel-2);
  }
  .panel-title { font-size: .98rem; font-family: theme('fontFamily.title'); font-weight: 700; display: flex; align-items: center; gap: .55rem; }
  .panel-title .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sk); flex: none; }
  .panel-sub { font-size: .8rem; color: var(--text-faint); }
  .panel-body { padding: 1.1rem; }
  .panel-actions { margin-left: auto; display: flex; gap: .4rem; flex-wrap: wrap; }
  .topic-card { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: .85rem; }
  .topic-card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 5px; background: var(--topic-accent, var(--sk)); }
  .topic-num { position: absolute; right: .7rem; top: .3rem; font-family: theme('fontFamily.ui'); font-size: 3.2rem; font-weight: 100; color: rgba(237,235,227,.07); line-height: 1; pointer-events: none; }
  .topic-icon { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: var(--panel-2); border: 1.5px solid var(--line); }
  .topic-icon svg { width: 25px; height: 25px; stroke: var(--topic-accent, var(--sk)); }
  .topic-list { list-style: none; display: grid; gap: .55rem; }
  .topic-list li { position: relative; padding-left: 1.05rem; font-size: .9rem; line-height: 1.65; color: var(--text-dim); }
  .topic-list li::before { content: "\2022"; position: absolute; left: .1rem; top: 0; color: var(--topic-accent, var(--sk)); font-weight: 700; }

  /* -- simulation plates & controls -------------------------------------- */
  .sim-canvas { display: block; width: 100%; height: 380px; touch-action: none; cursor: crosshair; background: var(--plate); border-bottom: 1.5px solid var(--line); }
  .sim-canvas.tall { height: 440px; }
  .sim-canvas.short { height: 250px; }
  .sim-canvas.chart { height: 150px; cursor: default; }
  .sim-canvas.grab { cursor: grab; }
  .sim-canvas.grabbing { cursor: grabbing; }
  .sim-grid { display: grid; gap: 1.1rem; grid-template-columns: 1fr; }
  .ctl-stack { display: grid; gap: .8rem; }
  .ctl { display: grid; grid-template-columns: 1fr auto; gap: .3rem .6rem; align-items: center; background: var(--panel-2); border: 1.5px solid var(--line-soft); border-radius: var(--r-ctl); padding: .6rem .85rem; }
  .ctl-label { font-family: theme('fontFamily.ui'); font-size: .85rem; font-weight: 700; color: var(--text-dim); display: flex; align-items: center; gap: .4rem; }
  .ctl-label .sym { font-family: theme('fontFamily.mono'); color: var(--sk); font-weight: 700; }
  .ctl-value { font-family: theme('fontFamily.mono'); font-size: .92rem; font-weight: 700; color: var(--ye); text-align: right; white-space: nowrap; }
  .ctl-range { grid-column: 1 / -1; }
  .ctl-hint { grid-column: 1 / -1; font-size: .76rem; color: var(--text-faint); }
  input[type="range"].range { -webkit-appearance: none; appearance: none; width: 100%; height: 24px; background: transparent; cursor: pointer; margin: 0; }
  input[type="range"].range::-webkit-slider-runnable-track { height: 6px; border-radius: 999px; background: #33363e; }
  input[type="range"].range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; margin-top: -6px; border-radius: 50%; background: var(--sk); border: 3px solid var(--plate); }
  input[type="range"].range::-moz-range-track { height: 6px; border-radius: 999px; background: #33363e; }
  input[type="range"].range::-moz-range-progress { height: 6px; border-radius: 999px; background: #5d7d89; }
  input[type="range"].range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--sk); border: 3px solid var(--plate); }
  input[type="number"].inp, input[type="text"].inp, select.inp { font-family: theme('fontFamily.ui'); font-size: .9rem; color: var(--text); background: var(--plate); border: 1.5px solid var(--edge); border-radius: 10px; padding: .4rem .6rem; width: 100%; }
  input[type="number"].inp:focus, select.inp:focus { border-color: var(--sk); outline: none; }
  .readouts { display: grid; grid-template-columns: repeat(auto-fit, minmax(126px, 1fr)); gap: .6rem; }
  .stat { background: var(--panel-2); border: 1.5px solid var(--line-soft); border-radius: var(--r-ctl); padding: .55rem .75rem; min-width: 0; }
  .stat-label { display: block; font-family: theme('fontFamily.ui'); font-size: .72rem; letter-spacing: .05em; color: var(--text-faint); font-weight: 700; margin-bottom: .15rem; }
  .stat-value { display: block; font-family: theme('fontFamily.mono'); font-size: 1.05rem; font-weight: 700; color: var(--text); overflow-wrap: anywhere; }
  .stat-value.tight { font-size: .88rem; line-height: 1.45; }
  .stat-value.hl-cyan    { color: var(--sk); }
  .stat-value.hl-amber   { color: var(--ye); }
  .stat-value.hl-emerald { color: var(--mi); }
  .stat-value.hl-rose    { color: var(--pk); }
  .stat-value.hl-violet  { color: var(--li); }
  .stat-sub { display: block; font-size: .72rem; color: var(--text-faint); }
  .sim-note { font-size: .86rem; line-height: 1.65; color: var(--text-dim); background: var(--sk-t); border-left: 3px solid var(--sk); padding: .7rem .95rem; border-radius: 0 10px 10px 0; }
  .legend { display: flex; flex-wrap: wrap; gap: .55rem 1.1rem; font-size: .78rem; color: var(--text-dim); padding: .65rem 1.2rem; border-top: 1.5px solid var(--line); background: var(--bg-soft); }
  .legend span { display: inline-flex; align-items: center; gap: .35rem; }
  .swatch { width: 11px; height: 11px; border-radius: 4px; display: inline-block; flex: none; }
  .row-list { display: grid; gap: .5rem; }
  .row-item { display: grid; grid-template-columns: auto 1fr auto; gap: .7rem; align-items: center; background: var(--panel-2); border: 1.5px solid var(--line-soft); border-radius: var(--r-ctl); padding: .6rem .8rem; transition: border-color .15s ease, background .15s ease; }
  .row-item:hover { border-color: var(--edge); background: #262830; }
  .row-item.selected { border-color: var(--sk); background: var(--sk-t); }
  .row-chip { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; font-family: theme('fontFamily.mono'); font-weight: 700; font-size: .78rem; background: var(--plate); border: 1.5px solid var(--line); color: var(--ye); }
  .table-scroll { overflow-x: auto; border: 1.5px solid var(--line); border-radius: var(--r-mid); }
  table.data { width: 100%; border-collapse: collapse; font-size: .86rem; }
  table.data th, table.data td { padding: .55rem .8rem; text-align: left; border-bottom: 1px solid var(--line-soft); }
  table.data th { background: var(--panel-2); font-family: theme('fontFamily.ui'); font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-faint); font-weight: 700; white-space: nowrap; }
  table.data td { font-family: theme('fontFamily.mono'); color: var(--text); }
  table.data tr:last-child td { border-bottom: 0; }
  table.data td.txt { font-family: theme('fontFamily.sans'); }

  /* -- prose & learning blocks ------------------------------------------- */
  .prose p { margin-bottom: 1.05rem; color: var(--text-dim); line-height: 1.8; }
  .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.35rem; color: var(--text-dim); }
  .prose ul { list-style: disc; }
  .prose ol { list-style: decimal; }
  .prose li { margin-bottom: .5rem; line-height: 1.7; }
  .prose li::marker { color: var(--pk); font-weight: 700; }
  .prose strong { color: var(--text); font-family: theme('fontFamily.sans'); font-weight: 700; }
  /* -- reading rhythm (positions & scaling modelled on the reference blog
       layout): big air above every heading, one idea per screen, inset blocks
       breathe so the page never feels text-heavy ------------------------- */
  .prose .h-sec               { margin-top: 4.2rem; margin-bottom: 1.25rem; }
  .prose > .h-sec:first-child { margin-top: 0; }
  .prose .h-sub               { margin: 3.1rem 0 .95rem; }
  .prose p                    { margin-bottom: 1.35rem; line-height: 1.85; }
  .prose ul, .prose ol        { margin: 1.8rem 0; }
  .prose .formula             { margin: 2.2rem 0; }
  .prose .callout             { margin: 2.2rem 0; }
  .prose figure.fig           { margin: 2.4rem 0; }
  .prose .defs                { margin: 2.2rem 0; gap: .8rem; }
  .prose details.dig          { margin: 2.2rem 0; }
  .formula { display: flex; align-items: center; justify-content: center; gap: .8rem; flex-wrap: wrap; background: var(--panel-2); border: 1.5px solid var(--line); border-radius: var(--r-mid); padding: 1.1rem 1.25rem; margin: 1.1rem 0 1.25rem; text-align: center; overflow-x: auto; }
  .formula .eq { font-family: theme('fontFamily.mono'); font-size: clamp(1rem, 3vw, 1.2rem); font-weight: 700; color: #f4f1e8; }
  .formula .eq[data-display] { display: block; width: 100%; }
  .formula .eq .katex { font-size: 1.22em; }
  .formula .where { font-size: .78rem; color: var(--text-faint); width: 100%; }
  .katex-display { margin: .3rem 0; }
  .callout { border-radius: var(--r-mid); padding: .95rem 1.1rem; margin: 1.15rem 0; border: 1.5px solid; font-size: .9rem; background: var(--ct, transparent); border-color: var(--ce, var(--line)); }
  .callout-title { display: flex; align-items: center; gap: .45rem; font-family: theme('fontFamily.ui'); font-weight: 700; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; margin-bottom: .35rem; color: var(--c, var(--text)); }
  .callout p { margin-bottom: .5rem; color: var(--text-dim); line-height: 1.75; }
  .callout p:last-child { margin-bottom: 0; }
  details.check, details.dig { background: var(--panel-2); border: 1.5px solid var(--line); border-radius: var(--r-mid); margin-bottom: .6rem; transition: border-color .15s ease; }
  details.check:hover, details.dig:hover { border-color: var(--edge); }
  details.check summary, details.dig summary { cursor: pointer; list-style: none; display: flex; gap: .55rem; align-items: flex-start; font-family: theme('fontFamily.ui'); font-weight: 700; color: var(--text); }
  details.check summary { font-size: .94rem; line-height: 1.55; padding: .75rem 1rem; }
  details.dig summary { font-size: .9rem; padding: .7rem 1rem; color: var(--text-dim); }
  details.check summary::-webkit-details-marker, details.dig summary::-webkit-details-marker { display: none; }
  details.check summary::before { content: "Q"; flex: none; width: 22px; height: 22px; border-radius: 8px; display: grid; place-items: center; background: var(--plate); border: 1.5px solid var(--line); color: var(--sk); font-size: .72rem; font-weight: 700; }
  details.dig summary::before { content: "+"; font-family: theme('fontFamily.mono'); font-weight: 700; color: var(--sk); width: 1em; }
  details.dig[open] summary::before { content: "\2212"; }
  details.dig[open] summary { border-bottom: 1.5px dashed var(--line); }
  details.check[open] summary { margin-bottom: .5rem; }
  details.check .answer { border-top: 1.5px dashed var(--line); padding: .65rem 1rem .85rem; font-size: .89rem; line-height: 1.75; color: var(--text-dim); }
  details.check .answer b, details.dig .dig-body b { color: var(--mi); }
  details.dig .dig-body { padding: .35rem 1rem .85rem; }
  details.dig .dig-body p { margin-top: .7rem; color: var(--text-dim); line-height: 1.75; font-size: .92rem; }
  figure.fig { margin: 1.1rem 0; }
  figure.fig .fig-box { background: var(--plate); border: 1.5px solid var(--line); border-radius: var(--r-mid); padding: 1rem; overflow-x: auto; }
  figure.fig svg { display: block; margin-inline: auto; max-width: 100%; height: auto; }
  figure.fig figcaption { font-size: .8rem; color: var(--text-faint); margin-top: .55rem; text-align: center; }
  .defs { display: grid; gap: .7rem; }
  .defs > div { background: var(--panel-2); border: 1.5px solid var(--line-soft); border-left: 4px solid var(--sk); border-radius: 4px 12px 12px 4px; padding: .65rem .95rem; }
  .defs dt { font-family: theme('fontFamily.ui'); font-weight: 700; font-size: .92rem; color: var(--text); }
  .defs dd { margin: .15rem 0 0; font-size: .87rem; color: var(--text-dim); line-height: 1.7; }
  .objectives { list-style: none; display: grid; gap: .5rem; }
  .objectives li { display: flex; gap: .6rem; align-items: flex-start; font-size: .94rem; line-height: 1.6; color: var(--text-dim); }
  .objectives li svg { flex: none; width: 18px; height: 18px; margin-top: .25rem; stroke: var(--mi); }

  /* -- progress ----------------------------------------------------------- */
  .progress-track { display: block; height: 9px; border-radius: 999px; background: #2c2f36; overflow: hidden; }
  .progress-fill { display: block; height: 100%; width: 0%; border-radius: 999px; background: var(--sk); transition: width .5s ease; }
  .ring-wrap { position: relative; width: 132px; height: 132px; flex: none; }
  .ring-wrap svg { transform: rotate(-90deg); }
  .ring-bg { fill: none; stroke: #2c2f36; stroke-width: 11; }
  .ring-fg { fill: none; stroke: var(--sk); stroke-width: 11; stroke-linecap: round; transition: stroke-dashoffset .6s ease; }
  .ring-label { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
  .ring-label b { font-size: 1.7rem; font-family: theme('fontFamily.ui'); font-weight: 100; line-height: 1; }
  .ring-label span { font-family: theme('fontFamily.ui'); font-size: .68rem; text-transform: uppercase; letter-spacing: .14em; color: var(--text-faint); font-weight: 700; }
  .check-pill { display: inline-flex; align-items: center; gap: .35rem; font-family: theme('fontFamily.ui'); font-size: .74rem; font-weight: 700; padding: .2rem .6rem; border-radius: 999px; background: var(--panel-2); border: 1.5px solid var(--line); color: var(--text-faint); }
  .check-pill::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .5; }
  .check-pill.done { background: var(--mi-t); border-color: var(--mi); color: var(--mi); }
  .check-pill.done::before { opacity: 1; }

  /* -- quiz --------------------------------------------------------------- */
  .q-card { background: var(--panel); border: 1.5px solid var(--line); border-radius: var(--r-card); padding: 1.15rem 1.25rem; margin-bottom: .85rem; }
  .q-card.answered-correct { border-color: var(--mi); }
  .q-card.answered-wrong { border-color: var(--pk); }
  .q-head { display: flex; gap: .75rem; align-items: flex-start; margin-bottom: .9rem; }
  .q-num { flex: none; width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; background: var(--panel-2); border: 1.5px solid var(--line); font-family: theme('fontFamily.mono'); font-weight: 700; font-size: .85rem; color: var(--sk); }
  .q-text { font-family: theme('fontFamily.sans'); font-weight: 700; font-size: .99rem; line-height: 1.6; color: var(--text); }
  .q-topic { margin-top: .4rem; }
  .opts { display: grid; gap: .5rem; }
  .opt {
    display: flex; gap: .65rem; align-items: flex-start; text-align: left; width: 100%;
    background: var(--panel-2); border: 1.5px solid var(--line); border-radius: var(--r-ctl);
    padding: .68rem .9rem; cursor: pointer; font-family: inherit; font-size: .93rem; color: var(--text-dim);
  }
  .opt:hover:not(:disabled) { border-color: var(--edge); color: var(--text); }
  .opt .key { flex: none; width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: var(--plate); border: 1.5px solid var(--line); font-family: theme('fontFamily.mono'); font-size: .75rem; font-weight: 700; color: var(--text-dim); }
  .opt[aria-checked="true"] { border-color: var(--sk); background: var(--sk-t); color: var(--text); }
  .opt[aria-checked="true"] .key { background: var(--sk); color: #10222b; border-color: var(--sk); }
  .opt:disabled { cursor: default; }
  .opt.correct { border-color: var(--mi); background: var(--mi-t); color: var(--text); }
  .opt.correct .key { background: var(--mi); color: #1c2610; border-color: var(--mi); }
  .opt.wrong { border-color: var(--pk); background: var(--pk-t); color: var(--text); }
  .opt.wrong .key { background: var(--pk); color: #2b1418; border-color: var(--pk); }
  .opt .mark { margin-left: auto; font-family: theme('fontFamily.ui'); font-weight: 700; font-size: .78rem; }
  .opt.burst { position: relative; }
  .opt.burst::after { content: ""; position: absolute; inset: -3px; border-radius: 12px; border: 3px solid var(--mi); opacity: 0; pointer-events: none; animation: burst .55s ease-out 1; }
  .feedback { display: flex; gap: .6rem; align-items: flex-start; margin-top: .75rem; font-size: .89rem; line-height: 1.7; border-radius: var(--r-ctl); padding: .75rem .95rem; border: 1.5px dashed var(--line); background: var(--bg-soft); color: var(--text-dim); }
  .feedback > span { flex: 1 1 auto; min-width: 0; }
  .feedback b { color: var(--text); }
  .feedback.good { border-color: var(--mi); background: var(--mi-t); }
  .feedback.bad { border-color: var(--pk); background: var(--pk-t); }
  .mreact { width: 36px; height: auto; flex: none; margin-top: .1rem; }
  .score-card { display: flex; gap: 1.4rem; align-items: center; flex-wrap: wrap; }
  .grade { font-size: 2.6rem; font-family: theme('fontFamily.ui'); font-weight: 100; line-height: 1.1; }
  .score-bar { flex: 1 1 220px; min-width: 200px; }

  /* -- mascot, hero, footer, pager ---------------------------------------- */
  .mascot { width: 108px; height: auto; display: block; animation: bob 3.4s ease-in-out infinite; }
  .mascot-sm { width: 60px; margin-bottom: .15rem; }
  .mascot-cheer { width: 22px; height: auto; display: inline-block; vertical-align: -6px; animation: bob 1s ease-in-out 2; }
  .hero { padding-block: 2.6rem 1.8rem; }
  .hero-stack { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; }
  .hero-stack .lede { margin-inline: auto; }
  .btn-row { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: center; }
  .hero-visual { width: 100%; max-width: calc(var(--column) - 2.5rem); margin-top: .8rem; }
  .hero-visual canvas { display: block; width: 100%; height: 380px; border-radius: var(--r-card); border: 2px solid var(--line); background: var(--plate); }
  .stat-strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem; margin-top: 1.2rem; width: 100%; max-width: calc(var(--column) - 2.5rem); }
  .stat-strip .stat { text-align: center; }
  /* three-stat strips only: the odd one out spans the full row on 2-col screens.
     four-stat strips (.stat-strip-4) sit 2x2 here and 4-across from 640px up. */
  .stat-strip .stat:nth-child(3):last-child { grid-column: 1 / -1; }
  .stat-strip-4 { grid-template-columns: repeat(2, 1fr); }
  /* stat numbers are small (1.45rem): Regular 400, not Thin — thin hairlines lose legibility at this size */
  .stat-strip .stat-value { font-size: 1.45rem; font-family: theme('fontFamily.ui'); font-weight: 400; }
  .steps { display: grid; gap: .9rem; grid-template-columns: 1fr; counter-reset: step; }
  .step { position: relative; padding: 1.15rem; }
  .step::before { counter-increment: step; content: "0" counter(step); font-family: theme('fontFamily.mono'); font-size: .78rem; font-weight: 700; color: var(--pk); letter-spacing: .12em; display: block; margin-bottom: .35rem; }
  .site-footer { border-top: 1.5px solid var(--line); background: #141519; padding-block: 2rem; margin-top: 2.5rem; }
  .footer-grid { display: grid; gap: 2rem; grid-template-columns: 1fr; }
  .footer-links { list-style: none; display: grid; gap: .35rem; }
  .footer-links a { color: var(--text-dim); text-decoration: none; font-size: .9rem; }
  .footer-links a:hover { color: var(--sk); text-decoration: underline; }
  .breadcrumb { display: flex; gap: .5rem; align-items: center; font-size: .82rem; color: var(--text-faint); flex-wrap: wrap; }
  .breadcrumb a { color: var(--text-dim); text-decoration: none; }
  .breadcrumb a:hover { color: var(--sk); text-decoration: underline; }
  .pager { display: grid; gap: .8rem; grid-template-columns: 1fr; margin-top: 1.6rem; }
  .pager a { display: flex; flex-direction: column; gap: .2rem; text-decoration: none; background: var(--panel); border: 1.5px solid var(--line); border-radius: var(--r-card); padding: 1rem 1.25rem; }
  .pager a:hover { border-color: var(--edge); transform: translateY(-1px); }
  .pager .dir { font-family: theme('fontFamily.ui'); font-size: .7rem; text-transform: uppercase; letter-spacing: .16em; color: var(--text-faint); font-weight: 700; }
  .pager .ttl { color: var(--text); font-weight: 700; }
  .pager .next { text-align: right; }
  .challenge { border-top: 1.5px solid var(--line); background: var(--bg-soft); }
  .challenge .q-prompt { font-family: theme('fontFamily.ui'); font-weight: 700; font-size: .93rem; color: var(--text); }
  .is-hidden { display: none !important; }

  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  @keyframes burst { 0% { opacity: .9; transform: scale(.96); } 100% { opacity: 0; transform: scale(1.06); } }

  /* -- responsive: three breakpoints only (640 / 900 / 1200) -------------- */
  @media (min-width: 640px) {
    .stat-strip { grid-template-columns: repeat(3, 1fr); }
    .stat-strip .stat:nth-child(3):last-child { grid-column: auto; }
    .stat-strip-4 { grid-template-columns: repeat(4, 1fr); }
    .pager { grid-template-columns: 1fr 1fr; }
  }
  @media (min-width: 900px) {
    .sim-grid { grid-template-columns: minmax(0, 1.5fr) minmax(340px, 1fr); align-items: stretch; }
    .sim-grid > div { display: flex; flex-direction: column; min-width: 0; }
    .sim-grid .sim-canvas:not(.chart) { flex: 1 1 0px; height: auto; min-height: 380px; }
    .sim-grid .sim-canvas.tall:not(.chart) { min-height: 440px; }
    .sim-grid #p5-gen-host { flex: 1 1 0px; }
    .steps { grid-template-columns: repeat(3, 1fr); }
    .footer-grid { grid-template-columns: 1.5fr 1fr 1fr; }
    .footer-grid-2 { grid-template-columns: 1.6fr 1fr; }
  }
  @media (max-width: 900px) {
    .nav-toggle { display: block; }
    .nav-menu {
      position: absolute; top: var(--header-h); left: 0; right: 0;
      flex-direction: column; align-items: stretch; gap: .15rem;
      background: var(--bg); border-bottom: 1.5px solid var(--line);
      max-height: 0; overflow: hidden; opacity: 0; pointer-events: none;
      transition: max-height .25s ease, opacity .2s ease;
    }
    .nav-menu.open { max-height: 78vh; overflow-y: auto; opacity: 1; pointer-events: auto; padding: .4rem .9rem calc(.8rem + env(safe-area-inset-bottom, 0px)); }
    .nav-link { padding: .75rem .6rem; border-radius: 10px; }
    .nav-link.nav-cta { margin-top: .5rem; text-align: center; }
    /* dropdown becomes an in-flow sub-list: it can never overlap the CTA */
    .nav-drop-menu { position: static; transform: none; min-width: 0; border: 0; background: transparent; padding: 0 0 0 .9rem; display: none; opacity: 1; visibility: visible; }
    .nav-drop-menu.open { display: grid; transform: none; }
    .dd-link { padding: .55rem .4rem; }
    .dd-link small { white-space: normal; }
  }
  @media (max-width: 640px) {
    .section { padding-block: 2.3rem; }
    .topic-head { padding-block: 2rem 1.2rem; }
    /* tighter rhythm on phones, still airier than a wall of text */
    .prose .h-sec { margin-top: 3rem; }
    .prose .h-sub { margin-top: 2.2rem; }
    .prose .formula, .prose .callout, .prose .defs, .prose details.dig { margin: 1.6rem 0; }
    .prose figure.fig { margin: 1.8rem 0; }
    .hero { padding-block: 2rem 1.3rem; }
    .sim-canvas { height: 320px; }
    .sim-canvas.tall { height: 360px; }
    .sim-canvas.short { height: 210px; }
    .hero-visual canvas { height: 260px; }
    .card, .panel-body { padding: 1rem; }
    .readouts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .stat-value { font-size: .92rem; }
    .mascot { width: 84px; }
    .btn-row { width: 100%; flex-direction: column; }
    .btn-row .btn { width: 100%; }
    .formula .eq .katex { font-size: 1.02em; }
    .panel-head { gap: .5rem; }
    .panel-actions { margin-left: 0; width: 100%; }
  }
  @media (pointer: coarse) {
    input[type="range"].range { height: 30px; }
    input[type="range"].range::-webkit-slider-runnable-track { height: 8px; }
    input[type="range"].range::-webkit-slider-thumb { width: 24px; height: 24px; margin-top: -8px; }
    input[type="range"].range::-moz-range-track { height: 8px; }
    input[type="range"].range::-moz-range-thumb { width: 20px; height: 20px; }
    .btn { padding: .6rem 1.15rem; min-height: 44px; }
    .opt { padding: .7rem .8rem; min-height: 44px; }
    .nav-toggle { width: 48px; height: 44px; }
    .seg-btn { padding: .45rem .9rem; min-height: 40px; }
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .mascot, .mascot-cheer { animation: none; }
    * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
  }
  @media print {
    .site-header, .site-footer, .nav-toggle, .panel-actions, .btn, .sim-canvas,
    .scroll-progress, #p5-gen-host, .legend, .mascot { display: none !important; }
    body { background: #fff; color: #000; }
    .card, .panel, .q-card { border-color: #bbb; background: #fff; }
    .prose p, .prose li, .lede, .muted { color: #222; }
    figure.fig .fig-box { background: #fff; border-color: #bbb; }
  }
}
````

### `css/site.css` (36.1 KiB)

````css
*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }

/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}:root{--bg:#17181c;--bg-soft:#1b1d22;--panel:#1b1d22;--panel-2:#22242b;--plate:#101114;--line:#2e3138;--line-soft:#26282f;--edge:#3a3d45;--text:#edebe3;--text-dim:#b9b7ae;--text-faint:#9a988e;--pk:#f8aebe;--li:#d5b8d8;--mi:#b5d777;--sk:#a8d3e0;--ye:#f6d36b;--pk-t:rgba(248,174,190,.08);--pk-e:rgba(248,174,190,.4);--li-t:rgba(213,184,216,.08);--li-e:rgba(213,184,216,.4);--mi-t:hsla(81,55%,65%,.08);--mi-e:hsla(81,55%,65%,.4);--sk-t:rgba(168,211,224,.08);--sk-e:rgba(168,211,224,.4);--ye-t:hsla(45,89%,69%,.08);--ye-e:hsla(45,89%,69%,.4);--r-card:18px;--r-mid:14px;--r-ctl:12px;--header-h:58px;--maxw:1280px;--column:1060px}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;font-size:16px}@media (min-width:1200px){html{font-size:17px}}@media (max-width:640px){html{font-size:15.5px}}body{background:var(--bg);font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:400;line-height:1.75;min-height:100vh;min-height:100dvh;overflow-x:clip}body,h1,h2,h3,h4,h5,h6{margin:0;color:var(--text)}h1,h2,h3,h4,h5,h6{font-family:fot-yuruka-std,G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;font-synthesis:none;line-height:1.35;letter-spacing:.01em}ol,p,ul{margin:0}ol,ul{padding:0}a{color:var(--sk)}::-moz-selection{background:var(--ye);color:#221d07}::selection{background:var(--ye);color:#221d07}:focus-visible{outline:2px solid var(--sk);outline-offset:2px;border-radius:6px}sub,sup{vertical-align:baseline;position:relative;line-height:0;font-size:.72em}sup{top:-.55em}sub{bottom:-.3em}[id]{scroll-margin-top:calc(var(--header-h) + 14px)}[hidden]{display:none!important}.wrap{margin-left:auto;margin-right:auto;width:100%;padding-left:1.25rem;padding-right:1.25rem;max-width:var(--maxw)}.wrap-narrow,.wrap-sim{max-width:var(--column)}.section{padding-block:3.4rem}.section-tight{padding-block:1.15rem}.section-tight.wrap-sim{padding-block:1.5rem}.hr{border:0;border-top:1px solid var(--line-soft);margin:0}.topic-head{padding-block:2.8rem 1.6rem}.topic-head .lede{margin-top:.5rem}.wrap-narrow .lede{max-width:100%}.skip-link{position:absolute;left:-9999px;top:0;z-index:200;background:var(--ye);color:#221d07;padding:.5rem 1rem;border-radius:0 0 12px 12px;font-weight:700;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif}.skip-link:focus{left:0}.h-hero{font-size:clamp(1.7rem,4.4vw,2.5rem)}.h-topic{font-size:clamp(1.45rem,3.4vw,2rem)}.h-sec{font-size:clamp(1.15rem,2.2vw,1.5rem);margin-bottom:1rem}.h-sub{font-size:1.06rem;margin:1.8rem 0 .55rem}.lede{font-size:1.04rem;line-height:1.8;max-width:58ch}.lede,.muted{color:var(--text-dim)}.faint{color:var(--text-faint)}.small{font-size:.89rem;line-height:1.65}.tiny{font-size:.82rem;line-height:1.55}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace}.center{text-align:center}.eyebrow{display:inline-block;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.74rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase}.eyebrow,.eyebrow-amber,.eyebrow-violet{color:var(--pk)}.accent-cyan,.accent-sky{color:var(--sk)}.accent-amber{color:var(--ye)}.accent-rose{color:var(--pk)}.accent-emerald{color:var(--mi)}a.link{text-decoration:underline;text-underline-offset:3px}.site-header{position:sticky;top:0;z-index:60;background:var(--bg);border-bottom:1.5px solid var(--line)}.nav-inner{display:flex;gap:1rem;min-height:var(--header-h)}.brand,.nav-inner{align-items:center}.brand{display:inline-flex;gap:.6rem;text-decoration:none;color:var(--text);font-family:fot-yuruka-std,G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700}.brand-mark{width:34px;height:34px;flex:none}.brand-name{font-size:1.05rem;line-height:1.15}.brand-name em{font-style:normal;color:var(--pk)}.brand-sub{display:block;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);font-weight:700}.nav-menu{display:flex;align-items:center;gap:.2rem;margin-left:auto}.nav-link{display:inline-block;padding:.45rem .85rem;border-radius:999px;color:var(--text-dim);text-decoration:none;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.9rem;font-weight:700;white-space:nowrap}.nav-link.active:not(.nav-cta),.nav-link:hover{color:var(--text);background:var(--panel-2)}.nav-link.nav-cta,.nav-link.nav-cta.active,.nav-link.nav-cta:hover{background:var(--pk);color:#2b1418;padding:.45rem 1.05rem;font-weight:700}.nav-link.nav-cta:hover{filter:brightness(1.05)}.nav-drop{position:relative}.nav-drop-btn{display:inline-flex;align-items:center;gap:.4rem}.nav-drop-btn svg{transition:transform .15s ease}.nav-drop-btn[aria-expanded=true] svg{transform:rotate(180deg)}.nav-drop-menu{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(-4px);min-width:260px;background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-mid);padding:.4rem;display:grid;gap:2px;opacity:0;visibility:hidden;z-index:70;transition:opacity .15s ease,transform .15s ease}.nav-drop-menu.open{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}.dd-link{display:grid;gap:.1rem;padding:.55rem .8rem;border-radius:10px;text-decoration:none;color:var(--text-dim)}.dd-link:hover{background:#262830;color:var(--text)}.dd-link b{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.9rem;font-weight:700;color:var(--text)}.dd-link small{font-size:.74rem;color:var(--text-faint);line-height:1.45}.dd-link.active{background:var(--sk-t)}.dd-link.active b{color:var(--sk)}.nav-toggle{display:none;margin-left:auto;width:46px;height:42px;background:var(--panel-2);border:2px solid var(--line);border-radius:12px;cursor:pointer}.nav-toggle span{display:block;width:18px;height:2.5px;margin:3.5px auto;background:var(--text);border-radius:2px}.scroll-progress{position:absolute;left:0;bottom:-1.5px;height:3px;width:100%}.scroll-progress i{display:block;height:100%;width:0;background:var(--sk)}.\!btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:.45rem!important;padding:.55rem 1.15rem!important;border-radius:999px!important;cursor:pointer!important;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif!important;font-size:.92rem!important;font-weight:700!important;text-decoration:none!important;border:2px solid var(--edge)!important;background:var(--panel-2)!important;color:var(--text)!important;-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important;-webkit-tap-highlight-color:transparent!important;transition:transform .12s ease,border-color .15s ease,background .15s ease!important}.btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:.55rem 1.15rem;border-radius:999px;cursor:pointer;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.92rem;font-weight:700;text-decoration:none;border:2px solid var(--edge);background:var(--panel-2);color:var(--text);-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,border-color .15s ease,background .15s ease}.\!btn:hover{border-color:#4b4e57!important;background:#262830!important;transform:translateY(-1px)!important}.btn:hover{border-color:#4b4e57;background:#262830;transform:translateY(-1px)}.\!btn:active{transform:translateY(0)!important}.btn:active{transform:translateY(0)}.\!btn:disabled{opacity:.45!important;cursor:not-allowed!important;transform:none!important}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}.btn-primary{background:var(--ye);border-color:var(--ye);color:#221d07}.btn-primary:hover{background:var(--ye);filter:brightness(1.07)}.btn-amber{background:var(--pk);border-color:var(--pk);color:#2b1418}.btn-danger,.btn-ghost{background:transparent}.btn-danger{border-color:var(--pk);color:var(--pk)}.btn-danger:hover{background:var(--pk-t)}.btn-sm{padding:.35rem .8rem;font-size:.82rem}.btn-group{gap:.5rem}.btn-group,.seg{display:inline-flex;flex-wrap:wrap}.seg{background:var(--panel-2);border:2px solid var(--line);border-radius:999px;padding:3px;gap:3px}.seg-btn{border:0;background:transparent;color:var(--text-dim);cursor:pointer;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.84rem;font-weight:700;padding:.38rem .9rem;border-radius:999px}.seg-btn:hover{color:var(--text)}.seg-btn.active,.seg-btn[aria-pressed=true]{background:var(--sk);color:#10222b;font-weight:700}.tag{display:inline-flex;align-items:center;gap:.3rem;padding:.14rem .6rem;border-radius:999px;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--c,var(--text-faint));border:1.5px solid var(--ce,var(--line));background:var(--ct,var(--panel-2))}.accent-c,.callout-key,.hl-cyan,.tag-cyan{--c:var(--sk);--ct:var(--sk-t);--ce:var(--sk-e)}.callout-warn,.hl-amber,.tag-amber{--c:var(--ye);--ct:var(--ye-t);--ce:var(--ye-e)}.callout-trap,.hl-rose,.tag-rose{--c:var(--pk);--ct:var(--pk-t);--ce:var(--pk-e)}.callout-real,.hl-emerald,.tag-emerald{--c:var(--mi);--ct:var(--mi-t);--ce:var(--mi-e)}.hl-violet,.tag-violet{--c:var(--li);--ct:var(--li-t);--ce:var(--li-e)}.\!card{background:var(--panel)!important;border:1.5px solid var(--line)!important;border-radius:var(--r-card)!important;padding:1.35rem 1.4rem!important;transition:border-color .15s ease,transform .16s ease!important}.card{background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-card);padding:1.35rem 1.4rem;transition:border-color .15s ease,transform .16s ease}.card>.lede,.card>.small,.card>p{margin:0}.\!card>.lede,.\!card>.small,.\!card>p{margin:0!important}.card-flat{background:var(--bg-soft)}.card-hover:hover{border-color:var(--edge);transform:translateY(-2px)}.panel{background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-card);overflow:hidden}.panel-head{gap:.75rem;flex-wrap:wrap;padding:.85rem 1.2rem;border-bottom:1.5px solid var(--line);background:var(--panel-2)}.panel-head,.panel-title{display:flex;align-items:center}.panel-title{font-size:.98rem;font-family:fot-yuruka-std,G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;gap:.55rem}.panel-title .dot{width:10px;height:10px;border-radius:50%;background:var(--sk);flex:none}.panel-sub{font-size:.8rem;color:var(--text-faint)}.panel-body{padding:1.1rem}.panel-actions{margin-left:auto;display:flex;gap:.4rem;flex-wrap:wrap}.topic-card{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:.85rem}.topic-card:before{content:"";position:absolute;inset:0 0 auto 0;height:5px;background:var(--topic-accent,var(--sk))}.topic-num{position:absolute;right:.7rem;top:.3rem;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:3.2rem;font-weight:100;color:hsla(48,22%,91%,.07);line-height:1;pointer-events:none}.topic-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--panel-2);border:1.5px solid var(--line)}.topic-icon svg{width:25px;height:25px;stroke:var(--topic-accent,var(--sk))}.topic-list{list-style:none;display:grid;gap:.55rem}.topic-list li{position:relative;padding-left:1.05rem;font-size:.9rem;line-height:1.65;color:var(--text-dim)}.topic-list li:before{content:"\2022";position:absolute;left:.1rem;top:0;color:var(--topic-accent,var(--sk));font-weight:700}.sim-canvas{display:block;width:100%;height:380px;touch-action:none;cursor:crosshair;background:var(--plate);border-bottom:1.5px solid var(--line)}.sim-canvas.tall{height:440px}.sim-canvas.short{height:250px}.sim-canvas.chart{height:150px;cursor:default}.sim-canvas.grab{cursor:grab}.sim-canvas.grabbing{cursor:grabbing}.sim-grid{display:grid;gap:1.1rem;grid-template-columns:1fr}.ctl-stack{display:grid;gap:.8rem}.ctl{display:grid;grid-template-columns:1fr auto;gap:.3rem .6rem;background:var(--panel-2);border:1.5px solid var(--line-soft);border-radius:var(--r-ctl);padding:.6rem .85rem}.ctl,.ctl-label{align-items:center}.ctl-label{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.85rem;font-weight:700;color:var(--text-dim);display:flex;gap:.4rem}.ctl-label .sym{color:var(--sk)}.ctl-label .sym,.ctl-value{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-weight:700}.ctl-value{font-size:.92rem;color:var(--ye);text-align:right;white-space:nowrap}.ctl-hint,.ctl-range{grid-column:1/-1}.ctl-hint{font-size:.76rem;color:var(--text-faint)}input[type=range].range{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:100%;height:24px;background:transparent;cursor:pointer;margin:0}input[type=range].range::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:#33363e}input[type=range].range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;margin-top:-6px;border-radius:50%;background:var(--sk);border:3px solid var(--plate)}input[type=range].range::-moz-range-track{height:6px;border-radius:999px;background:#33363e}input[type=range].range::-moz-range-progress{height:6px;border-radius:999px;background:#5d7d89}input[type=range].range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--sk);border:3px solid var(--plate)}input[type=number].inp,input[type=text].inp,select.inp{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.9rem;color:var(--text);background:var(--plate);border:1.5px solid var(--edge);border-radius:10px;padding:.4rem .6rem;width:100%}input[type=number].inp:focus,select.inp:focus{border-color:var(--sk);outline:none}.readouts{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:.6rem}.stat{background:var(--panel-2);border:1.5px solid var(--line-soft);border-radius:var(--r-ctl);padding:.55rem .75rem;min-width:0}.stat-label{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.72rem;letter-spacing:.05em;color:var(--text-faint);margin-bottom:.15rem}.stat-label,.stat-value{display:block;font-weight:700}.stat-value{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-size:1.05rem;color:var(--text);overflow-wrap:anywhere}.stat-value.tight{font-size:.88rem;line-height:1.45}.stat-value.hl-cyan{color:var(--sk)}.stat-value.hl-amber{color:var(--ye)}.stat-value.hl-emerald{color:var(--mi)}.stat-value.hl-rose{color:var(--pk)}.stat-value.hl-violet{color:var(--li)}.stat-sub{display:block;font-size:.72rem;color:var(--text-faint)}.sim-note{font-size:.86rem;line-height:1.65;background:var(--sk-t);border-left:3px solid var(--sk);padding:.7rem .95rem;border-radius:0 10px 10px 0}.legend,.sim-note{color:var(--text-dim)}.legend{display:flex;flex-wrap:wrap;gap:.55rem 1.1rem;font-size:.78rem;padding:.65rem 1.2rem;border-top:1.5px solid var(--line);background:var(--bg-soft)}.legend span{display:inline-flex;align-items:center;gap:.35rem}.swatch{width:11px;height:11px;border-radius:4px;display:inline-block;flex:none}.row-list{display:grid;gap:.5rem}.row-item.selected{border-color:var(--sk);background:var(--sk-t)}.table-scroll{overflow-x:auto;border:1.5px solid var(--line);border-radius:var(--r-mid)}table.data{width:100%;border-collapse:collapse;font-size:.86rem}table.data td,table.data th{padding:.55rem .8rem;text-align:left;border-bottom:1px solid var(--line-soft)}table.data th{background:var(--panel-2);font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-faint);font-weight:700;white-space:nowrap}table.data td{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;color:var(--text)}table.data tr:last-child td{border-bottom:0}table.data td.txt{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif}.prose p{margin-bottom:1.05rem;color:var(--text-dim);line-height:1.8}.prose ol,.prose ul{margin-bottom:1rem;padding-left:1.35rem;color:var(--text-dim)}.prose ul{list-style:disc}.prose ol{list-style:decimal}.prose li{margin-bottom:.5rem;line-height:1.7}.prose li::marker{color:var(--pk);font-weight:700}.prose strong{color:var(--text);font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700}.prose .h-sec{margin-top:4.2rem;margin-bottom:1.25rem}.prose>.h-sec:first-child{margin-top:0}.prose .h-sub{margin:3.1rem 0 .95rem}.prose p{margin-bottom:1.35rem;line-height:1.85}.prose ol,.prose ul{margin:1.8rem 0}.prose .callout,.prose .formula{margin:2.2rem 0}.prose figure.fig{margin:2.4rem 0}.prose .defs{gap:.8rem}.prose .defs,.prose details.dig{margin:2.2rem 0}.formula{display:flex;align-items:center;justify-content:center;gap:.8rem;flex-wrap:wrap;background:var(--panel-2);border:1.5px solid var(--line);border-radius:var(--r-mid);padding:1.1rem 1.25rem;margin:1.1rem 0 1.25rem;text-align:center;overflow-x:auto}.formula .eq{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-size:clamp(1rem,3vw,1.2rem);font-weight:700;color:#f4f1e8}.formula .eq[data-display]{display:block;width:100%}.formula .eq .katex{font-size:1.22em}.formula .where{font-size:.78rem;color:var(--text-faint);width:100%}.callout{border-radius:var(--r-mid);padding:.95rem 1.1rem;margin:1.15rem 0;border:1.5px solid;font-size:.9rem;background:var(--ct,transparent);border-color:var(--ce,var(--line))}.callout-title{display:flex;align-items:center;gap:.45rem;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.35rem;color:var(--c,var(--text))}.callout p{margin-bottom:.5rem;color:var(--text-dim);line-height:1.75}.callout p:last-child{margin-bottom:0}details.check,details.dig{background:var(--panel-2);border:1.5px solid var(--line);border-radius:var(--r-mid);margin-bottom:.6rem;transition:border-color .15s ease}details.check:hover,details.dig:hover{border-color:var(--edge)}details.check summary,details.dig summary{cursor:pointer;list-style:none;display:flex;gap:.55rem;align-items:flex-start;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;color:var(--text)}details.check summary{font-size:.94rem;line-height:1.55;padding:.75rem 1rem}details.dig summary{font-size:.9rem;padding:.7rem 1rem;color:var(--text-dim)}details.check summary::-webkit-details-marker,details.dig summary::-webkit-details-marker{display:none}details.check summary:before{content:"Q";flex:none;width:22px;height:22px;border-radius:8px;display:grid;place-items:center;background:var(--plate);border:1.5px solid var(--line);color:var(--sk);font-size:.72rem;font-weight:700}details.dig summary:before{content:"+";font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-weight:700;color:var(--sk);width:1em}details.dig[open] summary:before{content:"\2212"}details.dig[open] summary{border-bottom:1.5px dashed var(--line)}details.check[open] summary{margin-bottom:.5rem}details.check .answer{border-top:1.5px dashed var(--line);padding:.65rem 1rem .85rem;font-size:.89rem;line-height:1.75;color:var(--text-dim)}details.check .answer b,details.dig .dig-body b{color:var(--mi)}details.dig .dig-body{padding:.35rem 1rem .85rem}details.dig .dig-body p{margin-top:.7rem;color:var(--text-dim);line-height:1.75;font-size:.92rem}figure.fig{margin:1.1rem 0}figure.fig .fig-box{background:var(--plate);border:1.5px solid var(--line);border-radius:var(--r-mid);padding:1rem;overflow-x:auto}figure.fig svg{display:block;margin-inline:auto;max-width:100%;height:auto}figure.fig figcaption{font-size:.8rem;color:var(--text-faint);margin-top:.55rem;text-align:center}.defs{display:grid;gap:.7rem}.defs>div{background:var(--panel-2);border:1.5px solid var(--line-soft);border-left:4px solid var(--sk);border-radius:4px 12px 12px 4px;padding:.65rem .95rem}.defs dt{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;font-size:.92rem;color:var(--text)}.defs dd{margin:.15rem 0 0;font-size:.87rem;color:var(--text-dim);line-height:1.7}.objectives{list-style:none;display:grid;gap:.5rem}.objectives li{display:flex;gap:.6rem;align-items:flex-start;font-size:.94rem;line-height:1.6;color:var(--text-dim)}.objectives li svg{flex:none;width:18px;height:18px;margin-top:.25rem;stroke:var(--mi)}.progress-track{height:9px;background:#2c2f36;overflow:hidden}.progress-fill,.progress-track{display:block;border-radius:999px}.progress-fill{height:100%;width:0;background:var(--sk);transition:width .5s ease}.ring-wrap{position:relative;width:132px;height:132px;flex:none}.ring-wrap svg{transform:rotate(-90deg)}.ring-bg{fill:none;stroke:#2c2f36;stroke-width:11}.ring-fg{fill:none;stroke:var(--sk);stroke-width:11;stroke-linecap:round;transition:stroke-dashoffset .6s ease}.ring-label{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.ring-label b{font-size:1.7rem;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:100;line-height:1}.ring-label span{font-size:.68rem;text-transform:uppercase;letter-spacing:.14em}.check-pill,.ring-label span{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;color:var(--text-faint);font-weight:700}.check-pill{display:inline-flex;align-items:center;gap:.35rem;font-size:.74rem;padding:.2rem .6rem;border-radius:999px;background:var(--panel-2);border:1.5px solid var(--line)}.check-pill:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.5}.check-pill.done{background:var(--mi-t);border-color:var(--mi);color:var(--mi)}.check-pill.done:before{opacity:1}.q-card{background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-card);padding:1.15rem 1.25rem;margin-bottom:.85rem}.q-card.answered-correct{border-color:var(--mi)}.q-card.answered-wrong{border-color:var(--pk)}.q-head{display:flex;gap:.75rem;align-items:flex-start;margin-bottom:.9rem}.q-num{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:var(--panel-2);border:1.5px solid var(--line);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-size:.85rem;color:var(--sk)}.q-num,.q-text{font-weight:700}.q-text{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.99rem;line-height:1.6;color:var(--text)}.q-topic{margin-top:.4rem}.opts{display:grid;gap:.5rem}.opt{display:flex;gap:.65rem;align-items:flex-start;text-align:left;width:100%;background:var(--panel-2);border:1.5px solid var(--line);border-radius:var(--r-ctl);padding:.68rem .9rem;cursor:pointer;font-family:inherit;font-size:.93rem;color:var(--text-dim)}.opt:hover:not(:disabled){border-color:var(--edge);color:var(--text)}.opt .key{flex:none;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;background:var(--plate);border:1.5px solid var(--line);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-size:.75rem;font-weight:700;color:var(--text-dim)}.opt[aria-checked=true]{border-color:var(--sk);background:var(--sk-t);color:var(--text)}.opt[aria-checked=true] .key{background:var(--sk);color:#10222b;border-color:var(--sk)}.opt:disabled{cursor:default}.opt.correct{border-color:var(--mi);background:var(--mi-t);color:var(--text)}.opt.correct .key{background:var(--mi);color:#1c2610;border-color:var(--mi)}.opt.wrong{border-color:var(--pk);background:var(--pk-t);color:var(--text)}.opt.wrong .key{background:var(--pk);color:#2b1418;border-color:var(--pk)}.opt .mark{margin-left:auto;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;font-size:.78rem}.opt.burst{position:relative}.opt.burst:after{content:"";position:absolute;inset:-3px;border-radius:12px;border:3px solid var(--mi);opacity:0;pointer-events:none;animation:burst .55s ease-out 1}.feedback{display:flex;gap:.6rem;align-items:flex-start;margin-top:.75rem;font-size:.89rem;line-height:1.7;border-radius:var(--r-ctl);padding:.75rem .95rem;border:1.5px dashed var(--line);background:var(--bg-soft);color:var(--text-dim)}.feedback>span{flex:1 1 auto;min-width:0}.feedback b{color:var(--text)}.feedback.good{border-color:var(--mi);background:var(--mi-t)}.feedback.bad{border-color:var(--pk);background:var(--pk-t)}.mreact{width:36px;height:auto;flex:none;margin-top:.1rem}.score-card{display:flex;gap:1.4rem;align-items:center;flex-wrap:wrap}.grade{font-size:2.6rem;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:100;line-height:1.1}.score-bar{flex:1 1 220px;min-width:200px}.mascot{width:108px;height:auto;display:block;animation:bob 3.4s ease-in-out infinite}.mascot-sm{width:60px;margin-bottom:.15rem}.hero{padding-block:2.6rem 1.8rem}.hero-stack{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1rem}.hero-stack .lede{margin-inline:auto}.btn-row{display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center}.hero-visual{width:100%;max-width:calc(var(--column) - 2.5rem);margin-top:.8rem}.hero-visual canvas{display:block;width:100%;height:380px;border-radius:var(--r-card);border:2px solid var(--line);background:var(--plate)}.stat-strip{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-top:1.2rem;width:100%;max-width:calc(var(--column) - 2.5rem)}.stat-strip .stat{text-align:center}.stat-strip .stat:nth-child(3):last-child{grid-column:1/-1}.stat-strip-4{grid-template-columns:repeat(2,1fr)}.stat-strip .stat-value{font-size:1.45rem;font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:400}.steps{display:grid;gap:.9rem;grid-template-columns:1fr;counter-reset:step}.step{position:relative;padding:1.15rem}.step:before{counter-increment:step;content:"0" counter(step);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,monospace;font-size:.78rem;font-weight:700;color:var(--pk);letter-spacing:.12em;display:block;margin-bottom:.35rem}.site-footer{border-top:1.5px solid var(--line);background:#141519;padding-block:2rem;margin-top:2.5rem}.footer-grid{display:grid;gap:2rem;grid-template-columns:1fr}.footer-links{list-style:none;display:grid;gap:.35rem}.footer-links a{color:var(--text-dim);text-decoration:none;font-size:.9rem}.footer-links a:hover{color:var(--sk);text-decoration:underline}.breadcrumb{display:flex;gap:.5rem;align-items:center;font-size:.82rem;color:var(--text-faint);flex-wrap:wrap}.breadcrumb a{color:var(--text-dim);text-decoration:none}.breadcrumb a:hover{color:var(--sk);text-decoration:underline}.pager{display:grid;gap:.8rem;grid-template-columns:1fr;margin-top:1.6rem}.pager a{display:flex;flex-direction:column;gap:.2rem;text-decoration:none;background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-card);padding:1rem 1.25rem}.pager a:hover{border-color:var(--edge);transform:translateY(-1px)}.pager .dir{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-size:.7rem;text-transform:uppercase;letter-spacing:.16em;color:var(--text-faint);font-weight:700}.pager .ttl{color:var(--text);font-weight:700}.pager .next{text-align:right}.challenge{border-top:1.5px solid var(--line);background:var(--bg-soft)}.challenge .q-prompt{font-family:G8321,Hiragino Maru Gothic ProN,Segoe UI,system-ui,sans-serif;font-weight:700;font-size:.93rem;color:var(--text)}.is-hidden{display:none!important}@keyframes bob{0%,to{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes burst{0%{opacity:.9;transform:scale(.96)}to{opacity:0;transform:scale(1.06)}}@media (min-width:640px){.stat-strip{grid-template-columns:repeat(3,1fr)}.stat-strip .stat:nth-child(3):last-child{grid-column:auto}.stat-strip-4{grid-template-columns:repeat(4,1fr)}.pager{grid-template-columns:1fr 1fr}}@media (min-width:900px){.sim-grid{grid-template-columns:minmax(0,1.5fr) minmax(340px,1fr);align-items:stretch}.sim-grid>div{display:flex;flex-direction:column;min-width:0}.sim-grid .sim-canvas:not(.chart){flex:1 1 0px;height:auto;min-height:380px}.sim-grid .sim-canvas.tall:not(.chart){min-height:440px}.sim-grid #p5-gen-host{flex:1 1 0px}.steps{grid-template-columns:repeat(3,1fr)}.footer-grid{grid-template-columns:1.5fr 1fr 1fr}.footer-grid-2{grid-template-columns:1.6fr 1fr}}@media (max-width:900px){.nav-toggle{display:block}.nav-menu{position:absolute;top:var(--header-h);left:0;right:0;flex-direction:column;align-items:stretch;gap:.15rem;background:var(--bg);border-bottom:1.5px solid var(--line);max-height:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-height .25s ease,opacity .2s ease}.nav-menu.open{max-height:78vh;overflow-y:auto;opacity:1;pointer-events:auto;padding:.4rem .9rem calc(.8rem + env(safe-area-inset-bottom, 0px))}.nav-link{padding:.75rem .6rem;border-radius:10px}.nav-link.nav-cta{margin-top:.5rem;text-align:center}.nav-drop-menu{position:static;transform:none;min-width:0;border:0;background:transparent;padding:0 0 0 .9rem;display:none;opacity:1;visibility:visible}.nav-drop-menu.open{display:grid;transform:none}.dd-link{padding:.55rem .4rem}.dd-link small{white-space:normal}}@media (max-width:640px){.section{padding-block:2.3rem}.topic-head{padding-block:2rem 1.2rem}.prose .h-sec{margin-top:3rem}.prose .h-sub{margin-top:2.2rem}.prose .callout,.prose .defs,.prose .formula,.prose details.dig{margin:1.6rem 0}.prose figure.fig{margin:1.8rem 0}.hero{padding-block:2rem 1.3rem}.sim-canvas{height:320px}.sim-canvas.tall{height:360px}.sim-canvas.short{height:210px}.hero-visual canvas{height:260px}.card,.panel-body{padding:1rem}.readouts{grid-template-columns:repeat(2,minmax(0,1fr))}.stat-value{font-size:.92rem}.mascot{width:84px}.btn-row{flex-direction:column}.btn-row,.btn-row .btn{width:100%}.formula .eq .katex{font-size:1.02em}.panel-head{gap:.5rem}.panel-actions{margin-left:0;width:100%}.\!card{padding:1rem!important}.btn-row .\!btn{width:100%!important}}@media (pointer:coarse){input[type=range].range{height:30px}input[type=range].range::-webkit-slider-runnable-track{height:8px}input[type=range].range::-webkit-slider-thumb{width:24px;height:24px;margin-top:-8px}input[type=range].range::-moz-range-track{height:8px}input[type=range].range::-moz-range-thumb{width:20px;height:20px}.btn{padding:.6rem 1.15rem}.btn,.opt{min-height:44px}.opt{padding:.7rem .8rem}.nav-toggle{width:48px;height:44px}.seg-btn{padding:.45rem .9rem;min-height:40px}.\!btn{padding:.6rem 1.15rem!important;min-height:44px!important}}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.mascot,.mascot-cheer{animation:none}*{animation-duration:.001ms!important;transition-duration:.001ms!important}}@media print{#p5-gen-host,.btn,.legend,.mascot,.nav-toggle,.panel-actions,.scroll-progress,.sim-canvas,.site-footer,.site-header{display:none!important}body{background:#fff;color:#000}.card,.panel,.q-card{border-color:#bbb;background:#fff}.lede,.muted,.prose li,.prose p{color:#222}figure.fig .fig-box{background:#fff;border-color:#bbb}.\!btn{display:none!important}.\!card{border-color:#bbb!important;background:#fff!important}}.visible{visibility:visible}.fixed{position:fixed}.sticky{position:sticky}.mb-4{margin-bottom:1rem}.mt-2{margin-top:.5rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.block{display:block}.inline{display:inline}.flex{display:flex}.grid{display:grid}.hidden{display:none}.h-6{height:1.5rem}.min-w-0{min-width:0}.flex-1{flex:1 1 0%}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.flex-wrap{flex-wrap:wrap}.items-start{align-items:flex-start}.items-center{align-items:center}.justify-between{justify-content:space-between}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.self-center{align-self:center}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-bold{font-weight:700}.uppercase{text-transform:uppercase}.tracking-widest{letter-spacing:.1em}@media (min-width:900px){.md\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1200px){.lg\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
````

### `index.html` (24.8 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="EMC Lab — an interactive, browser-based electromagnetics tutorial: electric fields, circuits, magnetism and electromagnetic induction, with live simulations and a scored quiz.">
  <meta name="theme-color" content="#060b16">
  <title>EMC Lab · Interactive Electromagnetics Tutorial</title>

  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">

  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>

      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu"
              aria-label="Open navigation menu"><span></span><span></span><span></span></button>

      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="topics/charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="topics/current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="topics/magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="topics/induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap section-tight">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
    </div>

    <section class="hero">
      <div class="wrap hero-stack">
        <svg class="mascot" viewBox="0 0 120 112" role="img" aria-label="Denki-chan, the EMC Lab mascot">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
        <span class="eyebrow">Interactive electromagnetics</span>
        <h1 class="h-hero">See electricity and magnetism move.</h1>
        <p class="lede">
          Four tutorial chapters, eight live simulations and a 25-question scored quiz.
          Drag a charge, build a circuit, push a magnet through a coil and watch the
          induced EMF appear on the graph — every number on screen is computed from
          the real equations, not faked.
        </p>
        <div class="btn-row">
          <a class="btn btn-primary" href="topics/charges.html">Start with Topic 1</a>
          <a class="btn" href="topics/induction.html">Jump to the induction sim</a>
          <a class="btn btn-ghost" href="quiz.html">Take the quiz</a>
        </div>
        <div class="hero-visual">
          <canvas id="heroCanvas" aria-label="Animated electric dipole field lines"></canvas>
          <p class="tiny faint center" style="margin-top:.6rem">
            An electric dipole: field lines run from the positive to the negative charge.
            (Topic 1 simulation lets you build your own.)
          </p>
        </div>
        <div class="stat-strip">
          <div class="stat"><span class="stat-label">Topics</span><span class="stat-value hl-cyan">4</span></div>
          <div class="stat"><span class="stat-label">Simulations</span><span class="stat-value hl-amber">8</span></div>
          <div class="stat"><span class="stat-label">Quiz questions</span><span class="stat-value hl-emerald">25</span></div>
        </div>
      </div>
    </section>

    <section class="section wrap">
      <h2 class="h-sec reveal">How to use this site</h2>
      <div class="steps mt-4">
        <div class="card step reveal">
          <h3 class="font-bold">Read the tutorial</h3>
          <p class="small muted" style="margin:.35rem 0 0">
            Each topic opens with learning objectives, then explains the idea with a diagram,
            the governing equation, a worked example and a real-world application.
          </p>
        </div>
        <div class="card step reveal">
          <h3 class="font-bold">Play with the simulation</h3>
          <p class="small muted" style="margin:.35rem 0 0">
            Move the sliders and drag the objects on the canvas. Predict what will happen
            first, then check — the readouts update live and show the working.
          </p>
        </div>
        <div class="card step reveal">
          <h3 class="font-bold">Prove it in the quiz</h3>
          <p class="small muted" style="margin:.35rem 0 0">
            Twenty-five multiple-choice questions with worked explanations. Your best score is
            saved in this browser so you can track improvement.
          </p>
        </div>
      </div>
    </section>

    <hr class="hr">

    <section class="section wrap">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4 reveal">
        <h2 class="h-sec" style="margin:0">The four topics</h2>
        <span class="tag tag-cyan" id="dashTopicsChip">0 of 4 topics studied</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 topic-grid-4 gap-4">

        <!-- Topic 1 -->
        <article class="card card-hover topic-card reveal" style="--topic-accent:#f8aebe">
          <span class="topic-num" aria-hidden="true">01</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Electric charges &amp; fields</h3>
          <p class="small muted">What charge is, how it creates a field, and how to predict the direction of that field.</p>
          <ul class="topic-list">
            <li>Coulomb’s law: F = k·q<sub>1</sub>q<sub>2</sub>/r<sup>2</sup></li>
            <li>Field direction and field-line rules</li>
            <li>Positive vs negative charge, superposition</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/charges.html" data-topic-link="charges">Open topic</a>
            <span class="check-pill" data-topic-check="charges">not started</span>
          </div>
        </article>

        <!-- Topic 2 -->
        <article class="card card-hover topic-card reveal" style="--topic-accent:#f6d36b">
          <span class="topic-num" aria-hidden="true">02</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12h3l2-5 3 10 2-5h6"/><circle cx="4" cy="12" r="1.4"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Current electricity</h3>
          <p class="small muted">Voltage, current and resistance — and how to reduce any resistor network to one value.</p>
          <ul class="topic-list">
            <li>Ohm’s law: V = IR and P = IV</li>
            <li>Series and parallel circuits</li>
            <li>Equivalent resistance, step by step</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/current.html" data-topic-link="current">Open topic</a>
            <span class="check-pill" data-topic-check="current">not started</span>
          </div>
        </article>

        <!-- Topic 3 -->
        <article class="card card-hover topic-card reveal" style="--topic-accent:#d5b8d8">
          <span class="topic-num" aria-hidden="true">03</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 4v9a6 6 0 0 0 12 0V4"/><path d="M6 4H3v6h3zM18 4h3v6h-3z"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Magnetism</h3>
          <p class="small muted">Where field lines go, how a compass behaves, and why a moving charge curves.</p>
          <ul class="topic-list">
            <li>Magnetic field lines and bar magnets</li>
            <li>F = qv × B on a moving charge</li>
            <li>The right-hand rule, practised interactively</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/magnetism.html" data-topic-link="magnetism">Open topic</a>
            <span class="check-pill" data-topic-check="magnetism">not started</span>
          </div>
        </article>

        <!-- Topic 4 -->
        <article class="card card-hover topic-card reveal" style="--topic-accent:#a8d3e0">
          <span class="topic-num" aria-hidden="true">04</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="9" cy="12" rx="3" ry="7"/><ellipse cx="14" cy="12" rx="3" ry="7"/><path d="M19 8h3M19 12h3M19 16h3"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Electromagnetic induction</h3>
          <p class="small muted">A changing magnetic flux creates a voltage. This is how every generator on Earth works.</p>
          <ul class="topic-list">
            <li>Faraday’s law: EMF = −N·dΦ/dt</li>
            <li>Lenz’s law and the minus sign</li>
            <li>Magnet through a coil, simulated exactly</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/induction.html" data-topic-link="induction">Open topic</a>
            <span class="check-pill" data-topic-check="induction">not started</span>
          </div>
        </article>
      </div>
    </section>

    <section class="section wrap">
      <h2 class="h-sec reveal">Eight simulations, all driven by real equations</h2>
      <p class="lede reveal" style="margin-bottom:1.2rem">
        Nothing is animated by hand: every frame is computed from Coulomb’s law, Ohm’s law,
        the Biot–Savart-style dipole field or Faraday’s law. Change an input and the physics
        re-solves.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a class="card card-hover reveal" href="topics/charges.html#sim-coulomb-panel">
          <span class="tag tag-rose">Topic 1</span>
          <h3 class="font-bold mt-2">Coulomb force bench</h3>
          <p class="small muted mt-2">Drag two charges apart and watch the inverse-square force arrows grow and shrink.</p>
        </a>
        <a class="card card-hover reveal" href="topics/charges.html#sim-efield-panel">
          <span class="tag tag-rose">Topic 1</span>
          <h3 class="font-bold mt-2">Electric field explorer</h3>
          <p class="small muted mt-2">Place any number of charges; field lines, vector grids and a test-charge probe update live.</p>
        </a>
        <a class="card card-hover reveal" href="topics/current.html#sim-ohm-panel">
          <span class="tag tag-amber">Topic 2</span>
          <h3 class="font-bold mt-2">Ohm’s law simulator</h3>
          <p class="small muted mt-2">Auto-ranging ammeter, a bulb that brightens with power, and an I–V characteristic plot.</p>
        </a>
        <a class="card card-hover reveal" href="topics/current.html#sim-circuit-panel">
          <span class="tag tag-amber">Topic 2</span>
          <h3 class="font-bold mt-2">Circuit builder</h3>
          <p class="small muted mt-2">Add resistors in series, parallel or a combination; animated current splits correctly between branches.</p>
        </a>
        <a class="card card-hover reveal" href="topics/magnetism.html#sim-magnet-panel">
          <span class="tag tag-violet">Topic 3</span>
          <h3 class="font-bold mt-2">Bar magnet field lab</h3>
          <p class="small muted mt-2">Field lines, compass needles, vector grids and iron filings around a magnet you can rotate and drag.</p>
        </a>
        <a class="card card-hover reveal" href="topics/magnetism.html#sim-lorentz-panel">
          <span class="tag tag-violet">Topic 3</span>
          <h3 class="font-bold mt-2">Lorentz force &amp; circular motion</h3>
          <p class="small muted mt-2">Protons, electrons and alpha particles curving in a field — plus a right-hand-rule challenge.</p>
        </a>
        <a class="card card-hover reveal" href="topics/induction.html#sim-induction-panel">
          <span class="tag tag-cyan">Topic 4</span>
          <h3 class="font-bold mt-2">Magnet through a coil</h3>
          <p class="small muted mt-2">Exact dipole flux, Faraday’s law, a centre-zero galvanometer and a scrolling Φ/EMF chart.</p>
        </a>
        <a class="card card-hover reveal" href="topics/induction.html#sim-generator-panel">
          <span class="tag tag-emerald">Topic 4 · p5.js</span>
          <h3 class="font-bold mt-2">AC generator (bonus lab)</h3>
          <p class="small muted mt-2">A coil spinning in a uniform field: Φ = NBA·cos(2πft) drawn live with p5.js, producing the mains sine wave.</p>
        </a>
        <div class="card card-flat reveal">
          <span class="tag">Governing equations</span>
          <ul class="topic-list mt-2">
            <li><span data-tex="E = kq/r^2">E = kq/r<sup>2</sup></span>, superposition by vector sum</li>
            <li><span data-tex="R_{\mathrm{eq}}">R<sub>eq</sub></span> for series, parallel and mixed</li>
            <li><span data-tex="\Phi = \mu_0 m a^2 / [2(a^2+z^2)^{3/2}]">Φ = μ<sub>0</sub>ma<sup>2</sup>/[2(a<sup>2</sup>+z<sup>2</sup>)<sup>3/2</sup>]</span></li>
            <li><span data-tex="r = mv/(|q|B)">r = mv/(|q|B)</span>, <span data-tex="T = 2\pi m/(|q|B)">T = 2πm/(|q|B)</span></li>
          </ul>
        </div>
      </div>
    </section>

    <hr class="hr">

    <section class="section wrap">
      <h2 class="h-sec reveal">Quick formula reference</h2>
      <div class="panel reveal">
        <div class="table-scroll">
          <table class="data">
            <thead>
              <tr><th>Concept</th><th>Equation</th><th>Units</th><th>What it tells you</th></tr>
            </thead>
            <tbody>
              <tr><td class="txt">Coulomb force</td><td><span data-tex="F = k q_1 q_2 / r^2">F = k·q<sub>1</sub>q<sub>2</sub> / r<sup>2</sup></span></td><td>N</td><td class="txt">Inverse square: 2× the distance → ¼ the force</td></tr>
              <tr><td class="txt">Electric field</td><td><span data-tex="E = F/q = kq/r^2">E = F/q = k·q / r<sup>2</sup></span></td><td>N/C = V/m</td><td class="txt">Force per unit positive test charge</td></tr>
              <tr><td class="txt">Ohm’s law</td><td><span data-tex="V = IR">V = I·R</span></td><td>V, A, Ω</td><td class="txt">Voltage drives current against resistance</td></tr>
              <tr><td class="txt">Electrical power</td><td><span data-tex="P = VI = I^2R = V^2/R">P = VI = I<sup>2</sup>R = V<sup>2</sup>/R</span></td><td>W</td><td class="txt">Rate of energy conversion to heat/light</td></tr>
              <tr><td class="txt">Series resistance</td><td><span data-tex="R_{\mathrm{eq}} = \textstyle\sum_i R_i">R<sub>eq</sub> = ΣR<sub>i</sub></span></td><td>Ω</td><td class="txt">Always bigger than the largest resistor</td></tr>
              <tr><td class="txt">Parallel resistance</td><td><span data-tex="1/R_{\mathrm{eq}} = \textstyle\sum_i 1/R_i">1/R<sub>eq</sub> = Σ1/R<sub>i</sub></span></td><td>Ω</td><td class="txt">Always smaller than the smallest branch</td></tr>
              <tr><td class="txt">Magnetic force</td><td><span data-tex="\vec{F} = q\,\vec{v} \times \vec{B}">F = q·v × B</span></td><td>N</td><td class="txt">Perpendicular to both v and B → does no work</td></tr>
              <tr><td class="txt">Radius of orbit</td><td><span data-tex="r = mv/(|q|B)">r = mv / (|q|B)</span></td><td>m</td><td class="txt">Faster or heavier → wider circle</td></tr>
              <tr><td class="txt">Magnetic flux</td><td><span data-tex="\Phi = BA\cos\theta">Φ = B·A·cosθ</span></td><td>Wb = T·m<sup>2</sup></td><td class="txt">How much field threads the loop</td></tr>
              <tr><td class="txt">Faraday’s law</td><td><span data-tex="\mathcal{E} = -N\,d\Phi/dt">EMF = −N·dΦ/dt</span></td><td>V</td><td class="txt">Only a <em>changing</em> flux induces a voltage</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="tiny faint mt-3">
        Constants used throughout: k = 8.988×10<sup>9</sup> N·m<sup>2</sup>/C<sup>2</sup>, μ<sub>0</sub> = 4π×10<sup>−7</sup> T·m/A,
        e = 1.602×10<sup>−19</sup> C.
      </p>
    </section>

    <section class="section wrap">
      <div class="panel reveal">
        <div class="panel-head">
          <h2 class="panel-title"><span class="dot"></span> Your progress</h2>
          <p class="panel-sub">Saved in this browser only (localStorage)</p>
          <div class="panel-actions">
            <button class="btn btn-sm btn-danger" id="resetProgress" type="button">Reset progress</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="flex flex-wrap gap-6 items-center">
            <div class="ring-wrap">
              <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
                <circle class="ring-bg" cx="66" cy="66" r="58"/>
                <circle class="ring-fg" id="ringFg" cx="66" cy="66" r="58"/>
              </svg>
              <div class="ring-label"><b id="ringPct">0%</b><span>complete</span></div>
            </div>

            <div class="flex-1 min-w-0" style="flex:1 1 260px">
              <p class="muted small" id="dashPct" style="margin:0 0 .8rem">0% complete</p>
              <dl class="defs">
                <div><dt>Topics studied</dt><dd id="dashTopicsDone">0 of 4 topics studied</dd></div>
                <div><dt>Best quiz score</dt><dd id="dashQuizBest">not attempted</dd></div>
                <div><dt>Quiz attempts</dt><dd id="dashQuizAttempts">0</dd></div>
                <div><dt>Last saved</dt><dd id="dashUpdated">—</dd></div>
              </dl>
              <p class="tiny faint" style="margin-top:.8rem">
                Tick a topic with the <em>Mark topic as complete</em> button at the end of each page.
                Scoring 70% or more in the quiz counts as having studied all four topics.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section class="section wrap">
      <div class="card reveal">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div style="flex:1 1 320px">
            <h2 class="h-sec" style="margin:0">Ready to test yourself?</h2>
            <p class="muted small" style="margin:.3rem 0 0">
              25 questions, instant or exam marking, worked explanations for every answer,
              and a per-topic breakdown so you know exactly what to revise.
            </p>
          </div>
          <a class="btn btn-primary" href="quiz.html">Open the quiz →</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid footer-grid-2">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">
          An interactive electromagnetics tutorial.
          Your progress is saved in this browser only.
        </p>
        <p class="tiny faint">Local storage: <span id="storageStatus">checking…</span></p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="topics/charges.html">1 · Electric charges &amp; fields</a></li>
          <li><a href="topics/current.html">2 · Current electricity</a></li>
          <li><a href="topics/magnetism.html">3 · Magnetism</a></li>
          <li><a href="topics/induction.html">4 · Electromagnetic induction</a></li>
          <li><a href="quiz.html">Quiz (25 questions)</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">
        © <span data-year>2026</span> EMC Lab · Educational use. Physics content follows
        standard calculus-based texts (Halliday/Resnick/Walker, Serway, Young &amp; Freedman).
      </p>
    </div>
  </footer>

  <script defer src="vendor/katex/katex.min.js"></script>
  <script defer src="js/common.js"></script>
  <script defer src="js/home.js"></script>
</body>
</html>
````

### `js/common.js` (30.0 KiB)

````javascript
/* EMC Lab shared engine (window.EMC): physical constants, maths + SI-prefix formatting, HiDPI canvas Stage (rAF loop, resize, unified pointer input), drawing helpers, safe localStorage, progress tracking, control binding, page UI (nav/reveal/toasts), KaTeX typesetting and licensed-font loading. */
'use strict';

window.EMC = (function () {

  /* ------------------------------------------------------------------------ 1. Physical constants (SI units, CODATA 2018 exact values where defined) ------------------------------------------------------------------------ */
  const CONST = {
    /* Coulomb constant k = 1/(4*pi*eps0) [N m^2 C^-2] */
    K: 8.987551787e9,
    /* Permittivity of free space eps0 [F/m] (exact) */
    EPS0: 8.8541878128e-12,
    /* Permeability of free space mu0 [T m/A] */
    MU0: 1.25663706212e-6,
    /* Elementary charge e [C] (exact) */
    E: 1.602176634e-19,
    /* Electron mass [kg] */
    M_ELECTRON: 9.1093837015e-31,
    /* Proton mass [kg] */
    M_PROTON: 1.67262192369e-27
  };

  /* ------------------------------------------------------------------------ 2. Math helpers ------------------------------------------------------------------------ */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const roundTo = (v, dp) => { const p = Math.pow(10, dp); return Math.round(v * p) / p; };
  /* Map a value from one range to another (used for canvas scaling). */
  const mapRange = (v, a1, a2, b1, b2) => b1 + ((v - a1) / (a2 - a1)) * (b2 - b1);
  /* Smooth exponential approach — frame-rate independent damping. */
  const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

  /* ------------------------------------------------------------------------ 3. Number formatting ------------------------------------------------------------------------ */
  /* SI prefixes used by the engineering formatter, from femto to tera. */
  const PREFIX = [
    { e: -15, s: 'f' }, { e: -12, s: 'p' }, { e: -9, s: 'n' }, { e: -6, s: '\u00B5' },
    { e: -3, s: 'm' }, { e: 0, s: '' }, { e: 3, s: 'k' }, { e: 6, s: 'M' },
    { e: 9, s: 'G' }, { e: 12, s: 'T' }
  ];

  /* * Format a number with an SI prefix, keeping `sig` significant figures. * Values outside the prefix table fall back to exponential notation, so a * prefix is never stacked on top of another one. * * eng(0.0034) -> "3.40 m" eng(399.45) -> "399" * eng(12345) -> "12.3 k" eng(1.6e-14) -> "16.0 f" * eng(1e-20) -> "1.00e-20" eng(0) -> "0" * * @param {number} v value in base SI units * @param {number} sig significant figures (default 3) * @returns {string} */
  function eng(v, sig = 3) {
    if (v === null || v === undefined || !isFinite(v)) return '\u2014';
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) / 3) * 3;
    e = clamp(e, -15, 12);
    let scaled = v / Math.pow(10, e);
    const pre = PREFIX.find(p => p.e === e);
    if (!pre) return v.toExponential(Math.max(0, sig - 1));

    // Rounding can push 999.6 up to 1000, so re-scale when that happens.
    let decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
    if (decimals > 4) return v.toExponential(Math.max(0, sig - 1));   // below femto
    if (Math.abs(Number(scaled.toFixed(decimals))) >= 1000) {
      scaled /= 1000; e += 3;
      const pre2 = PREFIX.find(p => p.e === e);
      if (!pre2) return v.toExponential(Math.max(0, sig - 1));
      decimals = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled))));
      return scaled.toFixed(decimals) + (pre2.s ? ' ' + pre2.s : '');
    }
    return scaled.toFixed(decimals) + (pre.s ? '\u00A0' + pre.s : '');
  }

  /* * eng() plus a unit, following the SI convention that there is no space * between a prefix and its unit: 399 mN, 54.0 mV, 3.00 A, 12.3 kΩ. */
  function unit(v, u, sig = 3) {
    const s = eng(v, sig);
    if (!u) return s;
    const parts = s.split(' ');
    // parts = [number, prefix] when a prefix was applied, else [number]
    return parts.length === 2 ? `${parts[0]}\u00A0${parts[1]}${u}` : `${s}\u00A0${u}`;
  }

  /* Fixed-decimal formatting that never returns "-0.0". */
  function fixed(v, dp = 2) {
    if (!isFinite(v)) return '\u2014';
    const r = Number(v.toFixed(dp));
    return (Object.is(r, -0) ? 0 : r).toFixed(dp);
  }

  /* ------------------------------------------------------------------------ 4. Stage — HiDPI canvas wrapper with an optional rAF loop ------------------------------------------------------------------------ */
  /* * @param {HTMLCanvasElement} canvas * @param {(ctx:CanvasRenderingContext2D, w:number, h:number, stage:Stage)=>void} render * @param {{animate?:boolean}} [opts] animate=true keeps a rAF loop running * (it auto-pauses when the canvas scrolls out of view to save CPU). */
  class Stage {
    constructor(canvas, render, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.render = render;
      this.animate = !!opts.animate;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.t = 0;                 // accumulated time in seconds (animation)
      this.pointer = { x: 0, y: 0, down: false, inside: false };
      this._raf = 0; this._last = 0; this._visible = true; this._running = false;

      this.resize();
      this._observeResize();
      this._observeVisibility();
      if (this.animate) this.start(); else this.draw();
    }

    /* Re-read the CSS size and scale the backing store for crisp rendering. */
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      if (w === this.w && h === this.h && dpr === this.dpr) return false;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      // All drawing code below works in CSS pixels.
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    _observeResize() {
      if (typeof ResizeObserver === 'function') {
        this._ro = new ResizeObserver(() => { this.resize(); this.draw(); });
        this._ro.observe(this.canvas);
      } else {                                    // graceful fallback
        window.addEventListener('resize', () => { this.resize(); this.draw(); });
      }
    }

    /* Pause the animation loop when the canvas is off-screen (battery/CPU). */
    _observeVisibility() {
      if (typeof IntersectionObserver !== 'function') return;
      this._io = new IntersectionObserver(entries => {
        for (const en of entries) {
          this._visible = en.isIntersecting;
          if (this._visible && this._running) { this._last = 0; this._tick(); }
        }
      }, { threshold: 0.01 });
      this._io.observe(this.canvas);
    }

    draw() { if (this.w && this.h) this.render(this.ctx, this.w, this.h, this); }

    start() {
      if (this._running) return;
      this._running = true; this._last = 0;
      this._tick();
    }
    stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; }

    _tick() {
      if (!this._running) return;
      this._raf = requestAnimationFrame(now => {
        if (!this._running) return;
        if (!this._last) this._last = now;
        // Clamp dt so a backgrounded tab does not produce a huge time jump.
        const dt = clamp((now - this._last) / 1000, 0, 0.05);
        this._last = now;
        this.t += dt;
        this.resize();
        this.render(this.ctx, this.w, this.h, this, dt);
        if (this._visible) this._tick(); else this._raf = 0;
      });
    }

    /* * Attach unified mouse + touch input. Coordinates are delivered in the * same CSS-pixel space the render function uses. * @param {(p:{x:number,y:number,down:boolean,type:string,e:PointerEvent})=>void} handler */
    onPointer(handler) {
      const toLocal = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      this.canvas.addEventListener('pointerdown', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: true, inside: true };
        // Keep receiving move events even if the pointer leaves the canvas.
        if (this.canvas.setPointerCapture) { try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {} }
        handler({ ...p, down: true, type: 'down', e });
        e.preventDefault();
      });
      this.canvas.addEventListener('pointermove', e => {
        const p = toLocal(e);
        this.pointer = { ...p, down: this.pointer.down, inside: true };
        handler({ ...p, down: this.pointer.down, type: 'move', e });
      });
      const up = e => {
        const p = toLocal(e);
        this.pointer.down = false;
        handler({ ...p, down: false, type: 'up', e });
      };
      this.canvas.addEventListener('pointerup', up);
      this.canvas.addEventListener('pointercancel', up);
      this.canvas.addEventListener('pointerleave', () => {
        this.pointer.inside = false; this.pointer.down = false;
        handler({ ...this.pointer, type: 'leave', e: null });
      });
      return this;
    }
  }

  /* ------------------------------------------------------------------------ 5. Drawing helpers (shared by several simulations) ------------------------------------------------------------------------ */
  /* Rounded rectangle that works even where ctx.roundRect is unavailable. */
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* Arrow from (x1,y1) to (x2,y2) with a filled head. */
  function arrow(ctx, x1, y1, x2, y2, { color = '#a8d3e0', width = 2.5, head = 9, dash = null } = {}) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.5) return;
    const shaft = Math.max(0, len - head * 0.85);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(ang) * shaft, y1 + Math.sin(ang) * shaft);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head);
    ctx.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Small label with a dark halo so it stays legible over any drawing. */
  function label(ctx, text, x, y, { color = '#e8eefb', size = 12, align = 'center', baseline = 'middle', halo = true, weight = '600' } = {}) {
    ctx.save();
    ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = align; ctx.textBaseline = baseline;
    if (halo) {
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(4,8,16,.85)';
      ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* Draw a point charge as a flat sticker: pastel disc, cream ring, dark sign. No gradients and no glow, per the flat-art policy. */
  function chargeGlyph(ctx, x, y, r, q, { pulse = 0 } = {}) {
    const pos = q >= 0;
    ctx.save();
    ctx.fillStyle = pos ? '#f8aebe' : '#a8d3e0';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(246,241,229,.85)'; ctx.stroke();

    // sign
    ctx.strokeStyle = '#2b2d33'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.lineCap = 'round';
    const s = r * 0.46;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.stroke();
    if (pos) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke(); }
    ctx.restore();
  }

  /* ------------------------------------------------------------------------ 6. Storage wrapper — localStorage can throw (private mode, sandboxed iframe, file:// in some browsers), so we fall back to memory. ------------------------------------------------------------------------ */
  const store = (function () {
    let mem = {};
    let ok = true;
    try {
      const k = '__emc_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
    } catch (err) { ok = false; }
    return {
      available: ok,
      get(key) {
        try { return ok ? window.localStorage.getItem(key) : (key in mem ? mem[key] : null); }
        catch (e) { return key in mem ? mem[key] : null; }
      },
      set(key, value) {
        try { if (ok) window.localStorage.setItem(key, value); else mem[key] = value; }
        catch (e) { mem[key] = value; }
      },
      remove(key) {
        try { if (ok) window.localStorage.removeItem(key); delete mem[key]; } catch (e) {}
      }
    };
  })();

  /* ------------------------------------------------------------------------ 7. Progress tracking ------------------------------------------------------------------------ */
  const TOPICS = ['charges', 'current', 'magnetism', 'induction'];
  const PROGRESS_KEY = 'emc.progress.v1';

  const Progress = {
    /* @returns {{topics:Object<string,boolean>,quizBest:number,quizAttempts:number,quizLast:number,updatedAt:string}} */
    read() {
      const blank = {
        topics: { charges: false, current: false, magnetism: false, induction: false },
        quizBest: 0, quizAttempts: 0, quizLast: 0,
        quizHistory: [],          // [{ pct, at }] — newest last, capped at 20
        updatedAt: null
      };
      const raw = store.get(PROGRESS_KEY);
      if (!raw) return blank;
      try {
        const p = JSON.parse(raw);
        return {
          topics: Object.assign(blank.topics, p.topics || {}),
          quizBest: Number(p.quizBest) || 0,
          quizAttempts: Number(p.quizAttempts) || 0,
          quizLast: Number(p.quizLast) || 0,
          quizHistory: Array.isArray(p.quizHistory) ? p.quizHistory.slice(-20) : [],
          updatedAt: p.updatedAt || null
        };
      } catch (e) { return blank; }
    },
    write(p) { p.updatedAt = new Date().toISOString(); store.set(PROGRESS_KEY, JSON.stringify(p)); },
    markTopic(id, done = true) {
      const p = this.read();
      if (id in p.topics) { p.topics[id] = !!done; this.write(p); }
      return p;
    },
    isTopicDone(id) { return !!this.read().topics[id]; },
    /* Record a quiz attempt. @param {number} pct percentage 0-100 */
    recordQuiz(pct) {
      const p = this.read();
      p.quizAttempts += 1;
      p.quizLast = pct;
      p.quizBest = Math.max(p.quizBest, pct);
      p.quizHistory = (p.quizHistory || []).concat([{ pct, at: new Date().toISOString() }]).slice(-20);
      // as promised on the home dashboard: a passing score counts as having
      // studied all four topics
      if (pct >= 70) TOPICS.forEach(t => { p.topics[t] = true; });
      this.write(p);
      return p;
    },
    /* 0-100 completion: 80% weight on topics read, 20% on best quiz score. */
    percent() {
      const p = this.read();
      const done = TOPICS.filter(t => p.topics[t]).length;
      return Math.round((done / TOPICS.length) * 80 + (p.quizBest / 100) * 20);
    },
    reset() { store.remove(PROGRESS_KEY); return this.read(); }
  };

  /* ------------------------------------------------------------------------ 8. Control binding helper (slider <-> readout <-> state) ------------------------------------------------------------------------ */
  /* * Wire an <input type="range"> to a display element and a callback. * @param {string|HTMLInputElement} el slider (or its id) * @param {string|HTMLElement} out element that shows the value (or id) * @param {(value:number)=>void} onChange * @param {(value:number)=>string} [format] formatter for the readout */
  function bindRange(el, out, onChange, format) {
    const input = typeof el === 'string' ? document.getElementById(el) : el;
    const target = typeof out === 'string' ? document.getElementById(out) : out;
    if (!input) return null;
    const fmt = format || (v => String(v));
    const apply = () => {
      const v = parseFloat(input.value);
      if (target) target.textContent = fmt(v);
      if (onChange) onChange(v);
    };
    input.addEventListener('input', apply);
    apply();
    return { input, set(v) { input.value = String(v); apply(); }, get: () => parseFloat(input.value) };
  }

  /* Radio-style segmented control: buttons inside a container with data-value. */
  function bindSegment(container, onChange) {
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) return null;
    const btns = Array.from(root.querySelectorAll('.seg-btn'));
    const select = (btn) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (onChange) onChange(btn.dataset.value, btn);
    };
    btns.forEach(b => {
      b.addEventListener('click', () => select(b));
      if (b.getAttribute('aria-pressed') === 'true') { /* keep initial */ }
    });
    return {
      get: () => (btns.find(b => b.getAttribute('aria-pressed') === 'true') || {}).dataset?.value,
      set: (v) => { const b = btns.find(x => x.dataset.value === v); if (b) select(b); },
      buttons: btns
    };
  }

  /* Toggle button group (aria-pressed) */
  function bindToggles(rootSel, onChange) {
    const root = typeof rootSel === 'string' ? document.getElementById(rootSel) : rootSel;
    if (!root) return;
    root.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        if (onChange) onChange(btn.dataset.toggle, on, btn);
      });
    });
  }

  /* ------------------------------------------------------------------------ 9. Page UI: nav, reveal, reading progress, toasts, topic completion ------------------------------------------------------------------------ */
  const UI = {
    initNav() {
      const toggle = document.getElementById('navToggle');
      const menu = document.getElementById('navMenu');
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          const open = menu.classList.toggle('open');
          toggle.setAttribute('aria-expanded', String(open));
        });
        // Close the mobile menu after choosing a destination.
        menu.addEventListener('click', e => {
          if (e.target.closest('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
        });
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && menu.classList.contains('open')) {
            menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
          }
        });
      }
      // Topics dropdown: click to toggle, close on outside click / Escape / pick
      const dropBtn = document.getElementById('topicsBtn');
      const dropMenu = document.getElementById('topicsMenu');
      if (dropBtn && dropMenu) {
        const setOpen = open => {
          dropBtn.setAttribute('aria-expanded', String(open));
          dropMenu.classList.toggle('open', open);
        };
        dropBtn.addEventListener('click', e => { e.stopPropagation(); setOpen(!dropMenu.classList.contains('open')); });
        document.addEventListener('click', e => { if (!e.target.closest('.nav-drop')) setOpen(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
        dropMenu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      }
      // Highlight the link for the current page (incl. dropdown entries).
      const here = location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-link, .dd-link').forEach(a => {
        const target = (a.getAttribute('href') || '').split('/').pop();
        if (target === here) {
          a.classList.add('active'); a.setAttribute('aria-current', 'page');
          if (a.classList.contains('dd-link') && dropBtn) dropBtn.classList.add('active');
        }
      });
    },

    initReveal() {
      const items = document.querySelectorAll('.reveal');
      if (!items.length) return;
      if (typeof IntersectionObserver !== 'function' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      items.forEach(el => io.observe(el));
    },

    initReadingBar() {
      const bar = document.getElementById('readingProgress');
      if (!bar) return;
      const onScroll = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? clamp((window.scrollY / max) * 100, 0, 100) : 0;
        bar.style.width = pct.toFixed(2) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      onScroll();
    },

    /* Transient status message (used when progress is saved). */
    toast(message, kind = 'ok') {
      let host = document.getElementById('toastHost');
      if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.setAttribute('aria-live', 'polite');
        host.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:200;display:grid;gap:.4rem;justify-items:center;pointer-events:none';
        document.body.appendChild(host);
      }
      const el = document.createElement('div');
      const color = kind === 'ok' ? '#b5d777' : kind === 'warn' ? '#f6d36b' : '#a8d3e0';
      el.style.cssText = `background:#141414;border:1px solid ${color};color:#fff;
        padding:.55rem .95rem;border-radius:999px;font-size:.86rem;font-weight:600;
        box-shadow:0 16px 34px -18px #000;opacity:0;transform:translateY(8px);
        transition:opacity .25s ease,transform .25s ease;max-width:90vw;text-align:center`;
      el.textContent = message;
      host.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'none'; });
      setTimeout(() => {
        el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
        setTimeout(() => el.remove(), 320);
      }, 2600);
    },

    /* "Mark this topic complete" buttons -> Progress.markTopic */
    initTopicButtons() {
      document.querySelectorAll('[data-complete-topic]').forEach(btn => {
        const id = btn.dataset.completeTopic;
        const sync = () => {
          const done = Progress.isTopicDone(id);
          btn.classList.toggle('btn-primary', !done);
          btn.innerHTML = done
            ? '<svg class="mascot-cheer" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M20 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M34 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M27 37 q3 3 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/></svg> Topic completed!'
            : 'Mark topic as complete';
          btn.setAttribute('aria-pressed', String(done));
        };
        btn.addEventListener('click', () => {
          const nowDone = !Progress.isTopicDone(id);
          Progress.markTopic(id, nowDone);
          sync();
          document.dispatchEvent(new CustomEvent('emc:progress', { detail: Progress.read() }));
          UI.toast(nowDone ? 'Progress saved \u2014 topic marked complete' : 'Topic marked as not complete');
        });
        sync();
      });
    },

    /* Show a warning banner when localStorage is unavailable. */
    initStorageNotice() {
      if (store.available) return;
      const host = document.getElementById('storageNotice');
      if (host) {
        host.hidden = false;
        host.innerHTML = '<strong>Note:</strong> this browser is blocking local storage, so progress will reset when you close the tab. Everything else works normally.';
      }
    },

    initYear() {
      document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
    }
  };

  /* * scrollIntoView that cannot throw: it is missing in some embedded webviews * and in test environments, and smooth scrolling is never worth crashing for. */
  function scrollToEl(el, opts = { behavior: 'smooth', block: 'center' }) {
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView(opts); } catch (err) { /* ignore */ }
    }
  }

  /* * Typeset every [data-tex] element with KaTeX (the project's LaTeX formatter). * Each element keeps hand-readable plain text as its content, so if the KaTeX * CDN is unreachable the equation still renders legibly — just un-typeset. */
  function katexify(root) {
    if (!window.katex) return 0;
    let n = 0;
    (root || document).querySelectorAll('[data-tex]').forEach(elm => {
      if (elm.dataset.texDone) return;
      try {
        window.katex.render(elm.dataset.tex, elm, {
          displayMode: elm.hasAttribute('data-display'),
          throwOnError: false
        });
        elm.dataset.texDone = '1';
        n++;
      } catch (err) { /* keep the plain-text fallback */ }
    });
    return n;
  }

  /* * Optional: activate PRIVATELY licensed faces listed in vendor/fonts/manifest.json. * The site's own fonts (G8321 Bold + Lilita One, both SIL OFL) are committed * woff2 files declared in css/fonts.css - they render on any host with no * runtime work. This hook exists for faces you may NOT redistribute: drop the * file into vendor/fonts/ (gitignored), list it in the manifest, and it gets * registered locally via the FontFace API - a missing file degrades with ZERO * console noise (a plain @font-face would log a 404 on every page load). */
  function loadLicensedFont() {
    // vendor/fonts/manifest.json (always committed, always 200) lists the
    // licensed faces present locally, so we never probe for files that
    // might not exist: no 404 noise on hosts without them.
    const cssLink = document.querySelector('link[href$="css/site.css"]') ||
                  document.querySelector('link[href$="css/fonts.css"]');
    const base = cssLink ? cssLink.getAttribute('href').replace(/css\/[^/]+$/, '') : '';
    const note = msg => console.info('[EMC] ' + msg);
    const mark = state => { document.documentElement.dataset.licensedFont = state; };
    if (typeof window.fetch !== 'function') {          // e.g. jsdom test harness
      mark('bundled');
      return;
    }
    fetch(base + 'vendor/fonts/manifest.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { licensed: [] }))
      .then(man => {
        const cuts = (man && Array.isArray(man.licensed) ? man.licensed : [])
          .filter(c => c && typeof c.file === 'string');
        if (!cuts.length) {
          // normal state: the committed OFL faces ARE the site fonts
          mark('bundled');
          return;
        }
        if (typeof window.FontFace !== 'function') { mark('fallback'); return; }
        // the manifest may list alternates for one family+weight (subset woff2
        // first, full ttf second): register only the first entry that loads
        const claimed = new Set();
        cuts.forEach(c => {
          const url = base + 'vendor/fonts/' + c.file;
          const family = c.family || 'Licensed Face';
          const fmt = /\.woff2$/i.test(c.file) ? 'woff2'
                    : /\.woff$/i.test(c.file) ? 'woff'
                    : /\.otf$/i.test(c.file) ? 'opentype' : 'truetype';
          const face = new window.FontFace(family, `url(${url}) format('${fmt}')`,
            { weight: String(c.weight || 400), style: 'normal', display: 'swap' });
          face.load()
            .then(loaded => {
              const w = c.weight || 400;
              if (claimed.has(family + w)) return;      // an alternate won
              claimed.add(family + w);
              document.fonts.add(loaded);
              mark('active');
              note(`licensed font active: ${family} ${w} (${c.file})`);
            })
            .catch(() => note(`licensed cut not loadable (${c.file}) - keeping the bundled faces`));
        });
      })
      .catch(() => {
        mark('fallback');
        note('font manifest unreadable - keeping the bundled faces');
      });
  }

  /* Boot everything that is page-independent. */
  function boot() {
    UI.initNav();
    UI.initReveal();
    UI.initReadingBar();
    UI.initTopicButtons();
    UI.initStorageNotice();
    UI.initYear();
    loadLicensedFont();
    katexify(document);
    // KaTeX loads with `defer`, i.e. after this boot runs: typeset again once
    // the whole page (including deferred scripts) has finished loading.
    window.addEventListener('load', () => katexify(document));
    // Let individual pages react to progress changes (home dashboard).
    document.dispatchEvent(new CustomEvent('emc:ready', { detail: Progress.read() }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ------------------------------------------------------------------------ 10. Public API ------------------------------------------------------------------------ */
  return {
    CONST, TOPICS, PROGRESS_KEY,
    clamp, lerp, dist, roundTo, mapRange, damp,
    eng, unit, fixed,
    Stage, roundRect, arrow, label, chargeGlyph, scrollToEl, katexify, loadLicensedFont,
    store, Progress,
    bindRange, bindSegment, bindToggles,
    UI, toast: UI.toast
  };
})();
````

### `js/home.js` (6.5 KiB)

````javascript
/* Home page: animated dipole hero (field lines traced once per resize, dashed flow per frame) + progress dashboard driven by EMC.Progress. */
(function () {
  const { CONST, clamp, chargeGlyph, label, Progress } = EMC;
  const k = CONST.K;

  /* ---------------------------------------------------------------- hero */
  const hero = document.getElementById('heroCanvas');
  if (hero) {
    const dipole = [
      { q: 5, nx: 0.34, ny: 0.5 },
      { q: -5, nx: 0.66, ny: 0.5 }
    ];
    const PX_PER_M = 260;
    let lines = [];                       // cached polylines (canvas px)

    function fieldAt(x, y, w, h) {
      let ex = 0, ey = 0;
      for (const c of dipole) {
        const dxm = (x - c.nx * w) / PX_PER_M;
        const dym = (y - c.ny * h) / PX_PER_M;
        const r2 = dxm * dxm + dym * dym;
        if (r2 < 1e-6) continue;
        const r = Math.sqrt(r2);
        const E = k * (c.q * 1e-6) / r2;
        ex += E * dxm / r; ey += E * dym / r;
      }
      return { ex, ey, mag: Math.hypot(ex, ey) };
    }

    /* Trace the field lines once so the animation loop only has to stroke them. */
    function buildLines(w, h) {
      lines = [];
      const seeds = dipole.filter(c => c.q > 0);
      const step = 3, maxSteps = 700;
      for (const c of seeds) {
        const cx = c.nx * w, cy = c.ny * h;
        const n = 16;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          let x = cx + Math.cos(a) * 14, y = cy + Math.sin(a) * 14;
          const pts = [[x, y]];
          for (let s = 0; s < maxSteps; s++) {
            const f = fieldAt(x, y, w, h);
            if (f.mag < 1e-9) break;
            x += (f.ex / f.mag) * step; y += (f.ey / f.mag) * step;
            pts.push([x, y]);
            if (x < -30 || x > w + 30 || y < -30 || y > h + 30) break;
            let stop = false;
            for (const o of dipole) {
              if (o.q > 0) continue;
              if (Math.hypot(x - o.nx * w, y - o.ny * h) < 14) { stop = true; break; }
            }
            if (stop) break;
          }
          if (pts.length > 4) lines.push(pts);
        }
      }
    }

    const stage = new EMC.Stage(hero, (ctx, w, h, st) => {
      ctx.clearRect(0, 0, w, h);
      if (!lines.length) buildLines(w, h);

      // animated flow along the cached lines
      ctx.save();
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.setLineDash([7, 11]);
      ctx.lineDashOffset = -st.t * 26;
      lines.forEach((pts, i) => {
        ctx.strokeStyle = `hsla(${186 + (i % 5) * 6} 90% 66% / ${0.30 + 0.12 * Math.sin(st.t * 1.4 + i)})`;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      });
      ctx.restore();

      // the two charges breathe gently
      const pulse = 0.18 * Math.sin(st.t * 1.6);
      dipole.forEach(c => {
        chargeGlyph(ctx, c.nx * w, c.ny * h, 15, c.q, { pulse });
      });
      label(ctx, 'E = k q / r\u00B2    \u00B7    F = k q1 q2 / r\u00B2', w / 2, h - 16,
        { color: 'rgba(169,186,214,.75)', size: 11.5, weight: '600' });
    }, { animate: true });

    // Rebuild the cached line geometry only when the canvas size really changes.
    let lastW = 0, lastH = 0;
    const checkSize = () => {
      const r = hero.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h; lines = [];
        stage.resize(); stage.draw();
      }
    };
    window.addEventListener('resize', checkSize);
    checkSize();
  }

  /* ---------------------------------------------------------- dashboard */
  const ring = document.getElementById('ringFg');
  const RING_R = 58, RING_C = 2 * Math.PI * RING_R;
  if (ring) { ring.style.strokeDasharray = `${RING_C.toFixed(1)}`; ring.style.strokeDashoffset = String(RING_C); }

  const TOPIC_META = {
    charges: { title: 'Electric charges & fields', href: 'topics/charges.html' },
    current: { title: 'Current electricity', href: 'topics/current.html' },
    magnetism: { title: 'Magnetism', href: 'topics/magnetism.html' },
    induction: { title: 'Electromagnetic induction', href: 'topics/induction.html' }
  };

  function renderDashboard() {
    const p = Progress.read();
    const pct = Progress.percent();
    const setTxt = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };

    if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - clamp(pct, 0, 100) / 100));
    setTxt('ringPct', `${pct}%`);
    setTxt('dashPct', `${pct}% complete`);

    const doneCount = EMC.TOPICS.filter(t => p.topics[t]).length;
    const topicsLine = `${doneCount} of ${EMC.TOPICS.length} topics studied`;
    setTxt('dashTopicsDone', topicsLine);      // dashboard definition list
    setTxt('dashTopicsChip', topicsLine);      // chip above the topic grid
    setTxt('dashQuizBest', p.quizAttempts ? `${p.quizBest}%` : 'not attempted');
    setTxt('dashQuizAttempts', String(p.quizAttempts));
    setTxt('dashUpdated', p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '\u2014');

    EMC.TOPICS.forEach(t => {
      const pill = document.querySelector(`[data-topic-check="${t}"]`);
      if (!pill) return;
      const done = !!p.topics[t];
      pill.classList.toggle('done', done);
      pill.textContent = done ? 'completed' : 'not started';
      const link = document.querySelector(`[data-topic-link="${t}"]`);
      if (link) link.setAttribute('aria-label', `${TOPIC_META[t].title} — ${done ? 'completed' : 'not started'}`);
    });

    const notice = document.getElementById('storageNotice');
    if (notice && !EMC.store.available && !notice.innerHTML) {
      notice.hidden = false;
    }
    const status = document.getElementById('storageStatus');
    if (status) status.textContent = EMC.store.available
      ? 'enabled \u2014 your progress is saved in this browser'
      : 'unavailable \u2014 progress will not persist in this browser';
  }

  document.addEventListener('emc:progress', renderDashboard);
  document.addEventListener('emc:ready', renderDashboard);
  renderDashboard();

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    Progress.reset();
    renderDashboard();
    document.querySelectorAll('[data-complete-topic]').forEach(b => {
      b.classList.add('btn-primary');
      b.textContent = 'Mark topic as complete';
      b.setAttribute('aria-pressed', 'false');
    });
    EMC.toast('Progress cleared');
  });
})();
````

### `js/quiz-data.js` (15.6 KiB)

````javascript
/* Quiz bank: 25 multiple-choice questions with worked explanations. Schema: { id, topic, label, q, options[4], answer (0-based), explain }. */
window.EMC_QUIZ = [

  /* ---------------- Topic 1: electric charges and fields ---------------- */
  {
    id: 1, topic: 'charges', label: 'Charges & fields',
    q: 'Two point charges, +2 \u00B5C and \u22122 \u00B5C, are 0.30 m apart. What is the magnitude of the force between them? (k = 8.99\u00D710<sup>9</sup> N\u00B7m\u00B2/C\u00B2)',
    options: ['0.40 N, attractive', '0.40 N, repulsive', '4.0 N, attractive', '0.040 N, attractive'],
    answer: 0,
    explain: 'F = k|q<sub>1</sub>q<sub>2</sub>|/r\u00B2 = (8.99\u00D710<sup>9</sup>)(2\u00D710<sup>−6</sup>)(2\u00D710<sup>−6</sup>)/(0.30)\u00B2 = 0.399 \u2248 <b>0.40 N</b>. Opposite signs \u21D2 the force is <b>attractive</b>.'
  },
  {
    id: 2, topic: 'charges', label: 'Charges & fields',
    q: 'Electric field lines around an isolated NEGATIVE point charge\u2026',
    options: ['point radially outward from the charge', 'point radially inward toward the charge',
              'form closed circles around the charge', 'are parallel straight lines'],
    answer: 1,
    explain: 'By convention field lines start on positive charge and end on negative charge, so around a lone negative charge they point <b>radially inward</b>. A positive test charge placed nearby would be pulled toward it.'
  },
  {
    id: 3, topic: 'charges', label: 'Charges & fields',
    q: 'Two charges exert a force F on each other. The separation is doubled while the charges stay the same. The new force is:',
    options: ['F/4', 'F/2', '2F', '4F'],
    answer: 0,
    explain: 'Coulomb\u2019s law is an <b>inverse-square</b> law: F \u221D 1/r\u00B2. Doubling r divides F by 2\u00B2 = 4, so the force becomes <b>F/4</b>.'
  },
  {
    id: 4, topic: 'charges', label: 'Charges & fields',
    q: 'A proton is released from rest in a uniform electric field that points to the right. It will:',
    options: ['accelerate to the right', 'accelerate to the left',
              'move right at constant speed', 'stay where it is'],
    answer: 0,
    explain: 'F = qE and q > 0 for a proton, so the force is <b>along</b> E \u2014 to the right. Released from rest it <b>accelerates</b> (it does not move at constant speed, because a net force acts on it).'
  },
  {
    id: 5, topic: 'charges', label: 'Charges & fields',
    q: 'Which pair of units are both valid for electric field strength?',
    options: ['N/C and V/m', 'N\u00B7m and V\u00B7m', 'C/N and m/V', 'J/C and N\u00B7C'],
    answer: 0,
    explain: 'E = F/q gives <b>N/C</b>; E = V/d (uniform field) gives <b>V/m</b>. They are equivalent: 1 V/m = 1 J/(C\u00B7m) = 1 N/C. (J/C is the volt, not a field unit.)'
  },

  /* ---------------- Topic 2: current electricity ------------------------ */
  {
    id: 6, topic: 'current', label: 'Current electricity',
    q: 'A 12 V battery is connected across a 4 \u03A9 resistor. The current is:',
    options: ['48 A', '3 A', '0.33 A', '8 A'],
    answer: 1,
    explain: 'Ohm\u2019s law: I = V/R = 12/4 = <b>3 A</b>. (48 A comes from multiplying instead of dividing \u2014 the most common slip.)'
  },
  {
    id: 7, topic: 'current', label: 'Current electricity',
    q: 'Three resistors of 2 \u03A9, 3 \u03A9 and 5 \u03A9 are connected in SERIES. Their equivalent resistance is:',
    options: ['0.97 \u03A9', '10 \u03A9', '3.3 \u03A9', '30 \u03A9'],
    answer: 1,
    explain: 'Series resistances <b>add</b>: R<sub>eq</sub> = 2 + 3 + 5 = <b>10 \u03A9</b>. In series R<sub>eq</sub> is always larger than the largest single resistor.'
  },
  {
    id: 8, topic: 'current', label: 'Current electricity',
    q: 'A 6 \u03A9 and a 3 \u03A9 resistor are connected in PARALLEL. Their equivalent resistance is:',
    options: ['9 \u03A9', '4.5 \u03A9', '2 \u03A9', '18 \u03A9'],
    answer: 2,
    explain: '1/R<sub>eq</sub> = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 \u21D2 R<sub>eq</sub> = <b>2 \u03A9</b>. In parallel R<sub>eq</sub> is always <b>smaller</b> than the smallest branch \u2014 adding a path makes it easier for current to flow.'
  },
  {
    id: 9, topic: 'current', label: 'Current electricity',
    q: 'In a series circuit containing several different resistors, which quantity is the SAME through every resistor?',
    options: ['the voltage across it', 'the current through it', 'the power it dissipates', 'the charge stored in it'],
    answer: 1,
    explain: 'There is only one path, so the <b>current is identical</b> everywhere (charge is conserved \u2014 Kirchhoff\u2019s current law). Voltages divide in proportion to R, so P = I\u00B2R differs too. Resistors do not store charge.'
  },
  {
    id: 10, topic: 'current', label: 'Current electricity',
    q: 'A 10 \u03A9 resistor carries a current of 2 A. The power it dissipates is:',
    options: ['5 W', '20 W', '40 W', '0.4 W'],
    answer: 2,
    explain: 'P = I\u00B2R = (2)\u00B2(10) = <b>40 W</b>. Equivalently V = IR = 20 V and P = VI = 20 \u00D7 2 = 40 W. That is far above a standard \u00BC W resistor \u2014 it would need a proper power resistor and a heat sink.'
  },
  {
    id: 11, topic: 'current', label: 'Current electricity',
    q: 'An ideal battery is connected to one resistor. A second resistor is then added in PARALLEL with the first. The total current supplied by the battery:',
    options: ['increases', 'decreases', 'stays the same', 'becomes zero'],
    answer: 0,
    explain: 'Adding a parallel path <b>lowers</b> the equivalent resistance, and I = V/R<sub>eq</sub> with V fixed, so the total current <b>increases</b>. Each branch still sees the full battery voltage. (This is why overloading a household circuit trips the breaker.)'
  },

  /* ---------------- Topic 3: magnetism ---------------------------------- */
  {
    id: 12, topic: 'magnetism', label: 'Magnetism',
    q: 'Outside a bar magnet, magnetic field lines run:',
    options: ['from the south pole to the north pole', 'from the north pole to the south pole',
              'only through the middle of the magnet', 'in straight lines that never curve'],
    answer: 1,
    explain: 'Outside the magnet the lines go <b>N \u2192 S</b>; inside the magnet they continue S \u2192 N, so every line is a <b>closed loop</b>. That is the graphical statement of \u201Cthere are no magnetic monopoles\u201D.'
  },
  {
    id: 13, topic: 'magnetism', label: 'Magnetism',
    q: 'A charged particle moves PARALLEL to a uniform magnetic field. The magnetic force on it is:',
    options: ['maximum', 'q v B', 'zero', 'perpendicular to the field'],
    answer: 2,
    explain: 'F = qvB sin\u03B8 and \u03B8 = 0\u00B0, so sin\u03B8 = 0 and <b>F = 0</b>. The particle continues in a straight line at constant speed. The force is largest when v \u22A5 B.'
  },
  {
    id: 14, topic: 'magnetism', label: 'Magnetism',
    q: 'A positive charge moves to the right (+x) through a magnetic field pointing OUT of the page (+z). The force on it points:',
    options: ['up (+y)', 'down (\u2212y)', 'to the right (+x)', 'out of the page (+z)'],
    answer: 1,
    explain: 'F = q v \u00D7 B. With v = x\u0302 and B = z\u0302: x\u0302 \u00D7 z\u0302 = \u2212y\u0302, so the force is <b>downward</b>. Right hand: fingers along v (right), curl them out of the page, and the thumb points down.'
  },
  {
    id: 15, topic: 'magnetism', label: 'Magnetism',
    q: 'A charged particle moves in a circle at constant speed in a uniform magnetic field. Which statement is correct?',
    options: ['The magnetic force does work on the particle, increasing its kinetic energy.',
              'The magnetic force is always perpendicular to the velocity, so it does no work and only changes the direction of motion.',
              'The particle must be accelerating in the direction of its velocity.',
              'The radius of the circle is independent of the particle\u2019s mass.'],
    answer: 1,
    explain: 'F = qv \u00D7 B is always \u22A5 v, so F\u00B7v = 0: <b>no work, no change in speed or kinetic energy</b> \u2014 the force only bends the path. The radius r = mv/(|q|B) certainly depends on mass, and the acceleration is centripetal (inward), never along v.'
  },

  /* ---------------- Topic 4: electromagnetic induction ------------------ */
  {
    id: 16, topic: 'induction', label: 'Electromagnetic induction',
    q: 'A coil of 200 turns has a magnetic flux through each turn changing at 0.05 Wb/s. The induced EMF is:',
    options: ['0.25 V', '10 V', '4000 V', '0.00025 V'],
    answer: 1,
    explain: 'Faraday\u2019s law: |EMF| = N\u00B7|d\u03A6/dt| = 200 \u00D7 0.05 = <b>10 V</b>. The EMF depends on the <b>rate of change</b> of flux, not on the flux itself.'
  },
  {
    id: 17, topic: 'induction', label: 'Electromagnetic induction',
    q: 'Lenz\u2019s law states that the induced current flows in a direction such that it:',
    options: ['reinforces the change in flux that produced it',
              'opposes the change in flux that produced it',
              'always flows clockwise',
              'makes the net flux through the coil zero'],
    answer: 1,
    explain: 'The induced current <b>opposes the change</b> that created it (that is the minus sign in EMF = \u2212Nd\u03A6/dt). It opposes the <i>change</i>, not the flux itself \u2014 so it cannot make the total flux zero. This is energy conservation in disguise: you must do mechanical work against the opposition.'
  },
  {
    id: 18, topic: 'induction', label: 'Electromagnetic induction',
    q: 'A bar magnet is pushed through a coil connected to a resistor. Which change would NOT alter the magnitude of the EMF induced in the coil?',
    options: ['Moving the magnet faster', 'Using a coil with more turns',
              'Using a stronger magnet', 'Increasing the resistance of the circuit'],
    answer: 3,
    explain: 'EMF = \u2212N d\u03A6/dt depends on turns, magnet strength and speed only. Changing <b>R</b> leaves the EMF alone but changes the induced <b>current</b> (I = EMF/R) and the power dissipated. Resistance shapes the current and the heating \u2014 never the EMF itself.'
  },
  {
    id: 19, topic: 'induction', label: 'Electromagnetic induction',
    q: 'A strong magnet dropped down a vertical copper tube falls much more slowly than it would in free fall. Why?',
    options: ['Copper is magnetic and attracts the magnet.',
              'The moving magnet induces eddy currents in the tube whose fields oppose the motion (Lenz\u2019s law).',
              'Air resistance inside the tube is much larger.',
              'The magnet loses its magnetism inside copper.'],
    answer: 1,
    explain: 'The falling magnet changes the flux through each part of the conducting tube, driving <b>eddy currents</b>. By Lenz\u2019s law their field opposes the relative motion, giving an upward drag force. The lost gravitational potential energy appears as heat (I\u00B2R) in the copper \u2014 the same principle used in eddy-current brakes.'
  },
  {
    id: 20, topic: 'induction', label: 'Electromagnetic induction',
    q: 'A bar magnet is held perfectly STILL at the centre of a coil connected to a galvanometer. The galvanometer reads:',
    options: ['a steady deflection, because the magnet is inside the coil',
              'zero, because the flux through the coil is not changing',
              'an alternating deflection, because the field lines are moving',
              'zero only if the coil has an even number of turns'],
    answer: 1,
    explain: 'A large, constant flux still gives d\u03A6/dt = 0, so <b>EMF = 0</b> and no current flows. Induction needs <b>change</b> \u2014 a stationary magnet inside a coil produces nothing, which is exactly why generators must rotate.'
  },

  /* ------------- flow questions: one gentle step per chapter ------------- */
  {
    id: 21, topic: 'charges', label: 'Charges & fields',
    q: 'An atom of carbon is electrically neutral. Why?',
    options: ['It contains no charged particles at all',
              'It has equal numbers of protons and electrons',
              'Protons and electrons are the same particle',
              'Its neutrons cancel out the protons'],
    answer: 1,
    explain: 'Neutrality is a <b>balance</b>, not an absence: six protons (+6e) and six electrons (\u22126e) sum to zero. Rub the atom\u2019s material and you move electrons around \u2014 that imbalance <i>is</i> static charge, and it is where Topic 1 begins.'
  },
  {
    id: 22, topic: 'current', label: 'Current electricity',
    q: 'A household circuit breaker \u201Ctrips\u201D (switches off) after you plug in a heater, a kettle and a microwave at once. What actually happened?',
    options: ['The mains voltage rose until it became dangerous',
              'Adding appliances in parallel lowered the equivalent resistance, so the total current exceeded the safe rating',
              'One of the appliances broke the circuit',
              'The electricity meter ran out of credit'],
    answer: 1,
    explain: 'Every appliance is another <b>parallel</b> path across the same voltage, and parallel paths always lower R<sub>eq</sub>. With V fixed, I = V/R<sub>eq</sub> rises \u2014 and the cables would heat as I<sup>2</sup>R. The breaker opens before that heat becomes a fire. This is Topic 2\u2019s parallel rule protecting your house.'
  },
  {
    id: 23, topic: 'magnetism', label: 'Magnetism',
    q: 'A free compass needle settles pointing roughly north. The best explanation is:',
    options: ['Gravity pulls the needle north',
              'Static electricity in the air aligns it',
              'Earth\u2019s magnetic field exerts a torque on the needle\u2019s tiny dipole, turning it into line with the field',
              'The needle is always pointing at the nearest magnet'],
    answer: 2,
    explain: 'The needle is a small bar magnet, and a field exerts a <b>torque</b> on a dipole until it lies along the field lines \u2014 exactly what the compass grid shows in the Topic 3 lab. Bonus fact: the pole near geographic north is magnetically a <b>south</b> pole, which is why the needle\u2019s north end is attracted there.'
  },
  {
    id: 24, topic: 'induction', label: 'Electromagnetic induction',
    q: 'A coil spinning at a steady rate in a steady magnetic field produces ALTERNATING current. Why does the current keep reversing?',
    options: ['The magnets inside the generator flip over twice per turn',
              'The coil heats up and cools down as it spins',
              'The flux linkage rises then falls (and changes sense) every half turn, so d\u03A6/dt keeps changing sign',
              'Carbon brushes swap the wires at random'],
    answer: 2,
    explain: '\u03A6 = NBA\u00B7cos(\u03C9t): as the coil turns, the flux swings from maximum one way, through zero, to maximum the other way. The <b>derivative</b> of that swing \u2014 the EMF \u2014 is a sine wave, positive half the time and negative the other half. Steady spin, alternating output: that is the grid.'
  },
  {
    id: 25, topic: 'induction', label: 'Electromagnetic induction',
    q: 'Which chain best describes a hydroelectric power station, from reservoir to socket?',
    options: ['Gravitational potential \u2192 kinetic energy of water \u2192 mechanical turn of a turbine \u2192 electrical energy by electromagnetic induction',
              'Chemical \u2192 thermal \u2192 electrical energy by induction',
              'Kinetic energy of water \u2192 static charge on the turbine \u2192 electrical energy',
              'Gravitational potential \u2192 light \u2192 electrical energy by the photoelectric effect'],
    answer: 0,
    explain: 'Falling water converts <b>gravitational potential</b> into <b>kinetic</b> energy; the stream turns a turbine (<b>mechanical</b>); the turbine spins a coil in a field, and <b>Faraday\u2019s law</b> does the last step. Charges, current, magnetism and induction all appear in that chain \u2014 which is why induction is the finale.'
  }
];
````

### `js/quiz.js` (24.5 KiB)

````javascript
/* Quiz engine: exam/instant marking, automatic scoring with per-topic breakdown and grade bands, timer + per-question splits, streak counter, keyboard flow, Chart.js analytics with a CSS-bar fallback when the CDN is absent, progress persisted through EMC.Progress. */
(function () {
  const host = document.getElementById('quiz-questions');
  if (!host || !window.EMC_QUIZ) return;

  const { Progress, toast } = EMC;
  const BANK = window.EMC_QUIZ.slice();
  const KEYS = ['A', 'B', 'C', 'D', 'E'];

  /* ---- state ---------------------------------------------------------- */
  let activeCharts = [];          // Chart.js instances (destroyed on re-grade)
  let timerHandle = 0;            // 1 s ticker for the quiz clock

  /* Denki-chan reaction faces for graded feedback (inline SVG, no library) */
  const FACE_HAPPY = '<svg class="mreact" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M20 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M34 30 q3 -4 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M27 37 q3 3 6 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/></svg>';
  const FACE_OOPS = '<svg class="mreact" viewBox="0 0 60 56" aria-hidden="true"><path d="M19 13 C17 4 23 2 24.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><path d="M41 13 C43 4 37 2 35.5 8" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><ellipse cx="30" cy="32" rx="21" ry="20" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/><circle cx="23" cy="29" r="2.4" fill="#2b2d33"/><circle cx="37" cy="29" r="2.4" fill="#2b2d33"/><path d="M26 39 q4 -3 8 0" stroke="#2b2d33" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="15" cy="35" r="3" fill="#f8aebe" opacity=".85"/><circle cx="45" cy="35" r="3" fill="#f8aebe" opacity=".85"/><path d="M46 18 q3 5 0 7 q-3 -2 0 -7" fill="#a8d3e0"/></svg>';

  const S = {
    order: BANK.slice(),          // current question order (shuffle changes this)
    filter: 'all',                // 'all' | topic id | 'wrong'
    answers: new Map(),           // question id -> chosen option index
    marked: new Map(),            // question id -> true/false (only once graded)
    submitted: false,
    instant: false,
    blankWarned: false,
    t0: 0,                 // quiz clock start (ms, 0 = not started)
    lastMark: 0,           // timestamp of the previously answered question
    times: new Map(),      // question id -> seconds spent on it
    streak: 0,             // live streak (instant mode)
    bestStreak: 0,         // longest consecutive-correct run (question order)
    totalTime: 0,          // seconds, frozen at submit
    activeCard: null       // card nearest the viewport centre (keyboard target)
  };

  const el = id => document.getElementById(id);
  const visible = () => S.order.filter(q => {
    if (S.filter === 'all') return true;
    if (S.filter === 'wrong') return S.marked.get(q.id) === false;
    return q.topic === S.filter;
  });

  /* ---- rendering ------------------------------------------------------- */
  function questionHTML(q, index) {
    const chosen = S.answers.has(q.id) ? S.answers.get(q.id) : -1;
    const isMarked = S.marked.has(q.id);
    const correct = S.marked.get(q.id);
    const topicClass = { charges: 'tag-rose', current: 'tag-amber', magnetism: 'tag-violet', induction: 'tag-cyan' }[q.topic] || '';

    const opts = q.options.map((text, i) => {
      let cls = 'opt';
      if (isMarked) {
        if (i === q.answer) cls += ' correct';
        else if (i === chosen) cls += ' wrong';
      }
      // worded marks: U+2713/U+2717 are absent from several common font stacks
      const mark = isMarked && i === q.answer ? '<span class="mark">correct</span>'
        : isMarked && i === chosen ? '<span class="mark">your answer</span>' : '';
      return `<button type="button" class="${cls}" role="radio" data-opt="${i}"
                aria-checked="${i === chosen}" ${isMarked ? 'disabled' : ''}>
                <span class="key">${KEYS[i]}</span><span>${text}</span>${mark}</button>`;
    }).join('');

    let fb = '';
    if (isMarked) {
      const secs = S.times.get(q.id);
      fb = `<div class="feedback ${correct ? 'good' : 'bad'}">
              ${correct ? FACE_HAPPY : FACE_OOPS}
              <span><b>${correct ? 'Correct.' : 'Not quite.'}</b> ${q.explain}${
                secs ? ` <span class="tiny faint">(answered in ${secs}s)</span>` : ''}</span>
            </div>`;
    } else if (chosen >= 0) {
      fb = `<div class="feedback">Answer recorded: <b>${KEYS[chosen]}</b>. ${
        S.instant ? '' : 'It will be marked when you submit the quiz.'}</div>`;
    }

    const cardClass = isMarked ? (correct ? 'answered-correct' : 'answered-wrong') : (chosen >= 0 ? 'answered' : '');
    return `<article class="q-card ${cardClass}" data-qid="${q.id}" id="q-${q.id}">
      <div class="q-head">
        <span class="q-num">${index + 1}</span>
        <div style="min-width:0">
          <p class="q-text">${q.q}</p>
          <span class="tag ${topicClass} q-topic">${q.label}</span>
        </div>
      </div>
      <div class="opts" role="radiogroup" aria-label="Answer options for question ${index + 1}">${opts}</div>
      ${fb}
    </article>`;
  }

  function render() {
    const list = visible();
    if (!list.length) {
      host.innerHTML = `<div class="card center muted">No questions match this filter
        ${S.filter === 'wrong' ? '(nothing was incorrect \u2014 well done!)' : ''}.</div>`;
    } else {
      host.innerHTML = list.map((q, i) => questionHTML(q, i)).join('');
    }
    renderMeta();
  }

  /* Answered-count bar, counters in the sticky panel. */
  function renderMeta() {
    const list = visible();
    const answered = list.filter(q => S.answers.has(q.id)).length;
    const total = list.length;
    const pct = total ? (answered / total) * 100 : 0;
    if (el('quiz-progress-fill')) el('quiz-progress-fill').style.width = pct.toFixed(1) + '%';
    if (el('quiz-progress-text')) el('quiz-progress-text').textContent = `${answered} of ${total} answered`;
    if (el('quiz-count')) el('quiz-count').textContent = String(total);   // label already says "Questions"

    // live score while in instant mode
    if (S.instant && el('quiz-live')) {
      const marked = list.filter(q => S.marked.has(q.id));
      const right = marked.filter(q => S.marked.get(q.id) === true).length;
      el('quiz-live').hidden = marked.length === 0;
      el('quiz-live').textContent = `\u00A0\u00B7 Marked so far: ${right}/${marked.length}`;
    } else if (el('quiz-live')) {
      el('quiz-live').hidden = true;
    }

    const submitBtn = el('quiz-submit');
    if (submitBtn) {
      submitBtn.disabled = S.submitted;
      submitBtn.textContent = S.submitted ? 'Quiz submitted' : `Submit quiz (${total})`;
    }
  }

  /* ---- clock, streaks, keyboard ---------------------------------------- */
  const fmtTime = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  function startTimer() {
    if (S.t0) return;
    S.t0 = performance.now(); S.lastMark = S.t0;
    const elT = el('quiz-timer');
    if (elT) elT.hidden = false;
    timerHandle = setInterval(() => {
      if (elT && S.t0 && !S.submitted) elT.textContent = fmtTime(Math.round((performance.now() - S.t0) / 1000));
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerHandle); timerHandle = 0;
    if (S.t0) S.totalTime = Math.round((performance.now() - S.t0) / 1000);
  }
  function recordTime(qid) {
    if (!S.t0) return;
    const now = performance.now();
    S.times.set(qid, Math.max(1, Math.round((now - S.lastMark) / 1000)));
    S.lastMark = now;
  }
  function bumpStreak(correct) {
    S.streak = correct ? S.streak + 1 : 0;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    const elS = el('quiz-streak');
    if (elS) { elS.hidden = S.streak < 2; elS.textContent = `streak \u00D7${S.streak}`; }
  }
  function computeBestStreak() {
    let run = 0, best = 0;
    for (const q of S.order) {
      if (S.marked.get(q.id) === true) { run++; best = Math.max(best, run); } else run = 0;
    }
    return best;
  }
  function initKeyboardAndFocus() {
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(entries => {
        for (const en of entries) if (en.isIntersecting && en.intersectionRatio >= 0.4) S.activeCard = en.target;
      }, { threshold: [0.4, 0.7] });
      const watch = () => host.querySelectorAll('.q-card').forEach(c => io.observe(c));
      watch();
      new MutationObserver(watch).observe(host, { childList: true });
    }
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && /INPUT|TEXTAREA|SELECT|SUMMARY|BUTTON/.test(t.tagName)) return;
      const card = S.activeCard;
      if (!card) return;
      const key = e.key.toLowerCase();
      const idx = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key)
        : 'abcd'.indexOf(key) >= 0 ? 'abcd'.indexOf(key) : -1;
      if (idx >= 0 && !S.submitted) {
        const opt = card.querySelectorAll('.opt:not([disabled])')[idx];
        if (opt) { opt.click(); e.preventDefault(); }
      } else if (e.key === 'Enter' && !S.submitted) {
        const sb = el('quiz-submit'); if (sb && !sb.disabled) { sb.click(); e.preventDefault(); }
      } else if (key === 'n' && !S.submitted) {
        const blank = visible().find(q => !S.answers.has(q.id));
        if (blank) EMC.scrollToEl(document.getElementById(`q-${blank.id}`));
        e.preventDefault();
      }
    });
  }

  /* ---- answering ------------------------------------------------------- */
  host.addEventListener('click', e => {
    const btn = e.target.closest('.opt');
    if (!btn || btn.disabled) return;
    const card = btn.closest('.q-card');
    const qid = Number(card.dataset.qid);
    const q = BANK.find(x => x.id === qid);
    if (!q || S.marked.has(qid)) return;

    S.answers.set(qid, Number(btn.dataset.opt));
    startTimer();
    recordTime(qid);

    if (S.instant) {
      const right = S.answers.get(qid) === q.answer;
      S.marked.set(qid, right);
      bumpStreak(right);
      render();
      if (right) {
        const winOpt = document.querySelector(`#q-${qid} .opt.correct`);
        if (winOpt) winOpt.classList.add('burst');
        toast(S.streak >= 3 ? `Correct \u2014 streak \u00D7${S.streak}!` : 'Correct!');
      }
      EMC.scrollToEl(document.getElementById(`q-${qid}`));
    } else {
      // light-touch update: no full re-render, so scroll position is preserved
      card.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-checked', String(b === btn)));
      let fb = card.querySelector('.feedback');
      if (!fb) { fb = document.createElement('div'); fb.className = 'feedback'; card.appendChild(fb); }
      fb.innerHTML = `Answer recorded: <b>${KEYS[S.answers.get(qid)]}</b>. It will be marked when you submit the quiz.`;
      card.classList.add('answered');
      renderMeta();
    }
  });

  /* keyboard: arrow keys move between options inside a group */
  host.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const btn = e.target.closest('.opt');
    if (!btn) return;
    const group = Array.from(btn.parentElement.querySelectorAll('.opt:not([disabled])'));
    const i = group.indexOf(btn);
    const next = group[(i + (e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 1) + group.length) % group.length];
    if (next) { next.focus(); e.preventDefault(); }
  });

  /* ---- scoring --------------------------------------------------------- */
  const BANDS = [
    { min: 90, text: 'Outstanding', cls: 'accent-emerald', note: 'You have this material mastered \u2014 try explaining Lenz\u2019s law to someone else.' },
    { min: 75, text: 'Strong', cls: 'accent-cyan', note: 'Solid understanding. Review the questions you missed and re-run the relevant simulation.' },
    { min: 60, text: 'Getting there', cls: 'accent-amber', note: 'You know the core ideas. Work through the wrong answers below, then retake the quiz.' },
    { min: 40, text: 'Keep practising', cls: 'accent-amber', note: 'Re-read the tutorial sections flagged by your wrong answers and use the simulations to build intuition.' },
    { min: 0, text: 'Time to revisit', cls: 'accent-rose', note: 'Start again with Topic 1 and work through the simulations slowly \u2014 the concepts build on each other.' }
  ];
  const bandFor = pct => BANDS.find(b => pct >= b.min);

  function submit() {
    // The score always covers the FULL bank: a topic filter is a revision aid,
    // not a way to shrink the denominator. Blanks count as incorrect.
    const blanks = S.order.filter(q => !S.answers.has(q.id));

    // One-time guard so a stray click cannot silently cost marks.
    if (blanks.length && !S.blankWarned) {
      S.blankWarned = true;
      toast(`${blanks.length} question${blanks.length === 1 ? ' is' : 's are'} still blank (across all topics) \u2014 click Submit again to grade them as incorrect`, 'warn');
      // jump to the first blank one the user can actually see
      S.filter = 'all'; syncFilterButtons(); render();
      const first = document.getElementById(`q-${blanks[0].id}`);
      if (first) {
        EMC.scrollToEl(first);
        if (first.animate) {
          try {
            first.animate(
              [{ boxShadow: '0 0 0 0 rgba(251,191,36,0)' },
               { boxShadow: '0 0 0 4px rgba(251,191,36,.55)' },
               { boxShadow: '0 0 0 0 rgba(251,191,36,0)' }],
              { duration: 1400, iterations: 2 }
            );
          } catch (err) { /* Web Animations API unavailable - not critical */ }
        }
      }
      return;
    }

    S.submitted = true;
    stopTimer();
    S.filter = 'all';
    syncFilterButtons();
    S.order.forEach(q => { S.marked.set(q.id, S.answers.has(q.id) && S.answers.get(q.id) === q.answer); });
    if (!S.instant) S.bestStreak = computeBestStreak();
    render();

    // record FIRST so the score card can quote the updated best/attempts
    const scored = S.order.slice();
    const right = scored.filter(q => S.marked.get(q.id) === true).length;
    const pct = scored.length ? Math.round((right / scored.length) * 100) : 0;
    Progress.recordQuiz(pct);
    document.dispatchEvent(new CustomEvent('emc:progress', { detail: Progress.read() }));
    showScore();
  }

  function showScore() {
    const box = el('quiz-score');
    if (!box) return;
    const scored = S.order.slice();          // the full bank was graded on submit
    const right = scored.filter(q => S.marked.get(q.id) === true).length;
    const total = scored.length;
    const pct = total ? Math.round((right / total) * 100) : 0;
    const band = bandFor(pct);
    const prog = Progress.read();

    // per-topic breakdown
    const topics = ['charges', 'current', 'magnetism', 'induction'];
    const rows = topics.map(t => {
      const qs = scored.filter(q => q.topic === t);
      if (!qs.length) return '';
      const ok = qs.filter(q => S.marked.get(q.id) === true).length;
      const p = Math.round((ok / qs.length) * 100);
      const lbl = qs[0].label;
      return `<div class="grid gap-2 items-center" style="grid-template-columns:minmax(120px,1fr) 2fr auto">
                <span class="small muted">${lbl}</span>
                <span class="progress-track"><span class="progress-fill" style="width:${p}%"></span></span>
                <span class="mono small">${ok}/${qs.length}</span>
              </div>`;
    }).join('');

    box.hidden = false;
    box.innerHTML = `
      <div class="score-card">
        <div>
          <div class="grade ${band.cls}">${pct}%</div>
          <div class="small muted mono">${right} / ${total} correct</div>
        </div>
        <div class="score-bar">
          <div class="tag ${pct >= 75 ? 'tag-emerald' : pct >= 50 ? 'tag-amber' : 'tag-rose'}">${band.text}</div>
          <p class="small muted" style="margin:.5rem 0 .8rem">${band.note}</p>
          <div class="progress-track" style="margin-bottom:.9rem"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div id="quiz-fallback-bars" style="display:grid;gap:.4rem">${rows}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" id="quiz-charts">
        <div class="card card-flat">
          <span class="tag tag-emerald">This attempt</span>
          <div style="height:170px;position:relative"><canvas id="chart-score" role="img"
            aria-label="Doughnut chart of correct versus incorrect answers"></canvas></div>
        </div>
        <div class="card card-flat">
          <span class="tag tag-cyan">Score by topic</span>
          <div style="height:170px;position:relative"><canvas id="chart-topics" role="img"
            aria-label="Bar chart of the percentage score in each topic"></canvas></div>
        </div>
        <div class="card card-flat">
          <span class="tag tag-amber">Attempt history</span>
          <div style="height:170px;position:relative"><canvas id="chart-history" role="img"
            aria-label="Line chart of the score across recent quiz attempts"></canvas></div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="tag">time ${fmtTime(S.totalTime)}</span>
        <span class="tag tag-amber">best streak \u00D7${S.bestStreak}</span>
        <span class="tag tag-cyan">${total ? Math.round(S.totalTime / total) : 0}s per question</span>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <button class="btn btn-primary" id="quiz-retake" type="button">Retake the quiz</button>
        <button class="btn" id="quiz-wrong" type="button">Review incorrect only</button>
        <a class="btn btn-ghost" href="index.html">Back to the home page</a>
        <span class="tiny faint self-center">Best score: ${prog.quizBest}% \u00B7 attempts: ${prog.quizAttempts}</span>
      </div>`;

    const wrongCount = scored.filter(q => S.marked.get(q.id) === false).length;
    const wrongBtn = el('quiz-wrong');
    if (wrongBtn) {
      if (!wrongCount) { wrongBtn.disabled = true; wrongBtn.textContent = 'No incorrect answers'; }
      wrongBtn.addEventListener('click', () => {
        S.filter = S.filter === 'wrong' ? 'all' : 'wrong';
        syncFilterButtons();
        render();
        EMC.scrollToEl(host, { behavior: 'smooth', block: 'start' });
      });
    }
    const retake = el('quiz-retake');
    if (retake) retake.addEventListener('click', () => {
      S.answers.clear(); S.marked.clear(); S.submitted = false; S.blankWarned = false;
      S.t0 = 0; S.lastMark = 0; S.times.clear(); S.streak = 0; S.bestStreak = 0; S.totalTime = 0;
      clearInterval(timerHandle); timerHandle = 0;
      const elT = el('quiz-timer'); if (elT) { elT.hidden = true; elT.textContent = '0:00'; }
      const elS = el('quiz-streak'); if (elS) elS.hidden = true;
      S.filter = 'all'; syncFilterButtons();
      activeCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
      activeCharts = [];
      box.hidden = true;
      render();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* ignore */ }
      toast('Quiz reset \u2014 good luck!');
    });

    renderScoreCharts(right, total, scored);
    EMC.scrollToEl(box);
  }

  /* ---- Chart.js score visualisation (graceful fallback when CDN absent) -- */
  function renderScoreCharts(right, total, scored) {
    // always tear down previous instances first (Chart.js refuses to reuse a canvas)
    activeCharts.forEach(c => { try { c.destroy(); } catch (e) {} });
    activeCharts = [];
    const chartsHost = el('quiz-charts');
    const fallback = el('quiz-fallback-bars');
    if (!chartsHost) return;

    if (!window.Chart) {
      // Offline / blocked CDN: keep the dependency-free CSS bars instead.
      chartsHost.hidden = true;
      if (fallback) fallback.hidden = false;
      return;
    }
    chartsHost.hidden = false;
    if (fallback) fallback.hidden = true;   // the charts supersede the bars

    const C = window.Chart;
    C.defaults.color = '#a9bad6';
    C.defaults.borderColor = 'rgba(148,163,184,.14)';

    // 1. doughnut: correct vs incorrect
    activeCharts.push(new C(el('chart-score'), {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Incorrect'],
        datasets: [{
          data: [right, total - right],
          backgroundColor: ['#b5d777', '#f87171'],
          borderColor: '#0c1526', borderWidth: 3, hoverOffset: 6
        }]
      },
      options: {
        maintainAspectRatio: false, cutout: '66%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    }));

    // 2. horizontal bars: percentage per topic
    // short axis labels: the full names clip on narrow canvases
    const SHORT_TOPIC = { charges: 'Charges', current: 'Current', magnetism: 'Magnetism', induction: 'Induction' };
    const topics = ['charges', 'current', 'magnetism', 'induction'];
    const labels = [], vals = [];
    topics.forEach(t => {
      const qs = scored.filter(q => q.topic === t);
      if (!qs.length) return;
      labels.push(SHORT_TOPIC[t] || qs[0].label);
      vals.push(Math.round((qs.filter(q => S.marked.get(q.id) === true).length / qs.length) * 100));
    });
    activeCharts.push(new C(el('chart-topics'), {
      type: 'bar',
      data: { labels, datasets: [{ data: vals, backgroundColor: '#a8d3e0', borderRadius: 5, maxBarThickness: 18 }] },
      options: {
        indexAxis: 'y', maintainAspectRatio: false,
        scales: { x: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
        plugins: { legend: { display: false } }
      }
    }));

    // 3. line: score across attempts (from stored history)
    const hist = Progress.read().quizHistory || [];
    activeCharts.push(new C(el('chart-history'), {
      type: 'line',
      data: {
        labels: hist.map((h, i) => '#' + (i + 1)),
        datasets: [{
          label: 'score %', data: hist.map(h => h.pct),
          borderColor: '#f6d36b', backgroundColor: 'rgba(251,191,36,.16)',
          fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: '#f6d36b'
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
        plugins: { legend: { display: false } }
      }
    }));
  }

  /* ---- toolbar --------------------------------------------------------- */
  function syncFilterButtons() {
    document.querySelectorAll('[data-quiz-filter]').forEach(b => {
      const on = b.dataset.quizFilter === S.filter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  document.querySelectorAll('[data-quiz-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      S.filter = btn.dataset.quizFilter;
      if (S.filter !== 'wrong') S.blankWarned = false;
      syncFilterButtons();
      render();
    });
  });

  const shuffleBtn = el('quiz-shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
    // Fisher-Yates shuffle of the question order
    const a = S.order.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    S.order = a;
    render();
    toast('Questions shuffled');
  });

  const modeGroup = el('quiz-mode');
  if (modeGroup) EMC.bindSegment(modeGroup, v => {
    S.instant = v === 'instant';
    if (S.instant && !S.submitted) {
      // mark everything already answered so switching modes is not confusing
      S.order.forEach(q => {
        if (S.answers.has(q.id) && !S.marked.has(q.id)) {
          S.marked.set(q.id, S.answers.get(q.id) === q.answer);
        }
      });
    }
    render();
    toast(S.instant ? 'Instant mode: answers are marked as you go' : 'Exam mode: nothing is marked until you submit');
  });

  const submitBtn = el('quiz-submit');
  if (submitBtn) submitBtn.addEventListener('click', submit);

  /* ---- header stats ---------------------------------------------------- */
  const prog = Progress.read();
  if (el('quiz-best')) el('quiz-best').textContent = prog.quizBest ? `${prog.quizBest}%` : '\u2014';
  if (el('quiz-attempts')) el('quiz-attempts').textContent = String(prog.quizAttempts);
  if (el('quiz-total')) el('quiz-total').textContent = String(BANK.length);

  /* ---- boot ------------------------------------------------------------ */
  syncFilterButtons();
  render();
  initKeyboardAndFocus();
})();
````

### `js/sim-circuit.js` (23.4 KiB)

````javascript
/* Sim 4 - circuit builder. Exact series/parallel/combination solve with per element V, I, P; animated charge flow whose density tracks branch current; resistors clickable on canvas. */
(function () {
  const canvas = document.getElementById('sim-circuit');
  if (!canvas) return;

  const { clamp, lerp, label, eng, unit, fixed } = EMC;

  /* ---- state ---------------------------------------------------------- */
  const LIMITS = { series: [1, 4], parallel: [2, 4], combo: [3, 3] };
  const state = {
    topology: 'series',
    V: 12,
    resistors: [10, 22, 47],
    bulbR: 15,
    includeBulb: true,
    selected: 0
  };

  /* ---- circuit analysis ------------------------------------------------ */
  function analyze() {
    const R = state.resistors.slice();
    const top = state.topology;
    let Rbank = 0, breakdown = '', per = [];

    if (top === 'series') {
      Rbank = R.reduce((a, b) => a + b, 0);
      breakdown = `R(eq) = ${R.map(r => fixed(r, 0)).join(' + ')} = ${fixed(Rbank, 2)} \u03A9`;
    } else if (top === 'parallel') {
      const sumG = R.reduce((a, b) => a + 1 / b, 0);
      Rbank = 1 / sumG;
      breakdown = `1/R(eq) = ${R.map(r => `1/${fixed(r, 0)}`).join(' + ')} = ${fixed(sumG, 4)} S  \u21D2  R(eq) = ${fixed(Rbank, 2)} \u03A9`;
    } else { // combo: R1 in series with (R2 || R3)
      const [r1, r2, r3] = R;
      const Rp = (r2 * r3) / (r2 + r3);
      Rbank = r1 + Rp;
      breakdown = `R\u209A = (${fixed(r2, 0)} \u00D7 ${fixed(r3, 0)}) / (${fixed(r2, 0)} + ${fixed(r3, 0)}) = ${fixed(Rp, 2)} \u03A9   \u21D2   R(eq) = ${fixed(r1, 0)} + ${fixed(Rp, 2)} = ${fixed(Rbank, 2)} \u03A9`;
    }

    const Rbulb = state.includeBulb ? state.bulbR : 0;
    const Rtotal = Rbank + Rbulb;
    const Itotal = state.V / Rtotal;
    const Vbank = Itotal * Rbank;
    const Vbulb = Itotal * Rbulb;
    const Pbulb = Itotal * Itotal * Rbulb;

    if (top === 'series') {
      per = R.map((r, i) => ({ i, r, I: Itotal, V: Itotal * r, P: Itotal * Itotal * r }));
    } else if (top === 'parallel') {
      per = R.map((r, i) => ({ i, r, I: Vbank / r, V: Vbank, P: (Vbank * Vbank) / r }));
    } else {
      const [r1, r2, r3] = R;
      const V1 = Itotal * r1;
      const Vp = Vbank - V1;
      per = [
        { i: 0, r: r1, I: Itotal, V: V1, P: Itotal * Itotal * r1 },
        { i: 1, r: r2, I: Vp / r2, V: Vp, P: (Vp * Vp) / r2 },
        { i: 2, r: r3, I: Vp / r3, V: Vp, P: (Vp * Vp) / r3 }
      ];
    }
    return { Rbank, Rtotal, Itotal, Vbank, Vbulb, Pbulb, per, breakdown };
  }

  /* ---- layout ---------------------------------------------------------- */
  /* * Builds the geometry for the current topology. * @returns {{frame:Object, comps:Array, paths:Array, hits:Array}} * comps: components to draw; paths: {points, current} for charge animation; * hits: clickable rectangles mapped to resistor indices. */
  function buildLayout(w, h, A) {
    const bx = Math.max(40, w * 0.075), rx = w - Math.max(40, w * 0.075);
    const ty = Math.max(38, h * 0.16), by = h - Math.max(40, h * 0.17);
    const bulbX = bx + (rx - bx) * 0.16;
    const frame = { bx, rx, ty, by, bulbX };
    const comps = [], hits = [], paths = [];

    comps.push({ type: 'battery', x: bx, y: (ty + by) / 2, V: state.V });
    if (state.includeBulb) comps.push({ type: 'bulb', x: bulbX, y: by, P: A.Pbulb });

    const branchPath = xi => ({ points: [[bx, ty], [xi, ty], [xi, by], [bx, by], [bx, ty]] });

    if (state.topology === 'series') {
      const n = state.resistors.length;
      const start = bx + 64, end = rx - 30;
      A.per.forEach((p, i) => {
        const x = lerp(start, end, (i + 0.5) / n);
        comps.push({ type: 'R', x, y: ty, angle: 0, idx: i, R: p.r, I: p.I, V: p.V });
        hits.push({ idx: i, x: x - 52, y: ty - 26, w: 104, h: 52 });
      });
      paths.push({ points: branchPath(rx).points, current: A.Itotal });

    } else if (state.topology === 'parallel') {
      const n = state.resistors.length;
      const x1 = bx + (rx - bx) * 0.34, x2 = rx - 26;
      A.per.forEach((p, i) => {
        const x = lerp(x1, x2, (i + 0.5) / n);
        comps.push({ type: 'R', x, y: (ty + by) / 2, angle: Math.PI / 2, idx: i, R: p.r, I: p.I, V: p.V });
        comps.push({ type: 'node', x, y: ty }); comps.push({ type: 'node', x, y: by });
        hits.push({ idx: i, x: x - 24, y: (ty + by) / 2 - 46, w: 48, h: 92 });
        paths.push({ points: branchPath(x).points, current: p.I });
      });

    } else { // combo: R1 in series with (R2 || R3)
      const xR1 = bx + (rx - bx) * 0.24;
      const jx = bx + (rx - bx) * 0.44;
      const b1 = jx + (rx - 26 - jx) * 0.33;
      const b2 = jx + (rx - 26 - jx) * 0.75;
      const p = A.per;
      comps.push({ type: 'R', x: xR1, y: ty, angle: 0, idx: 0, R: p[0].r, I: p[0].I, V: p[0].V });
      hits.push({ idx: 0, x: xR1 - 52, y: ty - 26, w: 104, h: 52 });
      [[b1, 1], [b2, 2]].forEach(([x, j]) => {
        comps.push({ type: 'R', x, y: (ty + by) / 2, angle: Math.PI / 2, idx: j, R: p[j].r, I: p[j].I, V: p[j].V });
        comps.push({ type: 'node', x, y: ty }); comps.push({ type: 'node', x, y: by });
        hits.push({ idx: j, x: x - 24, y: (ty + by) / 2 - 46, w: 48, h: 92 });
        paths.push({ points: branchPath(x).points, current: p[j].I });
      });
      // label the series element
      comps.push({ type: 'note', x: xR1, y: ty + 40, text: 'in series with the bank' });
    }
    return { frame, comps, paths, hits };
  }

  /* ---- component painters --------------------------------------------- */
  function drawWires(ctx, F) {
    ctx.save();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(F.bx, F.ty); ctx.lineTo(F.rx, F.ty); ctx.lineTo(F.rx, F.by);
    ctx.lineTo(F.bx, F.by); ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawResistor(ctx, x, y, angle, R, selected, hot) {
    const w = 58, h = 12, lead = 16;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    if (selected) {
      ctx.save();
      ctx.strokeStyle = 'rgba(34,211,238,.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
      EMC.roundRect(ctx, -w / 2 - lead - 6, -h - 8, w + 2 * lead + 12, 2 * h + 16, 8);
      ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = hot ? '#fac0cd' : '#e2e8f0';
    ctx.lineWidth = hot ? 3.2 : 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (hot) { ctx.strokeStyle = '#f8aebe'; }
    ctx.beginPath();
    ctx.moveTo(-w / 2 - lead, 0); ctx.lineTo(-w / 2, 0);
    const peaks = 5, pw = w / peaks;
    for (let i = 0; i < peaks; i++) {
      const sx = -w / 2 + i * pw;
      ctx.lineTo(sx + pw * 0.25, -h); ctx.lineTo(sx + pw * 0.75, h); ctx.lineTo(sx + pw, 0);
    }
    ctx.lineTo(w / 2 + lead, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawBattery(ctx, x, y, V) {
    ctx.save();
    ctx.strokeStyle = '#e8eefb'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 14, y - 10); ctx.lineTo(x + 14, y - 10); ctx.stroke();
    ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 2); ctx.lineTo(x + 7, y - 2); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 14, y + 8); ctx.lineTo(x + 14, y + 8); ctx.stroke();
    ctx.lineWidth = 4.6;
    ctx.beginPath(); ctx.moveTo(x - 7, y + 16); ctx.lineTo(x + 7, y + 16); ctx.stroke();
    ctx.restore();
    label(ctx, '+', x + 21, y - 12, { color: '#f8aebe', size: 13, weight: '800' });
    label(ctx, `${fixed(V, 1)} V`, x - 8, y + 38, { color: '#f6d36b', size: 12, weight: '700', align: 'center' });
  }

  function drawBulb(ctx, x, y, P) {
    const b = clamp(P / 3, 0, 1);      // 3 W = reference "full brightness"
    const r = 15;
    ctx.save();
    if (b > 0.02) {
      ctx.fillStyle = `rgba(246,211,107,${0.05 + b * 0.17})`;
      ctx.beginPath(); ctx.arc(x, y, r * (1.8 + b * 1.7), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = `rgba(246,211,107,${0.14 + b * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = b > 0.02 ? `hsl(${45 - b * 22} 100% ${58 + b * 34}%)` : '#7b8db0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y + r * 0.7); ctx.lineTo(x - r * 0.2, y - r * 0.2);
    ctx.lineTo(x + r * 0.2, y + r * 0.2); ctx.lineTo(x + r * 0.7, y - r * 0.7);
    ctx.stroke();
    ctx.restore();
    label(ctx, `bulb ${fixed(state.bulbR, 0)}\u03A9`, x, y + r + 17, { color: '#a9bad6', size: 10.5, weight: '600' });
  }

  function drawNode(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#93a7c8';
    ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  /* Animated charge flow along a polyline. Density + speed scale with current. */
  function drawFlow(ctx, points, current, Imax, t) {
    if (!(current > 0)) return;
    const lens = []; let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const l = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
      lens.push(l); total += l;
    }
    if (total <= 0) return;
    const frac = clamp(current / (Imax || current), 0.05, 1);
    const n = Math.round(clamp(4 + 24 * frac, 4, 28));
    const speed = clamp(50 + 320 * frac, 30, 380);     // px per second
    const phase = (t * speed / total) % 1;
    ctx.save();
    ctx.fillStyle = '#f6d36b';
    for (let i = 0; i < n; i++) {
      let d = (((i / n) + phase) % 1) * total, px = points[0][0], py = points[0][1];
      for (let s = 0; s < lens.length; s++) {
        if (d <= lens[s]) {
          const k = lens[s] === 0 ? 0 : d / lens[s];
          px = points[s][0] + (points[s + 1][0] - points[s][0]) * k;
          py = points[s][1] + (points[s + 1][1] - points[s][1]) * k;
          break;
        }
        d -= lens[s];
      }
      ctx.beginPath(); ctx.arc(px, py, 2.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- main render ----------------------------------------------------- */
  let lastHits = [];
  function render(ctx, w, h, stage) {
    ctx.clearRect(0, 0, w, h);
    const A = analyze();
    const L = buildLayout(w, h, A);
    lastHits = L.hits;

    drawWires(ctx, L.frame);
    // charge flow (drawn under the components so symbols stay legible)
    for (const p of L.paths) drawFlow(ctx, p.points, p.current, A.Itotal, stage.t);

    for (const c of L.comps) {
      if (c.type === 'R') {
        drawResistor(ctx, c.x, c.y, c.angle, c.R, c.idx === state.selected, c.V * c.I > 2);
        const vertical = Math.abs(c.angle) > 0.1;
        const lx = vertical ? c.x + 34 : c.x;
        const ly = vertical ? c.y - 4 : c.y - 26;
        label(ctx, `R${c.idx + 1} = ${fixed(c.R, 0)} \u03A9`, lx, ly,
          { color: c.idx === state.selected ? '#cfe9f2' : '#cfe9f2', size: 11.5, weight: '700',
            align: vertical ? 'left' : 'center' });
        label(ctx, `I = ${eng(c.I, 2)} A`, lx, ly + (vertical ? 16 : -16),
          { color: '#f6d36b', size: 10.5, weight: '600', align: vertical ? 'left' : 'center' });
      } else if (c.type === 'battery') drawBattery(ctx, c.x, c.y, c.V);
      else if (c.type === 'bulb') drawBulb(ctx, c.x, c.y, c.P);
      else if (c.type === 'node') drawNode(ctx, c.x, c.y);
      else if (c.type === 'note') label(ctx, c.text, c.x, c.y, { color: 'rgba(148,163,184,.75)', size: 10.5, weight: '500' });
    }

    // headline numbers on the canvas
    label(ctx, `I(total) = ${eng(A.Itotal, 3)} A`, w / 2, h - 12,
      { color: '#cfe9f2', size: 12.5, weight: '800' });
    label(ctx, `R(eq) = ${fixed(A.Rbank, 2)} \u03A9`, w - 12, 16,
      { color: '#a7f3d0', size: 12, weight: '800', align: 'right' });
  }

  const stage = new EMC.Stage(canvas, render, { animate: true });

  /* ---- HTML readouts + resistor table ---------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const A = analyze();
    const set = (id, v) => { if (el(id)) el(id).textContent = v; };
    set('circ-req', `${fixed(A.Rbank, 2)} \u03A9`);
    set('circ-rtotal', `${fixed(A.Rtotal, 2)} \u03A9`);
    set('circ-itotal', unit(A.Itotal, 'A', 3));
    // 3 significant figures so that Kirchhoff's voltage law visibly adds up:
    // V(bank) + V(bulb) must equal the supply voltage on screen.
    set('circ-vbank', unit(A.Vbank, 'V', 3));
    set('circ-vbulb', state.includeBulb ? unit(A.Vbulb, 'V', 3) : 'bypassed');
    set('circ-pbulb', state.includeBulb ? unit(A.Pbulb, 'W', 3) : '\u2014');
    set('circ-ptotal', unit(state.V * A.Itotal, 'W', 3));
    set('circ-breakdown', A.breakdown);

    const tb = el('circ-table');
    if (tb) {
      // the table header already states the units, so the cells hold plain
      // 3-significant-figure numbers in those units (never prefixed strings)
      const n3 = v => String(Number(v.toPrecision(3)));
      tb.innerHTML = A.per.map(p =>
        `<tr><td class="txt">R${p.i + 1}</td><td>${n3(p.r)}</td><td>${n3(p.V)}</td>` +
        `<td>${n3(p.I)}</td><td>${n3(p.P)}</td></tr>`).join('') +
        (state.includeBulb
          ? `<tr><td class="txt">bulb</td><td>${n3(state.bulbR)}</td><td>${n3(A.Vbulb)}</td>` +
            `<td>${n3(A.Itotal)}</td><td>${n3(A.Pbulb)}</td></tr>` : '');
    }

    // per-row V/I/P readouts in the control list
    A.per.forEach(p => {
      const n = el(`circ-r${p.i}-info`);
      if (n) n.textContent = `V = ${eng(p.V, 3)} V   \u00B7   I = ${eng(p.I, 3)} A   \u00B7   P = ${eng(p.P, 3)} W`;
    });
    // rule reminder that changes with topology
    const rule = el('circ-rule');
    if (rule) {
      rule.innerHTML = {
        series: '<b>Series:</b> the same <b>current</b> flows through every resistor; voltages <b>divide</b> in proportion to R. R(eq) is always <b>larger</b> than the biggest single resistor.',
        parallel: '<b>Parallel:</b> every branch has the same <b>voltage</b>; currents <b>divide</b> (the smaller R gets more current). R(eq) is always <b>smaller</b> than the smallest branch.',
        combo: '<b>Combination:</b> simplify the parallel pair first, then add the series resistor. Total current flows through R1, then splits between R2 and R3.'
      }[state.topology];
    }
  }

  /* ---- control list (one row per resistor) ----------------------------- */
  function renderRows() {
    const host = el('circ-rows');
    if (!host) return;
    host.innerHTML = state.resistors.map((r, i) => `
      <div class="row-item${i === state.selected ? ' selected' : ''}" data-row="${i}">
        <span class="row-chip">R${i + 1}</span>
        <div style="min-width:0">
          <input class="range" type="range" min="1" max="100" step="1" value="${r}"
                 id="circ-r${i}" aria-label="Resistance of R${i + 1} in ohms">
          <div class="tiny faint mono" id="circ-r${i}-info">\u200B</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end">
          <span class="ctl-value" id="circ-r${i}-v">${fixed(r, 0)} \u03A9</span>
          ${state.topology === 'combo'
            ? '<span class="tag tag-amber">' + (i === 0 ? 'series' : 'parallel') + '</span>'
            : `<button class="btn btn-sm btn-danger" data-del="${i}" aria-label="Remove R${i + 1}"${
                state.resistors.length <= LIMITS[state.topology][0] ? ' disabled' : ''}>\u00D7</button>`}
        </div>
      </div>`).join('');

    // wire up the freshly created inputs
    state.resistors.forEach((r, i) => {
      const input = el(`circ-r${i}`);
      if (input) {
        input.addEventListener('input', () => {
          state.resistors[i] = parseFloat(input.value);
          const v = el(`circ-r${i}-v`); if (v) v.textContent = `${fixed(state.resistors[i], 0)} \u03A9`;
          refresh();
        });
      }
      const row = host.querySelector(`[data-row="${i}"]`);
      if (row) row.addEventListener('click', e => {
        if (e.target.closest('input,button')) return;
        state.selected = i; renderRows(); stage.draw();
      });
    });
    host.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        const i = Number(b.dataset.del);
        if (state.resistors.length <= LIMITS[state.topology][0]) return;
        state.resistors.splice(i, 1);
        state.selected = clamp(state.selected, 0, state.resistors.length - 1);
        renderRows(); refresh();
      });
    });
  }

  function refresh() { stage.draw(); updateReadouts(); }

  /* ---- buttons --------------------------------------------------------- */
  const topo = el('circ-topology');
  if (topo) EMC.bindSegment(topo, value => {
    state.topology = value;
    const [lo, hi] = LIMITS[value];
    // reshape the resistor list to fit the new topology
    if (value === 'combo') state.resistors = [state.resistors[0] ?? 22, state.resistors[1] ?? 33, state.resistors[2] ?? 68].slice(0, 3);
    while (state.resistors.length < lo) state.resistors.push(20);
    while (state.resistors.length > hi) state.resistors.pop();
    state.selected = clamp(state.selected, 0, state.resistors.length - 1);
    const addBtn = el('circ-add');
    if (addBtn) addBtn.disabled = state.resistors.length >= LIMITS[state.topology][1];
    renderRows(); refresh();
  });

  const addBtn = el('circ-add');
  if (addBtn) addBtn.addEventListener('click', () => {
    if (state.resistors.length >= LIMITS[state.topology][1]) return;
    state.resistors.push(20);
    state.selected = state.resistors.length - 1;
    addBtn.disabled = state.resistors.length >= LIMITS[state.topology][1];
    renderRows(); refresh();
  });

  EMC.bindRange('circ-V', 'circ-Vv', v => { state.V = v; refresh(); }, v => `${fixed(v, 1)} V`);
  EMC.bindRange('circ-bulbR', 'circ-bulbv', v => { state.bulbR = v; refresh(); }, v => `${fixed(v, 0)} \u03A9`);
  const bulbToggle = el('circ-includeBulb');
  if (bulbToggle) bulbToggle.addEventListener('change', () => {
    state.includeBulb = bulbToggle.checked;
    const s = el('circ-bulbR'); if (s) s.disabled = !state.includeBulb;
    refresh();
  });

  /* ---- click a resistor on the canvas to select it --------------------- */
  stage.onPointer(p => {
    if (p.type !== 'down') return;
    const hit = lastHits.find(h => p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h);
    if (hit) {
      state.selected = hit.idx;
      renderRows(); refresh();
      EMC.scrollToEl(document.querySelector(`[data-row="${hit.idx}"]`), { behavior: 'smooth', block: 'nearest' });
    }
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const over = lastHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    canvas.style.cursor = over ? 'pointer' : 'default';
  });

  /* ---- predict-then-run challenge -------------------------------------- Each challenge is answered by the SIMULATOR itself: we snapshot the state, apply a hypothetical change, re-run analyze(), and compare total currents. So the "correct" answer can never drift from the physics. */
  const chal = { text: el('circ-chal-text'), opts: el('circ-chal-opts'),
                 fb: el('circ-chal-fb'), tryBtn: el('circ-chal-try'),
                 current: null };

  function snapshot() {
    return { topology: state.topology, resistors: state.resistors.slice(),
             bulbR: state.bulbR, includeBulb: state.includeBulb, V: state.V };
  }
  function hypothesize(mut) {
    const keep = snapshot();
    mut(state);
    const result = analyze();
    Object.assign(state, keep);
    state.resistors = keep.resistors;
    return result;
  }
  const DIRS = ['increase', 'decrease', 'stay the same'];
  function dirOf(a, b) {
    if (Math.abs(b - a) < 1e-9) return 2;
    return b > a ? 0 : 1;
  }
  function buildChallenges() {
    const A = analyze();
    const list = [];
    const other = { series: 'parallel', parallel: 'series', combo: 'series' }[state.topology];
    if (!(state.topology === 'combo') && state.resistors.length >= 2) {
      const H = hypothesize(st => { st.topology = other; });
      list.push({
        text: `Predict: rewire the bank from <b>${state.topology}</b> to <b>${other}</b> (same resistors, bulb still in circuit). The total current from the battery will…`,
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `R<sub>eq</sub> goes ${state.topology === 'series' ? 'down (parallel branches add paths)' : 'up (one long path again)'}: ${fixed(A.Rbank, 2)} Ω → ${fixed(H.Rbank, 2)} Ω, so the total current will ${DIRS[dirOf(A.Itotal, H.Itotal)]}.`,
        apply: () => { const b = document.querySelector(`#circ-topology [data-value="${other}"]`); if (b) b.click(); }
      });
    }
    if (Math.max(...state.resistors, state.bulbR) <= 50) {
      const H = hypothesize(st => { st.resistors = st.resistors.map(r => r * 2); st.bulbR *= 2; });
      list.push({
        text: 'Predict: <b>double every resistance</b> in the circuit (bank and bulb). The total current will…',
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `Ohm's law with V fixed: I = V/R, and every R doubled, so the total current will ${DIRS[dirOf(A.Itotal, H.Itotal)]} — exactly ${fixed(A.Itotal / H.Itotal, 2)}× here.`,
        apply: () => { state.resistors = state.resistors.map(r => r * 2); state.bulbR *= 2; renderRows(); refresh(); }
      });
    }
    if (state.includeBulb) {
      const H = hypothesize(st => { st.includeBulb = false; });
      list.push({
        text: 'Predict: <b>bypass the bulb</b> (uncheck “include the bulb”). The total current will…',
        answer: dirOf(A.Itotal, H.Itotal),
        explain: `Removing a series resistance lowers R<sub>total</sub> from ${fixed(A.Rtotal, 2)} Ω to ${fixed(H.Rtotal, 2)} Ω, so the total current must ${DIRS[dirOf(A.Itotal, H.Itotal)]}.`,
        apply: () => { const c = el('circ-includeBulb'); if (c) { c.checked = false; c.dispatchEvent(new Event('change')); } }
      });
    }
    return list;
  }
  let chalList = [], chalIdx = 0, chalDone = false;
  function showChallenge(i) {
    chalList = buildChallenges();
    chalIdx = ((i % chalList.length) + chalList.length) % chalList.length;
    chalDone = false;
    const c = chalList[chalIdx];
    chal.current = c;
    if (chal.text) chal.text.innerHTML = c.text;
    if (chal.fb) { chal.fb.className = 'feedback is-hidden'; chal.fb.innerHTML = ''; }
    if (chal.tryBtn) chal.tryBtn.hidden = true;
    if (chal.opts) {
      chal.opts.innerHTML = DIRS.map((d, k) =>
        `<button class="btn btn-sm" type="button" data-k="${k}" aria-pressed="false">${d}</button>`).join('');
      chal.opts.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        if (chalDone) return;
        chalDone = true;
        const k = Number(b.dataset.k);
        const ok = k === c.answer;
        chal.opts.querySelectorAll('button').forEach(x => {
          x.disabled = true;
          if (Number(x.dataset.k) === c.answer) x.classList.add('btn-primary');
          if (x === b && !ok) x.classList.add('btn-danger');
        });
        if (chal.fb) {
          chal.fb.className = 'feedback ' + (ok ? 'good' : 'bad');
          chal.fb.innerHTML = `<span><b>${ok ? 'Good prediction.' : 'Not quite.'}</b> ${c.explain}</span>`;
        }
        if (chal.tryBtn) chal.tryBtn.hidden = false;
      }));
    }
  }
  if (chal.text) {
    showChallenge(0);
    const newBtn = el('circ-chal-new');
    if (newBtn) newBtn.addEventListener('click', () => showChallenge(chalIdx + 1));
    if (chal.tryBtn) chal.tryBtn.addEventListener('click', () => { if (chal.current) chal.current.apply(); });
  }

  /* ---- boot ------------------------------------------------------------ */
  renderRows();
  if (addBtn) addBtn.disabled = state.resistors.length >= LIMITS[state.topology][1];
  refresh();
})();
````

### `js/sim-coulomb.js` (9.5 KiB)

````javascript
/* Sim 1 - Coulomb bench (topics/charges.html). F = k|q1q2|/r^2; charges stored in normalised coords so the physics is resolution-independent; midpoint field by superposition; drag either charge to change r. */
(function () {
  const canvas = document.getElementById('sim-coulomb');
  if (!canvas) return;                     // guard: page does not contain this sim

  const { CONST, clamp, arrow, label, chargeGlyph, eng, unit, bindRange } = EMC;
  const k = CONST.K;

  const SPAN_M = 1.20;                     // metres represented by the full canvas width
  const R_MIN = 0.02, R_MAX = 1.00;        // separation limits (must match the slider)

  /* ---- state ---------------------------------------------------------- */
  const state = {
    q1: 3,          // microcoulombs
    q2: -2,         // microcoulombs
    x1n: 0.30,      // normalised position of q1 (0 = left edge)
    x2n: 0.70,      // normalised position of q2
    showE: true,
    dragging: null  // 'q1' | 'q2' | null
  };

  /* ---- derived quantities --------------------------------------------- */
  const separation = () => Math.abs(state.x2n - state.x1n) * SPAN_M;

  function forceMagnitude() {
    const r = Math.max(separation(), 1e-4);
    return k * Math.abs((state.q1 * 1e-6) * (state.q2 * 1e-6)) / (r * r);
  }
  /* Signed net field at the midpoint; positive = pointing right (+x). [N/C] */
  function fieldAtMidpoint() {
    const r = Math.max(separation(), 1e-4);
    const d = r / 2;
    const q1 = state.q1 * 1e-6, q2 = state.q2 * 1e-6;
    // Midpoint lies to the RIGHT of q1 -> field of q1 points +x when q1 > 0.
    const e1 = k * q1 / (d * d);
    // Midpoint lies to the LEFT of q2 -> field of q2 points -x when q2 > 0.
    const e2 = -k * q2 / (d * d);
    return e1 + e2;
  }
  const chargeRadius = q => 13 + 9 * Math.cbrt(Math.abs(q) / 3);

  /* * Forces here can span 10^-9 N to 10^3 N, so arrow length uses a log scale. */
  function arrowLength(F, maxLen) {
    if (!(F > 0)) return 0;
    const n = clamp((Math.log10(F) + 9) / 12, 0, 1);
    return clamp(24 + n * maxLen, 24, maxLen + 24);
  }

  /* ---- rendering ------------------------------------------------------- */
  function render(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const midY = h * 0.54;
    const x1 = w * state.x1n, x2 = w * state.x2n;
    const r1 = chargeRadius(state.q1), r2 = chargeRadius(state.q2);
    const r = separation();

    /* --- separation dimension line --- */
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.55)';
    ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(x1, midY); ctx.lineTo(x2, midY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, midY - 10); ctx.lineTo(x1, midY + 10);
    ctx.moveTo(x2, midY - 10); ctx.lineTo(x2, midY + 10);
    ctx.stroke();
    ctx.restore();
    label(ctx, `r = ${r.toFixed(3)} m`, (x1 + x2) / 2, midY + 46, { color: '#cbd5e1', size: 12.5 });

    /* --- force arrows --- */
    const F = forceMagnitude();
    const maxLen = clamp(w * 0.16, 44, 120);
    const L = arrowLength(F, maxLen);
    const product = state.q1 * state.q2;
    const repel = product > 0, attract = product < 0;
    const col = repel ? '#f8aebe' : attract ? '#b5d777' : '#8b897f';

    if (product !== 0 && L > 0) {
      const dir1 = repel ? -1 : 1;           // direction of force ON q1
      const dir2 = -dir1;                    // equal and opposite on q2
      arrow(ctx, x1 + dir1 * (r1 + 4), midY, x1 + dir1 * (r1 + 4 + L), midY, { color: col, width: 4, head: 13 });
      arrow(ctx, x2 + dir2 * (r2 + 4), midY, x2 + dir2 * (r2 + 4 + L), midY, { color: col, width: 4, head: 13 });
      // One shared caption: per-arrow labels collide at small separations, and a
      // single label makes the Newton-III point ("same F on both") explicit.
      label(ctx, `F = ${unit(F, 'N', 3)} on each (equal & opposite)`, (x1 + x2) / 2, midY - 52,
        { color: col, size: 12, weight: '800' });
    }

    /* --- charges --- */
    chargeGlyph(ctx, x1, midY, r1, state.q1);
    chargeGlyph(ctx, x2, midY, r2, state.q2);
    label(ctx, `q1 = ${state.q1 > 0 ? '+' : ''}${state.q1.toFixed(1)} \u00B5C`,
      x1, midY + 66, { color: '#f8aebe', size: 12 });
    label(ctx, `q2 = ${state.q2 > 0 ? '+' : ''}${state.q2.toFixed(1)} \u00B5C`,
      x2, midY + 86, { color: '#a8d3e0', size: 12 });

    /* --- net field at the midpoint --- */
    if (state.showE && Math.abs(fieldAtMidpoint()) > 0) {
      const E = fieldAtMidpoint();
      const mx = (x1 + x2) / 2;
      const eLen = clamp(14 + (Math.log10(Math.abs(E)) + 6) * 9, 14, 60);
      const s = Math.sign(E);
      arrow(ctx, mx - s * eLen / 2, midY - 84, mx + s * eLen / 2, midY - 84,
        { color: '#f6d36b', width: 3, head: 10 });
      label(ctx, `E(mid) = ${unit(Math.abs(E), 'N/C', 2)}`, mx, midY - 104, { color: '#f6d36b', size: 11.5 });
    }

    label(ctx, 'Drag either charge to change r', w / 2, 18,
      { color: 'rgba(148,163,184,.7)', size: 11.5, weight: '500' });
  }

  const stage = new EMC.Stage(canvas, render);

  /* ---- readouts -------------------------------------------------------- */
  const out = {
    force: document.getElementById('coul-force'),
    nature: document.getElementById('coul-nature'),
    sub: document.getElementById('coul-substitution'),
    emid: document.getElementById('coul-emid'),
    rv: document.getElementById('coul-rv')
  };

  function updateReadouts() {
    const F = forceMagnitude();
    const { q1, q2 } = state;
    const r = separation();
    if (out.force) out.force.textContent = unit(F, 'N', 2);
    if (out.nature) {
      let txt, sub, cls;
      if (q1 === 0 || q2 === 0) { txt = 'None'; sub = 'one charge is zero'; cls = 'faint'; }
      else if (q1 * q2 > 0) { txt = 'Repulsive'; sub = 'like signs push apart'; cls = 'accent-rose'; }
      else { txt = 'Attractive'; sub = 'opposite signs pull together'; cls = 'accent-emerald'; }
      out.nature.textContent = txt;
      out.nature.className = 'stat-value ' + cls;
      const subEl = document.getElementById('coul-nature-sub');
      if (subEl) subEl.textContent = sub;
    }
    if (out.sub) {
      // innerHTML (not textContent) so the exponents can be real <sup> markup:
      // U+2079 etc. are missing from many fonts and would render as tofu.
      out.sub.innerHTML = `F = (8.99\u00D710<sup>9</sup>) \u00D7 |${(q1 * 1e-6).toExponential(1)} \u00D7 ${(q2 * 1e-6).toExponential(1)}| \u00F7 (${r.toFixed(3)})<sup>2</sup> = ${eng(F, 3)}\u00A0N`;
    }
    if (out.emid) out.emid.textContent = unit(Math.abs(fieldAtMidpoint()), 'N/C', 2);
    if (out.rv) out.rv.textContent = `${r.toFixed(3)} m`;
  }

  /* Keep the r slider in sync when the user drags a charge. */
  function syncSlider() {
    const s = document.getElementById('coul-r');
    if (s) s.value = String(clamp(separation(), R_MIN, R_MAX).toFixed(3));
  }

  function refresh() { stage.draw(); updateReadouts(); }

  /* ---- controls -------------------------------------------------------- */
  bindRange('coul-q1', 'coul-q1v', v => { state.q1 = v; refresh(); },
    v => `${v > 0 ? '+' : ''}${v.toFixed(1)} \u00B5C`);
  bindRange('coul-q2', 'coul-q2v', v => { state.q2 = v; refresh(); },
    v => `${v > 0 ? '+' : ''}${v.toFixed(1)} \u00B5C`);

  // The r slider moves BOTH charges symmetrically about their midpoint.
  bindRange('coul-r', null, v => {
    const mid = (state.x1n + state.x2n) / 2;
    const half = (clamp(v, R_MIN, R_MAX) / SPAN_M) / 2;
    state.x1n = clamp(mid - half, 0.035, 0.965);
    state.x2n = clamp(mid + half, 0.035, 0.965);
    refresh();
  });

  const eToggle = document.getElementById('coul-showE');
  if (eToggle) eToggle.addEventListener('change', () => { state.showE = eToggle.checked; refresh(); });

  // Presets: data-coul-preset="q1,q2,r"
  document.querySelectorAll('[data-coul-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.coulPreset.split(',').map(Number);
      if (p.length !== 3 || p.some(Number.isNaN)) return;
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) { el.value = String(val); el.dispatchEvent(new Event('input')); }
      };
      setVal('coul-q1', p[0]);
      setVal('coul-q2', p[1]);
      setVal('coul-r', p[2]);
      EMC.toast(`Preset: q1 = ${p[0]} \u00B5C, q2 = ${p[1]} \u00B5C, r = ${p[2]} m`);
    });
  });

  /* ---- drag interaction ------------------------------------------------ */
  stage.onPointer(p => {
    const midY = stage.h * 0.54;
    const x1 = stage.w * state.x1n, x2 = stage.w * state.x2n;
    if (p.type === 'down') {
      const hit1 = Math.hypot(p.x - x1, p.y - midY) < chargeRadius(state.q1) + 14;
      const hit2 = Math.hypot(p.x - x2, p.y - midY) < chargeRadius(state.q2) + 14;
      state.dragging = hit1 ? 'q1' : hit2 ? 'q2' : null;
      canvas.classList.toggle('grabbing', !!state.dragging);
    } else if (p.type === 'move' && state.dragging) {
      const xn = clamp(p.x / stage.w, 0.035, 0.965);
      if (state.dragging === 'q1') state.x1n = xn; else state.x2n = xn;
      // Enforce the separation limits by pushing the dragged charge back.
      let r = separation();
      if (r < R_MIN || r > R_MAX) {
        const other = state.dragging === 'q1' ? state.x2n : state.x1n;
        const dir = Math.sign(xn - other) || 1;
        const lim = clamp(r, R_MIN, R_MAX) / SPAN_M;
        const fixed = clamp(other + dir * lim, 0.035, 0.965);
        if (state.dragging === 'q1') state.x1n = fixed; else state.x2n = fixed;
      }
      syncSlider();
      refresh();
    } else if (p.type === 'up' || p.type === 'leave') {
      state.dragging = null;
      canvas.classList.remove('grabbing');
    }
  });

  syncSlider();
  refresh();
})();
````

### `js/sim-efield.js` (13.0 KiB)

````javascript
/* Sim 2 - field explorer. E(P) = SUM k q (P-r)/|P-r|^3; field lines integrated along E from + charges, vector grid coloured by |E|, +1 nC test probe. */
(function () {
  const canvas = document.getElementById('sim-efield');
  if (!canvas) return;

  const { CONST, clamp, arrow, label, chargeGlyph, unit } = EMC;
  const k = CONST.K;
  const PX_PER_M = 220;              // canvas scale: 220 px = 1 metre
  const Q_TEST = 1e-9;               // test charge used for the probe: +1 nC

  /* ---- state ---------------------------------------------------------- */
  const state = {
    charges: [],                     // { q: microcoulombs, nx: 0..1, ny: 0..1 }
    brush: 'move',                   // 'move' | 'add+' | 'add-' | 'erase'
    size: 3,                         // |q| in microcoulombs used when adding
    mode: 'both',                    // 'lines' | 'vectors' | 'both'
    probe: null,                     // {x,y} in px while the pointer is inside
    dragIndex: -1,
    dragging: false
  };

  /* ---- presets --------------------------------------------------------- */
  const PRESETS = {
    'single-pos': [{ q: 4, nx: .5, ny: .5 }],
    'single-neg': [{ q: -4, nx: .5, ny: .5 }],
    'dipole': [{ q: 5, nx: .34, ny: .5 }, { q: -5, nx: .66, ny: .5 }],
    'like': [{ q: 4, nx: .34, ny: .5 }, { q: 4, nx: .66, ny: .5 }],
    'quad': [{ q: 4, nx: .34, ny: .32 }, { q: -4, nx: .66, ny: .32 },
             { q: -4, nx: .34, ny: .68 }, { q: 4, nx: .66, ny: .68 }],
    'unequal': [{ q: 8, nx: .36, ny: .5 }, { q: -2, nx: .68, ny: .5 }]
  };

  function loadPreset(name) {
    const p = PRESETS[name];
    if (!p) return;
    state.charges = p.map(c => ({ ...c }));
    refresh();
  }

  /* ---- field maths ----------------------------------------------------- */
  /* Convert normalised charge coords to pixels for the current canvas size. */
  function px(c, w, h) { return { x: c.nx * w, y: c.ny * h }; }

  /* Visual radius of a charge glyph (grows slowly with |q|). */
  const chargeRadius = q => 12 + 8 * Math.cbrt(Math.abs(q) / 3);

  /* * Net electric field at a pixel position. * @returns {{ex:number, ey:number, mag:number}} field in N/C */
  function fieldAt(x, y, w, h) {
    let ex = 0, ey = 0;
    for (const c of state.charges) {
      const p = px(c, w, h);
      // Convert the pixel offset to metres, then apply E = k q r_hat / r^2.
      const dxm = (x - p.x) / PX_PER_M;
      const dym = (y - p.y) / PX_PER_M;
      const r2 = dxm * dxm + dym * dym;
      if (r2 < 1e-6) continue;                       // ignore the singularity
      const r = Math.sqrt(r2);
      const E = k * (c.q * 1e-6) / r2;
      ex += E * (dxm / r);
      ey += E * (dym / r);
    }
    return { ex, ey, mag: Math.hypot(ex, ey) };
  }

  /* Colour ramp for field magnitude: deep blue -> cyan -> amber -> rose. */
  function magColor(mag) {
    // Point-charge fields here span roughly 1e3 .. 1e8 N/C; map that window.
    const n = clamp((Math.log10(Math.max(mag, 1e-6)) - 3) / 5, 0, 1);
    const hue = 205 - n * 205;                       // 205 (blue) -> 0 (red)
    return `hsl(${hue.toFixed(0)} 90% ${58 + n * 8}%)`;
  }

  /* ---- field-line tracing --------------------------------------------- */
  /* * Integrate along the field direction with a fixed pixel step. * Lines are seeded on positive charges (or negatives if there are none) so * each line is drawn exactly once. */
  function traceLines(ctx, w, h) {
    const seeds = state.charges.filter(c => c.q > 0);
    const sources = seeds.length ? seeds : state.charges.filter(c => c.q < 0);
    const step = 2.6, maxSteps = 900;

    ctx.save();
    ctx.lineWidth = 1.35;
    ctx.lineCap = 'round';

    for (const c of sources) {
      const p = px(c, w, h);
      const nLines = clamp(Math.round(3 * Math.abs(c.q)), 6, 26);
      const startR = chargeRadius(c.q) + 3;
      const offset = c.q > 0 ? 0 : Math.PI / nLines;

      for (let i = 0; i < nLines; i++) {
        const a = offset + (i / nLines) * Math.PI * 2;
        let x = p.x + Math.cos(a) * startR;
        let y = p.y + Math.sin(a) * startR;
        let terminatedOnCharge = false;
        const thisLine = [[x, y]];

        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < maxSteps; s++) {
          const f = fieldAt(x, y, w, h);
          if (f.mag < 1e-9) break;                   // null point: stop
          // Walk ALONG the field direction for + sources, AGAINST it for -.
          const sgn = c.q > 0 ? 1 : -1;
          x += sgn * (f.ex / f.mag) * step;
          y += sgn * (f.ey / f.mag) * step;
          if (x < -40 || x > w + 40 || y < -40 || y > h + 40) break;
          ctx.lineTo(x, y);
          thisLine.push([x, y]);
          // Stop when the line reaches an opposite charge.
          for (const other of state.charges) {
            if (other === c) continue;
            if (Math.sign(other.q) === Math.sign(c.q)) continue;
            const o = px(other, w, h);
            if (Math.hypot(x - o.x, y - o.y) < chargeRadius(other.q) + 2) { terminatedOnCharge = true; break; }
          }
          if (terminatedOnCharge) break;
        }
        ctx.strokeStyle = c.q > 0 ? 'rgba(248,174,190,.7)' : 'rgba(168,211,224,.7)';
        ctx.stroke();

        // Tangent arrow at a fixed fraction ALONG THE TRACED PATH (using the
        // straight midpoint of start/end piles every dipole arrow onto the axis)
        if (thisLine.length > 24) {
          const q = thisLine[Math.floor(thisLine.length * 0.32)];
          const mx = q[0], my = q[1];
          const f = fieldAt(mx, my, w, h);
          if (f.mag > 0) {
            const ux = f.ex / f.mag, uy = f.ey / f.mag;
            arrow(ctx, mx - ux * 6, my - uy * 6, mx + ux * 6, my + uy * 6,
              { color: 'rgba(165,243,252,.8)', width: 1.6, head: 5 });
          }
        }
      }
    }
    ctx.restore();
  }

  /* Grid of field vectors, length/colour coded by magnitude (log scale). */
  function drawVectorGrid(ctx, w, h) {
    const step = w < 520 ? 42 : 34;
    ctx.save();
    for (let x = step / 2; x < w; x += step) {
      for (let y = step / 2; y < h; y += step) {
        // Skip cells that sit on top of a charge.
        let onCharge = false;
        for (const c of state.charges) {
          const p = px(c, w, h);
          if (Math.hypot(x - p.x, y - p.y) < chargeRadius(c.q) + 6) { onCharge = true; break; }
        }
        if (onCharge) continue;
        const f = fieldAt(x, y, w, h);
        if (f.mag <= 0) continue;
        const len = clamp(5 + (Math.log10(f.mag) + 5) * 2.6, 3, step * 0.48);
        const ux = f.ex / f.mag, uy = f.ey / f.mag;
        arrow(ctx, x - ux * len / 2, y - uy * len / 2, x + ux * len / 2, y + uy * len / 2,
          { color: magColor(f.mag), width: 1.5, head: 4.5 });
      }
    }
    ctx.restore();
  }

  /* ---- main render ----------------------------------------------------- */
  function render(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // faint background grid
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.07)'; ctx.lineWidth = 1;
    const g = 40;
    for (let x = g; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = g; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();

    if (state.charges.length === 0) {
      label(ctx, 'Pick a preset below, or choose the + / \u2212 tool and click to place charges',
        w / 2, h / 2, { color: 'rgba(169,186,214,.85)', size: 13, weight: '500' });
      return;
    }

    // While dragging, skip the expensive line tracing so the UI stays fluid.
    if (!state.dragging) {
      if (state.mode === 'lines' || state.mode === 'both') traceLines(ctx, w, h);
      if (state.mode === 'vectors' || state.mode === 'both') drawVectorGrid(ctx, w, h);
    } else {
      drawVectorGrid(ctx, w, h);
    }

    // probe (test charge) at the pointer
    if (state.probe) {
      const f = fieldAt(state.probe.x, state.probe.y, w, h);
      if (f.mag > 0) {
        const len = clamp(10 + (Math.log10(f.mag) + 5) * 5, 12, 54);
        const ux = f.ex / f.mag, uy = f.ey / f.mag;
        ctx.save();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(251,191,36,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(state.probe.x, state.probe.y, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        arrow(ctx, state.probe.x, state.probe.y, state.probe.x + ux * len, state.probe.y + uy * len,
          { color: '#f6d36b', width: 2.4, head: 8 });
        label(ctx, '+1 nC test charge', state.probe.x, state.probe.y - 18,
          { color: '#f6d36b', size: 10.5, weight: '500' });
      }
    }

    // charges on top
    for (const c of state.charges) {
      const p = px(c, w, h);
      chargeGlyph(ctx, p.x, p.y, chargeRadius(c.q), c.q);
      label(ctx, `${c.q > 0 ? '+' : ''}${c.q.toFixed(1)} \u00B5C`, p.x, p.y + chargeRadius(c.q) + 15,
        { color: c.q > 0 ? '#fac0cd' : '#cfe9f2', size: 11 });
    }
  }

  const stage = new EMC.Stage(canvas, render);

  /* ---- readouts -------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const w = stage.w, h = stage.h;
    const net = state.charges.reduce((s, c) => s + c.q, 0);
    if (el('ef-count')) el('ef-count').textContent = String(state.charges.length);
    if (el('ef-net')) {
      el('ef-net').textContent = `${net > 0 ? '+' : ''}${net.toFixed(1)} \u00B5C`;
      el('ef-net').className = 'stat-value ' + (net > 0 ? 'hl-rose' : net < 0 ? 'hl-cyan' : '');
    }
    if (state.probe) {
      const f = fieldAt(state.probe.x, state.probe.y, w, h);
      if (el('ef-emag')) el('ef-emag').textContent = unit(f.mag, 'N/C', 2);
      if (el('ef-edir')) {
        if (f.mag === 0) el('ef-edir').textContent = '\u2014';
        else {
          // Canvas y grows downward, so flip the sign for a maths-style angle.
          const deg = (-Math.atan2(f.ey, f.ex) * 180 / Math.PI + 360) % 360;
          el('ef-edir').textContent = `${deg.toFixed(0)}\u00B0 from +x`;
        }
      }
      if (el('ef-force')) el('ef-force').textContent = unit(f.mag * Q_TEST, 'N', 2);
    } else {
      ['ef-emag', 'ef-edir', 'ef-force'].forEach(id => { if (el(id)) el(id).textContent = 'hover the field'; });
    }
  }
  function refresh() { stage.draw(); updateReadouts(); }

  /* ---- controls -------------------------------------------------------- */
  const brushGroup = el('ef-brush');
  if (brushGroup) {
    EMC.bindSegment(brushGroup, value => {
      state.brush = value;
      canvas.style.cursor = value === 'move' ? 'grab' : value === 'erase' ? 'not-allowed' : 'copy';
      const hint = el('ef-hint');
      if (hint) {
        hint.textContent = {
          'move': 'Drag charges to move them. The field updates live.',
          'add+': 'Click anywhere to place a positive charge.',
          'add-': 'Click anywhere to place a negative charge.',
          'erase': 'Click a charge to remove it.'
        }[value];
      }
    });
  }
  const modeGroup = el('ef-mode');
  if (modeGroup) EMC.bindSegment(modeGroup, v => { state.mode = v; refresh(); });

  const sizeSlider = el('ef-size');
  if (sizeSlider) EMC.bindRange(sizeSlider, 'ef-sizev', v => { state.size = v; }, v => `${v.toFixed(1)} \u00B5C`);

  document.querySelectorAll('[data-ef-preset]').forEach(btn => {
    btn.addEventListener('click', () => { loadPreset(btn.dataset.efPreset); });
  });
  const clearBtn = el('ef-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => { state.charges = []; refresh(); });

  /* ---- pointer tools --------------------------------------------------- */
  function nearest(x, y, w, h, maxDist = 26) {
    let best = -1, bd = maxDist;
    state.charges.forEach((c, i) => {
      const p = px(c, w, h);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  stage.onPointer(p => {
    const w = stage.w, h = stage.h;
    if (p.type === 'down') {
      const idx = nearest(p.x, p.y, w, h);
      if (state.brush === 'move') {
        state.dragIndex = idx;
        state.dragging = idx >= 0;
        canvas.classList.toggle('grabbing', idx >= 0);
      } else if (state.brush === 'erase') {
        if (idx >= 0) { state.charges.splice(idx, 1); refresh(); }
      } else {
        const q = (state.brush === 'add+' ? 1 : -1) * state.size;
        state.charges.push({ q, nx: clamp(p.x / w, .04, .96), ny: clamp(p.y / h, .06, .94) });
        refresh();
      }
    } else if (p.type === 'move') {
      state.probe = { x: p.x, y: p.y };
      if (state.dragging && state.dragIndex >= 0) {
        const c = state.charges[state.dragIndex];
        if (c) { c.nx = clamp(p.x / w, .03, .97); c.ny = clamp(p.y / h, .05, .95); }
      }
      refresh();
    } else if (p.type === 'up') {
      state.dragging = false; state.dragIndex = -1;
      canvas.classList.remove('grabbing');
      refresh();
    } else if (p.type === 'leave') {
      state.probe = null; state.dragging = false; state.dragIndex = -1;
      canvas.classList.remove('grabbing');
      refresh();
    }
  });

  /* ---- boot ------------------------------------------------------------ */
  loadPreset('dipole');
  canvas.style.cursor = 'grab';
})();
````

### `js/sim-generator.js` (8.3 KiB)

````javascript
/* Sim 8 (bonus, p5.js) - AC generator: Phi = NBA cos(wt), EMF = NBAw sin(wt). Shows a notice instead of a blank box when the p5 CDN is unreachable. */
(function () {
  const host = document.getElementById('p5-gen-host');
  if (!host) return;

  function showNotice() {
    host.innerHTML =
      '<div class="sim-note" style="margin:1rem">p5.js could not be loaded from the CDN, so the ' +
      'bonus generator lab is hidden. Everything else on this page \u2014 including the main ' +
      'magnet-through-a-coil simulation \u2014 works offline.</div>';
  }

  const { clamp, unit, fixed, bindRange } = EMC;

  const state = {
    N: 120,          // turns
    B: 0.40,         // tesla
    A: 0.02,         // coil area [m^2], fixed
    f: 1.2,          // rotation frequency [Hz]
    theta: 0,        // rad
    emfHist: [],     // scrolling trace
    phiHist: []
  };
  const OMEGA = () => 2 * Math.PI * state.f;
  const flux = () => state.N * state.B * state.A * Math.cos(state.theta);
  const emf = () => state.N * state.B * state.A * OMEGA() * Math.sin(state.theta);
  const peak = () => state.N * state.B * state.A * OMEGA();

  /* ---- DOM readouts (throttled: DOM writes at 60 fps are wasteful) ------ */
  const el = id => document.getElementById(id);
  let frame = 0;
  function updateDom() {
    if (el('gen-flux')) el('gen-flux').textContent = unit(flux(), 'Wb', 3);
    if (el('gen-emf')) el('gen-emf').textContent = unit(emf(), 'V', 3);
    if (el('gen-peak')) el('gen-peak').textContent = unit(peak(), 'V', 3);
    if (el('gen-omega')) el('gen-omega').textContent = `${fixed(OMEGA(), 2)} rad/s`;
  }

  /* ---- the p5 sketch (instance mode: no globals are polluted) ---------- */
  const sketch = (p) => {
    // fill the height the CSS grid gives us, but never collapse below 340 px
    let H = Math.max(340, Math.round(host.clientHeight || 340));

    p.setup = () => {
      const c = p.createCanvas(Math.max(320, host.clientWidth), H);
      c.parent(host);
      p.textFont('ui-monospace, Menlo, Consolas, monospace');
    };

    p.windowResized = () => {
      H = Math.max(340, Math.round(host.clientHeight || 340));
      p.resizeCanvas(Math.max(320, host.clientWidth), H);
    };

    /* circle-with-dot / circle-with-cross drawn as vectors (font-safe). */
    function currentSymbol(x, y, r, out) {
      p.push();
      p.noFill(); p.stroke(232, 238, 251, 230); p.strokeWeight(1.3);
      p.circle(x, y, r * 2);
      if (out) { p.noStroke(); p.fill(232, 238, 251, 230); p.circle(x, y, r * 0.7); }
      else {
        const d = r * 0.68;
        p.line(x - d, y - d, x + d, y + d);
        p.line(x + d, y - d, x - d, y + d);
      }
      p.pop();
    }

    function arrowH(x1, y, x2, col) {
      p.push();
      p.stroke(col); p.fill(col); p.strokeWeight(1.6);
      p.line(x1, y, x2, y);
      const s = Math.sign(x2 - x1) || 1;
      p.triangle(x2, y, x2 - s * 7, y - 4, x2 - s * 7, y + 4);
      p.pop();
    }

    p.draw = () => {
      p.clear();
      const w = p.width;
      const dt = p.deltaTime / 1000;
      state.theta = (state.theta + OMEGA() * clamp(dt, 0, 0.05)) % (Math.PI * 2);

      const e = emf(), phi = flux(), pk = Math.max(peak(), 1e-9);
      state.emfHist.push(e); if (state.emfHist.length > 260) state.emfHist.shift();
      state.phiHist.push(phi); if (state.phiHist.length > 260) state.phiHist.shift();

      /* ---------- left: the spinning coil ---------- */
      const cx = w * 0.26, cy = H * 0.5;
      const Hl = H * 0.52;                       // coil height
      const Wl = Math.min(w * 0.20, 150);        // coil full width
      const proj = Math.cos(state.theta);        // foreshortening

      // uniform B field, pointing right
      for (let i = -1; i <= 1; i++) {
        arrowH(cx - Wl * 1.15, cy + i * Hl * 0.42, cx + Wl * 1.15, p.color(167, 139, 250, 150));
      }
      p.noStroke(); p.fill(196, 181, 253, 200); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
      p.text('B', cx + Wl * 1.15 + 6, cy - Hl * 0.42 - 6);

      // rotation axis
      p.push();
      p.stroke(148, 163, 184, 90); p.strokeWeight(1); p.drawingContext.setLineDash([4, 5]);
      p.line(cx, cy - Hl * 0.72, cx, cy + Hl * 0.72);
      p.drawingContext.setLineDash([]);
      p.pop();

      // the coil, foreshortened by cos(theta); the back edge is dimmer
      const halfW = (Wl / 2) * proj;
      const front = proj >= 0;
      p.push();
      p.strokeWeight(2.6);
      p.stroke(front ? p.color(34, 211, 238) : p.color(34, 211, 238, 110));
      p.line(cx + halfW, cy - Hl / 2, cx + halfW, cy + Hl / 2);
      p.stroke(front ? p.color(34, 211, 238, 110) : p.color(34, 211, 238));
      p.line(cx - halfW, cy - Hl / 2, cx - halfW, cy + Hl / 2);
      p.strokeWeight(2);
      p.stroke(34, 211, 238, 190);
      p.line(cx - halfW, cy - Hl / 2, cx + halfW, cy - Hl / 2);
      p.line(cx - halfW, cy + Hl / 2, cx + halfW, cy + Hl / 2);
      p.pop();

      // current direction in the two vertical sides (flips with the EMF sign)
      if (Math.abs(e) > pk * 0.02) {
        const ccw = e > 0;
        currentSymbol(cx + halfW, cy - Hl / 2, 5.5, ccw === front);
        currentSymbol(cx - halfW, cy - Hl / 2, 5.5, ccw !== front);
      }

      // live numbers on the canvas
      p.noStroke(); p.textSize(12); p.textAlign(p.LEFT, p.BOTTOM);
      p.fill(252, 211, 77); p.text(`EMF = ${unit(e, 'V', 3)}`, 12, H - 26);
      p.fill(103, 232, 249); p.text(`\u03A6 = ${unit(phi, 'Wb', 3)}`, 12, H - 10);
      p.fill(169, 186, 214); p.textAlign(p.RIGHT, p.TOP);
      p.text(`theta = ${fixed(state.theta * 180 / Math.PI, 0)}\u00B0`, cx + Wl * 1.15, 10);
      p.text(`${fixed(state.f, 1)} rev/s`, cx + Wl * 1.15, 26);

      /* ---------- right: the sine wave being generated ---------- */
      const gx = w * 0.52, gw = w * 0.44, gy = H * 0.5, gh = H * 0.34;
      p.push();
      p.stroke(148, 163, 184, 70); p.strokeWeight(1);
      p.line(gx, gy, gx + gw, gy);                       // zero line
      p.stroke(148, 163, 184, 35);
      p.line(gx, gy - gh, gx + gw, gy - gh);
      p.line(gx, gy + gh, gx + gw, gy + gh);
      p.pop();
      p.noStroke(); p.fill(169, 186, 214); p.textSize(10.5); p.textAlign(p.LEFT, p.BOTTOM);
      p.text('EMF(t) \u2014 a sine wave: the grid frequency', gx, gy - gh - 6);

      const n = state.emfHist.length;
      if (n > 1) {
        const scale = 1.15 * pk;
        p.push();
        p.noFill(); p.stroke(251, 191, 36); p.strokeWeight(2.2);
        p.beginShape();
        for (let i = 0; i < n; i++) {
          const x = gx + (i / 259) * gw;
          p.vertex(x, gy - (state.emfHist[i] / scale) * gh);
        }
        p.endShape();
        p.stroke(34, 211, 238, 160); p.strokeWeight(1.4);
        p.beginShape();
        for (let i = 0; i < n; i++) {
          const x = gx + (i / 259) * gw;
          p.vertex(x, gy - (state.phiHist[i] / (1.15 * Math.max(Math.abs(flux()), pk / (OMEGA() || 1)))) * gh * 0.5);
        }
        p.endShape();
        p.pop();
      }
      p.noStroke(); p.fill(103, 232, 249); p.textSize(10); p.textAlign(p.LEFT, p.TOP);
      p.text('\u03A6(t) (scaled)', gx, gy + gh + 4);

      if (++frame % 10 === 0) updateDom();
    };
  };

  /* ---- boot: p5 may arrive late (lazy) or never (blocked CDN) ----------- */
  function boot() {
    if (!window.p5) { showNotice(); return; }
    new window.p5(sketch);
  }
  if (window.p5) {
    boot();
  } else {
    let injected = false;
    const inject = () => {
      if (injected) return;
      injected = true;
      host.dataset.p5 = 'loading';
      const tag = document.createElement('script');
      tag.src = 'https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js';
      tag.onload = boot;
      tag.onerror = showNotice;
      document.head.appendChild(tag);
    };
    // only pay for p5 when the lab is about to enter the viewport
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { io.disconnect(); inject(); }
      }, { rootMargin: '600px 0px' });
      io.observe(host);
    } else inject();
  }

  /* ---- controls (work even before p5 arrives) --------------------------- */
  bindRange('gen-N', 'gen-Nv', v => { state.N = Math.round(v); updateDom(); }, v => `${Math.round(v)} turns`);
  bindRange('gen-B', 'gen-Bv', v => { state.B = v; updateDom(); }, v => `${fixed(v, 2)} T`);
  bindRange('gen-f', 'gen-fv', v => { state.f = v; updateDom(); }, v => `${fixed(v, 1)} Hz`);
  updateDom();
})();
````

### `js/sim-induction.js` (23.9 KiB)

````javascript
/* Sim 7 - magnet through a coil. Phi(z) = mu0 m a^2 / (2 (a^2+z^2)^{3/2}); EMF = -N dPhi/dz * v (analytic), I = EMF/R, P = EMF^2/R. Motion is sub-stepped at 2 ms so the narrow EMF peak is never undersampled. Sign convention: EMF > 0 = counter-clockwise seen from +x (dot at the top of each turn). */
(function () {
  const canvas = document.getElementById('sim-induction');
  if (!canvas) return;

  const { CONST, clamp, lerp, damp, label, roundRect, eng, unit, fixed } = EMC;
  const MU0 = CONST.MU0;

  const state = {
    N: 800,            // turns
    a: 0.020,          // coil radius [m]
    m: 0.80,           // magnet dipole moment [A m^2]
    R: 10,             // total circuit resistance [ohm]
    z: -0.075,         // magnet position [m] (+ = right of the coil)
    v: 0,              // magnet velocity [m/s]
    speed: 0.8,        // auto-move speed [m/s]
    mode: 'manual',    // 'manual' | 'push' | 'pull' | 'oscillate'
    oscAmp: 0.075,     // oscillation amplitude [m]
    oscFreq: 1.6,      // oscillation frequency [Hz]
    oscPhase: 0,
    showSymbols: true,
    iScale: 1e-4,      // galvanometer auto-range [A]
    history: []        // {t, lambda, emf} for the strip chart
  };
  const Z_MAX = 0.11;   // magnet travel limit [m]
  let chart = null;     // strip-chart Stage (constructed below the main stage)

  /* ---- core physics ---------------------------------------------------- */
  function fluxPerTurn(z) {
    const a2 = state.a * state.a;
    return MU0 * state.m * a2 / (2 * Math.pow(a2 + z * z, 1.5));
  }
  function dFluxdz(z) {
    const a2 = state.a * state.a;
    return -3 * MU0 * state.m * a2 * z / (2 * Math.pow(a2 + z * z, 2.5));
  }
  function compute() {
    const phi = fluxPerTurn(state.z);
    const lambda = state.N * phi;
    const dphidt = dFluxdz(state.z) * state.v;         // Wb/s per turn
    const emf = -state.N * dphidt;                     // Faraday + Lenz sign
    const I = emf / state.R;
    const P = emf * emf / state.R;
    return { phi, lambda, dlambda_dt: state.N * dphidt, emf, I, P };
  }

  /* ---- geometry -------------------------------------------------------- */
  function geom(w, h) {
    const cy = h * 0.42;
    const pxPerM = (w * 0.40) / Z_MAX;
    const coilX = w / 2;
    const aPx = clamp(state.a * pxPerM, 16, h * 0.30);
    const turns = clamp(Math.round(state.N / 120), 5, 14);
    const coilLen = clamp(w * 0.16, 60, 150);
    const galv = { x: w / 2, y: h - Math.max(40, h * 0.14), r: clamp(Math.min(w, h) * 0.075, 20, 30) };
    return { cy, pxPerM, coilX, aPx, turns, coilLen, galv,
             magnetX: coilX + state.z * pxPerM,
             magLen: clamp(0.05 * pxPerM, 46, w * 0.24), magThick: clamp(aPx * 0.42, 14, 30) };
  }

  /* ---- painters -------------------------------------------------------- */
  function drawCoil(ctx, G, phys) {
    const x0 = G.coilX - G.coilLen / 2;
    const spacing = G.coilLen / G.turns;
    // determine current direction symbol: emf > 0 => CCW seen from +x
    const ccw = phys.emf >= 0;
    const glow = clamp(Math.abs(phys.I) / state.iScale, 0, 1);
    const wireColor = glow > 0.02
      ? (ccw ? '#b5d777' : '#f6d36b')
      : 'rgba(185,183,174,.85)';

    ctx.save();
    ctx.lineWidth = 2.6;
    for (let i = 0; i < G.turns; i++) {
      const x = x0 + i * spacing;
      const rx = Math.max(4.5, spacing * 0.62);
      // far half of the loop (dimmer) ...
      ctx.strokeStyle = 'rgba(148,163,184,.35)';
      ctx.beginPath();
      ctx.ellipse(x, G.cy, rx, G.aPx, 0, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      // ... then the near half in the live wire colour (glows with current)
      ctx.strokeStyle = wireColor;
      ctx.beginPath();
      ctx.ellipse(x, G.cy, rx, G.aPx, 0, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // current-direction symbols at the top and bottom of the winding
    if (state.showSymbols && glow > 0.03) {
      const size = 4 + glow * 3.5;
      const topOut = ccw;                       // CCW from +x => out of page at top
      for (let i = 0; i < G.turns; i++) {
        const x = x0 + i * spacing;
        drawCurrentSymbol(ctx, x, G.cy - G.aPx, size, topOut);
        drawCurrentSymbol(ctx, x, G.cy + G.aPx, size, !topOut);
      }
    }
    label(ctx, `${G.turns} turns shown (N = ${state.N})`, G.coilX, G.cy - G.aPx - 18,
      { color: 'rgba(169,186,214,.8)', size: 10.5, weight: '600' });
    return { x0, spacing };
  }

  /* dot = current out of the page, cross = current into the page */
  function drawCurrentSymbol(ctx, x, y, s, out) {
    ctx.save();
    ctx.strokeStyle = 'rgba(232,238,251,.95)'; ctx.fillStyle = 'rgba(232,238,251,.95)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke();
    if (out) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.4, s * 0.34), 0, Math.PI * 2); ctx.fill(); }
    else {
      const d = s * 0.72;
      ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
    }
    ctx.restore();
  }

  function drawMagnet(ctx, G) {
    const x = G.magnetX, y = G.cy, L = G.magLen, T = G.magThick;
    ctx.save();
    // S half (left, pastel blue)
    roundRect(ctx, x - L / 2, y - T / 2, L / 2, T, 4);
    ctx.fillStyle = '#a8d3e0'; ctx.fill();
    // N half (right, pastel pink) — the N pole leads when the magnet moves right
    roundRect(ctx, x, y - T / 2, L / 2, T, 4);
    ctx.fillStyle = '#f8aebe'; ctx.fill();
    ctx.strokeStyle = 'rgba(246,241,229,.45)'; ctx.lineWidth = 1.2;
    roundRect(ctx, x - L / 2, y - T / 2, L, T, 4); ctx.stroke();
    ctx.fillStyle = '#2b2d33'; ctx.font = `800 ${Math.max(11, T * 0.5)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', x - L / 4, y + 1);
    ctx.fillText('N', x + L / 4, y + 1);
    ctx.restore();
    label(ctx, 'drag me \u2194', x, y - T / 2 - 13, { color: 'rgba(232,238,251,.8)', size: 10.5, weight: '600' });
  }

  function drawLeads(ctx, G, coil, phys, stageRef) {
    const g = G.galv;
    const leftX = coil.x0, rightX = coil.x0 + G.coilLen;
    const yTop = G.cy + G.aPx;
    ctx.save();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leftX, yTop); ctx.lineTo(leftX, g.y); ctx.lineTo(g.x - g.r, g.y);
    ctx.moveTo(rightX, yTop); ctx.lineTo(rightX, g.y); ctx.lineTo(g.x + g.r, g.y);
    ctx.stroke();
    ctx.restore();

    // animated charge flow: direction flips with the sign of the current
    const mag = clamp(Math.abs(phys.I) / state.iScale, 0, 1);
    if (mag > 0.02) {
      const dir = phys.I >= 0 ? 1 : -1;    // + => CCW seen from +x
      const speed = 40 + 260 * mag;
      const phase = (stageRef.t * speed) % 60;
      ctx.save();
      ctx.fillStyle = 'rgba(251,191,36,.95)';
      [[leftX, dir], [rightX, -dir]].forEach(([x, d]) => {
        const n = 5;
        for (let i = 0; i < n; i++) {
          const s = (((i / n) + (phase * d) / 60) % 1 + 1) % 1;
          const yy = lerp(yTop, g.y, s);
          ctx.beginPath(); ctx.arc(x, yy, 2.8, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.restore();
    }
  }

  function drawGalvanometer(ctx, G, phys) {
    const { x, y, r } = G.galv;
    const frac = clamp(phys.I / state.iScale, -1, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(8,15,28,.95)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    // centre-zero scale
    ctx.strokeStyle = 'rgba(148,163,184,.6)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
    [-1, -0.5, 0, 0.5, 1].forEach(f => {
      const a = Math.PI * 1.5 + f * Math.PI * 0.32;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.64, y + Math.sin(a) * r * 0.64);
      ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
      ctx.stroke();
    });
    const na = Math.PI * 1.5 + frac * Math.PI * 0.32;
    ctx.strokeStyle = frac >= 0 ? '#b5d777' : '#f6d36b'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(na) * r * 0.66, y + Math.sin(na) * r * 0.66); ctx.stroke();
    ctx.fillStyle = '#e8eefb'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    label(ctx, 'G', x, y + r * 0.5, { color: '#e8eefb', size: Math.max(10, r * 0.32), weight: '800' });
    label(ctx, `\u00B1${eng(state.iScale, 1)} A full scale`, x, y + r + 15,
      { color: '#7b8db0', size: 10, weight: '600' });
  }

  function drawAxis(ctx, G, w) {
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.22)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, G.cy); ctx.lineTo(w - 10, G.cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(G.coilX, G.cy - G.aPx - 30); ctx.lineTo(G.coilX, G.cy + G.aPx + 12); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    label(ctx, 'coil plane', G.coilX, G.cy + G.aPx + 24, { color: 'rgba(148,163,184,.75)', size: 10, weight: '600' });
    // z dimension
    const y = G.cy + G.aPx + 44;
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(G.coilX, y); ctx.lineTo(G.magnetX, y); ctx.stroke();
    ctx.restore();
    label(ctx, `z = ${(state.z * 100).toFixed(1)} cm`, (G.coilX + G.magnetX) / 2, y - 10,
      { color: '#cbd5e1', size: 11, weight: '700' });
  }

  /* ---- main render ----------------------------------------------------- */
  let dragging = false, lastZ = 0;
  function render(ctx, w, h, stageRef, dt) {
    ctx.clearRect(0, 0, w, h);
    const G = geom(w, h);

    /* --- advance the magnet ------------------------------------------------ The EMF peak is narrow (it sits at z = +/- a/2), so a single Euler step per animation frame can jump straight over it on a slow device. The motion is therefore integrated in sub-steps of at most 2 ms, which also keeps the position accurate when the browser clamps dt. */
    const subSteps = dt ? clamp(Math.ceil(dt / 0.002), 1, 40) : 1;
    const sdt = dt ? dt / subSteps : 0;
    if (dt && (state.mode === 'push' || state.mode === 'pull')) {
      state.v = (state.mode === 'push' ? 1 : -1) * state.speed;
      for (let i = 0; i < subSteps; i++) {
        state.z = clamp(state.z + state.v * sdt, -Z_MAX, Z_MAX);
        if (Math.abs(state.z) >= Z_MAX) { state.v = 0; setMode('manual'); break; }
      }
    } else if (dt && state.mode === 'oscillate') {
      for (let i = 0; i < subSteps; i++) state.oscPhase += 2 * Math.PI * state.oscFreq * sdt;
      state.z = state.oscAmp * Math.sin(state.oscPhase);
      // exact derivative of the prescribed motion -> no numerical noise
      state.v = state.oscAmp * 2 * Math.PI * state.oscFreq * Math.cos(state.oscPhase);
    } else if (dt && dragging) {
      // manual drag: finite-difference velocity, low-pass filtered
      const raw = dt > 0 ? (state.z - lastZ) / dt : 0;
      state.v = damp(state.v, clamp(raw, -25, 25), 18, dt);
      lastZ = state.z;
    } else if (dt) {
      state.v = damp(state.v, 0, 12, dt);     // released: velocity decays to 0
    }

    const phys = compute();

    /* --- galvanometer auto-range: track a slowly decaying peak --- */
    const target = Math.max(Math.abs(phys.I), 1e-7);
    state.iScale = target > state.iScale ? target * 1.15 : damp(state.iScale, target * 1.25, 1.2, dt || 0.016);
    state.iScale = clamp(state.iScale, 1e-7, 10);

    /* --- draw --- */
    drawAxis(ctx, G, w);
    const coil = drawCoil(ctx, G, phys);
    drawLeads(ctx, G, coil, phys, stageRef);
    drawMagnet(ctx, G);
    drawGalvanometer(ctx, G, phys);

    // live headline numbers on the canvas
    label(ctx, `EMF = ${unit(phys.emf, 'V', 3)}`, 12, 18,
      { color: '#f6d36b', size: 13, align: 'left', weight: '800' });
    label(ctx, `I = ${unit(phys.I, 'A', 3)}`, 12, 38,
      { color: '#cfe9f2', size: 13, align: 'left', weight: '800' });
    label(ctx, `v = ${fixed(state.v, 2)} m/s`, w - 12, 18,
      { color: '#a7f3d0', size: 12, align: 'right', weight: '700' });

    /* --- record history for the strip chart --- */
    if (dt) {
      state.history.push({ t: stageRef.t, lambda: phys.lambda, emf: phys.emf });
      const cutoff = stageRef.t - 7;
      while (state.history.length && state.history[0].t < cutoff) state.history.shift();
      if (state.history.length > 1400) state.history.splice(0, state.history.length - 1400);
    }
    updateReadouts(phys);
    if (chart) chart.draw();
  }

  const stage = new EMC.Stage(canvas, render, { animate: true });

  /* ---- strip chart: flux linkage and EMF vs time ----------------------- */
  const chartCanvas = document.getElementById('sim-induction-chart');
  if (chartCanvas) {
    chart = new EMC.Stage(chartCanvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 44, r: 12, t: 12, b: 20 };
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const midY = pad.t + ph / 2;

      // frame + zero line
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1;
      ctx.strokeRect(pad.l, pad.t, pw, ph);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(148,163,184,.4)';
      ctx.beginPath(); ctx.moveTo(pad.l, midY); ctx.lineTo(pad.l + pw, midY); ctx.stroke();
      ctx.restore();

      const H = state.history;
      if (H.length > 1) {
        const t1 = H[H.length - 1].t, t0 = t1 - 7;
        let maxL = 1e-9, maxE = 1e-9;
        for (const s of H) { maxL = Math.max(maxL, Math.abs(s.lambda)); maxE = Math.max(maxE, Math.abs(s.emf)); }
        const X = t => pad.l + ((t - t0) / 7) * pw;
        const trace = (key, max, color, half) => {
          ctx.save();
          ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
          ctx.beginPath();
          let started = false;
          for (const s of H) {
            const x = X(s.t);
            if (x < pad.l - 1) continue;
            const y = half
              ? midY - (s[key] / max) * (ph / 2 - 4)
              : pad.t + ph - (s[key] / max) * (ph - 8) - 4;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        };
        trace('lambda', maxL, 'rgba(34,211,238,.95)', false);   // always positive -> bottom baseline
        trace('emf', maxE, 'rgba(251,191,36,.95)', true);       // bipolar -> centre baseline
        label(ctx, `\u03BB max ${eng(maxL, 2)}Wb`, pad.l + 6, pad.t + 10,
          { color: '#cfe9f2', size: 10, align: 'left', weight: '700' });
        label(ctx, `EMF max \u00B1${eng(maxE, 2)}V`, pad.l + pw - 6, pad.t + 10,
          { color: '#f6d36b', size: 10, align: 'right', weight: '700' });
      }
      label(ctx, 'time \u2192 (last 7 s)', pad.l + pw / 2, h - 7,
        { color: '#7b8db0', size: 10, weight: '600' });
      label(ctx, '\u03BB', pad.l - 8, pad.t + 12, { color: '#cfe9f2', size: 11, align: 'right', weight: '800' });
      label(ctx, 'EMF', pad.l - 8, midY, { color: '#f6d36b', size: 11, align: 'right', weight: '800' });
    });
  }

  /* ---- readouts -------------------------------------------------------- */
  const el = id => document.getElementById(id);
  let lastLenzHTML = '';
  function updateReadouts(phys) {
    const set = (id, v) => { if (el(id)) el(id).textContent = v; };
    set('ind-z', `${(state.z * 100).toFixed(1)} cm`);
    // Base SI units in, one SI prefix out — never stack prefixes ("µmWb").
    set('ind-phi', unit(phys.phi, 'Wb', 3));
    set('ind-lambda', unit(phys.lambda, 'Wb', 3));
    set('ind-dphi', unit(phys.dlambda_dt, 'Wb/s', 3));
    set('ind-emf', unit(phys.emf, 'V', 3));
    set('ind-I', unit(phys.I, 'A', 3));
    set('ind-P', unit(phys.P, 'W', 3));
    set('ind-v', `${fixed(state.v, 2)} m/s`);

    // direction + Lenz explanation
    const dirEl = el('ind-dir'), lenzEl = el('ind-lenz');
    const tiny = Math.abs(phys.emf) < state.iScale * state.R * 0.004;
    let dir = '\u2014', lenz = '';
    if (tiny || Math.abs(state.v) < 1e-4) {
      dir = 'no induced current';
      lenz = Math.abs(state.z) < 1e-3
        ? 'The magnet is at the centre of the coil: the flux is at its maximum, so d\u03A6/dt = 0 and the EMF passes through zero. (This is why a real search coil gives two opposite peaks.)'
        : 'The flux through the coil is not changing, so by Faraday\u2019s law the induced EMF is zero. Move the magnet to generate a current.';
    } else {
      const approaching = state.z * state.v < 0;
      dir = phys.emf > 0 ? 'CCW from the right' : 'CW from the right';
      lenz = approaching
        ? 'Flux is <b>increasing</b>. Lenz\u2019s law: the induced current flows so as to <b>oppose the increase</b> \u2014 it makes the coil\u2019s near face a <b>north</b> pole, which <b>repels</b> the approaching magnet. You must push harder; that extra mechanical work is exactly the electrical power I\u00B2R being dissipated.'
        : 'Flux is <b>decreasing</b>. Lenz\u2019s law: the induced current flows to <b>sustain the flux</b> \u2014 it makes the coil\u2019s near face a <b>south</b> pole, which <b>attracts</b> the departing magnet and resists its motion. Again, energy is conserved.';
    }
    if (dirEl && dirEl.textContent !== dir) dirEl.textContent = dir;
    if (lenzEl && lenz !== lastLenzHTML) { lenzEl.innerHTML = lenz; lastLenzHTML = lenz; }
  }

  /* ---- mode buttons ---------------------------------------------------- */
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-ind-mode]').forEach(b => {
      const on = b.dataset.indMode === mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (mode === 'oscillate') {
      // start the oscillation from wherever the magnet currently is
      state.oscPhase = Math.asin(clamp(state.z / state.oscAmp, -1, 1));
    }
  }
  document.querySelectorAll('[data-ind-mode]').forEach(b => {
    b.addEventListener('click', () => {
      const mode = b.dataset.indMode;
      if (mode === 'push') { state.z = -Z_MAX; state.v = 0; setMode('push'); }
      else if (mode === 'pull') { state.z = Z_MAX; state.v = 0; setMode('pull'); }
      else if (mode === 'oscillate') setMode('oscillate');
      else { state.v = 0; setMode('manual'); }
      stage.draw();
    });
  });

  /* ---- controls -------------------------------------------------------- */
  EMC.bindRange('ind-N', 'ind-Nv', v => { state.N = Math.round(v); stage.draw(); }, v => `${Math.round(v)} turns`);
  EMC.bindRange('ind-a', 'ind-av', v => { state.a = v / 100; stage.draw(); }, v => `${v.toFixed(1)} cm`);
  EMC.bindRange('ind-R', 'ind-Rv', v => { state.R = v; stage.draw(); }, v => `${v.toFixed(0)} \u03A9`);
  EMC.bindRange('ind-speed', 'ind-speedv', v => { state.speed = v; }, v => `${v.toFixed(2)} m/s`);
  EMC.bindRange('ind-osc', 'ind-oscv', v => { state.oscFreq = v; }, v => `${v.toFixed(1)} Hz`);

  // magnet strength: log slider 0.05 .. 2.0 A m^2
  const mSlider = el('ind-m');
  if (mSlider) {
    const fromS = s => Math.pow(10, -1.3 + (s / 1000) * (Math.log10(2) + 1.3));
    const toS = m => clamp((Math.log10(clamp(m, 0.05, 2)) + 1.3) / (Math.log10(2) + 1.3) * 1000, 0, 1000);
    mSlider.addEventListener('input', () => {
      state.m = fromS(parseFloat(mSlider.value));
      if (el('ind-mv')) el('ind-mv').textContent = `${state.m.toFixed(2)} A\u00B7m\u00B2`;
      stage.draw();
    });
    mSlider.value = String(toS(state.m));
    if (el('ind-mv')) el('ind-mv').textContent = `${state.m.toFixed(2)} A\u00B7m\u00B2`;
  }

  const symToggle = el('ind-symbols');
  if (symToggle) symToggle.addEventListener('change', () => { state.showSymbols = symToggle.checked; stage.draw(); });

  const resetBtn = el('ind-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    state.z = -0.075; state.v = 0; state.history = []; state.oscPhase = 0;
    setMode('manual'); stage.draw();
  });

  /* ---- drag the magnet ------------------------------------------------- */
  stage.onPointer(p => {
    const G = geom(stage.w, stage.h);
    if (p.type === 'down') {
      const hit = Math.abs(p.x - G.magnetX) < G.magLen / 2 + 14 && Math.abs(p.y - G.cy) < G.magThick + 16;
      if (hit) {
        dragging = true; setMode('manual');
        canvas.classList.add('grabbing');
        lastZ = state.z;
      }
    } else if (p.type === 'move' && dragging) {
      state.z = clamp((p.x - G.coilX) / G.pxPerM, -Z_MAX, Z_MAX);
    } else if (p.type === 'up' || p.type === 'leave' || p.type === 'cancel') {
      dragging = false;
      canvas.classList.remove('grabbing');
    }
  });

  /* ---- predict-then-run challenge (Faraday/Lenz, answered by the theory) -- */
  const IND_CHALLENGES = [
    {
      text: 'The magnet rests at the coil centre. Press <b>Push through →</b>. At which moment is the induced EMF exactly zero?',
      options: ['as the magnet crosses the coil centre', 'at the two ends of the travel', 'never — it is zero only before you press'],
      answer: 0,
      explain: 'At the centre the flux is at its <b>maximum</b>, and a maximum has zero slope: dΦ/dt = 0. That is why the chart shows two opposite peaks with a zero crossing between them.',
      apply: () => document.querySelector('[data-ind-mode="push"]')?.click()
    },
    {
      text: 'Double the <b>auto-move speed</b> and push again. The peak |EMF| will…',
      options: ['double', 'halve', 'stay the same'],
      answer: 0,
      explain: 'EMF = −N·dΦ/dz·v: the spatial derivative is unchanged, v doubles, so the whole trace scales by 2 — taller peaks, same area under them (same total flux change).',
      apply: () => {
        const sl = el('ind-speed');
        if (sl) { sl.value = String(Math.min(3, state.speed * 2)); sl.dispatchEvent(new Event('input')); }
        document.querySelector('[data-ind-mode="push"]')?.click();
      }
    },
    {
      text: 'Double the <b>circuit resistance R</b> and push again. The peak |EMF| will…',
      options: ['stay the same', 'double', 'halve'],
      answer: 0,
      explain: 'Faraday’s law contains no R: the EMF depends only on N and dΦ/dt. Doubling R halves the <b>current</b> (I = EMF/R) and quarters the heating — watch the mA readout, not the mV one.',
      apply: () => {
        const sl = el('ind-R');
        if (sl) { sl.value = String(Math.min(200, state.R * 2)); sl.dispatchEvent(new Event('input')); }
        document.querySelector('[data-ind-mode="push"]')?.click();
      }
    }
  ];
  let indChalIdx = 0, indChalDone = false;
  function showIndChallenge(i) {
    indChalIdx = ((i % IND_CHALLENGES.length) + IND_CHALLENGES.length) % IND_CHALLENGES.length;
    indChalDone = false;
    const c = IND_CHALLENGES[indChalIdx];
    const txt = el('ind-chal-text'), opts = el('ind-chal-opts'),
          fb = el('ind-chal-fb'), tryB = el('ind-chal-try');
    if (!txt || !opts) return;
    txt.innerHTML = c.text;
    if (fb) { fb.className = 'feedback is-hidden'; fb.innerHTML = ''; }
    if (tryB) tryB.hidden = true;
    opts.innerHTML = c.options.map((o, k) =>
      `<button class="btn btn-sm" type="button" data-k="${k}" aria-pressed="false">${o}</button>`).join('');
    opts.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      if (indChalDone) return;
      indChalDone = true;
      const k = Number(b.dataset.k), okk = k === c.answer;
      opts.querySelectorAll('button').forEach(x => {
        x.disabled = true;
        if (Number(x.dataset.k) === c.answer) x.classList.add('btn-primary');
        if (x === b && !okk) x.classList.add('btn-danger');
      });
      if (fb) { fb.className = 'feedback ' + (okk ? 'good' : 'bad'); fb.innerHTML = `<span><b>${okk ? 'Good prediction.' : 'Not quite.'}</b> ${c.explain}</span>`; }
      if (tryB) tryB.hidden = false;
    }));
  }
  if (el('ind-chal-text')) {
    showIndChallenge(0);
    const nb = el('ind-chal-new');
    if (nb) nb.addEventListener('click', () => showIndChallenge(indChalIdx + 1));
    const tb = el('ind-chal-try');
    if (tb) tb.addEventListener('click', () => IND_CHALLENGES[indChalIdx].apply());
  }

  setMode('manual');
  stage.draw();
})();
````

### `js/sim-lorentz.js` (14.2 KiB)

````javascript
/* Sim 6 - Lorentz force. F = qv x B; exact circular solution p(t) = c + Rot(Omega t)(p0 - c) with Omega = -q Bz/m; r = mv/|q|B, T = 2pi m/|q|B. Rotation direction is physical; the rate is slowed and the slow-down factor is printed on the canvas. */
(function () {
  const canvas = document.getElementById('sim-lorentz');
  if (!canvas) return;

  const { CONST, clamp, arrow, label, eng, unit, fixed } = EMC;
  const e = CONST.E;

  const PARTICLES = {
    proton:   { name: 'proton',   q: +e,   m: CONST.M_PROTON,   color: '#f8aebe' },
    electron: { name: 'electron', q: -e,   m: CONST.M_ELECTRON, color: '#a8d3e0' },
    alpha:    { name: 'alpha (He\u00B2\u207A)', q: +2 * e, m: 6.644657e-27, color: '#f6d36b' }
  };
  const DIRS = { right: 0, up: 90, left: 180, down: 270 };   // degrees, physics axes
  const REV_PER_SEC = 0.16;                                   // visual rotation rate

  const state = {
    particle: 'proton',
    v: 2e5,             // m/s
    B: 0.5,             // T
    Bdir: 'out',        // 'out' (+z) | 'in' (-z)
    vdir: 'right',
    showVectors: true,
    showPath: true,
    playing: true,
    phase: 0,           // accumulated visual phase [rad]
    challenge: null
  };

  const P = () => PARTICLES[state.particle];
  const Bz = () => (state.Bdir === 'out' ? 1 : -1) * state.B;

  /* ---- derived physics ------------------------------------------------- */
  function physics() {
    const p = P();
    const q = p.q, m = p.m, B = state.B, v = state.v;
    const F = Math.abs(q) * v * B;               // sin(90 deg) = 1
    const r = m * v / (Math.abs(q) * B);
    const T = 2 * Math.PI * m / (Math.abs(q) * B);
    const omega = Math.abs(q) * B / m;
    const KE = 0.5 * m * v * v;
    // signed rotation rate of the velocity vector (physics axes, y up)
    const Omega = -(q * Bz()) / m;
    return { q, m, F, r, T, omega, KE, Omega, v, B };
  }

  /* Unit vector of the magnetic force at t = 0, in physics axes. */
  function forceDirection() {
    const th = DIRS[state.vdir] * Math.PI / 180;
    const vx = Math.cos(th), vy = Math.sin(th);
    const s = Math.sign(P().q) * Math.sign(Bz());
    // F is proportional to q*(v x B) = q*Bz*(vy, -vx)
    let fx = s * vy, fy = s * (-vx);
    const n = Math.hypot(fx, fy) || 1;
    return { x: fx / n, y: fy / n };
  }
  function forceLabel() {
    const f = forceDirection();
    if (Math.abs(f.x) > Math.abs(f.y)) return f.x > 0 ? 'right' : 'left';
    return f.y > 0 ? 'up' : 'down';
  }

  /* ---- background: B field symbols ------------------------------------- */
  function drawBSymbols(ctx, w, h) {
    const out = state.Bdir === 'out';
    const step = w < 560 ? 54 : 46;
    ctx.save();
    ctx.strokeStyle = 'rgba(167,139,250,.42)';
    ctx.fillStyle = 'rgba(167,139,250,.42)';
    ctx.lineWidth = 1.4;
    const s = 5.2;
    for (let x = step / 2; x < w; x += step) {
      for (let y = step / 2; y < h; y += step) {
        if (out) {                       // dot = arrow tip coming at you
          ctx.beginPath(); ctx.arc(x, y, 2.3, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = .35;
          ctx.beginPath(); ctx.arc(x, y, 5.4, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        } else {                         // cross = arrow tail going away
          ctx.beginPath();
          ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
          ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    label(ctx, out ? 'B out of the page (toward you)' : 'B into the page (away from you)',
      w - 10, 16, { color: 'rgba(196,181,253,.9)', size: 11.5, align: 'right', weight: '700' });
    label(ctx, `|B| = ${fixed(state.B, 2)} T`, w - 10, 33,
      { color: 'rgba(196,181,253,.75)', size: 11, align: 'right', weight: '600' });
  }

  /* ---- main render ----------------------------------------------------- */
  function render(ctx, w, h, stage, dt) {
    ctx.clearRect(0, 0, w, h);
    const ph = physics();

    // advance the visual phase in the physically correct sense of rotation
    if (state.playing && dt) state.phase += Math.sign(ph.Omega) * 2 * Math.PI * REV_PER_SEC * dt;

    drawBSymbols(ctx, w, h);

    // auto-fit: make the orbit radius about 30% of the smaller canvas side
    const cx = w / 2, cy = h / 2;
    const ppm = (0.30 * Math.min(w, h)) / ph.r;          // pixels per metre

    // start point and circle centre in physics coords (metres, y up)
    const th = DIRS[state.vdir] * Math.PI / 180;
    const p0 = { x: 0, y: 0 };
    const v0 = { x: ph.v * Math.cos(th), y: ph.v * Math.sin(th) };
    const c = { x: p0.x - (1 / ph.Omega) * v0.y, y: p0.y + (1 / ph.Omega) * v0.x };

    const toCanvas = (p) => ({ x: cx + (p.x - c.x) * ppm, y: cy - (p.y - c.y) * ppm });
    // centre of the orbit on screen == canvas centre (we translate by -c)
    const C = { x: cx, y: cy };
    const rel0 = { x: p0.x - c.x, y: p0.y - c.y };
    const phi0 = Math.atan2(rel0.y, rel0.x);
    const Rpx = Math.hypot(rel0.x, rel0.y) * ppm;

    // full orbit guide
    if (state.showPath) {
      ctx.save();
      ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(148,163,184,.42)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(C.x, C.y, Rpx, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // traversed arc (fading trail)
      const swept = state.phase;
      const N = 90;
      ctx.save();
      ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) {
        const a1 = phi0 + swept * (i / N), a2 = phi0 + swept * ((i + 1) / N);
        const fade = i / N;
        ctx.strokeStyle = `rgba(34,211,238,${0.05 + fade * 0.75})`;
        ctx.beginPath();
        // canvas y is flipped, so the arc angle is negated
        ctx.arc(C.x, C.y, Rpx, -a1, -a2, swept > 0);
        ctx.stroke();
      }
      ctx.restore();
      label(ctx, 'orbit', C.x, C.y - Rpx - 12, { color: 'rgba(148,163,184,.8)', size: 10.5, weight: '600' });
    }

    // current position
    const phi = phi0 + state.phase;
    const posPhys = { x: c.x + Math.hypot(rel0.x, rel0.y) * Math.cos(phi), y: c.y + Math.hypot(rel0.x, rel0.y) * Math.sin(phi) };
    const X = toCanvas(posPhys);

    // radius line + centre marker
    ctx.save();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(251,191,36,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(X.x, X.y); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(251,191,36,.9)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(C.x - 5, C.y); ctx.lineTo(C.x + 5, C.y);
    ctx.moveTo(C.x, C.y - 5); ctx.lineTo(C.x, C.y + 5); ctx.stroke();
    ctx.restore();
    label(ctx, `r = ${eng(ph.r, 2)} m`, (C.x + X.x) / 2 + 6, (C.y + X.y) / 2 - 8,
      { color: '#f6d36b', size: 11, align: 'left', weight: '700' });

    // velocity + force vectors (both are unit directions in PHYSICS axes;
    // a physics vector (x, y) is drawn on canvas as (x, -y))
    if (state.showVectors) {
      const sgn = Math.sign(ph.Omega) || 1;
      // tangent to the orbit: d/dphi of (cos phi, sin phi) = (-sin phi, cos phi),
      // times the sign of the rotation rate.
      const tx = -Math.sin(phi) * sgn, ty = Math.cos(phi) * sgn;
      const vlen = 46;
      arrow(ctx, X.x, X.y, X.x + tx * vlen, X.y - ty * vlen, { color: '#b5d777', width: 3, head: 11 });
      label(ctx, 'v', X.x + tx * (vlen + 13), X.y - ty * (vlen + 13), { color: '#cdeaa8', size: 13, weight: '800' });

      // The force always points at the centre, so it rotates with the particle.
      const fdir = forceDirection();               // unit force vector at t = 0
      const ca = Math.cos(state.phase), sa = Math.sin(state.phase);
      const fx = fdir.x * ca - fdir.y * sa;
      const fy = fdir.x * sa + fdir.y * ca;
      arrow(ctx, X.x, X.y, X.x + fx * 44, X.y - fy * 44, { color: '#f8aebe', width: 3, head: 11 });
      label(ctx, 'F', X.x + fx * 57, X.y - fy * 57, { color: '#fac0cd', size: 13, weight: '800' });
    }

    // the particle
    const col = P().color;
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(X.x, X.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(246,241,229,.85)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    label(ctx, P().name, X.x, X.y - 19, { color: '#e8eefb', size: 11.5, weight: '700' });

    // captions
    const slowDown = (1 / REV_PER_SEC) / ph.T;      // how much the animation is stretched
    label(ctx, `|F| = ${eng(ph.F, 3)} N    r = ${eng(ph.r, 2)} m    T = ${eng(ph.T, 3)} s    (animation slowed \u00D7${eng(slowDown, 1)})`,
      w / 2, h - 12, { color: 'rgba(169,186,214,.92)', size: 11, weight: '600' });
  }

  const stage = new EMC.Stage(canvas, render, { animate: true });

  /* ---- readouts -------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const ph = physics();
    if (el('lor-force')) el('lor-force').textContent = unit(ph.F, 'N', 3);
    if (el('lor-radius')) el('lor-radius').textContent = unit(ph.r, 'm', 3);
    if (el('lor-period')) el('lor-period').textContent = unit(ph.T, 's', 3);
    if (el('lor-omega')) el('lor-omega').textContent = unit(ph.omega, 'rad/s', 3);
    // electronvolts are the natural unit here; joules go in the sub-line
    if (el('lor-ke')) el('lor-ke').textContent = unit(ph.KE / e, 'eV', 3);
    if (el('lor-kev')) el('lor-kev').textContent = `${eng(ph.KE, 3)} J`;
    if (el('lor-q')) el('lor-q').textContent = `${ph.q > 0 ? '+' : '\u2212'}${eng(Math.abs(ph.q) / e, 3)} e`;
    if (el('lor-dir')) {
      const map = { up: 'up \u2191', down: 'down \u2193', left: 'left \u2190', right: 'right \u2192' };
      el('lor-dir').textContent = map[forceLabel()];
    }
    if (el('lor-rule')) {
      const q = ph.q;
      el('lor-rule').textContent = q > 0
        ? 'Right-hand rule: fingers along v, curl toward B, thumb = force on a POSITIVE charge.'
        : 'Negative charge: use the right-hand rule, then REVERSE the result (or use your left hand).';
    }
  }
  function refresh() { stage.draw(); updateReadouts(); refreshChallengePrompt(); }

  /* ---- controls -------------------------------------------------------- */
  const partGroup = el('lor-particle');
  if (partGroup) EMC.bindSegment(partGroup, v => { state.particle = v; refresh(); });

  // speed: logarithmic slider 1e4 .. 1e7 m/s
  const vSlider = el('lor-v');
  if (vSlider) {
    const fromS = s => Math.pow(10, 4 + (s / 1000) * 3);
    const toS = v => clamp((Math.log10(clamp(v, 1e4, 1e7)) - 4) / 3 * 1000, 0, 1000);
    const show = () => {
      const t = el('lor-vv');
      if (t) t.textContent = state.v >= 1e6
        ? `${(state.v / 1e6).toFixed(2)}\u00D710^6 m/s`
        : `${(state.v / 1000).toFixed(0)} km/s`;
    };
    vSlider.addEventListener('input', () => { state.v = fromS(parseFloat(vSlider.value)); show(); refresh(); });
    vSlider.value = String(toS(state.v));
    show();
  }
  EMC.bindRange('lor-B', 'lor-Bv', v => { state.B = Math.max(0.05, v); refresh(); }, v => `${fixed(v, 2)} T`);
  const bdir = el('lor-bdir'); if (bdir) EMC.bindSegment(bdir, v => { state.Bdir = v; refresh(); });
  const vdir = el('lor-vdir'); if (vdir) EMC.bindSegment(vdir, v => { state.vdir = v; refresh(); });

  const playBtn = el('lor-play');
  if (playBtn) playBtn.addEventListener('click', () => {
    state.playing = !state.playing;
    playBtn.textContent = state.playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', String(!state.playing));
  });
  const resetBtn = el('lor-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => { state.phase = 0; stage.draw(); });

  EMC.bindToggles('lor-toggles', (key, on) => {
    if (key === 'vectors') state.showVectors = on;
    if (key === 'path') state.showPath = on;
    stage.draw();
  });

  /* ---- "predict the direction" mini-challenge -------------------------- */
  function refreshChallengePrompt() {
    const host = el('lor-challenge-text');
    if (!host) return;
    const q = P().q;
    host.innerHTML =
      `A <b>${P().name}</b> (${q > 0 ? 'positive' : 'negative'} charge) moves <b>${state.vdir}</b> ` +
      `through a field pointing <b>${state.Bdir === 'out' ? 'out of the page (toward you)' : 'into the page (away from you)'}</b>. ` +
      `Which way does the magnetic force push it?`;
    const fb = el('lor-challenge-feedback');
    if (fb) { fb.innerHTML = ''; fb.className = 'feedback is-hidden'; }
    document.querySelectorAll('[data-lor-answer]').forEach(b => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
      b.setAttribute('aria-pressed', 'false');
    });
  }

  document.querySelectorAll('[data-lor-answer]').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = forceLabel();
      const chosen = btn.dataset.lorAnswer;
      const fb = el('lor-challenge-feedback');
      document.querySelectorAll('[data-lor-answer]').forEach(b => {
        b.disabled = true;
        b.classList.toggle('correct', b.dataset.lorAnswer === answer);
        if (b === btn && chosen !== answer) b.classList.add('wrong');
      });
      if (fb) {
        const ok = chosen === answer;
        fb.className = 'feedback ' + (ok ? 'good' : 'bad');
        fb.innerHTML = ok
          ? `<b>Correct \u2014 the force points ${answer}.</b> F = q v \u00D7 B, and because F is always perpendicular to v the particle curves into a circle of radius r = mv/(|q|B) instead of speeding up.`
          : `<b>Not quite \u2014 it points ${answer}.</b> Point your right-hand fingers along v (${state.vdir}), curl them toward B (${state.Bdir === 'out' ? 'out of the page' : 'into the page'}); your thumb gives the force on a <i>positive</i> charge. ${P().q < 0 ? 'This particle is negative, so reverse that direction.' : ''}`;
      }
    });
  });

  const newBtn = el('lor-challenge-new');
  if (newBtn) newBtn.addEventListener('click', () => {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const bd = pick(['out', 'in']), vd = pick(Object.keys(DIRS));
    const setSeg = (groupId, value) => {
      const g = el(groupId);
      if (!g) return;
      const b = g.querySelector(`[data-value="${value}"]`);
      if (b) b.click();
    };
    setSeg('lor-bdir', bd);
    setSeg('lor-vdir', vd);
    // 50% chance of flipping the particle between proton and electron
    if (Math.random() < 0.5) setSeg('lor-particle', pick(['proton', 'electron']));
    refreshChallengePrompt();
  });

  refresh();
})();
````

### `js/sim-magnetfield.js` (13.1 KiB)

````javascript
/* Sim 5 - bar magnet lab. Two-pole dipole model B = (mu0/4pi) SUM qm rhat/r^2 (a drawing model - magnetic monopoles do not exist); layers: field lines, compasses, vectors, iron filings; magnet draggable and rotatable. */
(function () {
  const canvas = document.getElementById('sim-magnet');
  if (!canvas) return;

  const { CONST, clamp, arrow, label, roundRect, eng, unit } = EMC;
  const MU0_4PI = CONST.MU0 / (4 * Math.PI);   // = 1e-7 T m / A
  const PX_PER_M = 1300;                       // canvas scale (magnet ~6 cm long)
  const L_MAG = 0.06;                          // magnet length [m]

  const state = {
    nx: 0.5, ny: 0.5,        // magnet centre, normalised canvas coords
    angleDeg: 0,             // 0 = N pointing right
    m: 0.6,                  // dipole moment [A m^2]
    show: { lines: true, compass: true, vectors: false, filings: false },
    lines: 16,
    probe: null,
    dragging: false
  };

  /* ---- deterministic "iron filings" scatter ---------------------------- */
  function seededRandom(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  let filings = [];
  function makeFilings(seed = 7) {
    const rnd = seededRandom(seed);
    filings = [];
    for (let i = 0; i < 900; i++) filings.push({ nx: rnd(), ny: rnd(), jitter: (rnd() - 0.5) * 0.5 });
  }
  makeFilings();

  /* ---- field maths ----------------------------------------------------- */
  function geometry(w, h) {
    const cx = state.nx * w, cy = state.ny * h;
    const th = state.angleDeg * Math.PI / 180;
    const halfPx = (L_MAG / 2) * PX_PER_M;
    // physics axes: y up. Canvas y is down, hence the sign flip on sin().
    const ax = Math.cos(th), ay = Math.sin(th);
    return {
      cx, cy, th, halfPx,
      N: { x: cx + ax * halfPx, y: cy - ay * halfPx },   // canvas px
      S: { x: cx - ax * halfPx, y: cy + ay * halfPx }
    };
  }

  /* Magnetic flux density at canvas pixel (x,y). Returns physics-axis vector. */
  function fieldAt(x, y, g) {
    const qm = state.m / L_MAG;                          // pole strength [A m]
    const poles = [{ p: g.N, q: +qm }, { p: g.S, q: -qm }];
    let bx = 0, by = 0;
    for (const pole of poles) {
      const dxm = (x - pole.p.x) / PX_PER_M;
      const dym = (-(y - pole.p.y)) / PX_PER_M;          // convert to y-up
      const r2 = dxm * dxm + dym * dym;
      const r = Math.sqrt(r2);
      if (r < 1e-4) continue;
      const B = MU0_4PI * pole.q / r2;
      bx += B * dxm / r; by += B * dym / r;
    }
    return { bx, by, mag: Math.hypot(bx, by) };
  }

  /* Field expressed directly in canvas direction (y flipped) + magnitude. */
  function fieldCanvas(x, y, g) {
    const f = fieldAt(x, y, g);
    return { dx: f.bx, dy: -f.by, mag: f.mag };
  }

  function magColor(B) {
    // 1e-5 T (Earth) .. 1e-2 T mapped onto a colour ramp
    const n = clamp((Math.log10(Math.max(B, 1e-9)) + 5) / 3, 0, 1);
    const hue = 210 - n * 210;
    return `hsl(${hue.toFixed(0)} 92% ${56 + n * 10}%)`;
  }

  /* ---- layer painters -------------------------------------------------- */
  function drawFieldLines(ctx, w, h, g) {
    const step = 2.6, maxSteps = 1600;
    const poleR = Math.max(9, g.halfPx * 0.34);
    ctx.save();
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (let i = 0; i < state.lines; i++) {
      const a = (i / state.lines) * Math.PI * 2;
      let x = g.N.x + Math.cos(a) * poleR * 0.85;
      let y = g.N.y + Math.sin(a) * poleR * 0.85;
      ctx.beginPath(); ctx.moveTo(x, y);
      let hitS = false;
      for (let s = 0; s < maxSteps; s++) {
        const f = fieldCanvas(x, y, g);
        if (f.mag < 1e-12) break;
        x += (f.dx / f.mag) * step;
        y += (f.dy / f.mag) * step;
        ctx.lineTo(x, y);
        if (x < -60 || x > w + 60 || y < -60 || y > h + 60) break;
        if (Math.hypot(x - g.S.x, y - g.S.y) < poleR * 0.7) { hitS = true; break; }
      }
      ctx.strokeStyle = hitS ? 'rgba(168,211,224,.75)' : 'rgba(213,184,216,.5)';
      ctx.stroke();
      // tangent arrow showing the N -> S direction
      const t = 0.35;
      const mx = g.N.x + (x - g.N.x) * t, my = g.N.y + (y - g.N.y) * t;
      const f = fieldCanvas(mx, my, g);
      if (f.mag > 0) {
        arrow(ctx, mx - (f.dx / f.mag) * 6, my - (f.dy / f.mag) * 6,
              mx + (f.dx / f.mag) * 6, my + (f.dy / f.mag) * 6,
              { color: 'rgba(221,214,254,.85)', width: 1.5, head: 5 });
      }
    }
    ctx.restore();
  }

  function drawCompasses(ctx, w, h, g) {
    const step = w < 560 ? 62 : 52;
    const r = Math.min(13, step * 0.26);
    for (let x = step / 2; x < w; x += step) {
      for (let y = step / 2; y < h; y += step) {
        if (Math.hypot(x - g.cx, y - g.cy) < g.halfPx + 12) continue;   // inside the magnet
        const f = fieldCanvas(x, y, g);
        ctx.save();
        ctx.fillStyle = 'rgba(10,18,34,.85)';
        ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (f.mag > 0) {
          const ux = f.dx / f.mag, uy = f.dy / f.mag;
          ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.strokeStyle = '#f8aebe';                       // north-seeking half
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ux * r * 0.78, y + uy * r * 0.78); ctx.stroke();
          ctx.strokeStyle = '#cbd5e1';                       // south-seeking half
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * r * 0.78, y - uy * r * 0.78); ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  function drawVectors(ctx, w, h, g) {
    const step = w < 560 ? 46 : 38;
    for (let x = step / 2; x < w; x += step) {
      for (let y = step / 2; y < h; y += step) {
        if (Math.hypot(x - g.cx, y - g.cy) < g.halfPx + 8) continue;
        const f = fieldCanvas(x, y, g);
        if (f.mag <= 0) continue;
        const len = clamp(4 + (Math.log10(f.mag) + 5) * 4.2, 3, step * 0.5);
        arrow(ctx, x - (f.dx / f.mag) * len / 2, y - (f.dy / f.mag) * len / 2,
              x + (f.dx / f.mag) * len / 2, y + (f.dy / f.mag) * len / 2,
              { color: magColor(f.mag), width: 1.5, head: 4.5 });
      }
    }
  }

  function drawFilings(ctx, w, h, g) {
    ctx.save();
    ctx.lineCap = 'round';
    for (const p of filings) {
      const x = p.nx * w, y = p.ny * h;
      if (Math.hypot(x - g.cx, y - g.cy) < g.halfPx * 0.7) continue;
      const f = fieldCanvas(x, y, g);
      if (f.mag <= 0) continue;
      const n = clamp((Math.log10(f.mag) + 4.4) / 2.6, 0.08, 1);
      const len = 3 + n * 7;
      const ux = f.dx / f.mag, uy = f.dy / f.mag;
      ctx.strokeStyle = `rgba(203,213,225,${0.12 + n * 0.7})`;
      ctx.lineWidth = 0.9 + n * 0.9;
      ctx.beginPath();
      ctx.moveTo(x - ux * len / 2 + p.jitter, y - uy * len / 2);
      ctx.lineTo(x + ux * len / 2 + p.jitter, y + uy * len / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMagnet(ctx, g) {
    const half = g.halfPx, thick = half * 0.46;
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(-g.th);                     // canvas y is flipped, so negate
    // S half (left, pastel blue)
    roundRect(ctx, -half, -thick, half, thick * 2, 5);
    ctx.fillStyle = '#a8d3e0'; ctx.fill();
    // N half (right, pastel pink)
    roundRect(ctx, 0, -thick, half, thick * 2, 5);
    ctx.fillStyle = '#f8aebe'; ctx.fill();
    ctx.strokeStyle = 'rgba(246,241,229,.45)'; ctx.lineWidth = 1.2;
    roundRect(ctx, -half, -thick, half * 2, thick * 2, 5); ctx.stroke();
    ctx.fillStyle = '#2b2d33'; ctx.font = '800 15px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', -half / 2, 1);
    ctx.fillText('N', half / 2, 1);
    ctx.restore();
  }

  /* ---- main render ----------------------------------------------------- */
  function render(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = geometry(w, h);

    if (state.show.filings) drawFilings(ctx, w, h, g);
    if (state.show.lines) drawFieldLines(ctx, w, h, g);
    if (state.show.vectors) drawVectors(ctx, w, h, g);
    if (state.show.compass) drawCompasses(ctx, w, h, g);
    drawMagnet(ctx, g);

    // probe
    if (state.probe && Math.hypot(state.probe.x - g.cx, state.probe.y - g.cy) > g.halfPx) {
      const f = fieldCanvas(state.probe.x, state.probe.y, g);
      if (f.mag > 0) {
        const len = clamp(12 + (Math.log10(f.mag) + 5) * 6, 12, 46);
        arrow(ctx, state.probe.x, state.probe.y,
              state.probe.x + (f.dx / f.mag) * len, state.probe.y + (f.dy / f.mag) * len,
              { color: '#f6d36b', width: 2.4, head: 8 });
        ctx.save();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(251,191,36,.55)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(state.probe.x, state.probe.y, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    label(ctx, 'drag the magnet \u00B7 rotate it with the angle slider', w / 2, 16,
      { color: 'rgba(148,163,184,.65)', size: 11, weight: '500' });
  }

  const stage = new EMC.Stage(canvas, render);

  /* ---- readouts -------------------------------------------------------- */
  const el = id => document.getElementById(id);
  const fixed2 = v => Number(v).toFixed(2);

  function updateReadouts() {
    if (el('mag-moment')) el('mag-moment').textContent = `${fixed2(state.m)} A\u00B7m\u00B2`;
    if (el('mag-pole')) el('mag-pole').textContent = `${eng(state.m / L_MAG, 2)} A\u00B7m`;
    if (state.probe) {
      const g = geometry(stage.w, stage.h);
      const f = fieldAt(state.probe.x, state.probe.y, g);
      if (el('mag-bprobe')) el('mag-bprobe').textContent = unit(f.mag, 'T', 2);
      if (el('mag-bprobe-uT')) {
        el('mag-bprobe-uT').hidden = false;
        el('mag-bprobe-uT').textContent = `\u2248 ${(f.mag / 5e-5).toFixed(1)}\u00D7 Earth's field (50 \u00B5T)`;
      }
      if (el('mag-dir')) {
        const deg = (Math.atan2(f.by, f.bx) * 180 / Math.PI + 360) % 360;
        el('mag-dir').textContent = f.mag > 0 ? `${deg.toFixed(0)}\u00B0 from +x` : '\u2014';
      }
    } else {
      if (el('mag-bprobe')) el('mag-bprobe').textContent = 'hover the field';
      if (el('mag-bprobe-uT')) { el('mag-bprobe-uT').textContent = ''; el('mag-bprobe-uT').hidden = true; }
      if (el('mag-dir')) el('mag-dir').textContent = '\u2014';
    }
  }
  function refresh() { stage.draw(); updateReadouts(); }

  /* ---- controls -------------------------------------------------------- */
  EMC.bindRange('mag-angle', 'mag-anglev', v => { state.angleDeg = v; refresh(); }, v => `${v.toFixed(0)}\u00B0`);
  // Dipole moment uses a log slider: 0.05 .. 2.0 A m^2
  const mSlider = el('mag-m');
  if (mSlider) {
    const fromS = s => Math.pow(10, -1.3 + (s / 1000) * (Math.log10(2) + 1.3));
    const toS = m => clamp((Math.log10(clamp(m, 0.05, 2)) + 1.3) / (Math.log10(2) + 1.3) * 1000, 0, 1000);
    const show = () => {
      const t = el('mag-mv');
      if (t) t.textContent = `${state.m.toFixed(2)} A\u00B7m\u00B2`;
    };
    mSlider.addEventListener('input', () => { state.m = fromS(parseFloat(mSlider.value)); show(); refresh(); });
    mSlider.value = String(toS(state.m));
    show();
  }
  const lineSlider = el('mag-lines');
  if (lineSlider) EMC.bindRange(lineSlider, 'mag-linesv', v => { state.lines = Math.round(v); refresh(); }, v => `${Math.round(v)} lines`);

  EMC.bindToggles('mag-toggles', (key, on) => {
    if (key in state.show) { state.show[key] = on; refresh(); }
  });

  const shuffle = el('mag-shuffle');
  if (shuffle) shuffle.addEventListener('click', () => {
    makeFilings(Math.floor(Math.random() * 100000));
    if (!state.show.filings) {
      const btn = document.querySelector('[data-toggle="filings"]');
      if (btn) { btn.setAttribute('aria-pressed', 'true'); state.show.filings = true; }
    }
    refresh();
  });
  const resetBtn = el('mag-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    state.nx = 0.5; state.ny = 0.5; state.angleDeg = 0;
    const a = el('mag-angle'); if (a) { a.value = '0'; a.dispatchEvent(new Event('input')); }
    refresh();
  });

  /* ---- drag the magnet ------------------------------------------------- */
  stage.onPointer(p => {
    const g = geometry(stage.w, stage.h);
    if (p.type === 'down') {
      // hit test against the rotated magnet body (un-rotate the pointer)
      // Un-rotate the pointer offset into the magnet's local frame:
      // the body was drawn with ctx.rotate(-theta), so the inverse is R(+theta).
      const dx = p.x - g.cx, dy = p.y - g.cy;
      const c = Math.cos(g.th), s = Math.sin(g.th);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      state.dragging = Math.abs(lx) < g.halfPx + 10 && Math.abs(ly) < g.halfPx * 0.5 + 12;
      canvas.classList.toggle('grabbing', state.dragging);
    } else if (p.type === 'move') {
      state.probe = { x: p.x, y: p.y };
      if (state.dragging) {
        state.nx = clamp(p.x / stage.w, 0.12, 0.88);
        state.ny = clamp(p.y / stage.h, 0.18, 0.82);
      }
      refresh();
    } else if (p.type === 'up' || p.type === 'leave') {
      state.dragging = false;
      if (p.type === 'leave') state.probe = null;
      canvas.classList.remove('grabbing');
      refresh();
    }
  });

  refresh();
})();
````

### `js/sim-ohm.js` (15.3 KiB)

````javascript
/* Sim 3 - Ohm bench. I = V/R, P = VI; auto-ranging ammeter, bulb brightness proportional to P, I-V characteristic with R/2 and 2R reference lines. */
(function () {
  const canvas = document.getElementById('sim-ohm');
  if (!canvas) return;

  const { CONST, clamp, label, eng, unit, fixed } = EMC;

  /* ---- state ---------------------------------------------------------- */
  const state = {
    V: 9,            // volts
    R: 22,           // ohms
    ratedP: 0.5,     // resistor power rating in W (real-world safety check)
    electrons: false // false = conventional current, true = electron flow
  };
  const get = () => ({
    I: state.R > 0 ? state.V / state.R : 0,
    P: state.R > 0 ? (state.V * state.V) / state.R : 0
  });

  /* ---- analogue ammeter auto-ranging ----------------------------------- */
  const RANGES = [
    { max: 1e-3, txt: '1 mA' }, { max: 1e-2, txt: '10 mA' }, { max: 1e-1, txt: '100 mA' },
    { max: 1, txt: '1 A' }, { max: 5, txt: '5 A' }, { max: 25, txt: '25 A' }
  ];
  function pickRange(I) { return RANGES.find(r => I <= r.max) || RANGES[RANGES.length - 1]; }

  /* ---- circuit geometry ------------------------------------------------ */
  function layout(w, h) {
    const bx = Math.max(42, w * 0.09);
    const ty = Math.max(42, h * 0.20);
    const by = h - Math.max(46, h * 0.22);
    return {
      bx, ty, by, rx: w - bx,
      battery: { x: bx, y: h / 2 },
      resistor: { x: w / 2, y: ty },
      bulb: { x: w - bx, y: h / 2 },
      meter: { x: w / 2, y: by, r: clamp(Math.min(w, h) * 0.085, 24, 34) },
      // closed loop used for the moving-charge animation
      loop: [[bx, ty], [w - bx, ty], [w - bx, by], [bx, by], [bx, ty]]
    };
  }

  /* Point at fractional distance s (0..1) along a closed polyline. */
  function pointOnLoop(loop, s) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < loop.length - 1; i++) {
      const len = Math.hypot(loop[i + 1][0] - loop[i][0], loop[i + 1][1] - loop[i][1]);
      segs.push({ a: loop[i], b: loop[i + 1], len }); total += len;
    }
    let d = ((s % 1) + 1) % 1 * total;
    for (const sg of segs) {
      if (d <= sg.len) {
        const t = sg.len === 0 ? 0 : d / sg.len;
        return [sg.a[0] + (sg.b[0] - sg.a[0]) * t, sg.a[1] + (sg.b[1] - sg.a[1]) * t];
      }
      d -= sg.len;
    }
    return loop[0];
  }

  /* ---- component drawings --------------------------------------------- */
  function drawWires(ctx, L) {
    ctx.save();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(L.loop[0][0], L.loop[0][1]);
    for (let i = 1; i < L.loop.length; i++) ctx.lineTo(L.loop[i][0], L.loop[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function drawBattery(ctx, x, y, V) {
    ctx.save();
    ctx.strokeStyle = '#e8eefb'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    // two cells: long plate = + terminal (top), short plate = - terminal
    const gap = 7;
    for (let i = 0; i < 2; i++) {
      const cy = y - gap + i * gap * 2;
      ctx.beginPath(); ctx.moveTo(x - 15, cy - gap); ctx.lineTo(x + 15, cy - gap); ctx.stroke();      // long (+)
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(x - 8, cy - gap + 6); ctx.lineTo(x + 8, cy - gap + 6); ctx.stroke(); // short (-)
      ctx.lineWidth = 3;
    }
    label(ctx, '+', x + 22, y - 16, { color: '#f8aebe', size: 14, weight: '800' });
    label(ctx, '\u2212', x + 22, y + 14, { color: '#cfe9f2', size: 16, weight: '800' });
    label(ctx, `${fixed(V, 1)} V`, x - 6, y + 44, { color: '#f6d36b', size: 12.5, weight: '700' });
    ctx.restore();
  }

  /* Zig-zag resistor symbol drawn horizontally, centred on (x,y). */
  function drawResistor(ctx, x, y, R, hot) {
    const w = 74, h = 15, lead = 20;
    ctx.save();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - lead, y); ctx.lineTo(x - w / 2, y);
    const peaks = 6, pw = w / peaks;
    for (let i = 0; i < peaks; i++) {
      const sx = x - w / 2 + i * pw;
      ctx.lineTo(sx + pw * 0.25, y - h);
      ctx.lineTo(sx + pw * 0.75, y + h);
      ctx.lineTo(sx + pw, y);
    }
    ctx.lineTo(x + w / 2 + lead, y);
    if (hot) { ctx.strokeStyle = '#f8aebe'; ctx.lineWidth = 3.2; }
    ctx.stroke();
    ctx.restore();
    label(ctx, `R = ${eng(R, 3)}\u03A9`, x, y - 30, { color: '#cfe9f2', size: 12.5, weight: '700' });
  }

  /* Incandescent bulb: glow and filament colour scale with dissipated power. */
  function drawBulb(ctx, x, y, P) {
    const b = clamp(P / 6, 0, 1);            // 6 W = "full brightness" reference
    const r = 17;
    ctx.save();
    // flat halo: one translucent disc whose alpha tracks power (no gradient)
    if (b > 0.02) {
      ctx.fillStyle = `rgba(246,211,107,${0.05 + b * 0.16})`;
      ctx.beginPath(); ctx.arc(x, y, r * (1.9 + b * 1.6), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = `rgba(246,211,107,${0.14 + b * 0.6})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    // filament
    ctx.strokeStyle = b > 0.02 ? `hsl(${45 - b * 20} 100% ${60 + b * 30}%)` : '#7b8db0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.72, y + r * 0.72);
    ctx.lineTo(x - r * 0.24, y - r * 0.2); ctx.lineTo(x + r * 0.24, y + r * 0.2);
    ctx.lineTo(x + r * 0.72, y - r * 0.72);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'bulb', x, y + r + 18, { color: '#a9bad6', size: 11, weight: '600' });
  }

  /* Circular analogue ammeter with an auto-ranging scale. */
  function drawAmmeter(ctx, x, y, r, I) {
    const range = pickRange(I);
    const frac = clamp(I / range.max, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(8,15,28,.94)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5b7299'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

    // scale arc across the top half (180 deg sweep)
    ctx.strokeStyle = 'rgba(148,163,184,.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r * 0.74, Math.PI, Math.PI * 2); ctx.stroke();
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      const inner = r * 0.66, outer = r * 0.82;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
      ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
      ctx.stroke();
    }
    // needle
    const na = Math.PI + frac * Math.PI;
    ctx.strokeStyle = '#f8aebe'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(na) * r * 0.7, y + Math.sin(na) * r * 0.7); ctx.stroke();
    ctx.fillStyle = '#e8eefb'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    label(ctx, 'A', x, y + r * 0.44, { color: '#e8eefb', size: Math.max(10, r * 0.34), weight: '800' });
    label(ctx, `range ${range.txt}`, x, y + r + 15, { color: '#7b8db0', size: 10.5, weight: '600' });
  }

  /* ---- main render ----------------------------------------------------- */
  function render(ctx, w, h, stage) {
    ctx.clearRect(0, 0, w, h);
    const L = layout(w, h);
    const { I, P } = get();

    drawWires(ctx, L);

    // moving charges: speed and density scale with current
    const speed = clamp(70 * Math.pow(Math.abs(I), 0.32), 4, 340);
    const nDots = clamp(Math.round(10 + 26 * Math.min(1, Math.log10(1 + Math.abs(I) * 20) / 2)), 10, 34);
    const phase = (stage.t * speed) / 1200;
    const dir = state.electrons ? -1 : 1;
    ctx.save();
    for (let i = 0; i < nDots; i++) {
      const s = ((i / nDots) + phase * dir) % 1;
      const [px, py] = pointOnLoop(L.loop, s);
      ctx.fillStyle = state.electrons ? '#a8d3e0' : '#f6d36b';
      ctx.beginPath(); ctx.arc(px, py, 3.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    drawBattery(ctx, L.battery.x, L.battery.y, state.V);
    drawResistor(ctx, L.resistor.x, L.resistor.y, state.R, P > state.ratedP);
    drawBulb(ctx, L.bulb.x, L.bulb.y, P);
    drawAmmeter(ctx, L.meter.x, L.meter.y, L.meter.r, Math.abs(I));

    // current readout above the meter
    label(ctx, `I = ${unit(I, 'A', 3)}`, L.meter.x, L.meter.y - L.meter.r - 20,
      { color: '#cfe9f2', size: 13.5, weight: '800' });

    // flow-direction caption
    label(ctx, state.electrons ? 'electron flow (\u2212 \u2192 +)' : 'conventional current (+ \u2192 \u2212)',
      w / 2, h - 12, { color: 'rgba(148,163,184,.85)', size: 10.5, weight: '600' });

    if (P > state.ratedP) {
      label(ctx, '\u26A0 above the resistor power rating', L.resistor.x, L.resistor.y + 34,
        { color: '#fca5a5', size: 11, weight: '700' });
    }
  }

  const stage = new EMC.Stage(canvas, render, { animate: true });

  /* ---- I-V characteristic chart --------------------------------------- */
  const chartCanvas = document.getElementById('sim-ohm-chart');
  let chart = null;
  if (chartCanvas) {
    chart = new EMC.Stage(chartCanvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 46, r: 14, t: 14, b: 26 };
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const { I } = get();
      const Vmax = 24;
      // Vertical scale adapts to the operating point (never below 10 mA).
      const Imax = Math.max(I * 1.3, 0.01);

      const X = v => pad.l + (v / Vmax) * pw;
      const Y = i => pad.t + ph - (i / Imax) * ph;

      // grid + axes
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,.16)'; ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const gx = X((g / 4) * Vmax), gy = Y((g / 4) * Imax);
        ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + ph); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + pw, gy); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(148,163,184,.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
      ctx.restore();

      // ghost lines for R/2 and 2R (slope = 1/R)
      const ghost = (R, color, text) => {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(Vmax), Y(Vmax / R)); ctx.stroke();
        ctx.restore();
        // keep the reference-line label inside the plot when the line is steep
        label(ctx, text, X(Vmax) - 6, clamp(Y(Vmax / R), pad.t + 10, pad.t + ph - 4) - 6,
          { color, size: 10, align: 'right', weight: '700' });
      };
      ghost(state.R * 2, 'rgba(167,139,250,.75)', '2R');
      ghost(state.R / 2, 'rgba(52,211,153,.75)', 'R/2');

      // the actual characteristic I = V/R
      ctx.save();
      ctx.strokeStyle = '#a8d3e0'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(Vmax), Y(Vmax / state.R)); ctx.stroke();
      ctx.restore();

      // operating point
      const ox = X(state.V), oy = Y(I);
      if (oy >= pad.t - 2) {
        ctx.save();
        ctx.fillStyle = '#f6d36b'; ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        label(ctx, `(${fixed(state.V, 1)} V, ${eng(I, 2)} A)`, clamp(ox, pad.l + 40, w - 50), oy - 14,
          { color: '#f6d36b', size: 11, weight: '700' });
      }

      label(ctx, 'V (volts) \u2192', pad.l + pw / 2, h - 8, { color: '#7b8db0', size: 10.5, weight: '600' });
      label(ctx, eng(Imax, 1), pad.l - 6, pad.t + 8, { color: '#7b8db0', size: 9.5, align: 'right', weight: '600' });
      label(ctx, 'I (A)', pad.l - 6, pad.t + 21, { color: '#7b8db0', size: 10, align: 'right', weight: '600' });
      label(ctx, 'gradient = 1/R', pad.l + 8, pad.t + ph - 10, { color: 'rgba(148,163,184,.8)', size: 10, align: 'left', weight: '600' });
    });
  }

  /* ---- readouts -------------------------------------------------------- */
  const el = id => document.getElementById(id);
  function updateReadouts() {
    const { I, P } = get();
    if (el('ohm-I')) el('ohm-I').textContent = unit(I, 'A', 3);
    // Sub-line: the same current expressed as a charge-carrier rate. Writing
    // eng(I*1000)+' mA' would stack two prefixes ("3.00 k mA"), so we show the
    // physically meaningful electron flow instead.
    if (el('ohm-ImA')) {
      el('ohm-ImA').textContent = I === 0 ? 'no charge flow'
        : `${eng(I / CONST.E, 3)} electrons/s`;
    }
    if (el('ohm-P')) el('ohm-P').textContent = unit(P, 'W', 3);
    if (el('ohm-sub')) {
      el('ohm-sub').textContent = `I = V \u00F7 R = ${fixed(state.V, 1)} V \u00F7 ${eng(state.R, 3)} \u03A9 = ${eng(I, 4)} A`;
    }
    const warn = el('ohm-warn');
    if (warn) {
      const over = P > state.ratedP;
      warn.hidden = !over;
      if (over) {
        warn.innerHTML = `<b>Over-rated!</b> The resistor is dissipating ${eng(P, 2)} W but is only rated for ${state.ratedP} W. A real component this size would overheat \u2014 in practice you would use a higher-wattage resistor or raise R.`;
      }
    }
    if (el('ohm-range')) el('ohm-range').textContent = pickRange(Math.abs(I)).txt;
  }

  function refresh() { stage.draw(); if (chart) chart.draw(); updateReadouts(); }

  /* ---- controls -------------------------------------------------------- */
  EMC.bindRange('ohm-V', 'ohm-Vv', v => { state.V = v; refresh(); }, v => `${fixed(v, 1)} V`);

  // Resistance uses a LOGARITHMIC slider (0..1000 -> 1 ohm..1000 ohm) so that
  // low values are still easy to select precisely.
  const rSlider = el('ohm-R');
  if (rSlider) {
    const fromSlider = s => Math.pow(10, (s / 1000) * 3);      // 1 .. 1000 ohm
    const toSlider = R => clamp((Math.log10(clamp(R, 1, 1000)) / 3) * 1000, 0, 1000);
    const apply = () => {
      state.R = fromSlider(parseFloat(rSlider.value));
      if (el('ohm-Rv')) el('ohm-Rv').textContent = `${eng(state.R, 3)} \u03A9`;
      const num = el('ohm-Rnum');
      if (num && document.activeElement !== num) num.value = String(Math.round(state.R * 10) / 10);
      refresh();
    };
    rSlider.addEventListener('input', apply);
    rSlider.value = String(toSlider(state.R));
    apply();

    // exact numeric entry
    const num = el('ohm-Rnum');
    if (num) {
      num.addEventListener('change', () => {
        const v = parseFloat(num.value);
        if (isFinite(v) && v >= 0.1) { state.R = clamp(v, 0.1, 1e6); rSlider.value = String(toSlider(clamp(state.R, 1, 1000))); apply(); }
        else num.value = String(Math.round(state.R * 10) / 10);
      });
    }
    document.querySelectorAll('[data-ohm-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [V, R] = btn.dataset.ohmPreset.split(',').map(Number);
        const vEl = el('ohm-V');
        // Drive the real controls so readouts and state can never drift apart.
        if (vEl) { vEl.value = String(V); vEl.dispatchEvent(new Event('input')); }
        rSlider.value = String(toSlider(R));
        apply();
        EMC.toast(`Preset: V = ${fixed(V, 1)} V, R = ${eng(R, 3)} \u03A9`);
      });
    });
  }

  const rated = el('ohm-rated');
  if (rated) EMC.bindRange(rated, 'ohm-ratedv', v => { state.ratedP = v; refresh(); }, v => `${fixed(v, 2)} W`);

  const flowToggle = el('ohm-electrons');
  if (flowToggle) flowToggle.addEventListener('change', () => { state.electrons = flowToggle.checked; refresh(); });

  refresh();
})();
````

### `package.json` (809 B)

````json
{
  "name": "emc-lab",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "node tools/check-links.mjs",
    "test": "node tools/smoke-test.mjs",
    "build:css": "tailwindcss -c tailwind.config.js -i css/input.css -o css/site.css --minify",
    "build:public": "node tools/build-public.mjs",
    "build": "bun run build:css && bun run build:public",
    "switch:cdn": "node tools/switch-css.mjs cdn",
    "switch:built": "node tools/switch-css.mjs built",
    "font:scan": "node tools/add-font.mjs",
    "perf": "node tools/perf-audit.mjs"
  },
  "devDependencies": {
    "jsdom": "^27.0.0",
    "tailwindcss": "^3.4.10"
  },
  "description": "Interactive electromagnetics tutorial for Calculus-based Physics II. Fully static: zero runtime dependencies; jsdom is a dev-only test dependency."
}
````

### `quiz.html` (12.7 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Twenty-five multiple-choice questions on electromagnetics with automatic scoring, worked explanations and a per-topic breakdown.">
  <meta name="theme-color" content="#060b16">
  <title>Quiz · EMC Lab</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="topics/charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="topics/current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="topics/magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="topics/induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap wrap-narrow section-tight">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span aria-hidden="true">/</span><span>Quiz</span>
      </nav>
      <svg class="mascot mascot-sm" aria-hidden="true" viewBox="0 0 120 112">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
      <span class="eyebrow eyebrow-amber" style="margin-top:.45rem">Assessment</span>
      <h1 class="h-topic" style="margin:.4rem 0 .35rem">Electromagnetics quiz</h1>
      <p class="lede">
        <span id="quiz-total">25</span> multiple-choice questions covering all four topics, each
        with a worked explanation. Scoring is automatic; your best result is saved in this browser.
      </p>

      <div class="stat-strip stat-strip-4" style="max-width:640px">
        <div class="stat"><span class="stat-label">Questions</span><span class="stat-value hl-cyan" id="quiz-count">25</span></div>
        <div class="stat"><span class="stat-label">Best score</span><span class="stat-value hl-emerald" id="quiz-best">—</span></div>
        <div class="stat"><span class="stat-label">Attempts</span><span class="stat-value" id="quiz-attempts">0</span></div>
        <div class="stat"><span class="stat-label">Pass mark</span><span class="stat-value hl-amber">70%</span></div>
      </div>
    </div>

    <div class="wrap section-tight">
      <div class="panel">
        <div class="panel-body">
          <div class="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <span class="ctl-label" style="margin-bottom:.4rem">Filter by topic</span>
              <div class="btn-group" role="group" aria-label="Filter questions by topic">
                <button class="btn btn-sm active" type="button" data-quiz-filter="all" aria-pressed="true">All</button>
                <button class="btn btn-sm" type="button" data-quiz-filter="charges" aria-pressed="false">Charges</button>
                <button class="btn btn-sm" type="button" data-quiz-filter="current" aria-pressed="false">Current</button>
                <button class="btn btn-sm" type="button" data-quiz-filter="magnetism" aria-pressed="false">Magnetism</button>
                <button class="btn btn-sm" type="button" data-quiz-filter="induction" aria-pressed="false">Induction</button>
              </div>
            </div>
            <div>
              <span class="ctl-label" style="margin-bottom:.4rem">Marking</span>
              <div class="seg" id="quiz-mode" role="group" aria-label="Marking mode">
                <button class="seg-btn" type="button" data-value="exam" aria-pressed="true">Exam mode</button>
                <button class="seg-btn" type="button" data-value="instant" aria-pressed="false">Instant feedback</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 mt-4">
            <button class="btn btn-primary" type="button" id="quiz-submit">Submit quiz</button>
            <button class="btn" type="button" id="quiz-shuffle">Shuffle order</button>
            <span class="tag" id="quiz-timer" hidden aria-label="Elapsed time">0:00</span>
            <span class="tag tag-amber" id="quiz-streak" hidden aria-label="Current correct streak">streak ×0</span>
            <div style="flex:1 1 180px;min-width:160px">
              <div class="progress-track"><div class="progress-fill" id="quiz-progress-fill"></div></div>
              <p class="tiny faint" style="margin:.35rem 0 0"><span id="quiz-progress-text">0 of 25 answered</span><span id="quiz-live" hidden></span></p>
            </div>
          </div>

          <p class="tiny faint mt-2">
            Keyboard: <span class="mono">1–4</span> or <span class="mono">A–D</span> answer the question on screen,
            <span class="mono">Enter</span> submits, <span class="mono">N</span> jumps to the next blank.
          </p>
          <p class="tiny faint mt-3">
            <strong>Exam mode</strong> marks nothing until you submit — good for a real test.
            <strong>Instant feedback</strong> marks each answer immediately and shows the
            explanation, which is better when you are learning. Submitting always grades the
            full bank; filters are a revision aid only, and blank answers count as incorrect.
          </p>
        </div>
      </div>
    </div>

    <div class="wrap section-tight">
      <div class="card" id="quiz-score" role="status" aria-live="polite" hidden></div>
    </div>

    <div class="wrap section-tight" id="quiz-list">
      <div id="quiz-questions"><!-- questions injected by js/quiz.js --></div>
    </div>

    <div class="wrap section-tight">
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-bold">Want to revise before scoring?</h2>
            <p class="small muted" style="margin:.25rem 0 0">Each topic page ends with self-check questions and a live simulation.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a class="btn btn-sm" href="topics/charges.html">Topic 1</a>
            <a class="btn btn-sm" href="topics/current.html">Topic 2</a>
            <a class="btn btn-sm" href="topics/magnetism.html">Topic 3</a>
            <a class="btn btn-sm" href="topics/induction.html">Topic 4</a>
            <a class="btn btn-sm btn-primary" href="index.html">Home</a>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid footer-grid-2">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">Twenty-five questions across the four topics.</p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="topics/charges.html">1 · Charges &amp; fields</a></li>
          <li><a href="topics/current.html">2 · Current electricity</a></li>
          <li><a href="topics/magnetism.html">3 · Magnetism</a></li>
          <li><a href="topics/induction.html">4 · Electromagnetic induction</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">© <span data-year>2026</span> EMC Lab</p>
    </div>
  </footer>

  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <script defer src="vendor/katex/katex.min.js"></script>
  <script defer src="js/common.js"></script>
  <script defer src="js/quiz-data.js"></script>
  <script defer src="js/quiz.js"></script>
</body>
</html>
````

### `tailwind.config.js` (1.7 KiB)

````javascript
/* Tailwind config — single source for screens, fonts and content scanning.
   screens match the component layer exactly: 640 / 900 / 1200.
   fontFamily: ONE family for the whole site — G8321 by Coji Morishita
   (SIL OFL 1.1), committed woff2 in 100 / 400 / 700, declared in css/fonts.css:
     title -> 'fot-yuruka-std' (private, local machines only) -> G8321
     sans  -> G8321 Regular 400 (body copy, labels)
     ui    -> G8321 (bold micro-labels / thin display numerals)
   On the public deploy titles fall back to G8321 Bold, so every host sees
   the same family throughout.
   blocklist protects hand-written component class names from being
   shadowed by generated utilities (it is a TOP-LEVEL option — inside
   `content` it is invalid and triggers the purge/content warning).    */
export default {
  content: ['./*.html', './topics/*.html', './js/quiz.js'],
  blocklist: ['container', 'collapse', 'resize', 'filter', 'transform',
              'table', 'ring', 'summary', 'content', 'order', 'grow', 'shrink'],
  theme: {
    screens: { sm: '640px', md: '900px', lg: '1200px' },
    extend: {
      fontFamily: {
        // multi-word family names MUST carry their own quotes: Tailwind joins
        // this array raw, and an unquoted multi-word ident with digits or
        // spaces is an invalid declaration that browsers DROP.
        title: ['fot-yuruka-std', 'G8321', '"Hiragino Maru Gothic ProN"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans:  ['G8321', '"Hiragino Maru Gothic ProN"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        ui:    ['G8321', '"Hiragino Maru Gothic ProN"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace']
      }
    }
  }
};
````

### `topics/charges.html` (35.3 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Electric charge, Coulomb's law and electric field direction — interactive tutorial with a Coulomb force bench and an electric field line explorer.">
  <meta name="theme-color" content="#060b16">
  <title>Topic 1 · Electric charges &amp; fields — EMC Lab</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="../css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="../css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="../vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="../index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="../index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="../quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap wrap-narrow section-tight topic-head">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Topic 1</span>
      </nav>
      <svg class="mascot mascot-sm" aria-hidden="true" viewBox="0 0 120 112">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
      <span class="eyebrow" style="margin-top:.45rem">Topic 1 of 4</span>
      <h1 class="h-topic" style="margin:.4rem 0 .35rem">Electric charges &amp; electric fields</h1>
      <p class="lede">
        Charge is the property of matter that makes it feel the electromagnetic force.
        Charges create <strong>electric fields</strong> in the space around them, and those
        fields push on every other charge. Everything in electromagnetics — circuits, motors,
        generators — follows from that one idea.
      </p>

      <div class="card mt-4">
        <h2 class="h-sub" style="margin-top:0">Learning objectives</h2>
        <ul class="objectives">
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>State Coulomb’s law and calculate the force between two point charges.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Predict whether a force is attractive or repulsive from the signs of the charges.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Define the electric field as force per unit charge and give its units.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Draw and interpret electric field lines for single charges, dipoles and like charges.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Apply superposition to find the net field of several charges.</span></li>
        </ul>
      </div>
    </div>

    <hr class="hr">

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="charge">1.1 · Positive and negative charge</h2>
      <p>
        Matter contains two kinds of charge, named <strong>positive</strong> and
        <strong>negative</strong> by Benjamin Franklin. The rule that governs everything is
        simple:
      </p>
      <div class="callout callout-key">
        <div class="callout-title">The fundamental rule</div>
        <p><strong>Like charges repel. Unlike charges attract.</strong></p>
      </div>
      <p>
        Charge is carried by particles. The <strong>proton</strong> carries
        +e = +1.602×10<sup>−19</sup> C and the <strong>electron</strong> carries −e. Charge is
        <strong>quantised</strong> — every observable charge is an integer multiple of e —
        and it is <strong>conserved</strong>: rubbing a glass rod with silk does not create
        charge, it moves electrons from the glass to the silk, leaving equal and opposite
        amounts behind.
      </p>

      <dl class="defs">
        <div><dt>Conductor</dt><dd>A material with charges free to move (metals, salt water, your body). Excess charge on a conductor spreads out over its surface.</dd></div>
        <div><dt>Insulator</dt><dd>A material whose charges are bound in place (rubber, glass, dry air, plastic). Charge stays where you put it.</dd></div>
        <div><dt>Charging by friction</dt><dd>Contact plus rubbing transfers electrons; the material higher on the triboelectric series loses them and ends up positive.</dd></div>
        <div><dt>Charging by induction</dt><dd>Bringing a charged object <em>near</em> a conductor redistributes its charges without touching it. Earth the conductor and the redistribution becomes permanent.</dd></div>
      </dl>

      <details class="dig dig-real">
        <summary>Real world</summary>
        <div class="dig-body">
        <p>
          The spark you get from a door handle after walking on carpet is a few thousand volts
          driving charge across a millimetre of air. Lightning is the same process at
          kilometre scale: collisions between ice particles separate charge inside a storm
          cloud until the field exceeds about <strong>3×10<sup>6</sup> V/m</strong>, the breakdown
          strength of air.
        </p>
        </div>
      </details>

      <h2 class="h-sec" id="coulomb">1.2 · Coulomb’s law</h2>
      <p>
        In 1785 Charles-Augustin de Coulomb measured the force between small charged spheres
        with a torsion balance and found an inverse-square law that looks exactly like
        Newton’s law of gravitation — but roughly 10<sup>36</sup> times stronger, and able to repel as
        well as attract.
      </p>

      <div class="formula">
        <span class="eq" data-display data-tex="F = k\,\dfrac{|q_1 q_2|}{r^2}">F = k · |q<sub>1</sub> q<sub>2</sub>| / r<sup>2</sup></span>
        <span class="eq" data-display data-tex="k = \dfrac{1}{4\pi\varepsilon_0} = 8.988\times 10^{9}\ \mathrm{N\,m^2/C^2}" style="font-size:.95rem">k = 1/(4πε<sub>0</sub>) = 8.988×10<sup>9</sup> N·m<sup>2</sup>/C<sup>2</sup></span>
        <span class="where">F in newtons · q in coulombs · r = centre-to-centre separation in metres</span>
      </div>

      <p>Three things to notice about this equation:</p>
      <ol>
        <li><strong>It is an inverse-square law.</strong> Double r and F drops to a quarter; triple r and it drops to a ninth.</li>
        <li><strong>The magnitude uses |q<sub>1</sub>q<sub>2</sub>|</strong>, so F is never negative. The <em>signs</em> of the charges only tell you the direction: like signs repel, unlike signs attract.</li>
        <li><strong>The two forces are a Newton’s-third-law pair.</strong> The force q<sub>1</sub> exerts on q<sub>2</sub> is equal in magnitude and opposite in direction to the force q<sub>2</sub> exerts on q<sub>1</sub> — even if one charge is a thousand times bigger.</li>
      </ol>

      <div class="callout callout-key">
        <div class="callout-title">Worked example</div>
        <p>
          Charges q<sub>1</sub> = +3 µC and q<sub>2</sub> = −2 µC sit 0.30 m apart in air. Find the force.
        </p>
        <p class="mono small">
          F = (8.988×10<sup>9</sup>)(3×10<sup>−6</sup>)(2×10<sup>−6</sup>) / (0.30)<sup>2</sup><br>
          &nbsp;&nbsp;= (8.988×10<sup>9</sup>)(6×10<sup>−12</sup>) / 0.09 = 5.39×10<sup>−2</sup> / 0.09 = <b>0.60 N</b>
        </p>
        <p>
          The signs are opposite, so the force is <strong>attractive</strong>: each charge is
          pulled toward the other with 0.60 N. Notice how large that is — 0.60 N is the weight
          of a 60 g apple, produced by charges you could never hold in your hand.
        </p>
      </div>

      <details class="dig dig-trap">
        <summary>Common mistake</summary>
        <div class="dig-body">
        <p>
          Coulomb’s law in this form applies to <strong>point charges</strong> (or to uniform
          spheres, where r is measured centre to centre). For an extended, irregular charged
          object you must integrate over its charge distribution — that is where calculus
          enters this topic.
        </p>
        </div>
      </details>

      <h3 class="h-sub">Superposition</h3>
      <p>
        With three or more charges, each pair interacts independently. The net force on any
        one charge is the <strong>vector sum</strong> of the individual forces:
      </p>
      <div class="formula"><span class="eq" data-display data-tex="\vec{F}_{\mathrm{net}} = \vec{F}_1 + \vec{F}_2 + \vec{F}_3 + \dots">F<sub>net</sub> = F<sub>1</sub> + F<sub>2</sub> + F<sub>3</sub> + …</span><span class="where">add as vectors (components), not as magnitudes</span></div>

      <h2 class="h-sec" id="field">1.3 · The electric field and its direction</h2>
      <p>
        Rather than thinking of charges reaching across empty space, physics says each charge
        modifies the space around it, creating an <strong>electric field E</strong>. A second
        charge then feels a force because of the field <em>at its own location</em>. The field
        is defined operationally by the force on a small positive test charge q<sub>0</sub>:
      </p>
      <div class="formula">
        <span class="eq" data-display data-tex="E = \dfrac{F}{q_0}">E = F / q<sub>0</sub></span>
        <span class="eq" data-display data-tex="E = \dfrac{kq}{r^2}" style="font-size:1rem">point charge:&nbsp; E = k·q / r<sup>2</sup></span>
        <span class="where">Units: N/C, which is identical to V/m</span>
      </div>

      <div class="callout callout-key">
        <div class="callout-title">The direction rule</div>
        <p>
          <strong>E points in the direction a positive test charge would be pushed.</strong>
          So the field of a positive charge points <strong>radially outward</strong>, and the
          field of a negative charge points <strong>radially inward</strong>.
        </p>
      </div>

      <figure class="fig">
        <div class="fig-box">
          <svg viewBox="0 0 460 200" width="460" height="200" role="img"
               aria-label="Field arrows radiate outward from a positive charge and inward toward a negative charge">
            <defs>
              <marker id="arw" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 z" fill="#22d3ee"/>
              </marker>
            </defs>
            <g stroke="#22d3ee" stroke-width="1.9" fill="none" marker-end="url(#arw)">
              <line x1="139" y1="100" x2="171" y2="100"/><line x1="132" y1="117" x2="154" y2="139"/>
              <line x1="115" y1="124" x2="115" y2="156"/><line x1="98" y1="117" x2="76" y2="139"/>
              <line x1="91" y1="100" x2="59" y2="100"/><line x1="98" y1="83" x2="76" y2="61"/>
              <line x1="115" y1="76" x2="115" y2="44"/><line x1="132" y1="83" x2="154" y2="61"/>
            </g>
            <circle cx="115" cy="100" r="19" fill="#fb7185" stroke="#fff" stroke-opacity=".5"/>
            <path d="M106 100h18M115 91v18" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <text x="115" y="185" fill="#fda4af" font-size="13" font-family="monospace" text-anchor="middle">+q : field points OUT</text>

            <g stroke="#22d3ee" stroke-width="1.9" fill="none" marker-end="url(#arw)">
              <line x1="403" y1="100" x2="371" y2="100"/><line x1="386" y1="139" x2="364" y2="117"/>
              <line x1="345" y1="156" x2="345" y2="124"/><line x1="304" y1="139" x2="326" y2="117"/>
              <line x1="287" y1="100" x2="319" y2="100"/><line x1="304" y1="61" x2="326" y2="83"/>
              <line x1="345" y1="44" x2="345" y2="76"/><line x1="386" y1="61" x2="364" y2="83"/>
            </g>
            <circle cx="345" cy="100" r="19" fill="#38bdf8" stroke="#fff" stroke-opacity=".5"/>
            <path d="M336 100h18" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <text x="345" y="185" fill="#7dd3fc" font-size="13" font-family="monospace" text-anchor="middle">−q : field points IN</text>
          </svg>
        </div>
        <figcaption>Figure 1 — The direction convention: arrows show the force on a positive test charge.</figcaption>
      </figure>

      <h3 class="h-sub">Field-line rules</h3>
      <ul>
        <li>Lines <strong>start on positive</strong> charge and <strong>end on negative</strong> charge (or go off to infinity).</li>
        <li>Lines <strong>never cross</strong> — if they did, the field at that point would have two directions.</li>
        <li>The <strong>density</strong> of lines represents field strength: closer together means stronger.</li>
        <li>The <strong>tangent</strong> to a line at any point is the direction of E there.</li>
        <li>The number of lines leaving a charge is <strong>proportional to |q|</strong>, which is why a +2q charge gets twice as many lines as a +q charge.</li>
      </ul>

      <div class="callout callout-key">
        <div class="callout-title">Worked example — field of a point charge</div>
        <p>Find E at a point 0.20 m from a +5 µC charge, and the force on an electron placed there.</p>
        <p class="mono small">
          E = kq/r<sup>2</sup> = (8.988×10<sup>9</sup>)(5×10<sup>−6</sup>)/(0.20)<sup>2</sup> = 4.49×10<sup>4</sup> / 0.04 = <b>1.12×10<sup>6</sup> N/C</b>, directed away from the charge.<br>
          F = qE = (1.602×10<sup>−19</sup>)(1.12×10<sup>6</sup>) = <b>1.80×10<sup>−13</sup> N</b> — toward the charge, because the electron is negative.
        </p>
      </div>

      <h3 class="h-sub">The uniform field: parallel plates</h3>
      <p>
        Between two large oppositely charged parallel plates the field is essentially uniform
        — same magnitude and direction everywhere — which makes it the workhorse of
        electrostatics:
      </p>
      <div class="formula"><span class="eq" data-display data-tex="E = \dfrac{V}{d}">E = V / d</span><span class="where">V = potential difference between the plates, d = their separation</span></div>
      <p>
        A 5000 V supply across plates 2 cm apart gives E = 5000/0.02 = 2.5×10<sup>5</sup> V/m. Inside a
        uniform field a charge experiences a <em>constant</em> force, so its motion is exactly
        the projectile motion you already know — with qE/m in place of g.
      </p>

      <details class="dig dig-real">
        <summary>Real world</summary>
        <div class="dig-body">
        <p>
          <strong>Laser printers and photocopiers</strong> steer charged toner with electric
          fields. <strong>Inkjet printers</strong> charge each droplet and deflect it between
          charged plates. <strong>Electrostatic precipitators</strong> in power stations charge
          smoke particles and collect them on plates, removing over 99% of the ash. The
          <strong>cathode-ray tube</strong> in an old television is a pure demonstration of
          F = qE deflecting electrons.
        </p>
        </div>
      </details>

      <details class="dig dig-trap">
        <summary>Three misconceptions to avoid</summary>
        <div class="dig-body">
        <p>1. “A bigger charge feels a bigger force, so it accelerates more.” No — a = F/m; the field is a property of space, independent of the test charge.</p>
        <p>2. “Field lines are the paths charges follow.” They are not. A charge released in a curved field moves along a trajectory determined by its velocity <em>and</em> the force, which generally is not the field line.</p>
        <p>3. “E = 0 means no charge is there.” It means the vector sum cancels — between two like charges there is a null point where the fields are equal and opposite.</p>
        </div>
      </details>

      <h2 class="h-sec" id="sim-coulomb-panel" style="scroll-margin-top:5rem">1.4 · Simulation — Coulomb’s law bench</h2>
      <p>
        Change either charge or drag them apart. The arrows show the force on each charge:
        notice that they are always equal and opposite, and that doubling the separation makes
        them visibly shorter by the inverse-square rule.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot"></span> Coulomb’s law bench</h3>
          <p class="panel-sub">F = k·|q<sub>1</sub>q<sub>2</sub>|/r<sup>2</sup> · drag the charges</p>
          <div class="panel-actions">
            <button class="btn btn-sm" type="button" data-coul-preset="1,1,0.30">+1 µC / +1 µC</button>
            <button class="btn btn-sm" type="button" data-coul-preset="3,-2,0.30">Dipole</button>
            <button class="btn btn-sm" type="button" data-coul-preset="5,5,0.10">Strong repulsion</button>
            <button class="btn btn-sm" type="button" data-coul-preset="1,-1,1.00">Far apart</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-coulomb" class="sim-canvas grab" role="img"
                    aria-label="Two draggable point charges showing the Coulomb force between them"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f8aebe"></i> positive charge</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> negative charge</span>
              <span><i class="swatch" style="background:#b5d777"></i> attractive force</span>
              <span><i class="swatch" style="background:#f8aebe"></i> repulsive force</span>
              <span><i class="swatch" style="background:#f6d36b"></i> net field at the midpoint</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">q<sub>1</sub></span> first charge</span>
                <span class="ctl-value" id="coul-q1v">+3.0 µC</span>
                <input class="range ctl-range" type="range" id="coul-q1" min="-20" max="20" step="0.5" value="3" aria-label="Charge q1 in microcoulombs">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">q<sub>2</sub></span> second charge</span>
                <span class="ctl-value" id="coul-q2v">−2.0 µC</span>
                <input class="range ctl-range" type="range" id="coul-q2" min="-20" max="20" step="0.5" value="-2" aria-label="Charge q2 in microcoulombs">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">r</span> separation</span>
                <span class="ctl-value" id="coul-rv">0.300 m</span>
                <input class="range ctl-range" type="range" id="coul-r" min="0.02" max="1" step="0.001" value="0.3" aria-label="Separation in metres">
                <span class="ctl-hint">Tip: drag a charge on the canvas instead of using this slider.</span>
              </div>
              <label class="ctl" style="grid-template-columns:auto 1fr;cursor:pointer">
                <input type="checkbox" id="coul-showE" checked style="accent-color:#f6d36b">
                <span class="ctl-label" style="font-size:.86rem">Show the net field at the midpoint</span>
              </label>
            </div>

            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">|F| on each charge</span><span class="stat-value hl-cyan" id="coul-force">—</span></div>
              <div class="stat"><span class="stat-label">Nature of the force</span><span class="stat-value" id="coul-nature">—</span><span class="stat-sub" id="coul-nature-sub"></span></div>
              <div class="stat"><span class="stat-label">|E| at midpoint</span><span class="stat-value hl-amber" id="coul-emid">—</span></div>
            </div>
            <p class="sim-note mt-3 mono" id="coul-substitution" style="overflow-wrap:anywhere">—</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="sim-efield-panel" style="scroll-margin-top:5rem">1.5 · Simulation — electric field explorer</h2>
      <p>
        Build any charge configuration you like. The canvas traces real field lines by
        integrating <strong>a small step ds along Ê(P)</strong> from each positive charge, and can also show a
        vector grid coloured by field strength. Hover anywhere to read the field magnitude and
        the force on a +1 nC test charge at that point.
      </p>
      <p>
        Try the <strong>dipole</strong> preset and look for the curved lines that sweep from the
        positive to the negative charge. Then try <strong>two like charges</strong> and hunt for
        the null point exactly between them, where the field is zero and no line can pass.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#f8aebe"></span> Electric field explorer</h3>
          <p class="panel-sub">superposition of point-charge fields</p>
          <div class="panel-actions">
            <div class="seg" id="ef-brush" role="group" aria-label="Tool">
              <button class="seg-btn" type="button" data-value="move" aria-pressed="true">Move</button>
              <button class="seg-btn" type="button" data-value="add+" aria-pressed="false">+ charge</button>
              <button class="seg-btn" type="button" data-value="add-" aria-pressed="false">− charge</button>
              <button class="seg-btn" type="button" data-value="erase" aria-pressed="false">Erase</button>
            </div>
            <button class="btn btn-sm btn-danger" type="button" id="ef-clear">Clear all</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-efield" class="sim-canvas tall" role="img"
                    aria-label="Interactive electric field lines and vectors for user-placed charges"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f8aebe"></i> positive</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> negative</span>
              <span><i class="swatch" style="background:#cfe9f2"></i> field line / vector</span>
              <span><i class="swatch" style="background:#f6d36b"></i> force on the +1 nC probe</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div>
                <span class="ctl-label" style="margin-bottom:.35rem">Display mode</span>
                <div class="seg" id="ef-mode" role="group" aria-label="Display mode">
                  <button class="seg-btn" type="button" data-value="lines" aria-pressed="false">Lines</button>
                  <button class="seg-btn" type="button" data-value="vectors" aria-pressed="false">Vectors</button>
                  <button class="seg-btn" type="button" data-value="both" aria-pressed="true">Both</button>
                </div>
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">|q|</span> size of a new charge</span>
                <span class="ctl-value" id="ef-sizev">3.0 µC</span>
                <input class="range ctl-range" type="range" id="ef-size" min="1" max="10" step="0.5" value="3" aria-label="Magnitude of newly placed charges">
              </div>
              <div>
                <span class="ctl-label" style="margin-bottom:.35rem">Presets</span>
                <div class="btn-group">
                  <button class="btn btn-sm" type="button" data-ef-preset="single-pos">Single +</button>
                  <button class="btn btn-sm" type="button" data-ef-preset="single-neg">Single −</button>
                  <button class="btn btn-sm" type="button" data-ef-preset="dipole">Dipole</button>
                  <button class="btn btn-sm" type="button" data-ef-preset="like">Two like</button>
                  <button class="btn btn-sm" type="button" data-ef-preset="unequal">+8 / −2 µC</button>
                  <button class="btn btn-sm" type="button" data-ef-preset="quad">Quadrupole</button>
                </div>
              </div>
              <p class="sim-note" id="ef-hint">Drag charges to move them. The field updates live.</p>
            </div>

            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">Charges</span><span class="stat-value" id="ef-count">2</span></div>
              <div class="stat"><span class="stat-label">Net charge</span><span class="stat-value" id="ef-net">0.0 µC</span></div>
              <div class="stat"><span class="stat-label">|E| at probe</span><span class="stat-value hl-cyan" id="ef-emag">hover the field</span></div>
              <div class="stat"><span class="stat-label">Direction</span><span class="stat-value" id="ef-edir">hover the field</span></div>
              <div class="stat"><span class="stat-label">F on +1 nC</span><span class="stat-value hl-amber" id="ef-force">hover the field</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="check">1.6 · Check your understanding</h2>
      <p>Think first, then click to reveal the answer.</p>

      <details class="check">
        <summary>Two identical spheres carry +6 µC and −2 µC. They are touched together and then separated. What does each carry afterwards?</summary>
        <div class="answer"><b>+2 µC each.</b> Charge is conserved and, because the spheres are identical, it shares equally: (6 − 2)/2 = +2 µC. The force between them afterwards is repulsive.</div>
      </details>
      <details class="check">
        <summary>The separation between two point charges is tripled. By what factor does the force change?</summary>
        <div class="answer"><b>It becomes 1/9 of the original.</b> F is proportional to 1/r<sup>2</sup>, so 3<sup>2</sup> = 9 in the denominator.</div>
      </details>
      <details class="check">
        <summary>Can an electric field line ever form a closed loop?</summary>
        <div class="answer"><b>No — not for electrostatic fields.</b> Field lines begin on positive charge and end on negative charge. (Magnetic field lines <em>do</em> form closed loops, because there are no magnetic monopoles — that contrast is the subject of Topic 3.)</div>
      </details>
      <details class="check">
        <summary>An electron is released from rest in a uniform field of 2.0×10<sup>4</sup> N/C pointing to the right. Which way does it accelerate, and how fast?</summary>
        <div class="answer"><b>To the left, at 3.5×10<sup>15</sup> m/s<sup>2</sup>.</b> F = |q|E = (1.602×10<sup>−19</sup>)(2.0×10<sup>4</sup>) = 3.2×10<sup>−15</sup> N, opposite to E because the charge is negative. a = F/m = 3.2×10<sup>−15</sup> / 9.109×10<sup>−31</sup> = 3.5×10<sup>15</sup> m/s<sup>2</sup>.</div>
      </details>
      <details class="check">
        <summary>Why does a charged balloon stick to a neutral wall?</summary>
        <div class="answer"><b>Polarisation (charging by induction).</b> The balloon’s charge pushes like charges in the wall’s surface atoms slightly away and pulls opposite charges slightly closer. The nearer opposite charge wins because the field is stronger at shorter distance, giving a net attraction.</div>
      </details>

      <div class="card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Finished with Topic 1?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Mark it complete to update your progress ring on the home page.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="charges" aria-pressed="false">Mark topic as complete</button>
            <a class="btn" href="../quiz.html">Quiz this topic</a>
          </div>
        </div>
      </div>

      <nav class="pager" aria-label="Topic navigation">
        <a href="../index.html"><span class="dir">← Back</span><span class="ttl">Home</span></a>
        <a class="next" href="current.html"><span class="dir">Next topic →</span><span class="ttl">2 · Current electricity</span></a>
      </nav>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">Topic 1 of 4.</p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="charges.html">1 · Charges &amp; fields</a></li>
          <li><a href="current.html">2 · Current electricity</a></li>
          <li><a href="magnetism.html">3 · Magnetism</a></li>
          <li><a href="induction.html">4 · Electromagnetic induction</a></li>
          <li><a href="../quiz.html">Quiz</a></li>
        </ul>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">On this page</h3>
        <ul class="footer-links">
          <li><a href="#charge">1.1 Charge</a></li>
          <li><a href="#coulomb">1.2 Coulomb’s law</a></li>
          <li><a href="#field">1.3 Electric field</a></li>
          <li><a href="#sim-coulomb-panel">1.4 Coulomb bench</a></li>
          <li><a href="#sim-efield-panel">1.5 Field explorer</a></li>
          <li><a href="#check">1.6 Check your understanding</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">© <span data-year>2026</span> EMC Lab</p>
    </div>
  </footer>

  <script defer src="../vendor/katex/katex.min.js"></script>
  <script defer src="../js/common.js"></script>
  <script defer src="../js/sim-coulomb.js"></script>
  <script defer src="../js/sim-efield.js"></script>
</body>
</html>
````

### `topics/current.html` (35.1 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Ohm's law, series and parallel circuits and equivalent resistance — with an interactive Ohm's law simulator and a circuit builder.">
  <meta name="theme-color" content="#060b16">
  <title>Topic 2 · Current electricity — EMC Lab</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="../css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="../css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="../vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="../index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="../index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="../quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap wrap-narrow section-tight topic-head">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Topic 2</span>
      </nav>
      <svg class="mascot mascot-sm" aria-hidden="true" viewBox="0 0 120 112">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
      <span class="eyebrow eyebrow-amber" style="margin-top:.45rem">Topic 2 of 4</span>
      <h1 class="h-topic" style="margin:.4rem 0 .35rem">Current electricity</h1>
      <p class="lede">
        Topic 1 dealt with charges at rest. Now let them move. A steady flow of charge is a
        <strong>current</strong>, and the three quantities that describe any simple circuit —
        voltage, current and resistance — are tied together by the most useful equation in
        electrical engineering.
      </p>

      <div class="card mt-4">
        <h2 class="h-sub" style="margin-top:0">Learning objectives</h2>
        <ul class="objectives">
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Define current, potential difference and resistance, and state their SI units.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Apply V = IR and P = IV to find any unknown in a component.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Reduce a series, parallel or combination network to a single equivalent resistance.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>State which quantity is shared in series and which in parallel, and why.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Calculate the current in, voltage across and power of every element in a circuit.</span></li>
        </ul>
      </div>
    </div>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="quantities">2.1 · Current, voltage and resistance</h2>
      <dl class="defs">
        <div><dt>Current I — the rate of flow of charge</dt><dd>I = ΔQ/Δt, measured in <strong>amperes</strong> (A). One ampere is one coulomb passing a point every second, about 6.24×10<sup>18</sup> electrons per second.</dd></div>
        <div><dt>Potential difference V — energy per unit charge</dt><dd>V = W/Q, measured in <strong>volts</strong> (V). One volt means one joule of energy transferred per coulomb that passes. A battery is a charge pump that gives each coulomb a fixed amount of energy.</dd></div>
        <div><dt>Resistance R — how much a component opposes current</dt><dd>R = V/I, measured in <strong>ohms</strong> (Ω). For a uniform wire R = ρL/A: longer and thinner wires resist more.</dd></div>
      </dl>

      <details class="dig dig-trap">
        <summary>Conventional current vs electron flow</summary>
        <div class="dig-body">
        <p>
          Electrons in a metal drift from the negative terminal to the positive one — and very
          slowly, typically fractions of a millimetre per second. <strong>Conventional current</strong>
          is defined the other way round (positive charge moving + → −), a convention that
          predates the discovery of the electron. All circuit analysis uses conventional
          current. The <em>signal</em>, by contrast, travels at a substantial fraction of the
          speed of light, which is why a lamp lights instantly even though no individual
          electron travels from the switch.
        </p>
        </div>
      </details>

      <h2 class="h-sec" id="ohm">2.2 · Ohm’s law</h2>
      <div class="formula">
        <span class="eq" data-display data-tex="V = IR">V = I · R</span>
        <span class="eq" data-display data-tex="I = \dfrac{V}{R}, \quad R = \dfrac{V}{I}" style="font-size:1.05rem">I = V/R &nbsp;·&nbsp; R = V/I</span>
        <span class="where">V in volts · I in amperes · R in ohms</span>
      </div>
      <p>
        Strictly, <strong>Ohm’s law is a property of some materials, not a universal law</strong>.
        An <em>ohmic</em> conductor (a metal resistor at constant temperature) keeps R constant,
        so its I–V graph is a straight line through the origin with gradient 1/R. A filament lamp,
        a diode and a transistor are <em>non-ohmic</em>: their I–V graphs curve. V = IR still
        defines the resistance at any one point, but R is no longer a constant.
      </p>

      <h3 class="h-sub">Electrical power</h3>
      <div class="formula">
        <span class="eq" data-display data-tex="P = VI = I^2 R = \dfrac{V^2}{R}">P = V·I = I<sup>2</sup>R = V<sup>2</sup>/R</span>
        <span class="where">P in watts (W) = joules per second</span>
      </div>
      <p>
        The three forms are the same equation with V = IR substituted in. Choose whichever uses
        the quantities you know: <strong>I<sup>2</sup>R</strong> is best for series circuits (same current),
        <strong>V<sup>2</sup>/R</strong> for parallel ones (same voltage).
      </p>

      <div class="callout callout-key">
        <div class="callout-title">Worked example</div>
        <p>A 12 V battery drives 3 A through a resistor. Find R and the power dissipated.</p>
        <p class="mono small">R = V/I = 12/3 = <b>4 Ω</b> &nbsp;&nbsp; P = VI = 12 × 3 = <b>36 W</b> &nbsp;&nbsp; check: I<sup>2</sup>R = 9 × 4 = 36 W ✓</p>
      </div>

      <h2 class="h-sec" id="networks">2.3 · Series and parallel circuits</h2>
      <figure class="fig">
        <div class="fig-box">
          <svg viewBox="0 0 560 210" width="560" height="210" role="img"
               aria-label="Left: two resistors in series on one path. Right: two resistors in parallel on separate branches.">
            <g stroke="#5b7299" stroke-width="2.5" fill="none">
              <!-- SERIES -->
              <path d="M40 40 H250 V170 H40 Z"/>
              <!-- PARALLEL -->
              <path d="M310 40 H520 V170 H310 Z"/>
            </g>
            <!-- batteries -->
            <g stroke="#e8eefb" stroke-width="2.5" stroke-linecap="round">
              <path d="M26 90h28M33 102h14"/><path d="M296 90h28M303 102h14"/>
            </g>
            <text x="14" y="130" fill="#fcd34d" font-size="12" font-family="monospace">V</text>
            <text x="284" y="130" fill="#fcd34d" font-size="12" font-family="monospace">V</text>

            <!-- series resistors -->
            <g stroke="#e2e8f0" stroke-width="2.4" fill="none">
              <path d="M85 40h6l5-11 10 22 10-22 10 22 10-22 5 11h6"/>
              <path d="M185 40h6l5-11 10 22 10-22 10 22 10-22 5 11h6"/>
            </g>
            <text x="110" y="18" fill="#a5f3fc" font-size="12" font-family="monospace" text-anchor="middle">R1</text>
            <text x="210" y="18" fill="#a5f3fc" font-size="12" font-family="monospace" text-anchor="middle">R2</text>
            <text x="145" y="196" fill="#a9bad6" font-size="12.5" font-family="sans-serif" text-anchor="middle" font-weight="700">SERIES — one path, same current</text>

            <!-- parallel resistors -->
            <g stroke="#e2e8f0" stroke-width="2.4" fill="none">
              <path d="M380 60v6l-11 5 22 10-22 10 22 10-22 10 11 5v6"/>
              <path d="M460 60v6l-11 5 22 10-22 10 22 10-22 10 11 5v6"/>
            </g>
            <text x="352" y="108" fill="#a5f3fc" font-size="12" font-family="monospace" text-anchor="middle">R1</text>
            <text x="492" y="108" fill="#a5f3fc" font-size="12" font-family="monospace" text-anchor="middle">R2</text>
            <circle cx="380" cy="40" r="3.4" fill="#93a7c8"/><circle cx="460" cy="40" r="3.4" fill="#93a7c8"/>
            <circle cx="380" cy="170" r="3.4" fill="#93a7c8"/><circle cx="460" cy="170" r="3.4" fill="#93a7c8"/>
            <text x="415" y="196" fill="#a9bad6" font-size="12.5" font-family="sans-serif" text-anchor="middle" font-weight="700">PARALLEL — many paths, same voltage</text>
          </svg>
        </div>
        <figcaption>Figure 1 — Series shares the current; parallel shares the voltage.</figcaption>
      </figure>

      <h3 class="h-sub">Series rules</h3>
      <ul>
        <li>The <strong>same current</strong> flows through every component — there is nowhere else for the charge to go (Kirchhoff’s current law).</li>
        <li>Voltages <strong>add up</strong> to the supply: V = V<sub>1</sub> + V<sub>2</sub> + … (Kirchhoff’s voltage law).</li>
        <li>Resistances add: <strong>R<sub>eq</sub> = R<sub>1</sub> + R<sub>2</sub> + …</strong> — always bigger than the largest resistor.</li>
        <li>The voltage divides in proportion to R: the biggest resistor takes the biggest share.</li>
      </ul>

      <h3 class="h-sub">Parallel rules</h3>
      <ul>
        <li>Every branch is connected directly across the supply, so the <strong>same voltage</strong> appears across each.</li>
        <li>Currents <strong>add up</strong>: I = I<sub>1</sub> + I<sub>2</sub> + …</li>
        <li>Conductances add: <strong>1/R<sub>eq</sub> = 1/R<sub>1</sub> + 1/R<sub>2</sub> + …</strong> — always smaller than the smallest branch.</li>
        <li>For just two resistors the shortcut <strong>R<sub>eq</sub> = R<sub>1</sub>R<sub>2</sub>/(R<sub>1</sub>+R<sub>2</sub>)</strong> is faster. Equal resistors in parallel give R/n.</li>
        <li>Current divides <em>inversely</em> with R: the smallest resistor carries the most current.</li>
      </ul>

      <div class="callout callout-key">
        <div class="callout-title">Worked examples</div>
        <p><strong>Series.</strong> 4 Ω, 6 Ω and 10 Ω in series across 20 V.</p>
        <p class="mono small">R<sub>eq</sub> = 4+6+10 = 20 Ω · I = 20/20 = <b>1 A</b> · V drops = 4 V, 6 V, 10 V (sum = 20 V ✓) · P = 20 W</p>
        <p><strong>Parallel.</strong> 6 Ω and 3 Ω across 12 V.</p>
        <p class="mono small">R<sub>eq</sub> = (6×3)/(6+3) = 2 Ω · I = 12/2 = <b>6 A</b> · branch currents 12/6 = 2 A and 12/3 = 4 A (sum = 6 A ✓)</p>
        <p><strong>Combination.</strong> 4 Ω in series with (6 Ω ∥ 12 Ω), across 24 V.</p>
        <p class="mono small">R<sub>p</sub> = (6×12)/(6+12) = 4 Ω · R<sub>eq</sub> = 4+4 = 8 Ω · I = 24/8 = <b>3 A</b> · V across the 4 Ω = 12 V, V across the pair = 12 V · branch currents 2 A and 1 A ✓</p>
      </div>

      <h3 class="h-sub">The general strategy</h3>
      <ol>
        <li>Find the parts of the network that are purely series or purely parallel and reduce them.</li>
        <li>Redraw the simpler circuit and repeat until one equivalent resistance remains.</li>
        <li>Use I = V/R<sub>eq</sub> to get the total current from the supply.</li>
        <li><strong>Work back outwards</strong>, splitting the current and voltage at each step you undid.</li>
      </ol>

      <details class="dig dig-real">
        <summary>Real world</summary>
        <div class="dig-body">
        <p>
          <strong>House wiring is parallel.</strong> Every socket and lamp sees the full mains
          voltage, and switching one appliance on does not dim the others. If your home were
          wired in series, turning off one lamp would break the circuit for the whole house.
        </p>
        <p>
          <strong>Fuses and breakers</strong> exploit the fact that adding parallel loads lowers
          R<sub>eq</sub> and therefore raises the total current. P = I<sup>2</sup>R heating in the cables
          grows with I<sup>2</sup>, so a 13 A fuse protects a ring main from the fire that 40 A would cause.
        </p>
        <p>
          <strong>Old-style Christmas lights</strong> were wired in series: one failed bulb broke
          the whole string, and each bulb saw only a fraction of the mains voltage. Modern strings
          are parallel or use shunted bulbs for exactly this reason.
        </p>
        </div>
      </details>

      <details class="dig dig-trap">
        <summary>Common misconceptions</summary>
        <div class="dig-body">
        <p>1. “Current is used up by the bulb.” No — the same current flows out as in; what is used up is <em>energy</em> (the charge loses potential energy, which becomes light and heat).</p>
        <p>2. “A bigger resistor takes more current.” In series the current is the same everywhere; a bigger resistor takes a bigger <em>voltage</em>. In parallel a bigger resistor takes <em>less</em> current.</p>
        <p>3. “Adding a resistor always increases the resistance.” True in series, false in parallel — an extra parallel path always lowers R<sub>eq</sub>.</p>
        </div>
      </details>

      <h2 class="h-sec" id="sim-ohm-panel" style="scroll-margin-top:5rem">2.4 · Simulation — Ohm’s law bench</h2>
      <p>
        Move the voltage and resistance sliders and watch the current respond. The ammeter
        auto-ranges like a real meter, the bulb brightens with dissipated power, and the chart
        plots the I–V characteristic — the straight line whose gradient is 1/R. Push the power
        past the resistor’s rating to see the safety warning that real engineers have to respect.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#f6d36b"></span> Ohm’s law simulator</h3>
          <p class="panel-sub">I = V / R · P = VI</p>
          <div class="panel-actions">
            <button class="btn btn-sm" type="button" data-ohm-preset="9,22">9 V · 22 Ω</button>
            <button class="btn btn-sm" type="button" data-ohm-preset="12,4">12 V · 4 Ω</button>
            <button class="btn btn-sm" type="button" data-ohm-preset="5,1000">5 V · 1 kΩ</button>
            <button class="btn btn-sm" type="button" data-ohm-preset="24,2">24 V · 2 Ω</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-ohm" class="sim-canvas" role="img"
                    aria-label="Circuit with a battery, resistor, bulb and analogue ammeter showing Ohm's law"></canvas>
            <canvas id="sim-ohm-chart" class="sim-canvas chart" role="img"
                    aria-label="Current against voltage characteristic, a straight line with gradient 1 over R"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f6d36b"></i> conventional current</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> electron flow</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> I–V line (gradient 1/R)</span>
              <span><i class="swatch" style="background:#d5b8d8"></i> 2R reference</span>
              <span><i class="swatch" style="background:#b5d777"></i> R/2 reference</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">V</span> supply voltage</span>
                <span class="ctl-value" id="ohm-Vv">9.0 V</span>
                <input class="range ctl-range" type="range" id="ohm-V" min="0" max="24" step="0.1" value="9" aria-label="Voltage in volts">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">R</span> resistance <span class="tiny faint">(log scale)</span></span>
                <span class="ctl-value" id="ohm-Rv">22.0 Ω</span>
                <input class="range ctl-range" type="range" id="ohm-R" min="0" max="1000" step="0.1" value="447.5" aria-label="Resistance, logarithmic scale">
                <span class="ctl-hint">or type an exact value:
                  <input class="inp" type="number" id="ohm-Rnum" min="0.1" step="0.1" value="22" style="width:7rem;display:inline-block;margin-left:.35rem" aria-label="Exact resistance in ohms"> Ω
                </span>
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">P<sub>rated</sub></span> resistor rating</span>
                <span class="ctl-value" id="ohm-ratedv">0.50 W</span>
                <input class="range ctl-range" type="range" id="ohm-rated" min="0.05" max="5" step="0.05" value="0.5" aria-label="Resistor power rating in watts">
              </div>
              <label class="ctl" style="grid-template-columns:auto 1fr;cursor:pointer">
                <input type="checkbox" id="ohm-electrons" style="accent-color:#f6d36b">
                <span class="ctl-label" style="font-size:.86rem">Show electron flow instead of conventional current</span>
              </label>
            </div>

            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">Current I</span><span class="stat-value hl-cyan" id="ohm-I">—</span><span class="stat-sub" id="ohm-ImA">—</span></div>
              <div class="stat"><span class="stat-label">Power P</span><span class="stat-value hl-amber" id="ohm-P">—</span></div>
              <div class="stat"><span class="stat-label">Meter range</span><span class="stat-value" id="ohm-range">—</span></div>
            </div>
            <p class="sim-note mt-3 mono" id="ohm-sub" style="overflow-wrap:anywhere">—</p>
            <div class="callout callout-warn" id="ohm-warn" hidden style="margin-top:.75rem"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="sim-circuit-panel" style="scroll-margin-top:5rem">2.5 · Simulation — circuit builder</h2>
      <p>
        Build a real circuit. Choose a topology, add or delete resistors, and change any value.
        The simulator solves the network exactly, prints the equivalent-resistance working, and
        animates charge flow with a dot density proportional to the current in each branch — so
        you can <em>see</em> the current splitting unevenly in a parallel bank.
      </p>
      <p>
        Click any resistor on the canvas to select and edit it. The bulb is modelled as an
        ordinary resistor in series with the bank; switch it off to study the resistor network
        on its own.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#f6d36b"></span> Circuit builder</h3>
          <p class="panel-sub">series · parallel · combination</p>
          <div class="panel-actions">
            <div class="seg" id="circ-topology" role="group" aria-label="Circuit topology">
              <button class="seg-btn" type="button" data-value="series" aria-pressed="true">Series</button>
              <button class="seg-btn" type="button" data-value="parallel" aria-pressed="false">Parallel</button>
              <button class="seg-btn" type="button" data-value="combo" aria-pressed="false">Series–parallel</button>
            </div>
            <button class="btn btn-sm" type="button" id="circ-add">+ Add resistor</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-circuit" class="sim-canvas tall" role="img"
                    aria-label="Interactive circuit with a battery, bulb and resistors arranged in the selected topology"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f6d36b"></i> moving charge (density scales with current)</span>
              <span><i class="swatch" style="background:#e2e8f0"></i> resistor</span>
              <span><i class="swatch" style="background:#f6d36b"></i> bulb (glow scales with power)</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">V</span> battery</span>
                <span class="ctl-value" id="circ-Vv">12.0 V</span>
                <input class="range ctl-range" type="range" id="circ-V" min="1" max="24" step="0.5" value="12" aria-label="Battery voltage">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">R<sub>bulb</sub></span> bulb resistance</span>
                <span class="ctl-value" id="circ-bulbv">15 Ω</span>
                <input class="range ctl-range" type="range" id="circ-bulbR" min="1" max="100" step="1" value="15" aria-label="Bulb resistance in ohms">
              </div>
              <label class="ctl" style="grid-template-columns:auto 1fr;cursor:pointer">
                <input type="checkbox" id="circ-includeBulb" checked style="accent-color:#f6d36b">
                <span class="ctl-label" style="font-size:.86rem">Include the bulb in the circuit</span>
              </label>
              <div>
                <span class="ctl-label" style="margin-bottom:.4rem">Resistors <span class="tiny faint">(click one on the canvas to select it)</span></span>
                <div class="row-list" id="circ-rows"><!-- rows injected by js/sim-circuit.js --></div>
              </div>
            </div>
          </div>
        </div>

        <!-- full-width instrument row: keeps the two columns balanced -->
        <div class="panel-body" style="border-top:1px solid var(--line)">
          <div class="readouts">
            <div class="stat"><span class="stat-label">R of the bank</span><span class="stat-value hl-emerald" id="circ-req">—</span></div>
            <div class="stat"><span class="stat-label">R total</span><span class="stat-value" id="circ-rtotal">—</span></div>
            <div class="stat"><span class="stat-label">Total current</span><span class="stat-value hl-cyan" id="circ-itotal">—</span></div>
            <div class="stat"><span class="stat-label">V across bank</span><span class="stat-value hl-amber" id="circ-vbank">—</span></div>
            <div class="stat"><span class="stat-label">V across bulb</span><span class="stat-value" id="circ-vbulb">—</span></div>
            <div class="stat"><span class="stat-label">Bulb power</span><span class="stat-value" id="circ-pbulb">—</span></div>
            <div class="stat"><span class="stat-label">Supply power</span><span class="stat-value" id="circ-ptotal">—</span></div>
          </div>

          <p class="sim-note mt-3 mono" id="circ-breakdown" style="overflow-wrap:anywhere">—</p>
          <p class="sim-note mt-2" id="circ-rule" style="border-left-color:#fbbf24;background:rgba(251,191,36,.07)">—</p>

          <div class="table-scroll mt-4">
            <table class="data">
              <caption class="tiny faint" style="caption-side:top;text-align:left;padding:.4rem .2rem">Every element solved for V, I and P</caption>
              <thead><tr><th>Element</th><th>R (Ω)</th><th>V (V)</th><th>I (A)</th><th>P (W)</th></tr></thead>
              <tbody id="circ-table"></tbody>
            </table>
          </div>

          <!-- predict-then-run: the simulator itself grades the prediction -->
          <div class="panel-body challenge" style="border-top:1.5px solid var(--line)">
            <div class="flex flex-wrap items-start gap-4 justify-between">
              <div style="flex:1 1 320px">
                <span class="tag tag-amber">Predict, then run</span>
                <p class="q-prompt mt-2" id="circ-chal-text">—</p>
                <p class="tiny faint" style="margin-top:.4rem">Answer from the rules first — then press “Try it” and watch the readouts confirm it.</p>
              </div>
              <div style="flex:1 1 260px">
                <div class="btn-group" id="circ-chal-opts" role="group" aria-label="Your prediction"></div>
                <div class="btn-group mt-2">
                  <button class="btn btn-sm" id="circ-chal-try" type="button" hidden>Try it on the circuit</button>
                  <button class="btn btn-sm btn-ghost" id="circ-chal-new" type="button">New prediction</button>
                </div>
                <div class="feedback is-hidden mt-2" id="circ-chal-fb" role="status"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="check">2.6 · Check your understanding</h2>

      <details class="check">
        <summary>Three 9 Ω resistors are available. What is the largest and the smallest equivalent resistance you can make using all three?</summary>
        <div class="answer"><b>Largest 27 Ω</b> (all in series: 9+9+9). <b>Smallest 3 Ω</b> (all in parallel: 9/3). Any combination lies between those two limits.</div>
      </details>
      <details class="check">
        <summary>A 60 W lamp is rated for 230 V. What is its operating resistance and current?</summary>
        <div class="answer"><b>I = P/V = 60/230 = 0.26 A</b> and <b>R = V<sup>2</sup>/P = 230<sup>2</sup>/60 = 882 Ω</b>. Measured cold with a multimeter it reads only about 60 Ω — the filament’s resistance rises more than tenfold as it heats up, which is why lamps usually fail at switch-on.</div>
      </details>
      <details class="check">
        <summary>Two resistors, 20 Ω and 30 Ω, are in parallel across a 12 V battery. Find the total current.</summary>
        <div class="answer"><b>1.0 A.</b> R<sub>eq</sub> = (20×30)/(20+30) = 600/50 = 12 Ω, so I = 12/12 = 1.0 A. Check by branches: 12/20 = 0.6 A and 12/30 = 0.4 A, total 1.0 A ✓.</div>
      </details>
      <details class="check">
        <summary>In the circuit builder, switch from series to parallel without changing any resistor. What happens to the bulb?</summary>
        <div class="answer"><b>It gets much brighter.</b> Parallel reduces R<sub>eq</sub>, which increases the total current, and the bulb’s power P = I<sup>2</sup>R<sub>bulb</sub> grows with the square of that current.</div>
      </details>
      <details class="check">
        <summary>Why does a voltmeter have a very high resistance while an ammeter has a very low one?</summary>
        <div class="answer">A <b>voltmeter is connected in parallel</b> and must draw almost no current, or it would change the voltage it is measuring. An <b>ammeter is connected in series</b> and must add almost no resistance, or it would reduce the current it is measuring. Both are about not disturbing the circuit under test.</div>
      </details>

      <div class="card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Finished with Topic 2?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Next: magnetic fields and the force on a moving charge.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="current" aria-pressed="false">Mark topic as complete</button>
            <a class="btn" href="../quiz.html">Quiz this topic</a>
          </div>
        </div>
      </div>

      <nav class="pager" aria-label="Topic navigation">
        <a href="charges.html"><span class="dir">← Previous</span><span class="ttl">1 · Electric charges &amp; fields</span></a>
        <a class="next" href="magnetism.html"><span class="dir">Next topic →</span><span class="ttl">3 · Magnetism</span></a>
      </nav>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">Topic 2 of 4.</p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="charges.html">1 · Charges &amp; fields</a></li>
          <li><a href="current.html">2 · Current electricity</a></li>
          <li><a href="magnetism.html">3 · Magnetism</a></li>
          <li><a href="induction.html">4 · Electromagnetic induction</a></li>
          <li><a href="../quiz.html">Quiz</a></li>
        </ul>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">On this page</h3>
        <ul class="footer-links">
          <li><a href="#quantities">2.1 Current, voltage, resistance</a></li>
          <li><a href="#ohm">2.2 Ohm’s law and power</a></li>
          <li><a href="#networks">2.3 Series and parallel</a></li>
          <li><a href="#sim-ohm-panel">2.4 Ohm’s law simulator</a></li>
          <li><a href="#sim-circuit-panel">2.5 Circuit builder</a></li>
          <li><a href="#check">2.6 Check your understanding</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">© <span data-year>2026</span> EMC Lab</p>
    </div>
  </footer>

  <script defer src="../vendor/katex/katex.min.js"></script>
  <script defer src="../js/common.js"></script>
  <script defer src="../js/sim-ohm.js"></script>
  <script defer src="../js/sim-circuit.js"></script>
</body>
</html>
````

### `topics/induction.html` (40.6 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Faraday's law, Lenz's law and magnetic flux — with an exact simulation of a magnet moving through a coil, a galvanometer and a live EMF chart.">
  <meta name="theme-color" content="#060b16">
  <title>Topic 4 · Electromagnetic induction — EMC Lab</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="../css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="../css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="../vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="../index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="../index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="../quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap wrap-narrow section-tight topic-head">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Topic 4</span>
      </nav>
      <svg class="mascot mascot-sm" aria-hidden="true" viewBox="0 0 120 112">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
      <span class="eyebrow" style="margin-top:.45rem">Topic 4 of 4</span>
      <h1 class="h-topic" style="margin:.4rem 0 .35rem">Electromagnetic induction</h1>
      <p class="lede">
        In 1831 Michael Faraday discovered that a <strong>changing</strong> magnetic field
        creates an electric field — and therefore a voltage in a wire. That single discovery
        is the reason almost every joule of electrical energy on Earth exists: generators,
        transformers, wireless chargers, induction hobs and guitar pickups all run on it.
      </p>

      <div class="card mt-4">
        <h2 class="h-sub" style="margin-top:0">Learning objectives</h2>
        <ul class="objectives">
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Define magnetic flux Φ = BA cosθ and state its unit.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Apply Faraday’s law EMF = −N·dΦ/dt to calculate an induced voltage.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>List the three ways to change the flux through a coil.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Use Lenz’s law to predict the direction of an induced current.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Explain Lenz’s law as a statement of conservation of energy.</span></li>
        </ul>
      </div>
    </div>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="flux">4.1 · Magnetic flux</h2>
      <p>
        Flux measures how much magnetic field <em>threads</em> a loop. It depends on the field
        strength, the area of the loop, and the orientation between them:
      </p>
      <div class="formula">
        <span class="eq" data-display data-tex="\Phi = B A \cos\theta">Φ = B · A · cosθ</span>
        <span class="eq" data-display data-tex="\Phi = \int \vec{B}\cdot d\vec{A}" style="font-size:1rem">general form: Φ = ∫ B · dA</span>
        <span class="where">Φ in webers (Wb) = T·m<sup>2</sup> · θ is the angle between B and the <b>normal</b> to the loop</span>
      </div>

      <figure class="fig">
        <div class="fig-box">
          <svg viewBox="0 0 520 200" width="520" height="200" role="img"
               aria-label="Magnetic flux through a loop is maximum when the field is perpendicular to the loop's plane and zero when it lies in the plane">
            <defs><marker id="fa" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L7 3 L0 6 z" fill="#a78bfa"/></marker></defs>
            <!-- maximum flux: B perpendicular to the plane of the loop -->
            <g transform="translate(110,100)">
              <ellipse rx="26" ry="58" fill="rgba(34,211,238,.10)" stroke="#22d3ee" stroke-width="2.4"/>
              <g stroke="#a78bfa" stroke-width="1.8" marker-end="url(#fa)">
                <line x1="-62" y1="-30" x2="56" y2="-30"/>
                <line x1="-62" y1="30" x2="56" y2="30"/>
              </g>
              <line x1="0" y1="0" x2="74" y2="0" stroke="#34d399" stroke-width="1.8" stroke-dasharray="5 3"/>
              <text x="44" y="-9" fill="#6ee7b7" font-size="11.5" font-family="monospace" text-anchor="middle">normal A</text>
              <text x="0" y="88" fill="#a5f3fc" font-size="12.5" font-family="monospace" text-anchor="middle">θ = 0° → Φ = BA (maximum)</text>
              <text x="0" y="-72" fill="#c4b5fd" font-size="11.5" font-family="monospace" text-anchor="middle">B</text>
            </g>
            <!-- zero flux: B lies in the plane of the loop -->
            <g transform="translate(380,100)">
              <ellipse rx="26" ry="58" fill="rgba(34,211,238,.10)" stroke="#22d3ee" stroke-width="2.4"/>
              <g stroke="#a78bfa" stroke-width="1.8" marker-end="url(#fa)">
                <line x1="-16" y1="-84" x2="-16" y2="78"/>
                <line x1="16" y1="-84" x2="16" y2="78"/>
              </g>
              <line x1="0" y1="0" x2="74" y2="0" stroke="#34d399" stroke-width="1.8" stroke-dasharray="5 3"/>
              <text x="44" y="-9" fill="#6ee7b7" font-size="11.5" font-family="monospace" text-anchor="middle">normal A</text>
              <text x="0" y="88" fill="#a5f3fc" font-size="12.5" font-family="monospace" text-anchor="middle">θ = 90° → Φ = 0</text>
              <text x="-16" y="-92" fill="#c4b5fd" font-size="11.5" font-family="monospace" text-anchor="middle">B</text>
            </g>
          </svg>
        </div>
        <figcaption>Figure 1 — Flux counts the field passing <em>through</em> the loop, so it depends on orientation.</figcaption>
      </figure>

      <p>
        A loop of area 0.02 m<sup>2</sup> in a 0.5 T field has Φ = 0.01 Wb when the field is perpendicular
        to its plane, and <strong>zero</strong> when the field lies in the plane — even though
        the field is just as strong. Rotate the loop and the flux changes.
      </p>

      <h2 class="h-sec" id="faraday">4.2 · Faraday’s law</h2>
      <div class="formula">
        <span class="eq" data-display data-tex="\mathcal{E} = -N\,\dfrac{d\Phi}{dt}">EMF = − N · dΦ/dt</span>
        <span class="where">N = number of turns · EMF in volts · Φ in webers · t in seconds</span>
      </div>
      <p>
        The induced EMF is proportional to the <strong>rate of change</strong> of flux linkage —
        not to the flux itself. A huge but constant flux induces nothing at all. There are
        exactly three ways to change Φ = BA cosθ:
      </p>
      <ol>
        <li><strong>Change B</strong> — move a magnet toward or away from the coil, or vary the current in a nearby electromagnet.</li>
        <li><strong>Change A</strong> — stretch, squash or slide the loop so the enclosed area changes.</li>
        <li><strong>Change θ</strong> — rotate the coil in the field. This is what every generator does.</li>
      </ol>

      <div class="callout callout-key">
        <div class="callout-title">Worked example 1 — changing B</div>
        <p>A 200-turn coil of area 0.010 m<sup>2</sup> sits perpendicular to a field that rises from 0 to 0.5 T in 0.20 s.</p>
        <p class="mono small">dΦ/dt = A·dB/dt = 0.010 × (0.5/0.20) = 0.025 Wb/s<br>EMF = N·dΦ/dt = 200 × 0.025 = <b>5.0 V</b></p>
      </div>

      <div class="callout callout-key">
        <div class="callout-title">Worked example 2 — rotating a coil (an AC generator)</div>
        <p>A coil of N turns and area A rotates at angular frequency ω in a field B, so θ = ωt:</p>
        <p class="mono small">
          Φ = BA cos(ωt) &nbsp;→&nbsp; EMF = −N dΦ/dt = <b>NBAω sin(ωt)</b><br>
          peak EMF = NBAω. With N = 100, B = 0.5 T, A = 0.02 m<sup>2</sup>, f = 50 Hz (ω = 314 rad/s):<br>
          peak = 100 × 0.5 × 0.02 × 314 = <b>314 V</b>
        </p>
        <p>
          That is a mains-sized voltage, produced by a hand-sized coil spinning 50 times a second.
          The output is <strong>sinusoidal and alternating</strong> — which is why the grid carries AC.
        </p>
      </div>

      <h3 class="h-sub">Motional EMF</h3>
      <p>
        A rod of length L sliding at speed v perpendicular to a field B has its free charges
        deflected by F = qvB until the electric field they set up balances the magnetic one.
        The result is a voltage across the rod:
      </p>
      <div class="formula"><span class="eq" data-display data-tex="\mathcal{E} = B L v">EMF = B L v</span><span class="where">a 0.20 m rod at 3 m/s in 0.5 T gives 0.30 V</span></div>
      <p>
        If the rod completes a circuit of resistance R, the current is I = BLv/R and the magnetic
        force on that current is F = BIL = B<sup>2</sup>L<sup>2</sup>v/R, opposing the motion. The mechanical power you
        supply, Fv = B<sup>2</sup>L<sup>2</sup>v<sup>2</sup>/R, is exactly the electrical power I<sup>2</sup>R dissipated in the resistor —
        energy conservation is built into the equations.
      </p>

      <h2 class="h-sec" id="lenz">4.3 · Lenz’s law and the minus sign</h2>
      <p>
        The negative sign in Faraday’s law is not a formality; it is a complete physical statement
        known as <strong>Lenz’s law</strong>:
      </p>
      <div class="callout callout-key">
        <div class="callout-title">Lenz’s law</div>
        <p>
          The induced current flows in such a direction that its own magnetic field
          <strong>opposes the change in flux that produced it</strong>.
        </p>
      </div>
      <p>Note carefully: it opposes the <em>change</em>, not the flux itself.</p>

      <figure class="fig">
        <div class="fig-box">
          <svg viewBox="0 0 620 210" width="620" height="210" role="img"
               aria-label="Left: a magnet approaching a coil induces a current that repels it. Right: a magnet leaving induces a current that attracts it.">
            <defs><marker id="la" markerWidth="9" markerHeight="9" refX="7" refY="3.2" orient="auto"><path d="M0 0 L8 3.2 L0 6.4 z" fill="#fbbf24"/></marker></defs>

            <g transform="translate(0,0)">
              <!-- coil -->
              <ellipse cx="200" cy="80" rx="17" ry="46" fill="none" stroke="#cbd5e1" stroke-width="2.6"/>
              <ellipse cx="212" cy="80" rx="17" ry="46" fill="none" stroke="#cbd5e1" stroke-width="2.6"/>
              <!-- current symbols: into page at top, out at bottom (CW seen from +x) -->
              <g stroke="#e8eefb" stroke-width="1.6" fill="none">
                <circle cx="206" cy="34" r="5"/><path d="M202.6 30.6l6.8 6.8M209.4 30.6l-6.8 6.8"/>
                <circle cx="206" cy="126" r="5"/>
              </g>
              <circle cx="206" cy="126" r="1.9" fill="#e8eefb" stroke="none"/>
              <!-- magnet approaching -->
              <rect x="60" y="66" width="46" height="28" rx="3" fill="#0369a1"/>
              <rect x="106" y="66" width="46" height="28" rx="3" fill="#be123c"/>
              <text x="83" y="86" fill="#fff" font-size="14" font-weight="800" font-family="sans-serif" text-anchor="middle">S</text>
              <text x="129" y="86" fill="#fff" font-size="14" font-weight="800" font-family="sans-serif" text-anchor="middle">N</text>
              <line x1="22" y1="80" x2="52" y2="80" stroke="#34d399" stroke-width="3" marker-end="url(#la)"/>
              <text x="37" y="66" fill="#6ee7b7" font-size="11" font-family="monospace" text-anchor="middle">v</text>
              <text x="150" y="150" fill="#fcd34d" font-size="12" font-family="monospace" text-anchor="middle">flux ↑ → coil face becomes N → REPELS</text>
              <text x="150" y="172" fill="#a9bad6" font-size="12.5" font-family="sans-serif" text-anchor="middle" font-weight="700">APPROACHING</text>
            </g>

            <g transform="translate(330,0)">
              <ellipse cx="120" cy="80" rx="17" ry="46" fill="none" stroke="#cbd5e1" stroke-width="2.6"/>
              <ellipse cx="132" cy="80" rx="17" ry="46" fill="none" stroke="#cbd5e1" stroke-width="2.6"/>
              <!-- current symbols: out of page at top, into page at bottom (CCW seen from +x) -->
              <g stroke="#e8eefb" stroke-width="1.6" fill="none">
                <circle cx="126" cy="34" r="5"/>
                <circle cx="126" cy="126" r="5"/><path d="M122.6 122.6l6.8 6.8M129.4 122.6l-6.8 6.8"/>
              </g>
              <circle cx="126" cy="34" r="1.9" fill="#e8eefb" stroke="none"/>
              <rect x="186" y="66" width="46" height="28" rx="3" fill="#0369a1"/>
              <rect x="232" y="66" width="46" height="28" rx="3" fill="#be123c"/>
              <text x="209" y="86" fill="#fff" font-size="14" font-weight="800" font-family="sans-serif" text-anchor="middle">S</text>
              <text x="255" y="86" fill="#fff" font-size="14" font-weight="800" font-family="sans-serif" text-anchor="middle">N</text>
              <line x1="278" y1="80" x2="308" y2="80" stroke="#34d399" stroke-width="3" marker-end="url(#la)"/>
              <text x="292" y="66" fill="#6ee7b7" font-size="11" font-family="monospace" text-anchor="middle">v</text>
              <text x="150" y="150" fill="#fcd34d" font-size="12" font-family="monospace" text-anchor="middle">flux ↓ → coil face becomes S → ATTRACTS</text>
              <text x="150" y="172" fill="#a9bad6" font-size="12.5" font-family="sans-serif" text-anchor="middle" font-weight="700">RECEDING</text>
            </g>
          </svg>
        </div>
        <figcaption>
          Figure 2 — Lenz’s law in both directions. Circles with a dot mean current coming out of the page;
          circles with a cross mean current going into the page.
        </figcaption>
      </figure>

      <div class="callout callout-warn">
        <div class="callout-title">Why Lenz’s law must be true</div>
        <p>
          Suppose the induced current <em>helped</em> the change instead of opposing it. The
          magnet would accelerate, increasing the flux faster, driving a bigger current, which
          would pull the magnet harder still — energy from nowhere. Lenz’s law is
          <strong>conservation of energy</strong> applied to induction: the electrical energy
          dissipated as I<sup>2</sup>R heat is paid for by the mechanical work you do against the magnetic
          opposition. If you stop pushing, the current stops immediately.
        </p>
      </div>

      <div class="callout callout-key">
        <div class="callout-title">The three-step recipe for finding a direction</div>
        <p><strong>1.</strong> Is the flux through the loop increasing or decreasing? <strong>2.</strong> The induced field must oppose that change — so it points opposite to B if the flux is rising, and along B if it is falling. <strong>3.</strong> Curl your right-hand fingers around the loop in the current direction; your thumb then points along the induced field. That fixes the current direction.</p>
      </div>

      <details class="dig dig-real">
        <summary>Real world</summary>
        <div class="dig-body">
        <p>
          <strong>Generators</strong> rotate a coil in a field (change θ) — a 1 GW turbine is
          Faraday’s law at industrial scale. <strong>Transformers</strong> use a changing current
          in the primary to create a changing flux in an iron core, inducing a voltage in the
          secondary; the turns ratio sets the voltage ratio, which is why the grid can transmit at
          400 kV and deliver at 230 V.
        </p>
        <p>
          <strong>Induction hobs</strong> drive 20–50 kHz AC through a coil, inducing eddy currents
          that heat the pan directly — the glass stays cool. <strong>Wireless phone chargers</strong>
          are small transformers with an air gap. <strong>Eddy-current brakes</strong> slow trains and
          fairground drop towers with no contact and no wear. <strong>Guitar pickups</strong> have a
          magnet inside a coil; a vibrating steel string changes the flux and generates the signal.
          <strong>Airport security and metal detectors</strong> look for the eddy currents induced in
          metal objects.
        </p>
        </div>
      </details>

      <h2 class="h-sec" id="sim-induction-panel" style="scroll-margin-top:5rem">4.4 · Simulation — a magnet through a coil</h2>
      <p>
        This is the experiment Faraday actually performed. The coil’s flux is computed from the
        exact on-axis dipole result
        <span class="mono">Φ = μ<sub>0</sub>ma<sup>2</sup>/[2(a<sup>2</sup>+z<sup>2</sup>)<sup>3/2</sup>]</span>,
        then differentiated with respect to time to give the EMF — no approximation and no
        hand-drawn curve. Drag the magnet yourself, or let the simulator push it through at a set
        speed, or oscillate it to make AC.
      </p>
      <p>
        Watch the chart as the magnet passes through: the EMF shows <strong>two opposite peaks
        with a zero crossing at the centre</strong>, because the flux is greatest (and momentarily
        unchanging) exactly when the magnet is in the middle of the coil.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot"></span> Magnet through a coil</h3>
          <p class="panel-sub">EMF = −N·dΦ/dt · drag the magnet or use a preset motion</p>
          <div class="panel-actions">
            <div class="btn-group" role="group" aria-label="Magnet motion">
              <button class="btn btn-sm" type="button" data-ind-mode="push" aria-pressed="false">Push through →</button>
              <button class="btn btn-sm" type="button" data-ind-mode="pull" aria-pressed="false">← Pull back</button>
              <button class="btn btn-sm" type="button" data-ind-mode="oscillate" aria-pressed="false">Oscillate (AC)</button>
              <button class="btn btn-sm" type="button" data-ind-mode="manual" aria-pressed="true">Hold</button>
              <button class="btn btn-sm btn-ghost" type="button" id="ind-reset">Reset</button>
            </div>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-induction" class="sim-canvas tall grab" role="img"
                    aria-label="A bar magnet moving through a coil, with a galvanometer showing the induced current"></canvas>
            <canvas id="sim-induction-chart" class="sim-canvas chart" role="img"
                    aria-label="Strip chart of flux linkage and induced EMF against time"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f8aebe"></i> N pole</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> S pole</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> flux linkage λ = NΦ</span>
              <span><i class="swatch" style="background:#f6d36b"></i> induced EMF</span>
              <span>dot / cross = current out of / into the page</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">N</span> number of turns</span>
                <span class="ctl-value" id="ind-Nv">800 turns</span>
                <input class="range ctl-range" type="range" id="ind-N" min="50" max="2000" step="10" value="800" aria-label="Number of coil turns">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">a</span> coil radius</span>
                <span class="ctl-value" id="ind-av">2.0 cm</span>
                <input class="range ctl-range" type="range" id="ind-a" min="0.5" max="5" step="0.1" value="2" aria-label="Coil radius in centimetres">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">m</span> magnet strength <span class="tiny faint">(log)</span></span>
                <span class="ctl-value" id="ind-mv">0.80 A·m<sup>2</sup></span>
                <input class="range ctl-range" type="range" id="ind-m" min="0" max="1000" step="0.1" value="751" aria-label="Magnet dipole moment">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">R</span> circuit resistance</span>
                <span class="ctl-value" id="ind-Rv">10 Ω</span>
                <input class="range ctl-range" type="range" id="ind-R" min="1" max="200" step="1" value="10" aria-label="Circuit resistance in ohms">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">v</span> auto-move speed</span>
                <span class="ctl-value" id="ind-speedv">0.80 m/s</span>
                <input class="range ctl-range" type="range" id="ind-speed" min="0.1" max="3" step="0.05" value="0.8" aria-label="Automatic magnet speed in metres per second">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">f</span> oscillation frequency</span>
                <span class="ctl-value" id="ind-oscv">1.6 Hz</span>
                <input class="range ctl-range" type="range" id="ind-osc" min="0.2" max="5" step="0.1" value="1.6" aria-label="Oscillation frequency in hertz">
              </div>
              <label class="ctl" style="grid-template-columns:auto 1fr;cursor:pointer">
                <input type="checkbox" id="ind-symbols" checked style="accent-color:#f6d36b">
                <span class="ctl-label" style="font-size:.86rem">Show current-direction symbols (dot / cross) on the winding</span>
              </label>
            </div>

          </div>

        </div>

        <!-- full-width instrument row: keeps the two columns balanced -->
        <div class="panel-body" style="border-top:1px solid var(--line)">
            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">Position z</span><span class="stat-value" id="ind-z">—</span></div>
              <div class="stat"><span class="stat-label">Speed v</span><span class="stat-value" id="ind-v">—</span></div>
              <div class="stat"><span class="stat-label">Φ per turn</span><span class="stat-value hl-cyan" id="ind-phi">—</span></div>
              <div class="stat"><span class="stat-label">λ = NΦ</span><span class="stat-value hl-cyan" id="ind-lambda">—</span></div>
              <div class="stat"><span class="stat-label">dλ/dt</span><span class="stat-value" id="ind-dphi">—</span></div>
              <div class="stat"><span class="stat-label">Induced EMF</span><span class="stat-value hl-amber" id="ind-emf">—</span></div>
              <div class="stat"><span class="stat-label">Current I</span><span class="stat-value hl-emerald" id="ind-I">—</span></div>
              <div class="stat"><span class="stat-label">Power I<sup>2</sup>R</span><span class="stat-value" id="ind-P">—</span></div>
              <div class="stat"><span class="stat-label">Current direction</span><span class="stat-value tight hl-rose" id="ind-dir">—</span></div>
            </div>

            <p class="sim-note mt-3" id="ind-lenz">—</p>
            <p class="tiny faint mt-2">
            The magnet is modelled as a dipole of moment m on the coil axis, so the flux is the
            standard closed-form result Φ = μ<sub>0</sub>ma<sup>2</sup>/[2(a<sup>2</sup>+z<sup>2</sup>)^{3/2}] and dΦ/dt is evaluated
            analytically. Typical values here are tens to hundreds of millivolts — the same order
            as a real classroom demonstration.
          </p>

          <!-- predict-then-run: the simulator itself grades the prediction -->
          <div class="panel-body challenge" style="border-top:1.5px solid var(--line)">
            <div class="flex flex-wrap items-start gap-4 justify-between">
              <div style="flex:1 1 320px">
                <span class="tag tag-cyan">Predict, then run</span>
                <p class="q-prompt mt-2" id="ind-chal-text">—</p>
                <p class="tiny faint" style="margin-top:.4rem">Answer from the rules first — then press “Try it” and watch the readouts confirm it.</p>
              </div>
              <div style="flex:1 1 260px">
                <div class="btn-group" id="ind-chal-opts" role="group" aria-label="Your prediction"></div>
                <div class="btn-group mt-2">
                  <button class="btn btn-sm" id="ind-chal-try" type="button" hidden>Run it on the coil</button>
                  <button class="btn btn-sm btn-ghost" id="ind-chal-new" type="button">New prediction</button>
                </div>
                <div class="feedback is-hidden mt-2" id="ind-chal-fb" role="status"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="sim-generator-panel" style="scroll-margin-top:5rem">4.5 · Bonus lab — the AC generator (p5.js)</h2>
      <p>
        The magnet-through-coil experiment changes flux by moving <strong>B</strong>. A power
        station changes flux by rotating <strong>θ</strong>: a coil of N turns and area A spins
        at frequency f in a steady field, so Φ = NBA·cos(2πft) and therefore
      </p>
      <div class="formula">
        <span class="eq" data-display data-tex="\mathcal{E}(t) = N B A (2\pi f)\,\sin(2\pi f t)">EMF = N·B·A·(2πf)·sin(2πft)</span>
        <span class="where">a pure sine wave — this is why the mains is alternating current</span>
      </div>
      <p>
        This lab is rendered with <strong>p5.js</strong> (the one simulation that uses a library
        rather than the site’s own canvas engine). Watch the coil’s foreshortening follow
        cos θ while the trace on the right draws the sine. Try doubling f: the peak EMF doubles
        <em>and</em> the wave compresses — exactly what a faster turbine does.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#b5d777"></span> AC generator (p5.js)</h3>
          <p class="panel-sub">EMF = N·B·A·ω·sin(ωt) · coil spinning in a uniform field</p>
        </div>
        <div class="sim-grid">
          <div>
            <div id="p5-gen-host" style="width:100%;min-height:340px;background:#0e1116;border-bottom:1px solid var(--line)"></div>
            <div class="legend">
              <span><i class="swatch" style="background:#d5b8d8"></i> uniform field B</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> spinning coil</span>
              <span><i class="swatch" style="background:#f6d36b"></i> EMF(t)</span>
              <span>dot / cross = induced current direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">N</span> turns</span>
                <span class="ctl-value" id="gen-Nv">120 turns</span>
                <input class="range ctl-range" type="range" id="gen-N" min="10" max="500" step="10" value="120" aria-label="Number of turns in the generator coil">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">B</span> field strength</span>
                <span class="ctl-value" id="gen-Bv">0.40 T</span>
                <input class="range ctl-range" type="range" id="gen-B" min="0.05" max="1" step="0.05" value="0.4" aria-label="Magnetic flux density in tesla">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">f</span> rotation frequency</span>
                <span class="ctl-value" id="gen-fv">1.2 Hz</span>
                <input class="range ctl-range" type="range" id="gen-f" min="0.2" max="3" step="0.1" value="1.2" aria-label="Rotation frequency in hertz">
                <span class="ctl-hint">Mains frequency is 50 Hz (Europe) or 60 Hz (North America).</span>
              </div>
            </div>
            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">ω = 2πf</span><span class="stat-value" id="gen-omega">—</span></div>
              <div class="stat"><span class="stat-label">Φ = NBA cos θ</span><span class="stat-value hl-cyan" id="gen-flux">—</span></div>
              <div class="stat"><span class="stat-label">EMF now</span><span class="stat-value hl-amber" id="gen-emf">—</span></div>
              <div class="stat"><span class="stat-label">Peak NBAω</span><span class="stat-value hl-emerald" id="gen-peak">—</span></div>
            </div>
            <p class="sim-note mt-3">
              Area is fixed at A = 0.02 m² (a 14 cm × 14 cm coil). At the defaults the peak is
              N·B·A·ω = 120 × 0.40 × 0.02 × 7.54 ≈ 7.2 V — a bicycle-bottle dynamo lives in exactly
              this range.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="check">4.6 · Check your understanding</h2>

      <details class="check">
        <summary>A 500-turn coil of area 4.0×10<sup>−3</sup> m<sup>2</sup> is perpendicular to a field that falls from 0.80 T to 0.20 T in 0.10 s. Find the induced EMF.</summary>
        <div class="answer"><b>12 V.</b> dΦ/dt = A·dB/dt = 4.0×10<sup>−3</sup> × (0.60/0.10) = 0.024 Wb/s. EMF = N·dΦ/dt = 500 × 0.024 = 12 V.</div>
      </details>
      <details class="check">
        <summary>A magnet is held stationary inside a coil connected to a galvanometer. What does the meter read, and why?</summary>
        <div class="answer"><b>Zero.</b> The flux is large but constant, so dΦ/dt = 0 and EMF = −N·dΦ/dt = 0. Induction requires <em>change</em>. This is why generators must turn and why transformers only work on AC.</div>
      </details>
      <details class="check">
        <summary>You push a magnet into a coil twice as fast. What happens to the EMF, the current and the energy dissipated?</summary>
        <div class="answer"><b>EMF doubles</b> (dΦ/dt doubles), <b>current doubles</b> (I = EMF/R), and <b>power quadruples</b> (P = EMF<sup>2</sup>/R). The energy dissipated per pass <b>doubles</b>: the pass takes half as long but burns four times the power (×4 × ½ = ×2) — equivalently, the magnetic drag force doubles while you push through the same distance. (The total <em>charge</em> per pass is unchanged: Q = ΔΦ/R.) That doubled effort is exactly Lenz’s law demanding payment.</div>
      </details>
      <details class="check">
        <summary>Why does the EMF trace cross zero as the magnet passes through the centre of the coil?</summary>
        <div class="answer">At the centre the flux is at its <b>maximum</b>, and at a maximum the derivative is zero. The flux stops rising and starts falling, so dΦ/dt — and therefore the EMF — passes through zero and reverses sign. The trace has two opposite peaks, one on the way in and one on the way out.</div>
      </details>
      <details class="check">
        <summary>A copper ring is held above a solenoid. When the solenoid’s current is switched on, the ring jumps upward. Explain.</summary>
        <div class="answer">The rising current increases the flux through the ring, inducing a current in it. By Lenz’s law that current opposes the increase, so the ring’s field repels the solenoid’s field and the ring is thrown upward. If the ring has a slit in it, no current can flow and it does not jump — a classic lecture demonstration.</div>
      </details>
      <details class="check">
        <summary>Does the resistance of the coil change the induced EMF? Does it change the induced current?</summary>
        <div class="answer"><b>No to the first, yes to the second.</b> EMF = −N·dΦ/dt depends only on the geometry and the motion. But I = EMF/R, so a lower resistance gives a larger current, more heating and a stronger braking force — which is why eddy-current brakes use thick copper rather than steel.</div>
      </details>

      <div class="card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">That’s all four topics — well done.</h3>
            <p class="small muted" style="margin:.25rem 0 0">Mark Topic 4 complete, then test yourself on all four chapters.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="induction" aria-pressed="false">Mark topic as complete</button>
            <a class="btn btn-amber" href="../quiz.html">Take the full quiz →</a>
          </div>
        </div>
      </div>

      <nav class="pager" aria-label="Topic navigation">
        <a href="magnetism.html"><span class="dir">← Previous</span><span class="ttl">3 · Magnetism</span></a>
        <a class="next" href="../quiz.html"><span class="dir">Next →</span><span class="ttl">25-question quiz</span></a>
      </nav>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">Topic 4 of 4.</p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="charges.html">1 · Charges &amp; fields</a></li>
          <li><a href="current.html">2 · Current electricity</a></li>
          <li><a href="magnetism.html">3 · Magnetism</a></li>
          <li><a href="induction.html">4 · Electromagnetic induction</a></li>
          <li><a href="../quiz.html">Quiz</a></li>
        </ul>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">On this page</h3>
        <ul class="footer-links">
          <li><a href="#flux">4.1 Magnetic flux</a></li>
          <li><a href="#faraday">4.2 Faraday’s law</a></li>
          <li><a href="#lenz">4.3 Lenz’s law</a></li>
          <li><a href="#sim-induction-panel">4.4 Magnet-through-coil sim</a></li>
          <li><a href="#sim-generator-panel">4.5 AC generator (p5.js)</a></li>
          <li><a href="#check">4.6 Check your understanding</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">© <span data-year>2026</span> EMC Lab</p>
    </div>
  </footer>

  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <script defer src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
  <script defer src="../vendor/katex/katex.min.js"></script>
  <script defer src="../js/common.js"></script>
  <script defer src="../js/sim-induction.js"></script>
  <script defer src="../js/sim-generator.js"></script>
</body>
</html>
````

### `topics/magnetism.html` (38.2 KiB)

````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Magnetic field lines, bar magnets and the force on a moving charge — with an interactive field lab and a Lorentz force simulator.">
  <meta name="theme-color" content="#060b16">
  <title>Topic 3 · Magnetism — EMC Lab</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='14' fill='%2317181c'/%3E%3Cellipse cx='24' cy='27' rx='15' ry='14' fill='%23f6f1e5'/%3E%3Cpath d='M15 16 C13 8 19 6 21 12' fill='%23f6f1e5'/%3E%3Cpath d='M33 16 C35 8 29 6 27 12' fill='%23f6f1e5'/%3E%3Ccircle cx='19' cy='26' r='1.8' fill='%232b2d33'/%3E%3Ccircle cx='29' cy='26' r='1.8' fill='%232b2d33'/%3E%3Cpath d='M22 31 q2 2 4 0' stroke='%232b2d33' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
  <script>if (window.tailwind) { tailwind.config = { theme: { extend: { colors: { brand: { DEFAULT: '#22d3ee', deep: '#0e1a2e', line: '#1e2f4d' } } } } }; }</script>
  <link rel="stylesheet" href="../css/site.css">
  <!-- Type: one family site-wide — G8321 (SIL OFL, committed woff2): Thin 100 display numerals, Regular 400 body, Bold 700 headings/UI. Titles try the privately licensed fot-yuruka-std first (local machines only). -->
  <link rel="stylesheet" href="../css/fonts.css">
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-700.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="../vendor/fonts/g8321-400.woff2" crossorigin>
  <!-- KaTeX: the LaTeX formatter for every equation on the page -->
  <link rel="stylesheet" href="../vendor/katex/katex.min.css">
  <style>@media (min-width: 901px){.nav-drop-menu{position:absolute;visibility:hidden;opacity:0}.nav-drop-menu.open{visibility:visible;opacity:1}}</style>
</head>

<body class="emc">
  <a class="skip-link" href="#main">Skip to main content</a>

  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="../index.html" aria-label="EMC Lab — home">
        <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
        <span class="brand-name">EMC<em>Lab</em><span class="brand-sub">Electromagnetics</span></span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      <nav id="navMenu" class="nav-menu" aria-label="Main navigation">
        <a class="nav-link" href="../index.html">Home</a>
        <div class="nav-drop">
          <button class="nav-link nav-drop-btn" id="topicsBtn" type="button"
                  aria-expanded="false" aria-controls="topicsMenu">Topics
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="nav-drop-menu" id="topicsMenu">
            <a class="dd-link" href="charges.html"><b>1 · Charges &amp; Fields</b><small>Coulomb’s law · field lines · superposition</small></a>
            <a class="dd-link" href="current.html"><b>2 · Current</b><small>Ohm’s law · series &amp; parallel</small></a>
            <a class="dd-link" href="magnetism.html"><b>3 · Magnetism</b><small>field lines · F = qv × B</small></a>
            <a class="dd-link" href="induction.html"><b>4 · Induction</b><small>Faraday · Lenz · generators</small></a>
          </div>
        </div>
        <a class="nav-link nav-cta" href="../quiz.html">Take the quiz</a>
      </nav>
    </div>
    <div class="scroll-progress"><i id="readingProgress"></i></div>
  </header>

  <main class="emc-main" id="main">
    <div class="wrap wrap-narrow section-tight topic-head">
      <div class="callout callout-warn" id="storageNotice" role="status" hidden></div>
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Topic 3</span>
      </nav>
      <svg class="mascot mascot-sm" aria-hidden="true" viewBox="0 0 120 112">
  <path d="M38 26 C34 8 46 5 49 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 26 C86 8 74 5 71 16" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="60" cy="64" rx="42" ry="40" fill="#f6f1e5" stroke="#3a3d45" stroke-width="3"/>
  <circle cx="46" cy="58" r="3.6" fill="#2b2d33"/><circle cx="74" cy="58" r="3.6" fill="#2b2d33"/>
  <path d="M55 68 q5 5 10 0" stroke="#2b2d33" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/><circle cx="84" cy="66" r="5.5" fill="#f8aebe" opacity=".85"/>
  <path d="M63 78 l-9 13 h6 l-3 11 11-14 h-6 z" fill="#f6d36b" stroke="#3a3d45" stroke-width="2.2" stroke-linejoin="round"/>
</svg>
      <span class="eyebrow eyebrow-violet" style="margin-top:.45rem">Topic 3 of 4</span>
      <h1 class="h-topic" style="margin:.4rem 0 .35rem">Magnetism</h1>
      <p class="lede">
        Magnetism is what electricity looks like when charges are <strong>moving</strong>. A
        magnet produces a <strong>magnetic field B</strong>, and that field pushes sideways on
        any charge that moves through it — never along its line of motion, which has one
        profound consequence: magnetic forces can bend a path but can never change a speed.
      </p>

      <div class="card mt-4">
        <h2 class="h-sub" style="margin-top:0">Learning objectives</h2>
        <ul class="objectives">
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Describe magnetic field lines and state the rules they obey around a bar magnet.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Explain why magnetic field lines always form closed loops (no monopoles).</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Calculate F = qvB sinθ and determine its direction with the right-hand rule.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Derive r = mv/(|q|B) and T = 2πm/(|q|B) for circular motion in a uniform field.</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Explain why a magnetic field does no work on a charge.</span></li>
        </ul>
      </div>
    </div>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="sources">3.1 · Where magnetism comes from</h2>
      <p>
        Every magnetic field in the universe is produced by <strong>moving electric charge</strong>
        — either a current in a wire, or the motion and intrinsic spin of electrons inside atoms.
        In a permanent magnet, huge numbers of atomic magnetic moments line up in regions called
        <strong>domains</strong>. Heating or hammering a magnet randomises the domains and
        destroys it; that is why there is a Curie temperature above which ferromagnetism vanishes
        (1043 K for iron).
      </p>
      <dl class="defs">
        <div><dt>Magnetic poles</dt><dd>Every magnet has a north-seeking (N) and a south-seeking (S) pole. Like poles repel, unlike poles attract — the same rule as charges.</dd></div>
        <div><dt>No monopoles</dt><dd>Cut a bar magnet in half and you get two smaller magnets, each with its own N and S. No experiment has ever isolated a single magnetic pole, so <strong>magnetic field lines have no beginning and no end</strong>.</dd></div>
        <div><dt>Magnetic flux density B</dt><dd>The strength of the field, measured in <strong>tesla</strong> (T) = N·s/(C·m) = Wb/m<sup>2</sup>. Earth’s field ≈ 50 µT; a fridge magnet ≈ 5 mT; an MRI scanner 1.5–3 T; the strongest laboratory fields ≈ 45 T.</dd></div>
      </dl>

      <h2 class="h-sec" id="lines">3.2 · Magnetic field lines and bar magnets</h2>
      <figure class="fig">
        <div class="fig-box">
          <svg viewBox="0 0 560 235" width="560" height="235" role="img"
               aria-label="A bar magnet with closed field lines leaving the north pole and entering the south pole">
            <defs>
              <marker id="magArrow" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
                <path d="M0 0 L7 3 L0 6 z" fill="#c4b5fd"/>
              </marker>
            </defs>
            <!-- closed loops through both poles -->
            <g fill="none" stroke="#a78bfa" stroke-opacity=".7" stroke-width="1.6">
              <ellipse cx="280" cy="117" rx="100" ry="24"/>
              <ellipse cx="280" cy="117" rx="100" ry="50"/>
              <ellipse cx="280" cy="117" rx="100" ry="78"/>
              <ellipse cx="280" cy="117" rx="100" ry="104"/>
            </g>
            <!-- N -> S direction arrows on the upper half -->
            <g fill="#c4b5fd">
              <path d="M274 93 L284 88.5 L284 97.5 Z"/><path d="M274 67 L284 62.5 L284 71.5 Z"/>
              <path d="M274 39 L284 34.5 L284 43.5 Z"/><path d="M274 13 L284 8.5 L284 17.5 Z"/>
            </g>
            <!-- the magnet -->
            <rect x="180" y="102" width="100" height="30" rx="4" fill="#0369a1"/>
            <rect x="280" y="102" width="100" height="30" rx="4" fill="#be123c"/>
            <rect x="180" y="102" width="200" height="30" rx="4" fill="none" stroke="#fff" stroke-opacity=".35"/>
            <text x="230" y="123" fill="#fff" font-size="17" font-weight="800" font-family="sans-serif" text-anchor="middle">S</text>
            <text x="330" y="123" fill="#fff" font-size="17" font-weight="800" font-family="sans-serif" text-anchor="middle">N</text>
            <!-- inside the magnet the lines run S -> N -->
            <line x1="196" y1="145" x2="364" y2="145" stroke="#6ee7b7" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#magArrow)"/>
            <text x="280" y="162" fill="#6ee7b7" font-size="11.5" font-family="monospace" text-anchor="middle">inside the magnet: S → N (the loop closes)</text>
            <!-- a compass -->
            <g transform="translate(470,52)">
              <circle r="21" fill="#0a1222" stroke="#5b7299" stroke-width="1.6"/>
              <line x1="-13" y1="4" x2="13" y2="-4" stroke="#fb7185" stroke-width="3" stroke-linecap="round"/>
              <line x1="13" y1="-4" x2="4" y2="-1" stroke="#fb7185" stroke-width="3" stroke-linecap="round"/>
              <text y="34" fill="#a9bad6" font-size="10.5" font-family="monospace" text-anchor="middle">compass aligns</text>
              <text y="46" fill="#a9bad6" font-size="10.5" font-family="monospace" text-anchor="middle">with the tangent</text>
            </g>
            <text x="90" y="205" fill="#a9bad6" font-size="11.5" font-family="monospace">lines leave N,</text>
            <text x="90" y="220" fill="#a9bad6" font-size="11.5" font-family="monospace">enter S, never cross</text>
          </svg>
        </div>
        <figcaption>Figure 1 — Field lines outside a bar magnet run N → S and continue through the magnet, forming closed loops.</figcaption>
      </figure>

      <h3 class="h-sub">Field-line rules for magnetism</h3>
      <ul>
        <li>Outside the magnet, lines run from the <strong>north pole to the south pole</strong>.</li>
        <li>Lines are <strong>closed loops</strong> — they continue through the magnet from S to N. This is the difference from electric field lines, which start and stop on charges.</li>
        <li>Lines <strong>never cross</strong>; the field has one direction at each point.</li>
        <li><strong>Closer lines = stronger field.</strong> The field is most intense at the poles, where the lines bunch together.</li>
        <li>The <strong>tangent</strong> to a line is the direction a free north pole (or a compass needle’s north end) would point.</li>
      </ul>

      <details class="dig dig-trap">
        <summary>A naming trap</summary>
        <div class="dig-body">
        <p>
          The “north pole” of a compass needle points toward the geographic North Pole — which
          means the Earth’s <em>magnetic</em> pole near geographic north is actually a
          <strong>south</strong> magnetic pole. Opposite poles attract. Geomagnetic north is
          currently in the Canadian Arctic and drifts about 40 km per year.
        </p>
        </div>
      </details>

      <h2 class="h-sec" id="force">3.3 · Force on a moving charge</h2>
      <p>
        A charge moving through a magnetic field experiences a force perpendicular to both its
        velocity and the field. This is the <strong>magnetic part of the Lorentz force</strong>:
      </p>
      <div class="formula">
        <span class="eq" data-display data-tex="\vec{F} = q\,\vec{v} \times \vec{B}">F = q v × B</span>
        <span class="eq" data-display data-tex="|\vec{F}| = |q|\,v B \sin\theta" style="font-size:1.05rem">|F| = |q| v B sinθ</span>
        <span class="where">θ = the angle between v and B · F in newtons, v in m/s, B in tesla</span>
      </div>
      <ul>
        <li>θ = 0° or 180° (v parallel to B) → <strong>F = 0</strong>. The charge is unaffected.</li>
        <li>θ = 90° (v perpendicular to B) → <strong>F = |q|vB</strong>, the maximum.</li>
        <li>A stationary charge feels <strong>no magnetic force at all</strong>, however strong the field.</li>
        <li>Reversing the sign of q or the direction of B reverses the force.</li>
      </ul>

      <div class="callout callout-key">
        <div class="callout-title">The right-hand rule (for a positive charge)</div>
        <p>
          <strong>Flat right hand:</strong> fingers point along <strong>v</strong>, curl them
          toward <strong>B</strong>; your extended <strong>thumb</strong> points along
          <strong>F</strong>. Equivalent version: index finger = v, middle finger = B, thumb = F,
          all mutually perpendicular.
        </p>
        <p>
          For a <strong>negative</strong> charge (an electron), find the direction with your
          right hand and then <strong>reverse it</strong> — or just use your left hand.
        </p>
      </div>

      <div class="callout callout-key">
        <div class="callout-title">Notation for fields perpendicular to the page</div>
        <p>
          <strong><svg width="15" height="15" viewBox="0 0 15 15" style="vertical-align:-2px" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6.4" fill="none" stroke="#c4b5fd" stroke-width="1.5"/><circle cx="7.5" cy="7.5" r="2.1" fill="#c4b5fd"/></svg> (a dot)</strong> = the vector comes <em>out</em> of the page toward you —
          the tip of an arrow. <strong><svg width="15" height="15" viewBox="0 0 15 15" style="vertical-align:-2px" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6.4" fill="none" stroke="#c4b5fd" stroke-width="1.5"/><path d="M4.4 4.4l6.2 6.2M10.6 4.4l-6.2 6.2" stroke="#c4b5fd" stroke-width="1.5"/></svg> (a cross)</strong> = the vector goes <em>into</em> the
          page — the feathers of an arrow seen from behind.
        </p>
      </div>

      <h3 class="h-sub">Circular motion</h3>
      <p>
        Because F is always perpendicular to v, the magnetic force acts as a centripetal force.
        It changes the <em>direction</em> of the velocity but never its magnitude:
      </p>
      <div class="formula">
        <span class="eq" data-display data-tex="|q| v B = \dfrac{m v^2}{r}">|q|vB = mv<sup>2</sup>/r</span>
        <span class="eq" data-display data-tex="r = \dfrac{mv}{|q|B}" style="font-size:1.05rem">r = mv / (|q|B)</span>
        <span class="eq" data-display data-tex="T = \dfrac{2\pi m}{|q|B}" style="font-size:1.05rem">T = 2πm / (|q|B)</span>
        <span class="where">the period does not depend on speed — faster particles simply travel a wider circle in the same time</span>
      </div>

      <div class="callout callout-key">
        <div class="callout-title">Worked example</div>
        <p>A proton enters a 0.50 T field at 2.0×10<sup>5</sup> m/s, perpendicular to the field. Find the force, radius and period.</p>
        <p class="mono small">
          F = qvB = (1.602×10<sup>−19</sup>)(2.0×10<sup>5</sup>)(0.50) = <b>1.60×10<sup>−14</sup> N</b><br>
          r = mv/(qB) = (1.673×10<sup>−27</sup>)(2.0×10<sup>5</sup>) / (1.602×10<sup>−19</sup> × 0.50) = 3.35×10<sup>−22</sup> / 8.01×10<sup>−20</sup> = <b>4.2 mm</b><br>
          T = 2πm/(qB) = 2π(1.673×10<sup>−27</sup>)/(8.01×10<sup>−20</sup>) = <b>1.31×10<sup>−7</sup> s</b> (131 ns, i.e. f ≈ 7.6 MHz)
        </p>
        <p>
          Replace the proton with an electron at the same speed and the radius shrinks by the mass
          ratio to about <b>2.3 µm</b> — the electron curves the opposite way, and 1836 times more tightly.
        </p>
      </div>

      <div class="callout callout-warn">
        <div class="callout-title">Why no work is done</div>
        <p>
          Power = F·v = |F||v|cos90° = <strong>0</strong>. A magnetic field can never speed a
          charge up or slow it down; it can only steer it. That is why a cyclotron needs an
          <em>electric</em> field to add energy and a <em>magnetic</em> field to keep the beam
          circulating — and it is why the kinetic energy in the Lorentz simulator stays constant.
        </p>
      </div>

      <h3 class="h-sub">Force on a current-carrying wire (the motor effect)</h3>
      <p>
        A wire carries moving charges, so it too feels a force: <strong>F = BIL sinθ</strong>. This
        is the principle of the electric motor — a loop in a field experiences a couple that makes
        it turn. Fleming’s <em>left</em>-hand rule (thumb = motion, first finger = field, second
        finger = current) gives the same answer as the right-hand rule applied to the positive
        charge carriers.
      </p>

      <details class="dig dig-real">
        <summary>Real world</summary>
        <div class="dig-body">
        <p>
          <strong>Mass spectrometers</strong> separate ions by m/q: ions are accelerated, then bent
          in a known field, and r = mv/(qB) tells you the mass. This is how we measure isotopes and
          identify molecules.
        </p>
        <p>
          <strong>The aurora.</strong> Charged particles from the solar wind spiral along Earth’s
          field lines and are funnelled toward the magnetic poles, where they excite oxygen
          (green, 557.7 nm) and nitrogen (red/blue). The same deflection shields the whole planet
          from the solar wind.
        </p>
        <p>
          <strong>MRI scanners</strong> use 1.5–3 T fields to make proton spins precess;
          <strong>particle colliders</strong> use thousands of superconducting dipole magnets to
          bend beams around a 27 km ring; <strong>eddy-current brakes</strong> on trains and
          roller coasters use the same force with no friction and no wear.
        </p>
        </div>
      </details>

      <h2 class="h-sec" id="sim-magnet-panel" style="scroll-margin-top:5rem">3.4 · Simulation — bar magnet field lab</h2>
      <p>
        Four visualisations of the same field: traced field lines, a grid of compass needles, a
        vector grid coloured by strength, and an iron-filings pattern. Drag the magnet anywhere
        and rotate it with the angle slider; hover to measure the flux density at any point and
        compare it with Earth’s 50 µT field.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#d5b8d8"></span> Bar magnet field lab</h3>
          <p class="panel-sub">dipole field model · drag &amp; rotate</p>
          <div class="panel-actions">
            <div class="btn-group" id="mag-toggles" role="group" aria-label="Field display layers">
              <button class="btn btn-sm" type="button" data-toggle="lines" aria-pressed="true">Lines</button>
              <button class="btn btn-sm" type="button" data-toggle="compass" aria-pressed="true">Compasses</button>
              <button class="btn btn-sm" type="button" data-toggle="vectors" aria-pressed="false">Vectors</button>
              <button class="btn btn-sm" type="button" data-toggle="filings" aria-pressed="false">Filings</button>
            </div>
            <button class="btn btn-sm" type="button" id="mag-shuffle">Shake filings</button>
            <button class="btn btn-sm btn-ghost" type="button" id="mag-reset">Reset</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-magnet" class="sim-canvas tall grab" role="img"
                    aria-label="Bar magnet with field lines, compasses, vectors and iron filings"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#f8aebe"></i> north pole</span>
              <span><i class="swatch" style="background:#a8d3e0"></i> south pole</span>
              <span><i class="swatch" style="background:#d5b8d8"></i> field lines</span>
              <span><i class="swatch" style="background:#f6d36b"></i> probe direction</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div class="ctl">
                <span class="ctl-label"><span class="sym">θ</span> magnet angle</span>
                <span class="ctl-value" id="mag-anglev">0°</span>
                <input class="range ctl-range" type="range" id="mag-angle" min="0" max="360" step="1" value="0" aria-label="Magnet rotation in degrees">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">m</span> dipole moment <span class="tiny faint">(log)</span></span>
                <span class="ctl-value" id="mag-mv">0.60 A·m<sup>2</sup></span>
                <input class="range ctl-range" type="range" id="mag-m" min="0" max="1000" step="0.1" value="733" aria-label="Magnetic dipole moment">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">n</span> field lines drawn</span>
                <span class="ctl-value" id="mag-linesv">16 lines</span>
                <input class="range ctl-range" type="range" id="mag-lines" min="6" max="32" step="1" value="16" aria-label="Number of field lines">
              </div>
            </div>

            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">Dipole moment</span><span class="stat-value hl-violet" id="mag-moment">—</span></div>
              <div class="stat"><span class="stat-label">Pole strength q<sub>m</sub></span><span class="stat-value" id="mag-pole">—</span></div>
              <div class="stat"><span class="stat-label">|B| at probe</span><span class="stat-value hl-cyan" id="mag-bprobe">—</span></div>
              <div class="stat"><span class="stat-label">Direction</span><span class="stat-value" id="mag-dir">—</span></div>
            </div>
            <p class="sim-note mt-3" id="mag-bprobe-uT"></p>
            <p class="tiny faint mt-2">
              The field is modelled as two opposite magnetic poles ±q<sub>m</sub> separated by
              6 cm, giving B = (μ<sub>0</sub>/4π)·Σq<sub>m</sub>r̂/r<sup>2</sup>. Real monopoles do not exist — this is
              a drawing model that reproduces the true dipole field accurately outside the magnet.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="sim-lorentz-panel" style="scroll-margin-top:5rem">3.5 · Simulation — the Lorentz force</h2>
      <p>
        Pick a particle, a speed, a field strength and the two directions. The simulator draws
        the exact circular orbit from <strong>r = mv/(|q|B)</strong>, together with the velocity
        and force vectors at every instant. Watch what happens when you flip the charge from a
        proton to an electron, or reverse the field: the sense of rotation reverses, exactly as
        the cross product demands.
      </p>
      <p class="small muted">
        The animation is deliberately slowed down — a real proton in 0.5 T completes an orbit in
        131 ns. The slow-down factor is printed on the canvas.
      </p>
    </section>

    <section class="section-tight wrap wrap-sim">
      <div class="panel reveal">
        <div class="panel-head">
          <h3 class="panel-title"><span class="dot" style="background:#f8aebe"></span> Lorentz force &amp; circular motion</h3>
          <p class="panel-sub">F = q v × B</p>
          <div class="panel-actions">
            <div class="btn-group" id="lor-toggles" role="group" aria-label="Display options">
              <button class="btn btn-sm" type="button" data-toggle="vectors" aria-pressed="true">Vectors</button>
              <button class="btn btn-sm" type="button" data-toggle="path" aria-pressed="true">Orbit</button>
            </div>
            <button class="btn btn-sm" type="button" id="lor-play">Pause</button>
            <button class="btn btn-sm btn-ghost" type="button" id="lor-reset">Restart</button>
          </div>
        </div>
        <div class="sim-grid">
          <div>
            <canvas id="sim-lorentz" class="sim-canvas tall" role="img"
                    aria-label="A charged particle moving in a circle in a uniform magnetic field"></canvas>
            <div class="legend">
              <span><i class="swatch" style="background:#d5b8d8"></i> B field symbols</span>
              <span><i class="swatch" style="background:#b5d777"></i> velocity v</span>
              <span><i class="swatch" style="background:#f8aebe"></i> force F (always perpendicular to v)</span>
              <span><i class="swatch" style="background:#f6d36b"></i> radius to the centre</span>
            </div>
          </div>
          <div class="panel-body">
            <div class="ctl-stack">
              <div>
                <span class="ctl-label" style="margin-bottom:.35rem">Particle</span>
                <div class="seg" id="lor-particle" role="group" aria-label="Particle">
                  <button class="seg-btn" type="button" data-value="proton" aria-pressed="true">Proton</button>
                  <button class="seg-btn" type="button" data-value="electron" aria-pressed="false">Electron</button>
                  <button class="seg-btn" type="button" data-value="alpha" aria-pressed="false">Alpha</button>
                </div>
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">v</span> speed <span class="tiny faint">(log)</span></span>
                <span class="ctl-value" id="lor-vv">200 km/s</span>
                <input class="range ctl-range" type="range" id="lor-v" min="0" max="1000" step="0.1" value="433" aria-label="Particle speed">
              </div>
              <div class="ctl">
                <span class="ctl-label"><span class="sym">B</span> field strength</span>
                <span class="ctl-value" id="lor-Bv">0.50 T</span>
                <input class="range ctl-range" type="range" id="lor-B" min="0.05" max="2" step="0.05" value="0.5" aria-label="Magnetic flux density in tesla">
              </div>
              <div>
                <span class="ctl-label" style="margin-bottom:.35rem">Field direction</span>
                <div class="seg" id="lor-bdir" role="group" aria-label="Magnetic field direction">
                  <button class="seg-btn" type="button" data-value="out" aria-pressed="true">Out of page (toward you)</button>
                  <button class="seg-btn" type="button" data-value="in" aria-pressed="false">Into page (away)</button>
                </div>
              </div>
              <div>
                <span class="ctl-label" style="margin-bottom:.35rem">Velocity direction</span>
                <div class="seg" id="lor-vdir" role="group" aria-label="Initial velocity direction">
                  <button class="seg-btn" type="button" data-value="right" aria-pressed="true">→ right</button>
                  <button class="seg-btn" type="button" data-value="up" aria-pressed="false">↑ up</button>
                  <button class="seg-btn" type="button" data-value="left" aria-pressed="false">← left</button>
                  <button class="seg-btn" type="button" data-value="down" aria-pressed="false">↓ down</button>
                </div>
              </div>
            </div>

            <div class="readouts mt-4">
              <div class="stat"><span class="stat-label">Charge</span><span class="stat-value" id="lor-q">—</span></div>
              <div class="stat"><span class="stat-label">|F| = qvB</span><span class="stat-value hl-rose" id="lor-force">—</span></div>
              <div class="stat"><span class="stat-label">Orbit radius</span><span class="stat-value hl-amber" id="lor-radius">—</span></div>
              <div class="stat"><span class="stat-label">Period T</span><span class="stat-value" id="lor-period">—</span></div>
              <div class="stat"><span class="stat-label">ω = qB/m</span><span class="stat-value" id="lor-omega">—</span></div>
              <div class="stat"><span class="stat-label">Kinetic energy</span><span class="stat-value hl-cyan" id="lor-ke">—</span><span class="stat-sub" id="lor-kev">—</span></div>
              <div class="stat"><span class="stat-label">Force points</span><span class="stat-value hl-emerald" id="lor-dir">—</span></div>
            </div>
            <p class="sim-note mt-3" id="lor-rule">—</p>
          </div>
        </div>

        <!-- right-hand-rule challenge -->
        <div class="panel-body" style="border-top:1px solid var(--line)">
          <div class="flex flex-wrap items-start gap-4 justify-between">
            <div style="flex:1 1 320px">
              <span class="tag tag-violet">Practice</span>
              <h4 class="font-bold mt-2" style="font-size:1rem">Predict the force direction</h4>
              <p class="small muted" id="lor-challenge-text" style="margin:.3rem 0 .7rem">—</p>
              <p class="tiny faint" id="lor-rule-hint">Do the right-hand rule in your head first, then answer.</p>
            </div>
            <div>
              <div class="btn-group" role="group" aria-label="Your answer">
                <button class="btn" type="button" data-lor-answer="up" aria-pressed="false">↑ up</button>
                <button class="btn" type="button" data-lor-answer="down" aria-pressed="false">↓ down</button>
                <button class="btn" type="button" data-lor-answer="left" aria-pressed="false">← left</button>
                <button class="btn" type="button" data-lor-answer="right" aria-pressed="false">→ right</button>
                <button class="btn btn-ghost" type="button" id="lor-challenge-new">New scenario</button>
              </div>
              <div class="feedback is-hidden" id="lor-challenge-feedback" role="status"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section wrap wrap-narrow prose">
      <h2 class="h-sec" id="check">3.6 · Check your understanding</h2>

      <details class="check">
        <summary>An electron moves east at 10<sup>6</sup> m/s through a field of 0.2 T directed into the page. Find the force’s magnitude and direction.</summary>
        <div class="answer"><b>3.2×10<sup>−14</sup> N, directed south (down the page).</b><br>
          Magnitude: F = |q|vB sin90° = (1.602×10<sup>−19</sup>)(10<sup>6</sup>)(0.2) = <b>3.2×10<sup>−14</sup> N</b>.<br>
          Direction: take east = +x̂, north = +ŷ, out of the page = +ẑ, so B = −ẑB.
          Then v × B = (v x̂) × (−B ẑ) = −vB(x̂ × ẑ) = −vB(−ŷ) = <b>+ŷ = north</b> for a
          <em>positive</em> charge. The electron carries −e, so the force reverses: <b>south</b>.
          Always evaluate the cross product first, then apply the sign of q.</div>
      </details>
      <details class="check">
        <summary>A proton and an alpha particle enter the same field with the same speed. Which has the larger orbit radius?</summary>
        <div class="answer"><b>The alpha particle, by a factor of about 2.</b> From r = mv/(|q|B),
          with v and B fixed, r is proportional to m/|q|. For a proton m/|q| = m<sub>p</sub>/e; for an alpha particle
          (a helium nucleus, m ≈ 4m<sub>p</sub>, q = +2e) m/|q| ≈ 4m<sub>p</sub>/2e = 2m<sub>p</sub>/e.
          Both curve the same way because both are positive — they simply land on different radii.
          Measuring that radius is exactly how a <b>mass spectrometer</b> identifies an ion.</div>
      </details>
      <details class="check">
        <summary>Can a magnetic field change a particle’s kinetic energy?</summary>
        <div class="answer"><b>No.</b> F is always perpendicular to v, so F·v = 0 and no work is done. Speed and kinetic energy stay constant; only the direction changes. To change the energy you need an <em>electric</em> field.</div>
      </details>
      <details class="check">
        <summary>Why do field lines never cross, and why must magnetic lines close on themselves?</summary>
        <div class="answer">If two lines crossed, B would have two directions at one point, which is impossible for a vector field. Magnetic lines close because <strong>∇·B = 0</strong> — there are no magnetic monopoles to act as sources or sinks. Electric field lines, by contrast, begin and end on charges.</div>
      </details>
      <details class="check">
        <summary>A proton and an electron move with the same velocity through the same field. Compare their forces.</summary>
        <div class="answer"><b>Equal in magnitude, opposite in direction</b> — because |q| is the same (e) for both. Their <em>accelerations</em>, though, differ by the mass ratio 1836: the electron is deflected far more sharply, which is why the aurora and CRT beams are dominated by electron motion.</div>
      </details>

      <div class="card mt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Finished with Topic 3?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Next: how a changing field creates a voltage.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="magnetism" aria-pressed="false">Mark topic as complete</button>
            <a class="btn" href="../quiz.html">Quiz this topic</a>
          </div>
        </div>
      </div>

      <nav class="pager" aria-label="Topic navigation">
        <a href="current.html"><span class="dir">← Previous</span><span class="ttl">2 · Current electricity</span></a>
        <a class="next" href="induction.html"><span class="dir">Next topic →</span><span class="ttl">4 · Electromagnetic induction</span></a>
      </nav>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <span class="brand" style="pointer-events:none">
          <svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 15 C13 7 19 5 21 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <path d="M33 15 C35 7 29 5 27 11" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <ellipse cx="24" cy="27" rx="16" ry="15" fill="#f6f1e5" stroke="#3a3d45" stroke-width="2"/>
          <circle cx="18.5" cy="26" r="1.7" fill="#2b2d33"/><circle cx="29.5" cy="26" r="1.7" fill="#2b2d33"/>
          <path d="M22 31 q2 2 4 0" stroke="#2b2d33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <circle cx="13.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/><circle cx="34.5" cy="30" r="2.4" fill="#f8aebe" opacity=".85"/>
        </svg>
          <span class="brand-name">EMC<em>Lab</em></span>
        </span>
        <p class="small muted" style="margin-top:.6rem">Topic 3 of 4.</p>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Topics</h3>
        <ul class="footer-links">
          <li><a href="charges.html">1 · Charges &amp; fields</a></li>
          <li><a href="current.html">2 · Current electricity</a></li>
          <li><a href="magnetism.html">3 · Magnetism</a></li>
          <li><a href="induction.html">4 · Electromagnetic induction</a></li>
          <li><a href="../quiz.html">Quiz</a></li>
        </ul>
      </div>
      <div>
        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">On this page</h3>
        <ul class="footer-links">
          <li><a href="#sources">3.1 Where magnetism comes from</a></li>
          <li><a href="#lines">3.2 Field lines &amp; bar magnets</a></li>
          <li><a href="#force">3.3 Force on a moving charge</a></li>
          <li><a href="#sim-magnet-panel">3.4 Magnet field lab</a></li>
          <li><a href="#sim-lorentz-panel">3.5 Lorentz force</a></li>
          <li><a href="#check">3.6 Check your understanding</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap" style="margin-top:1.6rem">
      <hr class="hr">
      <p class="tiny faint center" style="margin-top:1rem">© <span data-year>2026</span> EMC Lab</p>
    </div>
  </footer>

  <script defer src="../vendor/katex/katex.min.js"></script>
  <script defer src="../js/common.js"></script>
  <script defer src="../js/sim-magnetfield.js"></script>
  <script defer src="../js/sim-lorentz.js"></script>
</body>
</html>
````

### `vendor/fonts/manifest.json` (266 B)

````json
{
  "_readme": "Optional slot for PRIVATELY licensed faces that must not be committed (see vendor/fonts/README.md). The site's own fonts - G8321 Bold + Lilita One - are committed OFL woff2 files declared in css/fonts.css and need no entry here.",
  "licensed": []
}

### `vercel.json` (503 B)

````json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/vendor/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    },
    {
      "source": "/(css|js)/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    }
  ],
  "buildCommand": "bun run build",
  "outputDirectory": "public",
  "installCommand": "bun install"
}
````
