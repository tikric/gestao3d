// Persistent image cache shared across sessions.
// Stored in localStorage so generated product images for subcategorias
// don't need to be re-fetched on every page load.
const STORAGE_KEY = "market3d_image_cache_v1";

type CacheShape = {
  byProductId: Record<string, string>;
  byQuery: Record<string, string>;
};

const empty = (): CacheShape => ({ byProductId: {}, byQuery: {} });

const read = (): CacheShape => {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return {
      byProductId: parsed?.byProductId ?? {},
      byQuery: parsed?.byQuery ?? {},
    };
  } catch {
    return empty();
  }
};

const write = (cache: CacheShape) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded / unavailable — ignore, cache is best-effort
  }
};

export const loadProductImages = (): Record<string, string> => read().byProductId;
export const loadQueryImages = (): Record<string, string> => read().byQuery;

export const persistProductImage = (productId: string, url: string) => {
  const cache = read();
  cache.byProductId[productId] = url;
  write(cache);
};

export const persistQueryImage = (query: string, url: string) => {
  const cache = read();
  cache.byQuery[query] = url;
  write(cache);
};
