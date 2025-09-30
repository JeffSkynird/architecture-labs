# ADR-00XX — Adopt Prompt Context Mirror Pattern

**Status:** Accepted
**Date:** 2025-09-29

## Context

AI responses require the client's exact state. Currently, divergences between the frontend and backend hinder reproducibility, debugging, and auditing.

## Decision

We will adopt a **Context Mirror** synchronized from the client to a versioned **Mirror Store**. The AI service (Prompt Builder) will retrieve the latest snapshot to build prompts.

## Consequences

**Positive:**

  * Prompt reproducibility and explainability for debugging and QA.
  * More predictable UX and less contextual ambiguity.

**Negative / Risks:**

  * Increased storage and bandwidth costs.
  * Implementation complexity, especially for delta-sync and conflict/divergence management.
  * The `Mirror Store` can become a bottleneck if not designed for scale.
  * Requires strict data minimization/redaction policies (PII).

## Alternatives Considered

  * **Send full context ad-hoc:** High latency/cost, no traceability.
  * **Maintain only backend state:** Loss of UI fidelity and ephemeral selections.

## Implementation Plan

1.  Add `Client Context Manager` with `debounce` and `hash` (using full snapshots).
2.  Implement `Mirror Store` (in-memory → Redis → Postgres JSONB).
3.  Integrate `Prompt Builder` and `LLM Gateway`.
4.  Add alerts and dashboards to monitor sync health (e.g., `mirror.version.gap`).
5.  Evaluate the need for `delta-sync` based on bandwidth and snapshot size metrics.
6.  Define and implement policies for data retention, archiving, and PII redaction.