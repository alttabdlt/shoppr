import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

export async function GET() {
  const keyPresent = Boolean(
    process.env.OPENROUTER_API_KEY || process.env.AI_GATEWAY_API_KEY,
  );

  try {
    const model = myProvider.languageModel('chat-model');
    const { text } = await generateText({
      model,
      prompt: 'ping',
      maxOutputTokens: 8,
      temperature: 0,
    });

    return Response.json({
      ok: true,
      keyPresent,
      modelId: (model as any).modelId ?? 'unknown',
      sample: text,
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        keyPresent,
        error: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}
