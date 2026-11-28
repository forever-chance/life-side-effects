// Стенд своего дела: открывает дела и прокручивает только их месячный расчёт на 5 лет.
// Без сервера:  node tools/business_bench.js [дел на сценарий и страну, по умолчанию 40]
// Если business263.js ещё не подключён в index.html, стенд подгружает его сам; BASE=1 — считать старую модель.
// 272: business272-data.js и business272.js стенд тоже подгружает сам (BASE=1 — без них, модель 263–266). Сценарии branch
// (владелец сам и два сотрудника, через год — вторая точка или её замена по виду: серия, команда, маршрут, линия) и two
// (два дела одного вида, в каждом владелец сам и сотрудник) показывают, как делятся люди; SCENARIOS=… — выбрать.
// Окна 272 в очереди стенд убирает после открытия и каждого месяца (иначе они глушат события 266 этого дела).
// 276: OVER=0.5 — владельцу каждый месяц не хватает этой доли часов дела (как при перегрузке недели, time276.js): смены
// владельца падают, но не ниже нижней границы bizFloor276; FLOOR=0 — без границы (как до решения владелицы).
// Сценарий manager перегрузка не трогает: в игре дело с управляющим часов владельца не берёт (bizFloor276 = 1), а первый
// год «сам + сотрудник» здесь — только проверка, по карману ли управляющий. С перегрузкой в этот год почти все дела
// отсеивались бы, и в строке остались бы одни закрытые в первый год (маржа без продаж). Пропущенные дела — по сценариям.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const N = +(process.argv[2] || 40);
const COUNTRIES = (process.env.COUNTRIES || 'nl,no,rs,br,in').split(',');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };

async function bench(browser, country) {
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
  await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  if (!process.env.BASE && !(await pg.evaluate(() => typeof business263 !== 'undefined'))) await pg.addScriptTag({ path: path.join(ROOT, 'business263.js') });
  if (!process.env.BASE && !(await pg.evaluate(() => typeof businessSeason265 !== 'undefined'))) await pg.addScriptTag({ path: path.join(ROOT, 'business265.js') });
  if (!process.env.BASE && !(await pg.evaluate(() => typeof bzKind272 !== 'undefined')) && fs.existsSync(path.join(ROOT, 'business272.js')))
    for (const f of ['business272-data.js', 'business272.js']) await pg.addScriptTag({ path: path.join(ROOT, f) });
  if (process.env.SCENARIOS) await pg.evaluate(v => { window.BENCH_SCENARIOS = v.split(','); }, process.env.SCENARIOS);
  if (process.env.OVER) await pg.evaluate(([v, f]) => { window.BENCH_OVER = +v; window.BENCH_FLOOR = f !== '0'; }, [process.env.OVER, process.env.FLOOR || '1']);
  const res = await pg.evaluate(N => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    s.age = 30; s.skill = 50; s.illness = null; s.pending = [];
    const W = c().wage / 12, out = [];
    // Управляющего зовут в устоявшееся дело: первый год владелец сам с сотрудником; если год принёс больше
    // годового оклада управляющего (1.3 средней в месяц), дальше — управляющий, иначе дело в этой строке не считается.
    const scenarios = { self: ['self', 0], selfStaff: ['self', 1], partial: ['partial', 1], manager: ['manager', 1], branch: ['self', 2, 'branch'], two: ['self', 1, 'two'] };
    // Сохранение и перерисовка на расчёт не влияют, а на каждом шаге съедают память страницы.
    const quiet = log, sv = save, rd = render; log = () => {}; save = () => {}; render = () => {};
    try {
      const types = (window.BENCH_TYPES || Object.keys(enterpriseTypes152));
      const specsOf = type => type.endsWith('253') ? businessCatalog253.filter(b => b.type === type && enterpriseAvailable253(b.id)).map(b => b.id) : Object.keys(enterpriseSpecialties153[type]).filter(k => k !== 'school196');
      const addStaff = (b, n, i) => { for (let k = 0; k < n; k++) {
          const p = { id: 'bench-' + i + '-' + k + '-' + Math.random(), name: 'Сотрудник', role: 'Знакомый', alive: true, age: 30, gender: 'f', country: b.country, city18: b.city, privateCash: 0, bond: 40, memories: [], trait: ['', ''], inner: { trust: 50, affection: 50, strain: 0, desire: 0 } };
          s.people.push(p); b.staff155.push(p.id);
        } };
      // 272.1: окна 272 в очереди (кто будет работать, дело может закрыться, кто где работает) стенд не открывает —
      // а пока у дела есть окно в очереди, 266 не присылает своих событий. Убирать их после открытия и каждого месяца.
      const drop272 = () => { s.pending = s.pending.filter(q => !['bzHire272', 'bzFinal272', 'bzModel272'].includes(q?.type)); };
      for (const [scName, [mode, staffN, extra]] of Object.entries(window.BENCH_SCENARIOS ? Object.fromEntries(Object.entries(scenarios).filter(([k]) => window.BENCH_SCENARIOS.includes(k))) : scenarios)) for (const type of types) for (let i = 0; i < N; i++) {
        const specs = specsOf(type);
        if (!specs.length) break;
        const spec = specs[i % specs.length];
        s.enterprise152 = null; s.otherEnterprises168 = []; s.cash = 1e9;
        if (!startEnterprise152(type, 'Стенд ' + i, spec)) { out.push({ scName, type, failed: true }); continue; }
        const b = s.enterprise152;
        let startCash = b.cash;
        if (typeof business263 !== 'undefined') b.mode263 = mode === 'manager' ? 'self' : mode;
        b.staff155 = [];
        addStaff(b, staffN, i);
        drop272();
        // two: второе дело того же вида рядом, тоже «сам» и с сотрудником; деньги владельца — по обоим.
        const all = [b];
        if (extra === 'two') {
          if (!startEnterprise152(type, 'Стенд ' + i + 'Б', spec, true)) { out.push({ scName, type, failed: true }); continue; }
          const b2 = s.enterprise152; b2.mode263 = mode; b2.staff155 = []; addStaff(b2, staffN, i + 'b'); startCash += b2.cash; all.push(b2);
          drop272();
        }
        let drawn = 0, months = 0, firstYear = 0, closedAt = null, sales = 0, profit = 0, skip = false;
        for (let m = 0; m < 60; m++) {
          s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12;
          if (m === 12 && mode === 'manager' && typeof business263 !== 'undefined') { if (firstYear >= W * 1.3 * 12) b.mode263 = 'manager'; else { skip = true; break; } }
          if (m === 12 && extra === 'branch' && b.status === 'active') {
            // Вторая точка (или замена по виду) — на деньги владельца, они вычитаются из его дохода.
            selectEnterprise168(b.id);
            const unit = typeof bzProfile272 === 'function' && bzProfile272(b).expand.mode === 'unit';
            const price = unit ? bzUnitQuote272(b) : branchQuote159(b, 'standard');
            b.cash += price; startCash += price;
            if (!(unit ? bzBuyUnit272(b.id) : buyBranch159(b.id, 'standard'))) { b.cash -= price; startCash -= price; }
          }
          let any = false;
          for (const x of all) {
            if (x.status !== 'active') continue;
            // 276: перегрузка недели — доля часов дела, которой владельцу не хватило (с границей или без неё).
            if (window.BENCH_OVER > 0 && scName !== 'manager' && typeof timeState276 === 'function') {
              const fl = window.BENCH_FLOOR ? bizFloor276(x) : 0;
              timeState276().month = { tick: s.clock.ticks, f: { business: window.BENCH_OVER }, fb: { [x.id]: Math.min(window.BENCH_OVER, 1 - fl) } };
            }
            enterpriseLocationMonth168(x);
            const h = x.history.at(-1);
            if (h && h.tick === s.clock.ticks) { any = true; const p = h.sales - h.costs; if (m < 12) firstYear += p; if (m >= 12) { sales += h.sales; profit += p; } }
          }
          drop272();
          if (any) months++;
          if (all.some(x => x.status !== 'active')) { closedAt = m; if (all.every(x => x.status !== 'active')) break; }
          if (m % 3 === 2) for (const x of all) if (x.status === 'active') { selectEnterprise168(x.id); const before = s.cash; drawEnterprise152(x.id); drawn += s.cash - before; }
        }
        const owner = (drawn + all.reduce((n, x) => n + (x.status === 'active' ? x.cash : 0), 0) - startCash) / Math.max(1, months / 12) / (W * 12);
        if (skip) { s.people = s.people.filter(p => !String(p.id).startsWith('bench-')); out.push({ scName, type, failed: true, skipped: true }); continue; }
        out.push({ scName, type, firstYearLoss: firstYear < 0, closedAt, margin: sales ? profit / sales : null, owner, fit: b.fit263 ?? null });
        s.people = s.people.filter(p => !String(p.id).startsWith('bench-'));
      }
    } finally { log = quiet; save = sv; render = rd; }
    return out;
  }, N);
  await ctx.close();
  return { country, res, errors };
}

const q = (a, p) => { const x = a.filter(v => v != null).sort((m, n) => m - n); return x.length ? x[Math.floor((x.length - 1) * p)] : NaN; };
// 276: маржа — только по делам, у которых были продажи после первого года; нет таких — «—», а не NaN.
const pctQ = m => Number.isFinite(q(m, .5)) ? `${(100 * q(m, .5)).toFixed(0).padStart(4)}% (${(100 * q(m, .25)).toFixed(0)}…${(100 * q(m, .75)).toFixed(0)}%)` : '   — (нет продаж после 1-го года)';
(async () => {
  const browser = await chromium.launch();
  const all = [];
  for (const c of COUNTRIES) { const r = await bench(browser, c); if (r.errors.length) console.log(c, 'ошибки страницы:', r.errors.slice(0, 3)); all.push(...r.res.map(x => ({ ...x, country: c }))); }
  await browser.close();
  console.log(process.env.BASE ? 'Модель 263–266 (без 272)' : 'Модель 272', '·', COUNTRIES.join(' '), '·', N, 'дел на сценарий, тип и страну' + (process.env.OVER ? ' · перегрузка: владельцу не хватает ' + Math.round(100 * process.env.OVER) + '% часов дела' + (process.env.FLOOR === '0' ? ', без нижней границы' : ', с нижней границей') : ''));
  console.log('сценарий   тип       убыток 1-й год  закрыто за 5 лет  маржа медиана (25–75%)   владелец, средних зарплат в год: медиана (25–75%)');
  for (const sc of ['self', 'selfStaff', 'partial', 'manager', 'branch', 'two']) for (const type of [...new Set(all.map(x => x.type))].concat('all')) {
    const g = all.filter(x => x.scName === sc && (type === 'all' || x.type === type) && !x.failed);
    if (!g.length) continue;
    const pct = f => (100 * g.filter(f).length / g.length).toFixed(0).padStart(3) + '%';
    const m = g.map(x => x.margin), o = g.map(x => x.owner);
    console.log(`${sc.padEnd(10)} ${type.padEnd(9)} ${pct(x => x.firstYearLoss).padStart(14)} ${pct(x => x.closedAt != null).padStart(17)}   ${pctQ(m)}`.padEnd(70) + `${q(o, .5).toFixed(2)} (${q(o, .25).toFixed(2)}…${q(o, .75).toFixed(2)})`);
  }
  const failed = all.filter(x => x.failed && !x.skipped).length;
  // 276: пропущенные — по каждому сценарию (сейчас пропускает только manager: управляющий не по карману после первого года).
  for (const sc of [...new Set(all.filter(x => x.skipped).map(x => x.scName))]) console.log(sc === 'manager' ? 'управляющий не по карману после первого года (не считаются):' : sc + ': пропущено (не считаются):', all.filter(x => x.scName === sc && x.skipped).length, 'из', all.filter(x => x.scName === sc).length);
  if (process.env.OVER) console.log('перегрузка: в сценарии manager не применяется (в игре дело с управляющим часов владельца не берёт)');
  if (failed) console.log('не открылись:', failed);
  if (process.env.DEBUG) for (const x of all.filter(x => x.closedAt != null)) console.log('закрылось:', x.country, x.scName, x.type, 'месяц', x.closedAt, x.firstYearLoss ? '(убыток в 1-й год)' : '');
})();
