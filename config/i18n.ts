/**
 * i18n 설정 — Phase 4+까지는 'ko'로 고정.
 * 구조만 준비해서 글로벌 확장 시 번역 추가만 하면 되도록.
 */
export const i18nConfig = {
  defaultLocale: 'ko' as const,
  supportedLocales: ['ko'] as const,
  plannedLocales: ['en', 'ja'] as const,
};

export type Locale = (typeof i18nConfig.supportedLocales)[number];
