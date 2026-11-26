// Проверки сборки 273, шаг 2 (work2732.js): работа на шаблоне карточки.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2732_work.js
// BASE=1 — index.html без work2732.js: видно, какие проверки ловят старое поведение.
// SAVE=файл — ещё и на настоящем сохранении (экспорт «Ваши персонажи», берётся последний персонаж). SHOTS=папка —
// снимки окон на этом сохранении «до» (без work2732.js) и «после», 390 и 1280.
// Что проверяется, на новых жизнях (наём через настоящий отклик) и на сохранении:
// • окна работодателя (меню тем, «Зарплата, повышение…», предложение руководителя, «Сравнить условия», внутренние
//   вакансии, «Рабочая неделя», «Что изменится»), панели «Моя работа», «Вакансии», «Заявки»: главная кнопка видна без
//   прокрутки на 390×844 и 1280×800;
// • набор кнопок не меньше, чем без work2732.js: ни одна не потерялась; новые — только оговорённые; старые кнопки
//   меню нажимаются и ведут туда же;
// • числа — из функций игры: деньги в месяц, шанс прибавки (careerChance18), сумма прибавки (настоящий разговор с
//   согласием), шанс оффера на карточке вакансии (jobEligibility16 × собеседование), зарплата внутренних вакансий;
// • «Подробнее» запоминается по виду окна, в сохранении ничего нового;
// • «Уволиться», «Отклонить» и отказ от оффера из «Заявок» — с подтверждением, очередь s.pending и resolvePending
//   работают как без подтверждения;
// • вакансии: каждая вакансия списка без work2732.js доступна (карточкой или кнопкой часов), одна карточка на ставки;
// • фоновый поиск: фильтры видны у переключателя и меняются там же;
// • замечания рецензии (findingChecks): разрешение из прошлой работы в «Что изменится», предложение о новых условиях,
//   причины «нельзя просить» с датой или кнопкой, «Ещё фильтры», повторный отклик, дробные результаты, поиск после
//   67 лет, история работы словами, договор на кнопке часов, «первый месяц в компании», запас под главной кнопкой;
// • ошибок на странице нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || '', SHOTS = process.env.SHOTS || '';
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 800 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = PHONE, base = BASE, raw = null, country = 'ru', seed = 2732 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? INDEX.replace(/<script src="work2732\.js[^"]*"><\/script>/g, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
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

function helpers() {
  window.__label = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  window.__title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(закрыто)';
  window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
  window.__mbuttons = () => [...document.querySelectorAll('#modal button')].filter(b => !b.closest('.modal-closebar38') && !b.classList.contains('hint-trigger187') && !b.classList.contains('fix273'));
  window.__pbuttons = () => [...document.querySelectorAll('.trajectory button')].filter(b => !b.closest('.path-nav') && !b.classList.contains('hint-trigger187'));
  window.__scroller = () => document.querySelector('[data-panel="center"]');
  // Положение кнопки: видна ли без прокрутки (окно — от верха окна, панель — от верха колонки).
  window.__where = (label, panel = false) => {
    const m = $('#modal'), sc = __scroller();
    if (panel) { if (sc) sc.scrollTop = 0; document.scrollingElement.scrollTop = 0; } else m.scrollTop = 0;
    const list = panel ? __pbuttons() : __mbuttons();
    const b = list.find(b => label instanceof RegExp ? label.test(__label(b)) : __label(b) === label);
    if (!b) return null;
    const r = b.getBoundingClientRect(), box = panel ? (sc ? sc.getBoundingClientRect() : { top: 0, bottom: innerHeight }) : m.getBoundingClientRect();
    return { label: __label(b), top: Math.round(r.top), bottom: Math.round(r.bottom), fold: r.height > 0 && r.top >= box.top - .5 && r.bottom <= Math.min(box.bottom, innerHeight) + .5, disabled: b.disabled, hint: [...b.querySelectorAll('small')].map(x => x.textContent).join(' · ') };
  };
  window.__top = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd').childNodes[0]?.textContent || '']));
  window.__topNotes = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd small')?.textContent || '']));
  window.__chance = () => document.querySelector('#modal .chance273 b')?.textContent || '';
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
  window.__press = (label, panel = false) => {
    const b = (panel ? __pbuttons() : __mbuttons()).find(b => __label(b) === label);
    if (!b) return { missing: label };
    if (b.disabled) return { disabled: true };
    const c = company18(), before = { job: !!s.job, req: c?.requests.length || 0, offers: c?.offers.filter(o => o.status === 'offered').length || 0, tasks: s.clock.tasks.length };
    try { b.click(); } catch (e) { return { error: String(e) }; }
    const c2 = company18(), after = { job: !!s.job, req: c2?.requests.length || 0, offers: c2?.offers.filter(o => o.status === 'offered').length || 0, tasks: s.clock.tasks.length };
    return { title: __title(), changed: Object.keys(after).filter(k => after[k] !== before[k]).map(k => k + ':' + after[k]).join(',') };
  };
  window.__snap = () => { window.__saved = JSON.stringify(s); };
  window.__restore = () => { __close(); s = JSON.parse(window.__saved); s.pending = []; s.clock.running = false; Math.random = seeded269(27321); };
  window.save = function () {}; if (typeof flushSave264 === 'function') window.flushSave264 = function () {};
  // Взрослый, которому по силам работа по направлению; наём через настоящий отклик.
  window.__hire = (field, months) => {
    s.age = Math.max(s.age, 25); s.skill = 80; s.cash = Math.max(s.cash, 5e6);
    const x = path16(); x.experience.skills[field] = 80; x.languages.en = 6; x.languages[country16[s.country][0]] = 6;
    Object.assign(x.view, { country: s.country, field, format: 'near', page: 0, fit68: 'all', fte28: 'all', salary270: 'all', sort270: 'none', experience45: 'all', documents45: 'all', contract45: 'all' });
    x.marketKey = null; makeVacancies16();
    const v = x.vacancies.filter(v => !jobEligibility16(v).why.length && v.fraction28 === 1 && v.country === s.country)[0];
    if (!v) return null;
    applyJob16(v.id); const a = x.jobApplications.at(-1); a.roll = 0; a.interviewRoll = 0;
    for (let i = 0; i < 4 && a.status === 'submitted'; i++) __month(1);
    interview16(a.id); for (let i = 0; i < 4 && a.status === 'interviewing'; i++) __month(1);
    acceptJob16(a.id); startJob16(a.id);
    if (!s.job) return null;
    const c = company18(); if (months != null) c.months = months;
    return s.job.title;
  };
}

// Сценарий готовит жизнь: работа, отклик на этапе оффера, предложение руководителя (в отдельной копии состояния).
const SETUP = {
  owner: `()=>{ window.__v={}; return true; }`,
  ru: `()=>{ window.__v={}; return !!__hire('service',0); }`,
  au: `()=>{ window.__v={}; return !!__hire('computing',14); }`,
};
// Окна и панели; open — строка с функцией, одинаковая в обоих режимах.
const WIN = {
  hub: { open: '()=>workControls16()', main: 'Повышение зарплаты', base: 'Зарплата, повышение и внутренние вакансии' },
  salary: { open: '()=>base21.careerMenu18()', main: 'Повышение зарплаты' },
  internal: { open: "()=>{base21.careerMenu18();[...document.querySelectorAll('#modal .options button')].find(b=>__label(b)==='Внутренние вакансии и перевод').click();}", main: null },
  hours: { open: '()=>hoursMenu()', main: null },
  decision: { open: "()=>{const o=careerOffer18('salary');openDecision24('career',o.id);}", main: 'Принять' },
  compare: { open: "()=>{const o=careerOffer18('salary');base21.careerMenu18();[...document.querySelectorAll('#modal .options button')].find(b=>__label(b)==='Предложение: Повышение зарплаты').click();}", main: 'Принять' },
};
const PANEL = {
  work: { open: "()=>openPath16('jobs')", main: 'Повышение зарплаты', baseMain: 'Действия по текущей работе' },
  vacancies: { open: "()=>{Object.assign(path16().view,{page:0});openPath16('vacancies58')}", main: 'Условия и отклик' },
  requests: { open: "()=>{const x=path16();Object.assign(x.view,{fit68:'all',fte28:'all',salary270:'all',page:0});x.marketKey=null;makeVacancies16();const v=x.vacancies.find(v=>!jobEligibility16(v).why.length&&v.country===s.country&&!x.jobApplications.some(a=>a.vacancy.profession===v.profession&&['submitted','interview','interviewing','offered','accepted'].includes(a.status)));if(v){x.retry={};applyJob16(v.id);const a=x.jobApplications.at(-1);s.clock.tasks=s.clock.tasks.filter(t=>t.application!==a.id);a.status='offered';a.expires=s.clock.ticks+3;window.__v.app=a.id;}openRequests58('work')}", main: /^(Рассмотреть оффер|Отказаться от предложения \/ собеседования)$/ },
};
// Новые кнопки, которых нет без work2732.js.
const EXTRA = {
  hub: /.*/, // меню тем получает варианты окна зарплаты — сверяется отдельно
  requests: /^Отказаться от предложения \/ собеседования$/,
  work: /^(Повышение зарплаты|Принять|Отклонить|Зарплата, повышение и внутренние вакансии|Обязанности и условия|Отделы и карьерные направления|Образование за счёт компании|Проекты и условия повышения|Карьерная история|Повышение в должности|Обучение за счёт работодателя|Внутренние вакансии и перевод|Обсудить карьерные перспективы|История изменений|Дополнительный проект|Уволиться)$/,
  vacancies: /^\d+ ч$/,
};

async function openWin(pg, src) { return pg.evaluate(src => { __close(); (0, eval)('(' + src + ')')(); return __title(); }, src); }
async function look(pg, kind) {
  const w = WIN[kind];
  await openWin(pg, w.open);
  await pg.waitForTimeout(20);
  return pg.evaluate(([kind, main]) => ({ kind, title: __title(), labels: __mbuttons().map(b => ({ label: __label(b), disabled: b.disabled })), main: main ? __where(main) : null,
    card: !!document.querySelector('#modal .top273'), top: __top(), notes: __topNotes(), chance: __chance(), status: document.querySelector('#modal .status273:not([hidden])')?.textContent || '',
    h2home: !document.querySelector('#modal h2')?.closest('details'), hintHome: !document.querySelector('#modal .hint-trigger187')?.closest('details'),
    hints: Object.fromEntries(__mbuttons().map(b => [__label(b), [...b.querySelectorAll('small')].map(x => x.textContent).join(' · ')])) }), [kind, w.main]);
}
async function lookPanel(pg, kind) {
  const p = PANEL[kind];
  await openWin(pg, p.open);
  await pg.waitForTimeout(20);
  return pg.evaluate(([kind, main, alt]) => {
    const re = typeof main === 'string' && main.startsWith('/') ? new RegExp(main.slice(1, -1)) : main;
    const ids = [...document.querySelectorAll('.trajectory button')].map(b => (b.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1]).filter(Boolean);
    return { kind, labels: __pbuttons().map(b => ({ label: __label(b), disabled: b.disabled })), main: re ? __where(re, true) : null, alt: alt ? __where(alt, true) : null, ids, app: window.__v.app || null };
  }, [kind, String(p.main), p.baseMain || null]);
}

async function scenario(browser, name, opts) {
  const out = {};
  if (!opts.raw) {
    const P = await page(browser, { ...opts, base: true });
    const ok = await P.pg.evaluate(src => { Math.random = seeded269(27320); return (0, eval)('(' + src + ')')(); }, SETUP[name]);
    if (!ok) { note(name + ': наём не удался — сценарий пропущен'); await P.ctx.close(); return null; }
    opts = { ...opts, raw: await P.pg.evaluate(() => JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] })) };
    await P.ctx.close();
  }
  const modes = [['base', true, PHONE], ['new', false, PHONE], ['wide', false, WIDE], ...(SHOTS && name === 'owner' ? [['widebase', true, WIDE]] : [])];
  for (const [mode, base, vp] of modes) {
    if (BASE && mode !== 'base') continue;
    const P = await page(browser, { ...opts, base, viewport: vp });
    await P.pg.evaluate(src => { Math.random = seeded269(27321); (0, eval)('(' + src + ')')(); }, name === 'owner' ? SETUP.owner : '()=>{window.__v={};}');
    await P.pg.evaluate(() => __snap());
    const r = { wins: {}, panels: {}, press: {} };
    for (const k of Object.keys(WIN)) {
      await P.pg.evaluate(() => __restore());
      r.wins[k] = await look(P.pg, k);
      if (SHOTS && name === 'owner') { await P.pg.evaluate(() => { $('#modal').scrollTop = 0; }); await P.pg.evaluate(() => document.querySelectorAll('.toast').forEach(e => e.remove())); await P.pg.screenshot({ path: path.join(SHOTS, 'win-' + k + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png') }); }
    }
    for (const k of Object.keys(PANEL)) {
      await P.pg.evaluate(() => __restore());
      r.panels[k] = await lookPanel(P.pg, k);
      if (SHOTS && name === 'owner') { await P.pg.evaluate(() => { const sc = __scroller(); if (sc) sc.scrollTop = 0; }); await P.pg.evaluate(() => document.querySelectorAll('.toast').forEach(e => e.remove())); await P.pg.screenshot({ path: path.join(SHOTS, 'panel-' + k + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png') }); }
    }
    // Каждая кнопка меню тем и окна зарплаты: нажать в том же состоянии и записать, куда привело (только телефон).
    if (!mode.startsWith('wide')) for (const k of ['hub', 'salary']) for (const l of r.wins[k].labels) {
      await P.pg.evaluate(() => __restore());
      await openWin(P.pg, WIN[k].open);
      r.press[k + ' / ' + l.label] = await P.pg.evaluate(label => __press(label), l.label);
    }
    if (!mode.startsWith('wide')) r.extra = await extraChecks(P.pg, name, base);
    if (!mode.startsWith('wide') && !base) r.find = await findingChecks(P.pg);
    if (SHOTS && name === 'owner' && !base) {
      await P.pg.evaluate(() => { __restore(); workControls16(); [...document.querySelectorAll('#modal button')].find(b => __label(b) === 'Уволиться').click(); });
      await P.pg.evaluate(() => document.querySelectorAll('.toast').forEach(e => e.remove())); await P.pg.screenshot({ path: path.join(SHOTS, 'win-quit-' + vp.width + '-after.png') });
    }
    r.errors = P.errors.slice();
    out[mode] = r;
    await P.ctx.close();
  }
  return out;
}

async function extraChecks(pg, name, base) {
  return pg.evaluate(async ([name, base]) => {
    const x = {}, pc = p => Math.round(p * 100) + '%';
    // Числа окна работодателя: деньги в месяц, шанс прибавки, сумма прибавки.
    __restore();
    { workControls16(); const e = careerChance18('salary'), j = s.job;
      x.hub = { get: __top()['Получите'] || '', want: money(j.salary / 12) + '/мес. на руки', chance: __chance(), wantChance: e.why.length ? '' : pc(e.probability), note: __topNotes()['Шанс прибавки'] || '', wantRaise: money((Math.round(j.salary * 1.12) - j.salary) / 12), why: e.why.slice(),
        need: [...document.querySelectorAll('#modal .need273 .fix273')].map(n => ({ text: n.querySelector('span')?.textContent, small: n.querySelector('small')?.textContent || '' })) }; __close(); }
    // Настоящий разговор с согласием: сумма в предложении — та, что обещала карточка.
    if (!careerChance18('salary').why.length) { __restore(); const j = s.job, was = j.salary; negotiate18('salary'); const c = company18(), q = c.requests.at(-1); q.roll = 0; q.resultRoll = .9;
      for (let i = 0; i < 4 && q.status === 'pending'; i++) __month(1); const o = c.offers.filter(o => o.status === 'offered').at(-1);
      x.realRaise = { outcome: q.outcome, offer: o ? money((o.salary - was) / 12) : null }; __close(); }
    // Панель «Моя работа»: кнопка прибавки с шансом и суммой, «Подробнее» с прежними действиями.
    __restore(); openPath16('jobs');
    { const sec = [...document.querySelectorAll('.trajectory section.path-card')].find(q => /ТЕКУЩАЯ РАБОТА/i.test(q.textContent));
      const e = careerChance18('salary'), j = s.job;
      x.panel = { head: sec?.querySelector('h2')?.textContent || '', want: jobTitle270(j.title) + ' · ' + money(j.salary) + '/год · ', hint: __where('Повышение зарплаты', true)?.hint || '', wantHint: e.why.length ? '' : 'шанс ' + pc(e.probability) + ' · +' + money((Math.round(j.salary * 1.12) - j.salary) / 12) + '/мес.',
        month: sec?.textContent.includes(money(j.salary / 12) + '/мес. на руки'), first: sec === document.querySelector('[data-panel="center"] .path-card') }; }
    // «Подробнее» запоминается по виду окна, не в сохранении.
    if (!base) { __restore(); const d = () => document.querySelector('#modal details.more273');
      workControls16(); const was = d()?.open; d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30));
      __close(); workControls16(); const kept = d()?.open;
      __close(); base21.careerMenu18(); const same = d()?.open;
      __close(); const o = careerOffer18('salary'); openDecision24('career', o.id); const other = d()?.open;
      __close(); __restore(); workControls16(); d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30)); __close(); workControls16(); const closed = d()?.open;
      __close(); openPath16('jobs'); const pd = () => document.querySelector('.work-card2732 details.more2732'); const pwas = pd()?.open; pd()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30)); render(); const pkept = pd()?.open;
      let stored = null; try { stored = localStorage.getItem('more273:employer'); } catch (e) {}
      x.more = { was, kept, same, other, closed, stored, pwas, pkept, inSave: JSON.stringify(s).includes('more273') }; __close(); }
    // «Уволиться»: подтверждение; очередь событий как без него.
    { __restore(); s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: Math.round(c().wage), tenure: 0 } }];
      const j = s.job, salary = j.salary;
      base21.careerMenu18(); const q1 = __press('Уволиться');
      const ask = { title: __title(), job: !!s.job, pending: s.pending.map(q => q.type), income: __top()['Доход'] || '', want: money(salary / 12) + '/мес. на руки — больше не будет', main: __where('Да, уволиться') };
      let stay = null;
      if (!base) { __press('Остаться на работе'); stay = { title: __title(), job: !!s.job, pending: s.pending.map(q => q.type) }; __press('Уволиться'); __press('Да, уволиться'); }
      x.quit = { q1, ask, stay, after: { job: !!s.job, title: __title(), pending: s.pending.map(q => q.type) } }; s.pending = []; __close(); }
    // «Отклонить» предложение руководителя: подтверждение, «Вернуться» не отклоняет.
    { __restore(); s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: Math.round(c().wage), tenure: 0 } }];
      const o = careerOffer18('salary'); openDecision24('career', o.id);
      const first = __press('Отклонить'); const ask = { title: __title(), status: o.status, pending: s.pending.map(q => q.type) };
      let back = null; if (!base) { __press('Вернуться к предложению'); back = { title: __title(), status: o.status }; __press('Отклонить'); __press('Да, отклонить'); }
      x.decline = { first, ask, back, status: o.status, pending: s.pending.map(q => q.type), title: __title() }; s.pending = []; __close(); }
    // Отказ от оффера из «Заявок»: кнопка на карточке, подтверждение, очередь не двигается.
    { __restore(); (0, eval)('(' + `()=>{const x=path16();Object.assign(x.view,{fit68:'all',fte28:'all',salary270:'all',page:0});x.marketKey=null;makeVacancies16();const v=x.vacancies.find(v=>!jobEligibility16(v).why.length&&v.country===s.country);if(v){x.retry={};applyJob16(v.id);const a=x.jobApplications.at(-1);s.clock.tasks=s.clock.tasks.filter(t=>t.application!==a.id);a.status='offered';a.expires=s.clock.ticks+3;window.__v.app=a.id;}}` + ')')();
      const a = path16().jobApplications.find(a => a.id === window.__v.app);
      s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: Math.round(c().wage), tenure: 0 } }];
      openRequests58('work'); const card = [...document.querySelectorAll('.trajectory article.path-card')].find(q => (q.querySelector('button')?.getAttribute('onclick') || '').includes(a?.id));
      const btn = card && [...card.querySelectorAll('button')].find(b => __label(b) === 'Отказаться от предложения / собеседования');
      const line = card?.textContent || '';
      if (btn) btn.click();
      const ask = __title(); __press('Да, отказаться');
      x.reqDecline = { found: !!btn, ask, status: a?.status, pending: s.pending.map(q => q.type), open: $('#modal').open, deadline: /ответить до конца/.test(line), raw: /ответить за \d+ мес\./.test(line) };
      s.pending = []; __close(); }
    // Вакансии: всё, что было в списке без work2732.js, доступно; одна карточка на ставки; шанс на карточке — из игры.
    { __restore(); const xx = path16(); Object.assign(xx.view, { fit68: 'all', fte28: 'all', salary270: 'all', sort270: 'none', page: 0 }); openPath16('vacancies58');
      const ids = new Set(), cards = [];
      for (let p = 0; p < 40; p++) { xx.view.page = p; render(); const arts = [...document.querySelectorAll('#vacancy-results180 article')];
        if (!arts.length || cards.some(c => c.id && arts[0].querySelector('button')?.getAttribute('onclick')?.includes("'" + c.id + "'"))) break;
        for (const a of arts) { const own = [...a.querySelectorAll('button')].map(b => (b.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1]).filter(Boolean); own.forEach(id => ids.add(id)); cards.push({ id: own[0], all: own, text: a.textContent }); }
        if (arts.length < 6) break; }
      xx.view.page = 0;
      const want = xx.vacancies.filter(q => (typeof vacancySearchMatches180 !== 'function' || vacancySearchMatches180(q)) && matchesCareer45(q)).map(q => q.id);
      const fit = cards.slice(0, 6).map(cd => { const v = xx.vacancies.find(v => v.id === cd.id), r = jobEligibility16(v), retry = s.clock.ticks < (xx.retry?.['job-' + v.profession + '-' + v.country] || 0); return { id: cd.id, ok: r.why.length || retry ? /Не хватает:/.test(cd.text) : cd.text.includes('Шанс оффера ' + pc(r.probability * Math.min(.95, r.probability + .15))) }; });
      const groups = cards.map(cd => cd.all.map(id => id.replace(/-fte[\d.]+/, ''))).filter(g => new Set(g).size !== 1);
      const repMax = cards.every(cd => { const vs = cd.all.map(id => xx.vacancies.find(v => v.id === id)); return vs.every(v => localAmount16(vs[0].salary, vs[0].country) >= localAmount16(v.salary, v.country) - .5); });
      x.vac = { want: want.length, lost: want.filter(id => !ids.has(id)), cards: cards.length, fit, groups: groups.length, repMax,
        filters: [...document.querySelectorAll('.trajectory select')].map(s => s.getAttribute('aria-label')), visible: [...document.querySelectorAll('.trajectory select')].filter(s => !s.closest('details:not([open])')).map(s => s.getAttribute('aria-label')) }; }
    // Фоновый поиск: фильтры у переключателя, меняются на месте.
    if (!base) { __restore(); const xx = path16(); xx.search = false; s.jobSearch.enabled = false; openPath16('jobs');
      const sel = l => document.querySelector('.trajectory select[aria-label="Фоновый поиск · ' + l + '"]');
      const off = { field: !!sel('Направление'), line: document.querySelector('.search2732')?.textContent || '' };
      const other = Object.keys(fields16).find(k => k !== xx.view.field); sel('Направление').value = other; sel('Направление').dispatchEvent(new Event('change', { bubbles: true }));
      off.view = xx.view.field === other;
      document.querySelector('.search2732 button').click(); const on = { search: xx.search, snap: xx.searchView78?.field === other };
      const f2 = Object.keys(formats16).find(k => k !== xx.searchView78.format), list = xx.view.format; sel('Формат').value = f2; sel('Формат').dispatchEvent(new Event('change', { bubbles: true }));
      on.edited = xx.searchView78.format === f2 && xx.view.format === list; on.line = document.querySelector('.search2732')?.textContent || ''; on.shows = on.line.includes(fields16[other].name);
      x.search = { off, on }; xx.search = false; s.jobSearch.enabled = false; }
    // Внутренние вакансии: зарплата в месяц и разница с нынешней.
    { __restore(); base21.careerMenu18(); [...document.querySelectorAll('#modal .options button')].find(b => __label(b) === 'Внутренние вакансии и перевод').click();
      const list = internalVacancies18();
      x.internal = { title: __title(), rows: list.map(v => { const b = [...document.querySelectorAll('#modal .options button')].find(b => __label(b).startsWith(jobTitle270(v.title))); const h = b ? [...b.querySelectorAll('small')].map(q => q.textContent).join(' · ') : ''; return { hint: h, want: money(v.salary / 12) + '/мес. на руки' }; }) }; __close(); }
    __restore();
    return x;
  }, [name, base]);
}

// Замечания рецензии 273.2: каждый сценарий воспроизводит случай из замечания (только с work2732.js, телефон).
async function findingChecks(pg) {
  return pg.evaluate(async () => {
    const f = {}, vis = () => [...document.querySelectorAll('#modal .top273 .row273')].map(r => r.querySelector('dt').textContent + ': ' + r.querySelector('dd').textContent);
    const condOffer = () => { const co = company18(); const o = { id: id16('conditions-offer'), employerId: co.id, kind: 'conditions21', detail: 'load', duty: null, status: 'offered', expires: s.clock.ticks + 6, oldTitle: s.job.title, oldSalary: s.job.salary, oldGrade: co.grade, partial: false }; co.offers.push(o); return o; };
    const raw = t => (String(t).match(/Месяц \d+|месяца \d+|Игровой месяц|undefined|NaN|не число|\b(initial|negotiation|business-trip54|salary|format246)\b|\d+\.\d{3,}/g) || []);
    // 1. «Что изменится»: разрешение на работу из прошлой работы в этой стране — то, по которому игрок работает (rights31).
    { __restore(); const x = path16(), other = s.country === 'br' ? 'mx' : 'br';
      s.citizenships = [other]; s.citizenship = other;
      // Остаётся только рабочее основание в этой стране (семейное или учебное от увольнения не зависит).
      x.permits = x.permits.filter(p => p.country !== s.country || p.basis === 'work');
      if (!rights31(s.country).permit) x.permits.push({ id: 'permit-test2732', country: s.country, basis: 'work', work: true, workHours: 80, expires: s.clock.ticks + 14, source: 'earlier-job-2732' });
      const p = rights31(s.country).permit; if (p && s.job.application45 && p.source === s.job.application45) p.source = 'earlier-job-2732';
      workControls16(); __press('Уволиться');
      f.permit = { canWork: permission16(s.country, 'work'), basis: p?.basis, source: p?.source, app: s.job.application45 || null, title: __title(), docs: __top()['Документы'] || '', want: p ? 'разрешение на работу действует до ' + month273(p.expires, monthOf273) : '' }; __close(); }
    // 2–3. Предложение о новых условиях: кнопка в окне работодателя; «Отклонить» из «Обязанности и условия» — с подтверждением.
    { __restore(); const o = condOffer(); s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: 1000, tenure: 0 } }];
      workControls16(); const main = [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __label(b), disabled: b.disabled }));
      const hubBtn = main.find(m => m.label === 'Предложение руководителя');
      const p1 = __press('Предложение руководителя'); const opened = { title: __title(), labels: __mbuttons().map(__label) };
      __close(); base21.careerMenu18(); const salaryMain = [...document.querySelectorAll('#modal .main273 button')].map(__label);
      __close(); s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: 1000, tenure: 0 } }]; careerMenu18(); __press('Обязанности и условия'); __press('Предложение руководителя'); const win = __title(); __press('Отклонить');
      const ask = { title: __title(), status: o.status, pending: s.pending.map(q => q.type) };
      __press('Вернуться к предложению'); const back = { title: __title(), status: o.status };
      __press('Отклонить'); __press('Да, отклонить'); const end = { status: o.status, pending: s.pending.map(q => q.type), title: __title() };
      // То же без подтверждения (окно agreements21 без обёртки): после ответа очередь и окно — те же.
      __restore(); const o2 = condOffer(); s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: 1000, tenure: 0 } }];
      work2732Base.conditionsMenu21(); __press('Предложение руководителя'); __press('Отклонить');
      const plain = { status: o2.status, pending: s.pending.map(q => q.type), title: __title() };
      f.cond = { hubBtn, salaryMain, opened, win, ask, back, end, plain }; s.pending = []; __close(); }
    // 4. «Ещё фильтры»: «Опыт: Без опыта» — включённый фильтр, его видно на строке.
    { __restore(); const xx = path16(); Object.assign(xx.view, { page: 0, fte28: 'all', fit68: 'all', experience45: 'none' }); openPath16('vacancies58');
      f.exp = document.querySelector('details.filters2732[data-kind="vacancy-filters"] > summary')?.textContent || ''; xx.view.experience45 = 'all'; }
    // 5. Повторный отклик: карточка вакансии не обещает шанс, пока не прошёл срок.
    { __restore(); const xx = path16(); Object.assign(xx.view, { page: 0, fte28: 'all', fit68: 'all', salary270: 'all', experience45: 'all' }); openPath16('vacancies58');
      const id = (document.querySelector('#vacancy-results180 article button')?.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1];
      const v = xx.vacancies.find(v => v.id === id);
      if (v) { xx.retry['job-' + v.profession + '-' + v.country] = s.clock.ticks + 3; render(); }
      const art = id && [...document.querySelectorAll('#vacancy-results180 article')].find(a => (a.querySelector('button')?.getAttribute('onclick') || '').includes("'" + id + "'"));
      f.retry = { id, card: art?.querySelector('.vac-fit2732')?.textContent || '', want: v ? sinceMonth273(s.clock.ticks + 3) : '' }; }
    // 6. Результаты дробью («81.05000000000004/100») не выходят на экран.
    { __restore(); company18().performance = 81.05000000000004;
      workControls16(); const d = document.querySelector('#modal details.more273'); if (d) d.open = true; const hub = $('#modal').innerText;
      __close(); base21.careerMenu18(); [...document.querySelectorAll('#modal .options button')].find(b => __label(b) === 'Внутренние вакансии и перевод')?.click(); const internal = $('#modal').innerText;
      __close(); openPath16('jobs'); const panel = document.querySelector('.work-card2732')?.textContent || '';
      f.factors = { hub: raw(hub), internal: raw(internal), panel: raw(panel), internalDate: /ответ примерно в /.test(internal) && !/Ответ — через/.test(internal) }; }
    // 7. Фоновый поиск после 67 лет не обещает проверку.
    { __restore(); const xx = path16(); s.age = 68; xx.search = true; xx.searchView78 = { ...xx.view }; xx.lastSearch = s.clock.ticks - 5; xx.jobApplications.forEach(a => { if (['submitted', 'interview', 'interviewing', 'offered', 'accepted'].includes(a.status)) a.status = 'withdrawn'; });
      openPath16('jobs'); f.age = document.querySelector('.search2732 > p')?.textContent || ''; }
    // 8. Предложение обучения на панели: месяцы и часы видны до «Принять».
    { __restore(); careerOffer18('training'); openPath16('jobs'); f.training = document.querySelector('.work-card2732')?.textContent || ''; }
    // 9. «Подробнее» окна «Зарплата, повышение…» не обещает отделы.
    { __restore(); base21.careerMenu18(); const a = document.querySelector('#modal details.more273 > summary')?.textContent || '';
      const hasDep = [...document.querySelectorAll('#modal button')].some(b => /^Отделы/.test(__label(b)));
      __close(); workControls16(); const b = document.querySelector('#modal details.more273 > summary')?.textContent || '';
      f.moreHint = { salary: a, salaryDep: hasDep, hub: b }; __close(); }
    // B. Окно работодателя с предложением: нынешняя зарплата — «Сейчас», срок ответа — один раз.
    { __restore(); careerOffer18('salary'); workControls16(); const top = __top();
      const visible = [...document.querySelectorAll('#modal *')].filter(e => !e.children.length && !e.closest('details') && e.getBoundingClientRect().height > 0).map(e => e.textContent).join(' | ');
      f.offerTop = { rows: Object.keys(top), dates: (visible.match(/ответить до конца/g) || []).length }; __close(); }
    // C. После «Вернёмся к разговору после результатов»: причины с датой или кнопкой, без «когда это изменится».
    { __restore(); const c = company18(); c.months = Math.max(c.months, 20); c.performance = 60;
      c.requests.push({ id: 'neg-test2732', kind: 'salary', status: 'resolved', outcome: 'conditions', requiredPerformance: 68, revisit: s.clock.ticks + 8 }); c.review.salary = s.clock.ticks + 6;
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'overtime');
      workControls16();
      const need = [...document.querySelectorAll('#modal .need273 .fix273')].map(n => ({ button: n.tagName === 'BUTTON', text: n.querySelector('span')?.textContent || '', small: n.querySelector('small')?.textContent || '' }));
      const why = document.querySelector('#modal .main273 button .why273')?.textContent || '';
      const fix = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /Нужны результаты/.test(b.textContent));
      const tasks = s.clock.tasks.length; if (fix) fix.click(); const viaFix = { title: __title(), tasks: s.clock.tasks.length - tasks };
      __close(); s.clock.tasks = s.clock.tasks.slice(0, tasks); workControls16(); const viaOpt = __press('Дополнительный проект'); const optTasks = s.clock.tasks.length - tasks;
      __close(); workControls16(); __press('Обсудить карьерные перспективы'); const prospects = $('#modal').innerText;
      f.conditions = { need, why, viaFix, viaOpt: { title: viaOpt.title, tasks: optTasks }, prospects: raw(prospects) }; __close(); }
    // D. «Что изменится»: в «Подробнее» есть что прочитать.
    { __restore(); workControls16(); __press('Уволиться'); f.quitMore = [...document.querySelectorAll('#modal .infos273 section')].map(q => q.textContent); __close(); }
    // F. История: даты и слова вместо «Месяц 454», «initial», «business-trip54 · undefined».
    { __restore(); const c = company18(); c.history.push({ tick: s.clock.ticks - 1, type: 'business-trip54', trip: 'trip-test', cost: 1234 }, { tick: s.clock.ticks, type: 'format246', title: s.job.title, salary: s.job.salary, note: 'Формат работы: hybrid' });
      workControls16(); __press('История изменений'); const a = $('#modal').innerText;
      __close(); careerMenu18(); __press('Карьерная история'); const b = $('#modal').innerText;
      f.history = { changes: raw(a), career: raw(b), date: a.includes(dateLabel86(s.clock.ticks)) && b.includes(dateLabel86(s.clock.ticks)) }; __close(); }
    // G. Строка фонового поиска — словами, без «мне».
    { __restore(); const xx = path16(); if (!xx.search) toggleSearch16(); xx.searchView78 ??= { ...xx.view }; Object.assign(xx.searchView78, { fte28: '1', contract45: 'fixed', fit68: 'ready' }); openPath16('jobs');
      f.summary = document.querySelector('.search2732 > p')?.textContent || ''; xx.search = false; s.jobSearch.enabled = false; }
    // H. Другие часы с другим договором — договор на кнопке часов.
    { __restore(); const xx = path16(); Object.assign(xx.view, { page: 0, fte28: 'all', fit68: 'all', salary270: 'all', experience45: 'all', contract45: 'all' }); openPath16('vacancies58');
      const kind = v => !v.contract45 ? '' : v.contract45.type === 'permanent' ? 'бессрочный' : 'срочный' + (Number.isFinite(v.contract45.months) ? ' · ' + v.contract45.months + ' мес.' : '');
      const chips = [];
      for (const a of document.querySelectorAll('#vacancy-results180 article')) {
        const ids = [...a.querySelectorAll('button')].map(b => (b.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1]).filter(Boolean), rep = xx.vacancies.find(v => v.id === ids[0]);
        for (const b of a.querySelectorAll('.chip2732')) { const id = (b.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1], v = xx.vacancies.find(v => v.id === id); if (!v || !rep) continue;
          const differs = kind(v) !== kind(rep); chips.push({ differs, ok: differs ? (b.querySelector('small')?.textContent || '') === kind(v) : !b.querySelector('small') }); } }
      f.chips = { n: chips.length, differ: chips.filter(c => c.differs).length, bad: chips.filter(c => !c.ok).length }; }
    // I. «Ещё фильтры» раскрыты, пока игрок в списке; новое открытие списка — свёрнуты; в localStorage ничего.
    { __restore(); const xx = path16(); Object.assign(xx.view, { page: 0 }); openPath16('vacancies58');
      const d = () => document.querySelector('details.filters2732[data-kind="vacancy-filters"]');
      d().querySelector('summary').click(); await new Promise(r => setTimeout(r, 30)); render(); const kept = !!d()?.open;
      const sel = document.querySelector('.trajectory select[aria-label="Договор"]'); if (sel) { sel.value = 'fixed'; sel.dispatchEvent(new Event('change', { bubbles: true })); } const keptFilter = !!d()?.open;
      openPath16('jobs'); openPath16('vacancies58'); const fresh = !!d()?.open;
      let stored = null; try { stored = localStorage.getItem('more273:vacancy-filters'); } catch (e) {}
      const find = !!d()?.querySelector('.catalog-search180');
      f.filtersOpen = { kept, keptFilter, fresh, stored, find }; xx.view.contract45 = 'all'; }
    // J. Новая работа: не «0 мес. в компании».
    { __restore(); company18().months = 0; workControls16(); f.zero = document.querySelector('#modal .sub273')?.textContent || ''; __close(); }
    __restore();
    return f;
  });
}

function compare(name, out) {
  const B = out.base, N = out.new, W = out.wide;
  for (const k of Object.keys(WIN)) {
    const b = B.wins[k], n = N.wins[k], w = W?.wins[k];
    const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label)).map(l => l.label);
    check(`${name} · ${k}: ни одна кнопка не потерялась («${n.title}»)`, !lost.length, { lost, base: b.labels.map(l => l.label), new: n.labels.map(l => l.label) });
    if (k === 'hub') {
      const want = new Set([...b.labels.map(l => l.label), ...N.wins.salary.labels.map(l => l.label)]);
      const extra = n.labels.map(l => l.label).filter(l => !want.has(l));
      check(`${name} · hub: в меню тем — его темы и варианты окна зарплаты, других новых нет`, !extra.length, extra);
    } else {
      const extra = n.labels.filter(m => !b.labels.some(l => l.label === m.label)).map(m => m.label).filter(l => !/^(Да, |Вернуться к предложению|Остаться на работе)/.test(l));
      check(`${name} · ${k}: новых кнопок нет`, !extra.length, extra);
    }
    const state = b.labels.filter(l => { const m = n.labels.find(m => m.label === l.label); return m && m.disabled !== l.disabled; }).map(l => l.label);
    check(`${name} · ${k}: та же доступность кнопок`, !state.length, state);
    if (WIN[k].main) {
      check(`${name} · ${k}: «${WIN[k].main}» видна без прокрутки на 390×844` + (b.main ? ` (без карточки — ${b.main.top} px)` : ' (без карточки её в окне не было)'), n.main?.fold, n.main);
      if (w) check(`${name} · ${k}: «${WIN[k].main}» видна без прокрутки на 1280×800`, w.main?.fold, w.main);
      note(`${k}: «${WIN[k].main}» — было ${b.main ? b.main.top + ' px' + (b.main.fold ? '' : ' (за краем)') : 'нет в окне'}, стало ${n.main?.top} px`);
    }
    if (['hub', 'salary', 'decision', 'compare'].includes(k)) {
      check(`${name} · ${k}: окно с карточкой, заголовок и «?» на месте, не в «Подробнее»`, n.card && n.h2home && n.hintHome && n.title === b.title, { card: n.card, h2: n.h2home, hint: n.hintHome, title: [b.title, n.title] });
    }
  }
  for (const k of Object.keys(PANEL)) {
    const b = B.panels[k], n = N.panels[k], w = W?.panels[k];
    if (k === 'vacancies') continue; // список сверяется по вакансиям ниже
    const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label)).map(l => l.label);
    check(`${name} · панель ${k}: ни одна кнопка не потерялась`, !lost.length, { lost });
    const extra = n.labels.filter(m => !b.labels.some(l => l.label === m.label)).map(m => m.label).filter(l => !(EXTRA[k] && EXTRA[k].test(l)));
    check(`${name} · панель ${k}: новые кнопки — только оговорённые`, !extra.length, extra);
  }
  for (const k of Object.keys(PANEL)) {
    const b = B.panels[k], n = N.panels[k], w = W?.panels[k];
    if (!n.main) { note(`${k}: главной кнопки нет (${JSON.stringify(PANEL[k].main)})`); continue; }
    check(`${name} · панель ${k}: «${n.main.label}» видна без прокрутки на 390×844` + (b.main ? ` (было ${b.main.top} px${b.main.fold ? '' : ', за краем'})` : ''), n.main.fold, n.main);
    if (w?.main) check(`${name} · панель ${k}: «${w.main.label}» видна без прокрутки на 1280×800`, w.main.fold, w.main);
    // Рецензия: кнопка помещалась впритык (низ на 797–809 px из 844). Теперь под ней остаётся хотя бы 70 px.
    if (k !== 'requests') check(`${name} · панель ${k}: под «${n.main.label}» на 390×844 остаётся хотя бы 70 px`, n.main.bottom <= PHONE.height - 70, n.main);
    const was = b.main || b.alt;
    note(`панель ${k}: «${n.main.label}» — было ${was ? (was.label !== n.main.label ? '«' + was.label + '» ' : '') + was.top + ' px' + (was.fold ? '' : ' (за краем)') : 'нет'}, стало ${n.main.top} px, на 1280 — ${w?.main?.top ?? '?'} px`);
  }
  const e = N.extra, eb = B.extra;
  check(`${name}: окно работодателя — деньги в месяц из зарплаты`, e.hub.get === e.hub.want, e.hub);
  if (e.hub.wantChance) {
    check(`${name}: шанс прибавки — careerChance18, сумма +12% в месяц`, e.hub.chance === e.hub.wantChance && e.hub.note.includes('+' + e.hub.wantRaise + '/мес.'), e.hub);
    check(`${name}: настоящий разговор с согласием даёт ту сумму, что обещала карточка`, e.realRaise?.outcome === 'offer' && e.realRaise.offer === e.hub.wantRaise, { real: e.realRaise, want: e.hub.wantRaise });
    check(`${name}: панель — на кнопке прибавки шанс и сумма из игры`, e.panel.hint.startsWith(e.panel.wantHint), e.panel);
  } else check(`${name}: прибавку пока нельзя — причины строками с датой или пояснением`, e.hub.need.length > 0 && e.hub.need.every(n => n.text && n.small), e.hub);
  check(`${name}: панель — прежний заголовок (для чтения с экрана), деньги в месяц, карточка первая`, e.panel.head.startsWith(e.panel.want) && e.panel.month && e.panel.first, e.panel);
  check(`${name}: «Подробнее» запоминается по виду окна и на панели, не в сохранении`, e.more.was === false && e.more.kept === true && e.more.same === true && e.more.other === false && e.more.closed === false && e.more.stored === '0' && e.more.pwas === false && e.more.pkept === true && !e.more.inSave, e.more);
  check(`${name}: «Уволиться» — окно «Что изменится» с доходом в месяц, кнопка на первом экране`, e.quit.ask.title === 'Что изменится' && e.quit.ask.job && e.quit.ask.income === e.quit.ask.want && e.quit.ask.main?.fold, e.quit.ask);
  check(`${name}: «Остаться на работе» — работа и очередь на месте, окно работодателя открыто`, e.quit.stay?.job && e.quit.stay.pending.join() === 'offer' && e.quit.stay.title === B.wins.salary.title, e.quit.stay);
  check(`${name}: «Да, уволиться» — как без подтверждения: работы нет, очередь s.pending и окно после ответа те же`, !e.quit.after.job && !eb.quit.after.job && e.quit.after.title === eb.quit.after.title && e.quit.after.pending.join() === eb.quit.after.pending.join(), { new: e.quit.after, base: eb.quit.after });
  check(`${name}: «Отклонить» предложение — подтверждение, «Вернуться» не отклоняет, «Да» — как без подтверждения`, e.decline.ask.title === 'Отклонить?' && e.decline.ask.status === 'offered' && e.decline.back?.status === 'offered' && e.decline.status === 'declined' && eb.decline.status === 'declined' && e.decline.pending.join() === eb.decline.pending.join() && e.decline.title === eb.decline.title, { new: e.decline, base: eb.decline });
  check(`${name}: «Заявки» — отказ от оффера с подтверждением, очередь не двигается`, e.reqDecline.found && e.reqDecline.ask === 'Отказаться?' && e.reqDecline.status === 'declined' && e.reqDecline.pending.join() === 'offer' && !eb.reqDecline.found, { new: e.reqDecline, base: eb.reqDecline });
  check(`${name}: «Заявки» — срок ответа датой, без «ответить за N мес.»`, e.reqDecline.deadline && !e.reqDecline.raw, e.reqDecline);
  check(`${name}: вакансии — каждая вакансия списка доступна (карточкой или кнопкой часов)`, e.vac.want > 0 && !e.vac.lost.length && eb.vac.want === e.vac.want, { lost: e.vac.lost.slice(0, 5), want: e.vac.want, base: eb.vac.want });
  check(`${name}: вакансии — одна карточка на ставки одной вакансии, карточка по самой полной ставке`, e.vac.cards < eb.vac.cards && e.vac.groups === 0 && e.vac.repMax, { cards: e.vac.cards, base: eb.vac.cards, mixed: e.vac.groups, repMax: e.vac.repMax });
  check(`${name}: вакансии — на карточке шанс оффера из игры или «Не хватает»`, e.vac.fit.length > 0 && e.vac.fit.every(f => f.ok), e.vac.fit);
  check(`${name}: вакансии — все фильтры на месте, видны три`, eb.vac.filters.every(f => e.vac.filters.includes(f)) && e.vac.visible.join() === 'Направление,Формат,Зарплата от', { filters: e.vac.filters, visible: e.vac.visible });
  check(`${name}: фоновый поиск — фильтры у переключателя; выключен — правят список, включён — свой поиск`, e.search.off.field && e.search.off.view && e.search.on.search && e.search.on.snap && e.search.on.edited && e.search.on.shows, e.search);
  check(`${name}: внутренние вакансии — зарплата в месяц и разница с нынешней`, e.internal.rows.every(r => r.hint.includes(r.want) && /нынешней|сколько сейчас/.test(r.hint)), e.internal);
  const diff = Object.keys(B.press).filter(key => !/ \/ (Уволиться|Повышение зарплаты|Повышение в должности|Обучение за счёт работодателя)$/.test(key) && JSON.stringify(B.press[key]) !== JSON.stringify(N.press[key])).map(key => ({ key, base: B.press[key], new: N.press[key] }));
  check(`${name}: каждая старая кнопка меню тем и окна зарплаты нажимается и ведёт туда же`, !diff.length, diff);
  const asked = ['hub', 'salary'].flatMap(k => ['Повышение зарплаты', 'Повышение в должности', 'Обучение за счёт работодателя'].map(l => k + ' / ' + l)).filter(key => B.press[key] && JSON.stringify(B.press[key].changed) !== JSON.stringify(N.press[key]?.changed));
  check(`${name}: просьбы о прибавке, повышении и обучении меняют состояние так же`, !asked.length, asked.map(key => ({ key, base: B.press[key], new: N.press[key] })));
  // Замечания рецензии 273.2.
  const F = N.find;
  check(`${name}: «Что изменится» — разрешение из прошлой работы в этой стране, по которому игрок работает (rights31)`, F.permit.canWork && F.permit.basis === 'work' && F.permit.source !== F.permit.app && F.permit.title === 'Что изменится' && F.permit.docs === F.permit.want, F.permit);
  check(`${name}: предложение о новых условиях — главная кнопка в окне работодателя и в окне зарплаты, открывает «Принять» и «Отклонить»`, F.cond.hubBtn && !F.cond.hubBtn.disabled && F.cond.salaryMain.includes('Предложение руководителя') && F.cond.opened.title === 'Предложение руководителя' && ['Принять', 'Отклонить'].every(l => F.cond.opened.labels.includes(l)), F.cond);
  check(`${name}: «Обязанности и условия» → «Новые условия» → «Отклонить» — с подтверждением; очередь s.pending и окно после ответа — как без него`, F.cond.win === 'Новые условия' && F.cond.ask.title === 'Отклонить?' && F.cond.ask.status === 'offered' && F.cond.back.title === 'Новые условия' && F.cond.back.status === 'offered' && F.cond.end.status === 'declined' && F.cond.plain.status === 'declined' && F.cond.ask.pending.join() === 'offer' && F.cond.end.pending.join() === F.cond.plain.pending.join() && F.cond.end.title === F.cond.plain.title, F.cond);
  check(`${name}: «Ещё фильтры» — «без опыта» видно на строке`, /без опыта/.test(F.exp), F.exp);
  check(`${name}: карточка вакансии — «Не хватает: повторный отклик» до срока, а не шанс`, !!F.retry.id && /Не хватает/.test(F.retry.card) && F.retry.card.includes('повторный отклик') && F.retry.card.includes(F.retry.want) && !/Шанс оффера/.test(F.retry.card), F.retry);
  check(`${name}: результаты без дробных хвостов в «Почему N%», на панели и во внутренних вакансиях; ответ перевода — датой`, !F.factors.hub.length && !F.factors.internal.length && !F.factors.panel.length && F.factors.internalDate, F.factors);
  check(`${name}: фоновый поиск после 67 лет — «не идёт», без обещания проверки`, /после 67 лет/.test(F.age) && !/следующая проверка/.test(F.age), F.age);
  check(`${name}: предложение обучения на панели — месяцы и часы до «Принять»`, F.training.includes('Обучение: 3 мес. · 3 ч/нед. · платит компания'), F.training.slice(0, 400));
  check(`${name}: «Подробнее» окна зарплаты не обещает отделы (их там нет), меню тем — обещает`, !/отделы/.test(F.moreHint.salary) && !F.moreHint.salaryDep && /отделы/.test(F.moreHint.hub), F.moreHint);
  check(`${name}: окно с предложением — нынешняя зарплата «Сейчас», срок ответа один раз`, F.offerTop.rows.includes('Сейчас') && F.offerTop.rows.includes('Предлагают') && !F.offerTop.rows.includes('Получите') && F.offerTop.dates === 1, F.offerTop);
  check(`${name}: после «Вернёмся к разговору после результатов» — причины с датой или кнопкой, кнопка ведёт туда же, что «Дополнительный проект»`, F.conditions.need.length > 0 && F.conditions.need.every(n => n.small && !/когда это изменится/.test(n.small)) && F.conditions.need.some(n => n.button && /Нужны результаты 68\/100, сейчас 60/.test(n.text) && /Дополнительный проект/.test(n.small)) && F.conditions.why && !/когда это изменится/.test(F.conditions.why) && F.conditions.viaFix.title === F.conditions.viaOpt.title && F.conditions.viaFix.tasks === F.conditions.viaOpt.tasks && !F.conditions.prospects.length, F.conditions);
  check(`${name}: «Что изменится» — в «Подробнее» есть что прочитать`, F.quitMore.length > 0 && F.quitMore.every(t => t.trim()), F.quitMore);
  check(`${name}: «История изменений» и «Карьерная история» — датами и словами, без «Месяц N», «initial», «business-trip54», «undefined»`, !F.history.changes.length && !F.history.career.length && F.history.date, F.history);
  check(`${name}: строка фонового поиска — «полная ставка», «срочный договор», «подходят сейчас», без «мне»`, ['полная ставка', 'срочный договор', 'подходят сейчас'].every(w => F.summary.includes(w)) && !/(^|[^а-яё])мне([^а-яё]|$)|ставка Полная/i.test(F.summary), F.summary);
  check(`${name}: другие часы с другим договором — договор на кнопке часов`, F.chips.n > 0 && !F.chips.bad, F.chips);
  check(`${name}: «Ещё фильтры» раскрыты, пока игрок в списке, при новом открытии свёрнуты, поиск внутри, в localStorage ничего`, F.filtersOpen.kept && F.filtersOpen.keptFilter && !F.filtersOpen.fresh && F.filtersOpen.stored === null && F.filtersOpen.find, F.filtersOpen);
  check(`${name}: новая работа — «первый месяц в компании», не «0 мес.»`, /первый месяц в компании/.test(F.zero) && !/\b0 мес\./.test(F.zero), F.zero);
  check(`${name}: ошибок на странице нет`, !B.errors.length && !N.errors.length && !(W?.errors.length), { base: B.errors, new: N.errors, wide: W?.errors });
}

(async () => {
  const browser = await chromium.launch();
  try {
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    const runs = [];
    if (SAVE && fs.existsSync(SAVE)) runs.push(['owner', { raw: fs.readFileSync(SAVE, 'utf8') }]);
    else note('SAVE не задан: проверка только на новых жизнях');
    runs.push(['ru', { country: 'ru', seed: 27322 }], ['au', { country: 'au', seed: 27323 }]);
    for (const [name, opts] of runs) {
      const out = await scenario(browser, name, opts);
      if (!out) continue;
      if (BASE) { for (const k of Object.keys(WIN)) { const b = out.base.wins[k]; if (WIN[k].main) check(`${name} · ${k}: «${WIN[k].main}» видна без прокрутки на 390×844`, b.main?.fold, b.main); }
        for (const k of Object.keys(PANEL)) { const b = out.base.panels[k]; check(`${name} · панель ${k}: главная кнопка видна без прокрутки`, b.main?.fold, b.main); }
        check(`${name}: «Уволиться» с подтверждением`, out.base.extra.quit.ask.title === 'Что изменится', out.base.extra.quit.ask.title); continue; }
      compare(name, out);
    }
    const order = [...INDEX.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    check('work2732.js подключён после windows273.js, перед bootstrap61.js', BASE || order.indexOf('work2732.js') > order.indexOf('windows273.js') && order.indexOf('work2732.js') < order.indexOf('bootstrap61.js'), order.slice(-4));
    const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8'));
    check('work2732.js — в offline-assets.json', BASE || assets.includes('work2732.js'));
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без work2732.js)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
