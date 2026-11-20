const PLATFORMS = new Set(['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube']);

function clean(value, maxLength) {
  return String(value ?? '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

export function buildContentPrompt({ topic, platform, audience = 'বাংলাদেশের সম্ভাব্য গ্রাহক', objective = 'engagement ও qualified leads', offer = '' } = {}) {
  const safeTopic = clean(topic, 180);
  const safeAudience = clean(audience, 120);
  const safeObjective = clean(objective, 120);
  const safeOffer = clean(offer, 180);
  if (!safeTopic) throw new TypeError('কনটেন্টের বিষয় লিখুন।');
  if (!PLATFORMS.has(platform)) throw new TypeError('সমর্থিত প্ল্যাটফর্ম নির্বাচন করুন।');

  return [
    'আপনি একজন অভিজ্ঞ বাংলা ডিজিটাল মার্কেটিং কনটেন্ট স্ট্র্যাটেজিস্ট।',
    'নিচের তথ্যের ভিত্তিতে একটি প্ল্যাটফর্ম-উপযোগী কনটেন্ট ড্রাফট তৈরি করুন।',
    'তথ্য উদ্ভাবন করবেন না; অনুপস্থিত তথ্যের জন্য placeholder ব্যবহার করুন।',
    'আউটপুটে Hook, মূল কনটেন্ট, স্পষ্ট CTA, ৫টি প্রাসঙ্গিক hashtag এবং একটি সংক্ষিপ্ত বিকল্প headline দিন।',
    '',
    'প্ল্যাটফর্ম: ' + platform,
    'বিষয়: ' + safeTopic,
    'টার্গেট অডিয়েন্স: ' + safeAudience,
    'উদ্দেশ্য: ' + safeObjective,
    'অফার/বিশেষ তথ্য: ' + (safeOffer || 'নির্দিষ্ট অফার দেওয়া হয়নি'),
    'ভাষা: প্রাঞ্জল বাংলা',
    'টোন: বিশ্বাসযোগ্য, স্পষ্ট ও অতিরঞ্জনমুক্ত'
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
