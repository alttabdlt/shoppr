'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewBoxPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href="/dashboard/boxes">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to boxes
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create a new box</h1>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Box designer handshake</CardTitle>
          <CardDescription>
            Launch the Budibase-based designer to configure mandate rules, trust policies, and connector preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Ensure the schema registry service is running (<code>poetry run uvicorn schema_registry.main:app --reload</code>).</li>
            <li>
              From the dashboard, select an existing box and open the <strong>Design</strong> view to load the embedded builder.
            </li>
            <li>The designer will mint schema updates which appear here once the Budibase integration is wired to the backend.</li>
          </ol>
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 flex items-start gap-3">
            <ListChecks className="h-5 w-5 text-primary" />
            <p>
              Need a jump start? Duplicate an existing production box and adjust intent, cart, and payment policies before promoting the new version.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/dashboard/boxes">
              View existing boxes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

