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
    t.equal(dom.tree.childNodes[1].value, ' Test ');
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
      dom.find('*').map(el => el.tag),
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
      </html>`
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
    t.equal(dom.toString({xml: true}), '<p data-test="data-test" data-two="data-two">Hello<br />Mojo!</p>');
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

  t.test('A bit of everything (basic navigation)', t => {
    const dom = new DOM(
      `
      <!doctype foo>
      <foo bar="ba&lt;z">
        test
        <simple class="working">easy</simple>
        <test foo="bar" id="test" />
        <!-- lala -->
        works well
        <![CDATA[ yada yada]]>
        <?boom lalalala ?>
        <a little bit broken>
        < very broken
        <br />
        more text
      </foo>`,
      {xml: true}
    );
    t.equal(
      dom.toString(),
      `
      <!DOCTYPE foo>
      <foo bar="ba&lt;z">
        test
        <simple class="working">easy</simple>
        <test foo="bar" id="test" />
        <!-- lala -->
        works well
        <![CDATA[ yada yada]]>
        <?boom lalalala ?>
        <a little="little" bit="bit" broken="broken">
        &lt; very broken
        <br />
        more text
      </a></foo>`
    );

    const simple = dom.at('foo simple.working[class^="wor"]');
    t.same(simple.root().tag, '');
    t.same(dom.root().tag, '');
    t.equal(simple.root().children()[0].tag, 'foo');
    t.equal(simple.tag, 'simple');
    t.equal(simple.attr.class, 'working');
    t.equal(simple.text(), 'easy');
    t.equal(simple.parent().tag, 'foo');
    t.equal(simple.parent().attr.bar, 'ba<z');
    t.equal(simple.parent().children()[1].tag, 'test');
    t.equal(simple.toString(), '<simple class="working">easy</simple>');
    simple.parent().attr.bar = 'baz';
    t.equal(simple.parent().attr.bar, 'baz');

    t.equal(dom.at('test#test').tag, 'test');
    t.equal(dom.at('[class$="ing"]').tag, 'simple');
    t.equal(dom.at('[class="working"]').tag, 'simple');
    t.equal(dom.at('[class$=ing]').tag, 'simple');
    t.equal(dom.at('[class=working][class]').tag, 'simple');
    t.equal(dom.at('foo > simple').next().tag, 'test');
    t.equal(dom.at('foo > simple').next().next().tag, 'a');
    t.same(
      dom
        .at('foo > simple')
        .following()
        .map(el => el.tag),
      ['test', 'a']
    );
    t.equal(dom.at('foo > test').previous().tag, 'simple');
    t.same(
      dom
        .at('foo > test')
        .preceding()
        .map(el => el.tag),
      ['simple']
    );

    t.end();
  });

  t.test('Remove elements', t => {
    const dom = new DOM('<div>foo<p>lalala</p><br><i>bar</i></div>', {fragment: true});
    dom.remove();
    dom.strip();
    t.equal(dom.toString(), '<div>foo<p>lalala</p><br><i>bar</i></div>');
    dom.at('p').remove();
    t.equal(dom.toString(), '<div>foo<br><i>bar</i></div>');
    dom.at('i').strip();
    t.equal(dom.toString(), '<div>foo<br>bar</div>');
    t.end();
  });

  t.test('Adding nodes', t => {
    const dom = new DOM(
      `
      <ul>
        <li>A</li>
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>`,
      {fragment: true}
    );

    dom.at('li').append('<p>A1</p>23').append('22');
    t.equal(
      dom.toString(),
      `
      <ul>
        <li>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>`
    );

    dom.at('li').prepend('24').prepend('<div>A-1</div>25');
    t.equal(
      dom.toString(),
      `
      <ul>
        24<div>A-1</div>25<li>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>`
    );
    t.equal(dom.at('div').text(), 'A-1');
    t.equal(dom.at('iv'), null);

    dom.prependContent('a').prependContent('lal').prependContent('la');
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1</div>25<li>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>`
    );

    dom.appendContent('la').appendContent('lal').appendContent('a');
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1</div>25<li>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>lalala`
    );

    dom.find('div').forEach(el => el.append('works'));
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1</div>works25<li>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>workslalala`
    );

    dom.at('li').prependContent('A3<p>A2</p>').prependContent('A4');
    t.equal(dom.at('li').text(), 'A4A3A');
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1</div>works25<li>A4A3<p>A2</p>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C</li>
      </ul>
      <div>D</div>workslalala`
    );

    dom.find('li')[1].appendContent('<p>C2</p>C3').appendContent(' C4').appendContent('C5');
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1</div>works25<li>A4A3<p>A2</p>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C<p>C2</p>C3 C4C5</li>
      </ul>
      <div>D</div>workslalala`
    );

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
      dom.find('*').map(el => el.tag),
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
        .map(el => el.tag),
      ['channel', 'rss']
    );
    t.equal(dom.at('extension').attr['foo:id'], 'works');
    t.match(dom.at('#works').text(), /\[awesome\]\]/);
    t.match(dom.at('[id="works"]').text(), /\[awesome\]\]/);
    t.equal(dom.find('description')[1].text(), '\n              <p>trololololo>\n            ');
    t.equal(dom.at('pubDate').text(), 'Mon, 12 Jul 2010 20:42:00');
    t.match(dom.at('[id*="ork"]').text(), /\[awesome\]\]/);
    t.match(dom.at('[id*="orks"]').text(), /\[awesome\]\]/);
    t.match(dom.at('[id*="work"]').text(), /\[awesome\]\]/);
    t.match(dom.at('[id*="or"]').text(), /\[awesome\]\]/);
    t.equal(dom.toString(), rss);
    t.end();
  });

  t.test('Unusual order', t => {
    const dom = new DOM('<a href="http://example.com" id="foo" class="bar">Ok!</a>', {fragment: true});
    t.equal(dom.at('a:not([href$=foo])[href^=h]').text(), 'Ok!');
    t.same(dom.at('a:not([href$=example.com])[href^=h]'), null);
    t.equal(dom.at('a[href^=h]#foo.bar').text(), 'Ok!');
    t.same(dom.at('a[href^=h]#foo.baz'), null);
    t.equal(dom.at('a[href^=h]#foo:not(b)').text(), 'Ok!');
    t.same(dom.at('a[href^=h]#foo:not(a)'), null);
    t.equal(dom.at('[href^=h].bar:not(b)[href$=m]#foo').text(), 'Ok!');
    t.same(dom.at('[href^=h].bar:not(b)[href$=m]#bar'), null);
    t.equal(dom.at(':not(b)#foo#foo').text(), 'Ok!');
    t.same(dom.at(':not(b)#foo#bar'), null);
    t.equal(dom.at('*:not([href^=h]#foo#bar)').text(), 'Ok!');
    t.same(dom.at('*:not([href^=h]#foo#foo)'), null);

    t.same(dom.at(':is(b)#foo#foo'), null);
    t.equal(dom.at(':is(#foo):not(b).bar').text(), 'Ok!');
    t.same(dom.at(':is(#foo):is(b).bar'), null);
    t.same(dom.at('*:is([href^=h]#foo#bar)'), null);
    t.equal(dom.at('*:is([href^=h]#foo#foo)').text(), 'Ok!');
    t.end();
  });

  t.end();
});
