#!/usr/bin/env python3
"""Сборка 271: собирает names271-data.js из черновых списков имён.

   python3 tools/names271_build.py [папка-с-данными] [--check]

Папка по умолчанию — scratchpad/names271 этой сессии (можно передать свою или NAMES271_DIR). Читает:
  current-pools.json      — что игра использует сейчас (снимок пулов: f, m, surnames, region, __pets);
  <group>.json            — первый проход по странам: f, m, surnames, removeCurrent{f,m,surnames}, pets{"cc:вид:пол":[…]};
  topup-<group>.json      — добор: f, m, surnames; у kr/cn ещё surnameOrder [[фамилия, доля %], …], у in — surnameRegion;
  th-surnames.json        — фамилии Таиланда (заменяют фамилии группы asia для th) и removeCurrent;
  origins.json            — пулы этнических происхождений, если файл есть.
Группы: slavic, germanic, english, romance, asia, south. Файла нет — группа пропускается, сборка не падает:
данные ещё дописываются, скрипт можно запускать сколько угодно раз.

Пишет names271-data.js в корень игры (одна константа names271Data, руками не править) и печатает по странам:
сколько имён и фамилий стало, что убрано и почему. --check — только проверить и напечатать, файл не писать.

Проверки (что не прошло — не попадает в пул и печатается):
  - только русская кириллица (буквы, пробел, дефис, апостроф); сербские ђ ј љ њ ћ џ и латиница — нет;
  - нет пар «е/ё» (Алена/Алёна): остаётся написание с ё, второе уходит в remove;
  - нет одного имени в двух написаниях (Сипхо/Сифо, Раттанакул/Раттанакун): ключ без ь/ъ, й→и, пх/тх/кх→п/т/к,
    двойные буквы как одна; у ru/pl фамилии сравниваются в мужской форме; остаётся написание из новых данных;
  - фамилия не совпадает с личным именем той же страны (кроме Египта: там вторая и третья часть имени — имена отца
    и деда, это правило страны).
Ещё: у ru фамилии хранятся в мужской форме (женскую игра делает сама), частицы nl/za после имени — строчные
(«ван дер Мерве»), у ru — ё в известных словах (Алёна, Артём, Фёдор), уменьшительные Саша/Даша/Миша убраны
из взрослых пулов (в ru есть Александра, Дарья, Михаил).
"""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DIR = '/tmp/claude-0/-home-user-life-side-effects/673b65e8-1bde-512a-aa02-ceb3dd19767c/scratchpad/names271'
GROUPS = ['slavic', 'germanic', 'english', 'romance', 'asia', 'south']
FIRST14 = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx']
LATE = ['it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl']
ALL = FIRST14 + LATE
KINDS = ['dog', 'cat', 'rabbit']

# Правки, которые нашёл аудит имён 270, а в черновых данных их нет.
YO_FIX = {'ru': {'Алена': 'Алёна', 'Артем': 'Артём', 'Федор': 'Фёдор', 'Семен': 'Семён', 'Петр': 'Пётр',
                 'Федорова': 'Фёдорова', 'Федоров': 'Фёдоров', 'Королев': 'Королёв', 'Ковалев': 'Ковалёв',
                 'Соловьев': 'Соловьёв', 'Воробьев': 'Воробьёв', 'Медведев': 'Медведев'}}
EXTRA_REMOVE = {'ru': {'f': ['Саша', 'Даша'], 'm': ['Миша'], 'surnames': []}}
PARTICLE_LOWER = {'nl', 'za'}

# Доли фамилий, если в topup-asia.json ещё нет surnameOrder (перепись Кореи 2015; Китай — данные МОБ КНР 2019, округлено).
SHARES_FALLBACK = {
    'kr': [['Ким', 21.5], ['Ли', 14.7], ['Пак', 8.4], ['Чхве', 4.7], ['Чон', 4.3], ['Кан', 2.4], ['Чо', 2.1], ['Юн', 2.1],
           ['Чан', 2.0], ['Им', 1.7], ['Хан', 1.5], ['О', 1.5], ['Со', 1.4], ['Син', 1.4], ['Квон', 1.4], ['Хван', 1.4],
           ['Ан', 1.3], ['Сон', 1.3], ['Ю', 1.1], ['Хон', 1.1]],
    'cn': [['Ван', 7.2], ['Ли', 7.2], ['Чжан', 6.8], ['Лю', 5.2], ['Чэнь', 4.5], ['Ян', 3.3], ['Хуан', 2.4], ['Чжао', 2.0],
           ['У', 2.0], ['Чжоу', 1.9], ['Сюй', 1.4], ['Сунь', 1.4], ['Ма', 1.4], ['Чжу', 1.3], ['Ху', 1.2], ['Го', 1.1],
           ['Хэ', 1.0], ['Линь', 1.0], ['Гао', 1.0], ['Ло', 1.0]],
}

CYR = re.compile(r"^[А-Яа-яЁё][А-Яа-яЁё’' \-]*[А-Яа-яЁё]$|^[А-ЯЁ]$")


def load(d, name):
    p = os.path.join(d, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def masc_ru(x):
    out = []
    for part in x.split('-'):
        part = re.sub(r'(ов|ев|ёв|ин|ын)а$', r'\1', part)
        part = re.sub(r'ская$', 'ский', part)
        part = re.sub(r'цкая$', 'цкий', part)
        out.append(part)
    return '-'.join(out)


def masc_pl(x):
    return '-'.join(re.sub(r'цкая$', 'цкий', re.sub(r'ская$', 'ский', p)) for p in x.split('-'))


def key(x, cc, surname=False, loose=False):
    """Строгий ключ — одно и то же имя (регистр, е/ё, пробел/дефис; у th — конечные -рн/-л, у ru/pl фамилий — род).
    Свободный ключ (loose) — похожие написания для проверки глазами: без ь/ъ (кроме CJK), й→и, пх→ф, двойные буквы."""
    k = x.lower()
    if surname and cc == 'ru':
        k = masc_ru(k)
    if surname and cc == 'pl':
        k = masc_pl(k)
    k = k.replace('ё', 'е')
    k = re.sub(r'[\s\-’\']', '', k)
    if cc == 'th':
        k = re.sub(r'(рн|л)$', 'н', k)
    if loose:
        if cc not in ('cn', 'kr', 'jp'):
            k = k.replace('ъ', '').replace('ь', '')
        k = k.replace('й', 'и').replace('пх', 'ф').replace('тх', 'т').replace('кх', 'к')
        k = re.sub(r'(.)\1+', r'\1', k)
    return k


def lower_particles(x):
    x = re.sub(r'^Ван-', 'ван ', x)
    return re.sub(r'^(Ван|Де|Дю|Ле|Ден|Дер|Тер)(?= )', lambda m: m.group(1).lower(), x)


class Country:
    def __init__(self, cc, current):
        self.cc = cc
        cur = current.get(cc) or {}
        region = cur.get('region')
        self.cur = {'f': list(cur.get('f', [])), 'm': list(cur.get('m', [])), 'surnames': list(cur.get('surnames', []))}
        if isinstance(region, list):
            self.cur['surnames'] += region
        elif isinstance(region, dict):
            self.cur['surnames'] += region.get('m', []) + region.get('f', [])
        self.cur = {k: list(dict.fromkeys(v)) for k, v in self.cur.items()}
        self.add = {'f': [], 'm': [], 'surnames': []}       # (name, source) в порядке приоритета
        self.remove = {'f': set(), 'm': set(), 'surnames': set()}
        self.notes = collections.defaultdict(list)
        self.pets = collections.defaultdict(list)
        self.shares = None
        self.region = None
        self.final = None


def build(d, write=True):
    current = load(d, 'current-pools.json')
    if not current:
        sys.exit('нет current-pools.json в ' + d)
    C = {cc: Country(cc, current) for cc in ALL}
    th = load(d, 'th-surnames.json')
    sources = []
    for g in GROUPS:
        first, top = load(d, g + '.json'), load(d, 'topup-' + g + '.json')
        if first: sources.append(g + '.json')
        if top: sources.append('topup-' + g + '.json')
        for src, data in (('group', first or {}), ('topup', top or {})):
            for cc, v in data.items():
                if cc not in C:
                    continue
                c = C[cc]
                for k in ('f', 'm', 'surnames'):
                    if k == 'surnames' and cc == 'th' and th:
                        continue
                    c.add[k] += [(x, src) for x in v.get(k, [])]
                for k, names in (v.get('removeCurrent') or {}).items():
                    c.remove.setdefault(k, set()).update(names)
                for pk, names in (v.get('pets') or {}).items():
                    c.pets[pk] += names
                if v.get('surnameOrder'):
                    c.shares = [[str(a), float(b)] for a, b in v['surnameOrder']]
                if v.get('surnameRegion'):
                    c.region = v['surnameRegion']
    if th:
        sources.append('th-surnames.json')
        C['th'].add['surnames'] += [(x, 'th') for x in th.get('surnames', [])]
        C['th'].remove['surnames'].update(th.get('removeCurrent', []))
    for cc, extra in EXTRA_REMOVE.items():
        for k, names in extra.items():
            C[cc].remove[k].update(names)
    origins = load(d, 'origins.json')
    if origins: sources.append('origins.json')

    report = []
    for cc in ALL:
        c = C[cc]
        yo = YO_FIX.get(cc, {})
        final = {}
        for k in ('f', 'm', 'surnames'):
            rows = []  # (name, source, original)
            for x in c.cur[k]:
                if x in c.remove[k]:
                    c.notes[k].append('убрано по списку: ' + x)
                    continue
                rows.append((x, 'current', x))
            rows += [(x, s, x) for x, s in c.add[k]]
            fixed = []
            for x, s, orig in rows:
                y = x.strip()
                if k == 'surnames' and cc in PARTICLE_LOWER:
                    y = lower_particles(y)
                y = yo.get(y, y)
                if k == 'surnames' and cc == 'ru':
                    y = masc_ru(y)
                if k == 'surnames' and cc == 'pl':
                    y = masc_pl(y)
                if not CYR.match(y):
                    c.notes[k].append('не кириллица: ' + y)
                    if s == 'current': c.remove[k].add(orig)
                    continue
                if y in c.remove[k] and s != 'current':
                    continue
                fixed.append((y, s, orig))
            # одно имя в двух написаниях: новые данные важнее старых, ё важнее е
            chosen, by_key = [], {}
            for y, s, orig in fixed:
                kk = key(y, cc, k == 'surnames')
                if kk in by_key:
                    i = by_key[kk]
                    py, ps, porig = chosen[i]
                    if py == y:
                        continue
                    better = ('ё' in y and 'ё' not in py) or (ps == 'current' and s != 'current' and not ('ё' in py and 'ё' not in y))
                    loser = (py, ps, porig) if better else (y, s, orig)
                    if better:
                        chosen[i] = (y, s, orig)
                    kind = 'е/ё' if py.replace('ё', 'е') == y.replace('ё', 'е') else 'одно имя'
                    c.notes[k].append(f'{kind}: {py} / {y} → {chosen[i][0]}')
                    if loser[1] == 'current': c.remove[k].add(loser[2])
                    continue
                by_key[kk] = len(chosen)
                chosen.append((y, s, orig))
            for y, s, orig in chosen:
                if s == 'current' and y != orig:
                    c.remove[k].add(orig)
            loose = collections.defaultdict(list)
            for y, s, orig in chosen:
                loose[key(y, cc, k == 'surnames', True)].append(y)
            for names in loose.values():
                if len(names) > 1:
                    c.notes[k].append('похожие написания, оставлены оба (проверить): ' + ' / '.join(names))
            final[k] = [y for y, s, o in chosen]
        given = set(final['f']) | set(final['m'])
        # частая фамилия (доля от 1%: Ли, Ян в Китае) важнее совпавшего личного имени; редкая — наоборот
        frequent = {n for n, v in (c.shares or SHARES_FALLBACK.get(cc) or []) if v >= 1}
        dropped = set()
        if cc != 'eg':
            keep = []
            for x in final['surnames']:
                forms = {x, x + 'а'} if cc == 'ru' else {x}
                clash = forms & given
                if clash and x in frequent:
                    # частая фамилия (Ли, Ян в Китае) важнее редкого личного имени — убираем имя
                    for g in ('f', 'm'):
                        if clash & set(final[g]):
                            final[g] = [n for n in final[g] if n not in clash]
                            c.remove[g].update(n for n in clash if n in c.cur[g])
                            c.notes[g].append('совпадает с частой фамилией, имя убрано: ' + ', '.join(sorted(clash)))
                    given -= clash
                elif clash:
                    c.notes['surnames'].append('совпадает с личным именем, фамилия убрана: ' + x)
                    if x in c.cur['surnames']: c.remove['surnames'].add(x)
                    dropped.add(x)
                    continue
                keep.append(x)
            final['surnames'] = keep
        # пересечение мужских и женских имён — только предупреждение (бывают общие имена)
        both = sorted(set(final['f']) & set(final['m']))
        if both:
            c.notes['f'].append('и мужское, и женское: ' + ', '.join(both))
        # доли фамилий (kr, cn)
        shares = c.shares or SHARES_FALLBACK.get(cc)
        from_order = bool(c.shares)
        if shares and cc != 'eg':
            shares = [[n, v] for n, v in shares if n not in dropped]
        if shares:
            pool = set(final['surnames'])
            for name, share in shares:
                if name not in pool:
                    final['surnames'].insert(0, name)
                    pool.add(name)
                    c.notes['surnames'].append('добавлена из таблицы долей: ' + name)
            c.shares = [[n, round(v, 3)] for n, v in shares]
            if len(final['surnames']) <= len(shares):
                # names271.js раздаёт остаток до 100% поровну на хвост таблицы (доля < 1%), частые — как в таблице
                c.notes['surnames'].append('все фамилии страны — из таблицы долей; остаток до 100% игра раздаёт хвосту (доля < 1%)')
            c.notes['surnames'].append('доли: ' + ('surnameOrder' if from_order else 'запасная таблица сборщика') +
                                       f' ({len(shares)} фамилий, {round(sum(v for _, v in shares), 1)}%)')
        # питомцы
        pets = {}
        for pk, names in sorted(c.pets.items()):
            parts = pk.split(':')
            if len(parts) != 3 or parts[0] != cc or parts[1] not in KINDS or parts[2] not in ('f', 'm'):
                c.notes['pets'].append('непонятный ключ: ' + pk)
                continue
            seen, out = {}, []
            for x in names:
                x = x.strip()
                if not CYR.match(x):
                    c.notes['pets'].append('не кириллица: ' + x)
                    continue
                kk = x.lower().replace('ё', 'е')
                if kk in seen:
                    if 'ё' in x and 'ё' not in seen[kk]:
                        out[out.index(seen[kk])] = x
                        seen[kk] = x
                    continue
                seen[kk] = x
                out.append(x)
            pets[parts[1] + ':' + parts[2]] = out
        c.final = final
        entry = {'f': final['f'], 'm': final['m'], 'surnames': final['surnames'],
                 'remove': {k: sorted(v) for k, v in c.remove.items() if v}, 'pets': pets}
        if c.shares and cc in ('kr', 'cn'):
            entry['surnameShares'] = c.shares
        if c.region:
            entry['surnameRegion'] = c.region
        c.entry = entry
        report.append(c)

    out_origins = {}
    if origins:
        src = origins.get('origins', origins) if isinstance(origins, dict) else {}
        for o, v in src.items():
            if not isinstance(v, dict):
                continue
            row = {}
            for k in ('f', 'm', 'surnames'):
                names = [x.strip() for x in v.get(k, []) if isinstance(x, str)]
                bad = [x for x in names if not CYR.match(x)]
                row[k] = list(dict.fromkeys(x for x in names if CYR.match(x)))
                if bad:
                    print(f'  происхождение {o}: не кириллица — {", ".join(bad[:5])}')
            for extra in ('country', 'culture'):
                if isinstance(v.get(extra), str):
                    row['culture'] = v[extra]
            if row.get('f') or row.get('m') or row.get('surnames'):
                out_origins[o] = {k: v for k, v in row.items() if v}

    print('Источники:', ', '.join(sources) or 'нет')
    print(f'{"":4}{"жен.":>6}{"муж.":>6}{"фам.":>6}  было (ж/м/ф)   убрано   заметки')
    for c in report:
        e = c.entry
        was = f'{len(c.cur["f"])}/{len(c.cur["m"])}/{len(c.cur["surnames"])}'
        removed = sum(len(v) for v in e['remove'].values())
        notes = sum(len(v) for v in c.notes.values())
        print(f'{c.cc:4}{len(e["f"]):6}{len(e["m"]):6}{len(e["surnames"]):6}  {was:14}{removed:6}   {notes}')
    print()
    for c in report:
        for k, lines in c.notes.items():
            for line in lines:
                print(f'  {c.cc} {k}: {line}')
        if c.entry['pets']:
            print(f'  {c.cc} питомцы: ' + ', '.join(f'{k} {len(v)}' for k, v in c.entry['pets'].items()))
    if out_origins:
        print(f'Происхождения ({len(out_origins)}, ж/м/ф):', ', '.join(f'{o} {len(v.get("f", []))}/{len(v.get("m", []))}/{len(v.get("surnames", []))}' for o, v in out_origins.items()))
        empty = [o for o, v in (origins.get('origins', origins)).items() if o not in out_origins]
        if empty:
            print('Происхождения без данных (имена берутся по стране, как раньше):', ', '.join(empty))
    short = [c.cc for c in report if min(len(c.entry['f']), len(c.entry['m'])) < 20 or len(c.entry['surnames']) < 20]
    if short:
        print('Мало имён (меньше 20 на пол или фамилий):', ', '.join(short))

    data = {'build': 271, 'sources': sources, 'countries': {c.cc: c.entry for c in report}, 'origins': out_origins}
    if write:
        text = ("'use strict';\n// Сборка 271: пулы имён, фамилий и кличек по странам. Сгенерировано tools/names271_build.py из черновых "
                "списков (scratchpad/names271) — руками не править, пересобрать скриптом.\n// Здесь итоговые списки страны: "
                "что было в игре минус remove плюс новое. remove — старые написания: в пулах их больше нет, но по ним "
                "names271.js узнаёт имена в старых сохранениях.\nconst names271Data=" +
                json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
        with open(os.path.join(ROOT, 'names271-data.js'), 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'\nnames271-data.js: {len(text.encode("utf-8")) // 1024} КБ')
    return data


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    build(args[0] if args else os.environ.get('NAMES271_DIR', DEFAULT_DIR), write='--check' not in sys.argv)
