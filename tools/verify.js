// Точечные проверки сборок 259 и дальше: здоровье и смерть, питомцы, помёт, просьба о питомце, праздники, привычки.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify.js
// Если новые файлы ещё не подключены в index.html, скрипт подгружает их сам.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };

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
  for (const f of ['pets260.js', 'holidays260.js', 'habits261.js', 'creative262.js', 'business263.js', 'save264.js', 'business265.js', 'business266.js', 'taxes266.js', 'feed267.js', 'notices270.js'])
    if (!(await pg.evaluate(f => [...document.scripts].some(x => x.src.includes(f)), f))) await pg.addScriptTag({ path: path.join(ROOT, f) });
  return { pg, errors, ctx };
}

const modal = "(()=>({open:$('#modal').open,title:document.querySelector('#modal h2')?.textContent||'',text:[...document.querySelectorAll('#modal p')].map(p=>p.textContent).join('\\n'),buttons:[...document.querySelectorAll('#modal .options button')].map(b=>b.textContent.replace(/\\s+/g,' ').trim())}))()";
const click = re => `(()=>{const b=[...document.querySelectorAll('#modal .options button:not([disabled])')].find(b=>${re}.test(b.textContent));if(!b)return false;b.click();return true})()`;
const addCat = (name, sex, months) => `(()=>{const roll=shelterRoll38('cat');placePet79({...roll,id:'t-${name}',kind:'cat',name:'${name}',sex38:'${sex}',months:${months}},'shelter',0);const p=s.pets.find(p=>p.name==='${name}');return p.id})()`;

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 400))); };

(async () => {
  const browser = await chromium.launch();

  // 1. Меню «Самочувствие» без болезни.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    await pg.evaluate("s.illness=null;healthMenu()");
    const m = await pg.evaluate(modal);
    check('здоровье: меню объясняет потолок и форму', /держится около \d+/.test(m.text) && /Форма/.test(m.text) && m.buttons.some(b => /здоровье до \d+/.test(b)), m);
    check('здоровье: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 1б. Смерть посреди открытых событий не оставляет окон после финала.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'it' });
    const r = await pg.evaluate("(()=>{const p=s.people.find(p=>p.alive&&p.age>=18);s.age=60;s.pending=[];if($('#modal').open)closeModal();const m=mortality258;mortality258=()=>{s.pending.push({type:'petCondolence260',personId:p.id,petName:'Рекс'});return true};try{rollYear()}finally{mortality258=m}return {dead:s.dead,pending:s.pending.length,open:$('#modal').open,last:s.log.find(e=>e.title==='Последняя запись')?.text||''}})()");
    check('смерть: очередь событий очищается, окон после финала нет', r.dead && !r.pending && !r.open && r.last, r);
    check('смерть: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 2. Смерть питомца дома.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'rs' });
    const id = await pg.evaluate(addCat('Мотя', 'f', 170));
    await pg.evaluate(`(()=>{const p=s.pets.find(p=>p.id==='${id}');p.life=p.months+1;p.withYou=150;s.pending=[];petMonth();})()`);
    const pend = await pg.evaluate("s.pending.map(q=>q.type)");
    check('питомец дома: смерть ставит окно прощания', pend[0] === 'petFarewell260', pend);
    check('питомец дома: нет старой строки «Тихий дом»', !(await pg.evaluate("s.log.some(e=>e.title==='Тихий дом')")), null);
    await pg.evaluate('resolvePending()');
    const m = await pg.evaluate(modal);
    check('питомец дома: окно с кличкой, возрастом и привычкой', m.title === 'Мотя' && /умерла в \d+ (год|года|лет)/.test(m.text) && /Дома все знали: Мотя [а-яё]/.test(m.text) && !/\.\./.test(m.text), m);
    await pg.evaluate(click('/клинике/'));
    const last = await pg.evaluate("({title:s.log[0].title,text:s.log[0].text,pending:s.pending.length,open:$('#modal').open})");
    check('питомец дома: выбор пишет прощание в ленту', last.title === 'Прощание' && /переноску/.test(last.text) && !last.pending, last);
    check('питомец дома: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 3. Смерть питомца, который живёт у родителя.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' });
    const id = await pg.evaluate(addCat('Барсик', 'm', 170));
    const ok = await pg.evaluate(`(()=>{const parent=parents17()[0];if(!parent)return false;const p=s.pets.find(p=>p.id==='${id}');
      p.household183={owner:parent.id,keeper:parent.id,payer:parent.id,country:parent.country,city:'—'};s.housing.occupant=null;
      p.life=p.months+1;s.pending=[];return !petAtHome183(p)&&(petMonth(),true)})()`);
    const pend = await pg.evaluate("s.pending.map(q=>q.type)");
    check('питомец у родителя: звонок вместо тишины', ok && pend[0] === 'petNews260', { ok, pend });
    if (pend[0] === 'petNews260') {
      await pg.evaluate('resolvePending()');
      const m = await pg.evaluate(modal);
      check('питомец у родителя: окно «Звонит …» с кличкой', /^Звонит /.test(m.title) && /Барсик умер/.test(m.text), m);
      await pg.evaluate(click('/телефону/'));
      check('питомец у родителя: запись «Звонок»', await pg.evaluate("s.log[0].title==='Звонок'"), null);
    }
    check('питомец у родителя: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 4. Питомец близкого человека.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'es' });
    await pg.evaluate("(()=>{const p=s.people.find(p=>p.alive&&p.age>=18);p.bond=70;s.pending=[];ageNote58(p,'Питомец Рекс умер от старости.');})()");
    const pend = await pg.evaluate("s.pending.map(q=>q.type)");
    check('питомец близкого: появляется сообщение', pend[0] === 'petCondolence260', pend);
    await pg.evaluate('resolvePending()');
    const m = await pg.evaluate(modal);
    check('питомец близкого: окно с кличкой и ответом', /Рекс/.test(m.text) && m.buttons.some(b => /Написать/.test(b)), m);
    await pg.evaluate(click('/Написать/'));
    check('питомец близкого: ответ пишется в ленту', await pg.evaluate("s.log[0].title==='У близких'&&/фотография/.test(s.log[0].text)"), null);
    check('питомец близкого: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 5. Помёт: окно при рождении и когда малыши подросли.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'pl' });
    const id = await pg.evaluate(addCat('Мурка', 'f', 30));
    await pg.evaluate(`(()=>{const z=petFamily79();z.litters.push({id:'lit-t',mother:'${id}',father:null,kind:'cat',breed38:null,due:s.clock.ticks,status:'expecting',young:[]});s.pending=[];petFamilyMonth79();})()`);
    let pend = await pg.evaluate("s.pending.map(q=>q.type+':'+q.stage)");
    check('помёт: окно при рождении', pend[0] === 'litter260:born', pend);
    await pg.evaluate('resolvePending()');
    let m = await pg.evaluate(modal);
    check('помёт: окно называет мать и малышей', /Мурка/.test(m.title) && /Родил/.test(m.text) && m.buttons.some(b => /Посмотреть/.test(b)), m);
    await pg.evaluate(click('/Хорошо/'));
    await pg.evaluate("(()=>{const l=petFamily79().litters.find(l=>l.id==='lit-t');s.clock.ticks=l.ready;s.pending=[];petFamilyMonth79();})()");
    pend = await pg.evaluate("s.pending.map(q=>q.type+':'+q.stage)");
    check('помёт: окно, когда малыши подросли', pend[0] === 'litter260:ready', pend);
    await pg.evaluate('resolvePending()');
    m = await pg.evaluate(modal);
    check('помёт: окно «Малыши подросли» ведёт в меню помёта', m.title === 'Малыши подросли' && m.buttons.some(b => /Решить сейчас/.test(b)), m);
    await pg.evaluate(click('/Решить сейчас/'));
    m = await pg.evaluate(modal);
    check('помёт: открывается меню помёта', /Помёт/.test(m.title + m.text) || m.buttons.some(b => /Оставить дома|Пристроить/.test(b)), m);
    check('помёт: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 6. Ребёнок просит кошку, когда дома уже есть кошка.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '0', country: 'fr' });
    await pg.evaluate("(()=>{s.age=30})()");
    await pg.evaluate(addCat('Пушок', 'm', 24));
    const r = await pg.evaluate(`(()=>{s.age=9;s.birthYear=s.year-9;const p=s.pets.find(p=>p.name==='Пушок');const why=requestWhy67('cat');
      const rnd=Math.random;Math.random=()=>0;let out;try{out=askParent67('cat')}finally{Math.random=rnd}
      return {why,out,log:s.log[0]&&s.log[0].title+': '+s.log[0].text,pets:s.pets.filter(p=>p.alive).length}})()`);
    check('просьба о питомце: родитель вспоминает, кто уже живёт дома', !r.why && r.out === false && /Пушок/.test(r.log) && r.pets === 1, r);
    check('просьба о питомце: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 7. Праздник: подсказки у вариантов и запись с названием.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    await pg.evaluate("(()=>{const t=s.clock.ticks;s.localEvent99={id:'local99-t',tick:t,expires:t+2,status:'offered',country:s.country,city:residenceCity(),title:'Кингсдей',text:'Город в оранжевом.',companion:null,holiday130:true,family178:null,price:10};s.cash+=100;openDecision24('local99','local99-t');})()");
    const m = await pg.evaluate(modal);
    check('праздник: у вариантов видны эффекты', m.buttons.some(b => /Заглянуть ненадолго.*Настроение лучше/.test(b)) && m.buttons.some(b => /Отдохнуть дома.*Усталость −4/.test(b)), m);
    await pg.evaluate(click('/Заглянуть ненадолго/'));
    const last = await pg.evaluate("s.log[0]&&s.log[0].title+' | '+s.log[0].text");
    check('праздник: запись называет праздник', /Кингсдей \| Вы заглядываете на «Кингсдей»/.test(last), last);
    check('праздник: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 8. Привычки (261).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'no' });
    const cost = await pg.evaluate(() => { const h = habits78().smoke; h.strength = 6; delete h.mode; return { cost: habitCost78('smoke'), month: c().wage / 12 }; });
    check('привычки: регулярное курение стоит около 7% месячной зарплаты', Math.abs(cost.cost / cost.month - .07) < .005, cost);
    const ceil = await pg.evaluate(() => {
      s.age = 55; const h = habits78().smoke; h.strength = 6; delete h.mode; h.years261 = 30;
      const withHabit = healthCeiling259(); h.strength = 0; h.years261 = 0; const without = healthCeiling259();
      h.strength = 6; h.years261 = 30; s.illness = null; healthMenu();
      return { withHabit, without, text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join(' ') };
    });
    check('привычки: курение опускает потолок здоровья (3.5 + стаж)', ceil.without - ceil.withHabit >= 9 && ceil.without - ceil.withHabit <= 10, ceil);
    check('привычки: меню «Самочувствие» говорит, сколько отнимает курение', /Курение сейчас опускает этот уровень на (9|10)/.test(ceil.text), ceil.text);
    await pg.evaluate(() => closeModal());
    const wd = await pg.evaluate(() => {
      s.pending = []; s.mood = 70; const h = habits78().smoke; h.strength = 5; h.lastMode261 = undefined; h.mode = 'pause'; h.used = -5;
      const rnd = Math.random; Math.random = () => .99; try { habitMonth261({ smoke: 5, drink: 0 }); } finally { Math.random = rnd; }
      return { withdrawal: h.withdrawal261, log: s.log.find(e => e.title === 'Без сигарет')?.text || '', mood: s.mood };
    });
    check('привычки: отказ при зависимости даёт ломку (первый из двух месяцев уже засчитан)', wd.withdrawal === 1 && wd.log && wd.mood === 67, wd);
    const cr = await pg.evaluate(() => {
      s.pending = []; s.mood = 30; const h = habits78().smoke;
      const rnd = Math.random; Math.random = () => 0; try { habitMonth261({ smoke: 5, drink: 0 }); } finally { Math.random = rnd; }
      return s.pending.map(q => q.type + ':' + q.kind);
    });
    check('привычки: в тяжёлый месяц тянет сорваться', cr[0] === 'craving261:smoke', cr);
    await pg.evaluate(() => resolvePending());
    let m = await pg.evaluate(modal);
    check('привычки: окно тяги с риском словами', m.title === 'Тянет закурить' && m.buttons.some(b => /Перетерпеть.*(получится|рискованно)/.test(b)), m);
    await pg.evaluate(() => { const rnd = Math.random; Math.random = () => .99; try { [...document.querySelectorAll('#modal .options button')].find(b => /Перетерпеть/.test(b.textContent)).click(); } finally { Math.random = rnd; } });
    check('привычки: перетерпеть удалось — запись «Выдержали»', await pg.evaluate(() => s.log[0].title === 'Выдержали' && habits78().smoke.mode === 'pause'), null);
    await pg.evaluate(() => { s.cash += 1e6; habitDetail78('smoke'); });
    m = await pg.evaluate(modal);
    check('привычки: меню привычки называет цену, здоровье и группу поддержки', /обходится в/.test(m.text) && /ниже, чем могло бы/.test(m.text) && m.buttons.some(b => /группу поддержки/.test(b)) && !m.buttons.some(b => /Обсудить с /.test(b)), m);
    await pg.evaluate(click('/группу поддержки/'));
    const quit = await pg.evaluate(() => { const t = s.clock.tasks.find(t => t.kind === 'quit261'); if (!t) return null; const before = habits78().smoke.strength; finishTask(t); return { before, after: habits78().smoke.strength, log: s.log[0].title }; });
    check('привычки: группа поддержки в расписании снижает силу привычки', quit && quit.after === quit.before - 2 && quit.log === 'Три месяца в группе', quit);
    const ev = await pg.evaluate(() => { const h = habits78().drink; h.strength = 6; delete h.mode; const n = s.log.length; drinkEvent261(h); return { added: s.log.length > n || s.log[0].title, title: s.log[0].title }; });
    check('привычки: тяжёлая выпивка даёт событие', ['Ссора', 'Разговор с начальством', 'Ночь в участке', 'Утро'].includes(ev.title), ev);
    const cn = await pg.evaluate(() => { const p = s.people.find(p => p.alive && p.age >= 18 && childLocal55(p)); if (!p) return null; s.pending = [{ type: 'concern261', kind: 'drink', personId: p.id }]; resolvePending(); return p.name; });
    m = await pg.evaluate(modal);
    check('привычки: близкий заговаривает о выпивке', cn && m.title === 'Разговор · ' + cn && m.buttons.some(b => /Попросить помочь бросить/.test(b)), { cn, m });
    await pg.evaluate(click('/Попросить помочь бросить/'));
    check('привычки: просьба о помощи — пауза с поддержкой', await pg.evaluate(() => habits78().drink.mode === 'pause' && habits78().drink.supported === s.clock.ticks && s.log[0].title === 'Разговор'), null);
    check('привычки: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 9. Творческие гонорары (262).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'no' });
    const f = await pg.evaluate(() => {
      const x = creative47(); const f0 = feeFactor262('finearts');
      for (let i = 0; i < 40; i++) x.works.push({ id: 'w' + i, track: 'finearts', kind: 'paid', quality: 50, tick: 0 });
      const f40 = feeFactor262('finearts'); x.works.length = 0; return { f0, f40 };
    });
    check('гонорары: первая работа ×1, сороковая ×2.9', Math.abs(f.f0 - 1) < 1e-9 && Math.abs(f.f40 - (1 + .6 * Math.log2(9))) < 1e-9, f);
    const lv = await pg.evaluate(() => {
      const x = creative47();
      for (let i = 0; i < 3; i++) x.works.push({ id: 'l' + i, track: 'finearts', kind: 'paid', quality: 60, tick: 0, specialty184: 'illustration', level184: 2 });
      const rnd = Math.random; Math.random = () => .999;
      let o; try { o = creativeBrief184({ id: 't', track: 'finearts', kind: 'commission', title: 'Обложка', fee: 1000, duration: 3, skill: 45, samples: 2, quality: 40, hours: 8 }, 1); } finally { Math.random = rnd; }
      return { level: o.level184, specialty: o.specialty184, fee: o.fee, factor: feeFactor262('finearts'), title: o.title };
    });
    check('гонорары: после трёх работ уровня 2 с качеством 55+ приходит уровень 3', lv.level === 3 && lv.specialty === 'illustration' && lv.fee === Math.round(Math.round(1000 * 2.2) * lv.factor) && /Иллюстрация · Обложка/.test(lv.title), lv);
    await pg.evaluate(() => creativeTrackMenu47('finearts'));
    const m = await pg.evaluate(modal);
    check('гонорары: меню профиля показывает репутацию и множитель', /Репутация: новичок \(1\.0\)/.test(m.text) && /Гонорары сейчас ×\d/.test(m.text), m.text);
    check('гонорары: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 10. Своё дело (263).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'no' });
    const r = await pg.evaluate(() => {
      s.age = 30; s.cash = 1e8; s.illness = null;
      const ok = startEnterprise152('services', 'Тестовая мастерская', 'hair'); const b = s.enterprise152;
      const W = c().wage / 12, task = () => s.clock.tasks.find(t => t.kind === 'business263' && t.business263 === b.id);
      const out = { ok, mode: b.mode263, fit: b.fit263, selfHours: task()?.hours, wage: enterpriseWage155(b), W };
      setBusinessMode263(b.id, 'partial'); out.partialHours = task()?.hours;
      setBusinessMode263(b.id, 'manager'); out.managerHours = task()?.hours;
      setBusinessMode263(b.id, 'self');
      for (let i = 0; i < 3; i++) { s.clock.ticks++; enterpriseLocationMonth168(b); }
      const h = b.history.at(-1); out.month = { demand: h?.demand263, capacity: h?.capacity263, status: b.status };
      b.fresh263 = .8; b.cash = 1e8; out.renovated = developEnterprise156(b.id, 'renovation263') && b.fresh263 === 1;
      return out;
    });
    check('своё дело: новое дело — «сам», 35 ч/нед. в расписании', r.ok && r.mode === 'self' && r.selfHours === 35 && r.fit >= .45 && r.fit <= 1.45, r);
    check('своё дело: сотрудник получает 0.8 средней зарплаты страны', r.wage === Math.round(r.W * .8), r);
    check('своё дело: режим меняет часы (частично 15, управляющий 3)', r.partialHours === 15 && r.managerHours === 3, r);
    check('своё дело: месяц считает спрос и мощность', r.month.demand > 0 && r.month.capacity >= 1, r.month);
    check('своё дело: ремонт возвращает свежесть', r.renovated, r);
    await pg.evaluate(() => businessModeMenu263(s.enterprise152));
    let m = await pg.evaluate(modal);
    check('своё дело: меню режима называет доход дела и цену управляющего', /приносит в среднем .* управляющий стоит/.test(m.text) && m.buttons.length >= 4, m);
    await pg.evaluate(() => { closeModal(); const b = s.enterprise152; delete b.mode263; delete b.modeAsked263; s.pending = []; businessMode263(b); resolvePending(); });
    m = await pg.evaluate(modal);
    check('своё дело: дело из старого сохранения спрашивает режим', /Дело теперь требует вашего времени/.test(m.text) && m.buttons.some(b => /^Сам/.test(b)), m);
    await pg.evaluate(click('/^Сам/'));
    check('своё дело: выбор режима из окна ставит 35 ч/нед.', await pg.evaluate(() => s.enterprise152.mode263 === 'self' && s.clock.tasks.find(t => t.kind === 'business263').hours === 35 && !s.pending.length), null);
    check('своё дело: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 11. Отложенное сохранение (264).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const r = await pg.evaluate(async () => {
      const out = {}, id = s.saveId, stored = () => parseLife(localStorage.getItem(LIFE_PREFIX + id));
      flushSave264();
      let writes = 0; const real = saveNow264;
      s.cash = 11111; show('Замер', 'Окно.', [{ label: 'Вариант', fn: () => {} }]); choose(0);
      out.immediate = stored()?.cash; out.pendingTarget = saveTarget264 === s;
      out.readBack = readLife(id)?.cash;
      s.cash = 22222; save(); save(); save();
      await new Promise(r => setTimeout(r, 600));
      out.afterTimer = stored()?.cash;
      s.cash = 33333; save(); const old = s; s = null; intro();
      out.afterNewLife = parseLife(localStorage.getItem(LIFE_PREFIX + id))?.cash; s = old;
      return out;
    });
    check('сохранение: клик больше не пишет сразу, запись отложена', r.immediate !== 11111 && r.pendingTarget, r);
    check('сохранение: чтение персонажа обратно сначала дописывает отложенное', r.readBack === 11111, r);
    check('сохранение: через полсекунды изменения в хранилище сами', r.afterTimer === 22222, r);
    check('сохранение: «Начать новую жизнь» сразу после изменения не теряет прошлую', r.afterNewLife === 33333, r);
    check('сохранение: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 12. Экономика по видам дела (265).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const r = await pg.evaluate(() => {
      s.age = 30; s.illness = null; const out = { bad: [], types: 0 };
      for (const type of Object.keys(enterpriseTypes152)) {
        const spec = type.endsWith('253') ? businessCatalog253.find(b => b.type === type && enterpriseAvailable253(b.id))?.id : Object.keys(enterpriseSpecialties153[type]).find(k => k !== 'school196');
        if (!spec) continue;
        s.enterprise152 = null; s.otherEnterprises168 = []; s.cash = 1e9;
        if (!startEnterprise152(type, 'Проверка', spec)) { out.bad.push(type + ': не открылось'); continue; }
        const b = s.enterprise152; out.types++;
        for (let i = 0; i < 6; i++) { s.clock.ticks++; enterpriseLocationMonth168(b); }
        if (!b.history.length || !b.history.every(h => Number.isFinite(h.sales) && Number.isFinite(h.costs)) || !Number.isFinite(b.cash)) out.bad.push(type);
      }
      const b = s.enterprise152; b.cash = NaN; b.history.push({ sales: NaN, costs: NaN, cash: NaN }); repairBusiness265();
      out.repaired = Number.isFinite(b.cash) && b.cash > 0 && b.history.every(h => Number.isFinite(h.sales));
      const cinema = businessCatalog253.find(x => /Кинотеатр/.test(x.name) && enterpriseAvailable253(x.id));
      out.cinema = cinema ? enterpriseMarket165({ type: 'culture253', specialty: cinema.id, country: s.country, city: residenceCity() })?.variable : null;
      return out;
    });
    check('экономика дел: все виды, доступные в стране, дают конечные числа на полгода', r.types >= 8 && !r.bad.length, r);
    check('экономика дел: дело, сломанное в 263, чинится', r.repaired, r);
    check('экономика дел: кинотеатр отдаёт прокатчикам 47%', r.cinema === .47, r);
    check('экономика дел: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 13. События своего дела и налоги (266).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const r = await pg.evaluate(() => {
      s.age = 30; s.cash = 1e8; s.illness = null; s.pending = [];
      startEnterprise152('services', 'Мастерская', 'repair'); const b = s.enterprise152; b.opened159 = s.clock.ticks - 30;
      const p = { id: 'staff-t', name: 'Мира', role: 'Знакомый', alive: true, age: 30, gender: 'f', country: b.country, city18: b.city, privateCash: 0, bond: 40, memories: [], trait: ['', ''], inner: { trust: 50, affection: 50, strain: 0, desire: 0 } };
      s.people.push(p); b.staff155 = [p.id];
      const out = {}; const rnd = Math.random;
      const month = () => { s.clock.ticks++; enterpriseLocationMonth168(b); };
      Math.random = () => .001; try { month(); } finally { Math.random = rnd; }
      out.firstEvent = s.pending.map(q => q.type);
      out.competitorDemand = businessModifier254(b, 'demand');
      s.pending = []; b.competitor266 = s.clock.ticks;
      Math.random = () => .001; try { month(); } finally { Math.random = rnd; }
      out.secondEvent = s.pending.map(q => q.type); out.rentAfterSale = enterpriseRent157(b);
      return out;
    });
    check('дело: конкурент рядом — спрос ×0.82 и окно с ответами', r.firstEvent[0] === 'competitor266' && Math.abs(r.competitorDemand - .89 * .92) < 1e-9, r);
    check('дело: продажа помещения — аренда +25% и окно выкупа', r.secondEvent[0] === 'landlord266', r);
    await pg.evaluate(() => resolvePending());
    let m = await pg.evaluate(modal);
    check('дело: окно «Помещение продают» предлагает выкуп', m.title === 'Помещение продают' && m.buttons.some(b => /Выкупить помещение/.test(b)), m);
    await pg.evaluate(click('/Выкупить помещение/'));
    check('дело: своё помещение — аренда 0', await pg.evaluate(() => s.enterprise152.ownPremises266 && enterpriseRent157(s.enterprise152) === 0), null);
    const leave = await pg.evaluate(() => {
      const b = s.enterprise152; s.pending = []; b.landlord266 = 1; const rnd = Math.random;
      Math.random = () => .001; try { s.clock.ticks++; enterpriseLocationMonth168(b); } finally { Math.random = rnd; }
      return s.pending.map(q => q.type);
    });
    check('дело: ключевой сотрудник собирается уйти', leave[0] === 'staffLeave266', leave);
    await pg.evaluate(() => resolvePending());
    await pg.evaluate(() => { const rnd = Math.random; Math.random = () => .1; try { [...document.querySelectorAll('#modal .options button')].find(b => /прибавку/.test(b.textContent)).click(); } finally { Math.random = rnd; } });
    const kept = await pg.evaluate(() => { const b = s.enterprise152; s.clock.ticks += 2; enterpriseLocationMonth168(b); return { staff: b.staff155.length, bonus: Object.values(b.bonus266 || {})[0], leaving: !!b.leaving266 }; });
    check('дело: прибавка удерживает сотрудника', kept.staff === 1 && kept.bonus > 0 && !kept.leaving, kept);
    const tax = await pg.evaluate(() => {
      const b = s.enterprise152; s.tax266 = null; b.cash += 100000; const before = s.cash;
      distributeEnterprise158(b, 100000); tax266().creative += 50000;
      s.cash = 1e8; s.clock.month = s.birthMonth ?? 0; s.clock.yearDue = false; rollYear();
      const entry = s.log.find(e => e.title === 'Итоги прожитого года');
      const out = { text: entry?.text || '', rate: taxRate266(), base: 150000 };
      s.tax266 = { business: 1000, creative: 0, rent: 0, arrears: 0 }; s.cash = 0; const pe = payExpense23; payExpense23 = () => false;
      try { rollYear(); } finally { payExpense23 = pe; } out.arrears = tax266().arrears;
      return out;
    });
    check('налоги: строка в итогах года с суммой с дела и гонораров', /Налог 30% с дохода \(своё дело, гонорары\): /.test(tax.text), tax);
    check('налоги: не из чего платить — недоимка на следующий год', tax.arrears === 300, tax);
    check('дело и налоги: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 14. Лента: «Будни» (267).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const r = await pg.evaluate(() => {
      const out = {}; s.feed267 = null; const n0 = s.log.length;
      for (let i = 0; i < 4; i++) log('Книга клуба', 'Обсуждение.', 'Занятия');
      log('Симптомы вернулись', 'Обострение.', 'Здоровье', true); log('Обострение закончилось', 'Прошло.', 'Здоровье');
      log('Бумажный самолётик', 'Долетел.', 'Быт'); log('Бумажный самолётик', 'Долетел.', 'Быт');
      out.added = s.log.length - n0; out.week = { ...s.feed267.week };
      s.clock.month = 5; flushWeekdays267(); out.weekdays = s.log[0].title + ' | ' + s.log[0].text;
      s.log = Array.from({ length: 499 }, (_, i) => ({ title: 'x' + i, text: '', major: i === 498, year: 1 }));
      log('Новая запись', 'Текст.', 'Тест'); out.keepsMajor = s.log.some(e => e.title === 'x498') && s.log.length <= 500;
      return out;
    });
    check('лента: рутина не пишется отдельными записями, зарисовка — раз в два года', r.added === 1 && r.week['книжный клуб'] === 4 && r.week['обострения'] === 1 && r.week['бумажный самолётик'] === 1, r);
    check('лента: раз в три месяца — строка «Будни»', /^Будни · апрель — июнь \| Книжный клуб ×4, /.test(r.weekdays), r.weekdays);
    check('лента: крупные записи не вытесняются при 500', r.keepsMajor, r);
    const est = await pg.evaluate(() => {
      const far = s.people.find(p => p.alive && !kin27(p)); if (!far) return null; far.bond = 10;
      const n = s.log.filter(e => e.title === 'Имущество после утраты').length; far.alive = false;
      try { openEstate58(far.id); } catch (e) { return 'err ' + e.message; }
      return s.log.filter(e => e.title === 'Имущество после утраты').length - n;
    });
    check('лента: наследство дальнего знакомого не пишется в ленту', est === 0 || est === null, est);
    check('лента: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 15. Каталог фильмов (269).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const r = await pg.evaluate(() => {
      const out = {}; s.age = 25; s.year = 2026; s.clock.month = 10;
      out.kids = filmsAvailable269({ age: 8 }).every(f => f.minAge <= 6) && filmsAvailable269({ age: 5 }).length === 0;
      out.ruOnly = !filmsAvailable269({ country: 'nl' }).some(f => f.country === 'Россия') && filmsAvailable269({ country: 'ru' }).some(f => f.country === 'Россия');
      out.notYet = !filmsAvailable269().some(f => f.year === 2027) && filmsNow269(3).length > 0;
      out.hobby = hobbies.film.slice(1).map(label => { finishTask({ kind: 'hobby', hobby: 'film', label, id: 'h-' + label, duration: 1, progress: 1, hours: 2 }); return s.log[0].text; });
      const p = s.people.find(p => p.alive && p.age >= 18 && p.country === s.country && (!p.city18 || p.city18 === residenceCity()));
      if (p) { task16('meeting53', 'Сходить в кино · ' + p.name, 1, { person53: p.id, meeting53: 'cinema', home53: s.country, city53: residenceCity(), partner53: false, startCostRatio: 0 }, 2); const t = s.clock.tasks.at(-1); t.progress = t.duration; finishTask(t); out.meeting = s.log.find(e => e.title === 'Сходить в кино')?.text || ''; }
      out.stats = practiceDetails250('film');
      // Киноклуб: фильм раз в месяц участия, в ленте — «Будни».
      s.cash = 1e7; path16().languages[activityLanguage86('cinema269')] = 6; joinClub19('cinema269');
      const m = clubState19().memberships.find(m => m.type === 'cinema269');
      if (m) { s.feed267 = null; for (let i = 0; i < 3; i++) { s.clock.ticks++; clubProgramMonth245(m); } out.club = m.films269.length === 3 && new Set(m.films269).size === 3 && s.feed267.week['киноклуб'] === 3; }
      // Будущее: с 2028 года в каждом месяце не меньше двух премьер, одни и те же после перезагрузки.
      s.year = 2061; s.clock.month = 6;
      const now = filmsNow269(1), ids = now.map(f => f.id + f.title + f.director).join();
      futureCache269.clear(); const again = filmsNow269(1).map(f => f.id + f.title + f.director).join();
      out.future = now.length >= 2 && ids === again && now.every(f => f.generated && f.title && f.director && f.summary) && !!filmById269(now[0].id);
      return out;
    });
    check('кино: дети видят только детские фильмы, до 6 лет — ничего', r.kids, r);
    check('кино: российские премьеры только в России, анонсы 2027 ещё не вышли', r.ruOnly && r.notYet, r);
    check('кино: у ретроспективы, обсуждения и домашней программы есть фильмы', r.hobby.length === 3 && r.hobby.every(t => /«[^»]+»/.test(t) && !/Занятие увлекло/.test(t)), r.hobby);
    check('кино: в походе в кино назван фильм', /Смотрели «[^»]+» \(\d{4}\)\./.test(r.meeting), r.meeting);
    check('кино: в увлечении видно, сколько посмотрено и любимый фильм', /Посмотрено фильмов: \d+\. Любимый — «/.test(r.stats), r.stats);
    check('кино: киноклуб — новый фильм каждый месяц, в ленте через «Будни»', r.club, r);
    check('кино: после каталога премьеры придумываются и не меняются', r.future, r);
    const biz = await pg.evaluate(() => {
      s.age = 30; s.year = 2045; s.cash = 1e8;
      const spec = businessCatalog253.find(b => b.name === 'Кинотеатр' && b.country === countries[s.country].name);
      if (!spec || !startEnterprise152('culture253', 'Проверка', spec.id)) return 'не открылось';
      enterpriseMenu152(); const t = [...document.querySelectorAll('#modal p')].map(p => p.textContent).join(' '); closeModal(); return t;
    });
    check('кино: в меню кинотеатра виден репертуар', /В прокате: «/.test(biz), biz.slice(-200));
    const outing = await pg.evaluate(() => {
      s.age = 9; const par = parents17().find(childLocal55); if (!par) return 'нет родителя';
      par.privateCash = 1e8; par.bond = 100;
      for (let i = 0; i < 20; i++) { delete childhood67().requests.outing; if (askParent67('outing')) break; }
      return s.log.find(e => /поход в кино/.test(e.title))?.text || 'не согласились';
    });
    const monthly = await pg.evaluate(() => {
      // 269.1: настоящий месяц с кинотеатром и со сломанным состоянием из сохранения 269.
      s.age = 30; s.year = 2045; s.cash = 1e8; s.pending = []; if ($('#modal').open) closeModal();
      const sp = businessCatalog253.find(b => b.name === 'Кинотеатр' && b.country === countries[s.country].name);
      startEnterprise152('culture253', 'Месяц', sp.id); const b = s.enterprise152;
      const m0 = s.clock.month, y0 = s.year, errors = [];
      for (let i = 0; i < 3; i++) { try { advanceMonth(); } catch (e) { errors.push(e.message); } s.pending = []; if ($('#modal').open) closeModal(); }
      const moved = (s.year * 12 + s.clock.month) - (y0 * 12 + m0);
      b.cases254 = { modifiers: [] };
      try { advanceMonth(); } catch (e) { errors.push('broken: ' + e.message); } s.pending = []; if ($('#modal').open) closeModal();
      return { moved, errors, full: Array.isArray(b.cases254.cases) && Array.isArray(b.cases254.ledger), movedAfter: (s.year * 12 + s.clock.month) - (y0 * 12 + m0) };
    });
    check('кинотеатр: настоящий месяц идёт, сломанное состояние из 269 чинится', monthly.moved === 3 && monthly.movedAfter === 4 && monthly.full && !monthly.errors.length, monthly);
    check('кино: в семейном походе по детской просьбе назван детский фильм', /Смотрели «[^»]+»/.test(outing) || outing === 'нет родителя', outing);
    const more = await pg.evaluate(() => {
      const out = {}; s.age = 30; s.year = 2047; s.clock.month = 3; s.pending = []; if ($('#modal').open) closeModal();
      const texts = () => [...document.querySelectorAll('#modal .options button')].map(b => b.textContent);
      const click = re => { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
      // Афиша: в любом меню «Сходить в кино» сначала выбирается фильм, он попадает в задачу и в запись.
      const p = s.people.find(p => p.alive && p.age >= 18 && p.country === s.country && (!p.city18 || p.city18 === residenceCity()));
      show('Встречи', 'x', [{ label: 'Сходить в кино', fn: () => planMeeting53(p.id, 'cinema') }]);
      click(/^Сходить в кино/); out.poster = $('#modal h2').textContent + ' | ' + texts().slice(0, 2).join(' / ');
      const r0 = Math.random; Math.random = () => 0.01; p.meetingAfter53 = 0; click(/^«/); Math.random = r0;
      const t = s.clock.tasks.find(t => t.kind === 'meeting53'); out.chosen = t && filmById269(t.film269)?.title;
      if (t) { t.progress = t.duration; finishTask(t); out.meetLog = s.log.find(e => e.title === 'Сходить в кино')?.text || ''; }
      if ($('#modal').open) closeModal();
      show(hobbies.film[0], 'x', hobbies.film.slice(1).map(label => ({ label, fn: () => {} }))); out.hobbyCinema = texts().some(b => /^Сходить в кино/.test(b)); closeModal();
      // Названия премьер не повторяются в пределах 20 лет; сюжеты идут без повторов, пока не кончатся.
      const titles = [], stories = []; for (let ym = 2028 * 12; ym < 2048 * 12; ym++) for (const f of futureMonth269(ym)) { titles.push(f.title); stories.push(f.story); }
      out.titles = new Set(titles.slice(0, 200)).size === Math.min(200, titles.length) && new Set(stories.slice(0, filmStories269.length)).size === Math.min(filmStories269.length, stories.length);
      // Приглашение в кинопроект — конкретный проект с сюжетом.
      const x = creative47(), spec = Object.keys(specialties184.cinema)[0];
      x.works.push({ id: 'v1', track: 'cinema', specialty184: spec, quality: 90, level184: 2, title: 'Проба 1' }, { id: 'v2', track: 'cinema', specialty184: spec, quality: 90, level184: 2, title: 'Проба 2' }); x.nextCinema191 = 0;
      Math.random = () => 0.001; try { cinemaInvitation191(x.works.at(-1)); } finally { Math.random = r0; }
      const a = x.applications.find(a => a.offer.sourceWork191 === 'v2');
      out.invite = a ? (a.offer.project269 ? 'ok' : 'без проекта') : 'нет приглашения';
      out.inviteLog = s.log.find(e => e.title === 'Приглашение в новый проект')?.text || '';
      if (a) { offerMenu47(a.id, true); out.card = /Проект[\s\S]*Сюжет/.test($('#modal').innerText); closeModal(); }
      // Кинотеатр: отчёт раз в три месяца, перенос сеансов на хит поднимает спрос, поровну — множитель 1.
      s.cash = 1e8; const sp = businessCatalog253.find(b => b.name === 'Кинотеатр' && b.country === countries[s.country].name);
      startEnterprise152('culture253', 'Проверка 2', sp.id); const b = s.enterprise152; s.pending = [];
      out.even = cinemaPlan269(b).mult;
      for (let i = 0; i < 3; i++) { s.clock.ticks++; enterpriseLocationMonth168(b); }
      out.report = s.pending.some(q => q.type === 'cinemaReport269'); resolvePending();
      out.reportText = $('#modal').innerText; click(/^Добавить сеансов/); out.boost = cinemaPlan269(b).mult;
      cinemaMenu269(b.id); click(/^Без отчётов/); out.off = cinemaPlan269(b).mult; if ($('#modal').open) closeModal();
      // Цифры в подсказках и ё на экране.
      show('Проверка', 'Ребенок и Учеба', [{ label: 'Вариант', hint: 'настроение +5 · доверие +3', fn: () => {} }]);
      out.hint = $('#modal .options small').textContent; out.yo = $('#modal').innerText; closeModal();
      return out;
    });
    check('кино: в меню «Сходить в кино» — афиша, выбранный фильм в записи', /Сходить в кино \| «/.test(more.poster) && more.chosen && more.meetLog.includes('«' + more.chosen + '»'), more);
    check('кино: в увлечении «Кино» можно сходить на фильм по выбору', more.hobbyCinema, more);
    check('кино: премьеры будущего без повторов названий и сюжетов', more.titles, more);
    check('кино: приглашение в конкретный проект с сюжетом и разделом «Проект»', more.invite === 'ok' && /предлагают проект «[^»]+»/.test(more.inviteLog) && more.card, more);
    check('кинотеатр: отчёт по фильмам с прибылью и убытком раз в три месяца', more.report && /сеансов в неделю, зал заполнен на \d+%, (прибыль|убыток)/.test(more.reportText), more.reportText);
    check('кинотеатр: сеансы поровну не меняют спрос, перенос на хит — поднимает, без отчётов — снова поровну', more.even === 1 && more.boost > 1 && more.boost <= 1.15 && more.off === 1, more);
    check('подсказки: числа больше не вырезаются', /настроение \+5/.test(more.hint) && /доверие \+3/.test(more.hint), more.hint);
    check('ё: «Ребенок», «Учеба» на экране с ё', /Ребёнок и Учёба/.test(more.yo) && !/Ребенок|Учеба/.test(more.yo), more.yo);
    check('кино: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 16. Уведомления и возраст (270).
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '0', country: 'nl' });
    const reasons = await pg.evaluate(() => { s.clock.running = false; s.age = 3; return Object.fromEntries(actionCatalog24().map(a => [a.id, a.reason])); });
    const want = { vacancies58: 'С 16 лет', jobReplies58: 'С 16 лет', applications: 'С 16 лет', admission58: 'С 16 лет', dorm68: 'С 16 лет', training68: 'С 16 лет', finance32: 'С 18 лет', agreements: 'С 18 лет', transport56: 'С 12 лет', estates58: 'С 18 лет', justice91: 'С 18 лет', court94: 'С 18 лет', living68: 'С 18 лет', enterprise152: 'С 18 лет' };
    check('найти действие: в 3 года у взрослых пунктов есть возрастная причина', Object.entries(want).every(([id, r]) => reasons[id] === r) && reasons.health === '' && reasons.generations58 === '', Object.fromEntries(Object.keys(want).map(id => [id, reasons[id]])));
    const kid = await pg.evaluate(() => {
      const out = {}; s.clock.running = false; s.age = 3; s.pending = []; if ($('#modal').open) closeModal();
      const pool = s.people.filter(p => p.alive && kin27(p) && p.age >= 18 && !['Мать', 'Отец'].includes(p.role));
      const gp = pool.sort((a, b) => /Бабушка|Дедушка/.test(b.role) - /Бабушка|Дедушка/.test(a.role) || (b.country === s.country) - (a.country === s.country) || b.age - a.age)[0];
      if (!gp) return { error: 'нет взрослых родственников', roles: s.people.filter(p => p.alive).map(p => p.role) };
      gp.country = s.country; gp.city18 = residenceCity(); gp.age = 86; if (gp.bio27) gp.bio27.health = 55; gp.bond = Math.max(gp.bond || 0, 60);
      const month = () => { s.clock.ticks++; agingMonth58(); };
      for (let i = 0; i < 6; i++) month();
      const care = gp.aging58.care, helper = care && living(care.helper);
      out.need = gp.aging58.need; out.uncovered = gp.aging58.uncovered;
      out.items = decisionItems24().filter(i => i.ref.kind === 'elder58').length;
      out.requests = generations58().requests.filter(q => q.person === gp.id).length;
      out.helper = care?.status === 'active' && helper?.age >= 18 ? helper.role : null;
      s.age = 16; month(); month();
      out.teen = decisionItems24().filter(i => i.ref.kind === 'elder58').length;
      out.teenLog = s.log.find(e => e.title === gp.name + ': нужна помощь в быту')?.text || '';
      elderMenu58(gp.id); out.menu = [...document.querySelectorAll('#modal .options button')].map(b => b.textContent); closeModal();
      const cash = s.cash, hours = schedule23().total;
      out.light = setLightHelp270(gp.id, true); out.lightHours = schedule23().total - hours; out.cashSame = s.cash === cash;
      for (let i = 0; i < 14; i++) month();
      out.teenRequests = generations58().requests.filter(q => q.person === gp.id).length;
      // Родственник далеко: уведомление не обещает «навещать», кнопка объясняет, почему недоступна.
      const far = s.people.filter(p => p.alive && kin27(p) && p.age >= 18 && p.id !== gp.id && !['Мать', 'Отец'].includes(p.role) && p.id !== care?.helper)[0];
      if (far) {
        far.country = Object.keys(countries).find(c => c !== s.country); far.city18 = cities[far.country][0]; far.age = 87; if (far.bio27) far.bio27.health = 50; far.bond = Math.max(far.bond || 0, 60);
        s.age = 17; for (let i = 0; i < 4; i++) month();
        out.farLog = s.log.find(e => e.title === far.name + ': нужна помощь в быту')?.text || '';
        out.farNote = decisionItems24().find(i => i.ref.kind === 'elder58' && i.q.person === far.id)?.note || '';
        elderMenu58(far.id); out.farButton = [...document.querySelectorAll('#modal .options button')].map(b => b.textContent).find(b => /^Навещать/.test(b)) || ''; closeModal();
      } else out.farLog = out.farNote = out.farButton = 'нет родственника';
      // После 18 лет семейная договорённость продлевается и не истекает разом.
      s.age = 18; const adult = [];
      for (let i = 0; i < 12; i++) { month(); adult.push(gp.aging58.care?.status === 'active' && !!gp.aging58.care.family270); }
      out.adultCare = adult.every(Boolean); out.adultRequests = generations58().requests.filter(q => q.person === gp.id && !q.teen270).length;
      return out;
    });
    check('уход за пожилыми: до 16 лет просьбы нет, помощь взял взрослый родственник', kid.need > 0 && kid.items === 0 && kid.requests === 0 && kid.helper && kid.uncovered === 0, kid);
    check('уход за пожилыми: в 16–17 одно уведомление и только лёгкая помощь без денег', kid.teen === 1 && /Можно навещать и помогать по мелочи/.test(kid.teenLog) && kid.menu.some(b => /^Навещать и помогать по мелочи · 2 ч\/нед\./.test(b)) && !kid.menu.some(b => /Нанять|Помогать самому|Договориться|Обсудить помощника|Остановить/.test(b)) && kid.light && kid.lightHours === 2 && kid.cashSame && kid.teenRequests === 1, kid);
    check('уход за пожилыми: родственник далеко — «звонить и приезжать», кнопка объясняет причину', /Живёт далеко/.test(kid.farLog) && !/навещать/i.test(kid.farLog) && /Живёт далеко/.test(kid.farNote) && /Живёт далеко/.test(kid.farButton), { log: kid.farLog, note: kid.farNote, button: kid.farButton });
    check('уход за пожилыми: после 18 лет семейная помощь продолжается, просьба не приходит', kid.adultCare && kid.adultRequests === 0, { adultCare: kid.adultCare, adultRequests: kid.adultRequests });
    const ill = await pg.evaluate(() => {
      s.clock.running = false; s.age = 5; s.pending = []; if ($('#modal').open) closeModal();
      for (const p of parents17()) p.privateCash = 1e6;
      s.illness = illness23(); s.lastIllnessTick = s.clock.ticks; s.illness.left = 4;
      autonomousMonth(); s.pending = []; s.clock.running = false;
      const out = { treated: s.illness?.treated, by: s.illness?.parents270 };
      healthMenu(); out.menu = [...document.querySelectorAll('#modal .options button')].map(b => b.textContent); out.text = $('#modal').innerText; closeModal();
      out.cards = decisionItems24().filter(i => ['health58', 'recovery86'].includes(i.ref.kind) && i.ref.id === 'illness').length;
      return out;
    });
    check('болезнь до 12 лет: лечение выбирают и оплачивают родители, ребёнку — уведомление', ill.treated && ill.by === 'doctor' && !ill.menu.some(b => /Обратиться к врачу|Помощь без оплаты/.test(b)) && /Родители отвели к врачу и оплатили приём/.test(ill.text) && !/игровой модели/.test(ill.text) && ill.cards === 1, ill);
    const trip = await pg.evaluate(() => {
      s.clock.running = false; s.age = 6; s.illness = null; s.pending = []; if ($('#modal').open) closeModal();
      const host = parents17()[0]; if (!host) return { error: 'нет живых родителей' };
      for (const p of parents17()) { p.bond = 90; p.inner.trust = 90; p.inner.strain = 0; p.privateCash = 1e6; }
      const offer = () => { const x = familyTravel53(); x.lastOffer = -100; x.invitations = []; x.hosts = {}; return offerTravel53(host); };
      const buttons = () => [...document.querySelectorAll('#modal .options button')];
      const q = offer(); if (!q) return { error: 'нет приглашения' };
      const party = q.draft.party53.map(id => living(id)?.role), item = decisionItems24().find(i => i.ref.kind === 'tripInvite53');
      openDecision24('tripInvite53', q.id);
      const out = { party, pets: livePets57().length, item: item?.title, title: $('#modal h2').textContent, text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join(' '), buttons: buttons().map(b => b.textContent) };
      out.label = quickCard59(item).match(/title="([^"]*)"/)?.[1];
      buttons().find(b => /^Поехать с /.test(b.textContent))?.click();
      out.status = q.status; out.log = s.log.find(e => e.title === 'Семейная поездка · ' + q.draft.city)?.text || '';
      const q2 = offer(); if (!q2) return { ...out, error: 'нет второго приглашения' };
      // Второе приглашение — будто дома есть питомец: присмотр за питомцами упоминается.
      const pets0 = livePets57; livePets57 = () => [{ alive: true }];
      try { openDecision24('tripInvite53', q2.id); out.pets2 = livePets57().length; out.text2 = [...document.querySelectorAll('#modal p')].map(p => p.textContent).join(' '); } finally { livePets57 = pets0; }
      buttons().find(b => /^Остаться дома/.test(b.textContent))?.click();
      out.status2 = q2.status; out.stay = s.log.find(e => e.title === 'Семейная поездка · ' + q2.draft.city)?.text || '';
      out.badSitter = s.people.filter(p => p.age >= 80 || p.aging58?.need || !kin27(p)).map(p => p.name).filter(n => out.stay.includes(n));
      return out;
    });
    const who = /(Папа|Мама|Родители) зов(ёт|ут) вас в поездку: [^,]+, \d+ дн\./;
    check('поездка родителей до 12 лет — семейная: поехать или остаться, без виз и дороги', !trip.error && /^Семейная поездка · /.test(trip.item) && /^Семейная поездка · /.test(trip.title) && trip.buttons.length === 2 && /^Поехать с (папой|мамой|родителями)/.test(trip.buttons[0]) && /^Остаться дома/.test(trip.buttons[1]) && trip.label === 'Остаться дома' && trip.status === 'family270' && /^Съездили с (папой|мамой|родителями): /.test(trip.log), trip);
    check('поездка родителей: текст по составу поездки, город без предлога, питомцы — только если есть', !trip.error && who.test(trip.text) && !/ в [А-ЯЁ]/.test(trip.text + trip.log + trip.stay) && (trip.party.filter(r => /Мать|Отец/.test(r)).length >= 2 || !/Родители/.test(trip.text + trip.log)) && /питомц/.test(trip.text) === trip.pets > 0 && /питомц/.test(trip.log) === trip.pets > 0 && trip.pets2 > 0 && /присмотр за питомцами/.test(trip.text2), trip);
    check('поездка родителей: «остаться дома» — с близким, не с пожилым или чужим', !trip.error && trip.status2 === 'declined' && /без вас: .*Вы остались дома/.test(trip.stay) && !trip.badSitter.length, trip);
    // Наследство — последним: смерть родителя не должна мешать поездке (в ~3% стартов родитель один).
    const est = await pg.evaluate(() => {
      s.clock.running = false; s.age = 3; s.pending = []; if ($('#modal').open) closeModal();
      const roles = s.people.filter(p => p.alive).map(p => p.role);
      const mom = s.people.find(p => p.alive && p.role === 'Мать') || parents17()[0];
      if (!mom) return { error: 'нет живых родителей', roles };
      mom.privateCash = 20000; mom.deathCause143 = 'проверка'; mom.alive = false;
      const before = s.cash, month = () => { s.clock.ticks++; estatesMonth58(); };
      for (let i = 0; i < 20; i++) month();
      const q = estates58().cases.find(q => q.person === mom.id), h = q?.heirs.find(h => h.person === 'player');
      if (!q || !h) return { error: q ? 'игрок не наследник' : 'нет наследственного дела', roles, mom: mom.role, heirs: q?.heirs.map(h => h.person) };
      const g = h.guardian270 && s.people.find(p => p.id === h.guardian270);
      const out = { mom: mom.role, status: h.status, held: !!h.held270, share: h.share, early: s.cash - before, items: decisionItems24().filter(i => i.ref.kind === 'estate58').length, expected: localAmount16(h.cash, q.country), claims: q.claims.length, guardian: g?.name || null };
      out.feed = s.log.find(e => e.title === 'Наследство · ' + mom.name)?.text || '';
      estateCaseMenu58(q.id); out.menu = [...document.querySelectorAll('#modal .options button')].map(b => b.textContent); closeModal();
      s.age = 18; month(); out.after18 = s.cash - before;
      out.release = s.log.find(e => e.title === 'Наследство перешло к вам')?.text || '';
      return out;
    });
    check('наследство: после смерти родителя доля трёхлетнего не уходит другим, её хранит опекун', !est.error && est.status === 'accepted' && est.held && est.share > 0 && est.early === 0 && est.items === 0 && /хранит/.test(est.feed) && !est.menu.some(b => /Отказаться от своей доли|Принять свою долю/.test(b)), est);
    check('наследство: в 18 лет деньги переходят к игроку', !est.error && est.expected > 0 && Math.abs(est.after18 - est.expected) < 1, est);
    check('наследство: «доли имущества» только при имуществе, в 18 лет назван тот, кто хранил долю', !est.error && /доли имущества/.test(est.feed) === est.claims > 0 && /доли имущества/.test(est.release) === est.claims > 0 && (est.guardian ? est.release.includes(est.guardian) : /опекун/.test(est.release)), est);
    check('уведомления и возраст (ребёнок): без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'nl' });
    const ad = await pg.evaluate(() => {
      const out = {}; s.clock.running = false; s.pending = []; if ($('#modal').open) closeModal();
      const olds = s.people.filter(p => p.alive && kin27(p) && p.age >= 18 && !['Мать', 'Отец'].includes(p.role)).sort((a, b) => (b.country === s.country) - (a.country === s.country) || b.age - a.age).slice(0, 2);
      for (const p of olds) { p.country = s.country; p.city18 = residenceCity(); p.age = 86; if (p.bio27) p.bio27.health = 55; p.bond = Math.max(p.bond || 0, 60); if (p.aging58) p.aging58.care = null; }
      const month = () => { s.clock.ticks++; agingMonth58(); };
      for (let i = 0; i < 6; i++) month();
      const reqs = generations58().requests.filter(q => olds.some(p => p.id === q.person) && q.status === 'offered');
      out.created = generations58().requests.map(q => q.created); out.ours = reqs.length;
      const q = reqs[0], other = reqs[1];
      if (!q) return { ...out, error: 'нет просьбы' };
      out.card = quickCard59(decisionItems24().find(i => i.ref.id === q.id)).match(/title="([^"]*)"/)?.[1];
      elderMenu58(q.person); const b = [...document.querySelectorAll('#modal .options button')].find(b => /^Не сейчас/.test(b.textContent)); out.notNow = !!b; b?.click();
      out.status = q.status; out.x = other ? quickDismiss59('elder58', other.id) && other.status : null;
      const seen = [];
      for (let i = 1; i <= 11; i++) { month(); seen.push(decisionItems24().some(i => i.ref.kind === 'elder58' && i.q.person === q.person)); }
      out.seen = seen;
      return out;
    });
    check('уход за пожилыми: просьбы нескольких близких приходят в разные месяцы', ad.ours === 2 && new Set(ad.created).size === ad.created.length, ad);
    check('уход за пожилыми: «Не сейчас» и «×» — отказ, 12 месяцев без новой просьбы', ad.card === 'Не сейчас' && ad.notNow && ad.status === 'declined' && ad.x === 'declined' && ad.seen.every(v => !v), ad);
    const hide = await pg.evaluate(() => {
      const out = {}; s.clock.running = false; s.age = 30; s.cash = 1e8; s.pending = []; if ($('#modal').open) closeModal();
      s.illness = illness23(); s.lastIllnessTick = s.clock.ticks; s.illness.left = 6;
      const keys = () => decisionItems24().map(i => i.ref.kind + ':' + i.ref.id);
      out.illnessCards = keys().filter(k => /^(health58|recovery86):illness$/.test(k)).length;
      startEnterprise152('services', 'Мастерская', 'repair'); const b = s.enterprise152;
      const c = { id: b.id + '-case254-t', business: b.id, specialty: b.specialty, country: b.country, city: b.city, event: Object.keys(businessIndex254)[0], tick: s.clock.ticks, expires: s.clock.ticks + 20, status: 'offered', unit: 1, entity: {} };
      businessState254(b).cases.push(c);
      const src = s.people.find(p => p.alive && p.role !== 'Ребенок');
      const baby = JSON.parse(JSON.stringify(src)); Object.assign(baby, { id: 't-baby270', role: 'Ребенок', age: 0, name: 'Проба', namePending256: true, alive: true }); s.people.push(baby);
      const want = ['business254:' + c.id, 'childName256:t-baby270', 'health58:illness'];
      out.before = want.map(k => keys().includes(k));
      out.label = quickCard59(decisionItems24().find(i => i.ref.kind === 'childName256')).match(/title="([^"]*)"/)?.[1];
      out.dismiss = [quickDismiss59('business254', c.id), quickDismiss59('childName256', 't-baby270'), quickDismiss59('recovery86', 'illness')];
      const t0 = s.clock.ticks; out.vis = [];
      for (let k = 0; k <= 3; k++) { s.clock.ticks = t0 + k; s.illness.left = 6; const ks = keys(); out.vis.push(want.map(w => ks.includes(w) || w === 'health58:illness' && ks.includes('recovery86:illness'))); }
      s.clock.ticks = t0;
      // Свой срок короче трёх месяцев: новая аренда (истекает через 2 мес.) и событие дела (через 3 мес.).
      b.rentOffer159 = { id: 'enterprise-rent-' + b.id + '-t270', space: b.space157 ?? 'standard', expires: t0 + 2 };
      const c3 = { ...c, id: b.id + '-case254-t3', expires: t0 + 3 }; businessState254(b).cases.push(c3);
      const short = [{ kind: 'enterpriseRent239', id: b.rentOffer159.id }, { kind: 'business254', id: c3.id }];
      out.shortLabels = short.map(r => quickCard59(decisionItems24().find(i => i.ref.kind === r.kind && i.ref.id === r.id) || { ref: r, title: '', note: '' }).match(/class="quick-close59"[^>]*title="([^"]*)"/)?.[1]);
      out.shortDismiss = short.map(r => quickDismiss59(r.kind, r.id));
      out.shortVis = [];
      for (let k = 1; k <= 2; k++) { s.clock.ticks = t0 + k; const ks = keys(); out.shortVis.push(short.map(r => ks.includes(r.kind + ':' + r.id))); }
      s.clock.ticks = t0 + 3; b.rentOffer159 = null; c3.status = 'declined';
      pruneSnoozed270(); out.left = Object.keys(notices59().snoozed).length;
      s.localEvent99 = { id: 'local99-t270', tick: s.clock.ticks, expires: s.clock.ticks + 2, status: 'offered', country: s.country, city: residenceCity(), title: 'Вечер в районе', text: 'Проверка.', companion: null, holiday130: false, family178: null, price: 1 };
      out.local = quickDismiss59('local99', 'local99-t270') && s.localEvent99.status;
      healthMenu(); out.healthText = $('#modal').innerText; closeModal();
      const e = catalog245.events.find(e => e.id === 'E0098'); out.e0098 = e.text;
      out.ty = catalog245.events.flatMap(e => [e.text, ...e.choices.flatMap(c => c.outcomes.map(o => o.text))]).filter(t => /(^|[^А-Яа-яЁё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твои|твоего|твоим)([^А-Яа-яЁё]|$)/i.test(t)).length;
      return out;
    });
    check('«×»: одна карточка на болезнь, без дубля восстановления', hide.illnessCards === 1, hide);
    check('«×»: восстановление, имя ребёнка и событие дела скрыты 3 месяца, потом возвращаются', hide.before.every(Boolean) && hide.dismiss.every(Boolean) && hide.vis.slice(0, 3).every(r => r.every(v => !v)) && hide.vis[3].every(Boolean) && hide.label === 'Скрыть на 3 месяца' && hide.left === 0, hide);
    check('«×»: пункт со сроком раньше трёх месяцев возвращается до срока, подпись это говорит', hide.shortLabels[0] === 'Напомнить в следующем месяце' && hide.shortLabels[1] === 'Напомнить ближе к сроку' && hide.shortDismiss.every(Boolean) && hide.shortVis[0][0] && !hide.shortVis[0][1] && hide.shortVis[1][1], { labels: hide.shortLabels, dismiss: hide.shortDismiss, vis: hide.shortVis });
    check('«×» у местного события — «Пропустить»', hide.local === 'declined', hide.local);
    check('тексты: без «игровой модели» в болезни, «от вас потребуется» в каталоге', /Тяжесть: /.test(hide.healthText) && !/игровой модели/.test(hide.healthText) && /от вас потребуется/.test(hide.e0098) && hide.ty === 0, { e: hide.e0098, ty: hide.ty });
    const liv = await pg.evaluate(() => {
      const out = {}; s.clock.running = false; s.gender = 'm'; s.age = 19; s.job = null; s.pending = []; if ($('#modal').open) closeModal();
      for (const p of parents17()) { p.privateCash = 1e6; p.inner.trust = 80; }
      const z = students68(); z.offer = null; z.retry = -1; z.support = null;
      const buttons = () => [...document.querySelectorAll('#modal .options button')];
      out.offer = !!livingOffer68();
      livingMenu68(); buttons().find(b => /^Справлюсь сам(?!а)/.test(b.textContent))?.click();
      out.status = z.offer?.status;
      // Передумать: кнопка в меню работает и после отказа.
      livingMenu68(); out.menuText = $('#modal').innerText; const agree = buttons().find(b => /^Договориться о ежемесячной помощи/.test(b.textContent));
      out.agreeEnabled = !!agree && !agree.disabled; agree?.click(); out.support = z.support?.status || null; if ($('#modal').open) closeModal();
      z.offer = null; z.support = null; z.retry = -1;
      const t0 = s.clock.ticks; const q0 = livingOffer68(); out.x0 = !!q0 && quickDismiss59('living68', q0.id) && z.offer.status;
      out.seen = [];
      for (let k = 1; k <= 12; k++) { s.clock.ticks = t0 + k; out.seen.push(decisionItems24().some(i => i.ref.kind === 'living68')); }
      const q = livingOffer68(); out.x = !!q && quickDismiss59('living68', q.id) && z.offer.status;
      // Женский род: «Справлюсь сама» и в меню, и у «×».
      s.gender = 'f'; z.offer = null; z.retry = -1; s.clock.ticks += 13;
      const qf = livingOffer68(); out.cardF = qf && quickCard59(decisionItems24().find(i => i.ref.kind === 'living68')).match(/class="quick-close59"[^>]*title="([^"]*)"/)?.[1];
      livingMenu68(); out.menuF = buttons().map(b => b.textContent).find(b => /^Справлюсь/.test(b)) || ''; closeModal();
      return out;
    });
    check('помощь на жизнь: «Справлюсь сам» и «×» — отказ на 12 месяцев', liv.offer && liv.status === 'declined' && liv.x0 === 'declined' && liv.seen.slice(0, 11).every(v => !v) && liv.seen[11] && liv.x === 'declined', liv);
    check('помощь на жизнь: после отказа можно передумать в меню', liv.agreeEnabled && liv.support === 'active' && /Вы отказались от регулярной помощи/.test(liv.menuText), liv);
    check('помощь на жизнь: «Справлюсь сама» для героини', liv.cardF === 'Справлюсь сама' && /^Справлюсь сама/.test(liv.menuF), { card: liv.cardF, menu: liv.menuF });
    const bills = await pg.evaluate(async () => {
      const out = {}; s.clock.running = false; s.gender = 'm'; s.age = 30; s.cash = 30000; s.pending = []; if ($('#modal').open) closeModal();
      s.debts.push({ id: id16('bill32'), type: 'bill32', billKind32: 'rent', creditor32: 'проверка', country: s.country, balance: 1500, principal: 1500, rate: 0, payment: 0, paid: 0, missed: 0, started: s.clock.ticks, due: s.clock.ticks, history32: [] });
      const wait = () => new Promise(r => setTimeout(r, 20));
      life61().nextBills = 0; s.clock.ticks++; monthlyFinance(); await wait();
      out.first = $('#modal').open && $('#modal h2').textContent; if ($('#modal').open) closeModal();
      const q = life61().notices.filter(q => q.type === 'bills').at(-1);
      out.label = q && quickCard59(decisionItems24().find(i => i.ref.kind === 'life61' && i.ref.id === q.id)).match(/class="quick-close59"[^>]*title="([^"]*)"/)?.[1];
      out.x = !!q && quickDismiss59('life61', q.id);
      out.months = [];
      for (let k = 1; k <= 4; k++) {
        s.clock.running = true; s.clock.ticks++; monthlyFinance(); await wait();
        out.months.push({ open: $('#modal').open, running: s.clock.running, shown: decisionItems24().some(i => i.ref.kind === 'life61' && decisionRecord24(i.ref)?.type === 'bills') });
        if ($('#modal').open) closeModal();
      }
      s.clock.running = false;
      // Через годы после отсрочки новые старые счета снова открывают окно.
      const z = life61(), last = z.notices.filter(q => q.type === 'bills').at(-1); last.status = 'later'; last.postponed270 = s.clock.ticks - 30; z.nextBills = 0;
      s.clock.running = true; s.clock.ticks++; monthlyFinance(); await wait();
      out.later = { open: $('#modal').open, title: $('#modal').open && $('#modal h2').textContent, running: s.clock.running };
      // «Напомнить через три месяца» в окне — та же отсрочка, что и «×».
      if ($('#modal').open) [...document.querySelectorAll('#modal .options button')].find(b => /^Напомнить через три месяца/.test(b.textContent))?.click();
      const q3 = z.notices.filter(q => q.type === 'bills').at(-1); out.menuLater = { status: q3.status, postponed: q3.postponed270 === s.clock.ticks, next: z.nextBills - s.clock.ticks };
      if ($('#modal').open) closeModal(); s.clock.running = false;
      return out;
    });
    check('счета: «×» — 3 месяца тишины, окно само не открывается, автоигра идёт', bills.first === 'Закрыть старые счета' && bills.label === 'Скрыть на 3 месяца' && bills.x && bills.months.every(m => !m.open && m.running) && !bills.months[0].shown && !bills.months[1].shown && bills.months[2].shown, bills);
    check('счета: тишина только сразу после отсрочки, «Напомнить через три месяца» — та же отсрочка', bills.later.open && bills.later.title === 'Закрыть старые счета' && !bills.later.running && bills.menuLater.status === 'later' && bills.menuLater.postponed && bills.menuLater.next === 3, bills);
    check('уведомления и возраст (взрослый): без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} проверок прошли`);
  process.exit(bad.length ? 1 : 0);
})();
