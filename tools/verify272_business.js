// Проверки сборки 272, часть «своё дело» (business272-data.js, business272.js) — отзывы владелицы из жизни издателя:
// 1) виды дела: 24 профиля на 16 видов, тексты общих событий по виду (издательство без «клиентов» и «наплыва
//    покупателей», кинотеатр — зрители), события, которым не место, не приходят; таблица соответствия — FIT=1;
// 2) расширение по виду: серия / вторая команда / маршрут / линия без аренды, второе помещение — там, где оно есть;
// 3) люди на точках: владелец один на все дела, сотрудники делятся между точками, предупреждения при открытии
//    второго дела и точки без людей; 3б) выработка идёт за людьми: укомплектованные дела и владелец «сам» в одном деле —
//    месяц в месяц как без 272 (все 16 видов, то же зерно), точка без людей закрыта, половина смен — ~половина выручки;
// 4) сотрудник уходит: прибавка +10/20/35%, ответ в окне, в ленте и в карточке;
// 5) предупреждения до закрытия: красный статус, «Ожидают ответа», датированное последнее предупреждение,
//    закрытие только после срока; на сохранении владелицы — что она увидела бы до закрытия; 5б) без дребезга при
//    чередовании плохих и хороших месяцев, сезонный провал — не тревога, закрытие ровно в названный срок и со ссылкой,
//    первый год, замена сотрудника через 254, своё помещение без повышения аренды, окно «Кто где работает» для старых
//    сохранений;
// 6) книги: прежний / новый издатель, своё издательство без оплаты, самиздат сразу после отказа, 2 месяца вместо 6;
//    название с двоеточием («Город: хроники») в записях об отказе и о выходе;
// 8) рецензия 272.1: панель «Моё дело» на вкладке действий (кнопки открывают дела), дело в долг — бесплатные ответы
//    событий 254 доступны, прибавка уходящего сотрудника доходит до него, сезонный провал словами квартала, один пункт
//    «Дело может закрыться», конкурент у вида со своим словом, второе дело без резерва на две зарплаты — «Вложить деньги»,
//    тексты о людях на точке без рабочих мест.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify272_business.js
// BASE=1 — без business272*.js (теги снимаются и из index.html): видно, какие проверки ловят старое поведение.
// OWNER_SAVE=путь — сохранение владелицы (по умолчанию scratchpad/owner-save.json рядом с рабочей копией, если есть).
// FIT=1 — напечатать таблицу соответствия событий и видов.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const MINE = ['business272-data.js', 'business272.js'];
const OWNER = process.env.OWNER_SAVE || [path.join(ROOT, '..', 'owner-save.json')].find(f => fs.existsSync(f)) || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (ok || extra === '' ? '' : ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)))); };

async function open(browser, { plain = false } = {}) {
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    // BASE: index.html без тегов business272*.js (с 272.1 они в index.html, иначе BASE ничего не снимал).
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && (BASE || plain) ? INDEX.replace(/<script src="business272(-data)?\.js[^"]*"><\/script>/g, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (!BASE && !plain) for (const f of MINE) if (!INDEX.includes(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  await pg.evaluate(() => {
    window.T = {
      text: () => document.querySelector('#modal')?.innerText || '',
      title: () => document.querySelector('#modal h2')?.textContent || '',
      buttons: () => [...document.querySelectorAll('#modal .options button')].map(b => ({ label: b.childNodes[0]?.textContent?.trim() || b.textContent.trim(), hint: b.querySelector('small')?.textContent || '', disabled: b.disabled })),
      click: re => { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent.trim())); if (!b) return false; b.click(); return true; },
      clean: () => { if ($('#modal').open) closeModal(); s.pending = []; },
      // Дело с n сотрудниками (как в стенде): люди города, без найма.
      open: (type, spec, name, n = 0, mode = 'self') => {
        s.cash = Math.max(s.cash, 1e9);
        if (!startEnterprise152(type, name, spec, ownedEnterprises168().length > 0)) return null;
        const b = s.enterprise152; b.mode263 = mode; b.staff155 = [];
        if (typeof businessState254 === 'function') businessState254(b); // в игре — с первого месяца (businessMonth254)
        for (let k = 0; k < n; k++) T.hire(b, k % 2 ? 'm' : 'f');
        s.pending = s.pending.filter(q => q.type !== 'bzHire272');
        return b;
      },
      hire: (b, g = 'f', name) => {
        const p = { id: 'v272-' + Math.random().toString(36).slice(2), name: name || (g === 'f' ? 'Анна Ли' : 'Марк Ли') + ' ' + (b.staff155.length + 1), role: 'Знакомый', alive: true, age: 30, gender: g,
          country: b.country, city18: b.city, privateCash: 0, bond: 40, memories: [], trait: ['', ''], inner: { trust: 50, affection: 50, strain: 0, desire: 0 } };
        s.people.push(p); b.staff155.push(p.id); return p;
      },
      month: (list, n = 1) => { for (let i = 0; i < n; i++) { s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12; for (const b of list) enterpriseLocationMonth168(b); } },
      quiet: fn => { const r = Math.random; try { return fn(); } finally { Math.random = r; } },
      seed: n => { let x = n >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; },
    };
  });
  return { pg, errors, ctx };
}
async function life(pg, country) {
  await pg.evaluate(c => {
    if (!document.querySelector('#country')) intro();
    for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }
  }, country);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&!document.querySelector('#country')");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    T.clean(); s.age = 35; s.cash = 1e9; s.skill = 60; s.illness = null;
  });
}
const has = (r, k) => r && typeof r === 'object' && k in r;
// Ошибка внутри страницы (BASE: функций 272 нет) — не обрыв прогона, а проваленные проверки раздела.
const ev = async (pg, fn, arg) => { try { return await pg.evaluate(fn, arg); } catch (e) { console.log('     (страница: ' + String(e.message).split('\n').slice(0, process.env.STACK ? 6 : 1).join(' | ') + ')'); return { error: String(e.message) }; } };

(async () => {
  console.log(BASE ? 'BASE: без business272*.js' : 'business272-data.js + business272.js' + (MINE.every(f => INDEX.includes(f)) ? ' (из index.html)' : ' (добавлены на страницу)'));
  const browser = await chromium.launch();

  // ---------- 1. Виды дела и тексты ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      if (typeof bzKind272 !== 'function') return { base: true };
      const out = { miss: [], perType: {}, profiles: Object.keys(bzKinds272).length };
      for (const [type, specs] of Object.entries(enterpriseSpecialties153)) for (const sp of Object.keys(specs)) {
        const b = { type, specialty: sp, ...(sp === 'school196' ? { school196: {} } : {}) }, k = bzKind272(b), p = bzKinds272[k];
        if (!p || !p.expand || !(p.crew > 0)) out.miss.push(type + '/' + sp + '→' + k);
        (out.perType[type] ??= new Set()).add(k);
      }
      out.types = Object.keys(enterpriseTypes152).length;
      for (const k in out.perType) out.perType[k] = [...out.perType[k]];
      // Издательство в Сиднее: общие тексты словами издательства.
      const pub = T.open('studio', 'publishing', 'Потерянные слова', 1);
      const t = x => bzText272(pub, x);
      out.pub = {
        e406: t(businessIndex254.E0406.title), e406c: t(businessIndex254.E0406.choices[0].label), e402: t(businessIndex254.E0402.title),
        e398: t(businessIndex254.E0398.text), e400: t(businessIndex254.E0400.title), e405: t(businessIndex254.E0405.title),
        busy: t(bzDefaults272.busy), self: t(bzDefaults272.mode.self), comp: t(bzDefaults272.competitor.text), first: t(bzDefaults272.firstYear[0]),
        reno: t('Сделать ремонт'), ad: t('Запустить рекламу на 3 месяца'),
      };
      // Окно «Конкурент рядом» (266) у издательства.
      s.pending = [{ type: 'competitor266', businessId: pub.id }]; resolvePending();
      out.comp266 = { text: T.text(), buttons: T.buttons().map(b => b.label) };
      T.clean();
      // Событие 254 «Популярный отзыв…» у издательства: окно и решение.
      pub.history.push({ ...pub.history.at(-1) || {}, tick: s.clock.ticks, sales: 1, costs: 0, paid: 0, production: 0 });
      const q = businessOffer254(pub, 'E0406');
      out.offer = !!q;
      if (q) { businessOpen254(q.id); out.open406 = { title: T.title(), buttons: T.buttons().map(b => b.label) }; T.clean(); }
      out.log406 = s.log.find(e => /Рецензия подняла продажи|Популярный отзыв/.test(e.title))?.title || '';
      // Кинотеатр, кафе, кафана: зрители, гости, авторские события 254 не трогаются.
      const cin = businessCatalog253.find(e => /Кинотеатр/.test(e.name) && e.country === 'Австралия') || businessCatalog253.find(e => /Кинотеатр/.test(e.name));
      const cinB = { type: 'culture253', specialty: cin.id }, cafe = { type: 'food253', specialty: businessCatalog253.find(e => e.type === 'food253').id };
      const kafana = businessCatalog253.find(e => e.name === 'Кафана'), kafE = Object.values(businessIndex254).find(e => e.businesses.includes(kafana.id) && e.kind === 'contract');
      out.cin = { kind: bzKind272(cinB), e406: bzText272(cinB, businessIndex254.E0406.title), role: bzText272(cinB, 'Клиент · Анна') };
      out.cafe = bzText272(cafe, bzDefaults272.busy);
      out.kafana = kafE ? [kafE.title, bzText272({ type: 'mixed253', specialty: kafana.id }, kafE.title)] : null;
      const fit = bzFitTable272();
      out.fitBad = fit.rows.filter(r => r.slice(1).includes('?')).map(r => r[0]);
      out.fit = fit;
      return out;
    });
    if (r.base) check(false, '1. виды дела: business272 не подключён');
    else {
      check(!r.miss.length && r.types === 16, '1. все 16 видов и их специальности — в профилях вида (' + r.profiles + ' профилей)', r.miss);
      check(r.perType.studio.includes('publishing') && r.perType.studio.includes('photo') && r.perType.culture253.includes('cinema'), '1. у студии издательство отдельно от фотостудии, кинотеатр отдельно от театра', r.perType);
      check(r.pub.e406 === 'Рецензия подняла продажи' && r.pub.e406c === 'Допечатать тираж', '1. издательство: «Популярный отзыв привёл покупателей» → «Рецензия подняла продажи», «Допечатать тираж»', r.pub);
      check(r.pub.e402 === 'Совладелец предлагает новую серию', '1. издательство: «Партнёр предлагает новую точку» → новая серия', r.pub.e402);
      const flat = Object.values(r.pub).join(' ');
      check(!/лиент|прилавк|Через дорогу|Витрин|вторую точку/.test(flat), '1. в общих текстах издательства нет клиентов, прилавка, витрины и второй точки', flat.match(/.{0,30}(лиент|прилавк|Через дорогу|Витрин|вторую точку).{0,30}/g));
      check(/издательство/.test(r.comp266.text) && !/Через дорогу/.test(r.comp266.text) && r.comp266.buttons.includes('Обновить оформление серий') && !r.comp266.buttons.includes('Сделать ремонт'),
        '1. окно «Конкурент рядом» у издательства — про издательство, ответ «Обновить оформление серий»', r.comp266);
      check(r.offer && r.open406?.title === 'Рецензия подняла продажи' && r.open406.buttons.includes('Допечатать тираж') && r.log406 === 'Рецензия подняла продажи',
        '1. событие 254 у издательства: окно, кнопка и запись в ленте — свои', { open: r.open406, log: r.log406 });
      check(r.cin.kind === 'cinema' && r.cin.e406 === 'Популярный отзыв привёл зрителей' && r.cin.role === 'Зритель · Анна', '1. кинотеатр: зрители', r.cin);
      check(r.cafe === 'Гостей больше, чем столиков и рук.', '1. кафе: гости', r.cafe);
      check(r.kafana && r.kafana[0] === r.kafana[1], '1. авторские события 254 своего дела не переписываются («Неожиданный крупный клиент» кафаны)', r.kafana);
      check(!r.fitBad.length, '1. таблица соответствия: все ячейки посчитаны', r.fitBad);
      if (process.env.FIT) {
        const k = r.fit.kinds, w = Math.max(...r.fit.rows.map(x => x[0].length));
        console.log('\nТаблица соответствия (ok — как есть, text — свой текст вида, off — не приходит, — — не про этот вид):');
        console.log(''.padEnd(w) + ' ' + k.map(x => x.slice(0, 6).padEnd(6)).join(' '));
        for (const row of r.fit.rows) console.log(row[0].padEnd(w) + ' ' + row.slice(1).map(x => String(x).slice(0, 6).padEnd(6)).join(' '));
        console.log('');
      }
    }
    check(!errors.length, '1. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 2. События не к месту и расширение по виду ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {};
      const salon = T.open('services', 'hair', 'Ножницы', 1);
      salon.history.push({ tick: s.clock.ticks, sales: 100, costs: 50, paid: 50, production: 0, cash: salon.cash });
      salon.partner158 = { id: 'x', share: .25, contribution: 1, joined: 0 };
      const st = businessState254(salon);
      st.receivables.push({ id: 'r1', amount: 10, status: 'overdue' });
      out.salon402 = businessEligible254(salon, businessIndex254.E0402);
      salon.branch159 = { space: 'standard', price: 1, opened: 0 };
      out.salon402branch = businessEligible254(salon, businessIndex254.E0402);
      delete salon.branch159; delete salon.partner158;
      out.salon405 = businessEligible254(salon, businessIndex254.E0405);
      const craftId = businessCatalog253.find(e => e.type === 'craft253' && enterpriseAvailable253(e.id))?.id;
      // Издательство: серия вместо второй точки.
      const pub = T.open('studio', 'publishing', 'Корешок', 0);
      branchMenu159(pub);
      out.pubMenu0 = { title: T.title(), text: T.text(), buttons: T.buttons() };
      T.clean();
      T.hire(pub); T.hire(pub, 'm');
      pub.cash = 1e7;
      branchMenu159(pub);
      out.pubMenu = { title: T.title(), buttons: T.buttons() };
      out.pubBuy = T.click(/^Запустить новую серию/);
      out.unit = !!pub.branch159?.unit272;
      T.clean();
      T.month([pub], 2);
      const h = pub.history.at(-1);
      out.pubMonth = { branchRent: h.branchRent, branch272: h.branch272, branchSales: h.branchSales };
      selectEnterprise168(pub.id); enterpriseMenu152();
      out.pubCard = T.text(); T.clean();
      out.panel = enterprisePanel152();
      // Кинотеатр: второй кинотеатр в помещении.
      const cin = businessCatalog253.find(e => /Кинотеатр/.test(e.name) && enterpriseAvailable253(e.id));
      const cb = T.open('culture253', cin.id, 'Звёздный', 2);
      cb.cash = 1e7;
      branchMenu159(cb);
      out.cinMenu = { title: T.title(), buttons: T.buttons().map(b => b.label) };
      out.cinBuy = T.click(/^Обычное помещение/);
      T.clean(); T.month([cb], 1);
      out.cinRent = cb.history.at(-1).branchRent;
      // Ферма: участок; старый филиал издательства — по-прежнему с арендой.
      out.farm = typeof bzProfile272 === 'function' ? bzProfile272({ type: 'farm253', specialty: businessCatalog253.find(e => e.type === 'farm253').id }).expand.label : 'Купить вторую точку';
      const old = T.open('studio', 'publishing', 'Старый знак', 1);
      old.branch159 = { space: 'standard', price: 1, opened: s.clock.ticks };
      T.month([old], 1);
      out.oldRent = old.history.at(-1).branchRent;
      return out;
    });
    if (!has(r, 'salon402')) check(false, '2. нет данных');
    else {
      check(r.salon402 === true && r.salon402branch === false, '2. «Партнёр предлагает новую точку» не приходит, если расширение уже есть', r);
      check(r.salon405 === false, '2. «Крупный клиент не оплатил счёт» не приходит парикмахерской', r.salon405);
      check(r.pubMenu0?.title === 'Новая серия' && /Работать там некому/.test(r.pubMenu0.text) && r.pubMenu0.buttons.find(b => /^Запустить новую серию/.test(b.label))?.disabled === true &&
        r.pubMenu0.buttons.some(b => b.label === 'Нанять сотрудника') && !r.pubMenu0.buttons.some(b => /помещение/.test(b.label)),
        '2. издательство без людей: «Новая серия» вместо второй точки, запуск недоступен, предлагает нанять', r.pubMenu0);
      check(r.pubBuy && r.unit && r.pubMonth.branchRent === 0 && r.pubMonth.branch272 && r.pubMonth.branchSales > 0, '2. серия запускается, аренды у неё нет, выручка есть', r.pubMonth);
      check(/с новой серией/.test(r.pubCard) && /в новой серии/.test(r.pubCard) && !/Точка 2/.test(r.pubCard), '2. карточка: «с новой серией», кто работает в серии', r.pubCard.slice(0, 600));
      check(/С новой серией/.test(r.panel) && !/Сеть · 2 точки/.test(r.panel.split('Корешок')[1]?.split('</button>')[0] || ''), '2. панель «Моё дело»: «С новой серией», а не «Сеть · 2 точки»');
      check(r.cinMenu.title === 'Второй кинотеатр' && r.cinMenu.buttons.includes('Компактное помещение') && r.cinBuy && r.cinRent > 0, '2. кинотеатр: второй кинотеатр в помещении с арендой', r.cinMenu);
      check(r.farm === 'Арендовать ещё участок', '2. ферма: ещё участок', r.farm);
      check(r.oldRent > 0, '2. уже купленный филиал издательства из старого сохранения — с арендой, как был', r.oldRent);
    }
    check(!errors.length, '2. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 3. Люди на точках ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {};
      const cin = businessCatalog253.find(e => /Кинотеатр/.test(e.name) && enterpriseAvailable253(e.id));
      // Один кинотеатр, владелец сам с одним сотрудником: как раньше.
      const one = T.open('culture253', cin.id, 'Один', 1);
      T.month([one], 1);
      out.one = { cap: one.history.at(-1).capacity263, cover: one.history.at(-1).cover272 };
      closeEnterprise152(one.id);
      // Один кинотеатр, владелец сам и один: держит свою точку целиком, как в 263 (точке нужно 1.4 места, но не ему).
      const solo = T.open('culture253', cin.id, 'Соло', 0);
      T.month([solo], 1);
      out.solo = { cap: solo.history.at(-1).capacity263, cover: solo.history.at(-1).cover272, mods: (solo.cases254?.modifiers || []).filter(m => m.case === 'coverage272').length };
      selectEnterprise168(solo.id); enterpriseMenu152(); out.soloCard = T.text(); T.clean();
      closeEnterprise152(solo.id);
      // Тот же кинотеатр, владелец частично (0.45 места) и без людей: точка работает треть смен.
      const half = T.open('culture253', cin.id, 'Полдня', 0, 'partial');
      T.month([half], 1);
      out.half = { cap: half.history.at(-1).capacity263, cover: half.history.at(-1).cover272 };
      selectEnterprise168(half.id); enterpriseMenu152(); out.halfCard = T.text(); T.clean();
      closeEnterprise152(half.id);
      // Три кинотеатра, владелец «сам» во всех, без людей.
      const three = ['А', 'Б', 'В'].map(n => T.open('culture253', cin.id, 'Кино ' + n, 0));
      businessTasks263();
      out.hours = typeof week276 === 'function' ? week276().lines.filter(l => l.area === 'business').map(l => l.hours) : s.clock.tasks.filter(t => t.kind === 'business263').map(t => t.hours); // 276: часы дела — в неделе
      T.month(three, 1);
      out.three = three.map(b => ({ cap: b.history.at(-1).capacity263, cover: b.history.at(-1).cover272, profit: b.history.at(-1).sales - b.history.at(-1).costs }));
      selectEnterprise168(three[0].id); enterpriseMenu152(); out.threeCard = T.text(); T.clean();
      for (const b of three) { selectEnterprise168(b.id); closeEnterprise152(b.id); }
      // Салон со второй точкой: владелец и два сотрудника — по одному на точку.
      const sal = T.open('services', 'hair', 'Две точки', 2);
      sal.cash = 1e7;
      out.buy = buyBranch159(sal.id, 'standard');
      T.month([sal], 1);
      const h = sal.history.at(-1), plan = typeof bzPlan272 === 'function' ? bzPlan272(sal) : { mainIds: sal.staff155, branchIds: [] };
      out.branch = { main: plan.mainIds.length, br: plan.branchIds.length, cap: h.capacity263, units: h.branch272?.units, staffAfter: sal.staff155.length };
      selectEnterprise168(sal.id); closeEnterprise152(sal.id);
      // Без сотрудников купить точку нельзя, окно об этом говорит.
      const lone = T.open('services', 'hair', 'Одна', 0); lone.cash = 1e7;
      out.loneBuy = buyBranch159(lone.id, 'standard');
      branchMenu159(lone); out.loneMenu = T.text(); T.clean();
      // Открыть ещё одно дело, когда вы уже ведёте первое сами: предупреждение до и окно найма после.
      enterpriseSpecialtyMenu153('services', true);
      T.click(/^Ремонтная мастерская/);
      out.openWarn = T.text(); T.clean();
      s.pending = [];
      startEnterprise152('services', 'Вторая', 'repair', true);
      out.hirePending = s.pending.map(q => q.type);
      resolvePending();
      out.hireMenu = { title: T.title(), buttons: T.buttons().map(b => b.label) }; T.clean();
      return out;
    });
    if (!has(r, 'one')) check(false, '3. нет данных');
    else {
      check(r.one.cover === 1 && r.one.cap >= 2, '3. кинотеатр, владелец сам и сотрудник: точка укомплектована, мощность как раньше', r.one);
      check(r.solo.cover === 1 && r.solo.cap === 1 && r.solo.mods === 0 && !/людей не хватает|Людей не хватает|не хватает людей/.test(r.soloCard), '3. кинотеатр, владелец сам и один: точка укомплектована, как в 263 (без штрафа одиночке)', { solo: r.solo, card: r.soloCard.slice(0, 300) });
      check(r.half.cover != null && Math.abs(r.half.cover - .45 / 1.4) < .02 && /работает примерно на 32%/.test(r.halfCard), '3. кинотеатр, владелец частично и без людей: 0,45 места из 1,4 — «работает примерно на 32%»', { half: r.half, card: r.halfCard.slice(0, 400) });
      check(r.three.every(x => x.cap < .4 && x.cover < .3) && r.hours.every(h => h <= 12), '3. три кинотеатра «сам» без людей: у каждого треть вас, часы делятся (35 → ~12 ч)', { three: r.three, hours: r.hours });
      check(r.three.every(x => x.profit < 0), '3. три кинотеатра без людей — в минусе', r.three.map(x => x.profit));
      check(/вас делят 3 дела/.test(r.threeCard), '3. карточка: «вас делят 3 дела»', r.threeCard.slice(0, 500));
      check(r.buy && r.branch.main === 1 && r.branch.br === 1 && r.branch.units === 1 && r.branch.staffAfter === 2, '3. салон с двумя точками: по сотруднику на точку, сотрудники не задваиваются', r.branch);
      check(r.loneBuy === false && /Работать там некому/.test(r.loneMenu) && /Нанять сотрудника/.test(r.loneMenu), '3. точку без людей не купить, окно предлагает нанять', r.loneMenu.slice(0, 300));
      check(/вас не хватит/.test(r.openWarn), '3. открыть второе дело, когда ведёте первое сами: предупреждение в окне открытия', r.openWarn.slice(-400));
      check(r.hirePending.includes('bzHire272') && /Кто будет работать/.test(r.hireMenu.title) && r.hireMenu.buttons.includes('Нанять сотрудника') && r.hireMenu.buttons.some(b => /управляющему/.test(b)),
        '3. после открытия: окно «Кто будет работать» с наймом и управляющим', r.hireMenu);
    }
    check(!errors.length, '3. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 3б. Выработка идёт за людьми ----------
  // Укомплектованные дела и владелец «сам» в одном деле — месяц в месяц как в 263–266 (страница без 272, то же зерно);
  // точка без людей закрыта: выручки нет, аренда идёт; половина смен — около половины выручки.
  {
    const seq = async (plain, country) => {
      const { pg, ctx } = await open(browser, { plain });
      await life(pg, country);
      const r = await ev(pg, () => {
        const out = {}, quiet = log, sv = save, rd = render; log = () => {}; save = () => {}; render = () => {};
        try {
          for (const [mode, n] of [['self', 0], ['self', 1], ['partial', 1]]) for (const [type, list] of Object.entries(enterpriseSpecialties153)) for (const sp of Object.keys(list)) {
            if (sp === 'school196' || !enterpriseAvailable253(sp)) continue;
            s.enterprise152 = null; s.otherEnterprises168 = []; s.cash = 1e9; s.pending = []; s.clock.month = 0; s.year = 2030; T.seed(12345);
            if (!startEnterprise152(type, 'Д ' + sp, sp)) continue;
            const b = s.enterprise152; b.mode263 = mode; b.staff155 = []; b.fit263 = 1; b.clients154 = ['nx1', 'nx2', 'nx3'];
            for (let k = 0; k < n; k++) T.hire(b, 'f');
            const rows = [];
            for (let m = 0; m < 24 && b.status === 'active'; m++) { s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12; s.pending = []; enterpriseLocationMonth168(b); const h = b.history.at(-1); rows.push([Math.round(b.cash), Math.round(h.sales), Math.round(h.costs)].join('/')); }
            out[mode + '+' + n + ' ' + type + '/' + sp] = rows.join(' ');
          }
        } finally { log = quiet; save = sv; render = rd; }
        return out;
      });
      await ctx.close();
      return r;
    };
    const diff = [];
    let total = 0;
    for (const c of ['au', 'no']) {
      const a = await seq(true, c), b = await seq(false, c);
      for (const k of Object.keys(a)) { total++; if (a[k] !== b[k]) diff.push(c + ' ' + k); }
    }
    check(total > 60 && !diff.length, '3б. владелец сам в одном деле, сам + сотрудник, частично + сотрудник: все 16 видов месяц в месяц как без 272 (' + total + ' дел, 2 страны)', diff.slice(0, 8));

    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      if (typeof bzPlan272 !== 'function') return { base: true };
      const out = {};
      // Вторая точка, на которой никого: выручки ноль, аренда идёт, карточка — «закрыта: некому работать».
      const sal = T.open('services', 'hair', 'Две двери', 1); sal.cash = 1e7;
      buyBranch159(sal.id, 'standard');
      selectEnterprise168(sal.id); dismissEnterprise155(sal.id, sal.staff155[0]);
      T.month([sal], 1);
      const h = sal.history.at(-1);
      out.branch = { sales: h.branchSales, rent: h.branchRent, units: h.branch272?.units };
      selectEnterprise168(sal.id); enterpriseMenu152(); out.branchCard = T.text(); T.clean();
      selectEnterprise168(sal.id); closeEnterprise152(sal.id);
      // Первая точка без людей: владелец болеет, сотрудников нет.
      const ill = T.open('shop', 'flowers', 'Пустой зал', 0);
      s.illness = { name: 'грипп', months: 2 };
      T.month([ill], 1);
      out.main = { sales: ill.history.at(-1).sales, rent: ill.history.at(-1).rent, cover: ill.history.at(-1).cover272 };
      selectEnterprise168(ill.id); enterpriseMenu152(); out.mainCard = T.text(); T.clean();
      out.panel = enterprisePanel152();
      s.illness = null;
      selectEnterprise168(ill.id); closeEnterprise152(ill.id);
      // Половина смен: салон с низким спросом (первые месяцы, неудачное место), владелец один — и он же во втором деле.
      const a = T.open('services', 'hair', 'Половина', 0); a.fit263 = .45;
      const snap = structuredClone(a);
      const run = () => { T.seed(777); s.clock.ticks++; enterpriseLocationMonth168(a); s.clock.ticks--; const x = a.history.at(-1); return { sales: x.sales, cover: x.cover272, cap: x.capacity263, demand: x.demand263 }; };
      out.full = run();
      for (const k of Object.keys(a)) delete a[k]; Object.assign(a, structuredClone(snap));
      const other = T.open('services', 'repair', 'Второе дело', 0);
      out.half = run();
      out.ratio = out.half.sales / Math.max(1, out.full.sales);
      out.mult = [0, .25, .5, .75, 1].map(c => +bzMult272(c).toFixed(3));
      return out;
    });
    if (r.base) check(false, '3б. business272 не подключён');
    else {
      check(r.branch.sales === 0 && r.branch.rent > 0 && r.branch.units === 0 && /Второй салон закрыт: некому работать/.test(r.branchCard), '3б. вторая точка без людей: выручки нет, аренда идёт, в карточке «Второй салон закрыт: некому работать»', { branch: r.branch, card: r.branchCard.slice(-400) });
      check(r.main.sales === 0 && r.main.rent > 0 && r.main.cover === 0 && /Точка закрыта: некому работать — вы болеете/.test(r.mainCard) && /Точка закрыта: некому работать/.test(r.panel), '3б. первая точка без людей (вы болеете, сотрудников нет): выручки нет, аренда идёт, карточка и панель «Точка закрыта: некому работать»', { main: r.main, card: r.mainCard.slice(-300) });
      check(r.full.cover === 1 && r.half.cover === .5 && r.full.demand < r.full.cap && r.ratio > .4 && r.ratio < .65, '3б. половина смен — около половины выручки (спрос меньше мощности: раньше было ~78%)', { full: r.full, half: r.half, ratio: +r.ratio.toFixed(2) });
      check(r.mult[0] === 0 && r.mult[2] === .55 && r.mult[4] === 1, '3б. доля выручки от покрытия: 0 → 0, 0,5 → 0,55, 1 → 1', r.mult);
    }
    check(!errors.length, '3б. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 4. Сотрудник уходит ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {};
      const b = T.open('services', 'hair', 'Ножницы', 0);
      const anna = T.hire(b, 'f', 'Анна Смит'), mark = T.hire(b, 'm', 'Марк Джонс');
      T.month([b], 1);
      const wage = enterpriseWage155(b);
      // Анна: соглашается.
      b.leaving266 = { id: anna.id, at: s.clock.ticks + 1 };
      s.pending = [{ type: 'staffLeave266', businessId: b.id, personId: anna.id }];
      resolvePending();
      out.ask = { title: T.title(), text: T.text(), buttons: T.buttons() };
      const r0 = Math.random; Math.random = () => 0;
      try { out.click1 = T.click(/^Предложить \+20%/); } finally { Math.random = r0; }
      out.yes = { title: T.title(), text: T.text() };
      T.clean();
      out.annaBonus = b.bonus266?.[anna.id]; out.wage = wage; out.leaving = b.leaving266 || null;
      out.feedYes = s.log.find(e => e.title === 'Сотрудник остаётся')?.text || '';
      // Марк: не помогает.
      b.leaving266 = { id: mark.id, at: s.clock.ticks + 1 };
      s.pending = [{ type: 'staffLeave266', businessId: b.id, personId: mark.id }];
      resolvePending();
      Math.random = () => .999;
      try { T.click(/^Предложить \+10%/); } finally { Math.random = r0; }
      out.no = { title: T.title(), text: T.text(), buttons: T.buttons().map(x => x.label) };
      T.clean();
      out.feedNo = s.log.find(e => e.title === 'Сотрудник уходит')?.text || '';
      T.month([b], 1);
      out.markGone = !b.staff155.includes(mark.id);
      selectEnterprise168(b.id); enterpriseMenu152(); out.card = T.text(); out.cardButtons = T.buttons(); T.clean();
      const p = { inner: { trust: 50 }, bond: 40 };
      out.chances = typeof bzStay272 === 'function' ? [10, 20, 35].map(x => bzStay272(b, p, wage, x, wage * 1.2)) : null;
      return out;
    });
    if (r.error) check(false, '4. сотрудник уходит: проверки не выполнены', r.error.split('\n')[0]);
    else {
    const hints = r.ask?.buttons?.filter(b => /^Предложить/.test(b.label)) || [];
    check(hints.length === 3 && hints.every(b => b.hint) && /получает/.test(r.ask.text), '4. окно: прибавка +10/20/35% с оценкой шанса, видно нынешнюю оплату', r.ask);
    check(r.click1 && r.yes.title === 'Анна Смит' && /^Согласилась остаться за .+ в месяц/.test(r.yes.text.split('\n').find(l => /Согласил/.test(l)) || ''), '4. ответ сразу в окне: «Согласилась остаться за …»', r.yes);
    check(r.annaBonus > 0 && Math.abs(r.annaBonus - Math.round(r.wage * 1.2) + r.wage) <= 1 && !r.leaving, '4. прибавка записана, уход отменён', { bonus: r.annaBonus, wage: r.wage });
    check(/Анна Смит остаётся за .+ \(\+20%\)/.test(r.feedYes), '4. лента: «Анна Смит остаётся за … (+20%)»', r.feedYes);
    check(/Всё равно уходит: надбавка не помогла/.test(r.no?.text || '') && r.no.buttons.includes('Нанять замену заранее'), '4. отказ: «Всё равно уходит: надбавка не помогла», можно нанять замену', r.no);
    check(/Марк Джонс: прибавка \+10% не помогла/.test(r.feedNo) && r.markGone, '4. лента с именем, через месяц уходит', r.feedNo);
    check(/Анна Смит — .+\/мес\. \(прибавка \+20% с /.test(r.card || '') && /Ушли: Марк Джонс — ушёл в .+ \(прибавка не помогла\)/.test(r.card || ''),
      '4. карточка: кто остался и за сколько, кто ушёл и когда', (r.card || '').split('\n').filter(l => /Команда|Ушли/.test(l)));
    check(r.chances && r.chances[0] < r.chances[1] && r.chances[1] < r.chances[2], '4. чем больше прибавка, тем выше шанс', r.chances);
    }
    check(!errors.length, '4. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 5. Предупреждения до закрытия ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {};
      // Продуктовый на неудачном месте с дорогой арендой — в минусе с первых месяцев: предупреждения по-настоящему,
      // через расчёт месяца.
      const b = T.open('shop', 'grocery', 'Тихая гавань', 0);
      b.fit263 = .9; b.rentFactor159 = 1.6; b.cash = 60000;
      const seen = [];
      for (let m = 0; m < 40 && b.status === 'active'; m++) {
        T.month([b], 1);
        const items = decisionItems24().filter(i => i.ref.kind === 'bz272').map(i => i.title);
        seen.push({ t: s.clock.ticks, cash: Math.round(b.cash), loss: !!b.loss272, final: b.final272 ? { ...b.final272 } : null, items, pending: s.pending.map(q => q.type) });
        if (b.final272 && !out.finalWindow) {
          const i = s.pending.findIndex(q => q.type === 'bzFinal272');
          if (i >= 0) { const q = s.pending.splice(i, 1)[0]; s.pending.unshift(q); resolvePending(); out.finalWindow = { title: T.title(), text: T.text(), buttons: T.buttons().map(x => x.label) }; T.clean(); }
        }
        if (b.loss272 && !out.card) { selectEnterprise168(b.id); enterpriseMenu152(); out.card = { red: !!document.querySelector('#modal p.bz-warn272'), text: document.querySelector('#modal p.bz-warn272')?.textContent || '', buttons: T.buttons().map(x => x.label) }; T.clean(); }
        s.pending = s.pending.filter(q => q.type !== 'bzFinal272');
      }
      out.seen = seen;
      out.status = b.status;
      out.closeLog = s.log.find(e => e.title === 'Своё дело закрыто' && e.text.startsWith('Тихая гавань'))?.text || '';
      // Вложить деньги — угроза отступает.
      const c2 = T.open('shop', 'books', 'Полка', 0); c2.opened159 = s.clock.ticks - 24; // не первый год
      for (let i = 0; i < 3; i++) c2.history.push({ tick: s.clock.ticks + i, sales: 100, costs: 1100, paid: 1100, cash: 0 });
      c2.cash = 1500; if (typeof bzWarn272 === 'function') bzWarn272(c2);
      out.c2final = !!c2.final272;
      if (typeof bzDeposit272 === 'function') bzDeposit272(c2.id, 100000);
      out.c2after = { final: !!c2.final272, loss: !!c2.loss272 };
      // Первый год с запасом больше чем на полгода: минус — заметка, а не тревога.
      const c3 = T.open('shop', 'flowers', 'Букет', 0);
      for (let i = 0; i < 3; i++) c3.history.push({ tick: s.clock.ticks + i, sales: 900, costs: 1000, paid: 1000, cash: 0 });
      c3.cash = 100000; if (typeof bzWarn272 === 'function') bzWarn272(c3);
      out.ramp = { loss: !!c3.loss272, status: typeof bzStatus272 === 'function' ? bzStatus272(c3) : null, item: decisionItems24().some(i => i.ref.id === 'loss:' + c3.id) };
      selectEnterprise168(c3.id); closeEnterprise152(c3.id);
      // «×» прячет пункт «Дело в минусе», последнее предупреждение возвращается до срока.
      const items0 = decisionItems24().filter(i => i.ref.kind === 'bz272').map(i => i.ref.id);
      out.items0 = items0;
      const lossId = items0.find(id => id.startsWith('loss:'));
      if (lossId) { quickDismiss59('bz272', lossId); out.afterDismiss = decisionItems24().some(i => i.ref.id === lossId); }
      // Перевести деньги себе, когда дело в минусе: сначала вопрос.
      c2.cash = 50000; selectEnterprise168(c2.id); enterpriseMenu152(); T.click(/^Перевести остаток/); out.draw = T.title(); T.clean();
      return out;
    });
    if (!has(r, 'seen')) check(false, '5. нет данных');
    else {
      const firstLoss = r.seen.find(x => x.loss), firstFinal = r.seen.find(x => x.final), closed = r.status !== 'active';
      const closedAt = closed ? r.seen.at(-1).t : null;
      check(!!firstLoss && firstLoss.items.some(t => /^Дело в минусе/.test(t)) && (!firstFinal || firstFinal.t - firstLoss.t >= 2), '5. после первых месяцев в минусе — пункт «Дело в минусе» в «Ожидают ответа», задолго до последнего предупреждения', r.seen.slice(0, 8));
      check(r.card?.red && /В минусе .+ в среднем −/.test(r.card.text) && r.card.buttons.includes('Дело в минусе'), '5. карточка: красный статус с причиной', r.card);
      check(!!firstFinal && r.finalWindow && /^Через [23] месяц[а]?, в .+ \d{4}, дело «Тихая гавань» закроется, если ничего не изменить\./.test(r.finalWindow.text.split('\n').find(l => /^Через/.test(l)) || '') &&
        ['Вложить деньги', 'Сократить расходы', 'Продать дело', 'Закрыть дело самому'].every(x => r.finalWindow.buttons.includes(x)),
        '5. последнее предупреждение с датой и выбором: вложить, сократить, продать, закрыть самому', r.finalWindow);
      check(closed && firstFinal && closedAt >= firstFinal.final.until && firstLoss.t <= firstFinal.t, '5. закрытие — только после срока предупреждения', { firstLoss: firstLoss?.t, final: firstFinal?.final, closedAt });
      check(closed && /Предупреждение пришло в /.test(r.closeLog) || closed && /не хватило/.test(r.closeLog), '5. запись о закрытии', r.closeLog);
      check(r.c2final && !r.c2after.final, '5. вложили деньги — последнее предупреждение снято', r);
      check(r.items0.length > 0 && r.afterDismiss === false, '5. «×» откладывает пункт «Дело в минусе»', r.items0);
      check(r.ramp && !r.ramp.loss && !r.ramp.item && /^Первый год/.test(r.ramp.status?.text || ''), '5. первый год с запасом: минус — заметка в карточке, не тревога', r.ramp);
      check(r.draw === 'Перевести деньги себе?', '5. перевести деньги себе из убыточного дела — сначала вопрос, сколько останется', r.draw);
    }
    check(!errors.length, '5. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 5б. Предупреждения без дребезга, срок закрытия, мелочи из рецензии ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      if (typeof bzWarn272 !== 'function') return { base: true };
      const out = {}, logs = [], quiet = log;
      // Плохой и хороший месяцы по очереди, запас тает: одно окно, без «выправилось», срок не прыгает назад.
      log = (t, x) => { logs.push([s.clock.ticks, t, String(x)]); };
      try {
        const b = T.open('services', 'hair', 'Ножницы', 1); b.opened159 = s.clock.ticks - 30; b.cash = 9000; b.history = []; s.pending = [];
        for (let i = 0; i < 6; i++) { s.clock.ticks++; b.history.push({ tick: s.clock.ticks, sales: 20000, costs: 19000, cash: b.cash }); }
        const untils = [];
        for (const pl of [-3000, -3000, 2600, -3000, 2600, -3000, 2600, -3000, 2600, -3000, 2600, -3000, 2600, -3000, 2600, -3000]) {
          s.clock.ticks++; b.cash += pl; b.history.push({ tick: s.clock.ticks, sales: 20000, costs: 20000 - pl, cash: b.cash }); bzWarn272(b);
          if (b.final272) untils.push(b.final272.until);
        }
        const n = re => logs.filter(l => re.test(l[1])).length;
        out.flap = { finals: n(/^Дело может закрыться$/), recovered: n(/^Дело выправилось$|^Угроза закрытия отступила$/), popups: s.pending.filter(q => q.type === 'bzFinal272').length,
          backwards: untils.some((u, i) => i && u < untils[i - 1]), always: untils.length === 15 };
        selectEnterprise168(b.id); closeEnterprise152(b.id);
        // Сезонный провал в прибыльный год: заметка, не красный статус, без «Ожидают ответа» и записи.
        logs.length = 0; s.pending = [];
        const d = T.open('shop', 'books', 'Сезон', 0); d.opened159 = s.clock.ticks - 30; d.cash = 40000; d.history = [];
        for (let i = 0; i < 10; i++) { s.clock.ticks++; d.history.push({ tick: s.clock.ticks, sales: 20000, costs: 18000, cash: d.cash }); bzWarn272(d); }
        for (let i = 0; i < 2; i++) { s.clock.ticks++; d.history.push({ tick: s.clock.ticks, sales: 20000, costs: 21500, cash: d.cash }); bzWarn272(d); }
        const st = bzStatus272(d);
        out.dip = { level: st?.level, label: st?.label, loss: !!d.loss272, item: decisionItems24().some(i => i.ref.kind === 'bz272' && i.ref.id.endsWith(d.id)), logs: n(/^Дело в минусе$/) };
        selectEnterprise168(d.id); enterpriseMenu152(); out.dip.red = !!document.querySelector('#modal p.bz-warn272'); out.dip.note = document.querySelector('#modal p.bz-note272')?.textContent || ''; T.clean();
        selectEnterprise168(d.id); closeEnterprise152(d.id);
      } finally { log = quiet; }
      // Настоящий месяц: закрытие — ровно в последний названный срок и со ссылкой на предупреждение.
      const sv = save, rd = render; save = () => {}; render = () => {};
      const runs = [];
      try {
        log = (t, x) => { logs.push([s.clock.ticks, t, String(x)]); };
        for (const [type, list] of Object.entries(enterpriseSpecialties153)) for (const sp of Object.keys(list)) for (const fit of [.5, .7]) for (const n of [0, 1]) {
          if (sp === 'school196' || !enterpriseAvailable253(sp)) continue;
          s.enterprise152 = null; s.otherEnterprises168 = []; s.cash = 1e9; s.pending = []; logs.length = 0; T.seed(fit * 100 + n);
          if (!startEnterprise152(type, 'Д', sp)) continue;
          const b = s.enterprise152; b.mode263 = 'self'; b.staff155 = []; b.fit263 = fit; b.clients154 = ['nx1', 'nx2', 'nx3'];
          businessState254(b); // в игре — каждый месяц (businessMonth254); здесь месяц дела зовётся напрямую
          for (let k = 0; k < n; k++) T.hire(b, 'f');
          let last = null, closedAt = null;
          for (let m = 0; m < 48; m++) { s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12; enterpriseLocationMonth168(b); s.pending = [];
            if (b.final272) last = b.final272.until; if (b.status !== 'active') { closedAt = s.clock.ticks; break; } if (m % 3 === 2) drawEnterprise152(b.id); }
          const close = logs.find(l => l[1] === 'Своё дело закрыто');
          runs.push({ closedAt, last, warned: logs.some(l => l[1] === 'Дело может закрыться'), ref: /Предупреждение пришло/.test(close?.[2] || ''), moved: logs.filter(l => l[1] === 'Срок сдвинулся').length });
        }
      } finally { log = quiet; save = sv; render = rd; s.enterprise152 = null; s.otherEnterprises168 = []; }
      const closed = runs.filter(x => x.closedAt != null);
      out.real = { runs: runs.length, closed: closed.length, offDate: closed.filter(x => x.last !== x.closedAt).length, noWarn: closed.filter(x => !x.warned).length, noRef: closed.filter(x => !x.ref).length, moved: runs.reduce((a, x) => a + x.moved, 0) };
      // Первый год в минусе при большом запасе: своя подпись в панели, слова вида (у издательства не «клиенты»).
      const pub = T.open('studio', 'publishing', 'Первые книги', 2); pub.fit263 = .6; pub.cash = 5e6; pub.clients154 = ['nx1', 'nx2', 'nx3'];
      T.month([pub], 3); s.pending = [];
      const ps = bzStatus272(pub), panel = enterprisePanel152();
      out.ramp = { level: ps?.level, text: ps?.text || '', panel: (panel.split('Первые книги')[1] || '').split('</button>')[0] };
      selectEnterprise168(pub.id); closeEnterprise152(pub.id);
      // Замена ушедшего сотрудника через событие 254 «Найти»: в карточке — «Ушли».
      const rep = T.open('services', 'hair', 'Замена', 2); rep.clients154 = ['nx1', 'nx2', 'nx3']; rep.cash = 1e7;
      T.month([rep], 2); s.pending = [];
      const q = businessOffer254(rep, 'E0399');
      if (q) {
        out.goneName = living(q.worker)?.name;
        const idx = businessIndex254.E0399.choices.findIndex((c, i) => businessPlan254(rep, q, i).op === 'hire');
        businessCommit254(q.id, idx); T.month([rep], 1); s.pending = [];
        selectEnterprise168(rep.id); enterpriseMenu152(); out.repCard = (T.text().match(/Ушли:[^\n]*/) || [''])[0]; T.clean();
      }
      selectEnterprise168(rep.id); closeEnterprise152(rep.id);
      // Своё помещение (266): ни «Предложения повысить аренду», ни события E0397.
      const own = T.open('services', 'hair', 'Своё', 1); own.clients154 = ['nx1', 'nx2', 'nx3']; own.ownPremises266 = true; own.opened159 -= 40; own.cash = 1e7;
      T.seed(3);
      let offer = null;
      for (let m = 0; m < 120 && !offer; m++) { s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12; s.pending = []; enterpriseLocationMonth168(own); if (own.rentOffer159) offer = s.clock.ticks; }
      out.own = { offer, e397: bzOff272(own, businessIndex254.E0397) };
      selectEnterprise168(own.id); closeEnterprise152(own.id);
      // Старое сохранение: вторая точка, частично и один сотрудник — в первый месяц окно «Кто где работает».
      const old = T.open('services', 'hair', 'Старая сеть', 1, 'partial'); old.cash = 1e7;
      buyBranch159(old.id, 'standard'); delete old.model272; s.pending = [];
      T.month([old], 1);
      out.model = { pending: s.pending.map(q => q.type) };
      s.pending = s.pending.filter(q => q.type === 'bzModel272'); resolvePending();
      out.model.title = T.title(); out.model.text = T.text(); out.model.buttons = T.buttons().map(b => b.label); T.clean();
      T.month([old], 1); out.model.again = s.pending.some(q => q.type === 'bzModel272');
      return out;
    });
    if (r.base || r.error) check(false, '5б. business272 не подключён или проверки не выполнены', r.error?.split('\n')[0]);
    else {
      check(r.flap.finals === 1 && r.flap.recovered === 0 && r.flap.popups === 1 && !r.flap.backwards && r.flap.always, '5б. плохой и хороший месяцы по очереди: одно окно «Дело может закрыться», ни одного «выправилось», срок не прыгает назад', r.flap);
      check(r.dip.level === 'dip' && !r.dip.label && !r.dip.loss && !r.dip.item && r.dip.logs === 0 && !r.dip.red && /за .+ дело в плюсе/.test(r.dip.note), '5б. два месяца в минусе в прибыльный год: заметка, без красного статуса, «Ожидают ответа» и записи', r.dip);
      check(r.real.closed > 5 && r.real.offDate === 0 && r.real.noWarn === 0 && r.real.noRef === 0, '5б. настоящие месяцы: каждое закрытие — в последний названный срок, после предупреждения и со ссылкой на него (' + r.real.closed + ' закрытий из ' + r.real.runs + ')', r.real);
      check(r.ramp.level === 'ramp' && /Первый год: пока в минусе/.test(r.ramp.panel) && !/Людей не хватает/.test(r.ramp.panel) && /набирает обороты/.test(r.ramp.text) && !/лиент/.test(r.ramp.text), '5б. первый год в минусе с запасом: в панели «Первый год: пока в минусе», у издательства без «клиентов»', r.ramp);
      check(r.goneName && new RegExp('Ушли: ' + r.goneName + ' — ушл').test(r.repCard || ''), '5б. сотрудник, которого заменили через «Найти» (254), — в «Ушли»', { gone: r.goneName, card: r.repCard });
      check(r.own.offer === null && r.own.e397 === 'своё помещение', '5б. своё помещение: ни предложения поднять аренду, ни E0397', r.own);
      check(r.model.pending.includes('bzModel272') && r.model.title === 'Кто где работает' && /вы полдня, она работает примерно на 45%/.test(r.model.text) &&
        ['Закрыть второй салон', 'Передать «Старая сеть» управляющему', 'Вести «Старая сеть» самому'].every(x => r.model.buttons.includes(x)) && r.model.buttons.some(x => /^Нанять сотрудника/.test(x)) && !r.model.again,
        '5б. старое сохранение со второй точкой: одно окно «Кто где работает» — кто где, на сколько работает точка, нанять, закрыть точку, управляющий, вести самому', r.model);
    }
    check(!errors.length, '5б. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 6. Сохранение владелицы: что она увидела бы до закрытия ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const { pg, errors, ctx } = await open(browser);
    const raw = fs.readFileSync(OWNER, 'utf8');
    const r = await ev(pg, raw => {
      try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); } catch (e) {}
      importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]);
      if ($('#modal').open) closeModal();
      const b = s.enterprise152, out = { title: b?.title, status: b?.status, last: b?.last, kind: typeof bzKind272 === 'function' ? bzKind272(b) : null };
      if (typeof bzHealth272 !== 'function' || !b) return out;
      const now = s.clock.ticks, tl = [];
      for (let k = 1; k < b.history.length; k++) {
        const h = b.history[k], hl = bzHealth272(b.history.slice(0, k + 1), h.cash);
        tl.push({ tick: h.tick, ago: now - h.tick, cash: h.cash, profit: h.sales - h.costs, level: hl.level, runway: Number.isFinite(hl.runway) ? +hl.runway.toFixed(1) : null });
      }
      out.tl = tl;
      // Тексты, которые были бы в карточке: дело — активное на тот месяц.
      const at = t => { const k = b.history.findIndex(h => h.tick === t); const copy = { ...b, status: 'active', history: b.history.slice(0, k + 1), cash: b.history[k].cash }; return copy; };
      const firstLoss = tl.find(x => x.level === 'loss'), firstFinal = tl.find(x => x.level === 'final');
      const keepTicks = s.clock.ticks, keepYear = s.year, keepMonth = s.clock.month;
      const textAt = t => { const d = keepTicks - t; s.clock.ticks = t; const n = keepYear * 12 + keepMonth - d; s.year = Math.floor(n / 12); s.clock.month = ((n % 12) + 12) % 12;
        try { return bzReason272(at(t)); } finally { s.clock.ticks = keepTicks; s.year = keepYear; s.clock.month = keepMonth; } };
      const whenAt = (t, until) => { const d = keepTicks - t; s.clock.ticks = t; const n = keepYear * 12 + keepMonth - d; s.year = Math.floor(n / 12); s.clock.month = ((n % 12) + 12) % 12;
        try { return bzWhen272(t) + ' → ' + bzWhen272(until); } finally { s.clock.ticks = keepTicks; s.year = keepYear; s.clock.month = keepMonth; } };
      if (firstLoss) out.loss = { tick: firstLoss.tick, text: textAt(firstLoss.tick) };
      if (firstFinal) { const k = b.history.findIndex(h => h.tick === firstFinal.tick), n = bzFinalMonths272(bzHealth272(b.history.slice(0, k + 1), b.history[k].cash)); out.final = { tick: firstFinal.tick, until: firstFinal.tick + n, cash: firstFinal.cash, text: textAt(firstFinal.tick), when: whenAt(firstFinal.tick, firstFinal.tick + n) }; }
      // Вывод 612-го месяца: сколько оставалось и на сколько бы хватило (как в вопросе «Перевести деньги себе?»).
      const drop = b.history.findIndex((h, i) => i && b.history[i - 1].cash - h.cash > 100000);
      if (drop > 0) { const h = b.history[drop], hl = bzHealth272(b.history.slice(0, drop + 1), h.cash); out.draw = { tick: h.tick, left: h.cash, burn: hl.burn, runway: hl.runway, text: bzRunwayText272(hl) }; }
      // «Партнёр предлагает новую точку» второй раз при уже купленном филиале — у издательства не пришёл бы.
      const cases = b.cases254?.cases || [];
      out.e402 = cases.filter(q => q.event === 'E0402').map(q => ({ tick: q.tick, branchThen: !!b.branch159 && q.tick > b.branch159.opened, off: bzOff272({ ...b, branch159: q.tick > b.branch159?.opened ? {} : null }, businessIndex254.E0402) }));
      out.e402title = bzText272(b, businessIndex254.E0402.title);
      // «Трущобы»: своё издательство в окне книги (дело было активным в 585).
      const book = creative27().projects.find(p => p.title === 'Трущобы');
      out.prev = bookPrev272();
      if (book) {
        const keep = { status: book.status, st: b.status, retry: book.retry };
        book.status = 'rejected'; b.status = 'active'; book.retry = s.clock.ticks + 4;
        try { bookMenu27(book.id); out.bookButtons = T.buttons(); T.clean(); } finally { book.status = keep.status; b.status = keep.st; book.retry = keep.retry; }
      }
      return out;
    }, raw);
    console.log('   сохранение: «' + r.title + '», ' + r.kind + ', ' + r.status + ', последний месяц ' + r.last);
    if (r.tl) {
      const closeT = r.tl.at(-1).tick;
      console.log('   что было бы до закрытия (месяц ' + closeT + '):');
      if (r.loss) console.log('     ' + r.loss.tick + ' (за ' + (closeT - r.loss.tick) + ' мес.) — «Дело в минусе» в «Ожидают ответа», в карточке красным: ' + r.loss.text);
      if (r.draw) console.log('     ' + r.draw.tick + ' — вывод денег: на счёте осталось ' + r.draw.left + ' при убытке в среднем ' + r.draw.burn + '/мес. — вопрос «Перевести деньги себе?»: «' + r.draw.text + '»');
      if (r.final) console.log('     ' + r.final.tick + ' (за ' + (closeT - r.final.tick) + ' мес.) — окно «Дело может закрыться» (' + r.final.when + '): ' + r.final.text);
      for (const e of r.e402 || []) console.log('     ' + e.tick + ' — «' + r.e402title + '»' + (e.off ? ': не пришло бы — расширение уже есть' : ''));
      check(r.loss && closeT - r.loss.tick >= 12, '6. владелица: «Дело в минусе» появилось бы за год с лишним до закрытия', r.loss);
      check(r.final && r.final.until - r.final.tick >= 2 && r.final.until >= closeT && closeT - r.final.tick >= 1 && r.final.cash > 0,
        '6. владелица: последнее предупреждение с датой пришло, пока деньги ещё были, срок — не раньше, чем дело закрылось на деле', { final: r.final, closeT });
      check(r.draw && r.draw.runway <= 12 && /примерно на/.test(r.draw.text), '6. владелица: вывод денег в 612 — прогноз по последним месяцам (кончатся меньше чем за год), а не «на 30 месяцев»', r.draw);
      check((r.e402 || []).some(e => e.off) && r.e402title === 'Совладелец предлагает новую серию', '6. владелица: повторное «Партнёр предлагает новую точку» при филиале не пришло бы', r.e402);
      check(r.prev?.books >= 6, '6. владелица: шесть книг у одного прежнего издателя', r.prev);
      check((r.bookButtons || []).some(b => b.label === 'В своё издательство · Потерянные слова') && (r.bookButtons || []).find(b => /^Издать самостоятельно/.test(b.label))?.disabled === false,
        '6. владелица: «Трущобы» — в своё издательство без оплаты, самиздат не заблокирован отказом', r.bookButtons);
    } else check(false, '6. сохранение владелицы: business272 не подключён');
    check(!errors.length, '6. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  } else console.log('-    6. сохранение владелицы не найдено (OWNER_SAVE)');

  // ---------- 7. Книги ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {}, x = creative27();
      const mk = title => { const p = createBook27(title, 'Роман', 6); p.status = 'ready'; p.progress = p.scale; p.quality = 70; return p; };
      const run = n => { for (let i = 0; i < n; i++) { s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12; creativeMonth27(); } };
      const a = mk('Первая');
      bookMenu27(a.id); out.first = T.buttons().map(b => b.label); T.clean();
      out.sub = typeof bookSubmit272 === 'function' ? bookSubmit272(a.id, 'new') : (submitBook27(a.id), true);
      a.roll = .999; run(3);
      out.rej = { status: a.status, retry: a.retry - s.clock.ticks, refused: a.refused272 ? Object.values(a.refused272)[0] - s.clock.ticks : null, hist: a.history.at(-1).text };
      out.rejLog = s.log.find(e => e.title === 'Отказ издателя')?.text || '';
      bookMenu27(a.id); out.afterRej = T.buttons(); T.clean();
      // Через два месяца — к другому издателю, тот издаёт.
      run(2);
      out.sub2 = typeof bookSubmit272 === 'function' ? bookSubmit272(a.id, 'new') : (submitBook27(a.id), a.status === 'review');
      a.roll = 0; run(3);
      out.pub = { status: a.status, publisher: a.publisher272?.name };
      // Вторая книга: прежний издатель охотнее.
      const b2 = mk('Вторая');
      bookMenu27(b2.id); out.second = T.buttons(); T.clean();
      if (typeof bookSubmit272 === 'function') { const keep = Math.random; Math.random = () => .5; try { bookSubmit272(b2.id, 'prev'); } finally { Math.random = keep; } out.prevRoll = b2.roll; }
      // Своё издательство: без оплаты, книга в каталоге, выручка — делу.
      const house = T.open('studio', 'publishing', 'Свой знак', 1);
      const c3 = mk('Третья');
      bookMenu27(c3.id); out.third = T.buttons().map(b => b.label);
      const cash0 = s.cash;
      out.houseClick = T.click(/^В своё издательство/); T.clean();
      out.houseFee = s.cash - cash0;
      c3.marketRoll = .9; run(2);
      out.house = { status: c3.status, cat: (house.catalogue272 || []).map(e => e.title) };
      const cashBook = c3.income; run(1);
      out.houseIncome = { player: c3.income - cashBook, business: Math.round(house.bookIncome272 || 0), paid: c3.paidMonths };
      T.month([house], 1);
      out.houseBooks = house.history.at(-1).books272 || 0;
      // 272.1: двоеточие в названии — запись об отказе и о выходе в своём издательстве всё равно про эту книгу.
      if (typeof bookSubmit272 === 'function') {
        const colon = mk('Город: хроники');
        bookSubmit272(colon.id, 'new'); colon.roll = .999; run(3);
        out.colonRej = s.log.find(e => e.title === 'Отказ издателя' && /^Город: хроники/.test(e.text))?.text || '';
        const colon2 = mk('Пароль: взаимность');
        bookMenu27(colon2.id); T.click(/^В своё издательство/); T.clean();
        run(2);
        out.colonPub = s.log.find(e => e.title === 'Книга опубликована' && /^Пароль: взаимность/.test(e.text))?.text || '';
      }
      return out;
    });
    if (r.error) check(false, '7. книги: проверки не выполнены', r.error.split('\n')[0]);
    else {
    check(r.first.includes('Отправить издателю') && r.first.some(l => /^Издать самостоятельно/.test(l)), '7. первая книга: издатель или самостоятельно', r.first);
    check(r.rej.status === 'rejected' && r.rej.retry === 2 && r.rej.refused === 6, '7. после отказа: другому издателю через 2 месяца (было 6), тому же — через 6', r.rej);
    check(/через два месяца/.test(r.rejLog) && /отказало/.test(r.rejLog), '7. запись об отказе: кто отказал и когда можно снова', r.rejLog);
    check(r.afterRej.find(b => /^Издать самостоятельно/.test(b.label))?.disabled === false && r.afterRej.find(b => b.label === 'Отправить издателю')?.disabled === true,
      '7. сразу после отказа: самиздат доступен, к издателю — через 2 месяца', r.afterRej);
    check(r.pub.status === 'published' && /^Издательство «/.test(r.pub.publisher || ''), '7. книга вышла у названного издателя', r.pub);
    const prevBtn = r.second.find(b => /^Прежнему издателю · Издательство «/.test(b.label));
    check(prevBtn && /охотнее/.test(prevBtn.hint) && r.second.some(b => b.label === 'Новому издателю'), '7. вторая книга: прежний издатель (охотнее) и новый', r.second);
    check(r.prevRoll != null && r.prevRoll < .5, '7. прежний издатель: шанс выше', r.prevRoll);
    check(r.third.includes('В своё издательство · Свой знак') && r.houseClick && r.houseFee === 0, '7. своё издательство: в окне книги, без оплаты', { b: r.third, fee: r.houseFee });
    check(r.house.status === 'published' && r.house.cat.includes('Третья'), '7. книга вышла в своём издательстве и стоит в каталоге', r.house);
    check(r.houseIncome.player === 0 && r.houseIncome.business > 0 && r.houseIncome.paid === 1 && r.houseBooks > 0, '7. выручка от своей книги — на счёт издательства, не автору', { ...r.houseIncome, books: r.houseBooks });
    check(/^Город: хроники · Издательство «.+» отказало: рукопись остаётся вашей/.test(r.colonRej || ''), '7. «Город: хроники»: в записи об отказе название целиком и кто отказал', r.colonRej);
    check(/Книга вышла в «Свой знак»/.test(r.colonPub || '') && !/Авторские выплаты/.test(r.colonPub || ''), '7. «Пароль: взаимность» в своём издательстве: «Книга вышла в «Свой знак»», без авторских выплат', r.colonPub);
    }
    check(!errors.length, '7. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 8. Рецензия 272.1: панель, долг и события 254, прибавка уходящего, «Ожидают ответа», найм, тексты ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      if (typeof bzKind272 !== 'function') return { base: true };
      const out = {};
      const shut = () => { for (const b of ownedEnterprises168().filter(b => b.status === 'active')) { selectEnterprise168(b.id); closeEnterprise152(b.id); } T.clean(); };
      // Панель «Моё дело» на вкладке действий после настоящего render(): у каждого дела — кнопка, которая открывает его карточку.
      const panel = () => {
        T.clean(); render();
        const boxes = [...document.querySelectorAll('.enterprise-panel152')];
        const res = { boxes: boxes.length, raw: boxes.some(x => /data-id=|onclick=|home-compact60/.test(x.textContent)), opened: [] };
        res.buttons = boxes.reduce((n, x) => n + x.querySelectorAll('button[data-id]').length, 0);
        for (let i = 0; i < res.buttons; i++) {
          T.clean(); render();
          const bt = [...document.querySelectorAll('.enterprise-panel152 button[data-id]')][i];
          bt?.click(); res.opened.push(T.title()); T.clean();
        }
        return res;
      };
      const a = T.open('studio', 'photo', 'Ракурс', 1); a.fit263 = 1.4;
      T.month([a], 2);
      out.panel1 = panel();
      const a2 = T.open('studio', 'design', 'Линия', 1);
      T.month([a, a2], 2);
      out.panel2 = panel();
      shut();

      // Дело в долг до срока предупреждения: в окне события 254 бесплатный ответ доступен, платный — нет.
      const d = T.open('studio', 'design', 'Долг', 1); d.fit263 = 1.4;
      T.quiet(() => { T.seed(11); T.month([d], 13); });
      out.debtActive = d.status;
      d.cash = -800; bzWarn272(d); s.pending = [];
      const st = businessState254(d);
      const win = id => {
        for (const c of st.cases) if (['offered', 'proposal', 'saleProposal', 'scheduled'].includes(c.status)) { c.status = 'expired'; c.entity.status = 'expired'; }
        st.cooldowns = {};
        const q = businessOffer254(d, id); if (!q) return null;
        T.clean(); openDecision24('business254', q.id);
        return { id: q.id, buttons: T.buttons() };
      };
      const w398 = win('E0398');
      out.debt398 = w398?.buttons || null;
      out.debtClick = w398 ? T.click(/^Ничего/) && T.click(/^Подтвердить/) : false; T.clean();
      out.debtLeft = w398 ? decisionItems24().some(i => i.ref.kind === 'business254' && i.ref.id === w398.id) : null;
      out.debt403 = win('E0403')?.buttons || null; T.clean();
      out.debt399 = win('E0399')?.buttons || null; T.clean();
      out.debtFinal = !!d.final272 && d.cash < 0;
      shut();

      // Уходит сотрудник с прибавкой: в месяц ухода прибавку, которую списали с дела, получает он сам.
      const bo = T.open('studio', 'photo', 'Прибавка', 2); bo.fit263 = 1.3;
      T.quiet(() => { T.seed(5); T.month([bo], 13); });
      const [w1, w2] = bo.staff155.map(living);
      bo.bonus266 = { [w1.id]: 1000, [w2.id]: 500 };
      bo.leaving266 = { id: w1.id, at: s.clock.ticks + 1 };
      s.pending = [];
      const g1 = w1.privateCash || 0, g2 = w2.privateCash || 0;
      T.quiet(() => { T.seed(6); T.month([bo], 1); });
      const h = bo.history.at(-1);
      out.bonus = { left: !bo.staff155.includes(w1.id), wage: enterpriseWage155(bo), got1: w1.privateCash - g1, got2: w2.privateCash - g2, payroll: h.payroll,
        charged: h.costs - Math.round((h.rent || 0) + (h.branchRent || 0) + (h.overhead || 0) + (h.production || 0)) - (h.incidentCosts || 0) };
      // Сезонный провал: последний месяц в плюсе, два до него в минусе — не «в минусе 1 месяц подряд».
      const n = bo.history.length;
      bo.history.forEach((x, i) => { x.sales = 10000; x.costs = i === n - 3 || i === n - 2 ? 16000 : 8000; });
      bo.history.at(-1).costs = 9500; bo.cash = 50000; delete bo.final272; delete bo.loss272;
      out.dip = bzStatuses272(bo).find(x => x.level === 'dip')?.text || '';
      // «Ожидают ответа»: окно «Дело может закрыться» ждёт в очереди за другим — один пункт, а не два.
      bo.final272 = { at: s.clock.ticks, until: s.clock.ticks + 2 };
      const fin = () => decisionItems24().filter(i => i.ref.kind === 'bz272' && i.ref.id === 'final:' + bo.id || i.ref.kind === 'pending' && /Дело может закрыться/.test(i.title)).length;
      s.pending = [{ type: 'staffLeave266', businessId: bo.id, personId: w2.id }, { type: 'bzFinal272', businessId: bo.id }];
      out.notices = { queued: fin() };
      s.pending = [];
      out.notices.alone = fin();
      shut();

      // Конкурент рядом (266) у цветочной лавки: и подсказка к «Снизить цены» — про покупателей.
      const fl = T.open('shop', 'flowers', 'Букет', 1);
      s.pending = [{ type: 'competitor266', businessId: fl.id }]; resolvePending();
      out.comp = T.buttons().map(b => b.label + ' · ' + b.hint).join(' | ').replace(/\s+/g, ' '); T.clean();
      out.compKinds = Object.keys(bzKinds272).filter(k => bzKinds272[k].who).filter(k => {
        let t = 'Цены ниже рынка · больше клиентов, меньше с каждого'; for (const [from, to] of bzBuild272(k).swaps) t = t.split(from).join(to); return /лиент/.test(t);
      });
      shut();

      // Второе дело, когда первое ведёте сами: «наймите сразу» — только если резерва хватает на две зарплаты; иначе — сколько внести.
      T.open('studio', 'photo', 'Первое', 0);
      const lack = (type, sp) => { const { reserve } = enterpriseQuote152(type, sp); return enterpriseWage155({ type, specialty: sp, country: s.country, city: residenceCity() }) * 2 - reserve; };
      const all = Object.keys(enterpriseTypes152).flatMap(type => enterpriseEntries253(type).filter(([sp]) => sp !== 'school196').map(([sp, label]) => ({ type, sp, label, lack: lack(type, sp) })));
      const poor = all.find(x => x.lack > 0), rich = all.find(x => x.lack <= 0);
      const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const warnFor = x => { if (!x) return null; T.clean(); enterpriseSpecialtyMenu153(x.type, true); T.click(new RegExp('^' + esc(x.label))); const t = T.text(); T.clean(); return t; };
      out.open = { poor: warnFor(poor), rich: warnFor(rich), poorKind: poor && poor.type + '/' + poor.sp, richKind: rich && rich.type + '/' + rich.sp };
      if (poor) {
        s.pending = []; s.cash = 1e9;
        startEnterprise152(poor.type, 'Без резерва', poor.sp, true);
        const nb = s.enterprise152;
        resolvePending();
        out.hire = { title: T.title(), text: T.text(), buttons: T.buttons() };
        out.hire.put = T.click(/^Вложить деньги/);
        out.hire.after = T.buttons();
        out.hire.hired = T.click(/^Нанять сотрудника/);
        out.hire.staff = (nb.staff155 || []).length;
        T.clean();
      }
      shut();

      // Тексты: людей на точке не хватает — без «рабочих мест» и двойного двоеточия, одной строкой в карточке.
      const e = businessCatalog253.find(x => enterpriseAvailable253(x.id) && bzNeed272({ type: x.type, specialty: x.id }) > 1);
      const half = T.open(e.type, e.id, 'Полдня', 0, 'partial');
      T.month([half], 1);
      out.cause = bzCause272(half);
      selectEnterprise168(half.id); enterpriseMenu152(); out.halfCard = T.text(); T.clean();
      half.cash = -500; half.final272 = { at: s.clock.ticks, until: s.clock.ticks + 2 };
      bzDepositMenu272(half); out.deposit = T.buttons().map(b => b.label + ' · ' + b.hint); T.clean();
      shut();
      return out;
    });
    if (r.base || r.error) check(false, '8. рецензия 272.1: business272 не подключён или проверки не выполнены', r.error?.split('\n')[0]);
    else {
      check(r.panel1.buttons === 1 && !r.panel1.raw && r.panel1.opened.join() === 'Ракурс', '8. панель «Моё дело» на вкладке действий, одно дело: кнопка есть и открывает карточку, без обрывков разметки', r.panel1);
      check(r.panel2.buttons === 2 && !r.panel2.raw && [...r.panel2.opened].sort().join() === 'Линия,Ракурс', '8. панель «Моё дело», два дела: две кнопки, каждая открывает своё дело', r.panel2);
      const btn = (list, re) => (list || []).find(b => re.test(b.label));
      check(r.debtFinal && btn(r.debt398, /^Ничего/)?.disabled === false && btn(r.debt398, /^Рекламировать/)?.disabled === true && btn(r.debt398, /^Дифференцироваться/)?.disabled === true,
        '8. дело в долг: в окне события 254 «Ничего» доступно, платные ответы — нет', r.debt398 || r.debtActive);
      check(r.debtClick && r.debtLeft === false, '8. дело в долг: «Ничего» и «Подтвердить» нажимаются, событие уходит из «Ожидают ответа»', { click: r.debtClick, left: r.debtLeft });
      check(['Выкуп доли', 'Кредит', 'Отказ'].every(l => btn(r.debt403, new RegExp('^' + l))?.disabled === false), '8. дело в долг: инвестор — «Выкуп доли», «Кредит», «Отказ» доступны', r.debt403);
      check(btn(r.debt399, /^Найти/)?.disabled === true && btn(r.debt399, /^Перераспределить/)?.disabled === false, '8. дело в долг: сотрудник увольняется — «Перераспределить» доступно, «Найти» (две зарплаты со счёта) — нет', r.debt399);
      const bo = r.bonus;
      check(bo.left && bo.got1 === bo.wage + 1000 && bo.got2 === bo.wage + 500 && Math.abs(bo.charged - (bo.got1 + bo.got2)) <= 1,
        '8. сотрудник с прибавкой уходит: прибавку за последний месяц получает он; списано с дела = получили люди', bo);
      check(/^Два месяца из последних трёх — в минусе, но за 12 месяцев дело в плюсе/.test(r.dip) && !/1 месяц подряд/.test(r.dip), '8. сезон: последний месяц в плюсе — «Два месяца из последних трёх — в минусе», а не «1 месяц подряд»', r.dip);
      check(r.notices.queued === 1 && r.notices.alone === 1, '8. «Ожидают ответа»: «Дело может закрыться» ждёт в очереди — один пункт, без очереди — тоже один', r.notices);
      check(/Снизить цены · .*покупател/.test(r.comp) && !/лиент/.test(r.comp) && !r.compKinds.length, '8. конкурент у цветочной лавки: «больше покупателей», у всех видов со своим словом — без «клиентов»', { comp: r.comp, kinds: r.compKinds });
      check(r.open.poor && /внесите в дело ещё/.test(r.open.poor) && !/Наймите людей сразу/.test(r.open.poor), '8. второе дело без резерва на две зарплаты (' + r.open.poorKind + '): не «наймите сразу», а сколько внести', (r.open.poor || '').slice(-300));
      check(!r.open.rich || /Наймите людей сразу после открытия/.test(r.open.rich), '8. второе дело с резервом (' + r.open.richKind + '): «Наймите людей сразу после открытия»', (r.open.rich || '').slice(-300));
      const hb = r.hire || {};
      check(hb.buttons?.[0]?.label === 'Вложить деньги' && hb.buttons[0].disabled === false && btn(hb.buttons, /^Нанять сотрудника/)?.disabled === true && /Внесите ещё/.test(hb.text || ''),
        '8. окно «Кто будет работать» без резерва: сначала «Вложить деньги», нанять пока нельзя', hb.buttons);
      check(hb.put && btn(hb.after, /^Нанять сотрудника/)?.disabled === false && hb.hired && hb.staff === 1, '8. после «Вложить деньги» сотрудника можно нанять', { after: hb.after, staff: hb.staff });
      check(/^На точке не хватает людей — она работает примерно на \d+%, и помещение быстрее приходит в упадок\.$/.test(r.cause), '8. причина в статусе: простыми словами, одно двоеточие не нужно', r.cause);
      check(!/рабоч\S* мест|\d,\d+ рабоч|::/.test(r.halfCard) && (r.halfCard.match(/не хватает людей — она работает/g) || []).length === 1, '8. карточка: без дробных рабочих мест, строка о людях — один раз', r.halfCard.slice(0, 600));
      check(r.deposit.length >= 2 && /долг и запас на три месяца/.test(r.deposit[0]) && /долг и запас на полгода/.test(r.deposit[1]), '8. вложить деньги при долге: «долг и запас на полгода»', r.deposit);
    }
    check(!errors.length, '8. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  await browser.close();
  console.log('\n' + (fail ? 'FAIL' : 'OK') + ' · ' + pass + ' ok, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
})();
