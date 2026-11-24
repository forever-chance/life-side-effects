#!/usr/bin/env python3
"""Каталог фильмов: docs/films.csv → films269-data.js.
   python3 tools/films_csv.py
Таблицу удобно править в любом редакторе таблиц (UTF-8, запятые). Колонки:
id, название, оригинал, режиссёр, год, месяц (1–12 или пусто), страна (производства), жанр, возраст (6+/12+/16+/18+),
топ-250 (место или пусто), анонс («да», если фильм на момент составления только анонсирован), прокат («Любая» или
название страны из игры, где фильм идёт только там), описание.
Детский фильм — возраст 6+. Новый фильм — новая строка с новым id (F0505 и дальше); id не переиспользовать,
на них ссылаются сохранения («смотрели», «любимый фильм»)."""
import csv, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'films.csv')
OUT = os.path.join(ROOT, 'films269-data.js')
GENRES = {'Драма', 'Анимация', 'Комедия', 'Боевик', 'Фантастика', 'Триллер', 'Криминал', 'Приключения', 'Хоррор', 'Фэнтези',
          'Военный', 'Исторический', 'Детектив', 'Биография', 'Мелодрама', 'Мюзикл', 'Вестерн'}


def main():
    rows = list(csv.DictReader(open(SRC, encoding='utf-8-sig')))
    films, seen, errors = [], set(), []
    for n, r in enumerate(rows, 2):
        fid = r['id'].strip()
        if not re.fullmatch(r'F\d{4}', fid) or fid in seen:
            errors.append(f'строка {n}: id «{fid}» пустой, кривой или повторяется')
        seen.add(fid)
        age = int(r['возраст'].strip().rstrip('+') or 0)
        if age not in (6, 12, 16, 18):
            errors.append(f'строка {n}: возраст «{r["возраст"]}» — нужно 6+, 12+, 16+ или 18+')
        if r['жанр'] not in GENRES:
            errors.append(f'строка {n}: жанр «{r["жанр"]}» — в игре нет такого жанра')
        f = {'id': fid, 'title': r['название'].strip(), 'original': r['оригинал'].strip(), 'director': r['режиссёр'].strip(),
             'year': int(r['год']), 'origin': r['страна'].strip(), 'genre': r['жанр'].strip(), 'minAge': age,
             'country': r['прокат'].strip() or 'Любая', 'summary': r['описание'].strip()}
        if r['месяц'].strip():
            f['month'] = int(r['месяц'])
            if not 1 <= f['month'] <= 12:
                errors.append(f'строка {n}: месяц {f["month"]}')
        if r['топ-250'].strip():
            f['top250'] = int(r['топ-250'])
        if r['анонс'].strip().lower() == 'да':
            f['announced'] = True
        films.append(f)
    if errors:
        print('\n'.join(errors))
        sys.exit(1)
    body = ',\n'.join(json.dumps(f, ensure_ascii=False, separators=(',', ':')) for f in films)
    with open(OUT, 'w', encoding='utf-8') as out:
        out.write("'use strict';\n// Каталог фильмов (сборка 269). Собирается из docs/films.csv: python3 tools/films_csv.py — руками не править.\n"
                  '// IMDb Top 250 на 1 января 2026, новинки 2022–2026, анонсы 2027–2029 по состоянию на ноябрь 2026.\n'
                  '// month — месяц выхода, если известен; announced — фильм был только анонсирован, дата может сдвинуться;\n'
                  "// country — где фильм идёт: 'Любая' или название страны; детские фильмы — minAge 6.\n"
                  'const filmCatalog269=[\n' + body + '\n];\n')
    print(f'{len(films)} фильмов → {os.path.relpath(OUT, ROOT)}')


main()
