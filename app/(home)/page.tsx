import { Big_Shoulders } from 'next/font/google';
import Link from 'next/link';
import { CursorMuncher } from '@/components/cursor-muncher/cursor-muncher';
import { PrimaryLink, SecondaryLink } from '@/components/home/action-link';
import { Diagnostic } from '@/components/home/diagnostic';
import { Features } from '@/components/home/features';
import { Hero } from '@/components/home/hero';
import { PageWidth, Section } from '@/components/home/page-width';
import { SectionTitle } from '@/components/home/section-heading';
import { Tour } from '@/components/home/tour';
import { GetStarted } from '@/components/install/get-started';
import { shownCommands } from '@/components/install/install-steps';
import { Mascot } from '@/components/mascot';
import { MotionProvider } from '@/components/motion-provider';
import { Pipeline } from '@/components/pipeline/pipeline';
import { WaterEdge } from '@/components/pond/pond';
import { projectOf } from '@/lib/compiler/project';
import { commandTokens, peeperLines } from '@/lib/highlight/highlight';
import { readProgram } from '@/lib/read-program';
import { compilerUrl } from '@/lib/shared';

// The narrow face of the home page's headings, used as `font-display`.
const displayFont = Big_Shoulders({ subsets: ['latin'], variable: '--font-big-shoulders' });

export default async function HomePage() {
  const [heroCode, storyCode, borrowCode] = await Promise.all(
    ['home/hero', 'home/story', 'home/borrow'].map(readProgram),
  );
  const commands = await commandTokens(shownCommands);
  const samples = await Promise.all(
    ['Loops', 'Arrays', 'Structs'].map(async (name) => {
      const code = await readProgram(`home/${name.toLowerCase()}`);
      return { name, files: projectOf(code), lines: await peeperLines(code) };
    }),
  );
  return (
    <MotionProvider>
      <main className={`${displayFont.variable} flex-1`}>
        <Hero lines={await peeperLines(heroCode)} files={projectOf(heroCode)} commands={commands} />
        <Pipeline source={await peeperLines(storyCode)} />
        <Diagnostic lines={await peeperLines(borrowCode)} files={projectOf(borrowCode)} />
        <Features />
        <Tour samples={samples} />
        <GetStarted commands={commands} />
        <Closing />
      </main>
      <Footer />
    </MotionProvider>
  );
}

function Closing() {
  return (
    <Section className="pt-16">
      <div className="relative">
        <CursorMuncher className="left-10 w-28 sm:left-16" />
        <div className="relative overflow-hidden rounded-3xl border bg-fd-card px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-24 mx-auto h-48 w-3/4 rounded-full bg-gradient-to-r from-brand/30 via-brand-2/25 to-brand-3/30 blur-3xl"
          />
          <SectionTitle className="relative">
            Peeper is young. <span className="text-gradient">Help shape it.</span>
          </SectionTitle>
          <p className="relative mx-auto mt-4 max-w-xl text-fd-muted-foreground text-pretty">
            The language changes quickly while it is pre-release. Read how the compiler works, try
            the examples, and open an issue for what you find.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryLink href="/docs">Read the docs</PrimaryLink>
            <SecondaryLink href={compilerUrl}>The compiler on GitHub</SecondaryLink>
          </div>
        </div>
      </div>
    </Section>
  );
}

const footerLinks = [
  { name: 'Docs', href: '/docs' },
  { name: 'Tour', href: '/docs/tour' },
  { name: 'Issues', href: `${compilerUrl}/issues` },
  { name: 'GitHub', href: compilerUrl },
];

function Footer() {
  return (
    <footer className="relative border-t">
      {/* The page ends at the water's edge it began with, on the footer's top line. */}
      <WaterEdge className="absolute inset-x-0 bottom-full -z-10 h-84" />
      <PageWidth className="flex flex-col items-center justify-between gap-4 py-8 text-sm text-fd-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Mascot className="h-5 w-[28px] shrink-0" />
          <span>Peeper · GPL-3.0</span>
        </div>
        <nav className="flex gap-6">
          {footerLinks.map(({ name, href }) => (
            <Link key={name} href={href} className="hover:text-fd-foreground">
              {name}
            </Link>
          ))}
        </nav>
      </PageWidth>
    </footer>
  );
}
