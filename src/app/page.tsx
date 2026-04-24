import Link from 'next/link';
import { appConfig } from '@config/app';
import { plans } from '@config/subscription';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-24">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-full border border-paper-border px-3 py-1 text-xs tracking-widest text-ink-muted">
            BETA · 한국 서비스
          </span>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            {appConfig.displayName}
          </h1>
          <p className="max-w-xl text-lg text-ink-soft">
            그림을 못 그려도 괜찮아요. 자연어로 장면을 묘사하면 AI가 흑백 망가 스타일로 만화를
            그려드립니다. 캐릭터를 저장해 여러 장면에서 재사용하세요.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/editor/demo"
              className="rounded-md bg-ink px-6 py-3 text-paper hover:bg-ink-soft"
            >
              에디터 열어보기
            </Link>
            <a
              href="https://github.com/art8engine/toon-generator"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-paper-border px-6 py-3 hover:bg-paper-soft"
            >
              GitHub
            </a>
          </div>
        </div>

        <section className="mt-16 grid w-full gap-4 md:grid-cols-3">
          {Object.values(plans).map((plan) => (
            <article
              key={plan.id}
              className="flex flex-col gap-3 rounded-lg border border-paper-border bg-paper-soft p-6"
            >
              <header className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <span className="text-sm text-ink-muted">
                  {plan.priceKrw === 0
                    ? '무료'
                    : `${plan.priceKrw.toLocaleString('ko-KR')}원/월`}
                </span>
              </header>
              <ul className="space-y-1 text-sm text-ink-soft">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
