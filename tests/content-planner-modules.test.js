import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_PLANNER_MODULES,
  getContentPlannerModule,
  getContentPlannerModules,
  isLiveExecutionEnabled
} from '../src/content-planner-modules.js';

test('Content Planner exposes the five approved submodules in order', () => {
  assert.deepEqual(
    getContentPlannerModules().map(module => module.id),
    ['social-content', 'meta-ads', 'google-ads', 'publishing-scheduling', 'campaign-reports']
  );
});

test('Meta Ads includes Facebook and Instagram campaign planning', () => {
  const meta = getContentPlannerModule('meta-ads');
  assert.ok(meta);
  assert.ok(meta.items.includes('Facebook Ads'));
  assert.ok(meta.items.includes('Instagram Ads'));
  assert.deepEqual(meta.providers, ['Meta']);
});

test('Google Ads includes Search, Display and YouTube planning', () => {
  const google = getContentPlannerModule('google-ads');
  assert.ok(google);
  assert.ok(google.items.includes('Search Ads'));
  assert.ok(google.items.includes('Display Ads'));
  assert.ok(google.items.includes('YouTube Ads'));
  assert.deepEqual(google.providers, ['Google Ads']);
});

test('unknown module IDs return null', () => {
  assert.equal(getContentPlannerModule('not-a-module'), null);
});

test('all modules remain planning-only; no live publishing or ad execution is enabled', () => {
  assert.ok(CONTENT_PLANNER_MODULES.every(module => module.execution === 'planning-only'));
  assert.ok(CONTENT_PLANNER_MODULES.every(module => !isLiveExecutionEnabled(module.id)));
  assert.equal(isLiveExecutionEnabled('unknown'), false);
});
