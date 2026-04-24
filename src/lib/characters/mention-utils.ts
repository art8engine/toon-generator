import { mockCharacters, type MentionCandidate } from './mock-store';

/**
 * 입력 텍스트에서 @멘션 위치와 쿼리를 추출.
 *
 * 예) "용사 @힘멜이" 라고 입력 중일 때 커서가 '멜' 다음에 있으면
 *      { query: '힘멜', start: 3 }  (@의 인덱스)
 * '@' 기호와 커서 사이에 공백이 들어가면 멘션 종료로 간주.
 * 한국어/영문/숫자/공백(캐릭터 이름 중간 공백 허용)은 쿼리에 포함.
 *   이름에 공백이 있으면 @용사 힘멜 처럼 한 번에 선택되므로 query는 공백 포함 허용.
 */
export function detectMentionAtCursor(
  text: string,
  cursor: number,
): { query: string; start: number } | null {
  const before = text.slice(0, cursor);
  // 커서 앞에서 가장 가까운 '@' 위치
  const atIndex = before.lastIndexOf('@');
  if (atIndex === -1) return null;
  // @ 바로 앞이 단어문자면 이메일 같은 맥락일 수 있으므로 제외
  const prevCh = atIndex > 0 ? before[atIndex - 1] : '';
  if (prevCh && /[A-Za-z0-9_]/.test(prevCh)) return null;

  const between = before.slice(atIndex + 1);
  // 줄바꿈은 종료
  if (/\n/.test(between)) return null;
  // 30자 이상이면 멘션 아님
  if (between.length > 30) return null;

  return { query: between, start: atIndex };
}

/**
 * 선택된 후보로 @쿼리 부분을 @정식이름 으로 치환. 끝에 공백 하나 추가.
 */
export function applyMention(
  text: string,
  start: number,
  query: string,
  candidate: MentionCandidate,
): { text: string; cursor: number } {
  const before = text.slice(0, start);
  const after = text.slice(start + 1 + query.length);
  const inserted = `@${candidate.name} `;
  return {
    text: before + inserted + after,
    cursor: (before + inserted).length,
  };
}

/**
 * 최종 메시지에서 사용된 @멘션 후보들을 추출 (중복 제거).
 * 긴 이름 우선(공백 포함) 매칭을 위해 길이 내림차순으로 순회한다.
 */
export function extractMentions(text: string): MentionCandidate[] {
  const sorted = [...mockCharacters].sort((a, b) => b.name.length - a.name.length);
  const found: MentionCandidate[] = [];
  const seen = new Set<string>();
  for (const c of sorted) {
    const needle = `@${c.name}`;
    if (text.includes(needle) && !seen.has(c.id)) {
      found.push(c);
      seen.add(c.id);
    }
  }
  return found;
}
