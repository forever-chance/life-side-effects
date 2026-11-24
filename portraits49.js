'use strict';
// Visual continuity only: origins never affect abilities, personality or income.
const portraitBase49={person,portraitParents33,personSections42};
const hair49=Object.fromEntries(Object.entries({brown:['1-01','3-06','1-07','5-04'],blond:['4-03','5-10','1-06','3-02','1-09','2-08','3-08','4-07','5-02'],red:['f-110-01','2-04','1-04','1-10','3-04'],dark:['2-10','2-05','3-07','1-03','2-06','5-05','1-08','3-09','3-03','2-09','4-09','3-05','4-10','4-04','4-08','3-01','4-01','5-06','1-05','4-05','4-06','5-01','5-07','5-09']}).flatMap(([hair,ids])=>ids.map(id=>['portrait-'+id,hair])));
function portraitHair49(asset){return asset?.naturalHair ?? hair49[asset?.id] ?? 'dark';}
function visualState49(){return s.visual49??={version:1,holders:{},used:{}};}
function visualHash49(value){s.visualSeed33??=Date.now().toString(36)+'-'+(++visualSerial33);let hash=2166136261;for(const c of s.visualSeed33+'|'+value)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;return hash/4294967296;}
function originProfiles49(origins){return (origins||[]).flatMap(origin=>{const text=origin.toLowerCase();if(Object.hasOwn(portraitPreferences96,text))return [];if(/япон|корей|китай|хань|бурят|вьетнам|рюкю|чжуан|хуэй/.test(text))return [{shape:'east-asian',tones:['light','medium'],hair:['dark']}];if(/алжир|турец|татар|сапотек|майя/.test(text))return [{shape:'varied',tones:['medium','light'],hair:['dark','brown']}];if(/русское|сербское|черногор|фриз|бретон|англий|шотланд|валлий|немец|ирланд|португаль|баск|каталон|нидерланд|француз|испан|венгер/.test(text))return [{shape:'varied',tones:['light'],hair:['dark','brown','blond','red']}];return [];});}
// Editorial preferences within the existing art, keyed to family background.
const portraitPreferences96 = {
 'итальянское': {style:'varied',tones:['light','medium'],hair:['dark','brown']},
 'австралийское': {},
 'турецкое': {style:'varied',tones:['light','medium'],hair:['dark','brown']},
 'южноафриканское': {tones:['medium','deep']},
 'тайское': {style:'east-asian',tones:['medium'],hair:['dark']},
 'норвежское': {style:'varied',tones:['light'],hair:['blond','brown','red']},
 'индийское': {style:'varied',tones:['medium','deep'],hair:['dark']},
 'индонезийское': {tones:['medium','deep'],hair:['dark']},
 'египетское': {style:'varied',tones:['medium','deep'],hair:['dark']},
 'марокканское': {style:'varied',tones:['light','medium','deep'],hair:['dark','brown']},
 'польское': {style:'varied',tones:['light'],hair:['blond','brown','dark']},
};

function choosePortrait96(p, pool, parents, used, key) {
 const origins = parents.length ? [] : p.origins || [];
 const profiles = origins.map(origin => portraitPreferences96[origin]).filter(Boolean);
 const featured = asset => Math.max(0,...origins.map(origin=>asset.origins100?.[origin] || 0));
 if (profiles.every(profile => !Object.keys(profile).length) && !pool.some(featured)) {
  const min = Math.min(...pool.map(asset => used[asset.id] || 0));
  const fresh = pool.filter(asset => (used[asset.id] || 0) === min);
  return fresh[Math.floor(visualHash49(key+':face')*fresh.length)];
 }
 const weights = pool.map(asset => {
  const preference = Math.max(0,...profiles.map(profile =>
   (asset.style === profile.style ? 1 : 0) +
   (profile.tones?.includes(asset.tone) ? 2 : 0) +
   (profile.hair?.includes(portraitHair49(asset)) ? 1 : 0)));
  return (1 + preference * preference + featured(asset)) / (1 + 3 * (used[asset.id] || 0));
 });
 let roll = visualHash49(key+':face') * weights.reduce((sum, weight) => sum + weight, 0);
 return pool.find((asset, index) => (roll -= weights[index]) < 0) || pool.at(-1);
}
function adoptedVisual49(p){return p.adopted49||p.bio27?.adopted||p.birth49?.method==='adoption';}
portraitParents33=function(p){if(adoptedVisual49(p))return [];if(p.birth49?.parents)return p.birth49.parents.map(id=>id==='player'?s:(s.people||[]).find(x=>x.id===id)).filter(x=>x&&x!==p);return portraitBase49.portraitParents33(p);};
person=function(role,age,gender,country,originCity){
 const p=portraitBase49.person(role,age,gender,country);
 const options=origins17[p.country]||[];
 if(!p.origins?.length&&options.length){
  const roll=visualHash49('origin:'+p.id);
  const city=originCity||p.city18||(p.country===s.country?residenceCity():countries[p.country]?.city);
  const origin=typeof demographicOrigin165==='function'?demographicOrigin165(p.country,city,roll):null;
  p.origins=[origin??options[Math.floor(roll*options.length)]];
  p.birthCountry=p.country;
  p.originSource49='generated-family-background';
  if(typeof extendedFamilyNames167!=='undefined'&&(extendedFamilyNames167[p.origins[0]]||familyNameCountries166[p.origins[0]]&&familyNameCountries166[p.origins[0]]!==p.country)){
   assignFamilyName166(p,p.country,p.origins[0]);
  }
 }
 return p;
};
function rememberVisual49(p,asset){
 if(!asset)return;
 const state=visualState49(),key=p===s?'player':p.id||p.name;
 if(state.holders[key]!==asset.id){
  state.holders[key]=asset.id;
  state.used[asset.id]=(state.used[asset.id]||0)+1;
 }
 const hair=portraitHair49(asset);
 if(p.appearance49?.asset!==asset.id||p.appearance49.hair!==hair){
  const parents=portraitParents33(p);
  const lineageHair=[...new Set(parents.flatMap(parent=>parent.appearance49
   ? [parent.appearance49.hair,...(parent.appearance49.lineageHair||[])] : []))].slice(0,6);
  p.appearance49={asset:asset.id,shape:asset.style,tone:asset.tone,hair,lineageHair,source:p.portrait33.source};
 }
}

function compatiblePortraits49(p,pool,parents,key){
 const profiles=parents.map(parent=>parent.appearance49).filter(Boolean);
 const origins=originProfiles49(p.origins);
 const choices=profiles.length?profiles:origins;
 const chosen=choices[Math.floor(visualHash49(key+(profiles.length?':parent':':origin'))*choices.length)];
 if(!chosen)return pool;

 const hair=new Set(profiles.length?profiles.map(profile=>profile.hair):chosen.hair||[]);
 if(profiles.length&&visualHash49(key+':recessive')<.06){
  for(const profile of profiles)for(const color of profile.lineageHair||[])hair.add(color);
 }
 if(hair.has('dark')||hair.has('brown')){
  hair.add('dark');
  hair.add('brown');
 }
 if(profiles.length&&!hair.has('red'))pool=preferPortraitMatches49(pool,asset=>portraitHair49(asset)!=='red');
 if(profiles.length&&!hair.has('blond'))pool=preferPortraitMatches49(pool,asset=>portraitHair49(asset)!=='blond');
 pool=preferPortraitMatches49(pool,asset=>asset.style===chosen.shape);
 const rank=['light','medium','deep'];
 const tones=profiles.length&&profiles.every(profile=>profile.shape==='east-asian')
  ? ['light','medium'] : profiles.length?profiles.map(profile=>profile.tone):chosen.tones||[];
 const indexes=tones.map(tone=>rank.indexOf(tone)).filter(index=>index>=0);
 if(indexes.length){
  const lower=Math.min(...indexes),upper=Math.max(...indexes);
  pool=preferPortraitMatches49(pool,asset=>rank.indexOf(asset.tone)>=lower&&rank.indexOf(asset.tone)<=upper);
 }
 return hair.size?preferPortraitMatches49(pool,asset=>hair.has(portraitHair49(asset))):pool;
}
function preferPortraitMatches49(pool,match){
 const matching=pool.filter(match);
 return matching.length?matching:pool;
}
assignPortrait33=function(p,visiting=new Set()){if(!p)return;const existing=portraitAsset33(p);if(existing){rememberVisual49(p,existing);return;}if(visiting.has(p))return;visiting.add(p);const parents=portraitParents33(p);parents.forEach(parent=>assignPortrait33(parent,visiting));if(parents.length){const origins=[...new Set(parents.flatMap(x=>x.origins||[]))];if(origins.length){p.origins=origins;p.originSource49='parents';}}
 let pool=portraitPool33(p);if(!pool.length){visiting.delete(p);return;}const key=(p===s?'player':p.id)+'|'+p.name;const manual=creationPortrait36&&portraitCatalog33.find(a=>a.id===creationPortrait36);let selected=p===s&&creatingLife33&&pool.includes(manual)?manual:null;
 if(!selected){if(manual&&p!==s&&pool.length>1)pool=pool.filter(a=>a!==manual);pool=compatiblePortraits49(p,pool,parents,key);for(const entity of [s,...(s.people||[])])if(entity!==p){const asset=portraitAsset33(entity);if(asset)rememberVisual49(entity,asset);}selected=choosePortrait96(p,pool,parents,visualState49().used,key);}
 const previous=p.portrait33;p.portrait33={id:selected.id,assigned:s.clock?.ticks??0,source:selected===manual?'creation36':parents.length?'family49':p.origins?.length?'origin49':'variety49',...(previous?.id?{previousId:previous.id}:{})};rememberVisual49(p,selected);visiting.delete(p);};
personSections42=function(p){return portraitBase49.personSections42(p).filter(section=>p.age>=6||section.title!=='Характерная реплика').map(section=>({...section,rows:section.rows.map(row=>row.label==='Занятие'&&p.age<18&&!p.bio27?.job?fact20('Занятие',p.age<6?'Раннее детство':'Учёба'):row)}));};
if(s){ensurePortraits33();save();render();}
