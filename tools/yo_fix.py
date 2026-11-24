#!/usr/bin/env python3
"""Ставит ё в словах из словаря text_audit.py (слова без омонимов) — только внутри строковых литералов .js и в index.html.
   python3 tools/yo_fix.py         — показать, сколько замен будет
   python3 tools/yo_fix.py --all   — то же, со списком всех файлов
   python3 tools/yo_fix.py --write — записать
270: омографы (YO_HOMOGRAPHS: «сестры», «звезды», «жены», «узнает», «счета»…) не трогаются, даже если попадут в словарь;
каталоги, которые совпадают с редакторским каталогом v33 (SKIP), и прежние тексты в таблицах замен texts270.js — тоже."""
import re, sys, glob, os, collections, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_audit = open(os.path.join(ROOT, 'tools/text_audit.py'), encoding='utf-8').read().replace('\nmain()\n', '\n')
audit = {'__file__': os.path.join(ROOT, 'tools/text_audit.py')}; exec(compile(src_audit, 'text_audit.py', 'exec'), audit)
YO_E, YO_RE, STR = audit['YO_E'], audit['YO_RE'], audit['STR']
# 270: в сборке 268 словарь считал омографы словами «только через ё» и испортил «Три сестры», «Час звезды», «смерть его жены»,
# «Если партнёр узнает», 33 строки с «счета» во множественном числе («неоплаченные счёта»).
# Второй замок на случай, если такое слово снова попадёт в словарь.
HOMOGRAPHS = set(audit.get('YO_HOMOGRAPHS', ())) | {'сёстры', 'сёстрам', 'звёзды', 'жёны', 'слёзы', 'узнаёт', 'узнаёте', 'мёд', 'счёта'}
# Данные из редакторского каталога: тексты в них правит редакция, а сверка с v33 требует, чтобы они совпадали посимвольно.
SKIP = {'catalog245-data.js', 'business-events254-data.js'}
# Прежние тексты каталога в таблицах замен (texts270.js) должны совпадать с данными, иначе замена не сработает.
ORIGINALS = {json.dumps(r['from'], ensure_ascii=False) for rows in audit['overlays']().values() for r in rows} if 'overlays' in audit else set()

def fix_word(m):
    w = m.group(1); right = YO_E[w.lower()]
    if right in HOMOGRAPHS: return w
    if w.isupper(): return right.upper()
    if w[0].isupper(): return right[0].upper() + right[1:]
    return right

# Значения, которые хранятся в сохранениях и сравниваются в коде (роль человека, категория, статус): их не трогаем,
# иначе у старых сохранений «Ребенок» перестанет совпадать с 'Ребёнок' в проверках.
KEEP = {"'Ребенок'", '"Ребенок"', "'Учеба'", '"Учеба"', "'Тетя'", '"Тетя"', "'Ждет решения'", "'Ждет ответа'", "'Живет'"}

def fix_text(text, in_html=False):
    n = 0
    def word(m):
        nonlocal n
        out = fix_word(m)
        if out != m.group(1): n += 1
        return out
    def fix_str(m):
        if m.group(0) in KEEP or m.group(0) in ORIGINALS: return m.group(0)
        return YO_RE.sub(word, m.group(0))
    if in_html: return YO_RE.sub(word, text), n
    return STR.sub(fix_str, text), n

def main():
    write = '--write' in sys.argv; total = 0; per = collections.Counter()
    for f in sorted(glob.glob(os.path.join(ROOT, '*.js'))) + [os.path.join(ROOT, 'index.html')]:
        if os.path.basename(f) in SKIP: continue
        text = open(f, encoding='utf-8').read()
        out, n = fix_text(text, f.endswith('.html'))
        if n:
            per[os.path.basename(f)] = n; total += n
            if write: open(f, 'w', encoding='utf-8').write(out)
    top = per.most_common() if '--all' in sys.argv else per.most_common(8)
    print(('Записано' if write else 'Будет заменено'), total, 'в', len(per), 'файлах; ' + ('все' if '--all' in sys.argv else 'больше всего') + ':',
          ', '.join(f'{k} {v}' for k, v in top))

if __name__ == '__main__':
    main()
