import { v5 as uuidv5, validate as validateUuid } from 'uuid';
import { getTeamForUser } from '@/lib/db/queries';

const DEFAULT_NAMESPACE = 'c2b969ce-8a5e-4a2f-8f91-e8d16f0a4d2f';

function getNamespace(): string {
  const namespace = process.env.PLATFORM_TENANT_NAMESPACE_UUID;
  if (namespace && validateUuid(namespace)) {
    return namespace;
  }
  return DEFAULT_NAMESPACE;
}

export async function resolveTenantContext() {
  const team = await getTeamForUser();
  if (!team) {
    const namespace = getNamespace();
    const tenantId = uuidv5('team:fallback', namespace);

    return {
      tenantId,
      team: {
        id: 0,
        name: 'Demo Team',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stripeCustomerId: null,
        stripeProductId: null,
        stripeSubscriptionId: null,
        planName: 'demo',
        subscriptionStatus: 'active'
      }
    } as const;
  }

  const namespace = getNamespace();
  const tenantId = uuidv5(`team:${team.id}`, namespace);

  return {
    tenantId,
    team,
  } as const;
}
