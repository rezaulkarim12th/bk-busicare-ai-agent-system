import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFreeContentPack, formatFreeContentPack } from '../src/free-mode-content.js';

test('generates a bounded 60-second social content pack for supported platforms', () => {
  const pack = generateFreeContentPack({ topic: 'BK-BusiCare introduction', platform: 'Facebook' });
  assert.equal(pack.platform, 'Facebook');
  assert.equal(pack.videoDurationSeconds, 60);
  assert.equal(pack.storyboard.length, 4);
  assert.match(pack.seoTitle, /BK-BusiCare/);
  assert.equal(pack.hashtags.length, 5);
  assert.match(pack.disclaimer, /does not create an MP4/i);
});

test('rejects empty topics and unsupported platforms', () => {
  assert.throws(() => generateFreeContentPack({ platform: 'Facebook' }), /topic/i);
  assert.throws(() => generateFreeContentPack({ topic: 'SEO', platform: 'Unknown' }), /platform/i);
});

test('escapes markup and formats a reviewable copy pack', () => {
  const pack = generateFreeContentPack({ topic: '<script>SEO</script>', platform: 'TikTok' });
  const text = formatFreeContentPack(pack);
  assert.doesNotMatch(text, /<script>/);
  assert.match(text, /60-second video storyboard/i);
  assert.match(text, /review before publishing/i);
});
