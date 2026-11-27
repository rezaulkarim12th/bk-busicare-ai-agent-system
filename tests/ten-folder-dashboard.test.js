import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('authenticated home dashboard exposes the approved ten workspace folders', async () => {
  const source = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
  for (const folder of ['AI Tools', 'Marketing', 'SEO Growth', 'Freelancing', 'Training', 'Projects', 'E-commerce', 'Team', 'Profile', 'Settings']) {
    assert.ok(source.includes("['" + folder + "'"), 'missing folder: ' + folder);
  }
  assert.match(source, /class="busicare-folder-grid"/);
  assert.match(source, /data-folder=/);
  assert.match(source, /busicare-bottom-nav/);
  assert.match(source, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test('dashboard preserves authenticated data workflows and workspace security', async () => {
  const source = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
  assert.match(source, /supabase\.from\('leads'\)/);
  assert.match(source, /supabase\.from\('content_items'\)/);
  assert.match(source, /workspace_id:activeId/);
  assert.match(source, /Row Level Security \(RLS\)/);
  assert.match(source, /data-page="Leads"/);
  assert.match(source, /data-page="Team"/);
});
