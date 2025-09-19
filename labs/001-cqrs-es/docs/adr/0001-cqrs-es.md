# ADR 0001: Adopt CQRS + Event Sourcing for the Order Domain

- Status: Accepted
- Date: 2025-09-18
- Deciders: Architecture Labs
- Tags: cqrs, event-sourcing, orders, read-models

## Context
We need to scale reads without write contention and preserve a full history for audit/analytics and time-travel. A traditional CRUD model struggles with mutable state, limited auditability, and read/write coupling under load.

## Decision
Adopt **CQRS** (segregated write/read paths) and **Event Sourcing** (append-only domain events as the source of truth). The read side will be built from **projections** (denormalized views), optimized for query patterns.

## Alternatives
- **CRUD single model**: Simpler, but weak audit trail and mixed read/write concerns.
- **CQRS over CRUD only**: Better read scaling, but loses temporal/history advantages.
- **Event Sourcing without CQRS**: Better auditability, but queries are costly without read models.

## Consequences (Trade-offs)
**Positive**
- Complete auditability and reproducibility
- Flexible read models tuned per use case
- Temporal queries and time-travel

**Negative**
- Higher complexity (projections/rebuild, eventual consistency)
- Operational concerns: projector lag, compaction/snapshots strategy

## Validation
- k6 load tests to validate read p95 targets on projected views
- Projector lag metrics and alerting in SLOs

## Links
- C4 (Context/Container)
- RFC 0001 (Read Models)
- ADR 0002 (Outbox), ADR 0003 (Projections Store)
