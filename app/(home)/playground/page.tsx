import type { Metadata } from 'next';
import { Playground } from '@/components/playground/playground';
import { STARTING_CODE } from '@/lib/file-paths';
import { codeTokens, highlighter } from '@/lib/highlight';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Write and run Peeper in your browser, with errors underlined as you type.',
};

export default async function PlaygroundPage() {
  const startingLines = codeTokens(await highlighter, STARTING_CODE, 'peeper');
  return (
    // The height left under the 3.5rem site header: the editor fills the screen.
    <main className="h-[calc(100dvh-3.5rem)] min-h-96 p-2 sm:p-3">
      <h1 className="sr-only">Playground</h1>
      <Playground startingLines={startingLines} />
    </main>
  );
}
