const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('function compareVersionStrings(');
const end = source.indexOf('\nasync function checkForUpdates', start);
assert.ok(start >= 0 && end > start, 'Version comparison helper found');
const compareVersionStrings = new Function(source.slice(start, end) + '\nreturn compareVersionStrings;')();
test('newer version compares greater', () => {
  assert.equal(compareVersionStrings('1.22.3', '1.22.2'), 1);
  assert.equal(compareVersionStrings('1.23.0', '1.22.9'), 1);
});
test('same version compares equal', () => {
  assert.equal(compareVersionStrings('1.22.2', '1.22.2'), 0);
  assert.equal(compareVersionStrings('1.22.2.0', '1.22.2'), 0);
});
test('older versions never qualify as updates', () => {
  assert.equal(compareVersionStrings('1.22.1', '1.22.2'), -1);
  assert.equal(compareVersionStrings('1.19.3', '1.22.2'), -1);
});
test('leading v is accepted', () => assert.equal(compareVersionStrings('v1.22.3', '1.22.2'), 1));
