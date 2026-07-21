import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Proxy para a Evolution API do usuário.
 * O navegador chama /api/whatsapp-proxy com { baseUrl, path, method, apiKey, body }
 * e este endpoint encaminha server-side, contornando CORS/mixed-content.
 */
export const Route = createFileRoute("/api/whatsapp-proxy")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const {
            baseUrl,
            path,
            method = "GET",
            apiKey = "",
            body,
          } = (await request.json()) as {
            baseUrl: string;
            path: string;
            method?: string;
            apiKey?: string;
            body?: unknown;
          };

          if (!baseUrl || !path) {
            return new Response(JSON.stringify({ error: "baseUrl e path obrigatórios" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          let target: URL;
          try {
            target = new URL(path, baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
          } catch {
            return new Response(JSON.stringify({ error: "URL inválida" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          if (!/^https?:$/.test(target.protocol)) {
            return new Response(JSON.stringify({ error: "Protocolo não permitido" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...CORS },
            });
          }

          const upstream = await fetch(target.toString(), {
            method,
            headers: {
              "Content-Type": "application/json",
              apikey: apiKey,
            },
            body: body != null && method !== "GET" ? JSON.stringify(body) : undefined,
          });

          const text = await upstream.text();
          return new Response(text, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("content-type") || "application/json",
              ...CORS,
            },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e?.message || "proxy_error" }), {
            status: 502,
            headers: { "Content-Type": "application/json", ...CORS },
          });
        }
      },
    },
  },
});
