'use strict';
// Сборка 270: полные тёзки.
// Генератор имён (individual.js, потом names256.js) сверяет новое имя со всеми людьми жизни, но не с игроком:
// у игрока в s.name хранится только личное имя, фамилия отдельно в s.surname, и проверка «не совпадать с s.name»
// никогда не срабатывала. Поэтому полный тёзка игрока выпадал с вероятностью 1/(имён × фамилий) на каждого нового
// человека — в странах с короткими списками (11 имён × 12 фамилий) это раз на ~130 человек.
// Кроме того, родственникам фамилия семьи ставится уже после проверки (assignFamilyName166, childBirthIdentity166),
// и брат или кузен мог получить ровно имя игрока или другого живого человека.
// Здесь: name() не возвращает полное имя игрока; после присвоения семейной фамилии и при рождении ребёнка личное имя
// меняется на другое из того же пула, если полное имя совпало с игроком или с живым человеком. Имя умершего повторять
// можно — детей называют в честь дедов.
function playerNames270(){
 if(!s?.name)return [];
 const out=[[s.name,s.surname].filter(Boolean).join(' ')];
 try{const parts=s.surnameParts256?.length?s.surnameParts256:(s.surname?[s.surname]:[]);if(parts.length&&typeof fullName256==='function')out.push(fullName256(s.name,parts,s.birthCountry||s.country,s.surnameJoiner256||' '));}catch(e){}
 return out;
}
const nameBase270=name;
name=function(country,gender){
 let r;
 const mine=playerNames270();
 for(let i=0;i<30;i++){r=nameBase270(country,gender);if(!mine.includes(r))return r;}
 return r;
};
function nameTaken270(p,full){
 if(!s||!full)return false;
 if(p!==s&&playerNames270().includes(full))return true;
 return (s.people||[]).some(q=>q!==p&&q.alive!==false&&q.name===full);
}
function givenPool270(p,country){
 const i=p.gender==='m'?1:0,given=p.givenName166;
 // Имя могло прийти из пула происхождения (extendedFamilyNames167): берём тот пул, где оно есть.
 if(typeof extendedFamilyNames167==='object'&&given)
  for(const pool of Object.values(extendedFamilyNames167)){const names=String(pool?.[i]||'').split(' ').filter(Boolean);if(names.includes(given))return names;}
 for(const c of [country,...Object.keys(countries)]){const names=countries[c]?.names?.[i];if(names?.includes(given))return names;}
 return countries[country]?.names?.[i]||countries.nl.names[i];
}
function dedupeGiven270(p){
 if(!s||!p||p===s||!nameTaken270(p,p.name))return;
 const country=p.birthCountry||p.country||s.country;
 const parts=p.surnameParts256?.length?p.surnameParts256:(p.surname?[p.surname]:[]);
 const joiner=p.surnameJoiner256||' ';
 const build=g=>parts.length&&typeof fullName256==='function'?fullName256(g,parts,country,joiner):[g,p.surname].filter(Boolean).join(' ');
 const pool=givenPool270(p,country).filter(g=>g!==p.givenName166);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 for(const g of pool){const full=build(g);if(!nameTaken270(p,full)){p.givenName166=g;p.name=full;return;}}
}
if(typeof assignFamilyName166==='function'){
 const assignBase270=assignFamilyName166;
 assignFamilyName166=function(p,...args){const r=assignBase270(p,...args);try{dedupeGiven270(p);}catch(e){}return r;};
}
if(typeof childBirthIdentity166==='function'){
 const birthBase270=childBirthIdentity166;
 childBirthIdentity166=function(child,...args){const r=birthBase270(child,...args);try{dedupeGiven270(child);}catch(e){}return r;};
}
// Полный тёзка как редкая находка: примерно в одной жизни из 50, в Корее и Китае — из 15 (там это обычное дело).
// В такой жизни в случайном возрасте (6–50 лет) один новый человек не из родни, вашего пола и из страны вашего
// рождения получает ровно ваше имя и фамилию. Запись в истории — когда он действительно появился среди ваших людей;
// если кандидат так и не попал в жизнь (отказались от знакомства), ждём следующего. Во всех остальных случаях
// генератор полного тёзку не даёт.
const namesakeKin270=new Set(['Бабушка','Дедушка','Приёмный опекун','Мать','Отец','Брат','Сестра','Сиблинг','Ребенок','Сын','Дочь','Внук','Внучка','Внук / внучка','Племянник','Племянница','Потомок','Родственник','Партнер','Партнёр','Супруг','Супруга']);
function namesakeRate270(country){return ['kr','cn'].includes(country)?1/15:1/50;}
function namesakeState270(){
 if(!s)return null;
 if(!s.namesake270){const home=s.birthCountry||s.country;s.namesake270={on:Math.random()<namesakeRate270(home),at:6+Math.floor(Math.random()*45),done:false};}
 return s.namesake270;
}
function namesakeTake270(p){
 const st=namesakeState270();
 if(!st?.on||st.done||st.pending||!p||p===s||s.age<st.at)return;
 if(p.gender!==s.gender||namesakeKin270.has(p.role)||(p.country||s.country)!==(s.birthCountry||s.country))return;
 const country=s.birthCountry||s.country,parts=s.surnameParts256?.length?[...s.surnameParts256]:(s.surname?[s.surname]:[]);
 if(!parts.length)return;
 const joiner=s.surnameJoiner256||' ';
 p.givenName166=s.name;p.surnameParts256=parts;p.surnameJoiner256=joiner;p.surname=parts.join(joiner);
 p.name=typeof fullName256==='function'?fullName256(s.name,parts,country,joiner):s.name+' '+p.surname;
 p.birthSurname256=p.surname;p.namesake270=true;
 st.pending={id:p.id,tick:s.clock?.ticks??0};
}
function namesakeCheck270(){
 const st=s?.namesake270;
 if(!st?.pending||st.done)return;
 const p=(s.people||[]).find(q=>q.id===st.pending.id);
 if(p){st.done=true;st.pending=null;log('Полный тёзка',(p.gender==='f'?'Новая знакомая: ':'Новый знакомый: ')+p.name+'. Вас зовут одинаково, до последней буквы.','Отношения');return;}
 if((s.clock?.ticks??0)>st.pending.tick)st.pending=null;
}
{
 const personBase270=person;
 person=function(...args){const p=personBase270(...args);try{namesakeTake270(p);}catch(e){}return p;};
 const ensureBase270=ensureUX;
 ensureUX=function(...args){const r=ensureBase270.apply(this,args);try{namesakeCheck270();}catch(e){}return r;};
}
