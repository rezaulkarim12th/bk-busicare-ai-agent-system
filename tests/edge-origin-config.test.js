import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const functions = [
  '../supabase/functions/create-workspace/index.ts',
  '../supabase/functions/manage-workspace-member/index.ts'
];

for (const path of functions) {
  test(`${path} fails closed when exact allowed origins are not configured`, async () => {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /Deno\.env\.get\(['"]APP_ALLOWED_ORIGINS['"]\)\s*\|\|\s*['"]['"]/);
    assert.match(source, /!origin\s*\|\|\s*allowedOrigins\.size\s*===\s*0\s*\|\|\s*!allowedOrigins\.has\(origin\)/);
    assert.doesNotMatch(source, /APP_ALLOWED_ORIGINS['"]\)\s*\|\|\s*['"]https:\/\//);
  });
}
