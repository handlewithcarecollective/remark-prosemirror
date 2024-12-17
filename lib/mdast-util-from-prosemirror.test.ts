import { it, describe } from "node:test";
import assert from "node:assert";
import { unified } from "unified";
import remarkStringify from "remark-stringify";
import { fromPmNode, fromProseMirror } from "./mdast-util-from-prosemirror.js";
import { doc, p, schema as schemaUntyped } from "prosemirror-test-builder";
import { Schema } from "prosemirror-model";

const schema = schemaUntyped as unknown as Schema<"paragraph">;

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
      }
    );
    const result = unified().use(remarkStringify).stringify(mdast);

    assert.equal(
      result,
      `This is a document.

It has two paragraphs.
`
    );
  });
});
