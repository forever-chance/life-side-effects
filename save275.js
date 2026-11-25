'use strict';
// Сборка 275: сохранения — сжатие, проверка перед заменой, статус записи, нехватка места, предыдущая версия, перенос.
//
// Подключается СРАЗУ ПОСЛЕ saves.js (до stories.js), а не перед bootstrap61.js. Причина — замер на сохранении владелицы
// (52 года, 2 млн знаков JSON): пока страница грузится, скрипты, которые чинят s, зовут save() около 85 раз, а отложенная
// запись (save264.js) подключена только в середине списка, так что до неё каждый вызов — полная запись жизни и резервной
// копии, 170 записей по 2 млн знаков. Загрузка — 11–13 с на компьютере, 16–19 с, если жизнь уже лежит сжатой (старый
// saves.js сжимает и распаковывает медленно). Здесь вызовы save() до DOMContentLoaded откладываются и после загрузки
// записываются один раз, как save264.js делает для кликов: загрузка 3,8–4,3 с. Ниже в списке файл тоже работает, но
// стартовые записи до него останутся (загрузка 17–19 с), а сообщение об открытой резервной копии при запуске не
// появится; тогда в консоли — предупреждение «275: save275.js подключён ниже save264.js».
//
// Формат: «deflate-v1:» + base64(deflate уровня 3 от UTF-8 JSON) — тот же, что saves.js пишет с 225 при нехватке места.
// Его читают все сборки с 225, в том числе стартовое восстановление в конце saves.js, которое выполняется раньше этого
// файла, и старая версия игры из кэша офлайн-режима. Жизнь владелицы: 1 990 000 знаков → 487 000 (в 4,1 раза).
// Safari считает квоту в знаках UTF-16 (5 МБ = 2,5 млн знаков на сайт): раньше жизнь с резервной копией туда уже не
// помещалась, теперь обе копии занимают меньше миллиона.
//
// Что делает файл:
// 1. Запись сжимается. Первая сжатая запись каждой жизни во вкладке и каждая, что заменяет не целую сжатую версию
//    (переход со старого сохранения), сразу распаковывается для сверки с исходным JSON. Не совпало — жизнь пишется как
//    раньше, без сжатия, игрок получает сообщение, сжатие до перезагрузки выключено. Резервная копия — прежняя версия,
//    тоже сжатая.
// 2. Первая сжатая запись жизни, лежавшей без сжатия: прежняя несжатая версия, если есть место, остаётся отдельным ключом
//    life-plain275-<id> (не с префиксом жизней — стартовый поиск saves.js его не примет за жизнь) и удаляется, когда
//    следующая сжатая запись прочиталась из хранилища и прошла сверку.
// 3. Нет места (QuotaExceededError): удаляются временные несжатые копии, сжимаются другие жизни, лежащие без сжатия, и
//    запись повторяется. Не вышло — прежнее сохранение не тронуто (setItem при ошибке значение не меняет), рядом с
//    «Сохранить» — «Не удалось сохранить: нет места — скачайте копию», по нажатию — окно со «Скачать копию всех жизней».
// 4. Статус под «Сохранить»: «Сохранено · 12:03» или ошибка записи. Обычная отложенная запись (раз в 0,4 с, дважды
//    за игровой месяц) статус не меняет: «Сохраняется…» мигало бы всё время, пока идёт время. Статус вне потока шапки,
//    смена его текста кнопки не двигает; ошибка — в потоке, её видно сразу.
// 5. Основная запись не читается — saves.js сам берёт резервную копию; этот файл об этом говорит (при запуске — по
//    отпечаткам последней записи в life-saves275, сравнению основной с резервной и времени записи основной, при открытии
//    из «Персонажей» — по разбору). В «Персонажах» у жизни с резервной копией — «Восстановить предыдущую версию»:
//    в подтверждении обе версии подписаны игровым месяцем и временем записи; сначала заменённая версия пишется в
//    резервную копию, потом предыдущая — в основную, чтобы оборванное восстановление не теряло последнее сохранение.
//    Завершённая жизнь (сборка 274): смерть приходит со сменой месяца, в резервной копии — версия до смерти, и часы
//    дальше стоят. У жизни, которую продолжили за близкого, резервная копия — та же последняя версия, что и основная:
//    иначе копия так и осталась бы без ссылки на продолжение — при нечитаемой основной записи финал снова предложил
//    бы «Продолжить за близкого», и продолжений стало бы два. «Восстановить предыдущую версию» у такой жизни нет:
//    вернуть её до смерти, когда в продолжении наследство уже поделено, — две разные истории одной семьи. У
//    завершённой жизни без продолжения кнопка есть, и в подтверждении сказано, что в предыдущей версии человек жив.
// 6. Последняя запись открытой жизни не прошла: сначала запись повторяется (место могло освободиться). Не вышло —
//    при нехватке места текущая жизнь из «Персонажей» заново не открывается, а открыть другую жизнь (или эту же при
//    другой ошибке), начать новую («Новая жизнь», «Другая жизнь →», «Родиться» после логотипа) или восстановить
//    предыдущую версию можно только после вопроса «Сыгранное не сохранено» со «Скачать копию всех жизней»: иначе
//    несохранённое молча пропадало бы.
// 7. Перенос: exportLives пишет обычный JSON, как раньше. Импорт принимает файл до 64 МБ (было 5), отдельную жизнь,
//    жизни строками «deflate-v1:…», gzip; пишет жизни сжатыми, при нехватке места откатывает уже записанное.

// ---------- Сжатие ----------
const PLAIN_PREFIX275='life-plain275-',RECORD275='life-saves275';
const utf8Encoder275=typeof TextEncoder==='function'?new TextEncoder():null;
const utf8Decoder275=typeof TextDecoder==='function'?new TextDecoder():null;

function pack275(raw){
 const zipped=globalThis.pako.deflate(utf8Encoder275?utf8Encoder275.encode(raw):raw,{level:3});
 let binary='';
 for(let offset=0;offset<zipped.length;offset+=8192)binary+=String.fromCharCode.apply(null,zipped.subarray(offset,offset+8192));
 return PACKED_LIFE+btoa(binary);
}
// Строка JSON из сохранения: сжатое распаковывается, несжатое возвращается как есть. Повреждённое — исключение.
function unpack275(raw){
 if(typeof raw!=='string')return null;
 if(!raw.startsWith(PACKED_LIFE))return raw;
 const binary=atob(raw.slice(PACKED_LIFE.length)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return utf8Decoder275?utf8Decoder275.decode(globalThis.pako.inflate(bytes)):globalThis.pako.inflate(bytes,{to:'string'});
}
// Сжатая строка, которая распаковывается ровно в raw, или null.
function packChecked275(raw){
 if(!globalThis.pako||typeof raw!=='string')return null;
 try{const packed=pack275(raw);return unpack275(packed)===raw?packed:null;}catch{return null;}
}
function fingerprint275(raw){
 if(typeof raw!=='string')return null;
 let hash=0x811c9dc5;
 for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return raw.length+':'+(hash>>>0).toString(36);
}
function isQuota275(error){
 return !!error&&(error.name==='QuotaExceededError'||error.name==='NS_ERROR_DOM_QUOTA_REACHED'||error.code===22||error.code===1014);
}
// Ошибка, текст которой можно показать игроку. У остальных — сообщения браузера по-английски («Unexpected token…»),
// их игроку не показывать.
function playerError275(text){const error=new Error(text);error.player275=true;return error;}
// Жизнь из записи или null. Без одноразового флага skipBackupParse275 (он — только для строки save() в saves.js).
function readable275(raw){
 try{const json=unpack275(raw),life=json==null?null:JSON.parse(json);return validLife(life)?life:null;}catch{return null;}
}

// ---------- Разбор ----------
// skipBackupParse275 — одноразовый флаг для одной строки save() в saves.js, которая идёт сразу после writeLife:
// «if(parseLife(previous)) записать резервную копию». Резервную копию уже записал writeLife, поэтому этот разбор
// возвращает null. Флаг взводит только удачный writeLife (в начале каждой записи он снят), снимается он этим разбором,
// по выходе из save() и в конце задачи. Взведённый после неудачной записи, он подменял бы основную запись (там всё
// ещё previous) резервной копией в readLife и loadCharacter до конца задачи.
let skipBackupParse275=null,watchMain275=null;
parseLife=function(raw){
 if(skipBackupParse275&&raw===skipBackupParse275.raw){skipBackupParse275=null;return null;}
 let life=null;
 try{
  const json=unpack275(raw);
  life=json==null?null:JSON.parse(json);
  if(!validLife(life))life=null;
 }catch{life=null;}
 if(watchMain275&&raw===watchMain275.raw)watchMain275.failed=!life;
 return life;
};
packLife=function(raw){
 if(!raw||raw.startsWith(PACKED_LIFE))return raw;
 return packChecked275(raw)||raw;
};

// ---------- Отпечатки последней записи ----------
// По ним при запуске видно, что saves.js открыл резервную копию: основная запись уже не та, что записана здесь,
// а резервная — та же (при обычной перезаписи прежняя основная переезжает в резервную).
// Читается из хранилища каждый раз: запись общая для всех вкладок, и вкладка, открытая раньше, не должна вернуть
// своей копией старые отпечатки жизни, которую с тех пор записала другая вкладка.
function records275Read(){
 try{const v=JSON.parse(localStorage.getItem(RECORD275));if(v&&typeof v.lives==='object'&&v.lives)return v;}catch{}
 return {lives:{}};
}
function rememberWrite275(id,main,backup){
 const book=records275Read();
 book.lives[id]={m:fingerprint275(main),b:fingerprint275(backup)};
 try{localStorage.setItem(RECORD275,JSON.stringify(book));}catch{}
}
function forgetWrite275(id){
 const book=records275Read();
 if(!book.lives[id])return;
 delete book.lives[id];
 try{localStorage.setItem(RECORD275,JSON.stringify(book));}catch{}
}

// ---------- Временные несжатые копии ----------
const plainCopies275=new Set();
try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(PLAIN_PREFIX275))plainCopies275.add(key.slice(PLAIN_PREFIX275.length));}}catch{}
function keepPlain275(id,raw){
 try{localStorage.setItem(PLAIN_PREFIX275+id,raw);plainCopies275.add(id);return true;}
 catch{return false;}
}
function dropPlain275(id){
 if(!plainCopies275.has(id))return;
 try{localStorage.removeItem(PLAIN_PREFIX275+id);}catch{}
 plainCopies275.delete(id);
}

// ---------- Место ----------
// Другие жизни, лежащие без сжатия: сжать со сверкой. Значение меньше прежнего — запись всегда помещается.
function compactOtherLives275(exceptId){
 const keys=[];
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);
  if(key?.startsWith(LIFE_PREFIX)&&key!==LIFE_PREFIX+exceptId&&key!==LIFE_PREFIX+exceptId+'-backup')keys.push(key);
 }
 let freed=false;
 for(const key of keys){
  const raw=localStorage.getItem(key);
  if(!raw||raw.startsWith(PACKED_LIFE)||!parseLife(raw))continue;
  const packed=packChecked275(raw);
  if(!packed||packed.length>=raw.length)continue;
  try{localStorage.setItem(key,packed);freed=true;}catch{}
 }
 return freed;
}
function setWithRoom275(key,value,id){
 try{localStorage.setItem(key,value);return;}
 catch(error){if(!isQuota275(error))throw error;}
 // Запись не прошла, значит в основной записи по-прежнему прежнее сохранение: несжатые копии больше не нужны.
 for(const other of [...plainCopies275])dropPlain275(other);
 try{localStorage.setItem(key,value);return;}
 catch(error){if(!isQuota275(error))throw error;}
 compactOtherLives275(id);
 localStorage.setItem(key,value);
}

// ---------- Запись ----------
// Последняя запись каждой жизни в этой вкладке: id → {stored, raw}. По ней видно, что состояние не менялось.
const lastWrite275=new Map();
// Жизни, чья сжатая запись в этой вкладке уже прошла полную сверку.
const checkedLives275=new Set();
// Тот же JSON, кроме значения savedAt (оно в сохранении одно, на верхнем уровне).
function sameExceptSavedAt275(a,b){
 if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;
 const at=a.indexOf('"savedAt":"');
 if(at<0||b.indexOf('"savedAt":"')!==at)return a===b;
 return a.slice(0,at)===b.slice(0,at)&&a.slice(at+36)===b.slice(at+36);
}
// Завершённая жизнь: '' — жизнь идёт, 'dead' — завершена, 'dead:{…}' — завершена и продолжена за близкого (сборка 274,
// ссылка continued274).
function finished275(life){return life?.dead?'dead'+(life.continued274?':'+JSON.stringify(life.continued274):''):'';}
// Резервная копия завершённой жизни с продолжением — та же версия, что и основная запись. Возвращает, что теперь лежит
// в резервной копии.
function mirrorBackup275(backup,value){
 let now=null;
 try{now=localStorage.getItem(backup);}catch{}
 if(now===value)return now;
 try{localStorage.setItem(backup,value);return value;}catch{return now;}
}
let saveIssue275=null,compressionOff275=false,compressionWarned275=false,writes275=0;
// Жизнь, чья последняя запись не прошла: сыгранное после её последнего удачного сохранения есть только в s.
let unsavedId275=null;
writeLife=function(key,raw,previous,backup){
 const id=key.slice(LIFE_PREFIX.length),mine=s?.saveId===id,ticks=mine?s.clock?.ticks:undefined,finished=mine?finished275(s):undefined;
 // Прежняя запись: целая ли, что в ней, какой это игровой месяц и завершена ли жизнь.
 const last=lastWrite275.get(id);
 let previousJson=null,previousGood=false,previousTicks,previousFinished;
 if(last&&previous===last.stored){previousJson=last.raw;previousTicks=last.ticks;previousFinished=last.finished;previousGood=true;}
 else if(typeof previous==='string'){
  try{
   previousJson=unpack275(previous);
   const life=JSON.parse(previousJson);
   previousGood=validLife(life);
   previousTicks=life.clock?.ticks;
   previousFinished=finished275(life);
  }catch{previousGood=false;}
 }
 skipBackupParse275=null;
 // Ничего не изменилось, кроме времени записи: сжимать и переписывать нечего.
 if(previousGood&&sameExceptSavedAt275(raw,previousJson)&&(previous.startsWith(PACKED_LIFE)||compressionOff275||!globalThis.pako)){
  lastWrite275.set(id,{stored:previous,raw:previousJson,ticks:previousTicks,finished:previousFinished});
  // Завершённая жизнь с продолжением: резервная копия — та же версия. Не записалась раньше (не было места) — сейчас.
  if(previousFinished?.startsWith('dead:')){
   let before=null;
   try{before=localStorage.getItem(backup);}catch{}
   if(before!==previous&&mirrorBackup275(backup,previous)===previous)rememberWrite275(id,previous,previous);
  }
  saveIssue275=null;writes275++;
  if(unsavedId275===id)unsavedId275=null;
  setSaveStatus275('saved');
  armBackupSkip275(previous);
  return previous;
 }
 const previousPacked=previousGood&&previous.startsWith(PACKED_LIFE);
 // Завершённая жизнь: часы стоят, месяц больше не сменится, и по правилу ниже резервная копия навсегда осталась бы
 // версией до смерти. Жизнь продолжили за близкого (или ссылку на продолжение сняли) — копия та же версия, что и
 // основная: копия без ссылки при нечитаемой основной записи снова предложила бы «Продолжить за близкого», и
 // продолжений стало бы два.
 const mirror=!!finished?.startsWith('dead:')||finished==='dead'&&!!previousFinished?.startsWith('dead:');
 // Полная сверка (распаковать и сравнить с JSON) — при первой сжатой записи жизни в этой вкладке и всякий раз, когда
 // заменяется не целая сжатая версия (переход со старого несжатого сохранения, новая или повреждённая запись), и когда
 // та же запись уходит и в резервную копию (у завершённой жизни с продолжением).
 // Дальше сжатие то же и на тех же данных, сверка стоила бы четверть записи: на жизни владелицы 25 мс из 100.
 const verify=!checkedLives275.has(id)||!previousPacked||mirror;
 let stored=null;
 if(!compressionOff275&&globalThis.pako){
  if(verify){stored=packChecked275(raw);if(stored)checkedLives275.add(id);}
  else try{stored=pack275(raw);}catch{stored=null;}
 }
 if(!stored&&!compressionOff275&&globalThis.pako){
  compressionOff275=true;
  console.warn('275: сжатое сохранение не совпало с исходным при проверке — запись без сжатия.');
  if(!compressionWarned275){compressionWarned275=true;setTimeout(()=>toast('Сохранение не прошло проверку при записи, поэтому жизнь записана прежним способом: всё на месте, только места в браузере она занимает больше.'),0);}
 }
 stored||=raw;
 const packedNow=stored!==raw;
 // Первая сжатая запись: прежняя несжатая версия остаётся отдельным ключом, пока есть место.
 const migrating=packedNow&&previousGood&&!previousPacked;
 if(migrating)keepPlain275(id,previous);
 try{setWithRoom275(key,stored,id);}
 catch(error){
  saveIssue275=isQuota275(error)?'quota':'other';
  throw error;
 }
 writes275++;
 // Резервная копия — прежняя версия из предыдущего игрового месяца. Внутри месяца она не переписывается, если это
 // целая копия, записанная здесь (совпал отпечаток): иначе «предыдущая версия» отличалась бы на одно нажатие.
 // У завершённой жизни с продолжением — та же версия, что и основная (см. mirror выше).
 let backupNow=null;
 if(mirror)backupNow=mirrorBackup275(backup,stored);
 else{
  try{backupNow=localStorage.getItem(backup);}catch{}
  const backupOurs=backupNow!==null&&fingerprint275(backupNow)===records275Read().lives[id]?.b&&(backupNow.startsWith(PACKED_LIFE)||!packedNow);
  if(previousGood&&(!backupOurs||ticks===undefined||previousTicks===undefined||ticks!==previousTicks)){
   const value=previousPacked||!packedNow?previous:(packChecked275(previous)||previous);
   try{localStorage.setItem(backup,value);backupNow=value;}catch{}
  }
 }
 if(migrating&&!plainCopies275.has(id))keepPlain275(id,previous);
 // Сжатая версия, сверенная при переходе, прочиталась из хранилища, новая записана — несжатая копия больше не нужна:
 // сверенная версия есть в резервной копии.
 else if(packedNow&&previousPacked)dropPlain275(id);
 lastWrite275.set(id,{stored,raw,ticks,finished});
 rememberWrite275(id,stored,backupNow);
 saveIssue275=null;
 if(unsavedId275===id)unsavedId275=null;
 setSaveStatus275('saved');
 armBackupSkip275(previous);
 return stored;
};
// Взводится только после удачной записи, перед возвратом в save(). Запасные снятия — по выходе из save()
// (обёртка ниже) и в конце задачи, если save() оборвался между writeLife и этой строкой.
function armBackupSkip275(previous){
 skipBackupParse275={raw:previous};
 queueMicrotask(()=>{skipBackupParse275=null;});
}

// ---------- Загрузка страницы ----------
// Пока страница грузится, save() только запоминает, что запись нужна; после DOMContentLoaded — одна запись.
let loading275=document.readyState==='loading',deferredSave275=false;
{
 const saveBeforeLoad275=save;
 save=function(...args){
  if(loading275&&s){deferredSave275=true;return true;}
  try{return saveBeforeLoad275.apply(this,args);}
  finally{skipBackupParse275=null;}
 };
}
// Место в списке скриптов: сразу после saves.js. Если save264.js уже загружен, файл подключён слишком низко.
if(typeof saveNow264!=='undefined')console.warn('275: save275.js подключён ниже save264.js. Его место — сразу после saves.js: иначе длинная жизнь загружается в несколько раз дольше, а сообщение об открытой при запуске резервной копии не появляется.');

// ---------- Статус ----------
const status275={state:'idle',issue:null};
function savedAtText275(iso){
 const date=new Date(iso||'');
 if(!Number.isFinite(date.getTime()))return '';
 const time=date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 return new Date().toDateString()===date.toDateString()?time:date.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})+', '+time;
}
function statusInner275(){
 if(status275.state==='failed'){
  const quota=status275.issue==='quota';
  return `<button type="button" onclick="saveTrouble275()" title="Что делать"><span class="long275">${quota?'Не удалось сохранить: нет места — скачайте копию':'Не удалось сохранить — скачайте копию'}</span><span class="short275">${quota?'Нет места — скачайте копию':'Не сохранено — скачайте копию'}</span></button>`;
 }
 // s.savedAt saves.js ставит только после удачной записи: это время последнего удачного сохранения.
 const when=s?savedAtText275(s.savedAt):'';
 return when?'Сохранено · '+when:'';
}
// Рисуется после того, как save() дописал s.savedAt, — в конце текущей задачи.
let paintQueued275=false;
function setSaveStatus275(state,issue=null){
 status275.state=state;status275.issue=issue;
 if(paintQueued275)return;
 paintQueued275=true;
 queueMicrotask(()=>{paintQueued275=false;paintSaveStatus275();});
}
function paintSaveStatus275(){
 const inner=statusInner275();
 for(const el of document.querySelectorAll('.save-status275')){
  // Тот же текст не перерисовывается (запись идёт дважды за игровой месяц).
  if(el.dataset.inner275!==inner){el.innerHTML=inner;el.dataset.inner275=inner;}
  el.classList.toggle('failed275',status275.state==='failed');
 }
}
const saveButton275='<button type="button" onclick="saveManually()">Сохранить</button>';
{
 const headerBase275=header;
 header=function(...args){
  const markup=headerBase275.apply(this,args);
  return markup.includes(saveButton275)?markup.replace(saveButton275,()=>`<span class="save-box275">${saveButton275}<span class="save-status275${status275.state==='failed'?' failed275':''}">${statusInner275()}</span></span>`):markup;
 };
}
function saveTrouble275(){
 const quota=status275.issue==='quota',last=s?savedAtText275(s.savedAt):'';
 show('Не удалось сохранить',
  (quota?'В браузере не осталось места для сохранений. ':'Браузер не записал сохранение. ')+
  (last?`Последнее удачное сохранение — ${last}, оно на месте. `:'Прежнее сохранение на месте. ')+
  'Чтобы не потерять то, что сыграно после него, скачайте копию всех жизней: из неё всё восстанавливается через «Персонажи» → «Восстановить из файла».'+
  (quota?' Место освободится, если удалить ненужную жизнь в «Персонажах».':''),
  [{label:'Скачать копию всех жизней',fn:()=>exportLives()},
   {label:'Попробовать сохранить ещё раз',fn:()=>saveManually()},
   {label:'Персонажи',fn:()=>openLives()},
   {label:'Закрыть',fn:()=>{}}]);
}

// ---------- Несохранённое на экране ----------
// Последняя запись открытой жизни не прошла — сыгранное после её последнего удачного сохранения есть только в s.
function unsavedHere275(){return !!s&&unsavedId275!==null&&unsavedId275===s.saveId;}
// Ещё раз записать (место могло появиться). true — теперь несохранённого нет.
function trySaveNow275(){
 if(!unsavedHere275())return true;
 try{save();if(typeof flushSave264==='function')flushSave264();}catch{}
 return !unsavedHere275();
}
// Открыть другую жизнь, начать новую, восстановить предыдущую версию — когда несохранённое пропало бы: сначала вопрос.
function unsavedAsk275(what,goLabel,proceed,cancel){
 const life=s,last=savedAtText275(s.savedAt);
 show('Сыгранное не сохранено',
  `${s.name} ${s.surname}: ${last?`последнее удачное сохранение — ${last}. Всё, что сыграно после него,`:'эта жизнь ещё ни разу не сохранилась. Всё, что в ней сыграно,'} есть только на экране и пропадёт, если ${what}. Чтобы не потерять, сначала скачайте копию всех жизней: из неё всё восстанавливается через «Персонажи» → «Восстановить из файла».`,
  [{label:'Скачать копию всех жизней',fn:()=>{exportLives();setTimeout(()=>{if(s===life&&!$('#modal').open)unsavedAsk275(what,goLabel,proceed,cancel);},0);}},
   {label:goLabel,fn:proceed},
   {label:'Отмена',fn:cancel||(()=>{})}]);
}
function newLifeAnyway275(){save();s=null;intro();}
// «Новая жизнь» в «Персонажах» (saves17.js: save(); s=null; intro()).
function newLifeAsk275(i){
 if(unsavedHere275()&&!trySaveNow275()){unsavedAsk275('начать новую жизнь','Всё равно начать новую',newLifeAnyway275,()=>openLives());return;}
 choose(i);
}

// ---------- Основная запись не прочиталась ----------
const lifeBrief275=life=>({id:life.saveId,name:life.name,surname:life.surname,age:life.age,year:life.year,clock:{month:life.clock?.month},savedAt:life.savedAt});
// same — копия та же, что последняя запись (у завершённой жизни с продолжением, у импортированной и ни разу не
// записанной): ничего не потерялось.
function showBackupNotice275(brief,same=false){
 const text=same?`${brief.name} ${brief.surname}: последняя запись этой жизни не прочиталась, поэтому игра открыла резервную копию — ${lifeLine275(brief)}. Копия совпадает с последним сохранением, ничего не потерялось.`
  :`${brief.name} ${brief.surname}: последняя запись этой жизни не прочиталась, поэтому игра открыла предыдущую копию — ${lifeLine275(brief)}. Сыгранное после неё не сохранилось.`;
 const go=()=>{
  if(!s||s.saveId!==brief.id)return;
  const dialog=$('#modal');
  if(dialog.open){dialog.addEventListener('close',()=>setTimeout(go,0),{once:true});return;}
  show(same?'Открыта резервная копия':'Открыта предыдущая копия',text,[{label:'Понятно',fn:()=>{}}]);
 };
 setTimeout(go,0);
}
// Запуск: saves.js уже открыл жизнь (до этого файла) и, если основная запись не прочиталась, переписал её резервной.
// Признаки: основная — не та, что записана здесь последней, резервная — та же, и основная либо не читается (переписать
// не удалось), либо это и есть резервная, переписанная при запуске (отличаются только savedAt и флаги часов, которые
// saves.js сбрасывает). Одних отпечатков мало: основная бывает новее записанного в life-saves275 (отпечатки не успели
// записаться — нет места или вкладку закрыли между записями), и saves.js переписывает основную при запуске, если
// открывает не ту жизнь, что была активной (активную удалили). Тогда сообщение было бы ложным.
// Поэтому читаемая основная запись считается переписанной резервной, только если записана во время этой загрузки:
// saves.js, заменяя нечитаемую основную, сохраняет жизнь и ставит savedAt сейчас; прочитанная как обычно основная
// хранит прежнее время. Без этого условия сообщение появлялось, когда основная отличалась от резервной только флагами
// часов (первая запись 275 после старой сборки, остановленной на ходу) и отпечатки отстали (вкладку закрыли между
// записью жизни и записью отпечатков).
// Жизнь из записи без savedAt и флагов часов — для сравнения; null, если запись не читается.
function lifeForCompare275(raw){
 let life=null;
 try{const json=unpack275(raw);life=json==null?null:JSON.parse(json);}catch{life=null;}
 if(!validLife(life))return null;
 const savedAt=life.savedAt;
 delete life.savedAt;
 if(life.clock){delete life.clock.running;delete life.clock.resumeAfterChoice;delete life.clock.choiceActive;}
 return {json:JSON.stringify(life),savedAt};
}
let startupBackup275=null;
try{
 if(s?.saveId){
  const book=records275Read().lives[s.saveId],key=LIFE_PREFIX+s.saveId,main=localStorage.getItem(key);
  if(book?.m&&book.b&&book.m!==book.b&&fingerprint275(main)!==book.m){
   const back=localStorage.getItem(key+'-backup');
   if(fingerprint275(back)===book.b){
    const backLife=lifeForCompare275(back),mainLife=backLife&&lifeForCompare275(main);
    const loadStart=typeof performance!=='undefined'&&Number.isFinite(performance.timeOrigin)?performance.timeOrigin:Date.now()-(typeof performance!=='undefined'?performance.now():0);
    const writtenNow=!!mainLife&&Date.parse(mainLife.savedAt||'')>=loadStart-1000;
    if(backLife&&(!mainLife||mainLife.json===backLife.json&&writtenNow))startupBackup275={...lifeBrief275(s),savedAt:backLife.savedAt||s.savedAt};
   }
  }
 }
}catch{}
let switchAllowed275=false;
{
 const loadCharacterBase275=loadCharacter;
 loadCharacter=function(id,...args){
  // Последняя запись открытой жизни не прошла, а открыть просят жизнь из хранилища: сыгранное после последнего
  // удачного сохранения пропало бы молча. saves.js сам не открывает текущую жизнь, если её не удалось сохранить, но
  // с 264 save() откладывает запись и этого не видит, а перед другой жизнью не проверяет вовсе.
  if(s&&!switchAllowed275&&unsavedHere275()&&!trySaveNow275()){
   // Нет места, а просят эту же жизнь (окно «Не удалось сохранить» → «Персонажи» → она): заново её не открывать.
   if(s.saveId===id&&status275.issue==='quota'){
    toast('Эта жизнь уже открыта. Сыгранное после последнего сохранения пока есть только здесь — скачайте копию всех жизней.');
    return;
   }
   unsavedAsk275(s.saveId===id?'открыть эту жизнь заново':'открыть другую жизнь','Всё равно открыть',
    ()=>{switchAllowed275=true;try{loadCharacter(id,...args);}finally{switchAllowed275=false;}},()=>openLives());
   return;
  }
  let watch=null;
  try{
   watch={raw:localStorage.getItem(LIFE_PREFIX+id),failed:false,same:false};
   // Резервная копия — та же версия, что записана последней (отпечатки основной и резервной совпадают с записанными).
   const book=records275Read().lives[id];
   watch.same=!!book?.m&&book.m===book.b&&fingerprint275(localStorage.getItem(LIFE_PREFIX+id+'-backup'))===book.b;
  }catch{}
  watchMain275=watch;
  const before=s;
  let result;
  try{result=loadCharacterBase275.call(this,id,...args);}
  finally{watchMain275=null;}
  if(watch?.failed&&s&&s!==before&&s.saveId===id)showBackupNotice275(lifeBrief275(s),watch.same);
  // Жизнь заново прочитана из хранилища — несохранённого в ней нет.
  if(s&&s!==before&&unsavedId275===s.saveId){unsavedId275=null;if(status275.state==='failed')status275.state='idle';}
  if(s&&s!==before)paintSaveStatus275();
  return result;
 };
}

// ---------- Предыдущая версия ----------
let restoreIds275=[];
function decorateLives275(order){
 const cards=[...document.querySelectorAll('#modal .life-card21')];
 if(!cards.length||cards.length!==order.length)return;
 restoreIds275=order.map(x=>x.id);
 cards.forEach((card,k)=>{
  const {id,life}=order[k],label=card.querySelector('.life-delete21')?.getAttribute('aria-label')||'';
  if(!label.includes(life.name+' '+life.surname))return;
  // Жизнь продолжили за близкого (сборка 274): предыдущая версия вернула бы её до смерти, а в продолжении наследство
  // уже поделено — две разные истории одной семьи. Резервная копия такой жизни — та же версия, восстанавливать нечего.
  if(life.dead&&life.continued274)return;
  let main=null,back=null;
  try{main=localStorage.getItem(LIFE_PREFIX+id);back=localStorage.getItem(LIFE_PREFIX+id+'-backup');}catch{}
  if(back==null||back===main)return;
  card.insertAdjacentHTML('beforeend',`<button type="button" class="life-restore275" onclick="restoreAsk275(${k})">Восстановить предыдущую версию</button>`);
 });
}
function monthYear275(life){
 const month=months[life.clock?.month];
 return month?month.toLowerCase()+' '+life.year:life.year+' год';
}
function lifeLine275(life){
 const when=savedAtText275(life.savedAt);
 return `${years(life.age)}, ${monthYear275(life)}${when?', сохранена '+when:''}`;
}
function restoreAsk275(k,unsavedAgreed=false){
 const id=restoreIds275[k];
 if(!id)return;
 // Открытая жизнь, чья последняя запись не прошла: восстановление выбросило бы сыгранное после неё — сначала вопрос,
 // как перед другой жизнью (из «Персонажей» эта жизнь заново не открывается по той же причине).
 if(!unsavedAgreed&&s?.saveId===id&&unsavedHere275()&&!trySaveNow275()){
  unsavedAsk275('восстановить предыдущую версию','Всё равно восстановить',()=>restoreAsk275(k,true),()=>openLives());
  return;
 }
 // Версия, показанная в окне, и восстанавливается — даже если пока окно открыто, запись успеет смениться.
 const key=LIFE_PREFIX+id;
 let main=null,back=null;
 try{main=localStorage.getItem(key);back=localStorage.getItem(key+'-backup');}catch{}
 const current=readable275(main),previous=readable275(back);
 if(!previous){
  show('Предыдущая версия не читается','Резервная копия этой жизни повреждена, восстановить из неё нельзя. Текущее сохранение не тронуто.',[{label:'К персонажам',fn:()=>openLives()}]);
  return;
 }
 // Жизнь уже продолжили за близкого (например, в другой вкладке, пока здесь был открыт список): не восстанавливать.
 const link=current?.dead?current.continued274:null;
 if(link){
  const who=String(link.name||'')+(link.label?` (${String(link.label).toLocaleLowerCase('ru')})`:'');
  show('Предыдущую версию не восстановить',`${current.name} ${current.surname}: история продолжена${who?' — '+who:''}. Продолжение начато с последней версии этой жизни: если вернуть предыдущую, у семьи будут две разные истории. Текущее сохранение не тронуто.`,[{label:'К персонажам',fn:()=>openLives()}]);
  return;
 }
 // Версии подписаны игровым месяцем и временем записи: после восстановления «предыдущая» — та, что была новее.
 show('Восстановить предыдущую версию?',
  `${previous.name} ${previous.surname}. Сейчас в сохранении: ${current?lifeLine275(current):'запись не читается'}. Предыдущая версия: ${lifeLine275(previous)}. `+
  (current?.dead&&!previous.dead?`Сейчас жизнь завершена, а в предыдущей версии ${previous.name} ещё жив${previous.gender==='f'?'а':''}. `:'')+
  (current?`Игра продолжится с версии за ${monthYear275(previous)}, а версия за ${monthYear275(current)} станет предыдущей: пока не сменился игровой месяц, её можно вернуть так же.`:`Игра продолжится с версии за ${monthYear275(previous)}.`),
  [{label:`Восстановить предыдущую версию (${monthYear275(previous)})`,fn:()=>restoreBackup275(id,back,main,!!current)},
   {label:'Отмена',fn:()=>openLives()}]);
}
let skipReceipt275=false;
// Порядок записей — такой, чтобы оборванное на любом шаге восстановление не теряло последнее сохранение:
// 1) проверить обе версии до любой записи; 2) резервная копия ← текущая версия; 3) основная ← предыдущая;
// 4) отпечатки. Оборвалось после 2 — в основной и в резервной последнее сохранение, пропала только старая копия.
// Не прошла запись 2 — ничего не изменилось; не прошла 3 — резервная копия возвращается как была.
function restoreBackup275(id,back,mainSeen=null,mainSeenOk=false){
 const key=LIFE_PREFIX+id,backupKey=key+'-backup';
 const fail=text=>{toast(text);openLives();};
 const previous=readable275(back);
 if(!previous)return fail('Предыдущая версия не читается. Текущее сохранение не тронуто.');
 const current=s?.saveId===id;
 // Отложенная запись этой жизни больше не нужна — её место занимает предыдущая версия. Чужую — дописать.
 if(typeof saveTarget264!=='undefined'&&saveTarget264){
  if(saveTarget264.saveId===id){clearTimeout(saveTimer264);saveTimer264=null;saveTarget264=null;}
  else flushSave264();
 }
 let main=null;
 try{main=localStorage.getItem(key);}catch{}
 // Текущая версия уходит в резервную копию, если читается (разобрана, пока было открыто окно, или сейчас).
 const keepMain=main!==null&&main!==back&&(main===mainSeen?mainSeenOk:!!readable275(main));
 if(keepMain){
  try{localStorage.setItem(backupKey,main);}
  catch(error){return fail(isQuota275(error)?'Не удалось восстановить: в браузере не хватает места. Текущее сохранение не тронуто.':'Браузер не дал восстановить предыдущую версию. Текущее сохранение не тронуто.');}
 }
 try{localStorage.setItem(key,back);}
 catch{
  if(keepMain)try{localStorage.setItem(backupKey,back);}catch{}
  return fail('Браузер не дал восстановить предыдущую версию. Текущее сохранение не тронуто.');
 }
 lastWrite275.delete(id);
 rememberWrite275(id,back,keepMain?main:back);
 // Несохранённое этой жизни заменено восстановленной версией (игрок согласился).
 if(unsavedId275===id){unsavedId275=null;if(status275.state==='failed')setSaveStatus275('idle');}
 if(current){
  s=null;loadCharacter(id);
  // Сразу после — конец choose(): итог действия для восстановленной жизни не записывать.
  skipReceipt275=true;
  queueMicrotask(()=>{skipReceipt275=false;});
 }
 toast('Восстановлена версия за '+monthYear275(previous)+'.');
 if(!current)openLives();
}

// ---------- Удаление, когда места нет ----------
// saves17.js перед удалением пишет журнал с копией жизни. Когда хранилище заполнено, журнал не помещается и удалить
// жизнь, чтобы освободить место, нельзя. Тогда жизнь удаляется без журнала: сначала из списка, потом её записи.
function deleteJournalFits275(id){
 const journal='life-delete-journal17';
 try{
  const entries=[LIFE_PREFIX+id,LIFE_PREFIX+id+'-backup',ARCHIVE].map(key=>[key,localStorage.getItem(key)]);
  localStorage.setItem(journal,JSON.stringify({id,entries}));
  localStorage.removeItem(journal);
  return true;
 }catch(error){
  try{localStorage.removeItem(journal);}catch{}
  return !isQuota275(error);
 }
}
function deleteWithoutJournal275(id){
 if(!readLife(id))return false;
 const index=vaultIndex();
 index.ids=index.ids.filter(x=>x!==id);
 if(index.active===id)index.active=null;
 try{localStorage.setItem(ARCHIVE,JSON.stringify(index));}
 catch{toast('Не удалось удалить жизнь: браузер не записал список. Остальные жизни не изменены.');return false;}
 for(const key of [LIFE_PREFIX+id,LIFE_PREFIX+id+'-backup'])try{localStorage.removeItem(key);}catch{}
 try{if(parseLife(localStorage.getItem(KEY))?.saveId===id)localStorage.removeItem(KEY);}catch{}
 if(s?.saveId===id){s=null;tab='story';clockCarry=0;$('#modal').close();intro();}
 else openLives();
 return true;
}

// ---------- Перенос ----------
const IMPORT_LIMIT275=64*1024*1024;
function lifeFrom275(value){
 if(typeof value==='string'){try{const json=unpack275(value.trim());return json==null?null:JSON.parse(json);}catch{return null;}}
 return value;
}
// Файл копии, массив жизней или одна жизнь; жизни объектами или строками сохранения (сжатыми или нет).
function importData275(data){
 data=lifeFrom275(data);
 let lives=null;
 if(Array.isArray(data))lives=data;
 else if(data?.format==='life-side-effects'&&Array.isArray(data.lives))lives=data.lives;
 else if(validLife(data))lives=[data];
 lives=lives?.map(lifeFrom275);
 if(!lives?.length||lives.length>100||!lives.every(validLife))throw playerError275('в файле нет жизней этой игры, или он повреждён');
 return {format:'life-side-effects',version:1,lives};
}
// Сколько жизней последнего импорта записано без резервной копии (на вторую копию не хватило места).
let importWithoutBackup275=0;
importLives=function(data){
 const {lives}=importData275(data);
 const index=vaultIndex(),written=[],added=[];
 importWithoutBackup275=0;
 try{
  for(const life of lives){
   const copy=JSON.parse(JSON.stringify(life));
   copy.saveId=charId();
   if(copy.clock){copy.clock.running=false;copy.clock.resumeAfterChoice=false;copy.clock.choiceActive=false;}
   const raw=JSON.stringify(copy),stored=packChecked275(raw)||raw,key=LIFE_PREFIX+copy.saveId;
   written.push(key);
   setWithRoom275(key,stored,copy.saveId);
   let backup=null;
   try{localStorage.setItem(key+'-backup',stored);written.push(key+'-backup');backup=stored;}catch{importWithoutBackup275++;}
   rememberWrite275(copy.saveId,stored,backup);
   index.ids.push(copy.saveId);
   added.push(copy.saveId);
  }
  localStorage.setItem(ARCHIVE,JSON.stringify(index));
 }catch(error){
  for(const key of written)try{localStorage.removeItem(key);}catch{}
  for(const id of added)forgetWrite275(id);
  if(isQuota275(error))throw playerError275('в браузере не хватает места. Удалите ненужную жизнь в «Персонажах» и попробуйте снова');
  throw playerError275('браузер не записал жизнь. Уже записанное убрано, остальные жизни не изменены');
 }
 return added.length;
};
function livesWord275(n){return n%10===1&&n%100!==11?'жизнь':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'жизни':'жизней';}
function importedText275(n){
 const one=n%10===1&&n%100!==11;
 const added=n===1?'Жизнь добавлена.':`${one?'Добавлена':'Добавлено'} ${n} ${livesWord275(n)}.`;
 const without=importWithoutBackup275;
 if(!without)return added;
 return added+(n===1?' На предыдущую версию места не хватило: у этой жизни пока нет резервной копии.':` На предыдущие версии места не хватило: у ${without===n?'них':without+' из них'} пока нет резервной копии.`);
}
pickSaveFile=function(){
 if(typeof flushSave264==='function')flushSave264();
 const input=document.createElement('input');
 input.type='file';
 input.accept='.json,.gz,.txt,application/json,application/gzip,text/plain';
 input.onchange=async()=>{
  const file=input.files?.[0];
  if(!file)return;
  try{
   if(file.size>IMPORT_LIMIT275)throw playerError275('файл больше 64 МБ');
   let bytes=new Uint8Array(await (file.arrayBuffer?file.arrayBuffer():new Response(file).arrayBuffer()));
   if(bytes[0]===0x1f&&bytes[1]===0x8b)bytes=globalThis.pako.ungzip(bytes);
   const text=(utf8Decoder275?utf8Decoder275.decode(bytes):new TextDecoder().decode(bytes)).trim();
   const data=importData275(text.startsWith(PACKED_LIFE)?text:JSON.parse(text));
   const names=data.lives.slice(0,3).map(life=>`${life.name} ${life.surname}, ${years(life.age)}`).join('; ')+(data.lives.length>3?' и другие':'');
   const n=data.lives.length;
   show('Восстановить персонажей?',`В файле ${n} ${livesWord275(n)}: ${names}. ${n===1?'Она будет добавлена отдельной копией':'Они будут добавлены отдельными копиями'}; существующие жизни останутся.`,[
    {label:'Добавить сохранения',fn:()=>{try{const added=importLives(data);toast(importedText275(added));openLives();}catch(e){toast('Не удалось добавить: '+(e?.player275?e.message:'браузер не записал жизнь')+'.');}}},
    {label:'Отмена',fn:()=>{}}]);
  }catch(e){toast('Не удалось прочитать сохранение: '+(e?.player275?e.message:'файл повреждён или это не копия игры')+'.');}
 };
 input.style.display='none';
 document.body.append(input);
 input.addEventListener('change',()=>input.remove(),{once:true});
 input.addEventListener('cancel',()=>input.remove(),{once:true});
 input.click();
};

// ---------- Оформление ----------
function style275(){
 if(document.getElementById('save275-style'))return;
 const st=document.createElement('style');
 st.id='save275-style';
 st.textContent=`.save-box275{position:relative;display:inline-flex;align-items:center;gap:4px}
.save-status275{position:absolute;top:100%;right:6px;margin-top:-5px;font-size:11px;line-height:1.2;color:var(--muted);white-space:nowrap;pointer-events:none}
.save-status275.failed275{position:static;margin:0;pointer-events:auto}
.save-status275:empty{display:none}
.save-status275 button{border:0;border-radius:5px;padding:4px 5px;font-size:inherit;line-height:inherit;color:var(--red);text-decoration:underline;text-underline-offset:2px;background:transparent;white-space:normal;text-align:right}
.save-status275 .short275{display:none}
@media(max-width:700px){.save-box275{flex-direction:column;align-items:flex-end;gap:0}.save-status275{font-size:9px;margin-top:-5px;right:5px}.save-status275.failed275{margin:-4px 6px 0 0}.save-status275 button{padding:1px 0;max-width:100px;line-height:1.15}.save-status275 .long275{display:none}.save-status275 .short275{display:inline}}
.life-options21 .life-card21 .life-restore275{grid-column:1/-1;border:0;border-top:1px solid var(--line);border-radius:0;margin:0;padding:9px 16px;background:transparent;font-size:12px;line-height:1.4;color:var(--muted);text-align:left}
.life-options21 .life-card21 .life-restore275:hover{background:var(--hover);color:var(--ink)}`;
 document.head.append(st);
}

// ---------- После загрузки всех скриптов ----------
function afterLoad275(){
 style275();
 // Отложенная запись (save264.js) статус не меняет: «Сохраняется…» на 0,4 с дважды за игровой месяц мигало бы всё
 // время, пока идёт время. Меняется он, когда запись прошла (writeLife) или не прошла (здесь).
 if(typeof flushSave264==='function'){
  const flushBase275=flushSave264;
  flushSave264=function(...args){
   const target=typeof saveTarget264!=='undefined'?saveTarget264:null;
   saveIssue275=null;
   const result=flushBase275.apply(this,args);
   if(target&&!result){unsavedId275=target.saveId??null;setSaveStatus275('failed',saveIssue275||'other');}
   return result;
  };
 }
 // Начать новую жизнь, когда несохранённое пропало бы: «Другая жизнь →» после смерти (newLife) и «Родиться» на экране
 // новой жизни, куда ведёт и логотип (start; s при этом ещё открытая жизнь).
 if(typeof newLife==='function'){
  const newLifeBase275=newLife;
  newLife=function(...args){
   if(unsavedHere275()&&!trySaveNow275()){unsavedAsk275('начать новую жизнь','Всё равно начать новую',newLifeAnyway275,null);return;}
   return newLifeBase275.apply(this,args);
  };
 }
 if(typeof start==='function'){
  const startBase275=start;
  start=function(...args){
   // Продолжение за близкого (сборка 274) само зовёт start() с заполненной формой — его не прерывать.
   const continuing=typeof continuing274!=='undefined'&&continuing274;
   if(!continuing&&unsavedHere275()&&!trySaveNow275()){unsavedAsk275('начать новую жизнь','Всё равно начать новую',()=>startBase275.apply(this,args),null);return;}
   return startBase275.apply(this,args);
  };
 }
 // Восстановление из окна подтверждения идёт внутри choose(), то есть transact('choice') из events.js: он записал бы в
 // восстановленную жизнь «итог действия» — разницу между версией на экране и восстановленной (сотни событий и денег).
 if(typeof recordReceipt==='function'){
  const recordReceiptBase275=recordReceipt;
  recordReceipt=function(...args){
   if(skipReceipt275){skipReceipt275=false;return;}
   return recordReceiptBase275.apply(this,args);
  };
 }
 if(typeof openLives==='function'){
  const openLivesBase275=openLives;
  openLives=function(...args){
   const seen=[],readLifeBase=readLife;
   readLife=function(id,...rest){const life=readLifeBase.call(this,id,...rest);if(life&&!seen.some(x=>x.id===id))seen.push({id,life});return life;};
   let result;
   try{result=openLivesBase275.apply(this,args);}
   finally{readLife=readLifeBase;}
   try{decorateLives275(seen.sort((a,b)=>String(b.life.savedAt||'').localeCompare(String(a.life.savedAt||''))));}catch{}
   // «Новая жизнь» — через вопрос, если сыгранное в открытой жизни не сохранено.
   try{
    const button=[...document.querySelectorAll('#modal .options button')].find(b=>b.textContent.trim()==='Новая жизнь'),index=button?.getAttribute('onclick')?.match(/^choose\((\d+)\)$/);
    if(index)button.setAttribute('onclick',`newLifeAsk275(${index[1]})`);
   }catch{}
   return result;
  };
 }
 if(typeof deleteLife17==='function'){
  const deleteBase275=deleteLife17;
  deleteLife17=function(id,...args){
   dropPlain275(id);
   const ok=deleteJournalFits275(id)?deleteBase275.call(this,id,...args):deleteWithoutJournal275(id);
   if(ok){forgetWrite275(id);lastWrite275.delete(id);if(unsavedId275===id){unsavedId275=null;if(status275.state==='failed')setSaveStatus275('idle');}}
   return ok;
  };
 }
 loading275=false;
 if(startupBackup275&&s?.saveId===startupBackup275.id)showBackupNotice275(startupBackup275);
 if(deferredSave275&&s)save();
 deferredSave275=false;
 paintSaveStatus275();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterLoad275,{once:true});
else afterLoad275();
