// Run with: node tests/move-advisor.test.cjs
// Extract pure scoring functions so the DOM-dependent application need not execute.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function expectedHits(');
const end=source.indexOf("\n$('compareNewMove').addEventListener",start);
assert(start>=0&&end>start,'Move advisor functions found');
const context={
  colors:Object.fromEntries(['normal','fire','water','grass','electric','flying','ghost','ground','fighting','poison','steel','dark','psychic','fairy','bug','rock','ice','dragon'].map(t=>[t,1])),
  rules:{fire:{grass:2,steel:2},electric:{water:2,flying:2},grass:{water:2,ground:2},ground:{electric:2,poison:2,rock:2,steel:2},ghost:{psychic:2},flying:{grass:2,fighting:2,bug:2},water:{fire:2,rock:2,ground:2},fighting:{normal:2,rock:2,steel:2,dark:2}},
  title:x=>x
};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);
function move(name,type,category,power,accuracy=100){
  return {name,type:{name:type},damage_class:{name:category},power,accuracy,meta:{drain:name==='giga-drain'?50:0},stat_changes:[],target:{name:'selected-pokemon'}};
}
function pokemon(attack,special,types){
  return {stats:[{stat:{name:'attack'},base_stat:attack},{stat:{name:'special-attack'},base_stat:special}],types:types.map(name=>({type:{name}})),_recordedLevel:38};
}
function check(label,p,c,existing,want,skip){
  const entries=existing.map((m,index)=>({name:m.name,move:m,index}));
  const choice=context.decideMoveReplacement(c,entries,p);
  const advice=context.explainMoveDecision(c,choice,p,null,false);
  assert.equal(advice.skip,skip,label+' skip');
  if(want)assert.equal(choice.name,want,label+' replacement');
  console.log('PASS '+label);
}
check('Cinderace Bounce',pokemon(116,65,['fire']),move('bounce','flying','physical',85,85),
  [move('flame-charge','fire','physical',50),move('double-kick','fighting','physical',30),move('pyro-ball','fire','physical',120,90),move('quick-attack','normal','physical',40)],null,true);
check('Cinderace Pyro Ball',pokemon(116,65,['fire']),move('pyro-ball','fire','physical',120,90),
  [move('flame-charge','fire','physical',50),move('double-kick','fighting','physical',30),move('fire-pledge','fire','special',80),move('quick-attack','normal','physical',40)],'fire-pledge',false);
check('Lanturn Discharge',pokemon(58,76,['water','electric']),move('discharge','electric','special',80),
  [move('charge','electric','status',null),move('bubble-beam','water','special',65),move('confuse-ray','ghost','status',null),move('spark','electric','physical',65)],'spark',false);
check('Cottonee Energy Ball',pokemon(27,37,['grass','fairy']),move('energy-ball','grass','special',90),
  [move('giga-drain','grass','special',75),move('razor-leaf','grass','physical',55,95),move('growth','normal','status',null),move('charm','fairy','status',null)],'razor-leaf',false);
check('Drifblim Self-Destruct',pokemon(80,90,['ghost','flying']),move('self-destruct','normal','physical',200),
  [move('gust','flying','special',40),move('shadow-ball','ghost','special',80),move('payback','dark','physical',50),move('phantom-force','ghost','physical',90)],null,true);
check('Diggersby Take Down',pokemon(56,50,['normal','ground']),move('take-down','normal','physical',90,85),
  [move('dig','ground','physical',80),move('bulldoze','ground','physical',60),move('flail','normal','physical',null),move('bounce','flying','physical',85,85)],null,true);
