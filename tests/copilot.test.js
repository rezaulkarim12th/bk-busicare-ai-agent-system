import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContentPrompt, validateCopilotText, getCopilotCapabilities } from '../src/copilot.js';

test('builds a Bengali platform-specific prompt from bounded inputs', () => {
  const prompt = buildContentPrompt({topic:'AI Marketing',platform:'Facebook',audience:'SME owners',offer:'Free consultation'});
  assert.match(prompt,/প্ল্যাটফর্ম: Facebook/);
  assert.match(prompt,/বিষয়: AI Marketing/);
  assert.match(prompt,/Free consultation/);
  assert.match(prompt,/তথ্য উদ্ভাবন করবেন না/);
});

test('rejects missing topic and unsupported platform', () => {
  assert.throws(()=>buildContentPrompt({platform:'Facebook'}),/বিষয়/);
  assert.throws(()=>buildContentPrompt({topic:'SEO',platform:'Unknown'}),/প্ল্যাটফর্ম/);
});

test('strips markup delimiters and bounds user-controlled prompt values', () => {
  const prompt=buildContentPrompt({topic:'<script>alert(1)</script>',platform:'TikTok'});
  assert.doesNotMatch(prompt,/[<>]/);
  assert.ok(prompt.length<3000);
});

test('validates provider response text and reports disconnected provider honestly', () => {
  assert.equal(validateCopilotText('Draft'),true);
  assert.equal(validateCopilotText(''),false);
  assert.equal(validateCopilotText('x'.repeat(12001)),false);
  assert.deepEqual(getCopilotCapabilities(),{
    promptBuilder:true,responseValidation:true,liveProviderConnected:false,autoPublishingEnabled:false
  });
});
