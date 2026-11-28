#!/usr/bin/env python3
"""Сборка 271.1: собирает docs/names271/org-roots.json из одобренных данных docs/names271/roots285/<cc>.json.

   python3 tools/org271_merge.py [--check]

Берёт у каждой страны корни (с привязкой types — точные типы, biz — варианты своего дела, tone, gloss), типы (с numbered
для «Школа № N»), долю mix по сферам и варианты своего дела страны (business-options.json). Теги (tags, kindTags,
specialtyTags) переносятся из прежнего org-roots.json: они остаются запасным путём, если для типа или варианта
корней нет. Файлы *.rejected.json и *.spec-rejected.json — отклонённое, в сборку не входят; здесь они только
сверяются: ни одна отклонённая пара «Тип «Корень»» не должна получиться из привязки.
Дальше — python3 tools/org271_build.py (org271-data.js). Данные одобрены владелицей, здесь они не правятся.
"""
import json, os, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'docs', 'names271')
SRC = os.path.join(D, 'roots285')
OUT = os.path.join(D, 'org-roots.json')
ALL = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx', 'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl']


def main():
    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    opts = json.load(open(os.path.join(SRC, 'business-options.json'), encoding='utf-8'))
    countries, errors = {}, []
    for cc in ALL:
        j = json.load(open(os.path.join(SRC, cc + '.json'), encoding='utf-8'))
        if j.get('cc') != cc: errors.append('%s: в файле cc=%s' % (cc, j.get('cc')))
        types = {}
        names = set()
        for f, rows in j['types'].items():
            types[f] = []
            for t in rows:
                row = {'type': t['type'], 'fit': t['fit']}
                if t.get('numbered'): row['numbered'] = True
                types[f].append(row)
                names.add(t['type'])
        ids = [x['id'] for x in opts[cc]]
        rejected = set()
        for suffix in ('.rejected.json', '.spec-rejected.json'):
            p = os.path.join(SRC, cc + suffix)
            if os.path.exists(p): rejected |= {x['pair'] for x in json.load(open(p, encoding='utf-8'))}
        roots = []
        for r in j['roots']:
            row = {'root': r['root'], 'fit': r['fit'], 'kind': r['kind'], 'gloss': r.get('gloss', ''), 'tone': r['tone'],
                   'types': r['types'], 'biz': r['biz']}
            for t in r['types']:
                if t not in names: errors.append('%s: у корня «%s» неизвестный тип «%s»' % (cc, r['root'], t))
                if '%s «%s»' % (t, r['root']) in rejected: errors.append('%s: отклонённая пара %s «%s»' % (cc, t, r['root']))
            for b in r['biz']:
                if b not in ids: errors.append('%s: у корня «%s» вариант дела «%s» не из business-options' % (cc, r['root'], b))
            roots.append(row)
        countries[cc] = {'roots': roots, 'types': types, 'mix': j['mix'], 'bizOptions': ids}
    for e in errors: print('ОШИБКА: ' + e)
    if errors: sys.exit(1)
    out = {'_about': 'Корни названий организаций, сборка 271.1. Собрано tools/org271_merge.py из roots285/<cc>.json, руками не править. '
                     'Корень привязан к точным типам (types) и вариантам своего дела (biz); нумерованные типы («Школа № N», numbered) корней не имеют. '
                     'Теги (tags, kindTags, specialtyTags, fit) — запасной путь, когда привязки нет. mix[сфера] — доли видов корней (meaning/loan/local) и банальных (banal).',
           'tags': old['tags'], 'kindTags': old['kindTags'], 'specialtyTags': old['specialtyTags'], 'countries': countries}
    n = sum(len(c['roots']) for c in countries.values())
    print('стран %d, корней %d, типов %d' % (len(countries), n, sum(len(v) for c in countries.values() for v in c['types'].values())))
    if '--check' in sys.argv: return
    with open(OUT, 'w', encoding='utf-8') as fh:
        dump = lambda v: json.dumps(v, ensure_ascii=False, separators=(',', ':'))
        fh.write('{\n' + ',\n'.join('"%s":%s' % (k, dump(v)) for k, v in out.items() if k != 'countries') + ',\n"countries":{\n' +
                 ',\n'.join('"%s":%s' % (k, dump(v)) for k, v in countries.items()) + '}\n}\n')
    print('записано ' + OUT)


main()
