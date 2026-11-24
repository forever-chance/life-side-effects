// Замер сохранения: проживает жизнь до AGE лет, затем меряет save() и считает вызовы за игровой год.
// Без сервера:  node tools/save_bench.js [возраст, по умолчанию 40] [сид]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const AGE = +(process.argv[2] || 40), SEED = +(process.argv[3] || 1);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const countries = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx', 'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
  await pg.evaluate(c => { const e = document.getElementById('country'); e.value = c; e.dispatchEvent(new Event('change', { bubbles: true })); }, countries[SEED % countries.length]);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} });
  await pg.evaluate(fs.readFileSync(path.join(ROOT, 'tools/harness.js'), 'utf8').replace(/console\.log\(/g, '(()=>{})('));
  while ((await pg.evaluate(() => s.age)) < AGE && !(await pg.evaluate(() => s.dead)))
    await pg.evaluate(() => { for (let i = 0; i < 40; i++) __H.run(1, .25); __H.texts = []; __H.actions = []; });
  const r = await pg.evaluate(() => {
    const t = f => { const a = performance.now(); f(); return performance.now() - a; };
    const med = a => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const json = JSON.stringify(s);
    const out = { age: s.age, bytes: json.length, logLen: s.log.length, people: s.people.length,
      save: med([...Array(15)].map(() => t(() => save()))),
      stringify: med([...Array(15)].map(() => t(() => JSON.stringify(s)))),
      setItem: med([...Array(15)].map(() => t(() => localStorage.setItem('bench-save', json)))),
      render: med([...Array(5)].map(() => t(() => render()))) };
    localStorage.removeItem('bench-save');
    // Самые тяжёлые ветки состояния.
    out.heavy = Object.entries(s).map(([k, v]) => [k, JSON.stringify(v ?? null).length]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    // Клик по варианту окна и игровой месяц — как их чувствует игрок; и то же с отключённым сохранением.
    const click = () => { show('Замер', 'Окно для замера.', [{ label: 'Вариант', fn: () => {} }]); choose(0); };
    const month = () => { if ($('#modal').open) closeModal(); s.pending = []; advanceMonth(); };
    out.click = med([...Array(9)].map(() => t(click)));
    out.month = med([...Array(9)].map(() => t(month)));
    { const sv = save; save = () => {}; out.clickNoSave = med([...Array(9)].map(() => t(click))); out.monthNoSave = med([...Array(9)].map(() => t(month))); save = sv; }
    { let calls = 0; const sv = save; save = function (...a) { calls++; return sv.apply(this, a); }; click(); out.savesPerClick = calls; calls = 0; month(); out.savesPerMonth = calls; save = sv; }
    // Из чего состоит клик без сохранения.
    { const sv = save; save = () => {};
      show('Замер', 'Окно.', [{ label: 'Вариант', fn: () => {} }]);
      out.parts = { closeModal: med([...Array(9)].map(() => { show('Замер', 'Окно.', [{ label: 'В', fn: () => {} }]); return t(() => closeModal()); })),
        render: med([...Array(9)].map(() => t(() => render()))),
        show: med([...Array(9)].map(() => { const x = t(() => show('Замер', 'Окно.', [{ label: 'В', fn: () => {} }])); closeModal(); return x; })),
        receipt: typeof stateReceipt === 'function' ? med([...Array(9)].map(() => t(() => stateReceipt()))) : null };
      if ($('#modal').open) closeModal(); save = sv; }
    // Вызовы save() за игровой год.
    let calls = 0; const base = save; save = function (...a) { calls++; return base.apply(this, a); };
    const a0 = s.age, t0 = performance.now();
    let n = 0; while (s.age === a0 && !s.dead && n++ < 2000) __H.run(1, .25);
    out.yearMs = Math.round(performance.now() - t0); out.callsPerYear = calls;
    save = base;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  if (errors.length) console.log('ошибки страницы:', errors.slice(0, 5));
  await browser.close();
})();
