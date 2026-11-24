// Проверки сборки 270, часть «счета» (bills270.js и точечные правки в 11 старых файлах): ё-проход 268 превратил
// «счета» во множественном числе в «счёта», вместе с текстом испортился ключ долга 'Бытовые счета · '+страна.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify270_bills.js
// BASE=1 — прогон без исправления: 11 старых файлов раздаются из коммита BASE_REV (по умолчанию 56c15c9, до правки),
// bills270.js не подключается. Видно, какие проверки ловят старое поведение.
// BILLS_REV=<коммит> — bills270.js из этого коммита (остальное как есть): проверка слияния против прежней версии
// миграции, например BILLS_REV=97e440e — до исправления удвоенного графика (раздел 5).
// Для проверок сохранений страница перезагружается в порядке сборки: index.html раздаётся с bills270.js перед
// bootstrap61.js (только в памяти, файлы на диске не меняются).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1', BASE_REV = process.env.BASE_REV || '56c15c9';
const FIXED = ['business-events254.js', 'decisions61.js', 'finance32.js', 'finance35.js', 'finance36.js', 'finance39.js', 'finance40.js',
  'housing41.js', 'structure65.js', 'students68.js', 'tuition44.js'];
const OLD = BASE ? Object.fromEntries(FIXED.map(f => [f, execFileSync('git', ['-C', ROOT, 'show', BASE_REV + ':' + f])])) : {};
const BILLS_REV = process.env.BILLS_REV || '';
const BILLS = BILLS_REV ? execFileSync('git', ['-C', ROOT, 'show', BILLS_REV + ':bills270.js']) : null;
const served = f => BASE && OLD[f] ? OLD[f] : BILLS && f === 'bills270.js' ? BILLS : fs.readFileSync(path.join(ROOT, f));
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (ok || !extra ? '' : ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 700))); };

// «счёта» во множественном числе: перед ним прилагательное во мн. ч., «долги и», «оплатить»… (как в bills270.js).
const PLURAL = /(?<![А-Яа-яЁё])((?:[Бб]ытовые|[Сс]тарые|[Тт]екущие|[Нн]овые|[Нн]еоплаченные|[Дд]оговорные|[Зз]акрыть|[Оо]платить|[Рр]азобрать)\s|(?:[Дд]олги|[Кк]редиты|[Аа]ренда)\sи\s|[Бб]юджет,\s|сегодня\.\s)[Сс]чёта(?![А-Яа-яЁё])/g;
// Все 33 восстановленные строки — по файлам (то, что игрок видит после правки).
const RESTORED = {
  'business-events254.js': ['долю совладельца и неоплаченные счета.'],
  'decisions61.js': ['Можно начать закрывать старые счета', 'Старые счета частично погашены', 'Текущие счета продолжают оплачиваться', "'Закрыть старые счета'", 'Новые счета оплачиваются автоматически', 'Разобрать счета и автоплатежи', 'Текущие счета оплачиваются автоматически: ', 'Старые счета погашаются', 'Погасить старые счета с резервом'],
  'finance32.js': ["'Бытовые счета')", "'Бытовые счета · '+s.country", "'Неоплаченные счета'", 'Счета можно оплачивать', 'Платежи и неоплаченные счета</button>', 'Деньги, долги и счета'],
  'finance35.js': ['Новые счета не входят в соглашение.'],
  'finance36.js': ['Существующие кредиты и счета не изменены'],
  'finance39.js': ["livingBill32('basics',utilities,'Бытовые счета · '+s.country)", "recordExpense39('basics','Бытовые счета · '+s.country", 'Жильё и бытовые счета'],
  'finance40.js': ["basics:'Бытовые счета'", "'Питание семьи':'Бытовые счета · '+s.country", 'договорные счета не уменьшаются', 'Аренда и счета всё равно начисляются', 'Старые неоплаченные счета сохранены'],
  'housing41.js': ['Старые счета сохранены.', 'не создают новые счета каждый месяц'],
  'structure65.js': ['Бюджет, счета и кредиты'],
  'students68.js': ['закрыть старые счета', 'Принять помощь и оплатить счета', 'Родители помогли закрыть счета'],
  'tuition44.js': ['новые счета и штрафы не начисляются'],
};
// Родительный единственного остаётся с ё.
const SINGULAR = { 'finance32.js': ['Часть обязательного счёта не оплачена'], 'finance40.js': ['выбранного счёта'], 'business-events254.js': ['Расход со счёта', 'Остаток счёта'], 'finance35.js': ['карточке счёта', 'График счёта'], 'tuition44.js': ['при закрытии счёта'] };

async function page(browser) {
  const ctx = await browser.newContext(), state = { prod: false };
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' || (BASE && rel === 'bills270.js') ? '' : served(rel);
    if (rel === 'index.html' && state.prod && !BASE) body = prodIndex(String(body));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  for (const [k, v] of Object.entries({ startAge: '18', country: 'nl' }))
    await pg.evaluate(([k, v]) => { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  if (!BASE && !(await pg.evaluate(() => [...document.scripts].some(x => x.src.includes('bills270.js'))))) await pg.addScriptTag({ content: String(served('bills270.js')) });
  await pg.evaluate(helpers);
  return { pg, errors, ctx, state };
}
// index.html, как его соберёт ведущий: bills270.js перед bootstrap61.js, если его там ещё нет.
function prodIndex(html) {
  if (html.includes('src="bills270.js')) return html;
  if (!html.includes('<script src="bootstrap61.js')) throw new Error('index.html: нет bootstrap61.js');
  return html.replace('<script src="bootstrap61.js', '<script src="bills270.js?v=270"></script><script src="bootstrap61.js');
}
// Перезагрузка в порядке сборки: game.js берёт сохранение из хранилища, как у игрока, открывшего игру.
async function reload(pg, state) {
  state.prod = true;
  await pg.reload();
  await pg.waitForFunction("typeof start==='function'&&typeof s!=='undefined'&&document.readyState==='complete'");
  await pg.evaluate(helpers);
  return pg.evaluate(() => [...document.scripts].map(x => x.src.split('/').pop().split('?')[0]).filter(x => /^(bills270|texts270|names270|bootstrap61)\.js$/.test(x)));
}

function helpers() {
  window.B = {
    calm() { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; },
    modal() { const m = $('#modal'); return { open: m.open, title: m.querySelector('h2')?.textContent || '', all: m.textContent.replace(/\s+/g, ' '), buttons: [...m.querySelectorAll('.options button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }; },
    // Окно, которое открывает fn: заголовок, весь текст (с разделами nextDetail20) и кнопки.
    open(fn) { B.calm(); fn(); const m = B.modal(); B.calm(); return m; },
    // Текст, который окно получает в show(): при разделах nextDetail20 окно рисует разделы, а не текст.
    text(fn) { B.calm(); const keep = show; let seen = null; show = function (t, x, ...rest) { seen = x; return keep(t, x, ...rest); }; try { fn(); } finally { show = keep; } B.calm(); return seen; },
    plural: t => /(?<![А-Яа-яЁё])(?:[Бб]ытовые|[Сс]тарые|[Тт]екущие|[Нн]овые|[Нн]еоплаченные|[Дд]оговорные|[Зз]акрыть|[Оо]платить|[Рр]азобрать|долги и|кредиты и|Аренда и|Бюджет,) счёта/.test(t),
    bills: () => s.debts.filter(d => d.type === 'bill32' && /^Бытовые сч[её]та · /.test(d.creditor32 || '')).map(d => ({ id: d.id, creditor: d.creditor32, country: d.country, balance: Math.round(d.balance * 100) / 100, principal: Math.round(d.principal * 100) / 100, paid: d.paid, missed: d.missed, started: d.started, due: d.due, status: d.status32, history: (d.history32 || []).length, plan: d.repayment35?.status || null })),
    // Месяц, в котором бытовые счета не оплачены: денег нет.
    month() { B.calm(); s.cash = 0; if (s.job) s.job.salary = 0; advanceMonth(); B.calm(); return s.clock.ticks; },
  };
}

(async () => {
  const browser = await chromium.launch();
  console.log(BASE ? `BASE=1: старые файлы из ${BASE_REV}, без bills270.js` : BILLS_REV ? `bills270.js из ${BILLS_REV}` : 'с исправлением');

  // 0. Исходники: 33 строки «счета», ни одного «счёта» во множественном числе; родительный единственного с ё.
  {
    const left = FIXED.flatMap(f => (String(served(f)).match(PLURAL) || []).map(m => f + ': ' + m));
    const missing = Object.entries(RESTORED).flatMap(([f, list]) => list.filter(t => !String(served(f)).includes(t)).map(t => f + ': ' + t));
    const singular = Object.entries(SINGULAR).flatMap(([f, list]) => list.filter(t => !String(served(f)).includes(t)).map(t => f + ': ' + t));
    check(left.length === 0, `исходники: «счёта» во множественном числе — ${left.length} (было 33 в 11 файлах)`, left);
    check(missing.length === 0, `исходники: все ${Object.values(RESTORED).flat().length} восстановленных строк на месте`, missing);
    check(singular.length === 0, 'исходники: родительный единственного («обязательного счёта», «со счёта», «выбранного счёта») остался с ё', singular);
    // tools/yo_fix.py не вернёт «счёта»: «счёта» в омографах аудита и yo_fix.
    let yo = '';
    try { yo = execFileSync('python3', [path.join(ROOT, 'tools/yo_fix.py')], { cwd: ROOT }).toString().trim(); } catch (e) { yo = String(e); }
    check(/^Будет заменено 0 /.test(yo), 'tools/yo_fix.py: замен нет — восстановленные «счета» он не тронет', yo);
  }

  const { pg, errors, ctx, state } = await page(browser);

  // 1. Настоящие окна и записи: переезд в аренду, два месяца без денег — долги за аренду и бытовые счета.
  const a = await pg.evaluate(() => {
    const out = {};
    B.calm(); s.cash = 1e5;
    moveHome('rent', residenceCity(), s.housing.area || 'center'); B.calm();
    out.move = s.log.find(e => e.title === 'Новый адрес')?.text || '';
    B.month(); B.month();
    out.billLog = s.log.filter(e => e.title === 'Часть обязательного счёта не оплачена').map(e => e.text);
    out.bills = B.bills();
    out.finance = B.open(financeMenu);
    out.financeText = B.text(financeMenu);
    out.catalog = actionCatalog24().find(x => x.id === 'finance32')?.label;
    out.hub = B.open(financeHub65);
    out.expenses = B.open(expenseReport39);
    out.payments = B.open(paymentMenu40);
    out.frugal = B.open(() => { paymentMenu40(); [...document.querySelectorAll('#modal .options button')].find(b => /Экономить максимально/.test(b.textContent))?.click(); });
    out.limits = B.open(manualLimitsMenu40);
    // Старый минус до 0.36: отчёт о сверке.
    const f36 = finance36(), keep36 = f36.deficit;
    f36.deficit = { id: 'legacy-cash:bills270', originalCash: -100, unallocated: 100, country: 'nl', tick: 0, month: 0, year: s.year, status: 'needs-reconciliation', verifiedDebtSnapshot: [] };
    out.legacy = B.open(legacyReport36); f36.deficit = keep36;
    // Молодой взрослый: родители помогают закрыть старые счета.
    out.young = B.open(livingMenu68);
    out.rescue = B.open(rescueBillsMenu68);
    // Договорённость с кредитором по бытовым счетам.
    const d = s.debts.find(d => d.type === 'bill32' && d.billKind32 === 'basics' && d.balance > .01);
    if (d) {
      const t = s.clock.ticks;
      d.negotiation35 = { id: 'terms-bills270', kind: 'installments', created: t, retryAt: t + 6, expires: t + 2, chance: 1, roll: 0, status: 'offered', monthly: d.balance / 12, covered: d.balance };
      B.calm(); acceptBillTerms35(d.id, 'terms-bills270'); B.calm();
      out.terms = s.log.find(e => e.title === 'График оплаты принят')?.text || '';
      stopBillPlan35(d.id);
    }
    // Свободные деньги: решение закрыть старые счета, окно, частичное погашение.
    B.calm(); s.cash = 1e5; life61().nextBills = 0; life61().notices.forEach(q => { if (q.type === 'bills') q.status = 'later'; });
    const q = checkBills61();
    out.notice = q?.title || '';
    out.decisions = decisionItems24().map(x => x.title);
    out.repay = q ? B.open(() => repayMenu61(q.id)) : null;
    if (q) { B.calm(); payOldBills61(q.id); B.calm(); }
    out.paid = s.log.find(e => e.title === 'Старые счета частично погашены' || e.title === 'Старые счёта частично погашены') || null;
    out.rescueOk = (() => { B.calm(); s.cash = 0; B.month(); s.cash = 0; for (const p of parents17()) p.privateCash = Math.max(p.privateCash || 0, 1e6); const ok = rescueBills68(); B.calm(); return ok ? s.log.find(e => /Родители помогли/.test(e.title))?.title || 'нет записи' : null; })();
    // Своё дело с совладельцем: причина, по которой продажа недоступна (подсказка под выбором в событии дела).
    try {
      const b = { id: 'biz-bills270', status: 'active', country: s.country, city: residenceCity(), specialty: 'bills270', title: 'Дело', cash: 1e9, partner158: { id: 'partner-bills270' } };
      out.sale = businessWhy254(b, { business: b.id, country: b.country, city: b.city, specialty: b.specialty, status: 'offered', expires: s.clock.ticks + 3 }, { op: 'sale', cost: 0 });
    } catch (e) { out.sale = 'ошибка: ' + e; }
    // Студент программы из каталога: окно оплаты учебного периода.
    try {
      const prog = programs16.find(p => p.country === s.country && p.city === residenceCity()) || programs16.find(p => p.country === s.country), keep = path16().study;
      path16().study = { id: 'study-bills270', program: prog.id, payer: 'self', application: null, status: 'active' };
      out.tuition = B.open(tuitionMenu44); path16().study = keep;
    } catch (e) { out.tuition = { title: 'ошибка', all: String(e) }; }
    // Аренда из объявлений: «Старые счета сохранены.», потом окно ремонта.
    try {
      B.calm(); s.cash = 1e7;
      const list = ['flat', 'room', 'house'].flatMap(k => market41('rent', k)?.listings || []).filter(x => validListing41(x, 'rent'));
      out.rentOk = list.length ? rentHouse41(list[0]) : 'нет объявлений';
      B.calm();
      out.rent = s.log.find(e => /Старые сч[её]та сохранены/.test(e.text))?.text || '';
      out.repair = housingListing41() ? B.open(() => repairMenu41('home')) : null;
    } catch (e) { out.rentError = String(e); }
    return out;
  });
  check(/Старые неоплаченные счета сохранены/.test(a.move) && !B_plural(a.move), 'переезд: «Старые неоплаченные счета сохранены»', a.move);
  check(a.billLog.length > 0 && a.billLog.some(t => /^Бытовые счета: оплачено/.test(t)) && !a.billLog.some(B_plural), 'месяц без денег: запись «Бытовые счета: оплачено …»', a.billLog);
  check(a.bills.length === 1 && a.bills[0].creditor === 'Бытовые счета · nl', 'месяц без денег: долг кредитору «Бытовые счета · nl»', a.bills);
  const fin = a.finance.all;
  check(['Неоплаченные счета', 'Счета можно оплачивать', 'Погасить старые счета с резервом', 'Бытовые счета · nl'].every(t => fin.includes(t)) && !B_plural(fin),
    'финансы (financeMenu): «Неоплаченные счета», «Счета можно оплачивать», кнопка «Погасить старые счета…», кредитор «Бытовые счета · nl»', fin);
  check(/^Текущие счета оплачиваются автоматически: .+ Старые счета погашаются по вашему решению/.test(a.financeText || ''), 'финансы: текст окна «Текущие счета… Старые счета погашаются…» (в show; при разделах окно его не рисует)', a.financeText);
  check(a.catalog === 'Деньги, долги и счета', 'каталог действий: «Деньги, долги и счета»', a.catalog);
  check(a.hub.buttons.includes('Бюджет, счета и кредиты'), 'деньги и имущество: «Бюджет, счета и кредиты»', a.hub.buttons);
  check(a.expenses.all.includes('Жильё и бытовые счета') && !B_plural(a.expenses.all), 'фактические расходы: «Жильё и бытовые счета»', a.expenses.all);
  check(a.payments.all.includes('Бытовые счета') && !B_plural(a.payments.all), 'автоплатежи: строка «Бытовые счета»', a.payments.all);
  check(a.frugal.title === 'Изменить приоритет?' && a.frugal.all.includes('договорные счета не уменьшаются'), 'автоплатежи → «Экономить максимально»: «договорные счета не уменьшаются»', a.frugal);
  check(a.limits.all.includes('Аренда и счета всё равно начисляются') && !B_plural(a.limits.all), 'ручные лимиты: «Аренда и счета всё равно начисляются»', a.limits.all);
  check(a.legacy.all.includes('Существующие кредиты и счета не изменены'), 'сверка старого минуса: «Существующие кредиты и счета не изменены»', a.legacy.all);
  check(a.young.buttons.some(b => b.includes('Попросить помочь закрыть старые счета')), 'молодой взрослый: «Попросить помочь закрыть старые счета»', a.young.buttons);
  check(a.rescue.buttons.includes('Принять помощь и оплатить счета'), 'помощь родителей: «Принять помощь и оплатить счета»', a.rescue.buttons);
  check(/Новые счета не входят в соглашение\./.test(a.terms) && /^Бытовые счета · nl: /.test(a.terms), 'график с кредитором: «Бытовые счета · nl: … Новые счета не входят в соглашение.»', a.terms);
  check(a.notice === 'Можно начать закрывать старые счета' && a.decisions.includes(a.notice), 'решение: «Можно начать закрывать старые счета»', [a.notice, a.decisions]);
  check(a.repay?.title === 'Закрыть старые счета' && a.repay.all.includes('Новые счета оплачиваются автоматически') && a.repay.buttons.includes('Разобрать счета и автоплатежи'), 'окно «Закрыть старые счета»: «Новые счета оплачиваются…», «Разобрать счета и автоплатежи»', a.repay);
  check(a.paid?.title === 'Старые счета частично погашены' && /Текущие счета продолжают оплачиваться/.test(a.paid.text), 'погашение: «Старые счета частично погашены. Текущие счета продолжают…»', a.paid);
  check(a.rescueOk === null ? String(served('students68.js')).includes("log('Родители помогли закрыть счета'") : a.rescueOk === 'Родители помогли закрыть счета',
    'помощь родителей: запись «Родители помогли закрыть счета»' + (a.rescueOk === null ? ' (родителям нечем помочь — проверен исходник)' : ''), a.rescueOk);
  check(a.sale === 'Для продажи нужно урегулировать долю совладельца и неоплаченные счета.', 'своё дело: «…долю совладельца и неоплаченные счета.»', a.sale);
  check(a.tuition?.title === 'Счёт учебного периода' && a.tuition.all.includes('новые счета и штрафы не начисляются'), 'оплата учебного периода: «новые счета и штрафы не начисляются»', a.tuition);
  check(a.rentOk === true && /Старые счета сохранены\./.test(a.rent), 'аренда из объявлений: «Старые счета сохранены.»', [a.rentOk, a.rent, a.rentError]);
  check(a.repair && a.repair.all.includes('не создают новые счета каждый месяц'), 'ремонт съёмного жилья: «…не создают новые счета каждый месяц»', a.repair);

  // 2. Сохранение до 268, прожившее 268–269: два долга одному кредитору — «счета» и «счёта».
  const planted = await pg.evaluate(() => {
    B.calm();
    const t = s.clock.ticks, c = s.country, yo = 'Бытовые счёта · ' + c, ok = 'Бытовые счета · ' + c;
    s.debts = s.debts.filter(d => !(d.type === 'bill32' && d.billKind32 === 'basics'));
    const old = { id: 'bill32-901', type: 'bill32', billKind32: 'basics', creditor32: ok, country: c, balance: 100, principal: 120, rate: 0, payment: 0, paid: 20, missed: 2, started: t - 30, due: t - 30, history32: [{ tick: t - 30, due: 120, paid: 0, added: 120 }, { tick: t - 20, paid: 20, country: c }], status32: 'overdue' };
    const yod = { id: 'bill32-902', type: 'bill32', billKind32: 'basics', creditor32: yo, country: c, balance: 50, principal: 50, rate: 0, payment: 0, paid: 0, missed: 3, started: t - 10, due: t - 10, history32: [{ tick: t - 10, due: 50, paid: 0, added: 50 }], status32: 'overdue', creditorPerson40: undefined };
    delete yod.creditorPerson40;
    s.debts.push(old, yod);
    // Квитанции 268–269 с ключом на «счёта» (вместо настоящих за прошлый месяц), строки месячного расчёта,
    // заявка близкому, запись журнала и решение.
    finance32().receipts = finance32().receipts.filter(r => !(r.kind === 'basics' && r.tick === t - 1));
    finance39().receipts = finance39().receipts.filter(r => !(r.kind === 'basics' && r.tick === t - 1));
    finance32().receipts.push({ key: 'basics:' + yo + ':' + (t - 1), tick: t - 1, kind: 'basics', creditor: yo, due: 50, paid: 0, unpaid: 50, country: c });
    finance39().receipts.push({ key: c + ':basics:' + yo + ':' + (t - 1), kind: 'basics', creditor: yo, tick: t - 1, country: c, due: 50, paid: 0 });
    const p = finance40().period = { tick: t, country: c, strategy: finance40().strategy, rows: [] };
    p.rows.push({ id: 'basics', kind: 'basics', label: 'Бытовые счёта', due: 50, paid: 0, receipt39: c + ':basics:' + yo + ':' + (t - 1), receipt32: 'basics:' + yo + ':' + (t - 1), debt: 'bill32-902' });
    p.rows.push({ id: 'debt:bill32-901', kind: 'debts', label: ok, due: 10, paid: 0, debt: 'bill32-901' });
    p.rows.push({ id: 'debt:bill32-902', kind: 'debts', label: yo, due: 5, paid: 0, debt: 'bill32-902' });
    housingState42().offers.push({ id: 'aid42-bills270', personId: 'x', kind: 'gift', target: { debtId: 'bill32-902', rowId: 'debt:bill32-902' }, amount: 0, country: c, status: 'declined', created: t, expires: t });
    s.log.unshift({ age: s.age, year: s.year, title: 'Часть обязательного счёта не оплачена', text: 'Бытовые счёта: оплачено 0 € из 50 €. Остаток сохранён отдельным счётом; деньги ниже доступного остатка не списаны.', tag: 'Финансы', major: true });
    life61().notices.push({ id: 'life61-bills270', type: 'bills', title: 'Можно начать закрывать старые счёта', note: 'Появились свободные деньги.', status: 'later', created: t, expires: null });
    save(); flushSave264();
    return { id: s.saveId, tick: t, before: B.bills() };
  });
  const order = await reload(pg, state);
  console.log('после перезагрузки: ' + order.join(' → '));
  const b = await pg.evaluate(id => {
    const out = { same: s?.saveId === id.id };
    B.calm();
    const t = id.tick, c = s.country, p = finance40().period;
    out.bills = B.bills();
    out.receipts32 = finance32().receipts.filter(r => r.tick === t - 1 && r.kind === 'basics').map(r => [r.key, r.creditor]);
    out.receipts39 = finance39().receipts.filter(r => r.tick === t - 1 && r.kind === 'basics').map(r => [r.key, r.creditor]);
    out.rows = (p?.rows || []).map(r => ({ id: r.id, label: r.label, debt: r.debt, due: r.due, receipt32: r.receipt32, receipt39: r.receipt39 }));
    out.linked = out.rows.filter(r => r.receipt32).every(r => finance32().receipts.some(q => q.key === r.receipt32)) && out.rows.filter(r => r.receipt39).every(r => finance39().receipts.some(q => q.key === r.receipt39));
    out.offer = housingState42().offers.find(q => q.id === 'aid42-bills270')?.target;
    out.log = s.log.find(e => e.title === 'Часть обязательного счёта не оплачена')?.text;
    out.notice = life61().notices.find(q => q.id === 'life61-bills270')?.title;
    flushSave264(); const st = readLife(id.id);
    out.stored = (st?.debts || []).filter(d => d.type === 'bill32' && d.billKind32 === 'basics').map(d => [d.id, d.creditor32, d.balance]);
    out.yoLeft = JSON.stringify(s).includes('Бытовые счёта');
    // Повторный запуск ничего не меняет.
    const before = JSON.stringify(s);
    out.again = typeof billsMigrate270 === 'function' ? billsMigrate270() : 'нет billsMigrate270';
    out.sameAfter = JSON.stringify(s) === before;
    // Следующий месяц без денег: неоплаченное добавляется к тому же долгу.
    const tick = B.month();
    out.after = B.bills();
    out.newReceipt = finance32().receipts.filter(r => r.tick === tick && r.kind === 'basics').map(r => r.key);
    out.row = finance40().period?.rows.find(r => r.id === 'basics');
    return out;
  }, planted);
  const one = b.bills[0];
  check(b.same && b.bills.length === 1 && one.id === 'bill32-901' && one.creditor === 'Бытовые счета · nl', 'старое сохранение, открытие страницы: два долга «счета»/«счёта» слиты в один «Бытовые счета · nl»', b.bills);
  check(one && one.balance === 150 && one.principal === 170 && one.paid === 20 && one.missed === 3 && one.started === planted.tick - 30 && one.due === planted.tick - 30 && one.status === 'overdue' && one.history === 3,
    'слияние: сумма 100+50, начало и срок — самые ранние, пропусков — больше из двух (3), история обоих', one);
  check(b.receipts32.length === 1 && b.receipts32[0][0] === 'basics:Бытовые счета · nl:' + (planted.tick - 1) && b.receipts32[0][1] === 'Бытовые счета · nl'
    && b.receipts39.length === 1 && b.receipts39[0][0] === 'nl:basics:Бытовые счета · nl:' + (planted.tick - 1) && b.receipts39[0][1] === 'Бытовые счета · nl', 'квитанции finance32/finance39: ключ и кредитор на «счета»', [b.receipts32, b.receipts39]);
  check(b.linked && b.rows.find(r => r.id === 'basics')?.label === 'Бытовые счета' && b.rows.find(r => r.id === 'basics')?.debt === 'bill32-901', 'месячный расчёт: строка «Бытовые счета», ссылки на квитанции целы, долг — оставшийся', b.rows);
  const dr = b.rows.filter(r => r.kind === 'debts' || /^debt:/.test(r.id));
  check(dr.length === 1 && dr[0].id === 'debt:bill32-901' && dr[0].due === 15 && dr[0].label === 'Бытовые счета · nl', 'месячный расчёт: две строки платежа по долгу стали одной (10+5)', b.rows);
  check(b.offer?.debtId === 'bill32-901' && b.offer?.rowId === 'debt:bill32-901', 'заявка близкому: ссылка на слитый долг переведена на оставшийся', b.offer);
  check(/^Бытовые счета: оплачено/.test(b.log || '') && b.notice === 'Можно начать закрывать старые счета' && !b.yoLeft, 'журнал и решения: «Бытовые счета», «закрывать старые счета»; «Бытовые счёта» в сохранении не осталось', [b.log, b.notice, b.yoLeft]);
  check(b.stored.length === 1 && b.stored[0][1] === 'Бытовые счета · nl' && b.stored[0][2] === 150, 'исправленное сохранение записано обратно', b.stored);
  check(b.again === 0 && b.sameAfter, 'повторная миграция ничего не меняет', [b.again, b.sameAfter]);
  check(b.after.length === 1 && b.after[0].id === 'bill32-901' && b.after[0].balance > 150 && b.after[0].missed === 4 && b.newReceipt.length === 1 && b.newReceipt[0].startsWith('basics:Бытовые счета · nl:') && b.row?.debt === 'bill32-901',
    'следующий месяц без денег: неоплаченное прибавилось к тому же долгу, второй не открылся', [b.after, b.newReceipt, b.row?.debt]);

  // 3. Сохранение 268–269: только ключ «счёта». «Персонажи» → выбор персонажа (loadCharacter).
  const c = await pg.evaluate(() => {
    const out = {};
    B.calm();
    const t = s.clock.ticks, c = s.country, yo = 'Бытовые счёта · ' + c;
    s.debts = s.debts.filter(d => !(d.type === 'bill32' && d.billKind32 === 'basics'));
    finance32().receipts = finance32().receipts.filter(r => !(r.kind === 'basics' && r.tick === t - 1));
    s.debts.push({ id: 'bill32-903', type: 'bill32', billKind32: 'basics', creditor32: yo, country: c, balance: 40, principal: 40, rate: 0, payment: 0, paid: 0, missed: 1, started: t - 2, due: t - 2, history32: [{ tick: t - 2, due: 40, paid: 0, added: 40 }], status32: 'overdue' });
    finance32().receipts.push({ key: 'basics:' + yo + ':' + (t - 1), tick: t - 1, kind: 'basics', creditor: yo, due: 40, paid: 0, unpaid: 40, country: c });
    save(); flushSave264();
    const id = s.saveId; s.saveId = 'bills270-other'; loadCharacter(id); B.calm();
    out.same = s.saveId === id;
    out.bills = B.bills();
    out.receipt = finance32().receipts.filter(r => r.tick === t - 1 && r.kind === 'basics').map(r => r.key);
    out.t = t;
    out.again = typeof billsMigrate270 === 'function' ? billsMigrate270() : 'нет billsMigrate270';
    out.tick = B.month(); B.month();
    out.after = B.bills();
    out.menu = B.open(() => billMenu32('bill32-903')).all;
    return out;
  });
  check(c.same && c.bills.length === 1 && c.bills[0].id === 'bill32-903' && c.bills[0].creditor === 'Бытовые счета · nl' && c.bills[0].balance === 40, 'сохранение 268–269, «Персонажи»: ключ «Бытовые счёта · nl» стал «Бытовые счета · nl», долг тот же', c.bills);
  check(c.receipt.length === 1 && c.receipt[0] === 'basics:Бытовые счета · nl:' + (c.t - 1) && c.again === 0, 'сохранение 268–269: ключ квитанции на «счета», повтор ничего не меняет', [c.receipt, c.again]);
  check(c.after.length === 1 && c.after[0].id === 'bill32-903' && c.after[0].balance > 40 && c.after[0].missed === 3, 'сохранение 268–269: два месяца без денег — долг тот же, растёт, пропуски считаются', c.after);
  check(c.menu.includes('Бытовые счета · nl') && !c.menu.includes('счёта ·'), 'карточка долга: кредитор «Бытовые счета · nl»', c.menu);

  // 4. Два долга, у обоих действующий график с кредитором: график один, платёж и покрытый остаток — сумма.
  const d = await pg.evaluate(() => {
    const out = {};
    B.calm();
    const t = s.clock.ticks, c = s.country;
    s.debts = s.debts.filter(d => !(d.type === 'bill32' && d.billKind32 === 'basics'));
    const plan = (id, remaining, monthly, next) => ({ id, status: 'active', remaining, monthly, next, expectedEnd: next + 11, missed: 0, history: [] });
    s.debts.push({ id: 'bill32-911', type: 'bill32', billKind32: 'basics', creditor32: 'Бытовые счета · ' + c, country: c, balance: 60, principal: 60, rate: 0, payment: 0, paid: 0, missed: 1, started: t - 8, due: t - 8, history32: [], status32: 'scheduled', repayment35: plan('plan-a', 60, 5, t + 1) });
    s.debts.push({ id: 'bill32-912', type: 'bill32', billKind32: 'basics', creditor32: 'Бытовые счёта · ' + c, country: c, balance: 40, principal: 40, rate: 0, payment: 0, paid: 0, missed: 2, started: t - 4, due: t - 4, history32: [], status32: 'scheduled', repayment35: plan('plan-b', 40, 4, t + 2) });
    out.n = typeof billsMigrate270 === 'function' ? billsMigrate270() : 'нет billsMigrate270';
    const m = s.debts.filter(d => d.type === 'bill32' && d.billKind32 === 'basics');
    out.merged = m.map(d => ({ id: d.id, balance: d.balance, status: d.status32, plan: d.repayment35 && { id: d.repayment35.id, status: d.repayment35.status, remaining: d.repayment35.remaining, monthly: d.repayment35.monthly, next: d.repayment35.next }, previous: (d.previousPlans35 || []).map(p => p.id + ':' + p.status) }));
    out.t = t;
    // Месяц с деньгами: бытовые счета оплачены, по графику списан общий платёж.
    B.calm(); s.cash = 1e6; advanceMonth(); B.calm();
    const k = s.debts.find(d => d.id === 'bill32-911');
    out.after = k && { balance: Math.round(k.balance * 100) / 100, remaining: Math.round(k.repayment35.remaining * 100) / 100, status: k.status32, count: s.debts.filter(d => d.type === 'bill32' && d.billKind32 === 'basics').length };
    return out;
  });
  const dm = d.merged[0];
  check(d.merged.length === 1 && dm.id === 'bill32-911' && dm.balance === 100 && dm.status === 'scheduled' && dm.plan?.id === 'plan-a' && dm.plan.status === 'active' && dm.plan.remaining === 100 && dm.plan.monthly === 9 && dm.plan.next === d.t + 1 && dm.previous.includes('plan-b:merged270'),
    'два графика: один долг 100, график 60+40 по 5+4 в месяц, второй график — в прежних', d.merged);
  check(d.after && d.after.count === 1 && d.after.balance === 91 && d.after.remaining === 91 && d.after.status === 'scheduled', 'два графика: месяц с деньгами — списан общий платёж 9, долг и график 91', d.after);

  // 5. График был только у нового долга «счёта» (у старого «счета» графика нет — две карточки, график приняли по одной).
  // После слияния график тот же: покрывает свою часть, платёж прежний, история и прежние договорённости по разу.
  const e = await pg.evaluate(() => {
    const out = {};
    B.calm();
    const t = s.clock.ticks, c = s.country, basics = () => s.debts.filter(d => d.type === 'bill32' && d.billKind32 === 'basics');
    const plant = keepHistory => {
      s.debts = s.debts.filter(d => !(d.type === 'bill32' && d.billKind32 === 'basics'));
      const old = { id: 'bill32-921', type: 'bill32', billKind32: 'basics', creditor32: 'Бытовые счета · ' + c, country: c, balance: 100, principal: 100, rate: 0, payment: 0, paid: 0, missed: 2, started: t - 12, due: t - 12, history32: [{ tick: t - 12, due: 100, paid: 0, added: 100 }], status32: 'overdue' };
      if (!keepHistory) delete old.history32;
      const q = { id: 'plan-y', kind: 'installments', created: t - 4, retryAt: t + 2, expires: t - 2, chance: 1, roll: 0, status: 'accepted', decided: t - 3, monthly: 10, covered: 60 };
      s.debts.push(old, { id: 'bill32-922', type: 'bill32', billKind32: 'basics', creditor32: 'Бытовые счёта · ' + c, country: c, balance: 40, principal: 60, rate: 0, payment: 0, paid: 20, missed: 1, started: t - 5, due: t - 5,
        history32: [{ tick: t - 5, due: 60, paid: 0, added: 60 }, { tick: t - 4, due: 0, paid: 0 }], status32: 'scheduled',
        negotiation35: q, negotiations35: [q], previousPlans35: [{ id: 'plan-x', status: 'cancelled', remaining: 30, monthly: 3, next: t - 20, expectedEnd: t - 9, missed: 0, history: [] }],
        repayment35: { id: 'plan-y', status: 'active', remaining: 40, monthly: 10, next: t + 1, expectedEnd: t + 4, missed: 0, history: [{ key: 'plan-y:' + (t - 2), tick: t - 2, due: 10, paid: 10, country: c }, { key: 'plan-y:' + (t - 1), tick: t - 1, due: 10, paid: 10, country: c }] } });
      s.debts = JSON.parse(JSON.stringify(s.debts)); // как после загрузки сохранения
    };
    const view = () => basics().map(d => ({ id: d.id, balance: Math.round(d.balance * 100) / 100, status: d.status32, history: (d.history32 || []).length,
      plan: d.repayment35 && { id: d.repayment35.id, status: d.repayment35.status, remaining: Math.round(d.repayment35.remaining * 100) / 100, monthly: d.repayment35.monthly, history: d.repayment35.history.length },
      previous: (d.previousPlans35 || []).map(p => p.id + ':' + p.status), asked: (d.negotiations35 || []).map(q => q.id), talk: d.negotiation35?.id || null,
      due: typeof billDue35 === 'function' ? Math.round(billDue35(d) * 100) / 100 : null }));
    plant(true);
    out.n = typeof billsMigrate270 === 'function' ? billsMigrate270() : 'нет billsMigrate270';
    out.merged = view();
    // Месяц с деньгами: текущие счета оплачены, по графику списан прежний платёж 10, старая часть ждёт решения игрока.
    B.calm(); s.cash = 1e6; advanceMonth(); B.calm();
    out.after = view();
    // У старого долга нет даже истории: история нового долга тоже по разу.
    plant(false);
    out.n2 = typeof billsMigrate270 === 'function' ? billsMigrate270() : 'нет billsMigrate270';
    out.bare = view();
    return out;
  });
  const em = e.merged[0];
  check(e.merged.length === 1 && em.id === 'bill32-921' && em.balance === 140 && em.status === 'overdue' && em.history === 3,
    'график только у долга «счёта»: один долг 100+40, просрочен (старая часть вне графика), история обоих', e.merged);
  check(em?.plan?.id === 'plan-y' && em.plan.status === 'active' && em.plan.remaining === 40 && em.plan.monthly === 10 && em.plan.history === 2,
    'график только у долга «счёта»: график прежний — покрывает 40, платёж 10, два платежа в истории (не удвоен)', em?.plan);
  check(em && em.previous.join() === 'plan-x:cancelled' && em.asked.join() === 'plan-y' && em.talk === 'plan-y' && em.due === 110,
    'график только у долга «счёта»: прежняя договорённость и переговоры по разу; к оплате 100 вне графика + 10 по графику', em);
  const ea = e.after[0];
  check(e.after.length === 1 && ea.balance === 130 && ea.plan?.remaining === 30 && ea.plan.monthly === 10 && ea.plan.history === 3,
    'график только у долга «счёта»: месяц с деньгами — по графику списано 10 (не 20), долг 130, график 30', e.after);
  const eb = e.bare[0];
  check(e.bare.length === 1 && eb.balance === 140 && eb.history === 2 && eb.plan?.remaining === 40 && eb.plan.monthly === 10 && eb.plan.history === 2 && eb.previous.join() === 'plan-x:cancelled',
    'старый долг без истории и графика: история, график и прежние договорённости нового долга — по разу', e.bare);

  // 6. Ошибки страницы.
  check(!errors.length, 'без ошибок страницы', errors);
  await ctx.close();
  await browser.close();
  console.log(`\n${pass} ok, ${fail} FAIL${BASE ? ' (BASE=1)' : ''}`);
  process.exit(fail ? 1 : 0);
})();
function B_plural(t) { return /(?<![А-Яа-яЁё])(?:[Бб]ытовые|[Сс]тарые|[Тт]екущие|[Нн]овые|[Нн]еоплаченные|[Дд]оговорные|[Зз]акрыть|[Оо]платить|[Рр]азобрать|долги и|кредиты и|Аренда и|Бюджет,) счёта/.test(String(t)); }
