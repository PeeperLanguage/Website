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
  [9, '    println(c"max:", call max(2:i32, 3:i32):i32)'],
];

export const mir: StoryRow[] = [
  [1, 'fn max:'],
  [1, '  bb0:'],
  [1, '    store a.0, arg0'],
  [1, '    store b.1, arg1'],
  [2, '    %2 = load a.0: i32'],
  [2, '    %3 = load b.1: i32'],
  [2, '    %4 = GreaterThan %2, %3: bool'],
  [2, '    branch %4 (a > b) bb1 bb2'],
  [3, '  bb1:'],
  [3, '    %5 = load a.0: i32'],
  [3, '    scope end b.1'],
  [3, '    scope end a.0'],
  [3, '    return %5'],
  [5, '  bb2:'],
  [5, '    %8 = load b.1: i32'],
  [5, '    scope end b.1'],
  [5, '    scope end a.0'],
  [5, '    return %8'],
  [4, '  bb3:'],
  [4, '    goto bb2'],
  [6, '  bb4:'],
  [6, '    scope end b.1'],
  [6, '    scope end a.0'],
  [6, '    fall off at `}`'],
  [0, ''],
  [8, 'fn main:'],
  [9, '  bb0:'],
  [9, '    %0 = call max(2, 3): i32'],
  [9, '    println(c"max:", %0)'],
  [10, '    fall off at `}`'],
];

export const llvm: StoryRow[] = [
  [1, 'define i32 @"main.max"(i32 %arg0, i32 %arg1) {'],
  [1, 'entry:'],
  [1, '  %v0 = alloca i32'],
  [1, '  %v1 = alloca i32'],
  [1, '  br label %bb0'],
  [1, 'bb0:'],
  [1, '  store i32 %arg0, ptr %v0'],
  [1, '  store i32 %arg1, ptr %v1'],
  [2, '  %i2 = load i32, ptr %v0'],
  [2, '  %i3 = load i32, ptr %v1'],
  [2, '  %i4 = icmp sgt i32 %i2, %i3'],
  [2, '  br i1 %i4, label %bb1, label %bb2'],
  [3, 'bb1:'],
  [3, '  %i5 = load i32, ptr %v0'],
  [3, '  ret i32 %i5'],
  [5, 'bb2:'],
  [5, '  %i8 = load i32, ptr %v1'],
  [5, '  ret i32 %i8'],
  [4, 'bb3:'],
  [4, '  br label %bb2'],
  [6, 'bb4:'],
  [6, '  unreachable'],
  [6, '}'],
  [0, ''],
  [8, 'define void @"main.main"() {'],
  [8, 'entry:'],
  [8, '  %i1.1.m = alloca i64'],
  [8, '  br label %bb0'],
  [9, 'bb0:'],
  [9, '  %i0 = call i32 @"main.max"(i32 2, i32 3)'],
  [9, '  %i1.1.x = sext i32 %i0 to i64'],
  [9, '  store i64 %i1.1.x, ptr %i1.1.m'],
  [9, '  call void (ptr) @"peeper_rt_v1_print_text"(ptr @.str.1)'],
  [9, '  call void (i32, i32, ptr) @"peeper_rt_v2_print_int"(i32 1, i32 1, ptr %i1.1.m)'],
  [9, '  call void (ptr) @"peeper_rt_v1_print_text"(ptr @.str.2)'],
  [9, '  call void () @"peeper_rt_v1_flush"()'],
  [10, '  ret void'],
  [10, '}'],
];

type Instruction = [line: number, at: string, bytes: string, code: string];

// Each function's label as objdump gives it, and its instructions: source line,
// address, bytes, and what they mean.
const functions: { label: string; instructions: Instruction[] }[] = [
  {
    label: '0000000000002800 <main.max>:',
    instructions: [
      [1, '2800', '89 7c 24 f0', 'mov DWORD PTR [rsp-0x10], edi'],
      [1, '2804', '89 74 24 f4', 'mov DWORD PTR [rsp-0xc], esi'],
      [1, '2808', '8b 44 24 f4', 'mov eax, DWORD PTR [rsp-0xc]'],
      [1, '280c', '8b 4c 24 f0', 'mov ecx, DWORD PTR [rsp-0x10]'],
      [1, '2810', '89 4c 24 fc', 'mov DWORD PTR [rsp-0x4], ecx'],
      [1, '2814', '89 44 24 f8', 'mov DWORD PTR [rsp-0x8], eax'],
      [2, '2818', '8b 44 24 fc', 'mov eax, DWORD PTR [rsp-0x4]'],
      [2, '281c', '3b 44 24 f8', 'cmp eax, DWORD PTR [rsp-0x8]'],
      [2, '2820', '7e 05', 'jle 2827'],
      [3, '2822', '8b 44 24 fc', 'mov eax, DWORD PTR [rsp-0x4]'],
      [3, '2826', 'c3', 'ret'],
      [5, '2827', '8b 44 24 f8', 'mov eax, DWORD PTR [rsp-0x8]'],
      [5, '282b', 'c3', 'ret'],
    ],
  },
  {
    label: '0000000000002830 <main.main>:',
    instructions: [
      [8, '2830', '50', 'push rax'],
      [9, '2831', 'bf 02 00 00 00', 'mov edi, 0x2'],
      [9, '2836', 'be 03 00 00 00', 'mov esi, 0x3'],
      [9, '283b', 'e8 c0 ff ff ff', 'call 2800 <main.max>'],
      [9, '2840', '48 98', 'cdqe'],
      [9, '2842', '48 89 04 24', 'mov QWORD PTR [rsp], rax'],
      [9, '2846', '48 8d 3d 68 df ff ff', 'lea rdi, [rip-0x2098]'],
      [9, '284d', 'e8 1e 09 00 00', 'call peeper_rt_v1_print_text'],
      [9, '2852', 'be 01 00 00 00', 'mov esi, 0x1'],
      [9, '2857', '48 89 e2', 'mov rdx, rsp'],
      [9, '285a', '89 f7', 'mov edi, esi'],
      [9, '285c', 'e8 7f 09 00 00', 'call peeper_rt_v2_print_int'],
      [9, '2861', '48 8d 3d 46 df ff ff', 'lea rdi, [rip-0x20ba]'],
      [9, '2868', 'e8 03 09 00 00', 'call peeper_rt_v1_print_text'],
      [9, '286d', 'e8 de 02 00 00', 'call peeper_rt_v1_flush'],
      [10, '2872', '58', 'pop rax'],
      [10, '2873', 'c3', 'ret'],
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
  [0, '$ peeper run src/main.peep'],
  [9, 'max: 3'],
];
