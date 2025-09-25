export const MCPServerConfig = {
  servers: [
    {
      name: 'test-mcp',
      enabled: true,
      // Optionally load from workspace package if present
      module: '@shoppr/mcp-test-mcp',
      config: {},
    },
  ],
} as const;
