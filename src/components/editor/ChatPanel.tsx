'use client';

import { useState } from 'react';

/**
 * ChatPanel — 우측 AI 인터렉션 채팅 (7:3 중 3).
 * Phase 0: 껍데기만. 실제 스트리밍은 Phase 1에서 Vercel AI SDK로 연결.
 */
export function ChatPanel() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(
    [
      {
        role: 'assistant',
        content:
          '안녕하세요. 그리고 싶은 장면을 한국어로 자유롭게 설명해주세요. 예: "비 오는 도쿄 뒷골목에서 우산을 쓴 소녀가 뒤돌아본다"',
      },
    ],
  );
  const [input, setInput] = useState('');

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center border-b border-paper-border px-4">
        <span className="text-sm font-medium">AI 어시스턴트</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[90%] rounded-lg bg-ink px-3 py-2 text-paper'
                : 'mr-auto max-w-[90%] rounded-lg border border-paper-border bg-paper-soft px-3 py-2 text-ink-soft'
            }
          >
            {m.content}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-paper-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = input.trim();
          if (!trimmed) return;
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: trimmed },
            {
              role: 'assistant',
              content:
                '(Phase 1에서 실제 AI 응답이 연결됩니다. 지금은 빈 A4 캔버스 레이아웃만 확인해주세요.)',
            },
          ]);
          setInput('');
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="장면을 자연어로 설명..."
          className="flex-1 rounded-md border border-paper-border bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="rounded-md bg-ink px-3 py-2 text-sm text-paper hover:bg-ink-soft"
        >
          보내기
        </button>
      </form>
    </div>
  );
}
