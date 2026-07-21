import { useState, MouseEvent } from "react";
import { ProductDeal, Category } from "../types";
import { Star, Copy, Check, ExternalLink, Flame, Tag } from "lucide-react";
import { motion } from "motion/react";

interface DealCardProps {
  key?: string;
  deal: ProductDeal;
  category: Category | undefined;
  onEdit?: (deal: ProductDeal) => void;
  onDelete?: (id: string) => void;
  isAdminMode: boolean;
}

export default function DealCard({ deal, category, onEdit, onDelete, isAdminMode }: DealCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoupon = (e: MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow relative flex flex-col h-full group"
      id={`deal-card-${deal.id}`}
    >
      {/* Discount Badge in the corner */}
      <div className="absolute top-3 left-3 z-10 bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
        <Flame className="w-3.5 h-3.5 fill-white" />
        <span>{deal.discount}% OFF</span>
      </div>

      {/* Category Mini-badge in the corner (Right) */}
      {category && (
        <span className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md">
          {category.name}
        </span>
      )}

      {/* Product Image Wrapper */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        <img
          src={deal.imageUrl || "https://picsum.photos/seed/shopee/400/400"}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80";
          }}
        />
        {deal.isHot && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
            <span>🔥 Super Recomendado</span>
          </div>
        )}
      </div>

      {/* Content layout */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Rating and Sales */}
        <div className="flex items-center gap-1.5 mb-1.5 text-xs text-gray-500">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="ml-1 font-bold text-gray-700">{deal.rating.toFixed(1)}</span>
          </div>
          <span>•</span>
          <span>{deal.salesCount}+ vendidos</span>
        </div>

        {/* Product Title */}
        <h3
          className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors mb-2 min-h-[40px]"
          id={`title-${deal.id}`}
        >
          {deal.title}
        </h3>

        {/* Short description */}
        <p className="text-gray-500 text-xs line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed flex-grow">
          {deal.description}
        </p>

        {/* Price Tag Details (Highly resembling Shopee orange style) */}
        <div className="bg-orange-50/60 rounded-xl p-3 mb-3.5 border border-orange-100/50">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
            <span>
              De: <span className="line-through">{formatPrice(deal.priceOriginal)}</span>
            </span>
            <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              Economize {formatPrice(deal.priceOriginal - deal.pricePromo)}
            </span>
          </div>
          <div className="flex items-baseline gap-1 animate-fadeIn">
            <span className="text-orange-600 text-xs font-bold">R$</span>
            <span
              className="text-orange-600 text-2xl font-black tracking-tight"
              id={`price-${deal.id}`}
            >
              {
                deal.pricePromo
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  .split(",")[0]
              }
            </span>
            <span className="text-orange-600 text-sm font-bold">
              ,
              {
                deal.pricePromo
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  .split(",")[1]
              }
            </span>
            <span className="ml-1.5 text-xs text-gray-400 font-normal">no PIX</span>
          </div>
        </div>

        {/* Coupon Code section if present */}
        {deal.couponCode && (
          <div className="mb-3.5">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-orange-500" />
              <span>Cupom de Desconto Disponível</span>
            </div>
            <button
              onClick={(e) => handleCopyCoupon(e, deal.couponCode!)}
              className="w-full border border-dashed border-orange-300 bg-orange-50/30 hover:bg-orange-50 text-orange-600 rounded-lg p-2 text-xs font-mono font-bold flex items-center justify-between transition-colors focus:ring-1 focus:ring-orange-300"
              title="Clique para copiar o cupom"
              id={`coupon-${deal.id}`}
            >
              <span className="tracking-widest">{deal.couponCode}</span>
              {copied ? (
                <span className="text-emerald-600 font-sans flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5" /> Copiado!
                </span>
              ) : (
                <span className="text-gray-400 group-hover:text-orange-600 flex items-center gap-1 font-sans text-[11px] font-normal">
                  <Copy className="w-3 h-3" /> Copiar
                </span>
              )}
            </button>
          </div>
        )}

        {/* Affiliate Main Call to Action Button */}
        <a
          href={deal.shopeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm leading-none py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 hover:shadow-md transition-all active:scale-[0.98]"
          id={`go-shopee-${deal.id}`}
        >
          <span>Ir para a Shopee</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Admin controls showing underneath only if Creator Mode is active */}
        {isAdminMode && (onEdit || onDelete) && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50 -mx-4 -mb-4 p-3 rounded-b-2xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(deal);
              }}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
              id={`edit-btn-${deal.id}`}
            >
              Editar Oferta
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(deal.id);
              }}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
              id={`delete-btn-${deal.id}`}
            >
              Excluir
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
