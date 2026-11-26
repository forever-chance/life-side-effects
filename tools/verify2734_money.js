// Проверки сборки 273.4 (money2734.js): деньги и жильё на окне-карточке — «Финансы», «Жильё и дорога», список
// объявлений, объявление аренды и покупки, «Ипотека: условия», переезд по пути одним окном.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2734_money.js
// BASE=1 — index.html без money2734.js: видно, какие проверки ловят старое поведение.
// SAVE=файл — ещё и на настоящем сохранении (экспорт «Ваши персонажи», берётся последний персонаж). Без него — только
// новые жизни. SHOTS=папка — снимки окон на этом сохранении «до» (без money2734.js) и «после», 390 и 1280.
// MONEY=файл — вместо money2734.js из папки игры отдать этот файл (например, прежнюю версию: видно, что проверки
// исправлений её ловят).
// Что проверяется:
// • главные кнопки окна видны без прокрутки на 390×844 и 1280×800 (где их нет — видно «Подробнее»);
// • набор кнопок окна совпадает с окном без money2734.js: ни одна не потерялась, новых нет. Исключения названы:
//   в «Финансах» убран второй вход в «Распределение денег», в «Кризисе» из «Финансов» — кнопка обратно в «Финансы»;
//   окно переезда вбирает кнопки «Бюджета переезда» и «Кто оплачивает переезд?». Каждая старая кнопка ведёт туда же;
// • числа наверху равны числам из функций игры, которые потом списывают деньги: monthlyBudget, homeCost,
//   houseMoveQuote41 (и сколько на деле спишет rentHouse41), цена с оформлением (buyHouse41), mortgageQuote43 (платёж,
//   который запишет mortgageBuy43), moveQuote68 (сколько спишет finishMove16);
// • «Подробнее» запоминается по виду окна, не в сохранении; ошибок на странице нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || '', SHOTS = process.env.SHOTS || '', MONEY = process.env.MONEY || '';
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 800 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = PHONE, base = BASE, raw = null, country = 'ru', seed = 2734, startAge = '18' } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? INDEX.replace(/<script src="money2734\.js[^"]*"><\/script>/g, '') : rel === 'money2734.js' && MONEY ? fs.readFileSync(MONEY) : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(([c, age]) => { for (const [k, v] of [['startAge', age], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [country, startAge]);
    await pg.evaluate(seed => { Math.random = seeded269(seed); [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); }, seed);
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false;
    try { localStorage.clear(); } catch (e) {}
  });
  await pg.evaluate(helpers);
  return { pg, ctx, errors };
}

// Помощники внутри страницы.
function helpers() {
  // Подпись — текст самой кнопки без подсказок <small>. Кнопка «Не хватает» — не вариант окна, у неё своя подпись.
  // Если на экране подпись сказана словами (код страны у счёта), прежняя подпись варианта — в data-label2734.
  window.__shown = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  window.__label = b => (b.dataset.label2734 || __shown(b)).replace(/\s+/g, ' ').trim();
  window.__buttons = () => [...document.querySelectorAll('#modal button')].filter(b => !b.closest('.modal-closebar38,.context-hint180') && !b.classList.contains('fix273'));
  window.__labels = () => __buttons().map(b => ({ label: __label(b), disabled: b.disabled, option: !!b.closest('.options') }));
  window.__title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(закрыто)';
  window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
  window.__pos = el => {
    const m = $('#modal'); m.scrollTop = 0;
    const r = el.getBoundingClientRect(), mr = m.getBoundingClientRect(), y = r.top - mr.top + m.scrollTop;
    return { top: Math.round(r.top), fold: r.height > 0 && r.top >= mr.top && r.bottom <= Math.min(mr.bottom, innerHeight) + 0.5, screen: Math.floor(y / m.clientHeight) + 1, y: Math.round(y), modalH: m.scrollHeight };
  };
  window.__where = label => { const b = __buttons().find(b => __label(b) === label); return b ? { label, disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '', ...__pos(b) } : null; };
  window.__top = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd').childNodes[0]?.textContent || '']));
  window.__notes = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd small')?.textContent || '']));
  window.__need = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', fix: e.tagName === 'BUTTON', small: e.querySelector('small')?.textContent || '' }));
  window.__hint = label => { const b = __buttons().find(b => __label(b) === label); return b ? [...b.querySelectorAll('small')].map(x => x.textContent).join(' · ').replace(/\n/g, ' · ') : null; };
  window.__look = () => {
    const m = $('#modal'), main = [...m.querySelectorAll('.main273 button')].map(b => ({ label: __label(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '', ...__pos(b) }));
    const more = m.querySelector('details.more273');
    return { title: __title(), card: !!m.querySelector('.top273'), area: m.querySelector('.eyebrow')?.textContent || '', labels: __labels(), pos: Object.fromEntries(__buttons().map(b => [__label(b), __pos(b)])),
      main, more: more ? { open: more.open, ...__pos(more.querySelector('summary')) } : null, top: __top(), notes: __notes(), need: __need(), status: m.querySelector('.status273:not([hidden])')?.textContent || '',
      heading: !!m.querySelector(':scope > .hint-heading187 h2, :scope > h2'), hintAtTitle: !!m.querySelector(':scope > .hint-heading187 .hint-trigger187') || !m.querySelector('.hint-trigger187') };
  };
  // Нажать кнопку по подписи и записать, куда это привело.
  window.__press = label => {
    const b = __buttons().find(b => __label(b) === label);
    if (!b) return { missing: label };
    if (b.disabled) return { disabled: true };
    const before = { cash: Math.round(s.cash), tasks: s.clock.tasks.length, props: s.properties.length, debts: s.debts.length, mode: s.housing.mode };
    try { b.click(); } catch (e) { return { error: String(e) }; }
    const after = { cash: Math.round(s.cash), tasks: s.clock.tasks.length, props: s.properties.length, debts: s.debts.length, mode: s.housing.mode };
    return { title: __title(), changed: Object.keys(after).filter(k => after[k] !== before[k]).map(k => k).join(',') };
  };
  window.__snap = () => { window.__saved = JSON.stringify(s); };
  window.__restore = () => { __close(); s = JSON.parse(window.__saved); s.pending = []; s.clock.running = false; Math.random = seeded269(27341); };
  // Месяцы вперёд: события очереди — по первому варианту, окна закрываются.
  window.__adv = (n, cash) => {
    for (let i = 0; i < n && !s.dead; i++) {
      let guard = 0;
      while ((s.pending.length || s.clock.yearDue || $('#modal').open) && guard++ < 30) {
        if ($('#modal').open) { closeModal(); continue; }
        if (s.pending.length) { const q = s.pending[0]; try { resolvePending(); } catch (e) {} if ($('#modal').open) closeModal(); if (s.pending[0] === q) s.pending.shift(); continue; }
        if (s.clock.yearDue) { try { transact('year', rollYear); } catch (e) { s.clock.yearDue = false; } }
      }
      if (cash !== undefined) s.cash = Math.min(s.cash, cash);
      advanceMonth();
    }
    __close();
  };
  window.save = function () {}; if (typeof flushSave264 === 'function') window.flushSave264 = function () {};
}

// Окна сценария открываются одной функцией-строкой: одинаково в обоих режимах.
const OPEN = {
  finance: '()=>financeMenu()',
  housing: '()=>housingMenu()',
  offers: "()=>housingOffers41('rent',__v.kind,__v.city)",
  rent: "()=>housingOfferDetails41(market41('rent',__v.kind,__v.city).listings[__v.rentI])",
  buy: "()=>housingOfferDetails41(market41('buy',__v.kind,__v.city).listings[__v.buyI])",
  mortgage: "()=>mortgageOptions43(market41('buy',__v.kind,__v.city).listings[__v.buyI],__v.down||.2,__v.years||20)",
  move: '()=>moveOptions68(__v.move[0],__v.move[1])',
};
// Окна, которые карточка заменяет кнопками из других окон. Для переезда «было» — три окна подряд.
const MOVE_BASE = '()=>{const [k,id]=__v.move;const home=moveHomeList2734B(k,id)[0];return [()=>moveOptions68(k,id),()=>movePayers68(k,id,home),()=>moveConfirm68(k,id,home)];}';
// Убранное нарочно: второй вход в «Распределение денег».
const DROPPED = { finance: ['Приоритеты и ручное распределение денег'] };

// Сценарии: готовят жизнь (параметры окон — в window.__v) и возвращают список окон.
const SETUP = {
  owner: `()=>{
    window.__v={kind:'flat',city:residenceCity(),rentI:0,buyI:0};
    market41('rent','flat',__v.city);market41('buy','flat',__v.city);
    const mom=parents17().find(p=>p.alive&&moveTarget68('family',p.id));__v.move=mom?['family',mom.id]:null;
    return ['finance','housing','offers','rent','buy','mortgage',...(__v.move?['move']:[])];
  }`,
  // 18 лет, у родителей, без работы и почти без денег.
  young: `()=>{
    window.__v={kind:'room',city:residenceCity(),rentI:0,buyI:0};
    s.cash=Math.min(s.cash,5000);market41('rent','room',__v.city);market41('buy','flat',__v.city);
    return ['finance','housing','rent'];
  }`,
  // Работа, снятая комната, потом три месяца без денег: неоплаченная аренда и счета, предупреждение по аренде.
  broke: `()=>{
    s.job=generateJob();s.cash=Math.max(s.cash,c().cost*.3);
    const room=market41('rent','room',residenceCity()).listings.find(q=>validListing41(q,'rent'));rentHouse41(room);__close();
    s.job=null;s.cash=0;__adv(3,0);
    window.__v={kind:'flat',city:residenceCity(),rentI:0,buyI:0};
    market41('rent','flat',__v.city);market41('buy','flat',__v.city);
    return ['finance','housing','rent','buy','mortgage'];
  }`,
  // 30 лет: работа, деньги, своя аренда; мама в другом городе — переезд к ней по пути.
  settled: `()=>{
    s.age=30;s.job=generateJob();s.job.salary=c().wage*3;s.cash=c().cost*30;activateHome();const list=cities[s.country];
    moveHome('rent',list[0],'center');__close();
    const mom=parents17()[0];if(mom){mom.city18=list[1];mom.country=s.country;mom.inner.trust=80;}
    window.__v={kind:'flat',city:residenceCity(),rentI:1,buyI:0,move:mom?['family',mom.id]:null};
    market41('rent','flat',__v.city);market41('buy','flat',__v.city);
    return ['finance','housing','rent','buy','mortgage',...(__v.move?['move']:[])];
  }`,
};

async function openWin(pg, src) {
  return pg.evaluate(src => { __close(); (0, eval)('(' + src + ')')(); return __title(); }, src);
}
async function look(pg, kind) {
  await openWin(pg, OPEN[kind]);
  await pg.waitForTimeout(30);
  return pg.evaluate(() => __look());
}

async function scenario(browser, name, opts) {
  const out = {};
  if (!opts.raw) {
    const P = await page(browser, { ...opts, base: true });
    opts = { ...opts, raw: await P.pg.evaluate(() => JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] })) };
    await P.ctx.close();
  }
  const modes = [['base', true, PHONE], ['new', false, PHONE], ['wide', false, WIDE], ...(SHOTS && name === 'owner' ? [['widebase', true, WIDE]] : [])];
  for (const [mode, base, vp] of modes) {
    if (BASE && mode !== 'base') continue;
    const P = await page(browser, { ...opts, base, viewport: vp });
    // Список вариантов жилья для переезда — как в moveOptions68 (и без money2734.js).
    await P.pg.evaluate(() => { window.moveHomeList2734B = (kind, id) => { const t = moveTarget68(kind, id); return t ? [...(t.p && dormEligible68(t.p) ? ['dorm'] : []), ...(t.host ? ['family'] : []), 'room'].filter(h => moveQuote68(kind, id, h)) : []; }; });
    const kinds = await P.pg.evaluate(src => { Math.random = seeded269(2734); return (0, eval)('(' + src + ')')(); }, SETUP[name]);
    await P.pg.evaluate(() => __snap());
    const r = { kinds, wins: {}, press: {}, steps: null };
    for (const k of kinds) {
      await P.pg.evaluate(() => __restore());
      r.wins[k] = await look(P.pg, k);
      if (SHOTS && name === 'owner') {
        await P.pg.evaluate(() => { $('#modal').scrollTop = 0; });
        await P.pg.screenshot({ path: path.join(SHOTS, k + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png') });
      }
    }
    if (!mode.startsWith('wide')) {
      // Было: три окна переезда подряд — все их кнопки.
      if (kinds.includes('move')) {
        await P.pg.evaluate(() => __restore());
        r.steps = await P.pg.evaluate(src => { const out = []; for (const f of (0, eval)('(' + src + ')')()) { __close(); f(); out.push({ title: __title(), labels: __labels().map(l => l.label) }); } __close(); return out; }, MOVE_BASE);
      }
      // Каждая кнопка: нажать в том же состоянии и записать, куда привело.
      for (const k of kinds) {
        if (k === 'move' || k === 'offers') continue;
        for (const l of r.wins[k].labels) {
          await P.pg.evaluate(() => __restore());
          await openWin(P.pg, OPEN[k]);
          r.press[k + ' / ' + l.label] = await P.pg.evaluate(label => __press(label), l.label);
        }
      }
      r.extra = await extraChecks(P.pg, name, kinds);
    }
    r.errors = P.errors.slice();
    out[mode] = r;
    await P.ctx.close();
  }
  return out;
}

// Проверки, которые не сводятся к сравнению с окном без карточки: числа, списания, запоминание, петля.
async function extraChecks(pg, name, kinds) {
  return pg.evaluate(async ([name, kinds, OPEN]) => {
    const x = {}, open = src => { __close(); (0, eval)('(' + src + ')')(); }, tick = () => new Promise(r => setTimeout(r, 20));
    // «Финансы»: месяц из monthlyBudget, счета из financialSummary32.
    __restore(); open(OPEN.finance); await tick();
    // Старый счёт месяц сам не списывает (debtDue40), а monthlyBudget (billDue35) кладёт его в долги целиком:
    // в «Уходит» и «Остаётся» его нет.
    const oldBills = () => activeDebts().filter(d => d.type === 'bill32').reduce((n, d) => n + (['active', 'review'].includes(d.repayment35?.status) ? Math.max(0, d.balance - d.repayment35.remaining) : d.balance) * debtRatio(d), 0);
    { const b = monthlyBudget(), q = financialSummary32(), inc = b.income + (b.familySupport21 || 0), old = oldBills(), out = b.cost + b.debt - old, left = b.free + old;
      const study = (() => { const t = path16().study; return !!(t && t.status !== 'paused') || !!s.studyTrack || s.people.some(p => p.alive && p.education?.sponsored); })();
      x.fin = { top: __top(), notes: __notes(), status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '', study,
        want: { in: inc >= 1 ? money(inc) + '/мес.' : 'постоянного дохода нет', out: s.age < 18 && out < 1 ? null : money(out) + '/мес.', left: left >= 0 ? money(left) + '/мес.' : 'не хватает ' + money(-left) + '/мес.', cash: money(s.cash), bills: q.bills > .01 ? money(q.bills) : null },
        sum: Math.abs(inc - (b.cost + b.debt) - b.free), bills: activeDebts().filter(d => d.type === 'bill32').length,
        main: [...document.querySelectorAll('#modal .main273 button')].map(b => __label(b)), table: document.querySelector('#modal .more273 .detail20')?.textContent || '',
        zeros: [...document.querySelectorAll('#modal .more273 .detail20 .detail-row20')].map(r => r.querySelector('dd')?.childNodes[0]?.textContent || '').filter(v => /^0 \S+$/.test(v.trim())),
        conv: !!document.querySelector('#modal .more273 .currency-converter86') && !document.querySelector('#modal .more273 .detail20 .currency-converter86'),
        repayHint: __hint('Погасить старые счета с резервом'), repay: safeRepayment61() > 0 ? money(safeRepayment61()) : '' }; }
    // Петля: «Кризис и возвращение» из «Финансов» — без кнопки обратно, стрелка ведёт в «Финансы».
    __restore(); open(OPEN.finance); await tick();
    { const b = __buttons().find(b => __label(b) === 'Кризис и возвращение'); b?.click(); await tick();
      x.crisis = { title: __title(), labels: __labels().map(l => l.label) };
      backModal38(); await tick(); x.crisis.back = __title();
      __close(); crisisMenu29(); x.crisis.direct = __labels().map(l => l.label);
      if (x.crisis.back !== 'Финансы') { open(OPEN.finance); await tick(); __buttons().find(b => __label(b) === 'Кризис и возвращение')?.click(); await tick(); x.crisis2 = { labels: __labels().map(l => l.label) }; backModal38(); await tick(); x.crisis2.back = __title(); } }
    // «Подробнее» запоминается по виду окна, не в сохранении.
    __restore(); open(OPEN.finance); await tick();
    { const d = () => document.querySelector('#modal details.more273'); const m = { was: d()?.open ?? null };
      d()?.querySelector('summary').click(); await tick(); m.after = d()?.open;
      open(OPEN.finance); await tick(); m.kept = d()?.open;
      open(OPEN.housing); await tick(); m.other = d()?.open;
      open(OPEN.finance); await tick(); d()?.querySelector('summary').click(); await tick(); open(OPEN.finance); await tick(); m.closed = d()?.open;
      try { m.stored = localStorage.getItem('more273:finance'); } catch (e) { m.stored = 'нет доступа'; }
      m.inSave = JSON.stringify(s).includes('more273'); x.more = m; }
    // «Жильё и дорога»: homeCost и дорога.
    __restore(); open(OPEN.housing); await tick();
    x.housing = { top: __top(), notes: __notes(), status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '', want: s.age < 18 ? 'платят взрослые' : homeCost() >= 1 ? money(homeCost()) + '/мес.' : 'бесплатно', way: s.job ? commuteMinutes() : 0, mode: s.housing.mode,
      main: [...document.querySelectorAll('#modal .main273 button')].map(b => __label(b)) };
    // Объявление аренды: «в месяц» и «при переезде» — houseMoveQuote41; столько и спишет rentHouse41.
    if (kinds.includes('rent')) {
      __restore(); open(OPEN.rent); await tick();
      const q = market41('rent', __v.kind, __v.city).listings[__v.rentI], m = houseMoveQuote41(q);
      x.rent = { top: __top(), notes: __notes(), need: __need(), want: { month: houseMoney41(q.rent) + '/мес.', move: m.needed >= .5 ? houseMoney41(m.needed) : 'хватит прежнего залога', deposit: 'залог ' + houseMoney41(m.deposit), moving: 'переезд ' + houseMoney41(m.moving) }, cash: s.cash, needed: m.needed,
        facts: !!document.querySelector('#modal .more273 .house-costs41') && !!document.querySelector('#modal .more273 .house-figure41') };
      if (s.cash >= m.needed && validListing41(q, 'rent')) { const before = s.cash; const b = __buttons().find(b => __label(b) === 'Снять и переехать'); b?.click(); x.rent.spent = before - s.cash; x.rent.rented = s.housing.listing41?.id === q.id; }
    }
    // Объявление покупки: цена с оформлением — столько спишет buyHouse41; содержание — propertyMaintenance41 купленного.
    if (kinds.includes('buy')) {
      __restore(); open(OPEN.buy); await tick();
      const q = market41('buy', __v.kind, __v.city).listings[__v.buyI];
      x.buy = { top: __top(), notes: __notes(), need: __need(), main: [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __label(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '' })),
        want: { price: houseMoney41(q.purchase * 1.03), month: houseMoney41(q.purchase * (q.kind === 'house' ? .00065 : .0004)) + '/мес.' }, mort: __hint('Рассчитать ипотеку'), mortWant: 'платёж ' + money(mortgageQuote43(q).payment) + '/мес.',
        plan: __hint('Запланировать покупку'), planWant: 'покупка ' + inMonth273(s.clock.ticks + 1),
        wages: [[1, '1 средняя годовая зарплата'], [2.04, '2 средние годовые зарплаты'], [6, '6 средних годовых зарплат'], [8.1, '8,1 средней годовой зарплаты'], [11, '11 средних годовых зарплат']].filter(([n, w]) => (typeof wages2734 === 'function' ? wages2734(n) : '') !== w) };
      __restore(); s.cash = Math.max(s.cash, q.purchase * 1.1); const before = s.cash;
      if (buyHouse41(market41('buy', __v.kind, __v.city).listings[__v.buyI])) { const p = s.properties.at(-1); x.buy.spent = houseMoney41(before - s.cash); x.buy.upkeep = houseMoney41(propertyMaintenance41(p)) + '/мес.'; }
    }
    // Ипотека: «нужно сейчас» и платёж — mortgageQuote43; на каждом варианте свой платёж; тот же платёж в договоре.
    if (kinds.includes('mortgage')) {
      __restore(); open(OPEN.mortgage); await tick();
      const q = market41('buy', __v.kind, __v.city).listings[__v.buyI], down = __v.down || .2, years = __v.years || 20, m = mortgageQuote43(q, down, years, true);
      // На каждом варианте — его платёж; у выбранного он наверху («Платёж»).
      const plans = [[.1, 10], [.2, 20], [.3, 20], [.5, 10], [.2, 30]].map(([d, y]) => { const cur = d === down && y === years, l = Math.round(d * 100) + '% взнос · ' + y + ' лет' + (cur ? ' · выбрано' : ''); return { label: l, hint: cur ? 'Платёж ' + __top()['Платёж'] : __hint(l), want: (cur ? 'Платёж ' : 'платёж ') + money(mortgageQuote43(q, d, y, true).payment) + '/мес.' }; });
      x.mort = { top: __top(), need: __need(), status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '', reasons: m.reasons, want: { now: money(m.upfront), pay: money(m.payment) + '/мес.' }, plans,
        main: [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __label(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '' })), text: document.querySelector('#modal .more273')?.textContent || '',
        address: __top()['Адрес'] || '', addressWant: 'переедете сюда ' + inMonth273(s.clock.ticks + 1),
        hints: __buttons().filter(b => b.closest('.setopts273')).map(b => ({ label: __label(b), hint: [...b.querySelectorAll('small')].map(x => x.textContent).join(' · ') })),
        same: (() => { const a = mortgageQuote43(q, down, years, true), b = mortgageQuote43(q, down, years, false); return { pay: Math.abs(a.payment - b.payment) < .5 ? 'платёж ' + money(b.payment) : '', label: 'Купить без переезда' }; })() };
      __restore(); s.cash = Math.max(s.cash, q.purchase); s.job ??= generateJob(); s.job.salary = Math.max(s.job.salary, c().wage * 10); s.creditBlockedUntil = 0; for (const d of s.debts) if (d.type === 'bill32') d.balance = 0;
      const m2 = mortgageQuote43(market41('buy', __v.kind, __v.city).listings[__v.buyI], down, years, true);
      if (!m2.reasons.length && mortgageBuy43(market41('buy', __v.kind, __v.city).listings[__v.buyI], down, years, true)) { const d = s.debts.find(d => d.mortgage43); x.mort.contract = money(d.payment * debtRatio(d)) + '/мес.'; x.mort.contractWant = money(m2.payment) + '/мес.';
        // Своё жильё в ипотеке: «Жильё и дорога» и «Финансы» показывают платёж из договора.
        __close(); housingMenu(); await tick(); x.mort.housing = { top: __top(), notes: __notes(), main: [...document.querySelectorAll('#modal .main273 button')].map(b => __label(b)) };
        __close(); financeMenu(); await tick(); x.mort.finance = { top: __top(), notes: __notes(), want: money(financialSummary32().debt - financialSummary32().bills) }; }
    }
    // Другие положения «Жилья»: нет постоянного жилья, поломка в съёмном жилье.
    __restore(); if (s.age >= 18) { loseAddress42('Проверка.'); open(OPEN.housing); await tick(); x.unstable = { status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '', main: [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __label(b), ...__pos(b) })) }; }
    __restore(); if (s.housing.mode === 'rent' && housingListing41()) { const issue = createRepair41(repairTarget41('rental')); if (issue) { open(OPEN.housing); await tick(); x.repair = { title: issue.title, status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '', main: [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __label(b), ...__pos(b) })) }; } }
    // Переезд одним окном: цифры — moveQuote68; выбор жилья и плательщика — в том же окне; списание — finishMove16.
    if (kinds.includes('move')) {
      __restore(); open(OPEN.move); await tick();
      const [k, id] = __v.move, home = moveHomeList2734B(k, id)[0], q = moveQuote68(k, id, home);
      // У близкого moveQuote68 берёт 5% для запаса, а месяц начислит homeCost() нового адреса — он сверяется после переезда.
      x.move = { title: __title(), top: __top(), notes: __notes(), need: __need(), want: { once: money(q.upfront + q.petPlan.cost), need: money(q.needed), rent: home === 'family' ? '' : money(localAmount16(q.rent, q.country)) + '/мес.' }, home,
        from: s.country, to: q.country, city: q.city, countryName: countries[q.country].name, sub: document.querySelector('#modal .sub273')?.textContent || '', mnote: document.querySelector('#modal .mnote273')?.textContent || '', mnoteWant: 'Переезд ' + inMonth273(s.clock.ticks + 1) + ', разовые расходы спишут тогда же.',
        groups: [...document.querySelectorAll('#modal .set273 .setopts273')].map(g => ({ head: g.previousElementSibling?.textContent || '', labels: [...g.querySelectorAll('button')].map(b => __label(b)), marks: [...g.querySelectorAll('button small')].filter(e => /(^|· )сейчас( ·|$)/.test(e.textContent)).length })) };
      const other = moveHomeList2734B(k, id).find(h => h !== home);
      if (other) { const lab = { dorm: 'Место в общежитии', family: 'Жить у близкого', room: 'Недорогая комната' }[other]; const q2 = moveQuote68(k, id, other), pre = __hint(lab); __buttons().find(b => __label(b) === lab)?.click(); await tick(); x.move.switched = { title: __title(), once: __top()['Разово'], want: money(q2.upfront + q2.petPlan.cost), pre, hint: __hint(lab) }; }
      const parent = parents17().find(p => (p.inner?.trust ?? 0) >= 45);
      if (parent) { open(OPEN.move); await tick(); __buttons().find(b => __label(b) === 'Попросить оплатить · ' + parent.name)?.click(); await tick(); const q3 = moveQuote68(k, id, home, parent.id); x.move.payer = { title: __title(), once: __top()['Разово'], note: __notes()['Разово'], want: money(q3.family), hint: __hint('Попросить оплатить · ' + parent.name) }; }
      // Списание: запланировать и провести переезд — сколько ушло своих денег.
      __restore(); open(OPEN.move); await tick();
      const go = __buttons().find(b => __label(b) === 'Запланировать переезд');
      if (go && !go.disabled) { go.click(); const t = s.clock.tasks.find(t => t.kind === 'pathMove' && !['completed', 'cancelled'].includes(t.state));
        // Сколько своих денег берёт finishMove16 — доля игрока в его transaction17 (прежний залог при этом возвращается отдельно).
        if (t) { const q4 = moveQuote68(k, id, t.home68, t.parent68, t.petIds183), orig = transaction17; let own = null;
          transaction17 = function (q) { if (String(q?.key || '').startsWith('relocate68:')) own = (q.parts || []).filter(p => p.payer === 'player').reduce((n, p) => n + p.amount, 0); return orig.apply(this, arguments); };
          try { if (finishMove16(t)) { x.move.spent = money(own ?? 0); x.move.spentWant = money(q4.own);
            // Сколько жильё стоит в месяц на новом месте — в валюте окна (до переезда).
            x.move.homeAfter = homeCost() * fxRate86(s.country, x.move.from); x.move.modeAfter = s.housing.mode; } } finally { transaction17 = orig; } } }
      // Дата на окне — та, когда переезд на деле случится: запланировать и прожить месяц.
      __restore(); open(OPEN.move); await tick();
      { const go2 = __buttons().find(b => __label(b) === 'Запланировать переезд'), t0 = s.clock.ticks;
        if (go2 && !go2.disabled) { go2.click(); __adv(1); x.move.real = { moved: s.housing.city === x.move.city && s.country === x.move.to, ticks: s.clock.ticks - t0 }; } }
    }
    const status = () => { const e = document.querySelector('#modal .status273:not([hidden])'); return e ? { text: e.textContent, tone: e.dataset.tone || '' } : { text: '', tone: '' }; };
    const btns = sel => [...document.querySelectorAll(sel)].map(b => ({ label: __label(b), shown: __shown(b), hint: [...b.querySelectorAll('small')].map(e => e.textContent).join(' · '), fold: __pos(b).fold }));
    if (s.age >= 18) {
      // Старый счёт и зарплата: «Остаётся» — на столько и меняются деньги за месяц, сам счёт остаётся.
      __restore(); s.job ??= generateJob(); s.job.salary = Math.max(s.job.salary || 0, c().wage * 1.5);
      { const keep = Math.max(0, s.cash); s.cash = 0; livingBill32('basics', c().cost * .2, 'Старый счёт · проверка'); s.cash = keep + c().cost * .05; }
      open(OPEN.finance); await tick();
      { const b = monthlyBudget(), old = oldBills(), left = b.free + old, bill = s.debts.find(d => d.creditor32 === 'Старый счёт · проверка'), bal = bill?.balance, c0 = s.cash;
        x.month = { top: __top(), want: { out: money(b.cost + b.debt - old) + '/мес.', left: left >= 0 ? money(left) + '/мес.' : 'не хватает ' + money(-left) + '/мес.' }, left, old };
        __adv(1); x.month.change = s.cash - c0; x.month.billSame = !!bill && Math.abs(bill.balance - bal) < .01; }
      // Пять счетов и предложение кредитора: на главных — «Погасить…» и два самых срочных, предложение вместо своего
      // счёта; код страны словами; подсказка — по нынешнему договору или по прежнему.
      // Месяц без денег и работы — настоящие счета за жильё и бытовые (счёт этого месяца livingBill32 второй раз не
      // выставляет), потом ещё три счёта: из другой страны, по самому первому договору и по прежнему.
      __restore(); s.job = null; s.cash = 0; __adv(1, 0); s.cash = 0;
      const other = s.country === 'us' ? 'fr' : 'us', lease = ensureLease40();
      for (const [kind, n, cr] of [['basics', .02, 'Бытовые счета · ' + s.country], ['basics', .01, 'Бытовые счета · ' + other], ['rent', .05, 'Жильё · ' + s.country + ' · Проверка · rent'], ['rent', .03, 'Жильё · Проверка · договор 99'], ['rent', .04, lease.creditor]]) livingBill32(kind, c().cost * n, cr);
      { const d = s.debts.find(d => d.type === 'bill32' && d.creditor32 === 'Бытовые счета · ' + s.country && d.balance > .01), t0 = s.clock.ticks;
        if (d) d.negotiation35 = { id: 'terms-2734', kind: 'installments', created: t0, retryAt: t0 + 6, expires: t0 + 2, chance: 1, roll: 0, status: 'offered', monthly: d.balance / 12, covered: d.balance }; }
      open(OPEN.finance); await tick(); await tick();
      { const all = btns('#modal .options button'), find = p => all.find(o => o.label.startsWith(p));
        x.bills = { main: btns('#modal .main273 button'), mnote: document.querySelector('#modal .mnote273')?.textContent || '', raw: all.filter(o => / · [a-z]{2}( · |$)/.test(o.shown)).map(o => o.shown),
          offer: 'Предложение кредитора · Бытовые счета · ' + s.country, own: 'Бытовые счета · ' + s.country + ' · ', other: find('Бытовые счета · ' + other + ' · '), otherName: countries[other].name,
          cur: find(lease.creditor + ' · '), prev: find('Жильё · Проверка · договор 99 · '), legacy: find('Жильё · ' + s.country + ' · Проверка · rent · '),
          mode: lease.mode, leaseStatus: s.housing42?.leases?.[lease.id]?.status || '', creditor: lease.creditor }; }
      // Временно у близкого: в статусе срок, у кого — в «Сейчас»; срок вышел — последний месяц и тон «плохо».
      x.stay = {};
      for (const st of ['active', 'notice']) {
        __restore(); const m = parents17().find(p => p.alive); if (!m) break;
        m.country = s.country; m.city18 = residenceCity(); m.inner.trust = Math.max(m.inner.trust || 0, 60);
        const lease2 = ensureLease40(), t0 = s.clock.ticks;
        Object.assign(s.housing, { active: true, mode: 'host', occupant: m.id, lease40: lease2.id, listing41: null, propertyId: null });
        housingState42().temporary = { id: 'stay-2734', personId: m.id, lease: lease2.id, country: s.country, status: st, start: t0 - 3, end: st === 'active' ? t0 + 2 : t0, grace: st === 'active' ? t0 + 3 : t0 + 1, contribution: c().cost * .01 };
        open(OPEN.housing); await tick();
        x.stay[st] = { ok: !!activeStay42(), status: status(), now: __top()['Сейчас'] || '', month: __notes()['В месяц'] || '', name: m.name, main: [...document.querySelectorAll('#modal .main273 button')].map(b => __label(b)),
          want: st === 'active' ? 'Временное проживание · до ' + month273(t0 + 2, monthOf273) : 'Срок проживания вышел · найдите жильё до ' + month273(t0 + 1, monthOf273) };
      }
      // Общежитие (как его ставит enterDorm68): коммунальные входят в плату.
      __restore();
      { const q = stableHome59(s.country, residenceCity(), 'suburb', 'dorm68:verify2734:shared', 'room');
        Object.assign(q, { kind: 'room', rooms: 1, bedrooms: 1, areaM2: 10, rent: c().cost * .1 / 12, operation: 'rent', dorm68: true, program68: 'prog-verify2734', city: residenceCity(), country: s.country });
        Object.assign(s.housing, { country: s.country, city: residenceCity(), area: 'suburb', mode: 'rent', active: true, occupant: null, propertyId: null, room40: true, listing41: q });
        open(OPEN.housing); await tick(); x.dorm = { now: __top()['Сейчас'] || '', month: __notes()['В месяц'] || '' }; }
    }
    // Аренда против нынешнего жилья: разница на карточке — та, на которую вырастут расходы месяца после rentHouse41.
    if (kinds.includes('rent')) {
      __restore(); s.cash = Math.max(s.cash, 1e9); open(OPEN.rent); await tick();
      const q = market41('rent', __v.kind, __v.city).listings[__v.rentI], note = __notes()['В месяц'] || '', mode = s.housing.mode, own = mode === 'own' && s.properties.find(p => p.id === s.housing.propertyId);
      const maint = own && typeof propertyMaintenance41 === 'function' ? money(propertyMaintenance41(own)) + '/мес.' : null, b0 = monthlyBudget().cost;
      const ok = validListing41(q, 'rent') && rentHouse41(q); __close();
      x.rentCmp = { note, mode, ok, rise: monthlyBudget().cost - b0, rent: q.rent, maint };
    }
    // Покупка встаёт в план и проходит со следующим месяцем — как написано на кнопке.
    if (kinds.includes('buy')) {
      __restore(); const q = market41('buy', __v.kind, __v.city).listings[__v.buyI]; s.cash = Math.max(s.cash, q.purchase * 1.1); const n0 = s.properties.length, t0 = s.clock.ticks;
      if (s.properties.length < 5 && queueHouseBuy41(q)) { __adv(1); x.buy.real = { bought: s.properties.length - n0, ticks: s.clock.ticks - t0 }; }
    }
    return x;
  }, [name, kinds, OPEN]);
}

function compare(name, out) {
  const B = out.base, N = out.new, W = out.wide;
  for (const k of B.kinds) {
    const b = B.wins[k], n = N.wins[k], w = W?.wins[k];
    if (!n) { check(`${name}: окно «${k}» открылось`, false, 'нет окна'); continue; }
    if (k === 'offers') {
      // Список объявлений остаётся прежним окном, на каждом объявлении — сколько нужно при переезде.
      const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label)).map(l => l.label);
      check(`${name} · offers: те же объявления, на каждом «при переезде»`, !lost.length && n.labels.length === b.labels.length, { lost });
      note(`offers: окно ${b.labels.length ? b.pos[b.labels.at(-2)?.label]?.modalH : '?'} px → ${n.pos[n.labels.at(-2)?.label]?.modalH} px`);
      continue;
    }
    const title = k === 'move' ? B.steps.at(-1).title : b.title;
    check(`${name} · ${k}: окно-карточка («${n.area}»), заголовок прежний`, n.card && n.title === title && n.heading, { base: title, new: n.title, area: n.area, card: n.card });
    check(`${name} · ${k}: «?» справки остаётся у заголовка`, n.hintAtTitle, n.hintAtTitle);
    // Набор кнопок.
    const baseLabels = k === 'move' ? [...new Set(B.steps.flatMap(s => s.labels))] : b.labels.map(l => l.label);
    const dropped = DROPPED[k] || [];
    const lost = baseLabels.filter(l => !n.labels.some(m => m.label === l) && !dropped.includes(l));
    const extra = n.labels.map(m => m.label).filter(l => !baseLabels.includes(l));
    check(`${name} · ${k}: ни одна кнопка не потерялась, новых нет` + (k === 'move' ? ' (три окна «было» — одно «стало»)' : '') + (dropped.length ? ` (убрано нарочно: ${dropped.join(', ')})` : ''), !lost.length && !extra.length, { lost, extra });
    if (dropped.length) check(`${name} · ${k}: убранного нет`, dropped.every(l => !n.labels.some(m => m.label === l)), dropped);
    if (k !== 'move') {
      const state = b.labels.filter(l => { const m = n.labels.find(m => m.label === l.label); return m && (m.disabled !== l.disabled || m.option !== l.option); }).map(l => l.label);
      check(`${name} · ${k}: у каждой кнопки та же доступность и место среди вариантов`, !state.length, state);
      const diff = Object.keys(B.press).filter(key => key.startsWith(k + ' / ') && !dropped.some(l => key.endsWith(' / ' + l)) && JSON.stringify(B.press[key]) !== JSON.stringify(N.press[key])).map(key => ({ key, base: B.press[key], new: N.press[key] }));
      check(`${name} · ${k}: каждая старая кнопка нажимается и ведёт туда же`, !diff.length, diff);
      for (const l of dropped) { const was = B.press[k + ' / ' + l], now = N.press[k + ' / Автоплатежи: приоритеты и лимиты']; if (was) check(`${name} · ${k}: «${l}» вела туда же, куда «Автоплатежи: приоритеты и лимиты» (${was.title})`, was.title === now?.title, { was, now }); }
    }
    // Главные кнопки — на первом экране.
    if (n.main.length) {
      const hidden = n.main.filter(m => !m.fold), hiddenW = (w?.main || []).filter(m => !m.fold);
      check(`${name} · ${k}: главные кнопки видны без прокрутки на 390×844 (${n.main.map(m => m.label).join(' · ')})`, !hidden.length, hidden);
      if (w) check(`${name} · ${k}: главные кнопки видны без прокрутки на 1280×800`, !hiddenW.length, hiddenW);
      for (const m of n.main.filter(m => m.disabled)) check(`${name} · ${k}: серая «${m.label}» — с причиной под подписью`, !!m.why, m);
      const was = n.main.map(m => { const p = k === 'move' ? null : b.pos[m.label]; return '«' + m.label + '» ' + (p ? p.screen + '-й экран (' + p.y + ' px)' : '—') + ' → ' + m.y + ' px'; });
      note(`${name} · ${k}: ${was.join('; ')}; окно ${k === 'move' ? '3 окна' : (Object.values(b.pos)[0]?.modalH ?? '?') + ' px'} → ${n.more?.modalH ?? '?'} px, на 1280 — ${w?.main?.[0]?.y ?? '?'} px`);
    } else {
      check(`${name} · ${k}: без главных кнопок «Подробнее» видно без прокрутки`, n.more?.fold && (!w || w.more?.fold), { phone: n.more, wide: w?.more });
      note(`${name} · ${k}: главных кнопок нет — «Подробнее» на ${n.more?.y} px; окно ${(Object.values(b.pos)[0]?.modalH ?? '?')} px → ${n.more?.modalH} px`);
    }
    check(`${name} · ${k}: каждая строка «Не хватает» — кнопка или с пояснением`, n.need.every(x => x.fix || x.small), n.need);
    const zeros = Object.entries(n.top).filter(([, v]) => /^0 \S+(\/мес\.)?$/.test(v.trim()));
    check(`${name} · ${k}: наверху нет нулей`, !zeros.length, zeros);
  }
  const e = N.extra;
  // Числа.
  const f = e.fin;
  check(`${name}: «Финансы» — приходит, уходит, остаётся из monthlyBudget`, f.top['Приходит'] === f.want.in && (f.want.out === null ? /взрослые/.test(f.top['Уходит']) : f.top['Уходит'] === f.want.out) && f.top['Остаётся'] === f.want.left && f.sum < .01, f);
  check(`${name}: «Финансы» — деньги на счёте под «Остаётся»`, s_cashNote(f), f.notes);
  if (f.bills) {
    check(`${name}: «Финансы» — неоплаченное (financialSummary32) в статусе, «Погасить старые счета» и счета — главные кнопки`, f.status.includes(f.want.bills) && f.main.includes('Погасить старые счета с резервом') && f.main.length >= 2, { status: f.status, main: f.main });
    if (f.repay) check(`${name}: «Погасить старые счета» — на кнопке сумма safeRepayment61`, (f.repayHint || '').includes('направить ' + f.repay), f);
  } else check(`${name}: «Финансы» — без счетов главных кнопок нет, статус пуст или про кредиты`, !f.main.length, f);
  check(`${name}: «Финансы» — в «Подробнее» конвертер отдельно, в таблице нет нулей и «Проверяется при заявке»`, f.conv && !/Проверяется при заявке/.test(f.table) && !f.zeros.length, { conv: f.conv, zeros: f.zeros, table: f.table.slice(0, 300) });
  // Если первое открытие кризиса что-то записало в жизнь, modal38 сбрасывает историю окон и стрелка закрывает окно
  // (так и без money2734.js). Тогда кнопка обратно остаётся, а со второго раза петли нет.
  const loop = l => ['Пересмотреть долги и платежи', 'Долги и платежи'].includes(l), clean = c => c && !c.labels.some(loop) && c.back === 'Финансы';
  check(`${name}: «Кризис и возвращение» из «Финансов» — без кнопки обратно, стрелка ведёт в «Финансы»${clean(e.crisis) ? '' : ' (со второго раза)'}; открытый сам по себе — как был`,
    e.crisis.title === 'Кризис и возвращение' && (clean(e.crisis) || clean(e.crisis2)) && e.crisis.direct.some(loop), e);
  check(`${name}: «Подробнее» запоминается по виду окна, не в сохранении`, e.more.was === false && e.more.after === true && e.more.kept === true && e.more.other === false && e.more.closed === false && e.more.stored === '0' && !e.more.inSave, e.more);
  check(`${name}: «Жильё и дорога» — «В месяц» из homeCost, дорога из commuteMinutes`, e.housing.top['В месяц'] === e.housing.want || e.housing.mode === 'unstable42', e.housing);
  if (e.housing.way > 0) check(`${name}: «Жильё и дорога» — дорога ${e.housing.way} мин`, (e.housing.top['Дорога'] || '').startsWith(e.housing.way + ' мин'), e.housing.top);
  note(`${name}: «Жильё и дорога» — ${e.housing.mode}, наверх: ${e.housing.main.join(' · ')}${e.housing.status ? '; статус «' + e.housing.status + '»' : ''}`);
  if (e.rent) {
    check(`${name}: аренда — «В месяц» и «При переезде» из houseMoveQuote41`, e.rent.top['В месяц'] === e.rent.want.month && e.rent.top['При переезде'] === e.rent.want.move && e.rent.notes['При переезде'].includes(e.rent.want.deposit) && e.rent.notes['При переезде'].includes(e.rent.want.moving), e.rent);
    check(`${name}: аренда — дом и расходы на месте, в «Подробнее»`, e.rent.facts, e.rent);
    if (e.rent.spent !== undefined) check(`${name}: аренда — «Снять и переехать» списала столько, сколько «При переезде»`, e.rent.rented && Math.abs(e.rent.spent - e.rent.needed) < 1, { spent: e.rent.spent, needed: e.rent.needed });
    else check(`${name}: аренда — денег не хватает: строка «Не хватает» с кнопкой «Финансы»`, e.rent.need.some(x => /^Не хватает .+ на переезд$/.test(x.text) && x.fix), e.rent.need);
  }
  if (e.buy) {
    check(`${name}: покупка — цена с оформлением и содержание как в объявлении`, e.buy.top['Цена'] === e.buy.want.price && e.buy.top['В месяц'] === e.buy.want.month, e.buy);
    if (e.buy.spent) check(`${name}: покупка — buyHouse41 списала цену с оформлением, содержание купленного то же`, e.buy.spent === e.buy.want.price && e.buy.upkeep === e.buy.want.month, e.buy);
    check(`${name}: покупка — на «Рассчитать ипотеку» платёж из mortgageQuote43`, (e.buy.mort || '').includes(e.buy.mortWant), e.buy);
  }
  if (e.mort) {
    check(`${name}: ипотека — «Нужно сейчас» и платёж из mortgageQuote43`, e.mort.top['Нужно сейчас'] === e.mort.want.now && e.mort.top['Платёж'] === e.mort.want.pay, e.mort);
    const bad = e.mort.plans.filter(p => !(p.hint || '').includes(p.want));
    check(`${name}: ипотека — платёж на каждом варианте взноса и срока`, !bad.length, bad);
    check(`${name}: ипотека — без «игровой» ставки и проверки`, !/игров/.test(e.mort.text), e.mort.text.slice(0, 300));
    check(`${name}: ипотека — ${e.mort.reasons.length ? 'причины отказа в «Не хватает», серая кнопка с причиной' : 'одобрение в статусе'}`, e.mort.reasons.length ? e.mort.need.length === e.mort.reasons.length && e.mort.main[0]?.disabled && !!e.mort.main[0]?.why : /одобрит/.test(e.mort.status), e.mort);
    if (e.mort.contract) check(`${name}: ипотека — mortgageBuy43 записала тот же платёж`, e.mort.contract === e.mort.contractWant, e.mort);
  }
  if (e.mort?.housing) {
    check(`${name}: своё жильё в ипотеке — в «Жилье» «в ипотеке» и платёж договора, в «Финансах» строка «Кредиты»`, /в ипотеке/.test(e.mort.housing.top['Сейчас'] || '') && (e.mort.housing.notes['В месяц'] || '').includes('ипотека ' + e.mort.contract) && e.mort.finance.top['Кредиты'] === e.mort.finance.want, e.mort);
  }
  if (e.unstable) check(`${name}: нет постоянного жилья — статус и «варианты помощи» первой кнопкой, на первом экране`, e.unstable.status === 'Нет постоянного жилья' && e.unstable.main[0]?.label === 'Нет постоянного жилья · варианты помощи' && e.unstable.main.every(m => m.fold), e.unstable);
  if (e.repair) check(`${name}: поломка — ${e.repair.status.startsWith('Поломка: ') ? 'в статусе, «Состояние жилья и ремонт» первой кнопкой' : 'после срочного («' + e.repair.status + '»), «Состояние жилья и ремонт» среди главных'}`,
    (e.repair.status.startsWith('Поломка: ') ? e.repair.main[0]?.label === 'Состояние жилья и ремонт' : e.repair.main.slice(1).some(m => m.label === 'Состояние жилья и ремонт')) && e.repair.main.every(m => m.fold), e.repair);
  if (e.move) {
    check(`${name}: переезд — одно окно «Подтвердить переезд», цифры из moveQuote68`, /^Подтвердить переезд · /.test(e.move.title) && e.move.top['Разово'] === e.move.want.once && e.move.top['Нужно иметь'] === e.move.want.need && (e.move.top['Жильё'] || '').includes(e.move.want.rent || ' · '), e.move);
    if (e.move.switched) check(`${name}: переезд — на другом жилье его сумма (moveQuote68), выбирается в том же окне, сумма пересчитана`, (e.move.switched.pre || '').includes('разово ' + e.move.switched.want) && /^Подтвердить переезд · /.test(e.move.switched.title) && e.move.switched.once === e.move.switched.want && /сейчас/.test(e.move.switched.hint), e.move.switched);
    if (e.move.payer) check(`${name}: переезд — «Попросить оплатить» в том же окне, доля родителя в «Разово»`, /^Подтвердить переезд · /.test(e.move.payer.title) && /сейчас/.test(e.move.payer.hint) && (Number(e.move.payer.want.replace(/\D/g, '')) < 1 || e.move.payer.note.includes(e.move.payer.want) || e.move.payer.want === e.move.payer.once && /всё платит/.test(e.move.payer.note)), e.move.payer);
    if (e.move.spent) check(`${name}: переезд — finishMove16 списала столько своих денег, сколько обещало окно`, e.move.spent === e.move.spentWant, e.move);
    else note(`${name}: переезд не проводится в этом состоянии (${JSON.stringify(e.move.need)})`);
  }
  // Исправления после рецензии 273.4.
  if (f.bills) check(`${name}: «Финансы» — главных кнопок не больше трёх`, f.main.length <= 3, f.main);
  if (e.month) check(`${name}: «Финансы» — старый счёт не расход месяца: в «Уходит» и «Остаётся» его нет, за месяц деньги меняются на «Остаётся», счёт тот же`,
    e.month.top['Уходит'] === e.month.want.out && e.month.top['Остаётся'] === e.month.want.left && e.month.billSame && Math.abs(e.month.change - e.month.left) < 1, e.month);
  if (e.bills) {
    const b = e.bills, main = b.main.map(m => m.label);
    check(`${name}: «Финансы», пять счетов — главных три: «Погасить…» и два самых срочных, остальные — «Ещё … в «Подробнее»», всё на первом экране`, main.length === 3 && main[0] === 'Погасить старые счета с резервом' && /^Ещё \d+ сч(ёт|ёта|етов) — в «Подробнее»\.$/.test(b.mnote) && b.main.every(m => m.fold), b);
    check(`${name}: «Финансы» — предложение кредитора вместо кнопки своего счёта, а не сверх`, main.includes(b.offer) && !main.some(l => l.startsWith(b.own)), main);
    if (['notice', 'warning'].includes(b.leaseStatus)) check(`${name}: «Финансы» — аренда с ${b.leaseStatus === 'notice' ? 'сроком' : 'предупреждением'} среди главных`, main.some(l => l.startsWith(b.creditor + ' · ')), main);
    check(`${name}: «Финансы» — на кнопках счетов нет кода страны и режима договора, чужая страна — названием`, !b.raw.length && !!b.other && b.other.shown.includes(b.otherName) && !!b.legacy && !/ · (rent|own|parents|host)( · |$)/.test(b.legacy.shown), { raw: b.raw, other: b.other, legacy: b.legacy });
    const want = { own: 'содержание вашего жилья', parents: 'ваша доля расходов на жильё', host: 'ваша доля расходов на жильё' }[b.mode];
    check(`${name}: «Финансы» — счёт нынешнего договора (${b.mode}) не «по прежнему договору»${want ? ', а «' + want + '»' : ''}; прежнего — «по прежнему»`, !!b.cur && !/прежнему/.test(b.cur.hint) && (!want || b.cur.hint.includes(want)) && /по прежнему договору/.test(b.prev?.hint || ''), { cur: b.cur, prev: b.prev });
  }
  if (!f.study) check(`${name}: «Финансы» — без учёбы в «Уходит» нет «учёбы»`, !/учёб/.test(f.notes['Уходит'] || ''), f.notes);
  check(`${name}: «Жильё и дорога» — «коммунальные — отдельно» только у аренды и своего жилья (${e.housing.mode})`, ['rent', 'own'].includes(e.housing.mode) || !/коммунальн/.test(e.housing.notes['В месяц'] || ''), e.housing.notes);
  if (e.dorm) check(`${name}: общежитие — без «коммунальные — отдельно»`, /общежитие/.test(e.dorm.now) && !/коммунальн/.test(e.dorm.month), e.dorm);
  for (const [st, v] of Object.entries(e.stay || {})) check(`${name}: временно у близкого (${st}) — в статусе срок${st === 'notice' ? ' и «найдите жильё» тоном «плохо»' : ''}, у кого — в «Сейчас», без коммунальных`,
    v.ok && v.status.text === v.want && v.status.tone === (st === 'notice' ? 'bad' : 'wait') && !v.status.text.includes(v.name) && v.now.includes(v.name) && !/коммунальн/.test(v.month), v);
  if (e.rentCmp) {
    const r = e.rentCmp, num = x => Number(String(x).replace(/[^\d]/g, '')), cmp = /на ([^·]+?) (больше|меньше), чем сейчас/.exec(r.note);
    const ok = cmp ? Math.abs(r.rise - (cmp[2] === 'больше' ? 1 : -1) * num(cmp[1])) < 1.5 : /столько же, сколько сейчас/.test(r.note) ? Math.abs(r.rise) < 1.5 : r.maint ? r.note.includes('плюс содержание своего жилья ' + r.maint) && Math.abs(r.rise - r.rent) < 1.5 : !/сейчас/.test(r.note);
    if (r.ok) check(`${name}: аренда (сейчас ${r.mode}) — сравнение с нынешним жильём верное: после «Снять и переехать» расходы месяца растут ровно на столько`, ok, r);
    else note(`${name}: аренда — снять не получилось, сравнение не проверено`);
  }
  if (e.buy) {
    check(`${name}: покупка — на «Запланировать покупку» месяц покупки, на «Рассчитать ипотеку» «сразу», а не «сейчас»`, (e.buy.plan || '').split(' · ')[0] === e.buy.planWant && /сразу /.test(e.buy.mort || '') && !/сейчас/.test(e.buy.mort || ''), { plan: e.buy.plan, want: e.buy.planWant, mort: e.buy.mort });
    if (e.buy.real) check(`${name}: покупка — запланирована и через месяц куплена, как написано`, e.buy.real.bought === 1 && e.buy.real.ticks === 1, e.buy.real);
    check(`${name}: покупка — «6 средних годовых зарплат», «8,1 средней годовой зарплаты»`, !e.buy.wages.length && !/(^|[^\d,])\d+ средней годовой/.test(e.buy.notes['Цена'] || ''), { wages: e.buy.wages, note: e.buy.notes['Цена'] });
  }
  if (e.mort) {
    const same = e.mort.hints.find(h => h.label === e.mort.same.label)?.hint || '';
    check(`${name}: ипотека — на вариантах «сразу», а не «сейчас»; на «Купить без переезда» нет платежа, который уже наверху`, e.mort.hints.every(h => !/сейчас/.test(h.hint)) && (!e.mort.same.pay || !same.includes('платёж')), e.mort.hints);
    check(`${name}: ипотека — «Адрес»: месяц переезда`, e.mort.address === e.mort.addressWant, { address: e.mort.address, want: e.mort.addressWant });
    check(`${name}: ипотека — в «Подробнее» сумма банка один раз, ставка с запятой`, (e.mort.text.match(/продавцу/g) || []).length === 1 && !/\d\.\d%/.test(e.mort.text), e.mort.text.slice(0, 500));
  }
  if (e.move) {
    const m = e.move;
    check(`${name}: переезд — под заголовком не город ещё раз${m.to !== m.from ? ' (за границу — страна)' : ''}`, m.to !== m.from ? m.sub === m.countryName : m.sub === '', { sub: m.sub, title: m.title });
    check(`${name}: переезд — под кнопкой месяц переезда, а не «один месяц»`, m.mnote === m.mnoteWant, { mnote: m.mnote, want: m.mnoteWant });
    if (m.real) check(`${name}: переезд — запланирован и через месяц состоялся, как написано`, m.real.moved && m.real.ticks === 1, m.real);
    check(`${name}: переезд — «Жильё» и «Кто платит» отдельными рядами, в каждом одна отметка «сейчас»`, m.groups.length === 2 && m.groups[0].head === 'Жильё' && m.groups[1].head === 'Кто платит' && m.groups[1].labels.includes('Свои средства') && m.groups.every(g => g.marks === 1), m.groups);
    if (m.homeAfter !== undefined) {
      const row = m.top['Жильё'] || '', tail = row.split(' · ').at(-1), v = m.homeAfter;
      check(`${name}: переезд (${m.home}) — «Жильё» в месяц то, что начислит месяц на новом месте (homeCost, ${m.modeAfter})`, v < 1 ? tail === 'без платы' : /\/мес\.$/.test(tail) && Math.abs(Number(tail.replace(/[^\d]/g, '')) - Math.round(v)) <= 1, { row, after: v });
    }
  }
  check(`${name}: ошибок на странице нет`, !B.errors.length && !N.errors.length && !(W?.errors.length), { base: B.errors, new: N.errors, wide: W?.errors });
}
function s_cashNote(f) { return /на счёте/.test(f.notes['Остаётся'] || '') && (f.notes['Остаётся'].includes(f.want.cash) || !/сейчас/.test(f.notes['Остаётся'])); }

(async () => {
  const browser = await chromium.launch();
  try {
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    const runs = [];
    if (SAVE && fs.existsSync(SAVE)) runs.push(['owner', { raw: fs.readFileSync(SAVE, 'utf8') }]);
    else note('SAVE не задан: проверка только на новых жизнях');
    runs.push(['young', { country: 'ru', seed: 27341 }], ['broke', { country: 'ru', seed: 27342 }], ['settled', { country: 'de', seed: 27343, startAge: '30' }]);
    for (const [name, opts] of runs) {
      const out = await scenario(browser, name, opts);
      if (BASE) { for (const k of out.base.kinds) { const b = out.base.wins[k]; if (k !== 'offers') check(`${name} · ${k}: окно с карточкой`, b.card, b.title); } continue; }
      compare(name, out);
    }
    const order = [...INDEX.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    check('money2734.js подключён сразу после windows273.js', BASE || order[order.indexOf('windows273.js') + 1] === 'money2734.js', order.slice(-5));
    const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8'));
    check('money2734.js — в offline-assets.json, список отсортирован', assets.includes('money2734.js') && assets.every((a, i) => !i || assets[i - 1] <= a));
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без money2734.js)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
