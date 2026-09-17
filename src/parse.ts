import { parseRichText } from './richtext';
import {
  type Agreement,
  type AgreementType,
  type Artifact,
  type ArtifactType,
  type Branding,
  type Bundle,
  type BundleType,
  type Catalog,
  type ChecksumType,
  type ColorScheme,
  type ColorType,
  type CompareOperator,
  type Component,
  type ComponentType,
  type ContentIntensity,
  type ContentRating,
  type ContentRatingType,
  type Developer,
  type DisplaySide,
  type FirmwareType,
  type Icon,
  type IconType,
  type ImageType,
  type Issue,
  type IssueType,
  type Language,
  type Launchable,
  type LaunchableType,
  type Localized,
  type MergeType,
  type Provides,
  type ReferenceRegistry,
  type References,
  type Relation,
  type RelationItemType,
  type Release,
  type Releases,
  type ReleasesType,
  type ReleaseType,
  type ReleaseUrgency,
  type Screenshot,
  type ScreenshotType,
  type Size,
  type SizeType,
  type Suggests,
  type SuggestsType,
  type Tag,
  type Translation,
  type TranslationType,
  type Url,
  type UrlType,
  type VideoCodec,
  type VideoContainer,
} from './types';
import {
  attribute,
  childElement,
  childElements,
  childText,
  childTexts,
  elementChildren,
  elementName,
  elementLocale,
  firstElement,
  localeTag,
  numberAttribute,
  parseXml,
  rootElement,
  textContent,
  type XmlElement,
} from './xml';

/** Removes keys that hold no value, so absent XML elements do not show up as `undefined`. */
function compact<T extends object>(value: T): T {
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (record[key] === undefined) delete record[key];
  }
  return value;
}

/** Localized values of repeated elements, such as the `<name/>` of a component. */
function localizedText(parent: XmlElement, ...names: string[]): Localized<string> {
  const result: Localized<string> = {};
  for (const element of childElements(parent, ...names)) {
    const value = textContent(element).trim();
    if (value !== '') result[elementLocale(element)] = value;
  }
  return result;
}

function nonEmpty<T>(value: Localized<T>): Localized<T> | undefined {
  return Object.keys(value).length === 0 ? undefined : value;
}

/**
 * Localized values of repeated container elements. Keywords carry their own language in MetaInfo
 * files, while catalog data translates the whole container.
 */
function localizedList(
  parent: XmlElement,
  container: string,
  item: string,
): Localized<string[]> | undefined {
  const groups = childElements(parent, container);
  if (groups.length === 0) return undefined;

  const result: Localized<string[]> = {};
  for (const group of groups) {
    const fallback = elementLocale(group);
    for (const element of childElements(group, item)) {
      const value = textContent(element).trim();
      if (value === '') continue;
      const translated =
        attribute(element, 'xml:lang') !== undefined || attribute(element, 'lang') !== undefined;
      (result[translated ? elementLocale(element) : fallback] ??= []).push(value);
    }
  }

  return nonEmpty(result);
}

/** Category codes of a component, including the deprecated `appcategory` spelling. */
function parseCategories(element: XmlElement): string[] {
  const codes: string[] = [];
  for (const container of childElements(element, 'categories', 'appcategories')) {
    for (const node of childElements(container, 'category', 'appcategory')) {
      const value = textContent(node).trim();
      if (value !== '') codes.push(value);
    }
  }
  return [...new Set(codes)];
}

function parseUrls(element: XmlElement): Url[] {
  return childElements(element, 'url')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as UrlType | undefined,
        url: textContent(node).trim(),
      }),
    )
    .filter((url) => url.url !== '');
}

function parseIcons(element: XmlElement): Icon[] {
  return childElements(element, 'icon')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as IconType | undefined,
        value: textContent(node).trim(),
        width: numberAttribute(node, 'width'),
        height: numberAttribute(node, 'height'),
        scale: numberAttribute(node, 'scale'),
      }),
    )
    .filter((icon) => icon.value !== '');
}

function parseLaunchables(element: XmlElement): Launchable[] {
  return childElements(element, 'launchable')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as LaunchableType | undefined,
        value: textContent(node).trim(),
      }),
    )
    .filter((launchable) => launchable.value !== '');
}

function parseProvides(element: XmlElement): Provides | undefined {
  const container = childElement(element, 'provides');
  if (!container) return undefined;

  return {
    ids: childTexts(container, 'id'),
    binaries: childTexts(container, 'binary'),
    libraries: childTexts(container, 'library'),
    mediatypes: childTexts(container, 'mediatype'),
    fonts: childTexts(container, 'font'),
    modaliases: childTexts(container, 'modalias'),
    firmware: childElements(container, 'firmware').map((node) =>
      compact({
        type: attribute(node, 'type') as FirmwareType | undefined,
        value: textContent(node).trim(),
      }),
    ),
    python3: childTexts(container, 'python3'),
    dbus: childElements(container, 'dbus').map((node) => {
      const type = attribute(node, 'type');
      return compact({
        type: type === 'session' ? 'user' : (type as 'user' | 'system' | undefined),
        name: textContent(node).trim(),
      });
    }),
  };
}

function parseRelations(element: XmlElement, name: string): Relation[] | undefined {
  const container = childElement(element, name);
  if (!container) return undefined;

  return elementChildren(container).map((node) =>
    compact({
      type: elementName(node) as RelationItemType,
      value: textContent(node).trim(),
      version: attribute(node, 'version'),
      compare: attribute(node, 'compare') as CompareOperator | undefined,
      side: attribute(node, 'side') as DisplaySide | undefined,
      bandwidth: numberAttribute(node, 'bandwidth_mbitps'),
    }),
  );
}

function parseScreenshot(element: XmlElement): Screenshot {
  return compact({
    type: attribute(element, 'type') as ScreenshotType | undefined,
    environment: attribute(element, 'environment'),
    caption: nonEmpty(localizedText(element, 'caption')),
    images: childElements(element, 'image')
      .map((node) =>
        compact({
          url: textContent(node).trim(),
          type: attribute(node, 'type') as ImageType | undefined,
          width: numberAttribute(node, 'width'),
          height: numberAttribute(node, 'height'),
          scale: numberAttribute(node, 'scale'),
          locale: localeTag(node),
        }),
      )
      .filter((image) => image.url !== ''),
    videos: childElements(element, 'video')
      .map((node) =>
        compact({
          url: textContent(node).trim(),
          container: attribute(node, 'container') as VideoContainer | undefined,
          codec: attribute(node, 'codec') as VideoCodec | undefined,
          width: numberAttribute(node, 'width'),
          height: numberAttribute(node, 'height'),
          locale: localeTag(node),
        }),
      )
      .filter((video) => video.url !== ''),
  });
}

/**
 * Screenshots of a component. Legacy metadata nested them in the description, and both places are
 * read; screenshots showing the same media are merged.
 */
function parseScreenshots(element: XmlElement): Screenshot[] {
  const nodes = [
    ...childElements(childElement(element, 'screenshots'), 'screenshot'),
    ...childElements(childElement(element, 'description'), 'screenshot'),
  ];

  const screenshots: Screenshot[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const screenshot = parseScreenshot(node);
    const urls = [...screenshot.images, ...screenshot.videos].map((media) => media.url).join(' ');
    if (urls !== '' && seen.has(urls)) continue;
    if (urls !== '') seen.add(urls);
    screenshots.push(screenshot);
  }
  return screenshots;
}

function parseSize(element: XmlElement): Size {
  return compact({
    type: attribute(element, 'type') as SizeType | undefined,
    value: Number(textContent(element).trim()),
  });
}

function parseTag(element: XmlElement): Tag {
  return { namespace: attribute(element, 'namespace') ?? '', value: textContent(element).trim() };
}

function parseTags(element: XmlElement): Tag[] {
  return childElements(childElement(element, 'tags'), 'tag').map(parseTag);
}

function parseIssue(element: XmlElement): Issue {
  return compact({
    type: (attribute(element, 'type') as IssueType | undefined) ?? 'generic',
    value: textContent(element).trim(),
    url: attribute(element, 'url'),
  });
}

function parseArtifact(element: XmlElement): Artifact {
  return compact({
    type: attribute(element, 'type') as ArtifactType | undefined,
    platform: attribute(element, 'platform'),
    bundle: attribute(element, 'bundle') as BundleType | undefined,
    locations: childTexts(element, 'location'),
    checksums: childElements(element, 'checksum').map((node) =>
      compact({
        type: attribute(node, 'type') as ChecksumType | undefined,
        value: textContent(node).trim(),
      }),
    ),
    sizes: childElements(element, 'size').map(parseSize),
    filename: childText(element, 'filename'),
  });
}

function parseRelease(element: XmlElement): Release {
  return compact({
    version: attribute(element, 'version') ?? '',
    date: attribute(element, 'date'),
    timestamp: numberAttribute(element, 'timestamp'),
    dateEol: attribute(element, 'date_eol'),
    type: (attribute(element, 'type') as ReleaseType | undefined) ?? 'stable',
    urgency: (attribute(element, 'urgency') as ReleaseUrgency | undefined) ?? 'medium',
    description: parseRichText(childElement(element, 'description')),
    url: childText(element, 'url'),
    issues: childElements(childElement(element, 'issues'), 'issue').map(parseIssue),
    artifacts: childElements(childElement(element, 'artifacts'), 'artifact').map(parseArtifact),
    // Older catalogs declare the sizes directly on the release.
    sizes: childElements(element, 'size').map(parseSize),
    tags: parseTags(element),
  });
}

/**
 * Release information of a component, taken from the `<releases/>` container or from the deprecated
 * form that lists `<release/>` elements directly.
 */
function parseReleases(element: XmlElement): Releases | undefined {
  const container = childElement(element, 'releases');
  const nodes = container ? childElements(container, 'release') : childElements(element, 'release');
  if (!container && nodes.length === 0) return undefined;

  return compact({
    type: (attribute(container, 'type') as ReleasesType | undefined) ?? 'embedded',
    url: attribute(container, 'url'),
    items: nodes.map(parseRelease),
  });
}

function parseTranslations(element: XmlElement): Translation[] {
  return childElements(element, 'translation')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as TranslationType | undefined,
        value: textContent(node).trim(),
        sourceLocale: attribute(node, 'source_locale'),
      }),
    )
    .filter((translation) => translation.value !== '');
}

function parseSuggests(element: XmlElement): Suggests | undefined {
  const container = childElement(element, 'suggests');
  if (!container) return undefined;

  return {
    type: (attribute(container, 'type') as SuggestsType | undefined) ?? 'upstream',
    ids: childTexts(container, 'id'),
  };
}

function parseContentRating(element: XmlElement): ContentRating | undefined {
  const container = childElement(element, 'content_rating');
  if (!container) return undefined;

  return compact({
    type: attribute(container, 'type') as ContentRatingType | undefined,
    attributes: childElements(container, 'content_attribute')
      .map((node) =>
        compact({
          id: attribute(node, 'id') ?? '',
          value: (textContent(node).trim() || 'none') as ContentIntensity,
        }),
      )
      .filter((contentAttribute) => contentAttribute.id !== ''),
  });
}

function parseAgreements(element: XmlElement): Agreement[] {
  return childElements(element, 'agreement').map((node) => ({
    type: (attribute(node, 'type') as AgreementType | undefined) ?? 'generic',
    versionId: attribute(node, 'version_id') ?? '',
    sections: childElements(node, 'agreement_section').map((section) =>
      compact({
        id: attribute(section, 'id') ?? '',
        name: localizedText(section, 'name'),
        description: parseRichText(childElement(section, 'description')),
      }),
    ),
  }));
}

function parseDeveloper(element: XmlElement): Developer | undefined {
  const container = childElement(element, 'developer');
  if (!container) return undefined;

  return compact({
    id: attribute(container, 'id'),
    name: localizedText(container, 'name'),
  });
}

function parseBranding(element: XmlElement): Branding | undefined {
  const container = childElement(element, 'branding');
  if (!container) return undefined;

  const colors = childElements(container, 'color')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as ColorType | undefined,
        scheme: attribute(node, 'scheme_preference') as ColorScheme | undefined,
        value: textContent(node).trim(),
      }),
    )
    .filter((color) => color.value !== '');

  return { colors };
}

function parseReferences(element: XmlElement): References | undefined {
  const container = childElement(element, 'references');
  if (!container) return undefined;

  return {
    dois: childTexts(container, 'doi'),
    citationCff: childTexts(container, 'citation_cff'),
    registries: childElements(container, 'registry')
      .map((node): ReferenceRegistry =>
        compact({
          name: attribute(node, 'name') ?? '',
          value: textContent(node).trim(),
        }),
      )
      .filter((registry) => registry.value !== ''),
  };
}

function parseCustom(element: XmlElement): Record<string, string> | undefined {
  const container = childElement(element, 'custom');
  if (!container) return undefined;

  const values: Record<string, string> = {};
  for (const node of childElements(container, 'value')) {
    const key = attribute(node, 'key');
    if (key === undefined) continue;
    values[key] = textContent(node).trim();
  }
  return Object.keys(values).length === 0 ? undefined : values;
}

function parseBundles(element: XmlElement): Bundle[] {
  return childElements(element, 'bundle')
    .map((node) =>
      compact({
        type: attribute(node, 'type') as BundleType | undefined,
        value: textContent(node).trim(),
      }),
    )
    .filter((bundle) => bundle.value !== '');
}

function parseLanguages(element: XmlElement): Language[] {
  return childElements(childElement(element, 'languages'), 'lang')
    .map((node) =>
      compact({
        locale: textContent(node).trim(),
        percentage: numberAttribute(node, 'percentage'),
      }),
    )
    .filter((language) => language.locale !== '');
}

/**
 * Reads the children of a component element into a component object. Returns `undefined` for
 * elements without an ID, which cannot identify a component.
 */
export function parseComponent(element: XmlElement): Component | undefined {
  const id = childText(element, 'id');
  if (!id) return undefined;

  return compact({
    type: (attribute(element, 'type') as ComponentType | undefined) ?? 'generic',
    id,
    dateEol: attribute(element, 'date_eol'),
    priority: numberAttribute(element, 'priority'),
    merge: attribute(element, 'merge') as MergeType | undefined,
    pkgNames: childTexts(element, 'pkgname'),
    sourcePkgName: childText(element, 'source_pkgname'),
    name: localizedText(element, 'name'),
    summary: localizedText(element, 'summary'),
    description: parseRichText(childElement(element, 'description')),
    metadataLicense: childText(element, 'metadata_license'),
    projectLicense: childText(element, 'project_license'),
    projectGroup: childText(element, 'project_group'),
    developer: parseDeveloper(element),
    developerName: nonEmpty(localizedText(element, 'developer_name')),
    nameVariantSuffix: nonEmpty(localizedText(element, 'name_variant_suffix')),
    categories: parseCategories(element),
    keywords: localizedList(element, 'keywords', 'keyword'),
    urls: parseUrls(element),
    icons: parseIcons(element),
    launchables: parseLaunchables(element),
    provides: parseProvides(element),
    requires: parseRelations(element, 'requires'),
    recommends: parseRelations(element, 'recommends'),
    supports: parseRelations(element, 'supports'),
    screenshots: parseScreenshots(element),
    releases: parseReleases(element),
    translation: parseTranslations(element),
    suggests: parseSuggests(element),
    contentRating: parseContentRating(element),
    agreements: parseAgreements(element),
    updateContact: childText(element, 'update_contact'),
    branding: parseBranding(element),
    tags: parseTags(element),
    references: parseReferences(element),
    custom: parseCustom(element),
    mimetypes: childTexts(childElement(element, 'mimetypes'), 'mimetype'),
    compulsoryForDesktop: childTexts(element, 'compulsory_for_desktop'),
    extends: childTexts(element, 'extends'),
    bundles: parseBundles(element),
    languages: parseLanguages(element),
  });
}

/** Matches one component element of a catalog. */
const componentElement = /<component\b(?:[^>]*)>[\s\S]*?<\/component>/g;

/**
 * Parses an AppStream document into a catalog.
 *
 * The document may be a catalog holding many components, a single MetaInfo component file, or a
 * release file. Catalogs are split into their components before they are parsed, so a large catalog
 * is never turned into one big object.
 */
export function parseAppStream(xml: string): Catalog {
  const components: Component[] = [];
  if (xml) {
    for (const match of xml.matchAll(componentElement)) {
      const element = firstElement(parseXml(match[0]));
      if (!element) continue;
      const component = parseComponent(element);
      if (component) components.push(component);
    }
  }

  const catalog: Catalog = { components };
  const root = xml ? rootElement(xml) : undefined;
  if (root && elementName(root) === 'components') {
    catalog.version = attribute(root, 'version');
    catalog.origin = attribute(root, 'origin');
    catalog.mediaBaseurl = attribute(root, 'media_baseurl');
    catalog.architecture = attribute(root, 'architecture');
  }
  return compact(catalog);
}

/**
 * Parses a single component, as found in a MetaInfo file, into a component object. Catalog
 * documents return their first component instead.
 */
export function parseAppStreamComponent(xml: string): Component | undefined {
  if (!xml) return undefined;
  const element = firstElement(parseXml(xml));
  if (!element) return undefined;

  const name = elementName(element);
  if (name === 'component' || name === 'application') return parseComponent(element);
  if (name === 'components') {
    const component = childElement(element, 'component', 'application');
    return component ? parseComponent(component) : undefined;
  }
  return undefined;
}
