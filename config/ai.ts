/**
 * AI 프로바이더 설정.
 * routing 값을 변경하면 애플리케이션 코드 수정 없이 프로바이더를 교체할 수 있다.
 * self-hosted GPU(ComfyUI)로 전환 시 `local-gpu` 로 바꾸면 됨.
 */

export type ProviderId = 'replicate' | 'google-ai' | 'local-gpu' | 'fake';

export type TaskKind = 'characterSheet' | 'sceneGeneration' | 'sketch';

export const aiConfig = {
  providers: {
    replicate: {
      enabled: Boolean(process.env.REPLICATE_API_TOKEN),
      models: {
        sdxlManga: 'asiryan/counterfeit-v3',
        ipAdapterSdxl: 'lucataco/ip_adapter-sdxl',
        controlNetLineart: 'jagilley/controlnet-scribble',
      },
    },
    googleAI: {
      enabled: Boolean(process.env.GOOGLE_AI_API_KEY),
      model: 'gemini-2.5-flash-image',
    },
    localGpu: {
      enabled: Boolean(process.env.LOCAL_GPU_ENDPOINT),
      endpoint: process.env.LOCAL_GPU_ENDPOINT ?? '',
      apiKey: process.env.LOCAL_GPU_API_KEY ?? '',
      type: 'comfyui' as const,
    },
  },
  routing: {
    characterSheet: (process.env.AI_ROUTING_CHARACTER ?? 'google-ai') as ProviderId,
    sceneGeneration: (process.env.AI_ROUTING_SCENE ?? 'replicate') as ProviderId,
    sketch: (process.env.AI_ROUTING_SKETCH ?? 'replicate') as ProviderId,
  },
  defaults: {
    negativePrompt:
      'color, colored, lowres, bad anatomy, extra fingers, blurry, watermark, signature',
    stylePrompt: 'manga style, black and white, screentone, clean lineart, japanese comic',
    width: 768,
    height: 1024,
  },
  limits: {
    maxPromptChars: 2000,
    maxCharacterRefs: 4,
    generationTimeoutMs: 120_000,
  },
} as const;

export type AiConfig = typeof aiConfig;
