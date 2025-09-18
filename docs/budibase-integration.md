# Budibase Integration Plan

## Deployment Approach

- **Runtime:** Self-host Budibase using the official Docker stack (`docker compose -f docker-compose.yml up app worker`). Run it inside the project’s `infrastructure` namespace once Terraform manifests are available; for local development keep a `.env.local` with admin credentials.
- **Data Source:** Use the platform API (`/v1/boxes`) as Budibase’s external data provider. Each table in Budibase maps to a box schema, allowing CRUD flows via REST actions.
- **Single Sign-On:** Issue short-lived JWT embed tokens from the portal backend (`POST /v1/boxes/{boxId}` response). Tokens include tenantId, boxId, userId, and Budibase role claims.
- **Networking:** Place Budibase behind the same reverse proxy as the portal in production; for local testing expose it on `http://localhost:10000` and proxy through Next.js API routes to avoid CORS complexity.

## Embed Handshake

1. Portal resolves tenant context and requests an embed token:
   - Server-side loader calls `resolveTenantContext()` which maps the current team to a deterministic UUID (via `PLATFORM_TENANT_NAMESPACE_UUID`).
   - Loader invokes `/v1/boxes/{boxId}/embed-token` with the resolved tenant.
   - FastAPI service signs JWT using Budibase shared secret (`BB_EMBED_SECRET`).
2. Next.js page (`boxes/[boxId]/design`) renders an iframe pointing to `https://budibase.example.com/embed/<appId>?token=<jwt>`.
3. Budibase validates the JWT, scopes the session to the box’s tenant, and restricts builder actions (no data source edits).
4. Budibase sends `postMessage` events on schema changes; the portal listens and forwards payloads to `/v1/boxes/{boxId}/schema`.
   - Events must include a JSON Schema with `type: "object"` and `properties` to satisfy backend validation.

## Local Setup Checklist

- Install Docker (Desktop or CLI) and run `docker compose up budibase` using the stack snippet below.
- Configure environment variables in `.env.local`:
  - `BUDIBASE_URL=http://localhost:10000`
  - `BUDIBASE_EMBED_SECRET=...`
  - `PLATFORM_API_URL=http://localhost:8000`
  - `PLATFORM_TENANT_NAMESPACE_UUID=<valid UUID>`
- The schema registry seeds a fallback "Demo Checkout Box" for the tenant derived from `team:fallback` in the configured namespace. Adjust the namespace if you need a different default tenant.
- Seed Budibase with the "AP2 Box Designer" app template, including form components mapped to schema fields (SKU, priceCap, suppliers, cartPolicy, paymentPolicy).

### Minimal Docker Compose (local-only)

```yaml
version: "3.8"
services:
  budibase-app:
    image: budibase/budibase:latest
    ports:
      - "10000:80"
    environment:
      - JWT_SECRET=${BUDIBASE_EMBED_SECRET}
      - COUCHDB_USE_DEFAULT_USER=false
      - BUDIBASE_LAUNCH_ENV=production
    depends_on:
      - budibase-worker
  budibase-worker:
    image: budibase/worker:latest
    environment:
      - JWT_SECRET=${BUDIBASE_EMBED_SECRET}
```

## TODOs

- [x] Implement `/v1/boxes/{boxId}/embed-token` endpoint returning Budibase-compatible JWTs.
- [x] Build iframe wrapper component with handshake/error states in Next.js.
- [x] Capture schema change events (`postMessage`) and persist via `/v1/boxes/{boxId}/schema`.
- [ ] Add healthcheck monitors for Budibase service in production.
