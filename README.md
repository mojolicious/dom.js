<p align="center">
  <a href="https://mojojs.org">
    <img src="https://github.com/mojolicious/mojo.js/blob/main/docs/images/logo.png?raw=true" style="margin: 0 auto;">
  </a>
</p>

[![](https://github.com/mojolicious/dom.js/workflows/test/badge.svg)](https://github.com/mojolicious/dom.js/actions)
[![npm](https://img.shields.io/npm/v/@mojojs/dom.svg)](https://www.npmjs.com/package/@mojojs/dom)

A convenient HTML/XML DOM API class. Written in TypeScript. **IN DEVELOPMENT!**

```js
import DOM from '@mojojs/dom';

// Parse
const dom = new DOM('<div><p id="a">Test</p><p id="b">123</p></div>');

// Find
console.log(dom.at('#b').text());
console.log(dom.find('p').map(e => e.text()).join('\n'));
console.log(dom.find('[id]').map(e => e.attr.id).join('\n'));

// Loop
for (const e of dom.find('p[id]')) {
  console.log(e.attr.id + ':' + e.text());
}

// Render
console.log(dom.toString());
```

## Installation

All you need is Node.js 16.0.0 (or newer).

```
$ npm install @mojojs/dom
```
