import {
  findHottestNode,
  isRowEstimateMismatch,
  pathKey,
  type NodePath,
  type PlanNode,
} from "./plan";

/** Handle to a rendered tree: lets callers navigate/inspect it after the fact. */
export interface TreeController {
  /** The tree's root DOM element - append this to show it. */
  element: HTMLElement;
  /** Expands every collapsed ancestor of `path`, then scrolls to and focuses it. */
  focusPath(path: NodePath): void;
  /** Path-keys of every currently-collapsed node, for persisting expand state. */
  getCollapsedPaths(): string[];
}

export interface RenderTreeOptions {
  /** Path-keys that should render collapsed initially (e.g. restored from storage). */
  collapsedPaths?: ReadonlySet<string>;
  /** Fired whenever a node is expanded/collapsed via its toggle. */
  onToggle?: (key: string, collapsed: boolean) => void;
  /** Fired when a node row is activated (click, or Enter/Space while focused). */
  onNodeSelect?: (node: PlanNode, key: string, rowEl: HTMLElement) => void;
}

interface NodeRefs {
  row: HTMLElement;
  toggle?: HTMLButtonElement;
}

/** Renders a PlanNode tree into a fresh, self-contained DOM subtree. */
export function renderTree(root: PlanNode, options: RenderTreeOptions = {}): TreeController {
  const hottest = findHottestNode(root);
  const refs = new Map<string, NodeRefs>();

  const container = document.createElement("div");
  container.className = "tree";
  container.setAttribute("role", "tree");
  container.appendChild(renderNode(root, [], hottest, options, refs));

  function focusPath(path: NodePath): void {
    for (let depth = 0; depth < path.length; depth++) {
      const ancestor = refs.get(pathKey(path.slice(0, depth)));
      if (ancestor?.toggle && ancestor.toggle.getAttribute("aria-expanded") === "false") {
        ancestor.toggle.click();
      }
    }
    const target = refs.get(pathKey(path));
    // scrollIntoView is absent in some test environments (jsdom) - focusing
    // the row is the behavior that matters; scrolling is a nicety on top.
    target?.row.scrollIntoView?.({ block: "center" });
    target?.row.focus();
  }

  function getCollapsedPaths(): string[] {
    const collapsed: string[] = [];
    for (const [key, ref] of refs) {
      if (ref.toggle && ref.toggle.getAttribute("aria-expanded") === "false") {
        collapsed.push(key);
      }
    }
    return collapsed;
  }

  return { element: container, focusPath, getCollapsedPaths };
}

function renderNode(
  node: PlanNode,
  path: NodePath,
  hottest: PlanNode | undefined,
  options: RenderTreeOptions,
  refs: Map<string, NodeRefs>,
): HTMLElement {
  const key = pathKey(path);
  const item = document.createElement("div");
  item.className = "tree-node";

  const row = document.createElement("div");
  row.className = "tree-row";
  row.tabIndex = 0;
  row.setAttribute("role", "treeitem");
  row.setAttribute("aria-level", String(path.length + 1));
  if (node === hottest) {
    row.classList.add("tree-row-hottest");
  }

  const hasChildren = node.children.length > 0;
  const startCollapsed = hasChildren && (options.collapsedPaths?.has(key) ?? false);
  let toggle: HTMLButtonElement | undefined;
  let childrenEl: HTMLElement | undefined;

  if (hasChildren) {
    row.setAttribute("aria-expanded", String(!startCollapsed));
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "tree-toggle";
    toggle.setAttribute("aria-expanded", String(!startCollapsed));
    toggle.setAttribute("aria-label", startCollapsed ? "Expand node" : "Collapse node");
    toggle.textContent = startCollapsed ? "▸" : "▾";
    row.appendChild(toggle);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "tree-toggle-spacer";
    spacer.setAttribute("aria-hidden", "true");
    row.appendChild(spacer);
  }

  const label = document.createElement("span");
  label.className = "tree-label";
  label.textContent = node.relation ? `${node.node_type} on ${node.relation}` : node.node_type;
  row.appendChild(label);

  const meta = document.createElement("span");
  meta.className = "tree-meta";
  meta.textContent = describeMeta(node);
  row.appendChild(meta);

  if (node === hottest) {
    const flag = document.createElement("span");
    flag.className = "tree-badge tree-badge-hot";
    flag.textContent = "hottest";
    row.appendChild(flag);
  }

  if (isRowEstimateMismatch(node)) {
    const badge = document.createElement("span");
    badge.className = "tree-badge tree-badge-mismatch";
    badge.textContent = `est ${node.estimated_rows!.toLocaleString()} → actual ${node.actual_rows!.toLocaleString()}`;
    row.appendChild(badge);
  }

  item.appendChild(row);
  refs.set(key, { row, toggle });

  function selectNode(): void {
    options.onNodeSelect?.(node, key, row);
  }

  row.addEventListener("click", selectNode);
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode();
    }
  });

  if (hasChildren) {
    childrenEl = document.createElement("div");
    childrenEl.className = "tree-children";
    childrenEl.setAttribute("role", "group");
    for (const [index, child] of node.children.entries()) {
      childrenEl.appendChild(renderNode(child, [...path, index], hottest, options, refs));
    }
    if (!startCollapsed) {
      item.appendChild(childrenEl);
    }

    toggle!.addEventListener("click", (event) => {
      event.stopPropagation();
      const expanded = toggle!.getAttribute("aria-expanded") === "true";
      toggle!.setAttribute("aria-expanded", String(!expanded));
      row.setAttribute("aria-expanded", String(!expanded));
      toggle!.setAttribute("aria-label", expanded ? "Expand node" : "Collapse node");
      toggle!.textContent = expanded ? "▸" : "▾";
      if (expanded) {
        childrenEl!.remove();
      } else {
        item.appendChild(childrenEl!);
      }
      options.onToggle?.(key, expanded);
    });
  }

  return item;
}

function describeMeta(node: PlanNode): string {
  const parts: string[] = [];
  if (node.estimated_rows !== undefined) {
    parts.push(`est ${node.estimated_rows.toLocaleString()} rows`);
  }
  if (node.actual_rows !== undefined) {
    parts.push(`actual ${node.actual_rows.toLocaleString()} rows`);
  }
  if (node.actual_time_total_ms !== undefined) {
    parts.push(`${node.actual_time_total_ms.toFixed(2)} ms`);
  }
  return parts.join(" · ");
}
