import { COLOR_HEX } from "./constants";

export const fmtBRL = (v: number) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function colorHex(name?: string) {
  if (!name) return "#9ca3af";
  return COLOR_HEX[String(name).toLowerCase().trim()] || "#9ca3af";
}

export function normalizeText(value?: any) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}
export function digitsOnly(value?: any) {
  return String(value || "").replace(/\D/g, "");
}
export function formatCep(value?: any) {
  const cep = digitsOnly(value);
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : normalizeText(value);
}
export function stripAccents(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function isBrazilPoint(p: { lat: number; lng: number } | null) {
  return !!p && p.lat >= -34.5 && p.lat <= 6.5 && p.lng >= -74.5 && p.lng <= -32;
}

export function getClientCityState(c: any) {
  const address = normalizeText(c?.address);
  let city = normalizeText(c?.city);
  let state = normalizeText(c?.state).toUpperCase();
  if ((!city || !state) && address) {
    const match = address.match(/(?:,\s*)?([^,]+?)\s*[-/]\s*([A-Z]{2})(?:\s*,?\s*Brasil)?\s*$/i);
    if (match) {
      if (!city) city = normalizeText(match[1]);
      if (!state) state = normalizeText(match[2]).toUpperCase();
    }
  }
  return { city, state };
}

export function cleanStreetAddress(address: string, city: string, state: string, cep: string) {
  let street = normalizeText(address)
    .replace(/\bBrasil\b/gi, "")
    .replace(/\bCEP\b/gi, "")
    .replace(/\d{5}-?\d{3}/g, "")
    .replace(/\s*,\s*$/g, "")
    .trim();
  if (city && state) {
    street = street
      .replace(
        new RegExp(`,?\\s*${escapeRegExp(city)}\\s*[-/]\\s*${escapeRegExp(state)}\\s*$`, "i"),
        "",
      )
      .trim();
  }
  if (state) {
    street = street.replace(new RegExp(`,?\\s*${escapeRegExp(state)}\\s*$`, "i"), "").trim();
  }
  if (cep) {
    street = street.replace(new RegExp(escapeRegExp(cep), "gi"), "").trim();
  }
  return street
    .replace(/\s*,\s*,/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s*$/g, "");
}

export function buildClientGeocodeQueries(c: any) {
  const address = normalizeText(c?.address);
  const cep = formatCep(c?.cep);
  const { city, state } = getClientCityState(c);
  const cityState = city && state ? `${city} - ${state}` : [city, state].filter(Boolean).join(", ");
  const street = cleanStreetAddress(address, city, state, cep);

  const candidates = [
    [street, cityState, cep, "Brasil"].filter(Boolean).join(", "),
    [street, cityState, "Brasil"].filter(Boolean).join(", "),
    [street, cep, "Brasil"].filter(Boolean).join(", "),
    [address, cityState, cep, "Brasil"].filter(Boolean).join(", "),
    [cep, cityState, "Brasil"].filter(Boolean).join(", "),
  ];

  return Array.from(new Set(candidates.map(normalizeText).filter((q) => q.length > 4)));
}

export function getPrinterLogo(model: string = "", customUrl?: string) {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  const m = model.toLowerCase();
  if (m.includes("bambu") || m.includes("p1") || m.includes("x1") || m.includes("a1"))
    return "https://images.unsplash.com/photo-1701073837941-f76a5bf98505?auto=format&fit=crop&w=200&q=80";
  if (m.includes("kobra") || m.includes("anycubic"))
    return "https://images.unsplash.com/photo-1631544114022-fe3a917a4dde?auto=format&fit=crop&w=200&q=80";
  if (
    m.includes("k1") ||
    m.includes("creality") ||
    m.includes("ender") ||
    m.includes("v3") ||
    m.includes("sermoon")
  )
    return "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=200&q=80";
  if (m.includes("prusa") || m.includes("mk3") || m.includes("mk4") || m.includes("mini"))
    return "https://images.unsplash.com/photo-1544993130-9df2492f2549?auto=format&fit=crop&w=200&q=80";
  if (
    m.includes("resina") ||
    m.includes("resin") ||
    m.includes("sla") ||
    m.includes("elegoo") ||
    m.includes("photon") ||
    m.includes("halot")
  )
    return "https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?auto=format&fit=crop&w=200&q=80";
  if (m.includes("artillery") || m.includes("genius") || m.includes("sidewinder"))
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80";
  return "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=200&q=80";
}

export function readLocalCatalog(): any[] {
  try {
    if (typeof localStorage === "undefined") return [];
    return JSON.parse(localStorage.getItem("bambuzau_local_catalog_production") || "[]") || [];
  } catch {
    return [];
  }
}
