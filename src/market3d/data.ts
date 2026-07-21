import { Category, SellerReport } from "./types";
import { getGeneratedProductsForCategory } from "./productsPresetData";

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "todos",
    name: "Todos os Segmentos",
    iconName: "LayoutGrid",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1615840287214-e9a5800a6e30?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "suportes_parede",
    name: "Suportes de Parede",
    iconName: "Wrench",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1540200049848-d9813ea0e120?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "organizadores_gavetas",
    name: "Organizadores & Gavetas",
    iconName: "FolderOpen",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "decoracao_casa",
    name: "Decoração para Casa",
    iconName: "Home",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "porta_objetos_suporte_mesa",
    name: "Porta Objetos & Suporte de Mesa",
    iconName: "Monitor",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "brinquedos_fidget",
    name: "Brinquedos & Fidget",
    iconName: "Smile",
    color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "acessorios_pets",
    name: "Acessórios para Pets",
    iconName: "Dog",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "acessorios_aquario",
    name: "Acessórios para Aquário",
    iconName: "Fish",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "jardim_plantas",
    name: "Jardim & Plantas",
    iconName: "Leaf",
    color: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "organizacao_cozinha",
    name: "Organização de Cozinha",
    iconName: "Flame",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "games_geek",
    name: "Games & Geek",
    iconName: "Gamepad2",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "chaveiros_personalizados",
    name: "Chaveiros Personalizados",
    iconName: "Key",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "paineis_led_luminaria",
    name: "Painéis LED & Luminárias",
    iconName: "Lightbulb",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-550/20",
    imageUrl:
      "https://images.unsplash.com/photo-1507646227500-4d389b0012be?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "moda_acessorios",
    name: "Moda & Acessórios",
    iconName: "Shirt",
    color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "organizacao_escritorio",
    name: "Organização de Escritório",
    iconName: "Briefcase",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "acessorios_carro",
    name: "Acessórios para Carro",
    iconName: "Car",
    color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "instrumentos_musica",
    name: "Instrumentos & Música",
    iconName: "Music",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "miniaturas_rpg",
    name: "Miniaturas & RPG",
    iconName: "Sword",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "esportes_academia",
    name: "Esportes & Academia",
    iconName: "Dumbbell",
    color: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "ferramentas_uso_geral",
    name: "Ferramentas & Uso Geral",
    iconName: "Hammer",
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "produtos_infantis",
    name: "Produtos Infantis",
    iconName: "Baby",
    color: "bg-pink-450/10 text-pink-400 border-pink-450/20",
    imageUrl:
      "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "flores_arte_decorativa",
    name: "Flores & Arte Decorativa",
    iconName: "Flower",
    color: "bg-amber-450/10 text-amber-400 border-amber-450/20",
    imageUrl:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "cosplay_fantasia",
    name: "Cosplay & Fantasias",
    iconName: "Sparkles",
    color: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "cases_eletronica",
    name: "Cases & Eletrônica",
    iconName: "Cpu",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    imageUrl:
      "https://images.unsplash.com/photo-1608564697071-ddf911d81370?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "presentes_personalizados",
    name: "Presentes Personalizados",
    iconName: "Gift",
    color: "bg-emerald-450/10 text-emerald-400 border-emerald-450/20",
    imageUrl:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "datas_comemorativas",
    name: "Datas Comemorativas",
    iconName: "Calendar",
    color: "bg-red-400/10 text-red-300 border-red-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "copos_utilidades_mesa",
    name: "Copos & Utilidades de Mesa",
    iconName: "CupSoda",
    color: "bg-teal-400/10 text-teal-300 border-teal-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "suportes_oficina",
    name: "Suportes para Oficina",
    iconName: "Settings",
    color: "bg-slate-400/10 text-slate-300 border-slate-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615ad?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "acessorios_celular",
    name: "Acessórios para Celular",
    iconName: "Smartphone",
    color: "bg-blue-400/10 text-blue-300 border-blue-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "organizadores_cabos",
    name: "Organizadores de Cabos",
    iconName: "Cable",
    color: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=350&q=80",
  },
  {
    id: "esculturas_colecionáveis",
    name: "Esculturas & Colecionáveis",
    iconName: "Gem",
    color: "bg-yellow-450/10 text-yellow-400 border-yellow-450/20",
    imageUrl:
      "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=350&q=80",
  },
];

// Flat-mapped fully structured dynamic dataset providing exactly 100 products per active category
export const ALL_PRODUCTS: SellerReport[] = INITIAL_CATEGORIES.filter(
  (cat) => cat.id !== "todos",
).flatMap((cat) => getGeneratedProductsForCategory(cat.id));

export const INITIAL_PRESETS: { [key: string]: SellerReport } = {
  suporte_controle_wall: ALL_PRODUCTS[0] || ({} as any),
  vaso_espiral_moderno: ALL_PRODUCTS.find((p) => p.categoryId === "decoracao_casa") || ({} as any),
  dragao_articulado: ALL_PRODUCTS.find((p) => p.categoryId === "brinquedos_fidget") || ({} as any),
};
