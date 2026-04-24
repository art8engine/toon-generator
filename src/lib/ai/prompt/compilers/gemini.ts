import type { PromptCompiler, PromptIR } from '../ir';
import { defaultStylePhrases } from '../ir';

/**
 * Google AI (Gemini 2.5 Flash Image / Nano Banana) 방언 — 자연어 지시형.
 * 태그 나열보다 문장형이 캐릭터 일관성에 유리하다.
 */
export const geminiCompiler: PromptCompiler = {
  targetId: 'gemini',
  compile(ir: PromptIR) {
    const styleSentence = buildStyleSentence(ir.style);
    const attrsSentence = ir.attributes.length
      ? `Features: ${ir.attributes.join(', ')}.`
      : '';
    const compositionSentence = ir.composition
      ? `Composition: ${ir.composition}.`
      : '';
    const moodSentence = ir.mood ? `Mood: ${ir.mood}.` : '';
    const negativeSentence = ir.negatives.length
      ? `Do NOT include: ${ir.negatives.join(', ')}.`
      : 'Do NOT include: color, greyscale photograph, watermark, text, blurry details.';

    const subject = ir.subject
      ? `Subject: ${ir.subject}.`
      : 'Subject: unspecified character.';

    const prompt = [
      subject,
      attrsSentence,
      compositionSentence,
      moodSentence,
      styleSentence,
      negativeSentence,
    ]
      .filter(Boolean)
      .join(' ');

    return { prompt };
  },
};

function buildStyleSentence(style: PromptIR['style']): string {
  const phrases = defaultStylePhrases[style];
  return `Style: ${phrases.join(', ')}. Render in authentic Japanese manga aesthetic with strict black and white, screentone shading, clean inked lineart. No color.`;
}
