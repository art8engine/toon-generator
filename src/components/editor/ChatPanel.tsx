'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useEditorStore } from '@/lib/editor/store';
import {
  applyMention,
  detectMentionAtCursor,
  extractMentions,
} from '@/lib/characters/mention-utils';
import { searchCharacters, type MentionCandidate } from '@/lib/characters/mock-store';
import { MentionDropdown } from './MentionDropdown';

export function ChatPanel() {
  const messages = useEditorStore((s) => s.messages);
  const selectedPanelId = useEditorStore((s) => s.selectedPanelId);
  const addMessage = useEditorStore((s) => s.addMessage);
  const patchMessage = useEditorStore((s) => s.patchMessage);
  const setPanelGenerating = useEditorStore((s) => s.setPanelGenerating);
  const setPanelResult = useEditorStore((s) => s.setPanelResult);

  const [input, setInput] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const mention = useMemo(() => {
    if (!inputRef.current) return null;
    const cursor = inputRef.current.selectionStart ?? input.length;
    return detectMentionAtCursor(input, cursor);
  }, [input]);

  const candidates: MentionCandidate[] = useMemo(
    () => (mention ? searchCharacters(mention.query) : []),
    [mention],
  );

  const dropdownOpen = mention !== null && input.length > 0;

  function pickCandidate(c: MentionCandidate) {
    if (!mention) return;
    const { text, cursor } = applyMention(input, mention.start, mention.query, c);
    setInput(text);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursor, cursor);
    });
    setActiveIndex(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (dropdownOpen && candidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % candidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pickCandidate(candidates[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput((v) => v.replace(/@[^\s]*$/, ''));
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!selectedPanelId) {
      addMessage({
        role: 'assistant',
        content: '먼저 좌측에서 장면을 넣을 패널을 선택해주세요.',
        status: 'done',
      });
      return;
    }

    const mentions = extractMentions(trimmed);
    addMessage({
      role: 'user',
      content: trimmed,
      mentions,
      panelId: selectedPanelId,
      status: 'done',
    });

    setInput('');

    const pendingId = addMessage({
      role: 'assistant',
      content:
        mentions.length > 0
          ? `${mentions.map((m) => '@' + m.name).join(', ')} 참조해서 패널 ${selectedPanelId} 생성 중…`
          : `패널 ${selectedPanelId} 생성 중…`,
      status: 'sending',
    });

    setPanelGenerating(selectedPanelId);
    try {
      const res = await fetch('/api/generate/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          mentionIds: mentions.map((m) => m.id),
        }),
      });
      const data = (await res.json()) as {
        imageUrl?: string;
        providerId?: string;
        elapsedMs?: number;
        actualCostCents?: number;
        error?: string;
        hint?: string;
      };
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error ?? 'unknown error');
      }
      setPanelResult(selectedPanelId, {
        imageUrl: data.imageUrl,
        prompt: trimmed,
        mentionIds: mentions.map((m) => m.id),
      });
      const providerLabel = data.providerId === 'fake' ? 'fake (mock)' : data.providerId;
      patchMessage(pendingId, {
        content: `패널 ${selectedPanelId} 생성 완료 · provider=${providerLabel} · ${data.elapsedMs}ms · ${data.actualCostCents}¢`,
        status: 'done',
      });
    } catch (err) {
      patchMessage(pendingId, {
        content: `생성 실패: ${(err as Error).message}`,
        status: 'error',
      });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center justify-between border-b border-paper-border px-4">
        <span className="text-sm font-medium">AI 어시스턴트</span>
        <span className="text-xs text-ink-muted">
          {selectedPanelId ? `선택 패널: ${selectedPanelId}` : '패널 미선택'}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="relative border-t border-paper-border p-3"
      >
        {dropdownOpen && (
          <MentionDropdown
            candidates={candidates}
            activeIndex={activeIndex}
            onPick={pickCandidate}
            onHover={setActiveIndex}
          />
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder='장면을 자연어로 설명… "@" 로 캐릭터 호출'
            className="flex-1 rounded-md border border-paper-border bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-md bg-ink px-3 py-2 text-sm text-paper hover:bg-ink-soft disabled:opacity-40"
            disabled={!input.trim()}
          >
            보내기
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          팁: <kbd className="rounded border border-paper-border px-1">@</kbd> 입력 → 캐릭터 선택 (↑↓/Enter).
          저장된 캐릭터 관리는 Phase 1에서 추가됩니다.
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ReturnType<typeof useEditorStore.getState>['messages'][number] }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={
        isUser
          ? 'ml-auto flex max-w-[92%] flex-col items-end gap-1'
          : 'mr-auto flex max-w-[92%] flex-col items-start gap-1'
      }
    >
      <div
        className={
          isUser
            ? 'rounded-lg bg-ink px-3 py-2 text-paper'
            : message.status === 'sending'
              ? 'rounded-lg border border-paper-border bg-paper-soft px-3 py-2 text-ink-muted'
              : message.status === 'error'
                ? 'rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-red-700'
                : 'rounded-lg border border-paper-border bg-paper-soft px-3 py-2 text-ink-soft'
        }
      >
        {renderHighlighted(message.content)}
      </div>
      {message.mentions && message.mentions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {message.mentions.map((m) => (
            <span
              key={m.id}
              className={
                'rounded-full px-2 py-0.5 text-[11px] ' +
                (m.kind === 'prop'
                  ? 'border border-paper-border text-ink-soft'
                  : 'bg-ink text-paper')
              }
            >
              {m.kind === 'prop' ? '◇' : '●'} @{m.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function renderHighlighted(text: string): React.ReactNode {
  const parts = text.split(/(@[^\s@]+(?:\s[^\s@]+)*)/g);
  return parts.map((p, i) =>
    p.startsWith('@') ? (
      <span key={i} className="font-semibold underline decoration-dotted underline-offset-2">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
