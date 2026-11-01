/* Pokémon Battle Buddy v1.24.0 — Legends: Z-A Donut Lab */
(()=> {
  'use strict';
  const INVENTORY_KEY='battleBuddyZABerryInventory';
  const HISTORY_KEY='battleBuddyDonutHistory';
  const FLAVORS=['Sweet','Spicy','Sour','Bitter','Fresh'];
  // Ingredient values: [sweet, spicy, sour, bitter, fresh, level boost, calories].
  // Hyper Berry values are sourced from Serebii's Ansha's Donuts reference.
  const BERRIES=[
    ['Hyper Cheri',[0,40,0,0,0],5,80],
    ['Hyper Chesto',[0,0,0,0,40],3,100],
    ['Hyper Pecha',[40,0,0,0,0],2,100],
    ['Hyper Rawst',[0,0,0,40,0],3,110],
    ['Hyper Aspear',[0,0,40,0,0],4,90],
    ['Hyper Oran',[10,20,15,15,0],6,90],
    ['Hyper Persim',[0,15,15,10,20],4,110],
    ['Hyper Lum',[20,15,10,0,15],3,110],
    ['Hyper Sitrus',[15,10,0,20,15],4,120],
    ['Hyper Pomeg',[30,35,0,0,5],7,140],
    ['Hyper Kelpsy',[5,0,0,30,35],5,160],
    ['Hyper Qualot',[35,0,30,5,0],4,160],
    ['Hyper Hondew',[0,5,35,0,30],6,150],
    ['Hyper Grepa',[0,60,25,0,5],8,140],
    ['Hyper Tamato',[5,25,0,0,60],6,180],
    ['Hyper Occa',[60,0,0,5,25],5,180],
    ['Hyper Passho',[25,0,5,60,0],6,200],
    ['Hyper Wacan',[0,5,60,25,0],7,160]
  ].map(([name,flavor,level,calories])=>({name,flavor,level,calories,score:flavor.reduce((a,b)=>a+b,0)}));
  const $=id=>document.getElementById(id);
  const section=$('donuts');
  if(!section)return;
  let selected=null;
  function getInventory(){
    const defaults={};
    BERRIES.forEach(b=>defaults[b.name]=0);
    try{
      const saved=JSON.parse(localStorage.getItem(INVENTORY_KEY)||'{}');
      return Object.fromEntries(BERRIES.map(b=>[b.name,Math.max(0,Math.floor(Number(saved[b.name]??defaults[b.name])||0))]));
    }catch(error){return defaults}
  }
  function starsFor(score){return score>=960?5:score>=700?4:score>=350?3:score>=240?2:score>=120?1:0}
  function analyze(counts){
    const ingredients=BERRIES.filter(b=>(counts[b.name]||0)>0);
    const totals=[0,0,0,0,0];let baseLevel=0,baseCalories=0,total=0;
    ingredients.forEach(b=>{const n=counts[b.name];total+=n;baseLevel+=b.level*n;baseCalories+=b.calories*n;b.flavor.forEach((v,i)=>totals[i]+=v*n)});
    const flavorScore=totals.reduce((a,b)=>a+b,0),stars=starsFor(flavorScore),multiplier=(10+stars)/10;
    const maxFlavor=Math.max(...totals);
    const dominant=totals.map((v,i)=>v===maxFlavor&&v>0?FLAVORS[i]:null).filter(Boolean);
    return {total,baseLevel,baseCalories,flavorScore,stars,multiplier,level:Math.floor(baseLevel*multiplier),calories:Math.floor(baseCalories*multiplier),totals,dominant};
  }
  function recipeLabel(counts){return BERRIES.filter(b=>counts[b.name]>0).map(b=>'×'+counts[b.name]+' '+b.name).join(' + ')}
  function enumerate(capacity,inventory){
    const available=BERRIES.filter(b=>inventory[b.name]>0),counts={},results=[];
    function walk(index,remaining){
      if(remaining===0){const result=analyze(counts);if(result.total===capacity)results.push({counts:{...counts},...result});return}
      if(index>=available.length)return;
      const berry=available[index],max=Math.min(inventory[berry.name],remaining);
      for(let n=0;n<=max;n++){if(n)counts[berry.name]=n;else delete counts[berry.name];walk(index+1,remaining-n)}
      delete counts[berry.name];
    }
    walk(0,capacity);
    return results;
  }
  function renderSummary(inventory){
    const total=Object.values(inventory).reduce((a,b)=>a+b,0);
    const available=BERRIES.filter(b=>inventory[b.name]>0).length;
    $('donutInventorySummary').innerHTML='<strong>'+total+'</strong> Hyper Berries available <span>· '+available+' ingredient types · '+$('donutSlots').value+' slots selected</span>';
  }
  function statsMarkup(r){
    const stars='★'.repeat(r.stars)+'☆'.repeat(5-r.stars);
    return '<div class="donut-metrics"><div><strong>+'+r.level+'</strong><span>Level boost</span></div><div><strong>'+r.calories.toLocaleString()+'</strong><span>Calories</span></div><div><strong>'+r.flavorScore+'</strong><span>Flavor score</span></div></div><div class="donut-stars" aria-label="'+r.stars+' stars">'+stars+' <small>'+r.stars+'/5</small></div><p class="donut-dominant">Dominant flavor'+(r.dominant.length===1?'':'s')+': '+(r.dominant.join(' / ')||'None')+'</p>';
  }
  function showSelected(recipe){
    selected=recipe;$('donutSelected').hidden=false;
    $('donutSelectedDetails').innerHTML='<p class="donut-recipe">'+recipeLabel(recipe.counts)+'</p>'+statsMarkup(recipe);
    $('donutMakeStatus').textContent='Preview only. No berries have been deducted.';
  }
  function optimize(){
    const capacity=Number($('donutSlots').value),goal=$('donutGoal').value,inventory=getInventory();
    renderSummary(inventory);
    const recipes=enumerate(capacity,inventory);
    if(!recipes.length){$('donutResults').innerHTML='<p class="hint">You do not have enough Hyper Berries for '+capacity+' slots. Lower the butter capacity or collect more berries.</p>';return}
    const score=r=>goal==='energy'?r.calories:goal==='stars'?r.stars*100000+r.level*100+r.calories:r.level*100000+r.calories;
    recipes.sort((a,b)=>score(b)-score(a)||b.flavorScore-a.flavorScore||b.calories-a.calories);
    const top=recipes.slice(0,12);
    $('donutResults').innerHTML='<h3>Best recipes for your inventory</h3><p class="hint">Ranked by '+(goal==='energy'?'calories':goal==='stars'?'star tier, then level boost':'level boost, then calories')+'. These are previews; nothing is spent until you mark a donut as made.</p>'+top.map((r,i)=>'<article class="donut-recipe-card"><div class="donut-recipe-top"><strong>#'+(i+1)+' · '+r.stars+'★</strong><span>+'+r.level+' levels · '+r.calories.toLocaleString()+' cal</span></div><p>'+recipeLabel(r.counts)+'</p><button type="button" data-recipe-index="'+i+'">Select recipe</button></article>').join('');
    $('donutResults').querySelectorAll('[data-recipe-index]').forEach(button=>button.addEventListener('click',()=>showSelected(top[Number(button.dataset.recipeIndex)])));
    showSelected(top[0]);
  }
  function makeSelected(){
    if(!selected)return;
    const inventory=getInventory();
    for(const [name,amount] of Object.entries(selected.counts)){if((inventory[name]||0)<amount){$('donutMakeStatus').textContent='Inventory changed; run the optimizer again.';return}}
    const recipe=recipeLabel(selected.counts);
    if(!confirm('Mark this donut as made and deduct these berries?\n\n'+recipe+'\n\n+'+selected.level+' levels · '+selected.calories+' calories'))return;
    Object.entries(selected.counts).forEach(([name,amount])=>inventory[name]-=amount);
    try{
      localStorage.setItem(INVENTORY_KEY,JSON.stringify(inventory));
      const history=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      history.unshift({madeAt:new Date().toISOString(),recipe,level:selected.level,calories:selected.calories,stars:selected.stars});
      localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)));
    }catch(error){$('donutMakeStatus').textContent='Could not save. Your inventory was not changed in the tracker.';return}
    window.dispatchEvent(new CustomEvent('battleBuddyBerryInventoryChanged'));
    $('donutMakeStatus').textContent='Donut marked as made. Ingredients deducted and berry tracker updated.';
    selected=null;$('donutSelected').hidden=true;renderSummary(getInventory());optimize();
  }
  $('donutOptimize').addEventListener('click',optimize);
  $('donutSlots').addEventListener('change',()=>{renderSummary(getInventory());$('donutResults').innerHTML='<p class="hint">Capacity changed. Tap Find best recipes to recalculate.</p>';});
  $('donutMake').addEventListener('click',makeSelected);
  renderSummary(getInventory());
})();