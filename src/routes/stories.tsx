import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Download, Share2, Loader2, Image as ImageIcon } from "lucide-react";
import { generateStoryImage } from "@/lib/ai.functions";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Gerador de Stories — ImpreMetrics 3D" },
      {
        name: "description",
        content: "Crie imagens de Story para WhatsApp Status e Instagram com IA.",
      },
    ],
  }),
  component: StoriesPage,
});

const SUGESTOES = [
  "Promoção relâmpago de chaveiros 3D personalizados",
  "Novidade: suporte de parede minimalista entregue em 24h",
  "Antes e depois: peça impressa em PLA preto fosco",
  "Bastidores: time da oficina preparando uma encomenda",
];

function StoriesPage() {
  const gen = useServerFn(generateStoryImage);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const run = async (p?: string) => {
    const text = (p ?? prompt).trim();
    if (!text) return;
    setLoading(true);
    setError(null);
    setImage("");
    try {
      const r = await gen({ data: { prompt: text } });
      if (r.error) setError(r.error);
      else setImage(r.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `story-${Date.now()}.png`;
    a.click();
  };

  const shareWhats = async () => {
    if (!image) return;
    const msg = encodeURIComponent(
      "Confira nosso story 👀 (salve a imagem e poste no seu Status do WhatsApp)",
    );
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], "story.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: "Story para WhatsApp" });
        return;
      }
    } catch {}
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-14 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Marketing · IA</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Gerador de Stories</h1>
          <p className="max-w-2xl text-sm text-white/50">
            Descreva o tema, a IA cria a imagem 9:16 e você posta manualmente no WhatsApp Status ou
            Instagram Stories. (APIs públicas não permitem publicar Status automaticamente.)
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Tema do story</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ex.: Promoção de vasos articulados, frete grátis na primeira compra…"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm outline-none focus:border-cyan-400/60"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPrompt(s);
                  run(s);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:border-cyan-400/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => run()}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Gerando…" : "Gerar story"}
          </button>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60">
              {image ? (
                <img src={image} alt="Story gerado" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-white/30">
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">Sua imagem aparece aqui</span>
                  </div>
                </div>
              )}
            </div>

            {image && (
              <div className="flex w-full gap-2">
                <button
                  onClick={download}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm hover:border-white/30"
                >
                  <Download className="h-4 w-4" /> Baixar
                </button>
                <button
                  onClick={shareWhats}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
                >
                  <Share2 className="h-4 w-4" /> Enviar pro WhatsApp
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
