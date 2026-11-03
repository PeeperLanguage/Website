import { MAIN, MANIFEST, SOURCE, STARTING_MANIFEST } from '../../lib/compiler/project.ts';

type Attribute = { type: string; name: string; value: string | null };
type MdNode = {
  type: string;
  name?: string;
  lang?: string;
  meta?: string | null;
  value?: string;
  children?: MdNode[];
  attributes?: Attribute[];
};

const titled = /title="([^"]+)"/;
// A title may give the path in the repository, as in `examples/modules/src/main.peep`.
const projectPath = new RegExp(`(?:^|/)(${SOURCE}/.+|${MANIFEST})$`);

/**
 * Turns the code blocks of a `<Terminal run>` or `<Terminal run="auto">` into the project they
 * make, so the code on the page is the code that runs. A title under `src` or naming the manifest
 * says where its block goes in the project, and any other block is the main file. A `<Terminal>`
 * with no `run` only shows its blocks.
 *
 * A ```` ```terminal title="command" ```` block, for what cannot run in a page, becomes a
 * `PrintedTerminal` showing its text as what `command` printed.
 */
export function remarkTerminal() {
  const visit = (node: MdNode) => {
    if (node.type === 'code' && node.lang === 'terminal') {
      const command = node.meta?.match(titled)?.[1];
      if (!command) throw new Error('A terminal block needs a title, the command it shows');
      Object.assign(node, {
        type: 'mdxJsxFlowElement',
        name: 'PrintedTerminal',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'command', value: command },
          { type: 'mdxJsxAttribute', name: 'text', value: node.value },
        ],
        children: [],
      });
      return;
    }
    if (node.type !== 'mdxJsxFlowElement' || node.name !== 'Terminal') {
      node.children?.forEach(visit);
      return;
    }
    const run = node.attributes?.find(({ name }) => name === 'run');
    if (!run) return;
    if (run.value !== null && run.value !== 'auto') {
      throw new Error(`A <Terminal> has run or run="auto", not run="${run.value}"`);
    }
    const files: Record<string, string> = {};
    for (const block of node.children ?? []) {
      if (block.type !== 'code') continue;
      const title = block.meta?.match(titled)?.[1];
      if (!title) block.meta = `${block.meta ?? ''} title="${MAIN}"`.trim();
      const path = title?.match(projectPath)?.[1] ?? MAIN;
      if (path in files) throw new Error(`A <Terminal> has two code blocks for ${path}`);
      files[path] = `${block.value}\n`;
    }
    if (!(MAIN in files)) throw new Error(`A <Terminal> needs a code block for ${MAIN}`);
    node.attributes?.push({
      type: 'mdxJsxAttribute',
      name: 'files',
      value: JSON.stringify({ [MANIFEST]: STARTING_MANIFEST, ...files }),
    });
  };
  return visit;
}
