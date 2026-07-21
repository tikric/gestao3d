import React, { useState } from "react";
import { ProductDeal, Category, SiteSettings } from "../types";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Settings,
  Link,
  Wand2,
  Eye,
  Download,
  Upload,
  Save,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CreatorPanelProps {
  categories: Category[];
  deals: ProductDeal[];
  onAddDeal: (deal: ProductDeal) => void;
  onUpdateDeal: (deal: ProductDeal) => void;
  onDeleteDeal: (id: string) => void;
  settings: SiteSettings;
  onSaveSettings: (settings: SiteSettings) => void;
  onClose: () => void;
}

export default function CreatorPanel({
  categories,
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  settings,
  onSaveSettings,
  onClose,
}: CreatorPanelProps) {
  const [activeTab, setActiveTab] = useState<"add" | "list" | "settings">("add");

  // AI Parsing State
  const [aiText, setAiText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Form states for product deals
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceOriginal: "",
    pricePromo: "",
    discount: "",
    category: "casa-cozinha",
    shopeeUrl: "",
    imageUrl: "",
    rating: "4.8",
    salesCount: "150",
    couponCode: "",
    isHot: false,
  });

  // Form states for general settings
  const [settingsFormData, setSettingsFormData] = useState({ ...settings });

  // Reset Product Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      priceOriginal: "",
      pricePromo: "",
      discount: "",
      category: "casa-cozinha",
      shopeeUrl: "",
      imageUrl: "",
      rating: "4.8",
      salesCount: "150",
      couponCode: "",
      isHot: false,
    });
    setAiText("");
    setAiError(null);
    setAiSuccessMessage(null);
  };

  // Pre-defined random product images as options
  const sampleImages = [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&q=80",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
    "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&q=80",
    "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&q=80",
  ];

  // Auto calculate discount percentage
  const handlePriceBlur = () => {
    const orig = parseFloat(formData.priceOriginal);
    const promo = parseFloat(formData.pricePromo);
    if (!isNaN(orig) && !isNaN(promo) && orig > promo && orig > 0) {
      const computedDiscount = Math.round(((orig - promo) / orig) * 100);
      setFormData((prev) => ({ ...prev, discount: computedDiscount.toString() }));
    }
  };

  // Call the server Gemini API endpoint to parse promotional text
  const handleAiParsing = async () => {
    if (!aiText.trim()) {
      setAiError("Por favor, cole um texto promocional da Shopee para poder analisar.");
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const response = await fetch("/api/parse-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        const item = result.data;

        // Populate the form fields with parsed content
        setFormData({
          title: item.title || "",
          description: item.description || "",
          priceOriginal: item.priceOriginal ? item.priceOriginal.toString() : "",
          pricePromo: item.pricePromo ? item.pricePromo.toString() : "",
          discount: item.discount ? item.discount.toString() : "",
          category: item.category || "casa-cozinha",
          shopeeUrl: item.shopeeUrl || "",
          imageUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)], // Random beautiful image
          rating: "4.8",
          salesCount: (Math.floor(Math.random() * 800) + 120).toString(),
          couponCode: item.couponCode || "",
          isHot: item.discount > 50,
        });

        setAiSuccessMessage(
          "✨ Anúncio analisado com sucesso! Os campos foram preenchidos abaixo.",
        );
      } else {
        throw new Error(result.error || result.message || "Não foi possível estruturar o anúncio.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(
        err.message || "Erro desconhecido ao tentar analisar a oferta com inteligência artificial.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit product creation/update
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.pricePromo) {
      alert("Por favor, preencha o Título e o Preço Promocional!");
      return;
    }

    const priceOrig = parseFloat(formData.priceOriginal) || parseFloat(formData.pricePromo) * 1.5;
    const pricePr = parseFloat(formData.pricePromo);
    const disc =
      parseInt(formData.discount) || Math.round(((priceOrig - pricePr) / priceOrig) * 100);

    const dealPayload: ProductDeal = {
      id: editingId || Date.now().toString(),
      title: formData.title,
      description: formData.description || "Produto incrível com desconto especial na Shopee!",
      priceOriginal: priceOrig,
      pricePromo: pricePr,
      discount: disc,
      category: formData.category,
      shopeeUrl: formData.shopeeUrl || "https://shopee.com.br",
      imageUrl: formData.imageUrl || sampleImages[Math.floor(Math.random() * sampleImages.length)],
      rating: parseFloat(formData.rating) || 4.8,
      salesCount: parseInt(formData.salesCount) || 120,
      couponCode: formData.couponCode || undefined,
      isHot: formData.isHot,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      onUpdateDeal(dealPayload);
      alert("Oferta editada com sucesso!");
    } else {
      onAddDeal(dealPayload);
      alert("Parabéns! Nova oferta adicionada ao catálogo.");
    }

    resetForm();
    setActiveTab("list"); // Switch to deal table search list to inspect
  };

  // Trigger editing values
  const startEditing = (deal: ProductDeal) => {
    setEditingId(deal.id);
    setFormData({
      title: deal.title,
      description: deal.description,
      priceOriginal: deal.priceOriginal.toString(),
      pricePromo: deal.pricePromo.toString(),
      discount: deal.discount.toString(),
      category: deal.category,
      shopeeUrl: deal.shopeeUrl,
      imageUrl: deal.imageUrl,
      rating: deal.rating.toString(),
      salesCount: deal.salesCount.toString(),
      couponCode: deal.couponCode || "",
      isHot: !!deal.isHot,
    });
    setActiveTab("add");
  };

  // Handle generalized settings submit
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(settingsFormData);
    alert("Configurações do canal de afiliado atualizadas com sucesso!");
  };

  // Export all deals as JSON file
  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify({ settings, deals }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "achadinhos-shopee-backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import deals from custom JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.deals && Array.isArray(parsed.deals)) {
            parsed.deals.forEach((d: ProductDeal) => onAddDeal(d));
            if (parsed.settings) {
              onSaveSettings(parsed.settings);
              setSettingsFormData(parsed.settings);
            }
            alert(`Sucesso! Foram importados seus achadinhos com sucesso.`);
          } else {
            alert(
              "Estrutura de arquivo inválida. Certifique-se de que é um JSON exportado por este aplicativo.",
            );
          }
        } catch (err) {
          alert("Erro catastrófico ao ler arquivo JSON.");
        }
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      id="creator-panel"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="w-full max-w-2xl bg-gray-50 h-full flex flex-col shadow-2xl relative"
      >
        {/* Header bar of admin block */}
        <div className="bg-orange-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/15 p-2 rounded-xl">
              <Settings className="w-5 h-5 text-orange-200 fill-orange-200/20" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-1.5 leading-none">
                Área do Criador de Conteúdo
              </h2>
              <span className="text-orange-200 text-xs mt-0.5 block font-semibold leading-none">
                Gerencie os Links e Cupons do seu Canal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white bg-orange-700/60 hover:bg-orange-700 hover:text-white border-0 transition-colors cursor-pointer w-8 h-8 rounded-full flex items-center justify-center font-bold"
            id="close-creator-panel"
          >
            ✕
          </button>
        </div>

        {/* Floating Subheader Category Switcher tabs */}
        <div className="bg-white border-b border-gray-200 flex items-center px-4 shrink-0 shadow-xs">
          <button
            onClick={() => {
              setActiveTab("add");
              resetForm();
            }}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "add"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-500"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? "Editar Oferta" : "Criar Achadinho"}</span>
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "list"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-500"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Ver Seus Links ({deals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-500"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Canal</span>
          </button>
        </div>

        {/* Scrollable Container Body */}
        <div className="flex-grow overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* TAB 1: ADD / EDIT PRODUCT */}
            {activeTab === "add" && (
              <motion.div
                key="add-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* GEMINI AI ASSISTANT PARSING COMPONENT - STYLED AMAZINGLY */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200/60 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2.5 text-zinc-800">
                    <Sparkles className="w-5 h-5 text-orange-500 fill-orange-200 animate-pulse" />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-800">
                      Preenchimento Inteligente com Inteligência Artificial (Gemini)
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed mb-4">
                    Cole o texto bruto da promoção (do WhatsApp, Telegram ou Instagram) no campo
                    abaixo. A IA do Gemini irá ler o preço, título, link de afiliado, cupom e
                    categoria automaticamente para você!
                  </p>

                  <div className="space-y-3">
                    <textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="Ex: 🔥 ACHADINHO DA SHOPEE! Fone Bluetooth do Tik Tok de 99,90 por Apenas 44,90 no PIX! Use o cupom FONEFREE no link https://shope.ee/4VCxH8p91A"
                      rows={3}
                      className="w-full bg-white text-gray-800 border border-orange-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-orange-400 focus:outline-none placeholder-gray-400"
                    />

                    {aiError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border border-red-200 animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {aiSuccessMessage && (
                      <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{aiSuccessMessage}</span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAiParsing}
                        disabled={isAiLoading}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                        id="parse-with-ai-btn"
                      >
                        {isAiLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Processando anúncio...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5 text-orange-200" />
                            <span>Analisar e Preencher com IA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* MAIN PRODUCT FORM */}
                <form
                  onSubmit={handleProductSubmit}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
                >
                  <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2 mb-3">
                    {editingId ? "📝 Editar Dados do Produto" : "🛒 Cadastrar Produto Manual"}
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Título do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Fone de Ouvido Bluetooth TWS JBL..."
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Breve Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Diga por que as pessoas devem comprar este item (principais vantagens e benefícios)..."
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Grid for prices and discount */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Preço Original (De)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceOriginal}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, priceOriginal: e.target.value }))
                        }
                        onBlur={handlePriceBlur}
                        placeholder="Ex: 99.90"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Preço Promo (Por) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pricePromo}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, pricePromo: e.target.value }))
                        }
                        onBlur={handlePriceBlur}
                        placeholder="Ex: 44.90"
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Desconto (%)
                      </label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, discount: e.target.value }))
                        }
                        placeholder="Ex: 55"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Grid for link, image cover and categories */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, category: e.target.value }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none font-bold"
                      >
                        {categories
                          .filter((c) => c.id !== "todos")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Cupom de Desconto
                      </label>
                      <input
                        type="text"
                        value={formData.couponCode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, couponCode: e.target.value }))
                        }
                        placeholder="Ex: 20SHOPEE"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none uppercase font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Link de Afiliado Shopee (shope.ee) *
                    </label>
                    <input
                      type="url"
                      value={formData.shopeeUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, shopeeUrl: e.target.value }))
                      }
                      placeholder="Ex: https://shope.ee/8pKmD2i91G"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none font-semibold text-blue-600"
                    />
                  </div>

                  {/* Image input and previews */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Imagens de Capa (URL ou Upload de Arquivo)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                        }
                        placeholder="Cole o link ou envie um arquivo"
                        className="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                      <label className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 hover:border-orange-300 px-3.5 py-3 rounded-xl cursor-pointer text-xs font-bold flex items-center justify-center shrink-0 transition-all select-none">
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 8 * 1024 * 1024) {
                              alert("A imagem deve ter no máximo 8MB!");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setFormData((prev) => ({ ...prev, imageUrl: String(reader.result) }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {formData.imageUrl && (
                        <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 flex items-center justify-center">
                          <img
                            src={formData.imageUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {/* Quick suggestion images */}
                    <div className="mt-2 text-[10px] text-gray-400 font-semibold mb-1">
                      Ou escolha uma capa genérica em destaque:
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                      {sampleImages.map((link, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: link }))}
                          className={`w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-transform ${
                            formData.imageUrl === link
                              ? "border-orange-500 scale-95"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={link}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&q=80";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hot Deal state */}
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-gray-700 block">
                        Destaque "Super Recomendado"
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Ativa um selo animado quente sobre o item para aumentar cliques.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isHot}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isHot: e.target.checked }))
                      }
                      className="w-4.5 h-4.5 accent-orange-500 rounded-sm cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-xs cursor-pointer"
                      >
                        Cancelar Edição
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      id="submit-product-btn"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingId ? "Salvar Edições" : "Colocar Oferta no Ar"}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 2: MANAGE AND LIST ALL DEALS */}
            {activeTab === "list" && (
              <motion.div
                key="list-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h3 className="font-extrabold text-sm text-gray-800">
                      📋 Links no Catálogo ({deals.length})
                    </h3>

                    <button
                      onClick={handleExportJson}
                      className="bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Lista</span>
                    </button>
                  </div>

                  {/* Bulk backup upload */}
                  <div className="bg-orange-50/50 p-3 rounded-xl border border-dashed border-orange-200 flex items-center justify-between text-xs text-gray-600 mb-4">
                    <span className="font-semibold text-orange-850">
                      Tem um backup? Restaure sua lista:
                    </span>
                    <label className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 select-none">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJson}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {deals.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <HelpCircle className="w-12 h-12 stroke-1 mx-auto mb-2.5 text-gray-300" />
                      <p className="text-sm font-semibold">Nenhum achadinho cadastrado.</p>
                      <p className="text-xs mt-1">Crie um link de oferta na aba ao lado!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                      {deals.map((deal) => {
                        const productCat = categories.find((c) => c.id === deal.category);
                        return (
                          <div
                            key={deal.id}
                            className="py-3.5 flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <img
                                  src={deal.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-800 text-xs lines-clamp-1 truncate select-all">
                                  {deal.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                  <span className="font-semibold text-orange-600">
                                    R$ {deal.pricePromo.toFixed(2)}
                                  </span>
                                  <span>•</span>
                                  <span>{productCat?.name || "Geral"}</span>
                                  {deal.couponCode && (
                                    <>
                                      <span>•</span>
                                      <span className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-gray-500 uppercase">
                                        {deal.couponCode}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => startEditing(deal)}
                                className="p-1.5 bg-gray-100 hover:bg-orange-100 text-gray-500 hover:text-orange-600 rounded-md transition-colors border-0 cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm("Tem certeza que quer remover esta oferta permanente?")
                                  ) {
                                    onDeleteDeal(deal.id);
                                  }
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-md transition-colors border-0 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: SOCIAL GROUPS AND HEADER CONFIG */}
            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form
                  onSubmit={handleSettingsSubmit}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4"
                >
                  <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2 mb-3">
                    📢 Customizar Links Sociais & Cabeçalho
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Título do Seu Portal
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.title}
                      onChange={(e) =>
                        setSettingsFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                      placeholder="Ex: Achadinhos da Michely"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Subtítulo / Descrição
                    </label>
                    <textarea
                      value={settingsFormData.subtitle}
                      onChange={(e) =>
                        setSettingsFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      required
                      placeholder="Ex: Promoções exclusivas encontradas todos os dias para economizar!"
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Letreiro Luminoso (Banner)
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.bannerText}
                      onChange={(e) =>
                        setSettingsFormData((prev) => ({ ...prev, bannerText: e.target.value }))
                      }
                      placeholder="Ex: ENTRE NO GRUPO VIP DO TELEGRAM E VEJA AS NOVIDADES RAPIDAMENTE!"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-orange-500 mb-3">
                      Links dos Canais de Afiliado
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Grupo do WhatsApp
                        </label>
                        <input
                          type="url"
                          value={settingsFormData.whatsappLink}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              whatsappLink: e.target.value,
                            }))
                          }
                          placeholder="Ex: https://chat.whatsapp.com/Gxxxxx"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Canal do Telegram
                        </label>
                        <input
                          type="url"
                          value={settingsFormData.telegramLink}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              telegramLink: e.target.value,
                            }))
                          }
                          placeholder="Ex: https://t.me/seu_canal"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          Instagram do Canal
                        </label>
                        <input
                          type="url"
                          value={settingsFormData.instagramLink}
                          onChange={(e) =>
                            setSettingsFormData((prev) => ({
                              ...prev,
                              instagramLink: e.target.value,
                            }))
                          }
                          placeholder="Ex: https://instagram.com/seu_insta"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer pt-3 mt-4"
                    id="save-settings-btn"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
