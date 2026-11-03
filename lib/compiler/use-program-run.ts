import { useEffect, useState } from 'react';
import type { RunReply } from './checker';
import { runProgram } from './run-program';

/** The compiler's reply for the project `files`, once it comes. Nothing runs until `wanted`. */
export function useProgramRun(files: Record<string, string>, wanted: boolean) {
  const [reply, setReply] = useState<RunReply>();
  useEffect(() => {
    if (!wanted) return;
    let current = true;
    runProgram(files).then((answer) => {
      if (current) setReply(answer);
    });
    return () => {
      current = false;
    };
  }, [files, wanted]);
  return reply;
}
