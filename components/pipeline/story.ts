import { runCommand } from '@/lib/compiler/project';
/** A row of a compile stage: the source line it came from, 0 for none, and its text. */
export type StoryRow = [line: number, text: string];

/** The source line `main` starts on; the lines before it are `max`. */
export const mainLine = 8;

// What the compiler wrote for `storyProgram`: its `-dump` files and, from
// `objdump -d -l`, its debug build on x86-64 Linux. The source lines come from
// the build's debug info. LLVM IR is shown without that debug info, and from
// its first `define` to its last `}`.
export const thir: StoryRow[] = [
  [1, 'fn max:'],
  [2, '    if (a.0 GreaterThan b.1) {'],
  [3, '        return a.0'],
  [4, '    }'],
  [5, '    return b.1'],
  [0, ''],
  [8, 'fn main:'],
  [8, '    {'],
  [9, '        let _.0 = convert(call max(2:i32, 3:i32):i32):i64'],
  [9, '        let _.1 = "max:"'],
  [9, '        call PrintBytes(_.1[0], _.1[1]):void'],
  [9, '        call PrintText(c" "):void'],
  [9, '        call PrintInt(1:i32, 1:i32, @_.0):void'],
  [9, '        call PrintText(c"\\n"):void'],
  [9, '        call Flush():void'],
  [10, '    }'],
];

export const mir: StoryRow[] = [
  [1, 'fn max:'],
  [1, '  bb0:'],
  [1, '    store i32 a.0, arg0'],
  [1, '    store i32 b.1, arg1'],
  [2, '    %2 = load i32 a.0'],
  [2, '    %3 = load i32 b.1'],
  [2, '    %4 = slt i32 %3, %2'],
  [2, '    branch %4, bb1, bb2'],
  [3, '  bb1:'],
  [3, '    %5 = load i32 a.0'],
  [3, '    dead b.1'],
  [3, '    dead a.0'],
  [3, '    return %5'],
  [5, '  bb2:'],
  [5, '    %8 = load i32 b.1'],
  [5, '    dead b.1'],
  [5, '    dead a.0'],
  [5, '    return %8'],
  [4, '  bb3:'],
  [4, '    jump bb2'],
  [6, '  bb4:'],
  [6, '    dead b.1'],
  [6, '    dead a.0'],
  [6, '    fall off at `}`'],
  [0, ''],
  [8, 'fn main:'],
  [9, '  bb0:'],
  [9, '    %0 = call max(2, 3)'],
  [9, '    %1 = sext i32 %0 to i64'],
  [9, '    store i64 .0, %1'],
  [9, '    store ptr .1, global 0'],
  [9, '    store i64 .1[+8], 4'],
  [9, '    %5 = load ptr .1[+0]'],
  [9, '    %6 = load i64 .1[+8]'],
  [9, '    call PrintBytes(%5, %6) in C (register, register)'],
  [9, '    call PrintText(global 1) in C (register)'],
  [9, '    %9 = address 8 .0'],
  [9, '    call PrintInt(1, 1, %9) in C (register, register, register)'],
  [9, '    call PrintText(global 2) in C (register)'],
  [9, '    call Flush() in C ()'],
  [10, '    dead .1'],
  [10, '    dead .0'],
  [10, '    fall off at `}`'],
  [0, '  global 0 = "max:"'],
  [0, '  global 1 = " \\x00"'],
  [0, '  global 2 = "\\n\\x00"'],
];

export const llvm: StoryRow[] = [
  [1, 'define i32 @"main:main.max"(i32 %a0, i32 %a1) {'],
  [1, 'entry:'],
  [1, '  %s0 = alloca [4 x i8], align 4'],
  [1, '  %s1 = alloca [4 x i8], align 4'],
  [1, '  br label %bb0'],
  [1, 'bb0:'],
  [1, '  store i32 %a0, ptr %s0'],
  [1, '  store i32 %a1, ptr %s1'],
  [2, '  %i2 = load i32, ptr %s0'],
  [2, '  %i3 = load i32, ptr %s1'],
  [2, '  %i4.c = icmp slt i32 %i3, %i2'],
  [2, '  br i1 %i4.c, label %bb1, label %bb2'],
  [3, 'bb1:'],
  [3, '  %i5 = load i32, ptr %s0'],
  [3, '  ret i32 %i5'],
  [5, 'bb2:'],
  [5, '  %i8 = load i32, ptr %s1'],
  [5, '  ret i32 %i8'],
  [6, '}'],
  [0, ''],
  [8, 'define void @"main:main.main"() {'],
  [8, 'entry:'],
  [8, '  %s0 = alloca [8 x i8], align 8'],
  [8, '  %s1 = alloca [16 x i8], align 8'],
  [8, '  br label %bb0'],
  [9, 'bb0:'],
  [9, '  %i0 = call i32 @"main:main.max"(i32 2, i32 3)'],
  [9, '  %i1 = sext i32 %i0 to i64'],
  [9, '  store i64 %i1, ptr %s0'],
  [9, '  store ptr @.str.0, ptr %s1'],
  [9, '  %i4 = getelementptr inbounds i8, ptr %s1, i64 8'],
  [9, '  store i64 4, ptr %i4'],
  [9, '  %i5 = load ptr, ptr %s1'],
  [9, '  %i6.a = getelementptr inbounds i8, ptr %s1, i64 8'],
  [9, '  %i6 = load i64, ptr %i6.a'],
  [9, '  call void @"peeper_rt_v1_print_bytes"(ptr %i5, i64 %i6)'],
  [9, '  call void @"peeper_rt_v1_print_text"(ptr @.str.1)'],
  [9, '  call void @"peeper_rt_v2_print_int"(i32 1, i32 1, ptr %s0)'],
  [9, '  call void @"peeper_rt_v1_print_text"(ptr @.str.2)'],
  [9, '  call void @"peeper_rt_v1_flush"()'],
  [10, '  ret void'],
  [10, '}'],
];

type Instruction = [line: number, at: string, bytes: string, code: string];

// Each function's label as objdump gives it, and its instructions: source line,
// address, bytes, and what they mean.
const functions: { label: string; instructions: Instruction[] }[] = [
  {
    label: '0000000000002830 <main:main.max>:',
    instructions: [
      [1, '2830', '89 7c 24 f0', 'mov DWORD PTR [rsp-0x10], edi'],
      [1, '2834', '89 74 24 f4', 'mov DWORD PTR [rsp-0xc], esi'],
      [1, '2838', '8b 44 24 f4', 'mov eax, DWORD PTR [rsp-0xc]'],
      [1, '283c', '8b 4c 24 f0', 'mov ecx, DWORD PTR [rsp-0x10]'],
      [1, '2840', '89 4c 24 fc', 'mov DWORD PTR [rsp-0x4], ecx'],
      [1, '2844', '89 44 24 f8', 'mov DWORD PTR [rsp-0x8], eax'],
      [2, '2848', '8b 44 24 fc', 'mov eax, DWORD PTR [rsp-0x4]'],
      [2, '284c', '39 44 24 f8', 'cmp DWORD PTR [rsp-0x8], eax'],
      [2, '2850', '7d 05', 'jge 2857'],
      [3, '2852', '8b 44 24 fc', 'mov eax, DWORD PTR [rsp-0x4]'],
      [3, '2856', 'c3', 'ret'],
      [5, '2857', '8b 44 24 f8', 'mov eax, DWORD PTR [rsp-0x8]'],
      [5, '285b', 'c3', 'ret'],
    ],
  },
  {
    label: '0000000000002860 <main:main.main>:',
    instructions: [
      [8, '2860', '48 83 ec 18', 'sub rsp, 0x18'],
      [9, '2864', 'bf 02 00 00 00', 'mov edi, 0x2'],
      [9, '2869', 'be 03 00 00 00', 'mov esi, 0x3'],
      [9, '286e', 'e8 bd ff ff ff', 'call 2830 <main:main.max>'],
      [9, '2873', '48 98', 'cdqe'],
      [9, '2875', '48 89 44 24 10', 'mov QWORD PTR [rsp+0x10], rax'],
      [9, '287a', '48 8d 05 5b df ff ff', 'lea rax, [rip-0x20a5]'],
      [9, '2881', '48 89 04 24', 'mov QWORD PTR [rsp], rax'],
      [9, '2885', '48 c7 44 24 08 04 00 00 00', 'mov QWORD PTR [rsp+0x8], 0x4'],
      [9, '288e', '48 8b 3c 24', 'mov rdi, QWORD PTR [rsp]'],
      [9, '2892', '48 8b 74 24 08', 'mov rsi, QWORD PTR [rsp+0x8]'],
      [9, '2897', 'e8 84 03 00 00', 'call peeper_rt_v1_print_bytes'],
      [9, '289c', '48 8d 3d 3d df ff ff', 'lea rdi, [rip-0x20c3]'],
      [9, '28a3', 'e8 08 09 00 00', 'call peeper_rt_v1_print_text'],
      [9, '28a8', 'be 01 00 00 00', 'mov esi, 0x1'],
      [9, '28ad', '48 8d 54 24 10', 'lea rdx, [rsp+0x10]'],
      [9, '28b2', '89 f7', 'mov edi, esi'],
      [9, '28b4', 'e8 77 09 00 00', 'call peeper_rt_v2_print_int'],
      [9, '28b9', '48 8d 3d 24 df ff ff', 'lea rdi, [rip-0x20dc]'],
      [9, '28c0', 'e8 eb 08 00 00', 'call peeper_rt_v1_print_text'],
      [9, '28c5', 'e8 b6 02 00 00', 'call peeper_rt_v1_flush'],
      [10, '28ca', '48 83 c4 18', 'add rsp, 0x18'],
      [10, '28ce', 'c3', 'ret'],
    ],
  },
];

/** Each function's label, then its `rows`, with a blank row between functions. */
function labeled(rows: (instructions: Instruction[]) => StoryRow[]): StoryRow[] {
  return functions.flatMap(({ label, instructions }, index) => [
    ...(index > 0 ? ([[0, '']] as StoryRow[]) : []),
    [0, label] as StoryRow,
    ...rows(instructions),
  ]);
}

export const machine = labeled((instructions) =>
  instructions.map(([line, at, bytes, code]) => {
    const [mnemonic, ...operands] = code.split(' ');
    return [line, `${at}  ${bytes.padEnd(22)}${mnemonic.padEnd(7)}${operands.join(' ')}`];
  }),
);

const bytesPerRow = 16;

/** The same bytes with nothing else: a row per source line, as many as they need. */
function packedBytes(instructions: Instruction[]): StoryRow[] {
  const rows: { line: number; at: string; bytes: string[] }[] = [];
  for (const [line, at, bytes] of instructions) {
    for (const byte of bytes.split(' ')) {
      const last = rows.at(-1);
      if (last?.line === line && last.bytes.length < bytesPerRow) last.bytes.push(byte);
      else rows.push({ line, at, bytes: [byte] });
    }
  }
  return rows.map(({ line, at, bytes }) => [line, `${at}  ${bytes.join(' ')}`]);
}

export const binary = labeled(packedBytes);

export const run: StoryRow[] = [
  [0, `> ${runCommand}`],
  [9, 'max: 3'],
];

/** One step of the story: its tab, what its window shows, and what it says about it. */
export type Stage = { tab: string; file: string; title: string; text: string; rows: StoryRow[] };

/** The steps from source to a running program. The first shows the source, so it has no rows. */
export const stages: Stage[] = [
  {
    tab: 'Source',
    file: 'src/main.peep',
    title: 'You write a program.',
    text: 'Scroll, and this whole program turns into what the processor runs. Each band is one source line, and the bar beside it says which function it is in. Every step is what the compiler really wrote.',
    rows: [],
  },
  {
    tab: 'THIR',
    file: 'main.thir',
    title: 'Every name gets an identity.',
    text: 'The checker resolves each name and type. `a` becomes the local `a.0`, `b` becomes `b.1`, and each literal is now an `i32`.',
    rows: thir,
  },
  {
    tab: 'MIR',
    file: 'main.mir',
    title: 'The code becomes a graph.',
    text: 'Lowering turns each function into blocks and jumps. On the graph the compiler checks that every path returns, nothing is used after it moves, and no borrow overlaps a `&mut`, then drops what only those checks needed.',
    rows: mir,
  },
  {
    tab: 'LLVM IR',
    file: 'main.ll',
    title: 'The graph becomes LLVM IR.',
    text: 'Each block becomes LLVM text, written on worker threads while the next module is still being checked.',
    rows: llvm,
  },
  {
    tab: 'x86-64',
    file: 'objdump -d main',
    title: 'LLVM IR becomes machine code.',
    text: 'Clang compiles the modules, one per core. Each instruction is now a few bytes, shown beside what they mean.',
    rows: machine,
  },
  {
    tab: 'Binary',
    file: 'main',
    title: 'Only the bytes are left.',
    text: 'This is all the processor sees of `max` and `main`. The linker adds Peeper’s runtime, and a `-release` build of this program comes to about 8 KB.',
    rows: binary,
  },
  {
    tab: 'Run',
    file: 'terminal',
    title: 'And it runs.',
    text: '`peeper run` builds the program, then runs it. `max(2, 3)` is `3`.',
    rows: run,
  },
];
