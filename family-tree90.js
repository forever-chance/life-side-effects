'use strict';

const treeRelations90 = {
  kin: 'Родительская связь', birth: 'Биологическая связь', adopted: 'Усыновление',
  married: 'Брак', former: 'Бывший союз', partner: 'Партнёрство',
  widowed: 'Союз до смерти', sibling: 'Брат или сестра', known: 'Известное родство'
};
const treePartnerKinds90 = new Set(['married','former','partner','widowed']);
const treeParentKinds90 = new Set(['kin','birth','adopted']);

function treeGraph90() {
  const people = new Map([['player',s], ...s.people.map(p => [p.id,p])]);
  const edges = new Map();
  function link(a,b,kind,undirected = false) {
    if (!people.has(a) || !people.has(b) || a === b) return;
    if (undirected && a > b) [a,b] = [b,a];
    const key = JSON.stringify([a,b,kind]);
    edges.set(key,{a,b,kind});
  }
  const origin = s.people.filter(p => ['Мать','Отец'].includes(p.role));
  const adoptiveParent=s.family17?.adoption141?.parentId;
  for (const p of origin) link(p.id,'player',adoptiveParent?'birth':'kin');
  if(adoptiveParent)link(adoptiveParent,'player','adopted');
  for (const p of s.people) {
    const genetic = p.birth49?.parents || [];
    const adoptive = p.adopted49 || p.bio27?.adopted || p.birth49?.method === 'adoption';
    const parents = new Set([...(p.bio27?.parents || []), ...(p.parentId ? [p.parentId] : [])]);
    if (ownChild53(p)) parents.add('player');
    if (['Брат','Сестра'].includes(p.role) && !parents.size) link('player',p.id,'sibling',true);
    for (const parent of parents) link(parent,p.id,adoptive ? 'adopted' : genetic.includes(parent) ? 'birth' : 'kin');
    for (const parent of genetic) link(parent,p.id,'birth');
    for (const childId of p.bio27?.children || []) {
      const child = people.get(childId);
      if (!child || child === s || (child.bio27?.parents || []).includes(p.id) ||
          child.birth49?.parents?.includes(p.id) || child.parentId === p.id) continue;
      const adopted = child.adopted49 || child.bio27?.adopted || child.birth49?.method === 'adoption';
      link(p.id,childId,adopted ? 'adopted' : 'kin');
    }
    if (p.married) link('player',p.id,p.alive && !s.dead ? 'married' : 'widowed',true);
    if (p.divorced) link('player',p.id,'former',true);
    else if (!p.married && p.role === 'Бывший партнер') link('player',p.id,'former',true);
    else if (!p.married && p.role === 'Партнер') link('player',p.id,'partner',true);
    if (['Бабушка','Дедушка','Внук','Внучка'].includes(p.role) && !parents.size) {
      link('player',p.id,'known');
    }
  }
  for (const u of s.family27?.unions || []) {
    const kind = u.status === 'together' ? 'partner' :
      u.status === 'widowed' ? 'widowed' : ['divorced','separated','ended'].includes(u.status) ? 'former' : null;
    if (kind) link(u.a,u.b,kind,true);
  }
  const links=[...edges.values()];
  const recordedAncestors=new Set(links.filter(e=>e.b==='player'&&treeParentKinds90.has(e.kind)).map(e=>e.a));
  const recordedGrandparents=new Set(links.filter(e=>recordedAncestors.has(e.b)&&treeParentKinds90.has(e.kind)).map(e=>e.a));
  return {people,edges:links.filter(e=>e.kind!=='known'||!recordedGrandparents.has(e.b))};
}

let treeRoot90 = 'player';
let treeLife90 = null;
let treeZoom90 = 1;
let treeDepth90 = 2;
let treeHidden90 = new Set();

function treeLayout90(graph, root) {
  const parents = new Map(), children = new Map(), side = new Map();
  const add = (map,id,target) => {
    if (!map.has(id)) map.set(id,new Set());
    map.get(id).add(target);
  };
  for (const edge of graph.edges) {
    if (treeParentKinds90.has(edge.kind)) {
      add(parents,edge.b,edge.a);
      add(children,edge.a,edge.b);
    } else {
      add(side,edge.a,edge.b);
      add(side,edge.b,edge.a);
    }
  }
  const placed = new Map([[root,0]]);
  function walk(links,step,branch) {
    if (treeHidden90.has(branch)) return;
    let frontier = [root];
    for (let level = 1; level <= treeDepth90 && frontier.length; level++) {
      const next = [];
      for (const id of frontier) for (const related of links.get(id) || []) {
        if (placed.has(related)) continue;
        placed.set(related,step*level);
        next.push(related);
      }
      frontier = next;
    }
  }
  walk(parents,-1,'parents');
  walk(children,1,'children');
  if (!treeHidden90.has('side')) {
    for (const [id,level] of [...placed]) {
      for (const related of side.get(id) || []) {
        if (placed.has(related)) continue;
        const p = graph.people.get(related);
        const offset = id === 'player' && ['Бабушка','Дедушка'].includes(p.role) ? -2 :
          id === 'player' && ['Внук','Внучка'].includes(p.role) ? 2 : 0;
        placed.set(related,level+offset);
      }
    }
    // Shared recorded parents are sufficient evidence for a sibling link.
    for (const parent of parents.get(root) || []) for (const sibling of children.get(parent) || []) {
      if (!placed.has(sibling)) placed.set(sibling,0);
    }
  }
  const rows = new Map();
  for (const [id,level] of placed) {
    if (!rows.has(level)) rows.set(level,[]);
    rows.get(level).push(id);
  }
  const width = Math.max(...[...rows.values()].map(row => row.length))*182 + 28;
  const levels = [...rows.keys()].sort((a,b) => a-b);
  const positions = new Map();
  levels.forEach((level,i) => {
    const row = rows.get(level);
    row.forEach((id,j) => positions.set(id,{
      x: (width-row.length*182)/2 + j*182 + 8,
      y: 14+i*174
    }));
  });
  return {positions,width,height:levels.length*174};
}

function treeCenter90(id) {
  treeRoot90 = id;
  treeHidden90 = new Set();
  render();
  treeScrollCenter90();
}
function treeScrollCenter90() {
  const pane = document.querySelector('.tree-pane90');
  const card = document.querySelector('.tree-node90[data-root="true"]');
  if (!pane?.scrollTo || !card?.getBoundingClientRect) return;
  const a = pane.getBoundingClientRect(), b = card.getBoundingClientRect();
  pane.scrollTo({left:pane.scrollLeft+b.left-a.left+(b.width-a.width)/2,
    top:pane.scrollTop+b.top-a.top+(b.height-a.height)/2});
}
function treeChange90(action) {
  if (action === 'zoom-in') treeZoom90 = Math.min(1.5,treeZoom90+.15);
  else if (action === 'zoom-out') treeZoom90 = Math.max(.55,treeZoom90-.15);
  else if (action === 'depth') treeDepth90++;
  else if (treeHidden90.has(action)) treeHidden90.delete(action);
  else treeHidden90.add(action);
  render();
  treeScrollCenter90();
}
function treePerson90(id) {
  if (id === 'player') return dossierSelect88('dossier');
  personDetail(id);
}

function treeCard90(graph,id,pos) {
  const p = graph.people.get(id), root = id === treeRoot90, player = id === 'player';
  const alive = player ? !s.dead : p.alive !== false;
  const fullName = player ? [s.name,s.surname].filter(Boolean).join(' ') : p.name;
  const city = player ? residenceCity() : p.city18 || p.city || '';
  const role = player ? 'Ваш персонаж' :
    p.married ? (p.gender === 'f' ? 'Супруга' : 'Супруг') :
    p.divorced ? (p.gender === 'f' ? 'Бывшая супруга' : 'Бывший супруг') : p.role || 'Родственник';
  return '<div class="tree-node90" data-node="'+esc(id)+'" onpointerenter="highlightTree185(this)" onfocusin="highlightTree185(this)" data-root="'+root+'" style="left:'+pos.x+'px;top:'+pos.y+'px">'+
    '<button class="tree-person90" data-person="'+esc(id)+'" onclick="treePerson90(this.dataset.person)">'+
    portraitHTML33(p,id)+'<span><strong>'+esc(fullName)+'</strong><small>'+esc(role)+'</small></span></button>'+
    '<p>'+esc([Number.isFinite(p.age) ? years(p.age) : '',alive ? '' : 'умер'+(p.gender === 'f' ? 'ла' : ''),city]
      .filter(Boolean).join(' · '))+'</p>'+
    (root ? '<span class="tree-focused90">В центре дерева</span>' :
      '<button class="tree-center90" data-person="'+esc(id)+'" onclick="treeCenter90(this.dataset.person)">В центр</button>')+'</div>';
}

function highlightTree185(card){
  const board=card.closest('.tree-board90');
  if(!board)return;
  const id=card.dataset.node;
  board.querySelectorAll('[data-connected]').forEach(line=>
    line.classList.toggle('tree-connected185',JSON.parse(line.dataset.connected).includes(id)));
  board.classList.add('tree-highlight185');
}

function treeLines148(edges,positions) {
  const lines = [];
  const path = (kind,d,ids) => '<path class="tree-line90 tree-'+kind+'90" data-connected="'+esc(JSON.stringify(ids))+'" d="'+d+'"/>';
  const parentsByChild = new Map();
  for (const edge of edges) {
    const a = positions.get(edge.a), b = positions.get(edge.b);
    if (treeParentKinds90.has(edge.kind) && a.y < b.y) {
      if (!parentsByChild.has(edge.b)) parentsByChild.set(edge.b,[]);
      const links=parentsByChild.get(edge.b);
      if (!links.some(link=>link.a===edge.a&&link.kind===edge.kind)) links.push(edge);
      continue;
    }
    const [left,right] = a.x<=b.x?[a,b]:[b,a];
    if (a.y===b.y && right.x-left.x===182) {
      lines.push(path(edge.kind,'M'+(left.x+166)+','+(left.y+65)+'H'+right.x,[edge.a,edge.b]));
      continue;
    }
    const x1=a.x+83,x2=b.x+83;
    const y1=a.y>b.y?a.y:a.y+130,y2=a.y>b.y?b.y+130:b.y;
    const middle=a.y===b.y?a.y-6:(y1+y2)/2;
    lines.push(path(edge.kind,'M'+x1+','+(a.y===b.y?a.y:y1)+'V'+middle+'H'+x2+'V'+y2,[edge.a,edge.b]));
  }
  const families=new Map();
  for(const [child,parents] of parentsByChild){
    const ordered=parents.slice().sort((a,b)=>a.a.localeCompare(b.a)||a.kind.localeCompare(b.kind));
    const key=JSON.stringify([positions.get(child).y,ordered.map(({a,kind})=>[a,kind])]);
    if(!families.has(key))families.set(key,{parents:ordered,children:[]});
    families.get(key).children.push(child);
  }
  const groupedByRow=new Map();
  for(const family of families.values()){
    const y=positions.get(family.children[0]).y;
    if(!groupedByRow.has(y))groupedByRow.set(y,[]);
    groupedByRow.get(y).push(family);
  }
  for(const {parents,children} of families.values()){
    const childY=positions.get(children[0]).y;
    const parentPoints=parents.map(edge=>({...positions.get(edge.a),kind:edge.kind}));
    const rowGroups=groupedByRow.get(childY);
    const floor=Math.max(...parentPoints.map(p=>p.y+130));
    const lane=(rowGroups.findIndex(f=>f.children===children)+1)/(rowGroups.length+1);
    const middle=Math.round(floor+(childY-floor)*lane);
    const ids=[...parents.map(p=>p.a),...children];
    const kind=parents.every(p=>p.kind===parents[0].kind)?parents[0].kind:'kin';
    const childXs=children.map(id=>positions.get(id).x+83);
    const xs=[...parentPoints.map(p=>p.x+83),...childXs];
    for(const p of parentPoints)lines.push(path(p.kind,'M'+(p.x+83)+','+(p.y+130)+'V'+middle,ids));
    if(Math.min(...xs)!==Math.max(...xs))lines.push(path(kind,'M'+Math.min(...xs)+','+middle+'H'+Math.max(...xs),ids));
    for(const x of childXs)lines.push(path(kind,'M'+x+','+middle+'V'+childY,ids));
  }
  return lines.join('');
}

function treeView90() {
  if (treeLife90 !== s.saveId) {
    treeLife90 = s.saveId;
    treeRoot90 = 'player';
    treeZoom90 = 1;
    treeDepth90 = 2;
    treeHidden90 = new Set();
  }
  const graph = treeGraph90();
  if (!graph.people.has(treeRoot90)) treeRoot90 = 'player';
  const layout = treeLayout90(graph,treeRoot90), {positions,width,height} = layout;
  const visibleEdges = graph.edges.filter(e => positions.has(e.a) && positions.has(e.b));
  const lines = treeLines148(visibleEdges,positions);
  const legend = [...new Set(visibleEdges.map(e => e.kind))].map(kind =>
    '<span class="tree-key90 tree-'+kind+'90">'+treeRelations90[kind]+'</span>').join('');
  const tools = [['parents','Предки'],['children','Потомки'],['side','Братья, сёстры и пары']].map(([id,title]) =>
    '<button aria-pressed="'+!treeHidden90.has(id)+'" onclick="treeChange90(\''+id+'\')">'+title+'</button>').join('');
  return '<article class="dossier87"><h1>Семейное древо</h1><p class="tree-guide185">Наведите на карточку или выделите её клавишей Tab, чтобы подсветить связи. Родители соединяются с детьми линиями между рядами.</p>'+
    '<div class="timeline-tools88">'+tools+'</div>'+
    '<div class="timeline-tools88"><button onclick="treeCenter90(\'player\')">К себе</button>'+
    '<button aria-label="Уменьшить" onclick="treeChange90(\'zoom-out\')">−</button>'+
    '<span>'+Math.round(treeZoom90*100)+'%</span>'+
    '<button aria-label="Увеличить" onclick="treeChange90(\'zoom-in\')">+</button>'+
    '<button onclick="treeChange90(\'depth\')">Ещё поколение</button></div>'+
    '<div class="tree-pane90" tabindex="0" aria-label="Семейное древо с прокруткой">'+
    '<div class="tree-board90" style="width:'+width+'px;height:'+height+'px;zoom:'+treeZoom90+'">'+
    '<svg aria-hidden="true" viewBox="0 0 '+width+' '+height+'">'+lines+'</svg>'+
    [...positions].map(([id,pos]) => treeCard90(graph,id,pos)).join('')+'</div></div>'+
    '<div class="atlas-legend89">'+legend+'</div></article>';
}
