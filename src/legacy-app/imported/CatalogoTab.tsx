import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  Send,
  Boxes,
  Archive,
  Tag as TagIcon,
  X,
  Sparkles,
  HardDrive,
  Layers,
} from "lucide-react";
import { AiRecommendation, SectionTitle, Kpi } from "@/legacy-app/components/DashboardShell";
import {
  listModels,
  saveModel,
  deleteModel,
  getFile,
  findByHash,
  hashFile,
  CATEGORIES,
  type ModelRecord,
} from "@/lib/catalog-db";
import { loadAsStl } from "@/lib/threemf";
import { renderStlThumbnail } from "@/lib/stl-thumbnail";
import { SendToPrinterDialog } from "@/components/SendToPrinterDialog";
import { Model3DViewer } from "@/components/Model3DViewer";
import JSZip from "jszip";
import { getTelegramAutoSend, sendStlToTelegram } from "@/legacy-app/lib/telegram";

type UploadProgress = { name: string; pct: number; status: "uploading" | "done" | "dup" | "error"; message?: string };

function CatalogPage() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [fileType, setFileType] = useState<"all" | "stl" | "3mf">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [sendModel, setSendModel] = useState<ModelRecord | null>(null);
  const [preview, setPreview] = useState<{ model: ModelRecord; file: Blob } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => setModels(await listModels());
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    let m = models;
    if (category !== "all") m = m.filter((x) => x.category === category);
    if (fileType !== "all") m = m.filter((x) => x.fileType === fileType);
    if (query.trim()) {
      const q = query.toLowerCase();
      m = m.filter((x) =>
        x.name.toLowerCase().includes(q) ||
        x.notes.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const s = [...m];
    if (sortBy === "name") s.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "size") s.sort((a, b) => b.size - a.size);
    return s;
  }, [models, query, category, fileType, sortBy]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => /\.(stl|3mf)$/i.test(f.name));
    if (!arr.length) return;
    const initial = arr.map((f) => ({ name: f.name, pct: 0, status: "uploading" as const }));
    setUploads((u) => [...u, ...initial]);

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const idx = uploads.length + i;
      try {
        setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 15 } : x)));
        const hash = await hashFile(file);
        const dup = await findByHash(hash);
        if (dup) {
          setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 100, status: "dup", message: "Já existe" } : x)));
          continue;
        }
        const type: "stl" | "3mf" = file.name.toLowerCase().endsWith(".3mf") ? "3mf" : "stl";
        setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 45 } : x)));
        let thumb: string | undefined;
        try {
          const stl = await loadAsStl(file, type);
          const r = await renderStlThumbnail(stl);
          thumb = r.dataUrl;
        } catch (e) {
          // thumbnail optional
          console.warn("thumbnail fail", e);
        }
        setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 80 } : x)));
        const now = Date.now();
        const rec: ModelRecord = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.(stl|3mf)$/i, ""),
          fileName: file.name,
          fileType: type,
          size: file.size,
          hash,
          category: "Decoração",
          tags: [],
          notes: "",
          unit: "mm",
          scale: 1,
          thumbnail: thumb,
          createdAt: now,
          updatedAt: now,
        };
        await saveModel(rec, file);
        setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 100, status: "done" } : x)));
        if (getTelegramAutoSend()) {
          sendStlToTelegram(
            file,
            file.name,
            `📦 Novo ${type.toUpperCase()} no Vault: ${rec.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
            undefined,
            thumb,
          ).then((r) => {
            if (!r.ok) console.warn("[telegram] send failed:", r.error);
          });
        }
      } catch (e: any) {
        setUploads((u) => u.map((x, j) => (j === idx ? { ...x, pct: 100, status: "error", message: e?.message } : x)));
      }
    }
    refresh();
    setTimeout(() => setUploads((u) => u.filter((x) => x.status === "uploading")), 2500);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const toggleSel = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Excluir ${selected.size} modelo(s)?`)) return;
    for (const id of selected) await deleteModel(id);
    setSelected(new Set());
    refresh();
  };

  const bulkDownload = async () => {
    const ids = selected.size ? Array.from(selected) : models.map((m) => m.id);
    if (!ids.length) return;
    const zip = new JSZip();
    const meta: any[] = [];
    for (const id of ids) {
      const m = models.find((x) => x.id === id) || (await listModels()).find((x) => x.id === id);
      if (!m) continue;
      const f = await getFile(id);
      if (f) zip.file(`files/${m.fileName}`, f);
      meta.push(m);
    }
    zip.file("catalog.json", JSON.stringify(meta, null, 2));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalogo-3d-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadOne = async (m: ModelRecord) => {
    const f = await getFile(m.id);
    if (!f) return;
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = m.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewOne = async (m: ModelRecord) => {
    setPreviewError(null);
    const f = await getFile(m.id);
    if (!f) {
      setPreviewError(`Arquivo não encontrado para "${m.name}"`);
      return;
    }
    setPreview({ model: m, file: f });
  };

  const removeOne = async (m: ModelRecord) => {
    if (!confirm(`Excluir "${m.name}"?`)) return;
    await deleteModel(m.id);
    refresh();
  };

  return (
    <AppShell>
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/3 h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-[160px]" />
          <div className="absolute top-1/2 -right-40 h-[460px] w-[460px] rounded-full bg-sky-600/10 blur-[150px]" />
          <div className="absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.06] blur-[150px]" />
        </div>

        <div className="w-full py-6 space-y-6">
          {/* AI Recommendation + KPI strip (padrão Clientes) */}
          <AiRecommendation
            title={
              models.length === 0
                ? 'Comece subindo seus primeiros STLs'
                : models.filter((m) => !m.thumbnail).length > 0
                  ? `${models.filter((m) => !m.thumbnail).length} modelo(s) sem miniatura`
                  : 'Vault organizado — faça backup hoje'
            }
            body={
              models.length === 0
                ? 'Sem arquivos no Vault a IA não consegue prever materiais nem agrupar peças. Arraste seus .stl/.3mf para começar.'
                : models.filter((m) => !m.thumbnail).length > 0
                  ? 'Modelos sem preview não convertem bem no catálogo público. Reabra para regenerar a miniatura automaticamente.'
                  : 'Você tem arquivos importantes armazenados localmente. Gere um ZIP de backup para evitar perda em caso de troca de máquina.'
            }
            savings={`${(models.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(1)} MB`}
            action={models.length === 0 ? 'Subir STL' : 'Backup ZIP'}
            onAction={() => (models.length === 0 ? inputRef.current?.click() : bulkDownload())}
          />

          <SectionTitle icon={Boxes} title="Dashboard — STL Vault" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi icon={Boxes} label="Modelos" value={models.length} tone="gold" />
            <Kpi icon={Layers} label="STL" value={models.filter((m) => m.fileType === 'stl').length} tone="lime" />
            <Kpi icon={Layers} label="3MF" value={models.filter((m) => m.fileType === '3mf').length} tone="blue" />
            <Kpi
              icon={HardDrive}
              label="Armazenamento"
              value={`${(models.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(1)} MB`}
              sub="local"
              tone="emerald"
            />
            <Kpi
              icon={TagIcon}
              label="Categorias"
              value={new Set(models.map((m) => m.category)).size}
              tone="purple"
            />
            <Kpi
              icon={Sparkles}
              label="Sem Miniatura"
              value={models.filter((m) => !m.thumbnail).length}
              tone={models.filter((m) => !m.thumbnail).length > 0 ? 'orange' : 'emerald'}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={bulkDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-100"
            >
              <Archive className="h-4 w-4" /> Backup ZIP {selected.size ? `(${selected.size})` : '(todos)'}
            </button>
            {selected.size > 0 && (
              <button
                onClick={bulkDelete}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/15 to-red-600/5 px-4 py-2 text-sm text-red-100 transition-all hover:-translate-y-0.5 hover:from-red-500/25 hover:shadow-[0_0_24px_-8px_rgba(248,113,113,0.6)]"
              >
                <Trash2 className="h-4 w-4" /> Excluir ({selected.size})
              </button>
            )}
          </div>

          {/* Upload zone */}
          <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`group cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center backdrop-blur-xl transition-all duration-300 ${
            dragOver
              ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_60px_-12px_rgba(34,211,238,0.45)] scale-[1.01]"
              : "border-white/15 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-16px_rgba(34,211,238,0.3)]"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-sky-600/10 transition-transform duration-300 group-hover:scale-110">
            <Upload className="h-6 w-6 text-cyan-200" />
          </div>
          <p className="mt-4 text-sm text-white/80">
            Arraste arquivos <span className="font-mono text-cyan-300">.stl</span> e{" "}
            <span className="font-mono text-cyan-300">.3mf</span> aqui — ou clique para selecionar
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.24em] text-white/40">Miniaturas geradas automaticamente</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".stl,.3mf"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          </div>

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                <div className="flex justify-between text-xs text-white/70">
                  <span className="truncate">{u.name}</span>
                  <span className="tabular-nums">
                    {u.status === "done" && "✓ pronto"}
                    {u.status === "dup" && "duplicado"}
                    {u.status === "error" && `erro: ${u.message}`}
                    {u.status === "uploading" && `${u.pct}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${
                      u.status === "error" ? "bg-gradient-to-r from-red-500 to-red-400" : u.status === "dup" ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-cyan-500 to-sky-400"
                    }`}
                    style={{ width: `${u.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {previewError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 backdrop-blur">
            {previewError}
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-cyan-300/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, tag, notas…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition-all focus:border-cyan-400/50 focus:bg-white/[0.05] focus:shadow-[0_0_30px_-12px_rgba(34,211,238,0.4)]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white backdrop-blur-xl transition-colors hover:border-white/20 focus:border-cyan-400/40 outline-none"
          >
            <option value="all" className="bg-[#0b0b14]">Todas categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0b0b14]">{c}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white backdrop-blur-xl transition-colors hover:border-white/20 focus:border-cyan-400/40 outline-none"
            >
              <option value="all" className="bg-[#0b0b14]">Todos</option>
              <option value="stl" className="bg-[#0b0b14]">STL</option>
              <option value="3mf" className="bg-[#0b0b14]">3MF</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white backdrop-blur-xl transition-colors hover:border-white/20 focus:border-cyan-400/40 outline-none"
            >
              <option value="date" className="bg-[#0b0b14]">Data</option>
              <option value="name" className="bg-[#0b0b14]">Nome</option>
              <option value="size" className="bg-[#0b0b14]">Tamanho</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-20 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent">
              <Boxes className="h-8 w-8 text-white/30" />
            </div>
            <p className="mt-4 text-sm text-white/60">{models.length === 0 ? "Sem modelos ainda" : "Nenhum modelo encontrado"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((m, idx) => (
              <div
                key={m.id}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(34,211,238,0.35)] animate-in fade-in slide-in-from-bottom-2 ${
                  selected.has(m.id) ? "border-cyan-400/60 shadow-[0_0_28px_-10px_rgba(34,211,238,0.55)]" : "border-white/10 hover:border-cyan-400/30"
                }`}
                style={{ animationDelay: `${Math.min(idx * 30, 600)}ms`, animationFillMode: "both" }}
              >
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
                </div>
                <label className="absolute left-4 top-4 z-10">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggleSel(m.id)}
                    className="h-4 w-4 cursor-pointer accent-cyan-400"
                  />
                </label>
                <div className="block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] ring-1 ring-white/5">
                    {m.thumbnail ? (
                      <img src={m.thumbnail} alt={m.name} className="h-full w-full object-contain transition-transform duration-[600ms] ease-out group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/30">
                        <Boxes className="h-12 w-12" />
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/80 backdrop-blur">
                      {m.fileType}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="truncate text-sm font-medium tracking-tight text-white">{m.name}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                      <span className="uppercase tracking-wider">{m.category}</span>
                      <span className="tabular-nums">{(m.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    {m.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.tags.slice(0, 3).map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/70">
                            <TagIcon className="h-2.5 w-2.5" /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-1 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  <button
                    onClick={() => previewOne(m)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs text-white/80 transition-all hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-100"
                    title="Visualizar 3D"
                  >
                    <Eye className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setSendModel(m)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-white/80 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-100"
                    title="Enviar para impressora"
                  >
                    <Send className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => downloadOne(m)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-white/80 transition-all hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-sky-100"
                  >
                    <Download className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeOne(m)}
                    className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-xs text-red-200 transition-all hover:bg-red-500/20 hover:shadow-[0_0_16px_-6px_rgba(248,113,113,0.6)]"
                  >
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <SendToPrinterDialog model={sendModel} open={!!sendModel} onClose={() => setSendModel(null)} />
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex h-[82vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07070c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white">{preview.model.name}</h2>
                <p className="text-xs uppercase text-white/45">{preview.model.fileType} · {(preview.model.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Model3DViewer file={preview.file} fileType={preview.model.fileType} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default CatalogPage;
