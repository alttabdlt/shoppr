import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { validate as validateUuid } from 'uuid';
import { createBox, createEmbedToken, getBox, listBoxes } from '@/lib/platform-api';
import { resolveTenantContext } from '@/lib/tenant';
import { demoBoxDraft } from '@/lib/demo-box';
import BudibaseDesigner from './budibase-designer';

type BoxRecordResponse = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

const BUDIBASE_URL =
  process.env.NEXT_PUBLIC_BUDIBASE_URL ??
  process.env.BUDIBASE_URL ??
  'http://localhost:10000';

const BUDIBASE_APP_ID =
  process.env.NEXT_PUBLIC_BUDIBASE_APP_ID ?? process.env.BUDIBASE_APP_ID ?? '';

async function ensureTenantBoxId(tenantId: string, boxId: string) {
  if (validateUuid(boxId)) {
    return boxId;
  }

  const response = (await listBoxes(tenantId)) as { items?: BoxRecordResponse[] };
  let items = Array.isArray(response.items) ? response.items : [];

  if (items.length === 0) {
    await createBox(tenantId, demoBoxDraft);
    const refreshed = (await listBoxes(tenantId)) as { items?: BoxRecordResponse[] };
    items = Array.isArray(refreshed.items) ? refreshed.items : [];
  }

  const first = items[0];
  if (first?.id && validateUuid(String(first.id))) {
    redirect(`/dashboard/boxes/${String(first.id)}/design`);
  }

  return null;
}

async function fetchEmbedContext(boxId: string) {
  const tenantContext = await resolveTenantContext();
  if (!tenantContext) {
    return null;
  }

  const { tenantId, team } = tenantContext;

  const canonicalId = await ensureTenantBoxId(tenantId, boxId);
  if (!canonicalId) {
    return null;
  }

  const box = (await getBox(tenantId, canonicalId).catch(() => null)) as BoxRecordResponse | null;
  if (!box) {
    return null;
  }
  const tokenResponse = (await createEmbedToken(tenantId, canonicalId, {
    appId: BUDIBASE_APP_ID || undefined,
  })) as { token: string; expiresAt: string };

  return {
    tenantId,
    team,
    box,
    boxId: canonicalId,
    token: tokenResponse.token,
    expiresAt: tokenResponse.expiresAt,
  };
}

export default async function BoxDesignerPage({
  params,
}: {
  params: Promise<{ boxId: string }>;
}) {
  const { boxId } = await params;
  const context = await fetchEmbedContext(boxId);

  if (!context) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Assign a team to continue</h1>
        <p className="mt-4 text-muted-foreground">
          We could not resolve your tenant context. Ensure your account is linked
          to a team and reload the designer.
        </p>
      </div>
    );
  }

  if (!BUDIBASE_APP_ID) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Budibase configuration required</h1>
        <p className="mt-4 text-muted-foreground">
          Set <code className="font-mono">NEXT_PUBLIC_BUDIBASE_APP_ID</code> (and
          related URL/secret env vars) to render the embedded designer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <div className="border-b border-border/60 bg-background/60 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-muted-foreground">Designing</p>
            <h1 className="text-2xl font-semibold">{context.box.name}</h1>
            <p className="text-sm text-muted-foreground">
              Token expires at {new Date(context.expiresAt).toLocaleTimeString()}
              {' · Team '} {context.team?.name ?? 'Unknown team'}
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="p-6">Loading designer…</div>}>
        <BudibaseDesigner
          token={context.token}
          budibaseUrl={BUDIBASE_URL}
          appId={BUDIBASE_APP_ID}
          tenantId={context.tenantId}
          boxId={context.boxId}
        />
      </Suspense>
    </div>
  );
}
