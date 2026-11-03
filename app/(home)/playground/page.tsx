import type { Metadata } from 'next';
import { Playground } from '@/components/playground/playground';
import { codeTokens, highlighter } from '@/lib/highlight/highlight';
import { readProgram } from '@/lib/read-program';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Write and run Peeper in your browser, with errors underlined as you type.',
};

export default async function PlaygroundPage() {
  const code = await readProgram('playground/main');
  const lines = codeTokens(await highlighter, code, 'peeper');
  return (
    // The height left under the 3.5rem site header: the editor fills the screen.
    <main className="h-[calc(100dvh-3.5rem)] min-h-96 p-2 sm:p-3">
      <h1 className="sr-only">Playground</h1>
      <Playground starting={{ code, lines }} />
    </main>
  );
}
