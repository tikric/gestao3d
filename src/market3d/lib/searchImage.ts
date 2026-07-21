export interface CustomKeys {
  GEMINI_API_KEY?: string;
  TAVILY_API_KEY?: string;
  GROQ_API_KEY?: string;
  JINA_API_KEY?: string;
}

const trimKeys = (k?: CustomKeys) => ({
  GEMINI_API_KEY: (k?.GEMINI_API_KEY || "").trim(),
  TAVILY_API_KEY: (k?.TAVILY_API_KEY || "").trim(),
  GROQ_API_KEY: (k?.GROQ_API_KEY || "").trim(),
  JINA_API_KEY: (k?.JINA_API_KEY || "").trim(),
});

/**
 * Calls /api/search-image and returns the resolved imageUrl, or null on
 * empty/error response. Centralizes payload shape and error handling.
 */
export const searchImage = async (
  query: string,
  customKeys?: CustomKeys,
  signal?: AbortSignal,
): Promise<string | null> => {
  try {
    const body: Record<string, unknown> = { query };
    if (customKeys) body.customKeys = trimKeys(customKeys);

    const response = await fetch("/api/search-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const data = await response.json();
    return data?.imageUrl ?? null;
  } catch (error: any) {
    if (error?.name === "AbortError") return null;
    console.error("[searchImage] failed:", error);
    return null;
  }
};
