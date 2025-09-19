# Lab 001 — CQRS + Event Sourcing (Order Service)

## Problem & Context
Scale reads without write contention, keep full audit/history, and enable time-travel via event sourcing.

## Non-Functional Requirements (NFRs)
- Write p95 < 500 ms @ 300–500 RPS
- Read p95 < 200 ms @ 300–500 RPS
- Projector lag p95 < 5 s
- RTO 15m / RPO 0m (future: snapshots/compaction)

## Scope (MVP)
- Commands → events (append-only store)
- Projections in SQLite (OrderView)
- Idempotency + Outbox (simulado) 
- Observability: /metrics (Prometheus)

## Out of scope (v2+)
- Real payment gateway, multi-tenant isolation, Postgres prod, Kafka, snapshots.
