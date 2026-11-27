// Проверки 275.2 (creative2752.js): творческие события называют конкретную работу. Только тексты.
//   node tools/verify2752_creative.js                 — свежие жизни (Россия, Австралия)
//   SAVE=путь/к/сохранению.json node tools/verify2752_creative.js — ещё и на чужом сохранении (файл экспорта жизней)
//   BASE=1 — index.html без creative2752.js (проверки нового поведения должны падать)
// 1. Премьера у близкого: работа по профессии (пьеса и роль по полу, фильм из премьер 271, концерт, выставка, книга),
//    где и когда, строка «как прошло»; поездка в другой город — то же в приглашении и строка после поездки.
// 2. «Вас узнали на улице», интервью, премьеры, выставки и концерты называют работу; реплики в «ёлочках», «ты» — только
//    у коллеги и только в кавычках; разные люди; тон по известности и качеству; без повторов (30 заготовок).
// 3. «0/1 приглашённых», род «состоялся/состоялось», одно название в «Истории» и карточке, больше 12 названий.
// Рецензия: пол ролей (списки известных женских и мужских ролей), пьеса с ролью нужного пола, «на каком листе»,
//    земляк не вспоминает «дом» у работы, вышедшей здесь, «в переводе» — только с другого языка, число зрителей — один раз.
// Деньги, известность и время — как раньше (прибавка известности 6/4, настроение +1); случайные числа текст не тратит.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
const SAVE = process.env.SAVE || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra && !ok ? ' — ' + String(extra).slice(0, 700) : '')); };
const TAG = /<script src="creative2752\.js[^"]*"><\/script>/;
// Название в «ёлочках», как его пишет creative2752.js: кавычки внутри названия — „лапки“ («Трамвай „Желание“»).
const Q = t => '«' + String(t ?? '').replace(/«/g, '„').replace(/»/g, '“') + '»';

// Роли каталога, пол которых известен; эвристика по последней букве их путала (Анна Франк — «он», Сима Попович — «она»,
// Бубба из «Лета семнадцатой куклы» и Брейди из «Облика девушки» — «он»).
const FEMALE_ROLES = ['Анна Франк', 'Марго Франк', 'Эдит Франк', 'Молли Ралстон', 'Живка Попович', 'Даница Чворович', 'Соня Чворович', 'Елена Тальберг (урожд. Турбина)',
  'Амалия Йовине', 'Фиона Картер', 'Марикен', 'Баделох', 'Книртье', 'Тандо', 'Туминах', 'Тарсих', 'Эльза Барлоу', 'Кая Фосли', 'Гина Экдаль', 'Эллида Вангель',
  'Алина Сольнес', 'Мэри Масомбока', 'Офелия', 'Гертруда', 'Нина', 'Мэгги', 'Леди Макбет', 'Сольвейг', 'Кей', 'Бубба', 'Брейди', 'Марли', 'Чхуволь', 'Хороших'];
const MALE_ROLES = ['Сима Попович', 'Чеда Урошевич', 'Илия Чворович', 'Джура Чворович', 'Николка Турбин', 'Васенька Сарафанов', 'Энъя Ханган', 'Нана Фаднавис',
  'Тами Мбиквана', 'Уокка Доусон', 'Мишлиния', 'Роима', 'Отто Франк', 'Петер ван Даан', 'Джайлс Ралстон', 'Сержант Троттер', 'Гамлет', 'Лука', 'Хаджи Тома',
  'Ру', 'Барни', 'Сэм', 'Чон', 'Додо'];

async function page(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url()); if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html', f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: BASE && rel === 'index.html' ? fs.readFileSync(f, 'utf8').replace(TAG, '') : rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://game.local/index.html'); await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  return { pg, errors, ctx };
}
async function fresh(browser, country, gender) {
  const P = await page(browser);
  await P.pg.evaluate(([c, g]) => {
    const e = document.getElementById('country'); e.value = c; e.dispatchEvent(new Event('change', { bubbles: true }));
    const gs = document.getElementById('gender'); if (gs) { gs.value = g; gs.dispatchEvent(new Event('change', { bubbles: true })); }
  }, [country, gender]);
  await P.pg.click('text=Родиться'); await P.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await P.pg.evaluate(() => { try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {} if ($('#modal').open) closeModal(); s.pending = []; });
  return P;
}

// Общие помощники внутри страницы (строкой — в каждую страницу).
const HELPERS = `
window.T = {
 modal(){return {title:document.querySelector('#modal h2')?.textContent||'',text:[...document.querySelectorAll('#modal p')].map(p=>p.textContent).join(' | '),
  facts:[...document.querySelectorAll('#modal .detail-section20')].map(x=>x.innerText.replace(/\\s+/g,' ')).join(' | '),all:$('#modal').innerText.replace(/\\s+/g,' ')};},
 close(){if($('#modal').open)closeModal();s.pending=[];},
 month(n=1){for(let i=0;i<n;i++){T.close();if(s.clock.yearDue&&typeof rollYear==='function'){try{transact('year',rollYear)}catch(e){}}T.close();advanceMonth();}T.close();},
 adult(){s.age=Math.max(s.age,32);s.cash=Math.max(s.cash,5e6);s.job=null;s.clock.running=false;s.clock.fatigue=0;
  const sp=specialtyState46();for(const k of ['literature','theatre','finearts','music','cinema','translation','publishing','journalism'])sp.skills[k]=80;},
 friend(n,prof,g,city){const base=s.people.find(p=>p.alive&&p.id!=='player');const p=JSON.parse(JSON.stringify(base));
  Object.assign(p,{id:'friend2752-'+n,role:'Друг',alive:true,age:35,gender:g,name:(g==='f'?'Анна':'Игорь')+' Проверкина'.slice(0,g==='f'?11:10),bond:80,country:s.country,city18:city,unavailable18:false,npcMarried54:false});
  delete p.lifeEvents54;p.bio27={...(p.bio27||{}),job:{profession:prof,title:profession16(prof).title,incomeRatio:1,months:12}};p.occupation=profession16(prof).title;p.inner={...(p.inner||{}),trust:80};
  s.people.push(p);return p;},
 resetOccasions(){const z=events54();z.lastOffer=-100;z.hosts={};for(const q of z.invitations)if(q.status==='offered')q.status='expired';},
 paid(track,pred,over={}){const o0=creativeMarket47(track),o=o0.find(pred||(()=>true))||o0[0];
  const app={id:id16('creativeApp47'),offer:{...o,...over,id:id16('x2752'),samples:0,quality:0,skill:0},status:'offered',tick:s.clock.ticks,until:s.clock.ticks+3,roll:0,probability:1};
  creative47().applications.push(app);const logN=s.log.length;acceptCreative47(app.id);const t=s.clock.tasks.find(t=>t.id===app.task);
  return {t,app,accept:s.log.find(e=>e.title==='Творческий договор принят')};},
 done(t){t.progress=t.duration;t.state='active';const n=s.log.length;finishTask(t);},
 entriesSince(mark){const out=[];for(const e of s.log){if(e===mark)break;out.push(e);}return out;},
 ty:/(?<![А-Яа-яЁё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоего|твоей|твоих|твоим|твою|твоему|твоём)(?![А-Яа-яЁё])/i,
 outside(t){return String(t).replace(/«[^»]*»/g,'');}
};`;

(async () => {
  const browser = await chromium.launch();
  try {
    // ---------- свежая жизнь: Россия, игрок — женщина ----------
    const A = await fresh(browser, 'ru', 'f');
    await A.pg.evaluate(HELPERS);
    const r = await A.pg.evaluate(() => {
      const out = {}; Math.random = seeded269(2752); T.adult();
      if (s.gender !== 'f') s.gender = 'f';
      const city = residenceCity();
      // ----- 1. премьеры близких -----
      const kinds = [['stageactor', 'f', 'Премьера спектакля'], ['stageactor', 'm', 'Премьера спектакля'], ['filmdirector', 'm', 'Премьера фильма'], ['musician', 'f', 'Концерт'],
        ['illustrator', 'm', 'Выставка'], ['staffwriter', 'f', 'Презентация книги'], ['radioeditor', 'm', 'Премьера радиоспектакля'], ['dancer', 'f', 'Премьера танцевального спектакля'], ['setdesigner', 'm', 'Премьера спектакля'], ['literarytranslator', 'f', 'Презентация книги']];
      out.occ = [];
      kinds.forEach(([prof, g, prefix], i) => {
        T.resetOccasions(); const host = T.friend(i, prof, g, city);
        const mark = s.log[0], q = offerOccasion54(host, 'premiere', false);
        const row = { prof, g, prefix, host: host.name, q: !!q };
        if (q) {
          const e = T.entriesSince(mark).find(e => e.title === q.title);
          Object.assign(row, { title: q.title, log: e?.text || '', d: q.premiere2752 || null });
          occasionMenu54(q.id); row.menu = T.modal().text; T.close();
          respondOccasion54(q.id, true); T.close();
          const t = s.clock.tasks.find(t => t.kind === 'occasion54' && t.occasion54 === q.id);
          if (t) { const m2 = s.log[0]; T.done(t); row.after = T.entriesSince(m2).filter(e => e.title === q.title).map(e => e.text); }
          if (q.premiere2752?.play) { const pl = catalog245.plays.find(p => p.id === q.premiere2752.play); row.playOk = !!pl && pl.title === q.premiere2752.title && (!q.premiere2752.role || pl.roles.includes(q.premiere2752.role)); }
          if (q.premiere2752?.role && typeof roleSex2752 === 'function') row.roleSex = roleSex2752(q.premiere2752.role);
          if (prof === 'filmdirector' && q.premiere2752?.story) { const x = stories271.find(x => x.id === q.premiere2752.story); row.filmOk = !!x && x.type === 'film' && [...x.titles.serious, ...x.titles.ironic, ...x.titles.absurd].includes(q.premiere2752.title); }
        }
        out.occ.push(row);
      });
      // авторы пьес без пояснений в скобках, кавычки внутри названия — „лапки“
      out.authors = typeof author2752 === 'function' ? catalog245.plays.filter(p => p.roles?.length).map(p => author2752(p.author)).filter(a => !a || /[();]/.test(a)) : ['нет author2752'];
      out.nested = typeof qt2752 === 'function' ? qt2752('Трамвай «Желание»') : '';
      // в другом городе — поездка
      T.resetOccasions();
      const other = cities[s.country].find(c => c !== residenceCity());
      const far = T.friend(20, 'stageactor', 'm', other), mark = s.log[0];
      const q = offerOccasion54(far, 'premiere', true);
      out.trip = { q: !!q, local: q?.local };
      if (q) {
        const inv = invite53(q.travelInvite), e = T.entriesSince(mark).find(e => e.title === q.title);
        travelInviteMenu53(q.travelInvite); const m = T.modal(); T.close();
        Object.assign(out.trip, { title: q.title, invTitle: inv?.title, log: e?.text || '', menu: m.all, work: q.premiere2752?.title });
        if (inv) { inv.status = 'completed'; const m2 = s.log[0]; T.month(1); out.trip.after = T.entriesSince(m2).filter(e => e.title === q.title).map(e => e.text); }
      }
      // ----- 2–3. работы игрока -----
      const mk = {};
      out.done = {};
      const finish = (k, v) => { const m2 = s.log[0]; T.done(v.t); const w = creative47().works.find(w => w.id === v.t.id); out.done[k] = { card: w ? workMeta60(w).title : null, raw: w?.title, logs: T.entriesSince(m2).map(e => e.title + ' — ' + e.text) }; };
      mk.theatre = T.paid('theatre', o => o.kind === 'casting', { specialty184: 'acting', title: 'Актёрство · Роль в камерном спектакле' }); mk.music = T.paid('music'); mk.finearts = T.paid('finearts');
      for (const k of ['theatre', 'music', 'finearts']) finish(k, mk[k]);
      mk.cinema = T.paid('cinema');
      out.accept = Object.fromEntries(Object.entries(mk).map(([k, v]) => [k, { label: v.accept?.text || '', plan: v.t?.plan2752 || null }]));
      // работа ещё идёт (≥65%) — приглашение заранее, с месяцем
      const up = mk.cinema.t; up.progress = up.duration * .7;
      const z = life61(); z.lastMonth = -1; const rnd = Math.random; Math.random = () => .99; publicityMonth61(); Math.random = rnd;
      const upq = z.notices.find(q => q.type === 'public' && q.sourceTask === up.id);
      out.upcoming = upq ? { title: upq.title, note: upq.note } : null;
      finish('cinema', mk.cinema);
      const th = creative47().works.find(w => w.id === mk.theatre.t.id);
      if (th) { workDetail60(th.id); out.card = T.modal(); T.close(); }
      z.lastMonth = -1; Math.random = () => .99; publicityMonth61(); Math.random = rnd;
      const pubs = z.notices.filter(q => q.type === 'public' && liveNotice61(q));
      out.pub = pubs.map(q => ({ title: q.title, note: q.note, src: q.sourceTask, card: (creative47().works.find(w => w.id === q.sourceTask) && workMeta60(creative47().works.find(w => w.id === q.sourceTask)).title) }));
      const g1 = T.friend(30, 'stageactor', 'f', residenceCity()), g2 = T.friend(31, 'musician', 'm', residenceCity());
      out.fin = [];
      pubs.forEach((q, i) => {
        q.guests = i === 0 ? [] : i === 1 ? [g1.id] : [g1.id, g2.id]; reservePublic61(q.id);
        const t = s.clock.tasks.find(t => t.id === q.task); if (!t) return;
        z.exposure[s.country] = 40; const ex = z.exposure[s.country], m2 = s.log[0];
        T.done(t);
        out.fin.push({ title: q.title, guests: q.guests.length, delta: z.exposure[s.country] - ex, logs: T.entriesSince(m2).map(e => [e.title, e.text]) });
      });
      // интервью: прибавка известности 4
      z.lastInterview = -100; z.lastMonth = -1; Math.random = () => .01; publicityMonth61(); Math.random = rnd;
      const iq = z.notices.filter(q => q.type === 'interview').at(-1);
      out.interview = iq ? { note: iq.note } : null;
      if (iq) { reservePublic61(iq.id); const t = s.clock.tasks.find(t => t.id === iq.task); z.exposure[s.country] = 40; const m2 = s.log[0]; T.done(t); out.interview.delta = z.exposure[s.country] - 40; out.interview.logs = T.entriesSince(m2).map(e => [e.title, e.text]); }
      // отбор и провал
      const w = creative47().works.find(w => w.id === mk.music.t.id);
      if (w) { w.quality = 90; submitShowcase198(w.id); const t = s.clock.tasks.filter(t => t.kind === 'showcase198').at(-1); out.showLabel = t?.label; if (t) { t.roll198 = 0.001; const m2 = s.log[0]; t.progress = t.duration; t.state = 'active'; finishTask(t); out.show = T.entriesSince(m2).map(e => e.title + ' — ' + e.text); } out.showCard = workMeta60(w).title; }
      specialtyState46().skills.finearts = 5; const bad = T.paid('finearts'); { const m2 = s.log[0]; T.done(bad.t); const bw = creative47().works.find(w => w.id === bad.t.id); out.flop = { card: bw && workMeta60(bw).title, q: bw?.quality, logs: T.entriesSince(m2).map(e => e.title + ' — ' + e.text) }; }
      specialtyState46().skills.finearts = 80;
      // больше 12 названий: 36 своих работ по всем направлениям
      const tracks = ['literature', 'translation', 'publishing', 'journalism', 'finearts', 'cinema', 'theatre', 'music'];
      for (let i = 0; i < 36; i++) { const tr = tracks[i % tracks.length]; s.clock.tasks.filter(t => t.kind === 'creativeWork47' && !['completed', 'cancelled'].includes(t.state)).forEach(t => t.state = 'cancelled'); sampleWork47(tr); const t = creativeTasks47().at(-1); if (t) T.done(t); }
      const samples = creative47().works.filter(w => w.kind === 'sample').map(w => workMeta60(w).title);
      out.samples = { n: samples.length, distinct: new Set(samples).size, old12: samples.filter(t => titles60.includes(t)).length, list: samples.slice(0, 12) };
      out.errors2752 = window.__errors2752 || [];
      return out;
    });
    // --- проверки: премьеры близких ---
    for (const o of r.occ) {
      const L = o.prof + ' (' + o.g + ')';
      check(o.q && o.title === o.prefix + ' · ' + o.host, `премьера близкого ${L}: заголовок «${o.prefix} · Имя»`, JSON.stringify(o).slice(0, 400));
      check(/«[^»]+»/.test(o.log || '') && o.d?.title && o.log.includes(Q(o.d.title)), `премьера близкого ${L}: в записи названа работа`, o.log);
      check(/вечера\./.test(o.log || '') && /· Россия/.test(o.log || ''), `премьера близкого ${L}: где и когда`, o.log);
      check((o.menu || '').includes(Q(o.d?.title)), `премьера близкого ${L}: работа названа в окне`, o.menu);
      check(o.after?.length === 1 && o.after[0] !== 'Провели время вместе.' && o.after[0].includes(Q(o.d?.title)), `премьера близкого ${L}: после — строка, как прошло`, JSON.stringify(o.after));
    }
    const act = r.occ.filter(o => o.prof === 'stageactor');
    check(act.every(o => o.playOk && o.d?.role && o.roleSex === o.g && o.log.includes('роль — ' + o.d.role)), 'актёр: пьеса из каталога и роль по полу', JSON.stringify(act.map(o => [o.d?.title, o.d?.role, o.roleSex, o.g])));
    check(r.occ.find(o => o.prof === 'filmdirector')?.filmOk, 'кино: название фильма из сюжетов 271', JSON.stringify(r.occ.find(o => o.prof === 'filmdirector')?.d));
    check(/программа «/.test(r.occ.find(o => o.prof === 'musician')?.log || ''), 'музыкант: концерт с программой', r.occ.find(o => o.prof === 'musician')?.log);
    check(/выставки «/.test(r.occ.find(o => o.prof === 'illustrator')?.log || ''), 'иллюстратор: выставка', r.occ.find(o => o.prof === 'illustrator')?.log);
    check(/презентацию (книги|романа|повести) «/.test(r.occ.find(o => o.prof === 'staffwriter')?.log || ''), 'писатель: презентация книги (романа, повести)', r.occ.find(o => o.prof === 'staffwriter')?.log);
    const sd = r.occ.find(o => o.prof === 'setdesigner'), tr = r.occ.find(o => o.prof === 'literarytranslator');
    check(sd?.after?.length && sd.after.every(t => !/сбил|роль/i.test(t)) && /Декорац/.test(sd.log), 'сценограф: в приглашении декорации, после — не про роль', JSON.stringify(sd));
    check(tr?.after?.length && /переводе/.test(tr.log) && tr.after.some(t => /переводчиц/.test(t)), 'переводчица: презентация её перевода, после — про перевод', JSON.stringify(tr));
    check(r.authors.length === 0, 'авторы пьес без скобок и пояснений', JSON.stringify(r.authors));
    check(r.nested === '«Трамвай „Желание“»', 'кавычки внутри названия — „лапки“', r.nested);
    const T1 = r.trip;
    check(T1.q && !T1.local && T1.title?.startsWith('Премьера спектакля · ') && T1.invTitle === T1.title, 'премьера в другом городе: заголовок у приглашения и поездки', JSON.stringify(T1).slice(0, 400));
    check(T1.log?.includes(Q(T1.work)) && T1.menu?.includes(Q(T1.work)), 'премьера в другом городе: работа в записи и в окне поездки', JSON.stringify([T1.log, T1.menu]).slice(0, 600));
    check(T1.after?.length === 1 && T1.after[0].includes(Q(T1.work)), 'премьера в другом городе: после поездки — строка, как прошло', JSON.stringify(T1.after));
    // --- работы игрока ---
    for (const [k, v] of Object.entries(r.done)) {
      const add = v.logs.find(l => l.startsWith('Работа добавлена в портфолио'));
      check(v.card && add?.includes(Q(v.card)) && !add.includes('«' + v.raw + '»'), `${k}: в «Истории» то же название, что в карточке («${v.card}»)`, add);
      check(r.accept[k].label.includes(Q(v.card)), `${k}: название видно уже в записи о договоре`, r.accept[k].label);
    }
    check(/Пьеса «[^»]+»/.test(r.card?.facts || '') && /Роль /.test(r.card?.facts || ''), 'карточка спектакля: пьеса и роль', r.card?.facts);
    check(r.card?.title === '«' + r.done.theatre.card + '»', 'карточка: заголовок — то же название', r.card?.title);
    check(r.upcoming && r.upcoming.title === 'Премьера фильма ' + Q(r.done.cinema.card) && /премьера ожидается в [а-я]+е\./.test(r.upcoming.note), 'премьера в работе: название и месяц заранее, то же название потом', JSON.stringify(r.upcoming) + ' / ' + r.done.cinema.card);
    const expect = { 'Премьера спектакля': 'состоялась', 'Концерт': 'состоялся', 'Открытие выставки': 'состоялось', 'Премьера фильма': 'состоялась' };
    check(r.pub.length >= 3 && r.pub.every(q => q.card && q.title.endsWith(Q(q.card))), 'окна премьер, концертов, выставок называют работу', JSON.stringify(r.pub));
    for (const f of r.fin) {
      const base = Object.keys(expect).find(b => f.title.startsWith(b)), done = f.logs.find(l => /состоял/.test(l[0]));
      check(done && done[0] === f.title + ' ' + expect[base], `итог: «${f.title} ${expect[base]}» (род)`, JSON.stringify(f.logs));
      check(done && !/приглашённых/.test(done[1]) && /«[^»]+»/.test(done[1]) && /«[^»]*»,? —/.test(done[1]), `итог «${f.title}»: работа, реакция зала, реплика`, done?.[1]);
      const gl = f.guests === 0 ? !/приглаш/.test(done?.[1] || '') : f.guests === 1 ? /(пришла|пришёл) по вашему приглашению/.test(done?.[1] || '') : /пришли 2 гостя: .+ и .+\./.test(done?.[1] || '');
      check(gl, `итог «${f.title}»: гостей ${f.guests} — правильная форма`, done?.[1]);
      check(f.delta === 6, `итог «${f.title}»: известность +6, как раньше`, f.delta);
    }
    check(r.interview && /хочет поговорить о ваш(ем|ей|их) [^«]+«[^»]+»/.test(r.interview.note), 'интервью: в приглашении названа работа', r.interview?.note);
    const iv = r.interview?.logs?.find(l => l[0] === 'Интервью состоялось');
    check(iv && /разговор о ваш/.test(iv[1]) && /спросил[а]?: «[^»]+»/.test(iv[1]) && !/приглашённых/.test(iv[1]), 'интервью: итог с работой и вопросом, без «0 приглашённых»', iv?.[1]);
    check(r.interview?.delta === 4, 'интервью: известность +4, как раньше', r.interview?.delta);
    check(r.show?.some(l => l.includes(Q(r.showCard))) && r.showLabel?.endsWith(Q(r.showCard)), 'отбор: в записи и в расписании то же название', JSON.stringify([r.show, r.showLabel, r.showCard]));
    const flop = r.flop.logs.find(l => l.startsWith('Провал'));
    check(!flop || flop.includes(Q(r.flop.card)), 'провал: то же название', JSON.stringify(r.flop));
    check(r.samples.n >= 30 && r.samples.distinct >= r.samples.n - 1 && r.samples.distinct > 12, `больше 12 названий: ${r.samples.distinct} разных на ${r.samples.n} работ`, JSON.stringify(r.samples));
    check(r.samples.old12 <= 2, 'новые названия не из прежних 12', JSON.stringify(r.samples));
    check(!r.errors2752?.length, 'без ошибок текста (creative2752)', JSON.stringify(r.errors2752).slice(0, 500));

    // ---------- голоса на улице: одна работа с сюжетом 271, затем все ----------
    const v = await A.pg.evaluate(() => {
      const out = {}; const z = life61();
      // тон: малая известность — путают; ни одержимых, ни коллег
      s.voices2752 = { recent: [], said: {} }; z.exposure[s.country] = 5; for (const r of Object.values(s.reputation262 || {})) r.value = 1;
      const whoLow = []; for (let i = 0; i < 12; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (q) whoLow.push(q.voice2752?.who); s.clock.ticks++; }
      out.whoLow = whoLow;
      // сюжет 271: книга с темами
      const st = stories271.find(x => x.type === 'book' && x.format === 'full' && !x.retired && x.keywords.length >= 3);
      const p = createBook27(st.titles.serious[1], 'Роман', 12, { id: st.id, title: st.titles.serious[1], synopsis: st.synopsis, genre: st.genre, format: 'full' });
      p.status = 'published'; p.critics = 80; p.audience = 70; p.contract = { months: 24, total: 1, country: s.country }; p.paidMonths = 24; p.released = s.clock.ticks; p.quality = 82;
      creative47();
      const bookW = creative47().works.find(w => w.source === p.id);
      out.book = { title: p.title, themes: st.keywords, id: bookW?.id };
      // только эта книга на виду: прочие работы на время — не публичные
      const keep = creative47().works.map(w => [w, w.kind, w.showcase198]); for (const w of creative47().works) if (w !== bookW) { if (w.kind === 'paid') w.kind = 'sample2752'; w.showcase198 = null; }
      s.voices2752 = { recent: [], said: {} }; z.exposure[s.country] = 45;
      const rows = [];
      for (let i = 0; i < 26; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (!q) { rows.push(null); s.clock.ticks++; continue; }
        const ans = ['chat', 'wave', 'leave'][i % 3]; s.mood = 50; s.clock.fatigue = 10; const m0 = s.mood, f0 = s.clock.fatigue; respondRecognition61(q.id, ans);
        const e = s.log.find(e => e.decision24?.kind === 'life61' && e.decision24.id === q.id);
        rows.push({ note: q.note, who: q.voice2752?.who, tpl: q.voice2752?.tpl, work: q.voice2752?.work, ans, entry: e?.text, mood: s.mood - m0, fat: s.clock.fatigue - f0 }); s.clock.ticks++; }
      out.book.rows = rows;
      for (const [w, k, sc] of keep) { w.kind = k; w.showcase198 = sc; }
      // все работы, высокая известность
      s.voices2752 = { recent: [], said: {} }; z.exposure[s.country] = 90;
      const all = [];
      for (let i = 0; i < 30; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (q) all.push({ note: q.note, who: q.voice2752?.who, tpl: q.voice2752?.tpl, work: q.voice2752?.work }); s.clock.ticks++; }
      out.all = all; out.recentLen = s.voices2752.recent.length; out.saidLen = Object.keys(s.voices2752.said).length;
      out.titles = Object.fromEntries(creative47().works.map(w => [w.id, w.kind === 'book' ? w.title : workMeta60(w).title]));
      // низкое качество: недовольные
      for (const w of creative47().works) if (w.kind === 'paid' || w.kind === 'book') w.__k = w.kind;
      const lowW = creative47().works.find(w => w.kind === 'paid' && w.track === 'theatre'); const kinds = creative47().works.map(w => [w, w.kind, w.showcase198]);
      for (const w of creative47().works) if (w !== lowW) { if (w.kind === 'paid' || w.kind === 'book') w.kind = 'sample2752'; w.showcase198 = null; }
      const q0 = lowW.quality; lowW.quality = 30; s.voices2752 = { recent: [], said: {} }; z.exposure[s.country] = 40;
      const lowWho = []; for (let i = 0; i < 14; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (q) lowWho.push(q.voice2752?.who); s.clock.ticks++; }
      lowW.quality = q0; for (const [w, k, sc] of kinds) { w.kind = k; w.showcase198 = sc; } out.lowWho = lowWho;
      // случайные числа игры текст не тратит
      let n = 0; const rnd = Math.random; Math.random = () => { n++; return rnd(); };
      try { voice2752('probe|1'); interviewOffer2752('probe|2'); premiereWork2752(s.people.find(p => p.id.startsWith('friend2752')), { id: 'probe-3', country: s.country }); makePlan2752('probe-4', 'theatre', 'Роль в постановке', 'acting', null, 1, s.country); } catch (e) { out.probeErr = String(e); }
      Math.random = rnd; out.randomCalls = n;
      out.errors2752 = window.__errors2752 || [];
      return out;
    });
    check(v.whoLow.length >= 8 && !v.whoLow.some(w => ['obsessed', 'odd', 'colleague'].includes(w)) && v.whoLow.filter(w => w === 'mixup').length >= 2, 'малая известность: путают с кем-то, без одержимых и коллег', JSON.stringify(v.whoLow));
    const rows = v.book.rows.filter(Boolean);
    check(rows.length >= 20 && rows.every(x => x.note.includes(v.book.title)), 'на улице всегда названа работа (книга с сюжетом 271)', JSON.stringify(rows.slice(0, 3)));
    check(rows.every(x => /«[^»]+»/.test(x.note)), 'прямая речь в «ёлочках»', rows.find(x => !/«[^»]+»/.test(x.note))?.note);
    check(rows.every(x => !/Прохожий узнал вашу работу/.test(x.note)), 'старого одинакового текста нет');
    check(rows.some(x => v.book.themes.some(t => x.note.includes('— ' + t))), 'тема из данных сюжета звучит в реплике', JSON.stringify(v.book.themes));
    const tpls = rows.map(x => x.tpl);
    check(new Set(tpls).size === tpls.length, `без повторов: ${tpls.length} встреч — ${new Set(tpls).size} разных заготовок`, JSON.stringify(tpls));
    check(rows.filter(x => x.ans === 'chat').every(x => x.entry.length > x.note.length + 20) && rows.filter(x => x.ans === 'leave').every(x => x.entry === x.note), '«Поговорить немного» — продолжение в той же записи, «Продолжить свой путь» — без добавки', JSON.stringify(rows.filter(x => x.ans !== 'wave').slice(0, 2)));
    check(rows.filter(x => x.ans === 'chat').every(x => x.mood === 1 && x.fat === 1) && rows.filter(x => x.ans !== 'chat').every(x => x.mood === 0), 'настроение и усталость — как раньше (+1 после разговора)', JSON.stringify(rows.map(x => [x.ans, x.mood, x.fat])));
    const allRows = v.all;
    check(allRows.length >= 25 && allRows.every(x => x.work && x.note.includes(v.titles[x.work])), 'все работы: в каждой встрече названа одна из работ игрока', JSON.stringify(allRows.find(x => !x.work || !x.note.includes(v.titles[x.work]))));
    check(new Set(allRows.map(x => x.work)).size >= 4, 'разные работы по очереди', JSON.stringify(allRows.map(x => x.work)));
    const whos = new Set(allRows.map(x => x.who));
    check(whos.size >= 6, `разные люди: ${[...whos].join(', ')}`);
    check(allRows.every(x => !T_ty(T_out(x.note))), '«ты» вне кавычек нет', allRows.find(x => T_ty(T_out(x.note)))?.note);
    check(allRows.filter(x => T_ty(x.note)).every(x => x.who === 'colleague') && [...rows, ...allRows].filter(x => T_ty(x.note)).length >= 1, '«ты» — только у коллеги, внутри реплики', JSON.stringify(allRows.filter(x => T_ty(x.note) && x.who !== 'colleague')));
    const tp2 = allRows.map(x => x.tpl);
    check(new Set(tp2).size === tp2.length && v.recentLen <= 30 && v.saidLen <= 40, `память заготовок: 30 встреч без повтора, хранится ${v.recentLen}/30 и ${v.saidLen} работ`, JSON.stringify(tp2));
    check(v.lowWho.filter(w => w === 'unhappy' || w === 'colleague').length >= 2, 'слабая работа: недовольные и честный коллега', JSON.stringify(v.lowWho));
    check(v.randomCalls === 0 && !v.probeErr, 'тексты не тратят случайные числа игры', v.randomCalls + ' ' + (v.probeErr || ''));
    check(!v.errors2752?.length, 'без ошибок текста (голоса)', JSON.stringify(v.errors2752).slice(0, 500));
    // ---------- рецензия 275.2: роли, пьесы, «листе», земляки, зрители ----------
    const rv = await A.pg.evaluate(([FEM, MAL]) => {
      const out = {};
      const inCatalog = new Set(catalog245.plays.flatMap(p => p.roles || []));
      out.missing = [...FEM, ...MAL].filter(r => !inCatalog.has(r));
      const sex = typeof roleSex2752 === 'function' ? roleSex2752 : () => '?';
      out.femWrong = FEM.filter(r => sex(r) !== 'f'); out.malWrong = MAL.filter(r => sex(r) !== 'm');
      const fem = new Set(FEM), mal = new Set(MAL), ccs = Object.keys(countries);
      // премьеры близких: актёр и актриса, все 25 стран (Нидерланды и Сербия — чаще)
      out.host = { m: { n: 0, noRole: [], wrong: [], notInPlay: [] }, f: { n: 0, noRole: [], wrong: [], notInPlay: [] } };
      if (typeof premiereWork2752 === 'function') for (const g of ['m', 'f']) for (const cc of ccs) for (let i = 0; i < (['nl', 'rs'].includes(cc) ? 400 : 100); i++) {
        const d = premiereWork2752({ gender: g, bio27: { job: { profession: 'stageactor' } } }, { id: 'occ2752-' + g + cc + i, country: cc }), o = out.host[g]; o.n++;
        if (!d?.role) { o.noRole.push(cc + ': ' + d?.title); continue; }
        if ((g === 'm' ? fem : mal).has(d.role)) o.wrong.push(cc + ': ' + d.title + ' — ' + d.role);
        if (!catalog245.plays.find(p => p.id === d.play)?.roles.includes(d.role)) o.notInPlay.push(d.title + ' — ' + d.role);
      }
      // работа игрока-актёра: пьеса и роль своего пола
      const g0 = s.gender; out.plan = { m: { n: 0, noRole: [], wrong: [] }, f: { n: 0, noRole: [], wrong: [] } };
      if (typeof makePlan2752 === 'function') for (const g of ['m', 'f']) { s.gender = g; for (const cc of ccs) for (let i = 0; i < (['nl', 'rs', 'ru'].includes(cc) ? 150 : 40); i++) {
        const p = makePlan2752('w2752-' + g + cc + i, 'theatre', 'Актёрство · Роль в постановке', 'acting', null, 1, cc), o = out.plan[g]; o.n++;
        if (!p.role) o.noRole.push(cc + ': ' + p.title); else if ((g === 'm' ? fem : mal).has(p.role)) o.wrong.push(cc + ': ' + p.title + ' — ' + p.role);
      } }
      s.gender = g0;
      // «Я знаю, на какой странице / на каком листе вы передумали» — для каждого вида искусства
      const works = creative47().works, byTrack = tr => works.find(w => w.kind === 'paid' && w.track === tr) || works.find(w => w.track === tr);
      out.folder = {};
      if (typeof voiceTemplates2752 !== 'undefined') { const t = voiceTemplates2752.find(t => t.id === 'fan-folder');
        for (const tr of ['literature', 'theatre', 'music', 'finearts']) { const w = byTrack(tr); if (!w) continue; const I = info2752(w); out.folder[I.medium] = t.text(I, voiceCtx2752(I, null, 'folder|' + tr)); } }
      // земляк: работа вышла здесь — ни «из дома», ни «до переезда», ни «дома все знают»; вышла на родине — можно
      const th = works.find(w => w.kind === 'paid' && w.track === 'theatre'), bc = s.birthCountry, cc0 = th?.country;
      s.birthCountry = s.country === 'it' ? 'nl' : 'it';
      const countryTexts = () => { const I = info2752(th), x = { L: 1, low: false, I2: null, I2old: null };
        return voiceTemplates2752.filter(t => t.who === 'countryman' && (!t.media || t.media.includes(I.medium)) && (!t.need || t.need(I, x))).map(t => [t.id, t.text(I, voiceCtx2752(I, null, 'home|' + t.id))]); };
      if (th && typeof voiceTemplates2752 !== 'undefined') {
        out.homeLocal = { local: info2752(th).local, texts: countryTexts() };
        th.country = s.birthCountry; out.homeAway = { local: info2752(th).local, texts: countryTexts() }; th.country = cc0;
        // и в настоящих встречах: только этот спектакль на виду
        const keep = works.map(w => [w, w.kind, w.showcase198]); for (const w of works) if (w !== th) { if (w.kind === 'paid' || w.kind === 'book') w.kind = 'sample2752'; w.showcase198 = null; }
        const z = life61(); s.voices2752 = { recent: [], said: {} }; z.exposure[s.country] = 45; out.homeMeets = [];
        for (let i = 0; i < 40; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (q?.voice2752?.who === 'countryman') out.homeMeets.push(q.note); s.clock.ticks++; }
        for (const [w, k, sc] of keep) { w.kind = k; w.showcase198 = sc; }
      }
      s.birthCountry = bc;
      // итог выставки, концерта, спектакля, фильма: сколько пришло людей — один раз, соседние фразы не начинаются одним словом
      out.hall = { lowAll: [], doubled: [], clash: [], mid: [], all: 0, echo: [], lowKinds: {}, hiFew: 0, fewCrowd: [] };
      if (typeof publicDone2752 === 'function') { const z = life61(), e0 = z.exposure[s.country];
        for (const tr of ['finearts', 'music', 'theatre', 'cinema']) { const w = byTrack(tr); if (!w) continue; const q0 = w.quality;
          for (const qv of [30, 60, 85]) { w.quality = qv;
            for (const ex of [5, 40, 90]) { z.exposure[s.country] = ex; for (let i = 0; i < 30; i++) { const t = publicDone2752({ id: 'pub2752-' + tr + qv + ex + '-' + i, work2752: w.id, track: w.track, guests: [] });
              out.hall.all++;
              if (/(^|\. )([А-ЯЁ][а-яё]{2})[а-яё]*[^.«»]*\. \2/.test(t)) out.hall.echo.push(t);
              // хорошая выставка при малой известности: «Посетителей немного» и «не протолкнуться» — не вместе
              if (qv === 85 && ex === 5 && tr === 'finearts') out.hall.hiFew++;
              if (/Посетителей немного|Зал заполнен наполовину/.test(t) && /не протолкнуться|очередь/.test(t)) out.hall.fewCrowd.push(t);
              if (qv !== 30) continue;
              if (ex === 40) out.hall.mid.push(t); else { out.hall.lowAll.push(t); (out.hall.lowKinds[tr + ex] ??= new Set()).add(t); }
              if (/Посетителей немного|Зал заполнен наполовину/.test(t) && /Народу было немного|В зале было свободно/.test(t)) out.hall.doubled.push(t);
              if (/У входа очередь|Билеты кончились/.test(t) && /Народу было немного|В зале было свободно/.test(t)) out.hall.clash.push(t); } } }
          w.quality = q0; }
        z.exposure[s.country] = e0;
        out.hall.lowKinds = Object.fromEntries(Object.entries(out.hall.lowKinds).map(([k, v]) => [k, v.size])); }
      // выборы по одному событию независимы: строка зала и реплика, зал и день не идут всегда парой
      out.pairs = null;
      if (typeof pickH2752 === 'function') { let same = 0, ones = 0; const N = 2000;
        for (let i = 0; i < N; i++) { const k = 'life61-' + (i + 1) + '|' + (i * 3) + '|hall', a = pickH2752([0, 1], k + '|h'), b = pickH2752([0, 1], k + '|v'); same += a === b; ones += a; }
        out.pairs = { same: same / N, ones: ones / N }; }
      out.errors2752 = window.__errors2752 || [];
      return out;
    }, [FEMALE_ROLES, MALE_ROLES]);
    check(!rv.missing.length, 'списки ролей для проверки — из каталога', JSON.stringify(rv.missing));
    check(!rv.femWrong.length && !rv.malWrong.length, 'пол ролей: женские роли с фамилией или на согласную — женские, мужские на -а — мужские', JSON.stringify([rv.femWrong, rv.malWrong]));
    for (const g of ['m', 'f']) {
      const o = rv.host[g], L = g === 'm' ? 'актёр' : 'актриса';
      check(o.n >= 3000 && !o.wrong.length, `премьера близкого (${L}, 25 стран, ${o.n}): роль своего пола`, JSON.stringify(o.wrong.slice(0, 6)));
      check(o.n >= 3000 && !o.noRole.length && !o.notInPlay.length, `премьера близкого (${L}): пьеса, где есть роль, и роль из этой пьесы`, JSON.stringify([o.noRole.slice(0, 6), o.notInPlay.slice(0, 3)]));
      const pl = rv.plan[g];
      check(pl.n >= 1000 && !pl.wrong.length && !pl.noRole.length, `работа игрока (${L}, 25 стран, ${pl.n}): спектакль с ролью своего пола`, JSON.stringify([pl.wrong.slice(0, 5), pl.noRole.slice(0, 5)]));
    }
    check(/на каком листе/.test(rv.folder.look || '') && /на какой странице/.test(rv.folder.read || '') && !Object.values(rv.folder).some(t => /какой листе/.test(t)), '«Я знаю, на каком листе вы передумали» (род)', JSON.stringify(rv.folder));
    const homeBad = /из дома|до переезда|Дома все знают/;
    check(rv.homeLocal?.local && rv.homeLocal.texts.length >= 1 && rv.homeLocal.texts.every(([, t]) => !homeBad.test(t)), 'земляк и спектакль, поставленный здесь: без «из дома» и «до переезда», но земляк есть', JSON.stringify(rv.homeLocal));
    check(rv.homeAway && !rv.homeAway.local && rv.homeAway.texts.some(([, t]) => /до переезда|Дома все знают/.test(t)) && rv.homeAway.texts.every(([id]) => id !== 'home-mother'), 'земляк и спектакль с родины: «ещё дома, до переезда»; спектакль «из дома» не присылают', JSON.stringify(rv.homeAway));
    check(rv.homeMeets && rv.homeMeets.every(t => !homeBad.test(t)), `встречи эмигранта со спектаклем, поставленным здесь (${rv.homeMeets?.length} земляков): без «дома»`, JSON.stringify(rv.homeMeets));
    check(rv.hall.lowAll.length >= 200 && !rv.hall.doubled.length, 'итог выставки и концерта: «посетителей немного» не повторяется следующей фразой', rv.hall.doubled[0]);
    check(rv.hall.all >= 1000 && !rv.hall.echo.length, `итог: соседние фразы не начинаются одним словом («Посетителей немного. Посетители…»), ${rv.hall.all} текстов`, rv.hall.echo[0]);
    check(Object.keys(rv.hall.lowKinds).length >= 8 && Object.values(rv.hall.lowKinds).every(n => n >= 3), 'слабая работа при любой известности: итог не одной и той же фразой', JSON.stringify(rv.hall.lowKinds));
    check(rv.hall.lowAll.length >= 200 && !rv.hall.clash.length, 'итог: «у входа очередь» и «народу было немного» не вместе', rv.hall.clash[0]);
    check(rv.hall.hiFew >= 30 && !rv.hall.fewCrowd.length, `итог хорошей выставки при малой известности (${rv.hall.hiFew}): «посетителей немного» и «не протолкнуться» не вместе`, rv.hall.fewCrowd[0]);
    check(rv.hall.mid.some(t => /Народу было немного/.test(t)), 'строка «Народу было немного» осталась там, где о зрителях ещё не сказано', rv.hall.mid.length);
    check(rv.pairs && rv.pairs.same > .4 && rv.pairs.same < .6 && rv.pairs.ones > .4 && rv.pairs.ones < .6, 'выборы текста независимы (строка зала и реплика — не всегда парой)', JSON.stringify(rv.pairs));
    check(!rv.errors2752?.length, 'без ошибок текста (рецензия)', JSON.stringify(rv.errors2752).slice(0, 500));
    check(A.errors.length === 0, 'свежая жизнь: без ошибок страницы', A.errors.slice(0, 3).join(' | '));
    await A.ctx.close();

    // ---------- свежая жизнь: Австралия, мужчина, полгода игры ----------
    const B = await fresh(browser, 'au', 'm');
    await B.pg.evaluate(HELPERS);
    const b = await B.pg.evaluate(() => {
      Math.random = seeded269(27522); T.adult(); const z = life61(); z.score = 40; z.exposure[s.country] = 50;
      for (const tr of ['theatre', 'music', 'finearts', 'cinema']) { const x = T.paid(tr); if (x.t) x.t.progress = x.t.duration - 1; }
      s.clock.running = false; T.month(8);
      const notes = z.notices.filter(q => ['recognition', 'interview', 'public'].includes(q.type)).map(q => [q.type, q.title, q.note]);
      return { notes, errors2752: window.__errors2752 || [] };
    });
    check(b.notes.filter(n => n[0] === 'public').every(n => /«[^»]+»/.test(n[1])), 'полгода игры: окна премьер с названиями', JSON.stringify(b.notes).slice(0, 500));
    check(!b.errors2752.length && B.errors.length === 0, 'полгода игры: без ошибок', JSON.stringify([b.errors2752, B.errors]).slice(0, 500));
    // «в переводе» — только если книга вышла на другом языке: в Австралии книга из Великобритании — не перевод, из Франции — перевод
    const tb = await B.pg.evaluate(() => {
      if (typeof voiceTemplates2752 === 'undefined') return null;
      const st = stories271.find(x => x.type === 'book' && x.format === 'full' && !x.retired);
      const p = createBook27(st.titles.serious[2], 'Роман', 12, { id: st.id, title: st.titles.serious[2], synopsis: st.synopsis, genre: st.genre, format: 'full' });
      p.status = 'published'; p.critics = 80; p.audience = 70; p.paidMonths = 24; p.released = s.clock.ticks; p.quality = 82;
      creative47(); const w = creative47().works.find(w => w.source === p.id), ids = ['student-translated', 'old-translated'];
      const fit = cc => { p.contract = { months: 24, total: 1, country: cc }; const I = info2752(w), x = { L: 1, low: false };
        return ids.filter(id => voiceTemplates2752.find(t => t.id === id).need(I, x)); };
      return { uk: fit('uk'), fr: fit('fr'), au: fit('au') };
    });
    check(tb && !tb.uk.length && !tb.au.length && tb.fr.length === 2, '«в переводе» — только с другого языка (Австралия: книга из Великобритании — нет, из Франции — да)', JSON.stringify(tb));
    await B.ctx.close();

    // ---------- сохранение владелицы (если указано) ----------
    if (SAVE && fs.existsSync(SAVE)) {
      const C = await page(browser);
      await C.pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, fs.readFileSync(SAVE, 'utf8'));
      await C.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
      await C.pg.evaluate(HELPERS);
      const o = await C.pg.evaluate(() => {
        T.close(); try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); } catch (e) {} T.close();
        const out = {}; const before = creative47().works.map(w => w.id + '=' + (w.details60?.title || '')), logBefore = s.log.map(e => [e, e.title + '\n' + e.text]);
        const legacy = creative27().projects.map(p => p.story189?.synopsis).filter(Boolean);
        const books = creative27().projects.filter(p => p.status === 'published').map(p => p.title);
        const z = life61(); const rows = []; const mark = s.log[0];
        for (let i = 0; i < 24; i++) { z.lastStreet = -100; s.clock.fatigue = 0; const q = recognition61(); if (q) { respondRecognition61(q.id, i % 2 ? 'chat' : 'wave'); rows.push({ note: q.note, who: q.voice2752?.who, tpl: q.voice2752?.tpl, work: q.voice2752?.work }); } s.clock.ticks++; }
        out.rows = rows; out.books = books;
        out.homeBad = rows.filter(r => r.who === 'countryman' && /из дома|до переезда|Дома все знают/.test(r.note)).filter(r => { const w = creative47().works.find(w => w.id === r.work);
          return !(typeof fromHome2752 === 'function' && w && fromHome2752(info2752(w))); }).map(r => r.note);
        out.legacyQuoted = rows.filter(r => legacy.some(t => { for (let k = 0; k + 30 <= t.length; k += 15) if (r.note.includes(t.slice(k, k + 30))) return true; return false; })).length;
        const iq = notice61('interview', 'Приглашение на интервью', 'Культурная редакция хочет поговорить о вашей работе. Участие добровольное, гонорар не обещан.', { country: s.country, city: residenceCity(), guests: [] }, s.clock.ticks + 3);
        out.interview = iq.note; reservePublic61(iq.id); const t = s.clock.tasks.find(t => t.id === iq.task); const m2 = s.log[0]; if (t) T.done(t); out.interviewDone = T.entriesSince(m2).map(e => e.title + ' — ' + e.text);
        const friend = s.people.find(p => p.alive && profession16(p.bio27?.job?.profession)?.id === 'musician');
        if (friend) { friend.bond = 80; friend.city18 = residenceCity(); friend.country = s.country; friend.role = 'Друг'; T.resetOccasions(); const q = offerOccasion54(friend, 'premiere', false); out.occ = q ? { title: q.title, name: friend.name, log: s.log.find(e => e.title === q.title)?.text } : null; }
        const after = creative47().works.map(w => w.id + '=' + (w.details60?.title || ''));
        out.sameTitles = JSON.stringify(before) === JSON.stringify(after.slice(0, before.length));
        // Лента упирается в 500 записей и сама убирает старые некрупные; оставшиеся прежние записи должны быть как были.
        const kept = logBefore.filter(([e]) => s.log.includes(e)); out.oldLogSame = kept.length >= 100 && kept.every(([e, x]) => e.title + '\n' + e.text === x); out.oldKept = kept.length;
        T.month(6);
        out.errors2752 = window.__errors2752 || [];
        return out;
      });
      check(o.rows.length >= 20 && o.rows.every(r => o.books.some(t => r.note.includes('„' + t + '“') || r.note.includes('«' + t + '»'))), 'сохранение владелицы: на улице называют её книги', JSON.stringify(o.rows.slice(0, 2)));
      const generic = /(роман|повест|книг|детектив)[а-я]*\s[„«]|„[^“]+“ — в честь ваше(го|й) (романа|повести|книги|детектива)/i; // кличка кота — название без склонения, родовое слово рядом
      check(o.rows.every(r => generic.test(r.note)), 'сохранение владелицы: название с родовым словом («роман „Смена“»)', o.rows.find(r => !generic.test(r.note))?.note);
      check(o.legacyQuoted === 0, 'старые краткие содержания (с ошибками в падежах) не цитируются');
      check(new Set(o.rows.map(r => r.tpl)).size === o.rows.length, 'сохранение владелицы: без повторов', JSON.stringify(o.rows.map(r => r.tpl)));
      check(o.rows.some(r => r.who === 'countryman' && /на итальянский/.test(r.note)), 'эмигрант: земляк переходит на итальянский', JSON.stringify(o.rows.map(r => r.who)));
      check(!o.homeBad.length, 'эмигрант: «ещё дома» и «из дома» — только о работах, вышедших не здесь', JSON.stringify(o.homeBad));
      check(/о вашем (романе|повести)|о вашей (повести|книге)/.test(o.interview) && o.interviewDone.some(l => /^Интервью состоялось — .*«[^»]+».*спросил/.test(l)), 'сохранение владелицы: интервью о книге', JSON.stringify([o.interview, o.interviewDone]));
      check(!o.occ || (o.occ.title === 'Концерт · ' + o.occ.name && /программа «/.test(o.occ.log || '')), 'сохранение владелицы: концерт друга-музыканта', JSON.stringify(o.occ));
      check(o.sameTitles, 'сохранённые названия работ не меняются');
      check(o.oldLogSame, 'старые записи «Истории» не меняются', o.oldKept);
      check(!o.errors2752.length && C.errors.length === 0, 'сохранение владелицы: полгода без ошибок', JSON.stringify([o.errors2752, C.errors]).slice(0, 500));
      await C.ctx.close();
    } else console.log('skip сохранение владелицы: SAVE не указан');
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
})();
function T_out(t) { return String(t).replace(/«[^»]*»/g, ''); }
function T_ty(t) { return /(?<![А-Яа-яЁё])(ты|тебя|тебе|тобой|твой|твоя|твоё|твое|твои|твоего|твоей|твоих|твоим|твою|твоему|твоём)(?![А-Яа-яЁё])/i.test(String(t)); }
