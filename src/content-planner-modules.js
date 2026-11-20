/**
 * Content Planner navigation and capability registry.
 *
 * This is a planning-only foundation. It does not connect provider accounts,
 * publish content, create ads, spend budget, or schedule background jobs.
 */

export const CONTENT_PLANNER_MODULES = Object.freeze([
  Object.freeze({
    id: 'social-content',
    label: 'Social Media Content',
    description: 'Plan organic content across supported social platforms.',
    items: Object.freeze([
      'Content Calendar',
      'AI Post & Caption Briefs',
      'Image & Video Briefs',
      'Hashtag & SEO Planning',
      'Draft & Review'
    ]),
    execution: 'planning-only',
    providers: Object.freeze(['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube'])
  }),
  Object.freeze({
    id: 'meta-ads',
    label: 'Meta Ads Management',
    description: 'Prepare Facebook and Instagram advertising campaign briefs.',
    items: Object.freeze([
      'Facebook Ads',
      'Instagram Ads',
      'Campaign Planner',
      'Ad Copy & Creative Brief',
      'Audience & Budget Planning',
      'Campaign Performance Report'
    ]),
    execution: 'planning-only',
    providers: Object.freeze(['Meta'])
  }),
  Object.freeze({
    id: 'google-ads',
    label: 'Google Ads Management',
    description: 'Prepare Google advertising campaign briefs and reporting plans.',
    items: Object.freeze([
      'Search Ads',
      'Display Ads',
      'YouTube Ads',
      'Keyword Planner',
      'Campaign & Budget Planning',
      'Conversion & Performance Report'
    ]),
    execution: 'planning-only',
    providers: Object.freeze(['Google Ads'])
  }),
  Object.freeze({
    id: 'publishing-scheduling',
    label: 'Publishing & Scheduling',
    description: 'Organize proposed publishing dates and campaign reminders.',
    items: Object.freeze([
      'Daily Schedule',
      'Weekly Schedule',
      'Monthly Calendar',
      'Publishing Queue',
      'Campaign Reminder'
    ]),
    execution: 'planning-only',
    providers: Object.freeze([])
  }),
  Object.freeze({
    id: 'campaign-reports',
    label: 'Campaign Reports',
    description: 'Define reporting views for planned and connected campaigns.',
    items: Object.freeze([
      'Daily Report',
      'Weekly Report',
      'Monthly Report',
      'Campaign Performance',
      'Export Plan'
    ]),
    execution: 'planning-only',
    providers: Object.freeze(['Meta', 'Google Ads'])
  })
]);

export function getContentPlannerModules() {
  return CONTENT_PLANNER_MODULES;
}

export function getContentPlannerModule(id) {
  return CONTENT_PLANNER_MODULES.find(module => module.id === id) ?? null;
}

export function isLiveExecutionEnabled(moduleId) {
  const module = getContentPlannerModule(moduleId);
  return Boolean(module && module.execution === 'live');
}
