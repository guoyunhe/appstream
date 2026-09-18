import type { Localized, RichText } from './types';
import {
  attribute,
  childElements,
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
 * HTML-ish elements that older metadata uses, such as the headings `h1` to `h6`.
 */
const allowedElements: Record<string, string[]> = {
  a: ['href', 'title'],
  b: [],
  blockquote: [],
  br: [],
  code: [],
  div: [],
  em: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
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

/** Elements that hold a list of items. */
const listElements = new Set(['ol', 'ul']);

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
 * Splits a list into the locales of its items.
 *
 * MetaInfo files translate a list item by item, so a single `<ul/>` may hold the items of many
 * languages. Each locale receives a list that holds only its own items, which keeps translations
 * from leaking into the other languages. Items without a language fall back to the language of the
 * list itself, as catalog files translate the whole list.
 *
 * Returns `false` when the element is not a list that holds items, so that the caller serializes it
 * as a whole.
 */
function groupListItems(
  block: XmlElement,
  fallback: string,
  grouped: Localized<string[]>,
): boolean {
  const tag = elementName(block).toLowerCase();
  if (!listElements.has(tag)) return false;

  const listLocale = elementLocale(block, fallback);
  const items: Localized<string[]> = {};
  for (const item of childElements(block, 'li')) {
    const markup = serialize(item, false);
    if (markup === '') continue;
    (items[elementLocale(item, listLocale)] ??= []).push(markup);
  }

  const locales = Object.keys(items);
  if (locales.length === 0) return false;

  for (const locale of locales) {
    const markup = `<${tag}>${items[locale].join(' ')}</${tag}>`;
    (grouped[locale] ??= []).push(markup);
  }
  return true;
}

/**
 * Reads a rich text element, such as a description, into markup per locale.
 *
 * MetaInfo files translate such an element paragraph by paragraph, so each block carries its own
 * `xml:lang`; list items are translated individually as well. Catalog files translate it as a
 * whole, so the language sits on the element itself. Every shape ends up in the same map. Blocks of
 * one locale are joined by a newline.
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
    if (groupListItems(block, fallback, grouped)) continue;
    const markup = serialize(block, false);
    if (markup === '') continue;
    const locale = elementLocale(block, fallback);
    (grouped[locale] ??= []).push(markup);
  }

  const result: Localized<RichText> = {};
  for (const [locale, markup] of Object.entries(grouped)) result[locale] = markup.join('\n');
  return Object.keys(result).length === 0 ? undefined : result;
}

/**
 * Reads every element of one name that holds rich text, such as the descriptions of a component,
 * into one map of markup per locale.
 *
 * A description translated as a whole repeats the element once per language, next to the
 * untranslated one, so a component carries several `<description/>` elements whose languages only
 * differ in `xml:lang`. Reading the first element alone would report that one language and lose
 * every other translation, so all of them are read and their markup is merged per locale, in
 * document order. An element that repeats a language is appended to it.
 */
export function parseRichTexts(elements: XmlElement[]): Localized<RichText> | undefined {
  const merged: Localized<RichText> = {};
  for (const element of elements) {
    const texts = parseRichText(element);
    if (!texts) continue;
    for (const [locale, markup] of Object.entries(texts)) {
      merged[locale] = merged[locale] === undefined ? markup : `${merged[locale]}\n${markup}`;
    }
  }
  return Object.keys(merged).length === 0 ? undefined : merged;
}
