# ADR 0002: Use the Outbox Pattern for Integration Events

- Status: Proposed
- Date: 2025-09-18
- Deciders: Architecture Labs
- Tags: outbox, reliability, idempotency, integration-events

## Context
When persisting domain events (e.g., `OrderCreated`), we must also publish **integration events** (e.g., `PaymentRequested`) to external systems reliably. Publishing directly after a DB commit risks message loss on crash. 2PC across DB and broker is undesirable.

## Decision
Implement the **Outbox Pattern**:
- In the same transaction as domain event append, write an **outbox** record.
- A background **dispatcher** pulls outbox entries, publishes to the broker (simulated in the lab), retries with backoff, and marks as sent idempotently.

## Alternatives
- **Direct publish** post-commit: risks lost messages during crashes.
- **Distributed transactions/2PC**: complex, slower, operationally heavy.
- **Event streaming DB as single source**: requires different infra and constraints.

## Consequences
**Positive**
- Reliable, exactly-once semantics from consumers’ perspective
- No cross-resource transactions

**Negative**
- Outbox growth requires pruning/archival
- Dispatcher logic (ordering, retries, DLQ) adds complexity

## Validation
- Chaos test: kill dispatcher mid-flight; verify at-least-once with idempotent consumers.
- Observability: dispatch success/failure counters, age of oldest outbox row.

## Links
- ADR 0001 (CQRS+ES)
- RFC 0001 (Read Models)
- Runbook (Outbox stuck)
