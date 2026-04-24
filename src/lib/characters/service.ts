import type { Character, CharacterAsset } from './types';
import type { PromptIR } from '../ai/prompt/ir';
import type { CharacterReference } from '../ai/providers/base';

/**
 * CharacterService — 3계층 캐릭터 모델 관리.
 *
 * Character (provider-neutral, textualDescription 진실소스)
 *    └─ CharacterAsset (canonical reference 이미지, R2 영구 저장)
 *         └─ CharacterEmbeddingCache (provider-specific, 교체 시 무효화)
 *
 * 프로바이더 교체 시:
 *   - Character, CharacterAsset 유지
 *   - CharacterEmbeddingCache만 무효화 (provider, modelVersion이 달라짐)
 *   - textualDescription(=descriptionIR)을 항상 프롬프트 fallback으로 주입 → 최소 일관성 보장
 */

export interface CharacterRepository {
  findById(id: string): Promise<Character | null>;
  findAssetsByCharacter(characterId: string): Promise<CharacterAsset[]>;
  insertCharacter(row: Omit<Character, 'id' | 'createdAt'>): Promise<Character>;
  insertAsset(row: Omit<CharacterAsset, 'id' | 'createdAt'>): Promise<CharacterAsset>;
  invalidateEmbeddingCache(characterId: string): Promise<void>;
}

export class CharacterService {
  constructor(private repo: CharacterRepository) {}

  async create(params: {
    userId: string;
    name: string;
    descriptionIR: PromptIR;
    styleTags?: string[];
    seedBaseline?: number;
  }): Promise<Character> {
    return this.repo.insertCharacter({
      userId: params.userId,
      name: params.name,
      descriptionIR: params.descriptionIR,
      styleTags: params.styleTags ?? [],
      seedBaseline: params.seedBaseline,
    });
  }

  async attachAsset(params: Omit<CharacterAsset, 'id' | 'createdAt'>): Promise<CharacterAsset> {
    return this.repo.insertAsset(params);
  }

  /**
   * 저장된 캐릭터를 provider 요청에 사용할 수 있게 CharacterReference[]로 변환.
   * 가장 최근의 "front" 자산을 우선하고, 없으면 아무 자산이나 사용.
   */
  async buildReferences(characterId: string): Promise<CharacterReference[]> {
    const assets = await this.repo.findAssetsByCharacter(characterId);
    if (!assets.length) return [];
    const front = assets.find((a) => a.assetType === 'front');
    const picked = front ?? assets[0];
    return [{ imageUrl: picked.r2Url, weight: 0.7 }];
  }

  /**
   * 프롬프트 fallback: 캐릭터의 descriptionIR을 현재 씬의 IR에 병합해
   * 임베딩 손실 시에도 최소한의 외형 일관성을 유지.
   */
  async mergeDescriptionInto(
    characterId: string,
    sceneIR: PromptIR,
  ): Promise<PromptIR> {
    const character = await this.repo.findById(characterId);
    if (!character) return sceneIR;
    const characterPhrases = [
      character.descriptionIR.subject,
      ...character.descriptionIR.attributes,
    ].filter(Boolean);
    return {
      ...sceneIR,
      attributes: dedupe([...sceneIR.attributes, ...characterPhrases]),
      freeTags: dedupe([...(sceneIR.freeTags ?? []), ...(character.descriptionIR.freeTags ?? [])]),
    };
  }

  async handleProviderSwap(characterId: string): Promise<void> {
    await this.repo.invalidateEmbeddingCache(characterId);
  }
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
