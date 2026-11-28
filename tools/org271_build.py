#!/usr/bin/env python3
"""Сборка 271: собирает org271-data.js — корни и типы названий организаций (работодатели, своё дело).

   python3 tools/org271_build.py [папка-с-данными] [--check] [--fixture] [--out=путь]

Папка по умолчанию — docs/names271 (можно передать свою или ORG271_DIR).

Источник:
  org-roots.json — основной. Схема:
    {"kindTags": {"<вид своего дела>": [теги]},
     "specialtyTags": {"<специальность или id каталога 253>": [теги]},   (необязательно)
     "countries": {"<cc>": {"roots": [{"root": "...", "fit": [теги], "kind": "loan|local|meaning", "gloss": "..."}],
                            "types": {"<сфера>": [{"type": "...", "fit": [теги]}]}}}}
  Пока org-roots.json нет — ЗАГОТОВКА (fixture) из первого прохода: orgBases и orgTypes в
  {slavic,germanic,english,romance,asia,south}.json, теги расставлены наивно (сфера типа → тег, корням — по хэшу).
  В шапке org271-data.js тогда стоит «FIXTURE», а в данных fixture:true. --fixture — собрать заготовку, даже если
  org-roots.json уже есть (чтобы прогнать тест на обоих наборах). --out=путь — записать не в корень игры, а туда
  (тест берёт такой файл через ORG271_DATA=путь: node tools/verify271_employers.js).

Когда приходит настоящий org-roots.json, достаточно запустить скрипт ещё раз: employers271.js не меняется.

С 271.1 org-roots.json собирает tools/org271_merge.py из docs/names271/roots285/<cc>.json. У корня появляются привязки:
  {"root", "fit", "kind", "gloss", "tone", "types": [точные типы страны], "biz": [варианты своего дела]}
у типа — "numbered": true («Школа № N», корней нет, номер ставит employers2711.js), у страны — "mix" (доли meaning/loan/
local и banal по сферам) и "bizOptions" (id вариантов своего дела: «studio:photo», «BZ014»). В org271-data.js:
  types: [тип, сфера, теги, 1 если нумерованный]; bizIds: общий список id вариантов;
  countries.cc: roots [корень, теги, kind, пояснение, номер тона, [номера в typeNames], [номера в bizIds]],
  typeNames — имена типов страны (на них ссылаются корни), mix, bizOptions (номера в bizIds), tones — общий список тонов.
Первые четыре поля корня и три поля типа — как в 271: старые обёртки и тесты читают их без изменений.
Если в данных нет привязок (заготовка, старый org-roots.json), файл собирается прежним, без новых полей.

Проверки. Ошибка — файл не пишется, код выхода 1:
  - все 25 стран, у каждой все 12 сфер (computing … service), в каждой сфере хотя бы один тип;
  - теги только из списка (any, food, cafe-bar, …), у корня и типа fit не пустой, kind — loan|local|meaning;
  - корни и типы — русская кириллица (буквы, пробел, дефис, апостроф, цифры, точка), без «ёлочек» и латиницы;
  - kindTags есть для всех 16 видов своего дела (enterprise152.js + business-catalog253.js);
  - в каждой сфере страны есть тип, к которому подходит хоть один корень (иначе работодателя не из чего собрать).
Предупреждение — печатается, файл пишется:
  - у вида своего дела в стране меньше трёх подходящих корней (с учётом any) — выбор названий будет короче;
  - тип, к которому в стране не подходит ни один корень (employers271.js его не берёт);
  - повтор корня в стране (второй выбрасывается), specialtyTags с неизвестной специальностью.
"""
import json, os, re, sys, hashlib, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'names271')
OUT = os.path.join(ROOT, 'org271-data.js')
GROUPS = ['slavic', 'germanic', 'english', 'romance', 'asia', 'south']
FIRST14 = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx']
LATE = ['it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl']
ALL = FIRST14 + LATE
FIELDS = ['computing', 'engineering', 'medicine', 'care', 'business', 'law', 'education', 'science', 'arts', 'media',
          'trade', 'service']
TAGS = ['any', 'food', 'cafe-bar', 'beauty', 'health-care', 'kids-education', 'tech', 'creative-media', 'craft-repair',
        'trade-shop', 'services-home', 'finance-law', 'build-industry', 'pets', 'sport', 'travel-hotel']
ROOT_KINDS = {'loan', 'local', 'meaning'}
# 271.1: вся кириллица (сербское «љ», «њ»), римские цифры в конце («Иоанн Павел II»)
TEXT = re.compile(r"^[\u0400-\u04FF0-9][\u0400-\u04FF0-9’' .\-]*( [IVX]+)?$")
# 271.1: нумерованный тип — «Школа № N»: слова типа и «№ N» в конце (корня у такого типа нет, номер ставит employers2711.js)
NUMTYPE = re.compile(r"^[\u0400-\u04FF0-9][\u0400-\u04FF0-9’' .\-]* № N$")

# Заготовка: теги видов своего дела и специальностей, пока их не прислали вместе с корнями.
KIND_TAGS_FIXTURE = {
    'studio': ['creative-media'], 'services': ['services-home', 'craft-repair', 'beauty'], 'shop': ['trade-shop'],
    'food253': ['food', 'cafe-bar'], 'culture253': ['creative-media'], 'leisure253': ['sport', 'kids-education'],
    'trade253': ['trade-shop'], 'mixed253': ['trade-shop', 'services-home', 'cafe-bar'], 'craft253': ['craft-repair'],
    'farm253': ['food'], 'service253': ['beauty', 'services-home'], 'lodging253': ['travel-hotel'],
    'creative253': ['creative-media'], 'rental253': ['sport', 'travel-hotel'], 'production253': ['food', 'build-industry'],
    'tourism253': ['travel-hotel'],
}
SPECIALTY_TAGS_FIXTURE = {
    'photo': ['creative-media'], 'design': ['creative-media'], 'publishing': ['creative-media'], 'hair': ['beauty'],
    'grooming': ['pets', 'beauty'], 'repair': ['craft-repair'], 'school196': ['kids-education'],
    'books': ['creative-media', 'kids-education'], 'flowers': ['trade-shop'], 'grocery': ['trade-shop', 'food'],
}
# Наивные теги типов заготовки: сфера → теги, уточнение по словам в названии типа.
FIELD_TAGS_FIXTURE = {
    'computing': ['tech'], 'engineering': ['build-industry', 'tech'], 'medicine': ['health-care'],
    'care': ['health-care', 'services-home'], 'business': ['finance-law'], 'law': ['finance-law'],
    'education': ['kids-education'], 'science': ['tech', 'health-care'], 'arts': ['creative-media'],
    'media': ['creative-media'], 'trade': ['craft-repair', 'build-industry'], 'service': ['services-home'],
}
WORD_TAGS_FIXTURE = [
    (r'Кафе|Ресторан|Пекарн|Кофейн|Бар\b|Чайн', ['food', 'cafe-bar']), (r'Гостини|Отель|Хостел', ['travel-hotel']),
    (r'Магазин|Торгов|Лавк', ['trade-shop']), (r'Салон|Красот', ['beauty']), (r'Студи|Дизайн', ['creative-media']),
    (r'Мастерск|Ремесл', ['craft-repair']), (r'Фабрик|Завод|Производ', ['build-industry']),
]


def die(msg):
    print('ОШИБКА: ' + msg)
    sys.exit(1)


def h(text):
    return int(hashlib.md5(text.encode('utf-8')).hexdigest()[:8], 16)


def game_kinds():
    """16 видов своего дела и известные специальности — из файлов игры."""
    src = open(os.path.join(ROOT, 'enterprise152.js'), encoding='utf-8').read()
    m = re.search(r'const enterpriseTypes152=\{(.*?)\n\};', src, re.S)
    kinds = re.findall(r'^\s*(\w+):\{name:', m.group(1), re.M) if m else []
    m = re.search(r'const enterpriseSpecialties153=\{(.*?)\n\};', src, re.S)
    specs = set(re.findall(r'(\w+):\'', m.group(1))) if m else set()
    cat = open(os.path.join(ROOT, 'business-catalog253.js'), encoding='utf-8').read()
    kinds += re.findall(r'\["(\w+253)",', cat)
    specs |= set(re.findall(r'"id":"(BZ\d+)"', cat))
    return kinds, specs


def fixture(d):
    """Заготовка из первого прохода: корни без тегов, типы по сферам."""
    countries, used = {}, []
    for g in GROUPS:
        p = os.path.join(d, g + '.json')
        if not os.path.exists(p): continue
        used.append(g + '.json')
        for cc, v in json.load(open(p, encoding='utf-8')).items():
            if cc not in ALL or not isinstance(v, dict) or 'orgBases' not in v: continue
            types = {}
            for f in FIELDS:
                rows = []
                for t in v.get('orgTypes', {}).get(f, []):
                    fit = list(FIELD_TAGS_FIXTURE[f])
                    for pat, extra in WORD_TAGS_FIXTURE:
                        if re.search(pat, t): fit = list(dict.fromkeys(extra + fit))
                    rows.append({'type': t, 'fit': fit})
                types[f] = rows
            tags = [t for t in TAGS if t != 'any']
            roots = []
            for r in v['orgBases']:
                n = h(cc + '|' + r)
                fit = [tags[(n >> (4 * i)) % len(tags)] for i in range(3)]
                if n % 4 == 0: fit.append('any')
                roots.append({'root': r, 'fit': list(dict.fromkeys(fit)), 'kind': 'local'})
            # у каждого тега хотя бы три корня, иначе заготовка не проверяет выбор по тегам
            for t in tags:
                have = [r for r in roots if t in r['fit']]
                for r in sorted((r for r in roots if t not in r['fit']), key=lambda r: (len(r['fit']), h(t + r['root'])))[:max(0, 3 - len(have))]:
                    r['fit'].append(t)
            countries[cc] = {'roots': roots, 'types': types}
    if not countries: die('нет ни org-roots.json, ни первого прохода ({}.json) в {}'.format(','.join(GROUPS), d))
    return {'kindTags': KIND_TAGS_FIXTURE, 'specialtyTags': SPECIALTY_TAGS_FIXTURE, 'countries': countries}, used


def fits(root, tags):
    return 'any' in root['fit'] or any(t in tags for t in root['fit'])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = next((a[6:] for a in sys.argv[1:] if a.startswith('--out=')), OUT)
    d = args[0] if args else os.environ.get('ORG271_DIR', DEFAULT_DIR)
    src = os.path.join(d, 'org-roots.json')
    is_fixture = '--fixture' in sys.argv or not os.path.exists(src)
    if is_fixture:
        data, used = fixture(d)
        source = 'ЗАГОТОВКА из ' + ', '.join(used)
    else:
        data = json.load(open(src, encoding='utf-8'))
        source = os.path.basename(src)
    errors, warns = [], []
    kinds, specs = game_kinds()
    if len(kinds) != 16: warns.append('в игре нашлось видов своего дела: %d (ждали 16)' % len(kinds))
    tags = data.get('tags') or TAGS
    if set(tags) != set(TAGS): errors.append('список тегов не совпадает: %s' % sorted(set(tags) ^ set(TAGS)))
    kind_tags = data.get('kindTags') or {}
    for k in kinds:
        if not kind_tags.get(k): errors.append('kindTags: нет тегов для вида «%s»' % k)
    for k, v in kind_tags.items():
        if k not in kinds: warns.append('kindTags: неизвестный вид «%s»' % k)
        bad = [t for t in v if t not in TAGS]
        if bad: errors.append('kindTags[%s]: неизвестные теги %s' % (k, bad))
    spec_tags = {}
    for k, v in (data.get('specialtyTags') or {}).items():
        if k not in specs: warns.append('specialtyTags: неизвестная специальность «%s» — пропущена' % k); continue
        bad = [t for t in v if t not in TAGS]
        if bad: errors.append('specialtyTags[%s]: неизвестные теги %s' % (k, bad)); continue
        spec_tags[k] = v
    type_table, type_index, out_countries, report = [], {}, {}, []
    biz_ids, tones = [], []
    countries = data.get('countries') or {}
    for cc in ALL:
        c = countries.get(cc)
        if not c: errors.append('%s: страны нет в данных' % cc); continue
        roots, seen = [], set()
        type_fit = {}
        for rows in (c.get('types') or {}).values():
            for t in rows: type_fit.setdefault(t.get('type'), []).extend(x for x in t.get('fit') or [] if x not in type_fit.get(t.get('type'), []))
        for r in c.get('roots') or []:
            name = str(r.get('root', '')).strip()
            fit = [t for t in r.get('fit') or []]
            # 271.1: у корней владелицы fit не размечен — берём теги их типов (корень и так привязан к этим типам)
            if not fit: fit = list(dict.fromkeys(x for t in r.get('types') or [] for x in type_fit.get(t, [])))
            if not TEXT.match(name): errors.append('%s: корень «%s» — не кириллица или лишние знаки' % (cc, name)); continue
            if not fit: errors.append('%s: у корня «%s» пустой fit' % (cc, name)); continue
            bad = [t for t in fit if t not in TAGS]
            if bad: errors.append('%s: у корня «%s» неизвестные теги %s' % (cc, name, bad)); continue
            if r.get('kind', 'local') not in ROOT_KINDS: errors.append('%s: у корня «%s» kind=%s' % (cc, name, r.get('kind'))); continue
            if name in seen: warns.append('%s: повтор корня «%s» — второй убран' % (cc, name)); continue
            seen.add(name)  # 271.1: без lower(): «ДекАрт» и «Декарт» — разные корни владелицы
            roots.append({'root': name, 'fit': fit, 'kind': r.get('kind', 'local'), 'gloss': str(r.get('gloss') or '').strip(),
                          'tone': str(r.get('tone') or '').strip(), 'types': list(r.get('types') or []), 'biz': list(r.get('biz') or [])})
        if len(roots) < 8: errors.append('%s: корней %d — мало для города (нужно хотя бы 8)' % (cc, len(roots)))
        types = {}
        for f in FIELDS:
            rows = (c.get('types') or {}).get(f) or []
            if not rows: errors.append('%s: нет типов для сферы %s' % (cc, f)); continue
            idx = []
            for t in rows:
                name = str(t.get('type', '')).strip(); fit = list(t.get('fit') or [])
                numbered = bool(t.get('numbered'))
                if numbered and not NUMTYPE.match(name): errors.append('%s/%s: нумерованный тип «%s» — ждали «слова № N»' % (cc, f, name)); continue
                if not numbered and not TEXT.match(name): errors.append('%s/%s: тип «%s» — не кириллица' % (cc, f, name)); continue
                bad = [x for x in fit if x not in TAGS]
                if not fit or bad: errors.append('%s/%s: у типа «%s» fit %s' % (cc, f, name, fit)); continue
                if not numbered and not any(fits(r, fit) for r in roots):
                    warns.append('%s/%s: к типу «%s» не подходит ни один корень — не используется' % (cc, f, name))
                key = (name, f, tuple(fit), numbered)
                if key not in type_index: type_index[key] = len(type_table); type_table.append([name, f, fit] + ([1] if numbered else []))
                idx.append(type_index[key])
            if not any(any(fits(r, type_table[i][2]) for r in roots) for i in idx):
                errors.append('%s/%s: ни к одному типу не подходит ни один корень' % (cc, f))
            types[f] = idx
        # 271.1: привязки корней к типам и вариантам своего дела
        bound = any(r['types'] or r['biz'] for r in roots)
        type_names, type_numbered = [], {}
        for f in FIELDS:
            for i in types.get(f, []):
                nm, _, _, *num = type_table[i]
                type_numbered[nm] = bool(num)
                if not num and nm not in type_names: type_names.append(nm)
        biz_opts = [str(x) for x in (c.get('bizOptions') or [])]
        for b in biz_opts:
            if b not in biz_ids: biz_ids.append(b)
        if bound:
            used_types, root_pairs = collections.Counter(), set()
            for r in roots:
                for t in r['types']:
                    if t not in type_names: errors.append('%s: у корня «%s» тип «%s» не из типов страны (или нумерованный)' % (cc, r['root'], t)); continue
                    used_types[t] += 1
                    if (t, r['root']) in root_pairs: errors.append('%s: пара «%s» «%s» повторена' % (cc, t, r['root']))
                    root_pairs.add((t, r['root']))
                for b in r['biz']:
                    if b not in biz_opts: errors.append('%s: у корня «%s» вариант дела «%s» не из bizOptions' % (cc, r['root'], b))
            for t in type_names:
                if not used_types[t]: warns.append('%s: у типа «%s» нет привязанных корней — берутся по тегам' % (cc, t))
            for b in biz_opts:
                n = sum(1 for r in roots if b in r['biz'])
                if n < 3: warns.append('%s: у варианта дела «%s» корней %d — для остального берутся по тегам вида' % (cc, b, n))
        short = []
        for k in kinds:
            t = kind_tags.get(k) or []
            n = sum(1 for r in roots if fits(r, t))
            if n < 3: short.append('%s:%d' % (k, n))
        for k, t in spec_tags.items():
            n = sum(1 for r in roots if fits(r, t))
            if n < 3: short.append('%s:%d' % (k, n))
        if short: warns.append('%s: меньше трёх подходящих корней — %s' % (cc, ', '.join(short)))
        if bound:
            out_roots = []
            for r in roots:
                if r['tone'] not in tones: tones.append(r['tone'])
                row = [r['root'], r['fit'], r['kind'], r['gloss'] if r['biz'] else '', tones.index(r['tone']),
                       sorted(type_names.index(t) for t in set(r['types']) if t in type_names),
                       sorted(biz_ids.index(b) for b in r['biz'] if b in biz_ids)]
                out_roots.append(row)
            out_countries[cc] = {'roots': out_roots, 'types': types, 'typeNames': type_names, 'mix': c.get('mix') or {},
                                 'bizOptions': [biz_ids.index(b) for b in biz_opts]}
        else:
            out_countries[cc] = {'roots': [[r['root'], r['fit'], r['kind']] + ([r['gloss']] if r['gloss'] else []) for r in roots],
                                 'types': types}
        kinds_count = collections.Counter(r['kind'] for r in roots)
        report.append('%s: корней %d (%s), типов %d' % (cc, len(roots), ', '.join('%s %d' % kv for kv in sorted(kinds_count.items())),
                                                     sum(len(v) for v in types.values())))
    for w in warns: print('предупреждение: ' + w)
    for e in errors: print('ОШИБКА: ' + e)
    print('\n'.join(report))
    print('источник: %s · типов в таблице: %d · предупреждений: %d · ошибок: %d' % (source, len(type_table), len(warns), len(errors)))
    if errors: sys.exit(1)
    if '--check' in sys.argv: return
    payload = {'fixture': is_fixture, 'source': source, 'tags': TAGS, 'kindTags': {k: kind_tags[k] for k in kinds},
               'specialtyTags': spec_tags, 'types': type_table, 'countries': out_countries}
    if biz_ids:
        payload['bizIds'] = biz_ids
        payload['tones'] = tones
    head = ["'use strict';",
            '// Сборка 271: корни и типы названий организаций (работодатели, своё дело). Сгенерировано tools/org271_build.py',
            '// из docs/names271/' + ('org-roots.json' if not is_fixture else '{' + ','.join(GROUPS) + '}.json') +
            ' — руками не править, пересобрать скриптом.',
            '// types: [тип, сфера, теги, 1 если нумерованный]; countries.cc.types: сфера → номера в types; roots: [корень, теги, kind, пояснение,',
            '// номер тона, [номера в typeNames страны], [номера в bizIds]]; mix — доли по сферам; bizOptions — варианты своего дела страны (271.1).']
    if is_fixture:
        head.insert(1, '// FIXTURE: org-roots.json ещё нет — это заготовка из первого прохода (orgBases/orgTypes) с наивными тегами.')
        head.insert(2, '// Когда org-roots.json появится, запустите python3 tools/org271_build.py ещё раз.')
    body = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    body = body.replace('],"', '],\n"').replace('},"', '},\n"')
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(head) + '\nconst org271Data=' + body + ';\n')
    print('записано: %s (%d КБ)%s' % (out, os.path.getsize(out) // 1024, ' · FIXTURE' if is_fixture else ''))


main()
