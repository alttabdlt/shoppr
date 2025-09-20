# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shoppr is a cross-chain execution assistant that converts natural language instructions into safe, audited transactions across EVM chains. The system is built as a pnpm workspace with a Next.js frontend and shared core packages.

## Architecture

- **apps/web**: Next.js frontend with chat interface, API routes, and wallet connectivity
- **packages/core**: Shared configuration, database schema, and service logic
- **docs/**: Architecture documentation and agent specifications

The system implements an agent-based architecture with specialized services for intent parsing, quote orchestration, risk assessment, routing decisions, execution, and monitoring.

## Development Commands

Run all commands from the repository root:

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Start web app (Next.js dev server)
pnpm dev:all      # Start all services (uses scripts/start-dev.sh)

# Building & Testing
pnpm build        # Run migrations + build web app
pnpm lint         # Lint web app (Biome)
pnpm test         # Run tests (Playwright)
pnpm typecheck    # TypeScript checking

# Database commands (run from apps/web/)
pnpm db:generate  # Generate Drizzle schema
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm db:push      # Push schema changes
pnpm db:pull      # Pull schema from DB
```

## Technology Stack

- **Frontend**: Next.js 15, React 19 RC, TypeScript
- **UI**: Radix UI components, Tailwind CSS, shadcn/ui
- **AI**: AI SDK with Qwen models via OpenRouter
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js 5.0 beta
- **Testing**: Playwright for E2E tests
- **Code Quality**: Biome for linting and formatting
- **Package Manager**: pnpm with workspace support

## Key File Locations

- **Configuration**: `packages/core/src/config/` (chains, assets, risk scoring, policy)
- **Database Schema**: `packages/core/src/lib/db/schema.ts`
- **API Routes**: `apps/web/app/(routes)/api/` (intent, quotes, execute, receipts, status)
- **Chat Routes**: `apps/web/app/(chat)/api/` (chat, documents, files, suggestions)
- **Core Services**: `packages/core/src/lib/` (intent, quotes, risk, router, execution, etc.)

## Environment Setup

1. Copy `apps/web/.env.example` to `apps/web/.env.local`
2. Configure required environment variables:
   - `AUTH_SECRET`: Random 32-byte secret
   - `OPENROUTER_API_KEY`: OpenRouter API key (get from https://openrouter.ai/keys)
   - `POSTGRES_URL`: Database connection string
   - `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage
   - `REDIS_URL`: Redis connection string
   - Optional OpenRouter config: `OPENROUTER_BASE_URL`, `OPENROUTER_REFERER`, `OPENROUTER_TITLE`
   - Optional model overrides: `OPENROUTER_CHAT_MODEL_ID`, `OPENROUTER_REASONING_MODEL_ID`

## Database Management

The project uses Drizzle ORM with PostgreSQL. Database migrations run automatically during build. The schema includes:
- User management and authentication
- Chat sessions and messages (v2 schema)
- Document management and suggestions
- Voting system for message feedback

## Cross-Chain Architecture

Shoppr implements a deterministic routing system:
1. **Intent Parsing**: Natural language → structured intent
2. **Quote Orchestration**: Parallel quotes from bridges/DEXs
3. **Risk Assessment**: Policy enforcement and bridge scoring
4. **Route Selection**: Deterministic scoring based on net output
5. **Execution**: MEV-protected transaction submission
6. **Monitoring**: Real-time status and receipt generation

## AI Provider Configuration

- **Primary Provider**: OpenRouter (https://openrouter.ai)
- **Default Models**: Qwen3-32B (chat), Qwen3-30B-A3B (reasoning)
- **Health Check**: `GET /api/health/openrouter` to verify connectivity
- **Model Access**: Ensure your OpenRouter account has access to Qwen models
- **Troubleshooting**: Check API key, model permissions, and network connectivity

## Testing

- E2E tests use Playwright with `PLAYWRIGHT=True` environment variable
- Tests are located in `apps/web/tests/e2e/`
- Run tests with `pnpm test` from root or `apps/web/`

## Important Notes

- The project is in active development with some modules still being implemented
- Uses React 19 RC and Next.js 15 canary builds
- The chat interface supports file uploads, document editing, and AI suggestions
- Cross-chain execution is the core focus with support for ETH, USDC, and project tokens