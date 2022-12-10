import DOM, {CDATANode, CommentNode, ElementNode, FragmentNode, PINode, TextNode} from '../lib/dom.js';
import {SafeString} from '@mojojs/util';
import t from 'tap';

t.test('DOM', t => {
  t.test('HTML fragment', t => {
    const dom = new DOM('<p class="foo">Mojo</p><!-- Test -->', {fragment: true});

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

  t.test('HTML fragment (<template>)', t => {
    const dom = new DOM('<p>Mojo</p><template><div>Hello</div></template>');

    t.ok(dom.currentNode instanceof FragmentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[0].tagName, 'p');
    t.ok(dom.currentNode.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, 'Mojo');
    t.ok(dom.currentNode.childNodes[1] instanceof ElementNode);
    t.ok(dom.currentNode.childNodes[1].content instanceof FragmentNode);
    t.ok(dom.currentNode.childNodes[1].content.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[1].content.childNodes[0].tagName, 'div');
    t.ok(dom.currentNode.childNodes[1].content.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[1].content.childNodes[0].childNodes[0].value, 'Hello');
    t.same(dom.currentNode.childNodes[2], undefined);

    t.equal(dom.toString(), '<p>Mojo</p><template><div>Hello</div></template>');
    t.equal(new DOM(dom.currentNode.clone()).toString(), '<p>Mojo</p><template><div>Hello</div></template>');

    t.end();
  });

  t.test('XML document', t => {
    const dom = new DOM('<link>http://mojolicious.org<?just a test?><![CDATA[another test]]></link>', {xml: true});

    t.ok(dom.currentNode instanceof FragmentNode);
    t.ok(dom.currentNode.childNodes[0] instanceof ElementNode);
    t.equal(dom.currentNode.childNodes[0].tagName, 'link');
    t.ok(dom.currentNode.childNodes[0].childNodes[0] instanceof TextNode);
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, 'http://mojolicious.org');
    t.ok(dom.currentNode.childNodes[0].childNodes[1] instanceof PINode);
    t.equal(dom.currentNode.childNodes[0].childNodes[1].value, 'just a test');
    t.ok(dom.currentNode.childNodes[0].childNodes[2] instanceof CDATANode);
    t.equal(dom.currentNode.childNodes[0].childNodes[2].value, 'another test');
    t.same(dom.currentNode.childNodes[0].childNodes[3], undefined);
    t.same(dom.currentNode.childNodes[1], undefined);

    t.equal(dom.toString(), '<link>http://mojolicious.org<?just a test?><![CDATA[another test]]></link>');
    t.equal(
      new DOM(dom.currentNode.clone(), {xml: true}).toString(),
      '<link>http://mojolicious.org<?just a test?><![CDATA[another test]]></link>'
    );
    t.equal(dom.toString({xml: false}), '<link>');

    t.end();
  });

  t.test('Entities', t => {
    const dom = new DOM('<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>');
    t.equal(dom.currentNode.childNodes[0].attributes.class, '<foo>');
    t.equal(dom.currentNode.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom.toString(), '<p class="&lt;foo&gt;">&lt;Mojo&gt;</p>');

    const dom2 = new DOM('<link class="&lt;foo&gt;">&lt;Mojo&gt;</link>', {xml: true});
    t.equal(dom2.currentNode.childNodes[0].attributes.class, '<foo>');
    t.equal(dom2.currentNode.childNodes[0].childNodes[0].value, '<Mojo>');
    t.equal(dom2.toString(), '<link class="&lt;foo&gt;">&lt;Mojo&gt;</link>');

    t.end();
  });

  t.test('Tag', t => {
    const dom = new DOM('<p class="foo">Foo</p><div>Bar</div>');
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
    const dom = new DOM('<p class="foo">Foo</p><div id="bar">Bar</div>');
    t.same(dom.attr.class, null);
    t.same(Object.keys(dom.attr), []);
    t.equal(dom.at('p').attr.class, 'foo');
    t.equal(dom.at('p').attr['class'], 'foo');
    t.same(dom.at('p').attr.id, null);
    t.same(Object.keys(dom.at('p').attr), ['class']);
    t.equal(dom.at('[id]').attr.id, 'bar');
    t.same(dom.at('[id]').attr.class, null);
    t.same(Object.keys(dom.at('[id]').attr), ['id']);

    const dom2 = new DOM('<p class="foo">Foo</p>');
    dom2.at('p').attr.class += 'bar';
    dom2.at('p').attr.id = 'baz';
    t.equal(dom2.toString(), '<p class="foobar" id="baz">Foo</p>');
    delete dom2.at('p').attr.class;
    t.equal(dom2.toString(), '<p id="baz">Foo</p>');

    t.end();
  });

  t.test('Text', t => {
    const dom = new DOM('<p>Hello Mojo<b>!</b></p>');
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
    const dom = new DOM('<p data-test data-two="data-two">Hello<br>Mojo!</p>');
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
    const dom = new DOM('<div>foo<p>lalala</p><br><i>bar</i></div>');
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

    dom.at('li').append('<p>A1</p>23').append(new DOM('22'));
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

    dom.at('li').prepend('24').prepend(new DOM('<div>A-1</div>25'));
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

    dom.appendContent('la').appendContent(new DOM('lal')).appendContent('a');
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

    dom.at('li').prependContent('A3<p>A2</p>').prependContent(new DOM('A4'));
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

    dom.at('div').appendContent(dom.at('p')).append(dom.at('ul ~ div'));
    t.equal(
      dom.toString(),
      `lalala
      <ul>
        24<div>A-1<p>A2</p></div><div>D</div>works25<li>A4A3<p>A2</p>A</li>22<p>A1</p>23
        <p>B</p>
        <li>C<p>C2</p>C3 C4C5</li>
      </ul>
      <div>D</div>workslalala`
    );

    t.end();
  });

  t.test('Replace elements', t => {
    const dom = new DOM('<div>foo<p>lalala</p>bar</div>');
    dom.at('p').replace('<foo>bar</foo>');
    t.equal(dom.toString(), '<div>foo<foo>bar</foo>bar</div>');
    dom.at('foo').replace(new DOM('text'));
    t.equal(dom.toString(), '<div>footextbar</div>');

    const dom2 = new DOM('<div>foo</div><div>bar</div>');
    dom2.find('div').forEach(el => el.replace('<p>test</p>'));
    t.equal(dom2.toString(), '<p>test</p><p>test</p>');

    const dom3 = new DOM('<div>foo<p>lalala</p>bar</div>');
    t.equal(dom3.at('div').content(), 'foo<p>lalala</p>bar');
    dom3.at('p').replace('♥');
    t.equal(dom3.toString(), '<div>foo♥bar</div>');
    t.equal(dom3.at('div').content(), 'foo♥bar');

    const dom4 = new DOM('<div>foo<p>lalala</p>bar</div>');
    dom4.at('p').replace('');
    t.equal(dom4.toString(), '<div>foobar</div>');

    const dom5 = new DOM('A<div>B<p>C<b>D<i><u>E</u></i>F</b>G</p><div>H</div></div>I');
    dom5.find(':not(div):not(i):not(u)').forEach(el => el.strip());
    t.equal(dom5.toString(), 'A<div>BCG<div>H</div></div>I');

    const dom6 = new DOM('<div><div>A</div><div>B</div>C</div>');
    t.equal(dom6.at('div').at('div').text(), 'A');
    dom6
      .at('div')
      .find('div')
      .forEach(el => el.strip());
    t.equal(dom6.toString(), '<div>ABC</div>');

    const dom7 = new DOM('<div><b>♥</b></div>');
    dom7.at('div').replaceContent('<i>☃</i>');
    t.equal(dom7.toString(), '<div><i>☃</i></div>');

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
    const dom = new DOM('<a href="http://example.com" id="foo" class="bar">Ok!</a>');
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

    dom.at('b').wrap(DOM.newTag('i'));
    t.equal(dom.toString(), '<i><b>C<c><d>D<a>Test</a></d><e>E</e></c>F</b></i>');

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

    dom.at('b').wrapContent(DOM.newTag('i'));
    t.equal(dom.toString(), '<b><i><a>C<c><d>1<e c="d">Test</e>D</d><e>E</e></c>F</a></i></b>');

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
    t.equal(dom.at('html > div[id^="☃"]').text(), 'Snowman');
    t.equal(dom.at('[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('div[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('html div[id^=☃]').text(), 'Snowman');
    t.equal(dom.at('html > div[id^=☃]').text(), 'Snowman');
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
    t.equal(dom.at('html > div[class$="♥"]').text(), 'Heart');
    t.equal(dom.at('[class$=♥]').text(), 'Heart');
    t.equal(dom.at('div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('html div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('html > div[class$=♥]').text(), 'Heart');
    t.equal(dom.at('[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('html div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('html > div[class~="♥"]').text(), 'Heart');
    t.equal(dom.at('[class~=♥]').text(), 'Heart');
    t.equal(dom.at('div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('html div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('html > div[class~=♥]').text(), 'Heart');
    t.equal(dom.at('[class~="x"]').text(), 'Heart');
    t.equal(dom.at('div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('html div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('html > div[class~="x"]').text(), 'Heart');
    t.equal(dom.at('[class~=x]').text(), 'Heart');
    t.equal(dom.at('div[class~=x]').text(), 'Heart');
    t.equal(dom.at('html div[class~=x]').text(), 'Heart');
    t.equal(dom.at('html > div[class~=x]').text(), 'Heart');

    t.end();
  });

  t.test('Generate selector', t => {
    const dom = new DOM(
      `
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <p id="a">A</p>
          <p id="b">B</p>
          <p id="c">C</p>
          <p id="d">D</p>
        </body>
      <html>`
    );

    t.same(dom.selector(), null);
    t.equal(dom.at('#a').selector(), 'html:nth-child(1) > body:nth-child(2) > p:nth-child(1)');
    t.equal(dom.at(dom.at('#a').selector()).text(), 'A');
    t.equal(dom.at('#b').selector(), 'html:nth-child(1) > body:nth-child(2) > p:nth-child(2)');
    t.equal(dom.at(dom.at('#b').selector()).text(), 'B');
    t.equal(dom.at('#c').selector(), 'html:nth-child(1) > body:nth-child(2) > p:nth-child(3)');
    t.equal(dom.at(dom.at('#c').selector()).text(), 'C');
    t.equal(dom.at('#d').selector(), 'html:nth-child(1) > body:nth-child(2) > p:nth-child(4)');
    t.equal(dom.at(dom.at('#d').selector()).text(), 'D');
    t.equal(dom.at('title').selector(), 'html:nth-child(1) > head:nth-child(1) > title:nth-child(1)');
    t.equal(dom.at(dom.at('title').selector()).text(), 'Test');
    t.equal(dom.at('html').selector(), 'html:nth-child(1)');

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

  t.test('Create tags', t => {
    t.equal(DOM.newTag('p', {}, 'Test').toString(), '<p>Test</p>');
    t.equal(DOM.newTag('p', 'Test').toString(), '<p>Test</p>');
    t.equal(DOM.newTag('p', new SafeString(DOM.newTag('i', 'Tes&t').toString())).toString(), '<p><i>Tes&amp;t</i></p>');
    t.equal(DOM.newTag('div').toString(), '<div></div>');
    t.equal(DOM.newTag('div', {id: 'foo', class: 'bar baz'}).toString(), '<div id="foo" class="bar baz"></div>');
    t.equal(
      DOM.newTag('div', {id: 'f&oo'}, new SafeString(DOM.newTag('i', {}, 'I ♥ Mojo&!').toString())).toString(),
      '<div id="f&amp;oo"><i>I ♥ Mojo&amp;!</i></div>'
    );

    t.equal(DOM.newTag('input', {type: 'checkbox', checked: ''}).toString(), '<input type="checkbox" checked>');
    t.equal(DOM.newTag('input', {type: 'checkbox', checked: true}).toString(), '<input type="checkbox" checked>');
    t.equal(DOM.newTag('input', {type: 'checkbox', checked: false}).toString(), '<input type="checkbox">');
    t.equal(
      DOM.newTag('input', {type: 'checkbox', checked: 'checked'}).toString(),
      '<input type="checkbox" checked="checked">'
    );

    t.equal(DOM.newTag('area').toString(), '<area>');
    t.equal(DOM.newTag('base').toString(), '<base>');
    t.equal(DOM.newTag('br').toString(), '<br>');
    t.equal(DOM.newTag('col').toString(), '<col>');
    t.equal(DOM.newTag('embed').toString(), '<embed>');
    t.equal(DOM.newTag('hr').toString(), '<hr>');
    t.equal(DOM.newTag('img').toString(), '<img>');
    t.equal(DOM.newTag('input').toString(), '<input>');
    t.equal(DOM.newTag('keygen').toString(), '<keygen>');
    t.equal(DOM.newTag('link').toString(), '<link>');
    t.equal(DOM.newTag('menuitem').toString(), '<menuitem>');
    t.equal(DOM.newTag('meta').toString(), '<meta>');
    t.equal(DOM.newTag('param').toString(), '<param>');
    t.equal(DOM.newTag('source').toString(), '<source>');
    t.equal(DOM.newTag('track').toString(), '<track>');
    t.equal(DOM.newTag('wbr').toString(), '<wbr>');

    t.equal(DOM.newTag('base').toString({xml: true}), '<base></base>');
    t.equal(DOM.newTag('link').toString({xml: true}), '<link></link>');

    t.equal(
      DOM.newTag('div', {data: {'f-o-o': 'bar', baz: 'yada'}}).toString(),
      '<div data-f-o-o="bar" data-baz="yada"></div>'
    );
    t.equal(
      DOM.newTag('div', {data: {foo: 'bar', baz: 'yada'}, class: 'test'}, 'Hello World!').toString(),
      '<div data-foo="bar" data-baz="yada" class="test">Hello World!</div>'
    );
    t.equal(
      DOM.newTag('div', {data: 'test'}, 'Hello World!').toString({xml: true}),
      '<div data="test">Hello World!</div>'
    );
    t.equal(
      DOM.newTag('div', {'data-one': 'One', 'data-two': 'Two'}, 'Hello World!').toString({xml: true}),
      '<div data-one="One" data-two="Two">Hello World!</div>'
    );
    t.equal(
      DOM.newTag('div', {'data-one': 'One', data: {two: 'Two'}}, 'Hello World!').toString({xml: true}),
      '<div data-one="One" data-two="Two">Hello World!</div>'
    );

    t.end();
  });

  t.test('Script tag', t => {
    const dom = new DOM(`<script charset="utf-8">alert('lalala');</script>`);
    t.equal(dom.at('script').text(), `alert('lalala');`);
    t.equal(dom.toString(), `<script charset="utf-8">alert('lalala');</script>`);

    t.end();
  });

  t.test('HTML5 (unquoted values)', t => {
    const dom = new DOM('<div id = test foo ="bar" class=tset bar=/baz/ value baz=//>works</div>');
    t.equal(dom.at('#test').text(), 'works');
    t.equal(dom.toString(), '<div id="test" foo="bar" class="tset" bar="/baz/" value baz="//">works</div>');

    t.end();
  });

  t.test('HTML1 (single quotes, uppercase tags and whitespace in attributes)', t => {
    const dom = new DOM(`<DIV id = 'test' foo ='bar' class= "tset">works</DIV>`);
    t.equal(dom.at('#test').text(), 'works');
    t.equal(dom.toString(), '<div id="test" foo="bar" class="tset">works</div>');

    t.end();
  });

  t.test('Looks remotely like HTML', t => {
    const dom = new DOM('<!DOCTYPE H "-/W/D HT 4/E">☃<title class=test>♥</title>☃');
    t.equal(dom.at('title').text(), '♥');
    t.equal(dom.toString(), '<!DOCTYPE H "-/W/D HT 4/E">☃<title class="test">♥</title>☃');

    t.end();
  });

  t.test('Markup characters in attribute values', t => {
    const dom = new DOM(`<div id="<a>" \n test='='>Test<div id='><' /></div>`);
    t.equal(dom.at('[id="<a>"]').text(), 'Test');
    t.equal(dom.toString(), '<div id="&lt;a&gt;" test="=">Test<div id="&gt;&lt;"></div></div>');

    t.end();
  });

  t.test('Empty attributes', t => {
    const dom = new DOM(`<div test="" test2='' />`);
    t.equal(dom.at('div').attr.test, '');
    t.equal(dom.at('div').attr.test2, '');
    t.equal(dom.toString(), '<div test test2></div>');

    t.end();
  });

  t.test('Multi-line attribute', t => {
    const dom = new DOM('<div class="line1\nline2" />');
    t.equal(dom.at('.line1').tag, 'div');
    t.equal(dom.toString(), '<div class="line1\nline2"></div>');

    t.end();
  });

  t.test('Entities in attributese', t => {
    const dom = new DOM('<a href="/?foo&lt=bar"></a>');
    t.equal(dom.at('a').attr.href, '/?foo&lt=bar');
    t.equal(dom.toString(), '<a href="/?foo&amp;lt=bar"></a>');

    t.end();
  });

  t.test('Whitespaces before closing bracket', t => {
    const dom = new DOM('<div >content</div>');
    t.equal(dom.at('div').text(), 'content');
    t.equal(dom.toString(), '<div>content</div>');

    t.end();
  });

  t.test('Whitespaces before closing bracket', t => {
    const dom = new DOM(`
    <html>
      <head>
        <title>foo</title>
      <body>bar`);
    t.equal(dom.at('html > head > title').text(), 'foo');
    t.equal(dom.at('html > body').text(), 'bar');

    t.end();
  });

  t.test('Auto-close tag', t => {
    const dom = new DOM('<p><div />');
    t.equal(dom.toString(), '<p></p><div></div>');

    t.end();
  });

  t.test('No auto-close in scope', t => {
    const dom = new DOM('<p><svg><div /></svg>');
    t.equal(dom.toString(), '<p><svg><div></div></svg></p>');

    const dom2 = new DOM('<p><math><div /></math>');
    t.equal(dom2.toString(), '<p><math><div></div></math></p>');

    t.end();
  });

  t.test('Auto-close scope', t => {
    const dom = new DOM('<p><svg></p>');
    t.equal(dom.toString(), '<p><svg></svg></p>');

    const dom2 = new DOM('<p><math>');
    t.equal(dom2.toString(), '<p><math></math></p>');

    t.end();
  });

  t.test('image', t => {
    const dom = new DOM('<image src="foo.png">test');
    t.equal(dom.at('img').attr.src, 'foo.png');
    t.equal(dom.toString(), '<img src="foo.png">test');

    t.end();
  });

  t.test('title', t => {
    const dom = new DOM('<title> <p>test&lt;</title>');
    t.equal(dom.at('title').text(), ' <p>test<');
    t.equal(dom.toString(), '<title> <p>test<</title>');

    t.end();
  });

  t.test('textarea', t => {
    const dom = new DOM('<textarea id="a"> <p>test&lt;</textarea>');
    t.equal(dom.at('textarea').text(), ' <p>test<');
    t.equal(dom.toString(), '<textarea id="a"> <p>test<</textarea>');

    t.end();
  });

  t.test('Optional "li" tags', t => {
    const dom = new DOM(`
    <ul>
      <li>
        <ol>
          <li>F
          <li>G
        </ol>
      <li>A</li>
      <LI>B
      <li>C</li>
      <li>D
      <li>E
    </ul>`);

    t.equal(dom.find('ul > li > ol > li')[0].text(), 'F\n          ');
    t.equal(dom.find('ul > li > ol > li')[1].text(), 'G\n        ');
    t.equal(dom.find('ul > li')[1].text(), 'A');
    t.equal(dom.find('ul > li')[2].text(), 'B\n      ');
    t.equal(dom.find('ul > li')[3].text(), 'C');
    t.equal(dom.find('ul > li')[4].text(), 'D\n      ');
    t.equal(dom.find('ul > li')[5].text(), 'E\n    ');

    t.end();
  });

  t.test('Optional "p" tag', t => {
    const dom = new DOM(`
    <div>
      <p>A</p>
      <P>B
      <p>C</p>
      <p>D<div>X</div>
      <p>E<img src="foo.png">
      <p>F<br>G
      <p>H
    </div>`);

    t.equal(dom.find('div > p')[0].text(), 'A');
    t.equal(dom.find('div > p')[1].text(), 'B\n      ');
    t.equal(dom.find('div > p')[2].text(), 'C');
    t.equal(dom.find('div > p')[3].text(), 'D');
    t.equal(dom.find('div > p')[4].text(), 'E\n      ');
    t.equal(dom.find('div > p')[5].text(), 'FG\n      ');
    t.equal(dom.find('div > p')[6].text(), 'H\n    ');
    t.equal(dom.find('div > p > p').length, 0);
    t.equal(dom.at('div > p > img').attr.src, 'foo.png');
    t.equal(dom.at('div > div').text(), 'X');

    t.end();
  });

  t.test('Optional "dt" and "dd" tags', t => {
    const dom = new DOM(`
    <dl>
      <dt>A</dt>
      <DD>B
      <dt>C</dt>
      <dd>D
      <dt>E
      <dd>F
    </dl>`);
    t.equal(dom.find('dl > dt')[0].text(), 'A');
    t.equal(dom.find('dl > dd')[0].text(), 'B\n      ');
    t.equal(dom.find('dl > dt')[1].text(), 'C');
    t.equal(dom.find('dl > dd')[1].text(), 'D\n      ');
    t.equal(dom.find('dl > dt')[2].text(), 'E\n      ');
    t.equal(dom.find('dl > dd')[2].text(), 'F\n    ');

    t.end();
  });

  t.test('Optional "rp" and "rt" tags', t => {
    const dom = new DOM(`
    <ruby>
      <rp>A</rp>
      <RT>B
      <rp>C</rp>
      <rt>D
      <rp>E
      <rt>F
    </ruby>`);

    t.equal(dom.find('ruby > rp')[0].text(), 'A');
    t.equal(dom.find('ruby > rt')[0].text(), 'B\n      ');
    t.equal(dom.find('ruby > rp')[1].text(), 'C');
    t.equal(dom.find('ruby > rt')[1].text(), 'D\n      ');
    t.equal(dom.find('ruby > rp')[2].text(), 'E\n      ');
    t.equal(dom.find('ruby > rt')[2].text(), 'F\n    ');

    t.end();
  });

  t.test('Optional "optgroup" and "option" tags', t => {
    const dom = new DOM(`
    <div>
      <optgroup>A
        <option id="foo">B
        <option>C</option>
        <option>D
      <OPTGROUP>E
        <option>F
      <optgroup>G
        <option>H
    </div>`);

    t.equal(dom.find('div > optgroup')[0].text(), 'A\n        \n        ');
    t.equal(dom.find('div > optgroup > #foo')[0].text(), 'B\n        ');
    t.equal(dom.find('div > optgroup > option')[1].text(), 'C');
    t.equal(dom.find('div > optgroup > option')[2].text(), 'D\n      ');
    t.equal(dom.find('div > optgroup')[1].text(), 'E\n        ');
    t.equal(dom.find('div > optgroup > option')[3].text(), 'F\n      ');
    t.equal(dom.find('div > optgroup')[2].text(), 'G\n        ');
    t.equal(dom.find('div > optgroup > option')[4].text(), 'H\n    ');

    t.end();
  });

  t.test('Optional "colgroup" tag', t => {
    const dom = new DOM(`
    <table>
      <col id=morefail>
      <col id=fail>
      <colgroup>
        <col id=foo>
        <col class=foo>
      <colgroup>
        <col id=bar>
    </table>`);

    t.equal(dom.find('table > col')[0].attr.id, 'morefail');
    t.equal(dom.find('table > col')[1].attr.id, 'fail');
    t.equal(dom.find('table > colgroup > col')[0].attr.id, 'foo');
    t.equal(dom.find('table > colgroup > col')[1].attr.class, 'foo');
    t.equal(dom.find('table > colgroup > col')[2].attr.id, 'bar');

    t.end();
  });

  t.test('Optional "thead", "tbody", "tfoot", "tr", "th" and "td" tags', t => {
    const dom = new DOM(`
    <table>
      <thead>
        <tr>
          <th>A</th>
          <th>D
      <tfoot>
        <tr>
          <td>C
      <tbody>
        <tr>
          <td>B
    </table>`);

    t.equal(dom.at('table > thead > tr > th').text(), 'A');
    t.equal(dom.find('table > thead > tr > th')[1].text(), 'D\n      ');
    t.equal(dom.at('table > tbody > tr > td').text(), 'B\n    ');
    t.equal(dom.at('table > tfoot > tr > td').text(), 'C\n      ');

    t.end();
  });

  t.test('Optional "thead", "tbody", "tfoot", "tr", "th" and "td" tags', t => {
    const dom = new DOM(`
    <table>
      <col id=morefail>
      <col id=fail>
      <colgroup>
        <col id=foo />
        <col class=foo>
      <colgroup>
        <col id=bar>
      </colgroup>
      <thead>
        <tr>
          <th>A</th>
          <th>D
      <tbody>
        <tr>
          <td>B
      <tbody>
        <tr>
          <td>E
    </table>`);

    t.equal(dom.find('table > col')[0].attr.id, 'morefail');
    t.equal(dom.find('table > col')[1].attr.id, 'fail');
    t.equal(dom.find('table > colgroup > col')[0].attr.id, 'foo');
    t.equal(dom.find('table > colgroup > col')[1].attr.class, 'foo');
    t.equal(dom.find('table > colgroup > col')[2].attr.id, 'bar');
    t.equal(dom.at('table > thead > tr > th').text(), 'A');
    t.equal(dom.find('table > thead > tr > th')[1].text(), 'D\n      ');
    t.equal(dom.at('table > tbody > tr > td').text(), 'B\n      ');
    t.equal(
      dom
        .find('table > tbody > tr > td')
        .map(el => el.text())
        .join('\n'),
      'B\n      \nE\n    '
    );

    t.end();
  });

  t.test('Optional "thead", "tbody", "tfoot", "tr", "th" and "td" tags', t => {
    const dom = new DOM(`
    <table>
      <colgroup>
        <col id=foo />
        <col class=foo>
      <colgroup>
        <col id=bar>
      </colgroup>
      <tbody>
        <tr>
          <td>B
    </table>`);

    t.equal(dom.find('table > colgroup > col')[0].attr.id, 'foo');
    t.equal(dom.find('table > colgroup > col')[1].attr.class, 'foo');
    t.equal(dom.find('table > colgroup > col')[2].attr.id, 'bar');
    t.equal(dom.at('table > tbody > tr > td').text(), 'B\n    ');

    t.end();
  });

  t.test('Optional "tr" and "td" tags', t => {
    const dom = new DOM(`
    <table>
      <tr>
        <td>A
        <td>B</td>
      <tr>
        <td>C
      </tr>
      <tr>
        <td>D
    </table>`);

    t.equal(dom.find('table > tr > td')[0].text(), 'A\n        ');
    t.equal(dom.find('table > tr > td')[1].text(), 'B');
    t.equal(dom.find('table > tr > td')[2].text(), 'C\n      ');
    t.equal(dom.find('table > tr > td')[3].text(), 'D\n    ');

    t.end();
  });

  t.test('Real world table', t => {
    const dom = new DOM(`
    <html>
    <head>
      <title>Real World!</title>
    <body>
      <p>Just a test
      <table class=RealWorld>
        <thead>
          <tr>
            <th class=one>One
            <th class=two>Two
            <th class=three>Three
            <th class=four>Four
        <tbody>
          <tr>
            <td class=alpha>Alpha
            <td class=beta>Beta
            <td class=gamma><a href="#gamma">Gamma</a>
            <td class=delta>Delta
          <tr>
            <td class=alpha>Alpha Two
            <td class=beta>Beta Two
            <td class=gamma><a href="#gamma-two">Gamma Two</a>
            <td class=delta>Delta Two
      </table>`);

    t.equal(dom.find('html > head > title')[0].text(), 'Real World!');
    t.equal(dom.find('html > body > p')[0].text(), 'Just a test\n      ');
    t.equal(dom.find('p')[0].text(), 'Just a test\n      ');
    t.equal(dom.find('thead > tr > .three')[0].text(), 'Three\n            ');
    t.equal(dom.find('thead > tr > .four')[0].text(), 'Four\n        ');
    t.equal(dom.find('tbody > tr > .beta')[0].text(), 'Beta\n            ');
    t.equal(dom.find('tbody > tr > .gamma')[0].text(), '\n            ');
    t.equal(dom.find('tbody > tr > .gamma > a')[0].text(), 'Gamma');
    t.equal(dom.find('tbody > tr > .alpha')[1].text(), 'Alpha Two\n            ');
    t.equal(dom.find('tbody > tr > .gamma > a')[1].text(), 'Gamma Two');

    t.end();
  });

  t.test('Real world list', t => {
    const dom = new DOM(`
    <html>
    <head>
      <title>Real World!</title>
    <body>
      <ul>
        <li>
          Test
          <br>
          123
          <p>
  
        <li>
          Test
          <br>
          321
          <p>
        <li>
          Test
          3
          2
          1
          <p>
      </ul>`);

    t.equal(dom.find('html > head > title')[0].text(), 'Real World!');
    t.equal(dom.find('body > ul > li')[0].text(), '\n          Test\n          \n          123\n          ');
    t.equal(dom.find('body > ul > li > p')[0].text(), '\n  \n        ');
    t.equal(dom.find('body > ul > li')[1].text(), '\n          Test\n          \n          321\n          ');
    t.equal(dom.find('body > ul > li > p')[1].text(), '\n        ');
    t.equal(
      dom.find('body > ul > li')[1].text({recursive: true}),
      '\n          Test\n          \n          321\n          \n        '
    );
    t.equal(dom.find('body > ul > li > p')[1].text({recursive: true}), '\n        ');
    t.equal(
      dom.find('body > ul > li')[2].text(),
      '\n          Test\n          3\n          2\n          1\n          '
    );
    t.equal(dom.find('body > ul > li > p')[2].text(), '\n      ');
    t.equal(
      dom.find('body > ul > li')[2].text({recursive: true}),
      '\n          Test\n          3\n          2\n          1\n          \n      '
    );
    t.equal(dom.find('body > ul > li > p')[2].text({recursive: true}), '\n      ');

    t.end();
  });

  t.test('Real world JavaScript and CSS', t => {
    const dom = new DOM(`
    <html>
      <head>
        <style test=works>#style { foo: style('<test>'); }</style>
        <script>
          if (a < b) {
            alert('<123>');
          }
        </script>
        < sCriPt two="23" >if (b > c) { alert('&<ohoh>') }</scRiPt  >
      <body>Foo!</body>`);

    t.equal(dom.find('html > body')[0].text(), 'Foo!');
    t.equal(dom.find('html > head > style')[0].text(), "#style { foo: style('<test>'); }");
    t.equal(
      dom.find('html > head > script')[0].text(),
      "\n          if (a < b) {\n            alert('<123>');\n          }\n        "
    );
    t.equal(dom.find('html > head > script')[1].text(), "if (b > c) { alert('&<ohoh>') }");

    t.end();
  });

  t.test('More real world JavaScript', t => {
    const dom = new DOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Foo</title>
        <script src="/js/one.js"></script>
        <script src="/js/two.js"></script>
        <script src="/js/three.js"></script>
      </head>
      <body>Bar</body>
    </html>`);

    t.equal(dom.at('title').text(), 'Foo');
    t.equal(dom.find('html > head > script')[0].attr.src, '/js/one.js');
    t.equal(dom.find('html > head > script')[1].attr.src, '/js/two.js');
    t.equal(dom.find('html > head > script')[2].attr.src, '/js/three.js');
    t.equal(dom.find('html > head > script')[2].text(), '');
    t.equal(dom.at('html > body').text(), 'Bar');

    t.end();
  });

  t.test('Even more real world JavaScript', t => {
    const dom = new DOM(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Foo</title>
        <script src="/js/one.js"></script>
        <script src="/js/two.js"></script>
        <script src="/js/three.js">
      </head>
      <body>Bar</body>
    </html>`);

    t.equal(dom.at('title').text(), 'Foo');
    t.equal(dom.find('html > head > script')[0].attr.src, '/js/one.js');
    t.equal(dom.find('html > head > script')[1].attr.src, '/js/two.js');
    t.equal(dom.find('html > head > script')[2].attr.src, '/js/three.js');
    t.equal(dom.find('html > head > script')[2].text(), '\n      ');
    t.equal(dom.at('html > body').text(), 'Bar');

    t.end();
  });

  t.test('Broken "font" block and useless end tags', t => {
    const dom = new DOM(`
    <html>
      <head><title>Test</title></head>
      <body>
        <table>
          <tr><td><font>test</td></font></tr>
          </tr>
        </table>
      </body>
    </html>`);

    t.equal(dom.at('html > head > title').text(), 'Test');
    t.equal(dom.at('html body table tr td > font').text(), 'test');

    t.end();
  });

  t.test('Different broken "font" block', t => {
    const dom = new DOM(`
    <html>
      <head><title>Test</title></head>
      <body>
        <font>
        <table>
          <tr>
            <td>test1<br></td></font>
            <td>test2<br>
        </table>
      </body>
    </html>`);

    t.equal(dom.at('html > head > title').text(), 'Test');
    t.equal(dom.find('html > body > font > table > tr > td')[0].text(), 'test1');
    t.equal(dom.find('html > body > font > table > tr > td')[1].text(), 'test2\n        ');

    t.end();
  });

  t.test('Broken "font" and "div" blocks', t => {
    const dom = new DOM(`
    <html>
      <head><title>Test</title></head>
      <body>
        <font>
        <div>test1<br>
          <div>test2<br></font>
        </div>
      </body>
    </html>`);

    t.equal(dom.at('html head title').text(), 'Test');
    t.equal(dom.at('html body font > div').text(), 'test1\n          \n      ');
    t.equal(dom.at('html body font > div > div').text(), 'test2\n        ');

    t.end();
  });

  t.test('Broken "div" blocks', t => {
    const dom = new DOM(`
    <html>
      <head><title>Test</title></head>
      <body>
        <div>
        <table>
          <tr><td><div>test</td></div></tr>
          </div>
        </table>
      </body>
    </html>`);

    t.equal(dom.at('html head title').text(), 'Test');
    t.equal(dom.at('html body div table tr td > div').text(), 'test');

    t.end();
  });

  t.test('And another broken "font" block', t => {
    const dom = new DOM(`
    <html>
      <head><title>Test</title></head>
      <body>
        <table>
          <tr>
            <td><font><br>te<br>st<br>1</td></font>
            <td>x1<td><img>tes<br>t2</td>
            <td>x2<td><font>t<br>est3</font></td>
          </tr>
        </table>
      </body>
    </html>`);

    t.equal(dom.at('html > head > title').text(), 'Test');
    t.equal(dom.find('html body table tr > td > font')[0].text(), 'test1');
    t.equal(dom.find('html body table tr > td')[1].text(), 'x1');
    t.equal(dom.find('html body table tr > td')[2].text(), 'test2');
    t.equal(dom.find('html body table tr > td')[3].text(), 'x2');
    t.equal(dom.find('html body table tr > td')[5], undefined);
    t.equal(dom.find('html body table tr > td').length, 5);
    t.equal(dom.find('html body table tr > td > font')[1].text(), 'test3');
    t.equal(dom.find('html body table tr > td > font')[2], undefined);
    t.equal(dom.find('html body table tr > td > font').length, 2);

    t.equal(
      dom.toString(),
      `
    <html>
      <head><title>Test</title></head>
      <body>
        <table>
          <tr>
            <td><font><br>te<br>st<br>1</font></td>
            <td>x1</td><td><img>tes<br>t2</td>
            <td>x2</td><td><font>t<br>est3</font></td>
          </tr>
        </table>
      </body>
    </html>`
    );

    t.end();
  });

  t.test('A collection of wonderful screwups', t => {
    const dom = new DOM(`
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Wonderful Screwups</title></head>
      <body id="screw-up">
        <div>
          <div class="ewww">
            <a href="/test" target='_blank'><img src="/test.png"></a>
            <a href='/real bad' screwup: http://localhost/bad' target='_blank'>
              <img src="/test2.png">
          </div>
          </mt:If>
        </div>
        <b>>la<>la<<>>la<</b>
      </body>
    </html>`);

    t.equal(dom.at('#screw-up > b').text(), '>la<>la<<>>la<');
    t.equal(dom.at('#screw-up .ewww > a > img').attr.src, '/test.png');
    t.equal(dom.find('#screw-up .ewww > a > img')[1].attr.src, '/test2.png');
    t.equal(dom.find('#screw-up .ewww > a > img')[2], undefined);
    t.equal(dom.find('#screw-up .ewww > a > img').length, 2);

    t.end();
  });

  t.test('Broken "br" tag', t => {
    const dom = new DOM('<br< abc abc abc abc abc abc abc abc<p>Test</p>');
    t.equal(dom.at('p').text(), 'Test');
    t.equal(dom.toString(), '&lt;br&lt; abc abc abc abc abc abc abc abc<p>Test</p>');

    t.end();
  });

  t.test('Runaway "<"', t => {
    const dom = new DOM(`
    <table>
      <tr>
        <td>
          <div class="test" data-id="123" data-score="3">works</div>
          TEST 123<br />
          Test  12-34-5 test  >= 75% and < 85%  test<br />
          Test  12-34-5  -test foo >= 5% and < 30% test<br />
          Test  12-23-4 n/a >=13% and = 1% and < 5% test tset<br />
          Test  12-34-5  test >= 1% and < 1%   foo, bar, baz<br />
          Test foo, bar, baz  123-456-78  test < 1%  foo, bar, baz yada, foo, bar and baz, yada
        </td>
      </tr>
    </table>
    `);
    t.equal(dom.at('.test').text(), 'works');

    const dom2 = new DOM(`
    <table>
      <tr>
        <td>
          <div class="test" data-id="123" data-score="3">too</div>
          TEST 123<br />
          Test  12-34-5 test  >= 75% and < 85%  test<br />
          Test  12-34-5  -test foo >= 5% and < 30% test<br />
          Test  12-23-4 n/a >=13% and = 1% and < 5% test tset<br />
          Test  12-34-5  test >= 1% and < 1%   foo, bar, baz<br />
          Test foo, bar, baz  123-456-78  test < a%  foo, bar, baz yada, foo, bar and baz, yada
        </td>
      </tr>
    </table>
    `);
    t.equal(dom2.at('.test').text(), 'too');

    t.end();
  });

  t.test('XML name characters', t => {
    const dom = new DOM('<Foo><1a>foo</1a></Foo>', {xml: true});
    t.equal(dom.at('Foo').text(), '<1a>foo</1a>');
    t.equal(dom.toString(), '<Foo>&lt;1a&gt;foo&lt;/1a&gt;</Foo>');

    const dom2 = new DOM('<Foo><.a>foo</.a></Foo>', {xml: true});
    t.equal(dom2.at('Foo').text(), '<.a>foo</.a>');
    t.equal(dom2.toString(), '<Foo>&lt;.a&gt;foo&lt;/.a&gt;</Foo>');

    const dom3 = new DOM('<Foo><-a>foo</-a></Foo>', {xml: true});
    t.equal(dom3.at('Foo').text(), '<-a>foo</-a>');
    t.equal(dom3.toString(), '<Foo>&lt;-a&gt;foo&lt;/-a&gt;</Foo>');

    const dom4 = new DOM('<Foo><a1>foo</a1></Foo>', {xml: true});
    t.equal(dom4.at('Foo a1').text(), 'foo');
    t.equal(dom4.toString(), '<Foo><a1>foo</a1></Foo>');

    const dom5 = new DOM('<Foo><.>foo</.></Foo>', {xml: true});
    t.equal(dom5.at('Foo').text(), '<.>foo</.>');
    t.equal(dom5.toString(), '<Foo>&lt;.&gt;foo&lt;/.&gt;</Foo>');

    const dom6 = new DOM('<Foo><a .b -c 1>foo</a></Foo>', {xml: true});
    t.equal(dom6.at('Foo').text(), '<a .b -c 1>foo');
    t.equal(dom6.toString(), '<Foo>&lt;a .b -c 1&gt;foo</Foo>');

    const dom7 = new DOM('<こんにちは こんにちは="こんにちは">foo</こんにちは>', {xml: true});
    t.equal(dom7.at('こんにちは').text(), 'foo');
    t.equal(dom7.at('こんにちは').attr['こんにちは'], 'こんにちは');
    t.equal(dom7.toString(), '<こんにちは こんにちは="こんにちは">foo</こんにちは>');

    const dom8 = new DOM('<😄 😄="😄">foo</😄>', {xml: true});
    t.equal(dom8.at('😄').text(), 'foo');
    t.equal(dom8.at('😄').attr['😄'], '😄');
    t.equal(dom8.toString(), '<😄 😄="😄">foo</😄>');

    t.end();
  });

  t.test('Runaway "<"', t => {
    const dom = new DOM(`
      <!DOCTYPE html>
      <h1>Welcome to HTML</h1>
      <script>
          console.log('< /script> is safe');
          /* <div>XXX this is not a div element</div> */
      </script>
    `);
    t.match(dom.at('script').text(), /console\.log.+< \/script>.+this is not a div element/s);

    const dom2 = new DOM(`
    <!DOCTYPE html>
    <h1>Welcome to HTML</h1>
    <script>
        console.log('this is a script element and should be executed');
    // </script asdf> <p>
        console.log('this is not a script');
        // <span data-wtf="</script>">:-)</span>
  `);
    t.match(dom2.at('script').text(), /console\.log.+executed.+\/\//s);
    t.match(dom2.at('p').text(), /console\.log.+this is not a script/s);
    t.equal(dom2.at('span').text(), ':-)');

    const dom3 = new DOM(`
    <!DOCTYPE html>
    <h1>Welcome to HTML</h1>
    <div>
      <script> console.log('</scriptxyz is safe'); </script>
    </div>
  `);
    t.match(dom3.at('script').text(), /console\.log.+scriptxyz is safe/s);
    t.match(dom3.at('div').text(), /^\s+$/s);

    t.end();
  });

  t.end();
});
