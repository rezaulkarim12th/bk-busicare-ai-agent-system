import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(
  new URL('../.github/workflows/supabase-test-deploy.yml', import.meta.url),
  'utf8'
);

test('TEST deployment workflow is manually triggered and defaults to preview', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /default: preview/);
  assert.match(workflow, /options:\s*[\s\S]*?- preview\s*- apply/);
});

test('both deployment jobs are scoped to the dedicated TEST environment', () => {
  const environmentLines = workflow.match(/^\s+environment:\s*[^\r\n]+$/gm) ?? [];
  assert.equal(environmentLines.length, 2, 'preview and apply must each declare an environment');
  for (const line of environmentLines) {
    assert.match(line, /environment:\s*supabase-test$/);
  }
});

test('preview performs a remote dry run and never applies migrations', () => {
  const preview = workflow.split('  apply:')[0];
  assert.match(preview, /if:\s*inputs\.operation == 'preview'/);
  assert.match(preview, /supabase db push --dry-run --remote=/);
  assert.doesNotMatch(preview, /supabase db push --remote=.*--yes/);
  assert.doesNotMatch(preview, /supabase functions deploy/);
});

test('apply requires the explicit confirmation input and repeats the dry run', () => {
  const apply = workflow.split('  apply:')[1] ?? '';
  assert.match(apply, /if:\s*inputs\.operation == 'apply' && inputs\.confirm_apply == true/);
  assert.match(apply, /supabase db push --dry-run --remote=/);
  assert.match(apply, /supabase db push --remote=.*--yes/);
  assert.match(apply, /supabase functions deploy manage-workspace-member --remote=/);
});

test('remote target and credentials are supplied only through protected secrets', () => {
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN:\s*\$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.match(workflow, /SUPABASE_DB_PASSWORD:\s*\$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/);
  assert.match(workflow, /SUPABASE_PROJECT_REF:\s*\$\{\{ secrets\.SUPABASE_PROJECT_REF \}\}/);
  assert.match(workflow, /SUPABASE_PROJECT_REF.*\^\[a-z0-9\]\{20\}\$/);
  assert.doesNotMatch(workflow, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
});

test('deployment workflow checks out only the isolated feature branch', () => {
  const checkoutRefs = workflow.match(/ref:\s*feature\/multitenant-foundation/g) ?? [];
  assert.equal(checkoutRefs.length, 2, 'both jobs must use the reviewed feature branch');
  assert.doesNotMatch(workflow, /ref:\s*main\b/);
});

test('TEST workflow explicitly refuses the known existing BK-BusiCare project ref', () => {
  const productionRefGuards = workflow.match(/Refusing to target the existing BK-BusiCare project/g) ?? [];
  assert.equal(productionRefGuards.length, 2, 'both preview and apply must reject the existing project');
  assert.equal((workflow.match(/ekznyijmghrjtovbbgun/g) ?? []).length, 2);
});


test('all GitHub Actions dependencies are pinned to immutable commit SHAs', async () => {
  const paths = [
    '../.github/workflows/build.yml',
    '../.github/workflows/supabase-local-ci.yml',
    '../.github/workflows/supabase-test-deploy.yml'
  ];
  for (const path of paths) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    const uses = source.match(/^\s+uses:\s+[^\s]+/gm) ?? [];
    assert.ok(uses.length > 0, `${path} must contain pinned actions`);
    for (const line of uses) {
      assert.match(line, /@[a-f0-9]{40}(?:\s+#.*)?$/, `Action is not pinned: ${line}`);
    }
  }
});

test('CI toolchain versions are explicit rather than latest or floating major tags', async () => {
  const build = await readFile(new URL('../.github/workflows/build.yml', import.meta.url), 'utf8');
  const local = await readFile(new URL('../.github/workflows/supabase-local-ci.yml', import.meta.url), 'utf8');
  const deploy = await readFile(new URL('../.github/workflows/supabase-test-deploy.yml', import.meta.url), 'utf8');
  assert.match(build, /node-version: 24/);
  assert.match(local, /node-version: 24/);
  assert.match(build, /deno-version: 2\.9\.8/);
  assert.match(local, /deno-version: 2\.9\.8/);
  for (const source of [local, deploy]) {
    assert.match(source, /version: 3\.2\.0/);
    assert.doesNotMatch(source, /version: latest/);
  }
});


test('local Supabase CI does not print ephemeral generated credentials', async () => {
  const localWorkflow = await readFile(new URL('../.github/workflows/supabase-local-ci.yml', import.meta.url), 'utf8');
  assert.match(localWorkflow, /supabase start >"\$log_file" 2>&1/);
  assert.match(localWorkflow, /supabase status >"\$log_file" 2>&1/);
  assert.match(localWorkflow, /generated local credentials were not written to CI logs/);
  assert.doesNotMatch(localWorkflow, /^\s+run: supabase (?:start|status)\s*$/m);
});
