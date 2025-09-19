# Lab 001 — App (NestJS)

This folder contains the minimal mock service for the CQRS + ES lab.

## How to test right now

### 1. Run the API (health + metrics)
```bash
cd app/node
npm install
npm run dev
```

With the server running at `http://localhost:8080`:

- Healthcheck JSON:
  ```bash
  curl -s http://localhost:8080/healthz | jq
  ```
- Prometheus metrics (plain text):
  ```bash
  curl -s http://localhost:8080/metrics | head -n 20
  ```

### 2. Exercise the Event Store
Run the manual script that appends an event and then replays the JSONL file:

```bash
cd app/node
npx ts-node scripts/manual-event-store.ts
```

The script ensures `data/events.jsonl` exists, writes a new event with an incremental `offset`, and prints all stored events.
