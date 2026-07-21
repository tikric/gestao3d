const CHAT_KEY = "bambuzau_telegram_chat_id";
const AUTO_KEY = "bambuzau_telegram_auto_send";

export const getTelegramChatId = (): string => {
  try { return localStorage.getItem(CHAT_KEY) || ""; } catch { return ""; }
};
export const setTelegramChatId = (id: string) => {
  try { localStorage.setItem(CHAT_KEY, id.trim()); } catch {}
};
export const getTelegramAutoSend = (): boolean => {
  try { return localStorage.getItem(AUTO_KEY) === "1"; } catch { return false; }
};
export const setTelegramAutoSend = (on: boolean) => {
  try { localStorage.setItem(AUTO_KEY, on ? "1" : "0"); } catch {}
};

export interface SendStlResult { ok: boolean; error?: string; message_id?: number }

export const sendStlToTelegram = async (
  file: File | Blob,
  fileName: string,
  caption = "",
  chatId?: string,
  thumbnail?: string | Blob | null,
): Promise<SendStlResult> => {
  const chat = (chatId || getTelegramChatId()).trim();
  if (!chat) return { ok: false, error: "chat_id do Telegram não configurado." };
  const fd = new FormData();
  fd.append("chat_id", chat);
  if (caption) fd.append("caption", caption);
  const f = file instanceof File ? file : new File([file], fileName);
  fd.append("file", f, fileName);
  if (thumbnail) {
    try {
      let blob: Blob | null = null;
      if (typeof thumbnail === "string") {
        if (thumbnail.startsWith("data:")) {
          const res = await fetch(thumbnail);
          blob = await res.blob();
        }
      } else {
        blob = thumbnail;
      }
      if (blob) fd.append("thumbnail", new File([blob], "preview.png", { type: blob.type || "image/png" }));
    } catch {}
  }
  try {
    const res = await fetch("/api/telegram/send-stl", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) return { ok: false, error: data?.error || `Erro ${res.status}` };
    return { ok: true, message_id: data.message_id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Falha de rede" };
  }
};