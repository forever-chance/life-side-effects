#!/usr/bin/env python3
"""Сборка 279.1: собирает unis2791-data.js — вузы и колледжи по городам всех 25 стран.

   python3 tools/unis2791_build.py путь/к/all.json [--out=путь] [--check]

Источник — исследовательский файл (all.json, 25 стран, по заведению на запись). В репозиторий он не кладётся:
в нём настоящие прототипы (real_name, real_name_en, source), а владелица решила, что в игре их не видно. В данные
игры идут только поля ниже; настоящие названия, ссылки, сырой «kind» и строка языков не попадают никуда.

Что делает:
  • вид заведения (kind — свободный текст) сводит к коду вида игры (KINDS ниже; ступени по коду — в unis2791.js);
  • плату (tuition_local — текст, начинается словом free/low/…/бесплатно/…) — к ступени 0–4 (между двумя — .5);
  • строку программ чистит: без скобок, без латиницы и без имён собственных (названий школ и людей-прототипов);
  • номер заведения постоянный: при пересборке номера берутся из нынешнего unis2791-data.js по стране и названию,
    новым — следующий свободный номер страны; если заведение пропало из источника, сборка останавливается
    (в сохранениях могут быть ссылки на него) — уберите его из источника осознанно, с флагом --allow-remove.
--check — только проверить и напечатать сводку, файл не писать.
--languages — ещё и напечатать, где источник называет другой основной язык обучения, чем даёт игра (279.1.1).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'unis2791-data.js')
FIELDS = ['computing', 'engineering', 'medicine', 'care', 'business', 'law', 'education', 'science', 'arts', 'media', 'trade', 'service']

# Код вида → правило. Порядок важен: первое совпадение побеждает. Шаблон проверяется по сырому kind в нижнем регистре:
# 'all' — по всей строке, 'main' — без скобок (в скобках часто перечислены факультеты: «university (business, engineering)»
# — это не бизнес-школа и не технический вуз). Ступени по коду — в unis2791.js (kindLevels2791).
KIND_RULES = [
    ('centre', 'all', r'центр трудовой подготовки|центр\w* профподготовки|короткие курсы|short courses|short vocational courses|ifts|центр инструментального'),
    ('dual', 'all', r'dual-sector|федеральный институт|федеральный техн\w* центр|системы «s»|further education college \+ university|further and higher education|vocational university|cooperative college|degrees \+ vocational|университетский центр и школы сервиса|технологический университетский центр|университет навыков|polytechnic college'),
    ('college', 'all', r'community|tafe|cegep|further education|junior college|its academy|state_college|public_college|university transfer|applied arts and technology|prefectural polytechnic'),
    ('vocational', 'main', r'vocational|tvet|профессиональн\w* (колледж|училищ|школ)|училищ|спо\b|medical_college|technical_school|technical secondary|trade_school|trade school|apprenticeship|lycée|iefp|\bdep\b|\bmyo\b|\bista\b|technical_college|automotive training|hospitality school|hotel school|hospitality college|culinary|catering|hotel and tourism|политехникум|national polytechnic|beauty|onlus|nursing and health institute|технический колледж|профессиональный колледж|фонд профобучения|training foundation|training body|training centre|vocational training'),
    ('research', 'all', r'research|исследовательск|flagship|флагман|\b985\b|\bc9\b|ivy|russell|group of eight|collegiate'),
    ('medical', 'main', r'medical|медицин|health sciences university|\btcm\b'),
    ('music', 'main', r'music|conservator|консерватор|музык'),
    ('film', 'main', r'film|кино|screen|television|tv and radio|broadcasting'),
    ('theatre', 'main', r'drama|theatre|театр'),
    ('arts', 'main', r'arts?[_ ]academy|fine arts|art and design|art, design|art school|design school|arts? university|arts_university|arts faculty|academy of art|изобразительного искусства|искусств|fashion|моды|visual arts|applied arts|restoration|storytelling|higher design|school of art|arts_media|art university|textile and fashion'),
    ('business', 'main', r'business[_ ]school|business grande|бизнес-школ|школа бизнеса|школа экономики, управления|институт экономики|management|менеджмент|commerce|economics_university|finance and economics|international trade|торговли и управления'),
    ('law', 'main', r'\blaw\b|law_school|юридическ|школа права'),
    ('pedagogical', 'main', r'pedagog|педагогическ|normal|нормальн|teacher|university of education|учител'),
    ('open', 'main', r'\bopen\b|open_university|distance|дистанцион|online|evening|массовый|открыт'),
    ('technical', 'main', r'technical[_ ]university|technical_institute|technical and business|university of technology|technolog\w*[_ ]university|technology university|institute of technology|engineering|polytechnic|politec|политехн|технический университет|технологическ\w* (университет|институт)|инженерн|science and engineering|of electronics|science and technology|aerospace|aviation|maritime|railways|технический институт|national institute'),
    ('research', 'main', r'grande école|grand établissement|central|центральн|federal|федеральн|national university|национальный университет|ptn-bh'),
    ('applied', 'main', r'applied|прикладн|undergraduate|teaching university|small university|college|колледж|\btsu\b|tecnólogo|раджабхат|гостиничного дела|технологический вуз'),
]
KINDS = sorted({k for k, _, _ in KIND_RULES} | {'university'})
# Вуз со своей профессиональной школой внутри (турецкие MYO, вокационные факультеты Индонезии, СПО при университете,
# ปวส. у тайских технологических): ему добавляется ступень «профессиональное». Смотрим сырой вид и программы.
VOC_KINDS = {'dual', 'college', 'vocational', 'centre'}
VOC_INSIDE = re.compile(r'\bMYO\b|профессиональн\w* (школ|колледж|училищ|программ)|vocational|техникум|\bСПО\b|\bD3\b|ปวส|диплом техника|технические курсы|короткие курсы|вокационн', re.I)
# Где правило ошиблось, а название говорит само.
NAME_RULES = [
    ('music', r'консерватор'), ('film', r'киношкол|кино'), ('arts', r'академия (изящных )?искусств|художеств'),
    ('medical', r'медицинск'), ('technical', r'технич|технолог|политехн'), ('pedagogical', r'педагогическ'),
    ('law', r'юридическ'),
]


# Язык обучения (поле languages — свободный текст): 0 — только язык страны; 1 — часть программ и на английском
# (бакалавриат, магистратура, PhD); 2 — на английском только часть магистратур («английский (магистратура)»);
# 3 — всё на английском (кроме английского в строке не назван ни один язык). В unis2791.js при 1 и 2 рядом с программой
# на языке страны появляется такая же на английском, при 3 программы на английском, кроме медицины и права (как раньше).
OTHER_LANG = re.compile(r'[а-яё]{3,}(ский|цкий)|хинди|маратхи|гуджарати|каннада|телугу|урду|африкаанс|зулу|тамил|бенгал')


def english_state(langs):
    l = (langs or '').lower()
    if 'англ' not in l or 'преподают' in l:   # «преподают немецкий, английский…» — про уроки языка, не про обучение
        return 0
    main = re.sub(r'\([^()]*\)', ' ', l)
    if 'англ' in main and not OTHER_LANG.search(re.sub(r'англ\w*', ' ', main)):
        return 3
    if 'магистр' in l and 'часть программ' not in l:
        return 2
    return 1


# 279.1.1: основной язык обучения из того же поля languages. Первый язык до «;» (без скобок) — основной, остальные
# названные языки — второй язык части программ. «Работы можно сдавать по-французски», «преподают немецкий», «африкаанс
# свёрнут», «немецкий как обязательный язык», «амазигские исследования» — не язык обучения. Применяется только в странах
# LANG_COUNTRIES (Канада: французские заведения учат по-французски, двуязычные — на основном языке и частью на втором;
# вторым берутся только языки из списка страны). По остальным странам --languages печатает, где источник называет другой
# основной язык, чем даёт игра, — это решает владелица. Языки, которые знает игра (lang16), и язык страны (country16)
# читаются из catalog16.js и expansion95.js.
LANG_COUNTRIES = {'ca': ('en', 'fr')}
LANG_STEMS = [('нидерландск', 'нидерландский'), ('сербск', 'сербский'), ('русск', 'русский'), ('английск', 'английский'),
              ('португальск', 'португальский'), ('японск', 'японский'), ('французск', 'французский'), ('испанск', 'испанский'),
              ('немецк', 'немецкий'), ('корейск', 'корейский'), ('китайск', 'китайский'), ('итальянск', 'итальянский'),
              ('турецк', 'турецкий'), ('тайск', 'тайский'), ('норвежск', 'норвежский'), ('хинди', 'хинди'),
              ('индонезийск', 'индонезийский'), ('арабск', 'арабский'), ('польск', 'польский'), ('венгерск', 'венгерский'),
              ('боснийск', 'боснийский'), ('татарск', 'татарский'), ('каталанск', 'каталанский'), ('валенсийск', 'валенсийский'),
              ('галисийск', 'галисийский'), ('баскск', 'баскский'), ('африкаанс', 'африкаанс'), ('зулу', 'зулу'),
              ('тамильск', 'тамильский'), ('маратхи', 'маратхи'), ('каннада', 'каннада'), ('бенгальск', 'бенгальский'),
              ('гуджарати', 'гуджарати'), ('телугу', 'телугу'), ('урду', 'урду'), ('амазигск', 'амазигский')]
# «по-французски» — наречие, не язык обучения: перед основой не буква и не дефис.
LANG_WORD = re.compile(r'(?<![а-яё-])(' + '|'.join(s for s, _ in LANG_STEMS) + r')[а-яё]*')
NOT_TEACHING = re.compile(r'преподают|свёрнут|свернут|сдавать|исследован|обязательн')


def game_languages():
    """Языки игры: {страна: код языка страны}, {код: название} — из catalog16.js и expansion95.js."""
    cat = open(os.path.join(ROOT, 'catalog16.js'), encoding='utf8').read()
    exp = open(os.path.join(ROOT, 'expansion95.js'), encoding='utf8').read()
    m = re.search(r'const country16=\{(.*?)\};', cat)
    country = dict(re.findall(r"(\w\w):\['(\w+)',", m.group(1)))
    m = re.search(r'const lang16=\{(.*?)\};', cat)
    names = dict(re.findall(r"(\w+):'([^']+)'", m.group(1)))
    for cc, at in [(m.group(1), m.start()) for m in re.finditer(r'"(\w\w)":\{"givenNames"', exp)]:
        lm = re.compile(r'"language":"(\w+)","languageName":"([^"]*)"').search(exp, at)
        country[cc] = lm.group(1)
        names[lm.group(1)] = lm.group(2)
    return country, names


def named_languages(langs, names):
    """Языки обучения из строки languages: (основной, [остальные]); язык — код игры, а если игра его не знает, название."""
    code = {v.lower(): k for k, v in names.items()}
    stem = dict(LANG_STEMS)
    word = lambda m: code.get(stem[m.group(1)], stem[m.group(1)])
    l = (langs or '').lower()
    parts = l.split(';')
    head = re.sub(r'\([^()]*\)', ' ', parts[0])
    pieces = [head] + re.findall(r'\(([^()]*)\)', parts[0]) + parts[1:]
    if NOT_TEACHING.search(head):
        pieces = [re.split(NOT_TEACHING, head)[0]]
    seen = []
    for i, piece in enumerate(pieces):
        if i and NOT_TEACHING.search(piece):
            continue
        for m in LANG_WORD.finditer(piece):
            w = word(m)
            if w not in seen:
                seen.append(w)
    return (seen[0] if seen else None), seen[1:]


def language_spec(cc, langs, country, names):
    """Строка языка для данных: '' — как раньше (язык страны и английский по english_state), иначе основной язык и через
    «+» второй язык части программ: 'fr', 'fr+en', 'en+fr'."""
    if cc not in LANG_COUNTRIES:
        return ''
    main, others = named_languages(langs, names)
    if main not in names:
        return ''
    copies = [x for x in others if x in LANG_COUNTRIES[cc] and x != main]
    spec = '+'.join([main] + copies)
    return '' if spec == country[cc] else spec


def language_report(src, country, names):
    """--languages: где источник называет другой основной язык, чем даёт игра (по странам, с примерами)."""
    print('\nЯзык обучения: источник и игра')
    for c in src:
        cc, local = c['code'], country[c['code']]
        diff, medlaw, extra = {}, [], {}
        for u in c['institutions']:
            langs = u.get('languages') or ''
            main, others = named_languages(langs, names)
            spec = language_spec(cc, langs, country, names)
            if spec:
                game, copies = spec.split('+')[0], spec.split('+')[1:]
            else:
                e = english_state(langs)
                game, copies = ('en' if e == 3 and local != 'en' else local), (['en'] if e in (1, 2) else [])
            name = u['game_name'].strip()
            if main and main != game:
                diff.setdefault(main, []).append(name + ' — «' + langs + '»')
            if game == 'en' and local != 'en' and not spec and {'medicine', 'law'} & set(u['fields']):
                medlaw.append(name)
            for x in others:
                if x not in (game, local) and x not in copies:
                    extra.setdefault(x, []).append(name)
        if not (diff or medlaw or extra):
            continue
        say = lambda x: names.get(x, x).lower() + ('' if x in names else ' (игра не знает)')
        print('==', cc, 'язык страны в игре —', names[local].lower())
        for x, rows in sorted(diff.items(), key=lambda kv: -len(kv[1])):
            print('   основной в источнике', say(x) + ':', len(rows), '·', '; '.join(rows[:3]))
        if medlaw:
            print('   учат на английском, а медицина и право в игре на языке страны:', len(medlaw), '·', '; '.join(medlaw[:3]))
        for x, rows in sorted(extra.items(), key=lambda kv: -len(kv[1])):
            print('   второй язык не учтён —', say(x) + ':', len(rows), '·', '; '.join(rows[:3]))


def kind_code(raw, name):
    t = (raw or '').lower()
    main = re.sub(r'\([^()]*\)', ' ', t)
    for code, where, rx in KIND_RULES:
        if re.search(rx, t if where == 'all' else main):
            return code
    n = (name or '').lower()
    for code, rx in NAME_RULES:
        if re.search(rx, n):
            return code
    return 'university'


TIER_WORDS = [
    (r'^(почти\s+)?(free|бесплатн)', 0), (r'^(very|очень)\s+(low|низк)', .5), (r'^(very|очень)', 4), (r'^(high|высок)', 3),
    (r'^(medium|средн)', 2), (r'^(low|низк|небольш)', 1),
]
# «free на бюджете; самофинансирование medium» (Россия, Сербия): одна цена на всех — посередине между бюджетом и платным.
PAID = re.compile(r'(платн\w*|самофинанс\w*|контракт\w*|\bpaid\b)\s*(?:[^;.()]{0,12}?)\s*((?:very|очень)\s+\w+|free|low|medium|high|бесплатн\w*|низк\w*|средн\w*|высок\w*)')


def tier_word(w):
    w = w.strip().lower()
    for rx, v in TIER_WORDS:
        if re.search(rx, w):
            return v
    return None


def tuition_tier(text):
    t = (text or '').strip().lower()
    head = re.split(r'\s+[—(]|[,;:]|\s—\s', t)[0]
    parts = [p for p in re.split(r'\s*[–/-]\s*', head) if p]
    vals = [v for v in (tier_word(p) for p in parts) if v is not None]
    if not vals:
        v = tier_word(t)
        if v is None:
            raise SystemExit('не понял плату: ' + repr(text))
        vals = [v]
    if len(vals) > 1:
        lo, hi = min(vals), max(vals)
        tier = round((lo + hi) / 2 * 2) / 2 if hi - lo <= 1 else float(round((lo + hi) / 2))
    else:
        tier = float(vals[0])
    m = PAID.search(t)
    if tier == 0 and m and tier_word(m.group(2)) is not None:
        tier = round((tier + tier_word(m.group(2))) / 2 * 2) / 2
    return tier


ACRONYMS = {
    'mba': 'бизнес-администрирование', 'bba': 'бизнес-администрирование', 'llm': 'магистратура по праву', 'll.m.': 'магистратура по праву',
    'магистратура llm': 'магистратура по праву', 'llm для иностранных юристов': 'магистратура по праву', 'ade': 'бизнес-администрирование',
    'экономика и ade': 'экономика и бизнес-администрирование', 'ade и экономика': 'экономика и бизнес-администрирование',
    'ade и бухгалтерия': 'бизнес-администрирование и бухгалтерия', 'ade и право (esade)': 'бизнес-администрирование и право',
    'право + ade (icade e-3)': 'право и бизнес-администрирование', 'bba и коммерция': 'коммерция и бизнес-администрирование',
    'коммерция и bba': 'коммерция и бизнес-администрирование', 'ba, bcom': 'гуманитарные науки и коммерция',
    'msc менеджмент': 'менеджмент', 'master in management': 'менеджмент', 'phd по менеджменту': 'аспирантура по менеджменту',
    'mba и исполнительное образование': 'бизнес-администрирование и программы для руководителей', 'бизнес и mba (schulich)': 'бизнес',
    'fashion-бизнес': 'модный бизнес', 'hbo-ict': 'информационные технологии', 'hbo-ict (программирование)': 'информационные технологии',
    'ict и программирование': 'информационные технологии и программирование', 'ординатура md/ms': 'ординатура',
    'короткие курсы: чпу, cad/cam': 'короткие курсы: станки с ЧПУ', 'autocad и программирование станков': 'программирование станков',
    'bim-моделирование (совместно с federico ii)': 'информационное моделирование зданий', 'строительство и bim': 'строительство и информационное моделирование',
    'dams (кино, театр, музыка)': 'кино, театр, музыка', 'dams (кино)': 'кино', 'pr и медиа': 'связи с общественностью и медиа',
    'pr и коммуникация': 'связи с общественностью и коммуникация', 'llb (3 года)': 'право', '3-летняя llb': 'право',
    'право: 5-летняя программа ba llb': 'право', 'право: ba llb (5 лет)': 'право', 'право: ba llb и bcom llb (5 лет)': 'право',
    'оператор пк (copa)': 'оператор компьютера',
    # Кальки, которых нет в русском: испанское magisterio — подготовка учителей, а не «магистратура».
    'магистерство': 'подготовка учителей', 'магистерство (подготовка учителей)': 'подготовка учителей',
    'магистерство (учитель начальной школы)': 'подготовка учителей начальной школы', 'магистерство и педагогика': 'педагогика и подготовка учителей',
}
# Сокращения внутри строки, после которых строка остаётся кириллицей.
REPL = [(r'^BTS\s+', ''), (r'\bMBA\b', 'бизнес-администрирование'), (r'\bIT\b', 'ИТ'), (r'\bICT\b', 'ИКТ'),
        (r'\bPR\b', 'связи с общественностью'), (r'\bHVAC\b', 'кондиционирование'), (r'data science', 'наука о данных')]
# Латиница: любое латинское слово, кроме «3D» и «2D» (так их и пишут по-русски).
LATIN = re.compile(r'(?<![0-9])[A-Za-z\u00C0-\u024F]|[A-Za-z\u00C0-\u024F]{2,}')
NAME_LATIN = re.compile(r'[A-Za-z\u00C0-\u024F]')
# Слова с большой буквы, которые не имена: кириллические сокращения (и «ИТ-инженерия») и общие слова.
CAP_OK = re.compile(r'^(ЧПУ|ИТ|ИКТ|ИИ|ПО|ПК|СПО|ЕС|ТВ|ЛФК|ДНК|ВИЧ|ЭКГ|УЗИ|МРТ|Земли)(-[а-яё]+)?$')
NOTE = re.compile(r'вероятн|по памяти|не провер|перечень|состав')


def clean_item(p):
    q = p.strip()
    low = q.lower()
    if low in ACRONYMS:
        return ACRONYMS[low]
    for rx, to in REPL:
        q = re.sub(rx, to, q)
    for _ in range(2):
        q = re.sub(r'\s*\([^()]*\)', '', q).strip()
    q = re.sub(r'\s*\([^()]*$', '', q).strip()   # «…(двухлетние» без закрывающей скобки
    low = q.lower()
    if low in ACRONYMS:
        return ACRONYMS[low]
    # «Название: что учат» / «что учат — пояснение»: остаётся часть без имён собственных.
    for sep in (':', ' — '):
        if sep in q:
            a, b = q.split(sep, 1)
            if has_name(a) or LATIN.search(a) or NOTE.search(a):
                q = b.strip()
            elif sep == ' — ':
                q = a.strip()
    q = q.strip(' ,;.')
    if not q or LATIN.search(q) or has_name(q) or '«' in q or re.search(r'\d{4}', q):
        return None
    return q[0].lower() + q[1:] if not CAP_OK.match(q.split()[0]) else q


def has_name(text):
    # Любое слово с большой буквы, кроме кириллических сокращений (ЧПУ, ИТ), считается именем собственным.
    return any(not CAP_OK.match(w) for w in re.findall(r'(?<![\w-])[А-ЯЁ][А-ЯЁа-яё-]*', text))


def programs_line(items, limit=10):
    out, seen = [], set()
    for p in items:
        q = clean_item(p)
        if q and q.lower() not in seen:
            seen.add(q.lower())
            out.append(q)
    return out[:limit]


def read_ids(path):
    """Номера из нынешнего unis2791-data.js: {(страна, название): номер}, следующий номер по странам."""
    if not os.path.exists(path):
        return {}, {}
    text = open(path, encoding='utf8').read()
    m = re.search(r'const unis2791Data=(\{.*\});\s*$', text, re.S)
    if not m:
        raise SystemExit('не разобрал ' + path)
    data = json.loads(m.group(1))
    ids = {}
    for cc, rows in data['countries'].items():
        for r in rows:
            ids[(cc, r[2])] = r[0]
    return ids, data.get('next', {})


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = [a for a in sys.argv[1:] if a.startswith('--')]
    if not args:
        raise SystemExit(__doc__)
    out = next((f.split('=', 1)[1] for f in flags if f.startswith('--out=')), OUT)
    src = json.load(open(args[0], encoding='utf8'))
    old, nxt = read_ids(OUT)
    country_lang, lang_names = game_languages()
    countries, used, stats = {}, set(), {'kinds': {}, 'tiers': {}, 'english': {}, 'dropped': [], 'language': {}}
    for c in src:
        cc = c['code']
        rows = []
        n = max([v for (k, _), v in old.items() if k == cc] + [nxt.get(cc, 1) - 1, 0])
        for u in c['institutions']:
            name = u['game_name'].strip()
            if NAME_LATIN.search(name):
                raise SystemExit('латиница в названии: ' + name)
            key = (cc, name)
            if key in used:
                raise SystemExit('два заведения с одним названием: ' + name)
            used.add(key)
            if key in old:
                num = old[key]
            else:
                n += 1
                num = n
            fields = [f for f in FIELDS if f in u['fields']]
            bad = [f for f in u['fields'] if f not in FIELDS]
            if bad or not fields:
                raise SystemExit('направления: ' + name + ' ' + repr(u['fields']))
            code = kind_code(u.get('kind'), name)
            tier = tuition_tier(u.get('tuition_local'))
            english = english_state(u.get('languages'))
            stats['english'][english] = stats['english'].get(english, 0) + 1
            progs = programs_line(u.get('programs') or [])
            for p in u.get('programs') or []:
                if clean_item(p) is None:
                    stats['dropped'].append(p)
            for k in ('prestige', 'selectivity'):
                if u[k] not in (1, 2, 3, 4, 5):
                    raise SystemExit(k + ': ' + name)
            voc = 1 if code not in VOC_KINDS and VOC_INSIDE.search((u.get('kind') or '') + ' | ' + ' ; '.join(u.get('programs') or [])) else 0
            row = [num, u['city'], name, code, 1 if u.get('public') else 0, ' '.join(fields), u['prestige'], u['selectivity'],
                   tier, 1 if u.get('foreigners') else 0, english, ', '.join(progs), voc]
            spec = language_spec(cc, u.get('languages'), country_lang, lang_names)
            if spec:
                row.append(spec)
                stats['language'][spec] = stats['language'].get(spec, 0) + 1
            rows.append(row)
            stats['kinds'][code] = stats['kinds'].get(code, 0) + 1
            stats['tiers'][tier] = stats['tiers'].get(tier, 0) + 1
        countries[cc] = rows
        nxt[cc] = n + 1
    gone = [k for k in old if k not in used]
    if gone and '--allow-remove' not in flags:
        raise SystemExit('пропали заведения (в сохранениях могут быть ссылки): ' + '; '.join(k[0] + ' ' + k[1] for k in gone[:10]))
    print('заведений', sum(len(r) for r in countries.values()), 'видов', stats['kinds'])
    print('плата', dict(sorted(stats['tiers'].items())), 'английский', dict(sorted(stats['english'].items())), 'убрано строк программ', len(stats['dropped']))
    print('язык обучения не по стране (279.1.1):', stats['language'])
    if '--languages' in flags:
        language_report(src, country_lang, lang_names)
    for x in stats['kinds']:
        if x not in KINDS:
            raise SystemExit('неизвестный вид ' + x)
    if '--check' in flags:
        return
    head = ("'use strict';\n"
            "// Сборка 279.1: вузы и колледжи по городам всех 25 стран. Сгенерировано tools/unis2791_build.py — руками не править,\n"
            "// пересобрать скриптом (номера заведений сохраняются). Код — unis2791.js. Названия вымышленные, прототипов здесь нет.\n"
            "// countries.cc — строки заведений: [номер, город, название, вид, государственное 1/0, направления, престиж 1–5,\n"
            "//  отбор 1–5, плата 0–4 (0 бесплатно, 1 низкая, 2 средняя, 3 высокая, 4 очень высокая; .5 — между), есть набор\n"
            "//  иностранцев 1/0 (0 — иностранцев мало), английский 0–3 (0 нет, 1 часть программ, 2 часть магистратур, 3 всё),\n"
            "//  программы, есть своя профессиональная школа 1/0, язык обучения (279.1.1, есть не у всех): основной язык и через\n"
            "//  «+» второй язык части программ — 'fr', 'fr+en', 'en+fr'; нет — язык страны и английский по полю выше].\n"
            "//  id заведения — cc-nНОМЕР;\n"
            "//  next — следующий свободный номер страны.\n")
    body = 'const unis2791Data={"version":1,"next":' + json.dumps(nxt, ensure_ascii=False, separators=(',', ':')) + ',"countries":{\n'
    body += ',\n'.join('"' + cc + '":[\n' + ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rows) + ']'
                       for cc, rows in countries.items())
    body += '}};\n'
    with open(out, 'w', encoding='utf8') as f:
        f.write(head + body)
    print('записано', out, os.path.getsize(out), 'байт')


if __name__ == '__main__':
    main()
