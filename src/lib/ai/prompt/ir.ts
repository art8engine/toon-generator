/**
 * PromptIR — 프롬프트 중간표현 (provider-neutral).
 *
 * 이유: Nano Banana는 자연어 지시형, SDXL은 태그+weight형, ComfyUI는 workflow JSON.
 * 공통 prompt string 하나로는 세 방언을 동시에 만족시킬 수 없다.
 * DB/UI에는 IR만 저장하고, 각 프로바이더가 PromptCompiler로 자신의 방언으로 번역한다.
 */

export type PromptStyle = 'manga-bw' | 'lineart' | 'screentone' | 'sketch' | 'character-sheet';

export interface PromptIR {
  subject: string;
  attributes: string[];
  style: PromptStyle;
  composition?: string;
  mood?: string;
  negatives: string[];
  weights?: Record<string, number>;
  /** 자유형 태그: provider compiler가 선택적으로 사용 */
  freeTags?: string[];
}

export interface PromptCompiler {
  readonly targetId: string;
  compile(ir: PromptIR): { prompt: string; negativePrompt?: string };
}

export const emptyPromptIR = (): PromptIR => ({
  subject: '',
  attributes: [],
  style: 'manga-bw',
  negatives: [],
});

/**
 * 프로바이더 중립 기본 스타일 프롬프트 조각.
 * 모든 프로바이더가 이것을 자기 방언에 녹인다.
 */
export const defaultStylePhrases: Record<PromptStyle, string[]> = {
  'manga-bw': ['black and white manga', 'screentone shading', 'clean ink lineart'],
  lineart: ['clean black lineart', 'no shading', 'white background'],
  screentone: ['manga screentone halftone shading', 'dot pattern', 'black and white'],
  sketch: ['rough pencil sketch', 'draft', 'gesture lines'],
  'character-sheet': [
    'character reference sheet',
    'multiple angles (front, 3/4, side, back)',
    'neutral expression',
    'plain white background',
    'full body',
  ],
};

export const defaultNegativeTags = [
  'color',
  'colored',
  'lowres',
  'bad anatomy',
  'extra fingers',
  'blurry',
  'watermark',
  'signature',
  'text',
];
