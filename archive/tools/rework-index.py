#!/usr/bin/env python3
"""index.html rework for the 3-chapter scope (SCOPE-01)."""
import io, re, sys

p = 'index.html'
s = io.open(p, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    assert s.count(old) >= cnt, 'NOT FOUND: ' + old[:90]
    s = s.replace(old, new, cnt)

DESC = ('EMC Lab — an interactive electromagnetics tutorial in three chapters: Circuits &amp; Ohm’s Law, '
        'Electric Fields &amp; Coulomb’s Law, and Magnetism &amp; Induction — live simulations, open sandboxes '
        'and a scored quiz, all computed from the real equations.')
rep('<meta name="description" content="EMC Lab — an interactive physics tutorial for Electric Forces &amp; Electric Field: three short lessons (charge, Coulomb’s law, electric field), nine open sandboxes and a scored quiz, with circuits and magnetism kept as Extra.">',
    f'<meta name="description" content="{DESC}">')
rep('<meta property="og:description" content="EMC Lab — an interactive physics tutorial for Electric Forces &amp; Electric Field: three short lessons (charge, Coulomb’s law, electric field), nine open sandboxes and a scored quiz, with circuits and magnetism kept as Extra.">',
    f'<meta property="og:description" content="{DESC}">')
rep('<meta name="twitter:description" content="EMC Lab — an interactive physics tutorial for Electric Forces &amp; Electric Field: three short lessons (charge, Coulomb’s law, electric field), nine open sandboxes and a scored quiz, with circuits and magnetism kept as Extra.">',
    f'<meta name="twitter:description" content="{DESC}">')

rep('<span class="eyebrow reveal rv-d1">Electric forces &amp; electric field</span>',
    '<span class="eyebrow reveal rv-d1">Circuits · Electric fields · Magnetism</span>')
rep('<h1 class="h-hero reveal rv-d2">Learn the lecture by playing with it.</h1>',
    '<h1 class="h-hero reveal rv-d2">Learn electromagnetics by playing with it.</h1>')
rep("""        <p class="lede reveal rv-d3">
          One lecture, <span id="ledeChapters">three</span> lessons, <span id="ledeSims">thirteen</span> live
          sandboxes and simulations and a <span id="ledeQuizN">35</span>-question scored quiz.
          Rub a balloon, tug charges around a free-play arena, paint an electric field and hunt
          its zero point — every number on screen is computed from the real equations, not faked.
          Circuits and magnetism live on under <em>Extra</em>.
        </p>""",
    """        <p class="lede reveal rv-d3">
          <span id="ledeChapters">Three</span> chapters, <span id="ledeSims">thirteen</span> live sandboxes and
          simulations and a <span id="ledeQuizN">24</span>-question scored quiz.
          Build a circuit and watch the bulb follow P = VI, rub a balloon, tug charges around a
          free-play arena, paint an electric field, hunt its zero point and bend an electron in a
          magnetic field — every number on screen is computed from the real equations, not faked.
        </p>""")
rep("""          <a class="btn btn-primary" href="topics/charge.html">Start with Lesson 1</a>
          <a class="btn" href="topics/field.html#sim-fieldpaint-panel">Jump to the field painter</a>""",
    """          <a class="btn btn-primary" href="topics/current.html">Start with Chapter 1</a>
          <a class="btn" href="topics/fields.html#sim-fieldpaint-panel">Jump to the field painter</a>""")
rep('<div class="eq-strip" aria-label="The four governing equations of the lecture">',
    '<div class="eq-strip" aria-label="Four governing equations of the course">')
rep('<div class="stat"><span class="stat-label">Lessons</span><span class="stat-value hl-cyan" id="statChapters">3</span></div>',
    '<div class="stat"><span class="stat-label">Chapters</span><span class="stat-value hl-cyan" id="statChapters">3</span></div>')
rep('<span class="stat-value hl-emerald" id="statQuestions">35</span>',
    '<span class="stat-value hl-emerald" id="statQuestions">24</span>')

rep('<p class="lede" style="margin:.35rem 0 0">Read a lesson — 30-second summary first — play with its sandbox, then prove it in the quiz. Your progress is saved on this device only.</p>',
    '<p class="lede" style="margin:.35rem 0 0">Read a chapter — 30-second summary first — play with its sandboxes, then prove it in the quiz. Your progress is saved on this device only.</p>')
rep("""            Each lesson opens with a 30-second summary and one key formula, then tells the
            same idea in plain words, then in full technical detail with the lecture’s own
            worked examples. The Details switch in the header picks your depth.""",
    """            Each chapter opens with a 30-second summary and one key formula, then tells the
            same idea in plain words, then in full technical detail with the course’s own
            worked examples. The Details switch in the header picks your depth.""")
rep("""            Every lesson is one open sandbox plus two tiny toys: drop as many charges as you
            like, drag anything, flip the switches. Optional challenges give stars; nothing
            ever blocks your play, and every setup copies to a shareable link.""",
    """            Every chapter ships open sandboxes and toys: build circuits, drop as many charges
            as you like, drag anything, flip the switches. Optional challenges give stars;
            nothing ever blocks your play, and every setup copies to a shareable link.""")
rep('<span id="quizCountWord">Thirty-five</span> multiple-choice questions',
    '<span id="quizCountWord">Twenty-four</span> multiple-choice questions')

# ---- dashboard header + chips ----
rep('<h2 class="h-sec" style="margin:0">The lecture — three lessons</h2>',
    '<h2 class="h-sec" style="margin:0">The three chapters</h2>')
rep('<span class="tag tag-cyan" id="dashTopicsChip">0 of 3 lessons studied</span>',
    '<span class="tag tag-cyan" id="dashTopicsChip">0 of 3 chapters studied</span>')
rep('<div><dt>Topics studied</dt><dd id="dashTopicsDone">0 of 3 chapters studied</dd></div>',
    '<div><dt>Chapters studied</dt><dd id="dashTopicsDone">0 of 3 chapters studied</dd></div>')
rep("""                Tick a topic with the <em>Mark topic as complete</em> button at the end of each page.
                Scoring 70% or more in the quiz also ticks all three lessons for you, since a pass
                means the whole course has been covered — say the word and un-tick any of them.""",
    """                Tick a chapter with the <em>Mark chapter as complete</em> button at the end of each page.
                Scoring 70% or more in the quiz also ticks all three chapters for you, since a pass
                means the whole course has been covered — say the word and un-tick any of them.""")

# ---- chapter cards: replace the three lesson cards + remove the Extra section ----
i0 = s.index('        <!-- Lesson 1 -->')
i1 = s.index('    </section>\n\n    <section class="section wrap">\n      <div class="flex flex-wrap items-center justify-between gap-3 mb-4 reveal">\n        <h2 class="h-sec" style="margin:0">Extra — beyond this lecture</h2>')
i2 = s.index('    <section class="section wrap">\n      <h2 class="h-sec reveal">Every simulation is a sandbox')
CARDS = '''        <!-- Chapter 1 -->
        <article class="card card-hover topic-card reveal" data-motif="circuit" style="--topic-accent:#f6d36b">
          <span class="topic-num" aria-hidden="true">01</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12h3l2-5 3 10 2-5h6"/><circle cx="4" cy="12" r="1.4"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Circuits &amp; Ohm’s Law</h3>
          <p class="small muted">Voltage pushes, resistance pushes back — and the bulb tells the truth in watts.</p>
          <ul class="topic-list">
            <li>Ohm’s law V = IR and power P = VI, live</li>
            <li>Series &amp; parallel reduction</li>
            <li>Drag-and-drop circuit builder</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/current.html" data-topic-link="ch1">Open chapter</a>
            <span class="check-pill" data-topic-check="ch1">not started</span>
          </div>
        </article>

        <!-- Chapter 2 -->
        <article class="card card-hover topic-card reveal" data-motif="field" style="--topic-accent:#a8d3e0">
          <span class="topic-num" aria-hidden="true">02</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="12" r="4"/><path d="M9 10v4M7 12h4"/><circle cx="18" cy="7" r="2.4"/><path d="M18 5.8v2.4"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Electric Fields &amp; Coulomb’s Law</h3>
          <p class="small muted">The graded lecture in three sections: charge, the inverse-square force, and the field.</p>
          <ul class="topic-list">
            <li>q = n·e — charge comes in parcels</li>
            <li>F = k|q₁q₂|/r², added as arrows</li>
            <li>E = F/|q₀| and the direction rule</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/fields.html" data-topic-link="ch2">Open chapter</a>
            <span class="check-pill" data-topic-check="ch2">not started</span>
          </div>
        </article>

        <!-- Chapter 3 -->
        <article class="card card-hover topic-card reveal" data-motif="coil" style="--topic-accent:#d5b8d8">
          <span class="topic-num" aria-hidden="true">03</span>
          <span class="topic-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="9" cy="12" rx="3" ry="7"/><ellipse cx="14" cy="12" rx="3" ry="7"/><path d="M19 8h3M19 12h3M19 16h3"/>
            </svg>
          </span>
          <h3 class="text-xl font-bold">Magnetism &amp; Induction</h3>
          <p class="small muted">Moving charge meets magnetic field — orbits, flux and the minus sign that is Lenz’s law.</p>
          <ul class="topic-list">
            <li>F = qv × B and cyclotron motion</li>
            <li>Flux Φ and Faraday’s law</li>
            <li>Lenz’s law, live on the coil</li>
          </ul>
          <div class="flex items-center gap-2 mt-3">
            <a class="btn btn-sm btn-primary" href="topics/magind.html" data-topic-link="ch3">Open chapter</a>
            <span class="check-pill" data-topic-check="ch3">not started</span>
          </div>
        </article>
      </div>
    </section>

'''
s = s[:i0] + CARDS + s[i2:]

# ---- sim index cards: relabel + repoint ----
for old, new in [
    ('<a class="card card-hover reveal" href="topics/charge.html#sim-static-room-panel">\n          <span class="tag tag-amber">Lesson 1</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#sim-static-room-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.1</span>'),
    ('<a class="card card-hover reveal" href="topics/charge.html#toy-balloon-panel">\n          <span class="tag tag-amber">Lesson 1</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#toy-balloon-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.1</span>'),
    ('<a class="card card-hover reveal" href="topics/coulomb.html#sim-arena-panel">\n          <span class="tag tag-rose">Lesson 2</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#sim-arena-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.2</span>'),
    ('<a class="card card-hover reveal" href="topics/coulomb.html#toy-pinforce-panel">\n          <span class="tag tag-rose">Lesson 2</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#toy-pinforce-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.2</span>'),
    ('<a class="card card-hover reveal" href="topics/field.html#sim-fieldpaint-panel">\n          <span class="tag tag-cyan">Lesson 3</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#sim-fieldpaint-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.3</span>'),
    ('<a class="card card-hover reveal" href="topics/field.html#toy-dipole-panel">\n          <span class="tag tag-cyan">Lesson 3</span>',
     '<a class="card card-hover reveal" href="topics/fields.html#toy-dipole-panel">\n          <span class="tag tag-cyan">Chapter 2 · §2.3</span>'),
    ('<span class="tag tag-violet">Extra</span>\n          <h3 class="font-bold mt-2">Ohm bench + circuit builder</h3>',
     '<span class="tag tag-amber">Chapter 1</span>\n          <h3 class="font-bold mt-2">Ohm bench + circuit builder</h3>'),
    ('<span class="tag tag-violet">Extra</span>\n          <h3 class="font-bold mt-2">Lorentz orbits + coil lab</h3>',
     '<span class="tag tag-violet">Chapter 3</span>\n          <h3 class="font-bold mt-2">Lorentz orbits + coil lab</h3>'),
    ('<li>Extra: <span data-tex="V = IR">V = IR</span>, <span data-tex="\\vec{F} = q\\vec{v} \\times \\vec{B}">F = qv × B</span>, <span data-tex="\\mathcal{E} = -N\\,d\\Phi/dt">EMF = −N·dΦ/dt</span></li>',
     '<li>Ch1 &amp; Ch3: <span data-tex="V = IR">V = IR</span>, <span data-tex="\\vec{F} = q\\vec{v} \\times \\vec{B}">F = qv × B</span>, <span data-tex="\\mathcal{E} = -N\\,d\\Phi/dt">EMF = −N·dΦ/dt</span></li>'),
]:
    rep(old, new)
rep('<h2 class="h-sec reveal">Every simulation is a sandbox, driven by real equations</h2>\n      <p class="lede" data-detail="plain" style="margin:0 0 1.2rem">Every sandbox works out its numbers from the real physics equations while you play — nothing is faked or pre-recorded.</p>',
    '<h2 class="h-sec reveal">Every simulation is a sandbox, driven by real equations</h2>\n      <p class="lede" data-detail="plain" style="margin:0 0 1.2rem">Every sandbox works out its numbers from the real physics equations while you play — nothing is faked or pre-recorded.</p>')

# ---- formula table labels ----
for a, b in [
    ('<td class="txt">Extra · Ohm’s law</td>', '<td class="txt">Ch1 · Ohm’s law</td>'),
    ('<td class="txt">Extra · networks</td>', '<td class="txt">Ch1 · networks</td>'),
    ('<td class="txt">Extra · magnetic force</td>', '<td class="txt">Ch3 · magnetic force</td>'),
    ('<td class="txt">Extra · Faraday</td>', '<td class="txt">Ch3 · Faraday</td>'),
    ('μ<sub>0</sub> = 4π×10<sup>−7</sup> T·m/A (Extra).', 'μ<sub>0</sub> = 4π×10<sup>−7</sup> T·m/A (Chapter 3).'),
    ('<p class="lede" style="margin:.35rem 0 0">One cheat-sheet table: the lecture’s formulas first, then the Extra ones, with units and what each tells you.</p>',
     '<p class="lede" style="margin:.35rem 0 0">One cheat-sheet table: Chapter 2’s formulas first, then Chapters 1 and 3, with units and what each tells you.</p>'),
]:
    rep(a, b)

# ---- CTA ----
rep("""              <span id="quizCountCta">35</span> questions — 19 across the three lessons, 16 Extra — with hints, instant or
              exam marking, worked explanations, and a per-topic breakdown so you know exactly what to revise.""",
    """              <span id="quizCountCta">24</span> questions — 8 per chapter — with hints, instant or
              exam marking, worked explanations, and a per-chapter breakdown so you know exactly what to revise.""")

io.open(p, 'w', encoding='utf-8').write(s)
print('index.html reworked;', len(s), 'bytes')
