import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAIN, MANIFEST, STARTING_MANIFEST } from '../../lib/compiler/project.ts';
import { remarkTerminal } from './remark-terminal.ts';

const terminal = (run, ...children) => ({
  type: 'mdxJsxFlowElement',
  name: 'Terminal',
  attributes: run === undefined ? [] : [{ type: 'mdxJsxAttribute', name: 'run', value: run }],
  children,
});
const code = (value, meta) => ({ type: 'code', lang: 'peeper', value, meta });
const process = (node) => remarkTerminal()({ type: 'root', children: [node] });
const filesOf = (node) => JSON.parse(node.attributes.find(({ name }) => name === 'files').value);

for (const [mode, run] of [
  ['manual', null],
  ['automatic', 'auto'],
]) {
  test(`the code blocks of a ${mode} Terminal become its project, and stay on the page`, () => {
    const main = code('fn main() {}', null);
    const other = code('fn Two() {}', 'title="src/two.peep"');
    const node = terminal(run, main, { type: 'paragraph' }, other);
    process(node);
    assert.deepEqual(filesOf(node), {
      [MANIFEST]: STARTING_MANIFEST,
      [MAIN]: 'fn main() {}\n',
      'src/two.peep': 'fn Two() {}\n',
    });
    assert.equal(main.meta, `title="${MAIN}"`, 'the main file shows its name');
    assert.equal(other.meta, 'title="src/two.peep"');
    assert.equal(node.children.length, 3);
  });
}

test('a Terminal with no run only shows its blocks, whatever they are', () => {
  const block = code('x', 'title="src/two.peep"');
  const node = terminal(undefined, block);
  process(node);
  assert.deepEqual(node.attributes, []);
  assert.equal(block.meta, 'title="src/two.peep"');
  process(terminal(undefined));
});

test('a title from the repository still finds its place in the project', () => {
  const node = terminal(
    'auto',
    code('name = "modules"', 'title="examples/modules/peeper.toml"'),
    code('fn Side() {}', 'title="examples/modules/src/shapes/side.peep"'),
    code('fn main() {}', 'title="examples/modules/src/main.peep"'),
  );
  process(node);
  assert.deepEqual(filesOf(node), {
    [MANIFEST]: 'name = "modules"\n',
    'src/shapes/side.peep': 'fn Side() {}\n',
    [MAIN]: 'fn main() {}\n',
  });
});

test('a block outside src is the main file, and keeps the title it shows', () => {
  const block = code('fn main() {}', 'title="examples/02_numbers.peep"');
  const node = terminal('auto', block);
  process(node);
  assert.equal(filesOf(node)[MAIN], 'fn main() {}\n');
  assert.equal(block.meta, 'title="examples/02_numbers.peep"');
});

test('blocks outside a Terminal are left alone', () => {
  const outside = code('x', null);
  process(outside);
  assert.equal(outside.meta, null);
});

test('a Terminal that cannot make a project stops the build', () => {
  assert.throws(() => process(terminal('auto', code('x', 'title="src/two.peep"'))), /needs a code/);
  assert.throws(() => process(terminal(null)), /needs a code/);
  assert.throws(() => process(terminal('auto', code('a', null), code('b', null))), /two code/);
  assert.throws(() => process(terminal('manual', code('x', null))), /run="manual"/);
});

test('a terminal block becomes a printed terminal, and needs its command', () => {
  const block = { type: 'code', lang: 'terminal', value: 'one\ntwo', meta: 'title="peeper fix"' };
  process(block);
  assert.equal(block.name, 'PrintedTerminal');
  assert.deepEqual(
    block.attributes.map(({ name, value }) => [name, value]),
    [
      ['command', 'peeper fix'],
      ['text', 'one\ntwo'],
    ],
  );
  assert.throws(
    () => process({ type: 'code', lang: 'terminal', value: 'x', meta: null }),
    /needs a title/,
  );
});
