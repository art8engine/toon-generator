export type PlanId = 'free' | 'starter' | 'pro';

export interface PlanQuotas {
  charactersPerMonth: number;
  panelsPerMonth: number;
  exportsPerMonth: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceKrw: number;
  priceUsd?: number;
  quotas: PlanQuotas;
  overagePerPanelKrw?: number;
  features: string[];
}

export const plans: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: '무료 체험',
    priceKrw: 0,
    priceUsd: 0,
    quotas: { charactersPerMonth: 1, panelsPerMonth: 10, exportsPerMonth: 1 },
    features: ['캐릭터 1명 저장', '패널 10개 생성', '워터마크 포함 출력'],
  },
  starter: {
    id: 'starter',
    name: '스타터',
    priceKrw: 19_000,
    priceUsd: 15,
    quotas: { charactersPerMonth: 10, panelsPerMonth: 300, exportsPerMonth: 20 },
    features: ['캐릭터 10명 저장', '패널 300개/월', 'PNG/PDF 출력', '기본 스타일'],
  },
  pro: {
    id: 'pro',
    name: '프로',
    priceKrw: 49_000,
    priceUsd: 39,
    quotas: { charactersPerMonth: 50, panelsPerMonth: 1500, exportsPerMonth: 100 },
    overagePerPanelKrw: 100,
    features: [
      '캐릭터 50명 저장',
      '패널 1,500개/월',
      '고급 스타일 프리셋',
      '우선 큐 처리',
      '초과분 건당 과금 (100원/패널)',
    ],
  },
};

export const billingProviders = ['toss', 'stripe'] as const;
export type BillingProvider = (typeof billingProviders)[number];

export const defaultBillingProvider: BillingProvider = 'toss';
