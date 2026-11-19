import { useMemo, useSyncExternalStore } from "react";

// A tiny localStorage-backed list of strings (URLs) that React can subscribe to.
// Reads never throw; if storage is blocked the list lives in memory only.
export function createListStore(key: string) {
  let mem: string | null = null;
  const listeners = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    read(): string {
      if (mem !== null) return mem;
      try {
        return window.localStorage.getItem(key) ?? "";
      } catch {
        return "";
      }
    },
    write(value: string) {
      mem = value;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    },
  };
}

export type ListStore = ReturnType<typeof createListStore>;

function parse(raw: string | null): Set<string> {
  try {
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return new Set(arr.filter((u): u is string => typeof u === "string"));
  } catch {
    /* ignore */
  }
  return new Set<string>();
}

// `loaded` is false on the server and during hydration, so nothing mismatches.
export function useListStore(store: ListStore) {
  const raw = useSyncExternalStore(store.subscribe, store.read, () => null);
  const set = useMemo(() => parse(raw), [raw]);
  const add = (urls: string[]) => {
    if (urls.every((u) => set.has(u))) return;
    store.write(JSON.stringify([...new Set([...set, ...urls])]));
  };
  return { loaded: raw !== null, set, add };
}
