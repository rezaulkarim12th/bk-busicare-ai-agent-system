import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../supabase/functions/ai-assistant/index.ts', import.meta.url), 'utf8');
const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');

test('legacy AI assistant never emits wildcard CORS', () => {
  assert.doesNotMatch(source, /Access-Control-Allow-Origin["']?\\s*:\\s*["']\\*["']/);
  assert.match(source, /Access-Control-Allow-Origin/);
  assert.match(source, /configuredOrigins\\.has\\(origin\\)/);
  assert.match(source, /Origin not allowed/);
  assert.match(source, /Vary["']:\\s*["']Origin["']/);
});

test('legacy AI assistant retains authentication and bounded input', () => {
  assert.match(config, /\\[functions\\.ai-assistant\\][\\s\\S]*?verify_jwt\\s*=\\s*true/);
  assert.match(source, /supabase\\.auth\\.getUser\\(\\)/);
  assert.match(source, /message\\.length > 4000/);
});

test('known app origins are exact and additional origins require explicit configuration', () => {
  for (const origin of [
    'https://localhost',
    'https://rezaulkarim12th.github.io',
    'https://busicarecom.wordpress.com',
    'https://bk-busicare.com',
    'https://go.bk-busicare.com'
  ]) assert.ok(source.includes(origin), `Missing expected origin: ${origin}`);
  assert.match(source, /APP_ALLOWED_ORIGINS/);
});

test('CORS hardening preserves the OpenAI Responses API and reply contract', () => {
  assert.match(source, /https:\\/\\/api\\.openai\\.com\\/v1\\/responses/);
  assert.match(source, /OPENAI_API_KEY/);
  assert.match(source, /OPENAI_MODEL/);
  assert.match(source, /type === ["']output_text["']/);
  assert.match(source, /return respond\\(\\{ reply \\}, 200, origin\\)/);
  assert.doesNotMatch(source, /status\\s*=\\s*501|501 Not Implemented/);
});
