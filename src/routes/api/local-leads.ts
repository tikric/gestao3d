import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

const TIMEOUT_MS = 15000;

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T | null> {
  return Promise.race([
    p.catch(() => null as unknown as T),
    new Promise<null>((res) => setTimeout(() => res(null), ms)),
  ]) as Promise<T | null>;
}

type Lead = {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  pitch: string;
  status: string;
  timelineChecklist: { s1: boolean; s2: boolean; s3: boolean; s4: boolean };
  note: string;
};

function pitchFor(category: string): string {
  const c = category.toLowerCase();
  if (/pet/.test(c))
    return "Oferecer plaquinhas de identificação 3D personalizadas e brinquedos exclusivos.";
  if (/papel|escol/.test(c))
    return "Apresentar luminárias, marcadores e organizadores 3D para o público escolar.";
  if (/geek|game/.test(c)) return "Mostrar action figures e colecionáveis 3D bicolores exclusivos.";
  if (/decor|presente/.test(c))
    return "Sugerir luminárias e peças decorativas 3D para presentes únicos.";
  if (/festa/.test(c)) return "Oferecer topos de bolo e lembrancinhas 3D personalizadas.";
  if (/joia|biju/.test(c))
    return "Mostrar acessórios 3D exclusivos em filamentos premium bicolores.";
  return "Oferecer linha de produtos 3D premium bicolores personalizados para sua loja.";
}

async function serpApiMapsPage(
  apiKey: string,
  query: string,
  region: string,
  start: number,
): Promise<any[]> {
  const q = `${query} em ${region}`;
  const url = `https://serpapi.com/search.json?engine=google_maps&type=search&google_domain=google.com.br&hl=pt-br&gl=br&q=${encodeURIComponent(q)}&start=${start}&api_key=${apiKey}`;
  const res = await withTimeout(fetch(url));
  if (!res || !res.ok) return [];
  const data: any = await res.json().catch(() => null);
  return Array.isArray(data?.local_results) ? data.local_results : [];
}

function mapResult(r: any, category: string, region: string, idx: number): Lead | null {
  const name = r?.title || r?.name;
  if (!name) return null;
  const phone = r?.phone || "";
  const address = r?.address || region;
  return {
    id: `lead-serp-${Date.now()}-${idx}-${Math.floor(Math.random() * 100000)}`,
    name,
    phone,
    address,
    category: category || "Geral",
    pitch: pitchFor(category || name),
    status: "PROSPECT",
    timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
    note: `Estabelecimento real mapeado via Google Maps (SerpAPI) em ${region}.`,
  };
}

export const Route = createFileRoute("/api/local-leads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        const url = new URL(request.url);
        const query = (url.searchParams.get("q") || "").trim();
        const region = (url.searchParams.get("region") || "").trim();
        if (!query || !region) {
          return Response.json({ error: "missing q or region" }, { status: 400 });
        }

        const customKey = request.headers.get("X-Custom-Serpapi-Key")?.trim();
        const apiKey = customKey && customKey.length > 10 ? customKey : process.env.SERPAPI_KEY;
        if (!apiKey) {
          return Response.json({ error: "SERPAPI_KEY not configured" }, { status: 503 });
        }

        // Paginate up to 5 pages (100 results) per category
        const isMulti = /lojas de presentes geek|papelarias|brinquedos|escolas/i.test(query);
        const categories = isMulti
          ? [
              "pet shops",
              "papelarias",
              "lojas de presentes",
              "lojas geek",
              "lojas de festa",
              "lojas de decoração",
              "lojas de bijuterias",
              "brinquedos",
            ]
          : [query];

        const seen = new Set<string>();
        const leads: Lead[] = [];

        for (const cat of categories) {
          for (const start of [0, 20, 40, 60, 80]) {
            const items = await serpApiMapsPage(apiKey, cat, region, start);
            if (!items.length) break;
            for (const r of items) {
              const key = `${(r?.title || "").toLowerCase()}|${(r?.address || "").toLowerCase()}`;
              if (seen.has(key)) continue;
              seen.add(key);
              const lead = mapResult(r, cat, region, leads.length);
              if (lead) leads.push(lead);
            }
            if (items.length < 20) break;
          }
        }

        return Response.json(leads);
      },
    },
  },
});
