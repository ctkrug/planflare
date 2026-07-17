import { describe, expect, it } from "vitest";
import { renderTree } from "./tree-view";
import type { PlanNode } from "./plan";

function node(partial: Partial<PlanNode>): PlanNode {
  return { node_type: "Node", children: [], ...partial };
}

describe("renderTree", () => {
  it("renders the node type and relation as the label", () => {
    const tree = renderTree(node({ node_type: "Seq Scan", relation: "users" }));
    expect(tree.querySelector(".tree-label")?.textContent).toBe("Seq Scan on users");
  });

  it("omits the relation from the label when absent", () => {
    const tree = renderTree(node({ node_type: "Hash" }));
    expect(tree.querySelector(".tree-label")?.textContent).toBe("Hash");
  });

  it("renders nested children arbitrarily deep", () => {
    let leaf: PlanNode = node({ node_type: "Depth 10" });
    for (let i = 9; i >= 0; i--) {
      leaf = node({ node_type: `Depth ${i}`, children: [leaf] });
    }
    const tree = renderTree(leaf);

    let cursor: Element | null = tree.querySelector(".tree-node");
    let depth = 0;
    while (cursor) {
      depth++;
      cursor = cursor.querySelector(":scope > .tree-children > .tree-node");
    }
    expect(depth).toBe(11); // depths 0..10 inclusive
    expect(tree.querySelectorAll(".tree-label")[10]?.textContent).toBe("Depth 10");
  });

  it("collapsing a node removes its subtree from the DOM, not just visually", () => {
    const tree = renderTree(
      node({ node_type: "Root", children: [node({ node_type: "Child" })] }),
    );
    const toggle = tree.querySelector<HTMLButtonElement>(".tree-toggle")!;

    expect(tree.querySelector(".tree-children")).not.toBeNull();

    toggle.click();
    expect(tree.querySelector(".tree-children")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();
    expect(tree.querySelector(".tree-children")).not.toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("leaf nodes get no toggle button", () => {
    const tree = renderTree(node({ node_type: "Leaf" }));
    expect(tree.querySelector(".tree-toggle")).toBeNull();
  });

  it("highlights the node with the highest self-time as hottest", () => {
    const hot = node({ node_type: "Seq Scan on b", actual_time_total_ms: 90 });
    const tree = renderTree(
      node({
        node_type: "Hash Join",
        actual_time_total_ms: 100,
        children: [node({ node_type: "Seq Scan on a", actual_time_total_ms: 5 }), hot],
      }),
    );

    const hottestRows = tree.querySelectorAll(".tree-row-hottest");
    expect(hottestRows.length).toBe(1);
    expect(hottestRows[0]!.textContent).toContain("Seq Scan on b");
  });

  it("shows no hottest highlight when no node has ANALYZE data", () => {
    const tree = renderTree(node({ node_type: "Seq Scan", children: [node({})] }));
    expect(tree.querySelector(".tree-row-hottest")).toBeNull();
  });

  it("shows a mismatch badge when actual rows diverge >10x from the estimate", () => {
    const tree = renderTree(node({ estimated_rows: 10, actual_rows: 12400 }));
    const badge = tree.querySelector(".tree-badge-mismatch");
    expect(badge?.textContent).toBe("est 10 → actual 12,400");
  });

  it("shows no mismatch badge when ANALYZE data is absent", () => {
    const tree = renderTree(node({ estimated_rows: 10 }));
    expect(tree.querySelector(".tree-badge-mismatch")).toBeNull();
  });
});
