// Проверки сборки 270, часть «работа» (jobs270.js): зарплата и формат в заголовке вакансии, фильтр «Зарплата от»,
// порядок «Сначала выше зарплата», зарплата и формат в откликах, окне оффера, внутренних вакансиях и «Моей работе».
// Игра раздаётся с диска, сервер не нужен:  node tools/verify270_jobs.js
// Файлы сборки 270, которых ещё нет в index.html, подгружаются после начала жизни в порядке будущей сборки.
// BASE=1 — прогон без jobs270.js: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const ORDER = ['films269.js', 'display269.js', 'notices270.js', 'family270.js', 'social270.js', 'jobs270.js', 'strip270.js', 'texts270.js'];
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(process.env.BASE === '1' ? ['jobs270.js'] : []);

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
    sections: [...document.querySelectorAll('#modal .detail-section20')].map(g => ({ title: g.querySelector('h3')?.textContent || '',
      rows: [...g.querySelectorAll('.detail-row20')].map(r => [r.querySelector('dt')?.textContent || '', r.querySelector('dd')?.textContent || '']) })),
    buttons: [...document.querySelectorAll('#modal .options button')].map(b => ({ label: [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('').trim(),
      hint: b.querySelector('small')?.textContent || '', disabled: b.disabled })) });
  window.__click = src => { const re = new RegExp(src); const b = [...document.querySelectorAll('#modal .options button')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); if (typeof flushSave264 === 'function') flushSave264(); };
  // Ожидаемые подписи считаются здесь заново, без функций jobs270.js, — чтобы проверка не повторяла код.
  window.__fmt = { near: 'Офис · рядом с домом', far: 'Офис · другой конец города', commute: 'Офис · поездки в другой город',
    city: 'Офис · переезд в другой город', abroad: 'Офис · переезд за рубеж', remote: 'Удалённо', hybrid: 'Гибрид' };
  window.__title = t => String(t).replace(/\s*·\s*\d+\s*ч\/нед\.\s*$/, '');
  window.__pay = v => localAmount16(v.salary, v.country);
  window.__head = v => __title(v.title) + ' · ' + money(__pay(v)) + '/год · ' + __fmt[v.format];
  // Карточки вакансий на открытом экране: заголовок, текст, id из кнопки.
  window.__cards = (root = document.querySelector('.trajectory')) => [...(root?.querySelectorAll('article.path-card') || [])].map(a => {
    const id = (a.querySelector('button')?.getAttribute('onclick') || '').match(/jobDetails16\('([^']+)'/)?.[1];
    return { id, head: a.querySelector('h3')?.textContent || '', text: a.textContent };
  }).filter(c => c.id);
  window.__count = () => +((document.querySelector('#vacancy-results180 p')?.textContent || '').match(/^(\d+) ваканс/)?.[1] ?? -1);
  // Все страницы списка по текущим фильтрам, через сам экран.
  window.__allPages = () => {
    const out = [];
    for (let page = 0; page < 60; page++) {
      path16().view.page = page;
      const box = document.createElement('div'); box.innerHTML = vacanciesView58();
      const cards = __cards(box);
      if (!cards.length) break;
      out.push(...cards);
      if (cards.length < 6) break;
    }
    path16().view.page = 0;
    return out;
  };
  window.__select = (label, value) => { const e = document.querySelector('.trajectory select[aria-label="' + label + '"]'); if (!e) return false; e.value = value; e.dispatchEvent(new Event('change', { bubbles: true })); return e.value === value; };
  window.__vac = id => path16().vacancies.find(v => v.id === id);
  // Взрослый, которому по силам отклик на начальные вакансии в информатике.
  window.__ready = () => {
    s.age = 25; s.skill = 80; s.cash = 5e6; s.clock.running = false; s.pending = [];
    const x = path16(); x.experience.skills.computing = 80; x.languages.en = 6; x.languages[country16[s.country][0]] = 6;
    if ($('#modal').open) closeModal();
  };
}

const __fmtCommute = 'Офис · поездки в другой город';
const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 500))); };

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Список вакансий: заголовок, формат, строка под заголовком.
    {
      const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'ru' });
      console.log('подгружены: ' + (loaded.join(', ') || 'ничего, всё уже в index.html'));
      await pg.evaluate(() => { __ready(); Object.assign(path16().view, { country: s.country, field: 'computing', format: 'near', page: 0, fit68: 'all', fte28: 'all' }); openPath16('vacancies58'); });
      const r = await pg.evaluate(() => {
        const cards = __cards();
        return { n: cards.length, bad: cards.filter(c => c.head !== __head(__vac(c.id))).map(c => [c.head, __head(__vac(c.id))]),
          payTwice: cards.filter(c => (c.text.match(/\/год/g) || []).length !== 1).map(c => c.text.slice(0, 200)),
          hours: cards.filter(c => !c.text.includes(__vac(c.id).hours28 + ' ч/нед. · ' + __vac(c.id).city)).map(c => c.text.slice(0, 200)),
          headHours: cards.filter(c => /ч\/нед\./.test(c.head)).length };
      });
      check('список: у каждой карточки заголовок «Профессия · зарплата/год · Офис · рядом с домом»', r.n > 0 && !r.bad.length, r);
      check('список: зарплата в карточке одна (старая строка с суммой убрана)', r.n > 0 && !r.payTwice.length, r.payTwice);
      check('список: часы, город и страна — строкой под заголовком, в заголовке часов нет', r.n > 0 && !r.hours.length && !r.headHours, r);
      for (const format of ['remote', 'hybrid', 'far', 'commute', 'city', 'abroad']) {
        const f = await pg.evaluate(format => {
          Object.assign(path16().view, { format, page: 0 }); render();
          const cards = __cards();
          return { n: cards.length, heads: cards.map(c => c.head).slice(0, 3), bad: cards.filter(c => c.head !== __head(__vac(c.id)) || !c.head.endsWith(' · ' + __fmt[format])).map(c => c.head) };
        }, format);
        check('список: формат «' + { remote: 'Удалённо', hybrid: 'Гибрид', far: 'Офис · другой конец города', commute: 'Офис · поездки в другой город', city: 'Офис · переезд в другой город', abroad: 'Офис · переезд за рубеж' }[format] + '» в заголовке', f.n > 0 && !f.bad.length, f);
      }
      const opts = await pg.evaluate(() => [...document.querySelectorAll('.trajectory select[aria-label="Формат"] option')].map(o => o.textContent));
      check('список: фильтр «Формат» называет офис, гибрид и удалёнку так же', opts.includes('Удалённо') && opts.includes('Гибрид') && opts.includes('Офис · рядом с домом') && !opts.includes('Удаленно'), opts);

      // 2. Фильтр «Зарплата от».
      await pg.evaluate(() => { Object.assign(path16().view, { format: 'near', page: 0 }); render(); });
      const f = await pg.evaluate(() => {
        const labels = [...document.querySelectorAll('.trajectory select[aria-label="Зарплата от"] option')].map(o => [o.value, o.textContent]);
        const before = __allPages(), n0 = __count();
        if (labels.length < 2) return { labels: labels.map(l => l[1]), n0, before: before.length };
        // Порог примерно в середине: часть вакансий дешевле, часть дороже.
        const pays = before.map(c => Math.round(__pay(__vac(c.id)))).sort((a, b) => a - b), mid = pays[Math.floor(pays.length / 2)];
        const step = labels.filter(([v]) => v !== 'all').map(([v, t]) => [v, +t.replace(/[^\d]/g, '')]).filter(([, a]) => a <= mid).at(-1) || labels[1];
        const chosen = __select('Зарплата от', step[0]);
        const floor = +step[1];
        const after = __allPages(), n1 = __count();
        const cheaper = before.filter(c => Math.round(__pay(__vac(c.id))) < floor).map(c => c.id);
        return { labels: labels.map(l => l[1]), chosen, value: path16().view.salary270, floor, n0, n1, before: before.length, after: after.length,
          below: after.filter(c => Math.round(__pay(__vac(c.id))) < floor).map(c => c.head), cheaper: cheaper.length,
          cheaperShown: after.filter(c => cheaper.includes(c.id)).length, selected: document.querySelector('.trajectory select[aria-label="Зарплата от"]').value };
      });
      check('фильтр: шаги «Зарплата от» — суммы в валюте страны и «Любая»', f.labels[0] === 'Любая' && f.labels.length >= 6 && f.labels.slice(1).every(t => /^[\d\s  ]+ ₽\/год$/.test(t)), f.labels);
      check('фильтр: выбор сохраняется в path16().view', f.chosen && f.value && f.value !== 'all' && f.selected === f.value, f);
      check('фильтр: дешевле порога вакансий не видно, дороже — видно', f.cheaper > 0 && f.after > 0 && !f.below.length && f.cheaperShown === 0 && f.after === f.before - f.cheaper, f);
      check('фильтр: счётчик вакансий учитывает порог', f.n1 === f.after && f.n0 === f.before && f.n1 < f.n0, f);

      // 3. Порядок «Сначала выше зарплата».
      const o = await pg.evaluate(() => {
        __select('Зарплата от', 'all');
        const order = path16().vacancies.map(v => v.id).join('|');
        const ok = __select('Порядок', 'salary');
        const list = __allPages(), pays = list.map(c => __pay(__vac(c.id)));
        const first = __cards()[0];
        const max = Math.max(...path16().vacancies.filter(v => matchesCareer45(v) && (typeof vacancySearchMatches180 !== 'function' || vacancySearchMatches180(v))).map(__pay));
        return { ok, n: list.length, sorted: pays.every((p, i) => !i || pays[i - 1] >= p), firstMax: first && Math.abs(__pay(__vac(first.id)) - max) < 1,
          kept: path16().vacancies.map(v => v.id).join('|') === order, sort: path16().view.sort270, firstHead: first?.head };
      });
      check('порядок: «Сначала выше зарплата» — по убыванию на всех страницах', o.ok && o.n > 6 && o.sorted && o.firstMax, o);
      check('порядок: сортировка только на экране, сам рынок вакансий не переставлен', o.kept && o.sort === 'salary', o);
      const sr = await pg.evaluate(() => { filterVacancies180(''); return __cards().map(c => c.head === __head(__vac(c.id))); });
      check('порядок: поиск по названию перерисовывает те же заголовки', sr.length > 0 && sr.every(Boolean), sr);

      // Фильтр и порядок переживают месяцы: рынок обновляется раз в три месяца, порог и порядок остаются.
      const m = await pg.evaluate(() => {
        __select('Зарплата от', '0.5');
        const key = path16().marketKey;
        __month(3);
        Object.assign(path16().view, { section: 'vacancies58', page: 0 }); render();
        const floor = +[...document.querySelectorAll('.trajectory select[aria-label="Зарплата от"] option')].find(o => o.selected)?.textContent.replace(/[^\d]/g, '');
        const list = __allPages(), pays = list.map(c => __pay(__vac(c.id)));
        return { newMarket: path16().marketKey !== key, salary: path16().view.salary270, sort: path16().view.sort270, floor, n: list.length,
          below: pays.filter(p => Math.round(p) < floor).length, sorted: pays.every((p, i) => !i || pays[i - 1] >= p) };
      });
      check('месяцы: после advanceMonth и нового рынка порог и порядок на месте', m.newMarket && m.salary === '0.5' && m.sort === 'salary' && m.floor > 0 && m.n > 0 && !m.below && m.sorted, m);

      // Фоновый поиск берёт порог из фильтров на момент включения.
      const b = await pg.evaluate(() => {
        const x = path16();
        x.view.sort270 = 'none';
        const view = x.view, pays = x.vacancies.filter(v => !jobEligibility16(v).why.length).map(__pay).sort((a, b) => b - a);
        const steps = [...document.querySelectorAll('.trajectory select[aria-label="Зарплата от"] option')].filter(o => o.value !== 'all').map(o => [o.value, +o.textContent.replace(/[^\d]/g, '')]);
        const high = steps.find(([, a]) => a > pays[0]) || steps.at(-1);
        if (!high) return { steps: 0 };
        x.view.salary270 = high[0]; x.search = false; toggleSearch16(); x.lastSearch = -10;
        for (const a of x.jobApplications) a.status = 'rejected';
        const n0 = x.jobApplications.length;
        __month(1);
        const none = x.jobApplications.length === n0;
        // Контроль: тот же поиск без порога откликается.
        x.view.salary270 = 'all'; x.search = false; toggleSearch16(); x.lastSearch = -10;
        __month(1);
        return { high, top: pays[0], none, control: x.jobApplications.length > n0, apps: x.jobApplications.slice(n0).map(a => a.vacancy.title) };
      });
      check('фоновый поиск: с порогом выше всех вакансий откликов нет, без порога — есть', b.none && b.control, b);
      await pg.evaluate(() => { const x = path16(); x.search = false; s.jobSearch.enabled = false; });
      check('список и фильтры: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 4. Отклик → собеседование → оффер → работа: зарплата и формат на каждом шаге.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      const a = await pg.evaluate(() => {
        __ready();
        Object.assign(path16().view, { country: s.country, field: 'computing', format: 'near', page: 0, fit68: 'all', fte28: 'all', salary270: 'all', sort270: 'none' });
        makeVacancies16();
        const v = path16().vacancies.filter(v => !jobEligibility16(v).why.length && v.fraction28 === 1).sort((a, b) => b.salary - a.salary)[0];
        if (!v) return { v: null };
        const head = __head(v);
        applyJob16(v.id);
        const app = path16().jobApplications.at(-1);
        app.roll = 0; app.interviewRoll = 0;
        openRequests58('work');
        const card = () => { const c = [...document.querySelectorAll('.trajectory article.path-card')].find(a => (a.querySelector('button')?.getAttribute('onclick') || '').includes(app.id)); return c ? { head: c.querySelector('h3').textContent, text: c.textContent } : null; };
        const submitted = card();
        __month(1); render();
        const interview = { status: app.status, card: card() };
        interview16(app.id);
        __month(1); render();
        const offered = { status: app.status, card: card() };
        return { v: v.id, head, hours: v.hours28 + ' ч/нед. · ' + v.city, appId: app.id, submitted, interview, offered };
      });
      if (!a.v) check('отклики: нашлась вакансия, на которую можно откликнуться', false, a);
      else {
        check('отклики: в карточке отправленного отклика — зарплата и формат', a.submitted?.head === a.head && a.submitted.text.includes(a.hours), a);
        check('отклики: после месяца — собеседование, заголовок тот же', a.interview.status === 'interview' && a.interview.card?.head === a.head, a.interview);
        check('отклики: оффер после собеседования — с зарплатой и форматом', a.offered.status === 'offered' && a.offered.card?.head === a.head && /Рассмотреть оффер/.test(a.offered.card.text), a.offered);
        const d = await pg.evaluate(id => { jobDetails16(id, true); const m = __modal(); closeModal(); openDecision24('job', id); const m2 = __modal(); closeModal(); return { m, m2 }; }, a.appId);
        check('оффер: в заголовке окна — должность, зарплата и формат', d.m.title === a.head && d.m2.title === a.head, { want: a.head, got: [d.m.title, d.m2.title] });
        check('оффер: «Условия» и «Деньги и дорога» — первыми, формат назван так же',
          d.m.sections[0]?.title === 'Условия' && d.m.sections[1]?.title === 'Деньги и дорога' && d.m.sections[0].rows.some(([k, v]) => k === 'Формат' && v === 'Офис · рядом с домом') && d.m.sections[1].rows.some(([k, v]) => k === 'Предлагают' && /\/год$/.test(v)),
          d.m.sections.map(g => g.title + ': ' + g.rows.map(r => r.join('=')).join('; ')));
        check('оффер: принять можно, кнопки на месте', d.m.buttons.some(b => b.label === 'Принять оффер'), d.m.buttons);

        // 5. «Моя работа».
        const w = await pg.evaluate(id => {
          acceptJob16(id); startJob16(id);
          if (!s.job) return { job: null };
          const view = () => { openPath16('jobs'); const sec = [...document.querySelectorAll('.trajectory section.path-card')].find(x => /ТЕКУЩАЯ РАБОТА/i.test(x.textContent)); return { head: sec?.querySelector('h2')?.textContent || '', text: sec?.textContent || '' }; };
          const want = j => __title(j.title) + ' · ' + money(j.salary) + '/год · ';
          const near = view(), nearWant = want(s.job) + 'Офис · рядом с домом';
          const area = s.job.workplace.area; s.job.workplace.area = area === 'center' ? 'suburb' : 'center';
          const far = view(); s.job.workplace.area = area;
          s.job.format = 'remote'; const remote = view();
          s.job.format = 'hybrid'; const hybrid = view();
          s.job.format = 'near';
          return { job: s.job.title, near, nearWant, far, farWant: want(s.job) + 'Офис · другой конец города', remote, remoteWant: want(s.job) + 'Удалённо', hybrid, hybridWant: want(s.job) + 'Гибрид' };
        }, a.appId);
        check('моя работа: заголовок «Должность · зарплата/год · Офис · рядом с домом», без часов в названии', w.job && w.near.head === w.nearWant && !/ч\/нед\.\s*·\s*\d/.test(w.near.head), w);
        // 273.2: на карточке «Моей работы» (work2732.js) дорога — в строке под должностью: «… · 20 мин дороги».
        check('моя работа: строка с дорогой вместо старой «зарплата · формат»', w.job && /Дорога до работы: \d+ мин\. в одну сторону| · \d+ мин дороги/.test(w.near.text) && (w.near.text.match(/\/год/g) || []).length === 1 && !/Очная работа|Рядом с домом/.test(w.near.text), w.near);
        check('моя работа: место в другом районе — «другой конец города»', w.job && w.far.head === w.farWant, w.far);
        check('моя работа: удалённая — «Удалённо», без дороги; гибрид — «Гибрид»', w.job && w.remote.head === w.remoteWant && !/Дорога до работы/.test(w.remote.text) && w.hybrid.head === w.hybridWant, { remote: w.remote, hybrid: w.hybrid });
        check('моя работа: у гибрида дорога названа средней («в среднем N мин.»), у офиса — без «в среднем»',
          w.job && /Дорога до работы: в среднем \d+ мин\. в одну сторону| · в среднем \d+ мин дороги/.test(w.hybrid.text) && !/в среднем/.test(w.near.text), { near: w.near.text, hybrid: w.hybrid.text });

        // 6. Внутренние вакансии в разговоре о карьере.
        const iv = await pg.evaluate(() => {
          const co = company18();
          co.months = 12; co.finance = 90; co.performance = 70;
          for (const d of co.departments21 || []) d.availability = 1;
          co.vacancyTick21 = undefined; co.marketAt = -100;
          const list = internalVacancies18();
          careerMenu18();
          const hub = __modal();
          if (!__click('^Зарплата, повышение и внутренние вакансии')) return { list: list.length, hub };
          if (!__click('^Внутренние вакансии и перевод')) return { list: list.length, menu: __modal() };
          const m = __modal(); closeModal();
          const fmt = 'Офис · рядом с домом';
          return { list: list.length, title: m.title, buttons: m.buttons, want: list.map(v => __title(v.title) + ' · ' + money(v.salary) + '/год · ' + fmt) };
        });
        check('внутренние вакансии: есть хотя бы одна', iv.list > 0, iv);
        check('внутренние вакансии: в названии варианта — зарплата и формат', iv.list > 0 && iv.title === 'Другая команда, тот же работодатель' && iv.want.every((t, i) => iv.buttons[i]?.label === t), iv);
        check('внутренние вакансии: сумма не повторяется в подсказке', iv.list > 0 && iv.buttons.every(b => !/\/год/.test(b.hint) && b.hint.length > 0), iv.buttons);
        check('внутренние вакансии: подсказка начинается с заглавной, как у соседних вариантов', iv.list > 0 && iv.buttons.every(b => /^[A-ZА-ЯЁ0-9]/.test(b.hint)), iv.buttons.map(b => b.hint.slice(0, 40)));

        // Старое предложение работы из очереди и записи без формата не ломаются.
        const legacy = await pg.evaluate(() => {
          const job = s.job;
          s.job = { title: 'Специалист на новом месте', salary: 500000, tenure: 0 };
          openPath16('jobs');
          const sec = [...document.querySelectorAll('.trajectory section.path-card')].find(x => /ТЕКУЩАЯ РАБОТА/i.test(x.textContent));
          // Место работы такой записи достраивает ensureHome (housing.js): тот же город, центр.
          const w = s.job.workplace, place = !w ? '' : w.area === s.housing.area ? ' · рядом с домом' : ' · другой конец города';
          const out = { head: sec?.querySelector('h2')?.textContent, text: sec?.textContent || '', want: 'Специалист на новом месте · ' + money(500000) + '/год · Офис' + place };
          s.job = job;
          return out;
        });
        check('моя работа: работа из старого сохранения без формата — «Офис» по месту работы', legacy.head === legacy.want && !/Очная работа/.test(legacy.text), legacy);
      }
      check('отклики, оффер и работа: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 7. Другая валюта и поздняя страна: шаги фильтра и суммы считаются по стране вакансий.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
      const r = await pg.evaluate(() => {
        __ready();
        Object.assign(path16().view, { country: 'pl', field: 'service', format: 'near', page: 0, fit68: 'all', fte28: 'all', salary270: '1', sort270: 'salary' });
        openPath16('vacancies58');
        const sel = [...document.querySelectorAll('.trajectory select[aria-label="Зарплата от"] option')].find(o => o.selected)?.textContent || '';
        const floor = +sel.replace(/[^\d]/g, '');
        const list = __allPages();
        return { sel, floor, plWage: Math.round(localAmount16(countries.pl.wage, 'pl')), n: list.length,
          bad: list.filter(c => c.head !== __head(__vac(c.id)) || Math.round(__pay(__vac(c.id))) < floor).map(c => c.head), heads: list.slice(0, 2).map(c => c.head) };
      });
      check('другая страна: порог «1» — средняя зарплата страны вакансий в текущей валюте (€)', /€\/год$/.test(r.sel) && Math.abs(r.floor - r.plWage) / r.plWage < .06, r);
      check('другая страна: заголовки и порог работают', !r.bad.length, r);
      check('другая страна: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 8. «Офис · переезд за рубеж» при своей стране в фильтре: вакансии другой страны, и шаги «Зарплата от» — по ней.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      const r = await pg.evaluate(() => {
        __ready();
        const x = path16();
        Object.assign(x.view, { country: s.country, field: 'computing', format: 'abroad', page: 0, fit68: 'all', fte28: 'all', salary270: '1', sort270: 'none' });
        openPath16('vacancies58');
        const where = [...new Set(x.vacancies.map(v => v.country))];
        const vc = where[0];
        const sel = [...document.querySelectorAll('.trajectory select[aria-label="Зарплата от"] option')].find(o => o.selected)?.textContent || '';
        const floor = +sel.replace(/[^\d]/g, '');
        const wage = localAmount16(countries[vc].wage, vc), home = localAmount16(countries[s.country].wage, s.country);
        const list = __allPages();
        // Вакансии дороже средней зарплаты своей страны, но заметно дешевле средней в стране вакансий:
        // с порогом «1» их быть не должно (с порогом по своей стране они проходили).
        const between = x.vacancies.filter(v => { const p = Math.round(__pay(v)); return p >= home * 1.06 && p < wage * .94; });
        const passing = x.vacancies.filter(v => matchesCareer45(v));
        return { where, home: s.country, sel, floor, wage: Math.round(wage), homeWage: Math.round(home), n: list.length,
          below: list.filter(c => Math.round(__pay(__vac(c.id))) < floor).map(c => c.head), between: between.length,
          betweenPass: between.filter(v => passing.includes(v)).length, above: x.vacancies.filter(v => Math.round(__pay(v)) >= floor).length, passing: passing.length };
      });
      check('за рубеж: вакансии в другой стране', r.where.length === 1 && r.where[0] !== r.home, r);
      check('за рубеж: шаг «1» — средняя зарплата страны вакансий, а не своей', Math.abs(r.floor - r.wage) / r.wage < .06 && Math.abs(r.floor - r.homeWage) / r.homeWage > .2, r);
      check('за рубеж: в списке нет вакансий дешевле порога, включая те, что дороже «домашнего» порога', r.n > 0 && !r.below.length && r.between > 0 && r.betweenPass === 0 && r.passing === r.above, r);

      // Фоновый поиск с тем же фильтром: отклик только на вакансию не дешевле порога страны вакансий.
      const b = await pg.evaluate(([floor, wage]) => {
        const x = path16();
        for (const a of x.jobApplications) a.status = 'rejected';
        x.search = false; toggleSearch16(); x.lastSearch = -10;
        const n0 = x.jobApplications.length;
        // Тот же экран, но открыт другой формат: поиск берёт фильтры на момент включения.
        Object.assign(x.view, { format: 'near', salary270: 'all' });
        __month(1);
        const apps = x.jobApplications.slice(n0).map(a => ({ title: a.vacancy.title, country: a.vacancy.country, pay: Math.round(__pay(a.vacancy)) }));
        x.search = false; s.jobSearch.enabled = false;
        return { apps, floor, wage, view: { format: x.view.format, salary270: x.view.salary270 } };
      }, [r.floor, r.wage]);
      check('за рубеж: фоновый поиск откликается только на вакансии не дешевле порога страны вакансий',
        b.apps.length === 1 && b.apps[0].country === r.where[0] && b.apps[0].pay >= b.floor && b.apps[0].pay >= b.wage * .94 && b.view.format === 'near', b);
      check('за рубеж: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }

    // 9. Настоящий наём на «Офис · поездки в другой город»: подпись в записи о первом дне и в «Моей работе» одна и та же.
    {
      const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'ru' });
      const r = await pg.evaluate(() => {
        __ready();
        const x = path16();
        Object.assign(x.view, { country: s.country, field: 'computing', format: 'commute', page: 0, fit68: 'all', fte28: 'all', salary270: 'all', sort270: 'none' });
        makeVacancies16();
        const v = x.vacancies.filter(v => !jobEligibility16(v).why.length && v.fraction28 === 1)[0];
        if (!v) return { v: null };
        applyJob16(v.id);
        const app = x.jobApplications.at(-1);
        app.roll = 0; app.interviewRoll = 0;
        __month(1); interview16(app.id); __month(1);
        const status = app.status;
        acceptJob16(app.id); startJob16(app.id);
        if (!s.job) return { v: v.id, status, job: null };
        const entry = s.log.find(e => e.title === 'Первый рабочий день');
        openPath16('jobs');
        const sec = [...document.querySelectorAll('.trajectory section.path-card')].find(q => /ТЕКУЩАЯ РАБОТА/i.test(q.textContent));
        const out = { v: v.id, status, city: v.city, home: residenceCity(), entry: entry?.text || '', head: sec?.querySelector('h2')?.textContent || '', text: sec?.textContent || '',
          want: __title(s.job.title) + ' · ' + money(s.job.salary) + '/год · ' + __fmt.commute };
        // Место работы оказалось в городе дома (как после переезда): «поездки» уже не к месту, формат — по району.
        // Дом не трогаем: адрес чинит residence62.js, а место работы — поле самой работы.
        Object.assign(s.job.workplace, { city: residenceCity(), area: s.housing.area });
        openPath16('jobs');
        const sec2 = [...document.querySelectorAll('.trajectory section.path-card')].find(q => /ТЕКУЩАЯ РАБОТА/i.test(q.textContent));
        out.moved = sec2?.querySelector('h2')?.textContent || '';
        out.movedWant = __title(s.job.title) + ' · ' + money(s.job.salary) + '/год · ' + __fmt.near;
        return out;
      });
      if (!r.v) check('поездки: нашлась вакансия в другом городе', false, r);
      else {
        check('поездки: наём прошёл до первого рабочего дня', r.status === 'offered' && r.head && r.city !== r.home, r);
        check('поездки: в записи о первом дне и в «Моей работе» — «Офис · поездки в другой город»',
          r.entry.includes(__fmtCommute) && r.head === r.want, r);
        check('поездки: место работы в городе дома, тот же район — «Офис · рядом с домом»', r.moved === r.movedWant, r);
      }
      check('поездки: без ошибок страницы', !errors.length, errors);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} проверок прошло` + (failed.length ? '; провалено: ' + failed.map(r => r.name).join(' | ') : ''));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
