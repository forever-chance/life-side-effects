'use strict';
const momentBase59={autonomousMonth,finishTask,startTask05,eventButtons23,actionCatalog24,activitiesView};
// Small moments have their own history/cooldowns and never replace people or life decisions.
const childMoments59=[
 ['tower','Башня выше колена','Кубики закончились раньше архитектурных амбиций. Башня простояла почти минуту.',1,3],
 ['spoon','Ложка по назначению','Большая часть каши добралась до рта. У стола и одежды тоже был завтрак.',1,2],
 ['puddle','Исследование лужи','Глубина измерена обеими ногами. Результаты исследования придётся сушить.',1,5],
 ['sandcastle','Песочный замок','У замка есть ров, башни и вход для очень маленького дракона. Разрушение отложено до следующего визита в песочницу.',2,6],
 ['shop','Магазин камней','Открылся магазин особенно красивых камней. Деньги тоже камни. Экономика пока работает.',3,7],
 ['map','Карта сокровищ','Крестиком отмечено место под диваном. Найдены карандаш, крышка и неучтённая макаронина.',3,8],
 ['snail','Улитка получила имя','Теперь у улитки есть имя и дом из листьев. Она продолжает жить по своему расписанию.',3,8],
 ['cardboard','Квартира в коробке','В большой коробке теперь два окна, дверь и запрет для взрослых. Жилищный вопрос временно решён.',3,9],
 ['drawing','Семейный портрет','У всех длинные руки, у одного человека шесть пальцев. Зато кот крупнее остальных, и с этим трудно спорить.',3,7],
 ['shadow','Театр за диваном','Спектакль с фонариком прошёл при полном аншлаге из игрушек. Билетёр одновременно играл волка.',4,10],
 ['letters','Записка без диктовки','Первая самостоятельная записка прикреплена к холодильнику. Одно слово пока поддаётся нескольким прочтениям.',5,8],
 ['bridge','Мост для игрушек','Мост выдержал машинку и двух динозавров. Условия испытаний признаны достаточными.',5,10],
 ['library','Личная библиотека','Книги расставлены по системе, известной одному человеку. Система выглядит надёжной.',6,12],
 ['comic','Первый выпуск комикса','Главный герой спас мир на четырёх страницах. На пятой автору захотелось перекусить.',7,14],
 ['pancake','Блин почти круглый','Первый блин получился похожим на карту неизвестного острова. Второй уже можно показывать людям.',8,15],
 ['constellation','Собственное созвездие','Из нескольких звёзд получилось созвездие Чайника. Астрономический союз пока не уведомлён.',8,16],
 ['playlist','Плейлист на весь вечер','Песни собраны в строго определённом порядке. Перемешивание считается вмешательством в авторский замысел.',12,17],
 ['jacket','Куртка с новым характером','На старой куртке появились нашивка и неровная строчка. Теперь её хотя бы ни с кем не перепутаете.',12,17],
 ['film','Короткометражка во дворе','Фильм снят на телефон. В титрах почти все заняты сразу на трёх должностях.',13,17],
 ['recipe','Ужин по собственному рецепту','Сочетание продуктов сначала вызывало вопросы. В итоге попросили добавку.',14,17]
];
const everydayNews59=[
 ['monstera','plants','Монстера — два метра','В сообщении фотография монстеры ростом два метра. Теперь мебель стоит с учётом её личного пространства.'],
 ['leaf','plants','Новый лист','Редкое домашнее событие: новый лист раскрылся именно тогда, когда на него перестали смотреть каждые полчаса.'],
 ['basil','plants','Урожай с подоконника','Первый базилик с подоконника попал в ужин. По количеству внимания он обошёл основные ингредиенты.'],
 ['orchid','plants','Орхидея передумала','Орхидея, которую давно считали исключительно декоративными листьями, снова зацвела. Есть фотографические доказательства.'],
 ['cutting','plants','Черенок прижился','У черенка наконец появились корни. Теперь обсуждается, кто заберёт ещё пять таких же.'],
 ['bread','cooking','Хлеб с правильной коркой','После нескольких плоских опытов получилась высокая буханка. Фотографий разреза больше, чем самого хлеба.'],
 ['dumplings','cooking','Пельменная операция','За вечер налеплено достаточно пельменей, чтобы ближайшие выходные больше ничего не решать.'],
 ['cake','cooking','Торт пережил дорогу','Домашний торт доехал целым. Дорога была самым сложным пунктом рецепта.'],
 ['jam','cooking','Банки с вареньем','На кухне стоят банки с вареньем и подписи от руки. Одну уже открыли проверить, получилось ли.'],
 ['coffee','cooking','Идеальная чашка','После долгих опытов найдены подходящие помол и пропорции. Следующая чашка вышла другой, но первая зафиксирована.'],
 ['shelf','making','Полка держится','Полка висит ровно и выдерживает книги. В разговоре слово «самостоятельно» встречается несколько раз.'],
 ['chair','making','Стул получил второй шанс','Старый стул заново отшлифован и покрашен. Теперь никто не хочет отдавать его обратно на балкон.'],
 ['sweater','making','Свитер закончен','У свитера есть оба рукава. Один чуть длиннее, но это пока самая убедительная работа.'],
 ['ceramics','making','Кружка вышла из печи','Кружка получилась немного кривая и вполне пригодная для чая. Её фотографируют с лучшей стороны.'],
 ['repair','making','Лампа снова работает','Лампа пережила ремонт и снова включается. Винтик, оставшийся на столе, объявлен запасным.'],
 ['book','books','Та самая толстая книга','Книга, которую носили с собой несколько месяцев, наконец дочитана. Теперь есть мнение о финале.'],
 ['club','books','Книжный спор','В читательском клубе два часа спорили о герое. Оказалось, половина участников представляла его совершенно иначе.'],
 ['poem','books','Стихотворение наизусть','Давно забытое стихотворение неожиданно вспомнилось целиком. В сообщении только первая строчка: остальное предлагается угадать.'],
 ['cinema','art','В кино почти в одиночестве','На дневном сеансе оказалось три зрителя. После фильма все трое молча кивнули друг другу, будто закрыли смену.'],
 ['photo','art','Снимок наконец получился','Из десятков фотографий нашлась одна, ради которой стоило выйти из дома. Остальные решено не показывать.'],
 ['music','art','Без остановки на середине','Сложная мелодия впервые сыграна целиком. Соседи могут подтвердить, сколько понадобилось репетиций.'],
 ['sketch','art','Портрет на салфетке','В кафе появился удачный набросок. Салфетку пришлось аккуратно не использовать по назначению.'],
 ['walk','outdoors','Новый маршрут','Знакомая прогулка свернула в незнакомый двор. Там нашлись тихая скамейка и повод задержаться.'],
 ['bird','outdoors','Птица определена','Птица за окном наконец опознана. Теперь её невозможно снова считать просто «вон той серой».'],
 ['mushroom','outdoors','Грибной отчёт','С прогулки прислана фотография особенно красивого гриба. Гриб оставлен там, где рос.'],
 ['puzzle','home','Пазл сошёлся','Последняя деталь пазла нашлась под краем ковра. Обвинения в адрес производителя отозваны.'],
 ['socks','home','Носки снова пара','После большой уборки нашлись два носка, давно живших раздельно. Семейное воссоединение состоялось.'],
 ['keys','home','Ключи нашли своё место','Для ключей наконец выделен крючок у двери. Несколько дней система даже работает.'],
 ['rain','home','Дождь вовремя','Дождь начался ровно после возвращения домой. В сообщении — чашка чая и очень мокрое окно.'],
 ['game','home','Настольная победа','Партия в настолку закончилась неожиданной победой. Правила пересчитали дважды и признали результат.']
];
function moments59(){return s.moments59??={version:1,last:-1,lastEvent:-3,lastAction:-3,used:{},actors:{},history:[]};}
function momentActor59(id){return id==='player'?s:s.people.find(p=>p.id===id&&p.alive);}
function momentTopic59(p){if(p.momentTopic59)return p.momentTopic59;const interest=p.agency55?.interests?.[0],topics={cooking:'cooking',photo:'art',music:'art',reading:'books',writing:'books',sport:'outdoors',hiking:'outdoors',craft:'making'};return p.momentTopic59=topics[interest]||['plants','cooking','making','books','art','outdoors','home'][Math.floor(visualHash49(p.id+':small-news')*7)];}
function momentClose59(p){return p.alive&&p.age>=18&&(p.bond||0)>=45&&['Друг','Партнер','Супруг','Супруга','Мать','Отец','Брат','Сестра','Сын','Дочь'].includes(p.role);}
function momentChild59(p){return p.alive&&p.age>=1&&p.age<18&&(p.country===s.country)&&(!p.city18||p.city18===residenceCity())&&!!kin27(p);}
function momentAvailable59(card,actor){const z=moments59(),key=actor+':'+card[0];return (!Object.hasOwn(z.used,key)||card[0].startsWith('action:')&&s.clock.ticks-z.used[key]>=24)&&s.clock.ticks-(z.actors[actor]??-100)>=6;}
function smallMoment59(actor,card,kind,manual=false){const p=momentActor59(actor);if(!p||s.dead||(!manual&&!momentAvailable59(card,actor)))return null;const z=moments59(),title=kind==='child'?card[1]:card[2],text=kind==='child'?card[2]:card[3],q={id:id16('moment59'),actor,kind,card:card[0],title:(actor==='player'?'':p.name+' · ')+title,text,status:kind==='news'?'shared':'recorded',tick:s.clock.ticks};z.used[actor+':'+card[0]]=s.clock.ticks;z.actors[actor]=s.clock.ticks;z.lastEvent=s.clock.ticks;z.history.push(q);z.history=z.history.slice(-80);if(actor!=='player'){p.memories??=[];remember(p,title);if(p.agency55){p.agency55.history.push({tick:s.clock.ticks,text:title+'. '+text});p.agency55.history=p.agency55.history.slice(-40);}}log(q.title,text,kind==='news'?'Новости близких':'Маленькое событие',false);s.log[0].moment59=q.id;return q;}
function momentCandidates59(){const z=moments59(),rows=[];const children=[...(s.age>=1&&s.age<18&&!s.clock.tasks.some(t=>t.kind==='little59'&&!['completed','cancelled'].includes(t.state))?[s]:[]),...s.people.filter(momentChild59)];for(const p of children){const actor=p===s?'player':p.id;for(const card of childMoments59)if(p.age>=card[3]&&p.age<=card[4]&&momentAvailable59(card,actor))rows.push({actor,card,kind:'child'});}for(const p of s.people.filter(momentClose59)){const topic=momentTopic59(p);for(const card of everydayNews59)if((card[1]===topic||card[1]==='home')&&momentAvailable59(card,p.id))rows.push({actor:p.id,card,kind:'news'});}return rows;}
function momentsMonth59(){if(s.dead)return;const z=moments59();if(z.last>=s.clock.ticks)return;z.last=s.clock.ticks;if(s.clock.ticks-z.lastEvent<3||!chance(.65))return;const pool=momentCandidates59();if(!pool.length)return;const actors=[...new Set(pool.map(q=>q.actor))],actor=pick(actors),q=pick(pool.filter(q=>q.actor===actor));smallMoment59(q.actor,q.card,q.kind);}
autonomousMonth=function(){momentBase59.autonomousMonth();momentsMonth59();};
const littleActions59=[
 {id:'castle',title:'Построить песочный замок',min:2,max:8,hours:1,card:'sandcastle'},
 {id:'comic',title:'Нарисовать короткий комикс',min:7,max:17,hours:2,card:'comic'},
 {id:'playlist',title:'Собрать плейлист',min:12,max:120,hours:1,text:'Песни выстроились в нужном порядке. Получился саундтрек к вечеру, который ещё не случился.'},
 {id:'sketch',title:'Нарисовать что-нибудь без особой цели',min:4,max:120,hours:1,text:'На бумаге остался набросок. Не шедевр, зато теперь это вполне конкретная чашка, а не просто идея порисовать.'},
 {id:'recipe',title:'Попробовать новый рецепт',min:12,max:120,hours:2,text:'Рецепт немного изменился по дороге. Ужин всё равно состоялся, и один приём хочется повторить.'},
 {id:'photo',title:'Пойти на фотопрогулку',min:12,max:120,hours:2,text:'Удалось заметить окно, тень и вывеску, мимо которых обычно проходите. Из всей серии осталось три хороших кадра.'},
 {id:'puzzle',title:'Собрать небольшой пазл',min:6,max:120,hours:2,text:'Кусочки постепенно превратились в картинку. Последняя деталь лежала совсем не там, где её искали.'},
 {id:'read',title:'Устроить тихий вечер с книгой',min:7,max:120,hours:1,text:'Несколько глав без спешки и проверки времени. На полях осталась одна пометка, к которой хочется вернуться.'}
];
function littleActionWhy59(a){if(!a||s.dead)return 'Недоступно';if(s.age<a.min||s.age>a.max)return 'Не подходит по возрасту';if(s.illness||incidents56().injury)return 'Сначала восстановиться';const used=moments59().used['player:'+(a.card||'action:'+a.id)];if(used!==undefined&&(a.card||s.clock.ticks-used<24))return 'Попробуйте другую затею; этот эпизод уже был недавно';if(s.clock.tasks.some(t=>t.kind==='little59'&&!['completed','cancelled'].includes(t.state)))return 'Уже есть небольшая затея в расписании';if(s.clock.ticks-moments59().lastAction<3)return 'Новая затея — через '+(3-s.clock.ticks+moments59().lastAction)+' мес.';if(capacity()-totalHours()<a.hours)return 'Не хватает свободного времени';return '';}
function startLittle59(id){const a=littleActions59.find(a=>a.id===id);if(littleActionWhy59(a))return false;moments59().lastAction=s.clock.ticks;task16('little59',a.title,1,{little59:id,age59:s.age},a.hours);save();return true;}
startTask05=function(t){if(t.kind==='little59'){const a=littleActions59.find(a=>a.id===t.little59);if(!a||s.dead||s.age<a.min||s.age>a.max||s.illness||incidents56().injury)return false;}return momentBase59.startTask05(t);};
finishTask=function(t){if(t.kind!=='little59')return momentBase59.finishTask(t);if(['completed','cancelled','paused'].includes(t.state)||t.progress<t.duration||!startTask05(t))return;const a=littleActions59.find(a=>a.id===t.little59),card=a.card?childMoments59.find(c=>c[0]===a.card):['action:'+a.id,a.title,a.text];if(smallMoment59('player',card,'child',true))s.mood=clamp(s.mood+2);archiveTask05(t,'completed');save();};
function reactNews59(id,choice){const q=moments59().history.find(q=>q.id===id),p=q&&momentActor59(q.actor);if(!q||q.status!=='shared'||!p||s.dead||!['glad','ask','later'].includes(choice))return false;q.status='answered';q.reply=choice;q.answered=s.clock.ticks;if(choice!=='later'){p.bond=clamp(p.bond+1);remember(p,choice==='ask'?'поговорили подробнее: '+q.title:'вы порадовались новости: '+q.title);}save();render();return true;}
function smallNewsMenu59(id){const q=moments59().history.find(q=>q.id===id);if(!q)return;show(q.title,q.text,q.status==='shared'?[{label:'Порадоваться вместе',fn:()=>reactNews59(id,'glad')},{label:'Расспросить подробнее',fn:()=>reactNews59(id,'ask')},{label:'Прочитать и вернуться к своим делам',fn:()=>reactNews59(id,'later')}]:[]);}
eventButtons23=function(e){const q=e.moment59&&moments59().history.find(q=>q.id===e.moment59);return q?.status==='shared'&&momentActor59(q.actor)&&!s.dead?button16('Ответить на новость',"smallNewsMenu59('"+q.id+"')"):momentBase59.eventButtons23(e);};
function littleThingsMenu59(){show('Маленькие затеи и новости','Небольшие дела занимают немного времени. Новости близких можно просто читать; отвечать на каждую не обязательно.',littleActions59.filter(a=>s.age>=a.min&&s.age<=a.max).map(a=>({label:a.title,hint:littleActionWhy59(a)||'1 мес. · '+a.hours+' ч/нед.',disabled:!!littleActionWhy59(a),fn:()=>startLittle59(a.id)})));$('#modal').innerHTML+='<h3>Последние маленькие события</h3>'+moments59().history.slice(-8).reverse().map(q=>'<p><strong>'+esc(q.title)+'</strong><br>'+esc(q.text)+'</p>'+(q.status==='shared'?button16('Ответить',"smallNewsMenu59('"+q.id+"')"):'')).join('');}
actionCatalog24=function(){return [...momentBase59.actionCatalog24(),{id:'little59',group:'Занятия',label:'Маленькие затеи и новости',keywords:'песочный замок комикс плейлист друзья монстера повседневность',reason:s.age<2?'Пока доступны маленькие события без планирования':'',fn:littleThingsMenu59}];};
activitiesView=function(){return momentBase59.activitiesView().replace('onclick="clubsMenu19()"','onclick="littleThingsMenu59()">Маленькие затеи и новости</button><button onclick="clubsMenu19()"');};
