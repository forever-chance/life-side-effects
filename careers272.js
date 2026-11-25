'use strict';
// 272: вакансии квартала одинаковы до и после перезагрузки страницы.
//
// Причина. careers45.js при каждой загрузке страницы сбрасывает path16().marketKey (строка `if(s){...}` в конце
// файла: так при подключении сборки 45 рынок пересобирался с новыми профессиями). Первый же makeVacancies16
// собирает рынок квартала заново — с тем же ключом и теми же id. Свою часть careers45 добавляет, только если
// careerMarket45 !== marketKey, а careerMarket45 остался от прежней сборки и равен новому ключу. Пересобранный
// список остаётся без младших вакансий (…-junior45) и без требований к опыту (experience45: старшие роли
// открыты без стажа) — до следующего квартала. Тот же сброс без снятия отметки делает pets38.js (один раз).
//
// Исправление (обёртка поверх всей цепочки makeVacancies16):
// 1. Если перед сборкой marketKey не равен careerMarket45, отметка careers45 относится к списку, который сейчас
//    будет собран заново: она снимается, и careers45 достраивает пересобранный список, как в новом квартале.
// 2. Сохранение, где список уже пересобран без careers45 (ключ и отметка совпали, а у вакансий рынка нет
//    experience45), собирается заново один раз.
// 3. Вакансии, которые после отклика заменила новая публикация (replaceVacancy23, случайная), при пересборке
//    с тем же ключом остаются на своих местах: иначе после перезагрузки возвращалась вакансия, на которую
//    уже откликнулись, а новая пропадала.
// Сброс marketKey при загрузке не тронут: он по-прежнему пересобирает рынок (тот же, детерминированный по кварталу).
const careers272Base={makeVacancies16};

// Список собран базой, но careers45 по нему не прошёл: у вакансий текущего рынка нет отметки опыта.
function marketMissesCareers272(x){
 if(!x.marketKey||x.marketKey!==x.careerMarket45||!Array.isArray(x.vacancies))return false;
 const prefix='vac-'+x.marketKey+'-';
 return x.vacancies.some(v=>v&&String(v.id).startsWith(prefix)&&v.experience45===undefined);
}

// Пересборка с тем же ключом даёт те же id в том же порядке; отличаются только места, где прежнюю вакансию
// заменила новая публикация. Их возвращаем. Если порядок разошёлся иначе (сменился набор профессий), не трогаем.
function keepReplaced272(prev,next){
 const n=Math.min(prev.length,next.length),prevIds=new Set(prev.map(v=>v?.id)),nextIds=new Set(next.map(v=>v?.id)),swap=[];
 for(let i=0;i<n;i++){
  const a=prev[i],b=next[i];
  if(!a||!b)return;
  if(a.id===b.id)continue;
  if(prevIds.has(b.id)||nextIds.has(a.id))return;
  swap.push(i);
 }
 for(const i of swap)next[i]=prev[i];
}

makeVacancies16=function(...args){
 const x=path16();
 if(!x)return careers272Base.makeVacancies16.apply(this,args);
 const prev=Array.isArray(x.vacancies)?x.vacancies:null,prevKey=x.marketKey??x.careerMarket45??null;
 if(marketMissesCareers272(x))x.marketKey=x.careerMarket45=null;
 if(x.marketKey!==x.careerMarket45)x.careerMarket45=null;
 const out=careers272Base.makeVacancies16.apply(this,args);
 if(prev&&prevKey&&x.marketKey===prevKey&&Array.isArray(x.vacancies)&&x.vacancies!==prev)keepReplaced272(prev,x.vacancies);
 return out;
};
