import { beforeEach, describe, expect, it } from "vitest";
import { createInspector } from "./inspector";
import type { PlanNode } from "./plan";

function node(partial: Partial<PlanNode>): PlanNode {
  return { node_type: "Node", children: [], ...partial };
}

describe("createInspector", () => {
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    trigger = document.createElement("button");
    trigger.textContent = "row";
    document.body.appendChild(trigger);
  });

  it("starts hidden", () => {
    const inspector = createInspector();
    expect(inspector.element.hidden).toBe(true);
  });

  it("shows every non-null field for the opened node", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);

    inspector.open(
      node({ node_type: "Seq Scan", relation: "users", estimated_cost_start: 0.5 }),
      trigger,
    );

    expect(inspector.element.hidden).toBe(false);
    expect(inspector.element.querySelector(".inspector-heading")?.textContent).toBe(
      "Seq Scan on users",
    );
    const text = inspector.element.textContent ?? "";
    expect(text).toContain("Estimated cost (start)");
    expect(text).toContain("0.5");
  });

  it("titles the panel with just the node type when there is no relation", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    inspector.open(node({ node_type: "Hash" }), trigger);
    expect(inspector.element.querySelector(".inspector-heading")?.textContent).toBe("Hash");
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    inspector.open(node({}), trigger);

    inspector.element
      .querySelector(".inspector-panel")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(inspector.element.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on a backdrop click but not on a click inside the panel", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    inspector.open(node({}), trigger);

    inspector.element.querySelector(".inspector-panel")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    expect(inspector.element.hidden).toBe(false);

    inspector.element.dispatchEvent(new MouseEvent("click"));
    expect(inspector.element.hidden).toBe(true);
  });

  it("closes via the Close button", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    inspector.open(node({}), trigger);

    inspector.element.querySelector<HTMLButtonElement>(".inspector-close")!.click();
    expect(inspector.element.hidden).toBe(true);
  });

  it("closing an already-closed inspector is a no-op", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    expect(() => inspector.close()).not.toThrow();
    expect(inspector.element.hidden).toBe(true);
  });

  it("ignores keys other than Escape", () => {
    const inspector = createInspector();
    document.body.appendChild(inspector.element);
    inspector.open(node({}), trigger);

    inspector.element
      .querySelector(".inspector-panel")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));

    expect(inspector.element.hidden).toBe(false);
  });
});
