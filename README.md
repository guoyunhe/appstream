# appstream

A fast and lightweight JavaScript/TypeScript parser and generator for Freedesktop.org [AppStream](https://www.freedesktop.org/software/appstream/docs/) XML metadata

## Usage

```ts
import { parseAppStream, parseAppStreamComponent } from '@guoyunhe/appstream';

// A catalog file that holds many components
const catalog = parseAppStream(xml);
catalog.origin; // repository the metadata belongs to
catalog.components; // Component[]

// A single MetaInfo file
const component = parseAppStreamComponent(xml);
component?.name; // { en: 'Foo', de: 'Fuh' }
component?.description; // { en: '<p>Foo is…</p>' }
component?.releases?.items[0]?.version;
```

Values that AppStream marks as translatable are returned as a map keyed by
locale, taken from `xml:lang` and lower-cased. Untranslated values use the `en`
key, which `DEFAULT_LOCALE` names. MetaInfo files translate descriptions
paragraph by paragraph and catalog files translate them as a whole; both shapes
end up in the same map.

Descriptions keep the markup subset AppStream allows (`p`, `heading`, `ol`,
`ul`, `li`, `em`, `code`). Elements outside the specification are dropped or
unwrapped, and links and images may only use `http`/`https` URLs, so the markup
is safe to render.

The parser needs no DOM and splits catalogs into their components before they
are parsed, which keeps large repository catalogs cheap to read.

## Development

- Install dependencies:

```bash
npm install
```

- Run the unit tests:

```bash
npm run test
```

- Build the library:

```bash
npm run build
```
