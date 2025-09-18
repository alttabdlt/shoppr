# Acceptance Criteria

## Success Metrics (Early Access Cohort)

- **Box-to-endpoint velocity:** ≥80% of onboarding merchants publish a production endpoint within 7 days of receiving access.
- **Simulation fidelity:** ≥95% of sandbox runs complete without mandate validation errors across supported payment connectors.
- **Audit readiness:** 100% of mandates (Cart + Payment) traceable via ledger export with verified signatures.
- **Developer satisfaction:** CSAT ≥4.5/5 on onboarding surveys covering documentation, SDKs, and support responsiveness.

## Functional Criteria

- **Box Designer:** Drag-and-drop field creation with data types, conditional logic, and validation; schema preview updates in real time and persists version history.
- **Schema Enforcement:** Incoming payloads to box endpoints are validated against generated JSON schemas with descriptive error responses and correlation IDs.
- **Mandate Generation:** Cart and Payment mandates are produced with correct hashing, linked identifiers, and cryptographic signatures using tenant-specific keys.
- **Simulation Harness:** Users can run sandbox transactions, view responses, download logs, and promote boxes only after a successful run.
- **API Publication:** Promotion creates versioned REST (and optional GraphQL) endpoints, API keys, and OpenAPI documents; rollbacks restore prior versions without orphaned keys.
- **SDK Delivery:** TypeScript and Python SDKs are generated automatically per box version, referencing the correct schema typings and mandate helpers.
- **Portal Analytics:** Dashboard surfaces per-box usage, error rates, and mandate issuance metrics with exportable reports.

## Non-Functional Criteria

- **Security:** OAuth2/OIDC enforced for portal and APIs; mandates and keys stored encrypted; signing keys never leave KMS/HSM boundaries.
- **Observability:** Distributed traces connect portal actions to mandate generation and gateway requests; critical metrics (simulation latency, error rate, signing failures) alert within defined SLOs.
- **Reliability:** Gateway provisioning, mandate generation, and SDK publishing are idempotent; retries use exponential backoff with dead-letter queues monitored.
- **Compliance:** Immutable ledger retains mandate hashes for ≥7 years with configurable retention for sandbox data.

## Sign-off Checklist

1. At least three design partners complete sandbox → production workflow using the portal.
2. External security review covers key management, OAuth scopes, and mandate ledger controls with no unresolved critical findings.
3. Documentation (quickstarts, API reference, runbooks) published in developer portal and versioned in repo.
4. Billing/plan enforcement enabled with rate limits and alerts for quota breaches.

