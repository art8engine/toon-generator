import type { MentionCandidate } from '../characters/mock-store';

/**
 * Phase 0 목업 장면 생성.
 * 실제 파이프라인(GenerationPipeline)은 Phase 1에 붙는다.
 * 여기서는 시각적 확인을 위해 SVG placeholder를 data URL로 돌려준다.
 */
export async function mockGenerateScene(params: {
  prompt: string;
  mentions: MentionCandidate[];
  width?: number;
  height?: number;
}): Promise<{ imageUrl: string }> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const width = params.width ?? 800;
  const height = params.height ?? 1100;
  const mentionLines = params.mentions.slice(0, 4).map((m, i) => {
    const glyph = m.kind === 'prop' ? '◇' : '●';
    return `<text x="50%" y="${58 + i * 24}" font-family="monospace" font-size="18" text-anchor="middle" fill="#222">${glyph} @${escapeXml(m.name)}</text>`;
  });
  const promptTruncated = params.prompt.length > 80 ? params.prompt.slice(0, 77) + '…' : params.prompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <pattern id="dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill="#ddd"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="#fff"/>
    <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="url(#dots)" stroke="#111" stroke-width="2"/>
    <text x="50%" y="38%" font-family="sans-serif" font-size="28" text-anchor="middle" fill="#111">[mock scene]</text>
    <text x="50%" y="44%" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#555">${escapeXml(promptTruncated)}</text>
    ${mentionLines.join('\n')}
  </svg>`;
  return {
    imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
  };
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c,
  );
}
