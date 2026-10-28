/** `text` with each `...` part shown as code. */
export function Inline({ text }: { text: string }) {
  return text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <code
        key={part}
        className="rounded bg-fd-muted px-1 py-0.5 font-mono text-[0.85em] text-fd-foreground"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );
}
