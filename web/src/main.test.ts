import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_PLANS } from "./examples";
import type { PlanNode } from "./plan";

const ensureParserReady = vi.fn(async () => undefined);
const parsePlan = vi.fn<(engine: string, text: string) => PlanNode>();

vi.mock("./parser", () => ({
  ensureParserReady,
  parsePlan,
}));

async function setup() {
  const { renderApp } = await import("./main");
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById("app")!;
  renderApp(root);
  return {
    root,
    textarea: root.querySelector<HTMLTextAreaElement>("#plan-input")!,
    select: root.querySelector<HTMLSelectElement>("#engine-select")!,
    button: root.querySelector<HTMLButtonElement>("#visualize-btn")!,
    output: root.querySelector<HTMLElement>("#output-content")!,
    error: root.querySelector<HTMLElement>("#input-error")!,
    railBody: root.querySelector<HTMLElement>("#input-rail-body")!,
    jumpButton: root.querySelector<HTMLButtonElement>("#jump-hottest-btn")!,
  };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("renderApp", () => {
  beforeEach(() => {
    ensureParserReady.mockClear();
    parsePlan.mockReset();
    localStorage.clear();
  });

  it("shows an inline error and never calls the parser when the input is empty", async () => {
    const { button, output, error } = await setup();

    button.click();

    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Paste a plan first.");
    expect(output.textContent).toContain("Paste a plan first.");
    expect(parsePlan).not.toHaveBeenCalled();
  });

  it("renders the cost tree and collapses the input rail on a successful parse", async () => {
    const { textarea, button, output, railBody } = await setup();
    textarea.value = "Seq Scan on users (cost=0.00..1.00 rows=1 width=4)";
    parsePlan.mockReturnValue({ node_type: "Seq Scan", relation: "users", children: [] });

    button.click();
    await flush();

    expect(output.querySelector(".tree")).not.toBeNull();
    expect(output.querySelector(".tree-label")?.textContent).toBe("Seq Scan on users");
    expect(railBody.hidden).toBe(true);
  });

  it("surfaces a parse failure as a styled inline error, not a thrown exception", async () => {
    const { textarea, button, output, error } = await setup();
    textarea.value = "not a real plan";
    parsePlan.mockImplementation(() => {
      throw new Error("no plan lines found");
    });

    button.click();
    await flush();

    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("no plan lines found");
    expect(output.querySelector(".output-placeholder-error")?.textContent).toBe(
      "no plan lines found",
    );
  });

  it("renders a parser error message as plain text, never as markup", async () => {
    const { textarea, button, output } = await setup();
    textarea.value = "bad input";
    parsePlan.mockImplementation(() => {
      throw new Error("bad node id in row: <img src=x onerror=alert(1)>");
    });

    button.click();
    await flush();

    expect(output.querySelector("img")).toBeNull();
    expect(output.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("lets the input rail be manually collapsed and expanded", async () => {
    const { root, railBody } = await setup();
    const toggle = root.querySelector<HTMLButtonElement>("#toggle-input")!;

    toggle.click();
    expect(railBody.hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();
    expect(railBody.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens the node inspector when a tree row is clicked", async () => {
    const { root, textarea, button, output } = await setup();
    textarea.value = "Seq Scan on users (cost=0.00..1.00 rows=1 width=4)";
    parsePlan.mockReturnValue({ node_type: "Seq Scan", relation: "users", children: [] });

    button.click();
    await flush();

    output.querySelector<HTMLElement>(".tree-row")!.click();

    const panel = root.querySelector(".inspector-panel")!;
    expect(panel.textContent).toContain("Seq Scan on users");
    const backdrop = root.querySelector<HTMLElement>(".inspector-backdrop")!;
    expect(backdrop.hidden).toBe(false);
  });

  it("shows a jump-to-hottest button when the plan has ANALYZE data, and it focuses the hottest row", async () => {
    const { textarea, button, output, jumpButton } = await setup();
    textarea.value = "Hash Join (actual time=0.50..10.00 rows=10 loops=1)";
    const hot = { node_type: "Seq Scan on b", actual_time_total_ms: 90, children: [] };
    parsePlan.mockReturnValue({
      node_type: "Hash Join",
      actual_time_total_ms: 100,
      children: [{ node_type: "Seq Scan on a", actual_time_total_ms: 5, children: [] }, hot],
    });

    button.click();
    await flush();

    expect(jumpButton.hidden).toBe(false);
    jumpButton.click();

    const rows = output.querySelectorAll<HTMLElement>(".tree-row");
    const hotRow = [...rows].find((r) => r.textContent?.includes("Seq Scan on b"));
    expect(document.activeElement).toBe(hotRow);
  });

  it("hides the jump-to-hottest button when the plan has no ANALYZE data", async () => {
    const { textarea, button, jumpButton } = await setup();
    textarea.value = "Seq Scan on users (cost=0.00..1.00 rows=1 width=4)";
    parsePlan.mockReturnValue({ node_type: "Seq Scan", relation: "users", children: [] });

    button.click();
    await flush();

    expect(jumpButton.hidden).toBe(true);
  });

  it("hides the jump-to-hottest button after a subsequent parse error", async () => {
    const { textarea, button, jumpButton } = await setup();
    textarea.value = "Hash Join (actual time=0.50..10.00 rows=10 loops=1)";
    parsePlan.mockReturnValue({ node_type: "Hash Join", actual_time_total_ms: 10, children: [] });
    button.click();
    await flush();
    expect(jumpButton.hidden).toBe(false);

    parsePlan.mockImplementation(() => {
      throw new Error("no plan lines found");
    });
    button.click();
    await flush();

    expect(jumpButton.hidden).toBe(true);
  });

  it("loads and visualizes the matching example when its button is clicked", async () => {
    const { root, textarea, select, output } = await setup();
    parsePlan.mockReturnValue({ node_type: "Nested Loop", children: [] });

    const mysqlBtn = root.querySelector<HTMLButtonElement>('.example-btn[data-engine="mysql"]')!;
    mysqlBtn.click();
    await flush();

    expect(select.value).toBe("mysql");
    expect(textarea.value).toBe(EXAMPLE_PLANS.mysql);
    expect(parsePlan).toHaveBeenCalledWith("mysql", EXAMPLE_PLANS.mysql.trim());
    expect(output.querySelector(".tree")).not.toBeNull();
  });

  it("has a working example button for every engine", async () => {
    const { root } = await setup();
    const engines = [...root.querySelectorAll<HTMLButtonElement>(".example-btn")].map(
      (b) => b.dataset.engine,
    );
    expect(engines.sort()).toEqual(["mysql", "postgres", "sqlite"]);
  });

  it("restores the last-saved plan when the app mounts", async () => {
    localStorage.setItem(
      "planscope:last-plan",
      JSON.stringify({ engine: "sqlite", text: "1|0|0|SCAN t", collapsedPaths: [] }),
    );
    parsePlan.mockReturnValue({ node_type: "SCAN", relation: "t", children: [] });

    const { renderApp } = await import("./main");
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById("app")!;
    renderApp(root);
    await flush();

    expect(root.querySelector<HTMLSelectElement>("#engine-select")!.value).toBe("sqlite");
    expect(root.querySelector<HTMLTextAreaElement>("#plan-input")!.value).toBe("1|0|0|SCAN t");
    expect(root.querySelector("#output-content .tree")).not.toBeNull();
    expect(parsePlan).toHaveBeenCalledWith("sqlite", "1|0|0|SCAN t");
  });

  it("shows an inline error instead of crashing when the stored plan text no longer parses", async () => {
    localStorage.setItem(
      "planscope:last-plan",
      JSON.stringify({ engine: "postgres", text: "garbage from a hand-edited storage entry", collapsedPaths: [] }),
    );
    parsePlan.mockImplementation(() => {
      throw new Error("no plan lines found");
    });

    const { renderApp } = await import("./main");
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.getElementById("app")!;
    expect(() => renderApp(root)).not.toThrow();
    await flush();

    const error = root.querySelector<HTMLElement>("#input-error")!;
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("no plan lines found");
    expect(root.querySelector("#output-content .tree")).toBeNull();
  });

  it("mounts normally with no stored plan (nothing to restore)", async () => {
    const { output } = await setup();
    expect(output.querySelector(".output-placeholder")).not.toBeNull();
    expect(parsePlan).not.toHaveBeenCalled();
  });

  it("the Clear button removes the stored plan and resets the UI", async () => {
    const { root, textarea, button, output, jumpButton } = await setup();
    textarea.value = "Seq Scan on users (cost=0.00..1.00 rows=1 width=4)";
    parsePlan.mockReturnValue({ node_type: "Seq Scan", relation: "users", children: [] });
    button.click();
    await flush();

    const { loadStoredPlan } = await import("./storage");
    expect(loadStoredPlan()).not.toBeNull();

    root.querySelector<HTMLButtonElement>("#clear-saved-btn")!.click();

    expect(loadStoredPlan()).toBeNull();
    expect(textarea.value).toBe("");
    expect(output.querySelector(".tree")).toBeNull();
    expect(output.querySelector(".output-placeholder")).not.toBeNull();
    expect(jumpButton.hidden).toBe(true);
  });

  it("renders the result of the latest click when Visualize is double-clicked with changing input", async () => {
    const { textarea, button, output } = await setup();

    textarea.value = "first plan text";
    parsePlan.mockReturnValueOnce({ node_type: "First", children: [] });
    button.click();

    textarea.value = "second plan text";
    parsePlan.mockReturnValueOnce({ node_type: "Second", children: [] });
    button.click();

    await flush();

    expect(parsePlan).toHaveBeenNthCalledWith(1, "postgres", "first plan text");
    expect(parsePlan).toHaveBeenNthCalledWith(2, "postgres", "second plan text");
    expect(output.querySelector(".tree-label")?.textContent).toBe("Second");
  });

  it("persists collapse state when a node is toggled", async () => {
    const { textarea, button, output } = await setup();
    textarea.value = "irrelevant";
    parsePlan.mockReturnValue({
      node_type: "Root",
      children: [{ node_type: "Child", children: [] }],
    });
    button.click();
    await flush();

    output.querySelector<HTMLButtonElement>(".tree-toggle")!.click();

    const { loadStoredPlan } = await import("./storage");
    expect(loadStoredPlan()?.collapsedPaths).toEqual([""]);
  });

  it("does nothing when the engine select's value is tampered with off the known list", async () => {
    const { select, button } = await setup();
    // <select>.value silently resets to "" for an out-of-list value, but
    // guard against any environment/extension that could force something
    // else through - the click handler must never call the parser with it.
    Object.defineProperty(select, "value", { value: "oracle", configurable: true });

    button.click();
    await flush();

    expect(parsePlan).not.toHaveBeenCalled();
  });

  it("does nothing when an example button's data-engine is tampered with", async () => {
    const { root } = await setup();
    const mysqlBtn = root.querySelector<HTMLButtonElement>('.example-btn[data-engine="mysql"]')!;
    mysqlBtn.dataset.engine = "oracle";

    mysqlBtn.click();
    await flush();

    expect(parsePlan).not.toHaveBeenCalled();
  });

  it("removes a path from persisted collapse state when it's re-expanded", async () => {
    const { textarea, button, output } = await setup();
    textarea.value = "irrelevant";
    parsePlan.mockReturnValue({
      node_type: "Root",
      children: [{ node_type: "Child", children: [] }],
    });
    button.click();
    await flush();

    const toggle = output.querySelector<HTMLButtonElement>(".tree-toggle")!;
    toggle.click();
    toggle.click();

    const { loadStoredPlan } = await import("./storage");
    expect(loadStoredPlan()?.collapsedPaths).toEqual([]);
  });
});
