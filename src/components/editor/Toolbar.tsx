'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { appConfig } from '@config/app';
import {
  exportPagePdf,
  exportPagePng,
  timestampedFilename,
} from '@/lib/export/page-export';

export function EditorToolbar({ pageLabel }: { pageLabel?: string }) {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleExport = async (kind: 'png' | 'pdf') => {
    setOpen(false);
    setExporting(true);
    try {
      const filename = timestampedFilename(kind);
      if (kind === 'png') await exportPagePng(filename);
      else await exportPagePdf(filename);
    } catch (e) {
      console.error(e);
      window.alert('내보내기 실패: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold">
          {appConfig.displayName}
        </Link>
        {pageLabel && <span className="text-xs text-ink-muted">· {pageLabel}</span>}
      </div>

      <div className="flex items-center gap-2">
        <div ref={wrapperRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={exporting}
            className="rounded-md border border-paper-border px-3 py-1 text-xs hover:bg-paper-soft disabled:opacity-50"
          >
            {exporting ? '내보내는 중…' : '내보내기'}
          </button>
          {open && !exporting && (
            <div className="absolute right-0 top-full z-10 mt-1 flex w-32 flex-col rounded-md border border-paper-border bg-paper text-xs shadow-lg">
              <button
                type="button"
                onClick={() => handleExport('png')}
                className="px-3 py-2 text-left hover:bg-paper-soft"
              >
                PNG 이미지
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="border-t border-paper-border px-3 py-2 text-left hover:bg-paper-soft"
              >
                PDF 문서
              </button>
            </div>
          )}
        </div>

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
