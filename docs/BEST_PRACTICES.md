**Monorepo Standards**

- Single root env: use `.env.local` for secrets (not committed) and `.env.example` for documentation; optional `.env` for defaults.
- Do not place `.env*` files inside app packages. All processes must load from repo root.
- UI primitives live in `@shoppr/ui` (frontend/ui). App code must not duplicate base UI.
- Feature-first organization in `frontend/web/features/*` (chat, artifacts, wallet, layout, notifications).
- Shared app-level items (e.g., icons) in `frontend/web/shared`.
- Avoid lockfiles inside packages (only root `pnpm-lock.yaml`).
- Use path aliases:
  - `@/features/*` → feature modules
  - `@/lib/*` → app-only utilities/types (frontend)
  - `@shoppr/ui/*` → shared UI primitives
- MCP servers: one server per workspace package under `backend/servers/*`.

**Environment Loading**

- Root `.env.local` is source of truth. Example env keys live in `.env.example`.
- Next.js app loads root env via `dotenv` in `frontend/web/next.config.ts`.
- Tools (e.g., Drizzle) load root env in their configs.
- Dev script (`backend/scripts/start-dev.sh`) sources root env and exports for child processes.

**Coding Conventions**

- Keep backend/core free of frontend frameworks/types.
- No transport or UI logic inside core; only domain logic, config, adapters.
- Prefer small, composable modules; collocate tests with features.
- Keep imports stable: app → features → shared/ui; do not import app code from ui.

**CI/CD**

- Run lint/typecheck/test via root scripts; avoid per-package lockfiles.
- Provide required secrets via CI secret manager; app reads from process.env only.

