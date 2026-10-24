import assert from 'node:assert/strict';
import DOM from '@mojojs/dom';

const dom = new DOM('<div><p id="a">Hello JavaScript!</p></div>');
assert.equal(dom.at('#a').text(), 'Hello JavaScript!');

console.log('JavaScript consumer works');
