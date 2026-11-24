// Прогон жизней для калибровки смертности: снимает здоровье по годам.
// Игра раздаётся с диска через перехват запросов, сервер не нужен.
//
//   node tools/calibrate_death.js OUT.jsonl N MAX_AGE POLICY SEED [DEATH]
//
// POLICY: random — случайные действия harness.js;
//         care   — то же плюс «Восстановить силы» всегда в расписании и врач при болезни.
// DEATH:  off — смерть только в 100 (снять траекторию здоровья);
//         old — как в игре сейчас; new — подключённая deathChance257.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const [OUT = 'trajectories.jsonl', N = '4', MAX_AGE = '100', POLICY = 'random', SEED = '1', DEATH = 'off'] = process.argv.slice(2);
const HARNESS = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8').replace(/console\.log\(/g, '(()=>{})(');
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
    if (rel === 'game.js' && DEATH !== 'old') {
      const src = body.toString('utf8');
      if (!src.includes(OLD_DEATH)) throw new Error('death line in game.js changed');
      const repl = DEATH === 'new' ? 'chance(deathChance257(s.age,s.health))||s.age>=100' : 's.age>=100';
      body = Buffer.from(src.replace(OLD_DEATH, repl));
    }
    route.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' } });
  });
}

// Каждое изменение s.health записывается с источником «файл:функция»; в снимке года — суммы за год.
const TRACE = `(()=>{let h=s.health;window.__HA={};Object.defineProperty(s,'health',{configurable:true,enumerable:true,get(){return h},set(v){
  const d=v-h;if(d){let src='?';for(const line of (new Error().stack||'').split('\\n').slice(2)){const m=line.match(/at (?:([\\w$.<>]+) )?\\(?[^()]*\\/([\\w-]+\\.js)/);
  if(m&&m[2]!=='harness.js'){src=m[2]+':'+(m[1]||'?').replace(/^Object\\./,'');break}}src+=d<0?' -':' +';__HA[src]=(__HA[src]||0)+d}h=v}})})()`;

const SNAP = `(()=>{const h=habits78();const z=s.health25;const src=window.__HA||{};window.__HA={};return {age:s.age,health:+s.health.toFixed(2),fatigue:Math.round(s.clock.fatigue),mood:Math.round(s.mood),
  ill:!!s.illness,chronic:(z&&z.conditions||[]).length,smoke:h.smoke.strength||0,drink:h.drink.strength||0,cash:Math.round(s.cash),dead:!!s.dead,
  src:Object.fromEntries(Object.entries(src).map(([k,v])=>[k,+v.toFixed(2)]))}})()`;

// Случайные клики harness.js иногда ставят отдых на паузу: заботливый игрок его возобновляет.
const CARE = `(()=>{if(s.dead||s.age<16)return;const r=s.clock.tasks.find(t=>t.kind==='rest');if(!r)assign('rest');else if(r.state==='paused')pauseTask05(r.id);
  const a=s.illness;if(a&&!a.treated){a.treated=true;a.left=Math.min(a.left||2,2);}})()`;

async function life(browser, idx, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await serve(ctx);
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message || e).slice(0, 300)));
  const t0 = Date.now();
  const res = { idx, cfg, policy: POLICY, death: DEATH, years: [] };
  try {
    await pg.goto('http://game.local/index.html', { waitUntil: 'load' });
    await pg.waitForFunction("typeof start==='function' && document.querySelector('#country')");
    for (const [k, v] of Object.entries(cfg))
      await pg.evaluate(([k, v]) => { const e = document.getElementById(k); if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [k, v]);
    await pg.click('text=Родиться');
    await pg.waitForFunction("typeof s!=='undefined' && s && s.clock", null, { timeout: 15000 });
    await pg.evaluate("()=>{try{if(typeof startupNotice180==='function'&&startupNotice180())finishStartup180(false);if(typeof tutorialActive180==='function'&&tutorialActive180())endTutorial180('skipped');}catch(e){}}");
    await pg.evaluate(HARNESS);
    // Сохранения в localStorage не нужны прогону и тормозят его к старости.
    await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}");
    await pg.evaluate(TRACE);
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
      }, [POLICY === 'care' ? CARE : '', 0.25]);
      if (st.age !== age || st.dead) { res.years.push(await pg.evaluate(SNAP)); age = st.age; }
      if (st.dead || st.age >= +MAX_AGE) break;
      if (Date.now() - t0 > 40 * 60e3) { res.timeout = true; break; }
    }
    res.issues = await pg.evaluate('__H.issues.length');
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
