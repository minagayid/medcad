import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOperationalTimeline, verifyOperationalTimeline } from '../transaction-events.mjs';

test('builds a pseudonymous operational timeline with a verified hash chain', () => {
  const events = buildOperationalTimeline({ transactionId: 'TX-2026-0001', organizationId: 'LOCAL-ORG', source: { kind: 'surface', format: 'STL', sourceUnits: 'mm', sha256: 'abc' }, validation: { pass: true, checks: [{ id: 'finite', status: 'pass' }] }, exportFormat: 'stl' });
  assert.equal(events.length, 4);
  assert.equal(events[0].type, 'case.created');
  assert.equal(verifyOperationalTimeline(events), true);
  events[1].metadata.format = 'OBJ';
  assert.equal(verifyOperationalTimeline(events), false);
});
