import "./style.css";
import { engineLabel, isEngine, type Engine } from "./engine";
import { EXAMPLE_PLANS } from "./examples";
import { ensureParserReady, parsePlan } from "./parser";
import { renderTree, type TreeController } from "./tree-view";
import { createInspector } from "./inspector";
import { findHottestNodePath } from "./plan";
import { clearStoredPlan, loadStoredPlan, saveStoredPlan } from "./storage";

const ENGINES: Engine[] = ["postgres", "mysql", "sqlite"];

export function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <header class="site-header">
      <div class="brand-lockup">
        <span class="wordmark" id="wordmark">Plan<em>flare</em></span>
        <div>
          <h1 class="tagline">Postgres EXPLAIN ANALYZE visualizer for faster fixes</h1>
          <p class="header-subhead">Paste a plan. See the tree and the node consuming the runtime.</p>
        </div>
      </div>
      <a class="repo-link" href="https://github.com/ctkrug/planscope">View on GitHub <span aria-hidden="true">↗</span></a>
    </header>
    <main class="page-main">
      <div class="workspace">
        <aside class="input-rail" aria-label="Plan input">
          <div class="input-rail-head">
            <h2>Input</h2>
            <button id="toggle-input" class="ghost-btn" type="button" aria-expanded="true" aria-controls="input-rail-body">
              Collapse
            </button>
          </div>
          <div id="input-rail-body">
            <label for="engine-select">Engine</label>
            <select id="engine-select">
              ${ENGINES.map((e) => `<option value="${e}">${engineLabel(e)}</option>`).join("")}
            </select>
            <label for="plan-input">EXPLAIN output</label>
            <textarea
              id="plan-input"
              placeholder="Paste EXPLAIN (ANALYZE) output here..."
              spellcheck="false"
            ></textarea>
            <button id="visualize-btn" type="button">Visualize</button>
            <p id="input-error" class="input-error" role="alert" hidden></p>
            <div class="example-row" role="group" aria-label="Try an example plan">
              <span class="example-label">Try an example</span>
              ${ENGINES.map(
                (e) =>
                  `<button type="button" class="ghost-btn example-btn" data-engine="${e}">${engineLabel(e)}</button>`,
              ).join("")}
            </div>
            <button id="clear-saved-btn" class="ghost-btn" type="button">
              Clear saved plan
            </button>
          </div>
        </aside>
        <section class="output-panel" aria-label="Cost tree">
          <div class="output-panel-head">
            <h2>Cost tree</h2>
            <button id="jump-hottest-btn" class="ghost-btn" type="button" hidden>
              Jump to hottest node
            </button>
          </div>
          <div id="output-content" aria-live="polite">
            <p class="output-placeholder">Paste a plan and click Visualize to see the cost tree.</p>
          </div>
        </section>
      </div>

      <section class="explain-guide" aria-labelledby="guide-heading">
        <div class="guide-intro">
          <p class="guide-index">QUERY PLAN READER / 02</p>
          <h2 id="guide-heading">Turn EXPLAIN output into a diagnosis</h2>
          <p>A Postgres EXPLAIN ANALYZE visualizer should answer one practical question: which operation is making this query slow? Planflare parses the plan in your browser, renders its parent and child operations, and marks the node with the highest self-time. That keeps an expensive sequential scan or join visible instead of buried in copied terminal output.</p>
          <p>The same view accepts MySQL <code>EXPLAIN FORMAT=JSON</code> and SQLite <code>EXPLAIN QUERY PLAN</code>. Each parser converts engine-specific fields into one tree, so you can use the same reading pattern when an application moves between databases. The pasted text stays on your device because the Rust parser runs as WebAssembly with no upload step.</p>
        </div>

        <div class="benefit-grid" aria-label="Planflare capabilities">
          <article><span>01</span><h3>Find runtime hotspots</h3><p>Self-time subtracts child duration from each node's inclusive total, preventing the root operation from winning by default.</p></article>
          <article><span>02</span><h3>Catch estimate errors</h3><p>A blue badge flags row estimates that differ from actual rows by more than 10 times, a useful clue when the planner chose the wrong join or scan.</p></article>
          <article><span>03</span><h3>Inspect the full node</h3><p>Open any row to read startup cost, total cost, loops, relation, and available timing fields without expanding the raw plan again.</p></article>
        </div>

        <div class="faq">
          <h2>Query plan visualizer FAQ</h2>
          <details><summary>What is a Postgres EXPLAIN ANALYZE visualizer?</summary><p>It converts PostgreSQL's measured execution plan into a visual hierarchy. Planflare uses actual timing and row counts when they are present, highlights the operation with the highest self-time, and keeps the original estimates beside the measurements.</p></details>
          <details><summary>How does a SQL query plan visualizer find slow nodes?</summary><p>Planflare compares each node's measured total time with the totals of its direct children. The remaining self-time belongs to that operation. The largest remainder gets the red hotspot treatment, while every subtree remains collapsible for deeper inspection.</p></details>
          <details><summary>Does Planflare work as a MySQL EXPLAIN visualizer?</summary><p>Yes. Select MySQL and paste the output from <code>EXPLAIN FORMAT=JSON</code>. Nested loops, table access types, estimated rows, and query cost are normalized into the same cost tree used for PostgreSQL plans.</p></details>
          <details><summary>Can it visualize SQLite query plans?</summary><p>Yes. Paste the rows returned by <code>EXPLAIN QUERY PLAN</code> with their id, parent, unused, and detail columns. Planflare rebuilds the parent-child structure and labels scans, searches, indexes, and subqueries.</p></details>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <span>Planflare parses locally. No plan text leaves this page.</span>
      <a href="https://apps.charliekrug.com">More by Charlie Krug <span aria-hidden="true">→</span> apps.charliekrug.com</a>
    </footer>
  `;

  const button = root.querySelector<HTMLButtonElement>("#visualize-btn")!;
  const select = root.querySelector<HTMLSelectElement>("#engine-select")!;
  const input = root.querySelector<HTMLTextAreaElement>("#plan-input")!;
  const output = root.querySelector<HTMLElement>("#output-content")!;
  const errorEl = root.querySelector<HTMLElement>("#input-error")!;
  const collapseToggle = root.querySelector<HTMLButtonElement>("#toggle-input")!;
  const railBody = root.querySelector<HTMLElement>("#input-rail-body")!;
  const wordmark = root.querySelector<HTMLElement>("#wordmark")!;
  const jumpButton = root.querySelector<HTMLButtonElement>("#jump-hottest-btn")!;

  const inspector = createInspector();
  root.appendChild(inspector.element);

  function sweepWordmark(): void {
    wordmark.classList.remove("swept");
    void wordmark.offsetWidth; // force reflow so the transition replays on repeat parses
    wordmark.classList.add("swept");
  }

  function setRailCollapsed(collapsed: boolean): void {
    collapseToggle.setAttribute("aria-expanded", String(!collapsed));
    collapseToggle.textContent = collapsed ? "Expand" : "Collapse";
    railBody.hidden = collapsed;
  }

  collapseToggle.addEventListener("click", () => {
    setRailCollapsed(collapseToggle.getAttribute("aria-expanded") === "true");
  });

  function showPlaceholder(message: string, isError: boolean): void {
    output.innerHTML = "";
    const p = document.createElement("p");
    p.className = isError ? "output-placeholder output-placeholder-error" : "output-placeholder";
    p.textContent = message;
    output.appendChild(p);
  }

  function hideJumpButton(): void {
    jumpButton.hidden = true;
    jumpButton.onclick = null;
  }

  function showError(message: string): void {
    errorEl.textContent = message;
    errorEl.hidden = false;
    showPlaceholder(message, true);
    hideJumpButton();
  }

  function clearError(): void {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function visualize(engine: Engine, text: string, initialCollapsedPaths: string[] = []): void {
    const trimmed = text.trim();
    if (!trimmed) {
      showError("Paste a plan first.");
      return;
    }

    clearError();
    showPlaceholder(`Parsing as ${engineLabel(engine)}…`, false);

    const collapsedPaths = new Set(initialCollapsedPaths);
    const persist = (): void =>
      saveStoredPlan({ engine, text: trimmed, collapsedPaths: Array.from(collapsedPaths) });

    ensureParserReady()
      .then(() => {
        const plan = parsePlan(engine, trimmed);
        output.innerHTML = "";
        const controller: TreeController = renderTree(plan, {
          collapsedPaths,
          onNodeSelect: (node, _key, rowEl) => inspector.open(node, rowEl),
          onToggle: (key, collapsed) => {
            if (collapsed) {
              collapsedPaths.add(key);
            } else {
              collapsedPaths.delete(key);
            }
            persist();
          },
        });
        output.appendChild(controller.element);
        setRailCollapsed(true);
        sweepWordmark();

        const hottestPath = findHottestNodePath(plan);
        if (hottestPath) {
          jumpButton.hidden = false;
          jumpButton.onclick = () => controller.focusPath(hottestPath);
        } else {
          hideJumpButton();
        }

        persist();
      })
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : String(cause);
        showError(message);
      });
  }

  button.addEventListener("click", () => {
    const engine = select.value;
    if (!isEngine(engine)) return;
    visualize(engine, input.value);
  });

  root.querySelectorAll<HTMLButtonElement>(".example-btn").forEach((exampleButton) => {
    exampleButton.addEventListener("click", () => {
      const engine = exampleButton.dataset.engine;
      if (!engine || !isEngine(engine)) return;
      const text = EXAMPLE_PLANS[engine];
      select.value = engine;
      input.value = text;
      visualize(engine, text);
    });
  });

  const clearSavedButton = root.querySelector<HTMLButtonElement>("#clear-saved-btn")!;
  clearSavedButton.addEventListener("click", () => {
    clearStoredPlan();
    input.value = "";
    clearError();
    showPlaceholder("Paste a plan and click Visualize to see the cost tree.", false);
    hideJumpButton();
    setRailCollapsed(false);
  });

  const stored = loadStoredPlan();
  if (stored) {
    select.value = stored.engine;
    input.value = stored.text;
    visualize(stored.engine, stored.text, stored.collapsedPaths);
  }
}

const root = document.getElementById("app");
if (root) {
  renderApp(root);
}
