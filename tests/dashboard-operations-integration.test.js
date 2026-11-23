import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dashboard imports and renders the sales operations core', async () => {
  const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /from ['"]\.\/operations\.js['"]/);
  assert.match(source, /getSalesMetrics\(data\.leads\)/);
  assert.match(source, /getFollowUpQueue\(data\.leads\)/);
  assert.match(source, /recommendNextAction\(lead\)/);
  assert.match(source, /Won Revenue/);
  assert.match(source, /Win Rate/);
  assert.match(source, /<h3>Follow-ups<\/h3>/);
});