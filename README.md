# Shoppr Monorepo

This repository is organized as a pnpm workspace so we can evolve separate deployable apps and shared packages.

## Layout

- `apps/web` – Next.js frontend (formerly `ai-chatbot`) that exposes the chat experience.
- `packages/core` – Shared configuration, database schema, and service logic consumed by the web app.
- `docs` – Architecture and agent documentation.
- `pnpm-workspace.yaml` – Workspace definition.

Additional apps/packages can be added under `apps/*` or `packages/*` as the platform grows.

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

1. Copy `.env.example` from `apps/web` when bootstrapping a new environment.
2. Configure the variables in Vercel before deploying.

See `docs/ARCHITECTURE.md` for the high-level system design.
