'use client';

import { create } from 'zustand';
import type { MentionCandidate } from '../characters/mock-store';

/**
 * 에디터 공유 상태 — 만화 패널 그리드와 채팅 패널이 같은 스토어를 본다.
 * Phase 0은 mock 구조. Phase 1에서 TanStack Query + Supabase로 서버 상태를 붙인다.
 */

export type LayoutPreset = 'grid-2x2' | 'grid-2x3' | 'grid-manga-feature-top';

export interface PanelCell {
  id: string;
  /** grid 1-based 좌표 (rowStart, colStart, rowSpan, colSpan) */
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  imageUrl?: string;
  prompt?: string;
  mentionIds?: string[];
  status: 'empty' | 'generating' | 'done' | 'error';
}

export type BubbleShape = 'round' | 'jagged' | 'thought';

export interface Bubble {
  id: string;
  panelId: string;
  /** Normalized 0–1 coordinates relative to the panel cell. */
  x: number; // centre x
  y: number; // centre y
  w: number; // width
  h: number; // height
  shape: BubbleShape;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mentions?: MentionCandidate[];
  panelId?: string;
  status: 'sending' | 'done' | 'error';
  createdAt: number;
}

interface EditorState {
  layout: LayoutPreset;
  panels: PanelCell[];
  selectedPanelId: string | null;
  messages: ChatMessage[];
  bubbles: Bubble[];

  setLayout: (layout: LayoutPreset) => void;
  selectPanel: (id: string | null) => void;
  setPanelGenerating: (panelId: string) => void;
  setPanelResult: (panelId: string, data: {
    imageUrl: string;
    prompt: string;
    mentionIds: string[];
  }) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => string;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearPanel: (panelId: string) => void;

  addBubble: (panelId: string, init?: Partial<Bubble>) => string;
  updateBubble: (id: string, patch: Partial<Bubble>) => void;
  deleteBubble: (id: string) => void;
}

const initialPanels: Record<LayoutPreset, PanelCell[]> = {
  'grid-2x2': buildUniformGrid(2, 2),
  'grid-2x3': buildUniformGrid(3, 2),
  'grid-manga-feature-top': [
    { id: 'p1', row: 1, col: 1, rowSpan: 1, colSpan: 2, status: 'empty' },
    { id: 'p2', row: 2, col: 1, rowSpan: 1, colSpan: 1, status: 'empty' },
    { id: 'p3', row: 2, col: 2, rowSpan: 1, colSpan: 1, status: 'empty' },
    { id: 'p4', row: 3, col: 1, rowSpan: 1, colSpan: 2, status: 'empty' },
  ],
};

function buildUniformGrid(rows: number, cols: number): PanelCell[] {
  const cells: PanelCell[] = [];
  let n = 1;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      cells.push({
        id: `p${n++}`,
        row: r,
        col: c,
        rowSpan: 1,
        colSpan: 1,
        status: 'empty',
      });
    }
  }
  return cells;
}

export const useEditorStore = create<EditorState>((set) => ({
  layout: 'grid-2x3',
  panels: initialPanels['grid-2x3'],
  selectedPanelId: 'p1',
  bubbles: [],
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '안녕하세요. 좌측에서 패널을 선택하고 그리고 싶은 장면을 설명해주세요. 저장된 캐릭터는 "@"를 입력하면 불러올 수 있어요. 예: "@용사 힘멜 이 @용사의 검 을 들고 고블린을 베는 장면"',
      status: 'done',
      createdAt: Date.now(),
    },
  ],

  setLayout: (layout) =>
    set({ layout, panels: initialPanels[layout], selectedPanelId: initialPanels[layout][0]?.id ?? null }),

  selectPanel: (id) => set({ selectedPanelId: id }),

  setPanelGenerating: (panelId) =>
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId ? { ...p, status: 'generating' as const } : p,
      ),
    })),

  setPanelResult: (panelId, data) =>
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId
          ? {
              ...p,
              imageUrl: data.imageUrl,
              prompt: data.prompt,
              mentionIds: data.mentionIds,
              status: 'done' as const,
            }
          : p,
      ),
    })),

  addMessage: (msg) => {
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({
      messages: [...s.messages, { ...msg, id, createdAt: Date.now() }],
    }));
    return id;
  },

  patchMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  clearPanel: (panelId) =>
    set((s) => ({
      panels: s.panels.map((p) =>
        p.id === panelId
          ? {
              ...p,
              imageUrl: undefined,
              prompt: undefined,
              mentionIds: undefined,
              status: 'empty' as const,
            }
          : p,
      ),
      bubbles: s.bubbles.filter((b) => b.panelId !== panelId),
    })),

  addBubble: (panelId, init) => {
    const id = `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const bubble: Bubble = {
      id,
      panelId,
      x: 0.5,
      y: 0.3,
      w: 0.45,
      h: 0.22,
      shape: 'round',
      text: '',
      ...init,
    };
    set((s) => ({ bubbles: [...s.bubbles, bubble] }));
    return id;
  },

  updateBubble: (id, patch) =>
    set((s) => ({
      bubbles: s.bubbles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  deleteBubble: (id) =>
    set((s) => ({ bubbles: s.bubbles.filter((b) => b.id !== id) })),
}));
