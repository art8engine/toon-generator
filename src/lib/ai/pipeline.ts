import type { ProviderRegistry } from './registry';
import type { QuotaService } from '../quota/service';
import type { ImageIngestionService } from '../storage/ingestion';
import type { CharacterService } from '../characters/service';
import type { SafetyAdapter, SafetyRefusedError } from './safety';
import type { GenerationRequest, GenerationResult } from './providers/base';
import { defaultTemplate } from './workflows/types';
import type { PromptIR } from './prompt/ir';
import { storageConfig } from '@config/storage';

/**
 * GenerationPipeline — end-to-end 이미지 생성.
 *
 * 순서:
 *   1. safety 검열 (IR 레벨)
 *   2. 캐릭터 레퍼런스 빌드 + descriptionIR 병합
 *   3. quota 예약
 *   4. provider 라우팅 + generate
 *   5. 프로바이더 CDN URL → R2 영구화
 *   6. quota commit + usage ledger
 *
 * 실패 시 reservation은 release 됨.
 */

export interface ScenePipelineInput {
  userId: string;
  panelId: string;
  promptIR: PromptIR;
  characterIds?: string[];
  seed?: number;
}

export interface ScenePipelineResult {
  permanentUrl: string;
  sha256: string;
  providerId: string;
  seed: number;
  costCents: number;
  templateId: string;
  templateVersion: string;
}

export class GenerationPipeline {
  constructor(
    private deps: {
      providers: ProviderRegistry;
      quota: QuotaService;
      ingestion: ImageIngestionService;
      characters: CharacterService;
      safety: SafetyAdapter;
    },
  ) {}

  async generateScene(input: ScenePipelineInput): Promise<ScenePipelineResult> {
    const verdict = this.deps.safety.check(input.promptIR);
    if (!verdict.allowed) {
      throw new Error(`safety blocked: ${verdict.reasons.join('; ')}`);
    }

    let effectiveIR = input.promptIR;
    const refs = [];
    for (const characterId of input.characterIds ?? []) {
      effectiveIR = await this.deps.characters.mergeDescriptionInto(characterId, effectiveIR);
      const r = await this.deps.characters.buildReferences(characterId);
      refs.push(...r);
    }

    const provider = this.deps.providers.routeFor('sceneGeneration');
    const template = defaultTemplate['manga-scene.v1']();

    const reservation = await this.deps.quota.reserve(input.userId, 'panels', 1);
    try {
      const request: GenerationRequest = {
        template,
        promptIR: effectiveIR,
        characterRefs: refs.length ? refs : undefined,
        seed: input.seed,
        userId: input.userId,
      };

      const result: GenerationResult = await provider.generate(request);

      const persisted = await this.deps.ingestion.persist(result.imageUrl, {
        key: storageConfig.paths.panelRender(input.panelId),
      });

      await this.deps.quota.commit(
        reservation,
        provider.id,
        'scene',
        result.actualCostCents,
      );

      return {
        permanentUrl: persisted.url,
        sha256: persisted.sha256,
        providerId: provider.id,
        seed: result.seed,
        costCents: result.actualCostCents,
        templateId: result.templateId,
        templateVersion: result.templateVersion,
      };
    } catch (err) {
      await this.deps.quota.release(reservation);
      throw err;
    }
  }
}

export function isSafetyRefused(err: unknown): err is SafetyRefusedError {
  return err instanceof Error && err.name === 'SafetyRefusedError';
}
