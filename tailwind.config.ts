import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './config/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#111111',
          soft: '#2a2a2a',
          muted: '#6b7280',
        },
        paper: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          border: '#e5e7eb',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      aspectRatio: {
        a4: '210 / 297',
      },
    },
  },
  plugins: [],
};

export default config;
