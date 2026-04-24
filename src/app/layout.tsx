import type { Metadata } from 'next';
import { appConfig } from '@config/app';
import './globals.css';

export const metadata: Metadata = {
  title: `${appConfig.displayName} — ${appConfig.description}`,
  description: appConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
