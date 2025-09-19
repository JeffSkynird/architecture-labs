# Runbook — <Service>

## Summary
What this service does, owners, on-call rotation, dashboards and links.

## Dashboards
- <Grafana link/title>
- <Logs link>

## Common Symptoms & Checks
- Elevated latency → check DB connections, queue depth, tail logs.
- 5xx burst → check dependency status, circuit breakers, recent deploys.

## Diagnostics
- `kubectl describe pod ...`
- `kubectl logs -l app=<svc> --tail=200`
- `k6` test to reproduce load path

## Mitigations
- Scale up replicas to N
- Roll back to image tag X
- Drain queue Y

## Escalation
- Contact on-call group Z
- Vendor tickets
