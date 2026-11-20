const OPEN_STATUSES = new Set(['New', 'Contacted', 'Proposal']);
const CLOSED_STATUSES = new Set(['Won', 'Lost']);

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFollowUpQueue(leads, today = getLocalDateString()) {
  if (!Array.isArray(leads)) return [];
  return leads
    .filter(lead => lead && typeof lead === 'object' &&
      OPEN_STATUSES.has(lead.status) &&
      typeof lead.followUp === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(lead.followUp) &&
      lead.followUp <= today)
    .map(lead => ({
      id: lead.id,
      name: String(lead.name || ''),
      status: lead.status,
      followUp: lead.followUp,
      overdue: lead.followUp < today
    }))
    .sort((a, b) => a.followUp.localeCompare(b.followUp) || a.name.localeCompare(b.name));
}

export function getSalesMetrics(leads) {
  const records = Array.isArray(leads) ? leads.filter(x => x && typeof x === 'object') : [];
  const won = records.filter(x => x.status === 'Won');
  const lost = records.filter(x => x.status === 'Lost');
  const open = records.filter(x => OPEN_STATUSES.has(x.status));
  const amount = list => list.reduce((sum, item) => {
    const value = Number(item.value ?? 0);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
  const decided = won.length + lost.length;
  return {
    totalLeads: records.length,
    openDeals: open.length,
    wonDeals: won.length,
    lostDeals: lost.length,
    openPipelineValue: amount(open),
    wonRevenue: amount(won),
    winRate: decided ? Math.round((won.length / decided) * 100) : 0
  };
}

export function recommendNextAction(lead) {
  if (!lead || typeof lead !== 'object') return 'লিডের তথ্য যাচাই করুন';
  switch (lead.status) {
    case 'New': return 'প্রথম যোগাযোগ করুন এবং প্রয়োজন বুঝুন';
    case 'Contacted': return 'ফলো-আপ করে আগ্রহ ও সিদ্ধান্তের সময় জানুন';
    case 'Proposal': return 'প্রস্তাবের বিষয়ে মতামত নিন এবং আপত্তি সমাধান করুন';
    case 'Won': return 'ক্লায়েন্ট অনবোর্ডিং ও কাজের পরিকল্পনা শুরু করুন';
    case 'Lost': return 'হারানোর কারণ নথিভুক্ত করে ভবিষ্যৎ ফলো-আপ বিবেচনা করুন';
    default: return 'লিডের স্ট্যাটাস যাচাই করুন';
  }
}
