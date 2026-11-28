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
        // С 271 после свадьбы невеста может взять фамилию мужа (names271): запись о свадьбе — под именем, которое было на свадьбе.
        const sisAt = 'Свадьба · ' + sis.name;
        out.sisEligible = weddingEligible132(sis);
        const w = planWeddingSoc270(sis); out.planned = !!w; out.invite = w && w.invite;
        s.age = 30;
        T.month(1);
        out.ghostCleared = !ghost.npcMarried54 && !ghost.unavailable18;
        for (let i = 0; i < 6 && !sis.npcMarried54; i++) T.month(1);
        out.married = sis.npcMarried54 && sp.npcMarried54 && sis.marriage270?.spouse === sp.id && sp.marriage270?.via === sis.id;
        out.union = !!s.family27.unions.find(u => u.married270 && [u.a, u.b].includes(sis.id) && [u.a, u.b].includes(sp.id));
        out.edge = treeGraph90().edges.find(e => [e.a, e.b].includes(sis.id) && [e.a, e.b].includes(sp.id))?.kind;
        const e = s.log.find(e => e.title === sisAt); out.logText = e?.text || null;
        const card = personSections42(sp); out.cardTie = card.find(x => x.title === 'О человеке')?.rows.find(r => r.label === 'Родство')?.value || null;
        // Вдовство: супруг умер — отметка снимается, можно снова жениться.
        sp.alive = false; T.month(1);
        out.widowCleared = !sis.npcMarried54 && !sis.unavailable18 && !!sis.widowed270;
        const sp2 = T.pair(sis, 13); out.widowAgain = weddingEligible132(sis);
        // Приглашение на свадьбу друга: брак не пишется через месяц после рассылки, а после праздника.
        z.invitations = []; z.lastOffer = -100;
        const fr = T.mk('Друг', 31, { bond: 75, trust: 70, strain: 5 }), fp = T.pair(fr, 14), frAt = 'Свадьба · ' + fr.name;
        const w2 = planWeddingSoc270(fr), q = w2 && z.invitations.find(q => q.id === w2.invite);
        out.inviteLinked = !!q && q.local && q.wedding270 === w2.id;
        out.accepted = q ? respondOccasion54(q.id, true) : false;
        // По месяцам: брак не раньше праздника и в тот же месяц, когда вы на нём побывали (а не в плановый срок).
        out.months = [];
        for (let i = 0; i < 7 && !fr.npcMarried54; i++) { T.month(1); out.months.push({ q: q?.status, married: !!fr.npcMarried54 }); }
        out.notYet = out.months.every(m => !m.married || m.q === 'completed');
        out.sameMonth = out.months.findIndex(m => m.q === 'completed') === out.months.findIndex(m => m.married);
        out.dueAhead = w2.due > w2.held;
        out.friendMarried = fr.npcMarried54 && fp.npcMarried54 && fr.marriage270?.spouse === fp.id;
        out.guest = s.log.find(e => e.title === frAt)?.text || null;
        out.qStatus = q?.status;
        // Планировщик: пара друга — в план; бабушка с новым партнёром — нет.
        const gm = T.mk('Бабушка', 70, { gender: 'f', bond: 70 }); T.pair(gm, 30);
        const f2 = T.mk('Друг', 33, { bond: 30 }); T.pair(f2, 20);
        const rnd0 = Math.random; Math.random = () => 0; try { weddingsPlanSoc270(); } finally { Math.random = rnd0; }
        out.planFriend = !!weddingOpenSoc270(f2.id); out.planGran = !!weddingOpenSoc270(gm.id);
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
      check('свадьба: брак не пишется до праздника', r.notYet, r.months);
      check('свадьба: брак пишется в месяц праздника, не дожидаясь планового срока', r.sameMonth && r.dueAhead, r.months);
      check('свадьба: после праздника — брак и «Вы были среди гостей»', r.friendMarried && /среди гостей/.test(r.guest || ''), r);
      check('свадьба: планировщик берёт пару друга, но не бабушку', r.planFriend && !r.planGran, r);
      check('свадьба: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // а2) После свадьбы: расставание, новая семья, вдовство; свадьба родственника и generationPairs58; отмена свадьбы.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
      const r = await pg.evaluate(() => {
        s.age = 30; s.cash = 1e7; s.illness = null; const out = {};
        const z = events54(); z.invitations = []; z.lastOffer = -100; familyState27();
        const row = (p, sec, label) => personSections42(p).find(x => x.title === sec)?.rows?.find(r => r.label === label)?.value || null;
        const solo = p => { s.family27.unions = s.family27.unions.filter(u => ![u.a, u.b].includes(p.id)); return p; };
        // Расставание так, как его делает игра (autonomy55 adultSocial55, ветка current).
        const breakup = p => { const a = adultState55(p); a.pairedAt = s.clock.ticks - 30; a.plan = { roll: .01 }; adultSocial55(p); a.plan = null; };
        // 1. Друг женился и расстался: в карточке нет «в браке» с бывшей, запись о браке снята у обоих.
        const fr = T.mk('Друг', 30, { bond: 75, trust: 70, strain: 5 }), fp = T.pair(fr, 14);
        marrySoc270(fr, fp);
        out.frBefore = row(fr, 'Собственная жизнь', 'Пара');
        breakup(fr);
        out.frNow = { married: fr.npcMarried54, pair: row(fr, 'Собственная жизнь', 'Пара') };
        T.month(1);
        out.frCleared = !fr.marriage270 && !fp.marriage270;
        // 2. Сестра: брак, «решили жить отдельно», расставание — у бывшего мужа нет «Муж сестры».
        const sis = solo(T.mk('Сестра', 29, { gender: 'f', bond: 70 })), a = T.pair(sis, 14);
        marrySoc270(sis, a);
        const u = s.family27.unions.find(u => u.married270 != null && [u.a, u.b].includes(sis.id));
        out.sisUnion = !!u; out.tieBefore = row(a, 'О человеке', 'Родство');
        if (u) { u.since = s.clock.ticks - 40; adultState55(sis).plan = { roll: .01 }; adultSocial55(sis); adultState55(sis).plan = null; out.unionStatus = u.status; }
        breakup(sis);
        out.tieAfter = row(a, 'О человеке', 'Родство'); out.sisPair = row(sis, 'Собственная жизнь', 'Пара');
        out.edge = treeGraph90().edges.find(e => [e.a, e.b].includes(sis.id) && [e.a, e.b].includes(a.id))?.kind || null;
        T.month(1);
        out.sisCleared = !sis.marriage270 && !a.marriage270;
        // 3. Новый партнёр, через два года generationPairs58 делает их семьёй; он умирает — сестра вдова и может снова выйти замуж.
        const b = T.pair(sis, 25); b.age = 30; generationPairs58();
        out.withB = { married: sis.npcMarried54, pair: row(sis, 'Собственная жизнь', 'Пара'), b: b.name };
        b.alive = false; T.month(2);
        out.widow = { married: sis.npcMarried54, unavailable: sis.unavailable18, widowed: sis.widowed270?.spouse === b.id };
        T.pair(sis, 13); out.again = weddingEligible132(sis);
        // 4. Свадьба брата назначена позже двух лет вместе; вы отказались. generationPairs58 успевает раньше — свадьба всё равно в свой срок.
        z.invitations = []; z.lastOffer = -100;
        const bro = solo(T.mk('Брат', 30, { gender: 'm', bond: 80, trust: 70, strain: 5 })), bp = T.pair(bro, 22); bp.age = 30;
        const broAt = 'Свадьба · ' + bro.name; out.bpBefore = bp.name;
        const w = planWeddingSoc270(bro), q = w && z.invitations.find(q => q.id === w.invite);
        if (w) w.due = s.clock.ticks + 4;
        out.declined = q ? respondOccasion54(q.id, false) : 'нет приглашения';
        T.month(3);
        out.family = { married: bro.npcMarried54, m270: !!bro.marriage270, w: w?.status };
        for (let i = 0; i < 4 && w?.status === 'planned'; i++) T.month(1);
        out.broHeld = { w: w?.status, m: bro.marriage270?.spouse === bp.id && bp.marriage270?.spouse === bro.id,
          unions: s.family27.unions.filter(u => u.status === 'together' && [u.a, u.b].includes(bro.id)).map(u => !!u.married270) };
        out.broLog = s.log.find(e => e.title === broAt)?.text || null;
        out.broEdge = treeGraph90().edges.find(e => [e.a, e.b].includes(bro.id) && [e.a, e.b].includes(bp.id))?.kind || null;
        // 5. Приглашение принято, вы идёте на праздник — свадьба на месте, generationPairs58 не мешает.
        z.invitations = []; z.lastOffer = -100;
        const sis2 = solo(T.mk('Сестра', 30, { gender: 'f', bond: 80, trust: 70, strain: 5 })), sp2 = T.pair(sis2, 22); sp2.age = 30;
        const sis2At = 'Свадьба · ' + sis2.name;
        const w2 = planWeddingSoc270(sis2), q2 = w2 && z.invitations.find(q => q.id === w2.invite);
        out.acc2 = q2 ? respondOccasion54(q2.id, true) : 'нет приглашения';
        for (let i = 0; i < 6 && w2?.status === 'planned'; i++) T.month(1);
        out.sis2 = { w: w2?.status, q: q2?.status, m: sis2.marriage270?.spouse === sp2.id,
          unions: s.family27.unions.filter(u => [u.a, u.b].includes(sis2.id) && u.status === 'together').length };
        out.sis2Log = s.log.find(e => e.title === sis2At && /поженились/.test(e.text))?.text || null;
        // 6. Пара рассталась до свадьбы: приглашение, дело в расписании и поездка отменяются.
        z.invitations = []; z.lastOffer = -100;
        const f3 = T.mk('Друг', 31, { bond: 75, trust: 70, strain: 5 }), p3 = T.pair(f3, 14);
        const w3 = planWeddingSoc270(f3), q3 = w3 && z.invitations.find(q => q.id === w3.invite);
        breakup(f3); T.month(1);
        out.offered = { w: w3?.status, q: q3?.status, log: s.log.find(e => e.title === 'Свадьба · ' + f3.name)?.text || null };
        z.invitations = []; z.lastOffer = -100;
        const f4 = T.mk('Друг', 32, { bond: 75, trust: 70, strain: 5 }), p4 = T.pair(f4, 14);
        const w4 = planWeddingSoc270(f4), q4 = w4 && z.invitations.find(q => q.id === w4.invite);
        out.acc4 = q4 ? respondOccasion54(q4.id, true) : 'нет приглашения';
        const t4 = s.clock.tasks.find(t => t.kind === 'occasion54' && t.occasion54 === q4?.id);
        breakup(f4); weddingsDueSoc270();
        out.active = { w: w4?.status, q: q4?.status, task: t4?.state };
        z.invitations = []; z.lastOffer = -100; familyTravel53().invitations = [];
        const f5 = T.mk('Брат', 33, { gender: 'm', bond: 85, trust: 70, strain: 5, cash: 1e6, city: T.otherCity() }); solo(f5); const p5 = T.pair(f5, 14);
        const w5 = planWeddingSoc270(f5), q5 = w5 && z.invitations.find(q => q.id === w5.invite), inv5 = q5?.travelInvite && invite53(q5.travelInvite);
        out.acc5 = q5 ? respondOccasion54(q5.id, true) : 'нет приглашения';
        const t5 = inv5?.trip && travel52().trips.find(t => t.id === inv5.trip);
        out.trip5Before = t5?.status;
        breakup(f5); weddingsDueSoc270();
        out.trip = { w: w5?.status, q: q5?.status, inv: inv5?.status, trip: t5?.status, reason: t5?.reason || null };
        return out;
      });
      check('брак: до расставания «Пара — имя · в браке»', / · в браке$/.test(r.frBefore || ''), r.frBefore);
      check('брак: после расставания карточка не пишет «в браке»', !r.frNow.married && !/в браке/.test(r.frNow.pair || ''), r.frNow);
      check('брак: после расставания запись о браке снята у обоих', r.frCleared && r.sisCleared, r);
      check('брак: бывший муж сестры — без «Муж сестры», в древе не «Брак»', r.sisUnion && /сестры/.test(r.tieBefore || '') && !r.tieAfter && !/в браке/.test(r.sisPair || '') && r.edge !== 'married', r);
      check('брак: новая семья сестры — в карточке новый партнёр', r.withB.married && r.withB.pair === r.withB.b, r.withB);
      check('брак: новый партнёр умер — вдова, может снова выйти замуж', !r.widow.married && !r.widow.unavailable && r.widow.widowed && r.again, r);
      check('свадьба брата: generationPairs58 раньше свадьбы — свадьба не отменена', r.declined === true && r.family.married && !r.family.m270 && r.family.w === 'planned', r.family);
      check('свадьба брата: в срок — брак записан, союз один, в древе «Брак»', r.broHeld.w === 'held' && r.broHeld.m && r.broHeld.unions.length === 1 && r.broHeld.unions[0] && r.broEdge === 'married', r.broHeld);
      check('свадьба брата: запись «поженились», вас не было', /поженились/.test(r.broLog || '') && /не было/.test(r.broLog || ''), r.broLog);
      // generationPairs58 отметил их браком раньше свадьбы — фамилию невеста меняет не раньше самой свадьбы (names271).
      check('свадьба брата: невеста до свадьбы со своей фамилией', (r.broLog || '').includes(' и ' + r.bpBefore + ' поженились'), { log: r.broLog, before: r.bpBefore });
      check('свадьба сестры: гость на празднике — брак сразу, союз один', r.acc2 === true && r.sis2.w === 'held' && r.sis2.q === 'completed' && r.sis2.m && r.sis2.unions === 1 && /среди гостей/.test(r.sis2Log || ''), r);
      check('отмена: расстались до свадьбы — приглашение отменено, запись с причиной', r.offered.w === 'cancelled' && r.offered.q === 'cancelled' && /Свадьбы не будет: .+ расстались\.$/.test(r.offered.log || ''), r.offered);
      check('отмена: принятое приглашение — дело в расписании снято', r.acc4 === true && r.active.w === 'cancelled' && r.active.q === 'cancelled' && r.active.task === 'cancelled', r);
      check('отмена: поездка на свадьбу в другой город отменена', r.acc5 === true && ['planned', 'requested', 'approved'].includes(r.trip5Before) && r.trip.w === 'cancelled' && r.trip.trip === 'cancelled' && r.trip.inv === 'cancelled' && r.trip.q === 'cancelled' && /Свадьбы не будет/.test(r.trip.reason || ''), r);
      check('брак и отмена: без ошибок страницы', !errors.length, errors);
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
        // Старое сохранение: приглашение создано до 270, хозяин в составе поездки. Через месяц его в составе нет, принять можно.
        z.lastOffer = -100;
        const aunt = T.mk('Сестра', 40, { gender: 'f', bond: 85, trust: 30, strain: 10, cash: 1e6, city: T.otherCity() });
        // Каждый платит за себя: до 270 хозяин оплачивал и собственную дорогу в свой же город.
        const qOld = socialFix270Base.offerOccasion54(aunt, 'birthday', false), invOld = qOld && invite53(qOld.travelInvite);
        out.oldParty = !!invOld?.draft.party53.includes(aunt.id) && aunt.id in (invOld.quote.charges || {});
        T.month(1);
        out.migrated = invOld && { party: invOld.draft.party53.includes(aunt.id), hostOff: !!invOld.hostOff270, inv: invOld.status, q: qOld.status,
          fee: qOld.fee === invOld.quote.player, charges: Object.keys(invOld.quote.charges || {}).includes(aunt.id) };
        out.oldAccept = qOld ? respondOccasion54(qOld.id, true) : false;
        const tOld = invOld?.trip && travel52().trips.find(t => t.id === invOld.trip);
        out.oldTripParty = tOld ? (tOld.party53 || []).includes(aunt.id) : 'нет поездки';
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
      check('приглашение: старое сохранение — хозяин убран из поездки за месяц', r.oldParty && r.migrated && !r.migrated.party && r.migrated.hostOff && r.migrated.inv === 'offered' && r.migrated.q === 'offered' && r.migrated.fee && !r.migrated.charges, { oldParty: r.oldParty, migrated: r.migrated });
      check('приглашение: старое сохранение — согласие проходит, хозяин не попутчик', r.oldAccept === true && r.oldTripParty === false, r);
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
        // С этим человеком ещё не говорили: «недавно уже говорили» неправда; про настроение — своя пометка и только там, где оно есть.
        const d = T.mk('Друг', 33, { bond: 50, trust: 40, strain: 50 });
        m = open(d); out.fresh = m.buttons.filter(x => /пространство|планах|напряжение/.test(x.t)).map(x => x.t);
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
      const freshSpace = r.fresh.find(t => /пространство/.test(t)) || '', freshPlans = r.fresh.find(t => /планах/.test(t)) || '', freshStrain = r.fresh.find(t => /напряжение/.test(t)) || '';
      check('разговор: с новым человеком нет «недавно уже говорили»', r.fresh.length === 3 && r.fresh.every(t => !/недавно уже говорили/.test(t)), r.fresh);
      check('разговор: с новым человеком — меньше настроения и пометка только там', /настроение \+[1-5]\b/.test(freshSpace) && /поднимали настроение/.test(freshSpace)
        && /доверие \+7/.test(freshPlans) && !/поднимали/.test(freshPlans) && /напряжение −12/.test(freshStrain) && !/поднимали/.test(freshStrain), r.fresh);
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
        // 276: часы дела — одно обязательство недели (schedule23), дела в расписании нет совсем.
        if (typeof week276 === 'function') {
          out.w276 = true; out.noTask = !task(); out.list = { noBiz: !/business263|Как вести дело/.test(taskList05()) };
          s.clock.tasks.push({ id: 'business263-' + b.id, kind: 'business263', business263: b.id, progress: 2, duration: 1e9, hours: 35, label: 'Своё дело', state: 'paused' });
          out.old = { sch: schedule23().total - sch0, tot: totalHours() - tot0 }; T.month(1); out.migrated = !task();
          setBusinessMode263(b.id, 'partial'); out.partial = { hours: week276().lines.find(l => l.key === 'business:' + b.id)?.hours, sch: schedule23().total - sch0, tot: totalHours() - tot0 };
          return out;
        }
        T.quiet(); pauseTask05(task().id); out.pauseState = task().state; out.pauseModal = T.modal().title;
        T.quiet(); cancelTask(task().id); out.afterCancel = !!task();
        const html = taskList05(); out.list = { mode: /Как вести дело/.test(html), noBillion: !/1000000000/.test(html), noPause: !html.includes("pauseTask05('business263") };
        task().state = 'paused'; out.pausedCounted = totalHours() - tot0;
        T.month(1); out.unpaused = task()?.state !== 'paused';
        setBusinessMode263(b.id, 'partial'); out.partial = { hours: task().hours, sch: schedule23().total - sch0, tot: totalHours() - tot0 };
        return out;
      });
      if (r.w276) {
        check('своё дело (276): часы один раз — 35 ч в обязательствах недели, не в делах', r.ok && r.mode === 'self' && Math.abs(r.schDiff - 35) < 1e-9 && r.totDiff === 0, r);
        check('своё дело (276): дела «своё дело» в расписании нет — ни паузы, ни «1e9 мес.»', r.noTask && r.list.noBiz, r);
        check('своё дело (276): дело на паузе из старого сохранения — часы один раз, после месяца его нет', Math.abs(r.old.sch - 35) < 1e-9 && r.old.tot === 0 && r.migrated, r);
        check('своё дело (276): «частично» — 15 ч один раз', r.partial.hours === 15 && Math.abs(r.partial.sch - 15) < 1e-9 && r.partial.tot === 0, r.partial);
        check('своё дело: без ошибок страницы', !errors.length, errors);
        await ctx.close();
      } else {
      check('своё дело: часы не идут дважды (schedule23 без надбавки, 35 ч в делах)', r.ok && r.mode === 'self' && Math.abs(r.schDiff) < 1e-9 && r.totDiff === 35, r);
      check('своё дело: «Приостановить» не снимает часы, открывает режим', r.pauseState !== 'paused' && /Как вы ведёте дело/.test(r.pauseModal), r);
      check('своё дело: «Прекратить» в списке дел не убирает дело', r.afterCancel, r);
      check('своё дело: в списке нет паузы и «1e9 мес.», есть режим', r.list.mode && r.list.noBillion && r.list.noPause, r.list);
      check('своё дело: пауза из старого сохранения не снимает часы и снимается', r.pausedCounted === 35 && r.unpaused, r);
      check('своё дело: «частично» — 15 ч один раз', r.partial.hours === 15 && r.partial.tot === 15 && Math.abs(r.partial.sch) < 1e-9, r.partial);
      check('своё дело: без ошибок страницы', !errors.length, errors);
      await ctx.close();
      }
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
          // Супруг — тот, с кем общий союз, или нынешний партнёр (marriage270 мог остаться от прежнего брака — на него не опираемся).
          const together = p => (s.family27?.unions || []).filter(u => u.status === 'together' && [u.a, u.b].includes(p.id)).map(u => u.a === p.id ? u.b : u.a);
          for (const p of s.people) if (p.alive && p.npcMarried54) {
            if (!together(p).some(id => living(id)) && !(p.agency55?.partner && living(p.agency55.partner))) bad.push(p.role + ':' + m);
          }
          // Запись о браке — только о нынешнем: супруг жив, отмечен, это партнёр или общий союз, и запись взаимна.
          for (const p of s.people) if (p.alive && p.marriage270) {
            const sp = living(p.marriage270.spouse);
            if (!sp || !p.npcMarried54 || sp.marriage270?.spouse !== p.id || !(p.agency55?.partner === sp.id || sp.agency55?.partner === p.id || together(p).includes(sp.id))) bad.push('stale:' + p.role + ':' + m);
          }
          // Отменённая свадьба не оставляет действующего приглашения.
          for (const w of socialFix270().weddings) if (w.status === 'cancelled' && w.invite) {
            const q = events54().invitations.find(q => q.id === w.invite);
            if (q && ['offered', 'active'].includes(q.status)) bad.push('invite:' + m);
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
