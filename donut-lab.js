/* Pokémon Battle Buddy v1.24.0 — Legends: Z-A Donut Lab */
(()=> {
  'use strict';
  const INVENTORY_KEY='battleBuddyZABerryInventory';
  const HISTORY_KEY='battleBuddyDonutHistory';
  const FLAVORS=['Sweet','Spicy','Sour','Bitter','Fresh'];
  // Ingredient values: [sweet, spicy, sour, bitter, fresh, level boost, calories].
  // Regular and Hyper Berry values are sourced from Serebii's Ansha's Donuts reference.
  const BERRIES=[
    ['Cheri',[0,10,0,0,0],1,60],['Chesto',[0,0,0,0,10],1,60],['Pecha',[10,0,0,0,0],1,60],
    ['Rawst',[0,0,0,10,0],1,60],['Aspear',[0,0,10,0,0],1,60],['Oran',[0,5,5,5,5],1,60],
    ['Persim',[5,5,5,0,5],1,60],['Lum',[5,5,0,5,5],2,65],['Sitrus',[5,0,5,5,5],2,65],
    ['Pomeg',[10,10,0,10,0],2,65],['Kelpsy',[0,0,10,10,10],2,65],['Qualot',[10,10,10,0,0],2,65],
    ['Hondew',[0,10,0,10,10],2,65],['Grepa',[10,0,10,0,10],2,65],['Tamato',[0,15,0,0,10],2,65],
    ['Occa',[10,15,0,0,0],3,70],['Passho',[0,0,0,10,15],3,70],['Wacan',[15,0,10,0,0],3,70],
    ['Rindo',[0,10,0,15,0],3,70],['Yache',[0,0,15,0,10],3,70],['Kebia',[0,0,10,0,15],3,70],
    ['Shuca',[15,10,0,0,0],3,70],['Coba',[0,0,0,15,10],3,70],['Tanga',[0,20,10,0,0],3,70],
    ['Charti',[0,10,0,0,20],3,70],['Kasib',[20,0,0,0,10],3,70],['Haban',[10,0,0,20,0],3,70],
    ['Colbur',[0,0,20,10,0],3,70],['Babiri',[0,25,0,0,10],3,70],['Chilan',[10,0,0,0,25],3,70],
    ['Roseli',[25,0,0,10,0],3,70],
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
  ].map(([name,flavor,level,calories])=>({name,flavor,level,calories,hyper:name.startsWith('Hyper '),score:flavor.reduce((a,b)=>a+b,0)}));
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
  function enumerateExact(capacity,inventory,pool){
    const available=pool.filter(item=>(inventory[item.name]||0)>0),counts={},results=[];
    function walk(index,remaining){
      if(remaining===0){const result=analyze(counts);results.push({counts:{...counts},...result});return}
      if(index>=available.length)return;
      const berry=available[index],max=Math.min(inventory[berry.name]||0,remaining);
      for(let n=0;n<=max;n++){if(n)counts[berry.name]=n;else delete counts[berry.name];walk(index+1,remaining-n)}
      delete counts[berry.name];
    }
    walk(0,capacity);return results;
  }
  function unitCost(berry,stock){
    return berry.hyper?15+(45/(stock+1)):1+(6/(stock+1));
  }
  function enumerateCheapest(capacity,inventory){
    const available=BERRIES.filter(item=>(inventory[item.name]||0)>0)
      .sort((a,b)=>unitCost(a,inventory[a.name])-unitCost(b,inventory[b.name]));
    const counts={},results=[],limit=12;
    const dp=Array.from({length:available.length+1},()=>Array(capacity+1).fill(-Infinity));
    dp[available.length][0]=0;
    for(let i=available.length-1;i>=0;i--){
      const item=available[i],stock=Math.min(capacity,inventory[item.name]||0);
      for(let k=0;k<=capacity;k++)for(let n=0;n<=Math.min(stock,k);n++){
        const tail=dp[i+1][k-n];
        if(tail>-Infinity)dp[i][k]=Math.max(dp[i][k],tail+n*item.score);
      }
    }
    function saveResult(cost){
      const result=analyze(counts);if(result.stars<3)return;
      results.push({counts:{...counts},...result,resourceCost:cost});
      results.sort((a,b)=>a.resourceCost-b.resourceCost||a.level-b.level||b.calories-a.calories);
      if(results.length>limit)results.length=limit;
    }
    function walk(index,used,flavorScore,cost){
      if(flavorScore>=350){saveResult(cost);return}
      if(used>=capacity||index>=available.length)return;
      if(flavorScore+dp[index][capacity-used]<350)return;
      const item=available[index],max=Math.min(inventory[item.name]||0,capacity-used);
      const each=unitCost(item,inventory[item.name]);
      for(let n=0;n<=max;n++){
        if(n)counts[item.name]=n;else delete counts[item.name];
        walk(index+1,used+n,flavorScore+n*item.score,cost+n*each);
      }
      delete counts[item.name];
    }
    walk(0,0,0,0);return results;
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
    let recipes=goal==='cost'?enumerateCheapest(capacity,inventory):enumerateExact(capacity,inventory,BERRIES.filter(item=>item.hyper));
    if(!recipes.length){
      $('donutResults').innerHTML=goal==='cost'
        ?'<p class="hint">No recipe in your current inventory reaches 3 stars using up to '+capacity+' berries. Increase the butter capacity or collect more high-flavor ingredients.</p>'
        :'<p class="hint">You do not have enough Hyper Berries for '+capacity+' slots. Lower the butter capacity or collect more berries.</p>';
      $('donutSelected').hidden=true;selected=null;return;
    }
    if(goal!=='cost'){
      const score=r=>goal==='energy'?r.calories:goal==='stars'?r.stars*100000+r.level*100+r.calories:r.level*100000+r.calories;
      recipes.sort((a,b)=>score(b)-score(a)||b.flavorScore-a.flavorScore||b.calories-a.calories);
      recipes=recipes.slice(0,12);
    }
    const top=recipes.slice(0,12);
    const description=goal==='cost'
      ?'Lowest estimated resource cost among 3-star recipes. Regular berries are preferred; scarce Hyper berries carry a higher cost. The optimizer may use fewer than '+capacity+' berries.'
      :goal==='energy'?'Highest calories using Hyper Berries.':goal==='stars'?'Highest star tier, then level boost using Hyper Berries.':'Highest level boost using Hyper Berries.';
    $('donutResults').innerHTML='<h3>'+(goal==='cost'?'Cheapest qualifying recipes':'Best Hyper Berry recipes')+'</h3><p class="hint">'+description+' Nothing is spent until you mark a donut as made.</p>'+top.map((r,i)=>'<article class="donut-recipe-card"><div class="donut-recipe-top"><strong>#'+(i+1)+' · '+r.stars+'★</strong><span>+'+r.level+' levels · '+r.calories.toLocaleString()+' cal</span></div><p>'+recipeLabel(r.counts)+'</p>'+(r.resourceCost!==undefined?'<p class="hint">Estimated resource cost: '+r.resourceCost.toFixed(1)+' points</p>':'')+'<button type="button" data-recipe-index="'+i+'">Select recipe</button></article>').join('');
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
  // Integrate with the app's existing tab navigation without changing its core handler.
  document.querySelectorAll('.tab').forEach(button=>{
    if(button.dataset.tab==='donuts'){button.addEventListener('click',()=>{['lookup','raid','team','bank','items','profile','berries'].forEach(id=>{const el=$(id);if(el)el.hidden=true});section.hidden=false;});}
    else button.addEventListener('click',()=>{section.hidden=true;});
  });
  $('donutOptimize').addEventListener('click',optimize);
  $('donutSlots').addEventListener('change',()=>{renderSummary(getInventory());$('donutResults').innerHTML='<p class="hint">Capacity changed. Tap Find best recipes to recalculate.</p>';});
  $('donutMake').addEventListener('click',makeSelected);
  renderSummary(getInventory());
})();