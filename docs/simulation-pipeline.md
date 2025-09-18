# Simulation Pipeline Runbook

## Overview

Simulation requests are queued by the schema registry service whenever a box draft runs the sandbox flow. Jobs are processed asynchronously and persist artifacts (Intent/Cart/Payment mandate stubs, connector responses) to a configurable repository.

```
Portal → POST /v1/boxes/{boxId}/simulate → Queue → Worker → Card Connector Stub → Artifact Repository → Ledger
```

### Mandate Generation (current behaviour)

- The worker compiles three AP2-compatible mandate payloads:
  - **Intent Mandate** with synthetic constraints (price cap, suppliers, TTL) and a one-hour default expiry.
  - **Cart Mandate** serialised from the box schema (items, currency, totals) with deterministic fallbacks when data is missing.
  - **Payment Mandate** referencing the cart hash and embedding the requested payment method (cards for v1).
- Merchant and agent identifiers are verified via the configured trust provider (`TRUST_PROVIDER=allowlist|did:mock|...`) before mandates are accepted; the trust verdict is attached to artifact metadata.
- The card connector stub simulates an authorization and returns a processor reference unless `simulateFailure` is present; hashes and connector payloads are written into the artifacts.
- Metrics increment for every enqueue/completion/failure and surface via `/v1/health/simulation`, including connector success/failure counters.

## Queue Backends

| Backend | Description | When to use |
|---------|-------------|-------------|
| `asyncio` | In-process queue used for local development. Runs worker coroutines inside the FastAPI service. | Local dev, CI smoke tests. |
| `redis` | Uses Redis lists (`BLPOP`) for distributed job processing. Requires `SIMULATION_REDIS_URL`. | Shared dev/staging and production clusters. |
| Custom dotted path | Importable class implementing `SimulationQueueBackend`. | Integrations with hosted queues (e.g., SQS, Cloud Tasks). |

Environment variables:

- `SIMULATION_QUEUE_BACKEND` — `asyncio` (default) or `redis`.
- `SIMULATION_WORKERS` — number of concurrent workers per instance.
- `SIMULATION_REDIS_URL` — required when using the Redis backend.
- `SIMULATION_QUEUE_NAME` — optional queue key (default `simulation-jobs`).
- `SIMULATION_QUEUE_POLL_INTERVAL` — seconds between empty-queue polls (default `0.5`).

## Artifact Repositories

| Repository | Description | Env configuration |
|------------|-------------|--------------------|
| `filesystem` | Persists artifacts to JSON files on disk (default path `services/schema_registry/data`). | `SIMULATION_ARTIFACT_REPOSITORY=filesystem`, optional `SIMULATION_ARTIFACT_ROOT`. |
| `s3` | Stores artifacts in an S3-compatible bucket via `aioboto3`. | `SIMULATION_ARTIFACT_REPOSITORY=s3`, `SIMULATION_ARTIFACT_BUCKET`, optional `SIMULATION_ARTIFACT_PREFIX`, `SIMULATION_ARTIFACT_REGION`, `SIMULATION_ARTIFACT_ENDPOINT`. |
| `memory` | Keeps artifacts in memory only (non-durable). Useful for unit tests. | `SIMULATION_ARTIFACT_REPOSITORY=memory`. |

Artifacts are always reverifiable via `GET /v1/simulations/{simulationId}/artifacts`, which first returns the cached payload and then falls back to the repository when needed.

## Health & Monitoring

- `GET /v1/health/simulation` returns the active queue backend, artifact repository, and worker count.
  - Response embed metrics (`enqueued`, `completed`, `failed`, `completed_by_backend`).
- Key metrics to watch:
  - Queue depth (Redis `LLEN`), job completion time, failure count.
  - Artifact repository latency and error rate (S3 `5xx`).

## Failure Handling

- Worker exceptions set the simulation status to `failed` and capture the error in `SimulationResponse.error`.
- Operators should:
  1. Inspect `/v1/simulations/{simulationId}` for the error message.
  2. Check queue connectivity (Redis/S3 health, credentials).
  3. Re-run the simulation after resolving the issue via `POST /v1/boxes/{boxId}/simulate`.
- Configure alerts for repeated failures or queue depth growth.

## Local Development Recipe

1. Ensure Python deps are installed (`redis`, `aioboto3`).
2. Optional: run Redis locally (`brew services start redis`) and set `SIMULATION_QUEUE_BACKEND=redis` with `SIMULATION_REDIS_URL=redis://localhost:6379/0`.
3. For artifact persistence on disk, set `SIMULATION_ARTIFACT_REPOSITORY=filesystem` (default) and inspect files under `services/schema_registry/data/`.
4. Hit `/v1/health/simulation` while the app runs to confirm the configuration.
