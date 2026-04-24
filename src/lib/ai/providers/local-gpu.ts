import { createHash } from 'node:crypto';
import {
  ImageGenerationProvider,
  ProviderRefusedError,
  type GenerationRequest,
  type GenerationResult,
  type ProviderCapabilities,
} from './base';
import { comfyCompiler } from '../prompt/compilers/comfy';

/**
 * LocalGpuProvider — self-hosted GPU (ComfyUI REST) 어댑터.
 *
 * 현재는 stub 상태. GPU 준비되면:
 *   1. ComfyUI를 `--listen 0.0.0.0 --port 8188` 으로 기동
 *   2. LOCAL_GPU_ENDPOINT=http://<ip>:8188 설정
 *   3. WorkflowTemplate JSON에서 comfyWorkflowFile 경로 실제 파일로 생성
 *   4. buildComfyWorkflow 메서드 구현 완료 후 AI_ROUTING_SCENE=local-gpu 로 전환
 *
 * 이 과정에서 애플리케이션 코드는 변경되지 않음 (추상화 검증 포인트).
 */
export class LocalGpuProvider extends ImageGenerationProvider {
  readonly id = 'local-gpu';
  readonly capabilities: ProviderCapabilities = {
    ipAdapter: true,
    controlNet: true,
    lora: true,
    characterConsistency: 'high',
    supportedTemplates: ['manga-scene.v1', 'character-sheet.v1', 'panel-refinement.v1'],
    maxResolution: { width: 2048, height: 2048 },
  };

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    this.assertSupported(req);

    const endpoint = process.env.LOCAL_GPU_ENDPOINT;
    if (!endpoint) {
      throw new ProviderRefusedError(
        this.id,
        'LOCAL_GPU_ENDPOINT is not set (self-hosted GPU not ready yet)',
      );
    }

    const { prompt, negativePrompt } = comfyCompiler.compile(req.promptIR);
    const workflow = this.buildComfyWorkflow(req, prompt, negativePrompt);

    const promptRes = await fetch(`${endpoint}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LOCAL_GPU_API_KEY
          ? { Authorization: `Bearer ${process.env.LOCAL_GPU_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!promptRes.ok) {
      throw new ProviderRefusedError(
        this.id,
        `comfyui /prompt failed: ${promptRes.status}`,
      );
    }

    const { prompt_id: promptId } = (await promptRes.json()) as { prompt_id: string };
    const imageUrl = await this.pollForResult(endpoint, promptId);
    const seed = req.seed ?? Math.floor(Math.random() * 2_147_483_647);

    return {
      imageUrl,
      imageSha256: createHash('sha256')
        .update(`${this.id}:${imageUrl}:${seed}`)
        .digest('hex'),
      seed,
      actualCostCents: this.estimateCostCents(req),
      providerMetadata: { endpoint, promptId, workflowStub: true },
      templateId: req.template.id,
      templateVersion: req.template.version,
    };
  }

  estimateCostCents(_req: GenerationRequest): number {
    // self-hosted는 한계비용 ≈ 전기요금. 여기서는 1센트 고정.
    return 1;
  }

  async healthCheck(): Promise<boolean> {
    const endpoint = process.env.LOCAL_GPU_ENDPOINT;
    if (!endpoint) return false;
    try {
      const res = await fetch(`${endpoint}/system_stats`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * STUB — 실제 ComfyUI workflow JSON 생성 로직.
   * 템플릿(lib/ai/workflows/templates/)에서 comfyWorkflowFile 읽어 슬롯 주입하도록 구현 예정.
   */
  private buildComfyWorkflow(
    req: GenerationRequest,
    prompt: string,
    negativePrompt?: string,
  ): Record<string, unknown> {
    return {
      _stub: true,
      templateId: req.template.id,
      prompt,
      negativePrompt,
      slots: req.template.slots,
      characterRefs: req.characterRefs,
      controlImage: req.controlImage,
    };
  }

  private async pollForResult(endpoint: string, promptId: string): Promise<string> {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const res = await fetch(`${endpoint}/history/${promptId}`);
      if (res.ok) {
        const body = (await res.json()) as Record<string, unknown>;
        const record = body[promptId] as { outputs?: Record<string, unknown> } | undefined;
        const outputs = record?.outputs;
        if (outputs) {
          for (const nodeOutput of Object.values(outputs)) {
            const images = (nodeOutput as { images?: Array<{ filename: string; subfolder?: string; type?: string }> }).images;
            if (images?.[0]) {
              const img = images[0];
              const qs = new URLSearchParams({
                filename: img.filename,
                subfolder: img.subfolder ?? '',
                type: img.type ?? 'output',
              });
              return `${endpoint}/view?${qs.toString()}`;
            }
          }
        }
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new ProviderRefusedError(this.id, 'comfyui polling timeout (120s)');
  }
}
