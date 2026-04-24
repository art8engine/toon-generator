import type { PromptIR } from '../ai/prompt/ir';

export type AssetType = 'front' | 'three-quarter' | 'side' | 'back' | 'expression-sheet';

export interface Character {
  id: string;
  userId: string;
  name: string;
  descriptionIR: PromptIR;
  styleTags: string[];
  seedBaseline?: number;
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
