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
  assert.match(source, /activeRole==='viewer'/);
  assert.match(source, /কাউকে message পাঠায় না/);
});

test('AI endpoint enforces workspace membership and role server-side', async () => {
  const source = await readFile(new URL('../supabase/functions/ai-content/index.ts', import.meta.url), 'utf8');
  assert.match(source, /workspace_id/);
  assert.match(source, /from\("workspace_members"\)/);
  assert.match(source, /!\["owner", "admin", "member"\]\.includes\(membership\.role\)/);
  assert.match(source, /membership with content-generation permission/i);
  assert.match(source, /readLimitedBody/);
});

test('workspace and team endpoints reject oversized or non-object JSON bodies', async () => {
  for (const path of ['../supabase/functions/create-workspace/index.ts', '../supabase/functions/manage-workspace-member/index.ts']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /MAX_BODY_BYTES = 12_000/);
    assert.match(source, /readJsonObject/);
    assert.match(source, /Request too large/);
    assert.match(source, /Invalid JSON object/);
  }
});
