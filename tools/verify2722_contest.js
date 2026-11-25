// Проверки 272.2, итоги детского конкурса (contest2722.js): запись в истории без окна и паузы, название занятия,
// навык растёт ровно на столько, сколько написано (+2 за участие, +5 за победу). Путь — как в игре: приглашение →
// согласие → занятие → finishTask.  node tools/verify2722_contest.js  (BASE=1 — без файла)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext();
  await ctx.route('**/*', r => { const u = new URL(r.request().url()); if (u.hostname !== 'game.local') return r.abort(); const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html'; const f = path.join(ROOT, rel); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: BASE && rel === 'index.html' ? fs.readFileSync(f, 'utf8').replace(/<script src="contest2722\.js[^"]*"><\/script>/, '') : rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://game.local/index.html'); await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(() => { const e = document.getElementById('startAge'); if (e) { e.value = '0'; e.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.click('text=Родиться'); await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} if ($('#modal').open) closeModal(); s.pending = []; });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (!BASE && !html.includes('contest2722.js')) await pg.addScriptTag({ path: path.join(ROOT, 'contest2722.js') });
  const r = await pg.evaluate(() => {
    // Настоящий путь: приглашение → согласие → задача → finishTask (childhood67 даёт +2, social86 за приз ещё +3).
    Math.random = seeded269(11);
    s.age = 9; s.pending = [];
    const out = {};
    for (const force of ['participated', 'prize']) {
      const z = childhood67(); z.offers.forEach(q => { if (q.status === 'offered') q.status = 'expired'; q.created = -100; });
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'childEvent67');
      const q = offerChildEvent67('contest', 'player', 'music') || offerChildEvent67('contest', 'player');
      if (!q) { out[force] = { err: 'нет приглашения' }; continue; }
      q.roll = force === 'prize' ? 0 : 0.99;
      s.hobbies[q.hobby] ??= { interest: 50, sessions: 0 }; s.hobbies[q.hobby].skill = 10;
      respondChildEvent67(q.id, true); if ($('#modal').open) closeModal();
      const t = s.clock.tasks.find(t => t.kind === 'childEvent67' && t.event67 === q.id);
      if (!t) { out[force] = { err: 'нет задачи' }; continue; }
      t.progress = t.duration;
      const before = s.hobbies[q.hobby].skill, notes = (life61().notices || []).length, logN = s.log.length; s.clock.running = true;
      finishTask(t); finishTask(t);
      const name = hobbies[q.hobby]?.[0] || '';
      out[force] = { hobby: name, result: q.result, delta: s.hobbies[q.hobby].skill - before, notices: (life61().notices || []).length - notes, running: s.clock.running,
        entries: s.log.slice(0, s.log.length - logN).map(e => e.title + ' | ' + e.text) };
    }
    return out;
  });
  const P = r.participated || {}, W = r.prize || {}, esc = x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  check(P.result === 'participated' && P.notices === 0 && P.running, 'участие: без окна и паузы', JSON.stringify(P));
  check(P.entries?.length === 1 && new RegExp(esc(P.hobby) + ': навык \\+2\\.').test(P.entries[0]) && /Сертификат участника/.test(P.entries[0]) && /Выступление состоялось|опыт/.test(P.entries[0]),
    'участие: одна запись — выступление и «' + P.hobby + ': навык +2»', JSON.stringify(P.entries));
  check(P.delta === 2, 'участие: навык вырос на 2, как написано', 'вырос на ' + P.delta);
  check(W.result === 'prize' && W.notices === 0 && W.entries?.length === 1 && new RegExp(esc(W.hobby) + ': навык \\+5\\.').test(W.entries[0]) && /диплом/.test(W.entries[0]),
    'победа: одна запись — «' + W.hobby + ': навык +5», без окна', JSON.stringify(W.entries));
  check(W.delta === 5, 'победа: навык вырос на 5, как написано', 'вырос на ' + W.delta);
  check(errors.length === 0, 'без ошибок страницы', errors.slice(0, 2).join(' | '));
  await browser.close(); console.log(`\n${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
})();
