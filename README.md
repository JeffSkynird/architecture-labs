# Architecture Labs

Curated, production-style architecture exercises. Each lab documents context, trade-offs (ADRs), IaC, SRE (SLOs/dashboards/alerts), performance (k6), and resilience (chaos).

## Labs Index
- **001 — CQRS + Event Sourcing (Order Service)**: CQRS read/write segregation, append-only event store, projections, idempotency and outbox, SLOs, basic Terraform, load tests with k6, chaos manifest.

## Templates
Reusable templates for decision records, design notes, SLOs, and operations.
See `/templates`.

## How to use
1. Pick a lab under `/labs/<id>-<slug>`.
2. Read `/docs` (C4 + ADRs + SLOs + trade-offs).
3. Deploy infra from `/infra` (Terraform stub).
4. Run the minimal app and load tests (`/tests/k6`).
5. Review dashboards/alerts and chaos outcomes.
