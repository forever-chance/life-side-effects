#!/usr/bin/env python3
"""Аудит текстов игры: обращение, ё, имена после предлогов, род NPC.
   python3 tools/text_audit.py            — сводка
   python3 tools/text_audit.py --examples — сводка и по 5 примеров на правило
Строки на кириллице вытаскиваются из всех .js в корне (кроме *-data.js с каталогами). Это эвристики: цифры — порядок,
примеры — для глаз.
270: события каталогов (catalog245-data.js, business-events254-data.js) разбираются как JSON и проверяются на «ты»
после замен по id из texts270.js (catalogTexts270, businessTexts270) — так, как их увидит игрок. Поля "from" этих
таблиц — прежние тексты каталога для сверки, на экран они не идут и в проверку не попадают."""
import re, sys, glob, os, collections, json

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
TY = re.compile(r'(?<![А-Яа-яЁё])(ты|тебя|тебе|тобой|тобою|твой|твоя|твоё|твое|твои|твоего|твоей|твоих|твоим|твоими|твою|твоему|твоём|твоем)(?![А-Яа-яЁё])', re.I)
# 270: глаголы 2-го лица единственного числа без местоимения («Решаешь не обсуждать…»). Слова на -ешь/-ишь, которые не глаголы, — в исключениях.
TY_VERB = re.compile(r'(?<![А-Яа-яЁё])([А-Яа-яЁё]{2,}(?:ешь|ёшь|ишь)(?:ся)?)(?![А-Яа-яЁё])', re.I)
TY_VERB_OK = {'лишь', 'брешь', 'тишь', 'глушь', 'мышь', 'чушь'}
def outside_quotes(s):
    return re.sub(r'«[^»]*»', '', s)
def second_person(s):
    t = outside_quotes(s)
    return bool(TY.search(t)) or any(w.lower() not in TY_VERB_OK for w in TY_VERB.findall(t))

# 2. Ё: слова, которые пишутся только через ё (без омонимов вроде все/всё, небо/нёбо).
YO = ['ещё', 'идёт', 'идёте', 'живёт', 'живёте', 'придёт', 'найдёт', 'ждёт', 'берёт', 'даёт', 'встаёт', 'растёт', 'ведёт',
      'несёт', 'зовёт', 'поёт', 'пьёт', 'начнёт', 'пройдёт', 'уйдёт', 'зайдёт', 'войдёт', 'перейдёт', 'подойдёт',
      'учёба', 'учёбы', 'учёбе', 'учёбу', 'учёбой', 'счёт', 'счёта', 'расчёт', 'отчёт', 'приём', 'объём', 'подъём',
      'самолёт', 'вперёд', 'ребёнок', 'ребёнка', 'ребёнку', 'ребёнком', 'ребёнке', 'тётя', 'тёти', 'тёплый', 'тёплая',
      'тёплое', 'тёмный', 'тёмная', 'чёрный', 'чёрная', 'жёлтый', 'зелёный', 'лёгкий', 'лёгкая', 'тяжёлый', 'тяжёлая',
      'весёлый', 'шёл', 'пошёл', 'нашёл', 'пришёл', 'ушёл', 'вошёл', 'прошёл', 'зашёл', 'перешёл', 'произошёл',
      'твёрдый', 'лёд', 'полёт', 'взлёт', 'всё-таки', 'её', 'причём', 'совсем-совсем',
      'чётко', 'чёткий', 'серьёзно', 'серьёзный', 'серьёзная', 'надёжный', 'надёжно', 'шёпот', 'пёс', 'ёлка', 'ёж',
      'мёртв', 'ошибёмся', 'берёмся', 'идём', 'живём', 'ждём', 'поймёт', 'поймёте',
      'зайдёте', 'придёте', 'найдёте', 'пройдёте', 'объяснён', 'решён', 'включён', 'отменён', 'перенесён', 'принесёт',
      'вернёт', 'вернёте', 'вернётся', 'начнётся', 'пройдётся', 'придётся', 'остаётся', 'остаётесь', 'даётся',
      'создаёт', 'отдаёт', 'продаёт', 'передаёт', 'встаёте', 'берёте', 'ждёте', 'даёте']
# 270: омографы — у слова есть другая форма с «е»: «сестры/звезды/жены/слезы» (родительный падеж: «Три сестры», «Час звезды»,
# «смерть его жены»), «узнает/узнаете» (будущее время: «Если партнёр узнает»), «мед» (медицинский вуз, «мед.»).
# Ни аудит, ни tools/yo_fix.py не должны ставить в них ё автоматически: в сборке 268 так испортились 9 строк каталога,
# «Три сестры» в театральной студии и «Если партнёр узнает». Даже если слово снова попадёт в YO выше, здесь оно отсеется.
YO_HOMOGRAPHS = {'сёстры', 'сёстрам', 'звёзды', 'жёны', 'слёзы', 'узнаёт', 'узнаёте', 'мёд'}
YO = sorted(set(w for w in YO if 'ё' in w and w not in YO_HOMOGRAPHS))
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

# 270: замены текстов каталогов по id (texts270.js) и сами события каталогов, разобранные как JSON.
OVERLAY = re.compile(r'const (\w+Texts\d+)=(\[.*?\n\]);', re.S)
CATALOGS = [('catalog245-data.js', 'catalog245', 'catalogTexts'), ('business-events254-data.js', 'businessEvents254', 'businessTexts')]
def overlays():
    """{имя таблицы: [{"ids", "from", "to"}]} из всех .js в корне."""
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, '*.js'))):
        if f.endswith('-data.js'): continue
        for m in OVERLAY.finditer(open(f, encoding='utf-8').read()): out[m.group(1)] = json.loads(m.group(2))
    return out
def catalog_texts(over):
    """(файл, id, текст) для всего, что игрок читает в событиях каталогов: заголовки, тексты, кнопки, исходы — после замен."""
    for fname, var, prefix in CATALOGS:
        path = os.path.join(ROOT, fname)
        if not os.path.exists(path): continue
        src = open(path, encoding='utf-8').read(); head = 'const ' + var + '='
        data = json.loads(src[src.index(head) + len(head):src.rindex(';')])
        events = data['events'] if isinstance(data, dict) else data
        repl = {}
        for table, rows in over.items():
            if table.startswith(prefix):
                for r in rows:
                    for i in r['ids']: repl[i] = r
        def shown(i, text):
            r = repl.get(i)
            return r['to'] if r and r['from'] == text else text
        for e in events:
            yield fname, e['id'], e.get('title', '')
            yield fname, e['id'], shown(e['id'], e.get('text', ''))
            for c in e.get('choices', []):
                yield fname, c['id'], c.get('title', c.get('label', ''))
                for o in c.get('outcomes', []): yield fname, o['id'], shown(o['id'], o.get('text', ''))

def main():
    ex = '--examples' in sys.argv
    files = sorted(f for f in glob.glob(os.path.join(ROOT, '*.js')) if not f.endswith('-data.js'))
    count = collections.Counter(); per_file = collections.defaultdict(collections.Counter); samples = collections.defaultdict(list)
    yo_seen = collections.Counter(); yo_missing = collections.Counter(); total = 0; lines = 0
    over = overlays()
    originals = {json.dumps(r['from'], ensure_ascii=False) for rows in over.values() for r in rows}
    for f in files:
        name = os.path.basename(f)
        for line, s in strings(f):
            if s in originals: continue  # прежний текст каталога в таблице замен: только для сверки
            total += 1; lines += s.count('\n') + 1
            def hit(rule, text):
                count[rule] += 1; per_file[rule][name] += 1
                if len(samples[rule]) < 5: samples[rule].append(f'{name}:{line}: {text[:150]}')
            if second_person(s): hit('ты в повествовании', s)
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
    events = 0
    for name, i, text in catalog_texts(over):
        events += 1
        if text and second_person(text):
            count['ты в повествовании'] += 1; per_file['ты в повествовании'][name] += 1
            if len(samples['ты в повествовании']) < 5: samples['ты в повествовании'].append(f'{name}:{i}: {text[:150]}')
    print(f'Строк на кириллице: {total} (из {len(files)} файлов) и {events} строк событий каталогов')
    for rule in ['ты в повествовании', 'е вместо ё', 'имя после предлога', 'род NPC без выбора по полу']:
        top = ', '.join(f'{k} {v}' for k, v in per_file[rule].most_common(6))
        print(f'\n{rule}: {count[rule]}   больше всего: {top}')
        if ex:
            for x in samples[rule]: print('   ', x)
    both = [(w, yo_seen[w], yo_missing[w]) for w in YO if yo_seen[w] and yo_missing[w]]
    print('\nё «через раз» — слово встречается и так, и так (с ё / без):', ', '.join(f'{w} {a}/{b}' for w, a, b in sorted(both, key=lambda x: -x[2])[:15]))

main()
