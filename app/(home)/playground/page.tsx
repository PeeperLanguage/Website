import type { Metadata } from 'next';
import { Playground } from '@/components/playground/playground';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Write Peeper in your browser, with its errors underlined as you type.',
};

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Playground</h1>
      <p className="mt-2 mb-6 text-fd-muted-foreground">
        The compiler runs in this page and checks your code as you type. Nothing is sent anywhere.
        Running programs is coming later.
      </p>
      <Playground />
    </main>
  );
}
