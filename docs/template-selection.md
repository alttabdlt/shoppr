# Template Selection

## Chosen Template

- **Repository:** https://github.com/nextjs/saas-starter
- **Stack Highlights:** Next.js App Router, Prisma + PostgreSQL, Tailwind CSS, Auth.js, multi-tenant primitives, billing scaffolding.

## Rationale

1. **Developer portal fit:** Provides authentication, team/tenant management, and dashboard components that can host the box designer, simulation history, and analytics with minimal boilerplate.
2. **Server actions & API routes:** Modern Next.js patterns simplify secure server-side calls into the FastAPI backend for schema persistence, mandate previews, and credential management.
3. **Design system leverage:** Tailwind + shadcn/ui offer flexible building blocks to embed the form builder (iframe/SDK) alongside native controls for promotion workflows and logs.
4. **Integration readiness:** Prisma/PostgreSQL align with the box registry storage; Auth.js hooks let us stitch in OAuth2/OIDC providers shared with the API gateway.
5. **Extensibility:** Clear module boundaries support future additions like billing pages, developer documentation, and usage analytics without rethinking layout or routing.

## Immediate Adaptations Needed

- Replace monetization flows geared toward Stripe Checkout with tiered API plans tied to gateway usage and quota enforcement.
- Integrate the chosen form builder (Budibase/Form.io) via secure iframe/embed, passing tenant context and persisting schemas through backend APIs.
- Build dedicated workspaces for Box Designer, Simulation Runs, Mandate Ledger, and SDK downloads within the existing dashboard shell.
- Wire portal auth to share tokens/claims with the FastAPI services and API gateway (SSO across portal, builder, and API clients).
- Adjust onboarding to collect merchant agent certificates/keys, configure KMS aliases, and surface key rotation reminders.

