# Planscope

Paste a Postgres, MySQL, or SQLite `EXPLAIN` (or `EXPLAIN ANALYZE`) output and get it back as
an interactive cost tree — the expensive sequential scans and mis-estimated row counts
highlighted, not buried in a wall of text.

## Why

Query plans are dense, engine-specific, and easy to misread under pressure. Most tooling either
locks you into one database vendor or falls back to regex-splitting text that breaks the moment
a plan format changes. Planscope parses real plan output — Postgres, MySQL, and SQLite — into one
normalized tree model, so the reading experience is the same no matter which engine produced it.

Paste a gnarly 40-line `EXPLAIN ANALYZE` dump and it collapses into a clean indented tree in
under a second, with the node responsible for the majority of the runtime highlighted before
you've gone looking for it.

![Planscope rendering a Postgres hash join, with the seq-scan responsible for the runtime highlighted in red and a row-estimate mismatch badge in blue](docs/screenshot.png)

## Features

- **Multi-engine parsing** — a real parser (not regex) for Postgres text and `FORMAT JSON`
  output, MySQL `EXPLAIN FORMAT=JSON`, and SQLite `EXPLAIN QUERY PLAN`, all normalized into one
  plan-tree model.
- **Cost hotspot highlighting** — the node responsible for the bulk of actual runtime (by
  self-time, not inclusive total) is flagged automatically, with a one-click "jump to hottest
  node" that expands whatever's collapsed in the way.
- **Row estimate vs. actual** — mis-estimated row counts (planner expected N, got M, off by
  >10x) are called out inline, since that's usually the root cause of a bad plan.
- **Interactive tree** — collapse/expand any subtree, click a node to inspect every raw plan
  field, and try a canned example per engine without a live database.
- **Persistence** — the last-pasted plan (text, engine, and expand/collapse state) survives a
  reload via `localStorage`; a "Clear saved plan" button resets it.
- **Runs entirely client-side** — the parser compiles to WebAssembly and runs in the browser;
  no query plan text ever leaves your machine.

## Planned features

- Saved plan collections and shareable links.

## Stack

- **Parser** — Rust, compiled to WebAssembly via `wasm-bindgen`/`wasm-pack`
  (`crates/parser`). Chosen over a JS/regex parser because real EXPLAIN output has recursive,
  engine-specific grammar (nested subplans, CTEs, parallel workers) that regex handles poorly and
  silently mis-parses.
- **UI** — TypeScript + Vite (`web/`), rendering the parsed tree with no server round-trip.
- **CI** — GitHub Actions: `cargo test` for the parser, `npm run build`/`test` for the UI.

## Status

The core loop works end to end: paste a Postgres, MySQL, or SQLite plan (or click a per-engine
example), and get a collapsible cost tree with the hottest node and row-estimate mismatches
called out, a "jump to hottest node" shortcut, click-to-inspect on any node, and the plan
persisted across reloads. See [`docs/VISION.md`](docs/VISION.md) for the full design and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## Development

Building the UI requires the `wasm32-unknown-unknown` Rust target and a `wasm-bindgen-cli`
matching the version pinned in `crates/parser/Cargo.toml` (see `.github/workflows/ci.yml`
for the exact versions used in CI).

```sh
# parser
cd crates/parser && cargo test

# UI (npm scripts build the wasm bindings automatically, see scripts/build-wasm.sh)
cd web && npm install && npm run dev
```

## License

MIT — see [LICENSE](LICENSE).
