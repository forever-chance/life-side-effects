'use strict';

// Coordinates follow the city names in the existing game catalog.
const atlasCityPoints89 = {
  nl: [[5.12,52.09],[4.90,52.37],[4.48,51.92],[6.57,53.22]],
  rs: [[19.83,45.27],[20.46,44.82],[21.90,43.32],[19.67,46.10]],
  ru: [[60.60,56.84],[37.62,55.75],[49.12,55.79],[30.31,59.94]],
  us: [[-80,40.44],[-87.63,41.88],[-71.06,42.36],[-97.74,30.27]],
  br: [[-49.27,-25.43],[-46.63,-23.55],[-43.17,-22.91],[-48.55,-27.60]],
  jp: [[135.50,34.69],[139.69,35.68],[135.77,35.01],[130.40,33.59]],
  fr: [[4.83,45.76],[2.35,48.86],[1.44,43.60],[-1.55,47.22]],
  es: [[-.38,39.47],[-3.70,40.42],[2.17,41.39],[-5.99,37.39]],
  de: [[12.37,51.34],[13.41,52.52],[9.99,53.55],[11.58,48.14]],
  uk: [[-2.24,53.48],[-.13,51.51],[-2.59,51.45],[-3.19,55.95]],
  ca: [[-75.70,45.42],[-79.38,43.65],[-73.57,45.50],[-123.12,49.28]],
  kr: [[129.08,35.18],[126.98,37.57],[127.38,36.35],[126.71,37.46]],
  cn: [[104.07,30.57],[121.47,31.23],[116.40,39.90],[113.26,23.13]],
  mx: [[-98.20,19.04],[-99.13,19.43],[-103.35,20.67],[-100.31,25.67]]
};
// Approximate city centres in longitude, latitude, continuing the catalogue order.
const additionalCityPoints173 = {
 nl:[[4.30,52.08],[5.48,51.44],[5.69,50.85]],
 rs:[[20.92,44.01],[20.35,43.89],[20.51,43.14]],
 ru:[[82.92,55.03],[33.08,68.97],[39.72,43.59]],
 us:[[-74.01,40.71],[-118.24,34.05],[-90.07,29.95],[-122.42,37.77],[-80.19,25.76]],
 br:[[-47.88,-15.79],[-38.50,-12.97],[-34.88,-8.05],[-43.94,-19.92],[-51.23,-30.03]],
 jp:[[139.64,35.44],[136.91,35.18],[141.35,43.06]],
 fr:[[5.37,43.30],[-.58,44.84],[3.06,50.63],[7.75,48.58]],
 es:[[-4.42,36.72],[-2.93,43.26],[-8.54,42.88]],
 de:[[8.68,50.11],[6.96,50.94],[13.74,51.05]],
 uk:[[-1.90,52.48],[-4.25,55.86],[-5.93,54.60]],
 ca:[[-114.07,51.05],[-71.21,46.81],[-63.58,44.65]],
 kr:[[128.60,35.87],[126.85,35.16],[126.53,33.50]],
 cn:[[114.06,22.54],[120.16,30.27],[108.94,34.34]],
 mx:[[-89.62,20.97],[-96.73,17.07],[-86.85,21.16]],
 it:[[12.50,41.90],[9.19,45.46],[14.27,40.85],[11.25,43.77],[11.34,44.49],[7.69,45.07],[13.36,38.12]],
 au:[[151.21,-33.87],[144.96,-37.81],[153.03,-27.47],[115.86,-31.95],[138.60,-34.93],[149.13,-35.28],[147.33,-42.88]],
 tr:[[28.98,41.01],[32.86,39.93],[27.14,38.42],[30.71,36.89],[29.06,40.19],[37.38,37.07],[39.72,41.00]],
 za:[[18.42,-33.93],[28.05,-26.20],[28.19,-25.75],[31.02,-29.86],[25.60,-33.96],[26.20,-29.12],[18.86,-33.94]],
 th:[[100.50,13.76],[98.98,18.79],[100.88,12.93],[98.39,7.88],[100.47,7.01],[102.83,16.44],[99.83,19.91]],
 no:[[10.75,59.91],[5.32,60.39],[10.40,63.43],[5.73,58.97],[18.96,69.65],[8.00,58.15],[6.15,62.47]],
 in:[[72.88,19.08],[77.21,28.61],[77.59,12.97],[78.49,17.39],[80.27,13.08],[88.36,22.57],[75.79,26.91]],
 id:[[106.85,-6.21],[112.75,-7.26],[107.61,-6.92],[110.37,-7.80],[115.22,-8.65],[98.67,3.59],[119.41,-5.15]],
 eg:[[31.24,30.04],[29.92,31.20],[31.21,30.01],[32.64,25.69],[32.90,24.09],[33.81,27.26],[34.33,27.92]],
 ma:[[-7.59,33.57],[-6.84,34.02],[-8.00,31.63],[-5.00,34.03],[-5.80,35.76],[-9.60,30.42],[-5.55,33.89]],
 pl:[[21.01,52.23],[19.94,50.06],[17.04,51.11],[18.65,54.35],[16.93,52.41],[19.46,51.76],[22.57,51.25]]
};
const cityCoordinates173 = Object.fromEntries(Object.entries(cities).map(([country,names])=>{
 const points=[...(atlasCityPoints89[country]||[]),...(additionalCityPoints173[country]||[])];
 return [country,Object.fromEntries(names.flatMap((name,index)=>points[index]?[[name,points[index]]]:[]))];
}));
const atlasCities89 = Object.fromEntries(Object.entries(cityCoordinates173).map(([country, points]) =>
  [country, Object.fromEntries(Object.entries(points).map(([name,point]) => [name, [(point[0]+180)*2, (84-point[1])*2]]))]));

function atlasObserveHome89() {
  if (!s?.clock || !s.housing || s.country !== s.housing.country || !s.housing.city) return;
  const homes = s.atlasHomes89 ??= [];
  const last = homes.at(-1);
  const {country, city} = s.housing;
  if (last?.country === country && last.city === city) return;
  homes.push({country, city, from: s.clock.ticks, observed: !last});
}
const atlasBaseSave89 = save;
save = function (...args) {
  atlasObserveHome89();
  return atlasBaseSave89(...args);
};

function atlasData89() {
  const birth = s.dossier87?.birth || createDossier87(false).birth;
  const current = {country: s.country, city: residenceCity()};
  const entries = [...(s.path16?.residenceHistory || []).filter(h => h.source !== 'Старое сохранение'),
    ...(s.atlasHomes89 || [])]
    .filter(h => countries[h.country] && Number.isFinite(h.from) && h.from <= s.clock.ticks)
    .sort((a,b) => a.from-b.from);
  const periods = [];
  for (const h of entries) {
    const last = periods.at(-1);
    const samePlace = last?.country === h.country && (!h.city || last.city === h.city);
    if (samePlace) continue;
    if (last?.country === h.country && !last.city && h.city && last.from === h.from) {
      last.city = h.city;
      continue;
    }
    const calendarStart = Math.floor((s.year*12+s.clock.month-s.clock.ticks)/12);
    const adultStart = h.source === 'Начало жизни' && h.from === 0 && birth.year < calendarStart;
    periods.push({...h, observed: h.observed || adultStart});
  }
  const latest = periods.at(-1);
  if (latest?.country !== current.country || latest.city !== current.city) {
    periods.push({...current, from:s.clock.ticks, observed:true});
  }
  periods.forEach((h,i) => { h.to = periods[i+1]?.from ?? null; });
  const trips = (s.travel52?.trips || []).filter(t =>
    travelCountry103(t.country) && !t.stayHome86 && (t.status === 'completed' ||
      (['away','interrupted'].includes(t.status) && Number.isFinite(t.departed))));
  return {birth, current, periods, trips};
}

const atlasLabels89 = {
  birth: 'Рождение', lived: 'Проживание', visited: 'Поездка', current: 'Текущий дом'
};
function atlasKinds89(data, country, city = null) {
  const matches = q => q.country === country && (city === null || q.city === city);
  return [
    ...(matches(data.birth) ? ['birth'] : []),
    ...(data.periods.some(matches) ? ['lived'] : []),
    ...(data.trips.some(matches) ? ['visited'] : []),
    ...(matches(data.current) ? ['current'] : [])
  ];
}
function atlasBadge89(kind) {
  return '<span class="atlas-badge89"><i class="atlas-' + kind + '89"></i>' + atlasLabels89[kind] + '</span>';
}

let atlasCountry89 = null;
let atlasCity89 = null;
function atlasOpen89(country, city = null) {
  atlasCountry89 = country;
  atlasCity89 = city;
  if (s.ui05) s.ui05.panel = 'center';
  if (tab !== 'world') setTab('world');
  dossierSelect88('geography');
}
function atlasDate89(tick) {
  if (!Number.isFinite(tick)) return 'Дата неизвестна';
  const date = s.year * 12 + s.clock.month + tick - s.clock.ticks;
  return months[((date % 12) + 12) % 12] + ' ' + Math.floor(date/12);
}
function atlasSymbols89(kinds, x, y, size) {
  const symbols = kinds.length ? kinds : ['land'];
  return symbols.map((kind, i) => {
    const px = x + (i - (symbols.length-1)/2)*size*2.15;
    const cls = 'class="atlas-' + kind + '89"';
    if (kind === 'birth') return '<path '+cls+' d="M'+px+','+(y-size)+'l'+size+','+size+' '+(-size)+','+size+' '+(-size)+','+(-size)+'Z"/>';
    if (kind === 'lived') return '<rect '+cls+' x="'+(px-size)+'" y="'+(y-size)+'" width="'+(2*size)+'" height="'+(2*size)+'"/>';
    return '<circle '+cls+' cx="'+px+'" cy="'+y+'" r="'+size+'"/>';
  }).join('');
}

function atlasLocations103(country) {
  return atlasCities89[country] || (typeof tourAtlasPoints103==='object' ? tourAtlasPoints103[country] : null) || {};
}

function atlasMap89(data) {
  const country = atlasCountry89;
  const points = Object.values(atlasLocations103(country));
  let box = '0 0 720 290';
  if (points.length) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const w = Math.max(14, Math.max(...xs)-Math.min(...xs)+8);
    const h = Math.max(10, Math.max(...ys)-Math.min(...ys)+8);
    box = [Math.min(...xs)-4, Math.min(...ys)-4, w, h].join(' ');
  }
  const svg = Object.entries(atlasPaths89).map(([id, path]) => {
    const playable = !!travelCountry103(id);
    const kinds = playable ? atlasKinds89(data,id) : [];
    const style = kinds.at(-1) || 'land';
    const action = playable && !country
      ? ' role="button" tabindex="0" aria-label="' + esc(travelName103(id)) +
        '" onclick="atlasOpen89(\''+id+'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.dispatchEvent(new MouseEvent(\'click\'));}"'
      : '';
    return '<path class="atlas-' + style + '89" d="' + path + '"' + action + '>' +
      (playable ? '<title>' + esc(travelName103(id)) + '</title>' : '') + '</path>';
  }).join('');
  let markers = '';
  if (country && points.length) {
    const markerSize = Math.max(.4, Number(box.split(' ')[2])/65);
    markers = Object.entries(atlasLocations103(country)).map(([city,[x,y]],i) => {
      const kinds = atlasKinds89(data,country,city);
      return '<g role="button" tabindex="0" aria-label="'+esc(city)+'" onclick="atlasOpen89(\''+country+'\',Object.keys(atlasLocations103(\''+country+'\'))['+i+'])" '+
        'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.onclick();}"><title>'+esc(city)+'</title>'+
        atlasSymbols89(kinds,x,y,markerSize)+'</g>';
    }).join('');
  } else if (!country) {
    const places = [data.current,data.birth,...data.periods,...data.trips];
    markers = Object.entries({...atlasCities89,...(typeof tourAtlasPoints103==='object'?tourAtlasPoints103:{})}).map(([id, locations]) => {
      const kinds = atlasKinds89(data,id);
      if (!kinds.length) return '';
      const city = places.find(q => q.country === id && locations[q.city])?.city;
      const [x,y] = locations[city] || Object.values(locations)[0];
      return '<g aria-hidden="true" pointer-events="none">'+atlasSymbols89(kinds,x,y,2.4)+'</g>';
    }).join('');
  }
  return '<svg class="atlas-map89" viewBox="'+box+'" aria-label="'+esc(country ? travelName103(country) : 'Карта мира')+'">'+svg+markers+'</svg>';
}

function atlasCityDetails89(data, country, city, selected) {
  const matches = q => q.country === country && (q.city || null) === city;
  const periods = data.periods.filter(matches);
  const trips = data.trips.filter(matches);
  const kinds = city ? atlasKinds89(data,country,city) : [
    ...(matches(data.birth) ? ['birth'] : []), ...(periods.length ? ['lived'] : []),
    ...(trips.length ? ['visited'] : []), ...(matches(data.current) ? ['current'] : [])
  ];
  const title = city || 'Город не записан';
  const symbols = kinds.map(kind => '<span class="atlas-badge89" role="img" aria-label="' +
    atlasLabels89[kind] + '" title="' + atlasLabels89[kind] + '"><i class="atlas-' + kind + '89"></i></span>').join('');
  const birth = data.birth;
  const birthDate = Number.isFinite(birth.year) ? [months[birth.month],birth.year].filter(v => v != null).join(' ') : 'Дата неизвестна';
  const stays = periods.map(h => (h.observed ? 'Известно с ' : '') + atlasDate89(h.from) +
    ' — ' + (h.to == null ? 'сейчас' : atlasDate89(h.to)));
  const duration = periods.reduce((total,h)=>total+(h.to??s.clock.ticks)-h.from,0);
  const tripDate = t => t.departed ?? (t.status === 'completed' ? t.closed : null);
  const visits = trips.slice().sort((a,b)=>(tripDate(b) ?? -Infinity)-(tripDate(a) ?? -Infinity)).map(t => {
    const companions = [...new Set([t.companion,...(t.party53 || [])].filter(id => id && id !== 'player'))]
      .map(id => s.people.find(p => p.id === id)?.name).filter(Boolean);
    return [atlasDate89(tripDate(t)), t.status === 'interrupted' ? 'поездка прервана' : '',
      companions.length ? 'Вместе: '+companions.join(', ') : ''].filter(Boolean).join(' · ');
  });
  const list = items => '<ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
  const reference = city && typeof placeReference190 === 'function'
    ? placeReference190(country,city,'Подробнее',trips.length>0,true) : '';
  return '<details class="place-reference190 atlas-city89"'+(selected?' open':'')+'><summary>'+esc(title)+
    '<span class="atlas-city-symbols89">'+symbols+'</span></summary><div class="atlas-city-body89"><strong>'+
    esc(city ? title+', '+travelName103(country) : title)+'</strong>'+
    (matches(birth) ? '<p><b>Рождение</b> · '+esc(birthDate)+'</p>' : '')+
    (stays.length ? '<p><b>Проживание</b></p>'+list(stays)+'<p class="dossier-muted87">Месяцев по сохранившимся записям: '+duration+'</p>' : '')+
    (matches(data.current)&&!stays.length ? '<p>Текущий дом</p>' : '')+
    (visits.length ? '<p><b>Поездки: '+visits.length+'</b></p>'+list(visits) : '')+
    reference+'</div></details>';
}

function atlasDetails89(data, country, city) {
  const locations = new Set([data.current,data.birth,...data.periods,...data.trips]
    .filter(place=>place.country===country).map(place=>place.city||null));
  if(city)locations.add(city);
  const ordered = [...locations].sort((a,b)=>a&&b?a.localeCompare(b,'ru'):a?-1:b?1:0);
  return '<section class="dossier-card87 atlas-country89"><h2>'+esc(travelName103(country))+'</h2>'+
    (ordered.length ? ordered.map(name=>atlasCityDetails89(data,country,name,Boolean(city&&name===city))).join('') :
      '<p>Здесь пока нет записей.</p>')+'</section>';
}

function atlasView89() {
  const data = atlasData89(), country = atlasCountry89;
  const choices = [...new Set([data.birth,data.current,...data.periods,...data.trips]
    .map(place=>place.country).filter(id=>travelCountry103(id)))];
  if(country&&!choices.includes(country))choices.push(country);
  choices.sort((a,b)=>travelName103(a).localeCompare(travelName103(b),'ru'));
  const filters = '<div class="timeline-tools88 atlas-country-tools89" role="group" aria-label="Страны">'+
    '<button type="button" class="small" aria-label="Сбросить выбор страны" title="Сбросить выбор страны" aria-pressed="'+
    !country+'" onclick="atlasOpen89(null)">×</button>'+choices.map(id=>
    '<button type="button" class="small" aria-pressed="'+(country===id)+'" onclick="atlasOpen89(\''+id+'\')">'+
    esc(travelName103(id))+'</button>').join('')+'</div>';
  return '<article class="dossier87"><h1>География жизни</h1><div class="atlas-legend89">'+
    Object.keys(atlasLabels89).map(atlasBadge89).join('')+'</div>'+atlasMap89(data)+filters+
    (country ? atlasDetails89(data,country,atlasCity89) : '')+'</article>';
}

atlas86 = function () {
  closeModal();
  atlasOpen89(null);
};
