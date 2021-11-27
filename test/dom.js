import DOM from '../lib/dom.js';
import {CommentNode} from '../lib/nodes/comment.js';
import {DoctypeNode} from '../lib/nodes/doctype.js';
import {DocumentNode} from '../lib/nodes/document.js';
import {ElementNode} from '../lib/nodes/element.js';
import {FragmentNode} from '../lib/nodes/fragment.js';
import {TextNode} from '../lib/nodes/text.js';
import t from 'tap';

t.test('DOM', t => {
  t.test('HTML document', t => {
    const dom = new DOM('<!DOCTYPE html><p class="foo">Mojo</p>');
    t.ok(dom.tree instanceof DocumentNode);
    t.ok(dom.tree.childNodes[0] instanceof DoctypeNode);
    t.ok(dom.tree.childNodes[1] instanceof ElementNode);
    t.equal(dom.tree.childNodes[1].tagName, 'html');
    t.ok(dom.tree.childNodes[1].childNodes[0] instanceof ElementNode);
    t.equal(dom.tree.childNodes[1].childNodes[0].tagName, 'head');
    t.ok(dom.tree.childNodes[1].childNodes[1] instanceof ElementNode);
    t.equal(dom.tree.childNodes[1].childNodes[1].tagName, 'body');
    t.ok(dom.tree.childNodes[1].childNodes[1].childNodes[0] instanceof ElementNode);
    t.equal(dom.tree.childNodes[1].childNodes[1].childNodes[0].tagName, 'p');
    t.equal(dom.tree.childNodes[1].childNodes[1].childNodes[0].attrs[0].name, 'class');
    t.equal(dom.tree.childNodes[1].childNodes[1].childNodes[0].attrs[0].value, 'foo');
    t.same(dom.tree.childNodes[1].childNodes[1].childNodes[0].attrs[1], undefined);
    t.same(dom.tree.childNodes[1].childNodes[1].childNodes[1], undefined);
    t.ok(dom.tree.childNodes[1].childNodes[1].childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.tree.childNodes[1].childNodes[1].childNodes[0].childNodes[0].value, 'Mojo');
    t.same(dom.tree.childNodes[1].childNodes[1].childNodes[0].childNodes[1], undefined);
    t.same(dom.tree.childNodes[1].childNodes[2], undefined);
    t.same(dom.tree.childNodes[2], undefined);
    t.equal(dom.toString(), '<!DOCTYPE html><html><head></head><body><p class="foo">Mojo</p></body></html>');
    t.end();
  });

  t.test('HTML fragment', t => {
    const dom = new DOM('<p class="foo">Mojo</p><!-- Test -->', {fragment: true});
    t.ok(dom.tree instanceof FragmentNode);
    t.ok(dom.tree.childNodes[0] instanceof ElementNode);
    t.equal(dom.tree.childNodes[0].tagName, 'p');
    t.equal(dom.tree.childNodes[0].attrs[0].name, 'class');
    t.equal(dom.tree.childNodes[0].attrs[0].value, 'foo');
    t.same(dom.tree.childNodes[0].attrs[1], undefined);
    t.ok(dom.tree.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.tree.childNodes[0].childNodes[0].value, 'Mojo');
    t.ok(dom.tree.childNodes[1] instanceof CommentNode);
    t.equal(dom.tree.childNodes[1].data, ' Test ');
    t.same(dom.tree.childNodes[2], undefined);
    t.equal(dom.toString(), '<p class="foo">Mojo</p><!-- Test -->');
    t.end();
  });

  t.test('XML document', t => {
    const dom = new DOM('<link>http://mojolicious.org</link>', {xml: true});
    t.ok(dom.tree instanceof DocumentNode);
    t.ok(dom.tree.childNodes[0] instanceof ElementNode);
    t.equal(dom.tree.childNodes[0].tagName, 'link');
    t.ok(dom.tree.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.tree.childNodes[0].childNodes[0].value, 'http://mojolicious.org');
    t.same(dom.tree.childNodes[0].childNodes[1], undefined);
    t.same(dom.tree.childNodes[1], undefined);
    t.equal(dom.toString(), '<link>http://mojolicious.org</link>');
    t.equal(dom.toString({xml: false}), '<link>');
    t.end();
  });

  t.test('Entities', t => {
    const dom = new DOM('<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>', {fragment: true});
    t.equal(dom.tree.childNodes[0].attrs[0].value, '<foo>');
    t.equal(dom.tree.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom.toString(), '<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>');

    const dom2 = new DOM('<link class="&lt;foo&gt;">&lt;Mojo&gt;</link>', {xml: true});
    t.equal(dom2.tree.childNodes[0].attrs[0].value, '<foo>');
    t.equal(dom2.tree.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom2.toString(), '<link class="&lt;foo&gt;">&lt;Mojo&gt;</link>');
    t.end();
  });

  t.test('Tag', t => {
    const dom = new DOM('<p class="foo">Foo</p><div>Bar</div>', {fragment: true});
    t.equal(dom.tag, '');
    t.same(dom.matches('*'), false);
    t.equal(dom.at('p').tag, 'p');
    t.same(dom.at('p').matches('div'), false);
    t.same(dom.at('p').matches('p'), true);
    t.same(dom.at('p').matches('*'), true);
    t.equal(dom.at('div').tag, 'div');
    t.equal(dom.at('.foo').tag, 'p');
    t.same(
      dom.find('*').map(e => e.tag),
      ['p', 'div']
    );
    dom.at('.foo').tag = 'div';
    t.equal(dom.at('.foo').tag, 'div');
    t.equal(dom.toString(), '<div class="foo">Foo</div><div>Bar</div>');
    t.end();
  });

  t.test('Attribute', t => {
    const dom = new DOM('<p class="foo">Foo</p><div id="bar">Bar</div>', {fragment: true});
    t.same(dom.attr.class, null);
    t.same(Object.keys(dom.attr), []);
    t.equal(dom.at('p').attr.class, 'foo');
    t.equal(dom.at('p').attr['class'], 'foo');
    t.same(dom.at('p').attr.id, null);
    t.same(Object.keys(dom.at('p').attr), ['class']);
    t.equal(dom.at('[id]').attr.id, 'bar');
    t.same(dom.at('[id]').attr.class, null);
    t.same(Object.keys(dom.at('[id]').attr), ['id']);

    const dom2 = new DOM('<p class="foo">Foo</p>', {fragment: true});
    dom2.at('p').attr.class += 'bar';
    dom2.at('p').attr.id = 'baz';
    t.equal(dom2.toString(), '<p class="foobar" id="baz">Foo</p>');
    delete dom2.at('p').attr.class;
    t.equal(dom2.toString(), '<p id="baz">Foo</p>');
    t.end();
  });

  t.test('Text', t => {
    const dom = new DOM('<p>Hello Mojo!</p>', {fragment: true});
    t.equal(dom.text(), '');
    t.equal(dom.at('p').text(), 'Hello Mojo!');
    t.end();
  });

  t.test('Combinators', t => {
    const dom = new DOM(
      `
<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <div id="container">
      <div id="header">
        <div id="logo">Hello World</div>
        <div id="buttons">
          <p id="foo">Foo</p>
        </div>
        <div id="baz">Baz</div>
        <div id="yada">Yada</div>
      </div>
      <form>
        <div id="buttons">
          <p id="bar">Bar</p>
        </div>
      </form>
      <div id="content">More stuff</div>
    </div>
  </body>
</html>
`
    );
    t.equal(dom.at('#container #foo').text(), 'Foo');
    t.same(dom.at('#container > #foo'), null);
    t.equal(dom.at('#buttons > #foo').text(), 'Foo');

    t.equal(dom.at('#buttons ~ div').text(), 'Baz');
    t.equal(dom.find('#buttons ~ div')[0].text(), 'Baz');
    t.equal(dom.find('#buttons ~ div')[1].text(), 'Yada');
    t.same(dom.find('#buttons ~ div')[2], null);
    t.equal(dom.find('#buttons + div')[0].text(), 'Baz');
    t.same(dom.find('#buttons + div')[1], null);
    t.end();
  });

  t.test('HTML to XML', t => {
    const dom = new DOM('<p data-test data-two="data-two">Hello<br>Mojo!</p>', {fragment: true});
    t.equal(dom.at('p').text(), 'HelloMojo!');
    t.equal(dom.toString({xml: true}), '<p data-test="data-test" data-two="data-two">Hello<br></br>Mojo!</p>');
    t.equal(dom.toString(), '<p data-test data-two="data-two">Hello<br>Mojo!</p>');
    t.end();
  });

  t.test('Select based on parent', t => {
    const dom = new DOM(
      `
  <body>
    <div>test1</div>
    <div><div>test2</div></div>
  </body>`
    );
    t.equal(dom.find('body > div')[0].text(), 'test1');
    t.equal(dom.find('body > div')[1].text(), '');
    t.equal(dom.find('body > div')[2], undefined);
    t.equal(dom.find('body > div > div')[0].text(), 'test2');
    t.equal(dom.find('body > div > div')[1], undefined);
    t.end();
  });

  t.test('Class and ID', t => {
    const dom = new DOM('<div id="id" class="class">a</div>');
    t.equal(dom.at('div#id.class').text(), 'a');
    t.end();
  });

  t.test('RSS', t => {
    const rss = `
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>Test Blog</title>
    <link>http://blog.example.com</link>
    <description>lalala</description>
    <generator>Mojolicious</generator>
    <item>
      <pubDate>Mon, 12 Jul 2010 20:42:00</pubDate>
      <title>Works!</title>
      <link>http://blog.example.com/test</link>
      <guid>http://blog.example.com/test</guid>
      <description>
        <![CDATA[<p>trololololo>]]>
      </description>
      <my:extension foo:id="works" bar:id="too">
        <![CDATA[
          [awesome]]
        ]]>
      </my:extension>
    </item>
  </channel>
</rss>`;
    const dom = new DOM(rss, {xml: true});
    t.same(
      dom.find('*').map(e => e.tag),
      [
        'rss',
        'channel',
        'title',
        'link',
        'description',
        'generator',
        'item',
        'pubDate',
        'title',
        'link',
        'guid',
        'description',
        'my:extension'
      ]
    );
    t.equal(dom.find('rss')[0].attr.version, '2.0');
    t.same(
      dom
        .at('title')
        .ancestors()
        .map(e => e.tag),
      ['channel', 'rss']
    );
    t.equal(dom.at('extension').attr['foo:id'], 'works');
    t.match(dom.at('#works').text(), /\[awesome\]\]/);
    t.match(dom.at('[id="works"]').text(), /\[awesome\]\]/);
    t.equal(dom.find('description')[1].text(), '\n        <p>trololololo>\n      ');
    t.equal(dom.at('pubDate').text(), 'Mon, 12 Jul 2010 20:42:00');
    t.equal(dom.toString(), rss);
    t.end();
  });

  t.end();
});
