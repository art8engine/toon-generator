import { createHash } from 'node:crypto';
import {
  ImageGenerationProvider,
  type GenerationRequest,
  type GenerationResult,
  type ProviderCapabilities,
} from './base';

/**
 * FakeProvider — 테스트/개발용. 실제 API를 치지 않고 즉시 더미 결과 반환.
 * config/ai.ts 의 routing 값을 'fake'로 바꾸면 API 토큰 없이 앱이 구동된다.
 */
export class FakeProvider extends ImageGenerationProvider {
  readonly id = 'fake';
  readonly capabilities: ProviderCapabilities = {
    ipAdapter: true,
    controlNet: true,
    lora: true,
    characterConsistency: 'medium',
    supportedTemplates: ['manga-scene.v1', 'character-sheet.v1', 'panel-refinement.v1'],
    maxResolution: { width: 2048, height: 2048 },
  };

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    this.assertSupported(req);
    const seed = req.seed ?? Math.floor(Math.random() * 2_147_483_647);
    const digest = createHash('sha256')
      .update(JSON.stringify({ promptIR: req.promptIR, template: req.template.id, seed }))
      .digest('hex');

    return {
      imageUrl: `data:image/svg+xml;base64,${encodeSvgPlaceholder(req)}`,
      imageSha256: digest,
      seed,
      actualCostCents: 0,
      providerMetadata: { fake: true, note: 'FakeProvider placeholder' },
      templateId: req.template.id,
      templateVersion: req.template.version,
    };
  }

  estimateCostCents(): number {
    return 0;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

function encodeSvgPlaceholder(req: GenerationRequest): string {
  const w = req.width ?? 512;
  const h = req.height ?? 768;
  const label = (req.promptIR.subject || 'toon-generator').slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff" stroke="#111" stroke-width="4"/><text x="50%" y="48%" font-family="monospace" font-size="22" text-anchor="middle" fill="#111">[fake]</text><text x="50%" y="56%" font-family="monospace" font-size="14" text-anchor="middle" fill="#444">${escapeXml(label)}</text><text x="50%" y="70%" font-family="monospace" font-size="12" text-anchor="middle" fill="#888">${req.template.id}</text></svg>`;
  return Buffer.from(svg, 'utf8').toString('base64');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c,
  );
}
