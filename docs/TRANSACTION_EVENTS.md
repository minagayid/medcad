# Operational transaction events

MedCAD now includes `transaction-events.mjs`, a dependency-free contract for the operational side of the planned platform.

It records only pseudonymous transaction metadata: transaction ID, organization ID, event type, source hash/format, validation summary, export format, timestamp, and a SHA-256 chain link. It intentionally does not include diagnoses, images, clinical notes, or patient identifiers.

The event vocabulary is compatible with ProCAD's canonical contract and is suitable for a later event-bus adapter. The current local prototype does not transmit events or claim tax/compliance conclusions.
