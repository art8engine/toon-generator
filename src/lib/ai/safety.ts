import type { PromptIR } from './prompt/ir';

/**
 * SafetyAdapter — NSFW/위험 프롬프트 사전 검열 + 프로바이더 거부응답 정규화.
 *
 * 이유:
 *   - Google AI는 필터가 공격적이어서 정상 요청도 거절될 수 있음
 *   - Replicate는 모델에 따라 관대 → 사용자 경험 차이 큼
 *   - 프로바이더 교체 시 사용자에게 동일한 UX를 제공하려면 공통 검열 계층 필요
 */

export interface SafetyVerdict {
  allowed: boolean;
  reasons: string[];
}

const BLOCKED_TERMS = [
  'nude',
  'naked',
  'explicit sexual',
  'child',
  'minor',
  'underage',
  'loli',
  'shota',
  'gore',
  'dismember',
];

const WARN_TERMS = ['violence', 'blood', 'weapon'];

export class SafetyAdapter {
  check(ir: PromptIR): SafetyVerdict {
    const haystack = [ir.subject, ...ir.attributes, ir.mood ?? '', ir.composition ?? '']
      .join(' ')
      .toLowerCase();
    const reasons: string[] = [];

    for (const term of BLOCKED_TERMS) {
      if (haystack.includes(term)) reasons.push(`blocked term: ${term}`);
    }
    if (reasons.length > 0) return { allowed: false, reasons };

    const warnings = WARN_TERMS.filter((t) => haystack.includes(t));
    if (warnings.length > 0) {
      return { allowed: true, reasons: warnings.map((t) => `warn: ${t}`) };
    }
    return { allowed: true, reasons: [] };
  }

  /**
   * 프로바이더가 safety 사유로 거부했을 때 공통 에러 형태로 정규화.
   */
  normalizeProviderRefusal(providerId: string, rawError: unknown): SafetyRefusedError {
    const message = extractMessage(rawError);
    return new SafetyRefusedError(providerId, message);
  }
}

export class SafetyRefusedError extends Error {
  constructor(
    public readonly providerId: string,
    public readonly providerMessage: string,
  ) {
    super(`[${providerId}] refused by safety filter: ${providerMessage}`);
    this.name = 'SafetyRefusedError';
  }
}

function extractMessage(err: unknown): string {
  if (!err) return 'unknown';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err).slice(0, 500);
}
