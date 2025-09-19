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

### 3. Create an order via HTTP
With the API running you can submit a `CreateOrder` command. The endpoint is idempotent by `client_request_id`:

```bash
curl -s http://localhost:8080/orders \
  -H 'content-type: application/json' \
  -d '{
    "clientRequestId": "17b6e695-7cbd-4bd5-b62e-ff3f6ccab04c",
    "customerId": "5e2ad359-8624-4bd9-8d8c-31f04b7ce986",
    "currency": "USD",
    "items": [
      { "sku": "widget-001", "quantity": 2, "unitPrice": 25 }
    ],
    "payment": {
      "method": "credit_card",
      "amount": 50,
      "currency": "USD"
    }
  }' | jq
```

Replaying the same request returns the same `orderId` without duplicating events.
