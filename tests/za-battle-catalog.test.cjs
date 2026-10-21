const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'za-battle-catalog.json'), 'utf8'));

test('ZA catalog maps all 232 Lumiose Pokédex numbers', () => {
  const numbers = new Set(catalog.species.map(p => p.lumioseDex).filter(Number.isInteger));
  assert.equal(numbers.size, 232);
  for (let dex = 1; dex <= 232; dex++) assert.ok(numbers.has(dex), 'Missing Lumiose Dex #' + dex);
});
test('species/form IDs are unique and types are valid', () => {
  const ids = catalog.species.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const validTypes = new Set(['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']);
  for (const p of catalog.species) {
    assert.ok(p.id && p.name && p.displayName && p.formKey);
    assert.ok(Array.isArray(p.types) && p.types.length >= 1);
    for (const type of p.types) assert.ok(validTypes.has(type), 'Invalid type ' + type + ' on ' + p.displayName);
  }
});
test('every move has source-linked ZA timing and distance data', () => {
  const ids = catalog.moves.map(m => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const move of catalog.moves) {
    assert.ok(move.name && move.type && move.category && move.sourceUrl);
    assert.ok(Number.isFinite(move.basePower) && move.basePower >= 0);
    assert.ok(Number.isFinite(move.baseCooldownSeconds) && move.baseCooldownSeconds > 0);
    assert.ok(Number.isFinite(move.windUpFrames) && move.windUpFrames >= 0);
    assert.ok(Number.isFinite(move.attackLoopFrames) && move.attackLoopFrames >= 0);
    assert.ok(Number.isFinite(move.distance?.min) && Number.isFinite(move.distance?.max));
  }
});
test('incomplete forms and learnsets are not marked ranking-ready', () => {
  assert.equal(catalog.coverage.readyForAutomaticRanking, false);
  assert.equal(catalog.coverage.learnsets.complete, false);
  assert.equal(catalog.coverage.forms.complete, false);
});
