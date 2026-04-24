import type { CharacterKind } from './types';

/**
 * Mock 캐릭터 스토어 — Phase 0 UI 테스트용.
 * Phase 1에서 Supabase `characters` 테이블 조회로 교체될 예정.
 *
 * 여기엔 Character 도메인 객체 전체 대신 @멘션 UI가 필요한 최소 필드만 둔다.
 */
export interface MentionCandidate {
  id: string;
  name: string;
  kind: CharacterKind;
  shortDescription: string;
  thumbnailUrl?: string;
}

export const mockCharacters: MentionCandidate[] = [
  {
    id: 'char-himmel',
    name: '용사 힘멜',
    kind: 'character',
    shortDescription: '은발의 용사, 푸른 망토, 따뜻한 미소',
  },
  {
    id: 'char-frieren',
    name: '프리렌',
    kind: 'character',
    shortDescription: '천 년을 산 엘프 마법사, 은발 쌍묶음',
  },
  {
    id: 'char-heiter',
    name: '하이터',
    kind: 'character',
    shortDescription: '후덕한 사제, 술꾼, 대머리',
  },
  {
    id: 'prop-sword',
    name: '용사의 검',
    kind: 'prop',
    shortDescription: '신성한 빛을 내는 성검, 황금 가드',
  },
  {
    id: 'prop-staff',
    name: '프리렌의 지팡이',
    kind: 'prop',
    shortDescription: '푸른 보석이 박힌 나무 지팡이',
  },
  {
    id: 'char-goblin',
    name: '고블린',
    kind: 'character',
    shortDescription: '녹색 피부의 작은 몬스터, 낡은 가죽옷',
  },
];

export function searchCharacters(query: string, limit = 6): MentionCandidate[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockCharacters.slice(0, limit);
  return mockCharacters
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function findCharacterByName(name: string): MentionCandidate | undefined {
  return mockCharacters.find((c) => c.name === name);
}
