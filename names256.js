'use strict';
// Naming conventions are game defaults, not a civil-registration simulator.
function genderSurname256(value,gender,country){return String(value||'').split('-').map(x=>{
 if(country==='ru'){if(gender==='m')return x.replace(/(ов|ев|ёв|ин)а$/u,'$1').replace(/ская$/u,'ский').replace(/цкая$/u,'цкий');return x.replace(/(ов|ев|ёв|ин)$/u,'$1а').replace(/ский$/u,'ская').replace(/цкий$/u,'цкая');}
 if(country==='pl')return gender==='m'?x.replace(/ская$/u,'ский').replace(/цкая$/u,'цкий'):x.replace(/ский$/u,'ская').replace(/цкий$/u,'цкая');return x;
}).join('-');}
for(const [country,data] of Object.entries(extraNames256)){
 if(!countries[country])continue;
 for(const [i,g] of ['f','m'].entries())countries[country].names[i]=[...new Set([...countries[country].names[i],...data[g]])];
 countries[country].surnames=[...new Set([...countries[country].surnames,...data.surnames])];
 const r=expansion95[country];if(r){r.surnameOptional=false;if(Array.isArray(r.surnames))r.surnames=[...new Set([...r.surnames,...data.surnames])];else for(const g of ['f','m'])r.surnames[g]=[...new Set([...r.surnames[g],...data.surnames.map(n=>genderSurname256(n,g,country))])];}
 for(const kind of Object.keys(petKinds))for(const sex of ['m','f']){const key=country+':'+kind+':'+sex;const pool=petNamePools182[key]??=[];for(const n of data.pets)if(!pool.some(x=>x[0]===n))pool.push([n,2]);}
}
const namingNotes256={
 es:'Испания: ребёнку передаётся по первой фамилии каждого родителя. Порядок выбирает семья и сохраняет для следующих общих детей. При браке обычно сохраняют свои фамилии.',
 mx:'Мексика: распространены две родительские фамилии. Здесь можно выбрать их порядок; региональные юридические процедуры игра не моделирует.',
 br:'Бразилия: часто соединяют фамилии материнской и отцовской линий, но порядок может быть другим. Здесь передаётся по одной части от каждого родителя.',
 nl:'Нидерланды: ребёнку можно выбрать фамилию одного родителя или сочетание двух. При браке меняется используемое имя; собственная официальная фамилия сохраняется.',
 ru:'Россия: фамилия одного родителя или двойная; окончания вроде Иванов / Иванова согласуются с полом персонажа.',
 pl:'Польша: фамилия одного родителя или двойная; формы вроде Ковальский / Ковальская согласуются с полом персонажа.',
 jp:'Япония: фамилия выводится перед личным именем. Традиционная модель — общая семейная фамилия. В игре выбор фамилии оставлен свободным.',
 kr:'Корея: фамилия перед личным именем; при браке обычно сохраняют свою фамилию.',
 cn:'Китай: фамилия перед личным именем; при браке обычно сохраняют свою фамилию.',
 id:'Индонезия: традиции сильно различаются, наследуемая фамилия есть не у всех. Для единого формата игры у каждого персонажа есть семейная часть имени.',
 in:'Индия: правила зависят от региона и семейной традиции. Здесь используется упрощённая модель личного имени и наследуемой семейной части.',
 ca:'Канада: традиции и правила различаются по провинциям. В игре доступен выбор личной и общей семейной фамилии.',
 za:'ЮАР: семейные традиции различаются. Здесь фамилия наследуется от родителей, а выбор после брака остаётся за персонажем.'
};
function namingNote256(country){return namingNotes256[country]||'Семейная фамилия передаётся от родителей. Можно сохранить свою, выбрать фамилию партнёра или соединить две. Это игровые варианты, без моделирования юридических процедур.';}
function surnamePool256(country,gender){const r=expansion95[country];return [...new Set((r?(r.surnames[gender]||r.surnames):countries[country].surnames).map(n=>genderSurname256(n,gender,country)))];}
identitySurname=function(country,gender){country=countries[country]?country:'nl';return pick(surnamePool256(country,gender));};
function defaultParts256(country,gender){const one=identitySurname(country,gender);if(!['es','mx','br'].includes(country))return [one];return [one,pick(surnamePool256(country,gender).filter(x=>x!==one))||one];}
function fullName256(given,parts,country,joiner=' '){const surname=parts.join(joiner);return ['jp','kr','cn'].includes(country)?surname+' '+given:given+' '+surname;}
function parseParts256(value,country,gender){
 const v=String(value||'').trim();if(!v)return [];
 // Particles such as "ван ден Берг" are part of one surname.
 if(['es','mx','br'].includes(country)){const pool=surnamePool256(country,gender).sort((a,b)=>b.length-a.length);for(const a of pool){if(v.startsWith(a+' ')){const rest=v.slice(a.length+1);if(pool.includes(rest))return [a,rest];}}}
 return [v];
}
function identity256(p){
 const country=p.birthCountry||p.country||s.country;
 if(p===s){if(!p.surnameParts256||p.surnameParts256.join(p.surnameJoiner256||' ')!==p.surname)p.surnameParts256=parseParts256(p.surname,country,p.gender);p.birthSurname256??=p.surname;return p;}
 if(p.naming256)return p;
 let given=p.givenName166,surname=p.surname;
 const text=String(p.name||'').trim();
 if(!given){const firsts=[...new Set(Object.values(countries).flatMap(c=>c.names[p.gender==='m'?1:0]))].sort((a,b)=>b.length-a.length);given=firsts.find(n=>text===n||text.startsWith(n+' '));if(!given&&['jp','kr','cn'].includes(country))given=firsts.find(n=>text.endsWith(' '+n));}
 if(!surname&&given){surname=text.startsWith(given+' ')?text.slice(given.length+1):text.endsWith(' '+given)?text.slice(0,-given.length-1):'';}
 // Preserve an unfamiliar existing full name rather than silently replacing it.
 if(!given){const split=text.indexOf(' ');given=split<0?text:text.slice(0,split);surname??=split<0?'':text.slice(split+1);}
 given ||= pick(countries[country]?.names[p.gender==='m'?1:0]||countries.nl.names[0]);
 p.givenName166=given;p.surnameParts256=surname?parseParts256(surname,country,p.gender):defaultParts256(country,p.gender);
 p.surname=p.surnameParts256.join(' ');p.name=fullName256(given,p.surnameParts256,country);p.birthSurname256??=p.surname;p.naming256=true;return p;
}
name=function(country,gender){country=countries[country]?country:'nl';if(namesLife!==s){namesLife=s;nameReservations=new Set();}const used=new Set([...(s?.people||[]).map(p=>p.name),...nameReservations]);let result;for(let i=0;i<100;i++){result=fullName256(pick(countries[country].names[gender==='m'?1:0]),defaultParts256(country,gender),country);if(!used.has(result))break;}nameReservations.add(result);return result;};
const personBase256=person;
person=function(...args){return identity256(personBase256(...args));};
const familyNameBase256=familyName166;
familyName166=function(country,gender,origin){const result=familyNameBase256(country,gender,origin),culture=familyNameCountries166[origin]||country;result.surname=genderSurname256(result.surname,gender,culture);if(['es','mx','br'].includes(culture))result.surname=[result.surname,identitySurname(culture,gender)].join(' ');return result;};
const assignBase256=assignFamilyName166;
assignFamilyName166=function(p,country,origin){assignBase256(p,country,origin);delete p.naming256;delete p.surnameParts256;identity256(p);p.birthSurname256=p.surname;};
function parentParts256(p){identity256(p);if(p.legalSurnameParts256?.length)return p.legalSurnameParts256;return p.surnameParts256?.length?p.surnameParts256:parseParts256(p.surname,p.birthCountry||p.country,p.gender);}
function inheritedPart256(p){const parts=parentParts256(p);return (p.birthCountry||p.country)==='br'?parts.at(-1):parts[0];}
function parentKey256(parents){return parents.map(p=>p===s?'player':p.id).sort().join('|');}
function childChoices256(child,parents){
 const country=child.birthCountry||child.country,convert=n=>genderSurname256(n,child.gender,country);
 const available=parents.filter(Boolean);if(!available.length)return [{label:'Текущая фамилия',parts:parentParts256(child),joiner:' '}];
 const stored=s.familyNames256?.[parentKey256(available)];if(stored&&['es','nl'].includes(country))return [{label:'Как у общих братьев и сестёр',parts:stored.parts.map(convert),joiner:stored.joiner}];
 if(available.length===1)return [{label:'Фамилия родителя',parts:parentParts256(available[0]).map(convert),joiner:available[0].surnameJoiner256||' '}];
 const a=convert(inheritedPart256(available[0])),b=convert(inheritedPart256(available[1]));
 const two=[{label:'Обе: сначала ваша',parts:[a,b],joiner:' '},{label:'Обе: сначала второго родителя',parts:[b,a],joiner:' '}];
 if(['es','mx','br'].includes(country))return country==='br'&&available[0].gender==='m'?two.reverse():two;
 const both=a===b?[]:[{label:'Двойная: сначала ваша',parts:[a,b],joiner:country==='nl'?' ':'-'},{label:'Двойная: сначала второго родителя',parts:[b,a],joiner:country==='nl'?' ':'-'}];
 return [{label:'Ваша фамилия',parts:parentParts256(available[0]).map(convert),joiner:available[0].surnameJoiner256||' '},{label:'Фамилия второго родителя',parts:parentParts256(available[1]).map(convert),joiner:available[1].surnameJoiner256||' '},...both];
}
function setPersonName256(p,given,parts,joiner=' '){p.givenName166=given;p.surnameParts256=[...parts];p.surnameJoiner256=joiner;p.surname=parts.join(joiner);p.name=fullName256(given,parts,p.birthCountry||p.country,joiner);p.naming256=true;}
// Call pre-255 birth enrichment; its surname overwrite is superseded by parental components.
childBirthIdentity166=function(child,parents){socialBase255.birth(child,parents);const choices=childChoices256(child,parents),choice=choices[0];setPersonName256(child,child.givenName166,choice.parts,choice.joiner);child.birthSurname256=child.surname;child.nameParents256=parents.map(p=>p===s?'player':p.id);if(parents.includes(s))child.namePending256=true;};
function childParents256(p){return (p.nameParents256||['player',p.parentId].filter(Boolean)).map(id=>id==='player'?s:s.people.find(x=>x.id===id)).filter(Boolean);}
function canNameChild256(p){return !!p&&p.alive&&!s.dead&&p.role==='Ребенок'&&p.age<18;}
function saveChildName256(id,given,index){const p=living(id);if(!canNameChild256(p))return false;given=String(given||'').trim().replace(/\s+/g,' ');if(!given||given.length>40||!/^\p{L}[\p{L}\p{M} '\-’]*$/u.test(given)){toast('Введите имя: до 40 букв, пробелов, апострофов или дефисов.');return false;}const parents=childParents256(p),choices=childChoices256(p,parents);const option=index<0?{parts:parentParts256(p),joiner:p.surnameJoiner256||' '}:choices[index];if(!option)return false;setPersonName256(p,given,option.parts,option.joiner);p.namePending256=false;p.nameChosen256=true;p.birthSurname256=p.surname;if(!p.adopted49&&parents.length===2){s.familyNames256??={};s.familyNames256[parentKey256(parents)]={parts:[...option.parts],joiner:option.joiner};}save();closeModal();log('Имя ребёнка',p.name,'Семья');render();return true;}
function childNameMenu256(id){const p=living(id);if(!canNameChild256(p))return;identity256(p);const choices=childChoices256(p,childParents256(p));show('Имя ребёнка',namingNote256(p.birthCountry||p.country),[]);$('#modal').innerHTML+=`<label>Имя<input id="child-given256" maxlength="40" value="${esc(p.givenName166)}"></label><label>Фамилия<select id="child-family256"><option value="-1">Оставить: ${esc(p.surname)}</option>${choices.map((q,i)=>`<option value="${i}">${esc(q.label+' · '+q.parts.join(q.joiner))}</option>`).join('')}</select></label><div class="options"><button onclick="saveChildName256('${esc(id)}',document.querySelector('#child-given256').value,Number(document.querySelector('#child-family256').value))">Сохранить имя</button><button onclick="saveChildName256('${esc(id)}',living('${esc(id)}').givenName166,-1)">Оставить ${esc(p.name)}</button></div>`;}
const namesBase256={ensure:ensureUX,month:autonomousMonth,detail:personDetail,items:decisionItems24,record:decisionRecord24,active:decisionActive24,open:openDecision24};
ensureUX=function(){const r=namesBase256.ensure();if(s){identity256(s);for(const p of s.people)identity256(p);}return r;};
autonomousMonth=function(){const before=new Set(s.people.map(p=>p.id));const r=namesBase256.month();for(const p of s.people.filter(p=>!before.has(p.id)&&p.role==='Ребенок'&&p.alive&&p.age<18)){identity256(p);p.namePending256=true;s.clock.running=false;}return r;};
personDetail=function(id){namesBase256.detail(id);const p=living(id);if(canNameChild256(p))$('#modal').innerHTML+=`<button onclick="childNameMenu256('${esc(id)}')">Имя и фамилия ребёнка</button>`;};
decisionRecord24=function(ref){return ref?.kind==='childName256'?s.people.find(p=>p.id===ref.id):namesBase256.record(ref);};
decisionActive24=function(ref){return ref?.kind==='childName256'?canNameChild256(living(ref.id))&&!!living(ref.id).namePending256:namesBase256.active(ref);};
decisionItems24=function(){return [...namesBase256.items(),...s.people.filter(p=>canNameChild256(p)&&p.namePending256).map(p=>({ref:{kind:'childName256',id:p.id},q:p,title:'Выбрать имя ребёнку',note:p.name}))];};
openDecision24=function(kind,id){if(kind==='childName256')return childNameMenu256(id);return namesBase256.open(kind,id);};
function marriageNameOptions256(p,finish){identity256(s);identity256(p);const own=s.surname,other=genderSurname256(p.surname,s.gender,p.birthCountry||p.country);const oldParts=[...s.surnameParts256];const apply=(parts,joiner=' ')=>{if(s.dead||!p.alive||s.people.some(q=>q.married))return;if(s.country==='nl'&&!s.legalSurnameParts256){s.legalSurnameParts256=[...oldParts];s.legalSurname256=own;}s.preMarriageSurname256={surname:own,parts:oldParts,joiner:s.surnameJoiner256||' '};s.surnameParts256=parts;s.surnameJoiner256=joiner;finish(parts.join(joiner));};show('Фамилия после свадьбы',namingNote256(s.country),[{label:'Оставить свою · '+own,fn:()=>apply(oldParts,s.surnameJoiner256||' ')},{label:'Взять фамилию партнёра · '+other,fn:()=>apply(parentParts256(p).map(n=>genderSurname256(n,s.gender,p.birthCountry||p.country)),p.surnameJoiner256||' ')},...(inheritedPart256(s)!==inheritedPart256(p)?[{label:'Соединить фамилии',hint:[inheritedPart256(s),inheritedPart256(p)].join('-'),fn:()=>apply([inheritedPart256(s),genderSurname256(inheritedPart256(p),s.gender,p.birthCountry||p.country)],'-')}]:[])]);}
function divorceName256(p,finish){identity256(s);const prior=s.preMarriageSurname256;const options=[{label:'Сохранить нынешнюю · '+s.surname,fn:()=>finish()}];if(prior&&prior.surname!==s.surname)options.push({label:'Вернуть добрачную · '+prior.surname,fn:()=>{s.surname=prior.surname;s.surnameParts256=[...prior.parts];s.surnameJoiner256=prior.joiner;finish();}});show('Фамилия после развода',prior?'Выбор касается только вашей фамилии. Имена детей сохранятся.':'Добрачная фамилия в этом старом сохранении не записана. Нынешнюю можно сохранить.',options);}
const localityBase256=locality95;
locality95=function(country,city){const base=localityBase256(country,city);const roots=extraNames256[country]?.org;if(!roots)return base;const hash=Array.from(city||'').reduce((n,c)=>n+c.charCodeAt(0),0);const names=roots.map((_,i)=>roots[(i+hash)%roots.length]);return {...(base||{}),name:base?.name||city,employers:{engineering:'Мастерские «'+names[0]+'»',design:'Студия «'+names[1]+'»',retail:'Магазины «'+names[2]+'»'}};};
