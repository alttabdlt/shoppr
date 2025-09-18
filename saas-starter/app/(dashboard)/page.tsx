import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, ShieldCheck, Cpu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <HeroBadge />
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Launch AP2-ready commerce flows in minutes.
          </h1>
          <p className="text-lg text-muted-foreground">
            Design "empty boxes" that encode shopping intent, generate cryptographically signed AP2 mandates, and ship production-ready endpoints with trust and connector telemetry baked in.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/dashboard">Open control tower</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/dashboard/boxes">
                Manage boxes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <InfoCard
            title="Mandates as evidence"
            description="Intent, Cart, and Payment payloads are signed, hashed, and persisted so every transaction remains auditable."
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
          />
          <InfoCard
            title="Connector orchestration"
            description="Card rail simulator with step-up handling today; swap in real Stripe/x402 connectors when you're ready."
            icon={<Cpu className="h-5 w-5 text-primary" />}
          />
          <InfoCard
            title="Trust-first design"
            description="Pluggable trust providers (allowlist, mock DID) validate merchant and agent credentials before mandates are issued."
            icon={<Zap className="h-5 w-5 text-primary" />}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <FeatureCard
          title="Box Designer"
          description="Drag-and-drop schema builder powered by Budibase to capture price caps, supplier rules, and shipping policies."
        />
        <FeatureCard
          title="Simulation Pipeline"
          description="Async workers generate mandates, call connectors, log artifacts, and expose metrics via a single health endpoint."
        />
        <FeatureCard
          title="Developer Experience"
          description="OpenAPI + SDK snippets, hashed artifacts, and trust posture surfaced directly in the Next.js control tower."
        />
      </section>
    </main>
  );
}

function HeroBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
      AP2 Box Platform
    </span>
  );
}

function InfoCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-border/60 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Ship AP2-ready endpoints without stitching mandate builders, trust registries, and connector plumbing by hand.
        </p>
      </CardContent>
    </Card>
  );
}
