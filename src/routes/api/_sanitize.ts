// Shared input hardening for public /api/* routes.
// Keeps upstream calls bounded and rejects obviously malicious payloads.

const MAX_QUERY = 120;
const MAX_TYPE = 40;

const SAFE_TEXT = /^[\p{L}\p{N}\s.,\-_/()'"+&:%]*$/u;

export function sanitizeQuery(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = String(raw).trim().slice(0, MAX_QUERY);
  return SAFE_TEXT.test(trimmed) ? trimmed : "";
}

export function sanitizeType(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = String(raw).trim().slice(0, MAX_TYPE);
  return /^[A-Za-z0-9 _\-:.]*$/.test(trimmed) ? trimmed : "";
}

// Allowed hostnames for server-side outbound scraping (anti-SSRF).
const ALLOWED_HOSTS = new Set<string>(["makerworld.com", "www.makerworld.com"]);

export function isAllowedScrapeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}
