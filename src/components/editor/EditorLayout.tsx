'use client';

import type { ReactNode } from 'react';
import { appConfig } from '@config/app';

/**
 * 7:3 비율의 에디터 레이아웃.
 * 좌측: A4 캔버스 (7)
 * 우측: AI 채팅 (3)
 *
 * 순흰색 배경 + 얇은 경계선만 사용 (심플 디자인 요구사항).
 */
export function EditorLayout({
  canvas,
  chat,
  toolbar,
}: {
  canvas: ReactNode;
  chat: ReactNode;
  toolbar?: ReactNode;
}) {
  const { canvas: c, chat: ch } = appConfig.editor.splitRatio;
  return (
    <div className="flex h-screen flex-col bg-paper text-ink">
      {toolbar && (
        <header className="flex h-12 items-center border-b border-paper-border bg-paper px-4">
          {toolbar}
        </header>
      )}
      <div className="flex min-h-0 flex-1">
        <section
          className="flex min-w-0 flex-1 overflow-hidden bg-paper-soft"
          style={{ flexBasis: `${(c / (c + ch)) * 100}%` }}
          aria-label="A4 캔버스"
        >
          {canvas}
        </section>
        <aside
          className="flex min-w-0 flex-col border-l border-paper-border bg-paper"
          style={{ flexBasis: `${(ch / (c + ch)) * 100}%` }}
          aria-label="AI 채팅"
        >
          {chat}
        </aside>
      </div>
    </div>
  );
}
