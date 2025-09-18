'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type OverviewResponse = {
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
};

const lifecycleStyles: Record<string, string> = {
  production: 'bg-primary/10 text-primary border-primary/20',
  sandbox: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  draft: 'bg-muted text-muted-foreground border-border'
};

export default function BoxesPage() {
  const { data } = useSWR<OverviewResponse>('/api/dashboard/overview', fetcher, {
    revalidateOnFocus: false
  });

  const boxes = data?.boxes ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Boxes</h1>
          <p className="text-sm text-muted-foreground">
            Configure AP2 shopping scenarios, track simulation history, and export ready-to-use endpoints.
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/boxes/new">
            Create box
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Active configurations</CardTitle>
            <CardDescription>Lifecycle, trust posture, and connector performance.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {boxes.map((box) => (
            <div key={box.id} className="rounded-lg border border-border/60 bg-background/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{box.name}</p>
                  <p className="text-xs text-muted-foreground">Owner: {box.owner}</p>
                  <p className="text-xs text-muted-foreground">Version {box.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={lifecycleStyles[box.lifecycle] ?? 'bg-muted'}>
                    {box.lifecycle}
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-xs">
                    Connector {box.connectorSuccess}
                  </Badge>
                  {box.trust === 'trusted' ? (
                    <Badge variant="outline" className="rounded-full text-xs gap-1 text-emerald-600 border-emerald-500/20">
                      <ShieldCheck className="h-3 w-3" /> Trusted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full text-xs gap-1 text-amber-600 border-amber-500/20">
                      <ShieldAlert className="h-3 w-3" /> {box.trust}
                    </Badge>
                  )}
                  <Button asChild variant="secondary" size="sm" className="rounded-full">
                    <Link href={`/dashboard/boxes/${box.id}/design`}>Open</Link>
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Last simulation: {new Date(box.lastSimulationAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

