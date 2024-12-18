import { it, describe } from "node:test";
import assert from "node:assert";
import { unified } from "unified";
import remarkParse from "remark-parse";
import {
  Options,
  remarkProseMirror,
  toPmMark,
  toPmNode,
} from "./remark-prosemirror.js";
import { schema } from "prosemirror-test-builder";

await describe("remark-prosemirror", async () => {
  await it("should process a doc with paragraphs", async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkProseMirror, {
        schema,
        handlers: {
          paragraph: toPmNode(schema.nodes["paragraph"]!),
        },
      }).process(`
This is a document.

It has two paragraphs.
`);

    const doc = file.result;

    assert.equal(doc.childCount, 2);
    assert.equal(doc.firstChild?.textContent, "This is a document.");
    assert.equal(doc.lastChild?.textContent, "It has two paragraphs.");
  });

  await it("should process a doc with nested blocks", async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkProseMirror, {
        schema,
        handlers: {
          blockquote: toPmNode(schema.nodes["blockquote"]!),
          paragraph: toPmNode(schema.nodes["paragraph"]!),
        },
      }).process(`
This is a document.

> It has two paragraphs.
`);

    const doc = file.result;

    assert.equal(doc.childCount, 2);
    assert.equal(doc.lastChild?.type.name, "blockquote");
    assert.equal(doc.lastChild?.firstChild?.type.name, "paragraph");
    assert.equal(
      doc.lastChild?.firstChild?.textContent,
      "It has two paragraphs.",
    );
  });

  await it("should process marks", async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkProseMirror, {
        schema,
        handlers: {
          paragraph: toPmNode(schema.nodes["paragraph"]!),
          emphasis: toPmMark(schema.marks["em"]!),
        },
      }).process(`
This is a *document.*

It has two *paragraphs.*
`);

    const doc = file.result;

    assert.equal(doc.childCount, 2);
    assert.equal(doc.firstChild?.textContent, "This is a document.");
    assert.equal(doc.lastChild?.textContent, "It has two paragraphs.");

    assert.ok(
      schema.marks["em"]?.isInSet(doc.firstChild?.lastChild?.marks ?? []),
    );
    assert.ok(
      schema.marks["em"]?.isInSet(doc.lastChild?.lastChild?.marks ?? []),
    );
  });

  await it("should process nested marks", async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkProseMirror, {
        schema,
        handlers: {
          paragraph: toPmNode(schema.nodes["paragraph"]!),
          emphasis: toPmMark(schema.marks["em"]!),
          strong: toPmMark(schema.marks["strong"]!),
        },
      }).process(`
This is a **_document._**

It has two **_paragraphs._**
`);

    const doc = file.result;

    assert.equal(doc.childCount, 2);
    assert.equal(doc.firstChild?.textContent, "This is a document.");
    assert.equal(doc.lastChild?.textContent, "It has two paragraphs.");

    assert.ok(
      schema.marks["em"]?.isInSet(doc.firstChild?.lastChild?.marks ?? []),
    );
    assert.ok(
      schema.marks["em"]?.isInSet(doc.lastChild?.lastChild?.marks ?? []),
    );

    assert.ok(
      schema.marks["strong"]?.isInSet(doc.firstChild?.lastChild?.marks ?? []),
    );
    assert.ok(
      schema.marks["strong"]?.isInSet(doc.lastChild?.lastChild?.marks ?? []),
    );
  });

  await it("should process mark attrs", async () => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkProseMirror, {
        schema,
        handlers: {
          paragraph: toPmNode(schema.nodes["paragraph"]!),
          link: toPmMark(schema.marks["link"]!, (node) => ({
            href: node.url,
            title: node.title,
          })),
        },
      } satisfies Options).process(`
This is a [document.](https://github.com/handlewithcarecollective/remark-prosemirror)

It has two paragraphs.
`);

    const doc = file.result;

    assert.equal(doc.childCount, 2);
    assert.equal(doc.firstChild?.textContent, "This is a document.");
    assert.equal(doc.lastChild?.textContent, "It has two paragraphs.");

    assert.ok(
      schema.marks["link"]?.isInSet(doc.firstChild?.lastChild?.marks ?? []),
    );
    assert.equal(
      doc.firstChild?.lastChild?.marks[0]?.attrs["href"],
      "https://github.com/handlewithcarecollective/remark-prosemirror",
    );
  });
});
