// Zero-dependency XML validation + pretty-printing on top of the browser's
// DOMParser. Only used by the (client-rendered) value dialog.

function parseXml(input: string): { doc: Document; error: string | null } {
  if (typeof DOMParser === 'undefined') return { doc: null as never, error: null };
  const doc = new DOMParser().parseFromString(input, 'application/xml');
  // getElementsByTagName matches the local name regardless of namespace —
  // querySelector('parsererror') is unreliable in XML documents.
  const errors = doc.getElementsByTagName('parsererror');
  if (errors.length === 0) return { doc, error: null };
  const msg = (errors[0].textContent ?? 'Invalid XML').split('\n')[0].trim();
  return { doc, error: msg.slice(0, 200) || 'Invalid XML' };
}

/** One-line error message, or null when the input is well-formed XML. */
export function validateXml(input: string): string | null {
  try {
    return parseXml(input).error;
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid XML';
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Pretty-print well-formed XML with 2-space indentation. Empty elements
 * collapse to self-closing tags, single-text elements stay inline, and
 * whitespace-only text between elements is dropped. Like the JSON/YAML
 * formatters this normalizes whitespace — not for whitespace-sensitive
 * mixed content. Throws on malformed input.
 */
export function prettyXml(input: string, indentWidth = 2): string {
  const { doc, error } = parseXml(input);
  if (typeof DOMParser === 'undefined') throw new Error('XML formatting is not available in this environment');
  if (error) throw new Error(error);

  const pad = (depth: number) => ' '.repeat(depth * indentWidth);
  const out: string[] = [];

  // The XML declaration isn't exposed as a DOM node — carry it over verbatim.
  const decl = input.match(/^\s*(<\?xml[^?]*\?>)/);
  if (decl) out.push(decl[1]);
  if (doc.doctype && typeof XMLSerializer !== 'undefined') {
    out.push(new XMLSerializer().serializeToString(doc.doctype));
  }

  const significant = (node: Node): boolean =>
    node.nodeType !== Node.TEXT_NODE || (node.textContent ?? '').trim() !== '';

  const serializeElement = (el: Element, depth: number): void => {
    const attrs = [...el.attributes].map((a) => ` ${a.name}="${escapeXml(a.value)}"`).join('');
    const kids = [...el.childNodes].filter(significant);
    if (kids.length === 0) {
      out.push(`${pad(depth)}<${el.tagName}${attrs}/>`);
      return;
    }
    if (kids.length === 1 && kids[0].nodeType === Node.TEXT_NODE) {
      out.push(`${pad(depth)}<${el.tagName}${attrs}>${escapeXml(kids[0].textContent ?? '')}</${el.tagName}>`);
      return;
    }
    out.push(`${pad(depth)}<${el.tagName}${attrs}>`);
    for (const kid of kids) serializeChild(kid, depth + 1);
    out.push(`${pad(depth)}</${el.tagName}>`);
  };

  const serializeChild = (node: Node, depth: number): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      serializeElement(node as Element, depth);
    } else if (node.nodeType === Node.TEXT_NODE) {
      for (const line of (node.textContent ?? '').split('\n')) {
        const trimmed = line.trim();
        if (trimmed !== '') out.push(`${pad(depth)}${escapeXml(trimmed)}`);
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      out.push(`${pad(depth)}<!--${node.textContent ?? ''}-->`);
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
      out.push(`${pad(depth)}<![CDATA[${node.textContent ?? ''}]]>`);
    } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = node as ProcessingInstruction;
      out.push(`${pad(depth)}<?${pi.target} ${pi.data}?>`);
    }
  };

  for (const node of [...doc.childNodes]) {
    if (node === doc.doctype) continue;
    serializeChild(node, 0);
  }
  return out.join('\n') + '\n';
}
