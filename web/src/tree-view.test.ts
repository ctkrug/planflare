import { describe, expect, it, vi } from "vitest";
import { renderTree } from "./tree-view";
import type { PlanNode } from "./plan";

function node(partial: Partial<PlanNode>): PlanNode {
  return { node_type: "Node", children: [], ...partial };
}

describe("renderTree", () => {
  it("renders the node type and relation as the label", () => {
    const { element } = renderTree(node({ node_type: "Seq Scan", relation: "users" }));
    expect(element.querySelector(".tree-label")?.textContent).toBe("Seq Scan on users");
  });

  it("omits the relation from the label when absent", () => {
    const { element } = renderTree(node({ node_type: "Hash" }));
    expect(element.querySelector(".tree-label")?.textContent).toBe("Hash");
  });

  it("renders nested children arbitrarily deep", () => {
    let leaf: PlanNode = node({ node_type: "Depth 10" });
    for (let i = 9; i >= 0; i--) {
      leaf = node({ node_type: `Depth ${i}`, children: [leaf] });
    }
    const { element } = renderTree(leaf);

    let cursor: Element | null = element.querySelector(".tree-node");
    let depth = 0;
    while (cursor) {
      depth++;
      cursor = cursor.querySelector(":scope > .tree-children > .tree-node");
    }
    expect(depth).toBe(11); // depths 0..10 inclusive
    expect(element.querySelectorAll(".tree-label")[10]?.textContent).toBe("Depth 10");
  });

  it("exposes each focused row as a leveled tree item with expand state", () => {
    const { element } = renderTree(
      node({ node_type: "Root", children: [node({ node_type: "Child" })] }),
    );
    const rows = element.querySelectorAll<HTMLElement>(".tree-row");

    expect(rows[0].getAttribute("role")).toBe("treeitem");
    expect(rows[0].getAttribute("aria-level")).toBe("1");
    expect(rows[0].getAttribute("aria-expanded")).toBe("true");
    expect(rows[1].getAttribute("role")).toBe("treeitem");
    expect(rows[1].getAttribute("aria-level")).toBe("2");
    expect(rows[1].hasAttribute("aria-expanded")).toBe(false);
  });

  it("collapsing a node removes its subtree from the DOM, not just visually", () => {
    const { element } = renderTree(
      node({ node_type: "Root", children: [node({ node_type: "Child" })] }),
    );
    const toggle = element.querySelector<HTMLButtonElement>(".tree-toggle")!;

    expect(element.querySelector(".tree-children")).not.toBeNull();

    toggle.click();
    expect(element.querySelector(".tree-children")).toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();
    expect(element.querySelector(".tree-children")).not.toBeNull();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("leaf nodes get no toggle button", () => {
    const { element } = renderTree(node({ node_type: "Leaf" }));
    expect(element.querySelector(".tree-toggle")).toBeNull();
  });

  it("highlights the node with the highest self-time as hottest", () => {
    const hot = node({ node_type: "Seq Scan on b", actual_time_total_ms: 90 });
    const { element } = renderTree(
      node({
        node_type: "Hash Join",
        actual_time_total_ms: 100,
        children: [node({ node_type: "Seq Scan on a", actual_time_total_ms: 5 }), hot],
      }),
    );

    const hottestRows = element.querySelectorAll(".tree-row-hottest");
    expect(hottestRows.length).toBe(1);
    expect(hottestRows[0]!.textContent).toContain("Seq Scan on b");
  });

  it("shows no hottest highlight when no node has ANALYZE data", () => {
    const { element } = renderTree(node({ node_type: "Seq Scan", children: [node({})] }));
    expect(element.querySelector(".tree-row-hottest")).toBeNull();
  });

  it("shows a mismatch badge when actual rows diverge >10x from the estimate", () => {
    const { element } = renderTree(node({ estimated_rows: 10, actual_rows: 12400 }));
    const badge = element.querySelector(".tree-badge-mismatch");
    expect(badge?.textContent).toBe("est 10 → actual 12,400");
  });

  it("shows no mismatch badge when ANALYZE data is absent", () => {
    const { element } = renderTree(node({ estimated_rows: 10 }));
    expect(element.querySelector(".tree-badge-mismatch")).toBeNull();
  });

  describe("onNodeSelect", () => {
    it("fires with the node, path key, and row element on click", () => {
      const child = node({ node_type: "Seq Scan", children: [node({ node_type: "Leaf" })] });
      const onNodeSelect = vi.fn();
      const { element } = renderTree(node({ node_type: "Root", children: [child] }), {
        onNodeSelect,
      });

      const rows = element.querySelectorAll<HTMLElement>(".tree-row");
      rows[1]!.click(); // the "Seq Scan" child

      expect(onNodeSelect).toHaveBeenCalledTimes(1);
      expect(onNodeSelect).toHaveBeenCalledWith(child, "0", rows[1]);
    });

    it("fires on Enter and Space when the row is focused", () => {
      const onNodeSelect = vi.fn();
      const { element } = renderTree(node({}), { onNodeSelect });
      const row = element.querySelector<HTMLElement>(".tree-row")!;

      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      row.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));

      expect(onNodeSelect).toHaveBeenCalledTimes(2);
    });

    it("ignores keys other than Enter and Space", () => {
      const onNodeSelect = vi.fn();
      const { element } = renderTree(node({}), { onNodeSelect });
      const row = element.querySelector<HTMLElement>(".tree-row")!;

      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

      expect(onNodeSelect).not.toHaveBeenCalled();
    });

    it("clicking a toggle does not also fire onNodeSelect", () => {
      const onNodeSelect = vi.fn();
      const { element } = renderTree(
        node({ children: [node({ node_type: "Child" })] }),
        { onNodeSelect },
      );
      element.querySelector<HTMLButtonElement>(".tree-toggle")!.click();
      expect(onNodeSelect).not.toHaveBeenCalled();
    });
  });

  describe("onToggle", () => {
    it("fires with the path key and the new collapsed state", () => {
      const onToggle = vi.fn();
      const { element } = renderTree(
        node({ children: [node({ node_type: "Child" })] }),
        { onToggle },
      );
      const toggle = element.querySelector<HTMLButtonElement>(".tree-toggle")!;

      toggle.click();
      expect(onToggle).toHaveBeenLastCalledWith("", true); // "" = the root's own path

      toggle.click();
      expect(onToggle).toHaveBeenLastCalledWith("", false);
    });
  });

  describe("collapsedPaths option", () => {
    it("renders a node collapsed up front when its path is in the set", () => {
      const { element, getCollapsedPaths } = renderTree(
        node({ children: [node({ node_type: "Child" })] }),
        { collapsedPaths: new Set([""]) }, // "" = the root's own path
      );

      expect(element.querySelector(".tree-children")).toBeNull();
      expect(element.querySelector(".tree-toggle")?.getAttribute("aria-expanded")).toBe("false");
      expect(getCollapsedPaths()).toEqual([""]);
    });
  });

  describe("focusPath", () => {
    it("expands collapsed ancestors and focuses the target node", () => {
      const target = node({ node_type: "Target" });
      const middle = node({ node_type: "Middle", children: [target] });
      const root = node({ node_type: "Root", children: [middle] });

      const { element, focusPath, getCollapsedPaths } = renderTree(root, {
        collapsedPaths: new Set(["0"]),
      });
      document.body.appendChild(element); // focus() requires an attached node in jsdom
      expect(getCollapsedPaths()).toEqual(["0"]);

      focusPath([0, 0]);

      expect(getCollapsedPaths()).toEqual([]);
      const rows = element.querySelectorAll<HTMLElement>(".tree-row");
      const targetRow = [...rows].find((r) => r.textContent?.includes("Target"));
      expect(targetRow).toBe(document.activeElement);
    });

    it("is a no-op scroll/focus at the root path", () => {
      const { element, focusPath } = renderTree(node({ node_type: "Root" }));
      document.body.appendChild(element);
      focusPath([]);
      expect(document.activeElement).toBe(element.querySelector(".tree-row"));
    });
  });
});
