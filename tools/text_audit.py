#!/usr/bin/env python3
"""Аудит текстов игры: обращение, ё, имена после предлогов, род NPC.
   python3 tools/text_audit.py            — сводка
   python3 tools/text_audit.py --examples — сводка и по 5 примеров на правило
Строки на кириллице вытаскиваются из всех .js в корне (кроме *-data.js с каталогами). Это эвристики: цифры — порядок,
примеры — для глаз."""
import re, sys, glob, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CYR = re.compile(r'[А-Яа-яЁё]')
STR = re.compile(r"'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"|`(?:\\.|[^`\\])*`", re.S)

def strings(path):
    src = open(path, encoding='utf-8').read()
    for m in STR.finditer(src):
        s = m.group(0)
        if CYR.search(s):
            yield src.count('\n', 0, m.start()) + 1, s

# 1. «Ты» в повествовании: местоимения 2-го лица единственного числа вне «ёлочек».
TY = re.compile(r'(?<![А-Яа-яЁё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоего|твоей|твоих|твоим)(?![А-Яа-яЁё])', re.I)
def outside_quotes(s):
    return re.sub(r'«[^»]*»', '', s)

# 2. Ё: слова, которые пишутся только через ё (без омонимов вроде все/всё, небо/нёбо).
YO = ['ещё', 'идёт', 'идёте', 'живёт', 'живёте', 'придёт', 'найдёт', 'ждёт', 'берёт', 'даёт', 'встаёт', 'растёт', 'ведёт',
      'несёт', 'зовёт', 'поёт', 'пьёт', 'начнёт', 'пройдёт', 'уйдёт', 'зайдёт', 'войдёт', 'перейдёт', 'подойдёт',
      'учёба', 'учёбы', 'учёбе', 'учёбу', 'учёбой', 'счёт', 'счёта', 'расчёт', 'отчёт', 'приём', 'объём', 'подъём',
      'самолёт', 'вперёд', 'ребёнок', 'ребёнка', 'ребёнку', 'ребёнком', 'ребёнке', 'тётя', 'тёти', 'тёплый', 'тёплая',
      'тёплое', 'тёмный', 'тёмная', 'чёрный', 'чёрная', 'жёлтый', 'зелёный', 'лёгкий', 'лёгкая', 'тяжёлый', 'тяжёлая',
      'весёлый', 'шёл', 'пошёл', 'нашёл', 'пришёл', 'ушёл', 'вошёл', 'прошёл', 'зашёл', 'перешёл', 'произошёл',
      'твёрдый', 'звёзды', 'слёзы', 'мёд', 'лёд', 'полёт', 'взлёт', 'всё-таки', 'её', 'причём', 'совсем-совсем',
      'чётко', 'чёткий', 'серьёзно', 'серьёзный', 'серьёзная', 'надёжный', 'надёжно', 'шёпот', 'пёс', 'ёлка', 'ёж',
      'сёстры', 'сёстрам', 'жёны', 'мёртв', 'ошибёмся', 'берёмся', 'идём', 'живём', 'ждём', 'поймёт', 'поймёте',
      'зайдёте', 'придёте', 'найдёте', 'пройдёте', 'объяснён', 'решён', 'включён', 'отменён', 'перенесён', 'принесёт',
      'вернёт', 'вернёте', 'вернётся', 'начнётся', 'пройдётся', 'придётся', 'остаётся', 'остаётесь', 'даётся',
      'узнаёт', 'узнаёте', 'создаёт', 'отдаёт', 'продаёт', 'передаёт', 'встаёте', 'берёте', 'ждёте', 'даёте']
YO = sorted(set(w for w in YO if 'ё' in w))
YO_E = {w.replace('ё', 'е'): w for w in YO}
YO_RE = re.compile(r'(?<![А-Яа-яЁё])(' + '|'.join(map(re.escape, sorted(YO_E, key=len, reverse=True))) + r')(?![А-Яа-яЁё])', re.I)
YO_OK = re.compile(r'(?<![А-Яа-яЁё])(' + '|'.join(map(re.escape, sorted(YO, key=len, reverse=True))) + r')(?![А-Яа-яЁё])', re.I)

# 3. Имя после предлога, который требует падежа: «у ${p.name}», 'с '+p.name, «к ${x.name}».
NAME = r"(?:\$\{[^}]*\bname\b[^}]*\}|'\s*\+\s*(?:esc\()?[\w.?]*\bname\b)"
PREP = re.compile(r'(?<![А-Яа-яЁё])(у|с|со|к|ко|от|для|о|об|про|без|у\xa0|с\xa0)\s+' + NAME, re.I)

# 4. Род NPC: имя и сразу глагол прошедшего времени мужского рода (…л) без выбора по полу рядом.
SHORT_MASC = r"(?:[а-яё]{2,}(?:л|лся)|рад|готов|должен|согласен|уверен|занят|болен|счастлив|свободен|виноват|прав)"
NAME_THEN = re.compile(r"[\w.?]*\bname\b\s*\+\s*'[\s:,·]*(?:«[^»']*»\s*)?" + SHORT_MASC + r"(?![а-яё])")
MASC = re.compile(NAME + r"\s+" + SHORT_MASC + r"(?![а-яё])")
GENDER_HINT = re.compile(r"gender|sex38|petVerb|word\(|\?\s*'а'|'а'\s*:|'ла'|ла'|\?'а|:'а'")

def main():
    ex = '--examples' in sys.argv
    files = sorted(f for f in glob.glob(os.path.join(ROOT, '*.js')) if not f.endswith('-data.js'))
    count = collections.Counter(); per_file = collections.defaultdict(collections.Counter); samples = collections.defaultdict(list)
    yo_seen = collections.Counter(); yo_missing = collections.Counter(); total = 0; lines = 0
    for f in files:
        name = os.path.basename(f)
        for line, s in strings(f):
            total += 1; lines += s.count('\n') + 1
            def hit(rule, text):
                count[rule] += 1; per_file[rule][name] += 1
                if len(samples[rule]) < 5: samples[rule].append(f'{name}:{line}: {text[:150]}')
            if TY.search(outside_quotes(s)): hit('ты в повествовании', s)
            for m in YO_RE.finditer(s):
                w = m.group(1).lower(); yo_missing[YO_E[w]] += 1; hit('е вместо ё', m.group(1) + ' · ' + s)
            for m in YO_OK.finditer(s): yo_seen[m.group(1).lower()] += 1
            if PREP.search(s): hit('имя после предлога', s)
            m = MASC.search(s)
            if m and not GENDER_HINT.search(s): hit('род NPC без выбора по полу', m.group(0) + ' · ' + s)
            # Строка, которая начинается сразу после имени: p.name+' пришёл …', p.name+': рад …' — смотрим исходник вокруг.
        src = open(f, encoding='utf-8').read()
        for m in NAME_THEN.finditer(src):
            ctx = src[max(0, m.start() - 160):m.end() + 40]
            if not GENDER_HINT.search(ctx):
                count['род NPC без выбора по полу'] += 1; per_file['род NPC без выбора по полу'][name] += 1
                if len(samples['род NPC без выбора по полу']) < 8: samples['род NPC без выбора по полу'].append(f"{name}:{src.count(chr(10), 0, m.start()) + 1}: {m.group(0)[:120]}")
    print(f'Строк на кириллице: {total} (из {len(files)} файлов)')
    for rule in ['ты в повествовании', 'е вместо ё', 'имя после предлога', 'род NPC без выбора по полу']:
        top = ', '.join(f'{k} {v}' for k, v in per_file[rule].most_common(6))
        print(f'\n{rule}: {count[rule]}   больше всего: {top}')
        if ex:
            for x in samples[rule]: print('   ', x)
    both = [(w, yo_seen[w], yo_missing[w]) for w in YO if yo_seen[w] and yo_missing[w]]
    print('\nё «через раз» — слово встречается и так, и так (с ё / без):', ', '.join(f'{w} {a}/{b}' for w, a, b in sorted(both, key=lambda x: -x[2])[:15]))

main()
