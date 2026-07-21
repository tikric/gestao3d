// @ts-nocheck
/**
 * Utility to resolve API URLs.
 * When running inside the Android APK WebView (appassets.androidplatform.net),
 * all API calls must go directly to the deployed Cloud Run backend.
 */

const PRODUCTION_URL = 'https://teste1-73c2.onrender.com';

export function checkIsAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hostname = window.location.hostname || '';
    const protocol = window.location.protocol || '';
    return (
      hostname.includes('androidplatform.net') ||
      protocol === 'file:' ||
      protocol.startsWith('capacitor') ||
      protocol.startsWith('app:')
    );
  } catch (_) {
    return false;
  }
}

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (typeof window === 'undefined') {
    return `${PRODUCTION_URL}${cleanEndpoint}`;
  }

  // APK WebView — sempre usa Cloud Run diretamente
  if (checkIsAndroidWebView()) {
    return `${PRODUCTION_URL}${cleanEndpoint}`;
  }

  // Browser normal (desktop ou celular via browser) — usa origem atual
  const origin = window.location.origin;
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${base}${cleanEndpoint}`;
}

/**
 * Directly communicates with Groq APIs on the client side.
 */
export async function callGroq(apiKey: string, systemPrompt: string, userMessage: string, previousMessages: any[] = []): Promise<string> {
  const modelsToTry = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192"
  ];
  
  let lastError = "";
  for (const modelName of modelsToTry) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            ...previousMessages,
            { role: "user", content: userMessage }
          ],
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        lastError = errBody?.error?.message || `Erro da API Groq com modelo ${modelName} (Status ${response.status})`;
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content) return content;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }
  throw new Error(lastError || "Todas as tentativas de chamada na API Groq falharam.");
}

/**
 * Directly communicates with Gemini APIs on the client side.
 */
export async function callGemini(apiKey: string, systemPrompt: string, userMessage: string, previousMessages: any[] = []): Promise<string> {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ];

  let lastError = "";
  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: `System Instruction/System Prompt:\n${systemPrompt}\n\nUser Question:\n${userMessage}` }]
          }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        lastError = errBody?.error?.message || `Erro da API Gemini com modelo ${modelName} (Status ${response.status})`;
        continue;
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (content) return content;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }
  throw new Error(lastError || "Todas as tentativas de chamada na API Gemini falharam.");
}

/**
 * Generates visual palette directly on the client.
 */
export async function callGeminiGeneratePalette(logoBase64: string, apiKey: string): Promise<any> {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  const matches = logoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  let mimeType = "image/png";
  let rawBase64 = logoBase64;
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    rawBase64 = matches[2];
  }

  const imagePart = { inlineData: { mimeType, data: rawBase64 } };

  const promptText = `Você é um designer de interfaces (UI/UX) especialista em impressão 3D.
  Analise as cores predominantes e o estilo dessa imagem de logotipo e gere uma recomendação de paleta de cores harmoniosa, moderna e super profissional para o aplicativo do ateliê 3D.
  A paleta deve seguir um esquema de tema predominantemente escuro (dark theme) (exceto se o logo sugerir um claro, mas prefira escuro elegante) para destacar as cores.
  
  Retorne obrigatoriamente um objeto JSON com os seguintes campos exatos em formato hexadecimal (ex: "#1E293B"):
  1. bgMain: Cor de fundo principal mais escura do app
  2. bgCard: Cor de fundo para os cartões e painéis à frente (deve ser OBJETIVAMENTE MAIS CLARA e distinta do bgMain)
  3. borderColor: Cor para bordas (deve ser ainda mais clara e iluminada que bgCard)
  4. colorPrimary: Cor primária em destaque
  5. colorPrimaryLight: Uma versão mais clara ou brilhante do colorPrimary
  6. colorAccent: Cor de destaque secundária
  7. colorText: Cor principal do texto (perto do branco para leitura escura, ex: #F8FAFC)
  8. colorMuted: Cor de texto secundária/suave
  9. textAccent: Cor de texto em destaque primário.
  
  Retorne APENAS o objeto JSON puro, sem marcações markdown.`;

  let lastError = "";
  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [imagePart, { text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        lastError = errBody?.error?.message || `Erro da API Gemini para paleta com modelo ${modelName} (Status ${response.status})`;
        continue;
      }

      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (content) {
        const cleanJson = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
        return JSON.parse(cleanJson);
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }
  throw new Error(lastError || "Todas as tentativas de gerar paleta de cores falharam.");
}

/**
 * Validates API key format.
 */
export function validateApiKeyFormat(key: string | undefined): { isValid: boolean; reason?: string } {
  if (!key) return { isValid: false, reason: "A chave de API está vazia!" };
  const trimmed = key.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "") return { isValid: false, reason: "A chave de API não pode conter apenas espaços em branco!" };
  if (lower === "null") return { isValid: false, reason: "Chave inválida: o valor informado é a palavra reservada 'null'." };
  if (lower === "undefined") return { isValid: false, reason: "Chave inválida: o valor informado é a palavra reservada 'undefined'." };
  if (lower === "none" || lower === "placeholder") return { isValid: false, reason: "Por favor, informe uma chave de API real ativa." };
  if (trimmed.length < 15) return { isValid: false, reason: `Chave muito curta! Mínimo 15 caracteres (atual: ${trimmed.length}).` };
  return { isValid: true };
}