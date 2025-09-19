# SLOs — Orders
- Availability: 99.9% monthly
- Latency: p95 < 500ms (write), p95 < 200ms (read)
- Error budget policy: burn-rate alerts (2h / 6h windows)

### PromQL (examples)

# Read p95 (ms) for GET /orders/:id
histogram_quantile(0.95,
  sum by (le) (
    rate(http_server_request_duration_seconds_bucket{route="/orders/:id",method="GET"}[5m])
  )
) * 1000

# Write success rate for POST /orders
sum(rate(http_requests_total{route="/orders",method="POST",status!~"5.."}[5m]))
/
sum(rate(http_requests_total{route="/orders",method="POST"}[5m]))

# Projector p95 lag (s)
quantile_over_time(0.95, projector_event_lag_seconds[5m])
