import "./style.css";
import { engineLabel, isEngine, type Engine } from "./engine";
import { ensureParserReady, parsePlan } from "./parser";
import { renderTree, type TreeController } from "./tree-view";
import { createInspector } from "./inspector";
import { findHottestNodePath } from "./plan";

const ENGINES: Engine[] = ["postgres", "mysql", "sqlite"];

export function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <header class="site-header">
      <span class="wordmark" id="wordmark">Plan<em>scope</em></span>
      <p class="tagline">Paste an EXPLAIN plan. See the tree, and the node that's slow.</p>
    </header>
    <main class="workspace">
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
    </main>
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

  function visualize(engine: Engine, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      showError("Paste a plan first.");
      return;
    }

    clearError();
    showPlaceholder(`Parsing as ${engineLabel(engine)}…`, false);

    ensureParserReady()
      .then(() => {
        const plan = parsePlan(engine, trimmed);
        output.innerHTML = "";
        const controller: TreeController = renderTree(plan, {
          onNodeSelect: (node, _key, rowEl) => inspector.open(node, rowEl),
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
}

const root = document.getElementById("app");
if (root) {
  renderApp(root);
}
