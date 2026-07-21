import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ChatInput = z.object({
  prompt: z.string().min(1).max(8000),
  system: z.string().max(4000).optional(),
});

export const okLojaChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: "", error: "LOVABLE_API_KEY ausente. Ative o Lovable AI." };
    }

    const systemPrompt =
      data.system ??
      `Você é o OkLoja, assistente de IA especialista em impressão 3D, gestão de oficina maker, precificação, marketing e relacionamento com clientes. Responda em português do Brasil, de forma curta, prática e amigável. Use bullets quando útil.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "raw-fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.prompt },
          ],
        }),
      });

      if (res.status === 429)
        return { text: "", error: "Limite de uso atingido. Tente novamente em alguns segundos." };
      if (res.status === 402)
        return { text: "", error: "Créditos de IA esgotados. Adicione créditos na sua workspace." };
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { text: "", error: `Erro do Lovable AI (${res.status}): ${body.slice(0, 200)}` };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content ?? "";
      return { text, error: null as string | null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { text: "", error: `Falha de conexão com o gateway: ${msg}` };
    }
  });

const ImageInput = z.object({
  prompt: z.string().min(1).max(4000),
});

type ProviderResult =
  | { image: string; provider: string }
  | { image: ""; error: string; provider: string };

async function tryLovable(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { image: "", error: "sem chave", provider: "lovable" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) return { image: "", error: `HTTP ${res.status}`, provider: "lovable" };
  const json = (await res.json()) as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
  };
  const image = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  return image
    ? { image, provider: "lovable" }
    : { image: "", error: "sem imagem", provider: "lovable" };
}

async function tryStability(prompt: string): Promise<ProviderResult> {
  const key = process.env.STABILITY_API_KEY;
  if (!key) return { image: "", error: "sem chave", provider: "stability" };
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("aspect_ratio", "9:16");
  form.append("output_format", "png");
  const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) return { image: "", error: `HTTP ${res.status}`, provider: "stability" };
  const json = (await res.json()) as { image?: string };
  return json.image
    ? { image: `data:image/png;base64,${json.image}`, provider: "stability" }
    : { image: "", error: "sem imagem", provider: "stability" };
}

async function tryFireworks(prompt: string): Promise<ProviderResult> {
  const key = process.env.FIREWORKS_API_KEY;
  if (!key) return { image: "", error: "sem chave", provider: "fireworks" };
  const res = await fetch(
    "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/stable-diffusion-xl-1024-v1-0/text_to_image",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      body: JSON.stringify({ prompt, width: 1024, height: 1792, samples: 1 }),
    },
  );
  if (!res.ok) return { image: "", error: `HTTP ${res.status}`, provider: "fireworks" };
  const buf = await res.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { image: `data:image/png;base64,${b64}`, provider: "fireworks" };
}

async function tryOpenRouter(prompt: string): Promise<ProviderResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { image: "", error: "sem chave", provider: "openrouter" };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) return { image: "", error: `HTTP ${res.status}`, provider: "openrouter" };
  const json = (await res.json()) as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
  };
  const image = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
  return image
    ? { image, provider: "openrouter" }
    : { image: "", error: "sem imagem", provider: "openrouter" };
}

async function tryNvidia(prompt: string): Promise<ProviderResult> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return { image: "", error: "sem chave", provider: "nvidia" };
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt, weight: 1 }],
      width: 1024,
      height: 1024,
      samples: 1,
    }),
  });
  if (!res.ok) return { image: "", error: `HTTP ${res.status}`, provider: "nvidia" };
  const json = (await res.json()) as { artifacts?: Array<{ base64?: string }> };
  const b64 = json.artifacts?.[0]?.base64;
  return b64
    ? { image: `data:image/png;base64,${b64}`, provider: "nvidia" }
    : { image: "", error: "sem imagem", provider: "nvidia" };
}

export const generateStoryImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ImageInput.parse(input))
  .handler(async ({ data }) => {
    const fullPrompt = `Crie uma imagem vertical no formato Story 9:16 (1080x1920), visualmente impactante para postar no WhatsApp Status / Instagram Stories sobre impressão 3D. Estilo moderno, cores vibrantes, espaço para texto. Tema: ${data.prompt}`;

    const providers = [tryLovable, tryStability, tryFireworks, tryOpenRouter, tryNvidia];
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        const result = await provider(fullPrompt);
        if (result.image) {
          return { image: result.image, provider: result.provider, error: null as string | null };
        }
        errors.push(`${result.provider}: ${"error" in result ? result.error : "falhou"}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`exceção: ${msg}`);
      }
    }

    return {
      image: "",
      provider: "",
      error: `Todos os provedores falharam. ${errors.join(" | ")}`,
    };
  });
