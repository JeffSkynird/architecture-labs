# ADR 0003: SQLite for Dev Projections; Postgres for Production

- Status: Accepted
- Date: 2025-09-18
- Deciders: Architecture Labs
- Tags: projections, sqlite, postgres, read-models

## Context
Read models must be fast to rebuild in development and robust in production. We need indexing and concurrent readers for production, but very low friction locally.

## Decision
- **Development**: use **SQLite** (file-based) for projections.
- **Production**: use **Postgres** (managed service) for durability, indexing, concurrency, backups, and extensions (JSONB/GIN).

## Alternatives
- **On-the-fly materialization only** from event store: expensive for queries.
- **Document store only** (e.g., Mongo/Elastic): simpler in some cases, less relational power for this domain.
- **Single DB for write and read**: contention risk, fewer optimization levers.

## Consequences
**Positive**
- Fast local dev loop; realistic production characteristics
- Easy rebuilds and cheap local snapshots

**Negative**
- Two backends to support, migrations/compatibility to manage
- Potentially different SQL features across environments

## Validation
- k6 read benchmarks to confirm p95 targets with SQLite (dev) and Postgres (prod).
- Projector rebuild time tracked on cold start.

## Links
- ADR 0001 (CQRS+ES)
- RFC 0001 (Read Models)
- SLOs (Read latency)
