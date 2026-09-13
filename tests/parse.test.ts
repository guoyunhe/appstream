import { describe, expect, test } from 'vitest';

import { parseAppStream, parseAppStreamComponent } from '../src';

const metainfo = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>org.example.Foo</id>
  <metadata_license>FSFAP</metadata_license>
  <project_license>GPL-3.0-or-later</project_license>
  <project_group>GNOME</project_group>
  <name>Foo Bar</name>
  <name xml:lang="de">Fuh Bar</name>
  <summary>A foo-ish bar</summary>
  <summary xml:lang="de">Ein fußiges Bar</summary>
  <description>
    <p>Hello <em>world</em> and <code>code</code>!</p>
    <p xml:lang="de">Hallo <em>Welt</em>!</p>
    <ul>
      <li>one</li>
      <li>two</li>
    </ul>
  </description>
  <developer id="org.example">
    <name>The Foo Team</name>
  </developer>
  <url type="homepage">https://example.org</url>
  <url type="bugtracker">https://example.org/issues</url>
  <icon type="stock">foo</icon>
  <icon type="cached" width="128" height="128" scale="2">foo.png</icon>
  <categories>
    <category>Game</category>
    <category>StrategyGame</category>
    <category>Game</category>
  </categories>
  <keywords>
    <keyword>foo</keyword>
    <keyword xml:lang="de">fu</keyword>
  </keywords>
  <launchable type="desktop-id">org.example.Foo.desktop</launchable>
  <provides>
    <binary>foo</binary>
    <library>libfoo.so.1</library>
    <mediatype>text/x-foo</mediatype>
    <font>Foo.ttf</font>
    <modalias>usb:v1234*</modalias>
    <python3>foo</python3>
    <dbus type="session">org.example.Foo</dbus>
    <firmware type="flashed">6de5d951-d755-576b-bd09-c5cf66b27234</firmware>
    <id>org.example.Old</id>
  </provides>
  <requires>
    <kernel version="5.0" compare="ge">Linux</kernel>
    <memory>512</memory>
  </requires>
  <recommends>
    <display_length compare="ge" side="shortest">600</display_length>
    <internet bandwidth_mbitps="2">always</internet>
  </recommends>
  <supports>
    <control>touch</control>
  </supports>
  <screenshots>
    <screenshot type="default" environment="gnome:dark">
      <caption>Main window</caption>
      <caption xml:lang="de">Hauptfenster</caption>
      <image type="source" width="1600" height="900">https://example.org/1.png</image>
      <image type="thumbnail" width="752" height="423">https://example.org/1-small.png</image>
    </screenshot>
    <screenshot>
      <video container="matroska" codec="av1" width="1600" height="900">https://example.org/v.mkv</video>
    </screenshot>
  </screenshots>
  <releases type="external" url="https://example.org/releases.xml"/>
  <translation type="gettext" source_locale="de_DE">foo</translation>
  <suggests>
    <id>org.example.Bar</id>
  </suggests>
  <content_rating type="oars-1.1">
    <content_attribute id="drugs-alcohol">moderate</content_attribute>
  </content_rating>
  <agreement type="privacy" version_id="1.0">
    <agreement_section id="intro">
      <name>Introduction</name>
      <description><p>We hold data.</p></description>
    </agreement_section>
  </agreement>
  <update_contact>dev_AT_example.org</update_contact>
  <branding>
    <color type="primary" scheme_preference="dark">#993d3d</color>
  </branding>
  <tags>
    <tag namespace="lvfs">vendor-2021q1</tag>
  </tags>
  <references>
    <doi>10.1000/182</doi>
    <registry name="SciCrunch">SCR_000000</registry>
    <citation_cff>https://example.org/CITATION.cff</citation_cff>
  </references>
  <custom>
    <value key="Example::color">#FF0000</value>
  </custom>
  <mimetypes>
    <mimetype>text/x-foo</mimetype>
  </mimetypes>
  <compulsory_for_desktop>GNOME</compulsory_for_desktop>
  <extends>org.example.Base</extends>
  <bundle type="flatpak">org.example.Foo</bundle>
  <languages>
    <lang percentage="96">de</lang>
    <lang>en</lang>
  </languages>
</component>`;

const catalog = `<?xml version="1.0"?>
<components version="1.0" origin="example" media_baseurl="https://example.org/media/" architecture="x86_64">
  <component type="desktop-application" priority="5" merge="append">
    <id>org.example.Foo</id>
    <pkgname>foo</pkgname>
    <pkgname>foo-data</pkgname>
    <source_pkgname>foo</source_pkgname>
    <name>Foo</name>
    <summary>Foo</summary>
    <description xml:lang="de"><p>Hallo</p><p>Welt</p></description>
  </component>
  <component>
    <id>org.example.Bar</id>
    <name>Bar</name>
    <summary>Bar</summary>
    <categories><appcategory>Utility</appcategory></categories>
    <release version="2.0" date="2024-01-01"/>
  </component>
  <component>
    <name>No identifier</name>
  </component>
</components>`;

describe('parseAppStreamComponent', () => {
  const component = parseAppStreamComponent(metainfo);

  test('reads the identity of the component', () => {
    expect(component?.type).toBe('desktop-application');
    expect(component?.id).toBe('org.example.Foo');
    expect(component?.metadataLicense).toBe('FSFAP');
    expect(component?.projectLicense).toBe('GPL-3.0-or-later');
    expect(component?.projectGroup).toBe('GNOME');
    expect(component?.updateContact).toBe('dev_AT_example.org');
  });

  test('collects localized values', () => {
    expect(component?.name).toEqual({ en: 'Foo Bar', de: 'Fuh Bar' });
    expect(component?.summary).toEqual({ en: 'A foo-ish bar', de: 'Ein fußiges Bar' });
    expect(component?.keywords).toEqual({ en: ['foo'], de: ['fu'] });
    expect(component?.developer).toEqual({
      id: 'org.example',
      name: { en: 'The Foo Team' },
    });
  });

  test('collects urls and icons', () => {
    expect(component?.urls).toEqual([
      { type: 'homepage', url: 'https://example.org' },
      { type: 'bugtracker', url: 'https://example.org/issues' },
    ]);
    expect(component?.icons).toEqual([
      { type: 'stock', value: 'foo' },
      { type: 'cached', value: 'foo.png', width: 128, height: 128, scale: 2 },
    ]);
  });

  test('deduplicates categories', () => {
    expect(component?.categories).toEqual(['Game', 'StrategyGame']);
  });

  test('collects provided interfaces', () => {
    expect(component?.provides).toEqual({
      ids: ['org.example.Old'],
      binaries: ['foo'],
      libraries: ['libfoo.so.1'],
      mediatypes: ['text/x-foo'],
      fonts: ['Foo.ttf'],
      modaliases: ['usb:v1234*'],
      firmware: [{ type: 'flashed', value: '6de5d951-d755-576b-bd09-c5cf66b27234' }],
      python3: ['foo'],
      dbus: [{ type: 'user', name: 'org.example.Foo' }],
    });
  });

  test('collects relations of every kind', () => {
    expect(component?.requires).toEqual([
      { type: 'kernel', value: 'Linux', version: '5.0', compare: 'ge' },
      { type: 'memory', value: '512' },
    ]);
    expect(component?.recommends).toEqual([
      { type: 'display_length', value: '600', compare: 'ge', side: 'shortest' },
      { type: 'internet', value: 'always', bandwidth: 2 },
    ]);
    expect(component?.supports).toEqual([{ type: 'control', value: 'touch' }]);
  });

  test('reads screenshots with images and videos', () => {
    expect(component?.screenshots).toEqual([
      {
        type: 'default',
        environment: 'gnome:dark',
        caption: { en: 'Main window', de: 'Hauptfenster' },
        images: [
          { url: 'https://example.org/1.png', type: 'source', width: 1600, height: 900 },
          { url: 'https://example.org/1-small.png', type: 'thumbnail', width: 752, height: 423 },
        ],
        videos: [],
      },
      {
        images: [],
        videos: [
          {
            url: 'https://example.org/v.mkv',
            container: 'matroska',
            codec: 'av1',
            width: 1600,
            height: 900,
          },
        ],
      },
    ]);
  });

  test('reads external release metadata', () => {
    expect(component?.releases).toEqual({
      type: 'external',
      url: 'https://example.org/releases.xml',
      items: [],
    });
  });

  test('reads agreements, ratings and extras', () => {
    expect(component?.translation).toEqual([
      { type: 'gettext', value: 'foo', sourceLocale: 'de_DE' },
    ]);
    expect(component?.suggests).toEqual({ type: 'upstream', ids: ['org.example.Bar'] });
    expect(component?.contentRating).toEqual({
      type: 'oars-1.1',
      attributes: [{ id: 'drugs-alcohol', value: 'moderate' }],
    });
    expect(component?.agreements[0]?.type).toBe('privacy');
    expect(component?.agreements[0]?.versionId).toBe('1.0');
    expect(component?.agreements[0]?.sections[0]).toEqual({
      id: 'intro',
      name: { en: 'Introduction' },
      description: { en: '<p>We hold data.</p>' },
    });
    expect(component?.branding).toEqual({
      colors: [{ type: 'primary', scheme: 'dark', value: '#993d3d' }],
    });
    expect(component?.tags).toEqual([{ namespace: 'lvfs', value: 'vendor-2021q1' }]);
    expect(component?.references).toEqual({
      dois: ['10.1000/182'],
      citationCff: ['https://example.org/CITATION.cff'],
      registries: [{ name: 'SciCrunch', value: 'SCR_000000' }],
    });
    expect(component?.custom).toEqual({ 'Example::color': '#FF0000' });
    expect(component?.mimetypes).toEqual(['text/x-foo']);
    expect(component?.compulsoryForDesktop).toEqual(['GNOME']);
    expect(component?.extends).toEqual(['org.example.Base']);
    expect(component?.bundles).toEqual([{ type: 'flatpak', value: 'org.example.Foo' }]);
    expect(component?.languages).toEqual([{ locale: 'de', percentage: 96 }, { locale: 'en' }]);
    expect(component?.launchables).toEqual([
      { type: 'desktop-id', value: 'org.example.Foo.desktop' },
    ]);
  });
});

describe('descriptions', () => {
  test('keeps markup per locale and preserves inline spacing', () => {
    const component = parseAppStreamComponent(metainfo);
    expect(component?.description).toEqual({
      en: '<p>Hello <em>world</em> and <code>code</code>!</p>\n<ul><li>one</li> <li>two</li></ul>',
      de: '<p>Hallo <em>Welt</em>!</p>',
    });
  });

  test('drops dangerous elements and unwraps unknown ones', () => {
    const component = parseAppStreamComponent(`<component>
      <id>org.example.Safe</id>
      <description>
        <p>Keep <b>bold</b> and <unknown>text</unknown> but not <script>alert(1)</script></p>
        <p><a href="javascript:alert(1)">bad</a><a href="https://example.org" onclick="x">good</a></p>
      </description>
    </component>`);

    expect(component?.description).toEqual({
      en: '<p>Keep <b>bold</b> and text but not</p>\n<p><a>bad</a><a href="https://example.org">good</a></p>',
    });
  });

  test('escapes text and reads plain text descriptions', () => {
    const escaped = parseAppStreamComponent(`<component>
      <id>org.example.Escaped</id>
      <description><p>a &amp; b &lt; c</p></description>
    </component>`);
    expect(escaped?.description).toEqual({ en: '<p>a &amp; b &lt; c</p>' });

    const plain = parseAppStreamComponent(`<component>
      <id>org.example.Plain</id>
      <description>Just text</description>
    </component>`);
    expect(plain?.description).toEqual({ en: 'Just text' });
  });
});

describe('parseAppStream', () => {
  test('reads catalog attributes', () => {
    const result = parseAppStream(catalog);
    expect(result.version).toBe('1.0');
    expect(result.origin).toBe('example');
    expect(result.mediaBaseurl).toBe('https://example.org/media/');
    expect(result.architecture).toBe('x86_64');
  });

  test('reads every component and skips components without an id', () => {
    const result = parseAppStream(catalog);
    expect(result.components).toHaveLength(2);

    const [foo, bar] = result.components;
    expect(foo?.id).toBe('org.example.Foo');
    expect(foo?.pkgNames).toEqual(['foo', 'foo-data']);
    expect(foo?.sourcePkgName).toBe('foo');
    expect(foo?.priority).toBe(5);
    expect(foo?.merge).toBe('append');
    expect(foo?.description).toEqual({ de: '<p>Hallo</p>\n<p>Welt</p>' });

    expect(bar?.type).toBe('generic');
    expect(bar?.categories).toEqual(['Utility']);
  });

  test('reads releases listed directly on a component', () => {
    const bar = parseAppStream(catalog).components[1];
    expect(bar?.releases).toEqual({
      type: 'embedded',
      items: [
        {
          version: '2.0',
          date: '2024-01-01',
          type: 'stable',
          urgency: 'medium',
          issues: [],
          artifacts: [],
          sizes: [],
          tags: [],
        },
      ],
    });
  });

  test('returns an empty catalog for empty input', () => {
    expect(parseAppStream('')).toEqual({ components: [] });
    expect(parseAppStreamComponent('')).toBeUndefined();
    expect(parseAppStreamComponent('<component><name>No id</name></component>')).toBeUndefined();
  });

  test('splits a catalog that holds a single component', () => {
    expect(parseAppStream(metainfo).components).toHaveLength(1);
    expect(parseAppStream(metainfo).components[0]?.id).toBe('org.example.Foo');
  });

  test('reads the first component of a catalog through the component parser', () => {
    expect(parseAppStreamComponent(catalog)?.id).toBe('org.example.Foo');
  });
});

describe('release data', () => {
  test('reads releases with descriptions, issues and artifacts', () => {
    const component = parseAppStreamComponent(`<component>
      <id>org.example.Released</id>
      <releases>
        <release version="1.2" date="2014-04-12" urgency="high" date_eol="2026-01-01">
          <description>
            <p>This stable release fixes bugs.</p>
            <p xml:lang="de">Dieses Release behebt Fehler.</p>
          </description>
          <url type="details">https://example.org/releases/1.2.html</url>
          <issues>
            <issue url="https://example.com/bugzilla/12345">bz#12345</issue>
            <issue type="cve">CVE-2019-123456</issue>
          </issues>
          <artifacts>
            <artifact type="binary" platform="x86_64-linux-gnu" bundle="flatpak">
              <location>https://example.com/foo.bin.tar.xz</location>
              <location>https://mirror.example.com/foo.bin.tar.xz</location>
              <checksum type="sha256">abc</checksum>
              <size type="download">12345678</size>
              <size type="installed">42424242</size>
              <filename>foo-1.2.bin.tar.xz</filename>
            </artifact>
            <artifact type="source">
              <location>https://example.com/foo.tar.xz</location>
              <checksum type="blake2b">def</checksum>
            </artifact>
          </artifacts>
          <size type="download">1</size>
        </release>
        <release version="1.1" type="development" date="2013-10-20"/>
        <release version="1.0" date="2012-08-26"/>
      </releases>
    </component>`);

    const release = component?.releases?.items[0];
    expect(release?.version).toBe('1.2');
    expect(release?.urgency).toBe('high');
    expect(release?.dateEol).toBe('2026-01-01');
    expect(release?.description).toEqual({
      en: '<p>This stable release fixes bugs.</p>',
      de: '<p>Dieses Release behebt Fehler.</p>',
    });
    expect(release?.url).toBe('https://example.org/releases/1.2.html');
    expect(release?.issues).toEqual([
      { type: 'generic', value: 'bz#12345', url: 'https://example.com/bugzilla/12345' },
      { type: 'cve', value: 'CVE-2019-123456' },
    ]);
    expect(release?.sizes).toEqual([{ type: 'download', value: 1 }]);
    expect(release?.artifacts[0]).toEqual({
      type: 'binary',
      platform: 'x86_64-linux-gnu',
      bundle: 'flatpak',
      locations: [
        'https://example.com/foo.bin.tar.xz',
        'https://mirror.example.com/foo.bin.tar.xz',
      ],
      checksums: [{ type: 'sha256', value: 'abc' }],
      sizes: [
        { type: 'download', value: 12345678 },
        { type: 'installed', value: 42424242 },
      ],
      filename: 'foo-1.2.bin.tar.xz',
    });
    expect(component?.releases?.items[1]?.type).toBe('development');
    expect(component?.releases?.items[2]?.type).toBe('stable');
  });

  test('reads timestamps and release tags', () => {
    const component = parseAppStreamComponent(`<component>
      <id>org.example.Stamped</id>
      <releases>
        <release version="1.8" timestamp="1424116753">
          <tags><tag namespace="plasma">featured</tag></tags>
        </release>
      </releases>
    </component>`);

    const release = component?.releases?.items[0];
    expect(release?.timestamp).toBe(1424116753);
    expect(release?.tags).toEqual([{ namespace: 'plasma', value: 'featured' }]);
  });
});
