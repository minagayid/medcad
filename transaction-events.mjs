import { createHash, randomUUID } from 'node:crypto';

export const OPERATIONAL_EVENT_TYPES = Object.freeze(['case.created', 'service.created', 'mesh.imported', 'validation.completed', 'preview.exported', 'review.acknowledged']);

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value ?? null);
}

export function sha256(value) { return createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex'); }

export function createOperationalEvent({ transactionId, organizationId = 'LOCAL-ORG', type, entityId = null, metadata = {}, previousHash = null, occurredAt = new Date().toISOString() }) {
  if (!transactionId || !organizationId || !OPERATIONAL_EVENT_TYPES.includes(type)) throw new Error('A valid transaction, organization, and operational event type are required.');
  const event = { eventId: `EVT-${randomUUID()}`, transactionId, organizationId, type, entityId, occurredAt, source: 'medcad', metadata, previousHash };
  return { ...event, eventHash: sha256(event) };
}

export function buildOperationalTimeline({ transactionId, organizationId, source, validation, exportFormat = null }) {
  let previousHash = null;
  const entries = [];
  const add = (type, entityId, metadata = {}) => { const event = createOperationalEvent({ transactionId, organizationId, type, entityId, metadata, previousHash }); entries.push(event); previousHash = event.eventHash; };
  add('case.created', transactionId, { sourceKind: source?.kind || 'template' });
  if (source?.kind === 'surface') add('mesh.imported', source.sha256 || source.name || null, { format: source.format, sourceUnits: source.sourceUnits, coordinatesUnit: 'mm' });
  if (validation) add('validation.completed', transactionId, { passed: Boolean(validation.pass), checks: validation.checks?.map(({ id, status }) => ({ id, status })) || [] });
  if (exportFormat) add('preview.exported', transactionId, { format: exportFormat, clinicalFit: 'not_assessed', manufacturingQualified: false });
  return entries;
}

export function verifyOperationalTimeline(events = []) {
  let previous = null;
  for (const event of events) { const payload = { ...event }; delete payload.eventHash; if (event.previousHash !== previous || event.eventHash !== sha256(payload)) return false; previous = event.eventHash; }
  return true;
}
