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
- Idempotency + Outbox (RabbitMQ dispatcher)
- Observability: /metrics (Prometheus)

## Out of scope (v2+)
- Real payment gateway, multi-tenant isolation, Postgres prod, Kafka, snapshots.

## Outbox + RabbitMQ Dispatcher
1. **Start RabbitMQ**: `docker compose -f infra/docker-compose.yml up -d`. It exposes AMQP on `5672` and the management UI on `15672` (`guest`/`guest`). Queue defaults to `orders.integration-events` (`RABBITMQ_OUTBOX_QUEUE` overrides).
2. **Run the service + dispatcher**:
   - `cp .env.example .env` (or ensure the env vars below exist)
   - `npm install`
   - `npm run dev`
   - Relevant env vars: `RABBITMQ_URL`, `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, and the `OUTBOX_DISPATCHER_*` knobs (poll interval, backoff, max attempts, failure injectors).
3. **Verify delivery**: create an order (see "Create an Order via HTTP"), confirm the row in `data/outbox.sqlite` is marked sent, and inspect the payload via the RabbitMQ UI (`Get Message(s)` on `orders.integration-events`).
4. **Simulate failures** (set env vars, restart app):
   - `OUTBOX_DISPATCHER_FAIL_ONCE=true` – first message fails once before retry success.
   - `OUTBOX_DISPATCHER_FAIL_EVENT_TYPE=order.created` – all events of that type fail; exercises max-attempt handling.
   - `OUTBOX_DISPATCHER_FAIL_UNTIL_ATTEMPTS=3` – dispatcher retries until attempt 3, then succeeds. Logs show backoff progression and outbox attempts tracking.
