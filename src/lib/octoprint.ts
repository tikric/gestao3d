import type { Printer } from "./printers-db";

/**
 * Upload a file to a printer. Returns a message on success.
 * Note: requires CORS to be enabled on the printer (OctoPrint plugin "CORS" / Moonraker default).
 */
export async function sendToPrinter(
  printer: Printer,
  file: Blob,
  fileName: string,
  options: { startPrint?: boolean } = {},
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    if (printer.type === "octoprint") {
      const fd = new FormData();
      fd.append("file", file, fileName);
      fd.append("select", options.startPrint ? "true" : "false");
      fd.append("print", options.startPrint ? "true" : "false");
      const res = await fetch(`${printer.url.replace(/\/$/, "")}/api/files/local`, {
        method: "POST",
        headers: { "X-Api-Key": printer.apiKey },
        body: fd,
      });
      if (!res.ok) return { ok: false, message: `OctoPrint ${res.status}: ${await res.text()}` };
      return {
        ok: true,
        message: options.startPrint ? "Enviado e impressão iniciada" : "Arquivo enviado",
      };
    }
    // Moonraker
    const fd = new FormData();
    fd.append("file", file, fileName);
    fd.append("root", "gcodes");
    if (options.startPrint) fd.append("print", "true");
    const res = await fetch(`${printer.url.replace(/\/$/, "")}/server/files/upload`, {
      method: "POST",
      headers: printer.apiKey ? { "X-Api-Key": printer.apiKey } : undefined,
      body: fd,
    });
    if (!res.ok) return { ok: false, message: `Moonraker ${res.status}: ${await res.text()}` };
    return {
      ok: true,
      message: options.startPrint ? "Enviado e impressão iniciada" : "Arquivo enviado",
    };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Falha de rede (CORS?)" };
  }
}

export async function testConnection(printer: Printer): Promise<{ ok: boolean; message: string }> {
  try {
    if (printer.type === "octoprint") {
      const res = await fetch(`${printer.url.replace(/\/$/, "")}/api/version`, {
        headers: { "X-Api-Key": printer.apiKey },
      });
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      const j = await res.json();
      return { ok: true, message: `OctoPrint ${j.server ?? j.api ?? "ok"}` };
    }
    const res = await fetch(`${printer.url.replace(/\/$/, "")}/printer/info`, {
      headers: printer.apiKey ? { "X-Api-Key": printer.apiKey } : undefined,
    });
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    return { ok: true, message: "Moonraker ok" };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Erro de conexão" };
  }
}

export async function getStatus(printer: Printer): Promise<any> {
  try {
    if (printer.type === "octoprint") {
      const [s, j] = await Promise.all([
        fetch(`${printer.url.replace(/\/$/, "")}/api/printer`, {
          headers: { "X-Api-Key": printer.apiKey },
        })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${printer.url.replace(/\/$/, "")}/api/job`, {
          headers: { "X-Api-Key": printer.apiKey },
        })
          .then((r) => r.json())
          .catch(() => null),
      ]);
      return { state: s?.state?.text, temps: s?.temperature, progress: j?.progress?.completion };
    }
    const r = await fetch(
      `${printer.url.replace(/\/$/, "")}/printer/objects/query?print_stats&heater_bed&extruder&display_status`,
      {
        headers: printer.apiKey ? { "X-Api-Key": printer.apiKey } : undefined,
      },
    ).then((r) => r.json());
    const s = r?.result?.status ?? {};
    return {
      state: s.print_stats?.state,
      temps: { bed: s.heater_bed, tool0: s.extruder },
      progress: (s.display_status?.progress ?? 0) * 100,
    };
  } catch {
    return null;
  }
}

/** Send one or more G-code commands. Returns the raw response text. */
export async function sendGcode(
  printer: Printer,
  commands: string | string[],
): Promise<{ ok: boolean; message: string }> {
  const list = Array.isArray(commands) ? commands : [commands];
  try {
    if (printer.type === "octoprint") {
      const res = await fetch(`${printer.url.replace(/\/$/, "")}/api/printer/command`, {
        method: "POST",
        headers: { "X-Api-Key": printer.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ commands: list }),
      });
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}: ${await res.text()}` };
      return { ok: true, message: `enviado: ${list.join("; ")}` };
    }
    // Moonraker
    const script = list.join("\n");
    const res = await fetch(
      `${printer.url.replace(/\/$/, "")}/printer/gcode/script?script=${encodeURIComponent(script)}`,
      { method: "POST", headers: printer.apiKey ? { "X-Api-Key": printer.apiKey } : undefined },
    );
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}: ${await res.text()}` };
    return { ok: true, message: `enviado: ${list.join("; ")}` };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Erro de rede (CORS?)" };
  }
}
