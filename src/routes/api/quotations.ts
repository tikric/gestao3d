import { createFileRoute } from "@tanstack/react-router";
import { sanitizeQuery, sanitizeType } from "./_sanitize";
import { assertInternalCaller } from "./_auth";

function isValidKey(k: string | null | undefined): boolean {
  if (!k) return false;
  const t = k.trim().toLowerCase();
  if (!t || t === "null" || t === "undefined" || t === "none" || t === "placeholder") return false;
  return k.trim().length >= 15;
}

function getKey(request: Request, url: URL): string {
  const q = url.searchParams.get("api_key");
  const h = request.headers.get("x-custom-serpapi-key");
  if (isValidKey(q)) return q!.trim();
  if (isValidKey(h)) return h!.trim();
  const env = process.env.SERPAPI_KEY;
  if (isValidKey(env)) return env!.trim();
  return "";
}

function getFallbackKey(request: Request, url: URL): string {
  const q = url.searchParams.get("api_key_2");
  const h = request.headers.get("x-custom-serpapi-key-2");
  if (isValidKey(q)) return q!.trim();
  if (isValidKey(h)) return h!.trim();
  const env = process.env.SERPAPI_KEY_2;
  if (isValidKey(env)) return env!.trim();
  return "";
}

function isBlockedGoogleUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "googleadservices.com" ||
      host.endsWith(".googleadservices.com")
    );
  } catch {
    return true;
  }
}

function merchantSearchUrl(storeName: string, productName: string): string {
  const query = encodeURIComponent(productName || "filamento impressora 3d");
  return `https://www.buscape.com.br/search?q=${query}`;
}

function pickProductUrl(r: any, query: string): string {
  // Prefer direct merchant URL, then SerpApi's product page, then the
  // Google Shopping redirect link (works in a new tab — redirects to the
  // merchant product page). Fall back to a Buscapé search by title.
  const candidates = [r.product_link, r.link, r.serpapi_product_api];
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) return c;
  }
  return merchantSearchUrl(r.source || r.store || "", r.title || query);
}

async function fetchShopping(query: string, apiKey: string) {
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=br&hl=pt&tbs=p_ord:p&api_key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.shopping_results || [])
      .map((r: any) => ({
        productId: r.product_id || r.serpapi_product_api || "",
        storeName: r.source || r.store || "Loja",
        productName: r.title || "",
        price:
          typeof r.extracted_price === "number"
            ? r.extracted_price
            : Number(
                String(r.price || "")
                  .replace(/[^0-9,.-]/g, "")
                  .replace(",", "."),
              ) || 0,
        rating: typeof r.rating === "number" ? r.rating : 4.5,
        reviews: typeof r.reviews === "number" ? r.reviews : 0,
        feature:
          Array.isArray(r.extensions) && r.extensions.length
            ? String(r.extensions[0])
            : r.delivery || "",
        buyUrl: pickProductUrl(r, query),
        thumbnail: r.thumbnail || "",
      }))
      .filter((o: any) => o.price > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

const DEFAULT_MATERIALS: Array<{ type: string; query: string }> = [
  { type: "PLA", query: "filamento pla 1.75mm 1kg impressora 3d" },
  { type: "PETG", query: "filamento petg 1.75mm 1kg impressora 3d" },
  { type: "TPU", query: "filamento flexivel tpu 1.75mm 1kg impressora 3d" },
  { type: "SILK", query: "filamento silk pla 1.75mm 1kg impressora 3d" },
];

const TOP_N = 10;
const topByPrice = <T extends { price: number }>(offers: T[]): T[] =>
  [...offers].sort((a, b) => a.price - b.price).slice(0, TOP_N);

const normalizeOfferText = (value: string): string => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
};

// Products are duplicates when the first 3 normalized words match. We also
// catch exact-title, product-id, URL and image duplicates that Google may send.
const offerDedupeKeys = (offer: {
  productName?: string;
  productId?: string;
  buyUrl?: string;
  thumbnail?: string;
}): string[] => {
  const keys: string[] = [];
  const name = normalizeOfferText(offer.productName || "");
  if (name) {
    const words = name.split(" ").filter(Boolean);
    keys.push(`name:${name}`);
    keys.push(`start:${words.slice(0, 3).join(" ")}`);
  }
  const id = normalizeOfferText(offer.productId || "");
  if (id) keys.push(`id:${id}`);
  if (offer.buyUrl) {
    try {
      const u = new URL(offer.buyUrl);
      keys.push(`url:${u.hostname.replace(/^www\./, "")}${u.pathname}`.toLowerCase());
    } catch {}
  }
  // Não dedupar por thumbnail: produtos diferentes podem compartilhar a mesma
  // imagem genérica e sumiriam da lista.
  return keys.filter((key) => !key.endsWith(":"));
};

const dedupeOffers = <
  T extends {
    productName: string;
    price: number;
    productId?: string;
    buyUrl?: string;
    thumbnail?: string;
  },
>(
  offers: T[],
): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const o of [...offers].sort((a, b) => a.price - b.price)) {
    const keys = offerDedupeKeys(o);
    if (!keys.length || keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    out.push(o);
  }
  return out;
};

export const Route = createFileRoute("/api/quotations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        const url = new URL(request.url);
        const customQ = sanitizeQuery(url.searchParams.get("q") || url.searchParams.get("query"));
        const apiKey = getKey(request, url);
        const fallbackKey = getFallbackKey(request, url);
        if (!apiKey && !fallbackKey) {
          if (customQ) {
            const safeType = sanitizeType(url.searchParams.get("type")) || "Produtos";
            return Response.json([
              {
                type: safeType,
                offers: [],
                searchQuery: customQ,
                error: "Chave SerpApi ausente ou inválida.",
              },
            ]);
          }
          return Response.json(
            DEFAULT_MATERIALS.map((m) => ({
              type: m.type,
              searchQuery: m.query,
              offers: [],
              error: "Chave SerpApi ausente ou inválida.",
            })),
          );
        }
        const fetchWithFallback = async (q: string) => {
          let offers: any[] = [];
          if (apiKey) offers = await fetchShopping(q, apiKey);
          if ((!offers || offers.length === 0) && fallbackKey) {
            offers = await fetchShopping(q, fallbackKey);
          }
          return offers;
        };

        if (customQ) {
          const offers = await fetchWithFallback(customQ);
          const safeType = sanitizeType(url.searchParams.get("type")) || "Produtos";
          return Response.json([
            { type: safeType, offers: topByPrice(dedupeOffers(offers)), searchQuery: customQ },
          ]);
        }

        // Default: fetch the three workshop materials in parallel
        const groups = await Promise.all(
          DEFAULT_MATERIALS.map(async (m) => ({
            type: m.type,
            searchQuery: m.query,
            offers: topByPrice(dedupeOffers(await fetchWithFallback(m.query))),
          })),
        );
        return Response.json(groups);
      },
    },
  },
});
