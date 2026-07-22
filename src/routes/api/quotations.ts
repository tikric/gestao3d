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

function cleanGoogleShoppingUrl(urlStr: string): string {
  if (!urlStr || typeof urlStr !== "string") return urlStr;
  try {
    const parsed = new URL(urlStr);

    // Check common redirect parameters
    const redirectParams = ["adurl", "url", "u", "q", "dest", "target", "r", "merchant_url"];
    for (const param of redirectParams) {
      const val = parsed.searchParams.get(param);
      if (val && /^https?:\/\//i.test(val)) {
        return val;
      }
    }
  } catch {}
  return urlStr;
}

function merchantSearchUrl(storeName: string, productName: string): string {
  const query = encodeURIComponent(productName || "filamento impressora 3d 1kg");
  const store = String(storeName || "").toLowerCase();

  if (store.includes("shopee")) {
    return `https://shopee.com.br/search?keyword=${query}`;
  }
  if (store.includes("mercado livre") || store.includes("mercadolivre")) {
    return `https://lista.mercadolivre.com.br/${query}`;
  }
  if (store.includes("amazon")) {
    return `https://www.amazon.com.br/s?k=${query}`;
  }
  if (store.includes("magalu") || store.includes("magazine luiza")) {
    return `https://www.magazineluiza.com.br/busca/${query}`;
  }
  return `https://www.buscape.com.br/search?q=${query}`;
}

function pickProductUrl(r: any, query: string): string {
  const candidates = [r.product_link, r.link, r.shopping_link, r.serpapi_product_api];

  // 1) First attempt: check if any candidate unwraps into a direct non-Google merchant link
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) {
      const cleaned = cleanGoogleShoppingUrl(c);
      try {
        const host = new URL(cleaned).hostname.toLowerCase();
        if (
          !host.includes("google.com") &&
          !host.includes("googleadservices.com") &&
          !host.includes("serpapi.com")
        ) {
          return cleaned;
        }
      } catch {}
    }
  }

  // 2) Second attempt: return the Google Shopping product link itself
  for (const c of candidates) {
    if (typeof c === "string" && /^https?:\/\//i.test(c)) {
      const cleaned = cleanGoogleShoppingUrl(c);
      if (!cleaned.includes("serpapi.com")) {
        return cleaned;
      }
    }
  }

  // 3) Fallback
  return merchantSearchUrl(r.source || r.store || "", r.title || query);
}

function isInvalidFilamentSpool(title: string, price: number, query: string): boolean {
  if (!title) return true;
  const t = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isFilamentQuery =
    q.includes("filamento") ||
    q.includes("pla") ||
    q.includes("petg") ||
    q.includes("tpu") ||
    q.includes("silk") ||
    q.includes("1kg") ||
    q.includes("abs");

  if (isFilamentQuery) {
    // 1) Reject explicit non-1kg weights in title (250g, 500g, 250 gr, 0.25kg, 0.5kg, 100g, 50g, 300g, 200g, 750g, etc)
    const non1kgPatterns = [
      /\b250\s*g\b/,
      /\b250\s*gr\b/,
      /\b250\s*gramas?\b/,
      /\b0[,\.]25\s*kg\b/,
      /\b500\s*g\b/,
      /\b500\s*gr\b/,
      /\b500\s*gramas?\b/,
      /\b0[,\.]5\s*kg\b/,
      /\b100\s*g\b/,
      /\b50\s*g\b/,
      /\b200\s*g\b/,
      /\b300\s*g\b/,
      /\b750\s*g\b/,
      /\b250g\b/,
      /\b500g\b/,
      /\b100g\b/,
      /\b50g\b/,
      /\b200g\b/,
      /\b300g\b/,
      /\b750g\b/,
      /\bamostras?\b/,
      /\bsamples?\b/,
      /\bcaneta\s*3d\b/,
      /\brefil\s*caneta\b/,
      /\b10\s*m(etros)?\b/,
      /\b5\s*m(etros)?\b/,
      /\b15\s*m(etros)?\b/,
      /\bkit\s*amostra\b/,
    ];

    for (const pattern of non1kgPatterns) {
      if (pattern.test(t)) {
        return true;
      }
    }

    // 2) Reject accessories / non-spool items
    const accessoryKeywords = [
      "bico",
      "bicos",
      "adesivo",
      "suporte",
      "cola",
      "limpeza",
      "ptfe",
      "tubo",
      "conector",
      "garganta",
      "meia",
      "silicone",
      "termistor",
      "cartucho",
      "resistencia",
      "graxa",
      "chave",
      "agulha",
      "spray",
      "mola",
      "correia",
      "sensor",
      "placa",
      "cooler",
      "ventoinha",
      "extrusora",
      "hotend",
    ];
    if (accessoryKeywords.some((kw) => t.includes(kw))) {
      return true;
    }

    // 3) Price threshold: 1kg spools in BR are at least R$ 42
    if (price < 42.0) {
      return true;
    }
  }

  return false;
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
      .filter((o: any) => o.price > 0 && !isInvalidFilamentSpool(o.productName, o.price, query));
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

const TOP_N = 5;
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
