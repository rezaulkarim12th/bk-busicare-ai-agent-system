const PLATFORMS = Object.freeze({
  Facebook: { title: 'Facebook post', cta: 'Message BK-BusiCare to learn more.' },
  Instagram: { title: 'Instagram caption', cta: 'Save this post and contact BK-BusiCare for details.' },
  TikTok: { title: 'TikTok video', cta: 'Follow BK-BusiCare for practical digital growth tips.' },
  LinkedIn: { title: 'LinkedIn update', cta: 'Connect with BK-BusiCare to discuss your business goals.' },
  YouTube: { title: 'YouTube Short', cta: 'Subscribe for more practical business and career solutions.' }
});

function clean(value, max = 180) {
  return String(value ?? '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function generateFreeContentPack({ topic, platform, audience = 'Entrepreneurs and professionals in Bangladesh', objective = 'brand awareness', brand = 'BK-BusiCare' } = {}) {
  const safeTopic = clean(topic);
  const safeAudience = clean(audience, 120) || 'Entrepreneurs and professionals in Bangladesh';
  const safeBrand = clean(brand, 80) || 'BK-BusiCare';
  const config = PLATFORMS[platform];
  if (!safeTopic) throw new TypeError('Enter a topic to generate a content draft.');
  if (!config) throw new TypeError('Choose a supported social platform.');

  const title = `${safeBrand}: ${safeTopic}`.slice(0, 100);
  const hook = `Looking for practical support with ${safeTopic.toLowerCase()}?`;
  const body = `${safeBrand} shares practical digital business and career solutions. This content focuses on ${safeTopic} for ${safeAudience.toLowerCase()}. Explore the topic, identify the next useful step, and choose an approach that fits your goals.`;
  const hashtags = ['#BKBusiCare', '#DigitalBusiness', '#CareerGrowth', '#DigitalMarketing', '#BangladeshBusiness'];
  const scenes = [
    { time: '0–5 sec', visual: 'Navy-and-gold brand opener with BK-BusiCare logo', voice: `Discover ${safeTopic} with ${safeBrand}.` },
    { time: '5–20 sec', visual: 'Show the audience challenge using simple on-screen text and relevant b-roll', voice: hook },
    { time: '20–45 sec', visual: 'Present three concise, practical points about the topic; verify all claims before publishing', voice: body },
    { time: '45–60 sec', visual: 'Brand logo, website/contact placeholder and clear call to action', voice: config.cta }
  ];

  return Object.freeze({
    platform,
    objective: clean(objective, 100) || 'brand awareness',
    seoTitle: title,
    caption: [hook, body, config.cta].join('\n\n'),
    hashtags,
    cta: config.cta,
    videoDurationSeconds: 60,
    storyboard: scenes,
    disclaimer: 'Template-generated draft only. Verify claims, add approved brand assets and review before publishing. This does not create an MP4 or publish/schedule a post.'
  });
}

export function formatFreeContentPack(pack) {
  if (!pack || !PLATFORMS[pack.platform]) throw new TypeError('A valid content pack is required.');
  return [
    'BK-BusiCare — Free Mode Content Pack',
    `Platform: ${pack.platform}`,
    `Objective: ${pack.objective}`,
    `SEO title: ${pack.seoTitle}`,
    '',
    'Caption:',
    pack.caption,
    '',
    'Hashtags:',
    pack.hashtags.join(' '),
    '',
    '60-second video storyboard:',
    ...pack.storyboard.flatMap(scene => [`${scene.time} — ${scene.visual}`, `Voice-over: ${scene.voice}`]),
    '',
    pack.disclaimer
  ].join('\n');
}
