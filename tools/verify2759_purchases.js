// Проверки сборки 275.9 «Крупные покупки» (fixes2759.js, fixes2759-data.js): ипотека, цены машин, своя машина к
// туристическим местам. Игра раздаётся с диска, сервер не нужен:  node tools/verify2759_purchases.js
// (BASE=1 — без fixes2759.js и fixes2759-data.js: видно, что проверки ловят старое поведение).
// OWNER_SAVE=путь — сохранение владелицы (по умолчанию owner-save.json рядом с рабочей копией, если есть).
// • Ипотека: случай владелицы (Канада, доход 100 тыс. в год, накоплений 70% цены) — есть вариант, который проходит, окно
//   открывается сразу на нём; у отказа — причина с числами и кнопка варианта, который проходит; на кнопках вариантов
//   «банк откажет: …»; доход своего дела, гонораров и сдачи жилья виден банку; заявка вдвоём считает доход партнёра,
//   в договоре — созаёмщик, платёж входит в общие расходы; взнос 60–80% и покупка целиком без банка (с переездом);
//   старая запланированная ипотека проходит; сохранённые ипотеки не меняются. Заявка вдвоём с переездом — партнёр
//   переезжает с вами и платит свою долю; доход партнёра для банка — в шкале ваших зарплат (Турция, Египет), ищущий
//   работу — 0 и без побочных действий; отказ из-за других кредитов — без «банк даёт до −600»; созаёмщика нет в живых —
//   без «живёте отдельно».
// • Машины: цена новой каждой модели в каждой из 25 стран — по таблице, конечная, в разумных пределах от зарплаты;
//   примеры владелицы; кривая подержанных; продажа, подарок ребёнку, наследство, ремонт и кредит считаются от тех же
//   цен; велосипеды; сохранение владелицы грузится, все суммы конечны. Перевезти машину в страну, где она дороже, и
//   продать — без выгоды. С пробегом в «характерном» ряду: нынешние модели — 7 лет, старые — 18.
// • Поездки: Уистлер из Ванкувера на своей машине можно; Мауи, Денпасар, Раджа-Ампат — нельзя, с понятной причиной;
//   паромы (Майорка, Убуд) — в дороге и в деньгах; Рим — Берлин можно; Зальцбург из Берлина считается без ошибки;
//   у всех туристических мест есть координаты. «Не доехать» в «Не хватает» — с кнопкой «Дорога»; паром с материка на
//   остров — всегда (Барселона — Ибица, Бангкок — Самуи, Перт — остров Кенгуру), с самого острова — нет (Денпасар —
//   Убуд); куда не доехать, машину в цене не считают; пробег с разрядами.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const BASE = process.env.BASE === '1';
const OWNER = process.env.OWNER_SAVE || [path.join(ROOT, '..', 'owner-save.json')].find(f => fs.existsSync(f)) || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (!ok && extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 900) : '')); };
const note = t => console.log('note ' + t);

function helpers() {
  window.__still = () => { s.pending = []; s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); __still(); };
  window.__flat = t => String(t || '').replace(/\s+/g, ' ').trim();
  window.__card = () => {
    const d = document.getElementById('modal');
    if (!d || !d.open) return null;
    const lbl = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
    const btn = b => ({ label: lbl(b), hint: __flat([...b.querySelectorAll('small:not(.why273)')].map(x => x.textContent).join(' · ')), why: b.querySelector('small.why273')?.textContent || '', disabled: b.disabled });
    return {
      title: d.querySelector('h2')?.textContent || '',
      top: Object.fromEntries([...d.querySelectorAll('.top273 .row273')].map(r => [r.querySelector('dt')?.textContent || '', __flat(r.querySelector('dd')?.textContent || '')])),
      need: [...d.querySelectorAll('.need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', small: e.querySelector('small')?.textContent || '', button: e.tagName === 'BUTTON' })),
      status: d.querySelector('.status273:not([hidden])')?.textContent || '',
      main: [...d.querySelectorAll('.main273 button')].map(btn),
      set: [...d.querySelectorAll('.setopts273 button')].map(btn),
      all: [...d.querySelectorAll('.options button')].map(btn),
      text: __flat(d.textContent)
    };
  };
  window.__press = start => { start = __flat(start); const b = [...document.querySelectorAll('#modal .options button, #modal .need273 button')].find(b => __flat(b.textContent).startsWith(start)); if (!b) return false; b.click(); return true; };
  window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 7 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk({ cash: s.cash, debts: s.debts, properties: s.properties, transport56: s.transport56, finance43: s.finance43, family54: s.family54 }, 's', 0); return bad; };
  // Рынок покупки в городе: объявление нужного вида, цена — как задано (объявление остаётся действующим).
  window.__listing = (kind, price) => { const m = market41('buy', kind, residenceCity()) || market41('buy', kind === 'house' ? 'flat' : 'house', residenceCity()); const q = m.listings.find(q => !housingState41().used.includes(q.id)); if (price) q.purchase = price; return q; };
  window.__worker = salary => { s.job = s.job || generateJob(); s.job.salary = salary; s.job.workplace = null; s.creditBlockedUntil = 0; for (const d of s.debts) if (d.type === 'bill32') d.balance = 0; };
  // careerVariety: иначе enrichPerson (individual.js) при первом же ensureClock заменит занятие случайной профессией.
  window.__partner = (occupation = 'Инженер') => { const p = person('Партнер', s.age, s.gender === 'm' ? 'f' : 'm', s.country); p.role = 'Партнер'; p.cohabit = true; p.city18 = residenceCity(); p.occupation = occupation; p.careerVariety = true; p.privateCash = 1e7; p.inner ??= { trust: 80, strain: 5 }; p.inner.trust = 80; s.people.push(p); family54().agreements[p.id] = householdDefault54(p); return p; };
}

async function page(browser, { country = 'ca', seed = 2759, owner = false, width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && BASE) body = Buffer.from(body.toString('utf8').replace(/<script src="fixes2759(-data)?\.js[^"]*"><\/script>/g, ''));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (owner) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  } else {
    await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
    await pg.evaluate(() => [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click());
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    try { localStorage.clear(); } catch (e) {}
  });
  await pg.evaluate(helpers);
  await pg.evaluate(() => __still());
  return { pg, ctx, errors };
}
const ev = (pg, fn, arg) => pg.evaluate(fn, arg);
const num = t => Number(String(t || '').replace(/[^\d-]/g, ''));
const sp = t => String(t ?? '').replace(/\s+/g, ' ').trim();

(async () => {
  const browser = await chromium.launch();

  // ---------- 0. Подключение ----------
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    const w = order.indexOf('windows273.js');
    check(BASE || order[w - 1] === 'fixes2759.js' && order[w - 2] === 'fixes2759-data.js', 'подключение: fixes2759-data.js и fixes2759.js — сразу перед windows273.js', order.slice(w - 5, w + 1));
    const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8'));
    check(BASE || assets.includes('fixes2759.js') && assets.includes('fixes2759-data.js') && JSON.stringify(assets) === JSON.stringify([...assets].sort()), 'офлайн: оба файла в offline-assets.json, список по порядку');
    const src = fs.readFileSync(path.join(ROOT, 'fixes2759.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
    check(!/resolvePending\s*=|s\.pending\s*=|s\.pending\.(push|unshift|splice)/.test(src), 'очередь: fixes2759.js не трогает s.pending и resolvePending');
  }

  // ---------- 1. Ипотека ----------
  // 1.1 Случай владелицы: Канада, доход 100 тыс. в год, дом за 1,32 млн, накоплений 70% цены.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 40; __worker(100000);
      const q = __listing('house', 1320000); s.cash = q.purchase * .7;
      const legacy = [[.1, 10], [.2, 20], [.3, 20], [.5, 10], [.2, 30]].map(([d, y]) => { const x = mortgageQuote43(q, d, y, true), z = mortgageQuote43(q, d, y, false); return { d, y, ok: !!x && !x.reasons.length, okStay: !!z && !z.reasons.length, reasons: x?.reasons || [] }; });
      const grid = [];
      for (const d of [.1, .2, .3, .5, .6, .7, .8]) for (const y of [10, 20, 30]) { const x = mortgageQuote43(q, d, y, true); if (x) grid.push({ d, y, ok: !x.reasons.length, pay: Math.round(x.payment), inc: Math.round(x.income), reasons: x.reasons }); }
      housingOfferDetails41(q); const offer = __card(); const mort = offer?.all.find(o => o.label === 'Рассчитать ипотеку');
      closeModal(); mortgageOptions43(q); const card = __card();
      const best = mortgageQuote43(q);
      closeModal(); mortgageOptions43(q, .2, 20, true); const fail = __card();
      const pressed = __press(fail.need.find(n => n.button)?.text || '###'); const after = __card();
      return { legacy, grid, mort, card, fail, pressed, after, best: best && { d: best.down, y: best.years, pay: money(best.payment), reasons: best.reasons }, nan: __nan() };
    });
    check(r.legacy.every(o => !BASE || !o.ok), 'ипотека, случай владелицы: BASE — все прежние варианты «банк откажет», и «Купить без переезда» тоже', r.legacy);
    const pass1 = r.grid.filter(o => o.ok);
    check(pass1.length > 0 && r.grid.some(o => o.d >= .6), 'ипотека, случай владелицы: есть взнос 60–80% и вариант, который проходит', r.grid.filter(o => o.d >= .5));
    check(!!r.best && !r.best.reasons.length && r.best.d >= .6, 'ипотека: mortgageQuote43(объявление) — вариант, который проходит первым (самый маленький взнос)', r.best);
    check(!!r.card && /одобрит/.test(r.card.status) && !!r.best && sp(r.card.top['Платёж']).startsWith(sp(r.best.pay + '/мес.')), '«Рассчитать ипотеку»: окно открывается на варианте, который проходит, статус «Банк одобрит»', r.card && { status: r.card.status, top: r.card.top, best: r.best });
    check(!!r.mort && sp(r.mort.hint).includes(sp('платёж ' + (r.best?.pay || '?') + '/мес.')) && r.mort.hint.includes('при взносе ' + Math.round((r.best?.d || 0) * 100) + '%'), 'объявление: на «Рассчитать ипотеку» — платёж и взнос варианта, который проходит', r.mort);
    check(!!r.card && r.card.set.length > 0 && !/банк откажет/.test(r.card.set[0].hint), 'ипотека: в «Взнос и срок» первыми — варианты, которые проходят', r.card?.set);
    const refused = (r.card?.set || []).filter(o => /банк откажет/.test(o.hint));
    check(refused.length > 0 && refused.every(o => /банк откажет: (платёж \d+(,\d)?% дохода|после платежа|не хватает|срок)/.test(o.hint)), 'ипотека: на каждом «банк откажет» — коротко почему', refused);
    const r40 = r.fail?.need.find(n => /^Платёж [\d\s ]+C\$ — \d+(,\d)?% дохода [\d\s ]+C\$\/мес\., банк даёт до 40%$/.test(n.text));
    check(!!r40, 'ипотека: отказ 20% на 20 лет — «Платёж 6 681 C$ — 80% дохода 8 333 C$/мес., банк даёт до 40%»', r.fail?.need);
    const fix = r.fail?.need.find(n => n.button);
    check(!!fix && /^Взнос \d+% на \d+ лет — платёж [\d\s ]+C\$\/мес\., проходит$/.test(fix.small), 'ипотека: у отказа — кнопка варианта, который проходит («Взнос 60% на 30 лет — платёж … проходит»)', r.fail?.need);
    check(r.pressed && !!r.after && /одобрит/.test(r.after.status), 'ипотека: нажали на вариант из «Не хватает» — окно на нём, банк одобрит', r.after && { status: r.after.status, top: r.after.top });
    check(!!r.card && /^[\d\s ]+C\$\/мес\./.test(r.card.top['Доход для банка'] || '') && /зарплата 8[\s ]333 C\$/.test(r.card.top['Доход для банка'] || ''), 'ипотека: строка «Доход для банка» — сколько и из чего', r.card?.top);
    check(!r.nan.length && errors.length === 0, 'ипотека, случай владелицы: без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  // 1.2 Доход не от зарплаты: своё дело, гонорары, сдача жилья — банк видит; без работы, но с делом — не «нужен доход».
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 35; s.job = null; s.creditBlockedUntil = 0;
      const q = __listing('flat', 400000); s.cash = 200000;
      const before = mortgageQuote43(q, .3, 20, true);
      // Своё дело: прибыль 4 000 в месяц последние 12 месяцев.
      const b = { id: 'biz-test', status: 'active', country: s.country, title: 'Пекарня', cash: 5000, history: Array.from({ length: 12 }, (_, i) => ({ tick: s.clock.ticks - i, sales: 10000, costs: 6000 })) };
      s.enterprise152 = b;
      // Гонорар 12 000 за заказ три месяца назад.
      creative47().applications.push({ id: 'app-test', offer: { country: s.country, title: 'Обложка' }, status: 'completed', paid: 12000, completed: s.clock.ticks - 3 });
      const after = mortgageQuote43(q, .3, 20, true);
      return { before: before.reasons, after: after.reasons, income: after.income, parts: typeof mortgageIncome2759 === 'function' ? mortgageIncome2759().parts : [], tax: typeof taxRate266 === 'function' ? taxRate266() : 0 };
    });
    const keep = 1 - r.tax, want = 4000 * keep + 12000 / 12 * keep;
    check(Math.abs(r.income - want) < 1, 'ипотека: без работы — своё дело (прибыль за 12 мес.) и гонорары (за 12 мес.) после налога считаются доходом', { income: r.income, want, parts: r.parts });
    check(r.before.includes('Нужен подтверждённый доход от работы или пенсии') && !r.after.includes('Нужен подтверждённый доход от работы или пенсии'), 'ипотека: с делом и гонорарами «нужен доход» пропадает', r);
    check(errors.length === 0, 'ипотека, доход не от зарплаты: без ошибок', errors);
    await ctx.close();
  }
  // 1.3 Заявка вдвоём, покупка целиком, старая запланированная ипотека.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 32; __worker(60000);
      const q = __listing('flat', 700000); s.cash = q.purchase * .24;
      const p = __partner();
      const alone = mortgageQuote43(q, .2, 30, true, null), both = mortgageQuote43(q, .2, 30, true, p.id);
      mortgageOptions43(q, .2, 30, true); const card = __card();
      const toggle = card?.set.find(o => o.label.startsWith('Заявка вдвоём · '));
      __press('Заявка вдвоём · '); const joint = __card();
      const bill0 = sharedBill54();
      const bought = mortgageBuy43(q, .2, 30, false, p.id); // без переезда: общие расходы меняет только платёж
      const d = s.debts.find(d => d.mortgage43);
      const bill1 = sharedBill54();
      return { alone: alone.reasons, aloneIncome: alone.income, bothIncome: both.income, both: both.reasons, toggle, jointStatus: joint?.status, jointTop: joint?.top, bought, co: d?.coBorrower2759 || null, pay: d ? d.payment * debtRatio(d) : 0, bill0, bill1, name: p.name, nan: __nan() };
    });
    check(r.alone.length > 0 && r.both.length === 0 && r.bothIncome > r.aloneIncome + 1000, 'заявка вдвоём: одному банк откажет, вдвоём — доход партнёра считается и проходит', r);
    check(!!r.toggle && /^доход для банка [\d\s]+C\$\/мес\.\s+(·\s+)?проходит$/.test(r.toggle.hint), 'заявка вдвоём: в «Взнос и срок» кнопка «Заявка вдвоём · имя» с доходом и «проходит»', r.toggle);
    check(/вдвоём/.test(r.jointStatus || '') && (r.jointTop?.['Доход для банка'] || '').includes(r.name), 'заявка вдвоём: после нажатия — «Банк одобрит заявку вдвоём», в доходе — партнёр по имени', { status: r.jointStatus, top: r.jointTop });
    check(r.bought && r.co?.name === r.name && Math.abs(r.bill1 - r.bill0 - r.pay) < 1, 'заявка вдвоём: в договоре созаёмщик, платёж вошёл в общие расходы (партнёр платит свою долю)', { co: r.co, bill0: r.bill0, bill1: r.bill1, pay: r.pay });
    check(!r.nan.length && errors.length === 0, 'заявка вдвоём: без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  // 1.4 Заявка вдвоём с переездом (рецензия 275.9): партнёр переезжает с вами, общие расходы остаются, он платит свою долю
  // платежа. Раньше moveHome → leaveHome снимал «живёте вместе», и одобренный на двоих платёж с первого месяца был на вас.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 32; __worker(60000);
      const p = __partner(); p.privateCash = 50000;
      __month(1);
      const q = __listing('flat', 700000); s.cash = q.purchase * .30;
      mortgageOptions43(q, .2, 30, true); const solo = __card();
      __press('Заявка вдвоём · '); const joint = __card();
      const pressed = __press('Запланировать покупку в ипотеку');
      const logs0 = s.log.length;
      __month(1);
      const d = s.debts.find(x => x.mortgage43), a = family54().agreements[p.id];
      const after = { deal: !!householdDeal54(), cohabit: p.cohabit, occupant: s.housing.occupant === p.id, mode: s.housing.mode, home: s.housing.propertyId === s.properties.find(x => x.mortgageId43 === d?.id)?.id, apart: s.log.slice(0, Math.max(0, s.log.length - logs0) + 5).some(e => e.title === 'Живёте раздельно') };
      __month(1);
      const pay = d ? d.payment * debtRatio(d) : 0, month = { paidNow: a.lastPaid === s.clock.ticks ? a.paid : 0, due: a.due, share: a.share, pay, deal: !!householdDeal54() };
      let menu = ''; if (d) { mortgageMenu43(d.id); menu = __flat(document.getElementById('modal')?.textContent || ''); closeModal(); }
      return { soloFam: solo?.top['Семья'] || '', jointFam: joint?.top['Семья'] || '', jointStatus: joint?.status, pressed, co: d?.coBorrower2759?.name || null, name: p.name, after, month, menu: menu.match(/Созаёмщик[^.]*\.[^.]*\./)?.[0] || '', nan: __nan() };
    });
    check(sp(r.soloFam).includes(r.name + ' остаётся по прежнему адресу'), 'ипотека с переездом, заявка на вас: в карточке «Семья» — партнёр остаётся по прежнему адресу (как при других переездах)', { fam: r.soloFam });
    check(sp(r.jointFam).startsWith('Переезжаете вдвоём: ' + r.name + '.') && /вдвоём/.test(r.jointStatus || ''), 'ипотека с переездом, заявка вдвоём: в карточке «Семья» — «Переезжаете вдвоём: имя»', { fam: r.jointFam, status: r.jointStatus });
    check(r.pressed && r.co === r.name && r.after.mode === 'own' && r.after.home, 'заявка вдвоём с переездом: ипотека оформлена, созаёмщик в договоре, вы живёте в купленном', r);
    check(r.after.deal && r.after.cohabit && r.after.occupant && !r.after.apart, 'заявка вдвоём с переездом: партнёр переехал с вами — живёте вместе, общие расходы остались, без «Живёте раздельно»', r.after);
    check(r.month.deal && r.month.due >= r.month.pay * (1 - r.month.share) - 1 && r.month.paidNow >= r.month.pay * (1 - r.month.share) - 1, 'заявка вдвоём с переездом: через месяц партнёр внёс свою долю, и платёж по ипотеке в ней', r.month);
    check(/Пока вы живёте вместе/.test(r.menu), 'заявка вдвоём с переездом: в окне ипотеки — «Пока вы живёте вместе, имя вносит свою долю»', r.menu);
    check(!r.nan.length && errors.length === 0, 'заявка вдвоём с переездом: без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  // 1.5 Доход партнёра для банка (рецензия 275.9): в шкале ваших зарплат; ищущий работу — 0, расчёт ничего не меняет.
  for (const country of ['tr', 'eg', 'ca']) {
    const { pg, ctx, errors } = await page(browser, { country });
    const r = await ev(pg, () => {
      s.age = 32; const w = vacancyWage97(s.country, residenceCity()); __worker(w);
      const p = __partner('Инженер'); p.privateCash = 1e6;
      __month(1);
      const game = family54().agreements[p.id].partnerSalary / 12;
      return { country: s.country, city: residenceCity(), player: w / 12, partner: typeof partnerMonthly2759 === 'function' ? partnerMonthly2759(p) : game, game };
    });
    const k = r.partner / r.player;
    if (r.country === 'ca') check(Math.abs(r.partner - r.game) < 1, 'доход партнёра для банка, Канада: как платит игра (зарплата страны не выше городской)', r);
    else check(BASE || k > .5 && k < 1.05, 'доход партнёра для банка, ' + r.city + ': в шкале ваших зарплат (инженер — около 80% городской зарплаты, а не в ' + (r.game / r.player).toFixed(1) + ' раза больше)', { ...r, k });
    check(errors.length === 0, 'доход партнёра для банка, ' + r.country + ': без ошибок', errors);
    await ctx.close();
  }
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 30; s.job = null; s.cash = 1e6;
      const q = __listing('flat', 400000);
      const p = __partner('Поиск работы');
      const a = family54().agreements[p.id];
      const pm = p => typeof partnerMonthly2759 === 'function' ? partnerMonthly2759(p) : NaN;
      const x1 = mortgageQuote43(q, .5, 20, true, p.id), m1 = pm(p), x2 = mortgageQuote43(q, .5, 20, true, p.id), m2 = pm(p);
      return { salary: a.partnerSalary ?? null, i1: x1.income, i2: x2.income, m1, m2, agency: !!p.agency55, occupation: p.occupation };
    });
    check(BASE || r.salary === null && r.i1 === 0 && r.i2 === 0 && r.m1 === 0 && r.m2 === 0 && !r.agency && r.occupation === 'Поиск работы', 'доход партнёра для банка: ищет работу, месяц ещё не рассчитан — 0 при каждом расчёте, и расчёт ничего не меняет у партнёра', r);
    check(errors.length === 0, 'доход партнёра, ищет работу: без ошибок', errors);
    await ctx.close();
  }
  // 1.6 Отказ из-за других кредитов: без отрицательного «банк даёт до …»; созаёмщика нет в живых — без «живёте отдельно».
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 35; __worker(60000); s.cash = 300000;
      s.debts.push({ id: 'dbt-x', type: 'bank', country: s.country, balance: 100000, principal: 100000, rate: .1, payment: 2600, term: 60, paid: 0, missed: 0, started: s.clock.ticks });
      const q = __listing('flat', 400000);
      mortgageOptions43(q, .2, 20, true); const card = __card(); closeModal();
      s.debts = s.debts.filter(d => d.id !== 'dbt-x');
      // Совместная ипотека, потом созаёмщик умирает.
      __worker(60000); const p = __partner(); __month(1);
      const q2 = __listing('flat', 500000); s.cash = 1e6;
      const ok = mortgageBuy43(q2, .3, 20, false, p.id), d = s.debts.find(x => x.mortgage43 && x.coBorrower2759);
      p.alive = false; p.cohabit = false;
      let menu = ''; if (d) { mortgageMenu43(d.id); menu = __flat(document.getElementById('modal')?.textContent || ''); closeModal(); }
      return { need: card?.need || [], ok, menu: menu.match(/Созаёмщик[^.]*\.[^.]*\./)?.[0] || menu.slice(-200) };
    });
    const loans = r.need.find(n => /другие кредиты/.test(n.text));
    check(!!loans && !/-\s?\d/.test(loans.small) && (BASE || /другие кредиты уже берут \d+(,\d)?% дохода — сначала погасите часть/.test(loans.small)), 'ипотека: другие кредиты больше 40% дохода — «другие кредиты уже берут 52% дохода — сначала погасите часть», без «банк даёт до -600»', r.need);
    check(BASE || r.ok && /Теперь платёж целиком на вас/.test(r.menu) && !/живёте отдельно/.test(r.menu), 'ипотека: созаёмщика нет в живых — «Теперь платёж целиком на вас», без «живёте отдельно»', r.menu);
    check(errors.length === 0, 'ипотека: другие кредиты и созаёмщик — без ошибок', errors);
    await ctx.close();
  }
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 45; __worker(70000);
      const q = __listing('flat', 500000), moving = c().cost * .015; s.cash = q.purchase * 1.03 + moving + 1000;
      mortgageOptions43(q); const card = __card();
      const cashBtn = card?.main.find(o => o.label === 'Купить целиком · без банка');
      const props0 = s.properties.length;
      __press('Купить целиком · без банка');
      // Задание выполняется в начале следующего месяца; здесь — само задание, чтобы видеть списание без расходов месяца.
      const task = s.clock.tasks.find(t => t.kind === 'queuedAction' && t.action === 'house2759'), cash0 = s.cash;
      if (task) { s.clock.tasks = s.clock.tasks.filter(t => t !== task); executeCommand05(task); }
      const spentNow = cash0 - s.cash;
      __month(1);
      const prop = s.properties[props0];
      return { main: card?.main, cashBtn, queued: !!task, spent: spentNow, want: q.purchase * 1.03 + moving, bought: s.properties.length - props0, mode: s.housing.mode, home: s.housing.propertyId === prop?.id, debts: s.debts.filter(d => d.mortgage43).length, nan: __nan() };
    });
    check(!!r.cashBtn && !r.cashBtn.disabled, 'покупка целиком: денег хватает на цену с оформлением и переезд — кнопка «Купить целиком · без банка» среди главных', r.main);
    check(r.bought === 1 && r.mode === 'own' && r.home && r.debts === 0, 'покупка целиком: через месяц жильё ваше, вы в нём живёте, ипотеки нет', r);
    check(r.queued && Math.abs(r.spent - r.want) < 2, 'покупка целиком: запланирована; при выполнении списаны цена с оформлением и переезд — ровно столько, сколько «сразу» на кнопке', { queued: r.queued, spent: r.spent, want: r.want });
    check(!r.nan.length && errors.length === 0, 'покупка целиком: без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 40; __worker(150000);
      const q = __listing('flat', 400000); s.cash = 300000;
      // Ипотека, запланированная до обновления: в задании нет поля joint.
      queueCommand05('mortgage43', { listing: JSON.parse(JSON.stringify(q)), down: .2, years: 20, live: false }, 'Купить в ипотеку · ' + q.city);
      const want = mortgageQuote43(q, .2, 20, false).payment;
      __month(1);
      const d = s.debts.find(d => d.mortgage43);
      // 70% взноса — тот же платёж в договоре.
      const q2 = __listing('house', 600000); s.cash = 1e6;
      const x = mortgageQuote43(q2, .7, 20, false), ok = x && !x.reasons.length && mortgageBuy43(q2, .7, 20, false);
      const d2 = s.debts.filter(d => d.mortgage43)[1];
      return { got: d ? d.payment : null, want, co: d?.coBorrower2759 ?? null, ok, pay2: d2?.payment, want2: x?.payment, nan: __nan() };
    });
    check(r.got !== null && Math.abs(r.got - r.want) < .01 && r.co === null, 'ипотека, запланированная до обновления: оформлена с тем же платежом, без созаёмщика', r);
    check(BASE ? !r.ok : r.ok && Math.abs(r.pay2 - r.want2) < .01, 'ипотека со взносом 70%: оформляется, в договоре тот же платёж', r);
    check(!r.nan.length && errors.length === 0, 'ипотека, старая очередь и 70%: без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }

  // ---------- 2. Машины ----------
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      const out = { bad: [], local: [], far: [], months: [], samples: {} };
      const wage = k => vacancyWage97(k, cities[k][0]) / 12;
      for (const m of vehicleCatalog56.filter(m => m.kind === 'car')) for (const k of Object.keys(countries)) {
        const p = carPrice98(m, k, false, 100, 0);
        if (!Number.isFinite(p) || p <= 0) { out.bad.push(k + ':' + m.name + '=' + p); continue; }
        if (typeof carNew2759 === 'object') {
          const row = carNew2759[m.name], cc = carCountry2759[k];
          const want = row ? (row[1][k] != null ? row[1][k] * cc[1] : row[0] * cc[2] * cc[0] * cc[1]) : NaN;
          if (!(Math.abs(p - want) / want < .006)) out.far.push(k + ':' + m.name + ' ' + p + ' vs ' + Math.round(want));
        }
        const months = p / wage(k);
        out.months.push(months);
        if (months < 1.5 || months > 2500) out.local.push(k + ':' + m.name + ' ' + months.toFixed(1) + ' мес.');
      }
      const sample = (k, n) => { const m = vehicleCatalog56.find(m => m.name === n); return carPrice98(m, k, false, 100, 0); };
      for (const [k, n] of [['ca', 'Honda Civic'], ['us', 'Honda Civic'], ['us', 'Toyota Camry'], ['us', 'Ford F-150'], ['us', 'Cadillac Escalade'], ['de', 'Volkswagen Golf'], ['de', 'Porsche 911'], ['ru', 'Lada Niva'], ['mx', 'VW Beetle / Vocho'], ['ca', 'Toyota RAV4'], ['ca', 'Lexus RX']]) out.samples[k + ':' + n] = sample(k, n);
      // Подержанные: доля новой по возрасту и состоянию.
      const civic = vehicleCatalog56.find(m => m.name === 'Honda Civic'), share = (age, cond) => carPrice98(civic, 'ca', true, cond, age) / carPrice98(civic, 'ca', false, 100, 0);
      out.curve = { y3c80: share(3, 80), y5c75: share(5, 75), y7c72: share(7, 72), y12c70: share(12, 70), y18c65: share(18, 65), y15c30: share(15, 30), y3c30: share(3, 30) };
      out.mono = [1, 3, 5, 7, 10, 15, 20].map(a => share(a, 75)).every((v, i, a) => !i || v < a[i - 1]) && [90, 75, 60, 45, 30].map(c => share(7, c)).every((v, i, a) => !i || v < a[i - 1]);
      const rav = vehicleCatalog56.find(m => m.name === 'Toyota RAV4'); out.rav = carPrice98(rav, 'ca', true, 75, 7) / carPrice98(rav, 'ca', false, 100, 0);
      const p911 = vehicleCatalog56.find(m => m.name === 'Porsche 911'); out.p911 = carPrice98(p911, 'de', true, 75, 18) / carPrice98(p911, 'de', false, 100, 0);
      return out;
    });
    check(!r.bad.length, 'машины: цена новой каждой модели в каждой из 25 стран конечная и больше нуля', r.bad.slice(0, 10));
    check(BASE || !r.far.length, 'машины: цена новой — по таблице fixes2759-data.js (модель × страна), с точностью до округления', r.far.slice(0, 10));
    check(BASE || !r.local.length, 'машины: каждая новая стоит от 1,5 до 2500 месячных зарплат страны (Ferrari в Египте — около 1500)', r.local.slice(0, 10));
    const S = r.samples;
    check(S['ca:Honda Civic'] >= 27000 && S['us:Honda Civic'] >= 22000 && S['us:Toyota Camry'] >= 26000 && S['us:Ford F-150'] >= 36000 && S['us:Cadillac Escalade'] >= 80000 && S['de:Volkswagen Golf'] >= 27000 && S['de:Porsche 911'] >= 100000, 'машины: примеры владелицы — Civic в Канаде ≈ 30 тыс., в США ≈ 25 тыс., Camry, F-150, Escalade, Golf, Porsche 911 по настоящим ценам', S);
    check(S['de:Porsche 911'] > 3 * S['de:Volkswagen Golf'], 'машины: Porsche 911 — своей ценой (дороже трёх Golf), а не «характерная» с одним множителем на Porsche, Ниву и «Вочо»', S);
    const c = r.curve;
    check(c.y3c80 >= .6 && c.y3c80 <= .75 && c.y5c75 >= .5 && c.y5c75 <= .65 && c.y7c72 >= .45 && c.y7c72 <= .6 && c.y15c30 >= .1 && c.y15c30 <= .25 && r.mono, 'подержанные: 3 года и 80/100 ≈ 70% новой, 5–7 лет ≈ 50–60%, старая и 30/100 ≈ 15–25%, старше и хуже — дешевле', c);
    check(r.rav >= .45 && r.p911 > c.y18c65, 'подержанные: RAV4 7 лет 75/100 — около половины новой; Porsche 911 дешевеет медленнее обычной', { rav: r.rav, p911: r.p911, usual18: c.y18c65 });
    check(errors.length === 0, 'машины: без ошибок страницы', errors);
    await ctx.close();
  }
  // 2.2 Покупка, продажа, кредит, подарок ребёнку, наследство, ремонт, машина родителя, велосипед.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 30; __worker(70000); s.cash = 200000; transportState56().licenses.push('ca');
      const z = transportState56(), civic = vehicleCatalog56.find(m => m.name === 'Honda Civic');
      const qNew = vehicleOffer56(civic.id, false), qUsed = vehicleOffer56(civic.id, true);
      const vNew = buyVehicle56(qNew.id, false);
      const value0 = vehicleValue56(vNew);
      // Через три года, состояние 80.
      vNew.acquired = s.clock.ticks - 36; vNew.year = s.year - 3; vNew.condition = 80;
      const value3 = vehicleValue56(vNew), market3 = carPrice98(civic, 'ca', true, 80, 3);
      const cash0 = s.cash; const sold = sellVehicle56(vNew.id); const got = s.cash - cash0;
      // Кредит на новую: взнос 20%, 48 мес.
      const q2 = vehicleOffer56(vehicleCatalog56.find(m => m.name === 'Toyota RAV4').id, false);
      const credit = purchaseWhy56(q2, true), v2 = buyVehicle56(q2.id, true), loan = s.debts.find(d => d.vehicle56 === v2?.id);
      // Подержанная: сразу после покупки продать дешевле, чем купили.
      const vUsed = buyVehicle56(qUsed.id, false), usedValue = vehicleValue56(vUsed);
      // Наследство: стоимость имущества = продажа.
      const asset = typeof assetValue58 === 'function' ? assetValue58({ type: 'vehicle', vehicle: vUsed.id }) : null;
      // Ремонт: у исправной машины ремонт дешевле её самой.
      vUsed.condition = 24; const repair = vehicleRepairQuote56(vUsed), junkValue = vehicleValue56(vUsed);
      const line = typeof repairLine27371 === 'function' ? repairLine27371(vUsed) : '';
      // Подарок ребёнку: подержанные по тем же ценам.
      const gift = vehicleCatalog56.filter(m => m.kind === 'car' && m.weights[s.country]).map(m => vehicleOffer56(m.id, true)).map(q => ({ model: q.model, price: q.price, market: carPrice98(vehicleModel56(q.model), 'ca', true, q.condition, q.age) }));
      // Машина родителя: старая бюджетная, 14 лет, 67/100.
      const parentPrice = carPrice98(vehicleCatalog56.find(m => m.kind === 'car' && m.roles.ca === 0), 'ca', true, 67, 14);
      // Велосипед: новый — прежняя цена; с пробегом — по кривой.
      const bike = vehicleCatalog56.find(m => m.id === 'bike56-city'), bNew = vehicleOffer56(bike.id, false), bUsed = vehicleOffer56(bike.id, true);
      return { qNew: qNew.price, qUsed: { price: qUsed.price, age: qUsed.age, cond: qUsed.condition }, value0, value3, market3, sold, got, credit, loan: loan ? { balance: loan.balance, payment: loan.payment } : null, v2price: q2.price, usedValue, usedPrice: qUsed.price, asset, repair, junkValue, line, gift, parentPrice, bNew: bNew.price, bWant: Math.round(c().cost * bike.price), bUsed: bUsed.price / bNew.price, bAge: bUsed.age, bCond: bUsed.condition, nan: __nan() };
    });
    check(r.qNew === 30000 && Math.abs(r.value0 - r.qNew * .8) < 2, 'машина: новая Civic за 30 000 C$, сразу продать — 80% (быстрая продажа)', r);
    check(Math.abs(r.value3 - r.market3 * .8) / r.market3 < .02 && r.value3 / r.qNew > .5 && r.value3 / r.qNew < .6, 'машина: через три года и 80/100 — 80% рыночной цены такой же подержанной (≈ 55% новой)', { value3: r.value3, market3: r.market3, new: r.qNew });
    check(r.sold && Math.abs(r.got - r.value3) < 1, 'продажа: на руки ровно столько, сколько «Продажа» в карточке', { got: r.got, value: r.value3 });
    check(!r.credit.length && !!r.loan && Math.abs(r.loan.balance - r.v2price * .8) < 1 && Number.isFinite(r.loan.payment), 'кредит на машину: от новой цены, взнос 20%, остальное — кредит', r);
    check(r.usedValue < r.usedPrice && r.usedValue > r.usedPrice * .7, 'подержанная: купить и сразу продать — дешевле, чем купили (без выгоды на перепродаже)', { price: r.usedPrice, value: r.usedValue });
    check(r.asset === null || Math.abs(r.asset - r.usedValue) < 1, 'наследство: стоимость машины в имуществе = цена продажи', { asset: r.asset, value: r.usedValue });
    check(r.repair < r.junkValue ? !r.line : /Ремонт .* сама машина стоит/.test(r.line), 'ремонт: «ремонт дороже машины» — только если правда дороже', { repair: r.repair, value: r.junkValue, line: r.line });
    check(r.gift.every(g => g.price === g.market), 'подарок ребёнку: подержанные машины — по тем же ценам (carPrice98)', r.gift.filter(g => g.price !== g.market));
    check(Number.isFinite(r.parentPrice) && r.parentPrice > 3000 && r.parentPrice < 15000, 'машина родителя: старая бюджетная 14 лет — несколько тысяч C$', r.parentPrice);
    check(r.bNew === r.bWant && (BASE || r.bUsed >= .38 && r.bUsed <= .55), 'велосипед: новый — прежняя цена; с пробегом 4 года — около половины новой', { bNew: r.bNew, want: r.bWant, used: r.bUsed, age: r.bAge, cond: r.bCond });
    check(!r.nan.length && errors.length === 0, 'машины: покупка, продажа, кредит, ремонт — без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  // 2.2a Перевезти машину туда, где она дороже, и продать — без выгоды (рецензия 275.9: Alphard Япония → Египет давал
  // +150 тыс. евро, почти 8 лет зарплаты в Египте). В страну подешевле — по местному рынку.
  for (const [from, model, to, city] of [['jp', 'Toyota Alphard', 'eg', 'Каир'], ['us', 'Ford Mustang', 'eg', 'Каир'], ['in', 'Maruti Suzuki Swift', 'eg', 'Каир'], ['de', 'Volkswagen Golf', 'tr', 'Стамбул']]) {
    const { pg, ctx, errors } = await page(browser, { country: from, seed: 7 });
    const r = await ev(pg, ([model, to, city]) => {
      s.age = 30; transportState56().licenses.push(s.country); s.cash = 1e12;
      const m = vehicleCatalog56.find(m => m.name === model), eur = x => x / fxRate86('de');
      const q = vehicleOffer56(m.id, false), v = buyVehicle56(q.id, false);
      if (!v) return { err: 'не куплена' };
      const paid = eur(q.price), valueHome = eur(vehicleValue56(v));
      // Переезд, как в verify27371_transport.js: деньги по курсу, новая страна и город.
      s.cash *= fxRate86(s.country, to); s.job = null; s.country = to; Object.assign(s.housing, { country: to, city, area: 'suburb' });
      const c1 = s.cash, brought = bringVehicle56(v.id), fee = eur(c1 - s.cash), valueThere = eur(vehicleValue56(v));
      const marketThere = eur(carPrice98(m, to, false, 100, 0)) * .8;
      const c2 = s.cash, sold = sellVehicle56(v.id), got = eur(s.cash - c2);
      return { model, paid: Math.round(paid), valueHome: Math.round(valueHome), brought, fee: Math.round(fee), valueThere: Math.round(valueThere), marketThere: Math.round(marketThere), sold, got: Math.round(got), profit: Math.round(got - paid - fee), nan: __nan() };
    }, [model, to, city]);
    check(!r.err && r.brought && r.sold && r.profit <= 0 && r.valueThere <= r.valueHome + 1 && r.valueThere <= r.marketThere + 1, 'машина ' + model + ': купить (' + from + '), перевезти (' + to + ') и продать — без выгоды; стоит не дороже, чем дома, и не дороже местного рынка', r);
    check(!(r.nan || []).length && errors.length === 0, 'машина ' + model + ' ' + from + ' → ' + to + ': без NaN и ошибок', { nan: r.nan, errors });
    await ctx.close();
  }
  // 2.2b С пробегом в «характерном» ряду: нынешние модели (Crosstrek, Mustang, 911) — 7 лет, как в других рядах; старые
  // (2CV, «Вочо») — 18 (рецензия 275.9: Crosstrek, на который жаловалась владелица, подешевел до 25% новой).
  for (const [k, name, age] of [['ca', 'Subaru Crosstrek', 7], ['us', 'Ford Mustang', 7], ['de', 'Porsche 911', 7], ['fr', 'Citroën 2CV', 18], ['mx', 'VW Beetle / Vocho', 18]]) {
    const { pg, ctx, errors } = await page(browser, { country: k });
    const r = await ev(pg, name => {
      const m = vehicleCatalog56.find(m => m.name === name), q = vehicleOffer56(m.id, true), n = carPrice98(m, s.country, false, 100, 0);
      return { age: q.age, price: q.price, cond: q.condition, share: q.price / n, market: carPrice98(m, s.country, true, q.condition, q.age), role: m.roles[s.country] };
    }, name);
    check(r.role === 4 && r.age === age && r.price === r.market && (age === 18 || r.share > .45 && r.share < .7), 'с пробегом, «характерная» ' + name + ': ' + age + ' лет' + (age === 7 ? ', около половины новой' : '') + ' (цена ' + r.price + ', ' + Math.round(r.share * 100) + '% новой)', r);
    check(errors.length === 0, 'с пробегом ' + name + ': без ошибок', errors);
    await ctx.close();
  }
  // 2.3 Сохранение владелицы: грузится, машины стоят по рынку, всё конечно; 12 месяцев без NaN.
  if (OWNER && fs.existsSync(OWNER)) {
    const { pg, ctx, errors } = await page(browser, { owner: true });
    const r = await ev(pg, () => {
      const vs = transportState56().vehicles.map(v => ({ id: v.id, model: vehicleModel56(v.model)?.name, owner: v.owner, status: v.status, value: vehicleValue56(v), upkeep: vehicleCost56(v).total, repair: vehicleRepairQuote56(v), paid: v.paidPrice }));
      const debts = s.debts.map(d => ({ id: d.id, balance: d.balance, payment: d.payment }));
      const nan0 = __nan();
      __month(12);
      return { vs, debts, nan0, nan: __nan(), cash: s.cash, vs2: transportState56().vehicles.map(v => vehicleValue56(v)) };
    });
    check(r.vs.length > 0 && r.vs.every(v => Number.isFinite(v.value) && v.value > 0 && Number.isFinite(v.upkeep) && Number.isFinite(v.repair)), 'сохранение владелицы: каждая машина и велосипед стоят конечную сумму больше нуля, содержание и ремонт конечны', r.vs);
    const panda = r.vs.find(v => v.model === 'Fiat Panda');
    if (panda) check(BASE || panda.value > 1000, 'сохранение владелицы: Fiat Panda стоит не 36 A$, а по рынку (' + Math.round(panda.value) + ' A$; ремонт ' + Math.round(panda.repair) + ' A$)', panda);
    check(!r.nan0.length && !r.nan.length && Number.isFinite(r.cash) && r.vs2.every(Number.isFinite), 'сохранение владелицы: после загрузки и 12 месяцев — без NaN', { nan0: r.nan0, nan: r.nan });
    check(errors.length === 0, 'сохранение владелицы: без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  } else note('сохранения владелицы нет — проверка пропущена');

  // ---------- 3. Своя машина к туристическим местам ----------
  const trip = async (country, home, cases) => {
    const { pg, ctx, errors } = await page(browser, { country });
    const r = await ev(pg, ([home, cases]) => {
      s.age = 30; s.cash = 1e6 * (fxRates86[s.country] || 1); if (home && residenceCity() !== home) moveHome('rent', home, 'center');
      const z = transportState56(); if (!z.licenses.includes(s.country)) z.licenses.push(s.country);
      const m = vehicleCatalog56.find(m => m.kind === 'car' && m.weights[s.country]);
      z.vehicles.push({ id: 'car-trip', model: m.id, kind: 'car', owner: 'player', country: s.country, city: residenceCity(), area: s.housing.area, priceCountry: s.country, paidPrice: 20000, boughtCondition: 90, condition: 90, year: s.year - 2, acquired: s.clock.ticks, status: 'owned', history: [], damage: null, unfunded: false, lastPay: s.clock.ticks });
      return { home: residenceCity(), out: cases.map(([k, city, days]) => { const d = { country: k, city, days, comfort: 'standard', companion: null, journey57: { route: 'car', car: 'car-trip', pets: [] } }; try { const q = journeyCarQuote57(d); return { k, city, days, why: carJourneyWhy57(d), km: journeyKm57(d), total: q.total, ferry: q.ferry }; } catch (e) { return { k, city, days, err: String(e.message) }; } }) };
    }, [home, cases]);
    await ctx.close();
    return { ...r, errors };
  };
  {
    const r = await trip('ca', 'Ванкувер', [['ca', 'Уистлер', 3], ['ca', 'Банф', 7], ['us', 'Мауи', 14], ['id', 'Денпасар', 14], ['us', 'Лас-Вегас', 14]]);
    const [wh, banff, maui, bali, vegas] = r.out;
    check(r.home === 'Ванкувер' && !wh.err && wh.why.length === 0 && wh.km > 150 && wh.km < 400, 'поездка: Уистлер из Ванкувера на своей машине на 3 дня можно — около 300 км туда и обратно (BASE: «выберите общественный транспорт»)', wh);
    check(!banff.err && banff.why.length === 0, 'поездка: Банф из Ванкувера на неделю — можно', banff);
    check(!maui.err && maui.why.length === 1 && /^Мауи — остров без автопарома: на машине не доехать, только самолёт$/.test(maui.why[0]), 'поездка: Мауи — «остров без автопарома: на машине не доехать, только самолёт»', maui);
    check(!bali.err && bali.why.length === 1 && /^Денпасар — за морем: на машине не доехать, только самолёт$/.test(bali.why[0]), 'поездка: Денпасар (Бали) из Канады — «за морем: на машине не доехать, только самолёт»', bali);
    check(!vegas.err && vegas.why.length === 0 && Number.isFinite(vegas.total), 'поездка: Лас-Вегас из Ванкувера на две недели — можно, деньги посчитаны', vegas);
    check(r.errors.length === 0, 'поездки из Ванкувера: без ошибок', r.errors);
  }
  {
    const r = await trip('id', 'Джакарта', [['id', 'Убуд', 14], ['id', 'Раджа-Ампат', 14], ['id', 'Боробудур', 7]]);
    const [ubud, raja, boro] = r.out;
    check(!ubud.err && ubud.why.length === 0 && ubud.ferry > 0, 'поездка: Убуд из Джакарты на две недели — можно, с автопаромом Ява — Бали (паром в деньгах)', ubud);
    check(!raja.err && raja.why.length === 1 && /^Раджа-Ампат — .*на машине не доехать, только самолёт$/.test(raja.why[0]), 'поездка: Раджа-Ампат — на машине не доехать, только самолёт', raja);
    check(!boro.err && boro.why.length === 0, 'поездка: Боробудур из Джакарты на неделю — можно', boro);
    check(r.errors.length === 0, 'поездки из Джакарты: без ошибок', r.errors);
  }
  {
    const r = await trip('es', 'Мадрид', [['es', 'Майорка', 7], ['es', 'Тенерифе', 3], ['es', 'Тенерифе', 14], ['es', 'Гранада', 3]]);
    const [mall, ten3, ten14, gran] = r.out;
    check(!mall.err && mall.why.length === 0 && mall.ferry > 0, 'поездка: Майорка из Мадрида на неделю — можно, паром в деньгах', mall);
    check(!ten3.err && ten3.why.includes('Слишком много дороги для выбранной длительности отпуска') && !ten14.err && ten14.why.length === 0, 'поездка: Тенерифе — паром больше суток: на 3 дня не успеть, на две недели можно', { ten3, ten14 });
    check(!gran.err && gran.why.length === 0, 'поездка: Гранада из Мадрида на 3 дня — можно', gran);
    check(r.errors.length === 0, 'поездки из Мадрида: без ошибок', r.errors);
  }
  {
    const r = await trip('it', 'Рим', [['de', 'Берлин', 14], ['at', 'Зальцбург', 7], ['jp', 'Токио', 14]]);
    const [ber, salz, tok] = r.out;
    check(!ber.err && ber.why.length === 0, 'поездка: Рим — Берлин на своей машине на две недели — можно, как и раньше', ber);
    check(!salz.err && salz.why.length === 0 && Number.isFinite(salz.total), 'поездка: Зальцбург (за границей, без городов игры) — можно, расходы считаются без ошибки', salz);
    check(!tok.err && tok.why.length === 1 && /^Токио — за морем: на машине не доехать, только самолёт$/.test(tok.why[0]), 'поездка: Токио из Рима — за морем, только самолёт', tok);
    check(r.errors.length === 0, 'поездки из Рима: без ошибок', r.errors);
  }
  {
    const r = await trip('tr', 'Стамбул', [['de', 'Берлин', 14], ['th', 'Бангкок', 14], ['eg', 'Каир', 14]]);
    const [ber, bkk, cai] = r.out;
    check(!ber.err && ber.why.length === 0, 'поездка: Стамбул — Берлин на своей машине — можно (раньше Турция считалась Азией, и в Европу машиной было нельзя)', ber);
    check(!bkk.err && bkk.why.length === 1 && /^Бангкок — на своей машине через границы туда не проехать: только самолёт$/.test(bkk.why[0]), 'поездка: Стамбул — Бангкок — «через границы туда не проехать: только самолёт»', bkk);
    check(!cai.err && cai.why.length === 1 && /^Каир — на другом континенте: на машине не доехать, только самолёт$/.test(cai.why[0]), 'поездка: Стамбул — Каир — «на другом континенте: на машине не доехать, только самолёт»', cai);
    check(r.errors.length === 0, 'поездки из Стамбула: без ошибок', r.errors);
  }
  // Паром с материка на остров — всегда, даже если остров по прямой ближе порта; с того же острова — нет (рецензия 275.9).
  for (const [country, home, cases] of [['es', 'Барселона', [['es', 'Ибица', 7], ['es', 'Майорка', 7]]], ['th', 'Бангкок', [['th', 'Самуи', 7]]], ['au', 'Перт', [['au', 'остров Кенгуру', 21]]], ['id', 'Денпасар', [['id', 'Убуд', 7], ['id', 'Ломбок', 7]]]]) {
    const r = await trip(country, home, cases);
    for (const o of r.out) {
      const want = !(o.city === 'Убуд' && r.home === 'Денпасар');
      check(!o.err && r.home === home && (want ? o.ferry > 0 : !o.ferry) && o.why.length === 0, 'поездка: ' + home + ' → ' + o.city + (want ? ' — с автопаромом (паром в деньгах)' : ' — тот же остров, без парома'), o);
    }
    check(r.errors.length === 0, 'поездки из ' + home + ': без ошибок', r.errors);
  }
  // Окно поездки: «на машине не доехать» — с кнопкой «Дорога»; машину туда в цене не считают; пробег с разрядами.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      s.age = 30; s.cash = 1e7; moveHome('rent', 'Ванкувер', 'center');
      const z = transportState56(); z.licenses.push('ca');
      const m = vehicleCatalog56.find(m => m.name === 'Toyota RAV4');
      z.vehicles.push({ id: 'car-ui', model: m.id, kind: 'car', owner: 'player', country: 'ca', city: residenceCity(), area: s.housing.area, priceCountry: 'ca', paidPrice: 36000, boughtCondition: 90, condition: 90, year: s.year - 1, acquired: s.clock.ticks, status: 'owned', history: [], damage: null, unfunded: false, lastPay: s.clock.ticks });
      const out = {};
      for (const [k, city, days] of [['us', 'Мауи', 14], ['id', 'Денпасар', 14], ['us', 'Лас-Вегас', 14]]) {
        const d = { country: k, city, days, comfort: 'standard', companion: null, journey57: { route: 'car', car: 'car-ui', pets: [] } };
        const car = quoteJourney57(d), bus = quoteJourney57({ ...d, journey57: { ...d.journey57, route: 'public' } });
        if ($('#modal').open) closeModal();
        travelDraftMenu52(d); const c = __card();
        out[city] = { need: c?.need || [], text: c?.text || '', car57: !!car.car57, carPlayer: Math.round(car.player), busPlayer: Math.round(bus.player) };
      }
      return out;
    });
    for (const city of ['Мауи', 'Денпасар']) {
      const o = r[city], item = o.need.find(n => /на машине|общественный транспорт|своей машине/.test(n.text));
      check(!!item && item.button && /Дорога/.test(item.small), 'окно поездки в ' + city + ' на своей машине: в «Не хватает» причина с кнопкой «Дорога» (как было до 275.9)', o.need);
      check(BASE || !o.car57 && o.carPlayer === o.busPlayer && !/Примерный пробег/.test(o.text), 'окно поездки в ' + city + ' на своей машине: машину через море в цене не считают — цена как обычным транспортом', { car57: o.car57, car: o.carPlayer, bus: o.busPlayer, km: (o.text.match(/Примерный пробег[^·]*/) || [''])[0] });
    }
    const lv = r['Лас-Вегас'];
    check(BASE || /Примерный пробег\s*\d{1,3}[\s  ]\d{3} км/.test(lv.text), 'окно поездки в Лас-Вегас: пробег с разрядами («4 400 км», а не «4400 км»)', (lv.text.match(/Примерный пробег[^·]*/) || [lv.text.slice(0, 300)])[0]);
    check(errors.length === 0, 'окна поездок на машине: без ошибок', errors);
    await ctx.close();
  }
  // Координаты всех туристических мест и окно поездки на машине.
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ca' });
    const r = await ev(pg, () => {
      const miss = [], bad = [];
      for (const [k, list] of Object.entries(tourDestinations102)) for (const city of list) if (touristOnly102(k, city)) { if (typeof point2759 !== 'function' || !point2759(k, city)) miss.push(k + ':' + city); }
      for (const k of Object.keys(tourAbroad103)) for (const [city] of tourPlaces123(k)) if (typeof point2759 !== 'function' || !point2759(k, city)) miss.push(k + ':' + city);
      s.cash = 1e6; moveHome('rent', 'Ванкувер', 'center');
      const z = transportState56(); z.licenses.push('ca');
      const m = vehicleCatalog56.find(m => m.name === 'Toyota RAV4');
      z.vehicles.push({ id: 'car-ui', model: m.id, kind: 'car', owner: 'player', country: 'ca', city: residenceCity(), area: s.housing.area, priceCountry: 'ca', paidPrice: 36000, boughtCondition: 90, condition: 90, year: s.year - 1, acquired: s.clock.ticks, status: 'owned', history: [], damage: null, unfunded: false, lastPay: s.clock.ticks });
      for (const [k, city] of [['ca', 'Уистлер'], ['fr', 'Ницца'], ['gr', 'Ираклион'], ['tn', 'Джерба'], ['th', 'Пхи-Пхи']]) { const d = { country: k, city, days: 7, comfort: 'standard', companion: null, journey57: { route: 'car', car: 'car-ui', pets: [] } }; const km = journeyKm57(d); if (!Number.isFinite(km) || km <= 0) bad.push(k + ':' + city + '=' + km); }
      travelDraftMenu52({ country: 'ca', city: 'Уистлер', days: 3, comfort: 'standard', companion: null, journey57: { route: 'car', car: 'car-ui', pets: [] } });
      const text = __flat(document.getElementById('modal')?.textContent || '');
      return { miss, bad, text: text.slice(0, 1500), car: /выберите общественный транспорт/.test(text) };
    });
    check(BASE || !r.miss.length, 'туристические места: у всех мест 25 стран и мест за границей есть координаты', r.miss.slice(0, 10));
    check(BASE || !r.bad.length, 'туристические места: дорога туда считается (км конечны)', r.bad);
    check(!r.car && /Уистлер/.test(r.text), 'окно поездки в Уистлер на своей машине: без «выберите общественный транспорт»', r.text.slice(0, 400));
    check(errors.length === 0, 'окно поездки: без ошибок', errors);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} ok, ${fail} FAIL${BASE ? ' (BASE)' : ''}`);
  process.exit(fail ? 1 : 0);
})();
