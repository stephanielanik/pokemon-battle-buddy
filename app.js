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
async function search(name,manual=false){name=name.toLowerCase().trim().replace(/\s+/g,'-').replace('♀','-f').replace('♂','-m');if(!name)return;if(!manual&&!/-(galar|alola|hisui)$/.test(name))name=preferredName(name);$('message').textContent='Finding your Pokémon…';$('result').hidden=true;$('suggestions').hidden=true;try{const p=await api('pokemon/'+name);let types=p.types.sort((a,b)=>a.slot-b.slot).map(x=>x.type.name);const artwork=p.sprites.other['official-artwork'].front_default||p.sprites.front_default;current={id:p.id,name:p.name,types,artwork,ability:null,moves:[],heldItem:null,pokerus:'unknown',tags:[]};$('name').textContent=title(p.name);$('dex').textContent='#'+String(p.id).padStart(3,'0');$('art').src=artwork;$('types').innerHTML=types.map(pill).join('');$('hero').style.background=gradient(types);showMatch(types);refreshMoveAdvisor(types);$('forms').innerHTML='';const species=await api('pokemon-species/'+p.species.name);$('dex').textContent='#'+String(species.id).padStart(3,'0');const forms=species.varieties.filter(x=>x.is_default||/(galar|alola|hisui)/.test(x.pokemon.name));if(forms.length>1)$('forms').innerHTML=forms.map(x=>`<button data-form="${x.pokemon.name}">${title(x.pokemon.name)}</button>`).join('');$('forms').querySelectorAll('button').forEach(b=>b.onclick=()=>search(b.dataset.form,true));$('result').hidden=false;$('message').textContent='';}catch(e){$('message').textContent=e.message+' (PokéAPI requires internet.)'}}

function showCollection(view){
  collectionView=['party','box','bank'].includes(view)?view:'party';
  $('teamCards').hidden=collectionView!=='party';
  $('boxCards').hidden=collectionView!=='box';
  $('machineBank').hidden=collectionView!=='bank';
  $('partyView').classList.toggle('active',collectionView==='party');
  $('boxView').classList.toggle('active',collectionView==='box');
  $('bankView').classList.toggle('active',collectionView==='bank');
  $('partyView').setAttribute('aria-pressed',String(collectionView==='party'));
  $('boxView').setAttribute('aria-pressed',String(collectionView==='box'));
  $('bankView').setAttribute('aria-pressed',String(collectionView==='bank'));
  if(collectionView==='bank')renderMachineBank();
  $('teamAnalyzer').hidden=collectionView!=='party';
  $('collectionHint').hidden=collectionView==='bank';
  $('collectionHint').textContent=collectionView==='party'?
    'Your active party. Move Pokémon to the Box to keep their profiles.':
    'Stored Pokémon keep their profiles. Bring one back when your party has room.';
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
    actions.append(edit,move);info.append(name,species,types,actions);
    card.append(img,info);container.append(card);
  }
  if(!list.length){const empty=document.createElement('div');empty.className='empty';empty.textContent=location==='party'?'No Pokémon in your party. Add one from Lookup or your Box.':'Your Box is empty.';container.append(empty)}
}

function renderTeam(){
  $('teamCount').textContent=team.length+'/6';
  $('partyCount').textContent=team.length+'/6';
  $('boxCount').textContent=box.length;
  renderCollectionCards(team,$('teamCards'),'party');
  renderCollectionCards(box,$('boxCards'),'box');
  showCollection(collectionView);
}
function save(){
  localStorage.setItem('battleBuddyTeam',JSON.stringify(team));
  localStorage.setItem('battleBuddyBox',JSON.stringify(box));
  renderTeam();$('analyzerResults').replaceChildren();$('analyzerStatus').textContent='Party changed. Tap Analyze Party for updated results.';if(current)refreshMoveAdvisor(current.types);
}
function movePokemon(recordId,location){
  const source=location==='party'?team:box, destination=location==='party'?box:team;
  if(location==='box'&&team.length>=6){alert('Your party is full. Move one Pokémon to the Box first.');return}
  const index=source.findIndex(p=>p.recordId===recordId);if(index<0)return;
  destination.push(source.splice(index,1)[0]);save();
}
$('partyView').addEventListener('click',()=>showCollection('party'));
$('boxView').addEventListener('click',()=>showCollection('box'));
$('bankView').addEventListener('click',()=>showCollection('bank'));
$('add').onclick=()=>{
  if(!current)return;
  const newRecord={...current,recordId:newPokemonId()};
  if(team.length<6){team.push(newRecord);collectionView='party'}
  else if(confirm('Your party is full. Save this Pokémon to the Box instead?')){box.push(newRecord)}
  else return;
  save();$('add').textContent='✓ Saved';
  setTimeout(()=>$('add').textContent='＋ Add to My Team',1500);
};

$('go').onclick=()=>search($('search').value);$('search').addEventListener('keydown',e=>{if(e.key==='Enter')search($('search').value)});
let timer;$('search').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const q=$('search').value.toLowerCase().trim();let hits=allNames.filter(n=>n.includes(q)).slice(0,9);$('suggestions').hidden=!q||!hits.length;$('suggestions').innerHTML=hits.map(n=>{const id=allNames.indexOf(n)+1;const picked=preferredName(n);return `<button data-name="${n}"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt=""><strong>${title(n)}</strong>${picked!==n?'<span class="sub">Galar preferred</span>':''}</button>`}).join('');$('suggestions').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('search').value=title(b.dataset.name);search(b.dataset.name)})},150)});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));$('lookup').hidden=b.dataset.tab!=='lookup';$('team').hidden=b.dataset.tab!=='team';$('profile').hidden=true});
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
  $('lookup').hidden=true;$('team').hidden=false;$('profile').hidden=true;
}
async function openProfile(recordId){
  const p=[...team,...box].find(x=>x.recordId===recordId);if(!p)return;
  editingRecordId=recordId;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team'));
  $('lookup').hidden=true;$('team').hidden=true;$('profile').hidden=false;
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
  $('profileStatus').textContent='';
  loadEvolution(p,recordId);
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
  loadEvolution(p,editingRecordId);
});

// v0.6.1: update checks use a fresh HTML request, not cached JS.
// Existing localStorage data (team, game, theme) is never cleared.
const APP_VERSION='1.1.1';
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
async function refreshMoveAdvisor(opponentTypes){
  const run=++advisorRun,status=$('advisorStatus');
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
    const effectiveness=opponentTypes.reduce((n,d)=>n*(rules[type]?.[d]??1),1);
    const stab=pokemon.types.includes(type)?1.5:1;
    const accuracy=move.accuracy==null?1:Math.max(0,Math.min(100,move.accuracy))/100;
    const score=move.power*effectiveness*stab*accuracy;
    return [{pokemon,index,name:move.name||name,type,power:move.power,effectiveness,stab,accuracy:move.accuracy,score,damageClass:move.damage_class?.name||'unknown'}];
  }).sort((a,b)=>b.score-a.score);
  if(!ranked.length){status.textContent='No damaging moves could be evaluated. Status moves are excluded; check your move names or internet connection.';return}
  const failed=details.filter(x=>!x.move).length;
  status.textContent=failed?failed+' move(s) could not be found.':'';
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
        ' · Accuracy '+(item.accuracy==null?'—':item.accuracy+'%');
      card.append(name,meta);section.append(card);
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
    }
    const note=document.createElement('p');note.className='hint';
    note.textContent='Evolution requirements may vary by game or regional form. Your Pokémon will not change automatically.';
    path.append(note);
  }catch(e){
    if(request!==evolutionRequest||editingRecordId!==recordId)return;
    status.textContent='Evolution information unavailable. Check your internet connection.';
  }
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
  results.replaceChildren();
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
  const moveEntries=team.flatMap(p=>(Array.isArray(p.moves)?p.moves:[])
    .filter(m=>typeof m==='string'&&m.trim()).map(name=>({pokemon:p,name})));
  if(!moveEntries.length){
    results.append(analyzerRow('⚔️ Offensive coverage','Record moves in your Pokémon profiles to see coverage.'));
    status.textContent='Defensive analysis ready. Add moves to check offensive coverage.';
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
    if(item.kind==='TM'){
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!!inventory[item.key];
      checkbox.addEventListener('change',()=>{
        machineBanks[game]??={};
        if(checkbox.checked)machineBanks[game][item.key]=1;else delete machineBanks[game][item.key];
        saveMachineBank();renderMachineBank();
      });
      description.append(checkbox,name);row.append(description);
    }else{
      description.append(name);row.append(description);
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
$('game').addEventListener('change',()=>{if(collectionView==='bank')renderMachineBank()});
