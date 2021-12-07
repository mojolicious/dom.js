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
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].attrs[0].name, 'class');
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].attrs[0].value, 'foo');
    t.same(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].attrs[1], undefined);
    t.same(dom.currentNode.childNodes[1].childNodes[1].childNodes[1], undefined);
    t.ok(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[0].value, 'Mojo');
    t.same(dom.currentNode.childNodes[1].childNodes[1].childNodes[0].childNodes[1], undefined);
    t.same(dom.currentNode.childNodes[1].childNodes[2], undefined);
    t.same(dom.currentNode.childNodes[2], undefined);
    t.equal(dom.toString(), '<!DOCTYPE html><html><head></head><body><p class="foo">Mojo</p></body></html>');
    t.end();
  });

  t.test('HTML fragment', t => {
    const dom = new DOM('<p class="foo">Mojo</p><!-- Test -->', {fragment: true});
    t.ok(dom.currentNode instanceof FragmentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[0].tagName, 'p');
    t.equal(dom.currentNode.childNodes[0].attrs[0].name, 'class');
    t.equal(dom.currentNode.childNodes[0].attrs[0].value, 'foo');
    t.same(dom.currentNode.childNodes[0].attrs[1], undefined);
    t.ok(dom.currentNode.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, 'Mojo');
    t.ok(dom.currentNode.childNodes[1] instanceof CommentNode);
    t.equal(dom.currentNode.childNodes[1].value, ' Test ');
    t.same(dom.currentNode.childNodes[2], undefined);
    t.equal(dom.toString(), '<p class="foo">Mojo</p><!-- Test -->');
    t.end();
  });

  t.test('XML document', t => {
    const dom = new DOM('<link>http://mojolicious.org</link>', {xml: true});
    t.ok(dom.currentNode instanceof DocumentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[0].tagName, 'link');
    t.ok(dom.currentNode.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, 'http://mojolicious.org');
    t.same(dom.currentNode.childNodes[0].childNodes[1], undefined);
    t.same(dom.currentNode.childNodes[1], undefined);
    t.equal(dom.toString(), '<link>http://mojolicious.org</link>');
    t.equal(dom.toString({xml: false}), '<link>');
    t.end();
  });

  t.test('Entities', t => {
    const dom = new DOM('<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>', {fragment: true});
    t.equal(dom.currentNode.childNodes[0].attrs[0].value, '<foo>');
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom.toString(), '<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>');

    const dom2 = new DOM('<link class="&lt;foo&gt;">&lt;Mojo&gt;</link>', {xml: true});
    t.equal(dom2.currentNode.childNodes[0].attrs[0].value, '<foo>');
    t.equal(dom2.currentNode.childNodes[0].childNodes[0].value, '<Mojo>');
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
    const dom = new DOM('<p>Hello Mojo<b>!</b></p>', {fragment: true});
    t.equal(dom.text(), '');
    t.equal(dom.text({recursive: true}), 'Hello Mojo!');
    t.equal(dom.at('p').text(), 'Hello Mojo');
    t.equal(dom.at('p').text({recursive: true}), 'Hello Mojo!');
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
    t.equal(
      dom.text({recursive: true}),
      `
      
      
        test
        easy
        
        
        works well
         yada yada
        
        
        < very broken
        
        more text
      `
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

  t.test('Replace elements', t => {
    const dom = new DOM('<div>foo<p>lalala</p>bar</div>', {fragment: true});
    dom.at('p').replace('<foo>bar</foo>');
    t.equal(dom.toString(), '<div>foo<foo>bar</foo>bar</div>');
    dom.at('foo').replace(new DOM('text', {fragment: true}));
    t.equal(dom.toString(), '<div>footextbar</div>');

    const dom2 = new DOM('<div>foo</div><div>bar</div>', {fragment: true});
    dom2.find('div').forEach(el => el.replace('<p>test</p>'));
    t.equal(dom2.toString(), '<p>test</p><p>test</p>');

    const dom3 = new DOM('<div>foo<p>lalala</p>bar</div>', {fragment: true});
    t.equal(dom3.at('div').content(), 'foo<p>lalala</p>bar');
    dom3.at('p').replace('♥');
    t.equal(dom3.toString(), '<div>foo♥bar</div>');
    t.equal(dom3.at('div').content(), 'foo♥bar');

    const dom4 = new DOM('<div>foo<p>lalala</p>bar</div>', {fragment: true});
    dom4.at('p').replace('');
    t.equal(dom4.toString(), '<div>foobar</div>');

    const dom5 = new DOM('A<div>B<p>C<b>D<i><u>E</u></i>F</b>G</p><div>H</div></div>I', {fragment: true});
    dom5.find(':not(div):not(i):not(u)').forEach(el => el.strip());
    t.equal(dom5.toString(), 'A<div>BCG<div>H</div></div>I');

    const dom6 = new DOM('<div><div>A</div><div>B</div>C</div>', {fragment: true});
    t.equal(dom6.at('div').at('div').text(), 'A');
    dom6
      .at('div')
      .find('div')
      .forEach(el => el.strip());
    t.equal(dom6.toString(), '<div>ABC</div>');

    t.end();
  });

  t.test('Pseudo-classes', t => {
    const dom = new DOM(
      `
      <form action="/foo">
        <input type="text" name="user" value="test" />
        <input type="checkbox" checked="checked" name="groovy">
        <select name="a">
            <option value="b">b</option>
            <optgroup label="c">
                <option value="d">d</option>
                <option selected="selected" value="e">E</option>
                <option value="f">f</option>
            </optgroup>
            <option value="g">g</option>
            <option selected value="h">H</option>
        </select>
        <input type="submit" value="Ok!" />
        <input type="checkbox" checked name="I">
        <p id="content">test 123</p>
        <p id="no_content"><? test ?><!-- 123 --></p>
      </form>`,
      {fragment: true}
    );

    t.equal(dom.find(':root')[0].tag, 'form');
    t.equal(dom.find('*:root')[0].tag, 'form');
    t.equal(dom.find('form:root')[0].tag, 'form');
    t.same(dom.find(':root')[1], null);

    t.equal(dom.find(':checked')[0].attr.name, 'groovy');
    t.equal(dom.find('option:checked')[0].attr.value, 'e');
    t.equal(dom.find(':checked')[1].text(), 'E');
    t.equal(dom.find('*:checked')[1].text(), 'E');
    t.equal(dom.find(':checked')[2].text(), 'H');
    t.equal(dom.find(':checked')[3].attr.name, 'I');
    t.same(dom.find(':checked')[4], null);
    t.equal(dom.find('option[selected]')[0].attr.value, 'e');
    t.equal(dom.find('option[selected]')[1].text(), 'H');
    t.same(dom.find('option[selected]')[2], null);
    t.equal(dom.find(':checked[value="e"]')[0].text(), 'E');
    t.equal(dom.find('*:checked[value="e"]')[0].text(), 'E');
    t.equal(dom.find('option:checked[value="e"]')[0].text(), 'E');
    t.equal(dom.at('optgroup option:checked[value="e"]').text(), 'E');
    t.equal(dom.at('select option:checked[value="e"]').text(), 'E');
    t.equal(dom.at('select :checked[value="e"]').text(), 'E');
    t.equal(dom.at('optgroup > :checked[value="e"]').text(), 'E');
    t.equal(dom.at('select *:checked[value="e"]').text(), 'E');
    t.equal(dom.at('optgroup > *:checked[value="e"]').text(), 'E');
    t.same(dom.find(':checked[value="e"]')[1], null);

    t.equal(dom.find(':empty')[0].attr.name, 'user');
    t.equal(dom.find('input:empty')[0].attr.name, 'user');
    t.equal(dom.at(':empty[type^="ch"]').attr.name, 'groovy');
    t.equal(dom.at('p').attr.id, 'content');
    t.equal(dom.at('p:empty').attr.id, 'no_content');

    t.end();
  });

  t.test('More pseudo-classes', t => {
    const dom = new DOM(
      `
      <ul>
        <li>A</li>
        <li>B</li>
        <li>C</li>
        <li>D</li>
        <li>E</li>
        <li>F</li>
        <li>G</li>
        <li>H</li>
      </ul>`,
      {fragment: true}
    );

    t.same(
      dom.find('li:nth-child(even)').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-child(   Even )').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-child(odd)').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-child(  ODD  )').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-last-child(odd)').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-last-child(even)').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );

    t.equal(dom.find(':nth-child(odd)')[0].tag, 'ul');
    t.equal(dom.find(':nth-child(odd)')[1].text(), 'A');
    t.equal(dom.find(':nth-child(1)')[0].tag, 'ul');
    t.equal(dom.find(':nth-child(1)')[1].text(), 'A');
    t.equal(dom.find(':nth-child(  1  )')[1].text(), 'A');
    t.equal(dom.find(':nth-child(+1)')[1].text(), 'A');
    t.equal(dom.find(':nth-last-child(odd)')[0].tag, 'ul');
    t.equal(dom.find(':nth-last-child(odd)')[4].text(), 'H');
    t.equal(dom.find(':nth-last-child(1)')[0].tag, 'ul');
    t.equal(dom.find(':nth-last-child(1)')[1].text(), 'H');

    t.same(
      dom.find('li:nth-child(2n+1)').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-child(2n + 1)').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-last-child(2n+1)').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-child(even)').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-last-child( even )').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-child(2n+2)').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-child( 2N + 2 )').map(el => el.text()),
      ['B', 'D', 'F', 'H']
    );
    t.same(
      dom.find('li:nth-last-child(2n+2)').map(el => el.text()),
      ['A', 'C', 'E', 'G']
    );
    t.same(
      dom.find('li:nth-child(4n+1)').map(el => el.text()),
      ['A', 'E']
    );
    t.same(
      dom.find('li:nth-last-child(4n+1)').map(el => el.text()),
      ['D', 'H']
    );
    t.same(
      dom.find('li:nth-child(4n+4)').map(el => el.text()),
      ['D', 'H']
    );
    t.same(
      dom.find('li:nth-last-child(4n+4)').map(el => el.text()),
      ['A', 'E']
    );
    t.same(
      dom.find('li:nth-child(4n)').map(el => el.text()),
      ['D', 'H']
    );
    t.same(
      dom.find('li:nth-child( 4n )').map(el => el.text()),
      ['D', 'H']
    );
    t.same(
      dom.find('li:nth-last-child(4n)').map(el => el.text()),
      ['A', 'E']
    );
    t.same(
      dom.find('li:nth-child(5n-2)').map(el => el.text()),
      ['C', 'H']
    );
    t.same(
      dom.find('li:nth-child( 5n - 2 )').map(el => el.text()),
      ['C', 'H']
    );
    t.same(
      dom.find('li:nth-last-child(5n-2)').map(el => el.text()),
      ['A', 'F']
    );
    t.same(
      dom.find('li:nth-child(-n+3)').map(el => el.text()),
      ['A', 'B', 'C']
    );
    t.same(
      dom.find('li:nth-child( -n + 3 )').map(el => el.text()),
      ['A', 'B', 'C']
    );
    t.same(
      dom.find('li:nth-last-child(-n+3)').map(el => el.text()),
      ['F', 'G', 'H']
    );
    t.same(
      dom.find('li:nth-child(-1n+3)').map(el => el.text()),
      ['A', 'B', 'C']
    );
    t.same(
      dom.find('li:nth-last-child(-1n+3)').map(el => el.text()),
      ['F', 'G', 'H']
    );
    t.same(
      dom.find('li:nth-child(3n)').map(el => el.text()),
      ['C', 'F']
    );
    t.same(
      dom.find('li:nth-last-child(3n)').map(el => el.text()),
      ['C', 'F']
    );
    t.same(
      dom.find('li:nth-child(3)').map(el => el.text()),
      ['C']
    );
    t.same(
      dom.find('li:nth-last-child(+3)').map(el => el.text()),
      ['F']
    );
    t.same(
      dom.find('li:nth-child(1n+0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(1n-0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(n+0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(n)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(n)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(n+0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(N+0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );
    t.same(
      dom.find('li:nth-child(N+0)').map(el => el.text()),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    );

    t.equal(dom.find('li:nth-child(0n+0)').length, 0);
    t.equal(dom.find('li:nth-child(0)').length, 0);
    t.equal(dom.find('li:nth-child()').length, 0);
    t.equal(dom.find('li:nth-child(whatever)').length, 0);

    t.end();
  });

  t.test('Even more pseudo-classes', t => {
    const dom = new DOM(
      `
      <ul>
        <li>A</li>
        <p>B</p>
        <li class="test ♥">C</li>
        <p>D</p>
        <li>E</li>
        <li>F</li>
        <p>G</p>
        <li>H</li>
        <li>I</li>
      </ul>
      <div>
          <div class="☃">J</div>
      </div>
      <div>
          <a href="http://mojolicious.org">Mojo!</a>
          <div class="☃">K</div>
          <a href="http://mojolicious.org">Mojolicious!</a>
      </div>`,
      {fragment: true}
    );

    t.same(
      dom.find('li:nth-last-child(-n+2)').map(el => el.text()),
      ['H', 'I']
    );
    t.same(
      dom.find('ul :nth-child(odd)').map(el => el.text()),
      ['A', 'C', 'E', 'G', 'I']
    );
    t.same(
      dom.find('li:first-child').map(el => el.text()),
      ['A']
    );
    t.same(
      dom.find('p:first-of-type').map(el => el.text()),
      ['B']
    );
    t.same(
      dom.find('p:last-of-type').map(el => el.text()),
      ['G']
    );
    t.same(
      dom.find('li:last-child').map(el => el.text()),
      ['I']
    );
    t.same(
      dom.find('li:nth-of-type(odd)').map(el => el.text()),
      ['A', 'E', 'H']
    );
    t.same(
      dom.find('ul li:not(:first-child, :last-child)').map(el => el.text()),
      ['C', 'E', 'F', 'H']
    );
    t.same(
      dom.find('ul li:is(:first-child, :last-child)').map(el => el.text()),
      ['A', 'I']
    );
    t.same(
      dom.find('li:nth-last-of-type( odd )').map(el => el.text()),
      ['C', 'F', 'I']
    );
    t.same(
      dom.find('p:nth-of-type(odd)').map(el => el.text()),
      ['B', 'G']
    );
    t.same(
      dom.find('p:nth-last-of-type(odd)').map(el => el.text()),
      ['B', 'G']
    );
    t.same(
      dom.find('ul :nth-child(1)').map(el => el.text()),
      ['A']
    );
    t.same(
      dom.find('ul :first-child').map(el => el.text()),
      ['A']
    );
    t.same(
      dom.find('p:nth-of-type(1)').map(el => el.text()),
      ['B']
    );
    t.same(
      dom.find('p:first-of-type').map(el => el.text()),
      ['B']
    );
    t.same(
      dom.find('li:nth-of-type(1)').map(el => el.text()),
      ['A']
    );
    t.same(
      dom.find('li:first-of-type').map(el => el.text()),
      ['A']
    );
    t.same(
      dom.find('ul :nth-last-child(-n+1)').map(el => el.text()),
      ['I']
    );
    t.same(
      dom.find('ul :last-child').map(el => el.text()),
      ['I']
    );
    t.same(
      dom.find('p:nth-last-of-type(-n+1)').map(el => el.text()),
      ['G']
    );
    t.same(
      dom.find('li:nth-last-of-type(-n+1)').map(el => el.text()),
      ['I']
    );
    t.same(
      dom.find('li:last-of-type').map(el => el.text()),
      ['I']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(li)').map(el => el.text()),
      ['B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(:first-child)').map(el => el.text()),
      ['B', 'C']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(.♥)').map(el => el.text()),
      ['A', 'B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not([class$="♥"])').map(el => el.text()),
      ['A', 'B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(li[class$="♥"])').map(el => el.text()),
      ['A', 'B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not([class$="♥"][class^="test"])').map(el => el.text()),
      ['A', 'B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(*[class$="♥"])').map(el => el.text()),
      ['A', 'B']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(:nth-child(-n+2))').map(el => el.text()),
      ['C']
    );
    t.same(
      dom.find('ul :nth-child(-n+3):not(:nth-child(1)):not(:nth-child(2))').map(el => el.text()),
      ['C']
    );
    t.same(
      dom.find(':only-child').map(el => el.text()),
      ['J']
    );
    t.same(
      dom.find('div :only-of-type').map(el => el.text()),
      ['J', 'K']
    );
    t.same(
      dom.find('div:only-child').map(el => el.text()),
      ['J']
    );
    t.same(
      dom.find('div div:only-of-type').map(el => el.text()),
      ['J', 'K']
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
    t.same(
      dom
        .at('title')
        .ancestors('channel')
        .map(el => el.tag),
      ['channel']
    );
    t.same(
      dom
        .at('item')
        .preceding('generator, link')
        .map(el => el.tag),
      ['link', 'generator']
    );
    t.same(
      dom
        .at('title')
        .following('generator, link')
        .map(el => el.tag),
      ['link', 'generator']
    );
    t.same(
      dom
        .at('channel')
        .children('description, link')
        .map(el => el.tag),
      ['link', 'description']
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

  t.test('Links', t => {
    const dom = new DOM(
      `
      <a>A</a>
      <a href=/>B</a>
      <link rel=C>
      <link href=/ rel=D>
      <area alt=E>
      <area href=/ alt=F>
      <div href=borked>very borked</div>`,
      {fragment: true}
    );

    t.equal(
      dom
        .find(':any-link')
        .map(el => el.tag)
        .join(','),
      'a,link,area'
    );
    t.equal(
      dom
        .find(':link')
        .map(el => el.tag)
        .join(','),
      'a,link,area'
    );
    t.equal(
      dom
        .find(':visited')
        .map(el => el.tag)
        .join(','),
      'a,link,area'
    );

    t.equal(dom.at('a:link').text(), 'B');
    t.equal(dom.at('a:any-link').text(), 'B');
    t.equal(dom.at('a:visited').text(), 'B');
    t.equal(dom.at('link:any-link').attr.rel, 'D');
    t.equal(dom.at('link:link').attr.rel, 'D');
    t.equal(dom.at('link:visited').attr.rel, 'D');
    t.equal(dom.at('area:link').attr.alt, 'F');
    t.equal(dom.at('area:any-link').attr.alt, 'F');
    t.equal(dom.at('area:visited').attr.alt, 'F');

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

  t.test('Text matching', t => {
    const dom = new DOM(
      `
      <p>Zero</p>
      <div>
        <p>One&lt;Two&gt;</p>
        <div>Two<!-- Three -->Four</div>
        <p>Five Six<a href="#">Seven</a>Eight</p>
      </div>`,
      {fragment: true}
    );

    t.equal(dom.at(':text(ero)').text(), 'Zero');
    t.equal(dom.at(':text(Zero)').text(), 'Zero');
    t.equal(dom.at('p:text(Zero)').text(), 'Zero');
    t.same(dom.at('div:text(Zero)'), null);
    t.equal(dom.at('p:text(w)').text(), 'One<Two>');
    t.equal(dom.at(':text(<Two>)').text(), 'One<Two>');
    t.equal(dom.at(':text(Sev)').text(), 'Seven');
    t.equal(dom.at(':text(/^Seven$/)').text(), 'Seven');
    t.equal(dom.at('p a:text(even)').text(), 'Seven');
    t.equal(dom.at(':text(v) :text(e)').text(), 'Seven');
    t.equal(dom.at(':text(eight)').text({recursive: true}), 'Five SixSevenEight');
    t.equal(dom.at(':text(/Ei.ht/)').text({recursive: true}), 'Five SixSevenEight');
    t.equal(dom.at(':text(/ei.ht/i)').text({recursive: true}), 'Five SixSevenEight');
    t.equal(dom.at(':text(/zero/i)').text(), 'Zero');
    t.equal(dom.at(':text(/z\\w+/i)').text(), 'Zero');
    t.same(dom.at(':text(v) :text(x)'), null);
    t.same(dom.at('div:text(x)'), null);
    t.same(dom.at(':text(three)'), null);
    t.same(dom.at(':text(/three/)'), null);
    t.same(dom.at(':text(/zero/)'), null);

    t.end();
  });

  t.test('Wrap elements', t => {
    const dom = new DOM('<a>Test</a>', {xml: true});

    t.equal(`${dom}`, '<a>Test</a>');
    dom.at('a').wrap('<b></b>');
    t.equal(dom.toString(), '<b><a>Test</a></b>');
    dom.at('a').wrap('C<c><d>D</d><e>E</e></c>F');
    t.equal(dom.toString(), '<b>C<c><d>D<a>Test</a></d><e>E</e></c>F</b>');

    t.end();
  });

  t.test('Wrap content', t => {
    const dom = new DOM('<a>Test</a>', {xml: true});

    t.equal(`${dom}`, '<a>Test</a>');
    dom.wrapContent('<b></b>');
    t.equal(dom.toString(), '<b><a>Test</a></b>');
    dom.at('a').wrapContent('1<e c="d"></e>');
    t.equal(dom.toString(), '<b><a>1<e c="d">Test</e></a></b>');
    dom.at('a').wrapContent('C<c><d>D</d><e>E</e></c>F');
    t.equal(dom.toString(), '<b><a>C<c><d>1<e c="d">Test</e>D</d><e>E</e></c>F</a></b>');

    t.end();
  });

  t.test('Unicode and escaped selectors', t => {
    const dom = new DOM('<html><div id="☃x">Snowman</div><div class="x ♥">Heart</div></html>');

    t.equal(dom.at('#\\n\\002603x').text(), 'Snowman');
    t.equal(dom.at('#\\2603 x').text(), 'Snowman');
    t.equal(dom.at('#\\n\\2603 x').text(), 'Snowman');
    t.equal(dom.at('[id="\\n\\2603 x"]').text(), 'Snowman');
    t.equal(dom.at('[id="\\n\\002603x"]').text(), 'Snowman');
    t.equal(dom.at('[id="\\2603 x"]').text(), 'Snowman');
    t.equal(dom.at('html #\\n\\002603x').text(), 'Snowman');
    t.equal(dom.at('html #\\2603 x').text(), 'Snowman');
    t.equal(dom.at('html #\\n\\2603 x').text(), 'Snowman');
    t.equal(dom.at('html [id="\\n\\2603 x"]').text(), 'Snowman');
    t.equal(dom.at('html [id="\\n\\002603x"]').text(), 'Snowman');
    t.equal(dom.at('html [id="\\2603 x"]').text(), 'Snowman');
    t.equal(dom.at('#☃x').text(), 'Snowman');
    t.equal(dom.at('div#☃x').text(), 'Snowman');
    t.equal(dom.at('html div#☃x').text(), 'Snowman');
    t.equal(dom.at('[id^="☃"]').text(), 'Snowman');
    t.equal(dom.at('div[id^="☃"]').text(), 'Snowman');
    t.equal(dom.at('html div[id^="☃"]').text(), 'Snowman');
    t.equal(dom.at('html > body > div[id^="☃"]').text(), 'Snowman');
    t.equal(dom.at('[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('div[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('html div[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('html > body > div[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('.\\n\\002665').text(), 'Heart');
    t.equal(dom.at('.\\2665').text(), 'Heart');
    t.equal(dom.at('html .\\n\\002665').text(), 'Heart');
    t.equal(dom.at('html .\\2665').text(), 'Heart');
    t.equal(dom.at('html [class$="\\n\\002665"]').text(), 'Heart');
    t.equal(dom.at('html [class$="\\2665"]').text(), 'Heart');
    t.equal(dom.at('[class$="\\n\\002665"]').text(), 'Heart');
    t.equal(dom.at('[class$="\\2665"]').text(), 'Heart');
    t.equal(dom.at('.x').text(), 'Heart');
    t.equal(dom.at('html .x').text(), 'Heart');
    t.equal(dom.at('.♥').text(), 'Heart');
    t.equal(dom.at('html .♥').text(), 'Heart');
    t.equal(dom.at('div.♥').text(), 'Heart');
    t.equal(dom.at('html div.♥').text(), 'Heart');
    t.equal(dom.at('[class$="♥"]').text(), 'Heart');
    t.equal(dom.at('div[class$="♥"]').text(), 'Heart');
    t.equal(dom.at('html div[class$="♥"]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class$="♥"]').text(), 'Heart');
    t.equal(dom.at('[class$=♥]').text(), 'Heart');
    t.equal(dom.at('div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('html div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('html div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('[class~=♥]').text(), 'Heart');
    t.equal(dom.at('div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('html div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('[class~="x"]').text(), 'Heart');
    t.equal(dom.at('div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('html div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('[class~=x]').text(), 'Heart');
    t.equal(dom.at('div[class~=x]').text(), 'Heart');
    t.equal(dom.at('html div[class~=x]').text(), 'Heart');
    t.equal(dom.at('html > body > div[class~=x]').text(), 'Heart');

    t.end();
  });

  t.test('Form values', t => {
    const dom = new DOM(
      `
      <form action="/foo">
        <p>Test</p>
        <input type="text" name="a" value="A" />
        <input type="checkbox" name="q">
        <input type="checkbox" checked name="b" value="B">
        <input type="radio" name="r">
        <input type="radio" checked name="c" value="C">
        <input name="s">
        <input type="checkbox" name="t" value="">
        <input type=text name="u">
        <select multiple name="f">
          <option value="F">G</option>
          <optgroup>
            <option>H</option>
            <option selected>I</option>
            <option selected disabled>V</option>
          </optgroup>
          <option value="J" selected>K</option>
          <optgroup disabled>
            <option selected>I2</option>
          </optgroup>
        </select>
        <select name="n"><option>N</option></select>
        <select multiple name="q"><option>Q</option></select>
        <select name="y" disabled>
          <option selected>Y</option>
        </select>
        <select name="d">
          <option selected>R</option>
          <option selected>D</option>
        </select>
        <textarea name="m">M</textarea>
        <button name="o" value="O">No!</button>
        <input type="submit" name="p" value="P" />
      </form>`,
      {fragment: true}
    );

    t.same(dom.at('p').val(), null);
    t.equal(dom.at('input').val(), 'A');
    t.equal(dom.at('input:checked').val(), 'B');
    t.equal(dom.at('input:checked[type=radio]').val(), 'C');
    t.same(dom.at('select').val(), ['I', 'J']);
    t.equal(dom.at('select option').val(), 'F');
    t.equal(dom.at('select optgroup option:not([selected])').val(), 'H');
    t.equal(dom.find('select')[1].at('option').val(), 'N');
    t.same(dom.find('select')[1].val(), null);
    t.same(dom.find('select')[2].val(), null);
    t.equal(dom.find('select')[2].at('option').val(), 'Q');
    t.equal(dom.at('select[disabled]').val(), 'Y');
    t.equal(dom.find('select')[4].val(), 'D');
    t.equal(dom.find('select')[4].at('option').val(), 'R');
    t.equal(dom.at('textarea').val(), 'M');
    t.equal(dom.at('button').val(), 'O');
    t.equal(dom.at('form').find('input')[8].val(), 'P');
    t.equal(dom.at('input[name=q]').val(), 'on');
    t.equal(dom.at('input[name=r]').val(), 'on');
    t.same(dom.at('input[name=s]').val(), null);
    t.equal(dom.at('input[name=t]').val(), '');
    t.same(dom.at('input[name=u]').val(), null);

    t.end();
  });

  t.test('Namespaces', t => {
    const dom = new DOM(
      `
      <?xml version="1.0"?>
      <bk:book xmlns='uri:default-ns'
              xmlns:bk='uri:book-ns'
              xmlns:isbn='uri:isbn-ns'>
        <bk:title>Programming Perl</bk:title>
        <comment>rocks!</comment>
        <nons xmlns=''>
          <section>Nothing</section>
        </nons>
        <meta xmlns='uri:meta-ns'>
          <isbn:number>978-0596000271</isbn:number>
        </meta>
      </bk:book>`,
      {xml: true}
    );

    t.same(dom.namespace(), null);
    t.equal(dom.at('book comment').namespace(), 'uri:default-ns');
    t.equal(dom.at('book comment').text(), 'rocks!');
    t.equal(dom.at('book nons section').namespace(), '');
    t.equal(dom.at('book nons section').text(), 'Nothing');
    t.equal(dom.at('book meta number').namespace(), 'uri:isbn-ns');
    t.equal(dom.at('book meta number').text(), '978-0596000271');
    t.equal(dom.children('book')[0].attr.xmlns, 'uri:default-ns');
    t.same(dom.children('k:book')[0], null);
    t.same(dom.children('ook')[0], null);
    t.same(dom.at('k:book'), null);
    t.same(dom.at('ook'), null);
    t.equal(dom.at('[bk]').attr['xmlns:bk'], 'uri:book-ns');
    t.same(dom.at('[bk]').attr['s:bk'], null);
    t.same(dom.at('[bk]').attr['bk'], null);
    t.same(dom.at('[bk]').attr['k'], null);
    t.same(dom.at('[k]'), null);
    t.equal(dom.at('number').ancestors('meta')[0].attr.xmlns, 'uri:meta-ns');
    t.same(dom.at('nons').matches('book > nons'), true);
    t.same(dom.at('title').matches('book > nons > section'), false);

    t.end();
  });

  t.test('Yadis', t => {
    const dom = new DOM(
      `
      <?xml version="1.0" encoding="UTF-8"?>
      <XRDS xmlns="xri://$xrds">
        <XRD xmlns="xri://$xrd*($v*2.0)">
          <Service>
            <Type>http://o.r.g/sso/2.0</Type>
          </Service>
          <Service>
            <Type>http://o.r.g/sso/1.0</Type>
          </Service>
        </XRD>
      </XRDS>`,
      {xml: true}
    );

    t.equal(dom.at('XRDS').namespace(), 'xri://$xrds');
    t.equal(dom.at('XRD').namespace(), 'xri://$xrd*($v*2.0)');
    const service = dom.find('XRDS XRD Service');
    t.equal(service[0].at('Type').text(), 'http://o.r.g/sso/2.0');
    t.equal(service[0].namespace(), 'xri://$xrd*($v*2.0)');
    t.equal(service[1].at('Type').text(), 'http://o.r.g/sso/1.0');
    t.equal(service[1].namespace(), 'xri://$xrd*($v*2.0)');
    t.same(service[2], null);
    t.equal(service.length, 2);

    t.end();
  });

  t.test('Yadis (roundtrip with namespace)', t => {
    const yadis = `
    <?xml version="1.0" encoding="UTF-8"?>
    <xrds:XRDS xmlns="xri://$xrd*($v*2.0)" xmlns:xrds="xri://$xrds">
      <XRD>
        <Service>
          <Type>http://o.r.g/sso/3.0</Type>
        </Service>
        <xrds:Service>
          <Type>http://o.r.g/sso/4.0</Type>
        </xrds:Service>
      </XRD>
      <XRD>
        <Service>
          <Type test="23">http://o.r.g/sso/2.0</Type>
        </Service>
        <Service>
          <Type Test="23" test="24">http://o.r.g/sso/1.0</Type>
        </Service>
      </XRD>
    </xrds:XRDS>`;
    const dom = new DOM(yadis, {xml: true});

    t.equal(dom.at('XRDS').namespace(), 'xri://$xrds');
    t.equal(dom.at('XRD').namespace(), 'xri://$xrd*($v*2.0)');
    const service = dom.find('XRDS XRD Service');
    t.equal(service[0].at('Type').text(), 'http://o.r.g/sso/3.0');
    t.equal(service[0].namespace(), 'xri://$xrd*($v*2.0)');
    t.equal(service[1].at('Type').text(), 'http://o.r.g/sso/4.0');
    t.equal(service[1].namespace(), 'xri://$xrds');
    t.equal(service[2].at('Type').text(), 'http://o.r.g/sso/2.0');
    t.equal(service[2].namespace(), 'xri://$xrd*($v*2.0)');
    t.equal(service[3].at('Type').text(), 'http://o.r.g/sso/1.0');
    t.equal(service[3].namespace(), 'xri://$xrd*($v*2.0)');
    t.same(service[4], null);
    t.equal(service.length, 4);
    t.equal(dom.at('[Test="23"]').text(), 'http://o.r.g/sso/1.0');
    t.equal(dom.at('[test="23"]').text(), 'http://o.r.g/sso/2.0');
    t.equal(dom.toString(), yadis);

    t.end();
  });

  t.end();
});
