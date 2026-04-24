import type { PromptCompiler, PromptIR } from '../ir';
import { sdxlCompiler } from './sdxl';

/**
 * ComfyUI 방언 — self-hosted GPU 전환 시 사용.
 * ComfyUI는 노드 기반 workflow JSON이지만, 프롬프트 슬롯 자체는 SDXL 태그 문법이라 재사용 가능.
 * workflow 구조 자체는 WorkflowTemplate JSON(`lib/ai/workflows/templates/`)에서 관리.
 */
export const comfyCompiler: PromptCompiler = {
  targetId: 'comfyui',
  compile(ir: PromptIR) {
    return sdxlCompiler.compile(ir);
  },
};
