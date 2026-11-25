// Проверки сборки 272, часть «обучение» (learning272.js): «Обучение и практика» в портфолио открывает окно
// направления, «Взять ученика» находит ученика, когда круг пуст, недоступные варианты выключены с причиной,
// «Программы обучения» на телефоне ведут к каталогу на центральной панели.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify272_learning.js
// OWNER_SAVE=путь/к/сохранению.json — ещё и на настоящем сохранении (последний персонаж в файле; ожидается взрослый
// с большим литературным портфолио и навыком 100). Без него — только синтетические персонажи.
// BASE=1 — прогон без learning272.js: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const OWNER = process.env.OWNER_SAVE && fs.existsSync(process.env.OWNER_SAVE) ? process.env.OWNER_SAVE : null;
const SHOTS = process.env.SHOTS || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
const PHONE = { width: 390, height: 844 }, DESKTOP = { width: 1280, height: 900 };

async function page(browser, { owner = null, viewport = DESKTOP, country = 'it' } = {}) {
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
  });
  if (!BASE && !INDEX.includes('learning272.js')) await pg.addScriptTag({ path: path.join(ROOT, 'learning272.js') });
  return { pg, errors, ctx };
}

// Окно сейчас: заголовок, текст, варианты с подсказкой и выключенностью.
const modal = pg => pg.evaluate(() => {
  const d = $('#modal');
  const opts = [...d.querySelectorAll('.options button')].map(b => {
    const small = b.querySelector('small'), hint = small ? small.textContent.replace(/\s*\n\s*/g, ' · ').trim() : '';
    return { label: (small ? b.textContent.slice(0, b.textContent.length - small.textContent.length) : b.textContent).trim(), hint, disabled: b.disabled };
  });
  return { open: d.open, title: d.querySelector('h2')?.textContent || '', text: [...d.querySelectorAll('p')].map(p => p.textContent).join('\n'), opts };
});
const opt = (m, label) => m.opts.find(o => o.label === label) || m.opts.find(o => o.label.startsWith(label));
const toastText = pg => pg.evaluate(() => document.querySelector('.toast')?.textContent || '');
// Настоящий клик по варианту открытого окна; нет такого варианта — false (в BASE=1 окна может не быть).
const clickOpt = async (pg, label) => {
  const b = pg.locator('#modal[open] .options button:not([disabled])').filter({ hasText: label }).first();
  if (!await b.count()) return false;
  await b.click({ timeout: 5000 });
  return true;
};
const LEARN_LABELS = ['Запланировать практику', 'Найти наставника', 'Взять ученика', 'Провести мастер-класс', 'Курсы и контракты',
  'Подготовительный сертификат', 'Программы обучения', 'Назад'];
const openLearning = async (pg, track) => {
  await pg.evaluate(t => creativeTrackMenu47(t), track);
  await clickOpt(pg, 'Обучение и практика');
  await pg.waitForTimeout(120);
  return modal(pg);
};
const mentoringTask = pg => pg.evaluate(() => {
  const t = s.clock.tasks.find(t => t.kind === 'mentoring194' && !['completed', 'cancelled'].includes(t.state));
  const p = t && living(t.person194);
  return t ? { label: t.label, role: t.role194, hours: t.hours, person: p && { id: p.id, name: p.name, age: p.age, city: p.city18, country: p.country, interests: p.interests18, ctx: p.contexts48, occupation: p.occupation }, me: { age: s.age, city: residenceCity(), country: s.country } } : null;
});
const catalogInView = pg => pg.evaluate(() => {
  const h = document.querySelector('[data-panel="center"] .trajectory h1'), b = h?.getBoundingClientRect();
  return { panel: s.ui05.panel, tab, section: path16().view.section, modal: $('#modal').open, head: h?.textContent || '', top: b ? Math.round(b.top) : null, bottom: b ? Math.round(b.bottom) : null, inView: !!b && b.top >= 0 && b.bottom <= innerHeight };
});
const noOverflow = pg => pg.evaluate(() => {
  const d = $('#modal'), r = d.getBoundingClientRect();
  return { page: document.scrollingElement.scrollWidth <= innerWidth + 1, modal: r.left >= -1 && r.right <= innerWidth + 1, buttons: [...d.querySelectorAll('.options button')].every(b => { const q = b.getBoundingClientRect(); return q.left >= -1 && q.right <= innerWidth + 1; }) };
});

// Синтетический персонаж: возраст и, по желанию, портфолио, которого хватает для преподавания, и пустые круги.
const setup = (pg, o) => pg.evaluate(o => {
  s.age = o.age;
  s.clock.tasks = s.clock.tasks.filter(t => !['mentoring194', 'course195', 'profilePractice46'].includes(t.kind));
  if (o.teacher) {
    const works = creative47().works;
    for (let i = 0; i < 3; i++) works.push({ id: 'verify272-' + i, track: 'literature', title: 'Проверка ' + (i + 1), quality: 80, kind: 'sample', completed: s.clock.ticks });
    specialtyState46().skills.literature = 70;
  }
  if (o.cash != null) s.cash = o.cash;
  if (o.saturated) circles48().created = 24;
  save(); if (typeof flushSave264 === 'function') flushSave264();
}, o);

(async () => {
  const browser = await chromium.launch();
  const errorsAll = [];

  if (OWNER) {
    // 1. Сохранение владелицы, широкий экран: окно направления и «Взять ученика».
    {
      const { pg, errors, ctx } = await page(browser, { owner: OWNER });
      const m = await openLearning(pg, 'literature');
      check(m.open && /Обучение и практика · Литературоведение и редактура/.test(m.title), 'сохранение: «Обучение и практика» открывает окно направления, а не каталог', m.title || 'окно закрыто');
      check(LEARN_LABELS.every((l, i) => m.opts[i]?.label === l), 'сохранение: варианты окна по порядку', m.opts.map(o => o.label).join(' | '));
      const teach = opt(m, 'Взять ученика');
      check(teach && !teach.disabled, 'сохранение: «Взять ученика» доступно', teach ? teach.hint : 'нет кнопки');
      const practice = opt(m, 'Запланировать практику');
      check(practice && practice.disabled && /100\/100/.test(practice.hint), 'сохранение: практика при навыке 100 выключена с причиной', practice?.hint);
      const mc = opt(m, 'Провести мастер-класс');
      check(mc && (mc.disabled ? /Приглашени/.test(mc.hint) : true), 'сохранение: мастер-класс без приглашения выключен с причиной', mc?.hint);
      if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'owner-desktop-learning.png') });
      if (teach && !teach.disabled) {
        await clickOpt(pg, 'Взять ученика');
        await pg.waitForTimeout(100);
        const spec = await modal(pg);
        check(/Взять ученика · Литературоведение и редактура/.test(spec.title) && spec.opts.length > 2 && spec.opts.slice(0, -1).every(o => !o.disabled), 'сохранение: выбор специализации для ученика', spec.title);
        await clickOpt(pg, 'Литературоведение и редактура');
        await pg.waitForTimeout(100);
        const t = await mentoringTask(pg), toast = await toastText(pg);
        check(t && t.role === 'teach' && t.person, 'сохранение: «Взять ученика · Литературоведение и редактура» — занятия запланированы', JSON.stringify(t));
        if (t?.person) {
          check(t.person.age < t.me.age && t.person.city === t.me.city && t.person.country === t.me.country, 'сохранение: ученик моложе, из того же города', t.person.age + ' лет, ' + t.person.city + ' / ' + t.me.city);
          check((t.person.interests || []).includes('literature') || Object.values(t.person.ctx || {}).includes('colleague'), 'сохранение: ученик интересуется литературой', JSON.stringify(t.person.interests));
          check(toast.includes(t.person.name) && !/Проверьте/.test(toast), 'сохранение: тост называет ученика', toast);
          const card = await pg.evaluate(id => personSections42(living(id)).find(x => x.title === 'Где пересекались')?.rows.map(r => r.label + ': ' + r.value).join('; '), t.person.id);
          check(/Ваш(а)? учени(к|ца)/.test(card || ''), 'сохранение: в карточке — «Ваш ученик»', card);
        }
        const again = await openLearning(pg, 'literature');
        const t2 = opt(again, 'Взять ученика'), l2 = opt(again, 'Найти наставника');
        check(t2?.disabled && /Уже запланированы занятия/.test(t2.hint) && l2?.disabled && /Уже запланированы/.test(l2.hint), 'сохранение: после записи наставник и ученик выключены с причиной', t2?.hint);
      }
      // «Программы обучения» на широком экране: окно закрыто, каталог виден.
      await pg.evaluate(() => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'mentoring194'); });
      await openLearning(pg, 'literature');
      await clickOpt(pg, 'Программы обучения');
      await pg.waitForTimeout(150);
      const cat = await catalogInView(pg);
      check(!cat.modal && cat.section === 'admission58' && cat.inView, 'сохранение, широкий экран: «Программы обучения» — каталог на виду', JSON.stringify(cat));
      errorsAll.push(...errors);
      await ctx.close();
    }
    // 2. Сохранение, меню «Менторство и мастер-классы»: «Взять ученика · Литературоведение и редактура».
    {
      const { pg, errors, ctx } = await page(browser, { owner: OWNER });
      await pg.evaluate(() => mentoringMenu194());
      const m = await modal(pg);
      const teach = opt(m, 'Взять ученика · Литературоведение и редактура');
      check(teach && !teach.disabled, 'менторство: «Взять ученика · Литературоведение и редактура» есть и доступно', teach?.hint);
      if (teach) {
        await clickOpt(pg, 'Взять ученика · Литературоведение и редактура');
        await pg.waitForTimeout(100);
        await clickOpt(pg, 'Литературоведение и редактура');
        await pg.waitForTimeout(100);
        const t = await mentoringTask(pg), toast = await toastText(pg);
        check(t && t.role === 'teach' && !!t.person, 'менторство: ученик найден, занятия запланированы', toast);
        check(!/Проверьте расписание и условия/.test(toast), 'менторство: нет тоста «Проверьте расписание и условия»', toast);
      }
      await pg.evaluate(() => courseMenu195());
      const cm = await modal(pg);
      const own = opt(cm, 'Авторский курс');
      check(own && (!own.disabled || own.hint.length > 10), 'курсы: авторский курс — доступен или с причиной', own ? own.label + ' — ' + own.hint : 'нет');
      errorsAll.push(...errors);
      await ctx.close();
    }
    // 3. Сохранение, телефон, настоящие клики. «Траектория» прокручена вниз (колесом), портфолио открыто поверх
    // («Проекты и портфолио» — creativeMenu47, как из «Найти действие»). До 272 каталог открывался в той же прокрутке,
    // и его заголовок оставался выше экрана — казалось, что ничего не произошло.
    {
      const { pg, errors, ctx } = await page(browser, { owner: OWNER, viewport: PHONE });
      await pg.evaluate(() => { s.ui05.panel = 'center'; setTab('trajectory'); openPath16('jobs'); });
      await pg.waitForTimeout(150);
      let scrolled = 0;
      const viaClicks = async () => {
        await pg.mouse.move(195, 600);
        await pg.mouse.wheel(0, 3000);
        await pg.waitForTimeout(250);
        scrolled = await pg.evaluate(() => document.querySelector('[data-panel="center"]').scrollTop);
        await pg.evaluate(() => creativeMenu47());
        await pg.waitForTimeout(150);
        const portfolio = pg.locator('#modal[open] button.portfolio-button60').filter({ hasText: 'Литературоведение и редактура' }).first();
        if (await portfolio.count()) await portfolio.click();
        else await pg.evaluate(() => creativeTrackMenu47('literature'));
        await pg.waitForTimeout(150);
        await clickOpt(pg, 'Обучение и практика');
        await pg.waitForTimeout(150);
      };
      await viaClicks();
      const m = await modal(pg);
      check(m.open && /Обучение и практика/.test(m.title), 'телефон: окно направления открылось', m.title || 'окно закрыто');
      const ov = await noOverflow(pg);
      check(ov.page && ov.modal && ov.buttons, 'телефон: окно и кнопки помещаются по ширине', JSON.stringify(ov));
      if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'owner-phone-learning.png') });
      if (m.open) {
        await clickOpt(pg, 'Взять ученика');
        await pg.waitForTimeout(100);
        await clickOpt(pg, 'Литературоведение и редактура');
        await pg.waitForTimeout(100);
        const t = await mentoringTask(pg);
        check(t?.role === 'teach', 'телефон: ученик взят настоящими кликами', await toastText(pg));
        await viaClicks();
        await clickOpt(pg, 'Программы обучения');
        await pg.waitForTimeout(250);
      }
      const cat = await catalogInView(pg);
      check(cat.panel === 'center' && cat.section === 'admission58' && cat.inView, 'телефон: каталог программ на центральной панели и на виду', 'прокрутка до клика ' + scrolled + ', ' + JSON.stringify(cat));
      if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'owner-phone-catalog.png') });
      errorsAll.push(...errors);
      await ctx.close();
    }
  } else console.log('(OWNER_SAVE не задан — проверки на сохранении пропущены)');

  // 4. Свежий персонаж 18 лет: что недоступно — выключено с причиной.
  {
    const { pg, errors, ctx } = await page(browser, { country: 'it' });
    await setup(pg, { age: 18 });
    const m = await openLearning(pg, 'literature');
    check(m.open && LEARN_LABELS.every((l, i) => m.opts[i]?.label === l), '18 лет: окно направления с теми же вариантами', m.opts.map(o => o.label).join(' | ') || m.title);
    const teach = opt(m, 'Взять ученика'), mc = opt(m, 'Провести мастер-класс'), practice = opt(m, 'Запланировать практику'), mentor = opt(m, 'Найти наставника');
    check(teach?.disabled && /работы в портфолио: нужно 3, сейчас 0/i.test(teach.hint) && /навык направления: нужно от 55, сейчас \d+\/100/.test(teach.hint), '18 лет: «Взять ученика» выключено, пороги с текущими значениями', teach?.hint);
    check(mc?.disabled && /Приглашения провести мастер-класс пока нет/.test(mc.hint), '18 лет: мастер-класс — нет приглашения', mc?.hint);
    check(practice && !practice.disabled && mentor && !mentor.disabled, '18 лет: практика и наставник доступны', practice?.hint + ' / ' + mentor?.hint);
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'fresh18-desktop.png') });
    await pg.evaluate(() => courseMenu195());
    const cm = await modal(pg);
    const contract = opt(cm, 'Контракт'), own = opt(cm, 'Авторский курс');
    check(contract?.disabled && /Предложения пока нет/.test(contract.hint), '18 лет: контракт — предложения пока нет', contract?.hint);
    check(own?.disabled && own.hint.length > 10, '18 лет: авторский курс выключен с причиной', own?.hint);
    await pg.evaluate(() => mentoringMenu194());
    const mm = await modal(pg);
    const mt = opt(mm, 'Взять ученика');
    check(mt?.disabled && mt.hint.length > 10, '18 лет: «Взять ученика» в «Менторстве» выключено с причиной', mt?.hint);
    // Часы: занять расписание до нуля — у наставника сказано, сколько часов не хватает; практика остаётся.
    await pg.evaluate(() => { const free = Math.floor(capacity() - totalHours()); task16('verify272', 'Проверка', 6, {}, Math.max(0, free)); });
    const h = await openLearning(pg, 'literature');
    const hm = opt(h, 'Найти наставника'), hp = opt(h, 'Запланировать практику');
    check(hm?.disabled && /Не хватает 2 ч\/нед\. в расписании: свободно 0 из нужных 2/.test(hm.hint), 'часы: «Найти наставника» — не хватает 2 ч/нед.', hm?.hint);
    check(hp && !hp.disabled && /перегрузятся/.test(hp.hint), 'часы: практику можно, с предупреждением о перегрузке', hp?.hint);
    await pg.evaluate(() => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'verify272'); });
    // Возраст 15.
    await setup(pg, { age: 15 });
    const y = await openLearning(pg, 'literature');
    check(opt(y, 'Запланировать практику')?.hint === 'С 16 лет' && opt(y, 'Найти наставника')?.hint === 'С 16 лет' && opt(y, 'Взять ученика')?.hint === 'С 18 лет',
      '15 лет: причина — возраст', ['Запланировать практику', 'Найти наставника', 'Взять ученика'].map(l => opt(y, l)?.hint).join(' / '));
    errorsAll.push(...errors);
    await ctx.close();
  }

  // 5. Синтетический преподаватель 30 лет: пустой круг, знакомств больше не прибавляется (created=24).
  {
    const { pg, errors, ctx } = await page(browser, { country: 'it' });
    await setup(pg, { age: 30, teacher: true, saturated: true, cash: 100000 });
    const m = await openLearning(pg, 'literature');
    const teach = opt(m, 'Взять ученика');
    check(teach && !teach.disabled, 'круг пуст: «Взять ученика» доступно', teach?.hint);
    await clickOpt(pg, 'Взять ученика'); await pg.waitForTimeout(80);
    await clickOpt(pg, 'Литературоведение и редактура'); await pg.waitForTimeout(80);
    const t = await mentoringTask(pg);
    check(t?.person && t.person.age < 30 && t.person.age >= 16 && t.person.city === t.me.city && (t.person.interests || []).includes('literature'),
      'круг пуст: найден ученик моложе, из того же города, с интересом к литературе', JSON.stringify(t?.person));
    // Наставник при пустом круге — старше.
    await pg.evaluate(() => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'mentoring194'); });
    const ok = await pg.evaluate(() => planMentoring194('literature', 'learn', 'prose'));
    const tm = await mentoringTask(pg);
    check(ok && tm?.role === 'learn' && tm.person && tm.person.age > 30, 'круг пуст: наставник находится и он старше', JSON.stringify(tm?.person));
    // Прежний круг: если в круге уже есть человек, ученик — он.
    await pg.evaluate(() => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'mentoring194'); });
    const keep = await pg.evaluate(() => {
      const sc = mentoringScope194('literature', 'poetry'), rec = circleRecord48(sc);
      const p = socialPerson115('Знакомый', 33, s.country, residenceCity(), 'work'); s.people.push(p); enrichPerson(p);
      p.contexts48 = { [sc.key]: 'colleague' }; rec.roster.push(p.id);
      const before = s.people.length, ok = planMentoring194('literature', 'teach', 'poetry');
      const t = s.clock.tasks.find(t => t.kind === 'mentoring194' && t.state === 'planned');
      return { ok, same: t?.person194 === p.id, added: s.people.length - before };
    });
    check(keep.ok && keep.same && keep.added === 0, 'круг не пуст: ученик — уже знакомый человек, новых не появилось', JSON.stringify(keep));
    // Право на работу: без документов — причина из creativeRights47.
    await pg.evaluate(() => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'mentoring194'); });
    const rights = await pg.evaluate(() => {
      const keep = { creativeRights47, rights31 };
      creativeRights47 = () => ['Недостаточно разрешённых рабочих часов с учётом основной работы и заказов'];
      rights31 = () => ({ reside: false, hours: 0, reason: [] });
      try { return typeof mentoringWhy272 === 'function' ? mentoringWhy272('literature', 'teach') : ''; } finally { creativeRights47 = keep.creativeRights47; rights31 = keep.rights31; }
    });
    check(/Нет документов, которые дают право работать/.test(rights), 'документы: причина названа', rights);
    // Мастер-класс по приглашению: доступен и проходит.
    const cls = await pg.evaluate(() => {
      const host = s.people.find(p => p.alive && p.age > 30 && p.contexts48);
      mentoring194().offer = { track: 'literature', host: host.id, work: 'verify272-0', ends: s.clock.ticks + 3, country: s.country, fee: 500, status: 'offered' };
      return host.name;
    });
    const mc = await openLearning(pg, 'literature');
    const mcOpt = opt(mc, 'Провести мастер-класс');
    check(mcOpt && !mcOpt.disabled && mcOpt.hint.includes(cls), 'мастер-класс: с приглашением доступен, назван пригласивший', mcOpt?.hint);
    if (mcOpt && !mcOpt.disabled) { await clickOpt(pg, 'Провести мастер-класс'); await pg.waitForTimeout(80); }
    const tc = await mentoringTask(pg);
    check(tc?.role === 'class', 'мастер-класс: запланирован', JSON.stringify(tc && tc.label));
    errorsAll.push(...errors);
    await ctx.close();
  }

  // 6. Телефон, свежий персонаж 18 лет: окно помещается, «Подготовительный сертификат» ведёт к каталогу.
  {
    const { pg, errors, ctx } = await page(browser, { country: 'it', viewport: PHONE });
    await setup(pg, { age: 18 });
    await pg.evaluate(() => { s.ui05.panel = 'center'; setTab('trajectory'); });
    await pg.mouse.move(195, 600); await pg.mouse.wheel(0, 1500); await pg.waitForTimeout(200);
    const m = await openLearning(pg, 'literature');
    const ov = await noOverflow(pg);
    check(m.open && ov.page && ov.modal && ov.buttons, 'телефон, 18 лет: окно помещается по ширине', JSON.stringify(ov));
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'fresh18-phone.png') });
    if (m.open) { await clickOpt(pg, 'Подготовительный сертификат'); await pg.waitForTimeout(250); }
    const cat = await catalogInView(pg);
    check(cat.panel === 'center' && cat.section === 'admission58' && cat.inView, 'телефон, 18 лет: сертификат — каталог на виду', JSON.stringify(cat));
    errorsAll.push(...errors);
    await ctx.close();
  }

  check(errorsAll.length === 0, 'без ошибок на странице', errorsAll.slice(0, 3).join(' | '));
  await browser.close();
  console.log(`\n${pass} ok, ${fail} fail` + (BASE ? ' (BASE=1, без learning272.js)' : ''));
  process.exit(fail ? 1 : 0);
})();
