/**
 * WorkflowTemplate — ComfyUI 같은 노드 기반 파이프라인까지 커버하는 공통 표현.
 *
 * GenerationRequest에 직접 prompt를 넣는 대신 template id + version + 슬롯 변수를 넣는다.
 * 각 프로바이더는 이 템플릿을 자기 네이티브 요청으로 변환한다 (renderWorkflow).
 *
 * 이렇게 하면:
 *   - 프롬프트 실험이 버전 관리 가능 (manga-scene.v1 → v2)
 *   - ComfyUI 워크플로우 교체 시 앱 코드 불변
 *   - A/B 테스트 용이
 */

export type WorkflowTemplateId =
  | 'manga-scene.v1'
  | 'character-sheet.v1'
  | 'panel-refinement.v1';

export interface WorkflowTemplate {
  id: WorkflowTemplateId;
  version: string;
  /** 슬롯 — 각 프로바이더가 자기 방식으로 주입. */
  slots: {
    prompt?: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    sampler?: string;
    seed?: number;
    /** IP-Adapter 레퍼런스 이미지 URL + weight */
    referenceImages?: Array<{ url: string; weight?: number }>;
    /** ControlNet 입력 */
    controlImage?: { url: string; type: 'lineart' | 'openpose' | 'scribble' | 'canny' };
    /** LoRA 목록 */
    loras?: Array<{ name: string; weight: number }>;
  };
  /** 탈출구 — 프로바이더 고유 파라미터 전달. */
  overrides?: Record<string, unknown>;
}

export const defaultTemplate: Record<WorkflowTemplateId, () => WorkflowTemplate> = {
  'manga-scene.v1': () => ({
    id: 'manga-scene.v1',
    version: '1.0.0',
    slots: {
      width: 768,
      height: 1024,
      steps: 28,
      cfg: 7,
      sampler: 'euler_ancestral',
      loras: [{ name: 'manga-style-v1', weight: 0.8 }],
    },
  }),
  'character-sheet.v1': () => ({
    id: 'character-sheet.v1',
    version: '1.0.0',
    slots: {
      width: 1024,
      height: 1024,
      steps: 30,
      cfg: 6,
    },
  }),
  'panel-refinement.v1': () => ({
    id: 'panel-refinement.v1',
    version: '1.0.0',
    slots: {
      width: 768,
      height: 1024,
      steps: 20,
      cfg: 5,
    },
  }),
};
