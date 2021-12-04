<p align="center">
  <a href="https://mojojs.org">
    <img src="https://github.com/mojolicious/mojo.js/blob/main/docs/images/logo.png?raw=true" style="margin: 0 auto;">
  </a>
</p>

[![](https://github.com/mojolicious/dom.js/workflows/test/badge.svg)](https://github.com/mojolicious/dom.js/actions)
[![npm](https://img.shields.io/npm/v/@mojojs/dom.svg)](https://www.npmjs.com/package/@mojojs/dom)

A fast and minimalistic HTML/XML DOM parser with CSS selectors. Written in TypeScript.

```js
import DOM from '@mojojs/dom';

// Parse
const dom = new DOM('<div><p id="a">Test</p><p id="b">123</p></div>');

// Find
console.log(dom.at('#b').text());
console.log(dom.find('p').map(el => el.text()).join('\n'));
console.log(dom.find('[id]').map(el => el.attr.id).join('\n'));

// Modify
dom.find(':not(p)').forEach(el => el.strip());

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

#### Nodes and Elements

When we parse an HTML/XML document or fragment, it gets turned into a tree of nodes.

```html
<!DOCTYPE html>
<html>
  <head><title>Hello</title></head>
  <body>World!</body>
</html>
```

There are currently eight different kinds of nodes, `#cdata`, `#comment`, `#doctype`, `#document`, `#element`,
`#fragment`,`#pi`, and `#text`.

```
#document
|- #doctype (html)
+- #element (html)
   |- #element (head)
   |  +- #element (title)
   |     +- #text (Hello)
   +- #element (body)
      +- #text (World!)
```

While nodes such as `#document` and `#fragment` can be represented by `DOM` objects, features like `dom.attr` and
`dom.tag` will not work for them.

#### CSS Selectors

All CSS selectors that make sense for a standalone parser are supported.

| Pattern                       | Represents                                                                                                            |
| ---                           | ---                                                                                                                   |
| `*`                           | any element                                                                                                           |
| `E`                           | an element of type E                                                                                                  |
| `E:not(s1, s2, …)`            | an E element that does not match either compound selector s1 or compound selector s2                                  |
| `E:is(s1, s2, …)`             | an E element that matches compound selector s1 and/or compound selector s2                                            |
| `E.warning`                   | an E element belonging to the class warning                                                                           |
| `E#myid`                      | an E element with ID equal to myid                                                                                    |
| `E[foo]`                      | an E element with a foo attribute                                                                                     |
| `E[foo="bar"]`                | an E element whose foo attribute value is exactly equal to bar                                                        |
| `E[foo="bar" i]`              | an E element whose foo attribute value is exactly equal to any (ASCII-range) case-permutation of bar                  |
| `E[foo="bar" s]`              | an E element whose foo attribute value is exactly and case-sensitively equal to bar                                   |
| `E[foo~="bar"]`               | an E element whose foo attribute value is a list of whitespace-separated values, one of which is exactly equal to bar |
| `E[foo^="bar"]`               | an E element whose foo attribute value begins exactly with the string bar                                             |
| `E[foo$="bar"]`               | an E element whose foo attribute value ends exactly with the string bar                                               |
| `E[foo*="bar"]`               | an E element whose foo attribute value contains the substring bar                                                     |
| `E:nth-child(n [of S]?)`      | an E element, the n-th child of its parent matching S                                                                 |
| `E:nth-last-child(n [of S]?)` | an E element, the n-th child of its parent matching S, counting from the last one                                     |
| `E:first-child`               | an E element, first child of its parent                                                                               |
| `E:last-child`                | an E element, last child of its parent                                                                                |
| `E:only-child`                | an E element, only child of its parent                                                                                |
| `E:nth-of-type(n)`            | an E element, the n-th sibling of its type                                                                            |
| `E:nth-last-of-type(n)`       | an E element, the n-th sibling of its type, counting from the last one                                                |
| `E:first-of-type`             | an E element, first sibling of its type                                                                               |
| `E:last-of-type`              | an E element, last sibling of its type                                                                                |
| `E:only-of-type`              | an E element, only sibling of its type                                                                                |
| `E F`                         | an F element descendant of an E element                                                                               |
| `E > F`                       | an F element child of an E element                                                                                    |
| `E + F`                       | an F element immediately preceded by an E element                                                                     |
| `E ~ F`                       | an F element preceded by an E element                                                                                 |

All supported CSS4 selectors are considered experimental and might change as the spec evolves.

### API

Everything you need to extract information from HTML/XML documents and make changes to the DOM tree.

```js
// Parse HTML
const dom = new DOM('<div class="greeting">Hello World!</div>');

// Render `DOM` object to HTML
const html = dom.toString();
```

Navigate the DOM tree with and without CSS selectors.

```js
// Find one element matching the CSS selector and return it as `DOM` objects
const div = dom.at('div.greeting');

// Find all elements marching the CSS selector and teturn them as `DOM` objects
const divs = dom.find('div.greeting');

// Get root element as `DOM` object (document or fragment node)
const root = dom.root();

// Get parent element as `DOM` object
const parent = dom.parent();

// Get all ancestor elements as `DOM` objects
const ancestors = dom.ancestors();

// Get all child elements as `DOM` objects
const children = dom.children();

// Get all sibling elements before this element as `DOM` objects
const preceding = dom.preceding();

// Get all sibling elements after this element as `DOM` objects
const following = dom.following();

// Get sibling element before this element as `DOM` objects
const previous = dom.previous();

// Get sibling element after this element as `DOM` objects
const next = dom.next();
```

Extract information and manipulate elements.

```js
// Check if element matches the given CSS selector
const isDiv = dom.matches('div');

// Extract text content from element
const greeting = dom.text();

// Get element tag
const tag = dom.tag;

// Set element tag
dom.tag = 'div';

// Get element attribute value
const class = dom.attr.class;

// Set element attribute value
dom.attr.class = 'whatever';

// Remove element attribute
delete dom.attr.class;

// Get element attribute names
const names = Object.keys(dom.attr);

// Get element's rendered content
const content = dom.content();

// Remove element and its children
dom.remove();

// Remove element but preserve its children
dom.strip();

// Replace element and its children
dom.replace('<p>Hello World!</p>');

// Append HTML/XML fragment after this element
dom.append('<p>Hello World!</p>');

// Append HTML/XML fragment to this element's content
dom.appendContent('<p>Hello World!</p>');

// Prepend HTML/XML fragment before this element
dom.prepend('<p>Hello World!</p>');

// Prepend HTML/XML fragment to this element's content
dom.prependContent('<p>Hello World!</p>');
```

## Installation

All you need is Node.js 16.0.0 (or newer).

```
$ npm install @mojojs/dom
```
