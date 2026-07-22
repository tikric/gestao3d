import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "./_auth";

export const Route = createFileRoute("/api/notion-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const blocked = assertInternalCaller(request);
        if (blocked) return blocked;

        const NOTION_TOKEN = process.env.NOTION_TOKEN;
        const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

        if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
          return new Response(
            "Variáveis do Notion não configuradas (NOTION_TOKEN / NOTION_DATABASE_ID). Por favor configure nas variáveis de ambiente.",
            { status: 500 },
          );
        }

        try {
          const body = await request.json();
          const { events = [], orders = [], expenses = [] } = body;
          const allEntries = [...events, ...orders, ...expenses];
          let created = 0;

          for (const entry of allEntries) {
            if (!entry.nome || !entry.data_iso) continue;

            const response = await fetch("https://api.notion.com/v1/pages", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${NOTION_TOKEN}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28",
              },
              body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                  Nome: { title: [{ text: { content: String(entry.nome).slice(0, 200) } }] },
                  Data: { date: { start: entry.data_iso } },
                  Tipo: { select: { name: entry.tipo || "👤 Pessoal" } },
                  Origem: { select: { name: entry.origem || "Gestão3D" } },
                  Status: { status: { name: "✅ Confirmado" } },
                  Descrição: {
                    rich_text: [
                      { text: { content: String(entry.descricao || "").slice(0, 2000) } },
                    ],
                  },
                  ...(entry.valor !== undefined && entry.valor !== null
                    ? { Valor: { number: Number(entry.valor) || 0 } }
                    : {}),
                  ...(entry.link ? { Link: { url: entry.link } } : {}),
                },
              }),
            });

            if (response.ok || response.status === 201) {
              created++;
            } else {
              const errText = await response.text();
              console.error("Notion API error:", errText);
            }
          }

          return new Response(JSON.stringify({ ok: true, created, total: allEntries.length }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(e?.message || "Sync error", { status: 500 });
        }
      },
    },
  },
});
