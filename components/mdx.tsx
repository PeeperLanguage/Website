import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { borrowError } from '@/components/home/borrow-error';
import { terminalLines } from '@/lib/ansi';

/** The tour's borrow error, colored as a terminal prints it. */
function BorrowError() {
  return (
    // Out of fumadocs' highlighting, which would color every span its own way.
    <div className="not-fumadocs-codeblock">
      <CodeBlock title="peeper check">
        <Pre>
          <code>
            {terminalLines(borrowError).map((pieces, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed transcript
              <span key={index} className="block min-h-[1lh] px-4">
                {pieces.map((piece, at) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed transcript
                  <span key={at} className={piece.className}>
                    {piece.text}
                  </span>
                ))}
              </span>
            ))}
          </code>
        </Pre>
      </CodeBlock>
    </div>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BorrowError,
    Step,
    Steps,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
