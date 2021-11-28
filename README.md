<p align="center">
  <a href="https://mojojs.org">
    <img src="https://github.com/mojolicious/mojo.js/blob/main/docs/images/logo.png?raw=true" style="margin: 0 auto;">
  </a>
</p>

[![](https://github.com/mojolicious/dom.js/workflows/test/badge.svg)](https://github.com/mojolicious/dom.js/actions)
[![npm](https://img.shields.io/npm/v/@mojojs/dom.svg)](https://www.npmjs.com/package/@mojojs/dom)

A convenient HTML/XML DOM API class. Written in TypeScript. **IN DEVELOPMENT AND UNSTABLE!**

```js
import DOM from '@mojojs/dom';

// Parse
const dom = new DOM('<div><p id="a">Test</p><p id="b">123</p></div>');

// Find
console.log(dom.at('#b').text());
console.log(dom.find('p').map(e => e.text()).join('\n'));
console.log(dom.find('[id]').map(e => e.attr.id).join('\n'));

// Render
console.log(dom.toString());
```

#### Formats

There are currently three input formats supported. For HTML documents and fragments we use
[parse5](https://www.npmjs.com/package/parse5), and for XML a very relaxed custom parser that will try to make sense of
whatever tag soup you hand it.

```js
// HTML document ("<head>", "<body>"... get added automatically)
const dom = new DOM('<p>Hello World!</p>');

// HTML fragment
const dom = new DOM('<p>Hello World!</p>', {fragment: true});

// XML
const dom = new DOM('<rss><link>http://example.com</link></rss>', {xml: true});
```

#### CSS Selectors

CSS selector support is still fairly incomplete, but will increase quickly.

| Pattern            | Represents                                                                                                            |
| ---                | ---                                                                                                                   |
| `*`                | any element                                                                                                           |
| `E`                | an element of type E                                                                                                  |
| `E:not(s1, s2, …)` | an E element that does not match either compound selector s1 or compound selector s2                                  |
| `E.warning`        | an E element belonging to the class warning                                                                           |
| `E#myid`           | an E element with ID equal to myid                                                                                    |
| `E[foo]`           | an E element with a foo attribute                                                                                     |
| `E[foo="bar"]`     | an E element whose foo attribute value is exactly equal to bar                                                        |
| `E[foo="bar" i]`   | an E element whose foo attribute value is exactly equal to any (ASCII-range) case-permutation of bar                  |
| `E[foo="bar" s]`   | an E element whose foo attribute value is exactly and case-sensitively equal to bar                                   |
| `E[foo~="bar"]`    | an E element whose foo attribute value is a list of whitespace-separated values, one of which is exactly equal to bar |
| `E[foo^="bar"]`    | an E element whose foo attribute value begins exactly with the string bar                                             |
| `E[foo$="bar"]`    | an E element whose foo attribute value ends exactly with the string bar                                               |
| `E[foo*="bar"]`    | an E element whose foo attribute value contains the substring bar                                                     |
| `E F`              | an F element descendant of an E element                                                                               |
| `E > F`            | an F element child of an E element                                                                                    |
| `E + F`            | an F element immediately preceded by an E element                                                                     |
| `E ~ F`            | an F element preceded by an E element                                                                                 |

All supported CSS4 selectors are considered experimental and might change as the spec evolves.

## Installation

All you need is Node.js 16.0.0 (or newer).

```
$ npm install @mojojs/dom
```
