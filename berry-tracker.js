/* Pokémon Battle Buddy v1.23.3 — ZA Berry Inventory */
(()=>{
  const KEY='battleBuddyZABerryInventory';
  const START={
    "Cheri":14,"Chesto":32,"Pecha":33,"Rawst":36,"Aspear":37,"Oran":36,"Persim":20,"Lum":16,"Sitrus":42,
    "Kelpsy":17,"Pomeg":0,"Qualot":4,"Hondew":8,"Grepa":0,"Tamato":13,"Occa":8,"Wacan":7,"Rindo":5,"Yache":3,
    "Kebia":3,"Shuca":2,"Coba":7,"Tanga":1,"Charti":1,"Kasib":2,"Haban":5,"Colbur":3,"Babiri":1,
    "Chilan":6,"Roseli":1,
    "Hyper Cheri":4,"Hyper Chesto":7,"Hyper Pecha":14,"Hyper Rawst":8,"Hyper Aspear":4,
    "Hyper Oran":3,"Hyper Persim":1,"Hyper Lum":3,"Hyper Sitrus":3,
    "Hyper Pomeg":1,"Hyper Kelpsy":1,"Hyper Qualot":1,"Hyper Hondew":1
  };
  const regular=Object.keys(START).filter(name=>!name.startsWith('Hyper '));
  const hyper=Object.keys(START).filter(name=>name.startsWith('Hyper '));
  let counts={...START},view='regular';
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
      for(const name of Object.keys(START)){
        const n=Number(saved[name]);
        if(Number.isInteger(n)&&n>=0&&n<=9999)counts[name]=n;
      }
    }else localStorage.setItem(KEY,JSON.stringify(counts));
  }catch(error){console.warn('Berry inventory could not be loaded:',error)}
  const $=id=>document.getElementById(id);
  const section=$('berries');
  if(!section)return;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(counts))}catch(error){$('berryStatus').textContent='Could not save inventory on this device.'}}
  function render(){
    const totalRegular=regular.reduce((sum,name)=>sum+counts[name],0);
    const totalHyper=hyper.reduce((sum,name)=>sum+counts[name],0);
    $('berryTotals').innerHTML=[
      '<div class="berry-summary-card"><strong>'+totalRegular+'</strong><span>Regular berries</span></div>',
      '<div class="berry-summary-card"><strong>'+totalHyper+'</strong><span>Hyper berries</span></div>',
      '<div class="berry-summary-card"><strong>'+(totalRegular+totalHyper)+'</strong><span>Total berries</span></div>'
    ].join('');
    const query=$('berrySearch').value.trim().toLowerCase();
    const names=(view==='all'?[...regular,...hyper]:view==='hyper'?hyper:regular).filter(name=>name.toLowerCase().includes(query));
    const list=$('berryList');list.replaceChildren();
    if(!names.length){const empty=document.createElement('p');empty.className='hint';empty.textContent='No berries match that search.';list.append(empty);return}
    names.forEach(name=>{
      const row=document.createElement('article');row.className='berry-row';
      const info=document.createElement('div');info.className='berry-row-info';
      const strong=document.createElement('strong');strong.textContent=name;
      info.append(strong);
      const controls=document.createElement('div');controls.className='berry-row-qty';
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.disabled=counts[name]===0;minus.setAttribute('aria-label','Use one '+name);
      minus.addEventListener('click',()=>change(name,-1));
      const output=document.createElement('output');output.textContent=counts[name];
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Add one '+name);
      plus.addEventListener('click',()=>change(name,1));
      controls.append(minus,output,plus);row.append(info,controls);list.append(row);
    });
  }
  function change(name,delta){
    const next=counts[name]+delta;
    if(next<0||next>9999)return;
    counts[name]=next;save();render();
    $('berryStatus').textContent=name+(delta>0?' added.':' used.')+' Inventory saved.';
  }
  document.querySelectorAll('[data-berry-view]').forEach(button=>button.addEventListener('click',()=>{
    view=button.dataset.berryView;
    document.querySelectorAll('[data-berry-view]').forEach(other=>other.classList.toggle('active',other===button));
    render();
  }));
  $('berrySearch').addEventListener('input',render);
  $('berryCopy').addEventListener('click',async()=>{
    const text=['Pokémon Legends: Z-A Berry Inventory','',...regular.map(name=>name+': '+counts[name]),'',...hyper.map(name=>name+': '+counts[name])].join('\n');
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
      else throw Error('Clipboard API unavailable');
      $('berryStatus').textContent='Inventory copied. Paste it into ChatGPT!';
    }catch(error){
      const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');
      area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();
      const copied=document.execCommand('copy');area.remove();
      $('berryStatus').textContent=copied?'Inventory copied. Paste it into ChatGPT!':'Copy unavailable. Select the inventory below manually.';
    }
  });
  $('berryReset').addEventListener('click',()=>{
    if(!confirm('Restore the starting berry counts? This will replace your current tracker quantities.'))return;
    counts={...START};save();render();$('berryStatus').textContent='Starting inventory restored.';
  });
  // The main app's original tab handler runs first; this listener adds this new
  // tab to its navigation without modifying the established navigation logic.
  document.querySelector('[data-tab="berries"]').addEventListener('click',()=>{
    ['lookup','raid','team','bank','items','profile'].forEach(id=>{const el=$(id);if(el)el.hidden=true});
    section.hidden=false;
  });
  document.querySelectorAll('.tab:not([data-tab="berries"])').forEach(button=>button.addEventListener('click',()=>{section.hidden=true}));
  render();
})();