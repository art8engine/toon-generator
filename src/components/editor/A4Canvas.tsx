'use client';

import { useEffect, useRef, useState } from 'react';
import { appConfig } from '@config/app';

/**
 * A4 캔버스 placeholder.
 *
 * Phase 0: Konva는 클라이언트 전용이라 동적 import로 안전히 로딩.
 * 의도적으로 "비어있는 A4 흰 페이지"만 그림 — 패널 편집 인터랙션은 Phase 2.
 *
 * A4 비율 210:297 유지. 컨테이너에 맞춰 스케일.
 */
export function A4Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const a4Ratio =
        appConfig.editor.a4.widthMm / appConfig.editor.a4.heightMm; // 210/297
      const availH = height - 40;
      const availW = width - 40;
      const byHeight = { w: availH * a4Ratio, h: availH };
      const byWidth = { w: availW, h: availW / a4Ratio };
      const pick = byHeight.w <= availW ? byHeight : byWidth;
      setSize({ w: Math.max(0, Math.floor(pick.w)), h: Math.max(0, Math.floor(pick.h)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center p-6">
      <div
        className="relative flex items-center justify-center bg-paper shadow-[0_0_0_1px_var(--paper-border),0_12px_40px_-12px_rgba(0,0,0,0.15)]"
        style={{ width: size.w, height: size.h }}
        aria-label="A4 페이지"
      >
        {size.w > 0 && (
          <span className="pointer-events-none select-none text-xs text-ink-muted">
            A4 (210 × 297 mm) — 이 영역에 패널을 추가하세요
          </span>
        )}
      </div>
    </div>
  );
}
