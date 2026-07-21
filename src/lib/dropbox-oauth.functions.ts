import { createServerFn } from "@tanstack/react-start";

function getAppCreds() {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error("DROPBOX_APP_KEY/DROPBOX_APP_SECRET não configurados no servidor.");
  }
  return { appKey, appSecret };
}

export const getDropboxAppKey = createServerFn({ method: "GET" }).handler(async () => {
  // appKey (client_id) é público por design — pode ir ao cliente para montar a URL de autorização.
  return { appKey: process.env.DROPBOX_APP_KEY || "" };
});

export const exchangeDropboxCodeFn = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => {
    if (!input || typeof input.code !== "string" || !input.code.trim()) {
      throw new Error("Código de autorização ausente.");
    }
    return { code: input.code.trim() };
  })
  .handler(async ({ data }) => {
    const { appKey, appSecret } = getAppCreds();
    const body = new URLSearchParams({
      code: data.code,
      grant_type: "authorization_code",
      client_id: appKey,
      client_secret: appSecret,
    });
    const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Falha Dropbox: ${json?.error_description || json?.error || res.status}`);
    }
    return {
      accessToken: String(json.access_token || ""),
      refreshToken: String(json.refresh_token || ""),
      expiresIn: Number(json.expires_in || 14400),
    };
  });

export const refreshDropboxAccessFn = createServerFn({ method: "POST" })
  .inputValidator((input: { refreshToken: string }) => {
    if (!input || typeof input.refreshToken !== "string" || !input.refreshToken.trim()) {
      throw new Error("refreshToken ausente.");
    }
    return { refreshToken: input.refreshToken.trim() };
  })
  .handler(async ({ data }) => {
    const { appKey, appSecret } = getAppCreds();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    });
    const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `Falha refresh Dropbox: ${json?.error_description || json?.error || res.status}`,
      );
    }
    return {
      accessToken: String(json.access_token || ""),
      expiresIn: Number(json.expires_in || 14400),
    };
  });
