MCP Servers
===========

Structure
- External servers live under top-level `backend/servers/<name>` (workspace packages)
- Each server exports `createServer(config?)` from its package entry (e.g., `dist/index.js`)
- `types.ts` — shared MCP server types (exported from `@shoppr/core`)
- `index.ts` — registration helpers + config loader (this module)

Conventions
- Tool IDs are exposed to the app as `mcp__<server>__<tool>`
- Each tool file exports a `MCPServerTool`
- Servers may implement optional `initialize()` and `ping()`

Add a Server
1) Create a new workspace package under `backend/servers/<name>` and name it `@shoppr/mcp-<name>`
2) Implement `src/index.ts` that exports `createServer(config?): MCPServer`
3) Add tools under `src/tools/`
4) Either publish/add as dependency, or set `MCP_SERVERS_DIR=backend/servers` in your env for local dev
5) Add to `backend/core/src/config/mcp-servers.ts` (optionally include `module: '@shoppr/mcp-<name>'`)

Loading
- `initializeToolRegistry()` auto-loads servers if `MCP_SERVERS_ENABLED` is true.
- Discovery order per server:
  1) `entry.module` (explicit module specifier)
  2) `@shoppr/mcp-<name>` (workspace dependency)
  3) `MCP_SERVERS_DIR` (e.g., `backend/servers/<name>/dist/index.js`)
  4) Legacy in-core path `./servers/<name>/index.ts`
