import { createFileRoute } from "@tanstack/react-router";
import { sanitizeQuery, isAllowedScrapeUrl } from "./_sanitize";
import { assertInternalCaller } from "./_auth";

export type TrendItem = {
  id: string;
  title: string;
  thumbnail: string;
  author: string;
  source: string;
  url: string;
  download_url?: string;
  stats?: { likes?: number; downloads?: number };
};

type CachePayload = {
  items: TrendItem[];
  errors: { source: string; message: string }[];
  updated_at: number;
};

const CACHE = new Map<string, CachePayload>();
const TTL_MS = 60 * 60 * 1000;
const MAKERWORLD_HINT = /makerworld\.com\/.+\/models?\//;

// MakerWorld category presets (keyword used in the Google site: query)
export const MAKERWORLD_CATEGORIES = [
  "trending",
  "hobby",
  "art",
  "tools",
  "toy",
  "game",
  "education",
  "fashion",
  "home decor",
  "gadget",
  "miniature",
  "cosplay",
  "sports",
  "vehicle",
  "organizer",
  "articulated",
  "functional print",
] as const;

const DEFAULT_QUERIES = [
  "trending",
  "articulated",
  "functional print",
  "organizer",
  "toy",
  "home decor",
  "gadget",
  "miniature",
];

function cleanUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("srsltid");
    return parsed.toString();
  } catch {
    return url;
  }
}

function metadataImage(result: any): string | undefined {
  const metadata = result?.metadata ?? result?.data?.metadata ?? {};
  const raw =
    metadata.ogImage ||
    metadata["og:image"] ||
    metadata["og:image:secure_url"] ||
    metadata.twitterImage ||
    metadata["twitter:image"] ||
    metadata["twitter:image:src"];
  if (!raw || typeof raw !== "string") return undefined;
  if (!/^https?:\/\//i.test(raw)) return undefined;
  if (/cloudflare|cdn-cgi|challenge-platform/i.test(raw)) return undefined;
  return raw;
}

function getClient() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  return import("@mendable/firecrawl-js").then(
    ({ default: Firecrawl }) => new Firecrawl({ apiKey }),
  );
}

async function searchQuery(keyword: string): Promise<TrendItem[]> {
  const client = await getClient();
  const q = `site:makerworld.com/en/models ${keyword}`;
  const result: any = await client.search(q, {
    limit: 12,
    scrapeOptions: { formats: ["html"], onlyMainContent: false, waitFor: 500 },
  });
  const raw: any[] = result?.web ?? result?.data?.web ?? result?.data ?? result?.results ?? [];
  const items: TrendItem[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const url: string | undefined = r?.url || r?.link;
    const title: string | undefined = r?.title || r?.name;
    if (!url || !title) continue;
    if (!MAKERWORLD_HINT.test(url)) continue;
    const itemUrl = cleanUrl(url);
    if (seen.has(itemUrl)) continue;
    const image = metadataImage(r);
    if (!image) continue;
    seen.add(itemUrl);
    items.push({
      id: `makerworld-${items.length}-${itemUrl}`,
      title: String(title)
        .replace(/\s*[|\-–]\s*MakerWorld.*$/i, "")
        .trim(),
      thumbnail: image,
      url: itemUrl,
      author: "",
      source: "MakerWorld",
    });
    if (items.length >= 12) break;
  }
  return items;
}

async function scrapeDirect(target: string): Promise<TrendItem[]> {
  const client = await getClient();
  const url = /^https?:\/\//i.test(target)
    ? target
    : `https://makerworld.com/en/models/${target.replace(/[^0-9]/g, "")}`;
  const result: any = await client.scrape(url, {
    formats: ["html"],
    onlyMainContent: false,
    waitFor: 800,
  });
  const meta = result?.metadata ?? result?.data?.metadata ?? {};
  const image = metadataImage(result);
  const title = meta.title || meta.ogTitle || meta["og:title"] || url;
  if (!image) return [];
  return [
    {
      id: `makerworld-direct-${url}`,
      title: String(title)
        .replace(/\s*[|\-–]\s*MakerWorld.*$/i, "")
        .trim(),
      thumbnail: image,
      url: cleanUrl(url),
      author: "",
      source: "MakerWorld",
    },
  ];
}

async function build(queries: string[], deadlineMs = 30000): Promise<CachePayload> {
  const items: TrendItem[] = [];
  const errors: { source: string; message: string }[] = [];
  const seen = new Set<string>();

  const tasks = queries.map((q) =>
    searchQuery(q)
      .then((r) => {
        for (const it of r) {
          if (seen.has(it.url)) continue;
          seen.add(it.url);
          items.push(it);
        }
      })
      .catch((e) => errors.push({ source: q, message: String(e?.message || e) })),
  );
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((res) => setTimeout(res, deadlineMs)),
  ]);
  return { items, errors, updated_at: Date.now() };
}

export const Route = createFileRoute("/api/3d-trends")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        const url = new URL(request.url);
        const force = url.searchParams.get("refresh") === "1";
        const rawQ = (url.searchParams.get("q") || "").trim();
        const q = sanitizeQuery(rawQ);
        const cat = sanitizeQuery(url.searchParams.get("cat"));

        // Direct lookup by URL or numeric ID — host-allowlisted (anti-SSRF)
        if (rawQ && (/^https?:\/\//i.test(rawQ) || /^\d{3,}$/.test(rawQ.replace(/[^0-9]/g, "")))) {
          if (/^https?:\/\//i.test(rawQ) && !isAllowedScrapeUrl(rawQ)) {
            return Response.json(
              {
                items: [],
                errors: [{ source: "direct", message: "URL host not allowed" }],
                updated_at: Date.now(),
              },
              { status: 400 },
            );
          }
          try {
            const items = await scrapeDirect(rawQ);
            return Response.json({ items, errors: [], updated_at: Date.now() });
          } catch (e: any) {
            return Response.json({
              items: [],
              errors: [{ source: "direct", message: String(e?.message || e) }],
              updated_at: Date.now(),
            });
          }
        }

        // Build cache key
        const queries = q ? [q] : cat ? [cat] : DEFAULT_QUERIES;
        const key = queries.join("|");

        const cached = CACHE.get(key);
        if (!force && cached && Date.now() - cached.updated_at < TTL_MS) {
          return Response.json(cached);
        }
        try {
          const fresh = await build(queries);
          CACHE.set(key, fresh);
          return Response.json(fresh);
        } catch (e: any) {
          const fallback = cached || {
            items: [],
            errors: [{ source: "all", message: String(e?.message || e) }],
            updated_at: Date.now(),
          };
          return Response.json(fallback);
        }
      },
    },
  },
});
