import type { PromptIR } from '../prompt/ir';
import type { WorkflowTemplate, WorkflowTemplateId } from '../workflows/types';

/**
 * ImageGenerationProvider — AI 이미지 생성 프로바이더 추상 클래스.
 *
 * 설계 의도:
 *   - 애플리케이션 계층(BullMQ, API routes)은 이 인터페이스만 사용한다.
 *   - 인스턴스 주입 금지, 문자열 id로 ProviderRegistry에서 resolve.
 *   - 쿼터/비용 관리는 프로바이더에 두지 않는다 (QuotaService 담당).
 *     프로바이더는 estimateCostCents / actualCostCents만 노출한다.
 *   - 동일 시드 = 동일 이미지 가정 금지. 대신 imageSha256(resultFingerprint) 반환.
 *   - Replicate CDN URL은 24시간 만료 — 호출자는 반드시 ImageIngestionService 통해
 *     R2/S3로 영구화한 뒤 DB에 저장해야 한다.
 *
 * 새로운 프로바이더 추가 방법:
 *   1. 이 클래스를 상속하고 id/capabilities/generate/estimateCostCents/healthCheck 구현
 *   2. providers/ 디렉토리에 파일 추가
 *   3. registry.ts 에 등록
 *   4. config/ai.ts 의 routing 값을 새 id로 변경
 */

export interface CharacterReference {
  /** 이 프로바이더 기준 참조로 사용할 영구 URL (R2) */
  imageUrl: string;
  weight?: number;
  /** 선택적 provider-specific embedding cache id */
  embeddingCacheKey?: string;
}

export interface GenerationRequest {
  template: WorkflowTemplate;
  promptIR: PromptIR;
  characterRefs?: CharacterReference[];
  controlImage?: { url: string; type: 'lineart' | 'openpose' | 'scribble' | 'canny' };
  seed?: number;
  width?: number;
  height?: number;
  /** 사용자 식별 (usage ledger 기록용. 프로바이더 내부 로직에는 사용 X) */
  userId?: string;
}

export interface GenerationResult {
  /** 프로바이더가 반환한 원본 URL (단기 만료 가능). 호출자가 R2로 이관해야 함. */
  imageUrl: string;
  /** 이미지 바이트의 sha256 — determinism/재생성 판단용 */
  imageSha256: string;
  seed: number;
  actualCostCents: number;
  providerMetadata: Record<string, unknown>;
  /** 생성에 사용된 워크플로우 id/version (재현성) */
  templateId: WorkflowTemplateId;
  templateVersion: string;
}

export interface ProviderCapabilities {
  ipAdapter: boolean;
  controlNet: boolean;
  lora: boolean;
  characterConsistency: 'high' | 'medium' | 'low';
  supportedTemplates: WorkflowTemplateId[];
  maxResolution: { width: number; height: number };
}

export abstract class ImageGenerationProvider {
  abstract readonly id: string;
  abstract readonly capabilities: ProviderCapabilities;

  abstract generate(req: GenerationRequest): Promise<GenerationResult>;
  abstract estimateCostCents(req: GenerationRequest): number;
  abstract healthCheck(): Promise<boolean>;

  /**
   * 지원하지 않는 템플릿/기능이면 에러 던지기.
   * 각 프로바이더는 generate 시작 시 이것을 호출해야 한다.
   */
  protected assertSupported(req: GenerationRequest): void {
    if (!this.capabilities.supportedTemplates.includes(req.template.id)) {
      throw new UnsupportedByProviderError(
        this.id,
        `template "${req.template.id}" not supported`,
      );
    }
    if (req.characterRefs?.length && !this.capabilities.ipAdapter) {
      throw new UnsupportedByProviderError(
        this.id,
        'character reference images require IP-Adapter capability',
      );
    }
    if (req.controlImage && !this.capabilities.controlNet) {
      throw new UnsupportedByProviderError(
        this.id,
        'control image requires ControlNet capability',
      );
    }
  }
}

export class UnsupportedByProviderError extends Error {
  constructor(
    public readonly providerId: string,
    message: string,
  ) {
    super(`[${providerId}] ${message}`);
    this.name = 'UnsupportedByProviderError';
  }
}

export class ProviderRefusedError extends Error {
  constructor(
    public readonly providerId: string,
    public readonly reason: string,
  ) {
    super(`[${providerId}] refused: ${reason}`);
    this.name = 'ProviderRefusedError';
  }
}
