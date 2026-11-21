const PLATFORMS = new Set(['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube']);

function clean(value, maxLength) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

export function buildContentPrompt({ topic, platform, audience = 'Potential customers in Bangladesh', objective = 'engagement and qualified leads', offer = '' } = {}) {
  const safeTopic = clean(topic, 180);
  const safeAudience = clean(audience, 120);
  const safeObjective = clean(objective, 120);
  const safeOffer = clean(offer, 180);
  if (!safeTopic) throw new TypeError('Enter a content topic.');
  if (!PLATFORMS.has(platform)) throw new TypeError('Select a supported platform.');

  return [
    'You are an experienced digital marketing content strategist.',
    'Create a platform-specific content draft based on the information below.',
    'Do not invent facts; use placeholders for missing information.',
    'Include a hook, main content, a clear CTA, five relevant hashtags, and one concise alternative headline.',
    '',
    'Platform: ' + platform,
    'Topic: ' + safeTopic,
    'Target audience: ' + safeAudience,
    'Objective: ' + safeObjective,
    'Offer / key details: ' + (safeOffer || 'No specific offer provided'),
    'Language: Clear, natural English',
    'Tone: Credible, clear, and free of exaggeration'
  ].join('\n');
}

export function validateCopilotText(value, maxLength = 12000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function getCopilotCapabilities() {
  return Object.freeze({
    promptBuilder: true,
    responseValidation: true,
    liveProviderConnected: false,
    autoPublishingEnabled: false
  });
}
