import type { LanguageRegistration } from 'shiki';
// shortcut: a copy of VSCodeExt/syntaxes/peeper.tmLanguage.json; copy it
// again when the editor grammar changes.
import grammar from './peeper.tmLanguage.json';

/** Peeper's TextMate grammar, under the fence name `peeper`. */
export const peeper = {
  ...grammar,
  name: 'peeper',
  aliases: ['peep'],
} as unknown as LanguageRegistration;
