import { describe, expect, it } from "vitest";
import {
  findHottestNode,
  isRowEstimateMismatch,
  selfTimeMs,
  type PlanNode,
} from "./plan";

function node(partial: Partial<PlanNode>): PlanNode {
  return { node_type: "Node", children: [], ...partial };
}

describe("selfTimeMs", () => {
  it("is undefined when there is no ANALYZE data", () => {
    expect(selfTimeMs(node({}))).toBeUndefined();
  });

  it("equals total time for a leaf node", () => {
    expect(selfTimeMs(node({ actual_time_total_ms: 12.5 }))).toBe(12.5);
  });

  it("subtracts children's total time from the parent's total", () => {
    const parent = node({
      actual_time_total_ms: 10,
      children: [
        node({ actual_time_total_ms: 4 }),
        node({ actual_time_total_ms: 3 }),
      ],
    });
    expect(selfTimeMs(parent)).toBe(3);
  });

  it("treats children with no ANALYZE data as zero, not undefined", () => {
    const parent = node({
      actual_time_total_ms: 10,
      children: [node({})],
    });
    expect(selfTimeMs(parent)).toBe(10);
  });

  it("never returns negative self-time from inconsistent input", () => {
    const parent = node({
      actual_time_total_ms: 5,
      children: [node({ actual_time_total_ms: 9 })],
    });
    expect(selfTimeMs(parent)).toBe(0);
  });
});

describe("findHottestNode", () => {
  it("returns undefined when no node has ANALYZE data", () => {
    expect(findHottestNode(node({ children: [node({})] }))).toBeUndefined();
  });

  it("finds the single node with the highest self-time, several levels deep", () => {
    const hot = node({ node_type: "Seq Scan", actual_time_total_ms: 90 });
    const root = node({
      actual_time_total_ms: 100,
      children: [
        node({
          actual_time_total_ms: 95,
          children: [hot],
        }),
      ],
    });
    expect(findHottestNode(root)).toBe(hot);
  });

  it("picks the root when it is the only node with ANALYZE data", () => {
    const root = node({ actual_time_total_ms: 5 });
    expect(findHottestNode(root)).toBe(root);
  });
});

describe("isRowEstimateMismatch", () => {
  it("is false when ANALYZE data is missing", () => {
    expect(isRowEstimateMismatch(node({ estimated_rows: 10 }))).toBe(false);
    expect(isRowEstimateMismatch(node({ actual_rows: 10 }))).toBe(false);
  });

  it("is false when estimate and actual are close", () => {
    expect(
      isRowEstimateMismatch(node({ estimated_rows: 100, actual_rows: 150 })),
    ).toBe(false);
  });

  it("is true when actual exceeds estimate by more than 10x", () => {
    expect(
      isRowEstimateMismatch(node({ estimated_rows: 10, actual_rows: 12400 })),
    ).toBe(true);
  });

  it("is true when estimate exceeds actual by more than 10x", () => {
    expect(
      isRowEstimateMismatch(node({ estimated_rows: 50000, actual_rows: 2 })),
    ).toBe(true);
  });

  it("handles a zero estimate without dividing by zero", () => {
    expect(
      isRowEstimateMismatch(node({ estimated_rows: 0, actual_rows: 5 })),
    ).toBe(true);
    expect(
      isRowEstimateMismatch(node({ estimated_rows: 0, actual_rows: 0 })),
    ).toBe(false);
  });
});
