// Lightweight same-origin / same-site request gate for internal API routes,
// with API Key support for external integrations (e.g. OpenCode, Local IAs).

function hostFromUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(requestHost: string): Set<string> {
  const set = new Set<string>();
  if (requestHost) set.add(requestHost.toLowerCase());
  const extra = process.env.ALLOWED_ORIGINS || "";
  for (const raw of extra.split(",")) {
    const h = hostFromUrl(raw.trim());
    if (h) set.add(h);
  }
  return set;
}

function hostMatches(candidate: string | null, allowed: Set<string>): boolean {
  if (!candidate) return false;
  if (allowed.has(candidate)) return true;
  if (/\.lovable\.app$/.test(candidate) || /\.lovableproject\.com$/.test(candidate)) return true;
  if (candidate === "localhost" || /^localhost:\d+$/.test(candidate)) return true;
  if (/^127\.0\.0\.1(?::\d+)?$/.test(candidate)) return true;
  return false;
}

export function validateApiKey(request: Request): boolean {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const bearerKey =
    authHeader && /^Bearer\s+/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : null;
  const headerKey = request.headers.get("x-api-key")?.trim() || bearerKey;
  const queryKey = url.searchParams.get("api_key")?.trim() || url.searchParams.get("key")?.trim();
  const providedKey = headerKey || queryKey;

  if (!providedKey) return false;

  const validKey =
    process.env.OPENCODE_API_KEY ||
    process.env.GESTAO3D_API_KEY ||
    process.env.API_KEY ||
    "gestao3d-opencode-2026";
  return providedKey === validKey.trim();
}

/**
 * Returns a 403 Response if the request did not come from the app's own
 * frontend or present a valid API Key for external IAs (OpenCode, etc.).
 */
export function assertInternalCaller(request: Request): Response | null {
  if (validateApiKey(request)) {
    return null;
  }

  const url = new URL(request.url);
  const allowed = allowedHosts(url.host);

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") return null;

  const originHost = hostFromUrl(request.headers.get("origin"));
  if (originHost && hostMatches(originHost, allowed)) return null;

  const refererHost = hostFromUrl(request.headers.get("referer"));
  if (refererHost && hostMatches(refererHost, allowed)) return null;

  return new Response(
    JSON.stringify({
      error: "forbidden",
      message: "Acesso negado. Forneça o cabeçalho x-api-key ou faça requisições pela aplicação.",
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}
