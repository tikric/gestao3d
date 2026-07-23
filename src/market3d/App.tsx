import { useState, useEffect, useRef, useMemo } from "react";
import { INITIAL_CATEGORIES, ALL_PRODUCTS } from "./data";
import { Category, SellerReport } from "./types";
import {
  Search,
  Sparkles,
  Filter,
  Grid,
  RefreshCcw,
  TrendingUp,
  Award,
  ArrowUpRight,
  Check,
  Copy,
  Info,
  Calculator,
  BookOpen,
  Flame,
  Printer,
  X,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Database,
  ShoppingBag,
  Eye,
  Image as ImageIcon,
  ArrowUp,
  Play,
  Layers,
  BadgePercent,
  Activity,
  CheckCircle2,
  TrendingDown,
  HelpCircle,
  Wrench,
  FolderOpen,
  Home,
  Monitor,
  Smile,
  Dog,
  Fish,
  Leaf,
  Gamepad2,
  Key,
  Lightbulb,
  Shirt,
  Briefcase,
  Car,
  Music,
  Sword,
  Dumbbell,
  Hammer,
  Baby,
  Flower,
  Clock,
  LayoutGrid,
  Cpu,
  Gift,
  Calendar,
  CupSoda,
  Settings,
  Smartphone,
  Cable,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Kanban,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PriceConfidence } from "@/components/PriceConfidence";
import { searchImage } from "./lib/searchImage";
import {
  loadProductImages,
  loadQueryImages,
  persistProductImage,
  persistQueryImage,
} from "./lib/imageCache";
import { AiRecommendation, Kpi, SectionTitle } from "@/legacy-app/components/DashboardShell";

export function getProductForSelectedPlatform(
  p: SellerReport,
  platform: "shopee" | "mercadolivre" | "amazon",
  dynamicProductsList?: SellerReport[],
): SellerReport {
  if (!p) return p;

  // Find absolute original if exists, to prevent nested double-multiplication
  const original =
    ALL_PRODUCTS.find((orig) => orig.id === p.id) ||
    (dynamicProductsList && dynamicProductsList.find((orig) => orig.id === p.id)) ||
    p;

  // Determine platform-specific multipliers for price, sales, and keywords to diversify top products and listings
  let priceMultiplier = 1.0;
  let salesMultiplier = 1.0;
  let competitorsMultiplier = 1.0;
  let link = original.shopeeLink || "";

  const titleHash = original.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  if (platform === "shopee") {
    priceMultiplier = 1.0;
    salesMultiplier = 1.0;
    competitorsMultiplier = 1.0;
    link = `https://shopee.com.br/search?keyword=${encodeURIComponent(original.title)}`;
  } else if (platform === "mercadolivre") {
    // Mercado Livre has higher averages but high competition
    priceMultiplier = 1.18;
    salesMultiplier = 0.85 + (titleHash % 5) * 0.15; // varies from 0.85x to 1.45x
    competitorsMultiplier = 1.4;
    link = `https://lista.mercadolivre.com.br/${encodeURIComponent(original.title)}`;
  } else if (platform === "amazon") {
    // Amazon is highly premium, has fewer, bigger sellers
    priceMultiplier = 1.32;
    salesMultiplier = 0.55 + (titleHash % 4) * 0.15; // varies from 0.55x to 1.0x
    competitorsMultiplier = 0.6;
    link = `https://www.amazon.com.br/s?k=${encodeURIComponent(original.title)}`;
  }

  const pricePromo = parseFloat((original.pricePromo * priceMultiplier).toFixed(2));
  const monthlySales = Math.round(original.monthlySales * salesMultiplier);
  const competitorsCount = Math.round(original.competitorsCount * competitorsMultiplier);
  const priceRange = `R$ ${Math.round(pricePromo * 0.8)} - R$ ${Math.round(pricePromo * 1.35)}`;

  // Recalculate margins based on marketplace fees
  const taxPct = platform === "shopee" ? 18 : platform === "mercadolivre" ? 19 : 15;
  const fixedFee = platform === "shopee" ? 4 : platform === "mercadolivre" ? 6 : 2;
  const commValue = pricePromo * (taxPct / 100) + fixedFee;
  const packaging = 3.0;
  const totalProductionCost = original.materialCost + original.filamentGrams * 0.02 + packaging; // estimated production cost
  const rawMargin = Math.round(((pricePromo - totalProductionCost - commValue) / pricePromo) * 100);
  const estimatedMargin = Math.min(88, Math.max(1, rawMargin));

  let rank = original.rank || "";
  if (platform === "mercadolivre") {
    rank = rank.replace("Shopee", "Mercado Livre").replace("#", "ML ");
  } else if (platform === "amazon") {
    rank = rank.replace("Shopee", "Amazon").replace("#", "AMZ ");
  }

  // Adjust history data sales
  const historyData = original.historyData
    ? original.historyData.map((h) => ({
        month: h.month,
        sales: Math.round(h.sales * salesMultiplier),
      }))
    : [];

  // Adjust listing SEO tags
  let listingSEO = original.listingSEO || "";
  if (platform !== "shopee") {
    listingSEO = listingSEO
      .replace(/shopee/gi, platform === "mercadolivre" ? "Mercado Livre" : "Amazon")
      .replace(/Shopee/gi, platform === "mercadolivre" ? "Mercado Livre" : "Amazon");
  }

  return {
    ...original,
    imageUrl: p.imageUrl || original.imageUrl,
    rank,
    pricePromo,
    priceRange,
    monthlySales,
    estimatedMargin,
    competitorsCount,
    shopeeLink: link,
    historyData,
    listingSEO,
    dailySalesEst: Math.max(1, Math.round(monthlySales / 30)),
  };
}

export default function App() {
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("suportes_parede");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<"shopee" | "mercadolivre" | "amazon">(
    "shopee",
  );

  // Dynamic API Keys configuration
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState<boolean>(false);
  const [customKeys, setCustomKeys] = useState<{
    GEMINI_API_KEY: string;
    TAVILY_API_KEY: string;
    GROQ_API_KEY: string;
    JINA_API_KEY: string;
    SERPAPI_KEY: string;
  }>(() => {
    const safeGet = (k: string): string => {
      try {
        if (typeof window === "undefined") return "";
        const v = window.localStorage.getItem(k);
        if (v) return v;
      } catch {}
      try {
        return (window as any).__market3d_keys?.[k] || "";
      } catch {}
      return "";
    };
    return {
      GEMINI_API_KEY: safeGet("GEMINI_API_KEY"),
      TAVILY_API_KEY: safeGet("TAVILY_API_KEY"),
      GROQ_API_KEY: safeGet("GROQ_API_KEY"),
      JINA_API_KEY: safeGet("JINA_API_KEY"),
      SERPAPI_KEY: safeGet("SERPAPI_KEY"),
    };
  });

  const [serverKeysStatus, setServerKeysStatus] = useState<{
    GEMINI_API_KEY: boolean;
    TAVILY_API_KEY: boolean;
    GROQ_API_KEY: boolean;
    JINA_API_KEY: boolean;
    SERPAPI_KEY: boolean;
  }>({
    GEMINI_API_KEY: false,
    TAVILY_API_KEY: false,
    GROQ_API_KEY: false,
    JINA_API_KEY: false,
    SERPAPI_KEY: false,
  });

  // Dynamic products scanned in real-time
  const [dynamicProducts, setDynamicProducts] = useState<SellerReport[]>([]);
  const [isTrackingRealtime, setIsTrackingRealtime] = useState<boolean>(false);

  // Sync server key status upon startup
  useEffect(() => {
    fetch("/api/keys-status")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setServerKeysStatus(data);
        }
      })
      .catch((err) => console.error("Erro ao verificar chaves:", err));
  }, []);

  // Active selected report/study in the workspace
  const initialReport =
    ALL_PRODUCTS.find((p) => p.categoryId === "suportes_parede") || ALL_PRODUCTS[0];
  const [rawReport, setReport] = useState<SellerReport>(initialReport);
  const report = getProductForSelectedPlatform(rawReport, selectedPlatform, dynamicProducts);

  // Unified detail modal open trigger for both desktop and mobile
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Tab state inside detail workspace
  const [activeTab, setActiveTab] = useState<"stats" | "calc" | "tips">("stats");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  // Copied state holders
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedSEO, setCopiedSEO] = useState<boolean>(false);

  // --- Dynamic ROI Calculator ---
  const [calcPeçaGrams, setCalcPeçaGrams] = useState<number>(35);
  const [calcFiloPriceKg, setCalcFiloPriceKg] = useState<number>(95.0);
  const [calcTempoHours, setCalcTempoHours] = useState<number>(2.5);
  const [calcEnergiaKwh, setCalcEnergiaKwh] = useState<number>(0.85);
  const [calcPrinterWatts, setCalcPrinterWatts] = useState<number>(150);
  const [calcDeprecHour, setCalcDeprecHour] = useState<number>(0.5);
  const [calcPricePromo, setCalcPricePromo] = useState<number>(24.9);
  const [calcTaxPct, setCalcTaxPct] = useState<number>(18);
  const [calcFixedTax, setCalcFixedTax] = useState<number>(4.0);
  const [calcEmbalagemPrice, setCalcEmbalagemPrice] = useState<number>(3.0);

  // Custom photo render prompt
  const [pixabayQuery, setPixabayQuery] = useState<string>("");
  const [productImages, setProductImages] = useState<Record<string, string>>(() =>
    loadProductImages(),
  );
  const [brokenImageUrls, setBrokenImageUrls] = useState<Record<string, boolean>>({});

  // ===== Kanban de Ideias (persisted) =====
  type KanbanStatus = "ideia" | "estudo" | "produzir";
  interface KanbanItem {
    id: string;
    title: string;
    imageUrl?: string;
    pricePromo: number;
    categoryId: string;
    status: KanbanStatus;
    addedAt: number;
  }
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("market3d_kanban_ideas");
      return raw ? (JSON.parse(raw) as KanbanItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isKanbanOpen, setIsKanbanOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      window.localStorage.setItem("market3d_kanban_ideas", JSON.stringify(kanbanItems));
    } catch (err) {
      console.warn(err);
    }
  }, [kanbanItems]);

  const isInKanban = (id: string) => kanbanItems.some((k) => k.id === id);
  const toggleKanban = (p: SellerReport, imageUrl?: string) => {
    setKanbanItems((prev) => {
      if (prev.some((k) => k.id === p.id)) return prev.filter((k) => k.id !== p.id);
      return [
        {
          id: p.id,
          title: p.title,
          imageUrl: imageUrl || p.imageUrl,
          pricePromo: p.pricePromo,
          categoryId: p.categoryId,
          status: "ideia",
          addedAt: Date.now(),
        },
        ...prev,
      ];
    });
  };
  const moveKanbanItem = (id: string, dir: -1 | 1) => {
    const order: KanbanStatus[] = ["ideia", "estudo", "produzir"];
    setKanbanItems((prev) =>
      prev.map((k) => {
        if (k.id !== id) return k;
        const idx = order.indexOf(k.status);
        const next = Math.max(0, Math.min(order.length - 1, idx + dir));
        return { ...k, status: order[next] };
      }),
    );
  };
  const removeKanbanItem = (id: string) =>
    setKanbanItems((prev) => prev.filter((k) => k.id !== id));

  // ===== MakerWorld IDs (numeric only, persisted) =====
  const [makerworldIds, setMakerworldIds] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem("market3d_makerworld_ids");
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("market3d_makerworld_ids", JSON.stringify(makerworldIds));
    } catch (err) {
      console.warn(err);
    }
  }, [makerworldIds]);
  const updateMakerworldId = (productId: string, value: string) => {
    const onlyDigits = value.replace(/\D/g, "").slice(0, 12);
    setMakerworldIds((prev) => {
      const next = { ...prev };
      if (onlyDigits) next[productId] = onlyDigits;
      else delete next[productId];
      return next;
    });
  };
  const makerworldUrl = (id: string) => `https://makerworld.com/en/models/${id}`;

  // Auto-sync calculator inputs and prompt when active report changes
  useEffect(() => {
    if (report) {
      setCalcPeçaGrams(report.filamentGrams || 50);
      setCalcTempoHours(report.printHours || 3);
      setCalcPricePromo(report.pricePromo || 35.0);
      setPixabayQuery(report.title.split(" ").slice(0, 3).join(" "));
    }
  }, [report]);

  // Adjust Marketplace Tax percentage based on active platform automatically (but user can change it)
  useEffect(() => {
    if (selectedPlatform === "shopee") {
      setCalcTaxPct(18);
      setCalcFixedTax(4.0);
    } else if (selectedPlatform === "mercadolivre") {
      setCalcTaxPct(19);
      setCalcFixedTax(6.0);
    } else if (selectedPlatform === "amazon") {
      setCalcTaxPct(15);
      setCalcFixedTax(2.0);
    }
  }, [selectedPlatform]);

  // Live recalculations for 3D Print Costs & Profit Margins
  const costFilamento = calcPeçaGrams * (calcFiloPriceKg / 1000);
  const costEnergia = calcTempoHours * (calcPrinterWatts / 1000) * calcEnergiaKwh;
  const costDepreciacao = calcTempoHours * calcDeprecHour;
  const costTotalProducao = costFilamento + costEnergia + costDepreciacao + calcEmbalagemPrice;
  const taxMarketplaceValue = calcPricePromo * (calcTaxPct / 100);
  const lucroLiquidoReal = calcPricePromo - costTotalProducao - taxMarketplaceValue - calcFixedTax;
  const margemLucroRealPct = calcPricePromo > 0 ? (lucroLiquidoReal / calcPricePromo) * 100 : 0;

  // Dynamically map Lucide icons
  const renderIcon = (iconName: string, className: string = "w-4 h-4") => {
    const iconsMap: { [key: string]: any } = {
      LayoutGrid,
      Wrench,
      FolderOpen,
      Home,
      Monitor,
      Smile,
      Dog,
      Fish,
      Leaf,
      Flame,
      Gamepad2,
      Key,
      Lightbulb,
      Shirt,
      Briefcase,
      Car,
      Music,
      Sword,
      Dumbbell,
      Hammer,
      Baby,
      Flower,
      Sparkles,
      Cpu,
      Gift,
      Calendar,
      CupSoda,
      Settings,
      Smartphone,
      Cable,
    };
    const IconComp = iconsMap[iconName] || Grid;
    return <IconComp className={className} />;
  };

  // Helper to extract a friendly product name if a URL is pasted
  const extractProductNameFromUrl = (url: string): string => {
    try {
      if (!url || typeof url !== "string" || !url.trim()) return "";
      const trimmedUrl = url.trim();

      // Check if it's actually a web link
      if (
        !trimmedUrl.toLowerCase().startsWith("http://") &&
        !trimmedUrl.toLowerCase().startsWith("https://")
      ) {
        return trimmedUrl;
      }

      let pathname = "";
      let hostname = "";
      try {
        const urlObj = new URL(trimmedUrl);
        pathname = urlObj.pathname;
        hostname = urlObj.hostname.toLowerCase();
      } catch (err) {
        // Simple manual parsing fallback for malformed URLs
        const withoutProto = trimmedUrl.replace(/^(https?:\/\/)?(www\.)?/, "");
        const slashIdx = withoutProto.indexOf("/");
        if (slashIdx !== -1) {
          hostname = withoutProto.substring(0, slashIdx);
          pathname = withoutProto.substring(slashIdx);
        } else {
          hostname = withoutProto;
        }
      }

      let slug = "";

      if (hostname.includes("shopee")) {
        const segments = pathname.split("/").filter(Boolean);
        // Shopee segments could have names with hyphens
        const candidates = segments.filter((seg) => seg.includes("-") && !seg.match(/^\d+$/));
        if (candidates.length > 0) {
          slug = candidates[candidates.length - 1];
        } else if (segments.length > 0) {
          slug = segments[segments.length - 1];
        }
        // Remove trailing shopee format like -i.12345.67890
        slug = slug.replace(/-i\.\d+\.\d+$/, "");
      } else if (hostname.includes("mercadolivre") || hostname.includes("mercadolibre")) {
        const segments = pathname.split("/").filter(Boolean);
        const candidates = segments.filter((seg) => seg.includes("-"));
        if (candidates.length > 0) {
          let cand = candidates[0];
          // Remove MLB-xxxx- prefix
          cand = cand.replace(/^[A-Z]{3}-\d+-/i, "");
          slug = cand;
        } else if (segments.length > 0) {
          slug = segments[0];
        }
      } else if (hostname.includes("amazon")) {
        const segments = pathname.split("/").filter(Boolean);
        const candidates = segments.filter(
          (seg) => seg.includes("-") && seg !== "dp" && seg !== "gp" && seg !== "product",
        );
        if (candidates.length > 0) {
          slug = candidates[0];
        } else if (segments.length > 0) {
          slug = segments[0];
        }
      } else {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          slug = segments[segments.length - 1];
        }
      }

      if (!slug) {
        const parts = trimmedUrl.split("/").filter(Boolean);
        if (parts.length > 0) {
          slug = parts[parts.length - 1];
        }
      }

      slug = slug.split("?")[0].split("#")[0];

      // Decode URL characters
      let clean = "";
      try {
        clean = decodeURIComponent(slug);
      } catch (_) {
        clean = slug;
      }

      // Format with spaces
      clean = clean.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

      // Remove any trailing file extensions
      clean = clean.replace(/\.(html|php|aspx|jsp|htm)$/i, "");

      // Filter clean descriptive characters (keep PT-BR accent characters)
      clean = clean.replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, "");

      return clean.trim() || trimmedUrl;
    } catch (err) {
      console.error("Error extracting name from URL:", err);
      return url;
    }
  };

  // Perform quick local AI fuzzy matching for user search string
  const handleLiveAnalysis = (queryTerm: string) => {
    if (!queryTerm.trim()) {
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // Extract product term if a URL is pasted
    const processedQuery = extractProductNameFromUrl(queryTerm);

    // Automatically update the search bar to show the parsed terms
    if (processedQuery !== queryTerm) {
      setSearchQuery(processedQuery);
    }

    const queryLower = processedQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length >= 4);

    // Fuzzy search look first under selected category
    let found = ALL_PRODUCTS.find((p) => {
      const matchesCategory = selectedCategoryId === "todos" || p.categoryId === selectedCategoryId;
      if (!matchesCategory) return false;

      const titleLower = p.title.toLowerCase();
      const descLower = p.description.toLowerCase();
      const keywordsLower = p.keywords.map((k) => k.toLowerCase());

      // 1. Direct contains check
      if (titleLower.includes(queryLower) || keywordsLower.some((k) => k.includes(queryLower))) {
        return true;
      }

      // 2. Word overlapping / token intersection fallback (excellent for long URL strings)
      if (queryWords.length > 0) {
        return queryWords.some(
          (word) =>
            titleLower.includes(word) ||
            keywordsLower.some((k) => k.includes(word)) ||
            descLower.includes(word),
        );
      }
      return false;
    });

    // Fallback globally across everything
    if (!found) {
      found = ALL_PRODUCTS.find((p) => {
        const titleLower = p.title.toLowerCase();
        const keywordsLower = p.keywords.map((k) => k.toLowerCase());

        if (titleLower.includes(queryLower) || keywordsLower.some((k) => k.includes(queryLower))) {
          return true;
        }

        if (queryWords.length > 0) {
          return queryWords.some(
            (word) => titleLower.includes(word) || keywordsLower.some((k) => k.includes(word)),
          );
        }
        return false;
      });
    }

    if (found) {
      setReport(found);
      setIsDetailOpen(true);
      setActiveTab("stats");
    } else {
      setErrorMessage(
        `Nenhum modelo específico correspondente localizado para "${processedQuery}". Tente termos comuns como "suporte", "vaso", "cabo" ou "chaveiro".`,
      );
    }
    setIsLoading(false);
  };

  // Perform a 100% real-time AI crawlers search with Groq, Tavily, Jina and Gemini
  const handleRealtimeTrack = async (queryTerm: string) => {
    if (!queryTerm.trim()) {
      setErrorMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // Extract product term if a URL is pasted
    const processedQuery = extractProductNameFromUrl(queryTerm);

    // Automatically update the search bar to show the parsed terms
    if (processedQuery !== queryTerm) {
      setSearchQuery(processedQuery);
    }

    try {
      const activeCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];
      const response = await fetch("/api/search-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId === "todos" ? "suportes_parede" : selectedCategoryId,
          categoryName: activeCat.name,
          query: processedQuery,
          platform: selectedPlatform,
          customKeys: {
            GEMINI_API_KEY: customKeys.GEMINI_API_KEY.trim(),
            TAVILY_API_KEY: customKeys.TAVILY_API_KEY.trim(),
            GROQ_API_KEY: customKeys.GROQ_API_KEY.trim(),
            JINA_API_KEY: customKeys.JINA_API_KEY.trim(),
          },
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success && resData.data) {
        const crawledData = resData.data;
        const newReport: SellerReport = {
          id: `dyn_${Date.now()}`,
          categoryId: selectedCategoryId === "todos" ? "suportes_parede" : selectedCategoryId,
          rank: crawledData.rank || "Premium",
          title: crawledData.title || processedQuery,
          description:
            crawledData.description ||
            "Relatório dinâmico com IA gerado sob demanda em tempo real.",
          priceRange:
            crawledData.priceRange ||
            `R$ ${crawledData.pricePromo || 45} - R$ ${crawledData.pricePromo ? Math.round(crawledData.pricePromo * 1.5) : 90}`,
          pricePromo: crawledData.pricePromo || 45,
          materialCost: crawledData.materialCost || 4.5,
          monthlySales: crawledData.monthlySales || 150,
          estimatedMargin: crawledData.estimatedMargin || 75,
          reviewsRating: crawledData.reviewsRating || 4.8,
          reviewsCount: crawledData.reviewsCount || 45,
          competitorsCount: crawledData.competitorsCount || 5,
          trend: crawledData.trend || "Estável / Crescimento",
          dailySalesEst: crawledData.dailySalesEst || 5,
          printHours: crawledData.printHours || 3.5,
          filamentGrams: crawledData.filamentGrams || 45,
          peakDemand: crawledData.peakDemand || "Finais de semana",
          keywords: crawledData.keywords || [processedQuery, "3d print", "shopee"],
          competitorStores: crawledData.competitorStores || [
            "Impressões 3D Pro",
            "Aura Maker",
            "Mundo PLA",
          ],
          historyData: crawledData.historyData || [
            { month: "Jan", sales: 120 },
            { month: "Fev", sales: 135 },
            { month: "Mar", sales: 150 },
          ],
          shopeeLink:
            crawledData.shopeeLink ||
            `https://shopee.com.br/search?keyword=${encodeURIComponent(processedQuery)}`,
          imageUrl:
            crawledData.imageUrl ||
            `https://loremflickr.com/500/400/3dprint,model?random=${Date.now()}`,
          slicerTips:
            crawledData.slicerTips ||
            "Instruções inteligentes: Reduza velocidade de camada externa para 40mm/s visando acabamento superior, e preenchimento giroscópico 12% para economia de material.",
          finishingTips:
            crawledData.finishingTips ||
            "Pós-processamento recomendado: Spray primer acrílico para eliminar linhas de FDM seguido de uma demão de verniz fosco protetor de raios UV.",
          listingSEO:
            crawledData.listingSEO ||
            `🔥 ${processedQuery} impresso em alta definição PLA premium!\nOrganize e turbine sua produtividade agora!`,
        };

        setDynamicProducts((prev) => [newReport, ...prev]);
        setReport(newReport);
        setIsDetailOpen(true);
        setActiveTab("stats");
      } else {
        setErrorMessage(
          resData.message ||
            resData.error ||
            "Ocorreu um erro ao rastrear. Verifique suas chaves de APIs clicando no botão 'APIs' no topo.",
        );
      }
    } catch (err: any) {
      console.error("Realtime fetch erro:", err);
      setErrorMessage(
        "Erro ao obter dados de varredura real do servidor. Certifique-se de configurar as chaves de API corretas.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, identifier: string, isSEO: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isSEO) {
      setCopiedSEO(true);
      setTimeout(() => setCopiedSEO(false), 2000);
    } else {
      setCopiedTag(identifier);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  // Filter category list with quick-finder
  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (cat) =>
          cat.id !== "todos" && cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()),
      ),
    [categories, categorySearchQuery],
  );

  // Filter products feed by search query and platform popularity
  const filteredProducts = useMemo(() => {
    const normalizeTitle = (t: string) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const queryLower = searchQuery.trim().toLowerCase();
    const seenTitles = new Set<string>();

    return [...dynamicProducts, ...ALL_PRODUCTS]
      .map((p) => getProductForSelectedPlatform(p, selectedPlatform, dynamicProducts))
      .filter((p) => {
        const matchesCategory =
          selectedCategoryId === "todos" || p.categoryId === selectedCategoryId;
        const matchesSearch =
          !queryLower ||
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.keywords.some((k) => k.toLowerCase().includes(queryLower));
        if (!matchesCategory || !matchesSearch) return false;

        const dedupeKey = `${p.categoryId}::${normalizeTitle(p.title)}`;
        if (seenTitles.has(dedupeKey)) return false;
        seenTitles.add(dedupeKey);
        return true;
      })
      .sort((a, b) => b.monthlySales - a.monthlySales);
  }, [dynamicProducts, selectedPlatform, selectedCategoryId, searchQuery]);

  // Category-wide dynamically computed metrics
  const { totalMonthlySales, totalFaturamento, avgMargin, avgCompetitors } = useMemo(() => {
    const totalSales = filteredProducts.reduce((sum, p) => sum + p.monthlySales, 0);
    const totalFat = filteredProducts.reduce((sum, p) => sum + p.monthlySales * p.pricePromo, 0);
    const margin =
      filteredProducts.length > 0
        ? Math.round(
            filteredProducts.reduce((sum, p) => sum + p.estimatedMargin, 0) /
              filteredProducts.length,
          )
        : 0;
    const comps =
      filteredProducts.length > 0
        ? Math.round(
            filteredProducts.reduce((sum, p) => sum + p.competitorsCount, 0) /
              filteredProducts.length,
          )
        : 0;

    return {
      totalMonthlySales: totalSales,
      totalFaturamento: totalFat,
      avgMargin: margin,
      avgCompetitors: comps,
    };
  }, [filteredProducts]);

  const categoryCountsMap = useMemo(() => {
    const totalList = [...dynamicProducts, ...ALL_PRODUCTS];
    const counts: Record<string, number> = { todos: totalList.length };
    for (const p of totalList) {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    }
    return counts;
  }, [dynamicProducts]);

  const getCategoryCount = (catId: string) => categoryCountsMap[catId] || 0;

  const currentCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name || "Todos os Segmentos";

  const isPlaceholderImage = (url?: string) =>
    !url || /loremflickr\.com|placeholder|picsum\.photos/i.test(url);

  const getProductImage = (product: SellerReport) => productImages[product.id] || product.imageUrl;

  useEffect(() => {
    const productsNeedingImages = filteredProducts
      .filter((product) => isPlaceholderImage(getProductImage(product)))
      .slice(0, 12);
    if (productsNeedingImages.length === 0) return;

    let cancelled = false;
    const controller = new AbortController();
    productsNeedingImages.forEach((product) => {
      const query = product.title
        .split(" ")
        .slice(0, 5)
        .join(" ")
        .replace(/[^\w\sÀ-ÿ]/gi, "")
        .trim();
      if (!query) return;
      searchImage(query, undefined, controller.signal).then((imageUrl) => {
        if (!cancelled && imageUrl) {
          persistProductImage(product.id, imageUrl);
          setProductImages((prev) => ({ ...prev, [product.id]: imageUrl }));
        }
      });
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedPlatform, searchQuery, filteredProducts]);

  return (
    <div
      className="text-[#EDF2F7] font-sans selection:bg-[#b7ff00]/30 selection:text-[#f6ffe1] flex flex-col antialiased space-y-4"
      id="intel-applet-root"
    >
      <section className="space-y-4 animate-fade-in">
        <AiRecommendation
          title={`Radar de oportunidade: ${currentCategoryName}`}
          body={`Foram analisados ${filteredProducts.length} modelos com ${totalMonthlySales.toLocaleString("pt-BR")} vendas/mês. Priorize itens com margem acima de 35%, baixa concorrência e imagem forte para transformar pesquisa em fila de produção lucrativa.`}
          savings={`R$ ${(totalFaturamento / 1000).toFixed(0)}k`}
          action="Ver líderes"
          onAction={() => setViewMode("list")}
        />

        <SectionTitle icon={Search} title="Dashboard — Pesquisa de Preços" status="Mercado ativo" />

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi
            icon={Database}
            label="Modelos no nicho"
            value={filteredProducts.length}
            sub={currentCategoryName}
            tone="gold"
          />
          <Kpi
            icon={TrendingUp}
            label="Vendas mensais"
            value={totalMonthlySales.toLocaleString("pt-BR")}
            sub="Demanda estimada"
            tone="lime"
          />
          <Kpi
            icon={Award}
            label="Margem média"
            value={`${avgMargin}%`}
            sub="Potencial líquido"
            tone={avgMargin >= 35 ? "emerald" : "orange"}
          />
          <Kpi
            icon={Activity}
            label="Concorrência"
            value={avgCompetitors.toLocaleString("pt-BR")}
            sub="Anúncios ativos"
            tone="blue"
          />
        </div>

        {/* Tendências de Modelos */}
        {(() => {
          const trending = [...filteredProducts]
            .sort((a, b) => b.monthlySales - a.monthlySales)
            .slice(0, 5);
          if (trending.length === 0) return null;
          const topSales = trending[0]?.monthlySales || 1;
          const marketplaces = ["SHOPEE", "ML", "AMAZON", "SHOPEE", "ML"];
          return (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-2xl shadow-[0_18px_60px_-40px_rgba(16,185,129,0.45)]">
              <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[#b7ff00]/10 blur-3xl" />
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
                    <Flame className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      Tendências de Modelos
                    </h3>
                    <p className="text-[11px] text-slate-400">Crescimento semanal por categoria</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="h-1 w-6 rounded-full bg-emerald-400/70" />
                  <span className="h-1 w-3 rounded-full bg-white/15" />
                </div>
              </div>
              <div className="relative space-y-4">
                {trending.map((p, i) => {
                  const growth = Math.max(8, Math.round((p.monthlySales / topSales) * 42));
                  const pct = Math.max(12, Math.round((p.monthlySales / topSales) * 100));
                  return (
                    <div key={p.id} className="group">
                      <div className="flex items-end justify-between mb-1.5">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">{p.title}</p>
                          <p className="text-[10px] font-bold tracking-[0.22em] text-slate-500 uppercase">
                            {marketplaces[i % marketplaces.length]}
                          </p>
                        </div>
                        <span className="text-[13px] font-black text-emerald-400 tabular-nums shrink-0 ml-3">
                          +{growth}%
                        </span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-400 to-[#b7ff00] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* TRIPLE COLUMN WORKSPACE GRID */}
      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-grow">
        {/* COLUMN 1: SIDEBAR CATEGORY NAVIGATION STATUS (SPAN 3) */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="relative flex flex-col max-h-[78vh] rounded-2xl border border-white/10 bg-white/[0.025] p-3 backdrop-blur-2xl overflow-hidden shadow-[0_18px_60px_-36px_rgba(183,255,0,0.55)]">
            <div className="pointer-events-none absolute -top-28 -left-24 h-56 w-56 rounded-full bg-[#D4A017]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-24 h-56 w-56 rounded-full bg-[#b7ff00]/10 blur-3xl" />
            <div className="relative mb-3 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.28em] text-[#D4A017]">
                  Categorias
                </p>
                <h3 className="text-sm font-black text-white tracking-tight">Núcleos de mercado</h3>
              </div>
              <span className="rounded-lg border border-[#b7ff00]/25 bg-[#b7ff00]/10 px-2 py-1 text-[10px] font-black text-[#b7ff00] tabular-nums">
                {categories.length - 1}
              </span>
            </div>
            {/* List scroll wrapper */}
            <div className="relative flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-2.5 lg:pb-0 lg:overflow-y-auto scrollbar-thin scrollbar-thumb-[#151D2F] flex-grow pr-1">
              {filteredCategories.map((cat, idx) => {
                const isSelected = selectedCategoryId === cat.id;
                const count = getCategoryCount(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSearchQuery("");
                      const match = ALL_PRODUCTS.find((p) => p.categoryId === cat.id);
                      if (match) {
                        setReport(match);
                      }
                    }}
                    style={{ animationDelay: `${idx * 35}ms` }}
                    className={`group relative overflow-hidden flex-shrink-0 lg:w-full flex items-center text-left rounded-xl cursor-pointer h-11 border backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isSelected
                        ? "border-[#b7ff00]/55 bg-gradient-to-r from-[#b7ff00]/18 via-[#D4A017]/8 to-white/[0.03] shadow-[0_12px_32px_-16px_rgba(183,255,0,0.75)]"
                        : "border-white/[0.08] bg-black/25 hover:bg-white/[0.055] hover:border-white/15 hover:-translate-y-[1px]"
                    }`}
                  >
                    {/* Lime active rail */}
                    {isSelected && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-[#b7ff00] to-emerald-400 shadow-[0_0_10px_rgba(183,255,0,0.7)]" />
                    )}

                    <div className="relative z-10 flex items-center justify-between w-full pl-3 pr-2.5 h-full gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`grid place-items-center shrink-0 w-7 h-7 rounded-lg transition-all duration-300 ${
                            isSelected
                              ? "bg-[#b7ff00]/15 text-[#b7ff00] border border-[#b7ff00]/30 shadow-[0_0_12px_-4px_rgba(183,255,0,0.6)]"
                              : "bg-black/40 text-slate-400 border border-white/10 group-hover:text-white group-hover:border-white/20"
                          }`}
                        >
                          {renderIcon(cat.iconName, "w-3.5 h-3.5")}
                        </span>
                        <span
                          className={`truncate text-[12px] tracking-tight transition-colors duration-300 ${
                            isSelected
                              ? "font-bold text-white"
                              : "font-medium text-slate-300 group-hover:text-white"
                          }`}
                        >
                          {cat.name}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold tabular-nums py-0.5 px-1.5 rounded-md shrink-0 transition-all duration-300 ${
                          isSelected
                            ? "bg-[#b7ff00]/20 text-[#b7ff00] border border-[#b7ff00]/30"
                            : "bg-black/40 text-slate-500 border border-white/10 group-hover:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs text-sans">
                  Nenhum nicho com esse nome.
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* COLUMN 2: ACTIVE PRODUCT FEEDS & SEARCH (SPAN 9) */}
        <section className="col-span-12 lg:col-span-9 space-y-4">
          {/* Compact toolbar */}
          <div className="relative space-y-3 shrink-0 rounded-2xl border border-white/10 bg-white/[0.025] p-3 backdrop-blur-2xl overflow-hidden shadow-[0_18px_60px_-40px_rgba(59,130,246,0.45)]">
            <div className="pointer-events-none absolute -top-24 left-1/4 h-48 w-48 rounded-full bg-[#b7ff00]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 right-0 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLiveAnalysis(searchQuery);
                  }}
                  placeholder="Pesquisar por modelo, fatiador ou tags..."
                  className="w-full bg-black/35 hover:bg-black/45 focus:bg-black/50 text-slate-100 placeholder-slate-500 pl-9 pr-8 py-2.5 text-xs rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#b7ff00]/45 focus:border-[#b7ff00]/35 transition-all font-semibold shadow-inner shadow-black/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Marketplace selector */}
              <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/10 shrink-0 backdrop-blur-xl">
                {(["shopee", "mercadolivre", "amazon"] as const).map((plat) => {
                  const active = selectedPlatform === plat;
                  const titles = { shopee: "Shopee", mercadolivre: "M. Livre", amazon: "Amazon" };
                  const colors = {
                    shopee: active
                      ? "bg-[#FF4500] text-white"
                      : "text-slate-400 hover:text-slate-200",
                    mercadolivre: active
                      ? "bg-[#FFE600] text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200",
                    amazon: active
                      ? "bg-[#FF9900] text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200",
                  };
                  return (
                    <button
                      key={plat}
                      onClick={() => setSelectedPlatform(plat)}
                      className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${colors[plat]}`}
                    >
                      {titles[plat]}
                    </button>
                  );
                })}
              </div>
              {/* VIEW MODE TOGGLE */}
              <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/10 shrink-0 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`py-1 px-2.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#b7ff00]/15 text-[#b7ff00] border border-[#b7ff00]/25 shadow-[0_0_18px_rgba(183,255,0,0.12)]"
                      : "text-slate-450 hover:text-slate-300"
                  }`}
                  id="view-mode-list-btn"
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`py-1 px-2.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#b7ff00]/15 text-[#b7ff00] border border-[#b7ff00]/25 shadow-[0_0_18px_rgba(183,255,0,0.12)]"
                      : "text-slate-450 hover:text-slate-300"
                  }`}
                  id="view-mode-table-btn"
                >
                  Métricas
                </button>
              </div>
            </div>

            {/* Quick action Scanner Buttons */}
            <div className="relative grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => handleLiveAnalysis(searchQuery)}
                disabled={isLoading || !searchQuery.trim()}
                className="group relative overflow-hidden w-full bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:from-[#b7ff00]/10 hover:to-[#b7ff00]/[0.02] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 hover:border-[#b7ff00]/40 text-[#e7ffb0] hover:text-[#b7ff00] font-semibold uppercase tracking-[0.14em] text-[10.5px] py-2.5 px-4 rounded-xl shadow-[0_8px_24px_-16px_rgba(183,255,0,0.4)] hover:shadow-[0_12px_30px_-12px_rgba(183,255,0,0.45)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xl"
              >
                <Search className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                <span>Análise de Banco Local</span>
              </button>

              <button
                onClick={() => handleRealtimeTrack(searchQuery)}
                disabled={isLoading || !searchQuery.trim()}
                className="group relative overflow-hidden w-full bg-gradient-to-br from-[#b7ff00] via-[#a8f000] to-[#9ad900] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold uppercase tracking-[0.14em] text-[10.5px] py-2.5 px-4 rounded-xl shadow-[0_10px_28px_-10px_rgba(183,255,0,0.7),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_14px_36px_-10px_rgba(183,255,0,0.85),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                title="Consulte o mercado real na Shopee, Jina, Tavily e Groq em Tempo Real"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
                <Sparkles className="w-3.5 h-3.5 animate-pulse relative" />
                <span className="relative">Rastreamento em Tempo Real</span>
              </button>
            </div>
          </div>

          {/* Matching error */}
          {errorMessage && (
            <div className="bg-red-950/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-xs leading-relaxed font-sans flex gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aviso do Sistema</p>
                <p className="opacity-80 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Scrollable list or spreadsheet table of feeds */}
          {viewMode === "list" ? (
            <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[64vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#151D2F] pr-1 rounded-2xl border border-white/10 bg-white/[0.018] p-3 backdrop-blur-2xl shadow-[0_20px_70px_-48px_rgba(0,0,0,0.9)]">
              <div className="pointer-events-none absolute -top-28 right-16 h-56 w-56 rounded-full bg-[#b7ff00]/8 blur-3xl" />
              {filteredProducts.map((p, idx) => {
                const isSelected = report?.id === p.id;

                // Determine beautiful badges matching user's image
                let badgeText = "Muito Procurado";
                let badgeClasses = "bg-[#0B1E38] text-[#3B82F6] border border-[#2563EB]/25";

                if (p.estimatedMargin < 10) {
                  badgeText = "Margem Baixa";
                  badgeClasses =
                    "bg-[#251012] text-[#EF4444] border border-[#EF4444]/20 animate-pulse";
                } else if (p.estimatedMargin >= 45) {
                  badgeText = "Alta Margem";
                  badgeClasses = "bg-[#0D241C] text-[#10B981] border border-[#10B981]/20";
                } else if (idx % 3 === 1) {
                  badgeText = "Tendência";
                  badgeClasses = "bg-[#2C1810] text-[#FF8E3F] border border-[#FF8E3F]/20";
                }

                const rating =
                  p.reviewsRating || parseFloat((4.5 + ((idx * 3) % 5) * 0.1).toFixed(1));
                const productImageUrl = getProductImage(p);
                const showProductImage = productImageUrl && !brokenImageUrls[productImageUrl];

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setReport(p);
                      setIsDetailOpen(true);
                    }}
                    title={p.title}
                    style={{ animationDelay: `${idx * 24}ms` }}
                    className={`relative aspect-square rounded-xl border cursor-pointer overflow-hidden group animate-fade-in transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.015] hover:z-10 ${
                      isSelected
                        ? p.estimatedMargin < 10
                          ? "border-red-500/60 shadow-[0_18px_42px_-24px_rgba(239,68,68,0.8)]"
                          : "border-[#b7ff00]/60 shadow-[0_18px_42px_-24px_rgba(183,255,0,0.85)]"
                        : p.estimatedMargin < 10
                          ? "border-red-500/30 hover:border-red-500/60"
                          : "border-white/10 hover:border-[#b7ff00]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-white/10 via-transparent to-black/35 opacity-60" />
                    <span className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                    {/* Image (90% area) */}
                    {showProductImage ? (
                      <img
                        src={productImageUrl}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          productImageUrl &&
                          setBrokenImageUrls((prev) => ({ ...prev, [productImageUrl]: true }))
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#05080E] text-slate-700">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    {/* Rank number */}
                    <span
                      className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border shadow-lg ${
                        idx < 3
                          ? "bg-[#D4A017] text-black border-[#f6d05f]/60 shadow-[#D4A017]/30"
                          : "bg-black/70 text-slate-200 border-white/15"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Kanban toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKanban(p, productImageUrl);
                      }}
                      title={isInKanban(p.id) ? "Remover do Kanban" : "Adicionar ao Kanban"}
                      className={`absolute top-1 right-1 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isInKanban(p.id)
                          ? "bg-emerald-500/90 border-emerald-400 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                          : "bg-black/55 border-white/20 text-slate-200 hover:text-[#b7ff00] hover:border-[#b7ff00]/35"
                      }`}
                    >
                      {isInKanban(p.id) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </button>

                    {/* Characteristic badge (top center) */}
                    <span
                      className={`absolute top-1.5 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wide whitespace-nowrap shadow-lg backdrop-blur-xl ${badgeClasses}`}
                    >
                      {badgeText}
                    </span>

                    {/* Bottom overlay: vendas/mês + faixa de preço */}
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-2 py-2 flex items-end justify-between gap-1">
                      <div className="leading-tight min-w-0">
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">
                          Vendas/mês
                        </span>
                        <span className="block text-[11px] font-black text-white font-mono">
                          {p.monthlySales.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="leading-tight text-right min-w-0">
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">
                          Faixa
                        </span>
                        <span
                          className={`block text-[10px] font-extrabold font-mono whitespace-nowrap ${p.estimatedMargin < 10 ? "text-red-400" : "text-[#10B981]"}`}
                        >
                          {p.priceRange ||
                            `R$${(p.pricePromo * 0.8).toFixed(0)}-${(p.pricePromo * 1.3).toFixed(0)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="py-16 text-center text-slate-600 text-xs flex flex-col items-center justify-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-slate-700" />
                  <p className="font-semibold text-slate-500">
                    Nenhum molde correspondente encontrado.
                  </p>
                  <p className="opacity-75">
                    Tente reescrever o termo de busca central ou selecione outra categoria.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.025] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_70px_-48px_rgba(0,0,0,0.9)] max-h-[64vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#151D2F] pr-1 backdrop-blur-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px] font-mono whitespace-nowrap min-w-[500px]">
                  <thead className="bg-[#05080E] text-slate-500 border-b border-[#121826] sticky top-0 z-10 text-[8.2px] uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="py-3 px-2 text-center w-8">Ideia</th>
                      <th className="py-3 px-2 text-center w-8">Ficha</th>
                      <th className="py-3 px-3 font-sans min-w-[200px]">Modelo Impresso</th>
                      <th className="py-3 px-2 text-right w-20">Vendas/Mês</th>
                      <th className="py-3 px-2 text-right w-20">Preço</th>
                      <th className="py-3 px-3 text-center w-20">Margem</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#131926]/40">
                    {filteredProducts.map((p, idx) => {
                      const isSelected = report?.id === p.id;
                      const productImageUrl = getProductImage(p);
                      const showProductImage = productImageUrl && !brokenImageUrls[productImageUrl];
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setReport(p);
                            setIsDetailOpen(true);
                          }}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? p.estimatedMargin < 10
                                ? "bg-red-956/20 text-red-400 font-bold border-l-2 border-l-red-500 hover:bg-red-955/20"
                                : "bg-[#121A2E]/80 text-orange-400 font-bold border-l-2 border-l-orange-500 hover:bg-[#0E1524]"
                              : p.estimatedMargin < 10
                                ? "bg-red-955/5 text-red-300 hover:bg-red-955/10"
                                : "text-slate-300 hover:bg-[#0E1524]"
                          }`}
                        >
                          <td
                            className="py-2.5 px-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleKanban(p, productImageUrl);
                              }}
                              title={
                                isInKanban(p.id) ? "Remover do Kanban" : "Adicionar como Ideia"
                              }
                              className={`w-5 h-5 rounded border inline-flex items-center justify-center transition-all ${
                                isInKanban(p.id)
                                  ? "bg-emerald-500 border-emerald-400 text-white"
                                  : "bg-transparent border-[#1F2B48] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40"
                              }`}
                            >
                              {isInKanban(p.id) ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                          <td
                            className={`py-2.5 px-2 text-center font-bold text-[9px] ${p.estimatedMargin < 10 ? "text-red-400" : "text-slate-500"}`}
                          >
                            #{idx + 1}
                          </td>

                          <td
                            className={`py-2.5 px-3 font-sans font-semibold whitespace-normal break-words min-w-[240px] max-w-[440px] ${p.estimatedMargin < 10 ? "text-red-200" : ""}`}
                            title={p.title}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-[#05080E] border border-[#1F2B48] shrink-0">
                                {showProductImage ? (
                                  <img
                                    src={productImageUrl}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={() =>
                                      productImageUrl &&
                                      setBrokenImageUrls((prev) => ({
                                        ...prev,
                                        [productImageUrl]: true,
                                      }))
                                    }
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <span>{p.title}</span>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 rounded-md border border-[#1F2B48] bg-[#05080E]/80 px-1.5 py-0.5 w-fit"
                                  title="ID numérico do modelo no MakerWorld"
                                >
                                  <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-amber-400/80">
                                    MW
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={makerworldIds[p.id] || ""}
                                    onChange={(e) => updateMakerworldId(p.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="ID"
                                    className="w-16 bg-transparent text-[10px] font-mono text-slate-200 placeholder:text-slate-600 outline-none"
                                  />
                                  {makerworldIds[p.id] && (
                                    <a
                                      href={makerworldUrl(makerworldIds[p.id])}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-amber-400 hover:text-amber-300"
                                      title="Abrir no MakerWorld"
                                    >
                                      <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-slate-100">
                            {p.monthlySales}{" "}
                            <span className="text-[8px] text-slate-550 font-normal">un</span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-450 font-bold font-mono">
                            R$ {p.pricePromo.toFixed(0)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-center font-bold font-mono ${p.estimatedMargin < 10 ? "text-red-400 font-black animate-pulse" : "text-orange-400"}`}
                          >
                            {p.estimatedMargin < 10 ? "⚠️ " : ""}
                            {p.estimatedMargin}%
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-650 text-xs">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertTriangle className="w-8 h-8 text-slate-700" />
                            <p className="font-semibold text-slate-500">
                              Nenhum molde correspondente encontrado.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer
        className="border-t border-[#131926] py-7 text-center bg-[#020408] text-slate-600 text-[11px] font-medium tracking-wide mt-12 px-4"
        id="table-view-footer"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <span className="font-display">3DMaker Sorocaba Intel © 2026</span>
          <div className="flex flex-wrap justify-center gap-4 text-slate-650 font-mono">
            <span>Análise Baseada em 4 Marketplaces de Alta Performance</span>
            <span>·</span>
            <span>Custos Dinâmicos FDM Calculados ao Vivo</span>
          </div>
        </div>
      </footer>

      {/* RESPONSIVE EXPERT ANALYST OVERLAY MODAL */}
      <AnimatePresence>
        {isDetailOpen && report && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
            {/* Dark glass backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
            />

            {/* Centered Modal Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#090D16] border border-[#1b253b]/90 w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-2xl flex flex-col overflow-hidden relative z-10 text-slate-350 shadow-2xl"
            >
              {/* STICKY HEADER */}
              <div className="p-5 md:p-6 pb-4 flex flex-col md:flex-row md:items-start md:justify-between border-b border-[#121927] shrink-0 gap-3 relative">
                <div className="space-y-1 pr-0 md:pr-4 flex-grow min-w-0">
                  <div className="flex items-center gap-2 select-none">
                    <span className="text-[10px] text-[#A78BFA] font-mono tracking-wider font-extrabold uppercase bg-[#9F7AEA]/15 border border-[#9F7AEA]/20 px-2.5 py-0.5 rounded-md">
                      #{report.rank} Baixa Concorrência
                    </span>
                    <span className="text-[10px] text-slate-550 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Original Validado
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-[#EDF2F7] text-lg md:text-xl tracking-tight leading-snug mt-1.5">
                    {report.title}
                  </h3>

                  <p className="text-slate-400 text-xs mt-1 font-light max-w-3xl leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Actions: Shopee direct redirection & Close */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                  {(() => {
                    let platformLabel = "Ver no Shopee";
                    let platformBgColor =
                      "bg-[#FE4500] hover:bg-[#E03D00] text-white shadow-orange-500/10";
                    if (selectedPlatform === "mercadolivre") {
                      platformLabel = "Ver no Mercado Livre";
                      platformBgColor =
                        "bg-[#FFE600] hover:bg-[#E0CE00] text-black shadow-yellow-500/10";
                    } else if (selectedPlatform === "amazon") {
                      platformLabel = "Ver na Amazon";
                      platformBgColor =
                        "bg-[#FF9900] hover:bg-[#DE8500] text-slate-950 shadow-amber-500/10";
                    }

                    return (
                      <a
                        href={
                          report.shopeeLink ||
                          `https://shopee.com.br/search?keyword=${encodeURIComponent(report.title)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className={`${platformBgColor} font-extrabold text-[10.5px] uppercase tracking-wider py-2 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans h-9`}
                      >
                        <span>{platformLabel}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    );
                  })()}

                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="text-slate-400 hover:text-white bg-[#121929] hover:bg-[#1a253c] w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer border border-[#1b253b] transition-all"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* STATS DECK GRID OF 9 CARDS (Includes the new platform commission tax card to resolve user requests) */}
              <div className="px-5 md:px-6 py-4 bg-[#05080E]/70 border-b border-[#121927] shrink-0 select-none">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
                  {/* Card 1: Faixa de Preço */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Faixa de Preço
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-emerald-400 mt-0.5 font-mono">
                      {report.priceRange}
                    </span>
                  </div>

                  {/* Card 2: Custo do Material */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Custo do Material
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-sky-400 mt-0.5 font-mono">
                      R$ {report.materialCost.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {/* Card 3: Taxa de Comissão da Plataforma */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Taxa{" "}
                      {selectedPlatform === "shopee"
                        ? "Shopee"
                        : selectedPlatform === "mercadolivre"
                          ? "M. Livre"
                          : "Amazon"}
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-orange-400 mt-0.5 font-mono">
                      {selectedPlatform === "shopee"
                        ? "18%"
                        : selectedPlatform === "mercadolivre"
                          ? "19%"
                          : "15%"}
                      <span className="text-slate-400 text-[10px] font-medium ml-1">
                        + R${" "}
                        {selectedPlatform === "shopee"
                          ? "4,00"
                          : selectedPlatform === "mercadolivre"
                            ? "6,00"
                            : "2,00"}
                      </span>
                      <span className="text-slate-500 font-normal text-[9px] block">
                        (Total: R${" "}
                        {(
                          report.pricePromo *
                            (selectedPlatform === "shopee"
                              ? 0.18
                              : selectedPlatform === "mercadolivre"
                                ? 0.19
                                : 0.15) +
                          (selectedPlatform === "shopee"
                            ? 4
                            : selectedPlatform === "mercadolivre"
                              ? 6
                              : 2)
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                        )
                      </span>
                    </span>
                  </div>

                  {/* Card 4: Vendas/mês */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Vendas/mês
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-white mt-0.5 font-mono">
                      {report.monthlySales.toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* Card 5: Margem Est. */}
                  <div
                    className={`border rounded-xl p-3 flex flex-col justify-center text-center transition-all ${
                      report.estimatedMargin < 10
                        ? "bg-red-955/20 border-red-500/40 shadow-inner"
                        : "bg-[#121826]/40 border border-[#1e293b]/40"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold tracking-tight uppercase ${report.estimatedMargin < 10 ? "text-red-400" : "text-slate-500"}`}
                    >
                      Margem Est.
                    </span>
                    <span
                      className={`text-sm md:text-base font-extrabold mt-0.5 font-mono flex items-center justify-center gap-1 ${
                        report.estimatedMargin < 10
                          ? "text-red-500 animate-pulse"
                          : "text-emerald-400"
                      }`}
                    >
                      {report.estimatedMargin < 10 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      {report.estimatedMargin}%
                    </span>
                  </div>

                  {/* Card 6: Avaliações */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Avaliações
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-amber-500 mt-0.5 font-mono flex items-center justify-center gap-1">
                      <span>★</span> {report.reviewsRating}{" "}
                      <span className="text-slate-500 font-normal text-[10px]">
                        ({report.reviewsCount})
                      </span>
                    </span>
                  </div>

                  {/* Card 7: Concorrentes */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Concorrentes
                    </span>
                    <span className="text-[12px] md:text-sm font-extrabold text-slate-100 mt-0.5 font-mono flex items-center justify-center gap-1">
                      <span className="text-slate-500">👥</span> {report.competitorsCount}
                    </span>
                  </div>

                  {/* Card 8: Tendência */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Tendência
                    </span>
                    <span className="text-xs md:text-sm font-extrabold text-[#10B981] mt-0.5 font-mono flex items-center justify-center gap-1">
                      <span className="text-[#10B981]">📈</span> {report.trend}
                    </span>
                  </div>

                  {/* Card 9: Vendas/dia (est.) */}
                  <div className="bg-[#121826]/40 border border-[#1e293b]/40 rounded-xl p-3 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-tight uppercase">
                      Vendas/dia (est.)
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-white mt-0.5 font-mono">
                      {report.dailySalesEst}
                    </span>
                  </div>
                </div>
              </div>

              {/* HIGH-FIDELITY SUB NAVIGATION TAB STRIP (Exactly as in the print) */}
              <div className="px-5 md:px-6 border-b border-[#121927] bg-[#05080E]/40 shrink-0 flex gap-6 select-none">
                {(["stats", "calc", "tips"] as const).map((tab) => {
                  const labels = {
                    stats: "Histórico & Stats",
                    calc: "Calculadora",
                    tips: "Dicas de Venda",
                  };
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 pt-3 text-xs font-bold tracking-tight px-1 transition-all relative cursor-pointer border-0 ${
                        active
                          ? "text-orange-500 font-black"
                          : "text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      <span>{labels[tab]}</span>
                      {active && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FE4500] rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE TAB CONTENT WINDOW */}
              <div className="flex-grow overflow-y-auto p-5 md:p-6 bg-[#04060b] scrollbar-thin scrollbar-thumb-[#151D2F]">
                <WorkbenchPanel
                  report={report}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  calcPeçaGrams={calcPeçaGrams}
                  setCalcPeçaGrams={setCalcPeçaGrams}
                  calcFiloPriceKg={calcFiloPriceKg}
                  setCalcFiloPriceKg={setCalcFiloPriceKg}
                  calcTempoHours={calcTempoHours}
                  setCalcTempoHours={setCalcTempoHours}
                  calcPricePromo={calcPricePromo}
                  setCalcPricePromo={setCalcPricePromo}
                  calcTaxPct={calcTaxPct}
                  setCalcTaxPct={setCalcTaxPct}
                  calcFixedTax={calcFixedTax}
                  setCalcFixedTax={setCalcFixedTax}
                  calcPrinterWatts={calcPrinterWatts}
                  calcEnergiaKwh={calcEnergiaKwh}
                  calcDeprecHour={calcDeprecHour}
                  calcEmbalagemPrice={calcEmbalagemPrice}
                  costFilamento={costFilamento}
                  costEnergia={costEnergia}
                  costDepreciacao={costDepreciacao}
                  costTotalProducao={costTotalProducao}
                  taxMarketplaceValue={taxMarketplaceValue}
                  lucroLiquidoReal={lucroLiquidoReal}
                  margemLucroRealPct={margemLucroRealPct}
                  pixabayQuery={pixabayQuery}
                  setPixabayQuery={setPixabayQuery}
                  setReport={setReport}
                  copyToClipboard={copyToClipboard}
                  copiedTag={copiedTag}
                  copiedSEO={copiedSEO}
                  customKeys={customKeys}
                  selectedPlatform={selectedPlatform}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API EXTERNAL CONFIGURATION INTEGRATION DRAWER */}
      <AnimatePresence>
        {isApiSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApiSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090D16] border border-[#1b253b] w-full max-w-lg rounded-2xl overflow-hidden relative z-10 text-slate-350 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-[#121927] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-400" />
                  <h3 className="font-display font-bold text-slate-100 text-sm tracking-wide uppercase">
                    Apis de Inteligência Extrema
                  </h3>
                </div>
                <button
                  onClick={() => setIsApiSettingsOpen(false)}
                  className="text-slate-400 hover:text-white bg-[#121929] hover:bg-[#1a253c] w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border border-[#1b253b] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
                <p className="text-slate-400">
                  Insira abaixo suas credenciais externas de IA e Varredura de Mercado (Groq,
                  Tavily, Jina e Gemini). Elas serão salvas de forma segura no{" "}
                  <strong className="text-orange-400">localStorage do seu navegador</strong> e
                  enviadas para habilitar as varreduras de dados reais.
                </p>

                <div className="space-y-4">
                  {/* GEMINI KEY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">Gemini Key (AI Studio)</label>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          serverKeysStatus.GEMINI_API_KEY
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-[#151324] text-orange-400 border border-orange-500/10"
                        }`}
                      >
                        {serverKeysStatus.GEMINI_API_KEY
                          ? "Servidor Configurado"
                          : "Aguardando Chave"}
                      </span>
                    </div>
                    <input
                      type="password"
                      placeholder={
                        serverKeysStatus.GEMINI_API_KEY
                          ? "●●●●●●●●●● (Usando credencial do sistema)"
                          : "Cole sua chave API Studio..."
                      }
                      value={customKeys.GEMINI_API_KEY}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomKeys((prev) => ({ ...prev, GEMINI_API_KEY: val }));
                      }}
                      className="w-full bg-[#05080E] border border-[#141B2D] px-3 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 font-mono text-xs"
                    />
                  </div>

                  {/* TAVILY KEY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">Tavily Key (Varredura Web)</label>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          serverKeysStatus.TAVILY_API_KEY
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-450"
                        }`}
                      >
                        {serverKeysStatus.TAVILY_API_KEY ? "Servidor Configurado" : "Opcional"}
                      </span>
                    </div>
                    <input
                      type="password"
                      placeholder={
                        serverKeysStatus.TAVILY_API_KEY
                          ? "●●●●●●●●●● (Usando credencial do sistema)"
                          : "Cole sua API key do Tavily..."
                      }
                      value={customKeys.TAVILY_API_KEY}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomKeys((prev) => ({ ...prev, TAVILY_API_KEY: val }));
                      }}
                      className="w-full bg-[#05080E] border border-[#141B2D] px-3 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 font-mono text-xs"
                    />
                  </div>

                  {/* GROQ KEY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">Groq Key (Llama Rápido)</label>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          serverKeysStatus.GROQ_API_KEY
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-450"
                        }`}
                      >
                        {serverKeysStatus.GROQ_API_KEY ? "Servidor Configurado" : "Opcional"}
                      </span>
                    </div>
                    <input
                      type="password"
                      placeholder={
                        serverKeysStatus.GROQ_API_KEY
                          ? "●●●●●●●●●● (Usando credencial do sistema)"
                          : "Cole sua API key do Groq..."
                      }
                      value={customKeys.GROQ_API_KEY}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomKeys((prev) => ({ ...prev, GROQ_API_KEY: val }));
                      }}
                      className="w-full bg-[#05080E] border border-[#141B2D] px-3 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 font-mono text-xs"
                    />
                  </div>

                  {/* JINA KEY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">Jina AI Key (Web Reader)</label>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          serverKeysStatus.JINA_API_KEY
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-450"
                        }`}
                      >
                        {serverKeysStatus.JINA_API_KEY ? "Servidor Configurado" : "Opcional"}
                      </span>
                    </div>
                    <input
                      type="password"
                      placeholder={
                        serverKeysStatus.JINA_API_KEY
                          ? "●●●●●●●●●● (Usando credencial do sistema)"
                          : "Cole sua API key do Jina Reader..."
                      }
                      value={customKeys.JINA_API_KEY}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomKeys((prev) => ({ ...prev, JINA_API_KEY: val }));
                      }}
                      className="w-full bg-[#05080E] border border-[#141B2D] px-3 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 font-mono text-xs"
                    />
                  </div>
                  {/* SERPAPI KEY */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">
                        SerpAPI Key (Google Shopping)
                      </label>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                          serverKeysStatus.SERPAPI_KEY
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-450"
                        }`}
                      >
                        {serverKeysStatus.SERPAPI_KEY ? "Servidor Configurado" : "Opcional"}
                      </span>
                    </div>
                    <input
                      type="password"
                      placeholder={
                        serverKeysStatus.SERPAPI_KEY
                          ? "●●●●●●●●●● (Usando credencial do sistema)"
                          : "Cole sua API key do SerpAPI..."
                      }
                      value={customKeys.SERPAPI_KEY}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomKeys((prev) => ({ ...prev, SERPAPI_KEY: val }));
                      }}
                      className="w-full bg-[#05080E] border border-[#141B2D] px-3 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#121927] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const keys = [
                      "GEMINI_API_KEY",
                      "TAVILY_API_KEY",
                      "GROQ_API_KEY",
                      "JINA_API_KEY",
                      "SERPAPI_KEY",
                    ];
                    for (const k of keys) {
                      try {
                        localStorage.removeItem(k);
                      } catch {}
                      try {
                        if ((window as any).__market3d_keys)
                          delete (window as any).__market3d_keys[k];
                      } catch {}
                    }
                    setCustomKeys({
                      GEMINI_API_KEY: "",
                      TAVILY_API_KEY: "",
                      GROQ_API_KEY: "",
                      JINA_API_KEY: "",
                      SERPAPI_KEY: "",
                    });
                    setIsApiSettingsOpen(false);
                  }}
                  className="bg-[#05080E] hover:bg-[#121929] text-slate-450 hover:text-slate-100 border border-[#141B2D] px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all h-[38px]"
                >
                  Excluir Chaves
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const entries: [string, string][] = [
                      ["GEMINI_API_KEY", customKeys.GEMINI_API_KEY.trim()],
                      ["TAVILY_API_KEY", customKeys.TAVILY_API_KEY.trim()],
                      ["GROQ_API_KEY", customKeys.GROQ_API_KEY.trim()],
                      ["JINA_API_KEY", customKeys.JINA_API_KEY.trim()],
                      ["SERPAPI_KEY", customKeys.SERPAPI_KEY.trim()],
                    ];
                    let lsOk = true;
                    try {
                      if (!(window as any).__market3d_keys) (window as any).__market3d_keys = {};
                    } catch {}
                    for (const [k, v] of entries) {
                      try {
                        localStorage.setItem(k, v);
                      } catch {
                        lsOk = false;
                      }
                      try {
                        (window as any).__market3d_keys[k] = v;
                      } catch {}
                    }
                    // Reflect trimmed values back into state so next open shows what was saved
                    setCustomKeys({
                      GEMINI_API_KEY: entries[0][1],
                      TAVILY_API_KEY: entries[1][1],
                      GROQ_API_KEY: entries[2][1],
                      JINA_API_KEY: entries[3][1],
                      SERPAPI_KEY: entries[4][1],
                    });
                    alert(
                      lsOk
                        ? "✓ Chaves salvas com sucesso!"
                        : "✓ Chaves salvas para esta sessão. O navegador bloqueou o armazenamento permanente — recarregar a página pode limpá-las.",
                    );
                    setIsApiSettingsOpen(false);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-5 py-2 text-xs rounded-xl transition-all shadow-md cursor-pointer h-[38px]"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Floating Kanban Trigger ===== */}
      <button
        onClick={() => setIsKanbanOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-orange-500 to-amber-600 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-orange-500/30 flex items-center gap-2 hover:scale-105 transition-transform"
        title="Kanban de Ideias de Produtos"
      >
        <Kanban className="w-5 h-5" />
        <span className="text-xs font-extrabold uppercase tracking-wider">Ideias</span>
        {kanbanItems.length > 0 && (
          <span className="bg-white text-orange-600 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
            {kanbanItems.length}
          </span>
        )}
      </button>

      {/* ===== Kanban Panel Drawer ===== */}
      <AnimatePresence>
        {isKanbanOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setIsKanbanOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-[720px] lg:w-[920px] z-50 bg-[#070C16] border-l border-[#141A26] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#141A26]">
                <div className="flex items-center gap-2">
                  <Kanban className="w-5 h-5 text-orange-400" />
                  <h2 className="font-display text-sm tracking-[0.1em] uppercase text-slate-100">
                    Kanban de Ideias
                  </h2>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">
                    {kanbanItems.length} produto(s)
                  </span>
                </div>
                <button
                  onClick={() => setIsKanbanOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    { key: "ideia", label: "Ideia", color: "text-sky-400", bar: "bg-sky-500" },
                    {
                      key: "estudo",
                      label: "Em Estudo",
                      color: "text-amber-400",
                      bar: "bg-amber-500",
                    },
                    {
                      key: "produzir",
                      label: "Produzir",
                      color: "text-emerald-400",
                      bar: "bg-emerald-500",
                    },
                  ] as const
                ).map((col) => {
                  const items = kanbanItems.filter((k) => k.status === col.key);
                  return (
                    <div
                      key={col.key}
                      className="bg-[#090D16]/95 border border-[#121826] rounded-xl flex flex-col min-h-[200px]"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-[#121826]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-4 rounded-full ${col.bar}`} />
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${col.color}`}
                          >
                            {col.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{items.length}</span>
                      </div>
                      <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                        {items.length === 0 && (
                          <div className="text-[10px] text-slate-600 text-center py-6 italic">
                            Vazio
                          </div>
                        )}
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-[#05080E] border border-[#1F2B48] rounded-lg p-2 flex gap-2"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-12 h-12 rounded-md object-cover shrink-0"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-[#0E1524] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-slate-200 font-semibold line-clamp-2 leading-snug">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5">
                                R$ {item.pricePromo.toFixed(2)}
                              </p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <button
                                  onClick={() => moveKanbanItem(item.id, -1)}
                                  disabled={col.key === "ideia"}
                                  className="p-1 rounded bg-[#0E1524] text-slate-400 hover:text-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Voltar coluna"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => moveKanbanItem(item.id, 1)}
                                  disabled={col.key === "produzir"}
                                  className="p-1 rounded bg-[#0E1524] text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Avançar coluna"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeKanbanItem(item.id)}
                                  className="p-1 rounded bg-[#0E1524] text-slate-400 hover:text-red-400 ml-auto"
                                  title="Remover"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {kanbanItems.length > 0 && (
                <div className="px-5 py-3 border-t border-[#141A26] flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Salvo automaticamente no navegador
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Limpar todo o Kanban de Ideias?")) setKanbanItems([]);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar tudo
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// WORKBENCH HIGH-FIDELITY SUB COMPONENT
interface WorkbenchProps {
  report: SellerReport;
  activeTab: "stats" | "calc" | "tips";
  setActiveTab: (val: "stats" | "calc" | "tips") => void;
  calcPeçaGrams: number;
  setCalcPeçaGrams: (val: number) => void;
  calcFiloPriceKg: number;
  setCalcFiloPriceKg: (val: number) => void;
  calcTempoHours: number;
  setCalcTempoHours: (val: number) => void;
  calcPricePromo: number;
  setCalcPricePromo: (val: number) => void;
  calcTaxPct: number;
  setCalcTaxPct: (val: number) => void;
  calcFixedTax: number;
  setCalcFixedTax: (val: number) => void;
  calcPrinterWatts: number;
  calcEnergiaKwh: number;
  calcDeprecHour: number;
  calcEmbalagemPrice: number;
  costFilamento: number;
  costEnergia: number;
  costDepreciacao: number;
  costTotalProducao: number;
  taxMarketplaceValue: number;
  lucroLiquidoReal: number;
  margemLucroRealPct: number;
  pixabayQuery: string;
  setPixabayQuery: (val: string) => void;
  setReport: (updateFn: (prev: SellerReport) => SellerReport) => void;
  copyToClipboard: (text: string, identifier: string, isSEO?: boolean) => void;
  copiedTag: string | null;
  copiedSEO: boolean;
  customKeys: {
    GEMINI_API_KEY: string;
    TAVILY_API_KEY: string;
    GROQ_API_KEY: string;
    JINA_API_KEY: string;
    SERPAPI_KEY: string;
  };
  selectedPlatform: "shopee" | "mercadolivre" | "amazon";
}

function WorkbenchPanel({
  report,
  activeTab,
  setActiveTab,
  calcPeçaGrams,
  setCalcPeçaGrams,
  calcFiloPriceKg,
  setCalcFiloPriceKg,
  calcTempoHours,
  setCalcTempoHours,
  calcPricePromo,
  setCalcPricePromo,
  calcTaxPct,
  setCalcTaxPct,
  calcFixedTax,
  setCalcFixedTax,
  calcPrinterWatts,
  calcEnergiaKwh,
  calcDeprecHour,
  calcEmbalagemPrice,
  costFilamento,
  costEnergia,
  costDepreciacao,
  costTotalProducao,
  taxMarketplaceValue,
  lucroLiquidoReal,
  margemLucroRealPct,
  pixabayQuery,
  setPixabayQuery,
  setReport,
  copyToClipboard,
  copiedTag,
  copiedSEO,
  customKeys,
  selectedPlatform,
}: WorkbenchProps) {
  const imageCacheRef = useRef<Record<string, string>>(loadQueryImages());
  const [isSearchingImage, setIsSearchingImage] = useState<boolean>(false);
  const kitCacheRef = useRef<Record<string, any>>({});
  const [kitIdeas, setKitIdeas] = useState<any>(null);
  const [isLoadingKits, setIsLoadingKits] = useState<boolean>(false);
  const [kitError, setKitError] = useState<string>("");

  // Auto trigger kit ideas lookup when switching reports or switching tabs to tips
  useEffect(() => {
    if (!report) return;

    // Clear previous error
    setKitError("");

    // If we already have this in cache, load it immediately
    if (kitCacheRef.current[report.id]) {
      setKitIdeas(kitCacheRef.current[report.id]);
      return;
    }

    // Only load if active tab is 'tips'
    if (activeTab !== "tips") {
      return;
    }

    const fetchKitIdeas = async () => {
      setIsLoadingKits(true);
      setKitError("");
      try {
        const response = await fetch("/api/kit-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: report.title,
            category: report.categoryId,
            description: report.description,
            customKeys: {
              GEMINI_API_KEY: customKeys.GEMINI_API_KEY.trim(),
              TAVILY_API_KEY: customKeys.TAVILY_API_KEY.trim(),
              GROQ_API_KEY: customKeys.GROQ_API_KEY.trim(),
              JINA_API_KEY: customKeys.JINA_API_KEY.trim(),
            },
          }),
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
          kitCacheRef.current[report.id] = resData.data;
          setKitIdeas(resData.data);
        } else {
          setKitError(resData.error || "Não foi possível carregar as ideias de kits.");
        }
      } catch (err) {
        console.error("Erro ao buscar ideias de kits:", err);
        setKitError("Erro ao carregar sugestões de kits da IA.");
      } finally {
        setIsLoadingKits(false);
      }
    };

    fetchKitIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id, activeTab]);

  const isPlaceholderImage = (url?: string) =>
    !url || /loremflickr\.com|placeholder|picsum\.photos/i.test(url);

  // Auto trigger image lookup when switching reports if image is empty or placeholder
  useEffect(() => {
    if (report && isPlaceholderImage(report.imageUrl)) {
      // Clean query search term (first 3-4 words)
      const cleanSearchQuery = report.title
        .split(" ")
        .slice(0, 4)
        .join(" ")
        .replace(/[^\w\s]/gi, "")
        .trim();
      setPixabayQuery(cleanSearchQuery);

      // Check cache first
      if (imageCacheRef.current[cleanSearchQuery]) {
        setReport((prev) => {
          if (prev && prev.id === report.id) {
            return { ...prev, imageUrl: imageCacheRef.current[cleanSearchQuery] };
          }
          return prev;
        });
        return;
      }

      const autoFetchImage = async () => {
        setIsSearchingImage(true);
        try {
          const imageUrl = await searchImage(cleanSearchQuery, customKeys);
          if (imageUrl) {
            // Save to cache
            imageCacheRef.current[cleanSearchQuery] = imageUrl;
            persistQueryImage(cleanSearchQuery, imageUrl);

            setReport((prev) => {
              if (prev && prev.id === report.id) {
                return { ...prev, imageUrl };
              }
              return prev;
            });
          }
        } catch (error) {
          console.error("Auto image search error:", error);
        } finally {
          setIsSearchingImage(false);
        }
      };

      autoFetchImage();
    } else if (report) {
      const cleanSearchQuery = report.title
        .split(" ")
        .slice(0, 4)
        .join(" ")
        .replace(/[^\w\s]/gi, "")
        .trim();
      setPixabayQuery(cleanSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.id, report.imageUrl]);

  const handleManualSearch = async () => {
    if (!pixabayQuery.trim()) return;
    const cleanSearchQuery = pixabayQuery.trim();

    // Check cache first
    if (imageCacheRef.current[cleanSearchQuery]) {
      setReport((prev) => ({ ...prev, imageUrl: imageCacheRef.current[cleanSearchQuery] }));
      return;
    }

    setIsSearchingImage(true);
    try {
      const imageUrl = await searchImage(cleanSearchQuery, customKeys);
      if (imageUrl) {
        imageCacheRef.current[cleanSearchQuery] = imageUrl;
        persistQueryImage(cleanSearchQuery, imageUrl);
        setReport((prev) => ({ ...prev, imageUrl }));
      }
    } catch (error) {
      console.error("Manual image search error:", error);
    } finally {
      setIsSearchingImage(false);
    }
  };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 font-sans h-96">
        <HelpCircle className="w-12 h-12 text-slate-700 animate-bounce mb-3" />
        <p className="font-semibold text-slate-400">Nenhum molde em análise</p>
        <p className="text-xs max-w-sm mt-1.5 leading-relaxed opacity-80">
          Selecione qualquer design ou molde articulado no centro para começar o estudo dinâmico de
          precificação e ROI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TAB 1: HISTÓRICO & STATS */}
      {activeTab === "stats" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Chart block */}
          <div className="bg-[#05080F]/60 rounded-2xl p-5 border border-[#121826] space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-bold uppercase tracking-wider">
              <Activity className="w-4.5 h-4.5 text-orange-500" />
              <span>Histórico de Vendas (6 meses)</span>
            </div>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%" debounce={80}>
                <AreaChart
                  data={report.historyData}
                  margin={{ top: 2, right: 2, left: -32, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorGlowOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FE4500" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FE4500" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#4A5568"
                    fontSize={9}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#4A5568"
                    fontSize={9}
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090D16",
                      borderColor: "#1E283F",
                      borderRadius: "10px",
                    }}
                    labelStyle={{ color: "#A0AEC0", fontWeight: "bold", fontSize: "9px" }}
                    itemStyle={{
                      color: "#FE4500",
                      fontSize: "10.5px",
                      fontFamily: "JetBrains Mono",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#FE4500"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGlowOrange)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PriceConfidence
            term={report.title}
            platform={selectedPlatform}
            referencePrice={report.pricePromo}
          />

          {/* Slicer specs capsules (Two exquisite rounded cards matching the screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Time Capsule */}
            <div className="bg-[#0e1322]/80 border border-[#1e2943]/40 px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Tempo de Impressão
                </span>
                <span className="text-slate-200 text-xs font-mono font-bold">
                  {report.printHours} horas
                </span>
              </div>
            </div>

            {/* Material/Filament Capsule */}
            <div className="bg-[#0e1322]/80 border border-[#1e2943]/40 px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Consumo Estimado
                </span>
                <span className="text-slate-200 text-xs font-mono font-bold">
                  {report.filamentGrams}g de PLA
                </span>
              </div>
            </div>
          </div>

          {/* Peak Demand Alert Frame */}
          <div className="bg-[#0e1322]/60 border border-[#1e2943]/30 px-4 py-4 rounded-xl flex flex-col sm:flex-row sm:items-start gap-2.5 shadow-sm">
            <span className="text-orange-500 shrink-0 font-bold font-mono text-xs flex items-center gap-1.5 uppercase">
              🔥 Pico de Demanda:
            </span>
            <span className="text-slate-300 text-xs leading-relaxed font-sans">
              {report.peakDemand}
            </span>
          </div>

          {/* Keywords tags section */}
          <div className="space-y-2 mt-4">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">
              🏷️ Palavras-Chave para Anunciar (Clique para Copiar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {report.keywords.map((word, idx) => {
                const isCopied = copiedTag === `word-tab-${idx}`;
                return (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(word, `word-tab-${idx}`)}
                    className={`py-1.5 px-3 rounded-lg text-[10.5px] font-mono font-semibold transition-all duration-150 border cursor-pointer ${
                      isCopied
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                        : "bg-[#121826]/40 text-orange-450 border-orange-500/15 hover:border-orange-500/40 hover:bg-orange-500/5"
                    }`}
                  >
                    {word} {isCopied ? "✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Competitor stores tagging section */}
          {(() => {
            const list = Array.isArray(report.competitorStores)
              ? report.competitorStores
              : typeof report.competitorStores === "string" && report.competitorStores
                ? [report.competitorStores]
                : [];
            if (list.length === 0) return null;
            return (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">
                  👥 Principais Concorrentes no Nicho:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((store, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0c101b] border border-slate-800 text-slate-300 text-[10.5px] px-3 py-1.5 rounded-lg font-mono font-bold shadow-sm"
                    >
                      🛒 {store}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: ROI PRICING CALCULATOR */}
      {activeTab === "calc" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5 items-start animate-fadeIn">
          {/* Sliders Input Segment */}
          <div className="lg:col-span-6 space-y-4.5 font-sans">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-[#121826] text-[11px] leading-relaxed text-slate-400 font-mono">
              Ajuste as métricas de fatiador e custos do seu laboratório. Os custos diretos e as
              margens líquidas são recalculados instantaneamente:
            </div>

            {/* Weight range slider */}
            <div className="space-y-2 p-4 rounded-xl bg-[#0e1322]/40 border border-[#1c263d]/40 relative">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black font-mono">
                <span>Peso final da peça</span>
                <span className="text-orange-400 font-extrabold">{calcPeçaGrams}g PLA</span>
              </div>
              <input
                type="range"
                min={2}
                max={1500}
                value={calcPeçaGrams}
                onChange={(e) => setCalcPeçaGrams(Number(e.target.value))}
                className="w-full accent-orange-500 h-1 rounded bg-[#101625]"
              />
              <div className="text-[9.5px] text-slate-500 pt-0.5 flex justify-between font-mono">
                <span>Mín: 2g</span>
                <span>Máx: 1.500g</span>
              </div>
            </div>

            {/* Print duration hours slider */}
            <div className="space-y-2 p-4 rounded-xl bg-[#0e1322]/40 border border-[#1c263d]/40 relative">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black font-mono">
                <span>Duração de Impressão</span>
                <span className="text-orange-400 font-extrabold">{calcTempoHours} horas</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={72}
                step={0.5}
                value={calcTempoHours}
                onChange={(e) => setCalcTempoHours(Number(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-[#101625] rounded"
              />
              <div className="text-[9.5px] text-slate-500 pt-0.5 flex justify-between font-mono">
                <span>Mín: 30 min</span>
                <span>Máx: 3 dias</span>
              </div>
            </div>

            {/* Quad custom inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1 bg-[#090D16] p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Preço Kg Filo
                </span>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono">
                  <span className="text-[9.5px] text-slate-500">R$</span>
                  <input
                    type="number"
                    value={calcFiloPriceKg}
                    onChange={(e) => setCalcFiloPriceKg(Number(e.target.value))}
                    className="w-full bg-slate-950 text-center text-xs font-mono font-bold text-slate-200 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-[#090D16] p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Taxa do Canal %
                </span>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono">
                  <input
                    type="number"
                    value={calcTaxPct}
                    onChange={(e) => setCalcTaxPct(Number(e.target.value))}
                    className="w-full bg-slate-950 text-center text-xs font-mono font-bold text-orange-400 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-[#090D16] p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Taxa Fixa Canal
                </span>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono">
                  <span className="text-[9.5px] text-slate-500">R$</span>
                  <input
                    type="number"
                    value={calcFixedTax}
                    onChange={(e) => setCalcFixedTax(Number(e.target.value))}
                    className="w-full bg-slate-950 text-center text-xs font-mono font-bold text-orange-400 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-[#090D16] p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block font-sans">
                  Preço Promo Venda
                </span>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono">
                  <span className="text-[9.5px] text-slate-500">R$</span>
                  <input
                    type="number"
                    value={calcPricePromo}
                    onChange={(e) => setCalcPricePromo(Number(e.target.value))}
                    className="w-full bg-slate-950 text-center text-xs font-mono font-bold text-emerald-400 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Computed Output Ledger Sheet */}
          <div className="lg:col-span-6 bg-[#0e1322]/30 p-5 rounded-2xl border border-[#1c263d]/40 space-y-4 font-mono">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block font-mono">
              Planilha de Custos Consolidada:
            </span>

            <div className="space-y-2.5 divide-y divide-[#1c263d]/50 font-mono text-xs text-slate-400">
              <div className="flex justify-between py-1">
                <span>Custo PLA ({calcPeçaGrams}g):</span>
                <span className="text-slate-200">R$ {costFilamento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Energia Impressora ({calcPrinterWatts}W):</span>
                <span className="text-slate-200">R$ {costEnergia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Depreciação + Desgaste de Bico:</span>
                <span className="text-slate-200">R$ {costDepreciacao.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-slate-100 border-t border-slate-800">
                <span>CUSTO OPERACIONAL DIRETO:</span>
                <span className="text-orange-400">R$ {costTotalProducao.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2.5 text-slate-400 border-t border-dashed border-slate-800">
                <span>Comissão Canal ({calcTaxPct}%):</span>
                <span className="text-red-400">R$ {taxMarketplaceValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2.5 text-slate-400">
                <span>Taxa Fixa do Canal:</span>
                <span className="text-red-400 font-bold">R$ {calcFixedTax.toFixed(2)}</span>
              </div>
            </div>

            {/* Vibrant ROI box layout with alert triggers */}
            <div
              className={`p-4.5 rounded-xl border text-center mt-3 shadow-inner transition-all duration-200 ${
                margemLucroRealPct < 10
                  ? "bg-red-955/20 border-red-500/40 shadow-red-955/10"
                  : "bg-[#05080f] border-slate-800"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {margemLucroRealPct < 10 && (
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                )}
                <span
                  className={`text-[9px] uppercase tracking-widest block font-bold font-mono ${margemLucroRealPct < 10 ? "text-red-400 font-extrabold" : "text-slate-500"}`}
                >
                  {margemLucroRealPct < 10
                    ? "⚠️ Margem Crítica / Alto Risco"
                    : "Margem Líquida Limpa"}
                </span>
              </div>

              <div
                className={`text-2xl font-bold font-mono mt-1 ${margemLucroRealPct < 10 ? "text-red-500" : "text-emerald-400"}`}
              >
                {margemLucroRealPct.toFixed(1)}%
                <span
                  className={`text-[10px] font-sans font-normal ml-1 px-1.5 py-0.5 rounded ${
                    margemLucroRealPct < 10
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : margemLucroRealPct >= 50
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}
                >
                  {margemLucroRealPct < 10
                    ? "Margem Baixa"
                    : margemLucroRealPct >= 50
                      ? "Margem Excelente"
                      : "Margem Otimizada"}
                </span>
              </div>

              <div className="text-[10px] mt-2 font-sans leading-normal">
                {margemLucroRealPct < 10 ? (
                  <span className="text-red-300">
                    Sua margem de lucro está abaixo dos 10%. Perigo de prejuízo ou lucratividade
                    inviável com{" "}
                    <strong className="text-red-400 font-mono">
                      R$ {lucroLiquidoReal.toFixed(2)}
                    </strong>{" "}
                    de ganho.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Lucro estimado de{" "}
                    <strong className="text-emerald-400 font-mono">
                      R$ {Math.max(0, lucroLiquidoReal).toFixed(2)}
                    </strong>{" "}
                    limpos por unidade vendida.
                  </span>
                )}
              </div>
            </div>

            {/* Custom pricing comparison and alert engine */}
            <div
              className={`p-4 rounded-xl border font-sans text-xs transition-all duration-300 ${
                margemLucroRealPct < 10
                  ? "bg-red-955/35 border-red-500/40 text-red-200"
                  : "bg-[#121927]/30 border-[#1c263d]/40 text-slate-400"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5">
                  {margemLucroRealPct < 10 ? (
                    <AlertTriangle className="w-4.5 h-4.5 text-red-500 animate-bounce" />
                  ) : (
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  )}
                </span>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between font-bold">
                    <span className={margemLucroRealPct < 10 ? "text-red-400" : "text-slate-300"}>
                      {margemLucroRealPct < 10
                        ? "ALERTA DE VIABILIDADE FINANCEIRA"
                        : "Monitoramento de Preço e Viabilidade"}
                    </span>
                    <span
                      className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold ${
                        margemLucroRealPct < 10
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-emerald-500/25 text-emerald-450 border border-emerald-500/35"
                      }`}
                    >
                      {margemLucroRealPct < 10 ? "Crítico < 10%" : "Seguro"}
                    </span>
                  </div>

                  <div className="text-[10px] space-y-1 font-mono leading-relaxed mt-2 pt-1 border-t border-white/[0.04]">
                    <div className="flex justify-between pb-1 text-[#FF8E3F]">
                      <span>Preço de Venda Praticado:</span>
                      <strong>R$ {calcPricePromo.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>Custo de Produção Calculado:</span>
                      <strong>R$ {costTotalProducao.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>Impostos & Comissão ({calcTaxPct}%):</span>
                      <strong className="text-red-400/80">
                        R$ {taxMarketplaceValue.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>Taxa Fixa do Canal:</span>
                      <strong className="text-red-400/80">R$ {calcFixedTax.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-white/[0.04]">
                      <span className="font-sans font-bold">Custo Total Integrado:</span>
                      <strong className="text-slate-200">
                        R$ {(costTotalProducao + taxMarketplaceValue + calcFixedTax).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {margemLucroRealPct < 10 ? (
                    <div className="text-[9.5px] leading-relaxed text-red-350 bg-red-950/30 border border-red-500/15 p-2.5 rounded-lg mt-2 font-sans">
                      ⚠️ <strong>Ação de Recuperação Recomendada:</strong> O preço praticado de{" "}
                      <strong>R$ {calcPricePromo.toFixed(2)}</strong> é insuficiente em relação ao
                      custo de fabricação + comissões de{" "}
                      <strong>
                        R$ {(costTotalProducao + taxMarketplaceValue + calcFixedTax).toFixed(2)}
                      </strong>
                      . Aumente o preço para no mínimo{" "}
                      <strong>
                        R${" "}
                        {(
                          (costTotalProducao + calcFixedTax) /
                          (1 - calcTaxPct / 100 - 0.1)
                        ).toFixed(2)}
                      </strong>{" "}
                      ou diminua o consumo de filamento (atualmente {calcPeçaGrams}g) e tempo de
                      máquina ({calcTempoHours}h) para restabelecer o limite mínimo viável de 10%.
                    </div>
                  ) : (
                    <p className="text-[9.5px] leading-normal text-slate-400 bg-[#05080f] p-2 rounded-lg mt-2 font-sans border border-slate-900">
                      ✅ <strong>Indicadores Verificados:</strong> Seu preço de venda cobre
                      confortavelmente os custos consolidados de produção com uma margem de
                      lucratividade adequada acima do limite mínimo de segurança das operações de
                      mercado (10%).
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DICAS DE VENDA */}
      {activeTab === "tips" && (
        <div className="space-y-5.5 animate-fadeIn">
          {/* Dynamic real photo render seeker block */}
          <div className="bg-[#0e1322]/80 border border-[#1e2943]/50 p-4.5 rounded-xl space-y-3.5 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider font-mono">
                  Protótipo de Produto Real (3D Search Engine)
                </span>
              </div>
              <span className="text-[8.5px] font-mono text-orange-500 animate-pulse font-bold bg-orange-500/10 border border-orange-500/15 px-2 py-0.5 rounded">
                {isSearchingImage ? "BUSCANDO..." : "PRONTO"}
              </span>
            </div>

            {isSearchingImage ? (
              <div className="w-full h-40 rounded-lg border border-dashed border-orange-500/20 bg-slate-950/70 flex flex-col items-center justify-center space-y-2 text-slate-400 text-[10.5px] font-mono">
                <RefreshCcw className="w-5 h-5 text-orange-500 animate-spin" />
                <span>Buscando imagem real do modelo 3D...</span>
              </div>
            ) : report.imageUrl ? (
              <div className="w-full h-40 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 relative group">
                <img
                  src={report.imageUrl}
                  alt="3D model illustration schematic"
                  className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={() =>
                    setReport((prev) =>
                      prev && prev.id === report.id ? { ...prev, imageUrl: "" } : prev,
                    )
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent flex items-end p-3">
                  <span className="text-[9px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                    Visualização Live do Molde FDM
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-40 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-[10.5px] font-sans bg-[#03060c] space-y-1">
                <HelpCircle className="w-5 h-5 text-slate-600" />
                <span>Imagem Ilustrativa não encontrada</span>
                <span className="text-[9.5px] text-slate-550">
                  Escreva o termo e clique em Renderizar
                </span>
              </div>
            )}

            {/* Custom search prompt inputs */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex red skull, box organizer, dragon..."
                className="bg-slate-950 text-xs font-mono text-slate-100 placeholder-slate-600 px-3.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500/40 flex-grow"
                value={pixabayQuery}
                onChange={(e) => setPixabayQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSearch();
                }}
              />
              <button
                onClick={handleManualSearch}
                disabled={isSearchingImage}
                className="bg-[#121A2E] hover:bg-[#1C2844] disabled:bg-[#090E1A] disabled:text-slate-600 text-slate-200 text-xs font-bold px-4 py-1.5 rounded-lg transition-all border border-slate-800 cursor-pointer shrink-0"
              >
                Renderizar
              </button>
            </div>
          </div>

          {/* Slicer Cura parameters with sweet typography */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5 font-mono">
              <Printer className="w-3.5 h-3.5 text-orange-500" />
              <span>Cura & Prusa Slicer Parameters</span>
            </h4>
            <div className="text-[11.5px] text-slate-300 leading-relaxed bg-[#05080F] p-4 rounded-xl border border-[#121826] font-mono whitespace-pre-wrap leading-normal shadow-sm">
              {report.slicerTips}
            </div>
          </div>

          {/* Finishing postprocess guide */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5 font-mono">
              <Wrench className="w-3.5 h-3.5 text-orange-500" />
              <span>Acabamento & Post-finishing</span>
            </h4>
            <div className="text-[11.5px] text-slate-300 leading-relaxed bg-[#05080F] p-4 rounded-xl border border-[#121826] font-sans shadow-sm whitespace-pre-wrap leading-normal">
              {report.finishingTips}
            </div>
          </div>

          {/* Ideias de Kits IA Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800/60 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider font-mono">
                  Ideias de Kits com IA (Cross-Sell / Aumentar Ticket Médio)
                </span>
              </div>

              <button
                onClick={async () => {
                  setIsLoadingKits(true);
                  setKitError("");
                  try {
                    const response = await fetch("/api/kit-ideas", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: report.title,
                        category: report.categoryId,
                        description: report.description,
                      }),
                    });
                    const resData = await response.json();
                    if (resData.success && resData.data) {
                      kitCacheRef.current[report.id] = resData.data;
                      setKitIdeas(resData.data);
                    } else {
                      setKitError(resData.error || "Não foi possível recarregar as ideias.");
                    }
                  } catch (err) {
                    setKitError("Erro ao recarregar sugestões de kits.");
                  } finally {
                    setIsLoadingKits(false);
                  }
                }}
                disabled={isLoadingKits}
                className="text-[9.5px] font-bold font-mono text-slate-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer disabled:text-slate-600"
              >
                <RefreshCcw className={`w-3 h-3 ${isLoadingKits ? "animate-spin" : ""}`} />
                Regerar Sugestões
              </button>
            </div>

            {isLoadingKits ? (
              <div className="bg-[#05080f] p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
                <RefreshCcw className="w-6 h-6 text-orange-400 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-300 font-mono">
                    Analisando sinergia de produtos complementares...
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Aguarde, calculando filamento e combinando kits lucrativos.
                  </p>
                </div>
              </div>
            ) : kitError ? (
              <div className="bg-red-950/20 p-4 rounded-xl border border-red-900/30 text-center space-y-1">
                <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
                <p className="text-xs text-red-400 font-mono">{kitError}</p>
              </div>
            ) : kitIdeas ? (
              <div className="bg-[#0e1322]/40 border border-slate-800/80 p-4.5 rounded-xl space-y-4">
                {/* Kit header card */}
                <div className="border-b border-slate-800/50 pb-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h5 className="text-[12.5px] font-bold text-orange-400 font-mono flex items-center gap-1.5">
                      🎁 {kitIdeas.kitName}
                    </h5>
                    <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Preço do Combo: R$ {Number(kitIdeas.totalSugPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans mt-2 leading-relaxed">
                    {kitIdeas.kitReason}
                  </p>
                </div>

                {/* Suggested items grid */}
                <div className="space-y-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block font-mono">
                    Peças Complementares no Combo:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {kitIdeas.items?.map((item: any, idx: number) => {
                      return (
                        <div
                          key={idx}
                          className="bg-[#05080f] p-3.5 rounded-lg border border-[#172134]/60 space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/40 pb-1.5 gap-2">
                            <span
                              className="text-xs font-bold text-slate-200 font-mono whitespace-normal break-words flex-1"
                              title={item.name}
                            >
                              {idx + 1}. {item.name}
                            </span>
                            <span className="text-[9px] text-orange-400 bg-orange-400/5 px-2 py-0.5 rounded border border-orange-400/10 font-mono font-bold">
                              +{item.weightGrams}g
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-900/15 p-1.5 rounded border border-slate-950">
                            <div>
                              <span className="text-[8.5px] text-slate-500 uppercase block font-mono">
                                Impr. Est.
                              </span>
                              <span className="text-[11px] text-slate-200 hover:text-orange-400 font-bold font-mono transition-colors">
                                {item.printTimeHours}h
                              </span>
                            </div>
                            <div>
                              <span className="text-[8.5px] text-slate-500 uppercase block font-mono">
                                Custo Mat.
                              </span>
                              <span className="text-[11px] text-emerald-400 font-bold font-mono">
                                R$ {Number(item.materialCost).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[8.5px] text-slate-500 uppercase block font-mono">
                                Total Combo
                              </span>
                              <span className="text-[11px] text-slate-200 font-bold font-mono">
                                {item.weightGrams + (report ? report.filamentGrams : 0)}g
                              </span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans italic pt-1 border-t border-dashed border-slate-900/50">
                            💡 {item.synergyFactor}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-emerald-950/15 border border-emerald-500/10 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                  <BadgePercent className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[10.5px] text-slate-300 font-sans">
                    Ao vender o combo completo, você reduz custos de envio e aumenta seu **ticket
                    médio** em até <strong className="text-emerald-400 font-mono">70%</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-slate-500 text-xs">
                Nenhuma sugestão de kit carregada.
              </div>
            )}
          </div>

          {/* Copywriting description generator with clipboard button */}
          <div className="space-y-2 pt-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5 font-mono">
                <Award className="w-3.5 h-3.5 text-orange-500" />
                <span>Copywriting de Alto Impacto para Marketplace (SEO)</span>
              </h4>

              <button
                onClick={() => copyToClipboard(report.listingSEO, "seoModel", true)}
                className={`text-[9.5px] font-bold py-1 px-3 rounded-lg transition-all border shrink-0 cursor-pointer ${
                  copiedSEO
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 font-mono"
                    : "bg-[#121a2e] text-slate-200 border-slate-800 hover:text-orange-400"
                }`}
              >
                {copiedSEO ? "Copiado!" : "Copiar Copy Completo"}
              </button>
            </div>

            <div className="bg-[#05080F] p-4 rounded-xl border border-[#121826] text-xs font-mono text-slate-400 leading-relaxed max-h-44 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
              {report.listingSEO}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
