# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-13

### Added

- `parseAppStream()` reads an AppStream document into a catalog
  (`version`, `origin`, `mediaBaseurl`, `architecture` and `components`).
  Catalogs are split into their components before they are parsed, so a large
  repository catalog is never turned into one big object.
- `parseAppStreamComponent()` reads a single MetaInfo component, and returns the
  first component of a catalog document.
- Type definitions for component metadata of the AppStream specification:
  component types, `provides`, `requires` / `recommends` / `supports` relations,
  screenshots with images and videos, release information with issues,
  artifacts, checksums and sizes, content ratings, agreements, branding, tags,
  references, bundles and languages, as well as the catalog-only fields.
- Translatable values are reported as maps keyed by locale (`xml:lang`, lower
  cased), with untranslated strings under `DEFAULT_LOCALE` (`en`). The
  paragraph-by-paragraph translation of MetaInfo files and the whole-element
  translation of catalogs both end up in the same map.
- Rich text descriptions keep the markup the specification allows (`p`,
  `heading`, `ol`, `ul`, `li`, `em`, `code`) and are sanitized without a DOM:
  elements outside the specification are dropped or unwrapped, and links and
  images are limited to `http` / `https` URLs.
- Support for deprecated and legacy metadata, including `appcategories`,
  `<application>` roots, releases and sizes listed directly on a component,
  screenshots nested in descriptions, `developer_name`, `mimetypes`, `session`
  D-Bus services and the catalog-only `pkgname`, `priority`, `merge` and
  `source_pkgname` fields.

### Changed

- The starter `fn()` export is replaced by the AppStream parsing API.
