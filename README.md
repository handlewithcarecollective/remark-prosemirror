# remark-prosemirror

A set of plugins and utils for integrating remark, mdast, and ProseMirror. Can
be used to convert ProseMirror documents to Markdown, and vice versa!

<!-- toc -->

<!-- end-toc -->

## Installation

```sh
npm i @handlewithcare/remark-prosemirror
```

## Usage

This library exports tools for converting back and forth between Markdown and
ProseMirror documents. It&rsquo;s part of the [unified](https://unifiedjs.com)
ecosystem.

### Parsing a Markdown document as ProseMirror

To parse a Markdown document into ProseMirror, first we parse the document into
mdast (Markdown abstract syntax tree), and then use the remark plugin to compile
that to ProseMirror.

```ts
import { unified } from "unified";
import { remarkParse } from "remark-parse";
import {
  remarkProseMirror,
  toPmNode,
  toPmMark,
  type RemarkProseMirrorOptions,
} from "@handlewithcare/remark-prosemirror";
import type { Node } from "prosemirror-model";

import { mySchema } from "./mySchema.js";

async function markdownToProseMirror(markdown: string): Node {
  const doc = await unified()
    // Use remarkParse to parse the markdown string
    .use(remarkParse)
    // Convert to ProseMirror with the remarkProseMirror plugin.
    // It takes the schema and a set of handlers, each of which
    // maps an mdast node type to a ProseMirror node (or nodes)
    .use(remarkProseMirror, {
      schema: mySchema,
      handlers: {
        // For simple nodes, you can use the built-in toPmNode
        // util
        paragraph: toPmNode(mySchema.nodes.paragraph),
        listItem: toPmNode(mySchema.nodes.list_item),
        // If you need to take over control, you can write your
        // own handler, which gets passed the mdast node, its
        // parent, and the plugin state, which has helper methods
        // for converting nodes from mdast to ProseMirror.
        list(node, _, state) {
          const children = state.all(node);
          const nodeType = node.ordered
            ? mySchema.nodes.ordered_list
            : mySchema.nodes.bullet_list;
          return nodeType.createAndFill({}, children);
        },

        // You can also treat mdast nodes as ProseMirror marks
        emphasis: toPmMark(mySchema.marks.em),
        strong: toPmMark(mySchema.marks.strong),
        // And you can set attrs on nodes or marks based on
        // the mdast data
        link: toPmMark(mySchema.marks.link, (node) => ({
          href: node.url,
          title: node.title,
        })),
      },
    } satisfies RemarkProseMirrorOptions)
    .parse(markdown);

  return doc;
}
```

### Serializing a ProseMirror document to Markdown

To serialize a ProseMirror document to Markdown, first we convert the
ProseMirror document to mdast. Then we can use remark to serialize the mdast to
a string.

```ts
import { unified } from "unified";
import { remarkStringify } from "remark-stringify";
import {
  fromProseMirror,
  fromPmNode,
  fromPmMark,
} from "@handlewithcare/remark-prosemirror";
import type { Node } from "prosemirror-model";

import { mySchema } from "./mySchema.js";

function proseMirrorToMarkdown(doc: Node) {
  // Convert to mdast with the fromProseMirror util.
  // It takes a schema, a set of node handlers, and a
  // set of mark handlers, each of which converts a
  // ProseMirror node or mark to an mdast node.
  const mdast = fromProseMirror(doc, {
    schema: mySchema,
    nodeHandlers: {
      // Simple nodes can be converted with the fromPmNode
      // util.
      paragraph: fromPmNode("paragraph"),
      list_item: fromPmNode("listItem"),
      // You can set mdast node properties from the
      // ProseMirror node or its attrs
      ordered_list: fromPmNode("list", () => ({
        ordered: true,
      })),
      bullet_list: fromPmNode("list", () => ({
        ordered: false,
      })),
    },
    markHandlers: {
      // Simple marks can be converted with the fromPmMark
      // util.
      em: fromPmMark("emphasis"),
      strong: fromPmMark("strong"),
      // Again, mdast node properties can be set from the
      // ProseMirror mark attrs
      link: fromPmMark("link", (mark) => ({
        url: mark.attrs["href"],
        title: mark.attrs["title"],
      })),
    },
  });
}
```
