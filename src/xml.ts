import { XMLParser } from 'fast-xml-parser';

import { DEFAULT_LOCALE } from './types';

/**
 * The parser runs in "preserve order" mode, which keeps every node and the order between text and
 * child elements. Descriptions mix text and inline markup, so order matters and the default object
 * mode (which merges text into a single `#text` value) cannot represent them.
 */
const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  preserveOrder: true,
  textNodeName: '#text',
  // Whitespace is kept so that inline markup does not lose the spaces around
  // it; scalar values are trimmed when they are read.
  trimValues: false,
});

/** Attribute name to value, with the `@_` prefix of the parser still applied. */
export type Attributes = Record<string, string>;

/** A text node of the document. */
export interface XmlText {
  '#text': string;
}

/** An element of the document. Child nodes are stored under the element name. */
export interface XmlElement {
  ':@'?: Attributes;
  [name: string]: unknown;
}

/** A node of the document: either an element or a text node. */
export type XmlNode = XmlText | XmlElement;

const attributeGroup = ':@';
const attributePrefix = '@_';
const nonElementName = /^[#?]/;
const surroundingWhitespace = /^\s*(?:<\?[\s\S]*?\?>|<!--[\s\S]*?-->)*\s*/;
const rootTag = /^<([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>/;

/** Parses an XML document into its node list. */
export function parseXml(xml: string): XmlNode[] {
  return parser.parse(xml) as XmlNode[];
}

/** Whether a node is a text node instead of an element. */
export function isText(node: XmlNode): node is XmlText {
  return '#text' in node;
}

/** Name of an element, or an empty string when the node carries no element name. */
export function elementName(node: XmlElement): string {
  for (const key of Object.keys(node)) {
    if (key !== attributeGroup) return key;
  }
  return '';
}

/** Direct child nodes of a node, in document order. */
export function nodeChildren(node: XmlNode | undefined): XmlNode[] {
  if (!node || isText(node)) return [];
  const value = node[elementName(node)];
  return Array.isArray(value) ? (value as XmlNode[]) : [];
}

/** Direct child elements of a node. */
export function elementChildren(node: XmlNode | undefined): XmlElement[] {
  return nodeChildren(node).filter((child): child is XmlElement => !isText(child));
}

/** Top level elements of a parsed document, skipping the XML declaration and comments. */
export function elements(nodes: XmlNode[]): XmlElement[] {
  return nodes.filter(
    (node): node is XmlElement => !isText(node) && !nonElementName.test(elementName(node)),
  );
}

/** First element of a parsed document. */
export function firstElement(nodes: XmlNode[]): XmlElement | undefined {
  return elements(nodes)[0];
}

/** Direct child elements with one of the given names. */
export function childElements(node: XmlNode | undefined, ...names: string[]): XmlElement[] {
  const wanted = new Set(names);
  return elementChildren(node).filter((child) => wanted.has(elementName(child)));
}

/** First direct child element with one of the given names. */
export function childElement(
  node: XmlNode | undefined,
  ...names: string[]
): XmlElement | undefined {
  return childElements(node, ...names)[0];
}

/** Trimmed text of the first child element with one of the given names. */
export function childText(node: XmlNode | undefined, ...names: string[]): string | undefined {
  const child = childElement(node, ...names);
  const value = child ? textContent(child).trim() : '';
  return value === '' ? undefined : value;
}

/** Trimmed texts of every child element with one of the given names. */
export function childTexts(node: XmlNode | undefined, ...names: string[]): string[] {
  return childElements(node, ...names)
    .map((child) => textContent(child).trim())
    .filter((value) => value !== '');
}

/** Value of an attribute, or `undefined` when it is absent or empty. */
export function attribute(node: XmlElement | undefined, name: string): string | undefined {
  const value = node?.[attributeGroup]?.[`${attributePrefix}${name}`];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Numeric value of an attribute, or `undefined` when it is absent or not a number. */
export function numberAttribute(node: XmlElement | undefined, name: string): number | undefined {
  const value = attribute(node, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Text of a node and all of its descendants. */
export function textContent(node: XmlNode | undefined): string {
  if (!node) return '';
  if (isText(node)) return node['#text'];
  let value = '';
  for (const child of nodeChildren(node)) value += textContent(child);
  return value;
}

/**
 * Locale tag of an element, or `undefined` when it carries no language. AppStream writes the tag as
 * `xml:lang`; a plain `lang` attribute is accepted as well.
 *
 * Tags in POSIX form, which some metadata still uses, are rewritten to the BCP 47 form, so that
 * `zh_CN` and `zh-CN` name the same locale. The case of the tag is kept as it was written.
 */
export function localeTag(node: XmlElement): string | undefined {
  const tag = attribute(node, 'xml:lang') ?? attribute(node, 'lang');
  return tag?.replaceAll('_', '-');
}

/**
 * Locale tag of a translatable element. Elements without a language hold the untranslated source
 * strings, which are keyed by `fallback`.
 */
export function elementLocale(node: XmlElement, fallback = DEFAULT_LOCALE): string {
  return localeTag(node) ?? fallback;
}

/**
 * Attributes of the root element of a document. Only the opening tag is parsed, which keeps the
 * attributes of large catalogs cheap to read.
 */
export function rootElement(xml: string): XmlElement | undefined {
  const content = xml.replace(surroundingWhitespace, '');
  const match = rootTag.exec(content);
  if (!match) return undefined;
  const [, name, attributes] = match;
  return firstElement(parseXml(`<${name}${attributes}/>`));
}
