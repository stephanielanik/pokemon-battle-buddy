const colors={normal:'#a8a29e',fire:'#f58a52',water:'#5aa7e8',electric:'#e6b83f',grass:'#67bc84',ice:'#6acfcf',fighting:'#d56866',poison:'#a56cc3',ground:'#cba56e',flying:'#879de5',psychic:'#e97aa6',bug:'#9bbd54',rock:'#a99872',ghost:'#8574bd',dragon:'#7976d6',dark:'#6c667b',steel:'#83a8b5',fairy:'#e6a1ce'};
// Each row is the attacking type; entries are defending types and their multipliers.
const rules={normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}};
const $=id=>document.getElementById(id), title=s=>s.replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
let team=JSON.parse(localStorage.getItem('battleBuddyTeam')||'[]'),current=null,allNames=[];
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
function renderTeam(){ $('teamCount').textContent=team.length+'/6';$('teamCards').innerHTML=team.map((p,i)=>`<div class="teamcard" style="background:${gradient(p.types)}"><img src="${p.artwork||''}" alt=""><strong>${title(p.name)}</strong><div class="types">${p.types.map(pill).join('')}</div><button data-edit="${i}">Edit profile</button><button data-remove="${i}">Remove</button></div>`).join('')+Array.from({length:6-team.length},()=>'<div class="empty">＋ Open Lookup to add a Pokémon</div>').join('');$('teamCards').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProfile(+b.dataset.edit));$('teamCards').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{team.splice(+b.dataset.remove,1);save()})}
function save(){localStorage.setItem('battleBuddyTeam',JSON.stringify(team));renderTeam();if(current)refreshMoveAdvisor(current.types)}
$('add').onclick=()=>{if(!current)return;if(team.length===6){alert('Your team already has six Pokémon. Remove one first.');return}team.push({...current});save();$('add').textContent='✓ Added to team';setTimeout(()=>$('add').textContent='＋ Add to My Team',1500)};
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
let editingTeamIndex=-1;
const cleanText=value=>String(value??'').trim();
function showTeamTab(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='team'));
  $('lookup').hidden=true;$('team').hidden=false;$('profile').hidden=true;
}
async function openProfile(index){
  const p=team[index];if(!p)return;
  editingTeamIndex=index;
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
  $('abilitySuggestions').replaceChildren();$('moveSuggestions').replaceChildren();
  window.scrollTo(0,0);
  const openedIndex=index;
  try{
    const details=await api('pokemon/'+p.name);
    if(editingTeamIndex!==openedIndex||$('profile').hidden)return;
    const fill=(id,values)=>{const list=$(id);for(const value of [...new Set(values)]){const opt=document.createElement('option');opt.value=title(value);list.append(opt)}};
    fill('abilitySuggestions',details.abilities.map(x=>x.ability.name));
    fill('moveSuggestions',details.moves.map(x=>x.move.name));
  }catch(e){ /* Manual entry remains available offline. */ }
}
$('backToTeam').addEventListener('click',()=>{editingTeamIndex=-1;showTeamTab();window.scrollTo(0,0)});
$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  const p=team[editingTeamIndex];if(!p){showTeamTab();return}
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
});

// v0.6.1: update checks use a fresh HTML request, not cached JS.
// Existing localStorage data (team, game, theme) is never cleared.
const APP_VERSION='0.7.3';
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
  return {format:'pokemon-battle-buddy-backup',schemaVersion:1,exportedAt:new Date().toISOString(),
    team,game:localStorage.getItem('battleBuddyGame')||'shield',
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
    if(data.format!=='pokemon-battle-buddy-backup'||data.schemaVersion!==1)throw Error('This is not a supported Battle Buddy backup.');
    if(!Array.isArray(data.team)||data.team.length>6)throw Error('Backup must contain no more than six Pokémon.');
    const validTypes=Object.keys(colors);
    const restored=data.team.map(p=>{
      if(!p||!Number.isInteger(p.id)||p.id<1||p.id>100000||
         typeof p.name!=='string'||!(/^[a-z0-9-]{1,80}$/).test(p.name)||
         !Array.isArray(p.types)||p.types.length<1||p.types.length>2||
         !p.types.every(t=>validTypes.includes(t))||
         (p.artwork!=null&&(typeof p.artwork!=='string'||!/^https:\/\//.test(p.artwork)))||
         (p.moves!=null&&(!Array.isArray(p.moves)||p.moves.length>4||
           !p.moves.every(m=>typeof m==='string'&&m.length<=60))))
        throw Error('Backup contains an invalid Pokémon record.');
      return {id:p.id,name:p.name,types:p.types,artwork:p.artwork||'',
        nickname:typeof p.nickname==='string'?p.nickname.slice(0,40):'',
        level:Number.isInteger(p.level)&&p.level>=1&&p.level<=100?p.level:null,
        ability:typeof p.ability==='string'?p.ability.slice(0,100):'',
        heldItem:typeof p.heldItem==='string'?p.heldItem.slice(0,100):'',
        pokerus:['unknown','never','active','cured'].includes(p.pokerus)?p.pokerus:'unknown',
        moves:(p.moves||[]).slice(0,4),tags:[]};
    });
    const allowedGames=['shield','sword','lets-go-pikachu','lets-go-eevee','legends-za'];
    if(!allowedGames.includes(data.game)||!['battle','cozy'].includes(data.theme))throw Error('Backup settings are invalid.');
    if(!confirm('Replace your current '+team.length+' Pokémon with the '+restored.length+' in this backup?')){status.textContent='Import cancelled.';return}
    // Write only after the entire backup has been checked and confirmed.
    localStorage.setItem('battleBuddyTeam',JSON.stringify(restored));
    localStorage.setItem('battleBuddyGame',data.game);
    team=restored;game=data.game;$('game').value=game;updateGameLabel();
    setTheme(data.theme);renderTeam();editingTeamIndex=-1;
    status.textContent='Restored '+team.length+' Pokémon and your preferences.';
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
