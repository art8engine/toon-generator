import { plans, type PlanId } from '@config/subscription';

/**
 * QuotaService — 구독 플랜 쿼터 예약/커밋.
 *
 * 이유: 쿼터는 프로바이더에 두지 않는다 (plan 변경, 프로모션, 환불 = 비즈니스 룰).
 * 흐름: reserve() → provider.generate() → commit(actualCost)
 *       실패 시 release()로 롤백.
 */

export type QuotaKind = 'characters' | 'panels' | 'exports';

export interface Reservation {
  id: string;
  userId: string;
  kind: QuotaKind;
  amount: number;
}

export interface UsageSnapshot {
  userId: string;
  plan: PlanId;
  period: { year: number; month: number };
  used: Record<QuotaKind, number>;
  reserved: Record<QuotaKind, number>;
}

export class QuotaExceededError extends Error {
  constructor(
    public readonly userId: string,
    public readonly kind: QuotaKind,
  ) {
    super(`quota exceeded for user=${userId} kind=${kind}`);
    this.name = 'QuotaExceededError';
  }
}

export interface QuotaRepository {
  getSnapshot(userId: string): Promise<UsageSnapshot>;
  incrementReserved(userId: string, kind: QuotaKind, amount: number): Promise<void>;
  releaseReserved(userId: string, kind: QuotaKind, amount: number): Promise<void>;
  commitUsage(userId: string, kind: QuotaKind, amount: number): Promise<void>;
  logLedger(entry: {
    userId: string;
    providerId: string;
    task: string;
    costCents: number;
  }): Promise<void>;
}

export class QuotaService {
  constructor(private repo: QuotaRepository) {}

  async reserve(userId: string, kind: QuotaKind, amount = 1): Promise<Reservation> {
    const snapshot = await this.repo.getSnapshot(userId);
    const limit = plans[snapshot.plan].quotas[limitKey(kind)];
    const total = snapshot.used[kind] + snapshot.reserved[kind] + amount;

    if (total > limit && plans[snapshot.plan].overagePerPanelKrw == null) {
      throw new QuotaExceededError(userId, kind);
    }

    await this.repo.incrementReserved(userId, kind, amount);
    return {
      id: `${userId}:${kind}:${Date.now()}`,
      userId,
      kind,
      amount,
    };
  }

  async commit(
    reservation: Reservation,
    providerId: string,
    task: string,
    costCents: number,
  ): Promise<void> {
    await this.repo.releaseReserved(reservation.userId, reservation.kind, reservation.amount);
    await this.repo.commitUsage(reservation.userId, reservation.kind, reservation.amount);
    await this.repo.logLedger({ userId: reservation.userId, providerId, task, costCents });
  }

  async release(reservation: Reservation): Promise<void> {
    await this.repo.releaseReserved(reservation.userId, reservation.kind, reservation.amount);
  }
}

function limitKey(kind: QuotaKind): 'charactersPerMonth' | 'panelsPerMonth' | 'exportsPerMonth' {
  return ({
    characters: 'charactersPerMonth',
    panels: 'panelsPerMonth',
    exports: 'exportsPerMonth',
  } as const)[kind];
}
