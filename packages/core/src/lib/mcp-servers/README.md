MCP Servers
===========

Structure
- servers/<name>/index.ts — exports `createServer(config?)`
- servers/<name>/tools/*.ts — individual tool implementations
- types.ts — shared MCP server types
- index.ts — registration helpers + config loader

Conventions
- Tool IDs are exposed to the app as `mcp__<server>__<tool>`
- Each tool file exports a `MCPServerTool`
- Servers may implement optional `initialize()` and `ping()`

Add a Server
1) Create folder: `servers/<name>/`
2) Implement `servers/<name>/index.ts` with `export function createServer(config?): MCPServer`
3) Add tools under `servers/<name>/tools/`
4) Add to `packages/core/src/config/mcp-servers.ts`

Loading
- `initializeToolRegistry()` will auto-load servers if `MCP_SERVERS_ENABLED` is true
- Or call `registerMCPServersFromConfig()` directly

