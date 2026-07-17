import { isEngine, type Engine } from "./engine";

const STORAGE_KEY = "planscope:last-plan";

/** The last successfully parsed plan, as persisted to localStorage. */
export interface StoredPlan {
  engine: Engine;
  text: string;
  /** tree-view path-keys of every collapsed node, so expand state survives a reload. */
  collapsedPaths: string[];
}

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    // some sandboxed/private-mode environments throw on mere access
    return false;
  }
}

/** Reads the last-saved plan, or null if there isn't one or it's unreadable/corrupt. */
export function loadStoredPlan(): StoredPlan | null {
  if (!storageAvailable()) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPlan> | null;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.engine !== "string" ||
      !isEngine(parsed.engine) ||
      typeof parsed.text !== "string" ||
      !Array.isArray(parsed.collapsedPaths)
    ) {
      return null;
    }
    return {
      engine: parsed.engine,
      text: parsed.text,
      collapsedPaths: parsed.collapsedPaths.filter((p): p is string => typeof p === "string"),
    };
  } catch {
    return null;
  }
}

/** Persists `plan` as the last-pasted plan. Silently no-ops if storage is unavailable/full. */
export function saveStoredPlan(plan: StoredPlan): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // quota exceeded or storage disabled - persistence is a nicety, not required
  }
}

/** Removes the stored plan - the explicit "Clear" action. */
export function clearStoredPlan(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
