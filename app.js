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
  $('editLookupBoxPokemon').hidden=true;name=name.toLowerCase().trim().replace(/\s+/g,'-').replace('♀','-f').replace('♂','-m');if(!name)return;if(!manual&&!/-(galar|alola|hisui)$/.test(name))name=preferredName(name);$('message').textContent='Finding your Pokémon…';$('result').hidden=true;$('suggestions').hidden=true;try{const p=await api('pokemon/'+name);if(lookupRun!==opponentLookupRun)return;
  opponentAbilityInfo=await resolveOpponentAbilities(p);let types=p.types.sort((a,b)=>a.slot-b.slot).map(x=>x.type.name);const artwork=p.sprites.other['official-artwork'].front_default||p.sprites.front_default;current={id:p.id,name:p.name,types,artwork,ability:null,moves:[],heldItem:null,pokerus:'unknown',tags:[]};$('name').textContent=title(p.name);$('dex').textContent='#'+String(p.id).padStart(3,'0');$('art').src=artwork;$('types').innerHTML=types.map(pill).join('');$('hero').style.background=gradient(types);showMatch(types);refreshMoveAdvisor(types);$('forms').innerHTML='';const species=await api('pokemon-species/'+p.species.name);$('dex').textContent='#'+String(species.id).padStart(3,'0');const forms=species.varieties.filter(x=>x.is_default||/(galar|alola|hisui)/.test(x.pokemon.name));if(forms.length>1)$('forms').innerHTML=forms.map(x=>`<button data-form="${x.pokemon.name}">${title(x.pokemon.name)}</button>`).join('');$('forms').querySelectorAll('button').forEach(b=>b.onclick=()=>search(b.dataset.form,true));$('result').hidden=false;$('message').textContent='';}catch(e){$('message').textContent=e.message+' (PokéAPI requires internet.)'}}

function showCollection(view){
  collectionView=['party','box'].includes(view)?view:'party';
  $('teamCards').hidden=collectionView!=='party';
  $('boxCards').hidden=collectionView!=='box';
  $('boxAdd').hidden=collectionView!=='box'||!boxAddExpanded;

  $('partyView').classList.toggle('active',collectionView==='party');
  $('boxView').classList.toggle('active',collectionView==='box');

  $('partyView').setAttribute('aria-pressed',String(collectionView==='party'));
  $('boxView').setAttribute('aria-pressed',String(collectionView==='box'));


  $('analyzerDisclosure').hidden=collectionView!=='party';

}
function renderCollectionCards(list,container,location){
  container.replaceChildren();
  for(const p of list){
    const card=document.createElement('div');card.className='teamcard compact-teamcard';card.style.background=gradient(p.types);
    const img=document.createElement('img');img.src=p.artwork||'';img.alt='';
    const info=document.createElement('div');info.className='teamcard-info';
    const name=document.createElement('strong');name.textContent=p.nickname||title(p.name);
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
    info.append(name,species,types,actions);
    card.append(img,info);container.append(card);
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
  renderCollectionCards(box,$('boxCards'),'box');
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
let boxAddExpanded=false;
$('toggleBoxAdd').addEventListener('click',()=>{
  if(collectionView!=='box')showCollection('box');
  boxAddExpanded=!boxAddExpanded;
  $('boxAdd').hidden=!boxAddExpanded;
  $('toggleBoxAdd').setAttribute('aria-expanded',String(boxAddExpanded));
  if(boxAddExpanded)$('boxPokemonSearch').focus();
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
let timer;$('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const q=$('search').value.toLowerCase().trim();let hits=allNames.filter(n=>n.includes(q)).slice(0,9);$('suggestions').hidden=!q||!hits.length;$('suggestions').innerHTML=hits.map(n=>{const id=allNames.indexOf(n)+1;const picked=preferredName(n);return `<button data-name="${n}"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt=""><strong>${title(n)}</strong>${picked!==n?'<span class="sub">Galar preferred</span>':''}</button>`}).join('');$('suggestions').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  $('search').value=title(b.dataset.name);
  $('search').blur();
  $('suggestions').hidden=true;
  search(b.dataset.name);
}));
requestAnimationFrame(keepLookupSuggestionsVisible);},150)});
// Keep the autocomplete list reachable above the iPhone on-screen keyboard.
function keepLookupSuggestionsVisible(){
  const input=$('search'),list=$('suggestions');
  if(document.activeElement!==input||list.hidden||!list.children.length)return;
  const viewport=window.visualViewport;
  const visibleBottom=viewport?viewport.offsetTop+viewport.height:window.innerHeight;
  const listBottom=list.getBoundingClientRect().bottom;
  if(listBottom>visibleBottom-12){
    window.scrollBy({top:listBottom-visibleBottom+20,behavior:'auto'});
  }
}
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',()=>requestAnimationFrame(keepLookupSuggestionsVisible));
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));
  $('lookup').hidden=b.dataset.tab!=='lookup';
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
  $('lookup').hidden=true;$('team').hidden=false;$('bank').hidden=true;$('profile').hidden=true;
}
async function openProfile(recordId){
  const p=[...team,...box].find(x=>x.recordId===recordId);if(!p)return;
  editingRecordId=recordId;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team'));
  $('lookup').hidden=true;$('team').hidden=true;$('bank').hidden=true;$('profile').hidden=false;
  $('profileArt').src=p.artwork||'';$('profileArt').alt=title(p.name);
  $('profileName').textContent=title(p.name);
  $('profileDex').textContent='#'+String(p.id).padStart(3,'0');
  $('profileTypes').innerHTML=p.types.map(pill).join('');
  $('profileNickname').value=p.nickname||'';
  $('profileLevel').value=p.level??'';
  $('profileAbility').value=p.ability||'';
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
const APP_VERSION='1.10.0';
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
    const score=move.power*effectiveness*stab*accuracy;
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
    const stat=move.damage_class.name==='physical'?atk:spa;
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
    clearTimeout(timer);
    const badge=input.parentElement.querySelector('.move-type-badge');if(badge)badge.hidden=true;
    timer=setTimeout(()=>refreshProfileMoveBadges(editingRecordId),400);
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
  const stat=move.damage_class?.name==='physical'?attack:special;
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
  const newStat=newClass==='physical'?atk:spa,oldStat=oldClass==='physical'?atk:spa;
  if(newStat<=oldStat*1.12)return '';
  return 'Uses '+(newClass==='physical'?'Attack':'Special Attack')+
    ' ('+newStat+') instead of '+(oldClass==='physical'?'Attack':'Special Attack')+' ('+oldStat+').';
}
function decideMoveReplacement(candidate,entries,details){
  const current=entries.map(x=>x.move);
  const baseline=moveCoverage(current);
  const baseBest=Math.max(1,...current.map(m=>roughMoveValue(m,details)));
  const candidateValue=roughMoveValue(candidate,details);
  const candidateUtility=moveUtility(candidate);
  const drawbacks=moveDrawbacks(candidate);
  const candidateDamaging=!!(candidate.power>0&&candidate.damage_class?.name!=='status');
  const options=entries.map(x=>{
    const updated=current.map((m,i)=>i===x.index?candidate:m);
    const coverage=moveCoverage(updated);
    const lost=[...baseline].filter(t=>!coverage.has(t));
    const gained=[...coverage].filter(t=>!baseline.has(t));
    const removedValue=roughMoveValue(x.move,details);
    const damageGain=(candidateValue-removedValue)/baseBest;
    const utilityDelta=candidateUtility-moveUtility(x.move);
    const remainingDamaging=updated.filter(m=>m?.power>0&&m.damage_class?.name!=='status').length;
    const previousDamaging=current.filter(m=>m?.power>0&&m.damage_class?.name!=='status').length;
    const losingLastAttack=previousDamaging>0&&remainingDamaging===0;
    const losingSecondAttack=previousDamaging>=2&&remainingDamaging<2;
    const oldDamaging=!!(x.move?.power>0&&x.move.damage_class?.name!=='status');
    const sameType=!!(candidateDamaging&&oldDamaging&&x.move.type.name===candidate.type.name);
    // Replacing an existing attack of the same type preserves its coverage.
    // Reward that swap only if the new move is a meaningful damage upgrade.
    const meaningfulUpgrade=sameType&&candidateValue>removedValue*1.08;
    const redundantAttack=sameType&&candidateValue>=removedValue*.92;
    const statusSacrifice=candidateDamaging&&!oldDamaging;
    const existingEffects=moveUtility(x.move);
    const sameRole=sameType&&candidate.damage_class?.name===x.move.damage_class?.name;
    // Don't trade away a distinct tactical effect just for modest damage gains.
    const effectLoss=oldDamaging&&existingEffects>candidateUtility+1?
      Math.min(1.2,(existingEffects-candidateUtility)*.45):0;
    const score=damageGain+gained.length*.85-lost.length*1.4+utilityDelta*.55+
      (meaningfulUpgrade?2.5:redundantAttack?.65:0)-
      (statusSacrifice?1.5:0)-effectLoss+
      (sameRole&&meaningfulUpgrade?.45:0)-
      (drawbacks.includes('User faints after use')?5:0)-
      (losingLastAttack?8:losingSecondAttack?3:0);
    return {...x,score,lost,gained,removedValue,losingLastAttack,losingSecondAttack,
      sameType,meaningfulUpgrade,statusSacrifice};
  }).sort((a,b)=>b.score-a.score);
  return options[0];
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
  const replacement=free||decideMoveReplacement(candidate,entries,details);
  const newValue=roughMoveValue(candidate,details);
  let advice;
  const drawbacks=moveDrawbacks(candidate);
  const selfKO=drawbacks.includes('User faints after use');
  const skipRecommended=!already&&(selfKO||(!free&&(replacement.score<=0||replacement.losingLastAttack||replacement.losingSecondAttack)));
  if(already)advice='Already known — no change needed.';
  else if(selfKO)advice='⭐ Keep Current Moves. ⚠️ Situational: '+title(candidate.name)+' causes your Pokémon to faint. Best saved as a last-resort attack.';
  else if(free)advice='You have an empty slot. No move needs to be forgotten.';
  else if(skipRecommended){
    const tactical=candidate.damage_class?.name==='status';
    advice='⭐ Keep Current Moves. '+
      (replacement.losingLastAttack?'You would lose your only damaging move.':
       replacement.losingSecondAttack?'Replacing '+title(replacement.name)+' would leave only one damaging move.':
       tactical?'This status move is situational rather than a clear upgrade.':
       'No clear overall upgrade.')+
      ' You can still choose a replacement if you prefer.';
  }
  else advice='Consider replacing '+title(replacement.name)+'.'+(replacement.meaningfulUpgrade?' Stronger '+title(candidate.type.name)+' attack without losing type coverage.':'');
  if(!free&&!already&&!selfKO){
    if(replacement.gained?.length)advice+=' Adds coverage against '+replacement.gained.map(title).join(', ')+'.';
    if(replacement.lost?.length)advice+=' Loses coverage against '+replacement.lost.map(title).join(', ')+'.';
    if(candidate.power&&newValue>replacement.removedValue*1.1&&!replacement.meaningfulUpgrade)advice+=' Higher estimated damage potential.';
    if(replacement.move?.priority>0)advice+=' You would lose a priority attack.';
    if(replacement.move?.stat_changes?.some(x=>x.change>0))advice+=' You would lose a stat-boosting effect.';
    if(replacement.move?.damage_class?.name==='status')advice+=' You would lose a status move.';
  }
  if(candidate.damage_class?.name==='status'){
    const opponentDebuffs=(candidate.stat_changes||[]).filter(x=>x.change<0&&!['user','users-field','user-and-allies','user-or-ally','users-side'].includes(candidate.target?.name));
    if(opponentDebuffs.length)advice+=' Lowers the opponent’s '+opponentDebuffs.map(x=>title(x.stat.name)+' by '+Math.abs(x.change)+' stage'+(Math.abs(x.change)===1?'':'s')).join(', ')+'.';
    else advice+=' Consider its tactical effect rather than damage.';
  }
  if(!already&&!selfKO&&!skipRecommended&&!free){
    const statReason=attackingStatExplanation(candidate,replacement.move,details);
    if(statReason)advice+=' '+statReason;
  }
  const effects=notableMoveEffects(candidate);
  if(effects.length)advice+=' '+effects.join(' · ')+'.';
  if(!already&&!skipRecommended&&!selfKO&&!free&&replacement.move){
    const previousEffects=notableMoveEffects(replacement.move);
    const lostEffects=previousEffects.filter(effect=>!effects.includes(effect));
    if(lostEffects.length)advice+=' You would lose: '+lostEffects.slice(0,2).join(' · ')+'.';
  }
  const otherDrawbacks=drawbacks.filter(x=>!selfKO||x!=='User faints after use');
  if(otherDrawbacks.length)advice+=' ⚠️ '+otherDrawbacks.join(' · ')+'.';
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
