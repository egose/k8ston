'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { lintGutter, linter, type Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { useTheme } from 'next-themes';
import { parseDocument } from 'yaml';
import type { ValueContentType } from '@/lib/content-type';

// Lazily loaded by value-dialog (CodeMirror stays out of the page bundle).

interface Props {
  value: string;
  onChange: (next: string) => void;
  contentType: ValueContentType;
  readOnly: boolean;
  placeholder?: string;
}

// The `yaml` package reports error offsets — surface them as gutter markers
// with hover messages (the dialog keeps its one-line summary below).
function yamlLinter(view: EditorView): readonly Diagnostic[] {
  const len = view.state.doc.length;
  if (len === 0) return [];
  try {
    return parseDocument(view.state.doc.toString())
      .errors.slice(0, 10)
      .map((e) => {
        const from = Math.max(0, Math.min(e.pos?.[0] ?? 0, len));
        const to = Math.max(from + 1, Math.min(e.pos?.[1] ?? from + 1, len));
        return { from, to, severity: 'error' as const, message: e.message.split('\n')[0] };
      });
  } catch {
    return [];
  }
}

export function ValueEditor({ value, onChange, contentType, readOnly, placeholder }: Props) {
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(() => {
    // YAML has no official CodeMirror 6 grammar — the legacy mode covers highlighting.
    const lang =
      contentType === 'json'
        ? json()
        : contentType === 'xml'
          ? xml()
          : contentType === 'markdown'
            ? markdown()
            : contentType === 'yaml'
              ? StreamLanguage.define(yaml)
              : [];
    return [
      lang,
      // Secret values are often long single lines (tokens, base64) — wrap like a textarea.
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        'aria-label': 'Secret value',
        spellcheck: 'false',
        autocapitalize: 'off',
        autocorrect: 'off',
      }),
      // Inline syntax diagnostics (JSON via the Lezer grammar, YAML via offsets
      // from the `yaml` package) — gutter markers with hover tooltips.
      ...(contentType === 'json'
        ? [linter(jsonParseLinter()), lintGutter()]
        : contentType === 'yaml'
          ? [linter(yamlLinter), lintGutter()]
          : []),
    ];
  }, [contentType]);

  return (
    <div className="overflow-hidden rounded-md border font-mono text-xs">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={resolvedTheme === 'light' ? githubLight : githubDark}
        readOnly={readOnly}
        placeholder={placeholder}
        minHeight="360px"
        maxHeight="55vh"
      />
    </div>
  );
}
