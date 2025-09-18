# Implementation Roadmap

## Phase 0 — Pivot Alignment (Week 0)

- Finalize AP2 protocol interpretation, key management requirements, and mandate signing strategy.
- Deploy Budibase (self-hosted) for the box designer and define single sign-on/embed boundaries with the Next.js portal.
- Establish FastAPI monorepo skeleton, shared Pydantic models for mandates, and infrastructure IaC placeholders (gateway, secrets, observability).

## Phase 1 — Box Designer Foundation (Weeks 1–2)

- Embed Budibase inside the portal with workspace/tenant isolation, JWT-based embed tokens, and role-based access.
- Persist box definitions (JSON schema, UI metadata, lifecycle state) in PostgreSQL with version history.
- Implement schema validation service and preview renderer for live payload testing without mandate signing.
- Define a Trust Provider interface (in-memory stub for now) to decouple future registry integrations from the designer experience.

## Phase 2 — Mandate Orchestration (Weeks 3–4)

- Translate box schemas into AP2 Cart Mandate payloads with configurable defaults (currency, locale, shipping policies).
- Implement Payment Mandate generation that links to Cart mandates via cryptographic hashes and merchant agent keys.
- Build secure key vault adapters (e.g., AWS KMS/HSM abstraction) and audit log capture for every mandate issuance.
- Extend the Trust Provider interface with policy guardrails for delegated flows (step-up enforcement, manual approvals).

## Phase 3 — Transaction Simulation & Sandbox (Weeks 5–6)

- Stand up a transaction simulator with pluggable connectors for dummy card processors or merchant-provided webhooks.
- Ship a Stripe-like card "test mode" harness with step-up challenge support and extend connectors to non-AP2 merchants via adapter shims.
- Record end-to-end test runs, including mandate payloads, gateway responses, and timing metrics; surface them in the portal.
- Add alerting and notifications for failed simulations or signature verification errors.

## Phase 4 — API Publication & Gateway Integration (Weeks 7–8)

- Automate OpenAPI/Swagger document generation per box version and publish via the API gateway (Kong/Zuplo).
- Provision API keys, OAuth2 clients, and rate-limiting policies tied to tenant/box metadata.
- Implement promotion workflow (draft → sandbox → production) with rollback and immutable history.

## Phase 5 — SDKs & Developer Experience (Weeks 9–10)

- Release the primary TypeScript SDK (Node + browser) with schema-aware payload builders, mandate helpers, and retry logic.
- Follow with a Python SDK that mirrors the TypeScript API surface and bundles AP2 reference types.
- Launch developer portal assets: quickstart guides, code samples, interactive API explorer, MCP/A2A export options, and changelog automation.

## Phase 6 — Scale, Compliance, and GTM (Weeks 11–12)

- Add multi-region deployment support, observability dashboards, and error budget SLOs.
- Conduct external security review (mandate storage, key handling, OAuth scopes) and document compliance posture.
- Ship pricing/billing integration for tiered plans (free sandbox, usage-based production, enterprise SLAs) and feed telemetry into RevOps tooling.
- Prepare roadmap for delegated (human-not-present) flows with policy guardrails and partner-led pilots.

## Key Dependencies

- Merchant agent private key management strategy and HSM/KMS availability.
- Selection of API gateway (Kong vs Zuplo vs Tyk) and supporting infrastructure.
- Access to AP2 sandbox suites and reference agents for integration testing.
- Availability of trust registries or interim allowlists for agent/merchant verification.
- Product/UX decisions on template library, cloning behavior, and versioning semantics.
