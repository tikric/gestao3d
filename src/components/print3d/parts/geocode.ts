import { GEOCODE_CACHE_KEY } from "./constants";
import { digitsOnly, isBrazilPoint, stripAccents } from "./utils";

export type Point = { lat: number; lng: number };

export function loadGeocodeCache(): Record<string, Point | null> {
  try {
    return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveGeocodeCache(c: Record<string, Point | null>) {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export async function geocodeByCep(cepValue?: any): Promise<Point | null> {
  const cep = digitsOnly(cepValue);
  if (cep.length !== 8) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const coords = j?.location?.coordinates;
    const lat = Number(coords?.latitude);
    const lng = Number(coords?.longitude);
    const point = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    return isBrazilPoint(point) ? point : null;
  } catch {}
  try {
    const r = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`, {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const lat = Number(j?.lat);
    const lng = Number(j?.lng);
    const point = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    return isBrazilPoint(point) ? point : null;
  } catch {}
  return null;
}

export async function geocodeOne(q: string): Promise<Point | null> {
  const specificQuery =
    /\d{5}-?\d{3}/.test(q) ||
    /,\s*\d+\b/.test(q) ||
    /\b(rua|avenida|av\.?|travessa|estrada|rodovia|alameda|praça|praca)\b/i.test(q);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const j = await r.json();
    if (!Array.isArray(j)) return null;
    const scored = j
      .map((item: any) => {
        const point = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
        if (!isBrazilPoint(point)) return null;
        const display = stripAccents(
          `${item.display_name || ""} ${JSON.stringify(item.address || {})}`,
        );
        const query = stripAccents(q);
        const administrativeTypes = [
          "city",
          "town",
          "village",
          "municipality",
          "administrative",
          "state",
        ];
        let score = Number(item.importance || 0);
        if (/\d{5}-?\d{3}/.test(q) && display.includes(digitsOnly(q).slice(0, 5))) score += 4;
        if (
          /\b(rua|avenida|av\.?|travessa|estrada|rodovia|alameda|praça|praca)\b/i.test(q) &&
          /(road|residential|house_number|postcode|suburb)/.test(display)
        )
          score += 3;
        if (
          /\b[A-Z]{2}\b/.test(q) &&
          query.split(/\s+/).some((part) => part.length === 2 && display.includes(part))
        )
          score += 1;
        if (specificQuery && administrativeTypes.includes(String(item.type || "").toLowerCase()))
          score -= 8;
        return { point, score };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score);
    const best = scored[0] as any;
    if (best && (!specificQuery || best.score > -2)) return best.point;
  } catch {}
  return null;
}
