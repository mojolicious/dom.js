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

  t.test('Entities', t => {
    const dom = new DOM('<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>', {fragment: true});
    t.equal(dom.tree.childNodes[0].attrs[0].value, '<foo>');
    t.equal(dom.tree.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom.toString(), '<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>');
    t.end();
  });

  t.test('Tag', t => {
    const dom = new DOM('<p class="foo">Foo</p><div>Bar</div>', {fragment: true});
    t.same(dom.tag, null);
    t.equal(dom.at('p').tag, 'p');
    t.equal(dom.at('div').tag, 'div');
    t.equal(dom.at('.foo').tag, 'p');
    t.end();
  });

  t.test('Attribute', t => {
    const dom = new DOM('<p class="foo">Foo</p><div id="bar">Bar</div>', {fragment: true});
    t.same(dom.attr.class, null);
    t.equal(dom.at('p').attr.class, 'foo');
    t.equal(dom.at('p').attr['class'], 'foo');
    t.same(dom.at('p').attr.id, null);
    t.equal(dom.at('[id]').attr.id, 'bar');
    t.same(dom.at('[id]').attr.class, null);
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

  t.end();
});
