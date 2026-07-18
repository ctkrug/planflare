import { beforeEach, describe, expect, it } from "vitest";
import { clearStoredPlan, loadStoredPlan, saveStoredPlan } from "./storage";

const KEY = "planscope:last-plan";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing has been saved", () => {
    expect(loadStoredPlan()).toBeNull();
  });

  it("round-trips a saved plan", () => {
    saveStoredPlan({ engine: "postgres", text: "Seq Scan on t", collapsedPaths: ["0", "0.1"] });
    expect(loadStoredPlan()).toEqual({
      engine: "postgres",
      text: "Seq Scan on t",
      collapsedPaths: ["0", "0.1"],
    });
  });

  it("returns null after clearStoredPlan, not the old value", () => {
    saveStoredPlan({ engine: "mysql", text: "{}", collapsedPaths: [] });
    clearStoredPlan();
    expect(loadStoredPlan()).toBeNull();
  });

  it("returns null for malformed JSON instead of throwing", () => {
    localStorage.setItem(KEY, "{not valid json");
    expect(() => loadStoredPlan()).not.toThrow();
    expect(loadStoredPlan()).toBeNull();
  });

  it("returns null when the engine field is missing or unrecognized", () => {
    localStorage.setItem(KEY, JSON.stringify({ text: "x", collapsedPaths: [] }));
    expect(loadStoredPlan()).toBeNull();

    localStorage.setItem(
      KEY,
      JSON.stringify({ engine: "oracle", text: "x", collapsedPaths: [] }),
    );
    expect(loadStoredPlan()).toBeNull();
  });

  it("returns null when collapsedPaths is not an array", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ engine: "sqlite", text: "x", collapsedPaths: "0" }),
    );
    expect(loadStoredPlan()).toBeNull();
  });

  it("clearing when nothing is stored is a safe no-op", () => {
    expect(() => clearStoredPlan()).not.toThrow();
  });

  it("treats an environment where localStorage throws on mere access as unavailable", () => {
    // Some sandboxed/private-mode browsers throw just from referencing
    // `localStorage` (not only from calling its methods) - simulate that by
    // replacing the global binding with a throwing accessor.
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get(): Storage {
        throw new DOMException("access denied", "SecurityError");
      },
    });

    try {
      expect(loadStoredPlan()).toBeNull();
      expect(() =>
        saveStoredPlan({ engine: "postgres", text: "x", collapsedPaths: [] }),
      ).not.toThrow();
      expect(() => clearStoredPlan()).not.toThrow();
    } finally {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
    }
  });
});
