'use client';

import { useEffect, useRef } from 'react';
import type { MentionCandidate } from '@/lib/characters/mock-store';

export function MentionDropdown({
  candidates,
  activeIndex,
  onPick,
  onHover,
}: {
  candidates: MentionCandidate[];
  activeIndex: number;
  onPick: (c: MentionCandidate) => void;
  onHover: (index: number) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (candidates.length === 0) {
    return (
      <div className="absolute bottom-full left-3 right-3 mb-2 rounded-md border border-paper-border bg-paper p-3 text-xs text-ink-muted shadow-lg">
        일치하는 캐릭터가 없습니다. <span className="font-medium">캐릭터 등록</span>은 Phase 1에서 붙습니다.
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-md border border-paper-border bg-paper shadow-lg">
      <div className="border-b border-paper-border bg-paper-soft px-3 py-1.5 text-[11px] uppercase tracking-wider text-ink-muted">
        캐릭터 선택 · ↑↓ 이동 · Enter 확정 · Esc 취소
      </div>
      <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
        {candidates.map((c, i) => (
          <li
            key={c.id}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(c);
            }}
            onMouseEnter={() => onHover(i)}
            className={
              'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ' +
              (i === activeIndex ? 'bg-ink text-paper' : 'hover:bg-paper-soft')
            }
          >
            <span
              className={
                'flex h-7 w-7 items-center justify-center rounded-full text-xs ' +
                (c.kind === 'prop'
                  ? 'bg-paper-border text-ink'
                  : 'bg-ink text-paper')
              }
            >
              {c.kind === 'prop' ? '◇' : '●'}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">@{c.name}</span>
              <span
                className={
                  'truncate text-xs ' +
                  (i === activeIndex ? 'text-paper/70' : 'text-ink-muted')
                }
              >
                {c.kind === 'prop' ? '사물' : '캐릭터'} · {c.shortDescription}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
