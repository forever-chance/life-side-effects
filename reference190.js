'use strict';
function referenceKey190(value){
 return String(value).toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]/g,'');
}

function referenceNumber190(value,currency=false){
 if(typeof value!=='number')return value||'';
 const unit=value>=1e6?1e6:value>=1000?1000:1;
 return '≈ '+(currency?'$':'')+new Intl.NumberFormat('ru',{maximumFractionDigits:unit===1?0:1}).format(value/unit)+
  (unit===1e6?' млн':unit===1000?' тыс.':'');
}

function placeReference190(country,city,label='Подробнее',travel=false,inline=false){
 const row=places190[country+'|'+city];
 if(!row)return label==='Подробнее'?'':esc(label);
 const [name,place,description,cityFacts,tour]=row;
 const fields=cityFacts?[
  ['Климат',cityFacts[0]],['Ландшафт',cityFacts[1]],['Население',referenceNumber190(cityFacts[2])],
  ['ВВП на душу населения',cityFacts[3]?referenceNumber190(cityFacts[3],true)+' · национальный ориентир':''],
  ...(travel&&tour?[['Тип отдыха',tour[0]],['Лучший сезон',tour[1]]]:[])
 ]:[['Климат',tour[2]],['Ландшафт',tour[3]],['Тип отдыха',tour[0]],['Лучший сезон',tour[1]]];
 return (inline?'':'<details class="place-reference190"><summary>'+esc(label)+'</summary>')+
  '<div class="reference-body190">'+(inline?'':'<strong>'+esc(place+', '+name)+'</strong>')+'<p>'+esc(description||'')+'</p><dl>'+fields.filter(([,v])=>v)
  .map(([k,v])=>'<div class="detail-row20"><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl></div>'+(inline?'':'</details>');
}

function origins190(person){
 return person?.origins?.length?person.origins:typeof person?.nationality==='string'?
   person.nationality.split(/\s*\/\s*/).filter(Boolean):[];
}

function originReference190(person){
 const groups=new Map();
 for(const origin of origins190(person)){
  const key=referenceKey190(origin),id=ethnicAliases190[key]||key;
  if(ethnic190[id])groups.set(id,ethnic190[id]);
 }
 const all=s.people||[],snapshot=s.dossier87?.birth?.parents||[];
 const biological=person===s?all.filter(p=>['Мать','Отец'].includes(p.role)):
  (person.birth49?.parents||(!person.bio27?.adopted&&!person.adopted49?person.bio27?.parents:[])||[])
   .map(id=>id==='player'?s:all.find(p=>p.id===id)).filter(Boolean);
 const adoptiveId=person===s?s.family17?.adoption141?.parentId:null;
 const adoptiveIds=person===s?(adoptiveId?[adoptiveId]:[]):person.bio27?.adopted||person.adopted49?person.bio27?.parents||[]:[];
 const adoptive=adoptiveIds.map(id=>id==='player'?s:all.find(p=>p.id===id)).filter(Boolean);
 const parents=[...new Map([...biological,...(person===s?snapshot:[]),...adoptive].reverse()
  .map(p=>[p===s?'player':p.id,p])).values()].reverse();
 const lines=parents.map(p=>{
  const saved=snapshot.find(q=>q.id===p.id);
  const origin=origins190(p),country=p.birthCountry||saved?.birthCountry;
  const city=p.birthCity||saved?.birthCity;
  const place=[city||'город не записан',countries[country]?.name].filter(Boolean).join(', ');
  if(!origin.length&&!city&&!country)return '';
  const role=adoptive.some(a=>a.id===p.id)?'Приёмная семья':p.role==='Мать'||p.role==='Отец'?p.role:p.gender==='f'?'Мать':'Отец';
  return '<li>'+esc(role+' · '+[p.name,origin.length?origin.join(' / '):'','Место рождения: '+place].filter(Boolean).join(' · '))+'</li>';
 }).filter(Boolean);
 return {hasGlossary:groups.size>0,html:[...groups.values()].map(([title,copy])=>'<p><strong>'+esc(title.charAt(0).toUpperCase()+title.slice(1))+'</strong> — '+esc(copy)+'</p>').join('')+
  (lines.length?'<p><strong>Семейное происхождение</strong></p><ul>'+lines.join('')+'</ul>':'')};
}

function openOrigin190(button,pin=false){
 let popup=document.querySelector('#origin-popup190');
 if(popup&&pin&&popup.dataset.pinned==='true'){closeOrigin190();return;}
 if(!popup){popup=document.createElement('div');popup.id='origin-popup190';popup.setAttribute('role','region');popup.setAttribute('aria-label','Справка о происхождении');document.body.append(popup);}
 popup.dataset.pinned=String(pin||popup.dataset.pinned==='true');
 popup.innerHTML=originReference190(s).html;
 const rect=button.getBoundingClientRect();
 popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-popup.offsetWidth-8))+'px';
 popup.style.top=Math.max(8,rect.bottom+popup.offsetHeight+8>innerHeight?rect.top-popup.offsetHeight-5:rect.bottom+5)+'px';
 button.setAttribute('aria-expanded','true');
}
function closeOrigin190(force=true){
 const popup=document.querySelector('#origin-popup190');
 if(!popup||!force&&popup.dataset.pinned==='true')return;
 popup.remove();
 document.querySelector('.origin-trigger190')?.setAttribute('aria-expanded','false');
}
window.addEventListener('resize',()=>closeOrigin190());
document.addEventListener('scroll',event=>{
 if(event.target.id!=='origin-popup190')closeOrigin190();
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOrigin190();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('.origin-trigger190,#origin-popup190'))closeOrigin190();});

function originInline190(value){
 const info=originReference190(s);
 return esc(value)+(info.hasGlossary?'<button type="button" class="origin-trigger190" aria-label="Справка о происхождении" aria-expanded="false" aria-controls="origin-popup190" onfocus="openOrigin190(this)" onblur="closeOrigin190(false)" onpointerenter="if(event.pointerType===\'mouse\')openOrigin190(this)" onpointerleave="closeOrigin190(false)" onclick="openOrigin190(this,true)">ⓘ</button>':'');
}
