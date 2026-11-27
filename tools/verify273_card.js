// Проверки сборки 273, шаг 1 (windows273.js): окно-карточка и три окна — вакансия (с откликом, собеседованием и оффером,
// в том числе из «Ожидают ответа»), программа вуза, поездка (черновик, приглашение, карточка, «Дорога и уход»).
// Игра раздаётся с диска, сервер не нужен:  node tools/verify273_card.js
// BASE=1 — прогон без windows273.js и fixes273.js: видно, какие проверки ловят старое поведение.
// SAVE=файл — ещё и на настоящем сохранении (экспорт «Ваши персонажи»; берётся последний персонаж). Без него — только
// две новые жизни. SHOTS=папка — снимки окон на этом сохранении «до» (без windows273.js) и «после», 390 и 1280.
// Что проверяется:
// • главная кнопка видна без прокрутки на 390×844 и на 1280×800; где она была без карточки (экран по счёту);
// • набор кнопок окна совпадает с окном без windows273.js — ни одна не потерялась, новые только оговорённые;
//   каждая старая кнопка нажимается и приводит туда же, куда без карточки (то же следующее окно, то же состояние);
// • числа наверху равны числам из функций игры: зарплата в месяц, шанс оффера (резюме × собеседование), шанс поступления,
//   цена учёбы, часы учёбы — те, что расписание посчитает после настоящего зачисления, цена поездки — та, что запишется
//   при бронировании;
// • перехват по точной подписи работает: кнопка согласия поездки (trips2722) планирует поездку, «Сходить в кино»
//   открывает афишу (films269), «Назад к каталогу» (workspaces58);
// • «Подробнее» запоминается по виду окна; текст окна с таблицей не пропадает; у серой кнопки видна причина;
// • ошибок на странице нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || process.env.OWNER_SAVE || '', SHOTS = process.env.SHOTS || '';
// WINDOWS273=файл — раздать вместо windows273.js другой файл (например, прежнюю версию): видно, какие проверки ловят
// старое поведение этого файла, когда остальная сборка та же.
const ALT273 = process.env.WINDOWS273 || '';
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 800 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 900) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = PHONE, base = BASE, raw = null, country = 'ru', seed = 273 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? INDEX.replace(/<script src="(windows|fixes)273\.js[^"]*"><\/script>/g, '') : rel === 'windows273.js' && ALT273 ? fs.readFileSync(ALT273) : fs.readFileSync(f);
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
    // Жизнь рождается от одного и того же зерна в обоих режимах: таймеры заставки до нажатия тоже берут случайные числа.
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
  // Подпись — текст самой кнопки без подсказок <small>. У кнопки «Не хватает» подпись — её исправление (как у кнопок
  // блока готовности trips272: «Деньги», «Визы и документы»).
  window.__label = b => b.classList.contains('fix273') ? (b.querySelector('small')?.textContent || '').replace(/\s+/g, ' ').trim() : [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  // Все кнопки окна, кроме «×». Без копии кнопки согласия из trips2722 (.ready2722-go): с карточкой сама кнопка согласия наверху.
  window.__buttons = () => [...document.querySelectorAll('#modal button')].filter(b => !b.closest('.modal-closebar38') && !b.classList.contains('ready2722-go'));
  window.__labels = () => __buttons().map(b => ({ label: __label(b), disabled: b.disabled, option: !!b.closest('.options'), handler: !!(b.onclick || b.getAttribute('onclick')), fix: b.classList.contains('fix273') }));
  window.__title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(закрыто)';
  window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
  // Положение кнопки: в пределах экрана без прокрутки и номер «экрана» окна, на котором она стоит.
  window.__where = label => {
    const m = $('#modal'); m.scrollTop = 0;
    const b = __buttons().find(b => __label(b) === label || (label instanceof RegExp && label.test(__label(b))));
    if (!b) return null;
    const r = b.getBoundingClientRect(), mr = m.getBoundingClientRect(), y = r.top - mr.top + m.scrollTop;
    return { label: __label(b), top: Math.round(r.top), bottom: Math.round(r.bottom), fold: r.top >= mr.top && r.bottom <= Math.min(mr.bottom, innerHeight) + 0.5 && r.height > 0, screen: Math.floor(y / m.clientHeight) + 1, y: Math.round(y), modalH: m.scrollHeight, disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '' };
  };
  window.__top = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd').childNodes[0]?.textContent || '']));
  window.__topNotes = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, r.querySelector('dd small')?.textContent || '']));
  window.__need = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', fix: e.tagName === 'BUTTON', small: e.querySelector('small')?.textContent || '' }));
  window.__chance = () => document.querySelector('#modal .chance273 b')?.textContent || '';
  // Окно-карточка не тупик: наверху есть главная кнопка (доступная или серая с причиной) или статус, который объясняет,
  // почему её нет.
  window.__deadEnd = () => { const m = $('#modal'); if (!m.querySelector('.top273')) return { mainOk: null }; const st = m.querySelector('.status273'); const main = [...m.querySelectorAll('.main273 button')].filter(b => b.getBoundingClientRect().height > 0 && (!b.disabled || b.querySelector('.why273')?.textContent)); return { mainOk: main.length > 0 || !!(st && !st.hidden && st.textContent.trim()), mainLabels: main.map(__label), status: st && !st.hidden ? st.textContent : '' }; };
  // Строки «Не хватает»: кнопка или дата/пояснение; строка без кнопки не похожа на кнопку (без рамки и фона).
  window.__needStyle = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => { const cs = getComputedStyle(e); return { text: e.querySelector('span')?.textContent || '', button: e.tagName === 'BUTTON', small: e.querySelector('small')?.textContent || '', looksButton: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) }; });
  // Текст, переданный в show(): каждая строка должна быть в окне (наверху или в «Подробнее»).
  window.__withText = fn => { let text = null; const real = show; show = function (t, x, ...r) { if (text === null) text = String(x ?? ''); return real.call(this, t, x, ...r); }; try { fn(); } finally { show = real; } const all = $('#modal').textContent.replace(/\s+/g, ' '); return (text || '').split(/\n+/).map(t => t.trim()).filter(Boolean).map(l => ({ line: l.slice(0, 60), shown: all.includes(l.replace(/\s+/g, ' ').slice(0, 40)) })); };
  // Серые кнопки окна: у каждой причина под подписью (своя подсказка или .why273).
  window.__greyWhy = () => [...document.querySelectorAll('#modal .options button[disabled]')].map(b => ({ label: __label(b), why: b.querySelector('.why273')?.textContent || '', hint: [...b.querySelectorAll('small:not(.why273)')].map(x => x.textContent).join(' ') }));
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
  window.__money = n => money(n);
  // Приглашение в поездку от родителя. Текущая поездка не даёт игре предложить новую — на миг её прячем.
  window.__invite = () => { const host = parents17()[0]; if (!host) return null; for (const p of parents17()) { p.bond = 90; p.inner.trust = 90; p.inner.strain = 0; p.privateCash = 1e6; }
    const x = familyTravel53(); x.lastOffer = -100; x.invitations = []; x.hosts = {};
    const busy = travel52().trips.filter(t => ['planned', 'requested', 'approved', 'away'].includes(t.status)), st = busy.map(t => t.status);
    busy.forEach(t => t.status = 'completed'); let q = null; try { q = offerTravel53(host); } finally { busy.forEach((t, i) => t.status = st[i]); }
    __v.invite = q?.id || null; return q; };
  // Нажать кнопку окна по подписи и записать, куда это привело.
  window.__press = label => {
    const b = __buttons().find(b => __label(b) === label);
    if (!b) return { missing: label };
    if (b.disabled) return { disabled: true };
    const before = { trips: travel52().trips.length, jobApps: path16().jobApplications.length, apps: path16().applications.length, tasks: s.clock.tasks.length };
    try { b.click(); } catch (e) { return { error: String(e) }; }
    const after = { trips: travel52().trips.length, jobApps: path16().jobApplications.length, apps: path16().applications.length, tasks: s.clock.tasks.length };
    return { title: __title(), changed: Object.keys(after).filter(k => after[k] !== before[k]).map(k => k + (after[k] - before[k])).join(',') };
  };
  window.__snap = () => { window.__saved = JSON.stringify(s); };
  window.__restore = () => { __close(); s = JSON.parse(window.__saved); s.pending = []; s.clock.running = false; Math.random = seeded269(2731); };
  window.save = function () {}; if (typeof flushSave264 === 'function') window.flushSave264 = function () {};
  window.DECLINE = 'Отказаться'; window.DECLINE_OLD = 'Отказаться от предложения / собеседования';
  // Замечания по виду и текстам (второй проход 273). Всё — по открытому окну-карточке.
  window.__design = () => {
    const m = $('#modal'); if (!m.open || !m.querySelector('.top273')) return null;
    m.scrollTop = 0;
    const more = m.querySelector('details.more273'), all = m.querySelector('details.all273'), was = more?.open, wasAll = all?.open;
    if (more) more.open = true; if (all) all.open = false;
    // Всё, что нажимают: кнопки и раскрывашки окна, видимые при открытом «Подробнее» (без «×» и без старой таблицы).
    const shown = e => e.getClientRects().length > 0 && !e.closest('details:not([open]) > :not(summary)') && !e.closest('.all-body273') && !e.closest('.modal-closebar38');
    const taps = [...m.querySelectorAll('button, summary')].filter(shown).map(b => ({ label: (b.tagName === 'SUMMARY' ? b.textContent : __label(b) || b.textContent).replace(/\s+/g, ' ').trim().slice(0, 50), h: Math.round(b.getBoundingClientRect().height * 10) / 10 }));
    const hint = more?.querySelector('summary small')?.textContent || '';
    const infos = [...m.querySelectorAll('.infos273 .info273')].map(s => ({ title: s.querySelector('h4').textContent, text: s.querySelector('p').textContent }));
    if (more) more.open = was; if (all) all.open = wasAll;
    const game = [...m.textContent.matchAll(/[Ии]гров\S*(\s+\S+)?/g)].map(x => x[0]).filter(t => !/студи/.test(t));
    const main = m.querySelector('.main273'), btns = main ? [...main.querySelectorAll('button')].filter(b => !b.hidden) : [];
    const need = [...m.querySelectorAll('.need273 .fix273')];
    const vb = Math.min(innerHeight, m.getBoundingClientRect().bottom);
    const covered = need.filter(b => b.tagName === 'BUTTON').flatMap(b => { const r = b.getBoundingClientRect(), x = r.left + r.width / 2; return [r.top + 4, r.top + r.height / 2, r.bottom - 4].filter(y => y > 0 && y < vb).map(y => document.elementFromPoint(x, y)).filter(e => e && e.closest('.main273')).map(() => b.querySelector('span')?.textContent || ''); });
    return { taps, hint, infos, game, all: all ? all.querySelector('.all-body273').textContent.replace(/\s+/g, ' ') : '', allLabels: [...m.querySelectorAll('.all-body273 dt')].map(d => d.textContent.replace(/^(✓ Выполнено|! Не хватает)/, '').trim()),
      sub: m.querySelector('.sub273')?.textContent || '', status: (s => s && !s.hidden ? s.textContent : '')(m.querySelector('.status273')), price: __top()['Цена'] ?? null, top: __top(),
      main: btns.map(b => ({ label: __label(b), disabled: b.disabled, top: Math.round(b.getBoundingClientRect().top), why: b.querySelector('.why273')?.textContent || '' })), sticky: main ? getComputedStyle(main).position : '', needCount: need.length, covered: [...new Set(covered)],
      others: [...m.querySelectorAll('.orig273 > button, .others273 > button')].filter(b => b.getClientRects().length || b.closest('details:not([open])')).filter(b => !b.hidden).map(__label), needFix: need.map(b => ({ text: b.querySelector('span')?.textContent || '', fix: b.tagName === 'BUTTON' ? (b.querySelector('small')?.textContent || '') : '', when: b.tagName !== 'BUTTON' ? (b.querySelector('small')?.textContent || '') : '' })),
      text: m.textContent.replace(/\s+/g, ' ') };
  };
}

// Окна сценария открываются одной функцией-строкой: одинаково в обоих режимах.
const OPEN = {
  vacancy: '()=>jobDetails16(__v.vacancy)',
  program: "()=>{openPath16('education');programDetails16(__v.program)}",
  draft: '()=>travelDraftMenu52(JSON.parse(JSON.stringify(__v.draft)))',
  card: '()=>travelTripMenu52(__v.trip)',
  road: '()=>journeyDraftMenu57(tripDraft57(travel52().trips.find(t=>t.id===__v.trip)))',
  invite: '()=>travelInviteMenu53(__v.invite)',
};
const MAIN = { vacancy: 'Отправить резюме', program: 'Подать заявку', draft: /^(Запланировать поездку|Запросить отпуск и запланировать поездку|Запросить отпуск и запланировать|Запланировать отдых)$/, invite: 'Согласиться и запланировать', road: 'Подтвердить новый план и бюджет', card: /^(Дорога и уход за питомцами|Перенести дату поездки|Отменить без расходов)$/ };
// Новые кнопки, которых нет без карточки: отказ от отклика (из «Заявок» его не было), «Подать заявку» до нужного
// возраста (раньше пряталась, теперь серая с причиной).
const EXTRA = /^(Отказаться|Подать заявку)$/;
const DECLINE = 'Отказаться', DECLINE_OLD = 'Отказаться от предложения / собеседования';

async function openWin(pg, kind) {
  return pg.evaluate(src => { __close(); (0, eval)('(' + src + ')')(); return __title(); }, OPEN[kind]);
}

// Сценарий: готовит жизнь (id окон в window.__v) и возвращает список окон.
const SETUP = {
  owner: `()=>{
    window.__v={};
    Object.assign(path16().view,{fit68:'all',fte28:'all',page:0});makeVacancies16();
    const vs=path16().vacancies, ok=vs.filter(v=>!jobEligibility16(v).why.length);
    __v.vacancy=(vs.find(v=>/community-fte1$/.test(v.id))||ok[0]||vs[0]).id;
    __v.apply=(ok.find(v=>v.id!==__v.vacancy&&v.country===s.country)||ok[0])?.id;
    __v.program=prog16('au-u7-media-master-track45-publishing')?'au-u7-media-master-track45-publishing':programs16.find(p=>p.country===s.country&&p.level==='master').id;
    __v.draft={country:'us',city:'Нью-Йорк',days:7,comfort:'standard',companion:null};
    __v.trip=travel52().trips.find(t=>['planned','requested','approved'].includes(t.status))?.id||null;
    __invite();
    return ['vacancy','program','draft','card','road','invite'].filter(k=>k==='card'||k==='road'?__v.trip:k==='invite'?__v.invite:true);
  }`,
  ru: `()=>{
    window.__v={};s.cash=Math.max(s.cash,2e6);
    Object.assign(path16().view,{fit68:'all',fte28:'all',page:0});makeVacancies16();
    const vs=path16().vacancies, ok=vs.filter(v=>!jobEligibility16(v).why.length);
    __v.vacancy=(vs.find(v=>jobEligibility16(v).why.length&&v.country===s.country)||vs[0]).id;
    __v.apply=(ok.find(v=>v.country===s.country)||ok[0])?.id;
    const here=programs16.filter(p=>p.country===s.country&&p.level==='bachelor'&&p.city===residenceCity()&&!admission16(p).why.length);
    __v.program=(here[0]||programs16.find(p=>p.country===s.country&&p.level==='bachelor')).id;
    __v.draft={country:s.country,city:cities[s.country].find(c=>c!==residenceCity()),days:7,comfort:'standard',companion:null};
    return ['vacancy','program','draft'];
  }`,
  au: `()=>{
    window.__v={};s.age=30;s.cash=5e6;activateHome();const list=cities[s.country];moveHome('rent',list[0],'center');for(const q of parents17())q.city18=list[3];
    ['Рекс','Белка','Шарик','Тоша','Луна'].forEach((name,i)=>{const roll=shelterRoll38('dog');placePet79({...roll,id:'dog-'+name,kind:'dog',name,sex38:i%2?'f':'m',months:30},'shelter',0);});
    Object.assign(path16().view,{fit68:'all',fte28:'all',page:0});makeVacancies16();
    const vs=path16().vacancies;__v.vacancy=(vs.find(v=>v.format==='remote'&&jobEligibility16(v).why.length)||vs.find(v=>v.country!==s.country)||vs[0]).id;
    __v.program=(programs16.find(p=>p.country===s.country&&p.level==='master')||programs16.find(p=>p.country===s.country)).id;
    __v.draft={country:s.country,city:list[1],days:7,comfort:'simple',companion:null,party53:[],pay53:'all'};
    travelDraftMenu52(JSON.parse(JSON.stringify(__v.draft)));
    const b=[...document.querySelectorAll('#modal .options button')].find(b=>/^Запланировать/.test(b.textContent)&&!b.disabled);if(b)b.click();__close();
    __v.trip=travel52().trips.at(-1)?.id||null;
    __invite();
    return ['vacancy','program','draft','card','road','invite'].filter(k=>k==='card'||k==='road'?__v.trip:k==='invite'?__v.invite:true);
  }`,
};

// Снимок окна: подписи, где главная кнопка, верх карточки.
async function look(pg, kind) {
  const title = await openWin(pg, kind);
  await pg.waitForTimeout(30);
  return pg.evaluate(([kind, main]) => {
    const re = main.startsWith('/') ? new RegExp(main.slice(1, -1)) : null;
    const lbls = __labels();
    const m = lbls.find(x => re ? re.test(x.label) : x.label === main);
    return { kind, title: __title(), labels: lbls, main: m ? __where(m.label) : null, top: __top(), notes: __topNotes(), need: __need(), chance: __chance(), card: !!document.querySelector('#modal .top273'), more: document.querySelector('#modal details.more273')?.open ?? null, area: document.querySelector('#modal .eyebrow')?.textContent || '', design: __design(), ...__deadEnd() };
  }, [kind, String(MAIN[kind])]);
}

async function scenario(browser, name, opts) {
  const out = {};
  // Новая жизнь рождается один раз и дальше загружается одинаково в оба режима: у жизни своё зерно, и две страницы
  // с одним Math.random всё равно дали бы разных людей.
  if (!opts.raw) {
    const P = await page(browser, { ...opts, base: true });
    opts = { ...opts, raw: await P.pg.evaluate(() => JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] })) };
    await P.ctx.close();
  }
  const modes = [['base', true, PHONE], ['new', false, PHONE], ['wide', false, WIDE], ...(SHOTS && name === 'owner' ? [['widebase', true, WIDE]] : [])];
  for (const [mode, base, vp] of modes) {
    if (BASE && mode !== 'base') continue;
    const P = await page(browser, { ...opts, base, viewport: vp });
    const kinds = await P.pg.evaluate(src => { Math.random = seeded269(2733); return (0, eval)('(' + src + ')')(); }, SETUP[name]);
    await P.pg.evaluate(() => __snap());
    const r = { kinds, wins: {}, press: {} };
    for (const k of kinds) {
      await P.pg.evaluate(() => __restore());
      r.wins[k] = await look(P.pg, k);
      if (SHOTS && name === 'owner' && ['vacancy', 'program', 'draft'].includes(k)) {
        const file = path.join(SHOTS, (k === 'draft' ? 'trip' : k) + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png');
        await P.pg.evaluate(() => { $('#modal').scrollTop = 0; });
        await P.pg.screenshot({ path: file });
      }
    }
    // Каждая кнопка: нажать в том же состоянии и записать, куда привело (только телефон).
    if (!mode.startsWith('wide')) for (const k of kinds) {
      for (const l of r.wins[k].labels) {
        await P.pg.evaluate(() => __restore());
        await openWin(P.pg, k);
        r.press[k + ' / ' + l.label] = await P.pg.evaluate(label => __press(label), l.label);
      }
    }
    if (!mode.startsWith('wide')) r.extra = await extraChecks(P.pg, name);
    // Маленький телефон (360×740): главная кнопка не закрывает строки «Не хватает».
    if (mode === 'new') {
      await P.pg.setViewportSize({ width: 360, height: 740 });
      r.small = {};
      for (const k of kinds) r.small[k] = await P.pg.evaluate(src => { __restore(); __close(); (0, eval)('(' + src + ')')(); const d = __design(); return d && { covered: d.covered, sticky: d.sticky, main: d.main.map(b => b.label + (b.disabled ? ' (серая)' : '')), need: d.needCount }; }, OPEN[k]);
      await P.pg.setViewportSize(PHONE);
    }
    r.errors = P.errors.slice();
    out[mode] = r;
    await P.ctx.close();
  }
  return out;
}

// Проверки, которые не сводятся к сравнению с окном без карточки: числа, этапы отклика, запоминание, перехваты.
async function extraChecks(pg, name) {
  return pg.evaluate(async name => {
    const x = {}, iv = p => Math.min(.95, p + .15), pc = p => Math.round(p * 100) + '%';
    __restore();
    // Вакансия: деньги в месяц и шанс оффера — из функций игры.
    { const v = path16().vacancies.find(v => v.id === __v.vacancy); jobDetails16(v.id); const r = jobEligibility16(v);
      x.vac = { get: __top()['Получите'], want: money(localAmount16(v.salary, v.country) / 12) + '/мес. на руки', chance: __chance(), wantChance: r.why.length ? '' : pc(r.probability * iv(r.probability)), hours: (__top()['Цена'] || '').startsWith((v.hours28 ?? 40) + ' ч/нед.'), need: __need(), mainWhy: __where('Отправить резюме')?.why || '' }; }
    // «Подробнее» запоминается по виду окна.
    { __restore(); jobDetails16(__v.vacancy); const d = () => document.querySelector('#modal details.more273');
      const was = d()?.open; d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30));
      __close(); jobDetails16(__v.vacancy); const kept = d()?.open;
      __close(); programDetails16(__v.program); const other = d()?.open;
      __close(); jobDetails16(__v.vacancy); d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30)); __close(); jobDetails16(__v.vacancy); const closed = d()?.open;
      let stored = null; try { stored = localStorage.getItem('more273:vacancy'); } catch (e) {}
      x.more = { was, kept, other, closed, stored, inSave: JSON.stringify(s).includes('more273') }; __close(); }
    // Программа: шанс, цена, часы — из функций игры.
    { __restore(); const p = prog16(__v.program); programDetails16(p.id);
      const old = path16().study; path16().study = { id: 't', program: p.id, status: 'active' }; const h = schedule23().study; path16().study = old;
      x.prog = { chance: __chance(), want: pc(admission16(p).probability), cost: __top()['Цена'], wantCost: money(tuition16(p, null)) + '/мес.', hours: __topNotes()['Цена'], wantHours: '≈ ' + Math.round(h) + ' ч/нед.', main: __where('Подать заявку'), table: [...document.querySelectorAll('#modal .detail-row20')].map(r => r.textContent).find(t => /^Нагрузка/.test(t)) || '' }; __close(); }
    // До нужного возраста «Подать заявку» не пропадает, а сереет с причиной.
    { __restore(); const p = prog16(__v.program), age = s.age; s.age = Math.max(6, programMinAge16(p) - 3); programDetails16(p.id); x.young = __where('Подать заявку'); x.youngNeed = __need(); s.age = age; __close(); }
    // Поездка: цена в карточке — та, что запишется при бронировании.
    { __restore(); travelDraftMenu52(JSON.parse(JSON.stringify(__v.draft))); const price = (__top()['Цена'] || '').split(' · ')[0];
      const main = __labels().find(l => tripConfirm2722.test(l.label) && !l.disabled);
      const n0 = travel52().trips.length; if (main) __press(main.label); const t = travel52().trips.length > n0 ? travel52().trips.at(-1) : null;
      x.trip = { price, booked: !!t, fee: t ? money(t.journey57?.quote?.player ?? t.fee) : null, mainLabel: main?.label || null }; __close(); }
    // «Дорога и уход»: новая цена — quoteJourney57, текст окна не пропал.
    if (__v.trip) { __restore(); const t = travel52().trips.find(t => t.id === __v.trip); const d = tripDraft57(t); journeyDraftMenu57(d);
      x.road = { price: (__top()['Цена'] || '').split(' вместо ')[0], want: money(quoteJourney57(d).player), text: /До отъезда можно изменить транспорт/.test($('#modal').textContent), pets: __top()['Питомцы'] || '' }; __close(); }
    // Отклик: резюме → собеседование → оффер; окно из «Заявок» и из «Ожидают ответа».
    if (__v.apply) {
      __restore(); applyJob16(__v.apply); const a = path16().jobApplications.at(-1); a.roll = 0; a.interviewRoll = 0;
      jobDetails16(a.id, true); x.submitted = { status: document.querySelector('#modal .status273')?.textContent || '', chance: __chance(), want: pc(a.probability * iv(a.probability)) };
      for (let i = 0; i < 4 && a.status === 'submitted'; i++) __month(1);
      jobDetails16(a.id, true); x.interview = { status: a.status, main: __where('Пройти собеседование'), decline: !!__labels().find(l => l.label === DECLINE), chance: __chance(), want: pc(iv(a.probability)) };
      __press('Пройти собеседование');
      for (let i = 0; i < 4 && a.status === 'interviewing'; i++) __month(1);
      jobDetails16(a.id, true); x.offer = { status: a.status, statusLine: document.querySelector('#modal .status273')?.textContent || '', accept: __where('Принять оффер'), decline: __where(DECLINE) }; __close();
      openDecision24('job', a.id); await new Promise(r => setTimeout(r, 0));
      x.offerDecision = { accept: __where('Принять оффер'), decline: __where(DECLINE), count: __labels().filter(l => l.label === DECLINE).length, old: __labels().filter(l => l.label === DECLINE_OLD).length, pair: [...document.querySelectorAll('#modal .main273 button')].map(b => Math.round(b.getBoundingClientRect().top)) };
      __snap2 = JSON.stringify(s);
      __press(DECLINE); x.declineAsk = __title(); __press('Вернуться к отклику'); x.declineBack = __title();
      __press(DECLINE); __press('Да, отказаться'); x.declined = a.status;
      s = JSON.parse(__snap2); const a2 = path16().jobApplications.find(q => q.id === a.id); jobDetails16(a2.id, true); __press('Принять оффер'); x.accepted = a2.status; __close();
    }
    // Настоящая учёба на сохранении: срок в окне до подачи — тот, что выйдет по темпу monthPath16 после зачисления.
    if (name === 'owner') { __restore(); const p = prog16(__v.program); s.cash = Math.max(s.cash, 1e6);
      if (admission16(p).why.some(w => /сертификат/.test(w))) path16().diplomas.push({ id: 'cert-verify273', field: p.field, level: 'certificate', track45: p.track45 || null, program46: 'verify', profileSchema46: 1, title: 'verify', university: 'verify', country: s.country, year: s.year, grade: 80, quality: 50, employment: 50 });
      programDetails16(p.id); const card = { get: __top()['Получите'] || '', cost: __top()['Цена'] || '' }; __close();
      apply16(p.id); const a = path16().applications.at(-1); if (a) { a.roll = 0; for (let i = 0; i < 8 && a.status === 'submitted'; i++) __month(1); acceptStudy16(a.id); studyStart16(a.id, 'self'); }
      const st = path16().study, p0 = st?.progress || 0; __month(3); const pace = st ? (st.progress - p0) / 3 : null;
      const months = pace ? Math.ceil(p.months / pace - 1e-9) : null;
      x.realPace = { card, started: !!st && st.program === p.id, pace, months, wantTotal: months ? money(tuition16(p, null) * months) : null }; __close(); }
    // Часы учёбы: то, что окно обещало, — то, что расписание считает после настоящего зачисления.
    if (name === 'ru') {
      __restore(); const p = prog16(__v.program); programDetails16(p.id); const promised = __topNotes()['Цена']; __close();
      apply16(p.id); const a = path16().applications.at(-1); if (a) { a.roll = 0; for (let i = 0; i < 5 && a.status === 'submitted'; i++) __month(1); acceptStudy16(a.id); studyStart16(a.id, 'self'); }
      const st = path16().study; x.study = { promised, status: a?.status, started: !!st && st.program === p.id, real: st && st.program === p.id ? '≈ ' + Math.round(schedule23().study) + ' ч/нед.' : null };
    }
    // Текст окна программы: каждая строка текста show() есть в окне (раньше пропадал из-за подписи под главной кнопкой).
    { __restore(); x.progText = __withText(() => { openPath16('education'); programDetails16(__v.program); }); __close(); }
    // «Не хватает» у вакансий: каждая строка — кнопка или с датой/пояснением; строка без кнопки не похожа на кнопку.
    // Причины берутся из всех вакансий рынка (профиль, квалификация, опыт, часы, язык, диплом, допуск).
    { __restore(); const rows = [], seen = new Set();
      for (const view of [{}, { fte28: 'all' }]) { Object.assign(path16().view, { fit68: 'all', page: 0 }, view); path16().marketKey = null; makeVacancies16();
        for (const v of path16().vacancies.filter(v => jobEligibility16(v).why.length).slice(0, 25)) { const key = jobEligibility16(v).why.map(w => w.replace(/\d+/g, '#')).join('|'); if (seen.has(key)) continue; seen.add(key);
          __close(); jobDetails16(v.id); for (const r of __needStyle()) rows.push({ vac: v.id, ...r }); } }
      x.vacNeed = rows; __close(); }
    // Профильная подготовка (specializations46): кнопка строки ставит практику именно этого профиля.
    { __restore(); Object.assign(path16().view, { fit68: 'all', page: 0 }); const v = path16().vacancies.find(v => jobEligibility16(v).why.some(w => /^Профильная подготовка/.test(w)));
      if (v) { __close(); jobDetails16(v.id); const b = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /^Практика · /.test(b.querySelector('small')?.textContent || ''));
        const n0 = s.clock.tasks.filter(t => t.kind === 'profilePractice46').length; if (b) b.click();
        x.profile = { vac: v.id, button: !!b, tasks: s.clock.tasks.filter(t => t.kind === 'profilePractice46').length - n0, back: __title() }; __close(); } }
    // Нет свободных часов (capacity() = 0, как у перегруженной недели): окно не обещает дату ответа, а говорит, что резюме
    // стоит, и даёт кнопку к нагрузке. Настоящий ход месяца подтверждает: резюме не двигается.
    { __restore(); const cap = capacity; capacity = () => 0;
      try { jobDetails16(__v.apply || __v.vacancy); x.busy = { note: __topNotes()['Цена'] || '', need: __need() }; __close();
        if (__v.apply) { applyJob16(__v.apply); const a = path16().jobApplications.at(-1); jobDetails16(a.id, true); x.busy.status = document.querySelector('#modal .status273')?.textContent || ''; __close();
          const k = s.clock.tasks.find(t => t.application === a.id); __month(1); x.busy.progress = k ? k.progress : null; x.busy.after = a.status; } }
      finally { capacity = cap; } __close(); }
    // Программа при перегруженной неделе: срок и «всего» — по темпу monthPath16, а не по каталогу.
    { __restore(); const p = prog16(__v.program), cap = capacity; capacity = () => 0;
      try { programDetails16(p.id); const old = path16().study; path16().study = { id: 't', program: p.id, status: 'active', payer: 'self', progress: 0, grades: 70 };
        let pace; try { pace = Math.max(.25, Math.min(1, capacity() / Math.max(1, totalHours() + (p.hours || 0)))); } finally { path16().study = old; }
        const months = Math.ceil(p.months / pace - 1e-9);
        x.slow = { get: __top()['Получите'] || '', cost: __top()['Цена'] || '', want: money(tuition16(p, null) * months), months, need: __need().map(n => n.text) }; }
      finally { capacity = cap; } __close(); }
    // Закрытое приглашение: статус наверху, главная кнопка «Открыть поездку» (если поездка есть), у серых кнопок причина,
    // нулевой цены нет.
    // На сохранении — прошлые приглашения из «Событий близких», на новой жизни — своё, закрытое по сроку.
    { __restore(); const q = __v.invite ? invite53(__v.invite) : (familyTravel53().invitations || []).find(q => !invitationAvailable53(q));
      if (q) { if (__v.invite) q.status = 'expired'; travelInviteMenu53(q.id); x.closedInvite = { id: q.id, was: q.status, ...__deadEnd(), price: __top()['Цена'] || '', grey: __greyWhy(), main: [...document.querySelectorAll('#modal .main273 button')].map(__label) }; __close(); } }
    // Семейная поездка ребёнка до 12 лет (notices270): своё окно, обе кнопки на виду, без карточки.
    if (name !== 'owner') { __restore(); const age = s.age; s.age = 10;
      try { const q = __invite();
        if (q && familyTripInvite270(q) && invitationAvailable53(q)) { travelInviteMenu53(q.id); x.kidInvite = { card: !!document.querySelector('#modal .top273'), buttons: __buttons().map(b => ({ label: __label(b), hidden: !!b.closest('details:not([open])') || b.getBoundingClientRect().height === 0, disabled: b.disabled })) };
          __close(); openDecision24('tripInvite53', q.id); x.kidInviteDecision = __buttons().map(b => ({ label: __label(b), hidden: !!b.closest('details:not([open])') || b.getBoundingClientRect().height === 0 })); } }
      finally { s.age = age; } __close(); }
    // Отпуск за свой счёт: цена поездки включает зарплату, которую не заплатят в месяц отъезда (clock.js), отпуск не тратится.
    if (s.job) { __restore(); travelDraftMenu52({ ...JSON.parse(JSON.stringify(__v.draft)), unpaid86: true }); const days = __v.draft.days;
      x.unpaid = { cost: __top()['Цена'] || '', note: __topNotes()['Цена'] || '', want: money(s.job.salary / 12 * Math.min(1, travelWorkDays52(days) / 22)) }; __close(); }
    // Подросток: учёбу и заявку оплачивают взрослые семьи — «Платить» не «вы».
    if (name !== 'owner') { __restore(); s.age = 16; const p = programs16.find(p => p.country === s.country && p.level === 'certificate' && p.city === residenceCity()) || programs16.find(p => p.country === s.country && p.level === 'certificate');
      programDetails16(p.id); const pay = [...document.querySelectorAll('#modal .pay273 dd > span')][0]?.textContent || ''; const adults = (typeof minorExpenseAdults137 === 'function' ? minorExpenseAdults137() : parents17()).map(q => q.name);
      x.minorPay = { pay, adults }; __close(); }
    // Отказ из «Ожидают ответа» не двигает очередь событий: событие в s.pending остаётся, окно показывает закрытый отклик.
    if (__v.apply) { __restore(); applyJob16(__v.apply); const a = path16().jobApplications.at(-1); s.clock.tasks = s.clock.tasks.filter(t => t.application !== a.id); a.status = 'offered'; a.expires = s.clock.ticks + 3;
      s.pending = [{ type: 'offer', job: { title: 'Проверочная должность', salary: Math.round(c().wage), tenure: 0 } }]; const apps = path16().jobApplications.length;
      openDecision24('job', a.id); await new Promise(r => setTimeout(r, 0)); __press(DECLINE); __press('Да, отказаться');
      x.declineQueue = { pending: s.pending.map(q => q.type), status: a.status, apps: path16().jobApplications.length - apps, open: $('#modal').open, line: document.querySelector('#modal .status273')?.textContent || '' };
      closeModal(); x.declineQueue.afterClose = s.pending.map(q => q.type); s.pending = []; __close(); }
    // Серые кнопки старых окон — с причиной (fixes273.js).
    { __restore(); x.grey = {}; for (const [k, f] of [['load', () => loadMenu29()], ['travel', () => travelMenu52()], ['money', () => paymentMenu40()], ['household', () => householdMenu54()], ['living', () => livingMenu68()], ['housing', () => housingMenu()], ['contract', () => contractMenu45()]]) {
        try { __close(); f(); } catch (e) { continue; } if ($('#modal').open) x.grey[k] = __greyWhy(); } __close(); }
    // Второй проход 273 (вид и тексты). Отпуск дома: без работы и денег строки «Цена» с нулём нет.
    { __restore(); travelDraftMenu52({ ...JSON.parse(JSON.stringify(__v.draft)), country: s.country, city: residenceCity(), stayHome86: true }); x.home = __design(); __close(); }
    // Приглашение, где ваша часть — ноль (питомцев нет): «платит …», а не «0 A$».
    if (name === 'ru') { __restore(); const q = __invite(); if (q) { travelInviteMenu53(q.id); x.zeroInvite = __design(); } __close(); }
    // Вакансия за границей: о переезде — строка «Переезд», а не ещё и вторая строка заголовка.
    { __restore(); Object.assign(path16().view, { fit68: 'all', page: 0, format: 'abroad' }); path16().marketKey = null; makeVacancies16(); const v = path16().vacancies.find(v => v.country !== s.country && v.format !== 'remote');
      if (v) { jobDetails16(v.id); x.abroad = __design(); } __close(); }
    // Статус отклика, по которому вышли на работу: «работаете» или «работали», а не «работали или работаете».
    if (__v.apply) { __restore(); applyJob16(__v.apply); const a = path16().jobApplications.at(-1); a.status = 'employed'; s.clock.tasks = s.clock.tasks.filter(t => t.application !== a.id);
      if (!s.job) s.job = { title: 'Проверка', salary: 1, tenure: 0 }; s.job.employer = a.vacancy.employer; s.job.professionId = a.vacancy.profession; jobDetails16(a.id, true); x.employedNow = __design()?.status; __close();
      s.job.employer = 'Другая компания'; jobDetails16(a.id, true); x.employedPast = __design()?.status; __close(); }
    // Карточка поездки на сохранении: отпуск согласовывали на прежние часы — статус не «Отпуск согласован», перенос
    // даты серый с причиной (rescheduleJourney57 в этом состоянии ничего не делает).
    if (name === 'owner' && __v.trip) { __restore(); travelTripMenu52(__v.trip); await new Promise(r => setTimeout(r, 0)); x.tripCard = __design(); x.tripCardMove = __greyWhy().find(g => g.label === 'Перенести дату поездки') || null; __close();
      __restore(); const t = travel52().trips.find(t => t.id === __v.trip), dep = t.departure, st = t.status; x.tripCardReschedule = { result: rescheduleJourney57(t.id), changed: t.departure !== dep || t.status !== st }; __close(); }
    // Общие исправления: текст окна с таблицей, причина у серой кнопки; перехват «Сходить в кино».
    __restore();
    nextDetail20 = { sections: [section20('Проверка', [fact20('Строка', 'значение')])] }; show('Окно с таблицей', 'Текст этого окна.', [{ label: 'Понятно', fn: () => {} }]);
    x.text = { shown: [...document.querySelectorAll('#modal p')].some(p => p.textContent === 'Текст этого окна.'), table: !!document.querySelector('#modal .detail20') }; __close();
    show('Окно с серой кнопкой', 'x', [{ label: 'Нельзя', disabled: true, why: 'Причина видна', fn: () => {} }, { label: 'Можно', fn: () => {} }]);
    x.why = document.querySelector('#modal .options button[disabled] .why273')?.textContent || ''; __close();
    const p = s.people.find(p => p.alive && p.age >= 18 && p.country === s.country);
    if (p) { show('Встречи', 'x', [{ label: 'Сходить в кино', fn: () => planMeeting53(p.id, 'cinema') }]); __press('Сходить в кино'); x.cinema = __title(); __close(); }
    __restore();
    return x;
  }, name);
}

// Второй проход 273: замечания по виду и текстам (касание ≥ 44 px на телефоне, «Подробнее» по подсказке, без «игрового»,
// без нулей и убранных макетом строк, серая кнопка не закрывает «Не хватает», тексты).
const WRONG_PLURAL = /(?<!\d)(?:\d*[02-9][1-4]|[1-4]) (?:лет|месяцев)(?![а-яё])/;
function design(name, out) {
  const N = out.new, W = out.wide, e = N.extra;
  for (const k of N.kinds) {
    const n = N.wins[k]?.design, w = W?.wins[k]?.design;
    if (!n) continue;
    const small = n.taps.filter(t => t.h < 44), smallW = (w?.taps || []).filter(t => t.h < 40);
    check(`${name} · ${k}: всё, что нажимают, не ниже 44 px на 390 и 40 px на 1280`, !small.length && !smallW.length, { phone: small, wide: smallW });
    check(`${name} · ${k}: в окне нет оговорок про «игровое»`, !n.game.length, n.game);
    const titles = n.infos.map(i => i.title.toLowerCase());
    const missing = n.hint.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).map(t => t.replace(/^почему \d+%$/, 'почему')).filter(t => !titles.some(x => x.startsWith(t) || t === 'требования' && /выполнен/.test(x)));
    check(`${name} · ${k}: «Подробнее» содержит то, что обещает подсказка («${n.hint}»)`, !missing.length, { missing, titles });
    check(`${name} · ${k}: нулей в цене нет`, n.price === null || !/(^|· )0[\s ]/.test(n.price), n.price);
    if (n.main.length && n.main.every(b => b.disabled) && n.needCount) check(`${name} · ${k}: серая главная кнопка не прилипает к низу экрана`, n.sticky !== 'sticky', { sticky: n.sticky, main: n.main });
    const sm = N.small?.[k];
    check(`${name} · ${k}: главная кнопка не закрывает «Не хватает» (390×844 и 360×740)`, !n.covered.length && !(sm?.covered.length), { phone: n.covered, small: sm });
    check(`${name} · ${k}: окончания у чисел верные (нет «52 лет», «24 месяцев»)`, !WRONG_PLURAL.test(n.text), (n.text.match(WRONG_PLURAL) || [''])[0]);
    const met = n.infos.find(i => /выполнен/i.test(i.title));
    if (met) check(`${name} · ${k}: «${met.title}» — одной строкой, без очевидного («повторная подача», «местоположение», сырые подписи)`, !/Повторная подача|повторной подачи|Местоположение|Совместимость со статусом|Право работать в стране/.test(met.text) && /^[А-ЯЁ][^А-ЯЁ]*(«[^»]*»[^А-ЯЁ]*)*$/.test(met.text.replace(/[A-C][12]|[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+(?= —)/g, '')), met.text);
    if (k === 'vacancy') {
      const gone = ['Источник', 'Ставка100%', 'Переезд не требуется', 'Новое рабочее разрешение не требуется', 'Повторная подачаДоступна'].filter(t => n.all.includes(t));
      check(`${name} · vacancy: «Все условия» без того, что макет убрал`, !gone.length, gone);
      check(`${name} · vacancy: договор словами («срочный договор на 2 года»), не «· 24 мес.»`, !/договор · \d+ мес\./.test(n.price || ''), n.price);
    }
    if (k === 'program') {
      const gone = ['Где', 'Ступень', 'Направление', 'Длительность', 'Срок повторной подачи', 'Ответ комиссии'].filter(t => n.allLabels.includes(t));
      check(`${name} · program: «Все условия» без «Где», «Ступень», «Направление», «Длительность» и выполненных проверок`, !gone.length, gone);
      const why = n.infos.find(i => /^Почему/.test(i.title))?.text || '';
      check(`${name} · program: «Почему» — без «конкурс N/100», селективность одним числом`, !/конкурс \d+\/100/.test(why), why);
      const prof = n.needFix.some(f => /профил|сертификат/i.test(f.text));
      check(`${name} · program: «Выполнено» не спорит с «Не хватает» и называется «Остальное выполнено», когда чего-то не хватает`, !met || (!prof || !/подготовка по направлению/i.test(met.text)) && met.title === (n.needCount ? 'Остальное выполнено' : 'Требования выполнены'), { met, need: n.needFix });
      check(`${name} · program: в «Подробнее» — «Кто платит» и «Что даёт»`, titles.includes('кто платит') && (titles.includes('что даёт') || !/Профессии/.test(n.all)), titles);
    }
    if (k === 'road') {
      check(`${name} · road: подзаголовок «7 дней · месяц год · …», месяц строчными`, /^\d+ (день|дня|дней) · [а-яё]+ \d{4} · /.test(n.sub), n.sub);
      const where = n.infos.find(i => i.title === 'Кто где');
      if (/Питомцы|Собаки|Кошки/.test(Object.keys(n.top).join())) check(`${name} · road: «Кто где» с ценой ухода и «Из чего цена»`, !!where && /по |бесплатно|\d/.test(where.text) && titles.some(t => t === 'из чего цена' || t === 'оплата'), n.infos);
    }
    if (k === 'card') check(`${name} · card: подзаголовок «Месяц год · …», дни — только в «Получите»`, /^[А-ЯЁ][а-яё]+ \d{4} · /.test(n.sub) && !/\d+ (дн|день|дня|дней)/.test(n.sub), n.sub);
  }
  if (e.home) check(`${name}: отпуск дома — строки «Цена» с нулём нет`, e.home.price === null || !/(^|· )0[\s ]/.test(e.home.price), e.home.price);
  if (e.zeroInvite) check(`${name}: приглашение без вашей доли — «платит …», а не «0»`, !/(^|· )0[\s ]/.test(e.zeroInvite.price || ''), e.zeroInvite.price);
  if (e.abroad) check(`${name}: вакансия за границей — переезд одной строкой «Переезд», не в заголовке`, !/переезд/.test(e.abroad.sub) && 'Переезд' in e.abroad.top, { sub: e.abroad.sub, top: e.abroad.top });
  if (e.employedNow !== undefined) check(`${name}: статус отклика с работой — «Вы работаете здесь» / «Вы здесь работали»`, e.employedNow === 'Вы работаете здесь' && e.employedPast === 'Вы здесь работали', { now: e.employedNow, past: e.employedPast });
  if (e.offerDecision) check(`${name}: оффер — «Принять оффер» и «Отказаться» в один ряд, без второй кнопки отказа`, e.offerDecision.count === 1 && e.offerDecision.old === 0 && e.offerDecision.pair.length === 2 && e.offerDecision.pair[0] === e.offerDecision.pair[1], e.offerDecision);
  if (e.tripCard) check(`${name}: карточка поездки — не «Отпуск согласован», когда нужно новое согласование; перенос даты серый с причиной`, e.tripCard.status !== 'Отпуск согласован' && e.tripCard.needFix.every(f => !/нужно новое согласование/.test(f.text) || f.fix || f.when) && (!e.tripCard.needFix.some(f => /нужно новое согласование/.test(f.text)) || e.tripCardReschedule.result === false && !!e.tripCardMove?.why && e.tripCard.needFix.some(f => /при отъезде поездка отменится/.test(f.when))), { status: e.tripCard.status, need: e.tripCard.needFix, move: e.tripCardMove, reschedule: e.tripCardReschedule });
  const draft = N.wins.draft?.design;
  if (draft && draft.needFix.some(f => /: нужны .+ на оформление$/.test(f.text))) check(`${name}: черновик — документы кнопкой «Оформить документы · …», без повтора в «Других действиях»`, draft.needFix.filter(f => /: нужны .+ на оформление$/.test(f.text)).every(f => /^Оформить документы · /.test(f.fix) && !/: (visa|eta|esta|keta|evisa),/.test(f.fix)) && !draft.others.some(l => /^Оформить документы/.test(l)), { need: draft.needFix, others: draft.others });
}

function compare(name, out) {
  const B = out.base, N = out.new, W = out.wide;
  for (const k of B.kinds) {
    const b = B.wins[k], n = N.wins[k], w = W?.wins[k];
    if (!n) { check(`${name}: окно «${k}» открылось с карточкой`, false, 'нет окна'); continue; }
    check(`${name} · ${k}: окно с карточкой («${n.area}»)`, n.card && n.title === b.title, { base: b.title, new: n.title, area: n.area });
    // «Визы и документы» (кнопка готовности trips272) открывала то же окно, что «Визы и условия въезда»; теперь строка
    // документов ведёт прямо к «Оформить документы · …».
    const sameAs = (l, other) => n.labels.some(m => m.label === other) && N.press[k + ' / ' + other]?.title === B.press[k + ' / ' + l]?.title;
    const replaced = l => l === 'Визы и документы' && n.labels.some(m => m.fix && /^Оформить документы · /.test(m.label)) && sameAs(l, 'Визы и условия въезда');
    const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label) && !replaced(l.label)).map(l => l.label);
    const extra = n.labels.filter(m => !m.fix && !b.labels.some(l => l.label === m.label)).map(m => m.label).filter(l => !EXTRA.test(l));
    check(`${name} · ${k}: ни одна кнопка не потерялась, новых нет`, !lost.length && !extra.length, { lost, extra });
    // «Перенести дату поездки» серая с причиной там, где без карточки она ничего не делала (rescheduleJourney57 отказывает).
    const allowed = l => l === 'Перенести дату поездки' && k === 'card' && N.extra.tripCardReschedule?.result === false && !N.extra.tripCardReschedule.changed && !!N.extra.tripCardMove?.why;
    const state = b.labels.filter(l => { const m = n.labels.find(m => m.label === l.label && m.option === l.option) || n.labels.find(m => m.label === l.label); return m && (m.disabled !== l.disabled || m.handler !== l.handler || m.option !== l.option) && !(allowed(l.label) && m.disabled && !l.disabled); }).map(l => l.label);
    check(`${name} · ${k}: у каждой кнопки та же доступность, обработчик и место среди вариантов`, !state.length, state);
    const diff = Object.keys(B.press).filter(key => key.startsWith(k + ' / ') && JSON.stringify(B.press[key]) !== JSON.stringify(N.press[key]) && !(allowed(key.slice(k.length + 3)) && N.press[key]?.disabled && !B.press[key]?.changed) && !replaced(key.slice(k.length + 3))).map(key => ({ key, base: B.press[key], new: N.press[key] }));
    check(`${name} · ${k}: каждая старая кнопка нажимается и ведёт туда же`, !diff.length, diff);
    if (n.main) {
      check(`${name} · ${k}: главная кнопка «${n.main.label}» видна без прокрутки на 390×844` + (b.main ? ` (без карточки — ${b.main.screen}-й экран, ${b.main.y} px)` : ''), n.main.fold, n.main);
      if (w?.main) check(`${name} · ${k}: главная кнопка видна без прокрутки на 1280×800`, w.main.fold, w.main);
      if (n.main.disabled) check(`${name} · ${k}: серая главная кнопка — с причиной под подписью`, !!n.main.why, n.main);
      note(`${k}: «${n.main.label}» — было ${b.main ? b.main.screen + '-й экран (' + b.main.y + ' px из ' + b.main.modalH + ')' : 'нет'}, стало ${n.main.y} px из ${n.main.modalH}, на 1280 — ${w?.main?.y ?? '?'} px`);
    }
    const needOk = n.need.every(x => x.fix || x.small);
    check(`${name} · ${k}: каждая строка «Не хватает» — кнопка, дата или пояснение`, needOk, n.need);
    if (n.mainOk !== null) check(`${name} · ${k}: не тупик — главная кнопка доступна или статус объясняет, почему её нет`, n.mainOk, { main: n.mainLabels, status: n.status });
  }
  const spanOf = m => m >= 12 && m % 12 === 0 ? (m / 12) + ' ' + ((y => { const a = y % 100, b = y % 10; return a > 10 && a < 20 ? 'лет' : b === 1 ? 'год' : b >= 2 && b <= 4 ? 'года' : 'лет'; })(m / 12)) : m + ' мес.';
  const e = N.extra;
  if (e.vac) {
    check(`${name}: вакансия — деньги в месяц из зарплаты вакансии`, e.vac.get === e.vac.want, e.vac);
    check(`${name}: вакансия — шанс оффера = резюме × собеседование`, e.vac.chance === e.vac.wantChance, e.vac);
    check(`${name}: вакансия — часы из вакансии`, e.vac.hours, e.vac);
  }
  check(`${name}: «Подробнее» запоминается по виду окна, не в сохранении`, e.more.was === false && e.more.kept === true && e.more.other === false && e.more.closed === false && e.more.stored === '0' && !e.more.inSave, e.more);
  check(`${name}: программа — шанс поступления из admission16`, e.prog.chance === e.prog.want, e.prog);
  check(`${name}: программа — цена из tuition16, часы из расписания`, (e.prog.cost || '').startsWith(e.prog.wantCost) && (e.prog.hours || '').startsWith(e.prog.wantHours), e.prog);
  check(`${name}: программа — в таблице «Нагрузка» те же часы расписания`, e.prog.table.includes(e.prog.wantHours), e.prog.table);
  check(`${name}: программа — «Подать заявку» видна без прокрутки`, e.prog.main?.fold, e.prog.main);
  check(`${name}: программа до нужного возраста — «Подать заявку» серая с причиной, а не спрятана`, e.young?.disabled && /лет/.test(e.young.why) && e.youngNeed.some(n => /^Возраст — с \d+ лет/.test(n.text) && /^через/.test(n.small)) && B.extra?.young == null, { young: e.young, need: e.youngNeed, base: B.extra?.young });
  if (e.trip.booked) check(`${name}: поездка — кнопка «${e.trip.mainLabel}» (перехват trips2722) планирует поездку, цена та же, что записана`, e.trip.price === e.trip.fee, e.trip);
  else note(`${name}: поездка не планируется в этом состоянии (${JSON.stringify(e.trip)})`);
  if (e.road) {
    check(`${name}: «Дорога и уход» — новая цена из quoteJourney57`, e.road.price === e.road.want, e.road);
    check(`${name}: «Дорога и уход» — текст окна не пропал`, e.road.text, e.road);
  }
  if (e.offer && B.extra?.offer) note(`оффер: «Принять оффер» — было ${B.extra.offer.accept ? B.extra.offer.accept.screen + '-й экран (' + B.extra.offer.accept.y + ' px из ' + B.extra.offer.accept.modalH + ')' : 'нет'}, стало ${e.offer.accept?.y} px из ${e.offer.accept?.modalH}; из «Ожидают ответа» было ${B.extra.offerDecision?.accept ? B.extra.offerDecision.accept.screen + '-й экран' : 'нет'}, стало ${e.offerDecision?.accept?.y} px`);
  if (e.submitted) {
    check(`${name}: отклик — шанс оффера после отправки резюме (резюме × собеседование)`, e.submitted.chance === e.submitted.want && /Резюме отправлено/.test(e.submitted.status), e.submitted);
    check(`${name}: собеседование — кнопка на первом экране, шанс собеседования`, e.interview.status === 'interview' && e.interview.main?.fold && e.interview.chance === e.interview.want, e.interview);
    check(`${name}: оффер — статус со сроком, «Принять» и «Отказаться» на первом экране`, e.offer.status === 'offered' && /^Оффер · ответить до конца/.test(e.offer.statusLine) && e.offer.accept?.fold && e.offer.decline?.fold, e.offer);
    check(`${name}: оффер из «Ожидают ответа» — то же, отказ одной кнопкой`, e.offerDecision.accept?.fold && e.offerDecision.decline?.fold && e.offerDecision.count === 1, e.offerDecision);
    check(`${name}: отказ — с подтверждением, «Вернуться» возвращает к офферу, «Да» отклоняет`, e.declineAsk === 'Отказаться?' && e.declineBack === e.offer.title || (e.declineAsk === 'Отказаться?' && /Комьюнити|·/.test(e.declineBack)), { ask: e.declineAsk, back: e.declineBack });
    check(`${name}: отказ записан, принять оффер можно`, e.declined === 'declined' && e.accepted === 'accepted', { declined: e.declined, accepted: e.accepted });
  }
  if (e.study) check(`${name}: часы учёбы в окне — те, что расписание считает после зачисления`, e.study.started && e.study.promised.startsWith(e.study.real), e.study);
  check(`${name}: текст окна с таблицей не пропадает`, e.text.shown && e.text.table, e.text);
  check(`${name}: программа — весь текст окна на месте (в «Подробнее»)`, e.progText.length > 0 && e.progText.every(l => l.shown), e.progText.filter(l => !l.shown));
  check(`${name}: вакансии — каждая строка «Не хватает» кнопка или с датой, строка без кнопки не похожа на кнопку`, e.vacNeed.length > 0 && e.vacNeed.every(r => r.button || r.small && !r.looksButton), e.vacNeed.filter(r => !(r.button || r.small && !r.looksButton)));
  if (e.profile) check(`${name}: профильная подготовка — кнопка строки ставит практику профиля и возвращает к вакансии`, e.profile.button && e.profile.tasks === 1 && e.profile.back !== '(закрыто)', e.profile);
  else note(`${name}: вакансий с нехваткой профильной подготовки нет`);
  check(`${name}: нет свободных часов — окно вакансии не обещает дату ответа и ведёт к нагрузке`, /ответа не будет/.test(e.busy.note) && e.busy.need.some(n => /Свободного времени/.test(n.text) && n.fix), e.busy);
  if (e.busy.status !== undefined) check(`${name}: нет свободных часов — отклик без даты, и резюме правда не двигается`, /ответа не будет/.test(e.busy.status) && e.busy.progress === 0 && e.busy.after === 'submitted', e.busy);
  check(`${name}: перегруженная неделя — срок и «всего» программы по темпу учёбы, строка про время`, e.slow.get.includes(spanOf(e.slow.months)) && e.slow.cost.includes(e.slow.want) && e.slow.need.some(t => /^Свободного времени — \d+ ч\/нед\.$/.test(t)), e.slow);
  if (e.realPace) check(`${name}: учёба после настоящего зачисления идёт так, как обещало окно (срок и «всего»)`, e.realPace.started && e.realPace.card.get.includes(spanOf(e.realPace.months)) && e.realPace.card.cost.includes(e.realPace.wantTotal), e.realPace);
  if (e.closedInvite) check(`${name}: закрытое приглашение — статус наверху, нет нулевой цены, у серых кнопок причина`, e.closedInvite.mainOk && /закрыто|завершена|запланирована|отказались/.test(e.closedInvite.status) && !/^0\s/.test(e.closedInvite.price) && e.closedInvite.grey.every(g => g.why || g.hint), e.closedInvite);
  if (e.kidInvite) check(`${name}: семейная поездка ребёнка — окно без карточки, «Поехать с …» и «Остаться дома» на виду`, !e.kidInvite.card && e.kidInvite.buttons.some(b => /^Поехать с /.test(b.label) && !b.hidden && !b.disabled) && e.kidInvite.buttons.some(b => b.label === 'Остаться дома' && !b.hidden) && e.kidInviteDecision.every(b => !b.hidden), e.kidInvite);
  else if (name !== 'owner') note(`${name}: приглашение ребёнку не создалось`);
  if (e.unpaid) check(`${name}: отпуск за свой счёт — в цене зарплата, которую не заплатят, отпуск не тратится`, e.unpaid.cost.includes('+ ' + e.unpaid.want + ' зарплаты') && /без оплаты/.test(e.unpaid.note) && !/^отпуск /.test(e.unpaid.note), e.unpaid);
  if (e.minorPay) check(`${name}: в 16 лет «Платить» — взрослые семьи, а не «вы»`, e.minorPay.pay !== 'вы' && e.minorPay.adults.length > 0 && e.minorPay.adults.every(n => e.minorPay.pay.includes(n)), e.minorPay);
  if (e.declineQueue) check(`${name}: отказ из «Ожидают ответа» не двигает очередь событий`, e.declineQueue.pending.join() === 'offer' && e.declineQueue.afterClose.join() === 'offer' && e.declineQueue.apps === 0 && e.declineQueue.status === 'declined' && e.declineQueue.open && /Отклонено вами/.test(e.declineQueue.line), e.declineQueue);
  const grey = Object.entries(e.grey || {}).flatMap(([k, list]) => list.filter(g => !g.why && !g.hint).map(g => k + ': ' + g.label));
  check(`${name}: старые окна — у каждой серой кнопки причина (${Object.entries(e.grey || {}).map(([k, l]) => k + ' ' + l.length).join(', ')})`, !grey.length, grey);
  check(`${name}: у серой кнопки видна причина`, e.why === 'Причина видна', e.why);
  if (e.cinema) check(`${name}: «Сходить в кино» по-прежнему открывает афишу`, e.cinema === B.extra?.cinema || (!B.extra && /кино|Афиша|фильм/i.test(e.cinema)), { base: B.extra?.cinema, new: e.cinema });
  design(name, out);
  check(`${name}: ошибок на странице нет`, !B.errors.length && !N.errors.length && !(W?.errors.length), { base: B.errors, new: N.errors, wide: W?.errors });
}

(async () => {
  const browser = await chromium.launch();
  try {
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    const runs = [];
    if (SAVE && fs.existsSync(SAVE)) runs.push(['owner', { raw: fs.readFileSync(SAVE, 'utf8') }]);
    else note('SAVE не задан: проверка только на новых жизнях');
    runs.push(['ru', { country: 'ru', seed: 2731 }], ['au', { country: 'au', seed: 2732 }]);
    for (const [name, opts] of runs) {
      const out = await scenario(browser, name, opts);
      if (BASE) { for (const k of out.base.kinds) { const b = out.base.wins[k]; check(`${name} · ${k}: окно с карточкой`, b.card, b.title); if (b.main) check(`${name} · ${k}: главная кнопка видна без прокрутки на 390×844`, b.main.fold, b.main); } continue; }
      compare(name, out);
    }
    // Порядок подключения: windows273.js — последним перед bootstrap61.js.
    /* 275.3: между ними могут стоять только файлы сборок новее 273 (illness2753.js оборачивает уже саму карточку). */
    const order = [...INDEX.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    const after273 = order.slice(order.indexOf('windows273.js') + 1, order.indexOf('bootstrap61.js'));
    check('windows273.js подключён последним перед bootstrap61.js (после него — только сборки новее 273)', BASE || order.indexOf('windows273.js') >= 0 && order.indexOf('windows273.js') < order.indexOf('bootstrap61.js') && after273.every(f => +(/(\d{3})\d*\.js$/.exec(f)?.[1] || 0) > 273), order.slice(-4));
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без windows273.js)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
