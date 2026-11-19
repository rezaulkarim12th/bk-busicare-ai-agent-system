import test from 'node:test';
import assert from 'node:assert/strict';
import { getFollowUpQueue, getSalesMetrics, recommendNextAction } from '../src/operations.js';

test('follow-up queue includes due open leads and sorts oldest first', () => {
  const result = getFollowUpQueue([
    { id: 1, name: 'Today', status: 'New', followUp: '2026-11-19' },
    { id: 2, name: 'Overdue', status: 'Proposal', followUp: '2026-11-17' },
    { id: 3, name: 'Future', status: 'Contacted', followUp: '2026-11-22' },
    { id: 4, name: 'Closed', status: 'Won', followUp: '2026-11-18' },
    { id: 5, name: 'Bad date', status: 'New', followUp: 'not-a-date' }
  ], '2026-11-19');
  assert.deepEqual(result.map(x => x.id), [2, 1]);
  assert.equal(result[0].overdue, true);
  assert.equal(result[1].overdue, false);
});

test('sales metrics safely aggregate pipeline, revenue and win rate', () => {
  assert.deepEqual(getSalesMetrics([
    { status: 'New', value: 1000 },
    { status: 'Proposal', value: 2500 },
    { status: 'Won', value: 3000 },
    { status: 'Lost', value: 500 },
    { status: 'Won', value: -100 }
  ]), {
    totalLeads: 5, openDeals: 2, wonDeals: 2, lostDeals: 1,
    openPipelineValue: 3500, wonRevenue: 3000, winRate: 67
  });
});

test('sales metrics handle empty and invalid input', () => {
  assert.equal(getSalesMetrics(null).winRate, 0);
  assert.equal(getSalesMetrics([{ status: 'New', value: 'bad' }]).openPipelineValue, 0);
});

test('next-action guidance covers every supported sales stage', () => {
  assert.match(recommendNextAction({ status: 'New' }), /প্রথম যোগাযোগ/);
  assert.match(recommendNextAction({ status: 'Contacted' }), /ফলো-আপ/);
  assert.match(recommendNextAction({ status: 'Proposal' }), /প্রস্তাব/);
  assert.match(recommendNextAction({ status: 'Won' }), /অনবোর্ডিং/);
  assert.match(recommendNextAction({ status: 'Lost' }), /কারণ/);
  assert.match(recommendNextAction({ status: 'unknown' }), /যাচাই/);
});
