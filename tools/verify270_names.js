// Проверки сборки 270, часть «тёзки» (names270.js): генератор не выдаёт имя игрока, родственник с семейной
// фамилией и новорождённый не получают полное имя игрока или живого человека, умерший тёзка не мешает;
// полный тёзка игрока — редкая находка: одна жизнь из 50 (Корея и Китай — из 15), один раз, с записью в истории.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify270_names.js
// BASE=1 — прогон без names270.js: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

async function page(browser, country) {
  const ctx = await browser.newContext();
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
  await pg.evaluate(c => { const e = document.getElementById('country'); e.value = c; e.dispatchEvent(new Event('change', { bubbles: true })); }, country);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  if (process.env.BASE !== '1' && !INDEX.includes('names270.js')) await pg.addScriptTag({ path: path.join(ROOT, 'names270.js') });
  return { pg, errors, ctx };
}

(async () => {
  const browser = await chromium.launch();
  for (const country of ['th', 'it', 'in', 'nl', 'jp', 'es']) {
    const { pg, errors, ctx } = await page(browser, country);
    const r = await pg.evaluate(c => {
      const out = {};
      identity256(s);
      const parts = s.surnameParts256?.length ? s.surnameParts256 : [s.surname];
      const mine = [s.name + ' ' + s.surname, fullName256(s.name, parts, s.birthCountry || s.country, s.surnameJoiner256 || ' ')];
      out.mine = mine;
      // 1. Генератор: 3000 попыток с пустыми резервами — ни одна не равна имени игрока.
      let hits = 0;
      for (let i = 0; i < 3000; i++) { nameReservations = new Set(); namesLife = s; if (mine.includes(name(c, s.gender))) hits++; }
      out.generatorHits = hits;
      // 2. Родственник с семейной фамилией, которому выпало личное имя игрока.
      const given = s.name;
      const keep = familyName166;
      const rel = person('Брат', 30, s.gender, c);
      s.people.push(rel);
      familyName166 = () => ({ given, surname: s.surname });
      try { assignFamilyName166(rel, c, null); } finally { familyName166 = keep; }
      out.relative = { name: rel.name, surname: rel.surname, player: mine[1], playerSurname: s.surname, clash: mine.includes(rel.name) };
      // 3. Новорождённый с именем игрока и его фамилией: имя меняется, фамилия остаётся.
      const baby = { id: 'baby270', role: 'Ребенок', gender: s.gender, age: 0, alive: true, country: c, birthCountry: c, givenName166: given, surname: s.surname, surnameParts256: [...parts], name: mine[1] };
      s.people.push(baby);
      if (typeof dedupeGiven270 === 'function') dedupeGiven270(baby);
      out.baby = { name: baby.name, surname: baby.surname, clash: mine.includes(baby.name) };
      // 4. Живой тёзка не игрока: второй получает другое имя. 5. Умерший тёзка — оставляем (назвали в честь деда).
      const a = person('Друг', 40, 'f', c), b = person('Коллега', 35, 'f', c), dead = person('Дед', 90, 'm', c), grandson = person('Внук', 1, 'm', c);
      b.givenName166 = a.givenName166; b.surname = a.surname; b.surnameParts256 = [...a.surnameParts256]; b.name = a.name;
      dead.alive = false; grandson.givenName166 = dead.givenName166; grandson.surname = dead.surname; grandson.surnameParts256 = [...dead.surnameParts256]; grandson.name = dead.name;
      s.people.push(a, b, dead, grandson);
      if (typeof dedupeGiven270 === 'function') { dedupeGiven270(b); dedupeGiven270(grandson); }
      out.living = { a: a.name, b: b.name, bSurname: b.surname, aSurname: a.surname };
      out.dead = { dead: dead.name, grandson: grandson.name };
      // 6. Полный тёзка как редкая находка (namesake270).
      if (typeof namesakeState270 === 'function') {
        const home = s.birthCountry || s.country;
        const count = () => s.log.filter(e => e.title === 'Полный тёзка').length;
        s.namesake270 = { on: true, at: 0, done: false };
        const twin = person('Друг', 30, s.gender, home); s.people.push(twin); render();
        const after = person('Друг', 31, s.gender, home); s.people.push(after); render();
        out.ns = { twin: twin.name, twinIsMine: mine.includes(twin.name), logged: count(), done: s.namesake270.done, nextIsMine: mine.includes(after.name),
          text: (s.log.find(e => e.title === 'Полный тёзка') || {}).text || '' };
        // Кандидат не попал в жизнь — ждём следующего.
        s.namesake270 = { on: true, at: 0, done: false };
        const ghost = person('Знакомство', 25, s.gender, home); s.clock.ticks += 1; render();
        const pendingCleared = !s.namesake270.pending && !s.namesake270.done;
        const real = person('Знакомый', 27, s.gender, home); s.people.push(real); render();
        out.ns.retry = { ghostWasMine: mine.includes(ghost.name), pendingCleared, realIsMine: mine.includes(real.name), logged: count() };
        // Родня, другой пол, возраст раньше срока, жизнь без тёзки — имя не трогаем.
        s.namesake270 = { on: true, at: 0, done: false };
        const mom = person('Мать', 50, s.gender, home), other = person('Друг', 30, s.gender === 'm' ? 'f' : 'm', home);
        s.namesake270 = { on: true, at: s.age + 5, done: false };
        const early = person('Друг', 30, s.gender, home);
        s.namesake270 = { on: false, at: 0, done: false };
        const off = person('Друг', 30, s.gender, home);
        out.ns.skip = [mom, other, early, off].map(q => mine.includes(q.name) || !!q.namesake270);
        // Частота: одна жизнь из 50, в Корее и Китае — из 15.
        const rate = c => { let n = 0; const keep = s.namesake270, kb = s.birthCountry, kc = s.country; s.birthCountry = c; for (let i = 0; i < 20000; i++) { s.namesake270 = null; if (namesakeState270().on) n++; } s.namesake270 = keep; s.birthCountry = kb; s.country = kc; return n / 20000; };
        out.ns.rate = { nl: rate('nl'), kr: rate('kr'), cn: rate('cn') };
      }
      return out;
    }, country);
    check(r.generatorHits === 0, `${country}: генератор не выдаёт имя игрока`, `совпадений ${r.generatorHits} из 3000`);
    check(!r.relative.clash && r.relative.surname === r.relative.playerSurname, `${country}: родственник с фамилией семьи не тёзка игрока`, `${r.relative.name} / игрок ${r.relative.player}`);
    check(!r.baby.clash && r.baby.surname === r.relative.playerSurname, `${country}: новорождённый не тёзка игрока, фамилия та же`, r.baby.name);
    check(r.living.a !== r.living.b && r.living.aSurname === r.living.bSurname, `${country}: живой тёзка получает другое имя`, `${r.living.a} / ${r.living.b}`);
    check(r.dead.dead === r.dead.grandson, `${country}: имя умершего можно повторить`, r.dead.grandson);
    if (process.env.BASE !== '1') {
      const ns = r.ns || {};
      check(ns.twinIsMine && ns.logged === 1 && ns.done && !ns.nextIsMine && /Вас зовут одинаково/.test(ns.text), `${country}: полный тёзка — один раз, с записью в истории`, `${ns.twin} · ${ns.text}`);
      check(ns.retry && ns.retry.ghostWasMine && ns.retry.pendingCleared && ns.retry.realIsMine && ns.retry.logged === 2, `${country}: тёзка-кандидат, не попавший в жизнь, переходит к следующему знакомому`, JSON.stringify(ns.retry));
      check(ns.skip && ns.skip.every(x => !x), `${country}: не родня, тот же пол, не раньше срока, не в жизни без тёзки`, JSON.stringify(ns.skip));
      check(ns.rate && Math.abs(ns.rate.nl - 0.02) < 0.006 && Math.abs(ns.rate.kr - 1 / 15) < 0.012 && Math.abs(ns.rate.cn - 1 / 15) < 0.012, `${country}: частота жизней с тёзкой — 1/50, Корея и Китай — 1/15`, JSON.stringify(ns.rate));
    }
    check(errors.length === 0, `${country}: без ошибок страницы`, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
