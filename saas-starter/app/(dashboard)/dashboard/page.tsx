'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Activity, Cpu, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// TODO: replace with real API typing once backend wiring lands.
type OverviewResponse = {
  stats: { id: string; label: string; value: string; change: string }[];
  timeline: {
    lastSimulation: { id: string; boxName: string; runAt: string; status: string };
    queueDepth: { label: string; value: string };
    lastDeployment: { version: string; deployedAt: string };
  };
  trust: {
    totalTrusted: number;
    pendingReviews: number;
    alerts: {
      id: string;
      merchantId: string;
      agentId: string;
      status: string;
      detail: string;
      lastSeen: string;
    }[];
  };
  connector: {
    successRate: string;
    totals: { success: number; failure: number };
    rails: { id: string; name: string; success: number; failures: number; stepUps: number }[];
  };
  boxes: {
    id: string;
    name: string;
    lifecycle: string;
    version: string;
    lastSimulationAt: string;
    connectorSuccess: string;
    trust: string;
    owner: string;
  }[];
  simulations: {
    id: string;
    box: string;
    merchantId: string;
    agentId: string;
    status: string;
    connectorStatus: string;
    durationMs: number;
    runAt: string;
  }[];
};

const statusColors: Record<string, string> = {
  trusted: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
  'pending-review': 'bg-amber-500/15 text-amber-600 border-amber-500/20',
  failed: 'bg-red-500/15 text-red-600 border-red-500/20'
};

export default function DashboardPage() {
  const { data } = useSWR<OverviewResponse>('/api/dashboard/overview', fetcher, {
    revalidateOnFocus: false
  });

  const stats = data?.stats ?? [];
  const boxes = data?.boxes ?? [];
  const simulations = data?.simulations ?? [];
  const rails = data?.connector.rails ?? [];
  const trustAlerts = data?.trust.alerts ?? [];
  const timeline = data?.timeline;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
          AP2 Control Tower
        </Badge>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Agentic Payments Overview</h1>
            <p className="text-sm text-muted-foreground">
              Monitor mandate generation, connector performance, and trust posture across your boxes.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/boxes">
              Manage boxes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.id} className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Run Summary</CardTitle>
              <CardDescription>Latest simulation execution and deployment timeline.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full">
              <Activity className="mr-1.5 h-3.5 w-3.5" /> Queue
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground uppercase">Last simulation</p>
              <p className="mt-1 text-sm font-medium">{timeline?.lastSimulation.boxName}</p>
              <p className="text-xs text-muted-foreground">
                {timeline?.lastSimulation.runAt
                  ? new Date(timeline.lastSimulation.runAt).toLocaleString()
                  : '—'}{' '}
                · {timeline?.lastSimulation.status}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/70 p-4 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Queue depth</p>
                <p className="text-sm font-medium">{timeline?.queueDepth.value}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Last deployment</p>
                <p className="text-sm font-medium">
                  {timeline?.lastDeployment.version} ·{' '}
                  {timeline?.lastDeployment.deployedAt
                    ? new Date(timeline.lastDeployment.deployedAt).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Trust posture
            </CardTitle>
            <CardDescription>
              {data?.trust.totalTrusted ?? 0} trusted pairs · {data?.trust.pendingReviews ?? 0} pending review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trustAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{alert.merchantId}</span>
                  <Badge className={statusColors[alert.status] ?? ''}>{alert.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Agent: {alert.agentId}</p>
                <p className="mt-2 text-xs text-muted-foreground">{alert.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent simulations</CardTitle>
              <CardDescription>Monitor connector outcomes and execution time.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/70 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{sim.box}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sim.runAt).toLocaleString()} · {sim.status} · {sim.connectorStatus}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground flex flex-col sm:items-end">
                  <span>Merchant: {sim.merchantId}</span>
                  <span>Agent: {sim.agentId}</span>
                  <span>Duration: {sim.durationMs} ms</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-4 w-4 text-primary" /> Connector telemetry
            </CardTitle>
            <CardDescription>{data?.connector.successRate} overall success</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rails.map((rail) => (
              <div key={rail.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{rail.name}</span>
                  <span>{rail.success.toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Failures: {rail.failures} · Step-ups: {rail.stepUps}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Active boxes</CardTitle>
              <CardDescription>Lifecycle status and connector health.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/dashboard/boxes">
                View all
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {boxes.map((box) => (
              <div key={box.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{box.name}</span>
                  <Badge variant="outline" className="rounded-full capitalize">
                    {box.lifecycle}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last simulation: {new Date(box.lastSimulationAt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Connector success: {box.connectorSuccess} · Trust: {box.trust}
                </p>
                <p className="text-xs text-muted-foreground">Owner: {box.owner}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-4 w-4 text-primary" /> Next actions
            </CardTitle>
            <CardDescription>Keep mandate evidence verifiable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Review pending trust alerts and re-issue credentials.</p>
            <p>• Promote FlashDrop sandbox to production once connector success exceeds 98%.</p>
            <p>• Enable stablecoin rail for OpsBox ahead of inventory cutover.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
