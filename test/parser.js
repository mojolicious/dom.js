import {Parser} from './support/parse5.js';
import DOM, {CommentNode, DoctypeNode, DocumentNode, ElementNode, FragmentNode, TextNode} from '../lib/dom.js';
import t from 'tap';

t.test('DOM', t => {
  const parser = new Parser();

  t.test('HTML document', t => {
    const dom = new DOM('<!DOCTYPE html><p class="foo">Mojo</p>', {parser});

    t.ok(dom.currentNode instanceof DocumentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof DoctypeNode);
    t.ok(dom.currentNode.childNodes[1] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[1].tagName, 'html');
    t.ok(dom.currentNode.childNodes[1].childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[1].childNodes[0].tagName, 'head');
    t.ok(dom.currentNode.childNodes[1].childNodes[1] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[1].childNodes[1].tagName, 'body');
    t.ok(dom.currentNode.childNodes[1].childNodes[1].childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].tagName, 'p');
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].attributes.class, 'foo');
    t.same(dom.currentNode.childNodes[1].childNodes[1].childNodes[1], undefined);
    t.ok(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[0].value, 'Mojo');
    t.same(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[1], undefined);
    t.same(dom.currentNode.childNodes[1].childNodes[2], undefined);
    t.same(dom.currentNode.childNodes[2], undefined);

    t.equal(dom.toString(), '<!DOCTYPE html><html><head></head><body><p class="foo">Mojo</p></body></html>');
    t.equal(
      new DOM(dom.currentNode.clone()).toString(),
      '<!DOCTYPE html><html><head></head><body><p class="foo">Mojo</p></body></html>'
    );

    t.end();
  });

  t.test('HTML fragment', t => {
    const dom = new DOM('<p class="foo">Mojo</p><!-- Test -->', {fragment: true, parser});

    t.ok(dom.currentNode instanceof FragmentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[0].tagName, 'p');
    t.equal(dom.currentNode.childNodes[0].attributes.class, 'foo');
    t.ok(dom.currentNode.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, 'Mojo');
    t.ok(dom.currentNode.childNodes[1] instanceof CommentNode);
    t.equal(dom.currentNode.childNodes[1].value, ' Test ');
    t.same(dom.currentNode.childNodes[2], undefined);

    t.equal(dom.toString(), '<p class="foo">Mojo</p><!-- Test -->');
    t.equal(new DOM(dom.currentNode.clone()).toString(), '<p class="foo">Mojo</p><!-- Test -->');

    t.end();
  });

  t.end();
});
