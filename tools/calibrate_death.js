// Прогон жизней для калибровки смертности: снимает здоровье по годам.
// Игра раздаётся с диска через перехват запросов, сервер не нужен.
//
//   node tools/calibrate_death.js OUT.jsonl N MAX_AGE POLICY SEED [DEATH]
//
// POLICY: random — случайные действия harness.js;
//         care   — то же плюс «Восстановить силы» всегда в расписании, «Движение» каждый месяц, врач при болезни;
//         smoker / drinker — случайный игрок, который с 18 лет курит или пьёт регулярно и сильно;
//         creative — с 18 лет иллюстратор: берёт лучший доступный заказ, без заказа делает работу в портфолио
//                    (276: заказ берёт «всё равно», даже если неделя не сходится, — как до окна «Неделя не сходится»);
//         worker — 276: с 18 до 65 лет всегда работа 40 ч в другом районе, в каждой второй жизни (нечётные SEED + номер)
//                  с 30 до 65 лет ещё и своё дело «сам»; прогон держит это всю жизнь: здоровье при долгой перегрузке;
//         workerrest — 276: тот же работник, но «Восстановить силы» в расписании, пока он работает (до 65 лет; без
//                  «Движения» и врача): отдых при перегрузке помогает, но не отменяет её. После 65 отдых не ставится —
//                  польза отдыха в старости к перегрузке отношения не имеет (её показывает care).
//         over / overrest — 276: тот же работник, но своё дело «сам» с 30 до 65 лет в каждой жизни — по-настоящему
//                  перегруженный (нехватка 15–35 ч в неделю годами); overrest — с «Восстановить силы» до 65.
// DEATH:  off — смерть только в 100 (снять траекторию здоровья);
//         old — как было до 258 (только после 75); new — mortality258.js, как в игре.
// RNG=1 — 276: одни и те же случайные числа в игре (Math.random от SEED и номера жизни, часы игры в реальном времени
//         остановлены, Date.now — счётчик): две сборки сравниваются на одних и тех же жизнях, пока их пути не разошлись.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const [OUT = 'trajectories.jsonl', N = '4', MAX_AGE = '100', POLICY = 'random', SEED = '1', DEATH = 'new'] = process.argv.slice(2);
const HARNESS = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8').replace(/console\.log\(/g, '(()=>{})(');
const NEW_DEATH = 'mortality258()||s.age>=100';
const RNG = process.env.RNG === '1';
const CREATIVE_TRACK = 'finearts';
const OLD_DEATH = 's.age>75&&chance(Math.min(.8,(s.age-74)*.018+(100-s.health)*.002))||s.age>=100';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

function rng(seed) { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

async function serve(ctx) {
  await ctx.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'game.local') return route.abort();
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    let body = fs.readFileSync(file);
    if (rel === 'offline-game.js') body = Buffer.from('');
    if (rel === 'game.js' && DEATH !== 'new') {
      const src = body.toString('utf8');
      if (!src.includes(NEW_DEATH)) throw new Error('death line in game.js changed');
      body = Buffer.from(src.replace(NEW_DEATH, DEATH === 'old' ? OLD_DEATH : 's.age>=100'));
    }
    route.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' } });
  });
}

// Каждое изменение s.health записывается с источником «файл:функция»; в снимке года — суммы за год.
const TRACE = `(()=>{let h=s.health;window.__HA={};Object.defineProperty(s,'health',{configurable:true,enumerable:true,get(){return h},set(v){
  const d=v-h;if(d){let src='?';for(const line of (new Error().stack||'').split('\\n').slice(2)){const m=line.match(/at (?:([\\w$.<>]+) )?\\(?[^()]*\\/([\\w-]+\\.js)/);
  if(m&&m[2]!=='harness.js'){src=m[2]+':'+(m[1]||'?').replace(/^Object\\./,'');break}}src+=d<0?' -':' +';__HA[src]=(__HA[src]||0)+d}h=v}})})()`;

const SNAP = `(()=>{const h=habits78();const z=s.health25;const src=window.__HA||{};window.__HA={};return {age:s.age,health:+s.health.toFixed(2),fatigue:Math.round(s.clock.fatigue),mood:Math.round(s.mood),
  ill:!!s.illness,chronic:(z&&z.conditions||[]).length,smoke:h.smoke.strength||0,drink:h.drink.strength||0,cash:Math.round(s.cash),dead:!!s.dead,creative:typeof creative47==='function'?(()=>{const x=creative47(),done=x.applications.filter(a=>a.status==='completed'&&a.offer.track==='${CREATIVE_TRACK}');return {works:x.works.filter(w=>w.track==='${CREATIVE_TRACK}').length,paid:Math.round(done.reduce((n,a)=>n+(a.paid||0),0)),hours:Math.round(done.reduce((n,a)=>n+a.offer.hours*a.offer.duration*52/12,0)),level:Math.max(0,...x.works.filter(w=>w.track==='${CREATIVE_TRACK}').map(w=>w.level184||0)),rep:s.reputation262?.['${CREATIVE_TRACK}']?.value??null,wage:c().wage}})():null,smokeYears:typeof habits78==='function'?+(habits78().smoke.years261||0).toFixed(1):null,drinkYears:typeof habits78==='function'?+(habits78().drink.years261||0).toFixed(1):null,fitness:typeof health259==='function'?Math.round(health259().fitness):null,ceiling:typeof healthCeiling259==='function'?healthCeiling259():null,trend:Number.isFinite(s.healthTrend258)?+s.healthTrend258.toFixed(1):null,
  work:{job:s.job?s.workHours||40:0,biz:typeof ownedEnterprises168==='function'?ownedEnterprises168().filter(b=>b.status==='active').length:0,miss:s.time276?.month?.missing??null},
  src:Object.fromEntries(Object.entries(src).map(([k,v])=>[k,+v.toFixed(2)]))}})()`;

// Заботливый игрок: отдых всегда в расписании (случайные клики harness.js иногда ставят его на паузу —
// он его возобновляет), врач при болезни и «Движение» раз в месяц.
// «Движение» начисляется напрямую (+4 к форме, как от занятия): случайные клики держат деньги у нуля всю жизнь,
// и оплата занятия в начале месяца проваливается. Это допущение прогона, не игры.
const CARE = `(()=>{if(s.dead||s.age<16)return;const r=s.clock.tasks.find(t=>t.kind==='rest');if(!r)assign('rest');else if(r.state==='paused')pauseTask05(r.id);
  if(typeof health259==='function'&&window.__careTick!==s.clock.ticks){window.__careTick=s.clock.ticks;addFitness259(4);}
  const a=s.illness;if(a&&!a.treated){a.treated=true;a.left=Math.min(a.left||2,2);}})()`;

// Только отдых (для workerrest): «Восстановить силы» всегда в расписании, без «Движения» и врача.
const RESTONLY = `(()=>{if(s.dead||s.age<16)return;const r=s.clock.tasks.find(t=>t.kind==='rest');if(!r)assign('rest');else if(r.state==='paused')pauseTask05(r.id);})()`;
// 276: для workerrest — отдых в расписании, пока работник работает (до 65): после 65 он такой же пенсионер, как и работник
// без отдыха, — иначе в сравнение попадает польза отдыха в старости, которая к перегрузке отношения не имеет.
const RESTWORK = `(()=>{if(s.age>=65)return;${RESTONLY}})()`;

// Курильщик / пьющий: с 18 лет привычка всегда регулярная и сильная (6). Оплата привычки в прогоне всегда проходит —
// случайные клики держат деньги у нуля, а в игре без денег привычка уходит в «сокращение». Это допущение прогона.
const HABIT = kind => `(()=>{if(s.dead||s.age<18||typeof habits78!=='function')return;if(!window.__habitPay){window.__habitPay=1;const pay=payExpense23;
  payExpense23=function(amount,label,key,...r){if(String(key||'').startsWith('habit78:'))return true;return pay.call(this,amount,label,key,...r)}}
  const h=habits78()['${kind}'];h.strength=6;delete h.mode;h.withdrawal261=0;})()`;

// Творческая карьера: с 18 лет иллюстрации (finearts) — лучший доступный заказ, принять каждое предложение,
// без заказа — работа для портфолио. Случайных кликов меньше (5%), чтобы они не отменяли работу.
const CREATIVE = `(()=>{if(s.dead||s.age<18||typeof creative47!=='function')return;const x=creative47(),tick=s.clock.ticks;
  for(const a of x.applications)if(a.status==='offered'&&tick<a.until&&creativeTasks47().length<3)(typeof forceRun276==='function'?forceRun276:f=>f())(()=>acceptCreative47(a.id));
  if(creativeTasks47().length||s.clock.tasks.some(t=>t.kind==='creativeReview47'&&!['completed','cancelled'].includes(t.state)))return;
  const offers=creativeMarket47('${CREATIVE_TRACK}').filter(o=>!x.applications.some(a=>a.offer.id===o.id)&&!creativeCheck47(o).why.length)
    .sort((a,b)=>(b.level184||1)-(a.level184||1)||b.fee-a.fee);
  if(offers[0])applyCreative47(offers[0].id);else sampleWork47('${CREATIVE_TRACK}');})()`;

// Работник (276): работа 40 ч в другом районе с 18 до 65 лет; при нечётных SEED + номер с 30 до 65 лет ещё своё дело «сам».
// Прогон держит это всю жизнь: без работы — новая через месяц; часы, урезанные случайными кликами (75%, 50%, удалёнка,
// гибрид), — снова 40 в другом районе; дело — снова «сам», деньги на его счёт добавляются до закрытия, закрытое или
// проданное открывается заново. Окно «Неделя не сходится» прогон не открывает: цель — долгая перегрузка, а не выбор
// игрока. Деньги на открытие и на счёт дела прогон добавляет (случайные клики держат деньги у нуля) — допущение прогона.
const WORKER = `(()=>{if(s.dead||s.age<18)return;const run=typeof forceRun276==='function'?forceRun276:f=>f();
  const home=s.housing?.area,other=home==='center'?'suburb':'center';
  if(s.age<65&&!s.job&&window.__wTick!==s.clock.ticks){window.__wTick=s.clock.ticks;const p=professions16.find(p=>p.id==='accountant')||professions16[0];
    s.job={title:p.title,employer:'Контора',professionId:p.id,salary:c().wage,tenure:0,format:'far',language:(country16[s.country]||[])[0],allowedCountries:[s.country],
      workplace:{country:s.country,city:residenceCity(),area:other},hours28:40,fullHours28:40,fraction28:1};s.workHours=40;s.hoursJob=s.job.title;}
  if(s.age<65&&s.job){const j=s.job,cur=s.workHours||40;
    if(cur!==40){j.salary*=40/cur;s.workHours=j.hours28=40;j.fullHours28=40;j.fraction28=1;s.hoursJob=j.title;}
    if(j.format!=='far'||!j.workplace||j.workplace.area===home)j.format='far',j.workplace={...(j.workplace||{}),country:s.country,city:residenceCity(),area:other};}
  if(window.__wBiz&&s.age>=30&&s.age<65&&typeof startEnterprise152==='function'){
    let b=ownedEnterprises168().find(b=>b.id===window.__wBizId);
    if(!b&&window.__wBizTick!==s.clock.ticks){window.__wBizTick=s.clock.ticks;const q=enterpriseQuote152('services','hair');s.cash+=q.fee+q.reserve+1000;
      if(run(()=>startEnterprise152('services','Мастерская','hair',null,s.enterprise152?.status==='active')))window.__wBizId=s.enterprise152.id;b=ownedEnterprises168().find(b=>b.id===window.__wBizId);}
    if(b){if(b.mode263!=='self')run(()=>setBusinessMode263(b.id,'self'));const h=b.history?.at(-1);if(h&&b.cash<3*h.costs)b.cash+=6*h.costs;}}})()`;

async function life(browser, idx, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await serve(ctx);
  if (RNG) await ctx.addInitScript(seed => { let x = seed >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    let t = 1764000000000; Date.now = () => t++; const si = window.setInterval; window.setInterval = (f, ms, ...r) => ms === 250 ? 0 : si(f, ms, ...r); }, (+SEED * 7919 + idx * 104729) >>> 0);
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message || e).slice(0, 300)));
  const t0 = Date.now();
  const res = { idx, cfg, policy: POLICY, death: DEATH, seed: +SEED, years: [] };
  try {
    await pg.goto('http://game.local/index.html', { waitUntil: 'load' });
    await pg.waitForFunction("typeof start==='function' && document.querySelector('#country')");
    for (const [k, v] of Object.entries(cfg))
      await pg.evaluate(([k, v]) => { const e = document.getElementById(k); if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [k, v]);
    await pg.click('text=Родиться');
    await pg.waitForFunction("typeof s!=='undefined' && s && s.clock", null, { timeout: 15000 });
    await pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} });
    await pg.evaluate(HARNESS);
    // Сохранения в localStorage не нужны прогону и тормозят его к старости.
    await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await pg.evaluate(TRACE);
    if (POLICY === 'worker' || POLICY === 'workerrest') await pg.evaluate(i => { window.__wBiz = i % 2 === 1; }, +SEED + idx);
    if (POLICY === 'over' || POLICY === 'overrest') await pg.evaluate(() => { window.__wBiz = true; });
    // Счётчик записей ленты за всю жизнь (игра хранит только последние 500): заголовок, метка, крупная ли, видна ли.
    await pg.evaluate(() => { window.__LC = {}; const base = log; log = function (title, text, tag = '', major = false, ...r) {
      const k = String(title) + ' | ' + (tag || ''); const e = window.__LC[k] ??= { n: 0, major: 0, stored: 0, sample: String(text).slice(0, 140) }; e.n++; if (major) e.major++;
      const head = s.log[0], out = base.call(this, title, text, tag, major, ...r); if (s.log[0] !== head) e.stored++; return out; }; });
    res.start = await pg.evaluate("({country:s.country,gender:s.gender,bg:s.background,age:s.age})");
    res.years.push(await pg.evaluate(SNAP));
    let age = res.start.age;
    while (true) {
      const st = await pg.evaluate(([care, act]) => {
        let n = 0;
        const a0 = s.age;
        while (!s.dead && s.age === a0 && n++ < 400) { if (care) eval(care); __H.run(1, act); }
        __H.texts = []; __H.actions = [];
        return { age: s.age, dead: s.dead };
      }, [POLICY === 'care' ? CARE : POLICY === 'smoker' ? HABIT('smoke') : POLICY === 'drinker' ? HABIT('drink') : POLICY === 'creative' ? CREATIVE : (POLICY === 'worker' || POLICY === 'over') ? WORKER : (POLICY === 'workerrest' || POLICY === 'overrest') ? WORKER + ';' + RESTWORK : '', POLICY === 'creative' ? 0.05 : 0.25]);
      if (st.age !== age || st.dead) { res.years.push(await pg.evaluate(SNAP)); age = st.age; }
      if (st.dead || st.age >= +MAX_AGE) break;
      if (Date.now() - t0 > 40 * 60e3) { res.timeout = true; break; }
    }
    res.issues = await pg.evaluate('__H.issues.length');
    res.feed = await pg.evaluate(() => window.__LC || null);
    res.quiet = await pg.evaluate(() => typeof quietEntry === 'function' ? s.log.filter(e => quietEntry(e)).length + '/' + s.log.length : null);
    res.issueList = await pg.evaluate('__H.issues.slice(0,10).map(i=>i.kind+": "+String(i.detail).slice(0,120)+" @"+i.age)');
  } catch (e) { res.fatal = String(e).slice(0, 500); }
  res.errors = errors.slice(0, 10);
  res.secs = Math.round((Date.now() - t0) / 1000);
  await ctx.close();
  const last = res.years[res.years.length - 1] || {};
  console.log(idx, JSON.stringify(res.start), '->', last.age, last.dead ? 'dead' : '', 'h=' + last.health, res.secs + 's', res.fatal || '');
  return res;
}

(async () => {
  const r = rng(+SEED);
  const pick = a => a[Math.floor(r() * a.length)];
  const countries = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx', 'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl'];
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  for (let i = 0; i < +N; i++) {
    const cfg = { startAge: pick(['0', '18', '18']), country: pick(countries), gender: pick(['f', 'm']), background: pick(['low', 'mid', 'mid', 'high']) };
    const res = await life(browser, i, cfg);
    fs.appendFileSync(OUT, JSON.stringify(res) + '\n');
  }
  await browser.close();
})();
