import { createFileRoute } from "@tanstack/react-router";
import { sanitizeQuery } from "./_sanitize";
import { assertInternalCaller } from "./_auth";

type Body = { query?: string };

const TIMEOUT_MS = 12000;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T | null> {
  return Promise.race([
    p.catch(() => null as unknown as T),
    new Promise<null>((res) => setTimeout(() => res(null), ms)),
  ]) as Promise<T | null>;
}

function isUsableImage(u: string | undefined | null): u is string {
  if (!u || typeof u !== "string") return false;
  if (!/^https?:\/\//i.test(u)) return false;
  if (u.length < 60 || /\/shopping\?q$/i.test(u)) return false;
  if (/data:image|\.svg(\?|$)/i.test(u)) return false;
  if (/youtube\.com|ytimg\.com|youtu\.be/i.test(u)) return false;
  if (/sprite|placeholder|spacer|blank|logo|favicon|icon[-_.]/i.test(u)) return false;
  if (/[?&](?:w|h|s)=([0-9]{1,2})(?:&|$)/i.test(u)) return false;
  return true;
}

function normalizeScrapedHtml(html: string) {
  return html
    .replace(/\\u003d/gi, "=")
    .replace(/\\u0026/gi, "&")
    .replace(/\\x3d/gi, "=")
    .replace(/\\x26/gi, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/gi, "&");
}
function cleanupImageUrl(url: string) {
  return normalizeScrapedHtml(url);
}

async function fromScraperApiML(query: string): Promise<string | null> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return null;
  const target = `https://lista.mercadolivre.com.br/${encodeURIComponent(query).replace(/%20/g, "-")}`;
  const url = `https://api.scraperapi.com/?api_key=${key}&country_code=br&url=${encodeURIComponent(target)}`;
  const res = await withTimeout(fetch(url));
  if (!res || !res.ok) return null;
  const html = normalizeScrapedHtml(await res.text());
  const re = /https?:\/\/[a-z0-9.\-]*mlstatic\.com\/[^\s"'<>]+?\.(?:jpg|jpeg|webp|png)/gi;
  const matches = html.match(re);
  if (!matches) return null;
  for (const m of matches) {
    if (/logo|sprite|placeholder|category/i.test(m)) continue;
    return m.replace(/-[VIO]\.(jpg|jpeg|webp|png)$/i, "-O.$1");
  }
  return null;
}

async function fromSerpApi(query: string): Promise<string | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = `https://serpapi.com/search.json?engine=google_shopping&gl=br&hl=pt-br&q=${encodeURIComponent(query)}&api_key=${key}`;
  const res = await withTimeout(fetch(url));
  if (!res || !res.ok) return null;
  const data: any = await res.json().catch(() => null);
  const items: any[] = data?.shopping_results ?? [];
  for (const it of items) {
    const img = it?.thumbnail || it?.image;
    if (isUsableImage(img)) return img as string;
  }
  return null;
}

async function fromFirecrawl(query: string): Promise<string | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const { default: Firecrawl } = await import("@mendable/firecrawl-js");
    const client = new Firecrawl({ apiKey: key });
    const result: any = await withTimeout(
      client.search(`${query} comprar produto`, {
        limit: 5,
        scrapeOptions: { formats: ["html"], onlyMainContent: false, waitFor: 200 },
      }) as Promise<any>,
    );
    if (!result) return null;
    const raw: any[] = result?.web ?? result?.data?.web ?? result?.data ?? [];
    for (const r of raw) {
      const meta = r?.metadata ?? {};
      const img =
        meta.ogImage ||
        meta["og:image"] ||
        meta["og:image:secure_url"] ||
        meta.twitterImage ||
        meta["twitter:image"];
      if (isUsableImage(img)) return img as string;
    }
    return null;
  } catch {
    return null;
  }
}

const MEM_CACHE = new Map<string, { url: string; source: string; ts: number }>();
const MEM_TTL_MS = 60 * 60 * 1000;
function normalizeKey(q: string) {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const Route = createFileRoute("/api/search-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        let body: Body = {};
        try {
          body = await request.json();
        } catch {}
        const query = sanitizeQuery(body?.query);
        if (!query) {
          return Response.json(
            { imageUrl: null, source: null, error: "empty query" },
            { status: 400 },
          );
        }
        const cacheKey = normalizeKey(query);
        const mem = MEM_CACHE.get(cacheKey);
        if (mem && Date.now() - mem.ts < MEM_TTL_MS && isUsableImage(mem.url)) {
          return Response.json({ imageUrl: mem.url, source: mem.source, cached: "memory" });
        }
        const sources: { name: string; fn: () => Promise<string | null> }[] = [
          { name: "scraperapi_ml", fn: () => fromScraperApiML(query) },
          { name: "serpapi", fn: () => fromSerpApi(query) },
          { name: "firecrawl", fn: () => fromFirecrawl(query) },
        ];
        for (const s of sources) {
          const img = await s.fn();
          if (img && isUsableImage(img)) {
            MEM_CACHE.set(cacheKey, { url: img, source: s.name, ts: Date.now() });
            return Response.json({ imageUrl: img, source: s.name });
          }
        }
        return Response.json({ imageUrl: null, source: null });
      },
    },
  },
});
