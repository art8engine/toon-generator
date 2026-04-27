'use client';

import { useEffect, useRef, useState } from 'react';
import { appConfig } from '@config/app';
import { useEditorStore, type PanelCell } from '@/lib/editor/store';
import { BubbleLayer } from './BubbleLayer';

/**
 * MangaGrid — A4 페이지 위에 만화 패널 그리드.
 *
 * 설계:
 *   - 바깥: A4 210:297 비율 흰 종이
 *   - 안쪽: 선택된 layout preset에 따라 패널 분할 (2x3 / 2x2 / feature-top)
 *   - 클릭으로 패널 선택. 선택된 패널이 채팅에서 생성한 씬을 받는다.
 *   - 패널 상태: empty | generating | done | error
 */
export function MangaGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const layout = useEditorStore((s) => s.layout);
  const panels = useEditorStore((s) => s.panels);
  const selectedPanelId = useEditorStore((s) => s.selectedPanelId);
  const selectPanel = useEditorStore((s) => s.selectPanel);
  const setLayout = useEditorStore((s) => s.setLayout);
  const clearPanel = useEditorStore((s) => s.clearPanel);
  const addBubble = useEditorStore((s) => s.addBubble);
  const setPanelSpan = useEditorStore((s) => s.setPanelSpan);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const ratio = appConfig.editor.a4.widthMm / appConfig.editor.a4.heightMm;
      const availH = height - 40;
      const availW = width - 40;
      const byHeight = { w: availH * ratio, h: availH };
      const byWidth = { w: availW, h: availW / ratio };
      const pick = byHeight.w <= availW ? byHeight : byWidth;
      setSize({ w: Math.max(0, Math.floor(pick.w)), h: Math.max(0, Math.floor(pick.h)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = layout === 'grid-2x2' ? 2 : layout === 'grid-manga-feature-top' ? 3 : 3;
  const cols = 2;

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col items-center gap-3 p-6">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>레이아웃:</span>
        {(['grid-2x2', 'grid-2x3', 'grid-manga-feature-top'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setLayout(preset)}
            className={
              'rounded-md border px-2 py-1 text-xs ' +
              (layout === preset
                ? 'border-ink bg-ink text-paper'
                : 'border-paper-border hover:bg-paper-soft')
            }
          >
            {labelFor(preset)}
          </button>
        ))}
      </div>

      <div
        className="relative bg-paper shadow-[0_0_0_1px_var(--paper-border),0_12px_40px_-12px_rgba(0,0,0,0.15)]"
        style={{ width: size.w, height: size.h }}
        aria-label="A4 페이지"
        data-export-target="a4-page"
      >
        {size.w > 0 && (
          <div
            ref={gridRef}
            className="absolute inset-3 grid gap-2"
            style={{
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {panels.map((p) => (
              <PanelView
                key={p.id}
                panel={p}
                selected={selectedPanelId === p.id}
                onSelect={() => selectPanel(p.id)}
                onClear={() => clearPanel(p.id)}
                onAddBubble={() => addBubble(p.id)}
                onResize={(rs, cs) =>
                  setPanelSpan(p.id, rs, cs, { maxRow: rows, maxCol: cols })
                }
                gridRef={gridRef}
                gridDims={{ rows, cols }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-ink-muted">
        패널 클릭 → 선택 · 선택한 패널에 우측 채팅으로 장면을 생성합니다
      </p>
    </div>
  );
}

function PanelView({
  panel,
  selected,
  onSelect,
  onClear,
  onAddBubble,
  onResize,
  gridRef,
  gridDims,
}: {
  panel: PanelCell;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
  onAddBubble: () => void;
  onResize: (rowSpan: number, colSpan: number) => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
  gridDims: { rows: number; cols: number };
}) {
  const border = selected
    ? 'ring-2 ring-ink ring-offset-0'
    : 'ring-1 ring-ink/90';

  // Plain div with role=button so the cell can host nested interactive
  // children (bubbles, their resize handles, text inputs) — those would be
  // illegal inside a real <button>.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={
        'group relative flex items-center justify-center overflow-hidden bg-paper text-left transition focus:outline-none ' +
        border
      }
      style={{
        gridRow: `${panel.row} / span ${panel.rowSpan}`,
        gridColumn: `${panel.col} / span ${panel.colSpan}`,
      }}
    >
      {panel.status === 'empty' && (
        <div className="flex flex-col items-center gap-1 text-ink-muted">
          <span className="text-xs font-mono">{panel.id}</span>
          <span className="text-[10px]">클릭 → 선택 → 채팅으로 장면 생성</span>
        </div>
      )}

      {panel.status === 'generating' && (
        <div className="flex flex-col items-center gap-2 text-ink-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <span className="text-[11px]">생성 중…</span>
        </div>
      )}

      {panel.status === 'done' && panel.imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={panel.imageUrl}
            alt={panel.prompt ?? panel.id}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-paper/90 px-2 py-1 text-[10px] text-ink-soft opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            {panel.prompt}
          </div>
          <BubbleLayer panelId={panel.id} />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAddBubble();
            }}
            className="absolute bottom-1 left-1 rounded bg-paper/80 px-1.5 py-0.5 text-[10px] text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-paper"
            aria-label="말풍선 추가"
          >
            + 말풍선
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-1 top-1 rounded bg-paper/80 px-1.5 py-0.5 text-[10px] text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-paper"
            aria-label="패널 지우기"
          >
            지우기
          </button>
        </>
      )}

      {selected && (
        <>
          <span className="pointer-events-none absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-mono text-paper">
            {panel.id} · 선택됨
          </span>
          <PanelResizeHandle
            panel={panel}
            gridRef={gridRef}
            gridDims={gridDims}
            onResize={onResize}
          />
        </>
      )}
    </div>
  );
}

function PanelResizeHandle({
  panel,
  gridRef,
  gridDims,
  onResize,
}: {
  panel: PanelCell;
  gridRef: React.RefObject<HTMLDivElement | null>;
  gridDims: { rows: number; cols: number };
  onResize: (rowSpan: number, colSpan: number) => void;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    // CSS gap-2 = 8 px between cells
    const gap = 8;
    const cellW = (rect.width - gap * (gridDims.cols - 1)) / gridDims.cols;
    const cellH = (rect.height - gap * (gridDims.rows - 1)) / gridDims.rows;
    const startX = e.clientX;
    const startY = e.clientY;
    const startRowSpan = panel.rowSpan;
    const startColSpan = panel.colSpan;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dCols = Math.round((ev.clientX - startX) / (cellW + gap));
      const dRows = Math.round((ev.clientY - startY) / (cellH + gap));
      onResize(startRowSpan + dRows, startColSpan + dCols);
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      title="드래그해서 패널 크기 조정"
      className="absolute -bottom-1 -right-1 z-10 h-4 w-4 cursor-nwse-resize rounded-sm border border-paper bg-ink shadow-sm hover:bg-ink-soft"
      aria-label="패널 크기 조정 핸들"
    />
  );
}

function labelFor(preset: string): string {
  switch (preset) {
    case 'grid-2x2':
      return '2×2';
    case 'grid-2x3':
      return '2×3 (기본)';
    case 'grid-manga-feature-top':
      return '상단 와이드';
    default:
      return preset;
  }
}
