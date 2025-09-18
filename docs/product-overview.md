# Product Overview

## Vision

Deliver an API-first platform that lets merchants and developers design configurable “empty boxes” representing AP2 shopping scenarios, validate them end-to-end, and publish production-ready endpoints with signed mandates. The product abstracts AP2’s cryptographic details so that teams can launch agent-driven commerce experiments without building mandate tooling, test harnesses, or gateway plumbing from scratch.

## Value Proposition

- **Rapid experimentation:** Create, test, and iterate on AP2 purchasing flows in a browser-based designer backed by dynamic JSON schemas.
- **Trust & compliance baked in:** Every exported endpoint ships with verifiable Cart and Payment Mandates, audit trails, and policy enforcement aligned with AP2’s authorization, authenticity, and accountability pillars.
- **Developer experience:** Auto-generated OpenAPI specs, SDKs, and sandbox credentials minimize integration work for AI agents or merchant apps.
- **Multi-tenant management:** Support distinct boxes per product line, market, or campaign with isolated keys, quotas, and analytics.

## Primary User Journeys

1. **Design a box:** Drag-and-drop fields (SKU, price rules, supplier constraints, fulfillment options) into a schema-backed form and set validation rules, currency handling, and conditional logic.
2. **Simulate a mandate:** Populate the box with sample data, produce signed Cart and Payment Mandates, and execute a test transaction against sandbox processors or merchant mocks.
3. **Publish an endpoint:** Promote a validated box to production, generating versioned REST/GraphQL endpoints, API keys, and downloadable SDK snippets.
4. **Monitor & iterate:** Track box usage, mandate issuance, and failure modes; clone or update boxes while preserving audit history.

## Major Subsystems

1. **Box Designer & Schema Service** — Low-code form builder (Budibase/Form.io integration) that persists JSON schemas, validation rules, and UI metadata.
2. **Mandate Orchestrator** — FastAPI service that maps schemas to AP2 Cart/Payment Mandate templates, performs cryptographic signing, and stores mandate hashes.
3. **Transaction Simulator** — Pluggable runner that replays mandates against sandbox payment processors or merchant-provided webhooks with deterministic fixtures.
4. **API Publication Pipeline** — Generates OpenAPI/GraphQL descriptors, provisions endpoints via the API gateway, and manages versioned deployments per box.
5. **Developer Portal & Analytics** — Next.js portal hosting the designer, test logs, credential management, rate-limit dashboards, and audit exports.
6. **SDK Workspace** — Automated TypeScript and Python SDK builds that wrap schema validation, mandate creation, and gateway calls; distributed via NPM/PyPI.
7. **Security & Compliance Layer** — Key management, encrypted mandate storage, immutable audit log, and runtime policy enforcement for OAuth2/OIDC tokens.

## Mandate Coverage

- **Intent Mandate:** Optional delegation for pre-authorized agent behavior (e.g., substitute product search) before cart creation.
- **Cart Mandate:** Encodes the configured box fields as payment_request metadata with shipping and fulfillment context.
- **Payment Mandate:** Links the Cart Mandate hash to payment method proofs, ensuring agent participation is auditable.

## Readiness Snapshot

### Works well today (focus for v1)

- Human-present payment flows where a buyer approves the cart and signs the Cart Mandate; the box compiler produces Intent templates, Cart validators, and hosted endpoints aligned with AP2’s accountability guarantees.
- Card-rail transactions with optional step-up (3DS/SCA) using a Stripe-like “test mode” simulator so teams can validate end-to-end mandates without live processors.
- Rail-neutral abstractions that default to cards while reserving extension points for stablecoins/x402 real-time payments once the ecosystem matures.

### Needs guardrails (later maturity)

- Delegated or human-not-present purchases; prototype with Intent Mandates but require policy enforcement and user step-up until AP2 v1.x solidifies fully autonomous flows.

### Ecosystem gaps to hedge

- Trust registries and key issuance remain emerging; ship a pluggable Trust Provider interface so new registries can be integrated without rewrites.
- Merchant adoption is early; provide simulator adapters and a polyfill layer so non-AP2 merchants can participate while standards propagate.

## Non-Goals for v1

- Building a proprietary payment processor; rely on existing gateways or merchant sandboxes.
- Supporting non-AP2 mandate formats or legacy checkout flows.
- Providing LLM agent authoring tools beyond sample notebooks and SDK helpers.
- Full-blown marketplace of third-party templates (enable export/import but no public gallery yet).
