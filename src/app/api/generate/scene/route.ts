import { NextResponse } from 'next/server';
import { createDefaultRegistry } from '@/lib/ai/registry';
import { defaultTemplate } from '@/lib/ai/workflows/types';
import { SafetyAdapter } from '@/lib/ai/safety';
import { emptyPromptIR, type PromptIR } from '@/lib/ai/prompt/ir';
import { mockCharacters, type MentionCandidate } from '@/lib/characters/mock-store';
import { aiConfig } from '@config/ai';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface ScenePayload {
  prompt: string;
  mentionIds?: string[];
  seed?: number;
}

export async function POST(req: Request) {
  let payload: ScenePayload;
  try {
    payload = (await req.json()) as ScenePayload;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const prompt = (payload.prompt ?? '').trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const mentions: MentionCandidate[] = (payload.mentionIds ?? [])
    .map((id) => mockCharacters.find((c) => c.id === id))
    .filter((c): c is MentionCandidate => Boolean(c));

  const ir: PromptIR = buildPromptIR(prompt, mentions);

  const safety = new SafetyAdapter();
  const verdict = safety.check(ir);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: `blocked by safety: ${verdict.reasons.join('; ')}` },
      { status: 400 },
    );
  }

  const registry = createDefaultRegistry();
  const provider = registry.routeFor('sceneGeneration');
  const template = defaultTemplate['manga-scene.v1']();

  const started = Date.now();
  try {
    const result = await provider.generate({
      template,
      promptIR: ir,
      seed: payload.seed,
    });
    return NextResponse.json({
      imageUrl: result.imageUrl,
      providerId: provider.id,
      templateId: result.templateId,
      templateVersion: result.templateVersion,
      seed: result.seed,
      sha256: result.imageSha256,
      actualCostCents: result.actualCostCents,
      elapsedMs: Date.now() - started,
      routing: aiConfig.routing,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: (err as Error).message,
        providerId: provider.id,
        hint: 'API 키가 없거나 프로바이더가 거절했습니다. /api/health 로 등록 상태를 확인해보세요.',
      },
      { status: 500 },
    );
  }
}

function buildPromptIR(prompt: string, mentions: MentionCandidate[]): PromptIR {
  const ir = emptyPromptIR();
  ir.subject = prompt;
  ir.style = 'manga-bw';
  ir.attributes = mentions.flatMap((m) => [m.name, m.shortDescription]);
  ir.freeTags = mentions.map((m) => `@${m.name}`);
  ir.negatives = ['color', 'watermark', 'text'];
  return ir;
}
