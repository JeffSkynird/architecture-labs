# Risk Register
- Projector lag causes stale reads → Mitigation: show version/lag; compensate with status.
- Event store growth → Mitigation: snapshots, compaction strategy.
- Outbox delivery failures → Mitigation: retry with backoff, DLQ.
