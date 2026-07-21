import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    (
      window as unknown as { _bambuzau_fallback_store: Record<string, string> }
    )._bambuzau_fallback_store = {};
  }
});

afterEach(() => {
  cleanup();
});
