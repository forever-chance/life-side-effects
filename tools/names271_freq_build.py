#!/usr/bin/env python3
"""Сборка 271: собирает names271-freq-data.js — частоты имён и фамилий по странам.

   python3 tools/names271_freq_build.py [папка-с-данными] [--check]

Папка по умолчанию — docs/names271 (можно передать свою или NAMES271_DIR). Читает:
  freq-<group>.json — {"<cc>": {"f": {имя: [эпохи, частота]}, "m": {…}, "surnames": {фамилия: частота},
                       "pairs": [[имя, фамилия]], "doubles": [имя]}};
                       эпохи ⊂ old (до ~1965), mid (~1960–1985), modern (~1985–2010), new (с ~2005); частота 1–3;
  topup-asia.json   — у kr/cn "surnameOrder" [[фамилия, доля %]] (запасной вариант: обычно доли задаёт names271).
Группы: slavic, germanic, english, romance, asia, south. Файла нет — группа пропускается, сборка не падает:
страны без данных в игре остаются с равными весами (как до 271).

Пишет names271-freq-data.js в корень игры (константа namesFreq271Data, руками не править). Формат страны:
  f / m — {"<частота>:<эпохи через запятую>": "Имя|Имя|…"}; s — {"<частота>": "Фамилия|…"}; pairs, doubles — как в данных.
Проверки (что не прошло — не попадает в файл и печатается): только кириллица, эпохи из четырёх известных
(пустой список — все эпохи), частота 1–3. Написания не правятся: игра сверяет имена без учёта регистра, ё/е и дефиса,
а для пасхалок берёт написание из своего пула.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'names271')
GROUPS = ['slavic', 'germanic', 'english', 'romance', 'asia', 'south']
ALL = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx',
       'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl']
ERAS = ['old', 'mid', 'modern', 'new']
CYR = re.compile(r"^[А-Яа-яЁё][А-Яа-яЁё’' \-]*[А-Яа-яЁё]$|^[А-ЯЁ]$")


def load(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        print(f'  {os.path.basename(path)}: файл ещё пишется или испорчен ({e}), пропускаю')
        return None


def build(src, write=True):
    countries, sources, notes = {}, [], []
    for g in GROUPS:
        d = load(os.path.join(src, f'freq-{g}.json'))
        if not isinstance(d, dict):
            continue
        sources.append(f'freq-{g}.json')
        for cc, v in d.items():
            if cc not in ALL or not isinstance(v, dict):
                notes.append(f'{g}: неизвестная страна {cc}')
                continue
            row = {}
            for sex in ('f', 'm'):
                groups = {}
                for n, val in (v.get(sex) or {}).items():
                    n = str(n).strip()
                    try:
                        eras, tier = val
                        eras = [e for e in ERAS if e in eras] if eras else list(ERAS)
                        bad = [e for e in val[0] if e not in ERAS]
                    except (TypeError, ValueError):
                        notes.append(f'{cc} {sex}: {n} — неверная запись {val!r}')
                        continue
                    if not CYR.match(n) or tier not in (1, 2, 3) or bad or not eras:
                        notes.append(f'{cc} {sex}: {n} — пропущено ({val!r})')
                        continue
                    groups.setdefault(f'{tier}:{",".join(eras)}', []).append(n)
                row[sex] = {k: '|'.join(dict.fromkeys(x)) for k, x in sorted(groups.items(), key=lambda kv: (-int(kv[0][0]), kv[0]))}
            sur = {}
            for n, tier in (v.get('surnames') or {}).items():
                n = str(n).strip()
                if not CYR.match(n) or tier not in (1, 2, 3):
                    notes.append(f'{cc} фамилия: {n} — пропущено ({tier!r})')
                    continue
                sur.setdefault(str(tier), []).append(n)
            row['s'] = {k: '|'.join(dict.fromkeys(x)) for k, x in sorted(sur.items(), reverse=True)}
            pairs = [[str(a).strip(), str(b).strip()] for a, b in (v.get('pairs') or []) if CYR.match(str(a).strip()) and CYR.match(str(b).strip())]
            doubles = [str(a).strip() for a in (v.get('doubles') or []) if CYR.match(str(a).strip())]
            if pairs:
                row['pairs'] = pairs
            if doubles:
                row['doubles'] = doubles
            countries[cc] = row
    shares = {}
    top = load(os.path.join(src, 'topup-asia.json')) or {}
    for cc in ('kr', 'cn'):
        order = (top.get(cc) or {}).get('surnameOrder') or []
        rows = [[str(n).strip(), float(p)] for n, p in order if CYR.match(str(n).strip()) and float(p) > 0]
        if rows:
            shares[cc] = rows
    if shares:
        sources.append('topup-asia.json (surnameOrder)')

    print('Источники:', ', '.join(sources) or 'нет')
    print(f'{"":4}{"жен.":>6}{"муж.":>6}{"фам.":>6}{"пары":>6}{"двойн.":>8}')
    for cc in ALL:
        r = countries.get(cc)
        if not r:
            continue
        cnt = lambda grp: sum(len(x.split('|')) for x in grp.values())
        print(f'{cc:4}{cnt(r["f"]):6}{cnt(r["m"]):6}{cnt(r["s"]):6}{len(r.get("pairs", [])):6}{len(r.get("doubles", [])):8}')
    missing = [cc for cc in ALL if cc not in countries]
    if missing:
        print('Без данных (равные веса, как раньше):', ', '.join(missing))
    if shares:
        print('Доли фамилий:', ', '.join(f'{cc} {len(v)}' for cc, v in shares.items()))
    for line in notes:
        print('  ' + line)

    data = {'build': 271, 'sources': sources, 'countries': {cc: countries[cc] for cc in ALL if cc in countries}, 'shares': shares}
    if write:
        body = ',\n'.join(f' {json.dumps(cc)}:' + json.dumps(v, ensure_ascii=False, separators=(',', ':')) for cc, v in data['countries'].items())
        text = ("'use strict';\n// Сборка 271: частоты имён и фамилий по странам. Сгенерировано tools/names271_freq_build.py из черновых "
                "списков (docs/names271, freq-*.json) — руками не править, пересобрать скриптом.\n"
                "// f, m: «частота:эпохи» → имена через |; частота 1–3 (3 — самые частые), эпохи — когда имя давали: old до ~1965, "
                "mid ~1960–1985, modern ~1985–2010, new с ~2005.\n// s: частота → фамилии; pairs — пары «Иван Иванов», "
                "doubles — имя, которое бывает и фамилией («Томас Томас»); shares — доли фамилий в Корее и Китае, %.\n"
                "const namesFreq271Data={build:271,sources:" + json.dumps(sources, ensure_ascii=False, separators=(',', ':')) + ",countries:{\n" + body +
                "\n},shares:" + json.dumps(shares, ensure_ascii=False, separators=(',', ':')) + "};\n")
        with open(os.path.join(ROOT, 'names271-freq-data.js'), 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'\nnames271-freq-data.js: {len(text.encode("utf-8")) // 1024} КБ')
    return data


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    build(args[0] if args else os.environ.get('NAMES271_DIR', DEFAULT_DIR), write='--check' not in sys.argv)
