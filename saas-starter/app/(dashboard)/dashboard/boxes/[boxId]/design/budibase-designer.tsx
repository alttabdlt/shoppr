'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { updateBoxSchema } from '@/lib/platform-api';

const SCHEMA_UPDATED_EVENTS = new Set(['schema.updated', 'schemaChanged']);

type Props = {
  token: string;
  budibaseUrl: string;
  appId: string;
  tenantId: string;
  boxId: string;
};

type DesignerEvent = {
  type?: string;
  payload?: {
    schema?: Record<string, unknown>;
    ui?: Record<string, unknown>;
    version?: string;
  };
};

export default function BudibaseDesigner({
  token,
  budibaseUrl,
  appId,
  tenantId,
  boxId,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);

  const origin = useMemo(() => {
    try {
      return new URL(budibaseUrl).origin;
    } catch (error) {
      console.error('Invalid Budibase URL', error);
      return budibaseUrl;
    }
  }, [budibaseUrl]);

  useEffect(() => {
    const handler = (event: MessageEvent<DesignerEvent>) => {
      if (event.origin !== origin) {
        return;
      }
      const data = event.data ?? {};
      if (!data.type) return;
      if (!SCHEMA_UPDATED_EVENTS.has(data.type)) return;
      const schemaPayload: Record<string, unknown> & {
        type: string;
        properties: Record<string, unknown>;
      } = { type: 'object', properties: {}, ...(data.payload?.schema ?? {}) };

      if (schemaPayload.type !== 'object') {
        schemaPayload.type = 'object';
      }
      if (typeof schemaPayload.properties !== 'object') {
        schemaPayload.properties = {};
      }

      const uiPayload = data.payload?.ui ?? {};
      const version = data.payload?.version;

      setStatus('saving');
      setError(null);

      updateBoxSchema(tenantId, boxId, {
        schema: schemaPayload,
        ui: uiPayload,
        version,
      })
        .then(() => {
          setStatus('saved');
          setTimeout(() => setStatus('idle'), 2000);
        })
        .catch((err: Error) => {
          console.error('Failed to persist schema', err);
          setError(err.message);
          setStatus('error');
        });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [origin, tenantId, boxId]);

  const designerUrl = useMemo(() => {
    const url = new URL(`/embed/${appId}`, budibaseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }, [appId, budibaseUrl, token]);

  const statusClass = {
    idle: 'text-muted-foreground',
    saving: 'text-amber-500',
    saved: 'text-emerald-500',
    error: 'text-destructive',
  }[status];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 bg-muted/10 px-6 py-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Status:</span>
          <span className={statusClass}>
            {status === 'idle' && 'Idle'}
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && 'Saved'}
            {status === 'error' && 'Error'}
          </span>
          {error && <span className="ml-4 text-destructive">{error}</span>}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={designerUrl}
        className="flex-1 border-0"
        allow="clipboard-write"
        title="Budibase Box Designer"
      />
    </div>
  );
}
