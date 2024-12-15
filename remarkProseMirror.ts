import { type Nodes as HastNodes, type Parent as HastParent } from "hast";
import { fromHtml } from "hast-util-from-html";
import {
  type Definition as MdastDefinition,
  type FootnoteDefinition as MdastFootnoteDefinition,
  type Html as MdastHtml,
  type ImageReference as MdastImageReference,
  type Link as MdastLink,
  type LinkReference as MdastLinkReference,
  type Nodes as MdastNodes,
  type Parent as MdastParent,
  type Root as MdastRoot,
  type Text as MdastText,
} from "mdast";
import {
  Fragment,
  MarkType,
  NodeType,
  Schema,
  type Node as PmNode,
} from "prosemirror-model";
import { trimLines } from "trim-lines";
import { type Plugin, type Processor } from "unified";
import { visit } from "unist-util-visit";
import { zwitch } from "zwitch";

interface State {
  all: (node: MdastNodes) => Array<PmNode>;
  definitionById: Map<string, MdastDefinition>;
  footnoteById: Map<string, MdastFootnoteDefinition>;
  footnoteCounts: Map<string, number>;
  footnoteOrder: Array<string>;
  one: (
    node: MdastNodes,
    parent: MdastParent | undefined
  ) => PmNode | PmNode[] | null;
}

export function createState(
  schema: Schema,
  handlers: MdastHandlers,
  htmlHandlers: HastHandlers,
  tree: MdastRoot
) {
  const definitionById: Map<string, MdastDefinition> = new Map();
  const footnoteById: Map<string, MdastFootnoteDefinition> = new Map();
  const footnoteCounts: Map<string, number> = new Map();

  const state: State = {
    all,
    definitionById,
    footnoteById,
    footnoteCounts,
    footnoteOrder: [],
    one,
  };

  visit(tree, function (node) {
    if (node.type === "definition" || node.type === "footnoteDefinition") {
      const map = node.type === "definition" ? definitionById : footnoteById;
      const id = String(node.identifier).toUpperCase();

      // Mimick CM behavior of link definitions.
      // See: <https://github.com/syntax-tree/mdast-util-definitions/blob/9032189/lib/index.js#L20-L21>.
      if (!map.has(id)) {
        // @ts-expect-error: node type matches map.
        map.set(id, node);
      }
    }
  });

  return state;

  /**
   * Transform an mdast node into a hast node.
   */
  function one(
    node: MdastNodes,
    parent: MdastParent | undefined
  ): PmNode | PmNode[] | null {
    return handle(schema, handlers, htmlHandlers, node, parent, state);
  }

  /**
   * Transform the children of an mdast node into hast nodes.
   */
  function all(parent: MdastNodes): Array<PmNode> {
    const values: Array<PmNode> = [];

    if ("children" in parent) {
      const nodes = parent.children;
      let index = -1;
      while (++index < nodes.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let result = state.one(nodes[index]!, parent);

        // To do: see if we van clean this? Can we merge texts?
        if (result) {
          if (index && nodes[index - 1]?.type === "break") {
            if (
              !Array.isArray(result) &&
              result.type === schema.nodes["text"]
            ) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              result = schema.text(trimMarkdownSpaceStart(result.text!));
            }

            if (
              !Array.isArray(result) &&
              result.type !== schema.nodes["text"]
            ) {
              const head = result.firstChild;

              if (head && head.type === schema.nodes["text"]) {
                result = result.copy(
                  Fragment.from(result.content).replaceChild(
                    0,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    schema.text(trimMarkdownSpaceStart(head.text!))
                  )
                );
              }
            }
          }

          if (Array.isArray(result)) {
            values.push(...result);
          } else {
            values.push(result);
          }
        }
      }
    }

    return values;
  }
}

function replaceNewlines(text: string) {
  return text.replaceAll(/\n([^\n])/g, " $1");
}

function revert(
  schema: Schema,
  node: MdastLinkReference | MdastImageReference,
  state: State
) {
  const subtype = node.referenceType;
  let suffix = "]";

  if (subtype === "collapsed") {
    suffix += "[]";
  } else if (subtype === "full") {
    suffix += "[" + (node.label || node.identifier) + "]";
  }

  if (node.type === "imageReference") {
    return [schema.text("![" + node.alt + suffix)];
  }

  const contents = state.all(node);
  const head = contents[0];

  if (head && head.type === schema.nodes["text"]) {
    contents[0] = head.copy(Fragment.from(schema.text("[" + head.text)));
  } else {
    contents.unshift(schema.text("["));
  }

  const tail = contents[contents.length - 1];

  if (tail && tail.type === schema.nodes["text"]) {
    contents[contents.length - 1] = tail.copy(
      Fragment.from(schema.text(tail.text + suffix))
    );
  } else {
    contents.push(schema.text(suffix));
  }

  return contents;
}

/**
 * Transform an unknown node.
 */
function unknown(node: unknown): PmNode {
  throw new Error(`unknown markdown node: ${(node as MdastNodes).type}`);
}

/**
 * Trim spaces and tabs at the start of `value`.
 *
 * @param {string} value
 *   Value to trim.
 * @returns {string}
 *   Result.
 */
function trimMarkdownSpaceStart(value: string): string {
  let index = 0;
  let code = value.charCodeAt(index);

  while (code === 9 || code === 32) {
    index++;
    code = value.charCodeAt(index);
  }

  return value.slice(index);
}

// Return nothing for nodes that are ignored.
function ignore() {
  return undefined;
}

/**
 * Fail when a non-node is found in the tree.
 */
function invalid(node: unknown) {
  throw new Error("Expected node, not `" + node + "`");
}

export type HastNodeHandler = (
  node: HastNodes,
  parent: HastParent | undefined,
  state: State
) => PmNode | PmNode[] | null;

function hastElementHandle(
  handlers: Record<string, HastNodeHandler>,
  node: HastNodes,
  parent: HastParent | undefined
): PmNode {
  return zwitch("tagName", {
    handlers,
  })(node, parent);
}

function handle(
  schema: Schema,
  handlers: MdastHandlers,
  htmlHandlers: HastHandlers,
  node: MdastNodes,
  parent: MdastParent | undefined,
  state: State
): PmNode | PmNode[] | null {
  const zwitcher = zwitch("type", {
    invalid,
    unknown,
    handlers: {
      toml: ignore,
      yaml: ignore,
      definition: ignore,
      footnoteDefinition: ignore,
      root(node: MdastRoot, _: MdastParent | undefined, state: State) {
        const children = state.all(node);
        const result = schema.topNodeType.createAndFill(null, children);
        return result;
      },
      html(node: MdastHtml) {
        const hastRoot = fromHtml(node.value);
        const html = hastRoot.children[0];
        if (html?.type !== "element") return null;
        const [, body] = html.children;
        if (body?.type !== "element") return null;
        const hastElement = body.children[0];
        if (hastElement?.type !== "element") return null;
        const result = hastElementHandle(htmlHandlers, hastElement, undefined);
        if (result) return result;
        if (!node.value) return null;
        return schema.text(node.value);
      },
      text(node: MdastText, _: MdastParent) {
        const result = schema.text(
          replaceNewlines(trimLines(String(node.value)))
        );
        return result;
      },
      ...handlers,
      linkReference(
        node: MdastLinkReference,
        parent: MdastParent,
        state: State
      ) {
        if (handlers["linkReference"])
          return handlers["linkReference"](node, parent, state);

        const id = String(node.identifier).toUpperCase();
        const definition = state.definitionById.get(id);
        if (!definition) return revert(schema, node, state);
        const linkNode: MdastLink = {
          type: "link",
          url: definition.url,
          title: definition.title,
          children: node.children,
          data: {
            ...definition.data,
            ...node.data,
          },
        };
        return handlers["link"]?.(linkNode, parent, state);
      },
    },
  }) as (
    node: MdastNodes,
    parent: MdastParent | undefined,
    state: State
  ) => PmNode | PmNode[] | null;

  return zwitcher(node, parent, state);
}

export function toPmNode<MdastNode extends MdastNodes>(
  nodeType: NodeType,
  getAttrs?: (mdastNode: MdastNode) => Record<string, unknown> | null
) {
  return (node: MdastNode, _: MdastParent, state: State) => {
    const children = state.all(node);
    const result = nodeType.createAndFill(getAttrs?.(node) ?? null, children);
    return result;
  };
}

export function toPmMark<MdastNode extends MdastNodes>(
  markType: MarkType,
  getAttrs?: (mdastNode: MdastNode) => Record<string, unknown> | null
) {
  return (node: MdastNode, _: MdastParent, state: State) => {
    const children = state.all(node);
    const mark = markType.create(getAttrs?.(node) ?? null);
    return children.map((child) => child.mark(mark.addToSet(child.marks)));
  };
}

declare module "unified" {
  interface CompileResultMap {
    PmNode: PmNode;
  }
}

export type MdastNodeHandler<Type extends string> = (
  node: Extract<MdastNodes, { type: Type }>,
  parent: MdastParent,
  state: State
) => PmNode | PmNode[] | null;

type MdastHandlers = {
  [Type in MdastNodes["type"]]?: MdastNodeHandler<Type>;
} & Record<string, MdastNodeHandler<string>>;

type HastHandlers = {
  [Key in HastNodes["type"]]?: HastNodeHandler;
} & Record<string, HastNodeHandler>;

export const remarkProseMirror = function (
  this: Processor<undefined, undefined, undefined, MdastRoot, PmNode>,
  options: {
    schema: Schema;
    handlers: MdastHandlers;
    htmlHandlers?: HastHandlers;
  }
) {
  this.compiler = function (tree) {
    const doc = handle(
      options.schema,
      options.handlers,
      options.htmlHandlers ?? {},
      tree,
      undefined,
      createState(
        options.schema,
        options.handlers,
        options.htmlHandlers ?? {},
        tree
      )
    ) as PmNode;
    doc.check();
    return doc;
  };
  // We have to do this ugly cast through unknown here because the
  // Plugin type just uses `Processor` without any type params, which
  // makes it incompatible with our more correctly typed Processor<..., MdastRoot, string>
} as unknown as Plugin<[undefined?], MdastRoot, PmNode>;
