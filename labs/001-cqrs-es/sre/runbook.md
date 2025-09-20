# Runbook — Order Service (Lab 001)

**Owners:** @jefferson-leon (primary), @oncall-backup  
**Service:** Order API (write/read), Projector (read-model builder)  
**Dashboards:** Grafana “Order Service” (latency, error rate, projector lag)  
**Metrics endpoint:** `/metrics` (Prometheus text format)

---

## 1) Summary
The service accepts order commands (`POST /orders`) and serves read models (`GET /orders/:id`). Writes append domain events to an event store (file/JSONL in this lab). A projector process subscribes to the store and updates denormalized views (SQLite). Outbox is used to simulate reliable integration events.

---

## 2) Key SLOs & Signals
- **Write availability**: success rate for `POST /orders`
- **Read latency**: p95 for `GET /orders/:id`
- **Projector lag**: `projector_event_lag_seconds` (p95 < 5s)

**PromQL examples**
- Read p95 (ms):
  ```
  histogram_quantile(0.95,
    sum by (le) (rate(http_server_request_duration_seconds_bucket{route="/orders/:id",method="GET"}[5m]))
  ) * 1000
  ```
- Write success rate:
  ```
  sum(rate(http_requests_total{route="/orders",method="POST",status!~"5.."}[5m]))
  /
  sum(rate(http_requests_total{route="/orders",method="POST"}[5m]))
  ```
- Projector p95 lag:
  ```
  quantile_over_time(0.95, projector_event_lag_seconds[5m])
  ```

---

## 3) Common Symptoms & Quick Checks
### A) 5xx spike on `POST /orders`
- **Check**: recent deploys, error logs for validation/DB failures.
- **Action**: rollback latest change; verify event store write permissions.
- **Metrics**: write error rate, CPU/mem saturation.

### B) High read latency
- **Check**: projector lag; SQLite locks or large table scans.
- **Action**: rebuild indexes; pause non-critical projections; scale projector (if multi-partition logic exists).
- **Metrics**: `projector_event_lag_seconds`, read p95/p99, DB busy.

### C) Stale reads (client sees old data)
- **Check**: lag vs SLO; last processed offset/checkpoint.
- **Action**: surface version/lag in responses; temporarily increase projector throughput.

### D) Outbox not draining
- **Check**: size/age of oldest outbox record (`data/outbox.sqlite`); dispatcher logs.
- **Action**: confirm RabbitMQ connectivity (`orders.integration-events` queue depth via management UI); restart dispatcher; verify retry/backoff settings; inspect DLQ; ensure idempotent consumers.

---

## 4) Diagnostics
- Logs:
  ```
  # API
  kubectl logs -l app=order-api --tail=200
  # Projector
  kubectl logs -l app=order-projector --tail=200
  ```
- DB/Projections:
  ```
  sqlite3 read.db '.tables'
  sqlite3 read.db 'select count(1) from OrderView;'
  ```
- Lag:
  ```
  curl $PROM/api/v1/query?query=projector_event_lag_seconds
  ```
- RabbitMQ queue depth:
  ```
  curl -u $RABBITMQ_DEFAULT_USER:$RABBITMQ_DEFAULT_PASS \
    http://localhost:15672/api/queues/%2F/orders.integration-events
  ```

---

## 5) Mitigations
- **Scale projector** to catch up (ensure single-writer semantics per stream/partition).
- **Pause non-critical projections** to prioritize core views.
- **Rollback** last deploy if errors align with deployment time.
- **Increase DB connections** or tune SQLite pragmas (dev only).
- **Rotate/compact** event store file if I/O becomes a bottleneck (lab note).

### Outbox stuck queue
- **Confirm dispatcher health**: check `kubectl logs -l app=order-dispatcher` (or the local worker process) for repeated RabbitMQ connection errors or message rejections; restart the deployment or local worker if it stopped.
- **Inspect oldest entries**: review retry/backoff metadata (`retry_count`, `next_retry_at`) in `data/outbox.sqlite` and verify RabbitMQ is reachable (`docker compose ps`, management UI) before resuming dispatching.
- **Mitigate poison messages**: quarantine repeatedly failing records (move them to the DLQ queue or mark the row as `failed`) and capture the payload for follow-up with the integration owner.
- **Force replay after fix**: once the underlying issue is resolved, trigger a controlled dispatcher restart (e.g., `npm run dispatcher -- --replay-from <id>` or `kubectl rollout restart deployment/order-dispatcher`) so messages are reprocessed in order with persistent delivery.
- **Monitor recovery**: watch the Grafana "Outbox" panel (oldest age, queue length, dispatch attempts) and RabbitMQ queue depth to confirm the backlog is shrinking; page the integration owner if the oldest age remains >10m after mitigation.

---

## 6) Escalation
- If **lag > 60s for > 30m** or **read p95 > 400ms** sustained → **page SRE**.
- If **outbox oldest age > 10m** → **page integration owner**.

---

## 7) Dependencies & Config
- Event store path: `data/events.jsonl`
- Read DB path: `data/read.db` (SQLite)
- Outbox store: `data/outbox.sqlite` (SQLite, `Outbox` table)
- RabbitMQ: Docker Compose (`infra/docker-compose.yml`), queue `orders.integration-events`, UI `http://localhost:15672`
- Env vars: `RABBITMQ_URL`, `RABBITMQ_OUTBOX_QUEUE`, `OUTBOX_DISPATCHER_*`
- Ports: API `:8080`, metrics on same process

---

## 8) Backups & Recovery (lab note)
- Local/dev only: copy `data/` dir for ad-hoc backups.
- For production reference: enable automated backups/snapshots for Postgres and rotate/compact event store; store snapshots in AWS S3.

---

## 9) Change Management
- Use ADRs for significant changes (e.g., switching projections backend, introducing Kafka).
- Canary/blue-green for high-risk releases (document in ADR on release strategy).

