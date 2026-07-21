import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCustomKeys } from "../useCustomKeys";
import { safeStorage } from "../../utils/storage";

const STORAGE_KEYS = {
  gemini: "bambuzau_custom_gemini_key",
  groq: "bambuzau_custom_groq_key",
  serp: "bambuzau_custom_serp_key",
  tavily: "bambuzau_custom_tavily_key",
  jina: "bambuzau_custom_jina_key",
} as const;

describe("useCustomKeys", () => {
  beforeEach(() => {
    Object.values(STORAGE_KEYS).forEach((k) => safeStorage.removeItem(k));
  });

  it("returns empty strings when no keys are stored (happy default)", () => {
    const { result } = renderHook(() => useCustomKeys());
    expect(result.current.geminiKey).toBe("");
    expect(result.current.groqKey).toBe("");
    expect(result.current.serpKey).toBe("");
    expect(result.current.tavilyKey).toBe("");
    expect(result.current.jinaKey).toBe("");
  });

  it("initializes from safeStorage when keys exist", () => {
    safeStorage.setItem(STORAGE_KEYS.gemini, "g-key");
    safeStorage.setItem(STORAGE_KEYS.groq, "groq-key");
    safeStorage.setItem(STORAGE_KEYS.serp, "serp-key");
    safeStorage.setItem(STORAGE_KEYS.tavily, "tav-key");
    safeStorage.setItem(STORAGE_KEYS.jina, "jina-key");

    const { result } = renderHook(() => useCustomKeys());
    expect(result.current.geminiKey).toBe("g-key");
    expect(result.current.groqKey).toBe("groq-key");
    expect(result.current.serpKey).toBe("serp-key");
    expect(result.current.tavilyKey).toBe("tav-key");
    expect(result.current.jinaKey).toBe("jina-key");
  });

  it("re-reads all keys when the bambuzau_keys_updated event fires", () => {
    const { result } = renderHook(() => useCustomKeys());
    expect(result.current.geminiKey).toBe("");

    act(() => {
      safeStorage.setItem(STORAGE_KEYS.gemini, "new-gemini");
      safeStorage.setItem(STORAGE_KEYS.jina, "new-jina");
      window.dispatchEvent(new Event("bambuzau_keys_updated"));
    });

    expect(result.current.geminiKey).toBe("new-gemini");
    expect(result.current.jinaKey).toBe("new-jina");
  });

  it("exposes setters that update local state without touching storage", () => {
    const { result } = renderHook(() => useCustomKeys());
    act(() => result.current.setGroqKey("draft-groq"));
    expect(result.current.groqKey).toBe("draft-groq");
    // storage is intentionally untouched by the setter
    expect(safeStorage.getItem(STORAGE_KEYS.groq, "")).toBe("");
  });

  it("removes the event listener on unmount (no leaks, no updates)", () => {
    const { result, unmount } = renderHook(() => useCustomKeys());
    unmount();

    safeStorage.setItem(STORAGE_KEYS.serp, "post-unmount");
    window.dispatchEvent(new Event("bambuzau_keys_updated"));

    // Reading the snapshot post-unmount should still reflect pre-unmount state
    expect(result.current.serpKey).toBe("");
  });
});