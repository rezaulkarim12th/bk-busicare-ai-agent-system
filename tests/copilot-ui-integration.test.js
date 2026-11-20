import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('content planner exposes the safe AI copilot prompt builder', async () => {
  const source=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(source,/from ['"]\.\/copilot\.js['"]/);
  assert.match(source,/buildContentPrompt\(/);
  assert.match(source,/AI Copilot/);
  assert.match(source,/লাইভ AI সংযোগ এখনো সক্রিয় নয়/);
  assert.match(source,/copy-copilot-prompt/);
});
