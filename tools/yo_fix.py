#!/usr/bin/env python3
"""Ставит ё в словах из словаря text_audit.py (слова без омонимов) — только внутри строковых литералов .js и в index.html.
   python3 tools/yo_fix.py        — показать, сколько замен будет
   python3 tools/yo_fix.py --write — записать"""
import re, sys, glob, os, collections, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('audit', os.path.join(ROOT, 'tools/text_audit.py'))
src_audit = open(os.path.join(ROOT, 'tools/text_audit.py'), encoding='utf-8').read().replace('\nmain()\n', '\n')
audit = {'__file__': os.path.join(ROOT, 'tools/text_audit.py')}; exec(compile(src_audit, 'text_audit.py', 'exec'), audit)
YO_E, YO_RE, STR = audit['YO_E'], audit['YO_RE'], audit['STR']

def fix_word(m):
    w = m.group(1); right = YO_E[w.lower()]
    if w.isupper(): return right.upper()
    if w[0].isupper(): return right[0].upper() + right[1:]
    return right

# Значения, которые хранятся в сохранениях и сравниваются в коде (роль человека, категория, статус): их не трогаем,
# иначе у старых сохранений «Ребенок» перестанет совпадать с 'Ребёнок' в проверках.
KEEP = {"'Ребенок'", '"Ребенок"', "'Учеба'", '"Учеба"', "'Тетя'", '"Тетя"', "'Ждет решения'", "'Ждет ответа'", "'Живет'"}

def fix_text(text, in_html=False):
    n = 0
    def fix_str(m):
        nonlocal n
        if m.group(0) in KEEP: return m.group(0)
        s, k = YO_RE.subn(fix_word, m.group(0)); n += k; return s
    if in_html:
        out, n = YO_RE.subn(fix_word, text); return out, n
    return STR.sub(fix_str, text), n

write = '--write' in sys.argv; total = 0; per = collections.Counter()
for f in sorted(glob.glob(os.path.join(ROOT, '*.js'))) + [os.path.join(ROOT, 'index.html')]:
    text = open(f, encoding='utf-8').read()
    out, n = fix_text(text, f.endswith('.html'))
    if n:
        per[os.path.basename(f)] = n; total += n
        if write: open(f, 'w', encoding='utf-8').write(out)
print(('Записано' if write else 'Будет заменено'), total, 'в', len(per), 'файлах; больше всего:', ', '.join(f'{k} {v}' for k, v in per.most_common(8)))
