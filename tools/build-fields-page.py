#!/usr/bin/env python3
"""Build topics/fields.html (ch2) by merging the three lesson pages into
sections, per brief §1.3: 'Existing Charge/Coulomb/Field lessons become
sections of this chapter. Keep their content and sims.'
Also rewrites the three old pages as redirect stubs (old URLs keep working).
Run from the repo root: python3 tools/build-fields-page.py
"""
import re, io, sys

LESSONS = [
    ('charge',  'topics/charge.html',  '2.1', 'Electric Charge'),
    ('coulomb', 'topics/coulomb.html', '2.2', 'Coulomb\u2019s Law'),
    ('field',   'topics/field.html',   '2.3', 'Electric Field'),
]

def read(p): return io.open(p, encoding='utf-8').read()

def extract_lesson(path, key):
    s = read(path)
    main = re.search(r'<main[^>]*>([\s\S]*)</main>', s).group(1)
    # hero fragment: start of main -> the #summary section
    m_sum = re.search(r'<section[^>]*id="summary"', main)
    hero = main[:m_sum.start()]
    rest = main[m_sum.start():]
    # finish section: the <section> that contains id="finish" -> end
    i_fin = rest.index('id="finish"')
    i_sec = rest.rindex('<section', 0, i_fin)
    body = rest[:i_sec]
    # hero keepers
    h1 = re.search(r'<h1 class="h-topic([^"]*)"([^>]*)>([^<]+)</h1>', hero)
    ledes = re.findall(r'<p class="lede" data-detail="(?:plain|tech)">[\s\S]*?</p>', hero)
    obj = re.search(r'<div class="card mt-4 reveal">\s*<h2 class="h-sub"[^>]*>Learning objectives</h2>\s*<ul class="objectives">[\s\S]*?</ul>\s*</div>', hero)
    assert h1 and len(ledes) == 2, path
    return {'body': body, 'h1attrs': (h1.group(1), h1.group(2)), 'ledes': ledes, 'obj': obj.group(0) if obj else ''}

def transform(fragment, key):
    s = fragment
    # unique ids for cross-section anchors
    s = s.replace('id="summary"', f'id="{key}-summary"').replace('id="easy"', f'id="{key}-easy"').replace('id="tryit"', f'id="{key}-tryit"')
    s = s.replace('href="#summary"', f'href="#{key}-summary"').replace('href="#easy"', f'href="#{key}-easy"').replace('href="#tryit"', f'href="#{key}-tryit"')
    s = s.replace('href="charge.html#symbols"', 'href="#symbols"')
    # sibling-lesson links become in-page section anchors
    for other in ('charge', 'coulomb', 'field'):
        s = re.sub(rf'href="{other}\.html#([a-z0-9-]+)"', r'href="#\1', s)
        s = s.replace(f'href="{other}.html"', f'href="#{other}"')
    # heading demotion (h3 first so new h3s are not shifted twice)
    s = re.sub(r'<h3(?=[ >])', '<h4', s).replace('</h3>', '</h4>')
    s = re.sub(r'<h2(?=[ >])', '<h3', s).replace('</h2>', '</h3>')
    # the lesson h1 becomes the section h2
    return s

parts = {}
for key, path, num, title in LESSONS:
    L = extract_lesson(path, key)
    body = transform(L['body'], key)
    obj = transform(L['obj'], key) if L['obj'] else ''
    h2 = f'<h2 class="h-topic reveal rv-d2" id="{key}" style="scroll-margin-top:5rem;margin:.4rem 0 .35rem"><span class="tag tag-cyan" style="margin-right:.5rem;vertical-align:middle">{num}</span>{title}</h2>'
    hero_html = '\n      '.join([h2] + L['ledes'])
    parts[key] = f'''
    <section class="lesson-section" aria-labelledby="{key}" id="section-{key}">
      <div class="wrap wrap-narrow" style="padding-top:1.2rem">
      {hero_html}
      {obj}
      </div>
{body}
    </section>
'''

page = read('topics/charge.html')

HEAD_START = page.index('<section class="section wrap wrap-narrow prose reveal" id="summary"')

main_inner = '\n'.join([
'''
    <nav class="breadcrumb wrap wrap-narrow" aria-label="Breadcrumb">
      <a href="../index.html">Home</a> <span aria-hidden="true">›</span> <span aria-current="page">Chapter 2 · Electric Fields &amp; Coulomb's Law</span>
    </nav>
    <header class="wrap wrap-narrow" style="padding-top:.4rem">
      <span class="eyebrow eyebrow-amber reveal rv-d1" style="margin-top:.45rem">Chapter 2 of 3</span>
      <h1 class="h-topic reveal rv-d2" style="margin:.4rem 0 .35rem">Electric Fields &amp; Coulomb's Law</h1>
      <p class="lede" data-detail="plain">Charges push and pull on each other across empty space. This chapter is the lecture in three sections: what charge is, how hard it pushes (Coulomb's law), and how to map that push around it (the electric field).</p>
      <p class="lede" data-detail="tech">
        The lecture's own arc: charge and its two rules, Coulomb's law with
        superposition in 1-D and 2-D and the Bohr atom, then the electric field
        E = F/|q\u2080|, field lines and the two-charge y-axis example. Every worked
        number is computed live with k = 8.99\u00d710<sup>9</sup> N\u00b7m<sup>2</sup>/C<sup>2</sup>,
        the lecture's value.
      </p>
      <nav class="btn-row reveal rv-d3" aria-label="Chapter sections" style="margin:.6rem 0 .2rem">
        <a class="btn btn-sm" href="#charge">2.1 · Electric Charge</a>
        <a class="btn btn-sm" href="#coulomb">2.2 · Coulomb's Law</a>
        <a class="btn btn-sm" href="#field">2.3 · Electric Field</a>
      </nav>
    </header>
''',
parts['charge'], parts['coulomb'], parts['field'],
'''
    <section class="section wrap wrap-narrow prose">
      <div class="card mt-4 reveal" id="finish">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold">Finished with Chapter 2?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Next: magnetism and induction — fields from moving charge.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="ch2" aria-pressed="false">Mark chapter as complete</button>
            <a class="btn" href="../quiz.html?topic=ch2">Quiz this chapter</a>
          </div>
        </div>
      </div>

      <nav class="pager" aria-label="Chapter navigation">
        <a href="current.html"><span class="dir">\u2190 Previous</span><span class="ttl">1 \u00b7 Circuits &amp; Ohm's law</span></a>
        <a class="next" href="magind.html"><span class="dir">Next chapter \u2192</span><span class="ttl">3 \u00b7 Magnetism &amp; induction</span></a>
      </nav>
    </section>
'''])

start = page.index('<main')
start_inner = page.index('>', page.index('<main')) + 1
end = page.index('</main>')
newpage = page[:start_inner] + main_inner + '\n  ' + page[end:]

# head updates: title / canonical / description
newpage = newpage.replace('<title>1 \u00b7 Electric Charge \u2014 EMC Lab</title>',
                          "<title>2 \u00b7 Electric Fields &amp; Coulomb's Law \u2014 EMC Lab</title>")
newpage = re.sub(r'<title>[^<]*</title>', "<title>2 \u00b7 Electric Fields &amp; Coulomb's Law \u2014 EMC Lab</title>", newpage, count=1)
newpage = re.sub(r'<link rel="canonical" href="[^"]*">',
                 '<link rel="canonical" href="https://emc-lab.vercel.app/topics/fields.html">', newpage)
newpage = re.sub(r'<meta name="description" content="[^"]*">',
                 '<meta name="description" content="Chapter 2 \u2014 Electric Fields &amp; Coulomb\u2019s Law: charge, Coulomb\u2019s law with 1-D and 2-D superposition, the Bohr atom, electric field and field lines, with live sandboxes reproducing every lecture worked example (k = 8.99\u00d710\u2079 N\u00b7m\u00b2/C\u00b2).">', newpage, count=1)
# OG/twitter titles+urls
newpage = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="https://emc-lab.vercel.app/topics/fields.html">', newpage)
newpage = re.sub(r'<meta property="og:title" content="[^"]*">', "<meta property=\"og:title\" content=\"Electric Fields &amp; Coulomb's Law \u2014 EMC Lab\">", newpage)
newpage = re.sub(r'<meta name="twitter:title" content="[^"]*">', "<meta name=\"twitter:title\" content=\"Electric Fields &amp; Coulomb's Law \u2014 EMC Lab\">", newpage)

# scripts: all nine sims, engine order preserved
newpage = re.sub(r'(  <script defer src="\.\./js/sandbox-core\.js"></script>\n)(?:  <script defer src="[^"]*"></script>\n)*',
'''\\1  <script defer src="../js/sim-static-room.js"></script>
  <script defer src="../js/toy-balloon.js"></script>
  <script defer src="../js/toy-ledger.js"></script>
  <script defer src="../js/sim-arena.js"></script>
  <script defer src="../js/toy-pinforce.js"></script>
  <script defer src="../js/toy-bohr.js"></script>
  <script defer src="../js/sim-fieldpaint.js"></script>
  <script defer src="../js/toy-dipole.js"></script>
  <script defer src="../js/toy-zerohunt.js"></script>
''', newpage)

io.open('topics/fields.html', 'w', encoding='utf-8').write(newpage)
print('wrote topics/fields.html', len(newpage), 'bytes')

# duplicate-id audit on the merged page
ids = re.findall(r'\sid="([^"]+)"', newpage)
dups = sorted({i for i in ids if ids.count(i) > 1})
print('duplicate ids in merged page:', dups if dups else 'none')
