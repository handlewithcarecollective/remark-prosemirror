# remark-prosemirror

A set of plugins and utils for integrating remark, mdast, and ProseMirror. Can
be used to convert ProseMirror documents to Markdown, and vice versa!

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Parsing a Markdown document as ProseMirror](#parsing-a-markdown-document-as-prosemirror)
  - [Serializing a ProseMirror document to Markdown](#serializing-a-prosemirror-document-to-markdown)
- [API Docs](#api-docs)

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
}
```

==> gen/README.md <==

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

==> /home/smoores/code/remark-prosemirror/README.md <==

A set of plugins and utils for integrating remark, mdast, and ProseMirror. Can
be used to convert ProseMirror documents to Markdown, and vice versa!

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Parsing a Markdown document as ProseMirror](#parsing-a-markdown-document-as-prosemirror)
  - [Serializing a ProseMirror document to Markdown](#serializing-a-prosemirror-document-to-markdown)
- [API Docs](#api-docs)

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
}
```

==> /home/smoores/code/remark-prosemirror/lint-staged.config.js <== // Run
ESLint and Prettier on typescript, javascript, and json // files. lint-staged
automatically adds any updated files // to git, so it's safe to use `--fix` and
`--write` flags, // which change source files. "_.{ts,js,json,md}": ["yarn
readme", "eslint --fix", "prettier --write"], // If typescript files or json
files (Typescript statically types .json // files, and package.json and
tsconfig.json files can change type // correctness) change, we run tsc on the
whole project. We use // incremental: true in our tsconfig, so this isn't very
expensive if // only a few files have changed. // // Note that we use the
function configuration option here, instead of // just a string or array of
strings. lint-staged calls this function // with an array of filenames and
expects us to produce an entire command // (including filename arguments). Since
we just want to run check:types // on the whole project, not some specific
files, we ignore this file list. "_.{ts,json}": () => "yarn check:types", // For
HTML, and YAML files, we just run Prettier. ESLint doesn't have // anything to
say about these. "\*.{yml,html}": "prettier --write", };

export default config;

==> /home/smoores/code/remark-prosemirror/package.json <== "name":
"@handlewithcare/remark-prosemirror", "version": "0.1.0", "description": "A
remark plugin for converting between markdown and ProseMirror", "type":
"module", "main": "index.js", "repository":
"git@github.com:handlewithcarecollective/remark-prosemirror.git", "author":
"Shane Friedman <shane@handlewithcare.dev>", "license": "MIT", "packageManager":
"yarn@4.5.3", "files": [ "index.js", "lib/mdast-util-from-prosemirror.js",
"lib/mdast-util-to-prosemirror.js", "lib/remark-prosemirror.js", "index.d.ts",
"lib/mdast-util-from-prosemirror.d.ts", "lib/mdast-util-to-prosemirror.d.ts",
"lib/remark-prosemirror.d.ts" ], "scripts": { "build": "yarn tsc && yarn swc
index.ts lib/_.ts -d .", "check:format": "yarn prettier --check .",
"check:lint": "yarn eslint .", "check:types": "yarn tsc --noEmit", "check":
"yarn check:types && yarn check:lint && yarn check:format", "fix:format": "yarn
prettier --write .", "fix:lint": "yarn eslint --fix .", "fix": "yarn fix:lint &&
yarn fix:format", "readme:toc": "markdown-toc --maxdepth=3 --append='\n-
[API Docs](#api-docs)' --bullets='-' -i readme-stub.md", "readme:api":
"typedoc", "readme": "yarn readme:api && yarn readme:toc && cat readme-stub.md >
README.md && tail -n +2 gen/README.md >> README.md", "test": "yarn tsx --test
lib/_.test.ts", "postinstall": "husky", "prepack": "pinst --disable",
"postpack": "pinst --enable" }, "devDependencies": { "@eslint/js": "^9.17.0",
"@tsconfig/strictest": "^2.0.5", "@types/hast": "^3.0.4", "@types/mdast": "^4",
"@types/unist": "^3.0.3", "eslint": "^9.17.0", "husky": "^9.1.7", "lint-staged":
"^15.2.11", "markdown-toc": "^1.2.0", "pinst": "^3.0.0", "prettier": "^3.4.2",
"prosemirror-model": "^1.24.1", "prosemirror-test-builder": "^1.1.1", "rehype":
"^1.0.0", "remark-parse": "^11.0.0", "remark-stringify": "^11.0.0",
"remark-toc": "^9.0.0", "swc": "^1.0.11", "tsx": "^4.19.2", "typedoc":
"^0.27.5", "typedoc-plugin-markdown": "^4.3.2", "typedoc-plugin-remark":
"^1.2.1", "typescript": "^5.7.2", "typescript-eslint": "^8.18.0", "unified":
"^11.0.5" }, "dependencies": { "@swc/cli": "^0.5.2", "@swc/core": "^1.10.1",
"devlop": "^1.1.0", "hast-util-from-html": "^2.0.3",
"micromark-util-sanitize-uri": "^2.0.1", "trim-lines": "^3.0.1",
"unist-util-is": "^6.0.0", "unist-util-visit": "^5.0.0", "zwitch": "^2.0.4" } }

==> /home/smoores/code/remark-prosemirror/readme-stub.md <==

A set of plugins and utils for integrating remark, mdast, and ProseMirror. Can
be used to convert ProseMirror documents to Markdown, and vice versa!

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Parsing a Markdown document as ProseMirror](#parsing-a-markdown-document-as-prosemirror)
  - [Serializing a ProseMirror document to Markdown](#serializing-a-prosemirror-document-to-markdown)
- [API Docs](#api-docs)

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
}
```

==> /home/smoores/code/remark-prosemirror/typedoc.json <== "$schema":
"https://typedoc-plugin-markdown.org/schema.json", "entryPoints":
["./index.ts"], "plugin": ["typedoc-plugin-markdown", "typedoc-plugin-remark"],
"readme": "none", "mergeReadme": false, "gitRevision": "main",
"outputFileStrategy": "modules", "out": "./gen", "cleanOutputDir": false,
"hidePageHeader": true, "formatWithPrettier": true, "parametersFormat": "table",
"remarkPlugins": [["remark-toc", { "maxDepth": 3, "heading": "API Docs" }]],
"defaultRemarkPlugins": { "gfm": true, "frontmatter": false, "mdx": false } }
