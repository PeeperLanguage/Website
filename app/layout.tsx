import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { CODE_THEME_CSS, CODE_THEME_SCRIPT } from '@/lib/highlight/code-theme';
import './global.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: {
    template: '%s | Peeper',
    default: 'Peeper: systems code, checked before it runs',
  },
  description:
    'Peeper is an experimental systems programming language. Its compiler checks types, paths, moves and borrows, and builds native programs through LLVM.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} font-sans`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed script built from the theme list */}
        <script dangerouslySetInnerHTML={{ __html: CODE_THEME_SCRIPT }} />
        <style>{CODE_THEME_CSS}</style>
      </head>
      {/* Extensions such as Grammarly add attributes here before React loads. */}
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <RootProvider theme={{ defaultTheme: 'dark' }}>{children}</RootProvider>
      </body>
    </html>
  );
}
