// Lightweight same-origin / same-site request gate for internal API routes.
// These endpoints exist only to back the Lovable frontend; rejecting cross-
// origin callers stops drive-by abuse of upstream API quotas.

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
  // Always allow the Lovable preview/published hosts for this project family.
  // (Hosts are app-specific but the suffix is stable.)
  return set;
}

function hostMatches(candidate: string | null, allowed: Set<string>): boolean {
  if (!candidate) return false;
  if (allowed.has(candidate)) return true;
  // Allow Lovable preview/published subdomains automatically.
  if (/\.lovable\.app$/.test(candidate) || /\.lovableproject\.com$/.test(candidate)) return true;
  if (candidate === "localhost" || /^localhost:\d+$/.test(candidate)) return true;
  if (/^127\.0\.0\.1(?::\d+)?$/.test(candidate)) return true;
  return false;
}

/**
 * Returns a 403 Response if the request did not come from the app's own
 * frontend (same-origin / same-site), otherwise null.
 *
 * Strategy:
 *  - Trust `Sec-Fetch-Site: same-origin | same-site` when present (modern
 *    browsers set it automatically and it cannot be spoofed cross-origin).
 *  - Otherwise require Origin or Referer to match the request host
 *    (or an allow-listed host).
 *  - Reject requests with no Origin AND no Referer (typical for curl /
 *    server-to-server abuse).
 */
export function assertInternalCaller(request: Request): Response | null {
  const url = new URL(request.url);
  const allowed = allowedHosts(url.host);

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") return null;

  const originHost = hostFromUrl(request.headers.get("origin"));
  if (originHost && hostMatches(originHost, allowed)) return null;

  const refererHost = hostFromUrl(request.headers.get("referer"));
  if (refererHost && hostMatches(refererHost, allowed)) return null;

  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
