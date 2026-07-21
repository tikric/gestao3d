import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

function isValidKey(k: string | null | undefined): boolean {
  if (!k) return false;
  const t = k.trim().toLowerCase();
  if (!t || t === "null" || t === "undefined" || t === "none" || t === "placeholder") return false;
  return k.trim().length >= 15;
}

function pickKey(request: Request): string {
  // SECURITY: api keys must never be passed via URL query (leak in logs/history).
  // Accept only via custom header or server env var.
  const h = request.headers.get("x-custom-serpapi-key");
  if (isValidKey(h)) return h!.trim();
  const env = process.env.SERPAPI_KEY;
  if (isValidKey(env)) return env!.trim();
  return "";
}

async function probe(apiKey: string): Promise<{ ok: boolean; status: number; reason?: string }> {
  const url = `https://serpapi.com/account?api_key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.ok) return { ok: true, status: 200 };
    let reason = `HTTP ${res.status}`;
    try {
      const j: any = await res.json();
      if (j?.error) reason = String(j.error);
    } catch {}
    return { ok: false, status: res.status, reason };
  } catch (e: any) {
    return { ok: false, status: 0, reason: e?.message || "network error" };
  } finally {
    clearTimeout(timeout);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Custom-Serpapi-Key",
};

export const Route = createFileRoute("/api/serpapi/status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        const key = pickKey(request);
        if (!key) {
          return Response.json(
            {
              ok: false,
              authenticated: false,
              status: 401,
              reason: "Nenhuma chave SerpApi configurada",
            },
            { headers: CORS },
          );
        }
        const result = await probe(key);
        return Response.json({ ...result, authenticated: result.ok }, { headers: CORS });
      },
    },
  },
});
