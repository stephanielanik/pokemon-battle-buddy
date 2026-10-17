const colors={normal:'#a8a29e',fire:'#f58a52',water:'#5aa7e8',electric:'#e6b83f',grass:'#67bc84',ice:'#6acfcf',fighting:'#d56866',poison:'#a56cc3',ground:'#cba56e',flying:'#879de5',psychic:'#e97aa6',bug:'#9bbd54',rock:'#a99872',ghost:'#8574bd',dragon:'#7976d6',dark:'#6c667b',steel:'#83a8b5',fairy:'#e6a1ce'};
// Each row is the attacking type; entries are defending types and their multipliers.
const rules={normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}};
const $=id=>document.getElementById(id), title=s=>s.replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
let team=JSON.parse(localStorage.getItem('battleBuddyTeam')||'[]'),current=null,allNames=[];
let box=JSON.parse(localStorage.getItem('battleBuddyBox')||'[]');
let collectionView='party';
function newPokemonId(){return globalThis.crypto?.randomUUID?.()||('pokemon-'+Date.now()+'-'+Math.random().toString(36).slice(2))}
function ensureRecordIds(records){const seen=new Set();records.forEach(p=>{if(typeof p.recordId!=='string'||!p.recordId||seen.has(p.recordId))p.recordId=newPokemonId();seen.add(p.recordId)})}
ensureRecordIds([...team,...box]);
localStorage.setItem('battleBuddyTeam',JSON.stringify(team));
localStorage.setItem('battleBuddyBox',JSON.stringify(box));
let game=localStorage.getItem('battleBuddyGame')||'shield';$('game').value=game;
function updateGameLabel(){$('activeGame').textContent=$('game').selectedOptions[0]?.textContent||'Pokémon Shield'}
updateGameLabel();
// All 25 Pokémon natures. Neutral natures do not change stats.
const NATURES={
 hardy:[null,null],lonely:['attack','defense'],brave:['attack','speed'],adamant:['attack','special-attack'],naughty:['attack','special-defense'],
 bold:['defense','attack'],docile:[null,null],relaxed:['defense','speed'],impish:['defense','special-attack'],lax:['defense','special-defense'],
 timid:['speed','attack'],hasty:['speed','defense'],serious:[null,null],jolly:['speed','special-attack'],naive:['speed','special-defense'],
 modest:['special-attack','attack'],mild:['special-attack','defense'],quiet:['special-attack','speed'],bashful:[null,null],rash:['special-attack','special-defense'],
 calm:['special-defense','attack'],gentle:['special-defense','defense'],sassy:['special-defense','speed'],careful:['special-defense','special-attack'],quirky:[null,null]
};
const STAT_LABELS={'attack':'Attack','defense':'Defense','special-attack':'Sp. Atk','special-defense':'Sp. Def','speed':'Speed'};
function natureMultiplier(nature,stat){
 const pair=NATURES[nature];
 return pair?.[0]===stat?1.1:pair?.[1]===stat?.9:1;
}
function natureSummary(nature){
 if(!nature||!NATURES[nature])return 'Nature not recorded — neutral estimate';
 const [up,down]=NATURES[nature];
 return !up?'Neutral nature — no stat changes':'+10% '+STAT_LABELS[up]+' · −10% '+STAT_LABELS[down];
}
const natureSelect=$('profileNature'),natureHint=$('profileNatureHint');
natureSelect.innerHTML='<option value="">Not recorded</option>'+
 Object.keys(NATURES).sort().map(n=>'<option value="'+n+'">'+title(n)+' ('+
 (NATURES[n][0]?'+'+STAT_LABELS[NATURES[n][0]]+', −'+STAT_LABELS[NATURES[n][1]]:'Neutral')+
 ')</option>').join('');
function updateNatureHint(){natureHint.textContent=natureSummary(natureSelect.value)}
natureSelect.addEventListener('change',updateNatureHint);
updateNatureHint();
const regional={shield:'galar',sword:'galar','lets-go-pikachu':'','lets-go-eevee':'','legends-za':''};
const galarDefaults=new Set(['meowth','ponyta','rapidash','farfetchd','weezing','mr-mime','corsola','zigzagoon','linoone','darumaka','darmanitan','yamask','stunfisk','slowpoke','slowbro','slowking','articuno','zapdos','moltres']);
function preferredName(name){const region=regional[game];return region==='galar'&&galarDefaults.has(name)?name+'-galar':name}
$('game').addEventListener('change',()=>{game=$('game').value;localStorage.setItem('battleBuddyGame',game);updateGameLabel();if(current){const base=current.name.replace(/-(galar|alola|hisui)$/,'');search(base)}});
function pill(t){return `<span class="pill" style="background:${colors[t]}">${title(t)}</span>`}
function gradient(types){return `linear-gradient(125deg,${colors[types[0]]||'#d9b4ee'}bb,${colors[types[1]||types[0]]||'#e0c1ed'}aa)`}
function match(types){return Object.keys(colors).map(a=>({type:a,value:types.reduce((n,d)=>n*(rules[a]?.[d]??1),1)}))}
const matchupGroups=[
  ['super','🔥 Super effective',x=>x>1],
  ['neutral','➖ Neutral',x=>x===1],
  ['resisted','🛡️ Resisted',x=>x>0&&x<1],
  ['immune','🚫 Immune',x=>x===0]
];
function showMatch(types){
  const container=$('matchups');
  const opened=new Set([...container.querySelectorAll('details[open]')].map(x=>x.dataset.group));
  container.replaceChildren();
  matchupGroups.forEach(([key,label,predicate])=>{
    const matches=match(types).filter(x=>predicate(x.value));
    const group=document.createElement('details');group.className='matchup-group';group.dataset.group=key;
    group.open=opened.size?opened.has(key):key==='super';
    const summary=document.createElement('summary');
    summary.textContent=label+' ';
    const count=document.createElement('span');count.className='matchup-count';count.textContent=String(matches.length);summary.append(count);
    const chips=document.createElement('div');chips.className='chips';
    if(matches.length){
      matches.forEach(x=>{const chip=document.createElement('span');chip.className='chip';chip.style.background=colors[x.type];chip.textContent=title(x.type)+' ×'+x.value;chips.append(chip)});
    }else chips.textContent='None';
    const moves=document.createElement('div');moves.className='category-moves';moves.id='advisor-'+key;
    group.append(summary,chips,moves);container.append(group);
  });
}

async function api(path){let r=await fetch('https://pokeapi.co/api/v2/'+path);if(!r.ok)throw Error('Pokémon not found. Try its name or Pokédex number.');return r.json()}
async function search(name,manual=false){
  const lookupRun=++opponentLookupRun;opponentAbilityInfo=null;
  $('editLookupBoxPokemon').hidden=true;
  name=name.toLowerCase().trim().replace(/\s+/g,'-').replace('♀','-female').replace('♂','-male');
  if(!name)return;
  const requestedFemale=name==='jellicent-female';
  if(requestedFemale)name='jellicent-male';
  if(!manual&&!/-(galar|alola|hisui|male)$/.test(name))name=preferredName(name);
  $('message').textContent='Finding your Pokémon…';$('result').hidden=true;$('suggestions').hidden=true;
  try{const p=await api('pokemon/'+name);if(lookupRun!==opponentLookupRun)return;
  opponentAbilityInfo=await resolveOpponentAbilities(p);let types=p.types.sort((a,b)=>a.slot-b.slot).map(x=>x.type.name);const artwork=requestedFemale?(p.sprites.other?.home?.front_female||p.sprites.front_female||'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/female/593.png'):(p.sprites.other['official-artwork'].front_default||p.sprites.front_default);current={id:p.id,name:p.name,gender:requestedFemale?'female':'male',types,artwork,ability:null,moves:[],heldItem:null,pokerus:'unknown',tags:[]};$('name').textContent=requestedFemale?'Jellicent Female':title(p.name);$('dex').textContent='#'+String(p.id).padStart(3,'0');$('art').src=artwork;$('types').innerHTML=types.map(pill).join('');$('hero').style.background=gradient(types);showMatch(types);refreshMoveAdvisor(types);$('forms').innerHTML='';const species=await api('pokemon-species/'+p.species.name);$('dex').textContent='#'+String(species.id).padStart(3,'0');const forms=species.varieties.filter(x=>x.is_default||/(galar|alola|hisui)/.test(x.pokemon.name));if(p.species.name==='jellicent'){forms.length=0;forms.push({pokemon:{name:'jellicent-male'}},{pokemon:{name:'jellicent-female'}})}
  if(forms.length>1)$('forms').innerHTML=forms.map(x=>`<button data-form="${x.pokemon.name}">${title(x.pokemon.name)}</button>`).join('');$('forms').querySelectorAll('button').forEach(b=>b.onclick=()=>search(b.dataset.form,true));$('result').hidden=false;$('message').textContent='';}catch(e){$('message').textContent=e.message+' (PokéAPI requires internet.)'}}

function showCollection(view){
  collectionView=['party','box'].includes(view)?view:'party';
  $('teamCards').hidden=collectionView!=='party';
  $('boxCards').hidden=collectionView!=='box';
  $('boxFilters').hidden=collectionView!=='box';
  $('boxAdd').hidden=collectionView!=='box';

  $('partyView').classList.toggle('active',collectionView==='party');
  $('boxView').classList.toggle('active',collectionView==='box');

  $('partyView').setAttribute('aria-pressed',String(collectionView==='party'));
  $('boxView').setAttribute('aria-pressed',String(collectionView==='box'));


  $('analyzerDisclosure').hidden=collectionView!=='party';

}
// Reorder only within the current collection; preserve each Pokémon's record.
function persistCardOrder(container,location){
  const records=location==='party'?team:box;
  const byId=new Map(records.map(p=>[p.recordId,p]));
  const ids=[...container.querySelectorAll('.compact-teamcard')].map(el=>el.dataset.recordId);
  if(ids.length!==records.length||ids.some(id=>!byId.has(id)))return;
  records.splice(0,records.length,...ids.map(id=>byId.get(id)));
  localStorage.setItem(location==='party'?'battleBuddyTeam':'battleBuddyBox',JSON.stringify(records));
}
function setupCardReorder(handle,card,container,location){
  let active=false,originalIndex=-1,pointerId=null;
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0||active)return;
    active=true;pointerId=event.pointerId;
    originalIndex=[...container.children].indexOf(card);
    document.addEventListener('pointermove',onDragMove);
    document.addEventListener('pointerup',finish);
    document.addEventListener('pointercancel',finish);
    card.classList.add('card-reordering');
    event.preventDefault();
  });
  function onDragMove(event){
    if(!active||event.pointerId!==pointerId)return;
    const siblings=[...container.querySelectorAll('.compact-teamcard')].filter(el=>el!==card);
    const target=siblings.find(el=>event.clientY<el.getBoundingClientRect().top+el.getBoundingClientRect().height/2);
    if(target)container.insertBefore(card,target);
    else container.append(card);
    // Keep dragging useful near the edges of the iPhone screen.
    const edge=65;
    if(event.clientY<edge)window.scrollBy(0,-15);
    else if(event.clientY>window.innerHeight-edge)window.scrollBy(0,15);
  }
  function finish(event){
    if(!active||(event.pointerId!=null&&event.pointerId!==pointerId))return;
    active=false;pointerId=null;
    document.removeEventListener('pointermove',onDragMove);
    document.removeEventListener('pointerup',finish);
    document.removeEventListener('pointercancel',finish);
    card.classList.remove('card-reordering');
    if(event.type==='pointercancel'){
      const at=container.children[originalIndex];
      if(at&&at!==card)container.insertBefore(card,at);
      else if(!at)container.append(card);
      return;
    }
    persistCardOrder(container,location);
  }
  handle.addEventListener('keydown',event=>{
    if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
    event.preventDefault();
    if(event.key==='ArrowUp'&&card.previousElementSibling)container.insertBefore(card,card.previousElementSibling);
    if(event.key==='ArrowDown'&&card.nextElementSibling)container.insertBefore(card,card.nextElementSibling.nextElementSibling);
    persistCardOrder(container,location);
    handle.focus();
  });
}
// Box filters only change the view, never the saved custom order.
let boxSearch='',boxType='',boxSort='custom';
const boxTypeSelect=$('boxFilterType');
for(const type of Object.keys(colors).sort()){
  const option=document.createElement('option');option.value=type;option.textContent=title(type);
  boxTypeSelect.append(option);
}
function visibleBox(){
  const filtered=box.filter(p=>{
    const text=(p.nickname||'')+' '+(p.name||'');
    return (!boxSearch||text.toLowerCase().includes(boxSearch))&&
      (!boxType||(p.types||[]).includes(boxType));
  });
  if(boxSort==='name')filtered.sort((a,b)=>(a.nickname||title(a.name)).localeCompare(b.nickname||title(b.name)));
  else if(boxSort==='level-desc')filtered.sort((a,b)=>(Number(b.level)||0)-(Number(a.level)||0));
  else if(boxSort==='level-asc')filtered.sort((a,b)=>(Number(a.level)||0)-(Number(b.level)||0));
  else if(boxSort==='dex')filtered.sort((a,b)=>(Number(a.id)||0)-(Number(b.id)||0));
  return filtered;
}
function renderBoxCards(){
  const visible=visibleBox();
  $('boxFilterCount').textContent=visible.length===box.length?'':'('+visible.length+'/'+box.length+')';
  renderCollectionCards(visible,$('boxCards'),'box');
  if(!visible.length&&box.length){
    $('boxCards').replaceChildren();
    const empty=document.createElement('p');empty.className='hint';
    empty.textContent='No Pokémon match your filters.';$('boxCards').append(empty);
  }
}
$('boxFilterSearch').addEventListener('input',e=>{boxSearch=e.target.value.trim().toLowerCase();renderBoxCards()});
$('boxFilterType').addEventListener('change',e=>{boxType=e.target.value;renderBoxCards()});
$('boxSort').addEventListener('change',e=>{boxSort=e.target.value;renderBoxCards()});
$('boxFilterReset').addEventListener('click',()=>{
  boxSearch='';boxType='';boxSort='custom';
  $('boxFilterSearch').value='';$('boxFilterType').value='';$('boxSort').value='custom';
  renderBoxCards();
});
function renderCollectionCards(list,container,location){
  container.replaceChildren();
  for(const p of list){
    const card=document.createElement('div');card.className='teamcard compact-teamcard';card.style.background=gradient(p.types);
    card.dataset.recordId=p.recordId;
    const handle=document.createElement('button');
    handle.type='button';handle.className='card-drag-handle';
    handle.textContent='⠿';
    handle.setAttribute('aria-label','Reorder '+(p.nickname||title(p.name))+'; drag or use arrow keys');
    handle.title='Drag to reorder';
    setupCardReorder(handle,card,container,location);
    if(location==='box'&&(boxSearch||boxType||boxSort!=='custom')){
      handle.disabled=true;handle.title='Clear filters and choose Custom order to rearrange';
    }
    const img=document.createElement('img');img.src=p.artwork||'';img.alt='';
    const info=document.createElement('div');info.className='teamcard-info';
    const name=document.createElement('strong');name.textContent=p.nickname||(p.gender==='female'&&p.name==='jellicent-male'?'Jellicent Female':title(p.name));
    const heading=document.createElement('div');heading.className='compact-card-heading';
    const levelControl=document.createElement('div');levelControl.className='quick-level';
    const levelValue=document.createElement('button');levelValue.type='button';levelValue.className='quick-level-value';
    const pokemonName=p.nickname||title(p.name);
    const currentLevel=()=>Number.isInteger(Number(p.level))&&Number(p.level)>=1&&Number(p.level)<=100?Number(p.level):null;
    function refreshLevel(){
      const level=currentLevel();
      levelValue.textContent=level===null?'Lv. —':'Lv. '+level;
      levelValue.setAttribute('aria-label','Edit level for '+pokemonName+(level===null?'':', currently '+level));
      levelPlus.disabled=level===100;
    }
    const levelPlus=document.createElement('button');levelPlus.type='button';levelPlus.className='quick-level-plus';
    levelPlus.textContent='＋';levelPlus.setAttribute('aria-label','Increase '+pokemonName+' level by one');
    function setQuickLevel(value){
      if(!Number.isInteger(value)||value<1||value>100)return;
      p.level=value;
      localStorage.setItem('battleBuddyTeam',JSON.stringify(team));
      localStorage.setItem('battleBuddyBox',JSON.stringify(box));
      refreshLevel();
      // A level change should not rebuild cards or jump the page.
      $('analyzerResults').replaceChildren();
      $('boxRecommendations').hidden=true;
      $('analyzerStatus').textContent='Levels changed. Analyze Party again for updated recommendations.';
    }
    levelPlus.addEventListener('click',()=>setQuickLevel(Math.min(100,(currentLevel()??0)+1)));
    levelValue.addEventListener('click',()=>{
      const entered=prompt('Set level for '+pokemonName+' (1–100):',currentLevel()??'');
      if(entered===null)return;
      const trimmed=entered.trim();
      if(!/^(?:[1-9]|[1-9][0-9]|100)$/.test(trimmed)){
        alert('Please enter a whole number from 1 to 100.');return;
      }
      setQuickLevel(Number(trimmed));
    });
    levelControl.append(levelValue,levelPlus);
    heading.append(name,levelControl);
    refreshLevel();
    const species=document.createElement('small');species.textContent=p.nickname?title(p.name):'';
    const types=document.createElement('div');types.className='types';types.innerHTML=p.types.map(pill).join('');
    const actions=document.createElement('div');actions.className='teamcard-actions';
    const edit=document.createElement('button');edit.type='button';edit.textContent='Edit profile';edit.addEventListener('click',()=>openProfile(p.recordId));
    const move=document.createElement('button');move.type='button';move.textContent=location==='party'?'Move to Box':'Add to Party';
    move.addEventListener('click',()=>movePokemon(p.recordId,location));
    actions.append(edit,move);
    if(location==='box'){
      const remove=document.createElement('button');
      remove.type='button';remove.className='remove-box-pokemon';
      remove.textContent='Remove';
      remove.setAttribute('aria-label','Remove '+(p.nickname||title(p.name))+' from Box');
      remove.addEventListener('click',()=>removeBoxPokemon(p.recordId));
      actions.append(remove);
    }
    info.append(heading,species,types,actions);
    card.append(handle,img,info);container.append(card);
  }
  if(!list.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=location==='party'?'No Pokémon in your party. Add one from Lookup or your Box.':'Your Box is empty.';container.append(empty)}
}

function renderTeam(){
  // Main navigation no longer has a teamCount element.
  $('partyCount').textContent=team.length+'/6';
  $('boxCount').textContent=box.length;
  $('partySummary').textContent=team.length;
  $('boxSummary').textContent=box.length;
  renderCollectionCards(team,$('teamCards'),'party');
  renderBoxCards();
  showCollection(collectionView);
}
function save(){
  localStorage.setItem('battleBuddyTeam',JSON.stringify(team));
  localStorage.setItem('battleBuddyBox',JSON.stringify(box));
  renderTeam();$('boxRecommendations').hidden=true;$('analyzerResults').replaceChildren();$('analyzerStatus').textContent='Party changed. Tap Analyze Party for updated results.';if(current)refreshMoveAdvisor(current.types);
}
function removeBoxPokemon(recordId){
  const index=box.findIndex(p=>p.recordId===recordId);
  if(index<0)return;
  const pokemon=box[index];
  const name=pokemon.nickname||title(pokemon.name);
  if(!confirm('Permanently remove '+name+' from your Battle Buddy Box? This deletes its saved profile and cannot be undone without a backup.'))return;
  box.splice(index,1);
  save();
}
function movePokemon(recordId,location){
  const source=location==='party'?team:box, destination=location==='party'?box:team;
  if(location==='box'&&team.length>=6){alert('Your party is full. Move one Pokémon to the Box first.');return}
  const index=source.findIndex(p=>p.recordId===recordId);if(index<0)return;
  destination.push(source.splice(index,1)[0]);save();
}
$('partyView').addEventListener('click',()=>showCollection('party'));
$('boxView').addEventListener('click',()=>showCollection('box'));
$('toggleBoxAdd').addEventListener('click',()=>{
  if(collectionView!=='box')showCollection('box');
  $('boxAdd').open=!$('boxAdd').open;
  if($('boxAdd').open)$('boxPokemonSearch').focus();
});
$('boxAdd').addEventListener('toggle',()=>{
  const expanded=$('boxAdd').open;
  $('toggleBoxAdd').setAttribute('aria-expanded',String(expanded));
  $('toggleBoxAdd').textContent=expanded?'− Close Add Pokémon':'＋ Add Pokémon';
});
$('add').onclick=()=>{
  if(!current)return;
  const newRecord={...current,recordId:newPokemonId()};
  if(team.length<6){team.push(newRecord);collectionView='party'}
  else if(confirm('Your party is full. Save this Pokémon to the Box instead?')){box.push(newRecord)}
  else return;
  save();$('add').textContent='✓ Saved';
  setTimeout(()=>$('add').textContent='＋ Add to My Team',1500);
};

$('addToBox').addEventListener('click',()=>{
  if(!current)return;
  const added={...current,recordId:newPokemonId()};
  box.push(added);
  save();
  $('editLookupBoxPokemon').hidden=false;
  $('editLookupBoxPokemon').onclick=()=>openProfile(added.recordId);
  const button=$('addToBox');
  button.textContent='✓ Added to Box';
  clearTimeout(button._resetTimer);
  button._resetTimer=setTimeout(()=>{button.textContent='＋ Add to Box'},1500);
});
$('search').addEventListener('focus',()=>{
  if(!$('search').value)return;
  $('search').value='';
  $('suggestions').hidden=true;
  $('suggestions').replaceChildren();
});
$('go').onclick=()=>search($('search').value);$('search').addEventListener('keydown',e=>{if(e.key==='Enter')search($('search').value)});
let timer;$('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const q=$('search').value.toLowerCase().trim();let hits=allNames.filter(n=>n.includes(q)).slice(0,9);
  if(q&&('jellicent-female'.includes(q)||'jellicent'.includes(q)))hits=[...new Set(['jellicent-female',...hits])].slice(0,9);$('suggestions').hidden=!q||!hits.length;$('suggestions').innerHTML=hits.map(n=>{const female=n==='jellicent-female';const id=female?593:allNames.indexOf(n)+1;const picked=preferredName(n);return `<button data-name="${n}"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n==='jellicent-female'?'female/':''}${id}.png" alt=""><strong>${title(n)}</strong>${picked!==n?'<span class="sub">Galar preferred</span>':''}</button>`}).join('');$('suggestions').querySelectorAll('button').forEach(b=>{
  b.type='button';
  let selected=false;
  const choose=()=>{
    if(selected)return;
    selected=true;
    const name=b.dataset.name;
    $('search').value=title(name);
    $('suggestions').hidden=true;
    $('search').blur();
    search(name);
  };
  // On iOS the first tap can dismiss the keyboard without delivering click.
  // Handle touch at pointerdown while the suggestion is still mounted.
  b.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'){e.preventDefault();choose();}
  });
  b.addEventListener('click',choose);
});
requestAnimationFrame(keepLookupSuggestionsVisible);},150)});
// Keep the autocomplete list reachable above the iPhone on-screen keyboard.
function keepLookupSuggestionsVisible(){
  const input=$('search'),list=$('suggestions');
  if(document.activeElement!==input||list.hidden||!list.children.length)return;
  const viewport=window.visualViewport;
  const visibleBottom=viewport?viewport.offsetTop+viewport.height:window.innerHeight;
  const inputRect=input.getBoundingClientRect();
  // Never chase the bottom of a growing suggestion list: that hides the input.
  if(inputRect.bottom>visibleBottom-12){
    window.scrollBy({top:inputRect.bottom-visibleBottom+24,behavior:'auto'});
  }
}
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',()=>requestAnimationFrame(keepLookupSuggestionsVisible));
}
// Type-only matchup for unidentified Max Raid silhouettes.
const raidFirst=$('raidTypeOne'),raidSecond=$('raidTypeTwo');
for(const type of Object.keys(colors)){
  for(const select of [raidFirst,raidSecond]){
    const option=document.createElement('option');option.value=type;option.textContent=title(type);
    select.append(option);
  }
}
const noSecond=document.createElement('option');noSecond.value='';noSecond.textContent='None';
raidSecond.prepend(noSecond);raidSecond.value='';raidFirst.value='normal';
let raidRun=0;
let battleMode='raid';
function setBattleMode(mode){
  battleMode=mode;
  for(const [id,value] of [['modeRaid','raid'],['modeGym','gym']]){
    $(id).classList.toggle('active',mode===value);
    $(id).setAttribute('aria-pressed',String(mode===value));
  }
  $('battleModeHint').textContent=mode==='gym'?
    'Select the gym’s main type to plan a six-Pokémon lineup.':
    'Select the types shown on a Max Raid silhouette.';
  refreshRaidMatchup();
}
$('modeRaid').addEventListener('click',()=>setBattleMode('raid'));
$('modeGym').addEventListener('click',()=>setBattleMode('gym'));
async function refreshRaidMatchup(){
  const run=++raidRun,types=[raidFirst.value,raidSecond.value].filter(Boolean);
  const output=$('raidResults');output.replaceChildren();
  if(!types.length)return;
  const heading=document.createElement('h3');heading.textContent='Best attack types';output.append(heading);
  const groups=[['🔥 Super effective',x=>x>1],['➖ Neutral',x=>x===1],
    ['🛡️ Resisted',x=>x>0&&x<1],['🚫 Immune',x=>x===0]];
  const data=match(types);
  for(const [label,filter] of groups){
    const matches=data.filter(x=>filter(x.value));
    const section=document.createElement('details');section.className='raid-group';section.open=label.includes('Super');
    const summary=document.createElement('summary');summary.textContent=label+' ('+matches.length+')';
    const chips=document.createElement('div');chips.className='chips';
    if(!matches.length)chips.textContent='None';
    for(const entry of matches){
      const chip=document.createElement('span');chip.className='chip';
      chip.style.background=colors[entry.type];chip.textContent=title(entry.type)+' ×'+entry.value;chips.append(chip);
    }
    section.append(summary,chips);output.append(section);
  }
  const teamHeading=document.createElement('h3');teamHeading.textContent=battleMode==='gym'?'Suggested Gym Team':'Best Pokémon from your party';output.append(teamHeading);
  const status=document.createElement('p');status.className='hint';
  status.textContent='Checking your recorded moves…';output.append(status);
  const all=[...team,...box];
  const entries=all.flatMap(p=>(p.moves||[]).filter(m=>typeof m==='string'&&m.trim()).map(name=>({p,name})));
  if(!entries.length){status.textContent='Record moves in Pokémon profiles to get recommendations.';return}
  const loaded=await Promise.all(entries.map(async x=>({...x,move:await moveInfo(x.name)})));
  if(run!==raidRun||$('raid').hidden)return;
  const profileNames=[...new Set(all.map(p=>p.name))];
  const profiles=new Map(await Promise.all(profileNames.map(async name=>[name,await getTeachingPokemon(name)])));
  if(run!==raidRun||$('raid').hidden)return;
  const ranked=loaded.flatMap(({p,move,name})=>{
    if(!move?.power||move.damage_class?.name==='status')return [];
    const effectiveness=types.reduce((n,t)=>n*(rules[move.type.name]?.[t]??1),1);
    if(effectiveness===0)return [];
    const stab=p.types.includes(move.type.name)?1.5:1;
    const accuracy=(move.accuracy??100)/100;
    const risk=defensiveRisk(p,types).worst;
    const defenseWeight=risk>=4?.2:risk>=2?.55:risk<1?1.2:1;
    const stats=profiles.get(p.name)?.stats||[];
    const statName=move.damage_class?.name==='physical'?'attack':'special-attack';
    const baseStat=stats.find(s=>s.stat.name===statName)?.base_stat||65;
    const level=Number(p.level)||null;
    // Only a relative heuristic: no IVs, EVs, nature, opponent stats or Dynamax effects.
    // Penalize delayed and conditional moves, not just their listed power.
    const drawbacks=moveDrawbacks(move);
    const turns=drawbacks.some(x=>x.startsWith('Takes two turns')||x==='Must recharge next turn')?0.5:1;
    const delayed=['future-sight','doom-desire'].includes(move.name)?0.45:1;
    const conditional=['dynamic-punch','zap-cannon'].includes(move.name)?0.9:1;
    const strength=move.power*effectiveness*stab*accuracy*defenseWeight*
      (baseStat*natureMultiplier(p.nature,statName)/80)*(level?Math.pow(Math.max(.4,level/40),2):.35)*
      turns*delayed*conditional;
    // This is an approximate matchup estimate, not a damage prediction.
    return [{p,name:move.name||name,effectiveness,score:strength,level,risk}];
  }).sort((a,b)=>b.score-a.score);
  function bestPerPokemon(items){
    const seen=new Set(),result=[];
    for(const x of items){if(seen.has(x.p.recordId))continue;seen.add(x.p.recordId);result.push(x)}
    return result;
  }
  const partyBest=bestPerPokemon(ranked.filter(x=>team.includes(x.p))).slice(0,3);
  function renderChoice(x,container,prefix=''){
    const card=document.createElement('div');card.className='battle-pick';
    const heading=document.createElement('strong');
    heading.textContent=prefix+(x.p.nickname||title(x.p.name))+' — '+title(x.name);
    const detail=document.createElement('p');detail.className='hint';
    detail.textContent='Lv. '+(x.level||'—')+' · Attack ×'+x.effectiveness+' · '+defensiveRiskLabel(x.p,types);
    card.append(heading,detail);container.append(card);
    return card;
  }
  function addBoxLink(card){
    const button=document.createElement('button');button.type='button';
    button.textContent='View in Box';
    button.addEventListener('click',()=>{
      document.querySelector('.tab[data-tab="team"]').click();
      showCollection('box');
      $('boxCards').scrollIntoView({behavior:'smooth',block:'start'});
    });
    card.append(button);
  }
  // Gym preparation: evaluate compatible, owned TMs/TRs for boxed Pokémon.
  // These are preparation ideas, not moves the Pokémon already knows.
  const gymMachines=[];
  if(battleMode==='gym'&&(game==='shield'||game==='sword')){
    const owned=ownedMachines();
    const ownedDetails=await Promise.all(owned.map(async machine=>({machine,move:await moveInfo(machine.name)})));
    if(run!==raidRun||$('raid').hidden)return;
    for(const p of box){
      const species=profiles.get(p.name);
      if(!species)continue;
      const stats=species.stats||[];
      const level=Number(p.level)||0;
      const options=[];
      for(const {machine,move} of ownedDetails){
        if(!move?.power||move.damage_class?.name==='status'||!canTeachInShield(species,machine.name))continue;
        if((p.moves||[]).some(name=>normalizeMoveName(name)===normalizeMoveName(move.name)))continue;
        const effectiveness=types.reduce((n,t)=>n*(rules[move.type.name]?.[t]??1),1);
        if(effectiveness<=1)continue;
        const statName=move.damage_class.name==='physical'?'attack':'special-attack';
        const baseStat=stats.find(x=>x.stat.name===statName)?.base_stat||65;
        const stab=p.types.includes(move.type.name)?1.5:1;
        const drawbacks=moveDrawbacks(move);
        const slow=drawbacks.some(x=>x.startsWith('Takes two turns')||x==='Must recharge next turn')?.5:1;
        const recoil=drawbacks.includes('Recoil damage')?.75:1;
        const score=move.power*effectiveness*stab*(move.accuracy??100)/100*
          (baseStat*natureMultiplier(p.nature,statName)/80)*Math.pow(Math.max(.3,level/40),2)*slow*recoil;
        options.push({machine,move,score,effectiveness});
      }
      options.sort((a,b)=>b.score-a.score);
      if(options.length)gymMachines.push({p,best:options[0],level});
    }
    gymMachines.sort((a,b)=>b.best.score-a.best.score);
  }
  const unique=bestPerPokemon(ranked);
  if(battleMode==='gym'){
    // Gym teams must be balanced, not simply the six highest single-move scores.
    const chosen=[],available=[...unique];
    const partyLevels=team.map(p=>Number(p.level)).filter(n=>n>=1&&n<=100);
    const benchmark=partyLevels.length?Math.round(partyLevels.reduce((a,b)=>a+b,0)/partyLevels.length):40;
    function gymScore(x){
      const level=x.level||0;
      const readiness=level?Math.min(1.15,Math.pow(level/benchmark,2)):.35;
      const weakPenalty=x.risk>=4?.55:x.risk>=2?.8:1;
      const typeBonus=x.effectiveness>1?1.5:1;
      const redundant=chosen.filter(y=>y.p.types.some(t=>x.p.types.includes(t))).length;
      const attackRepeat=chosen.filter(y=>y.name===x.name).length;
      return x.score*readiness*weakPenalty*typeBonus*
        Math.max(.5,1-redundant*.11-attackRepeat*.08);
    }
    while(chosen.length<6&&available.length){
      available.sort((a,b)=>gymScore(b)-gymScore(a));
      chosen.push(available.shift());
    }
    status.textContent=chosen.length?'Suggested lineup for the selected type, with levels and coverage considered:':'No recorded damaging moves found.';
    chosen.forEach((x,i)=>{
      const card=renderChoice(x,output,(i+1)+'. '+(box.includes(x.p)?'📦 ':''));
      if(box.includes(x.p))addBoxLink(card);
      if(!x.level||x.level<benchmark-7){
        const caution=document.createElement('p');caution.className='hint';
        caution.textContent='⚠️ Level below party average or not recorded; consider training first.';
        card.append(caution);
      }
      if(['future-sight','doom-desire'].includes(normalizeMoveName(x.name))){
        const caution=document.createElement('p');caution.className='hint';
        caution.textContent='⚠️ Delayed damage; may not be the best immediate attack.';
        card.append(caution);
      }
    });
    const incoming=chosen.filter(x=>box.includes(x.p));
    const outgoing=team.filter(p=>!chosen.some(x=>x.p===p));
    const swaps=document.createElement('p');swaps.className='hint';
    swaps.textContent=incoming.length?
      'Consider bringing in '+incoming.map(x=>x.p.nickname||title(x.p.name)).join(', ')+
      (outgoing.length?' and boxing '+outgoing.map(p=>p.nickname||title(p.name)).join(', '):'')+'.':
      'Your current party fills the recommended slots.';
    output.append(swaps);
    const caveat=document.createElement('p');caveat.className='hint';
    caveat.textContent='Gym planning uses the selected type, not the gym leader’s complete roster. Review individual matchups before swapping.';
    output.append(caveat);
    const teaching=document.createElement('details');teaching.className='raid-group raid-box-options';
    const teachingTitle=document.createElement('summary');teachingTitle.textContent='💿 Improve Your Box with TM/TRs';
    const teachingBody=document.createElement('div');teachingBody.className='raid-box-content';
    teaching.append(teachingTitle,teachingBody);output.append(teaching);
    if(!gymMachines.length){
      const msg=document.createElement('p');msg.className='hint';
      msg.textContent='No compatible super-effective attacks found among your recorded TM/TR inventory. Check that your bank is up to date.';
      teachingBody.append(msg);
    }
    for(const item of gymMachines.slice(0,5)){
      const row=document.createElement('div');row.className='battle-pick';
      const name=document.createElement('strong');
      name.textContent=(item.p.nickname||title(item.p.name))+' (Lv. '+(item.level||'—')+')';
      const detail=document.createElement('p');detail.className='hint';
      detail.textContent='Teach '+title(item.best.move.name)+' ('+item.best.machine.key+') · '+title(item.best.move.type.name)+' ×'+item.best.effectiveness+' · Power '+item.best.move.power+' · Accuracy '+(item.best.move.accuracy??'—')+'%';
      const note=document.createElement('p');note.className='hint';
      const current=await Promise.all((item.p.moves||[]).map(n=>n?moveInfo(n):Promise.resolve(null)));
      if(run!==raidRun||$('raid').hidden)return;
      const entries=Array.from({length:4},(_,index)=>({
        index,name:item.p.moves?.[index]||'',move:current[index]||null
      }));
      const empty=entries.find(x=>!x.name);
      const details=profiles.get(item.p.name);
      details._recordedLevel=item.level;
      details._recordedNature=item.p.nature||'';
      const replacement=empty||decideMoveReplacement(item.best.move,entries,details);
      const decision=explainMoveDecision(item.best.move,replacement,details,empty,false);
      note.textContent=decision.text;
      const compare=document.createElement('button');compare.type='button';
      compare.textContent='Compare Move';
      compare.addEventListener('click',async()=>{
        await openProfile(item.p.recordId);
        $('learnMoveName').value=title(item.best.move.name);
        $('compareNewMove').click();
        $('learnMoveName').closest('details')?.setAttribute('open','');
        $('learnMoveName').scrollIntoView({behavior:'smooth',block:'center'});
      });
      row.append(name,detail,note,compare);teachingBody.append(row);
    }
  }else{
    status.textContent=partyBest.length?'Best recorded party moves:':'No usable damaging moves recorded for your party.';
    partyBest.forEach((x,i)=>renderChoice(x,output,i===0?'⭐ ':''));
    const section=document.createElement('details');section.className='raid-group raid-box-options';
    const summary=document.createElement('summary');summary.textContent='📦 Options from Your Box';
    const content=document.createElement('div');content.className='raid-box-content';
    section.append(summary,content);output.append(section);
    const options=bestPerPokemon(ranked.filter(x=>box.includes(x.p))).slice(0,5);
    if(!options.length){
      const p=document.createElement('p');p.className='hint';
      p.textContent='No boxed Pokémon with recorded damaging moves for this matchup.';
      content.append(p);
    }
    const strongest=partyBest[0]?.score||0;
    for(const x of options){
      const ready=!!x.level&&x.level>=(partyBest[0]?.level||40)-5;
      const prefix=x.score>strongest*1.1?'⭐ Stronger estimate · ':ready?'⚔️ Alternative · ':'🌱 Worth training · ';
      const card=renderChoice(x,content,prefix);
      addBoxLink(card);
    }
  }
  const note=document.createElement('p');note.className='hint';
  note.textContent='Unknown species and ability: type-based estimates only. Levitate and other ability immunities may change the result.';
  output.append(note);
}
raidFirst.addEventListener('change',refreshRaidMatchup);
raidSecond.addEventListener('change',refreshRaidMatchup);
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));
  $('lookup').hidden=b.dataset.tab!=='lookup';
  $('raid').hidden=b.dataset.tab!=='raid';
  if(b.dataset.tab==='raid')refreshRaidMatchup();
  $('team').hidden=b.dataset.tab!=='team';
  $('bank').hidden=b.dataset.tab!=='bank';
  $('profile').hidden=true;
  if(b.dataset.tab==='bank')renderMachineBank();
});
renderTeam();fetch('https://pokeapi.co/api/v2/pokemon?limit=1025').then(r=>r.json()).then(d=>allNames=d.results.map(x=>x.name)).catch(()=>{});

// Theme is device-local, just like the team and game selector.
const themeSelect=$('theme');
function setTheme(mode){const chosen=mode==='cozy'?'cozy':'battle';document.documentElement.dataset.theme=chosen;themeSelect.value=chosen;localStorage.setItem('battleBuddyTheme',chosen)}
setTheme(localStorage.getItem('battleBuddyTheme')||'battle');
themeSelect.addEventListener('change',()=>setTheme(themeSelect.value));

// Compact settings dialog; both preferences continue using their original localStorage keys.
const settingsDialog=$('settingsDialog'), settingsToggle=$('settingsToggle'), settingsClose=$('settingsClose');
function toggleSettings(open){settingsDialog.hidden=!open;settingsToggle.setAttribute('aria-expanded',String(open));if(open)settingsClose.focus();else settingsToggle.focus()}
settingsToggle.addEventListener('click',()=>toggleSettings(true));
settingsClose.addEventListener('click',()=>toggleSettings(false));
settingsDialog.addEventListener('click',e=>{if(e.target===settingsDialog)toggleSettings(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsDialog.hidden)toggleSettings(false)});

// v0.6: editable, device-local Pokémon profiles.
let editingRecordId=null;
const cleanText=value=>String(value??'').trim();
function showTeamTab(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team'));
  $('lookup').hidden=true;$('raid').hidden=true;$('team').hidden=false;$('bank').hidden=true;$('profile').hidden=true;
}
async function openProfile(recordId){
  const p=[...team,...box].find(x=>x.recordId===recordId);if(!p)return;
  editingRecordId=recordId;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team'));
  $('lookup').hidden=true;$('raid').hidden=true;$('team').hidden=true;$('bank').hidden=true;$('profile').hidden=false;
  $('profileArt').src=p.artwork||'';$('profileArt').alt=title(p.name);
  $('profileName').textContent=p.gender==='female'&&p.name==='jellicent-male'?'Jellicent Female':title(p.name);
  $('profileDex').textContent='#'+String(p.id).padStart(3,'0');
  $('profileTypes').innerHTML=p.types.map(pill).join('');
  $('profileNickname').value=p.nickname||'';
  $('profileLevel').value=p.level??'';
  $('profileAbility').value=p.ability||'';
  natureSelect.value=NATURES[p.nature]?p.nature:'';updateNatureHint();
  $('profileHeldItem').value=p.heldItem||'';
  $('profilePokerus').value=['unknown','never','active','cured'].includes(p.pokerus)?p.pokerus:'unknown';
  document.querySelectorAll('.profile-move').forEach((input,i)=>input.value=p.moves?.[i]||'');
  refreshProfileMoveBadges(recordId);
  $('profileStatus').textContent='';
  resetLearnMoveHelper();
  loadEvolution(p,recordId);
  loadMoveImprovements(p,recordId);
  $('abilitySuggestions').replaceChildren();$('moveSuggestions').replaceChildren();
  window.scrollTo(0,0);
  const openedId=recordId;
  try{
    const details=await api('pokemon/'+p.name);
    if(editingRecordId!==openedId||$('profile').hidden)return;
    const fill=(id,values)=>{const list=$(id);for(const value of [...new Set(values)]){const opt=document.createElement('option');opt.value=title(value);list.append(opt)}};
    fill('abilitySuggestions',details.abilities.map(x=>x.ability.name));
    fill('moveSuggestions',details.moves.map(x=>x.move.name));
  }catch(e){ /* Manual entry remains available offline. */ }
}
$('backToTeam').addEventListener('click',()=>{editingRecordId=null;showTeamTab();window.scrollTo(0,0)});
$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  const p=[...team,...box].find(x=>x.recordId===editingRecordId);if(!p){showTeamTab();return}
  const levelText=$('profileLevel').value.trim();
  const level=levelText===''?null:Number(levelText);
  if(level!==null&&(!Number.isInteger(level)||level<1||level>100)){
    $('profileStatus').textContent='Level must be between 1 and 100.';return;
  }
  p.nickname=cleanText($('profileNickname').value);
  p.level=level;
  p.ability=cleanText($('profileAbility').value);
  p.nature=NATURES[natureSelect.value]?natureSelect.value:'';
  p.heldItem=cleanText($('profileHeldItem').value);
  p.pokerus=$('profilePokerus').value;
  p.moves=[...document.querySelectorAll('.profile-move')].map(x=>cleanText(x.value));
  save();$('profileStatus').textContent='Saved on this device ✓';
  resetLearnMoveHelper();
  refreshProfileMoveBadges(editingRecordId);
  loadEvolution(p,editingRecordId);
});

// v0.6.1: update checks use a fresh HTML request, not cached JS.
// Existing localStorage data (team, game, theme) is never cleared.
const APP_VERSION='1.17.2';
let updateChecking=false,updateAvailable=false,lastUpdateCheck=0;
async function checkForUpdates(manual=false){
  if(updateChecking)return;
  if(!manual && Date.now()-lastUpdateCheck<30000)return;
  updateChecking=true;lastUpdateCheck=Date.now();
  const status=$('updateStatus'),button=$('checkUpdates');
  if(manual){status.textContent='Checking for updates…';button.disabled=true}
  try{
    const url=new URL(window.location.href);
    url.searchParams.set('_bb_check',String(Date.now()));
    const response=await fetch(url.toString(),{cache:'no-store',redirect:'follow'});
    if(!response.ok)throw Error('Update check failed');
    const markup=await response.text();
    const doc=new DOMParser().parseFromString(markup,'text/html');
    const latest=doc.querySelector('meta[name="battle-buddy-version"]')?.content;
    if(latest && latest!==APP_VERSION){
      updateAvailable=true;$('updateBanner').hidden=false;
      status.textContent='Version '+latest+' is available.';
    }else if(latest===APP_VERSION){
      if(manual)status.textContent='You have the latest version.';
    }else if(manual)status.textContent='Could not determine the latest version. Try again shortly.';
  }catch(e){if(manual)status.textContent='Unable to check. Verify your connection and try again.'}
  finally{updateChecking=false;button.disabled=false}
}
$('checkUpdates').addEventListener('click',()=>checkForUpdates(true));
$('applyUpdate').addEventListener('click',()=>{
  // Navigate to a fresh document; query value bypasses stale document caches.
  const url=new URL(window.location.href);
  url.searchParams.set('_bb_refresh',String(Date.now()));
  window.location.replace(url.toString());
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdates()});
window.addEventListener('pageshow',()=>checkForUpdates());

// v0.6.2: portable backups. Never clear device storage during an app update.
function backupPayload(){
  return {format:'pokemon-battle-buddy-backup',schemaVersion:3,exportedAt:new Date().toISOString(),
    team,box,machineBanks,game:localStorage.getItem('battleBuddyGame')||'shield',
    theme:localStorage.getItem('battleBuddyTheme')||'battle'};
}
$('exportTeam').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(backupPayload(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download='battle-buddy-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('backupStatus').textContent='Backup prepared. Save the JSON file somewhere safe, such as iCloud Drive.';
});
$('importTeam').addEventListener('click',()=>$('backupFile').click());
$('backupFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  const status=$('backupStatus');
  try{
    if(file.size>1024*1024)throw Error('Backup is too large.');
    const data=JSON.parse(await file.text());
    if(data.format!=='pokemon-battle-buddy-backup'||![1,2,3].includes(data.schemaVersion))throw Error('This is not a supported Battle Buddy backup.');
    if(!Array.isArray(data.team)||data.team.length>6|| (data.schemaVersion===2&&(!Array.isArray(data.box)||data.box.length>500)))throw Error('Backup contains an invalid party or Box.');
    const validTypes=Object.keys(colors);
    const restoreRecords=records=>records.map(p=>{
      if(!p||!Number.isInteger(p.id)||p.id<1||p.id>100000||
         typeof p.name!=='string'||!(/^[a-z0-9-]{1,80}$/).test(p.name)||
         !Array.isArray(p.types)||p.types.length<1||p.types.length>2||
         !p.types.every(t=>validTypes.includes(t))||
         (p.artwork!=null&&(typeof p.artwork!=='string'||!/^https:\/\//.test(p.artwork)))||
         (p.moves!=null&&(!Array.isArray(p.moves)||p.moves.length>4||
           !p.moves.every(m=>typeof m==='string'&&m.length<=60))))
        throw Error('Backup contains an invalid Pokémon record.');
      return {recordId:typeof p.recordId==='string'&&p.recordId.length<=100?p.recordId:newPokemonId(),id:p.id,name:p.name,types:p.types,artwork:p.artwork||'',
        nickname:typeof p.nickname==='string'?p.nickname.slice(0,40):'',
        level:Number.isInteger(p.level)&&p.level>=1&&p.level<=100?p.level:null,
        ability:typeof p.ability==='string'?p.ability.slice(0,100):'',
        heldItem:typeof p.heldItem==='string'?p.heldItem.slice(0,100):'',
        pokerus:['unknown','never','active','cured'].includes(p.pokerus)?p.pokerus:'unknown',
        moves:(p.moves||[]).slice(0,4),tags:[]};
    });
    const restored=restoreRecords(data.team);
    const restoredBox=restoreRecords(data.schemaVersion>=2?data.box:[]);
    ensureRecordIds([...restored,...restoredBox]);
    const importedBanks=data.schemaVersion===3?validateMachineBanks(data.machineBanks):{};
    const allowedGames=['shield','sword','lets-go-pikachu','lets-go-eevee','legends-za'];
    if(!allowedGames.includes(data.game)||!['battle','cozy'].includes(data.theme))throw Error('Backup settings are invalid.');
    if(!confirm('Replace your current party and Box with '+restored.length+' party Pokémon and '+restoredBox.length+' boxed Pokémon from this backup?')){status.textContent='Import cancelled.';return}
    // Write only after the entire backup has been checked and confirmed.
    localStorage.setItem('battleBuddyTeam',JSON.stringify(restored));
    localStorage.setItem('battleBuddyBox',JSON.stringify(restoredBox));
    localStorage.setItem('battleBuddyMachineBanks',JSON.stringify(importedBanks));
    localStorage.setItem('battleBuddyGame',data.game);
    team=restored;box=restoredBox;machineBanks=importedBanks;game=data.game;$('game').value=game;updateGameLabel();
    setTheme(data.theme);renderTeam();editingRecordId=null;
    status.textContent='Restored your party, Box, TM/TR bank, and preferences.';
  }catch(error){status.textContent='Import failed: '+error.message}
  finally{event.target.value=''}
});

// v0.7: rank known damaging moves against the currently selected opponent.
// This is a heuristic, not a battle damage calculator; it excludes stat/ability effects.
const advisorMoveCache=new Map();
let advisorRun=0;
function normalizeMoveName(name){return String(name||'').trim().toLowerCase().replace(/\s+/g,'-')}
async function moveInfo(name){
  const key=normalizeMoveName(name);
  if(!key)return null;
  if(!advisorMoveCache.has(key)){
    const request=api('move/'+encodeURIComponent(key)).catch(()=>null);
    advisorMoveCache.set(key,request);
  }
  return advisorMoveCache.get(key);
}
// Ability-aware matchup: only apply a species ability automatically when
// all non-hidden standard abilities agree. Otherwise leave ability unconfirmed.
const abilityImmunities={
  'levitate':['ground'],'water-absorb':['water'],'storm-drain':['water'],
  'dry-skin':['water'],'volt-absorb':['electric'],'lightning-rod':['electric'],
  'motor-drive':['electric'],'flash-fire':['fire'],'sap-sipper':['grass'],
  'earth-eater':['ground'],'well-baked-body':['fire']
};
const opponentAbilityCache=new Map();
let opponentAbilityInfo=null,opponentLookupRun=0;
async function resolveOpponentAbilities(pokemon){
  const names=pokemon.abilities.filter(a=>!a.is_hidden).map(a=>a.ability.name);
  const unique=[...new Set(names)];
  const guaranteed=unique.length===1?unique[0]:null;
  return {guaranteed,possible:unique,known:unique.length===1};
}
function abilityAdjustedEffectiveness(moveType,types,abilityInfo){
  const raw=types.reduce((n,t)=>n*(rules[moveType]?.[t]??1),1);
  const ability=abilityInfo?.guaranteed;
  const blocked=!!ability&&abilityImmunities[ability]?.includes(moveType);
  const uncertain=!blocked&&!ability&&abilityInfo?.possible?.some(a=>abilityImmunities[a]?.includes(moveType));
  return {raw,effective:blocked?0:raw,blocked,uncertain,ability};
}
async function refreshMoveAdvisor(opponentTypes){
  const run=++advisorRun,status=$('advisorStatus');
  $('battlePicks').hidden=true;$('battlePickResults').replaceChildren();
  const sections=Object.fromEntries(matchupGroups.map(([key])=>[key,$('advisor-'+key)]));
  Object.values(sections).forEach(section=>section?.replaceChildren());
  const entries=team.flatMap((pokemon,index)=>(Array.isArray(pokemon.moves)?pokemon.moves:[])
    .filter(name=>typeof name==='string'&&name.trim())
    .map(name=>({pokemon,index,name})));
  if(!team.length){status.textContent='Add Pokémon to My Team to get move recommendations.';return}
  if(!entries.length){status.textContent='Edit your team profiles to record moves and see recommendations here.';return}
  status.textContent='Checking your team’s moves…';
  const details=await Promise.all(entries.map(async entry=>({...entry,move:await moveInfo(entry.name)})));
  if(run!==advisorRun)return;
  const ranked=details.flatMap(({pokemon,index,name,move})=>{
    if(!move||!move.type||!Number.isFinite(move.power)||move.power<=0||move.damage_class?.name==='status')return [];
    const type=move.type.name;
    const check=abilityAdjustedEffectiveness(type,opponentTypes,opponentAbilityInfo);
    const effectiveness=check.effective;
    const stab=pokemon.types.includes(type)?1.5:1;
    const accuracy=move.accuracy==null?1:Math.max(0,Math.min(100,move.accuracy))/100;
    const attackStat=move.damage_class?.name==='physical'?'attack':'special-attack';
    const score=move.power*expectedHits(move)*effectiveness*stab*accuracy*natureMultiplier(pokemon.nature,attackStat);
    return [{pokemon,index,name:move.name||name,type,power:move.power,effectiveness,rawEffectiveness:check.raw,blocked:check.blocked,uncertain:check.uncertain,ability:check.ability,stab,accuracy:move.accuracy,score,damageClass:move.damage_class?.name||'unknown'}];
  }).sort((a,b)=>b.score-a.score);
  if(!ranked.length){status.textContent='No damaging moves could be evaluated. Status moves are excluded; check your move names or internet connection.';return}
  renderBattlePicks(opponentTypes,ranked.filter(x=>x.effectiveness>0),run);
  const failed=details.filter(x=>!x.move).length;
  status.textContent=failed?failed+' move(s) could not be found.':'';
  const blocked=ranked.filter(x=>x.blocked);
  if(blocked.length)status.textContent+=(status.textContent?' ':'')+'⚠️ '+title(opponentAbilityInfo.guaranteed)+' blocks '+[...new Set(blocked.map(x=>title(x.type)))].join(', ')+' moves.';
  const categoryFor=value=>value>1?'super':value===1?'neutral':value===0?'immune':'resisted';
  matchupGroups.forEach(([key])=>{
    const section=sections[key];
    if(!section)return;
    const candidates=ranked.filter(item=>categoryFor(item.effectiveness)===key);
    if(!candidates.length)return;
    const heading=document.createElement('h4');heading.className='category-moves-title';
    heading.textContent='⚔️ Your team’s moves ('+candidates.length+')';section.append(heading);
    candidates.forEach((item,i)=>{
      const card=document.createElement('div');card.className='advisor-card'+(i>=2?' advisor-extra':'');
      const name=document.createElement('strong');
      name.textContent=(i===0&&key==='super'?'⭐ ':'')+
        (item.pokemon.nickname||title(item.pokemon.name))+' — '+title(item.name);
      const meta=document.createElement('p');meta.className='hint';
      meta.textContent=title(item.type)+' · '+title(item.damageClass)+' · Power '+item.power+
        ' · Type ×'+item.effectiveness+(item.stab>1?' · STAB ×1.5':'')+
        ' · Accuracy '+(item.accuracy==null?'—':item.accuracy+'%')+
        (item.blocked?' · '+title(item.ability)+' immunity (typing ×'+item.rawEffectiveness+')':item.uncertain?' · Possible ability immunity':'');
      const risk=document.createElement('p');risk.className='battle-risk';risk.textContent=defensiveRiskLabel(item.pokemon,opponentTypes);
      card.append(name,meta,risk);section.append(card);
    });
    if(candidates.length>2){
      const toggle=document.createElement('button');toggle.type='button';toggle.className='advisor-more';
      toggle.textContent='Show all '+candidates.length+' moves';toggle.setAttribute('aria-expanded','false');
      toggle.addEventListener('click',()=>{
        const expanded=toggle.getAttribute('aria-expanded')!=='true';
        section.classList.toggle('show-all',expanded);toggle.setAttribute('aria-expanded',String(expanded));
        toggle.textContent=expanded?'Show fewer moves':'Show all '+candidates.length+' moves';
      });
      section.append(toggle);
    }
  });
}

// v0.9: informational evolution paths. Profiles never evolve automatically.
let evolutionRequest=0;
function evolutionRequirement(detail){
  if(!detail)return 'Evolution requirement varies';
  const trigger=detail.trigger?.name||'unknown';
  const parts=[];
  if(detail.min_level!=null)parts.push('Level '+detail.min_level);
  if(detail.min_happiness!=null)parts.push('Friendship '+detail.min_happiness+'+');
  if(detail.min_affection!=null)parts.push('Affection '+detail.min_affection+'+');
  if(detail.min_beauty!=null)parts.push('Beauty '+detail.min_beauty+'+');
  if(detail.item?.name)parts.push('Use '+title(detail.item.name));
  if(detail.held_item?.name)parts.push('Hold '+title(detail.held_item.name));
  if(detail.time_of_day)parts.push(title(detail.time_of_day));
  if(detail.known_move?.name)parts.push('Know '+title(detail.known_move.name));
  if(detail.known_move_type?.name)parts.push('Know a '+title(detail.known_move_type.name)+' move');
  if(detail.location?.name)parts.push('At '+title(detail.location.name));
  if(detail.gender===1)parts.push('Female');
  if(detail.gender===2)parts.push('Male');
  if(detail.needs_overworld_rain)parts.push('While raining');
  if(detail.party_species?.name)parts.push('With '+title(detail.party_species.name)+' in party');
  if(detail.party_type?.name)parts.push('With '+title(detail.party_type.name)+' type in party');
  if(detail.relative_physical_stats===1)parts.push('Attack > Defense');
  if(detail.relative_physical_stats===-1)parts.push('Defense > Attack');
  if(detail.relative_physical_stats===0)parts.push('Attack = Defense');
  if(detail.turn_upside_down)parts.push('Hold device upside down');
  if(trigger==='trade')parts.unshift('Trade');
  if(trigger==='shed')parts.unshift('Special evolution');
  if(!parts.length)parts.push(trigger==='level-up'?'Level up (special conditions may apply)':title(trigger));
  return parts.join(' · ');
}
async function loadEvolution(p,recordId){
  const request=++evolutionRequest,status=$('evolutionStatus'),path=$('evolutionPath');
  path.replaceChildren();status.textContent='Loading evolution information…';
  try{
    const pokemon=await api('pokemon/'+p.name);
    const species=await api('pokemon-species/'+pokemon.species.name);
    if(!species.evolution_chain?.url)throw Error('No evolution chain available');
    const chainId=species.evolution_chain.url.match(/evolution-chain\/(\d+)/)?.[1];
    if(!chainId)throw Error('Evolution chain unavailable');
    const chain=await api('evolution-chain/'+chainId);
    if(request!==evolutionRequest||editingRecordId!==recordId||$('profile').hidden)return;
    const nodes=[];
    function walk(node,depth=0){
      nodes.push({name:node.species.name,depth,details:node.evolution_details||[]});
      node.evolves_to.forEach(child=>walk(child,depth+1));
    }
    walk(chain.chain);
    status.textContent=nodes.length===1?'This Pokémon has no known evolution.':'Evolution path';
    const currentSpecies=pokemon.species.name;
    for(const node of nodes){
      const row=document.createElement('div');row.className='evolution-step';
      if(node.name===currentSpecies)row.classList.add('current');
      row.style.marginLeft=Math.min(node.depth,3)*12+'px';
      const name=document.createElement('strong');name.textContent=title(node.name)+(node.name===currentSpecies?' · Current':'');
      row.append(name);
      if(node.details.length){
        const details=document.createElement('p');details.className='hint';
        details.textContent=node.details.map(evolutionRequirement).join(' OR ');
        row.append(details);
        if(node.details.some(d=>d.min_level!=null)&&p.level!=null){
          const levels=node.details.filter(d=>d.min_level!=null).map(d=>d.min_level);
          const target=Math.min(...levels);
          const currentIndex=nodes.findIndex(n=>n.name===currentSpecies);
          const targetIndex=nodes.indexOf(node);
          if(targetIndex===currentIndex+1){
            const progress=document.createElement('p');progress.className='evolution-progress';
            progress.textContent=p.level>=target?'Level requirement met!':(target-p.level)+' levels to go';
            row.append(progress);
          }
        }
      }
      path.append(row);
      // Only immediate next evolutions can be applied, not arbitrary stages.
      if(node.depth>0&&node.name!==currentSpecies){
        const parent=nodes.find(n=>n.depth===node.depth-1&&n.name===currentSpecies);
        // Parent verification below uses the actual tree, not flattened branch order.
      }
    }
    function findCurrentNode(node){
      if(node.species.name===currentSpecies)return node;
      for(const child of node.evolves_to){const found=findCurrentNode(child);if(found)return found}
      return null;
    }
    const currentNode=findCurrentNode(chain.chain);
    for(const next of currentNode?.evolves_to||[]){
      const button=document.createElement('button');
      button.type='button';button.className='evolution-action';
      button.textContent='Evolve to '+title(next.species.name);
      button.addEventListener('click',()=>evolvePokemon(recordId,next.species.name));
      path.append(button);
    }
    const note=document.createElement('p');note.className='hint';
    note.textContent='Evolution requirements may vary by game or regional form. Your Pokémon will not change automatically.';
    path.append(note);
  }catch(e){
    if(request!==evolutionRequest||editingRecordId!==recordId)return;
    status.textContent='Evolution information unavailable. Check your internet connection.';
  }
}

async function evolvePokemon(recordId,nextSpecies){
  const p=[...team,...box].find(x=>x.recordId===recordId);
  if(!p||editingRecordId!==recordId)return;
  if(!confirm('Evolve '+(p.nickname||title(p.name))+' into '+title(nextSpecies)+'? Your recorded moves and other details will be kept.'))return;
  const status=$('evolutionStatus');
  status.textContent='Loading evolved Pokémon…';
  try{
    // Recheck that the chosen evolution is an immediate successor of this species.
    const currentData=await api('pokemon/'+p.name);
    const species=await api('pokemon-species/'+currentData.species.name);
    const chainId=species.evolution_chain?.url.match(/evolution-chain\/(\d+)/)?.[1];
    if(!chainId)throw Error('Evolution data unavailable');
    const chain=await api('evolution-chain/'+chainId);
    function findNode(node){
      if(node.species.name===currentData.species.name)return node;
      for(const child of node.evolves_to){const found=findNode(child);if(found)return found}
      return null;
    }
    const node=findNode(chain.chain);
    if(!node?.evolves_to.some(child=>child.species.name===nextSpecies))throw Error('Not a direct evolution');
    const evolved=await api('pokemon/'+nextSpecies);
    if(editingRecordId!==recordId)return;
    const types=evolved.types.slice().sort((a,b)=>a.slot-b.slot).map(x=>x.type.name);
    const artwork=evolved.sprites.other?.['official-artwork']?.front_default||evolved.sprites.front_default||'';
    // Keep the same individual record and all user-entered profile data.
    // Ability is retained for review: evolution may change ability availability.
    const oldName=p.name;
    p.id=evolved.id;p.name=evolved.name;p.types=types;p.artwork=artwork;
    save();
    $('profileArt').src=artwork;$('profileArt').alt=title(p.name);
    $('profileName').textContent=title(p.name);
    $('profileDex').textContent='#'+String(p.id).padStart(3,'0');
    $('profileTypes').innerHTML=types.map(pill).join('');
    $('profileStatus').textContent=title(oldName)+' evolved into '+title(p.name)+'! Check its ability and moves.';
    $('evolutionPath').replaceChildren();
    loadEvolution(p,recordId);
    loadMoveImprovements(p,recordId);
  }catch(error){status.textContent='Could not evolve: '+error.message}
}

// v1.0 Team Analyzer: party-only defensive and offensive type coverage.
let analyzerRun=0;
function analyzerSection(titleText,open=true){
  const section=document.createElement('details');section.className='analyzer-section';section.open=open;
  const summary=document.createElement('summary');summary.textContent=titleText;section.append(summary);
  return section;
}
function analyzerRow(label,detail,kind=''){
  const row=document.createElement('div');row.className='analyzer-row '+kind;
  const strong=document.createElement('strong');strong.textContent=label;
  const small=document.createElement('span');small.textContent=detail;
  row.append(strong,small);return row;
}
$('analyzeTeam').addEventListener('click',async()=>{
  const run=++analyzerRun,results=$('analyzerResults'),status=$('analyzerStatus'),button=$('analyzeTeam');
  results.replaceChildren();$('coverageSuggestions').hidden=true;$('boxRecommendations').hidden=true;
  if(!team.length){status.textContent='Add Pokémon to your party to analyze it.';return}
  button.disabled=true;status.textContent='Analyzing your party…';
  const attackTypes=Object.keys(colors);
  const defensive=attackTypes.map(type=>{
    const members=team.map(p=>({name:p.nickname||title(p.name),
      multiplier:p.types.reduce((n,t)=>n*(rules[type]?.[t]??1),1)}));
    return {type,weak:members.filter(x=>x.multiplier>1),resist:members.filter(x=>x.multiplier>0&&x.multiplier<1),immune:members.filter(x=>x.multiplier===0)};
  });
  const threats=defensive.filter(x=>x.weak.length>=2).sort((a,b)=>b.weak.length-a.weak.length);
  const protection=defensive.filter(x=>x.resist.length+x.immune.length>0)
    .sort((a,b)=>(b.resist.length+b.immune.length)-(a.resist.length+a.immune.length));
  const weakSection=analyzerSection('⚠️ Shared weaknesses ('+threats.length+')');
  if(!threats.length)weakSection.append(analyzerRow('No shared weaknesses','No attack type is super effective against two or more party members.'));
  threats.forEach(x=>weakSection.append(analyzerRow(title(x.type)+' · '+x.weak.length+' weak',
    x.weak.map(m=>m.name+' ×'+m.multiplier).join(', '),'analyzer-weak')));
  results.append(weakSection);
  const defenseSection=analyzerSection('🛡️ Resistances & immunities ('+protection.length+')',false);
  if(!protection.length)defenseSection.append(analyzerRow('No resistances','All attack types deal neutral or greater damage.'));
  protection.forEach(x=>defenseSection.append(analyzerRow(title(x.type),
    [...x.immune.map(m=>m.name+' immune'),...x.resist.map(m=>m.name+' resists')].join(', '))));
  results.append(defenseSection);
  renderBoxRecommendations(run);
  const moveEntries=team.flatMap(p=>(Array.isArray(p.moves)?p.moves:[])
    .filter(m=>typeof m==='string'&&m.trim()).map(name=>({pokemon:p,name})));
  if(!moveEntries.length){
    results.append(analyzerRow('⚔️ Offensive coverage','Record moves in your Pokémon profiles to see coverage.'));
    status.textContent='Defensive analysis ready. Add moves to check offensive coverage.';
    $('coverageSuggestions').hidden=true;
    button.disabled=false;return;
  }
  const details=await Promise.all(moveEntries.map(async entry=>({...entry,move:await moveInfo(entry.name)})));
  if(run!==analyzerRun){button.disabled=false;return}
  const attackMoves=details.filter(x=>x.move?.power>0&&x.move?.damage_class?.name!=='status'&&x.move?.type?.name);
  const covered=attackTypes.map(defender=>{
    const hits=attackMoves.filter(x=>(rules[x.move.type.name]?.[defender]??1)>1);
    return {defender,hits};
  });
  const coverageSection=analyzerSection('⚔️ Offensive coverage ('+covered.filter(x=>x.hits.length).length+'/18)');
  const coveredTypes=covered.filter(x=>x.hits.length);
  if(!coveredTypes.length)coverageSection.append(analyzerRow('No coverage yet','Record damaging moves to calculate offensive coverage.'));
  coveredTypes.forEach(x=>coverageSection.append(analyzerRow(title(x.defender),
    [...new Set(x.hits.map(h=>(h.pokemon.nickname||title(h.pokemon.name))+' · '+title(h.move.name)))].slice(0,3).join(', '))));
  results.append(coverageSection);
  const gaps=covered.filter(x=>!x.hits.length);
  const gapSection=analyzerSection('🔎 Coverage gaps ('+gaps.length+')',false);
  if(!gaps.length)gapSection.append(analyzerRow('All 18 types covered','Your recorded moves can hit every individual type super effectively.'));
  gaps.forEach(x=>gapSection.append(analyzerRow(title(x.defender),'No recorded move is super effective.')));
  results.append(gapSection);
  const failures=details.filter(x=>!x.move).length;
  status.textContent='Party analysis ready.'+(failures?' '+failures+' move(s) could not be checked.':'');
  loadCoverageSuggestions(run,covered.filter(x=>!x.hits.length).map(x=>x.defender));
  button.disabled=false;
});

// v1.1 Sword/Shield machine collection. TR quantities are tracked; no automatic spending.
const MACHINE_NAMES={TM:["Mega Punch","Mega Kick","Pay Day","Fire Punch","Ice Punch","Thunder Punch","Fly","Pin Missile","Hyper Beam","Giga Impact","Magical Leaf","Solar Beam","Solar Blade","Fire Spin","Thunder Wave","Dig","Screech","Light Screen","Reflect","Safeguard","Self-Destruct","Rest","Rock Slide","Thief","Snore","Protect","Scary Face","Icy Wind","Giga Drain","Charm","Steel Wing","Attract","Sandstorm","Rain Dance","Sunny Day","Hail","Whirlpool","Beat Up","Will-O-Wisp","Facade","Swift","Helping Hand","Revenge","Brick Break","Imprison","Dive","Weather Ball","Fake Tears","Rock Tomb","Sand Tomb","Bullet Seed","Icicle Spear","Bounce","Mud Shot","Rock Blast","Brine","U-turn","Payback","Assurance","Fling","Power Swap","Guard Swap","Speed Swap","Drain Punch","Avalanche","Shadow Claw","Thunder Fang","Ice Fang","Fire Fang","Psycho Cut","Trick Room","Wonder Room","Magic Room","Cross Poison","Venoshock","Low Sweep","Round","Hex","Acrobatics","Retaliate","Volt Switch","Bulldoze","Electroweb","Razor Shell","Tail Slap","Snarl","Phantom Force","Draining Kiss","Grassy Terrain","Misty Terrain","Electric Terrain","Psychic Terrain","Mystical Fire","Eerie Impulse","False Swipe","Air Slash","Smart Strike","Brutal Swing","Stomping Tantrum","Breaking Swipe"],TR:["Swords Dance","Body Slam","Flamethrower","Hydro Pump","Surf","Ice Beam","Blizzard","Low Kick","Thunderbolt","Thunder","Earthquake","Psychic","Agility","Focus Energy","Metronome","Fire Blast","Waterfall","Amnesia","Leech Life","Tri Attack","Substitute","Reversal","Sludge Bomb","Spikes","Outrage","Psyshock","Endure","Sleep Talk","Megahorn","Baton Pass","Encore","Iron Tail","Crunch","Shadow Ball","Future Sight","Uproar","Heat Wave","Taunt","Trick","Superpower","Skill Swap","Blaze Kick","Hyper Voice","Overheat","Cosmic Power","Muddy Water","Iron Defense","Dragon Claw","Bulk Up","Calm Mind","Leaf Blade","Dragon Dance","Gyro Ball","Close Combat","Toxic Spikes","Flare Blitz","Aura Sphere","Poison Jab","Dark Pulse","Seed Bomb","X-Scissor","Bug Buzz","Dragon Pulse","Power Gem","Focus Blast","Energy Ball","Brave Bird","Earth Power","Nasty Plot","Zen Headbutt","Flash Cannon","Leaf Storm","Power Whip","Gunk Shot","Iron Head","Stone Edge","Stealth Rock","Grass Knot","Sludge Wave","Heavy Slam","Electro Ball","Foul Play","Stored Power","Ally Switch","Scald","Work Up","Wild Charge","Drill Run","Heat Crash","Hurricane","Play Rough","Venom Drench","Dazzling Gleam","Darkest Lariat","High Horsepower","Throat Chop","Pollen Puff","Psychic Fangs","Liquidation","Body Press"]};
const MACHINE_LIST=['TM','TR'].flatMap(kind=>MACHINE_NAMES[kind].map((name,index)=>({
  key:kind+String(index).padStart(2,'0'),kind,name
})));
function validateMachineBanks(value){
  if(value==null)return {};
  if(typeof value!=='object'||Array.isArray(value))throw Error('Invalid machine bank.');
  const result={};
  for(const [gameKey,entries] of Object.entries(value)){
    if(!['sword','shield'].includes(gameKey)||!entries||typeof entries!=='object'||Array.isArray(entries))throw Error('Invalid machine bank.');
    result[gameKey]={};
    for(const [key,quantity] of Object.entries(entries)){
      if(!/^(TM|TR)\d{2}$/.test(key)||Number(key.slice(2))>99||
        !Number.isInteger(quantity)||quantity<0||quantity>999||
        (key.startsWith('TM')&&quantity>1))throw Error('Invalid TM/TR quantity.');
      if(quantity>0)result[gameKey][key]=quantity;
    }
  }
  return result;
}
let machineBanks;
try{machineBanks=validateMachineBanks(JSON.parse(localStorage.getItem('battleBuddyMachineBanks')||'{}'))}
catch(e){machineBanks={}}
let machineFilter='all';
function saveMachineBank(){localStorage.setItem('battleBuddyMachineBanks',JSON.stringify(machineBanks))}
function renderMachineBank(){
  const supported=game==='sword'||game==='shield';
  $('machineBankControls').hidden=!supported;
  $('machineBankMessage').textContent=supported?'TMs are reusable. TRs are single-use; track how many you own.':'The TM/TR checklist currently supports Sword and Shield only.';
  if(!supported)return;
  const inventory=machineBanks[game]||{};
  const search=$('bankSearch').value.toLowerCase().trim().replace(/\s+/g,'');
  const items=MACHINE_LIST.filter(item=>{
    if(machineFilter==='owned'&&!(inventory[item.key]>0))return false;
    if(machineFilter==='TM'&&item.kind!=='TM')return false;
    if(machineFilter==='TR'&&item.kind!=='TR')return false;
    return !search||item.key.toLowerCase().includes(search)||item.name.toLowerCase().replace(/\s+/g,'').includes(search);
  });
  $('bankCount').textContent=Object.keys(inventory).filter(key=>inventory[key]>0).length+' collected · '+items.length+' shown';
  const container=$('bankItems');container.replaceChildren();
  const fragment=document.createDocumentFragment();
  items.forEach(item=>{
    const row=document.createElement('div');row.className='bank-row';
    const description=document.createElement('label');description.className='bank-description';
    const name=document.createElement('span');name.textContent=item.key+' · '+item.name;
    const badge=document.createElement('span');badge.className='move-type-badge';badge.hidden=true;
    if(item.kind==='TM'){
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!inventory[item.key];
      checkbox.addEventListener('change',()=>{
        machineBanks[game]??={};
        if(checkbox.checked)machineBanks[game][item.key]=1;else delete machineBanks[game][item.key];
        saveMachineBank();renderMachineBank();
      });
      description.append(checkbox,name,badge);row.append(description);
    }else{
      description.append(name,badge);row.append(description);
      const qty=document.createElement('input');qty.type='number';qty.min='0';qty.max='999';qty.step='1';
      qty.value=String(inventory[item.key]||0);qty.inputMode='numeric';
      qty.setAttribute('aria-label',item.key+' quantity');qty.className='bank-quantity';
      qty.addEventListener('change',()=>{
        const value=Number(qty.value);
        if(!Number.isInteger(value)||value<0||value>999){qty.value=String((machineBanks[game]||{})[item.key]||0);return}
        machineBanks[game]??={};
        if(value)machineBanks[game][item.key]=value;else delete machineBanks[game][item.key];
        saveMachineBank();$('bankCount').textContent=Object.keys(machineBanks[game]).length+' collected · '+items.length+' shown';
      });
      row.append(qty);
    }
    fragment.append(row);
    scheduleTypeBadge(item.name,badge);
  });
  container.append(fragment);
}
[['bankAll','all'],['bankTM','TM'],['bankTR','TR'],['bankOwned','owned']].forEach(([id,filter])=>{
  $(id).addEventListener('click',()=>{
    machineFilter=filter;
    ['bankAll','bankTM','bankTR','bankOwned'].forEach(buttonId=>$(buttonId).classList.toggle('active',buttonId===id));
    renderMachineBank();
  });
});
$('bankSearch').addEventListener('input',renderMachineBank);
$('game').addEventListener('change',()=>{if(!$('bank').hidden)renderMachineBank()});

// v1.2: Sword/Shield TM/TR teaching suggestions, limited to owned machines.
const teachingPokemonCache=new Map(),teachingMoveCache=new Map();
let teachingRun=0;
function teachingSupported(){return game==='sword'||game==='shield'}
function ownedMachines(){const inventory=machineBanks[game]||{};return MACHINE_LIST.filter(x=>inventory[x.key]>0)}
function getTeachingPokemon(name){
  if(!teachingPokemonCache.has(name))teachingPokemonCache.set(name,api('pokemon/'+name).catch(()=>null));
  return teachingPokemonCache.get(name);
}
function getTeachingMove(name){
  const key=normalizeMoveName(name);
  if(!teachingMoveCache.has(key))teachingMoveCache.set(key,moveInfo(key));
  return teachingMoveCache.get(key);
}
function canTeachInShield(pokemonData,moveName){
  const key=normalizeMoveName(moveName);
  const entry=pokemonData.moves?.find(x=>x.move.name===key);
  return !!entry?.version_group_details?.some(x=>
    x.version_group.name==='sword-shield'&&x.move_learn_method.name==='machine');
}
async function availableMachineMoves(pokemon){
  const owned=ownedMachines(),data=await getTeachingPokemon(pokemon.name);
  if(!data)return null;
  const compatible=owned.filter(x=>canTeachInShield(data,x.name));
  const moves=await Promise.all(compatible.map(async machine=>{
    const info=await getTeachingMove(machine.name);
    return info?{machine,info}:null;
  }));
  return moves.filter(Boolean);
}
function machineSuggestionRow(entry){
  const row=document.createElement('div');row.className='machine-suggestion';
  const heading=document.createElement('strong');
  heading.textContent=entry.machine.key+' · '+entry.machine.name;
  const meta=document.createElement('span');meta.className='hint';
  const move=entry.info;
  meta.textContent=title(move.type.name)+' · '+(move.power?'Power '+move.power:'Status move')+
    (move.accuracy==null?'':' · '+move.accuracy+'% accuracy')+
    (entry.machine.kind==='TR'?' · Owned: '+(machineBanks[game]?.[entry.machine.key]||0):' · Reusable');
  row.append(heading,meta);
  if(move.type?.name)row.insertBefore(makeTypeBadge(move.type.name),meta);
  return row;
}
async function loadMoveImprovements(p,recordId){
  const run=++teachingRun,status=$('improvementStatus'),results=$('improvementResults');
  results.replaceChildren();
  if(!teachingSupported()){status.textContent='Available for Sword and Shield only.';return}
  if(!ownedMachines().length){status.textContent='Add TMs or TRs to your Bank to see compatible moves.';return}
  status.textContent='Checking your TM/TR collection…';
  const compatible=await availableMachineMoves(p);
  if(run!==teachingRun||editingRecordId!==recordId||$('profile').hidden)return;
  if(compatible===null){status.textContent='Unable to check compatibility. Try again online.';return}
  const known=new Set((p.moves||[]).map(normalizeMoveName));
  const options=compatible.filter(x=>!known.has(normalizeMoveName(x.machine.name)));
  if(!options.length){status.textContent='No additional compatible moves found in your Bank.';return}
  const pokemonData=await getTeachingPokemon(p.name);
  if(run!==teachingRun||editingRecordId!==recordId)return;
  const atk=pokemonData.stats?.find(x=>x.stat.name==='attack')?.base_stat||1;
  const spa=pokemonData.stats?.find(x=>x.stat.name==='special-attack')?.base_stat||1;
  const score=x=>{
    const move=x.info;
    if(!move.power)return 0;
    const statName=move.damage_class.name==='physical'?'attack':'special-attack';
    const stat=(statName==='attack'?atk:spa)*natureMultiplier(p.nature,statName);
    const stab=p.types.includes(move.type.name)?1.5:1;
    const accuracy=move.accuracy==null?1:move.accuracy/100;
    return move.power*stat*stab*accuracy;
  };
  options.sort((a,b)=>score(b)-score(a));
  status.textContent=options.length+' compatible moves you own';
  const visible=options.slice(0,5);
  const renderSuggestion=entry=>{
    const row=machineSuggestionRow(entry);
    const compare=document.createElement('button');compare.type='button';compare.className='compare-move';
    compare.textContent='Compare moves';compare.setAttribute('aria-expanded','false');
    const comparison=document.createElement('div');comparison.className='move-comparison';comparison.hidden=true;
    compare.addEventListener('click',async()=>{
      const expanded=comparison.hidden;
      comparison.hidden=!expanded;compare.setAttribute('aria-expanded',String(expanded));
      compare.textContent=expanded?'Hide comparison':'Compare moves';
      if(!expanded||comparison.dataset.loaded)return;
      comparison.textContent='Comparing known moves…';
      const knownMoves=(p.moves||[]).filter(name=>typeof name==='string'&&name.trim());
      if(!knownMoves.length){comparison.textContent='Record your current moves first to compare.';comparison.dataset.loaded='true';return}
      const info=await Promise.all(knownMoves.map(async name=>({name,move:await getTeachingMove(name)})));
      if(run!==teachingRun||editingRecordId!==recordId)return;
      comparison.replaceChildren();
      const candidate=entry.info;
      const statFor=move=>move.damage_class?.name==='physical'?atk:move.damage_class?.name==='special'?spa:0;
      const estimate=move=>move?.power>0?move.power*statFor(move)*(p.types.includes(move.type.name)?1.5:1)*(move.accuracy==null?1:move.accuracy/100):0;
      const candidateScore=estimate(candidate);
      const comparable=info.filter(x=>x.move?.power>0&&x.move?.damage_class?.name!=='status');
      const existingTypes=new Set(info.filter(x=>x.move?.power>0).map(x=>x.move.type.name));
      const candidateType=candidate.type?.name;
      const bestReplace=comparable.slice().sort((a,b)=>{
        const penalty=x=>info.filter(y=>y!==x&&y.move?.power>0&&y.move.type.name===x.move.type.name).length?0:1;
        return (estimate(a.move)-estimate(b.move))||penalty(a)-penalty(b);
      })[0];
      const header=document.createElement('strong');header.textContent='Your current moves';comparison.append(header);
      info.forEach(({name,move})=>{
        const line=document.createElement('p');line.className='hint';
        line.textContent=title(name)+(move?.power?' · '+title(move.type.name)+' · Power '+move.power+' · '+title(move.damage_class.name):' · Status / unavailable');
        comparison.append(line);
        if(move?.type?.name)line.prepend(makeTypeBadge(move.type.name));
      });
      const advice=document.createElement('p');advice.className='comparison-advice';
      if(!candidate.power||candidate.damage_class?.name==='status'){
        advice.textContent='Status move: compare its effect with your current moves before choosing a replacement.';
      }else if(!bestReplace){
        advice.textContent='No damaging move to compare. Consider whether you want to replace a utility move.';
      }else{
        const replaceScore=estimate(bestReplace.move);
        const uniqueType=!existingTypes.has(candidateType);
        const stronger=candidateScore>replaceScore*1.1;
        advice.textContent=(stronger?'Consider replacing ':'Compare against ')+title(bestReplace.name)+
          (stronger?' · stronger rough damage potential':' · not a clear damage upgrade')+
          (uniqueType?' · adds '+title(candidateType)+' coverage':'')+
          '. Check priority, secondary effects and coverage before deciding.';
      }
      comparison.append(advice);comparison.dataset.loaded='true';
    });
    row.append(compare,comparison);return row;
  };
  visible.forEach(x=>results.append(renderSuggestion(x)));
  if(options.length>5){
    const more=document.createElement('button');more.type='button';more.textContent='Show all '+options.length;
    more.addEventListener('click',()=>{
      if(more.dataset.expanded)return;
      options.slice(5).forEach(x=>results.insertBefore(renderSuggestion(x),more));
      more.dataset.expanded='true';more.remove();
    });results.append(more);
  }
}
let coverageRun=0;
async function loadCoverageSuggestions(analyzerId,gaps){
  const run=++coverageRun,section=$('coverageSuggestions'),status=$('coverageSuggestionStatus'),results=$('coverageSuggestionResults');
  results.replaceChildren();
  if(!teachingSupported()||!ownedMachines().length||!gaps.length){section.hidden=true;return}
  section.hidden=false;status.textContent='Checking teachable moves…';
  const responses=await Promise.all(team.map(async p=>({p,moves:await availableMachineMoves(p)})));
  if(run!==coverageRun||analyzerId!==analyzerRun)return;
  const suggestions=[];
  responses.forEach(({p,moves})=>(moves||[]).forEach(entry=>{
    if(!entry.info.power||entry.info.damage_class?.name==='status')return;
    const covers=gaps.filter(type=>(rules[entry.info.type.name]?.[type]??1)>1);
    if(!covers.length)return;
    const alreadyKnows=(p.moves||[]).some(x=>normalizeMoveName(x)===normalizeMoveName(entry.machine.name));
    if(alreadyKnows)return;
    suggestions.push({p,entry,covers});
  }));
  suggestions.sort((a,b)=>b.covers.length-a.covers.length||((b.entry.info.power||0)-(a.entry.info.power||0)));
  status.textContent=suggestions.length?'Owned moves that could improve your coverage:':'No compatible TM/TR improvements found for the current gaps.';
  suggestions.slice(0,10).forEach(s=>{
    const row=machineSuggestionRow(s.entry);
    const who=document.createElement('span');who.className='hint';
    who.textContent='Teach to '+(s.p.nickname||title(s.p.name))+' · Covers '+s.covers.map(title).join(', ');
    row.append(who);results.append(row);
  });
}

// v1.3.1: type colors for bank and recorded moves.
const typeLookupCache=new Map(),typeLookupQueue=[];let typeLookupActive=0;
function makeTypeBadge(type){
  const badge=document.createElement('span');badge.className='move-type-badge';
  badge.textContent=title(type);badge.style.background=colors[type]||'#91a5b7';return badge;
}
function cachedMoveType(name){
  const key=normalizeMoveName(name);if(!key)return Promise.resolve(null);
  if(!typeLookupCache.has(key))typeLookupCache.set(key,new Promise(resolve=>{
    typeLookupQueue.push({key,resolve});pumpTypeLookup();
  }));
  return typeLookupCache.get(key);
}
function pumpTypeLookup(){
  while(typeLookupActive<5&&typeLookupQueue.length){
    const task=typeLookupQueue.shift();typeLookupActive++;
    moveInfo(task.key).then(data=>task.resolve(data?.type?.name||null))
      .catch(()=>task.resolve(null)).finally(()=>{typeLookupActive--;pumpTypeLookup()});
  }
}
function scheduleTypeBadge(name,badge){
  const key=normalizeMoveName(name);badge.dataset.move=key;
  cachedMoveType(key).then(type=>{
    if(!badge.isConnected||badge.dataset.move!==key)return;
    badge.hidden=!type;
    if(type){badge.textContent=title(type);badge.style.background=colors[type]||'#91a5b7'}
  });
}
function refreshProfileMoveBadges(recordId){
  document.querySelectorAll('.profile-move').forEach(input=>{
    let badge=input.parentElement.querySelector('.move-type-badge');
    if(!badge){badge=document.createElement('span');badge.className='move-type-badge';badge.hidden=true;input.insertAdjacentElement('afterend',badge)}
    const key=normalizeMoveName(input.value);badge.dataset.move=key;badge.hidden=true;
    if(!key)return;
    cachedMoveType(key).then(type=>{
      if(editingRecordId!==recordId||badge.dataset.move!==key)return;
      badge.hidden=!type;
      if(type){badge.textContent=title(type);badge.style.background=colors[type]||'#91a5b7'}
    });
  });
}
document.querySelectorAll('.profile-move').forEach(input=>{
  let timer;
  input.addEventListener('input',()=>{
    // Updating badge visibility during typing changes the form height under
    // iOS's on-screen keyboard. Wait until the field loses focus instead.
    clearTimeout(timer);
  });
  input.addEventListener('blur',()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>refreshProfileMoveBadges(editingRecordId),100);
  });
});

// v1.4: suggest Box-to-Party swaps based on team-wide defensive coverage.
// A swap is suggested only when it improves the aggregate score; no changes are made.

function defensiveMultiplier(pokemon,attackType){
  return pokemon.types.reduce((n,t)=>n*(rules[attackType]?.[t]??1),1);
}
function defenseSummary(members){
  const threats=Object.keys(colors).map(type=>{
    const values=members.map(p=>defensiveMultiplier(p,type));
    return {type,weak:values.filter(v=>v>1).length,
      fourfold:values.filter(v=>v>=4).length,
      protected:values.filter(v=>v>0&&v<1).length,
      immune:values.filter(v=>v===0).length,
      exposed:values.filter(v=>v>1).length>0&&values.every(v=>v>=1)};
  });
  // Penalize weaknesses without switch-ins; reward real immunities and
  // resistances that protect vulnerable teammates.
  const score=threats.reduce((total,x)=>total+
    x.weak*.55+x.fourfold*2.5+
    (x.weak>=2?(x.weak-1)*1.4:0)+
    (x.exposed?2.2:0)-
    (x.weak>0?Math.min(2,x.protected)*.8+Math.min(2,x.immune)*1.5:0)-
    x.immune*.25,0);
  return {threats,score,shared:threats.filter(x=>x.weak>=2).length};
}
function offensiveSummary(members,knownMoves){
  const types=new Set();
  for(const p of members){
    for(const move of knownMoves.get(p.recordId)||[]){
      if(move?.power>0&&move.damage_class?.name!=='status'&&move.type?.name)types.add(move.type.name);
    }
  }
  return new Set(Object.keys(colors).filter(defending=>
    [...types].some(attacking=>(rules[attacking]?.[defending]??1)>1)));
}
// Cached species and stats avoid repeated calls on every team analysis.
const synergySpeciesCache=new Map();
function getSynergySpecies(name){
  if(!synergySpeciesCache.has(name))synergySpeciesCache.set(name,(async()=>{
    const species=await api('pokemon-species/'+name);
    const chainId=species.evolution_chain?.url.match(/evolution-chain\/(\d+)/)?.[1];
    if(chainId){
      const chain=await api('evolution-chain/'+chainId);
      function find(node){
        if(node.species.name===name)return node;
        for(const child of node.evolves_to){const found=find(child);if(found)return found}
        return null;
      }
      species._hasNextEvolution=!!find(chain.chain)?.evolves_to?.length;
    }
    return species;
  })().catch(()=>null));
  return synergySpeciesCache.get(name);
}
function baseStat(pokemon,name){
  return pokemon?.stats?.find(s=>s.stat.name===name)?.base_stat||0;
}
function readinessStats(pokemon){
  if(!pokemon)return null;
  const hp=baseStat(pokemon,'hp'),def=baseStat(pokemon,'defense'),spd=baseStat(pokemon,'special-defense');
  const atk=baseStat(pokemon,'attack'),spa=baseStat(pokemon,'special-attack'),spe=baseStat(pokemon,'speed');
  return {hp,def,spd,atk,spa,spe,bulk:hp*(def+spd)/2,offense:Math.max(atk,spa),total:hp+def+spd+atk+spa+spe};
}
function isUnevolvedSpecies(species){
  // True only when the species has a known next evolution; branch rules
  // and special cases are handled as readiness cautions, not absolute facts.
  return species?._hasNextEvolution===true;
}
async function renderBoxRecommendations(analyzerId){
  const section=$('boxRecommendations'),status=$('boxRecommendationStatus'),
    results=$('boxRecommendationResults');
  results.replaceChildren();
  if(analyzerId!==analyzerRun||!box.length||!team.length){section.hidden=true;return}
  section.hidden=false;status.textContent='Checking levels, stats, moves, and team synergy…';
  const all=[...team,...box];
  const uniqueMoves=[...new Set(all.flatMap(p=>(p.moves||[])
    .filter(m=>typeof m==='string'&&m.trim()).map(normalizeMoveName)))];
  const uniqueSpecies=[...new Set(all.map(p=>p.name))];
  const [loaded,profiles]=await Promise.all([
    Promise.all(uniqueMoves.map(async name=>[name,await moveInfo(name)])),
    Promise.all(uniqueSpecies.map(async name=>{
      const pokemon=await getTeachingPokemon(name);
      const species=pokemon?await getSynergySpecies(pokemon.species.name):null;
      return [name,{pokemon,species,stats:readinessStats(pokemon)}];
    }))
  ]);
  if(analyzerId!==analyzerRun)return;
  const lookup=new Map(loaded),profileMap=new Map(profiles);
  const known=new Map(all.map(p=>[p.recordId,(p.moves||[])
    .map(m=>lookup.get(normalizeMoveName(m))).filter(Boolean)]));
  const baseline=defenseSummary(team),baseOffense=offensiveSummary(team,known);
  const suggestions=[];
  for(const candidate of box){
    const options=team.length<6?[{removed:null,members:[...team,candidate]}]:
      team.map((removed,index)=>({removed,members:team.map((p,i)=>i===index?candidate:p)}));
    for(const option of options){
      const revised=defenseSummary(option.members);
      const newOffense=offensiveSummary(option.members,known);
      const gained=[...newOffense].filter(t=>!baseOffense.has(t));
      const lost=[...baseOffense].filter(t=>!newOffense.has(t));
      const defenseGain=baseline.score-revised.score;
      const sameTypes=option.members.filter(p=>p!==candidate&&
        p.types.some(t=>candidate.types.includes(t))).length;
      const oldSameTypes=option.removed?team.filter(p=>p!==option.removed&&
        p.types.some(t=>option.removed.types.includes(t))).length:0;
      const redundancyChange=sameTypes-oldSameTypes;
      const synergyGain=defenseGain+gained.length*1.3-lost.length*2.1-redundancyChange*.5;
      if(synergyGain<2.5)continue;
      const cProfile=profileMap.get(candidate.name),rProfile=option.removed&&profileMap.get(option.removed.name);
      const cStats=cProfile?.stats,rStats=rProfile?.stats;
      const candidateLevel=Number(candidate.level)||null,removedLevel=Number(option.removed?.level)||null;
      const levelGap=candidateLevel&&removedLevel?removedLevel-candidateLevel:null;
      const bulkRatio=cStats&&rStats&&rStats.bulk?cStats.bulk/rStats.bulk:null;
      const offenseRatio=cStats&&rStats&&rStats.offense?cStats.offense/rStats.offense:null;
      const candidateEvolving=isUnevolvedSpecies(cProfile?.species);
      const removedEvolving=isUnevolvedSpecies(rProfile?.species);
      const underleveled=levelGap!=null&&levelGap>=8;
      const fragile=bulkRatio!=null&&bulkRatio<.7;
      const weakerOffense=offenseRatio!=null&&offenseRatio<.7;
      const unevolvedDisadvantage=!!option.removed&&candidateEvolving&&!removedEvolving;
      const abilityWarning=!!option.removed&&/^(huge power|pure power)$/i.test(option.removed.ability||'');
      // Flag meaningful, known defensive abilities rather than pretending
      // to model their exact impact in the generic type score.
      const abilityReview=option.removed&&/^(levitate|water absorb|volt absorb|flash fire|storm drain|sap sipper|dry skin|lightning rod|motor drive)$/i.test(option.removed.ability||'');
      const missingLevel=!!option.removed&&(!candidateLevel||!removedLevel);
      const missingStats=!!option.removed&&(!cStats||!rStats);
      const missingMoves=!(candidate.moves||[]).some(m=>typeof m==='string'&&m.trim());
      const penalties=(underleveled?2.5:0)+(fragile?2.5:0)+(weakerOffense?1.2:0)+
        (unevolvedDisadvantage?2:0)+(abilityWarning?3:0)+(abilityReview?1:0);
      const overall=synergyGain-penalties;
      const ready=overall>=2.5&&!underleveled&&!fragile&&!unevolvedDisadvantage&&
        !abilityWarning&&!missingLevel&&!missingStats&&!missingMoves;
      if(overall<1&&!ready)continue;
      const improved=baseline.threats.filter(old=>{
        const newer=revised.threats.find(t=>t.type===old.type);
        return (old.weak>=2&&newer.weak<old.weak)||
          (old.exposed&&!newer.exposed)||newer.fourfold<old.fourfold;
      }).map(x=>title(x.type));
      const worsened=baseline.threats.filter(old=>{
        const newer=revised.threats.find(t=>t.type===old.type);
        return newer.weak>old.weak||(!old.exposed&&newer.exposed)||newer.fourfold>old.fourfold;
      }).map(x=>title(x.type));
      suggestions.push({candidate,removed:option.removed,overall,ready,improved,worsened,
        gained:gained.map(title),lost:lost.map(title),levelGap,bulkRatio,offenseRatio,
        underleveled,fragile,weakerOffense,unevolvedDisadvantage,abilityWarning,abilityReview,
        missingLevel,missingStats,missingMoves});
    }
  }
  suggestions.sort((a,b)=>b.overall-a.overall);
  const seen=new Set(),ready=[],training=[];
  for(const s of suggestions){
    if(seen.has(s.candidate.recordId))continue;
    seen.add(s.candidate.recordId);
    (s.ready?ready:training).push(s);
  }
  const top=[...ready.slice(0,3),...training.slice(0,Math.max(0,3-ready.length))];
  status.textContent=top.length?'Potential swaps, with readiness considered:':
    'No worthwhile Box swap identified with your current recorded information.';
  for(const s of top){
    const row=document.createElement('div');row.className='box-recommendation';
    const img=document.createElement('img');img.src=s.candidate.artwork||'';img.alt='';
    const body=document.createElement('div');body.className='box-recommendation-body';
    const name=document.createElement('strong');
    name.textContent=(s.ready?'⚔️ Ready to Swap · ':'🌱 Worth Training · ')+
      (s.candidate.nickname||title(s.candidate.name));
    const swap=document.createElement('p');swap.textContent=s.removed?
      'Compare with '+(s.removed.nickname||title(s.removed.name)):
      'Open party slot available';
    body.append(name,swap);
    function line(message){
      const p=document.createElement('p');p.className='hint';p.textContent=message;body.append(p);
    }
    if(s.improved.length)line('Defensive improvements: '+s.improved.join(', '));
    if(s.gained.length)line('Adds move coverage against: '+s.gained.join(', '));
    if(s.worsened.length)line('Trade-off: greater risk from '+s.worsened.join(', '));
    if(s.lost.length)line('Loses move coverage against: '+s.lost.join(', '));
    if(s.levelGap!=null)line('Level comparison: '+(s.levelGap>0?s.levelGap+' levels lower':s.levelGap<0?Math.abs(s.levelGap)+' levels higher':'same level'));
    if(s.fragile)line('⚠️ Significantly lower base defensive bulk.');
    if(s.weakerOffense)line('⚠️ Lower base attacking potential.');
    if(s.unevolvedDisadvantage)line('⚠️ Still has an evolution; replacement does not.');
    if(s.abilityWarning||s.abilityReview)line('⚠️ Review '+s.removed.ability+' on the current party member.');
    if(s.missingLevel||s.missingStats||s.missingMoves)line('⚠️ Incomplete level, stats, or recorded moves; readiness is uncertain.');
    const action=document.createElement('button');action.type='button';
    action.textContent='View in Box';action.addEventListener('click',()=>{
      showCollection('box');$('boxCards').scrollIntoView({behavior:'smooth',block:'start'});
    });
    body.append(action);row.append(img,body);results.append(row);
  }
  const note=document.createElement('p');note.className='hint';
  note.textContent='Readiness uses recorded levels, species base stats, and moves. IVs, EVs, natures, and most ability effects are not modeled.';
  results.append(note);
}


// v1.4.1: add a Pokémon directly to the Box without visiting Lookup.
let boxPreview=null,boxSearchRun=0;
async function previewBoxPokemon(name,manual=false){
  $('editQuickBoxPokemon').hidden=true;
  const run=++boxSearchRun,status=$('boxAddStatus');
  $('boxAddPreview').hidden=true;boxPreview=null;
  $('boxPokemonSuggestions').hidden=true;
  name=String(name||'').toLowerCase().trim().replace(/\s+/g,'-');
  if(!name)return;
  if(!manual&&!/-(galar|alola|hisui)$/.test(name))name=preferredName(name);
  status.textContent='Finding Pokémon…';
  try{
    const p=await api('pokemon/'+encodeURIComponent(name));
    if(run!==boxSearchRun)return;
    const types=p.types.slice().sort((a,b)=>a.slot-b.slot).map(x=>x.type.name);
    const artwork=p.sprites.other?.['official-artwork']?.front_default||p.sprites.front_default||'';
    boxPreview={id:p.id,name:p.name,types,artwork,ability:null,moves:[],heldItem:null,pokerus:'unknown',tags:[]};
    $('boxPreviewName').textContent=title(p.name);
    $('boxPreviewArt').src=artwork;
    $('boxPreviewArt').alt=title(p.name);
    $('boxPreviewTypes').innerHTML=types.map(pill).join('');
    $('boxPreviewForms').replaceChildren();
    $('boxAddPreview').hidden=false;status.textContent='';
    try{
      const species=await api('pokemon-species/'+p.species.name);
      if(run!==boxSearchRun)return;
      const forms=species.varieties.filter(x=>x.is_default||/(galar|alola|hisui)/.test(x.pokemon.name));
      if(forms.length>1){
        for(const form of forms){
          const button=document.createElement('button');button.type='button';
          button.textContent=title(form.pokemon.name);
          button.className=form.pokemon.name===p.name?'selected-form':'';
          button.addEventListener('click',()=>previewBoxPokemon(form.pokemon.name,true));
          $('boxPreviewForms').append(button);
        }
      }
    }catch(e){ /* Form switching is optional. */ }
  }catch(e){if(run===boxSearchRun)status.textContent='Pokémon not found. Check the name and try again.'}
}
$('boxAddForm').addEventListener('submit',e=>{e.preventDefault();previewBoxPokemon($('boxPokemonSearch').value)});
$('boxPokemonSearch').addEventListener('input',()=>{
  const q=$('boxPokemonSearch').value.toLowerCase().trim();
  const suggestions=$('boxPokemonSuggestions');suggestions.replaceChildren();
  if(!q||!allNames.length){suggestions.hidden=true;return}
  const matches=allNames.filter(name=>name.includes(q)).slice(0,6);
  for(const name of matches){
    const button=document.createElement('button');button.type='button';button.textContent=title(name);
    button.addEventListener('click',()=>{$('boxPokemonSearch').value=title(name);previewBoxPokemon(name)});
    suggestions.append(button);
  }
  suggestions.hidden=!matches.length;
});
$('confirmBoxAdd').addEventListener('click',()=>{
  if(!boxPreview)return;
  const added={...boxPreview,recordId:newPokemonId()};
  box.push(added);
  save();
  $('editQuickBoxPokemon').hidden=false;
  $('editQuickBoxPokemon').onclick=()=>openProfile(added.recordId);
  $('boxAddStatus').textContent=title(boxPreview.name)+' added to your Box.';
  $('boxAddPreview').hidden=true;$('boxPokemonSearch').value='';boxPreview=null;
});

// v1.5: choose a new move and confirm which existing move to forget.
let learnMoveRun=0,learnMoveCandidate=null;
function resetLearnMoveHelper(){
  ++learnMoveRun;learnMoveCandidate=null;
  $('learnMoveName').value='';$('learnMoveStatus').textContent='';
  $('confirmLearnMove').textContent='Learn This Move';
  $('learnMoveResults').hidden=true;$('learnMoveSummary').replaceChildren();
  $('learnMoveOptions').replaceChildren();$('forgetMove').replaceChildren();
}
// Estimates for comparisons only; multi-hit and utility moves need special treatment.
function expectedHits(move){
  const min=move?.meta?.min_hits,max=move?.meta?.max_hits;
  if(!min||!max)return 1;
  if(min===max)return min;
  if(min===2&&max===5)return 3.1; // Approximate average, not guaranteed.
  return (min+max)/2;
}
// Identify major drawbacks before ranking moves by damage.
function moveDrawbacks(move){
  if(!move)return [];
  const name=move.name||'',meta=move.meta||{},flags=[];
  if(['self-destruct','explosion','misty-explosion','final-gambit','memento','healing-wish','lunar-dance'].includes(name)||meta.category?.name==='damage+heal'&&meta.healing===-100)
    flags.push('User faints after use');
  if(meta.drain<0||['take-down','double-edge','flare-blitz','brave-bird','wood-hammer','head-smash','wild-charge','volt-tackle','submission'].includes(name))
    flags.push('Recoil damage');
  if(['hyper-beam','giga-impact','blast-burn','frenzy-plant','hydro-cannon','rock-wrecker','roar-of-time','prismatic-laser','eternabeam'].includes(name))
    flags.push('Must recharge next turn');
  if(['solar-beam','solar-blade','sky-attack','razor-wind','skull-bash','meteor-beam','geomancy','freeze-shock','ice-burn','phantom-force','shadow-force','fly','dig','dive','bounce'].includes(name))
    flags.push('Takes two turns (unless conditions change)');
  // Negative stat changes targeting the opponent are beneficial, not drawbacks.
  const targetsSelf=['user','users-field','user-and-allies','user-or-ally','users-side'].includes(move.target?.name);
  if(targetsSelf&&(move.stat_changes||[]).some(x=>x.change<0))
    flags.push('Lowers user stats');
  if(['close-combat','superpower','overheat','draco-meteor','leaf-storm','v-create','hammer-arm','make-it-rain','psycho-boost'].includes(name)&&!flags.includes('Lowers stats'))
    flags.push('Lowers user stats');
  return [...new Set(flags)];
}
function movePenalty(move){
  const drawbacks=moveDrawbacks(move);
  if(drawbacks.includes('User faints after use'))return .12;
  let multiplier=1;
  if(drawbacks.includes('Must recharge next turn')||drawbacks.some(x=>x.startsWith('Takes two turns')))multiplier*=.55;
  if(drawbacks.includes('Recoil damage'))multiplier*=.8;
  if(drawbacks.includes('Lowers user stats'))multiplier*=.8;
  return multiplier;
}
function roughMoveValue(move,pokemon){
  if(!move?.power||move.damage_class?.name==='status')return 0;
  const attack=pokemon.stats?.find(x=>x.stat.name==='attack')?.base_stat||1;
  const special=pokemon.stats?.find(x=>x.stat.name==='special-attack')?.base_stat||1;
  const statName=move.damage_class?.name==='physical'?'attack':'special-attack';
  const stat=(statName==='attack'?attack:special)*natureMultiplier(pokemon._recordedNature,statName);
  const stab=pokemon.types.some(t=>t.type.name===move.type.name)?1.5:1;
  return move.power*expectedHits(move)*stat*stab*(move.accuracy==null?1:move.accuracy/100)*movePenalty(move);
}
function moveDescription(move){
  if(!move)return 'Details unavailable';
  const hits=expectedHits(move);
  return title(move.damage_class.name)+
    (move.power==null?'':' · Power '+move.power+(hits>1?' × '+(Number.isInteger(hits)?hits:hits.toFixed(1))+' hits (avg.)':''))+
    ' · Accuracy '+(move.accuracy==null?'—':move.accuracy+'%')+
    (move.priority>0?' · Priority +'+move.priority:'');
}
function moveUtility(move){
  if(!move)return 0;
  let utility=0;
  if(move.priority>0)utility+=2;
  if(move.damage_class?.name==='status'||!move.power)utility+=1.5;
  const changes=move.stat_changes||[];
  const targetsSelf=['user','users-field','user-and-allies','user-or-ally','users-side'].includes(move.target?.name);
  if(changes.some(x=>targetsSelf?x.change>0:x.change<0))utility+=1.5;
  if(move.meta?.ailment?.name&&move.meta.ailment.name!=='none')utility+=1;
  if(move.meta?.healing>0||move.meta?.drain>0)utility+=1;
  // Reward tactical effects without treating them as guaranteed outcomes.
  if(move.meta?.flinch_chance>0)utility+=Math.min(move.meta.flinch_chance/100,1);
  if(move.meta?.crit_rate>0)utility+=.35;
  if(move.meta?.ailment_chance>0)utility+=Math.min(move.meta.ailment_chance/100,1);
  if(move.name==='flame-charge'||move.name==='rapid-spin'||move.name==='trailblaze')utility+=1.1;
  if(move.name==='charge'||move.name==='confuse-ray')utility+=.6;
  return utility;
}
function moveCoverage(moves){
  const damaging=moves.filter(m=>m?.power>0&&m.damage_class?.name!=='status');
  return new Set(Object.keys(colors).filter(defense=>
    damaging.some(m=>(rules[m.type.name]?.[defense]??1)>1)));
}
// Explain notable effects without treating chance-based effects as guaranteed.
function notableMoveEffects(move){
  if(!move)return [];
  const meta=move.meta||{},notes=[];
  const ailment=meta.ailment?.name;
  if(ailment&&ailment!=='none'){
    const chance=meta.ailment_chance||move.effect_chance||0;
    notes.push((chance?chance+'% chance to ':'Can ')+
      (ailment==='paralysis'?'paralyze':ailment==='burn'?'burn':ailment==='freeze'?'freeze':
       ailment==='poison'?'poison':ailment==='confusion'?'confuse':ailment==='sleep'?'put to sleep':'inflict '+title(ailment)));
  }
  if(meta.flinch_chance>0)notes.push(meta.flinch_chance+'% chance to flinch');
  if(meta.drain>0)notes.push('Restores HP based on damage');
  if(meta.healing>0)notes.push('Restores HP');
  if(move.priority>0)notes.push('Priority +'+move.priority);
  if(move.name==='flame-charge')notes.push('Raises user Speed');
  if(move.name==='charge')notes.push('Boosts next Electric attack and raises Special Defense');
  if(move.name==='razor-leaf')notes.push('Higher critical-hit chance');
  if(move.name==='pyro-ball'&&!notes.some(x=>x.includes('burn')))notes.push('10% chance to burn');
  return [...new Set(notes)].slice(0,3);
}
function attackingStatExplanation(candidate,oldMove,pokemon){
  if(!candidate?.power||!oldMove?.power)return '';
  const newClass=candidate.damage_class?.name,oldClass=oldMove.damage_class?.name;
  if(!['physical','special'].includes(newClass)||!['physical','special'].includes(oldClass)||newClass===oldClass)return '';
  const atk=pokemon.stats?.find(x=>x.stat.name==='attack')?.base_stat;
  const spa=pokemon.stats?.find(x=>x.stat.name==='special-attack')?.base_stat;
  if(!Number.isFinite(atk)||!Number.isFinite(spa))return '';
  const newStat=(newClass==='physical'?atk:spa)*natureMultiplier(pokemon._recordedNature,newClass==='physical'?'attack':'special-attack'),oldStat=(oldClass==='physical'?atk:spa)*natureMultiplier(pokemon._recordedNature,oldClass==='physical'?'attack':'special-attack');
  if(newStat<=oldStat*1.12)return '';
  return 'Uses '+(newClass==='physical'?'Attack':'Special Attack')+
    ' ('+newStat+') instead of '+(oldClass==='physical'?'Attack':'Special Attack')+' ('+oldStat+').';
}
// Move Advisor 2.0: score the complete moveset, not just raw move power.
// All scores are heuristics; opponent stats, IVs, EVs and field conditions are unknown.
const specialMechanics={
  'night-shade':'Deals fixed damage equal to the user’s level',
  'seismic-toss':'Deals fixed damage equal to the user’s level',
  'counter':'Only works after taking a physical hit; retaliates at negative priority',
  'mirror-coat':'Only works after taking a special hit; retaliates at negative priority',
  'endeavor':'Only works when the target has more HP than the user',
  'flail':'Power increases as the user’s HP decreases',
  'reversal':'Power increases as the user’s HP decreases',
  'sucker-punch':'Fails unless the opponent selects a damaging move',
  'sunny-day':'Boosts Fire, weakens Water and strengthens Growth; weather can benefit opponents',
  'rain-dance':'Boosts Water, weakens Fire and changes weather interactions',
  'solar-beam':'Usually charges for a turn; attacks immediately in harsh sunlight',
  'hex':'Power doubles against a target with a major status condition',
  'shadow-punch':'Normally never misses',
  'flame-charge':'Raises the user’s Speed after hitting'
};
const variableDamageMoves=new Set(['night-shade','seismic-toss','counter','mirror-coat','endeavor','flail','reversal','super-fang','dragon-rage','sonic-boom','psywave','final-gambit']);
function moveIsDamaging(move){return !!move&&(move.power>0||variableDamageMoves.has(move.name))&&move.damage_class?.name!=='status'}
function moveRole(move){
  if(!move)return 'unknown';
  if(moveIsDamaging(move))return 'attack';
  if(['sunny-day','rain-dance','sandstorm','hail','snow-scape'].includes(move.name))return 'weather';
  if(['growth','swords-dance','nasty-plot','iron-defense','calm-mind','agility'].includes(move.name))return 'setup';
  if(['cotton-spore','charm','thunder-wave','will-o-wisp','confuse-ray','yawn','spore','hypnosis','toxic'].includes(move.name))return 'disruption';
  if(['recover','roost','soft-boiled','synthesis','rest','wish'].includes(move.name))return 'recovery';
  return 'support';
}
function moveExpectedValue(move,pokemon){
  if(!moveIsDamaging(move))return 0;
  if(variableDamageMoves.has(move.name)){
    // Never assign fictitious ordinary base power to conditional/fixed attacks.
    if(['night-shade','seismic-toss'].includes(move.name)){
      const level=Number(pokemon._recordedLevel)||35;
      return level*45;
    }
    return 0;
  }
  return roughMoveValue(move,pokemon);
}
function moveRoleQuality(move){
  if(!move)return 0;
  let quality=moveUtility(move);
  const effects=notableMoveEffects(move);
  if(move.name==='flame-charge'||move.name==='trailblaze')quality+=2;
  if(['growth','swords-dance','nasty-plot','calm-mind'].includes(move.name))quality+=1.2;
  if(['yawn','spore','thunder-wave','will-o-wisp'].includes(move.name))quality+=1.2;
  if(move.name==='sunny-day'||move.name==='rain-dance')quality+=.5;
  if(move.name==='quick-attack'||move.name==='mach-punch')quality+=1;
  if(effects.some(x=>x.includes('Restores HP')))quality+=.8;
  return quality;
}
function moveSetScore(moves,pokemon){
  const damaging=moves.filter(moveIsDamaging);
  const bestByType=new Map();
  for(const move of damaging){
    const type=move.type?.name||'unknown',value=moveExpectedValue(move,pokemon);
    if(!bestByType.has(type)||value>bestByType.get(type))bestByType.set(type,value);
  }
  const values=[...bestByType.values()].sort((a,b)=>b-a);
  const max=Math.max(1,...moves.map(m=>moveExpectedValue(m,pokemon)));
  const offense=values.reduce((sum,v,i)=>sum+v/max*(i===0?2.8:1.4),0);
  const attackTypes=new Set(bestByType.keys());
  const coverage=Object.keys(colors).filter(defense=>[...attackTypes].some(t=>(rules[t]?.[defense]??1)>1)).length;
  const support=moves.filter(m=>!moveIsDamaging(m)).reduce((n,m)=>n+moveRoleQuality(m),0);
  const attackUtility=damaging.reduce((n,m)=>n+moveRoleQuality(m)*.5,0);
  const penalty=damaging.length===0?10:damaging.length===1?3.2:0;
  const overlap=damaging.length-attackTypes.size;
  return offense+coverage*.32+support*.75+attackUtility*.55-penalty-overlap*.3;
}
function decideMoveReplacement(candidate,entries,details){
  const current=entries.map(x=>x.move);
  const baseline=moveSetScore(current,details);
  const drawbacks=moveDrawbacks(candidate);
  const options=entries.map(x=>{
    const updated=current.map((m,i)=>i===x.index?candidate:m);
    const old= x.move;
    const oldValue=moveExpectedValue(old,details),newValue=moveExpectedValue(candidate,details);
    const sameType=moveIsDamaging(candidate)&&moveIsDamaging(old)&&candidate.type?.name===old?.type?.name;
    const sameRole=moveRole(candidate)===moveRole(old);
    const lost= [...moveCoverage(current)].filter(t=>!moveCoverage(updated).has(t));
    const gained=[...moveCoverage(updated)].filter(t=>!moveCoverage(current).has(t));
    const previousDamaging=current.filter(moveIsDamaging).length;
    const remainingDamaging=updated.filter(moveIsDamaging).length;
    const losingLastAttack=previousDamaging>0&&remainingDamaging===0;
    const losingSecondAttack=previousDamaging>=2&&remainingDamaging<2;
    const selfKO=drawbacks.includes('User faints after use');
    const dangerous= selfKO||['counter','mirror-coat','endeavor'].includes(candidate.name);
    const candidateConditional=variableDamageMoves.has(candidate.name);
    let score=moveSetScore(updated,details)-baseline;
    if(sameType&&newValue>oldValue*1.15&&newValue>0)score+=1.6;
    if(sameType&&sameRole&&newValue>=oldValue*.95&&newValue>0)score+=.5;
    if(sameType&&newValue<oldValue*.8)score-=1.5;
    if(!sameType&&moveIsDamaging(candidate)&&!moveIsDamaging(old))score-=1.3;
    if(losingLastAttack)score-=12;
    else if(losingSecondAttack)score-=4;
    if(selfKO)score-=12;
    if(candidateConditional)score-=2.8;
    // Two-turn/recharge/recoil attacks must clear a higher bar than a simple coverage gain.
    if(drawbacks.some(x=>x.startsWith('Takes two turns')||x==='Must recharge next turn'))score-=2.6;
    if(drawbacks.includes('Recoil damage'))score-=2.8;
    // Protect reliable Speed boosts and priority from speculative coverage improvements.
    if(['flame-charge','trailblaze','quick-attack'].includes(old?.name))score-=1.6;
    if(old?.meta?.drain>0||['giga-drain','drain-punch','leech-life','horn-leech'].includes(old?.name))score-=2.6;
    if(['sunny-day','rain-dance'].includes(candidate.name))score-=1.3;
    if(old?.name==='razor-leaf'&&candidate.name==='energy-ball')score+=.4;
    return {...x,score,lost,gained,removedValue:oldValue,losingLastAttack,losingSecondAttack,
      sameType,meaningfulUpgrade:sameType&&newValue>oldValue*1.15&&!dangerous,
      dangerous,candidateConditional};
  }).sort((a,b)=>b.score-a.score);
  return options[0];
}
function explainMoveDecision(candidate,replacement,pokemon,free,already){
  if(already)return {skip:true,text:'Already known — no change needed.'};
  const drawbacks=moveDrawbacks(candidate);
  const special=specialMechanics[candidate.name];
  const selfKO=drawbacks.includes('User faints after use');
  const skip=!free&&(selfKO||replacement.score<1.2||replacement.losingLastAttack||replacement.losingSecondAttack);
  const reasons=[];
  if(selfKO)reasons.push('The user faints after using this move.');
  if(special)reasons.push(special+'.');
  if(!free&&replacement.sameType&&replacement.meaningfulUpgrade&&!skip)
    reasons.push('Stronger '+title(candidate.type.name)+' attack without losing type coverage.');
  if(!free&&replacement.gained?.length)reasons.push('Adds coverage against '+replacement.gained.map(title).join(', ')+'.');
  if(!free&&replacement.lost?.length)reasons.push('Loses coverage against '+replacement.lost.map(title).join(', ')+'.');
  if(!free&&replacement.move?.name==='flame-charge')reasons.push('You would lose a reliable Speed boost.');
  if(!free&&replacement.move?.priority>0)reasons.push('You would lose priority.');
  if(!free&&replacement.losingSecondAttack)reasons.push('You would be left with only one damaging move.');
  if(!free&&replacement.losingLastAttack)reasons.push('You would lose your last damaging move.');
  if(drawbacks.includes('Recoil damage'))reasons.push('Causes recoil damage.');
  if(drawbacks.some(x=>x.startsWith('Takes two turns')))reasons.push('Takes two turns to attack.');
  if(drawbacks.includes('Must recharge next turn'))reasons.push('Requires a recharge turn.');
  if(candidate.accuracy!=null&&replacement.move?.accuracy!=null&&candidate.accuracy<replacement.move.accuracy)
    reasons.push('Less accurate ('+candidate.accuracy+'% vs '+replacement.move.accuracy+'%).');
  const effects=notableMoveEffects(candidate).filter(x=>!reasons.join(' ').toLowerCase().includes(x.toLowerCase()));
  if(effects.length)reasons.push(effects[0]+'.');
  if(!free&&!skip&&replacement.move){
    const stat=attackingStatExplanation(candidate,replacement.move,pokemon);
    if(stat)reasons.push(stat.replace('Uses ','Uses base '));
  }
  const label=free?'Use the empty move slot.':skip?'⭐ Keep Current Moves.':
    '✓ Recommended: replace '+title(replacement.name)+'.';
  if(skip&&reasons.length===0)reasons.push('No clear overall improvement for this moveset.');
  if(skip&&drawbacks.some(x=>x.startsWith('Takes two turns')))reasons.unshift('Two-turn attacks are less reliable than immediate attacks.');
  return {skip,text:[label,...reasons.slice(0,3)].join(' ')};
}

$('compareNewMove').addEventListener('click',async()=>{
  const run=++learnMoveRun,recordId=editingRecordId;
  const pokemon=[...team,...box].find(p=>p.recordId===recordId);
  const name=normalizeMoveName($('learnMoveName').value);
  const status=$('learnMoveStatus');$('learnMoveResults').hidden=true;learnMoveCandidate=null;
  if(!pokemon||!name){status.textContent='Enter the move to compare.';return}
  status.textContent='Comparing moves…';
  const current=[...document.querySelectorAll('.profile-move')].map(x=>x.value.trim());
  const [candidate,details,...moves]=await Promise.all([
    moveInfo(name),getTeachingPokemon(pokemon.name),
    ...current.map(n=>n?moveInfo(n):Promise.resolve(null))
  ]);
  if(run!==learnMoveRun||editingRecordId!==recordId||$('profile').hidden)return;
  if(!candidate||!details){status.textContent='Could not load move details. Check spelling or connection.';return}
  const already=current.some(n=>normalizeMoveName(n)===normalizeMoveName(candidate.name));
  const entries=current.map((n,i)=>({name:n,move:moves[i],index:i}));
  const free=entries.find(x=>!x.name);
  details._recordedLevel=pokemon.level;
  details._recordedNature=pokemon.nature||'';
  const replacement=free||decideMoveReplacement(candidate,entries,details);
  details._recordedLevel=pokemon.level;
  details._recordedNature=pokemon.nature||'';
  const decision=explainMoveDecision(candidate,replacement,details,free,already);
  const skipRecommended=decision.skip;
  const advice=decision.text;
  const summary=$('learnMoveSummary');summary.replaceChildren();
  const heading=document.createElement('strong');heading.textContent=title(candidate.name);
  const info=document.createElement('p');info.className='hint';info.textContent=moveDescription(candidate);
  const recommendation=document.createElement('p');recommendation.textContent=advice;
  summary.append(heading,makeTypeBadge(candidate.type.name),info,recommendation);
  const list=$('learnMoveOptions');list.replaceChildren();
  entries.forEach(x=>{
    const row=document.createElement('div');row.className='learn-existing-row';
    const label=document.createElement('strong');label.textContent=x.name||'Empty slot';
    row.append(label);if(x.move?.type?.name)row.append(makeTypeBadge(x.move.type.name));
    const detail=document.createElement('small');detail.textContent=x.name?moveDescription(x.move):'Available';
    row.append(detail);list.append(row);
  });
  const select=$('forgetMove');select.replaceChildren();
  entries.forEach(x=>{
    const option=document.createElement('option');option.value=String(x.index);
    option.textContent=x.name?'Replace '+title(x.name):'Use empty slot '+(x.index+1);
    select.append(option);
  });
  if(skipRecommended){
    const skip=document.createElement('option');skip.value='skip';skip.textContent='⭐ Keep Current Moves (recommended)';
    select.prepend(skip);select.value='skip';
  }else select.value=String(replacement.index);
  $('confirmLearnMove').disabled=already;
  $('confirmLearnMove').textContent=skipRecommended?'Keep Current Moves':'Learn This Move';
  learnMoveCandidate={run,recordId,moveName:title(candidate.name),current};
  $('learnMoveResults').hidden=false;status.textContent='';
});
$('forgetMove').addEventListener('change',()=>{
  $('confirmLearnMove').textContent=$('forgetMove').value==='skip'?'Keep Current Moves':'Learn This Move';
});
$('confirmLearnMove').addEventListener('click',()=>{
  const candidate=learnMoveCandidate;
  if(!candidate||candidate.run!==learnMoveRun||candidate.recordId!==editingRecordId)return;
  const inputs=[...document.querySelectorAll('.profile-move')];
  const current=inputs.map(x=>x.value.trim());
  if(current.some((n,i)=>n!==candidate.current[i])){
    $('learnMoveStatus').textContent='Your moves changed. Compare again first.';return;
  }
  if($('forgetMove').value==='skip'){
    resetLearnMoveHelper();
    $('profileStatus').textContent='Current moves kept.';
    return;
  }
  const index=Number($('forgetMove').value);
  if(!Number.isInteger(index)||index<0||index>3)return;
  const old=current[index];
  if(!confirm(old?'Replace '+old+' with '+candidate.moveName+'?':'Learn '+candidate.moveName+' in the empty slot?'))return;
  const pokemon=[...team,...box].find(p=>p.recordId===candidate.recordId);if(!pokemon)return;
  current[index]=candidate.moveName;pokemon.moves=current;
  inputs.forEach((input,i)=>input.value=current[i]);
  save();refreshProfileMoveBadges(candidate.recordId);
  resetLearnMoveHelper();$('profileStatus').textContent=candidate.moveName+' saved to profile.';
});

// v1.6: defensive matchup awareness for battle recommendations.
// Uses opponent types as possible STAB threats, not its actual known moves.
function defensiveRisk(pokemon,opponentTypes){
  const attacks=opponentTypes.map(type=>({type,
    multiplier:pokemon.types.reduce((n,defender)=>n*(rules[type]?.[defender]??1),1)}));
  return {attacks,worst:Math.max(...attacks.map(x=>x.multiplier))};
}
function defensiveRiskLabel(pokemon,opponentTypes){
  const risk=defensiveRisk(pokemon,opponentTypes);
  const label=risk.worst>=4?'⚠️ 4× danger':risk.worst>1?'⚠️ Weak':
    risk.worst===0?'🛡️ Immune to an opponent type':
    risk.worst<1?'🛡️ Resists':'➖ Neutral defense';
  return label+' · '+risk.attacks.map(x=>title(x.type)+' ×'+x.multiplier).join(' · ');
}
function renderBattlePicks(opponentTypes,ranked,run){
  if(run!==advisorRun)return;
  const wrapper=$('battlePicks'),results=$('battlePickResults'),status=$('battlePickStatus');
  const choices=team.map(pokemon=>{
    const best=ranked.find(item=>item.pokemon===pokemon);
    const risk=defensiveRisk(pokemon,opponentTypes);
    // Offensive strength matters, but avoid recommending a 4x-vulnerable attacker
    // solely because of a strong move. No speed/actual moveset information available.
    const riskWeight=risk.worst>=4?.2:risk.worst>=2?.55:risk.worst===0?1.35:risk.worst<1?1.2:1;
    return {pokemon,best,risk,score:(best?.score||0)*riskWeight};
  }).filter(x=>x.best).sort((a,b)=>b.score-a.score);
  if(!choices.length){wrapper.hidden=true;return}
  wrapper.hidden=false;
  status.textContent='';
  choices.slice(0,3).forEach((choice,index)=>{
    const row=document.createElement('div');row.className='battle-pick';
    const heading=document.createElement('strong');
    heading.textContent=(index===0?'⭐ ':'')+(choice.pokemon.nickname||title(choice.pokemon.name))+
      ' — '+title(choice.best.name);
    const move=document.createElement('p');move.className='hint';
    move.textContent='Attack ×'+choice.best.effectiveness+' · '+title(choice.best.type);
    const defense=document.createElement('p');defense.className='battle-risk';
    defense.textContent=defensiveRiskLabel(choice.pokemon,opponentTypes);
    row.append(heading,move,defense);results.append(row);
  });
}
