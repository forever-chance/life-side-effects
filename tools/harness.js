// Injected into the page after a life starts. Drives time, answers events,
// randomly clicks actions, captures texts and checks invariants.
window.__H = (function () {
  const H = { texts: [], issues: [], errors: [], actions: [], months: 0, seenIssue: new Set() };
  const issue = (kind, detail) => {
    const key = kind + '|' + detail.slice(0, 140);
    if (H.seenIssue.has(key)) return;
    H.seenIssue.add(key);
    H.issues.push({ kind, detail, age: s && s.age, year: s && s.year, month: s && s.clock && s.clock.month });
  };
  H.issue = issue;
  const origLog = log;
  log = function (title, text, ...rest) {
    try { H.texts.push({ src: 'log', title: String(title), text: String(text), age: s.age, gender: s.gender, country: s.country }); } catch (e) {}
    return origLog.call(this, title, text, ...rest);
  };
  const origShow = show;
  show = function (title, text, opts) {
    try {
      H.texts.push({ src: 'show', title: String(title), text: String(text), opts: (opts || []).filter(o => !o.hidden).map(o => (o.label || '') + (o.hint ? ' | ' + o.hint : '')), age: s && s.age, gender: s && s.gender, country: s && s.country });
    } catch (e) {}
    return origShow.call(this, title, text, opts);
  };
  const origToast = typeof toast === 'function' ? toast : null;
  if (origToast) toast = function (m, ...r) { try { H.texts.push({ src: 'toast', title: '', text: String(m), age: s && s.age, gender: s && s.gender, country: s && s.country }); } catch (e) {} return origToast.call(this, m, ...r); };

  const fin = (v) => typeof v === 'number' && isFinite(v);
  function checkState() {
    if (!s) return;
    for (const k of ['cash', 'health', 'mood', 'skill', 'social', 'age', 'year']) {
      if (s[k] !== undefined && !fin(s[k])) issue('nonfinite', `s.${k}=${s[k]}`);
    }
    for (const k of ['health', 'mood']) if (fin(s[k]) && (s[k] < 0 || s[k] > 100)) issue('range', `s.${k}=${s[k]}`);
    if (s.clock && !fin(s.clock.fatigue)) issue('nonfinite', 'fatigue=' + s.clock.fatigue);
    const expAge = s.year - s.birthYear;
    if (fin(expAge) && Math.abs(expAge - s.age) > 1) issue('age-drift', `age=${s.age} year-birthYear=${expAge}`);
    const ids = new Set();
    for (const p of s.people || []) {
      if (p.id && ids.has(p.id)) issue('dup-person-id', p.id + ' ' + p.name);
      if (p.id) ids.add(p.id);
      if (!fin(p.age)) issue('person-age-nonfinite', `${p.role} ${p.name} age=${p.age}`);
      if (p.alive && p.age < 0) issue('person-negative-age', `${p.role} ${p.name} ${p.age}`);
      if (p.alive && p.age > 115) issue('person-too-old', `${p.role} ${p.name} ${p.age}`);
      if (!p.name || /undefined|null|NaN/.test(String(p.name))) issue('person-bad-name', JSON.stringify({ role: p.role, name: p.name }));
      const r = String(p.role || '');
      if (/^(Мать|Отец)$/.test(r) && p.alive && fin(p.age) && p.age - s.age < 13) issue('parent-too-young', `${r} ${p.name} ${p.age} vs player ${s.age}`);
      if (/^(Мать)$/.test(r) && p.alive && fin(p.age) && p.age - s.age > 55 && !p.adoptive) issue('mother-too-old-at-birth', `${p.age - s.age}`);
      if (/^(Ребенок|Сын|Дочь)$/.test(r) && fin(p.age) && s.age - p.age < 14 && p.alive) issue('child-parent-gap', `${r} ${p.name} ${p.age} vs player ${s.age}`);
      if (/^(Партнер|Партнёр|Супруг|Супруга|Жена|Муж|Возлюбленн)/.test(r) && !/близкого|Бывш/.test(r) && p.alive && fin(p.age) && (p.age < 18 || s.age < 16)) issue('romance-age', `${r} ${p.name} age=${p.age} player=${s.age}`);
      if (p.gender && !['f', 'm', 'x', 'n'].includes(p.gender)) issue('person-gender', `${p.name} ${p.gender}`);
    }
    if (s.job && s.age < 14) issue('job-too-young', `${s.age} ${s.job.title}`);
    if (s.study && s.age < 15) issue('study-too-young', `${s.age}`);
    const partners = (s.people || []).filter(p => p.alive && /^(Партнер|Партнёр|Супруг|Супруга|Жена|Муж)$/.test(p.role || ''));
    if (partners.length > 1) issue('multiple-partners', partners.map(p => p.role + ':' + p.name).join(', '));
    if (s.dead && s.pending && s.pending.length) issue('pending-after-death', s.pending.map(q => q.type).join(','));
  }
  H.checkState = checkState;

  const BAD_BTN = /^\s*\?\s*$|обучени|Новая жизнь|Удалить|Сбросить|Загрузить|Импорт|Экспорт|Сохранить|Пауза|Продолжить|Персонажи|Об игре|Начать заново|Завершить жизнь|Покончить|×/i;
  function rnd(n) { return Math.floor(Math.random() * n); }
  function modalOpen() { return document.querySelector('#modal').open; }
  function answerModal(depth = 0) {
    let guard = 0;
    while (modalOpen() && guard++ < 8) {
      const btns = [...document.querySelectorAll('#modal .options button:not([disabled])')].filter(b => !/Пропускать в будущем/.test(b.textContent));
      if (!btns.length) { closeModal(); break; }
      const b = btns[rnd(btns.length)];
      H.actions.push('modal:' + b.textContent.trim().slice(0, 60)); console.log('ACT modal:' + b.textContent.trim().slice(0, 60) + ' @' + s.age + '/' + s.clock.month);
      try { b.click(); } catch (e) { issue('click-error', String(e)); closeModal(); }
    }
    if (modalOpen()) closeModal();
  }
  function randomAction() {
    const btns = [...document.querySelectorAll('#app button:not([disabled])')].filter(b => b.offsetParent !== null && !BAD_BTN.test(b.textContent) && !/setSpeed|toggleClock|setTab|loadMenu|about\(|start\(/.test(b.getAttribute('onclick') || ''));
    if (!btns.length) return;
    const b = btns[rnd(btns.length)];
    H.actions.push('act:' + b.textContent.trim().slice(0, 60)); console.log('ACT act:' + b.textContent.trim().slice(0, 60) + ' @' + s.age + '/' + s.clock.month + ' ' + (b.getAttribute('onclick')||''));
    try { b.click(); } catch (e) { issue('click-error', String(e)); }
    answerModal();
  }
  function step(actProb) {
    if (s.dead) return false;
    try { if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if (modalOpen()) { answerModal(); return true; }
    if (s.pending.length) { resolvePending(); answerModal(); return true; }
    if (s.clock.yearDue) { transact('year', rollYear); answerModal(); return true; }
    if (Math.random() < actProb) randomAction();
    if (modalOpen()) answerModal();
    if (s.dead) return false;
    if (s.pending.length || s.clock.yearDue) return true;
    console.log('ACT month @' + s.age + '/' + s.clock.month);
    advanceMonth();
    H.months++;
    checkState();
    answerModal();
    return true;
  }
  H.run = function (maxSteps, actProb) {
    let n = 0;
    while (n++ < maxSteps) {
      let ok;
      try { ok = step(actProb); } catch (e) { issue('exception', (e && e.stack || String(e)).slice(0, 600)); try { closeModal(); } catch (_) {} ok = !s.dead; }
      if (!ok) break;
    }
    // scan rendered DOM text
    const t = document.querySelector('#app').innerText;
    const m = t.match(/.{0,60}(undefined|NaN|\[object Object\]|null|Infinity|\$\{).{0,60}/g);
    if (m) m.slice(0, 5).forEach(x => issue('dom-bad-token', x.replace(/\s+/g, ' ')));
    return { dead: s.dead, age: s.age, year: s.year, months: H.months };
  };
  H.dump = function () {
    const t = H.texts; H.texts = [];
    const a = H.actions; H.actions = [];
    return { texts: t, issues: H.issues.splice(0), actions: a };
  };
  return H;
})();
