import type { System } from './system-icons';

// The commands the home page shows for getting Peeper. Data only, with no 'use client': the page
// highlights them on the server, and a client module's values never reach a server component.

const release = 'https://github.com/PeeperLanguage/compiler/releases/latest/download';

/** A step's command for one system: `name` is its tab. */
export type Choice = { name: string; command: string };

/** One step: a single command, written for `sh`, or one command per system. */
export type Step = { note: string } & ({ command: string } | { choices: Choice[] });

/** The installer, for each system. */
export const installChoices: Choice[] = [
  { name: 'Linux and macOS', command: `curl -fsSL ${release}/install.sh | sh` },
  { name: 'Windows PowerShell', command: `irm ${release}/install.ps1 | iex` },
];

/** Each system and processor Peeper works on, by either way of getting it. Set by hand. */
export const platforms: { system: System; processor: string }[] = [
  { system: 'Linux', processor: 'x86-64' },
  { system: 'Linux', processor: 'ARM64' },
  { system: 'macOS', processor: 'x86-64' },
  { system: 'macOS', processor: 'ARM64' },
  { system: 'Windows', processor: 'x86-64' },
  { system: 'Windows', processor: 'ARM64' },
];

/** The two ways to get Peeper, and their steps. */
export const ways: { name: string; steps: Step[] }[] = [
  {
    name: 'Install',
    steps: [
      { note: 'install the compiler', choices: installChoices },
      { note: 'then, in a new terminal and an empty folder', command: 'peeper init hello' },
      { note: 'run the new project', command: 'peeper run' },
    ],
  },
  {
    name: 'Build from source',
    steps: [
      {
        note: 'get the source',
        command: 'git clone https://github.com/PeeperLanguage/compiler.git && cd compiler',
      },
      {
        note: 'fetch the pinned LLVM toolchain',
        choices: [
          { name: 'Linux and macOS', command: 'bash scripts/setup.sh' },
          { name: 'Windows PowerShell', command: 'pwsh scripts/setup.ps1' },
        ],
      },
      { note: 'build the compiler', command: 'bash scripts/build.sh' },
      { note: 'run a program', command: 'build/bin/peeper run examples/01_functions.peep' },
    ],
  },
];

/** Every command of `ways`, the installer's among them. */
export const shownCommands: string[] = ways.flatMap(({ steps }) =>
  steps.flatMap((step) =>
    'choices' in step ? step.choices.map(({ command }) => command) : [step.command],
  ),
);
