'use strict';
const dismissBase59={decisionItems24,groupedActions};
function notices59(){return s.notices59??={snoozed:{},dismissed:[]};}
function dismissKind59(ref){const q=decisionRecord24(ref);if(!q||!decisionActive24(ref))return null;if(ref.kind==='child55'&&['illness','comingout','introduce','caught'].includes(q.kind)||ref.kind==='pending'||ref.kind==='estate58')return null;return ['study','job','social49','circle48','tripInvite53','occasion54','business54','community54','vehicle56','career','family','sponsor'].includes(ref.kind)?'decline':'snooze';}
function quickDismiss59(kind,id){const ref={kind,id},q=decisionRecord24(ref),mode=dismissKind59(ref);if(!mode)return false;
 if(mode==='snooze'){notices59().snoozed[kind+':'+id]=s.clock.ticks+1;}
 else if(['study','job'].includes(kind))declineDecision24(kind,id);
 else if(kind==='social49')socialRespond49(id,false);
 else if(kind==='circle48')circleRespond48(id,'decline');
 else if(kind==='tripInvite53')respondTravel53(id,false);
 else if(kind==='occasion54')respondOccasion54(id,false);
 else if(kind==='business54')respondBusiness54(id,false);
 else if(kind==='community54')respondPride54(id,false);
 else if(kind==='vehicle56')respondVehicleGift56(id,false);
 else {q.status='declined';q.decidedAt24=s.clock.ticks;}
 notices59().dismissed.push({kind,id,tick:s.clock.ticks,mode});notices59().dismissed=notices59().dismissed.slice(-80);save();render();return true;}
decisionItems24=function(){return dismissBase59.decisionItems24().filter(i=>(notices59().snoozed[i.ref.kind+':'+i.ref.id]??-1)<=s.clock.ticks);};
function quickCard59(i){const kind=i.ref.kind,id=i.ref.id,mode=dismissKind59(i.ref),label=mode==='decline'?'Отказаться':'Напомнить в следующем месяце';return '<div class="attention-row59"><button class="small" onclick="openDecision24(\''+esc(kind)+'\',\''+esc(id)+'\')">'+esc(i.title)+'<small>'+esc(i.note)+'</small></button>'+(mode?'<button class="quick-close59" aria-label="'+label+': '+esc(i.title)+'" title="'+label+'" onclick="quickDismiss59(\''+esc(kind)+'\',\''+esc(id)+'\')">×</button>':'')+'</div>';}
groupedActions=function(){const items=decisionItems24(),h=items.filter(i=>i.ref.kind==='health58'),a=items.filter(i=>i.ref.kind!=='health58'),html=dismissBase59.groupedActions(),start=html.indexOf('<button class="small"'),tail=html.indexOf('</section>');if(start<0)return html;const shown=h.slice(0,3).concat(a.slice(0,3));return html.slice(0,start)+shown.map(quickCard59).join('')+(items.length>shown.length?'<p class="sub">Остальные — в общем списке.</p>':'')+html.slice(tail);};
