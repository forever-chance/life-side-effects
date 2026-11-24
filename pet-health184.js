'use strict';

function litterTraits184(id,mother,father,kind,breed){
 const parents=[mother,father].map(key=>s.pets.find(p=>p.id===key));
 const roll=key=>visualHash49(id+':'+key);
 const artParent=parents[Math.floor(roll('coat')*2)];
 const art38=artParent?.breed38===breed&&roll('resemblance')<.45?artParent.art38:petArtFor38(kind,breed,id);
 const risks=parents.map(p=>p?.health184?.sensitivity??.2);
 return {art38,health184:{sensitivity:Math.min(.75,(risks[0]+risks[1])*.4+roll('health')*.25)}};
}

function petCheckup184(id){
 const p=ownedPet79(id);
 if(!p||s.age<18||s.dead||p.health184?.checked===s.clock.ticks)return false;
 const fee=petMonthly98(p.kind)*.65;
 if(!spend231(fee,'Профилактический осмотр · '+p.name,'vet184:'+id+':'+s.clock.ticks))return false;
 const health=p.health184??={sensitivity:.2};
 health.checked=s.clock.ticks;
 if(p.care39)p.care39.condition=Math.min(100,p.care39.condition+3*(1-health.sensitivity));
 p.notes.push('Профилактический осмотр · '+s.year+'.');
 save();
 petDetails(id);
 return true;
}
