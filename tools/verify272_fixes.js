// Проверки сборки 272, мелкие правки (fixes272.js): окно болезни ребёнка — только «Понятно»;
// отсрочка долга без графика (бытовые счета) — без NaN.  node tools/verify272_fixes.js   (BASE=1 — без файла)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && BASE) body = Buffer.from(body.toString('utf8').replace(/<script src="fixes272\.js[^"]*"><\/script>/, ''));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(() => { const e = document.getElementById('startAge'); if (e) { e.value = '0'; e.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.click('text=Родиться'); await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} if ($('#modal').open) closeModal(); s.pending = []; });
  const child = await pg.evaluate(() => { s.age = 5; s.illness = { name: 'Ветряная оспа', left: 1, severity: 'средняя', parents270: 'doctor', treated: true }; healthMenu(); const m = $('#modal');
    return { buttons: [...m.querySelectorAll('button')].filter(b => !b.hidden && !b.classList.contains('close')).map(b => b.textContent.trim()), text: m.querySelector('.dialog-copy20')?.innerText || '', tail: [...m.children].filter(x => x.tagName === 'P').map(p => p.textContent) }; });
  check(child.buttons.length === 1 && child.buttons[0] === 'Понятно', 'болезнь ребёнка: одна кнопка «Понятно»', JSON.stringify(child.buttons));
  check(/Восстановление: ещё 1 мес\./.test(child.text) && !child.tail.length, 'болезнь ребёнка: восстановление в тексте над кнопкой', child.text.replace(/\n/g, ' | '));
  const adult = await pg.evaluate(() => { closeModal(); s.age = 30; s.illness = { name: 'Грипп', left: 1, severity: 'средняя' }; healthMenu(); const m = $('#modal'); return [...m.querySelectorAll('button')].filter(b => !b.hidden && !b.classList.contains('close')).map(b => b.textContent.trim()); });
  check(adult.length > 1, 'болезнь взрослого: окно как раньше', JSON.stringify(adult));
  const debt = await pg.evaluate(() => { closeModal(); s.illness = null; s.age = 30; const d = { id: 'bill32-t', type: 'bill32', billKind32: 'basics', creditor32: 'Бытовые счета · ' + s.country, country: s.country, balance: 500, principal: 0, rate: 0, payment: 0, paid: 0, missed: 0, started: s.clock.ticks, due: s.clock.ticks, history32: [] }; s.debts.push(d); const before = s.log.length; extendDebt(d.id);
    const title = $('#modal').open ? document.querySelector('#modal h2')?.textContent : ''; const text = $('#modal').open ? $('#modal').innerText : ''; if ($('#modal').open) { const b = [...document.querySelectorAll('#modal .options button')].find(x => /Принять/.test(x.textContent)); if (b) b.click(); }
    return { due: d.due, ticks: s.clock.ticks, extended: d.extended, nan: /NaN|не число/.test(text + ' ' + s.log.slice(0, 3).map(e => e.title + ' ' + e.text).join(' ')), title, entry: s.log[0]?.title }; });
  check(!debt.nan && debt.due === debt.ticks + 3 && debt.extended, 'долг по счетам: отсрочка на три месяца без NaN', JSON.stringify(debt));
  check(errors.length === 0, 'без ошибок страницы', errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(`\n${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
})();
