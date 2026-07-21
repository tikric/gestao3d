import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

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
  const c = (category || "").toLowerCase();
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

async function searchText(query: string, lovableKey: string, mapsKey: string, pageToken?: string) {
  const body: any = {
    textQuery: query,
    languageCode: "pt-BR",
    regionCode: "BR",
    pageSize: 20,
  };
  if (pageToken) body.pageToken = pageToken;

  const r = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mapsKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.primaryType,places.types,places.websiteUri,nextPageToken",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Places gateway ${r.status}: ${txt.slice(0, 200)}`);
  }
  return r.json();
}

export const Route = createFileRoute("/api/places-leads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;
        const url = new URL(request.url);
        const query = (url.searchParams.get("q") || "").trim();
        const region = (url.searchParams.get("region") || "").trim();
        if (!region) {
          return Response.json({ error: "region required" }, { status: 400 });
        }
        const lovableKey = process.env.LOVABLE_API_KEY;
        const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!lovableKey || !mapsKey) {
          return Response.json({ error: "Google Maps connector not configured" }, { status: 500 });
        }

        const baseQuery = query || "lojas de presentes papelaria geek pet brinquedos";
        const queries = [`${baseQuery} em ${region}`, `lojas de ${baseQuery} ${region}`];

        const seen = new Set<string>();
        const leads: Lead[] = [];
        const MAX = 60;

        try {
          for (const q of queries) {
            let pageToken: string | undefined;
            for (let page = 0; page < 3 && leads.length < MAX; page++) {
              const data: any = await searchText(q, lovableKey, mapsKey, pageToken);
              const places: any[] = Array.isArray(data?.places) ? data.places : [];
              for (const p of places) {
                const id = String(p?.id || "");
                if (!id || seen.has(id)) continue;
                seen.add(id);
                const name = p?.displayName?.text || "Local";
                const address = p?.formattedAddress || region;
                const phone = p?.nationalPhoneNumber || p?.internationalPhoneNumber || "";
                const cat = query || p?.primaryType || "Varejo";
                leads.push({
                  id: `places-${id}`,
                  name,
                  phone: phone || "—",
                  address,
                  category: cat,
                  pitch: pitchFor(cat),
                  status: "PROSPECT",
                  timelineChecklist: { s1: false, s2: false, s3: false, s4: false },
                  note: `Capturado via Google Places${p?.websiteUri ? ` — ${p.websiteUri}` : ""}`,
                });
                if (leads.length >= MAX) break;
              }
              pageToken = data?.nextPageToken;
              if (!pageToken) break;
              await new Promise((r) => setTimeout(r, 1500));
            }
            if (leads.length >= MAX) break;
          }
        } catch (err: any) {
          return Response.json({ error: err?.message || "places error", leads }, { status: 502 });
        }

        return Response.json({ leads });
      },
    },
  },
});
