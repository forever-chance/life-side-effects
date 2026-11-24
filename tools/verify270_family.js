// Проверки сборки 270, часть «семья» (family270.js): переезды с детьми, приглашение партнёра из другого города,
// починка сохранений, чужие питомцы в поездках, присмотр за детьми младше 12 лет.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify270_family.js
// Файлы сборки 270, которых ещё нет в index.html, подгружаются после начала жизни в порядке будущей сборки.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const ORDER = ['films269.js', 'display269.js', 'notices270.js', 'family270.js', 'social270.js', 'jobs270.js', 'strip270.js', 'texts270.js'];
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
// BASE=1 — прогон без family270.js: так видно, какие проверки ловят исходные баги.
const SKIP = new Set(process.env.BASE === '1' ? ['family270.js'] : []);

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
  for (const f of ORDER) {
    if (SKIP.has(f) || !fs.existsSync(path.join(ROOT, f)) || INDEX.includes('src="' + f)) continue;
    await pg.addScriptTag({ path: path.join(ROOT, f) });
    loaded.push(f);
  }
  await pg.evaluate(helpers);
  return { pg, errors, ctx, loaded };
}

// Помощники внутри страницы.
function helpers() {
  window.__modal = () => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '',
    text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join('\n'),
    buttons: [...document.querySelectorAll('#modal .options button, #modal > button')].map(b => (b.disabled ? '[x] ' : '') + b.textContent.replace(/\s+/g, ' ').trim()) });
  window.__click = src => { const re = new RegExp(src); const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); };
  window.__logs = (n = 12) => s.log.slice(0, n).map(l => (l.title || l[0] || '') + ' | ' + (l.text || l[1] || ''));
  window.__adult = (role, age, city, trust = 70, gender) => { const p = person(role, age, gender, s.country); p.city18 = city; s.people.push(p); enrichPerson(p); p.inner.trust = trust; p.inner.strain = 5; p.bond = Math.max(p.bond || 0, trust); return p; };
  window.__kid = (age, parents, city) => { const k = person('Ребенок', age); k.bond = 75; k.birth49 = { method: 'birth', parents }; k.parentId = parents.find(x => x !== 'player') || null; k.city18 = city || residenceCity(); s.people.push(k); enrichPerson(k); familyState27(); k.bio27.parents = parents.slice(); return k; };
  window.__base = (age = 40) => { s.age = age; s.cash = 5e6; s.clock.running = false; activateHome(); s.pending = []; if ($('#modal').open) closeModal(); };
  window.__cat = name => { const roll = shelterRoll38('cat'); placePet79({ ...roll, id: 't-' + name, kind: 'cat', name, sex38: 'f', months: 30 }, 'shelter', 0); return s.pets.find(p => p.name === name); };
  window.__trip = (i = 0, extra = {}) => ({ country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[i], days: 3, comfort: 'simple', companion: null, ...extra });
  window.__newTrip = before => travel52().trips.find(t => !before.includes(t.id));
  // Записи ленты после отметки: __since(__mark()).
  window.__mark = () => s.log[0];
  window.__since = m => { const i = m ? s.log.indexOf(m) : -1; return (i < 0 ? s.log.slice(0, 20) : s.log.slice(0, i)).map(l => (l.title || l[0] || '') + ' | ' + (l.text || l[1] || '')); };
  window.__esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Записи починки за всю жизнь.
  window.__repairs = () => s.log.filter(l => (l.title || l[0]) === 'Дети снова живут с вами').length;
}

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 600))); };

async function main() {
  const browser = await chromium.launch();
  try {

    // 1. Партнёр из другого города: «Пригласить к себе» не увозит игрока, дети остаются рядом.
    {
      const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'ru' });
      console.log('подгружено: ' + (loaded.join(', ') || 'ничего'));
      const r = await pg.evaluate(() => {
        __base(45);
        const list = cities[s.country], home = list[1], away = list[0], third = list[2];
        moveHome('rent', home, 'center');
        const p = __adult('Партнер', 44, residenceCity(), 80, 'f'); p.partnerSince = s.year - 15;
        const kids = [14, 9, 3].map(a => __kid(a, ['player', p.id]));
        s.housing.occupant = p.id; p.cohabit = true; ensureHome();
        __cat('Мурка');
        // Партнёр сам уехал в другой город (как план 'home' в autonomy55).
        p.city18 = away; p.cohabit = false; s.housing.occupant = null; ensureHome();
        const out = { home, away, before: residenceCity() };
        householdMenu();
        out.menu = __modal();
        out.partnerHint = [...document.querySelectorAll('#modal .options button')].find(b => b.textContent.includes(p.name))?.textContent || '';
        __click(p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' · Партнер');
        out.sub = __modal();
        __click('Пригласить переехать к себе');
        out.follow = __modal();
        closeModal();
        // То, что раньше делала кнопка «Пригласить к себе»: гость в аренде игрока.
        s.housing.occupant = p.id; p.cohabit = true;
        out.after = { city: residenceCity(), partner: p.city18, kids: kids.map(k => childLocal55(k)), tenure: currentHome59()?.tenure, pet: petAtHome183(s.pets[0]) };
        // «Быт и договорённости» для партнёра в другом городе.
        p.city18 = away; p.cohabit = false; s.housing.occupant = null; ensureHome();
        householdMenu54();
        out.deal = __modal(); closeModal();
        // Правильный путь: партнёр переезжает следом; ребёнок, который живёт с бывшим партнёром, остаётся с ним.
        const ex = __adult('Бывший партнер', 46, third, 50, 'm');
        const exKid = __kid(12, ['player', ex.id], third);
        const R = Math.random; Math.random = () => 0.01;
        let ok; try { ok = inviteFollow61(p.id, s.country, residenceCity()); } finally { Math.random = R; }
        const t = s.clock.tasks.find(t => t.kind === 'inviteMove' && t.personId === p.id);
        if (t) { t.progress = t.duration; finishTask(t); }
        out.followed = { ok, city: residenceCity(), partner: p.city18, cohabit: p.cohabit, exKid: exKid.city18, kids: kids.map(k => childLocal55(k)) };
        return out;
      });
      check('партнёр: список «С кем жить» говорит, что дети и ваши питомцы остаются с вами', /при любом переезде остаются с вами/.test(r.menu.text), r.menu);
      check('партнёр: у партнёра из другого города виден город', r.partnerHint.includes(r.away), r.partnerHint);
      check('партнёр: вместо мгновенного «Пригласить к себе» — «Пригласить переехать к себе»', r.sub.buttons.some(b => /^Пригласить переехать к себе/.test(b)) && !r.sub.buttons.some(b => /^(\[x\] )?Пригласить к себе$/.test(b)), r.sub);
      check('партнёр: приглашение ведёт в «Переезд с семьёй»', r.follow.title === 'Переезд с семьёй', r.follow);
      check('партнёр: гость в аренде не переносит игрока в свой город', r.after.city === r.home && r.before === r.home, r);
      check('партнёр: гость переезжает к игроку, дети остаются рядом', r.after.partner === r.home && r.after.kids.every(Boolean), r.after);
      check('партнёр: карточка дома — своя аренда, а не квартира гостя; кошка дома', r.after.tenure === 'rent' && r.after.pet === true, r.after);
      check('партнёр: «Быт и договорённости» объясняет другой город и зовёт переехать', r.deal.title === 'Быт и договорённости' && r.deal.text.includes(r.away) && r.deal.buttons.some(b => /Пригласить переехать к себе/.test(b)), r.deal);
      check('партнёр: переезд следом не меняет город игрока', r.followed.ok && r.followed.city === r.home && r.followed.partner === r.home && r.followed.cohabit, r.followed);
      check('партнёр: ребёнок, живущий со вторым родителем, не уезжает от него', r.followed.exKid !== r.home && r.followed.kids.every(Boolean), r.followed);
      check('партнёр: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 2. Переезды внутри страны забирают детей; партнёра не оставляют молча.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        __base(40);
        const list = cities[s.country];
        moveHome('rent', list[0], 'center');
        const p = __adult('Партнер', 41, residenceCity(), 75, 'f');
        const kids = [8, 4].map(a => __kid(a, ['player', p.id]));
        s.housing.occupant = p.id; p.cohabit = true; ensureHome();
        const cat = __cat('Мила');
        const out = { list };
        const offer = market41('rent', 'flat', list[2]).listings.find(q => validListing41(q, 'rent'));
        housingOfferDetails41(offer);
        out.confirm = __modal();
        __click('^Снять и переехать');
        out.rent = { city: residenceCity(), kids: kids.map(k => k.city18), local: kids.map(childLocal55), cat: petAtHome183(cat), partner: p.city18, cohabit: p.cohabit, logs: __logs(8) };
        // К другу в другой город.
        const mom = parents17()[0] || __adult('Мать', 66, list[1], 80, 'f'); mom.city18 = list[1]; mom.inner.trust = 80;
        const friend = __adult('Друг', 40, list[3], 70, 'm');
        for (const k of kids) delete k.lastMove;
        let m = __mark();
        moveHome('host', list[0], 'suburb', null, friend.id);
        ensureUX();
        out.host = { city: residenceCity(), kids: kids.map(k => k.city18), mom: mom.city18, logs: __since(m), last: kids.map(k => k.lastMove?.initiator || null) };
        // «Вернуться к родителям» внутри страны.
        returnParentsMenu();
        out.parentsMenu = __modal();
        m = __mark();
        __click(mom.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        out.parents = { city: residenceCity(), mode: s.housing.mode, kids: kids.map(k => k.city18), logs: __since(m) };
        // Аренда по объявлению в другом городе.
        const q = market41('rent', 'flat', list[0]).listings.find(q => validListing41(q, 'rent'));
        m = __mark();
        const ok = q && rentHouse41(q);
        out.listing = { ok, city: residenceCity(), kids: kids.map(k => k.city18), logs: __since(m) };
        // Временное жильё у близкого в другом городе.
        const host = __adult('Друг', 42, list[4], 80, 'f');
        const offer42 = { id: 'aid42-test', personId: host.id, kind: 'stay', country: s.country, personCountry: host.country, created: s.clock.ticks, expires: s.clock.ticks + 2,
          status: 'offered', lease: ensureLease40().id, months: 3, contribution: 0, movingHelp: 0, amount: 0 };
        housingState42().offers.push(offer42);
        aidOfferMenu42(offer42.id);
        out.stayMenu = __modal();
        m = __mark();
        __click('^Согласиться и переехать');
        out.stay = { city: residenceCity(), mode: s.housing.mode, kids: kids.map(k => k.city18), logs: __since(m) };
        out.repairs = __repairs();
        return out;
      });
      const moved = logs => logs.some(l => l.startsWith('Дети переехали с вами')) && !logs.some(l => l.startsWith('Дети снова живут с вами'));
      check('переезд: в окне аренды видно, что дети едут, а партнёр остаётся', r.confirm.buttons.some(b => /^Снять и переехать/.test(b) && /С вами переезжают дети/.test(b) && /остаётся по прежнему адресу/.test(b)), r.confirm);
      check('переезд: аренда в другом городе — дети переехали с вами', r.rent.city === r.list[2] && r.rent.kids.every(c => c === r.list[2]) && r.rent.local.every(Boolean), r.rent);
      check('переезд: ваша кошка переехала с вами', r.rent.cat === true, r.rent);
      check('переезд: в ленте записи о детях и о партнёре', r.rent.logs.some(l => l.startsWith('Дети переехали с вами')) && r.rent.logs.some(l => l.startsWith('Живёте раздельно')), r.rent.logs);
      check('переезд: партнёр остался в прежнем городе', r.rent.partner === r.list[0] && !r.rent.cohabit, r.rent);
      check('переезд: к другу в другой город — дети тоже', r.host.city === r.list[3] && r.host.kids.every(c => c === r.list[3]), r.host);
      check('переезд: вы живёте у друга — мама остаётся в своём городе', r.host.mom === r.list[1], r.host);
      check('переезд: «Вернуться к родителям» показывает, кто едет', /С вами переезжают дети/.test(r.parentsMenu.text), r.parentsMenu);
      check('переезд: к родителям в другой город — дети тоже', r.parents.city === r.list[1] && r.parents.mode === 'parents' && r.parents.kids.every(c => c === r.list[1]), r.parents);
      check('переезд: временное жильё у близкого — видно, кто едет, дети тоже', /С вами переезжают дети/.test(r.stayMenu.text) && r.stay.city === r.list[4] && r.stay.mode === 'host' && r.stay.kids.every(c => c === r.list[4]), r);
      check('переезд: аренда по объявлению — дети тоже', r.listing.ok && r.listing.city === r.list[0] && r.listing.kids.every(c => c === r.list[0]), r.listing);
      check('переезд: к другу (moveHome) — в ленте «Дети переехали с вами», отметка о переезде у детей', moved(r.host.logs) && r.host.last.every(x => x === 'family'), r.host);
      check('переезд: к родителям — в ленте «Дети переехали с вами»', moved(r.parents.logs), r.parents.logs);
      check('переезд: аренда по объявлению — в ленте «Дети переехали с вами»', moved(r.listing.logs), r.listing.logs);
      check('переезд: временное жильё — в ленте «Дети переехали с вами»', moved(r.stay.logs), r.stay.logs);
      check('переезд: ни одной записи починки «Дети снова живут с вами»', r.repairs === 0, r.repairs);
      check('переезд: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 3. Починка сохранений: игрок в городе партнёра при аренде в прежнем городе; дети в другом городе.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      const r = await pg.evaluate(() => {
        __base(45);
        const list = cities[s.country], home = list[1], away = list[0];
        moveHome('rent', home, 'center');
        ensureLease40();
        const p = __adult('Партнер', 44, away, 80, 'f');
        const kids = [12, 6].map(a => __kid(a, ['player', p.id], home));
        // Состояние сохранения 269: «Пригласить к себе» записало гостя, город игрока стал городом партнёра.
        s.housing.occupant = p.id; p.cohabit = true; s.housing.city = away; ensureLease40();
        delete s.family270;
        const broken = { city: s.housing.city, kids: kids.map(childLocal55) };
        ensureUX();
        const out = { home, away, broken, fixed: { city: residenceCity(), partner: p.city18, cohabit: p.cohabit, kids: kids.map(childLocal55), logs: __logs(6) } };
        // Дети в третьем городе без второго родителя — возвращаются; ребёнок со вторым родителем — нет.
        const stray = __kid(9, ['player'], list[2]);
        const ex = __adult('Бывший партнер', 47, list[3], 40, 'm');
        const withEx = __kid(10, ['player', ex.id], list[3]);
        // В игре — не сразу: адрес бывает пересчитан туда и обратно внутри месяца.
        ensureUX();
        out.sameMonth = stray.city18;
        __month(1); ensureUX();
        out.stray = { stray: stray.city18, withEx: withEx.city18, logs: __logs(4) };
        ensureUX();
        out.again = __logs(3);
        // Мгновенный скачок: ребёнок «отстал» и вернулся в том же месяце — записи нет, никто не переехал.
        const jump = __kid(7, ['player'], list[4]);
        ensureUX();
        jump.city18 = residenceCity();
        ensureUX();
        __month(1); ensureUX();
        out.jump = { city: jump.city18, repairs: __repairs(), pending: Object.keys(s.family270.stray || {}).length };
        // Сохранение 269 с брошенным ребёнком: при первой проверке — сразу.
        const saved = __kid(11, ['player'], list[4]);
        delete s.family270.strayChecked;
        ensureUX();
        out.saved = { city: saved.city18, logs: __logs(2) };
        return out;
      });
      check('починка: игрок возвращается в город своей аренды', r.broken.city === r.away && r.fixed.city === r.home, r);
      check('починка: партнёр живёт с игроком, дети снова рядом', r.fixed.partner === r.home && r.fixed.cohabit && r.fixed.kids.every(Boolean) && !r.broken.kids.some(Boolean), r);
      check('починка: запись в ленте об адресе', r.fixed.logs.some(l => l.startsWith('Снова дома')), r.fixed.logs);
      check('починка: в игре брошенный ребёнок возвращается через месяц с записью в ленте', r.sameMonth !== r.home && r.stray.stray === r.home && r.stray.logs.some(l => l.startsWith('Дети снова живут с вами')), r);
      check('починка: скачок адреса внутри месяца детей не двигает и записи не даёт', r.jump.city === r.home && r.jump.repairs === 1 && r.jump.pending === 0, r.jump);
      check('починка: сохранение с брошенным ребёнком чинится сразу', r.saved.city === r.home && r.saved.logs.some(l => l.startsWith('Дети снова живут с вами')), r.saved);
      check('починка: ребёнок со вторым родителем остаётся с ним', r.stray.withEx !== r.home, r.stray);
      check('починка: повторно не срабатывает', r.again.filter(l => l.startsWith('Дети снова живут с вами')).length <= 1, r.again);
      check('починка: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 4. Питомцы: собака мамы не едет, не стоит денег и не держит поездку.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        const mom = parents17()[0];
        for (const q of parents17()) q.privateCash = 0;
        mom.privateCash = c().cost * 2;
        const age0 = s.age; s.age = 17;
        const R = Math.random; Math.random = () => 0.01;
        let asked; try { asked = askParent67('dog'); } finally { Math.random = R; }
        s.age = age0; s.cash = 50000; s.clock.running = false; s.pending = []; if ($('#modal').open) closeModal();
        const dog = s.pets.find(p => p.kind === 'dog');
        const out = { asked, mode: s.housing.mode, keeper: dog && petHousehold183(dog).keeper === mom.id, atHome: dog && petAtHome183(dog), live: livePets57().map(p => p.id).includes(dog?.id) };
        let before = travel52().trips.map(t => t.id);
        const d = __trip(0);
        out.draftPets = journeyDraft57(d).journey57.pets.length;
        out.why = travelWhy52(d);
        out.booked = bookTravel52(d);
        let t = __newTrip(before);
        out.plan = { pets: t?.journey57?.pets?.length, extra: t?.journey57?.quote?.extra57, fee: t?.fee };
        // К отъезду родители перегружены — дома за собакой смотреть некому.
        for (const q of parents17()) q.inner.strain = 95;
        __month(2);
        out.trip = { status: t?.status, hold: t?.hold57?.reason || null };
        // Старая отложенная поездка, в плане которой уже лежит мамина собака.
        for (const q of parents17()) q.inner.strain = 5;
        before = travel52().trips.map(t => t.id);
        bookTravel52(__trip(1));
        t = __newTrip(before);
        if (t) { t.journey57.pets = [{ pet: dog.id, mode: 'household', helper: mom.id, auto59: true }]; for (const q of parents17()) q.inner.strain = 95; holdJourney57(t, dog.name + ': дома не остаётся доступного взрослого'); }
        out.heldBefore = !!t?.hold57;
        __month(2);
        out.held = { status: t?.status, hold: t?.hold57?.reason || null };
        // Своя кошка по-прежнему требует плана.
        const cat = __cat('Соня');
        out.catKeeper = petHousehold183(cat).keeper;
        out.catPlan = journeyDraft57(__trip(0)).journey57.pets.map(p => p.pet).includes(cat.id);
        out.dogPlan = journeyDraft57(__trip(0)).journey57.pets.map(p => p.pet).includes(dog.id);
        // Переезд за границу: мамина собака не в плане перевозки.
        out.movePlan = typeof petMovePlan183 === 'function' ? petMovePlan183({ country: 'nl' }, 'room', s.pets.filter(p => p.alive).map(p => p.id)).pets.map(p => p.id) : null;
        out.dogId = dog?.id; out.dogName = dog?.name;
        // Мама умерла, вы снимаете жильё отдельно в том же городе: её собака вашей не становится.
        __base(30);
        moveHome('rent', personCity62(mom), 'center');
        out.sepBefore = { live: livePets57().some(p => p.id === dog.id), atHome: petAtHome183(dog), city: residenceCity() === personCity62(mom) };
        mom.alive = false;
        out.sepAfter = { live: livePets57().some(p => p.id === dog.id), atHome: petAtHome183(dog), line: typeof familyMoveLine270 === 'function' ? familyMoveLine270() : '' };
        return out;
      });
      check('питомцы: подарок родителей — собака мамы, живёт дома', r.asked && r.keeper && r.atHome, r);
      check('питомцы: мамина собака не в плане поездки игрока', !r.live && r.draftPets === 0 && r.plan.pets === 0, r);
      check('питомцы: гостиница за мамину собаку не начисляется', (r.plan.extra || 0) === 0, r.plan);
      check('питомцы: поездка не блокируется маминой собакой', r.booked && !r.why.some(w => /питом|взросл/i.test(w)), r.why);
      check('питомцы: поездка уезжает, хотя родители перегружены', ['away', 'completed'].includes(r.trip.status) && !r.trip.hold, r.trip);
      check('питомцы: старая отложенная поездка с маминой собакой сама возвращается в план', r.heldBefore && ['away', 'completed'].includes(r.held.status) && !r.held.hold, r.held);
      check('питомцы: своя кошка по-прежнему в плане поездки, мамина собака — нет', r.catKeeper === 'player' && r.catPlan && !r.dogPlan, r);
      check('питомцы: мамина собака не в плане переезда за границу', !r.movePlan || !r.movePlan.includes(r.dogId), r.movePlan);
      check('питомцы: собака умершей мамы не становится вашей (живёте отдельно в том же городе)', r.sepBefore.city && !r.sepBefore.live && !r.sepAfter.live && !r.sepAfter.atHome && !r.sepAfter.line.includes(r.dogName), r);
      check('питомцы: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 5. Дети младше 12 лет и поездки: одно правило.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        __base(35);
        const list = cities[s.country];
        moveHome('rent', list[0], 'center');
        for (const q of parents17()) { q.age = 62; q.city18 = list[3]; q.inner.trust = 80; q.inner.strain = 5; }
        const kids = [5, 10].map(a => __kid(a, ['player']));
        const mom = parents17()[0] || __adult('Мать', 62, list[3], 80, 'f');
        const out = {};
        // «Отпуск дома» не требует присмотра.
        out.stay = travelWhy52({ country: s.country, city: residenceCity(), days: 7, comfort: 'standard', stayHome86: true, party53: [], pay53: 'all' });
        // Обычная поездка без договорённости — нужен присмотр.
        const d = __trip(0);
        out.noCare = travelWhy52(d);
        // Родитель-одиночка договаривается с бабушкой, которая живёт в том же городе.
        mom.city18 = residenceCity();
        const R = Math.random; Math.random = () => 0.01;
        try {
          travelDraftMenu52(d);
          for (const k of kids) { __click('^Присмотр за детьми'); __click('^' + k.name + '$|^' + k.name); __click('^' + mom.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' · ' + mom.role); }
        } finally { Math.random = R; }
        out.draft = __modal();
        const before = travel52().trips.map(t => t.id);
        out.planned = __click('^Запланировать поездку');
        const t = __newTrip(before);
        out.care = t && Object.values(t.childcare86 || {}).map(a => a.status);
        __month(2);
        out.trip = { status: t?.status, hold: t?.hold57?.reason || null, reason: t?.reason || null };
        return out;
      });
      check('дети: «Отпуск дома» не требует присмотра', !r.stay.some(w => /присмотр/i.test(w)), r.stay);
      check('дети: без договорённости поездка ждёт присмотра', r.noCare.some(w => /присмотр/i.test(w)), r.noCare);
      check('дети: после договорённости с бабушкой поездку можно запланировать', r.planned && r.care?.length === 2 && r.care.every(x => x === 'accepted'), r);
      check('дети: родитель-одиночка уезжает после договорённости', ['away', 'completed'].includes(r.trip.status) && !r.trip.hold, r.trip);
      check('дети: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 6. Няня по договору не зацикливает поездку; няня на время поездки оплачивается при отъезде.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        __base(35);
        const list = cities[s.country];
        moveHome('rent', list[0], 'center');
        for (const q of parents17()) { q.age = 62; q.city18 = list[3]; }
        const kids = [5, 10].map(a => __kid(a, ['player']));
        const out = {};
        out.hired = kids.map(k => hireNanny54(k.id, 12));
        for (const n of family54().nannies) { const q = living(n.person); if (q) q.inner.trust = 40; }
        let before = travel52().trips.map(t => t.id);
        const d = __trip(0);
        out.why = travelWhy52(d);
        out.booked = bookTravel52(d);
        let t = __newTrip(before);
        const states = [];
        for (let i = 0; i < 4; i++) { __month(1); states.push(t?.status + (t?.hold57 ? ':hold' : '')); }
        out.contract = { states, departure: t?.departure, now: s.clock.ticks };
        // Няня на время поездки: договоры закончились, договорились через меню.
        for (const n of family54().nannies) n.status = 'ended';
        const d2 = __trip(1);
        out.why2 = travelWhy52(d2);
        travelDraftMenu52(d2);
        __click('^Присмотр за детьми');
        out.careMenu = __modal();
        __click('^Няня для всех');
        out.afterSitter = __modal();
        before = travel52().trips.map(t => t.id);
        const cash0 = s.cash;
        out.planned = __click('^Запланировать поездку');
        t = __newTrip(before);
        __month(2);
        out.sitter = { status: t?.status, hold: t?.hold57?.reason || null, paid: t?.sitterPaid270 || 0, fee: t && typeof familySitterFee270 === 'function' ? familySitterFee270(tripDraft57(t)) : 0, spent: cash0 - s.cash };
        return out;
      });
      check('няня: договор с няней закрывает присмотр', r.hired.every(Boolean) && r.booked && !r.why.some(w => /присмотр/i.test(w)), r);
      check('няня: поездка с няней по договору уезжает и не откладывается каждый месяц', r.contract.states.some(x => /^(away|completed)$/.test(x)) && !r.contract.states.some(x => /hold/.test(x)), r.contract);
      check('няня: без няни поездка ждёт присмотра', r.why2.some(w => /присмотр/i.test(w)), r.why2);
      check('няня: в меню присмотра есть няня на время поездки с ценой', r.careMenu.buttons.some(b => /^Няня для всех детей/.test(b) && /\d/.test(b)), r.careMenu);
      check('няня: с няней на время поездки можно запланировать', !!r.planned, r.afterSitter);
      check('няня: поездка уехала, няня оплачена при отъезде', ['away', 'completed'].includes(r.sitter.status) && r.sitter.paid > 0 && r.sitter.paid === r.sitter.fee, r.sitter);
      check('няня: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 7. Партнёр дома, отложенная поездка, лагерь.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        __base(36);
        const list = cities[s.country];
        moveHome('rent', list[0], 'center');
        for (const q of parents17()) { q.age = 62; q.city18 = list[3]; }
        const p = __adult('Партнер', 37, residenceCity(), 70, 'm');
        s.housing.occupant = p.id; p.cohabit = true; ensureHome();
        const kids = [7, 10].map(a => __kid(a, ['player', p.id]));
        const out = {};
        // Партнёр дома: просить отдельно не нужно.
        out.withPartner = travelWhy52(__trip(0));
        out.care86 = childcareWhy86(__trip(0));
        // Партнёр едет с вами — нужен присмотр; договорились с другом, друг потом уехал — поездка ждёт; няня — уезжает.
        const friend = __adult('Друг', 36, residenceCity(), 80, 'f'); friend.bond = 80;
        const d = __trip(0, { party53: [p.id], pay53: 'all' });
        out.partyWhy = travelWhy52(d);
        const care = {}; for (const k of kids) care[k.id] = { helper: friend.id, status: 'accepted', tick: s.clock.ticks, until: s.clock.ticks + 2 };
        const d2 = { ...d, childcare86: care };
        out.partyWhy2 = travelWhy52(d2);
        let before = travel52().trips.map(t => t.id);
        out.booked = bookTravel52(d2);
        const t = __newTrip(before);
        friend.city18 = list[2];
        __month(1);
        out.held = { status: t?.status, hold: t?.hold57?.reason || null };
        friend.city18 = residenceCity();
        __month(1);
        out.released = { status: t?.status, hold: t?.hold57?.reason || null, logs: __logs(12).filter(l => /Поездка снова по плану/.test(l)) };
        // Лагерь с проживанием в месяц поездки закрывает присмотр.
        p.cohabit = false; s.housing.occupant = null; p.city18 = list[2]; ensureHome();
        const dep = departureMin86(__trip(1));
        for (const k of kids) family54().camps.push({ id: 'camp-' + k.id, child: k.id, kind: 'domestic', country: s.country, home: s.country, city: residenceCity(), fee: 0, status: 'planned', departure: dep, roll: .5 });
        out.camp = travelWhy52({ ...__trip(1), departure86: dep });
        out.campLater = travelWhy52({ ...__trip(1), departure86: dep + 3 });
        return out;
      });
      check('семья: партнёр дома — присмотр не нужен и отдельно просить не надо', !r.withPartner.some(w => /присмотр/i.test(w)) && r.care86 === '', r);
      check('семья: партнёр едет с вами — нужен присмотр', r.partyWhy.some(w => /присмотр/i.test(w)), r.partyWhy);
      check('семья: договорённость с другом закрывает присмотр', !r.partyWhy2.some(w => /присмотр/i.test(w)) && r.booked, r);
      check('семья: друг уехал — поездка откладывается, а не отменяется', r.held.status === 'planned' && /присмотр/.test(r.held.hold || ''), r.held);
      check('семья: друг вернулся — отложенная поездка сама уезжает', ['away', 'completed'].includes(r.released.status) && !r.released.hold && r.released.logs.length > 0, r.released);
      check('семья: лагерь с проживанием в месяц поездки закрывает присмотр', !r.camp.some(w => /присмотр/i.test(w)), r.camp);
      check('семья: лагерь в другой месяц присмотр не закрывает', r.campLater.some(w => /присмотр/i.test(w)), r.campLater);
      check('семья: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 8. Случайная игра со всеми файлами: обёртки не падают при переездах, поездках и событиях.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      await pg.addScriptTag({ path: path.join(ROOT, 'tools', 'harness.js') });
      await pg.evaluate(() => {
        __base(30); s.cash = 3e5;
        moveHome('rent', residenceCity(), 'center');
        const p = __adult('Партнер', 31, residenceCity(), 70, 'f');
        s.housing.occupant = p.id; p.cohabit = true; ensureHome();
        [6, 3].map(a => __kid(a, ['player', p.id])); __cat('Ночка');
      });
      const issues = [];
      for (let i = 0; i < 30; i++) {
        const st = await pg.evaluate(() => __H.run(6, 0.35));
        issues.push(...(await pg.evaluate(() => __H.dump().issues)));
        if (st.dead) break;
      }
      const ours = [...issues.filter(x => x.kind === 'exception').map(x => x.detail), ...errors].filter(x => /family270|familyCare|familyMove|familyRepair|familyPet|familyHousehold/.test(x));
      const state = await pg.evaluate(() => ({ age: s.age, kids: ownChildren55().length, repairs: __repairs(),
        moves: s.log.filter(l => (l.title || l[0]) === 'Дети переехали с вами').length }));
      console.log('случайная игра: до ' + state.age + ' лет, исключений всего ' + issues.filter(x => x.kind === 'exception').length + ', ошибок страницы ' + errors.length +
        ', записей «Дети переехали с вами» ' + state.moves);
      check('случайная игра: обёртки family270 не падают', !ours.length, ours.slice(0, 3));
      // Починка в ensureUX молчит, пока переезды сами забирают детей: запись «Дети снова живут с вами» в игре — признак
      // пути, который оставил детей в старом городе.
      check('случайная игра: ни одной записи починки «Дети снова живут с вами»', state.repairs === 0, state);
      await ctx.close();
    }

    // 9. Переезды через окна игры: запись в ленте, отметка у детей, тексты подтверждений.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      const r = await pg.evaluate(() => {
        __base(40);
        const list = cities[s.country];
        moveHome('rent', list[1], 'center');
        for (const q of parents17()) { q.age = 66; q.city18 = list[4]; q.inner.trust = 80; }
        const out = { list };
        // «Пригласить к себе» местного друга: город не меняется, город назван в записи.
        const friend = __adult('Друг', 40, residenceCity(), 80, 'f');
        householdMenu();
        __click(__esc(friend.name) + ' · Друг');
        out.localSub = __modal();
        let m = __mark();
        __click('^Пригласить к себе$');
        out.local = { city: residenceCity(), occupant: s.housing.occupant === friend.id, fcity: friend.city18, logs: __since(m) };
        s.housing.occupant = null; friend.cohabit = false; ensureHome();
        // Только питомец, детей нет: подтверждение без «тоже».
        const cat = __cat('Буся');
        const offer = market41('rent', 'flat', list[2]).listings.find(q => validListing41(q, 'rent'));
        housingOfferDetails41(offer);
        out.petOnly = __modal(); closeModal();
        // moveHome('rent', другой город) с двумя детьми: «Дети переехали с вами», а не починка.
        const p = __adult('Партнер', 41, list[0], 80, 'm');
        const kids = [8, 3].map(a => __kid(a, ['player', p.id]));
        m = __mark();
        moveHome('rent', list[2], 'center');
        out.rent = { city: residenceCity(), kids: kids.map(k => k.city18), last: kids.map(k => k.lastMove?.initiator || null), logs: __since(m) };
        // Через «С кем жить»: «Переехать к этому человеку» — партнёр в другом городе.
        for (const k of kids) delete k.lastMove;
        householdMenu();
        __click(__esc(p.name) + ' · Партнер');
        out.sub = __modal();
        m = __mark();
        __click('^Переехать к этому человеку');
        out.toPartner = { city: residenceCity(), pcity: personCity62(p), mode: s.housing.mode, kids: kids.map(k => k.city18), last: kids.map(k => k.lastMove?.initiator || null), cat: petAtHome183(cat), logs: __since(m) };
        ensureUX();
        // Переезд по пути (relocation68) внутри страны: строка о питомцах есть; переезд завершается с записью о детях.
        const mom = parents17()[0];
        out.momCity = mom && personCity62(mom);
        if (mom) {
          moveConfirm68('family', mom.id, 'room');
          out.pathConfirm = __modal();
          m = __mark();
          out.pathQueued = __click('^Запланировать переезд');
          __month(2);
          out.path = { city: residenceCity(), kids: kids.map(k => k.city18), logs: __since(m).filter(l => /^(Дети|Переезд|Живёте)/.test(l)) };
        }
        // Переезд за границу: питомцы выбираются отдельно, строки о них в подтверждении нет, дети — есть.
        s.citizenships = [...new Set([...(s.citizenships || []), 'nl'])];
        moveConfirm68('return', 'nl', 'room', null, [cat.id]);
        out.abroadConfirm = __modal(); closeModal();
        // Переезд в другую страну к близкому (relocateWithFamily): дети в городе игрока, запись о переезде.
        cat.alive = false;
        const aunt = __adult('Тетя', 50, cities.nl[1], 80, 'f'); aunt.country = 'nl'; aunt.city18 = cities.nl[1];
        m = __mark();
        out.relocated = relocateWithFamily('nl', aunt.id, 0);
        ensureUX();
        out.abroad = { country: s.country, city: residenceCity(), kids: kids.map(k => [k.country, k.city18]), logs: __since(m) };
        out.repairs = __repairs();
        return out;
      });
      const moved = logs => logs.some(l => l.startsWith('Дети переехали с вами')) && !logs.some(l => l.startsWith('Дети снова живут с вами'));
      check('окна: «Пригласить к себе» местного друга — город прежний, город назван в записи', r.local.occupant && r.local.city === r.list[1] && r.local.fcity === r.list[1] && r.local.logs.some(l => l.includes('Ещё один комплект ключей') && l.includes(r.list[1])), r.local);
      check('окна: только питомец — «С вами переезжает ваш питомец: Буся.», без «тоже»', r.petOnly.buttons.some(b => /С вами переезжает ваш питомец: Буся\./.test(b)) && !r.petOnly.buttons.some(b => /тоже/.test(b)), r.petOnly);
      check('окна: moveHome в другой город — «Дети переехали с вами», отметка у детей', r.rent.city === r.list[2] && r.rent.kids.every(c => c === r.list[2]) && moved(r.rent.logs) && r.rent.last.every(x => x === 'family'), r.rent);
      check('окна: «Обсудить совместную жизнь» — дети и питомец одной фразой', /Если переедете вы, с вами переезжают дети: [^.]+; ваш питомец тоже: Буся\./.test(r.sub.text), r.sub);
      check('окна: «Переехать к этому человеку» — вы, дети и кошка у партнёра', r.toPartner.city === r.list[0] && r.toPartner.mode === 'host' && r.toPartner.kids.every(c => c === r.list[0]) && r.toPartner.cat === true, r.toPartner);
      check('окна: «Переехать к этому человеку» — «Дети переехали с вами», отметка у детей', moved(r.toPartner.logs) && r.toPartner.last.every(x => x === 'family'), r.toPartner.logs);
      check('окна: переезд по пути внутри страны — в подтверждении дети и питомец', /С вами переезжают дети: [^.]+; ваш питомец тоже: Буся\./.test(r.pathConfirm?.text || ''), r.pathConfirm);
      check('окна: переезд по пути внутри страны — дети переехали, запись в ленте', r.pathQueued && r.path.city === r.momCity && r.path.kids.every(c => c === r.momCity) && moved(r.path.logs), r.path);
      check('окна: переезд за границу — в подтверждении дети, без строки о питомцах', /С вами переезжают дети/.test(r.abroadConfirm.text) && !/питом[а-я]* тоже|ваш питомец|ваши питомцы/.test(r.abroadConfirm.text), r.abroadConfirm);
      check('окна: переезд в другую страну — дети в вашем городе, запись в ленте', r.relocated && r.abroad.country === 'nl' && r.abroad.kids.every(([c, city]) => c === 'nl' && city === r.abroad.city) && moved(r.abroad.logs), r.abroad);
      check('окна: ни одной записи починки «Дети снова живут с вами»', r.repairs === 0, r.repairs);
      check('окна: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 10. Поездки с детьми: командировка, лагерь в месяц отъезда, договорённость после переноса даты.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        __base(36);
        const list = cities[s.country];
        moveHome('rent', list[0], 'center');
        for (const q of parents17()) { q.age = 62; q.city18 = list[3]; q.inner.trust = 80; q.inner.strain = 5; }
        const p = __adult('Партнер', 37, residenceCity(), 70, 'm');
        s.housing.occupant = p.id; p.cohabit = true; ensureHome();
        const kids = [5, 9].map(a => __kid(a, ['player', p.id]));
        const out = {};
        // Командировка по-настоящему: работа в компании, предложение, согласие.
        const prof = professions16.find(p => p.field === 'computing');
        s.job = { title: prof.name || 'Разработчик', employer: 'Контур', professionId: prof.id, salary: c().wage, tenure: 1, format: 'office', language: country16[s.country][0], allowedCountries: [s.country], workplace: { country: s.country, city: residenceCity(), area: 'center' } };
        const co = company18(); co.months = 12; co.budget = Math.max(co.budget || 0, 1e6);
        const offer = () => { const R = Math.random; Math.random = () => 0.5; try { const q = offerBusiness54(); if (q) { q.country = s.country; q.city = list[2]; } return q; } finally { Math.random = R; } };
        let q = offer();
        out.offer = !!q && respondBusiness54(q.id, true);
        let t = travel52().trips.find(x => x.business54 === q?.id);
        __month(2);
        out.withPartner = { status: t?.status, hold: t?.hold57?.reason || null, reason: t?.reason || null };
        // Родитель-одиночка: командировка ждёт присмотра, после няни уезжает, няня оплачена.
        p.cohabit = false; s.housing.occupant = null; p.city18 = list[3]; ensureHome();
        events54().lastBusiness = -99; for (const b of events54().business) if (['offered', 'accepted'].includes(b.status)) b.status = 'done';
        q = offer();
        out.offer2 = !!q && respondBusiness54(q.id, true);
        t = travel52().trips.find(x => x.business54 === q?.id);
        __month(1);
        out.single1 = { status: t?.status, hold: t?.hold57?.reason || null };
        if (t?.status === 'planned') { childcareMenu86(tripDraft57(t)); out.sitterClick = __click('^Няня для всех'); }
        __month(1);
        out.single2 = { status: t?.status, hold: t?.hold57?.reason || null, paid: t?.sitterPaid270 || 0 };
        s.job = null;
        // Лагерь с проживанием: смена и поездка в один месяц — поездка уезжает в месяц отъезда.
        kids[0].age = 7;
        const R = Math.random; Math.random = () => 0.5;
        try { out.campBooked = kids.map(k => bookCamp54(k.id, 'domestic', s.country)); } finally { Math.random = R; }
        const dep = family54().camps.find(c => c.child === kids[0].id && c.status === 'planned')?.departure;
        let before = travel52().trips.map(x => x.id);
        out.campWhy = travelWhy52({ ...__trip(0), departure86: dep });
        out.campTrip = bookTravel52({ ...__trip(0), departure86: dep });
        t = __newTrip(before);
        out.campDep = { trip: t?.departure, camp: dep };
        __month(1);
        out.camp = { status: t?.status, hold: t?.hold57?.reason || null, departed: t?.departed, camps: family54().camps.filter(c => kids.some(k => k.id === c.child)).map(c => c.status) };
        __month(2);
        // Договорённость с бабушкой сохраняется, если дату поездки перенесли.
        const mom = parents17()[0];
        mom.city18 = residenceCity(); mom.inner.strain = 5;
        const d = __trip(1);
        const R2 = Math.random; Math.random = () => 0.01;
        try { travelDraftMenu52(d); for (const k of kids) { __click('^Присмотр за детьми'); __click('^' + __esc(k.name)); __click('^' + __esc(mom.name) + ' · '); } } finally { Math.random = R2; }
        before = travel52().trips.map(x => x.id);
        out.planned = __click('^Запланировать поездку');
        t = __newTrip(before);
        returnTravel86({ ...tripDraft57(t), departure86: s.clock.ticks + 4 }); closeModal();
        out.moved = { dep: t?.departure, now: s.clock.ticks };
        __month(2);
        out.early = t?.status;
        __month(4);
        out.later = { status: t?.status, hold: t?.hold57?.reason || null };
        return out;
      });
      check('поездки: командировка, партнёр дома — уехала без присмотра', r.offer && ['away', 'completed'].includes(r.withPartner.status) && !r.withPartner.hold, r.withPartner);
      check('поездки: командировка родителя-одиночки ждёт присмотра', r.offer2 && r.single1.status === 'planned' && /присмотр/.test(r.single1.hold || ''), r.single1);
      check('поездки: после «Няня для всех детей» командировка уехала, няня оплачена', r.sitterClick && ['away', 'completed'].includes(r.single2.status) && r.single2.paid > 0, r.single2);
      check('поездки: лагерь в месяц отъезда — поездку можно запланировать', r.campBooked.every(Boolean) && !r.campWhy.some(w => /присмотр/i.test(w)) && r.campTrip && r.campDep.trip === r.campDep.camp, r);
      check('поездки: лагерь — поездка уезжает в месяц отъезда, дети в лагере', ['away', 'completed'].includes(r.camp.status) && !r.camp.hold && r.camp.camps.every(x => ['away', 'completed'].includes(x)), r.camp);
      check('поездки: договорённость с бабушкой после переноса даты — поездка ждёт новую дату и уезжает', r.planned && r.moved.dep === r.moved.now + 4 && r.early === 'planned' && ['away', 'completed'].includes(r.later.status) && !r.later.hold, r);
      check('поездки: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\nИтого: ${results.length - failed.length} из ${results.length} проверок прошли` + (failed.length ? `, не прошли: ${failed.length}` : ''));
  process.exit(failed.length ? 1 : 0);
}

module.exports = { page, ROOT };
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
