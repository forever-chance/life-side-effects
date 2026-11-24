'use strict';
const ARCHIVE='life-vault-v1',LIFE_PREFIX='life-character-',PACKED_LIFE='deflate-v1:';
const vaultBase={show,choose,closeModal,start,resume};
let selectingChoice=false,storageWarning=false,manualSave=false,loadedSave=null;
function validLife(v){return !!(v&&v.v===1&&typeof v.name==='string'&&v.name.length<150&&typeof v.surname==='string'&&countries[v.country]&&Number.isFinite(v.age)&&v.age>=0&&v.age<=120&&Number.isFinite(v.year)&&Number.isFinite(v.cash)&&Array.isArray(v.people)&&Array.isArray(v.log)&&Array.isArray(v.pending)&&v.flags&&v.people.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(p.age)))}
function parseLife(raw){
 try{
  if(raw?.startsWith(PACKED_LIFE)){
   const bytes=Uint8Array.from(atob(raw.slice(PACKED_LIFE.length)),char=>char.charCodeAt(0));
   raw=globalThis.pako.inflate(bytes,{to:'string'});
  }
  const life=JSON.parse(raw);
  return validLife(life)?life:null;
 }catch{return null}
}
function packLife(raw){
 if(!raw||raw.startsWith(PACKED_LIFE)||!globalThis.pako)return raw;
 const bytes=globalThis.pako.deflate(raw,{level:3});
 let binary='';
 for(let offset=0;offset<bytes.length;offset+=8192){
  binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
 }
 const packed=PACKED_LIFE+btoa(binary);
 return packed.length<raw.length?packed:raw;
}
function writeLife(key,raw,previous,backup){
 let stored=previous?.startsWith(PACKED_LIFE)?packLife(raw):raw;
 try{localStorage.setItem(key,stored);return stored;}
 catch(error){
  if(error?.name!=='QuotaExceededError')throw error;
 }
 stored=packLife(raw);
 const previousBackup=localStorage.getItem(backup),packedBackup=packLife(previousBackup);
 if(packedBackup!==previousBackup&&parseLife(previousBackup))localStorage.setItem(backup,packedBackup);
 try{localStorage.setItem(key,stored);return stored;}
 catch(error){
  if(error?.name!=='QuotaExceededError'||!parseLife(previous)||!previousBackup)throw error;
  localStorage.removeItem(backup);
  try{localStorage.setItem(key,stored);return stored;}
  catch(retryError){
   try{localStorage.setItem(backup,packedBackup);}catch{}
   throw retryError;
  }
 }
}
function vaultIndex(){try{const v=JSON.parse(localStorage.getItem(ARCHIVE));return v&&Array.isArray(v.ids)?v:{ids:[],active:null}}catch{return {ids:[],active:null}}}
function charId(){return 'life-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
function readLife(id){return parseLife(localStorage.getItem(LIFE_PREFIX+id))||parseLife(localStorage.getItem(LIFE_PREFIX+id+'-backup'))}
function saveManually(){
 if(!s)return;
 manualSave=true;
 try{
  if(save())toast('Сохранено в этом браузере · '+years(s.age));
 }catch{
  toast('Не удалось сохранить прогресс. Скачайте копию через «Персонажи».');
 }finally{manualSave=false}
}
function save(){
 if(!s)return false;
 try{
  if(!validLife(s)){
   if(manualSave||!storageWarning)toast('В данных персонажа ошибка. Предыдущее сохранение осталось в «Персонажах».');
   storageWarning=true;
   return false;
  }
  s.saveId??=charId();
  const id=s.saveId,key=LIFE_PREFIX+id,backup=key+'-backup';
  const previous=localStorage.getItem(key),legacy=localStorage.getItem(KEY);
  if(loadedSave?.id===id&&loadedSave.raw!==previous){
   if(manualSave||!storageWarning)toast('Эта вкладка больше не может обновить сохранение. Скачайте копию через «Персонажи» перед перезагрузкой.');
   storageWarning=true;
   return false;
  }
  const savedAt=new Date().toISOString();
  const raw=JSON.stringify({...s,savedAt});
  // Free duplicate storage only when a valid vault copy already exists.
  if(legacy===previous&&parseLife(previous))localStorage.removeItem(KEY);
  const stored=writeLife(key,raw,previous,backup);
  loadedSave={id,raw:stored};
  const index=vaultIndex();
  if(!index.ids.includes(id))index.ids.push(id);
  index.active=id;
  const indexJson=JSON.stringify(index);
  if(indexJson!==localStorage.getItem(ARCHIVE))localStorage.setItem(ARCHIVE,indexJson);
  if(legacy===localStorage.getItem(KEY)&&parseLife(legacy)?.saveId===id)localStorage.removeItem(KEY);
  if(parseLife(previous))try{localStorage.setItem(backup,stored.startsWith(PACKED_LIFE)?packLife(previous):previous);}catch{}
  s.savedAt=savedAt;
  storageWarning=false;
  return true;
 }catch(error){
  if(manualSave||!storageWarning){
   storageWarning=true;
   const reason=error?.name==='QuotaExceededError'?'Хранилище браузера заполнено.':error?.name==='SecurityError'?'Браузер заблокировал доступ к сохранениям.':'Браузер не записал прогресс.';
   toast(reason+' Скачайте копию через «Персонажи».');
  }
  return false;
 }
}
function settleChoice(){if(!s)return;ensureClock();if($('#modal').open)return;if(s.pending.length){s.clock.running=false;resolvePending();return}s.clock.running=!!s.clock.resumeAfterChoice&&!s.dead;s.clock.resumeAfterChoice=false;s.clock.choiceActive=false;clockCarry=0;clockStamp=Date.now();save();render()}
show=function(title,text,options=[]){if(s){ensureClock();if(!s.clock.choiceActive){s.clock.resumeAfterChoice=!!(s.clock.resumeAfterChoice||s.clock.running);s.clock.choiceActive=true}}vaultBase.show(title,text,options)};
choose=function(i){selectingChoice=true;try{vaultBase.choose(i)}finally{selectingChoice=false;settleChoice()}};
closeModal=function(){vaultBase.closeModal();if(!selectingChoice){if(s?.pending.length){s.clock.running=false;save();render()}else settleChoice()}};
$('#modal').addEventListener('cancel',event=>{event.preventDefault();closeModal()});
function openLives(){save();const index=vaultIndex(),lives=index.ids.map(id=>({id,life:readLife(id)})).filter(x=>x.life);show('Ваши персонажи','Каждая жизнь сохраняется отдельно после действий и игровых месяцев. При повреждении последней записи используется предыдущая копия. Сохранения находятся в этом браузере; скачанная копия позволит перенести их на другое устройство.',[
 ...lives.map(({id,life})=>({label:`${life.name} ${life.surname} · ${life.age} лет · ${countries[life.country].name}`,hint:`${life.dead?'Жизнь завершена':'Можно продолжить'} · ${life.year} год${id===s?.saveId?' · текущий персонаж':''}`,fn:()=>loadCharacter(id)})),
 {label:'Начать новую жизнь',hint:'Предыдущие персонажи останутся здесь',fn:()=>{save();s=null;intro()}},
 {label:'Скачать резервную копию всех персонажей',disabled:!lives.length,fn:()=>exportLives()},
 {label:'Восстановить из файла',fn:()=>pickSaveFile()}
 ]);}
function loadCharacter(id){
 if(s?.saveId===id&&!save())return;
 const key=LIFE_PREFIX+id,raw=localStorage.getItem(key);
 const next=parseLife(raw)||parseLife(localStorage.getItem(key+'-backup'));
 if(!next){toast('Обе копии этого сохранения недоступны. Можно восстановить файл.');return}
 if(s?.saveId!==id)save();
 s=next;
 loadedSave={id,raw};
 ensureClock();s.clock.running=false;s.clock.resumeAfterChoice=false;s.clock.choiceActive=false;
 tab='story';clockCarry=0;clockStamp=Date.now();save();render();
}
newLife=function(){show('Начать другую жизнь?','Текущий персонаж и его прогресс останутся в разделе «Персонажи».',[{label:'Пока остаться здесь',fn:()=>{}},{label:'К настройке новой жизни',fn:()=>{save();s=null;intro()}}])};
resume=function(){if(s){render();return}const index=vaultIndex();if(index.active&&readLife(index.active)){loadCharacter(index.active);return}vaultBase.resume();if(s){ensureClock();s.clock.running=false;save();render()}};
start=function(){save();vaultBase.start();if(s){s.saveId??=charId();save()}};
function exportLives(){save();const index=vaultIndex();const lives=index.ids.map(id=>s?.saveId===id?s:readLife(id)).filter(Boolean);if(s&&!lives.includes(s)&&validLife(s))lives.push(s);const blob=new Blob([JSON.stringify({format:'life-side-effects',version:1,exportedAt:new Date().toISOString(),lives},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='life-side-effects-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importLives(data){if(!data||data.format!=='life-side-effects'||!Array.isArray(data.lives)||!data.lives.length||data.lives.length>100||!data.lives.every(validLife))throw new Error('Неподходящий или поврежденный файл');const index=vaultIndex();const added=[];for(const life of data.lives){const copy=JSON.parse(JSON.stringify(life));copy.saveId=charId();if(copy.clock){copy.clock.running=false;copy.clock.resumeAfterChoice=false;copy.clock.choiceActive=false}const raw=JSON.stringify(copy);localStorage.setItem(LIFE_PREFIX+copy.saveId,raw);localStorage.setItem(LIFE_PREFIX+copy.saveId+'-backup',raw);index.ids.push(copy.saveId);added.push(copy.saveId)}localStorage.setItem(ARCHIVE,JSON.stringify(index));return added.length}
function pickSaveFile(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Файл слишком большой');const data=JSON.parse(await file.text());if(data.format!=='life-side-effects'||!Array.isArray(data.lives)||!data.lives.every(validLife))throw new Error('Неподходящий файл');show('Восстановить персонажей?',`В файле ${data.lives.length} сохранений. Они будут добавлены отдельными копиями; существующие жизни останутся.`,[{label:'Добавить сохранения',fn:()=>{try{const n=importLives(data);toast('Добавлено персонажей: '+n);openLives()}catch(e){toast(e.message)}}},{label:'Отмена',fn:()=>{}}])}catch(e){toast('Не удалось прочитать сохранение: '+e.message)}};input.style.display='none';document.body.append(input);input.addEventListener('change',()=>input.remove(),{once:true});input.addEventListener('cancel',()=>input.remove(),{once:true});input.click()}
window.addEventListener('pagehide',()=>save());
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
// Independent index allows recovery even if the legacy active-save key is damaged.
{const index=vaultIndex();let recovered=index.active?readLife(index.active):null;if(!recovered){const keys=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(LIFE_PREFIX)&&!key.endsWith('-backup'))keys.push(key.slice(LIFE_PREFIX.length))}const candidates=keys.map(readLife).filter(Boolean).sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));recovered=candidates[0]||null;}if(recovered){s=recovered;loadedSave={id:s.saveId,raw:localStorage.getItem(LIFE_PREFIX+s.saveId)};}if(s){ensureClock();s.clock.running=false;s.clock.resumeAfterChoice=false;s.clock.choiceActive=false;if(!recovered||index.active!==s.saveId||!parseLife(loadedSave?.raw))save();render()}}
