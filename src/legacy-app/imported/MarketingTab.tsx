import { useMemo, useState } from "react";
import {
  Megaphone,
  Send,
  Facebook,
  Instagram,
  Music2,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
  Sparkles,
  Download,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Link } from "@tanstack/react-router";
import { AiRecommendation, SectionTitle, Kpi } from "@/legacy-app/components/DashboardShell";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1631467488256-b1f88c520007?w=1200&q=80&auto=format&fit=crop";

const TEMPLATES: { id: string; label: string; build: (p: string, link: string) => string }[] = [
  {
    id: "lancamento",
    label: "Lançamento",
    build: (p, l) =>
      `🚀 Novidade saindo da impressora!\n\n${p} feito sob medida em 3D, acabamento impecável e pronto pra entrega.\n\n👉 Garanta o seu: ${l}\n\n#impressao3d #3dprinting #feitoamao`,
  },
  {
    id: "promo",
    label: "Promoção",
    build: (p, l) =>
      `🔥 PROMO RELÂMPAGO 🔥\n\n${p} com condição especial só hoje!\nQualidade premium, preço de fábrica.\n\n🛒 Pedidos: ${l}\n\n#promocao #impressao3d #oferta`,
  },
  {
    id: "encomenda",
    label: "Encomenda",
    build: (p, l) =>
      `✨ Aceito encomendas!\n\nFaço ${p} em 3D com cores e tamanhos personalizados.\nEntrega rápida e frete pra todo Brasil.\n\n💬 Fale comigo: ${l}\n\n#encomenda #personalizado #3dprint`,
  },
  {
    id: "depoimento",
    label: "Cliente feliz",
    build: (p, l) =>
      `❤️ Mais um cliente feliz com seu ${p}!\n\nCada peça é única, impressa com carinho e atenção aos detalhes.\n\n📦 Faça o seu: ${l}\n\n#clientefeliz #impressao3d`,
  },
];

function MarketingPage() {
  return (
    <AppShell>
      <div className="relative min-h-screen overflow-hidden">

        <div className="w-full py-6">
          {/* Premium Dashboard Header — padrão oficial */}
          <div className="space-y-6 mb-8 animate-fade-in">
            <AiRecommendation
              title="Dispare hoje no horário de pico (19h–21h)"
              body="Publicações multi-rede entre 19h e 21h convertem +38% em pedidos. Use o template 'Promoção' com foto vertical para maximizar alcance no Instagram e WhatsApp."
              savings="+38% alcance"
              action="Criar Post"
              onAction={() => document.getElementById('share-tool')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <div className="flex items-center justify-between">
              <SectionTitle icon={Megaphone} title="Dashboard — Marketing / Divulgação" status="Operacional" />
              <Link
                to="/stories"
                className="group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-violet-500/25 to-pink-500/25 border border-violet-300/30 hover:border-violet-200/50 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-100 transition-transform duration-500 group-hover:rotate-12" />
                Stories IA
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Kpi icon={Share2} label="Redes Ativas" value="6+" sub="Canais" tone="cyan" />
              <Kpi icon={Sparkles} label="Modelos" value="4" sub="Templates" tone="purple" />
              <Kpi icon={Send} label="Disparos" value="1-Click" sub="Multi-rede" tone="emerald" />
              <Kpi icon={ImageIcon} label="Stories IA" value="ON" sub="Gerador" tone="fuchsia" />
              <Kpi icon={MessageCircle} label="WhatsApp" value="Direto" sub="wa.me" tone="lime" />
              <Kpi icon={LinkIcon} label="Pinterest" value="Pin" sub="Auto" tone="orange" />
            </div>
          </div>

          <div id="share-tool"><ShareTool /></div>
        </div>
      </div>
    </AppShell>
  );
}

function ShareTool() {
  const [productName, setProductName] = useState("Suporte para celular dragão 3D");
  const [link, setLink] = useState("https://meusite.com/produto");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(
    TEMPLATES[0].build("Suporte para celular dragão 3D", "https://meusite.com/produto"),
  );
  const [copied, setCopied] = useState<string>("");

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl) setMessage(tpl.build(productName || "produto", link || ""));
  };

  const encoded = useMemo(() => encodeURIComponent(message), [message]);
  const encodedLink = useMemo(() => encodeURIComponent(link), [link]);
  const cleanPhone = phone.replace(/\D/g, "");

  const isDataUrl = image.startsWith("data:");

  const links = {
    whatsapp: cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encoded}`,
    telegram: `https://t.me/share/url?url=${encodedLink}&text=${encoded}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedLink}`,
    email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encoded}`,
    pinterest: isDataUrl
      ? ""
      : `https://www.pinterest.com/pin/create/button/?url=${encodedLink}&media=${encodeURIComponent(image)}&description=${encoded}`,
  };

  const openShare = (url: string) => {
    if (!url) return;
    // window.open bypasses iframe anchor restrictions in some previews
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      // Fallback: navigate top
      window.location.href = url;
    }
  };

  const copy = async (what: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    setTimeout(() => setCopied(""), 1500);
  };

  const downloadImage = async () => {
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${productName.replace(/\s+/g, "-").toLowerCase() || "post"}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(image, "_blank");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: editor */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.3)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h2 className="font-semibold text-white">Conteúdo do post</h2>
        </div>

        <Input label="Produto" value={productName} onChange={setProductName} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Link do produto"
            icon={<LinkIcon className="h-3.5 w-3.5" />}
            value={link}
            onChange={setLink}
            placeholder="https://..."
          />
          <Input
            label="WhatsApp (opcional)"
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            value={phone}
            onChange={setPhone}
            placeholder="5511999999999"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50 inline-flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Foto do produto
          </span>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-cyan-100 text-sm hover:from-cyan-500/30 hover:to-blue-600/30 transition-colors shadow-[0_0_24px_-8px_rgba(34,211,238,0.5)]">
              <ImageIcon className="h-4 w-4" />
              Enviar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 8 * 1024 * 1024) {
                    alert("Imagem muito grande (máx 8MB).");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setImage(String(reader.result));
                  reader.readAsDataURL(f);
                }}
              />
            </label>
            {image && (
              <button
                onClick={() => setImage("")}
                className="text-xs text-white/50 hover:text-white px-3 py-2 rounded-full border border-white/10 hover:border-white/20"
              >
                Remover
              </button>
            )}
          </div>
          <input
            value={isDataUrl ? "" : image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="ou cole uma URL: https://..."
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 backdrop-blur-xl"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">
            Modelo de mensagem
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${
                  templateId === t.id
                    ? "bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-100 border border-cyan-400/40 shadow-[0_0_24px_-8px_rgba(34,211,238,0.6)]"
                    : "bg-white/[0.04] text-white/60 border border-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">Mensagem</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 backdrop-blur-xl font-sans leading-relaxed resize-y"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">{message.length} caracteres</span>
            <button
              onClick={() => copy("msg", message)}
              className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1"
            >
              {copied === "msg" ? (
                <><Check className="h-3 w-3 text-emerald-400" /> Copiado</>
              ) : (
                <><Copy className="h-3 w-3" /> Copiar mensagem</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right: preview + share */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_-30px_rgba(139,92,246,0.3)]">
          <div className="aspect-square bg-black/40 relative">
            {image ? (
              <img
                src={image}
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                Sem imagem
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5">
              <div className="text-white font-semibold drop-shadow text-lg">{productName}</div>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between border-t border-white/10">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              Pré-visualização
            </span>
            <button
              onClick={downloadImage}
              className="text-xs inline-flex items-center gap-1 text-white/60 hover:text-white"
            >
              <Download className="h-3 w-3" /> Baixar imagem
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4 shadow-[0_20px_60px_-30px_rgba(34,211,238,0.3)]">
          <h2 className="font-semibold text-white">Compartilhar em 1 clique</h2>

          <div className="grid grid-cols-2 gap-2">
            <ShareBtn
              onClick={() => openShare(links.whatsapp)}
              label="WhatsApp"
              icon={MessageCircle}
              className="bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.6)]"
            />
            <ShareBtn
              onClick={() => openShare(links.facebook)}
              label="Facebook"
              icon={Facebook}
              className="bg-[#1877F2] hover:bg-[#0e5fc3] text-white shadow-[0_8px_24px_-8px_rgba(24,119,242,0.6)]"
            />
            <ShareBtn
              onClick={() => openShare(links.telegram)}
              label="Telegram"
              icon={Send}
              className="bg-[#229ED9] hover:bg-[#1c83b3] text-white shadow-[0_8px_24px_-8px_rgba(34,158,217,0.6)]"
            />
            <ShareBtn
              onClick={() => openShare(links.twitter)}
              label="X / Twitter"
              icon={Share2}
              className="bg-black hover:bg-neutral-800 text-white border border-white/10"
            />
            <ShareBtn
              onClick={() => openShare(links.pinterest)}
              label={isDataUrl ? "Pinterest (URL)" : "Pinterest"}
              icon={ImageIcon}
              className={`text-white ${
                isDataUrl
                  ? "bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
                  : "bg-[#E60023] hover:bg-[#c20020] shadow-[0_8px_24px_-8px_rgba(230,0,35,0.6)]"
              }`}
            />
            <ShareBtn
              onClick={() => openShare(links.email)}
              label="E-mail"
              icon={Mail}
              className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10"
            />
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <p className="text-xs text-white/50">
              Instagram e TikTok não permitem envio direto pelo navegador. Os botões copiam
              a mensagem e abrem o app pronto para colar.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  setCopied("ig");
                  setTimeout(() => setCopied(""), 1500);
                  openShare("https://www.instagram.com/");
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700 hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(236,72,153,0.6)]"
              >
                <Instagram className="h-4 w-4" />
                {copied === "ig" ? "Copiado! Abrindo..." : "Instagram"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  setCopied("tt");
                  setTimeout(() => setCopied(""), 1500);
                  openShare("https://www.tiktok.com/upload");
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium text-white bg-black hover:bg-neutral-800 border border-white/10"
              >
                <Music2 className="h-4 w-4" />
                {copied === "tt" ? "Copiado! Abrindo..." : "TikTok"}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-white/30 pt-1">
            Dica: se o navegador bloquear o pop-up, libere pop-ups deste site ou abra em uma
            aba do navegador (fora do preview).
          </p>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-[0.2em] text-white/50 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 backdrop-blur-xl"
      />
    </label>
  );
}

function ShareBtn({
  onClick,
  label,
  icon: Icon,
  className,
}: {
  onClick: () => void;
  label: string;
  icon: any;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-sm font-medium transition-colors ${className ?? ""}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default MarketingPage;
