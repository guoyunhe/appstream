/**
 * AppStream metadata types.
 *
 * The definitions follow the AppStream specification for upstream metadata (metainfo files, Chapter 2)
 * and the extra elements found in catalog metadata (Chapter 3).
 * https://www.freedesktop.org/software/appstream/docs/
 *
 * Every value that AppStream marks as translatable is parsed into a {@link Localized} map, keyed by
 * the `xml:lang` value of the element. Values without a translation are keyed by
 * {@link DEFAULT_LOCALE}.
 */

/** Locale tag, such as `en`, `de` or `pt_BR`. */
export type Locale = string;

/** Values indexed by {@link Locale}. Untranslated values use {@link DEFAULT_LOCALE}. */
export type Localized<T> = Record<Locale, T>;

/**
 * Locale that holds the untranslated (source) strings. AppStream leaves the `xml:lang` attribute
 * off untranslated values and DEP-11 names them `C`; both are reported under this key.
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Content of a description, kept as the markup subset AppStream allows (`p`, `heading`, `ol`, `ul`,
 * `li`, `em` and `code`). Disallowed elements are dropped, unknown wrappers are unwrapped so their
 * text survives, and links and images may only use `http`/`https` URLs.
 */
export type RichText = string;

/** Type of a component, taken from the `type` attribute of the component element. */
export type ComponentType =
  | 'generic'
  | 'desktop-application'
  | 'desktop'
  | 'console-application'
  | 'web-application'
  | 'addon'
  | 'font'
  | 'codec'
  | 'inputmethod'
  | 'firmware'
  | 'driver'
  | 'localization'
  | 'service'
  | 'repository'
  | 'operating-system'
  | 'icon-theme'
  | 'runtime';

/** How a repository metainfo document merges with other metadata. */
export type MergeType = 'append' | 'replace' | 'remove-component';

/** Supported URL types of the `<url/>` element. */
export type UrlType =
  | 'homepage'
  | 'bugtracker'
  | 'faq'
  | 'help'
  | 'donation'
  | 'translate'
  | 'contact'
  | 'vcs-browser'
  | 'contribute';

/** Where an icon comes from, taken from the `type` attribute of `<icon/>`. */
export type IconType = 'stock' | 'cached' | 'local' | 'remote';

/** How a component can be launched, taken from the `type` of `<launchable/>`. */
export type LaunchableType = 'desktop-id' | 'service' | 'cockpit-manifest' | 'url';

/** Scope of a provided D-Bus service. */
export type DbusType = 'user' | 'system';

/** Delivery method of provided firmware. */
export type FirmwareType = 'flashed' | 'runtime';

/** Child elements of a `<requires/>`, `<recommends/>` or `<supports/>` block. */
export type RelationItemType =
  | 'id'
  | 'modalias'
  | 'kernel'
  | 'memory'
  | 'firmware'
  | 'hardware'
  | 'control'
  | 'display_length'
  | 'internet';

/** Version comparison operators used by relation items. Defaults to `ge`. */
export type CompareOperator = 'eq' | 'ne' | 'lt' | 'gt' | 'le' | 'ge';

/** Ways a component can be controlled by the user. */
export type ControlType =
  | 'pointing'
  | 'keyboard'
  | 'console'
  | 'tablet'
  | 'touch'
  | 'gamepad'
  | 'tv-remote'
  | 'voice'
  | 'vision';

/** Internet connectivity expected by a component. */
export type InternetType = 'always' | 'offline-only' | 'first-run';

/** Side of the display a `display_length` relation applies to. Defaults to `shortest`. */
export type DisplaySide = 'shortest' | 'longest';

/** Whether a screenshot is the primary one. */
export type ScreenshotType = 'default' | 'extra';

/** Type of a screenshot image. */
export type ImageType = 'source' | 'thumbnail';

/** Video container formats allowed for screenshots. */
export type VideoContainer = 'webm' | 'matroska';

/** Video codecs allowed for screenshots. */
export type VideoCodec = 'av1' | 'vp9';

/** Whether release data is inlined in the component or kept in a separate file. */
export type ReleasesType = 'embedded' | 'external';

/** Maturity of a release. Defaults to `stable`. */
export type ReleaseType = 'stable' | 'development' | 'snapshot';

/** How urgently a release should be installed. Defaults to `medium`. */
export type ReleaseUrgency = 'low' | 'medium' | 'high' | 'critical';

/** Kind of an issue resolved by a release. Defaults to `generic`. */
export type IssueType = 'generic' | 'cve' | 'gcve';

/** Hash algorithms a release artifact checksum may use. */
export type ChecksumType = 'sha1' | 'sha256' | 'sha512' | 'blake2b' | 'blake3';

/** Sizes an artifact may report. */
export type SizeType = 'download' | 'installed';

/** Kind of a downloadable release artifact. */
export type ArtifactType = 'binary' | 'source';

/** Bundling systems a component may be distributed as. */
export type BundleType =
  | 'package'
  | 'limba'
  | 'flatpak'
  | 'appimage'
  | 'snap'
  | 'tarball'
  | 'cabinet'
  | 'linglong'
  | 'sysupdate';

/** Translation system of a component. */
export type TranslationType = 'gettext' | 'qt';

/** Origin of a software suggestion. Defaults to `upstream`. */
export type SuggestsType = 'upstream' | 'heuristic';

/** Rating system of a content rating. */
export type ContentRatingType = 'oars-1.0' | 'oars-1.1';

/** Intensity of a rated content attribute. */
export type ContentIntensity = 'none' | 'mild' | 'moderate' | 'intense';

/** Kind of an agreement a user has to accept. Defaults to `generic`. */
export type AgreementType = 'generic' | 'eula' | 'privacy';

/** Purpose of a branding color. */
export type ColorType = 'primary';

/** Color scheme a branding color is preferred for. */
export type ColorScheme = 'light' | 'dark';

/** A URL of the component. */
export interface Url {
  /** Omitted when the metadata declares no `type`; such URLs are not shown by software centers. */
  type?: UrlType;
  url: string;
}

/** An icon of the component. */
export interface Icon {
  /** Defaults to `stock` when the metadata declares no `type`. */
  type?: IconType;
  /** Icon name for `stock`/`cached` icons, file path for `local` ones and URL for `remote` ones. */
  value: string;
  width?: number;
  height?: number;
  /** HiDPI scale factor, at least `1`. */
  scale?: number;
}

/** A method to launch the component. */
export interface Launchable {
  /** Defaults to `desktop-id` when the metadata declares no `type`. */
  type?: LaunchableType;
  /** Desktop file ID, systemd unit name, Cockpit package or URL. */
  value: string;
}

/** A D-Bus service provided by the component. */
export interface ProvidedDbus {
  /** `session` is reported as `user`. */
  type?: DbusType;
  name: string;
}

/** Firmware provided by the component. */
export interface ProvidedFirmware {
  type?: FirmwareType;
  /** Firmware GUID, `bootloader`, or a file name for runtime firmware. */
  value: string;
}

/** Public interfaces a component provides. */
export interface Provides {
  /** Component IDs whose functionality is fully provided as well. */
  ids: string[];
  /** Binaries in `PATH`. */
  binaries: string[];
  /** Shared libraries in a public library path. */
  libraries: string[];
  /** Media (MIME) types the component handles. */
  mediatypes: string[];
  /** Full names of provided fonts. */
  fonts: string[];
  /** Hardware modalias globs the component handles. */
  modaliases: string[];
  firmware: ProvidedFirmware[];
  /** Provided Python 3 modules. */
  python3: string[];
  dbus: ProvidedDbus[];
}

/**
 * One entry of a relation block. The `type` names the child element it came from, so a single array
 * can describe component, hardware and system requirements alike.
 */
export interface Relation {
  type: RelationItemType;
  /**
   * Component ID, modalias, kernel name, memory size in MiB, firmware GUID, CHID, control type,
   * display length or internet usage.
   */
  value: string;
  /** Version to compare against. */
  version?: string;
  /** Comparison operator applied to `version`. Defaults to `ge`. */
  compare?: CompareOperator;
  /** Side of the display the `display_length` relation applies to. */
  side?: DisplaySide;
  /** Minimum bandwidth in Mbit/s, only set for `internet` relations. */
  bandwidth?: number;
}

/** A localized caption of a screenshot. */
export interface ScreenshotImage {
  url: string;
  type?: ImageType;
  width?: number;
  height?: number;
  /** HiDPI scale factor. Width and height stay in physical pixels. */
  scale?: number;
  /** Locale of the image, when several translations exist. */
  locale?: string;
}

/** A video attached to a screenshot. */
export interface ScreenshotVideo {
  url: string;
  container?: VideoContainer;
  codec?: VideoCodec;
  width?: number;
  height?: number;
  /** Locale of the video, when several translations exist. */
  locale?: string;
}

/** A screenshot of the component, holding at least one image or one video. */
export interface Screenshot {
  /** Defaults to no type; one screenshot should be marked `default`. */
  type?: ScreenshotType;
  /** GUI environment the screenshot was taken in, as `{environment}:{style}`. */
  environment?: string;
  caption?: Localized<string>;
  images: ScreenshotImage[];
  videos: ScreenshotVideo[];
}

/** An issue resolved by a release. */
export interface Issue {
  /** Defaults to `generic`. */
  type: IssueType;
  /** Bug number, ticket name, CVE or GCVE identifier. */
  value: string;
  /** Page with details about the issue. Required for `generic` issues. */
  url?: string;
}

/** A checksum of a release artifact. */
export interface Checksum {
  type?: ChecksumType;
  value: string;
}

/** A size reported for a release artifact, in bytes. */
export interface Size {
  type?: SizeType;
  value: number;
}

/** A downloadable release artifact. */
export interface Artifact {
  type?: ArtifactType;
  /** Platform triplet such as `x86_64-linux-gnu`, for binary artifacts. */
  platform?: string;
  /** Bundling system the binary artifact is made for. */
  bundle?: BundleType;
  /** Download mirrors of the artifact. */
  locations: string[];
  checksums: Checksum[];
  sizes: Size[];
  /** File name the artifact may be stored under. */
  filename?: string;
}

/** A user defined tag, scoped by a namespace. */
export interface Tag {
  namespace: string;
  value: string;
}

/** A release of the component. */
export interface Release {
  version: string;
  /** Release date in ISO 8601, at least day granularity. */
  date?: string;
  /** Release time as a UNIX epoch. Takes precedence over `date`. */
  timestamp?: number;
  /** Date the release stops receiving support. */
  dateEol?: string;
  /** Defaults to `stable`. */
  type: ReleaseType;
  /** Defaults to `medium`. */
  urgency: ReleaseUrgency;
  description?: Localized<RichText>;
  /** Web location with detailed release notes. */
  url?: string;
  issues: Issue[];
  artifacts: Artifact[];
  /** Sizes declared directly on the release, as older catalogs do. */
  sizes: Size[];
  tags: Tag[];
}

/** Release information of the component. */
export interface Releases {
  /** Defaults to `embedded`, in which case `url` is not set. */
  type: ReleasesType;
  /** Web location of externally hosted release data. */
  url?: string;
  items: Release[];
}

/** A translation domain of the component. */
export interface Translation {
  type?: TranslationType;
  /** Domain name used by the translation system. */
  value: string;
  /** POSIX locale of the source strings, when they are not `en_US`. */
  sourceLocale?: string;
}

/** Other software the component suggests. */
export interface Suggests {
  /** Defaults to `upstream`. */
  type: SuggestsType;
  ids: string[];
}

/** One rated section of a content rating. */
export interface ContentAttribute {
  id: string;
  /** Defaults to `none`. */
  value: ContentIntensity;
}

/** Age rating of the component. */
export interface ContentRating {
  type?: ContentRatingType;
  attributes: ContentAttribute[];
}

/** One section of an agreement. */
export interface AgreementSection {
  id: string;
  name: Localized<string>;
  description?: Localized<RichText>;
}

/** An agreement the user has to accept before using the component. */
export interface Agreement {
  /** Defaults to `generic`. */
  type: AgreementType;
  versionId: string;
  sections: AgreementSection[];
}

/** The developer or development team of the component. */
export interface Developer {
  /** Reverse-DNS name or Fediverse handle identifying the developer. */
  id?: string;
  name: Localized<string>;
}

/** An accent color used to brand the component. */
export interface BrandColor {
  /** Defaults to `primary`, the only color type the specification defines. */
  type?: ColorType;
  /** Color scheme this color is preferred for. */
  scheme?: ColorScheme;
  /** HTML hexadecimal color, starting with `#`. */
  value: string;
}

/** Branding properties of the component. */
export interface Branding {
  colors: BrandColor[];
}

/** A reference to the component in an external registry. */
export interface ReferenceRegistry {
  name: string;
  value: string;
}

/** References to the component in other registries. */
export interface References {
  /** DOI identifiers. */
  dois: string[];
  /** Links to citation files in the Citation File Format. */
  citationCff: string[];
  registries: ReferenceRegistry[];
}

/** Translation status of one language. */
export interface Language {
  /** Language code, such as `de` or `pt_BR`. */
  locale: string;
  /** Percentage the component is translated to. Absent means fully translated. */
  percentage?: number;
}

/** A bundle the component is distributed as. */
export interface Bundle {
  type?: BundleType;
  /** Identification string of the bundle. */
  value: string;
}

/** Metadata of one software component. */
export interface Component {
  /** Defaults to `generic`. */
  type: ComponentType;
  id: string;
  /** Date the component stops being supported. */
  dateEol?: string;
  /** Catalog only: priority of this metadata over other sources. */
  priority?: number;
  /** Catalog only: how this metadata merges with other sources. */
  merge?: MergeType;
  /** Catalog only: packages providing the component. */
  pkgNames: string[];
  /** Catalog only: source package the component belongs to. */
  sourcePkgName?: string;
  name: Localized<string>;
  summary: Localized<string>;
  description?: Localized<RichText>;
  /** License of the metadata itself. */
  metadataLicense?: string;
  /** License of the software. */
  projectLicense?: string;
  /** Upstream umbrella project the component belongs to. */
  projectGroup?: string;
  developer?: Developer;
  /** Deprecated predecessor of {@link Component.developer}. */
  developerName?: Localized<string>;
  /** Suffix software centers may append to the name to tell variants apart. */
  nameVariantSuffix?: Localized<string>;
  /** Category codes from the freedesktop.org menu specification. */
  categories: string[];
  keywords?: Localized<string[]>;
  urls: Url[];
  icons: Icon[];
  launchables: Launchable[];
  provides?: Provides;
  requires?: Relation[];
  recommends?: Relation[];
  supports?: Relation[];
  screenshots: Screenshot[];
  releases?: Releases;
  translation: Translation[];
  suggests?: Suggests;
  contentRating?: ContentRating;
  agreements: Agreement[];
  /** Email address distributors may contact the project under. */
  updateContact?: string;
  branding?: Branding;
  tags: Tag[];
  references?: References;
  /** Custom key-value store of the metadata. */
  custom?: Record<string, string>;
  /** Deprecated predecessor of `<provides/>` media types. */
  mimetypes: string[];
  /** Desktop environments the component is essential for. */
  compulsoryForDesktop: string[];
  /** Component IDs this component extends, for addons and repositories. */
  extends: string[];
  /** Bundles the component is distributed as, catalog metadata only. */
  bundles: Bundle[];
  /** Translation status per language, catalog metadata only. */
  languages: Language[];
}

/** A parsed AppStream document. */
export interface Catalog {
  /** AppStream specification version the file is based on. */
  version?: string;
  /** Repository the data belongs to. */
  origin?: string;
  /** Base URL media URLs are resolved against. */
  mediaBaseurl?: string;
  /** Architecture the data belongs to. */
  architecture?: string;
  components: Component[];
}
