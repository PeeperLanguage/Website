import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Diagnostic } from '@/components/home/diagnostic';
import { Features } from '@/components/home/features';
import { GetStarted } from '@/components/home/get-started';
import { Hero } from '@/components/home/hero';
import { MotionProvider } from '@/components/home/motion-provider';
import { PeekingMascot } from '@/components/home/peeking-mascot';
import { Pipeline } from '@/components/home/pipeline';
import { heroProgram, storyProgram, tourPrograms } from '@/components/home/programs';
import { Tour } from '@/components/home/tour';
import { Mascot } from '@/components/mascot';
import { peeperLines } from '@/lib/highlight';
import { compilerUrl } from '@/lib/shared';

export default async function HomePage() {
  const hero = await peeperLines(heroProgram);
  const story = await peeperLines(storyProgram);
  const samples = await Promise.all(
    tourPrograms.map(async ({ name, code, output }) => ({
      name,
      output,
      lines: await peeperLines(code),
    })),
  );
  return (
    <MotionProvider>
      <main className="flex-1">
        <Hero lines={hero} />
        <Pipeline source={story} />
        <Diagnostic />
        <Features />
        <Tour samples={samples} />
        <GetStarted />
        <Closing />
      </main>
      <Footer />
    </MotionProvider>
  );
}

function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6">
      <div className="relative">
        <PeekingMascot delay={0.3} className="left-10 w-28 sm:left-16" />
        <div className="relative overflow-hidden rounded-3xl border bg-fd-card px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-24 mx-auto h-48 w-3/4 rounded-full bg-gradient-to-r from-brand/30 via-brand-2/25 to-brand-3/30 blur-3xl"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Peeper is young. <span className="text-gradient">Help shape it.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-fd-muted-foreground text-pretty">
            The language changes quickly while it is pre-release. Read how the compiler works, try
            the examples, and open an issue for what you find.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110"
            >
              Read the docs
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={compilerUrl}
              className="inline-flex items-center gap-2 rounded-full border bg-fd-background px-5 py-2.5 text-sm font-semibold transition hover:bg-fd-accent"
            >
              The compiler on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-fd-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Mascot className="h-5 w-[28px] shrink-0" />
          <span>Peeper · GPL-3.0</span>
        </div>
        <nav className="flex gap-6">
          <Link href="/docs" className="hover:text-fd-foreground">
            Docs
          </Link>
          <Link href="/docs/tour" className="hover:text-fd-foreground">
            Tour
          </Link>
          <a href={`${compilerUrl}/issues`} className="hover:text-fd-foreground">
            Issues
          </a>
          <a href={compilerUrl} className="hover:text-fd-foreground">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
