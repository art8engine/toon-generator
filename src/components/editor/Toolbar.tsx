'use client';

import Link from 'next/link';
import { appConfig } from '@config/app';

export function EditorToolbar({ pageLabel }: { pageLabel?: string }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold">
          {appConfig.displayName}
        </Link>
        {pageLabel && (
          <span className="text-xs text-ink-muted">· {pageLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-paper-border px-3 py-1 text-xs hover:bg-paper-soft"
        >
          내보내기
        </button>
        <button
          type="button"
          className="rounded-md bg-ink px-3 py-1 text-xs text-paper hover:bg-ink-soft"
        >
          저장
        </button>
      </div>
    </div>
  );
}
