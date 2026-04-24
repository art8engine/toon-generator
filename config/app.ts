export const appConfig = {
  name: 'toon-generator',
  displayName: 'Toon Generator',
  description: '일본 망가(B&W) 스타일 AI 만화 생성 서비스',
  locale: 'ko-KR',
  defaultMarket: 'KR',
  supportedMarkets: ['KR'] as const,
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  brand: {
    paper: '#ffffff',
    ink: '#111111',
    accent: '#111111',
  },
  editor: {
    splitRatio: { canvas: 7, chat: 3 },
    a4: { widthMm: 210, heightMm: 297 },
  },
} as const;

export type AppConfig = typeof appConfig;
