'use client';

import { useRef, useState } from 'react';
import { useEditorStore, type Bubble, type BubbleShape } from '@/lib/editor/store';

/**
 * Speech-bubble overlay rendered on top of a panel cell.
 *
 * Bubbles store their geometry in normalized 0–1 coordinates so they survive
 * panel resizes and layout changes. SVG shapes use preserveAspectRatio="none"
 * so the bubble stretches with its bounding box (correct for the round and
 * thought variants; the jagged star tolerates light distortion).
 */
export function BubbleLayer({ panelId }: { panelId: string }) {
  const bubbles = useEditorStore((s) => s.bubbles.filter((b) => b.panelId === panelId));
  const layerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0">
      {bubbles.map((b) => (
        <BubbleNode key={b.id} bubble={b} layerRef={layerRef} />
      ))}
    </div>
  );
}

function BubbleNode({
  bubble,
  layerRef,
}: {
  bubble: Bubble;
  layerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const updateBubble = useEditorStore((s) => s.updateBubble);
  const deleteBubble = useEditorStore((s) => s.deleteBubble);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const onMovePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    const layer = layerRef.current;
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startBX = bubble.x;
    const startBY = bubble.y;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    e.stopPropagation();

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / rect.width;
      const dy = (ev.clientY - startY) / rect.height;
      updateBubble(bubble.id, {
        x: clamp(startBX + dx, 0.05, 0.95),
        y: clamp(startBY + dy, 0.05, 0.95),
      });
    };
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const layer = layerRef.current;
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = bubble.w;
    const startH = bubble.h;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dw = (ev.clientX - startX) / rect.width;
      const dh = (ev.clientY - startY) / rect.height;
      updateBubble(bubble.id, {
        w: clamp(startW + dw * 2, 0.1, 0.9),
        h: clamp(startH + dh * 2, 0.08, 0.7),
      });
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
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={onMovePointerDown}
      onDoubleClick={() => setEditing(true)}
      className="pointer-events-auto absolute select-none"
      style={{
        left: `${bubble.x * 100}%`,
        top: `${bubble.y * 100}%`,
        width: `${bubble.w * 100}%`,
        height: `${bubble.h * 100}%`,
        transform: 'translate(-50%, -50%)',
        cursor: editing ? 'text' : 'move',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
      >
        <BubblePath shape={bubble.shape} />
      </svg>

      {editing ? (
        <textarea
          autoFocus
          value={bubble.text}
          onChange={(e) => updateBubble(bubble.id, { text: e.target.value })}
          onBlur={() => setEditing(false)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          className="absolute inset-x-[14%] inset-y-[22%] resize-none border-none bg-transparent text-center text-[11px] leading-tight outline-none"
        />
      ) : (
        <div className="absolute inset-x-[14%] inset-y-[22%] flex items-center justify-center text-center text-[11px] leading-tight">
          <span className={bubble.text ? 'whitespace-pre-wrap text-ink' : 'text-ink-muted'}>
            {bubble.text || '더블클릭'}
          </span>
        </div>
      )}

      {hovered && !editing && (
        <>
          <ShapeSwitcher
            current={bubble.shape}
            onPick={(shape) => updateBubble(bubble.id, { shape })}
          />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => deleteBubble(bubble.id)}
            className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-paper hover:bg-ink-soft"
            aria-label="말풍선 삭제"
          >
            ×
          </button>
          <div
            onPointerDown={onResizePointerDown}
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-ink bg-paper"
            aria-label="말풍선 크기 조절"
          />
        </>
      )}
    </div>
  );
}

function ShapeSwitcher({
  current,
  onPick,
}: {
  current: BubbleShape;
  onPick: (shape: BubbleShape) => void;
}) {
  const shapes: { id: BubbleShape; symbol: string; label: string }[] = [
    { id: 'round', symbol: '●', label: '둥근 말풍선' },
    { id: 'jagged', symbol: '✦', label: '날카로운 말풍선' },
    { id: 'thought', symbol: '☁', label: '생각풍선' },
  ];
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute -top-7 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-paper-border bg-paper px-1.5 py-0.5 shadow"
    >
      {shapes.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s.id)}
          aria-label={s.label}
          className={
            'rounded px-1 text-[12px] ' +
            (current === s.id ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-soft')
          }
        >
          {s.symbol}
        </button>
      ))}
    </div>
  );
}

function BubblePath({ shape }: { shape: BubbleShape }) {
  if (shape === 'round') {
    return <ellipse cx="50" cy="50" rx="48" ry="40" fill="white" stroke="black" strokeWidth="2" />;
  }
  if (shape === 'jagged') {
    const points =
      '50,2 56,20 76,12 66,28 92,28 70,42 96,52 70,55 84,72 60,66 56,90 50,72 44,90 40,66 16,72 30,55 4,52 30,42 8,28 34,28 24,12 44,20';
    return <polygon points={points} fill="white" stroke="black" strokeWidth="2" />;
  }
  if (shape === 'thought') {
    return (
      <path
        d="M50,8 C 70,8 82,22 72,34 C 95,32 96,55 76,60 C 95,72 75,90 60,80 C 55,95 35,90 35,80 C 15,90 5,72 24,60 C 4,55 4,32 28,34 C 18,22 30,8 50,8 Z"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
    );
  }
  return null;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
