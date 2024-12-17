import { ok as assert } from "devlop";
import {
  Nodes as MdastNodes,
  RootContent as MdastRootContent,
  Root as MdastRoot,
} from "mdast";
import { Node as PmNode, Mark as PmMark, Schema } from "prosemirror-model";
import { is } from "unist-util-is";

interface PmMarkedNode {
  node: PmNode;
  marks: readonly PmMark[];
}

interface State<PmNodes extends string, PmMarks extends string> {
  one(pmNode: PmNode, parent?: PmNode): MdastNodes | MdastNodes[] | null;
  all(pmNode: PmNode): MdastNodes[];
  nodeHandlers: PmNodeHandlers<PmNodes>;
  markHandlers: PmMarkHandlers<PmMarks>;
}

function createState<PmNodes extends string, PmMarks extends string>(
  nodeHandlers: PmNodeHandlers<PmNodes>,
  markHandlers: PmMarkHandlers<PmMarks>,
): State<PmNodes, PmMarks> {
  const state: State<PmNodes, PmMarks> = {
    one,
    all,
    nodeHandlers,
    markHandlers,
  };

  function one(
    pmNode: PmNode,
    parent?: PmNode,
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
        "Expected non-root nodes",
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

  function processChildPartition(nodes: PmMarkedNode[], parent: PmNode) {
    const firstChild = nodes[0];
    const firstMark = firstChild?.marks[0];
    if (!firstMark) return nodes.map((node) => state.one(node.node, parent));
    const children = hydrateMarks(
      nodes.map(({ node, marks }) => ({ node, marks: marks.slice(1) })),
      parent,
    );
    const handler = state.markHandlers[firstMark.type.name as PmMarks];
    if (!handler) return children;
    return handler(firstMark, parent, children, state);
  }

  function hydrateMarks(
    children: PmMarkedNode[],
    parent: PmNode,
  ): MdastNodes[] {
    const partitioned = children.reduce<PmMarkedNode[][]>((acc, child) => {
      const lastPartition = acc[acc.length - 1];
      if (!lastPartition) {
        return [[child]];
      }
      const lastChild = lastPartition[lastPartition.length - 1];
      if (!lastChild) {
        return [...acc.slice(0, acc.length), [child]];
      }

      if (
        (!child.marks.length && !lastChild.marks.length) ||
        (child.marks.length &&
          lastChild.marks.length &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          child.marks[0]?.eq(lastChild.marks[0]!))
      ) {
        return [
          ...acc.slice(0, acc.length - 1),
          [...lastPartition.slice(0, lastPartition.length), child],
        ];
      }

      return [...acc, [child]];
    }, []);

    return partitioned
      .flatMap((nodes) => processChildPartition(nodes, parent))
      .filter((node): node is MdastNodes | MdastNodes[] => !!node)
      .flat();
  }

  function all(pmNode: PmNode): MdastNodes[] {
    return hydrateMarks(
      pmNode.children.map((child) => ({ node: child, marks: child.marks })),
      pmNode,
    );
  }

  return state;
}

export function fromProseMirror<PmNodes extends string, PmMarks extends string>(
  pmNode: PmNode,
  options: {
    schema: Schema<PmNodes, PmMarks>;
    nodeHandlers: PmNodeHandlers<PmNodes>;
    markHandlers: PmMarkHandlers<PmMarks>;
  },
): MdastRoot {
  const state = createState(options.nodeHandlers, options.markHandlers);
  return state.one(pmNode) as MdastRoot;
}

export type PmNodeHandler = (
  node: PmNode,
  parent: PmNode | undefined,
  state: State<string, string>,
) => MdastNodes | MdastNodes[] | null;

export type PmNodeHandlers<PmNodes extends string> = Partial<
  Record<PmNodes, PmNodeHandler>
>;

export type PmMarkHandler = (
  mark: PmMark,
  parent: PmNode,
  children: MdastNodes[],
  state: State<string, string>,
) => MdastNodes | MdastNodes[] | null;

export type PmMarkHandlers<PmMarks extends string> = Partial<
  Record<PmMarks, PmMarkHandler>
>;

export function fromPmNode<Type extends MdastNodes["type"]>(
  type: Type,
  getAttrs?: (
    pmNode: PmNode,
  ) => Omit<Extract<MdastNodes, { type: Type }>, "type" | "children">,
): PmNodeHandler {
  return (
    node: PmNode,
    _: PmNode | undefined,
    state: State<string, string>,
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
    pmNode: PmMark,
  ) => Omit<Extract<MdastNodes, { type: Type }>, "type" | "children">,
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
