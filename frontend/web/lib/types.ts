import type { UIMessage } from 'ai';
import type { ArtifactKind } from '@/features/artifacts/artifact';
import type { Suggestion } from '@/lib/db/schema';

export type MessageMetadata = {
  createdAt: string;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: Record<string, any>;
};

export type ChatTools = Record<string, unknown>;

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}
