'use strict';
const immersionBase53={autonomousMonth,start,languagesView16};
function immersionTarget53(m){return m<=24?m/24:m<=60?1+(m-24)/36:m<=96?2+(m-60)/36:3;}
function immersion53(){if(s.immersion53)return s.immersion53;const x=path16(),now=s.clock.ticks,z=s.immersion53={version:1,last:now,months:{}};const history=(x.residenceHistory||[]).filter(h=>countries[h.country]&&Number.isFinite(h.from)&&h.from>=0&&h.from<=now).slice().sort((a,b)=>a.from-b.from);history.forEach((h,i)=>{const end=history[i+1]?.from??(h.country===s.country?now:h.from),lang=country16[h.country][0];z.months[lang]=(z.months[lang]||0)+Math.max(0,end-h.from);});for(const [lang,m]of Object.entries(z.months))x.languages[lang]=Math.max(x.languages[lang]||0,immersionTarget53(m));return z;}
function immersionGain53(lang,months){if(!lang||months<=0)return;const z=immersion53(),x=path16(),old=z.months[lang]||0,before=x.languages[lang]||0;z.months[lang]=old+months;const target=immersionTarget53(old+months),gain=target-immersionTarget53(old);if(before<3)x.languages[lang]=Math.min(3,Math.max(target,Math.round((before+gain)*1e9)/1e9));if(Math.floor(x.languages[lang]||0)>Math.floor(before))log('Язык стал привычнее',lang16[lang]+' · '+cefr16[level16(lang)]+'. Помогает повседневная практика.','Адаптация');}
function immersionMonth53(){const z=immersion53();if(s.dead||z.last>=s.clock.ticks)return;const elapsed=s.clock.ticks-z.last;z.last=s.clock.ticks;const stay=typeof languageStayActive53==='function'?languageStayActive53():null;if(stay?.status==='away'){immersionGain53(country16[stay.country][0],elapsed);return;}let amount=elapsed;for(const t of travel52().trips)if(t.country!==s.country&&t.departed===s.clock.ticks&&['away','completed'].includes(t.status))amount-=t.days/30;immersionGain53(country16[s.country][0],Math.max(0,amount));}
autonomousMonth=function(){immersion53();immersionBase53.autonomousMonth();immersionMonth53();};
start=function(){immersionBase53.start();immersion53();save();};
languagesView16=function(){
 const months=Object.entries(immersion53().months).map(([l,m])=>esc(lang16[l])+': '+Math.floor(m)+' мес.').join('; ');
 return immersionBase53.languagesView16()+'<div class="language-actions186"><button onclick="languageClubsMenu53()">Читательские и разговорные клубы</button><button onclick="languageStayMenu53()">Языковые курсы за границей</button></div>'+
  '<details class="language-help186"><summary>Как растёт знание языков</summary><p>Жизнь в языковой среде без занятий даёт A1 примерно за два года, A2 за пять лет и B1 за восемь лет. Пассивный рост ограничен B1.</p>'+
  '<p>Курс даёт +0,55 уровня, практика +0,3. Для поступления и работы учитывается достигнутый полный уровень.</p>'+
  (months?'<p>Языковая среда: '+months+'.</p>':'')+'</details>';
};
if(s)immersion53();
