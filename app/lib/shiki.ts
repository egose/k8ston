import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from '@shikijs/langs/bash';
import javascript from '@shikijs/langs/javascript';
import json from '@shikijs/langs/json';
import python from '@shikijs/langs/python';
import typescript from '@shikijs/langs/typescript';
import xml from '@shikijs/langs/xml';
import yaml from '@shikijs/langs/yaml';
import githubDark from '@shikijs/themes/github-dark';
import githubLight from '@shikijs/themes/github-light';

// Fine-grained Shiki bundle: VS Code-grade highlighting without the full
// grammar/theme set and without the Oniguruma WASM payload — the pure-JS
// regex engine keeps this chunk small and avoids runtime .wasm fetches.
// Only reachable through the dynamically imported value-preview, so none of
// this lands in the page bundle.

export type ShikiLang = 'json' | 'yaml' | 'xml' | 'javascript' | 'typescript' | 'python' | 'bash';

const THEMES = { light: 'github-light', dark: 'github-dark' } as const;

let highlighter: HighlighterCore | null = null;

function getHighlighter(): HighlighterCore {
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      engine: createJavaScriptRegexEngine(),
      themes: [githubLight, githubDark],
      langs: [json, yaml, xml, javascript, typescript, python, bash],
    });
  }
  return highlighter;
}

/** Values above this size skip highlighting (plain <pre>) to avoid jank. */
export const HIGHLIGHT_BUDGET = 128 * 1024;

const FENCE_ALIASES: Record<string, ShikiLang> = {
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  python: 'python',
  py: 'python',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  terminal: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
};

/** Map a Markdown fence tag to a bundled grammar; null renders as plain text. */
export function normalizeFenceLang(tag: string): ShikiLang | null {
  return FENCE_ALIASES[tag.trim().toLowerCase()] ?? null;
}

/**
 * Highlight `code` to an HTML string. The output is Shiki-escaped spans, so it
 * is safe to inject via dangerouslySetInnerHTML — no markup from the secret
 * value itself survives. Throws on unknown langs; callers fall back to <pre>.
 */
export function highlightToHtml(code: string, lang: ShikiLang, dark: boolean): string {
  return getHighlighter().codeToHtml(code, {
    lang,
    theme: dark ? THEMES.dark : THEMES.light,
  });
}
