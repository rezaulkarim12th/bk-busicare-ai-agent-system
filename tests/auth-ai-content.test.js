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
  assert.doesNotMatch(source, /functions\.invoke\(['\"](?:publish|send-message)/i);
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

test('AI endpoint parses standard Bearer authorization headers and joins prompt/output lines', async () => {
  const source = await readFile(new URL('../supabase/functions/ai-content/index.ts', import.meta.url), 'utf8');
  assert.ok(source.includes(String.raw`match(/^Bearer\s+(.+)$/i)`));
  assert.ok(source.includes(String.raw`.join("\n")`));
  const bearerPattern = /^Bearer\s+(.+)$/i;
  assert.equal('Bearer eyJhbGciOiJIUzI1NiJ9'.match(bearerPattern)?.[1], 'eyJhbGciOiJIUzI1NiJ9');
  assert.equal('Bearer'.match(bearerPattern), null);
});

test('AI Content Studio saves and restores unfinished form drafts per workspace', async () => {
  const source = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
  assert.ok(source.includes('sessionStorage.setItem(key'));
  assert.ok(source.includes('sessionStorage.getItem(key'));
  assert.ok(source.includes('persistAiFormDraft(root.querySelector(\'#ai-content-form\'))'));
  assert.ok(source.includes("currentAiForm.addEventListener('input'"));
  assert.ok(source.includes("currentAiForm.addEventListener('change'"));
  assert.ok(source.includes('bkbusicare-ai-form-v1:'));
  assert.ok(source.includes('sessionStorage.removeItem(draftKey)'));
});


test('AI endpoint allows browser preflight headers and validates JWT in its handler', async () => {
  const source = await readFile(new URL('../supabase/functions/ai-content/index.ts', import.meta.url), 'utf8');
  const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  assert.match(source, /Access-Control-Allow-Headers[^\\n]*x-client-info/);
  assert.match(source, /req\.method === "OPTIONS"/);
  assert.match(source, /auth\.getUser\(token\)/);
  assert.match(source, /workspace_members/);
  assert.match(config, /\\[functions\.ai-content\\][\\s\\S]*?verify_jwt = false/);
});
