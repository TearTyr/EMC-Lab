"""Rebuild vendor/fonts/emc-display-900.woff2 (the intro / title-card display face).

Source: Noto Serif JP variable font (SIL OFL 1.1, Google / Adobe) pinned at
weight 900, subset to the Latin, digit and symbol glyphs the intro lettering
uses. ~8 KB instead of a 13 MB CJK font. Needs: pip install fonttools brotli

  python tools/subset-display-font.py path/to/NotoSerifJP[wght].ttf
Download the source from
  https://github.com/google/fonts/tree/main/ofl/notoserifjp
"""
import sys, os
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', 'vendor', 'fonts', 'emc-display-900.woff2')
chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=+-/\u2019'.,:;!?&()\u03a3\u03a9\u00b7\u00d7 "
font = instancer.instantiateVariableFont(TTFont(src), {'wght': 900})
opt = subset.Options()
opt.flavor = 'woff2'
opt.layout_features = ['kern', 'liga']
opt.notdef_outline = True
sub = subset.Subsetter(opt)
sub.populate(text=chars)
sub.subset(font)
font.flavor = 'woff2'
font.save(out)
print(out, os.path.getsize(out), 'bytes')
