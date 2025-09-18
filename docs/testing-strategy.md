# Testing Strategy

## Regression Assets

- **Schema Fixtures:** Library of box JSON schemas covering common commerce scenarios (single item, bundles, subscription renewals) plus edge cases (conditional fields, currency tolerances).
- **Mandate Corpus:** Golden Cart and Payment mandate pairs with expected hashes/signatures to verify orchestrator correctness across currencies and locales.
- **Simulator Scripts:** Deterministic payment gateway mocks (success, declines, network errors) and merchant webhook responders for replayable end-to-end tests.
- **SDK Snapshots:** Baseline TypeScript/Python SDK outputs per schema to guard against breaking API surface changes during codegen.

## Automated Tests

- **Unit Tests:** Pydantic schema mapping, mandate hashing/signing utilities, API gateway provisioning adapters, and form builder webhook handlers.
- **Contract Tests:** Validate REST/GraphQL endpoints against generated OpenAPI documents; ensure OAuth scopes and error payloads remain stable.
- **Integration Tests:** Full box lifecycle (draft → simulation → production) executed in CI using headless form submissions and sandbox payments.
- **Security Tests:** Automated JWS signature verification, replay attack prevention, key rotation flows, and RBAC enforcement for portal APIs.
- **SDK Tests:** Language-specific suites verifying schema validation, mandate helpers, and retry/backoff logic with mocked gateway responses.

## Operational Drills

- **Key rotation exercise:** Rotate tenant signing keys, reissue SDK secrets, and confirm mandates continue to verify.
- **Gateway outage simulation:** Degrade Kong/Zuplo routes to ensure retries, DLQ alerts, and portal status messaging behave correctly.
- **High-volume sandbox runs:** Trigger 10k simulations to observe worker autoscaling, queue depth, and ledger write performance.
- **Audit export rehearse:** Generate regulator-facing mandate ledger dump, validate hashes externally, and test encrypted delivery workflow.
- **Queue/backend failover:** Switch `SIMULATION_QUEUE_BACKEND` between `asyncio` and `redis`, force Redis outages, and verify jobs requeue without data loss. Validate S3 artifact fetches when local cache is absent.

## Monitoring & Alerting

- Schema publish failures, mandate signing latency, signature verification error rate, simulation success %, gateway 4xx/5xx distribution.
- SDK download counts, API key provisioning errors, rate-limit breach alerts, and OAuth token issuance anomalies.
- SLO dashboards for draft-to-production promotion time, sandbox job queue wait, and ledger write durability.
