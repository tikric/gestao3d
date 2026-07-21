// @ts-nocheck
// Centralized safe storage utility that falls back to window memory if localStorage is restricted/blocked.

if (typeof window !== 'undefined') {
  if (!(window as any)._bambuzau_fallback_store) {
    (window as any)._bambuzau_fallback_store = {};
  }
}

export const safeStorage = {
  getItem(key: string, defaultValue = ''): string {
    let val: string | null = null;
    try {
      if (typeof window !== 'undefined') {
        val = localStorage.getItem(key);
      }
    } catch (_) {
      // localStorage is blocked or throws a SecurityError
    }

    if (val === null || val === undefined) {
      try {
        val = (window as any)._bambuzau_fallback_store[key];
      } catch (_) {}
    }

    // Keep individual legacy window fallback properties in sync
    if (val === null || val === undefined) {
      try {
        if (key === 'bambuzau_custom_gemini_key') {
          val = (window as any).fallback_bambuzau_custom_gemini_key;
        } else if (key === 'bambuzau_custom_groq_key') {
          val = (window as any).fallback_bambuzau_custom_groq_key;
        } else if (key === 'bambuzau_custom_serp_key') {
          val = (window as any).fallback_bambuzau_custom_serp_key;
        } else if (key === 'bambuzau_custom_tavily_key') {
          val = (window as any).fallback_bambuzau_custom_tavily_key;
        } else if (key === 'bambuzau_custom_jina_key') {
          val = (window as any).fallback_bambuzau_custom_jina_key;
        } else if (key === 'bambuzau_ai_provider') {
          val = (window as any).fallback_bambuzau_ai_provider;
        }
      } catch (_) {}
    }

    return (val !== null && val !== undefined) ? val : defaultValue;
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    // Convert values to string cleanly
    const stringValue = String(value);

    // 1. Try setting in localStorage
    try {
      localStorage.setItem(key, stringValue);
    } catch (_) {
      // Silently catch localStorage writes blocked in iframes
    }

    // 2. Set in centralized in-memory store
    try {
      if (!(window as any)._bambuzau_fallback_store) {
        (window as any)._bambuzau_fallback_store = {};
      }
      (window as any)._bambuzau_fallback_store[key] = stringValue;
    } catch (_) {}

    // 3. Keep legacy individual fallbacks in sync
    try {
      if (key === 'bambuzau_custom_gemini_key') {
        (window as any).fallback_bambuzau_custom_gemini_key = stringValue;
      } else if (key === 'bambuzau_custom_groq_key') {
        (window as any).fallback_bambuzau_custom_groq_key = stringValue;
      } else if (key === 'bambuzau_custom_serp_key') {
        (window as any).fallback_bambuzau_custom_serp_key = stringValue;
      } else if (key === 'bambuzau_custom_tavily_key') {
        (window as any).fallback_bambuzau_custom_tavily_key = stringValue;
      } else if (key === 'bambuzau_custom_jina_key') {
        (window as any).fallback_bambuzau_custom_jina_key = stringValue;
      } else if (key === 'bambuzau_ai_provider') {
        (window as any).fallback_bambuzau_ai_provider = stringValue;
      }
    } catch (_) {}
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;

    // 1. Try removing from localStorage
    try {
      localStorage.removeItem(key);
    } catch (_) {}

    // 2. Remove from centralized in-memory store
    try {
      if ((window as any)._bambuzau_fallback_store) {
        delete (window as any)._bambuzau_fallback_store[key];
      }
    } catch (_) {}

    // 3. Clear from legacy individual fallbacks
    try {
      if (key === 'bambuzau_custom_gemini_key') {
        delete (window as any).fallback_bambuzau_custom_gemini_key;
      } else if (key === 'bambuzau_custom_groq_key') {
        delete (window as any).fallback_bambuzau_custom_groq_key;
      } else if (key === 'bambuzau_custom_serp_key') {
        delete (window as any).fallback_bambuzau_custom_serp_key;
      } else if (key === 'bambuzau_custom_tavily_key') {
        delete (window as any).fallback_bambuzau_custom_tavily_key;
      } else if (key === 'bambuzau_custom_jina_key') {
        delete (window as any).fallback_bambuzau_custom_jina_key;
      } else if (key === 'bambuzau_ai_provider') {
        delete (window as any).fallback_bambuzau_ai_provider;
      }
    } catch (_) {}
  }
};