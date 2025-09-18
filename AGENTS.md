# Repository Guidelines

## Project Structure & Module Organization
- `apps/web/` hosts the Next.js SaaS starter portal (designer, simulations, analytics). Treat `app/`, `components/`, and `lib/` as the primary UI and server-action layers that call into the platform APIs.
- `services/` (planned) will contain FastAPI microservices: `schema-registry`, `mandate-orchestrator`, `simulation-runner`, and `sdk-packager`. Mirror module names to the subsystem list in `docs/`.
- `docs/` captures product, architecture, roadmap, testing, and template decisions. Update design notes here before making implementation changes.
- `infrastructure/` (planned) houses Terraform, Dockerfiles, and gateway deployment manifests (Kong/Zuplo/Tyk).

## Build, Test, and Development Commands
- `pnpm install` — install workspace dependencies for the portal.
- `pnpm dev` — start the Next.js dev server; requires FastAPI backends reachable locally.
- `pnpm lint` — run ESLint + Prettier checks to enforce repo-wide style rules.
- `python -m uvicorn services.schema_registry.main:app --reload` — run the schema registry FastAPI service during development (adjust module path as additional services land).
- Set `SIMULATION_WORKERS` to control concurrent background simulation jobs when running services locally.
- Use `SIMULATION_QUEUE_BACKEND` (`asyncio` default) and `SIMULATION_ARTIFACT_REPOSITORY` (`filesystem` default) to swap queue/persistence implementations.

## Coding Style & Naming Conventions
- Use TypeScript throughout the web app. Prefer functional React components with PascalCase filenames (e.g., `BoxTimeline.tsx`).
- Python services follow 4-space indentation, FastAPI routers grouped by domain, and Pydantic models suffixed with `Schema` or `Payload`.
- Export singleton helpers with camelCase (e.g., `boxGatewayClient`). Keep mandate helper functions stateless and pure where possible.

## Testing Guidelines
- Web: `pnpm test` for Vitest suites; colocate tests as `*.test.ts(x)` next to components/utilities.
- Services: use `pytest`, aiming for ≥80% coverage on schema translation, mandate signing, and simulation orchestration modules. Store fixtures under `tests/fixtures` and golden mandates under `tests/golden/`.
- Run security linting (`ruff`, `bandit`) and formatting (`ruff --fix`, `black`) on Python services.

## Commit & Pull Request Guidelines
- Write commits in present tense (`feat: add cart mandate signer`). Group related changes; avoid multi-feature mega commits.
- Pull requests must include context, linked roadmap phase, simulation screenshots/logs where relevant, and notes on tests executed. Call out follow-on work explicitly.

## Security & Configuration Tips
- Store secrets via `.env.local` (never commit) and document required keys in `docs/system-architecture.md`.
- Use the designated KMS/HSM for signing keys; never export raw private keys to local dev logs.
- Rotate API credentials quarterly and verify ledger exports as part of compliance drills.
- Configure Budibase embedding via `BUDIBASE_URL`, `BUDIBASE_EMBED_SECRET`, and `NEXT_PUBLIC_BUDIBASE_APP_ID`; set `PLATFORM_TENANT_NAMESPACE_UUID` so portal tenants map deterministically to platform UUIDs.
- Set `SIMULATION_WORKERS` to control concurrent background simulation jobs when running services locally.
- Use `SIMULATION_QUEUE_BACKEND` (`asyncio` default) and `SIMULATION_ARTIFACT_REPOSITORY` (`filesystem` default) to swap queue/persistence implementations.
- For Redis/S3 backends, define `SIMULATION_REDIS_URL`, `SIMULATION_QUEUE_NAME`, `SIMULATION_ARTIFACT_BUCKET`, plus optional `SIMULATION_ARTIFACT_REGION`/`SIMULATION_ARTIFACT_ENDPOINT`.
