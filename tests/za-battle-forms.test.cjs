const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'za-battle-catalog.json'), 'utf8'));

test('Altaria keeps separate regular and Mega battle typings', () => {
  const altaria = catalog.species.find(p => p.name === 'altaria' && p.formKey === 'standard');
  assert.ok(altaria, 'Regular Altaria exists');
  assert.deepEqual(altaria.types, ['dragon', 'flying']);
  const mega = altaria.battleForms.find(form => form.key === 'mega');
  assert.ok(mega, 'Mega Altaria form exists');
  assert.deepEqual(mega.types, ['dragon', 'fairy']);
  assert.ok(mega.sourceIds.includes('rotomlabs-legends-za-mega-altaria'));
});
test('form-aware typing preserves the base species record', () => {
  const altaria = catalog.species.find(p => p.name === 'altaria' && p.formKey === 'standard');
  assert.deepEqual(altaria.types, ['dragon', 'flying']);
  assert.equal(altaria.battleForms[0].displayName, 'Mega Altaria');
  assert.notDeepEqual(altaria.types, altaria.battleForms[0].types);
});
test('regional catalog coverage and move data remain valid', () => {
  const numbers = new Set(catalog.species.map(p => p.lumioseDex).filter(Number.isInteger));
  assert.equal(numbers.size, 232);
  const moveIds = catalog.moves.map(m => m.id);
  assert.equal(new Set(moveIds).size, moveIds.length);
  for (const m of catalog.moves) {
    assert.ok(m.sourceUrl);
    assert.ok(Number.isFinite(m.basePower));
    assert.ok(Number.isFinite(m.baseCooldownSeconds));
  }
});
