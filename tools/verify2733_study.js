// Проверки сборки 273.3 (study2733.js): учёба на окнах-карточках.
// «Моя учёба» (студент, школьник, без программы), предложение вуза с оплатой и началом учёбы в одном окне, «Языки»,
// стипендия в окне программы и в карточке заявки, просьбы к родителям и к компании.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2733_study.js
// BASE=1 — прогон без study2733.js (windows273.js остаётся): видно, какие проверки ловят старое поведение.
// SAVE=файл — ещё и на настоящем сохранении (экспорт «Ваши персонажи»; берётся последний персонаж).
// SHOTS=папка — снимки «до» (без study2733.js) и «после» на этом сохранении, 390 и 1280.
// Что проверяется:
// • главные кнопки каждого окна видны без прокрутки на 390×844 и 1280×800;
// • набор кнопок совпадает с окном без study2733.js — ни одна не потерялась, новые только оговорённые; старые кнопки
//   нажимаются и ведут туда же (кроме отказа от места: теперь сначала «Отказаться от места?»);
// • деньги: цена и доли в окне предложения — tuition16, tuitionQuote17, sponsorQuote22; после нажатия «Начать · …»
//   и одного месяца списано ровно столько, сколько было на кнопке (вы, родители, компания, кредит);
// • стипендия, курс языка, разрешение на учёбу: на кнопке — та сумма, что списывается; шанс — тот, что бросается;
// • «Моя учёба»: срок по темпу учёбы, месяц проверки оценок — те, что потом случаются; школьнику — только школа;
// • «Подробнее» запоминается по виду окна и не попадает в сохранение; ошибок на странице нет;
// • после рецензии: причина у серых «Начать · …» — первая строка «Не хватает» (К3); разрешение — календарный срок;
//   переезд — суммы moveQuote68; нулей «0 ₽» и повтора цены нет; отказ от места — «Что изменится»; у просьбы к
//   родителям — месяц повтора (М3); «ещё 6 уровней» одной строкой; курсы за границей — 1 и 6 мес. и заявка;
//   клуб до 18 лет — серый с причиной; до школы вузов наверху нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || '', SHOTS = process.env.SHOTS || '';
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 800 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = PHONE, base = BASE, raw = null, seed = 2733 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? INDEX.replace(/<script src="study2733\.js[^"]*"><\/script>/g, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(() => { for (const [k, v] of [['startAge', '18'], ['country', 'ru']]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } });
    await pg.evaluate(seed => { Math.random = seeded269(seed); [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); }, seed);
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false; s.ui05.panel = 'center';
    try { localStorage.clear(); } catch (e) {}
  });
  await pg.evaluate(helpers);
  return { pg, ctx, errors };
}

function helpers() {
  window.__lbl = b => b.classList.contains('fix273') ? (b.querySelector('small')?.textContent || '').replace(/\s+/g, ' ').trim() : [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  window.__modalBtns = () => [...document.querySelectorAll('#modal button')].filter(b => !b.closest('.modal-closebar38') && !b.classList.contains('ready2722-go'));
  window.__panelBtns = () => [...document.querySelectorAll('.trajectory button')].filter(b => !b.closest('.path-nav') && __lbl(b) !== '?');
  window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
  window.__title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(закрыто)';
  window.__hidden = b => !!b.closest('details:not([open])') || (b.checkVisibility ? !b.checkVisibility() : b.getBoundingClientRect().height === 0);
  // Кнопка видна без прокрутки: в окне — в пределах окна и экрана; на панели — в пределах экрана при прокрутке в начало.
  window.__where = (b, modal) => {
    if (!b) return null;
    if (modal) { const m = $('#modal'); m.scrollTop = 0; } else { scrollTo(0, 0); for (let e = b.parentElement; e; e = e.parentElement) if (e.scrollTop) e.scrollTop = 0; }
    const r = b.getBoundingClientRect(), box = modal ? $('#modal').getBoundingClientRect() : { top: 0, bottom: innerHeight };
    const y = modal ? r.top - box.top + $('#modal').scrollTop : r.top + scrollY;
    return { label: __lbl(b), y: Math.round(y), bottom: Math.round(r.bottom), fold: !__hidden(b) && r.top >= box.top && r.bottom <= Math.min(box.bottom, innerHeight) + .5 && r.height > 0, screen: Math.floor(y / (modal ? $('#modal').clientHeight : innerHeight)) + 1, disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '', hint: [...b.querySelectorAll('small')].map(x => x.textContent).join(' | ') };
  };
  window.__find = (label, modal = true) => (modal ? __modalBtns() : __panelBtns()).find(b => __lbl(b) === label);
  window.__press = label => { const b = __find(label) || __find(label, false); if (!b) return { missing: label }; if (b.disabled) return { disabled: true }; const before = JSON.stringify([path16().applications.map(a => a.status), path16().study?.payer || null, s.clock.tasks.length]); try { b.click(); } catch (e) { return { error: String(e) }; } return { title: __title(), changed: JSON.stringify([path16().applications.map(a => a.status), path16().study?.payer || null, s.clock.tasks.length]) !== before }; };
  window.__snap = () => { window.__saved = JSON.stringify(s); };
  window.__restore = () => { __close(); s = JSON.parse(window.__saved); s.pending = []; s.clock.running = false; Math.random = seeded269(27331); };
  // Платежи за учёбу за месяц tick: по записям семейного журнала (transaction17) — вы и каждый родитель отдельно.
  window.__paid = tick => { const out = { player: 0, others: 0, keys: [] }; for (const e of ensureFamily17().ledger.filter(e => e.tick === tick && /tuition|sponsored/.test(e.key))) { out.keys.push(e.key); for (const p of e.parts || []) if (p.payer === 'player') out.player += p.amount; else out.others += p.amount; } return out; };
  // Строки верха: открытого окна, а если окно закрыто — панели (закрытое окно хранит прежние строки).
  window.__top = () => Object.fromEntries([...document.querySelectorAll($('#modal').open ? '#modal .top273 .row273' : '.trajectory .top2733 .rows2733 > div')].map(r => [r.querySelector('dt').textContent, { value: r.querySelector('dd').childNodes[0]?.textContent || '', note: r.querySelector('dd small')?.textContent || '' }]));
  window.__need = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', fix: e.tagName === 'BUTTON', small: e.querySelector('small')?.textContent || '' }));
  window.save = function () {}; if (typeof flushSave264 === 'function') window.flushSave264 = function () {};
}

// Окна сценария — одной строкой: одинаково в обоих режимах.
const OPEN = {
  edu: "()=>openPath16('education')",
  lang: "()=>openPath16('languages')",
  req: "()=>openRequests58('study')",
  program: '()=>programDetails16(__v.program)',
  offer: "()=>openDecision24('study',__v.app)",
};
const MODAL = { program: true, offer: true };
// Главные кнопки: что должно быть на первом экране.
const MAIN = {
  edu: () => "[...document.querySelectorAll('.trajectory .top2733 .main2733 button')].map(__lbl)",
  lang: () => "[...document.querySelectorAll('.trajectory .need2733 button, .trajectory .path-card:not(.need2733) button.language-lesson186')].slice(0,2).map(__lbl)",
  req: () => "[...document.querySelectorAll('.trajectory .path-card button')].filter(b=>/стипенд|Ответ/.test(__lbl(b))).map(__lbl).slice(0,1)",
  program: () => "[...document.querySelectorAll('#modal .main273 button')].map(__lbl)",
  offer: () => "[...document.querySelectorAll('#modal .main273 button')].map(__lbl)",
};
// Новые кнопки, которых нет без study2733.js.
const EXTRA = /^(Подать на стипендию|Ответ и следующие шаги|Попросить оплату у родителей|Начать · .+|Договориться с родителями|Условия компании|Другие способы оплаты|Бюджет и помощь родителей|Документы и переезд|Разговорный клуб · .+|Открыть · .+|Курсы в стране языка|Подать на разрешение|Подготовить переезд)$/;

async function look(pg, kind, label) {
  await pg.evaluate(src => { __close(); (0, eval)('(' + src + ')')(); }, OPEN[kind]);
  await pg.waitForTimeout(40);
  return pg.evaluate(([kind, modal, mainSrc]) => {
    const btns = modal ? __modalBtns() : __panelBtns();
    const labels = btns.map(b => ({ label: __lbl(b), disabled: b.disabled }));
    const main = (0, eval)(mainSrc).map(l => __where(btns.find(b => __lbl(b) === l), modal)).filter(Boolean);
    const more = modal ? document.querySelector('#modal details.more273') : document.querySelector('.trajectory details.more2733');
    const card = modal ? !!document.querySelector('#modal .top273') : kind === 'edu' ? !!document.querySelector('.trajectory .top2733') : kind === 'lang' ? !!document.querySelector('.trajectory .need2733') || !document.querySelector('.trajectory .path-card button.language-lesson186:not([disabled])') || typeof langTop2733 === 'function' && !langTop2733() : null;
    // (у новой жизни список вакансий бывает разным: если ни один язык не нужен, подсвечивать нечего — это не ошибка;
    // подсветку нужного языка отдельно проверяет «Языки» с вакансиями в Великобритании ниже)
    return { kind, title: __title(), labels, main, top: __top(), need: modal ? __need() : [], more: more ? { open: more.open, kind: more.dataset.kind } : null, card, text: (modal ? $('#modal') : document.querySelector('.trajectory'))?.innerText.slice(0, 1500) || '' };
  }, [kind, !!MODAL[kind], MAIN[kind]()]);
}

// Сценарии: готовят жизнь (window.__v) и возвращают список окон по порядку. Каждое окно — после __restore() того
// состояния, которое сценарий сохранил под своим именем.
const SETUP = {
  owner: `()=>{
    window.__v={};__close();
    const ok=p=>p.country===s.country&&p.city===residenceCity()&&p.level==='certificate'&&!admission16(p).why.length,fields=s.job?company18().departments21.map(d=>d.field):[];
    const p=programs16.find(p=>ok(p)&&fields.includes(p.field))||programs16.find(ok);
    __v.program=p.id;
    return ['edu','lang','program'];
  }`,
  ru: `()=>{
    window.__v={};s.cash=Math.max(s.cash,3e6);__close();
    // Жизнь рождается каждый раз немного другой: язык программы подтягиваем, чтобы заявку можно было подать.
    const p=programs16.find(p=>p.country===s.country&&p.level==='bachelor'&&p.city===residenceCity());
    path16().languages[p.language]=Math.max(path16().languages[p.language]||0,p.minLanguage);
    __v.program=p.id;
    return ['edu','lang'];
  }`,
};

async function scenario(browser, name, opts) {
  if (!opts.raw) {
    const P = await page(browser, { ...opts, base: true });
    opts = { ...opts, raw: await P.pg.evaluate(() => JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] })) };
    await P.ctx.close();
  }
  const out = {};
  const modes = [['base', true, PHONE], ['new', BASE, PHONE], ['wide', BASE, WIDE], ...(SHOTS && name === 'owner' ? [['widebase', true, WIDE]] : [])];
  for (const [mode, base, vp] of modes) {
    const P = await page(browser, { ...opts, base, viewport: vp });
    const r = { wins: {}, press: {}, extra: null };
    const kinds = await P.pg.evaluate(src => { Math.random = seeded269(2733); return (0, eval)('(' + src + ')')(); }, SETUP[name]);
    await P.pg.evaluate(() => __snap());
    // Состояния окна предложения: «Есть предложение» и «Место принято» — один раз в одном и том же порядке.
    // Окна по ходу поступления: сейчас, заявка подана, есть предложение, место принято.
    for (const stage of ['now', 'submitted', 'offered', 'accepted']) {
      await P.pg.evaluate(stage => {
        __restore();
        if (stage !== 'now') { s.cash = Math.max(s.cash, 3e6); apply16(__v.program); const a = path16().applications.at(-1); a.roll = 0; __v.app = a.id; }
        if (stage === 'offered' || stage === 'accepted') { const a = path16().applications.find(a => a.id === __v.app); for (let i = 0; i < 6 && a.status === 'submitted'; i++) __month(1); }
        if (stage === 'accepted') acceptStudy16(__v.app);
        window.__stage = JSON.stringify(s);
      }, stage);
      const list = stage === 'now' ? kinds : stage === 'submitted' ? ['program', 'req'] : ['offer', 'edu'];
      for (const k of list) {
        await P.pg.evaluate(() => { __close(); s = JSON.parse(window.__stage); s.pending = []; Math.random = seeded269(27332); });
        const key = k + (stage === 'now' ? '' : '·' + stage);
        r.wins[key] = await look(P.pg, k);
        if (SHOTS && name === 'owner') {
          const file = path.join(SHOTS, 'study-' + name + '-' + key.replace('·', '-') + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png');
          await P.pg.evaluate(m => { if (m) $('#modal').scrollTop = 0; else scrollTo(0, 0); }, !!MODAL[k]);
          await P.pg.screenshot({ path: file });
        }
        // Старые кнопки окна: нажать в том же состоянии и записать, куда привело (телефон).
        if (vp === PHONE && MODAL[k]) for (const l of r.wins[key].labels) {
          await P.pg.evaluate(() => { __close(); s = JSON.parse(window.__stage); s.pending = []; Math.random = seeded269(27333); });
          await P.pg.evaluate(src => (0, eval)('(' + src + ')')(), OPEN[k]);
          await P.pg.waitForTimeout(10);
          r.press[key + ' / ' + l.label] = await P.pg.evaluate(label => __press(label), l.label);
        }
      }
    }
    if (vp === PHONE) r.extra = await extraChecks(P.pg, name, base);
    r.errors = P.errors.slice();
    out[mode] = r;
    await P.ctx.close();
  }
  return out;
}

// Проверки чисел и поведения: только на телефоне, в обоих режимах (без study2733.js часть из них не проходит).
async function extraChecks(pg, name, base) {
  return pg.evaluate(async ([name, base]) => {
    const x = {}, pc = p => Math.round(p * 100) + '%', wait = ms => new Promise(r => setTimeout(r, ms));
    const btn = l => __find(l) || __find(l, false);
    if (name === 'ru') {
      __restore(); s.cash = Math.max(s.cash, 3e6); apply16(__v.program); { const a = path16().applications.at(-1); a.roll = 0; __v.app = a.id; } __snap();
      // Стипендия в окне программы после подачи: цена и шанс — те, что спишутся и бросятся.
      __restore(); const p = prog16(__v.program), a = path16().applications.find(a => a.id === __v.app);
      programDetails16(p.id); await wait(30);
      const b = __find('Подать на стипендию'), cash = s.cash, hint = b ? __where(b, true) : null;
      if (b) b.click();
      x.scholar = { hint, fee: money(c().cost * .001), chance: pc(scholarship16(p)), paid: money(cash - s.cash), rolled: a.scholarship ? pc(a.scholarship.probability) : null, title: __title() };
      __close();
      // Карточка заявки: кнопка стипендии с ценой и шансом.
      __restore(); openRequests58('study'); const rb = __find('Подать на стипендию', false);
      x.reqScholar = rb ? { hint: [...rb.querySelectorAll('small')].map(s => s.textContent).join(''), text: rb.closest('.path-card')?.innerText || '' } : null;
      // Предложение: принять в окне, потом каждый вариант оплаты — то, что на кнопке, и то, что списано за месяц.
      __restore(); for (let i = 0; i < 6 && path16().applications.find(q => q.id === __v.app).status === 'submitted'; i++) __month(1);
      const parent = parents17()[0]; if (parent) { parent.inner.trust = 90; parent.inner.affection = 80; parent.privateCash = Math.max(parent.privateCash, 5e6); }
      __snap(); window.__offeredSaved = window.__saved;
      openDecision24('study', __v.app); await wait(30);
      x.offered = { main: [...document.querySelectorAll('#modal .main273 button')].map(__lbl), status: document.querySelector('#modal .status273')?.textContent || '', top: __top(), fee: money(tuition16(p, path16().applications.find(q => q.id === __v.app))) };
      __press('Принять предложение'); await wait(30);
      x.afterAccept = { title: __title(), status: document.querySelector('#modal .status273')?.textContent || '', main: [...document.querySelectorAll('#modal .main273 button')].map(b => __where(b, true)) };
      __close(); __snap();
      // Согласие родителя: шанс на кнопке — порог, по которому educationSupport17 решает.
      { openDecision24('study', __v.app); await wait(20); const ask = __find('Попросить оплату у родителей'); x.askHint = ask ? [...ask.querySelectorAll('small')].map(s => s.textContent).join(' ') : null; __close();
        if (parent) { supportMenu17(__v.app); await wait(20); const pb = __modalBtns().find(b => __lbl(b) === parent.name); x.supportHint = pb ? [...pb.querySelectorAll('small')].map(s => s.textContent).join(' ') : null; __close();
          const m = /шанс (\d+)%/.exec(x.supportHint || ''), w = m ? +m[1] / 100 : null, rnd = Math.random, res = [];
          for (const d of [-.006, .006]) { __restore(); const q = parents17()[0]; Math.random = () => w + d; try { educationSupport17(__v.app, q.id); } finally { Math.random = rnd; } res.push(!!path16().applications.find(a => a.id === __v.app).funding17); }
          x.supportRoll = { w, below: res[0], above: res[1] }; } }
      const pay = [];
      for (const label of ['Начать · свои средства', 'Начать · кредит на всю учёбу', 'Начать · родители и свои средства', 'Начать · родители и кредит на остаток']) {
        __restore();
        if (/родители/.test(label) && parent) { const rnd = Math.random; Math.random = () => 0; try { educationSupport17(__v.app, parent.id); } finally { Math.random = rnd; } }
        const a2 = path16().applications.find(q => q.id === __v.app), fee = tuition16(p, a2), q = tuitionQuote17(fee, a2), left = p.months;
        openDecision24('study', __v.app); await wait(20);
        const b2 = __find(label); const w = b2 ? __where(b2, true) : null;
        const debts0 = s.debts.filter(d => d.student).reduce((n, d) => n + d.balance, 0);
        if (b2 && !b2.disabled) b2.click();
        const started = path16().study?.payer || null; const debt = s.debts.filter(d => d.student).reduce((n, d) => n + d.balance, 0) - debts0;
        __month(1); const paid = __paid(s.clock.ticks);
        pay.push({ label, hint: w?.hint || '', disabled: w?.disabled, why: w?.why, started, fee: money(fee), help: money(q.help), own: money(Math.max(0, fee - q.help)), loan: money(fee * left), loanRest: money(Math.max(0, fee - q.help) * left), debt: money(debt), paidPlayer: money(paid.player), paidOthers: money(paid.others), rawPlayer: paid.player, rawOthers: paid.others, keys: paid.keys });
      }
      x.pay = pay;
      // Почему начать нельзя: пустая причина ⇔ studyStart16 правда начинает учёбу (не в городе программы — тоже).
      { const res = []; for (const setup of ['ok', 'nocash', 'elsewhere']) { __restore(); if (setup === 'nocash') s.cash = 10; if (setup === 'elsewhere') { const other = cities[s.country].find(c => c !== residenceCity()); s.housing.city = other; }
          openDecision24('study', __v.app); await wait(20); const b3 = __find('Начать · свои средства'); const why = b3?.disabled ? (b3.querySelector('.why273')?.textContent || 'серая') : ''; __close();
          let msg = ''; const t0 = toast; toast = m => { msg = String(m); }; try { studyStart16(__v.app, 'self'); } finally { toast = t0; }
          res.push({ setup, why, started: !!path16().study, msg, city: residenceCity() }); } x.startWhy = res; }
      // Отказ от места — с подтверждением.
      __restore(); openDecision24('study', __v.app); await wait(20); __press('Отказаться от места'); x.declineAsk = document.querySelector('#modal .title273')?.textContent || __title(); __press('Вернуться к предложению'); x.declineBack = __title(); await wait(20);
      __press('Отказаться от места'); __press('Да, отказаться'); x.declined = path16().applications.find(a => a.id === __v.app).status; __close();
      // «Моя учёба» после начала: срок — по темпу, который потом и выходит; месяц проверки оценок — когда оценки меняются.
      __restore(); studyStart16(__v.app, 'self'); openPath16('education'); await wait(20);
      { const top = __top(), t = path16().study, p0 = t.progress, g0 = t.grades, check = s.clock.ticks + 3 - s.clock.ticks % 3;
        __month(1); const pace = t.progress - p0, months = Math.ceil((p.months - p0) / pace - 1e-9);
        let changed = null; for (let i = 0; i < 4 && changed === null; i++) { if (t.grades !== g0) changed = s.clock.ticks; else __month(1); } if (changed === null && t.grades !== g0) changed = s.clock.ticks;
        x.panel = { top, pace, months, check, changed, grades: [g0, t.grades] }; }
      __restore(); studyStart16(__v.app, 'self'); { const t = path16().study, now = s.clock.ticks, pace = Math.max(.25, Math.min(1, capacity() / Math.max(1, totalHours() + (p.hours || 0)))), months = Math.ceil((p.months - t.progress) / pace - 1e-9);
        openPath16('education'); await wait(10); x.panelDate = { value: __top()['Осталось']?.value || '', wantMonths: months, wantDate: (() => { const [m, y] = dateLabel86(now + months).split(' '); return y; })(), grades: __top()['Оценки']?.value || '', wantCheck: dateLabel86(now + 3 - now % 3), price: __top()['Цена']?.value || '', wantPrice: money(tuition16(p, path16().applications.find(a => a.id === __v.app))) }; }
      // «Моя учёба» в трудных состояниях (мало свободных часов и оценки ниже 30, академический отпуск, учёба стоит без
      // оплаты): главные кнопки всё равно на первом экране.
      { const res = {};
        for (const st of ['normal', 'slow', 'paused', 'blocked']) { __restore(); studyStart16(__v.app, 'self'); const t = path16().study;
          if (st === 'slow' || st === 'blocked') { s.clock.tasks.push({ id: 'verify-busy', kind: 'verifyBusy', label: 'Проверка', duration: 12, progress: 0, hours: 70, state: 'running' }); t.grades = 28; t.badTerms = 2; }
          if (st === 'paused') t.status = 'paused';
          if (st === 'blocked') t.blocked = 'Оплата периода: внесено 0 ₽, осталось ' + money(tuition16(p, path16().applications.find(a => a.id === __v.app))) + '. Пройденное сохранено';
          openPath16('education'); await wait(10);
          res[st] = { main: [...document.querySelectorAll('.trajectory .top2733 .main2733 button')].map(b => __where(b, false)), top: __top() }; }
        x.states = res; }
      // «Подробнее» на панели запоминается по виду и не попадает в сохранение.
      { __restore(); openPath16('education'); await wait(10); const d = () => document.querySelector('.trajectory details.more2733'); const was = d()?.open; d()?.querySelector('summary')?.click(); await wait(30); render(); const kept = d()?.open; openPath16('languages'); await wait(10); const other = d()?.open; openPath16('education'); d()?.querySelector('summary')?.click(); await wait(30); render(); const closed = d()?.open; let stored = null; try { stored = localStorage.getItem('more273:study-panel'); } catch (e) {} x.more = { was, kept, other, closed, stored, inSave: JSON.stringify(s).includes('more273') }; }
      // «Языки»: нужный язык (вакансии в Великобритании требуют английский) сверху; курс списывает то, что на кнопке.
      { __restore(); path16().languages.en = 0; Object.assign(path16().view, { country: 'uk', format: 'city', fit68: 'all', page: 0 }); path16().marketKey = null; makeVacancies16(); openPath16('languages'); await wait(10);
        const card = document.querySelector('.trajectory .need2733'); const course = card && [...card.querySelectorAll('button')].find(b => __lbl(b) === 'Курс');
        const L = languageLesson16('course'), cash = s.cash, n0 = s.clock.tasks.length; const hint = course ? course.querySelector('small')?.textContent : null, fold = course ? __where(course, false).fold : false; if (course) course.click();
        const t = s.clock.tasks.at(-1);
        x.lang = { eyebrow: card?.querySelector('.eyebrow')?.textContent || '', name: card?.querySelector('h3')?.textContent || '', target: card?.querySelector('.target2733')?.textContent || '', fold, hint, want: L.months + ' мес. · ' + L.hours + ' ч/нед. · ' + money(L.cost) + ' сразу · +0,55 уровня', paid: money(cash - s.cash), cost: money(L.cost), task: s.clock.tasks.length > n0 ? { kind: t.kind, hours: t.hours, duration: t.duration, gain: t.gain } : null, club: card ? [...card.querySelectorAll('button')].map(b => __lbl(b) + ' {' + (b.querySelector('small')?.textContent || '') + '}') : [], fee: money(c().cost * .001), zero: document.querySelector('.trajectory details.more2733[data-kind="languages-all"] summary')?.textContent || '' }; }
      // Клуб нужного языка: взнос на кнопке — тот, что клуб берёт (clubFee19).
      { const b4 = [...document.querySelectorAll('.trajectory .need2733 button')].find(b => /^Разговорный клуб · /.test(__lbl(b))); if (b4 && !b4.disabled) { b4.click(); const m = clubState19().memberships.at(-1); x.club = { hint: x.lang.club.find(t => /^Разговорный клуб/.test(t)), fee: m ? money(clubFee19(m)) : null, rate: m ? String(Math.round(languageRate72(m.type, path16().languages[m.language] || 0) * 100) / 100).replace('.', ',') : null }; } }
      // Поиск: «стипендия».
      x.search = actionCatalog24().filter(a => (a.label + ' ' + (a.keywords || '')).toLowerCase().includes('стипендия')).map(a => a.label);
      // Школьник: только школа наверху.
      { __restore(); s.age = 10; path16().applications = []; familySchoolState(); openPath16('education'); await wait(10);
        const top = document.querySelector('.trajectory .top2733'); x.pupil = { kind: top?.dataset.state || '', title: top?.querySelector('h2')?.textContent || '', main: top ? [...top.querySelectorAll('.main2733 button')].map(b => __where(b, false)) : [], visible: __panelBtns().filter(b => !__hidden(b)).map(__lbl), grades: __top()['Успеваемость']?.value || '', wantCheck: dateLabel86(s.clock.ticks + 3 - s.clock.ticks % 3), wantGrades: Math.round(s.school.grades) + '/100' }; }
      // До 18 лет: учёбу оплачивают родители — в окне предложения и в журнале за месяц.
      { __restore(); s.age = 16; const pm = programs16.find(q => q.country === s.country && q.level === 'certificate' && q.city === residenceCity() && s.age >= programMinAge16(q));
        if (pm) { path16().languages[pm.language] = Math.max(path16().languages[pm.language] || 0, pm.minLanguage); for (const q of parents17()) q.privateCash = Math.max(q.privateCash, 5e6); apply16(pm.id); const am = path16().applications.at(-1); am.roll = 0; for (let i = 0; i < 6 && am.status === 'submitted'; i++) __month(1); acceptStudy16(am.id);
          openDecision24('study', am.id); await wait(20); const bm = __find('Начать · оплачивают родители'); const w = bm ? __where(bm, true) : null; const fee = tuition16(pm, am); if (bm && !bm.disabled) bm.click(); const started = !!path16().study; __month(1); const paid = __paid(s.clock.ticks);
          x.minor = { hint: w?.hint || '', fold: w?.fold, started, fee: money(fee), parents: money(paid.others), player: paid.player, keys: paid.keys }; } }
      // Программа в другой стране: право учиться и переезд — строками «Не хватает» с кнопками; взнос — тот, что списан.
      { __restore(); const pf = programs16.find(q => q.country === 'de' && q.level === 'bachelor' && q.city === cities.de[0] && s.age >= programMinAge16(q));
        if (pf) { path16().languages[pf.language] = Math.max(path16().languages[pf.language] || 0, 6); apply16(pf.id); const af = path16().applications.at(-1); af.roll = 0; for (let i = 0; i < 6 && af.status === 'submitted'; i++) __month(1); acceptStudy16(af.id); s.cash = Math.max(s.cash, 3e6);
          openDecision24('study', af.id); await wait(20); const need = __need(), main = [...document.querySelectorAll('#modal .main273 button')].map(b => __where(b, true));
          const fixb = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /^Подать на разрешение/.test(b.querySelector('small')?.textContent || '')), cash = s.cash, n0 = path16().permitApplications.length;
          if (fixb) fixb.click(); await wait(20);
          x.abroad = { need, main, fee: money(c().cost * .004), paid: money(cash - s.cash), applied: path16().permitApplications.length - n0, after: __need(), title: __title() }; } }
      // Правки после рецензии (сборка 273.3, второй круг).
      { const fx = x.fix = {}, rows = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', small: e.querySelector('small')?.textContent || '', fix: e.tagName === 'BUTTON' }));
        const mainWhys = () => [...document.querySelectorAll('#modal .main273 button')].map(b => ({ label: __lbl(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '' }));
        const smalls = b => [...b.querySelectorAll('small')].map(e => e.textContent).join(' · ');
        const pf = programs16.find(q => q.country === 'de' && q.level === 'bachelor' && q.city === cities.de[0] && s.age >= programMinAge16(q));
        if (pf) {
          __restore(); path16().languages[pf.language] = 6; apply16(pf.id); const af = path16().applications.at(-1); af.roll = 0; for (let i = 0; i < 6 && af.status === 'submitted'; i++) __month(1); acceptStudy16(af.id); s.cash = Math.max(s.cash, 3e6);
          // К3: причина у серых «Начать · …» — первая строка «Не хватает» (право учиться), а не «Сначала переезд».
          openDecision24('study', af.id); await wait(20); fx.k3 = { need: rows(), main: mainWhys() };
          // Разрешение — календарная задача: усталость и занятость срок ответа не сдвигают (ответ через 3 мес.).
          s.clock.fatigue = 80; openDecision24('study', af.id); await wait(20); fx.permitTired = { rows: rows(), want: inMonth273(s.clock.ticks + 3), wantTick: s.clock.ticks + 3 };
          { const b = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /^Подать на разрешение/.test(b.querySelector('small')?.textContent || '')); if (b) b.click(); await wait(10); }
          let granted = null; for (let i = 1; i <= 6 && granted === null; i++) { s.clock.fatigue = 80; __month(1); if (permission16(pf.country, 'study')) granted = s.clock.ticks; }
          fx.permitTired.granted = granted; s.clock.fatigue = 0;
          // Переезд — как moveQuote68 (relocation68), а не прежняя модель mobilityData24: самый дешёвый вариант жилья и плательщика.
          const quotes = []; for (const h of ['dorm', 'room']) for (const pid of [null, ...parents17().filter(q => (q.inner?.trust ?? 0) >= 45).map(q => q.id)]) { const q = moveQuote68('study', af.id, h, pid, []); if (q) quotes.push(q); }
          const best = quotes.sort((a, b) => a.needed - b.needed)[0];
          s.cash = best.needed + 10; openDecision24('study', af.id); await wait(20);
          const mv = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /^Подготовить переезд/.test(b.querySelector('small')?.textContent || ''));
          fx.move = { hint: mv ? mv.querySelector('small').textContent : null, rows: rows(), upfront: money(best.family >= .5 ? best.family : best.own), reserve: money(best.reserve), needed: money(best.needed), main: mainWhys() };
          s.cash = best.needed - 10; openDecision24('study', af.id); await wait(20); fx.moveShort = { rows: rows(), gap: money(10) };
          s.cash = 3e6; openDecision24('study', af.id); await wait(20); { const b = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => /^Подготовить переезд/.test(b.querySelector('small')?.textContent || '')); if (b) b.click(); await wait(10); fx.moveWin = { title: __title(), hints: __modalBtns().map(smalls) }; }
          __close();
        }
        // Нули: родители платят всю цену — ни на кнопках «Начать · …», ни в строке «Платить» нет «0 ₽».
        __restore(); window.__saved = window.__offeredSaved; __restore(); const p = prog16(__v.program);
        const parent = parents17()[0]; parent.inner.trust = 90; parent.inner.affection = 80; parent.privateCash = 5e7;
        { const rnd = Math.random; Math.random = () => 0; try { educationSupport17(__v.app, parent.id); } finally { Math.random = rnd; } }
        const a = path16().applications.find(q => q.id === __v.app), fee = tuition16(p, a), q = tuitionQuote17(fee, a);
        openDecision24('study', __v.app); await wait(20); const offered = __top(), offeredText = [...document.querySelectorAll('#modal .status273, #modal .top273, #modal .need273, #modal .main273, #modal .set273')].map(e => e.innerText).join('\n');
        acceptStudy16(__v.app); openDecision24('study', __v.app); await wait(20);
        fx.zero = { share: a.funding17?.share, help: money(q.help), fee: money(fee), offered, starts: [...document.querySelectorAll('#modal .main273 button')].map(b => __lbl(b) + ' {' + smalls(b) + '}'), feeTimes: (t => t(offeredText).split(t(money(fee))).length - 1)(t => t.replace(/[\s\u00a0\u202f]+/g, ' ')) };
        __close(); __snap();
        // «Моя учёба»: родители перестали платить (доверие 20) — без «0 ₽»; кредит на всю учёбу — одной фразой; темп 0,97 — не «в 1 раза».
        studyStart16(__v.app, 'family'); parent.inner.trust = 20; openPath16('education'); await wait(10); fx.panelFamily0 = __top()['Цена'] || null;
        __restore(); studyStart16(__v.app, 'loan'); openPath16('education'); await wait(10); fx.panelLoan = __top()['Цена'] || null;
        __restore(); studyStart16(__v.app, 'self'); { const extra = Math.max(0, capacity() / .97 - totalHours() - (p.hours || 0)); s.clock.tasks.push({ id: 'verify-slow', kind: 'verifySlow', label: 'Проверка', duration: 12, progress: 0, hours: extra, state: 'running' }); fx.pace = capacity() / Math.max(1, totalHours() + (p.hours || 0)); }
        openPath16('education'); await wait(10); fx.panelSlow = __top()['Осталось'] || null;
        // Отказ от места — «Что изменится», как у увольнения в 273.2.
        __restore(); openDecision24('study', __v.app); await wait(20); __press('Принять предложение'); await wait(10);
        { const b = __find('Отказаться от места'); if (b) b.click(); await wait(20); fx.decline = { h2: __title(), title: document.querySelector('#modal .title273')?.textContent || '', area: document.querySelector('#modal .eyebrow')?.textContent || '', top: __top(), btns: __modalBtns().map(__lbl) }; __close(); }
        // Родители: на кнопке — месяц, когда можно спросить снова (educationSupport17 ставит полгода).
        __restore(); { const pr = parents17().find(q => !(s.clock.ticks < (ensureFamily17().requests['tuition:' + __v.app + ':' + q.id] || 0))); pr.inner.trust = 90; pr.privateCash = 5e7; openDecision24('study', __v.app); await wait(20); const ask = __find('Попросить оплату у родителей'); fx.askAgain = { hint: ask ? smalls(ask) : null };
          __close(); supportMenu17(__v.app); await wait(20); const pb = __modalBtns().find(b => __lbl(b) === pr.name); fx.askAgain.menu = pb ? smalls(pb) : null; __close();
          const rnd = Math.random; Math.random = () => .999; try { educationSupport17(__v.app, pr.id); } finally { Math.random = rnd; } const until = ensureFamily17().requests['tuition:' + __v.app + ':' + pr.id]; fx.askAgain.want = until ? dateLabel86(until) : null; }
        // «Языки»: «ещё 6 уровней», одна строка вместо двух; курсы за границей — 1 и 6 мес. и заявка; клуб до 18 лет — серый с причиной.
        { const pl = programs16.find(q => q.language === 'en' && q.country !== s.country), keep = pl.minLanguage; fx.levels = {};
          for (const [need, have] of [[6, 0], [5, 0], [2, 1], [4, .8]]) { __restore(); pl.minLanguage = need; path16().languages.en = have; path16().vacancies = []; path16().jobApplications = []; path16().applications = []; path16().applications.push({ id: 'verify-lang', program: pl.id, status: 'submitted' }); openPath16('languages'); await wait(5);
            const card = document.querySelector('.trajectory .need2733'); fx.levels[need + '/' + have] = card ? { target: card.querySelector('.target2733')?.textContent || '', lines: [...card.querySelectorAll(':scope > p')].map(e => e.textContent) } : null; }
          pl.minLanguage = keep;
          __restore(); s.cash = c().cost * 5; path16().languages.en = 2.4; path16().applications.push({ id: 'verify-lang', program: pl.id, status: 'submitted' }); openPath16('languages'); await wait(5);
          const list = Object.keys(countries).filter(k => k !== s.country && country16[k]?.[0] === 'en'), lo = m => Math.min(...list.map(k => languageStayPrice53(k, m)));
          const sb = [...document.querySelectorAll('.trajectory .need2733 button')].find(b => __lbl(b) === 'Курсы в стране языка');
          fx.stay = { hint: sb ? smalls(sb) : null, one: money(lo(1)), six: money(lo(6)), fee: money(c().cost * .002) };
          languageStayMenu53('en'); await wait(10); const cb = __modalBtns().find(b => /^Английский · /.test(__lbl(b))); const ck = cb && list.find(k => __lbl(cb) === 'Английский · ' + countries[k].name);
          fx.stay.win = cb ? { hint: smalls(cb), one: money(languageStayPrice53(ck, 1)), six: money(languageStayPrice53(ck, 6)) } : null; __close();
          __restore(); s.age = 13; path16().applications = []; path16().vacancies = []; path16().languages.en = 1.3; languageTask16('en', 'practice'); openPath16('languages'); await wait(5);
          const club = [...document.querySelectorAll('.trajectory .need2733 button')].find(b => /^Разговорный клуб · /.test(__lbl(b)));
          const m0 = clubState19().memberships.length; if (club && !club.disabled) club.click();
          fx.minorClub = { found: !!club, disabled: club?.disabled, hint: club ? smalls(club) : null, joined: clubState19().memberships.length - m0 }; __close(); }
        // До школы: вузов наверху нет.
        __restore(); s.age = 4; path16().applications = []; openPath16('education'); await wait(5);
        { const top = document.querySelector('.trajectory .top2733'); fx.preschool = { kind: top?.dataset.state || '', main: top ? [...top.querySelectorAll('.main2733 button')].map(__lbl) : null, visible: __panelBtns().filter(b => !__hidden(b)).map(__lbl) }; }
        __restore();
      }
    }
    if (name === 'owner') {
      // Сохранение владелицы: окно программы (сертификат в Сиднее) после подачи, просьба к компании, «Выбрать программу».
      __restore(); s.cash = Math.max(s.cash, 1e6); const p = prog16(__v.program); apply16(p.id); const a = path16().applications.at(-1); a.roll = 0;
      programDetails16(p.id); await wait(30);
      x.prog = { main: [...document.querySelectorAll('#modal .main273 button')].map(b => __where(b, true)), status: document.querySelector('#modal .status273')?.textContent || '', company: [...document.querySelectorAll('#modal .chips273 button')].map(b => __lbl(b) + ' {' + (b.querySelector('small')?.textContent || '') + '}') };
      __close(); sponsorProgram22(p.id); await wait(20); const sb = __find('Отправить запрос'); x.sponsor = sb ? { hint: [...sb.querySelectorAll('small')].map(s => s.textContent).join(' '), want: pc(sponsorEligibility22(p).probability) } : null;
      __close(); sponsorMenu22(); __press('Выбрать программу'); x.sponsorPick = path16().view.section;
      // Оплата компанией: предложение, оплата и начало в одном окне; компания и вы платите то, что на кнопке.
      __restore(); s.cash = Math.max(s.cash, 1e6); { const q = prog16(__v.program); apply16(q.id); const aq = path16().applications.at(-1); aq.roll = 0; for (let i = 0; i < 6 && aq.status === 'submitted'; i++) __month(1); acceptStudy16(aq.id);
        const co = company18(); co.budget = Math.max(co.budget || 0, 1e7); co.finance = Math.max(co.finance || 0, 60);
        development22().funding.push({ id: 'sponsor-verify2733', program: q.id, employerId: co.id, status: 'active', share: .7, cap: localAmount16(q.fee, q.country) * .7, country: s.country, studyHours: 2, until: s.clock.ticks + 12, remainingPeriods24: 12, startBy24: s.clock.ticks + 24, history: [], paid: 0 });
        openDecision24('study', aq.id); await wait(20); const label = 'Начать · компания, семья и свои средства', b = __find(label), w = b ? __where(b, true) : null, sq = sponsorQuote22(q, aq, 'employer');
        if (b && !b.disabled) b.click(); const started = path16().study?.payer || null; __month(1); const paid = __paid(s.clock.ticks), g = development22().funding.find(g => g.id === 'sponsor-verify2733');
        x.employer = { hint: w?.hint || '', why: w?.why || '', fold: w?.fold, started, company: money(sq.company), own: money(sq.own), paidPlayer: money(paid.player), paidCompany: money((g?.history || []).filter(h => h.tick === s.clock.ticks).reduce((n, h) => n + (h.amount || 0), 0)), keys: paid.keys }; }
    }
    __restore();
    return x;
  }, [name, base]);
}

function compare(name, out) {
  const B = out.base, N = out.new, W = out.wide;
  for (const key of Object.keys(B.wins)) {
    const b = B.wins[key], n = N.wins[key], w = W?.wins[key];
    if (!n) { check(`${name} · ${key}: окно открылось`, false); continue; }
    const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label)).map(l => l.label);
    const extra = n.labels.filter(m => !b.labels.some(l => l.label === m.label) && !EXTRA.test(m.label)).map(m => m.label);
    check(`${name} · ${key}: ни одна кнопка не потерялась, новые только оговорённые`, !lost.length && !extra.length, { lost, extra });
    if (n.card !== null) check(`${name} · ${key}: наверху карточка` + (MODAL[key.split('·')[0]] ? ` («${n.title}»)` : ''), n.card, n.text.slice(0, 300));
    const main = n.main.filter(m => m);
    check(`${name} · ${key}: главные кнопки видны без прокрутки на 390×844 (${main.map(m => m.label).join(', ')})`, main.length > 0 && main.every(m => m.fold), n.main);
    if (w) { const wm = w.main.filter(m => m); check(`${name} · ${key}: главные кнопки видны без прокрутки на 1280×800`, wm.length > 0 && wm.every(m => m.fold), w.main); }
    for (const m of main) if (m.disabled) check(`${name} · ${key}: серая главная «${m.label}» — с причиной`, !!m.why || /[а-я]/.test(m.hint), m);
    const was = b.labels.map(l => l.label).filter(l => main.some(m => m.label === l));
    note(`${key}: ${main.map(m => '«' + m.label + '» ' + m.y + ' px').join(', ')}` + (was.length ? '' : ' (без study2733.js этих кнопок наверху не было)'));
    if (n.need.length) check(`${name} · ${key}: каждая строка «Не хватает» — кнопка или пояснение`, n.need.every(x => x.fix || x.small), n.need);
  }
  // Старые кнопки ведут туда же (кроме отказа от места — теперь с подтверждением).
  // Кнопка, которая раньше ничего не делала (apply16 отказывал всплывающим сообщением), теперь серая с причиной — это не потеря.
  const noop = (b, n) => n?.disabled === true && b?.changed === false && b?.title === '(закрыто)';
  const diff = Object.keys(B.press).filter(k => !/Отказаться от места$/.test(k) && !noop(B.press[k], N.press[k]) && JSON.stringify(B.press[k]) !== JSON.stringify(N.press[k])).map(k => ({ k, base: B.press[k], new: N.press[k] }));
  if (Object.keys(B.press).length) check(`${name}: каждая старая кнопка окон нажимается и ведёт туда же`, !diff.length, diff);
  const e = N.extra || {};
  if (name === 'ru') {
    check(`${name}: стипендия в окне программы — цена и шанс на кнопке, списано столько же, шанс тот же`, !!e.scholar?.hint && e.scholar.hint.hint.includes('заявка ' + e.scholar.fee) && e.scholar.hint.hint.includes('шанс ' + e.scholar.chance) && e.scholar.paid === e.scholar.fee && e.scholar.rolled === e.scholar.chance && e.scholar.hint.fold, e.scholar);
    check(`${name}: карточка заявки — «Подать на стипендию» с ценой и шансом, дата ответа`, !!e.reqScholar && e.reqScholar.hint.includes(e.scholar?.fee) && e.reqScholar.hint.includes('шанс ' + e.scholar?.chance) && /ответ примерно в/.test(e.reqScholar.text), e.reqScholar);
    check(`${name}: предложение — «Принять» и «Отказаться» наверху, срок ответа, цена из tuition16`, e.offered?.main.join() === 'Принять предложение,Отказаться от места' && /ответить до конца/.test(e.offered.status) && (e.offered.top['Цена']?.value || '').startsWith(e.offered.fee + '/мес.'), e.offered);
    check(`${name}: после «Принять» — то же окно, варианты оплаты наверху`, e.afterAccept && /Место принято/.test(e.afterAccept.status) && e.afterAccept.main.length >= 2 && e.afterAccept.main.every(m => /^Начать · /.test(m.label) && m.fold), e.afterAccept);
    for (const p of e.pay || []) {
      const ok = p.label === 'Начать · свои средства' ? p.started === 'self' && p.hint.includes('вы — ' + p.fee) && p.paidPlayer === p.fee && p.rawOthers === 0
        : p.label === 'Начать · кредит на всю учёбу' ? p.started === 'loan' && p.hint.includes('кредит ' + p.loan) && p.debt === p.loan && p.rawPlayer === 0 && p.rawOthers === 0
        : p.label === 'Начать · родители и свои средства' ? p.started === 'family' && (p.own === money0(p.own) ? p.hint.includes('родители платят всё — ' + p.help) : p.hint.includes('родители ' + p.help) && p.hint.includes('вы ' + p.own)) && p.paidOthers === p.help && p.paidPlayer === p.own
        : p.label === 'Начать · родители и кредит на остаток' ? p.started === 'familyloan' && (p.loanRest === money0(p.loanRest) ? p.hint.includes('родители платят всё — ' + p.help) && /кредит не понадобится/.test(p.hint) : p.hint.includes('родители ' + p.help) && p.hint.includes('кредит ' + p.loanRest)) && p.paidOthers === p.help && p.debt === p.loanRest && p.rawPlayer === 0 : false;
      check(`${name}: «${p.label}» — на кнопке те суммы, что списаны за месяц и записаны в кредит`, ok, p);
    }
    check(`${name}: родители — шанс на кнопке тот же, что в educationSupport17 (ниже шанса — согласие, выше — отказ)`, !!e.supportRoll && e.supportRoll.below === true && e.supportRoll.above === false && /шанс \d+%/.test(e.askHint || ''), { roll: e.supportRoll, ask: e.askHint, hint: e.supportHint });
    check(`${name}: причина у «Начать» пустая ровно тогда, когда studyStart16 начинает учёбу`, (e.startWhy || []).length === 3 && e.startWhy.every(r => !r.why === r.started), e.startWhy);
    check(`${name}: отказ от места — с подтверждением, «Вернуться» возвращает, «Да» отклоняет`, e.declineAsk === 'Отказаться от места?' && e.declineBack !== '(закрыто)' && e.declineBack !== 'Что изменится' && e.declined === 'declined', { ask: e.declineAsk, back: e.declineBack, declined: e.declined });
    if (e.panelDate) {
      check(`${name}: «Моя учёба» — срок до окончания по темпу monthPath16, цена из tuition16`, e.panelDate.value.includes(e.panelDate.wantDate) && e.panelDate.price.startsWith(e.panelDate.wantPrice), e.panelDate);
      const [m, y] = e.panelDate.wantCheck.split(' ');
      check(`${name}: «Моя учёба» — месяц проверки оценок в окне, оценки меняются в этот месяц`, e.panelDate.grades.includes(y) && e.panel?.changed === e.panel?.check, { panel: e.panelDate, real: e.panel });
      check(`${name}: «Моя учёба» — темп после месяца учёбы тот, что обещан`, e.panel && Math.abs(e.panel.pace - 1) < 1e-6 ? !/≈/.test(e.panelDate.value) : /≈/.test(e.panelDate.value), { panel: e.panelDate, pace: e.panel?.pace });
    }
    for (const [st, r] of Object.entries(e.states || {})) check(`${name}: «Моя учёба» (${st}) — главные кнопки на первом экране: ${r.main.map(m => m.label).join(', ')}`, r.main.length > 0 && r.main.every(m => m.fold), r);
    check(`${name}: «Подробнее» на панели запоминается по виду и не в сохранении`, e.more && e.more.was === false && e.more.kept === true && e.more.other === false && e.more.closed === false && e.more.stored === '0' && !e.more.inSave, e.more);
    check(`${name}: «Языки» — нужный язык сверху (английский для заявки или вакансий), курс на первом экране и списывает то, что на кнопке`, e.lang && /^Нужен для (учёбы|работы|вакансий)/.test(e.lang.eyebrow) && /^Английский/.test(e.lang.name) && /^Нужно [ABC][12] — у вас A0/.test(e.lang.target) && e.lang.fold && e.lang.hint === e.lang.want && e.lang.paid === e.lang.cost && e.lang.task?.kind === 'pathLanguage' && e.lang.task.hours === 4 && e.lang.task.duration === 3, e.lang);
    check(`${name}: «Языки» — языки на A0 под «Все языки»`, /^Все языки · \d+/.test(e.lang?.zero || ''), e.lang?.zero);
    if (e.club) check(`${name}: клуб нужного языка — взнос и прирост на кнопке те, что берёт клуб`, e.club.hint && e.club.hint.includes(e.club.fee + '/мес.') && e.club.hint.includes('+' + e.club.rate), e.club);
    check(`${name}: поиск «стипендия» находит заявки и стипендии`, (e.search || []).length > 0, e.search);
    check(`${name}: школьнику — только школа: наверху школа и её кнопки, вузов и общежития на виду нет`, e.pupil && e.pupil.kind === 'school-panel' && e.pupil.main.length >= 2 && e.pupil.main.every(m => m.fold) && !e.pupil.visible.some(l => /Каталог программ|общежит|Где учиться|Помощь родителей/.test(l)) && e.pupil.grades.startsWith(e.pupil.wantGrades) && e.pupil.grades.includes(e.pupil.wantCheck.split(' ')[1]), e.pupil);
    if (e.minor) check(`${name}: до 18 лет — «Начать · оплачивают родители»: на кнопке и списано у родителей одно и то же`, e.minor.started && e.minor.hint.includes(e.minor.fee) && e.minor.parents === e.minor.fee && e.minor.player === 0, e.minor);
    else note('ru: программы для 16 лет в городе не нашлось');
    // Правки после рецензии.
    const f = e.fix || {}, zero = t => /(^|[^\dA-Za-z\s\u00a0\u202f,])[\s\u00a0\u202f]*0[\s\u00a0\u202f]+[^\d\s%,]/.test(String(t || ''));
    if (f.k3) { const first = f.k3.need[0]?.text || '', dis = f.k3.main.filter(m => m.disabled && /^Начать · /.test(m.label));
      check(`${name}: К3 — у серых «Начать · …» причина та же, что первая строка «Не хватает» («${first}»)`, /^Право учиться/.test(first) && dis.length > 0 && dis.every(m => m.why === first), f.k3); }
    if (f.permitTired) { const r = f.permitTired.rows.find(r => /^Право учиться/.test(r.text));
      check(`${name}: разрешение — календарный срок: при усталости 80 на кнопке тот же месяц ответа, разрешение приходит в этот месяц`, !!r && r.fix && r.small.includes(f.permitTired.want) && f.permitTired.granted === f.permitTired.wantTick, f.permitTired); }
    if (f.move) {
      check(`${name}: переезд — суммы из moveQuote68 (самый дешёвый вариант), денег хватает — кнопка есть, без нулей`, !!f.move.hint && f.move.hint.includes(f.move.upfront) && f.move.hint.includes('резерв ' + f.move.reserve) && /1 мес\. без ваших часов/.test(f.move.hint) && !zero(f.move.hint), f.move);
      check(`${name}: переезд — не хватает 10: строка с суммой moveQuote68, без кнопки`, f.moveShort.rows.some(r => /^Переезд/.test(r.text) && !r.fix && r.small.includes(f.move.needed) && r.small.includes('не хватает ' + f.moveShort.gap)), f.moveShort);
      check(`${name}: переезд — кнопка ведёт в «Бюджет переезда»`, /^Бюджет переезда/.test(f.moveWin?.title || ''), f.moveWin);
    }
    if (f.zero) {
      const all = [...f.zero.starts, ...Object.values(f.zero.offered).map(r => r.value + ' ' + r.note)];
      check(`${name}: родители платят всё (доля ${f.zero.share}) — в окне предложения нет нулевых сумм`, f.zero.share === 1 && f.zero.starts.length >= 2 && !!f.zero.offered['Платить'] && !all.some(zero), all);
      check(`${name}: окно предложения — цена в месяц один раз, шанс стипендии не повторяется в строке «Цена»`, f.zero.feeTimes === 1 && !/шанс/.test(f.zero.offered['Цена']?.note || ''), { times: f.zero.feeTimes, offered: f.zero.offered });
    }
    check(`${name}: «Моя учёба» — родители перестали платить: без «0 ₽» и без повтора цены`, !!f.panelFamily0 && !zero(f.panelFamily0.value) && /родители сейчас не платят/.test(f.panelFamily0.value) && f.panelFamily0.value.split(f.zero?.fee).length === 2, f.panelFamily0);
    check(`${name}: «Моя учёба» — кредит на всю учёбу назван один раз`, !!f.panelLoan && (f.panelLoan.value.match(/кредит/g) || []).length === 1, f.panelLoan);
    check(`${name}: «Моя учёба» — темп ${Math.round((f.pace || 0) * 100) / 100}: не «в 1 раза медленнее»`, !!f.panelSlow && f.pace < 1 && !/в 1 раза/.test(f.panelSlow.note) && /медленнее/.test(f.panelSlow.note), { pace: f.pace, row: f.panelSlow });
    check(`${name}: отказ от места — окно «Что изменится» (как в 273.2): раздел «Учёба», последствия строками, без «в «Университет…»»`, f.decline && f.decline.h2 === 'Что изменится' && f.decline.title === 'Отказаться от места?' && f.decline.area === 'Учёба' && !!f.decline.top['Место'] && !!f.decline.top['Снова подать'] && !/«/.test(JSON.stringify(f.decline.top)) && f.decline.btns.join() === 'Да, отказаться,Вернуться к предложению', f.decline);
    if (f.askAgain) { const [m, y] = String(f.askAgain.want || '').split(' ');
      check(`${name}: просьба к родителям — на кнопке месяц, когда можно спросить снова (М3), тот же, что ставит educationSupport17`, !!f.askAgain.want && [f.askAgain.hint, f.askAgain.menu].every(h => h && /если откажет, снова можно в \S+ \d{4}/.test(h) && h.includes(y)) && !/через полгода/.test(f.askAgain.menu), f.askAgain); }
    for (const [k, w] of [['6/0', 'ещё 6 уровней'], ['5/0', 'ещё 5 уровней'], ['2/1', 'ещё 1 уровень'], ['4/0.8', 'ещё 3,2 уровня']])
      check(`${name}: «Языки» — «${w}», одной строкой без «Подготовка к следующему уровню»`, !!f.levels?.[k] && f.levels[k].target.endsWith(w) && f.levels[k].lines.length === 1, f.levels?.[k]);
    check(`${name}: «Курсы в стране языка» — цена за 1 и за 6 мес. из languageStayPrice53 и заявка отдельно`, !!f.stay?.hint && f.stay.hint.includes(f.stay.one) && f.stay.hint.includes(f.stay.six) && f.stay.hint.includes('заявка ' + f.stay.fee) && !!f.stay.win && f.stay.win.hint.includes(f.stay.win.one) && f.stay.win.hint.includes(f.stay.win.six) && !/за месяц/.test(f.stay.win.hint), f.stay);
    check(`${name}: «Разговорный клуб» до 18 лет — серый с причиной «с 18 лет», без цены (joinClub19 не запишет)`, !!f.minorClub && f.minorClub.found && f.minorClub.disabled === true && /^с 18 лет/.test(f.minorClub.hint) && f.minorClub.joined === 0, f.minorClub);
    check(`${name}: до школы (4 года) — наверху «До школы», вузов на виду нет`, f.preschool && f.preschool.kind === 'preschool-panel' && !f.preschool.visible.some(l => /Каталог программ|Заявки на поступление/.test(l)), f.preschool);
    if (e.abroad) check(`${name}: учёба за границей — право учиться и переезд строками «Не хватает», взнос за разрешение списан как на кнопке`, e.abroad.need.some(n => /^Право учиться/.test(n.text) && n.fix && n.small.includes(e.abroad.fee)) && e.abroad.need.some(n => /^Переезд в город программы/.test(n.text)) && e.abroad.paid === e.abroad.fee && e.abroad.applied === 1 && e.abroad.after.some(n => /заявка подана/.test(n.small)), e.abroad);
    else note('ru: зарубежной программы без требований не нашлось');
  }
  if (name === 'owner') {
    check(`${name}: окно программы после подачи — главная «Подать на стипендию», статус заявки`, e.prog && e.prog.main.some(m => m.label === 'Подать на стипендию' && m.fold) && /Заявка подана/.test(e.prog.status), e.prog);
    check(`${name}: просьба к компании — шанс на кнопке «Отправить запрос» тот, что в sponsorEligibility22`, !!e.sponsor && e.sponsor.hint.includes('шанс ' + e.sponsor.want), e.sponsor);
    check(`${name}: «Образование за счёт компании» → «Выбрать программу» ведёт в каталог программ`, e.sponsorPick === 'admission58', e.sponsorPick);
    check(`${name}: оплата компанией — на кнопке доли компании и ваша, списано столько же`, e.employer && e.employer.started === 'employer' && e.employer.hint.includes('компания ' + e.employer.company) && (e.employer.own === money0(e.employer.own) || e.employer.hint.includes('вы ' + e.employer.own)) && e.employer.paidPlayer === e.employer.own && e.employer.paidCompany === e.employer.company, e.employer);
  }
  check(`${name}: ошибок на странице нет`, !B.errors.length && !N.errors.length && !(W?.errors.length), { base: B.errors, new: N.errors, wide: W?.errors });
}
function money0(s) { return /^0\s/.test(s) ? s : ''; }

(async () => {
  const browser = await chromium.launch();
  try {
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    const runs = [];
    if (SAVE && fs.existsSync(SAVE)) runs.push(['owner', { raw: fs.readFileSync(SAVE, 'utf8') }]);
    else note('SAVE не задан: проверка только на новой жизни');
    runs.push(['ru', { seed: 27331 }]);
    for (const [name, opts] of runs) compare(name, await scenario(browser, name, opts));
    const order = [...INDEX.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    // Слияние 273.3: шаги 273.x встают после windows273.js цепочкой (people2731.js, work2732.js, …), study2733.js — среди них.
    check('study2733.js подключён после windows273.js, перед bootstrap61.js', order.indexOf('study2733.js') > order.indexOf('windows273.js') && order.indexOf('windows273.js') >= 0 && order.indexOf('study2733.js') < order.indexOf('bootstrap61.js'), order.slice(-5));
    const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8'));
    check('study2733.js есть в offline-assets.json, список отсортирован', assets.includes('study2733.js') && assets.every((a, i) => !i || assets[i - 1] <= a));
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без study2733.js)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
