# AP2 Box Platform

This repository now focuses on building an API-first platform that lets merchants and developers design configurable shopping “boxes,” validate AP2 mandate flows, and publish production-ready endpoints. The portal provides a drag-and-drop designer, sandbox simulator, and automatic SDK/code sample generation so AI agents can transact with confidence.

## Success Contract

Early access success is defined by:

- 80% of design partners shipping a production endpoint within 7 days of onboarding.
- ≥95% sandbox simulation pass rate across supported payment connectors.
- 100% mandate events (Cart + Payment) auditable through the ledger export with verified signatures.
- Developer onboarding CSAT ≥4.5/5 for documentation and SDK experience.

See `docs/acceptance-criteria.md` for detailed validation tactics.

## Documentation Map

- `docs/product-overview.md` — vision, user journeys, and subsystem breakdown for the AP2 platform.
- `docs/system-architecture.md` — high-level architecture, technology choices, and cross-cutting concerns.
- `docs/implementation-roadmap.md` — phased delivery plan covering designer, mandates, simulations, and publication.
- `docs/api-design.md` — current internal/runtime API surface, including mandate execution flows and webhooks.
- `docs/simulation-pipeline.md` — runbook for queue backends, artifact repositories, and simulation failure handling.
- `docs/testing-strategy.md` — regression assets, automated coverage, and operational drills.
- `docs/frontend-control-tower.md` — portal layout, data flows, and integration tasks for the designer and simulation UI.
- `docs/template-selection.md` — rationale for reusing the Next.js SaaS starter as the developer portal shell.

## Local Development

Start the schema registry + simulation service:

```bash
cd services
POETRY_VIRTUALENVS_IN_PROJECT=true poetry install
POETRY_VIRTUALENVS_IN_PROJECT=true poetry run uvicorn schema_registry.main:app --reload
```

Launch the Next.js control tower:

```bash
cd saas-starter
pnpm install
pnpm dev
```

Visit http://localhost:3000 to explore the AP2 overview dashboard and box manager. The UI reads placeholder data from `/api/dashboard/overview` until the FastAPI endpoints are wired in.

## Next Steps

1. Wire the Next.js portal to the FastAPI schema registry endpoints (list boxes, trigger simulations, surface mandate artifacts).
2. Integrate a real trust provider or DID registry once upstream specs solidify.
3. Replace the card connector stub with a Stripe/x402 sandbox adapter and expose connector logs in the dashboard.
# shoppr
