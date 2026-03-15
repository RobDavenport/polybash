import type { DesktopHistoryEntry, DesktopHistoryState, DesktopUndoSnapshot } from "./types";

const DEFAULT_HISTORY_LIMIT = 12;
const DEFAULT_VISIBLE_HISTORY_LIMIT = 6;
const REDO_PREFIX = "Redo ";

export type VisibleHistoryEntry = {
  label: string;
  direction: "undo" | "redo";
};

export function captureUndoSnapshot(current: DesktopUndoSnapshot): DesktopUndoSnapshot {
  return structuredClone(current);
}

export function restoreUndoSnapshot(
  snapshot?: DesktopUndoSnapshot
): DesktopUndoSnapshot | undefined {
  return snapshot ? structuredClone(snapshot) : undefined;
}

export function createHistoryState(): DesktopHistoryState {
  return {
    past: [],
    future: []
  };
}

export function pushHistoryEntry(
  history: DesktopHistoryState,
  label: string,
  snapshot: DesktopUndoSnapshot,
  limit = DEFAULT_HISTORY_LIMIT
): DesktopHistoryState {
  const resumedEntry = history.future[0]
    ? buildEntry(fromRedoLabel(history.future[0].label), history.future[0].snapshot)
    : undefined;

  return {
    past: trimHistory(
      [
        ...history.past,
        ...(resumedEntry ? [resumedEntry] : []),
        buildEntry(label, snapshot)
      ],
      limit
    ),
    future: []
  };
}

export function undoHistory(
  history: DesktopHistoryState,
  current: DesktopUndoSnapshot,
  limit = DEFAULT_HISTORY_LIMIT
): { history: DesktopHistoryState; snapshot?: DesktopUndoSnapshot; label?: string } {
  const previous = history.past.at(-1);
  if (!previous) {
    return { history };
  }

  return {
    history: {
      past: history.past.slice(0, -1),
      future: trimFuture([buildEntry(toRedoLabel(previous.label), current), ...history.future], limit)
    },
    snapshot: restoreUndoSnapshot(previous.snapshot),
    label: previous.label
  };
}

export function redoHistory(
  history: DesktopHistoryState,
  current: DesktopUndoSnapshot,
  limit = DEFAULT_HISTORY_LIMIT
): { history: DesktopHistoryState; snapshot?: DesktopUndoSnapshot; label?: string } {
  const next = history.future[0];
  if (!next) {
    return { history };
  }

  return {
    history: {
      past: trimHistory([...history.past, buildEntry(fromRedoLabel(next.label), current)], limit),
      future: history.future.slice(1)
    },
    snapshot: restoreUndoSnapshot(next.snapshot),
    label: next.label
  };
}

export function buildVisibleHistoryEntries(
  history: DesktopHistoryState,
  limit = DEFAULT_VISIBLE_HISTORY_LIMIT
): VisibleHistoryEntry[] {
  const undoEntries = history.past.slice(-limit).reverse().map((entry) => ({
    label: entry.label,
    direction: "undo" as const
  }));
  const redoEntries = history.future
    .slice(0, Math.max(limit - undoEntries.length, 0))
    .map((entry) => ({
      label: fromRedoLabel(entry.label),
      direction: "redo" as const
    }));

  return [...undoEntries, ...redoEntries];
}

function buildEntry(label: string, snapshot: DesktopUndoSnapshot): DesktopHistoryEntry {
  return {
    label,
    snapshot: captureUndoSnapshot(snapshot)
  };
}

function trimHistory(history: DesktopHistoryEntry[], limit: number): DesktopHistoryEntry[] {
  if (history.length <= limit) {
    return history;
  }

  return history.slice(history.length - limit);
}

function trimFuture(history: DesktopHistoryEntry[], limit: number): DesktopHistoryEntry[] {
  if (history.length <= limit) {
    return history;
  }

  return history.slice(0, limit);
}

function toRedoLabel(label: string): string {
  return label.startsWith(REDO_PREFIX) ? label : `${REDO_PREFIX}${label}`;
}

function fromRedoLabel(label: string): string {
  return label.startsWith(REDO_PREFIX) ? label.slice(REDO_PREFIX.length) : label;
}
