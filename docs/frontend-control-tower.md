# Frontend Control Tower Notes

## Portal Structure

- `app/(dashboard)/boxes/page.tsx` — main workspace listing boxes by lifecycle state (draft, sandbox, production) with CTA to open the designer embed.
- `app/(dashboard)/boxes/[boxId]/design/page.tsx` — hosts the Budibase/Form.io iframe, wraps it in tenant-aware context providers, and shows schema diff preview and validation status.
- `app/(dashboard)/boxes/[boxId]/simulate/page.tsx` — displays recent sandbox runs, launch modal for new simulations (payload builder + mandate preview), and streaming logs from the simulation runner.
- `app/(dashboard)/boxes/[boxId]/publish/page.tsx` — handles promotion workflow, gateway provisioning status, OpenAPI download links, and SDK version badges.
- `app/(dashboard)/analytics/page.tsx` — aggregates per-box usage, mandate counts, error trends, and quota consumption charts.

## Data Fetching & State

- Server actions retrieve box metadata via `/internal/boxes` FastAPI endpoints, normalized into React Query caches for optimistic updates.
- The designer iframe posts schema updates through a signed message channel; Next.js API routes persist changes and update validation status.
- Simulation results stream through Server-Sent Events (SSE) so the UI can animate status chips, display logs, and attach downloadable artifacts.
- Promotion flows call server actions that orchestrate gateway provisioning; UI reflects long-running tasks with background polling and toast alerts.

## Integration Tasks

1. Build a secure handshake between the portal and form builder (JWT embed tokens, tenant-scoped secrets).
2. Implement schema diff view using `@uiw/react-json-view` to highlight changes between drafts and production.
3. Surface mandate preview cards (Cart hash, Payment hash, signer fingerprint) ahead of simulation runs for operator confidence.
4. Provide copy-ready snippets for TypeScript/Python SDK usage, regenerated when the box schema version increments.
5. Add audit timeline component showing key events (schema saved, simulation passed, endpoint promoted, key rotated) with links to detailed logs.

