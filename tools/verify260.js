// Точечные проверки сборок 259–260: меню здоровья, питомцы, помёт, просьба о питомце, праздники.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify260.js
// Если pets260.js / holidays260.js ещё не подключены в index.html, скрипт подгружает их сам.
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
  for (const f of ['pets260.js', 'holidays260.js'])
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

  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} проверок прошли`);
  process.exit(bad.length ? 1 : 0);
})();
