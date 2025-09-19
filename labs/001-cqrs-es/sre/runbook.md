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
- **Check**: size/age of oldest outbox record; dispatcher logs.
- **Action**: restart dispatcher; verify retry/backoff; inspect DLQ; ensure idempotent consumers.

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

---

## 5) Mitigations
- **Scale projector** to catch up (ensure single-writer semantics per stream/partition).
- **Pause non-critical projections** to prioritize core views.
- **Rollback** last deploy if errors align with deployment time.
- **Increase DB connections** or tune SQLite pragmas (dev only).
- **Rotate/compact** event store file if I/O becomes a bottleneck (lab note).

---

## 6) Escalation
- If **lag > 60s for > 30m** or **read p95 > 400ms** sustained → **page SRE**.
- If **outbox oldest age > 10m** → **page integration owner**.

---

## 7) Dependencies & Config
- Event store path: `data/events.jsonl`
- Read DB path: `data/read.db` (SQLite)
- Outbox store: `data/outbox.jsonl` or SQLite table (depending on implementation)
- Ports: API `:8080`, metrics on same process

---

## 8) Backups & Recovery (lab note)
- Local/dev only: copy `data/` dir for ad-hoc backups.
- For production reference: enable automated backups/snapshots for Postgres and rotate/compact event store; store snapshots in AWS S3.

---

## 9) Change Management
- Use ADRs for significant changes (e.g., switching projections backend, introducing Kafka).
- Canary/blue-green for high-risk releases (document in ADR on release strategy).