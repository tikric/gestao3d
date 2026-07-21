// @ts-nocheck
import { useEffect, useState } from 'react';

/**
 * useState wrapper that persists JSON-serialisable values to localStorage.
 * - Falls back to `initial` on parse errors or storage exceptions.
 * - Writes are wrapped in try/catch so blocked iframes don't crash the app.
 * - `validate(parsed)` may return a sanitised value or `null` to reject and
 *   use `initial` instead (used by clients to fall back to seed data only
 *   when the saved value is missing — `null` validator skips that check).
 */
export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
  validate: ((value: any) => T | null) | null = null,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (saved != null) {
        const parsed = JSON.parse(saved);
        if (validate) {
          const checked = validate(parsed);
          if (checked != null) return checked;
        } else {
          return parsed as T;
        }
      }
    } catch (e) {
      console.warn(`[usePersistedState:${key}] parse failed, using initial`, e);
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[usePersistedState:${key}] write failed`, e);
    }
  }, [key, value]);

  return [value, setValue];
}