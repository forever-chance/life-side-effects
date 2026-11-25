'use strict';
// Сборка 272.2: итоги детского конкурса, концерта или вечера (social86, «… · результаты»).
// Было: после записи «Выступление состоялось…» (childhood67) приходило ещё окно «Момент выбора» с одной кнопкой
// «Прочитано», время вставало на паузу, а текст «Вы — сертификат участника и +2 к навыку» не говорил, к какому.
// Стало: окна нет; к той же записи в истории дописано, что получено и какой навык вырос и на сколько. Навык
// по-прежнему растёт как раньше: +2 за участие (childhood67), ещё +3 за призовое место (social86), всего +5.
function contestResult2722(q,p){
 const won=q.result==='prize',key=q.hobby;
 const name=(typeof hobbies==='object'&&hobbies[key]?.[0])||'';
 const got=won?'Призовое место и диплом.':'Сертификат участника.';
 return got+' '+(name?name+': навык +':'Навык +')+(won?5:2)+'.';
}
{
 const base2722=notice61;
 notice61=function(type,title,note,data={},...rest){
  if(type!=='contest86')return base2722.call(this,type,title,note,data,...rest);
  try{
   const q=childhood67().offers.find(x=>x.id===data?.event86),p=q&&eventPerson67(q);
   if(q&&p){
    const add=contestResult2722(q,p),head=q.title+(p===s?'':' · '+p.name);
    // Запись childhood67 о самом выступлении — среди последних; итог дописывается к ней, без второй записи.
    const e=(s.log||[]).slice(0,8).find(x=>x&&x.title===head&&x.tag==='Детство'&&x.year===s.year&&!x.contest2722);
    if(e){e.text=String(e.text||'').trim()+' '+add;e.contest2722=true;}
    else log(head,add,'Детство');
    return null;
   }
  }catch(e){}
  return base2722.call(this,type,title,note,data,...rest);
 };
}
