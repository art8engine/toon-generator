import { createHash } from 'node:crypto';
import {
  ImageGenerationProvider,
  ProviderRefusedError,
  type GenerationRequest,
  type GenerationResult,
  type ProviderCapabilities,
} from './base';
import { geminiCompiler } from '../prompt/compilers/gemini';
import { aiConfig } from '@config/ai';

type GoogleAiClient = {
  models: {
    generateContent(params: {
      model: string;
      contents: unknown;
    }): Promise<unknown>;
  };
};

/**
 * GoogleAIProvider — Gemini 2.5 Flash Image (Nano Banana).
 * 주 용도: 캐릭터 레퍼런스 시트 생성 (일관성 최상).
 * 장면 생성은 Replicate에 맡기는 것을 권장 (망가 스타일 제어력이 약함).
 */
export class GoogleAIProvider extends ImageGenerationProvider {
  readonly id = 'google-ai';
  readonly capabilities: ProviderCapabilities = {
    ipAdapter: false,
    controlNet: false,
    lora: false,
    characterConsistency: 'high',
    supportedTemplates: ['character-sheet.v1'],
    maxResolution: { width: 1024, height: 1024 },
  };

  private _client: GoogleAiClient | null = null;

  private async client(): Promise<GoogleAiClient> {
    if (!this._client) {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new ProviderRefusedError(this.id, 'GOOGLE_AI_API_KEY is not set');
      }
      const mod = await import('@google/genai');
      const GoogleGenAI = (mod as {
        GoogleGenAI: new (opts: { apiKey: string }) => GoogleAiClient;
      }).GoogleGenAI;
      this._client = new GoogleGenAI({ apiKey });
    }
    return this._client;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    this.assertSupported(req);

    const { prompt } = geminiCompiler.compile(req.promptIR);
    const client = await this.client();
    const model = aiConfig.providers.googleAI.model;

    const parts: unknown[] = [{ text: prompt }];
    for (const ref of req.characterRefs ?? []) {
      parts.push({
        inlineData: { mimeType: 'image/png', data: await fetchAsBase64(ref.imageUrl) },
      });
    }

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
    });

    const imageUrl = extractGeminiImageUrl(response);
    if (!imageUrl) {
      throw new ProviderRefusedError(
        this.id,
        'Gemini returned no image (possibly blocked by safety filter)',
      );
    }

    const seed = req.seed ?? 0;
    return {
      imageUrl,
      imageSha256: createHash('sha256')
        .update(`${this.id}:${imageUrl}:${prompt}`)
        .digest('hex'),
      seed,
      actualCostCents: this.estimateCostCents(req),
      providerMetadata: { model, rawResponse: response },
      templateId: req.template.id,
      templateVersion: req.template.version,
    };
  }

  estimateCostCents(_req: GenerationRequest): number {
    // 2025~2026 기준 Nano Banana 요금 ~$0.04/image
    return 4;
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(process.env.GOOGLE_AI_API_KEY);
  }
}

async function fetchAsBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return url.split(',')[1] ?? '';
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch reference image: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

function extractGeminiImageUrl(response: unknown): string | null {
  const candidates = (response as { candidates?: unknown[] } | null)?.candidates;
  if (!Array.isArray(candidates)) return null;
  for (const c of candidates) {
    const parts = (c as { content?: { parts?: unknown[] } }).content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const inline = (p as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
      if (inline?.data) {
        return `data:${inline.mimeType ?? 'image/png'};base64,${inline.data}`;
      }
    }
  }
  return null;
}
