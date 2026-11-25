// Проверки 272.2, переезд партнёра (partnermove2722.js): в заголовке решения назван город, и это тот город,
// куда партнёр в итоге переезжает.  node tools/verify2722_move.js   (BASE=1 — без файла)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext();
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); if (u.hostname !== 'game.local') return r.abort(); const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html'; const f = path.join(ROOT, rel); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://game.local/index.html'); await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(() => { for (const [k, v] of [['startAge', '18'], ['country', 'id']]) { const e = document.getElementById(k); if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } } });
  await pg.click('text=Родиться'); await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} if ($('#modal').open) closeModal(); s.pending = []; });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!BASE && !html.includes('partnermove2722.js')) await pg.addScriptTag({ path: path.join(ROOT, 'partnermove2722.js') });
  const r = await pg.evaluate(() => {
    s.age = 30; const p = person('Партнер', 31, s.gender === 'm' ? 'f' : 'm', s.country); p.role = 'Партнер'; p.privateCash = 1e7; s.people.push(p);
    if (typeof currentPartner === 'function' && currentPartner()?.id !== p.id) { s.partnerId = p.id; }
    const cur = currentPartner(); if (!cur || cur.id !== p.id) return { skip: 'no partner hook', cur: cur?.id };
    const st = adultState55(p); st.nextReview = -1; st.plan = null; const ok = startAdultPlan55(p, 'home'); const elig = typeof adultEligible55 === 'function' ? adultEligible55(p) : null;
    const a = adultState55(p), plan = a.plan; if (!plan || plan.kind !== 'home') return { skip: 'plan ' + (plan && plan.kind), ok, elig };
    render();
    const q = autonomy55().decisions.find(x => x.plan === plan.id); const title = q?.title, cityShown = q?.city2722; const logTitle = (s.log.find(e => e?.decision24?.id === q?.id) || s.log.find(e => / хочет /.test(e.title)))?.title || '';
    const from = p.city18; plan.due = s.clock.ticks; plan.roll = 0;
    for (let i = 0; i < 4 && p.city18 === from; i++) { try { advanceMonth(); } catch (e) {} s.pending = []; if ($('#modal').open) closeModal(); }
    return { title, cityShown, logTitle, from, to: p.city18 };
  });
  if (r.skip) { console.log('skip:', JSON.stringify(r)); }
  check(!r.skip && / хочет переехать: /.test(r.title || '') && r.title.endsWith(r.cityShown), 'заголовок решения называет город', JSON.stringify(r));
  check(!r.skip && r.logTitle === r.title, 'запись в «Истории» — с тем же городом, что и решение', JSON.stringify({ logTitle: r.logTitle, title: r.title }));
  check(!r.skip && r.to === r.cityShown && r.to !== r.from, 'партнёр переезжает ровно туда', JSON.stringify(r));
  check(errors.length === 0, 'без ошибок страницы', errors.slice(0, 2).join(' | '));
  await browser.close(); console.log(`\n${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
})();
