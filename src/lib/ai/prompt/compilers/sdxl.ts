import type { PromptCompiler, PromptIR } from '../ir';
import { defaultNegativeTags, defaultStylePhrases } from '../ir';

/**
 * SDXL / Replicate 방언 — 태그 + (weight) 문법.
 * 예: "manga style, (clean lineart:1.3), black and white"
 */
export const sdxlCompiler: PromptCompiler = {
  targetId: 'sdxl',
  compile(ir: PromptIR) {
    const stylePhrases = defaultStylePhrases[ir.style];
    const weightedAttrs = ir.attributes.map((a) => applyWeight(a, ir.weights?.[a]));
    const composition = ir.composition ? [ir.composition] : [];
    const mood = ir.mood ? [ir.mood] : [];
    const free = ir.freeTags ?? [];

    const parts = [
      ir.subject,
      ...weightedAttrs,
      ...composition,
      ...mood,
      ...stylePhrases,
      ...free,
    ].filter(Boolean);

    const negatives = dedupe([...defaultNegativeTags, ...ir.negatives]);

    return {
      prompt: parts.join(', '),
      negativePrompt: negatives.join(', '),
    };
  },
};

function applyWeight(tag: string, weight?: number): string {
  if (!weight || weight === 1) return tag;
  return `(${tag}:${weight.toFixed(2)})`;
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)));
}
