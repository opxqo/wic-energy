const CACHE_PREFIX = "wic-energy:query-cache:v1:";
export const QUERY_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export function readQueryCache<T>(path: string, now = Date.now()): T | null {
  try {
    const key = CACHE_PREFIX + path;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.expiresAt !== "number" ||
      !("value" in entry) ||
      entry.expiresAt <= now
    ) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeQueryCache<T>(
  path: string,
  value: T,
  now = Date.now(),
): void {
  try {
    const entry: CacheEntry<T> = {
      expiresAt: now + QUERY_CACHE_TTL_MS,
      value,
    };
    sessionStorage.setItem(CACHE_PREFIX + path, JSON.stringify(entry));
  } catch {
    // Storage may be disabled or full. Queries should still work normally.
  }
}

export function clearQueryCache(): void {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Cache cleanup must never block authentication or logout.
  }
}
