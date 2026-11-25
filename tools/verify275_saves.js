// Проверки сборки 275 (save275.js): сжатые сохранения, статус, нехватка места, предыдущая версия, перенос.
//   node tools/verify275_saves.js [файл копии]     BASE=1 — без save275.js (видно, что ловят проверки)
//   PLACE=early (по умолчанию) — save275.js сразу после saves.js, где ему место в index.html; PLACE=late — перед bootstrap61.js;
//   PLACE=tag — addScriptTag после загрузки страницы (и после каждой перезагрузки). При late и tag четыре проверки не
//   проходят и должны не проходить: сообщение о резервной копии при запуске и несжатая копия при переходе требуют места
//   сразу после saves.js (до стартовых записей), а загрузка с длинной жизнью там 17–19 с вместо 4. Файл тогда сам
//   предупреждает в консоли (проверка 9).
// Файл копии по умолчанию — SAVE=путь, OWNER_SAVE=путь или первый аргумент; без него — жизнь, прожитая здесь же до 30 лет.
// Игра раздаётся с диска, сервер не нужен. Сохранение владелицы в репозиторий не кладётся.
//  1. Импорт файла копии через «Восстановить из файла» → жизнь записана сжатой, обе копии распаковываются в ту же жизнь;
//     через «Персонажи» → перезагрузка → s совпадает с сохранённым до перезагрузки (глубокое сравнение); месяцы идут.
//  2. Статус под «Сохранить»: «Сохранено · ЧЧ:ММ»; отложенная запись его не меняет (не мигает «Сохраняется…»), смена
//     текста не двигает «Персонажи» и «Сохранить»; на телефоне не вылезает.
//  3. Старая несжатая жизнь (страница без save275.js) → страница с ним: после первой записи сжата, прежняя несжатая
//     версия лежит отдельным ключом; после следующей записи ключ удалён; состояние то же.
//  4. Основная запись повреждена (сжатая и несжатая) → при запуске открыта резервная копия и сказано об этом;
//     то же при открытии из «Персонажей» (копия та же, что последняя запись, — сказано, что ничего не потерялось; копия
//     за прошлый месяц — что сыгранное после неё не сохранилось); «Восстановить предыдущую версию» в «Персонажах». Без повреждений окна о копии
//     нет и тогда, когда отпечатки последней записи не записались, когда при запуске открылась не активная жизнь и когда
//     основная отличается от резервной только флагами часов, а отпечатки отстали (вкладку закрыли между записями или
//     их переписала вкладка, открытая раньше). Восстановление: версии подписаны месяцем, порядок записей (оборванное
//     после первой записи не теряет последнее сохранение), «итог действия» в восстановленную жизнь не пишется.
//  5. Нет места: setItem бросает QuotaExceededError → прежнее сохранение не тронуто, статус, окно со «Скачать копию
//     всех жизней», скачанная копия — текущая жизнь; место появилось → снова «Сохранено». То же с настоящей квотой.
//     После неудачной записи readLife и «Персонажи» читают последнее удачное сохранение, а не резервную копию; эта же
//     жизнь из «Персонажей» заново не открывается, пока места нет (несохранённое не выбрасывается); другая жизнь,
//     «Новая жизнь», «Другая жизнь →», «Родиться» и «Восстановить предыдущую версию» — только после вопроса
//     «Сыгранное не сохранено».
//  6. Сверка: первая сжатая запись жизни во вкладке распаковывается и сверяется, следующие — без распаковки.
//     Сжатие не прошло сверку → жизнь записана как раньше, без сжатия, игроку сказано.
//  7. Экспорт — обычный JSON; импорт больше 5 МБ, gzip, «deflate-v1:», жизни строками; тексты (одна жизнь — «она»,
//     повреждённый файл — по-русски); удаление чистит свои ключи.
//  8. Время: запись и загрузка страницы на этой жизни (для сравнения — BASE=1).
//  9. Место в index.html: подключённый ниже save264.js файл предупреждает в консоли.
// 10. Завершённая жизнь (сборка 274): в резервной копии — версия до смерти; в подтверждении восстановления сказано,
//     что жизнь завершена, а в предыдущей версии человек жив. Жизнь продолжили за близкого →
//     резервная копия — та же версия со ссылкой на продолжение; основная повреждена → и из «Персонажей», и при запуске
//     открывается завершённая жизнь со ссылкой («Открыть продолжение →», а не снова «Продолжить за близкого →»), окно
//     говорит, что ничего не потерялось; «Восстановить предыдущую версию» у неё нет, а вызванное в обход — отказ.
//     Ссылку сняли (продолжение удалено) → копия — та же версия без ссылки. С continue274.js в index.html — настоящее
//     продолжение (continueAs274, openContinued274), без него — ссылка continued274, как её пишет 274.
// SAVE275=путь — раздать вместо save275.js другой файл (например, версию до исправлений: видно, что ловят проверки).
const fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1', PLACE = process.env.PLACE || 'early';
const SAVE = process.env.SAVE || process.env.OWNER_SAVE || process.argv[2] || '';
const SAVE275 = process.env.SAVE275 ? path.resolve(process.env.SAVE275) : path.join(ROOT, 'save275.js');
const LATE_WARNING = /275: save275\.js подключён ниже save264\.js/;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'verify275-'));
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
// Копии жизни (в том числе чужого сохранения) не оставлять во временной папке — только снимки шапки.
function cleanup() { for (const f of fs.readdirSync(TMP)) if (!f.endsWith('.png')) fs.rmSync(path.join(TMP, f), { force: true }); }
async function section(name, fn) { try { await fn(); } catch (e) { check(false, name + ' — раздел прерван', String(e && e.message || e).split('\n')[0].slice(0, 220)); } }
const KNOWN_ERRORS = /clubsCatalog19|reading 'name'/; // clubs19.js при загрузке длинной жизни — было до 275, см. отчёт

async function context(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, acceptDownloads: true });
  ctx.withSave = !BASE;
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? Buffer.from('') : rel === 'save275.js' ? fs.readFileSync(SAVE275) : fs.readFileSync(f);
    if (rel === 'index.html') {
      let t = body.toString('utf8').replace(/<script src="save275\.js[^"]*"><\/script>/, '');
      if (ctx.withSave && (opts.place || PLACE) === 'early') t = t.replace(/(<script src="saves\.js[^"]*"><\/script>)/, '$1<script src="save275.js"></script>');
      if (ctx.withSave && (opts.place || PLACE) === 'late') t = t.replace('<script src="bootstrap61.js', '<script src="save275.js"></script><script src="bootstrap61.js');
      body = Buffer.from(t);
    }
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  return ctx;
}
async function ready(pg, ctx) {
  await pg.waitForFunction("typeof start==='function'&&document.readyState==='complete'");
  if (ctx.withSave && PLACE === 'tag' && !(await pg.evaluate(() => typeof pack275 === 'function'))) await pg.addScriptTag({ path: SAVE275 });
  await pg.evaluate(helpers);
}
async function openPage(ctx, init) {
  const pg = await ctx.newPage(), errors = [], warnings = [];
  if (init) await pg.addInitScript(init.fn, init.arg);
  pg.on('pageerror', e => errors.push(String(e.message)));
  pg.on('console', msg => { if (msg.type() === 'warning') warnings.push(msg.text()); });
  await pg.goto('http://game.local/index.html');
  await ready(pg, ctx);
  return { pg, errors, warnings, ctx };
}
async function reload(P) { await P.pg.reload(); await ready(P.pg, P.ctx); }
// Помощники в странице: декодер старым способом (как saves.js с 225), ответы на окна, месяц.
function helpers() {
  window.__dec = raw => {
    if (raw == null) return null;
    if (raw.startsWith('deflate-v1:')) { const b = atob(raw.slice(11)), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return JSON.parse(pako.inflate(u, { to: 'string' })); }
    return JSON.parse(raw);
  };
  window.__key = id => 'life-character-' + (id || s.saveId);
  window.__store = id => { const m = localStorage.getItem(__key(id)), b = localStorage.getItem(__key(id) + '-backup'); return { main: m, back: b, mainPacked: !!m && m.startsWith('deflate-v1:'), backPacked: !!b && b.startsWith('deflate-v1:'), mainLen: m?.length, backLen: b?.length }; };
  window.__quiet = () => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} };
  window.__answer = () => { let g = 0; while ($('#modal').open && g++ < 12) { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].filter(b => !/Пропускать в будущем|ереех|ереезд|ересел|Уехать|эмигр|Сменить город|в другой город|Удалить|Новая жизнь|Начать/i.test(b.textContent)); if (!b.length) { closeModal(); break; } b[0].click(); } if ($('#modal').open) closeModal(); };
  window.__month = () => { let g = 0; while (g++ < 30) { if ($('#modal').open) { __answer(); continue; } if (s.pending.length) { resolvePending(); __answer(); continue; } if (s.clock.yearDue) { transact('year', rollYear); __answer(); continue; } break; } advanceMonth(); __answer(); };
  window.__flush = () => { save(); if (typeof flushSave264 === 'function') flushSave264(); };
  window.__status = () => [...document.querySelectorAll('.save-status275')].map(e => e.textContent.trim()).filter(Boolean).join(' | ');
  window.__ticks = raw => { try { return __dec(raw)?.clock?.ticks; } catch (e) { return 'ошибка'; } };
  window.__snap = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; };
}
// Хранилище из снимка — до любого скрипта страницы, один раз на вкладку (запуск игры как после закрытия вкладки,
// без записи при уходе со страницы).
const seedInit = snap => ({ fn: snap => { if (sessionStorage.getItem('__seeded275')) return; localStorage.clear(); for (const [k, v] of Object.entries(snap)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded275', '1'); }, arg: snap });
// Глубокое сравнение: пути различий (порядок ключей не важен).
function diff(a, b, p = '', out = []) {
  if (out.length > 12) return out;
  if (a === b) return out;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') { if (!(Number.isNaN(a) && Number.isNaN(b))) out.push(p + ': ' + JSON.stringify(a)?.slice(0, 60) + ' ≠ ' + JSON.stringify(b)?.slice(0, 60)); return out; }
  if (Array.isArray(a) !== Array.isArray(b)) { out.push(p + ': массив/объект'); return out; }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) diff(a[k], b[k], p + '.' + k, out);
  return out;
}
const strip = (x, extra = []) => { const c = JSON.parse(JSON.stringify(x)); for (const k of ['savedAt', ...extra]) delete c[k]; if (c.clock) { delete c.clock.running; delete c.clock.resumeAfterChoice; delete c.clock.choiceActive; } return c; };
const modal = pg => pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join('\n'), buttons: [...document.querySelectorAll('#modal .options button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }));
const clickText = (pg, re) => pg.evaluate(src => { const re = new RegExp(src); const b = [...document.querySelectorAll('#modal button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; }, re.source);
// Текст статуса «Сохранено · ЧЧ:ММ» → «Сохранено · 22 нояб., ЧЧ:ММ» (запись не сегодня) и обратно: «Персонажи»
// и «Сохранить» стоят на месте.
async function statusKeepsButtons(pg) {
  return pg.evaluate(() => {
    const pos = () => { const b = re => [...document.querySelectorAll('header nav button')].find(x => re.test(x.textContent.trim())); return ['Персонажи', 'Сохранить'].map(t => { const r = b(new RegExp('^' + t + '$'))?.getBoundingClientRect(); return r ? Math.round(r.x) + ',' + Math.round(r.y) : '-'; }).join(' '); };
    const at = s.savedAt, rows = [];
    rows.push(__status() + ' → ' + pos());
    s.savedAt = new Date(Date.now() - 3 * 86400000).toISOString(); paintSaveStatus275();
    rows.push(__status() + ' → ' + pos());
    s.savedAt = at; paintSaveStatus275();
    rows.push(__status() + ' → ' + pos());
    window.__statusMoves = rows;
    const xs = rows.map(r => r.split(' → ')[1]);
    return xs.every(x => x === xs[0]) && !xs[0].includes('-') && rows[0].split(' → ')[0] !== rows[1].split(' → ')[0];
  });
}
async function pickFile(pg, file) {
  const [chooser] = await Promise.all([pg.waitForEvent('filechooser'), pg.evaluate(() => { pickSaveFile(); })]);
  await chooser.setFiles(file);
  await pg.waitForFunction(() => $('#modal').open && /Восстановить персонажей/.test(document.querySelector('#modal h2')?.textContent || '') || /Не удалось/.test(document.querySelector('.toast')?.textContent || ''), null, { timeout: 30000 }).catch(() => {});
}
async function download(pg, fn) {
  const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 30000 }), pg.evaluate(fn)]);
  const file = path.join(TMP, 'dl-' + Date.now() + '.json');
  await dl.saveAs(file);
  return file;
}
// Жизнь для проверок: файл копии владелицы или прожитая здесь до 30 лет.
async function sourceFile(browser) {
  if (SAVE) return SAVE;
  const ctx = await context(browser); ctx.withSave = false;
  const { pg } = await openPage(ctx);
  await pg.selectOption('#country', 'it'); await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock"); await pg.evaluate(helpers); await pg.evaluate(() => __quiet());
  await pg.evaluate(() => { let n = 0; while (s.age < 30 && !s.dead && n++ < 400) __month(); });
  const file = await download(pg, () => exportLives());
  await ctx.close();
  return file;
}

(async () => {
  const browser = await chromium.launch();
  const SRC = await sourceFile(browser);
  const srcData = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const srcLife = srcData.lives[0];
  const plainChars = JSON.stringify(srcLife).length;
  let A = null, P = null, O = null, I = null, L = null, E = null, dPlain = [], m, d, st;
  console.log(`Жизнь: ${srcLife.name} ${srcLife.surname}, ${srcLife.age} лет, ${plainChars} знаков JSON, файл ${(fs.statSync(SRC).size / 1048576).toFixed(1)} МБ` + (BASE ? ' · BASE=1, без save275.js' : ' · save275.js: ' + PLACE));

  // ---------- 1–2. Импорт, сжатие, перезагрузка, месяцы, статус ----------
  await section('1–2. Импорт, сжатие, перезагрузка, месяцы, статус', async () => {
    A = await openPage(await context(browser));
    await pickFile(A.pg, SRC);
    m = await modal(A.pg);
    check(m.open && /Восстановить персонажей/.test(m.title), 'импорт: файл копии принят', m.title + ' · ' + m.text.slice(0, 120));
    await clickText(A.pg, /Добавить сохранения/);
    m = await modal(A.pg);
    check(m.open && /Ваши персонажи/.test(m.title), 'импорт: после добавления открыты «Персонажи»', m.title);
    const ids = await A.pg.evaluate(() => vaultIndex().ids);
    const id1 = ids[ids.length - 1];
    st = await A.pg.evaluate(id => { const x = __store(id); return { ...x, main: undefined, back: undefined, same: JSON.stringify(__dec(x.main)) === JSON.stringify(__dec(x.back)) }; }, id1);
    check(st.mainPacked && st.backPacked, 'импорт: основная запись и резервная копия сжаты', `основная ${st.mainLen} знаков, резервная ${st.backLen}, без сжатия было бы ${plainChars}`);
    check(st.same, 'импорт: обе копии распаковываются в одну и ту же жизнь');
    // Открыть из «Персонажей».
    await A.pg.evaluate(() => { const b = document.querySelector('#modal .life-open21'); b.click(); });
    await A.pg.evaluate(() => { __quiet(); if ($('#modal').open) closeModal(); });
    check(await A.pg.evaluate(n => s && s.name === n, srcLife.name), 'импорт: жизнь открыта из «Персонажей»');
    // Статус: отложенная запись (дважды за игровой месяц) его не меняет — «Сохраняется…» мигало бы, пока идёт время.
    await A.pg.evaluate(() => __flush()); await A.pg.waitForTimeout(50);
    const queued = await A.pg.evaluate(() => { const before = __status(); s.flags.status275 = 1; save(); return new Promise(r => setTimeout(() => r({ before, during: __status(), pending: typeof saveTimer264 !== 'undefined' && !!saveTimer264 }), 50)); });
    await A.pg.waitForTimeout(600);
    const saved = await A.pg.evaluate(() => { delete s.flags.status275; return __status(); });
    check(BASE || (queued.pending && /^Сохранено · /.test(queued.before) && /^Сохранено · /.test(queued.during)), 'статус: пока отложенная запись ждёт, текст не меняется (не мигает «Сохраняется…»)', JSON.stringify(queued));
    check(/^Сохранено · \d\d:\d\d$/.test(saved), 'статус: «Сохранено · ЧЧ:ММ» после записи', saved || '(пусто)');
    check(BASE || await statusKeepsButtons(A.pg), 'статус: смена его текста не двигает «Персонажи» и «Сохранить» (1280)', JSON.stringify(await A.pg.evaluate(() => window.__statusMoves || null)));
    // Сохранено → перезагрузка → то же состояние.
    await A.pg.evaluate(() => __flush());
    const before = await A.pg.evaluate(() => { const x = __store(); return { stored: __dec(x.main), live: JSON.parse(JSON.stringify(s)) }; });
    check(diff(strip(before.stored), strip(before.live)).length === 0, 'запись: в хранилище ровно s', diff(strip(before.stored), strip(before.live)).join('; '));
    await reload(A);
    const after = await A.pg.evaluate(() => JSON.parse(JSON.stringify(s)));
    d = diff(strip(before.stored), strip(after));
    // То же без save275.js: при первой загрузке игра сама чинит часть полей (например, path16.marketKey, careers272.js).
    const ctxPlain = await context(browser); ctxPlain.withSave = false;
    const Z = await openPage(ctxPlain);
    await Z.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal(); __flush(); }, srcData);
    const zBefore = await Z.pg.evaluate(() => __dec(__store().main));
    await reload(Z);
    dPlain = diff(strip(zBefore), strip(await Z.pg.evaluate(() => JSON.parse(JSON.stringify(s)))));
    await ctxPlain.close();
    check(d.join('|') === dPlain.join('|'), 'перезагрузка: s совпадает с сохранённым до перезагрузки — с точностью до того, что игра чинит при загрузке и без save275.js', d.length ? 'чинится и без save275.js: ' + d.join('; ') : 'без различий');
    await A.pg.evaluate(() => { __quiet(); if ($('#modal').open) closeModal(); });
    await A.pg.waitForTimeout(600);
    await A.pg.evaluate(() => __flush());
    const stored2 = await A.pg.evaluate(() => __dec(__store().main));
    await reload(A);
    const after2 = await A.pg.evaluate(() => JSON.parse(JSON.stringify(s)));
    d = diff(strip(stored2), strip(after2));
    check(d.length === 0, 'вторая перезагрузка: s совпадает с сохранённым', d.join('; '));
    check(await A.pg.evaluate(() => __store().mainPacked) === !BASE, 'после перезагрузок основная запись сжата');
    // Месяцы идут.
    const t0 = await A.pg.evaluate(() => ({ y: s.year, m: s.clock.month, t: s.clock.ticks }));
    const monthErr = await A.pg.evaluate(() => { __quiet(); const errs = []; for (let i = 0; i < 3; i++) try { __month(); } catch (e) { errs.push(String(e).slice(0, 120)); } return errs; });
    const t1 = await A.pg.evaluate(() => ({ y: s.year, m: s.clock.month, t: s.clock.ticks }));
    check(!monthErr.length && t1.t - t0.t === 3, 'после перезагрузки идут месяцы', `${t0.m}.${t0.y} → ${t1.m}.${t1.y}` + (monthErr.length ? ' · ' + monthErr[0] : ''));
    await A.pg.evaluate(() => __flush());
    const stored3 = await A.pg.evaluate(() => ({ dec: __dec(__store().main), live: JSON.parse(JSON.stringify(s)) }));
    check(diff(strip(stored3.dec), strip(stored3.live)).length === 0, 'после месяцев: в хранилище ровно s');
    // Экспорт — обычный JSON.
    const exp = await download(A.pg, () => exportLives());
    const expText = fs.readFileSync(exp, 'utf8'), expData = JSON.parse(expText);
    check(expData.format === 'life-side-effects' && !expText.includes('deflate-v1:') && expData.lives.some(l => l.saveId === stored3.live.saveId && diff(strip(l), strip(stored3.live)).length === 0), 'экспорт: обычный JSON, жизнь в нём — текущая', `${(expText.length / 1048576).toFixed(1)} МБ`);
    // Время записи (полная запись, не очередь) на этой жизни.
    const timing = await A.pg.evaluate(() => { const med = f => { const ts = []; for (let i = 0; i < 7; i++) { const a = performance.now(); f(i); ts.push(performance.now() - a); } ts.sort((a, b) => a - b); return Math.round(ts[3]); }; const out = { changed: med(i => { s.flags.timing275 = i; save(); flushSave264(); }), same: med(() => { save(); flushSave264(); }) }; delete s.flags.timing275; __flush(); return out; });
    console.log(`     запись жизни (save + flushSave264), медиана: ${timing.changed} мс, если состояние изменилось; ${timing.same} мс, если нет`);

  });
  // ---------- 2. Статус на телефоне ----------
  await section('2. Статус на телефоне', async () => {
    const phone = await context(browser, { viewport: { width: 390, height: 844 } });
    P = await openPage(phone);
    await P.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal(); __flush(); }, srcData);
    await P.pg.waitForTimeout(300);
    const lay = await P.pg.evaluate(() => { const st = document.querySelector('.save-status275'), h = document.querySelector('#app>header'); const r = st?.getBoundingClientRect(), hr = h.getBoundingClientRect(); return { text: st?.textContent || '', visible: !!r && r.width > 0 && r.height > 0, inside: !!r && r.right <= innerWidth + 0.5 && r.left >= 0 && r.bottom <= hr.bottom + 0.5, scroll: document.documentElement.scrollWidth > innerWidth, headerH: Math.round(hr.height) }; });
    check(BASE || (lay.visible && lay.inside && !lay.scroll), 'телефон 390: статус виден, в шапке, без горизонтальной прокрутки', JSON.stringify(lay));
    check(BASE || await statusKeepsButtons(P.pg), 'телефон 390: смена текста статуса не двигает «Персонажи» и «Сохранить»', JSON.stringify(await P.pg.evaluate(() => window.__statusMoves || null)));
    await P.pg.screenshot({ path: path.join(TMP, 'phone-saved.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });

  });
  // ---------- 3. Старая несжатая жизнь ----------
  await section('3. Старая несжатая жизнь', async () => {
    const ctxOld = await context(browser); ctxOld.withSave = false;
    O = await openPage(ctxOld);
    const oldId = await O.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; const id = ids[ids.length - 1]; loadCharacter(id); __quiet(); if ($('#modal').open) closeModal(); __flush(); return id; }, srcData);
    const oldStore = await O.pg.evaluate(() => { const x = __store(); return { mainPacked: x.mainPacked, plain: x.main, live: JSON.parse(JSON.stringify(s)) }; });
    check(!oldStore.mainPacked, 'старая жизнь: без save275.js записана без сжатия (как в 271)');
    ctxOld.withSave = !BASE;
    await reload(O);
    // Первая запись после загрузки — сразу (отложенная со старта или, без неё, обычная), проверка — до следующей.
    // При перезагрузке saves.js и save264.js дописывают сохранение на pagehide — сравнение без savedAt.
    const mig = await O.pg.evaluate(old => { const same = (a, b) => { a = { ...a }; b = { ...b }; delete a.savedAt; delete b.savedAt; return JSON.stringify(a) === JSON.stringify(b); }; const live0 = JSON.parse(JSON.stringify(s)); const packed0 = __store().mainPacked; flushSave264(); if (!__store().mainPacked) { save(); flushSave264(); } const x = __store(), plain = localStorage.getItem('life-plain275-' + s.saveId), dm = __dec(x.main), live = JSON.parse(JSON.stringify(s)); delete dm.savedAt; delete live.savedAt; return { live0, packed0, mainPacked: x.mainPacked, backPacked: x.backPacked, plainKept: !!plain && !plain.startsWith('deflate-v1:') && same(JSON.parse(plain), JSON.parse(old)), backIsOld: same(__dec(x.back), JSON.parse(old)), mainIsLive: JSON.stringify(dm) === JSON.stringify(live) }; }, oldStore.plain);
    d = diff(strip(JSON.parse(oldStore.plain)), strip(mig.live0));
    check(d.join('|') === dPlain.join('|'), 'старая жизнь: открылась с save275.js, состояние то же (с точностью до починки при загрузке)', d.join('; '));
    await O.pg.evaluate(() => { __quiet(); if ($('#modal').open) closeModal(); });
    check(mig.mainPacked && mig.mainIsLive, 'старая жизнь: при следующей записи сжата и распаковывается в s');
    check(mig.plainKept, 'старая жизнь: прежняя несжатая версия лежит отдельным ключом, несжатой');
    check(mig.backPacked && mig.backIsOld, 'старая жизнь: резервная копия — прежняя версия, сжатая');
    await O.pg.evaluate(() => { __quiet(); __month(); __flush(); });
    const mig2 = await O.pg.evaluate(() => ({ plainLeft: localStorage.getItem('life-plain275-' + s.saveId) !== null, mainPacked: __store().mainPacked, keys: Object.keys(localStorage).filter(k => /plain275/.test(k)) }));
    check(!mig2.plainLeft && mig2.mainPacked, 'старая жизнь: после следующей сверенной сжатой записи несжатая копия удалена', JSON.stringify(mig2.keys));

  });
  // ---------- 4. Повреждённая основная запись ----------
  await section('4. Повреждённая основная запись', async () => {
    // Две записи подряд: в резервной — прежняя целая версия.
    await A.pg.evaluate(() => { __month(); __flush(); __month(); __flush(); });
    const hm = iso => A.pg.evaluate(iso => new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), iso);
    let backLife = await A.pg.evaluate(() => __dec(__store().back));
    for (const [kind, corrupt] of [['сжатая', raw => raw.startsWith('deflate-v1:') ? raw.slice(0, 5000) + 'AAAA' + raw.slice(5004) : 'deflate-v1:' + raw.slice(0, 4000)], ['несжатая', () => '{"v":1,"name":"обрыв']]) {
      await A.pg.evaluate(src => { const f = new Function('return ' + src)(); localStorage.setItem(__key(), f(localStorage.getItem(__key()))); }, corrupt.toString());
      await reload(A);
      await A.pg.waitForTimeout(300);
      const r = await A.pg.evaluate(() => ({ live: JSON.parse(JSON.stringify(s)), modal: $('#modal').open ? document.querySelector('#modal h2')?.textContent + ' · ' + document.querySelector('#modal p')?.textContent : '' }));
      const dd = diff(strip(backLife), strip(r.live));
      check(dd.length === 0, `повреждена ${kind} основная запись: при запуске открыта резервная копия`, dd.join('; '));
      check(/Открыта предыдущая копия/.test(r.modal) && r.modal.includes(await hm(backLife.savedAt)), `повреждена ${kind} основная запись: об этом сказано, со временем копии`, r.modal.slice(0, 260) || '(окна нет)');
      await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); __month(); __flush(); __month(); __flush(); });
      backLife = await A.pg.evaluate(() => __dec(__store().back));
    }
    // Обычная перезагрузка без повреждений — окна о копии нет.
    await reload(A); await A.pg.waitForTimeout(300);
    m = await modal(A.pg);
    check(!/предыдущая копия/i.test(m.title), 'обычная перезагрузка: окна о копии нет', m.title);
    await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); });
    // Без повреждений, но основная запись при запуске — не та, чей отпечаток записан в life-saves275. Окна о копии быть
    // не должно: игра открыла самую новую основную запись.
    const startAgain = async (label, prepare) => {
      const src = await openPage(await context(browser));
      const snap = await src.pg.evaluate(prepare, srcData);
      await src.ctx.close();
      const N = await openPage(await context(browser), seedInit(snap.storage));
      await N.pg.waitForTimeout(1200);
      const r = await N.pg.evaluate(() => ({ title: $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '', name: s?.name, ticks: s?.clock?.ticks, flag: s?.flags?.f275, mainTicks: s ? __ticks(localStorage.getItem(__key())) : null }));
      check(!/предыдущая копия/i.test(r.title) && r.name === snap.name && r.ticks === snap.ticks && r.ticks === r.mainTicks && r.flag === snap.flag, label, JSON.stringify({ ...r, expected: { name: snap.name, ticks: snap.ticks, flag: snap.flag } }));
      for (const e of N.errors) A.errors.push(e);
      await N.ctx.close();
    };
    // а) Последняя запись удалась, а маленькая запись отпечатков — нет (кончилось место; то же, если вкладку закрыли
    //    между записями).
    await startAgain('без повреждений: отпечатки последней записи не записались — открыта последняя запись, окна о копии нет', d => {
      importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal();
      __flush(); __month(); __flush(); s.flags.f275 = 1; __flush();
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === 'life-saves275') throw new DOMException('Квота', 'QuotaExceededError'); return set.call(this, k, v); };
      try { s.flags.f275 = 2; __flush(); } finally { Storage.prototype.setItem = set; }
      return { storage: __snap(), name: s.name, ticks: s.clock.ticks, flag: 2 };
    });
    // б) Активную жизнь удалили — при запуске saves.js открывает самую свежую из оставшихся и переписывает её основную
    //    запись: у импортированной и ни разу не открытой обе копии одинаковые, у сыгранной резервная — прошлый месяц.
    await startAgain('без повреждений: активную жизнь удалили, открылась импортированная — окна о копии нет', d => {
      const other = JSON.parse(JSON.stringify(d.lives[0])); other.name = 'Вера'; other.flags.f275 = 3;
      importLives({ format: 'life-side-effects', version: 1, lives: [d.lives[0], other] });
      const ids = vaultIndex().ids, active = ids[ids.length - 2];
      loadCharacter(active); __quiet(); if ($('#modal').open) closeModal(); __flush();
      deleteLife17(active); __flush(); if ($('#modal').open) closeModal();
      return { storage: __snap(), name: 'Вера', ticks: other.clock.ticks, flag: 3 };
    });
    await startAgain('без повреждений: активную жизнь удалили, открылась сыгранная раньше — окна о копии нет', d => {
      const other = JSON.parse(JSON.stringify(d.lives[0])); other.name = 'Вера';
      importLives({ format: 'life-side-effects', version: 1, lives: [d.lives[0], other] });
      const ids = vaultIndex().ids, active = ids[ids.length - 2], played = ids[ids.length - 1];
      loadCharacter(played); __quiet(); if ($('#modal').open) closeModal();
      __flush(); __month(); __flush(); __month(); s.flags.f275 = 4; __flush();
      const ticks = s.clock.ticks;
      loadCharacter(active); __quiet(); if ($('#modal').open) closeModal(); __flush();
      deleteLife17(active); __flush(); if ($('#modal').open) closeModal();
      return { storage: __snap(), name: 'Вера', ticks, flag: 4 };
    });
    // в) Основная отличается от резервной только флагами часов (первая запись 275 после старой сборки, остановленной на
    //    ходу), а отпечатки отстали — вкладку закрыли между записью жизни и записью отпечатков. Основная читается и она
    //    последняя: окна о копии нет.
    await startAgain('без повреждений: основная отличается от резервной только флагами часов, отпечатки отстали — окна о копии нет', d => {
      importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal();
      __flush(); __month(); __flush();
      const key = __key(), life = __dec(localStorage.getItem(key)), ago = m => new Date(Date.now() - m * 60000).toISOString();
      life.flags.f275 = 6;
      const pack = typeof pack275 === 'function' ? pack275 : x => x;
      const back = pack(JSON.stringify({ ...life, savedAt: ago(3), clock: { ...life.clock, running: true } }));
      const main = pack(JSON.stringify({ ...life, savedAt: ago(2), clock: { ...life.clock, running: false } }));
      localStorage.setItem(key + '-backup', back); localStorage.setItem(key, main);
      if (typeof fingerprint275 === 'function') { const book = JSON.parse(localStorage.getItem('life-saves275') || '{"lives":{}}'); book.lives[s.saveId] = { m: '1:устарел', b: fingerprint275(back) }; localStorage.setItem('life-saves275', JSON.stringify(book)); }
      return { storage: __snap(), name: life.name, ticks: life.clock.ticks, flag: 6 };
    });
    // г) Две вкладки: вкладка, открытая раньше, не возвращает своей копией старые отпечатки жизни, которую с тех пор
    //    записала другая вкладка (иначе при следующем запуске — ложное «Открыта предыдущая копия»).
    if (!BASE) {
      const ctxT = await context(browser);
      const X = await openPage(ctxT);
      await X.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal(); __flush(); }, srcData);
      const Y = await openPage(ctxT);
      await Y.pg.waitForTimeout(1200);
      await Y.pg.evaluate(() => { __quiet(); if ($('#modal').open) closeModal(); });
      // Вкладка X заново открывает жизнь (вкладка Y при запуске могла её переписать — тогда X записать не дала бы
      // saves.js) и записывает изменение.
      const xw = await X.pg.evaluate(() => { loadCharacter(s.saveId); __quiet(); if ($('#modal').open) closeModal(); __flush(); const before = localStorage.getItem(__key()); s.flags.tab275 = 1; __flush(); const after = localStorage.getItem(__key()); return { id: s.saveId, fp: fingerprint275(after), wrote: after !== before, state: status275.state }; });
      await Y.pg.evaluate(d => { const one = JSON.parse(JSON.stringify(d.lives[0])); one.name = 'Вкладка'; importLives({ format: 'life-side-effects', version: 1, lives: [one] }); }, srcData);
      const rec = await X.pg.evaluate(id => JSON.parse(localStorage.getItem('life-saves275') || '{"lives":{}}').lives[id], xw.id);
      check(xw.wrote && rec && rec.m === xw.fp, 'две вкладки: вкладка, открытая раньше, не переписывает отпечатки чужой записи старыми', JSON.stringify({ rec, fp: xw.fp, wrote: xw.wrote, state: xw.state }));
      for (const e of [...X.errors, ...Y.errors]) A.errors.push(e);
      await ctxT.close();
    }
    // Вторая жизнь: повреждена, открывается из «Персонажей».
    const id2 = await A.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; return ids[ids.length - 1]; }, srcData);
    await A.pg.evaluate(id => { const k = __key(id); localStorage.setItem(k + '-backup', localStorage.getItem(k)); localStorage.setItem(k, 'deflate-v1:AAAA'); }, id2);
    await A.pg.evaluate(id => { loadCharacter(id); }, id2);
    await A.pg.waitForTimeout(300);
    m = await modal(A.pg);
    // Резервная копия — та же версия, что последняя запись (импорт пишет обе одинаковыми): ничего не потерялось.
    check(await A.pg.evaluate(id => s.saveId === id, id2) && /Открыта резервная копия/.test(m.title) && /ничего не потерялось/.test(m.text), 'жизнь из «Персонажей» с повреждённой основной записью: открыта копия, об этом сказано (копия та же, что последняя запись — ничего не потерялось)', m.title + ' · ' + m.text.slice(0, 200));
    await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); __flush(); });
    // Резервная копия старше последней записи (прошлый месяц): «Открыта предыдущая копия», сыгранное после неё пропало.
    const older = await A.pg.evaluate(id => {
      __month(); __flush(); __month(); __flush();
      loadCharacter(vaultIndex().ids.find(x => x !== id)); __quiet(); if ($('#modal').open) closeModal(); __flush();
      localStorage.setItem(__key(id), 'deflate-v1:AAAA');
      loadCharacter(id);
      return s.saveId === id;
    }, id2);
    await A.pg.waitForTimeout(300);
    m = await modal(A.pg);
    check(older && /Открыта предыдущая копия/.test(m.title) && /Сыгранное после неё не сохранилось/.test(m.text), 'то же, копия — прошлый месяц: «Открыта предыдущая копия», сыгранное после неё не сохранилось', m.title + ' · ' + m.text.slice(0, 200));
    await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); __flush(); });
    // «Восстановить предыдущую версию».
    await A.pg.evaluate(() => { __month(); __flush(); __month(); __flush(); });
    const prevRaw = await A.pg.evaluate(() => __store().back), prevLife = await A.pg.evaluate(() => __dec(__store().back)), curLife = await A.pg.evaluate(() => __dec(__store().main));
    await A.pg.evaluate(() => openLives());
    const restoreButtons = await A.pg.evaluate(() => [...document.querySelectorAll('#modal .life-restore275')].map(b => b.textContent));
    check(restoreButtons.length >= 1 && restoreButtons.every(t => t === 'Восстановить предыдущую версию'), 'в «Персонажах» у жизни с резервной копией — «Восстановить предыдущую версию»', restoreButtons.length + ' шт.');
    if (restoreButtons.length) {
      await A.pg.evaluate(id => { const cards = [...document.querySelectorAll('#modal .life-card21')]; const k = restoreIds275.indexOf(id); cards[k].querySelector('.life-restore275').click(); }, id2).catch(() => {});
      m = await modal(A.pg);
      check(/Восстановить предыдущую версию\?/.test(m.title) && /Предыдущая версия:/.test(m.text), 'восстановление: подтверждение с обеими версиями', m.text.slice(0, 200));
      // Версии подписаны игровым месяцем: «Сейчас» было неверно, когда на экране сыграно больше, а после отмены
      // «предыдущая» — более поздняя.
      const my = l => ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][l.clock.month] + ' ' + l.year;
      check(/Сейчас в сохранении: /.test(m.text) && m.text.includes(my(curLife)) && m.text.includes(my(prevLife)) && m.buttons.includes(`Восстановить предыдущую версию (${my(prevLife)})`), 'восстановление: версии подписаны игровым месяцем, в кнопке — какая откроется', m.text.slice(0, 260) + ' · ' + m.buttons.join(' / '));
      const r = await A.pg.evaluate(() => {
        const set = Storage.prototype.setItem, ops = [];
        Storage.prototype.setItem = function (k, v) { if (this === localStorage && /^life-(character|saves275)/.test(k)) ops.push(k.endsWith('-backup') ? 'резервная' : k === 'life-saves275' ? 'отпечатки' : 'основная'); return set.call(this, k, v); };
        try { [...document.querySelectorAll('#modal .options button')].find(b => b.textContent.startsWith('Восстановить предыдущую версию')).click(); } finally { Storage.prototype.setItem = set; }
        return { live: JSON.parse(JSON.stringify(s)), id: s.saveId, main: __store().main, mainAt: __dec(__store().main).savedAt, ops };
      });
      check(r.ops.join(',') === 'резервная,основная,отпечатки', 'восстановление: сначала резервная копия ← текущая версия, потом основная ← предыдущая, отпечатки последними', r.ops.join(', '));
      await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); });
      await A.pg.waitForTimeout(600);
      await A.pg.evaluate(() => __flush());
      const r2 = await A.pg.evaluate(() => ({ main: __dec(__store().main), back: __dec(__store().back) }));
      // Открытая жизнь — предыдущая версия, как её открывает loadCharacter (он может добавить запись в «Итоги» и т. п.).
      check(r.id === id2 && r.main === prevRaw && r.live.clock.ticks === prevLife.clock.ticks, 'восстановление: в основной записи и в игре — предыдущая версия', `месяц ${r.live.clock.ticks}, был ${curLife.clock.ticks}` + (r.main === prevRaw ? '' : ` · в записи ${r.mainAt}, предыдущая ${prevLife.savedAt}`));
      const dr = diff(strip(r.live), strip(r2.main));
      check(r2.main.clock.ticks === prevLife.clock.ticks && dr.length === 0, 'восстановление: отложенная запись её не перебила, записано то, что в игре', dr.join('; '));
      check(r2.back.clock.ticks === curLife.clock.ticks && prevLife.clock.ticks < curLife.clock.ticks, 'восстановление: заменённая версия — в резервной копии (пока месяц не сменился, её можно вернуть)', `месяцы: предыдущая ${prevLife.clock.ticks}, заменённая ${curLife.clock.ticks}, в копии ${r2.back.clock.ticks}`);
      // Восстановление из окна идёт внутри choose() (transact): «итог действия» — разница между версией на экране и
      // восстановленной — в восстановленную жизнь не записывается.
      const rc = x => JSON.stringify((x.receipts || [])[0] ? { title: x.receipts[0].title, changes: x.receipts[0].changes } : null);
      check(rc(r2.main) === rc(prevLife), 'восстановление: в восстановленную жизнь не записан «итог действия» с разницей версий', `в копии ${rc(prevLife)}, после восстановления ${rc(r2.main)}`);
      // Внутри игрового месяца резервная копия не переписывается: «предыдущая версия» — прошлый месяц, а не прошлое нажатие.
      const same = await A.pg.evaluate(() => { const b0 = localStorage.getItem(__key() + '-backup'); for (let i = 0; i < 3; i++) { openLives(); closeModal(); __flush(); } return localStorage.getItem(__key() + '-backup') === b0; });
      check(same, 'внутри месяца резервная копия не переписывается');
      const moved = await A.pg.evaluate(() => { const t = s.clock.ticks; __month(); __flush(); return __dec(localStorage.getItem(__key() + '-backup')).clock.ticks === t; });
      check(moved, 'месяц сменился — в резервной копии прошлый месяц');
      // Вкладку «закрыли» сразу после первой записи восстановления — в основной записи по-прежнему последнее сохранение.
      const cut = await A.pg.evaluate(() => {
        __flush();
        const key = __key(), main0 = localStorage.getItem(key), back0 = localStorage.getItem(key + '-backup');
        const set = Storage.prototype.setItem, rem = Storage.prototype.removeItem, ops = [];
        let frozen = false;
        Storage.prototype.setItem = function (k, v) { if (this !== localStorage) return set.call(this, k, v); ops.push(k === key ? 'основная' : k === key + '-backup' ? 'резервная' : k); if (frozen) return; set.call(this, k, v); if (String(k).startsWith('life-')) frozen = true; };
        Storage.prototype.removeItem = function (k) { if (frozen && this === localStorage) return; return rem.call(this, k); };
        try { restoreBackup275(s.saveId, back0); } finally { Storage.prototype.setItem = set; Storage.prototype.removeItem = rem; }
        const mainNow = localStorage.getItem(key);
        const out = { ops: ops.slice(0, 3), mainKept: mainNow === main0, mainTicks: __ticks(mainNow), latestTicks: __ticks(main0), olderTicks: __ticks(back0) };
        if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal();
        return out;
      });
      check(cut.mainKept, 'восстановление оборвалось после первой записи — в основной записи последнее сохранение', JSON.stringify(cut));
      await A.pg.evaluate(() => { __flush(); });
    }

  });
  // ---------- 5. Нет места ----------
  await section('5. Нет места', async () => {
    await A.pg.evaluate(() => { __month(); __flush(); });
    const q = await A.pg.evaluate(() => {
      const key = __key(), mainBefore = localStorage.getItem(key), backBefore = localStorage.getItem(key + '-backup');
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('life-')) throw new DOMException('Квота', 'QuotaExceededError'); return set.call(this, k, v); };
      window.__restoreSet = () => { Storage.prototype.setItem = set; };
      __month(); save(); const ok = flushSave264();
      return { ok, mainKept: localStorage.getItem(key) === mainBefore, backKept: localStorage.getItem(key + '-backup') === backBefore, status: __status(), toast: document.querySelector('.toast')?.textContent || '' };
    });
    await A.pg.waitForTimeout(50);
    const qStatus = await A.pg.evaluate(() => __status());
    check(!q.ok && q.mainKept && q.backKept, 'нет места: запись не прошла, прежнее сохранение и копия не тронуты');
    check(/^Не удалось сохранить: нет места — скачайте копию/.test(qStatus), 'нет места: статус рядом с «Сохранить»', qStatus || '(пусто)');
    const troubleOpened = await A.pg.evaluate(() => { const b = document.querySelector('.save-status275 button'); if (!b) return false; b.click(); return true; });
    m = await modal(A.pg);
    check(troubleOpened && /Не удалось сохранить/.test(m.title) && m.buttons.includes('Скачать копию всех жизней'), 'нет места: по статусу — окно со «Скачать копию всех жизней»', m.buttons.join(' / '));
    if (m.buttons.includes('Скачать копию всех жизней')) {
      const liveNow = await A.pg.evaluate(() => JSON.parse(JSON.stringify(s)));
      const f = await download(A.pg, () => { const b = [...document.querySelectorAll('#modal .options button')].find(b => b.textContent === 'Скачать копию всех жизней'); b.click(); });
      const life = JSON.parse(fs.readFileSync(f, 'utf8')).lives.find(l => l.saveId === liveNow.saveId);
      check(life && diff(strip(life), strip(liveNow)).length === 0, 'нет места: в скачанной копии — текущая жизнь, с тем, что не записалось', life ? diff(strip(life), strip(liveNow)).join('; ') : 'нет жизни');
    }
    await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __restoreSet(); __month(); __flush(); });
    await A.pg.waitForTimeout(600);
    check(/^Сохранено · /.test(await A.pg.evaluate(() => __status())), 'нет места: место появилось — снова «Сохранено»', await A.pg.evaluate(() => __status()));
    // После неудачной записи в основной записи — последнее удачное сохранение, в резервной — прошлый месяц. В той же
    // задаче ни readLife, ни «Персонажи» не должны подменять основную запись резервной копией. Путь игрока: окно
    // «Не удалось сохранить» → «Персонажи» → эта же жизнь.
    await A.pg.evaluate(() => { __month(); __flush(); __month(); __flush(); });
    const leak = await A.pg.evaluate(() => {
      const key = __key(), id = s.saveId, mainRaw = localStorage.getItem(key);
      const good = __ticks(mainRaw), back = __ticks(localStorage.getItem(key + '-backup')), goodAt = new Date(__dec(mainRaw).savedAt).toLocaleString('ru-RU');
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (k === key) throw new DOMException('Квота', 'QuotaExceededError'); return set.call(this, k, v); };
      try {
        __month(); s.flags.f275 = 'не записано'; save(); const ok = flushSave264();
        const live = s.clock.ticks, viaRead = readLife(id)?.clock?.ticks;
        if (typeof saveTrouble275 === 'function') { saveTrouble275(); [...document.querySelectorAll('#modal .options button')].find(b => b.textContent === 'Персонажи').click(); } else openLives();
        // Карточка этой жизни — по порядку «Персонажей» (свежие сверху), посчитанному по самим записям.
        const order = vaultIndex().ids.map(x => ({ x, at: String(__dec(localStorage.getItem(__key(x)))?.savedAt || '') })).sort((a, b) => b.at.localeCompare(a.at)).map(o => o.x);
        const card = document.querySelectorAll('#modal .life-open21')[order.indexOf(id)];
        const cardText = card ? card.textContent.replace(/\s+/g, ' ') : '';
        card?.click(); __quiet(); if ($('#modal').open) closeModal();
        const opened = s.clock.ticks, keptUnsaved = s.flags.f275 === 'не записано', toast = document.querySelector('.toast')?.textContent || '';
        Storage.prototype.setItem = set;
        __flush();
        return { ok, good, back, live, viaRead, cardShowsMain: cardText.includes(goodAt), opened, keptUnsaved, after: __ticks(localStorage.getItem(key)), toast };
      } finally { Storage.prototype.setItem = set; }
    });
    const leakInfo = `основная ${leak.good}, резервная ${leak.back}, в игре ${leak.live}; readLife ${leak.viaRead}, открыта ${leak.opened}, в основной после ${leak.after}`;
    check(!leak.ok && leak.back < leak.good && leak.viaRead === leak.good, 'нет места: readLife сразу после неудачной записи — последнее удачное сохранение, а не резервная копия', leakInfo);
    check(leak.cardShowsMain, 'нет места: в «Персонажах» у этой жизни — последнее удачное сохранение', leakInfo);
    check(leak.opened >= leak.good && leak.after >= leak.good, 'нет места: эта же жизнь из «Персонажей» — не резервная копия; когда место появилось, основная запись не старее последнего удачного', leakInfo);
    check(leak.opened === leak.live && leak.keptUnsaved && leak.after === leak.live && /уже открыта/.test(leak.toast), 'нет места: эта же жизнь из «Персонажей» заново не открывается — несохранённое не выброшено, записано, когда место появилось', leakInfo + ' · ' + leak.toast);
    await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); });
    // Запись не проходит, а игрок открывает другую жизнь, «Новая жизнь» в «Персонажах», «Другая жизнь →», «Родиться»
    // (после логотипа) или «Восстановить предыдущую версию» у этой жизни: сначала вопрос «Сыгранное не сохранено»,
    // «Отмена» ничего не меняет; «Всё равно открыть» открывает другую жизнь.
    if (!BASE) {
      const guard = await A.pg.evaluate(() => {
        const key = __key(), id = s.saveId, other = vaultIndex().ids.find(x => x !== id && readLife(x));
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (k === key) throw new DOMException('Квота', 'QuotaExceededError'); return set.call(this, k, v); };
        const title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(окна нет)';
        const click = re => { const b = [...document.querySelectorAll('#modal .options button')].find(b => re.test(b.textContent.trim())); if (b) b.click(); return !!b; };
        const close = () => { if ($('#modal').open) closeModal(); };
        const out = {};
        try {
          __month(); s.flags.f275 = 'не записано 2'; save(); flushSave264();
          const live = s, kept = () => s === live && s.flags.f275 === 'не записано 2';
          out.status = __status();
          loadCharacter(other); out.other = { title: title(), kept: kept(), text: document.querySelector('#modal p')?.textContent || '' }; click(/^Отмена$/); close();
          openLives(); click(/^Новая жизнь$/); out.newLife = { title: title(), kept: kept() }; click(/^Отмена$/); close();
          openLives(); const rb = document.querySelectorAll('#modal .life-card21')[restoreIds275.indexOf(id)]?.querySelector('.life-restore275'); rb?.click(); out.restore = { button: !!rb, title: title(), kept: kept() }; click(/^Отмена$/); close();
          newLife(); out.dead = { title: title(), kept: kept() }; click(/^Отмена$/); close();
          homeMenu37(); start(); out.born = { title: title(), kept: kept() }; click(/^Отмена$/); close();
          if (s !== live) s = live;
          render();
          loadCharacter(other); click(/^Всё равно открыть$/); close(); out.anyway = s?.saveId === other;
        } finally { Storage.prototype.setItem = set; }
        __quiet(); close(); __flush();
        loadCharacter(id); __quiet(); close(); __flush();
        out.back = s.saveId === id;
        return out;
      });
      const asked = x => x && x.title === 'Сыгранное не сохранено' && x.kept;
      check(asked(guard.other) && /последнее удачное сохранение — /.test(guard.other.text), 'нет места: другая жизнь из «Персонажей» — сначала вопрос «Сыгранное не сохранено», «Отмена» ничего не меняет', JSON.stringify(guard.other).slice(0, 300));
      check(asked(guard.newLife), 'нет места: «Новая жизнь» в «Персонажах» — сначала тот же вопрос', JSON.stringify(guard.newLife));
      check(guard.restore?.button && asked(guard.restore), 'нет места: «Восстановить предыдущую версию» у открытой жизни — сначала тот же вопрос, а не подтверждение с сохранённой версией', JSON.stringify(guard.restore));
      check(asked(guard.dead) && asked(guard.born), 'нет места: «Другая жизнь →» и «Родиться» после логотипа — сначала тот же вопрос', JSON.stringify({ dead: guard.dead, born: guard.born }));
      check(guard.anyway && guard.back, 'нет места: «Всё равно открыть» открывает другую жизнь', JSON.stringify({ anyway: guard.anyway, back: guard.back }));
      await A.pg.evaluate(() => { if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal(); });
    }
    // Настоящая квота: хранилище забито, жизнь выросла.
    const real = await A.pg.evaluate(() => {
      const key = __key(), mainBefore = localStorage.getItem(key);
      let n = 0; const chunk = 'x'.repeat(100000);
      try { while (n < 200) { localStorage.setItem('junk275-' + n, chunk); n++; } } catch {}
      try { while (true) { localStorage.setItem('junk275-' + n, 'x'.repeat(2000)); n++; } } catch {}
      s.flags.junk275 = Array.from({ length: 4000 }, (_, i) => i.toString(36) + Math.random().toString(36)).join('');
      save(); const ok = flushSave264();
      const kept = localStorage.getItem(key) === mainBefore;
      delete s.flags.junk275;
      for (let i = 0; i <= n; i++) localStorage.removeItem('junk275-' + i);
      return { ok, kept, junk: n };
    });
    await A.pg.waitForTimeout(50);
    const realStatus = await A.pg.evaluate(() => __status());
    check(!real.ok && real.kept, 'настоящая квота: прежнее сохранение не тронуто', JSON.stringify(real));
    check(/нет места/.test(realStatus), 'настоящая квота: статус', realStatus);
    await A.pg.evaluate(() => { __month(); __flush(); });
    await A.pg.waitForTimeout(600);
    check(/^Сохранено · /.test(await A.pg.evaluate(() => __status())), 'настоящая квота: место освободилось — снова «Сохранено»');
    // Телефон: короткий текст ошибки.
    const phoneFail = await P.pg.evaluate(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('life-')) throw new DOMException('Квота', 'QuotaExceededError'); return set.call(this, k, v); };
      __month(); __flush(); Storage.prototype.setItem = set;
      return new Promise(r => setTimeout(() => { const st = document.querySelector('.save-status275'), rr = st?.getBoundingClientRect(); r({ text: st?.innerText || '', inside: !!rr && rr.right <= innerWidth + 0.5 && rr.width > 0, scroll: document.documentElement.scrollWidth > innerWidth }); }, 30));
    });
    check(BASE || (/Нет места — скачайте копию/.test(phoneFail.text) && phoneFail.inside && !phoneFail.scroll), 'телефон 390: ошибка коротко, в шапке', JSON.stringify(phoneFail));
    await P.pg.screenshot({ path: path.join(TMP, 'phone-failed.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });
    await A.pg.screenshot({ path: path.join(TMP, 'desktop-saved.png'), clip: { x: 640, y: 0, width: 640, height: 90 } });

  });
  // ---------- 6. Сжатие не прошло сверку ----------
  await section('6. Сверка сжатия', async () => {
    // Эта жизнь во вкладке уже записывалась сжатой и сверялась: следующие записи — без распаковки (на жизни владелицы
    // сверка — 25 мс из 100 на запись). Записанное при этом распаковывается в s.
    const later = await A.pg.evaluate(() => {
      let n = 0; const real = pako.inflate;
      pako.inflate = function (...a) { n++; return real.apply(this, a); };
      try { __month(); __flush(); __month(); s.flags.f275 = 'сверка'; __flush(); } finally { pako.inflate = real; }
      const x = __store(), stored = __dec(x.main), live = JSON.parse(JSON.stringify(s));
      delete stored.savedAt; delete live.savedAt;
      return { inflates: n, mainPacked: x.mainPacked, same: JSON.stringify(stored) === JSON.stringify(live) };
    });
    check(later.inflates === 0 && later.mainPacked && later.same, 'сверка: следующие записи той же жизни — без распаковки, записанное совпадает с s', JSON.stringify(later));
    // Первая сжатая запись другой жизни во вкладке — со сверкой. Жизнь добавлена из файла и открыта; её запись ещё
    // ждёт очереди, когда сжатие портится.
    const v = await A.pg.evaluate(d => {
      if (typeof pack275 !== 'function') return { skipped: true };
      importLives(d); const ids = vaultIndex().ids, id = ids[ids.length - 1];
      loadCharacter(id); __quiet(); if ($('#modal').open) closeModal();
      const real = pack275; pack275 = raw => real(raw).slice(0, -12) + 'AAAAAAAAAAAA';
      let ok;
      try { __month(); save(); ok = flushSave264(); } finally { pack275 = real; }
      const x = __store();
      return { ok, opened: s.saveId === id, mainPacked: x.mainPacked, same: JSON.stringify(__dec(x.main)) === JSON.stringify(s), toast: document.querySelector('.toast')?.textContent || '' };
    }, srcData);
    await A.pg.waitForTimeout(50);
    const vToast = await A.pg.evaluate(() => document.querySelector('.toast')?.textContent || '');
    check(!v.skipped && v.ok && v.opened && !v.mainPacked && v.same, 'сверка не прошла: жизнь записана как раньше, без сжатия, и читается', JSON.stringify(v));
    check(/не прошло проверку/.test(vToast), 'сверка не прошла: игроку сказано', vToast);

  });
  // ---------- 7. Импорт: больше 5 МБ, gzip, «deflate-v1:», жизни строками; откат при нехватке места; удаление ----------
  await section('7. Импорт: больше 5 МБ, gzip, «deflate-v1:», жизни строками; откат при нехватке места; удаление', async () => {
    const big = path.join(TMP, 'big.json');
    fs.writeFileSync(big, JSON.stringify({ format: 'life-side-effects', version: 1, lives: [srcLife, srcLife, srcLife] }, null, 2));
    const gz = path.join(TMP, 'copy.json.gz'); fs.writeFileSync(gz, zlib.gzipSync(fs.readFileSync(SRC)));
    const packed = path.join(TMP, 'life.txt'); fs.writeFileSync(packed, 'deflate-v1:' + zlib.deflateSync(Buffer.from(JSON.stringify(srcLife)), { level: 3 }).toString('base64'));
    const strings = path.join(TMP, 'strings.json'); fs.writeFileSync(strings, JSON.stringify({ format: 'life-side-effects', version: 1, lives: ['deflate-v1:' + zlib.deflateSync(Buffer.from(JSON.stringify(srcLife))).toString('base64'), JSON.stringify(srcLife)] }));
    for (const [label, file, n] of [[`копия на 3 жизни, ${(fs.statSync(big).size / 1048576).toFixed(1)} МБ`, big, 3], ['gzip', gz, 1], ['одна жизнь строкой «deflate-v1:»', packed, 1], ['жизни строками, сжатой и нет', strings, 2]]) {
      if (I) await I.ctx.close();
      I = await openPage(await context(browser));
      await pickFile(I.pg, file);
      const mm = await modal(I.pg);
      const accepted = mm.open && /Восстановить персонажей/.test(mm.title);
      if (accepted) { await clickText(I.pg, /Добавить сохранения/); await I.pg.evaluate(() => { if ($('#modal').open) closeModal(); }); }
      const got = await I.pg.evaluate(() => vaultIndex().ids.map(id => { const x = __store(id); return { packed: x.mainPacked, ok: !!__dec(x.main)?.name }; }));
      const toast = await I.pg.evaluate(() => document.querySelector('.toast')?.textContent || '');
      check(accepted && got.length === n && got.every(x => x.ok), 'импорт: ' + label, accepted ? `добавлено ${got.length}, сжатых ${got.filter(x => x.packed).length}` : toast);
      // Одна жизнь — «она», не «они»; «Добавлено жизней: 1» → «Жизнь добавлена.»
      const wantAsk = n === 1 ? /Она будет добавлена отдельной копией/ : /Они будут добавлены отдельными копиями/, wantToast = n === 1 ? /^Жизнь добавлена\./ : new RegExp('^Добавлено ' + n + ' жизн');
      check(wantAsk.test(mm.text) && wantToast.test(toast), 'импорт: ' + label + ' — текст по числу жизней', mm.text.slice(0, 160) + ' · ' + toast);
      if (!BASE) check(got.every(x => x.packed), 'импорт: ' + label + ' — жизни лежат сжатыми');
    }
    // Повреждённый или чужой файл: игроку — по-русски, без сообщений браузера («Unexpected token…», «JSON»).
    const half = path.join(TMP, 'half.json'); fs.writeFileSync(half, fs.readFileSync(SRC, 'utf8').slice(0, 20000));
    const notes = path.join(TMP, 'notes.txt'); fs.writeFileSync(notes, 'просто заметки');
    for (const [label, file] of [['обрезанный файл', half], ['не копия игры', notes]]) {
      await I.pg.evaluate(() => { if ($('#modal').open) closeModal(); document.querySelectorAll('.toast').forEach(t => t.remove()); });
      await pickFile(I.pg, file);
      const t = await I.pg.evaluate(() => document.querySelector('.toast')?.textContent || '');
      check(/^Не удалось прочитать сохранение: /.test(t) && !/[A-Za-z]/.test(t), 'импорт: ' + label + ' — сказано по-русски, без сообщения браузера', t);
    }
    const usage = await I.pg.evaluate(() => { let n = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += k.length + localStorage.getItem(k).length; } return n; });
    console.log(`     2 жизни в хранилище: ${(usage / 1e6).toFixed(2)} млн знаков (квота Safari — 2,5 млн знаков на сайт, Chromium — 5 млн)`);
    // Места не хватило посреди импорта — уже записанное убрано, список жизней прежний.
    const roll = await I.pg.evaluate(d => {
      const keys0 = Object.keys(localStorage).sort().join(','), ids0 = vaultIndex().ids.length;
      // Хранилище забито, потом освобождено место примерно на одну сжатую жизнь с копией — из трёх.
      const one = localStorage.getItem(__key(vaultIndex().ids[0])).length, sizes = [];
      let n = 0; try { while (n < 1000) { localStorage.setItem('junk275-' + n, 'x'.repeat(30000)); sizes.push(30000); n++; } } catch {}
      try { while (true) { localStorage.setItem('junk275-' + n, 'x'.repeat(500)); sizes.push(500); n++; } } catch {}
      for (let i = n - 1, freed = 0; i >= 0 && freed < one * 2.5; i--) { localStorage.removeItem('junk275-' + i); freed += sizes[i]; }
      let error = ''; try { importLives({ format: 'life-side-effects', version: 1, lives: [d, d, d] }); } catch (e) { error = e.message; }
      for (let i = 0; i < n; i++) localStorage.removeItem('junk275-' + i);
      return { error, same: Object.keys(localStorage).sort().join(',') === keys0, ids: vaultIndex().ids.length - ids0 };
    }, srcLife);
    check(roll.error && roll.same && roll.ids === 0, 'импорт при нехватке места: ничего не записано, сказано почему', roll.error || 'импорт прошёл');
    // Удаление: свои ключи тоже; при заполненном хранилище — без журнала saves17.js, который туда уже не помещается.
    const del = await I.pg.evaluate(() => { const id = vaultIndex().ids[0]; localStorage.setItem('life-plain275-' + id, 'x'); if (typeof plainCopies275 !== 'undefined') plainCopies275.add(id); const ok = deleteLife17(id); const rec = JSON.parse(localStorage.getItem('life-saves275') || '{"lives":{}}'); return { ok, plain: localStorage.getItem('life-plain275-' + id), rec: !!rec.lives[id], main: localStorage.getItem(__key(id)) }; });
    check(del.ok && del.main === null && del.plain === null && !del.rec, 'удаление жизни: удалены и её несжатая копия, и отпечаток', JSON.stringify(del));
    const delFull = await I.pg.evaluate(() => {
      const id = vaultIndex().ids[0];
      let n = 0; try { while (true) { localStorage.setItem('junk275-' + n, 'x'.repeat(n < 150 ? 30000 : 500)); n++; } } catch {}
      const ok = deleteLife17(id);
      const gone = localStorage.getItem(__key(id)) === null && !vaultIndex().ids.includes(id);
      for (let i = 0; i < n; i++) localStorage.removeItem('junk275-' + i);
      if ($('#modal').open) closeModal();
      return { ok, gone, toast: document.querySelector('.toast')?.textContent || '' };
    });
    check(delFull.ok && delFull.gone, 'удаление жизни при заполненном хранилище — проходит (иначе место не освободить)', JSON.stringify(delFull));
    // Лимиты saves.js: validLife и число жизней не отсекают настоящую жизнь.
    check(await I.pg.evaluate(l => validLife(l), srcLife), 'validLife принимает эту жизнь');

  });
  // ---------- 8. Загрузка страницы ----------
  await section('8. Загрузка страницы', async () => {
    L = await openPage(await context(browser));
    await L.pg.evaluate(d => { importLives(d); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); __quiet(); if ($('#modal').open) closeModal(); __flush(); }, srcData);
    const loads = [];
    for (let i = 0; i < 3; i++) { await reload(L); loads.push(await L.pg.evaluate(() => Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd))); await L.pg.waitForTimeout(600); }
    console.log(`     загрузка страницы с этой жизнью (DOMContentLoaded), мс: ${loads.join(', ')}`);

  });
  // ---------- 9. Место в index.html ----------
  await section('9. Место в index.html', async () => {
    if (BASE) return;
    // Ниже save264.js файл работает, но загрузка длинной жизни в несколько раз дольше — об этом говорит консоль.
    const W = await openPage(await context(browser, { place: 'late' }));
    const lateWarned = W.warnings.some(w => LATE_WARNING.test(w));
    await W.ctx.close();
    const earlyWarned = [A, P, O, I, L, E].filter(Boolean).some(x => x.warnings.some(w => LATE_WARNING.test(w)));
    check(lateWarned && (PLACE !== 'early' || !earlyWarned), 'место в index.html: ниже save264.js — предупреждение в консоли, сразу после saves.js — нет', `ниже: ${lateWarned ? 'есть' : 'нет'}, ${PLACE}: ${earlyWarned ? 'есть' : 'нет'}`);
  });
  // ---------- 10. Завершённая жизнь и продолжение за близкого (сборка 274) ----------
  await section('10. Завершённая жизнь и продолжение', async () => {
    E = await openPage(await context(browser));
    const with274 = await E.pg.evaluate(() => typeof continueAs274 === 'function');
    console.log('     ' + (with274 ? 'с continue274.js: настоящее продолжение за дочь' : 'без continue274.js: продолжение — ссылка continued274, как её пишет 274'));
    const html = () => E.pg.evaluate(() => ({ open: document.body.innerHTML.includes('Открыть продолжение'), again: document.body.innerHTML.includes('Продолжить за близкого') }));
    // Жизнь с взрослой дочерью; два месяца; смерть (как в nextYear, без перехода через год).
    const a = await E.pg.evaluate(() => {
      s = null; intro();
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      set('country', 'de'); set('startAge', '18'); set('familyHousehold131', 'both');
      start(); __quiet(); if ($('#modal').open) closeModal(); s.pending = [];
      const kid = person('Ребенок', 24, 'f', 'de'); kid.city18 = residenceCity(); if (typeof childBirthIdentity166 === 'function') childBirthIdentity166(kid, [s]); kid.birthYear = s.year - 24;
      s.people.push(kid); familyState27(); kid.bio27.parents = ['player']; kid.bio27.born = s.clock.ticks - 24 * 12; kid.role = 'Ребенок';
      __flush(); __month(); __flush(); __month(); __flush();
      const t = s.clock.ticks;
      s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); if (typeof estateObserve58 === 'function') estateObserve58(); __flush(); render();
      const back = __dec(localStorage.getItem(__key() + '-backup'));
      return { id: s.saveId, kid: kid.id, kidName: kid.name, name: s.name, t, back: { dead: !!back.dead, t: back.clock.ticks } };
    });
    check(!a.back.dead && a.back.t <= a.t, 'смерть: в резервной копии — версия до смерти', JSON.stringify(a.back) + ' · месяц смерти ' + a.t);
    if (!BASE) {
      const c = await E.pg.evaluate(id => { openLives(); const k = restoreIds275.indexOf(id), has = !!document.querySelectorAll('#modal .life-card21')[k]?.querySelector('.life-restore275'); restoreAsk275(k); const text = document.querySelector('#modal p')?.textContent || ''; closeModal(); return { has, text }; }, a.id);
      check(c.has && c.text.includes(`Сейчас жизнь завершена, а в предыдущей версии ${a.name} ещё жив`), 'завершённая жизнь без продолжения: в подтверждении восстановления сказано, что в предыдущей версии человек ещё жив', c.text.slice(0, 300));
    }
    // Продолжение. Без 274 — заместитель продолжения (копия живой жизни) и ссылка на него; открыт он, как после 274.
    const b = await E.pg.evaluate(({ a, with274 }) => {
      let ok = true;
      if (with274) ok = continueAs274(a.kid);
      else {
        __flush();
        const stand = JSON.parse(JSON.stringify(s)); stand.dead = false; delete stand.ending; stand.name = a.kidName;
        importLives({ format: 'life-side-effects', version: 1, lives: [stand] });
        const cont = vaultIndex().ids[vaultIndex().ids.length - 1];
        s.continued274 = { saveId: cont, lineage: 'life274-' + a.id, name: a.kidName, label: 'Дочь', year: s.year }; __flush();
        loadCharacter(cont); __quiet(); if ($('#modal').open) closeModal();
      }
      __flush();
      const main = localStorage.getItem(__key(a.id)), back = localStorage.getItem(__key(a.id) + '-backup'), life = __dec(back);
      return { ok, cont: s.saveId, same: main === back, link: !!life?.continued274, dead: !!life?.dead };
    }, { a, with274 });
    check(b.ok && b.same && b.link && b.dead, 'продолжение: резервная копия завершённой жизни — та же версия, со ссылкой на продолжение', JSON.stringify(b));
    const g = await E.pg.evaluate(id => {
      openLives();
      const k = typeof restoreIds275 !== 'undefined' ? restoreIds275.indexOf(id) : -1;
      const cards = [...document.querySelectorAll('#modal .life-card21')], card = k >= 0 ? cards[k] : cards.find(c => c.textContent.includes(readLife(id).name));
      const out = { card: !!card, has: !!card?.querySelector('.life-restore275') };
      closeModal();
      if (typeof restoreAsk275 === 'function' && k >= 0) {
        const main = localStorage.getItem(__key(id)), back = localStorage.getItem(__key(id) + '-backup');
        // Резервная копия — версия до смерти без ссылки (так было до исправления; так бывает, если продолжили в другой вкладке).
        const older = __dec(back); older.dead = false; delete older.continued274;
        localStorage.setItem(__key(id) + '-backup', JSON.stringify(older));
        restoreIds275[k] = id; restoreAsk275(k);
        out.title = document.querySelector('#modal h2')?.textContent || ''; out.text = document.querySelector('#modal p')?.textContent || '';
        out.buttons = [...document.querySelectorAll('#modal .options button')].map(b => b.textContent.trim());
        closeModal();
        out.kept = localStorage.getItem(__key(id)) === main;
        localStorage.setItem(__key(id) + '-backup', back);
      }
      return out;
    }, a.id);
    check(g.card && !g.has, '«Персонажи»: у жизни, продолженной за близкого, нет «Восстановить предыдущую версию»', JSON.stringify({ card: g.card, has: g.has }));
    if (!BASE) check(g.title === 'Предыдущую версию не восстановить' && /история продолжена/.test(g.text) && g.buttons.join() === 'К персонажам' && g.kept, 'восстановление продолженной жизни в обход списка — отказ, сохранение не тронуто', g.title + ' · ' + (g.text || '').slice(0, 200));
    // Основная запись продолженной жизни повреждена — открыть из «Персонажей».
    const o = await E.pg.evaluate(id => { localStorage.setItem(__key(id), 'deflate-v1:AAAA'); loadCharacter(id); return { id: s.saveId === id, dead: !!s.dead, link: !!s.continued274 }; }, a.id);
    await E.pg.waitForTimeout(300);
    let h = await html(), mm = await modal(E.pg);
    check(o.id && o.dead && o.link && (!with274 || h.open && !h.again), 'основная запись продолженной жизни повреждена → из «Персонажей» открыта завершённая жизнь со ссылкой' + (with274 ? ', на финале «Открыть продолжение →»' : ''), JSON.stringify({ ...o, ...h }));
    if (!BASE) check(mm.title === 'Открыта резервная копия' && /ничего не потерялось/.test(mm.text), 'об открытой копии сказано, что она совпадает с последним сохранением', mm.title + ' · ' + mm.text.slice(0, 200));
    // То же при запуске: продолженная жизнь активна, основная повреждена, перезагрузка.
    await E.pg.evaluate(id => { if ($('#modal').open) closeModal(); __flush(); localStorage.setItem(__key(id), 'deflate-v1:AAAA'); }, a.id);
    await reload(E); await E.pg.waitForTimeout(500);
    const r = await E.pg.evaluate(id => ({ id: s?.saveId === id, dead: !!s?.dead, link: !!s?.continued274, title: $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '' }), a.id);
    h = await html();
    check(r.id && r.dead && r.link && (!with274 || h.open && !h.again) && !/предыдущая копия/i.test(r.title), 'то же при запуске: завершённая жизнь со ссылкой' + (with274 ? ', «Открыть продолжение →»' : '') + ', окна «Открыта предыдущая копия» нет', JSON.stringify({ ...r, ...h }));
    // Ссылку сняли: продолжение удалено, «Открыть продолжение →» это обнаружил (274) — копия та же версия без ссылки.
    const u = await E.pg.evaluate(({ id, cont, with274 }) => {
      if ($('#modal').open) closeModal(); __quiet(); if ($('#modal').open) closeModal();
      if (s?.saveId !== id) loadCharacter(id);
      if (with274) { deleteLife17(cont); if ($('#modal').open) closeModal(); openContinued274(); if ($('#modal').open) closeModal(); }
      else { delete s.continued274; }
      __flush();
      const main = localStorage.getItem(__key(id)), back = localStorage.getItem(__key(id) + '-backup');
      return { same: main === back, link: !!__dec(main).continued274, dead: !!__dec(back).dead, again: document.body.innerHTML.includes('Продолжить за близкого') };
    }, { id: a.id, cont: b.cont, with274 });
    check(u.same && !u.link && u.dead && (!with274 || u.again), 'ссылку на продолжение сняли — резервная копия та же версия без ссылки' + (with274 ? ', на финале снова «Продолжить за близкого →»' : ''), JSON.stringify(u));
  });
  const errs = [A, P, O, I, L, E].filter(Boolean).flatMap(x => x.errors);
  const unknown = errs.filter(e => !KNOWN_ERRORS.test(e));
  check(!unknown.length, 'ошибок страницы нет (кроме clubs19.js при загрузке длинной жизни — было до 275)', unknown.slice(0, 3).join(' | ') + (errs.length ? ` · известных: ${errs.length - unknown.length}` : ''));
  cleanup();
  console.log(`\nснимки шапки: ${TMP}`);
  console.log(`итого: ${pass} ok, ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { cleanup(); console.error(e); process.exit(2); });
