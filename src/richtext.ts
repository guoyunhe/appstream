import type { Localized, RichText } from './types';
import {
  attribute,
  elementChildren,
  elementLocale,
  elementName,
  isText,
  nodeChildren,
  textContent,
  type XmlElement,
  type XmlNode,
} from './xml';

/**
 * Elements kept in rich text, with the attributes allowed on each one. The set covers the markup
 * AppStream allows in descriptions (`p`, `heading`, `ol`, `ul`, `li`, `em`, `code`) plus the
 * HTML-ish elements that older metadata uses.
 */
const allowedElements: Record<string, string[]> = {
  a: ['href', 'title'],
  b: [],
  blockquote: [],
  br: [],
  code: [],
  div: [],
  em: [],
  heading: [],
  i: [],
  img: ['alt', 'height', 'src', 'width'],
  li: [],
  ol: [],
  p: [],
  pre: [],
  span: [],
  strong: [],
  ul: [],
};

/** Elements dropped together with their content. */
const droppedElements = new Set([
  'embed',
  'head',
  'iframe',
  'math',
  'noscript',
  'object',
  'script',
  'style',
  'svg',
  'template',
  'title',
]);

/** Elements that never take a closing tag. */
const voidElements = new Set(['br', 'img']);

const whitespace = /\s+/g;
const webUrl = /^https?:\/\//i;

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;');
}

/** Attributes of an element, limited to the allowed names and to web URLs. */
function serializeAttributes(node: XmlElement, allowed: string[]): string {
  let result = '';
  for (const name of allowed) {
    const value = attribute(node, name);
    if (value === undefined) continue;
    if ((name === 'href' || name === 'src') && !webUrl.test(value)) continue;
    result += ` ${name}="${escapeAttribute(value)}"`;
  }
  return result;
}

function serialize(node: XmlNode, preserveWhitespace: boolean): string {
  if (isText(node)) {
    const text = node['#text'];
    return escapeText(preserveWhitespace ? text : text.replace(whitespace, ' '));
  }

  const tag = elementName(node).toLowerCase();
  const allowed = allowedElements[tag];
  const keepWhitespace = preserveWhitespace || tag === 'pre';
  const inner = nodeChildren(node)
    .map((child) => serialize(child, keepWhitespace))
    .join('');

  if (!allowed) {
    // Unknown wrappers are dropped, but the text they contain is kept.
    return droppedElements.has(tag) ? '' : inner;
  }

  const attributes = serializeAttributes(node, allowed);
  if (voidElements.has(tag)) return `<${tag}${attributes}/>`;
  return `<${tag}${attributes}>${keepWhitespace ? inner : inner.trim()}</${tag}>`;
}

/**
 * Reads a rich text element, such as a description, into markup per locale.
 *
 * MetaInfo files translate such an element paragraph by paragraph, so each block carries its own
 * `xml:lang`; catalog files translate it as a whole, so the language sits on the element itself.
 * Both shapes end up in the same map. Blocks of one locale are joined by a newline.
 */
export function parseRichText(element: XmlElement | undefined): Localized<RichText> | undefined {
  if (!element) return undefined;

  const fallback = elementLocale(element);
  const blocks = elementChildren(element);

  if (blocks.length === 0) {
    // A description may hold plain text instead of markup.
    const text = textContent(element).trim();
    return text === '' ? undefined : { [fallback]: escapeText(text) };
  }

  const grouped: Localized<string[]> = {};
  for (const block of blocks) {
    const markup = serialize(block, false);
    if (markup === '') continue;
    const locale = elementLocale(block, fallback);
    (grouped[locale] ??= []).push(markup);
  }

  const result: Localized<RichText> = {};
  for (const [locale, markup] of Object.entries(grouped)) result[locale] = markup.join('\n');
  return Object.keys(result).length === 0 ? undefined : result;
}
