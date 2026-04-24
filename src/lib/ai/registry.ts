import { aiConfig, type ProviderId, type TaskKind } from '@config/ai';
import { ImageGenerationProvider } from './providers/base';
import { FakeProvider } from './providers/fake';
import { ReplicateProvider } from './providers/replicate';
import { GoogleAIProvider } from './providers/google-ai';
import { LocalGpuProvider } from './providers/local-gpu';

/**
 * ProviderRegistry — 이미지 생성 프로바이더 factory.
 *
 * 설계:
 *   - 애플리케이션은 providerId(string)만 다룬다. 인스턴스 직접 주입 금지.
 *   - BullMQ job 페이로드에도 providerId(string)만 담는다.
 *   - 싱글턴이 아니라 request-scoped으로 만들 수 있게 factory 형태 유지.
 *   - 테스트 시 registry.register(new FakeProvider()) 로 대체 가능.
 */
export class ProviderRegistry {
  private providers = new Map<string, ImageGenerationProvider>();

  register(provider: ImageGenerationProvider): this {
    this.providers.set(provider.id, provider);
    return this;
  }

  get(id: ProviderId): ImageGenerationProvider {
    const p = this.providers.get(id);
    if (!p) {
      throw new Error(
        `provider "${id}" not registered (available: ${[...this.providers.keys()].join(', ')})`,
      );
    }
    return p;
  }

  has(id: ProviderId): boolean {
    return this.providers.has(id);
  }

  listAvailable(): string[] {
    return [...this.providers.keys()];
  }

  /**
   * config/ai.ts 의 routing 설정을 기반으로 task에 맞는 프로바이더 resolve.
   * 설정된 프로바이더가 등록되지 않았으면 fake로 fallback (개발 환경 친화).
   */
  routeFor(task: TaskKind): ImageGenerationProvider {
    const targetId = aiConfig.routing[task];
    if (this.has(targetId)) return this.get(targetId);
    if (this.has('fake')) return this.get('fake');
    throw new Error(`no provider available for task "${task}" (target: ${targetId})`);
  }
}

/**
 * 기본 registry — 환경변수 기반으로 활성 프로바이더만 등록.
 * 언제나 fake는 등록돼서 dev/test가 막히지 않게 한다.
 */
export function createDefaultRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(new FakeProvider());
  if (aiConfig.providers.replicate.enabled) {
    registry.register(new ReplicateProvider());
  }
  if (aiConfig.providers.googleAI.enabled) {
    registry.register(new GoogleAIProvider());
  }
  if (aiConfig.providers.localGpu.enabled) {
    registry.register(new LocalGpuProvider());
  }
  return registry;
}
