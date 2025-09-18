# Agent Responsibilities

This repository delivers an AI-assisted cross-chain execution assistant. The system is organized as a set of cooperating agents that turn natural-language intents into safe, audited transactions. Each agent runs as a focused service or module with clear contracts so the workflow remains observable and deterministic.

## 1. Conversational Intent Agent
- **Goal**: Capture user objectives through chat, collect contextual parameters (chains, assets, constraints), and surface clarifying questions.
- **Inputs**: Natural-language prompts, wallet metadata, recent conversation state.
- **Outputs**: Structured intent proposals ready for validation.
- **Key Dependencies**: Next.js chat surface, WalletConnect/Web3Modal, session storage.
- **Failure Modes**: Ambiguous instructions, missing wallet permissions, unsupported chains/assets.

## 2. Intent Validation Agent
- **Goal**: Normalize the conversational proposal into the canonical intent schema and reject unsafe or incomplete requests.
- **Inputs**: Proposed intent payload, configuration (allow-lists, limits), AI SDK model for structured extraction.
- **Outputs**: Signed-off `Intent` JSON object or a rejection message with remediation guidance.
- **Key Dependencies**: Zod/JSON schema validators, policy configuration store, AI provider credentials.
- **Failure Modes**: Schema mismatches, stale config, provider timeouts.

## 3. Quote Orchestration Agent
- **Goal**: Query bridge and swap providers in parallel, harmonize quotes, and score candidates for the router.
- **Inputs**: Validated intent, user balances (optional), provider adapters (LI.FI/Jumper, Socket/Bungee, Across, CoW, UniswapX).
- **Outputs**: Normalized route options annotated with fees, timings, risk metadata, and explanatory notes.
- **Key Dependencies**: Provider SDKs/APIs, rate limiting, caching layer, telemetry.
- **Failure Modes**: Provider outages, inconsistent decimals, stale prices, risk-tier gaps.

## 4. Risk & Policy Agent
- **Goal**: Apply deterministic policy, enforce bridge risk tiers, and block routes violating guardrails.
- **Inputs**: Candidate routes, policy config (`bridge_risk_score.json`, thresholds, kill switches).
- **Outputs**: Filtered route list plus policy rationales for audit trails.
- **Key Dependencies**: Policy engine, configuration service, audit logging.
- **Failure Modes**: Misconfigured thresholds, missing entries for new providers, policy drift.

## 5. Routing & Decision Agent
- **Goal**: Compute the net-outcome score, choose the winning route, and provide deterministic reasoning.
- **Inputs**: Policy-approved routes, scoring formula parameters, historical performance data.
- **Outputs**: Winner route ID, decision rationale, fallback ranking for monitoring.
- **Key Dependencies**: Deterministic scoring engine, math utilities, persistence for receipts.
- **Failure Modes**: Incorrect fee normalization, double counting MEV buffers, empty candidate list.

## 6. Execution Agent
- **Goal**: Drive transaction submission through MEV-protected RPCs, coordinate multi-leg flows, and capture signatures.
- **Inputs**: Winning route, user approvals, execution policies, RPC endpoints.
- **Outputs**: Transaction bundle submissions, execution IDs, intermediate status updates.
- **Key Dependencies**: MEV-protected relays, smart contract adapters, retry logic.
- **Failure Modes**: RPC downtime, insufficient approvals, chain re-orgs, gas price spikes.

## 7. Monitoring & Receipts Agent
- **Goal**: Observe execution progress, detect anomalies, and publish auditable receipts.
- **Inputs**: Execution IDs, on-chain confirmations, telemetry events, retry signals.
- **Outputs**: User-facing statuses, final receipts (decision trace, tx hashes, realized prices), alerts.
- **Key Dependencies**: Indexers, webhook/event bus, Postgres, observability suite.
- **Failure Modes**: Missed confirmations, delayed webhook callbacks, data retention gaps.

## 8. Observability & Compliance Agent
- **Goal**: Consolidate metrics, traces, and logs across agents, and ensure evidence retention for audits.
- **Inputs**: Structured logs, trace spans, metrics exporters, policy events.
- **Outputs**: Dashboards, alerting signals, compliance-ready audit bundles.
- **Key Dependencies**: Telemetry pipeline, storage lifecycle policies, alerting integrations.
- **Failure Modes**: Cardinality blow-ups, dropped spans, retention misconfiguration.

## Collaboration Flow
- The conversational and validation agents transform natural language into a safe, structured intent.
- The orchestration, risk, and routing agents converge on the optimal route while preserving policy guardrails.
- Execution, monitoring, and observability agents deliver the transaction, surface real-time status, and capture evidence.

Together these agents fulfill Shoppr’s objective: convert user instructions into reliable, policy-compliant cross-chain settlement with full transparency.
