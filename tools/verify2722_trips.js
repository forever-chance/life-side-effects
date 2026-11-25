// Проверки сборки 272.2, часть «поездки» (trips2722.js): под зелёной плашкой «Можно ехать» — кнопка согласия,
// под жёлтой «Чтобы поехать, не хватает» — кнопки решений.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2722_trips.js
// BASE=1 — прогон без trips2722.js: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); };

async function page(browser, { viewport = { width: 1280, height: 900 }, mine = false, born = true } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : rel === 'index.html' && BASE ? INDEX.replace(/<script src="trips2722\.js[^"]*"><\/script>/, '') : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
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
  window.__ready = () => { const box = document.querySelector('#modal .ready272'); if (!box) return null; if (box.dataset.v2722) return { ok: box.classList.contains('ready272-ok'), head: box.querySelector('h3')?.textContent || '', items: [...box.querySelectorAll('li.ready2722-why')].map(li => ({ text: li.textContent, fix: li.dataset.fix || null, button: !!li.dataset.fix })) }; return { ok: box.classList.contains('ready272-ok'), head: box.querySelector('h3')?.textContent || '', items: [...box.querySelectorAll('.ready272-item')].map(e => ({ text: e.childNodes[0]?.textContent || e.textContent, fix: e.querySelector('small')?.textContent || null, button: e.tagName === 'BUTTON' })) }; };
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


(async () => {
  const browser = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const tag = vp.width < 600 ? 'телефон' : 'широкий';
    const P = await page(browser, { viewport: vp });
    const r = await P.pg.evaluate(() => {
      const out = {};
      // 273: с windows273.js плашка готовности — поле «Не хватает» карточки, «Можно ехать» — статус, кнопка согласия — главная.
      const lbl = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      const layout273 = m => { const need = m.querySelector('.need273'), rows = need && !need.hidden ? [...need.querySelectorAll('.fix273')] : [], st = m.querySelector('.status273'), ok = !rows.length && /можно (ехать|отдыхать)/i.test(st?.textContent || ''), main = m.querySelector('.main273');
        if (!rows.length && !ok) return null; const top = rows.length ? need : st;
        return { panel: true, actsAfterPanel: true, go: ok ? [...main.querySelectorAll('button')].filter(b => !b.disabled).map(lbl) : [], acts: rows.filter(e => e.tagName === 'BUTTON').map(e => e.querySelector('small').textContent), why: rows.map(e => e.querySelector('span').textContent), afterH2: !!(top.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(m.querySelector('h2').compareDocumentPosition(top) & Node.DOCUMENT_POSITION_FOLLOWING), bottom: __opts().filter(o => /Запланировать поездку/.test(o)) }; };
      const layout = () => { const m = document.querySelector('#modal'); if (m.querySelector('.top273')) return layout273(m); const box = m.querySelector('.ready272'); if (!box) return null; const panel = box.querySelector('.ready2722-panel'), acts = box.querySelector('.ready2722-acts'); return { panel: !!panel, actsAfterPanel: !!(panel && acts && panel.nextElementSibling === acts), go: [...m.querySelectorAll('.ready2722-go')].map(b => b.textContent), acts: [...m.querySelectorAll('.ready2722-act')].map(b => b.textContent), why: [...m.querySelectorAll('.ready2722-why')].map(li => li.textContent), afterH2: m.querySelector('h2')?.nextElementSibling === box, bottom: __opts().filter(o => /Запланировать поездку/.test(o)) }; };
      __base();
      travelDraftMenu52(__trip());
      out.ok = layout();
      const before = travel52().trips.length;
      const go = document.querySelector('#modal .ready2722-go') || [...document.querySelectorAll('#modal .main273 button')].find(b => !b.disabled); // 273
      if (go) go.click();
      out.planned = travel52().trips.length - before;
      out.plannedTitle = __title();
      closeModal();
      travel52().trips.length = before; // запланированная поездка закрыла бы следующие окна
      s.cash = 0;
      const kid = person('Ребенок', 6, 'f', s.country); kid.city18 = residenceCity(); s.people.push(kid); out.kid = kid.name;
      travelDraftMenu52(__trip(1));
      out.miss = layout();
      const act = name => [...document.querySelectorAll('#modal .ready2722-act')].find(b => b.textContent === name) || [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => b.querySelector('small')?.textContent === name); // 273
      const money = act('Деньги');
      if (money) money.click();
      out.moneyTitle = __title();
      closeModal();
      travelDraftMenu52(__trip(1));
      const care = act('Присмотр за детьми');
      if (care) care.click();
      out.careTitle = __title();
      closeModal();
      // Работающему нужен отпуск: подпись согласия короче — «Запросить отпуск и запланировать».
      const __job = () => { const prof = (typeof professions16 !== 'undefined' && Object.values(professions16)[0]) || {}; s.job = { title: prof.name || 'Разработчик', employer: 'Контур', professionId: prof.id, salary: c().wage, tenure: 1, format: 'office', language: country16[s.country][0], allowedCountries: [s.country], workplace: { country: s.country, city: residenceCity(), area: 'center' } }; try { travelAccrue52(); } catch (e) {} return s.job; };
      s.cash = 5e6; s.people = s.people.filter(p => p.id !== kid.id);
      __job(); { const l = travelLeave52(); if (l) l.balance = 30; }
      travelDraftMenu52(__trip(1));
      out.job = layout();
      closeModal();
      s.job = null;
      // Отпуск дома: та же кнопка, но «Запланировать отдых».
      s.cash = 5e6; s.people = s.people.filter(p => p.id !== kid.id);
      travelDraftMenu52(__trip(2, { stayHome86: true }));
      out.home = layout();
      closeModal();
      return out;
    });
    check(tag + ': всё готово — под зелёной плашкой кнопка «Запланировать поездку»', r.ok && r.ok.panel && r.ok.actsAfterPanel && r.ok.afterH2 && r.ok.go.length === 1 && r.ok.go[0] === 'Запланировать поездку', r.ok);
    check(tag + ': нижняя кнопка согласия осталась на месте', r.ok && r.ok.bottom.length === 1, r.ok?.bottom);
    check(tag + ': кнопка под плашкой планирует поездку', r.planned === 1, { planned: r.planned, title: r.plannedTitle });
    check(tag + ': не хватает — причины в плашке, под ней кнопки «Деньги» и «Присмотр за детьми»', r.miss && r.miss.panel && r.miss.actsAfterPanel && r.miss.go.length === 0 && r.miss.why.length === 2 && r.miss.why.some(w => w.includes(r.kid)) && r.miss.acts.join('|') === 'Деньги|Присмотр за детьми', r.miss);
    check(tag + ': «Деньги» под плашкой открывает «Деньги на поездку»', r.moneyTitle === 'Деньги на поездку', r.moneyTitle);
    check(tag + ': «Присмотр за детьми» под плашкой открывает присмотр', /С кем останутся дети|присмотр/i.test(r.careTitle), r.careTitle);
    check(tag + ': работающий — под плашкой «Запросить отпуск и запланировать»', r.job && r.job.go.length === 1 && /^Запросить отпуск и запланировать/.test(r.job.go[0]), r.job);
    check(tag + ': отпуск дома — «Запланировать отдых» под плашкой', r.home && r.home.go[0] === 'Запланировать отдых', r.home);
    const fit = await P.pg.evaluate(() => { __base(); travelDraftMenu52(__trip()); const m = document.querySelector('#modal'), mr = m.getBoundingClientRect(); const els = m.querySelector('.top273') ? [...m.querySelectorAll('.main273 button:not([disabled]),.need273 .fix273')] : [...m.querySelectorAll('.ready2722-go,.ready2722-act')]; /* 273 */ const res = { n: els.length, inside: els.every(e => { const r = e.getBoundingClientRect(); return r.left >= mr.left - 1 && r.right <= mr.right + 1; }), noScroll: m.scrollWidth <= m.clientWidth + 1, visible: els.every(e => e.getBoundingClientRect().bottom < window.innerHeight) }; closeModal(); return res; });
    check(tag + ': кнопка видна без прокрутки и не вылезает за окно', fit.n === 1 && fit.inside && fit.noScroll && fit.visible, fit);
    check(tag + ': без ошибок страницы', P.errors.length === 0, P.errors);
    await P.ctx.close();
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE)' : ''));
  process.exit(fail ? 1 : 0);
})();
