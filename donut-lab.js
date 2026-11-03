/* Pokémon Battle Buddy v1.24.2 — Legends: Z-A Donut Lab */
(()=> {
  'use strict';
  const INVENTORY_KEY='battleBuddyZABerryInventory';
  const HISTORY_KEY='battleBuddyDonutHistory';
  const FLAVORS=['Sweet','Spicy','Sour','Bitter','Fresh'];
  // Ingredient values: [sweet, spicy, sour, bitter, fresh, level boost, calories].
  // Regular and Regular and Hyper Berry values are sourced from Serebii's Ansha's Donuts reference.
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
    ['Hyper Wacan',[0,5,60,25,0],7,160],
    ['Hyper Rindo',[15,55,0,5,25],9,210],
    ['Hyper Yache',[25,0,5,15,55],7,250],
    ['Hyper Chople',[55,5,15,25,0],6,250],
    ['Hyper Kebia',[0,15,25,55,5],7,270],
    ['Hyper Shuca',[5,25,55,0,15],8,230]
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
  function candidateCompare(a,b,goal){
    if(goal==='cost')return a.resourceCost-b.resourceCost||b.baseLevel-a.baseLevel||b.calories-a.calories||b.score-a.score;
    if(goal==='energy')return b.calories-a.calories||b.score-a.score||b.baseLevel-a.baseLevel;
    return b.baseLevel-a.baseLevel||b.calories-a.calories||b.score-a.score;
  }
  function addCandidate(map,key,candidate,goal,limit=12){
    let list=map.get(key);
    if(!list){list=[];map.set(key,list)}
    list.push(candidate);
    list.sort((a,b)=>candidateCompare(a,b,goal));
    if(list.length>limit)list.length=limit;
  }
  async function findTopRecipes(capacity,inventory,goal,onProgress){
    const available=(goal==='cost'?BERRIES:BERRIES.filter(item=>item.hyper))
      .filter(item=>(inventory[item.name]||0)>0);
    if(!available.length)return [];
    const maxItemScore=Math.max(...available.map(item=>item.score));
    const scoreLimit=goal==='cost'?350:maxItemScore*capacity;
    // Dynamic programming by berry count and accumulated flavor score.
    // Keep only the best 12 partial recipes per state; future ingredients affect
    // candidates in the same state identically, so discarded paths cannot enter the top 12.
    let states=new Map([[0,[{used:0,score:0,baseLevel:0,calories:0,counts:{},resourceCost:0}]]]);
    for(let index=0;index<available.length;index++){
      const item=available[index],stock=Math.min(capacity,inventory[item.name]||0);
      const next=new Map();
      for(const [key,list] of states){
        const used=Math.floor(key/(scoreLimit+1)),score=key%(scoreLimit+1);
        for(const candidate of list){
          const max=Math.min(stock,capacity-used);
          for(let n=0;n<=max;n++){
            const nextUsed=used+n;
            const actualScore=score+n*item.score;
            const nextScore=goal==='cost'?Math.min(scoreLimit,actualScore):actualScore;
            const nextKey=nextUsed*(scoreLimit+1)+nextScore;
            const counts=n?{...candidate.counts,[item.name]:n}:candidate.counts;
            addCandidate(next,nextKey,{
              used:nextUsed,score:nextScore,baseLevel:candidate.baseLevel+n*item.level,
              calories:candidate.calories+n*item.calories,counts,
              resourceCost:candidate.resourceCost+(goal==='cost'?n*unitCost(item,inventory[item.name]):0)
            },goal);
          }
        }
      }
      states=next;
      if(onProgress)onProgress(index+1,available.length);
      // Give mobile browsers a chance to paint progress and handle input.
      if(index%3===2)await new Promise(resolve=>setTimeout(resolve,0));
    }
    const candidates=[];
    for(const [key,list] of states){
      const used=Math.floor(key/(scoreLimit+1)),score=key%(scoreLimit+1);
      if(goal==='cost'){
        if(score<350||used<1||used>capacity)continue;
      }else if(used!==capacity)continue;
      for(const candidate of list){
        const result=analyze(candidate.counts);
        if(result.stars<3)continue;
        candidates.push({...result,counts:candidate.counts,resourceCost:candidate.resourceCost});
      }
    }
    const finalCompare=(a,b)=>{
      if(goal==='cost')return a.resourceCost-b.resourceCost||b.level-a.level||b.calories-a.calories||b.score-a.score;
      const score=r=>goal==='energy'?r.calories:goal==='stars'?r.stars*100000+r.level*100+r.calories:r.level*100000+r.calories;
      return score(b)-score(a)||b.score-a.score||b.calories-a.calories;
    };
    candidates.sort(finalCompare);
    return candidates.slice(0,12);
  }
  function renderSummary(inventory){
    const hyper=BERRIES.filter(b=>b.hyper);
    const regular=BERRIES.filter(b=>!b.hyper);
    const hyperTotal=hyper.reduce((sum,b)=>sum+(inventory[b.name]||0),0);
    const regularTotal=regular.reduce((sum,b)=>sum+(inventory[b.name]||0),0);
    const hyperTypes=hyper.filter(b=>(inventory[b.name]||0)>0).length;
    $('donutInventorySummary').innerHTML='<strong>'+hyperTotal+'</strong> Hyper Berries available <span>· '+hyperTypes+' Hyper types · '+regularTotal+' regular berries · '+$('donutSlots').value+' slots selected</span>';
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
  async function optimize(){
    const button=$('donutOptimize'),resultsEl=$('donutResults');
    if(button.disabled)return;
    button.disabled=true;
    const originalLabel=button.textContent;
    button.textContent='Searching recipes…';
    resultsEl.innerHTML='<p class="hint" role="status">Finding the best combinations with a fast recipe search…</p>';
    $('donutSelected').hidden=true;selected=null;
    try{
      const capacity=Number($('donutSlots').value),goal=$('donutGoal').value,inventory=getInventory();
      renderSummary(inventory);
      const top=await findTopRecipes(capacity,inventory,goal,(done,total)=>{
        resultsEl.innerHTML='<p class="hint" role="status">Optimizing '+done+' of '+total+' available ingredient types…</p>';
      });
      if(!top.length){
        resultsEl.innerHTML=goal==='cost'
          ?'<p class="hint">No recipe in your current inventory reaches 3 stars using up to '+capacity+' berries. Increase the butter capacity or collect more high-flavor ingredients.</p>'
          :'<p class="hint">You do not have enough Hyper Berries for '+capacity+' slots. Lower the butter capacity or collect more berries.</p>';
        $('donutSelected').hidden=true;selected=null;return;
      }
      const description=goal==='cost'
        ?'Lowest estimated resource cost among 3-star recipes. Regular berries are preferred; scarce Hyper berries carry a higher cost. The optimizer may use fewer than '+capacity+' berries.'
        :goal==='energy'?'Highest calories using Hyper Berries.':goal==='stars'?'Highest star tier, then level boost using Hyper Berries.':'Highest level boost using Hyper Berries.';
      resultsEl.innerHTML='<h3>'+(goal==='cost'?'Cheapest qualifying recipes':'Best Hyper Berry recipes')+'</h3><p class="hint">'+description+' Nothing is spent until you mark a donut as made.</p>'+top.map((r,i)=>'<article class="donut-recipe-card"><div class="donut-recipe-top"><strong>#'+(i+1)+' · '+r.stars+'★</strong><span>+'+r.level+' levels · '+r.calories.toLocaleString()+' cal</span></div><p>'+recipeLabel(r.counts)+'</p>'+(r.resourceCost!==undefined?'<p class="hint">Estimated resource cost: '+r.resourceCost.toFixed(1)+' points</p>':'')+'<button type="button" data-recipe-index="'+i+'">Select recipe</button></article>').join('');
      resultsEl.querySelectorAll('[data-recipe-index]').forEach(recipeButton=>recipeButton.addEventListener('click',()=>showSelected(top[Number(recipeButton.dataset.recipeIndex)])));
      showSelected(top[0]);
    }catch(error){
      console.error('Donut recipe search failed:',error);
      const detail=String(error&&error.message||error);
      const errorNotice=document.createElement('p');
      errorNotice.className='hint';
      errorNotice.setAttribute('role','alert');
      errorNotice.textContent='The recipe search hit an error: '+detail+'. Your berries have not been changed. Please send me this error text.';
      resultsEl.replaceChildren(errorNotice);
    }finally{
      button.disabled=false;
      button.textContent=originalLabel;
    }
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
  $('donutGoal').addEventListener('change',()=>{$('donutResults').innerHTML='<p class="hint">Optimization goal changed. Tap Find best recipes to recalculate.</p>';});
  $('donutMake').addEventListener('click',makeSelected);
  renderSummary(getInventory());
})();