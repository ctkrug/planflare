// Mirrors crates/parser/src/model.rs::PlanNode. Field names stay snake_case
// on purpose - this is exactly what serde-wasm-bindgen hands back from the
// wasm parser, and re-casing it would be a translation layer with no payoff.
export interface PlanNode {
  node_type: string;
  relation?: string;
  estimated_cost_start?: number;
  estimated_cost_total?: number;
  estimated_rows?: number;
  actual_time_start_ms?: number;
  actual_time_total_ms?: number;
  actual_rows?: number;
  actual_loops?: number;
  children: PlanNode[];
}

/**
 * Self time in ms: this node's total time minus the sum of its children's
 * total time. Mirrors PlanNode::self_time_ms() in model.rs - the hotspot
 * highlight must use this, not actual_time_total_ms, since a parent's total
 * always includes its children's cost and would otherwise always "win".
 */
export function selfTimeMs(node: PlanNode): number | undefined {
  if (node.actual_time_total_ms === undefined) return undefined;
  const childrenTotal = node.children.reduce(
    (sum, child) => sum + (child.actual_time_total_ms ?? 0),
    0,
  );
  return Math.max(node.actual_time_total_ms - childrenTotal, 0);
}

/** Finds the node with the highest self-time in the tree, if any node has ANALYZE data. */
export function findHottestNode(root: PlanNode): PlanNode | undefined {
  let hottest: PlanNode | undefined;
  let hottestSelfTime = -Infinity;

  function walk(node: PlanNode): void {
    const time = selfTimeMs(node);
    if (time !== undefined && time > hottestSelfTime) {
      hottestSelfTime = time;
      hottest = node;
    }
    for (const child of node.children) walk(child);
  }

  walk(root);
  return hottest;
}

/**
 * Whether a node's estimated_rows and actual_rows diverge by more than 10x
 * in either direction - the mis-estimation callout in the DESIGN.md tree.
 * Returns false (never a false positive) when either value is missing.
 */
export function isRowEstimateMismatch(node: PlanNode): boolean {
  const { estimated_rows: estimated, actual_rows: actual } = node;
  if (estimated === undefined || actual === undefined) return false;
  if (estimated === 0 || actual === 0) return estimated !== actual;
  const ratio = actual / estimated;
  return ratio >= 10 || ratio <= 0.1;
}
