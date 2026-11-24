#!/usr/bin/env python3
"""Сборка 271: собирает stories271-data.js — сюжеты книг и фильмов для редактора проектов и будущих премьер.

   python3 tools/stories271_build.py [папка-с-данными] [--check] [--drop-retired]

Папка по умолчанию — docs/stories271 (можно передать свою или STORIES271_DIR). Это исходники данных, как
docs/films.csv для films269-data.js: текст сюжета или названия правится там, потом скрипт запускается заново. Читает:
  themes.json         — список ключевых слов (тем), из которых берутся keywords;
  book-*.json         — сюжеты книг, film-*.json — сюжеты фильмов. Каждый файл — список
                        {genre, format: short|full, synopsis, keywords[3–5], titles: {serious[5], ironic[5], absurd[5]}}.
Файлов может прибавляться: скрипт можно запускать сколько угодно раз. --check — только проверить, файл не писать;
STORIES271_OUT — писать не в stories271-data.js, а в другой файл (для проверки номеров на копии).

Номера. Книги — B271-0001…, фильмы — F271-0001…. Сюжет узнаётся по хешу текста краткого содержания (без лишних
пробелов). Если stories271-data.js уже есть, его сюжеты сохраняют свои номера; новые получают следующие свободные
номера по порядку хеша, поэтому порядок файлов и сюжетов в них на номера не влияет. Номера не переиспользуются:
на них ссылаются сохранения (проекты игрока, приглашения, будущие премьеры — у премьеры номер сюжета прямо в id).
Сюжет, которого больше нет во входных файлах (удалён или переписан), остаётся в данных с пометкой «снят»: в подсказки
и премьеры он не идёт, но старые сохранения по нему находят название и сюжет. --drop-retired убирает снятые сюжеты —
только пока сборка не вышла к игрокам.

Проверки (ошибка — файл не пишется, код выхода 1):
  - жанр и формат заполнены, формат short или full, ключевых слов 3–5, без повторов, все из themes.json;
  - названий ровно 5 в каждом тоне, ни одно название не повторяется во всём пуле (книги и фильмы вместе; регистр
    и е/ё не различаются), одно краткое содержание не встречается дважды;
  - название: без пробелов по краям и двойных, без точки в конце, без «ёлочек» и прямых кавычек (игра сама берёт
    название в «ёлочки»; «ёлочки» внутри названия скрипт сам меняет на „лапки“ и пишет замечание), без склейки
    через тире (« — »), не длиннее 80 знаков (столько вмещает поле названия);
  - текст по правилам игры: кириллица без латиницы, ё в словах из tools/text_audit.py, «ты» в кратком содержании
    нет (правила и список слов берутся из text_audit.py), нет «игровой модели»; содержание кончается точкой,
    вопросом, восклицанием, многоточием или «ёлочкой».
Замечания (печатаются, сборку не останавливают): «ты» в названии (в повествовании название всегда стоит
в «ёлочках»), двоеточие в названии, совпадения с названиями старого пула (catalog-data189.js) и каталога фильмов
(films269-data.js — такие названия премьеры пропускают), жанр, которого нет в редакторе проектов, слова с большой
буквы посреди предложения (проверить, что имена не склоняются).
"""
import glob, hashlib, json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DIR = os.path.join(ROOT, 'docs', 'stories271')  # 271: исходники лежат в репозитории, не во временной папке
OUT = os.environ.get('STORIES271_OUT') or os.path.join(ROOT, 'stories271-data.js')  # STORIES271_OUT — для проверок
TONES = ['serious', 'ironic', 'absurd']
PREFIX = {'book': 'B271-', 'film': 'F271-'}
# Жанры редактора проектов (story-picker189.js): у книг ещё «Нон-фикшен».
GENRES = ['Драма', 'Комедия', 'Детектив', 'Триллер', 'Хоррор', 'Научная фантастика', 'Фэнтези', 'Романтика',
          'Исторический', 'Криминальный', 'Приключения', 'Экспериментальный']
GENRES_BY_TYPE = {'book': GENRES + ['Нон-фикшен'], 'film': GENRES}
SENTENCE_OK = {'Земля', 'Земли', 'Земле', 'Землю', 'Землёй', 'Луна', 'Луны', 'Луне', 'Луну', 'Марс', 'Марса', 'Венера',
               'Венеры', 'Юпитер', 'Юпитера', 'Нептун', 'Нептуна', 'Сатурн', 'Сатурна', 'Африка', 'Африки', 'Европа',
               'Европы', 'Азия', 'Азии', 'Новый', 'Новым', 'Новом', 'Новая', 'Новой', 'Морзе', 'Олимпиада',
               'Олимпиаде', 'Олимпиады', 'Дед', 'Деда', 'Деды', 'Мороз', 'Мороза', 'Снегурочка', 'Снегурочку',
               'Рождество', 'Рождества', 'Пасха', 'Пасхи'}


def audit_rules():
    """Правила текста из tools/text_audit.py (без запуска его отчёта): «ты» и слова, которые пишутся через ё."""
    path = os.path.join(ROOT, 'tools', 'text_audit.py')
    src = open(path, encoding='utf-8').read()
    ns = {'__file__': path, '__name__': 'text_audit_rules'}
    exec(compile(src[:src.index('\ndef main')], path, 'exec'), ns)
    return ns


def norm_space(text):
    return re.sub(r'\s+', ' ', str(text)).strip()


def story_hash(kind, synopsis):
    return hashlib.sha1((kind + '\n' + norm_space(synopsis)).encode('utf-8')).hexdigest()


def title_key(title):
    return norm_space(title).lower().replace('ё', 'е')


def js_list(path, const):
    """Читает const NAME=[...]; из файла игры как JSON (файлы данных пишутся в JSON-совместимом виде)."""
    if not os.path.exists(path):
        return None
    src = open(path, encoding='utf-8').read()
    head = 'const ' + const + '='
    if head not in src:
        return None
    start = src.index(head) + len(head)
    end = src.index('\n];', start) + 2
    return json.loads(src[start:end])


def old_titles():
    """Названия старого пула (catalog-data189.js) и каталога фильмов (films269-data.js) — для замечаний."""
    out = {}
    src = open(os.path.join(ROOT, 'catalog-data189.js'), encoding='utf-8').read()
    m = re.search(r'const storyEntries189=(\[.*?\]\]\]);', src, re.S)
    if m:
        for row in json.loads(m.group(1)):
            for t in row[5]:
                out.setdefault(title_key(t), 'старый пул ' + row[0])
    films = os.path.join(ROOT, 'films269-data.js')
    if os.path.exists(films):
        for m in re.finditer(r'"title":"((?:\\.|[^"\\])*)"', open(films, encoding='utf-8').read()):
            out[title_key(json.loads('"' + m.group(1) + '"'))] = 'каталог фильмов'
    return out


def build(src_dir, write=True, drop_retired=False):
    rules = audit_rules()
    themes = json.load(open(os.path.join(src_dir, 'themes.json'), encoding='utf-8'))
    theme_set = set(themes)
    errors, notes = [], []
    stories = []
    for kind in ('book', 'film'):
        for path in sorted(glob.glob(os.path.join(src_dir, kind + '-*.json'))):
            name = os.path.basename(path)
            try:
                rows = json.load(open(path, encoding='utf-8'))
            except Exception as e:  # файл ещё дописывается
                errors.append(f'{name}: не читается как JSON ({e})')
                continue
            for i, x in enumerate(rows):
                stories.append((kind, f'{name}#{i + 1}', x))

    def text_rules(where, text, kind_of):
        if re.search(r'[A-Za-z]', text):
            errors.append(f'{where}: латиница в тексте: {text[:80]}')
        if re.search(r'игров\w*\s+модел', text, re.I):
            errors.append(f'{where}: «игровая модель» в тексте')
        for m in rules['YO_RE'].finditer(text):
            errors.append(f'{where}: «{m.group(1)}» — нужно «{rules["YO_E"][m.group(1).lower()]}»')
        if rules['second_person'](text):
            (notes if kind_of == 'title' else errors).append(f'{where}: «ты» — {text[:100]}' +
                                                            (' (в повествовании название в «ёлочках»)' if kind_of == 'title' else ''))

    seen_titles, seen_hash = {}, {}
    clean = []
    for kind, where, x in stories:
        bad = len(errors)
        if not isinstance(x, dict):
            errors.append(f'{where}: не объект')
            continue
        genre, fmt, synopsis = norm_space(x.get('genre', '')), x.get('format'), x.get('synopsis', '')
        if not genre:
            errors.append(f'{where}: нет жанра')
        elif genre not in GENRES_BY_TYPE[kind]:
            notes.append(f'{where}: жанра «{genre}» нет в редакторе проектов — появится в списке жанров сам')
        if fmt not in ('short', 'full'):
            errors.append(f'{where}: формат «{fmt}» — нужно short или full')
        if not isinstance(synopsis, str) or len(norm_space(synopsis)) < 60:
            errors.append(f'{where}: краткое содержание пустое или короче 60 знаков')
            synopsis = str(synopsis or '')
        if synopsis != synopsis.strip() or '  ' in synopsis:
            errors.append(f'{where}: лишние пробелы в кратком содержании')
        if not re.search(r'[.!?…»]$', synopsis.strip()):
            errors.append(f'{where}: краткое содержание не кончается точкой')
        text_rules(where, synopsis, 'synopsis')
        for m in re.finditer(r'(?<=[^.!?…\s] )([А-ЯЁ][а-яё]+)', re.sub(r'«[^»]*»', '', synopsis)):
            if m.group(1) not in SENTENCE_OK:
                notes.append(f'{where}: «{m.group(1)}» с большой буквы посреди предложения — если это имя, оно не склоняется')
        kw = x.get('keywords')
        if not isinstance(kw, list) or not 3 <= len(kw) <= 5:
            errors.append(f'{where}: ключевых слов {len(kw) if isinstance(kw, list) else 0} — нужно от 3 до 5')
            kw = kw if isinstance(kw, list) else []
        if len(set(kw)) != len(kw):
            errors.append(f'{where}: ключевые слова повторяются')
        for k in kw:
            if k not in theme_set:
                errors.append(f'{where}: ключевого слова «{k}» нет в themes.json')
        titles = x.get('titles') if isinstance(x.get('titles'), dict) else {}
        if set(titles) != set(TONES):
            errors.append(f'{where}: тона названий {sorted(titles)} — нужно {TONES}')
        flat = []
        for tone in TONES:
            lst = titles.get(tone) or []
            if len(lst) != 5:
                errors.append(f'{where}: в тоне {tone} {len(lst)} названий — нужно 5')
            for t in lst:
                w = f'{where} {tone}'
                if not isinstance(t, str) or not t.strip():
                    errors.append(f'{w}: пустое название')
                    continue
                if t != t.strip() or '  ' in t:
                    errors.append(f'{w}: лишние пробелы в «{t}»')
                if len(t) > 80:
                    errors.append(f'{w}: длиннее 80 знаков: {t}')
                if t.endswith('.'):
                    errors.append(f'{w}: точка в конце названия: {t}')
                if re.search(r'«[^«»]*»', t):
                    # Название в игре стоит в «ёлочках», кавычки внутри — «лапки»: «Частица „не“ в отпуске».
                    fixed = re.sub(r'«([^«»]*)»', r'„\1“', t)
                    notes.append(f'{w}: кавычки внутри названия → {fixed}')
                    lst[lst.index(t)] = t = fixed
                if re.search(r'[«»"]', t):
                    errors.append(f'{w}: кавычки в названии (игра сама ставит «ёлочки», внутри — „лапки“): {t}')
                if re.search(r'\s[—–-]\s', t):
                    errors.append(f'{w}: название склеено через тире: {t}')
                if ':' in t:
                    notes.append(f'{w}: двоеточие в названии: {t}')
                text_rules(w, t, 'title')
                key = title_key(t)
                if key in seen_titles:
                    errors.append(f'{w}: название «{t}» уже есть — {seen_titles[key]}')
                else:
                    seen_titles[key] = where
                flat.append(t)
        h = story_hash(kind, synopsis)
        if h in seen_hash:
            errors.append(f'{where}: то же краткое содержание, что в {seen_hash[h]}')
        seen_hash[h] = where
        if len(errors) == bad:
            clean.append({'kind': kind, 'hash': h, 'genre': genre, 'format': fmt, 'synopsis': norm_space(synopsis),
                          'keywords': list(kw), 'titles': [list(titles[t]) for t in TONES]})

    olds = old_titles()
    for x in clean:
        for lst in x['titles']:
            for t in lst:
                if title_key(t) in olds:
                    notes.append(f'«{t}» совпадает с названием: {olds[title_key(t)]}')

    # Номера: прежние — из stories271-data.js, новые — следующие по порядку хеша.
    prev = js_list(OUT, 'storyPool271') or []
    by_hash, used_num = {}, collections.defaultdict(int)
    for row in prev:
        sid, kind = row[0], row[1]
        by_hash[story_hash(kind, row[4])] = row
        used_num[kind] = max(used_num[kind], int(sid.split('-')[1]))
    out_rows, kept, added = [], 0, 0
    current = set()
    for x in sorted(clean, key=lambda x: (x['kind'], x['hash'])):
        old = by_hash.get(x['hash'])
        if old:
            sid = old[0]
            kept += 1
        else:
            used_num[x['kind']] += 1
            sid = PREFIX[x['kind']] + f'{used_num[x["kind"]]:04d}'
            added += 1
        current.add(x['hash'])
        out_rows.append([sid, x['kind'], x['genre'], x['format'], x['synopsis'], x['keywords'], *x['titles']])
    retired = [row for row in prev if story_hash(row[1], row[4]) not in current]
    if retired and not drop_retired:
        for row in retired:
            out_rows.append(row[:9] + [1])
        notes.append('сняты (остаются только для старых сохранений): ' + ', '.join(r[0] for r in retired))
    elif retired:
        notes.append('сняты и убраны (--drop-retired): ' + ', '.join(r[0] for r in retired))
    out_rows.sort(key=lambda r: (r[1] != 'book', r[0]))

    for n in notes:
        print('замечание:', n)
    for e in errors:
        print('ОШИБКА:', e)
    active = [r for r in out_rows if len(r) < 10]
    counts = collections.Counter((r[1], r[2], r[3]) for r in active)
    for kind in ('book', 'film'):
        genres = sorted({g for (k, g, f) in counts if k == kind})
        print(f'{kind}: {sum(v for (k, _, _), v in counts.items() if k == kind)} сюжетов — ' +
              ', '.join(f'{g} {counts[(kind, g, "short")]}/{counts[(kind, g, "full")]}' for g in genres))
    print(f'названий: {len(seen_titles)}, номера сохранены: {kept}, новые: {added}, снятые: {len(retired)}, '
          f'ошибок: {len(errors)}, замечаний: {len(notes)}')
    if errors:
        print('Файл не записан: сначала исправьте ошибки.')
        return 1
    if not write:
        return 0
    lines = ["'use strict';",
             '// Сборка 271: сюжеты книг и фильмов. Собирает tools/stories271_build.py из docs/stories271/*.json — руками не править.',
             '// [id, book|film, жанр, short|full, краткое содержание, [ключевые слова], [5 серьёзных], [5 с иронией], [5 абсурдных], 1 = снят].',
             '// Номера не переиспользуются: на них ссылаются сохранения. Снятый сюжет нужен только старым сохранениям.',
             'const storyThemes271=' + json.dumps(themes, ensure_ascii=False, separators=(',', ':')) + ';',
             'const storyPool271=[']
    lines.append(',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in out_rows))
    lines.append('];')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('Записано:', os.path.relpath(OUT, ROOT), f'({os.path.getsize(OUT) // 1024} КБ)')
    return 0


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    sys.exit(build(args[0] if args else os.environ.get('STORIES271_DIR', DEFAULT_DIR),
                   write='--check' not in sys.argv, drop_retired='--drop-retired' in sys.argv))
