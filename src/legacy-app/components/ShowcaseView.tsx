// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  X, 
  Plus, 
  Minus, 
  Clock, 
  Share2, 
  ExternalLink, 
  Award, 
  Truck, 
  Layers, 
  HelpCircle,
  Filter,
  Check,
  Building,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { CatalogItem } from '../types';

interface ShowcaseViewProps {
  workspaceCode: string;
  firebaseUrl: string;
  onBackToAdmin?: () => void;
}

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({ 
  workspaceCode, 
  firebaseUrl, 
  onBackToAdmin 
}) => {
  const [loading, setLoading] = useState(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  
  // Showcase state
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [brandConfig, setBrandConfig] = useState({
    name: 'Ateliê 3D Premium',
    theme: '#0A0D0B',
    bgMain: '#050706',
    bgCard: '#121614',
    borderColor: '#232B27',
    colorPrimary: '#52b788',
    colorPrimaryLight: '#74c69d',
    colorAccent: '#fb8500',
    colorText: '#f8fafc',
    colorMuted: '#8b9a90',
    textAccent: '#52b788',
    catalogWhatsapp: '',
    customLogo: ''
  });

  // Client states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [cart, setCart] = useState<Array<{
    item: CatalogItem;
    quantity: number;
    chosenColor: string;
    customNote: string;
  }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Customizations for currently selected product detailed modal
  const [chosenColor, setChosenColor] = useState('Preto Fosco (Original)');
  const [customNote, setCustomNote] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  // Client checkout details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [successOrder, setSuccessOrder] = useState(false);

  // Available filament preview colors for clients to choose
  const availableColors = [
    { name: 'Preto Fosco (Original)', hex: '#1C1C1C' },
    { name: 'Branco Neve', hex: '#F5F5FA' },
    { name: 'Cinza Espacial', hex: '#707A7A' },
    { name: 'Ouro Seda', hex: '#D4AF37' },
    { name: 'Vermelho Ruby', hex: '#D6222E' },
    { name: 'Azul Celeste', hex: '#2A82E4' },
    { name: 'Verde Esmeralda', hex: '#1C9246' },
    { name: 'Cobre Metálico', hex: '#B87333' }
  ];

  useEffect(() => {
    const fetchShowcaseData = async () => {
      setLoading(true);
      try {
        let formattedUrl = firebaseUrl.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }
        if (!formattedUrl.endsWith('/')) {
          formattedUrl += '/';
        }

        const targetUrl = `${formattedUrl}workspaces/${workspaceCode}.json`;
        const res = await fetch(targetUrl);
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Erro 403 (Acesso Negado) do Google. Para habilitar seu site: Acesse o Console Firebase > Realtime Database > aba Regras, e modifique a regra ".read" para "true". Isso permitirá que seus clientes leiam seu Catálogo!');
          }
          throw new Error(`Erro HTTP ${res.status} ao comunicar com o servidor.`);
        }

        const data = await res.json();
        if (data) {
          if (data.catalogItems && Array.isArray(data.catalogItems)) {
            setCatalogItems(data.catalogItems);
          } else {
            // Load backup if present
            setCatalogItems(JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]'));
          }

          if (data.brandConfig) {
            const rawBrand = data.brandConfig;
            
            // Generate palette from custom active theme choices or fallback to standard professional green elegant palette
            setBrandConfig({
              name: rawBrand.name || 'Ateliê 3D Premium',
              theme: rawBrand.theme || '#0A0D0B',
              bgMain: rawBrand.bgMain || '#0A0D0B',
              bgCard: rawBrand.bgCard || '#151917',
              borderColor: rawBrand.borderColor || '#232B27',
              colorPrimary: rawBrand.colorPrimary || '#52b788',
              colorPrimaryLight: rawBrand.colorPrimaryLight || '#74c69d',
              colorAccent: rawBrand.colorAccent || '#fb8500',
              colorText: rawBrand.colorText || '#f8fafc',
              colorMuted: rawBrand.colorMuted || '#8b9a90',
              textAccent: rawBrand.textAccent || '#52b788',
              catalogWhatsapp: rawBrand.catalogWhatsapp || localStorage.getItem('bambuzau_catalog_whatsapp') || '',
              customLogo: rawBrand.customLogo || ''
            });
          }
        } else {
          // If workspace doesn't exist yet, populate with beautiful placeholders
          setCatalogItems(JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]'));
        }
      } catch (err: any) {
        console.error("Error loading showcase info directly", err);
        setErrorHeader(err.message || "Carregado em modo Offline local. Algumas atualizações de estoque remoto podem requerer conexão.");
        // Fallback to local storage or standard sample catalog
        setCatalogItems(JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]'));
      } finally {
        setLoading(false);
      }
    };

    fetchShowcaseData();
  }, [workspaceCode, firebaseUrl]);

  // Filters catalog items
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMaterial = selectedMaterial === 'ALL' || item.filamentType === selectedMaterial;
    return matchesSearch && matchesMaterial;
  });

  const addToCart = () => {
    if (!selectedProduct) return;
    
    // Check if item already exists in cart with same customize colors and names
    const existingIndex = cart.findIndex(c => 
      c.item.id === selectedProduct.id && 
      c.chosenColor === chosenColor
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += modalQuantity;
      newCart[existingIndex].customNote += customNote ? ` | ${customNote}` : '';
      setCart(newCart);
    } else {
      setCart(prev => [...prev, {
        item: selectedProduct,
        quantity: modalQuantity,
        chosenColor,
        customNote
      }]);
    }

    // Close and reset modal
    setSelectedProduct(null);
    setChosenColor('Preto Fosco (Original)');
    setCustomNote('');
    setModalQuantity(1);
    setIsCartOpen(true); // Open cart immediately to show addition feedback
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateCartQuantity = (index: number, val: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + val;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const totalCartPrice = cart.reduce((acc, c) => acc + (c.item.defaultPrice * c.quantity), 0);

  const handlePublishOrderWhatsApp = () => {
    if (cart.length === 0) return;
    if (!clientName.trim()) {
      alert("Por favor, preencha o seu Nome Completo para identificarmos sua encomenda!");
      return;
    }

    // Use customized whatsapp number or default preset seller placeholder if not customized
    let waPhone = brandConfig.catalogWhatsapp || localStorage.getItem('bambuzau_catalog_whatsapp') || '5541999999999';
    waPhone = waPhone.replace(/\D/g, ''); // strip spaces, brackets, pluses
    if (!waPhone.startsWith('55') && waPhone.length === 11) {
      waPhone = '55' + waPhone;
    }

    // Generate beautiful receipt markdown
    let msg = `*🛒 NOVO PEDIDO - ${brandConfig.name.toUpperCase()}*\n`;
    msg += `--------------------------------------------------\n`;
    msg += `*DADOS DO CLIENTE:*\n`;
    msg += `👤 *Nome:* ${clientName.trim()}\n`;
    if (clientPhone) msg += `📞 *Telefone:* ${clientPhone.trim()}\n`;
    if (clientAddress) msg += `📍 *Endereço/Entrega:* ${clientAddress.trim()}\n`;
    msg += `--------------------------------------------------\n`;
    msg += `*ITENS ENCOMENDADOS:*\n\n`;

    cart.forEach((c, index) => {
      msg += `*${index + 1}x ${c.item.name}*\n`;
      msg += `  • Opção: *${c.chosenColor}* (${c.item.filamentType})\n`;
      if (c.customNote) msg += `  • Nota de Customização: _"${c.customNote}"_\n`;
      msg += `  • Preço Unitário: R$ ${c.item.defaultPrice.toFixed(2).replace('.', ',')}\n`;
      msg += `  • Item Total: *R$ ${(c.item.defaultPrice * c.quantity).toFixed(2).replace('.', ',')}*\n\n`;
    });

    msg += `--------------------------------------------------\n`;
    msg += `💰 *VALOR TOTAL DO PEDIDO: R$ ${totalCartPrice.toFixed(2).replace('.', ',')}*\n`;
    msg += `--------------------------------------------------\n`;
    msg += `Aguardando a confirmação da taxa de entrega, prazo e dados de pagamento via Pix! 🚀🎨`;

    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodedText}`;
    
    // Simulates dynamic checkout success feedback
    setSuccessOrder(true);
    setCart([]);
    setIsCartOpen(false);

    // Redirect client directly to seller WhatsApp!
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050706] text-white flex flex-col items-center justify-center p-6 text-center select-none" id="showcase-loading-screen">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-[#52b788]/20 border-t-[#52b788] animate-spin"></div>
          <Cpu className="h-6 w-6 text-[#52b788] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h2 className="mt-5 text-lg font-black tracking-tight text-[#f8fafc]">Carregando o Ateliê Digital...</h2>
        <p className="mt-2 text-xs text-[#8b9a90] max-w-xs leading-relaxed font-mono">Sincronizando produtos em tempo real com o banco de dados principal do ateliê...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans antialiased text-[#f8fafc]" 
      style={{ 
        backgroundColor: brandConfig.bgMain,
        color: brandConfig.colorText,
        '--brand-primary': brandConfig.colorPrimary,
        '--brand-primary-light': brandConfig.colorPrimaryLight,
        '--brand-card-bg': brandConfig.bgCard,
        '--brand-border': brandConfig.borderColor,
        '--brand-muted': brandConfig.colorMuted
      } as React.CSSProperties}
      id="showcase-storefront-wrapper"
    >
      {/* Top Banner indicating local fallback or developer menu */}
      {onBackToAdmin && (
        <div className="bg-amber-550 bg-opacity-95 text-black font-semibold text-[10.5px] py-1.5 px-4 flex items-center justify-between gap-4 font-mono">
          <span className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            Você está visualizando a prévia do seu Site de Vendas.
          </span>
          <button 
            onClick={onBackToAdmin}
            className="px-2.5 py-0.5 bg-black text-amber-400 hover:text-white rounded text-[10px] font-bold cursor-pointer transition select-none"
          >
            ← Voltar para Painel
          </button>
        </div>
      )}

      {errorHeader && (
        <div className="bg-[#121614] border-b border-amber-500/20 text-amber-400 text-[10px] py-1 text-center font-mono">
          🚨 {errorHeader}
        </div>
      )}

      {/* Hero Welcome Header & Custom Branding */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b" style={{ borderColor: brandConfig.borderColor }}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {brandConfig.customLogo ? (
              <img 
                src={brandConfig.customLogo} 
                alt="Logo do Ateliê" 
                className="h-10 w-10 rounded-xl object-contain border border-[#232B27] shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-black shadow-lg"
                style={{ backgroundColor: brandConfig.colorPrimary }}
              >
                3D
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm md:text-base font-black tracking-tight text-[#f8fafc]">{brandConfig.name}</h1>
                <span className="text-[8px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-bold">Oficial</span>
              </div>
              <p className="text-[10px] text-[#8b9a90] font-mono leading-none mt-0.5">Catálogo de Produtos em Impressão 3D Premium</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Shopping Cart Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-2 bg-[#232B27]/40 hover:bg-[#232B27]/80 rounded-xl border border-[#232B27] flex items-center gap-2 text-xs font-black text-[#f8fafc] transition select-none cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5" style={{ color: brandConfig.colorPrimary }} />
              <span className="hidden sm:inline">Minha Sacola</span>
              {cart.length > 0 && (
                <span 
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[9.5px] font-black animate-pulse"
                  style={{ backgroundColor: brandConfig.colorPrimary, color: '#000' }}
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center border" style={{ backgroundColor: brandConfig.bgCard, borderColor: brandConfig.borderColor }}>
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#52b788]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative space-y-2.5 max-w-xl">
            <span className="text-[9px] font-black font-mono uppercase text-[#52b788] px-2.5 py-0.5 bg-[#52b788]/10 rounded-full border border-[#52b788]/20 inline-block">
              🚀 EXCLUSIVIDADES COM COMERCIALIZAÇÃO DIRECTA
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">Escolha, personalize a cor e encomende via WhatsApp!</h2>
            <p className="text-xs text-[#8b9a90] leading-relaxed">
              Todos os modelos produzidos no nosso Ateliê utilizam maquinário CoreXY de última geração e filamentos premium biodegradáveis. Escolha sua cor ideal e envie o carrinho para calcularmos seu prazo de entrega imediatamente!
            </p>
          </div>

          {/* Core values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-[#232B27]/40 font-mono text-[10.5px] text-[#8b9a90]">
            <div className="flex items-center gap-2.5">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Qualidade de Camada Industrial</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Filamento Biodegradável PLA / PETG</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-amber-400" />
              <span>Entrega e Envio c/ Garantia</span>
            </div>
          </div>
        </div>

        {/* Search, Filter menu */}
        <div className="flex flex-col sm:flex-row gap-3.5 sm:items-center sm:justify-between border-b border-[#232B27]/40 pb-5">
          <div className="flex flex-wrap gap-1.5 items-center">
            <button 
              onClick={() => setSelectedMaterial('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition select-none cursor-pointer flex items-center gap-1.5 border ${
                selectedMaterial === 'ALL' 
                  ? 'text-black font-extrabold shadow-sm' 
                  : 'text-[#8b9a90] hover:text-white hover:bg-white/5 border-transparent'
              }`}
              style={{ backgroundColor: selectedMaterial === 'ALL' ? brandConfig.colorPrimary : 'transparent', borderColor: selectedMaterial === 'ALL' ? brandConfig.colorPrimary : 'transparent' }}
            >
              <Filter className="h-3.5 w-3.5" />
              Todos
            </button>
            {['PLA', 'PETG', 'TPU', 'ABS'].map(mat => (
              <button 
                key={mat}
                onClick={() => setSelectedMaterial(mat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition select-none cursor-pointer border ${
                  selectedMaterial === mat 
                    ? 'text-black font-extrabold shadow-sm' 
                    : 'text-[#8b9a90] hover:text-white border-[#232B27]'
                }`}
                style={{ backgroundColor: selectedMaterial === mat ? brandConfig.colorPrimary : 'transparent', borderColor: selectedMaterial === mat ? brandConfig.colorPrimary : brandConfig.borderColor }}
              >
                {mat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative max-w-sm w-full">
            <input 
              type="text"
              placeholder="Pesquisar produto no catálogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121614] border border-[#232B27] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#52b788] transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b9a90]" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="showcase-catalog-grid">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-3 bg-[#121614] border border-[#232B27]/40 rounded-3xl">
              <span className="text-3xl block">📦</span>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Nenhum Modelo Encontrado</h3>
              <p className="text-xs text-[#8b9a90] max-w-xs mx-auto">Tente alterar sua busca ou filtre por uma categoria diferente de material para ver os itens.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const hasStock = item.stockCount > 0;
              return (
                <div 
                  key={item.id}
                  className="group relative rounded-2xl border bg-[#121614] hover:shadow-[0_0_20px_rgba(82,183,136,0.1)] transition-all overflow-hidden flex flex-col justify-between"
                  style={{ borderColor: brandConfig.borderColor }}
                >
                  {/* Stock tag */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
                    {hasStock ? (
                      <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                        Pronta Entrega ({item.stockCount} unid.)
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                        Sob Encomenda ({item.printTimeHours} hrs prod.)
                      </span>
                    )}
                    <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 bg-zinc-900/80 text-zinc-300 border border-zinc-800 rounded">
                      {item.filamentType}
                    </span>
                  </div>

                  {/* Product visual - standard 3D generated SVGs since no photo upload is present */}
                  <div className="h-44 bg-[#0A0D0B] flex items-center justify-center p-6 relative border-b border-[#232B27]/40">
                    <div className="absolute inset-0 bg-radial-gradient from-[#52b788]/5 to-transparent pointer-events-none"></div>
                    
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="max-h-full max-w-full rounded-lg object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <svg className="h-20 w-20 text-[#52b788]/20 group-hover:text-[#52b788]/40 transition" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                        <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
                        <path d="M50 10 L50 50 L85 30 M50 90 L50 50 L15 70" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-[9px] font-mono text-[#8b9a90] uppercase tracking-wider">{item.productCode || 'N/A-CODE'}</span>
                        <span className="text-[10px] font-mono font-bold text-[#8b9a90]">{item.weightGrams}g</span>
                      </div>
                      <h4 className="text-white font-bold group-hover:text-[#52b788] text-sm leading-snug transition line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-[#8b9a90] line-clamp-2 leading-relaxed h-8">{item.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[#232B27]/40 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono text-[#8b9a90] uppercase">Valor Comercial</span>
                        <div className="text-base font-black text-white">
                          R$ {item.defaultPrice.toFixed(2).replace('.', ',')}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedProduct(item);
                          setModalQuantity(1);
                        }}
                        className="px-3.5 py-1.5 bg-[#52b788]/10 hover:bg-[#52b788] text-[#52b788] hover:text-black font-black text-[10.5px] rounded-xl transition border border-[#52b788]/20 flex items-center gap-1 cursor-pointer select-none"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Encomendar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <footer className="pt-16 border-t border-[#232B27]/30 text-center space-y-3 font-mono text-[10.5px] text-[#8b9a90]">
          <p>© 2026 {brandConfig.name}. Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-1.5">
            <span>Powered by</span>
            <span className="text-[#52b788] font-black">Bambuzau 3D Web Solution 🚀</span>
          </div>
        </footer>
      </main>

      {/* DYNAMIC CART FLOATING DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end" id="shopping-bag-slideover">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setIsCartOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-[#0C0E0D] border-l border-[#232B27] h-full flex flex-col justify-between shadow-2xl animate-slide-left">
            {/* Header */}
            <div className="p-4 border-b border-[#232B27]/80 bg-black/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#52b788]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">Minha Sacola de Encomendas</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-[#8b9a90] hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer select-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-3.5">
                  <span className="text-4xl block">🛒</span>
                  <h4 className="text-sm font-bold text-white font-mono uppercase">Sua Sacola Está Vazia</h4>
                  <p className="text-xs text-[#8b9a90] max-w-xs mx-auto">Adicione produtos do catálogo acima para prosseguir com a customização e pedido.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-1.5 font-bold text-[10.5px] bg-[#232B27] border border-[#3A4A40] text-emerald-400 rounded-lg hover:bg-[#323D37] transition cursor-pointer select-none"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((c, index) => (
                      <div key={index} className="p-3 bg-[#121614] border border-[#232B27]/80 rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-white line-clamp-1">{c.item.name}</h5>
                            <div className="flex flex-wrap items-center gap-1 text-[9.5px] font-mono">
                              <span className="text-amber-400">{c.chosenColor}</span>
                              <span className="text-[#8b9a90]">• {c.item.filamentType}</span>
                            </div>
                            {c.customNote && (
                              <p className="text-[9.5px] text-[#8b9a90] italic line-clamp-1 mt-1">Obs: "{c.customNote}"</p>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(index)}
                            className="text-[#8b9a90] hover:text-red-400 transition cursor-pointer select-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="pt-2 border-t border-[#232B27]/40 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2 py-0.5 font-mono">
                            <button 
                              onClick={() => updateCartQuantity(index, -1)}
                              className="text-xs text-[#8b9a90] hover:text-white px-1 font-black cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs text-white px-1.5 font-bold">{c.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(index, 1)}
                              className="text-xs text-[#8b9a90] hover:text-white px-1 font-black cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold text-white">
                            R$ {(c.item.defaultPrice * c.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Checkout Form */}
                  <div className="p-4 bg-[#121614] border border-[#232B27]/85 rounded-xl space-y-3.5">
                    <div className="border-b border-[#232B27]/40 pb-2">
                      <span className="text-[9px] font-black uppercase text-[#52b788] tracking-wider font-mono block">✍️ DADOS DE RETIRADA / ENTREGA</span>
                      <p className="text-[9.5px] text-[#8b9a90] leading-none mt-0.5 font-mono">Insira abaixo os dados para preencher seu faturamento automático</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black uppercase text-[#8b9a90] font-mono">Nome Completo</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: Alexandre de Souza"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black uppercase text-[#8b9a90] font-mono">Telefone / WhatsApp (Opcional)</label>
                        <input 
                          type="tel" 
                          placeholder="Ex: (41) 99888-7777"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black uppercase text-[#8b9a90] font-mono">Endereço Completo p/ Envio (Opcional)</label>
                        <textarea 
                          placeholder="Rua, número, bairro e CEP ou retirada na oficina"
                          rows={2}
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom total area */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-[#232B27] bg-[#121614] space-y-3.5">
                <div className="space-y-1.5 flex justify-between items-center text-xs text-[#8b9a90]">
                  <span>Subtotal dos itens:</span>
                  <span className="text-sm font-bold text-white">R$ {totalCartPrice.toFixed(2).replace('.', ',')}</span>
                </div>

                <button 
                  onClick={handlePublishOrderWhatsApp}
                  className="w-full py-3 bg-[#52b788] hover:bg-[#40916c] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer select-none shadow-lg"
                >
                  <MessageCircle className="h-4.5 w-4.5 shrink-0" />
                  Enviar Encomenda no WhatsApp
                </button>
                <span className="text-[9px] text-[#8b9a90] block text-center font-mono leading-none">
                  Sua encomenda será enviada formatada diretamente para o WhatsApp do vendedor.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMIZATION & ORDER PLACEMENT DETAILED MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" id="customize-product-dialog">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)}></div>

          <div className="relative w-full max-w-lg bg-[#121614] border border-[#232B27] rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col justify-between">
            {/* Header */}
            <div className="p-4 border-b border-[#232B27]/40 flex items-center justify-between">
              <h4 className="text-xs font-black text-[#52b788] uppercase tracking-wider font-mono">🎁 Encomendar & Customizar Peça</h4>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-[#8b9a90] hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
              <div className="flex gap-4 items-start">
                {/* Micro visual placeholder */}
                <div className="h-20 w-20 shrink-0 rounded-xl bg-black border border-[#232B27] flex items-center justify-center p-2">
                  <Layers className="h-10 w-10 text-[#52b788]/40" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase bg-[#232B27] text-zinc-300 px-2 py-0.5 rounded">
                    Código: {selectedProduct.productCode || 'COMERCIAL-3D'}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-xs text-[#8b9a90] leading-relaxed">{selectedProduct.description}</p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-[#232B27] rounded-xl font-mono text-[9.5px]">
                <div className="space-y-0.5">
                  <span className="text-[#8b9a90] block uppercase">Material</span>
                  <strong className="text-white font-bold block text-[10.5px] uppercase">{selectedProduct.filamentType}</strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#8b9a90] block uppercase">Peso Estimado</span>
                  <strong className="text-white font-bold block text-[10.5px]">{selectedProduct.weightGrams}g</strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[#8b9a90] block uppercase">Tempo de Prod.</span>
                  <strong className="text-white font-bold block text-[10.5px]">{selectedProduct.printTimeHours} horas</strong>
                </div>
              </div>

              {/* Color choices picker */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-[#8b9a90] font-mono">Escolha a cor de fabricação:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableColors.map((color, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => setChosenColor(color.name)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2.5 transition select-none cursor-pointer ${
                        chosenColor === color.name 
                          ? 'border-[#52b788] bg-[#52b788]/5 bg-opacity-40' 
                          : 'border-[#232B27] bg-[#0C0E0D]'
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: color.hex }}></span>
                      <span className="text-[10px] text-zinc-200 truncate">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10.5px] uppercase font-bold text-[#8b9a90] font-mono">Deseja gravar nome ou adicionar notas?</label>
                <input 
                  type="text"
                  placeholder="Ex: Gravar nome 'Felipe' no verso da peça..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              {/* Quantity and Checkout Trigger */}
              <div className="pt-3 border-t border-[#232B27]/40 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#8b9a90] uppercase block">Quantidade</span>
                  <div className="flex items-center gap-1.5 bg-[#0C0E0D] border border-[#232B27] rounded-xl px-3 py-1 font-mono">
                    <button 
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="text-sm text-[#8b9a90] hover:text-white px-1 font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm text-white px-2 font-bold">{modalQuantity}</span>
                    <button 
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      className="text-sm text-[#8b9a90] hover:text-white px-1 font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-mono text-[#8b9a90] uppercase block">Valor Final</span>
                  <strong className="text-base text-white block">
                    R$ {(selectedProduct.defaultPrice * modalQuantity).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              </div>
            </div>

            {/* Checkout Action footer */}
            <div className="p-4 border-t border-[#232B27]/40 bg-black/20 flex gap-2">
              <button 
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2 rounded-xl text-xs bg-[#232B27] hover:bg-[#323D37] border border-[#3A4A40] text-zinc-300 font-bold transition cursor-pointer select-none"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={addToCart}
                className="flex-[2] py-2 rounded-xl text-xs text-black font-extrabold uppercase bg-[#52b788] hover:bg-[#40916c] transition flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <ShoppingBag className="h-4 w-4" />
                Adicionar À Sacola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS ORDER OVERLAY DIALOG */}
      {successOrder && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4" id="success-order-dialog">
          <div className="max-w-md w-full bg-[#121614] border border-[#232B27] rounded-3xl p-6 text-center space-y-4 animate-fade-in shadow-2xl">
            <div className="h-16 w-16 bg-[#52b788]/20 border border-[#52b788]/30 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black tracking-tight text-white uppercase font-mono">Encomenda Pronta!</h3>
              <p className="text-xs text-[#8b9a90] leading-relaxed">
                Nós geramos sua fatura de pedido e direcionamos você para o WhatsApp do Ateliê. Se seu WhatsApp não abrir em uma nova janela automaticamente, clique no botão de emergência abaixo para reenviar:
              </p>
            </div>

            <button 
              onClick={() => setSuccessOrder(false)}
              className="w-full py-2.5 bg-[#232B27] hover:bg-[#323D37] border border-[#3A4A40] text-[#52b788] text-xs font-bold rounded-xl transition cursor-pointer select-none"
            >
              Voltar ao Catálogo do Site
            </button>
          </div>
        </div>
      )}
    </div>
  );
};