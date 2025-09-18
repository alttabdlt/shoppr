# Architecture Overview

This document captures the v1 architecture for Shoppr’s cross-chain execution assistant. The product couples an AI-assisted intent builder with deterministic routing, bridging, and execution services so that users can safely move or rebalance assets across EVM chains.

## Product Scope (v1)

### Jobs to Be Done
- **Swap / bridge / deliver**: e.g. “Send 12 ETH on Ethereum → native USDC on <dst-chain>”, preferring canonical rails such as CCTP.
- **Portfolio rebalance**: e.g. “Sell 50% of HYPE to USDC on <dst-chain>”.

### Constraints
- Enforce slippage caps, daily spend limits, destination allow-lists, MEV protection, and auditable receipts.

### Non-Goals (v1)
- Custody, fiat on/off ramps, non-EVM chains, derivatives/perpetuals.

## Default Support Matrix

### Chains (configurable)
- ethereum, arbitrum, base, optimism, polygon, hyperevm (marked experimental).

### Assets
- ETH, WETH, USDC, plus allow-listed project tokens (e.g. HYPE) per chain.

### Preferred Rails
- Use canonical/native rails where available (e.g. USDC via CCTP); otherwise fall back to the best cross-chain aggregator route.

## System Architecture

### High-Level Flow

```mermaid
flowchart LR
  U[User] --> F[Next.js Chat + Intent Builder]
  F <--WalletConnect/Web3Modal--> W[User Wallet (EOA/AA)]
  F -->|Structured Intent| P[Parse Service (LLM via AI SDK)]
  P --> Q[Quote Orchestrator]
  Q --> A1[LI.FI / Jumper]
  Q --> A2[Socket / Bungee]
  Q --> A3[Across]
  Q --> S1[CoW Protocol]
  Q --> S2[UniswapX]
  Q --> R[Risk Engine + Policy]
  R --> D[Router (Decision)]
  D --> X[Execution Service (MEV-protected RPC)]
  X --> M[Route Monitor / Status]
  M --> C[Receipts + Audit Log]
  C --> DB[(Postgres)]
  F <--Status & Receipts--> C
  subgraph Observability
    T[Metrics | Traces | Logs]
  end
  Q --> T
  X --> T
  M --> T
```

### Component Responsibilities
- **Next.js Chat + Intent Builder**: Conversational UI that converts user prompts into structured intents and handles wallet connectivity.
- **Parse Service**: Uses the AI SDK to normalize free-form instructions into a validated intent schema.
- **Quote Orchestrator**: Fetches quotes from bridge and swap providers in parallel, normalizes outputs, and augments with policy metadata.
- **Risk Engine + Policy**: Applies route allow/block rules, risk tiers, and limits before selection.
- **Router**: Scores routes deterministically and selects the winner based on policy-adjusted net output.
- **Execution Service**: Submits transactions via MEV-protected RPCs and coordinates multi-leg execution.
- **Route Monitor & Receipts Service**: Tracks confirmations, emits status updates, stores audit trails, and exposes receipts via API.
- **Observability Stack**: Aggregates metrics, traces, and logs across orchestration, execution, and monitoring workflows.

## Data Persistence
- Postgres stores chats/intents, route decisions, execution receipts, and observability breadcrumbs required for audits.

## API Contracts (stable v1)

### Intent Object (JSON, zod/json-schema validated)

```json
{
  "intent_id": "uuid",
  "type": "swap_bridge_deliver" | "rebalance_sell",
  "from": {
    "chain": "ethereum|arbitrum|base|optimism|polygon|hyperevm",
    "asset": "ETH|WETH|USDC|HYPE",
    "amount": { "kind": "absolute|percent", "value": "1000" }
  },
  "to": { "chain": "…", "asset": "USDC" },
  "constraints": { "max_slippage_bps": 50, "deadline_s": 600, "min_out_usd": null },
  "policy": {
    "prefer_canonical_usdc": true,
    "mev_protect": true,
    "bridge_risk_tier": "A",
    "approvals": "permit_only"
  },
  "metadata": { "user_address": "0x…", "session_id": "…" }
}
```

### Endpoints
- `POST /api/intent/parse` → returns the validated intent (no execution).
- `POST /api/quotes` (body: intent + optional balances) → returns candidate routes and the selected decision payload.
- `POST /api/execute` (body: `intent_id`, `route_id`, `user_address`) → spins up execution and returns an `execution_id` plus transaction handles.
- `GET /api/status/:execution_id` → delivers real-time execution status and latest confirmation metadata.
- `GET /api/receipts/:intent_id` → exposes a human-readable decision trace, chosen route, transaction hashes, realized prices, and timestamps.

## Routing Policy (Deterministic)
- Objective: `net_out_usd = gross_out_usd − (bridge_fee + dex_fee + gas_usd + mev_slippage_buffer + failure_penalty + risk_penalty)`.
- Prefer native USDC mints whenever both chains support it; only choose non-canonical routes when the improvement exceeds the configured threshold.
- Quote LI.FI/Jumper, Socket/Bungee, Across + CoW/UniswapX concurrently and normalize totals for comparison.
- Reject any route that falls below the configured `bridge_risk_tier` (e.g. below “A”).
- Submit via MEV-protected infrastructure; prefer batch auction settlement (CoW) when available.

## Risk Model (Config Driven)
- `bridge_risk_score.json` enumerates trust model, finality, and incident history signals per provider, producing tiers A/B/C.
- Unknown bridges default to `deny`; native rails receive the strongest preference.

## Security Posture (v1)
- Keys remain in user-controlled wallets (EOA or ERC-4337 AA).
- Approvals issued via Permit2 / EIP-2612 with tight scope and automatic post-trade revocation.
- MEV-protected RPC usage is enforced by policy.
- A kill switch (env flag) instantly disables non-canonical routing paths.

## Operational Targets (SLAs)
- Quotes latency: P50 ≤ 1.2s, P95 ≤ 3.0s.
- Execution submission: ≤ 1.0s after user signature captured.
- Fast-path delivery: P50 ≤ 5 minutes; alert if > 15 minutes.
- Decision trace availability: 100% (receipts must persist).

## Release Gates & Acceptance Tests
- **Happy Path 1**: ETH → USDC (Arbitrum) chooses canonical route; receipts match on-chain hashes; final net out within 5 bps of preview.
- **Happy Path 2**: “Sell 50% HYPE → USDC” detects balances correctly, executes with MEV protection, and respects slippage caps.
- **Fallback**: If the primary aggregator fails, the router promotes the next candidate while meeting SLA targets.
- **Risk Gate**: Disallowed bridges in quotes are blocked with explicit user messaging.
- **Permit Hygiene**: Approvals are revoked or minimized after execution completes.

## Observability Expectations
- Every decision links trace IDs across intent parsing, quotes, routing, execution, and monitoring.
- Metrics, traces, and logs are emitted for provider latency, policy rejections, execution retries, and receipt publication.
