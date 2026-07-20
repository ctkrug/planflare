# Planscope — backlog

Epic/story breakdown for the build. Every story has 1–3 verifiable acceptance criteria — concrete
checks, not vibes. Story 1 is the wow moment: it ships before anything optional.

## Epic 1 — Core parse-to-tree experience

- [x] **1. Wire the Postgres parser to the UI and render the cost tree (WOW MOMENT)**
  - Pasting a real ~40-line Postgres `EXPLAIN ANALYZE` dump and clicking Visualize renders an
    indented, collapsible tree in under 1 second, measured from click to render.
  - The node with the highest `self_time_ms` is visually highlighted (signal-red, per
    `docs/DESIGN.md`) automatically — no user interaction required to find it.
  - Each tree node displays node type, relation (if any), estimated rows, and actual rows/time
    when `ANALYZE` data is present.

- [x] **2. Load the WASM module and call `parse_plan` from the UI**
  - `web` imports the `wasm-pack`-built `crates/parser` package and calls
    `parse_plan("postgres", text)` on click.
  - A parse failure (malformed input) is caught and surfaced as UI state, not an unhandled
    promise rejection in the console.

- [x] **3. Recursive tree renderer component**
  - Renders `PlanNode` trees of arbitrary depth with no fixed depth limit (verified to depth 10+
    with a synthetic fixture).
  - Each node is independently collapsible/expandable; collapsing a node removes its subtree from
    the accessibility tree, not just visually indents it.

## Epic 2 — Multi-engine parsing, end to end

- [x] **4. Wire MySQL `EXPLAIN FORMAT=JSON` parsing end to end**
  - Pasting a MySQL JSON dump with a `nested_loop` join renders in the same tree UI as Postgres,
    with the engine's own field vocabulary (`access_type` as node type).
  - Invalid/non-JSON input under the MySQL engine selection shows an inline error naming the
    problem, never a blank or silently-wrong tree.

- [x] **5. Wire SQLite `EXPLAIN QUERY PLAN` parsing end to end**
  - Pasting `id|parent|notused|detail` rows for a query with a subquery renders the subquery node
    as a child of its owning operation, not a sibling.
  - A flat multi-table join (all rows `parent=0`) renders as siblings under a synthetic "Query"
    root, matching `sqlite.rs`'s existing behavior.

- [x] **6. Row-count mis-estimation callout**
  - Any node where `actual_rows` differs from `estimated_rows` by more than 10x (either
    direction) shows a visible badge, e.g. "est 10 → actual 12,400", in `--accent-support`.
  - Nodes without `ANALYZE` data (no `actual_rows`) show no mis-estimation badge — never a false
    positive from missing data.

- [x] **7. Postgres JSON-format support (`EXPLAIN (FORMAT JSON)`)**
  - Pasting valid Postgres JSON-format output parses to the same `PlanNode` tree as the
    equivalent text-format dump, cross-checked on one fixture query.
  - The engine selector's "PostgreSQL" option auto-detects text vs. JSON input (leading `[`/`{`)
    without a separate format toggle.

## Epic 3 — Interactive tree UX

- [x] **8. Click-to-inspect raw node fields**
  - Clicking a tree node opens a panel listing every non-null field on that `PlanNode`, including
    ones not shown inline (e.g. `estimated_cost_start`).
  - Escape or click-away closes the inspector and returns focus to the node that opened it.

- [x] **9. "Jump to hottest node" control**
  - A single control scrolls to and expands the path to the node with the highest self-time,
    auto-expanding any collapsed ancestors along the way.
  - Verified correct when the hottest node is nested 3+ levels deep with collapsed ancestors.

- [x] **10. Persist the last-pasted plan in `localStorage`**
  - Reloading the page restores the last successfully parsed plan (engine, raw text, tree
    expand/collapse state) with no network round-trip.
  - An explicit "Clear" action removes the stored plan; reloading after Clear does not resurrect
    the old tree.

- [x] **11. Sample plans for each engine ("Try an example")**
  - A "Try an example" control per engine loads a canned, realistic EXPLAIN dump and immediately
    visualizes it, so the tool is demonstrable without a live database.
  - All three engines (Postgres, MySQL, SQLite) have at least one working example.

## Epic 4 — Ship readiness

- [x] **12. Design polish pass — apply `docs/DESIGN.md` across the full app**
  - The app matches `docs/DESIGN.md` tokens (colors, fonts, spacing, corner radius, depth) with
    no leftover SCOPE-phase placeholder styling remaining.
  - Passes the D3 self-review checklist at 390px, 768px, and 1440px with no horizontal scroll or
    broken layout at any width.

- [x] **13. Empty, loading, and error states are designed**
  - The empty state (no plan yet) shows explicit guidance ("paste a plan or try an example"),
    never a blank panel.
  - A parse error shows the parser's specific error message inline, styled as an error state —
    not a console-only failure.

- [x] **14. Landing site (`site/`) matches the app's design system**
  - `site/` uses the same tokens and fonts as `web/` (per the D4 ship gate) and links to the live
    app.
  - Builds to one static directory with relative asset paths, independently of `web/`.

- [x] **15. Accessibility pass**
  - Every interactive control (engine select, textarea, buttons, tree nodes) has a visible focus
    state and is operable by keyboard alone (Tab / Enter / Escape).
  - `--text` on `--bg` and `--accent` on `--surface` both measure ≥ 4.5:1 contrast.
