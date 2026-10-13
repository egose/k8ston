'use client';

import { Children, isValidElement, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from 'next-themes';
import type { ValueContentType } from '@/lib/content-type';
import { HIGHLIGHT_BUDGET, highlightToHtml, normalizeFenceLang, type ShikiLang } from '@/lib/shiki';

// Lazily loaded by value-dialog (Markdown + Shiki stay out of the page bundle).

const SHIKI_LANG: Record<ValueContentType, ShikiLang | null> = {
  json: 'json',
  yaml: 'yaml',
  markdown: null, // rendered as Markdown below, not as code
  pem: null, // no PEM grammar — plain <pre>
  xml: 'xml',
  text: null, // plain <pre> needs no highlighter
};

interface Props {
  value: string;
  contentType: ValueContentType;
}

const PREVIEW_BOX = 'max-h-[55vh] min-h-[120px] overflow-auto rounded border p-3 font-mono text-xs';

function PlainPre({ value }: { value: string }) {
  return (
    <pre data-testid="value-preview" className={`${PREVIEW_BOX} bg-muted/30`}>
      {value}
    </pre>
  );
}

function CodePreview({ value, lang }: { value: string; lang: ShikiLang }) {
  const { resolvedTheme } = useTheme();
  const html = useMemo(() => {
    if (value.length > HIGHLIGHT_BUDGET) return null;
    try {
      return highlightToHtml(value, lang, resolvedTheme !== 'light');
    } catch {
      return null;
    }
  }, [value, lang, resolvedTheme]);

  if (html === null) return <PlainPre value={value} />;
  // Shiki escapes the value — the output is inert spans, never live markup.
  return (
    <div
      data-testid="value-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      className="[&_pre]:m-0 [&_pre]:max-h-[55vh] [&_pre]:min-h-[120px] [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:border [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs"
    />
  );
}

export function ValuePreview({ value, contentType }: Props) {
  if (value === '') return <p className="text-xs text-muted-foreground">(empty)</p>;

  // Check the whole document before mounting a Markdown parser or highlighter.
  // Per-fence limits alone still parse the full Markdown tree and every fence.
  if (value.length > HIGHLIGHT_BUDGET) {
    return (
      <>
        <p className="mb-2 text-xs text-muted-foreground">
          Large value: showing raw text without rich preview. Raw and Copy keep the full value.
        </p>
        <PlainPre value={value} />
      </>
    );
  }

  if (contentType === 'markdown') return <MarkdownPreview value={value} />;

  const lang = SHIKI_LANG[contentType];
  if (lang === null) return <PlainPre value={value} />;
  return <CodePreview value={value} lang={lang} />;
}

function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children);
  return '';
}

const FENCE_WRAPPER =
  '[&_pre]:m-0 [&_pre]:my-2 [&_pre]:max-h-[320px] [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:border [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs';

// react-markdown renders fences as <pre><code class="language-x">…</code></pre>.
// Supported fence tags are swapped for Shiki output; anything else (plain
// fences, unknown tags, oversized blocks) keeps the default rendering.
function FencedCodeBlock({
  dark,
  node,
  children,
  ...rest
}: { dark: boolean; node?: unknown } & HTMLAttributes<HTMLPreElement>) {
  void node;
  const codeEl = Children.toArray(children).find((c) => isValidElement(c) && c.type === 'code');
  const className = (isValidElement<{ className?: string }>(codeEl) ? codeEl.props.className : undefined) as
    | string
    | undefined;
  const tag = /language-([\w+-]+)/.exec(className ?? '')?.[1] ?? null;
  const code = extractText(codeEl).replace(/\n$/, '');
  const lang = tag ? normalizeFenceLang(tag) : null;
  const html = useMemo(() => {
    if (!lang || code.length > HIGHLIGHT_BUDGET) return null;
    try {
      return highlightToHtml(code, lang, dark);
    } catch {
      return null;
    }
  }, [lang, code, dark]);

  if (html === null) return <pre {...rest}>{children}</pre>;
  return <div dangerouslySetInnerHTML={{ __html: html }} className={FENCE_WRAPPER} />;
}

function MarkdownPreview({ value }: { value: string }) {
  // No rehype-raw: raw HTML in values renders as inert text, never as DOM —
  // secret values must not become an XSS vector. Keep the default URL sanitizer;
  // safe links open only on activation, with no referrer or opener access.
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  return (
    <div
      data-testid="value-preview"
      // Plain-fence styles are scoped to :not(.shiki) so the injected Shiki
      // blocks (p-3, themed background) don't fight the container's p-2.
      className="max-h-[55vh] min-h-[120px] overflow-auto rounded border bg-muted/30 p-4 text-sm [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:opacity-80 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_hr]:my-3 [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre:not(.shiki)]:overflow-auto [&_pre:not(.shiki)]:rounded [&_pre:not(.shiki)]:bg-muted [&_pre:not(.shiki)]:p-2 [&_pre:not(.shiki)_code]:bg-transparent [&_pre:not(.shiki)_code]:p-0 [&_table]:my-2 [&_table]:border-collapse [&_table]:text-xs [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2"
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, title, children }) =>
            href ? (
              <a href={href} title={title} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          // Never create an image/network element or forward its resource props.
          img: ({ alt, title }) => (
            <span className="text-muted-foreground">[Image not loaded{alt || title ? `: ${alt || title}` : ''}]</span>
          ),
          pre: (props) => <FencedCodeBlock dark={dark} {...props} />,
        }}
      >
        {value}
      </Markdown>
    </div>
  );
}
