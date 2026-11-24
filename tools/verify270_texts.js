// Проверки сборки 270, часть texts270.js: «вы» в событиях каталогов, строки с лишней ё после yo_fix 268,
// словарь ё без омографов, старые сохранения.
// Игра раздаётся с диска:  node tools/verify270_texts.js
// После старта жизни подгружаются файлы 270, которых ещё нет в index.html, в порядке финальной сборки.
// Полная сверка книг и пьес с редакторским каталогом v33 — если он есть на диске (V33_JSON=путь/game_content.json).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const ORDER270 = ['films269.js', 'display269.js', 'notices270.js', 'family270.js', 'social270.js', 'jobs270.js', 'strip270.js', 'texts270.js'];

async function page(browser, cfg) {
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  for (const [k, v] of Object.entries(cfg))
    await pg.evaluate(([k, v]) => { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  const loaded = [];
  for (const f of ['pets260.js', 'holidays260.js', 'habits261.js', 'creative262.js', 'business263.js', 'save264.js', 'business265.js', 'business266.js', 'taxes266.js', 'feed267.js', ...ORDER270]) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    if (!(await pg.evaluate(f => [...document.scripts].some(x => x.src.includes(f)), f))) { await pg.addScriptTag({ path: path.join(ROOT, f) }); loaded.push(f); }
  }
  await pg.evaluate(helpers);
  return { pg, errors, ctx, loaded };
}

// Помощники внутри страницы.
function helpers() {
  const L = 'А-Яа-яЁё';
  const pron = new RegExp('(?<![' + L + '])(ты|тебя|тебе|тобой|тобою|твой|твоя|твоё|твое|твои|твоего|твоей|твоих|твоим|твоими|твою|твоему|твоём|твоем)(?![' + L + '])', 'i');
  const verb = new RegExp('(?<![' + L + '])([' + L + ']{2,}(?:ешь|ёшь|ишь)(?:ся)?)(?![' + L + '])', 'gi');
  const ok = new Set(['лишь', 'брешь', 'тишь', 'глушь', 'мышь', 'чушь']);
  window.T = {
    // «Ты» в повествовании: местоимения и глаголы 2-го лица вне «ёлочек» (как tools/text_audit.py).
    ty(text) { const t = String(text ?? '').replace(/«[^»]*»/g, ''); return pron.test(t) || (t.match(verb) || []).some(w => !ok.has(w.toLowerCase())); },
    mk(role, age, gender) {
      const p = person(role, age, gender, s.country); p.city18 = residenceCity(); enrichPerson(p); s.people.push(p); return p;
    },
    modal() { return { open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join('\n'), buttons: [...document.querySelectorAll('#modal .options button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }; },
    click(re) { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; },
    out(id) { for (const e of catalog245.events) for (const c of e.choices) for (const o of c.outcomes) if (o.id === id) return o.text; return null; },
    event(id) { return catalog245.events.find(e => e.id === id); },
    // Запись журнала с этим заголовком среди последних (рутина уходит в «Будни», s.log[0] может быть чужой).
    logged(title) { return s.log.slice(0, 12).find(e => e.title === title) || null; },
    calm() { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; }
  };
}

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 500))); };

// Данные каталогов с диска, как JSON.
function readConst(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8'), head = 'const ' + name + '=';
  return JSON.parse(src.slice(src.indexOf(head) + head.length, src.lastIndexOf(';')));
}
const catalog = readConst('catalog245-data.js', 'catalog245');
const business = readConst('business-events254-data.js', 'businessEvents254');
const ids = events => events.flatMap(e => [e.id, ...(e.choices || []).flatMap(c => [c.id, ...(c.outcomes || []).map(o => o.id)])]);

// Тексты v33 (game_content.json, книги «О чём книга», пьесы «Название»/«О чём пьеса»), в которые yo_fix 268 поставил лишнюю ё.
const V33 = {
  B0022: ['summary', 'Подросток Бриони неверно истолковывает отношения сестры Сесилии и Робби, разрушая их судьбы ложным обвинением.'],
  B0381: ['title', 'Час звезды'],
  B0453: ['summary', 'Повествовательница размышляет о жизни и смерти старшей сестры, умершей вскоре после рождения, через белые предметы и образы.'],
  B0529: ['summary', 'Писательница Эди Бёрчилл получает давно потерянное письмо и отправляется в замок Милдерхерст, где три пожилые сестры скрывают историю своей семьи.'],
  B0843: ['summary', 'Китнисс Эвердин добровольно занимает место сестры в смертельных телевизионных Играх в государстве Панем.'],
  B1199: ['summary', 'Две сводные сестры получают разные испытания: доброта Баванг Путих помогает ей найти счастье, а зависть Баванг Мерах приводит к неприятностям.'],
  P0017: ['title', 'Три сестры'],
  P0222: ['summary', 'Две сестры обращаются в полицию за помощью, чтобы Фиона могла уйти от мужа, применяющего насилие. Сержант Симмондс и молодой констебль Росс используют своё положение, и переезд превращается в жестокую трагедию.'],
  P0269: ['summary', 'Бывший пастор Росмерс и Ребекка Вест пытаются освободиться от прошлого, но их преследует вина за смерть его жены.']
};
// Как эти места выглядели после yo_fix 268: в коде игры их быть не должно (кроме таблицы замен для старых сохранений).
const BROKEN = ['Три сёстры', 'Час звёзды', 'смерть его жёны', 'отношения сёстры', 'старшей сёстры', 'пожилые сёстры', 'место сёстры', 'сводные сёстры', 'Две сёстры', 'Если партнёр узнаёт'];

(async () => {
  // 1. Данные и код на диске.
  {
    const works = new Map([...catalog.books, ...catalog.plays].map(w => [w.id, w]));
    const bad = Object.entries(V33).filter(([id, [f, v]]) => works.get(id)?.[f] !== v).map(([id, [f]]) => id + '.' + f + ': ' + works.get(id)?.[f]);
    check('каталог: 9 строк совпадают с v33 («сестры», «звезды», «жены» без ё)', !bad.length, bad);
    const v33 = process.env.V33_JSON;
    if (v33 && fs.existsSync(v33)) {
      const d = JSON.parse(fs.readFileSync(v33, 'utf8')), ref = new Map([...d.books, ...d.plays].map(w => [w.ID, w])), diff = [];
      for (const w of works.values()) {
        const r = ref.get(w.id), sum = w.id[0] === 'B' ? 'О чём книга' : 'О чём пьеса';
        if (!r) { diff.push(w.id + ': нет в v33'); continue; }
        for (const [f, k] of [['title', 'Название'], ['author', 'Автор'], ['summary', sum]]) if (w[f] !== r[k]) diff.push(w.id + '.' + f);
      }
      check('каталог: все ' + works.size + ' книг и пьес совпадают с v33 по названию, автору и описанию', !diff.length, diff);
    } else console.log('skip каталог: полная сверка с v33 — задайте V33_JSON=путь/game_content.json');
    const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    check('театральная студия: «Три сестры» без ё', /'Три сестры'/.test(src('language-clubs53.js')) && !/Три сёстры/.test(src('language-clubs53.js')));
    check('тайные отношения: «Если партнёр узнает» (будущее время)', /Если партнёр узнает, это ударит/.test(src('romance63.js')));
    check('досье: «При вашем рождении»', /При вашем рождении/.test(src('dossier87.js')) && !/твоём/.test(src('dossier87.js')));
    const left = fs.readdirSync(ROOT).filter(f => f.endsWith('.js') && f !== 'texts270.js').flatMap(f => BROKEN.filter(b => src(f).includes(b)).map(b => f + ': ' + b));
    check('нигде в игре нет строк, испорченных yo_fix 268', !left.length, left);
  }

  // 2. Инструменты: словарь ё без омографов, yo_fix их не трогает, аудит 0/0/0 с событиями каталогов.
  {
    const py = code => execFileSync('python3', ['-c', code], { cwd: ROOT, encoding: 'utf8' });
    const dict = JSON.parse(py(`
import json
src=open('tools/text_audit.py',encoding='utf-8').read().replace('\\nmain()\\n','\\n')
a={'__file__':'tools/text_audit.py'};exec(compile(src,'ta','exec'),a)
print(json.dumps({'yo':a['YO'],'homo':sorted(a['YO_HOMOGRAPHS'])},ensure_ascii=False))`));
    const homo = ['сёстры', 'сёстрам', 'звёзды', 'жёны', 'слёзы', 'узнаёт', 'узнаёте', 'мёд'];
    check('text_audit: омографов нет в словаре ё', homo.every(w => !dict.yo.includes(w)) && homo.every(w => dict.homo.includes(w)) && dict.yo.includes('ещё'), dict.homo);
    const fixed = JSON.parse(py(`
import json,sys,importlib.util
sys.argv=['yo_fix.py']
spec=importlib.util.spec_from_file_location('yo','tools/yo_fix.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
t=["'Три сестры'","'Час звезды'","'смерть его жены'","'место сестры'","'Если партнёр узнает, это ударит по доверию.'","'до слезы'","'еще идет'"]
print(json.dumps({'out':[m.fix_text(x)[0] for x in t],'skip':sorted(m.SKIP)},ensure_ascii=False))`));
    check('yo_fix: омографы не трогает, обычные слова правит', fixed.out.slice(0, 6).join('|') === "'Три сестры'|'Час звезды'|'смерть его жены'|'место сестры'|'Если партнёр узнает, это ударит по доверию.'|'до слезы'" && fixed.out[6] === "'ещё идёт'", fixed.out);
    check('yo_fix: каталоги v33 пропускает', fixed.skip.includes('catalog245-data.js') && fixed.skip.includes('business-events254-data.js'), fixed.skip);
    const audit = execFileSync('python3', ['tools/text_audit.py'], { cwd: ROOT, encoding: 'utf8' });
    const n = rule => Number((audit.match(new RegExp('\\n' + rule + ': (\\d+)')) || [])[1]);
    const events = Number((audit.match(/и (\d+) строк событий каталогов/) || [])[1]);
    check('text_audit: «ты» 0 (вместе с ' + events + ' строками событий каталогов), имена после предлогов 0, род NPC 0',
      n('ты в повествовании') === 0 && n('имя после предлога') === 0 && n('род NPC без выбора по полу') === 0 && events > 1500, audit.slice(0, 400));
  }

  const browser = await chromium.launch();
  try {
    const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'nl' });
    console.log('подгружено после старта: ' + (loaded.join(', ') || 'ничего'));

    // 3. Замены при загрузке: все 68 мест, id не меняются, данные на «вы».
    const load = await pg.evaluate(() => {
      const all = e => [e.title, e.text, ...(e.choices || []).flatMap(c => [c.title || c.label, ...(c.outcomes || []).map(o => o.text)])];
      const ids = events => events.flatMap(e => [e.id, ...(e.choices || []).flatMap(c => [c.id, ...(c.outcomes || []).map(o => o.id)])]);
      return {
        applied: textsApplied270, expected: [...catalogTexts270, ...businessTexts270].reduce((n, r) => n + r.ids.length, 0),
        tyCatalog: catalog245.events.flatMap(e => all(e).filter(T.ty).map(t => e.id + ': ' + t)),
        tyBusiness: businessEvents254.flatMap(e => all(e).filter(T.ty).map(t => e.id + ': ' + t)),
        catalogIds: ids(catalog245.events), businessIds: ids(businessEvents254),
        index: businessIndex254.E0104 === businessEvents254.find(e => e.id === 'E0104') && businessIndex254.E0104.text,
        e0098: T.event('E0098').text, e0057: T.out('E0057_C01_primary'), e0036: T.out('E0036_C02_primary'),
        // Без notices270: в данных прежний текст — замена срабатывает; текст, который переписала редакция, не трогается.
        direct: (() => {
          const o = catalog245.events.find(e => e.id === 'E0038').choices[1].outcomes[0], r = catalogTexts270.find(r => r.ids.includes(o.id)), keep = o.text;
          o.text = r.from; const a = applyTexts270(), got = o.text;
          o.text = 'Новый текст редакции.'; const b = applyTexts270(), kept = o.text; o.text = keep;
          return { a, got: got === r.to, b, kept };
        })()
      };
    });
    check('замены: все ' + load.expected + ' мест (45 в каталоге, 23 в своём деле) получили текст на «вы»', load.applied === load.expected && load.expected === 68, load);
    check('замены: в 21 событии каталога нет «ты» — ни в текстах, ни в исходах', load.tyCatalog.length === 0, load.tyCatalog);
    check('замены: в 308 событиях своего дела нет «ты»', load.tyBusiness.length === 0, load.tyBusiness);
    check('замены: id событий, выборов и исходов те же, что в данных', JSON.stringify(load.catalogIds) === JSON.stringify(ids(catalog.events)) && JSON.stringify(load.businessIds) === JSON.stringify(ids(business)));
    check('замены: в данных на диске прежние тексты v33 (правка только на экране)', catalog.events.find(e => e.id === 'E0098').text.includes('от тебя потребуется'));
    check('замены: прежний текст из данных заменяется и без notices270, новый текст редакции не перетирается',
      load.direct.a === 1 && load.direct.got && load.direct.b === 0 && load.direct.kept === 'Новый текст редакции.', load.direct);
    check('замены: тексты на «вы» — «от вас потребуется», «Вы благодарите», индекс дела видит новый текст',
      /от вас потребуется/.test(load.e0098) && /^Вы благодарите/.test(load.e0057) && /у вас скидки/.test(load.index) && /^Вы отказываетесь участвовать и/.test(load.e0036), load);

    // 4. Показ: событие каталога (catalog245.js) — окно и запись в журнале; потом настоящий месяц.
    const show245 = await pg.evaluate(() => {
      T.calm(); s.age = 30; s.cash = 1e7;
      const f = T.mk('Друг', 30, 'f'), out = {}; out.friend = catalogFriend245(f);
      const st = catalogState245(); st.events.forEach(q => { if (q.status === 'offered') q.status = 'expired'; }); st.cooldowns = {};
      const q = catalogOffer245('E0091', { person: f.id }); out.q = !!q;
      openDecision24('catalog245', q.id); out.m = T.modal();
      const rnd = Math.random; Math.random = () => 0.99;  // запасной исход: «Друг расстроился…»
      try { out.clicked = T.click(/^Отказ/); } finally { Math.random = rnd; }
      out.log = T.logged(T.event('E0091').title)?.text;
      // Тот же выбор с основным исходом, затем «Помочь» и месяц: помощь состоялась.
      st.cooldowns = {}; const q2 = catalogOffer245('E0091', { person: f.id }); openDecision24('catalog245', q2.id);
      Math.random = () => 0; try { out.help = T.click(/^Помочь/); } finally { Math.random = rnd; }
      out.helpLog = T.logged(T.event('E0091').title)?.text; out.status = q2.status;
      T.calm(); const age = s.age, month = s.clock.month; advanceMonth(); T.calm();
      out.after = q2.status; out.moved = T.logged('Помощь с переездом')?.text || null; out.month = [month, s.clock.month];
      out.friendId = f.id;
      return out;
    });
    check('показ, catalog245: окно E0091 открыто, кнопка «Отказ» нажата', show245.q && show245.m.open && show245.clicked, show245);
    check('показ, catalog245: в журнале исход на «вы»', show245.log === 'Друг расстроился, потому что рассчитывал на вашу помощь.', show245.log);
    check('показ, catalog245: «Помочь» — запись на «вы», после настоящего месяца помощь состоялась',
      show245.help && show245.helpLog === 'Вы договорились о времени помощи и распределили задачи.' && show245.after === 'resolved' && !!show245.moved && show245.month[0] !== show245.month[1], show245);

    // 5. Показ: catalog246.js (партнёр, E0057), friends247.js (друг, E0098), workshops249.js (увлечение, E0031).
    const shows = await pg.evaluate(friendId => {
      const out = {}, rnd = Math.random, st = catalogState245();
      const clear = () => { T.calm(); st.events.forEach(q => { if (q.status === 'offered') q.status = 'expired'; }); st.cooldowns = {}; };
      clear(); const p = T.mk('Партнер', 31, 'm');
      const q1 = catalogOffer245('E0057', { person: p.id }); out.q1 = !!q1;
      if (q1) { openDecision24('catalog245', q1.id); out.m1 = T.modal(); Math.random = () => 0; try { out.c1 = T.click(/^Ответить/); } finally { Math.random = rnd; } }
      out.l1 = T.logged(T.event('E0057').title)?.text;
      clear(); const q2 = catalogOffer245('E0098', { person: friendId }); out.q2 = !!q2;
      if (q2) { openDecision24('catalog245', q2.id); out.m2 = T.modal(); Math.random = () => 0; try { out.c2 = T.click(/^Нет$/); } finally { Math.random = rnd; } }
      out.l2 = T.logged(T.event('E0098').title)?.text;
      clear(); s.hobbies.photo = Object.assign(s.hobbies.photo || { interest: 70 }, { sessions: 6, skill: Math.max(20, s.hobbies.photo?.skill || 0) });
      const q3 = catalogOffer245('E0031', { hobby: 'photo' }); out.q3 = !!q3;
      if (q3) { openDecision24('catalog245', q3.id); out.m3 = T.modal(); Math.random = () => 0; try { out.c3 = T.click(/^Пропустить/); } finally { Math.random = rnd; } }
      out.l3 = s.log.slice(0, 12).find(e => e.title === T.event('E0031').title && e.text !== T.event('E0031').text)?.text;
      T.calm(); return out;
    }, show245.friendId);
    check('показ, catalog246: E0057 — запись «Вы благодарите за сюрприз…»', shows.q1 && shows.c1 && shows.l1 === T270('E0057_C01_primary'), shows);
    check('показ, friends247: E0098 — в окне «от вас потребуется», в журнале «Вы отказываетесь участвовать.»',
      shows.q2 && /от вас потребуется/.test(shows.m2?.text) && !/тебя/.test(shows.m2?.text) && / · Вы отказываетесь участвовать\.$/.test(shows.l2 || ''), { m: shows.m2, l: shows.l2 });
    check('показ, workshops249: E0031 — в окне «по вашему хобби», в журнале «Вы пропускаете интенсив…»',
      shows.q3 && /по вашему хобби/.test(shows.m3?.text) && shows.l3 === 'Вы пропускаете интенсив и занимаетесь как обычно.', { m: shows.m3, l: shows.l3 });

    // 6. Показ: своё дело (business-events254.js) — окно и запись после настоящего месяца.
    const biz = await pg.evaluate(() => {
      T.calm(); s.age = 30; s.cash = 1e8; const out = {};
      out.ok = startEnterprise152('trade253', 'Проверка', 'BZ002'); const b = s.enterprise152; if (!b) return out;
      advanceMonth(); T.calm();
      const st = businessState254(b); st.cases.forEach(q => { if (['offered', 'proposal', 'saleProposal', 'scheduled'].includes(q.status)) q.status = 'declined'; }); st.cooldowns = {};
      const q = businessOffer254(b, 'E0104'); out.q = !!q; if (!q) { out.history = b.history?.length; return out; }
      out.log = s.log.slice(0, 12).find(e => e.title === businessIndex254.E0104.title)?.text;
      businessOpen254(q.id); out.m = T.modal(); T.calm();
      return out;
    });
    check('показ, своё дело: E0104 — «есть ли у вас скидки» в журнале и в окне',
      biz.q && /у вас скидки/.test(biz.log || '') && /у вас скидки/.test(biz.m?.text || '') && !/тебя/.test((biz.log || '') + biz.m?.text), biz);

    // 7. Год настоящих месяцев с другом, партнёром и делом: в журнале событий каталогов и дела нет «ты».
    const year = await pg.evaluate(() => {
      const titles = new Set([...catalog245.events, ...businessEvents254].map(e => e.title)), age = s.age;
      catalogState245().frequency = 'frequent';
      for (let i = 0; i < 12; i++) { T.calm(); advanceMonth(); }
      T.calm();
      const rows = s.log.filter(e => titles.has(e.title));
      return { age: [age, s.age], rows: rows.length, ty: rows.filter(e => T.ty(e.text)).map(e => e.title + ': ' + e.text) };
    });
    check('год: возраст растёт, записи событий каталогов и дела на «вы» (' + year.rows + ' записей)', year.age[1] > year.age[0] && year.ty.length === 0, year);

    // 8. Старое сохранение: тексты на «ты» и строки с лишней ё в журнале, памяти и театральной студии.
    const mig = await pg.evaluate(() => {
      T.calm(); const out = {}, f = s.people.find(p => p.alive && p.role === 'Друг');
      const old = (id, list = catalogTexts270) => list.find(r => r.ids.includes(id)).from;
      s.log.unshift({ age: s.age, year: s.year, title: 'Друг зовёт в совместный проект', text: f.name + ' · ' + old('E0098_C02_primary'), tag: 'Отношения', major: false });
      s.log.unshift({ age: s.age, year: s.year, title: 'Пригласили на любительский конкурс', text: old('E0036_C02_primary'), tag: 'Занятия', major: false });
      s.log.unshift({ age: s.age, year: s.year, title: 'Появился местный постоянный клиент', text: 'Сыр · ' + old('E0104', businessTexts270), tag: 'Своё дело', major: false });
      s.log.unshift({ age: s.age, year: s.year, title: 'Премьера · Три сёстры', text: 'Шесть месяцев репетиций закончились показом студии.', tag: 'Занятия', major: false });
      s.log.unshift({ age: s.age, year: s.year, title: 'Книга клуба', text: 'Клариси Лиспектор · «Час звёзды». Китнисс Эвердин добровольно занимает место сёстры в смертельных телевизионных Играх.', tag: 'Занятия', major: false });
      f.memories.push(s.year + ': ' + old('E0095_C01_primary'));
      save(); flushSave264();
      const id = s.saveId; s.saveId = 'texts270-other'; loadCharacter(id); T.calm();
      const g = s.people.find(p => p.id === f.id);
      out.log = s.log.slice(0, 12).map(e => e.title + ' | ' + e.text);
      out.memory = g.memories.at(-1); out.same = s.saveId === id;
      flushSave264(); out.stored = (readLife(id)?.log || []).slice(0, 12).map(e => e.title + ' | ' + e.text);
      // Театральная студия: название постановки и история (без отрисовки, как при загрузке).
      const clubs = s.clubs19; s.clubs19 = { memberships: [{ id: 't270', type: 'theatre', theatre53: { title: 'Три сёстры', history: [{ title: 'Три сёстры' }, { title: 'Ревизор' }] }, project86: { title: 'Три сёстры' } }] };
      out.clubFixed = textsMigrate270(); const m = s.clubs19.memberships[0];
      out.club = [m.theatre53.title, ...m.theatre53.history.map(h => h.title), m.project86.title]; s.clubs19 = clubs;
      out.again = textsMigrate270();
      return out;
    });
    const want = [
      'Книга клуба | Клариси Лиспектор · «Час звезды». Китнисс Эвердин добровольно занимает место сестры в смертельных телевизионных Играх.',
      'Премьера · Три сестры | Шесть месяцев репетиций закончились показом студии.',
      'Появился местный постоянный клиент | Сыр · Один из покупателей стал заходить регулярно и приводит знакомых. Он спрашивает, есть ли у вас скидки для постоянных клиентов.',
      'Пригласили на любительский конкурс | Вы отказываетесь участвовать и занимаетесь по прежнему плану.'];
    check('сохранение: после загрузки журнал на «вы» и без лишней ё (длинный исход не путается с коротким)',
      mig.same && want.every(w => mig.log.includes(w)) && mig.log.some(l => /^Друг зовёт в совместный проект \| .+ · Вы отказываетесь участвовать\.$/.test(l)) && !mig.log.some(l => /сёстр|звёзд|(^|[^А-Яа-яЁё])Ты /.test(l)), mig.log);
    check('сохранение: исправленный журнал записан обратно', JSON.stringify(mig.stored) === JSON.stringify(mig.log), mig.stored);
    check('сохранение: память близкого на «вы»', /: Вы никому не рассказываете о разговоре\./.test(mig.memory), mig.memory);
    check('сохранение: театральная студия — «Три сестры» в постановке, истории и проекте; повтор ничего не меняет',
      mig.club.join('|') === 'Три сестры|Три сестры|Ревизор|Три сестры' && mig.again === 0, mig);

    // 9. Досье: заголовок про родителей на «вы».
    const dossier = await pg.evaluate(() => { const h = dossierParents87(); return { html: h, then: /<h4>/.test(h) }; });
    check('досье: ' + (dossier.then ? '«При вашем рождении» в карточке родителей' : 'карточек родителей «тогда» нет, «твоём» не встречается'),
      !/твоём/.test(dossier.html) && (!dossier.then || /При вашем рождении/.test(dossier.html)), dossier.html.slice(0, 300));

    check('без ошибок страницы', !errors.length, errors);
    await ctx.close();
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} ok` + (failed.length ? '; не прошли: ' + failed.map(r => r.name).join('; ') : ''));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

// Ожидаемый текст исхода после замены — из texts270.js на диске.
function T270(id) {
  const src = fs.readFileSync(path.join(ROOT, 'texts270.js'), 'utf8'), m = src.match(/const catalogTexts270=(\[[\s\S]*?\n\]);/);
  return JSON.parse(m[1]).find(r => r.ids.includes(id))?.to;
}
