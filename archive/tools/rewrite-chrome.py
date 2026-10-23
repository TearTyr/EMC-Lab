#!/usr/bin/env python3
"""Sitewide chrome rewrite for the 3-chapter scope (SCOPE-01):
nav dropdown, Chapters button label, footer topic lists, and the chapter
framing of topics/current.html + topics/magind.html (titles, breadcrumbs,
eyebrows, finish cards with completion buttons, pagers, taglines)."""
import io, re, sys

def rd(p): return io.open(p, encoding='utf-8').read()
def wr(p, s): io.open(p, 'w', encoding='utf-8').write(s)

CHAPTERS = [
    ('ch1', 'current.html', '1 · Circuits &amp; Ohm’s Law', 'V = IR · P = VI · series &amp; parallel · circuit builder'),
    ('ch2', 'fields.html',  '2 · Electric Fields &amp; Coulomb’s Law', 'charge · Coulomb + superposition · E-field &amp; field lines'),
    ('ch3', 'magind.html',  '3 · Magnetism &amp; Induction', 'F = qv × B · flux · Faraday · Lenz'),
]

def dropdown(P, current=None):
    links = []
    for cid, href, title, sub in CHAPTERS:
        ac = ' aria-current="page"' if cid == current else ''
        links.append(f'            <a class="dd-link"{ac} href="{P}topics/{href}"><b>{title}</b><small>{sub}</small></a>')
    return ('          <div class="nav-drop-menu" id="topicsMenu">\n'
            '            <span class="dd-head">The three chapters</span>\n'
            + '\n'.join(links) + '\n          </div>')

def footer_topics(P, with_count=False):
    quiz = f'{P}quiz.html'
    count = ' (<span id="quizCountFooter">24</span> questions)' if with_count else ''
    rows = [f'          <li><a href="{P}topics/{href}">{re.sub(r"&amp;", "&", title)}</a></li>' for cid, href, title, sub in CHAPTERS]
    rows.append(f'          <li><a href="{quiz}">Quiz{count}</a></li>')
    return ('        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">Chapters</h3>\n'
            '        <ul class="footer-links">\n' + '\n'.join(rows) + '\n        </ul>')

def replace_dropdown(s, P, current):
    pat = re.compile(r'          <div class="nav-drop-menu" id="topicsMenu">[\s\S]*?\n          </div>')
    assert pat.search(s), 'dropdown not found'
    return pat.sub(lambda m: dropdown(P, current), s, count=1)

def replace_footer_topics(s, P, with_count=False):
    pat = re.compile(r'        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 \.6rem">(?:Topics|Chapters)</h3>\n        <ul class="footer-links">[\s\S]*?\n        </ul>')
    assert pat.search(s), 'footer topics not found'
    return pat.sub(lambda m: footer_topics(P, with_count), s, count=1)

def button_label(s):
    old = re.search(r'(<button class="nav-link nav-drop-btn" id="topicsBtn" type="button"\s+aria-expanded="false" aria-controls="topicsMenu">)(\s*)(Lessons|Chapters)', s)
    assert old, 'topicsBtn not found'
    return s[:old.start(3)] + 'Chapters' + s[old.end(3):]

PAGES = {
    'index.html':          dict(P='',        current=None),
    'quiz.html':           dict(P='',        current=None),
    'topics/fields.html':  dict(P='../',     current='ch2'),
    'topics/current.html': dict(P='../',     current='ch1'),
    'topics/magind.html':  dict(P='../',     current='ch3'),
}
for page, cfg in PAGES.items():
    s = rd(page)
    s = replace_dropdown(s, cfg['P'], cfg['current'])
    s = button_label(s)
    s = replace_footer_topics(s, cfg['P'], with_count=(page == 'index.html'))
    wr(page, s)
    print('chrome updated:', page)

# ---------------- current.html: Extra -> Chapter 1 ----------------
p = 'topics/current.html'; s = rd(p)
s = s.replace('<title>Extra · Circuits &amp; Ohm’s Law — EMC Lab</title>', '<title>1 · Circuits &amp; Ohm’s Law — EMC Lab</title>')
s = s.replace('<meta property="og:title" content="Extra · Circuits &amp; Ohm’s Law">', '<meta property="og:title" content="Circuits &amp; Ohm’s Law — EMC Lab (Chapter 1)">')
s = s.replace('<meta name="twitter:title" content="Extra · Circuits &amp; Ohm’s Law">', '<meta name="twitter:title" content="Circuits &amp; Ohm’s Law — EMC Lab (Chapter 1)">')
s = s.replace('<a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Extra</span>',
              '<a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Chapter 1 · Circuits &amp; Ohm’s Law</span>')
s = s.replace('>Extra · beyond this lecture</span>', '>Chapter 1 of 3</span>')
old_finish = """            <h3 class="font-bold">Finished with this Extra chapter?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Back to the three lessons — or test this topic alone.</p>
          </div>
          <div class="flex gap-2">
            <a class="btn btn-primary" href="../index.html">Back to the lessons</a>
            <a class="btn" href="../quiz.html?topic=current">Quiz this topic</a>
          </div>"""
new_finish = """            <h3 class="font-bold">Finished with Chapter 1?</h3>
            <p class="small muted" style="margin:.25rem 0 0">Next: the graded lecture — electric fields and Coulomb’s law.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="ch1" aria-pressed="false">Mark chapter as complete</button>
            <a class="btn" href="../quiz.html?topic=ch1">Quiz this chapter</a>
          </div>"""
assert s.count(old_finish) == 1, 'current finish card'
s = s.replace(old_finish, new_finish)
old_pager = """        <a href="../index.html"><span class="dir">← Home</span><span class="ttl">Dashboard &amp; formula sheet</span></a>
        <a class="next" href="magind.html"><span class="dir">Next (Extra) →</span><span class="ttl">Magnetism &amp; induction</span></a>"""
new_pager = """        <a href="../index.html"><span class="dir">← Home</span><span class="ttl">Dashboard &amp; formula sheet</span></a>
        <a class="next" href="fields.html"><span class="dir">Next chapter →</span><span class="ttl">2 · Electric fields &amp; Coulomb’s law</span></a>"""
assert s.count(old_pager) == 1, 'current pager'
s = s.replace(old_pager, new_pager)
s = s.replace('<p class="small muted" style="margin-top:.6rem">Extra — beyond this lecture.</p>',
              '<p class="small muted" style="margin-top:.6rem">Chapter 1 of 3.</p>')
wr(p, s); print('current.html reframed as Chapter 1')

# ---------------- magind.html: Extra -> Chapter 3 ----------------
p = 'topics/magind.html'; s = rd(p)
s = s.replace('<title>Extra · Magnetism &amp; Induction — EMC Lab</title>', '<title>3 · Magnetism &amp; Induction — EMC Lab</title>')
s = s.replace('<meta property="og:title" content="Extra · Magnetism &amp; Induction">', '<meta property="og:title" content="Magnetism &amp; Induction — EMC Lab (Chapter 3)">')
s = s.replace('<meta name="twitter:title" content="Extra · Magnetism &amp; Induction">', '<meta name="twitter:title" content="Magnetism &amp; Induction — EMC Lab (Chapter 3)">')
s = s.replace('<a href="../index.html">Home</a><span aria-hidden="true">/</span><span>Extra</span>',
              '<a href="../index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Chapter 3 · Magnetism &amp; Induction</span>')
s = s.replace('>Extra · beyond this lecture</span>', '>Chapter 3 of 3</span>')
old_finish = """            <h3 class="font-bold">Finished with Extra?</h3>
            <p class="small muted" style="margin:.25rem 0 0">The quiz keeps these questions behind the Extra filter.</p>
          </div>
          <div class="flex gap-2">
            <a class="btn btn-primary" href="../index.html">Back to the lessons</a>
            <a class="btn" href="../quiz.html?topic=magind">Quiz this topic</a>
          </div>"""
new_finish = """            <h3 class="font-bold">Finished with Chapter 3?</h3>
            <p class="small muted" style="margin:.25rem 0 0">That’s all three chapters — prove it in the quiz.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" data-complete-topic="ch3" aria-pressed="false">Mark chapter as complete</button>
            <a class="btn" href="../quiz.html?topic=ch3">Quiz this chapter</a>
          </div>"""
assert s.count(old_finish) == 1, 'magind finish card'
s = s.replace(old_finish, new_finish)
old_pager = """        <a href="current.html"><span class="dir">← Previous (Extra)</span><span class="ttl">Circuits &amp; Ohm’s law</span></a>
        <a class="next" href="../quiz.html"><span class="dir">Next →</span><span class="ttl">Take the quiz</span></a>"""
new_pager = """        <a href="fields.html"><span class="dir">← Previous</span><span class="ttl">2 · Electric fields &amp; Coulomb’s law</span></a>
        <a class="next" href="../quiz.html"><span class="dir">Next →</span><span class="ttl">Take the quiz</span></a>"""
assert s.count(old_pager) == 1, 'magind pager'
s = s.replace(old_pager, new_pager)
s = s.replace('<p class="small muted" style="margin-top:.6rem">Extra — beyond this lecture.</p>',
              '<p class="small muted" style="margin-top:.6rem">Chapter 3 of 3.</p>')
wr(p, s); print('magind.html reframed as Chapter 3')

# ---------------- fields.html: footer tagline + On-this-page list ----------------
p = 'topics/fields.html'; s = rd(p)
s = s.replace('<p class="small muted" style="margin-top:.6rem">Lesson 1 of 3.</p>',
              '<p class="small muted" style="margin-top:.6rem">Chapter 2 of 3.</p>')
old_otp = re.compile(r'        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 \.6rem">On this page</h3>\n        <ul class="footer-links">[\s\S]*?\n        </ul>')
new_otp = """        <h3 class="small uppercase tracking-widest faint" style="margin:0 0 .6rem">On this page</h3>
        <ul class="footer-links">
          <li><a href="#charge">2.1 · Electric charge</a></li>
          <li><a href="#coulomb">2.2 · Coulomb’s law</a></li>
          <li><a href="#field">2.3 · Electric field</a></li>
          <li><a href="#symbols">Symbols &amp; units</a></li>
          <li><a href="#finish">Finish &amp; quiz</a></li>
        </ul>"""
assert old_otp.search(s), 'fields on-this-page'
s = old_otp.sub(lambda m: new_otp, s, count=1)
wr(p, s); print('fields.html footer updated')
print('CHROME REWRITE DONE')
