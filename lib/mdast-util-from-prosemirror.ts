import { ok as assert } from "devlop";
import {
  Nodes as MdastNodes,
  RootContent as MdastRootContent,
  Root as MdastRoot,
} from "mdast";
import { Node as PmNode, Mark as PmMark, Schema } from "prosemirror-model";
import { is } from "unist-util-is";

interface State<PmNodes extends string, PmMarks extends string> {
  one(pmNode: PmNode, parent?: PmNode): MdastNodes | MdastNodes[] | null;
  all(pmNode: PmNode): MdastNodes[];
  nodeHandlers: PmNodeHandlers<PmNodes>;
  markHandlers: PmMarkHandlers<PmMarks>;
}

function createState<PmNodes extends string, PmMarks extends string>(
  nodeHandlers: PmNodeHandlers<PmNodes>,
  markHandlers: PmMarkHandlers<PmMarks>
): State<PmNodes, PmMarks> {
  const state: State<PmNodes, PmMarks> = {
    one,
    all,
    nodeHandlers,
    markHandlers,
  };

  function one(
    pmNode: PmNode,
    parent?: PmNode
  ): MdastNodes | MdastNodes[] | null {
    const schema = pmNode.type.schema;

    const nodeName = pmNode.type.name as PmNodes;
    const handler = state.nodeHandlers[nodeName];

    if (handler) {
      return handler(pmNode, parent, state);
    }

    if (pmNode.type === schema.topNodeType) {
      const children = state.all(pmNode);
      assert(
        children.some((child) => is(child, "root")),
        "Expected non-root nodes"
      );
      return { type: "root", children: children as MdastRootContent[] };
    }
    if (pmNode.type === schema.nodes["text"]) {
      // Text nodes always have a text property
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { type: "text", value: pmNode.text! };
    }

    return null;
  }

  function all(pmNode: PmNode): MdastNodes[] {
    // TODO: Handle marks!
    return pmNode.children
      .map((child) => state.one(child, pmNode))
      .filter((node): node is MdastNodes | MdastNodes[] => !!node)
      .flat();
  }

  return state;
}

export function fromProseMirror<PmNodes extends string, PmMarks extends string>(
  pmNode: PmNode,
  options: {
    schema: Schema<PmNodes, PmMarks>;
    nodeHandlers: PmNodeHandlers<PmNodes>;
    markHandlers: PmMarkHandlers<PmMarks>;
  }
): MdastRoot {
  const state = createState(options.nodeHandlers, options.markHandlers);
  return state.one(pmNode) as MdastRoot;
}

export type PmNodeHandler = (
  node: PmNode,
  parent: PmNode | undefined,
  state: State<string, string>
) => MdastNodes | MdastNodes[] | null;

export type PmNodeHandlers<PmNodes extends string> = Partial<
  Record<PmNodes, PmNodeHandler>
>;

export type PmMarkHandler = (
  mark: PmMark,
  parent: PmNode,
  children: MdastNodes[],
  state: State<string, string>
) => MdastNodes | MdastNodes[] | null;

export type PmMarkHandlers<PmMarks extends string> = Partial<
  Record<PmMarks, PmMarkHandler>
>;

export function fromPmNode<Type extends MdastNodes["type"]>(
  type: Type,
  getAttrs?: (
    pmNode: PmNode
  ) => Omit<Extract<MdastNodes, { type: Type }>, "type" | "children">
): PmNodeHandler {
  return (
    node: PmNode,
    _: PmNode | undefined,
    state: State<string, string>
  ) => {
    const children = state.all(node);
    const result = {
      type,
      ...getAttrs?.(node),
      children,
    };
    return result as Extract<MdastNodes, { type: Type }>;
  };
}

export function fromPmMark<Type extends MdastNodes["type"]>(
  type: Type,
  getAttrs?: (
    pmNode: PmMark
  ) => Omit<Extract<MdastNodes, { type: Type }>, "type" | "children">
): PmMarkHandler {
  return (mark: PmMark, _: PmNode, mdastChildren: MdastNodes[]) => {
    const result = {
      type,
      ...getAttrs?.(mark),
      children: mdastChildren,
    };
    return result as Extract<MdastNodes, { type: Type }>;
  };
}
