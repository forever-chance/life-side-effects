// Стенд своего дела: открывает дела и прокручивает только их месячный расчёт на 5 лет.
// Без сервера:  node tools/business_bench.js [дел на сценарий и страну, по умолчанию 40]
// Если business263.js ещё не подключён в index.html, стенд подгружает его сам; BASE=1 — считать старую модель.
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
  const res = await pg.evaluate(N => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    s.age = 30; s.skill = 50; s.illness = null; s.pending = [];
    const W = c().wage / 12, out = [];
    // Управляющего зовут в устоявшееся дело: первый год владелец сам с сотрудником; если год принёс больше
    // годового оклада управляющего (1.3 средней в месяц), дальше — управляющий, иначе дело в этой строке не считается.
    const scenarios = { self: ['self', 0], selfStaff: ['self', 1], partial: ['partial', 1], manager: ['manager', 1] };
    // Сохранение и перерисовка на расчёт не влияют, а на каждом шаге съедают память страницы.
    const quiet = log, sv = save, rd = render; log = () => {}; save = () => {}; render = () => {};
    try {
      for (const [scName, [mode, staffN]] of Object.entries(scenarios)) for (const type of ['studio', 'services', 'shop']) for (let i = 0; i < N; i++) {
        const specs = Object.keys(enterpriseSpecialties153[type]).filter(k => k !== 'school196');
        const spec = specs[i % specs.length];
        s.enterprise152 = null; s.otherEnterprises168 = []; s.cash = 1e9;
        if (!startEnterprise152(type, 'Стенд ' + i, spec)) { out.push({ scName, type, failed: true }); continue; }
        const b = s.enterprise152;
        const startCash = b.cash;
        if (typeof business263 !== 'undefined') b.mode263 = mode === 'manager' ? 'self' : mode;
        b.staff155 = [];
        for (let k = 0; k < staffN; k++) {
          const p = { id: 'bench-' + i + '-' + k + '-' + Math.random(), name: 'Сотрудник', role: 'Знакомый', alive: true, age: 30, gender: 'f', country: b.country, city18: b.city, privateCash: 0, bond: 40, memories: [], trait: ['', ''], inner: { trust: 50, affection: 50, strain: 0, desire: 0 } };
          s.people.push(p); b.staff155.push(p.id);
        }
        let drawn = 0, months = 0, firstYear = 0, closedAt = null, sales = 0, profit = 0, skip = false;
        for (let m = 0; m < 60; m++) {
          s.clock.ticks++; s.clock.month = (s.clock.month + 1) % 12;
          if (m === 12 && mode === 'manager' && typeof business263 !== 'undefined') { if (firstYear >= W * 1.3 * 12) b.mode263 = 'manager'; else { skip = true; break; } }
          enterpriseLocationMonth168(b);
          const h = b.history.at(-1);
          if (h && h.tick === s.clock.ticks) { months++; const p = h.sales - h.costs; if (m < 12) firstYear += p; if (m >= 12) { sales += h.sales; profit += p; } }
          if (b.status !== 'active') { closedAt = m; break; }
          if (m % 3 === 2) { const before = s.cash; drawEnterprise152(b.id); drawn += s.cash - before; }
        }
        const owner = (drawn + (b.status === 'active' ? b.cash : 0) - startCash) / Math.max(1, months / 12) / (W * 12);
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
(async () => {
  const browser = await chromium.launch();
  const all = [];
  for (const c of COUNTRIES) { const r = await bench(browser, c); if (r.errors.length) console.log(c, 'ошибки страницы:', r.errors.slice(0, 3)); all.push(...r.res.map(x => ({ ...x, country: c }))); }
  await browser.close();
  console.log(process.env.BASE ? 'Старая модель' : 'Модель 263', '·', COUNTRIES.join(' '), '·', N, 'дел на сценарий, тип и страну');
  console.log('сценарий   тип       убыток 1-й год  закрыто за 5 лет  маржа медиана (25–75%)   владелец, средних зарплат в год: медиана (25–75%)');
  for (const sc of ['self', 'selfStaff', 'partial', 'manager']) for (const type of ['studio', 'services', 'shop', 'all']) {
    const g = all.filter(x => x.scName === sc && (type === 'all' || x.type === type) && !x.failed);
    if (!g.length) continue;
    const pct = f => (100 * g.filter(f).length / g.length).toFixed(0).padStart(3) + '%';
    const m = g.map(x => x.margin), o = g.map(x => x.owner);
    console.log(`${sc.padEnd(10)} ${type.padEnd(9)} ${pct(x => x.firstYearLoss).padStart(14)} ${pct(x => x.closedAt != null).padStart(17)}   ${(100 * q(m, .5)).toFixed(0).padStart(4)}% (${(100 * q(m, .25)).toFixed(0)}…${(100 * q(m, .75)).toFixed(0)}%)`.padEnd(70) + `${q(o, .5).toFixed(2)} (${q(o, .25).toFixed(2)}…${q(o, .75).toFixed(2)})`);
  }
  const skipped = all.filter(x => x.skipped).length, failed = all.filter(x => x.failed && !x.skipped).length;
  if (skipped) console.log('управляющий не по карману после первого года (не считаются):', skipped, 'из', all.filter(x => x.scName === 'manager').length);
  if (failed) console.log('не открылись:', failed);
})();
