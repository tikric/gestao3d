import { createFileRoute } from "@tanstack/react-router";
import { assertInternalCaller } from "../_auth";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_BYTES = 50 * 1024 * 1024; // Telegram sendDocument limit

export const Route = createFileRoute("/api/telegram/send-stl")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = assertInternalCaller(request);
        if (denied) return denied;

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
        if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
          return Response.json(
            { ok: false, error: "Telegram não está configurado no servidor." },
            { status: 500 },
          );
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ ok: false, error: "Payload inválido." }, { status: 400 });
        }

        const chatId = String(form.get("chat_id") || "").trim();
        const caption = String(form.get("caption") || "").slice(0, 1024);
        const file = form.get("file");
        const thumbnail = form.get("thumbnail");

        if (!chatId)
          return Response.json({ ok: false, error: "chat_id ausente." }, { status: 400 });
        if (!(file instanceof File)) {
          return Response.json({ ok: false, error: "Arquivo ausente." }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return Response.json(
            {
              ok: false,
              error: `Arquivo acima do limite do Telegram (50 MB). Atual: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
            },
            { status: 413 },
          );
        }

        // Optional: send the preview image first as a photo so the user sees the model thumbnail in Telegram.
        if (thumbnail instanceof File && thumbnail.size > 0 && thumbnail.size <= 10 * 1024 * 1024) {
          try {
            const photoForm = new FormData();
            photoForm.append("chat_id", chatId);
            if (caption) photoForm.append("caption", caption);
            photoForm.append("photo", thumbnail, thumbnail.name || "preview.png");
            await fetch(`${GATEWAY_URL}/sendPhoto`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": TELEGRAM_API_KEY,
              },
              body: photoForm,
            });
          } catch {
            // non-fatal; continue to document upload
          }
        }

        const upstream = new FormData();
        upstream.append("chat_id", chatId);
        if (caption) upstream.append("caption", caption);
        upstream.append("document", file, file.name || "model.stl");

        const res = await fetch(`${GATEWAY_URL}/sendDocument`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TELEGRAM_API_KEY,
          },
          body: upstream,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !(data as any)?.ok) {
          return Response.json(
            { ok: false, error: (data as any)?.description || `Telegram retornou ${res.status}` },
            { status: 502 },
          );
        }
        return Response.json({ ok: true, message_id: (data as any)?.result?.message_id });
      },
    },
  },
});
