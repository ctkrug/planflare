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

## Planned features

- **Multi-engine parsing** — a real parser (not regex) for Postgres `EXPLAIN (ANALYZE, FORMAT
  TEXT)` / `FORMAT JSON`, MySQL `EXPLAIN FORMAT=JSON`, and SQLite `EXPLAIN QUERY PLAN`, all
  normalized into one plan-tree model.
- **Cost hotspot highlighting** — the node(s) responsible for the bulk of actual runtime (or
  estimated cost, when `ANALYZE` wasn't used) are flagged automatically.
- **Row estimate vs. actual** — mis-estimated row counts (planner expected N, got M) are called
  out inline, since that's usually the root cause of a bad plan.
- **Interactive tree** — collapse/expand subtrees, jump to the hottest node, and inspect a
  node's raw plan fields on click.
- **Runs entirely client-side** — the parser compiles to WebAssembly and runs in the browser;
  no query plan text ever leaves your machine.

## Stack

- **Parser** — Rust, compiled to WebAssembly via `wasm-bindgen`/`wasm-pack`
  (`crates/parser`). Chosen over a JS/regex parser because real EXPLAIN output has recursive,
  engine-specific grammar (nested subplans, CTEs, parallel workers) that regex handles poorly and
  silently mis-parses.
- **UI** — TypeScript + Vite (`web/`), rendering the parsed tree with no server round-trip.
- **CI** — GitHub Actions: `cargo test` for the parser, `npm run build`/`test` for the UI.

## Status

The core loop works end to end: paste a Postgres, MySQL, or SQLite plan, click Visualize, and
get a collapsible cost tree with the hottest node and row-estimate mismatches called out. See
[`docs/VISION.md`](docs/VISION.md) for the full design and [`docs/BACKLOG.md`](docs/BACKLOG.md)
for what's left.

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
