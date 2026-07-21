export const normalizeOfferText = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');

const offerDedupeKeys = (offer: any): string[] => {
  const keys: string[] = [];
  const name = normalizeOfferText(offer?.productName || offer?.title || '');
  if (name) {
    const words = name.split(' ').filter(Boolean);
    keys.push(`name:${name}`);
    keys.push(`start:${words.slice(0, 3).join(' ')}`);
  }
  const id = normalizeOfferText(offer?.productId || offer?.product_id || '');
  if (id) keys.push(`id:${id}`);
  const buyUrl = String(offer?.buyUrl || '').trim();
  if (buyUrl) {
    try {
      const url = new URL(buyUrl);
      keys.push(`url:${url.hostname.replace(/^www\./, '')}${url.pathname}`.toLowerCase());
    } catch {}
  }
  if (offer?.thumbnail) keys.push(`thumb:${offer.thumbnail}`);
  return keys.filter((key) => !key.endsWith(':'));
};

export const dedupeOffers = <T extends any>(offers: T[]): T[] => {
  if (!Array.isArray(offers)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const offer of [...offers].sort((a: any, b: any) => Number(a?.price || 0) - Number(b?.price || 0))) {
    const keys = offerDedupeKeys(offer);
    if (!keys.length || keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    out.push(offer);
  }
  return out;
};

export const dedupeQuotationGroups = <T extends any>(groups: T[]): T[] => {
  if (!Array.isArray(groups)) return [];
  return groups.filter(Boolean).map((group: any) => ({
    ...group,
    offers: dedupeOffers(Array.isArray(group?.offers) ? group.offers : []),
  }));
};