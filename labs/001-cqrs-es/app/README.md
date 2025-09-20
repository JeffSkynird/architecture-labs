# Lab 001 — App (NestJS)

The reference implementation for the CQRS Ordering Service lives in the dedicated repository below. Follow the instructions here to run it with the RabbitMQ-backed outbox dispatcher used throughout this lab.

- CQRS Ordering Service repository: https://github.com/JeffSkynird/cqrs-ordering-service

## Outbox + RabbitMQ Dispatcher
1. **Start RabbitMQ**: `docker compose -f infra/docker-compose.yml up -d` (AMQP `:5672`, management UI `:15672`, default creds `guest`/`guest`). Queue name defaults to `orders.integration-events` and is overrideable via `RABBITMQ_OUTBOX_QUEUE`.
2. **Prepare environment**: `cp .env.example .env` (or export the variables), run `npm install`, then `npm run dev` to start the API and dispatcher worker.
3. **Env vars** (already in `.env.example`):
   - `RABBITMQ_URL` (`amqp://guest:guest@localhost:5672` by default)
   - `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS` (propagated to Docker Compose)
   - `OUTBOX_DISPATCHER_*` (poll interval, exponential backoff, max attempts, failure injectors: `FAIL_ONCE`, `FAIL_EVENT_TYPE`, `FAIL_UNTIL_ATTEMPTS`)
4. **Verify delivery**: create an order via the HTTP API, check `data/outbox.sqlite` for a row marked `sent`, and use the RabbitMQ UI (`orders.integration-events` → *Get Message(s)*) to inspect the payload.
5. **Simulate failures**: toggle the `OUTBOX_DISPATCHER_FAIL_*` env vars to observe retries/backoff in logs; the dispatcher updates attempt counters and `next_retry_at` in the outbox table.
