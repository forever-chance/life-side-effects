'use strict';

function schoolExperience196(){
 const history=mentoring194().courses195?.history||[];
 const tracks=new Set(history.map(course=>course.track));
 return [...tracks].filter(track=>history.filter(course=>course.track===track&&course.graduated>0).length>=2);
}

function teachingGuide251(){
 return 'Чтобы взять ученика, соберите 3 работы в одном творческом направлении. Среднее качество трёх лучших — от 60, профильный навык — от 55. Успешное наставничество даёт +3 к мастерству, проведённый успешно мастер-класс +4, завершённый курс +2 или +5.';
}

function schoolBlock196(track=null){
 if(mentoring194().pedagogy<20)return 'Педагогическое мастерство: '+mentoring194().pedagogy+'/20. Растёт за наставничество, мастер-классы и курсы.';
 const tracks=schoolExperience196();
 return (track?!tracks.includes(track):!tracks.length)?'Нужно выпустить две группы по одному направлению.':'';
}

function schoolOpening196(){
 const why=enterpriseBlock152()||schoolBlock196();
 if(why)return toast(why);
 show('Собственная школа','Выбери направление, по которому уже выпустил две группы.',
  schoolExperience196().map(track=>({label:trackNames46[track],fn:()=>schoolName196(track)})));
}

function schoolName196(track){
 const {fee,reserve}=enterpriseQuote152('services','school196');
 const title='Школа · '+trackNames46[track];
 show(title,'Запуск '+money(fee)+' · резерв '+money(reserve)+'. Аренда, персонал и выручка идут через бюджет предприятия.',[
  {label:'Открыть школу',disabled:s.cash<fee+reserve,fn:()=>{
   if(startEnterprise152('services',$('#schoolTitle196').value,'school196',true,track))enterpriseMenu152();
   else toast('Проверь условия открытия, название и бюджет.');
  }},
  {label:'Назад',fn:schoolOpening196}
 ]);
 petInsert38('<label class="field">Название<input id="schoolTitle196" maxlength="60" value="'+esc(title)+'"></label>');
}

function schoolDemand196(business){
 if(!business.school196)return .65+s.skill/200;
 const practice=profileScore46(business.school196.track);
 return .65+(practice*.7+mentoring194().pedagogy*.3)/200;
}
