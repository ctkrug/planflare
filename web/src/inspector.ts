import { describeNodeFields, type PlanNode } from "./plan";

/** The click-to-inspect panel: shows every field on a node, one at a time. */
export interface InspectorController {
  /** Backdrop + panel wrapper - append this once, then call open()/close(). */
  element: HTMLElement;
  /** Populates the panel for `node` and shows it, moving focus into it. */
  open(node: PlanNode, trigger: HTMLElement): void;
  /** Hides the panel and returns focus to whichever row opened it. */
  close(): void;
}

/** Builds a detached inspector panel; the caller appends `.element` to the DOM. */
export function createInspector(): InspectorController {
  const backdrop = document.createElement("div");
  backdrop.className = "inspector-backdrop";
  backdrop.hidden = true;

  const panel = document.createElement("aside");
  panel.className = "inspector-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Node details");
  panel.tabIndex = -1;

  const head = document.createElement("div");
  head.className = "inspector-head";

  const heading = document.createElement("h3");
  heading.className = "inspector-heading";
  head.appendChild(heading);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ghost-btn inspector-close";
  closeBtn.textContent = "Close";
  closeBtn.setAttribute("aria-label", "Close node details");
  head.appendChild(closeBtn);

  panel.appendChild(head);

  const list = document.createElement("dl");
  list.className = "inspector-fields";
  panel.appendChild(list);

  backdrop.appendChild(panel);

  let trigger: HTMLElement | undefined;

  function close(): void {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    trigger?.focus();
    trigger = undefined;
  }

  function open(node: PlanNode, triggerEl: HTMLElement): void {
    trigger = triggerEl;
    heading.textContent = node.relation ? `${node.node_type} on ${node.relation}` : node.node_type;
    list.innerHTML = "";
    for (const field of describeNodeFields(node)) {
      const dt = document.createElement("dt");
      dt.textContent = field.label;
      const dd = document.createElement("dd");
      dd.textContent = field.value;
      list.appendChild(dt);
      list.appendChild(dd);
    }
    backdrop.hidden = false;
    panel.focus();
  }

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });
  closeBtn.addEventListener("click", close);
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return { element: backdrop, open, close };
}
