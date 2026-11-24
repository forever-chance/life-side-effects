// Проверки сборки 270, часть social270.js: свадьбы близких, приглашения из другого города, встречи по городу,
// лагерь и поездка, хозяин под стражей или в больнице, разговор «сейчас», переработка, часы своего дела.
// Игра раздаётся с диска:  node tools/verify270_social.js
// После старта жизни подгружаются файлы 270, которых ещё нет в index.html, в порядке финальной сборки.
const fs = require('fs'), path = require('path');
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
  window.T = {
    mk(role, age, opts = {}) {
      const p = person(role, age, opts.gender || pick(['f', 'm']), opts.country || s.country);
      p.city18 = opts.city || residenceCity();
      enrichPerson(p); s.people.push(p);
      if (opts.bond != null) { p.bond = opts.bond; p.inner.affection = opts.bond; }
      if (opts.trust != null) p.inner.trust = opts.trust;
      if (opts.strain != null) p.inner.strain = opts.strain;
      if (opts.cash != null) p.privateCash = opts.cash;
      p.lastBond = p.bond;
      return p;
    },
    pair(p, months) {
      const q = person('Партнёр близкого', Math.max(20, p.age), p.gender === 'f' ? 'm' : 'f', p.country);
      q.background55 = true; q.city18 = p.city18; enrichPerson(q); s.people.push(q);
      const a = adultState55(p); a.partner = q.id; a.pairedAt = s.clock.ticks - months; a.nextReview = s.clock.ticks + 999; a.plan = null;
      adultState55(q).partner = p.id; adultState55(q).nextReview = s.clock.ticks + 999;
      return q;
    },
    quiet() { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; },
    month(n = 1) { for (let i = 0; i < n; i++) { T.quiet(); advanceMonth(); T.quiet(); } },
    otherCity() { return cities[s.country].find(c => c !== residenceCity()); },
    modal() {
      return { open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join('\n'),
        buttons: [...document.querySelectorAll('#modal .options button')].map(b => ({ t: b.textContent.replace(/\s+/g, ' ').trim(), off: b.disabled })) };
    },
    click(re) { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; },
  };
}

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 500))); };

(async () => {
  const browser = await chromium.launch();
  try {
    // а) Свадьбы близких.
    {
      const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'de' });
      console.log('подгружены: ' + loaded.join(', '));
      const r = await pg.evaluate(() => {
        s.age = 30; s.cash = 1e7; s.illness = null; const out = {};
        const z = events54(); z.invitations = []; z.lastOffer = -100;
        // Друг без партнёра: свадьбы нет ни через приглашение, ни через планировщик.
        const lone = T.mk('Друг', 30, { bond: 80, trust: 70, strain: 5 });
        out.loneEligible = weddingEligible132(lone); out.loneOffer = !!offerOccasion54(lone, 'wedding');
        // Старое сохранение: «женат ни на ком».
        const ghost = T.mk('Друг', 35, { bond: 60 }); ghost.npcMarried54 = true; ghost.unavailable18 = true;
        // Сестра с партнёром 13 месяцев; вам 14 — позвать вас нельзя, свадьба всё равно будет.
        s.age = 14;
        const sis = T.mk('Сестра', 27, { gender: 'f', bond: 70 }), sp = T.pair(sis, 13);
        out.sisEligible = weddingEligible132(sis);
        const w = planWeddingSoc270(sis); out.planned = !!w; out.invite = w && w.invite;
        s.age = 30;
        T.month(1);
        out.ghostCleared = !ghost.npcMarried54 && !ghost.unavailable18;
        for (let i = 0; i < 6 && !sis.npcMarried54; i++) T.month(1);
        out.married = sis.npcMarried54 && sp.npcMarried54 && sis.marriage270?.spouse === sp.id && sp.marriage270?.via === sis.id;
        out.union = !!s.family27.unions.find(u => u.married270 && [u.a, u.b].includes(sis.id) && [u.a, u.b].includes(sp.id));
        out.edge = treeGraph90().edges.find(e => [e.a, e.b].includes(sis.id) && [e.a, e.b].includes(sp.id))?.kind;
        const e = s.log.find(e => e.title === 'Свадьба · ' + sis.name); out.logText = e?.text || null;
        const card = personSections42(sp); out.cardTie = card.find(x => x.title === 'О человеке')?.rows.find(r => r.label === 'Родство')?.value || null;
        // Вдовство: супруг умер — отметка снимается, можно снова жениться.
        sp.alive = false; T.month(1);
        out.widowCleared = !sis.npcMarried54 && !sis.unavailable18 && !!sis.widowed270;
        const sp2 = T.pair(sis, 13); out.widowAgain = weddingEligible132(sis);
        // Приглашение на свадьбу друга: брак не пишется через месяц после рассылки, а после праздника.
        z.invitations = []; z.lastOffer = -100;
        const fr = T.mk('Друг', 31, { bond: 75, trust: 70, strain: 5 }), fp = T.pair(fr, 14);
        const w2 = planWeddingSoc270(fr), q = w2 && z.invitations.find(q => q.id === w2.invite);
        out.inviteLinked = !!q && q.local && q.wedding270 === w2.id;
        out.accepted = q ? respondOccasion54(q.id, true) : false;
        T.month(1); out.notYet = !fr.npcMarried54;
        for (let i = 0; i < 6 && !fr.npcMarried54; i++) T.month(1);
        out.friendMarried = fr.npcMarried54 && fp.npcMarried54 && fr.marriage270?.spouse === fp.id;
        out.guest = s.log.find(e => e.title === 'Свадьба · ' + fr.name)?.text || null;
        out.qStatus = q?.status;
        return out;
      });
      check('свадьба: друг без партнёра не женится', r.loneEligible === false && r.loneOffer === false, r);
      check('свадьба: «женат ни на ком» из старого сохранения снимается', r.ghostCleared, r);
      check('свадьба: сестра с партнёром — свадьба в плане, приглашения нет (вам 14)', r.sisEligible && r.planned && !r.invite, r);
      check('свадьба: брак записан обоим, супругу — родство', r.married, r);
      check('свадьба: у родственника союз, в древе «Брак»', r.union && r.edge === 'married', r);
      check('свадьба: запись в ленте с родством через роль', r.logText && /поженились/.test(r.logText) && /теперь (муж|жена) сестры/.test(r.logText), r.logText);
      check('свадьба: карточка супруга — «Муж/Жена сестры — имя»', r.cardTie && /^(Муж|Жена) сестры — /.test(r.cardTie), r.cardTie);
      check('свадьба: вдовство снимает отметку о браке', r.widowCleared && r.widowAgain, r);
      check('свадьба: приглашение связано со свадьбой и принято', r.inviteLinked && r.accepted, r);
      check('свадьба: брак не пишется через месяц после рассылки', r.notYet, r);
      check('свадьба: после праздника — брак и «Вы были среди гостей»', r.friendMarried && /среди гостей/.test(r.guest || ''), r);
      check('свадьба: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // б) Приглашение из другого города: есть кнопки, хозяин не попутчик, отказ без последствий.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; s.cash = 1e7; s.job = null; s.illness = null; const out = {};
        const z = events54(); z.invitations = []; z.lastOffer = -100; familyTravel53().invitations = [];
        // Сестра в другом городе: близость 85, доверие 30 — hostEligible53 её не пропускал.
        const sis = T.mk('Сестра', 34, { gender: 'f', bond: 85, trust: 30, strain: 10, cash: 1e6, city: T.otherCity() });
        out.oldHost = socialFix270Base.hostEligible53(sis);
        const q = offerOccasion54(sis, 'birthday', true);
        const inv = q && invite53(q.travelInvite);
        out.created = !!inv && !q.local;
        out.available = !!inv && invitationAvailable53(inv);
        out.hostInParty = inv?.draft.party53.includes(sis.id);
        out.charges = inv && Object.keys(inv.quote.charges);
        travelInviteMenu53(inv.id); out.menu = T.modal();
        const before = { bond: sis.bond, trust: sis.inner.trust, strain: sis.inner.strain };
        out.declined = T.click(/Отказаться/);
        out.invStatus = inv.status;
        T.month(1);
        out.qStatus = q.status;
        out.relSame = sis.bond === before.bond && sis.inner.trust === before.trust && sis.inner.strain === before.strain;
        // Брат в другом городе: принять и съездить; хозяину — воспоминание.
        z.lastOffer = -100;
        const bro = T.mk('Брат', 36, { gender: 'm', bond: 80, trust: 35, strain: 10, cash: 1e6, city: T.otherCity() });
        const q2 = offerOccasion54(bro, 'housewarming', true), inv2 = q2 && invite53(q2.travelInvite);
        out.why2 = inv2 ? travelWhy52({ ...inv2.draft, invite53: inv2.id }) : ['нет приглашения'];
        out.accept2 = inv2 ? respondTravel53(inv2.id, true) : false;
        for (let i = 0; i < 4 && q2 && q2.status !== 'completed'; i++) T.month(1);
        out.q2Status = q2?.status;
        out.hostMemory = (bro.memories || []).some(m => /побывали вместе/.test(m));
        return out;
      });
      check('приглашение: старая проверка не пускала сестру', r.oldHost === false, r);
      check('приглашение: из другого города создано и доступно', r.created && r.available, r);
      check('приглашение: хозяин — принимающая сторона, не попутчик', r.hostInParty === false, r);
      check('приглашение: в окне есть «Согласиться» и «Отказаться»', r.menu.buttons.some(b => /Согласиться/.test(b.t)) && r.menu.buttons.some(b => /Отказаться/.test(b.t) && !b.off), r.menu);
      check('приглашение: отказ записан, через месяц не «Отменено»', r.declined && r.invStatus === 'declined' && r.qStatus === 'declined', r);
      check('приглашение: отказ не меняет отношений', r.relSame, r);
      check('приглашение: согласие на поездку проходит', r.accept2 === true, r.why2);
      check('приглашение: поездка состоялась, хозяину — воспоминание', r.q2Status === 'completed' && r.hostMemory, r);
      check('приглашение: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // в) Встречи знакомых — по городу, а не по стране.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; const out = {}, x = social49();
        const reset = () => { x.invitations = []; x.lastOffer = -100; };
        const far = T.mk('Друг', 30, { bond: 70, trust: 60, strain: 5, city: T.otherCity() });
        const near = T.mk('Друг', 30, { bond: 70, trust: 60, strain: 5 });
        reset(); out.farKind = socialInvite49(far)?.kind;
        reset(); const q = socialInvite49(near); out.nearKind = q?.kind;
        out.placeBefore = socialPlace49(q);
        near.city18 = T.otherCity(); out.placeAfterMove = socialPlace49(q);
        // Без указания хозяина: выбор падает на друга из другого города — всё равно созвон.
        reset(); for (const p of socialHosts49()) if (p !== far) x.hosts[p.id] = { last: s.clock.ticks, count: 0 };
        x.hosts[far.id] = { last: -100, count: 1 };
        const q3 = socialInvite49(); out.autoHost = q3?.host === far.id; out.autoKind = q3?.kind;
        out.group = socialLocal49(far).every(p => p.city18 === residenceCity() || !p.city18);
        return out;
      });
      check('встречи: друг из другого города — созвон', r.farKind === 'call', r);
      check('встречи: друг из своего города — встреча', r.nearKind && r.nearKind !== 'call' && r.placeBefore, r);
      check('встречи: друг переехал — встреча недоступна', r.placeAfterMove === false, r);
      check('встречи: автоматический выбор тоже звонит в другой город', r.autoHost && r.autoKind === 'call', r);
      check('встречи: компания — только из своего города', r.group, r);
      check('встречи: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // г) Лагерь и семейная поездка в один месяц.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 36; s.cash = 1e7; s.job = null; s.illness = null; const out = {};
        const kid = T.mk('Ребенок', 10, { bond: 80 }); kid.parentId = null; familyState27();
        const draft = { country: s.country, city: T.otherCity(), days: 7, comfort: 'standard', party53: [kid.id], pay53: 'all' };
        out.whyFree = travelWhy52(draft).filter(w => /лагер/.test(w));
        out.camp = bookCamp54(kid.id, 'domestic', s.country);
        out.whyCamp = travelWhy52(draft).filter(w => /лагер/.test(w));
        cancelCamp54(family54().camps.at(-1).id);
        out.tripWhy = travelWhy52(draft);
        out.trip = bookTravel52(draft);
        out.campWhy = campWhy54(kid.id, 'domestic', s.country);
        // Даты разошлись (перенос): лагерь записан в обход проверки — при отъезде поездка не берёт ребёнка из лагеря.
        const t = travel52().trips.at(-1);
        family54().camps.push({ id: 'camp-test270', child: kid.id, kind: 'domestic', country: s.country, home: s.country, city: residenceCity(), fee: 1, status: 'planned', departure: t.departure, roll: .5 });
        for (let i = 0; i < 3 && ['planned', 'requested', 'approved'].includes(t.status); i++) T.month(1);
        out.tripStatus = t.status; out.reason = t.reason || '';
        return out;
      });
      check('лагерь: без лагеря поездка с ребёнком не упирается в лагерь', r.whyFree.length === 0, r);
      check('лагерь: ребёнок в лагере — в поездку того же месяца нельзя', r.camp && r.whyCamp.length === 1, r);
      check('лагерь: ребёнок едет в поездку — смену на тот же месяц не записать', r.trip && r.campWhy.includes('В месяц смены ребёнок едет в семейную поездку'), r);
      check('лагерь: при отъезде поездка не забирает ребёнка из лагеря', r.tripStatus === 'cancelled' && /лагер/.test(r.reason), r);
      check('лагерь: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // д) Хозяин под стражей или в больнице.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; s.cash = 1e7; const out = {};
        const z = events54(); z.invitations = []; z.lastOffer = -100;
        const mom = s.people.find(p => p.alive && p.role === 'Мать') || T.mk('Мать', 55, { gender: 'f' });
        mom.alive = true; mom.city18 = residenceCity(); mom.country = s.country; mom.bond = 80; mom.inner.affection = 80; mom.inner.trust = 70; mom.inner.strain = 5; mom.lastBond = 80;
        out.hostBefore = occasionHosts54().includes(mom) && hostEligible53(mom) && partyCandidate53(mom);
        const q = offerOccasion54(mom, 'housewarming', true); out.offerBefore = !!q && occasionAvailable54(q);
        mom.custody145 = { status: 'serving', ends: s.clock.ticks + 6 };
        out.custody = { hosts: occasionHosts54().includes(mom), offer: (z.lastOffer = -100, !!offerOccasion54(mom, 'birthday', true)), avail: occasionAvailable54(q),
          trip: hostEligible53(mom), party: partyCandidate53(mom), meet: meetingWhy53(mom, 'home') };
        mom.custody145 = null; mom.parentHealth143 = { ...(mom.parentHealth143 || {}), careUnavailableUntil: s.clock.ticks + 2, due: s.clock.ticks + 2 };
        out.hospital = { hosts: occasionHosts54().includes(mom), avail: occasionAvailable54(q), trip: hostEligible53(mom) };
        return out;
      });
      check('хозяин: дома — устраивает и зовёт', r.hostBefore && r.offerBefore, r);
      check('хозяин: под стражей — не устраивает, не зовёт, не едет', !r.custody.hosts && !r.custody.offer && !r.custody.avail && !r.custody.trip && !r.custody.party, r.custody);
      check('хозяин: под стражей — причина во встрече', r.custody.meet.includes('Сейчас под стражей'), r.custody.meet);
      check('хозяин: в больнице — не устраивает и не зовёт', !r.hospital.hosts && !r.hospital.avail && !r.hospital.trip, r.hospital);
      check('хозяин: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // е) Разговор «сейчас»: раз в месяц на человека, повтор слабее.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; s.mood = 40; const out = {};
        const a = T.mk('Друг', 30, { bond: 50, trust: 40, strain: 50 }), b = T.mk('Друг', 31, { bond: 50, trust: 40, strain: 50 }), c = T.mk('Друг', 32, { bond: 50, trust: 40, strain: 50 });
        const open = p => { T.quiet(); talk(p.id); T.click(/сейчас/); return T.modal(); };
        let m = open(a); out.first = m.buttons;
        let mood = s.mood; T.click(/пространство/); out.d1 = s.mood - mood;
        m = open(a); out.again = m.buttons.filter(x => /пространство|планах|напряжение/.test(x.t));
        mood = s.mood; T.click(/пространство/); out.d1b = s.mood - mood;
        open(b); mood = s.mood; T.click(/пространство/); out.d2 = s.mood - mood;
        T.month(1);
        open(c); let st = c.inner.strain; T.click(/напряжение/); out.freshStrain = st - c.inner.strain;
        m = open(a); out.weakHint = m.buttons.find(x => /напряжение/.test(x.t));
        st = a.inner.strain; T.click(/напряжение/); out.repeatStrain = st - a.inner.strain;
        // Подросток: «Обозначить границу» из game.js.
        const teen = T.mk('Знакомый', 15, { bond: 50 });
        open(teen); mood = s.mood; T.click(/границу/); out.teen1 = s.mood - mood;
        m = open(teen); out.teenAgain = m.buttons.filter(x => /границу|беспокоит/.test(x.t));
        T.quiet();
        return out;
      });
      check('разговор: первый раз — настроение +6', r.d1 === 6, r);
      check('разговор: повтор в том же месяце закрыт с причиной', r.again.length >= 3 && r.again.every(x => x.off && /уже был/.test(x.t)) && r.d1b === 0, r);
      check('разговор: настроение от второго человека в месяц слабее', r.d2 > 0 && r.d2 < 6, r);
      check('разговор: через месяц с тем же человеком слабее, подсказка говорит об этом', r.freshStrain === 12 && r.repeatStrain > 0 && r.repeatStrain < 12 && /слабее/.test(r.weakHint?.t || ''), r);
      check('разговор: подросток — «Обозначить границу» раз в месяц', r.teen1 > 0 && r.teenAgain.length >= 2 && r.teenAgain.every(x => x.off), r);
      check('разговор: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // ж) Переработка: флаг снимается, когда переработка давно позади.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; const out = {};
        const partner = currentPartner() || T.mk('Партнер', 30, { bond: 70 });
        partner.sceneFlags ??= {};
        const keep = s.job; s.job = { title: 'Проба', salary: 40000 }; s.flags.overtimeYear = null; delete s.flags.overtimeAt270;
        overtime(); s.job = keep;
        out.stamped = s.flags.overtimeAt270 === s.clock.ticks && partner.sceneFlags.overwork === true;
        T.month(1); out.keptRecent = partner.sceneFlags.overwork === true;
        s.flags.overtimeAt270 = s.clock.ticks - 13; T.month(1); out.cleared = partner.sceneFlags.overwork === false;
        partner.sceneFlags.overwork = true; delete s.flags.overtimeAt270; s.flags.overtimeYear = s.year - 2; T.month(1); out.oldSave = partner.sceneFlags.overwork === false;
        return out;
      });
      check('переработка: свежая — флаг стоит', r.stamped && r.keptRecent, r);
      check('переработка: через год — флаг снят', r.cleared, r);
      check('переработка: старое сохранение — флаг снят', r.oldSave, r);
      check('переработка: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // з) Часы своего дела: один раз и без паузы.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'no' });
      const r = await pg.evaluate(() => {
        s.age = 30; s.cash = 1e8; s.illness = null; s.job = null; const out = {};
        const sch0 = schedule23().total, tot0 = totalHours();
        out.ok = startEnterprise152('services', 'Тестовая мастерская', 'hair'); const b = s.enterprise152;
        const task = () => s.clock.tasks.find(t => t.kind === 'business263' && t.business263 === b.id);
        out.mode = b.mode263; out.schDiff = schedule23().total - sch0; out.totDiff = totalHours() - tot0;
        T.quiet(); pauseTask05(task().id); out.pauseState = task().state; out.pauseModal = T.modal().title;
        T.quiet(); cancelTask(task().id); out.afterCancel = !!task();
        const html = taskList05(); out.list = { mode: /Как вести дело/.test(html), noBillion: !/1000000000/.test(html), noPause: !html.includes("pauseTask05('business263") };
        task().state = 'paused'; out.pausedCounted = totalHours() - tot0;
        T.month(1); out.unpaused = task()?.state !== 'paused';
        setBusinessMode263(b.id, 'partial'); out.partial = { hours: task().hours, sch: schedule23().total - sch0, tot: totalHours() - tot0 };
        return out;
      });
      check('своё дело: часы не идут дважды (schedule23 без надбавки, 35 ч в делах)', r.ok && r.mode === 'self' && Math.abs(r.schDiff) < 1e-9 && r.totDiff === 35, r);
      check('своё дело: «Приостановить» не снимает часы, открывает режим', r.pauseState !== 'paused' && /Как вы ведёте дело/.test(r.pauseModal), r);
      check('своё дело: «Прекратить» в списке дел не убирает дело', r.afterCancel, r);
      check('своё дело: в списке нет паузы и «1e9 мес.», есть режим', r.list.mode && r.list.noBillion && r.list.noPause, r.list);
      check('своё дело: пауза из старого сохранения не снимает часы и снимается', r.pausedCounted === 35 && r.unpaused, r);
      check('своё дело: «частично» — 15 ч один раз', r.partial.hours === 15 && r.partial.tot === 15 && Math.abs(r.partial.sch) < 1e-9, r.partial);
      check('своё дело: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // Прогон: 10 лет настоящего месяца — у каждого женатого есть живой супруг, нет NaN и ошибок.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'rs' });
      const r = await pg.evaluate(() => {
        s.age = 25; s.cash = 1e6;
        for (let i = 0; i < 4; i++) { const p = T.mk(pick(['Друг', 'Брат', 'Сестра']), 26 + i, { bond: 65, trust: 60, strain: 10 }); T.pair(p, 10 + i); adultState55(p).nextReview = s.clock.ticks + rnd(6, 30); }
        const bad = [];
        for (let m = 0; m < 120 && !s.dead; m++) {
          T.month(1);
          for (const p of s.people) if (p.alive && p.npcMarried54) {
            const id = p.marriage270?.spouse || unionOtherSoc270(p) || p.agency55?.partner;
            if (!id || !living(id)) bad.push(p.role + ':' + m);
          }
          if (!Number.isFinite(s.mood) || !Number.isFinite(s.cash) || !Number.isFinite(schedule23().total)) bad.push('NaN:' + m);
        }
        return { bad: bad.slice(0, 10), held: socialFix270().weddings.filter(w => w.status === 'held').length, planned: socialFix270().weddings.length, dead: s.dead };
      });
      console.log('прогон 10 лет: свадеб ' + r.held + ' из ' + r.planned + ' запланированных');
      check('прогон: у каждого женатого — живой супруг, без NaN', !r.bad.length, r);
      check('прогон: свадьбы случаются', r.held > 0, r);
      check('прогон: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} проверок прошли` + (failed ? `, ${failed} не прошли` : ''));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
