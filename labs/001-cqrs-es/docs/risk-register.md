# Risk Register
- Projector lag causes stale reads → Mitigation: show version/lag; compensate with status.
- JSONL event store growth → Mitigation: scheduled snapshots, file rotation/compaction strategy.
- Outbox delivery failures → Mitigation: retry with backoff, DLQ.
