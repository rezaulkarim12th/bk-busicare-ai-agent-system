import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('authenticated portal exposes the AI Content Studio and invokes the protected function', async () => {
  const source = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
  assert.match(source, /AI Content Studio/);
  assert.match(source, /id="ai-content-form"/);
  assert.match(source, /supabase\.functions\.invoke\('ai-content'/);
  assert.match(source, /workspace_id: activeId/);
  assert.match(source, /save-ai-draft/);
  assert.match(source, /status: 'Draft'/);
  assert.match(source, /activeRole === 'viewer'/);
  assert.match(source, /published or কাউকে message/);
});
