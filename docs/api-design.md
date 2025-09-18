# API Design

This document sketches the initial API surface area for the AP2 Box Platform. It separates **internal platform APIs** (used by the portal, Budibase embed, and automation) from **published runtime APIs** (consumed by merchant backends or AI agents). All endpoints are versioned (`/v1/`), require OAuth2/OIDC access tokens, and emit problem+json error payloads with correlation IDs.

## Internal Platform API (FastAPI)

### Box lifecycle

- `POST /v1/boxes`
  - Create a draft box. Body: `BoxDefinitionDraft` (name, description, initial schema stub, tenant metadata).
  - Returns `201` with `boxId`, version `v0`, and embed token claims for Budibase.
- `GET /v1/boxes`
  - List boxes filtered by tenant, lifecycle state, tags.
- `GET /v1/boxes/{boxId}`
  - Retrieve current schema, metadata, trust policies, rail configuration, and latest simulation status.
- `PATCH /v1/boxes/{boxId}/schema`
  - Update JSON schema, validation rules, and UI metadata. Supports optimistic concurrency via `If-Match` headers.
- `POST /v1/boxes/{boxId}/embed-token`
  - Issue a short-lived JWT for Budibase embedding. Accepts app identifier and role, returns token + expiry for iframe handshake.
- `POST /v1/boxes/{boxId}/intent`
  - Generate an Intent Mandate template with constraints (price cap, suppliers, TTL). Stores template hash for audit.
- `POST /v1/boxes/{boxId}/publish`
  - Promote box state (draft → sandbox → production). Triggers gateway provisioning, SDK regeneration, and audit entries.
- `POST /v1/boxes/{boxId}/rollback`
  - Revert to a previous published version. Closes current API keys and restores prior OpenAPI spec.

### Simulation & mandate tooling

- `POST /v1/boxes/{boxId}/simulate`
  - Execute a sandbox run. Request contains cart payload (matching schema), payment method stub, optional step-up instructions.
  - Enqueues job, returns `202` with `simulationId`.
- `GET /v1/simulations/{simulationId}`
  - Poll simulation status, timing, mandate hashes, and connector responses (includes `error` field when jobs fail).
- `GET /v1/simulations/{simulationId}/artifacts`
  - Signed URL bundle including Intent, Cart, Payment mandates, raw requests/responses, and lineage graph.
  - Automatically falls back to the configured artifact repository (filesystem/S3/etc.) if in-memory copies are unavailable.
- `GET /v1/health/simulation`
  - Health check returning queue backend, artifact repository, worker count, and aggregate metrics (`enqueued`, `completed`, `failed`, `completed_by_backend`, `connector_success`, `connector_failure`).

### Trust & keys

- `GET /v1/trust/providers`
  - List available trust registry adapters (e.g., `sandbox`, `allowlist`, `did:web`).
- `PUT /v1/boxes/{boxId}/trust-policy`
  - Configure which provider validates merchant/agent keys and the policy for delegated flows (step-up required, manual approval, expiry).
- `POST /v1/boxes/{boxId}/keys`
  - Generate or rotate signing keys through KMS. Accepts `purpose` (`cart`, `payment`), returns public key, key ARN, and activation timestamp.

### Gateway & SDK operations

- `GET /v1/boxes/{boxId}/gateway`
  - View gateway routes, rate limits, and API key metadata.
- `POST /v1/boxes/{boxId}/gateway/regenerate`
  - Rotate API keys, optionally generate short-lived client credentials.
- `POST /v1/boxes/{boxId}/sdk`
  - Trigger codegen (TypeScript primary, Python secondary, optional MCP/A2A exports). Returns package version and changelog entries.

### Audit & observability

- `GET /v1/boxes/{boxId}/timeline`
  - Event stream: schema saves, simulations, promotions, key rotations.
- `GET /v1/boxes/{boxId}/mandates`
  - Paginated ledger view (Intent, Cart, Payment) with signature verification status.
- `GET /v1/metrics`
  - Aggregated stats (simulation success %, latency, error codes) for portal dashboards.

## Published Runtime API (via API Gateway)

Each promoted box exposes a dedicated namespace under `/runtime/v1/boxes/{boxId}`. Gateway validates against the box’s generated JSON schema and enforces tenant rate limits.

### Execute a mandate-controlled purchase

- `POST /runtime/v1/boxes/{boxId}/run`
  - Body: `MandateExecutionRequest` containing the cart payload plus contextual metadata (channel, agentId).
  - Flow:
    1. Validate payload against Cart schema.
    2. Issue Intent Mandate if provided template requires runtime bindings.
    3. Generate Cart Mandate, sign with tenant key.
    4. Generate Payment Mandate (card rails by default) and forward to merchant adapter.
  - Response: `MandateExecutionResponse` with mandate hashes, status (`pending_step_up`, `submitted`, `completed`), and next-step links.

### Step-up & confirmation

- `POST /runtime/v1/boxes/{boxId}/step-up`
  - Accepts challenge payload (3DS, OTP) tied to a `mandateExecutionId`. Validates challenge with simulator or live processor.

### Mandate inspection

- `GET /runtime/v1/boxes/{boxId}/mandates/{mandateId}`
  - Returns signed mandate payload, associated hashes, signer fingerprint, and status history.

### Webhooks

- `POST https://<client-endpoint>/ap2/mandate-status`
  - Gateway sends when mandate transitions (e.g., `pending_step_up`, `submitted`, `completed`, `failed`, `disputed`). Payload mirrors `MandateExecutionResponse` plus reason codes.
- `POST https://<client-endpoint>/ap2/dispute`
  - Delivered when merchant raises a dispute; includes mandate references and evidence URLs.
- Webhook retry policy follows exponential backoff with idempotency keys (`X-AP2-Signature` header for verification).

### Polyfill adapters

Published runtime can target non-AP2 merchants by specifying adapter IDs:

- `POST /runtime/v1/boxes/{boxId}/run?adapter=stripe-test`
- `POST /runtime/v1/boxes/{boxId}/run?adapter=merchant-simulator`

Adapters translate mandates to legacy APIs while preserving ledger entries.

## Data Models (high level)

```json
MandateExecutionRequest {
  "cart": { /* schema generated from box */ },
  "context": {
    "agentId": "string",
    "channel": "web|agent-card|api",
    "session": "uuid"
  },
  "paymentMethod": {
    "type": "card",
    "stepUpPreference": "automatic|manual"
  }
}
```

```json
MandateExecutionResponse {
  "mandateExecutionId": "uuid",
  "intentMandateId": "uuid|null",
  "cartMandateId": "uuid",
  "paymentMandateId": "uuid",
  "status": "pending_step_up|submitted|completed|failed|disputed",
  "hashes": {
    "cart": "sha256",
    "payment": "sha256"
  },
  "error": "string|null",
  "nextActions": [
    { "type": "step_up", "url": "https://..." }
  ]
}
```

## Versioning & Compatibility

- Every published box increments a semantic version (`major.minor.patch`). Major changes imply breaking schema updates; the gateway keeps prior major versions active until clients rotate.
- Intent/Cart/Payment mandates include `schemaVersion` fields so downstream verifiers can reconcile payload expectations.
- Conformance tests execute against AP2 reference suites before promotion; failures block publication.

## TODO Backlog (tracked in roadmap)

- Implement Trust Provider plugin system (allowlist + DID-based registry adapters).
- Add adapter SDK for merchant-side simulations and legacy payment bridges.
- Extend API gateway config to emit MCP/A2A descriptors alongside REST endpoints.
- Document dispute webhook contract and evidence upload workflow.
