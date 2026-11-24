'use strict';
let creatingLife33=false,visualSerial33=0;
const portraitBase33={start,save,ensureUX,profile05,npcCard,personDetail};
function portraitComplete34(asset){return !!asset&&portraitStages34.every(stage=>typeof asset.ages?.[stage.id]==='string'&&asset.ages[stage.id].length>0);}
function portraitStage34(age){const years=Math.max(0,Number(age)||0);return [...portraitStages34].reverse().find(stage=>years>=stage.minAge)||portraitStages34[0];}
function portraitAsset33(entity){return portraitCatalog33.find(a=>a.id===entity?.portrait33?.id&&portraitComplete34(a))||null;}
function portraitImage34(entity,asset=portraitAsset33(entity)){return asset?.ages?.[portraitStage34(entity?.age).id]||null;}
function portraitParents33(entity){const people=s.people||[];if(['Брат','Сестра'].includes(entity.role)||entity===s)return people.filter(p=>['Мать','Отец'].includes(p.role));const ids=entity.bio27?.parents||[...(entity.role==='Ребенок'?['player']:[]),...(entity.parentId?[entity.parentId]:[])];return ids.map(id=>id==='player'?s:people.find(p=>p.id===id)).filter(p=>p&&p!==entity);}
function portraitHint33(entity){const origins=(entity.origins||[]).join(' ').toLowerCase();if(/япон|корей|китай|хань|бурят|вьетнам|рюкю|чжуан|хуэй/.test(origins))return {style:'east-asian'};if(/алжир|турец|татар|сапотек|майя/.test(origins))return {tone:'medium'};if(/русское|сербское|черногор|фризское|бретон|англий|шотланд|валлий|немецкое|ирланд|португальское|баск|каталон/.test(origins))return {tone:'light'};return null;}
// Keep aliases resolvable for saved characters while removing them from new assignments.
const portraitAliases114 = new Set(['portrait-f-109-01','portrait-f-110-01']);
function portraitAssignable114(asset){return !portraitAliases114.has(asset.id)&&portraitComplete34(asset);}
function portraitPool33(entity){const all=portraitCatalog33.filter(portraitAssignable114);return ['f','m'].includes(entity.gender)?all.filter(a=>a.presentation==='any'||a.presentation===entity.gender):all;}
function assignPortrait33(entity){
 if(!entity||portraitAsset33(entity))return;
 let pool=portraitPool33(entity);if(!pool.length)return;
 const previous=entity.portrait33,legacy=portraitLegacy33.find(a=>a.id===previous?.id);
 // Only incomplete legacy families are replaced. Existing complete family IDs remain unchanged.
 if(legacy){const sameStyle=pool.filter(a=>a.style===legacy.style),sameTone=sameStyle.filter(a=>a.tone===legacy.tone);if(sameTone.length)pool=sameTone;else if(legacy.style==='east-asian'&&sameStyle.length)pool=sameStyle;else{const tone=pool.filter(a=>a.tone===legacy.tone);if(tone.length)pool=tone;}}
 const relatives=portraitParents33(entity).map(portraitAsset33).filter(Boolean),hint=portraitHint33(entity),used=new Set([s,...(s.people||[])].map(p=>p.portrait33?.id).filter(Boolean));
 const weights=pool.map(a=>{let weight=1;if(relatives.some(p=>p.style===a.style&&p.style==='east-asian'))weight+=14;if(relatives.some(p=>p.tone===a.tone))weight+=3;if(hint?.style===a.style)weight+=24;if(hint?.tone===a.tone)weight+=4;if(used.has(a.id))weight*=hint?.style===a.style?.4:.08;return weight;});
 s.visualSeed33??=Date.now().toString(36)+'-'+(++visualSerial33);
 let hash=2166136261;for(const char of s.visualSeed33+'|'+(entity.id||'player')+'|'+entity.name)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 let n=(hash/4294967296)*weights.reduce((n,w)=>n+w,0),chosen=pool.at(-1);
 for(let i=0;i<pool.length;i++){n-=weights[i];if(n<=0){chosen=pool[i];break;}}
 entity.portrait33={id:chosen.id,assigned:s.clock?.ticks??0,source:previous?.id?'migration34':relatives.length?'family-context':hint?'recorded-origin-context':'diverse-pool',...(previous?.id?{previousId:previous.id,previousSource:previous.source}: {})};
}
function ensurePortraits33(){if(!s||creatingLife33)return;const people=s.people||[];for(const p of people.filter(p=>['Мать','Отец'].includes(p.role)))assignPortrait33(p);assignPortrait33(s);for(const p of people)assignPortrait33(p);}
function portraitEntity33(id){return id==='player'?s:(s.people||[]).find(p=>p.id===id);}
function portraitHTML33(entity,id,large=false){const asset=portraitAsset33(entity),file=portraitImage34(entity,asset);if(!file)return `<span class="portrait-child33" aria-label="Портрет пока не задан">${esc(entity.name?.[0]||'·')}</span>`;return `<span class="portrait-button33 fixed-portrait36 ${large?'large33':''}" role="img" aria-label="Портрет: ${esc(entity.name)} · ${portraitStage34(entity.age).label}"><img src="${file}?v=${asset.imageVersion??166}" alt="" loading="lazy" decoding="async"></span>`;}
// Compatibility entry points from old HTML cannot change an existing life.
function choosePortrait33(){return false;}
function portraitPicker33(){return false;}
start=function(){creatingLife33=true;try{portraitBase33.start();}finally{creatingLife33=false;}ensurePortraits33();save();render();};
save=function(){ensurePortraits33();return portraitBase33.save();};
ensureUX=function(){portraitBase33.ensureUX();ensurePortraits33();};
profile05=function(){ensurePortraits33();return portraitBase33.profile05().replace(/<div class="avatar">[^<]*<\/div>/,`<div class="avatar portrait-main33">${portraitHTML33(s,'player',true)}</div>`);};
npcCard=function(p,compact=false){ensurePortraits33();return portraitBase33.npcCard(p,compact).replace('<h3>',`<div class="portrait-npc33">${portraitHTML33(p,p.id)}</div><h3>`);};
personDetail=function(id){portraitBase33.personDetail(id);const p=portraitEntity33(id);if(p)$('#modal').innerHTML+=`<div class="portrait-detail33">${portraitHTML33(p,id,true)}</div>`;};
if(s){ensurePortraits33();save();render();}
