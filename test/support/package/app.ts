import assert from 'node:assert/strict';
import DOM from '@mojojs/dom';

const dom = new DOM('<div><p id="a">Hello TypeScript!</p></div>');
const text: string | undefined = dom.at('#a')?.text();
assert.equal(text, 'Hello TypeScript!');

console.log('TypeScript consumer works');
