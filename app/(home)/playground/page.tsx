import type { Metadata } from 'next';
import { Playground } from '@/components/playground/playground';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Write and run Peeper in your browser, with errors underlined as you type.',
};

export default function PlaygroundPage() {
  return (
    // The height left under the 3.5rem site header: the editor fills the screen.
    <main className="h-[calc(100dvh-3.5rem)] min-h-96 p-2 sm:p-3">
      <h1 className="sr-only">Playground</h1>
      <Playground />
    </main>
  );
}
