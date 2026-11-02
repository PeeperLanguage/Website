// Programs the home page shows, each with what `peeper run` printed for it.

/** The program in the hero; it prints `distance: 7`. */
export const heroProgram =
  'struct Point { x: i32, y: i32 }\n\nfn distance(a: &Point, b: &Point) -> i32 {\n    return (b.x - a.x) + (b.y - a.y);\n}\n\nfn main() {\n    let start = Point.{ x = 1, y = 2 };\n    let end: Point = .{ x = 4, y = 6 };\n    println("distance:", distance(&start, &end));\n}\n';

/** The tour tabs: a name, a program and what it prints. */
export const tourPrograms = [
  {
    name: 'Loops',
    code: 'fn main() {\n    print("step:");\n    for v in 0..10:3 { print("", v); }\n    println();\n\n    print("down:");\n    for v in 5..=0:2 { print("", v); }\n    println();\n\n    let mut n = 1;\n    for n < 100 {                   // while `n < 100`\n        n = n * 3;\n    }\n    println("while:", n);\n}\n',
    output: 'step: 0 3 6 9\ndown: 5 3 1\nwhile: 243',
  },
  {
    name: 'Arrays',
    code: 'fn bump(values: &mut [3]i32) {      // changes the caller\'s array\n    for value in values {\n        value.* = value.* + 1;\n    }\n}\n\nfn main() {\n    let a = [3]i32{1, 2, 3};\n    let mut c = a;                  // a copy: `a` stays as it is\n    c[0] = 9;\n    bump(&mut c);\n    println("a:", a, "c:", c, "len:", c.len);\n    println("spread:", [_]i32{a..., 0, a...});\n}\n',
    output: 'a: [1, 2, 3] c: [10, 3, 4] len: 3\nspread: [1, 2, 3, 0, 1, 2, 3]',
  },
  {
    name: 'Structs',
    code: 'struct Point { x: i32, y: i32 }\nstruct Line { start: Point, end: Point }\n\nfn length(line: Line) -> i32 {      // takes the line, moved in\n    return line.end.x - line.start.x + line.end.y - line.start.y;\n}\n\nfn main() {\n    let start = Point.{ y = 2, x = 1 };\n    let end: Point = .{ x = 4, y = 6 };\n    let line = Line.{ start = start, end = end };\n    println("line:", line);\n    println("length:", length(line));   // `line` moves; it is unset now\n}\n',
    output: 'line: Line { start: Point { x: 1, y: 2 }, end: Point { x: 4, y: 6 } }\nlength: 7',
  },
];

/**
 * The program the compile story follows. story.ts holds what the compiler
 * wrote for it, and `peeper run` printed `max: 3`.
 */
export const storyProgram =
  'fn max(a: i32, b: i32) -> i32 {\n    if a > b {\n        return a;\n    }\n    return b;\n}\n\nfn main() {\n    println("max:", max(2, 3));\n}\n';
