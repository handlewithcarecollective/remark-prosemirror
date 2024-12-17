import { type Root as MdastRoot } from "mdast";
import { type Node as PmNode } from "prosemirror-model";
import { type Plugin, type Processor } from "unified";
import { Options, toProseMirror } from "./mdast-util-to-prosemirror.js";

export { toPmNode, toPmMark } from "./mdast-util-to-prosemirror.js";

export const remarkProseMirror = function (
  this: Processor<undefined, undefined, undefined, MdastRoot, PmNode>,
  options: Options
) {
  this.compiler = function (tree) {
    return toProseMirror(tree, options);
  };
  // We have to do this ugly cast through unknown here because the
  // Plugin type just uses `Processor` without any type params, which
  // makes it incompatible with our more correctly typed Processor<..., MdastRoot, string>
} as unknown as Plugin<[Options], MdastRoot, PmNode>;
