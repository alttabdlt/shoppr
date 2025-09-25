/*
  Quick test runner for MCP server registration.
  Usage: pnpm dlx tsx backend/scripts/test-mcp.ts
*/

process.env.MCP_SERVERS_ENABLED = process.env.MCP_SERVERS_ENABLED ?? 'true';
process.env.MCP_SERVERS_DIR = process.env.MCP_SERVERS_DIR ?? 'backend/servers';

async function main() {
  // Import from source to avoid build step
  const { initializeToolRegistry, getToolRegistry } = await import('../core/src/lib/tools');
  const { registerMCPServersFromConfig } = await import('../core/src/lib/mcp-servers');

  // Initialize built-in tools
  initializeToolRegistry();

  // Try to execute; if tools aren't registered yet, register explicitly.
  const registry = getToolRegistry();
  if (!registry.get('mcp__test-mcp__ping')) {
    await registerMCPServersFromConfig();
  }

  // fetch the same instance
  const reg = getToolRegistry();

  const ping = await reg.execute('mcp__test-mcp__ping', {}, { chainId: 1 });
  console.log('[MCP ping]', ping);

  const echo = await reg.execute('mcp__test-mcp__echo', { message: 'hello' }, { chainId: 1 });
  console.log('[MCP echo]', echo);

  const sum = await reg.execute('mcp__test-mcp__sum', { a: 2, b: 3 }, { chainId: 1 });
  console.log('[MCP sum]', sum);
}

main().catch((err) => {
  console.error('MCP test failed:', err);
  process.exit(1);
});
