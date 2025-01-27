# remark-prosemirror

A set of plugins and utils for integrating remark, mdast, and ProseMirror. Can
be used to convert ProseMirror documents to Markdown, and vice versa!

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Parsing a Markdown document as ProseMirror](#parsing-a-markdown-document-as-prosemirror)
  - [Serializing a ProseMirror document to Markdown](#serializing-a-prosemirror-document-to-markdown)
- [API Docs](#api-docs)
- [Looking for someone to collaborate with?](#looking-for-someone-to-collaborate-with)

<!-- tocstop -->

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

  return unified().use(remarkStringify).stringify(mdast);
}
```

## API Docs

- [Interfaces](#interfaces)
  - [FromProseMirrorOptions\<PmNodes, PmMarks>](#fromprosemirroroptionspmnodes-pmmarks)
  - [RemarkProseMirrorOptions](#remarkprosemirroroptions)
- [Functions](#functions)
  - [fromPmMark()](#frompmmark)
  - [fromPmNode()](#frompmnode)
  - [fromProseMirror()](#fromprosemirror)
  - [remarkProseMirror()](#remarkprosemirror)
  - [toPmMark()](#topmmark)
  - [toPmNode()](#topmnode)

## Interfaces

### FromProseMirrorOptions\<PmNodes, PmMarks>

#### Type Parameters

| Type Parameter               |
| ---------------------------- |
| `PmNodes` _extends_ `string` |
| `PmMarks` _extends_ `string` |

#### Properties

##### markHandlers

> **markHandlers**: `Partial`<`Record`<`PmMarks`, `PmMarkHandler`>>

###### Defined in

[lib/mdast-util-from-prosemirror.ts:125](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L125)

##### nodeHandlers

> **nodeHandlers**: `Partial`<`Record`<`PmNodes`, `PmNodeHandler`>>

###### Defined in

[lib/mdast-util-from-prosemirror.ts:124](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L124)

##### schema

> **schema**: `Schema`<`PmNodes`, `PmMarks`>

###### Defined in

[lib/mdast-util-from-prosemirror.ts:123](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L123)

---

### RemarkProseMirrorOptions

#### Properties

##### handlers

> **handlers**: `MdastHandlers`

###### Defined in

[lib/mdast-util-to-prosemirror.ts:367](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-to-prosemirror.ts#L367)

##### htmlHandlers?

> `optional` **htmlHandlers**: `HastHandlers`

###### Defined in

[lib/mdast-util-to-prosemirror.ts:368](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-to-prosemirror.ts#L368)

##### schema

> **schema**: `Schema`<`any`, `any`>

###### Defined in

[lib/mdast-util-to-prosemirror.ts:366](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-to-prosemirror.ts#L366)

## Functions

### fromPmMark()

> **fromPmMark**<`Type`>(`type`, `getAttrs`?): `PmMarkHandler`

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type` _extends_ `"blockquote"` \| `"break"` \| `"code"` \| `"definition"` \| `"delete"` \| `"emphasis"` \| `"footnoteDefinition"` \| `"footnoteReference"` \| `"heading"` \| `"html"` \| `"image"` \| `"imageReference"` \| `"inlineCode"` \| `"link"` \| `"linkReference"` \| `"list"` \| `"listItem"` \| `"paragraph"` \| `"strong"` \| `"table"` \| `"tableCell"` \| `"tableRow"` \| `"text"` \| `"thematicBreak"` \| `"yaml"` \| `"root"` |

#### Parameters

| Parameter   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | `Type`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `getAttrs`? | (`pmNode`) => `Omit`<`Extract`<`Root`, { `type`: `Type`; }> \| `Extract`<`Blockquote`, { `type`: `Type`; }> \| `Extract`<`Break`, { `type`: `Type`; }> \| `Extract`<`Code`, { `type`: `Type`; }> \| `Extract`<`Definition`, { `type`: `Type`; }> \| `Extract`<`Delete`, { `type`: `Type`; }> \| `Extract`<`Emphasis`, { `type`: `Type`; }> \| `Extract`<`FootnoteDefinition`, { `type`: `Type`; }> \| `Extract`<`FootnoteReference`, { `type`: `Type`; }> \| `Extract`<`Heading`, { `type`: `Type`; }> \| `Extract`<`Html`, { `type`: `Type`; }> \| `Extract`<`Image`, { `type`: `Type`; }> \| `Extract`<`ImageReference`, { `type`: `Type`; }> \| `Extract`<`InlineCode`, { `type`: `Type`; }> \| `Extract`<`Link`, { `type`: `Type`; }> \| `Extract`<`LinkReference`, { `type`: `Type`; }> \| `Extract`<`List`, { `type`: `Type`; }> \| `Extract`<`ListItem`, { `type`: `Type`; }> \| `Extract`<`Paragraph`, { `type`: `Type`; }> \| `Extract`<`Strong`, { `type`: `Type`; }> \| `Extract`<`Table`, { `type`: `Type`; }> \| `Extract`<`TableCell`, { `type`: `Type`; }> \| `Extract`<`TableRow`, { `type`: `Type`; }> \| `Extract`<`Text`, { `type`: `Type`; }> \| `Extract`<`ThematicBreak`, { `type`: `Type`; }> \| `Extract`<`Yaml`, { `type`: `Type`; }>, `"type"` \| `"children"`> |

#### Returns

`PmMarkHandler`

#### Defined in

[lib/mdast-util-from-prosemirror.ts:178](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L178)

---

### fromPmNode()

> **fromPmNode**<`Type`>(`type`, `getAttrs`?): `PmNodeHandler`

#### Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type` _extends_ `"blockquote"` \| `"break"` \| `"code"` \| `"definition"` \| `"delete"` \| `"emphasis"` \| `"footnoteDefinition"` \| `"footnoteReference"` \| `"heading"` \| `"html"` \| `"image"` \| `"imageReference"` \| `"inlineCode"` \| `"link"` \| `"linkReference"` \| `"list"` \| `"listItem"` \| `"paragraph"` \| `"strong"` \| `"table"` \| `"tableCell"` \| `"tableRow"` \| `"text"` \| `"thematicBreak"` \| `"yaml"` \| `"root"` |

#### Parameters

| Parameter   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | `Type`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `getAttrs`? | (`pmNode`) => `Omit`<`Extract`<`Root`, { `type`: `Type`; }> \| `Extract`<`Blockquote`, { `type`: `Type`; }> \| `Extract`<`Break`, { `type`: `Type`; }> \| `Extract`<`Code`, { `type`: `Type`; }> \| `Extract`<`Definition`, { `type`: `Type`; }> \| `Extract`<`Delete`, { `type`: `Type`; }> \| `Extract`<`Emphasis`, { `type`: `Type`; }> \| `Extract`<`FootnoteDefinition`, { `type`: `Type`; }> \| `Extract`<`FootnoteReference`, { `type`: `Type`; }> \| `Extract`<`Heading`, { `type`: `Type`; }> \| `Extract`<`Html`, { `type`: `Type`; }> \| `Extract`<`Image`, { `type`: `Type`; }> \| `Extract`<`ImageReference`, { `type`: `Type`; }> \| `Extract`<`InlineCode`, { `type`: `Type`; }> \| `Extract`<`Link`, { `type`: `Type`; }> \| `Extract`<`LinkReference`, { `type`: `Type`; }> \| `Extract`<`List`, { `type`: `Type`; }> \| `Extract`<`ListItem`, { `type`: `Type`; }> \| `Extract`<`Paragraph`, { `type`: `Type`; }> \| `Extract`<`Strong`, { `type`: `Type`; }> \| `Extract`<`Table`, { `type`: `Type`; }> \| `Extract`<`TableCell`, { `type`: `Type`; }> \| `Extract`<`TableRow`, { `type`: `Type`; }> \| `Extract`<`Text`, { `type`: `Type`; }> \| `Extract`<`ThematicBreak`, { `type`: `Type`; }> \| `Extract`<`Yaml`, { `type`: `Type`; }>, `"type"` \| `"children"`> |

#### Returns

`PmNodeHandler`

#### Defined in

[lib/mdast-util-from-prosemirror.ts:157](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L157)

---

### fromProseMirror()

> **fromProseMirror**<`PmNodes`, `PmMarks`>(`pmNode`, `options`): `MdastRoot`

#### Type Parameters

| Type Parameter               |
| ---------------------------- |
| `PmNodes` _extends_ `string` |
| `PmMarks` _extends_ `string` |

#### Parameters

| Parameter | Type                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| `pmNode`  | `Node`                                                                                            |
| `options` | [`FromProseMirrorOptions`](README.md#fromprosemirroroptionspmnodes-pmmarks)<`PmNodes`, `PmMarks`> |

#### Returns

`MdastRoot`

#### Defined in

[lib/mdast-util-from-prosemirror.ts:128](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-from-prosemirror.ts#L128)

---

### remarkProseMirror()

> **remarkProseMirror**(`this`, ...`parameters`): `undefined` | `void`

#### Parameters

| Parameter       | Type                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `this`          | `Processor`<`undefined`, `undefined`, `undefined`, `undefined`, `undefined`> |
| ...`parameters` | \[[`RemarkProseMirrorOptions`](README.md#remarkprosemirroroptions)]          |

#### Returns

`undefined` | `void`

#### Defined in

[lib/remark-prosemirror.ts:10](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/remark-prosemirror.ts#L10)

---

### toPmMark()

> **toPmMark**<`MdastNode`>(`markType`, `getAttrs`?): (`node`, `_`, `state`) =>
> `Node`\[]

#### Type Parameters

| Type Parameter                |
| ----------------------------- |
| `MdastNode` _extends_ `Nodes` |

#### Parameters

| Parameter   | Type                                                     |
| ----------- | -------------------------------------------------------- |
| `markType`  | `MarkType`                                               |
| `getAttrs`? | (`mdastNode`) => `null` \| `Record`<`string`, `unknown`> |

#### Returns

`Function`

##### Parameters

| Parameter | Type        |
| --------- | ----------- |
| `node`    | `MdastNode` |
| `_`       | `Parent`    |
| `state`   | `State`     |

##### Returns

`Node`\[]

#### Defined in

[lib/mdast-util-to-prosemirror.ts:335](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-to-prosemirror.ts#L335)

---

### toPmNode()

> **toPmNode**<`MdastNode`>(`nodeType`, `getAttrs`?): (`node`, `_`, `state`) =>
> `null` | `Node`

#### Type Parameters

| Type Parameter                |
| ----------------------------- |
| `MdastNode` _extends_ `Nodes` |

#### Parameters

| Parameter   | Type                                                     |
| ----------- | -------------------------------------------------------- |
| `nodeType`  | `NodeType`                                               |
| `getAttrs`? | (`mdastNode`) => `null` \| `Record`<`string`, `unknown`> |

#### Returns

`Function`

##### Parameters

| Parameter | Type        |
| --------- | ----------- |
| `node`    | `MdastNode` |
| `_`       | `Parent`    |
| `state`   | `State`     |

##### Returns

`null` | `Node`

#### Defined in

[lib/mdast-util-to-prosemirror.ts:324](https://github.com/handlewithcarecollective/remark-prosemirror/blob/main/lib/mdast-util-to-prosemirror.ts#L324)

## Looking for someone to collaborate with?

Reach out to [Handle with Care](https://handlewithcare.dev/#get-in-touch)! We're
a product development collective with years of experience bringing excellent
ideas to life. We love Markdown and ProseMirror, and we're always looking for
new folks to work with!
