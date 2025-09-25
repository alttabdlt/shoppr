# Shoppr Monorepo

This repository is organized as a pnpm workspace so we can evolve separate deployable apps and shared packages.

## Layout

- `frontend/web` – Next.js frontend (chat + APIs).
- `frontend/mobile` – Mobile client (scaffold placeholder).
- `backend/core` – Shared configuration, database schema, and service logic.
- `backend/servers/*` – Isolated MCP servers (each as a workspace package).
- `backend/scripts` – Dev/test scripts.
- `docs` – Architecture and agent documentation.
- `pnpm-workspace.yaml` – Workspace definition.

Add new apps under `frontend/*`, core services under `backend/*`, and integrations under `backend/servers/*`.

## Commands

Run workspace commands from the repository root:

```bash
pnpm install
pnpm dev      # runs @shoppr/web locally
pnpm build    # runs migrations then next build for @shoppr/web
pnpm lint
pnpm test
```

## Environment

1. Copy `.env.example` at repo root to `.env.local` and fill values.
2. Do not place `.env*` inside app folders — all processes read from root.
3. Configure production secrets via your deployment provider (e.g., Vercel env vars).

See `docs/ARCHITECTURE.md` for the high-level system design.
