'use strict';
let creationPortrait36=null;
const creationBase36={intro,start};
function creationPool36(){const gender=$('#gender')?.value;return portraitCatalog33.filter(a=>portraitAssignable114(a)&&(!['f','m'].includes(gender)||a.presentation===gender));}
function creationPreview36(){const el=$('#creationPortrait36');if(!el)return;const a=portraitCatalog33.find(a=>a.id===creationPortrait36);el.innerHTML=a?`<span class="portrait-button33 large33"><img src="${a.ages.adult}?v=042" alt="Выбранный взрослый облик"></span>`:'';for(const [id,selected] of [['#creationRandom42',!a],['#creationChoose42',!!a]]){const button=$(id);button?.setAttribute?.('aria-pressed',String(selected));button?.classList?.toggle('selected',selected);}}
function selectCreationPortrait36(id){if(!$('#creationPortrait36'))return false;const a=id?creationPool36().find(a=>a.id===id):null;if(id&&!a)return false;creationPortrait36=a?.id||null;if(a&&$('#gender').value==='random')$('#gender').value=a.presentation;closeModal();creationPreview36();return true;}
// Curated gallery associations for older illustrations without source tags.
const creationPortraitGroups219=[
 [['jp','kr','cn'],['1-05','2-09','3-01','3-05','3-07','4-05','4-08','5-06']],
 [['th','id'],['1-05','2-09','3-01','3-07','4-08','5-06']],
 [['ru','rs','pl'],['1-06','1-07','1-09','2-04','2-08','3-02','3-08','4-03','5-04','5-10']],
 [['es','it','tr','mx','br'],['1-01','1-03','1-07','3-06','4-04','4-06','4-10','5-05','5-07']],
 [['mx','br','us','ca','za'],['2-06','2-10','3-03','3-09','4-01','4-09','5-01','5-09']],
 [['au','ca','de','fr','nl','no','uk','us'],['1-04','1-08','1-10','2-05','3-04','4-07','5-02','f-109-01','f-110-01']]
];
// Extra gallery choices overlap across countries. Family origins stay in origins100.
const portraitGalleryOverlap237 = {
 au:['ca','us','uk','nl','za','id','in'],
 br:['mx','us','za','es'],
 ca:['us','uk','fr','au','nl'],
 cn:['jp','kr','th','ca','us'],
 de:['nl','pl','no','fr','tr'],
 eg:['ma','tr','fr','za'],
 es:['mx','br','fr','it','ma'],
 fr:['ca','nl','de','es','ma'],
 id:['th','au','in','nl','cn'],
 in:['uk','ca','au','za','id'],
 it:['rs','es','fr','de','tr'],
 jp:['kr','cn','th','us','au'],
 kr:['jp','cn','th','ca','us'],
 ma:['eg','fr','es','nl','tr'],
 mx:['us','br','es','ca'],
 nl:['de','uk','no','fr','id'],
 no:['nl','de','uk','ca','pl'],
 pl:['de','no','ru','rs','uk'],
 rs:['it','ru','pl','tr','de'],
 ru:['rs','pl','de','no','ca'],
 th:['id','cn','kr','jp','au'],
 tr:['de','nl','rs','it','eg'],
 uk:['ca','au','us','nl','in'],
 us:['ca','au','uk','mx','br'],
 za:['au','uk','nl','br','in']
};
const portraitGalleryCache237=new WeakMap();
function creationPortraitCountries237(asset){
 if(portraitGalleryCache237.has(asset))return portraitGalleryCache237.get(asset);
 const supported=Object.keys(countries);
 const tags=Object.keys(asset.origins100||{});
 const id=asset.id.slice('portrait-'.length);
 const inherited=creationPortraitGroups219.filter(([,ids])=>ids.includes(id)).flatMap(([codes])=>codes);
 const primary=supported.filter(code=>inherited.includes(code)||tags.some(tag=>Object.hasOwn(demography165[code]?.base||{},tag)));
 const result=new Set(primary.length?primary:supported);
 if(primary.length){
  const options=[...new Set(primary.flatMap(code=>portraitGalleryOverlap237[code]||[]))]
   .filter(code=>Object.hasOwn(countries,code)&&!result.has(code));
  const seed=[...id].reduce((value,char)=>Math.imul(value,31)+char.charCodeAt(0)|0,0)>>>0;
  const extra=Math.min(options.length,2);
  for(let index=0;index<extra;index++)result.add(options[(seed+index)%options.length]);
 }
 portraitGalleryCache237.set(asset,result);
 return result;
}
function creationPortraitCountryMatch219(asset,country){
 return creationPortraitCountries237(asset).has(country);
}
function renderCreationPortraits36(){
 const grid=$('#creationPortraitGrid36');
 if(!grid)return;
 const gender=$('#creationPortraitGender36')?.value||'';
 const country=$('#creationPortraitCountry36')?.value||'';
 const portraits=creationPool36().filter(a=>(!gender||a.presentation===gender)&&
  (!country||creationPortraitCountryMatch219(a,country)));
 grid.innerHTML=portraits.length?portraits.map((a,i)=>`<button type="button" onclick="selectCreationPortrait36('${a.id}')" aria-label="Взрослый портрет ${i+1}" aria-pressed="${creationPortrait36===a.id}"><img src="${a.ages.adult}?v=166" alt="" loading="lazy"></button>`).join(''):'<p class="creation-portraits-empty219" role="status">Нет портретов с такими фильтрами. Выберите другую страну или «Все страны».</p>';
}
function creationPortraitMenu36(){
 if(!$('#creationPortrait36'))return;
 const gender=$('#gender')?.value;
 const countryOptions=Object.entries(countries).sort((a,b)=>a[1].name.localeCompare(b[1].name,'ru'))
  .map(([id,country])=>`<option value="${id}">${esc(country.name)}</option>`).join('');
 show('Внешность нового персонажа','Показан взрослый облик. При старте с рождения появится детский вариант. Фильтры стран пересекаются. Один портрет может быть доступен в нескольких странах.',[
  {label:'Случайно по контексту семьи',fn:()=>selectCreationPortrait36(null)},{label:'Закрыть',fn:()=>{}}
 ]);
 $('#modal').insertAdjacentHTML('beforeend',`<div class="creation-filters185">
 <label class="field">Пол<select id="creationPortraitGender36" onchange="renderCreationPortraits36()">
 ${!['m','f'].includes(gender)?'<option value="">Любой</option>':''}
 ${gender!=='f'?'<option value="m">Мужской</option>':''}
 ${gender!=='m'?'<option value="f">Женский</option>':''}</select></label>
 <label class="field">Страна<select id="creationPortraitCountry36" onchange="renderCreationPortraits36()">
 <option value="">Все страны</option>${countryOptions}</select></label></div>
 <div class="portrait-grid33" id="creationPortraitGrid36"></div>`);
 renderCreationPortraits36();
}

intro=function(){creationPortrait36=null;creationBase36.intro();const app=$('#app');app.innerHTML=app.innerHTML.replace('<button class="primary" onclick="start()"',`<section class="creation-face36"><div class="creation-mode42" role="group" aria-label="Выбор облика"><button id="creationRandom42" type="button" class="selected" aria-pressed="true" onclick="selectCreationPortrait36(null)">Случайный облик</button><button id="creationChoose42" type="button" aria-pressed="false" onclick="creationPortraitMenu36()">Выбрать облик</button></div><div id="creationPortrait36"></div></section><button class="primary" onclick="start()"`);$('#gender')?.addEventListener('change',()=>{if(creationPortrait36&&!creationPool36().some(a=>a.id===creationPortrait36)){creationPortrait36=null;creationPreview36();}});};
start=function(){const selected=creationPool36().find(a=>a.id===creationPortrait36);creationBase36.start();if(selected&&selected.presentation===s.gender)s.portrait33={id:selected.id,assigned:s.clock.ticks,source:'creation36'};creationPortrait36=null;save();render();};
if(s)render();else intro();
