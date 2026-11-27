// Проверки сборки 275.4 (fixes2754.js): мастер-класс при полном круге знакомств, приглашение и курс в «Ожидают ответа»,
// причина после переезда, слова в «Найти действие».
//   node tools/verify2754_fixes.js [сохранение.json]      OWNER_SAVE=путь — то же; без него — только новые жизни
//   BASE=1 — index.html без fixes2754.js: видно, что ловят проверки.
// Игра раздаётся с диска, сервер не нужен. Сохранение владелицы никуда не копируется.
//  1. Круг направления пуст, знакомых по кругам 24: приглашение приходит, хозяин — взрослый из вашего города, не родня;
//     прежний наставник по этому делу приглашает сам; при неполном круге хозяин как раньше; за 10 лет приглашения есть;
//     прежний хозяин приглашает снова, пока живёт в вашем городе, а если уехал он или вы — человек из вашего города.
//  2. Приглашение и предложение вести курс — в «Ожидают ответа» и в панели; пункт открывает нужное окно; «×» прячет до
//     месяца перед сроком по теме; после ответа, по сроку и в другой стране пункта нет; жизнь без творчества не получает
//     новых полей.
//  3. Переезд: причина «из другой страны» у мастер-класса (окно направления и «Менторство и мастер-классы») и у контракта.
//  4. «Найти действие»: гости, навестить, съездить, позвать, пригласить, брак, замуж, расписаться, свадьба, мастер-класс,
//     курс, ученик, наставник — настоящий ввод в поле поиска и переход по результату до нужной кнопки.
//  5. То же на сохранении владелицы; месяцы идут без ошибок.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
const TAG = /<script src="fixes2754\.js[^"]*"><\/script>/;
const INDEX_RAW = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const INDEX = BASE ? INDEX_RAW.replace(TAG, '') : INDEX_RAW;
const OWNER = [process.env.OWNER_SAVE, process.argv[2]].find(f => f && fs.existsSync(f)) || null;
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
const errorsAll = [];
async function section(name, fn) { try { await fn(); } catch (e) { check(false, name + ' — раздел прерван', String(e && e.message || e).split('\n')[0].slice(0, 240)); } }

async function page(browser, { owner = null, country = 'de' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    if (rel === 'index.html') return r.fulfill({ status: 200, body: INDEX, headers: { 'content-type': 'text/html' } });
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (owner) {
    const raw = fs.readFileSync(owner, 'utf8');
    await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  } else {
    await pg.evaluate(c => { const e = document.getElementById('country'); e.value = c; e.dispatchEvent(new Event('change', { bubbles: true })); }, country);
    await pg.click('text=Родиться');
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
    s.clock.running = false;
    window.__month = (n = 1) => {
      for (let i = 0; i < n; i++) {
        s.pending = []; if ($('#modal').open) closeModal();
        if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} }
        s.pending = []; if ($('#modal').open) closeModal();
        advanceMonth();
      }
      s.pending = []; if ($('#modal').open) closeModal();
    };
    // Приглашение «наверняка»: проходит только бросок шанса (первый вызов Math.random), дальше случайность настоящая —
    // иначе у нового человека тот же id, что у прежнего (person() берёт id из Math.random).
    window.__offer = work => { const r = Math.random; let first = true; Math.random = function () { if (first) { first = false; return .01; } return r.apply(this, arguments); }; try { masterClassOffer194(work); } finally { Math.random = r; } return mentoring194().offer; };
    window.__modal = () => {
      const d = $('#modal');
      const opts = [...d.querySelectorAll('.options button')].map(b => {
        const small = b.querySelector('small'), hint = small ? small.textContent.replace(/\s*\n\s*/g, ' · ').trim() : '';
        return { label: (small ? b.textContent.slice(0, b.textContent.length - small.textContent.length) : b.textContent).trim(), hint, disabled: b.disabled };
      });
      return { open: d.open, title: d.querySelector('h2')?.textContent || '', opts };
    };
    window.__items = () => decisionItems24().map(i => ({ kind: i.ref.kind, id: i.ref.id, title: i.title, note: i.note, expires: i.expires }));
  });
  return { pg, errors, ctx };
}
const opt = (m, label) => m.opts.find(o => o.label === label) || m.opts.find(o => o.label.startsWith(label));
const clickOpt = async (pg, label) => {
  const b = pg.locator('#modal[open] .options button:not([disabled])').filter({ hasText: label }).first();
  if (!await b.count()) return false;
  await b.click({ timeout: 5000 });
  await pg.waitForTimeout(80);
  return true;
};
// Настоящий ввод в «Найти действие»: подписи и выключенность результатов.
async function search(pg, word) {
  await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.ui05.actionSearch24 = { q: '', g: '' }; shortcuts23(); });
  await pg.fill('#action-query24', word);
  await pg.waitForTimeout(40);
  return pg.evaluate(() => [...document.querySelectorAll('#action-results24 .action-result24')].map(b => ({ label: b.querySelector('strong')?.textContent || '', note: b.querySelector('small')?.textContent || '', disabled: b.disabled })));
}
async function clickResult(pg, label) {
  const b = pg.locator('#action-results24 .action-result24:not([disabled])').filter({ has: pg.locator('strong', { hasText: label }) }).first();
  if (!await b.count()) return false;
  await b.click({ timeout: 5000 });
  await pg.waitForTimeout(120);
  return true;
}
// Взрослый творческий персонаж: портфолио, которого хватает для преподавания; по желанию круг знакомств полон.
const creative = (pg, o) => pg.evaluate(o => {
  s.age = o.age || 45; s.cash = c().wage * 5; s.job = null;
  specialtyState46().skills[o.track] = 95;
  const keys = Object.keys(specialties184[o.track]);
  for (let i = 0; i < 4; i++) creative47().works.push({ id: 'v2754-' + o.track + '-' + i, title: o.title || 'Иллюстрации к книге', track: o.track, quality: 88, tick: s.clock.ticks - 10, kind: 'paid', country: s.country, specialty184: keys[0], level184: 1 });
  if (o.full) circles48().created = 24;
  return { people: s.people.length, city: residenceCity(), country: s.country };
}, o);
const hostInfo = pg => pg.evaluate(() => {
  const o = mentoring194().offer, p = o && living(o.host);
  return p ? { name: p.name, age: p.age, city: p.city18, country: p.country, kin: kin27(p), partner: currentPartner()?.id === p.id, ctx: p.contexts48, occupation: p.occupation, me: { age: s.age, city: residenceCity(), country: s.country }, people: s.people.length } : null;
});

(async () => {
  const browser = await chromium.launch();
  console.log(BASE ? '— BASE=1: index.html без fixes2754.js —' : '— со сборкой 275.4 —');

  // ---------- 1–2. Германия, иллюстратор, круг знакомств полон ----------
  await section('мастер-класс при полном круге', async () => {
    const { pg, errors, ctx } = await page(browser, { country: 'de' });
    const before = await creative(pg, { track: 'finearts', full: true });
    const offer = await pg.evaluate(() => { const o = __offer(creative47().works.at(-1)); return o && { ...o }; });
    const host = await hostInfo(pg);
    check(!!offer && offer.status === 'offered', '1. круг пуст, 24 знакомых: приглашение провести мастер-класс создано', offer ? 'хозяин ' + (host?.name || '—') : 'приглашения нет');
    check(!!host && host.city === host.me.city && host.country === host.me.country, '1. хозяин живёт в вашем городе', host ? host.city + ' / ' + host.me.city : '—');
    check(!!host && host.age >= 25 && host.age <= 75 && !host.kin && !host.partner, '1. хозяин — взрослый, не родня и не партнёр', host ? host.age + ' лет · ' + host.occupation : '—');
    check(!!host && host.people === before.people + 1, '1. новый человек — один', host ? before.people + ' → ' + host.people : '—');
    const logged = await pg.evaluate(() => s.log.slice(0, 6).find(e => e.title === 'Приглашение провести мастер-класс')?.text || '');
    check(!!host && logged.includes(host.name), '1. запись в «Истории»', logged);
    // 2. «Ожидают ответа».
    let items = await pg.evaluate(() => __items().filter(i => i.kind === 'masterClass2754'));
    check(items.length === 1 && items[0].title === 'Мастер-класс · Изобразительное искусство и иллюстрация' && !!host && items[0].note.startsWith('Приглашает ' + host.name + ' · '),
      '2. приглашение — в «Ожидают ответа»', items[0] ? items[0].title + ' — ' + items[0].note : 'нет пункта');
    check(items.length === 1 && items[0].expires === offer.ends, '2. срок ответа — срок приглашения', items[0] ? items[0].expires + ' / ' + offer.ends : '—');
    const panel = await pg.evaluate(() => { render(); return [...document.querySelectorAll('.attention-row59')].map(r => r.textContent + ' [' + (r.querySelector('.quick-close59')?.getAttribute('title') || '') + ']'); });
    check(panel.some(t => t.includes('Мастер-класс · Изобразительное искусство и иллюстрация') && t.includes('[Напомнить ближе к сроку]')), '2. в панели «Ожидают ответа», у «×» — «Напомнить ближе к сроку»', panel.join(' | ').slice(0, 300));
    const strip = await pg.evaluate(() => typeof decisionsMenu24 === 'function' ? (decisionsMenu24(), __modal().opts.map(o => o.label + ' · ' + o.hint)) : []);
    check(strip.some(t => /Мастер-класс · Изобразительное искусство/.test(t) && /Ответить в течение 3 мес\./.test(t)), '2. в общем списке — со сроком ответа', strip.find(t => /Мастер-класс/.test(t)) || strip.join(' | ').slice(0, 200));
    if (items[0]) {
      await pg.evaluate(i => { closeModal(); openDecision24(i.kind, i.id); }, items[0]);
      const m = await pg.evaluate(() => __modal());
      const mc = opt(m, 'Провести мастер-класс · Изобразительное искусство и иллюстрация');
      check(m.title === 'Менторство и мастер-классы' && !!mc && !mc.disabled && !!opt(m, 'Отклонить приглашение'), '2. пункт открывает «Менторство и мастер-классы» с приглашением', m.title + ' · ' + (mc ? mc.hint : 'нет кнопки'));
      // «×»: пункт прячется по теме до месяца перед сроком, затем возвращается.
      const z = await pg.evaluate(i => { closeModal(); quickDismiss59(i.kind, i.id); return { snoozed: { ...notices59().snoozed }, items: __items().filter(x => x.kind === 'masterClass2754').length, t: s.clock.ticks }; }, items[0]);
      check(z.items === 0 && z.snoozed.masterClass2754 === offer.ends - 1, '2. «×» прячет приглашение по теме до месяца перед сроком', JSON.stringify(z.snoozed));
      const back = await pg.evaluate(until => { const t = s.clock.ticks; s.clock.ticks = until; const n = __items().filter(x => x.kind === 'masterClass2754').length; s.clock.ticks = t; return n; }, offer.ends - 1);
      check(back === 1, '2. за месяц до срока приглашение возвращается', 'пунктов: ' + back);
      // Ответ: мастер-класс запланирован — пункта нет.
      const done = await pg.evaluate(() => { delete notices59().snoozed.masterClass2754; Object.keys(notices59().snoozed).filter(k => k.startsWith('masterClass2754:')).forEach(k => delete notices59().snoozed[k]); const ok = planMentoring194('finearts', 'class'); return { ok, items: __items().filter(x => x.kind === 'masterClass2754').length }; });
      check(done.ok && done.items === 0, '2. после согласия пункт исчезает', JSON.stringify(done));
      // Мастер-класс проходит: хозяин тот же, гонорар прежний.
      const fee = await pg.evaluate(() => { const before = s.cash; __month(2); const h = mentoring194().history.at(-1); return { role: h?.role, fee: mentoring194().offer.fee, wage: Math.round(c().wage * .004 * 4 / 3) }; });
      check(fee.role === 'class' && fee.fee === fee.wage, '1. мастер-класс состоялся, гонорар по прежней формуле', JSON.stringify(fee));
    }
    // Прежний наставник по этому делу в вашем городе приглашает сам, новых людей нет.
    const mentor = await pg.evaluate(() => {
      const st = mentoring194(); st.lastOffer = -100; st.offer = null;
      circleRecord48(mentoringScope194('finearts')).roster = [];
      for (const q of s.people) for (const k of Object.keys(q.contexts48 || {})) if (k.startsWith('creative-mentor:')) delete q.contexts48[k];
      const key = Object.keys(specialties184.finearts)[0], sc = mentoringScope194('finearts', key);
      const p = socialPerson115('Знакомый', 52, s.country, residenceCity(), 'work'); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p);
      p.contexts48 = { [sc.key]: 'mentor' }; p.occupation = 'Опытный специалист · проверка';
      circleRecord48(sc).roster.push(p.id);
      const n = s.people.length, o = __offer(creative47().works.at(-2));
      return { ok: !!o && o.host === p.id, n, after: s.people.length, host: o && living(o.host)?.occupation };
    });
    check(mentor.ok && mentor.after === mentor.n, '1. приглашает ваш наставник по этому делу из вашего города', JSON.stringify(mentor));
    // Курс: предложение учебного центра.
    const course = await pg.evaluate(() => {
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'mentoring194'); mentoring194().offer = null;
      mentoring194().pedagogy = Math.max(10, mentoring194().pedagogy); courses195().lastOffer = -100;
      const r = Math.random; Math.random = () => .01; try { courseOffer195('finearts', null); } finally { Math.random = r; }
      return { contract: courses195().contract && { ...courses195().contract }, items: __items().filter(i => i.kind === 'course2754') };
    });
    check(!!course.contract && course.items.length === 1 && course.items[0].title === 'Вести курс · Изобразительное искусство и иллюстрация' && /^Учебный центр · 3 мес\. по 5 ч\/нед\. · /.test(course.items[0].note),
      '2. предложение вести курс — в «Ожидают ответа»', course.items[0] ? course.items[0].title + ' — ' + course.items[0].note : 'нет пункта');
    if (course.items[0]) {
      await pg.evaluate(i => openDecision24(i.kind, i.id), course.items[0]);
      const m = await pg.evaluate(() => __modal());
      check(m.title === 'Курсы и контракты' && !!opt(m, 'Контракт · ') && !!opt(m, 'Отказаться от контракта'), '2. пункт открывает «Курсы и контракты» с договором', m.title + ' · ' + m.opts.map(o => o.label).join(' | '));
      const z = await pg.evaluate(i => { closeModal(); quickDismiss59(i.kind, i.id); return { z: notices59().snoozed.course2754, n: __items().filter(x => x.kind === 'course2754').length }; }, course.items[0]);
      check(z.n === 0 && z.z === course.contract.expires - 1, '2. «×» у курса — по теме, до месяца перед сроком', JSON.stringify(z));
      // Переезд: пункта нет, причина у контракта — «из другой страны».
      const abroad = await pg.evaluate(() => { delete notices59().snoozed.course2754; const c = s.country; s.country = 'fr'; const n = __items().filter(x => x.kind === 'course2754').length; courseMenu195(); const m = __modal(); s.country = c; closeModal(); return { n, m }; });
      const ct = opt(abroad.m, 'Контракт с учебным центром');
      check(abroad.n === 0, '2. в другой стране предложения вести курс в «Ожидают ответа» нет', 'пунктов: ' + abroad.n);
      check(!!ct && ct.disabled && ct.hint === 'Предложение пришло из другой страны (Германия): вести курс можно только там', '3. причина у контракта после переезда', ct ? ct.hint : 'нет кнопки');
      const expired = await pg.evaluate(() => { __month(4); return __items().filter(x => x.kind === 'course2754').length; });
      check(expired === 0, '2. после срока ответа пункта нет', 'пунктов: ' + expired);
    }
    errorsAll.push(...errors);
    check(!errors.length, '1–2. без ошибок на странице', errors.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // Неполный круг: хозяин — как раньше, из круга направления.
  await section('мастер-класс при неполном круге', async () => {
    const { pg, errors, ctx } = await page(browser, { country: 'jp' });
    await creative(pg, { track: 'music', title: 'Запись музыкальной программы', full: false });
    const r = await pg.evaluate(() => { const o = __offer(creative47().works.at(-1)), p = o && living(o.host); return p ? { ctx: p.contexts48?.[mentoringScope194('music').key], age: p.age, me: s.age } : null; });
    check(!!r && r.ctx === 'mentor', '1. неполный круг: хозяин из круга направления, как до 275.4', JSON.stringify(r));
    errorsAll.push(...errors);
    await ctx.close();
  });

  // Прежний хозяин приглашает снова, пока живёт в вашем городе. Уехал он (в другой город или страну) или вы —
  // приглашает кто-то из вашего города. И при полном круге, и при неполном.
  for (const [country, full] of [['de', true], ['jp', false]]) await section('хозяин после переезда · ' + country, async () => {
    const { pg, errors, ctx } = await page(browser, { country });
    await creative(pg, { track: 'finearts', full });
    const r = await pg.evaluate(() => {
      const st = mentoring194(), work = creative47().works.at(-1);
      const again = () => { st.offer = null; st.lastOffer = -100; const o = __offer(work); return o && living(o.host); };
      const where = p => p ? { name: p.name, country: p.country, city: personCity62(p), me: residenceCity(), mine: s.country } : null;
      const H = again();
      if (!H) return { first: null };
      const n = s.people.length, H1 = again();
      const out = { first: where(H), stays: !!H1 && H1.id === H.id && s.people.length === n };
      // Хозяин переезжает в другой город вашей страны.
      const town = cities[s.country].find(x => x !== residenceCity());
      H.city18 = town; if (H.home59) H.home59.city = town;
      const H2 = again();
      out.hostMoved = where(H2); out.hostMovedOk = !!H2 && H2.id !== H.id && H2.country === s.country && out.hostMoved.city === residenceCity();
      // Хозяин уезжает в другую страну.
      const other = Object.keys(countries).find(k => k !== s.country);
      if (H2) { H2.country = other; H2.city18 = countries[other].city; if (H2.home59) H2.home59 = { ...H2.home59, country: other, city: countries[other].city }; }
      const H3 = again();
      out.hostAbroad = where(H3); out.hostAbroadOk = !!H3 && !!H2 && H3.id !== H2.id && H3.country === s.country && out.hostAbroad.city === residenceCity();
      // Вы переезжаете в другой город своей страны: снимаете жильё там.
      const next = cities[s.country].find(x => x !== residenceCity() && x !== town) || town;
      Object.assign(s.housing, { mode: 'rent', active: true, occupant: null, propertyId: null, city: next });
      out.moved = residenceCity() === next;
      const H4 = again();
      out.youMoved = where(H4); out.youMovedOk = out.moved && !!H4 && !!H3 && H4.id !== H3.id && H4.country === s.country && out.youMoved.city === next;
      out.item = __items().find(i => i.kind === 'masterClass2754')?.note || '';
      out.itemOk = !!H4 && out.item.startsWith('Приглашает ' + H4.name + ' · ');
      return out;
    });
    const w = x => x ? x.name + ' · ' + x.country + ' · ' + x.city + ' (вы: ' + x.mine + ' · ' + x.me + ')' : 'нет приглашения';
    check(!!r.first && r.stays, '1. ' + country + ': пока хозяин в вашем городе, приглашает снова он, новых людей нет', w(r.first));
    check(!!r.hostMovedOk, '1. ' + country + ': хозяин переехал в другой город — приглашает человек из вашего города', w(r.hostMoved));
    check(!!r.hostAbroadOk, '1. ' + country + ': хозяин уехал из страны — приглашает человек из вашего города', w(r.hostAbroad));
    check(!!r.youMovedOk, '1. ' + country + ': вы переехали в другой город — приглашает человек из нового города', w(r.youMoved));
    check(!!r.itemOk, '2. ' + country + ': в «Ожидают ответа» — новый хозяин', r.item || 'нет пункта');
    errorsAll.push(...errors);
    check(!errors.length, '1. ' + country + ': переезды без ошибок на странице', errors.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // За 10 лет: приглашения приходят и при полном круге, и видны в «Ожидают ответа».
  await section('10 лет иллюстратора', async () => {
    const { pg, errors, ctx } = await page(browser, { country: 'de' });
    await creative(pg, { track: 'finearts', full: true });
    const o = await pg.evaluate(() => {
      Math.random = seeded269(7);
      const fresh = () => { const out = []; for (const e of s.log) { if (e.__seen2754) break; out.push(e); } s.log.forEach(e => e.__seen2754 = true); return out; };
      fresh();
      const O = { invites: 0, shown: 0, courses: 0, courseShown: 0, seen: 0, seenCourses: 0 };
      for (let i = 0; i <= 120; i++) {
        const x = creative47();
        for (const a of x.applications) if (a.status === 'offered' && s.clock.ticks < a.until) acceptCreative47(a.id);
        for (const of of creativeMarket47('finearts')) { if (creativeTasks47().length >= 3) break; if (!x.applications.some(a => a.offer.id === of.id) && !creativeCheck47(of).why.length) applyCreative47(of.id); }
        const m = mentoring194();
        if (m.offer?.status === 'offered' && m.offer.ends > s.clock.ticks) {
          O.seen++;
          if (decisionItems24().some(d => d.ref.kind === 'masterClass2754')) O.shown++;
          planMentoring194(m.offer.track, 'class');
        }
        const cc = courses195().contract;
        if (cc?.status === 'available' && cc.expires > s.clock.ticks) {
          O.seenCourses++;
          if (decisionItems24().some(d => d.ref.kind === 'course2754')) O.courseShown++;
          planCourse195(cc.track, '', false, cc.key);
        }
        if (i === 120) break; // последний проход только проверяет пришедшее в последний месяц
        __month();
        for (const l of fresh()) { if (l.title === 'Приглашение провести мастер-класс') O.invites++; if (l.title === 'Предложили вести курс') O.courses++; }
      }
      O.pedagogy = mentoring194().pedagogy;
      return O;
    });
    check(o.invites >= 2, '1. за 10 лет при полном круге приглашения приходят', 'приглашений: ' + o.invites + ', мастерство ' + o.pedagogy);
    check(o.invites > 0 && o.seen === o.invites && o.shown === o.invites, '2. каждое приглашение было в «Ожидают ответа»', o.shown + ' из ' + o.invites);
    check(o.seenCourses === o.courses && o.courseShown === o.courses, '2. каждое предложение вести курс было в «Ожидают ответа»', o.courseShown + ' из ' + o.courses);
    errorsAll.push(...errors);
    check(!errors.length, '10 лет без ошибок на странице', errors.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // ---------- 3. Переезд: Италия → Франция ----------
  await section('мастер-класс после переезда', async () => {
    const { pg, errors, ctx } = await page(browser, { country: 'it' });
    await creative(pg, { track: 'music', title: 'Запись музыкальной программы', full: false });
    const r = await pg.evaluate(() => {
      const o = __offer(creative47().works.at(-1));
      const here = mentoringWhy272('music', 'class');
      s.country = 'fr';
      const why = mentoringWhy272('music', 'class'), other = mentoringWhy272('finearts', 'class'), n = __items().filter(i => i.kind === 'masterClass2754').length;
      learningMenu272('music'); const learn = __modal(); closeModal();
      mentoringMenu194(); const menu = __modal(); closeModal();
      s.country = 'it';
      const home = mentoringWhy272('music', 'class'), back = __items().filter(i => i.kind === 'masterClass2754').length;
      return { ok: !!o, here, why, other, n, learn, menu, home, back };
    });
    const TEXT = 'Приглашение пришло из другой страны (Италия): провести мастер-класс можно только там';
    check(r.ok && r.here === '', '3. в Италии приглашение доступно', r.here);
    check(r.why === TEXT, '3. во Франции причина — приглашение из другой страны', r.why);
    const l = opt(r.learn, 'Провести мастер-класс');
    check(!!l && l.disabled && l.hint === TEXT, '3. «Обучение и практика · Музыка»: та же причина у кнопки', l ? l.hint : 'нет кнопки');
    const mm = opt(r.menu, 'Провести мастер-класс · ');
    check(!!mm && mm.disabled && mm.hint === TEXT, '3. «Менторство и мастер-классы»: приглашение видно выключенным с причиной', mm ? mm.label + ' — ' + mm.hint : r.menu.opts.map(o => o.label).join(' | '));
    check(r.other === 'Приглашение пришло по другому направлению («Музыка и звук») и из другой страны (Италия)', '3. другое направление — названо', r.other);
    check(r.n === 0 && r.back === 1, '2. в другой стране пункта нет, дома — снова есть', r.n + ' / ' + r.back);
    check(r.home === '', '3. дома причины снова нет', r.home);
    errorsAll.push(...errors);
    await ctx.close();
  });

  // ---------- 4. «Найти действие» ----------
  await section('поиск', async () => {
    const { pg, errors, ctx } = await page(browser, { country: 'ru' });
    await pg.evaluate(() => { s.age = 30; s.cash = c().wage; });
    const expect = {
      'гости': 'Люди и общение', 'в гости': 'Люди и общение', 'навестить': 'Люди и общение', 'съездить': 'Люди и общение', 'позвать': 'Люди и общение', 'пригласить': 'Люди и общение',
      'брак': 'Личная жизнь', 'замуж': 'Личная жизнь', 'выйти замуж': 'Личная жизнь', 'жениться': 'Личная жизнь', 'расписаться': 'Личная жизнь', 'свадьба': 'Личная жизнь',
      'мастер-класс': 'Менторство и мастер-классы', 'мастер класс': 'Менторство и мастер-классы', 'курс': 'Менторство и мастер-классы', 'ученик': 'Менторство и мастер-классы', 'наставник': 'Менторство и мастер-классы'
    };
    for (const [word, label] of Object.entries(expect)) {
      const res = await search(pg, word);
      const hit = res.find(r => r.label === label);
      check(!!hit && !hit.disabled, '4. «' + word + '» → «' + label + '»', res.map(r => r.label).join(' | ') || 'ничего не найдено');
    }
    const trip = await search(pg, 'съездить');
    check(trip.some(r => r.label === 'Поездки и отпуск'), '4. «съездить» → ещё и «Поездки и отпуск»', trip.map(r => r.label).join(' | '));
    const wed = await search(pg, 'свадьба');
    check(wed.some(r => r.label === 'События близких'), '4. «свадьба» по-прежнему находит и «События близких»', wed.map(r => r.label).join(' | '));
    // Переход по результату: «Люди и общение» → карточка → «Общение и встречи» → «В гости» и «Встреча и совместное время».
    await search(pg, 'в гости');
    const went = await clickResult(pg, 'Люди и общение');
    const people = await pg.evaluate(() => ({ tab, modal: $('#modal').open }));
    check(went && people.tab === 'people' && !people.modal, '4. «в гости» → открыта вкладка «Люди»', JSON.stringify(people));
    const mom = await pg.evaluate(() => { const p = s.people.find(p => p.alive && p.role === 'Мать') || s.people.find(p => p.alive && p.age >= 18); personDetail(p.id); return p.name; });
    await clickOpt(pg, 'Общение и встречи');
    const meet = await pg.evaluate(() => __modal());
    check(/^Общение · /.test(meet.title) && !!opt(meet, 'В гости · ') && !!opt(meet, 'Встреча и совместное время'), '4. в карточке — «В гости» и «Встреча и совместное время»', mom + ': ' + meet.opts.map(o => o.label).join(' | '));
    // «брак» → «Личная жизнь» → «Брак или развод».
    await pg.evaluate(() => {
      closeModal();
      const p = socialPerson115('Знакомый', 31, s.country, residenceCity(), 'local'); s.people.push(p); enrichPerson(p);
      p.role = 'Партнер'; p.bond = 70; p.inner.trust = 70;
    });
    await search(pg, 'брак');
    await clickResult(pg, 'Личная жизнь');
    const love = await pg.evaluate(() => __modal());
    check(love.title === 'Личная жизнь' && !!opt(love, 'Брак или развод'), '4. «брак» → «Личная жизнь» с «Брак или развод»', love.title + ': ' + love.opts.map(o => o.label).join(' | '));
    await clickOpt(pg, 'Брак или развод');
    const marry = await pg.evaluate(() => __modal());
    check(marry.open && marry.opts.some(o => /Предложить брак|Сделать предложение/.test(o.label)), '4. дальше — предложение брака', marry.title + ': ' + marry.opts.map(o => o.label).join(' | '));
    // «мастер-класс» → «Менторство и мастер-классы».
    await search(pg, 'мастер-класс');
    await clickResult(pg, 'Менторство и мастер-классы');
    const ment = await pg.evaluate(() => __modal());
    check(ment.title === 'Менторство и мастер-классы' && !!opt(ment, 'Найти наставника') && !!opt(ment, 'Курсы и контракты'), '4. «мастер-класс» → окно «Менторство и мастер-классы»', ment.title + ': ' + ment.opts.map(o => o.label).join(' | '));
    // Ребёнок: пункт виден, причина — возраст.
    await pg.evaluate(() => { closeModal(); s.age = 12; });
    const kid = (await search(pg, 'наставник')).find(r => r.label === 'Менторство и мастер-классы');
    check(!!kid && kid.disabled && kid.note === 'С 16 лет', '4. в 12 лет «Менторство и мастер-классы» — «С 16 лет»', kid ? kid.note : 'нет пункта');
    // Жизнь без творчества: от «Ожидают ответа» и поиска в сохранении ничего не появляется.
    const clean = await pg.evaluate(() => { s.age = 30; const before = JSON.stringify(s.creative47?.mentoring194 ?? null); decisionItems24(); render(); actionCatalog24(); return before === JSON.stringify(s.creative47?.mentoring194 ?? null); });
    check(clean, '2. жизнь без творчества: новых полей в сохранении нет');
    errorsAll.push(...errors);
    check(!errors.length, '4. без ошибок на странице', errors.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // ---------- 5. Сохранение владелицы ----------
  if (OWNER) await section('сохранение владелицы', async () => {
    const { pg, errors, ctx } = await page(browser, { owner: OWNER });
    const st = await pg.evaluate(() => ({ name: s.name, age: s.age, created: circles48().created, roster: circleRecord48(mentoringScope194('literature')).roster.length, people: s.people.length, city: residenceCity() }));
    console.log('     ' + st.name + ', ' + st.age + ' лет, ' + st.city + ': знакомых по кругам ' + st.created + ', в круге направления ' + st.roster);
    const o = await pg.evaluate(() => {
      const w = creative47().works.filter(w => w.track === 'literature' && w.quality >= 68).sort((a, b) => b.quality - a.quality)[0];
      const o = w && __offer(w), p = o && living(o.host);
      return o ? { status: o.status, track: o.track, host: p && { name: p.name, age: p.age, city: p.city18, country: p.country, kin: kin27(p), occupation: p.occupation }, people: s.people.length, me: residenceCity() } : null;
    });
    check(!!o && o.status === 'offered', '5. сохранение: приглашение на мастер-класс приходит', o ? o.host?.name + ', ' + o.host?.age + ' лет, ' + o.host?.city + ' · ' + o.host?.occupation : 'нет');
    check(!!o?.host && o.host.city === o.me && o.host.country === 'au' && !o.host.kin, '5. сохранение: хозяин — не родня, из вашего города', o?.host ? o.host.city + ' / ' + o.me : '—');
    const item = await pg.evaluate(() => __items().find(i => i.kind === 'masterClass2754'));
    check(!!item && item.title === 'Мастер-класс · Литературоведение и редактура', '5. сохранение: приглашение в «Ожидают ответа»', item ? item.title + ' — ' + item.note : 'нет');
    const learn = await pg.evaluate(() => { learningMenu272('literature'); const m = __modal(); closeModal(); return m; });
    const mc = opt(learn, 'Провести мастер-класс');
    check(!!mc && !mc.disabled && !!o?.host && mc.hint.startsWith('Приглашение: ' + o.host.name), '5. сохранение: «Провести мастер-класс» доступно', mc ? mc.hint : 'нет кнопки');
    const away = await pg.evaluate(() => { const c = s.country; s.country = 'nl'; const why = mentoringWhy272('literature', 'class'); s.country = c; return why; });
    check(away === 'Приглашение пришло из другой страны (Австралия): провести мастер-класс можно только там', '5. сохранение: после переезда — причина «из другой страны»', away);
    for (const [word, label] of [['в гости', 'Люди и общение'], ['пригласить', 'Люди и общение'], ['брак', 'Личная жизнь'], ['мастер-класс', 'Менторство и мастер-классы'], ['ученик', 'Менторство и мастер-классы']]) {
      const res = await search(pg, word);
      check(res.some(r => r.label === label && !r.disabled), '5. сохранение: «' + word + '» → «' + label + '»', res.map(r => r.label).join(' | ') || 'ничего не найдено');
    }
    // Сын или другой близкий в другом городе: через «Люди и общение» — «В гости · город».
    await search(pg, 'навестить');
    await clickResult(pg, 'Люди и общение');
    const far = await pg.evaluate(() => { const p = s.people.filter(p => p.alive && p.age >= 18 && kin27(p) && p.country === s.country && personCity62(p) !== residenceCity())[0]; if (!p) return null; personDetail(p.id); return { name: p.name, role: p.role, city: p.city18 }; });
    if (far) {
      await clickOpt(pg, 'Общение и встречи');
      const m = await pg.evaluate(() => __modal());
      check(!!opt(m, 'В гости · ' + far.city), '5. сохранение: у близкого из другого города — «В гости · ' + far.city + '»', far.name + ' (' + far.role + '): ' + m.opts.map(x => x.label).join(' | '));
    } else check(true, '5. сохранение: близких в другом городе своей страны нет — переход не проверен');
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); });
    await search(pg, 'брак');
    const hasPartner = await pg.evaluate(() => !!currentPartner());
    await clickResult(pg, 'Личная жизнь');
    const love = await pg.evaluate(() => __modal());
    check(love.title === 'Личная жизнь' && (!hasPartner || !!opt(love, 'Брак или развод')), '5. сохранение: «брак» → «Личная жизнь»' + (hasPartner ? ' с «Брак или развод»' : ''), love.opts.map(x => x.label).join(' | '));
    // Хозяин переехал в другой город: следующее приглашение — от человека из вашего города.
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); });
    const moved = await pg.evaluate(() => {
      const st = mentoring194(), o = st.offer, H = o && living(o.host), w = o && creative47().works.find(x => x.id === o.work);
      if (!H || !w) return null;
      const town = cities[s.country].find(x => x !== residenceCity());
      H.city18 = town; if (H.home59) H.home59.city = town;
      st.offer = null; st.lastOffer = -100;
      const o2 = __offer(w), H2 = o2 && living(o2.host);
      return { was: H.name + ' → ' + town, other: !!H2 && H2.id !== H.id, now: H2 ? H2.name + ' · ' + personCity62(H2) : 'нет', city: H2 && personCity62(H2), me: residenceCity(), country: H2 && H2.country };
    });
    check(!!moved && moved.other && moved.city === moved.me && moved.country === 'au', '5. сохранение: хозяин переехал — приглашает человек из вашего города', moved ? moved.was + '; теперь ' + moved.now : 'нет приглашения');
    // Месяцы идут: приглашение принято или истекло — пункта нет, ошибок нет.
    const months = await pg.evaluate(() => { const t = s.clock.ticks; __month(6); return { moved: s.clock.ticks - t, items: __items().filter(i => i.kind === 'masterClass2754').length, status: mentoring194().offer?.status }; });
    check(months.moved === 6 && months.items === 0, '5. сохранение: через полгода пункта нет', JSON.stringify(months));
    errorsAll.push(...errors);
    check(!errors.length, '5. сохранение: без ошибок на странице', errors.slice(0, 3).join(' | '));
    await ctx.close();
  });
  else console.log('     (сохранение владелицы не задано: OWNER_SAVE=путь)');

  await browser.close();
  check(!errorsAll.length, 'всего ошибок на страницах: ' + errorsAll.length, [...new Set(errorsAll)].slice(0, 4).join(' | '));
  console.log('\n' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
