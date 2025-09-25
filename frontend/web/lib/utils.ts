import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const data = await res.json();
      message = data?.cause || data?.error || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const res = await fetch(input, init);
  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const data = await res.json();
      message = data?.cause || data?.error || message;
    } catch {}
    throw new Error(message);
  }
  return res;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function getTextFromMessage(message: any): string {
  try {
    return (message.parts || [])
      .filter((p: any) => p?.type === 'text')
      .map((p: any) => p.text)
      .join('');
  } catch {
    return '';
  }
}

export function convertToUIMessages(messages: Array<any>) {
  return (messages || []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant' | 'system',
    parts: (m.parts as any[]) ?? [],
    metadata: { createdAt: new Date(m.createdAt ?? Date.now()).toISOString() },
  }));
}

export function getDocumentTimestampByIndex(
  documents: Array<{ createdAt: Date }>,
  index: number,
) {
  if (!documents || index >= documents.length) return new Date();
  return documents[index].createdAt;
}

export function formatAddress(address?: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
