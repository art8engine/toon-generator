import type { PromptIR } from '../ai/prompt/ir';

export type AssetType = 'front' | 'three-quarter' | 'side' | 'back' | 'expression-sheet';

/**
 * Character 종류
 *   - 'character': 인물/몬스터/동물 등 움직이는 존재
 *   - 'prop': 검, 지팡이, 부적 같은 사물 (장면에서 특정 디자인을 재사용하고 싶은 것)
 *
 * @멘션 UI에서 아이콘/그룹 분리에 사용된다.
 */
export type CharacterKind = 'character' | 'prop';

export interface Character {
  id: string;
  userId: string;
  name: string;
  kind: CharacterKind;
  descriptionIR: PromptIR;
  styleTags: string[];
  seedBaseline?: number;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface CharacterAsset {
  id: string;
  characterId: string;
  assetType: AssetType;
  r2Url: string;
  sha256: string;
  cropBox?: { x: number; y: number; width: number; height: number };
  faceBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  createdAt: string;
}

export interface CharacterEmbeddingCacheEntry {
  characterId: string;
  providerId: string;
  modelVersion: string;
  embedding: Buffer;
  expiresAt?: string;
}
