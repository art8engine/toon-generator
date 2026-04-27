import Link from 'next/link';
import { appConfig } from '@config/app';

export default function LandingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper text-ink">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          {appConfig.displayName}
        </h1>
        <p className="max-w-md text-base text-ink-soft">
          텍스트로 흑백 망가를 만듭니다.
        </p>
        <div className="flex gap-3">
          <Link
            href="/editor/demo"
            className="rounded-md bg-ink px-6 py-2.5 text-paper hover:bg-ink-soft"
          >
            에디터 열기
          </Link>
          <a
            href="https://github.com/art8engine/toon-generator"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-paper-border px-6 py-2.5 hover:bg-paper-soft"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
