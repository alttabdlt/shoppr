import { NextResponse } from 'next/server';
import { resolveTenantContext } from '@/lib/tenant';
import { createBox, listBoxes } from '@/lib/platform-api';
import { demoBoxDraft } from '@/lib/demo-box';

type DashboardBox = {
  id: string;
  name: string;
  lifecycle: string;
  version: string;
  lastSimulationAt: string;
  connectorSuccess: string;
  trust: string;
  owner: string;
};

const stubStats = [
  {
    id: 'mandates',
    label: 'Mandates issued (7d)',
    value: '4,892',
    change: '+8.1% vs prior week'
  },
  {
    id: 'successRate',
    label: 'Connector success',
    value: '98.6%',
    change: 'SLA met'
  },
  {
    id: 'trustedPairs',
    label: 'Trusted merchant-agent pairs',
    value: '37',
    change: '+5 new this week'
  }
];

const stubTimeline = {
  lastSimulation: {
    id: 'sim-9041',
    boxName: 'OpsBox: Sneaker Launch',
    runAt: '2024-09-18T09:24:00Z',
    status: 'authorized'
  },
  queueDepth: {
    label: 'Queue depth',
    value: '3 jobs pending'
  },
  lastDeployment: {
    version: 'v0.9.2',
    deployedAt: '2024-09-16T21:12:00Z'
  }
};

const stubTrust = {
  totalTrusted: 37,
  pendingReviews: 2,
  alerts: [
    {
      id: 'alert-merchant-804',
      merchantId: 'did:web:trust.example/merchant-804',
      agentId: 'did:web:trust.example/agent-gamma',
      status: 'pending-review',
      detail: 'Awaiting credential refresh (expires in 3 days)',
      lastSeen: '2024-09-18T07:32:00Z'
    },
    {
      id: 'alert-merchant-512',
      merchantId: 'merchant-default',
      agentId: 'agent-default',
      status: 'trusted',
      detail: 'Auto-approved via allowlist',
      lastSeen: '2024-09-17T13:01:00Z'
    }
  ]
};

const stubConnector = {
  successRate: '98.6%',
  totals: {
    success: 3284,
    failure: 47
  },
  rails: [
    {
      id: 'card',
      name: 'Card',
      success: 98.6,
      failures: 32,
      stepUps: 74
    },
    {
      id: 'bank',
      name: 'Bank A2A',
      success: 96.4,
      failures: 11,
      stepUps: 5
    },
    {
      id: 'x402',
      name: 'x402 Sandbox',
      success: 92.0,
      failures: 4,
      stepUps: 2
    }
  ]
};

const stubBoxes: DashboardBox[] = [
  {
    id: 'box-ops',
    name: 'OpsBox: Sneaker Launch',
    lifecycle: 'production',
    version: '1.4.3',
    lastSimulationAt: '2024-09-18T09:24:00Z',
    connectorSuccess: '99.2%',
    trust: 'trusted',
    owner: 'atlas@ops.example'
  },
  {
    id: 'box-flash',
    name: 'FlashDrop: Noon Promo',
    lifecycle: 'sandbox',
    version: '0.3.0',
    lastSimulationAt: '2024-09-18T07:42:00Z',
    connectorSuccess: '96.8%',
    trust: 'pending-review',
    owner: 'flash@promo.io'
  },
  {
    id: 'box-replenish',
    name: 'Replenishment North America',
    lifecycle: 'production',
    version: '1.2.1',
    lastSimulationAt: '2024-09-17T20:05:00Z',
    connectorSuccess: '98.1%',
    trust: 'trusted',
    owner: 'ops@mission.market'
  }
];

const stubSimulations = [
  {
    id: 'sim-9041',
    box: 'OpsBox: Sneaker Launch',
    merchantId: 'merchant-default',
    agentId: 'agent-default',
    status: 'authorized',
    connectorStatus: 'card.authorized',
    durationMs: 840,
    runAt: '2024-09-18T09:24:00Z'
  },
  {
    id: 'sim-9034',
    box: 'FlashDrop: Noon Promo',
    merchantId: 'did:web:trust.example/merchant-804',
    agentId: 'agent-beta',
    status: 'requires_step_up',
    connectorStatus: 'card.step_up',
    durationMs: 1260,
    runAt: '2024-09-18T07:42:00Z'
  },
  {
    id: 'sim-9030',
    box: 'Replenishment North America',
    merchantId: 'merchant-492',
    agentId: 'agent-gamma',
    status: 'failed',
    connectorStatus: 'card.declined',
    durationMs: 910,
    runAt: '2024-09-17T20:05:00Z'
  }
];

async function toDashboardBoxes(tenantId: string, teamName: string | undefined) {
  const response = (await listBoxes(tenantId)) as { items?: unknown[] };
  const boxItems = Array.isArray(response.items) ? response.items : [];
  const owner = teamName ? `${teamName} Ops` : 'Demo Team';

  return boxItems.map((record: any) => {
    const updatedAt = record.updated_at ?? record.updatedAt ?? new Date().toISOString();
    const version = record.version ?? '0.1.0';
    const lifecycle = record.state ?? 'draft';

    return {
      id: String(record.id),
      name: record.name ?? 'Untitled Box',
      lifecycle,
      version,
      lastSimulationAt: typeof updatedAt === 'string' ? updatedAt : new Date(updatedAt).toISOString(),
      connectorSuccess: '—',
      trust: 'trusted',
      owner,
    } satisfies DashboardBox;
  });
}

async function ensureDemoBox(tenantId: string, teamName: string | undefined): Promise<DashboardBox[] | null> {
  try {
    const boxes = await toDashboardBoxes(tenantId, teamName);
    if (boxes.length > 0) {
      return boxes;
    }

    await createBox(tenantId, demoBoxDraft);
    return await toDashboardBoxes(tenantId, teamName);
  } catch (error) {
    console.error('[dashboard] Failed to ensure demo box', error);
    return null;
  }
}

async function loadBoxes(): Promise<DashboardBox[] | null> {
  try {
    const { tenantId, team } = await resolveTenantContext();
    return await ensureDemoBox(tenantId, team?.name);
  } catch (error) {
    console.error('[dashboard] Failed to load boxes from platform API', error);
    return null;
  }
}

export async function GET() {
  const boxes = (await loadBoxes()) ?? stubBoxes;
  const primaryBox = boxes[0];

  const timeline = {
    ...stubTimeline,
    lastSimulation: {
      ...stubTimeline.lastSimulation,
      boxName: primaryBox?.name ?? stubTimeline.lastSimulation.boxName,
      runAt: primaryBox?.lastSimulationAt ?? stubTimeline.lastSimulation.runAt
    }
  };

  return NextResponse.json({
    stats: stubStats,
    timeline,
    trust: stubTrust,
    connector: stubConnector,
    boxes,
    simulations: stubSimulations
  });
}
