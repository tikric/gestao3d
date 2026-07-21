import { createServerFn } from "@tanstack/react-start";

export const uploadBackupToGDrive = createServerFn({ method: "POST" })
  .inputValidator((input: { fileName: string; content: string; folderName?: string }) => {
    if (!input?.fileName || typeof input.fileName !== "string")
      throw new Error("fileName obrigatório");
    if (typeof input.content !== "string") throw new Error("content obrigatório");
    return {
      fileName: input.fileName.slice(0, 200),
      content: input.content,
      folderName: (input.folderName || "Imprimetrics").slice(0, 120),
    };
  })
  .handler(async ({ data }) => {
    const lovKey = process.env.LOVABLE_API_KEY;
    const gdKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!lovKey || !gdKey) throw new Error("Credenciais do conector Google Drive ausentes.");
    const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
    const headers = {
      Authorization: `Bearer ${lovKey}`,
      "X-Connection-Api-Key": gdKey,
    } as Record<string, string>;

    // 1) Find or create the folder (scope drive.file só vê o que o app criou)
    let folderId: string | null = null;
    try {
      const q = encodeURIComponent(
        `name='${data.folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      );
      const lr = await fetch(`${GATEWAY}/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, {
        headers,
      });
      if (lr.ok) {
        const lj: any = await lr.json();
        folderId = lj?.files?.[0]?.id || null;
      }
    } catch {}
    if (!folderId) {
      const cr = await fetch(`${GATEWAY}/drive/v3/files?fields=id`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.folderName,
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      if (!cr.ok)
        throw new Error(`Falha ao criar pasta: ${cr.status} ${await cr.text().catch(() => "")}`);
      const cj: any = await cr.json();
      folderId = cj.id;
    }

    // 2) Multipart upload
    const boundary = "----lov_" + Math.random().toString(36).slice(2);
    const metadata = {
      name: data.fileName,
      parents: folderId ? [folderId] : undefined,
      mimeType: "application/json",
    };
    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      data.content +
      `\r\n--${boundary}--`;
    const ur = await fetch(
      `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      },
    );
    if (!ur.ok) throw new Error(`Falha no upload: ${ur.status} ${await ur.text().catch(() => "")}`);
    const uj: any = await ur.json();

    // 3) Rotação: manter só os 5 mais recentes na pasta
    try {
      const lr2 = await fetch(
        `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType='application/json'`)}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=50`,
        { headers },
      );
      if (lr2.ok) {
        const lj2: any = await lr2.json();
        const list = (lj2?.files || []) as Array<{ id: string }>;
        const toDelete = list.slice(5);
        await Promise.all(
          toDelete.map((f) =>
            fetch(`${GATEWAY}/drive/v3/files/${f.id}`, { method: "DELETE", headers }),
          ),
        );
      }
    } catch {}

    return {
      id: uj.id as string,
      name: uj.name as string,
      webViewLink: uj.webViewLink as string | undefined,
    };
  });
