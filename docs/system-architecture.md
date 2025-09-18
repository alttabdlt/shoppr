# System Architecture

## High-Level Diagram

```
Merchant Portal (Next.js)
   ↕ OAuth/OIDC (Auth0/Cognito)
Form Builder (Budibase/Form.io)
   ↕ GraphQL/REST adapters
Platform API (FastAPI + Pydantic)
   ├─ Box Registry (PostgreSQL JSONB)
   ├─ Mandate Orchestrator (signing, hashing)
   ├─ Simulation Runner (Celery/Kafka workers)
   ├─ SDK Packager (TS/Python codegen)
   └─ Audit Log Writer (immutable store)
        ↕
Secrets/KMS —> Key material, signing certs
        ↕
API Gateway (Kong/Zuplo/Tyk)
   ↕
Published Box Endpoints (REST/GraphQL) ←→ Client Agents & Merchant APIs
```

## Core Technologies

- **Backend:** FastAPI with async workers, Pydantic models, SQLAlchemy for relational persistence, PostgreSQL for schema storage, Redis for caching schema metadata.
- **Form Builder:** Self-hosted Budibase (selected) providing drag-and-drop UI, JSON schema output, and webhook triggers into the Platform API; adapters keep the interface swappable if future requirements demand alternative builders.
- **Signing & Security:** JSON Web Signatures (JWS) via `jwcrypto` or `pyca/cryptography`, KMS/HSM integration for merchant agent keys, OAuth2/OIDC for portal and API clients.
- **Gateway:** Kong/Zuplo/Tyk managing routing, rate limits, API keys, OAuth client registration, request validation against OpenAPI specs.
- **Workers:** Celery or Dramatiq workers for mandate generation, simulation execution, and SDK build pipelines, using SQS/Kafka as the broker (local dev uses an asyncio-backed in-process queue).
- **Storage:** Encrypted S3-compatible bucket for simulation artifacts (filesystem fallback in dev), immutable append-only log (e.g., AWS QLDB or PostgreSQL with audit triggers) for mandate ledger.
- **Frontend:** Next.js SaaS starter (App Router) hosting portal, integrating form builder iframe/SDK, and consuming internal APIs via server actions.

## Service Responsibilities

- **Portal Gateway:** Handles tenant-aware sessions, surfaces box dashboards, manages lifecycle transitions (draft/sandbox/production), and proxies form builder auth.
- **Box Registry Service:** Persists schemas, UI metadata, conditional logic, and publishes schema versions for SDK codegen and validation pipelines.
- **Mandate Orchestrator:** Maps schema fields to AP2 Cart/Payment Mandate templates, enforces required attributes, signs payloads, and persists hashes for accountability.
- **Simulation Runner:** Builds AP2 Intent/Cart/Payment mandate stubs, verifies merchant/agent trust via a pluggable provider, invokes the card-rail connector stub, records responses and hashes, and emits telemetry for portal dashboards via the asynchronous job queue.
- **API Publication Service:** Generates OpenAPI documents, configures gateway routes/keys, and maintains versioned endpoint bundles per box with rollback support.
- **SDK Packager:** Creates TypeScript (primary) and Python (secondary) packages, injects schema typings, publishes to artifact registry (NPM/PyPI), and updates developer portal snippets plus optional MCP/A2A artefacts.
- **Observability & Ledger:** Centralized tracing (OpenTelemetry), metrics (Prometheus/Grafana) sourced from `/v1/health/simulation` counters, structured logs, and immutable ledger for mandate events.

## Cross-Cutting Concerns

- **Security & Multi-Tenancy:** Tenant-scoped secrets, per-tenant signing keys, RBAC in the portal, encryption at rest for mandates and schemas, and a pluggable Trust Provider interface to resolve agent/merchant credentials as registries emerge.
- **Data Lifecycle:** Version-controlled schemas with migration tooling, retention policies for simulation artifacts, and GDPR-compliant deletion workflows.
- **Compliance & Audit:** Every mandate issuance writes to the ledger with hash, signer, timestamp, and simulation result; exports available for regulators.
- **Reliability:** Outbox/inbox pattern for gateway provisioning, idempotent mandate generation, retry with exponential backoff for external simulators.
- **Configurability:** Environment switches (`SIMULATION_QUEUE_BACKEND`, `SIMULATION_REDIS_URL`, `SIMULATION_QUEUE_NAME`, `SIMULATION_ARTIFACT_REPOSITORY`, `SIMULATION_ARTIFACT_BUCKET`, `SIMULATION_WORKERS`) allow swapping dev in-process queues for production Redis/S3 infrastructure without code changes.
- **DX Tooling:** Developer portal integrates Swagger UI, Postman collections, and CLI download links; provide change feed webhooks for box version updates.
