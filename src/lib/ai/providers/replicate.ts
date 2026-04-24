import { createHash } from 'node:crypto';
import {
  ImageGenerationProvider,
  ProviderRefusedError,
  type GenerationRequest,
  type GenerationResult,
  type ProviderCapabilities,
} from './base';
import { sdxlCompiler } from '../prompt/compilers/sdxl';
import { aiConfig } from '@config/ai';

type ReplicateClient = {
  run(
    ref: string,
    options: { input: Record<string, unknown> },
  ): Promise<unknown>;
};

/**
 * ReplicateProvider — SDXL + manga LoRA + IP-Adapter + ControlNet.
 * 주 용도: 망가 장면 생성, 스케치 정제.
 *
 * 주의: Replicate CDN URL은 24시간 만료. 호출자가 ImageIngestionService로 R2에 이관해야 함.
 */
export class ReplicateProvider extends ImageGenerationProvider {
  readonly id = 'replicate';
  readonly capabilities: ProviderCapabilities = {
    ipAdapter: true,
    controlNet: true,
    lora: true,
    characterConsistency: 'medium',
    supportedTemplates: ['manga-scene.v1', 'character-sheet.v1', 'panel-refinement.v1'],
    maxResolution: { width: 1536, height: 1536 },
  };

  private _client: ReplicateClient | null = null;

  private async client(): Promise<ReplicateClient> {
    if (!this._client) {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) {
        throw new ProviderRefusedError(this.id, 'REPLICATE_API_TOKEN is not set');
      }
      const mod = await import('replicate');
      const Replicate = (mod as { default: new (opts: { auth: string }) => ReplicateClient })
        .default;
      this._client = new Replicate({ auth: token });
    }
    return this._client;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    this.assertSupported(req);

    const { prompt, negativePrompt } = sdxlCompiler.compile(req.promptIR);
    const width = req.width ?? req.template.slots.width ?? aiConfig.defaults.width;
    const height = req.height ?? req.template.slots.height ?? aiConfig.defaults.height;
    const seed = req.seed ?? Math.floor(Math.random() * 2_147_483_647);

    const modelRef = resolveModelRef(req.template.id);
    const input: Record<string, unknown> = {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      seed,
      num_inference_steps: req.template.slots.steps ?? 28,
      guidance_scale: req.template.slots.cfg ?? 7,
    };

    if (req.characterRefs?.length) {
      input.ip_adapter_image = req.characterRefs[0]?.imageUrl;
      input.ip_adapter_weight = req.characterRefs[0]?.weight ?? 0.7;
    }
    if (req.controlImage) {
      input.control_image = req.controlImage.url;
      input.control_type = req.controlImage.type;
    }

    const client = await this.client();
    const output = await client.run(modelRef, { input });
    const imageUrl = extractFirstUrl(output);
    if (!imageUrl) {
      throw new ProviderRefusedError(this.id, 'no image URL returned from replicate.run');
    }

    return {
      imageUrl,
      imageSha256: createHash('sha256')
        .update(`${this.id}:${imageUrl}:${seed}`)
        .digest('hex'),
      seed,
      actualCostCents: this.estimateCostCents(req),
      providerMetadata: { modelRef, rawOutput: output },
      templateId: req.template.id,
      templateVersion: req.template.version,
    };
  }

  estimateCostCents(req: GenerationRequest): number {
    const hasControl = Boolean(req.controlImage);
    const hasIpAdapter = Boolean(req.characterRefs?.length);
    const base = 0.5;
    const extra = (hasControl ? 0.2 : 0) + (hasIpAdapter ? 0.2 : 0);
    return Math.ceil(base + extra);
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(process.env.REPLICATE_API_TOKEN);
  }
}

function resolveModelRef(templateId: string): string {
  switch (templateId) {
    case 'manga-scene.v1':
      return aiConfig.providers.replicate.models.sdxlManga;
    case 'character-sheet.v1':
      return aiConfig.providers.replicate.models.sdxlManga;
    case 'panel-refinement.v1':
      return aiConfig.providers.replicate.models.controlNetLineart;
    default:
      throw new Error(`unknown template for replicate: ${templateId}`);
  }
}

function extractFirstUrl(output: unknown): string | null {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    return output[0];
  }
  if (output && typeof output === 'object' && 'url' in output) {
    const u = (output as { url: unknown }).url;
    if (typeof u === 'string') return u;
  }
  return null;
}
