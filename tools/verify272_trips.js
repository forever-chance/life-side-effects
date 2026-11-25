// Проверки сборки 272, часть «поездки» (trips272.js): уход за всеми питомцами одним выбором, память выбора,
// блок «Чтобы поехать, не хватает» наверху окон поездки.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify272_trips.js
// BASE=1 — прогон без trips272.js: видно, какие проверки ловят старое поведение.
// Деньги: поездка с пятью собаками, собранная общим выбором с исключениями, и та же поездка, собранная по одному
// питомцу, в двух одинаковых жизнях — одна цена, одно списание при отъезде, одни часы ухода в месяц поездки.
// Старое сохранение: поездка, запланированная без trips272.js, после загрузки с ним сохраняет план, цену и списание.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); };

async function page(browser, { viewport = { width: 1280, height: 900 }, mine = !BASE, born = true } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  const p = { pg, ctx, errors, mine };
  if (born) await birth(p);
  return p;
}
async function birth(p, raw = null) {
  const { pg } = p;
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(() => { const e = document.getElementById('country'); e.value = 'nl'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await pg.click('text=Родиться');
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  if (p.mine && !INDEX.includes('src="trips272.js')) await pg.addScriptTag({ path: path.join(ROOT, 'trips272.js') });
  await pg.evaluate(helpers);
}

// Помощники внутри страницы.
function helpers() {
  window.__opts = () => [...document.querySelectorAll('#modal .options button')].map(b => (b.disabled ? '[x] ' : '') + b.textContent.replace(/\s+/g, ' ').trim());
  window.__click = src => { const re = new RegExp(src); const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
  window.__ready = () => { const box = document.querySelector('#modal .ready272'); if (!box) return null; return { ok: box.classList.contains('ready272-ok'), head: box.querySelector('h3')?.textContent || '', items: [...box.querySelectorAll('.ready272-item')].map(e => ({ text: e.childNodes[0]?.textContent || e.textContent, fix: e.querySelector('small')?.textContent || null, button: e.tagName === 'BUTTON' })) }; };
  window.__readyClick = src => { const re = new RegExp(src); const b = [...document.querySelectorAll('#modal .ready272 button')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
  window.__sections = () => [...document.querySelectorAll('#modal .detail-section20 h3')].map(h => h.textContent);
  window.__title = () => document.querySelector('#modal h2')?.textContent || '';
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); };
  window.__adult = (role, age, trust = 90, gender = 'f') => { const p = person(role, age, gender, s.country); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p); p.inner.trust = trust; p.inner.strain = 5; p.bond = Math.max(p.bond || 0, trust); return p; };
  // Взрослый без работы, живёт один в съёмной квартире, родители в другом городе: дома никто не остаётся.
  window.__base = () => { s.age = 40; s.cash = 5e6; s.job = null; s.clock.running = false; activateHome(); const list = cities[s.country]; moveHome('rent', list[0], 'center'); for (const q of parents17()) q.city18 = list[3]; s.pending = []; if ($('#modal').open) closeModal(); };
  window.__dogs = (names = ['Рекс', 'Белка', 'Шарик', 'Тоша', 'Луна']) => names.map((name, i) => { const roll = shelterRoll38('dog'); placePet79({ ...roll, id: 'dog-' + name, kind: 'dog', name, sex38: i % 2 ? 'f' : 'm', months: 30 }, 'shelter', 0); return s.pets.find(p => p.name === name); });
  window.__trip = (i = 0, extra = {}) => ({ country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[i], days: 7, comfort: 'simple', companion: null, party53: [], pay53: 'all', ...extra });
  window.__name = id => s.pets.find(p => p.id === id)?.name || id;
  window.__plans = j => (j?.pets || []).map(q => ({ pet: __name(q.pet), mode: q.mode, helper: q.helper || null, agreement: q.agreement ? 'yes' : null, manual62: !!q.manual62, auto59: !!q.auto59 })).sort((a, b) => a.pet < b.pet ? -1 : 1);
  window.__lastTrip = () => travel52().trips.at(-1);
  window.__charged = t => (ensureFamily17().ledger.filter(e => e.key === 'expense23:' + t.id || e.key === 'group-trip53:' + t.id).flatMap(e => e.parts).filter(a => a.payer === 'player').reduce((n, a) => n + a.amount, 0));
  window.__watchHours = () => { if (window.__hoursHook) return; window.__hoursHook = true; const e = travelEndMonth52; travelEndMonth52 = function (...a) { const t = travel52().trips.find(t => t.status === 'away' && t.departed === s.clock.ticks); if (t) window.__hours = petHours(); return e.apply(this, a); }; };
  // Выбор по одному, как игрок: «Питомцы и присмотр» → питомец → уход.
  window.__perPet = (choices) => { for (const [name, label] of choices) { if (!__click('^Питомцы и присмотр')) return 'нет кнопки питомцев'; if (!__click('^' + name)) return 'нет питомца ' + name; if (!__click('^' + label)) return 'нет ухода ' + label + ' для ' + name; } return 'ok'; };
}

// Одна поездка, собранная двумя путями.
const MIX = [['Рекс', 'Взять с собой'], ['Белка', 'Взять с собой'], ['Шарик', 'Нанять ситтера'], ['Тоша', 'Нанять ситтера'], ['Луна', 'Зоогостиница']];
async function buildTrip(pg, how) {
  return pg.evaluate(([how, MIX]) => {
    Math.random = seeded269(272);
    __base();
    __dogs();
    __watchHours();
    travelDraftMenu52(__trip(0));
    let path;
    if (how === 'one') path = __perPet(MIX);
    else {
      // Общий выбор «Ситтер для всех», потом исключения по одному.
      const a = __click('^Питомцы и присмотр'), b = __click('^Ситтер для всех');
      path = a && b ? 'ok' : 'нет общего выбора';
      if (path === 'ok') { __click('^Готово'); path = __perPet([MIX[0], MIX[1], MIX[4]]); }
    }
    const title = __title();
    const why = travelWhy52(__trip(0));
    const booked = __click('^Запланировать');
    const t = __lastTrip();
    const out = { path, title, booked, why, plans: __plans(t?.journey57), fee: t?.fee, extra: t?.journey57?.quote?.extra57, total: t?.journey57?.quote?.total, care: (t?.journey57?.quote?.care57 || []).map(q => [__name(q.pet), q.mode, q.fee]).sort() };
    const cash0 = s.cash;
    __month(1);
    out.status = t?.status;
    out.charged = t ? __charged(t) : null;
    out.hours = window.__hours ?? null;
    out.tripCare = s.pets.filter(p => p.tripCare57).map(p => [p.name, p.tripCare57.mode]).sort();
    out.spentAtLeast = cash0 - s.cash >= (out.charged || 0) - 1e-6;
    return out;
  }, [how, MIX]);
}

(async () => {
  const browser = await chromium.launch();
  try {
    // ---------- 1. Деньги: общий выбор и выбор по одному дают одно и то же ----------
    {
      const A = await page(browser), B = await page(browser);
      const one = await buildTrip(A.pg, 'one'), all = await buildTrip(B.pg, 'all');
      check('по одному: поездка запланирована и уехала', one.path === 'ok' && one.booked && ['away', 'completed'].includes(one.status), { path: one.path, why: one.why, status: one.status });
      check('общим выбором: «Ситтер для всех» и исключения, поездка уехала', all.path === 'ok' && all.booked && ['away', 'completed'].includes(all.status), { path: all.path, why: all.why, status: all.status });
      check('планы питомцев совпадают поле в поле', JSON.stringify(one.plans) === JSON.stringify(all.plans), { one: one.plans, all: all.plans });
      check('цена ухода по каждому питомцу совпадает', JSON.stringify(one.care) === JSON.stringify(all.care), { one: one.care, all: all.care });
      check('доплата за уход и полная цена совпадают', one.extra === all.extra && one.total === all.total && one.extra > 0, { one: [one.extra, one.total], all: [all.extra, all.total] });
      check('цена поездки (ваша часть) совпадает', one.fee === all.fee && one.fee > 0, [one.fee, all.fee]);
      check('при отъезде списано одинаково и ровно цена поездки', one.charged === all.charged && Math.abs(all.charged - all.fee) < 1e-6, [one.charged, all.charged, all.fee]);
      check('часы ухода в месяц поездки совпадают', one.hours === all.hours && one.hours !== null, [one.hours, all.hours]);
      check('на время поездки у питомцев тот же уход', JSON.stringify(one.tripCare) === JSON.stringify(all.tripCare) && all.tripCare.length === 5, all.tripCare);
      check('ошибок на странице нет (деньги)', !A.errors.length && !B.errors.length, [...A.errors, ...B.errors].slice(0, 3));
      await A.ctx.close(); await B.ctx.close();
    }

    // ---------- 2. Общий выбор по каждому виду ухода = тот же план, что по одному ----------
    {
      const P = await page(browser);
      const r = await P.pg.evaluate(() => {
        __base(); const dogs = __dogs();
        const out = {};
        const draft = journeyDraft57(__trip(0));
        const perPet = (d, mode) => { let j = copyJourney57(d.journey57); for (const p of dogs) { j.pets = j.pets.filter(q => q.pet !== p.id); j.pets.push({ pet: p.id, mode, helper: null, agreement: null, manual62: true, auto59: false }); } return { ...d, journey57: j }; };
        for (const [mode, label] of [['bring', 'Всех с собой'], ['sitter', 'Ситтер для всех'], ['hotel', 'Всех в гостиницу']]) {
          journeyPetsMenu57(draft);
          const clicked = __click('^' + label);
          // Окно питомцев открыто заново с новым планом: забираем его из «Готово».
          let got = null; const keep = journeyReturn57; journeyReturn57 = d => { got = d; }; __click('^Готово'); journeyReturn57 = keep;
          const ref = perPet(draft, mode);
          out[mode] = { clicked, same: !!got && JSON.stringify(__plans(got.journey57)) === JSON.stringify(__plans(ref.journey57)), quote: got && quoteJourney57(got).extra57 === quoteJourney57(ref).extra57 && quoteJourney57(got).player === quoteJourney57(ref).player };
        }
        // Дома остаётся взрослый: «Всех оставить дома» как «Оставить дома» у каждого.
        const h = __adult('Сосед', 45); s.housing.occupant = h.id;
        const d2 = journeyDraft57(__trip(1));
        journeyPetsMenu57(d2);
        out.homeOpt = __opts().find(o => o.startsWith('Всех оставить дома')) || null;
        s.housing.occupant = null;
        // Поездка на один день: «Всех дома на день».
        const d3 = journeyDraft57(__trip(1, { days: 1 }));
        journeyPetsMenu57(d3);
        out.dayOpt = __opts().find(o => o.startsWith('Всех дома на день')) || null;
        // Один питомец: общего выбора нет.
        return out;
      });
      for (const mode of ['bring', 'sitter', 'hotel']) check('общий выбор ' + mode + ': план и цена как по одному', r[mode]?.clicked && r[mode]?.same && r[mode]?.quote, r[mode]);
      check('дома остаётся взрослый — есть «Всех оставить дома», без отдельной платы', /без отдельной платы/.test(r.homeOpt || ''), r.homeOpt);
      check('поездка на день — есть «Всех дома на день»', !!r.dayOpt, r.dayOpt);
      check('ошибок на странице нет (виды ухода)', !P.errors.length, P.errors.slice(0, 3));
      await P.ctx.close();
    }

    // ---------- 3. «Всех к близкому»: один разговор, не больше трёх у одного, остальным — другой близкий ----------
    {
      const P = await page(browser);
      const r = await P.pg.evaluate(() => {
        __base(); __dogs();
        const nina = __adult('Подруга', 40, 95, 'f'), oleg = __adult('Друг', 42, 95, 'm');
        const logs0 = s.log.length;
        travelDraftMenu52(__trip(0));
        const out = {};
        __click('^Питомцы и присмотр');
        out.opened = __click('^Всех к близкому');
        out.pickTitle = __title();
        const real = Math.random; Math.random = () => 0.05;
        out.asked = __click('^' + nina.name);
        Math.random = real;
        out.resultTitle = __title();
        out.resultText = document.querySelector('#modal p')?.textContent || document.querySelector('#modal .dialog-copy20')?.textContent || '';
        out.rest = __opts();
        out.logs1 = s.log.length - logs0;
        // Остальных — к другому близкому.
        out.other = __click('^Остальных к другому близкому');
        Math.random = () => 0.05;
        out.asked2 = __click('^' + oleg.name);
        Math.random = real;
        out.done = __click('^Вернуться к плану');
        out.titleAfter = __title();
        const d = journeyDraft57(__trip(0));
        // План в окне черновика: забираем его через «Питомцы и присмотр» → «Готово».
        let got = null; __click('^Питомцы и присмотр'); const keep = journeyReturn57; journeyReturn57 = x => { got = x; }; __click('^Готово'); journeyReturn57 = keep;
        out.plans = (got?.journey57?.pets || []).map(q => [q.mode, living(q.helper)?.name || null, !!careAgreement57(q.agreement)]);
        out.why = got ? petPlanWhy57(got) : ['нет плана'];
        out.agreed = journeys57().agreements.filter(q => q.status === 'agreed').length;
        out.logs2 = s.log.length - logs0;
        out.ninaName = nina.name; out.olegName = oleg.name;
        return out;
      });
      check('«Всех к близкому» открывает выбор человека', r.opened && r.pickTitle === 'Кого попросить', r.pickTitle);
      check('один разговор: трое у первого близкого, двое без присмотра', /согласна присмотреть/.test(r.resultText) && /не возьмёт/.test(r.resultText), r.resultText);
      check('после ответа сразу предлагают другого близкого для остальных', r.rest.some(o => o.startsWith('Остальных к другому близкому')) && r.rest.some(o => o.startsWith('Остальных в гостиницу')), r.rest);
      check('одна запись в истории на разговор', r.logs1 === 1, r.logs1);
      check('второй близкий берёт остальных, у всех пятерых действующее согласие', r.other && r.asked2 && r.plans.length === 5 && r.plans.every(p => p[0] === 'relative' && p[2]) && !r.why.length, { plans: r.plans, why: r.why });
      check('согласие записано по каждому питомцу, как при просьбе по одному', r.agreed === 5, r.agreed);
      check('ошибок на странице нет (близкий)', !P.errors.length, P.errors.slice(0, 3));
      await P.ctx.close();
    }

    // ---------- 4. Память выбора и блок готовности ----------
    {
      const P = await page(browser);
      const r = await P.pg.evaluate(() => {
        __base(); __dogs();
        const nina = __adult('Подруга', 40, 95, 'f');
        const out = {};
        // Первая поездка: Рекс и Белка с близким, Шарик с собой, Тоша и Луна у ситтера.
        travelDraftMenu52(__trip(0));
        __click('^Питомцы и присмотр'); __click('^Ситтер для всех'); __click('^Готово');
        const real = Math.random; Math.random = () => 0.05;
        for (const name of ['Рекс', 'Белка']) { __click('^Питомцы и присмотр'); __click('^' + name); __click('^Попросить · ' + nina.name); }
        Math.random = real;
        __perPet([['Шарик', 'Взять с собой']]);
        out.booked = __click('^Запланировать');
        const t = __lastTrip();
        out.first = (t?.journey57?.pets || []).map(q => [q.pet, q.mode]).sort();
        cancelTravel52(t.id);
        // Новая собака и новая поездка.
        // Шестую собаку приют не отдаст (не хватит времени на уход): берём копию.
        { const p = JSON.parse(JSON.stringify(s.pets.find(p => p.alive))); Object.assign(p, { id: 'pet-zhuzha', name: 'Жужа', notes: [] }); delete p.tripCare57; delete p.command38; s.pets.push(p); }
        travelDraftMenu52(__trip(1));
        out.ready = __ready();
        const d = journeyDraft57(__trip(1));
        let got = null; __click('^Питомцы и присмотр'); const keep = journeyReturn57; journeyReturn57 = x => { got = x; }; __click('^Готово'); journeyReturn57 = keep;
        out.second = (got?.journey57?.pets || []).map(q => [s.pets.find(p => p.id === q.pet)?.name, q.mode, living(q.helper)?.name || null]).sort();
        travelDraftMenu52(got);
        out.ready = __ready();
        out.sections = __sections();
        // Кнопка в блоке: попросить того же близкого сразу за двоих.
        Math.random = () => 0.05;
        out.askClick = __readyClick('Попросить');
        Math.random = real;
        out.afterAskTitle = __title();
        __click('^Вернуться к плану');
        out.readyAfter = __ready();
        out.sectionsAfter = __sections();
        out.nina = nina.name;
        // Нет денег: причина наверху, кнопка «Деньги» открывает окно денег.
        s.cash = 0;
        travelDraftMenu52(got);
        out.money = __ready();
        out.moneyClick = __readyClick('Деньги');
        out.moneyTitle = __title();
        out.moneyOpts = __opts();
        return out;
      });
      check('первая поездка запланирована', r.booked, r.first);
      const second = Object.fromEntries((r.second || []).map(x => [x[0], x]));
      check('память: Рекс и Белка снова у того же близкого (согласие — заново)', second['Рекс']?.[1] === 'relative' && second['Белка']?.[2] === r.nina, r.second);
      check('память: Шарик снова с собой, Тоша и Луна у ситтера', second['Шарик']?.[1] === 'bring' && second['Тоша']?.[1] === 'sitter' && second['Луна']?.[1] === 'sitter', r.second);
      check('память: новая собака получает последний общий выбор (ситтер)', second['Жужа']?.[1] === 'sitter', r.second);
      check('блок наверху: «Чтобы поехать, не хватает» — одной строкой за двоих, кнопка «Попросить»', r.ready && !r.ready.ok && r.ready.items.some(i => /Рекс, Белка: нет действующего согласия близкого/.test(i.text) && /^Попросить · /.test(i.fix || '')), r.ready);
      check('раздел «Готовность» внизу убран, пока причины наверху', r.sections && !r.sections.includes('Готовность'), r.sections);
      check('кнопка «Попросить» договаривается, после — «Можно ехать»', r.askClick && r.readyAfter?.ok && /Можно ехать/.test(r.readyAfter.head), { title: r.afterAskTitle, ready: r.readyAfter });
      check('когда всё готово, «Готовность» с условиями оплаты остаётся внизу', r.sectionsAfter?.includes('Готовность'), r.sectionsAfter);
      check('нет денег: причина наверху с кнопкой «Деньги»', r.money && r.money.items.some(i => /не хватает/i.test(i.text) && i.fix === 'Деньги'), r.money);
      check('«Деньги» открывает окно с бюджетом, уходом и финансами', r.moneyClick && r.moneyTitle === 'Деньги на поездку' && r.moneyOpts.some(o => o.startsWith('Бюджет')) && r.moneyOpts.some(o => o.startsWith('Питомцы и присмотр')) && r.moneyOpts.includes('Финансы'), { title: r.moneyTitle, opts: r.moneyOpts });
      check('ошибок на странице нет (память и блок)', !P.errors.length, P.errors.slice(0, 3));
      await P.ctx.close();
    }

    // ---------- 5. Дети, отложенная поездка, «Дорога и уход», карточка; телефон и компьютер ----------
    for (const [tag, viewport] of [['телефон', { width: 390, height: 844 }], ['компьютер', { width: 1280, height: 900 }]]) {
      const P = await page(browser, { viewport });
      const r = await P.pg.evaluate(() => {
        __base(); __dogs(['Рекс', 'Белка']);
        const kid = person('Ребенок', 7); kid.bond = 75; kid.birth49 = { method: 'birth', parents: ['player'] }; kid.parentId = null; kid.city18 = residenceCity(); s.people.push(kid); enrichPerson(kid); familyState27(); kid.bio27.parents = ['player'];
        const out = { kid: kid.name };
        travelDraftMenu52(__trip(0));
        out.draft = __ready();
        return out;
      });
      // Настоящий клик по причине про детей.
      let clicked = false;
      try { await P.pg.locator('#modal .ready272 button', { hasText: r.kid }).first().click({ timeout: 3000 }); clicked = true; } catch (e) {}
      const kidWin = await P.pg.evaluate(() => __title());
      check(tag + ': ребёнок младше 12 — причина наверху, клик открывает присмотр за детьми', r.draft?.items?.some(i => i.text.includes(r.kid) && i.fix === 'Присмотр за детьми') && clicked && kidWin === 'С кем останутся дети', { ready: r.draft, title: kidWin });
      const layout = await P.pg.evaluate(() => {
        travelDraftMenu52(__trip(0));
        const m = document.querySelector('#modal'), box = m.querySelector('.ready272'), first = m.querySelector('.detail20');
        const mr = m.getBoundingClientRect();
        return { box: !!box, aboveDetails: !!box && !!first && box.getBoundingClientRect().top < first.getBoundingClientRect().top, belowTitle: !!box && box.getBoundingClientRect().top > m.querySelector('h2').getBoundingClientRect().top,
          noScroll: m.scrollWidth <= m.clientWidth + 1, inside: [...m.querySelectorAll('.ready272 .ready272-item')].every(e => { const r = e.getBoundingClientRect(); return r.left >= mr.left - 1 && r.right <= mr.right + 1; }), visible: !!box && box.getBoundingClientRect().top < window.innerHeight };
      });
      check(tag + ': блок сразу под заголовком, над таблицей, виден без прокрутки, не шире окна', layout.box && layout.aboveDetails && layout.belowTitle && layout.noScroll && layout.inside && layout.visible, layout);
      await P.pg.screenshot({ path: path.join(process.env.SHOTS || require('os').tmpdir(), 'verify272-trips-' + (tag === 'телефон' ? 'phone' : 'desktop') + '.png') });
      // Настоящие клики: «Питомцы и присмотр» → «Ситтер для всех» → «Готово».
      let bulkClicks = true;
      try {
        await P.pg.locator('#modal .options button', { hasText: 'Питомцы и присмотр' }).first().click({ timeout: 3000 });
        await P.pg.locator('#modal .options button', { hasText: 'Ситтер для всех' }).first().click({ timeout: 3000 });
        await P.pg.locator('#modal .options button', { hasText: 'Готово' }).first().click({ timeout: 3000 });
      } catch (e) { bulkClicks = false; }
      const afterBulk = await P.pg.evaluate(() => ({ title: __title(), hint: __opts().find(o => o.startsWith('Питомцы и присмотр')) || '' }));
      check(tag + ': общий выбор настоящими кликами, в черновике видно «Все: Нанять ситтера»', bulkClicks && /^Поездка/.test(afterBulk.title) && /Все: Нанять ситтера/.test(afterBulk.hint), afterBulk);
      // Присмотр есть → поездка запланирована; потом присмотр пропал: карточка и «Дорога и уход» показывают причину.
      const r2 = await P.pg.evaluate(kidName => {
        const out = {};
        const nanny = __adult('Соседка', 50, 95, 'f');
        const kid = s.people.find(p => p.name === kidName);
        const d = { ...__trip(0), childcare86: { [kid.id]: { helper: nanny.id, status: 'accepted', tick: s.clock.ticks, until: s.clock.ticks + 12 } } };
        out.why = travelWhy52(d);
        out.booked = bookTravel52(d);
        const t = __lastTrip();
        travelTripMenu52(t.id);
        out.cardOk = __ready();
        nanny.alive = false;
        travelTripMenu52(t.id);
        out.card = __ready();
        out.cardFix = __readyClick('Присмотр за детьми');
        out.cardFixTitle = __title();
        journeyDraftMenu57(tripDraft57(t));
        out.journey = __ready();
        out.journeySections = __sections();
        // Отложенная поездка: причина отпала — «Можно ехать», отъезд в начале месяца.
        nanny.alive = true;
        t.hold57 = { created: s.clock.ticks, reason: kidName + ': нужен присмотр на время поездки' };
        travelTripMenu52(t.id);
        out.held = __ready();
        out.heldNote = document.querySelector('#modal .ready272-note')?.textContent || '';
        out.holdKept = !!t.hold57;
        // Причина отъезда с «;» внутри — одной строкой, а не двумя.
        t.hold57 = null; t.leaveNeed = 1; t.employer = 'другой работодатель'; t.hours = 40;
        travelTripMenu52(t.id);
        out.leave = __ready();
        return out;
      }, r.kid);
      check(tag + ': запланированная поездка без помех — «Можно ехать» в карточке', r2.booked && r2.cardOk?.ok, { why: r2.why, ready: r2.cardOk });
      check(tag + ': карточка — присмотр пропал, причина наверху и кнопка ведёт к присмотру', r2.card && !r2.card.ok && r2.card.items.some(i => i.text.includes(r.kid)) && r2.cardFix && r2.cardFixTitle === 'С кем останутся дети', { card: r2.card, title: r2.cardFixTitle });
      check(tag + ': «Дорога и уход» — та же причина наверху, «Готовность» внизу убрана', r2.journey && r2.journey.items.some(i => i.text.includes(r.kid)) && !r2.journeySections.includes('Готовность'), { ready: r2.journey, sections: r2.journeySections });
      check(tag + ': отложенная поездка, причина отпала — «Можно ехать» и когда отъезд; отметка об ожидании не тронута', r2.held?.ok && /следующего месяца/.test(r2.heldNote) && r2.holdKept, { ready: r2.held, note: r2.heldNote });
      check(tag + ': причина отъезда с «;» внутри — одной строкой', r2.leave?.items?.length === 1 && /;/.test(r2.leave.items[0].text), r2.leave);
      check(tag + ': ошибок на странице нет', !P.errors.length, P.errors.slice(0, 3));
      await P.ctx.close();
    }

    // ---------- 6. Близкий, который уже присмотрел, снова соглашается и по одному ----------
    {
      const P = await page(browser);
      const r = await P.pg.evaluate(() => {
        __base(); __dogs(['Рекс', 'Белка']);
        const nina = __adult('Подруга', 40, 95, 'f');
        const real = Math.random, ask = () => { Math.random = () => 0.05; try { __click('^Питомцы и присмотр'); __click('^Рекс'); return __click('^Попросить · ' + nina.name); } finally { Math.random = real; } };
        travelDraftMenu52(__trip(0));
        const first = ask();
        __click('^Запланировать');
        const t = __lastTrip();
        const out = { first, mode1: t?.journey57?.pets?.find(q => q.pet === s.pets.find(p => p.name === 'Рекс').id)?.mode };
        cancelTravel52(t.id);
        travelDraftMenu52(__trip(1));
        out.second = ask();
        let got = null; __click('^Питомцы и присмотр'); const keep = journeyReturn57; journeyReturn57 = x => { got = x; }; __click('^Готово'); journeyReturn57 = keep;
        const plan = got?.journey57?.pets?.find(q => q.pet === s.pets.find(p => p.name === 'Рекс').id);
        out.mode2 = plan?.mode; out.agreed2 = careAgreement57(plan?.agreement)?.status || null;
        // Подсказка у питомца называет того, кто присматривает.
        if (got) journeyPetsMenu57(got);
        out.hint = got ? __opts().find(o => o.startsWith('Рекс')) || '' : '';
        out.nina = nina.name;
        return out;
      });
      check('первая поездка: близкий согласился за Рекса', r.first && r.mode1 === 'relative', r);
      check('новая поездка через месяц: тот же близкий снова соглашается (пауза только после отказа)', r.second && r.mode2 === 'relative' && r.agreed2 === 'agreed', r);
      check('в списке питомцев видно, кто присматривает', r.hint.includes(r.nina), r.hint);
      check('ошибок на странице нет (повторная просьба)', !P.errors.length, P.errors.slice(0, 3));
      await P.ctx.close();
    }

    // ---------- 7. Старое сохранение с запланированной поездкой ----------
    {
      const OLD = await page(browser, { mine: false });
      const before = await OLD.pg.evaluate(() => {
        Math.random = seeded269(7);
        __base(); __dogs();
        const nina = __adult('Подруга', 40, 95, 'f');
        travelDraftMenu52(__trip(0));
        const real = Math.random; Math.random = () => 0.05;
        __click('^Питомцы и присмотр'); __click('^Рекс'); __click('^Попросить · ' + nina.name);
        Math.random = real;
        __perPet([['Белка', 'Нанять ситтера'], ['Шарик', 'Взять с собой']]);
        const booked = __click('^Запланировать');
        const t = __lastTrip();
        flushSave264();
        const raw = JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] });
        const plans = JSON.stringify(t.journey57.pets), fee = t.fee, quote = JSON.stringify(t.journey57.quote);
        __watchHours();
        __month(1);
        return { raw, booked, plans, fee, quote, id: t.id, charged: __charged(t), status: t.status, hours: window.__hours ?? null };
      });
      await OLD.ctx.close();
      const NEW = await page(browser, { born: false, mine: !BASE });
      await birth(NEW, before.raw);
      const after = await NEW.pg.evaluate(id => {
        const t = travel52().trips.find(t => t.id === id);
        const out = { status: t?.status };
        out.plansLoaded = JSON.stringify(t.journey57.pets);
        travelTripMenu52(id);
        out.card = __ready();
        journeyDraftMenu57(tripDraft57(t));
        out.journey = __ready();
        travelDraftMenu52(__trip(1));
        out.plansAfterWindows = JSON.stringify(t.journey57.pets);
        out.fee = t.fee; out.quote = JSON.stringify(t.journey57.quote);
        __watchHours();
        __month(1);
        out.statusAfter = t.status; out.charged = __charged(t); out.hours = window.__hours ?? null;
        return out;
      }, before.id);
      check('старое сохранение: поездка запланирована без trips272', before.booked && before.status !== 'cancelled', before.status);
      check('старое сохранение: план питомцев после загрузки тот же', after.plansLoaded === before.plans, { before: before.plans, after: after.plansLoaded });
      check('старое сохранение: окна поездки план не меняют, цена и расчёт те же', after.plansAfterWindows === before.plans && after.fee === before.fee && after.quote === before.quote, { fee: [before.fee, after.fee] });
      check('старое сохранение: блок наверху есть в карточке и в «Дорога и уход»', !!after.card && !!after.journey, { card: after.card, journey: after.journey });
      check('старое сохранение: при отъезде списано столько же, часы ухода те же', after.charged === before.charged && after.charged > 0 && after.hours === before.hours, { before: [before.charged, before.hours], after: [after.charged, after.hours] });
      check('ошибок на странице нет (старое сохранение)', !NEW.errors.length, NEW.errors.slice(0, 3));
      await NEW.ctx.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`\n${pass} ok, ${fail} FAIL${BASE ? ' (BASE=1: без trips272.js)' : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
