# ADR 0004: Choose NestJS (Node 20 + TypeScript) for Lab 001

- Status: Accepted
- Date: 2025-09-18
- Deciders: Architecture Labs
- Tags: stack-choice, nestjs, node, typescript

## Context
This is an architecture-focused lab. We value **fast iteration**, **simple observability**, SQLite support, and easy integration with **k6** for validation. We want a neutral choice that avoids over-optimizing for raw performance at the expense of pedagogy.

## Decision
Use **NestJS (Node 20 + TypeScript)** for the MVP:
- Event store: file-based JSONL (append-only)
- Projections: SQLite
- Metrics: Prometheus via HTTP endpoint

## Alternatives
- **Rust (Axum)**: higher performance, slower time-to-first-feature for this lab.
- **Spring Boot (Java)**: strong observability, heavier footprint/startup.
- **Go (Gin/Fiber)**: simple and fast, fewer “batteries included” for this teaching flow.

## Consequences
**Positive**
- Rapid time-to-demo and clarity on architectural patterns
- Easy to port later (hexagonal adapters)

**Negative**
- Not the highest throughput/latency envelope
- Node GC and single-thread event loop characteristics

## Validation
- Meet SLOs in local: read p95 < 200ms, projector lag p95 < 5s
- Prometheus metrics exposed and dashboards importable

## Links
- ADR 0001 (CQRS+ES)
- SLOs/Runbook
- C4 diagrams
