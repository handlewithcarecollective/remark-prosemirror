import { type Root as MdastRoot } from "mdast";
import { type Node as PmNode } from "prosemirror-model";
import { type Plugin } from "unified";
import { Options, toProseMirror } from "./mdast-util-to-prosemirror.js";

export { toPmNode, toPmMark } from "./mdast-util-to-prosemirror.js";

export type { Options };

export const remarkProseMirror: Plugin<[Options], MdastRoot, PmNode> =
  function (options) {
    this.compiler = function (tree) {
      return toProseMirror(tree as MdastRoot, options);
    };
  };
