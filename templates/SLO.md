# SLO: <Service>

- SLIs
  - Availability (success rate)
  - Latency (p95 and p99)
  - Throughput
- SLO Targets
  - Availability: 99.9% monthly
  - Latency: p95 < 250ms (read), p95 < 500ms (write)
- Error Budget Policy
- Measurement & Tooling
  - Prometheus queries or CloudWatch metrics
- Alerting Rules
  - Page when error budget burn rate > X over Y hours
- Dashboards
  - Link to Grafana/CloudWatch dashboards (JSON in repo)
