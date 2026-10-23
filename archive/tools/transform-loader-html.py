#!/usr/bin/env python3
"""One-shot HTML transform for the BOOT-02/DETAIL-01 page-side changes.
All seven pages carry byte-identical blocks (verified), so exact-string
replacement is safe. Idempotent: refuses to run twice."""
import sys

PAGES = ['index.html', 'quiz.html', 'topics/charge.html', 'topics/coulomb.html',
         'topics/field.html', 'topics/current.html', 'topics/magind.html']

HEAD_OLD = """  <script>/* Detail Mode pref applied before first paint (no flash of wrong level);
     storage failures fall back to the technical default. */
    try { var __p = JSON.parse(localStorage.getItem('emc.prefs.v1') || '{}'); document.documentElement.dataset.detail = (__p.detail === 'off' ? 'off' : 'on'); } catch (e) { document.documentElement.dataset.detail = 'on'; }
    document.documentElement.classList.add('js'); /* gates the .reveal entrance: no JS, no hidden content */
    try { if (sessionStorage.getItem('emc.splash.v1')) document.documentElement.classList.add('no-splash'); } catch (e) { /* storage blocked: show the splash */ }
    setTimeout(function () { var o = document.getElementById('bootOverlay'); if (o) o.remove(); }, 4000); /* failsafe: never trap a user on the shell */
  </script>"""

HEAD_NEW = """  <script>/* Detail Mode pref applied before first paint (no flash of wrong level);
     storage failures fall back to the technical default. */
    try { var __p = JSON.parse(localStorage.getItem('emc.prefs.v1') || '{}'); document.documentElement.dataset.detail = (__p.detail === 'off' ? 'off' : 'on'); } catch (e) { document.documentElement.dataset.detail = 'on'; }
    document.documentElement.classList.add('js'); /* gates the .reveal entrance: no JS, no hidden content */
    /* Boot dead-man switch — part of the ONE loader lifecycle owned by js/common.js.
       If the engine never comes up (a script failed to load or threw during
       startup), show an error card with Retry and Home after 1500 ms. When
       common.js is alive this does nothing: its loader owns the experience and
       the page content is already on screen either way. */
    setTimeout(function () {
      if (window.EMC) return;
      var home = location.pathname.indexOf('/topics/') >= 0 ? '../index.html' : 'index.html';
      var d = document.createElement('div');
      d.id = 'bootFatal'; d.setAttribute('role', 'alert');
      d.innerHTML = '<p><strong>EMC Lab did not start.</strong> A required script failed to load or threw an error.</p>' +
        '<p><button type="button" id="bootFatalRetry">Retry</button> <a href="' + home + '">Home</a></p>';
      (document.body || document.documentElement).appendChild(d);
      var r = document.getElementById('bootFatalRetry');
      if (r) r.addEventListener('click', function () { location.reload(); });
    }, 1500);
  </script>"""

STYLE_NEW = """  <style id="bootLoader">
    /* Loader visuals: ONE segmented accent bar that advances on real stage
       completion, plus a screen-reader status line — nothing else. The overlay
       is built dynamically by js/common.js only when startup exceeds ~150 ms,
       so these rules cost nothing on fast loads. Flat tokens, transform/opacity
       only; self-contained so it paints even if site.css is slow. */
    #bootOverlay {
      position: fixed; inset: 0; z-index: 200; background: #101116;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
      opacity: 1; transition: opacity .24s ease;
    }
    #bootOverlay.hide { opacity: 0; pointer-events: none; }
    #bootOverlay .bo-bar { display: flex; gap: 5px; width: 192px; height: 5px; }
    #bootOverlay .bo-seg { flex: 1; border-radius: 999px; background: #23252c; position: relative; overflow: hidden; }
    #bootOverlay .bo-seg::after {
      content: ""; position: absolute; inset: 0; background: #e9ff47; border-radius: 999px;
      transform: scaleX(0); transform-origin: left; transition: transform .2s ease;
    }
    #bootOverlay .bo-seg.done::after { transform: scaleX(1); }
    #bootOverlay .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    #bootFatal {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 210; width: min(92vw, 34rem);
      margin: 0 auto 1rem; background: #17181c; color: #e8eefb;
      border: 1.5px solid #e9ff47; border-radius: .75rem; padding: 1rem 1.2rem;
      font: 600 .95rem/1.45 system-ui, sans-serif;
    }
    #bootFatal button, #bootFatal a {
      font: inherit; font-weight: 700; color: #101116; background: #e9ff47;
      border: 0; border-radius: .5rem; padding: .4rem .9rem; cursor: pointer; text-decoration: none;
    }
    #bootFatal a { display: inline-block; margin-left: .4rem; }
    @media (prefers-reduced-motion: reduce) {
      #bootOverlay, #bootOverlay .bo-seg::after { transition: none; }
    }
  </style>"""

TOGGLE_OLD = """      <button class="detail-toggle" id="detailToggle" type="button" role="switch" aria-checked="true"
              title="Details: full technical explanations (ON) or simplified ones (OFF)">"""
TOGGLE_NEW = """      <button class="detail-toggle" id="detailToggle" type="button" aria-pressed="true"
              title="Details: full technical explanations (pressed) or simplified ones (not pressed)">"""

def cut(s, start, endmark, include_end=True):
    i = s.index(start)
    j = s.index(endmark, i)
    return s[:i] + (s[j + len(endmark):] if include_end else s[j:]), s[i:j + (len(endmark) if include_end else 0)]

for p in PAGES:
    s = open(p, encoding='utf-8').read()
    assert 'bootFatal' not in s, f'{p}: already transformed'
    # 1. head inline script
    assert s.count(HEAD_OLD) == 1, f'{p}: head block'
    s = s.replace(HEAD_OLD, HEAD_NEW)
    # 2. bootShell style -> bootLoader style
    s, _old_style = cut(s, '  <style id="bootShell">', '</style>\n')
    s = s.replace(HEAD_NEW, HEAD_NEW, 1)  # no-op anchor
    i = s.index('  </script>\n</head>') if False else None
    # insert STYLE_NEW right before </head>
    s = s.replace('</head>', STYLE_NEW + '\n</head>', 1)
    # 3. remove the static overlay markup + its noscript hider
    s, _ov = cut(s, '  <div id="bootOverlay"', '</div>\n')
    s = s.replace('  <noscript><!-- JavaScript is turned off: hide the boot shell (the tutorial text below still reads fine). --><style>#bootOverlay{display:none}</style></noscript>\n', '')
    # 4. remove the in-header boot strip
    s, _strip = cut(s, '    <div class="boot-strip" id="bootStrip" aria-hidden="true">', '</div>\n')
    # 5. detail toggle semantics
    assert s.count(TOGGLE_OLD) == 1, f'{p}: toggle block'
    s = s.replace(TOGGLE_OLD, TOGGLE_NEW)
    open(p, 'w', encoding='utf-8').write(s)
    print('transformed', p)
print('done')
