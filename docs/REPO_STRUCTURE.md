**Overview**
- Monorepo managed by `pnpm` with workspace packages for apps, core libs, and isolated MCP servers.

- **Top Level**
- `frontend/web` — Next.js chat app and API routes.
- `frontend/ui` — Shared UI primitives as a workspace package (`@shoppr/ui`).
- `frontend/mobile` — Mobile client (placeholder).
- `backend/core` — Core logic: tools registry, AI/tool adapters, policies, DB, and MCP integration APIs.
- `backend/servers/*` — Standalone MCP servers (each in its own package) for protocol/dapp integrations.
- `backend/scripts/` — Dev and test scripts.
- `docs/` — Architecture and integration docs.

**MCP Servers**
- Each server lives under `backend/servers/<name>` and builds to `dist/`.
- Naming convention: `@shoppr/mcp-<name>` (e.g., `@shoppr/mcp-test-mcp`).
- Core discovers servers via one of:
  - Config `module` field (explicit module specifier), or
  - Workspace package name `@shoppr/mcp-<name>`, or
  - `MCP_SERVERS_DIR` env var (e.g., `backend/servers`) containing `<name>/dist/index.js`.

**Development Flow**
- Run `pnpm -w -C backend/servers/test-mcp build` to build a server.
- Set `MCP_SERVERS_DIR=backend/servers` for local development and scripts.
- `backend/scripts/test-mcp.ts` exercises registration and calls sample tools.

**Environment**
- Use root `.env.local` for all secrets and `.env.example` for reference.
- Next.js and tooling load env from repo root (see `frontend/web/next.config.ts` and `frontend/web/drizzle.config.ts`).

**Why this layout**
- Isolates dapp/protocol integrations for safety and iteration speed.
- Enables adding many servers without bloating the core bundle.
- Keeps clear boundaries between UI (frontend), platform logic (backend/core), and integrations (backend/servers).
