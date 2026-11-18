# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

First, programmers who write systems code (C, C++, Rust, Go) and are deciding
whether a new language is worth an evening: they want to see real code, see what
the compiler catches, and try it without installing anything. Second, people who
might help build the compiler: they want to see how it works inside and where to
start. The home page serves the first group and keeps a clear path for the
second (owner, 2026-11-03).

## Product Purpose

Peeper is an experimental systems programming language. Its compiler checks
types, paths, moves and borrows, then builds a native program through LLVM on
Linux, macOS and Windows. The site explains the language, documents it, and
runs it in the browser. Success is a visitor who tries Peeper (the playground or
an install) or opens an issue.

## Positioning

A small, explicit language whose compiler shows its work: the site can follow one
real program through every stage the compiler writes (THIR, MIR, LLVM IR,
machine code, run), and its errors point at the cause and often carry a fix.

## Operating Context

Visitors arrive from links to the repository or posts, read on desktop and phone,
and often try code in the playground (`/playground`), which checks and runs
programs in the page with a WebAssembly build of the compiler. Nothing is sent
to a server.

## Capabilities and Constraints

- Pre-release: the compiler is being rebuilt in Rust and the language changes
  quickly. Say so plainly.
- Moves and borrows are checked like Rust; `const` is worked out at compile
  time; indexes, divisions and shifts the compiler cannot prove safe are checked
  at run time; many errors carry fixes (`peeper fix`); a language server
  re-checks only affected modules; each OS has a pinned LLVM toolchain.
- Licence: GPL-3.0.

## Brand Commitments

- The name Peeper and the frog mascot (`app/icon.svg`, `components/mascot.tsx`).
- The cursor-eating frogs stay on the home page (owner, 2026-11-03).
- The walkthrough of one program through the compiler stays on the home page
  (owner, 2026-11-03).
- The accent color stays the mascot's teal (`#4db6ac`) and leaf green (`#8bc34a`)
  (owner, 2026-11-03).
- Plain, simple English: easy words and short sentences.
- The home page gets a new layout and look of its own, apart from the one
  another site copied (owner, 2026-11-03).

## Evidence on Hand

- Real programs with their real output: `components/home/programs.ts`.
- Real compiler output for the walkthrough (`-dump` files and `objdump`):
  `components/home/story.ts`.
- A real diagnostic and the playground.
- No users, benchmarks, adopters or testimonials exist. Do not invent any.

## Product Principles

1. Prove, don't claim: show the compiler doing the work on real code.
2. Honest about being young: pre-release is stated, not hidden.
3. Trying it is one step away: the playground needs no install.
4. Plain words over jargon.
