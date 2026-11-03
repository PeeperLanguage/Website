import { Step, Steps } from 'fumadocs-ui/components/steps';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { CodeTabs, CodeTabsList, CodeTabsTrigger } from '@/components/code/code-tabs';
import { CopyButton } from '@/components/copy/copy-button';
import { ProgramTerminal } from '@/components/terminal/program-terminal';
import { TerminalLines } from '@/components/terminal/terminal-text';
import { TerminalWindow } from '@/components/terminal/terminal-window';

/**
 * The code blocks in `children`. With `run`, a terminal under them shows what the compiler in this
 * page says about them: at once when `run` is "auto", otherwise when the reader presses Run.
 * `files` is the project they make, as JSON, which `remarkTerminal` writes.
 */
function Terminal(
  props: { children: ReactNode } & ({ run?: undefined } | { run: true | 'auto'; files: string }),
) {
  return (
    <>
      {props.children}
      {props.run && (
        // Bare because the page holds a project, and a project with imports runs from its folder.
        <ProgramTerminal
          command="peeper run"
          files={JSON.parse(props.files)}
          waits={props.run === true}
          className="not-prose my-6"
        />
      )}
    </>
  );
}

/** A terminal showing `text` as what `command` printed, for what cannot run in a page. */
function PrintedTerminal({ command, text }: { command: string; text: string }) {
  return (
    <TerminalWindow
      command={command}
      className="not-prose my-6"
      actions={<CopyButton label="Copy the output" text={text} className="border-0 p-0" />}
    >
      <pre className="overflow-x-auto text-fd-muted-foreground">
        <TerminalLines text={text} />
      </pre>
    </TerminalWindow>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    CodeBlockTabs: CodeTabs,
    CodeBlockTabsList: CodeTabsList,
    CodeBlockTabsTrigger: CodeTabsTrigger,
    Step,
    Steps,
    PrintedTerminal,
    Terminal,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
