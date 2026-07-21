import { describe, it, expect, beforeEach } from "vitest";
import { getApiUrl, validateApiKeyFormat } from "../api";

describe("validateApiKeyFormat", () => {
  it.each([
    [undefined, "vazia"],
    ["", "vazia"],
    ["    ", "espaços"],
    ["null", "null"],
    ["undefined", "undefined"],
    ["none", "real"],
    ["placeholder", "real"],
    ["short", "curta"],
  ])("rejects %p", (input, reasonFragment) => {
    const r = validateApiKeyFormat(input as string | undefined);
    expect(r.isValid).toBe(false);
    expect(r.reason?.toLowerCase()).toContain(reasonFragment);
  });

  it("accepts a key of at least 15 chars", () => {
    expect(validateApiKeyFormat("a".repeat(15))).toEqual({ isValid: true });
    expect(validateApiKeyFormat("  " + "k".repeat(20) + "  ").isValid).toBe(true);
  });
});

describe("getApiUrl", () => {
  beforeEach(() => {
    // jsdom default origin is http://localhost:3000
  });

  it("returns absolute URLs unchanged", () => {
    expect(getApiUrl("https://example.com/x")).toBe("https://example.com/x");
    expect(getApiUrl("http://example.com/y")).toBe("http://example.com/y");
  });

  it("prefixes window.location.origin for relative endpoints in a browser", () => {
    const url = getApiUrl("/api/quotations");
    expect(url).toBe(`${window.location.origin}/api/quotations`);
  });

  it("adds a leading slash to endpoints missing one", () => {
    expect(getApiUrl("api/quotations")).toBe(`${window.location.origin}/api/quotations`);
  });
});