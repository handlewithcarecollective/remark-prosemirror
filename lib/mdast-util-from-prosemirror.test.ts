import { it, describe } from "node:test";
import assert from "node:assert";
import { unified } from "unified";
import remarkStringify from "remark-stringify";
import {
  fromPmMark,
  fromPmNode,
  fromProseMirror,
} from "./mdast-util-from-prosemirror.js";
import {
  blockquote,
  doc,
  em,
  p,
  schema as schemaUntyped,
  strong,
} from "prosemirror-test-builder";
import { Schema } from "prosemirror-model";

const schema = schemaUntyped as unknown as Schema<
  "paragraph" | "blockquote",
  "link" | "em" | "strong"
>;

await describe("mdast-util-from-prosemirror", async () => {
  await it("should process a doc with paragraphs", () => {
    const mdast = fromProseMirror(
      doc(p("This is a document."), p("It has two paragraphs.")),
      {
        schema,
        nodeHandlers: {
          paragraph: fromPmNode("paragraph"),
        },
        markHandlers: {},
      },
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This is a document.

It has two paragraphs.
`,
    );
  });

  await it("should process a doc with nested blocks", () => {
    const mdast = fromProseMirror(
      doc(p("This is a document."), blockquote(p("It has two paragraphs."))),
      {
        schema,
        nodeHandlers: {
          paragraph: fromPmNode("paragraph"),
          blockquote: fromPmNode("blockquote"),
        },
        markHandlers: {},
      },
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This is a document.

> It has two paragraphs.
`,
    );
  });

  await it("should process a doc with marks", () => {
    const mdast = fromProseMirror(
      doc(p("This is a ", em("document.")), p("It has two paragraphs.")),
      {
        schema,
        nodeHandlers: {
          paragraph: fromPmNode("paragraph"),
          blockquote: fromPmNode("blockquote"),
        },
        markHandlers: {
          em: fromPmMark("emphasis"),
        },
      },
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This is a *document.*

It has two paragraphs.
`,
    );
  });

  await it("should process mark attrs", () => {
    const mdast = fromProseMirror(
      doc(
        p(
          "This is a ",
          schema.text("document.", [
            schema.marks.link.create({
              href: "https://github.com/handlewithcarecollective/remark-prosemirror",
            }),
          ]),
        ),
        p("It has two paragraphs."),
      ),
      {
        schema,
        nodeHandlers: {
          paragraph: fromPmNode("paragraph"),
          blockquote: fromPmNode("blockquote"),
        },
        markHandlers: {
          link: fromPmMark("link", (mark) => ({
            url: mark.attrs["href"] as string,
          })),
        },
      },
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This is a [document.](https://github.com/handlewithcarecollective/remark-prosemirror)

It has two paragraphs.
`,
    );
  });

  await it("should process a doc with nested marks", () => {
    const mdast = fromProseMirror(
      doc(
        p("This ", em("is a ", strong("document."))),
        p("It has two paragraphs."),
      ),
      {
        schema,
        nodeHandlers: {
          paragraph: fromPmNode("paragraph"),
          blockquote: fromPmNode("blockquote"),
        },
        markHandlers: {
          em: fromPmMark("emphasis"),
          strong: fromPmMark("strong"),
        },
      },
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This *is a **document.***

It has two paragraphs.
`,
    );
  });
});
