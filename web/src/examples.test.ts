import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAMPLE_PLANS } from "./examples";
import { initSync, parse_plan } from "./wasm/planscope_parser.js";

// Deliberately loads the real compiled wasm (via initSync, which takes raw
// bytes and skips the fetch() the default async init uses - jsdom has no
// server to fetch from) instead of mocking it, so a parser regression or a
// stale example fixture fails loudly here rather than only in the browser.
// vitest always runs with cwd = web/ (see package.json's "test" script).
const wasmBytes = readFileSync(join(process.cwd(), "src/wasm/planscope_parser_bg.wasm"));
initSync({ module: wasmBytes });

describe("EXAMPLE_PLANS", () => {
  it("parses cleanly for every engine", () => {
    const postgres = parse_plan("postgres", EXAMPLE_PLANS.postgres);
    expect(postgres.node_type).toBe("Hash Join");
    expect(postgres.children.length).toBeGreaterThan(0);

    const mysql = parse_plan("mysql", EXAMPLE_PLANS.mysql);
    expect(mysql.node_type).toBe("Nested Loop");
    expect(mysql.children.length).toBe(2);

    const sqlite = parse_plan("sqlite", EXAMPLE_PLANS.sqlite);
    expect(sqlite.node_type).toBe("Query");
    expect(sqlite.children.length).toBe(2);
  });

  it("has an example for every engine the UI offers", () => {
    expect(Object.keys(EXAMPLE_PLANS).sort()).toEqual(["mysql", "postgres", "sqlite"]);
    for (const text of Object.values(EXAMPLE_PLANS)) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
