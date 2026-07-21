import { describe, it, expect, beforeEach } from "vitest";
import { safeStorage } from "../storage";

describe("safeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    (window as unknown as { _bambuzau_fallback_store: Record<string, string> })._bambuzau_fallback_store = {};
  });

  it("returns the default value when key is missing", () => {
    expect(safeStorage.getItem("missing", "fallback")).toBe("fallback");
    expect(safeStorage.getItem("missing")).toBe("");
  });

  it("round-trips a value through localStorage", () => {
    safeStorage.setItem("k", "v");
    expect(safeStorage.getItem("k", "")).toBe("v");
    expect(localStorage.getItem("k")).toBe("v");
  });

  it("coerces non-string values to string", () => {
    safeStorage.setItem("num", 42 as unknown as string);
    expect(safeStorage.getItem("num", "")).toBe("42");
  });

  it("removeItem clears localStorage and fallback store", () => {
    safeStorage.setItem("k", "v");
    safeStorage.removeItem("k");
    expect(safeStorage.getItem("k", "default")).toBe("default");
    expect(localStorage.getItem("k")).toBeNull();
  });

  it("falls back to in-memory store when localStorage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };
    try {
      safeStorage.setItem("blocked", "value");
      // localStorage didn't persist
      expect(localStorage.getItem("blocked")).toBeNull();
      // but fallback resolved
      expect(safeStorage.getItem("blocked", "")).toBe("value");
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("keeps legacy window fallback in sync for known keys", () => {
    safeStorage.setItem("bambuzau_custom_gemini_key", "abc");
    expect((window as unknown as Record<string, string>).fallback_bambuzau_custom_gemini_key).toBe("abc");
    safeStorage.removeItem("bambuzau_custom_gemini_key");
    expect((window as unknown as Record<string, string>).fallback_bambuzau_custom_gemini_key).toBeUndefined();
  });
});